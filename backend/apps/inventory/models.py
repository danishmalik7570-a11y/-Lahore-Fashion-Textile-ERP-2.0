from django.db import models
from django.utils.translation import gettext_lazy as _
from apps.core.models import BranchScopedModel, qty_field, money_field

class StockItem(BranchScopedModel):
    class Category(models.TextChoices):
        YARN = "Yarn Bobbins", _("Yarn Bobbins")
        GREY = "Grey Fabric", _("Grey Fabric")
        DYES = "Dyes & Chemicals", _("Dyes & Chemicals")
        FINISHED = "Finished Fabric", _("Finished Fabric")
        TRIMS = "Trims & Accessories", _("Trims & Accessories")

    code = models.CharField(max_length=50, unique=True, db_index=True)
    name = models.CharField(max_length=150)
    category = models.CharField(max_length=50, choices=Category.choices, default=Category.YARN)
    current_stock = qty_field(default=0)
    unit = models.CharField(max_length=20, default="kg")
    reorder_level = qty_field(default=1000)
    warehouse_location = models.CharField(max_length=100)
    unit_cost = money_field(default=500)
    last_received_date = models.DateField(auto_now=True)

    class Meta:
        db_table = "inventory_item"
        ordering = ["name"]

    def __str__(self):
        return f"{self.code} - {self.name}"

class StockTransaction(BranchScopedModel):
    class TransType(models.TextChoices):
        INWARD = "Inward GRN", _("Inward GRN")
        OUTWARD = "Floor Issue", _("Floor Issue")
        ADJUSTMENT = "Audit Adjustment", _("Audit Adjustment")

    item = models.ForeignKey(StockItem, on_delete=models.CASCADE, related_name="transactions")
    transaction_type = models.CharField(max_length=30, choices=TransType.choices)
    quantity = qty_field()
    reference_doc = models.CharField(max_length=50, blank=True)
    notes = models.TextField(blank=True)

    class Meta:
        db_table = "inventory_transaction"