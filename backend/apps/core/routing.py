"""WebSocket URL routing — registered in ASGI ProtocolTypeRouter."""
from django.urls import re_path
from apps.core import consumers as core_consumers

websocket_urlpatterns = [
    # Dashboard live feed per branch
    re_path(r"ws/dashboard/(?P<branch_id>[0-9a-f-]+)/$", core_consumers.DashboardConsumer.as_asgi()),
    # Lot live feed
    re_path(r"ws/lot/(?P<lot_id>[0-9a-f-]+)/$", core_consumers.LotConsumer.as_asgi()),
    # User-level alerts
    re_path(r"ws/alerts/$", core_consumers.AlertConsumer.as_asgi()),
]
