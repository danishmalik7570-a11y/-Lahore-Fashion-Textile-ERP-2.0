"""
HR App — REST API ViewSets.
Protected with DRF IsAuthenticated and RBACPermission.
Supports multi-branch scoping, maker-checker approvals, and field-level security.
"""
from datetime import date
from decimal import Decimal
from django.http import HttpResponse
from django.utils import timezone
from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.rbac.permissions import RBACPermission, check_permission
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
from apps.hr.serializers import (
    DepartmentSerializer, DepartmentListSerializer, SectionSerializer, LineSerializer,
    DesignationSerializer, GradeSerializer, CostCentreSerializer, ShiftSerializer,
    EmployeeSerializer, EmployeeListSerializer, EmployeeDetailSerializer,
    EmployeeSkillSerializer, EmployeeDocumentSerializer, EmployeeAssetSerializer,
    PieceRateGroupSerializer, PieceRateItemSerializer, PieceRateOutputSerializer,
    HolidayCalendarSerializer, ShiftRosterSerializer, AttendancePunchSerializer,
    DailyAttendanceSerializer, AttendanceCorrectionRequestSerializer, AttendanceRuleSerializer,
    LeaveTypeSerializer, LeaveBalanceSerializer, LeaveRequestSerializer,
    SalaryStructureSerializer, SalaryComponentSerializer, SalaryStructureComponentSerializer,
    PayPeriodSerializer, PayrollRunSerializer, PayslipSerializer, PayslipLineSerializer,
    PayrollExceptionSerializer, AdvanceSerializer, FineSerializer,
    ContractorSerializer, ContractorHeadcountSerializer, ContractorBillSerializer,
    ManpowerRequisitionSerializer, ApplicantSerializer, InterviewSerializer,
    OnboardingChecklistSerializer, PerformanceCycleSerializer, PerformanceAppraisalSerializer,
    TrainingProgramSerializer, TrainingSessionSerializer, SafetyIncidentSerializer,
    DisciplinaryActionSerializer, GrievanceSerializer, SeparationSerializer,
    StatutoryRuleSerializer, TaxSlabSerializer, DelegationSerializer,
)
from apps.hr.services import (
    PayrollEngine, AttendanceReconciliationService,
    ContractorBillingService, GratuityAndExitService,
)


class BaseBranchScopedViewSet(viewsets.ModelViewSet):
    """Base ViewSet with branch scoping and RBAC enforcement."""
    permission_classes = [permissions.IsAuthenticated, RBACPermission]

    def get_queryset(self):
        qs = super().get_queryset()
        user = getattr(self.request, "user", None)
        if not user or not getattr(user, "is_authenticated", False):
            return qs
        if getattr(user, "is_superuser", False):
            return qs
        if hasattr(self.model, "branch") and hasattr(user, "branch") and user.branch:
            return qs.filter(branch=user.branch)
        return qs


# ─── Organisation ─────────────────────────────────────────────────────────────

class DepartmentViewSet(BaseBranchScopedViewSet):
    queryset = Department.objects.select_related("parent", "head").all()
    rbac_module = "settings"
    model = Department

    def get_serializer_class(self):
        if self.action == "list":
            return DepartmentListSerializer
        return DepartmentSerializer


class SectionViewSet(BaseBranchScopedViewSet):
    queryset = Section.objects.select_related("department", "supervisor").all()
    serializer_class = SectionSerializer
    rbac_module = "settings"
    model = Section


class LineViewSet(BaseBranchScopedViewSet):
    queryset = Line.objects.select_related("section").all()
    serializer_class = LineSerializer
    rbac_module = "settings"
    model = Line


class DesignationViewSet(viewsets.ModelViewSet):
    queryset = Designation.objects.select_related("grade").all()
    serializer_class = DesignationSerializer
    permission_classes = [permissions.IsAuthenticated, RBACPermission]
    rbac_module = "settings"


