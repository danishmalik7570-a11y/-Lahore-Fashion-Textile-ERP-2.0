"""
HR App — Serializers for all HR modules.
Field-level security applied via RBAC FieldPolicy.
"""
from decimal import Decimal
from rest_framework import serializers

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
)


# ─── Organisation ─────────────────────────────────────────────────────────────

class DepartmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Department
        fields = "__all__"


class DepartmentListSerializer(serializers.ModelSerializer):
    employee_count = serializers.IntegerField(read_only=True, default=0)

    class Meta:
        model = Department
        fields = ["id", "code", "name", "name_ur", "branch", "is_production", "is_active",
                  "cost_centre_code", "head", "sort_order", "employee_count"]


class SectionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Section
        fields = "__all__"


class LineSerializer(serializers.ModelSerializer):
    class Meta:
        model = Line
        fields = "__all__"


class DesignationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Designation
        fields = "__all__"


class GradeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Grade
        fields = "__all__"


class CostCentreSerializer(serializers.ModelSerializer):
    class Meta:
        model = CostCentre
        fields = "__all__"


class ShiftSerializer(serializers.ModelSerializer):
    class Meta:
        model = Shift
        fields = "__all__"


# ─── Employee Master ──────────────────────────────────────────────────────────

class EmployeeSkillSerializer(serializers.ModelSerializer):
    class Meta:
        model = EmployeeSkill
        fields = "__all__"


class EmployeeDocumentSerializer(serializers.ModelSerializer):
    is_expired = serializers.BooleanField(read_only=True)

    class Meta:
        model = EmployeeDocument
        fields = "__all__"


class EmployeeAssetSerializer(serializers.ModelSerializer):
    class Meta:
        model = EmployeeAsset
        fields = "__all__"


class EmployeeListSerializer(serializers.ModelSerializer):
    """Lightweight list serializer — no sensitive fields."""
    department_name = serializers.CharField(source="department.name", read_only=True, default="")
    designation_title = serializers.CharField(source="designation.title", read_only=True, default="")
    shift_name = serializers.CharField(source="shift.name", read_only=True, default="")

    class Meta:
        model = Employee
        fields = [
            "id", "employee_id", "photo", "full_name", "category", "status",
            "department", "department_name", "designation", "designation_title",
            "shift", "shift_name", "joining_date", "phone", "branch",
        ]


class EmployeeDetailSerializer(serializers.ModelSerializer):
    """Full 360° profile — sensitive fields conditionally masked by RBAC."""
    skills = EmployeeSkillSerializer(many=True, read_only=True)
    documents = EmployeeDocumentSerializer(many=True, read_only=True)
    assets_issued = EmployeeAssetSerializer(many=True, read_only=True)
    age = serializers.IntegerField(read_only=True)
    service_years = serializers.DecimalField(max_digits=6, decimal_places=2, read_only=True)
    gross_salary = serializers.DecimalField(max_digits=16, decimal_places=2, read_only=True)
    department_name = serializers.CharField(source="department.name", read_only=True, default="")
    designation_title = serializers.CharField(source="designation.title", read_only=True, default="")
    supervisor_name = serializers.CharField(source="supervisor.full_name", read_only=True, default="")

    class Meta:
        model = Employee
        fields = "__all__"
        extra_kwargs = {
            "cnic": {"help_text": "Encrypted at rest. May be masked based on role."},
            "bank_account_number": {"help_text": "Encrypted at rest."},
        }

    def to_representation(self, instance):
        ret = super().to_representation(instance)
        request = self.context.get("request")
        user = getattr(request, "user", None) if request else None

        if user and not getattr(user, "is_superuser", False):
            from apps.rbac.permissions import get_user_field_policies
            policies = get_user_field_policies(user, module="hr_employee")

            salary_policy = policies.get("basic_salary")
            if salary_policy == "hide":
                ret.pop("basic_salary", None)
                ret.pop("gross_salary", None)
            elif salary_policy == "mask":
                ret["basic_salary"] = "******"
                if "gross_salary" in ret:
                    ret["gross_salary"] = "******"

            cnic_policy = policies.get("cnic")
            if cnic_policy == "hide":
                ret.pop("cnic", None)
            elif cnic_policy == "mask":
                val = ret.get("cnic") or ""
                if len(val) > 4:
                    ret["cnic"] = "*" * (len(val) - 4) + val[-4:]

            bank_policy = policies.get("bank_account_number")
            if bank_policy == "hide":
                ret.pop("bank_account_number", None)
                ret.pop("iban", None)
            elif bank_policy == "mask":
                val = ret.get("bank_account_number") or ""
                if len(val) > 4:
                    ret["bank_account_number"] = "*" * (len(val) - 4) + val[-4:]

        return ret


