# PRINT FORMAT DESIGNER & TEMPLATE SYSTEM FOR TEXTILE MILL ERP
**Lahore Fashion Textile Mills Ltd. — Document Engineering & Printing Architecture**

---

## 1. ARCHITECTURE OVERVIEW

The Format Builder system provides pixel-accurate, formal Material-style document design and printing across all departments of the textile mill.

```
┌───────────────────────────────────────────────────────────────┐
│               Format Builder Studio (React/TS)                │
│  • Visual Drag & Drop Canvas (mm coordinate grid)             │
│  • Safe Variable Tree Picker (No arbitrary code)              │
│  • Properties Inspector (Borders, RTL, Formats)               │
│  • Approval Workflow (Maker-Checker, Rollback)                │
└──────────────────────────────┬────────────────────────────────┘
                               │ JSON Layout Schema
                               ▼
┌───────────────────────────────────────────────────────────────┐
│              Django Backend App (`apps.printing`)             │
│  • Safe Jinja2 SandboxedEnvironment (Whitelisted filters)     │
│  • Bilingual Number-to-Words (EN + Urdu Lakh/Crore aware)     │
│  • HMAC Signed QR & Code128 Barcode Generator                 │
│  • Print Audit & Legal Reprint Tracker (`REPRINT n`)          │
└──────────────────────────────┬────────────────────────────────┘
                               │ Compiled Print HTML & Scoped CSS
                               ▼
┌───────────────────────────────────────────────────────────────┐
│                      PDF & Print Pipeline                     │
│  • WeasyPrint Engine (CSS @page, break-inside: avoid)         │
│  • ReportLab Engine (Seamless Windows C-library fallback)     │
│  • Browser Print (`window.print()`) with print CSS media      │
│  • Thermal Slip (80mm / 58mm continuous roll)                 │
│  • Adhesive Labels (75x50mm, 100x150mm Zebra ZPL)             │
└───────────────────────────────────────────────────────────────┘
```

---

## 2. PAPER SPECIFICATIONS & HARDWARE ALIGNMENT

| Preset Code | Dimensions (W × H) | Mill Application | Recommended Printer |
|---|---|---|---|
| `A4` | 210 × 297 mm | Tax Invoices, Delivery Challans, POs, Statements, Job Cards | HP LaserJet Enterprise / Canon iR-ADV |
| `A5` | 148 × 210 mm | Employee Payslips, Inspection Slips | Laser / High-speed Dot Matrix |
| `HALF_A4` | 210 × 148.5 mm (Landscape) | Gate Pass (Material OUT/IN), Cash Receipts | Multi-part 3-ply Dot Matrix (Epson LQ-310) |
| `A3` | 297 × 420 mm (Landscape) | Monthly Salary Register, Production Master Muster | Wide-format Plotter / Laser A3 |
| `THERMAL_80MM`| 80 mm × Continuous | Weighbridge Gross/Tare Slips, Visitor Passes | Epson TM-T88VI / BIXOLON SRP-350 |
| `THERMAL_58MM`| 58 mm × Continuous | Mobile Gate Scanner Slips | Handheld Bluetooth Thermal (Zjiang 5809) |
| `LABEL_75X50` | 75 × 50 mm | Stitching Bundle Tickets, Piece-Rate QR Tags | Zebra ZT231 / ZD421 (203 dpi) |
| `LABEL_100X100`| 100 × 100 mm | Weaving / Knitting Fabric Roll Doffing Tags | Zebra Industrial TT (Resin Ribbon) |
| `LABEL_100X150`| 100 × 150 mm | Export Carton Shipping Marks & Outer Box Tag | Zebra ZT411 4-inch Shipping Label |
| `LABEL_50X30` | 50 × 30 mm | Placket / Collar Component Bundle Tickets | Desktop Barcode Printer |
| `CR80_ID` | 85.6 × 54.0 mm | Worker RFID Smart ID Badges | Zebra ZC300 Card Printer |

---

## 3. SAFE DATA DICTIONARY REFERENCE

Templates only have read-only access to datasets assembled by the backend service. No template can execute SQL queries or arbitrary Python code.

### 3.1 Company Profile (`company.*`)
- `{{ company.name }}`: Lahore Fashion Textile Mills (Pvt) Ltd
- `{{ company.address }}`: Plot 42-A, Sundar Industrial Estate, Raiwind Road, Lahore
- `{{ company.phone }}`: +92 42 3588 9901
- `{{ company.email }}`: billing@lahorefashion.com
- `{{ company.ntn }}`: 2849102-4
- `{{ company.strn }}`: 1700284910219
- `{{ company.bank_name }}`: Habib Bank Limited (Corporate Branch)
- `{{ company.bank_iban }}`: PK36HABB0001234567890102

