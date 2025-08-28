from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ListingViewSet, PDFUploadViewSet, AuctionGroupViewSet

router = DefaultRouter()
router.register(r'listings', ListingViewSet, basename='listing')
router.register(r'pdf-uploads', PDFUploadViewSet, basename='pdf-upload')
router.register(r'auction-groups', AuctionGroupViewSet, basename='auction-group')

urlpatterns = [
    path('api/', include(router.urls)),
]
