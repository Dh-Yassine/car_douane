from django.contrib import admin
from django.http import HttpResponseRedirect, HttpResponse
from django.urls import path
from django.contrib import messages
from django.utils.html import format_html
from django.urls import reverse
from django.db import transaction
import os
import json
from decimal import Decimal
from .models import Listing, PDFUpload, AuctionGroup
# OCRProcessingService import removed - using PDFParser directly
from ocr_parser.parser import PDFParser


@admin.register(AuctionGroup)
class AuctionGroupAdmin(admin.ModelAdmin):
    list_display = ['name', 'name_ar', 'name_fr', 'order']
    list_editable = ['order']
    search_fields = ['name', 'name_ar', 'name_fr']
    ordering = ['order']


class PDFUploadAdmin(admin.ModelAdmin):
    list_display = [
        'filename', 'city', 'auction_date', 'uploaded_at', 
        'processed', 'total_listings', 'txt_file_status', 'action_buttons'
    ]
    list_filter = ['city', 'auction_date', 'processed']
    search_fields = ['filename', 'city']
    readonly_fields = ['uploaded_at', 'total_listings', 'txt_file_path']
    ordering = ['-uploaded_at']
    
    actions = ['mark_as_processed', 'mark_as_unprocessed', 'extract_text_to_txt']
    
    def txt_file_status(self, obj):
        """Show status of TXT file generation"""
        txt_path = self.get_txt_file_path(obj)
        if os.path.exists(txt_path):
            size = os.path.getsize(txt_path)
            return format_html(
                '<span style="color: green;">✓ TXT Generated</span><br>'
                '<small>Size: {:.1f} KB</small>',
                size / 1024
            )
        else:
            return format_html('<span style="color: red;">✗ No TXT file</span>')
    txt_file_status.short_description = 'TXT File Status'
    
    def txt_file_path(self, obj):
        """Show the path where TXT file is saved"""
        txt_path = self.get_txt_file_path(obj)
        if os.path.exists(txt_path):
            return format_html(
                '<code style="background: #f0f0f0; padding: 2px 4px; border-radius: 3px;">{}</code>',
                txt_path
            )
        return "TXT file not generated yet"
    txt_file_path.short_description = 'TXT File Path'
    
    def action_buttons(self, obj):
        """Show action buttons"""
        txt_path = self.get_txt_file_path(obj)
        buttons = []
        
        if not os.path.exists(txt_path):
            buttons.append(
                f'<a class="button" href="?action=extract_txt&id={obj.id}">'
                f'Extract Text to TXT</a>'
            )
        else:
            buttons.append(
                f'<a class="button" href="?action=view_txt&id={obj.id}" target="_blank">'
                f'View TXT</a>'
            )
            buttons.append(
                f'<a class="button" href="?action=download_txt&id={obj.id}">'
                f'Download TXT</a>'
            )
        
        if not obj.processed:
            buttons.append(
                f'<a class="button" href="?action=process_pdf&id={obj.id}">'
                f'Process PDF</a>'
            )
        # Upload JSON to import listings
        buttons.append(
            f'<a class="button" href="{reverse("admin:upload_json", args=[obj.id])}">Upload JSON</a>'
        )
        
        return format_html(' '.join(buttons))
    action_buttons.short_description = 'Actions'
    
    def get_txt_file_path(self, obj):
        """Get the path where TXT file should be saved"""
        # Get the root directory (CAR_DOUANE folder) - simplified path calculation
        current_file = os.path.abspath(__file__)  # backend/listings/admin.py
        backend_dir = os.path.dirname(os.path.dirname(current_file))  # backend/
        root_dir = os.path.dirname(backend_dir)  # CAR_DOUANE/
        
        # Create filename based on original PDF
        base_name = os.path.splitext(obj.filename)[0]
        txt_filename = f"{base_name}.txt"
        
        # Save in root folder
        txt_path = os.path.join(root_dir, txt_filename)
        print(f"Debug: Saving TXT to: {txt_path}")  # Debug output
        return txt_path
    
    def get_urls(self):
        """Add custom URLs for admin actions"""
        urls = super().get_urls()
        custom_urls = [
            path('extract-text/', self.extract_text_view, name='extract_text'),
            path('download-txt/<int:pk>/', self.download_txt_view, name='download_txt'),
            path('view-txt/<int:pk>/', self.view_txt_view, name='view_txt'),
            path('upload-json/<int:pk>/', self.upload_json_view, name='upload_json'),
        ]
        return custom_urls + urls
    
    def extract_text_view(self, request):
        """Admin view for extracting text from PDF"""
        if request.method == 'POST':
            pdf_id = request.POST.get('pdf_id')
            try:
                pdf_upload = PDFUpload.objects.get(id=pdf_id)
                success = self.extract_text_to_txt_file(pdf_upload)
                if success:
                    messages.success(request, f'Text extracted successfully from {pdf_upload.filename}')
                else:
                    messages.error(request, f'Failed to extract text from {pdf_upload.filename}')
            except PDFUpload.DoesNotExist:
                messages.error(request, 'PDF upload not found')
        
        return HttpResponseRedirect(reverse('admin:listings_pdfupload_changelist'))
    
    def download_txt_view(self, request, pk):
        """Download TXT file"""
        try:
            pdf_upload = PDFUpload.objects.get(id=pk)
            txt_path = self.get_txt_file_path(pdf_upload)
            
            if os.path.exists(txt_path):
                with open(txt_path, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                from django.http import HttpResponse
                response = HttpResponse(content, content_type='text/plain; charset=utf-8')
                response['Content-Disposition'] = f'attachment; filename="{os.path.basename(txt_path)}"'
                return response
            else:
                messages.error(request, 'TXT file not found')
        except PDFUpload.DoesNotExist:
            messages.error(request, 'PDF upload not found')
        
        return HttpResponseRedirect(reverse('admin:listings_pdfupload_changelist'))
    
    def view_txt_view(self, request, pk):
        """View TXT file content"""
        try:
            pdf_upload = PDFUpload.objects.get(id=pk)
            txt_path = self.get_txt_file_path(pdf_upload)
            
            if os.path.exists(txt_path):
                with open(txt_path, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                from django.http import HttpResponse
                response = HttpResponse(content, content_type='text/plain; charset=utf-8')
                response['Content-Disposition'] = f'inline; filename="{os.path.basename(txt_path)}"'
                return response
            else:
                messages.error(request, 'TXT file not found')
        except PDFUpload.DoesNotExist:
            messages.error(request, 'PDF upload not found')
        
        return HttpResponseRedirect(reverse('admin:listings_pdfupload_changelist'))
    
    def extract_text_to_txt_file(self, pdf_upload):
        """Extract text from PDF and save as TXT file"""
        try:
            print(f"Starting text extraction for: {pdf_upload.filename}")
            
            # Get the PDF file path
            pdf_path = pdf_upload.file.path
            print(f"PDF path: {pdf_path}")
            
            # Use the PDF parser to extract text
            parser = PDFParser()
            print("PDFParser initialized, extracting text...")
            extracted_text = parser.extract_text(pdf_path)
            
            if not extracted_text:
                print("No text extracted from PDF")
                return False
            
            print(f"Extracted {len(extracted_text)} characters of text")
            
            # Get the TXT file path
            txt_path = self.get_txt_file_path(pdf_upload)
            print(f"TXT will be saved to: {txt_path}")
            
            # Ensure directory exists
            os.makedirs(os.path.dirname(txt_path), exist_ok=True)
            print(f"Directory ensured: {os.path.dirname(txt_path)}")
            
            # Save extracted text to TXT file (UTF-8 with BOM for better Windows rendering)
            with open(txt_path, 'w', encoding='utf-8-sig') as f:
                f.write(extracted_text)
            
            print(f"TXT file saved successfully: {txt_path}")
            return True
            
        except Exception as e:
            print(f"Error extracting text: {e}")
            import traceback
            traceback.print_exc()
            return False

    def _parse_decimal(self, value, default=Decimal('0')):
        try:
            if value is None:
                return default
            if isinstance(value, (int, float, Decimal)):
                return Decimal(str(value))
            # strip non-numeric except dot and comma
            cleaned = ''.join(ch for ch in str(value) if ch.isdigit() or ch in ['.', ','])
            if cleaned.count(',') == 1 and cleaned.count('.') == 0:
                cleaned = cleaned.replace(',', '.')
            return Decimal(cleaned) if cleaned else default
        except Exception:
            return default

    @transaction.atomic
    def import_listings_from_json(self, pdf_upload, data: dict) -> int:
        """Create Listing records from JSON structure returned by n8n/Gemini.
        Expects a dict with key 'listings': [ { ... } ]
        """
        from .models import Listing

        listings = data.get('listings') or []
        created = 0

        # Determine starting lot number
        existing_lots = set(pdf_upload.listings.values_list('lot_number', flat=True))
        next_lot_seq = 1

        for item in listings:
            try:
                title = item.get('title') or 'N/A'
                short_description = item.get('short_description') or ''
                full_description = item.get('full_description') or ''
                listing_type = (item.get('listing_type') or 'other').lower()
                brand = item.get('brand') or ''
                model = item.get('model') or ''
                year_val = item.get('year')
                try:
                    year = int(year_val) if year_val not in (None, '', 'N/A') else None
                except Exception:
                    year = None
                fuel_type = (item.get('fuel_type') or '').lower()

                # price/guarantee
                estimated_value = item.get('estimated_value')
                starting_price = self._parse_decimal(item.get('starting_price') if item.get('starting_price') not in (None, '') else estimated_value, Decimal('0'))
                guarantee_amount = self._parse_decimal(item.get('guarantee_amount'), starting_price * Decimal('0.10'))

                # lot number
                lot_number = str(item.get('lot_number') or '').strip()
                if not lot_number:
                    while True:
                        candidate = str(next_lot_seq).zfill(3)
                        next_lot_seq += 1
                        if candidate not in existing_lots:
                            lot_number = candidate
                            existing_lots.add(candidate)
                            break

                Listing.objects.create(
                    lot_number=lot_number,
                    title=title,
                    listing_type=listing_type if listing_type in dict(Listing.LISTING_TYPES) else 'other',
                    short_description=short_description,
                    full_description=full_description,
                    brand=brand,
                    model=model,
                    year=year,
                    fuel_type=fuel_type if fuel_type in dict(Listing.FUEL_TYPES) else 'other',
                    quantity=str(item.get('quantity') or ''),
                    unit=str(item.get('unit') or ''),
                    starting_price=starting_price,
                    guarantee_amount=guarantee_amount,
                    pdf_upload=pdf_upload,
                    image_url=str(item.get('image_url') or ''),
                    original_pdf_url=str(item.get('original_pdf_url') or ''),
                )
                created += 1
            except Exception as e:
                print(f"Error creating listing from item: {e}")
                continue

        # Update PDFUpload metadata
        pdf_upload.processed = True if created > 0 else pdf_upload.processed
        pdf_upload.total_listings = (pdf_upload.total_listings or 0) + created
        pdf_upload.save(update_fields=['processed', 'total_listings'])

        return created

    def upload_json_view(self, request, pk):
        """Admin view to upload a JSON file and import listings for a PDFUpload."""
        try:
            pdf_upload = PDFUpload.objects.get(id=pk)
        except PDFUpload.DoesNotExist:
            messages.error(request, 'PDF upload not found')
            return HttpResponseRedirect(reverse('admin:listings_pdfupload_changelist'))

        if request.method == 'POST':
            json_file = request.FILES.get('json_file')
            if not json_file:
                messages.error(request, 'Please provide a JSON file')
                return HttpResponseRedirect(reverse('admin:upload_json', args=[pk]))
            try:
                content = json_file.read().decode('utf-8')
                data = json.loads(content)
            except Exception as e:
                messages.error(request, f'Invalid JSON: {e}')
                return HttpResponseRedirect(reverse('admin:upload_json', args=[pk]))

            created = self.import_listings_from_json(pdf_upload, data)
            if created > 0:
                messages.success(request, f'Imported {created} listing(s) from JSON')
            else:
                messages.warning(request, 'No listings were imported')
            return HttpResponseRedirect(reverse('admin:listings_pdfupload_changelist'))

        # Simple upload form (no template dependency)
        html = f"""
        <div style='padding:20px;font-family:system-ui,-apple-system,Segoe UI,Roboto'>
            <h2>Upload JSON for: {pdf_upload.filename}</h2>
            <form method="post" enctype="multipart/form-data">
                <input type="hidden" name="_popup" value="1" />
                <p><input type="file" name="json_file" accept="application/json" required></p>
                <p><button type="submit" style="padding:8px 16px">Import</button>
                <a href="{reverse('admin:listings_pdfupload_changelist')}" style="margin-left:12px">Cancel</a></p>
            </form>
            <p style='color:#6b7280'>Expected schema: {{ "listings": [ {{ "title": "...", "listing_type": "vehicle|goods|tools|other", "starting_price": 0, ... }} ] }}</p>
        </div>
        """
        return HttpResponse(html)
    
    def extract_text_to_txt(self, request, queryset):
        """Admin action to extract text to TXT files"""
        success_count = 0
        total_count = queryset.count()
        
        for pdf_upload in queryset:
            if self.extract_text_to_txt_file(pdf_upload):
                success_count += 1
        
        if success_count == total_count:
            messages.success(request, f'Successfully extracted text from {success_count} PDF(s)')
        elif success_count > 0:
            messages.warning(request, f'Extracted text from {success_count}/{total_count} PDF(s)')
        else:
            messages.error(request, 'Failed to extract text from any PDFs')
    
    extract_text_to_txt.short_description = "Extract text to TXT files"
    
    def mark_as_processed(self, request, queryset):
        queryset.update(processed=True)
        messages.success(request, f'{queryset.count()} PDF(s) marked as processed')
    mark_as_processed.short_description = "Mark as processed"
    
    def mark_as_unprocessed(self, request, queryset):
        queryset.update(processed=False)
        messages.success(request, f'{queryset.count()} PDF(s) marked as unprocessed')
    mark_as_unprocessed.short_description = "Mark as unprocessed"

@admin.register(PDFUpload)
class PDFUploadAdmin(PDFUploadAdmin):
    pass


class ListingAdmin(admin.ModelAdmin):
    list_display = [
        'lot_number', 'title', 'listing_type', 'brand', 'model', 
        'starting_price', 'city', 'auction_date'
    ]
    list_filter = [
        'listing_type', 'brand', 'fuel_type', 'year', 
        'pdf_upload__city', 'pdf_upload__auction_date'
    ]
    search_fields = [
        'lot_number', 'title', 'brand', 'model', 'serial_number',
        'short_description'
    ]
    readonly_fields = ['created_at', 'updated_at']
    ordering = ['lot_number']
    
    def city(self, obj):
        return obj.pdf_upload.city
    city.short_description = 'City'
    
    def auction_date(self, obj):
        return obj.pdf_upload.auction_date
    auction_date.short_description = 'Auction Date'
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('lot_number', 'title', 'listing_type', 'short_description', 'full_description')
        }),
        ('Vehicle Details', {
            'fields': ('brand', 'model', 'year', 'fuel_type', 'serial_number'),
            'classes': ('collapse',)
        }),
        ('Goods Details', {
            'fields': ('quantity', 'unit'),
            'classes': ('collapse',)
        }),
        ('Pricing', {
            'fields': ('starting_price', 'guarantee_amount')
        }),
        ('Relationships', {
            'fields': ('pdf_upload', 'auction_group')
        }),
        ('Media & Links', {
            'fields': ('image_url', 'original_pdf_url'),
            'classes': ('collapse',)
        }),
        ('Metadata', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

@admin.register(Listing)
class ListingAdmin(ListingAdmin):
    pass
