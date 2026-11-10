from rest_framework import serializers
from .models import (
    DocumentType, PaperPreset, PrintTemplate, TemplateVersion,
    TemplateAsset, PrintJob, VerifyToken
)


class DocumentTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = DocumentType
        fields = "__all__"


class PaperPresetSerializer(serializers.ModelSerializer):
    class Meta:
        model = PaperPreset
        fields = "__all__"


class TemplateVersionSerializer(serializers.ModelSerializer):
    created_by_name = serializers.CharField(source="created_by.name", read_only=True)

    class Meta:
        model = TemplateVersion
        fields = "__all__"


class PrintTemplateSerializer(serializers.ModelSerializer):
    doc_type_code = serializers.CharField(source="doc_type.code", read_only=True)
    doc_type_name = serializers.CharField(source="doc_type.name", read_only=True)
    paper_name = serializers.CharField(source="paper_preset.name", read_only=True)
    created_by_name = serializers.CharField(source="created_by.name", read_only=True)

    class Meta:
        model = PrintTemplate
        fields = "__all__"


class TemplateAssetSerializer(serializers.ModelSerializer):
    class Meta:
        model = TemplateAsset
        fields = "__all__"


class PrintJobSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source="user.name", read_only=True)

    class Meta:
        model = PrintJob
        fields = "__all__"


class VerifyTokenSerializer(serializers.ModelSerializer):
    class Meta:
        model = VerifyToken
        fields = "__all__"
