"""
HR App — Organisation Model, Employee Master (360° profile),
Recruitment, Leave, Payroll, Advances, Contractors, Performance,
Training, Safety, Discipline, Exit, Compliance.

This is the comprehensive HR & Labour Management module for a
200–2000 worker composite textile mill.
"""
import uuid
from decimal import Decimal
from datetime import date, time, timedelta

from django.conf import settings
from django.db import models
from django.utils import timezone
from django.utils.translation import gettext_lazy as _
from django.core.validators import MinValueValidator, MaxValueValidator

from apps.core.models import (
    BaseModel, AuditedModel, SoftDeleteModel, BranchScopedModel,
    money_field, qty_field, pct_field,
)


# ═══════════════════════════════════════════════════════════════════════════════
# §1  ORGANISATION MODEL
# ═══════════════════════════════════════════════════════════════════════════════


class Department(BranchScopedModel):
    """Department within a branch (e.g. Weaving, Dyeing, Stitching)."""
    code = models.CharField(max_length=20, db_index=True, verbose_name=_("Code"))
    name = models.CharField(max_length=100, verbose_name=_("Department Name"))
    name_ur = models.CharField(max_length=100, blank=True, verbose_name=_("Department Name (Urdu)"))
    parent = models.ForeignKey(
        "self", null=True, blank=True, on_delete=models.SET_NULL,
        related_name="sub_departments", verbose_name=_("Parent Department"),
    )
    head = models.ForeignKey(
        "hr.Employee", null=True, blank=True, on_delete=models.SET_NULL,
        related_name="headed_departments", verbose_name=_("Department Head"),
    )
    cost_centre_code = models.CharField(max_length=20, blank=True, verbose_name=_("Cost Centre Code"))
    sort_order = models.PositiveIntegerField(default=0)
    is_production = models.BooleanField(default=False, help_text=_("Is this a production department?"))
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = "hr_department"
        verbose_name = _("Department")
        verbose_name_plural = _("Departments")
        ordering = ["sort_order", "name"]
        unique_together = [("branch", "code")]

    def __str__(self):
        return f"{self.code} — {self.name}"


class Section(BranchScopedModel):
    """Section within a department (e.g. Warping, Sizing under Weaving)."""
    department = models.ForeignKey(
        Department, on_delete=models.CASCADE, related_name="sections",
        verbose_name=_("Department"),
    )
    code = models.CharField(max_length=20, db_index=True, verbose_name=_("Code"))
    name = models.CharField(max_length=100, verbose_name=_("Section Name"))
    supervisor = models.ForeignKey(
        "hr.Employee", null=True, blank=True, on_delete=models.SET_NULL,
        related_name="supervised_sections", verbose_name=_("Section Supervisor"),
    )
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = "hr_section"
        verbose_name = _("Section")
        verbose_name_plural = _("Sections")
        ordering = ["department", "name"]
        unique_together = [("department", "code")]

    def __str__(self):
        return f"{self.department.code}/{self.code} — {self.name}"


class Line(BranchScopedModel):
    """Production Line/Machine group within a section."""
    section = models.ForeignKey(
        Section, on_delete=models.CASCADE, related_name="lines",
        verbose_name=_("Section"),
    )
    code = models.CharField(max_length=20, db_index=True, verbose_name=_("Code"))
    name = models.CharField(max_length=100, verbose_name=_("Line/Machine Name"))
    capacity = models.PositiveIntegerField(default=0, help_text=_("Worker capacity"))
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = "hr_line"
        verbose_name = _("Line / Machine")
        verbose_name_plural = _("Lines / Machines")
        ordering = ["section", "code"]

    def __str__(self):
        return f"{self.section.code}/{self.code} — {self.name}"


class Designation(SoftDeleteModel):
    """Job title master (e.g. Weaving Master, Helper, Operator)."""
    code = models.CharField(max_length=20, unique=True, db_index=True, verbose_name=_("Code"))
    title = models.CharField(max_length=100, verbose_name=_("Designation Title"))
    title_ur = models.CharField(max_length=100, blank=True, verbose_name=_("Title (Urdu)"))
    level = models.PositiveSmallIntegerField(
        default=1, validators=[MinValueValidator(1), MaxValueValidator(20)],
        verbose_name=_("Hierarchy Level"),
        help_text=_("1 = lowest, 20 = highest"),
    )
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = "hr_designation"
        verbose_name = _("Designation")
        verbose_name_plural = _("Designations")
        ordering = ["level", "title"]

    def __str__(self):
        return self.title


class Grade(SoftDeleteModel):
    """Pay/grade master linked to salary structures."""
    code = models.CharField(max_length=10, unique=True, db_index=True, verbose_name=_("Grade Code"))
    name = models.CharField(max_length=50, verbose_name=_("Grade Name"))
    min_basic = money_field(verbose_name=_("Minimum Basic"))
    max_basic = money_field(verbose_name=_("Maximum Basic"))
    sort_order = models.PositiveSmallIntegerField(default=0)
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = "hr_grade"
        verbose_name = _("Grade")
        verbose_name_plural = _("Grades")
        ordering = ["sort_order"]

    def __str__(self):
        return f"{self.code} — {self.name}"


class CostCentre(SoftDeleteModel):
    """Cost centre for department-wise costing & GL mapping."""
    code = models.CharField(max_length=20, unique=True, db_index=True)
    name = models.CharField(max_length=100)
    department = models.ForeignKey(
        Department, null=True, blank=True, on_delete=models.SET_NULL,
        related_name="cost_centres",
    )
    gl_account_code = models.CharField(max_length=30, blank=True, help_text=_("Mapped GL account"))
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = "hr_cost_centre"
        verbose_name = _("Cost Centre")
        verbose_name_plural = _("Cost Centres")
        ordering = ["code"]

    def __str__(self):
        return f"{self.code} — {self.name}"


# ═══════════════════════════════════════════════════════════════════════════════
# §1.1  SHIFT MODEL
# ═══════════════════════════════════════════════════════════════════════════════


class Shift(SoftDeleteModel):
    """Shift master — defines working hours, breaks, grace periods."""
    code = models.CharField(max_length=10, unique=True, db_index=True, verbose_name=_("Shift Code"))
    name = models.CharField(max_length=50, verbose_name=_("Shift Name"))
    start_time = models.TimeField(verbose_name=_("Start Time"))
    end_time = models.TimeField(verbose_name=_("End Time"))
    break_start = models.TimeField(null=True, blank=True, verbose_name=_("Break Start"))
    break_end = models.TimeField(null=True, blank=True, verbose_name=_("Break End"))
    break_minutes = models.PositiveSmallIntegerField(default=60, verbose_name=_("Break Duration (min)"))
    grace_in_minutes = models.PositiveSmallIntegerField(
        default=15, verbose_name=_("Grace Period — Late (min)"),
    )
    grace_out_minutes = models.PositiveSmallIntegerField(
        default=10, verbose_name=_("Grace Period — Early Out (min)"),
    )
    is_night_shift = models.BooleanField(default=False, verbose_name=_("Night Shift?"))
    night_allowance_amount = money_field(
        default=Decimal("0"), verbose_name=_("Night Shift Allowance"),
    )
    working_hours = models.DecimalField(
        max_digits=4, decimal_places=2, default=Decimal("8.00"),
        verbose_name=_("Working Hours (excl. break)"),
    )
    is_active = models.BooleanField(default=True)
    color_hex = models.CharField(max_length=7, default="#3B82F6", verbose_name=_("Calendar Color"))

    class Meta:
        db_table = "hr_shift"
        verbose_name = _("Shift")
        verbose_name_plural = _("Shifts")
        ordering = ["start_time"]

    def __str__(self):
        return f"{self.code} ({self.start_time.strftime('%H:%M')}–{self.end_time.strftime('%H:%M')})"


# ═══════════════════════════════════════════════════════════════════════════════
# §2  EMPLOYEE MASTER (360° Profile)
# ═══════════════════════════════════════════════════════════════════════════════


