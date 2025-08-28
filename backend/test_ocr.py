#!/usr/bin/env python
"""
Test script for OCR parser
"""
import os
import sys
import django

# Add the current directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'douane_project.settings')
django.setup()

from ocr_parser.parser import PDFParser, extract_city_from_filename, extract_date_from_filename
from ocr_parser.services import OCRProcessingService
from listings.models import PDFUpload
from datetime import date


def test_parser():
    """Test the PDF parser with existing PDFs"""
    parser = PDFParser()
    
    # Test with the existing PDF files
    pdf_files = [
        "../2025-08-07_AV_OP_Kef_N°03-2025.pdf",
        "../2025-08-07_AV_OP_Sidi-Bouzid_N°09-2025.pdf"
    ]
    
    for pdf_path in pdf_files:
        if os.path.exists(pdf_path):
            print(f"\n{'='*50}")
            print(f"Testing PDF: {pdf_path}")
            print(f"{'='*50}")
            
            # Extract city and date from filename
            filename = os.path.basename(pdf_path)
            city = extract_city_from_filename(filename)
            auction_date = extract_date_from_filename(filename)
            
            print(f"Extracted city: {city}")
            print(f"Extracted date: {auction_date}")
            
            # Parse the PDF
            result = parser.parse_pdf(pdf_path)
            
            if result:
                print(f"\nVehicles found: {len(result.get('vehicles', []))}")
                print(f"Goods found: {len(result.get('goods', []))}")
                print(f"Groups found: {len(result.get('groups', []))}")
                print(f"Lot numbers found: {len(result.get('lot_numbers', []))}")
                
                # Show some sample vehicles
                vehicles = result.get('vehicles', [])
                if vehicles:
                    print(f"\nSample vehicles:")
                    for i, vehicle in enumerate(vehicles[:3]):
                        print(f"  {i+1}. {vehicle.get('brand', 'N/A')} - {vehicle.get('price_tnd', 'N/A')} TND")
                
                # Show some sample goods
                goods = result.get('goods', [])
                if goods:
                    print(f"\nSample goods:")
                    for i, good in enumerate(goods[:3]):
                        print(f"  {i+1}. {good.get('item', 'N/A')} - {good.get('quantity', 'N/A')}")
                
                # Show groups
                groups = result.get('groups', [])
                if groups:
                    print(f"\nGroups found:")
                    for group in groups:
                        print(f"  - {group.get('name', 'N/A')}")
            else:
                print("No data extracted from PDF")


def test_service():
    """Test the OCR processing service"""
    print(f"\n{'='*50}")
    print("Testing OCR Processing Service")
    print(f"{'='*50}")
    
    # Create a test PDF upload
    pdf_path = "../2025-08-07_AV_OP_Kef_N°03-2025.pdf"
    
    if os.path.exists(pdf_path):
        # Create PDF upload record
        filename = os.path.basename(pdf_path)
        city = extract_city_from_filename(filename)
        auction_date = extract_date_from_filename(filename) or date.today()
        
        pdf_upload = PDFUpload.objects.create(
            filename=filename,
            city=city,
            auction_date=auction_date,
            file=pdf_path  # This won't work in real scenario, just for testing
        )
        
        print(f"Created PDF upload: {pdf_upload}")
        
        # Test the service
        service = OCRProcessingService()
        result = service.process_pdf_upload(pdf_upload)
        
        print(f"Processing result: {result}")
        
        # Clean up
        pdf_upload.delete()


if __name__ == "__main__":
    print("Testing OCR Parser and Service")
    print("="*50)
    
    try:
        test_parser()
        # test_service()  # Uncomment to test service
    except Exception as e:
        print(f"Error during testing: {e}")
        import traceback
        traceback.print_exc()
