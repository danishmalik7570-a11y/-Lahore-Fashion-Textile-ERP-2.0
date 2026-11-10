"""
RBAC Permission Classes — DRF integration.

Usage in views:
    permission_classes = [IsAuthenticated, RBACPermission]
    rbac_module = "payroll"
    rbac_action = "view"  # or auto-detected from HTTP method

Or as a decorator:
    @require_permission("payroll", "approve", scope="department")
"""
from __future__ import annotations
import ipaddress
import logging
from functools import wraps
from datetime import time as dt_time
from typing import Any, TYPE_CHECKING

from django.core.cache import cache
from django.db import models
from django.utils import timezone
from rest_framework.permissions import BasePermission
from rest_framework.request import Request

if TYPE_CHECKING:
    from rest_framework.views import APIView
else:
    APIView = Any

from apps.rbac.models import (
    Permission, RBACRole, RolePermission, UserRoleAssignment,
    FieldPolicy, ApprovalPolicy, AccessCondition, BreakGlassAccess,
)

logger = logging.getLogger(__name__)

CACHE_PREFIX = "rbac:user_perms:"
CACHE_TTL = 300  # 5 minutes


def _get_user_permissions(user, branch_id=None):
    """
    Build a cached permission snapshot for a user.
    Returns a set of permission strings: 'module:action:scope'
    """
    cache_key = f"{CACHE_PREFIX}{user.id}:{branch_id or 'all'}"
    cached = cache.get(cache_key)
    if cached is not None:
        return cached

    # Get active role assignments
    assignments = UserRoleAssignment.objects.filter(
        user=user, is_active=True,
    ).select_related("role")

    if branch_id:
        assignments = assignments.filter(
            models.Q(branch_id=branch_id) | models.Q(branch__isnull=True)
        )

    role_ids = list(assignments.values_list("role_id", flat=True))

    # Also resolve accounts.UserRoleBranch
    if hasattr(user, "role_branches"):
        legacy_codes = list(user.role_branches.filter(is_active=True).values_list("role__code", flat=True))
        if legacy_codes:
            matched_rbac_roles = list(RBACRole.objects.filter(
                models.Q(code__in=legacy_codes) | models.Q(legacy_role__code__in=legacy_codes)
            ).values_list("id", flat=True))
            role_ids.extend(matched_rbac_roles)

    # Check break-glass
    now = timezone.now()
    bg_roles = BreakGlassAccess.objects.filter(
        user=user, is_active=True, expires_at__gt=now,
    ).values_list("role_id", flat=True)
    role_ids.extend(bg_roles)

    # Get granted permissions
    perms = RolePermission.objects.filter(
        role_id__in=role_ids, granted=True,
    ).select_related("permission")

    perm_set = set()
    for rp in perms:
        p = rp.permission
        perm_set.add(f"{p.module}:{p.action}:{p.scope}")
        # Also add without scope for simpler checks
        perm_set.add(f"{p.module}:{p.action}")

    cache.set(cache_key, perm_set, CACHE_TTL)
    return perm_set


def invalidate_user_permissions(user_id):
    """Invalidate cached permissions when roles/permissions change."""
    # Delete all cache keys for this user
    # In production, use Redis SCAN or a tag-based cache
    for suffix in ["all", "*"]:
        cache.delete(f"{CACHE_PREFIX}{user_id}:{suffix}")


def _check_access_conditions(user, role_ids, module, action, request):
    """Check time/IP/device conditions."""
    from django.db import models as db_models

    conditions = AccessCondition.objects.filter(
        role_id__in=role_ids, is_active=True,
    ).filter(
        db_models.Q(module="") | db_models.Q(module=module)
    ).filter(
        db_models.Q(action="") | db_models.Q(action=action)
    )

    for cond in conditions:
        if cond.condition_type == "time":
            now = timezone.localtime().time()
            if cond.allowed_start_time and cond.allowed_end_time:
                if not (cond.allowed_start_time <= now <= cond.allowed_end_time):
                    return False, "Access denied: outside allowed time window"
            if cond.allowed_days:
                today = timezone.localtime().isoweekday()
                if today not in cond.allowed_days:
                    return False, "Access denied: not an allowed day"

        elif cond.condition_type == "ip":
            if cond.allowed_ips and request:
                client_ip = (
                    request.META.get("HTTP_X_FORWARDED_FOR", "").split(",")[0].strip()
                    or request.META.get("REMOTE_ADDR", "")
                )
                if client_ip:
                    try:
                        ip = ipaddress.ip_address(client_ip)
                        allowed = any(
                            ip in ipaddress.ip_network(net, strict=False)
                            for net in cond.allowed_ips
                        )
                        if not allowed:
                            return False, "Access denied: IP not in allow-list"
                    except ValueError:
                        pass

    return True, ""


class DenyAll(BasePermission):
    """
    Global default DRF permission class: DENY BY DEFAULT.
    Any view that does not explicitly declare a permission class is blocked.
    """
    message = "Access denied: this endpoint requires explicit RBAC permission."

    def has_permission(self, request: Request, view: APIView) -> bool:
        return False


