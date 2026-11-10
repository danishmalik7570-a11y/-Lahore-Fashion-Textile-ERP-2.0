from django.apps import AppConfig


class HrConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.hr"
    verbose_name = "HR & Labour Management"

    def ready(self):
        try:
            import apps.hr.signals  # noqa: F401
        except ImportError:
            pass
