from django.db import models
from django.utils.translation import gettext_lazy as _
from apps.core.models import BranchScopedModel

class AttendanceRecord(BranchScopedModel):
    worker = models.ForeignKey("labour.Worker", on_delete=models.CASCADE, related_name="attendance_records")
    clock_in = models.TimeField()
    clock_out = models.TimeField(null=True, blank=True)
    date = models.DateField(auto_now_add=True)
    biometric_gate = models.CharField(max_length=100, default="Gate #1 Main Turnstile")
    status = models.CharField(max_length=30, default="On Time")

    class Meta:
        db_table = "attendance_record"
        ordering = ["-date", "-clock_in"]

    def __str__(self):
        return f"{self.worker.name} @ {self.date} ({self.status})"