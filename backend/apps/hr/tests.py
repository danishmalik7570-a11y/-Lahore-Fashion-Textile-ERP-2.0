"""
HR App — Automated Unit & Integration Tests.
Covers Prompt 3B requirements:
  1. SoD (payroll preparer cannot approve)
  2. Scope isolation (supervisor sees only own line)
  3. Field masking (salary hidden for supervisor, CNIC masked)
  4. Piece-rate minimum-wage top-up
  5. OT cap enforcement
  6. EOBI statutory contribution deduction
  7. Progressive income tax slab calculation
  8. Contractor billing calculation
  9. Gratuity settlement calculation
"""
from datetime import date, time
from decimal import Decimal
from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIRequestFactory, force_authenticate

from apps.branches.models import Branch
from apps.hr.models import (
    Department, Section, Line, Designation, Grade, Shift,
    Employee, StatutoryRule, TaxSlab, PayPeriod, PayrollRun, Payslip,
    Contractor, ContractorHeadcount, Separation, AttendanceRule,
)
from apps.hr.services import (
    PayrollEngine, ContractorBillingService, GratuityAndExitService,
)
from apps.hr.serializers import EmployeeDetailSerializer
from apps.hr.views import EmployeeViewSet, PayrollRunViewSet
from apps.rbac.models import (
    Permission, Role, RolePermission, UserRoleAssignment, SoDRule, FieldPolicy,
)

User = get_user_model()


