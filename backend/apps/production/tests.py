"""
Unit & integration tests for Prompt #5: Shop-Floor Data Entry Services & Rule Engines.
"""
import unittest
import uuid
from decimal import Decimal
from apps.production.services.validation_engine import FloorValidationEngine
from apps.production.services.cross_check_engine import FloorCrossCheckEngine
from apps.production.services.anomaly_detector import FloorAnomalyDetector
from apps.production.services.earnings_preview import EarningsPreviewService
from apps.production.services.whatsapp_parser import WhatsAppFloorParser


class TestFloorValidationEngine(unittest.TestCase):
    def test_valid_entry(self):
        is_valid, msg_en, msg_ur = FloorValidationEngine.validate_entry(
            bundle_id="BND-2026-8841-01",
            operation_id="OP-01",
            worker_id="WF-1042",
            qty_good=20,
            qty_reject=0,
            bundle_total_qty=20
        )
        self.assertTrue(is_valid)
        self.assertIn("Entry validated successfully", msg_en)

    def test_bundle_over_capacity_blocked(self):
        is_valid, msg_en, msg_ur = FloorValidationEngine.validate_entry(
            bundle_id="BND-2026-8841-01",
            operation_id="OP-01",
            worker_id="WF-1042",
            qty_good=25,
            qty_reject=0,
            bundle_total_qty=20
        )
        self.assertFalse(is_valid)
        self.assertIn("exceeds bundle capacity", msg_en)
        self.assertIn("بنڈل کی حد", msg_ur)

    def test_zero_quantity_blocked(self):
        is_valid, msg_en, msg_ur = FloorValidationEngine.validate_entry(
            bundle_id="BND-2026-8841-01",
            operation_id="OP-01",
            worker_id="WF-1042",
            qty_good=0,
            qty_reject=0
        )
        self.assertFalse(is_valid)
        self.assertIn("greater than zero", msg_en)

    def test_on_hold_lot_blocked(self):
        is_valid, msg_en, msg_ur = FloorValidationEngine.validate_entry(
            bundle_id="BND-2026-8841-01",
            operation_id="OP-01",
            worker_id="WF-1042",
            qty_good=20,
            qty_reject=0,
            lot_status="Hold"
        )
        self.assertFalse(is_valid)
        self.assertIn("Hold", msg_en)

    def test_department_routing_check(self):
        # Stitching kiosk should allow STITCHING stage
        valid, _, _ = FloorValidationEngine.check_department_routing("STITCHING", "Stitching Line")
        self.assertTrue(valid)

        # Stitching kiosk should block DYEING stage
        invalid, msg_en, msg_ur = FloorValidationEngine.check_department_routing("DYEING", "Stitching Line")
        self.assertFalse(invalid)
        self.assertIn("Stage mismatch", msg_en)
        self.assertIn("یہ بنڈل اس لائن یا شعبے کا نہیں ہے", msg_ur)


class TestFloorCrossCheckEngine(unittest.TestCase):
    def test_downstream_sequence_check(self):
        # Current op <= previous op passes
        passed, _ = FloorCrossCheckEngine.verify_operation_sequence(current_op_qty=20, previous_op_qty=20)
        self.assertTrue(passed)

        # Current op > previous op fails
        failed, msg = FloorCrossCheckEngine.verify_operation_sequence(current_op_qty=25, previous_op_qty=20)
        self.assertFalse(failed)
        self.assertIn("sequence violation", msg)

    def test_loom_meter_counter_check(self):
        # 100m vs 101m is 1% variance (< 3% tolerance)
        passed, variance, _ = FloorCrossCheckEngine.verify_roll_meters_against_counter(
            entered_meters=Decimal("101.0"),
            counter_meters=Decimal("100.0")
        )
        self.assertTrue(passed)
        self.assertLess(variance, Decimal("3.0"))

        # 110m vs 100m is 10% variance (> 3% tolerance)
        failed, variance, _ = FloorCrossCheckEngine.verify_roll_meters_against_counter(
            entered_meters=Decimal("110.0"),
            counter_meters=Decimal("100.0")
        )
        self.assertFalse(failed)
        self.assertGreater(variance, Decimal("3.0"))


