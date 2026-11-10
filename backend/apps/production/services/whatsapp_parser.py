"""
WhatsApp text entry parser for shop floor supervisors.
Transforms unstructured chat messages into validated ERP EntryDraft objects.
"""
import re
from typing import Dict, Any, Optional


class WhatsAppFloorParser:
    @classmethod
    def parse_message(cls, text: str, sender_phone: str = "") -> Dict[str, Any]:
        """
        Parses text like:
        - "Line A 10-11 output 140"
        - "Line 2 shift A pieces 165 reject 3"
        - "Loom 42 stoppage warp break"
        - "Lot 8841 bundle 12 done 20"
        """
        cleaned = text.strip()
        result: Dict[str, Any] = {
            "raw_text": cleaned,
            "sender_phone": sender_phone,
            "status": "PARSED",
            "entry_type": "OUTPUT",
            "line": None,
            "machine_id": None,
            "time_window": None,
            "lot_number": None,
            "bundle_number": None,
            "qty_good": 0,
            "qty_reject": 0,
            "stoppage_reason": None,
            "confidence": 0.0,
            "requires_review": True
        }

        # 1. Line match
        line_match = re.search(r'\b(line\s*([a-z0-9\-]+))\b', cleaned, re.IGNORECASE)
        if line_match:
            result["line"] = f"Line {line_match.group(2).upper()}"

        # 2. Machine / Loom match
        loom_match = re.search(r'\b(loom|machine|stenter|knit)\s*#?([0-9a-z\-]+)\b', cleaned, re.IGNORECASE)
        if loom_match:
            result["machine_id"] = f"{loom_match.group(1).upper()}-{loom_match.group(2).upper()}"

        # 3. Time window (e.g. 10-11 or 09:00-10:00)
        time_match = re.search(r'\b(\d{1,2}(?::\d{2})?\s*-\s*\d{1,2}(?::\d{2})?)\b', cleaned)
        if time_match:
            result["time_window"] = time_match.group(1).replace(" ", "")

        # 4. Lot number
        lot_match = re.search(r'\blot\s*#?([a-z0-9\-]+)\b', cleaned, re.IGNORECASE)
        if lot_match:
            result["lot_number"] = lot_match.group(1).upper()

        # 5. Bundle number
        bundle_match = re.search(r'\bbundle\s*#?([a-z0-9\-]+)\b', cleaned, re.IGNORECASE)
        if bundle_match:
            result["bundle_number"] = bundle_match.group(1).upper()

        # 6. Stoppage Reason
        if any(w in cleaned.lower() for w in ["stoppage", "stopped", "breakdown", "kharaab", "band"]):
            result["entry_type"] = "STOPPAGE"
            if "warp" in cleaned.lower():
                result["stoppage_reason"] = "warp_break"
            elif "weft" in cleaned.lower():
                result["stoppage_reason"] = "weft_break"
            elif "electric" in cleaned.lower() or "power" in cleaned.lower() or "bijli" in cleaned.lower():
                result["stoppage_reason"] = "electrical"
            elif "yarn" in cleaned.lower() or "dhaga" in cleaned.lower():
                result["stoppage_reason"] = "no_yarn"
            elif "mech" in cleaned.lower():
                result["stoppage_reason"] = "mechanical"
            else:
                result["stoppage_reason"] = "general_stoppage"

        # Mask time window and lot/bundle to avoid digit collisions
        working_text = cleaned
        if time_match:
            working_text = working_text.replace(time_match.group(1), " ")

        # 7. Output quantity
        if result["entry_type"] != "STOPPAGE":
            # Priority A: Keyword + digits (e.g. "output 140", "pieces 165")
            kw_match = re.search(r'\b(?:output|prod|done|pieces|pcs|qty)\s*[:=]?\s*(\d+)\b', working_text, re.IGNORECASE)
            if kw_match:
                result["qty_good"] = int(kw_match.group(1))
            else:
                # Priority B: digits followed by pcs (e.g. "140 pcs")
                post_match = re.search(r'\b(\d+)\s*(?:pcs|pieces|units)\b', working_text, re.IGNORECASE)
                if post_match:
                    result["qty_good"] = int(post_match.group(1))
                else:
                    # Priority C: fallback standalone digits (not reject digits)
                    non_rej = re.sub(r'\b(?:reject|defective|waste|damage)\s*[:=]?\s*\d+\b', ' ', working_text, flags=re.IGNORECASE)
                    standalone = re.search(r'\b(\d+)\b', non_rej)
                    if standalone:
                        result["qty_good"] = int(standalone.group(1))

        # 8. Rejects
        reject_match = re.search(r'\b(?:reject|defective|waste|damage)\s*[:=]?\s*(\d+)\b', working_text, re.IGNORECASE)
        if reject_match:
            result["qty_reject"] = int(reject_match.group(1))

        # Confidence calculation
        score = 0.0
        if result["line"] or result["machine_id"]:
            score += 0.35
        if result["qty_good"] > 0 or result["stoppage_reason"]:
            score += 0.40
        if result["time_window"] or result["lot_number"]:
            score += 0.25

        result["confidence"] = round(score, 2)
        if result["confidence"] < 0.5:
            result["status"] = "UNRECOGNIZED"
            result["requires_review"] = True

        return result
