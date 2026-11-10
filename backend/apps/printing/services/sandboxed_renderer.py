"""
Sandboxed Template Renderer for Print & Format Builder.
Compiles JSON block schema into HTML/CSS with print pagination, repeating headers, and safe Jinja2 sandbox.
"""
from typing import Dict, Any, Optional
from decimal import Decimal
import jinja2
from jinja2.sandbox import SandboxedEnvironment
from .number_to_words import NumberToWordsService


def filter_money(val: Any) -> str:
    try:
        f = float(val)
        return f"{f:,.2f}"
    except (ValueError, TypeError):
        return str(val)


def filter_number(val: Any) -> str:
    try:
        f = float(val)
        return f"{f:,.0f}" if f.is_integer() else f"{f:,.2f}"
    except (ValueError, TypeError):
        return str(val)


def filter_words_en(val: Any, currency: str = "Rupees") -> str:
    try:
        return NumberToWordsService.to_words_en(val, currency=currency)
    except Exception:
        return ""


def filter_words_ur(val: Any) -> str:
    try:
        return NumberToWordsService.to_words_ur(val)
    except Exception:
        return ""


class SandboxedTemplateRenderer:
    def __init__(self):
        self.env = SandboxedEnvironment(
            autoescape=True,
            trim_blocks=True,
            lstrip_blocks=True,
            undefined=jinja2.Undefined
        )
        # Register custom safe filters
        self.env.filters["money"] = filter_money
        self.env.filters["number"] = filter_number
        self.env.filters["words_en"] = filter_words_en
        self.env.filters["words_ur"] = filter_words_ur

    def render_html(
        self,
        template_html: str,
        data: Dict[str, Any],
        paper_size: str = "A4",
        orientation: str = "portrait",
        margins_mm: Optional[Dict[str, int]] = None,
        is_rtl: bool = False,
        watermark: Optional[str] = None
    ) -> str:
        """
        Renders safe Jinja2 template and wraps in full formal Material print document container.
        """
        margins = margins_mm or {"top": 10, "right": 12, "bottom": 12, "left": 12}
        
        # Compile template with Jinja2 sandbox
        try:
            jinja_tmpl = self.env.from_string(template_html)
            body_content = jinja_tmpl.render(**data)
        except Exception as e:
            body_content = f"<div style='color:red; padding:20px;'><strong>Template Syntax Error:</strong> {str(e)}</div>"

        watermark_html = ""
        if watermark:
            watermark_html = f"""
            <div class="watermark-overlay">
                <span>{watermark}</span>
            </div>
            """

        css_page_size = f"{paper_size} {orientation}" if paper_size in ["A4", "A5", "A3", "letter", "legal"] else paper_size

        full_document = f"""<!DOCTYPE html>
<html lang="{'ur' if is_rtl else 'en'}" dir="{'rtl' if is_rtl else 'ltr'}">
<head>
    <meta charset="utf-8">
    <title>{data.get('doc', {}).get('title', 'Document')} — {data.get('doc', {}).get('number', '')}</title>
    <style>
        @page {{
            size: {css_page_size};
            margin: {margins.get('top', 10)}mm {margins.get('right', 12)}mm {margins.get('bottom', 12)}mm {margins.get('left', 12)}mm;
            @bottom-right {{
                content: "Page " counter(page) " of " counter(pages);
                font-family: 'Inter', -apple-system, sans-serif;
                font-size: 8pt;
                color: #64748b;
            }}
            @bottom-left {{
                content: "Authorised Print • Lahore Fashion Textile ERP";
                font-family: 'Inter', -apple-system, sans-serif;
                font-size: 8pt;
                color: #94a3b8;
            }}
        }}

        *, *:before, *:after {{
            box-sizing: border-box;
        }}

        body {{
            margin: 0;
            padding: 0;
            font-family: {'"Noto Nastaliq Urdu", "Jameel Noori Nastaleeq", ' if is_rtl else ''}'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            font-size: 9pt;
            line-height: 1.4;
            color: #0f172a;
            background-color: #ffffff;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
        }}

        /* Print Typography & Colors */
        .color-primary {{ color: #0b2545; }}
        .color-accent {{ color: #1e5eff; }}
        .bg-light {{ background-color: #f8fafc; }}

        /* Tables & Repeating Headers */
        table {{
            width: 100%;
            border-collapse: collapse;
            page-break-inside: auto;
        }}
        thead {{
            display: table-header-group;
        }}
        tfoot {{
            display: table-footer-group;
        }}
        tr {{
            page-break-inside: avoid;
            page-break-after: auto;
        }}
        th, td {{
            padding: 6px 8px;
            text-align: {'right' if is_rtl else 'left'};
            vertical-align: middle;
        }}
        th {{
            font-weight: 700;
            font-size: 8.5pt;
            letter-spacing: 0.3px;
            text-transform: uppercase;
        }}

        /* Watermark styling */
        .watermark-overlay {{
            position: fixed;
            top: 35%;
            left: 10%;
            width: 80%;
            text-align: center;
            opacity: 0.08;
            transform: rotate(-30deg);
            pointer-events: none;
            z-index: 1000;
        }}
        .watermark-overlay span {{
            font-size: 72pt;
            font-weight: 900;
            color: #0f172a;
            letter-spacing: 8px;
        }}

        /* Keep blocks together */
        .keep-together {{
            page-break-inside: avoid;
        }}
        .page-break {{
            page-break-after: always;
        }}
    </style>
</head>
<body>
    {watermark_html}
    {body_content}
</body>
</html>
"""
        return full_document

    def compile_schema_to_html(self, schema_json: Dict[str, Any]) -> str:
        """
        Compiles a visual designer JSON block schema into clean, responsive Jinja2 HTML.
        Supports mm coordinates, repeating table columns, party blocks, totals, signatures, and QR.
        """
        elements = schema_json.get("elements", [])
        html_chunks = []

        for el in elements:
            el_type = el.get("type")
            x, y, w, h = el.get("x", 0), el.get("y", 0), el.get("w", 100), el.get("h", 20)

            if el_type == "heading":
                title = el.get("title", "{{ doc.title }}")
                subtitle = el.get("subtitle", "")
                sub_html = f"<div style='font-size:8.5pt; color:#64748b; margin-top:2px;'>{subtitle}</div>" if subtitle else ""
                html_chunks.append(f"""
                <div style='margin-bottom:14px; border-bottom:2px solid #0b2545; padding-bottom:8px;'>
                    <div style='font-size:18pt; font-weight:900; color:#0b2545; letter-spacing:0.5px;'>{title}</div>
                    {sub_html}
                </div>
                """)

            elif el_type == "company_block":
                html_chunks.append("""
                <div style='font-size:8pt; color:#334155; line-height:1.4;'>
                    <div style='font-size:11pt; font-weight:800; color:#0b2545;'>{{ company.name }}</div>
                    <div>{{ company.address }}</div>
                    <div>Phone: {{ company.phone }} • Email: {{ company.email }}</div>
                    <div style='margin-top:2px;'><span style='font-weight:600;'>NTN:</span> {{ company.ntn }} &nbsp;|&nbsp; <span style='font-weight:600;'>STRN:</span> {{ company.strn }}</div>
                </div>
                """)

            elif el_type == "doc_meta":
                html_chunks.append("""
                <div style='font-size:8pt; border:1px solid #cbd5e1; border-radius:6px; padding:8px; background-color:#f8fafc;'>
                    <div style='display:flex; justify-content:space-between; margin-bottom:4px;'>
                        <span style='color:#64748b;'>Document #:</span>
                        <strong style='color:#0b2545; font-size:9.5pt;'>{{ doc.number }}</strong>
                    </div>
                    <div style='display:flex; justify-content:space-between; margin-bottom:4px;'>
                        <span style='color:#64748b;'>Date:</span>
                        <span>{{ doc.date }}</span>
                    </div>
                    {% if doc.due_date %}
                    <div style='display:flex; justify-content:space-between; margin-bottom:4px;'>
                        <span style='color:#64748b;'>Due Date:</span>
                        <span>{{ doc.due_date }}</span>
                    </div>
                    {% endif %}
                    <div style='display:flex; justify-content:space-between;'>
                        <span style='color:#64748b;'>Copy Type:</span>
                        <span style='background:#1e5eff; color:#ffffff; padding:1px 6px; border-radius:3px; font-weight:700; font-size:7pt;'>{{ doc.copy_label }}</span>
                    </div>
                </div>
                """)

            elif el_type == "party_block":
                html_chunks.append("""
                <div style='font-size:8pt; border:1px solid #e2e8f0; border-radius:6px; padding:8px; margin-bottom:12px; background-color:#ffffff;'>
                    <div style='color:#64748b; font-weight:700; text-transform:uppercase; margin-bottom:2px; font-size:7.5pt;'>Bill To / Consignee:</div>
                    <div style='font-size:10pt; font-weight:800; color:#0b2545;'>{{ party.name }}</div>
                    <div>{{ party.address }}</div>
                    <div>Attn: {{ party.contact_person }} • Tel: {{ party.phone }}</div>
                    <div style='margin-top:2px;'><span style='font-weight:600;'>Party NTN:</span> {{ party.ntn }} &nbsp;|&nbsp; <span style='font-weight:600;'>STRN:</span> {{ party.strn }}</div>
                </div>
                """)

            elif el_type == "table":
                collection = el.get("collection", "items")
                columns = el.get("columns", [])
                
                ths = []
                tds = []
                for col in columns:
                    w_style = f"width:{col.get('width', 'auto')};"
                    align = col.get("align", "left")
                    field = col.get("field", "")
                    fmt = col.get("format")
                    
                    ths.append(f"<th style='{w_style} text-align:{align}; background:#0b2545; color:#ffffff;'>{col.get('header', '')}</th>")
                    
                    if fmt == "money":
                        tds.append(f"<td style='text-align:{align}; font-variant-numeric: tabular-nums;'>{{{{ item.{field} | money }}}}</td>")
                    elif fmt == "number":
                        tds.append(f"<td style='text-align:{align}; font-variant-numeric: tabular-nums;'>{{{{ item.{field} | number }}}}</td>")
                    else:
                        tds.append(f"<td style='text-align:{align};'>{{{{ item.{field} }}}}</td>")

                th_html = "".join(ths)
                td_html = "".join(tds)

                html_chunks.append(f"""
                <div style='margin-bottom:12px;'>
                    <table style='width:100%; border-collapse:collapse; font-size:8pt;'>
                        <thead>
                            <tr style='height:24px;'>{th_html}</tr>
                        </thead>
                        <tbody>
                            {{% for item in {collection} %}}
                            <tr style='border-bottom:1px solid #e2e8f0; {{% if loop.index is even %}}background-color:#f8fafc;{{% endif %}}'>
                                {td_html}
                            </tr>
                            {{% endfor %}}
                        </tbody>
                    </table>
                </div>
                """)

            elif el_type == "totals_block":
                html_chunks.append("""
                <div style='font-size:8.5pt; border:1px solid #cbd5e1; border-radius:6px; padding:8px; background-color:#f8fafc; margin-left:auto;'>
                    <div style='display:flex; justify-content:space-between; margin-bottom:4px;'>
                        <span style='color:#64748b;'>Subtotal:</span>
                        <strong style='font-variant-numeric:tabular-nums;'>PKR {{ totals.subtotal | money }}</strong>
                    </div>
                    {% if totals.discount_amount %}
                    <div style='display:flex; justify-content:space-between; margin-bottom:4px; color:#ef4444;'>
                        <span>Discount:</span>
                        <span>- PKR {{ totals.discount_amount | money }}</span>
                    </div>
                    {% endif %}
                    <div style='display:flex; justify-content:space-between; margin-bottom:4px;'>
                        <span style='color:#64748b;'>Sales Tax ({{ totals.tax_rate }}):</span>
                        <span style='font-variant-numeric:tabular-nums;'>PKR {{ totals.tax_amount | money }}</span>
                    </div>
                    <div style='display:flex; justify-content:space-between; border-top:2px solid #0b2545; padding-top:6px; margin-top:4px;'>
                        <span style='font-weight:900; color:#0b2545; font-size:10pt;'>Grand Total:</span>
                        <span style='font-weight:900; color:#0b2545; font-size:10.5pt; font-variant-numeric:tabular-nums;'>PKR {{ totals.grand_total | money }}</span>
                    </div>
                </div>
                """)

            elif el_type == "words_block":
                html_chunks.append("""
                <div style='font-size:7.5pt; border-left:3px solid #1e5eff; padding-left:8px; margin-bottom:8px;'>
                    <div style='color:#64748b; font-weight:700; text-transform:uppercase;'>Amount in Words:</div>
                    <div style='font-weight:700; color:#0b2545;'>{{ totals.in_words_en }}</div>
                    {% if totals.in_words_ur %}
                    <div style='font-family:"Noto Nastaliq Urdu", "Jameel Noori Nastaleeq", serif; direction:rtl; text-align:right; font-size:9pt; color:#1e293b; margin-top:2px;'>{{ totals.in_words_ur }}</div>
                    {% endif %}
                </div>
                """)

            elif el_type == "bank_block":
                html_chunks.append("""
                <div style='font-size:7pt; color:#475569; border:1px dashed #cbd5e1; border-radius:4px; padding:6px;'>
                    <strong style='color:#0b2545;'>Bank Remittance Details:</strong><br/>
                    Bank: {{ company.bank_name }} • IBAN: <span style='font-family:monospace; font-weight:700;'>{{ company.bank_iban }}</span><br/>
                    Account Title: {{ company.name }}
                </div>
                """)

            elif el_type == "signatures":
                boxes = el.get("boxes", ["Prepared By", "Checked By", "Approved By", "Received By"])
                box_cols = []
                for box in boxes:
                    box_cols.append(f"""
                    <div style='flex:1; text-align:center;'>
                        <div style='height:36px; border-bottom:1px solid #64748b; margin-bottom:4px;'></div>
                        <div style='font-size:7.5pt; font-weight:700; color:#334155;'>{box}</div>
                    </div>
                    """)
                html_chunks.append(f"""
                <div style='display:flex; gap:16px; margin-top:20px; page-break-inside:avoid;'>
                    {"".join(box_cols)}
                </div>
                """)

            elif el_type == "qr_verify":
                html_chunks.append("""
                <div style='text-align:center;'>
                    <img src='{{ qr.data_uri }}' style='width:64px; height:64px; border:1px solid #cbd5e1; border-radius:4px;' alt='Verify QR' />
                    <div style='font-size:6pt; color:#64748b; margin-top:2px;'>Scan to Verify</div>
                </div>
                """)

            elif el_type == "barcode":
                html_chunks.append("""
                <div style='text-align:center;'>
                    <img src='{{ barcode.data_uri }}' style='max-height:36px; width:100%;' alt='Code128 Barcode' />
                    <div style='font-size:6.5pt; font-family:monospace; color:#334155; margin-top:1px;'>{{ doc.number }}</div>
                </div>
                """)

            elif el_type == "transport_block":
                html_chunks.append("""
                <div style='font-size:8pt; border:1px solid #cbd5e1; border-radius:6px; padding:8px; background-color:#f8fafc; margin-bottom:12px;'>
                    <strong style='color:#0b2545; text-transform:uppercase;'>Transport & Driver Log:</strong>
                    <div style='display:grid; grid-template-columns: repeat(4, 1fr); gap:8px; margin-top:4px;'>
                        <div><span style='color:#64748b;'>Transporter:</span> <strong style='display:block;'>{{ transport.transporter | default("Mill Transport") }}</strong></div>
                        <div><span style='color:#64748b;'>Vehicle #:</span> <strong style='display:block;'>{{ transport.vehicle_no | default("LES-8841") }}</strong></div>
                        <div><span style='color:#64748b;'>Driver Name:</span> <strong style='display:block;'>{{ transport.driver_name | default("Muhammad Aslam") }}</strong></div>
                        <div><span style='color:#64748b;'>Driver CNIC:</span> <strong style='display:block;'>{{ transport.driver_cnic | default("35202-*******-5") }}</strong></div>
                    </div>
                </div>
                """)

            elif el_type == "field":
                label = el.get("label", "")
                val = el.get("value", "")
                html_chunks.append(f"""
                <div style='font-size:8pt; margin-bottom:4px;'>
                    <span style='color:#64748b; font-size:7.5pt;'>{label}:</span>
                    <strong style='color:#0f172a;'>{val}</strong>
                </div>
                """)

            elif el_type == "divider":
                html_chunks.append("<hr style='border:none; border-top:1px solid #cbd5e1; margin:8px 0;' />")

        return "\n".join(html_chunks)

    def generate_print_css(
        self,
        page_width_mm: Any,
        page_height_mm: Any,
        margins_mm: Optional[Dict[str, int]] = None,
        is_continuous: bool = False
    ) -> str:
        """
        Generates standard CSS @page and layout rules for pixel-accurate printing.
        """
        m = margins_mm or {"top": 10, "right": 10, "bottom": 10, "left": 10}
        size_rule = f"{page_width_mm}mm" if is_continuous else f"{page_width_mm}mm {page_height_mm}mm"
        return f"""
        @page {{
            size: {size_rule};
            margin: {m.get('top', 10)}mm {m.get('right', 10)}mm {m.get('bottom', 10)}mm {m.get('left', 10)}mm;
            @bottom-right {{
                content: "Page " counter(page) " of " counter(pages);
                font-size: 7pt;
                color: #94a3b8;
            }}
        }}
        body {{
            font-family: 'Inter', -apple-system, sans-serif;
            font-size: 8.5pt;
            color: #0f172a;
        }}
        """


# Alias for backward compatibility
SandboxedRendererService = SandboxedTemplateRenderer
