"""
Accounts serializers:
- CustomTokenObtainSerializer: email + password + role + branch → JWT or 2FA challenge
- TwoFactorSendSerializer: send OTP
- TwoFactorVerifySerializer: verify OTP → issue JWT
- UserSerializer, RegisterSerializer, PasswordChangeSerializer
"""
from __future__ import annotations

import uuid
from datetime import timedelta
from typing import Any

import pyotp
from django.conf import settings
from django.contrib.auth import authenticate
from django.utils import timezone
from django.utils.translation import gettext_lazy as _
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.tokens import RefreshToken

from apps.accounts.models import LoginAudit, OTPChallenge, Role, User, UserRoleBranch
from apps.branches.models import Branch


# ─── Custom JWT token with extra claims ───────────────────────────────────────

class CustomTokenObtainSerializer(TokenObtainPairSerializer):
    """
    Extends JWT serializer to include role + branch selection at login.
    Flow:
      1. Validate email + password (axes lockout handled by middleware)
      2. Check if role is valid for user in that branch
      3. If 2FA required → return {requires_2fa: true, challenge_id: uuid}
      4. Else → return {access, refresh, user: {...}}
    """

    username_field = "email"
    role = serializers.ChoiceField(choices=Role.RoleCode.choices)
    branch_id = serializers.UUIDField()

    def __init__(self, *args: Any, **kwargs: Any) -> None:
        super().__init__(*args, **kwargs)
        # Rename default 'username' field to 'email'
        if "username" in self.fields:
            del self.fields["username"]
        self.fields["email"] = serializers.EmailField()

    def validate(self, attrs: dict[str, Any]) -> dict[str, Any]:
        email = attrs.get("email", "").lower().strip()
        password = attrs.get("password", "")
        role_code = attrs.get("role")
        branch_id = attrs.get("branch_id")

        request = self.context.get("request")

        # Authenticate
        user = authenticate(request=request, username=email, password=password)
        if not user:
            LoginAudit.objects.create(
                email_attempted=email,
                event_type=LoginAudit.EventType.LOGIN_FAILED,
                ip_address=_get_client_ip(request),
                user_agent=request.META.get("HTTP_USER_AGENT", "") if request else "",
                role_attempted=str(role_code),
            )
            raise serializers.ValidationError(
                _("No active account found with the given credentials."),
                code="authentication_failed",
            )

        if not user.is_active:
            raise serializers.ValidationError(_("This account has been disabled."))

        # Validate branch access
        try:
            branch = Branch.objects.get(id=branch_id, is_active=True)
        except Branch.DoesNotExist:
            raise serializers.ValidationError(_("Invalid or inactive branch."))

        has_role_in_branch = UserRoleBranch.objects.filter(
            user=user, role__code=role_code, branch=branch, is_active=True
        ).exists() or user.is_superuser

        if not has_role_in_branch:
            raise serializers.ValidationError(
                _("You do not have the requested role in this branch.")
            )

        # Check if 2FA required (dormant behind central AUTH_2FA_ENABLED flag, default OFF)
        auth_2fa_enabled = getattr(settings, "AUTH_2FA_ENABLED", False)
        role_obj = Role.objects.filter(code=role_code).first()
        requires_2fa = auth_2fa_enabled and (
            user.is_2fa_enabled
            or (role_obj and role_obj.requires_2fa)
        )

        if requires_2fa:
            challenge = _create_otp_challenge(user, request)
            LoginAudit.objects.create(
                user=user,
                email_attempted=email,
                event_type=LoginAudit.EventType.OTP_SENT,
                ip_address=_get_client_ip(request),
                branch=branch,
                role_attempted=role_code,
            )
            return {
                "requires_2fa": True,
                "challenge_id": str(challenge.challenge_id),
                "delivery_method": challenge.delivery_method,
                "message": _("A verification code has been sent."),
                # Store context for after verification
                "_user_id": str(user.id),
                "_role": role_code,
                "_branch_id": str(branch_id),
            }

        # Issue tokens
        refresh = RefreshToken.for_user(user)
        _add_token_claims(refresh, user, role_code, branch)

        LoginAudit.objects.create(
            user=user,
            email_attempted=email,
            event_type=LoginAudit.EventType.LOGIN_SUCCESS,
            ip_address=_get_client_ip(request),
            branch=branch,
            role_attempted=role_code,
        )

        user.last_login_ip = _get_client_ip(request)
        user.last_login_at = timezone.now()
        user.save(update_fields=["last_login_ip", "last_login_at"])

        return {
            "requires_2fa": False,
            "access": str(refresh.access_token),
            "refresh": str(refresh),
            "user": _user_data(user, role_code, branch),
        }


class TwoFactorSendSerializer(serializers.Serializer):
    """Resend OTP code (respects 60s cooldown)."""

    challenge_id = serializers.UUIDField()

    def validate(self, attrs: dict[str, Any]) -> dict[str, Any]:
        try:
            challenge = OTPChallenge.objects.get(
                challenge_id=attrs["challenge_id"], is_used=False
            )
        except OTPChallenge.DoesNotExist:
            raise serializers.ValidationError(_("Invalid or expired challenge."))

        if challenge.is_expired:
            raise serializers.ValidationError(_("Challenge has expired. Please login again."))

        if not challenge.can_resend:
            raise serializers.ValidationError(
                _("Please wait before requesting another code.")
            )

        attrs["challenge"] = challenge
        return attrs


