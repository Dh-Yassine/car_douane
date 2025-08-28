from django.core.management.base import BaseCommand, CommandError
from django.conf import settings
from listings.models import PDFUpload
from listings.admin import PDFUploadAdmin
import os

class Command(BaseCommand):
    help = 'Extract text from PDF uploads and save as TXT files in the root folder'

    def add_arguments(self, parser):
        parser.add_argument(
            '--pdf-id',
            type=int,
            help='Extract text from a specific PDF upload by ID'
        )
        parser.add_argument(
            '--all',
            action='store_true',
            help='Extract text from all unprocessed PDF uploads'
        )
        parser.add_argument(
            '--force',
            action='store_true',
            help='Force re-extraction even if TXT file already exists'
        )

    def handle(self, *args, **options):
        admin_instance = PDFUploadAdmin(PDFUpload, None)
        
        if options['pdf_id']:
            # Extract from specific PDF
            try:
                pdf_upload = PDFUpload.objects.get(id=options['pdf_id'])
                self.extract_single_pdf(admin_instance, pdf_upload, options['force'])
            except PDFUpload.DoesNotExist:
                raise CommandError(f'PDF upload with ID {options["pdf_id"]} does not exist')
        
        elif options['all']:
            # Extract from all unprocessed PDFs
            pdf_uploads = PDFUpload.objects.filter(processed=False)
            if not pdf_uploads.exists():
                self.stdout.write(self.style.WARNING('No unprocessed PDF uploads found'))
                return
            
            self.stdout.write(f'Found {pdf_uploads.count()} unprocessed PDF uploads')
            
            success_count = 0
            for pdf_upload in pdf_uploads:
                if self.extract_single_pdf(admin_instance, pdf_upload, options['force']):
                    success_count += 1
            
            self.stdout.write(
                self.style.SUCCESS(
                    f'Successfully extracted text from {success_count}/{pdf_uploads.count()} PDF(s)'
                )
            )
        
        else:
            # Show help
            self.stdout.write(
                self.style.ERROR(
                    'Please specify either --pdf-id <id> or --all'
                )
            )
            self.print_usage('manage.py', 'extract_pdf_text')

    def extract_single_pdf(self, admin_instance, pdf_upload, force=False):
        """Extract text from a single PDF upload"""
        txt_path = admin_instance.get_txt_file_path(pdf_upload)
        
        if os.path.exists(txt_path) and not force:
            self.stdout.write(
                self.style.WARNING(
                    f'TXT file already exists for {pdf_upload.filename}. Use --force to re-extract.'
                )
            )
            return False
        
        self.stdout.write(f'Extracting text from {pdf_upload.filename}...')
        
        try:
            success = admin_instance.extract_text_to_txt_file(pdf_upload)
            
            if success:
                file_size = os.path.getsize(txt_path)
                self.stdout.write(
                    self.style.SUCCESS(
                        f'✓ Successfully extracted text from {pdf_upload.filename}'
                        f' ({file_size/1024:.1f} KB)'
                    )
                )
                self.stdout.write(f'  TXT file saved to: {txt_path}')
                return True
            else:
                self.stdout.write(
                    self.style.ERROR(
                        f'✗ Failed to extract text from {pdf_upload.filename}'
                    )
                )
                return False
                
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(
                    f'✗ Error extracting text from {pdf_upload.filename}: {e}'
                )
            )
            return False
