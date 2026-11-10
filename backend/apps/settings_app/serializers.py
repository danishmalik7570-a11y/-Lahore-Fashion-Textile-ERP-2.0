from rest_framework import serializers
from .models import CompanySetting

class CompanySettingSerializer(serializers.ModelSerializer):
    class Meta:
        model = CompanySetting
        fields = "__all__"