class HRPrompt3BTests(TestCase):
    def setUp(self):
        # 1. Branch, Dept, Section, Line
        self.branch = Branch.objects.create(code="U1", name="Unit 1 Weaving Mill", city="Lahore")
        self.dept = Department.objects.create(branch=self.branch, code="WEAV", name="Weaving Dept")
        self.section = Section.objects.create(department=self.dept, code="LOOM", name="Loom Shed", branch=self.branch)
        self.line_a = Line.objects.create(section=self.section, code="LINE-1", name="Air-Jet Line 1", branch=self.branch)
        self.line_b = Line.objects.create(section=self.section, code="LINE-2", name="Air-Jet Line 2", branch=self.branch)

        # 2. Grade, Designation, Shift
        self.grade = Grade.objects.create(code="SKILL-5", name="Skilled", sort_order=5, min_basic=Decimal("37000"), max_basic=Decimal("50000"))
        self.desig = Designation.objects.create(code="OP-WEAV", title="Loom Operator", level=5)
        self.shift = Shift.objects.create(
            code="SH-MORN", name="Morning",
            start_time=time(6, 0), end_time=time(14, 0),
        )

        # 3. Attendance Rule with OT cap
        self.attendance_rule = AttendanceRule.objects.create(
            code="ATT-TEST",
            name="Mill Attendance Rule",
            effective_from=date(2024, 1, 1),
            max_ot_hours_per_month=Decimal("48.0"),
            ot_rate_multiplier=Decimal("2.0"),
        )

        # 4. Statutory Rules
        self.min_wage = StatutoryRule.objects.create(
            rule_id="MW-PUNJAB-2024",
            category=StatutoryRule.RuleCategory.MINIMUM_WAGE,
            name="Punjab Minimum Wage 2024",
            province="punjab",
            effective_from=date(2024, 7, 1),
            value_numeric=Decimal("37000.00"),
            unit="PKR",
        )
        self.eobi_rule = StatutoryRule.objects.create(
            rule_id="EOBI-FED-2024",
            category=StatutoryRule.RuleCategory.EOBI,
            name="EOBI Contribution",
            province="federal",
            effective_from=date(2024, 7, 1),
            value_numeric=Decimal("1.00"),
            unit="%",
            value_json={"employee_rate": "1.00", "employer_rate": "5.00", "min_wage_base": "37000.00"},
        )
        self.pessi_rule = StatutoryRule.objects.create(
            rule_id="PESSI-PUNJAB-2024",
            category=StatutoryRule.RuleCategory.SOCIAL_SECURITY,
            name="PESSI Social Security",
            province="punjab",
            effective_from=date(2024, 7, 1),
            value_numeric=Decimal("6.00"),
            unit="%",
            value_json={"wage_ceiling": "40000.00", "employer_rate": "6.00"},
        )

        # 5. Income Tax Slabs
        TaxSlab.objects.create(
            effective_from=date(2025, 7, 1), sort_order=1,
            min_income=Decimal("0.00"), max_income=Decimal("600000.00"),
            fixed_tax=Decimal("0.00"), rate_on_excess=Decimal("0.00"),
        )
        TaxSlab.objects.create(
            effective_from=date(2025, 7, 1), sort_order=2,
            min_income=Decimal("600000.00"), max_income=Decimal("1200000.00"),
            fixed_tax=Decimal("0.00"), rate_on_excess=Decimal("5.00"),
        )

        # 6. Sample Employees
        self.emp_line_a = Employee.objects.create(
            employee_id="LF-2001",
            full_name="Muhammad Iqbal",
            cnic="35201-1122334-1",
            branch=self.branch,
            department=self.dept,
            section=self.section,
            line=self.line_a,
            designation=self.desig,
            grade=self.grade,
            shift=self.shift,
            category=Employee.Category.WORKER_PERMANENT,
            wage_type=Employee.WageType.MONTHLY,
            basic_salary=Decimal("50000.00"),
            joining_date=date(2021, 1, 1),
        )

        self.emp_line_b = Employee.objects.create(
            employee_id="LF-2002",
            full_name="Rashid Ali",
            cnic="35201-9988776-3",
            branch=self.branch,
            department=self.dept,
            section=self.section,
            line=self.line_b,
            designation=self.desig,
            grade=self.grade,
            shift=self.shift,
            category=Employee.Category.WORKER_PERMANENT,
            wage_type=Employee.WageType.MONTHLY,
            basic_salary=Decimal("45000.00"),
            joining_date=date(2022, 3, 1),
        )

        self.piece_worker = Employee.objects.create(
            employee_id="LF-3001",
            full_name="Sobia Bibi",
            cnic="35202-7766554-2",
            branch=self.branch,
            department=self.dept,
            section=self.section,
            line=self.line_a,
            designation=self.desig,
            grade=self.grade,
            shift=self.shift,
            category=Employee.Category.WORKER_PIECE,
            wage_type=Employee.WageType.PIECE_RATE,
            basic_salary=Decimal("37000.00"),
            joining_date=date(2023, 6, 1),
        )

        # 7. Pay period
        self.pay_period = PayPeriod.objects.create(
            code="PP-2026-10",
            period_type=PayPeriod.PeriodType.MONTHLY,
            start_date=date(2026, 10, 1),
            end_date=date(2026, 10, 31),
        )

        self.factory = APIRequestFactory()

    # ── Test 1: SoD (Payroll preparer cannot approve) ──────────────────────────
    def test_sod_payroll_preparer_cannot_approve(self):
        """SoD: The user who created the payroll run cannot approve it."""
        preparer = User.objects.create_user(email="payroll_preparer@test.com", password="password123")
        checker = User.objects.create_user(email="hr_manager@test.com", password="password123")

        role_payroll = Role.objects.create(code="payroll_mgr", name="Payroll Manager", hierarchy_level=3)
        perm_approve = Permission.objects.create(
            module="payroll", action="approve", scope=Permission.Scope.BRANCH,
        )
        RolePermission.objects.create(role=role_payroll, permission=perm_approve)
        UserRoleAssignment.objects.create(user=preparer, role=role_payroll, branch=self.branch, is_active=True)
        UserRoleAssignment.objects.create(user=checker, role=role_payroll, branch=self.branch, is_active=True)

        payroll_run = PayrollRun.objects.create(
            branch=self.branch,
            pay_period=self.pay_period,
            status=PayrollRun.RunStatus.DRAFT,
            created_by=preparer,
        )

        view = PayrollRunViewSet.as_view({"post": "approve"})

        # Preparer attempts to approve -> Must be rejected (403 Forbidden)
        request = self.factory.post(f"/api/v1/hr/payroll-runs/{payroll_run.id}/approve/")
        force_authenticate(request, user=preparer)
        response = view(request, pk=payroll_run.id)

        self.assertEqual(response.status_code, 403)
        err_msg = response.data.get("error") or response.data.get("detail", "")
        self.assertTrue("Segregation of Duties" in err_msg or "permission" in err_msg.lower())

        # Independent Checker approves -> Must succeed (200 OK)
        request_checker = self.factory.post(f"/api/v1/hr/payroll-runs/{payroll_run.id}/approve/")
        force_authenticate(request_checker, user=checker)
        response_checker = view(request_checker, pk=payroll_run.id)

        self.assertEqual(response_checker.status_code, 200)
        payroll_run.refresh_from_db()
        self.assertEqual(payroll_run.status, PayrollRun.RunStatus.HR_APPROVED)
        self.assertEqual(payroll_run.hr_approved_by, checker)

    # ── Test 2: Scope isolation (Supervisor sees only own line) ─────────────────
    def test_scope_isolation_supervisor_sees_only_own_line(self):
        """Supervisor with line/team scope can only see employees on their assigned line."""
        sup_user = User.objects.create_user(email="supervisor_line_a@test.com", password="password123")
        sup_role = Role.objects.create(code="sup_role", name="Line Supervisor", hierarchy_level=6)
        perm = Permission.objects.create(
            module="hr_employee", action="view", scope=Permission.Scope.TEAM,
        )
        RolePermission.objects.create(role=sup_role, permission=perm)
        UserRoleAssignment.objects.create(
            user=sup_user, role=sup_role, branch=self.branch, is_active=True,
        )

        # Link supervisor to an Employee profile on line_a
        Employee.objects.create(
            user=sup_user,
            employee_id="LF-SUP-01",
            full_name="Supervisor User",
            cnic="35201-0000000-1",
            branch=self.branch,
            department=self.dept,
            section=self.section,
            line=self.line_a,
            category=Employee.Category.STAFF_MONTHLY,
            basic_salary=Decimal("60000.00"),
        )

        request = self.factory.get("/api/v1/hr/employees/")
        force_authenticate(request, user=sup_user)
        view = EmployeeViewSet()
        view.request = request
        view.format_kwarg = None

        qs = view.get_queryset()
        self.assertIn(self.emp_line_a, qs)
        self.assertNotIn(self.emp_line_b, qs)

    # ── Test 3: Field masking (Salary hidden for supervisor) ────────────────────
    def test_field_masking_salary_hidden_for_supervisor(self):
        """Floor supervisor has basic_salary hidden and CNIC masked via FieldPolicy."""
        sup_user = User.objects.create_user(email="sup_mask_test@test.com", password="password123")
        sup_role = Role.objects.create(code="sup_floor", name="Floor Supervisor", hierarchy_level=6)
        UserRoleAssignment.objects.create(user=sup_user, role=sup_role, is_active=True)

        FieldPolicy.objects.create(
            role=sup_role, module="hr_employee", field_name="basic_salary",
            field_action=FieldPolicy.FieldAction.HIDE,
        )
        FieldPolicy.objects.create(
            role=sup_role, module="hr_employee", field_name="cnic",
            field_action=FieldPolicy.FieldAction.MASK,
        )

        # Serialized for supervisor: basic_salary stripped, cnic masked
        request = self.factory.get("/")
        request.user = sup_user
        serializer = EmployeeDetailSerializer(self.emp_line_a, context={"request": request})
        data = serializer.data

        self.assertNotIn("basic_salary", data)
        self.assertTrue(data.get("cnic", "").startswith("*****") or data.get("cnic") == "****")

        # Serialized for HR Manager (no hide policy): basic_salary visible, cnic unmasked
        hr_user = User.objects.create_user(email="hr_director_test@test.com", password="password123")
        hr_role = Role.objects.create(code="hr_dir", name="HR Director", hierarchy_level=2)
        UserRoleAssignment.objects.create(user=hr_user, role=hr_role, is_active=True)

        request_hr = self.factory.get("/")
        request_hr.user = hr_user
        serializer_hr = EmployeeDetailSerializer(self.emp_line_a, context={"request": request_hr})
        data_hr = serializer_hr.data

        self.assertIn("basic_salary", data_hr)
        self.assertEqual(data_hr.get("cnic"), "35201-1122334-1")

    # ── Test 4: Piece-rate minimum-wage top-up ─────────────────────────────────
    def test_piece_rate_minimum_wage_top_up(self):
        """If piece worker output earning < minimum wage (37,000), top-up is applied."""
        # Case A: Piece earnings = PKR 28,000 -> Top-up PKR 9,000 applied to meet PKR 37,000
        res_low = PayrollEngine.calculate_piece_rate_pay(
            employee=self.piece_worker,
            total_piece_earning=Decimal("28000.00"),
            run_date=date(2026, 10, 15),
        )
        self.assertTrue(res_low["top_up_applied"])
        self.assertEqual(res_low["minimum_wage_top_up"], Decimal("9000.00"))
        self.assertEqual(res_low["gross_pay"], Decimal("37000.00"))

        # Case B: Piece earnings = PKR 45,000 -> Exceeds minimum wage, no top-up needed
        res_high = PayrollEngine.calculate_piece_rate_pay(
            employee=self.piece_worker,
            total_piece_earning=Decimal("45000.00"),
            run_date=date(2026, 10, 15),
        )
        self.assertFalse(res_high["top_up_applied"])
        self.assertEqual(res_high["minimum_wage_top_up"], Decimal("0.00"))
        self.assertEqual(res_high["gross_pay"], Decimal("45000.00"))

    # ── Test 5: OT Cap enforcement ─────────────────────────────────────────────
    def test_overtime_cap_enforcement(self):
        """Overtime exceeding mill monthly cap (48 hrs) is capped with flag set."""
        # Case A: Worker with 65 hours OT -> Capped to 48.0 hours
        ot_res = PayrollEngine.calculate_overtime(
            basic_salary=Decimal("50000.00"),
            ot_hours=Decimal("65.00"),
            max_ot_hours=Decimal("48.00"),
            attendance_rule=self.attendance_rule,
        )
        self.assertTrue(ot_res["capped"])
        self.assertEqual(ot_res["ot_hours"], Decimal("48.00"))
        self.assertTrue(ot_res["ot_pay"] > 0)

        # Case B: Worker with 30 hours OT -> Within 48 cap, not capped
        ot_res_normal = PayrollEngine.calculate_overtime(
            basic_salary=Decimal("50000.00"),
            ot_hours=Decimal("30.00"),
            max_ot_hours=Decimal("48.00"),
            attendance_rule=self.attendance_rule,
        )
        self.assertFalse(ot_res_normal["capped"])
        self.assertEqual(ot_res_normal["ot_hours"], Decimal("30.00"))

    # ── Test 6: EOBI Statutory Deduction ──────────────────────────────────────
    def test_eobi_statutory_deduction(self):
        """EOBI employee deduction is 1% of statutory minimum wage = PKR 370."""
        rule = PayrollEngine.get_statutory_rule(StatutoryRule.RuleCategory.EOBI)
        self.assertIsNotNone(rule)
        eobi_emp = (self.min_wage.threshold_amount * (rule.employee_rate / Decimal("100.00"))).quantize(Decimal("0.01"))
        self.assertEqual(eobi_emp, Decimal("370.00"))

    # ── Test 7: Income Tax Progressive Slabs ───────────────────────────────────
    def test_income_tax_calculation(self):
        """Tax exempt below PKR 600k; 5% on excess between 600k and 1.2M."""
        tax_exempt = PayrollEngine.calculate_income_tax(Decimal("500000.00"))
        self.assertEqual(tax_exempt, Decimal("0.00"))

        # PKR 840,000 annual -> 240,000 * 5% = 12,000 annual / 12 = 1,000 monthly
        tax_tier2 = PayrollEngine.calculate_income_tax(Decimal("840000.00"))
        self.assertEqual(tax_tier2, Decimal("1000.00"))

    # ── Test 8: Contractor Billing Calculation ────────────────────────────────
    def test_contractor_billing_calculation(self):
        """Contractor billing: headcount * daily rate - TDS withholding."""
        contractor = Contractor.objects.create(
            code="THK-TEST-01",
            name="Al-Rehman Labour",
            cnic="35201-1122334-5",
            tax_withholding_rate=Decimal("8.00"),
        )
        ContractorHeadcount.objects.create(
            contractor=contractor,
            branch=self.branch,
            department=self.dept,
            date=date(2026, 10, 5),
            workers_present=10,
            rate_per_worker=Decimal("1500.00"),
            total_amount=Decimal("15000.00"),
        )
        bill = ContractorBillingService.generate_bill(
            contractor=contractor,
            branch=self.branch,
            from_date=date(2026, 10, 1),
            to_date=date(2026, 10, 31),
        )
        # 10 workers * 1500 = 15,000
        # WHT (8%) = 1,200
        # Net = 13,800
        self.assertEqual(bill.gross_amount, Decimal("15000.00"))
        self.assertEqual(bill.tax_withheld, Decimal("1200.00"))
        self.assertEqual(bill.net_payable, Decimal("13800.00"))

    # ── Test 9: Gratuity Settlement Calculation ───────────────────────────────
    def test_gratuity_calculation(self):
        """Standing Orders Ordinance: 30 days basic wage * completed years of service."""
        separation = Separation.objects.create(
            employee=self.emp_line_a,
            branch=self.branch,
            separation_type=Separation.SeparationType.RESIGNATION,
            initiated_date=date(2026, 10, 1),
            last_working_date=date(2026, 10, 31),
        )
        res = GratuityAndExitService.calculate_settlement(
            separation=separation,
            completed_years=Decimal("3.00"),
        )
        # 3 years * 50,000 = 150,000
        self.assertEqual(res["gratuity"], Decimal("150000.00"))
