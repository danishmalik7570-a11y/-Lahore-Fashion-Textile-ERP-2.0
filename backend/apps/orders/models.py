from django.db import models
from django.utils.translation import gettext_lazy as _
from apps.core.models import BranchScopedModel, NumberedDocumentMixin, money_field, qty_field

class Order(BranchScopedModel, NumberedDocumentMixin):
    class Status(models.TextChoices):
        DRAFT = "Draft", _("Draft")
        CONFIRMED = "Confirmed", _("Confirmed")
        WEAVING = "Weaving", _("Weaving")
        DYEING = "Dyeing", _("Dyeing")
        PRINTING = "Printing", _("Printing")
        PACKING = "Packing", _("Packing")
        DISPATCHED = "Dispatched", _("Dispatched")
        DELIVERED = "Delivered", _("Delivered")

    client = models.ForeignKey("clients.Client", on_delete=models.PROTECT, related_name="orders")
    fabric_spec = models.CharField(max_length=150)
    construction = models.CharField(max_length=150, blank=True)
    quantity_meters = qty_field(default=10000)
    rate_per_meter = money_field(default=250)
    total_amount = money_field(default=0)
    delivery_date = models.DateField()
    order_date = models.DateField(auto_now_add=True)
    status = models.CharField(max_length=30, choices=Status.choices, default=Status.CONFIRMED)
    remarks = models.TextField(blank=True)

    class Meta:
        db_table = "orders_order"
        ordering = ["-order_date"]

    def save(self, *args, **kwargs):
        if not self.number:
            import random
            self.number = f"PO-LF-2026-{random.randint(1000, 9999)}"
        self.total_amount = self.quantity_meters * self.rate_per_meter
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.number} - {self.client.name}"