"""
HR App — Business Services & Calculation Engines.

Includes:
  1. PayrollEngine: Pay period processing, statutory rules (EOBI, PESSI, WWF),
     income tax slab calculation, allowances, overtime, advances, payslip generation,
     and bank advice file export.
  2. AttendanceReconciliationService: Biometric punch processing, late tracking,
     shift pairing, and daily attendance generation.
  3. PieceRateSettlementService: Piece-rate calculation from verified production tickets.
  4. ContractorBillingService: Thekedar headcount, piece-rate, commission, and TDS billing.
  5. GratuityAndExitService: Standing Orders gratuity, leave encashment, and final settlement.
"""
import csv
import io
from decimal import Decimal, ROUND_HALF_UP
from datetime import date, datetime, timedelta
from typing import Dict, List, Optional, Any

from django.db import models, transaction
from django.utils import timezone

from apps.branches.models import Branch
from apps.hr.models import (
    Employee, Shift, DailyAttendance, AttendancePunch, AttendanceRule,
    SalaryStructure, SalaryComponent, SalaryStructureComponent,
    PayPeriod, PayrollRun, Payslip, PayslipLine, PayrollException,
    Advance, AdvanceRecovery, Fine,
    Contractor, ContractorHeadcount, ContractorBill,
    PieceRateOutput, PieceRateItem,
    Separation, StatutoryRule, TaxSlab, LeaveBalance,
)


