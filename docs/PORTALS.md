# Role-Wise Portals Architecture & Specifications (Lahore Fashion ERP)

## 1. Overview & Vision
Lahore Fashion ERP 2.0 provides **dedicated branded portals** for every role family across the textile manufacturing enterprise. Each role interacts with an optimized, role-specific OS (e.g. HR OS, Manager OS, Finance OS, Store OS, Quality OS, Owner OS) with its own:
- Dedicated login page (split-screen with curated photography, branding, and feature tiles)
- Security policy (mandatory 2FA on sensitive portals, auto-lockout idle timers, step-up auth)
- Theming engine (CSS variable tokens for primary, accent, surface, and sidebar colors)
- Navigation manifest & quick actions
- Default dashboard layout (powered by widget registry)
- App Launcher / Portal Switcher (enabling multi-role users like General Managers to switch portals with Single Sign-On without logging in twice)A

---

## 2. Portal Directory (15 Enterprise Portals)

| # | Portal Name | Slug / Route | Primary Roles | Accent Identity | 2FA Policy | Idle Timeout | Key Features & Focus |
|---|---|---|---|---|---|---|---|
| 1 | **Owner / Executive OS** | `/portal/owner` | Owner, Executive, Super Admin | Cobalt, Azure & Lilac (`#0D52ED`, `#2B76F6`, `#F5D9FF`) | Disabled (Global OFF) | 30 min | Consolidated 4-mill Mill Command Center, all tabs/modules, CapEx sign-off, group OEE, liquidity |
| 2 | **Manager OS** | `/portal/manager` | Production Manager, Plant Admin | Royal Blue (`#1E40AF`) | Disabled (Global OFF) | 60 min | Mill flow WIP pipeline, delayed lots table, daily meeting pack |
| 3 | **Department HOD OS** | `/portal/dept` | Dept Incharges (Weaving, Dyeing...) | Cyan Blue (`#0284C7`) | Disabled (Global OFF) | 60 min | Job cards, bundle transfers, hourly shift entry, machine logs |
| 4 | **HR OS** | `/portal/hr` | HR Manager, Payroll Officer | Teal + Violet (`#0D9488`) | Disabled (Global OFF) | 15 min | Biometric sync, piece-rate audit, EOBI registers, payroll stepper |
| 5 | **Finance OS** | `/portal/finance` | Chief Accountant, Cashier | Emerald Green (`#047857`) | Disabled (Global OFF) | 15 min | Double-entry general ledger, AR aging, bank reconciliation |
| 6 | **Stores & Purchase OS** | `/portal/stores` | Store Keeper, Purchase Officer | Deep Orange (`#EA580C`) | Disabled (Global OFF) | 60 min | Warehouse stock levels, GRN inspection, barcode scanning |
| 7 | **Quality OS** | `/portal/qc` | QC Manager, Inspectors, Lab | Crimson Coral (`#BE123C`) | Disabled (Global OFF) | 60 min | 4-Point fabric inspection, AQL audit, GSM/shrinkage lab, CAPA |
| 8 | **Planning OS** | `/portal/planning` | PPC, Merchandisers | Indigo (`#4338CA`) | Disabled (Global OFF) | 60 min | Master scheduling Gantt, Critical Path T&A, material MRP |
| 9 | **Maintenance & Utilities OS** | `/portal/maintenance` | Engineers, Boiler Incharge | Warm Amber (`#B45309`) | Disabled (Global OFF) | 60 min | Machine directory, preventive PM schedules, steam/power logs |
| 10 | **Supervisor Console** | `/portal/floor` | Line Supervisors, Section Leads | Slate Blue (`#334155`) | Disabled (Global OFF) | 120 min | Line live board, hourly output entry, attendance exceptions |
| 11 | **Worker Kiosk** | `/portal/kiosk` | Operators, Checkers | Emerald (`#047857`) | Disabled | 5 min | Touchscreen QR scanner, piece-rate earnings counter, Urdu-first |
| 12 | **Client Portal** | `/portal/client` | Buyers, Brands | White-Label (`#0F172A`) | Disabled (Global OFF) | 60 min | Live order tracking, digital lab-dip sign-off, invoices & BLs |
| 13 | **Partner / Supplier Portal** | `/portal/partner` | Thekedars, Yarn/Dye Vendors | Neutral Zinc (`#27272A`) | Disabled (Global OFF) | 60 min | PO acknowledgements, advance shipping notices (ASN), bills |
| 14 | **Auditor Console** | `/portal/audit` | Tax, Brand & Internal Auditors | Slate Grey (`#374151`) | Disabled (Global OFF) | 30 min | Read-only ledger browser, cryptographic hash chain audit |
| 15 | **Admin & IT Console** | `/portal/admin` | IT Admin, Super Admin | Cyber Dark (`#0F172A`) | Disabled (Global OFF) | 30 min | Portal Manager, RBAC matrix, access audit logs, telemetry |

