from django.db import models
from apps.core.models import BaseModel

class CompanySetting(BaseModel):
    company_name = models.CharField(max_length=150, default="Lahore Fashion Textile Mills (Pvt) Ltd")
    address = models.TextField(default="Plot 42-A, Sundar Industrial Estate, Raiwind Road, Lahore")
    ntn = models.CharField(max_length=50, default="2849102-4")
    strn = models.CharField(max_length=50, default="1700284910219")
    currency = models.CharField(max_length=10, default="PKR")
    sales_tax_rate = models.PositiveSmallIntegerField(default=18)
    active_looms = models.PositiveIntegerField(default=68)
    telemetry_broker_url = models.CharField(max_length=255, default="wss://mill-telemetry.lahorefashion.com/v1/sensors")
    whatsapp_enabled = models.BooleanField(default=True)

    class Meta:
        db_table = "settings_company"

    def __str__(self):
        return self.company_name