class EmployeeCreateSerializer(serializers.ModelSerializer):
    """Create/update serializer with duplicate CNIC check."""

    class Meta:
        model = Employee
        fields = "__all__"
        read_only_fields = ["employee_id", "qr_badge_token"]

    def validate_cnic(self, value):
        """Check for duplicate CNIC across all employees."""
        qs = Employee.objects.filter(cnic=value)
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError(
                f"An employee with CNIC {value} already exists: {qs.first().employee_id}"
            )
        return value


EmployeeSerializer = EmployeeCreateSerializer


# ─── Piece Rate ───────────────────────────────────────────────────────────────

class PieceRateGroupSerializer(serializers.ModelSerializer):
    items = serializers.SerializerMethodField()

    class Meta:
        model = PieceRateGroup
        fields = "__all__"

    def get_items(self, obj):
        return PieceRateItemSerializer(obj.items.filter(is_active=True), many=True).data


class PieceRateItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = PieceRateItem
        fields = "__all__"


class PieceRateOutputSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source="employee.full_name", read_only=True)
    operation_name = serializers.CharField(source="rate_item.operation_name", read_only=True)

    class Meta:
        model = PieceRateOutput
        fields = "__all__"


# ─── Attendance ───────────────────────────────────────────────────────────────

class HolidayCalendarSerializer(serializers.ModelSerializer):
    class Meta:
        model = HolidayCalendar
        fields = "__all__"


class ShiftRosterSerializer(serializers.ModelSerializer):
    shift_name = serializers.CharField(source="shift.name", read_only=True)
    employee_name = serializers.CharField(source="employee.full_name", read_only=True)

    class Meta:
        model = ShiftRoster
        fields = "__all__"


class AttendancePunchSerializer(serializers.ModelSerializer):
    class Meta:
        model = AttendancePunch
        fields = "__all__"


class DailyAttendanceSerializer(serializers.ModelSerializer):
    employee_id_display = serializers.CharField(source="employee.employee_id", read_only=True)
    employee_name = serializers.CharField(source="employee.full_name", read_only=True)
    shift_name = serializers.CharField(source="shift.name", read_only=True, default="")

    class Meta:
        model = DailyAttendance
        fields = "__all__"


class AttendanceCorrectionSerializer(serializers.ModelSerializer):
    class Meta:
        model = AttendanceCorrectionRequest
        fields = "__all__"


AttendanceCorrectionRequestSerializer = AttendanceCorrectionSerializer


class AttendanceRuleSerializer(serializers.ModelSerializer):
    class Meta:
        model = AttendanceRule
        fields = "__all__"


# ─── Leave ────────────────────────────────────────────────────────────────────

class LeaveTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = LeaveType
        fields = "__all__"


class LeaveBalanceSerializer(serializers.ModelSerializer):
    available = serializers.DecimalField(max_digits=5, decimal_places=1, read_only=True)
    leave_type_name = serializers.CharField(source="leave_type.name", read_only=True)

    class Meta:
        model = LeaveBalance
        fields = "__all__"


class LeaveRequestSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source="employee.full_name", read_only=True)
    leave_type_name = serializers.CharField(source="leave_type.name", read_only=True)

    class Meta:
        model = LeaveRequest
        fields = "__all__"

    def validate(self, data):
        if data.get("from_date") and data.get("to_date"):
            if data["from_date"] > data["to_date"]:
                raise serializers.ValidationError("From date must be before to date.")
        return data


# ─── Payroll ──────────────────────────────────────────────────────────────────

class SalaryStructureSerializer(serializers.ModelSerializer):
    class Meta:
        model = SalaryStructure
        fields = "__all__"


class SalaryStructureComponentSerializer(serializers.ModelSerializer):
    class Meta:
        model = SalaryStructureComponent
        fields = "__all__"


class SalaryComponentSerializer(serializers.ModelSerializer):
    class Meta:
        model = SalaryComponent
        fields = "__all__"


class PayPeriodSerializer(serializers.ModelSerializer):
    class Meta:
        model = PayPeriod
        fields = "__all__"


class PayrollRunSerializer(serializers.ModelSerializer):
    class Meta:
        model = PayrollRun
        fields = "__all__"


class PayslipSerializer(serializers.ModelSerializer):
    employee_id_display = serializers.CharField(source="employee.employee_id", read_only=True)
    employee_name = serializers.CharField(source="employee.full_name", read_only=True)

    class Meta:
        model = Payslip
        fields = "__all__"