class Employee(BranchScopedModel):
    """
    Comprehensive 360° employee profile — single model covering all worker categories.
    Links to User (accounts.User) for system login if applicable.
    """

    class Category(models.TextChoices):
        STAFF_MONTHLY = "staff_monthly", _("Staff (Monthly)")
        WORKER_PERMANENT = "worker_permanent", _("Worker — Permanent")
        WORKER_DAILY = "worker_daily", _("Worker — Daily Wage")
        WORKER_PIECE = "worker_piece", _("Worker — Piece Rate")
        WORKER_CONTRACTOR = "worker_contractor", _("Worker — Contractor/Thekedar")
        TRAINEE = "trainee", _("Trainee / Apprentice")
        PROBATIONER = "probationer", _("Probationer")
        CONSULTANT = "consultant", _("Consultant")

    class Status(models.TextChoices):
        ACTIVE = "active", _("Active")
        PROBATION = "probation", _("Probation")
        NOTICE = "notice", _("Notice Period")
        SUSPENDED = "suspended", _("Suspended")
        TERMINATED = "terminated", _("Terminated")
        ABSCONDED = "absconded", _("Absconded")
        RETIRED = "retired", _("Retired")
        RESIGNED = "resigned", _("Resigned")
        DECEASED = "deceased", _("Deceased")

    class Gender(models.TextChoices):
        MALE = "male", _("Male")
        FEMALE = "female", _("Female")
        OTHER = "other", _("Other")

    class MaritalStatus(models.TextChoices):
        SINGLE = "single", _("Single")
        MARRIED = "married", _("Married")
        WIDOWED = "widowed", _("Widowed")
        DIVORCED = "divorced", _("Divorced")

    class WageType(models.TextChoices):
        MONTHLY = "monthly", _("Monthly Salary")
        DAILY = "daily", _("Daily Wage")
        PIECE_RATE = "piece_rate", _("Piece Rate")
        HOURLY = "hourly", _("Hourly")

    class PaymentMethod(models.TextChoices):
        BANK = "bank", _("Bank Transfer")
        JAZZCASH = "jazzcash", _("JazzCash")
        EASYPAISA = "easypaisa", _("Easypaisa")
        CASH = "cash", _("Cash")

    # ── Link to auth User (nullable — workers may not have login) ─────────
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL, null=True, blank=True,
        on_delete=models.SET_NULL, related_name="employee_profile",
        verbose_name=_("System User"),
    )

    # ── Auto ID ───────────────────────────────────────────────────────────
    employee_id = models.CharField(
        max_length=20, unique=True, db_index=True,
        verbose_name=_("Employee ID"),
        help_text=_("Auto-generated e.g. LF-2245"),
    )

    # ── Personal ──────────────────────────────────────────────────────────
    photo = models.ImageField(upload_to="employees/photos/%Y/", null=True, blank=True)
    full_name = models.CharField(max_length=150, verbose_name=_("Full Name"))
    full_name_ur = models.CharField(max_length=150, blank=True, verbose_name=_("Full Name (Urdu)"))
    father_husband_name = models.CharField(max_length=150, blank=True, verbose_name=_("Father/Husband Name"))
    cnic = models.CharField(
        max_length=15, db_index=True, verbose_name=_("CNIC"),
        help_text=_("Stored encrypted. Format: XXXXX-XXXXXXX-X"),
    )
    cnic_issue_date = models.DateField(null=True, blank=True, verbose_name=_("CNIC Issue Date"))
    cnic_expiry_date = models.DateField(null=True, blank=True, verbose_name=_("CNIC Expiry Date"))
    date_of_birth = models.DateField(null=True, blank=True, verbose_name=_("Date of Birth"))
    gender = models.CharField(max_length=10, choices=Gender.choices, default=Gender.MALE)
    marital_status = models.CharField(
        max_length=10, choices=MaritalStatus.choices, default=MaritalStatus.SINGLE,
    )
    religion = models.CharField(max_length=30, blank=True, verbose_name=_("Religion (Optional)"))
    nationality = models.CharField(max_length=30, default="Pakistani")
    blood_group = models.CharField(max_length=5, blank=True, verbose_name=_("Blood Group"))
    address_current = models.TextField(blank=True, verbose_name=_("Current Address"))
    address_permanent = models.TextField(blank=True, verbose_name=_("Permanent Address"))
    phone = models.CharField(max_length=20, blank=True, verbose_name=_("Phone"))
    whatsapp = models.CharField(max_length=20, blank=True, verbose_name=_("WhatsApp Number"))
    email = models.EmailField(blank=True, verbose_name=_("Personal Email"))

    # ── Employment ────────────────────────────────────────────────────────
    category = models.CharField(
        max_length=20, choices=Category.choices, default=Category.WORKER_PERMANENT,
        verbose_name=_("Employee Category"),
    )
    status = models.CharField(
        max_length=15, choices=Status.choices, default=Status.ACTIVE,
        verbose_name=_("Employment Status"), db_index=True,
    )
    department = models.ForeignKey(
        Department, null=True, blank=True, on_delete=models.SET_NULL,
        related_name="employees", verbose_name=_("Department"),
    )
    section = models.ForeignKey(
        Section, null=True, blank=True, on_delete=models.SET_NULL,
        related_name="employees", verbose_name=_("Section"),
    )
    line = models.ForeignKey(
        Line, null=True, blank=True, on_delete=models.SET_NULL,
        related_name="employees", verbose_name=_("Line/Machine"),
    )
    designation = models.ForeignKey(
        Designation, null=True, blank=True, on_delete=models.SET_NULL,
        related_name="employees", verbose_name=_("Designation"),
    )
    grade = models.ForeignKey(
        Grade, null=True, blank=True, on_delete=models.SET_NULL,
        related_name="employees", verbose_name=_("Grade"),
    )
    shift = models.ForeignKey(
        Shift, null=True, blank=True, on_delete=models.SET_NULL,
        related_name="employees", verbose_name=_("Default Shift"),
    )
    joining_date = models.DateField(null=True, blank=True, verbose_name=_("Joining Date"))
    confirmation_date = models.DateField(null=True, blank=True, verbose_name=_("Confirmation Date"))
    probation_months = models.PositiveSmallIntegerField(default=3, verbose_name=_("Probation Period (months)"))
    contract_end_date = models.DateField(null=True, blank=True, verbose_name=_("Contract End Date"))
    supervisor = models.ForeignKey(
        "self", null=True, blank=True, on_delete=models.SET_NULL,
        related_name="direct_reports", verbose_name=_("Supervisor"),
    )
    cost_centre = models.ForeignKey(
        CostCentre, null=True, blank=True, on_delete=models.SET_NULL,
        related_name="employees", verbose_name=_("Cost Centre"),
    )
    work_location = models.CharField(max_length=100, blank=True, verbose_name=_("Work Location"))
    notice_period_days = models.PositiveSmallIntegerField(default=30, verbose_name=_("Notice Period (days)"))
    last_working_date = models.DateField(null=True, blank=True)

    # ── Compensation ──────────────────────────────────────────────────────
    wage_type = models.CharField(
        max_length=15, choices=WageType.choices, default=WageType.MONTHLY,
        verbose_name=_("Wage Type"),
    )
    basic_salary = money_field(verbose_name=_("Basic Salary"))
    house_allowance = money_field(verbose_name=_("House Rent Allowance"))
    medical_allowance = money_field(verbose_name=_("Medical Allowance"))
    conveyance_allowance = money_field(verbose_name=_("Conveyance Allowance"))
    attendance_bonus = money_field(
        verbose_name=_("Attendance Bonus"),
        help_text=_("Paid if no absence in month"),
    )
    daily_rate = money_field(verbose_name=_("Daily Rate"), help_text=_("For daily-wage workers"))
    ot_eligible = models.BooleanField(default=True, verbose_name=_("OT Eligible"))
    piece_rate_group = models.ForeignKey(
        "hr.PieceRateGroup", null=True, blank=True, on_delete=models.SET_NULL,
        related_name="employees", verbose_name=_("Piece Rate Group"),
    )

    # ── Payment ───────────────────────────────────────────────────────────
    payment_method = models.CharField(
        max_length=15, choices=PaymentMethod.choices, default=PaymentMethod.CASH,
    )
    bank_name = models.CharField(max_length=100, blank=True)
    bank_account_number = models.CharField(
        max_length=30, blank=True,
        help_text=_("Stored encrypted"),
    )
    bank_iban = models.CharField(max_length=34, blank=True)
    mobile_wallet_number = models.CharField(max_length=20, blank=True)

    # ── Statutory ─────────────────────────────────────────────────────────
    eobi_number = models.CharField(max_length=20, blank=True, verbose_name=_("EOBI Number"))
    social_security_number = models.CharField(max_length=20, blank=True, verbose_name=_("Social Security No."))
    tax_ntn = models.CharField(max_length=20, blank=True, verbose_name=_("Tax NTN"))
    is_tax_filer = models.BooleanField(default=False, verbose_name=_("Income Tax Filer?"))

    # ── Emergency Contacts ────────────────────────────────────────────────
    emergency_contact_1_name = models.CharField(max_length=100, blank=True)
    emergency_contact_1_relation = models.CharField(max_length=30, blank=True)
    emergency_contact_1_phone = models.CharField(max_length=20, blank=True)
    emergency_contact_2_name = models.CharField(max_length=100, blank=True)
    emergency_contact_2_relation = models.CharField(max_length=30, blank=True)
    emergency_contact_2_phone = models.CharField(max_length=20, blank=True)

    # ── Contractor link (for contractor workers) ──────────────────────────
    contractor = models.ForeignKey(
        "hr.Contractor", null=True, blank=True, on_delete=models.SET_NULL,
        related_name="workers", verbose_name=_("Contractor/Thekedar"),
    )

    # ── QR / Badge ────────────────────────────────────────────────────────
    qr_badge_token = models.CharField(max_length=64, blank=True, db_index=True)
    badge_printed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "hr_employee"
        verbose_name = _("Employee")
        verbose_name_plural = _("Employees")
        ordering = ["employee_id"]
        indexes = [
            models.Index(fields=["cnic"], name="hr_emp_cnic_idx"),
            models.Index(fields=["status"], name="hr_emp_status_idx"),
            models.Index(fields=["department", "status"], name="hr_emp_dept_status_idx"),
            models.Index(fields=["category"], name="hr_emp_category_idx"),
            models.Index(fields=["joining_date"], name="hr_emp_joining_idx"),
        ]

    def __str__(self):
        return f"{self.employee_id} — {self.full_name}"

    @property
    def age(self):
        if not self.date_of_birth:
            return None
        today = date.today()
        return today.year - self.date_of_birth.year - (
            (today.month, today.day) < (self.date_of_birth.month, self.date_of_birth.day)
        )

    @property
    def service_years(self):
        if not self.joining_date:
            return Decimal("0")
        delta = date.today() - self.joining_date
        return Decimal(str(round(delta.days / 365.25, 2)))

    @property
    def gross_salary(self):
        """Monthly gross for salaried workers."""
        return (
            self.basic_salary + self.house_allowance +
            self.medical_allowance + self.conveyance_allowance
        )


class EmployeeSkill(BaseModel):
    """Skill matrix: employee × machine/operation × proficiency level 1-5."""
    employee = models.ForeignKey(
        Employee, on_delete=models.CASCADE, related_name="skills",
    )
    skill_name = models.CharField(max_length=100, verbose_name=_("Skill / Machine / Operation"))
    proficiency_level = models.PositiveSmallIntegerField(
        default=1, validators=[MinValueValidator(1), MaxValueValidator(5)],
        verbose_name=_("Proficiency (1-5)"),
    )
    certified = models.BooleanField(default=False)
    certification_date = models.DateField(null=True, blank=True)
    certification_expiry = models.DateField(null=True, blank=True)
    notes = models.TextField(blank=True)

    class Meta:
        db_table = "hr_employee_skill"
        unique_together = [("employee", "skill_name")]
        ordering = ["skill_name"]

    def __str__(self):
        return f"{self.employee.employee_id} — {self.skill_name} (L{self.proficiency_level})"


class EmployeeDocument(BranchScopedModel):
    """Documents associated with an employee — CNIC copy, certificates, contracts."""

    class DocType(models.TextChoices):
        CNIC = "cnic", _("CNIC Copy")
        PHOTO = "photo", _("Photograph")
        APPOINTMENT_LETTER = "appointment_letter", _("Appointment Letter")
        CONTRACT = "contract", _("Employment Contract")
        POLICE_VERIFICATION = "police_verification", _("Police Verification")
        MEDICAL_FITNESS = "medical_fitness", _("Medical Fitness Certificate")
        EDUCATION = "education", _("Education Certificate")
        EXPERIENCE = "experience", _("Experience Letter")
        NOC = "noc", _("No Objection Certificate")
        EOBI_CARD = "eobi_card", _("EOBI Card")
        SS_CARD = "ss_card", _("Social Security Card")
        OTHER = "other", _("Other")

    employee = models.ForeignKey(
        Employee, on_delete=models.CASCADE, related_name="documents",
    )
    doc_type = models.CharField(max_length=30, choices=DocType.choices)
    title = models.CharField(max_length=200)
    file = models.FileField(upload_to="employees/documents/%Y/%m/")
    expiry_date = models.DateField(null=True, blank=True, verbose_name=_("Expiry Date"))
    is_verified = models.BooleanField(default=False)
    verified_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL,
        related_name="verified_documents",
    )
    notes = models.TextField(blank=True)

    class Meta:
        db_table = "hr_employee_document"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.employee.employee_id} — {self.title}"

    @property
    def is_expired(self):
        if not self.expiry_date:
            return False
        return date.today() > self.expiry_date


