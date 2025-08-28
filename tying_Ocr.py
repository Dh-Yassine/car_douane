"""
douane_ocr_pipeline.py
Robust PDF OCR + parsing pipeline for Tunisian Douane auction PDFs.
Outputs JSON with detected listings and extracted fields.
"""

import re, json, sys, os, tempfile
from pathlib import Path
from typing import List, Dict, Tuple
import pdfplumber
import pytesseract
from pdf2image import convert_from_path
from PIL import Image
import numpy as np
import cv2
import camelot
import regex
from unidecode import unidecode

# -----------------------
# Configuration
# -----------------------
TESSERACT_LANG = "ara+fra+eng"   # languages installed in your tesseract
TESSERACT_PSM = "6"             # try 6 or 4; can be overridden per call
PDF_DPI = 200
TABLE_FLAVOR = "lattice"        # try 'stream' on text-based tables if lattice fails
MAX_SEGMENT_LEN = 2000          # characters to use when sampling segment for parsing
BRAND_KEYWORDS = [
    "Mercedes","Peugeot","Renault","Fiat","Volkswagen","BMW","Toyota","Lifan",
    "Hyundai","Kia","Mitsubishi","Nissan","Opel","Citroen","Ford","Seat","Skoda"
]
ARABIC_GROUP_WORD = "المجموعة"  # common segment boundary token in Douane PDFs

# -----------------------
# Preprocessing helpers (OpenCV)
# -----------------------
def pil_to_cv(img: Image.Image) -> np.ndarray:
    return cv2.cvtColor(np.array(img), cv2.COLOR_RGB2BGR)

def cv_to_pil(img: np.ndarray) -> Image.Image:
    return Image.fromarray(cv2.cvtColor(img, cv2.COLOR_BGR2RGB))

