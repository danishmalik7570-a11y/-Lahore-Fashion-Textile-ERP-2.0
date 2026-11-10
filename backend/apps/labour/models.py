from django.db import models
from django.utils.translation import gettext_lazy as _
from apps.core.models import BranchScopedModel, money_field

class Worker(BranchScopedModel):
    class Department(models.TextChoices):
        WEAVE = "Weave Shed", _("Weave Shed")
        DYE = "Dye House", _("Dye House")
        PRINT = "Rotary Printing", _("Rotary Printing")
        STITCH = "Stitching Line", _("Stitching Line")
        QC = "QC Inspection", _("QC Inspection")
        WAREHOUSE = "Warehouse", _("Warehouse")

    class SkillGrade(models.TextChoices):
        MASTER = "Master (A+)", _("Master (A+)")
        SENIOR = "Senior (A)", _("Senior (A)")
        OPERATOR = "Operator (B)", _("Operator (B)")
        HELPER = "Helper (C)", _("Helper (C)")

    class Shift(models.TextChoices):
        A = "Shift A (Morning)", _("Shift A (Morning)")
        B = "Shift B (Evening)", _("Shift B (Evening)")
        C = "Shift C (Night)", _("Shift C (Night)")

    employee_code = models.CharField(max_length=30, unique=True, db_index=True)
    name = models.CharField(max_length=100)
    department = models.CharField(max_length=50, choices=Department.choices, default=Department.WEAVE)
    skill_grade = models.CharField(max_length=30, choices=SkillGrade.choices, default=SkillGrade.OPERATOR)
    shift = models.CharField(max_length=30, choices=Shift.choices, default=Shift.A)
    cnic = models.CharField(max_length=30)
    phone = models.CharField(max_length=30, blank=True)
    daily_rate = money_field(default=1800)
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = "labour_worker"
        ordering = ["name"]

    def __str__(self):
        return f"{self.employee_code} - {self.name}"