class PayrollEngine:
    """
    Statutory-compliant payroll engine for textile mill workers & staff.
    Supports permanent, daily-wage, piece-rate, and contractor categories.
    Rules & percentages are retrieved dynamically from StatutoryRule config.
    """

    @classmethod
    def get_statutory_rule(cls, rule_type: str, province: str = "punjab", effective_date: Optional[date] = None) -> Optional[StatutoryRule]:
        if not effective_date:
            effective_date = timezone.now().date()
        rule = StatutoryRule.objects.filter(
            models.Q(category=rule_type) | models.Q(rule_id__icontains=rule_type),
            is_active=True,
            effective_from__lte=effective_date,
        ).order_by("-effective_from").first()
        return rule

    @classmethod
    def get_minimum_wage(cls, branch=None, as_of: Optional[date] = None) -> Decimal:
        as_of = as_of or timezone.now().date()
        rule = StatutoryRule.objects.filter(
            models.Q(category="minimum_wage") | models.Q(rule_id__icontains="MW"),
            is_active=True,
            effective_from__lte=as_of,
        ).order_by("-effective_from").first()
        if rule and rule.value_numeric:
            return rule.value_numeric
        return Decimal("37000.00")

    @classmethod
    def calculate_piece_rate_pay(
        cls,
        employee: Employee,
        total_piece_earning: Decimal,
        run_date: Optional[date] = None,
        payable_days: Decimal = Decimal("30.00"),
        total_days: Decimal = Decimal("30.00"),
    ) -> Dict[str, Any]:
        """
        Check piece-rate earnings against statutory minimum wage.
        If piece earning < minimum wage, applies minimum-wage top-up.
        """
        min_wage = cls.get_minimum_wage(employee.branch, run_date)
        prorated_min_wage = (min_wage * (payable_days / total_days)).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
        if total_piece_earning < prorated_min_wage:
            top_up = (prorated_min_wage - total_piece_earning).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
            return {
                "piece_rate_earnings": total_piece_earning,
                "minimum_wage_top_up": top_up,
                "gross_pay": prorated_min_wage,
                "top_up_applied": True,
            }
        return {
            "piece_rate_earnings": total_piece_earning,
            "minimum_wage_top_up": Decimal("0.00"),
            "gross_pay": total_piece_earning,
            "top_up_applied": False,
        }

    @classmethod
    def calculate_overtime(
        cls,
        basic_salary: Decimal,
        ot_hours: Decimal,
        max_ot_hours: Optional[Decimal] = None,
        attendance_rule: Optional[AttendanceRule] = None,
    ) -> Dict[str, Any]:
        """
        Calculates overtime wages at 2x ordinary rate with statutory/policy cap.
        Standard cap is attendance_rule.max_ot_hours_per_month (or max_ot_hours).
        """
        if max_ot_hours is None and attendance_rule:
            max_ot_hours = attendance_rule.max_ot_hours_per_month

        capped = False
        effective_ot_hours = ot_hours
        if max_ot_hours is not None and ot_hours > max_ot_hours:
            effective_ot_hours = max_ot_hours
            capped = True

        # Standard Pakistani law: 2x hourly wage (basic / 208 hours)
        hourly_wage = (basic_salary / Decimal("208.00")).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP) if basic_salary > 0 else Decimal("0.00")
        multiplier = Decimal("2.00")
        if attendance_rule and attendance_rule.ot_rate_multiplier:
            multiplier = attendance_rule.ot_rate_multiplier
        ot_rate = hourly_wage * multiplier
        ot_pay = (effective_ot_hours * ot_rate).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

        return {
            "requested_ot_hours": ot_hours,
            "ot_hours": effective_ot_hours,
            "hourly_wage": hourly_wage,
            "multiplier": multiplier,
            "ot_rate": ot_rate,
            "ot_pay": ot_pay,
            "capped": capped,
        }

    @classmethod
    def calculate_income_tax(cls, annual_taxable_income: Decimal, effective_date: Optional[date] = None) -> Decimal:
        """Calculate annual tax from progressive TaxSlab entries and return monthly tax."""
        if not effective_date:
            effective_date = timezone.now().date()
        slabs = TaxSlab.objects.filter(
            effective_from__lte=effective_date,
            is_deleted=False,
        ).order_by("sort_order")
        if not slabs.exists():
            slabs = TaxSlab.objects.filter(is_deleted=False).order_by("sort_order")
        monthly_tax = Decimal("0.00")
        for slab in slabs:
            min_inc = slab.min_income
            max_inc = slab.max_income or Decimal("999999999.00")
            if min_inc <= annual_taxable_income <= max_inc:
                excess = annual_taxable_income - min_inc
                rate = slab.rate_on_excess or Decimal("0.00")
                annual_tax = slab.fixed_tax + (excess * (rate / Decimal("100.00")))
                monthly_tax = (annual_tax / Decimal("12.00")).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
                break
        return monthly_tax

    @classmethod
    @transaction.atomic
    def process_payroll_run(cls, payroll_run: PayrollRun, user=None) -> Dict[str, Any]:
        """
        Process salary for all eligible employees in the given PayrollRun.
        """
        payroll_run.status = PayrollRun.Status.PROCESSING
        payroll_run.save(update_fields=["status"])

        pay_period = payroll_run.pay_period
        branch = payroll_run.branch
        target_employees = Employee.objects.filter(branch=branch, is_active=True)

        if payroll_run.department:
            target_employees = target_employees.filter(department=payroll_run.department)
        if payroll_run.employment_category:
            target_employees = target_employees.filter(employment_category=payroll_run.employment_category)

        eobi_rule = StatutoryRule.objects.filter(rule_type=StatutoryRule.RuleType.EOBI, is_active=True).order_by("-effective_from").first()
        sessi_rule = StatutoryRule.objects.filter(rule_type=StatutoryRule.RuleType.SOCIAL_SECURITY, is_active=True).order_by("-effective_from").first()
        min_wage_rule = StatutoryRule.objects.filter(rule_type=StatutoryRule.RuleType.MINIMUM_WAGE, is_active=True).order_by("-effective_from").first()

        min_wage = min_wage_rule.threshold_amount if min_wage_rule else Decimal("37000.00")

        total_employees = 0
        total_gross = Decimal("0.00")
        total_deductions = Decimal("0.00")
        total_net = Decimal("0.00")
        total_employer_cost = Decimal("0.00")

        Payslip.objects.filter(payroll_run=payroll_run, status=Payslip.Status.DRAFT).delete()

        for emp in target_employees:
            try:
                slip = cls._compute_employee_payslip(
                    payroll_run=payroll_run,
                    employee=emp,
                    pay_period=pay_period,
                    min_wage=min_wage,
                    eobi_rule=eobi_rule,
                    sessi_rule=sessi_rule,
                )
                if slip:
                    total_employees += 1
                    total_gross += slip.gross_pay
                    total_deductions += slip.total_deductions
                    total_net += slip.net_pay
                    total_employer_cost += slip.total_employer_cost
            except Exception as e:
                PayrollException.objects.create(
                    payroll_run=payroll_run,
                    employee=emp,
                    exception_type=PayrollException.ExceptionType.CALCULATION_ERROR,
                    severity=PayrollException.Severity.HIGH,
                    message=f"Failed computing payroll for {emp.employee_id}: {str(e)}",
                )

        payroll_run.total_employees = total_employees
        payroll_run.total_gross_pay = total_gross
        payroll_run.total_deductions = total_deductions
        payroll_run.total_net_pay = total_net
        payroll_run.total_employer_cost = total_employer_cost
        payroll_run.status = PayrollRun.Status.COMPUTED
        payroll_run.computed_at = timezone.now()
        payroll_run.save()

        return {
            "total_employees": total_employees,
            "total_gross": str(total_gross),
            "total_deductions": str(total_deductions),
            "total_net": str(total_net),
            "total_employer_cost": str(total_employer_cost),
        }

    @classmethod
    def _compute_employee_payslip(
        cls,
        payroll_run: PayrollRun,
        employee: Employee,
        pay_period: PayPeriod,
        min_wage: Decimal,
        eobi_rule: Optional[StatutoryRule],
        sessi_rule: Optional[StatutoryRule],
    ) -> Optional[Payslip]:
        attendance_records = DailyAttendance.objects.filter(
            employee=employee,
            date__gte=pay_period.start_date,
            date__lte=pay_period.end_date,
        )

        total_days = pay_period.total_days or Decimal("30.00")
        present_days = Decimal(str(attendance_records.filter(status=DailyAttendance.Status.PRESENT).count()))
        half_days = Decimal(str(attendance_records.filter(status=DailyAttendance.Status.HALF_DAY).count()))
        leave_days = Decimal(str(attendance_records.filter(status=DailyAttendance.Status.ON_LEAVE).count()))
        holiday_days = Decimal(str(attendance_records.filter(status=DailyAttendance.Status.HOLIDAY).count()))
        absent_days = Decimal(str(attendance_records.filter(status=DailyAttendance.Status.ABSENT).count()))

        payable_days = present_days + (half_days * Decimal("0.5")) + leave_days + holiday_days
        if payable_days > total_days:
            payable_days = total_days

        # Sum overtime hours and apply monthly OT Cap (50 hours standard mill policy)
        ot_rule = AttendanceRule.objects.filter(is_active=True).first()
        max_ot_cap = Decimal("50.00")
        if ot_rule and hasattr(ot_rule, "max_ot_hours_per_week"):
            max_ot_cap = ot_rule.max_ot_hours_per_week * Decimal("4.00")

        raw_ot_hours = Decimal("0.00")
        for att in attendance_records:
            raw_ot_hours += att.approved_ot_hours

        # Enforce OT Cap
        ot_hours = min(raw_ot_hours, max_ot_cap)

        basic_salary = employee.basic_salary or Decimal("0.00")
        prorated_basic = (basic_salary * (payable_days / total_days)).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

        allowances = Decimal("0.00")
        structure = employee.salary_structure
        component_lines = []

        if structure:
            for s_comp in structure.structure_components.select_related("component").filter(is_active=True):
                comp = s_comp.component
                val = Decimal("0.00")
                if s_comp.override_amount:
                    val = s_comp.override_amount
                elif s_comp.override_percentage:
                    val = (basic_salary * (s_comp.override_percentage / Decimal("100.00"))).quantize(Decimal("0.01"))
                elif comp.computation_type == SalaryComponent.ComputationType.FIXED:
                    val = comp.default_amount or Decimal("0.00")
                elif comp.computation_type == SalaryComponent.ComputationType.PERCENTAGE_OF_BASIC:
                    val = (basic_salary * (comp.percentage_of_basic / Decimal("100.00"))).quantize(Decimal("0.01"))

                if comp.is_taxable or comp.component_type == SalaryComponent.ComponentType.EARNING:
                    val = (val * (payable_days / total_days)).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
                    allowances += val
                    component_lines.append((comp.name, comp.component_type, val))

        # Piece-Rate earnings with statutory minimum-wage top-up
        piece_rate_pay = Decimal("0.00")
        if employee.employment_category == Employee.EmploymentCategory.PIECE_RATE:
            piece_outputs = PieceRateOutput.objects.filter(
                employee=employee,
                date__gte=pay_period.start_date,
                date__lte=pay_period.end_date,
                status=PieceRateOutput.Status.VERIFIED,
            )
            for po in piece_outputs:
                piece_rate_pay += po.total_amount
            prorated_basic = piece_rate_pay

            # Statutory minimum wage top-up
            prorated_min_wage = (min_wage * (payable_days / total_days)).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
            if prorated_basic < prorated_min_wage:
                top_up = prorated_min_wage - prorated_basic
                allowances += top_up
                component_lines.append(("Statutory Minimum Wage Top-up", SalaryComponent.ComponentType.EARNING, top_up))

        # Overtime Pay (standard Pakistani law: 2x basic/gross hourly wage)
        hourly_wage = (basic_salary / Decimal("208.00")).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP) if basic_salary > 0 else Decimal("0.00")
        ot_rate = hourly_wage * Decimal("2.00")
        ot_pay = (ot_hours * ot_rate).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

        gross_pay = prorated_basic + allowances + ot_pay

        # 6. Statutory Deductions (EOBI, PESSI, Tax)
        eobi_emp = Decimal("0.00")
        eobi_empr = Decimal("0.00")
        if employee.eobi_eligible and eobi_rule:
            wage_base = min_wage
            eobi_emp = (wage_base * (eobi_rule.employee_rate / Decimal("100.00"))).quantize(Decimal("0.01"))
            eobi_empr = (wage_base * (eobi_rule.employer_rate / Decimal("100.00"))).quantize(Decimal("0.01"))

        sessi_emp = Decimal("0.00")
        sessi_empr = Decimal("0.00")
        if employee.social_security_eligible and sessi_rule:
            wage_base = min(gross_pay, sessi_rule.wage_ceiling or Decimal("40000.00"))
            sessi_emp = (wage_base * (sessi_rule.employee_rate / Decimal("100.00"))).quantize(Decimal("0.01"))
            sessi_empr = (wage_base * (sessi_rule.employer_rate / Decimal("100.00"))).quantize(Decimal("0.01"))

        # Income Tax estimation
        annual_projected = gross_pay * Decimal("12.00")
        income_tax = cls.calculate_income_tax(annual_projected)

        # 7. Advance & Loan Deductions
        advance_deduction = Decimal("0.00")
        pending_advances = Advance.objects.filter(
            employee=employee,
            status=Advance.Status.DISBURSED,
            recovered_amount__lt=models.F("amount"),
        )
        for adv in pending_advances:
            remaining = adv.amount - adv.recovered_amount
            deduct_amount = min(adv.installment_amount or remaining, remaining)
            advance_deduction += deduct_amount
            AdvanceRecovery.objects.create(
                advance=adv,
                payroll_run=payroll_run,
                recovery_date=pay_period.end_date,
                amount=deduct_amount,
            )
            adv.recovered_amount += deduct_amount
            if adv.recovered_amount >= adv.amount:
                adv.status = Advance.Status.FULLY_RECOVERED
            adv.save()

        # Fines
        fines_deduction = Decimal("0.00")
        uncollected_fines = Fine.objects.filter(
            employee=employee,
            status=Fine.Status.CONFIRMED,
            payroll_run__isnull=True,
        )
        for fn in uncollected_fines:
            fines_deduction += fn.amount
            fn.payroll_run = payroll_run
            fn.status = Fine.Status.DEDUCTED
            fn.save()

        total_deductions = eobi_emp + sessi_emp + income_tax + advance_deduction + fines_deduction
        net_pay = max(Decimal("0.00"), gross_pay - total_deductions)
        total_employer_cost = gross_pay + eobi_empr + sessi_empr

        # Create Payslip record
        slip = Payslip.objects.create(
            payroll_run=payroll_run,
            employee=employee,
            branch=employee.branch,
            department=employee.department,
            designation=employee.designation,
            payment_mode=employee.payment_mode or Payslip.PaymentMode.BANK_TRANSFER,
            bank_name=employee.bank_name,
            account_number=employee.bank_account_number,
            iban=employee.iban,
            total_days=total_days,
            present_days=present_days,
            absent_days=absent_days,
            leave_days=leave_days,
            holiday_days=holiday_days,
            payable_days=payable_days,
            overtime_hours=ot_hours,
            basic_pay=prorated_basic,
            gross_pay=gross_pay,
            eobi_employee=eobi_emp,
            eobi_employer=eobi_empr,
            social_security_employee=sessi_emp,
            social_security_employer=sessi_empr,
            income_tax=income_tax,
            advance_deduction=advance_deduction,
            fine_deduction=fines_deduction,
            total_deductions=total_deductions,
            net_pay=net_pay,
            total_employer_cost=total_employer_cost,
            status=Payslip.Status.DRAFT,
        )

        # Create Payslip detail lines
        PayslipLine.objects.create(
            payslip=slip,
            line_type=PayslipLine.LineType.BASIC,
            description="Basic Pay",
            amount=prorated_basic,
        )
        if ot_pay > 0:
            PayslipLine.objects.create(
                payslip=slip,
                line_type=PayslipLine.LineType.OVERTIME,
                description=f"Overtime ({ot_hours} hrs @ 2x rate)",
                amount=ot_pay,
            )
        for name, ctype, val in component_lines:
            PayslipLine.objects.create(
                payslip=slip,
                line_type=PayslipLine.LineType.ALLOWANCE,
                description=name,
                amount=val,
            )
        if eobi_emp > 0:
            PayslipLine.objects.create(
                payslip=slip,
                line_type=PayslipLine.LineType.EOBI,
                description="EOBI (Employee Contribution)",
                amount=eobi_emp,
            )
        if sessi_emp > 0:
            PayslipLine.objects.create(
                payslip=slip,
                line_type=PayslipLine.LineType.SOCIAL_SECURITY,
                description="Social Security (PESSI)",
                amount=sessi_emp,
            )
        if income_tax > 0:
            PayslipLine.objects.create(
                payslip=slip,
                line_type=PayslipLine.LineType.TAX,
                description="Income Tax Withheld",
                amount=income_tax,
            )
        if advance_deduction > 0:
            PayslipLine.objects.create(
                payslip=slip,
                line_type=PayslipLine.LineType.ADVANCE,
                description="Salary Advance Recovery",
                amount=advance_deduction,
            )
        if fines_deduction > 0:
            PayslipLine.objects.create(
                payslip=slip,
                line_type=PayslipLine.LineType.FINE,
                description="Disciplinary Fine",
                amount=fines_deduction,
            )

        return slip

    @classmethod
    def generate_bank_advice_csv(cls, payroll_run: PayrollRun) -> str:
        """
        Generates standard Pakistani Bank Advice CSV format (HBL/Meezan/UBL compatible):
        Employee Code, CNIC, Account Title, Bank Name, Account Number, IBAN, Net Amount
        """
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(["Sr #", "Employee ID", "CNIC", "Account Title", "Bank", "Account Number", "IBAN", "Amount (PKR)"])

        slips = Payslip.objects.filter(
            payroll_run=payroll_run,
            payment_mode=Payslip.PaymentMode.BANK_TRANSFER,
        ).select_related("employee")

        sr = 1
        for slip in slips:
            emp = slip.employee
            writer.writerow([
                sr,
                emp.employee_id,
                emp.cnic,
                emp.bank_account_title or emp.full_name,
                emp.bank_name or slip.bank_name,
                emp.bank_account_number or slip.account_number,
                emp.iban or slip.iban,
                f"{slip.net_pay:.2f}",
            ])
            sr += 1

        return output.getvalue()


