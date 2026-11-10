"""
Lahore Fashion Textile ERP — Base Django Settings
Python 3.12 | Django 5.1 | PostgreSQL 16 | Redis 7
All environment variables loaded via django-environ.
"""

from pathlib import Path
import environ
import structlog

# ─── Paths ────────────────────────────────────────────────────────────────────
BASE_DIR = Path(__file__).resolve().parent.parent.parent  # backend/
ROOT_DIR = BASE_DIR.parent  # project root

# ─── Environment ──────────────────────────────────────────────────────────────
env = environ.Env(
    DEBUG=(bool, False),
    ALLOWED_HOSTS=(list, ["localhost", "127.0.0.1"]),
    CORS_ALLOWED_ORIGINS=(list, ["http://localhost:5173", "http://localhost:3000"]),
    LANGUAGE_CODE=(str, "en-us"),
    TIME_ZONE=(str, "Asia/Karachi"),
    USE_I18N=(bool, True),
    USE_TZ=(bool, True),
    DJANGO_SUPERUSER_EMAIL=(str, "owner@lahorefashion.com"),
)

environ.Env.read_env(ROOT_DIR / ".env")

# ─── Security ─────────────────────────────────────────────────────────────────
SECRET_KEY = env("SECRET_KEY")
DEBUG = env("DEBUG")
ALLOWED_HOSTS = env("ALLOWED_HOSTS")

# ─── Application Definition ───────────────────────────────────────────────────
DJANGO_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "django.contrib.humanize",
]

import importlib.util

def is_package_available(name: str) -> bool:
    try:
        return importlib.util.find_spec(name) is not None
    except (ImportError, AttributeError, ValueError):
        return False

THIRD_PARTY_APPS = [
    # REST framework
    "rest_framework",
    "rest_framework_simplejwt",
    "rest_framework_simplejwt.token_blacklist",
    "drf_spectacular",
    "django_filters",
    "corsheaders",
    "axes",
    # Celery
    "django_celery_beat",
    "django_celery_results",
    # Channels (WebSocket)
    "channels",
    # Audit / History
    "simple_history",
    # Import/Export
    "import_export",
    # Storage
    "storages",
    # Money
    "djmoney",
    # Monitoring
    "django_prometheus",
]

if is_package_available("allauth"):
    THIRD_PARTY_APPS += [
        "allauth",
        "allauth.account",
        "allauth.socialaccount",
        "allauth.socialaccount.providers.google",
        "allauth.socialaccount.providers.microsoft",
    ]

if is_package_available("guardian"):
    THIRD_PARTY_APPS.append("guardian")

if is_package_available("auditlog"):
    THIRD_PARTY_APPS.append("auditlog")

if is_package_available("health_check"):
    THIRD_PARTY_APPS += [
        "health_check",
        "health_check.db",
        "health_check.cache",
        "health_check.storage",
    ]

LOCAL_APPS = [
    "apps.core",
    "apps.branches",
    "apps.accounts",
    "apps.rbac",
    "apps.hr",
    "apps.clients",
    "apps.orders",
    "apps.production",
    "apps.inventory",
    "apps.quality",
    "apps.labour",
    "apps.attendance",
    "apps.delivery",
    "apps.finance",
    "apps.reports",
    "apps.notifications",
    "apps.sync",
    "apps.audit",
    "apps.settings_app",
    "apps.printing",
    "apps.portals",
]

INSTALLED_APPS = DJANGO_APPS + THIRD_PARTY_APPS + LOCAL_APPS

# ─── Middleware ────────────────────────────────────────────────────────────────
MIDDLEWARE = [
    "django_prometheus.middleware.PrometheusBeforeMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.security.SecurityMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.locale.LocaleMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
    "axes.middleware.AxesMiddleware",
]

if is_package_available("auditlog"):
    MIDDLEWARE.append("auditlog.middleware.AuditlogMiddleware")

if is_package_available("allauth"):
    MIDDLEWARE.append("allauth.account.middleware.AccountMiddleware")

MIDDLEWARE.append("django_prometheus.middleware.PrometheusAfterMiddleware")

ROOT_URLCONF = "config.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [BASE_DIR / "templates"],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
                "django.template.context_processors.i18n",
            ],
        },
    },
]

WSGI_APPLICATION = "config.wsgi.application"
ASGI_APPLICATION = "config.asgi.application"

