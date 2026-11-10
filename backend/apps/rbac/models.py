"""
RBAC App — Enhanced Permission Model.

Permission = Module × Resource × Action × Scope + Field rules + Approval limits.
Extends the basic Role/ModulePermission from accounts app with:
  - Fine-grained actions (view, create, edit, delete, approve, reject, export, print, import, lock, configure)
  - Scope levels (own, team, section, department, branch, multi-branch, all)
  - Field-level policies (hide/mask salary, CNIC, bank, cost, rates, margins)
  - Data-level rules (dept isolation, client isolation)
  - Approval policies with amount thresholds
  - Maker-checker enforcement
  - Segregation of Duties (SoD) rules
  - Temporary elevation (break-glass)
  - Time/IP/device conditions
  - Delegation
"""
import uuid
from datetime import date
from decimal import Decimal

from django.conf import settings
from django.db import models
from django.utils import timezone
from django.utils.translation import gettext_lazy as _
from django.core.validators import MinValueValidator

from apps.core.models import BaseModel, SoftDeleteModel


# ═══════════════════════════════════════════════════════════════════════════════
# §1  PERMISSION MODEL
# ═══════════════════════════════════════════════════════════════════════════════


class Permission(SoftDeleteModel):
    """
    Fine-grained permission: Module × Resource × Action × Scope.
    Each row represents one atomic permission.
    """

    class Module(models.TextChoices):
        DASHBOARD = "dashboard", _("Main Command Center")
        ORDERS = "orders", _("Orders")
        PRODUCTION = "production", _("Production")
        PLANNING = "planning", _("Planning")
        INVENTORY = "inventory", _("Inventory / Stores")
        QUALITY = "quality", _("Quality Control")
        HR_EMPLOYEE = "hr_employee", _("HR — Employee Master")
        HR_RECRUITMENT = "hr_recruitment", _("HR — Recruitment")
        ATTENDANCE = "attendance", _("Attendance & Shifts")
        LEAVE = "leave", _("Leave Management")
        PAYROLL = "payroll", _("Payroll")
        ADVANCES = "advances", _("Advances / Loans / Fines")
        CONTRACTORS = "contractors", _("Contractor Management")
        PERFORMANCE = "performance", _("Performance & Productivity")
        TRAINING = "training", _("Training & Safety")
        DISCIPLINE = "discipline", _("Discipline & Grievance")
        SEPARATION = "separation", _("Exit / Separation")
        COMPLIANCE = "compliance", _("Compliance & Registers")
        LEDGER = "ledger", _("Ledger / Invoices / Payments")
        COSTING = "costing", _("Costing / Profit")
        MAINTENANCE = "maintenance", _("Maintenance")
        REPORTS = "reports", _("Reports & Analytics")
        SETTINGS = "settings", _("Settings / Users / Roles")
        AUDIT = "audit", _("Audit Logs")
        CLIENTS = "clients", _("Clients")
        DELIVERY = "delivery", _("Delivery / Dispatch")

    class Action(models.TextChoices):
        VIEW = "view", _("View")
        CREATE = "create", _("Create")
        EDIT = "edit", _("Edit")
        DELETE = "delete", _("Delete (Soft)")
        APPROVE = "approve", _("Approve")
        REJECT = "reject", _("Reject")
        EXPORT = "export", _("Export")
        PRINT = "print", _("Print")
        IMPORT = "import", _("Import")
        LOCK = "lock", _("Lock / Unlock")
        CONFIGURE = "configure", _("Configure")
        IMPERSONATE = "impersonate_view", _("Impersonate View (Read-Only)")

    class Scope(models.TextChoices):
        OWN = "own", _("Own Records")
        TEAM = "team", _("Direct Reports")
        SECTION = "section", _("Section")
        DEPARTMENT = "department", _("Department")
        BRANCH = "branch", _("Branch")
        MULTI_BRANCH = "multi_branch", _("Multi-Branch")
        ALL = "all", _("All")

    module = models.CharField(max_length=30, choices=Module.choices, db_index=True)
    resource = models.CharField(
        max_length=50, blank=True, db_index=True,
        help_text=_("Sub-resource e.g. 'salary_tab', 'payslip', 'bank_file'"),
    )
    action = models.CharField(max_length=20, choices=Action.choices)
    scope = models.CharField(max_length=15, choices=Scope.choices, default=Scope.BRANCH)
    description = models.CharField(max_length=200, blank=True)

    class Meta:
        db_table = "rbac_permission"
        verbose_name = _("Permission")
        verbose_name_plural = _("Permissions")
        unique_together = [("module", "resource", "action", "scope")]
        ordering = ["module", "resource", "action"]

    def __str__(self):
        res = f".{self.resource}" if self.resource else ""
        return f"{self.module}{res}:{self.action}@{self.scope}"


