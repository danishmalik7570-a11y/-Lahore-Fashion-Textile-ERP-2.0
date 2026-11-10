"""
Earnings preview service.
Calculates live piece-rate earnings per entry, shift totals, and estimated earnings.
"""
from typing import Dict, Any
from decimal import Decimal


class EarningsPreviewService:
    DEFAULT_DAILY_TARGET_PKR = Decimal("2200.00")

    @classmethod
    def calculate_entry_earnings(
        cls,
        qty_good: int,
        unit_rate: Decimal,
        today_accumulated_qty: int = 0
    ) -> Dict[str, Any]:
        """
        Calculates earnings for the current entry and day progress.
        """
        entry_earned = Decimal(qty_good) * unit_rate
        today_good_qty = today_accumulated_qty + qty_good
        today_total_earned = Decimal(today_good_qty) * unit_rate
        target_progress_pct = min(
            Decimal("100.00"),
            (today_total_earned / cls.DEFAULT_DAILY_TARGET_PKR) * Decimal("100")
        ) if cls.DEFAULT_DAILY_TARGET_PKR > Decimal("0") else Decimal("100.00")

        return {
            "entry_earned_pkr": float(entry_earned),
            "today_total_earned_pkr": float(today_total_earned),
            "today_total_pieces": today_good_qty,
            "target_pkr": float(cls.DEFAULT_DAILY_TARGET_PKR),
            "target_progress_pct": float(round(target_progress_pct, 1)),
            "display_banner_en": f"+PKR {entry_earned:,.0f} earned • Today PKR {today_total_earned:,.0f}",
            "display_banner_ur": f"کمائی: +{entry_earned:,.0f} روپے • آج کل: {today_total_earned:,.0f} روپے"
        }
