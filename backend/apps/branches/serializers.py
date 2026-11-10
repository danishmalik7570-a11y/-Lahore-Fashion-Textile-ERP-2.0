from rest_framework import serializers
from django.conf import settings
from apps.branches.models import Branch, BranchUser


class BranchSerializer(serializers.ModelSerializer):
    is_single_unit = serializers.SerializerMethodField()

    class Meta:
        model = Branch
        fields = [
            "id", "code", "name", "city", "address", "phone", "email",
            "is_head_office", "is_active", "latitude", "longitude",
            "geofence_radius_meters", "is_single_unit", "created_at", "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def get_is_single_unit(self, obj) -> bool:
        return getattr(settings, "SINGLE_UNIT_MODE", True)

    def to_representation(self, instance):
        ret = super().to_representation(instance)
        if getattr(settings, "SINGLE_UNIT_MODE", True):
            ret["name"] = getattr(settings, "DEFAULT_UNIT_NAME", "Lahore Fashion Mill")
            ret["code"] = getattr(settings, "DEFAULT_UNIT_CODE", "LHR")
        return ret


class BranchUserSerializer(serializers.ModelSerializer):
    branch_name = serializers.CharField(source="branch.name", read_only=True)

    class Meta:
        model = BranchUser
        fields = ["id", "user", "branch", "branch_name", "is_default"]
