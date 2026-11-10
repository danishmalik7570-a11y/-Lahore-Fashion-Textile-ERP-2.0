"""
RBAC App — Serializers.
"""
from rest_framework import serializers

from apps.rbac.models import (
    Permission, Role, RolePermission, UserRoleAssignment,
    FieldPolicy, ApprovalPolicy, SoDRule, BreakGlassAccess,
    PermissionAuditLog, AccessReview, AccessCondition, ExportLog,
)


class PermissionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Permission
        fields = "__all__"


class RolePermissionSerializer(serializers.ModelSerializer):
    permission_detail = PermissionSerializer(source="permission", read_only=True)

    class Meta:
        model = RolePermission
        fields = "__all__"


class RoleSerializer(serializers.ModelSerializer):
    permissions_count = serializers.IntegerField(source="role_permissions.count", read_only=True)

    class Meta:
        model = Role
        fields = "__all__"


class RoleDetailSerializer(serializers.ModelSerializer):
    role_permissions = RolePermissionSerializer(many=True, read_only=True)

    class Meta:
        model = Role
        fields = "__all__"


class UserRoleAssignmentSerializer(serializers.ModelSerializer):
    role_name = serializers.CharField(source="role.name", read_only=True)
    username = serializers.CharField(source="user.username", read_only=True)

    class Meta:
        model = UserRoleAssignment
        fields = "__all__"


class FieldPolicySerializer(serializers.ModelSerializer):
    class Meta:
        model = FieldPolicy
        fields = "__all__"


class ApprovalPolicySerializer(serializers.ModelSerializer):
    class Meta:
        model = ApprovalPolicy
        fields = "__all__"


class SoDRuleSerializer(serializers.ModelSerializer):
    class Meta:
        model = SoDRule
        fields = "__all__"


class BreakGlassAccessSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source="user.username", read_only=True)
    role_name = serializers.CharField(source="role.name", read_only=True)

    class Meta:
        model = BreakGlassAccess
        fields = "__all__"


class PermissionAuditLogSerializer(serializers.ModelSerializer):
    changed_by_username = serializers.CharField(source="changed_by.username", read_only=True, default="")
    affected_user_username = serializers.CharField(source="affected_user.username", read_only=True, default="")

    class Meta:
        model = PermissionAuditLog
        fields = "__all__"


class AccessReviewSerializer(serializers.ModelSerializer):
    class Meta:
        model = AccessReview
        fields = "__all__"


class AccessConditionSerializer(serializers.ModelSerializer):
    class Meta:
        model = AccessCondition
        fields = "__all__"


class ExportLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = ExportLog
        fields = "__all__"
