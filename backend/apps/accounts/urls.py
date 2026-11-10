"""
Accounts URL patterns — all auth endpoints.
"""
from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from apps.accounts import views

app_name = "auth"

urlpatterns = [
    # ── Login / 2FA ──────────────────────────────────────────────────────────
    path("login/", views.LoginView.as_view(), name="login"),
    path("2fa/send/", views.TwoFactorSendView.as_view(), name="2fa-send"),
    path("2fa/verify/", views.TwoFactorVerifyView.as_view(), name="2fa-verify"),
    path("2fa/setup/", views.TwoFactorSetupView.as_view(), name="2fa-setup"),
    path("2fa/enable/", views.TwoFactorEnableView.as_view(), name="2fa-enable"),
    path("2fa/disable/", views.TwoFactorDisableView.as_view(), name="2fa-disable"),

    # ── Token management ──────────────────────────────────────────────────────
    path("refresh/", TokenRefreshView.as_view(), name="token-refresh"),
    path("logout/", views.LogoutView.as_view(), name="logout"),

    # ── Profile ───────────────────────────────────────────────────────────────
    path("me/", views.MeView.as_view(), name="me"),

    # ── Password ──────────────────────────────────────────────────────────────
    path("password/change/", views.PasswordChangeView.as_view(), name="password-change"),
    path("password/forgot/", views.PasswordForgotView.as_view(), name="password-forgot"),
    path("password/reset/", views.PasswordResetView.as_view(), name="password-reset"),

    # ── Audit ─────────────────────────────────────────────────────────────────
    path("login-audit/", views.LoginAuditListView.as_view(), name="login-audit"),
]