# ─── Database (PostgreSQL 16) ──────────────────────────────────────────────────
DATABASES = {
    "default": env.db("DATABASE_URL", default="postgres://lfuser:lfpass@localhost:5432/lahorefashion"),
}
DATABASES["default"]["OPTIONS"] = {
    "connect_timeout": 10,
    "options": "-c search_path=public",
}
DATABASES["default"]["ATOMIC_REQUESTS"] = True
DATABASES["default"]["CONN_MAX_AGE"] = env.int("CONN_MAX_AGE", default=60)

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# ─── Custom User Model ────────────────────────────────────────────────────────
AUTH_USER_MODEL = "accounts.User"

# ─── Authentication Backends ─────────────────────────────────────────────────
AUTHENTICATION_BACKENDS = [
    "axes.backends.AxesStandaloneBackend",
    "django.contrib.auth.backends.ModelBackend",
]
if is_package_available("allauth"):
    AUTHENTICATION_BACKENDS.append("allauth.account.auth_backends.AuthenticationBackend")
if is_package_available("guardian"):
    AUTHENTICATION_BACKENDS.append("guardian.backends.ObjectPermissionBackend")

# ─── Password Validation ─────────────────────────────────────────────────────
AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator", "OPTIONS": {"min_length": 10}},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
    {"NAME": "apps.accounts.validators.BreachedPasswordValidator"},
]

# ─── Password Hasher (Argon2 first, fallback bcrypt, standard PBKDF2) ────────
PASSWORD_HASHERS = []
if is_package_available("argon2"):
    PASSWORD_HASHERS.append("django.contrib.auth.hashers.Argon2PasswordHasher")
if is_package_available("bcrypt"):
    PASSWORD_HASHERS.append("django.contrib.auth.hashers.BCryptSHA256PasswordHasher")
PASSWORD_HASHERS.append("django.contrib.auth.hashers.PBKDF2PasswordHasher")

# ─── Redis ────────────────────────────────────────────────────────────────────
REDIS_URL = env("REDIS_URL", default="redis://localhost:6379/0")

CACHES = {
    "default": {
        "BACKEND": "django_redis.cache.RedisCache",
        "LOCATION": REDIS_URL,
        "OPTIONS": {
            "CLIENT_CLASS": "django_redis.client.DefaultClient",
            "IGNORE_EXCEPTIONS": True,
            "SOCKET_CONNECT_TIMEOUT": 5,
            "SOCKET_TIMEOUT": 5,
            "PASSWORD": env("REDIS_PASSWORD", default=""),
        },
        "KEY_PREFIX": "lf_erp",
        "TIMEOUT": 300,
    }
}

SESSION_ENGINE = "django.contrib.sessions.backends.cache"
SESSION_CACHE_ALIAS = "default"

# ─── Channels (WebSocket) ─────────────────────────────────────────────────────
CHANNEL_LAYERS = {
    "default": {
        "BACKEND": "channels_redis.core.RedisChannelLayer",
        "CONFIG": {
            "hosts": [REDIS_URL],
            "capacity": 1500,
            "expiry": 10,
        },
    },
}

# ─── Celery ───────────────────────────────────────────────────────────────────
CELERY_BROKER_URL = env("CELERY_BROKER_URL", default="redis://localhost:6379/1")
CELERY_RESULT_BACKEND = env("CELERY_RESULT_BACKEND", default="django-db")
CELERY_ACCEPT_CONTENT = ["json"]
CELERY_TASK_SERIALIZER = "json"
CELERY_RESULT_SERIALIZER = "json"
CELERY_TIMEZONE = "Asia/Karachi"
CELERY_TASK_TRACK_STARTED = True
CELERY_TASK_TIME_LIMIT = 30 * 60  # 30 minutes hard limit
CELERY_TASK_SOFT_TIME_LIMIT = 25 * 60
CELERY_TASK_ALWAYS_EAGER = False
CELERY_BEAT_SCHEDULER = "django_celery_beat.schedulers:DatabaseScheduler"
CELERY_TASK_ROUTES = {
    "apps.reports.tasks.*": {"queue": "reports"},
    "apps.notifications.tasks.*": {"queue": "notifications"},
    "apps.labour.tasks.run_payroll*": {"queue": "payroll"},
    "apps.production.tasks.check_delays*": {"queue": "high_priority"},
    "apps.inventory.tasks.check_low_stock*": {"queue": "high_priority"},
}