class GradeViewSet(viewsets.ModelViewSet):
    queryset = Grade.objects.all()
    serializer_class = GradeSerializer
    permission_classes = [permissions.IsAuthenticated, RBACPermission]
    rbac_module = "settings"


class CostCentreViewSet(BaseBranchScopedViewSet):
    queryset = CostCentre.objects.all()
    serializer_class = CostCentreSerializer
    rbac_module = "settings"
    model = CostCentre


class ShiftViewSet(BaseBranchScopedViewSet):
    queryset = Shift.objects.all()
    serializer_class = ShiftSerializer
    rbac_module = "attendance"
    model = Shift


# ─── Employee Master (360° Profile) ──────────────────────────────────────────

class EmployeeViewSet(BaseBranchScopedViewSet):
    queryset = Employee.objects.select_related(
        "branch", "department", "section", "line", "designation", "grade", "shift", "supervisor"
    ).all()
    rbac_module = "hr_employee"
    model = Employee

    def get_queryset(self):
        qs = super().get_queryset()
        user = getattr(self.request, "user", None) or getattr(self.request, "_force_auth_user", None)
        if not user or not getattr(user, "is_authenticated", False) or getattr(user, "is_superuser", False):
            return qs

        from apps.rbac.permissions import get_user_scope
        user_scope = get_user_scope(user, "hr_employee", "view")

        user_line = getattr(user, "line", None) or getattr(getattr(user, "employee_profile", None), "line", None)
        user_section = getattr(user, "section", None) or getattr(getattr(user, "employee_profile", None), "section", None)
        user_dept = getattr(user, "department", None) or getattr(getattr(user, "employee_profile", None), "department", None)

        if user_scope == "line" or (user_line and user_scope in ["line", "section", "team", "own"]):
            return qs.filter(line=user_line)
        elif user_scope == "section" and user_section:
            return qs.filter(section=user_section)
        elif user_scope == "department" and user_dept:
            return qs.filter(department=user_dept)
        elif user_scope == "own":
            emp_id = getattr(getattr(user, "employee_profile", None), "id", None)
            return qs.filter(id=emp_id) if emp_id else qs.none()

        return qs

    def get_serializer_class(self):
        if self.action == "list":
            return EmployeeListSerializer
        if self.action in ["retrieve", "update", "partial_update"]:
            return EmployeeDetailSerializer
        return EmployeeSerializer

    @action(detail=True, methods=["post"], url_path="generate-badge")
    def generate_badge(self, request, pk=None):
        employee = self.get_object()
        token = employee.generate_qr_badge()
        return Response({
            "employee_id": employee.employee_id,
            "badge_token": token,
            "qr_code_url": employee.qr_badge_token,
            "message": "Badge QR token generated successfully.",
        })

    @action(detail=True, methods=["post"], url_path="enroll-biometric")
    def enroll_biometric(self, request, pk=None):
        employee = self.get_object()
        bio_id = request.data.get("biometric_user_id")
        if not bio_id:
            return Response({"error": "biometric_user_id required"}, status=status.HTTP_400_BAD_REQUEST)
        employee.biometric_user_id = bio_id
        employee.save(update_fields=["biometric_user_id"])
        return Response({"message": f"Biometric user ID {bio_id} mapped to {employee.employee_id}"})


class EmployeeSkillViewSet(viewsets.ModelViewSet):
    queryset = EmployeeSkill.objects.all()
    serializer_class = EmployeeSkillSerializer
    permission_classes = [permissions.IsAuthenticated]


class EmployeeDocumentViewSet(viewsets.ModelViewSet):
    queryset = EmployeeDocument.objects.all()
    serializer_class = EmployeeDocumentSerializer
    permission_classes = [permissions.IsAuthenticated]


class EmployeeAssetViewSet(viewsets.ModelViewSet):
    queryset = EmployeeAsset.objects.all()
    serializer_class = EmployeeAssetSerializer
    permission_classes = [permissions.IsAuthenticated]


