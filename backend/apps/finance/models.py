from django.db import models
from django.utils.translation import gettext_lazy as _
from apps.core.models import BranchScopedModel, NumberedDocumentMixin, money_field

class Invoice(BranchScopedModel, NumberedDocumentMixin):
    class Status(models.TextChoices):
        PENDING = "Pending", _("Pending")
        PAID = "Paid", _("Paid")
        OVERDUE = "Overdue", _("Overdue")

    order = models.ForeignKey("orders.Order", on_delete=models.CASCADE, related_name="invoices", null=True, blank=True)
    client_name = models.CharField(max_length=150)
    subtotal = money_field()
    sales_tax = money_field()
    withholding_tax = money_field()
    net_payable = money_field()
    issue_date = models.DateField(auto_now_add=True)
    due_date = models.DateField()
    status = models.CharField(max_length=30, choices=Status.choices, default=Status.PENDING)

    class Meta:
        db_table = "finance_invoice"
        ordering = ["-issue_date"]

    def save(self, *args, **kwargs):
        if not self.number:
            import random
            self.number = f"INV-LF-2026-{random.randint(1000, 9999)}"
        self.sales_tax = round(float(self.subtotal) * 0.18, 2)
        self.withholding_tax = round(float(self.subtotal) * 0.01, 2)
        self.net_payable = round(float(self.subtotal) + float(self.sales_tax), 2)
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.number} ({self.client_name})"