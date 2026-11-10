from django.contrib import admin
from .models import Invoice

@admin.register(Invoice)
class InvoiceAdmin(admin.ModelAdmin):
    list_display = ["number", "client_name", "subtotal", "sales_tax", "net_payable", "due_date", "status"]
    list_filter = ["status"]