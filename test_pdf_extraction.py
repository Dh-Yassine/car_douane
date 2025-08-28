#!/usr/bin/env python3
"""
Test script for PDF text extraction functionality

This script tests the PDF text extraction and saves the results as TXT files
in the root folder for n8n processing.
"""

import os
import sys
from pathlib import Path

# Add backend to path to import Django modules
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'douane_project.settings')

import django
django.setup()

from listings.admin import PDFUploadAdmin

def test_pdf_extraction():
    """Test PDF text extraction with sample PDFs"""
    print("🧪 Testing PDF Text Extraction for Car Douane Project")
    print("=" * 60)
    
    # Get the root directory
    root_dir = os.path.dirname(os.path.abspath(__file__))
    print(f"📁 Root directory: {root_dir}")
    
    # Look for PDF files in the root directory
    pdf_files = list(Path(root_dir).glob("*.pdf"))
    
    if not pdf_files:
        print("❌ No PDF files found in the root directory")
        return
    
    print(f"📄 Found {len(pdf_files)} PDF files:")
    for pdf_file in pdf_files:
        print(f"   - {pdf_file.name}")
    
    print("\n" + "=" * 60)
    
    # Test extraction on each PDF
    admin_instance = PDFUploadAdmin(None, None)
    
    for pdf_file in pdf_files:
        print(f"\n🔍 Processing: {pdf_file.name}")
        print("-" * 40)
        
        try:
            # Create a temporary PDFUpload object
            class TempPDFUpload:
                def __init__(self, file_path):
                    self.file = type('File', (), {'path': str(file_path)})()
                    self.filename = file_path.name
            
            temp_upload = TempPDFUpload(pdf_file)
            
            # Extract text
            success = admin_instance.extract_text_to_txt_file(temp_upload)
            
            if success:
                txt_path = admin_instance.get_txt_file_path(temp_upload)
                if os.path.exists(txt_path):
                    file_size = os.path.getsize(txt_path)
                    print(f"✅ Successfully extracted text")
                    print(f"📁 TXT file: {txt_path}")
                    print(f"📊 Size: {file_size/1024:.1f} KB")
                    
                    # Show first few lines of the TXT file
                    with open(txt_path, 'r', encoding='utf-8') as f:
                        content = f.read()
                        lines = content.split('\n')[:5]
                        print(f"📝 Preview (first 5 lines):")
                        for i, line in enumerate(lines, 1):
                            if line.strip():
                                print(f"   {i}: {line[:80]}{'...' if len(line) > 80 else ''}")
                        if len(content.split('\n')) > 5:
                            print(f"   ... and {len(content.split('\n')) - 5} more lines")
                else:
                    print(f"❌ TXT file was not created")
            else:
                print(f"❌ Failed to extract text")
                
        except Exception as e:
            print(f"❌ Error processing {pdf_file.name}: {e}")
        
        print("-" * 40)
    
    print("\n" + "=" * 60)
    print("🎯 Test Summary:")
    
    # Count generated TXT files
    txt_files = list(Path(root_dir).glob("*.txt"))
    debug_txt_files = [f for f in txt_files if f.name.startswith('debug_')]
    generated_txt_files = [f for f in txt_files if not f.name.startswith('debug_')]
    
    print(f"📊 Total PDF files: {len(pdf_files)}")
    print(f"📄 Generated TXT files: {len(generated_txt_files)}")
    print(f"🐛 Debug TXT files: {len(debug_txt_files)}")
    
    if generated_txt_files:
        print(f"\n📁 Generated TXT files:")
        for txt_file in generated_txt_files:
            size = txt_file.stat().st_size
            print(f"   - {txt_file.name} ({size/1024:.1f} KB)")
    
    print("\n✨ Test completed! TXT files are ready for n8n processing.")

if __name__ == "__main__":
    test_pdf_extraction()
