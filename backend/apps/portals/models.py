import uuid
from django.db import models
from django.utils.translation import gettext_lazy as _
from apps.core.models import BaseModel


class Portal(BaseModel):
    code = models.CharField(max_length=50, unique=True, db_index=True)
    name = models.CharField(max_length=150)
    slug = models.SlugField(max_length=60, unique=True, db_index=True)
    description = models.TextField(blank=True)
    
    # Visual Theme & Brand Identity
    theme_json = models.JSONField(
        default=dict,
        help_text=_("Theme configuration: accent color, gradient, logo, badge, surface colors")
    )
    login_title = models.CharField(max_length=200)
    login_subtitle = models.CharField(max_length=300)
    hero_image = models.CharField(max_length=255, blank=True)
    landing_route = models.CharField(max_length=100, default="/dashboard")
    
    # Access & Security Controls
    allowed_roles = models.JSONField(
        default=list,
        help_text=_("List of role codes authorized to sign in to this portal, e.g. ['hr_manager', 'supervisor']")
    )
    required_permissions = models.JSONField(
        default=list,
        help_text=_("List of required permissions e.g. ['labour.view']")
    )
    session_timeout_minutes = models.PositiveIntegerField(
        default=60,
        help_text=_("Idle timeout before auto-lockout (e.g. 15 for HR/Finance, 60 for Manager)")
    )
    require_2fa = models.BooleanField(
        default=False,
        help_text=_("Mandatory 2FA OTP / TOTP enforcement on login")
    )
    ip_allowlist = models.JSONField(
        default=list,
        help_text=_("Optional list of allowed IP CIDRs/addresses. Empty allows all.")
    )
    allowed_hours = models.JSONField(
        default=dict,
        help_text=_("Optional access window e.g. {'start': '07:00', 'end': '20:00'}")
    )
    max_sessions = models.PositiveIntegerField(default=5)
    device_trust_required = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = "portals_portal"
        ordering = ["name"]

    def __str__(self):
        return f"{self.name} (/{self.slug})"


class PortalNavItem(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    portal = models.ForeignKey(Portal, on_delete=models.CASCADE, related_name="nav_items")
    module = models.CharField(max_length=50)
    resource = models.CharField(max_length=100, blank=True)
    label = models.CharField(max_length=100)
    label_ur = models.CharField(max_length=150, blank=True)
    icon = models.CharField(max_length=50, default="Layers")
    route = models.CharField(max_length=150)
    order = models.PositiveIntegerField(default=0)
    parent = models.ForeignKey("self", on_delete=models.CASCADE, null=True, blank=True, related_name="children")
    badge = models.CharField(max_length=30, blank=True)
    required_permission = models.CharField(max_length=100, blank=True)

    class Meta:
        db_table = "portals_nav_item"
        ordering = ["portal", "order"]

    def __str__(self):
        return f"[{self.portal.code}] {self.label} -> {self.route}"


class PortalDashboardLayout(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    portal = models.ForeignKey(Portal, on_delete=models.CASCADE, related_name="dashboard_layouts")
    role_code = models.CharField(max_length=50, null=True, blank=True)
    user = models.ForeignKey("accounts.User", on_delete=models.CASCADE, null=True, blank=True, related_name="portal_layouts")
    layout_json = models.JSONField(
        default=dict,
        help_text=_("Grid rows and widget configurations e.g. {'rows': [['HR-W01', 'HR-W02'], ['HR-W05']]}")
    )
    version = models.PositiveIntegerField(default=1)
    is_locked = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "portals_dashboard_layout"
        ordering = ["portal", "-version"]

    def __str__(self):
        target = self.user.email if self.user else (self.role_code or "Default")
        return f"{self.portal.code} Layout for {target} (v{self.version})"


class PortalAccessLog(models.Model):
    class Event(models.TextChoices):
        LOGIN_SUCCESS = "LOGIN_SUCCESS", _("Login Success")
        LOGIN_FAILED = "LOGIN_FAILED", _("Login Failed")
        WRONG_PORTAL_DENIED = "WRONG_PORTAL_DENIED", _("Wrong Portal Access Denied")
        STEP_UP_VERIFIED = "STEP_UP_VERIFIED", _("Step-Up Auth Verified")
        PORTAL_SWITCH = "PORTAL_SWITCH", _("Portal Switched via Launcher")
        LOGOUT = "LOGOUT", _("Logout")
        LOCKOUT = "LOCKOUT", _("Rate-Limit Lockout")

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    portal_slug = models.CharField(max_length=60, db_index=True)
    user = models.ForeignKey("accounts.User", on_delete=models.SET_NULL, null=True, blank=True, related_name="portal_access_logs")
    email_attempted = models.CharField(max_length=255, blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)
    event = models.CharField(max_length=40, choices=Event.choices)
    details = models.JSONField(default=dict)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        db_table = "portals_access_log"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.created_at.strftime('%Y-%m-%d %H:%M:%S')} - {self.portal_slug} - {self.event}"


class PortalAnnouncement(models.Model):
    class Severity(models.TextChoices):
        INFO = "INFO", _("Info")
        WARNING = "WARNING", _("Warning")
        CRITICAL = "CRITICAL", _("Critical")

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    portal = models.ForeignKey(Portal, on_delete=models.CASCADE, null=True, blank=True, related_name="announcements", help_text=_("Null broadcasts to all portals"))
    title = models.CharField(max_length=200)
    title_ur = models.CharField(max_length=200, blank=True)
    message = models.TextField()
    message_ur = models.TextField(blank=True)
    severity = models.CharField(max_length=20, choices=Severity.choices, default=Severity.INFO)
    expires_at = models.DateTimeField(null=True, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "portals_announcement"
        ordering = ["-created_at"]

    def __str__(self):
        scope = self.portal.code if self.portal else "ALL"
        return f"[{scope}] {self.title} ({self.severity})"
