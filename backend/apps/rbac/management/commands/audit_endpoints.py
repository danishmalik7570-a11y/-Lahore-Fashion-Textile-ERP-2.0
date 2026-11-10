"""
Audit Endpoints Management Command — Prompt 8 S-1.
Lists every Django URL, DRF viewset action, FastAPI route, and WebSocket channel with:
  - path
  - method
  - permission class
  - resource/action required
  - whether it applies scope/field policy
  - protection status (PROTECTED / UNPROTECTED / PUBLIC_EXEMPT / ADMIN)

Outputs to docs/ENDPOINT_PERMISSION_MATRIX.md and fails CI if --fail-ci flag is passed
and any endpoint lacks an explicit permission.
"""
from __future__ import annotations

import inspect
import os
import re
import sys
from pathlib import Path
from typing import Any, Dict, List

from django.conf import settings
from django.core.management.base import BaseCommand
from django.urls import URLPattern, URLResolver, get_resolver


class Command(BaseCommand):
    help = "Audit all Django, DRF, FastAPI, and WebSocket endpoints for RBAC permissions and isolation."

    def add_arguments(self, parser):
        parser.add_argument(
            "--output",
            type=str,
            default="docs/ENDPOINT_PERMISSION_MATRIX.md",
            help="Path to output markdown report file",
        )
        parser.add_argument(
            "--fail-ci",
            action="store_true",
            help="Exit with non-zero status code if any unprotected endpoint is found",
        )

    def handle(self, *args, **options):
        output_path = options["output"]
        fail_ci = options["fail_ci"]

        self.stdout.write(self.style.NOTICE("[*] Auditing all endpoints across Django, DRF, FastAPI, and WebSockets..."))

        endpoints: List[Dict[str, Any]] = []

        # 1. Audit Django and DRF routes
        django_endpoints = self._audit_django_routes()
        endpoints.extend(django_endpoints)

        # 2. Audit FastAPI routes
        fastapi_endpoints = self._audit_fastapi_routes()
        endpoints.extend(fastapi_endpoints)

        # 3. Audit WebSocket channels
        websocket_endpoints = self._audit_websocket_channels()
        endpoints.extend(websocket_endpoints)

        # 4. Generate statistics
        total_count = len(endpoints)
        protected_count = sum(1 for e in endpoints if e["status"] == "PROTECTED")
        unprotected_count = sum(1 for e in endpoints if e["status"] == "UNPROTECTED")
        exempt_count = sum(1 for e in endpoints if e["status"] == "PUBLIC_EXEMPT")
        admin_count = sum(1 for e in endpoints if e["status"] == "ADMIN")

        # 5. Write docs/ENDPOINT_PERMISSION_MATRIX.md
        root_dir = Path(settings.BASE_DIR).parent
        file_dest = root_dir / output_path
        file_dest.parent.mkdir(parents=True, exist_ok=True)

        md_content = self._generate_markdown_report(
            endpoints, total_count, protected_count, unprotected_count, exempt_count, admin_count
        )
        with open(file_dest, "w", encoding="utf-8") as f:
            f.write(md_content)

        self.stdout.write(self.style.SUCCESS(f"[OK] Endpoint permission matrix written to: {file_dest}"))

        # 6. Print console summary
        self.stdout.write("\n" + "=" * 80)
        self.stdout.write(self.style.MIGRATE_HEADING("LAHORE FASHION ERP -- ENDPOINT PERMISSION AUDIT REPORT"))
        self.stdout.write("=" * 80)
        self.stdout.write(f"  Total Endpoints Audited: {total_count}")
        self.stdout.write(self.style.SUCCESS(f"  [OK] Explicitly Protected:   {protected_count}"))
        self.stdout.write(self.style.WARNING(f"  [!]  Unprotected / At Risk: {unprotected_count}"))
        self.stdout.write(f"  [-]  Public Exempt:          {exempt_count}")
        self.stdout.write(f"  [*]  Django Admin Internal:  {admin_count}")
        self.stdout.write("-" * 80)

        unprotected_list = [e for e in endpoints if e["status"] == "UNPROTECTED"]
        if unprotected_list:
            self.stdout.write(self.style.ERROR(f"\n[!] FOUND {len(unprotected_list)} UNPROTECTED ENDPOINTS:\n"))
            for item in unprotected_list:
                self.stdout.write(
                    f"  - [{item['component']}] {item['method']:<6} {item['path']:<45} "
                    f"| Handler: {item['handler']} | Perms: {item['permission_classes']} | Resource: {item['required_resource']}"
                )
        else:
            self.stdout.write(self.style.SUCCESS("\n[SUCCESS] All endpoints have explicit protection!\n"))

        if fail_ci and unprotected_count > 0:
            self.stderr.write(self.style.ERROR(f"\n[CI FAILURE] {unprotected_count} unprotected endpoints found!\n"))
            sys.exit(1)

    def _clean_path(self, path: str) -> str:
        p = path.replace("^", "").replace("$", "").rstrip("/")
        p = re.sub(r"\(\?P<([^>]+)>[^)]+\)", r"{\1}", p)
        if not p.startswith("/"):
            p = "/" + p
        return p + "/" if not p.endswith("/") and not p.endswith(".json") else p

    def _audit_django_routes(self) -> List[Dict[str, Any]]:
        results = []

        def walk(patterns, prefix=""):
            for p in patterns:
                if isinstance(p, URLResolver):
                    walk(p.url_patterns, prefix + str(p.pattern))
                elif isinstance(p, URLPattern):
                    pattern_str = prefix + str(p.pattern)
                    # Skip duplicate format suffix regexes created by DRF DefaultRouter
                    if r"\.(?P<format>[a-z0-9]+)/?$" in pattern_str:
                        continue
                    if "__debug__" in pattern_str:
                        continue
                    results.append((pattern_str, p.callback))

        walk(get_resolver().url_patterns)

        endpoint_entries = []

        public_exempt_paths = [
            "/api/v1/auth/login/",
            "/api/v1/auth/2fa/send/",
            "/api/v1/auth/2fa/verify/",
            "/api/v1/auth/refresh/",
            "/api/v1/auth/password/forgot/",
            "/api/v1/auth/password/reset/",
            "/api/v1/auth/portal/{portal_slug}/login/",
            "/api/v1/health/",
            "/api/v1/schema/",
            "/api/docs/",
            "/api/redoc/",
            "/django_prometheus/",
        ]

        for raw_path, callback in results:
            cleaned_path = self._clean_path(raw_path)
            cls = getattr(callback, "cls", None) or getattr(callback, "view_class", None)
            actions = getattr(callback, "actions", None)

            # Determine component
            if cleaned_path.startswith("/admin/") or "secure-admin" in cleaned_path:
                endpoint_entries.append({
                    "component": "Django (Admin)",
                    "path": cleaned_path,
                    "method": "ANY",
                    "handler": callback.__name__ if hasattr(callback, "__name__") else str(callback),
                    "permission_classes": "Super Admin / IT Lockdown (IP Restricted)" if "secure-admin" in cleaned_path else "Disabled (403 Forbidden)",
                    "required_resource": "system:admin",
                    "scope_policy": "Global (Super Admin / IT)",
                    "field_policy": "Django ModelAdmin",
                    "status": "ADMIN",
                })
                continue

            if not cls:
                # Function-based or non-DRF view
                handler_name = callback.__name__ if hasattr(callback, "__name__") else str(callback)
                is_exempt = any(exempt in cleaned_path for exempt in public_exempt_paths)
                status = "PUBLIC_EXEMPT" if is_exempt else "UNPROTECTED"
                endpoint_entries.append({
                    "component": "Django (Standard)",
                    "path": cleaned_path,
                    "method": "GET, POST",
                    "handler": handler_name,
                    "permission_classes": "None (Function view)",
                    "required_resource": "MISSING",
                    "scope_policy": "No",
                    "field_policy": "No",
                    "status": status,
                })
                continue

            # DRF Class-Based View
            perm_classes = getattr(cls, "permission_classes", [])
            perm_names = [p.__name__ if hasattr(p, "__name__") else str(p) for p in perm_classes]
            rbac_module = getattr(cls, "rbac_module", None) or getattr(cls, "rbac_resource", None)

            # Scoping & Field policy checks
            is_branch_scoped = (
                "BaseBranchScopedViewSet" in [b.__name__ for b in cls.__mro__]
                or hasattr(cls, "scope_field")
                or "branch" in getattr(cls, "filterset_fields", [])
            )
            ser_cls = getattr(cls, "serializer_class", None)
            has_field_policy = (
                hasattr(cls, "get_field_policies")
                or (ser_cls is not None and inspect.isclass(ser_cls) and "FieldPolicy" in [s.__name__ for s in inspect.getmro(ser_cls)])
            )

            # DRF ViewSet with action map
            if actions:
                for method_str, action_name in actions.items():
                    method = method_str.upper()
                    handler = f"{cls.__name__}.{action_name}"

                    # Determine action-specific permissions if defined
                    action_method = getattr(cls, action_name, None)
                    action_perms = getattr(action_method, "permission_classes", None)
                    effective_perm_names = (
                        [p.__name__ if hasattr(p, "__name__") else str(p) for p in action_perms]
                        if action_perms
                        else perm_names
                    )

                    # Determine required resource & action
                    req_action = action_name
                    if action_name in ["list", "retrieve"]:
                        req_action = "view"
                    elif action_name == "create":
                        req_action = "create"
                    elif action_name in ["update", "partial_update"]:
                        req_action = "edit"
                    elif action_name == "destroy":
                        req_action = "delete"

                    req_resource = f"{rbac_module}:{req_action}" if rbac_module else f"MISSING:{req_action}"

                    is_exempt = any(exempt in cleaned_path for exempt in public_exempt_paths)
                    if is_exempt:
                        status = "PUBLIC_EXEMPT"
                    elif "IsSelfOrAdmin" in effective_perm_names:
                        status = "PROTECTED"
                        req_resource = f"{rbac_module or 'self'}:{req_action} (Self/Admin)"
                    elif rbac_module and ("RBACPermission" in effective_perm_names or "IsAdminUser" in effective_perm_names):
                        status = "PROTECTED"
                    else:
                        status = "UNPROTECTED"

                    endpoint_entries.append({
                        "component": "Django (DRF API)",
                        "path": cleaned_path,
                        "method": method,
                        "handler": handler,
                        "permission_classes": ", ".join(effective_perm_names) if effective_perm_names else "None",
                        "required_resource": req_resource,
                        "scope_policy": "Yes (Branch Scoped)" if is_branch_scoped else "No",
                        "field_policy": "Yes (Field Masking)" if has_field_policy else "No",
                        "status": status,
                    })
            else:
                # DRF APIView
                http_methods = [
                    m.upper()
                    for m in ["get", "post", "put", "patch", "delete", "options", "head"]
                    if hasattr(cls, m) and getattr(cls, m) is not getattr(cls.__mro__[1], m, None)
                ]
                if not http_methods:
                    http_methods = ["ANY"]

                for method in http_methods:
                    handler = f"{cls.__name__}.{method.lower()}"
                    req_action = getattr(cls, "rbac_action", None)
                    if not req_action:
                        method_action_map = {
                            "GET": "view", "HEAD": "view", "OPTIONS": "view",
                            "POST": "create", "PUT": "edit", "PATCH": "edit", "DELETE": "delete"
                        }
                        req_action = method_action_map.get(method, "execute")

                    req_resource = f"{rbac_module}:{req_action}" if rbac_module else f"MISSING:{req_action}"

                    is_exempt = any(exempt in cleaned_path for exempt in public_exempt_paths)
                    if is_exempt:
                        status = "PUBLIC_EXEMPT"
                    elif "IsSelfOrAdmin" in perm_names:
                        status = "PROTECTED"
                        req_resource = f"{rbac_module or 'self'}:{req_action} (Self/Admin)"
                    elif rbac_module and ("RBACPermission" in perm_names or "IsAdminUser" in perm_names):
                        status = "PROTECTED"
                    else:
                        status = "UNPROTECTED"

                    endpoint_entries.append({
                        "component": "Django (DRF API)",
                        "path": cleaned_path,
                        "method": method,
                        "handler": handler,
                        "permission_classes": ", ".join(perm_names) if perm_names else "None",
                        "required_resource": req_resource,
                        "scope_policy": "Yes" if is_branch_scoped else "No",
                        "field_policy": "Yes" if has_field_policy else "No",
                        "status": status,
                    })

        return endpoint_entries

    def _audit_fastapi_routes(self) -> List[Dict[str, Any]]:
        entries = []
        realtime_path = Path(settings.BASE_DIR).parent / "realtime"
        if str(realtime_path) not in sys.path:
            sys.path.insert(0, str(realtime_path))

        try:
            from app.main import app as fastapi_app
        except Exception as e:
            self.stderr.write(self.style.WARNING(f"Could not import FastAPI app: {e}"))
            return entries

        exempt_fastapi = ["/rt/health", "/rt/docs", "/rt/openapi.json", "/redoc", "/docs/oauth2-redirect"]

        for route in fastapi_app.routes:
            # Handle included subrouters
            if type(route).__name__ == "_IncludedRouter" and hasattr(route, "original_router"):
                sub_routes = route.original_router.routes
            else:
                sub_routes = [route]

            for r in sub_routes:
                path = getattr(r, "path", None)
                if not path:
                    continue

                methods = list(getattr(r, "methods", [])) or ["WS" if "websocket" in type(r).__name__.lower() else "ANY"]
                for method in methods:
                    handler_name = getattr(r, "name", str(getattr(r, "endpoint", "")))
                    if hasattr(r, "endpoint") and hasattr(r.endpoint, "__name__"):
                        handler_name = r.endpoint.__name__

                    if path in exempt_fastapi:
                        entries.append({
                            "component": "FastAPI (Realtime Gateway)",
                            "path": path,
                            "method": method,
                            "handler": handler_name,
                            "permission_classes": "Public Exempt",
                            "required_resource": "system:health/docs",
                            "scope_policy": "No",
                            "field_policy": "No",
                            "status": "PUBLIC_EXEMPT",
                        })
                    elif "machine" in path:
                        # Check header token
                        if method == "POST":
                            entries.append({
                                "component": "FastAPI (Realtime Gateway)",
                                "path": path,
                                "method": method,
                                "handler": handler_name,
                                "permission_classes": "Header: X-Machine-Token",
                                "required_resource": "machine:telemetry",
                                "scope_policy": "Machine-ID Scoped",
                                "field_policy": "No",
                                "status": "PROTECTED",
                            })
                        else:
                            # GET status without auth
                            entries.append({
                                "component": "FastAPI (Realtime Gateway)",
                                "path": path,
                                "method": method,
                                "handler": handler_name,
                                "permission_classes": "None",
                                "required_resource": "MISSING:machine:status",
                                "scope_policy": "No",
                                "field_policy": "No",
                                "status": "UNPROTECTED",
                            })
                    elif "whatsapp" in path:
                        entries.append({
                            "component": "FastAPI (Realtime Gateway)",
                            "path": path,
                            "method": method,
                            "handler": handler_name,
                            "permission_classes": "Header: X-Hub-Signature-256 HMAC",
                            "required_resource": "whatsapp:webhook",
                            "scope_policy": "No",
                            "field_policy": "No",
                            "status": "PROTECTED",
                        })
                    elif "kiosk" in path:
                        # Floor kiosk operations without explicit RBAC dependency
                        entries.append({
                            "component": "FastAPI (Realtime Gateway)",
                            "path": path,
                            "method": method,
                            "handler": handler_name,
                            "permission_classes": "None / Session Store",
                            "required_resource": "MISSING:kiosk:action",
                            "scope_policy": "Worker Scoped",
                            "field_policy": "No",
                            "status": "UNPROTECTED",
                        })
                    elif "ws" in path or "websocket" in type(r).__name__.lower():
                        entries.append({
                            "component": "WebSocket (FastAPI)",
                            "path": path,
                            "method": "WS",
                            "handler": handler_name,
                            "permission_classes": "None (Open Broadcast)",
                            "required_resource": "MISSING:ws:floor",
                            "scope_policy": "No",
                            "field_policy": "No",
                            "status": "UNPROTECTED",
                        })

        return entries

    def _audit_websocket_channels(self) -> List[Dict[str, Any]]:
        entries = []
        try:
            from apps.core.routing import websocket_urlpatterns
        except Exception:
            return entries

        for pattern in websocket_urlpatterns:
            raw_path = str(pattern.pattern)
            cleaned_path = "/" + self._clean_path(raw_path).lstrip("/")
            consumer_cls = pattern.callback

            # Check consumer security
            # AuthenticatedConsumer checks JWT but does not enforce RBAC/portal claims!
            entries.append({
                "component": "WebSocket (Django Channels)",
                "path": cleaned_path,
                "method": "WS",
                "handler": consumer_cls.__name__ if hasattr(consumer_cls, "__name__") else str(consumer_cls),
                "permission_classes": "JWT Query Param (No Portal/RBAC Claim check)",
                "required_resource": f"MISSING:{cleaned_path.split('/')[1]}",
                "scope_policy": "Branch-ID param" if "branch" in cleaned_path else "No",
                "field_policy": "No",
                "status": "UNPROTECTED",
            })

        return entries

    def _generate_markdown_report(
        self,
        endpoints: List[Dict[str, Any]],
        total: int,
        protected: int,
        unprotected: int,
        exempt: int,
        admin: int,
    ) -> str:
        lines = [
            "# LAHORE FASHION ERP — ENDPOINT PERMISSION MATRIX",
            "",
            "> **Generated by `python manage.py audit_endpoints` (Prompt 8 S-1 Audit)**",
            "> Strict Deny-by-Default inventory of all Django, DRF, FastAPI, and WebSocket endpoints.",
            "",
            "## 1. Executive Summary",
            "",
            "| Metric | Count | Ratio | Definition / Status |",
            "|---|---|---|---|",
            f"| **Total Endpoints** | `{total}` | 100% | Comprehensive system endpoint catalogue |",
            f"| **Explicitly Protected** | `{protected}` | {protected/total*100:.1f}% | Guarded with RBACPermission + declared resource or HMAC/Token |",
            f"| **Unprotected / At Risk** | `{unprotected}` | {unprotected/total*100:.1f}% | Relies on generic IsAuthenticated or missing RBAC module declaration |",
            f"| **Public Exempt** | `{exempt}` | {exempt/total*100:.1f}% | Authenticated unneeded (Login, 2FA verify, Health, Swagger schema) |",
            f"| **Django Admin Internal** | `{admin}` | {admin/total*100:.1f}% | Staff/Superuser protected internal administration views |",
            "",
            "---",
            "",
            "## 2. Unprotected Endpoints (Immediate Remediation Target for S-2)",
            "",
            "The following endpoints currently allow access to ANY authenticated user (e.g., an HR user could query client details, orders, or finance ledgers) because they lack an explicit `RBACPermission` + `rbac_module` pairing.",
            "",
            "| Component | Method | Path | Handler | Current Perms | Missing Resource |",
            "|---|---|---|---|---|---|",
        ]

        unprotected_items = [e for e in endpoints if e["status"] == "UNPROTECTED"]
        for e in unprotected_items:
            lines.append(
                f"| {e['component']} | `{e['method']}` | `{e['path']}` | `{e['handler']}` | `{e['permission_classes']}` | `{e['required_resource']}` |"
            )

        lines.extend([
            "",
            "---",
            "",
            "## 3. Comprehensive Endpoint Permission Matrix",
            "",
            "| # | Component | Method | Path | Handler | Permission Class | Required Resource:Action | Scope Policy | Field Policy | Status |",
            "|---|---|---|---|---|---|---|---|---|---|",
        ])

        for idx, e in enumerate(endpoints, 1):
            status_badge = {
                "PROTECTED": "🟢 PROTECTED",
                "UNPROTECTED": "🔴 UNPROTECTED",
                "PUBLIC_EXEMPT": "⚪ PUBLIC EXEMPT",
                "ADMIN": "🔒 ADMIN",
            }.get(e["status"], e["status"])

            lines.append(
                f"| {idx} | {e['component']} | `{e['method']}` | `{e['path']}` | `{e['handler']}` | `{e['permission_classes']}` | `{e['required_resource']}` | {e['scope_policy']} | {e['field_policy']} | {status_badge} |"
            )

        lines.append("")
        return "\n".join(lines)
