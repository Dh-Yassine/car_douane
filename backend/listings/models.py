from django.db import models
from django.utils import timezone
import os


def pdf_upload_path(instance, filename):
    """Generate file path for uploaded PDFs"""
    # Extract city and date from filename for better organization
    name, ext = os.path.splitext(filename)
    return f'pdfs/{instance.city}/{instance.auction_date}/{filename}'


class AuctionGroup(models.Model):
    """Represents auction groups (المجموعة الأولى, الثانية, etc.)"""
    name = models.CharField(max_length=100)  # e.g., "المجموعة الأولى"
    name_ar = models.CharField(max_length=100, blank=True)  # Arabic name
    name_fr = models.CharField(max_length=100, blank=True)  # French name
    order = models.IntegerField(default=0)  # For sorting groups
    
    class Meta:
        ordering = ['order']
    
    def __str__(self):
        return self.name


class PDFUpload(models.Model):
    """Represents uploaded PDF files with metadata"""
    file = models.FileField(upload_to=pdf_upload_path)
    filename = models.CharField(max_length=255)
    city = models.CharField(max_length=100)  # e.g., "Kef", "Sidi Bouzid"
    auction_date = models.DateField()
    uploaded_at = models.DateTimeField(default=timezone.now)
    processed = models.BooleanField(default=False)
    total_listings = models.IntegerField(default=0)
    
    class Meta:
        ordering = ['-uploaded_at']
    
    def __str__(self):
        return f"{self.city} - {self.auction_date} ({self.filename})"


class Listing(models.Model):
    """Represents individual auction listings"""
    
    LISTING_TYPES = [
        ('vehicle', 'Vehicle'),
        ('goods', 'Goods'),
        ('tools', 'Tools'),
        ('other', 'Other'),
    ]
    
    FUEL_TYPES = [
        ('diesel', 'Diesel'),
        ('petrol', 'Petrol'),
        ('electric', 'Electric'),
        ('hybrid', 'Hybrid'),
        ('other', 'Other'),
    ]
    
    # Basic information
    lot_number = models.CharField(max_length=20)
    title = models.CharField(max_length=200)  # Brand + Model or Item name
    listing_type = models.CharField(max_length=20, choices=LISTING_TYPES)
    
    # Description fields
    short_description = models.TextField()  # Type, condition, location, auction date
    full_description = models.TextField()  # All extracted details
    
    # Vehicle-specific fields
    brand = models.CharField(max_length=100, blank=True)
    model = models.CharField(max_length=100, blank=True)
    year = models.IntegerField(null=True, blank=True)
    fuel_type = models.CharField(max_length=20, choices=FUEL_TYPES, blank=True)
    serial_number = models.CharField(max_length=100, blank=True)  # Chassis number for vehicles
    
    # Goods-specific fields
    quantity = models.CharField(max_length=50, blank=True)  # e.g., "26kg", "1 piece"
    unit = models.CharField(max_length=50, blank=True)  # e.g., "kilograms", "pieces"
    
    # Pricing
    starting_price = models.DecimalField(max_digits=12, decimal_places=2)
    guarantee_amount = models.DecimalField(max_digits=12, decimal_places=2)
    
    # Relationships
    pdf_upload = models.ForeignKey(PDFUpload, on_delete=models.CASCADE, related_name='listings')
    auction_group = models.ForeignKey(AuctionGroup, on_delete=models.SET_NULL, null=True, blank=True)
    
    # Images and links
    image_url = models.URLField(blank=True)  # Auto-fetched image
    original_pdf_url = models.URLField(blank=True)  # Link to original PDF
    
    # Metadata
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Deadline
    deadline = models.DateTimeField(null=True, blank=True, help_text="Deadline for this listing")
    
    class Meta:
        ordering = ['lot_number']
        unique_together = ['lot_number', 'pdf_upload']  # Prevent duplicate lots per PDF
    
    def __str__(self):
        return f"Lot {self.lot_number}: {self.title}"
    
    @property
    def display_title(self):
        """Generate a clean display title"""
        if self.listing_type == 'vehicle' and self.brand and self.model:
            year_str = f" {self.year}" if self.year else ""
            return f"{self.brand} {self.model}{year_str}"
        return self.title
    
    @property
    def formatted_price(self):
        """Format price with TND currency"""
        return f"{self.starting_price:,.0f} TND"
    
    @property
    def formatted_guarantee(self):
        """Format guarantee amount with TND currency"""
        return f"{self.guarantee_amount:,.0f} TND"
    
    @property
    def is_expired(self):
        """Check if the listing has passed its deadline"""
        if not self.deadline:
            return False
        return timezone.now() > self.deadline
    
    @property
    def days_until_deadline(self):
        """Get days remaining until deadline"""
        if not self.deadline:
            return None
        from datetime import datetime
        now = timezone.now()
        delta = self.deadline - now
        return delta.days
    
    @property
    def deadline_status(self):
        """Get deadline status for display"""
        if not self.deadline:
            return "no_deadline"
        if self.is_expired:
            return "expired"
        days = self.days_until_deadline
        if days <= 0:
            return "expired"
        elif days <= 1:
            return "urgent"
        elif days <= 3:
            return "warning"
        else:
            return "normal"
