"""
Accounts app — Custom User, Role, ModulePermission, OTP, LoginAudit.
Auth backend: email + password (no username).
2FA: TOTP (pyotp) + email OTP.
RBAC: Role → ModulePermission matrix (module × action × branch).
"""
import uuid
from decimal import Decimal
from typing import Optional

import pyotp
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models
from django.utils import timezone
from django.utils.translation import gettext_lazy as _

from apps.core.models import BaseModel


# ─── User Manager ─────────────────────────────────────────────────────────────

class UserManager(BaseUserManager):
    """Custom manager using email as the unique identifier."""

    def _create_user(self, email: str, password: str, **extra_fields) -> "User":
        if not email:
            raise ValueError("Email address is required.")
        email = self.normalize_email(email).lower().strip()
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_user(self, email: str, password: str = "", **extra_fields) -> "User":
        extra_fields.setdefault("is_staff", False)
        extra_fields.setdefault("is_superuser", False)
        return self._create_user(email, password, **extra_fields)

    def create_superuser(self, email: str, password: str, **extra_fields) -> "User":
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("is_active", True)
        return self._create_user(email, password, **extra_fields)


# ─── Role ─────────────────────────────────────────────────────────────────────

class Role(models.Model):
    """
    Pre-defined roles. New roles can be created by Super Admin.
    Default roles match the 9 roles in the login dropdown.
    """

    class RoleCode(models.TextChoices):
        OWNER = "owner", _("Owner / Executive")
        SUPER_ADMIN = "super_admin", _("Super Admin")
        BRANCH_ADMIN = "branch_admin", _("Branch Admin")
        PRODUCTION_MANAGER = "production_manager", _("Production Manager")
        ACCOUNTANT = "accountant", _("Accountant")
        STORE_KEEPER = "store_keeper", _("Store Keeper")
        QC_INSPECTOR = "qc_inspector", _("QC Inspector")
        HR_MANAGER = "hr_manager", _("HR / Labour Manager")
        SUPERVISOR = "supervisor", _("Supervisor")
        WORKER = "worker", _("Worker")

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    code = models.CharField(max_length=50, unique=True, choices=RoleCode.choices, verbose_name=_("Role Code"))
    name = models.CharField(max_length=100, verbose_name=_("Display Name"))
    description = models.TextField(blank=True)
    is_system_role = models.BooleanField(
        default=True,
        help_text=_("System roles cannot be deleted."),
    )
    requires_2fa = models.BooleanField(
        default=False,
        help_text=_("If True, 2FA is mandatory for this role."),
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "accounts_role"
        verbose_name = _("Role")
        verbose_name_plural = _("Roles")
        ordering = ["name"]

    def __str__(self) -> str:
        return self.name


# ─── Module Permission ─────────────────────────────────────────────────────────

class ModulePermission(models.Model):
    """
    RBAC permission matrix: Role × Module × Actions.
    Actions: view, create, edit, delete, approve, export.
    Branch-level scope handled separately via UserRoleBranch.
    """

    class Module(models.TextChoices):
        DASHBOARD = "dashboard", _("Dashboard")
        CLIENTS = "clients", _("Clients")
        ORDERS = "orders", _("Orders")
        PRODUCTION = "production", _("Production Tracking")
        INVENTORY = "inventory", _("Inventory")
        QUALITY = "quality", _("Quality Control")
        LABOUR = "labour", _("Labour & Payroll")
        ATTENDANCE = "attendance", _("Attendance")
        DELIVERY = "delivery", _("Delivery")
        FINANCE = "finance", _("Ledger & Finance")
        REPORTS = "reports", _("Reports & Analytics")
        SETTINGS = "settings", _("Settings")
        AUDIT = "audit", _("Audit Logs")
        SYNC = "sync", _("Offline Sync")
        BRANCHES = "branches", _("Branches")
        USERS = "users", _("User Management")

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    role = models.ForeignKey(
        Role,
        on_delete=models.CASCADE,
        related_name="module_permissions",
        verbose_name=_("Role"),
    )
    module = models.CharField(max_length=50, choices=Module.choices, verbose_name=_("Module"))
    can_view = models.BooleanField(default=False, verbose_name=_("Can View"))
    can_create = models.BooleanField(default=False, verbose_name=_("Can Create"))
    can_edit = models.BooleanField(default=False, verbose_name=_("Can Edit"))
    can_delete = models.BooleanField(default=False, verbose_name=_("Can Delete"))
    can_approve = models.BooleanField(default=False, verbose_name=_("Can Approve"))
    can_export = models.BooleanField(default=False, verbose_name=_("Can Export"))

    class Meta:
        db_table = "accounts_module_permission"
        verbose_name = _("Module Permission")
        verbose_name_plural = _("Module Permissions")
        unique_together = [("role", "module")]
        ordering = ["role", "module"]

    def __str__(self) -> str:
        return f"{self.role.name} → {self.module}"


# ─── User Role Branch ─────────────────────────────────────────────────────────

class UserRoleBranch(models.Model):
    """
    Assigns a Role to a User scoped to a Branch.
    A user can have different roles in different branches.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        "accounts.User",
        on_delete=models.CASCADE,
        related_name="role_branches",
        verbose_name=_("User"),
    )
    role = models.ForeignKey(
        Role,
        on_delete=models.CASCADE,
        related_name="user_role_branches",
        verbose_name=_("Role"),
    )
    branch = models.ForeignKey(
        "branches.Branch",
        on_delete=models.CASCADE,
        related_name="user_role_branches",
        verbose_name=_("Branch"),
    )
    is_active = models.BooleanField(default=True)
    assigned_at = models.DateTimeField(auto_now_add=True)
    assigned_by = models.ForeignKey(
        "accounts.User",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="role_assignments_made",
    )

    class Meta:
        db_table = "accounts_user_role_branch"
        verbose_name = _("User Role (Branch)")
        verbose_name_plural = _("User Role Branches")
        unique_together = [("user", "role", "branch")]

    def __str__(self) -> str:
        return f"{self.user.email} — {self.role.name} @ {self.branch.name}"

    def delete(self, *args, **kwargs):
        from django.core.exceptions import ValidationError
        from django.contrib.auth import get_user_model
        if self.role.code in [Role.RoleCode.SUPER_ADMIN, Role.RoleCode.OWNER]:
            UserModel = get_user_model()
            other_active_owners = UserModel.objects.filter(
                is_active=True,
                role_branches__role__code__in=[Role.RoleCode.SUPER_ADMIN, Role.RoleCode.OWNER],
                role_branches__is_active=True,
            ).exclude(id=self.user_id).distinct().count()
            if other_active_owners < 1:
                raise ValidationError("Cannot demote or remove the role from the last remaining Owner / Super Admin account.")
        return super().delete(*args, **kwargs)


# ─── Custom User ──────────────────────────────────────────────────────────────

class User(AbstractBaseUser, PermissionsMixin, BaseModel):
    """
    Custom User model using email as the unique identifier.
    Supports: 2FA (TOTP + email OTP), SSO, multi-branch, multi-role.
    """

    class Language(models.TextChoices):
        ENGLISH = "en", _("English")
        URDU = "ur", _("اردو")

    class Theme(models.TextChoices):
        LIGHT = "light", _("Light")
        DARK = "dark", _("Dark")

    # ── Identity ──────────────────────────────────────────────────────────────
    email = models.EmailField(
        unique=True,
        db_index=True,
        verbose_name=_("Email Address"),
    )
    name = models.CharField(max_length=150, verbose_name=_("Full Name"))
    phone = models.CharField(max_length=20, blank=True, verbose_name=_("Phone"))
    avatar = models.ImageField(
        upload_to="avatars/%Y/%m/",
        null=True,
        blank=True,
        verbose_name=_("Avatar"),
    )
    employee_id = models.CharField(
        max_length=20,
        blank=True,
        db_index=True,
        verbose_name=_("Employee ID"),
        help_text=_("e.g. LF-0001"),
    )

    # ── Status ─────────────────────────────────────────────────────────────────
    is_active = models.BooleanField(default=True, verbose_name=_("Is Active"))
    is_staff = models.BooleanField(default=False, verbose_name=_("Is Staff (Admin)"))

    # ── Branch / Role (convenience FK to default branch) ─────────────────────
    default_branch = models.ForeignKey(
        "branches.Branch",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="default_users",
        verbose_name=_("Default Branch"),
    )

    # ── 2FA ───────────────────────────────────────────────────────────────────
    is_2fa_enabled = models.BooleanField(default=False, verbose_name=_("2FA Enabled"))
    totp_secret = models.CharField(
        max_length=64,
        blank=True,
        verbose_name=_("TOTP Secret"),
        help_text=_("Base32 encoded TOTP secret (stored encrypted in prod)."),
    )
    is_2fa_verified = models.BooleanField(
        default=False,
        help_text=_("True once user has confirmed their first TOTP code."),
    )

    # ── Preferences ───────────────────────────────────────────────────────────
    language = models.CharField(
        max_length=5,
        choices=Language.choices,
        default=Language.ENGLISH,
        verbose_name=_("Language"),
    )
    theme = models.CharField(
        max_length=10,
        choices=Theme.choices,
        default=Theme.LIGHT,
        verbose_name=_("Theme"),
    )

    # ── Login tracking ────────────────────────────────────────────────────────
    last_login_ip = models.GenericIPAddressField(null=True, blank=True)
    last_login_at = models.DateTimeField(null=True, blank=True)
    failed_login_count = models.PositiveSmallIntegerField(default=0)
    password_changed_at = models.DateTimeField(null=True, blank=True)
    must_change_password = models.BooleanField(default=False)

    # ── Notification preferences ──────────────────────────────────────────────
    notify_email = models.BooleanField(default=True)
    notify_whatsapp = models.BooleanField(default=False)
    notify_in_app = models.BooleanField(default=True)

    objects = UserManager()

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["name"]

    class Meta:
        db_table = "accounts_user"
        verbose_name = _("User")
        verbose_name_plural = _("Users")
        ordering = ["name"]
        indexes = [
            models.Index(fields=["email"], name="accounts_user_email_idx"),
            models.Index(fields=["is_active", "is_staff"], name="accounts_user_active_staff_idx"),
        ]

    def __str__(self) -> str:
        return f"{self.name} <{self.email}>"

    @property
    def is_owner(self) -> bool:
        """True if user has the owner role in any branch."""
        return self.role_branches.filter(
            role__code=Role.RoleCode.OWNER, is_active=True
        ).exists()

    @property
    def is_super_admin(self) -> bool:
        """True if user has the super_admin or owner role in any branch, or is superuser."""
        return self.role_branches.filter(
            role__code__in=[Role.RoleCode.SUPER_ADMIN, Role.RoleCode.OWNER], is_active=True
        ).exists() or self.is_superuser

    def delete(self, *args, **kwargs):
        from django.core.exceptions import ValidationError
        if self.is_super_admin:
            active_owners = User.objects.filter(
                is_active=True,
                role_branches__role__code__in=[Role.RoleCode.SUPER_ADMIN, Role.RoleCode.OWNER],
                role_branches__is_active=True,
            ).exclude(id=self.id).distinct().count()
            if active_owners < 1:
                raise ValidationError("Cannot delete the last remaining Owner / Super Admin account.")
        return super().delete(*args, **kwargs)

    def get_roles_for_branch(self, branch_id) -> list[str]:
        """Returns list of role codes this user has in a specific branch."""
        return list(
            self.role_branches.filter(branch_id=branch_id, is_active=True)
            .values_list("role__code", flat=True)
        )

    def has_module_permission_in_branch(
        self, module: str, action: str, branch_id
    ) -> bool:
        """
        Check if user has a specific action permission for a module in a branch.
        action: view | create | edit | delete | approve | export
        """
        if self.is_super_admin:
            return True
        role_codes = self.get_roles_for_branch(branch_id)
        if not role_codes:
            return False
        action_field = f"can_{action}"
        return ModulePermission.objects.filter(
            role__code__in=role_codes,
            module=module,
            **{action_field: True},
        ).exists()

    def generate_totp_secret(self) -> str:
        """Generate and store a new TOTP secret for the user."""
        secret = pyotp.random_base32()
        self.totp_secret = secret
        self.save(update_fields=["totp_secret"])
        return secret

    def get_totp_uri(self) -> str:
        """Return the TOTP provisioning URI for QR code generation."""
        return pyotp.totp.TOTP(self.totp_secret).provisioning_uri(
            name=self.email,
            issuer_name="Lahore Fashion ERP",
        )

    def verify_totp(self, code: str) -> bool:
        """Verify a 6-digit TOTP code. Allows ±1 step (30s window)."""
        if not self.totp_secret:
            return False
        totp = pyotp.TOTP(self.totp_secret)
        return totp.verify(code, valid_window=1)


# ─── OTP Challenge (email/SMS OTP for non-TOTP 2FA) ─────────────────────────

class OTPChallenge(models.Model):
    """
    Short-lived OTP challenge for email/SMS 2FA.
    Deleted on successful verify or expiry.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="otp_challenges",
        verbose_name=_("User"),
    )
    challenge_id = models.UUIDField(
        default=uuid.uuid4,
        unique=True,
        db_index=True,
        help_text=_("Returned to client after password auth; submitted with OTP."),
    )
    code = models.CharField(max_length=6, verbose_name=_("OTP Code"))
    delivery_method = models.CharField(
        max_length=10,
        choices=[("email", "Email"), ("sms", "SMS"), ("totp", "TOTP App")],
        default="email",
    )
    expires_at = models.DateTimeField()
    last_sent_at = models.DateTimeField(auto_now_add=True)
    is_used = models.BooleanField(default=False)
    attempt_count = models.PositiveSmallIntegerField(default=0)
    ip_address = models.GenericIPAddressField(null=True, blank=True)

    class Meta:
        db_table = "accounts_otp_challenge"
        verbose_name = _("OTP Challenge")
        indexes = [
            models.Index(fields=["challenge_id", "is_used"]),
        ]

    @property
    def is_expired(self) -> bool:
        return timezone.now() > self.expires_at

    @property
    def can_resend(self) -> bool:
        from django.conf import settings
        cooldown = getattr(settings, "OTP_RESEND_COOLDOWN_SECONDS", 60)
        diff = (timezone.now() - self.last_sent_at).total_seconds()
        return diff >= cooldown

    def __str__(self) -> str:
        return f"OTP for {self.user.email} [{'used' if self.is_used else 'pending'}]"


