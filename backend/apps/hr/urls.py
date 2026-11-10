"""
HR App — API URL routing.
Exposes complete REST endpoints under /api/v1/hr/
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter

from apps.hr.views import (
    DepartmentViewSet, SectionViewSet, LineViewSet, DesignationViewSet, GradeViewSet,
    CostCentreViewSet, ShiftViewSet,
    EmployeeViewSet, EmployeeSkillViewSet, EmployeeDocumentViewSet, EmployeeAssetViewSet,
    AttendancePunchViewSet, DailyAttendanceViewSet, AttendanceCorrectionRequestViewSet,
    AttendanceRuleViewSet, HolidayCalendarViewSet, ShiftRosterViewSet,
    LeaveTypeViewSet, LeaveBalanceViewSet, LeaveRequestViewSet,
    SalaryStructureViewSet, SalaryComponentViewSet, PayPeriodViewSet, PayrollRunViewSet,
    PayslipViewSet, AdvanceViewSet, FineViewSet,
    PieceRateGroupViewSet, PieceRateItemViewSet, PieceRateOutputViewSet,
    ContractorViewSet, ContractorHeadcountViewSet, ContractorBillViewSet,
    ManpowerRequisitionViewSet, ApplicantViewSet, InterviewViewSet, OnboardingChecklistViewSet,
    PerformanceCycleViewSet, PerformanceAppraisalViewSet, TrainingProgramViewSet,
    TrainingSessionViewSet, SafetyIncidentViewSet, DisciplinaryActionViewSet, GrievanceViewSet,
    SeparationViewSet, StatutoryRuleViewSet, TaxSlabViewSet, DelegationViewSet,
)

app_name = "hr"

router = DefaultRouter()

# Organisation
router.register(r"departments", DepartmentViewSet, basename="department")
router.register(r"sections", SectionViewSet, basename="section")
router.register(r"lines", LineViewSet, basename="line")
router.register(r"designations", DesignationViewSet, basename="designation")
router.register(r"grades", GradeViewSet, basename="grade")
router.register(r"cost-centres", CostCentreViewSet, basename="cost-centre")
router.register(r"shifts", ShiftViewSet, basename="shift")

# Employee Master
router.register(r"employees", EmployeeViewSet, basename="employee")
router.register(r"skills", EmployeeSkillViewSet, basename="skill")
router.register(r"documents", EmployeeDocumentViewSet, basename="document")
router.register(r"assets", EmployeeAssetViewSet, basename="asset")

# Attendance
router.register(r"punches", AttendancePunchViewSet, basename="punch")
router.register(r"daily-attendance", DailyAttendanceViewSet, basename="daily-attendance")
router.register(r"attendance-corrections", AttendanceCorrectionRequestViewSet, basename="attendance-correction")
router.register(r"attendance-rules", AttendanceRuleViewSet, basename="attendance-rule")
router.register(r"holidays", HolidayCalendarViewSet, basename="holiday")
router.register(r"rosters", ShiftRosterViewSet, basename="roster")

# Leave
router.register(r"leave-types", LeaveTypeViewSet, basename="leave-type")
router.register(r"leave-balances", LeaveBalanceViewSet, basename="leave-balance")
router.register(r"leave-requests", LeaveRequestViewSet, basename="leave-request")

# Payroll & Statutory
router.register(r"salary-structures", SalaryStructureViewSet, basename="salary-structure")
router.register(r"salary-components", SalaryComponentViewSet, basename="salary-component")
router.register(r"pay-periods", PayPeriodViewSet, basename="pay-period")
router.register(r"payroll-runs", PayrollRunViewSet, basename="payroll-run")
router.register(r"payslips", PayslipViewSet, basename="payslip")
router.register(r"advances", AdvanceViewSet, basename="advance")
router.register(r"fines", FineViewSet, basename="fine")

# Piece-Rate
router.register(r"piece-rate-groups", PieceRateGroupViewSet, basename="piece-rate-group")
router.register(r"piece-rate-items", PieceRateItemViewSet, basename="piece-rate-item")
router.register(r"piece-rate-outputs", PieceRateOutputViewSet, basename="piece-rate-output")

# Contractors (Thekedar)
router.register(r"contractors", ContractorViewSet, basename="contractor")
router.register(r"contractor-headcount", ContractorHeadcountViewSet, basename="contractor-headcount")
router.register(r"contractor-bills", ContractorBillViewSet, basename="contractor-bill")

# Recruitment & Onboarding
router.register(r"requisitions", ManpowerRequisitionViewSet, basename="requisition")
router.register(r"applicants", ApplicantViewSet, basename="applicant")
router.register(r"interviews", InterviewViewSet, basename="interview")
router.register(r"onboarding", OnboardingChecklistViewSet, basename="onboarding")

# Performance & Training
router.register(r"performance-cycles", PerformanceCycleViewSet, basename="performance-cycle")
router.register(r"performance-appraisals", PerformanceAppraisalViewSet, basename="performance-appraisal")
router.register(r"training-programs", TrainingProgramViewSet, basename="training-program")
router.register(r"training-sessions", TrainingSessionViewSet, basename="training-session")
router.register(r"safety-incidents", SafetyIncidentViewSet, basename="safety-incident")
router.register(r"disciplinary-actions", DisciplinaryActionViewSet, basename="disciplinary-action")
router.register(r"grievances", GrievanceViewSet, basename="grievance")

# Separation & Statutory
router.register(r"separations", SeparationViewSet, basename="separation")
router.register(r"statutory-rules", StatutoryRuleViewSet, basename="statutory-rule")
router.register(r"tax-slabs", TaxSlabViewSet, basename="tax-slab")
router.register(r"delegations", DelegationViewSet, basename="delegation")

urlpatterns = [
    path("", include(router.urls)),
]
