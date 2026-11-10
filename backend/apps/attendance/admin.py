from django.contrib import admin
from .models import AttendanceRecord

@admin.register(AttendanceRecord)
class AttendanceRecordAdmin(admin.ModelAdmin):
    list_display = ["worker", "date", "clock_in", "clock_out", "biometric_gate", "status"]
    list_filter = ["status", "date"]