class PayslipDetailSerializer(serializers.ModelSerializer):
    lines = serializers.SerializerMethodField()
    employee_name = serializers.CharField(source="employee.full_name", read_only=True)
    employee_id_display = serializers.CharField(source="employee.employee_id", read_only=True)

    class Meta:
        model = Payslip
        fields = "__all__"

    def get_lines(self, obj):
        return PayslipLineSerializer(obj.lines.all(), many=True).data


class PayslipLineSerializer(serializers.ModelSerializer):
    class Meta:
        model = PayslipLine
        fields = "__all__"


class PayrollExceptionSerializer(serializers.ModelSerializer):
    class Meta:
        model = PayrollException
        fields = "__all__"


# ─── Advances / Loans / Fines ─────────────────────────────────────────────────

class AdvanceSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source="employee.full_name", read_only=True)
    recoveries = serializers.SerializerMethodField()

    class Meta:
        model = Advance
        fields = "__all__"

    def get_recoveries(self, obj):
        return AdvanceRecoverySerializer(obj.recoveries.all(), many=True).data


class AdvanceRecoverySerializer(serializers.ModelSerializer):
    class Meta:
        model = AdvanceRecovery
        fields = "__all__"


class FineSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source="employee.full_name", read_only=True)

    class Meta:
        model = Fine
        fields = "__all__"


# ─── Contractor ───────────────────────────────────────────────────────────────

class ContractorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Contractor
        fields = "__all__"


class ContractorHeadcountSerializer(serializers.ModelSerializer):
    contractor_name = serializers.CharField(source="contractor.name", read_only=True)
    department_name = serializers.CharField(source="department.name", read_only=True)

    class Meta:
        model = ContractorHeadcount
        fields = "__all__"


class ContractorBillSerializer(serializers.ModelSerializer):
    contractor_name = serializers.CharField(source="contractor.name", read_only=True)

    class Meta:
        model = ContractorBill
        fields = "__all__"


# ─── Recruitment ──────────────────────────────────────────────────────────────

class ManpowerRequisitionSerializer(serializers.ModelSerializer):
    department_name = serializers.CharField(source="department.name", read_only=True)
    designation_title = serializers.CharField(source="designation.title", read_only=True)

    class Meta:
        model = ManpowerRequisition
        fields = "__all__"


class ApplicantSerializer(serializers.ModelSerializer):
    class Meta:
        model = Applicant
        fields = "__all__"


class InterviewSerializer(serializers.ModelSerializer):
    applicant_name = serializers.CharField(source="applicant.full_name", read_only=True)

    class Meta:
        model = Interview
        fields = "__all__"


class OnboardingChecklistSerializer(serializers.ModelSerializer):
    class Meta:
        model = OnboardingChecklist
        fields = "__all__"


# ─── Performance ──────────────────────────────────────────────────────────────

class PerformanceCycleSerializer(serializers.ModelSerializer):
    class Meta:
        model = PerformanceCycle
        fields = "__all__"


class PerformanceAppraisalSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source="employee.full_name", read_only=True)

    class Meta:
        model = PerformanceAppraisal
        fields = "__all__"


# ─── Training & Safety ───────────────────────────────────────────────────────

class TrainingProgramSerializer(serializers.ModelSerializer):
    class Meta:
        model = TrainingProgram
        fields = "__all__"


class TrainingSessionSerializer(serializers.ModelSerializer):
    program_title = serializers.CharField(source="program.title", read_only=True)

    class Meta:
        model = TrainingSession
        fields = "__all__"


class SafetyIncidentSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source="employee.full_name", read_only=True, default="")

    class Meta:
        model = SafetyIncident
        fields = "__all__"


# ─── Discipline & Grievance ──────────────────────────────────────────────────

class DisciplinaryActionSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source="employee.full_name", read_only=True)

    class Meta:
        model = DisciplinaryAction
        fields = "__all__"


class GrievanceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Grievance
        fields = "__all__"


# ─── Separation ───────────────────────────────────────────────────────────────

class SeparationSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source="employee.full_name", read_only=True)
    employee_id_display = serializers.CharField(source="employee.employee_id", read_only=True)

    class Meta:
        model = Separation
        fields = "__all__"


# ─── Statutory ────────────────────────────────────────────────────────────────

class StatutoryRuleSerializer(serializers.ModelSerializer):
    class Meta:
        model = StatutoryRule
        fields = "__all__"


class TaxSlabSerializer(serializers.ModelSerializer):
    class Meta:
        model = TaxSlab
        fields = "__all__"


# ─── Delegation ───────────────────────────────────────────────────────────────

class DelegationSerializer(serializers.ModelSerializer):
    is_current = serializers.BooleanField(read_only=True)

    class Meta:
        model = Delegation
        fields = "__all__"
