from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import QCAuditViewSet

app_name = "quality"

router = DefaultRouter()
router.register(r"", QCAuditViewSet, basename="qc-audit")

urlpatterns = [
    path("", include(router.urls)),
]