class EmployeeAsset(BranchScopedModel):
    """Assets issued to employee — uniform, PPE, ID card, locker, tools."""

    class AssetType(models.TextChoices):
        UNIFORM = "uniform", _("Uniform")
        PPE = "ppe", _("PPE (Safety Gear)")
        ID_CARD = "id_card", _("ID Card")
        LOCKER = "locker", _("Locker")
        TOOLS = "tools", _("Tools")
        MOBILE = "mobile", _("Mobile Device")
        OTHER = "other", _("Other")

    employee = models.ForeignKey(
        Employee, on_delete=models.CASCADE, related_name="assets_issued",
    )
    asset_type = models.CharField(max_length=20, choices=AssetType.choices)
    description = models.CharField(max_length=200)
    serial_number = models.CharField(max_length=50, blank=True)
    issued_date = models.DateField()
    returned_date = models.DateField(null=True, blank=True)
    condition_at_issue = models.CharField(max_length=50, default="New")
    condition_at_return = models.CharField(max_length=50, blank=True)
    value = money_field(default=Decimal("0"))
    notes = models.TextField(blank=True)

    class Meta:
        db_table = "hr_employee_asset"
        ordering = ["-issued_date"]

    def __str__(self):
        return f"{self.employee.employee_id} — {self.description}"


# ═══════════════════════════════════════════════════════════════════════════════
# §3  PIECE RATE SYSTEM
# ═══════════════════════════════════════════════════════════════════════════════


class PieceRateGroup(SoftDeleteModel):
    """Groups operations with their piece rates."""
    code = models.CharField(max_length=20, unique=True, db_index=True)
    name = models.CharField(max_length=100)
    department = models.ForeignKey(
        Department, null=True, blank=True, on_delete=models.SET_NULL,
    )
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = "hr_piece_rate_group"
        ordering = ["name"]

    def __str__(self):
        return self.name


class PieceRateItem(BaseModel):
    """Individual operation rate within a piece rate group."""
    group = models.ForeignKey(
        PieceRateGroup, on_delete=models.CASCADE, related_name="items",
    )
    operation_name = models.CharField(max_length=100, verbose_name=_("Operation"))
    rate_per_piece = money_field(verbose_name=_("Rate per Piece (PKR)"))
    unit = models.CharField(max_length=20, default="piece", verbose_name=_("Unit"))
    effective_from = models.DateField(verbose_name=_("Effective From"))
    effective_to = models.DateField(null=True, blank=True, verbose_name=_("Effective To"))
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = "hr_piece_rate_item"
        ordering = ["-effective_from"]

    def __str__(self):
        return f"{self.group.name} / {self.operation_name} @ {self.rate_per_piece}"


class PieceRateOutput(BranchScopedModel):
    """Daily output log for piece-rate workers — linked from production scan."""
    employee = models.ForeignKey(
        Employee, on_delete=models.CASCADE, related_name="piece_outputs",
    )
    date = models.DateField(verbose_name=_("Work Date"))
    rate_item = models.ForeignKey(
        PieceRateItem, on_delete=models.PROTECT, related_name="outputs",
    )
    quantity = qty_field(verbose_name=_("Quantity Produced"))
    amount = money_field(verbose_name=_("Calculated Amount"))
    approved = models.BooleanField(default=False)
    approved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL,
        related_name="approved_outputs",
    )
    notes = models.TextField(blank=True)

    class Meta:
        db_table = "hr_piece_rate_output"
        ordering = ["-date"]
        indexes = [
            models.Index(fields=["employee", "date"], name="hr_pro_emp_date_idx"),
        ]

    def __str__(self):
        return f"{self.employee.employee_id} — {self.date} — {self.quantity} pcs"


# ═══════════════════════════════════════════════════════════════════════════════
# §4  ATTENDANCE & SHIFT MANAGEMENT
# ═══════════════════════════════════════════════════════════════════════════════


class HolidayCalendar(SoftDeleteModel):
    """Holiday master — gazetted and company holidays."""

    class HolidayType(models.TextChoices):
        GAZETTED = "gazetted", _("Gazetted Holiday")
        COMPANY = "company", _("Company Holiday")
        OPTIONAL = "optional", _("Optional Holiday")
        RESTRICTED = "restricted", _("Restricted Holiday")

    date = models.DateField(verbose_name=_("Holiday Date"), db_index=True)
    name = models.CharField(max_length=100, verbose_name=_("Holiday Name"))
    holiday_type = models.CharField(max_length=20, choices=HolidayType.choices)
    branch = models.ForeignKey(
        "branches.Branch", null=True, blank=True, on_delete=models.CASCADE,
        help_text=_("Null = applicable to all branches"),
    )
    paid = models.BooleanField(default=True, verbose_name=_("Paid Holiday?"))
    duty_pay_multiplier = models.DecimalField(
        max_digits=3, decimal_places=1, default=Decimal("2.0"),
        verbose_name=_("Duty Pay Multiplier"),
    )

    class Meta:
        db_table = "hr_holiday_calendar"
        ordering = ["date"]
        unique_together = [("date", "branch")]

    def __str__(self):
        return f"{self.date} — {self.name}"


class ShiftRoster(BranchScopedModel):
    """Weekly/monthly roster assignment for employees."""
    employee = models.ForeignKey(
        Employee, on_delete=models.CASCADE, related_name="roster_entries",
    )
    date = models.DateField(verbose_name=_("Date"))
    shift = models.ForeignKey(Shift, on_delete=models.PROTECT)
    is_weekly_off = models.BooleanField(default=False)
    is_holiday = models.BooleanField(default=False)
    notes = models.CharField(max_length=200, blank=True)

    class Meta:
        db_table = "hr_shift_roster"
        unique_together = [("employee", "date")]
        ordering = ["date"]

    def __str__(self):
        return f"{self.employee.employee_id} — {self.date} — {self.shift.code}"


class AttendancePunch(BranchScopedModel):
    """Raw punch record from any source — biometric, QR, mobile, manual."""

    class Source(models.TextChoices):
        BIOMETRIC = "biometric", _("Biometric Device")
        FACE_RECOGNITION = "face", _("Face Recognition")
        QR_BADGE = "qr_badge", _("QR Badge Scan")
        MOBILE_QR = "mobile_qr", _("Mobile QR + Selfie")
        MANUAL = "manual", _("Manual Entry")
        IMPORT = "import", _("CSV/API Import")

    class PunchType(models.TextChoices):
        IN = "in", _("Clock In")
        OUT = "out", _("Clock Out")
        BREAK_START = "break_start", _("Break Start")
        BREAK_END = "break_end", _("Break End")

    employee = models.ForeignKey(
        Employee, on_delete=models.CASCADE, related_name="punches",
    )
    punch_time = models.DateTimeField(verbose_name=_("Punch Timestamp"), db_index=True)
    punch_type = models.CharField(max_length=15, choices=PunchType.choices)
    source = models.CharField(max_length=15, choices=Source.choices)
    device_id = models.CharField(max_length=50, blank=True)
    selfie = models.ImageField(upload_to="attendance/selfies/%Y/%m/%d/", null=True, blank=True)
    latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    is_within_geofence = models.BooleanField(null=True, blank=True)
    raw_data = models.JSONField(default=dict, blank=True, help_text=_("Raw device payload"))

    class Meta:
        db_table = "hr_attendance_punch"
        ordering = ["-punch_time"]
        indexes = [
            models.Index(fields=["employee", "punch_time"], name="hr_punch_emp_time_idx"),
        ]

    def __str__(self):
        return f"{self.employee.employee_id} {self.punch_type} @ {self.punch_time}"


class DailyAttendance(BranchScopedModel):
    """
    Processed daily attendance record — one per employee per day.
    Computed from punches + roster + leave + holidays.
    """

    class AttendanceStatus(models.TextChoices):
        PRESENT = "present", _("Present")
        ABSENT = "absent", _("Absent")
        LATE = "late", _("Late")
        HALF_DAY = "half_day", _("Half Day")
        LEAVE = "leave", _("On Leave")
        WEEKLY_OFF = "weekly_off", _("Weekly Off")
        HOLIDAY = "holiday", _("Holiday")
        SHORT_LEAVE = "short_leave", _("Short Leave")
        ON_DUTY = "on_duty", _("On Duty / Outdoor")
        MISSING_PUNCH = "missing_punch", _("Missing Punch")
        SUSPENDED = "suspended", _("Suspended")

    employee = models.ForeignKey(
        Employee, on_delete=models.CASCADE, related_name="daily_attendance",
    )
    date = models.DateField(db_index=True)
    shift = models.ForeignKey(Shift, null=True, blank=True, on_delete=models.SET_NULL)
    status = models.CharField(
        max_length=20, choices=AttendanceStatus.choices, default=AttendanceStatus.ABSENT,
    )
    clock_in = models.DateTimeField(null=True, blank=True)
    clock_out = models.DateTimeField(null=True, blank=True)
    late_minutes = models.PositiveSmallIntegerField(default=0)
    early_out_minutes = models.PositiveSmallIntegerField(default=0)
    worked_hours = models.DecimalField(
        max_digits=5, decimal_places=2, default=Decimal("0"),
        verbose_name=_("Hours Worked"),
    )
    ot_hours = models.DecimalField(
        max_digits=5, decimal_places=2, default=Decimal("0"),
        verbose_name=_("OT Hours"),
    )
    ot_amount = money_field(verbose_name=_("OT Amount"))
    leave_type = models.CharField(max_length=30, blank=True)
    is_holiday_duty = models.BooleanField(default=False)
    is_corrected = models.BooleanField(default=False, help_text=_("Manually corrected"))
    corrected_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL,
        related_name="attendance_corrections",
    )
    correction_reason = models.TextField(blank=True)
    remarks = models.TextField(blank=True)

    class Meta:
        db_table = "hr_daily_attendance"
        unique_together = [("employee", "date")]
        ordering = ["-date"]
        indexes = [
            models.Index(fields=["employee", "date"], name="hr_da_emp_date_idx"),
            models.Index(fields=["date", "status"], name="hr_da_date_status_idx"),
            models.Index(fields=["branch", "date"], name="hr_da_branch_date_idx"),
        ]

    def __str__(self):
        return f"{self.employee.employee_id} — {self.date} — {self.status}"


