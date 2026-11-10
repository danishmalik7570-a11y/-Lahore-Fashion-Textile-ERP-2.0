from django.contrib import admin
from .models import StockItem, StockTransaction

@admin.register(StockItem)
class StockItemAdmin(admin.ModelAdmin):
    list_display = ["code", "name", "category", "current_stock", "unit", "warehouse_location", "unit_cost"]
    search_fields = ["code", "name"]
    list_filter = ["category"]