from django.contrib import admin
from .models import ProductionLot, ScanEvent

@admin.register(ProductionLot)
class ProductionLotAdmin(admin.ModelAdmin):
    list_display = ["lot_number", "client_name", "fabric_spec", "stage", "loom_number", "efficiency_percent", "status"]
    search_fields = ["lot_number", "client_name"]
    list_filter = ["stage", "status"]