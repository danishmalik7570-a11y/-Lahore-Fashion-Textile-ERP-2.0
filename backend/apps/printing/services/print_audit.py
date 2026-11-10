"""
Print Audit & Cryptographic Verification Token Service.
Ensures document authenticity and tracks official reprints.
"""
import uuid
import hashlib
import hmac
from datetime import timedelta
from django.utils import timezone
from django.conf import settings
from apps.printing.models import PrintJob, VerifyToken


class PrintAuditService:
    SECRET_KEY = getattr(settings, "SECRET_KEY", "lf_print_secret_key_change_me")

    @classmethod
    def record_print_job(
        cls,
        doc_type: str,
        doc_id: str,
        template_version=None,
        user=None,
        copies: int = 1,
        copy_label: str = "Original",
        channel: str = "BROWSER",
        ip_address: str = None
    ) -> PrintJob:
        """
        Records an audit entry for every document printed or exported.
        If the document was printed previously, marks reprint_flag=True and increments reprint_count.
        """
        existing_prints = PrintJob.objects.filter(doc_type=doc_type, doc_id=doc_id).count()
        is_reprint = existing_prints > 0

        job = PrintJob.objects.create(
            doc_type=doc_type,
            doc_id=doc_id,
            template_version=template_version,
            user=user,
            copies=copies,
            copy_label=copy_label,
            channel=channel,
            status="COMPLETED",
            reprint_flag=is_reprint,
            reprint_count=existing_prints,
            ip_address=ip_address
        )
        return job

    @classmethod
    def generate_verification_token(cls, doc_type: str, doc_id: str, doc_number: str, metadata: dict = None) -> VerifyToken:
        """
        Creates a tamper-proof verification token linking to public verification page.
        """
        token = uuid.uuid4().hex
        payload = f"{doc_type}:{doc_id}:{doc_number}:{token}"
        sig = hmac.new(cls.SECRET_KEY.encode(), payload.encode(), hashlib.sha256).hexdigest()

        verify_record = VerifyToken.objects.create(
            doc_type=doc_type,
            doc_id=doc_id,
            doc_number=doc_number,
            token=token,
            signature=sig,
            expires_at=timezone.now() + timedelta(days=365),
            metadata=metadata or {}
        )
        return verify_record

    @classmethod
    def verify_token(cls, token: str) -> dict:
        """
        Verifies public document validity. Returns safe public summary.
        """
        record = VerifyToken.objects.filter(token=token).first()
        if not record:
            return {"is_valid": False, "message": "Invalid or expired document verification token."}

        # Check signature
        payload = f"{record.doc_type}:{record.doc_id}:{record.doc_number}:{record.token}"
        expected_sig = hmac.new(cls.SECRET_KEY.encode(), payload.encode(), hashlib.sha256).hexdigest()

        if record.signature != expected_sig:
            return {"is_valid": False, "message": "Security verification signature mismatch."}

        return {
            "is_valid": True,
            "doc_number": record.doc_number,
            "doc_type": record.doc_type,
            "issued_at": record.created_at.strftime("%d-%b-%Y"),
            "issuer": "Lahore Fashion Textile Mills Ltd.",
            "status": "Authentic & Verified in Central ERP Ledger"
        }
