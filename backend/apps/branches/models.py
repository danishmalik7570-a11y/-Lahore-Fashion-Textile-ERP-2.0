"""
Branches app — Branch model.
Every transactional record carries a branch FK (enforced via BranchScopedModel).
"""
import uuid
from django.db import models
from django.utils.translation import gettext_lazy as _
from apps.core.models import BaseModel


class Branch(BaseModel):
    """
    Represents a physical office/factory location.
    4 branches: Lahore (HQ), Faisalabad, Multan, Karachi.
    """

    code = models.CharField(
        max_length=10,
        unique=True,
        db_index=True,
        verbose_name=_("Branch Code"),
        help_text=_("Short code e.g. LHR, FSD, MLT, KHI"),
    )
    name = models.CharField(max_length=100, verbose_name=_("Branch Name"))
    city = models.CharField(max_length=100, verbose_name=_("City"))
    address = models.TextField(blank=True, verbose_name=_("Address"))
    phone = models.CharField(max_length=20, blank=True, verbose_name=_("Phone"))
    email = models.EmailField(blank=True, verbose_name=_("Email"))
    is_head_office = models.BooleanField(
        default=False,
        verbose_name=_("Is Head Office"),
        help_text=_("Only one branch should be the head office."),
    )
    is_active = models.BooleanField(default=True, verbose_name=_("Is Active"))
    latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    geofence_radius_meters = models.PositiveIntegerField(
        default=500,
        help_text=_("Radius in meters for attendance geofencing."),
    )

    class Meta:
        db_table = "branches_branch"
        verbose_name = _("Branch")
        verbose_name_plural = _("Branches")
        ordering = ["name"]
        constraints = [
            models.UniqueConstraint(
                fields=["is_head_office"],
                condition=models.Q(is_head_office=True),
                name="unique_head_office",
            )
        ]

    def __str__(self) -> str:
        if self.code:
            return f"{self.name} ({self.code})"
        hq = " (HQ)" if self.is_head_office else ""
        return f"{self.name}{hq}"


class BranchUser(BaseModel):
    """
    Maps which branches a user has access to.
    A user can belong to multiple branches (e.g. Super Admin = all).
    """

    user = models.ForeignKey(
        "accounts.User",
        on_delete=models.CASCADE,
        related_name="branch_memberships",
        verbose_name=_("User"),
    )
    branch = models.ForeignKey(
        Branch,
        on_delete=models.CASCADE,
        related_name="members",
        verbose_name=_("Branch"),
    )
    is_default = models.BooleanField(
        default=False,
        verbose_name=_("Is Default Branch"),
        help_text=_("The branch pre-selected at login."),
    )

    class Meta:
        db_table = "branches_branch_user"
        verbose_name = _("Branch User")
        verbose_name_plural = _("Branch Users")
        unique_together = [("user", "branch")]

    def __str__(self) -> str:
        return f"{self.user} @ {self.branch}"
