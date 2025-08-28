#!/usr/bin/env python
"""
Script to add demo auction listings to the database
Run this with: python manage.py shell < add_demo_data.py
"""

import os
import django
from datetime import datetime, timedelta
import random

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'douane_project.settings')
django.setup()

from listings.models import Listing, PDFUpload, AuctionGroup

def create_demo_data():
    """Create demo auction listings"""
    
    # Create auction groups
    auction_groups = [
        {
            'name': 'Tunis Customs Auction',
            'city': 'Tunis',
            'auction_date': datetime.now().date() + timedelta(days=7),
            'description': 'Monthly customs auction in Tunis'
        },
        {
            'name': 'Sfax Customs Auction',
            'city': 'Sfax',
            'auction_date': datetime.now().date() + timedelta(days=14),
            'description': 'Monthly customs auction in Sfax'
        },
        {
            'name': 'Sousse Customs Auction',
            'city': 'Sousse',
            'auction_date': datetime.now().date() + timedelta(days=21),
            'description': 'Monthly customs auction in Sousse'
        }
    ]
    
    created_groups = []
    for group_data in auction_groups:
        group, created = AuctionGroup.objects.get_or_create(
            name=group_data['name'],
            defaults=group_data
        )
        created_groups.append(group)
        if created:
            print(f"Created auction group: {group.name}")
    
    # Create demo listings
    demo_listings = [
        {
            'lot_number': '001',
            'title': 'Mercedes C220 2010',
            'listing_type': 'vehicle',
            'brand': 'Mercedes',
            'model': 'C220',
            'year': 2010,
            'fuel_type': 'diesel',
            'starting_price': 15000.00,
            'guarantee_amount': 1500.00,
            'short_description': 'Mercedes C220, 2010, Diesel, Good condition',
            'full_description': 'Mercedes-Benz C220 CDI, 2010 model, diesel engine, automatic transmission, leather interior, well maintained',
            'city': 'Tunis',
            'auction_date': datetime.now().date() + timedelta(days=7),
            'image_url': 'https://via.placeholder.com/300x200?text=Mercedes+C220'
        },
        {
            'lot_number': '002',
            'title': 'Renault Clio 2015',
            'listing_type': 'vehicle',
            'brand': 'Renault',
            'model': 'Clio',
            'year': 2015,
            'fuel_type': 'petrol',
            'starting_price': 12500.00,
            'guarantee_amount': 1250.00,
            'short_description': 'Renault Clio, 2015, Petrol, Excellent condition',
            'full_description': 'Renault Clio, 2015 model, petrol engine, manual transmission, low mileage, excellent condition',
            'city': 'Sfax',
            'auction_date': datetime.now().date() + timedelta(days=14),
            'image_url': 'https://via.placeholder.com/300x200?text=Renault+Clio'
        },
        {
            'lot_number': '003',
            'title': 'Industrial Generator 50kW',
            'listing_type': 'goods',
            'brand': '',
            'model': '',
            'year': None,
            'fuel_type': '',
            'starting_price': 8000.00,
            'guarantee_amount': 800.00,
            'short_description': 'Industrial Generator, 50kW capacity, Used equipment',
            'full_description': 'Industrial generator with 50kW capacity, diesel powered, used condition, suitable for backup power',
            'city': 'Sousse',
            'auction_date': datetime.now().date() + timedelta(days=21),
            'image_url': 'https://via.placeholder.com/300x200?text=Generator'
        },
        {
            'lot_number': '004',
            'title': 'BMW X5 2012',
            'listing_type': 'vehicle',
            'brand': 'BMW',
            'model': 'X5',
            'year': 2012,
            'fuel_type': 'diesel',
            'starting_price': 25000.00,
            'guarantee_amount': 2500.00,
            'short_description': 'BMW X5, 2012, Diesel, Luxury SUV',
            'full_description': 'BMW X5 xDrive30d, 2012 model, diesel engine, automatic transmission, leather interior, navigation system',
            'city': 'Tunis',
            'auction_date': datetime.now().date() + timedelta(days=7),
            'image_url': 'https://via.placeholder.com/300x200?text=BMW+X5'
        },
        {
            'lot_number': '005',
            'title': 'Office Furniture Set',
            'listing_type': 'goods',
            'brand': '',
            'model': '',
            'year': None,
            'fuel_type': '',
            'starting_price': 3000.00,
            'guarantee_amount': 300.00,
            'short_description': 'Complete office furniture set, Modern design',
            'full_description': 'Complete office furniture set including desk, chair, filing cabinet, and bookshelf. Modern design, good condition',
            'city': 'Sfax',
            'auction_date': datetime.now().date() + timedelta(days=14),
            'image_url': 'https://via.placeholder.com/300x200?text=Office+Furniture'
        }
    ]
    
    for listing_data in demo_listings:
        listing, created = Listing.objects.get_or_create(
            lot_number=listing_data['lot_number'],
            defaults=listing_data
        )
        if created:
            print(f"Created listing: {listing.title} (Lot #{listing.lot_number})")
    
    print(f"\n✅ Demo data created successfully!")
    print(f"📊 Total listings: {Listing.objects.count()}")
    print(f"🏢 Total auction groups: {AuctionGroup.objects.count()}")

if __name__ == '__main__':
    create_demo_data()