class AttendanceReconciliationService:
    """
    Biometric punch log synchronization, punch pairing, late coming detection,
    and daily attendance reconciliation.
    """

    @classmethod
    @transaction.atomic
    def reconcile_day(cls, target_date: date, branch=None) -> Dict[str, int]:
        punches = AttendancePunch.objects.filter(
            timestamp__date=target_date,
            is_processed=False,
        ).order_by("employee", "timestamp")

        employees = Employee.objects.filter(is_active=True)
        if branch:
            employees = employees.filter(branch=branch)
            punches = punches.filter(branch=branch)

        rules = AttendanceRule.objects.filter(is_active=True).first()
        grace_minutes = rules.late_grace_minutes if rules else 15

        created_count = 0
        updated_count = 0

        # Group punches by employee
        punches_by_emp: Dict[str, List[AttendancePunch]] = {}
        for p in punches:
            punches_by_emp.setdefault(p.employee_id, []).append(p)

        for emp in employees:
            emp_punches = punches_by_emp.get(emp.id, [])
            shift = emp.shift
            if not shift:
                continue

            in_punch = emp_punches[0] if emp_punches else None
            out_punch = emp_punches[-1] if len(emp_punches) > 1 else in_punch

            in_time = in_punch.timestamp.time() if in_punch else None
            out_time = out_punch.timestamp.time() if out_punch and out_punch != in_punch else None

            status = DailyAttendance.Status.ABSENT
            late_minutes = 0
            early_minutes = 0
            ot_hours = Decimal("0.00")

            if in_time:
                status = DailyAttendance.Status.PRESENT
                shift_start = datetime.combine(target_date, shift.start_time)
                actual_in = datetime.combine(target_date, in_time)
                grace_threshold = shift_start + timedelta(minutes=grace_minutes)

                if actual_in > grace_threshold:
                    late_delta = actual_in - shift_start
                    late_minutes = int(late_delta.total_seconds() / 60)

                if out_time:
                    shift_end = datetime.combine(target_date, shift.end_time)
                    actual_out = datetime.combine(target_date, out_time)
                    if actual_out > shift_end:
                        ot_delta = actual_out - shift_end
                        ot_hours = Decimal(str(round(ot_delta.total_seconds() / 3600, 2)))

            daily_att, created = DailyAttendance.objects.update_or_create(
                employee=emp,
                date=target_date,
                defaults={
                    "branch": emp.branch,
                    "shift": shift,
                    "status": status,
                    "in_time": in_time,
                    "out_time": out_time,
                    "late_minutes": late_minutes,
                    "early_departure_minutes": early_minutes,
                    "overtime_hours": ot_hours,
                    "approved_ot_hours": ot_hours,
                }
            )

            if created:
                created_count += 1
            else:
                updated_count += 1

        punches.update(is_processed=True)
        return {"created": created_count, "updated": updated_count}


