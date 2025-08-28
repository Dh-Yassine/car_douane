from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q
from django.db import transaction
from decimal import Decimal
import os
import json
from urllib.parse import urlparse
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from django.shortcuts import render
from rest_framework.decorators import action
from rest_framework.response import Response
from django.contrib.auth.models import User
from django.http import JsonResponse
from .models import Listing, PDFUpload, AuctionGroup
from .serializers import (
    ListingSerializer, ListingListSerializer, ListingCreateSerializer, PDFUploadSerializer,
    PDFUploadCreateSerializer, AuctionGroupSerializer
)
from .mixins import CORSViewSetMixin


class ListingViewSet(CORSViewSetMixin, viewsets.ModelViewSet):
    """ViewSet for auction listings"""
    queryset = Listing.objects.select_related('pdf_upload', 'auction_group').all()
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = {
        'listing_type': ['exact'],
        'brand': ['exact', 'icontains'],
        'fuel_type': ['exact'],
        'year': ['exact', 'gte', 'lte'],
        'starting_price': ['gte', 'lte'],
        'pdf_upload__city': ['exact', 'icontains'],
        'pdf_upload__auction_date': ['exact', 'gte', 'lte'],
        'auction_group': ['exact'],
    }
    search_fields = ['title', 'brand', 'model', 'lot_number', 'short_description']
    ordering_fields = ['lot_number', 'starting_price', 'created_at', 'year']
    ordering = ['-created_at']
    
    def get_serializer_class(self):
        """Use different serializers for list and detail views"""
        if self.action == 'list':
            return ListingListSerializer
        elif self.action == 'create':
            return ListingCreateSerializer
        return ListingSerializer
    
    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Get listing statistics"""
        total_listings = Listing.objects.count()
        vehicle_count = Listing.objects.filter(listing_type='vehicle').count()
        goods_count = Listing.objects.filter(listing_type='goods').count()
        cities = Listing.objects.values_list('pdf_upload__city', flat=True).distinct()
        
        return Response({
            'total_listings': total_listings,
            'vehicle_count': vehicle_count,
            'goods_count': goods_count,
            'cities': list(cities),
        })
    
    @action(detail=False, methods=['get'])
    def brands(self, request):
        """Get all available brands"""
        brands = Listing.objects.exclude(brand='').values_list('brand', flat=True).distinct()
        return Response({'brands': list(brands)})
    
    @action(detail=False, methods=['get'])
    def cities(self, request):
        """Get all available cities"""
        cities = Listing.objects.values_list('pdf_upload__city', flat=True).distinct()
        return Response({'cities': list(cities)})
    
    @action(detail=False, methods=['get'])
    def admin_list(self, request):
        """Get all listings for admin view without pagination"""
        queryset = self.filter_queryset(self.get_queryset())
        serializer = self.get_serializer(queryset, many=True)
        return Response({
            'results': serializer.data,
            'count': queryset.count(),
            'admin_view': True
        })
    
    @action(detail=False, methods=['post'])
    def set_deadlines_by_date_range(self, request):
        """Set deadlines for listings within a date range"""
        from datetime import datetime, timedelta
        from django.utils import timezone
        
        start_date = request.data.get('start_date')
        end_date = request.data.get('end_date')
        deadline_days = request.data.get('deadline_days', 30)  # Default 30 days from now
        
        if not start_date or not end_date:
            return Response({
                'error': 'start_date and end_date are required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            start_date = datetime.strptime(start_date, '%Y-%m-%d').date()
            end_date = datetime.strptime(end_date, '%Y-%m-%d').date()
        except ValueError:
            return Response({
                'error': 'Invalid date format. Use YYYY-MM-DD'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Debug: Log the date range and total listings
        total_listings = Listing.objects.count()
        listings_with_auction_dates = Listing.objects.filter(pdf_upload__auction_date__isnull=False).count()
        
        # Find listings within the date range
        listings = Listing.objects.filter(
            pdf_upload__auction_date__gte=start_date,
            pdf_upload__auction_date__lte=end_date
        )
        
        # Debug: Log what we found
        found_count = listings.count()
        
        # Set deadline
        deadline = timezone.now() + timedelta(days=deadline_days)
        updated_count = listings.update(deadline=deadline)
        
        return Response({
            'message': f'Set deadline for {updated_count} listings',
            'deadline': deadline.isoformat(),
            'updated_count': updated_count,
            'debug_info': {
                'total_listings': total_listings,
                'listings_with_auction_dates': listings_with_auction_dates,
                'found_in_date_range': found_count,
                'date_range': f'{start_date} to {end_date}'
            }
        })
    
    @action(detail=False, methods=['post'])
    def set_deadlines_by_pdf(self, request):
        """Set deadlines for all listings belonging to a specific PDF/JSON file"""
        from datetime import datetime, timedelta
        from django.utils import timezone
        
        pdf_upload_id = request.data.get('pdf_upload_id')
        deadline_days = request.data.get('deadline_days', 30)  # Default 30 days from now
        
        if not pdf_upload_id:
            return Response({
                'error': 'pdf_upload_id is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            # Find the PDF upload
            pdf_upload = PDFUpload.objects.get(id=pdf_upload_id)
            
            # Find all listings for this PDF
            listings = Listing.objects.filter(pdf_upload=pdf_upload)
            found_count = listings.count()
            
            if found_count == 0:
                return Response({
                    'error': f'No listings found for PDF: {pdf_upload.filename}'
                }, status=status.HTTP_404_NOT_FOUND)
            
            # Set deadline
            deadline = timezone.now() + timedelta(days=deadline_days)
            updated_count = listings.update(deadline=deadline)
            
            return Response({
                'message': f'Set deadline for {updated_count} listings from {pdf_upload.filename}',
                'deadline': deadline.isoformat(),
                'updated_count': updated_count,
                'pdf_filename': pdf_upload.filename,
                'pdf_city': pdf_upload.city,
                'pdf_auction_date': pdf_upload.auction_date.isoformat()
            })
            
        except PDFUpload.DoesNotExist:
            return Response({
                'error': f'PDF upload with ID {pdf_upload_id} not found'
            }, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({
                'error': f'Error setting deadlines: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=False, methods=['get'])
    def debug_listings(self, request):
        """Debug endpoint to see what listings exist and their auction dates"""
        from django.utils import timezone
        
        # Get sample listings with their auction dates
        sample_listings = Listing.objects.select_related('pdf_upload').all()[:10]
        
        debug_data = []
        for listing in sample_listings:
            debug_data.append({
                'id': listing.id,
                'title': listing.title,
                'lot_number': listing.lot_number,
                'pdf_upload_id': listing.pdf_upload.id if listing.pdf_upload else None,
                'pdf_filename': listing.pdf_upload.filename if listing.pdf_upload else None,
                'auction_date': listing.pdf_upload.auction_date.isoformat() if listing.pdf_upload and listing.pdf_upload.auction_date else None,
                'city': listing.pdf_upload.city if listing.pdf_upload else None,
                'deadline': listing.deadline.isoformat() if listing.deadline else None,
                'deadline_status': listing.deadline_status,
            })
        
        total_listings = Listing.objects.count()
        listings_with_auction_dates = Listing.objects.filter(pdf_upload__auction_date__isnull=False).count()
        listings_with_deadlines = Listing.objects.filter(deadline__isnull=False).count()
        
        return Response({
            'debug_info': {
                'total_listings': total_listings,
                'listings_with_auction_dates': listings_with_auction_dates,
                'listings_with_deadlines': listings_with_deadlines,
                'sample_listings': debug_data
            }
        })
    
    @action(detail=False, methods=['get'])
    def expired_listings(self, request):
        """Get expired listings"""
        from django.utils import timezone
        
        expired_listings = Listing.objects.filter(
            deadline__lt=timezone.now()
        ).select_related('pdf_upload', 'auction_group')
        
        serializer = self.get_serializer(expired_listings, many=True)
        return Response({
            'results': serializer.data,
            'count': expired_listings.count()
        })
    
    @action(detail=False, methods=['get'])
    def urgent_listings(self, request):
        """Get listings with urgent deadlines (1 day or less)"""
        from django.utils import timezone
        from datetime import timedelta
        
        urgent_deadline = timezone.now() + timedelta(days=1)
        urgent_listings = Listing.objects.filter(
            deadline__lte=urgent_deadline,
            deadline__gt=timezone.now()
        ).select_related('pdf_upload', 'auction_group')
        
        serializer = self.get_serializer(urgent_listings, many=True)
        return Response({
            'results': serializer.data,
            'count': urgent_listings.count()
        })


class PDFUploadViewSet(CORSViewSetMixin, viewsets.ModelViewSet):
    """ViewSet for PDF uploads"""
    queryset = PDFUpload.objects.all()
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['city', 'auction_date', 'processed']
    search_fields = ['filename', 'city']
    ordering_fields = ['uploaded_at', 'auction_date', 'filename']
    ordering = ['-uploaded_at']
    
    def get_serializer_class(self):
        if self.action == 'create':
            return PDFUploadCreateSerializer
        return PDFUploadSerializer
    
    def _get_root_txt_path(self, pdf_upload: PDFUpload) -> str:
        # backend/listings/views.py -> backend/ -> project root
        current_file = os.path.abspath(__file__)
        backend_dir = os.path.dirname(os.path.dirname(current_file))
        root_dir = os.path.dirname(backend_dir)
        base_name = os.path.splitext(pdf_upload.filename)[0]
        txt_filename = f"{base_name}.txt"
        return os.path.join(root_dir, txt_filename)

    def _parse_decimal(self, value, default=Decimal('0')):
        try:
            if value is None:
                return default
            if isinstance(value, (int, float, Decimal)):
                return Decimal(str(value))
            cleaned = ''.join(ch for ch in str(value) if ch.isdigit() or ch in ['.', ','])
            if cleaned.count(',') == 1 and cleaned.count('.') == 0:
                cleaned = cleaned.replace(',', '.')
            return Decimal(cleaned) if cleaned else default
        except Exception:
            return default

    def _normalize_unsplash_url(self, url: str) -> str:
        """Convert Unsplash page URLs to a direct, embeddable image URL.
        - If url is images.unsplash.com, return as-is
        - If url is unsplash.com/photos/<id>/..., convert to source.unsplash.com/<id>/1200x800
        - If url is source.unsplash.com/... resolve redirect to final images.unsplash.com URL
        """
        try:
            if not url:
                return ''
            parsed = urlparse(url)
            host = (parsed.netloc or '').lower()
            path = parsed.path or ''
            if 'images.unsplash.com' in host:
                return url
            if 'source.unsplash.com' in host:
                # Resolve redirect to a concrete image URL for better reliability
                try:
                    import requests
                    resp = requests.get(url, allow_redirects=True, timeout=8, stream=True)
                    final_url = resp.url or url
                    try:
                        resp.close()
                    except Exception:
                        pass
                    return final_url
                except Exception:
                    # Fall back to original URL
                    return url
            if 'unsplash.com' in host and '/photos/' in path:
                parts = [p for p in path.split('/') if p]
                # parts like ['photos', '<id>', ...]
                photo_id = parts[1] if len(parts) >= 2 and parts[0] == 'photos' else ''
                if photo_id:
                    # Use source endpoint which 302s to a proper image
                    return f"https://source.unsplash.com/{photo_id}/1200x800"
        except Exception:
            pass
        return url

    def _search_unsplash_first(self, query: str) -> str:
        """Search Unsplash API for the first image URL (regular) if key is set.
        Returns empty string on error or if key missing.
        """
        try:
            access_key = os.environ.get('UNSPLASH_ACCESS_KEY')
            if not access_key:
                return ''
            import requests
            resp = requests.get(
                'https://api.unsplash.com/search/photos',
                params={
                    'query': query,
                    'per_page': 1,
                    'content_filter': 'high'
                },
                headers={
                    'Accept': 'application/json',
                    'Authorization': f'Client-ID {access_key}'
                },
                timeout=8
            )
            if resp.status_code != 200:
                return ''
            data = resp.json() or {}
            results = data.get('results') or []
            if not results:
                return ''
            urls = results[0].get('urls') or {}
            # Prefer regular; fall back to small
            return urls.get('regular') or urls.get('small') or ''
        except Exception:
            return ''

    @action(detail=True, methods=['post'])
    def extract_txt(self, request, pk=None):
        """Extract text from the PDF and write a TXT to project root (for n8n)."""
        pdf_upload = self.get_object()
        try:
            from ocr_parser.parser import PDFParser
            parser = PDFParser()
            pdf_path = pdf_upload.file.path
            text = parser.extract_text(pdf_path)
            if not text:
                return Response({
                    'status': 'failed',
                    'message': 'No text extracted'
                }, status=status.HTTP_400_BAD_REQUEST)

            txt_path = self._get_root_txt_path(pdf_upload)
            os.makedirs(os.path.dirname(txt_path), exist_ok=True)
            with open(txt_path, 'w', encoding='utf-8-sig') as f:
                f.write(text)
            size = os.path.getsize(txt_path)
            return Response({
                'status': 'completed',
                'txt_path': txt_path,
                'size_bytes': size,
            })
        except Exception as e:
            return Response({
                'status': 'error',
                'message': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=True, methods=['get'])
    def txt(self, request, pk=None):
        """Return TXT content from the project root for this PDF upload."""
        pdf_upload = self.get_object()
        txt_path = self._get_root_txt_path(pdf_upload)
        if not os.path.exists(txt_path):
            return Response({'error': 'TXT not found', 'txt_path': txt_path}, status=status.HTTP_404_NOT_FOUND)
        try:
            with open(txt_path, 'r', encoding='utf-8') as f:
                content = f.read()
        except UnicodeDecodeError:
            with open(txt_path, 'r', encoding='utf-8-sig') as f:
                content = f.read()
        return Response({'txt_path': txt_path, 'txt': content})

    @transaction.atomic
    def _import_listings(self, pdf_upload: PDFUpload, data: dict) -> int:
        listings = data.get('listings') or []
        created = 0
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

                starting_price = self._parse_decimal(
                    item.get('starting_price', item.get('estimated_value')),
                    Decimal('0')
                )
                guarantee_amount = self._parse_decimal(
                    item.get('guarantee_amount'),
                    starting_price * Decimal('0.10')
                )

                lot_number = str(item.get('lot_number') or '').strip()
                if not lot_number:
                    while True:
                        candidate = str(next_lot_seq).zfill(3)
                        next_lot_seq += 1
                        if candidate not in existing_lots:
                            lot_number = candidate
                            existing_lots.add(candidate)
                            break

                # Resolve image URL
                raw_image_url = str(item.get('image_url') or '').strip()
                resolved_image_url = ''
                if raw_image_url:
                    if 'google.com/search' in raw_image_url:
                        resolved_image_url = ''
                    elif 'unsplash.com' in raw_image_url and 'images.unsplash.com' not in raw_image_url:
                        resolved_image_url = self._normalize_unsplash_url(raw_image_url)
                    else:
                        resolved_image_url = raw_image_url

                if not resolved_image_url:
                    # Compose a query for Unsplash if key is available
                    query_parts = []
                    if brand:
                        query_parts.append(brand)
                    if model:
                        query_parts.append(model)
                    if year:
                        query_parts.append(str(year))
                    # Title as last resort to keep query concise
                    if not query_parts and title:
                        query_parts.append(title)
                    query = ' '.join(query_parts) or 'vehicle'
                    resolved_image_url = self._search_unsplash_first(query)

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
                    image_url=resolved_image_url,
                    original_pdf_url=str(item.get('original_pdf_url') or ''),
                )
                created += 1
            except Exception:
                continue

        pdf_upload.processed = True if created > 0 else pdf_upload.processed
        pdf_upload.total_listings = (pdf_upload.total_listings or 0) + created
        pdf_upload.save(update_fields=['processed', 'total_listings'])
        return created

    @action(detail=True, methods=['post'])
    def import_json(self, request, pk=None):
        """Import listings JSON (either multipart file 'file' or raw JSON body)."""
        pdf_upload = self.get_object()
        try:
            if 'file' in request.FILES:
                content = request.FILES['file'].read().decode('utf-8')
                data = json.loads(content)
            else:
                # Accept application/json body
                data = request.data
                if isinstance(data, str):
                    data = json.loads(data)
            created = self._import_listings(pdf_upload, data)
            return Response({'imported': created})
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['post'])
    def import_json_no_pdf(self, request):
        """Import listings JSON without an existing PDF: creates a PDFUpload then imports."""
        try:
            # Read JSON
            if 'file' in request.FILES:
                content = request.FILES['file'].read().decode('utf-8')
                data = json.loads(content)
            else:
                data = request.data
                if isinstance(data, str):
                    data = json.loads(data)

            # Determine metadata
            city = data.get('city') or request.data.get('city') or 'Unknown'
            auction_date = data.get('auction_date') or request.data.get('auction_date')
            source_txt = data.get('source_txt') or request.data.get('source_txt') or 'import.json'

            if not auction_date:
                return Response({'error': 'auction_date is required (YYYY-MM-DD)'}, status=status.HTTP_400_BAD_REQUEST)

            # Create placeholder PDFUpload
            pdf_upload = PDFUpload.objects.create(
                file=None,  # FileField is required, but storage may allow None if null; model not null -> workaround
                filename=str(source_txt),
                city=str(city),
                auction_date=auction_date,
                processed=False,
                total_listings=0,
            )
        except Exception as e:
            return Response({'error': f'Invalid JSON or metadata: {e}'}, status=status.HTTP_400_BAD_REQUEST)

        # Import listings
        created = self._import_listings(pdf_upload, data)
        return Response({'pdf_upload_id': pdf_upload.id, 'imported': created})
    @action(detail=True, methods=['post'])
    def process(self, request, pk=None):
        """Process uploaded PDF to extract listings"""
        pdf_upload = self.get_object()
        
        from ocr_parser.services import OCRProcessingService
        
        service = OCRProcessingService()
        result = service.process_pdf_upload(pdf_upload)
        
        if result['success']:
            return Response({
                'message': result['message'],
                'status': 'completed',
                'listings_count': result['listings_count']
            })
        else:
            return Response({
                'message': result['message'],
                'status': 'failed'
            }, status=status.HTTP_400_BAD_REQUEST)


@method_decorator(csrf_exempt, name='dispatch')
class AuctionGroupViewSet(CORSViewSetMixin, viewsets.ReadOnlyModelViewSet):
    """ViewSet for auction groups"""
    queryset = AuctionGroup.objects.all()
    serializer_class = AuctionGroupSerializer
    ordering = ['order']

def create_superuser_api(request):
    """Create superuser via API endpoint"""
    if request.method == 'POST':
        try:
            # Check if superuser already exists
            if User.objects.filter(is_superuser=True).exists():
                return JsonResponse({
                    'success': False,
                    'message': 'Superuser already exists!',
                    'admin_url': 'https://car-douane.onrender.com/admin/'
                })
            
            # Create superuser
            username = 'admin'
            email = 'admin@cardouane.tn'
            password = 'admin123456'
            
            user = User.objects.create_superuser(
                username=username,
                email=email,
                password=password
            )
            
            return JsonResponse({
                'success': True,
                'message': 'Superuser created successfully!',
                'credentials': {
                    'username': username,
                    'email': email,
                    'password': password
                },
                'admin_url': 'https://car-douane.onrender.com/admin/'
            })
            
        except Exception as e:
            return JsonResponse({
                'success': False,
                'message': f'Error creating superuser: {str(e)}'
            })
    
    return JsonResponse({
        'success': False,
        'message': 'Use POST method to create superuser'
    })
