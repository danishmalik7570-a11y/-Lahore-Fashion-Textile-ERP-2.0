"""
Development settings — extends base.
Enables DEBUG, Django Debug Toolbar, console email, verbose logging.
"""
from .base import *  # noqa: F401, F403

DEBUG = True

ALLOWED_HOSTS = ["*"]

import sys
IS_TESTING = "test" in sys.argv or any("pytest" in arg for arg in sys.argv)

# ─── Dev-only apps ────────────────────────────────────────────────────────────
if not IS_TESTING:
    INSTALLED_APPS += [  # noqa: F405
        "debug_toolbar",
        "django_extensions",
    ]

    MIDDLEWARE = [  # noqa: F405
        "debug_toolbar.middleware.DebugToolbarMiddleware",
    ] + MIDDLEWARE  # noqa: F405

    DEBUG_TOOLBAR_CONFIG = {
        "IS_RUNNING_TESTS": False,
        "SHOW_TOOLBAR_CALLBACK": lambda request: DEBUG and not IS_TESTING,
        "SHOW_TEMPLATE_CONTEXT": True,
    }

# ─── Database (override for local dev without docker) ────────────────────────
import socket

def _can_resolve_host(host: str) -> bool:
    if not host or host in ("localhost", "127.0.0.1"):
        return True
    try:
        socket.gethostbyname(host)
        return True
    except socket.gaierror:
        return False

_db_host = DATABASES["default"].get("HOST", "")  # noqa: F405
if env.bool("USE_SQLITE", default=False) or (_db_host and not _can_resolve_host(_db_host)):
    DATABASES = {  # noqa: F405
        "default": {
            "ENGINE": "django.db.backends.sqlite3",
            "NAME": BASE_DIR / "db.sqlite3",  # noqa: F405
            "ATOMIC_REQUESTS": True,
        }
    }

# ─── Email (console for dev) ─────────────────────────────────────────────────
EMAIL_BACKEND = "django.core.mail.backends.console.EmailBackend"

# ─── Media (local) ───────────────────────────────────────────────────────────
DEFAULT_FILE_STORAGE = "django.core.files.storage.FileSystemStorage"

# ─── Celery (eager in dev mode to avoid redis connection blocks) ─────────────
CELERY_TASK_ALWAYS_EAGER = True
CELERY_TASK_EAGER_PROPAGATES = True

# ─── Axes (relax for dev) ─────────────────────────────────────────────────────
AXES_ENABLED = False

# ─── Logging ─────────────────────────────────────────────────────────────────
LOGGING["root"]["level"] = "DEBUG"  # noqa: F405

# ─── CORS ────────────────────────────────────────────────────────────────────
CORS_ALLOW_ALL_ORIGINS = True

# ─── Simple JWT (longer for dev comfort) ─────────────────────────────────────
from datetime import timedelta
SIMPLE_JWT = {  # noqa: F405
    **SIMPLE_JWT,  # noqa: F405
    "ACCESS_TOKEN_LIFETIME": timedelta(hours=8),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=30),
}
