"""
HR App — Django Admin configuration.
"""
from django.contrib import admin
from django.utils.html import format_html

from apps.hr.models import (
    Department, Section, Line, Designation, Grade, CostCentre, Shift,
    Employee, EmployeeSkill, EmployeeDocument, EmployeeAsset,
    PieceRateGroup, PieceRateItem, PieceRateOutput,
    HolidayCalendar, ShiftRoster, AttendancePunch, DailyAttendance,
    AttendanceCorrectionRequest, AttendanceRule,
    LeaveType, LeaveBalance, LeaveRequest,
    SalaryStructure, SalaryComponent, SalaryStructureComponent,
    PayPeriod, PayrollRun, Payslip, PayslipLine, PayrollException,
    Advance, AdvanceRecovery, Fine,
    Contractor, ContractorHeadcount, ContractorBill,
    ManpowerRequisition, Applicant, Interview, OnboardingChecklist,
    PerformanceCycle, PerformanceAppraisal,
    TrainingProgram, TrainingSession, TrainingAttendance,
    SafetyIncident, DisciplinaryAction, Grievance,
    Separation, StatutoryRule, TaxSlab, Delegation,
    CanteenEntry, MedicalCheckup,
)


# ─── Inlines ──────────────────────────────────────────────────────────────────

class EmployeeSkillInline(admin.TabularInline):
    model = EmployeeSkill
    extra = 0


class EmployeeDocumentInline(admin.TabularInline):
    model = EmployeeDocument
    extra = 0
    fields = ["doc_type", "title", "file", "expiry_date", "is_verified"]


class EmployeeAssetInline(admin.TabularInline):
    model = EmployeeAsset
    extra = 0


class PieceRateItemInline(admin.TabularInline):
    model = PieceRateItem
    extra = 1


class PayslipLineInline(admin.TabularInline):
    model = PayslipLine
    extra = 0
    readonly_fields = ["component", "description", "component_type", "amount"]


class AdvanceRecoveryInline(admin.TabularInline):
    model = AdvanceRecovery
    extra = 0
    readonly_fields = ["recovery_date", "amount", "instalment_number", "balance_after"]


class SalaryStructureComponentInline(admin.TabularInline):
    model = SalaryStructureComponent
    extra = 1


class SectionInline(admin.TabularInline):
    model = Section
    extra = 0
    fields = ["code", "name", "supervisor", "is_active"]


# ─── Organisation ─────────────────────────────────────────────────────────────

@admin.register(Department)
class DepartmentAdmin(admin.ModelAdmin):
    list_display = ["code", "name", "branch", "head", "cost_centre_code", "is_production", "is_active"]
    list_filter = ["branch", "is_production", "is_active"]
    search_fields = ["code", "name"]
    inlines = [SectionInline]


@admin.register(Section)
class SectionAdmin(admin.ModelAdmin):
    list_display = ["code", "name", "department", "supervisor", "is_active"]
    list_filter = ["department__branch", "department"]


@admin.register(Line)
class LineAdmin(admin.ModelAdmin):
    list_display = ["code", "name", "section", "capacity", "is_active"]
    list_filter = ["section__department"]


@admin.register(Designation)
class DesignationAdmin(admin.ModelAdmin):
    list_display = ["code", "title", "level", "is_active"]
    list_filter = ["level", "is_active"]


@admin.register(Grade)
class GradeAdmin(admin.ModelAdmin):
    list_display = ["code", "name", "min_basic", "max_basic", "sort_order"]


@admin.register(CostCentre)
class CostCentreAdmin(admin.ModelAdmin):
    list_display = ["code", "name", "department", "gl_account_code", "is_active"]


@admin.register(Shift)
class ShiftAdmin(admin.ModelAdmin):
    list_display = ["code", "name", "start_time", "end_time", "working_hours", "is_night_shift", "is_active"]
    list_filter = ["is_night_shift", "is_active"]


# ─── Employee ─────────────────────────────────────────────────────────────────

