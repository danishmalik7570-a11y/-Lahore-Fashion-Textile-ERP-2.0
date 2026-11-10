"""
Seeds high-quality, pixel-accurate default print templates (JSON schemas + compiled Jinja2 HTML/CSS)
for textile ERP documents across Sales, Logistics, Finance, HR, Production, and Inventory.
"""
import json
from django.core.management.base import BaseCommand
from apps.printing.models import DocumentType, PaperPreset, PrintTemplate, TemplateVersion
from apps.printing.services.sandboxed_renderer import SandboxedRendererService


class Command(BaseCommand):
    help = "Seeds default print templates for textile ERP documents"

    def handle(self, *args, **options):
        # 1. Invoice Default Template (A4)
        self._seed_template(
            doc_type_code="INVOICE",
            name="Modern Formal Tax Invoice (A4)",
            language="en",
            paper_preset_code="A4",
            orientation="portrait",
            schema_json={
                "elements": [
                    {"type": "heading", "x": 12, "y": 10, "w": 186, "h": 22, "title": "TAX / SALES INVOICE", "subtitle": "Sales Tax Registered Under Sales Tax Act 1990"},
                    {"type": "company_block", "x": 12, "y": 34, "w": 90, "h": 28},
                    {"type": "doc_meta", "x": 110, "y": 34, "w": 88, "h": 28},
                    {"type": "party_block", "x": 12, "y": 66, "w": 186, "h": 26},
                    {
                        "type": "table",
                        "x": 12, "y": 96, "w": 186,
                        "collection": "items",
                        "columns": [
                            {"field": "line_no", "header": "Sr#", "width": "6%", "align": "center"},
                            {"field": "code", "header": "Item Code", "width": "14%", "align": "left"},
                            {"field": "description", "header": "Description & Specs", "width": "36%", "align": "left"},
                            {"field": "qty", "header": "Qty", "width": "10%", "align": "right"},
                            {"field": "uom", "header": "UoM", "width": "8%", "align": "center"},
                            {"field": "rate", "header": "Rate (PKR)", "width": "12%", "align": "right", "format": "money"},
                            {"field": "amount", "header": "Amount (PKR)", "width": "14%", "align": "right", "format": "money"}
                        ]
                    },
                    {"type": "totals_block", "x": 110, "y": 190, "w": 88, "h": 40},
                    {"type": "words_block", "x": 12, "y": 190, "w": 94, "h": 24},
                    {"type": "bank_block", "x": 12, "y": 218, "w": 94, "h": 28},
                    {"type": "signatures", "x": 12, "y": 252, "w": 186, "h": 22, "boxes": ["Prepared By", "Checked By", "Authorised Signatory", "Receiver Ack"]},
                    {"type": "qr_verify", "x": 170, "y": 224, "w": 28, "h": 28}
                ]
            },
            change_note="Initial system default tax invoice template with bilingual amount in words and QR"
        )

        # 2. Delivery Challan (A4 / Half-A4)
        self._seed_template(
            doc_type_code="DELIVERY_CHALLAN",
            name="Delivery Challan & Dispatch POD",
            language="en",
            paper_preset_code="A4",
            orientation="portrait",
            schema_json={
                "elements": [
                    {"type": "heading", "x": 12, "y": 10, "w": 186, "h": 20, "title": "DELIVERY CHALLAN", "subtitle": "Goods Dispatch Note & Proof of Delivery (POD)"},
                    {"type": "company_block", "x": 12, "y": 32, "w": 90, "h": 26},
                    {"type": "doc_meta", "x": 110, "y": 32, "w": 88, "h": 26},
                    {"type": "party_block", "x": 12, "y": 62, "w": 186, "h": 24},
                    {
                        "type": "table",
                        "x": 12, "y": 90, "w": 186,
                        "collection": "items",
                        "columns": [
                            {"field": "line_no", "header": "#", "width": "6%", "align": "center"},
                            {"field": "lot_no", "header": "Lot / Batch", "width": "16%", "align": "left"},
                            {"field": "description", "header": "Fabric Quality / Goods Description", "width": "42%", "align": "left"},
                            {"field": "rolls_count", "header": "Rolls/Bags", "width": "12%", "align": "center"},
                            {"field": "qty", "header": "Dispatched Qty", "width": "14%", "align": "right"},
                            {"field": "uom", "header": "UoM", "width": "10%", "align": "center"}
                        ]
                    },
                    {"type": "transport_block", "x": 12, "y": 185, "w": 186, "h": 22},
                    {"type": "terms_block", "x": 12, "y": 210, "w": 186, "h": 26},
                    {"type": "signatures", "x": 12, "y": 242, "w": 186, "h": 24, "boxes": ["Prepared By", "Store Incharge", "Driver / Transporter", "Customer Receiver (Stamp & Sign)"]}
                ]
            },
            change_note="Standard delivery challan with transport block and POD receiver acknowledgment"
        )

        # 3. Gate Pass OUT (Half-A4 / A5 Landscape)
        self._seed_template(
            doc_type_code="GATE_PASS_OUT",
            name="Gate Pass — Material OUT (A5 Landscape)",
            language="en",
            paper_preset_code="HALF_A4",
            orientation="landscape",
            schema_json={
                "elements": [
                    {"type": "heading", "x": 8, "y": 6, "w": 194, "h": 16, "title": "SECURITY GATE PASS (MATERIAL OUT)", "subtitle": "Mill Exit Clearance Slip • Original"},
                    {"type": "company_block", "x": 8, "y": 24, "w": 96, "h": 22},
                    {"type": "doc_meta", "x": 108, "y": 24, "w": 94, "h": 22},
                    {
                        "type": "table",
                        "x": 8, "y": 48, "w": 194,
                        "collection": "items",
                        "columns": [
                            {"field": "line_no", "header": "#", "width": "6%", "align": "center"},
                            {"field": "description", "header": "Material / Item Description", "width": "48%", "align": "left"},
                            {"field": "qty", "header": "Quantity", "width": "14%", "align": "right"},
                            {"field": "uom", "header": "UoM", "width": "10%", "align": "center"},
                            {"field": "remarks", "header": "Returnable / Remarks", "width": "22%", "align": "left"}
                        ]
                    },
                    {"type": "transport_block", "x": 8, "y": 105, "w": 194, "h": 18},
                    {"type": "signatures", "x": 8, "y": 125, "w": 194, "h": 18, "boxes": ["Store Incharge", "Approved By", "Driver Signature", "Security Officer Out-Time"]}
                ]
            },
            change_note="Compact Half-A4 Gate Pass with security out-time verification"
        )

        # 4. Cash / Bank Payment Receipt (Half-A4)
        self._seed_template(
            doc_type_code="RECEIPT",
            name="Official Payment Receipt (Half-A4)",
            language="en",
            paper_preset_code="HALF_A4",
            orientation="landscape",
            schema_json={
                "elements": [
                    {"type": "heading", "x": 8, "y": 6, "w": 194, "h": 16, "title": "OFFICIAL PAYMENT RECEIPT", "subtitle": "Commercial Accounts Receipt"},
                    {"type": "company_block", "x": 8, "y": 24, "w": 96, "h": 22},
                    {"type": "doc_meta", "x": 108, "y": 24, "w": 94, "h": 22},
                    {"type": "party_block", "x": 8, "y": 48, "w": 194, "h": 22},
                    {"type": "receipt_allocation", "x": 8, "y": 72, "w": 194, "h": 32},
                    {"type": "words_block", "x": 8, "y": 106, "w": 120, "h": 18},
                    {"type": "signatures", "x": 8, "y": 126, "w": 194, "h": 18, "boxes": ["Cashier / Accounts Officer", "Authorized Signatory", "Company Stamp"]}
                ]
            },
            change_note="Formal receipt with invoice allocation breakdown and stamp box"
        )

        # 5. Customer Ledger Statement (A4)
        self._seed_template(
            doc_type_code="STATEMENT",
            name="Party Account Statement & Aging (A4)",
            language="en",
            paper_preset_code="A4",
            orientation="portrait",
            schema_json={
                "elements": [
                    {"type": "heading", "x": 12, "y": 10, "w": 186, "h": 20, "title": "STATEMENT OF ACCOUNT", "subtitle": "Transactional Ledger Summary & Aging Analysis"},
                    {"type": "company_block", "x": 12, "y": 32, "w": 90, "h": 26},
                    {"type": "doc_meta", "x": 110, "y": 32, "w": 88, "h": 26},
                    {"type": "party_block", "x": 12, "y": 60, "w": 186, "h": 24},
                    {
                        "type": "table",
                        "x": 12, "y": 88, "w": 186,
                        "collection": "ledger.lines",
                        "columns": [
                            {"field": "date", "header": "Date", "width": "12%", "align": "center"},
                            {"field": "ref_no", "header": "Voucher / Inv #", "width": "16%", "align": "left"},
                            {"field": "narration", "header": "Particulars / Narration", "width": "34%", "align": "left"},
                            {"field": "debit", "header": "Debit (PKR)", "width": "12%", "align": "right", "format": "money"},
                            {"field": "credit", "header": "Credit (PKR)", "width": "12%", "align": "right", "format": "money"},
                            {"field": "balance", "header": "Balance (PKR)", "width": "14%", "align": "right", "format": "money"}
                        ]
                    },
                    {"type": "aging_box", "x": 12, "y": 215, "w": 186, "h": 24},
                    {"type": "signatures", "x": 12, "y": 248, "w": 186, "h": 22, "boxes": ["Prepared By Accounts", "Checked By CFO", "Customer Acknowledgment (Sign & Stamp)"]}
                ]
            },
            change_note="Full party statement with running balance, aging buckets (0-30, 31-60, 61-90, 90+ days)"
        )

        # 6. Monthly Employee Payslip (A5 Portrait)
        self._seed_template(
            doc_type_code="PAYSLIP",
            name="Confidential Employee Payslip (A5)",
            language="en",
            paper_preset_code="A5",
            orientation="portrait",
            schema_json={
                "elements": [
                    {"type": "heading", "x": 8, "y": 8, "w": 132, "h": 16, "title": "SALARY PAYSLIP", "subtitle": "Strictly Private & Confidential"},
                    {"type": "company_block", "x": 8, "y": 26, "w": 70, "h": 20},
                    {"type": "doc_meta", "x": 80, "y": 26, "w": 60, "h": 20},
                    {"type": "employee_block", "x": 8, "y": 48, "w": 132, "h": 24},
                    {"type": "attendance_summary", "x": 8, "y": 74, "w": 132, "h": 16},
                    {"type": "salary_tables", "x": 8, "y": 92, "w": 132, "h": 60},
                    {"type": "words_block", "x": 8, "y": 154, "w": 132, "h": 16},
                    {"type": "signatures", "x": 8, "y": 172, "w": 132, "h": 18, "boxes": ["HR Officer", "Worker Acknowledgment"]}
                ]
            },
            change_note="Compact A5 bilingual payslip with earnings, deductions, overtime, and net pay in words"
        )

        # 7. Production Order / Job Card (A4)
        self._seed_template(
            doc_type_code="JOB_CARD",
            name="Production Order & PPC Route Sheet (A4)",
            language="en",
            paper_preset_code="A4",
            orientation="portrait",
            schema_json={
                "elements": [
                    {"type": "heading", "x": 12, "y": 10, "w": 186, "h": 20, "title": "PRODUCTION JOB CARD", "subtitle": "Planning & Production Control (PPC) Route Card"},
                    {"type": "company_block", "x": 12, "y": 32, "w": 90, "h": 24},
                    {"type": "doc_meta", "x": 110, "y": 32, "w": 88, "h": 24},
                    {"type": "job_specs", "x": 12, "y": 58, "w": 186, "h": 28},
                    {"type": "process_checklist", "x": 12, "y": 88, "w": 186, "h": 85},
                    {"type": "bom_table", "x": 12, "y": 176, "w": 186, "h": 60},
                    {"type": "signatures", "x": 12, "y": 245, "w": 186, "h": 22, "boxes": ["PPC Planning Incharge", "Shed Master / Supervisor", "Quality Incharge"]}
                ]
            },
            change_note="PPC job card with stage-by-stage check-boxes from yarn warping to final packing"
        )

        # 8. Bundle QR Ticket (75 x 50 mm Label)
        self._seed_template(
            doc_type_code="BUNDLE_TICKET",
            name="Stitching Bundle QR Ticket (75x50 mm)",
            language="en",
            paper_preset_code="LABEL_75X50",
            orientation="landscape",
            schema_json={
                "elements": [
                    {"type": "heading", "x": 2, "y": 2, "w": 71, "h": 8, "title": "LAHORE FASHION • BUNDLE TICKET"},
                    {"type": "qr_verify", "x": 47, "y": 11, "w": 25, "h": 25},
                    {"type": "field", "x": 3, "y": 12, "w": 42, "h": 5, "label": "Bundle ID", "value": "{{ doc.number }}"},
                    {"type": "field", "x": 3, "y": 18, "w": 42, "h": 5, "label": "Lot / Style", "value": "{{ party.name }}"},
                    {"type": "field", "x": 3, "y": 24, "w": 20, "h": 5, "label": "Size", "value": "Medium (M)"},
                    {"type": "field", "x": 24, "y": 24, "w": 21, "h": 5, "label": "Color", "value": "Navy Blue"},
                    {"type": "field", "x": 3, "y": 30, "w": 20, "h": 5, "label": "Qty", "value": "20 Pcs"},
                    {"type": "field", "x": 24, "y": 30, "w": 21, "h": 5, "label": "Rate", "value": "PKR 22.50"},
                    {"type": "barcode", "x": 3, "y": 38, "w": 69, "h": 9}
                ]
            },
            change_note="Thermal sticker label for piece-rate stitching bundles with large scannable QR"
        )

        # 9. Weighbridge Slip (Thermal 80mm)
        self._seed_template(
            doc_type_code="WEIGHBRIDGE_SLIP",
            name="Electronic Weighbridge Slip (80mm Thermal)",
            language="en",
            paper_preset_code="THERMAL_80MM",
            orientation="portrait",
            schema_json={
                "elements": [
                    {"type": "heading", "x": 2, "y": 2, "w": 76, "h": 12, "title": "WEIGHBRIDGE SLIP", "subtitle": "Gross / Tare / Net Weight Certificate"},
                    {"type": "company_block", "x": 2, "y": 15, "w": 76, "h": 14},
                    {"type": "field", "x": 2, "y": 30, "w": 76, "h": 5, "label": "Slip #", "value": "{{ doc.number }}"},
                    {"type": "field", "x": 2, "y": 36, "w": 76, "h": 5, "label": "Date / Time", "value": "{{ doc.date }}"},
                    {"type": "field", "x": 2, "y": 42, "w": 76, "h": 5, "label": "Vehicle #", "value": "LES-8842 (10-Wheeler)"},
                    {"type": "field", "x": 2, "y": 48, "w": 76, "h": 5, "label": "Party", "value": "{{ party.name }}"},
                    {"type": "field", "x": 2, "y": 54, "w": 76, "h": 5, "label": "Material", "value": "Raw Raw Cotton Bales (Grade A)"},
                    {"type": "divider", "x": 2, "y": 60, "w": 76, "h": 1},
                    {"type": "field", "x": 2, "y": 62, "w": 76, "h": 6, "label": "GROSS WEIGHT", "value": "24,850 KG"},
                    {"type": "field", "x": 2, "y": 69, "w": 76, "h": 6, "label": "TARE WEIGHT", "value": "9,420 KG"},
                    {"type": "field", "x": 2, "y": 76, "w": 76, "h": 7, "label": "NET WEIGHT", "value": "15,430 KG"},
                    {"type": "divider", "x": 2, "y": 84, "w": 76, "h": 1},
                    {"type": "qr_verify", "x": 25, "y": 87, "w": 30, "h": 30},
                    {"type": "signatures", "x": 2, "y": 120, "w": 76, "h": 14, "boxes": ["Weighbridge Operator", "Driver Sign"]}
                ]
            },
            change_note="Continuous roll thermal weighbridge ticket with gross-tare-net calculation"
        )

        self.stdout.write(self.style.SUCCESS("All core default print templates successfully seeded!"))

    def _seed_template(self, doc_type_code: str, name: str, language: str, paper_preset_code: str, orientation: str, schema_json: dict, change_note: str):
        try:
            doc_type = DocumentType.objects.get(code=doc_type_code)
            preset = PaperPreset.objects.get(code=paper_preset_code)
        except (DocumentType.DoesNotExist, PaperPreset.DoesNotExist) as e:
            self.stdout.write(self.style.WARNING(f"Skipping {name}: {e}"))
            return

        template_margins = preset.default_margins or {"top": 10, "right": 10, "bottom": 10, "left": 10}

        template, created = PrintTemplate.objects.update_or_create(
            doc_type=doc_type,
            name=name,
            defaults={
                "paper_preset": preset,
                "language": language,
                "orientation": orientation,
                "margins": template_margins,
                "status": "ACTIVE",
                "is_default": True,
                "current_version_no": 1
            }
        )

        # Generate Jinja2 HTML/CSS from schema
        renderer = SandboxedRendererService()
        html_jinja = renderer.compile_schema_to_html(schema_json)
        css = renderer.generate_print_css(
            page_width_mm=preset.width_mm,
            page_height_mm=preset.height_mm,
            margins_mm=template_margins,
            is_continuous=preset.is_continuous
        )

        version, v_created = TemplateVersion.objects.update_or_create(
            template=template,
            version_no=1,
            defaults={
                "schema_json": schema_json,
                "html_jinja": html_jinja,
                "css": css,
                "change_note": change_note
            }
        )

        action = "Created" if created else "Updated"
        self.stdout.write(self.style.SUCCESS(f"{action} default template for {doc_type_code} (v{version.version_no})"))
