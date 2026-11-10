"""
Demo Data Manager for Lahore Fashion ERP (Single Unit Mode).
Allows Super Admin / Owner to seed or wipe clearly labeled [DEMO] records.
"""
from datetime import date, timedelta
from decimal import Decimal
from django.utils import timezone
from apps.branches.models import Branch
from apps.clients.models import Client
from apps.orders.models import Order
from apps.production.models import ProductionLot, OutputEntry, EntryChannel
from apps.finance.models import Invoice
from apps.quality.models import QCAudit
from apps.attendance.models import AttendanceRecord
from apps.labour.models import Worker


DEMO_TAG = "[DEMO]"


def is_demo_data_active() -> bool:
    """Check if any demo-tagged records exist in the system."""
    return (
        Order.objects.filter(fabric_spec__contains=DEMO_TAG).exists()
        or ProductionLot.objects.filter(fabric_spec__contains=DEMO_TAG).exists()
        or Invoice.objects.filter(client_name__contains=DEMO_TAG).exists()
    )


def load_demo_data(branch: Branch) -> dict:
    """Seed clearly labelled [DEMO] records across operations, finance, and quality."""
    today = timezone.now().date()

    # 1. Client
    client, _ = Client.objects.get_or_create(
        name=f"Al-Karam Textiles {DEMO_TAG}",
        branch=branch,
        defaults={
            "contact_person": "Tariq Mahmood",
            "phone": "+92-300-1234567",
            "email": "tariq@alkaram-demo.pk",
            "brand_type": Client.BrandType.EXPORT,
            "city": Client.City.LAHORE,
        },
    )

    # 2. Worker
    worker, _ = Worker.objects.get_or_create(
        employee_code="WRK-DEMO-01",
        branch=branch,
        defaults={
            "name": f"Muhammad Aslam {DEMO_TAG}",
            "cnic": "35201-1234567-1",
            "daily_rate": Decimal("1200.00"),
            "department": "Stitching",
            "shift": "Morning",
        },
    )

    # 3. Attendance
    AttendanceRecord.objects.get_or_create(
        worker=worker,
        date=today,
        branch=branch,
        defaults={
            "clock_in": timezone.now().time(),
            "biometric_gate": f"Turnstile North {DEMO_TAG}",
            "status": "On Time",
        },
    )

    # 4. Orders
    orders_data = [
        {"spec": f"100% Combed Cotton Poplin 40x40 {DEMO_TAG}", "qty": 15000, "rate": 320, "days": 10, "status": Order.Status.CONFIRMED},
        {"spec": f"Poly-Viscose Twill 2/2 30x30 {DEMO_TAG}", "qty": 12000, "rate": 285, "days": 14, "status": Order.Status.WEAVING},
        {"spec": f"Lawn Digital Print Greige 60x60 {DEMO_TAG}", "qty": 20000, "rate": 210, "days": -2, "status": Order.Status.DYEING},
    ]
    created_orders = []
    for od in orders_data:
        order, _ = Order.objects.get_or_create(
            client=client,
            fabric_spec=od["spec"],
            branch=branch,
            defaults={
                "quantity_meters": od["qty"],
                "rate_per_meter": od["rate"],
                "delivery_date": today + timedelta(days=int(od["days"])),
                "status": od["status"],
                "remarks": f"{DEMO_TAG} Sample bulk export order",
            },
        )
        created_orders.append(order)

    # 5. Production Lots across stages
    stages = [
        ("LOT-LF-101", "YARN", "Combed 40/1 Cotton Ring Spun", 15000, 15000, "Optimal"),
        ("LOT-LF-102", "WEAVING", "Airjet Weave 40x40 Poplin", 15000, 8400, "Optimal"),
        ("LOT-LF-103", "GREY_INSPECT", "Greige Fabric 60x60 Lawn", 20000, 20000, "Optimal"),
        ("LOT-LF-104", "DYEING", "Reactive Dye Jet Reactive Navy", 12000, 6000, "Delayed: Chem Supply"),
        ("LOT-LF-105", "PRINTING", "8-Colour Rotary Print Floral", 10000, 4500, "Optimal"),
        ("LOT-LF-106", "CUTTING", "Laser Pattern Cut Mens Shirt", 8000, 7200, "Optimal"),
        ("LOT-LF-107", "STITCHING", "Collar & Cuff Stitching", 8000, 5200, "Delayed: Needle Issue"),
        ("LOT-LF-108", "PACKING", "Carton Packing & Barcode Scan", 5000, 4800, "Optimal"),
        ("LOT-LF-109", "DISPATCH", "Container Loading 40ft HQ", 5000, 5000, "Optimal"),
    ]
    created_lots = []
    for lot_no, stg, spec, target, produced, st in stages:
        lot, _ = ProductionLot.objects.get_or_create(
            lot_number=f"{lot_no}-{DEMO_TAG}",
            branch=branch,
            defaults={
                "order": created_orders[0] if created_orders else None,
                "client_name": client.name,
                "fabric_spec": f"{spec} {DEMO_TAG}",
                "stage": stg,
                "target_meters": target,
                "produced_meters": produced,
                "loom_number": "AJ-08",
                "supervisor_name": f"Haji Farooq {DEMO_TAG}",
                "efficiency_percent": 93,
                "status": st,
            },
        )
        created_lots.append(lot)

    # 6. Output Entries today
    if created_lots:
        OutputEntry.objects.get_or_create(
            bundle_id=f"BNDL-DEMO-01",
            operation_id="OP-STITCH-01",
            worker=worker,
            branch=branch,
            defaults={
                "lot": created_lots[6],
                "operation_name": "Main Seam Stitching",
                "channel": EntryChannel.SUPERVISOR_WEB,
                "qty_good": 450,
                "qty_reject": 8,
                "reject_reason": "Broken thread",
                "unit_rate": Decimal("18.00"),
                "earnings_preview": Decimal("8100.00"),
                "occurred_at": timezone.now(),
                "status": OutputEntry.Status.APPROVED,
            },
        )

    # 7. Invoices
    inv_data = [
        ("INV-LF-DEMO-01", 3800000, 15, Invoice.Status.PENDING),
        ("INV-LF-DEMO-02", 2450000, -8, Invoice.Status.OVERDUE),
        ("INV-LF-DEMO-03", 5600000, 28, Invoice.Status.PAID),
    ]
    for inv_no, amt, days, st in inv_data:
        Invoice.objects.get_or_create(
            number=inv_no,
            branch=branch,
            defaults={
                "order": created_orders[0] if created_orders else None,
                "client_name": f"Gul Ahmed Mills {DEMO_TAG}",
                "subtotal": Decimal(amt),
                "sales_tax": Decimal(amt) * Decimal("0.18"),
                "withholding_tax": Decimal(amt) * Decimal("0.01"),
                "net_payable": Decimal(amt) * Decimal("1.18"),
                "due_date": today + timedelta(days=days),
                "status": st,
            },
        )

    # 8. QC Audits
    QCAudit.objects.get_or_create(
        audit_number=f"QC-DEMO-01",
        branch=branch,
        defaults={
            "fabric_spec": f"Poplin 40x40 {DEMO_TAG}",
            "roll_number": "R-104",
            "inspected_meters": 120,
            "warp_streak": 1,
            "slub": 0,
            "hole": 0,
            "shade_var": 0,
            "oil_stain": 0,
            "result": "Pass - Grade A",
            "auditor_name": f"Kashif Ali {DEMO_TAG}",
        },
    )

    return {"status": "success", "message": "Demo data loaded successfully."}


