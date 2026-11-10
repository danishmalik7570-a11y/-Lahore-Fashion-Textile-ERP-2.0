"""
Lahore Fashion ERP — Root URL Configuration
All API routes versioned under /api/v1/
OpenAPI docs at /api/docs/
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularSwaggerView,
    SpectacularRedocView,
)

from django.http import HttpResponseForbidden
from apps.rbac.admin_lockdown import secure_admin_site

def blocked_admin_view(request):
    return HttpResponseForbidden("Access Denied: Standard admin route is disabled. Use the authorized administrative console URL.")

# ─── Admin Lockdown ──────────────────────────────────────────────────────────
DJANGO_ADMIN_URL = getattr(settings, "DJANGO_ADMIN_URL", "secure-admin-cpanel/")

urlpatterns = [
    # ── Locked-down Standard Admin & Separate Super Admin / IT Console ────────
    path("admin/", blocked_admin_view, name="admin-disabled"),
    path(f"{DJANGO_ADMIN_URL.strip('/')}/", secure_admin_site.urls),

    # ── OpenAPI Schema + Docs ─────────────────────────────────────────────────
    path("api/v1/schema/", SpectacularAPIView.as_view(), name="schema"),
    path("api/docs/", SpectacularSwaggerView.as_view(url_name="schema"), name="swagger-ui"),
    path("api/redoc/", SpectacularRedocView.as_view(url_name="schema"), name="redoc"),

    # ── Auth ──────────────────────────────────────────────────────────────────
    path("api/v1/auth/", include("apps.accounts.urls", namespace="auth")),

    # ── Core modules ──────────────────────────────────────────────────────────
    path("api/v1/branches/", include("apps.branches.urls", namespace="branches")),
    path("api/v1/clients/", include("apps.clients.urls", namespace="clients")),
    path("api/v1/orders/", include("apps.orders.urls", namespace="orders")),
    path("api/v1/production/", include("apps.production.urls", namespace="production")),
    path("api/v1/inventory/", include("apps.inventory.urls", namespace="inventory")),
    path("api/v1/quality/", include("apps.quality.urls", namespace="quality")),
    path("api/v1/labour/", include("apps.labour.urls", namespace="labour")),
    path("api/v1/attendance/", include("apps.attendance.urls", namespace="attendance")),
    path("api/v1/hr/", include("apps.hr.urls", namespace="hr")),
    path("api/v1/rbac/", include("apps.rbac.urls", namespace="rbac")),
    path("api/v1/delivery/", include("apps.delivery.urls", namespace="delivery")),
    path("api/v1/finance/", include("apps.finance.urls", namespace="finance")),
    path("api/v1/reports/", include("apps.reports.urls", namespace="reports")),
    path("api/v1/notifications/", include("apps.notifications.urls", namespace="notifications")),
    path("api/v1/audit/", include("apps.audit.urls", namespace="audit")),
    path("api/v1/settings/", include("apps.settings_app.urls", namespace="settings_app")),
    path("api/v1/sync/", include("apps.sync.urls", namespace="sync")),
    path("api/v1/print/", include("apps.printing.urls", namespace="printing")),
    path("api/v1/dashboard/", include("apps.core.dashboard_urls", namespace="dashboard")),
    path("api/v1/", include("apps.portals.urls")),

    # ── Prometheus metrics ────────────────────────────────────────────────────
    path("", include("django_prometheus.urls")),
]

from django.apps import apps
if apps.is_installed("health_check"):
    urlpatterns.insert(1, path("api/v1/health/", include("health_check.urls")))
if apps.is_installed("allauth"):
    urlpatterns.append(path("accounts/", include("allauth.urls")))

# ─── Debug toolbar (dev only) ─────────────────────────────────────────────────
if settings.DEBUG:
    try:
        import debug_toolbar
        urlpatterns = [
            path("__debug__/", include(debug_toolbar.urls)),
        ] + urlpatterns
    except ImportError:
        pass

# ─── Static / Media (dev only — nginx serves in prod) ────────────────────────
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
