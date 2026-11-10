"""
QR & Barcode Generation Service.
Generates self-contained Base64 Data URIs for print templates.
"""
import base64
import io
import qrcode
import barcode
from barcode.writer import ImageWriter


class QrBarcodeService:
    @classmethod
    def generate_qr_data_uri(cls, data: str, box_size: int = 6, border: int = 1) -> str:
        """
        Generates QR code as PNG data URI (data:image/png;base64,...).
        """
        qr = qrcode.QRCode(
            version=None,
            error_correction=qrcode.constants.ERROR_CORRECT_M,
            box_size=box_size,
            border=border,
        )
        qr.add_data(data)
        qr.make(fit=True)

        img = qr.make_image(fill_color="black", back_color="white")
        buffer = io.BytesIO()
        img.save(buffer, format="PNG")
        encoded = base64.b64encode(buffer.getvalue()).decode("ascii")
        return f"data:image/png;base64,{encoded}"

    @classmethod
    def generate_barcode_data_uri(cls, code: str, barcode_type: str = "code128") -> str:
        """
        Generates 1D barcode as PNG data URI.
        """
        try:
            bc_class = barcode.get_barcode_class(barcode_type)
        except Exception:
            bc_class = barcode.get_barcode_class("code128")

        bc = bc_class(code, writer=ImageWriter())
        buffer = io.BytesIO()
        bc.write(buffer, options={
            "module_width": 0.25,
            "module_height": 10.0,
            "font_size": 9,
            "text_distance": 3.0,
            "quiet_zone": 2.0,
            "write_text": True
        })
        encoded = base64.b64encode(buffer.getvalue()).decode("ascii")
        return f"data:image/png;base64,{encoded}"
