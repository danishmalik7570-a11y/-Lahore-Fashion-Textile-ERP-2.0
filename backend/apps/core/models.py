"""
apps.core — Base abstract models used across the entire ERP.
Every transactional model inherits from one of these.
"""
import uuid
from decimal import Decimal
from typing import Any, Optional

from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType
from django.db import models
from django.utils import timezone
from django.utils.translation import gettext_lazy as _
from model_utils.models import TimeStampedModel


# ─── Soft-delete Manager ──────────────────────────────────────────────────────

class ActiveManager(models.Manager):
    """Returns only non-deleted records."""

    def get_queryset(self) -> models.QuerySet:
        return super().get_queryset().filter(is_deleted=False)


class AllObjectsManager(models.Manager):
    """Returns all records including soft-deleted."""

    def get_queryset(self) -> models.QuerySet:
        return super().get_queryset()


class BranchScopedManager(models.Manager):
    """
    Branch-scoped manager. Views must set request on the queryset via
    BranchScopedQuerySet.for_branch(branch_id).
    Enforced at the service layer — never trust only the view.
    """

    def get_queryset(self) -> models.QuerySet:
        return super().get_queryset().filter(is_deleted=False)

    def for_branch(self, branch_id: Any) -> models.QuerySet:
        return self.get_queryset().filter(branch_id=branch_id)


# ─── Base Model (UUID PK + timestamps) ───────────────────────────────────────

class BaseModel(models.Model):
    """
    Abstract base with UUID PK, created_at, updated_at.
    All ERP models inherit from this.
    """

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
        verbose_name=_("ID"),
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        db_index=True,
        verbose_name=_("Created At"),
    )
    updated_at = models.DateTimeField(
        auto_now=True,
        verbose_name=_("Updated At"),
    )

    class Meta:
        abstract = True
        ordering = ["-created_at"]

    def __repr__(self) -> str:
        return f"<{self.__class__.__name__} id={self.id}>"


# ─── Audited Model (+ created_by, updated_by) ────────────────────────────────

class AuditedModel(BaseModel):
    """
    Extends BaseModel with created_by and updated_by FK to User.
    Use SET_NULL so records survive user deletion.
    """

    created_by = models.ForeignKey(
        "accounts.User",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="%(app_label)s_%(class)s_created",
        verbose_name=_("Created By"),
    )
    updated_by = models.ForeignKey(
        "accounts.User",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="%(app_label)s_%(class)s_updated",
        verbose_name=_("Updated By"),
    )

    class Meta(BaseModel.Meta):
        abstract = True


# ─── Soft-Delete Model ────────────────────────────────────────────────────────

class SoftDeleteModel(AuditedModel):
    """
    Adds soft-delete support.
    .delete() sets is_deleted=True instead of removing the row.
    Use .hard_delete() for actual DB deletion.
    Default manager (objects) excludes deleted records.
    Use all_objects to include deleted records.
    """

    is_deleted = models.BooleanField(
        default=False,
        db_index=True,
        verbose_name=_("Is Deleted"),
    )
    deleted_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name=_("Deleted At"),
    )
    deleted_by = models.ForeignKey(
        "accounts.User",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="%(app_label)s_%(class)s_deleted",
        verbose_name=_("Deleted By"),
    )

    objects = ActiveManager()
    all_objects = AllObjectsManager()

    class Meta(AuditedModel.Meta):
        abstract = True

    def delete(  # type: ignore[override]
        self,
        using: Optional[str] = None,
        keep_parents: bool = False,
        deleted_by: Optional[Any] = None,
    ) -> None:
        """Soft delete: mark as deleted instead of removing row."""
        self.is_deleted = True
        self.deleted_at = timezone.now()
        if deleted_by:
            self.deleted_by = deleted_by
        self.save(update_fields=["is_deleted", "deleted_at", "deleted_by", "updated_at"])

    def hard_delete(self, using: Optional[str] = None) -> None:
        """Actual database deletion — use with extreme caution."""
        super().delete(using=using)

    def restore(self) -> None:
        """Restore a soft-deleted record."""
        self.is_deleted = False
        self.deleted_at = None
        self.deleted_by = None
        self.save(update_fields=["is_deleted", "deleted_at", "deleted_by", "updated_at"])


# ─── Branch-Scoped Model ──────────────────────────────────────────────────────

class BranchScopedModel(SoftDeleteModel):
    """
    All transactional records belong to a branch.
    The base queryset manager enforces branch filtering at the DB level.
    CRITICAL: every service method MUST use .for_branch() or explicitly
    pass branch_id — never raw .objects.all() in views.
    """

    branch = models.ForeignKey(
        "branches.Branch",
        on_delete=models.PROTECT,   # Never delete a branch with data
        related_name="%(app_label)s_%(class)s_set",
        db_index=True,
        verbose_name=_("Branch"),
    )

    objects = BranchScopedManager()
    all_objects = AllObjectsManager()

    class Meta(SoftDeleteModel.Meta):
        abstract = True
        indexes = [
            models.Index(fields=["branch", "created_at"], name="%(app_label)s_%(class)s_branch_ca_idx"),
        ]


# ─── Document Number Mixin ────────────────────────────────────────────────────

class NumberedDocumentMixin(models.Model):
    """
    Mixin for documents with auto-generated branch+year-scoped numbers.
    e.g. SO-2024-0321, INV-2025-001, CH-2025-024
    The number is generated by NumberSequenceService and stored here.
    """

    number = models.CharField(
        max_length=32,
        unique=True,
        db_index=True,
        editable=False,
        verbose_name=_("Document Number"),
    )

    class Meta:
        abstract = True


