"""Axes lockout callback — returns DRF JSON response instead of HTML."""
from django.http import JsonResponse


def axes_lockout_handler(request, credentials=None, *args, **kwargs):
    return JsonResponse(
        {
            "type": "https://lahorefashion.com/errors/account_locked",
            "title": "Account Locked",
            "status": 403,
            "detail": (
                "Your account has been temporarily locked due to too many failed login attempts. "
                "Please wait 30 minutes or contact support."
            ),
        },
        status=403,
    )
