import pdfplumber
import pytesseract
from pdf2image import convert_from_path
import re
import os
import unicodedata
from typing import List, Dict, Optional
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

# Configure Tesseract path for Windows
TESSERACT_PATH = r"C:\Program Files\Tesseract-OCR\tesseract.exe"
if os.path.exists(TESSERACT_PATH):
    pytesseract.pytesseract.tesseract_cmd = TESSERACT_PATH


class PDFParser:
    """Parser for Douane auction PDFs"""
    
    def __init__(self):
        # Optional Arabic shaping for better visual order in TXT output
        self._arabic_shaper = None
        self._bidi_get_display = None
        try:
            import arabic_reshaper  # type: ignore
            from bidi.algorithm import get_display  # type: ignore
            self._arabic_shaper = arabic_reshaper
            self._bidi_get_display = get_display
        except Exception:
            # Libraries not available; proceed without shaping
            self._arabic_shaper = None
            self._bidi_get_display = None
        
        self.vehicle_patterns = [
            # Pattern for vehicle entries with guarantee and price
            re.compile(
                r"د\s*(\d+)\s*د\s*(\d+).*?\s+([A-Z\u0621-\u064A0-9\-]+)\s+([A-Z0-9]+)\s+(.*?)(?=\d{2}|\n)",
                re.UNICODE
            ),
            # Alternative pattern for different format
            re.compile(
                r"(\d+)\s*د\s*(\d+)\s*([A-Z\u0621-\u064A\s]+)\s+([A-Z0-9]+)\s+(.*?)(?=\d{2}|\n)",
                re.UNICODE
            )
        ]
        
        self.goods_patterns = [
            # Pattern for goods like seeds
            re.compile(
                r"(\d+)\s*(?:كلغ|طن|قطعة)?\s*([\u0621-\u064A\s]+)",
                re.UNICODE
            ),
            # Alternative pattern for goods
            re.compile(
                r"([\u0621-\u064A\s]+)\s*(\d+)\s*(?:كلغ|طن|قطعة)",
                re.UNICODE
            )
        ]
        
        self.group_patterns = [
            # Arabic group patterns
            re.compile(r"المجموعة\s+(الأولى|الثانية|الثالثة|الرابعة|الخامسة)", re.UNICODE),
            # French group patterns
            re.compile(r"Groupe\s+(I|II|III|IV|V)", re.UNICODE),
        ]
    
    def is_text_based(self, pdf_path: str) -> bool:
        """Check if PDF is text-based or scanned"""
        try:
            with pdfplumber.open(pdf_path) as pdf:
                for page in pdf.pages:
                    if page.extract_text():
                        return True
            return False
        except Exception as e:
            logger.error(f"Error checking PDF type: {e}")
            return False
    
    def extract_text(self, pdf_path: str) -> str:
        """Extract text from PDF using appropriate method"""
        try:
            if self.is_text_based(pdf_path):
                logger.info("✅ PDF is text-based")
                with pdfplumber.open(pdf_path) as pdf:
                    text_parts = []
                    for page in pdf.pages:
                        # Tweaked tolerances often help RTL scripts
                        text = page.extract_text(x_tolerance=1.5, y_tolerance=1.5) or ""
                        if text:
                            text_parts.append(text)
                    raw_text = "\n".join(text_parts)
                    return self._normalize_and_shape(raw_text)
            else:
                logger.info("📷 PDF is scanned, running OCR...")
                images = convert_from_path(pdf_path)
                text_parts = []
                for img in images:
                    # Better OCR for mixed Arabic/French
                    text = pytesseract.image_to_string(
                        img, lang="ara+fra", config="--oem 1 --psm 6"
                    )
                    text_parts.append(text)
                raw_text = "\n".join(text_parts)
                return self._normalize_and_shape(raw_text)
        except Exception as e:
            logger.error(f"Error extracting text: {e}")
            return ""

    def _normalize_and_shape(self, text: str) -> str:
        """Normalize Unicode and optionally shape Arabic for better visual order.

        Note: Shaping is primarily for display in editors; data extraction can work with
        unshaped text too. We keep both concerns in mind by at least normalizing.
        """
        if not text:
            return text
        # Normalize unicode to avoid weird combining forms
        normalized = unicodedata.normalize("NFKC", text)
        # Optionally shape Arabic to improve visual order in common editors
        if self._arabic_shaper and self._bidi_get_display:
            try:
                reshaped = self._arabic_shaper.reshape(normalized)
                # Apply BiDi to get the right visual order
                return self._bidi_get_display(reshaped)
            except Exception:
                return normalized
        return normalized
    
    def extract_groups(self, text: str) -> List[Dict]:
        """Extract auction groups from text"""
        groups = []
        for pattern in self.group_patterns:
            for match in pattern.finditer(text):
                group_name = match.group(1)
                groups.append({
                    'name': group_name,
                    'start_pos': match.start(),
                    'end_pos': match.end()
                })
        return sorted(groups, key=lambda x: x['start_pos'])
    
    def parse_vehicles(self, text: str) -> List[Dict]:
        """Parse vehicle entries from text"""
        vehicles = []
        
        for pattern in self.vehicle_patterns:
            for match in pattern.finditer(text):
                try:
                    if len(match.groups()) >= 4:
                        guarantee, price, brand, serial, rest = match.groups()
                        
                        # Clean up the data
                        guarantee = re.sub(r'[^\d]', '', str(guarantee))
                        price = re.sub(r'[^\d]', '', str(price))
                        
                        if guarantee and price:
                            vehicles.append({
                                'type': 'vehicle',
                                'brand': brand.strip() if brand else '',
                                'serial': serial.strip() if serial else '',
                                'guarantee_tnd': int(guarantee),
                                'price_tnd': int(price),
                                'description': rest.strip() if rest else '',
                                'raw_match': match.group(0)
                            })
                except (ValueError, IndexError) as e:
                    logger.warning(f"Error parsing vehicle match: {e}")
                    continue
        
        return vehicles
    
    def parse_goods(self, text: str) -> List[Dict]:
        """Parse goods entries from text"""
        goods = []
        
        for pattern in self.goods_patterns:
            for match in pattern.finditer(text):
                try:
                    if len(match.groups()) >= 2:
                        qty, name = match.groups()
                        
                        goods.append({
                            'type': 'goods',
                            'quantity': qty.strip() if qty else '',
                            'item': name.strip() if name else '',
                            'raw_match': match.group(0)
                        })
                except (ValueError, IndexError) as e:
                    logger.warning(f"Error parsing goods match: {e}")
                    continue
        
        return goods
    
    def extract_lot_numbers(self, text: str) -> List[str]:
        """Extract lot numbers from text"""
        # Pattern for lot numbers (usually 2-digit numbers)
        lot_pattern = re.compile(r'\b(\d{2})\b')
        lots = lot_pattern.findall(text)
        return list(set(lots))  # Remove duplicates
    
    def parse_listings(self, text: str) -> Dict:
        """Main parsing function that extracts all listings"""
        result = {
            'vehicles': self.parse_vehicles(text),
            'goods': self.parse_goods(text),
            'groups': self.extract_groups(text),
            'lot_numbers': self.extract_lot_numbers(text),
            'raw_text': text
        }
        
        logger.info(f"Parsed {len(result['vehicles'])} vehicles and {len(result['goods'])} goods")
        return result
    
    def parse_pdf(self, pdf_path: str) -> Dict:
        """Parse a PDF file and return structured data"""
        try:
            text = self.extract_text(pdf_path)
            if not text:
                logger.error("No text extracted from PDF")
                return {}
            
            # Save raw text for debugging
            debug_file = f"debug_{os.path.basename(pdf_path)}.txt"
            with open(debug_file, "w", encoding="utf-8") as f:
                f.write(text)
            logger.info(f"Saved debug text to {debug_file}")
            
            return self.parse_listings(text)
            
        except Exception as e:
            logger.error(f"Error parsing PDF {pdf_path}: {e}")
            return {}