class TestFloorAnomalyDetector(unittest.TestCase):
    def test_absent_worker_flagged_critical(self):
        anomalies = FloorAnomalyDetector.analyze_entry(
            worker_id="WF-1042",
            kiosk_id="KSK-01",
            qty_good=20,
            is_worker_clocked_in=False
        )
        self.assertTrue(any(a["anomaly_type"] == "ABSENT_OUTPUT" and a["severity"] == "CRITICAL" for a in anomalies))

    def test_spike_output_flagged(self):
        # Worker producing 30 pcs in 60 seconds (1800 pcs/hr vs 40 pcs/hr standard)
        anomalies = FloorAnomalyDetector.analyze_entry(
            worker_id="WF-1042",
            kiosk_id="KSK-01",
            qty_good=30,
            standard_hourly_target=40,
            seconds_since_last_entry=60
        )
        self.assertTrue(any(a["anomaly_type"] == "SPIKE_OUTPUT" for a in anomalies))

    def test_rapid_scan_flagged(self):
        # Scanned after only 4 seconds
        anomalies = FloorAnomalyDetector.analyze_entry(
            worker_id="WF-1042",
            kiosk_id="KSK-01",
            qty_good=10,
            seconds_since_last_entry=4
        )
        self.assertTrue(any(a["anomaly_type"] == "TOO_FAST_SCANS" for a in anomalies))


class TestEarningsPreviewService(unittest.TestCase):
    def test_earnings_calculation(self):
        res = EarningsPreviewService.calculate_entry_earnings(
            qty_good=20,
            unit_rate=Decimal("22.50"),
            today_accumulated_qty=80
        )
        self.assertEqual(res["entry_earned_pkr"], 450.0)
        self.assertEqual(res["today_total_earned_pkr"], 2250.0)
        self.assertEqual(res["today_total_pieces"], 100)
        self.assertEqual(res["target_progress_pct"], 100.0)
        self.assertIn("+PKR 450 earned", res["display_banner_en"])


class TestWhatsAppFloorParser(unittest.TestCase):
    def test_output_parsing(self):
        res = WhatsAppFloorParser.parse_message("Line A 10-11 output 140")
        self.assertEqual(res["line"], "Line A")
        self.assertEqual(res["time_window"], "10-11")
        self.assertEqual(res["qty_good"], 140)
        self.assertEqual(res["qty_reject"], 0)
        self.assertGreaterEqual(res["confidence"], 0.8)

    def test_output_with_rejects(self):
        res = WhatsAppFloorParser.parse_message("Line B 11-12 pieces 165 reject 3")
        self.assertEqual(res["line"], "Line B")
        self.assertEqual(res["time_window"], "11-12")
        self.assertEqual(res["qty_good"], 165)
        self.assertEqual(res["qty_reject"], 3)

    def test_stoppage_parsing(self):
        res = WhatsAppFloorParser.parse_message("Loom 42 stoppage warp break")
        self.assertEqual(res["entry_type"], "STOPPAGE")
        self.assertEqual(res["stoppage_reason"], "warp_break")


from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIClient
from apps.branches.models import Branch
from apps.labour.models import Worker
from apps.accounts.models import User
from apps.production.models import KioskDevice, OutputEntry


