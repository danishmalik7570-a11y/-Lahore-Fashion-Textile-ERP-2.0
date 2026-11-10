from django.contrib import admin
from .models import Order

@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ["number", "client", "fabric_spec", "quantity_meters", "rate_per_meter", "total_amount", "status"]
    search_fields = ["number", "client__name", "fabric_spec"]
    list_filter = ["status"]