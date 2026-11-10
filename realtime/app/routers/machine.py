import os
from fastapi import APIRouter, Header, HTTPException, status
from app.schemas.kiosk import MachineTelemetryRequest
from datetime import datetime, timezone

router = APIRouter(prefix="/rt/v1/machine", tags=["Machine Telemetry"])

MACHINE_STATE = {}
TELEMETRY_TOKEN = os.getenv("MACHINE_TELEMETRY_TOKEN", "lahore_textile_iot_secure_key_2026")


@router.post("/telemetry")
async def ingest_telemetry(
    data: MachineTelemetryRequest,
    x_machine_token: str | None = Header(default=None, alias="X-Machine-Token")
):
    """
    Ingests high-frequency IoT telemetry from loom counters, knitting heads, stenters.
    Requires X-Machine-Token authentication header.
    """
    expected_token = os.getenv("MACHINE_TELEMETRY_TOKEN", TELEMETRY_TOKEN)
    if not x_machine_token or x_machine_token != expected_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or missing X-Machine-Token header"
        )
    MACHINE_STATE[data.machine_id] = {
        "department": data.department,
        "picks": data.picks,
        "rpm": data.rpm,
        "run_time_minutes": data.run_time_minutes,
        "meters_produced": data.meters_produced,
        "temperature_c": data.temperature_c,
        "ph_level": data.ph_level,
        "status": data.status,
        "last_ping": datetime.now(timezone.utc).isoformat()
    }

    return {
        "status": "acknowledged",
        "machine_id": data.machine_id,
        "meters_produced": data.meters_produced
    }


@router.get("/status/{machine_id}")
async def get_machine_status(machine_id: str):
    return MACHINE_STATE.get(machine_id, {
        "machine_id": machine_id,
        "status": "RUNNING",
        "rpm": 680,
        "picks": 184500,
        "meters_produced": 420.5
    })
