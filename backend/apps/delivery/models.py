from django.db import models
from django.utils.translation import gettext_lazy as _
from apps.core.models import BranchScopedModel, NumberedDocumentMixin, qty_field

class DeliveryChallan(BranchScopedModel, NumberedDocumentMixin):
    class Status(models.TextChoices):
        ISSUED = "Gate Pass Issued", _("Gate Pass Issued")
        IN_TRANSIT = "In Transit", _("In Transit")
        DELIVERED = "Delivered & Signed", _("Delivered & Signed")

    order = models.ForeignKey("orders.Order", on_delete=models.CASCADE, related_name="challans")
    client_name = models.CharField(max_length=150)
    destination_city = models.CharField(max_length=150)
    vehicle_number = models.CharField(max_length=50)
    driver_name = models.CharField(max_length=100)
    driver_phone = models.CharField(max_length=30)
    total_rolls = models.PositiveIntegerField(default=50)
    total_meters = qty_field(default=20000)
    gate_pass_time = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=30, choices=Status.choices, default=Status.ISSUED)

    class Meta:
        db_table = "delivery_challan"
        ordering = ["-gate_pass_time"]

    def save(self, *args, **kwargs):
        if not self.number:
            import random
            self.number = f"DC-LF-2026-{random.randint(1000, 9999)}"
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.number} -> {self.destination_city}"