# ─── Status Mixin ────────────────────────────────────────────────────────────

class StatusMixin(models.Model):
    """Generic status with history tracking via django-simple-history."""

    status_changed_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name=_("Status Changed At"),
    )
    status_changed_by = models.ForeignKey(
        "accounts.User",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="%(app_label)s_%(class)s_status_changes",
        verbose_name=_("Status Changed By"),
    )

    class Meta:
        abstract = True

    def set_status(self, new_status: str, changed_by: Any) -> None:
        self.status = new_status  # type: ignore[attr-defined]
        self.status_changed_at = timezone.now()
        self.status_changed_by = changed_by


# ─── Money / Quantity Type Aliases ────────────────────────────────────────────
# NEVER use float for money or quantity.
# Always use Decimal with the precision defined below.

MONEY_DECIMAL_PLACES = 2
MONEY_MAX_DIGITS = 16       # supports up to PKR 99,999,999,999,999.99
QTY_DECIMAL_PLACES = 4
QTY_MAX_DIGITS = 14
WEIGHT_DECIMAL_PLACES = 3
WEIGHT_MAX_DIGITS = 12
PCT_DECIMAL_PLACES = 4
PCT_MAX_DIGITS = 7          # e.g. 99.9999%


def money_field(**kwargs: Any) -> models.DecimalField:
    """Return a Decimal field configured for PKR money values."""
    defaults = {
        "max_digits": MONEY_MAX_DIGITS,
        "decimal_places": MONEY_DECIMAL_PLACES,
        "default": Decimal("0.00"),
    }
    defaults.update(kwargs)
    return models.DecimalField(**defaults)


def qty_field(**kwargs: Any) -> models.DecimalField:
    """Return a Decimal field for quantities (pcs, meters, kg, etc.)."""
    defaults = {
        "max_digits": QTY_MAX_DIGITS,
        "decimal_places": QTY_DECIMAL_PLACES,
        "default": Decimal("0"),
    }
    defaults.update(kwargs)
    return models.DecimalField(**defaults)


def pct_field(**kwargs: Any) -> models.DecimalField:
    """Return a Decimal field for percentages (0–100.0000)."""
    defaults = {
        "max_digits": PCT_MAX_DIGITS,
        "decimal_places": PCT_DECIMAL_PLACES,
        "default": Decimal("0"),
    }
    defaults.update(kwargs)
    return models.DecimalField(**defaults)


# ─── Generic Attachment Model ─────────────────────────────────────────────────

class Attachment(BaseModel):
    """
    Generic attachment linked to any model via GenericForeignKey.
    Stored in S3/MinIO. Virus-scan hook fires via Celery after upload.
    """

    class FileType(models.TextChoices):
        IMAGE = "image", _("Image")
        PDF = "pdf", _("PDF")
        EXCEL = "excel", _("Excel")
        CSV = "csv", _("CSV")
        OTHER = "other", _("Other")

    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE)
    object_id = models.UUIDField(db_index=True)
    content_object = GenericForeignKey("content_type", "object_id")

    file = models.FileField(upload_to="attachments/%Y/%m/%d/")
    original_filename = models.CharField(max_length=255)
    file_type = models.CharField(max_length=10, choices=FileType.choices, default=FileType.OTHER)
    file_size = models.PositiveIntegerField(help_text=_("Size in bytes"))
    mime_type = models.CharField(max_length=100, blank=True)
    is_scanned = models.BooleanField(default=False)
    is_safe = models.BooleanField(null=True, blank=True)
    uploaded_by = models.ForeignKey(
        "accounts.User",
        null=True,
        on_delete=models.SET_NULL,
        related_name="attachments",
    )
    branch = models.ForeignKey(
        "branches.Branch",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
    )
    notes = models.CharField(max_length=500, blank=True)

    class Meta:
        verbose_name = _("Attachment")
        verbose_name_plural = _("Attachments")
        indexes = [
            models.Index(fields=["content_type", "object_id"]),
        ]

    def __str__(self) -> str:
        return self.original_filename


# ─── Notification / Event base ────────────────────────────────────────────────

class DomainEvent(models.Model):
    """
    Lightweight outbox for domain events → consumed by Celery/WebSocket.
    Written in the same transaction as the change; Celery picks up async.
    """

    class EventStatus(models.TextChoices):
        PENDING = "pending", _("Pending")
        PROCESSING = "processing", _("Processing")
        DONE = "done", _("Done")
        FAILED = "failed", _("Failed")

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    event_type = models.CharField(max_length=100, db_index=True)
    payload = models.JSONField(default=dict)
    branch_id = models.UUIDField(null=True, blank=True, db_index=True)
    status = models.CharField(max_length=20, choices=EventStatus.choices, default=EventStatus.PENDING, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    processed_at = models.DateTimeField(null=True, blank=True)
    error = models.TextField(blank=True)
    retry_count = models.PositiveSmallIntegerField(default=0)

    class Meta:
        db_table = "core_domain_event"
        indexes = [
            models.Index(fields=["status", "created_at"]),
            models.Index(fields=["event_type", "branch_id"]),
        ]
        ordering = ["created_at"]

    def __str__(self) -> str:
        return f"{self.event_type} [{self.status}] @ {self.created_at}"
