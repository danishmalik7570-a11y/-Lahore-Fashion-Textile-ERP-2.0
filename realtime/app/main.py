"""
Lahore Fashion ERP — High-Frequency Realtime Service
Built with FastAPI 0.115 + WebSocket for shop-floor tablets, IoT machines, and kiosk endpoints.
"""
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from typing import List

from app.routers import kiosk, machine, whatsapp

app = FastAPI(
    title="Lahore Fashion ERP Realtime Gateway",
    description="Low-latency floor kiosk, machine telemetry, and supervisor broadcast API",
    version="2.0.0",
    docs_url="/rt/docs",
    openapi_url="/rt/openapi.json"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(kiosk.router)
app.include_router(machine.router)
app.include_router(whatsapp.router)


class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except Exception:
                pass


manager = ConnectionManager()


@app.get("/rt/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "realtime-kiosk-engine",
        "active_ws_connections": len(manager.active_connections)
    }


@app.websocket("/rt/v1/ws/floor")
async def floor_websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_json()
            # Broadcast floor event to all active supervisory tablets
            await manager.broadcast({
                "type": "FLOOR_EVENT",
                "payload": data
            })
    except WebSocketDisconnect:
        manager.disconnect(websocket)
