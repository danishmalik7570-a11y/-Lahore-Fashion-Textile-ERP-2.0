from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import DeliveryChallanViewSet

app_name = "delivery"

router = DefaultRouter()
router.register(r"", DeliveryChallanViewSet, basename="delivery-challan")

urlpatterns = [
    path("", include(router.urls)),
]