class IsSelfOrAdmin(BasePermission):
    """Allows authenticated user to view/edit their own data, or Super Admin."""
    def has_permission(self, request: Request, view: APIView) -> bool:
        return bool(request.user and request.user.is_authenticated)

    def has_object_permission(self, request: Request, view: APIView, obj: Any) -> bool:
        user = request.user
        if not user or not user.is_authenticated:
            return False
        if getattr(user, "is_superuser", False) or getattr(user, "is_super_admin", False):
            return True
        if hasattr(obj, "user"):
            return obj.user == user
        if hasattr(obj, "id"):
            return str(obj.id) == str(user.id)
        return True


class RBACPermission(BasePermission):
    """
    DRF permission class using the enhanced RBAC model.
    Views must set `rbac_module` and optionally `rbac_action` or `action_permissions`.
    If `rbac_module` is undeclared, access is DENIED BY DEFAULT.
    """

    # HTTP method → default action mapping
    METHOD_ACTION_MAP = {
        "GET": "view",
        "HEAD": "view",
        "OPTIONS": "view",
        "POST": "create",
        "PUT": "edit",
        "PATCH": "edit",
        "DELETE": "delete",
    }

    def _log_denial(self, request: Request, user: Any, module: str, action: str, reason: str):
        """Record 403 denied access attempt into PortalAccessLog for audit."""
        try:
            from apps.portals.models import PortalAccessLog
            client_ip = (
                request.META.get("HTTP_X_FORWARDED_FOR", "").split(",")[0].strip()
                or request.META.get("REMOTE_ADDR", "")
            )
            portal_slug = getattr(request, "portal_slug", None)
            if not portal_slug and hasattr(request, "auth") and request.auth:
                portal_slug = getattr(request.auth, "payload", {}).get("portal", "api")
            if not portal_slug:
                portal_slug = "api"

            PortalAccessLog.objects.create(
                portal_slug=portal_slug,
                user=user if user and user.is_authenticated else None,
                email_attempted=user.email if user and user.is_authenticated else "anonymous",
                ip_address=client_ip,
                user_agent=request.META.get("HTTP_USER_AGENT", "")[:255],
                event=PortalAccessLog.Event.WRONG_PORTAL_DENIED,
                details={
                    "reason": reason,
                    "path": request.path,
                    "method": request.method,
                    "module": module,
                    "action": action,
                },
            )
        except Exception as e:
            logger.warning(f"Could not record access denial log: {e}")

    def has_permission(self, request: Request, view: APIView) -> bool:
        user = request.user
        if not user or not user.is_authenticated:
            return False
        # Super Admin / Superuser has full administrative visibility
        if getattr(user, "is_superuser", False) or getattr(user, "is_super_admin", False):
            return True

        module = getattr(view, "rbac_module", None) or getattr(view, "rbac_resource", None)
        if not module:
            # STRICT DENY-BY-DEFAULT: undeclared resource is DENIED
            self._log_denial(request, user, "unspecified", "unspecified", "No rbac_module declared on view")
            return False

        action = getattr(view, "rbac_action", None)
        if not action:
            view_action = getattr(view, "action", None)
            action_map = getattr(view, "action_permissions", {})
            if view_action and view_action in action_map:
                action = action_map[view_action]
            elif view_action and view_action in Permission.Action.values:
                action = view_action
            elif view_action:
                action_to_std = {
                    "list": "view",
                    "retrieve": "view",
                    "create": "create",
                    "update": "edit",
                    "partial_update": "edit",
                    "destroy": "delete",
                }
                action = action_to_std.get(view_action, self.METHOD_ACTION_MAP.get(request.method, "view"))
            else:
                action = self.METHOD_ACTION_MAP.get(request.method, "view")

        branch_id = (
            request.META.get("HTTP_X_BRANCH_ID")
            or getattr(request.auth, "payload", {}).get("branch_id")
            if request.auth else None
        )

        perms = _get_user_permissions(user, branch_id)

        # Check if user has any matching permission
        if f"{module}:{action}" in perms:
            # Check access conditions
            assignments = UserRoleAssignment.objects.filter(
                user=user, is_active=True,
            ).values_list("role_id", flat=True)
            ok, reason = _check_access_conditions(
                user, list(assignments), module, action, request,
            )
            if not ok:
                logger.warning(
                    "RBAC denied (condition)",
                    extra={"user": user.email, "rbac_module": module, "action": action, "reason": reason},
                )
                self._log_denial(request, user, module, action, f"Condition failed: {reason}")
                return False
            return True

        # Check for elevated scope
        for scope in Permission.Scope.values:
            if f"{module}:{action}:{scope}" in perms:
                assignments = UserRoleAssignment.objects.filter(
                    user=user, is_active=True,
                ).values_list("role_id", flat=True)
                ok, reason = _check_access_conditions(
                    user, list(assignments), module, action, request,
                )
                if not ok:
                    self._log_denial(request, user, module, action, f"Condition failed: {reason}")
                    return False
                return True

        logger.info(
            "RBAC denied",
            extra={"user": user.email, "rbac_module": module, "action": action},
        )
        self._log_denial(request, user, module, action, "Permission missing for assigned role(s)")
        return False


