# Lahore Fashion Textile ERP 2.0

> **"From Raw Cotton to Global Haute Couture — Fully Integrated, Real-Time, Fault-Tolerant Textile Manufacturing OS."**

[![Django](https://img.shields.io/badge/Django-6.0-092E20?style=for-the-badge&logo=django&logoColor=white)](https://www.djangoproject.com/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-18.3-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-316192?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Redis](https://img.shields.io/badge/Redis-7.0-DC382D?style=for-the-badge&logo=redis&logoColor=white)](https://redis.io/)
[![Celery](https://img.shields.io/badge/Celery-5.6-37814A?style=for-the-badge&logo=celery&logoColor=white)](https://docs.celeryq.dev/)
[![Docker](https://img.shields.io/badge/Docker-24.0-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)

---

## 1. Executive Summary & Manufacturing Scope

**Lahore Fashion Textile ERP 2.0** is an enterprise-grade, multi-branch Enterprise Resource Planning platform tailored for high-volume textile and apparel conglomerates. Built for 24/7 continuous continuous-flow mill environments, it coordinates operations across four major industrial sites:

1. **Lahore Head Office & Executive Suite (`LHR-HO`)**: Commercial merchandising, executive oversight, financial auditing, global client portal.
2. **Multan Weaving Mill (`MUL-WM`)**: High-speed Tsudakoma air-jet looms, yarn sizing, warping, automated IoT pick counting.
3. **Faisalabad Dyeing & Printing Complex (`FSD-DP`)**: Jet dyeing, continuous bleaching, rotary screen printing, automated color kitchen, stenter finishing.
4. **Sheikhupura Stitching & Apparel Plant (`SKP-SP`)**: Automated spreading & CAD cutting, 32 progressive stitching lines, piece-rate tracking, finishing, carton packing, container stuffing.

---

## 2. Multi-Tier System Architecture

```
                                  [ Global Clients & Remote Execs ]
                                                │
                                    (Cloudflare / TLS 1.3)
                                                ▼
                                         [ Nginx Reverse Proxy ]
                                   (Port 80/443 SSL Termination)
                                  ┌─────────────┴─────────────┐
                                  │                           │
                                  ▼                           ▼
                     [ React 18 SPA Portals ]     [ Edge IoT / Floor Kiosks ]
                     (Vite 5 / TS / 187 kB gz)    (Android Tablets / HW Scanners)
                                  │                           │
                   REST / JWT / WebSocket            High-Freq Telemetry / WS
                                  │                           │
         ┌────────────────────────┴─────────┐                 │
         ▼                                  ▼                 ▼
[ Django 6.0 DRF Core ]          [ Channels ASGI ]    [ FastAPI 0.115 Realtime ]
  - Complete REST API (269+ endpoints) - Live lot feeds      - Kiosk Badge Scan Auth
  - Strict Deny-by-Default RBAC    - Dashboard broadcast  - Machine Loom IoT Gateway
  - ScopedManager (Branch/Dept)     - User alert stream    - WhatsApp Bot Webhooks
  - Double-Entry General Ledger                          - High-speed In-Memory Store
         │                                  │                 │
         └─────────────────┬────────────────┴─────────────────┘
                           │
      ┌────────────────────┼────────────────────┐
      ▼                    ▼                    ▼
[ PostgreSQL 16 ]     [ Redis 7.0 ]      [ MinIO S3 Storage ]
  - Partitioned Logs    - Celery Broker    - Encrypted E-Invoices
  - pg_trgm Search      - Cache Layer      - Quality Inspection Photos
  - Audit Trail Triggers- Pub/Sub Channel  - Gate Pass & Challan PDFs
      │
      ▼
[ Celery Workers & Beat ]
  - Automated Payroll Run & EOBI Calculation
  - Machine Telemetry Rollups & OEE Calculation
  - WhatsApp & SMS Notification Dispatch
```

---

## 3. Dedicated Enterprise Portals (15 Branded Role Portals)

Lahore Fashion ERP provides dedicated, isolated operating environments for each enterprise persona. Each portal features its own visual identity, authentication policies, navigation manifests, and step-up authorization:

| # | Portal Name | Route | Allowed Roles | Accent Token | 2FA Policy | Idle Lock | Primary Responsibilities |
|---|---|---|---|---|---|---|---|
| 1 | **Owner / Executive OS** | `/portal/owner` | Owner, Chairman, GM | Gold (`#F59E0B`) | **Mandatory** | 30 min | 4-mill consolidated P&L, CapEx authorizations, live liquidity, group OEE |
| 2 | **Manager OS** | `/portal/manager` | Production Manager, Plant Head | Royal Blue (`#1E40AF`) | Optional | 60 min | WIP pipeline, delayed lot escalation, daily morning meeting deck |
| 3 | **Department Incharge OS**| `/portal/dept` | Weaving/Dyeing/Stitching HODs | Cyan (`#0284C7`) | Optional | 60 min | Job cards, bundle dispatch, hourly shift output, loom stoppage logging |
| 4 | **HR OS** | `/portal/hr` | HR Manager, Payroll Officer | Teal (`#0D9488`) | **Mandatory** | 15 min | Biometric sync, piece-rate audit, EOBI registers, multi-step payroll |
| 5 | **Finance OS** | `/portal/finance` | Chief Accountant, Cashier | Emerald (`#047857`) | **Mandatory** | 15 min | Double-entry general ledger, AR/AP aging, voucher posting, bank reco |
| 6 | **Stores & Purchase OS** | `/portal/stores` | Store Keeper, Purchase Officer | Orange (`#EA580C`) | Optional | 60 min | Yarn/dye stock balances, GRN gate verification, barcode issuance |
| 7 | **Quality OS** | `/portal/qc` | QC Manager, Line Inspectors | Crimson (`#BE123C`) | Optional | 60 min | 4-Point fabric inspection, AQL 2.5 final audit, lab shrinkage, CAPA |
| 8 | **Planning OS (PPC)** | `/portal/planning`| PPC Leads, Merchandisers | Indigo (`#4338CA`) | Optional | 60 min | Critical Path T&A schedules, yarn/fabric MRP calculations, capacity Gantt |
| 9 | **Maintenance OS** | `/portal/maintenance`| Chief Engineer, Technicians | Amber (`#B45309`) | Optional | 60 min | Preventative PM schedules, MTTR/MTBF tracking, steam & boiler logs |
| 10 | **Supervisor Console** | `/portal/floor` | Line Supervisors, Section Leads | Slate (`#334155`) | Optional | 120 min | Tablet view, hourly piece-rate counters, worker attendance exceptions |
| 11 | **Worker Kiosk** | `/portal/kiosk` | Machine Operators, Checkers | Emerald (`#047857`) | Disabled | 5 min | Touchscreen QR badge scanner, daily piece-rate earnings counter, Urdu UI |
| 12 | **Client Portal** | `/portal/client` | Global Buyers, Retail Brands | Dark Slate (`#0F172A`) | Optional | 60 min | Digital lab-dip approvals, real-time PO tracker, e-invoices, packing lists |
| 13 | **Supplier / Thekedar** | `/portal/partner` | Thekedars, Yarn/Chemical Vendors| Zinc (`#27272A`) | Optional | 60 min | Purchase orders, Advance Shipping Notices (ASN), contractor billing |
| 14 | **Auditor Console** | `/portal/audit` | Tax, Brand & Internal Auditors | Slate Grey (`#374151`) | **Mandatory** | 30 min | Cryptographic hash-chain audit log browser, unalterable ledger verification |
| 15 | **Admin & IT Console** | `/portal/admin` | IT Admin, Super Admin | Cyber Dark (`#0F172A`) | **Mandatory** | 30 min | User provisioning wizard, RBAC matrix, portal access maps, self-test scan |

---

## 4. RBAC & Strict Deny-by-Default Security Model

### 4.1 The Golden Rule (Non-Negotiable)
1. **Super Admin**: Has access to all portals via the App Launcher, full visibility across all branches, ability to provision users, define roles, and audit every action. Sensitive values (salaries, bank accounts, CNICs) are masked by default and require an audited click-to-reveal.
2. **All Other Roles (Strict Deny-by-Default)**: A user has access **only** to what their active role explicitly permits. 
   - **HR Isolation Guarantee**: HR roles have zero access to production job cards, client ledgers, general journals, costing formulas, purchase orders, or system admin.
   - Enforced at every layer: UI routing, JWT claims, backend querysets, DRF viewsets, FastAPI dependencies, WebSockets, global search, exports, prints, and media URLs.

### 4.2 Portal-Bound JWT Claims
```json
{
  "user_id": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
  "portal": "hr",
  "roles": ["hr_manager"],
  "role": "hr_manager",
  "branch_id": "1e9a4f6d-7b2c-4e8a-9f1d-3b5a7c9e1f2a",
  "branch_code": "LHR-HO",
  "token_version": 4,
  "perm_version": 12,
  "user_name": "Ayesha Khan",
  "user_email": "hr.manager@lahorefashion.com"
}
```

### 4.3 Safeguards & High-Privilege Controls
- **Dual Owner & Super Admin Requirement**: At least 2 active Owner / Super Admin accounts must always exist in the database (`owner@lahorefashion.com` and `executive.director@lahorefashion.com`). Deleting or demoting the last Owner is hard-blocked at the database and model layer.
- **Peer Approval**: Modifications to Super Admin accounts require secondary Super Admin approval.
- **Accounting Immutability**: Even Owner / Super Admin cannot modify or delete posted general ledger lines or finalized payroll periods. Corrections must follow reversal voucher workflows with logged justification.
- **2FA & Step-Up Configuration**: 2FA and step-up prompts are **disabled by default** across all user flows (`AUTH_2FA_ENABLED=false`, `AUTH_STEP_UP_ENABLED=false`). Sign in uses email and password only. To enable 2FA / step-up verification, set `AUTH_2FA_ENABLED=true` and `AUTH_STEP_UP_ENABLED=true` in `.env`. Business maker-checker approval controls remain permanently active.

---

## 5. Backend Applications Inventory

```
backend/apps/
├── accounts/         # Custom User, Role, UserRoleBranch, OTPChallenge, LoginAudit
├── rbac/             # Permissions, FieldPolicy, ApprovalPolicy, BreakGlass, ScopeManager
├── branches/         # Multi-mill registry (LHR-HO, MUL-WM, FSD-DP, SKP-SP), cost centres
├── clients/          # Buyer directory, commercial contacts, payment credit terms
├── orders/           # Purchase Orders, Sales Quotations, Fabric Technical Specs
├── production/       # Production Lots, Lot Stages, Scan Events, Loom/Machine Registry
├── inventory/        # Warehouse bin locations, Yarn/Chemical SKU items, Stock Ledger, GRN
├── quality/          # 4-Point inspection rolls, AQL 2.5 defect catalog, Lab test reports
├── labour/           # Worker profiles, piece-rate contracts, daily output verification
├── attendance/       # Biometric punch logs, shift rosters, overtime rules, leave balance
├── hr/               # Employee master, recruitment pipeline, appraisals, disciplinary actions
├── delivery/         # Gate passes, delivery challans, container manifests, POD tracking
├── finance/          # Double-entry ledger, charts of accounts, vouchers, AR/AP aging
├── reports/          # Consolidated P&L, production efficiency, OEE reporting engines
├── notifications/    # WhatsApp Cloud API, automated SMS, transactional emails
├── printing/         # Thermal barcode generation, Zebra ZPL, WeasyPrint PDF format builders
├── audit/            # Tamper-evident system activity audit logs
├── settings_app/     # ERP sequence counters, company profiles, system parameters
├── sync/             # Offline shop-floor data synchronization
└── core/             # Base model abstractions, RFC 7807 error handlers, Channels consumers
```

---

## 6. Shop-Floor Hardware & Realtime Edge Specifications

Detailed hardware engineering specifications are maintained in [`docs/HARDWARE.md`](docs/HARDWARE.md).

| Mill Department | Edge Terminal Hardware | Connectivity | Peripherals & Sensors |
|---|---|---|---|
| **Stitching Line** | Samsung Galaxy Tab Active4 Pro 10.1" (IP68, Glove mode) | Dual-band Wi-Fi 6 + POE | Honeywell Genesis 7580g hands-free 2D imager |
| **Weaving Shed** | Industrial ESP32 / W5500 DIN-rail IoT Gateway (`LF-IOT-GW-V3`)| Shielded RS-485 Modbus + Eth | Optocoupled loom pick counters, 8-key stoppage pad |
| **Dye House** | Advantech 12.1" IP65 Stainless Steel Panel PC | Industrial Ethernet | PT100 temperature probe, online glass pH sensor |
| **Fabric QC Table** | Rugged Android 10.5" VESA terminal | Ethernet / Wi-Fi | Autonics E40S rotary encoder (millimeter fabric length) |
| **Finished Goods** | Zebra ZT231 / ZT411 300dpi Industrial Thermal Printer | Direct TCP/IP socket | Avery Weigh-Tronix / Mettler Toledo RS-232 scales |

---

## 7. Quick Start & Developer Setup

### 7.1 Prerequisites
- **Python**: 3.12+
- **Node.js**: 20+ & npm 10+
- **PostgreSQL**: 16+ with `uuid-ossp` and `pg_trgm`
- **Redis**: 7.0+
- **Docker & Docker Compose**: v2+

### 7.2 Local Environment Configuration

```bash
# Clone repository
git clone https://github.com/lahore-fashion/lahore-fashion-erp.git
cd lahore-fashion-erp

# Create and configure .env
cp .env.example .env
```

### 7.3 Backend Setup

```bash
# Setup Python virtual environment
python -m venv venv
venv\Scripts\activate   # On Windows
# source venv/bin/activate  # On Linux/macOS

# Install dependencies
pip install -r requirements/dev.txt

# Run migrations
python backend/manage.py migrate

# Seed enterprise roles, portals, and demo master data
python backend/manage.py seed_portals
python backend/manage.py seed_hr_rbac
python backend/manage.py seed_demo

# Run Endpoint Permission Audit
python backend/manage.py audit_endpoints
```

### 7.4 Realtime Gateway Setup (FastAPI)

```bash
cd realtime
uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload
```

### 7.5 Frontend Setup (React SPA)

```bash
cd frontend/web
npm install
npm run dev
```

### 7.6 Service URLs & Default Credentials

| Service | Address | Default Admin Account |
|---|---|---|
| **Frontend Web App** | `http://localhost:5173` | Authenticate via Portal Login |
| **Owner / Executive OS** | `http://localhost:5173/portal/owner` | `owner@lahorefashion.com` |
| **HR OS** | `http://localhost:5173/portal/hr` | `hr.manager@lahorefashion.com` |
| **Manager OS** | `http://localhost:5173/portal/manager` | `manager@lahorefashion.com` |
| **Finance OS** | `http://localhost:5173/portal/finance` | `finance@lahorefashion.com` |
| **Admin Console** | `http://localhost:5173/portal/admin` | `admin@lahorefashion.com` |
| **Django REST API** | `http://localhost:8000/api/v1/` | — |
| **Interactive Swagger Docs**| `http://localhost:8000/api/docs/` | Requires login |
| **ReDoc OpenAPI** | `http://localhost:8000/api/redoc/` | Requires login |
| **FastAPI Realtime Docs** | `http://localhost:8001/rt/docs` | Public / Edge |

---

## 8. Automated Testing & Verification

The test suite validates multi-mill isolation, maker-checker authorization, and portal boundaries:

```bash
# Run backend pytest suite on PostgreSQL
pytest backend/ -v --cov=backend/apps

# Run endpoint security audit (fails CI if any endpoint is unprotected)
python backend/manage.py audit_endpoints --fail-ci

# Run frontend test suite & bundle analysis
cd frontend/web
npm run build
```

---

## 9. Key Documentation References

- 📋 [**PORTALS.md**](docs/PORTALS.md) — 15 Enterprise Portals architecture, theme tokens, and App Launcher.
- 🛡️ [**ENDPOINT_PERMISSION_MATRIX.md**](docs/ENDPOINT_PERMISSION_MATRIX.md) — Deny-by-default endpoint catalogue.
- 🔌 [**HARDWARE.md**](docs/HARDWARE.md) — Industrial IoT gateways, loom pick counters, and scanner BOM.
- 🖨️ [**PRINT_FORMATS.md**](docs/PRINT_FORMATS.md) — Thermal roll labels, carton shipping marks, and payslips.
- 📜 [**COMPLIANCE_NOTES.md**](docs/COMPLIANCE_NOTES.md) — Pakistani labour laws, EOBI, SESSI, and FBR tax withholding.
- 🚀 [**ROLLOUT.md**](docs/ROLLOUT.md) — Phased plant go-live schedules and disaster recovery protocols.

---

## 10. License & Intellectual Property

Copyright © 2026 Lahore Fashion (Pvt) Ltd. All rights reserved.  
Proprietary software — unauthorized distribution, decompilation, or replication is strictly prohibited.
