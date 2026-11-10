from django.contrib import admin
from .models import DeliveryChallan

@admin.register(DeliveryChallan)
class DeliveryChallanAdmin(admin.ModelAdmin):
    list_display = ["number", "client_name", "destination_city", "vehicle_number", "total_rolls", "total_meters", "status"]
    list_filter = ["status"]