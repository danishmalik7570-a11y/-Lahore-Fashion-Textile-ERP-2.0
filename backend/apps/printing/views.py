from django.http import HttpResponse
from django.utils import timezone
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from .models import (
    DocumentType, PaperPreset, PrintTemplate, TemplateVersion,
    TemplateAsset, PrintJob, VerifyToken
)
from .serializers import (
    DocumentTypeSerializer, PaperPresetSerializer, PrintTemplateSerializer,
    TemplateVersionSerializer, TemplateAssetSerializer, PrintJobSerializer,
    VerifyTokenSerializer
)
from .services import (
    DatasetDictionaryService, SandboxedTemplateRenderer,
    PdfRenderingService, PrintAuditService, TemplateLinterService
)


class DocumentTypeViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = DocumentType.objects.all()
    serializer_class = DocumentTypeSerializer
    permission_classes = [permissions.AllowAny]
    lookup_field = "code"

    @action(detail=True, methods=["get"])
    def dataset(self, request, code=None):
        schema = DatasetDictionaryService.get_schema_for_doc_type(code)
        sample = DatasetDictionaryService.build_sample_dataset(code)
        return Response({"schema_tree": schema, "sample_data": sample})


class PaperPresetViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = PaperPreset.objects.all()
    serializer_class = PaperPresetSerializer
    permission_classes = [permissions.AllowAny]


class PrintTemplateViewSet(viewsets.ModelViewSet):
    queryset = PrintTemplate.objects.all()
    serializer_class = PrintTemplateSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ["doc_type__code", "status", "is_default", "language"]
    search_fields = ["name", "tags"]

    @action(detail=True, methods=["get", "post"])
    def versions(self, request, pk=None):
        template = self.get_object()
        if request.method == "POST":
            # Create new version
            next_ver = template.current_version_no + 1
            version = TemplateVersion.objects.create(
                template=template,
                version_no=next_ver,
                schema_json=request.data.get("schema_json", {}),
                html_jinja=request.data.get("html_jinja", ""),
                css=request.data.get("css", ""),
                change_note=request.data.get("change_note", f"Version {next_ver}"),
                created_by=request.user if request.user.is_authenticated else None
            )
            template.current_version_no = next_ver
            template.save(update_fields=["current_version_no", "updated_at"])
            return Response(TemplateVersionSerializer(version).data, status=status.HTTP_201_CREATED)

        versions = template.versions.all()
        return Response(TemplateVersionSerializer(versions, many=True).data)

    @action(detail=True, methods=["post"])
    def submit(self, request, pk=None):
        template = self.get_object()
        template.status = "PENDING_APPROVAL"
        template.save(update_fields=["status", "updated_at"])
        return Response({"status": "submitted_for_approval"})

    @action(detail=True, methods=["post"])
    def approve(self, request, pk=None):
        template = self.get_object()
        template.status = "ACTIVE"
        template.approved_by = request.user if request.user.is_authenticated else None
        template.approved_at = timezone.now()
        template.save(update_fields=["status", "approved_by", "approved_at", "updated_at"])
        return Response({"status": "approved_and_active"})

    @action(detail=True, methods=["post"])
    def preview(self, request, pk=None):
        template = self.get_object()
        latest_version = template.versions.first()
        html_jinja = request.data.get("html_jinja") or (latest_version.html_jinja if latest_version else "")

        # Dataset
        dataset = request.data.get("dataset") or DatasetDictionaryService.build_sample_dataset(template.doc_type.code)

        renderer = SandboxedTemplateRenderer()
        html_out = renderer.render_html(
            template_html=html_jinja,
            data=dataset,
            paper_size=template.paper_preset.code,
            orientation=template.orientation,
            margins_mm=template.margins,
            is_rtl=(template.language == "ur"),
            watermark=request.data.get("watermark")
        )
        return Response({"html": html_out})

    @action(detail=True, methods=["post"])
    def render_pdf(self, request, pk=None):
        template = self.get_object()
        latest_version = template.versions.first()
        html_jinja = latest_version.html_jinja if latest_version else ""

        doc_id = request.data.get("doc_id", "SAMPLE-01")
        is_reprint = request.data.get("is_reprint", False)
        copy_label = request.data.get("copy_label", "Original for Recipient")

        dataset = request.data.get("dataset") or DatasetDictionaryService.build_sample_dataset(
            template.doc_type.code, copy_label=copy_label, is_reprint=is_reprint
        )

        renderer = SandboxedTemplateRenderer()
        html_out = renderer.render_html(
            template_html=html_jinja,
            data=dataset,
            paper_size=template.paper_preset.code,
            orientation=template.orientation,
            margins_mm=template.margins,
            is_rtl=(template.language == "ur"),
            watermark="REPRINT" if is_reprint else None
        )

        pdf_bytes = PdfRenderingService.render_pdf_bytes(html_out, title=template.name)

        # Audit
        PrintAuditService.record_print_job(
            doc_type=template.doc_type.code,
            doc_id=str(doc_id),
            template_version=latest_version,
            user=request.user if request.user.is_authenticated else None,
            copy_label=copy_label,
            channel="PDF_DOWNLOAD"
        )

        response = HttpResponse(pdf_bytes, content_type="application/pdf")
        response["Content-Disposition"] = f'inline; filename="{template.name}.pdf"'
        return response

    @action(detail=False, methods=["post"])
    def lint(self, request):
        schema = request.data.get("schema", {})
        issues = TemplateLinterService.lint_template(schema)
        return Response({"issues": issues, "is_valid": not any(i["severity"] == "ERROR" for i in issues)})


class TemplateAssetViewSet(viewsets.ModelViewSet):
    queryset = TemplateAsset.objects.all()
    serializer_class = TemplateAssetSerializer
    permission_classes = [permissions.IsAuthenticated]


class PrintJobViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = PrintJob.objects.all()
    serializer_class = PrintJobSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ["doc_type", "reprint_flag", "channel"]


@api_view(["GET"])
@permission_classes([permissions.AllowAny])
def verify_document_token(request, token):
    """
    Public QR verification page.
    """
    verification = PrintAuditService.verify_token(token)
    return Response(verification)
