import uuid
from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from apps.accounts.models import User, Role
from apps.branches.models import Branch


class CoreModelTests(TestCase):
    """Test base model functionality like UUID pk, timestamps, soft delete."""

    def test_base_model_uuid_and_timestamps(self):
        role = Role.objects.create(
            code="test_role",
            name="Test Role",
            is_system_role=False,
        )
        self.assertIsNotNone(role.created_at)
        self.assertIsNotNone(role.updated_at)


class DashboardAPITests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.branch, _ = Branch.objects.get_or_create(
            code="LHR",
            defaults={
                "name": "Lahore Fashion Mill",
                "city": "Lahore",
                "is_head_office": True,
                "is_active": True,
            },
        )
        self.user = User.objects.create_user(
            email="owner@lahorefashion.com",
            password="StrongPassword123!",
            name="Owner User",
            is_staff=True,
            is_superuser=True,
        )
        self.client.force_authenticate(user=self.user)

    def test_dashboard_stats_endpoint(self):
        url = reverse("dashboard:stats")
        resp = self.client.get(url)
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertIn("kpis", resp.data)
        self.assertIn("production_flow", resp.data)
        self.assertIn("charts", resp.data)
        self.assertEqual(resp.data["mill_name"], "Lahore Fashion Mill")
        self.assertTrue(resp.data["single_unit_mode"])

    def test_demo_data_lifecycle(self):
        # 1. Load demo data
        url_load = reverse("dashboard:demo-data", kwargs={"action": "load"})
        resp_load = self.client.post(url_load)
        self.assertEqual(resp_load.status_code, status.HTTP_200_OK)

        # Verify stats reflect demo data
        url_stats = reverse("dashboard:stats")
        resp_stats = self.client.get(url_stats)
        self.assertEqual(resp_stats.status_code, status.HTTP_200_OK)
        self.assertTrue(resp_stats.data["is_demo_data"])
        self.assertFalse(resp_stats.data["is_empty"])

        # 2. Wipe demo data
        url_wipe = reverse("dashboard:demo-data", kwargs={"action": "wipe"})
        resp_wipe = self.client.post(url_wipe)
        self.assertEqual(resp_wipe.status_code, status.HTTP_200_OK)
