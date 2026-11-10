"""
RBAC App — Django Admin configuration.
"""
from django.contrib import admin

from apps.rbac.models import (
    Permission, Role, RolePermission, UserRoleAssignment,
    FieldPolicy, ApprovalPolicy, SoDRule, BreakGlassAccess,
    PermissionAuditLog, AccessReview, AccessCondition, ExportLog,
)


class RolePermissionInline(admin.TabularInline):
    model = RolePermission
    extra = 1
    autocomplete_fields = ["permission"]


class FieldPolicyInline(admin.TabularInline):
    model = FieldPolicy
    extra = 1


@admin.register(Permission)
class PermissionAdmin(admin.ModelAdmin):
    list_display = ["module", "resource", "action", "scope", "description"]
    list_filter = ["module", "action", "scope"]
    search_fields = ["module", "resource", "description"]
    ordering = ["module", "action"]


@admin.register(Role)
class RoleAdmin(admin.ModelAdmin):
    list_display = ["code", "name", "hierarchy_level", "is_system_role", "is_active", "created_at"]
    list_filter = ["is_system_role", "is_active"]
    search_fields = ["code", "name"]
    inlines = [RolePermissionInline, FieldPolicyInline]


@admin.register(UserRoleAssignment)
class UserRoleAssignmentAdmin(admin.ModelAdmin):
    list_display = ["user", "role", "branch", "department", "valid_from", "valid_to", "is_active"]
    list_filter = ["role", "branch", "is_active"]
    search_fields = ["user__username", "user__email", "role__name"]


@admin.register(FieldPolicy)
class FieldPolicyAdmin(admin.ModelAdmin):
    list_display = ["role", "module", "field_name", "field_action"]
    list_filter = ["field_action", "module", "role"]
    search_fields = ["field_name", "module"]


@admin.register(ApprovalPolicy)
class ApprovalPolicyAdmin(admin.ModelAdmin):
    list_display = ["module", "action", "role", "max_amount", "max_quantity", "escalate_to_role"]
    list_filter = ["module", "action"]
    search_fields = ["action"]


@admin.register(SoDRule)
class SoDRuleAdmin(admin.ModelAdmin):
    list_display = ["code", "name", "severity", "is_active"]
    list_filter = ["severity", "is_active"]
    search_fields = ["code", "name"]


@admin.register(BreakGlassAccess)
class BreakGlassAccessAdmin(admin.ModelAdmin):
    list_display = ["user", "role", "reason", "granted_by", "expires_at", "is_active", "revoked_at"]
    list_filter = ["is_active", "role"]
    search_fields = ["user__username", "reason"]


@admin.register(PermissionAuditLog)
class PermissionAuditLogAdmin(admin.ModelAdmin):
    list_display = ["created_at", "changed_by", "change_type", "affected_user", "affected_role", "ip_address"]
    list_filter = ["change_type"]
    search_fields = ["affected_user__username", "detail"]
    readonly_fields = [f.name for f in PermissionAuditLog._meta.fields]


@admin.register(AccessReview)
class AccessReviewAdmin(admin.ModelAdmin):
    list_display = ["title", "review_date", "quarter", "status", "reviewer", "completed_at"]
    list_filter = ["status", "quarter"]


@admin.register(AccessCondition)
class AccessConditionAdmin(admin.ModelAdmin):
    list_display = ["role", "condition_type", "module", "action", "is_active"]
    list_filter = ["condition_type", "is_active"]


@admin.register(ExportLog)
class ExportLogAdmin(admin.ModelAdmin):
    list_display = ["module", "export_type", "record_count", "user", "created_at"]
    list_filter = ["module", "export_type"]
