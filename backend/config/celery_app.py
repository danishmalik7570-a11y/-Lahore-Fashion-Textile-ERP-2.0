"""
Celery application configuration for Lahore Fashion ERP.
5 queues: default, high_priority, reports, notifications, payroll
Scheduled tasks via django-celery-beat (DatabaseScheduler).
"""
import os
from celery import Celery
from celery.schedules import crontab

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.dev")

app = Celery("lahorefashion_erp")

# Load settings from Django's settings module, namespace CELERY_
app.config_from_object("django.conf:settings", namespace="CELERY")

# Auto-discover tasks from all installed apps
app.autodiscover_tasks()

# ─── Periodic tasks (fallback if celery-beat DB is fresh) ─────────────────────
app.conf.beat_schedule = {
    # Every 15 min: flag delayed lots, update delay_days
    "check-delayed-lots": {
        "task": "apps.production.tasks.check_delayed_lots",
        "schedule": crontab(minute="*/15"),
        "options": {"queue": "high_priority"},
    },
    # Every 30 min: low stock check
    "check-low-stock": {
        "task": "apps.inventory.tasks.check_low_stock",
        "schedule": crontab(minute="*/30"),
        "options": {"queue": "high_priority"},
    },
    # Nightly 2am: refresh materialized views / report snapshots
    "refresh-report-snapshots": {
        "task": "apps.reports.tasks.refresh_report_snapshots",
        "schedule": crontab(hour=2, minute=0),
        "options": {"queue": "reports"},
    },
    # Nightly 3am: cheque due date alerts
    "cheque-due-alerts": {
        "task": "apps.finance.tasks.send_cheque_due_alerts",
        "schedule": crontab(hour=3, minute=0),
        "options": {"queue": "notifications"},
    },
    # Monthly 1st at 6am: payroll preview generation
    "monthly-payroll-preview": {
        "task": "apps.labour.tasks.generate_payroll_preview",
        "schedule": crontab(day_of_month=1, hour=6, minute=0),
        "options": {"queue": "payroll"},
    },
    # Daily at midnight: attendance daily summary
    "daily-attendance-summary": {
        "task": "apps.attendance.tasks.generate_daily_summary",
        "schedule": crontab(hour=0, minute=5),
        "options": {"queue": "default"},
    },
    # Daily at 1am: nightly backup trigger
    "nightly-backup": {
        "task": "apps.core.tasks.trigger_nightly_backup",
        "schedule": crontab(hour=1, minute=0),
        "options": {"queue": "default"},
    },
}

app.conf.timezone = "Asia/Karachi"


@app.task(bind=True, ignore_result=True)
def debug_task(self) -> None:  # type: ignore[type-arg]
    """Sanity-check task — prints request info."""
    print(f"Request: {self.request!r}")
