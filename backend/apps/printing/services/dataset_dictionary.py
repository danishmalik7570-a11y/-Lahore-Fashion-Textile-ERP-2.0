"""
Safe Read-Only Dataset Dictionary & Data Assembly Service.
Provides variable trees and resolves real ERP records for print templates without arbitrary code execution.
"""
from typing import Dict, Any, List
from decimal import Decimal
from django.utils import timezone
from .number_to_words import NumberToWordsService
from .qr_barcode import QrBarcodeService


class DatasetDictionaryService:
    BASE_SCHEMA_TREE = [
        {
            "name": "company",
            "label": "Company Profile",
            "children": [
                {"key": "company.name", "label": "Company Name", "type": "string", "sample": "Lahore Fashion Textile Mills Ltd."},
                {"key": "company.address", "label": "Full Address", "type": "string", "sample": "Plot 42-B, Industrial Estate, Kot Lakhpat, Lahore"},
                {"key": "company.phone", "label": "Phone Number", "type": "string", "sample": "+92 42 3588 9901"},
                {"key": "company.email", "label": "Email", "type": "string", "sample": "billing@lahorefashion.com"},
                {"key": "company.web", "label": "Website", "type": "string", "sample": "www.lahorefashion.com"},
                {"key": "company.ntn", "label": "NTN Number", "type": "string", "sample": "3049281-7"},
                {"key": "company.strn", "label": "STRN (Sales Tax)", "type": "string", "sample": "03-09-5200-841-19"},
                {"key": "company.bank_name", "label": "Bank Name", "type": "string", "sample": "Habib Bank Limited (Corporate Br.)"},
                {"key": "company.bank_iban", "label": "Bank IBAN", "type": "string", "sample": "PK36HABB0001234567890102"},
            ]
        },
        {
            "name": "doc",
            "label": "Document Header",
            "children": [
                {"key": "doc.number", "label": "Document Number", "type": "string", "sample": "INV-2026-0842"},
                {"key": "doc.date", "label": "Document Date", "type": "date", "sample": "27-Oct-2026"},
                {"key": "doc.due_date", "label": "Due / Expiry Date", "type": "date", "sample": "15-Nov-2026"},
                {"key": "doc.status", "label": "Current Status", "type": "string", "sample": "Confirmed"},
                {"key": "doc.copy_label", "label": "Copy Type Label", "type": "string", "sample": "Original for Recipient"},
                {"key": "doc.reprint_text", "label": "Reprint Mark", "type": "string", "sample": ""},
                {"key": "doc.printed_by", "label": "Printed By", "type": "string", "sample": "Farhan Qureshi (Billing Incharge)"},
                {"key": "doc.printed_at", "label": "Printed At Timestamp", "type": "string", "sample": "27-Oct-2026 13:45 PKT"},
            ]
        },
        {
            "name": "party",
            "label": "Client / Party Details",
            "children": [
                {"key": "party.name", "label": "Party / Client Name", "type": "string", "sample": "Khaadi Apparel (Pvt) Ltd."},
                {"key": "party.address", "label": "Billing Address", "type": "string", "sample": "F-42 Hub River Road, SITE Area, Karachi"},
                {"key": "party.phone", "label": "Contact Phone", "type": "string", "sample": "+92 21 3257 8810"},
                {"key": "party.contact_person", "label": "Attention Person", "type": "string", "sample": "Mr. Asim Munir (Procurement Mgr)"},
                {"key": "party.ntn", "label": "Party NTN", "type": "string", "sample": "1428590-3"},
                {"key": "party.strn", "label": "Party STRN", "type": "string", "sample": "03-01-9812-345-28"},
            ]
        },
        {
            "name": "totals",
            "label": "Totals & In Words",
            "children": [
                {"key": "totals.subtotal", "label": "Subtotal", "type": "money", "sample": "1,200,000.00"},
                {"key": "totals.tax_rate", "label": "Sales Tax Rate", "type": "string", "sample": "18%"},
                {"key": "totals.tax_amount", "label": "Sales Tax Amount", "type": "money", "sample": "216,000.00"},
                {"key": "totals.grand_total", "label": "Grand Total", "type": "money", "sample": "1,416,000.00"},
                {"key": "totals.in_words_en", "label": "Amount in Words (English)", "type": "string", "sample": "Rupees One Million Four Hundred Sixteen Thousand Only"},
                {"key": "totals.in_words_ur", "label": "Amount in Words (Urdu)", "type": "string", "sample": "چودہ لاکھ سولہ ہزار روپے فقط"},
            ]
        },
        {
            "name": "items",
            "label": "Table Rows (Repeating Items)",
            "is_array": True,
            "children": [
                {"key": "item.sr", "label": "Sr No", "type": "number"},
                {"key": "item.code", "label": "Item / Fabric Code", "type": "string"},
                {"key": "item.description", "label": "Description & Specs", "type": "string"},
                {"key": "item.lot_number", "label": "Lot Number", "type": "string"},
                {"key": "item.quantity", "label": "Quantity", "type": "number"},
                {"key": "item.uom", "label": "Unit of Measure", "type": "string"},
                {"key": "item.rate", "label": "Unit Rate (PKR)", "type": "money"},
                {"key": "item.amount", "label": "Total Amount (PKR)", "type": "money"},
            ]
        }
    ]

    @classmethod
    def get_schema_for_doc_type(cls, doc_type: str) -> List[Dict[str, Any]]:
        """
        Returns the data dictionary field tree for the designer sidebar.
        """
        return cls.BASE_SCHEMA_TREE

    @classmethod
    def build_sample_dataset(cls, doc_type: str = "INVOICE", copy_label: str = "Original for Recipient", is_reprint: bool = False) -> Dict[str, Any]:
        """
        Builds a comprehensive, photorealistic sample dataset with realistic textile mill data.
        """
        grand_total = Decimal("1416000.00")
        qr_uri = QrBarcodeService.generate_qr_data_uri(f"https://lahorefashion.com/verify/doc?no=INV-2026-0842&t=signed_token_8841")
        barcode_uri = QrBarcodeService.generate_barcode_data_uri("INV-2026-0842")

        return {
            "company": {
                "name": "Lahore Fashion Textile Mills Ltd.",
                "name_ur": "لاہور فیشن ٹیکسٹائل ملز لمیٹڈ",
                "tagline": "Integrated Textile Manufacturing: Yarn to Fashion",
                "address": "Plot 42-B, Industrial Estate, Kot Lakhpat, Lahore, Pakistan",
                "phone": "+92 42 3588 9901 / 3588 9902",
                "email": "info@lahorefashion.com",
                "web": "www.lahorefashion.com",
                "ntn": "3049281-7",
                "strn": "03-09-5200-841-19",
                "bank_name": "Habib Bank Limited (Corporate Br.)",
                "bank_account": "0123-45678901-03",
                "bank_iban": "PK36HABB0001234567890102"
            },
            "branch": {
                "code": "LHR",
                "name": "Lahore Head Office & Finishing Mill",
                "city": "Lahore"
            },
            "doc": {
                "type": doc_type,
                "title": "TAX INVOICE",
                "title_ur": "سیلز ٹیکس انوائس",
                "number": "INV-2026-0842",
                "date": "27-Oct-2026",
                "due_date": "15-Nov-2026",
                "po_ref": "PO-KHAADI-8841",
                "challan_ref": "CH-2026-0412",
                "status": "APPROVED",
                "copy_label": copy_label,
                "reprint_text": "REPRINT" if is_reprint else "",
                "printed_by": "Farhan Qureshi (Accounts Incharge)",
                "printed_at": timezone.now().strftime("%d-%b-%Y %I:%M %p")
            },
            "party": {
                "code": "CL-014",
                "name": "Khaadi Apparel (Pvt) Ltd.",
                "address": "F-42 Hub River Road, SITE Industrial Area, Karachi, Pakistan",
                "city": "Karachi",
                "phone": "+92 21 3257 8810",
                "email": "supplychain@khaadi.com",
                "contact_person": "Mr. Asim Munir (Procurement Manager)",
                "ntn": "1428590-3",
                "strn": "03-01-9812-345-28"
            },
            "items": [
                {
                    "sr": 1,
                    "code": "FAB-LWN-8080",
                    "description": "Lawn Printed Kurti Fabric — Reactive 8-Color Print, 80x80 / 100x90 Combed Cotton (Shrinkage < 2%)",
                    "lot_number": "LF-2026-8841",
                    "rolls": 24,
                    "quantity": 2400.0,
                    "uom": "Metres",
                    "rate": 285.0,
                    "amount": 684000.0
                },
                {
                    "sr": 2,
                    "code": "FAB-LWN-DYED",
                    "description": "Solid Dyed Cambric 60x60 Trouser Fabric — Mercerized Soft Finish, Jet Black",
                    "lot_number": "LF-2026-8842",
                    "rolls": 18,
                    "quantity": 1800.0,
                    "uom": "Metres",
                    "rate": 210.0,
                    "amount": 378000.0
                },
                {
                    "sr": 3,
                    "code": "DUP-CHIFFON",
                    "description": "Bemberg Chiffon Printed Dupatta 30D/30D — Width 44\", Reactive Digital Print",
                    "lot_number": "LF-2026-8843",
                    "rolls": 14,
                    "quantity": 950.0,
                    "uom": "Metres",
                    "rate": 145.26,
                    "amount": 138000.0
                }
            ],
            "totals": {
                "subtotal": 1200000.0,
                "discount": 0.0,
                "tax_rate": "18%",
                "tax_amount": 216000.0,
                "freight": 0.0,
                "grand_total": float(grand_total),
                "in_words_en": NumberToWordsService.to_words_en(grand_total, currency="Rupees", use_lakh_crore=True),
                "in_words_ur": NumberToWordsService.to_words_ur(grand_total)
            },
            "transport": {
                "transporter": "TCS Cargo Logistics",
                "vehicle_number": "LES-24-8902",
                "driver_name": "Muhammad Rafique",
                "driver_cnic": "35202-8491029-3",
                "driver_phone": "0300-8492019"
            },
            "qr": {
                "verify_url": "https://lahorefashion.com/verify/doc?no=INV-2026-0842",
                "qr_data_uri": qr_uri
            },
            "barcode": {
                "code": "INV-2026-0842",
                "barcode_data_uri": barcode_uri
            },
            "terms": [
                "Payment is due within 15 days of invoice date.",
                "Goods once cut or processed cannot be returned.",
                "Disputes subject to Lahore jurisdiction only."
            ],
            "signatures": [
                {"role": "Prepared By", "name": "Bilal Tariq (Clerk)"},
                {"role": "Checked By", "name": "Sajid Mehmood (Accountant)"},
                {"role": "Authorized Signatory", "name": "Director Finance"}
            ]
        }
