"""
URL configuration for douane_project project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/4.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.http import JsonResponse

def cors_test(request):
    """Simple endpoint to test CORS"""
    response = JsonResponse({
        'message': 'CORS is working!',
        'origin': request.headers.get('Origin', 'No origin'),
        'method': request.method,
        'cors_headers': {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
        }
    })
    response["Access-Control-Allow-Origin"] = "*"
    response["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS"
    response["Access-Control-Allow-Headers"] = "Content-Type"
    return response

def api_cors_test(request):
    """Test CORS for API endpoints"""
    response = JsonResponse({
        'message': 'API CORS test successful',
        'endpoint': '/api/cors-test/',
        'origin': request.headers.get('Origin', 'No origin'),
        'method': request.method,
    })
    response["Access-Control-Allow-Origin"] = "*"
    response["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS"
    response["Access-Control-Allow-Headers"] = "Content-Type"
    return response

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/cors-test/', cors_test, name='cors_test'),
    path('api/test/', api_cors_test, name='api_cors_test'),
    path('', include('listings.urls')),
]

# Serve media files during development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
