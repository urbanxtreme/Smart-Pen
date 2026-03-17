from flask import Flask, request, jsonify
from flask_cors import CORS
import cv2
import pytesseract
import requests
import numpy as np
import base64
import json
import uuid
import os
from datetime import datetime

app = Flask(__name__)
CORS(app)

# 🔧 Tesseract path (same as test_ocr.py)
pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'

# 📂 History file
HISTORY_FILE = os.path.join(os.path.dirname(__file__), "history.json")


def load_history():
    """Load history from JSON file."""
    if os.path.exists(HISTORY_FILE):
        with open(HISTORY_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    return []


def save_history(history):
    """Save history to JSON file."""
    with open(HISTORY_FILE, "w", encoding="utf-8") as f:
        json.dump(history, f, ensure_ascii=False, indent=2)


def make_thumbnail(image_data_url, max_width=200):
    """Create a small thumbnail from a base64 data-URL."""
    try:
        if "," in image_data_url:
            header, b64 = image_data_url.split(",", 1)
        else:
            header, b64 = "data:image/jpeg;base64", image_data_url

        img_bytes = base64.b64decode(b64)
        np_arr = np.frombuffer(img_bytes, np.uint8)
        img = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)

        if img is None:
            return image_data_url

        h, w = img.shape[:2]
        if w > max_width:
            scale = max_width / w
            img = cv2.resize(img, (max_width, int(h * scale)))

        _, buf = cv2.imencode(".jpg", img, [cv2.IMWRITE_JPEG_QUALITY, 60])
        thumb_b64 = base64.b64encode(buf).decode("utf-8")
        return f"data:image/jpeg;base64,{thumb_b64}"
    except Exception:
        return image_data_url


def preprocess_image(img):
    """Same preprocessing as AI/test_ocr.py"""
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    gray = cv2.resize(gray, None, fx=2, fy=2, interpolation=cv2.INTER_CUBIC)
    gray = cv2.GaussianBlur(gray, (5, 5), 0)
    _, thresh = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    return thresh


def extract_text_tesseract(processed_img):
    """OCR extraction — same config as AI/test_ocr.py"""
    custom_config = r'--oem 3 --psm 6'
    raw_text = pytesseract.image_to_string(processed_img, config=custom_config)
    return raw_text


def clean_text_with_deepseek(text):
    """DeepSeek correction via Ollama — same as AI/test_ocr.py"""
    prompt = f"""
You are an OCR post-processor. Your ONLY job is to fix characters that were misread by OCR.

STRICT RULES:
- ONLY fix garbled or misrecognized characters (e.g. "rn" misread as "m", "0" misread as "O")
- NEVER change, rephrase, reword, or rewrite any part of the text
- NEVER add words that are not in the original
- NEVER remove words that are in the original
- NEVER fix grammar or restructure sentences
- Keep the EXACT same words in the EXACT same order
- Remove only obvious OCR artifacts like random symbols (€, ¢, |) that clearly don't belong
- Output ONLY the corrected text, no explanations

OCR Text:
{text}

Corrected Text:
"""

    try:
        response = requests.post(
            "http://localhost:11434/api/generate",
            json={
                "model": "deepseek-llm",
                "prompt": prompt,
                "stream": False,
                "options": {
                    "temperature": 0.3,
                    "num_predict": 100
                }
            },
            timeout=60
        )

        data = response.json()

        print("\n🔍 Ollama Raw Response:\n", data)

        if "response" in data:
            return data["response"].strip()
        elif "error" in data:
            return f"❌ Ollama Error: {data['error']}"
        else:
            return "❌ Unexpected response format"

    except Exception as e:
        return f"❌ Request failed: {str(e)}"


# ─────────────────────────────────────────────
# OCR Endpoint
# ─────────────────────────────────────────────

@app.route("/api/ocr", methods=["POST"])
def ocr():
    """Accept base64 image → Tesseract OCR → DeepSeek cleanup → auto-save to history → return text."""
    try:
        data = request.get_json()
        if not data or "image" not in data:
            return jsonify({"error": "No image provided"}), 400

        image_data_url = data["image"]

        # Decode the data-URL
        image_data = image_data_url
        if "," in image_data:
            image_data = image_data.split(",", 1)[1]

        image_bytes = base64.b64decode(image_data)

        # Convert bytes to OpenCV image
        np_arr = np.frombuffer(image_bytes, np.uint8)
        img = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)

        if img is None:
            return jsonify({"error": "Could not decode image"}), 400

        # Step 1: Preprocess
        processed = preprocess_image(img)

        # Step 2: Tesseract OCR
        raw_text = extract_text_tesseract(processed)
        print("\n===== Raw OCR Output =====\n")
        print(raw_text)

        # Step 3: Clean with DeepSeek via Ollama
        clean_input = raw_text.replace("\n", " ")
        cleaned_text = clean_text_with_deepseek(clean_input)
        print("\n===== Cleaned AI Output =====\n")
        print(cleaned_text)

        # Step 4: Auto-save to history
        thumbnail = make_thumbnail(image_data_url)
        entry = {
            "id": str(uuid.uuid4()),
            "timestamp": datetime.now().isoformat(),
            "thumbnail": thumbnail,
            "text": cleaned_text,
            "raw_text": raw_text,
        }

        history = load_history()
        history.insert(0, entry)  # newest first
        save_history(history)

        return jsonify({
            "text": cleaned_text,
            "raw_text": raw_text,
            "historyId": entry["id"],
        })

    except Exception as e:
        print(f"OCR Error: {e}")
        return jsonify({"error": str(e)}), 500


# ─────────────────────────────────────────────
# History Endpoints
# ─────────────────────────────────────────────

@app.route("/api/history", methods=["GET"])
def get_history():
    """Return all past conversions."""
    history = load_history()
    return jsonify(history)


@app.route("/api/history/<entry_id>", methods=["PUT"])
def update_history(entry_id):
    """Update the text of a saved conversion."""
    data = request.get_json()
    if not data or "text" not in data:
        return jsonify({"error": "No text provided"}), 400

    history = load_history()
    for entry in history:
        if entry["id"] == entry_id:
            entry["text"] = data["text"]
            save_history(history)
            return jsonify({"success": True})

    return jsonify({"error": "Entry not found"}), 404


@app.route("/api/history/<entry_id>", methods=["DELETE"])
def delete_history(entry_id):
    """Delete a conversion from history."""
    history = load_history()
    new_history = [e for e in history if e["id"] != entry_id]

    if len(new_history) == len(history):
        return jsonify({"error": "Entry not found"}), 404

    save_history(new_history)
    return jsonify({"success": True})


if __name__ == "__main__":
    port = int(os.getenv("PORT", "5000"))
    print(f"🚀 Smart-Pen backend running on http://localhost:{port}")
    app.run(debug=True, port=port)