---

## 3. Security Architecture & Policies

### 3.1 2FA Central Flag & Default Configuration (Prompt 9)
Two-Factor Authentication (2FA) and Step-Up re-authentication have been **removed from the user flow by default** across all 15 portals and login flows:
- **Central Switch**: Configured in `backend/config/settings/base.py` via `AUTH_2FA_ENABLED = env.bool("AUTH_2FA_ENABLED", default=False)` and `AUTH_STEP_UP_ENABLED = env.bool("AUTH_STEP_UP_ENABLED", default=False)`.
- **Default State**: `OFF` everywhere (`AUTH_2FA_ENABLED=false`, `AUTH_STEP_UP_ENABLED=false`).
- **User Flow**: All users (Owner, HR, Manager, Finance, etc.) sign in using **email + password only**. No OTP challenge is prompted, no SMS/email codes are required, and login screens render cleanly without empty input gaps.
- **Dormant Code**: All 2FA verification logic (OTP generator, challenge models, TOTP, and step-up tokens) remains dormant in backend code.
- **How to Enable 2FA**:
  To re-enable 2FA and step-up re-authentication at any time, simply set the environment variables in `.env`:
  ```bash
  AUTH_2FA_ENABLED=true
  AUTH_STEP_UP_ENABLED=true
  ```
  And re-run `python manage.py seed_portals` if per-portal enforcement is desired.

### 3.2 Preserved Core Security Controls
Even with 2FA disabled, the following enterprise security controls remain actively enforced:
- **Password Policies**: Minimum length, uppercase, numbers, and symbols.
- **Rate Limiting & Account Lockout**: Exponential backoff and lockout via Django Axes after repeated invalid password attempts.
- **Maker-Checker Segregation of Duties (SoD)**: Operators cannot approve their own payroll runs or bank advice; commercial bookers cannot write off ledgers.
- **Session Timeout & Inactivity Lockout**: Configurable per portal (15m for HR/Finance, 30m for Owner/Admin, 60m for Manager).
- **Access Audit Trail**: Every login attempt, wrong portal denial, session creation, and revocation is recorded with client IP, user agent, and timestamp.
- **Dual Owner Account Protection**: At least 2 accounts hold owner/super_admin privileges (`owner@lahorefashion.com` and `executive.director@lahorefashion.com`); the last remaining owner cannot be deleted or demoted.

### 3.3 Per-Portal Login API
- Endpoint: `POST /api/v1/auth/portal/{portal_slug}/login/`
- Validates:
  1. User credentials (email & password)
  2. Role eligibility: User must hold an active role listed in `portal.allowed_roles` (or `owner` / `super_admin` which have universal access to all 15 portals).
  3. Wrong-portal denial: If a Worker attempts to sign in at the HR or Finance login, access is rejected with HTTP 403 `code: "wrong_portal_access_denied"` and logged as `WRONG_PORTAL_DENIED` in `PortalAccessLog`.
  4. Returns JWT with portal claims and authorized access token.

### 3.4 Step-Up Authorization
- Endpoint: `POST /api/v1/auth/portal/{portal_slug}/step-up/`
- When `AUTH_STEP_UP_ENABLED=False` (default), the endpoint issues a valid authorized token without prompting for re-authentication, allowing smooth business flow while preserving maker-checker approval controls.
- Required before performing high-risk actions:
  - HR OS: Approving monthly payroll run, generating HBL bank file
  - Finance OS: Releasing payments over PKR 1,000,000
  - Owner OS: Authorizing major CapEx equipment purchases
  - Admin OS: Modifying system roles or portal security policies
- Prompts for re-entering password or 6-digit authenticator code and returns a 15-minute validity step-up token.

### 3.3 Inactivity Auto-Lockout
- HR OS & Finance OS: 15-minute idle countdown timer.
- Owner OS & Auditor OS: 30-minute idle countdown timer.
- Manager OS & Stores OS: 60-minute idle countdown timer.
- Real-time countdown displayed in sidebar security footer with visual color warning at < 2 minutes.

---

## 4. App Launcher & Portal Switcher
Multi-role executives (e.g. GM, Group Admin, or Owners) can switch between any portal they have permission to access using the **App Launcher Modal** (`Ctrl+K` or "App Launcher" button in the sidebar/topbar). Switching preserves the Single Sign-On session without requiring a second login.

---

## 5. Automated Verification & Test Coverage
- **Backend Integration Tests:** `apps.portals.tests.PortalIntegrationTests` (6/6 tests passing on PostgreSQL).
  - Validates login success, role eligibility, wrong portal rejection, 2FA challenge dispatch, `portals/me` filtering, and step-up authorization.
- **Frontend Bundle Performance:**
  - `dist/assets/index.js`: **187.14 kB gzipped** (well within the < 300 kB budget).
  - TypeScript compilation: 0 errors.
