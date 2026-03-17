import cv2
import pytesseract
import requests

# 🔧 Tesseract path (only if needed)
pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'

# 📂 Image path
image_path = "test.jpeg"

# 📥 Load image
img = cv2.imread(image_path)

if img is None:
    print("❌ Error: Image not found. Check path!")
    exit()

# 🧠 Preprocessing (improves OCR accuracy)
gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
gray = cv2.resize(gray, None, fx=2, fy=2, interpolation=cv2.INTER_CUBIC)
gray = cv2.GaussianBlur(gray, (5, 5), 0)
_, thresh = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)

# 🔍 OCR extraction
custom_config = r'--oem 3 --psm 6'
raw_text = pytesseract.image_to_string(thresh, config=custom_config)

print("\n===== Raw OCR Output =====\n")
print(raw_text)

# 🧹 Clean raw text for better LLM understanding
clean_input = raw_text.replace("\n", " ")

# 🤖 DeepSeek correction (LOCAL via Ollama)
def clean_text_with_deepseek(text):
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
            }
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

# 🚀 Process with DeepSeek
cleaned_text = clean_text_with_deepseek(clean_input)

print("\n===== Cleaned AI Output =====\n")
print(cleaned_text)