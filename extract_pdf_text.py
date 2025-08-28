#!/usr/bin/env python3
"""
PDF Text Extraction Script for Car Douane Project

This script extracts text from PDF files and saves them as .txt files
in the root folder for processing by n8n workflows.

Usage:
    python extract_pdf_text.py <pdf_file_path>
    python extract_pdf_text.py --all-pdfs
"""

import os
import sys
import argparse
from pathlib import Path

# Add backend to path to import Django modules
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'douane_project.settings')

import django
django.setup()

from listings.models import PDFUpload
from listings.admin import PDFUploadAdmin

def extract_text_from_pdf(pdf_path):
    """Extract text from a PDF file and save as TXT"""
    try:
        # Check if file exists
        if not os.path.exists(pdf_path):
            print(f"❌ Error: File {pdf_path} does not exist")
            return False
        
        # Check if it's a PDF
        if not pdf_path.lower().endswith('.pdf'):
            print(f"❌ Error: {pdf_path} is not a PDF file")
            return False
        
        print(f"📄 Processing PDF: {pdf_path}")
        
        # Create a temporary PDFUpload object for processing
        class TempPDFUpload:
            def __init__(self, file_path):
                self.file = type('File', (), {'path': file_path})()
                self.filename = os.path.basename(file_path)
        
        temp_upload = TempPDFUpload(pdf_path)
        
        # Use the admin class to extract text
        admin_instance = PDFUploadAdmin(PDFUpload, None)
        success = admin_instance.extract_text_to_txt_file(temp_upload)
        
        if success:
            txt_path = admin_instance.get_txt_file_path(temp_upload)
            file_size = os.path.getsize(txt_path)
            print(f"✅ Successfully extracted text from {pdf_path}")
            print(f"📁 TXT file saved to: {txt_path}")
            print(f"📊 File size: {file_size/1024:.1f} KB")
            return True
        else:
            print(f"❌ Failed to extract text from {pdf_path}")
            return False
            
    except Exception as e:
        print(f"❌ Error processing {pdf_path}: {e}")
        return False

def extract_all_pdfs_in_folder(folder_path="."):
    """Extract text from all PDF files in a folder"""
    pdf_files = list(Path(folder_path).glob("*.pdf"))
    
    if not pdf_files:
        print("❌ No PDF files found in the current directory")
        return
    
    print(f"📁 Found {len(pdf_files)} PDF files in {folder_path}")
    print("=" * 50)
    
    success_count = 0
    for pdf_file in pdf_files:
        if extract_text_from_pdf(str(pdf_file)):
            success_count += 1
        print("-" * 30)
    
    print("=" * 50)
    print(f"🎯 Summary: {success_count}/{len(pdf_files)} PDFs processed successfully")

def main():
    parser = argparse.ArgumentParser(
        description="Extract text from PDF files for Car Douane project"
    )
    parser.add_argument(
        'pdf_file',
        nargs='?',
        help='Path to PDF file to process'
    )
    parser.add_argument(
        '--all-pdfs',
        action='store_true',
        help='Process all PDF files in the current directory'
    )
    parser.add_argument(
        '--folder',
        help='Process all PDF files in the specified folder'
    )
    
    args = parser.parse_args()
    
    if args.all_pdfs:
        extract_all_pdfs_in_folder()
    elif args.folder:
        extract_all_pdfs_in_folder(args.folder)
    elif args.pdf_file:
        extract_text_from_pdf(args.pdf_file)
    else:
        print("📋 PDF Text Extraction Tool for Car Douane Project")
        print("=" * 50)
        print("Usage examples:")
        print("  python extract_pdf_text.py document.pdf")
        print("  python extract_pdf_text.py --all-pdfs")
        print("  python extract_pdf_text.py --folder ./pdfs")
        print("\nThis tool extracts text from PDFs and saves as .txt files")
        print("in the root folder for n8n workflow processing.")

if __name__ == "__main__":
    main()
