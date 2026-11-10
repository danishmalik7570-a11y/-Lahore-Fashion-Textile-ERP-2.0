import uuid
from django.test import TestCase, override_settings
from django.urls import reverse
from django.core.exceptions import ValidationError
from rest_framework import status
from rest_framework.test import APIClient

from apps.accounts.models import Role, User, UserRoleBranch
from apps.branches.models import Branch
from apps.portals.models import (
    Portal,
    PortalAccessLog,
    PortalNavItem,
    PortalDashboardLayout,
)


class PortalIntegrationTests(TestCase):
    databases = ["default"]

    def setUp(self):
        self.client = APIClient()
        self.branch = Branch.objects.filter(is_head_office=True).first()
        if not self.branch:
            self.branch = Branch.objects.create(
                name="Lahore Head Office",
                code="LHE-HO",
                city="Lahore",
                is_active=True,
            )

        # Ensure system roles exist
        self.role_owner, _ = Role.objects.get_or_create(
            code=Role.RoleCode.OWNER,
            defaults={"name": "Owner / Executive", "is_system_role": True},
        )
        self.role_super_admin, _ = Role.objects.get_or_create(
            code=Role.RoleCode.SUPER_ADMIN,
            defaults={"name": "Super Admin", "is_system_role": True},
        )
        self.role_hr_mgr, _ = Role.objects.get_or_create(
            code=Role.RoleCode.HR_MANAGER,
            defaults={"name": "HR Manager", "is_system_role": True},
        )
        self.role_prod_mgr, _ = Role.objects.get_or_create(
            code=Role.RoleCode.PRODUCTION_MANAGER,
            defaults={"name": "Production Manager", "is_system_role": True},
        )
        self.role_worker, _ = Role.objects.get_or_create(
            code=Role.RoleCode.WORKER,
            defaults={"name": "Worker", "is_system_role": True},
        )

        # Users: Owner accounts (keep at least 2)
        self.owner_user = User.objects.create_user(
            email="owner@lahorefashion.com",
            password="Password123!",
            name="Mian Tariq Saigol",
            default_branch=self.branch,
        )
        UserRoleBranch.objects.create(
            user=self.owner_user,
            role=self.role_owner,
            branch=self.branch,
            is_active=True,
        )

        self.owner_user_2 = User.objects.create_user(
            email="executive.director@lahorefashion.com",
            password="Password123!",
            name="Executive Director",
            default_branch=self.branch,
        )
        UserRoleBranch.objects.create(
            user=self.owner_user_2,
            role=self.role_owner,
            branch=self.branch,
            is_active=True,
        )

        self.hr_user = User.objects.create_user(
            email="hr.manager@lahorefashion.com",
            password="Password123!",
            name="Ayesha Khan",
            default_branch=self.branch,
        )
        UserRoleBranch.objects.create(
            user=self.hr_user,
            role=self.role_hr_mgr,
            branch=self.branch,
            is_active=True,
        )

        self.worker_user = User.objects.create_user(
            email="worker.aslam@lahorefashion.com",
            password="Password123!",
            name="Muhammad Aslam",
            default_branch=self.branch,
        )
        UserRoleBranch.objects.create(
            user=self.worker_user,
            role=self.role_worker,
            branch=self.branch,
            is_active=True,
        )

        self.gm_user = User.objects.create_user(
            email="gm.executive@lahorefashion.com",
            password="Password123!",
            name="Tariq Mansoor",
            default_branch=self.branch,
        )
        UserRoleBranch.objects.create(
            user=self.gm_user,
            role=self.role_super_admin,
            branch=self.branch,
            is_active=True,
        )

        # Portals
        self.owner_portal = Portal.objects.create(
            code="OWNER",
            name="Owner OS",
            slug="owner",
            login_title="Owner OS — Executive Command Center",
            login_subtitle="Consolidated 4-Mill Executive Governance",
            allowed_roles=["owner", "super_admin"],
            require_2fa=False,
            session_timeout_minutes=30,
            is_active=True,
        )
        PortalNavItem.objects.create(
            portal=self.owner_portal,
            module="owner",
            label="Executive Command",
            route="/portal/owner/dashboard",
            order=1,
        )

        self.hr_portal = Portal.objects.create(
            code="HR",
            name="HR OS",
            slug="hr",
            login_title="HR OS — People & Payroll",
            login_subtitle="Secure access for HR",
            allowed_roles=["hr_manager"],
            require_2fa=False,
            session_timeout_minutes=15,
            is_active=True,
        )
        PortalNavItem.objects.create(
            portal=self.hr_portal,
            module="hr",
            label="Employees",
            route="/portal/hr/employees",
            order=1,
        )
        PortalDashboardLayout.objects.create(
            portal=self.hr_portal,
            layout_json={"rows": [["HR-W01", "HR-W02"]]},
            version=1,
        )

        self.manager_portal = Portal.objects.create(
            code="MANAGER",
            name="Manager OS",
            slug="manager",
            login_title="Manager OS — Operations Control",
            login_subtitle="Plan, track and control production",
            allowed_roles=["production_manager", "branch_admin"],
            require_2fa=False,
            session_timeout_minutes=60,
            is_active=True,
        )

    def test_hr_user_can_login_to_hr_portal(self):
        url = reverse("portal-login", kwargs={"portal_slug": "hr"})
        response = self.client.post(
            url,
            {"email": "hr.manager@lahorefashion.com", "password": "Password123!"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("access", response.data)
        self.assertEqual(response.data["portal"]["slug"], "hr")
        self.assertEqual(response.data["user"]["primary_role"], "hr_manager")

        # Check access audit log
        log_entry = PortalAccessLog.objects.filter(
            portal_slug="hr", event=PortalAccessLog.Event.LOGIN_SUCCESS
        ).first()
        self.assertIsNotNone(log_entry)
        self.assertEqual(log_entry.user, self.hr_user)

    def test_worker_denied_access_to_hr_portal(self):
        url = reverse("portal-login", kwargs={"portal_slug": "hr"})
        response = self.client.post(
            url,
            {"email": "worker.aslam@lahorefashion.com", "password": "Password123!"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(response.data["code"], "wrong_portal_access_denied")

        # Verify access denial is recorded in audit log
        log_entry = PortalAccessLog.objects.filter(
            portal_slug="hr", event=PortalAccessLog.Event.WRONG_PORTAL_DENIED
        ).first()
        self.assertIsNotNone(log_entry)
        self.assertEqual(log_entry.user, self.worker_user)

    def test_2fa_disabled_by_default_login_succeeds_without_challenge(self):
        """
        With AUTH_2FA_ENABLED=False (default everywhere), login succeeds with email+password only,
        even if portal or role previously specified require_2fa=True.
        """
        self.hr_portal.require_2fa = True
        self.hr_portal.save()

        url = reverse("portal-login", kwargs={"portal_slug": "hr"})
        resp = self.client.post(
            url,
            {"email": "hr.manager@lahorefashion.com", "password": "Password123!"},
            format="json",
        )
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        # 2FA challenge is bypassed and tokens are returned immediately
        self.assertFalse(resp.data.get("requires_2fa", False))
        self.assertIn("access", resp.data)

    @override_settings(AUTH_2FA_ENABLED=True)
    def test_2fa_dormant_switch_can_be_re_enabled(self):
        """
        Verifies 2FA logic is dormant behind flag: when AUTH_2FA_ENABLED=True,
        portal with require_2fa=True issues the challenge.
        """
        self.hr_portal.require_2fa = True
        self.hr_portal.save()

        url = reverse("portal-login", kwargs={"portal_slug": "hr"})
        resp = self.client.post(
            url,
            {"email": "hr.manager@lahorefashion.com", "password": "Password123!"},
            format="json",
        )
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertTrue(resp.data.get("requires_2fa"))
        self.assertIn("challenge_id", resp.data)

    def test_owner_role_access_to_all_portals(self):
        """
        Role 'owner' has full access across all portals (owner, hr, manager)
        with email + password only.
        """
        # 1. Login to Owner OS
        url_owner = reverse("portal-login", kwargs={"portal_slug": "owner"})
        resp_owner = self.client.post(
            url_owner,
            {"email": "owner@lahorefashion.com", "password": "Password123!"},
            format="json",
        )
        self.assertEqual(resp_owner.status_code, status.HTTP_200_OK)
        self.assertIn("access", resp_owner.data)

        # 2. Login to HR OS as Owner
        url_hr = reverse("portal-login", kwargs={"portal_slug": "hr"})
        resp_hr = self.client.post(
            url_hr,
            {"email": "owner@lahorefashion.com", "password": "Password123!"},
            format="json",
        )
        self.assertEqual(resp_hr.status_code, status.HTTP_200_OK)
        self.assertIn("access", resp_hr.data)

        # 3. Login to Manager OS as Owner
        url_mgr = reverse("portal-login", kwargs={"portal_slug": "manager"})
        resp_mgr = self.client.post(
            url_mgr,
            {"email": "owner@lahorefashion.com", "password": "Password123!"},
            format="json",
        )
        self.assertEqual(resp_mgr.status_code, status.HTTP_200_OK)
        self.assertIn("access", resp_mgr.data)

    def test_portals_me_returns_all_portals_for_owner(self):
        # Authenticate Owner user
        self.client.force_authenticate(user=self.owner_user)
        resp = self.client.get(reverse("portals-me"))
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        portal_slugs = [p["slug"] for p in resp.data["portals"]]
        self.assertIn("owner", portal_slugs)
        self.assertIn("hr", portal_slugs)
        self.assertIn("manager", portal_slugs)

    def test_portal_bootstrap_endpoint(self):
        self.client.force_authenticate(user=self.hr_user)
        url = reverse("portal-bootstrap", kwargs={"portal_slug": "hr"})
        resp = self.client.get(url)
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data["portal"]["slug"], "hr")
        self.assertTrue(len(resp.data["navigation"]) >= 1)
        self.assertIn("rows", resp.data["layout"])

    def test_step_up_auth_endpoint(self):
        self.client.force_authenticate(user=self.hr_user)
        url = reverse("portal-step-up", kwargs={"portal_slug": "hr"})
        resp = self.client.post(
            url,
            {"password": "Password123!", "action": "payroll_approve"},
            format="json",
        )
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertTrue(resp.data["success"])
        self.assertIn("step_up_token", resp.data)

        # Verify audit log
        log = PortalAccessLog.objects.filter(
            portal_slug="hr", event=PortalAccessLog.Event.STEP_UP_VERIFIED
        ).first()
        self.assertIsNotNone(log)
        self.assertEqual(log.details["action"], "payroll_approve")

    def test_last_owner_cannot_be_deleted(self):
        """
        Verify account protection: At least 2 owner/super_admin accounts exist;
        the last one cannot be deleted.
        """
        # Delete first owner -> succeeds because owner_user_2 and gm_user still exist
        self.owner_user.delete()

        # Delete gm_user -> succeeds because owner_user_2 still exists
        self.gm_user.delete()

        # Attempt to delete the last remaining owner -> must raise ValidationError
        with self.assertRaises(ValidationError):
            self.owner_user_2.delete()
