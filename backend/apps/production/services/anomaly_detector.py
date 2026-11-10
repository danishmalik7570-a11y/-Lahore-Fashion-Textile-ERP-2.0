"""
Anomaly detection engine for textile shop floor data.
Detects fraudulent scans, output spikes, off-shift entries, rapid scans, and round-number patterns.
"""
from typing import List, Dict, Any, Optional
from decimal import Decimal
from datetime import timedelta
from django.utils import timezone


class FloorAnomalyDetector:
    SPIKE_SAM_THRESHOLD = 2.0
    RAPID_SCAN_THRESHOLD_SECONDS = 10
    MIN_ROUND_NUMBER_CLUSTER = 4

    @classmethod
    def analyze_entry(
        cls,
        worker_id: str,
        kiosk_id: Optional[str],
        qty_good: int,
        standard_hourly_target: int = 40,
        is_worker_clocked_in: bool = True,
        seconds_since_last_entry: Optional[int] = None,
        recent_quantities: Optional[List[int]] = None
    ) -> List[Dict[str, Any]]:
        """
        Runs anomaly detection heuristics on an entry.
        Returns a list of detected anomaly flag dicts.
        """
        anomalies = []

        # 1. Output while absent check
        if not is_worker_clocked_in:
            anomalies.append({
                "anomaly_type": "ABSENT_OUTPUT",
                "severity": "CRITICAL",
                "description": f"Worker {worker_id} produced {qty_good} units while not clocked in on attendance gate."
            })

        # 2. Production Spike beyond 2x SAM rate
        if standard_hourly_target > 0:
            implied_rate = qty_good * (3600 / max(seconds_since_last_entry or 300, 60))
            if implied_rate > standard_hourly_target * cls.SPIKE_SAM_THRESHOLD:
                anomalies.append({
                    "anomaly_type": "SPIKE_OUTPUT",
                    "severity": "HIGH",
                    "description": f"Output spike: estimated speed {int(implied_rate)} pcs/hr exceeds {cls.SPIKE_SAM_THRESHOLD}x standard ({standard_hourly_target} pcs/hr)."
                })

        # 3. Too-fast scans (under 10 seconds between bundle submissions)
        if seconds_since_last_entry is not None and seconds_since_last_entry < cls.RAPID_SCAN_THRESHOLD_SECONDS:
            anomalies.append({
                "anomaly_type": "TOO_FAST_SCANS",
                "severity": "MEDIUM",
                "description": f"Rapid scan: only {seconds_since_last_entry}s elapsed since last bundle scan."
            })

        # 4. Round number clustering (e.g. 50, 50, 50, 50)
        if recent_quantities and len(recent_quantities) >= cls.MIN_ROUND_NUMBER_CLUSTER:
            round_counts = sum(1 for q in recent_quantities if q % 10 == 0)
            if round_counts >= cls.MIN_ROUND_NUMBER_CLUSTER:
                anomalies.append({
                    "anomaly_type": "ROUND_NUMBER",
                    "severity": "LOW",
                    "description": f"Repeated round-number pattern detected ({round_counts} consecutive round entries)."
                })

        return anomalies
