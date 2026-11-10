from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    ProductionLotViewSet, ScanEventViewSet, KioskDeviceViewSet,
    BadgeScanViewSet, OutputEntryViewSet, MachineTelemetryViewSet,
    StoppageLogViewSet, EntryDraftViewSet, DataQualityRuleViewSet,
    AnomalyFlagViewSet, CorrectionRequestViewSet, EntryAuditViewSet,
    WorkerEntryScoreViewSet
)

app_name = "production"

router = DefaultRouter()
router.register(r"lots", ProductionLotViewSet, basename="production-lot")
router.register(r"scans", ScanEventViewSet, basename="production-scan")
router.register(r"kiosks", KioskDeviceViewSet, basename="production-kiosk")
router.register(r"badge-scans", BadgeScanViewSet, basename="production-badge-scan")
router.register(r"output-entries", OutputEntryViewSet, basename="production-output-entry")
router.register(r"telemetry", MachineTelemetryViewSet, basename="production-telemetry")
router.register(r"stoppages", StoppageLogViewSet, basename="production-stoppage")
router.register(r"entry-drafts", EntryDraftViewSet, basename="production-entry-draft")
router.register(r"quality-rules", DataQualityRuleViewSet, basename="production-quality-rule")
router.register(r"anomalies", AnomalyFlagViewSet, basename="production-anomaly")
router.register(r"corrections", CorrectionRequestViewSet, basename="production-correction")
router.register(r"entry-audits", EntryAuditViewSet, basename="production-entry-audit")
router.register(r"scorecards", WorkerEntryScoreViewSet, basename="production-scorecard")

urlpatterns = [
    path("", include(router.urls)),
]