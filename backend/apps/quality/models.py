from django.db import models
from django.utils.translation import gettext_lazy as _
from apps.core.models import BranchScopedModel, qty_field

class QCAudit(BranchScopedModel):
    audit_number = models.CharField(max_length=50, unique=True, db_index=True)
    lot = models.ForeignKey("production.ProductionLot", on_delete=models.CASCADE, null=True, blank=True, related_name="qc_audits")
    lot_number_text = models.CharField(max_length=50, blank=True)
    fabric_spec = models.CharField(max_length=150)
    roll_number = models.CharField(max_length=50)
    inspected_meters = qty_field(default=100)
    warp_streak = models.PositiveSmallIntegerField(default=0)
    slub = models.PositiveSmallIntegerField(default=0)
    hole = models.PositiveSmallIntegerField(default=0)
    shade_var = models.PositiveSmallIntegerField(default=0)
    oil_stain = models.PositiveSmallIntegerField(default=0)
    total_defect_points = models.PositiveSmallIntegerField(default=0)
    points_per_100m = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    result = models.CharField(max_length=50, default="Pass - Grade A")
    auditor_name = models.CharField(max_length=100)

    class Meta:
        db_table = "quality_audit"
        ordering = ["-created_at"]

    def save(self, *args, **kwargs):
        if not self.audit_number:
            import random
            self.audit_number = f"QC-LF-2026-{random.randint(1000, 9999)}"
        self.total_defect_points = (
            self.warp_streak + self.slub + (self.hole * 4) + (self.shade_var * 2) + self.oil_stain
        )
        if self.inspected_meters > 0:
            self.points_per_100m = round((self.total_defect_points * 100) / float(self.inspected_meters), 2)
        if self.points_per_100m <= 15:
            self.result = "Pass - Grade A"
        elif self.points_per_100m <= 28:
            self.result = "Pass - Grade B"
        else:
            self.result = "Fail - Defective"
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.audit_number} - {self.result}"