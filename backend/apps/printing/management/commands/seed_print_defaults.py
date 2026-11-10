from decimal import Decimal
from django.core.management.base import BaseCommand
from apps.printing.models import DocumentType, PaperPreset


class Command(BaseCommand):
    help = "Seeds standard paper presets and document types for textile printing format builder"

    def handle(self, *args, **options):
        # 1. Paper Presets
        presets = [
            {"code": "A4", "name": "A4 Standard (210 x 297 mm)", "width_mm": Decimal("210.0"), "height_mm": Decimal("297.0"), "is_continuous": False, "default_margins": {"top": 10, "right": 12, "bottom": 12, "left": 12}},
            {"code": "A5", "name": "A5 Standard (148 x 210 mm)", "width_mm": Decimal("148.0"), "height_mm": Decimal("210.0"), "is_continuous": False, "default_margins": {"top": 8, "right": 8, "bottom": 8, "left": 8}},
            {"code": "A3", "name": "A3 Landscape/Wide (297 x 420 mm)", "width_mm": Decimal("420.0"), "height_mm": Decimal("297.0"), "is_continuous": False, "default_margins": {"top": 12, "right": 15, "bottom": 15, "left": 15}},
            {"code": "HALF_A4", "name": "Half A4 (A5 Landscape Gate/Challan)", "width_mm": Decimal("210.0"), "height_mm": Decimal("148.5"), "is_continuous": False, "default_margins": {"top": 6, "right": 8, "bottom": 6, "left": 8}},
            {"code": "LETTER", "name": "US Letter (8.5 x 11 in)", "width_mm": Decimal("215.9"), "height_mm": Decimal("279.4"), "is_continuous": False, "default_margins": {"top": 10, "right": 12, "bottom": 12, "left": 12}},
            {"code": "LEGAL", "name": "US Legal (8.5 x 14 in)", "width_mm": Decimal("215.9"), "height_mm": Decimal("355.6"), "is_continuous": False, "default_margins": {"top": 10, "right": 12, "bottom": 12, "left": 12}},
            {"code": "THERMAL_80MM", "name": "Thermal 80mm Roll (Gate & Weighbridge)", "width_mm": Decimal("80.0"), "height_mm": None, "is_continuous": True, "default_margins": {"top": 2, "right": 3, "bottom": 2, "left": 3}},
            {"code": "THERMAL_58MM", "name": "Thermal 58mm POS Receipt", "width_mm": Decimal("58.0"), "height_mm": None, "is_continuous": True, "default_margins": {"top": 2, "right": 2, "bottom": 2, "left": 2}},
            {"code": "LABEL_100X150", "name": "Carton / Export Shipping Label (100x150 mm)", "width_mm": Decimal("100.0"), "height_mm": Decimal("150.0"), "is_continuous": False, "default_margins": {"top": 3, "right": 3, "bottom": 3, "left": 3}},
            {"code": "LABEL_100X100", "name": "Fabric Roll QR Tag (100x100 mm)", "width_mm": Decimal("100.0"), "height_mm": Decimal("100.0"), "is_continuous": False, "default_margins": {"top": 3, "right": 3, "bottom": 3, "left": 3}},
            {"code": "LABEL_75X50", "name": "Bundle / Lot Ticket (75x50 mm)", "width_mm": Decimal("75.0"), "height_mm": Decimal("50.0"), "is_continuous": False, "default_margins": {"top": 2, "right": 2, "bottom": 2, "left": 2}},
            {"code": "LABEL_50X30", "name": "Cutting Placket Bundle Ticket (50x30 mm)", "width_mm": Decimal("50.0"), "height_mm": Decimal("30.0"), "is_continuous": False, "default_margins": {"top": 2, "right": 2, "bottom": 2, "left": 2}},
            {"code": "LABEL_40X25", "name": "Item / Bin QR Plate (40x25 mm)", "width_mm": Decimal("40.0"), "height_mm": Decimal("25.0"), "is_continuous": False, "default_margins": {"top": 1, "right": 1, "bottom": 1, "left": 1}},
            {"code": "CR80_ID", "name": "Standard Plastic ID Card (CR80 85.6x54 mm)", "width_mm": Decimal("85.6"), "height_mm": Decimal("54.0"), "is_continuous": False, "default_margins": {"top": 2, "right": 2, "bottom": 2, "left": 2}},
        ]

        for p in presets:
            PaperPreset.objects.update_or_create(code=p["code"], defaults=p)
        self.stdout.write(self.style.SUCCESS(f"Seeded {len(presets)} Paper Presets."))

        # 2. Document Types (24 standard textile documents across 6 modules)
        doc_types = [
            # Sales & Commercial
            {"code": "INVOICE", "name": "Tax / Sales Invoice", "module": "sales", "dataset_class": "apps.printing.services.InvoiceDataset", "default_paper": "A4", "copies_config": ["Original for Buyer", "Duplicate for Accounts", "Triplicate for File"]},
            {"code": "QUOTATION", "name": "Sales Quotation / Price Offer", "module": "sales", "dataset_class": "apps.printing.services.QuotationDataset", "default_paper": "A4", "copies_config": ["Client Copy", "Sales Copy"]},
            {"code": "ORDER_CONFIRMATION", "name": "Order Confirmation & Specs", "module": "sales", "dataset_class": "apps.printing.services.OrderDataset", "default_paper": "A4", "copies_config": ["Original", "Mill Copy"]},
            {"code": "CREDIT_NOTE", "name": "Sales Credit Note", "module": "sales", "dataset_class": "apps.printing.services.CreditNoteDataset", "default_paper": "A4", "copies_config": ["Original for Recipient", "Accounts Copy"]},
            
            # Logistics & Gate
            {"code": "GATE_PASS_OUT", "name": "Gate Pass — Material OUT", "module": "logistics", "dataset_class": "apps.printing.services.GatePassDataset", "default_paper": "HALF_A4", "copies_config": ["Security Gate Copy", "Receiver Copy", "Store Incharge Copy"]},
            {"code": "GATE_PASS_IN", "name": "Gate Pass — Material IN", "module": "logistics", "dataset_class": "apps.printing.services.GatePassInDataset", "default_paper": "HALF_A4", "copies_config": ["Security Gate Copy", "Store Inward Copy"]},
            {"code": "DELIVERY_CHALLAN", "name": "Delivery Challan (POD)", "module": "logistics", "dataset_class": "apps.printing.services.ChallanDataset", "default_paper": "A4", "copies_config": ["Original (Client Ack)", "Duplicate (Accounts)", "Triplicate (Store)"]},
            {"code": "PACKING_LIST", "name": "Export Carton Packing List", "module": "logistics", "dataset_class": "apps.printing.services.PackingListDataset", "default_paper": "A4", "copies_config": ["Customs / Clearing", "Buyer Copy", "Shipping Line"]},
            {"code": "WEIGHBRIDGE_SLIP", "name": "Weighbridge Gross/Tare Slip", "module": "logistics", "dataset_class": "apps.printing.services.WeighbridgeDataset", "default_paper": "THERMAL_80MM", "copies_config": ["Driver Slip", "Mill Weighbridge Copy"]},

            # Finance & Accounts
            {"code": "RECEIPT", "name": "Cash / Cheque Payment Receipt", "module": "finance", "dataset_class": "apps.printing.services.ReceiptDataset", "default_paper": "HALF_A4", "copies_config": ["Customer Copy", "Accounts Copy"]},
            {"code": "PAYMENT_VOUCHER", "name": "Bank / Cash Payment Voucher", "module": "finance", "dataset_class": "apps.printing.services.VoucherDataset", "default_paper": "A4", "copies_config": ["Accounts File Copy", "Auditor Copy"]},
            {"code": "STATEMENT", "name": "Customer / Supplier Ledger Statement", "module": "finance", "dataset_class": "apps.printing.services.StatementDataset", "default_paper": "A4", "copies_config": ["Authorised Statement"]},

            # HR & Labour
            {"code": "PAYSLIP", "name": "Monthly Employee Payslip", "module": "hr", "dataset_class": "apps.printing.services.PayslipDataset", "default_paper": "A5", "copies_config": ["Employee Confidential Copy"]},
            {"code": "PIECE_PAYSLIP", "name": "Piece-Rate Worker Earnings Sheet", "module": "hr", "dataset_class": "apps.printing.services.PiecePayslipDataset", "default_paper": "A4", "copies_config": ["Worker Copy", "Payroll File"]},
            {"code": "ID_CARD", "name": "Worker Lanyard Smart ID Card", "module": "hr", "dataset_class": "apps.printing.services.IdCardDataset", "default_paper": "CR80_ID", "copies_config": ["Original Card"]},
            {"code": "SALARY_REGISTER", "name": "Monthly Wage Register / Muster", "module": "hr", "dataset_class": "apps.printing.services.SalaryRegisterDataset", "default_paper": "A3", "copies_config": ["HR Audit Copy"]},

            # Production & Quality
            {"code": "JOB_CARD", "name": "Production Order / Job Card", "module": "production", "dataset_class": "apps.printing.services.JobCardDataset", "default_paper": "A4", "copies_config": ["Floor Traveller Copy", "PPC Master"]},
            {"code": "DYE_BATCH_CARD", "name": "Dyeing Recipe & Process Card", "module": "production", "dataset_class": "apps.printing.services.DyeBatchDataset", "default_paper": "A4", "copies_config": ["Jet Operator Sheet", "Lab Record"]},
            {"code": "LOT_CARD", "name": "Production Lot Stage Traveller", "module": "production", "dataset_class": "apps.printing.services.LotCardDataset", "default_paper": "A4", "copies_config": ["Trolley Traveller"]},
            {"code": "INSPECTION_4PT", "name": "4-Point Fabric Inspection Certificate", "module": "production", "dataset_class": "apps.printing.services.InspectionDataset", "default_paper": "A4", "copies_config": ["Quality Certificate", "Store Copy"]},
            {"code": "BUNDLE_TICKET", "name": "Stitching Bundle Ticket", "module": "production", "dataset_class": "apps.printing.services.BundleTicketDataset", "default_paper": "LABEL_75X50", "copies_config": ["Bundle Tag"]},
            {"code": "ROLL_LABEL", "name": "Fabric Roll QR Label", "module": "production", "dataset_class": "apps.printing.services.RollLabelDataset", "default_paper": "LABEL_100X100", "copies_config": ["Roll Face Tag"]},

            # Inventory & Purchasing
            {"code": "PO", "name": "Purchase Order (Raw Material/Yarn)", "module": "inventory", "dataset_class": "apps.printing.services.PurchaseOrderDataset", "default_paper": "A4", "copies_config": ["Supplier Original", "Accounts Copy", "Store Copy"]},
            {"code": "GRN", "name": "Goods Receipt Note (GRN)", "module": "inventory", "dataset_class": "apps.printing.services.GrnDataset", "default_paper": "A4", "copies_config": ["Store Inward Record", "Accounts Reconciliation", "Purchase Dept"]},
            {"code": "ISSUE_NOTE", "name": "Material / Yarn Store Issue Note", "module": "inventory", "dataset_class": "apps.printing.services.IssueNoteDataset", "default_paper": "A4", "copies_config": ["Department Issuer", "Receiver Sign Copy"]},
        ]

        for dt in doc_types:
            DocumentType.objects.update_or_create(code=dt["code"], defaults=dt)
        self.stdout.write(self.style.SUCCESS(f"Seeded {len(doc_types)} Document Types."))
