import uuid
from typing import Any
from django.db import models
from django.utils import timezone
from django.contrib.auth import authenticate
from django.utils.translation import gettext_lazy as _
from rest_framework import generics, permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from apps.accounts.models import LoginAudit, OTPChallenge, Role, User, UserRoleBranch
from apps.accounts.serializers import _create_otp_challenge, _get_client_ip
from apps.branches.models import Branch
from apps.rbac.permissions import RBACPermission, IsSelfOrAdmin
from apps.portals.models import (
    Portal,
    PortalNavItem,
    PortalDashboardLayout,
    PortalAccessLog,
    PortalAnnouncement,
)
from apps.portals.serializers import (
    PortalSerializer,
    PortalNavItemSerializer,
    PortalDashboardLayoutSerializer,
    PortalAnnouncementSerializer,
    PortalAccessLogSerializer,
    PortalLoginSerializer,
    StepUpAuthSerializer,
)


class PortalLoginView(APIView):
    """
    POST /api/v1/auth/portal/{portal_slug}/login
    Validates credentials and confirms role eligibility for this portal.
    Enforces mandatory 2FA on sensitive portals (HR, Finance, Owner, Admin).
    """
    permission_classes = [permissions.AllowAny]
    throttle_scope = "login"

    def post(self, request: Request, portal_slug: str) -> Response:
        serializer = PortalLoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        email = data["email"].strip().lower()
        password = data["password"]
        branch_id = data.get("branch_id")
        two_factor_code = data.get("two_factor_code", "").strip()

        # 1. Fetch portal
        portal = Portal.objects.filter(slug=portal_slug, is_active=True).first()
        if not portal:
            return Response(
                {"detail": _("Portal not found or currently inactive."), "code": "portal_not_found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        client_ip = _get_client_ip(request)
        user_agent = request.META.get("HTTP_USER_AGENT", "")

        # 2. Authenticate user
        user = authenticate(request=request, username=email, password=password)
        if not user:
            PortalAccessLog.objects.create(
                portal_slug=portal_slug,
                email_attempted=email,
                ip_address=client_ip,
                user_agent=user_agent,
                event=PortalAccessLog.Event.LOGIN_FAILED,
                details={"reason": "invalid_credentials"},
            )
            return Response(
                {"detail": _("Invalid email or password."), "code": "invalid_credentials"},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        if not user.is_active:
            return Response(
                {"detail": _("This account has been deactivated."), "code": "account_inactive"},
                status=status.HTTP_403_FORBIDDEN,
            )

        # 3. Determine user roles
        user_roles = list(
            user.role_branches.filter(is_active=True).values_list("role__code", flat=True)
        )
        if user.is_super_admin or user.is_superuser:
            user_roles.append(Role.RoleCode.SUPER_ADMIN)
        user_roles = list(set(user_roles))

        # Check if user has permission to open this portal
        allowed_roles_set = set(portal.allowed_roles)
        has_access = (
            user.is_superuser
            or Role.RoleCode.SUPER_ADMIN in user_roles
            or "owner" in user_roles
            or bool(allowed_roles_set.intersection(user_roles))
        )

        if not has_access:
            PortalAccessLog.objects.create(
                portal_slug=portal_slug,
                user=user,
                email_attempted=email,
                ip_address=client_ip,
                user_agent=user_agent,
                event=PortalAccessLog.Event.WRONG_PORTAL_DENIED,
                details={
                    "user_roles": user_roles,
                    "portal_allowed_roles": portal.allowed_roles,
                },
            )
            return Response(
                {
                    "detail": _("You do not have access to this portal with your assigned role."),
                    "code": "wrong_portal_access_denied",
                    "user_roles": user_roles,
                    "launcher_url": "/launcher",
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        # 4. Resolve Branch
        branch = None
        if branch_id:
            branch = Branch.objects.filter(id=branch_id, is_active=True).first()
        if not branch and user.default_branch:
            branch = user.default_branch
        if not branch:
            # Pick first branch assigned to user
            first_rb = user.role_branches.filter(is_active=True).first()
            if first_rb:
                branch = first_rb.branch
        if not branch:
            branch = Branch.objects.filter(is_active=True).first()

        # 5. Check 2FA requirement (dormant behind central AUTH_2FA_ENABLED flag, default OFF)
        from django.conf import settings
        auth_2fa_enabled = getattr(settings, "AUTH_2FA_ENABLED", False)
        requires_2fa = auth_2fa_enabled and (portal.require_2fa or user.is_2fa_enabled)
        if requires_2fa:
            if not two_factor_code:
                # Issue challenge if user doesn't already have TOTP or request code
                challenge = _create_otp_challenge(user, request)
                return Response(
                    {
                        "requires_2fa": True,
                        "challenge_id": str(challenge.challenge_id),
                        "delivery_method": challenge.delivery_method,
                        "portal": portal_slug,
                        "message": _("Two-factor authentication code required for this portal."),
                    },
                    status=status.HTTP_200_OK,
                )
            else:
                # Verify code
                is_valid = False
                if user.is_2fa_enabled and user.totp_secret:
                    is_valid = user.verify_totp(two_factor_code)
                if not is_valid:
                    # Check OTPChallenge
                    ch = OTPChallenge.objects.filter(
                        user=user, code=two_factor_code, is_used=False
                    ).order_by("-expires_at").first()
                    if ch and not ch.is_expired:
                        ch.is_used = True
                        ch.save(update_fields=["is_used"])
                        is_valid = True

                if not is_valid:
                    return Response(
                        {"detail": _("Invalid two-factor authentication code."), "code": "invalid_2fa"},
                        status=status.HTTP_400_BAD_REQUEST,
                    )

        # 6. Issue JWT Tokens with portal-specific claims
        refresh = RefreshToken.for_user(user)
        refresh["portal"] = portal_slug
        refresh["roles"] = user_roles
        primary_role = user_roles[0] if user_roles else "user"
        refresh["role"] = primary_role
        refresh["branch_id"] = str(branch.id) if branch else None
        refresh["branch_name"] = branch.name if branch else ""
        refresh["branch_code"] = branch.code if branch else ""
        refresh["user_name"] = user.name
        refresh["user_email"] = user.email

        refresh.access_token["portal"] = portal_slug
        refresh.access_token["roles"] = user_roles
        refresh.access_token["role"] = primary_role
        refresh.access_token["branch_id"] = str(branch.id) if branch else None
        refresh.access_token["branch_name"] = branch.name if branch else ""
        refresh.access_token["branch_code"] = branch.code if branch else ""

        # Update login tracking
        user.last_login_ip = client_ip
        user.last_login_at = timezone.now()
        user.save(update_fields=["last_login_ip", "last_login_at"])

        PortalAccessLog.objects.create(
            portal_slug=portal_slug,
            user=user,
            email_attempted=email,
            ip_address=client_ip,
            user_agent=user_agent,
            event=PortalAccessLog.Event.LOGIN_SUCCESS,
            details={"branch": branch.name if branch else None, "role": primary_role},
        )

        return Response(
            {
                "requires_2fa": False,
                "access": str(refresh.access_token),
                "refresh": str(refresh),
                "portal": PortalSerializer(portal).data,
                "user": {
                    "id": str(user.id),
                    "email": user.email,
                    "name": user.name,
                    "roles": user_roles,
                    "primary_role": primary_role,
                    "branch_id": str(branch.id) if branch else None,
                    "branch_name": branch.name if branch else "",
                    "is_super_admin": user.is_super_admin,
                    "language": user.language,
                    "theme": user.theme,
                },
            },
            status=status.HTTP_200_OK,
        )


class PortalStepUpAuthView(APIView):
    """
    POST /api/v1/auth/portal/{portal_slug}/step-up
    Step-up authentication required for high-risk actions (e.g. payroll approval, bank file generation).
    """
    permission_classes = [permissions.IsAuthenticated, IsSelfOrAdmin]

    def post(self, request: Request, portal_slug: str) -> Response:
        from django.conf import settings
        step_up_enabled = getattr(settings, "AUTH_STEP_UP_ENABLED", False)

        user = request.user
        action_name = request.data.get("action", "general_step_up")

        # When step-up is disabled, authorize immediately without prompting for password or 2FA
        if not step_up_enabled:
            step_up_token = str(uuid.uuid4())
            PortalAccessLog.objects.create(
                portal_slug=portal_slug,
                user=user,
                email_attempted=user.email,
                ip_address=_get_client_ip(request),
                user_agent=request.META.get("HTTP_USER_AGENT", ""),
                event=PortalAccessLog.Event.STEP_UP_VERIFIED,
                details={"action": action_name, "step_up_token": step_up_token, "bypass_flag": True},
            )
            return Response(
                {
                    "success": True,
                    "step_up_token": step_up_token,
                    "action": action_name,
                    "valid_minutes": 60,
                    "message": _("Action authorized successfully."),
                },
                status=status.HTTP_200_OK,
            )

        serializer = StepUpAuthSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        password = data.get("password")
        two_factor_code = data.get("two_factor_code")

        verified = False
        if password and user.check_password(password):
            verified = True
        elif two_factor_code:
            if user.is_2fa_enabled and user.totp_secret and user.verify_totp(two_factor_code):
                verified = True
            else:
                ch = OTPChallenge.objects.filter(
                    user=user, code=two_factor_code, is_used=False
                ).first()
                if ch and not ch.is_expired:
                    ch.is_used = True
                    ch.save(update_fields=["is_used"])
                    verified = True

        if not verified:
            return Response(
                {"detail": _("Step-up authentication failed. Incorrect password or 2FA code."), "code": "step_up_failed"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        step_up_token = str(uuid.uuid4())
        PortalAccessLog.objects.create(
            portal_slug=portal_slug,
            user=user,
            email_attempted=user.email,
            ip_address=_get_client_ip(request),
            user_agent=request.META.get("HTTP_USER_AGENT", ""),
            event=PortalAccessLog.Event.STEP_UP_VERIFIED,
            details={"action": action_name, "step_up_token": step_up_token},
        )

        return Response(
            {
                "success": True,
                "step_up_token": step_up_token,
                "action": action_name,
                "valid_minutes": 15,
                "message": _("Action authorized successfully."),
            },
            status=status.HTTP_200_OK,
        )


class UserPortalsMeView(APIView):
    """
    GET /api/v1/portals/me
    Returns all portals the authenticated user is entitled to open (for App Launcher / Switcher).
    """
    permission_classes = [permissions.IsAuthenticated, IsSelfOrAdmin]

    def get(self, request: Request) -> Response:
        user = request.user
        user_roles = list(
            user.role_branches.filter(is_active=True).values_list("role__code", flat=True)
        )
        if user.is_super_admin or user.is_superuser:
            user_roles.append(Role.RoleCode.SUPER_ADMIN)
        user_roles = list(set(user_roles))

        all_portals = Portal.objects.filter(is_active=True).order_by("name")
        allowed_portals = []

        for p in all_portals:
            if user.is_superuser or Role.RoleCode.SUPER_ADMIN in user_roles or "owner" in user_roles:
                is_allowed = True
            else:
                is_allowed = bool(set(p.allowed_roles).intersection(user_roles))

            if is_allowed:
                # Check for last accessed
                last_log = (
                    PortalAccessLog.objects.filter(
                        portal_slug=p.slug, user=user, event=PortalAccessLog.Event.LOGIN_SUCCESS
                    )
                    .order_by("-created_at")
                    .first()
                )
                allowed_portals.append({
                    "id": str(p.id),
                    "code": p.code,
                    "name": p.name,
                    "slug": p.slug,
                    "description": p.description,
                    "theme_json": p.theme_json,
                    "landing_route": p.landing_route,
                    "require_2fa": p.require_2fa,
                    "session_timeout_minutes": p.session_timeout_minutes,
                    "last_accessed_at": last_log.created_at if last_log else None,
                    "unread_notifications": 0,
                })

        return Response({"portals": allowed_portals, "user_roles": user_roles})


class PortalBootstrapView(APIView):
    """
    GET /api/v1/portals/{slug}/bootstrap
    Consolidated initial data fetch for an authorized portal session.
    """
    permission_classes = [permissions.IsAuthenticated, IsSelfOrAdmin]

    def get(self, request: Request, portal_slug: str) -> Response:
        portal = Portal.objects.filter(slug=portal_slug, is_active=True).first()
        if not portal:
            return Response(
                {"detail": _("Portal not found or inactive.")},
                status=status.HTTP_404_NOT_FOUND,
            )

        user = request.user
        user_roles = list(
            user.role_branches.filter(is_active=True).values_list("role__code", flat=True)
        )
        if user.is_super_admin or user.is_superuser:
            user_roles.append(Role.RoleCode.SUPER_ADMIN)
        user_roles = list(set(user_roles))

        # Check access
        if not (user.is_superuser or Role.RoleCode.SUPER_ADMIN in user_roles):
            if not set(portal.allowed_roles).intersection(user_roles):
                return Response(
                    {"detail": _("Access denied for this portal.")},
                    status=status.HTTP_403_FORBIDDEN,
                )

        # 1. Nav items (hierarchical, ordered)
        nav_qs = PortalNavItem.objects.filter(portal=portal, parent=None).order_by("order")
        nav_serialized = PortalNavItemSerializer(nav_qs, many=True).data

        # 2. Dashboard Layout (user specific -> role specific -> default)
        layout = (
            PortalDashboardLayout.objects.filter(portal=portal, user=user)
            .order_by("-version")
            .first()
        )
        if not layout:
            for role_code in user_roles:
                layout = (
                    PortalDashboardLayout.objects.filter(portal=portal, role_code=role_code)
                    .order_by("-version")
                    .first()
                )
                if layout:
                    break
        if not layout:
            layout = (
                PortalDashboardLayout.objects.filter(portal=portal, user__isnull=True, role_code__isnull=True)
                .order_by("-version")
                .first()
            )

        # 3. Active announcements
        now = timezone.now()
        announcements = PortalAnnouncement.objects.filter(
            is_active=True
        ).filter(
            models.Q(portal=portal) | models.Q(portal__isnull=True)
        ).filter(
            models.Q(expires_at__isnull=True) | models.Q(expires_at__gt=now)
        ).order_by("-created_at")

        # 4. User profile & available branches
        branches = Branch.objects.filter(is_active=True).values("id", "code", "name", "city")

        return Response({
            "portal": PortalSerializer(portal).data,
            "navigation": nav_serialized,
            "layout": layout.layout_json if layout else {},
            "announcements": PortalAnnouncementSerializer(announcements[:5], many=True).data,
            "user": {
                "id": str(user.id),
                "name": user.name,
                "email": user.email,
                "roles": user_roles,
                "language": user.language,
                "theme": user.theme,
                "is_super_admin": user.is_super_admin,
            },
            "available_branches": list(branches),
        })


class PortalViewSet(viewsets.ModelViewSet):
    """Admin CRUD for Portals."""
    queryset = Portal.objects.all().order_by("name")
    serializer_class = PortalSerializer
    permission_classes = [permissions.IsAuthenticated, RBACPermission]
    rbac_module = "settings"


class PortalDashboardLayoutViewSet(viewsets.ModelViewSet):
    """Get and save user customized portal layouts."""
    queryset = PortalDashboardLayout.objects.all()
    serializer_class = PortalDashboardLayoutSerializer
    permission_classes = [permissions.IsAuthenticated, IsSelfOrAdmin]

    @action(detail=False, methods=["post"], url_path="save-user-layout")
    def save_user_layout(self, request: Request) -> Response:
        portal_slug = request.data.get("portal_slug")
        layout_json = request.data.get("layout_json")
        portal = Portal.objects.filter(slug=portal_slug).first()
        if not portal:
            return Response({"detail": "Invalid portal"}, status=status.HTTP_400_BAD_REQUEST)

        obj, _ = PortalDashboardLayout.objects.update_or_create(
            portal=portal,
            user=request.user,
            defaults={"layout_json": layout_json, "version": 2},
        )
        return Response({"status": "saved", "id": str(obj.id)})

    @action(detail=False, methods=["post"], url_path="reset-to-default")
    def reset_to_default(self, request: Request) -> Response:
        portal_slug = request.data.get("portal_slug")
        portal = Portal.objects.filter(slug=portal_slug).first()
        if portal:
            PortalDashboardLayout.objects.filter(portal=portal, user=request.user).delete()
        return Response({"status": "reset"})


class PortalAnnouncementViewSet(viewsets.ModelViewSet):
    queryset = PortalAnnouncement.objects.all()
    serializer_class = PortalAnnouncementSerializer
    permission_classes = [permissions.IsAuthenticated, RBACPermission]
    rbac_module = "settings"


class PortalAccessLogViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = PortalAccessLog.objects.all().order_by("-created_at")
    serializer_class = PortalAccessLogSerializer
    permission_classes = [permissions.IsAuthenticated, RBACPermission]
    rbac_module = "audit"
    filterset_fields = ["portal_slug", "event"]
