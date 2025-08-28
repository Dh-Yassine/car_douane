from rest_framework import serializers
from .models import Listing, PDFUpload, AuctionGroup


class AuctionGroupSerializer(serializers.ModelSerializer):
    class Meta:
        model = AuctionGroup
        fields = ['id', 'name', 'name_ar', 'name_fr', 'order']


class PDFUploadSerializer(serializers.ModelSerializer):
    class Meta:
        model = PDFUpload
        fields = [
            'id', 'filename', 'city', 'auction_date', 
            'uploaded_at', 'processed', 'total_listings'
        ]
        read_only_fields = ['uploaded_at', 'processed', 'total_listings']


class ListingCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating new listings"""
    
    class Meta:
        model = Listing
        fields = [
            'lot_number', 'title', 'listing_type', 'short_description', 'full_description',
            'brand', 'model', 'year', 'fuel_type', 'serial_number', 'quantity', 'unit',
            'starting_price', 'guarantee_amount', 'image_url', 'original_pdf_url', 'deadline'
        ]
    
    def create(self, validated_data):
        """Create listing with default values for required fields"""
        # For now, we'll create a placeholder PDF upload if none exists
        # In a real scenario, you'd want to create this properly
        from .models import PDFUpload
        
        # Try to find an existing PDF upload or create a placeholder
        pdf_upload, created = PDFUpload.objects.get_or_create(
            filename=validated_data.get('original_pdf_url', 'unknown.pdf'),
            defaults={
                'city': 'Unknown',
                'auction_date': '2025-08-07',
                'file': 'placeholder.pdf'
            }
        )
        
        validated_data['pdf_upload'] = pdf_upload
        return super().create(validated_data)


class ListingSerializer(serializers.ModelSerializer):
    pdf_upload = PDFUploadSerializer(read_only=True)
    auction_group = AuctionGroupSerializer(read_only=True)
    display_title = serializers.ReadOnlyField()
    formatted_price = serializers.ReadOnlyField()
    formatted_guarantee = serializers.ReadOnlyField()
    is_expired = serializers.ReadOnlyField()
    days_until_deadline = serializers.ReadOnlyField()
    deadline_status = serializers.ReadOnlyField()
    
    class Meta:
        model = Listing
        fields = [
            'id', 'lot_number', 'title', 'display_title', 'listing_type',
            'short_description', 'full_description', 'brand', 'model', 'year',
            'fuel_type', 'serial_number', 'quantity', 'unit', 'starting_price',
            'formatted_price', 'guarantee_amount', 'formatted_guarantee',
            'pdf_upload', 'auction_group', 'image_url', 'original_pdf_url',
            'created_at', 'updated_at', 'deadline', 'is_expired', 'days_until_deadline', 'deadline_status'
        ]
        read_only_fields = ['created_at', 'updated_at']


class ListingListSerializer(serializers.ModelSerializer):
    """Simplified serializer for listing cards"""
    display_title = serializers.ReadOnlyField()
    formatted_price = serializers.ReadOnlyField()
    city = serializers.CharField(source='pdf_upload.city', read_only=True)
    auction_date = serializers.DateField(source='pdf_upload.auction_date', read_only=True)
    is_expired = serializers.ReadOnlyField()
    days_until_deadline = serializers.ReadOnlyField()
    deadline_status = serializers.ReadOnlyField()
    
    class Meta:
        model = Listing
        fields = [
            'id', 'lot_number', 'title', 'display_title', 'listing_type',
            'short_description', 'brand', 'model', 'year', 'fuel_type',
            'starting_price', 'formatted_price', 'image_url', 'city', 'auction_date',
            'deadline', 'is_expired', 'days_until_deadline', 'deadline_status'
        ]


class PDFUploadCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating PDF uploads"""
    file = serializers.FileField()
    
    class Meta:
        model = PDFUpload
        fields = ['file', 'city', 'auction_date']
    
    def validate_file(self, value):
        """Validate uploaded file"""
        if not value.name.lower().endswith('.pdf'):
            raise serializers.ValidationError("Only PDF files are allowed.")
        
        # Check file size (max 10MB)
        if value.size > 10 * 1024 * 1024:
            raise serializers.ValidationError("File size must be less than 10MB.")
        
        return value
    
    def create(self, validated_data):
        """Create PDF upload with filename"""
        validated_data['filename'] = validated_data['file'].name
        return super().create(validated_data)