class TwoFactorVerifySerializer(serializers.Serializer):
    """Verify OTP code → issue JWT tokens."""

    challenge_id = serializers.UUIDField()
    code = serializers.CharField(min_length=6, max_length=6)
    role = serializers.ChoiceField(choices=Role.RoleCode.choices)
    branch_id = serializers.UUIDField()

    def validate(self, attrs: dict[str, Any]) -> dict[str, Any]:
        try:
            challenge = OTPChallenge.objects.select_related("user").get(
                challenge_id=attrs["challenge_id"], is_used=False
            )
        except OTPChallenge.DoesNotExist:
            raise serializers.ValidationError(_("Invalid or expired challenge."))

        if challenge.is_expired:
            raise serializers.ValidationError(_("Code has expired. Please login again."))

        challenge.attempt_count += 1
        challenge.save(update_fields=["attempt_count"])

        if challenge.attempt_count > 5:
            raise serializers.ValidationError(_("Too many attempts. Please login again."))

        user = challenge.user
        code = attrs["code"].strip()

        # Support both TOTP and plain OTP
        if challenge.delivery_method == "totp":
            valid = user.verify_totp(code)
        else:
            valid = (challenge.code == code)

        if not valid:
            raise serializers.ValidationError(_("Invalid verification code."))

        challenge.is_used = True
        challenge.save(update_fields=["is_used"])

        branch = Branch.objects.get(id=attrs["branch_id"])
        role_code = attrs["role"]
        refresh = RefreshToken.for_user(user)
        _add_token_claims(refresh, user, role_code, branch)

        request = self.context.get("request")
        LoginAudit.objects.create(
            user=user,
            email_attempted=user.email,
            event_type=LoginAudit.EventType.OTP_VERIFIED,
            ip_address=_get_client_ip(request),
            branch=branch,
            role_attempted=role_code,
        )
        LoginAudit.objects.create(
            user=user,
            email_attempted=user.email,
            event_type=LoginAudit.EventType.LOGIN_SUCCESS,
            ip_address=_get_client_ip(request),
            branch=branch,
            role_attempted=role_code,
        )

        user.last_login_ip = _get_client_ip(request)
        user.last_login_at = timezone.now()
        user.save(update_fields=["last_login_ip", "last_login_at"])

        return {
            "access": str(refresh.access_token),
            "refresh": str(refresh),
            "user": _user_data(user, role_code, branch),
        }


class UserSerializer(serializers.ModelSerializer):
    """Read-only user profile."""

    is_super_admin = serializers.BooleanField(read_only=True)

    class Meta:
        model = User
        fields = [
            "id", "email", "name", "phone", "avatar", "employee_id",
            "is_active", "default_branch", "is_2fa_enabled", "language",
            "theme", "notify_email", "notify_whatsapp", "notify_in_app",
            "last_login_at", "is_super_admin", "created_at",
        ]
        read_only_fields = ["id", "email", "created_at", "last_login_at"]


class PasswordChangeSerializer(serializers.Serializer):
    old_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True, min_length=10)
    confirm_password = serializers.CharField(write_only=True)

    def validate(self, attrs: dict[str, Any]) -> dict[str, Any]:
        if attrs["new_password"] != attrs["confirm_password"]:
            raise serializers.ValidationError(_("Passwords do not match."))
        return attrs


# ─── Helpers ──────────────────────────────────────────────────────────────────

def _get_client_ip(request: Any) -> str | None:
    if not request:
        return None
    x_forwarded_for = request.META.get("HTTP_X_FORWARDED_FOR")
    if x_forwarded_for:
        return x_forwarded_for.split(",")[0].strip()
    return request.META.get("REMOTE_ADDR")


def _add_token_claims(refresh: RefreshToken, user: User, role: str, branch: Branch) -> None:
    """Add custom claims to JWT: role, branch_id, branch_name."""
    refresh["role"] = role
    refresh["branch_id"] = str(branch.id)
    refresh["branch_code"] = branch.code
    refresh["branch_name"] = branch.name
    refresh["user_name"] = user.name
    refresh["user_email"] = user.email
    refresh.access_token["role"] = role
    refresh.access_token["branch_id"] = str(branch.id)
    refresh.access_token["branch_code"] = branch.code
    refresh.access_token["branch_name"] = branch.name


def _user_data(user: User, role: str, branch: Branch) -> dict[str, Any]:
    return {
        "id": str(user.id),
        "email": user.email,
        "name": user.name,
        "role": role,
        "branch_id": str(branch.id),
        "branch_name": branch.name,
        "language": user.language,
        "theme": user.theme,
        "avatar": user.avatar.url if user.avatar else None,
        "is_super_admin": user.is_super_admin,
    }


def _create_otp_challenge(user: User, request: Any) -> OTPChallenge:
    """Create a new OTP challenge, deleting old ones for this user."""
    import random
    import string

    OTPChallenge.objects.filter(user=user, is_used=False).delete()
    code = "".join(random.choices(string.digits, k=6))
    challenge = OTPChallenge.objects.create(
        user=user,
        code=code,
        delivery_method="totp" if user.is_2fa_enabled and user.totp_secret else "email",
        expires_at=timezone.now() + timedelta(seconds=settings.OTP_CODE_EXPIRY_SECONDS),
        ip_address=_get_client_ip(request),
    )
    # Fire Celery task to send OTP via email/SMS (non-blocking)
    from apps.notifications.tasks import send_otp_notification
    send_otp_notification.delay(str(user.id), code, challenge.delivery_method)
    return challenge
