# pdf_extractor.py
# pip install flask pymupdf

from flask import Flask, request, jsonify
import fitz   # PyMuPDF

app = Flask(__name__)

@app.route("/extract", methods=["POST"])
def extract():
    # Accept file from multipart/form-data (n8n will send it as file)
    file = None
    if request.files:
        # take the first file provided
        file = next(iter(request.files.values()))
    if not file:
        return jsonify({"error": "no file uploaded"}), 400

    data = file.read()
    try:
        doc = fitz.open(stream=data, filetype="pdf")
        pages = []
        for p in doc:
            text = p.get_text().strip()
            if text:
                pages.append(text)
        full_text = "\n\n".join(pages)
        return jsonify({"text": full_text})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    # accessible from localhost
    app.run(host="127.0.0.1", port=5000)