class AttendanceCorrectionRequest(BranchScopedModel):
    """Missing-punch or correction workflow."""

    class CorrectionStatus(models.TextChoices):
        PENDING = "pending", _("Pending")
        APPROVED = "approved", _("Approved")
        REJECTED = "rejected", _("Rejected")

    attendance = models.ForeignKey(
        DailyAttendance, on_delete=models.CASCADE, related_name="corrections",
    )
    requested_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="correction_requests",
    )
    proposed_clock_in = models.DateTimeField(null=True, blank=True)
    proposed_clock_out = models.DateTimeField(null=True, blank=True)
    proposed_status = models.CharField(max_length=20, blank=True)
    reason = models.TextField()
    attachment = models.FileField(upload_to="attendance/corrections/", null=True, blank=True)
    status = models.CharField(
        max_length=10, choices=CorrectionStatus.choices, default=CorrectionStatus.PENDING,
    )
    reviewed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL,
        related_name="correction_reviews",
    )
    review_notes = models.TextField(blank=True)
    reviewed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "hr_attendance_correction"
        ordering = ["-created_at"]

    def __str__(self):
        return f"Correction {self.id} — {self.attendance}"


# ═══════════════════════════════════════════════════════════════════════════════
# §5  LEAVE MANAGEMENT
# ═══════════════════════════════════════════════════════════════════════════════


class LeaveType(SoftDeleteModel):
    """Leave type master with accrual rules."""
    code = models.CharField(max_length=10, unique=True, db_index=True)
    name = models.CharField(max_length=50, verbose_name=_("Leave Type Name"))
    name_ur = models.CharField(max_length=50, blank=True)
    is_paid = models.BooleanField(default=True)
    annual_quota = models.PositiveSmallIntegerField(default=0, verbose_name=_("Annual Entitlement (days)"))
    carry_forward_max = models.PositiveSmallIntegerField(
        default=0, verbose_name=_("Max Carry Forward (days)"),
    )
    encashable = models.BooleanField(default=False, verbose_name=_("Encashable at Exit?"))
    requires_attachment = models.BooleanField(default=False, help_text=_("E.g. medical certificate"))
    min_service_months = models.PositiveSmallIntegerField(
        default=0, verbose_name=_("Min Service for Eligibility (months)"),
    )
    applicable_categories = models.JSONField(
        default=list, blank=True,
        help_text=_("Employee categories eligible, empty = all"),
    )
    accrual_frequency = models.CharField(
        max_length=10, choices=[
            ("monthly", "Monthly"), ("quarterly", "Quarterly"),
            ("yearly", "Yearly"), ("none", "Full at start"),
        ], default="yearly",
    )
    gender_specific = models.CharField(
        max_length=10, blank=True,
        help_text=_("'male', 'female', or blank for all"),
    )
    max_consecutive_days = models.PositiveSmallIntegerField(
        default=0, help_text=_("0 = no limit"),
    )
    half_day_allowed = models.BooleanField(default=True)
    color_hex = models.CharField(max_length=7, default="#EF4444")
    sort_order = models.PositiveSmallIntegerField(default=0)
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = "hr_leave_type"
        ordering = ["sort_order"]

    def __str__(self):
        return f"{self.code} — {self.name}"


class LeaveBalance(BaseModel):
    """Current leave balance ledger per employee per leave type per year."""
    employee = models.ForeignKey(
        Employee, on_delete=models.CASCADE, related_name="leave_balances",
    )
    leave_type = models.ForeignKey(
        LeaveType, on_delete=models.CASCADE, related_name="balances",
    )
    year = models.PositiveSmallIntegerField()
    entitled = models.DecimalField(max_digits=5, decimal_places=1, default=Decimal("0"))
    carried_forward = models.DecimalField(max_digits=5, decimal_places=1, default=Decimal("0"))
    used = models.DecimalField(max_digits=5, decimal_places=1, default=Decimal("0"))
    pending = models.DecimalField(
        max_digits=5, decimal_places=1, default=Decimal("0"),
        help_text=_("Approved but future-dated"),
    )
    encashed = models.DecimalField(max_digits=5, decimal_places=1, default=Decimal("0"))

    class Meta:
        db_table = "hr_leave_balance"
        unique_together = [("employee", "leave_type", "year")]
        ordering = ["-year"]

    @property
    def available(self):
        return self.entitled + self.carried_forward - self.used - self.pending - self.encashed

    def __str__(self):
        return f"{self.employee.employee_id} — {self.leave_type.code} ({self.year}): {self.available}"


class LeaveRequest(BranchScopedModel):
    """Leave application with approval workflow."""

    class LeaveStatus(models.TextChoices):
        DRAFT = "draft", _("Draft")
        PENDING = "pending", _("Pending Approval")
        APPROVED = "approved", _("Approved")
        REJECTED = "rejected", _("Rejected")
        CANCELLED = "cancelled", _("Cancelled")

    employee = models.ForeignKey(
        Employee, on_delete=models.CASCADE, related_name="leave_requests",
    )
    leave_type = models.ForeignKey(
        LeaveType, on_delete=models.PROTECT, related_name="requests",
    )
    from_date = models.DateField()
    to_date = models.DateField()
    is_half_day = models.BooleanField(default=False)
    half_day_type = models.CharField(
        max_length=10, blank=True,
        choices=[("first", "First Half"), ("second", "Second Half")],
    )
    total_days = models.DecimalField(max_digits=4, decimal_places=1, default=Decimal("0"))
    reason = models.TextField(blank=True)
    attachment = models.FileField(upload_to="leaves/attachments/", null=True, blank=True)
    handover_to = models.ForeignKey(
        Employee, null=True, blank=True, on_delete=models.SET_NULL,
        related_name="handover_leaves",
    )
    status = models.CharField(
        max_length=10, choices=LeaveStatus.choices, default=LeaveStatus.PENDING,
    )
    # Approval chain
    approved_by_supervisor = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL,
        related_name="supervisor_leave_approvals",
    )
    supervisor_approved_at = models.DateTimeField(null=True, blank=True)
    approved_by_hod = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL,
        related_name="hod_leave_approvals",
    )
    hod_approved_at = models.DateTimeField(null=True, blank=True)
    approved_by_hr = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL,
        related_name="hr_leave_approvals",
    )
    hr_approved_at = models.DateTimeField(null=True, blank=True)
    rejection_reason = models.TextField(blank=True)

    class Meta:
        db_table = "hr_leave_request"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["employee", "status"], name="hr_lr_emp_status_idx"),
            models.Index(fields=["from_date", "to_date"], name="hr_lr_dates_idx"),
        ]

    def __str__(self):
        return f"{self.employee.employee_id} — {self.leave_type.code} ({self.from_date}–{self.to_date})"


# ═══════════════════════════════════════════════════════════════════════════════
# §6  PAYROLL ENGINE
# ═══════════════════════════════════════════════════════════════════════════════


class SalaryStructure(SoftDeleteModel):
    """Named salary structure with allowance/deduction heads."""
    code = models.CharField(max_length=20, unique=True, db_index=True)
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    applicable_categories = models.JSONField(
        default=list, blank=True,
        help_text=_("Employee categories this structure applies to"),
    )
    effective_from = models.DateField()
    effective_to = models.DateField(null=True, blank=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = "hr_salary_structure"
        ordering = ["-effective_from"]

    def __str__(self):
        return f"{self.code} — {self.name}"


class SalaryComponent(SoftDeleteModel):
    """Allowance/deduction head used in payroll computation."""

    class ComponentType(models.TextChoices):
        EARNING = "earning", _("Earning")
        DEDUCTION = "deduction", _("Deduction")

    class CalcType(models.TextChoices):
        FIXED = "fixed", _("Fixed Amount")
        PERCENT_OF_BASIC = "pct_basic", _("% of Basic")
        PERCENT_OF_GROSS = "pct_gross", _("% of Gross")
        FORMULA = "formula", _("Formula Based")

    code = models.CharField(max_length=20, unique=True, db_index=True)
    name = models.CharField(max_length=100)
    component_type = models.CharField(max_length=10, choices=ComponentType.choices)
    calc_type = models.CharField(max_length=10, choices=CalcType.choices, default=CalcType.FIXED)
    default_amount = money_field(verbose_name=_("Default Amount"))
    percentage = pct_field(verbose_name=_("Percentage"))
    formula = models.TextField(
        blank=True, help_text=_("Python expression for complex calculations"),
    )
    is_taxable = models.BooleanField(default=True, verbose_name=_("Taxable?"))
    is_eobi_applicable = models.BooleanField(default=False)
    is_ss_applicable = models.BooleanField(default=False)
    show_on_payslip = models.BooleanField(default=True)
    sort_order = models.PositiveSmallIntegerField(default=0)
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = "hr_salary_component"
        ordering = ["component_type", "sort_order"]

    def __str__(self):
        return f"{'(+)' if self.component_type == 'earning' else '(-)'} {self.code} — {self.name}"


class SalaryStructureComponent(BaseModel):
    """Mapping: which components are in which structure, with overrides."""
    structure = models.ForeignKey(
        SalaryStructure, on_delete=models.CASCADE, related_name="components",
    )
    component = models.ForeignKey(
        SalaryComponent, on_delete=models.CASCADE, related_name="structure_assignments",
    )
    amount_override = money_field(null=True, blank=True)
    percentage_override = pct_field(null=True, blank=True)
    condition = models.TextField(
        blank=True, help_text=_("Condition expression, e.g. 'employee.category == staff_monthly'"),
    )

    class Meta:
        db_table = "hr_salary_structure_component"
        unique_together = [("structure", "component")]

    def __str__(self):
        return f"{self.structure.code} → {self.component.code}"


class PayPeriod(SoftDeleteModel):
    """Pay period definition — monthly, weekly, fortnightly."""

    class PeriodType(models.TextChoices):
        MONTHLY = "monthly", _("Monthly")
        FORTNIGHTLY = "fortnightly", _("Fortnightly")
        WEEKLY = "weekly", _("Weekly")

    code = models.CharField(max_length=20, unique=True, db_index=True)
    period_type = models.CharField(max_length=15, choices=PeriodType.choices)
    start_date = models.DateField()
    end_date = models.DateField()
    payment_date = models.DateField(null=True, blank=True)
    is_locked = models.BooleanField(default=False)
    locked_at = models.DateTimeField(null=True, blank=True)
    locked_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL,
        related_name="locked_pay_periods",
    )

    class Meta:
        db_table = "hr_pay_period"
        ordering = ["-start_date"]

    def __str__(self):
        return f"{self.code} ({self.start_date}–{self.end_date})"