# ─── Attendance & Shifts ──────────────────────────────────────────────────────

class AttendancePunchViewSet(BaseBranchScopedViewSet):
    queryset = AttendancePunch.objects.select_related("employee").all()
    serializer_class = AttendancePunchSerializer
    rbac_module = "attendance"
    model = AttendancePunch


class DailyAttendanceViewSet(BaseBranchScopedViewSet):
    queryset = DailyAttendance.objects.select_related("employee", "shift").all()
    serializer_class = DailyAttendanceSerializer
    rbac_module = "attendance"
    model = DailyAttendance

    @action(detail=False, methods=["post"], url_path="reconcile")
    def reconcile(self, request):
        target_date_str = request.data.get("date")
        target_date = date.fromisoformat(target_date_str) if target_date_str else timezone.now().date()
        branch = request.user.branch if hasattr(request.user, "branch") else None
        res = AttendanceReconciliationService.reconcile_day(target_date=target_date, branch=branch)
        return Response({
            "message": f"Attendance reconciled for {target_date}",
            "result": res,
        })


class AttendanceCorrectionRequestViewSet(BaseBranchScopedViewSet):
    queryset = AttendanceCorrectionRequest.objects.all()
    serializer_class = AttendanceCorrectionRequestSerializer
    rbac_module = "attendance"
    model = AttendanceCorrectionRequest


class AttendanceRuleViewSet(viewsets.ModelViewSet):
    queryset = AttendanceRule.objects.all()
    serializer_class = AttendanceRuleSerializer
    permission_classes = [permissions.IsAuthenticated, RBACPermission]
    rbac_module = "attendance"


class HolidayCalendarViewSet(BaseBranchScopedViewSet):
    queryset = HolidayCalendar.objects.all()
    serializer_class = HolidayCalendarSerializer
    rbac_module = "attendance"
    model = HolidayCalendar


class ShiftRosterViewSet(BaseBranchScopedViewSet):
    queryset = ShiftRoster.objects.all()
    serializer_class = ShiftRosterSerializer
    rbac_module = "attendance"
    model = ShiftRoster


# ─── Leave Management ─────────────────────────────────────────────────────────

class LeaveTypeViewSet(viewsets.ModelViewSet):
    queryset = LeaveType.objects.all()
    serializer_class = LeaveTypeSerializer
    permission_classes = [permissions.IsAuthenticated, RBACPermission]
    rbac_module = "leave"


class LeaveBalanceViewSet(BaseBranchScopedViewSet):
    queryset = LeaveBalance.objects.select_related("employee", "leave_type").all()
    serializer_class = LeaveBalanceSerializer
    rbac_module = "leave"
    model = LeaveBalance


class LeaveRequestViewSet(BaseBranchScopedViewSet):
    queryset = LeaveRequest.objects.select_related("employee", "leave_type").all()
    serializer_class = LeaveRequestSerializer
    rbac_module = "leave"
    model = LeaveRequest

    @action(detail=True, methods=["post"], url_path="approve")
    def approve(self, request, pk=None):
        leave = self.get_object()
        leave.status = LeaveRequest.Status.APPROVED
        leave.approved_by = request.user
        leave.approved_at = timezone.now()
        leave.save()

        # Update leave balance
        bal = LeaveBalance.objects.filter(employee=leave.employee, leave_type=leave.leave_type).first()
        if bal:
            bal.used_days += leave.days_count
            bal.balance_days = max(Decimal("0.00"), bal.allocated_days - bal.used_days)
            bal.save()

        return Response({"message": "Leave application approved", "status": leave.status})

    @action(detail=True, methods=["post"], url_path="reject")
    def reject(self, request, pk=None):
        leave = self.get_object()
        leave.status = LeaveRequest.Status.REJECTED
        leave.approved_by = request.user
        leave.rejection_reason = request.data.get("reason", "Rejected by manager")
        leave.save()
        return Response({"message": "Leave application rejected", "status": leave.status})