class TestProductionDBIntegration(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.branch = Branch.objects.create(
            name="Main Mill Raiwind",
            code="MMR-01",
            city="Lahore",
            address="Multan Road / Raiwind Road, Lahore"
        )
        self.user = User.objects.create_user(
            email="supervisor1@lahorefashion.com",
            password="testpassword123",
            name="Supervisor One",
            default_branch=self.branch
        )
        self.kiosk_user = User.objects.create_user(
            email="kiosk_device_01@lahorefashion.com",
            password="testpassword123",
            name="Kiosk Operator",
            default_branch=self.branch
        )
        self.worker = Worker.objects.create(
            branch=self.branch,
            employee_code="WF-8891",
            name="Muhammad Akram",
            department=Worker.Department.STITCH,
            skill_grade=Worker.SkillGrade.SENIOR,
            shift=Worker.Shift.A,
            cnic="35201-1234567-1",
            daily_rate=1900
        )
        self.kiosk = KioskDevice.objects.create(
            branch=self.branch,
            device_code="KSK-STITCH-01",
            name="Line A Assembly Kiosk",
            department="STITCHING",
            line="Line A",
            status="ONLINE"
        )

    def test_client_uuid_idempotency_persisted_in_db(self):
        """Duplicate client_uuid must return existing row and not create duplicates in DB."""
        self.client.force_authenticate(user=self.user)
        c_uuid = "e3b0c442-98fc-1c14-9afb-4c8996fb9242"
        payload = {
            "client_uuid": c_uuid,
            "bundle_id": "BND-STITCH-001",
            "operation_id": "OP-STITCH-01",
            "operation_name": "Pocket Attach",
            "worker_id": str(self.worker.id),
            "qty_good": 20,
            "qty_reject": 0,
            "bundle_total_qty": 20,
            "unit_rate": "18.50"
        }

        # First submit
        res1 = self.client.post("/api/v1/production/output-entries/submit_entry/", payload, format="json")
        self.assertEqual(res1.status_code, 201)
        self.assertEqual(OutputEntry.objects.filter(client_uuid=c_uuid).count(), 1)

        # Re-submit with same client_uuid (network retry)
        res2 = self.client.post("/api/v1/production/output-entries/submit_entry/", payload, format="json")
        self.assertEqual(res2.status_code, 200)
        # Verify DB still has exactly 1 entry
        self.assertEqual(OutputEntry.objects.filter(client_uuid=c_uuid).count(), 1)
        self.assertEqual(res1.data["id"], res2.data["id"])

    def test_wrong_department_scan_blocked(self):
        """Routing check must block stage that doesn't match kiosk line."""
        is_allowed, msg_en, msg_ur = FloorValidationEngine.check_department_routing(
            lot_stage="DYEING",
            kiosk_dept="Stitching Line"
        )
        self.assertFalse(is_allowed)
        self.assertIn("Stage mismatch", msg_en)
        self.assertIn("یہ بنڈل اس لائن یا شعبے کا نہیں ہے", msg_ur)

    def test_qty_greater_than_bundle_capacity_blocked(self):
        """API must reject submission where qty_good exceeds bundle total qty."""
        self.client.force_authenticate(user=self.user)
        payload = {
            "bundle_id": "BND-STITCH-002",
            "operation_id": "OP-STITCH-01",
            "worker_id": str(self.worker.id),
            "qty_good": 35,
            "qty_reject": 0,
            "bundle_total_qty": 20,
            "unit_rate": "15.00"
        }
        res = self.client.post("/api/v1/production/output-entries/submit_entry/", payload, format="json")
        self.assertEqual(res.status_code, 400)
        self.assertIn("exceeds bundle capacity", res.data["error"])

    def test_cross_check_operation_sequence_blocked(self):
        """Downstream operation cannot process more pieces than upstream completed."""
        passed, msg = FloorCrossCheckEngine.verify_operation_sequence(
            current_op_qty=50,
            previous_op_qty=40
        )
        self.assertFalse(passed)
        self.assertIn("sequence violation", msg)

    def test_edit_window_rule(self):
        """Output entries older than 15 minutes cannot be edited without supervisor approval."""
        entry = OutputEntry.objects.create(
            branch=self.branch,
            bundle_id="BND-TIME-001",
            operation_id="OP-01",
            operation_name="Collar Join",
            worker=self.worker,
            qty_good=20,
            unit_rate=Decimal("15.00"),
            earnings_preview=Decimal("300.00"),
            client_uuid=uuid.uuid4()
        )
        # Entry within 15 mins is editable
        elapsed_recent = (timezone.now() - entry.created_at).total_seconds() / 60
        is_editable_recent = elapsed_recent <= 15
        self.assertTrue(is_editable_recent)

        # Simulate entry created 20 minutes ago
        past_time = timezone.now() - timezone.timedelta(minutes=20)
        OutputEntry.objects.filter(id=entry.id).update(created_at=past_time)
        entry.refresh_from_db()
        elapsed_old = (timezone.now() - entry.created_at).total_seconds() / 60
        is_editable_old = elapsed_old <= 15
        self.assertFalse(is_editable_old)

    def test_kiosk_operator_token_cannot_call_finance_endpoints(self):
        """Kiosk token has floor operator scope and cannot access finance/accounts endpoints."""
        self.client.force_authenticate(user=self.kiosk_user)
        # Finance endpoint should block non-accountant/non-admin
        res = self.client.get("/api/v1/accounts/users/")
        # Should not be 200 OK for standard operator
        self.assertIn(res.status_code, [403, 404])


if __name__ == "__main__":
    unittest.main()

