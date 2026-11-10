from rest_framework import serializers
from .models import QCAudit

class QCAuditSerializer(serializers.ModelSerializer):
    class Meta:
        model = QCAudit
        fields = "__all__"