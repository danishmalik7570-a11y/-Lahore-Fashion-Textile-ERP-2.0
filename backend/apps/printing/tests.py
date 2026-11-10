"""
Automated Test Suite for Format Builder (F-1):
Services, Sandboxing, Bilingual Number-to-Words, QR/Barcodes, Verification & Database.
"""
from decimal import Decimal
from django.test import TestCase
from apps.printing.models import DocumentType, PaperPreset, PrintJob, VerifyToken
from apps.printing.services import (
    NumberToWordsService, QrBarcodeService, DatasetDictionaryService,
    SandboxedTemplateRenderer, PrintAuditService, TemplateLinterService
)


class TestNumberToWords(TestCase):
    def test_english_lakh_crore(self):
        words = NumberToWordsService.to_words_en(Decimal("1250000.00"), currency="Rupees", use_lakh_crore=True)
        self.assertEqual(words, "Rupees Twelve Lakh Fifty Thousand Only")

    def test_english_western(self):
        words = NumberToWordsService.to_words_en(Decimal("1250000.00"), currency="Rupees", use_lakh_crore=False)
        self.assertEqual(words, "Rupees One Million Two Hundred Fifty Thousand Only")

    def test_english_with_paisa(self):
        words = NumberToWordsService.to_words_en(Decimal("450.75"), currency="PKR")
        self.assertIn("and 75/100", words)

    def test_urdu_lakh_crore(self):
        words_ur = NumberToWordsService.to_words_ur(Decimal("1250000.00"))
        self.assertIn("بارہ لاکھ پچاس ہزار", words_ur)
        self.assertIn("روپے فقط", words_ur)


class TestQrBarcodeService(TestCase):
    def test_qr_generation(self):
        qr_uri = QrBarcodeService.generate_qr_data_uri("https://lahorefashion.com/verify/test")
        self.assertTrue(qr_uri.startswith("data:image/png;base64,"))
        self.assertGreater(len(qr_uri), 100)

    def test_barcode_generation(self):
        bc_uri = QrBarcodeService.generate_barcode_data_uri("INV-2026-0842")
        self.assertTrue(bc_uri.startswith("data:image/png;base64,"))
        self.assertGreater(len(bc_uri), 100)


class TestSandboxedRenderer(TestCase):
    def setUp(self):
        self.renderer = SandboxedTemplateRenderer()

    def test_safe_rendering_and_filters(self):
        template = "Invoice #{{ doc.number }}: {{ totals.grand_total | money }} ({{ totals.grand_total | words_en }})"
        data = {
            "doc": {"number": "INV-001"},
            "totals": {"grand_total": Decimal("25000.00")}
        }
        html = self.renderer.render_html(template, data)
        self.assertIn("Invoice #INV-001: 25,000.00 (Rupees Twenty Five Thousand Only)", html)

    def test_sandbox_blocks_unsafe_access(self):
        # Attempting to access __class__ or __subclasses__ in Jinja2 sandbox
        template = "{{ ''.__class__.__mro__[1].__subclasses__() }}"
        html = self.renderer.render_html(template, {})
        # Should not execute or leak subclasses
        self.assertNotIn("subprocess.Popen", html)


class TestPrintAuditAndVerification(TestCase):
    def test_cryptographic_verification(self):
        record = PrintAuditService.generate_verification_token(
            doc_type="INVOICE",
            doc_id="101",
            doc_number="INV-2026-0001",
            metadata={"amount": 150000}
        )
        self.assertIsNotNone(record.token)

        # Verify
        res = PrintAuditService.verify_token(record.token)
        self.assertTrue(res["is_valid"])
        self.assertEqual(res["doc_number"], "INV-2026-0001")

        # Tampered token
        fake = PrintAuditService.verify_token("invalid_token_123")
        self.assertFalse(fake["is_valid"])

    def test_reprint_flag_logging(self):
        # 1st print
        job1 = PrintAuditService.record_print_job(doc_type="INVOICE", doc_id="101", channel="PDF_DOWNLOAD")
        self.assertFalse(job1.reprint_flag)
        self.assertEqual(job1.reprint_count, 0)

        # 2nd print
        job2 = PrintAuditService.record_print_job(doc_type="INVOICE", doc_id="101", channel="PDF_DOWNLOAD")
        self.assertTrue(job2.reprint_flag)
        self.assertEqual(job2.reprint_count, 1)


class TestTemplateLinter(TestCase):
    def test_linter_detects_overflow(self):
        schema = {
            "elements": [
                {"id": "el1", "x": 190, "y": 10, "width": 50, "height": 20, "content": "Normal text"}
            ]
        }
        # Page width 210mm, 190 + 50 = 240mm -> overflow
        issues = TemplateLinterService.lint_template(schema, page_w_mm=210.0, page_h_mm=297.0)
        self.assertTrue(any(i["severity"] == "ERROR" and "exceeds right page boundary" in i["message"] for i in issues))

    def test_linter_detects_broken_jinja(self):
        schema = {
            "elements": [
                {"id": "el2", "x": 10, "y": 10, "width": 50, "height": 20, "content": "Hello {{ unclosed"}
            ]
        }
        issues = TemplateLinterService.lint_template(schema)
        self.assertTrue(any(i["severity"] == "ERROR" and "Unclosed Jinja" in i["message"] for i in issues))
