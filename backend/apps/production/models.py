import uuid
from decimal import Decimal
from django.db import models
from django.utils import timezone
from django.utils.translation import gettext_lazy as _
from apps.core.models import BranchScopedModel, qty_field, money_field, pct_field


class EntryChannel(models.TextChoices):
    KIOSK = "KIOSK", _("Department Kiosk Tablet")
    MOBILE = "MOBILE", _("Operator Smartphone App")
    MACHINE_IOT = "MACHINE_IOT", _("Machine Counter / IoT")
    SUPERVISOR_WEB = "SUPERVISOR_WEB", _("Supervisor Portal Entry")
    WHATSAPP_BOT = "WHATSAPP_BOT", _("Supervisor WhatsApp Channel")
    PAPER_LATE = "PAPER_LATE", _("Clerk Paper Late Entry")


class ProductionLot(BranchScopedModel):
    class Stage(models.TextChoices):
        YARN = "YARN", _("Yarn Bobbin")
        WEAVING = "WEAVING", _("Weaving Shed")
        GREY_INSPECT = "GREY_INSPECT", _("Grey Inspection")
        DYEING = "DYEING", _("Dyeing Jet House")
        PRINTING = "PRINTING", _("Rotary Print")
        CUTTING = "CUTTING", _("Laser Cutting")
        STITCHING = "STITCHING", _("Stitching Lines")
        PACKING = "PACKING", _("QC & Packaging")
        DISPATCH = "DISPATCH", _("Export Dispatch")

    lot_number = models.CharField(max_length=50, unique=True, db_index=True)
    order = models.ForeignKey("orders.Order", on_delete=models.CASCADE, related_name="lots", null=True, blank=True)
    client_name = models.CharField(max_length=150)
    fabric_spec = models.CharField(max_length=150)
    stage = models.CharField(max_length=30, choices=Stage.choices, default=Stage.WEAVING)
    target_meters = qty_field(default=10000)
    produced_meters = qty_field(default=0)
    loom_number = models.CharField(max_length=50)
    supervisor_name = models.CharField(max_length=100)
    efficiency_percent = models.PositiveSmallIntegerField(default=95)
    status = models.CharField(max_length=30, default="Optimal")
    last_scan_time = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "production_lot"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.lot_number} ({self.fabric_spec})"


class ScanEvent(BranchScopedModel):
    lot = models.ForeignKey(ProductionLot, on_delete=models.CASCADE, related_name="scans")
    stage = models.CharField(max_length=30)
    scanned_by = models.CharField(max_length=100)
    machine_id = models.CharField(max_length=50, blank=True)
    notes = models.TextField(blank=True)

    class Meta:
        db_table = "production_scan_event"


class KioskDevice(BranchScopedModel):
    device_code = models.CharField(max_length=50, unique=True, db_index=True)
    name = models.CharField(max_length=100)
    department = models.CharField(max_length=50)
    line = models.CharField(max_length=50, blank=True)
    location = models.CharField(max_length=100)
    status = models.CharField(max_length=20, default="ONLINE")
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    device_token = models.CharField(max_length=128, blank=True)
    battery_level = models.PositiveSmallIntegerField(default=100)
    app_version = models.CharField(max_length=20, default="2.4.0")
    is_locked = models.BooleanField(default=False)
    last_heartbeat = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "production_kiosk_device"
        ordering = ["department", "line"]

    def __str__(self):
        return f"{self.device_code} - {self.name} ({self.department})"


class BadgeScan(BranchScopedModel):
    kiosk = models.ForeignKey(KioskDevice, on_delete=models.CASCADE, related_name="badge_scans")
    worker = models.ForeignKey("labour.Worker", on_delete=models.CASCADE, related_name="badge_scans")
    session_token = models.CharField(max_length=64, unique=True, db_index=True)
    scanned_at = models.DateTimeField(auto_now_add=True)
    selfie_url = models.CharField(max_length=500, blank=True)
    expires_at = models.DateTimeField()
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = "production_badge_scan"
        ordering = ["-scanned_at"]


