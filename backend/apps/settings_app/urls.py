from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CompanySettingViewSet

app_name = "settings_app"

router = DefaultRouter()
router.register(r"", CompanySettingViewSet, basename="company-settings")

urlpatterns = [
    path("", include(router.urls)),
]