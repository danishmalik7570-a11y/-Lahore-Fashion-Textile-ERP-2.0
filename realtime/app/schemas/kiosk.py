from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field
from datetime import datetime


class BadgeAuthRequest(BaseModel):
    badge_code: str = Field(..., description="Worker barcode/QR scanned from lanyard")
    kiosk_id: Optional[str] = Field(None, description="Identifier of the kiosk tablet")
    selfie_image_base64: Optional[str] = Field(None, description="Optional anti-proxy spot check selfie")


class BadgeAuthResponse(BaseModel):
    session_token: str
    worker_id: str
    worker_name: str
    employee_code: str
    department: str
    shift: str
    today_earnings_pkr: float = 0.0
    today_pieces_good: int = 0
    expires_at: str


class ScanValidateRequest(BaseModel):
    qr_code: str = Field(..., description="Scanned QR code data (bundle, lot, roll, or machine)")
    expected_type: Optional[str] = Field("bundle", description="bundle, roll, lot, machine")
    kiosk_department: Optional[str] = Field("Stitching", description="Kiosk assigned department")


class ScanValidateResponse(BaseModel):
    is_valid: bool
    scan_type: str
    bundle_id: Optional[str] = None
    lot_number: Optional[str] = None
    operation_id: Optional[str] = None
    operation_name: Optional[str] = None
    standard_quantity: int = 20
    unit_rate_pkr: float = 15.0
    color: Optional[str] = None
    size: Optional[str] = None
    message_en: str
    message_ur: str


class KioskEntrySubmitRequest(BaseModel):
    client_uuid: str
    bundle_id: str
    worker_id: str
    operation_id: str
    operation_name: str
    qty_good: int
    qty_reject: int = 0
    reject_reason: Optional[str] = ""
    unit_rate_pkr: float = 15.0
    kiosk_device_id: Optional[str] = None
    is_late_entry: bool = False
    late_reason: Optional[str] = ""


class KioskEntrySubmitResponse(BaseModel):
    success: bool
    entry_id: str
    client_uuid: str
    earned_pkr: float
    today_total_earned_pkr: float
    today_total_pieces: int
    target_progress_pct: float
    banner_en: str
    banner_ur: str
    status: str = "PENDING"


class StoppageEventRequest(BaseModel):
    machine_id: str
    operator_id: Optional[str] = None
    kiosk_id: Optional[str] = None
    reason_code: str  # warp_break, weft_break, mechanical, electrical, no_yarn, setting_change, cleaning, operator_break
    notes: Optional[str] = ""


class MachineTelemetryRequest(BaseModel):
    machine_id: str
    department: str
    picks: int = 0
    rpm: int = 0
    run_time_minutes: int = 0
    meters_produced: float = 0.0
    temperature_c: float = 0.0
    ph_level: float = 7.0
    status: str = "RUNNING"


class WhatsAppParseRequest(BaseModel):
    text: str
    sender_phone: Optional[str] = ""
