import os
import re
import hmac
import hashlib
from fastapi import APIRouter, Header, HTTPException, status
from app.schemas.kiosk import WhatsAppParseRequest

router = APIRouter(prefix="/rt/v1/whatsapp", tags=["WhatsApp Bot"])

WEBHOOK_SECRET = os.getenv("WHATSAPP_WEBHOOK_SECRET", "lahore_wa_secret_2026")


@router.post("/entry-parse")
async def parse_whatsapp_message(
    req: WhatsAppParseRequest,
    x_hub_signature_256: str | None = Header(default=None, alias="X-Hub-Signature-256")
):
    """
    Parses WhatsApp messages from supervisors into draft entries.
    Validates X-Hub-Signature-256 HMAC when webhook secret is configured.
    """
    secret = os.getenv("WHATSAPP_WEBHOOK_SECRET", WEBHOOK_SECRET)
    if x_hub_signature_256:
        expected_sig = "sha256=" + hmac.new(
            secret.encode("utf-8"),
            req.text.encode("utf-8"),
            hashlib.sha256
        ).hexdigest()
        if not hmac.compare_digest(x_hub_signature_256, expected_sig):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Invalid webhook HMAC signature"
            )

    text = req.text.strip()
    result = {
        "raw_text": text,
        "sender_phone": req.sender_phone,
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
        "requires_confirmation": True,
        "summary": ""
    }

    # Extract Line
    m_line = re.search(r'\b(line\s*([a-z0-9\-]+))\b', text, re.IGNORECASE)
    if m_line:
        result["line"] = f"Line {m_line.group(2).upper()}"

    # Extract Loom / Machine
    m_loom = re.search(r'\b(loom|machine|stenter|knit)\s*#?([0-9a-z\-]+)\b', text, re.IGNORECASE)
    if m_loom:
        result["machine_id"] = f"{m_loom.group(1).upper()}-{m_loom.group(2).upper()}"

    # Extract Time Window
    m_time = re.search(r'\b(\d{1,2}(?::\d{2})?\s*-\s*\d{1,2}(?::\d{2})?)\b', text)
    if m_time:
        result["time_window"] = m_time.group(1).replace(" ", "")

    # Stoppage check
    if any(k in text.lower() for k in ["stoppage", "stopped", "breakdown", "band", "kharaab"]):
        result["entry_type"] = "STOPPAGE"
        if "warp" in text.lower():
            result["stoppage_reason"] = "Warp Break (تار ٹوٹنا)"
        elif "weft" in text.lower():
            result["stoppage_reason"] = "Weft Break (بانہ ٹوٹنا)"
        elif "elec" in text.lower() or "power" in text.lower() or "bijli" in text.lower():
            result["stoppage_reason"] = "Electrical Breakdown (بجلی خرابی)"
        elif "yarn" in text.lower() or "dhaga" in text.lower():
            result["stoppage_reason"] = "Empty Bobbin / No Yarn (دھاگہ ختم)"
        else:
            result["stoppage_reason"] = "General Mechanical Stoppage (مکینیکل تعطل)"
        result["summary"] = f"Stoppage reported on {result['machine_id'] or result['line'] or 'Machine'}: {result['stoppage_reason']}"
    else:
        # Output numbers
        m_qty = re.search(r'\b(output|prod|done|pieces|pcs|qty)?\s*[:=]?\s*(\d+)\b', text, re.IGNORECASE)
        if m_qty:
            result["qty_good"] = int(m_qty.group(2))

        m_rej = re.search(r'\b(reject|damage|defective)\s*[:=]?\s*(\d+)\b', text, re.IGNORECASE)
        if m_rej:
            result["qty_reject"] = int(m_rej.group(2))

        result["summary"] = f"Output draft for {result['line'] or 'Floor'}: {result['qty_good']} pcs ({result['qty_reject']} rejects) for period {result['time_window'] or 'current hour'}"

    # Calculate confidence
    score = 0.0
    if result["line"] or result["machine_id"]:
        score += 0.4
    if result["qty_good"] > 0 or result["stoppage_reason"]:
        score += 0.4
    if result["time_window"]:
        score += 0.2
    result["confidence"] = round(score, 2)

    return result
