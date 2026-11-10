from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import InvoiceViewSet

app_name = "finance"

router = DefaultRouter()
router.register(r"invoices", InvoiceViewSet, basename="invoice")

urlpatterns = [
    path("", include(router.urls)),
]