@admin.register(Employee)
class EmployeeAdmin(admin.ModelAdmin):
    list_display = [
        "employee_id", "full_name", "category", "department", "designation",
        "status", "joining_date", "wage_type",
    ]
    list_filter = ["status", "category", "department", "branch", "wage_type"]
    search_fields = ["employee_id", "full_name", "cnic", "phone"]
    readonly_fields = ["employee_id", "qr_badge_token"]
    inlines = [EmployeeSkillInline, EmployeeDocumentInline, EmployeeAssetInline]
    fieldsets = (
        ("Personal", {
            "fields": (
                "photo", "full_name", "full_name_ur", "father_husband_name",
                "cnic", "cnic_issue_date", "cnic_expiry_date", "date_of_birth",
                "gender", "marital_status", "religion", "nationality", "blood_group",
                "address_current", "address_permanent", "phone", "whatsapp", "email",
                "emergency_contact_1_name", "emergency_contact_1_relation", "emergency_contact_1_phone",
                "emergency_contact_2_name", "emergency_contact_2_relation", "emergency_contact_2_phone",
            ),
        }),
        ("Employment", {
            "fields": (
                "employee_id", "user", "category", "status", "branch",
                "department", "section", "line", "designation", "grade", "shift",
                "joining_date", "confirmation_date", "probation_months",
                "contract_end_date", "supervisor", "cost_centre", "work_location",
                "notice_period_days", "last_working_date", "contractor",
            ),
        }),
        ("Compensation", {
            "fields": (
                "wage_type", "basic_salary", "house_allowance", "medical_allowance",
                "conveyance_allowance", "attendance_bonus", "daily_rate",
                "ot_eligible", "piece_rate_group",
            ),
        }),
        ("Payment", {
            "fields": (
                "payment_method", "bank_name", "bank_account_number", "bank_iban",
                "mobile_wallet_number",
            ),
        }),
        ("Statutory", {
            "fields": ("eobi_number", "social_security_number", "tax_ntn", "is_tax_filer"),
        }),
        ("Badge / QR", {
            "fields": ("qr_badge_token", "badge_printed_at"),
        }),
    )


# ─── Piece Rate ───────────────────────────────────────────────────────────────

@admin.register(PieceRateGroup)
class PieceRateGroupAdmin(admin.ModelAdmin):
    list_display = ["code", "name", "department", "is_active"]
    inlines = [PieceRateItemInline]


@admin.register(PieceRateOutput)
class PieceRateOutputAdmin(admin.ModelAdmin):
    list_display = ["employee", "date", "rate_item", "quantity", "amount", "approved"]
    list_filter = ["approved", "date"]


# ─── Attendance ───────────────────────────────────────────────────────────────

@admin.register(HolidayCalendar)
class HolidayCalendarAdmin(admin.ModelAdmin):
    list_display = ["date", "name", "holiday_type", "branch", "paid"]
    list_filter = ["holiday_type", "branch"]


@admin.register(DailyAttendance)
class DailyAttendanceAdmin(admin.ModelAdmin):
    list_display = [
        "employee", "date", "status", "shift", "clock_in", "clock_out",
        "worked_hours", "ot_hours", "late_minutes",
    ]
    list_filter = ["status", "date", "branch"]
    search_fields = ["employee__employee_id", "employee__full_name"]
    date_hierarchy = "date"


@admin.register(AttendancePunch)
class AttendancePunchAdmin(admin.ModelAdmin):
    list_display = ["employee", "punch_time", "punch_type", "source", "device_id"]
    list_filter = ["source", "punch_type"]


@admin.register(AttendanceRule)
class AttendanceRuleAdmin(admin.ModelAdmin):
    list_display = ["code", "name", "ot_rate_multiplier", "lates_for_absent", "effective_from"]


# ─── Leave ────────────────────────────────────────────────────────────────────

@admin.register(LeaveType)
class LeaveTypeAdmin(admin.ModelAdmin):
    list_display = ["code", "name", "annual_quota", "is_paid", "encashable", "carry_forward_max"]


@admin.register(LeaveRequest)
class LeaveRequestAdmin(admin.ModelAdmin):
    list_display = ["employee", "leave_type", "from_date", "to_date", "total_days", "status"]
    list_filter = ["status", "leave_type"]


@admin.register(LeaveBalance)
class LeaveBalanceAdmin(admin.ModelAdmin):
    list_display = ["employee", "leave_type", "year", "entitled", "used", "available"]


# ─── Payroll ──────────────────────────────────────────────────────────────────

@admin.register(SalaryStructure)
class SalaryStructureAdmin(admin.ModelAdmin):
    list_display = ["code", "name", "effective_from", "is_active"]
    inlines = [SalaryStructureComponentInline]


@admin.register(SalaryComponent)
class SalaryComponentAdmin(admin.ModelAdmin):
    list_display = ["code", "name", "component_type", "calc_type", "is_taxable"]
    list_filter = ["component_type", "is_taxable"]


@admin.register(PayPeriod)
class PayPeriodAdmin(admin.ModelAdmin):
    list_display = ["code", "period_type", "start_date", "end_date", "is_locked"]
    list_filter = ["period_type", "is_locked"]


