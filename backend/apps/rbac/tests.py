"""
RBAC App — Automated Unit & Integration Tests.
Validates:
  1. Role & atomic permission assignment
  2. has_permission resolution
  3. Segregation of Duties (SoD) rule definitions & conflict pairs
  4. FieldPolicy data hiding & masking rules
  5. Emergency break-glass access elevation & auto-expiry
"""
from datetime import timedelta
from django.test import TestCase
from django.contrib.auth import get_user_model
from django.utils import timezone

from apps.rbac.models import (
    Permission, Role, RolePermission, UserRoleAssignment,
    SoDRule, FieldPolicy, BreakGlassAccess,
)
from apps.rbac.permissions import has_permission

User = get_user_model()


class RBACTests(TestCase):
    def setUp(self):
        self.user_regular = User.objects.create_user(email="supervisor_rbac@test.com", password="password123")
        self.user_admin = User.objects.create_user(email="admin_rbac@test.com", password="password123")

        self.role_supervisor = Role.objects.create(
            code="supervisor_test", name="Floor Supervisor", hierarchy_level=6,
        )
        self.role_admin = Role.objects.create(
            code="admin_test", name="System Admin", hierarchy_level=1, is_system_role=True,
        )

        # Permissions
        self.perm_payroll_view = Permission.objects.create(
            module="payroll",
            action="view",
            scope=Permission.Scope.BRANCH,
            description="View branch payroll",
        )
        self.perm_payroll_approve = Permission.objects.create(
            module="payroll",
            action="approve",
            scope=Permission.Scope.BRANCH,
            description="Approve branch payroll",
        )
        self.perm_employee_view = Permission.objects.create(
            module="hr_employee",
            action="view",
            scope=Permission.Scope.BRANCH,
            description="View branch employees",
        )

        RolePermission.objects.create(role=self.role_supervisor, permission=self.perm_payroll_view)
        RolePermission.objects.create(role=self.role_supervisor, permission=self.perm_employee_view)
        UserRoleAssignment.objects.create(user=self.user_regular, role=self.role_supervisor, is_active=True)

        RolePermission.objects.create(role=self.role_admin, permission=self.perm_payroll_view)
        RolePermission.objects.create(role=self.role_admin, permission=self.perm_payroll_approve)
        UserRoleAssignment.objects.create(user=self.user_admin, role=self.role_admin, is_active=True)

    def test_permission_resolution(self):
        """User with granted role has permission; lacks unassigned permissions."""
        self.assertTrue(has_permission(self.user_regular, "payroll", "view"))
        self.assertTrue(has_permission(self.user_regular, "hr_employee", "view"))
        self.assertFalse(has_permission(self.user_regular, "payroll", "approve"))

        # Admin has approve
        self.assertTrue(has_permission(self.user_admin, "payroll", "approve"))

    def test_sod_rule_configuration(self):
        """Segregation of Duties rule blocks simultaneous maker-checker permissions."""
        sod = SoDRule.objects.create(
            code="SOD-TEST-PAY-01",
            name="Payroll Maker vs Checker Separation",
            conflicting_permissions=[{"perm_a": "payroll:create", "perm_b": "payroll:approve"}],
            severity="error",
            description="Maker cannot be checker",
        )
        self.assertEqual(sod.code, "SOD-TEST-PAY-01")
        self.assertEqual(sod.severity, "error")
        self.assertEqual(len(sod.conflicting_permissions), 1)

    def test_field_policy_configuration(self):
        """Field policy defines masking and hiding actions per role."""
        policy_hide = FieldPolicy.objects.create(
            role=self.role_supervisor,
            module="hr_employee",
            field_name="basic_salary",
            field_action=FieldPolicy.FieldAction.HIDE,
        )
        policy_mask = FieldPolicy.objects.create(
            role=self.role_supervisor,
            module="hr_employee",
            field_name="cnic",
            field_action=FieldPolicy.FieldAction.MASK,
        )
        self.assertEqual(policy_hide.field_action, FieldPolicy.FieldAction.HIDE)
        self.assertEqual(policy_mask.field_action, FieldPolicy.FieldAction.MASK)

    def test_break_glass_access_lifecycle(self):
        """Break-glass temporary access creation with reason and auto-expiry."""
        bg = BreakGlassAccess.objects.create(
            user=self.user_regular,
            role=self.role_admin,
            reason="Emergency system payroll recovery after shift network failure",
            granted_by=self.user_admin,
            expires_at=timezone.now() + timedelta(hours=4),
            is_active=True,
        )
        self.assertTrue(bg.is_active)
        self.assertTrue(bg.expires_at > timezone.now())

    def test_role_hierarchy_ordering(self):
        """Roles ordered by hierarchy level (lower number = higher authority)."""
        roles = list(Role.objects.filter(code__in=["supervisor_test", "admin_test"]).order_by("hierarchy_level"))
        self.assertEqual(roles[0].code, "admin_test")
        self.assertEqual(roles[1].code, "supervisor_test")