# ─── Login Audit ──────────────────────────────────────────────────────────────

class LoginAudit(models.Model):
    """
    Immutable log of every login attempt (success or failure).
    Never soft-deleted. Retained per data-retention policy.
    """

    class EventType(models.TextChoices):
        LOGIN_SUCCESS = "login_success", _("Login Success")
        LOGIN_FAILED = "login_failed", _("Login Failed")
        LOGOUT = "logout", _("Logout")
        PASSWORD_RESET = "password_reset", _("Password Reset")
        OTP_SENT = "otp_sent", _("OTP Sent")
        OTP_VERIFIED = "otp_verified", _("OTP Verified")
        OTP_FAILED = "otp_failed", _("OTP Failed")
        SESSION_EXPIRED = "session_expired", _("Session Expired")
        ACCOUNT_LOCKED = "account_locked", _("Account Locked")
        SSO_LOGIN = "sso_login", _("SSO Login")

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        User,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="login_audits",
    )
    email_attempted = models.EmailField(
        blank=True,
        help_text=_("Email entered even if user not found."),
    )
    event_type = models.CharField(max_length=30, choices=EventType.choices, db_index=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True, db_index=True)
    user_agent = models.TextField(blank=True)
    branch = models.ForeignKey(
        "branches.Branch",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
    )
    role_attempted = models.CharField(max_length=50, blank=True)
    detail = models.JSONField(default=dict, blank=True)
    timestamp = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        db_table = "accounts_login_audit"
        verbose_name = _("Login Audit")
        verbose_name_plural = _("Login Audits")
        ordering = ["-timestamp"]
        indexes = [
            models.Index(fields=["user", "timestamp"]),
            models.Index(fields=["ip_address", "timestamp"]),
            models.Index(fields=["event_type", "timestamp"]),
        ]

    def __str__(self) -> str:
        return f"{self.event_type} — {self.email_attempted} @ {self.timestamp}"
