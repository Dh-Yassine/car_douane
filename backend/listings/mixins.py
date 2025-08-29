from rest_framework.viewsets import ModelViewSet


class CORSViewSetMixin(ModelViewSet):
    """Mixin to add permissive CORS headers to all ViewSet responses.

    This complements django-cors-headers and is mainly useful for local/dev
    and for debugging API access from multiple frontends.
    """

    def finalize_response(self, request, response, *args, **kwargs):  # type: ignore[override]
        response = super().finalize_response(request, response, *args, **kwargs)
        response["Access-Control-Allow-Origin"] = "*"
        response["Access-Control-Allow-Methods"] = "GET, POST, PUT, PATCH, DELETE, OPTIONS"
        response["Access-Control-Allow-Headers"] = "Content-Type, Authorization, X-Requested-With"
        return response


