"""
RBAC App — REST API ViewSets & Views.
Provides permission discovery, role management, SoD validation, break-glass requests,
user effective permissions inspection, and Super Admin user management.
"""
from datetime import timedelta
from django.utils import timezone
from django.contrib.auth import get_user_model
from rest_framework import viewsets, status, permissions, serializers
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.models import User, UserRoleBranch
from apps.accounts.serializers import UserSerializer
from apps.rbac.models import (
    Permission, Role, RolePermission, UserRoleAssignment,
    FieldPolicy, ApprovalPolicy, SoDRule, BreakGlassAccess,
    PermissionAuditLog, AccessReview, AccessCondition, ExportLog,
)
from apps.rbac.permissions import (
    RBACPermission, IsSelfOrAdmin, get_user_effective_permissions, get_user_field_policies,
)
from apps.rbac.serializers import (
    PermissionSerializer, RoleSerializer, RoleDetailSerializer, RolePermissionSerializer,
    UserRoleAssignmentSerializer, FieldPolicySerializer, ApprovalPolicySerializer,
    SoDRuleSerializer, BreakGlassAccessSerializer, PermissionAuditLogSerializer,
    AccessReviewSerializer, AccessConditionSerializer, ExportLogSerializer,
)


class PermissionViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Permission.objects.all().order_by("module", "action")
    serializer_class = PermissionSerializer
    permission_classes = [permissions.IsAuthenticated, RBACPermission]
    rbac_module = "settings"
    filterset_fields = ["module", "action", "scope"]


class RoleViewSet(viewsets.ModelViewSet):
    queryset = Role.objects.prefetch_related("role_permissions").all().order_by("hierarchy_level", "name")
    serializer_class = RoleSerializer
    permission_classes = [permissions.IsAuthenticated, RBACPermission]
    rbac_module = "settings"

    def get_serializer_class(self):
        if self.action in ["retrieve", "update", "partial_update"]:
            return RoleDetailSerializer
        return RoleSerializer

    @action(detail=True, methods=["post"], url_path="assign-permission")
    def assign_permission(self, request, pk=None):
        role = self.get_object()
        perm_id = request.data.get("permission_id")
        if not perm_id:
            return Response({"error": "permission_id required"}, status=status.HTTP_400_BAD_REQUEST)
        perm = Permission.objects.get(id=perm_id)
        role_perm, created = RolePermission.objects.get_or_create(role=role, permission=perm)
        return Response({
            "message": f"Permission {perm} assigned to role {role.name}",
            "created": created,
        })

    @action(detail=True, methods=["post"], url_path="remove-permission")
    def remove_permission(self, request, pk=None):
        role = self.get_object()
        perm_id = request.data.get("permission_id")
        RolePermission.objects.filter(role=role, permission_id=perm_id).delete()
        return Response({"message": f"Permission removed from role {role.name}"})


class UserRoleAssignmentViewSet(viewsets.ModelViewSet):
    queryset = UserRoleAssignment.objects.select_related("user", "role", "branch", "department").all()
    serializer_class = UserRoleAssignmentSerializer
    permission_classes = [permissions.IsAuthenticated, RBACPermission]
    rbac_module = "settings"

    def perform_create(self, serializer):
        assignment = serializer.save(assigned_by=self.request.user)
        user = assignment.user
        role = assignment.role

        user_role_ids = list(UserRoleAssignment.objects.filter(user=user, is_active=True).values_list("role_id", flat=True))
        user_perm_strs = set()
        for rp in RolePermission.objects.filter(role_id__in=user_role_ids, granted=True).select_related("permission"):
            p = rp.permission
            user_perm_strs.add(f"{p.module}:{p.action}")

        # Check SoD rules
        for sod in SoDRule.objects.filter(is_active=True, severity="error"):
            for pair in sod.conflicting_permissions or []:
                perm_a = pair.get("perm_a")
                perm_b = pair.get("perm_b")
                if perm_a in user_perm_strs and perm_b in user_perm_strs:
                    assignment.is_active = False
                    assignment.save()
                    raise serializers.ValidationError(
                        f"SoD Conflict Violation: Cannot assign role '{role.name}'. Rule violated: {sod.name} ({sod.code}) for {perm_a} vs {perm_b}"
                    )


class FieldPolicyViewSet(viewsets.ModelViewSet):
    queryset = FieldPolicy.objects.select_related("role").all()
    serializer_class = FieldPolicySerializer
    permission_classes = [permissions.IsAuthenticated, RBACPermission]
    rbac_module = "settings"


class ApprovalPolicyViewSet(viewsets.ModelViewSet):
    queryset = ApprovalPolicy.objects.select_related("role", "escalate_to_role").all().order_by("module", "action")
    serializer_class = ApprovalPolicySerializer
    permission_classes = [permissions.IsAuthenticated, RBACPermission]
    rbac_module = "settings"


