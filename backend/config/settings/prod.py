"""
Production settings — extends base.
Enables HTTPS enforcement, S3 storage, anymail, strict security headers.
"""
from .base import *  # noqa: F401, F403
import sentry_sdk
from sentry_sdk.integrations.django import DjangoIntegration
from sentry_sdk.integrations.celery import CeleryIntegration
from sentry_sdk.integrations.redis import RedisIntegration

DEBUG = False

# ─── Sentry ──────────────────────────────────────────────────────────────────
if SENTRY_DSN:  # noqa: F405
    sentry_sdk.init(
        dsn=SENTRY_DSN,  # noqa: F405
        integrations=[
            DjangoIntegration(transaction_style="url"),
            CeleryIntegration(),
            RedisIntegration(),
        ],
        traces_sample_rate=0.1,
        profiles_sample_rate=0.1,
        send_default_pii=False,
        environment="production",
        release=env("APP_VERSION", default="1.0.0"),  # noqa: F405
    )

# ─── Security ────────────────────────────────────────────────────────────────
SECURE_SSL_REDIRECT = True
SECURE_HSTS_SECONDS = 31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SESSION_COOKIE_HTTPONLY = True
CSRF_COOKIE_HTTPONLY = True

# ─── S3/MinIO Storage ────────────────────────────────────────────────────────
DEFAULT_FILE_STORAGE = "storages.backends.s3boto3.S3Boto3Storage"
STATICFILES_STORAGE = "whitenoise.storage.CompressedManifestStaticFilesStorage"

# ─── Email (Anymail/Mailgun) ──────────────────────────────────────────────────
EMAIL_BACKEND = "anymail.backends.mailgun.EmailBackend"
ANYMAIL = {
    "MAILGUN_API_KEY": env("MAILGUN_API_KEY", default=""),  # noqa: F405
    "MAILGUN_SENDER_DOMAIN": env("MAILGUN_SENDER_DOMAIN", default=""),  # noqa: F405
}

# ─── Cache (Redis Sentinel / Cluster in prod) ─────────────────────────────────
# Keep default Redis for now; upgrade to Sentinel via REDIS_SENTINEL_URLS

# ─── Logging (JSON to file + console) ────────────────────────────────────────
LOGGING["root"]["handlers"] = ["console", "json_file"]  # noqa: F405
LOGGING["root"]["level"] = "WARNING"  # noqa: F405

# ─── Celery ────────────────────────────────────────────────────────────────────
CELERY_TASK_ALWAYS_EAGER = False
CELERY_WORKER_PREFETCH_MULTIPLIER = 1   # fair dispatch in prod
CELERY_TASK_ACKS_LATE = True

# ─── Axes (strict in prod) ────────────────────────────────────────────────────
AXES_ENABLED = True
