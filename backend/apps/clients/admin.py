from django.contrib import admin
from .models import Client, ClientContact

@admin.register(Client)
class ClientAdmin(admin.ModelAdmin):
    list_display = ["name", "brand_type", "city", "ntn", "credit_limit", "current_balance", "status"]
    search_fields = ["name", "ntn", "contact_person"]
    list_filter = ["city", "brand_type", "status"]