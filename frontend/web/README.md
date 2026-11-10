# Lahore Fashion ERP 2.0 — Frontend Web Application

> **Enterprise Multi-Portal Single Page Application (SPA) built with React 18, TypeScript 5.5, Vite 5, TailwindCSS, and Lucide Icons.**

---

## 1. Architecture Overview

The Lahore Fashion ERP frontend delivers **15 dedicated, role-optimized portals** from a single high-performance SPA codebase. Built with sub-200 kB gzipped bundle discipline, it provides:

- **Strict Portal Isolation**: Users only load navigation, widgets, and tools permitted by their authenticated portal role.
- **Dynamic Theming Engine**: Pure CSS variables dynamically injected per portal (`--portal-primary`, `--portal-accent`, `--portal-bg`, `--portal-sidebar`).
- **App Launcher Modal (`Ctrl+K`)**: Multi-role users (Super Admin, General Manager) can seamlessly switch between authorized portals with single sign-on.
- **Step-Up Authentication Modal**: Automatically triggered when approving high-risk actions (e.g. approving monthly payroll runs, releasing PKR 1M+ bank transfers).
- **Inactivity Auto-Lockout Timers**: Visual countdown timer in sidebar with auto-lockout (15m for HR & Finance, 30m for Owner/Auditor, 60m for Manager/Stores).

---

## 2. Directory Structure

```
frontend/web/
├── public/                     # Static assets & favicon
├── src/
│   ├── assets/                 # SVGs, mill imagery, logos
│   ├── components/             # Reusable enterprise UI primitives
│   │   ├── ui/                 # Buttons, inputs, modals, tables, badges
│   │   └── widgets/            # Dashboard KPI widgets, charts, feeds
│   ├── context/                # Global contexts (Auth, Theme, Notification)
│   ├── portals/                # Enterprise Role Portals Architecture
│   │   ├── AppLauncherModal.tsx# App Launcher (Ctrl+K) for authorized portal switching
│   │   ├── PortalContext.tsx   # Current portal state, timer, theme provider
│   │   ├── PortalShell.tsx     # Unified sidebar, topbar, idle timer & container
│   │   ├── StepUpAuthModal.tsx # High-risk action password/TOTP challenge dialog
│   │   ├── portalRegistry.ts   # Manifest of all 15 portals & allowed roles
│   │   ├── owner/              # Owner / Executive OS views & layouts
│   │   ├── manager/            # Production Manager OS views & pipeline
│   │   ├── hr/                 # HR OS views (employees, payroll stepper, leaves)
│   │   ├── finance/            # Finance OS views (ledger, AR/AP, vouchers)
│   │   └── admin/              # Super Admin Console (users wizard, RBAC matrix)
│   ├── types/                  # TypeScript interfaces & API schema types
│   ├── App.tsx                 # Root router & layout switcher
│   ├── index.css               # Design system tokens, typography & CSS variables
│   └── main.tsx                # React DOM entry point
├── dist/                       # Production build output
├── package.json                # Dependencies & build scripts
├── tsconfig.json               # TypeScript configuration
└── vite.config.ts              # Vite bundle configuration & dev server proxy
```

---

## 3. The 15 Role Portals & Themes

| Slug | Portal Name | Primary Persona | Theme Colors | 2FA Policy |
|---|---|---|---|---|
| `owner` | **Owner / Executive OS** | Owner, Chairman, GM | Navy + Gold (`#F59E0B`) | **Mandatory** |
| `manager` | **Manager OS** | Production Manager, Plant Head | Royal Blue (`#1E40AF`) | Optional |
| `dept` | **Department Incharge OS** | Weaving, Dyeing, Stitching HODs| Cyan Blue (`#0284C7`) | Optional |
| `hr` | **HR OS** | HR Manager, Payroll Officer | Teal + Violet (`#0D9488`) | **Mandatory** |
| `finance` | **Finance OS** | Chief Accountant, Cashier | Emerald Green (`#047857`) | **Mandatory** |
| `stores` | **Stores & Purchase OS** | Store Keeper, Purchase Officer | Deep Orange (`#EA580C`) | Optional |
| `qc` | **Quality OS** | QC Manager, Line Inspectors | Crimson Coral (`#BE123C`) | Optional |
| `planning` | **Planning OS (PPC)** | PPC Incharge, Merchandisers | Indigo (`#4338CA`) | Optional |
| `maintenance` | **Maintenance OS** | Chief Engineer, Mechanics | Warm Amber (`#B45309`) | Optional |
| `floor` | **Supervisor Console** | Line Supervisors, Section Leads| Slate Blue (`#334155`) | Optional |
| `kiosk` | **Worker Kiosk** | Machine Operators, Checkers | Emerald (`#047857`) | Disabled |
| `client` | **Client Portal** | Global Buyers, Retail Brands | White-Label (`#0F172A`) | Optional |
| `partner` | **Supplier / Thekedar** | Vendors, Thekedars | Neutral Zinc (`#27272A`) | Optional |
| `audit` | **Auditor Console** | Internal / External Auditors | Slate Grey (`#374151`) | **Mandatory** |
| `admin` | **Admin & IT Console** | Super Admin, IT Admins | Cyber Dark (`#0F172A`) | **Mandatory** |

---

## 4. Security & Isolation Architecture

1. **Deny-by-Default Navigation**: Portal navigation items are served dynamically from `/api/v1/portals/{slug}/bootstrap`. A role only receives links and widgets it has permission to view.
2. **Dedicated Portal Login Routes**:
   - `/login/{portal_slug}` (e.g. `/login/hr`, `/login/finance`, `/login/owner`)
   - Enforces 2FA challenge when logging into sensitive portals.
   - If an HR user attempts to login at `/login/finance`, the backend rejects with `HTTP 403 wrong_portal_access_denied` and logs the violation.
3. **App Launcher Modal**:
   - Shortcut: `Ctrl + K` or "App Launcher" button in the sidebar.
   - Shows only the portals the user's role is authorized to access.
4. **Step-Up Authentication Flow**:
   - Protects critical buttons (e.g. "Approve Payroll Run", "Generate HBL Bank File").
   - Intercepts action, displays the `StepUpAuthModal`, verifies credentials with `/api/v1/auth/portal/{slug}/step-up/`, and obtains a 15-minute token before proceeding.

---

## 5. Development & Build Commands

```bash
# Install dependencies
npm install

# Start Vite development server (HMR enabled)
npm run dev

# Run TypeScript type check
npm run typecheck

# Production build
npm run build

# Preview production build locally
npm run preview
```

---

## 6. Bundle Performance

- Production bundle size: **~187 kB gzipped**
- Sub-second initial load time on 4G cellular connections across mill factory floors.