class RBACRole(SoftDeleteModel):
    """
    Extended role definition with hierarchy.
    Linked to accounts.Role for backward compatibility.
    """
    code = models.CharField(max_length=50, unique=True, db_index=True)
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    hierarchy_level = models.PositiveSmallIntegerField(
        default=50,
        help_text=_("1 = Owner (highest), 100 = Worker (lowest)"),
    )
    is_system_role = models.BooleanField(default=False)
    requires_2fa = models.BooleanField(default=False)
    session_timeout_minutes = models.PositiveIntegerField(
        default=30, help_text=_("Session timeout for this role"),
    )
    max_concurrent_sessions = models.PositiveSmallIntegerField(default=3)
    # Link to legacy Role
    legacy_role = models.OneToOneField(
        "accounts.Role", null=True, blank=True, on_delete=models.SET_NULL,
        related_name="rbac_role",
    )
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = "rbac_role"
        verbose_name = _("RBAC Role")
        verbose_name_plural = _("RBAC Roles")
        ordering = ["hierarchy_level", "name"]

    def __str__(self):
        return f"{self.code} — {self.name} (L{self.hierarchy_level})"


class RolePermission(BaseModel):
    """Maps permissions to roles."""
    role = models.ForeignKey(
        RBACRole, on_delete=models.CASCADE, related_name="role_permissions",
    )
    permission = models.ForeignKey(
        Permission, on_delete=models.CASCADE, related_name="role_permissions",
    )
    granted = models.BooleanField(default=True)
    conditions = models.JSONField(
        default=dict, blank=True,
        help_text=_("Additional conditions: time, IP, device, etc."),
    )

    class Meta:
        db_table = "rbac_role_permission"
        unique_together = [("role", "permission")]
        ordering = ["role", "permission"]

    def __str__(self):
        status = "✓" if self.granted else "✗"
        return f"{status} {self.role.code} → {self.permission}"


class UserRoleAssignment(BaseModel):
    """Assigns roles to users with branch scope."""
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
        related_name="rbac_role_assignments",
    )
    role = models.ForeignKey(
        RBACRole, on_delete=models.CASCADE, related_name="user_assignments",
    )
    branch = models.ForeignKey(
        "branches.Branch", null=True, blank=True, on_delete=models.CASCADE,
        help_text=_("Null = all branches (for Owner/Group Admin)"),
    )
    department = models.ForeignKey(
        "hr.Department", null=True, blank=True, on_delete=models.SET_NULL,
        help_text=_("Null = all departments in branch"),
    )
    is_active = models.BooleanField(default=True)
    assigned_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL,
        related_name="role_assignments_made_rbac",
    )
    valid_from = models.DateField(null=True, blank=True)
    valid_to = models.DateField(null=True, blank=True)

    class Meta:
        db_table = "rbac_user_role_assignment"
        ordering = ["-created_at"]

    def __str__(self):
        br = self.branch.code if self.branch else "ALL"
        return f"{self.user.email} → {self.role.code} @ {br}"


# ═══════════════════════════════════════════════════════════════════════════════
# §2  FIELD-LEVEL SECURITY
# ═══════════════════════════════════════════════════════════════════════════════


class FieldPolicy(SoftDeleteModel):
    """
    Field-level security: hide or mask fields per role.
    E.g. salary_tab only visible to HR/Owner; CNIC masked for non-HR.
    """

    class FieldAction(models.TextChoices):
        HIDE = "hide", _("Hide Completely")
        MASK = "mask", _("Mask (show ****)")
        READ_ONLY = "read_only", _("Read Only")
        FULL = "full", _("Full Access")

    role = models.ForeignKey(
        RBACRole, on_delete=models.CASCADE, related_name="field_policies",
    )
    module = models.CharField(max_length=30, choices=Permission.Module.choices)
    field_name = models.CharField(
        max_length=100,
        help_text=_("Dot-separated path, e.g. 'employee.basic_salary', 'employee.cnic'"),
    )
    field_action = models.CharField(max_length=10, choices=FieldAction.choices)

    class Meta:
        db_table = "rbac_field_policy"
        unique_together = [("role", "module", "field_name")]
        ordering = ["role", "module", "field_name"]

    def __str__(self):
        return f"{self.role.code}: {self.module}.{self.field_name} → {self.field_action}"


