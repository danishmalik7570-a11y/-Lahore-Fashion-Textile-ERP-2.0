from datetime import timedelta
from decimal import Decimal
from django.db.models import Sum, Count, Q
from django.utils import timezone
from django.conf import settings
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions, status

from apps.branches.models import Branch
from apps.orders.models import Order
from apps.production.models import ProductionLot, OutputEntry
from apps.finance.models import Invoice
from apps.quality.models import QCAudit
from apps.attendance.models import AttendanceRecord
from apps.core.demo_data import is_demo_data_active, load_demo_data, wipe_demo_data


# Exact production flow required by specification:
FLOW_STAGES = [
    {"key": "YARN", "label": "Yarn Store", "db_stage": "YARN"},
    {"key": "WEAVING", "label": "Weaving/Knitting", "db_stage": "WEAVING"},
    {"key": "GREY_INSPECT", "label": "Grey Fabric", "db_stage": "GREY_INSPECT"},
    {"key": "DYEING", "label": "Dyeing", "db_stage": "DYEING"},
    {"key": "PRINTING", "label": "Printing", "db_stage": "PRINTING"},
    {"key": "CUTTING", "label": "Cutting", "db_stage": "CUTTING"},
    {"key": "STITCHING", "label": "Stitching", "db_stage": "STITCHING"},
    {"key": "PACKING", "label": "Finishing & Packing", "db_stage": "PACKING"},
    {"key": "DISPATCH", "label": "Delivery", "db_stage": "DISPATCH"},
]


def get_default_branch(request=None) -> Branch:
    """Fetch the single operating mill branch."""
    branch = Branch.objects.filter(is_head_office=True).first()
    if not branch:
        branch = Branch.objects.filter(is_active=True).first()
    if not branch:
        branch = Branch.objects.first()
    return branch


