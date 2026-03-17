from flask import Flask, request, jsonify
from flask_cors import CORS
import cv2
import pytesseract
import requests
import numpy as np
import base64
import os

app = Flask(__name__)
CORS(app)

# 🔧 Tesseract path (same as test_ocr.py)
pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'


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
You are an OCR correction system.

Correct the following text completely.

Rules:
- Fix spelling mistakes
- Fix grammar
- Remove strange symbols like €, &, etc.
- Preserve the full sentence
- Do NOT shorten the text
- Do NOT explain anything
- Output ONLY the corrected full text

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


@app.route("/api/ocr", methods=["POST"])
def ocr():
    """Accept base64 image from frontend → Tesseract OCR → DeepSeek cleanup → return text."""
    try:
        data = request.get_json()
        if not data or "image" not in data:
            return jsonify({"error": "No image provided"}), 400

        # Decode the data-URL from the frontend ("data:image/png;base64,iVBOR...")
        image_data = data["image"]
        if "," in image_data:
            image_data = image_data.split(",", 1)[1]

        image_bytes = base64.b64decode(image_data)

        # Convert bytes to OpenCV image (same as cv2.imread but from memory)
        np_arr = np.frombuffer(image_bytes, np.uint8)
        img = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)

        if img is None:
            return jsonify({"error": "Could not decode image"}), 400

        # Step 1: Preprocess (same as test_ocr.py)
        processed = preprocess_image(img)

        # Step 2: Tesseract OCR (same as test_ocr.py)
        raw_text = extract_text_tesseract(processed)
        print("\n===== Raw OCR Output =====\n")
        print(raw_text)

        # Step 3: Clean with DeepSeek via Ollama (same as test_ocr.py)
        clean_input = raw_text.replace("\n", " ")
        cleaned_text = clean_text_with_deepseek(clean_input)
        print("\n===== Cleaned AI Output =====\n")
        print(cleaned_text)

        return jsonify({
            "text": cleaned_text,
            "raw_text": raw_text
        })

    except Exception as e:
        print(f"OCR Error: {e}")
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    port = int(os.getenv("PORT", "5000"))
    print(f"🚀 Smart-Pen backend running on http://localhost:{port}")
    app.run(debug=True, port=port)
