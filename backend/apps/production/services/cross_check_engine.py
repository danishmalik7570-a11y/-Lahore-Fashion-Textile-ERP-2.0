"""
Cross-check engine for textile production pipeline.
Enforces downstream balance:
- pieces out of Op N <= pieces out of Op N-1
- Roll meters vs loom pick counter
- Cut fabric vs lay metres reconciliation
"""
from typing import Dict, Any, Tuple
from decimal import Decimal


class FloorCrossCheckEngine:
    METER_VARIANCE_TOLERANCE_PCT = Decimal("3.0")

    @classmethod
    def verify_operation_sequence(
        cls,
        current_op_qty: int,
        previous_op_qty: int
    ) -> Tuple[bool, str]:
        """
        Ensures pieces produced at current operation cannot exceed pieces completed at previous operation.
        """
        if current_op_qty > previous_op_qty:
            return (
                False,
                f"Downstream sequence violation: current op output ({current_op_qty}) > preceding op ({previous_op_qty})."
            )
        return True, "Sequence check passed."

    @classmethod
    def verify_roll_meters_against_counter(
        cls,
        entered_meters: Decimal,
        counter_meters: Decimal
    ) -> Tuple[bool, Decimal, str]:
        """
        Compares manual/doffed roll length against automated loom pick counter.
        Tolerance: <= 3% variance.
        """
        if counter_meters <= Decimal("0"):
            return True, Decimal("0"), "No counter baseline."

        variance_pct = abs((entered_meters - counter_meters) / counter_meters) * Decimal("100")
        if variance_pct > cls.METER_VARIANCE_TOLERANCE_PCT:
            return (
                False,
                variance_pct,
                f"Roll length ({entered_meters}m) differs from loom counter ({counter_meters}m) by {variance_pct:.2f}% (max {cls.METER_VARIANCE_TOLERANCE_PCT}%)."
            )
        return True, variance_pct, f"Meter check verified ({variance_pct:.2f}% variance)."

    @classmethod
    def verify_cutting_reconciliation(
        cls,
        fabric_used_meters: Decimal,
        pieces_cut: int,
        standard_consumption_per_pc: Decimal
    ) -> Tuple[bool, Decimal, str]:
        """
        Checks fabric consumed against expected pieces cut based on markers.
        """
        expected_fabric = Decimal(pieces_cut) * standard_consumption_per_pc
        if expected_fabric <= Decimal("0"):
            return True, Decimal("0"), "Zero consumption baseline."

        waste_pct = ((fabric_used_meters - expected_fabric) / expected_fabric) * Decimal("100")
        if waste_pct > Decimal("8.0"):  # Alert if waste exceeds 8%
            return False, waste_pct, f"High cutting waste detected: {waste_pct:.2f}% above standard consumption."
        return True, waste_pct, f"Cutting reconciliation within standard tolerance ({waste_pct:.2f}% waste)."