# ─── Payroll & Statutory ──────────────────────────────────────────────────────

class SalaryStructureViewSet(BaseBranchScopedViewSet):
    queryset = SalaryStructure.objects.all()
    serializer_class = SalaryStructureSerializer
    rbac_module = "payroll"
    model = SalaryStructure


class SalaryComponentViewSet(viewsets.ModelViewSet):
    queryset = SalaryComponent.objects.all()
    serializer_class = SalaryComponentSerializer
    permission_classes = [permissions.IsAuthenticated, RBACPermission]
    rbac_module = "payroll"


class PayPeriodViewSet(BaseBranchScopedViewSet):
    queryset = PayPeriod.objects.all()
    serializer_class = PayPeriodSerializer
    rbac_module = "payroll"
    model = PayPeriod


class PayrollRunViewSet(BaseBranchScopedViewSet):
    queryset = PayrollRun.objects.select_related("pay_period", "branch").all()
    serializer_class = PayrollRunSerializer
    rbac_module = "payroll"
    model = PayrollRun

    @action(detail=True, methods=["post"], url_path="process")
    def process(self, request, pk=None):
        prun = self.get_object()
        if prun.is_locked:
            return Response({"error": "Payroll is locked and cannot be processed."}, status=status.HTTP_400_BAD_REQUEST)
        result = PayrollEngine.process_payroll_run(payroll_run=prun, user=request.user)
        return Response({"message": "Payroll processed successfully", "summary": result})

    @action(detail=True, methods=["post"], url_path="approve")
    def approve(self, request, pk=None):
        prun = self.get_object()
        from apps.rbac.permissions import check_maker_checker
        user = getattr(request, "user", None) or getattr(request, "_force_auth_user", None)
        if not check_maker_checker(prun, user):
            return Response(
                {"error": "Segregation of Duties (SoD) Violation: Payroll preparer cannot approve the payroll run."},
                status=status.HTTP_403_FORBIDDEN,
            )
        prun.status = PayrollRun.RunStatus.HR_APPROVED
        prun.hr_approved_by = user
        prun.hr_approved_at = timezone.now()
        prun.save()
        return Response({"message": f"Payroll {prun.id} approved successfully."})

    @action(detail=True, methods=["post"], url_path="lock")
    def lock(self, request, pk=None):
        prun = self.get_object()
        from apps.rbac.permissions import check_maker_checker
        user = getattr(request, "user", None) or getattr(request, "_force_auth_user", None)
        if not check_maker_checker(prun, user):
            return Response(
                {"error": "Segregation of Duties (SoD) Violation: Payroll preparer cannot lock/approve the payroll run."},
                status=status.HTTP_403_FORBIDDEN,
            )
        prun.is_locked = True
        prun.locked_at = timezone.now()
        prun.locked_by = user
        prun.status = PayrollRun.RunStatus.LOCKED
        prun.save()
        return Response({"message": f"Payroll {prun.id} locked successfully."})

    @action(detail=True, methods=["get"], url_path="export-bank")
    def export_bank(self, request, pk=None):
        prun = self.get_object()
        csv_content = PayrollEngine.generate_bank_advice_csv(payroll_run=prun)
        response = HttpResponse(csv_content, content_type="text/csv")
        response["Content-Disposition"] = f'attachment; filename="Bank_Advice_{prun.run_number}.csv"'
        return response


class PayslipViewSet(BaseBranchScopedViewSet):
    queryset = Payslip.objects.select_related("employee", "payroll_run").prefetch_related("lines").all()
    serializer_class = PayslipSerializer
    rbac_module = "payroll"
    model = Payslip


