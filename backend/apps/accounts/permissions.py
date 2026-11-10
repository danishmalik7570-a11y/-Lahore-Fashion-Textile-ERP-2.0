"""
Custom DRF permission classes for module-level RBAC.
"""
from __future__ import annotations
from rest_framework.permissions import BasePermission
from rest_framework.request import Request
from rest_framework.views import APIView


class ModulePermission(BasePermission):
    """
    Checks ModulePermission matrix for a given module + action.
    Usage:
        permission_classes = [IsAuthenticated, ModulePermission("inventory", "create")]
    Branch is read from the X-Branch-ID header or the JWT claim.
    """

    def __init__(self, module: str, action: str = "view") -> None:
        self.module = module
        self.action = action

    def has_permission(self, request: Request, view: APIView) -> bool:
        user = request.user
        if not user or not user.is_authenticated:
            return False
        if user.is_super_admin:
            return True

        # Get branch_id from header (preferred) or JWT claim
        branch_id = (
            request.META.get("HTTP_X_BRANCH_ID")
            or getattr(request.auth, "payload", {}).get("branch_id")
        )
        if not branch_id:
            return False

        return user.has_module_permission_in_branch(self.module, self.action, branch_id)

    def __call__(self) -> "ModulePermission":
        """Allow use as a class or instance in permission_classes."""
        return self


class IsSuperAdmin(BasePermission):
    """Only Owner/Super Admin can access."""

    def has_permission(self, request: Request, view: APIView) -> bool:
        return bool(request.user and request.user.is_authenticated and request.user.is_super_admin)


class IsBranchMember(BasePermission):
    """User must be a member of the branch in the X-Branch-ID header."""

    def has_permission(self, request: Request, view: APIView) -> bool:
        branch_id = request.META.get("HTTP_X_BRANCH_ID")
        if not branch_id:
            return False
        return request.user.branch_memberships.filter(branch_id=branch_id).exists()