def get_user_scope(user, module, action, branch_id=None):
    """
    Get the most permissive scope a user has for a module/action.
    Returns a Scope value or None.
    """
    perms = _get_user_permissions(user, branch_id)
    scope_order = ["all", "multi_branch", "branch", "department", "section", "team", "own"]

    for scope in scope_order:
        if f"{module}:{action}:{scope}" in perms:
            return scope
    return None


def get_field_policies(user, module, branch_id=None):
    """
    Get field-level policies for a user in a module.
    Returns dict: field_name → action (hide/mask/read_only/full).
    """
    assignments = UserRoleAssignment.objects.filter(
        user=user, is_active=True,
    )
    if branch_id:
        from django.db import models as db_models
        assignments = assignments.filter(
            db_models.Q(branch_id=branch_id) | db_models.Q(branch__isnull=True)
        )
    role_ids = assignments.values_list("role_id", flat=True)

    policies = FieldPolicy.objects.filter(
        role_id__in=role_ids, module=module, is_deleted=False,
    )

    # Most permissive wins
    result = {}
    action_rank = {"full": 4, "read_only": 3, "mask": 2, "hide": 1}
    for p in policies:
        current = result.get(p.field_name)
        if current is None or action_rank.get(p.field_action, 0) > action_rank.get(current, 0):
            result[p.field_name] = p.field_action

    return result


def check_approval_limit(user, module, action, amount, branch_id=None):
    """
    Check if user can approve a given amount.
    Returns (can_approve: bool, escalate_to: str|None).
    """
    assignments = UserRoleAssignment.objects.filter(
        user=user, is_active=True,
    ).values_list("role_id", flat=True)

    policies = ApprovalPolicy.objects.filter(
        role_id__in=assignments, module=module, action=action,
    ).select_related("escalate_to_role")

    for policy in policies:
        if policy.max_amount is None or amount <= policy.max_amount:
            return True, None
        elif policy.escalate_to_role:
            return False, policy.escalate_to_role.code

    return False, None


def check_maker_checker(record, user):
    """
    Enforce maker-checker: creator cannot approve own record.
    Returns True if the user can approve (i.e. they are NOT the creator).
    """
    creator = getattr(record, "created_by", None)
    if creator and creator.id == user.id:
        return False
    return True


def require_permission(module, action, scope=None):
    """
    Decorator for view functions / service methods.
    Usage:
        @require_permission("payroll", "approve")
        def approve_payroll(request, run_id):
            ...
    """
    def decorator(func):
        @wraps(func)
        def wrapper(request, *args, **kwargs):
            user = request.user
            if not user or not user.is_authenticated:
                from rest_framework.exceptions import PermissionDenied
                raise PermissionDenied("Authentication required.")

            if getattr(user, "is_superuser", False):
                return func(request, *args, **kwargs)

            branch_id = request.META.get("HTTP_X_BRANCH_ID")
            perms = _get_user_permissions(user, branch_id)

            has_perm = False
            if scope:
                has_perm = f"{module}:{action}:{scope}" in perms
            else:
                has_perm = f"{module}:{action}" in perms

            if not has_perm:
                from rest_framework.exceptions import PermissionDenied
                logger.warning(
                    "Permission denied (decorator)",
                    extra={"user": user.email, "rbac_module": module, "action": action},
                )
                raise PermissionDenied(
                    f"You do not have '{action}' permission for '{module}'."
                )

            return func(request, *args, **kwargs)
        return wrapper
    return decorator


def has_permission(user, module, action, scope=None, branch_id=None) -> bool:
    """Helper to check if a user has a specific permission."""
    if not user or not user.is_authenticated:
        return False
    if getattr(user, "is_superuser", False):
        return True
    perms = _get_user_permissions(user, branch_id)
    if scope:
        return f"{module}:{action}:{scope}" in perms or f"{module}:{action}:all" in perms
    return f"{module}:{action}" in perms or any(p.startswith(f"{module}:{action}") for p in perms)


check_permission = has_permission


def get_user_effective_permissions(user, branch_id=None):
    """Return sorted list of effective permission strings for a user."""
    perms = _get_user_permissions(user, branch_id)
    return sorted(list(perms))


def get_user_field_policies(user, module=None, branch_id=None):
    """Return field policies for a user."""
    if module:
        return get_field_policies(user, module, branch_id)
    assignments = UserRoleAssignment.objects.filter(user=user, is_active=True)
    if branch_id:
        assignments = assignments.filter(models.Q(branch_id=branch_id) | models.Q(branch__isnull=True))
    role_ids = assignments.values_list("role_id", flat=True)
    policies = FieldPolicy.objects.filter(role_id__in=role_ids, is_deleted=False)
    result = {}
    for p in policies:
        mod_dict = result.setdefault(p.module, {})
        mod_dict[p.field_name] = p.field_action
    return result