class AdvanceViewSet(BaseBranchScopedViewSet):
    queryset = Advance.objects.select_related("employee").all()
    serializer_class = AdvanceSerializer
    rbac_module = "advances"
    model = Advance

    @action(detail=True, methods=["post"], url_path="disburse")
    def disburse(self, request, pk=None):
        adv = self.get_object()
        adv.status = Advance.Status.DISBURSED
        adv.disbursed_at = timezone.now()
        adv.disbursed_by = request.user
        adv.save()
        return Response({"message": "Advance disbursed successfully", "status": adv.status})


class FineViewSet(BaseBranchScopedViewSet):
    queryset = Fine.objects.select_related("employee").all()
    serializer_class = FineSerializer
    rbac_module = "advances"
    model = Fine


# ─── Piece-Rate System ────────────────────────────────────────────────────────

class PieceRateGroupViewSet(BaseBranchScopedViewSet):
    queryset = PieceRateGroup.objects.all()
    serializer_class = PieceRateGroupSerializer
    rbac_module = "payroll"
    model = PieceRateGroup


class PieceRateItemViewSet(BaseBranchScopedViewSet):
    queryset = PieceRateItem.objects.all()
    serializer_class = PieceRateItemSerializer
    rbac_module = "payroll"
    model = PieceRateItem


class PieceRateOutputViewSet(BaseBranchScopedViewSet):
    queryset = PieceRateOutput.objects.select_related("employee", "item").all()
    serializer_class = PieceRateOutputSerializer
    rbac_module = "payroll"
    model = PieceRateOutput

    @action(detail=True, methods=["post"], url_path="verify")
    def verify(self, request, pk=None):
        output = self.get_object()
        output.status = PieceRateOutput.Status.VERIFIED
        output.verified_by = request.user
        output.verified_at = timezone.now()
        output.save()
        return Response({"message": "Piece-rate output verified successfully"})


# ─── Contractors (Thekedar) ───────────────────────────────────────────────────

class ContractorViewSet(BaseBranchScopedViewSet):
    queryset = Contractor.objects.all()
    serializer_class = ContractorSerializer
    rbac_module = "contractors"
    model = Contractor

    @action(detail=True, methods=["post"], url_path="generate-bill")
    def generate_bill(self, request, pk=None):
        contractor = self.get_object()
        period_id = request.data.get("pay_period_id")
        if not period_id:
            return Response({"error": "pay_period_id required"}, status=status.HTTP_400_BAD_REQUEST)
        pay_period = PayPeriod.objects.get(id=period_id)
        bill = ContractorBillingService.generate_bill(contractor=contractor, pay_period=pay_period, user=request.user)
        return Response({
            "message": "Contractor bill generated",
            "bill_id": str(bill.id),
            "bill_number": bill.bill_number,
            "net_payable": str(bill.net_payable),
        })


class ContractorHeadcountViewSet(BaseBranchScopedViewSet):
    queryset = ContractorHeadcount.objects.select_related("contractor").all()
    serializer_class = ContractorHeadcountSerializer
    rbac_module = "contractors"
    model = ContractorHeadcount

    @action(detail=True, methods=["post"], url_path="verify")
    def verify(self, request, pk=None):
        hc = self.get_object()
        hc.is_verified = True
        hc.verified_by = request.user
        hc.verified_at = timezone.now()
        hc.save()
        return Response({"message": "Headcount verified successfully."})


class ContractorBillViewSet(BaseBranchScopedViewSet):
    queryset = ContractorBill.objects.select_related("contractor", "pay_period").all()
    serializer_class = ContractorBillSerializer
    rbac_module = "contractors"
    model = ContractorBill

    @action(detail=True, methods=["post"], url_path="approve")
    def approve(self, request, pk=None):
        bill = self.get_object()
        bill.status = ContractorBill.Status.APPROVED
        bill.approved_by = request.user
        bill.approved_at = timezone.now()
        bill.save()
        return Response({"message": f"Contractor bill {bill.bill_number} approved."})


# ─── Recruitment & Onboarding ────────────────────────────────────────────────

