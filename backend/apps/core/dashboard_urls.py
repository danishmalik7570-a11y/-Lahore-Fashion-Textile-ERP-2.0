from django.urls import path
from .dashboard_views import DashboardStatsAPIView, DemoDataManageAPIView

app_name = "dashboard"

urlpatterns = [
    path("stats/", DashboardStatsAPIView.as_view(), name="stats"),
    path("demo-data/<str:action>/", DemoDataManageAPIView.as_view(), name="demo-data"),
]