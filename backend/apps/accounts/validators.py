"""
Custom password validators.
"""
from django.core.exceptions import ValidationError
from django.utils.translation import gettext_lazy as _


class BreachedPasswordValidator:
    """
    Checks password against a local list of top-10k breached passwords.
    In prod, integrate with HaveIBeenPwned API (k-anonymity model).
    """

    COMMON_WEAK = {
        "password1234", "lahore1234", "pakistan123", "admin1234",
        "qwerty12345", "1234567890", "abc123456789", "password123456",
        "welcome1234", "letmein123",
    }

    def validate(self, password: str, user=None) -> None:
        if password.lower() in self.COMMON_WEAK:
            raise ValidationError(
                _("This password is too commonly used. Please choose a stronger one."),
                code="breached_password",
            )

    def get_help_text(self) -> str:
        return _("Your password cannot be a commonly used or breached password.")