class ManpowerRequisitionViewSet(BaseBranchScopedViewSet):
    queryset = ManpowerRequisition.objects.all()
    serializer_class = ManpowerRequisitionSerializer
    rbac_module = "hr_recruitment"
    model = ManpowerRequisition


class ApplicantViewSet(BaseBranchScopedViewSet):
    queryset = Applicant.objects.all()
    serializer_class = ApplicantSerializer
    rbac_module = "hr_recruitment"
    model = Applicant


class InterviewViewSet(viewsets.ModelViewSet):
    queryset = Interview.objects.all()
    serializer_class = InterviewSerializer
    permission_classes = [permissions.IsAuthenticated]


class OnboardingChecklistViewSet(viewsets.ModelViewSet):
    queryset = OnboardingChecklist.objects.all()
    serializer_class = OnboardingChecklistSerializer
    permission_classes = [permissions.IsAuthenticated]


# ─── Performance, Training, Safety & Discipline ──────────────────────────────

class PerformanceCycleViewSet(BaseBranchScopedViewSet):
    queryset = PerformanceCycle.objects.all()
    serializer_class = PerformanceCycleSerializer
    rbac_module = "performance"
    model = PerformanceCycle


class PerformanceAppraisalViewSet(BaseBranchScopedViewSet):
    queryset = PerformanceAppraisal.objects.select_related("employee", "cycle").all()
    serializer_class = PerformanceAppraisalSerializer
    rbac_module = "performance"
    model = PerformanceAppraisal


class TrainingProgramViewSet(BaseBranchScopedViewSet):
    queryset = TrainingProgram.objects.all()
    serializer_class = TrainingProgramSerializer
    rbac_module = "training"
    model = TrainingProgram


class TrainingSessionViewSet(viewsets.ModelViewSet):
    queryset = TrainingSession.objects.all()
    serializer_class = TrainingSessionSerializer
    permission_classes = [permissions.IsAuthenticated]


class SafetyIncidentViewSet(BaseBranchScopedViewSet):
    queryset = SafetyIncident.objects.all()
    serializer_class = SafetyIncidentSerializer
    rbac_module = "training"
    model = SafetyIncident


class DisciplinaryActionViewSet(BaseBranchScopedViewSet):
    queryset = DisciplinaryAction.objects.select_related("employee").all()
    serializer_class = DisciplinaryActionSerializer
    rbac_module = "discipline"
    model = DisciplinaryAction


class GrievanceViewSet(BaseBranchScopedViewSet):
    queryset = Grievance.objects.all()
    serializer_class = GrievanceSerializer
    rbac_module = "discipline"
    model = Grievance


# ─── Separation & Statutory Master ───────────────────────────────────────────

class SeparationViewSet(BaseBranchScopedViewSet):
    queryset = Separation.objects.select_related("employee").all()
    serializer_class = SeparationSerializer
    rbac_module = "separation"
    model = Separation

    @action(detail=True, methods=["post"], url_path="calculate-settlement")
    def calculate_settlement(self, request, pk=None):
        separation = self.get_object()
        settlement = GratuityAndExitService.calculate_settlement(separation)
        return Response({
            "message": "Final settlement computed successfully.",
            "settlement": settlement,
        })


class StatutoryRuleViewSet(viewsets.ModelViewSet):
    queryset = StatutoryRule.objects.all().order_by("-effective_from")
    serializer_class = StatutoryRuleSerializer
    permission_classes = [permissions.IsAuthenticated, RBACPermission]
    rbac_module = "compliance"


class TaxSlabViewSet(viewsets.ModelViewSet):
    queryset = TaxSlab.objects.all().order_by("sort_order")
    serializer_class = TaxSlabSerializer
    permission_classes = [permissions.IsAuthenticated, RBACPermission]
    rbac_module = "compliance"


class DelegationViewSet(BaseBranchScopedViewSet):
    queryset = Delegation.objects.all()
    serializer_class = DelegationSerializer
    rbac_module = "settings"
    model = Delegation