class PayrollRun(BranchScopedModel):
    """
    Payroll run — maker-checker workflow.
    Status: draft → calculated → hr_approved → accounts_approved → locked → paid.
    """

    class RunStatus(models.TextChoices):
        DRAFT = "draft", _("Draft")
        CALCULATED = "calculated", _("Calculated")
        EXCEPTIONS = "exceptions", _("Has Exceptions")
        HR_APPROVED = "hr_approved", _("HR Approved")
        ACCOUNTS_APPROVED = "accounts_approved", _("Accounts Approved")
        LOCKED = "locked", _("Locked")
        PAID = "paid", _("Paid")
        CANCELLED = "cancelled", _("Cancelled")

    pay_period = models.ForeignKey(
        PayPeriod, on_delete=models.PROTECT, related_name="payroll_runs",
    )
    department = models.ForeignKey(
        Department, null=True, blank=True, on_delete=models.SET_NULL,
        help_text=_("Null = all departments"),
    )
    status = models.CharField(max_length=20, choices=RunStatus.choices, default=RunStatus.DRAFT)
    total_gross = money_field()
    total_deductions = money_field()
    total_net = money_field()
    total_employer_cost = money_field(help_text=_("EOBI + SS + WWF employer"))
    employee_count = models.PositiveIntegerField(default=0)
    exception_count = models.PositiveIntegerField(default=0)
    # Maker-checker
    calculated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL,
        related_name="payroll_calculations",
    )
    calculated_at = models.DateTimeField(null=True, blank=True)
    hr_approved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL,
        related_name="payroll_hr_approvals",
    )
    hr_approved_at = models.DateTimeField(null=True, blank=True)
    accounts_approved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL,
        related_name="payroll_accounts_approvals",
    )
    accounts_approved_at = models.DateTimeField(null=True, blank=True)
    locked_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL,
        related_name="payroll_locks",
    )
    locked_at = models.DateTimeField(null=True, blank=True)
    gl_posted = models.BooleanField(default=False)
    gl_posted_at = models.DateTimeField(null=True, blank=True)
    notes = models.TextField(blank=True)

    Status = RunStatus

    class Meta:
        db_table = "hr_payroll_run"
        ordering = ["-created_at"]

    def __str__(self):
        return f"Payroll {self.pay_period.code} — {self.status}"


PayrollRun.RunStatus.APPROVED = PayrollRun.RunStatus.HR_APPROVED


class Payslip(BranchScopedModel):
    """Individual payslip per employee per payroll run."""
    payroll_run = models.ForeignKey(
        PayrollRun, on_delete=models.CASCADE, related_name="payslips",
    )
    employee = models.ForeignKey(
        Employee, on_delete=models.CASCADE, related_name="payslips",
    )
    pay_period = models.ForeignKey(PayPeriod, on_delete=models.PROTECT)
    # Attendance summary
    days_in_period = models.PositiveSmallIntegerField(default=0)
    days_present = models.PositiveSmallIntegerField(default=0)
    days_absent = models.PositiveSmallIntegerField(default=0)
    days_leave = models.PositiveSmallIntegerField(default=0)
    days_holiday = models.PositiveSmallIntegerField(default=0)
    days_weekly_off = models.PositiveSmallIntegerField(default=0)
    late_count = models.PositiveSmallIntegerField(default=0)
    ot_hours = models.DecimalField(max_digits=6, decimal_places=2, default=Decimal("0"))
    # Amounts
    basic_earned = money_field()
    gross_earnings = money_field()
    total_deductions = money_field()
    net_pay = money_field()
    # Piece rate
    piece_rate_earning = money_field()
    minimum_wage_topup = money_field(
        help_text=_("If piece earning < minimum wage → top-up"),
    )
    # Statutory employer
    employer_eobi = money_field()
    employer_ss = money_field()
    employer_wwf = money_field()
    gratuity_provision = money_field()
    cost_to_company = money_field()
    # Status
    is_exception = models.BooleanField(default=False)
    exception_reasons = models.JSONField(default=list, blank=True)
    payment_method = models.CharField(max_length=15, blank=True)
    paid_at = models.DateTimeField(null=True, blank=True)
    pdf_file = models.FileField(upload_to="payslips/%Y/%m/", null=True, blank=True)
    whatsapp_sent = models.BooleanField(default=False)
    whatsapp_sent_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "hr_payslip"
        unique_together = [("payroll_run", "employee")]
        ordering = ["employee__employee_id"]
        indexes = [
            models.Index(fields=["employee", "pay_period"], name="hr_ps_emp_period_idx"),
        ]

    def __str__(self):
        return f"Payslip {self.employee.employee_id} — {self.pay_period.code}"


class PayslipLine(BaseModel):
    """Itemised earning/deduction line in a payslip."""
    payslip = models.ForeignKey(
        Payslip, on_delete=models.CASCADE, related_name="lines",
    )
    component = models.ForeignKey(
        SalaryComponent, null=True, blank=True, on_delete=models.SET_NULL,
    )
    description = models.CharField(max_length=200)
    component_type = models.CharField(
        max_length=10,
        choices=[("earning", "Earning"), ("deduction", "Deduction")],
    )
    amount = money_field()
    sort_order = models.PositiveSmallIntegerField(default=0)

    class Meta:
        db_table = "hr_payslip_line"
        ordering = ["component_type", "sort_order"]

    def __str__(self):
        return f"{self.description}: {self.amount}"


class PayrollException(BaseModel):
    """Exception flags raised during payroll calculation."""

    class ExceptionType(models.TextChoices):
        NEGATIVE_NET = "negative_net", _("Negative Net Pay")
        OT_CAP_EXCEEDED = "ot_cap", _("OT Cap Exceeded")
        BELOW_MIN_WAGE = "below_min_wage", _("Below Minimum Wage")
        DUPLICATE_BANK = "duplicate_bank", _("Duplicate Bank Account")
        MISSING_ATTENDANCE = "missing_attendance", _("Missing Attendance")
        MISSING_BANK = "missing_bank", _("Missing Bank Account")
        ADVANCE_EXCEEDS_EARNED = "advance_exceeds", _("Advance Exceeds Earned Salary")

    payroll_run = models.ForeignKey(
        PayrollRun, on_delete=models.CASCADE, related_name="exceptions",
    )
    payslip = models.ForeignKey(
        Payslip, null=True, blank=True, on_delete=models.CASCADE, related_name="exception_details",
    )
    exception_type = models.CharField(max_length=30, choices=ExceptionType.choices)
    description = models.TextField()
    resolved = models.BooleanField(default=False)
    resolved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL,
    )
    resolved_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "hr_payroll_exception"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.exception_type} — {self.description[:50]}"


# ═══════════════════════════════════════════════════════════════════════════════
# §7  ADVANCES, LOANS & FINES
# ═══════════════════════════════════════════════════════════════════════════════


class Advance(BranchScopedModel):
    """Advance/loan request with auto-recovery in payroll."""

    class AdvanceType(models.TextChoices):
        ADVANCE = "advance", _("Salary Advance")
        LOAN = "loan", _("Loan")

    class AdvanceStatus(models.TextChoices):
        PENDING = "pending", _("Pending Approval")
        APPROVED = "approved", _("Approved")
        REJECTED = "rejected", _("Rejected")
        DISBURSED = "disbursed", _("Disbursed")
        RECOVERING = "recovering", _("Recovering")
        COMPLETED = "completed", _("Fully Recovered")
        WRITTEN_OFF = "written_off", _("Written Off")

    employee = models.ForeignKey(
        Employee, on_delete=models.CASCADE, related_name="advances",
    )
    advance_type = models.CharField(max_length=10, choices=AdvanceType.choices)
    amount = money_field(verbose_name=_("Advance Amount"))
    reason = models.TextField()
    instalments = models.PositiveSmallIntegerField(
        default=1, verbose_name=_("Recovery Instalments"),
    )
    instalment_amount = money_field(verbose_name=_("Per-Instalment Amount"))
    outstanding = money_field(verbose_name=_("Outstanding Balance"))
    status = models.CharField(
        max_length=15, choices=AdvanceStatus.choices, default=AdvanceStatus.PENDING,
    )
    applied_date = models.DateField(auto_now_add=True)
    approved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL,
        related_name="approved_advances",
    )
    approved_at = models.DateTimeField(null=True, blank=True)
    disbursed_at = models.DateTimeField(null=True, blank=True)
    # Guarantors (for loans)
    guarantor_1 = models.ForeignKey(
        Employee, null=True, blank=True, on_delete=models.SET_NULL,
        related_name="guaranteed_advances_1",
    )
    guarantor_2 = models.ForeignKey(
        Employee, null=True, blank=True, on_delete=models.SET_NULL,
        related_name="guaranteed_advances_2",
    )
    notes = models.TextField(blank=True)

    Status = AdvanceStatus

    @property
    def recovered_amount(self):
        if self.amount is not None and self.outstanding is not None:
            return self.amount - self.outstanding
        return Decimal("0.00")

    @recovered_amount.setter
    def recovered_amount(self, val):
        if self.amount is not None:
            self.outstanding = max(Decimal("0.00"), self.amount - Decimal(str(val)))

    @property
    def installment_amount(self):
        return self.instalment_amount

    class Meta:
        db_table = "hr_advance"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.employee.employee_id} — {self.advance_type} — PKR {self.amount}"


Advance.AdvanceStatus.FULLY_RECOVERED = Advance.AdvanceStatus.COMPLETED


class AdvanceRecovery(BaseModel):
    """Individual recovery transaction linked to payslip."""
    advance = models.ForeignKey(
        Advance, on_delete=models.CASCADE, related_name="recoveries",
    )
    payslip = models.ForeignKey(
        Payslip, null=True, blank=True, on_delete=models.SET_NULL,
        related_name="advance_recoveries",
    )
    amount = money_field()
    recovery_date = models.DateField()
    instalment_number = models.PositiveSmallIntegerField()
    balance_after = money_field()

    class Meta:
        db_table = "hr_advance_recovery"
        ordering = ["recovery_date"]

    def __str__(self):
        return f"Recovery #{self.instalment_number} — PKR {self.amount}"


class Fine(BranchScopedModel):
    """Fine/penalty with reason, evidence, approval, and appeal."""

    class FineStatus(models.TextChoices):
        PENDING = "pending", _("Pending")
        APPROVED = "approved", _("Approved")
        REJECTED = "rejected", _("Rejected")
        APPEALED = "appealed", _("Under Appeal")

    employee = models.ForeignKey(
        Employee, on_delete=models.CASCADE, related_name="fines",
    )
    reason_code = models.CharField(max_length=50, verbose_name=_("Reason Code"))
    reason_detail = models.TextField(verbose_name=_("Reason Detail"))
    amount = money_field()
    evidence_file = models.FileField(upload_to="fines/evidence/", null=True, blank=True)
    fine_date = models.DateField()
    status = models.CharField(
        max_length=10, choices=FineStatus.choices, default=FineStatus.PENDING,
    )
    approved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL,
        related_name="approved_fines",
    )
    deducted_in_payslip = models.ForeignKey(
        Payslip, null=True, blank=True, on_delete=models.SET_NULL,
        related_name="fine_deductions",
    )
    appeal_notes = models.TextField(blank=True)

    Status = FineStatus

    @property
    def payroll_run(self):
        return self.deducted_in_payslip.payroll_run if self.deducted_in_payslip else None

    @payroll_run.setter
    def payroll_run(self, val):
        pass

    class Meta:
        db_table = "hr_fine"
        ordering = ["-fine_date"]

    def __str__(self):
        return f"{self.employee.employee_id} — Fine PKR {self.amount} — {self.reason_code}"