class OutputEntry(BranchScopedModel):
    class Status(models.TextChoices):
        PENDING = "PENDING", _("Pending Approval")
        APPROVED = "APPROVED", _("Supervisor Approved")
        REJECTED = "REJECTED", _("Rejected")
        ADJUSTED = "ADJUSTED", _("QC Adjusted")

    client_uuid = models.UUIDField(default=uuid.uuid4, unique=True, db_index=True)
    bundle_id = models.CharField(max_length=64, db_index=True)
    lot = models.ForeignKey(ProductionLot, on_delete=models.SET_NULL, null=True, blank=True, related_name="output_entries")
    operation_id = models.CharField(max_length=50)
    operation_name = models.CharField(max_length=100)
    worker = models.ForeignKey("labour.Worker", on_delete=models.CASCADE, related_name="output_entries")
    supervisor = models.ForeignKey("accounts.User", on_delete=models.SET_NULL, null=True, blank=True, related_name="supervised_entries")
    kiosk_device = models.ForeignKey(KioskDevice, on_delete=models.SET_NULL, null=True, blank=True, related_name="output_entries")
    channel = models.CharField(max_length=30, choices=EntryChannel.choices, default=EntryChannel.KIOSK)
    qty_good = models.PositiveIntegerField(default=0)
    qty_reject = models.PositiveIntegerField(default=0)
    reject_reason = models.CharField(max_length=100, blank=True)
    unit_rate = money_field(default=Decimal("15.00"))
    earnings_preview = money_field(default=Decimal("0.00"))
    occurred_at = models.DateTimeField(default=timezone.now)
    entered_at = models.DateTimeField(auto_now_add=True)
    is_late_entry = models.BooleanField(default=False)
    late_reason = models.CharField(max_length=255, blank=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    qc_sample_adjusted = models.IntegerField(default=0)
    supervisor_notes = models.TextField(blank=True)
    approved_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "production_output_entry"
        ordering = ["-occurred_at"]
        indexes = [
            models.Index(fields=["worker", "occurred_at"]),
            models.Index(fields=["bundle_id", "operation_id"]),
            models.Index(fields=["status", "occurred_at"]),
        ]

    def save(self, *args, **kwargs):
        if not self.earnings_preview or self.earnings_preview == Decimal("0.00"):
            self.earnings_preview = Decimal(self.qty_good) * Decimal(self.unit_rate)
        super().save(*args, **kwargs)


class MachineTelemetry(BranchScopedModel):
    machine_id = models.CharField(max_length=50, db_index=True)
    department = models.CharField(max_length=50)
    picks = models.BigIntegerField(default=0)
    rpm = models.PositiveIntegerField(default=0)
    run_time_minutes = models.PositiveIntegerField(default=0)
    meters_produced = qty_field(default=Decimal("0.0000"))
    temperature_c = models.DecimalField(max_digits=5, decimal_places=1, default=Decimal("0.0"))
    ph_level = models.DecimalField(max_digits=4, decimal_places=2, default=Decimal("7.00"))
    status = models.CharField(max_length=30, default="RUNNING")
    timestamp = models.DateTimeField(default=timezone.now, db_index=True)

    class Meta:
        db_table = "production_machine_telemetry"
        ordering = ["-timestamp"]


class StoppageLog(BranchScopedModel):
    machine_id = models.CharField(max_length=50, db_index=True)
    operator = models.ForeignKey("labour.Worker", on_delete=models.SET_NULL, null=True, blank=True, related_name="stoppages")
    kiosk_device = models.ForeignKey(KioskDevice, on_delete=models.SET_NULL, null=True, blank=True)
    reason_code = models.CharField(max_length=50)
    reason_display_ur = models.CharField(max_length=100)
    duration_seconds = models.PositiveIntegerField(default=0)
    started_at = models.DateTimeField(default=timezone.now)
    resolved_at = models.DateTimeField(null=True, blank=True)
    notes = models.TextField(blank=True)

    class Meta:
        db_table = "production_stoppage_log"
        ordering = ["-started_at"]


class EntryDraft(BranchScopedModel):
    source = models.CharField(max_length=30, default="whatsapp")
    raw_text = models.TextField()
    parsed_payload = models.JSONField(default=dict)
    status = models.CharField(max_length=20, default="DRAFT")
    confirmed_by = models.ForeignKey("accounts.User", on_delete=models.SET_NULL, null=True, blank=True)
    confirmed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "production_entry_draft"
        ordering = ["-created_at"]


class DataQualityRule(BranchScopedModel):
    code = models.CharField(max_length=50, unique=True)
    name = models.CharField(max_length=150)
    scope = models.CharField(max_length=50, default="ALL")
    condition_type = models.CharField(max_length=50)
    severity = models.CharField(max_length=20, default="WARNING")
    action = models.CharField(max_length=50, default="FLAG_ANOMALY")
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = "production_data_quality_rule"
        ordering = ["code"]


class AnomalyFlag(BranchScopedModel):
    class AnomalyType(models.TextChoices):
        SPIKE_OUTPUT = "SPIKE_OUTPUT", _("Production Spike Beyond 2x SAM")
        DUAL_MACHINE = "DUAL_MACHINE", _("Worker Active on Dual Machines/Kiosks")
        ABSENT_OUTPUT = "ABSENT_OUTPUT", _("Entry Generated for Absent Worker")
        ROUND_NUMBER = "ROUND_NUMBER", _("Suspicious Round Number Clumping")
        TOO_FAST_SCANS = "TOO_FAST_SCANS", _("Scans Under 10 Seconds Between Bundles")
        END_SHIFT_BURST = "END_SHIFT_BURST", _("Batch Dumps at Shift Conclusion")
        HIGH_REJECT_HIDDEN = "HIGH_REJECT_HIDDEN", _("Abnormally Zero Rejects on Defective Lot")

    entry = models.ForeignKey(OutputEntry, on_delete=models.SET_NULL, null=True, blank=True, related_name="anomalies")
    worker = models.ForeignKey("labour.Worker", on_delete=models.CASCADE, related_name="anomalies")
    kiosk = models.ForeignKey(KioskDevice, on_delete=models.SET_NULL, null=True, blank=True)
    anomaly_type = models.CharField(max_length=50, choices=AnomalyType.choices)
    severity = models.CharField(max_length=20, default="MEDIUM")
    description = models.TextField()
    flagged_at = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=20, default="OPEN")
    resolved_by = models.ForeignKey("accounts.User", on_delete=models.SET_NULL, null=True, blank=True)
    resolution_notes = models.TextField(blank=True)
    resolved_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "production_anomaly_flag"
        ordering = ["-flagged_at"]