def deskew_image_cv(img: np.ndarray) -> np.ndarray:
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    gray = cv2.bitwise_not(gray)
    thresh = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY | cv2.THRESH_OTSU)[1]
    coords = np.column_stack(np.where(thresh > 0))
    if coords.shape[0] < 10:
        return img
    angle = cv2.minAreaRect(coords)[-1]
    if angle < -45:
        angle = -(90 + angle)
    else:
        angle = -angle
    (h, w) = img.shape[:2]
    M = cv2.getRotationMatrix2D((w//2, h//2), angle, 1.0)
    rotated = cv2.warpAffine(img, M, (w, h), flags=cv2.INTER_CUBIC, borderMode=cv2.BORDER_REPLICATE)
    return rotated

def enhance_contrast_and_denoise(img: np.ndarray) -> np.ndarray:
    # convert to YCrCb to adjust luminance
    ycrcb = cv2.cvtColor(img, cv2.COLOR_BGR2YCrCb)
    channels = cv2.split(ycrcb)
    channels[0] = cv2.equalizeHist(channels[0])
    ycrcb = cv2.merge(channels)
    img_eq = cv2.cvtColor(ycrcb, cv2.COLOR_YCrCb2BGR)
    # denoise
    img_denoise = cv2.fastNlMeansDenoisingColored(img_eq, None, 10, 10, 7, 21)
    return img_denoise

def adaptive_binarize(img: np.ndarray) -> np.ndarray:
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    bin_img = cv2.adaptiveThreshold(
        gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 31, 15
    )
    # convert single channel back to BGR for tesseract compatibility if needed
    return cv2.cvtColor(bin_img, cv2.COLOR_GRAY2BGR)

def preprocess_pil_image(pil_img: Image.Image) -> Image.Image:
    cv_img = pil_to_cv(pil_img)
    cv_img = deskew_image_cv(cv_img)
    cv_img = enhance_contrast_and_denoise(cv_img)
    cv_img = adaptive_binarize(cv_img)
    return cv_to_pil(cv_img)

# -----------------------
# PDF text extraction (fast) and OCR fallback
# -----------------------
def extract_text_pdfplumber(pdf_path: Path) -> List[Dict]:
    pages = []
    with pdfplumber.open(str(pdf_path)) as pdf:
        for p in pdf.pages:
            text = p.extract_text(x_tolerance=2, y_tolerance=2)
            pages.append({"page": p.page_number, "text": text or "", "is_scanned": False})
    return pages

def image_ocr_for_pages(pdf_path: Path, dpi=PDF_DPI, lang=TESSERACT_LANG, psm=TESSERACT_PSM) -> List[Dict]:
    pages = []
    pil_images = convert_from_path(str(pdf_path), dpi=dpi, fmt="jpeg")
    for i, pil in enumerate(pil_images):
        # preprocess
        pil_proc = preprocess_pil_image(pil)
        custom_oem_psm = f"--psm {psm}"
        txt = pytesseract.image_to_string(pil_proc, lang=lang, config=custom_oem_psm)
        pages.append({"page": i+1, "text": txt or "", "is_scanned": True})
    return pages

# -----------------------
# Table extraction using Camelot (works on text-like PDFs or lattice tables)
# -----------------------
def extract_tables_camelot(pdf_path: Path) -> List[Dict]:
    tables = []
    try:
        # flavor lattice is better for bordered/cell tables; switch to stream if failure
        tables_obj = camelot.read_pdf(str(pdf_path), pages='all', flavor=TABLE_FLAVOR)
        for t in tables_obj:
            tables.append({"page": t.page, "df_csv": t.df.to_csv(index=False), "shape": t.shape})
    except Exception as e:
        # silent fallback
        pass
    return tables

# -----------------------
# Segmentation & parsing heuristics
# -----------------------
def merge_pages_text(pages: List[Dict]) -> str:
    # join pages with page breaks
    return "\n".join(f"---PAGE {p['page']}---\n{p['text']}" for p in pages)

def find_segment_boundaries(full_text: str) -> List[Tuple[int,int,str]]:
    """
    Returns list of (start_idx, end_idx, segment_text)
    Heuristics:
      - split on Arabic group word like 'المجموعة' or 'LOT' or 'N°'
      - fallback: split by lines that start with 'المجموعة' or 'LOT' or lines that look like "N° 123"
    """
    splits = []
    # normalized search for group markers
    tokens = list(regex.finditer(r'المجموعة\s*[-:]*\s*\d+|N(?:°|o|º)\s*\d+|LOT\s*\d+|مجموعة\s*\d+', full_text, flags=regex.IGNORECASE))
    if tokens:
        indices = [m.start() for m in tokens] + [len(full_text)]
        for i in range(len(indices)-1):
            s = indices[i]
            e = indices[i+1]
            seg = full_text[s:e].strip()
            if len(seg) > 20:
                splits.append((s,e,seg))
    else:
        # fallback: split every ~600-1000 chars to make small segments
        n = len(full_text)
        chunk = 900
        for start in range(0, n, chunk):
            end = min(n, start+chunk)
            seg = full_text[start:end].strip()
            splits.append((start,end,seg))
    return splits

# Field extractors
VIN_RE = regex.compile(r'\b[ A-HJ-NPR-Z0-9]{10,17}\b')   # fuzzy; we'll filter
def extract_vins(text: str) -> List[str]:
    # VINs are alphanumeric 10-17; we filter by length and exclude pure numbers
    cand = regex.findall(r'\b[A-HJ-NPR-Z0-9]{10,17}\b', text.upper())
    vins = []
    for c in cand:
        s = c.strip()
        if any(ch.isalpha() for ch in s) and 6 < len(s) <= 17:
            vins.append(s)
    return list(dict.fromkeys(vins))  # unique preserve order

def extract_lot_id(text: str) -> str:
    m = regex.search(r'(?:المجموعة|LOT|N(?:°|o|º)|رقم)\s*[-:]*\s*(\d{1,6})', text, flags=regex.IGNORECASE)
    return m.group(1) if m else ""

def extract_dates(text: str) -> List[str]:
    # dd/mm/yyyy or dd-mm-yyyy or yyyy/mm/dd patterns and some Arabic date words may appear
    dates = regex.findall(r'\b\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}\b', text)
    return list(dict.fromkeys(dates))

def extract_prices(text: str) -> List[str]:
    # capture numbers with thousands separators and currency markers, and Arabic words near them
    cand = regex.findall(r'(?:(?:د\.ت|TND|DT|DT\.)\s*)?(\d{1,3}(?:[ ,]\d{3})*(?:[.,]\d{1,2})?)\s*(?:د\.ت|TND|DT|DT\.)?', text, flags=regex.IGNORECASE)
    # filter unrealistic small numbers if needed
    return list(dict.fromkeys([c.replace(" ", "").replace(",", "") for c in cand]))

def extract_title(text: str) -> str:
    # Try to capture line with a brand keyword and short trailing context
    for brand in BRAND_KEYWORDS:
        m = regex.search(r'\b' + regex.escape(brand) + r'\b[^\n]{0,60}', text, flags=regex.IGNORECASE)
        if m:
            return m.group(0).strip()
    # fallback: first non-empty line that is <80 chars and contains letters
    for line in text.splitlines():
        line = line.strip()
        if 6 < len(line) < 120 and any(c.isalpha() for c in line):
            return line
    return ""

def make_short_desc(text: str, max_len=140) -> str:
    t = re.sub(r'\s+', ' ', text).strip()
    return (t[:max_len] + '...') if len(t) > max_len else t

# -----------------------
# Main pipeline -> produce records
# -----------------------
def process_pdf_to_records(pdf_path: str) -> Dict:
    p = Path(pdf_path)
    assert p.exists(), f"PDF not found: {pdf_path}"
    # 1) fast text extraction
    pages_text = extract_text_pdfplumber(p)
    # if pages empty or mostly empty -> use OCR images
    empty_pages = sum(1 for pg in pages_text if not pg['text'].strip())
    if empty_pages / max(1, len(pages_text)) > 0.4:
        pages_text = image_ocr_for_pages(p)
        used_method = "image_ocr"
    else:
        # still perform OCR on pages that are blank (mixed pdfs)
        for i, pg in enumerate(pages_text):
            if not pg['text'].strip():
                # do OCR for that page only
                pil = convert_from_path(str(p), dpi=PDF_DPI, first_page=pg['page'], last_page=pg['page'])[0]
                pg_ocr = pytesseract.image_to_string(preprocess_pil_image(pil), lang=TESSERACT_LANG, config=f"--psm {TESSERACT_PSM}")
                pg['text'] = pg_ocr or ""
        used_method = "pdfplumber+ocr-fallback"
    full_text = merge_pages_text(pages_text)
    # 2) table extraction attempt
    tables = extract_tables_camelot(p)
    # 3) segmentation
    segments = find_segment_boundaries(full_text)
    records = []
    for idx, (s,e,seg) in enumerate(segments):
        seg_sample = seg[:MAX_SEGMENT_LEN]
        vins = extract_vins(seg_sample)
        lot = extract_lot_id(seg_sample)
        dates = extract_dates(seg_sample)
        prices = extract_prices(seg_sample)
        title = extract_title(seg_sample)
        short_desc = make_short_desc(seg_sample, max_len=160)
        record = {
            "segment_index": idx,
            "lot": lot,
            "title": title,
            "short_desc": short_desc,
            "full_text": seg_sample,
            "vins": vins,
            "dates": dates,
            "prices": prices,
            "source_file": str(p.name)
        }
        records.append(record)
    # fallback: if segmentation yields nothing, create one record with whole text
    if not records:
        records = [{
            "segment_index": 0,
            "lot": extract_lot_id(full_text),
            "title": extract_title(full_text),
            "short_desc": make_short_desc(full_text),
            "full_text": full_text,
            "vins": extract_vins(full_text),
            "dates": extract_dates(full_text),
            "prices": extract_prices(full_text),
            "source_file": str(p.name)
        }]
    result = {
        "file": str(p),
        "method": used_method,
        "num_pages": len(pages_text),
        "tables_extracted": len(tables),
        "records": records
    }
    return result

# -----------------------
# CLI
# -----------------------
if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python douane_ocr_pipeline.py /path/to/file.pdf")
        sys.exit(1)
    pdf_path = sys.argv[1]
    out = process_pdf_to_records(pdf_path)
    print(json.dumps(out, ensure_ascii=False, indent=2))
