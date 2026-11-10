"""
Accounts views — Auth endpoints:
POST /auth/login            → email+password+role+branch → JWT or 2FA challenge
POST /auth/2fa/send         → resend OTP
POST /auth/2fa/verify       → verify OTP → JWT
POST /auth/refresh          → rotate refresh token
POST /auth/logout           → blacklist refresh token
GET  /auth/me               → current user profile
PATCH /auth/me              → update profile/preferences
POST /auth/password/change  → change password
POST /auth/password/forgot  → send reset link
POST /auth/password/reset   → confirm reset
GET  /auth/login-audit      → user's own login history
POST /auth/2fa/setup        → generate TOTP secret + QR
POST /auth/2fa/enable       → verify TOTP + enable 2FA
POST /auth/2fa/disable      → disable 2FA (requires password)
"""
from __future__ import annotations

from typing import Any

from django.conf import settings
from django.contrib.auth.tokens import PasswordResetTokenGenerator
from django.utils import timezone
from django.utils.encoding import force_bytes, force_str
from django.utils.http import urlsafe_base64_decode, urlsafe_base64_encode
from django.utils.translation import gettext_lazy as _
from rest_framework import generics, permissions, serializers, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenRefreshView

from apps.accounts.models import LoginAudit, OTPChallenge, User
from apps.rbac.permissions import IsSelfOrAdmin
from apps.accounts.serializers import (
    CustomTokenObtainSerializer,
    PasswordChangeSerializer,
    TwoFactorSendSerializer,
    TwoFactorVerifySerializer,
    UserSerializer,
    _create_otp_challenge,
)


# ─── Login ────────────────────────────────────────────────────────────────────

class LoginView(APIView):
    """
    POST /auth/login
    Body: {email, password, role, branch_id}
    Response:
      Success:  {requires_2fa: false, access, refresh, user}
      2FA Req:  {requires_2fa: true, challenge_id, delivery_method}
    Rate-limited by django-axes (5 failures → 30 min lockout).
    """
    permission_classes = [permissions.AllowAny]
    throttle_scope = "login"

    def post(self, request: Request) -> Response:
        serializer = CustomTokenObtainSerializer(
            data=request.data, context={"request": request}
        )
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        # Strip internal keys before responding
        data.pop("_user_id", None)
        data.pop("_role", None)
        data.pop("_branch_id", None)
        return Response(data, status=status.HTTP_200_OK)


# ─── 2FA ─────────────────────────────────────────────────────────────────────

class TwoFactorSendView(APIView):
    """POST /auth/2fa/send — resend OTP (60s cooldown enforced)."""
    permission_classes = [permissions.AllowAny]

    def post(self, request: Request) -> Response:
        serializer = TwoFactorSendSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        challenge = serializer.validated_data["challenge"]
        _create_otp_challenge(challenge.user, request)
        return Response({"message": _("Verification code sent.")}, status=status.HTTP_200_OK)


class TwoFactorVerifyView(APIView):
    """POST /auth/2fa/verify — submit OTP → receive JWT tokens."""
    permission_classes = [permissions.AllowAny]

    def post(self, request: Request) -> Response:
        serializer = TwoFactorVerifySerializer(
            data=request.data, context={"request": request}
        )
        serializer.is_valid(raise_exception=True)
        return Response(serializer.validated_data, status=status.HTTP_200_OK)


class TwoFactorSetupView(APIView):
    """POST /auth/2fa/setup — generate TOTP secret + provisioning URI."""
    permission_classes = [permissions.IsAuthenticated, IsSelfOrAdmin]

    def post(self, request: Request) -> Response:
        user = request.user
        secret = user.generate_totp_secret()
        uri = user.get_totp_uri()
        # Generate QR code as base64 PNG
        import qrcode, io, base64
        img = qrcode.make(uri)
        buf = io.BytesIO()
        img.save(buf, format="PNG")
        qr_b64 = base64.b64encode(buf.getvalue()).decode()
        return Response({
            "secret": secret,
            "provisioning_uri": uri,
            "qr_code": f"data:image/png;base64,{qr_b64}",
            "message": _("Scan this QR with your authenticator app, then call /auth/2fa/enable."),
        })


class TwoFactorEnableView(APIView):
    """POST /auth/2fa/enable — verify first TOTP code and mark 2FA enabled."""
    permission_classes = [permissions.IsAuthenticated, IsSelfOrAdmin]

    def post(self, request: Request) -> Response:
        code = request.data.get("code", "").strip()
        user = request.user
        if not code:
            return Response({"detail": _("Code is required.")}, status=status.HTTP_400_BAD_REQUEST)
        if not user.verify_totp(code):
            return Response({"detail": _("Invalid code.")}, status=status.HTTP_400_BAD_REQUEST)
        user.is_2fa_enabled = True
        user.is_2fa_verified = True
        user.save(update_fields=["is_2fa_enabled", "is_2fa_verified"])
        return Response({"message": _("Two-factor authentication enabled successfully.")})