class CorrectionRequest(BranchScopedModel):
    entry = models.ForeignKey(OutputEntry, on_delete=models.CASCADE, related_name="correction_requests")
    worker = models.ForeignKey("labour.Worker", on_delete=models.CASCADE, related_name="correction_requests")
    reason = models.TextField()
    old_qty = models.PositiveIntegerField()
    new_qty = models.PositiveIntegerField()
    status = models.CharField(max_length=20, default="PENDING")
    requested_at = models.DateTimeField(auto_now_add=True)
    reviewed_by = models.ForeignKey("accounts.User", on_delete=models.SET_NULL, null=True, blank=True)
    reviewed_at = models.DateTimeField(null=True, blank=True)
    supervisor_notes = models.TextField(blank=True)

    class Meta:
        db_table = "production_correction_request"
        ordering = ["-requested_at"]


class EntryAudit(BranchScopedModel):
    entry_id = models.UUIDField(db_index=True)
    action = models.CharField(max_length=30)
    changed_by = models.ForeignKey("accounts.User", on_delete=models.SET_NULL, null=True, blank=True)
    old_values = models.JSONField(default=dict)
    new_values = models.JSONField(default=dict)
    reason = models.CharField(max_length=255, blank=True)
    timestamp = models.DateTimeField(auto_now_add=True, db_index=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    channel = models.CharField(max_length=30, blank=True)

    class Meta:
        db_table = "production_entry_audit"
        ordering = ["-timestamp"]


class WorkerEntryScore(BranchScopedModel):
    worker = models.ForeignKey("labour.Worker", on_delete=models.CASCADE, related_name="entry_scores")
    period = models.CharField(max_length=30)
    timeliness_score = models.PositiveSmallIntegerField(default=95)
    accuracy_score = models.PositiveSmallIntegerField(default=98)
    late_pct = pct_field(default=Decimal("1.5000"))
    anomaly_count = models.PositiveIntegerField(default=0)
    audit_reject_rate = pct_field(default=Decimal("0.8000"))
    overall_tier = models.CharField(max_length=30, default="GOLD")

    class Meta:
        db_table = "production_worker_entry_score"
        ordering = ["-timeliness_score"]