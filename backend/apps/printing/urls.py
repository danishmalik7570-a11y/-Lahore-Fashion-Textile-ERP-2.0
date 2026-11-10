from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    DocumentTypeViewSet, PaperPresetViewSet, PrintTemplateViewSet,
    TemplateAssetViewSet, PrintJobViewSet, verify_document_token
)

app_name = "printing"

router = DefaultRouter()
router.register(r"doc-types", DocumentTypeViewSet, basename="doc-type")
router.register(r"paper-presets", PaperPresetViewSet, basename="paper-preset")
router.register(r"templates", PrintTemplateViewSet, basename="template")
router.register(r"assets", TemplateAssetViewSet, basename="asset")
router.register(r"jobs", PrintJobViewSet, basename="job")

urlpatterns = [
    path("verify/<str:token>/", verify_document_token, name="verify-token"),
    path("", include(router.urls)),
]
