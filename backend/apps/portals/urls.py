from django.urls import path, include
from rest_framework.routers import DefaultRouter
from apps.portals.views import (
    PortalLoginView,
    PortalStepUpAuthView,
    UserPortalsMeView,
    PortalBootstrapView,
    PortalViewSet,
    PortalDashboardLayoutViewSet,
    PortalAnnouncementViewSet,
    PortalAccessLogViewSet,
)

router = DefaultRouter()
router.register(r"manage", PortalViewSet, basename="portal-manage")
router.register(r"layouts", PortalDashboardLayoutViewSet, basename="portal-layouts")
router.register(r"announcements", PortalAnnouncementViewSet, basename="portal-announcements")
router.register(r"access-logs", PortalAccessLogViewSet, basename="portal-access-logs")

urlpatterns = [
    # Auth endpoints
    path("auth/portal/<slug:portal_slug>/login/", PortalLoginView.as_view(), name="portal-login"),
    path("auth/portal/<slug:portal_slug>/step-up/", PortalStepUpAuthView.as_view(), name="portal-step-up"),
    
    # User and bootstrap endpoints
    path("portals/me/", UserPortalsMeView.as_view(), name="portals-me"),
    path("portals/<slug:portal_slug>/bootstrap/", PortalBootstrapView.as_view(), name="portal-bootstrap"),
    
    # Admin / CRUD endpoints
    path("portals/", include(router.urls)),
]
