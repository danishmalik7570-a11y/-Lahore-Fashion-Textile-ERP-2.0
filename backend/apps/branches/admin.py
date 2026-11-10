from django.contrib import admin
from apps.branches.models import Branch, BranchUser


@admin.register(Branch)
class BranchAdmin(admin.ModelAdmin):
    list_display = ("code", "name", "city", "is_head_office", "is_active", "phone", "created_at")
    list_filter = ("city", "is_head_office", "is_active")
    search_fields = ("code", "name", "address", "phone", "email")


@admin.register(BranchUser)
class BranchUserAdmin(admin.ModelAdmin):
    list_display = ("branch", "user", "is_default", "created_at")
    list_filter = ("branch", "is_default")
    search_fields = ("branch__name", "user__email", "user__full_name")
