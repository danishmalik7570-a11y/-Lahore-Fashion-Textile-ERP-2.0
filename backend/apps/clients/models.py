from django.db import models
from django.utils.translation import gettext_lazy as _
from apps.core.models import BranchScopedModel, money_field

class Client(BranchScopedModel):
    class BrandType(models.TextChoices):
        RETAIL = "Retail Fashion", _("Retail Fashion")
        DENIM = "Denim Apparel", _("Denim Apparel")
        HOME = "Home Textile", _("Home Textile")
        EXPORT = "Export House", _("Export House")

    class City(models.TextChoices):
        LAHORE = "Lahore", _("Lahore")
        KARACHI = "Karachi", _("Karachi")
        FAISALABAD = "Faisalabad", _("Faisalabad")
        MULTAN = "Multan", _("Multan")

    name = models.CharField(max_length=150, db_index=True)
    brand_type = models.CharField(max_length=50, choices=BrandType.choices, default=BrandType.RETAIL)
    city = models.CharField(max_length=50, choices=City.choices, default=City.LAHORE)
    ntn = models.CharField(max_length=30, blank=True)
    strn = models.CharField(max_length=30, blank=True)
    credit_limit = money_field(default=20000000)
    current_balance = money_field(default=0)
    contact_person = models.CharField(max_length=100)
    phone = models.CharField(max_length=30, blank=True)
    email = models.EmailField(blank=True)
    status = models.CharField(max_length=20, default="Active")

    class Meta:
        db_table = "clients_client"
        ordering = ["name"]

    def __str__(self):
        return self.name

class ClientContact(BranchScopedModel):
    client = models.ForeignKey(Client, on_delete=models.CASCADE, related_name="contacts")
    name = models.CharField(max_length=100)
    designation = models.CharField(max_length=100, blank=True)
    phone = models.CharField(max_length=30)
    email = models.EmailField(blank=True)

    class Meta:
        db_table = "clients_contact"