# ═══════════════════════════════════════════════════════════════════════════════
# §3  APPROVAL POLICIES (Amount Thresholds)
# ═══════════════════════════════════════════════════════════════════════════════


class ApprovalPolicy(SoftDeleteModel):
    """
    Amount/quantity thresholds per role for approval workflows.
    E.g. Production Manager approves stock adjustment ≤ PKR 50k; above → GM.
    """
    module = models.CharField(max_length=30, choices=Permission.Module.choices)
    action = models.CharField(max_length=50, help_text=_("E.g. 'stock_adjustment', 'advance_approval'"))
    role = models.ForeignKey(
        RBACRole, on_delete=models.CASCADE, related_name="approval_policies",
    )
    max_amount = models.DecimalField(
        max_digits=16, decimal_places=2, null=True, blank=True,
        help_text=_("Max amount this role can approve; null = unlimited"),
    )
    max_quantity = models.DecimalField(
        max_digits=14, decimal_places=4, null=True, blank=True,
    )
    escalate_to_role = models.ForeignKey(
        RBACRole, null=True, blank=True, on_delete=models.SET_NULL,
        related_name="escalation_policies",
        help_text=_("Role to escalate to when threshold exceeded"),
    )

    class Meta:
        db_table = "rbac_approval_policy"
        unique_together = [("module", "action", "role")]
        ordering = ["module", "action"]

    def __str__(self):
        limit = f"≤ {self.max_amount}" if self.max_amount else "unlimited"
        return f"{self.role.code}: {self.module}.{self.action} {limit}"


# ═══════════════════════════════════════════════════════════════════════════════
# §4  SEGREGATION OF DUTIES (SoD)
# ═══════════════════════════════════════════════════════════════════════════════


class SegregationOfDutyRule(SoftDeleteModel):
    """
    Enforced SoD rules:
    - Payroll preparer ≠ approver ≠ payer
    - Purchase raiser ≠ GRN receiver ≠ bill approver
    - Stock adjuster ≠ approver
    - etc.
    """
    code = models.CharField(max_length=20, unique=True, db_index=True)
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    conflicting_permissions = models.JSONField(
        help_text=_("List of permission pairs that cannot be held by the same user. "
                     "Format: [{'perm_a': 'payroll:create', 'perm_b': 'payroll:approve'}]"),
    )
    is_active = models.BooleanField(default=True)
    severity = models.CharField(
        max_length=10,
        choices=[("error", "Block"), ("warning", "Warn Only")],
        default="error",
    )

    class Meta:
        db_table = "rbac_sod_rule"
        ordering = ["code"]

    def __str__(self):
        return f"{self.code} — {self.name}"


# ═══════════════════════════════════════════════════════════════════════════════
# §5  TEMPORARY ELEVATION (Break-Glass)
# ═══════════════════════════════════════════════════════════════════════════════


class BreakGlassAccess(BaseModel):
    """
    Temporary elevated access with reason and auto-expiry.
    Alert sent to Owner on every break-glass event.
    """
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
        related_name="break_glass_events",
    )
    role = models.ForeignKey(
        RBACRole, on_delete=models.CASCADE, related_name="break_glass_grants",
    )
    reason = models.TextField()
    granted_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL,
        related_name="break_glass_grants_given",
    )
    expires_at = models.DateTimeField()
    is_active = models.BooleanField(default=True)
    revoked_at = models.DateTimeField(null=True, blank=True)
    revoked_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL,
        related_name="break_glass_revocations",
    )

    class Meta:
        db_table = "rbac_break_glass"
        ordering = ["-created_at"]

    def __str__(self):
        return f"Break-Glass: {self.user.email} → {self.role.code} (exp {self.expires_at})"

    @property
    def is_expired(self):
        return timezone.now() > self.expires_at


# ═══════════════════════════════════════════════════════════════════════════════
# §6  ACCESS CONDITION RULES (Time/IP/Device)
# ═══════════════════════════════════════════════════════════════════════════════


