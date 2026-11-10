from django.contrib import admin
from .models import QCAudit

@admin.register(QCAudit)
class QCAuditAdmin(admin.ModelAdmin):
    list_display = ["audit_number", "roll_number", "inspected_meters", "total_defect_points", "points_per_100m", "result", "auditor_name"]
    search_fields = ["audit_number", "roll_number"]
    list_filter = ["result"]