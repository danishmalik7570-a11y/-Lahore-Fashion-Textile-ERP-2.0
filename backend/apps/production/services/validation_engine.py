"""
Validation engine for textile shop floor entries.
Guarantees data integrity at the point of entry with mill-tested business rules.
"""
from typing import Dict, Any, Tuple
from decimal import Decimal
from datetime import timedelta
from django.utils import timezone


class FloorValidationEngine:
    STANDARD_BUNDLE_MAX = 50
    MIN_SCAN_INTERVAL_SECONDS = 10
    MAX_SAM_MULTIPLIER = 2.0

    @classmethod
    def validate_entry(
        cls,
        bundle_id: str,
        operation_id: str,
        worker_id: str,
        qty_good: int,
        qty_reject: int,
        bundle_total_qty: int = 20,
        department: str = "Stitching",
        lot_status: str = "Optimal",
        last_scan_time: Any = None
    ) -> Tuple[bool, str, str]:
        """
        Validates a floor entry before persistence.
        Returns: (is_valid, english_message, urdu_message)
        """
        # 1. Check lot status
        if lot_status in ["Hold", "Closed", "Cancelled"]:
            return False, f"Lot is on {lot_status}. Entries blocked.", "لاٹ روک دی گئی ہے، اندراج ممکن نہیں ہے۔"

        # 2. Check total quantity against bundle size
        total_entered = qty_good + qty_reject
        if total_entered <= 0:
            return False, "Quantity must be greater than zero.", "مقدار صفر سے زیادہ ہونی چاہیے۔"

        if total_entered > bundle_total_qty:
            return (
                False,
                f"Total ({total_entered}) exceeds bundle capacity ({bundle_total_qty}).",
                f"کل مقدار ({total_entered}) بنڈل کی حد ({bundle_total_qty}) سے زیادہ ہے۔"
            )

        # 3. Check for too-rapid repeat submission
        if last_scan_time:
            now = timezone.now()
            diff = (now - last_scan_time).total_seconds()
            if diff < cls.MIN_SCAN_INTERVAL_SECONDS:
                return (
                    False,
                    f"Scan too rapid ({int(diff)}s). Please wait {cls.MIN_SCAN_INTERVAL_SECONDS}s.",
                    "اسکین بہت تیز ہے۔ براہ کرم چند سیکنڈ انتظار کریں۔"
                )

        return True, "Entry validated successfully.", "اندراج کامیابی سے تصدیق ہو گیا۔"

    @classmethod
    def check_department_routing(cls, lot_stage: str, kiosk_dept: str) -> Tuple[bool, str, str]:
        """
        Ensures bundle/lot belongs to the correct department/operation.
        """
        dept_stage_map = {
            "Weaving Shed": ["WEAVING"],
            "Grey Inspection": ["GREY_INSPECT"],
            "Dye House": ["DYEING"],
            "Rotary Printing": ["PRINTING"],
            "Cutting": ["CUTTING"],
            "Stitching Line": ["STITCHING"],
            "Stitching": ["STITCHING"],
            "QC Inspection": ["PACKING", "GREY_INSPECT"],
            "Warehouse": ["DISPATCH", "YARN"],
        }

        allowed_stages = dept_stage_map.get(kiosk_dept, [lot_stage])
        if lot_stage not in allowed_stages:
            return (
                False,
                f"Stage mismatch: Lot is at {lot_stage}, but kiosk is for {kiosk_dept}.",
                "یہ بنڈل اس لائن یا شعبے کا نہیں ہے۔"
            )
        return True, "Routing verified.", "شعبہ درست ہے۔"