class TwoFactorDisableView(APIView):
    """POST /auth/2fa/disable — disable 2FA (requires current password)."""
    permission_classes = [permissions.IsAuthenticated, IsSelfOrAdmin]

    def post(self, request: Request) -> Response:
        password = request.data.get("password", "")
        user = request.user
        if not user.check_password(password):
            return Response({"detail": _("Incorrect password.")}, status=status.HTTP_400_BAD_REQUEST)
        user.is_2fa_enabled = False
        user.is_2fa_verified = False
        user.totp_secret = ""
        user.save(update_fields=["is_2fa_enabled", "is_2fa_verified", "totp_secret"])
        return Response({"message": _("Two-factor authentication disabled.")})


# ─── Token Refresh / Logout ───────────────────────────────────────────────────

class LogoutView(APIView):
    """POST /auth/logout — blacklist the refresh token."""
    permission_classes = [permissions.IsAuthenticated, IsSelfOrAdmin]

    def post(self, request: Request) -> Response:
        refresh_token = request.data.get("refresh")
        if not refresh_token:
            return Response(
                {"detail": _("Refresh token required.")},
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            token = RefreshToken(refresh_token)
            token.blacklist()
        except TokenError:
            pass  # Already blacklisted — treat as success

        user = request.user
        LoginAudit.objects.create(
            user=user,
            email_attempted=user.email,
            event_type=LoginAudit.EventType.LOGOUT,
            ip_address=request.META.get("REMOTE_ADDR"),
        )
        return Response({"message": _("Successfully logged out.")}, status=status.HTTP_200_OK)


# ─── Current User Profile ─────────────────────────────────────────────────────

class MeView(generics.RetrieveUpdateAPIView):
    """GET/PATCH /auth/me"""
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated, IsSelfOrAdmin]

    def get_object(self) -> User:
        return self.request.user  # type: ignore[return-value]


# ─── Password Management ──────────────────────────────────────────────────────

class PasswordChangeView(APIView):
    """POST /auth/password/change"""
    permission_classes = [permissions.IsAuthenticated, IsSelfOrAdmin]

    def post(self, request: Request) -> Response:
        serializer = PasswordChangeSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = request.user
        if not user.check_password(serializer.validated_data["old_password"]):
            return Response(
                {"detail": _("Incorrect current password.")},
                status=status.HTTP_400_BAD_REQUEST,
            )
        user.set_password(serializer.validated_data["new_password"])
        user.password_changed_at = timezone.now()
        user.must_change_password = False
        user.save(update_fields=["password", "password_changed_at", "must_change_password"])
        return Response({"message": _("Password updated successfully.")})


class PasswordForgotView(APIView):
    """POST /auth/password/forgot — send reset email."""
    permission_classes = [permissions.AllowAny]

    def post(self, request: Request) -> Response:
        email = request.data.get("email", "").lower().strip()
        # Always return 200 to prevent email enumeration
        try:
            user = User.objects.get(email=email, is_active=True)
            generator = PasswordResetTokenGenerator()
            token = generator.make_token(user)
            uid = urlsafe_base64_encode(force_bytes(user.pk))
            from apps.notifications.tasks import send_password_reset_email
            send_password_reset_email.delay(str(user.id), uid, token)
        except User.DoesNotExist:
            pass
        return Response(
            {"message": _("If that email exists, a reset link has been sent.")},
            status=status.HTTP_200_OK,
        )


class PasswordResetView(APIView):
    """POST /auth/password/reset — confirm reset with uid + token."""
    permission_classes = [permissions.AllowAny]

    def post(self, request: Request) -> Response:
        uid = request.data.get("uid", "")
        token = request.data.get("token", "")
        new_password = request.data.get("new_password", "")

        if len(new_password) < 10:
            return Response(
                {"detail": _("Password must be at least 10 characters.")},
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            user_id = force_str(urlsafe_base64_decode(uid))
            user = User.objects.get(pk=user_id, is_active=True)
        except (User.DoesNotExist, ValueError, TypeError):
            return Response({"detail": _("Invalid reset link.")}, status=status.HTTP_400_BAD_REQUEST)

        generator = PasswordResetTokenGenerator()
        if not generator.check_token(user, token):
            return Response({"detail": _("Invalid or expired reset link.")}, status=status.HTTP_400_BAD_REQUEST)

        user.set_password(new_password)
        user.password_changed_at = timezone.now()
        user.must_change_password = False
        user.save(update_fields=["password", "password_changed_at", "must_change_password"])
        LoginAudit.objects.create(
            user=user,
            email_attempted=user.email,
            event_type=LoginAudit.EventType.PASSWORD_RESET,
        )
        return Response({"message": _("Password reset successful. Please login.")})


# ─── Login Audit (own history) ────────────────────────────────────────────────

class LoginAuditListView(generics.ListAPIView):
    """GET /auth/login-audit — last 50 login events for current user."""
    permission_classes = [permissions.IsAuthenticated, IsSelfOrAdmin]

    def get(self, request: Request) -> Response:
        logs = LoginAudit.objects.filter(user=request.user).order_by("-timestamp")[:50]
        data = [
            {
                "event": l.event_type,
                "ip": l.ip_address,
                "branch": l.branch.name if l.branch else None,
                "timestamp": l.timestamp,
            }
            for l in logs
        ]
        return Response(data)