def extract_city_from_filename(filename: str) -> str:
    """Extract city name from PDF filename"""
    # Common patterns in filenames
    city_patterns = {
        'kef': ['kef', 'keef', 'الكاف'],
        'sidi_bouzid': ['sidi', 'bouzid', 'سيدي بوزيد'],
        'tunis': ['tunis', 'تونس'],
        'sousse': ['sousse', 'سوسة'],
        'sfax': ['sfax', 'صفاقس'],
    }
    
    filename_lower = filename.lower()
    for city, patterns in city_patterns.items():
        for pattern in patterns:
            if pattern in filename_lower:
                return city.replace('_', ' ').title()
    
    return "Unknown"


def extract_date_from_filename(filename: str) -> Optional[datetime]:
    """Extract auction date from PDF filename"""
    # Look for date patterns like 2025-08-07 or 07-08-2025
    date_patterns = [
        r'(\d{4})-(\d{2})-(\d{2})',  # YYYY-MM-DD
        r'(\d{2})-(\d{2})-(\d{4})',  # DD-MM-YYYY
        r'(\d{2})_(\d{2})_(\d{4})',  # DD_MM_YYYY
    ]
    
    for pattern in date_patterns:
        match = re.search(pattern, filename)
        if match:
            try:
                if len(match.group(1)) == 4:  # YYYY-MM-DD
                    return datetime.strptime(f"{match.group(1)}-{match.group(2)}-{match.group(3)}", "%Y-%m-%d")
                else:  # DD-MM-YYYY
                    return datetime.strptime(f"{match.group(3)}-{match.group(2)}-{match.group(1)}", "%Y-%m-%d")
            except ValueError:
                continue
    
    return None