# ─── REST Framework ───────────────────────────────────────────────────────────
REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "rest_framework_simplejwt.authentication.JWTAuthentication",
        "rest_framework.authentication.SessionAuthentication",
    ],
    "DEFAULT_PERMISSION_CLASSES": [
        "apps.rbac.permissions.DenyAll",
    ],
    "DEFAULT_PAGINATION_CLASS": "apps.core.pagination.CursorPagePagination",
    "PAGE_SIZE": 25,
    "DEFAULT_FILTER_BACKENDS": [
        "django_filters.rest_framework.DjangoFilterBackend",
        "rest_framework.filters.SearchFilter",
        "rest_framework.filters.OrderingFilter",
    ],
    "DEFAULT_SCHEMA_CLASS": "drf_spectacular.openapi.AutoSchema",
    "DEFAULT_RENDERER_CLASSES": [
        "rest_framework.renderers.JSONRenderer",
    ],
    "DEFAULT_PARSER_CLASSES": [
        "rest_framework.parsers.JSONParser",
        "rest_framework.parsers.MultiPartParser",
    ],
    "EXCEPTION_HANDLER": "apps.core.exceptions.rfc7807_exception_handler",
    "DEFAULT_THROTTLE_CLASSES": [
        "rest_framework.throttling.AnonRateThrottle",
        "rest_framework.throttling.UserRateThrottle",
    ],
    "DEFAULT_THROTTLE_RATES": {
        "anon": "20/min",
        "user": "300/min",
    },
}

# ─── JWT ─────────────────────────────────────────────────────────────────────
from datetime import timedelta

SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=15),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=7),
    "ROTATE_REFRESH_TOKENS": True,
    "BLACKLIST_AFTER_ROTATION": True,
    "UPDATE_LAST_LOGIN": True,
    "ALGORITHM": "HS256",
    "SIGNING_KEY": SECRET_KEY,
    "AUTH_HEADER_TYPES": ("Bearer",),
    "AUTH_HEADER_NAME": "HTTP_AUTHORIZATION",
    "USER_ID_FIELD": "id",
    "USER_ID_CLAIM": "user_id",
    "TOKEN_OBTAIN_SERIALIZER": "apps.accounts.serializers.CustomTokenObtainSerializer",
    "TOKEN_REFRESH_SERIALIZER": "rest_framework_simplejwt.serializers.TokenRefreshSerializer",
}

# ─── DRF Spectacular (OpenAPI) ────────────────────────────────────────────────
SPECTACULAR_SETTINGS = {
    "TITLE": "Lahore Fashion Textile ERP API",
    "DESCRIPTION": "Production-grade multi-branch Textile ERP — From Yarn to Global Fashion.",
    "VERSION": "1.0.0",
    "SERVE_INCLUDE_SCHEMA": False,
    "SCHEMA_PATH_PREFIX": "/api/v1/",
    "COMPONENT_SPLIT_REQUEST": True,
    "SORT_OPERATIONS": False,
    "TAGS": [
        {"name": "auth", "description": "Authentication & 2FA"},
        {"name": "dashboard", "description": "Dashboard aggregations"},
        {"name": "clients", "description": "Client management"},
        {"name": "orders", "description": "Order management"},
        {"name": "production", "description": "Lots & production tracking"},
        {"name": "inventory", "description": "Inventory & purchases"},
        {"name": "quality", "description": "QC inspections"},
        {"name": "labour", "description": "Workers & payroll"},
        {"name": "attendance", "description": "Attendance management"},
        {"name": "delivery", "description": "Challans & dispatch"},
        {"name": "finance", "description": "Ledger, invoices & payments"},
        {"name": "reports", "description": "Reports & analytics"},
        {"name": "settings", "description": "System settings"},
        {"name": "audit", "description": "Audit logs"},
    ],
}

# ─── CORS ────────────────────────────────────────────────────────────────────
CORS_ALLOWED_ORIGINS = env("CORS_ALLOWED_ORIGINS")
CORS_ALLOW_CREDENTIALS = True
CORS_ALLOW_HEADERS = [
    "accept",
    "accept-encoding",
    "authorization",
    "content-type",
    "dnt",
    "origin",
    "user-agent",
    "x-csrftoken",
    "x-requested-with",
    "x-branch-id",          # Custom: branch scoping
    "idempotency-key",      # Custom: idempotent writes
]

