"""
Management command: seed_demo
Seeds the database with comprehensive textile demo data for all phases:
Clients, Orders, Production Lots, Inventory, QC Audits, Workers, Attendance, Delivery, Invoices, Settings.
Usage: python manage.py seed_demo [--reset]
"""
from django.core.management.base import BaseCommand
from django.db import transaction
from decimal import Decimal
import datetime

class Command(BaseCommand):
    help = "Seed the database with comprehensive textile ERP demo data across all phases."

    def add_arguments(self, parser):
        parser.add_argument(
            "--reset",
            action="store_true",
            help="Delete all existing data before seeding.",
        )

    def handle(self, *args, **options):
        if options["reset"]:
            self.stdout.write(self.style.WARNING("[!] Resetting database..."))
            self._reset()

        self.stdout.write("[*] Seeding demo data across all ERP phases...")
        with transaction.atomic():
            self._seed_branches()
            self._seed_roles()
            self._seed_users()
            self._seed_clients()
            self._seed_orders()
            self._seed_production()
            self._seed_inventory()
            self._seed_quality()
            self._seed_workers()
            self._seed_attendance()
            self._seed_delivery()
            self._seed_finance()
            self._seed_settings()

        self.stdout.write(self.style.SUCCESS("[OK] All ERP phases seeded successfully!"))
        self.stdout.write("   Super Admin: owner@lahorefashion.com / ChangeMe@12345")

    def _reset(self):
        from django.apps import apps
        from django.db import connection
        for model in apps.get_models():
            if model._meta.app_label in (
                "clients", "orders", "production", "inventory", "quality",
                "labour", "attendance", "delivery", "finance", "settings_app"
            ):
                try:
                    model.objects.all().delete()
                except Exception:
                    pass

    def _seed_branches(self):
        from apps.branches.models import Branch
        branches_data = [
            {"code": "LHR", "name": "Lahore Head Office & Weaving", "city": "Lahore", "is_head_office": True,
             "address": "Plot 42-A, Sundar Industrial Estate, Raiwind Road, Lahore", "phone": "+92-42-35761234"},
            {"code": "FSD", "name": "Faisalabad Spinning Mill", "city": "Faisalabad", "is_head_office": False,
             "address": "Millat Industrial Estate, Faisalabad", "phone": "+92-41-8786123"},
            {"code": "MLT", "name": "Multan Cotton Ginning Facility", "city": "Multan", "is_head_office": False,
             "address": "Vehari Road, Industrial Area, Multan", "phone": "+92-61-4587234"},
            {"code": "KHI", "name": "Karachi Export Apparel Complex", "city": "Karachi", "is_head_office": False,
             "address": "Sector 15, Korangi Industrial Area, Karachi", "phone": "+92-21-32561234"},
        ]
        for b in branches_data:
            Branch.objects.get_or_create(code=b["code"], defaults=b)
        self.stdout.write(f"  [+] {len(branches_data)} branches verified")

    def _seed_roles(self):
        from apps.accounts.models import Role, ModulePermission
        roles_data = [
            {"code": "owner", "name": "Owner / Executive", "requires_2fa": False},
            {"code": "super_admin", "name": "Super Admin", "requires_2fa": False},
            {"code": "branch_admin", "name": "Branch Admin", "requires_2fa": False},
            {"code": "production_manager", "name": "Production Manager", "requires_2fa": False},
            {"code": "accountant", "name": "Accountant", "requires_2fa": False},
            {"code": "store_keeper", "name": "Store Keeper", "requires_2fa": False},
            {"code": "qc_inspector", "name": "QC Inspector", "requires_2fa": False},
            {"code": "hr_manager", "name": "HR / Labour Manager", "requires_2fa": False},
            {"code": "supervisor", "name": "Supervisor", "requires_2fa": False},
            {"code": "worker", "name": "Worker", "requires_2fa": False},
        ]
        for r in roles_data:
            role, _ = Role.objects.get_or_create(code=r["code"], defaults=r)
            if r["code"] in ["super_admin", "owner"]:
                for module in ModulePermission.Module.values:
                    ModulePermission.objects.get_or_create(
                        role=role, module=module,
                        defaults={
                            "can_view": True, "can_create": True, "can_edit": True,
                            "can_delete": True, "can_approve": True, "can_export": True,
                        }
                    )
        self.stdout.write(f"  [+] {len(roles_data)} roles configured")

    def _seed_users(self):
        from apps.accounts.models import User, Role, UserRoleBranch
        from apps.branches.models import Branch
        lahore = Branch.objects.get(code="LHR")
        owner_role, _ = Role.objects.get_or_create(code="owner", defaults={"name": "Owner / Executive", "requires_2fa": False})
        super_admin_role, _ = Role.objects.get_or_create(code="super_admin", defaults={"name": "Super Admin", "requires_2fa": False})

        # 1. Primary Owner Account
        user1, created1 = User.objects.get_or_create(
            email="owner@lahorefashion.com",
            defaults={
                "name": "Mian Tariq (Owner & CEO)",
                "is_staff": True,
                "is_superuser": True,
                "is_active": True,
                "default_branch": lahore,
                "employee_id": "LF-0001",
            }
        )
        if created1:
            user1.set_password("ChangeMe@12345")
            user1.save()

        # 2. Secondary Owner Account (requirement A.5: Keep at least 2 accounts holding owner/super_admin)
        user2, created2 = User.objects.get_or_create(
            email="executive.director@lahorefashion.com",
            defaults={
                "name": "Mian Bilal (Executive Director)",
                "is_staff": True,
                "is_superuser": True,
                "is_active": True,
                "default_branch": lahore,
                "employee_id": "LF-0002",
            }
        )
        if created2:
            user2.set_password("ChangeMe@12345")
            user2.save()

        for branch in Branch.objects.all():
            UserRoleBranch.objects.get_or_create(
                user=user1, role=owner_role, branch=branch,
                defaults={"is_active": True}
            )
            UserRoleBranch.objects.get_or_create(
                user=user1, role=super_admin_role, branch=branch,
                defaults={"is_active": True}
            )
            UserRoleBranch.objects.get_or_create(
                user=user2, role=owner_role, branch=branch,
                defaults={"is_active": True}
            )
        self.stdout.write("  [+] Verified at least 2 Owner / Super Admin accounts:")
        self.stdout.write("      - owner@lahorefashion.com / ChangeMe@12345")
        self.stdout.write("      - executive.director@lahorefashion.com / ChangeMe@12345")

    def _seed_clients(self):
        from apps.clients.models import Client
        from apps.branches.models import Branch
        lhr = Branch.objects.get(code="LHR")
        clients_data = [
            {"name": "Khaadi Apparel", "brand_type": "Retail Fashion", "city": "Karachi", "ntn": "2849102-4", "strn": "1700284910219", "credit_limit": Decimal("35000000"), "current_balance": Decimal("14200000"), "contact_person": "Tariq Mehmood (VP Sourcing)", "phone": "+92 300 8472911", "email": "sourcing@khaadi.com"},
            {"name": "Sapphire Retail", "brand_type": "Denim Apparel", "city": "Lahore", "ntn": "1940291-7", "strn": "1700194029115", "credit_limit": Decimal("40000000"), "current_balance": Decimal("18450000"), "contact_person": "Bilal Chaudhry", "phone": "+92 321 4455882", "email": "b.chaudhry@sapphire.pk"},
            {"name": "J. Junaid Jamshed", "brand_type": "Retail Fashion", "city": "Karachi", "ntn": "3349182-1", "strn": "1700334918214", "credit_limit": Decimal("25000000"), "current_balance": Decimal("9620000"), "contact_person": "Faizan Sheikh", "phone": "+92 301 9283741", "email": "merch@jjunaidjamshed.com"},
            {"name": "Gul Ahmed Intl", "brand_type": "Home Textile", "city": "Karachi", "ntn": "0812934-8", "strn": "1700081293411", "credit_limit": Decimal("30000000"), "current_balance": Decimal("5100000"), "contact_person": "Asadullah Khan", "phone": "+92 333 7162534", "email": "procurement@gulahmed.com"},
            {"name": "Nishat Linen", "brand_type": "Home Textile", "city": "Lahore", "ntn": "0719283-5", "strn": "1700071928318", "credit_limit": Decimal("35000000"), "current_balance": Decimal("10080000"), "contact_person": "Hamza Mansha", "phone": "+92 300 5544332", "email": "orders@nishatlinen.com"},
            {"name": "Alkaram Studio", "brand_type": "Retail Fashion", "city": "Karachi", "ntn": "2194820-3", "strn": "1700219482012", "credit_limit": Decimal("20000000"), "current_balance": Decimal("3800000"), "contact_person": "Salman Alkaram", "phone": "+92 322 8192837", "email": "textiles@alkaram.com"},
        ]
        for c in clients_data:
            Client.objects.get_or_create(name=c["name"], branch=lhr, defaults=c)
        self.stdout.write(f"  [+] {len(clients_data)} client brands seeded (Phase 3)")

    def _seed_orders(self):
        from apps.orders.models import Order
        from apps.clients.models import Client
        from apps.branches.models import Branch
        lhr = Branch.objects.get(code="LHR")
        orders_data = [
            {"number": "PO-LF-2026-8841", "client_name": "Khaadi Apparel", "fabric_spec": "Lawn Printed Kurti 80/80", "construction": "80x80 / 100x90 40s Cotton", "quantity_meters": Decimal("24000"), "rate_per_meter": Decimal("285"), "delivery_date": datetime.date(2026, 11, 15), "status": "Printing"},
            {"number": "PO-LF-2026-8840", "client_name": "Sapphire Retail", "fabric_spec": "Stretch Denim Twill 11.5oz", "construction": "10s x 70D / 68x42 Indigo", "quantity_meters": Decimal("45000"), "rate_per_meter": Decimal("410"), "delivery_date": datetime.date(2026, 11, 30), "status": "Weaving"},
            {"number": "PO-LF-2026-8839", "client_name": "J. Junaid Jamshed", "fabric_spec": "Luxury Jacquard Kurta Suiting", "construction": "60s x 60s / 120x80 Dobby", "quantity_meters": Decimal("18500"), "rate_per_meter": Decimal("520"), "delivery_date": datetime.date(2026, 11, 8), "status": "Dyeing"},
            {"number": "PO-LF-2026-8838", "client_name": "Gul Ahmed Intl", "fabric_spec": "Cotton Pique Knit Polo", "construction": "30s Combed Cotton Knit 220 GSM", "quantity_meters": Decimal("15000"), "rate_per_meter": Decimal("340"), "delivery_date": datetime.date(2026, 11, 20), "status": "Confirmed"},
            {"number": "PO-LF-2026-8837", "client_name": "Nishat Linen", "fabric_spec": "Percale Bedding 300TC", "construction": "40s x 40s / 150x150 Combed", "quantity_meters": Decimal("32000"), "rate_per_meter": Decimal("315"), "delivery_date": datetime.date(2026, 11, 10), "status": "Packing"},
        ]
        for o in orders_data:
            client = Client.objects.filter(name=o["client_name"]).first()
            if client:
                Order.objects.get_or_create(
                    number=o["number"],
                    branch=lhr,
                    defaults={
                        "client": client,
                        "fabric_spec": o["fabric_spec"],
                        "construction": o["construction"],
                        "quantity_meters": o["quantity_meters"],
                        "rate_per_meter": o["rate_per_meter"],
                        "delivery_date": o["delivery_date"],
                        "status": o["status"],
                    }
                )
        self.stdout.write(f"  [+] {len(orders_data)} orders seeded (Phase 4)")

    def _seed_production(self):
        from apps.production.models import ProductionLot
        from apps.orders.models import Order
        from apps.branches.models import Branch
        lhr = Branch.objects.get(code="LHR")
        lots_data = [
            {"lot_number": "LOT-LF-8841", "order_number": "PO-LF-2026-8841", "client_name": "Khaadi Apparel", "fabric_spec": "Lawn Printed Kurti 80/80", "stage": "PRINTING", "target_meters": Decimal("24000"), "produced_meters": Decimal("19500"), "loom_number": "PRINT-RO-02", "supervisor_name": "Ustad Shaukat", "efficiency_percent": 94},
            {"lot_number": "LOT-LF-8840", "order_number": "PO-LF-2026-8840", "client_name": "Sapphire Retail", "fabric_spec": "Stretch Denim Twill 11.5oz", "stage": "WEAVING", "target_meters": Decimal("45000"), "produced_meters": Decimal("31200"), "loom_number": "PICANOL-LM-14", "supervisor_name": "Rana Mumtaz", "efficiency_percent": 96},
            {"lot_number": "LOT-LF-8839", "order_number": "PO-LF-2026-8839", "client_name": "J. Junaid Jamshed", "fabric_spec": "Luxury Jacquard Kurta", "stage": "DYEING", "target_meters": Decimal("18500"), "produced_meters": Decimal("14200"), "loom_number": "JET-DYE-03", "supervisor_name": "Irfan Cheema", "efficiency_percent": 90},
            {"lot_number": "LOT-LF-8838", "order_number": "PO-LF-2026-8838", "client_name": "Gul Ahmed Intl", "fabric_spec": "Cotton Pique Polo", "stage": "WEAVING", "target_meters": Decimal("15000"), "produced_meters": Decimal("8400"), "loom_number": "CIRC-KNIT-06", "supervisor_name": "Nadeem Akhtar", "efficiency_percent": 92},
            {"lot_number": "LOT-LF-8837", "order_number": "PO-LF-2026-8837", "client_name": "Nishat Linen", "fabric_spec": "Percale Bedding 300TC", "stage": "PACKING", "target_meters": Decimal("32000"), "produced_meters": Decimal("31800"), "loom_number": "FIN-PACK-01", "supervisor_name": "Bashir Ahmed", "efficiency_percent": 98},
        ]
        for l in lots_data:
            order = Order.objects.filter(number=l["order_number"]).first()
            ProductionLot.objects.get_or_create(
                lot_number=l["lot_number"],
                branch=lhr,
                defaults={
                    "order": order,
                    "client_name": l["client_name"],
                    "fabric_spec": l["fabric_spec"],
                    "stage": l["stage"],
                    "target_meters": l["target_meters"],
                    "produced_meters": l["produced_meters"],
                    "loom_number": l["loom_number"],
                    "supervisor_name": l["supervisor_name"],
                    "efficiency_percent": l["efficiency_percent"],
                }
            )
        self.stdout.write(f"  [+] {len(lots_data)} production lots seeded (Phase 5)")

    def _seed_inventory(self):
        from apps.inventory.models import StockItem
        from apps.branches.models import Branch
        lhr = Branch.objects.get(code="LHR")
        items_data = [
            {"code": "YRN-C40-01", "name": "40/1 Combed Cotton Cone Yarn", "category": "Yarn Bobbins", "current_stock": Decimal("24500"), "unit": "kg", "reorder_level": Decimal("8000"), "warehouse_location": "Godown A - Rack 04", "unit_cost": Decimal("850")},
            {"code": "YRN-IND-02", "name": "10s Indigo Ring Spun Yarn", "category": "Yarn Bobbins", "current_stock": Decimal("18200"), "unit": "kg", "reorder_level": Decimal("5000"), "warehouse_location": "Godown A - Rack 12", "unit_cost": Decimal("720")},
            {"code": "FAB-GRY-80", "name": "Grey Lawn Fabric 80x80 Rolls", "category": "Grey Fabric", "current_stock": Decimal("68400"), "unit": "metres", "reorder_level": Decimal("20000"), "warehouse_location": "Godown B - Weave Store", "unit_cost": Decimal("195")},
            {"code": "CHM-REC-BL", "name": "Reactive Blue RGB Dye Granules", "category": "Dyes & Chemicals", "current_stock": Decimal("3200"), "unit": "kg", "reorder_level": Decimal("1000"), "warehouse_location": "Chemical Vault #01", "unit_cost": Decimal("2400")},
            {"code": "CHM-HYD-01", "name": "Sodium Hydrosulfite (Hydro)", "category": "Dyes & Chemicals", "current_stock": Decimal("5400"), "unit": "kg", "reorder_level": Decimal("1500"), "warehouse_location": "Chemical Vault #02", "unit_cost": Decimal("420")},
            {"code": "FAB-DNM-11", "name": "Finished Stretch Denim 11.5oz", "category": "Finished Fabric", "current_stock": Decimal("28500"), "unit": "metres", "reorder_level": Decimal("10000"), "warehouse_location": "Godown C - Dispatch", "unit_cost": Decimal("380")},
        ]
        for it in items_data:
            StockItem.objects.get_or_create(code=it["code"], branch=lhr, defaults=it)
        self.stdout.write(f"  [+] {len(items_data)} inventory stock items seeded (Phase 6)")

    def _seed_quality(self):
        from apps.quality.models import QCAudit
        from apps.production.models import ProductionLot
        from apps.branches.models import Branch
        lhr = Branch.objects.get(code="LHR")
        audits_data = [
            {"audit_number": "QC-LF-2026-0491", "lot_number_text": "LOT-LF-8841", "fabric_spec": "Lawn Printed Kurti 80/80", "roll_number": "ROLL-084", "inspected_meters": Decimal("120"), "warp_streak": 1, "slub": 2, "hole": 0, "shade_var": 0, "oil_stain": 1, "auditor_name": "M. Kashif (Senior QC)"},
            {"audit_number": "QC-LF-2026-0490", "lot_number_text": "LOT-LF-8840", "fabric_spec": "Stretch Denim Twill 11.5oz", "roll_number": "ROLL-119", "inspected_meters": Decimal("150"), "warp_streak": 2, "slub": 3, "hole": 0, "shade_var": 1, "oil_stain": 0, "auditor_name": "M. Kashif (Senior QC)"},
            {"audit_number": "QC-LF-2026-0489", "lot_number_text": "LOT-LF-8839", "fabric_spec": "Luxury Jacquard Kurta", "roll_number": "ROLL-052", "inspected_meters": Decimal("100"), "warp_streak": 5, "slub": 4, "hole": 1, "shade_var": 2, "oil_stain": 2, "auditor_name": "Tanveer Sajjad"},
        ]
        for a in audits_data:
            lot = ProductionLot.objects.filter(lot_number=a["lot_number_text"]).first()
            QCAudit.objects.get_or_create(
                audit_number=a["audit_number"],
                branch=lhr,
                defaults={
                    "lot": lot,
                    "lot_number_text": a["lot_number_text"],
                    "fabric_spec": a["fabric_spec"],
                    "roll_number": a["roll_number"],
                    "inspected_meters": a["inspected_meters"],
                    "warp_streak": a["warp_streak"],
                    "slub": a["slub"],
                    "hole": a["hole"],
                    "shade_var": a["shade_var"],
                    "oil_stain": a["oil_stain"],
                    "auditor_name": a["auditor_name"],
                }
            )
        self.stdout.write(f"  [+] {len(audits_data)} 4-point QC inspections seeded (Phase 7)")

    def _seed_workers(self):
        from apps.labour.models import Worker
        from apps.branches.models import Branch
        lhr = Branch.objects.get(code="LHR")
        workers_data = [
            {"employee_code": "EMP-LF-104", "name": "Muhammad Yasin", "department": "Weave Shed", "skill_grade": "Master (A+)", "shift": "Shift A (Morning)", "cnic": "35202-1928471-3", "phone": "+92 302 9182736", "daily_rate": Decimal("1950")},
            {"employee_code": "EMP-LF-105", "name": "Ghulam Rasool", "department": "Weave Shed", "skill_grade": "Senior (A)", "shift": "Shift A (Morning)", "cnic": "35201-8273641-5", "phone": "+92 301 8273645", "daily_rate": Decimal("1650")},
            {"employee_code": "EMP-LF-106", "name": "Zahid Hussain", "department": "Dye House", "skill_grade": "Senior (A)", "shift": "Shift A (Morning)", "cnic": "35202-7364521-9", "phone": "+92 321 7364521", "daily_rate": Decimal("1750")},
            {"employee_code": "EMP-LF-107", "name": "Muhammad Shahid", "department": "Rotary Printing", "skill_grade": "Master (A+)", "shift": "Shift B (Evening)", "cnic": "35200-6453721-1", "phone": "+92 333 6453721", "daily_rate": Decimal("2100")},
            {"employee_code": "EMP-LF-108", "name": "Abdul Ghafoor", "department": "QC Inspection", "skill_grade": "Senior (A)", "shift": "Shift A (Morning)", "cnic": "35202-5362718-7", "phone": "+92 300 5362718", "daily_rate": Decimal("1800")},
        ]
        for w in workers_data:
            Worker.objects.get_or_create(employee_code=w["employee_code"], branch=lhr, defaults=w)
        self.stdout.write(f"  [+] {len(workers_data)} workers seeded (Phase 8)")

    def _seed_attendance(self):
        from apps.attendance.models import AttendanceRecord
        from apps.labour.models import Worker
        from apps.branches.models import Branch
        lhr = Branch.objects.get(code="LHR")
        att_data = [
            {"code": "EMP-LF-104", "clock_in": datetime.time(5, 54), "status": "On Time"},
            {"code": "EMP-LF-105", "clock_in": datetime.time(5, 58), "status": "On Time"},
            {"code": "EMP-LF-106", "clock_in": datetime.time(6, 2), "status": "On Time"},
            {"code": "EMP-LF-107", "clock_in": datetime.time(6, 18), "status": "Late"},
            {"code": "EMP-LF-108", "clock_in": datetime.time(5, 50), "status": "On Time"},
        ]
        for at in att_data:
            worker = Worker.objects.filter(employee_code=at["code"]).first()
            if worker:
                AttendanceRecord.objects.get_or_create(
                    worker=worker,
                    date=datetime.date.today(),
                    branch=lhr,
                    defaults={
                        "clock_in": at["clock_in"],
                        "biometric_gate": "Gate #1 Main Turnstile",
                        "status": at["status"]
                    }
                )
        self.stdout.write(f"  [+] {len(att_data)} biometric attendance records seeded (Phase 8)")

    def _seed_delivery(self):
        from apps.delivery.models import DeliveryChallan
        from apps.orders.models import Order
        from apps.branches.models import Branch
        lhr = Branch.objects.get(code="LHR")
        order = Order.objects.filter(number="PO-LF-2026-8837").first()
        if order:
            DeliveryChallan.objects.get_or_create(
                number="DC-LF-2026-0381",
                branch=lhr,
                defaults={
                    "order": order,
                    "client_name": "Nishat Linen",
                    "destination_city": "Lahore (Nishat Mills Emporium)",
                    "vehicle_number": "LES-26-8812",
                    "driver_name": "Rafiq Gujjar",
                    "driver_phone": "+92 300 4829102",
                    "total_rolls": 64,
                    "total_meters": Decimal("31800"),
                    "status": "In Transit"
                }
            )
        self.stdout.write("  [+] Delivery challans and gate passes seeded (Phase 9)")

    def _seed_finance(self):
        from apps.finance.models import Invoice
        from apps.orders.models import Order
        from apps.branches.models import Branch
        lhr = Branch.objects.get(code="LHR")
        order = Order.objects.filter(number="PO-LF-2026-8837").first()
        if order:
            Invoice.objects.get_or_create(
                number="INV-LF-2026-0194",
                branch=lhr,
                defaults={
                    "order": order,
                    "client_name": "Nishat Linen",
                    "subtotal": Decimal("10080000"),
                    "due_date": datetime.date(2026, 11, 21),
                    "status": "Pending"
                }
            )
        self.stdout.write("  [+] Sales tax invoices seeded (Phase 10)")

    def _seed_settings(self):
        from apps.settings_app.models import CompanySetting
        CompanySetting.objects.get_or_create(
            company_name="Lahore Fashion Textile Mills (Pvt) Ltd",
            defaults={
                "address": "Plot 42-A, Sundar Industrial Estate, Raiwind Road, Lahore",
                "ntn": "2849102-4",
                "strn": "1700284910219",
                "currency": "PKR",
                "sales_tax_rate": 18,
                "active_looms": 68,
                "telemetry_broker_url": "wss://mill-telemetry.lahorefashion.com/v1/sensors",
                "whatsapp_enabled": True
            }
        )
        self.stdout.write("  [+] Company enterprise settings seeded (Phase 11)")
