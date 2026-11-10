from rest_framework import serializers
from .models import AttendanceRecord

class AttendanceRecordSerializer(serializers.ModelSerializer):
    worker_name = serializers.CharField(source="worker.name", read_only=True)
    worker_code = serializers.CharField(source="worker.employee_code", read_only=True)
    department = serializers.CharField(source="worker.department", read_only=True)

    class Meta:
        model = AttendanceRecord
        fields = "__all__"