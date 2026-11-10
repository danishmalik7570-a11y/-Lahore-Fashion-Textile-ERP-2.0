from django.test import TestCase
from django.conf import settings
from apps.branches.models import Branch


class BranchTests(TestCase):
    def test_branch_creation(self):
        branch = Branch.objects.create(
            code="KHI-01",
            name="Karachi Hub",
            city="Karachi",
            is_head_office=False,
            is_active=True,
        )
        self.assertEqual(str(branch), "Karachi Hub (KHI-01)")
        self.assertFalse(branch.is_head_office)

    def test_single_unit_mode_setting(self):
        self.assertTrue(getattr(settings, "SINGLE_UNIT_MODE", True))
        self.assertEqual(getattr(settings, "DEFAULT_UNIT_NAME", "Lahore Fashion Mill"), "Lahore Fashion Mill")
