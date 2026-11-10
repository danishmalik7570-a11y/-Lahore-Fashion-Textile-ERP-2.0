"""
RBAC App — API URL routing.
Exposes endpoints under /api/v1/rbac/
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter

from apps.rbac.views import (
    PermissionViewSet, RoleViewSet, UserRoleAssignmentViewSet,
    FieldPolicyViewSet, ApprovalPolicyViewSet, SoDRuleViewSet,
    BreakGlassAccessViewSet, PermissionAuditLogViewSet, AccessReviewViewSet,
    CurrentUserPermissionsView, UserManagementViewSet,
)

app_name = "rbac"

router = DefaultRouter()
router.register(r"permissions", PermissionViewSet, basename="permission")
router.register(r"roles", RoleViewSet, basename="role")
router.register(r"user-roles", UserRoleAssignmentViewSet, basename="user-role")
router.register(r"users", UserManagementViewSet, basename="user")
router.register(r"field-policies", FieldPolicyViewSet, basename="field-policy")
router.register(r"approval-policies", ApprovalPolicyViewSet, basename="approval-policy")
router.register(r"sod-rules", SoDRuleViewSet, basename="sod-rule")
router.register(r"break-glass", BreakGlassAccessViewSet, basename="break-glass")
router.register(r"audit-logs", PermissionAuditLogViewSet, basename="audit-log")
router.register(r"access-reviews", AccessReviewViewSet, basename="access-review")

urlpatterns = [
    path("me/permissions/", CurrentUserPermissionsView.as_view(), name="my-permissions"),
    path("", include(router.urls)),
]
