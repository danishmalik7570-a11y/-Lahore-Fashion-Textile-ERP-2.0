from rest_framework import serializers
from .models import (
    ProductionLot, ScanEvent, KioskDevice, BadgeScan, OutputEntry,
    MachineTelemetry, StoppageLog, EntryDraft, DataQualityRule,
    AnomalyFlag, CorrectionRequest, EntryAudit, WorkerEntryScore
)


class ScanEventSerializer(serializers.ModelSerializer):
    class Meta:
        model = ScanEvent
        fields = "__all__"


class ProductionLotSerializer(serializers.ModelSerializer):
    scans = ScanEventSerializer(many=True, read_only=True)

    class Meta:
        model = ProductionLot
        fields = "__all__"


class KioskDeviceSerializer(serializers.ModelSerializer):
    class Meta:
        model = KioskDevice
        fields = "__all__"


class BadgeScanSerializer(serializers.ModelSerializer):
    worker_name = serializers.CharField(source="worker.name", read_only=True)
    worker_code = serializers.CharField(source="worker.employee_code", read_only=True)

    class Meta:
        model = BadgeScan
        fields = "__all__"


class OutputEntrySerializer(serializers.ModelSerializer):
    worker_name = serializers.CharField(source="worker.name", read_only=True)
    worker_code = serializers.CharField(source="worker.employee_code", read_only=True)
    kiosk_code = serializers.CharField(source="kiosk_device.device_code", read_only=True)

    class Meta:
        model = OutputEntry
        fields = "__all__"


class MachineTelemetrySerializer(serializers.ModelSerializer):
    class Meta:
        model = MachineTelemetry
        fields = "__all__"


class StoppageLogSerializer(serializers.ModelSerializer):
    operator_name = serializers.CharField(source="operator.name", read_only=True)

    class Meta:
        model = StoppageLog
        fields = "__all__"


class EntryDraftSerializer(serializers.ModelSerializer):
    class Meta:
        model = EntryDraft
        fields = "__all__"


class DataQualityRuleSerializer(serializers.ModelSerializer):
    class Meta:
        model = DataQualityRule
        fields = "__all__"


class AnomalyFlagSerializer(serializers.ModelSerializer):
    worker_name = serializers.CharField(source="worker.name", read_only=True)
    worker_code = serializers.CharField(source="worker.employee_code", read_only=True)
    entry_bundle = serializers.CharField(source="entry.bundle_id", read_only=True)

    class Meta:
        model = AnomalyFlag
        fields = "__all__"


class CorrectionRequestSerializer(serializers.ModelSerializer):
    worker_name = serializers.CharField(source="worker.name", read_only=True)
    bundle_id = serializers.CharField(source="entry.bundle_id", read_only=True)

    class Meta:
        model = CorrectionRequest
        fields = "__all__"


class EntryAuditSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source="changed_by.name", read_only=True)

    class Meta:
        model = EntryAudit
        fields = "__all__"


class WorkerEntryScoreSerializer(serializers.ModelSerializer):
    worker_name = serializers.CharField(source="worker.name", read_only=True)
    worker_code = serializers.CharField(source="worker.employee_code", read_only=True)

    class Meta:
        model = WorkerEntryScore
        fields = "__all__"