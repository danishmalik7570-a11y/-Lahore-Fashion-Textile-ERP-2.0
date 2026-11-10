"""
Django Channels WebSocket consumers for real-time dashboard, lot, and alert feeds.
Auth: JWT token passed as query param ?token=... (validated in connect).
"""
import json
from typing import Any

import jwt
from channels.generic.websocket import AsyncJsonWebsocketConsumer
from django.conf import settings


class AuthenticatedConsumer(AsyncJsonWebsocketConsumer):
    """Base consumer — validates JWT on connect, rejects unauthenticated."""

    async def connect(self) -> None:
        token = self.scope["query_string"].decode().split("token=")[-1].split("&")[0]
        if not token or not await self._validate_token(token):
            await self.close(code=4001)
            return
        await self.accept()

    async def _validate_token(self, token: str) -> bool:
        try:
            jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
            return True
        except jwt.InvalidTokenError:
            return False

    async def disconnect(self, close_code: int) -> None:
        pass

    async def receive_json(self, content: Any, **kwargs: Any) -> None:
        pass


class DashboardConsumer(AuthenticatedConsumer):
    """
    Broadcasts dashboard KPI updates to all connections in a branch group.
    Group name: dashboard_<branch_id>
    Events: lot_scanned, stage_advanced, payment_received, attendance_punch, low_stock
    """

    async def connect(self) -> None:
        self.branch_id = self.scope["url_route"]["kwargs"]["branch_id"]
        self.group_name = f"dashboard_{self.branch_id}"
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await super().connect()

    async def disconnect(self, close_code: int) -> None:
        await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def dashboard_update(self, event: dict[str, Any]) -> None:
        """Receive from channel layer and forward to WebSocket client."""
        await self.send_json(event["data"])


class LotConsumer(AuthenticatedConsumer):
    """
    Broadcasts lot movement events to watchers of a specific lot.
    Group name: lot_<lot_id>
    Events: stage_advanced, scan_event, qc_result, hold, resume
    """

    async def connect(self) -> None:
        self.lot_id = self.scope["url_route"]["kwargs"]["lot_id"]
        self.group_name = f"lot_{self.lot_id}"
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await super().connect()

    async def disconnect(self, close_code: int) -> None:
        await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def lot_update(self, event: dict[str, Any]) -> None:
        await self.send_json(event["data"])


class AlertConsumer(AuthenticatedConsumer):
    """
    Per-user alert stream.
    Group name: alerts_<user_id>
    Events: low_stock, delayed_lot, payment_received, qc_failed, new_order, approval_needed
    """

    async def connect(self) -> None:
        # user_id comes from JWT in parent connect
        token = self.scope["query_string"].decode().split("token=")[-1].split("&")[0]
        try:
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
            self.user_id = payload.get("user_id", "anon")
        except jwt.InvalidTokenError:
            self.user_id = "anon"
        self.group_name = f"alerts_{self.user_id}"
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await super().connect()

    async def disconnect(self, close_code: int) -> None:
        await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def alert(self, event: dict[str, Any]) -> None:
        await self.send_json(event["data"])