def wipe_demo_data(branch: Branch) -> dict:
    """Clean up all records containing the [DEMO] tag."""
    deleted_counts = {}

    del_output, _ = OutputEntry.objects.filter(bundle_id__contains="DEMO", branch=branch).delete()
    deleted_counts["output_entries"] = del_output

    del_qc, _ = QCAudit.objects.filter(audit_number__contains="DEMO", branch=branch).delete()
    deleted_counts["qc_audits"] = del_qc

    del_inv, _ = Invoice.objects.filter(number__contains="DEMO", branch=branch).delete()
    deleted_counts["invoices"] = del_inv

    del_lot, _ = ProductionLot.objects.filter(lot_number__contains="DEMO", branch=branch).delete()
    deleted_counts["lots"] = del_lot

    del_orders, _ = Order.objects.filter(fabric_spec__contains=DEMO_TAG, branch=branch).delete()
    deleted_counts["orders"] = del_orders

    del_att, _ = AttendanceRecord.objects.filter(biometric_gate__contains=DEMO_TAG, branch=branch).delete()
    deleted_counts["attendance"] = del_att

    del_wrk, _ = Worker.objects.filter(employee_code__contains="DEMO", branch=branch).delete()
    deleted_counts["workers"] = del_wrk

    del_client, _ = Client.objects.filter(name__contains=DEMO_TAG, branch=branch).delete()
    deleted_counts["clients"] = del_client

    return {"status": "success", "message": "Demo data wiped cleanly.", "deleted": deleted_counts}
