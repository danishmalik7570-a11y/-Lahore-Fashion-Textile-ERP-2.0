import uuid
from decimal import Decimal
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from .models import (
    ProductionLot, ScanEvent, KioskDevice, BadgeScan, OutputEntry,
    MachineTelemetry, StoppageLog, EntryDraft, DataQualityRule,
    AnomalyFlag, CorrectionRequest, EntryAudit, WorkerEntryScore
)
from .serializers import (
    ProductionLotSerializer, ScanEventSerializer, KioskDeviceSerializer,
    BadgeScanSerializer, OutputEntrySerializer, MachineTelemetrySerializer,
    StoppageLogSerializer, EntryDraftSerializer, DataQualityRuleSerializer,
    AnomalyFlagSerializer, CorrectionRequestSerializer, EntryAuditSerializer,
    WorkerEntryScoreSerializer
)
from .services import (
    FloorValidationEngine, FloorCrossCheckEngine, FloorAnomalyDetector,
    EarningsPreviewService, WhatsAppFloorParser
)


class ProductionLotViewSet(viewsets.ModelViewSet):
    queryset = ProductionLot.objects.all()
    serializer_class = ProductionLotSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ["stage", "status"]
    search_fields = ["lot_number", "client_name", "loom_number"]


class ScanEventViewSet(viewsets.ModelViewSet):
    queryset = ScanEvent.objects.all()
    serializer_class = ScanEventSerializer
    permission_classes = [permissions.IsAuthenticated]


class KioskDeviceViewSet(viewsets.ModelViewSet):
    queryset = KioskDevice.objects.all()
    serializer_class = KioskDeviceSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ["department", "status", "line"]
    search_fields = ["device_code", "name", "location"]

    @action(detail=True, methods=["post"])
    def heartbeat(self, request, pk=None):
        device = self.get_object()
        device.last_heartbeat = timezone.now()
        device.battery_level = request.data.get("battery_level", device.battery_level)
        device.status = "ONLINE"
        device.save(update_fields=["last_heartbeat", "battery_level", "status"])
        return Response({"status": "heartbeat_received", "device_code": device.device_code})

    @action(detail=True, methods=["post"])
    def toggle_lock(self, request, pk=None):
        device = self.get_object()
        device.is_locked = not device.is_locked
        device.save(update_fields=["is_locked"])
        return Response({"status": "updated", "is_locked": device.is_locked})


class BadgeScanViewSet(viewsets.ModelViewSet):
    queryset = BadgeScan.objects.all()
    serializer_class = BadgeScanSerializer
    permission_classes = [permissions.IsAuthenticated]

    @action(detail=False, methods=["post"])
    def auth(self, request):
        badge_code = request.data.get("badge_code")
        kiosk_id = request.data.get("kiosk_id")
        selfie_url = request.data.get("selfie_url", "")

        from apps.labour.models import Worker
        try:
            worker = Worker.objects.get(employee_code=badge_code)
        except Worker.DoesNotExist:
            return Response(
                {"error": "Invalid badge. Worker not found.", "urdu": "کارڈ درست نہیں ہے، کارکن نہیں ملا۔"},
                status=status.HTTP_404_NOT_FOUND
            )

        token = f"sess_{uuid.uuid4().hex[:24]}"
        expires_at = timezone.now() + timezone.timedelta(hours=10)

        kiosk_obj = None
        if kiosk_id:
            kiosk_obj = KioskDevice.objects.filter(id=kiosk_id).first()

        scan = BadgeScan.objects.create(
            worker=worker,
            kiosk=kiosk_obj or KioskDevice.objects.first(),
            session_token=token,
            selfie_url=selfie_url,
            expires_at=expires_at,
            branch=worker.branch
        )

        return Response({
            "session_token": token,
            "worker_id": str(worker.id),
            "worker_name": worker.name,
            "employee_code": worker.employee_code,
            "department": worker.department,
            "shift": worker.shift,
            "expires_at": expires_at.isoformat()
        })


