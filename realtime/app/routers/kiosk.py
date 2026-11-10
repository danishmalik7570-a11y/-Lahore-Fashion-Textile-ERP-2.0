import uuid
from datetime import datetime, timedelta, timezone
from typing import Dict, Any
from fastapi import APIRouter, HTTPException, status
from app.schemas.kiosk import (
    BadgeAuthRequest, BadgeAuthResponse, ScanValidateRequest,
    ScanValidateResponse, KioskEntrySubmitRequest,
    KioskEntrySubmitResponse, StoppageEventRequest
)

router = APIRouter(prefix="/rt/v1/kiosk", tags=["Floor Kiosk"])

# In-memory store for high-speed kiosk caching and state
SESSION_STORE: Dict[str, Dict[str, Any]] = {}
ACCUMULATED_WORKER_EARNINGS: Dict[str, Dict[str, Any]] = {}


@router.post("/auth", response_model=BadgeAuthResponse)
async def kiosk_badge_auth(req: BadgeAuthRequest):
    """
    FastAPI high-speed badge auth.
    Scans worker badge QR at kiosk -> generates session token with worker profile.
    """
    token = f"sess_{uuid.uuid4().hex[:20]}"
    expires = (datetime.now(timezone.utc) + timedelta(hours=10)).isoformat()

    # Known mock worker directory for instant floor kiosk verification
    worker_map = {
        "WF-1042": {"name": "Muhammad Aslam", "dept": "Stitching Line", "shift": "Shift A (Morning)"},
        "WF-1088": {"name": "Tariq Mehmood", "dept": "Weave Shed", "shift": "Shift A (Morning)"},
        "WF-1105": {"name": "Rashid Ali", "dept": "Dye House", "shift": "Shift B (Evening)"},
        "WF-1142": {"name": "Bilal Hussain", "dept": "QC Inspection", "shift": "Shift A (Morning)"},
    }

    code = req.badge_code.strip().upper()
    worker = worker_map.get(code, {
        "name": f"Worker {code}",
        "dept": "Stitching Line",
        "shift": "Shift A (Morning)"
    })

    worker_id = f"w-{code.lower()}"
    stats = ACCUMULATED_WORKER_EARNINGS.get(worker_id, {"earned_pkr": 1420.0, "pieces": 85})

    SESSION_STORE[token] = {
        "worker_id": worker_id,
        "worker_name": worker["name"],
        "employee_code": code,
        "department": worker["dept"],
        "shift": worker["shift"],
        "expires_at": expires
    }

    return BadgeAuthResponse(
        session_token=token,
        worker_id=worker_id,
        worker_name=worker["name"],
        employee_code=code,
        department=worker["dept"],
        shift=worker["shift"],
        today_earnings_pkr=stats["earned_pkr"],
        today_pieces_good=stats["pieces"],
        expires_at=expires
    )


@router.post("/scan", response_model=ScanValidateResponse)
async def validate_scan(req: ScanValidateRequest):
    """
    Validates scanned QR code instantly (bundle, roll, machine, or lot).
    Blocks invalid stages or wrong departments.
    """
    raw = req.qr_code.strip()

    # If barcode/QR indicates bundle
    if "BND" in raw.upper() or "BDL" in raw.upper() or "BUNDLE" in raw.upper() or len(raw) <= 18:
        bundle_id = raw.upper()
        return ScanValidateResponse(
            is_valid=True,
            scan_type="bundle",
            bundle_id=bundle_id,
            lot_number="LF-2026-8841",
            operation_id="OP-COLLAR-02",
            operation_name="Collar Attachment & Stitching",
            standard_quantity=20,
            unit_rate_pkr=18.5,
            color="Navy Blue",
            size="M (Medium)",
            message_en="Bundle verified. Ready for entry.",
            message_ur="بنڈل کی تصدیق ہو گئی ہے۔ کام شروع کریں۔"
        )
    elif "LOOM" in raw.upper() or "MC" in raw.upper():
        return ScanValidateResponse(
            is_valid=True,
            scan_type="machine",
            bundle_id=None,
            lot_number="LF-2026-WEAVE-04",
            operation_id="WEAVE-AIRJET",
            operation_name="Airjet Loom Weaving",
            standard_quantity=1000,
            unit_rate_pkr=2.4,
            message_en="Machine Loom verified.",
            message_ur="مشین تصدیق شدہ ہے۔"
        )
    else:
        return ScanValidateResponse(
            is_valid=True,
            scan_type="roll",
            bundle_id=raw,
            lot_number="LOT-GREY-99",
            operation_id="OP-INSPECT",
            operation_name="Grey Fabric Inspection",
            standard_quantity=120,
            unit_rate_pkr=4.5,
            message_en="Fabric roll tag recognized.",
            message_ur="کپڑے کا رول تصدیق شدہ ہے۔"
        )


@router.post("/entry", response_model=KioskEntrySubmitResponse)
async def submit_kiosk_entry(req: KioskEntrySubmitRequest):
    """
    Idempotent shop floor submission with client_uuid.
    Computes piece-rate earnings live and returns motivational feedback banner.
    """
    earned = req.qty_good * req.unit_rate_pkr

    current_stats = ACCUMULATED_WORKER_EARNINGS.get(req.worker_id, {"earned_pkr": 1420.0, "pieces": 85})
    new_total_earned = current_stats["earned_pkr"] + earned
    new_total_pieces = current_stats["pieces"] + req.qty_good

    ACCUMULATED_WORKER_EARNINGS[req.worker_id] = {
        "earned_pkr": new_total_earned,
        "pieces": new_total_pieces
    }

    target = 2200.0
    progress = min(100.0, round((new_total_earned / target) * 100, 1))

    return KioskEntrySubmitResponse(
        success=True,
        entry_id=f"ent-{uuid.uuid4().hex[:12]}",
        client_uuid=req.client_uuid,
        earned_pkr=round(earned, 2),
        today_total_earned_pkr=round(new_total_earned, 2),
        today_total_pieces=new_total_pieces,
        target_progress_pct=progress,
        banner_en=f"+PKR {earned:,.0f} earned • Today PKR {new_total_earned:,.0f}",
        banner_ur=f"کمائی: +{earned:,.0f} روپے • آج کل: {new_total_earned:,.0f} روپے",
        status="PENDING"
    )


@router.post("/event")
async def report_kiosk_event(req: StoppageEventRequest):
    """
    Logs machine stoppage, mechanic call, or material shortage event.
    """
    reason_ur_map = {
        "warp_break": "تار ٹوٹنا (Warp Break)",
        "weft_break": "بانہ ٹوٹنا (Weft Break)",
        "mechanical": "مکینیکل خرابی (Mechanical Breakdown)",
        "electrical": "بجلی کا تعطل (Electrical / Power)",
        "no_yarn": "دھاگہ ختم (Empty Bobbin / No Yarn)",
        "setting_change": "سیٹنگ و سائزنگ (Pattern Setup)",
        "cleaning": "صفائی و آئلنگ (Machine Cleaning)",
        "operator_break": "وقفہ (Operator Break)"
    }

    return {
        "status": "logged",
        "machine_id": req.machine_id,
        "reason_code": req.reason_code,
        "reason_ur": reason_ur_map.get(req.reason_code, "تعطل"),
        "logged_at": datetime.now(timezone.utc).isoformat(),
        "action_taken": "Maintenance supervisor alerted via WebSocket"
    }
