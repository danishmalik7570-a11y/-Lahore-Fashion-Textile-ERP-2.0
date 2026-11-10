"""
Django Admin Lockdown — Super Admin & IT Only.
Restricts administrative portal access strictly to Super Admin and IT roles.
Enforces IP restriction and blocks HR and non-admin staff with HTTP 403.
"""
from __future__ import annotations

import ipaddress
import logging
from typing import Any

from django.conf import settings
from django.contrib import admin
from django.contrib.admin import AdminSite
from django.http import HttpRequest, HttpResponse, HttpResponseForbidden

logger = logging.getLogger(__name__)


class SecureAdminSite(AdminSite):
    site_header = "Lahore Fashion Textile ERP — Super Admin & IT Console"
    site_title = "LF ERP Secure Admin"
    index_title = "Restricted Administration Panel"

    def _check_ip_allowed(self, request: HttpRequest) -> bool:
        allowed_ips = getattr(settings, "DJANGO_ADMIN_ALLOWED_IPS", None)
        if not allowed_ips:
            return True  # If no IP allowlist is configured, pass IP check

        client_ip = (
            request.META.get("HTTP_X_FORWARDED_FOR", "").split(",")[0].strip()
            or request.META.get("REMOTE_ADDR", "")
        )
        if not client_ip:
            return False

        try:
            ip_obj = ipaddress.ip_address(client_ip)
            for net in allowed_ips:
                if ip_obj in ipaddress.ip_network(net, strict=False):
                    return True
        except ValueError:
            return False
        return False

    def has_permission(self, request: HttpRequest) -> bool:
        """
        Check if user is Super Admin or IT staff.
        HR, labour, finance, and other departmental roles are strictly blocked.
        """
        if not self._check_ip_allowed(request):
            logger.warning(
                f"[ADMIN LOCKDOWN] Blocked access from unauthorized IP: {request.META.get('REMOTE_ADDR')}"
            )
            return False

        user = request.user
        if not user or not user.is_authenticated or not user.is_active:
            return False

        # Superuser / is_super_admin check
        if getattr(user, "is_superuser", False) or getattr(user, "is_super_admin", False):
            return True

        # Check role assignments for Super Admin or IT
        if hasattr(user, "role_branches"):
            allowed_roles = {"super_admin", "it_admin", "it_support"}
            user_roles = set(
                user.role_branches.filter(is_active=True).values_list("role__code", flat=True)
            )
            if allowed_roles.intersection(user_roles):
                return True

        return False

    def admin_view(self, view: Any, cacheable: bool = False) -> Any:
        """
        Wrap views so that authenticated non-admin users (e.g., HR, Accounts)
        receive a direct HTTP 403 Forbidden response instead of being looped to login.
        """
        parent_view = super().admin_view(view, cacheable=cacheable)

        def inner(request: HttpRequest, *args: Any, **kwargs: Any) -> HttpResponse:
            if not self._check_ip_allowed(request):
                return HttpResponseForbidden(
                    "Access Denied: Administrative console is restricted to authorized IP networks."
                )
            if request.user.is_authenticated and not self.has_permission(request):
                return HttpResponseForbidden(
                    "Access Denied: Administrative console is strictly restricted to Super Admin and IT personnel. "
                    "HR and other department roles are not permitted."
                )
            return parent_view(request, *args, **kwargs)

        return inner


secure_admin_site = SecureAdminSite(name="secure_admin")
# Inherit all ModelAdmin registrations from the default admin registry
secure_admin_site._registry = admin.site._registry