# ─── Django-Axes (Brute Force Lockout) ───────────────────────────────────────
AXES_ENABLED = True
AXES_FAILURE_LIMIT = 5
AXES_COOLOFF_TIME = timedelta(minutes=30)
AXES_LOCKOUT_PARAMETERS = ["username", "ip_address"]
AXES_RESET_ON_SUCCESS = True
AXES_LOCKOUT_CALLABLE = "apps.accounts.utils.axes_lockout_handler"
AXES_HANDLER = "axes.handlers.database.AxesDatabaseHandler"

# ─── Allauth ─────────────────────────────────────────────────────────────────
ACCOUNT_LOGIN_METHODS = {"email"}
ACCOUNT_SIGNUP_FIELDS = ["email*", "password1*", "password2*"]
ACCOUNT_EMAIL_VERIFICATION = "none"
ACCOUNT_USER_MODEL_USERNAME_FIELD = None
SOCIALACCOUNT_AUTO_SIGNUP = False
SOCIALACCOUNT_EMAIL_VERIFICATION = "none"
SOCIALACCOUNT_PROVIDERS = {
    "google": {
        "SCOPE": ["profile", "email"],
        "AUTH_PARAMS": {"access_type": "online"},
    },
    "microsoft": {
        "TENANT": env("MICROSOFT_TENANT_ID", default="common"),
    },
}

# ─── TOTP / 2FA ───────────────────────────────────────────────────────────────
OTP_TOTP_ISSUER = "Lahore Fashion ERP"
OTP_EMAIL_SENDER = env("DEFAULT_FROM_EMAIL", default="noreply@lahorefashion.com")
OTP_CODE_EXPIRY_SECONDS = 300   # 5 minutes
OTP_RESEND_COOLDOWN_SECONDS = 60

# ─── Internationalization ─────────────────────────────────────────────────────
LANGUAGE_CODE = "en-us"
TIME_ZONE = "Asia/Karachi"
USE_I18N = True
USE_L10N = True
USE_TZ = True

LANGUAGES = [
    ("en", "English"),
    ("ur", "اردو"),
]

LOCALE_PATHS = [BASE_DIR / "locale"]

# ─── Static & Media ───────────────────────────────────────────────────────────
STATIC_URL = "/static/"
STATIC_ROOT = BASE_DIR / "staticfiles"
STATICFILES_DIRS = [BASE_DIR / "static"]
STATICFILES_STORAGE = "whitenoise.storage.CompressedManifestStaticFilesStorage"

MEDIA_URL = "/media/"
MEDIA_ROOT = BASE_DIR / "mediafiles"

# ─── File Upload ─────────────────────────────────────────────────────────────
DATA_UPLOAD_MAX_MEMORY_SIZE = 10 * 1024 * 1024   # 10 MB
FILE_UPLOAD_MAX_MEMORY_SIZE = 10 * 1024 * 1024   # 10 MB
ALLOWED_UPLOAD_EXTENSIONS = [".jpg", ".jpeg", ".png", ".pdf", ".xlsx", ".csv", ".xls"]

LOGS_DIR = BASE_DIR / "logs"
LOGS_DIR.mkdir(parents=True, exist_ok=True)

# ─── Logging (structured via structlog) ──────────────────────────────────────
LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "json": {
            "()": structlog.stdlib.ProcessorFormatter,
            "processor": structlog.processors.JSONRenderer(),
        },
        "colored": {
            "()": structlog.stdlib.ProcessorFormatter,
            "processor": structlog.dev.ConsoleRenderer(),
        },
    },
    "handlers": {
        "console": {
            "class": "logging.StreamHandler",
            "formatter": "colored",
        },
        "json_file": {
            "class": "logging.handlers.RotatingFileHandler",
            "filename": LOGS_DIR / "django.log",
            "maxBytes": 10 * 1024 * 1024,
            "backupCount": 5,
            "formatter": "json",
            "delay": True,
        },
    },
    "root": {
        "handlers": ["console"],
        "level": "INFO",
    },
    "loggers": {
        "django": {"handlers": ["console"], "level": "WARNING", "propagate": False},
        "django.request": {"handlers": ["console"], "level": "ERROR", "propagate": False},
        "celery": {"handlers": ["console"], "level": "INFO", "propagate": False},
        "apps": {"handlers": ["console"], "level": "DEBUG", "propagate": False},
    },
}