### 3.2 Document Metadata (`doc.*`)
- `{{ doc.number }}`: Invoice / Challan / GP number (e.g., `INV-2026-0842`)
- `{{ doc.date }}`: Document issue date (e.g., `27-Oct-2026`)
- `{{ doc.due_date }}`: Payment or delivery expiry date
- `{{ doc.status }}`: `Draft`, `Confirmed`, `Approved`, `Cancelled`
- `{{ doc.copy_label }}`: `Original for Buyer`, `Duplicate for Accounts`, `Triplicate for File`
- `{{ doc.printed_by }}`: Authenticated user name who triggered print
- `{{ doc.printed_at }}`: Exact server timestamp of print job
- `{{ doc.reprint_text }}`: `REPRINT #2` (Appears automatically on re-prints)

### 3.3 Party / Client / Supplier (`party.*`)
- `{{ party.name }}`: Khaadi Apparel (Pvt) Ltd
- `{{ party.address }}`: F-42 Hub River Road, SITE Area, Karachi
- `{{ party.ntn }}`: 1428590-3
- `{{ party.strn }}`: 03-01-9812-345-28
- `{{ party.contact_person }}`: Mr. Asim Munir (Procurement Manager)
- `{{ party.phone }}`: +92 21 3257 8810

### 3.4 Repeating Line Items (`items[]`)
In repeating tables, use `{% for item in items %}`:
- `{{ item.line_no }}`: Sequential line item (1, 2, 3...)
- `{{ item.code }}`: Fabric or item SKU (e.g., `FAB-LWN-001`)
- `{{ item.description }}`: Full construction specs (e.g., `Cotton Lawn 80x80/100x90 Printed Fabric 54"`)
- `{{ item.qty }}`: Quantity
- `{{ item.uom }}`: Unit of Measure (`Meters`, `Bags`, `Kgs`, `Rolls`)
- `{{ item.rate | money }}`: Rate formatted with commas (e.g., `280.00`)
- `{{ item.amount | money }}`: Line total before tax

### 3.5 Financial Totals & In Words (`totals.*`)
- `{{ totals.subtotal | money }}`: Net taxable subtotal
- `{{ totals.tax_rate }}`: Sales Tax percentage (e.g., `18%`)
- `{{ totals.tax_amount | money }}`: Sales Tax value in PKR
- `{{ totals.grand_total | money }}`: Final invoice amount payable
- `{{ totals.in_words_en }}`: Amount in words English (e.g., *"Rupees One Million Two Hundred Fifty Thousand Only"*)
- `{{ totals.in_words_ur }}`: Amount in words Urdu (e.g., *"بارہ لاکھ پچاس ہزار روپے فقط"*)

### 3.6 Transport & Logistics (`transport.*`)
- `{{ transport.vehicle_no }}`: `LES-8841 (10-Wheeler Truck)`
- `{{ transport.driver_name }}`: `Muhammad Aslam`
- `{{ transport.driver_cnic }}`: `35202-*******-5` (Masked for privacy)
- `{{ transport.transporter }}`: `Bilal Cargo Transporters Ltd`

---

## 4. NUMBER-TO-WORDS SERVICE (LAKH & CRORE AWARE)

The ERP includes native bilingual conversion honoring South Asian financial nomenclature:

- **1,250,000 PKR:**
  - English: `Rupees One Million Two Hundred Fifty Thousand Only`
  - Urdu: `بارہ لاکھ پچاس ہزار روپے فقط`
- **15,400,000 PKR:**
  - English: `Rupees Fifteen Million Four Hundred Thousand Only`
  - Urdu: `ایک کروڑ چون لاکھ روپے فقط`

---

## 5. ANTI-FRAUD VERIFICATION QR CODES

Every official document (Tax Invoice, Delivery Challan, Gate Pass, Quality Certificate) generates an HMAC-SHA256 signed verification token:
- Public URL: `https://erp.lahorefashion.com/verify/<token>`
- API Endpoint: `GET /api/v1/print/verify/<token>/`
- Displays read-only verification proof: Document number, issue date, client, verified grand total, and current status.
- Prevents tampering with printed invoices and delivery challans.

---

## 6. LEGAL COMPLIANCE & REPRINT AUDIT TRAIL

1. **Sales Tax Act 1990 Compliance:**
   - Tax Invoices mandatorily output the Seller & Buyer NTN, STRN, distinct item descriptions, sales tax percentage, and segregated tax lines.
2. **Maker-Checker Template Governance:**
   - Newly designed templates remain in `DRAFT` status.
   - Authorized supervisors must click **Approve & Publish** to promote a template to `ACTIVE`.
   - Every modification is recorded as an immutable `TemplateVersion` with checksum integrity.
3. **Audit Reprint Watermark:**
   - First print: Issued clean without watermarks.
   - Subsequent prints: System logs the user, timestamp, and device IP, and injects a visible **REPRINT #n** watermark.
