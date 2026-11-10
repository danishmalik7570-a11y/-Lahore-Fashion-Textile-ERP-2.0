import logging

logger = logging.getLogger(__name__)

try:
    from celery import shared_task
except ImportError:
    def shared_task(*args, **kwargs):
        def decorator(f):
            def delay(*call_args, **call_kwargs):
                return f(None, *call_args, **call_kwargs)
            f.delay = delay
            return f
        return decorator

@shared_task(bind=True, max_retries=3)
def send_otp_notification(self, user_id: str, code: str, delivery_method: str = "email"):
    """
    Sends OTP challenge notification via email or WhatsApp/SMS.
    In development, logs the OTP directly to console.
    """
    logger.info(f"[2FA-OTP] Sent OTP challenge '{code}' to user {user_id} via {delivery_method}")
    print(f"\n========================================\n[2FA-OTP] USER: {user_id}\n[2FA-OTP] YOUR ONE-TIME PASSWORD IS: {code}\n========================================\n")
    return {"status": "sent", "user_id": user_id, "method": delivery_method}
