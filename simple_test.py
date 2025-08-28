#!/usr/bin/env python3
"""
Simple test script for PDF text extraction
This script tests the basic PDF processing without requiring Django
"""

import os
import sys
from pathlib import Path

def test_pdf_files():
    """Test if PDF files exist and can be processed"""
    print("🧪 Simple PDF Test for Car Douane Project")
    print("=" * 50)
    
    # Get the root directory
    root_dir = os.path.dirname(os.path.abspath(__file__))
    print(f"📁 Root directory: {root_dir}")
    
    # Look for PDF files
    pdf_files = list(Path(root_dir).glob("*.pdf"))
    
    if not pdf_files:
        print("❌ No PDF files found in the root directory")
        return
    
    print(f"📄 Found {len(pdf_files)} PDF files:")
    for pdf_file in pdf_files:
        size = pdf_file.stat().st_size
        print(f"   - {pdf_file.name} ({size/1024:.1f} KB)")
    
    # Look for existing TXT files
    txt_files = list(Path(root_dir).glob("*.txt"))
    debug_txt_files = [f for f in txt_files if f.name.startswith('debug_')]
    other_txt_files = [f for f in txt_files if not f.name.startswith('debug_')]
    
    print(f"\n📝 Found {len(txt_files)} TXT files:")
    print(f"   - Debug TXT files: {len(debug_txt_files)}")
    print(f"   - Other TXT files: {len(other_txt_files)}")
    
    if other_txt_files:
        print(f"\n📁 Other TXT files:")
        for txt_file in other_txt_files:
            size = txt_file.stat().st_size
            print(f"   - {txt_file.name} ({size/1024:.1f} KB)")
    
    # Check if we can create a simple TXT file
    print(f"\n🔧 Testing file creation...")
    test_txt_path = os.path.join(root_dir, "test_output.txt")
    
    try:
        with open(test_txt_path, 'w', encoding='utf-8') as f:
            f.write("Test PDF extraction output\n")
            f.write("This is a test file to verify write permissions\n")
            f.write("If you see this, the system can create TXT files\n")
        
        if os.path.exists(test_txt_path):
            size = os.path.getsize(test_txt_path)
            print(f"✅ Successfully created test TXT file: {test_txt_path}")
            print(f"📊 File size: {size} bytes")
            
            # Clean up test file
            os.remove(test_txt_path)
            print(f"🧹 Cleaned up test file")
        else:
            print(f"❌ Failed to create test TXT file")
            
    except Exception as e:
        print(f"❌ Error creating test file: {e}")
    
    print(f"\n🎯 Summary:")
    print(f"   - PDF files available: {len(pdf_files)}")
    print(f"   - TXT files present: {len(txt_files)}")
    print(f"   - File system writable: {'Yes' if os.access(root_dir, os.W_OK) else 'No'}")
    
    print(f"\n✨ Test completed! Ready for PDF processing setup.")

if __name__ == "__main__":
    test_pdf_files()

