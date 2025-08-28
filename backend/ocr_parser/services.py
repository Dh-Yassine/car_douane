from typing import Dict, List, Optional
from django.db import transaction
from django.utils import timezone
from listings.models import Listing, PDFUpload, AuctionGroup
from .parser import PDFParser, extract_city_from_filename, extract_date_from_filename
import logging

logger = logging.getLogger(__name__)


class OCRProcessingService:
    """Service for processing PDF uploads and extracting listings"""
    
    def __init__(self):
        self.parser = PDFParser()
    
    def process_pdf_upload(self, pdf_upload: PDFUpload) -> Dict:
        """Process a PDF upload and create listings"""
        try:
            # Parse the PDF
            pdf_path = pdf_upload.file.path
            parsed_data = self.parser.parse_pdf(pdf_path)
            
            if not parsed_data:
                return {
                    'success': False,
                    'message': 'No data extracted from PDF',
                    'listings_count': 0
                }
            
            # Create listings in database
            listings_created = self._create_listings_from_parsed_data(pdf_upload, parsed_data)
            
            # Update PDF upload status
            pdf_upload.processed = True
            pdf_upload.total_listings = listings_created
            pdf_upload.save()
            
            return {
                'success': True,
                'message': f'Successfully processed {listings_created} listings',
                'listings_count': listings_created,
                'vehicles': len(parsed_data.get('vehicles', [])),
                'goods': len(parsed_data.get('goods', []))
            }
            
        except Exception as e:
            logger.error(f"Error processing PDF upload {pdf_upload.id}: {e}")
            return {
                'success': False,
                'message': f'Error processing PDF: {str(e)}',
                'listings_count': 0
            }
    
    @transaction.atomic
    def _create_listings_from_parsed_data(self, pdf_upload: PDFUpload, parsed_data: Dict) -> int:
        """Create listing objects from parsed data"""
        listings_created = 0
        
        # Process vehicles
        for vehicle_data in parsed_data.get('vehicles', []):
            try:
                listing = self._create_vehicle_listing(pdf_upload, vehicle_data)
                if listing:
                    listings_created += 1
            except Exception as e:
                logger.error(f"Error creating vehicle listing: {e}")
                continue
        
        # Process goods
        for goods_data in parsed_data.get('goods', []):
            try:
                listing = self._create_goods_listing(pdf_upload, goods_data)
                if listing:
                    listings_created += 1
            except Exception as e:
                logger.error(f"Error creating goods listing: {e}")
                continue
        
        return listings_created
    
    def _create_vehicle_listing(self, pdf_upload: PDFUpload, vehicle_data: Dict) -> Optional[Listing]:
        """Create a vehicle listing from parsed data"""
        try:
            # Extract lot number from description or generate one
            lot_number = self._extract_lot_number(vehicle_data.get('description', ''))
            if not lot_number:
                lot_number = self._generate_lot_number(pdf_upload)
            
            # Create title from brand and description
            title = self._create_vehicle_title(vehicle_data)
            
            # Create short description
            short_desc = self._create_vehicle_short_description(vehicle_data, pdf_upload)
            
            listing = Listing.objects.create(
                lot_number=lot_number,
                title=title,
                listing_type='vehicle',
                short_description=short_desc,
                full_description=vehicle_data.get('description', ''),
                brand=vehicle_data.get('brand', ''),
                serial_number=vehicle_data.get('serial', ''),
                starting_price=vehicle_data.get('price_tnd', 0),
                guarantee_amount=vehicle_data.get('guarantee_tnd', 0),
                pdf_upload=pdf_upload
            )
            
            return listing
            
        except Exception as e:
            logger.error(f"Error creating vehicle listing: {e}")
            return None
    
    def _create_goods_listing(self, pdf_upload: PDFUpload, goods_data: Dict) -> Optional[Listing]:
        """Create a goods listing from parsed data"""
        try:
            # Extract lot number or generate one
            lot_number = self._generate_lot_number(pdf_upload)
            
            # Create title from item name
            title = goods_data.get('item', 'Unknown Item')
            
            # Create short description
            short_desc = self._create_goods_short_description(goods_data, pdf_upload)
            
            listing = Listing.objects.create(
                lot_number=lot_number,
                title=title,
                listing_type='goods',
                short_description=short_desc,
                full_description=goods_data.get('raw_match', ''),
                quantity=goods_data.get('quantity', ''),
                starting_price=0,  # Default for goods
                guarantee_amount=0,  # Default for goods
                pdf_upload=pdf_upload
            )
            
            return listing
            
        except Exception as e:
            logger.error(f"Error creating goods listing: {e}")
            return None
    
    def _extract_lot_number(self, text: str) -> Optional[str]:
        """Extract lot number from text"""
        import re
        # Look for 2-digit numbers that might be lot numbers
        lot_pattern = re.compile(r'\b(\d{2})\b')
        matches = lot_pattern.findall(text)
        return matches[0] if matches else None
    
    def _generate_lot_number(self, pdf_upload: PDFUpload) -> str:
        """Generate a unique lot number for the PDF upload"""
        # Get the next available lot number for this PDF
        existing_lots = Listing.objects.filter(pdf_upload=pdf_upload).values_list('lot_number', flat=True)
        
        if not existing_lots:
            return "01"
        
        # Find the next available number
        used_numbers = set(int(lot) for lot in existing_lots if lot.isdigit())
        next_number = 1
        while next_number in used_numbers:
            next_number += 1
        
        return f"{next_number:02d}"
    
    def _create_vehicle_title(self, vehicle_data: Dict) -> str:
        """Create a title for vehicle listing"""
        brand = vehicle_data.get('brand', '')
        description = vehicle_data.get('description', '')
        
        if brand:
            return f"{brand} {description}".strip()
        return description or "Vehicle"
    
    def _create_vehicle_short_description(self, vehicle_data: Dict, pdf_upload: PDFUpload) -> str:
        """Create short description for vehicle"""
        parts = []
        
        # Add vehicle type
        parts.append("Car")
        
        # Add fuel type if available
        fuel_type = self._extract_fuel_type(vehicle_data.get('description', ''))
        if fuel_type:
            parts.append(fuel_type)
        
        # Add price
        price = vehicle_data.get('price_tnd', 0)
        if price:
            parts.append(f"starting at {price:,} TND")
        
        # Add city and date
        parts.append(f"{pdf_upload.city}, {pdf_upload.auction_date}")
        
        return ", ".join(parts)
    
    def _create_goods_short_description(self, goods_data: Dict, pdf_upload: PDFUpload) -> str:
        """Create short description for goods"""
        parts = []
        
        quantity = goods_data.get('quantity', '')
        item = goods_data.get('item', '')
        
        if quantity and item:
            parts.append(f"{quantity} {item}")
        elif item:
            parts.append(item)
        else:
            parts.append("Goods")
        
        # Add city and date
        parts.append(f"{pdf_upload.city}, {pdf_upload.auction_date}")
        
        return ", ".join(parts)
    
    def _extract_fuel_type(self, text: str) -> Optional[str]:
        """Extract fuel type from text"""
        text_lower = text.lower()
        
        fuel_types = {
            'diesel': ['diesel', 'قازوال', 'gasoil'],
            'petrol': ['petrol', 'بنزين', 'essence'],
            'electric': ['electric', 'كهربائي', 'électrique'],
            'hybrid': ['hybrid', 'هجين', 'hybride']
        }
        
        for fuel_type, keywords in fuel_types.items():
            for keyword in keywords:
                if keyword in text_lower:
                    return fuel_type
        
        return None


class ImageSearchService:
    """Service for fetching images for listings"""
    
    def __init__(self):
        # TODO: Add API keys for image search services
        self.api_key = None  # Will be set from environment variables
    
    def search_image(self, query: str) -> Optional[str]:
        """Search for an image based on query"""
        # TODO: Implement image search using Bing API or SerpAPI
        # For now, return a placeholder
        return None
    
    def update_listing_image(self, listing: Listing) -> bool:
        """Update listing with fetched image"""
        try:
            # Create search query
            if listing.listing_type == 'vehicle':
                query = f"{listing.brand} {listing.model} {listing.year or ''} car"
            else:
                query = listing.title
            
            # Search for image
            image_url = self.search_image(query)
            
            if image_url:
                listing.image_url = image_url
                listing.save()
                return True
            
            return False
            
        except Exception as e:
            logger.error(f"Error updating listing image: {e}")
            return False