structlog.configure(
    processors=[
        structlog.contextvars.merge_contextvars,
        structlog.stdlib.filter_by_level,
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.stdlib.add_logger_name,
        structlog.stdlib.add_log_level,
        structlog.stdlib.PositionalArgumentsFormatter(),
        structlog.processors.StackInfoRenderer(),
        structlog.processors.format_exc_info,
        structlog.processors.UnicodeDecoder(),
        structlog.stdlib.ProcessorFormatter.wrap_for_formatter,
    ],
    logger_factory=structlog.stdlib.LoggerFactory(),
    wrapper_class=structlog.stdlib.BoundLogger,
    cache_logger_on_first_use=True,
)

# ─── Email (dev: console backend) ─────────────────────────────────────────────
EMAIL_BACKEND = "django.core.mail.backends.console.EmailBackend"
DEFAULT_FROM_EMAIL = env("DEFAULT_FROM_EMAIL", default="noreply@lahorefashion.com")
SERVER_EMAIL = DEFAULT_FROM_EMAIL

# ─── Single Unit & Business Constants ───────────────────────────────────────
SINGLE_UNIT_MODE = env.bool("SINGLE_UNIT_MODE", default=True)
DEFAULT_UNIT_NAME = "Lahore Fashion Mill"
DEFAULT_UNIT_CODE = "LHR"
DEFAULT_UNIT_CITY = "Lahore"

CURRENCY_DEFAULT = "PKR"
DATE_FORMAT_DISPLAY = "DD-MMM-YYYY"         # e.g. 24-Apr-2024
WASTAGE_DEFAULT_THRESHOLD_PCT = 3.0          # % alert threshold
DELAYED_LOT_CHECK_INTERVAL_MINUTES = 15
DASHBOARD_CACHE_SECONDS = 30
REPORT_QUERY_TIMEOUT_SECONDS = 60
QR_TOKEN_ALGORITHM = "HS256"
QR_TOKEN_EXPIRY_DAYS = 3650                  # QR codes don't expire by default
PAYROLL_ROUNDING_RULE = "ROUND_HALF_UP"
LOW_STOCK_CHECK_AFTER_EVERY_ISSUE = True

# ─── WhatsApp Cloud API ───────────────────────────────────────────────────────
WHATSAPP_API_URL = "https://graph.facebook.com/v20.0"
WHATSAPP_PHONE_NUMBER_ID = env("WHATSAPP_PHONE_NUMBER_ID", default="")
WHATSAPP_ACCESS_TOKEN = env("WHATSAPP_ACCESS_TOKEN", default="")
WHATSAPP_ENABLED = env.bool("WHATSAPP_ENABLED", default=False)

# ─── MinIO / S3 ──────────────────────────────────────────────────────────────
AWS_ACCESS_KEY_ID = env("MINIO_ROOT_USER", default="minioadmin")
AWS_SECRET_ACCESS_KEY = env("MINIO_ROOT_PASSWORD", default="minio_change_me")
AWS_STORAGE_BUCKET_NAME = env("MINIO_BUCKET_NAME", default="lf-erp")
AWS_S3_ENDPOINT_URL = env("MINIO_ENDPOINT_URL", default="http://minio:9000")
AWS_S3_CUSTOM_DOMAIN = None
AWS_DEFAULT_ACL = "private"
AWS_S3_FILE_OVERWRITE = False
AWS_QUERYSTRING_AUTH = True
AWS_QUERYSTRING_EXPIRE = 3600  # 1 hour signed URLs

# ─── Sentry ──────────────────────────────────────────────────────────────────
SENTRY_DSN = env("SENTRY_DSN", default="")

# ─── Security Headers ────────────────────────────────────────────────────────
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = "DENY"

# ─── Auth Feature Flags ────────────────────────────────────────────────────────
# Master switches for 2FA and Step-Up re-authentication across all portals and roles.
# Default is OFF everywhere. Can be enabled via environment variables.
AUTH_2FA_ENABLED = env.bool("AUTH_2FA_ENABLED", default=False)
AUTH_STEP_UP_ENABLED = env.bool("AUTH_STEP_UP_ENABLED", default=False)