Fine.FineStatus.CONFIRMED = Fine.FineStatus.APPROVED
Fine.FineStatus.DEDUCTED = "deducted"


# ═══════════════════════════════════════════════════════════════════════════════
# §8  CONTRACTOR (THEKEDAR) MANAGEMENT
# ═══════════════════════════════════════════════════════════════════════════════


class Contractor(SoftDeleteModel):
    """Contractor/Thekedar master."""
    code = models.CharField(max_length=20, unique=True, db_index=True)
    name = models.CharField(max_length=150)
    cnic = models.CharField(max_length=15, blank=True, verbose_name=_("Contractor CNIC"))
    ntn = models.CharField(max_length=20, blank=True, verbose_name=_("NTN"))
    phone = models.CharField(max_length=20, blank=True)
    email = models.EmailField(blank=True)
    address = models.TextField(blank=True)
    licence_number = models.CharField(max_length=50, blank=True)
    licence_expiry = models.DateField(null=True, blank=True)
    agreement_start = models.DateField(null=True, blank=True)
    agreement_end = models.DateField(null=True, blank=True)
    security_deposit = money_field()
    tax_withholding_rate = pct_field(
        default=Decimal("0"), verbose_name=_("Tax WHT Rate %"),
    )
    retention_percentage = pct_field(
        default=Decimal("0"), verbose_name=_("Retention %"),
    )
    performance_rating = models.DecimalField(
        max_digits=3, decimal_places=1, default=Decimal("0"),
        validators=[MinValueValidator(0), MaxValueValidator(5)],
    )
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = "hr_contractor"
        ordering = ["name"]

    def __str__(self):
        return f"{self.code} — {self.name}"


class ContractorHeadcount(BranchScopedModel):
    """Daily headcount entry by contractor and department."""
    contractor = models.ForeignKey(
        Contractor, on_delete=models.CASCADE, related_name="headcounts",
    )
    date = models.DateField()
    department = models.ForeignKey(
        Department, on_delete=models.CASCADE, related_name="contractor_headcounts",
    )
    workers_present = models.PositiveIntegerField(default=0)
    hours_worked = models.DecimalField(max_digits=5, decimal_places=2, default=Decimal("0"))
    rate_per_worker = money_field()
    total_amount = money_field()
    verified_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL,
    )

    class Meta:
        db_table = "hr_contractor_headcount"
        unique_together = [("contractor", "date", "department")]
        ordering = ["-date"]

    def __str__(self):
        return f"{self.contractor.code} — {self.date} — {self.workers_present} workers"


class ContractorBill(BranchScopedModel):
    """Bill generated for contractor based on headcount/piece/hour."""

    class BillStatus(models.TextChoices):
        DRAFT = "draft", _("Draft")
        SUBMITTED = "submitted", _("Submitted")
        APPROVED = "approved", _("Approved")
        PAID = "paid", _("Paid")
        DISPUTED = "disputed", _("Disputed")

    contractor = models.ForeignKey(
        Contractor, on_delete=models.CASCADE, related_name="bills",
    )
    bill_number = models.CharField(max_length=30, unique=True, db_index=True)
    period_start = models.DateField()
    period_end = models.DateField()
    gross_amount = money_field()
    retention_amount = money_field()
    tax_withheld = money_field()
    net_payable = money_field()
    status = models.CharField(
        max_length=10, choices=BillStatus.choices, default=BillStatus.DRAFT,
    )
    approved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL,
        related_name="approved_contractor_bills",
    )
    paid_at = models.DateTimeField(null=True, blank=True)
    notes = models.TextField(blank=True)

    class Meta:
        db_table = "hr_contractor_bill"
        ordering = ["-created_at"]

    def __str__(self):
        return f"Bill {self.bill_number} — {self.contractor.code}"


# ═══════════════════════════════════════════════════════════════════════════════
# §9  RECRUITMENT & ONBOARDING
# ═══════════════════════════════════════════════════════════════════════════════


class ManpowerRequisition(BranchScopedModel):
    """Manpower requisition — request to hire."""

    class ReqStatus(models.TextChoices):
        DRAFT = "draft", _("Draft")
        PENDING = "pending", _("Pending Approval")
        APPROVED = "approved", _("Approved")
        REJECTED = "rejected", _("Rejected")
        FULFILLED = "fulfilled", _("Fulfilled")
        CANCELLED = "cancelled", _("Cancelled")

    requisition_number = models.CharField(max_length=30, unique=True, db_index=True)
    department = models.ForeignKey(Department, on_delete=models.CASCADE)
    designation = models.ForeignKey(Designation, on_delete=models.CASCADE)
    category = models.CharField(max_length=20, choices=Employee.Category.choices)
    positions_count = models.PositiveSmallIntegerField(default=1)
    reason = models.TextField()
    budget_per_position = money_field()
    urgency = models.CharField(
        max_length=10,
        choices=[("low", "Low"), ("medium", "Medium"), ("high", "High"), ("critical", "Critical")],
        default="medium",
    )
    status = models.CharField(max_length=10, choices=ReqStatus.choices, default=ReqStatus.DRAFT)
    approved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL,
        related_name="approved_requisitions",
    )
    target_join_date = models.DateField(null=True, blank=True)
    positions_filled = models.PositiveSmallIntegerField(default=0)

    class Meta:
        db_table = "hr_manpower_requisition"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.requisition_number} — {self.designation.title} × {self.positions_count}"


class Applicant(SoftDeleteModel):
    """Job applicant tracker."""

    class ApplicantStatus(models.TextChoices):
        APPLIED = "applied", _("Applied")
        SCREENED = "screened", _("Screened")
        INTERVIEW = "interview", _("Interview Scheduled")
        TRADE_TEST = "trade_test", _("Trade Test")
        OFFER = "offer", _("Offer Extended")
        JOINED = "joined", _("Joined")
        REJECTED = "rejected", _("Rejected")
        WITHDRAWN = "withdrawn", _("Withdrawn")

    requisition = models.ForeignKey(
        ManpowerRequisition, null=True, blank=True, on_delete=models.SET_NULL,
        related_name="applicants",
    )
    full_name = models.CharField(max_length=150)
    cnic = models.CharField(max_length=15, blank=True)
    phone = models.CharField(max_length=20, blank=True)
    email = models.EmailField(blank=True)
    resume = models.FileField(upload_to="recruitment/resumes/", null=True, blank=True)
    source = models.CharField(
        max_length=30, blank=True,
        help_text=_("Walk-in, Referral, Online, Agency, Internal"),
    )
    referred_by = models.ForeignKey(
        Employee, null=True, blank=True, on_delete=models.SET_NULL,
        related_name="referrals",
    )
    status = models.CharField(
        max_length=15, choices=ApplicantStatus.choices, default=ApplicantStatus.APPLIED,
    )
    applied_for_designation = models.ForeignKey(
        Designation, null=True, blank=True, on_delete=models.SET_NULL,
    )
    expected_salary = money_field()
    experience_years = models.DecimalField(
        max_digits=4, decimal_places=1, default=Decimal("0"),
    )
    notes = models.TextField(blank=True)
    converted_employee = models.OneToOneField(
        Employee, null=True, blank=True, on_delete=models.SET_NULL,
        related_name="applicant_record",
    )

    class Meta:
        db_table = "hr_applicant"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.full_name} — {self.status}"


class Interview(BaseModel):
    """Interview schedule and scorecard."""
    applicant = models.ForeignKey(
        Applicant, on_delete=models.CASCADE, related_name="interviews",
    )
    interview_date = models.DateTimeField()
    panel = models.ManyToManyField(
        settings.AUTH_USER_MODEL, related_name="interview_panels", blank=True,
    )
    interview_type = models.CharField(
        max_length=20,
        choices=[
            ("screening", "Screening"), ("technical", "Technical"),
            ("trade_test", "Trade Test"), ("hr", "HR"), ("final", "Final"),
        ],
        default="screening",
    )
    overall_rating = models.PositiveSmallIntegerField(
        null=True, blank=True, validators=[MinValueValidator(1), MaxValueValidator(10)],
    )
    scorecard = models.JSONField(
        default=dict, blank=True,
        help_text=_("Criteria → rating mapping"),
    )
    recommendation = models.CharField(
        max_length=15, blank=True,
        choices=[
            ("hire", "Hire"), ("reject", "Reject"),
            ("hold", "Hold"), ("next_round", "Next Round"),
        ],
    )
    trade_test_result = models.JSONField(
        default=dict, blank=True,
        help_text=_("Speed, quality metrics for operator tests"),
    )
    notes = models.TextField(blank=True)

    class Meta:
        db_table = "hr_interview"
        ordering = ["-interview_date"]

    def __str__(self):
        return f"Interview — {self.applicant.full_name} ({self.interview_type})"


class OnboardingChecklist(BranchScopedModel):
    """Onboarding checklist items per employee."""
    employee = models.ForeignKey(
        Employee, on_delete=models.CASCADE, related_name="onboarding_items",
    )
    item_name = models.CharField(max_length=200)
    is_completed = models.BooleanField(default=False)
    completed_at = models.DateTimeField(null=True, blank=True)
    completed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL,
    )
    due_date = models.DateField(null=True, blank=True)
    sort_order = models.PositiveSmallIntegerField(default=0)
    notes = models.TextField(blank=True)

    class Meta:
        db_table = "hr_onboarding_checklist"
        ordering = ["sort_order"]

    def __str__(self):
        status = "✓" if self.is_completed else "○"
        return f"{status} {self.item_name} — {self.employee.employee_id}"


# ═══════════════════════════════════════════════════════════════════════════════
# §10  PERFORMANCE & PRODUCTIVITY
# ═══════════════════════════════════════════════════════════════════════════════


class PerformanceCycle(SoftDeleteModel):
    """Appraisal cycle definition."""
    name = models.CharField(max_length=100)
    year = models.PositiveSmallIntegerField()
    start_date = models.DateField()
    end_date = models.DateField()
    is_active = models.BooleanField(default=True)
    rating_scale_max = models.PositiveSmallIntegerField(default=5)

    class Meta:
        db_table = "hr_performance_cycle"
        ordering = ["-year"]

    def __str__(self):
        return f"{self.name} ({self.year})"


