from django.contrib import admin
from .models import CompanySetting

@admin.register(CompanySetting)
class CompanySettingAdmin(admin.ModelAdmin):
    list_display = ["company_name", "ntn", "strn", "currency", "sales_tax_rate", "active_looms"]