class ContractorBillingService:
    """
    Settles contractor (Thekedar) invoices:
      Total = (Headcount Rate * verified headcount) + Commission - Withholding Tax (TDS)
    """

    @classmethod
    @transaction.atomic
    def generate_bill(
        cls,
        contractor: Contractor,
        pay_period: Optional[PayPeriod] = None,
        branch: Optional[Branch] = None,
        from_date: Optional[date] = None,
        to_date: Optional[date] = None,
        user=None,
    ) -> ContractorBill:
        start_date = from_date or (pay_period.start_date if pay_period else timezone.now().date())
        end_date = to_date or (pay_period.end_date if pay_period else timezone.now().date())

        headcounts = ContractorHeadcount.objects.filter(
            contractor=contractor,
            date__gte=start_date,
            date__lte=end_date,
        )

        gross_amount = Decimal("0.00")
        for hc in headcounts:
            if hc.total_amount:
                gross_amount += hc.total_amount
            else:
                workers = hc.workers_present or getattr(hc, "headcount_verified", 0) or getattr(hc, "headcount", 0)
                rate = hc.rate_per_worker or getattr(hc, "rate_per_day", Decimal("0.00")) or contractor.rate_per_head_daily or Decimal("0.00")
                gross_amount += Decimal(str(workers)) * rate

        # Retention & Tax Withheld
        retention_rate = contractor.retention_percentage or Decimal("0.00")
        retention_amount = (gross_amount * (retention_rate / Decimal("100.00"))).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

        wht_rate = contractor.tax_withholding_rate if contractor.tax_withholding_rate else Decimal("8.00")
        tax_withheld = (gross_amount * (wht_rate / Decimal("100.00"))).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

        net_payable = gross_amount - retention_amount - tax_withheld

        bill_branch = branch or (headcounts.first().branch if headcounts.exists() else contractor.branch)

        bill = ContractorBill.objects.create(
            contractor=contractor,
            branch=bill_branch,
            bill_number=f"CB-{contractor.code}-{start_date.strftime('%Y%m%d')}",
            period_start=start_date,
            period_end=end_date,
            gross_amount=gross_amount,
            retention_amount=retention_amount,
            tax_withheld=tax_withheld,
            net_payable=net_payable,
            status=ContractorBill.BillStatus.DRAFT,
        )
        return bill