class AccessCondition(SoftDeleteModel):
    """
    Time/IP/device conditions for access control.
    E.g. office-hours only for finance export; IP allow-list for admin.
    """
    role = models.ForeignKey(
        RBACRole, on_delete=models.CASCADE, related_name="access_conditions",
    )
    condition_type = models.CharField(
        max_length=15,
        choices=[
            ("time", "Time Window"), ("ip", "IP Allow-List"),
            ("device", "Device Bound"),
        ],
    )
    # Time conditions
    allowed_start_time = models.TimeField(null=True, blank=True)
    allowed_end_time = models.TimeField(null=True, blank=True)
    allowed_days = models.JSONField(
        default=list, blank=True,
        help_text=_("Days of week: [1,2,3,4,5] = Mon-Fri"),
    )
    # IP conditions
    allowed_ips = models.JSONField(
        default=list, blank=True,
        help_text=_("CIDR list: ['192.168.1.0/24', '10.0.0.0/8']"),
    )
    # Device conditions
    allowed_device_ids = models.JSONField(default=list, blank=True)
    # Apply to specific module/action
    module = models.CharField(
        max_length=30, blank=True, choices=Permission.Module.choices,
        help_text=_("Blank = all modules"),
    )
    action = models.CharField(max_length=20, blank=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = "rbac_access_condition"
        ordering = ["role", "condition_type"]

    def __str__(self):
        return f"{self.role.code}: {self.condition_type}"


# ═══════════════════════════════════════════════════════════════════════════════
# §7  PERMISSION CHANGE AUDIT
# ═══════════════════════════════════════════════════════════════════════════════


class PermissionChangeLog(BaseModel):
    """
    Immutable audit log of every permission change.
    Who gave what, when, to whom.
    """

    class ChangeType(models.TextChoices):
        GRANT = "grant", _("Permission Granted")
        REVOKE = "revoke", _("Permission Revoked")
        ROLE_ASSIGN = "role_assign", _("Role Assigned")
        ROLE_REMOVE = "role_remove", _("Role Removed")
        FIELD_POLICY = "field_policy", _("Field Policy Changed")
        APPROVAL_POLICY = "approval_policy", _("Approval Policy Changed")
        BREAK_GLASS = "break_glass", _("Break-Glass Access")
        DELEGATION = "delegation", _("Delegation Created/Removed")

    change_type = models.CharField(max_length=20, choices=ChangeType.choices)
    changed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True,
        related_name="permission_changes_made",
    )
    affected_user = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL,
        related_name="permission_changes_received",
    )
    affected_role = models.ForeignKey(
        RBACRole, null=True, blank=True, on_delete=models.SET_NULL,
    )
    detail = models.JSONField(default=dict, help_text=_("Full change details"))
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)

    class Meta:
        db_table = "rbac_permission_change_log"
        ordering = ["-created_at"]
        # No delete allowed
        managed = True

    def __str__(self):
        return f"{self.change_type} by {self.changed_by} @ {self.created_at}"

    def delete(self, *args, **kwargs):
        raise PermissionError("Permission change logs cannot be deleted.")


# ═══════════════════════════════════════════════════════════════════════════════
# §8  ACCESS REVIEW
# ═══════════════════════════════════════════════════════════════════════════════


class AccessReview(BaseModel):
    """Quarterly access review report."""

    class ReviewStatus(models.TextChoices):
        PENDING = "pending", _("Pending")
        IN_PROGRESS = "in_progress", _("In Progress")
        COMPLETED = "completed", _("Completed")

    title = models.CharField(max_length=200)
    review_date = models.DateField()
    quarter = models.CharField(max_length=6, help_text=_("E.g. 2024-Q1"))
    status = models.CharField(
        max_length=15, choices=ReviewStatus.choices, default=ReviewStatus.PENDING,
    )
    reviewer = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL,
    )
    findings = models.JSONField(default=list, blank=True)
    report_file = models.FileField(
        upload_to="rbac/access_reviews/", null=True, blank=True,
    )
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "rbac_access_review"
        ordering = ["-review_date"]

    def __str__(self):
        return f"Access Review {self.quarter} — {self.status}"


class ExportLog(BaseModel):
    """Logging for sensitive data exports with reason."""
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True,
    )
    module = models.CharField(max_length=30)
    export_type = models.CharField(max_length=20, help_text=_("csv, pdf, xlsx"))
    record_count = models.PositiveIntegerField(default=0)
    reason = models.TextField(blank=True)
    contains_pii = models.BooleanField(default=False)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    file_hash = models.CharField(max_length=64, blank=True)

    class Meta:
        db_table = "rbac_export_log"
        ordering = ["-created_at"]

    def __str__(self):
        return f"Export {self.module} by {self.user} @ {self.created_at}"


# ═══════════════════════════════════════════════════════════════════════════════
# §9  ALIASES & BACKWARD COMPATIBILITY
# ═══════════════════════════════════════════════════════════════════════════════

Role = RBACRole
SoDRule = SegregationOfDutyRule
PermissionAuditLog = PermissionChangeLog
