"""
HR App — Signals for auto-generating employee IDs, QR badges, etc.
"""
from django.db.models.signals import pre_save
from django.dispatch import receiver

from apps.hr.models import Employee


@receiver(pre_save, sender=Employee)
def generate_employee_id(sender, instance, **kwargs):
    """Auto-generate employee ID like LF-2245 if not set."""
    if not instance.employee_id:
        last = Employee.all_objects.order_by("-employee_id").first()
        if last and last.employee_id.startswith("LF-"):
            try:
                num = int(last.employee_id.split("-")[1]) + 1
            except (ValueError, IndexError):
                num = 1001
        else:
            num = 1001
        instance.employee_id = f"LF-{num:04d}"


@receiver(pre_save, sender=Employee)
def generate_qr_badge_token(sender, instance, **kwargs):
    """Generate a QR badge token if not set."""
    if not instance.qr_badge_token:
        import uuid
        instance.qr_badge_token = str(uuid.uuid4()).replace("-", "")[:32]