class SoDRuleViewSet(viewsets.ModelViewSet):
    queryset = SoDRule.objects.all().order_by("code")
    serializer_class = SoDRuleSerializer
    permission_classes = [permissions.IsAuthenticated, RBACPermission]
    rbac_module = "settings"


class BreakGlassAccessViewSet(viewsets.ModelViewSet):
    """Emergency temporary access elevation with strict logging and auto-expiry."""
    queryset = BreakGlassAccess.objects.select_related("user", "role", "granted_by").all().order_by("-created_at")
    serializer_class = BreakGlassAccessSerializer
    permission_classes = [permissions.IsAuthenticated, RBACPermission]
    rbac_module = "settings"

    def perform_create(self, serializer):
        hours = self.request.data.get("duration_hours", 4)
        expires_at = timezone.now() + timedelta(hours=int(hours))
        serializer.save(
            user=self.request.user,
            expires_at=expires_at,
            granted_by=self.request.user,
            is_active=True,
        )

    @action(detail=True, methods=["post"], url_path="revoke")
    def revoke(self, request, pk=None):
        bg = self.get_object()
        bg.is_active = False
        bg.revoked_at = timezone.now()
        bg.revoked_by = request.user
        bg.save()
        return Response({"message": "Break-glass access revoked."})


class PermissionAuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = PermissionAuditLog.objects.select_related("changed_by", "affected_user", "affected_role").all().order_by("-created_at")
    serializer_class = PermissionAuditLogSerializer
    permission_classes = [permissions.IsAuthenticated, RBACPermission]
    rbac_module = "audit"


class AccessReviewViewSet(viewsets.ModelViewSet):
    queryset = AccessReview.objects.all().order_by("-review_date")
    serializer_class = AccessReviewSerializer
    permission_classes = [permissions.IsAuthenticated, RBACPermission]
    rbac_module = "audit"


class CurrentUserPermissionsView(APIView):
    """Returns effective permissions, data scopes, and masked fields for the logged in user."""
    permission_classes = [permissions.IsAuthenticated, IsSelfOrAdmin]

    def get(self, request):
        user = request.user
        perms = get_user_effective_permissions(user)
        field_rules = get_user_field_policies(user)

        active_bg = BreakGlassAccess.objects.filter(
            user=user,
            is_active=True,
            expires_at__gt=timezone.now(),
        ).first()

        return Response({
            "user_id": str(user.id),
            "username": getattr(user, "username", user.email),
            "email": user.email,
            "branch": str(user.branch.id) if hasattr(user, "branch") and user.branch else None,
            "is_superuser": user.is_superuser,
            "has_break_glass": bool(active_bg),
            "break_glass_expires_at": active_bg.expires_at if active_bg else None,
            "permissions": perms,
            "field_policies": field_rules,
        })


class UserManagementViewSet(viewsets.ModelViewSet):
    """
    Super Admin / IT user management endpoint.
    Enables user creation wizard, assigning roles & branches, locking/disabling, and password resets.
    """
    queryset = User.objects.all().order_by("-created_at")
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated, RBACPermission]
    rbac_module = "settings"

    def perform_create(self, serializer):
        user = serializer.save()
        raw_password = self.request.data.get("password") or "Lahore@2026!Temp"
        user.set_password(raw_password)
        user.must_change_password = True
        user.save(update_fields=["password", "must_change_password"])

        # Assign Role if provided
        role_code = self.request.data.get("role") or self.request.data.get("role_code")
        if role_code:
            rbac_role = Role.objects.filter(code=role_code).first()
            if rbac_role:
                UserRoleAssignment.objects.get_or_create(
                    user=user, role=rbac_role,
                    defaults={"assigned_by": self.request.user}
                )
            from apps.accounts.models import Role as LegacyRole
            leg_role = LegacyRole.objects.filter(code=role_code).first()
            if leg_role:
                branch = user.default_branch
                UserRoleBranch.objects.get_or_create(
                    user=user, role=leg_role, defaults={"branch": branch}
                )

    @action(detail=True, methods=["post"], url_path="toggle-lock")
    def toggle_lock(self, request, pk=None):
        user = self.get_object()
        user.is_active = not user.is_active
        user.save(update_fields=["is_active"])
        return Response({"id": str(user.id), "is_active": user.is_active})

    @action(detail=True, methods=["post"], url_path="reset-password")
    def reset_password(self, request, pk=None):
        user = self.get_object()
        new_pw = request.data.get("new_password") or "Lahore@2026!Temp"
        user.set_password(new_pw)
        user.must_change_password = True
        user.save(update_fields=["password", "must_change_password"])
        return Response({"message": f"Password reset for {user.email}", "temporary_password": new_pw})