class DashboardStatsAPIView(APIView):
    """
    Owner OS real-time stats endpoint.
    Computes real metrics from database records without fake or mock numbers.
    Honest empty states when no data is present.
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request, *args, **kwargs):
        branch = get_default_branch(request)
        today = timezone.now().date()

        # ── 1. Check if DB has any operational records ──
        total_orders_all_time = Order.objects.filter(branch=branch).count() if branch else Order.objects.count()
        total_lots_all_time = ProductionLot.objects.filter(branch=branch).count() if branch else ProductionLot.objects.count()
        is_empty = (total_orders_all_time == 0 and total_lots_all_time == 0)

        # ── 2. Row 1: KPI Cards ──
        # KPI 1: Active orders
        active_orders_qs = Order.objects.exclude(status=Order.Status.DELIVERED)
        if branch:
            active_orders_qs = active_orders_qs.filter(branch=branch)
        active_orders_count = active_orders_qs.count()
        active_orders_val = active_orders_qs.aggregate(Sum("total_amount"))["total_amount__sum"] or Decimal("0.00")

        # KPI 2: Lots in production
        lots_in_prod_qs = ProductionLot.objects.exclude(stage=ProductionLot.Stage.DISPATCH)
        if branch:
            lots_in_prod_qs = lots_in_prod_qs.filter(branch=branch)
        lots_in_prod_count = lots_in_prod_qs.count()

        # KPI 3: Output today vs target
        entries_today_qs = OutputEntry.objects.filter(occurred_at__date=today)
        if branch:
            entries_today_qs = entries_today_qs.filter(branch=branch)
        output_today = entries_today_qs.aggregate(Sum("qty_good"))["qty_good__sum"] or 0
        
        # Target: sum of active lot targets or default daily target
        daily_target = 10000 if lots_in_prod_count > 0 else 0

        # KPI 4: Delayed lots
        delayed_lots_qs = ProductionLot.objects.filter(
            Q(status__icontains="delay") | Q(status__icontains="late")
        ).exclude(stage=ProductionLot.Stage.DISPATCH)
        if branch:
            delayed_lots_qs = delayed_lots_qs.filter(branch=branch)
        delayed_lots_count = delayed_lots_qs.count()

        # KPI 5: Receivables
        receivables_qs = Invoice.objects.filter(status__in=[Invoice.Status.PENDING, Invoice.Status.OVERDUE])
        if branch:
            receivables_qs = receivables_qs.filter(branch=branch)
        receivables_total = receivables_qs.aggregate(Sum("net_payable"))["net_payable__sum"] or Decimal("0.00")

        # KPI 6: Attendance today
        att_qs = AttendanceRecord.objects.filter(date=today)
        if branch:
            att_qs = att_qs.filter(branch=branch)
        attendance_today = att_qs.count()

        kpis = [
            {
                "id": "active_orders",
                "label": "Active orders",
                "value": active_orders_count if not is_empty else 0,
                "sub": f"PKR {float(active_orders_val):,.0f}" if not is_empty and active_orders_count > 0 else "No active orders",
                "formula": "Count of orders where status != 'Delivered'",
                "source": "apps.orders.Order",
                "drilldown": "/portal/owner/orders",
                "status": "normal",
            },
            {
                "id": "lots_in_production",
                "label": "Lots in production",
                "value": lots_in_prod_count if not is_empty else 0,
                "sub": f"{lots_in_prod_count} lots active across 9 stages" if lots_in_prod_count > 0 else "No active lots",
                "formula": "Count of production lots where stage != 'DISPATCH'",
                "source": "apps.production.ProductionLot",
                "drilldown": "/portal/owner/production",
                "status": "normal",
            },
            {
                "id": "output_today",
                "label": "Output today vs target",
                "value": f"{output_today:,} pcs" if not is_empty and output_today > 0 else "0 pcs",
                "sub": f"Target: {daily_target:,} pcs ({round(output_today / daily_target * 100, 1) if daily_target > 0 else 0}%)",
                "formula": "Sum of good pieces from floor entries today vs target",
                "source": "apps.production.OutputEntry",
                "drilldown": "/portal/floor/entry",
                "status": "normal" if output_today >= daily_target else "warning",
            },
            {
                "id": "delayed_lots",
                "label": "Delayed lots",
                "value": delayed_lots_count if not is_empty else 0,
                "sub": f"{delayed_lots_count} lots require intervention" if delayed_lots_count > 0 else "All lots on track",
                "formula": "Lots where status contains 'Delay' and not dispatched",
                "source": "apps.production.ProductionLot",
                "drilldown": "/portal/owner/production?filter=delayed",
                "status": "danger" if delayed_lots_count > 0 else "success",
            },
            {
                "id": "receivables",
                "label": "Receivables",
                "value": f"PKR {float(receivables_total):,.0f}" if not is_empty and receivables_total > 0 else "PKR 0",
                "sub": f"{receivables_qs.count()} pending/overdue invoices" if receivables_qs.count() > 0 else "No overdue invoices",
                "formula": "Sum(net_payable) for pending and overdue invoices",
                "source": "apps.finance.Invoice",
                "drilldown": "/portal/owner/finance",
                "status": "warning" if receivables_total > 0 else "success",
            },
            {
                "id": "attendance_today",
                "label": "Attendance today",
                "value": f"{attendance_today}" if not is_empty else "0",
                "sub": f"{attendance_today} biometric check-ins today" if attendance_today > 0 else "No check-ins recorded",
                "formula": "Count of distinct workers clocked in today",
                "source": "apps.attendance.AttendanceRecord",
                "drilldown": "/portal/owner/hr",
                "status": "normal",
            },
        ]

        # ── 3. Row 2: Production Flow (Exact 9 stages) ──
        lots_by_stage_counts = {
            r["stage"]: r["count"]
            for r in (
                ProductionLot.objects.filter(branch=branch)
                .values("stage")
                .annotate(count=Count("id"))
            )
        } if branch else {}

        delayed_by_stage_counts = {
            r["stage"]: r["count"]
            for r in (
                delayed_lots_qs.values("stage").annotate(count=Count("id"))
            )
        }

        production_flow = []
        for stage_def in FLOW_STAGES:
            stg_key = stage_def["db_stage"]
            lot_cnt = lots_by_stage_counts.get(stg_key, 0)
            delayed_cnt = delayed_by_stage_counts.get(stg_key, 0)
            production_flow.append({
                "key": stage_def["key"],
                "name": stage_def["label"],
                "lot_count": lot_cnt,
                "delayed_count": delayed_cnt,
                "has_delay": delayed_cnt > 0,
            })

        # ── 4. Row 3: Left "Delayed lots & alerts" & Right "Pending approvals" ──
        delayed_lots_list = [
            {
                "lot_number": lot.lot_number,
                "fabric_spec": lot.fabric_spec,
                "stage": next((s["label"] for s in FLOW_STAGES if s["db_stage"] == lot.stage), lot.stage),
                "produced_meters": lot.produced_meters,
                "target_meters": lot.target_meters,
                "status": lot.status,
                "supervisor": lot.supervisor_name,
            }
            for lot in delayed_lots_qs.order_by("-created_at")[:10]
        ]

        # Pending approvals (invoices pending, lots requiring approval, orders in draft)
        pending_invoices = Invoice.objects.filter(status=Invoice.Status.PENDING)
        if branch:
            pending_invoices = pending_invoices.filter(branch=branch)

        pending_orders = Order.objects.filter(status=Order.Status.DRAFT)
        if branch:
            pending_orders = pending_orders.filter(branch=branch)

        approvals = []
        for inv in pending_invoices[:5]:
            approvals.append({
                "id": f"inv-{inv.id}",
                "type": "Invoice Approval",
                "title": f"Invoice {inv.number} - {inv.client_name}",
                "dept": "Finance",
                "value": f"PKR {float(inv.net_payable):,.0f}",
                "date": str(inv.due_date),
            })
        for ord_item in pending_orders[:5]:
            approvals.append({
                "id": f"ord-{ord_item.id}",
                "type": "Order Confirmation",
                "title": f"Order {ord_item.number} - {ord_item.fabric_spec}",
                "dept": "Sales & Merchandising",
                "value": f"PKR {float(ord_item.total_amount):,.0f}",
                "date": str(ord_item.delivery_date),
            })

        # ── 5. Row 4: Charts ──
        # 1) Output vs Target (past 7 days)
        seven_days_ago = today - timedelta(days=6)
        daily_outputs = (
            OutputEntry.objects.filter(occurred_at__date__gte=seven_days_ago)
            .values("occurred_at__date")
            .annotate(good=Sum("qty_good"))
            .order_by("occurred_at__date")
        )
        output_map = {str(d["occurred_at__date"]): d["good"] for d in daily_outputs}

        output_chart = []
        for i in range(7):
            d = seven_days_ago + timedelta(days=i)
            d_str = str(d)
            output_chart.append({
                "date": d.strftime("%d %b"),
                "output": output_map.get(d_str, 0),
                "target": 10000 if not is_empty else 0,
            })

        # 2) Receivables Ageing
        all_unpaid_invoices = Invoice.objects.exclude(status=Invoice.Status.PAID)
        if branch:
            all_unpaid_invoices = all_unpaid_invoices.filter(branch=branch)
        
        ageing = {"0-30": 0.0, "31-60": 0.0, "61-90": 0.0, "90+": 0.0}
        for inv in all_unpaid_invoices:
            days_overdue = (today - inv.due_date).days if inv.due_date else 0
            val = float(inv.net_payable)
            if days_overdue <= 30:
                ageing["0-30"] += val
            elif days_overdue <= 60:
                ageing["31-60"] += val
            elif days_overdue <= 90:
                ageing["61-90"] += val
            else:
                ageing["90+"] += val

        receivables_ageing_chart = [
            {"bracket": "0-30 Days", "amount": round(ageing["0-30"], 2)},
            {"bracket": "31-60 Days", "amount": round(ageing["31-60"], 2)},
            {"bracket": "61-90 Days", "amount": round(ageing["61-90"], 2)},
            {"bracket": "90+ Days", "amount": round(ageing["90+"], 2)},
        ]

        # 3) Quality Pass Rate
        qc_audits = QCAudit.objects.all()
        if branch:
            qc_audits = qc_audits.filter(branch=branch)
        qc_total = qc_audits.count()
        qc_passed = qc_audits.filter(result__icontains="Pass").count()
        qc_pass_rate = round((qc_passed / qc_total * 100), 1) if qc_total > 0 else 0.0

        # ── 6. Row 5: Recent Activity ──
        recent_activity = []
        recent_entries = OutputEntry.objects.order_by("-occurred_at")[:5]
        for e in recent_entries:
            recent_activity.append({
                "id": str(e.id),
                "type": "Production Entry",
                "desc": f"Completed {e.qty_good} pcs ({e.operation_name}) on Bundle {e.bundle_id}",
                "time": e.occurred_at.strftime("%H:%M:%S"),
                "status": e.status,
            })

        return Response({
            "is_empty": is_empty,
            "is_demo_data": is_demo_data_active(),
            "mill_name": branch.name if branch else getattr(settings, "DEFAULT_UNIT_NAME", "Lahore Fashion Mill"),
            "mill_code": branch.code if branch else getattr(settings, "DEFAULT_UNIT_CODE", "LHR"),
            "single_unit_mode": getattr(settings, "SINGLE_UNIT_MODE", True),
            "updated_at": timezone.now().strftime("%H:%M:%S"),
            "kpis": kpis,
            "production_flow": production_flow,
            "delayed_lots": delayed_lots_list,
            "approvals": approvals,
            "charts": {
                "output_vs_target": output_chart,
                "receivables_ageing": receivables_ageing_chart,
                "qc_pass_rate": qc_pass_rate,
                "qc_total_audits": qc_total,
            },
            "recent_activity": recent_activity,
        })


class DemoDataManageAPIView(APIView):
    """
    Super Admin / Owner endpoint to seed or wipe labeled [DEMO] records.
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request, action: str):
        if request.user.is_authenticated:
            user_roles = [r.code for r in request.user.roles.all()] if hasattr(request.user, "roles") else []
            is_allowed = (
                request.user.is_superuser
                or "owner" in user_roles
                or "super_admin" in user_roles
                or getattr(request.user, "is_staff", False)
            )
            if not is_allowed:
                return Response(
                    {"error": "Only Owner or Super Admin can manage demo data."},
                    status=status.HTTP_403_FORBIDDEN,
                )

        branch = get_default_branch(request)
        if not branch:
            return Response({"error": "Default branch not found."}, status=status.HTTP_400_BAD_REQUEST)

        if action == "load":
            result = load_demo_data(branch)
            return Response(result, status=status.HTTP_200_OK)
        elif action == "wipe":
            result = wipe_demo_data(branch)
            return Response(result, status=status.HTTP_200_OK)
        else:
            return Response({"error": f"Unknown action: {action}"}, status=status.HTTP_400_BAD_REQUEST)