@admin.register(PayrollRun)
class PayrollRunAdmin(admin.ModelAdmin):
    list_display = [
        "pay_period", "branch", "status", "employee_count",
        "total_gross", "total_net", "exception_count",
    ]
    list_filter = ["status", "branch"]


@admin.register(Payslip)
class PayslipAdmin(admin.ModelAdmin):
    list_display = [
        "employee", "pay_period", "days_present", "gross_earnings",
        "total_deductions", "net_pay", "is_exception",
    ]
    list_filter = ["is_exception", "pay_period"]
    inlines = [PayslipLineInline]


# ─── Advances & Fines ────────────────────────────────────────────────────────

@admin.register(Advance)
class AdvanceAdmin(admin.ModelAdmin):
    list_display = ["employee", "advance_type", "amount", "outstanding", "status", "instalments"]
    list_filter = ["advance_type", "status"]
    inlines = [AdvanceRecoveryInline]


@admin.register(Fine)
class FineAdmin(admin.ModelAdmin):
    list_display = ["employee", "reason_code", "amount", "fine_date", "status"]
    list_filter = ["status"]


# ─── Contractor ───────────────────────────────────────────────────────────────

@admin.register(Contractor)
class ContractorAdmin(admin.ModelAdmin):
    list_display = ["code", "name", "phone", "licence_expiry", "performance_rating", "is_active"]
    list_filter = ["is_active"]


@admin.register(ContractorBill)
class ContractorBillAdmin(admin.ModelAdmin):
    list_display = ["bill_number", "contractor", "period_start", "period_end", "net_payable", "status"]
    list_filter = ["status"]


# ─── Recruitment ──────────────────────────────────────────────────────────────

@admin.register(ManpowerRequisition)
class ManpowerRequisitionAdmin(admin.ModelAdmin):
    list_display = ["requisition_number", "department", "designation", "positions_count", "status"]
    list_filter = ["status", "department"]


@admin.register(Applicant)
class ApplicantAdmin(admin.ModelAdmin):
    list_display = ["full_name", "status", "source", "applied_for_designation"]
    list_filter = ["status", "source"]


# ─── Performance ──────────────────────────────────────────────────────────────

@admin.register(PerformanceCycle)
class PerformanceCycleAdmin(admin.ModelAdmin):
    list_display = ["name", "year", "start_date", "end_date", "is_active"]


@admin.register(PerformanceAppraisal)
class PerformanceAppraisalAdmin(admin.ModelAdmin):
    list_display = ["employee", "cycle", "status", "final_rating"]
    list_filter = ["status", "cycle"]


# ─── Training & Safety ───────────────────────────────────────────────────────

@admin.register(TrainingProgram)
class TrainingProgramAdmin(admin.ModelAdmin):
    list_display = ["code", "title", "is_mandatory", "is_safety_training"]


@admin.register(SafetyIncident)
class SafetyIncidentAdmin(admin.ModelAdmin):
    list_display = ["incident_number", "date", "severity", "employee", "days_lost", "status"]
    list_filter = ["severity", "status"]


# ─── Discipline ───────────────────────────────────────────────────────────────

@admin.register(DisciplinaryAction)
class DisciplinaryActionAdmin(admin.ModelAdmin):
    list_display = ["employee", "action_type", "incident_date", "status"]
    list_filter = ["action_type", "status"]


@admin.register(Grievance)
class GrievanceAdmin(admin.ModelAdmin):
    list_display = ["category", "is_anonymous", "status", "created_at"]
    list_filter = ["category", "status"]


# ─── Separation ───────────────────────────────────────────────────────────────

@admin.register(Separation)
class SeparationAdmin(admin.ModelAdmin):
    list_display = [
        "employee", "separation_type", "status", "initiated_date",
        "last_working_date", "final_settlement_amount",
    ]
    list_filter = ["separation_type", "status"]


# ─── Statutory ────────────────────────────────────────────────────────────────

@admin.register(StatutoryRule)
class StatutoryRuleAdmin(admin.ModelAdmin):
    list_display = ["rule_id", "category", "name", "value_numeric", "effective_from", "is_active"]
    list_filter = ["category", "is_active"]
    search_fields = ["rule_id", "name"]


@admin.register(TaxSlab)
class TaxSlabAdmin(admin.ModelAdmin):
    list_display = ["min_income", "max_income", "fixed_tax", "rate_on_excess", "effective_from", "for_filer"]


# ─── Delegation ───────────────────────────────────────────────────────────────

@admin.register(Delegation)
class DelegationAdmin(admin.ModelAdmin):
    list_display = ["delegator", "delegate", "module", "start_date", "end_date", "is_active"]
