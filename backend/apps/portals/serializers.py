from rest_framework import serializers
from apps.portals.models import (
    Portal,
    PortalNavItem,
    PortalDashboardLayout,
    PortalAccessLog,
    PortalAnnouncement,
)
from apps.accounts.models import User, Role, UserRoleBranch
from apps.branches.models import Branch


class PortalNavItemSerializer(serializers.ModelSerializer):
    children = serializers.SerializerMethodField()

    class Meta:
        model = PortalNavItem
        fields = [
            "id",
            "module",
            "resource",
            "label",
            "label_ur",
            "icon",
            "route",
            "order",
            "parent",
            "badge",
            "required_permission",
            "children",
        ]

    def get_children(self, obj):
        # Only top-level items fetch children
        if obj.parent is None:
            children = obj.children.all().order_by("order")
            return PortalNavItemSerializer(children, many=True).data
        return []


class PortalSerializer(serializers.ModelSerializer):
    class Meta:
        model = Portal
        fields = [
            "id",
            "code",
            "name",
            "slug",
            "description",
            "theme_json",
            "login_title",
            "login_subtitle",
            "hero_image",
            "landing_route",
            "allowed_roles",
            "required_permissions",
            "session_timeout_minutes",
            "require_2fa",
            "ip_allowlist",
            "allowed_hours",
            "max_sessions",
            "device_trust_required",
            "is_active",
            "created_at",
            "updated_at",
        ]


class PortalDashboardLayoutSerializer(serializers.ModelSerializer):
    class Meta:
        model = PortalDashboardLayout
        fields = [
            "id",
            "portal",
            "role_code",
            "user",
            "layout_json",
            "version",
            "is_locked",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class PortalAnnouncementSerializer(serializers.ModelSerializer):
    portal_code = serializers.CharField(source="portal.code", read_only=True)

    class Meta:
        model = PortalAnnouncement
        fields = [
            "id",
            "portal",
            "portal_code",
            "title",
            "title_ur",
            "message",
            "message_ur",
            "severity",
            "expires_at",
            "is_active",
            "created_at",
        ]


class PortalAccessLogSerializer(serializers.ModelSerializer):
    user_email = serializers.CharField(source="user.email", read_only=True)
    user_name = serializers.CharField(source="user.name", read_only=True)

    class Meta:
        model = PortalAccessLog
        fields = [
            "id",
            "portal_slug",
            "user",
            "user_email",
            "user_name",
            "email_attempted",
            "ip_address",
            "user_agent",
            "event",
            "details",
            "created_at",
        ]
        read_only_fields = fields


class PortalLoginSerializer(serializers.Serializer):
    email = serializers.CharField()
    password = serializers.CharField(write_only=True)
    branch_id = serializers.UUIDField(required=False, allow_null=True)
    two_factor_code = serializers.CharField(required=False, allow_blank=True)
    remember_device = serializers.BooleanField(default=False)


class StepUpAuthSerializer(serializers.Serializer):
    password = serializers.CharField(required=False, allow_blank=True)
    two_factor_code = serializers.CharField(required=False, allow_blank=True)
    action = serializers.CharField(default="general_step_up")
