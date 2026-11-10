import uuid
from decimal import Decimal
from django.db import models
from django.utils import timezone
from django.utils.translation import gettext_lazy as _


class DocumentType(models.Model):
    class ModuleChoices(models.TextChoices):
        SALES = "sales", _("Sales & Commercial")
        LOGISTICS = "logistics", _("Gate & Logistics")
        HR = "hr", _("HR & Labour")
        PRODUCTION = "production", _("Production & Quality")
        INVENTORY = "inventory", _("Inventory & Purchasing")
        FINANCE = "finance", _("Finance & Accounts")
        REPORTS = "reports", _("Management Reports")

    code = models.CharField(max_length=50, unique=True, db_index=True)
    name = models.CharField(max_length=100)
    module = models.CharField(max_length=30, choices=ModuleChoices.choices, default=ModuleChoices.SALES)
    dataset_class = models.CharField(max_length=150, help_text=_("Python path or identifier for safe dataset builder"))
    default_paper = models.CharField(max_length=30, default="A4")
    copies_config = models.JSONField(default=list, help_text=_("List of default copy labels, e.g. Original, Duplicate"))
    requires_approval = models.BooleanField(default=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = "printing_document_type"
        ordering = ["module", "name"]

    def __str__(self):
        return f"{self.name} ({self.code})"


class PaperPreset(models.Model):
    code = models.CharField(max_length=30, unique=True, db_index=True)
    name = models.CharField(max_length=100)
    width_mm = models.DecimalField(max_digits=6, decimal_places=1)
    height_mm = models.DecimalField(max_digits=6, decimal_places=1, null=True, blank=True)
    is_continuous = models.BooleanField(default=False)
    default_margins = models.JSONField(default=dict, help_text=_("{'top': 10, 'right': 10, 'bottom': 10, 'left': 10}"))

    class Meta:
        db_table = "printing_paper_preset"
        ordering = ["name"]

    def __str__(self):
        h = f"x{self.height_mm}mm" if self.height_mm else "continuous"
        return f"{self.name} ({self.width_mm}{h})"


class PrintTemplate(models.Model):
    class Status(models.TextChoices):
        DRAFT = "DRAFT", _("Draft")
        PENDING_APPROVAL = "PENDING_APPROVAL", _("Pending Approval")
        ACTIVE = "ACTIVE", _("Active")
        ARCHIVED = "ARCHIVED", _("Archived")

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    doc_type = models.ForeignKey(DocumentType, on_delete=models.CASCADE, related_name="templates")
    name = models.CharField(max_length=150)
    branch = models.ForeignKey("branches.Branch", on_delete=models.SET_NULL, null=True, blank=True)
    department = models.CharField(max_length=100, blank=True)
    client = models.ForeignKey("clients.Client", on_delete=models.SET_NULL, null=True, blank=True)
    language = models.CharField(max_length=10, default="en")  # en, ur, bilingual
    paper_preset = models.ForeignKey(PaperPreset, on_delete=models.PROTECT)
    orientation = models.CharField(max_length=15, default="portrait")  # portrait, landscape
    margins = models.JSONField(default=dict)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.DRAFT)
    is_default = models.BooleanField(default=False)
    current_version_no = models.PositiveIntegerField(default=1)
    created_by = models.ForeignKey("accounts.User", on_delete=models.SET_NULL, null=True, blank=True, related_name="created_templates")
    approved_by = models.ForeignKey("accounts.User", on_delete=models.SET_NULL, null=True, blank=True, related_name="approved_templates")
    approved_at = models.DateTimeField(null=True, blank=True)
    tags = models.JSONField(default=list)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "printing_template"
        ordering = ["doc_type", "-is_default", "name"]
        indexes = [
            models.Index(fields=["doc_type", "status", "is_default"]),
            models.Index(fields=["branch", "client"]),
        ]

    def __str__(self):
        return f"{self.name} - {self.doc_type.code} (v{self.current_version_no})"


class TemplateVersion(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    template = models.ForeignKey(PrintTemplate, on_delete=models.CASCADE, related_name="versions")
    version_no = models.PositiveIntegerField()
    schema_json = models.JSONField(default=dict, help_text=_("JSON designer block schema with mm coordinates and bindings"))
    html_jinja = models.TextField(blank=True, help_text=_("Compiled safe Jinja2 HTML layout"))
    css = models.TextField(blank=True, help_text=_("Compiled scoped print CSS with @page rules"))
    assets_manifest = models.JSONField(default=dict)
    change_note = models.CharField(max_length=255, blank=True)
    created_by = models.ForeignKey("accounts.User", on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    checksum = models.CharField(max_length=64, blank=True)

    class Meta:
        db_table = "printing_template_version"
        ordering = ["template", "-version_no"]
        unique_together = [("template", "version_no")]

    def __str__(self):
        return f"{self.template.name} v{self.version_no}"


class TemplateAsset(models.Model):
    class AssetType(models.TextChoices):
        LOGO = "logo", _("Company Logo")
        SIGNATURE = "signature", _("Signature")
        STAMP = "stamp", _("Official Stamp")
        FONT = "font", _("Custom Font")
        WATERMARK = "watermark", _("Watermark Image")
        BACKGROUND = "background", _("Background Letterhead")

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100)
    asset_type = models.CharField(max_length=30, choices=AssetType.choices)
    branch = models.ForeignKey("branches.Branch", on_delete=models.SET_NULL, null=True, blank=True)
    file = models.FileField(upload_to="print_assets/", null=True, blank=True)
    data_uri = models.TextField(blank=True, help_text=_("Base64 data URI for offline & self-contained PDF rendering"))
    file_hash = models.CharField(max_length=64, blank=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "printing_template_asset"
        ordering = ["-uploaded_at"]

    def __str__(self):
        return f"{self.name} ({self.asset_type})"


class PrintJob(models.Model):
    class Channel(models.TextChoices):
        BROWSER = "browser", _("Browser Print")
        PDF_DOWNLOAD = "pdf_download", _("PDF Direct Download")
        EMAIL = "email", _("Email Attachment")
        WHATSAPP = "whatsapp", _("WhatsApp Document Send")
        QUEUE = "queue", _("Physical Print Queue")

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    doc_type = models.CharField(max_length=50, db_index=True)
    doc_id = models.CharField(max_length=100, db_index=True)
    template_version = models.ForeignKey(TemplateVersion, on_delete=models.SET_NULL, null=True, blank=True)
    user = models.ForeignKey("accounts.User", on_delete=models.SET_NULL, null=True, blank=True)
    copies = models.PositiveSmallIntegerField(default=1)
    copy_label = models.CharField(max_length=50, blank=True)
    channel = models.CharField(max_length=30, choices=Channel.choices, default=Channel.BROWSER)
    status = models.CharField(max_length=20, default="COMPLETED")
    printed_at = models.DateTimeField(auto_now_add=True, db_index=True)
    reprint_flag = models.BooleanField(default=False)
    reprint_count = models.PositiveSmallIntegerField(default=0)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    device_info = models.CharField(max_length=255, blank=True)

    class Meta:
        db_table = "printing_job"
        ordering = ["-printed_at"]


class VerifyToken(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    doc_type = models.CharField(max_length=50)
    doc_id = models.CharField(max_length=100)
    doc_number = models.CharField(max_length=100)
    token = models.CharField(max_length=64, unique=True, db_index=True)
    signature = models.CharField(max_length=128)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    metadata = models.JSONField(default=dict)

    class Meta:
        db_table = "printing_verify_token"
        ordering = ["-created_at"]
