from django.contrib import admin
from .models import Worker

@admin.register(Worker)
class WorkerAdmin(admin.ModelAdmin):
    list_display = ["employee_code", "name", "department", "skill_grade", "shift", "daily_rate", "is_active"]
    search_fields = ["employee_code", "name", "cnic"]
    list_filter = ["department", "skill_grade", "shift"]