from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.utils.translation import gettext_lazy as _

from apps.accounts.models import (
    User,
    Role,
    ModulePermission,
    UserRoleBranch,
    OTPChallenge,
    LoginAudit,
)


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ("email", "name", "phone", "is_active", "is_staff", "is_2fa_enabled", "created_at")
    list_filter = ("is_active", "is_staff", "is_superuser", "is_2fa_enabled")
    search_fields = ("email", "name", "phone", "employee_id")
    ordering = ("email",)

    fieldsets = (
        (None, {"fields": ("email", "password")}),
        (
            _("Personal info"),
            {"fields": ("name", "phone", "avatar", "employee_id", "default_branch")},
        ),
        (
            _("Permissions"),
            {
                "fields": (
                    "is_active",
                    "is_staff",
                    "is_superuser",
                    "groups",
                    "user_permissions",
                )
            },
        ),
        (
            _("Security"),
            {"fields": ("is_2fa_enabled", "totp_secret", "is_2fa_verified")},
        ),
        (_("Important dates"), {"fields": ("last_login",)}),
    )

    add_fieldsets = (
        (
            None,
            {
                "classes": ("wide",),
                "fields": ("email", "name", "password", "is_staff", "is_active"),
            },
        ),
    )


@admin.register(Role)
class RoleAdmin(admin.ModelAdmin):
    list_display = ("code", "name", "is_system_role", "requires_2fa")
    list_filter = ("is_system_role", "requires_2fa")
    search_fields = ("code", "name", "description")


@admin.register(ModulePermission)
class ModulePermissionAdmin(admin.ModelAdmin):
    list_display = ("role", "module", "can_view", "can_create", "can_edit", "can_delete", "can_export", "can_approve")
    list_filter = ("role", "module")
    search_fields = ("role__name", "module")


@admin.register(UserRoleBranch)
class UserRoleBranchAdmin(admin.ModelAdmin):
    list_display = ("user", "role", "branch", "is_active", "assigned_at")
    list_filter = ("role", "branch", "is_active")
    search_fields = ("user__email", "user__name", "role__name", "branch__name")


@admin.register(LoginAudit)
class LoginAuditAdmin(admin.ModelAdmin):
    list_display = ("email_attempted", "event_type", "ip_address", "timestamp")
    list_filter = ("event_type", "timestamp")
    search_fields = ("email_attempted", "ip_address")
    readonly_fields = [f.name for f in LoginAudit._meta.fields]

    def has_add_permission(self, request):
        return False

    def has_delete_permission(self, request, obj=None):
        return False
