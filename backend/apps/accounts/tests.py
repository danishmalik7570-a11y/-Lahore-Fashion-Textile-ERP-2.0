import uuid
from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status

from apps.accounts.models import User, Role, ModulePermission, UserRoleBranch
from apps.branches.models import Branch


class AccountsAuthTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.branch = Branch.objects.filter(is_head_office=True).first()
        if not self.branch:
            self.branch = Branch.objects.create(
                code="LHR-01",
                name="Lahore Main Factory",
                city="Lahore",
                is_head_office=True,
                is_active=True,
            )
        self.role = Role.objects.create(
            code=Role.RoleCode.SUPER_ADMIN,
            name="Super Admin",
            is_system_role=True,
        )
        self.user = User.objects.create_user(
            email="admin@lahorefashion.com",
            password="StrongPassword123!",
            name="Admin User",
            is_active=True,
        )
        UserRoleBranch.objects.create(
            user=self.user,
            role=self.role,
            branch=self.branch,
        )

    def test_user_creation_and_auth(self):
        self.assertEqual(self.user.email, "admin@lahorefashion.com")
        self.assertTrue(self.user.check_password("StrongPassword123!"))
        self.assertFalse(self.user.is_superuser)

    def test_login_endpoint(self):
        url = reverse("auth:login")
        response = self.client.post(
            url,
            {
                "email": "admin@lahorefashion.com",
                "password": "StrongPassword123!",
                "role": self.role.code,
                "branch_id": str(self.branch.id),
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("access", response.data)
        self.assertIn("refresh", response.data)

    def test_login_invalid_password(self):
        url = reverse("auth:login")
        response = self.client.post(
            url,
            {
                "email": "admin@lahorefashion.com",
                "password": "WrongPassword!",
                "role": self.role.code,
                "branch_id": str(self.branch.id),
            },
            format="json",
        )
        self.assertIn(response.status_code, [status.HTTP_400_BAD_REQUEST, status.HTTP_401_UNAUTHORIZED])