class GratuityAndExitService:
    """
    Computes statutory separation settlement under Pakistan Standing Orders Ordinance:
    1. Gratuity = Last drawn basic wage * completed years of service.
    2. Leave encashment = Balance annual leave * daily wage.
    3. Deduction of outstanding loans/advances.
    """

    @classmethod
    def calculate_settlement(
        cls,
        separation: Separation,
        completed_years: Optional[Decimal] = None,
    ) -> Dict[str, Decimal]:
        emp = separation.employee
        if completed_years is not None:
            service_years = completed_years
        elif hasattr(separation, "tenure_years") and separation.tenure_years:
            service_years = Decimal(str(round(separation.tenure_years, 2)))
        elif emp.joining_date:
            end_date = separation.last_working_date or timezone.now().date()
            diff_days = (end_date - emp.joining_date).days
            service_years = Decimal(str(round(diff_days / 365.25, 2)))
        else:
            service_years = Decimal("0.00")

        basic_pay = emp.basic_salary or Decimal("0.00")
        daily_rate = (basic_pay / Decimal("30.00")).quantize(Decimal("0.01"))

        gratuity = Decimal("0.00")
        if service_years >= Decimal("1.00"):
            gratuity = (basic_pay * service_years).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

        leave_bal = LeaveBalance.objects.filter(employee=emp, leave_type__code="AL").first()
        unavailed_leaves = leave_bal.balance_days if leave_bal and hasattr(leave_bal, "balance_days") else Decimal("0.00")
        leave_encashment = (unavailed_leaves * daily_rate).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

        advances = Advance.objects.filter(
            employee=emp,
            status=Advance.Status.DISBURSED,
        )
        pending_adv = sum((adv.amount - adv.recovered_amount for adv in advances), Decimal("0.00"))

        gross_settlement = gratuity + leave_encashment
        net_settlement = max(Decimal("0.00"), gross_settlement - pending_adv)

        separation.gratuity_amount = gratuity
        separation.leave_encashment = leave_encashment
        separation.deductions = pending_adv
        separation.final_settlement_amount = net_settlement
        separation.save(update_fields=["gratuity_amount", "leave_encashment", "deductions", "final_settlement_amount"])

        return {
            "gratuity": gratuity,
            "leave_encashment": leave_encashment,
            "loan_deductions": pending_adv,
            "net_settlement": net_settlement,
        }