class OutputEntryViewSet(viewsets.ModelViewSet):
    queryset = OutputEntry.objects.all()
    serializer_class = OutputEntrySerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ["status", "is_late_entry", "channel"]
    search_fields = ["bundle_id", "worker__name", "worker__employee_code"]

    @action(detail=False, methods=["post"])
    def submit_entry(self, request):
        data = request.data
        bundle_id = data.get("bundle_id")
        qty_good = int(data.get("qty_good", 0))
        qty_reject = int(data.get("qty_reject", 0))
        worker_id = data.get("worker_id")
        unit_rate = Decimal(str(data.get("unit_rate", "15.00")))
        client_uuid = data.get("client_uuid", str(uuid.uuid4()))

        # Idempotency check
        existing = OutputEntry.objects.filter(client_uuid=client_uuid).first()
        if existing:
            return Response(OutputEntrySerializer(existing).data, status=status.HTTP_200_OK)

        # Validation engine
        is_valid, msg_en, msg_ur = FloorValidationEngine.validate_entry(
            bundle_id=bundle_id,
            operation_id=data.get("operation_id", "OP-01"),
            worker_id=worker_id,
            qty_good=qty_good,
            qty_reject=qty_reject,
            bundle_total_qty=int(data.get("bundle_total_qty", 20))
        )

        if not is_valid:
            return Response({"error": msg_en, "urdu": msg_ur}, status=status.HTTP_400_BAD_REQUEST)

        # Create entry
        from apps.labour.models import Worker
        worker = Worker.objects.get(id=worker_id)
        earnings = Decimal(qty_good) * unit_rate

        entry = OutputEntry.objects.create(
            client_uuid=client_uuid,
            bundle_id=bundle_id,
            operation_id=data.get("operation_id", "OP-STITCH-01"),
            operation_name=data.get("operation_name", "Stitching Assembly"),
            worker=worker,
            qty_good=qty_good,
            qty_reject=qty_reject,
            reject_reason=data.get("reject_reason", ""),
            unit_rate=unit_rate,
            earnings_preview=earnings,
            channel=data.get("channel", "KIOSK"),
            is_late_entry=data.get("is_late_entry", False),
            late_reason=data.get("late_reason", ""),
            branch=worker.branch
        )

        # Audit
        EntryAudit.objects.create(
            entry_id=entry.id,
            action="CREATE",
            changed_by=request.user if request.user.is_authenticated else None,
            new_values={"qty_good": qty_good, "qty_reject": qty_reject, "bundle_id": bundle_id},
            reason="Floor Kiosk Submission",
            channel=data.get("channel", "KIOSK"),
            branch=worker.branch
        )

        # Live earnings preview
        earnings_summary = EarningsPreviewService.calculate_entry_earnings(
            qty_good=qty_good,
            unit_rate=unit_rate
        )

        response_data = OutputEntrySerializer(entry).data
        response_data["earnings_summary"] = earnings_summary
        return Response(response_data, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=["post"])
    def bulk_approve(self, request):
        entry_ids = request.data.get("entry_ids", [])
        updated = OutputEntry.objects.filter(id__in=entry_ids, status="PENDING").update(
            status="APPROVED",
            approved_at=timezone.now(),
            supervisor=request.user if request.user.is_authenticated else None
        )
        return Response({"approved_count": updated, "status": "success"})


class MachineTelemetryViewSet(viewsets.ModelViewSet):
    queryset = MachineTelemetry.objects.all()
    serializer_class = MachineTelemetrySerializer
    permission_classes = [permissions.IsAuthenticated]


class StoppageLogViewSet(viewsets.ModelViewSet):
    queryset = StoppageLog.objects.all()
    serializer_class = StoppageLogSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ["machine_id", "reason_code"]


class EntryDraftViewSet(viewsets.ModelViewSet):
    queryset = EntryDraft.objects.all()
    serializer_class = EntryDraftSerializer
    permission_classes = [permissions.IsAuthenticated]

    @action(detail=False, methods=["post"])
    def parse_whatsapp(self, request):
        text = request.data.get("text", "")
        sender = request.data.get("sender", "")
        parsed = WhatsAppFloorParser.parse_message(text=text, sender_phone=sender)
        return Response(parsed)


class DataQualityRuleViewSet(viewsets.ModelViewSet):
    queryset = DataQualityRule.objects.all()
    serializer_class = DataQualityRuleSerializer
    permission_classes = [permissions.IsAuthenticated]


class AnomalyFlagViewSet(viewsets.ModelViewSet):
    queryset = AnomalyFlag.objects.all()
    serializer_class = AnomalyFlagSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ["status", "severity", "anomaly_type"]

    @action(detail=True, methods=["post"])
    def resolve(self, request, pk=None):
        anomaly = self.get_object()
        anomaly.status = "RESOLVED"
        anomaly.resolved_by = request.user if request.user.is_authenticated else None
        anomaly.resolution_notes = request.data.get("notes", "Resolved by supervisor")
        anomaly.resolved_at = timezone.now()
        anomaly.save()
        return Response({"status": "resolved", "id": str(anomaly.id)})


class CorrectionRequestViewSet(viewsets.ModelViewSet):
    queryset = CorrectionRequest.objects.all()
    serializer_class = CorrectionRequestSerializer
    permission_classes = [permissions.IsAuthenticated]


class EntryAuditViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = EntryAudit.objects.all()
    serializer_class = EntryAuditSerializer
    permission_classes = [permissions.IsAuthenticated]


class WorkerEntryScoreViewSet(viewsets.ModelViewSet):
    queryset = WorkerEntryScore.objects.all()
    serializer_class = WorkerEntryScoreSerializer
    permission_classes = [permissions.IsAuthenticated]