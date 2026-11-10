"""
Management command: seed_hr_rbac
Populates textile mill organisation hierarchy, statutory rules (EOBI, PESSI, Minimum wage, Overtime, Tax slabs),
shifts, grades, designations, sample staff & workers, thekedars, and complete RBAC roles, fine-grained permissions,
field policies, and Segregation of Duties (SoD) rules.
"""
from datetime import date, time
from decimal import Decimal

from django.core.management.base import BaseCommand
from django.db import transaction
from django.contrib.auth import get_user_model

from apps.branches.models import Branch
from apps.hr.models import (
    Department, Section, Line, Designation, Grade, CostCentre, Shift,
    LeaveType, StatutoryRule, TaxSlab, AttendanceRule,
    SalaryComponent, SalaryStructure, SalaryStructureComponent,
    Contractor, Employee,
)
from apps.rbac.models import (
    Permission, Role, RolePermission, UserRoleAssignment,
    FieldPolicy, ApprovalPolicy, SoDRule,
)

User = get_user_model()


class Command(BaseCommand):
    help = "Seeds comprehensive HR organisation structure, statutory compliance rules, and RBAC matrix."

    @transaction.atomic
    def handle(self, *args, **options):
        self.stdout.write(self.style.NOTICE("Starting HR & RBAC database seeding..."))

        # ── 1. Branches ────────────────────────────────────────────────────────
        branches_data = [
            {"code": "U1", "name": "Unit 1 — Spinning & Weaving (Raiwind Road)", "city": "Lahore", "address": "Km 22 Raiwind Road, Lahore"},
            {"code": "U2", "name": "Unit 2 — Dyeing & Finishing (Sheikhupura)", "city": "Sheikhupura", "address": "Sheikhupura-Faisalabad Road"},
            {"code": "U3", "name": "Unit 3 — Stitching & Apparel (Manga Mandi)", "city": "Lahore", "address": "Multan Road, Manga Mandi, Lahore"},
            {"code": "HO", "name": "Corporate Head Office (Gulberg)", "city": "Lahore", "address": "Main Boulevard, Gulberg III, Lahore"},
        ]
        branches = {}
        for bdata in branches_data:
            b, _ = Branch.objects.update_or_create(code=bdata["code"], defaults=bdata)
            branches[bdata["code"]] = b
        self.stdout.write(self.style.SUCCESS(f"[OK] Seeded {len(branches)} Branches"))

        # ── 2. Shifts ──────────────────────────────────────────────────────────
        shifts_data = [
            {"code": "SH-MORN", "name": "Shift A (Morning)", "start_time": time(6, 0), "end_time": time(14, 0), "grace_in_minutes": 15, "working_hours": Decimal("8.00")},
            {"code": "SH-EVE", "name": "Shift B (Evening)", "start_time": time(14, 0), "end_time": time(22, 0), "grace_in_minutes": 15, "working_hours": Decimal("8.00")},
            {"code": "SH-NIGHT", "name": "Shift C (Night)", "start_time": time(22, 0), "end_time": time(6, 0), "is_night_shift": True, "grace_in_minutes": 15, "working_hours": Decimal("8.00")},
            {"code": "SH-GEN", "name": "General Office Shift", "start_time": time(8, 30), "end_time": time(17, 30), "break_minutes": 60, "grace_in_minutes": 15, "working_hours": Decimal("8.00")},
        ]
        shifts = {}
        for sdata in shifts_data:
            s, _ = Shift.objects.update_or_create(
                code=sdata["code"], defaults=sdata
            )
            shifts[sdata["code"]] = s
        self.stdout.write(self.style.SUCCESS(f"[OK] Seeded {len(shifts)} Shifts"))

        # Attendance rules
        AttendanceRule.objects.update_or_create(
            code="ATT-STD",
            defaults={
                "name": "Textile Mill Standard Attendance Rule",
                "effective_from": date(2024, 1, 1),
                "lates_for_absent": 3,
                "min_ot_threshold_minutes": 30,
                "ot_rate_multiplier": Decimal("2.0"),
                "max_ot_hours_per_week": Decimal("12.0"),
                "max_ot_hours_per_month": Decimal("48.0"),
                "paid_weekly_off": True,
                "paid_holiday": True,
                "holiday_duty_multiplier": Decimal("2.0"),
                "half_day_min_hours": Decimal("4.0"),
                "absent_without_leave_alert_days": 3,
            }
        )
        self.stdout.write(self.style.SUCCESS("[OK] Seeded Standard Attendance Policy"))

        # ── 3. Organisation: Departments & Sections ───────────────────────────
        departments_data = [
            {"code": "SPIN", "name": "Spinning Department", "name_ur": "کتائی", "is_production": True, "branch": branches["U1"]},
            {"code": "WEAV", "name": "Weaving Department", "name_ur": "بنائی", "is_production": True, "branch": branches["U1"]},
            {"code": "DYEF", "name": "Dyeing & Processing", "name_ur": "رنگائی و پروسیسنگ", "is_production": True, "branch": branches["U2"]},
            {"code": "STTC", "name": "Stitching & Apparel", "name_ur": "سلائی", "is_production": True, "branch": branches["U3"]},
            {"code": "QUAL", "name": "Quality Assurance", "name_ur": "کوالٹی کنٹرول", "is_production": False, "branch": branches["U1"]},
            {"code": "MAINT", "name": "Engineering & Maintenance", "name_ur": "مرمت و نگہداشت", "is_production": False, "branch": branches["U1"]},
            {"code": "HR", "name": "Human Resources & Labour", "name_ur": "انسانی وسائل", "is_production": False, "branch": branches["HO"]},
            {"code": "ACCT", "name": "Finance & Payroll Accounts", "name_ur": "مالیات و تنخواہ", "is_production": False, "branch": branches["HO"]},
        ]
        depts = {}
        for ddata in departments_data:
            d, _ = Department.objects.update_or_create(
                branch=ddata["branch"], code=ddata["code"], defaults=ddata
            )
            depts[ddata["code"]] = d

        # Sections
        sections_data = [
            {"code": "WARP", "name": "Warping & Sizing Section", "department": depts["WEAV"], "branch": branches["U1"]},
            {"code": "LOOM", "name": "Air-Jet Loom Shed", "department": depts["WEAV"], "branch": branches["U1"]},
            {"code": "CUTT", "name": "Spreading & Cutting", "department": depts["STTC"], "branch": branches["U3"]},
            {"code": "SEW", "name": "Sewing Assembly Lines", "department": depts["STTC"], "branch": branches["U3"]},
            {"code": "PACK", "name": "Pressing & Packing", "department": depts["STTC"], "branch": branches["U3"]},
        ]
        for sdata in sections_data:
            Section.objects.update_or_create(
                department=sdata["department"], code=sdata["code"],
                defaults={"name": sdata["name"], "branch": sdata["branch"]}
            )
        self.stdout.write(self.style.SUCCESS("[OK] Seeded Departments & Sections"))

        # ── 4. Grades & Designations ──────────────────────────────────────────
        grades_data = [
            {"code": "EXEC-1", "name": "Executive (Director / GM)", "sort_order": 1, "min_basic": Decimal("200000"), "max_basic": Decimal("500000")},
            {"code": "MGMT-2", "name": "Management (Manager / Incharge)", "sort_order": 2, "min_basic": Decimal("100000"), "max_basic": Decimal("200000")},
            {"code": "STAFF-3", "name": "Staff / Officer", "sort_order": 3, "min_basic": Decimal("50000"), "max_basic": Decimal("100000")},
            {"code": "SUP-4", "name": "Floor Supervisor / Line Leader", "sort_order": 4, "min_basic": Decimal("40000"), "max_basic": Decimal("65000")},
            {"code": "SKILL-5", "name": "Skilled Worker (Master / Operator)", "sort_order": 5, "min_basic": Decimal("37000"), "max_basic": Decimal("50000")},
            {"code": "SEMI-6", "name": "Semi-Skilled / Helper", "sort_order": 6, "min_basic": Decimal("37000"), "max_basic": Decimal("40000")},
        ]
        grades = {}
        for gdata in grades_data:
            g, _ = Grade.objects.update_or_create(code=gdata["code"], defaults=gdata)
            grades[gdata["code"]] = g

        desigs_data = [
            ("GM", "General Manager Operations", 10),
            ("HR-MGR", "HR & Labour Compliance Manager", 8),
            ("ACC-MGR", "Finance & Payroll Manager", 8),
            ("WEAV-INCH", "Weaving Master / Incharge", 7),
            ("LINE-SUP", "Assembly Line Supervisor", 5),
            ("TIME-OFF", "Timekeeper & Attendance Officer", 4),
            ("OP-WEAV", "Air-Jet Loom Operator", 3),
            ("OP-STTC", "Senior Sewing Machine Operator", 3),
            ("HELPER", "Production Floor Helper", 1),
        ]
        desigs = {}
        for code, title, lvl in desigs_data:
            d, _ = Designation.objects.update_or_create(code=code, defaults={"title": title, "level": lvl})
            desigs[code] = d
        self.stdout.write(self.style.SUCCESS("[OK] Seeded Grades & Designations"))

        # ── 5. Statutory Rules (Configurable with Effective Dates) ───────────
        stat_rules = [
            {
                "rule_id": "MW-PUNJAB-2024",
                "category": StatutoryRule.RuleCategory.MINIMUM_WAGE,
                "name": "Punjab Minimum Wage 2024-25",
                "province": "punjab",
                "effective_from": date(2024, 7, 1),
                "value_numeric": Decimal("37000.00"),
                "unit": "PKR",
                "description": "Punjab Minimum Wages Board Notification No. SO(MW) 2024 - PKR 37,000/month",
                "legal_reference": "Punjab Minimum Wages Act 2019",
            },
            {
                "rule_id": "EOBI-FED-2024",
                "category": StatutoryRule.RuleCategory.EOBI,
                "name": "EOBI Statutory Contribution",
                "province": "federal",
                "effective_from": date(2024, 7, 1),
                "value_numeric": Decimal("1.00"),
                "unit": "%",
                "value_json": {"employee_rate": "1.00", "employer_rate": "5.00", "min_wage_base": "37000.00"},
                "description": "Employees Old-Age Benefits Institution (EOBI) Act 1976: 1% employee, 5% employer",
                "legal_reference": "EOBI Act 1976",
            },
            {
                "rule_id": "PESSI-PUNJAB-2024",
                "category": StatutoryRule.RuleCategory.SOCIAL_SECURITY,
                "name": "PESSI Social Security Contribution",
                "province": "punjab",
                "effective_from": date(2024, 7, 1),
                "value_numeric": Decimal("6.00"),
                "unit": "%",
                "value_json": {"wage_ceiling": "40000.00", "employer_rate": "6.00"},
                "description": "Punjab Employees Social Security Institution (PESSI) employer 6% contribution",
                "legal_reference": "Provincial Employees Social Security Ordinance 1965",
            },
            {
                "rule_id": "OT-PUNJAB-1934",
                "category": StatutoryRule.RuleCategory.OVERTIME,
                "name": "Statutory Overtime Rate",
                "province": "punjab",
                "effective_from": date(2020, 1, 1),
                "value_numeric": Decimal("2.00"),
                "unit": "x",
                "description": "Factories Act 1934 Section 47: Double ordinary rate of wages for overtime",
                "legal_reference": "Factories Act 1934, Section 47",
            },
            {
                "rule_id": "GRATUITY-PUNJAB-1968",
                "category": StatutoryRule.RuleCategory.GRATUITY,
                "name": "Statutory Gratuity Entitlement",
                "province": "punjab",
                "effective_from": date(2020, 1, 1),
                "value_numeric": Decimal("30.00"),
                "unit": "days",
                "description": "30 days basic wage per completed year of service",
                "legal_reference": "Industrial and Commercial Employment (Standing Orders) Ordinance 1968, Standing Order 12",
            },
        ]
        for sr in stat_rules:
            StatutoryRule.objects.update_or_create(
                rule_id=sr["rule_id"], defaults=sr
            )

        # Pakistan Salaried Income Tax Slabs FY 2025-2026
        tax_slabs = [
            {"sort_order": 1, "min_income": Decimal("0"), "max_income": Decimal("600000"), "fixed_tax": Decimal("0"), "rate_on_excess": Decimal("0"), "effective_from": date(2025, 7, 1)},
            {"sort_order": 2, "min_income": Decimal("600000"), "max_income": Decimal("1200000"), "fixed_tax": Decimal("0"), "rate_on_excess": Decimal("5.00"), "effective_from": date(2025, 7, 1)},
            {"sort_order": 3, "min_income": Decimal("1200000"), "max_income": Decimal("2200000"), "fixed_tax": Decimal("30000"), "rate_on_excess": Decimal("15.00"), "effective_from": date(2025, 7, 1)},
            {"sort_order": 4, "min_income": Decimal("2200000"), "max_income": Decimal("3200000"), "fixed_tax": Decimal("180000"), "rate_on_excess": Decimal("25.00"), "effective_from": date(2025, 7, 1)},
            {"sort_order": 5, "min_income": Decimal("3200000"), "max_income": Decimal("4100000"), "fixed_tax": Decimal("430000"), "rate_on_excess": Decimal("30.00"), "effective_from": date(2025, 7, 1)},
            {"sort_order": 6, "min_income": Decimal("4100000"), "max_income": None, "fixed_tax": Decimal("700000"), "rate_on_excess": Decimal("35.00"), "effective_from": date(2025, 7, 1)},
        ]
        for ts in tax_slabs:
            TaxSlab.objects.update_or_create(
                effective_from=ts["effective_from"], sort_order=ts["sort_order"], defaults=ts
            )

        # Leave types
        leave_types_data = [
            {"code": "AL", "name": "Annual Leave (Earned)", "annual_quota": 14, "is_paid": True, "carry_forward_max": 14, "encashable": True},
            {"code": "CL", "name": "Casual Leave", "annual_quota": 10, "is_paid": True},
            {"code": "SL", "name": "Sick / Medical Leave", "annual_quota": 8, "is_paid": True},
            {"code": "FH", "name": "Festival / Public Holiday", "annual_quota": 11, "is_paid": True},
            {"code": "ML", "name": "Maternity Leave", "annual_quota": 90, "is_paid": True},
        ]
        for lt in leave_types_data:
            LeaveType.objects.update_or_create(code=lt["code"], defaults=lt)
        self.stdout.write(self.style.SUCCESS("[OK] Seeded Statutory Rules, Tax Slabs, and Leave Types"))

        # ── 6. Salary Components & Structure ───────────────────────────────────
        comp_basic, _ = SalaryComponent.objects.update_or_create(
            code="BASIC", defaults={"name": "Basic Salary", "component_type": SalaryComponent.ComponentType.EARNING, "is_taxable": True}
        )
        comp_med, _ = SalaryComponent.objects.update_or_create(
            code="MED", defaults={"name": "Medical Allowance", "component_type": SalaryComponent.ComponentType.EARNING, "calc_type": SalaryComponent.CalcType.PERCENT_OF_BASIC, "percentage": Decimal("10.00")}
        )
        comp_conv, _ = SalaryComponent.objects.update_or_create(
            code="CONV", defaults={"name": "Conveyance Allowance", "component_type": SalaryComponent.ComponentType.EARNING, "calc_type": SalaryComponent.CalcType.FIXED, "default_amount": Decimal("4000.00")}
        )
        comp_hr, _ = SalaryComponent.objects.update_or_create(
            code="HRA", defaults={"name": "House Rent Allowance", "component_type": SalaryComponent.ComponentType.EARNING, "calc_type": SalaryComponent.CalcType.PERCENT_OF_BASIC, "percentage": Decimal("25.00")}
        )

        std_struct, _ = SalaryStructure.objects.update_or_create(
            code="STRUCT-WORKER",
            defaults={"name": "Standard Floor Worker Salary Structure", "effective_from": date(2024, 1, 1), "is_active": True}
        )
        SalaryStructureComponent.objects.update_or_create(structure=std_struct, component=comp_med)
        SalaryStructureComponent.objects.update_or_create(structure=std_struct, component=comp_conv)
        SalaryStructureComponent.objects.update_or_create(structure=std_struct, component=comp_hr)
        self.stdout.write(self.style.SUCCESS("[OK] Seeded Salary Structure & Components"))

        # ── 7. Contractor (Thekedar) ──────────────────────────────────────────
        contractor, _ = Contractor.objects.update_or_create(
            code="THK-001",
            defaults={
                "name": "Al-Rehman Labour Contractors",
                "cnic": "35201-1234567-1",
                "ntn": "7654321-8",
                "agreement_start": date(2025, 1, 1),
                "agreement_end": date(2026, 12, 31),
                "is_active": True,
            }
        )
        self.stdout.write(self.style.SUCCESS("[OK] Seeded Contractor Master"))

        # ── 8. Sample Employees ────────────────────────────────────────────────
        sample_employees = [
            {
                "employee_id": "LF-1001", "full_name": "Tariq Mehmood", "gender": "male",
                "cnic": "35202-4589211-1", "phone": "+923001234567",
                "category": Employee.Category.STAFF_MONTHLY,
                "wage_type": Employee.WageType.MONTHLY,
                "joining_date": date(2020, 3, 1), "basic_salary": Decimal("180000.00"),
                "branch": branches["HO"], "department": depts["HR"], "designation": desigs["HR-MGR"],
                "grade": grades["MGMT-2"], "shift": shifts["SH-GEN"],
            },
            {
                "employee_id": "LF-1002", "full_name": "Kashif Nawaz", "gender": "male",
                "cnic": "35201-9876543-3", "phone": "+923219876543",
                "category": Employee.Category.STAFF_MONTHLY,
                "wage_type": Employee.WageType.MONTHLY,
                "joining_date": date(2021, 5, 15), "basic_salary": Decimal("90000.00"),
                "branch": branches["HO"], "department": depts["ACCT"], "designation": desigs["ACC-MGR"],
                "grade": grades["MGMT-2"], "shift": shifts["SH-GEN"],
            },
            {
                "employee_id": "LF-1003", "full_name": "Muhammad Aslam", "gender": "male",
                "cnic": "35404-1234987-5", "phone": "+923334567890",
                "category": Employee.Category.WORKER_PERMANENT,
                "wage_type": Employee.WageType.MONTHLY,
                "joining_date": date(2022, 1, 10), "basic_salary": Decimal("42000.00"),
                "branch": branches["U1"], "department": depts["WEAV"], "designation": desigs["OP-WEAV"],
                "grade": grades["SKILL-5"], "shift": shifts["SH-MORN"],
            },
            {
                "employee_id": "LF-1004", "full_name": "Rukhsana Bibi", "gender": "female",
                "cnic": "35202-3344556-2", "phone": "+923456789012",
                "category": Employee.Category.WORKER_PIECE,
                "wage_type": Employee.WageType.PIECE_RATE,
                "joining_date": date(2023, 8, 1), "basic_salary": Decimal("37000.00"),
                "branch": branches["U3"], "department": depts["STTC"], "designation": desigs["OP-STTC"],
                "grade": grades["SKILL-5"], "shift": shifts["SH-MORN"],
            },
        ]
        for emp_info in sample_employees:
            Employee.objects.update_or_create(
                employee_id=emp_info["employee_id"], defaults=emp_info
            )
        self.stdout.write(self.style.SUCCESS(f"[OK] Seeded {len(sample_employees)} Sample Employees"))

        # ── 9. RBAC: Permissions Matrix ────────────────────────────────────────
        modules = [
            "dashboard", "orders", "production", "planning", "inventory", "quality",
            "hr_employee", "hr_recruitment", "attendance", "leave", "payroll",
            "advances", "contractors", "performance", "training", "discipline",
            "separation", "compliance", "ledger", "costing", "reports", "settings", "audit"
        ]
        actions = ["view", "create", "edit", "delete", "approve", "reject", "export", "lock", "configure"]

        created_perms = 0
        for mod in modules:
            for act in actions:
                p, created = Permission.objects.update_or_create(
                    module=mod, action=act, scope=Permission.Scope.BRANCH,
                    defaults={"description": f"{act.capitalize()} access for {mod} at branch level"}
                )
                if created:
                    created_perms += 1

        # Super admin "ALL" scope permissions
        for mod in modules:
            Permission.objects.update_or_create(
                module=mod, action=Permission.Action.VIEW, scope=Permission.Scope.ALL,
                defaults={"description": f"View {mod} across all branches"}
            )
            Permission.objects.update_or_create(
                module=mod, action=Permission.Action.APPROVE, scope=Permission.Scope.ALL,
                defaults={"description": f"Approve {mod} across all branches"}
            )

        self.stdout.write(self.style.SUCCESS("[OK] Generated RBAC atomic permissions"))

        # ── 10. RBAC Roles ─────────────────────────────────────────────────────
        roles_def = [
            ("super_admin", "Super Administrator (All Mills)", 1, True),
            ("hr_director", "HR Director / Compliance Head", 2, True),
            ("payroll_officer", "Payroll & Compensation Officer", 3, True),
            ("timekeeper", "Biometric Timekeeper & Shift Incharge", 4, True),
            ("contractor_mgr", "Contractor (Thekedar) Manager", 5, True),
            ("floor_supervisor", "Production Floor Supervisor", 6, False),
            ("worker_self", "Worker Self-Service Portal", 10, False),
        ]
        roles = {}
        for code, name, prio, is_sys in roles_def:
            r, _ = Role.objects.update_or_create(code=code, defaults={"name": name, "hierarchy_level": prio, "is_system_role": is_sys})
            roles[code] = r

        # Assign permissions to roles
        hr_perms = Permission.objects.filter(module__in=[
            "hr_employee", "hr_recruitment", "attendance", "leave", "payroll",
            "advances", "contractors", "performance", "training", "discipline",
            "separation", "compliance", "reports"
        ])
        for p in hr_perms:
            RolePermission.objects.get_or_create(role=roles["hr_director"], permission=p)

        pay_perms = Permission.objects.filter(module__in=["payroll", "advances", "attendance", "reports"])
        for p in pay_perms:
            RolePermission.objects.get_or_create(role=roles["payroll_officer"], permission=p)

        time_perms = Permission.objects.filter(module__in=["attendance", "leave"], action__in=["view", "create", "edit"])
        for p in time_perms:
            RolePermission.objects.get_or_create(role=roles["timekeeper"], permission=p)

        # ── 11. Field-Level Policies (Data Masking) ───────────────────────────
        FieldPolicy.objects.update_or_create(
            role=roles["floor_supervisor"], module="hr_employee", field_name="basic_salary",
            defaults={"field_action": FieldPolicy.FieldAction.HIDE}
        )
        FieldPolicy.objects.update_or_create(
            role=roles["floor_supervisor"], module="hr_employee", field_name="bank_account_number",
            defaults={"field_action": FieldPolicy.FieldAction.MASK}
        )
        FieldPolicy.objects.update_or_create(
            role=roles["floor_supervisor"], module="hr_employee", field_name="cnic",
            defaults={"field_action": FieldPolicy.FieldAction.MASK}
        )

        # ── 12. Segregation of Duties (SoD) Rules ─────────────────────────────
        SoDRule.objects.update_or_create(
            code="SOD-PAYROLL-01",
            defaults={
                "name": "Maker-Checker Separation for Payroll",
                "conflicting_permissions": [{"perm_a": "payroll:create", "perm_b": "payroll:approve"}],
                "severity": "error",
                "description": "The user who generates/edits the monthly payroll sheet cannot approve or lock it.",
            }
        )

        SoDRule.objects.update_or_create(
            code="SOD-THEKEDAR-02",
            defaults={
                "name": "Thekedar Billing & Headcount Independence",
                "conflicting_permissions": [{"perm_a": "contractors:edit", "perm_b": "contractors:approve"}],
                "severity": "error",
                "description": "Contractor supervisor cannot approve payments for headcounts verified by themselves.",
            }
        )

        self.stdout.write(self.style.SUCCESS("[OK] Configured Segregation of Duties (SoD) rules & Field masking policies"))
        self.stdout.write(self.style.SUCCESS("All HR & RBAC data seeded successfully!"))