class PerformanceAppraisal(BranchScopedModel):
    """Individual employee appraisal."""

    class AppraisalStatus(models.TextChoices):
        SELF_REVIEW = "self_review", _("Self Review")
        SUPERVISOR_REVIEW = "supervisor_review", _("Supervisor Review")
        HOD_REVIEW = "hod_review", _("HOD Review")
        HR_CALIBRATION = "hr_calibration", _("HR Calibration")
        COMPLETED = "completed", _("Completed")

    cycle = models.ForeignKey(PerformanceCycle, on_delete=models.CASCADE)
    employee = models.ForeignKey(
        Employee, on_delete=models.CASCADE, related_name="appraisals",
    )
    status = models.CharField(
        max_length=20, choices=AppraisalStatus.choices, default=AppraisalStatus.SELF_REVIEW,
    )
    kra_kpi = models.JSONField(
        default=list, blank=True,
        help_text=_("KRA/KPI templates with ratings"),
    )
    self_rating = models.DecimalField(
        max_digits=3, decimal_places=1, null=True, blank=True,
    )
    supervisor_rating = models.DecimalField(
        max_digits=3, decimal_places=1, null=True, blank=True,
    )
    final_rating = models.DecimalField(
        max_digits=3, decimal_places=1, null=True, blank=True,
    )
    # Productivity metrics (for workers)
    output_vs_standard = pct_field(help_text=_("Output efficiency %"))
    quality_dhu = pct_field(help_text=_("Defects per Hundred Units"))
    attendance_score = pct_field()
    discipline_score = pct_field()
    # Recommendations
    promotion_recommended = models.BooleanField(default=False)
    increment_recommended = models.BooleanField(default=False)
    increment_percentage = pct_field()
    training_needs = models.TextField(blank=True)
    supervisor_comments = models.TextField(blank=True)
    employee_comments = models.TextField(blank=True)

    class Meta:
        db_table = "hr_performance_appraisal"
        unique_together = [("cycle", "employee")]
        ordering = ["-cycle__year"]

    def __str__(self):
        return f"Appraisal — {self.employee.employee_id} ({self.cycle.year})"


# ═══════════════════════════════════════════════════════════════════════════════
# §11  TRAINING & SAFETY
# ═══════════════════════════════════════════════════════════════════════════════


class TrainingProgram(SoftDeleteModel):
    """Training program master."""
    code = models.CharField(max_length=20, unique=True, db_index=True)
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    trainer = models.CharField(max_length=100, blank=True)
    is_mandatory = models.BooleanField(default=False)
    duration_hours = models.DecimalField(max_digits=5, decimal_places=1, default=Decimal("0"))
    certification_validity_months = models.PositiveSmallIntegerField(
        default=0, help_text=_("0 = no expiry"),
    )
    is_safety_training = models.BooleanField(default=False)

    class Meta:
        db_table = "hr_training_program"
        ordering = ["title"]

    def __str__(self):
        return self.title


class TrainingSession(BranchScopedModel):
    """Scheduled training session."""
    program = models.ForeignKey(
        TrainingProgram, on_delete=models.CASCADE, related_name="sessions",
    )
    session_date = models.DateField()
    start_time = models.TimeField()
    end_time = models.TimeField()
    location = models.CharField(max_length=100, blank=True)
    max_participants = models.PositiveSmallIntegerField(default=50)

    class Meta:
        db_table = "hr_training_session"
        ordering = ["-session_date"]

    def __str__(self):
        return f"{self.program.title} — {self.session_date}"


class TrainingAttendance(BaseModel):
    """Training attendance by QR scan."""
    session = models.ForeignKey(
        TrainingSession, on_delete=models.CASCADE, related_name="attendees",
    )
    employee = models.ForeignKey(
        Employee, on_delete=models.CASCADE, related_name="training_attendance",
    )
    checked_in = models.BooleanField(default=False)
    checked_in_at = models.DateTimeField(null=True, blank=True)
    passed = models.BooleanField(null=True, blank=True)
    score = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    certificate_issued = models.BooleanField(default=False)
    certificate_expiry = models.DateField(null=True, blank=True)

    class Meta:
        db_table = "hr_training_attendance"
        unique_together = [("session", "employee")]

    def __str__(self):
        return f"{self.employee.employee_id} — {self.session.program.title}"


class SafetyIncident(BranchScopedModel):
    """Safety incident/near-miss register."""

    class Severity(models.TextChoices):
        NEAR_MISS = "near_miss", _("Near Miss")
        MINOR = "minor", _("Minor Injury")
        MODERATE = "moderate", _("Moderate Injury")
        MAJOR = "major", _("Major Injury")
        FATAL = "fatal", _("Fatal")

    class IncidentStatus(models.TextChoices):
        REPORTED = "reported", _("Reported")
        INVESTIGATING = "investigating", _("Under Investigation")
        CORRECTIVE = "corrective", _("Corrective Action")
        CLOSED = "closed", _("Closed")

    incident_number = models.CharField(max_length=30, unique=True, db_index=True)
    date = models.DateField()
    time = models.TimeField(null=True, blank=True)
    location = models.CharField(max_length=200)
    department = models.ForeignKey(
        Department, null=True, blank=True, on_delete=models.SET_NULL,
    )
    employee = models.ForeignKey(
        Employee, null=True, blank=True, on_delete=models.SET_NULL,
        related_name="safety_incidents",
    )
    severity = models.CharField(max_length=10, choices=Severity.choices)
    description = models.TextField()
    body_part_affected = models.CharField(max_length=100, blank=True)
    root_cause = models.TextField(blank=True)
    corrective_action = models.TextField(blank=True)
    days_lost = models.PositiveSmallIntegerField(default=0)
    status = models.CharField(
        max_length=15, choices=IncidentStatus.choices, default=IncidentStatus.REPORTED,
    )
    reported_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL,
        related_name="reported_incidents",
    )
    investigation_report = models.FileField(
        upload_to="safety/reports/", null=True, blank=True,
    )

    class Meta:
        db_table = "hr_safety_incident"
        ordering = ["-date"]

    def __str__(self):
        return f"{self.incident_number} — {self.severity} — {self.date}"


# ═══════════════════════════════════════════════════════════════════════════════
# §12  DISCIPLINE & GRIEVANCE
# ═══════════════════════════════════════════════════════════════════════════════


class DisciplinaryAction(BranchScopedModel):
    """Show-cause → Reply → Inquiry → Decision workflow."""

    class ActionType(models.TextChoices):
        VERBAL_WARNING = "verbal_warning", _("Verbal Warning")
        WRITTEN_WARNING = "written_warning", _("Written Warning")
        SHOW_CAUSE = "show_cause", _("Show Cause Notice")
        FINE = "fine", _("Fine")
        SUSPENSION = "suspension", _("Suspension")
        DEMOTION = "demotion", _("Demotion")
        TERMINATION = "termination", _("Termination")

    class ActionStatus(models.TextChoices):
        ISSUED = "issued", _("Notice Issued")
        REPLY_RECEIVED = "reply_received", _("Reply Received")
        INQUIRY = "inquiry", _("Under Inquiry")
        DECIDED = "decided", _("Decision Made")
        APPEALED = "appealed", _("Under Appeal")
        CLOSED = "closed", _("Closed")

    employee = models.ForeignKey(
        Employee, on_delete=models.CASCADE, related_name="disciplinary_actions",
    )
    action_type = models.CharField(max_length=20, choices=ActionType.choices)
    status = models.CharField(max_length=20, choices=ActionStatus.choices, default=ActionStatus.ISSUED)
    incident_date = models.DateField()
    description = models.TextField()
    notice_issued_date = models.DateField(null=True, blank=True)
    reply_due_date = models.DateField(null=True, blank=True)
    reply_received_date = models.DateField(null=True, blank=True)
    reply_text = models.TextField(blank=True)
    inquiry_date = models.DateField(null=True, blank=True)
    inquiry_committee = models.JSONField(default=list, blank=True)
    decision = models.TextField(blank=True)
    decision_date = models.DateField(null=True, blank=True)
    decided_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL,
        related_name="discipline_decisions",
    )
    fine_amount = money_field()
    suspension_days = models.PositiveSmallIntegerField(default=0)
    appeal_text = models.TextField(blank=True)

    class Meta:
        db_table = "hr_disciplinary_action"
        ordering = ["-incident_date"]

    def __str__(self):
        return f"{self.employee.employee_id} — {self.action_type} — {self.incident_date}"


class Grievance(BranchScopedModel):
    """Grievance/complaint register."""

    class GrievanceStatus(models.TextChoices):
        SUBMITTED = "submitted", _("Submitted")
        UNDER_REVIEW = "under_review", _("Under Review")
        RESOLVED = "resolved", _("Resolved")
        ESCALATED = "escalated", _("Escalated")
        CLOSED = "closed", _("Closed")

    employee = models.ForeignKey(
        Employee, null=True, blank=True, on_delete=models.SET_NULL,
        related_name="grievances",
        help_text=_("Null for anonymous complaints"),
    )
    is_anonymous = models.BooleanField(default=False)
    category = models.CharField(
        max_length=30,
        choices=[
            ("workplace", "Workplace"), ("harassment", "Harassment"),
            ("salary", "Salary/Pay"), ("safety", "Safety"),
            ("management", "Management"), ("other", "Other"),
        ],
    )
    description = models.TextField()
    status = models.CharField(
        max_length=15, choices=GrievanceStatus.choices, default=GrievanceStatus.SUBMITTED,
    )
    assigned_to = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL,
        related_name="assigned_grievances",
    )
    resolution = models.TextField(blank=True)
    resolved_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "hr_grievance"
        ordering = ["-created_at"]

    def __str__(self):
        who = self.employee.employee_id if self.employee else "Anonymous"
        return f"Grievance — {who} — {self.category}"


# ═══════════════════════════════════════════════════════════════════════════════
# §13  SEPARATION / EXIT
# ═══════════════════════════════════════════════════════════════════════════════


class Separation(BranchScopedModel):
    """Exit/separation process — resignation, termination, retirement."""

    class SeparationType(models.TextChoices):
        RESIGNATION = "resignation", _("Resignation")
        TERMINATION = "termination", _("Termination")
        ABSCONDING = "absconding", _("Absconding")
        RETIREMENT = "retirement", _("Retirement")
        DEATH = "death", _("Death in Service")
        CONTRACT_END = "contract_end", _("Contract End")

    class SepStatus(models.TextChoices):
        INITIATED = "initiated", _("Initiated")
        NOTICE_PERIOD = "notice_period", _("Notice Period")
        CLEARANCE = "clearance", _("Clearance Pending")
        SETTLEMENT = "settlement", _("Final Settlement")
        COMPLETED = "completed", _("Completed")

    employee = models.OneToOneField(
        Employee, on_delete=models.CASCADE, related_name="separation",
    )
    separation_type = models.CharField(max_length=15, choices=SeparationType.choices)
    status = models.CharField(
        max_length=15, choices=SepStatus.choices, default=SepStatus.INITIATED,
    )
    initiated_date = models.DateField()
    notice_start_date = models.DateField(null=True, blank=True)
    last_working_date = models.DateField(null=True, blank=True)
    reason = models.TextField(blank=True)

    # Final Settlement
    pending_salary = money_field()
    leave_encashment = money_field()
    gratuity_amount = money_field()
    bonus_payable = money_field()
    deductions = money_field(help_text=_("Advances, loans, assets, fines"))
    final_settlement_amount = money_field()
    settlement_paid = models.BooleanField(default=False)
    settlement_paid_at = models.DateTimeField(null=True, blank=True)

    # Clearance
    clearance_checklist = models.JSONField(
        default=list, blank=True,
        help_text=_("Items: assets, advances, tools, ID, locker, etc."),
    )

    # Exit interview
    exit_interview_date = models.DateField(null=True, blank=True)
    exit_interview_notes = models.TextField(blank=True)

    # Letters
    experience_letter_issued = models.BooleanField(default=False)
    relieving_letter_issued = models.BooleanField(default=False)

    class Meta:
        db_table = "hr_separation"
        ordering = ["-initiated_date"]

    def __str__(self):
        return f"{self.employee.employee_id} — {self.separation_type}"


# ═══════════════════════════════════════════════════════════════════════════════
# §14  STATUTORY RULES ENGINE (Configurable with Effective Dates)
# ═══════════════════════════════════════════════════════════════════════════════


class StatutoryRule(SoftDeleteModel):
    """
    Configurable statutory rule with effective dates.
    NEVER hard-code statutory values — always use this table.
    See docs/COMPLIANCE_NOTES.md for reference.
    """

    class RuleCategory(models.TextChoices):
        MINIMUM_WAGE = "minimum_wage", _("Minimum Wage")
        EOBI = "eobi", _("EOBI")
        SOCIAL_SECURITY = "social_security", _("Social Security")
        WWF = "wwf", _("Workers Welfare Fund")
        OVERTIME = "overtime", _("Overtime")
        LEAVE = "leave", _("Leave Entitlement")
        GRATUITY = "gratuity", _("Gratuity")
        TAX = "tax", _("Income Tax")
        WORKING_HOURS = "working_hours", _("Working Hours")
        BONUS = "bonus", _("Bonus")
        PROBATION = "probation", _("Probation")
        NOTICE_PERIOD = "notice_period", _("Notice Period")
        CONTRACTOR = "contractor", _("Contractor Labour")

    rule_id = models.CharField(
        max_length=20, unique=True, db_index=True,
        verbose_name=_("Rule ID"),
        help_text=_("E.g. MW-001, EOBI-001"),
    )
    category = models.CharField(max_length=20, choices=RuleCategory.choices)
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    value_numeric = models.DecimalField(
        max_digits=16, decimal_places=4, null=True, blank=True,
        help_text=_("Numeric value (amount, rate, days, etc.)"),
    )
    value_text = models.CharField(
        max_length=500, blank=True,
        help_text=_("Text value for non-numeric rules"),
    )
    value_json = models.JSONField(
        default=dict, blank=True,
        help_text=_("Complex rule data (e.g. tax slabs)"),
    )
    unit = models.CharField(
        max_length=20, blank=True,
        help_text=_("PKR, %, days, months, hours"),
    )
    province = models.CharField(
        max_length=30, blank=True,
        help_text=_("Blank = federal/all"),
    )
    effective_from = models.DateField(verbose_name=_("Effective From"))
    effective_to = models.DateField(null=True, blank=True, verbose_name=_("Effective To"))
    legal_reference = models.TextField(
        blank=True, help_text=_("Act, section, notification reference"),
    )
    is_active = models.BooleanField(default=True)
    verification_note = models.TextField(
        default="Verify with current Pakistan federal/provincial law & company legal advisor",
    )

    class Meta:
        db_table = "hr_statutory_rule"
        ordering = ["category", "-effective_from"]
        indexes = [
            models.Index(fields=["rule_id", "effective_from"], name="hr_stat_rule_eff_idx"),
            models.Index(fields=["category", "effective_from"], name="hr_stat_cat_eff_idx"),
        ]

    RuleType = RuleCategory

    @property
    def rule_type(self):
        return self.category

    @property
    def threshold_amount(self):
        if self.value_numeric is not None:
            return self.value_numeric
        if isinstance(self.value_json, dict) and "min_wage_base" in self.value_json:
            return Decimal(str(self.value_json["min_wage_base"]))
        return Decimal("37000.00")

    @property
    def employee_rate(self):
        if isinstance(self.value_json, dict) and "employee_rate" in self.value_json:
            return Decimal(str(self.value_json["employee_rate"]))
        if self.value_numeric is not None:
            return self.value_numeric
        return Decimal("1.00")

    @property
    def employer_rate(self):
        if isinstance(self.value_json, dict) and "employer_rate" in self.value_json:
            return Decimal(str(self.value_json["employer_rate"]))
        return Decimal("5.00")

    @property
    def wage_ceiling(self):
        if isinstance(self.value_json, dict) and "wage_ceiling" in self.value_json:
            return Decimal(str(self.value_json["wage_ceiling"]))
        return Decimal("40000.00")

    def __str__(self):
        return f"{self.rule_id} — {self.name} (from {self.effective_from})"

    @classmethod
    def get_current_value(cls, rule_id, as_of=None):
        """Get the current effective value for a rule."""
        as_of = as_of or date.today()
        rule = cls.objects.filter(
            rule_id=rule_id,
            effective_from__lte=as_of,
            is_active=True,
        ).filter(
            models.Q(effective_to__isnull=True) | models.Q(effective_to__gte=as_of)
        ).order_by("-effective_from").first()
        if rule:
            return rule.value_numeric or rule.value_text or rule.value_json
        return None


class TaxSlab(SoftDeleteModel):
    """Income tax slab configuration — effective-dated."""
    effective_from = models.DateField()
    effective_to = models.DateField(null=True, blank=True)
    min_income = money_field(verbose_name=_("Minimum Annual Income"))
    max_income = money_field(
        null=True, blank=True, verbose_name=_("Maximum Annual Income"),
    )
    fixed_tax = money_field(verbose_name=_("Fixed Tax Amount"))
    rate_on_excess = pct_field(verbose_name=_("Rate on Excess (%)"))
    for_filer = models.BooleanField(default=True, verbose_name=_("For Tax Filer?"))
    sort_order = models.PositiveSmallIntegerField(default=0)

    class Meta:
        db_table = "hr_tax_slab"
        ordering = ["effective_from", "sort_order"]

    def __str__(self):
        return f"Slab {self.min_income}–{self.max_income} @ {self.rate_on_excess}%"


# ═══════════════════════════════════════════════════════════════════════════════
# §15  ATTENDANCE RULES (Configurable)
# ═══════════════════════════════════════════════════════════════════════════════


class AttendanceRule(SoftDeleteModel):
    """Configurable attendance policy rules."""
    code = models.CharField(max_length=20, unique=True, db_index=True)
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)

    # Late/early rules
    lates_for_absent = models.PositiveSmallIntegerField(
        default=3, help_text=_("N lates = 1 absent day"),
    )
    min_ot_threshold_minutes = models.PositiveSmallIntegerField(
        default=30, help_text=_("Minimum minutes after shift to count as OT"),
    )
    ot_rate_multiplier = models.DecimalField(
        max_digits=3, decimal_places=1, default=Decimal("2.0"),
    )
    max_ot_hours_per_week = models.DecimalField(
        max_digits=4, decimal_places=1, default=Decimal("12.0"),
    )
    max_ot_hours_per_month = models.DecimalField(
        max_digits=5, decimal_places=1, default=Decimal("48.0"),
    )
    paid_weekly_off = models.BooleanField(
        default=True, help_text=_("Count weekly off as paid day?"),
    )
    paid_holiday = models.BooleanField(
        default=True, help_text=_("Count holiday as paid day?"),
    )
    holiday_duty_multiplier = models.DecimalField(
        max_digits=3, decimal_places=1, default=Decimal("2.0"),
    )
    half_day_min_hours = models.DecimalField(
        max_digits=3, decimal_places=1, default=Decimal("4.0"),
    )
    absent_without_leave_alert_days = models.PositiveSmallIntegerField(
        default=3, help_text=_("Alert after N consecutive absent days"),
    )
    effective_from = models.DateField()
    effective_to = models.DateField(null=True, blank=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = "hr_attendance_rule"
        ordering = ["-effective_from"]

    def __str__(self):
        return f"{self.code} — {self.name}"


# ═══════════════════════════════════════════════════════════════════════════════
# §16  WELFARE & ADMIN (Optional Toggles)
# ═══════════════════════════════════════════════════════════════════════════════


class CanteenEntry(BranchScopedModel):
    """Meal count by shift for canteen management."""
    employee = models.ForeignKey(
        Employee, on_delete=models.CASCADE, related_name="canteen_entries",
    )
    date = models.DateField()
    meal_type = models.CharField(
        max_length=10,
        choices=[("lunch", "Lunch"), ("dinner", "Dinner"), ("tea", "Tea")],
    )
    amount = money_field(verbose_name=_("Meal Cost"))

    class Meta:
        db_table = "hr_canteen_entry"
        ordering = ["-date"]

    def __str__(self):
        return f"{self.employee.employee_id} — {self.date} — {self.meal_type}"


class MedicalCheckup(BranchScopedModel):
    """Periodic medical checkup records."""
    employee = models.ForeignKey(
        Employee, on_delete=models.CASCADE, related_name="medical_checkups",
    )
    checkup_date = models.DateField()
    checkup_type = models.CharField(
        max_length=30,
        choices=[
            ("pre_employment", "Pre-Employment"), ("annual", "Annual"),
            ("periodic", "Periodic"), ("return_to_work", "Return to Work"),
        ],
    )
    result = models.CharField(
        max_length=20,
        choices=[("fit", "Fit"), ("unfit", "Unfit"), ("conditional", "Conditionally Fit")],
        default="fit",
    )
    notes = models.TextField(blank=True)
    next_due_date = models.DateField(null=True, blank=True)
    report_file = models.FileField(upload_to="medical/reports/", null=True, blank=True)

    class Meta:
        db_table = "hr_medical_checkup"
        ordering = ["-checkup_date"]

    def __str__(self):
        return f"{self.employee.employee_id} — {self.checkup_type} — {self.checkup_date}"


# ═══════════════════════════════════════════════════════════════════════════════
# §17  DELEGATION (Acting-for when on leave)
# ═══════════════════════════════════════════════════════════════════════════════


class Delegation(BaseModel):
    """Approval delegation — HOD delegates approvals for a date range."""
    delegator = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
        related_name="delegations_given",
    )
    delegate = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
        related_name="delegations_received",
    )
    module = models.CharField(max_length=50, blank=True, help_text=_("Blank = all modules"))
    start_date = models.DateField()
    end_date = models.DateField()
    reason = models.CharField(max_length=200, blank=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = "hr_delegation"
        ordering = ["-start_date"]

    def __str__(self):
        return f"{self.delegator} → {self.delegate} ({self.start_date}–{self.end_date})"

    @property
    def is_current(self):
        today = date.today()
        return self.is_active and self.start_date <= today <= self.end_date
