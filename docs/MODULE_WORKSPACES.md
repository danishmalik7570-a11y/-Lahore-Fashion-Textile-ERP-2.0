# Lahore Fashion Mill — Module Workspaces Architecture ("OS" Architecture)

This document details the architecture, design principles, component structure, navigation schema, and role-based access control for the **Small Sidebar + Module "OS" Workspace** system implemented in the Lahore Fashion Mill web platform.

---

## 1. Overview & Philosophy

In modern textile manufacturing ERP systems, deeply nested accordion sidebars lead to visual clutter, user disorientation, and slow navigation across shift handovers. The **Module Workspace** paradigm simplifies the interface into two clear levels:

1. **Small & Minimal Sidebar:**
   - Width: 224px expanded, 64px collapsed (icon-only mode with tooltips).
   - Contains **only top-level modules** (icon + name). No dropdowns, no multi-level accordions.
   - Fixed header displays static **Lahore Fashion Mill** facility identity (single mill unit; no multi-branch pickers or dropdowns).
   - Bottom profile block: active user avatar, name, role badge, portal switcher (when user has >1 portal assigned), and sign-out.
   - Row height: dense 40px with 2px left active bar and subtle blue tint `#f8fafc` / `#eff6ff`.

2. **Every Module is its Own "OS" Workspace:**
   - Clicking any module opens a dedicated workspace view: **Orders OS**, **Production OS**, **Inventory OS**, **Quality OS**, **Delivery OS**, **HR OS**, **Finance OS**, **Reports OS**, and **Administration OS**.
   - Each OS workspace has its own header (icon, title, subtitle, breadcrumbs, quick action buttons, live clock).
   - Clean, formal Fluent / SAP Fiori-inspired underline tab bar for navigating sub-features.
   - Secondary 200px sub-menu sidebar for departments with complex sub-pages (e.g. Weaving Shed, Dye House, Stitching Line).
   - Overview dashboard with real-time KPI cards, pipeline funnels, and alert tables.
   - Permission check (RBAC): Displays a 403 Access Restricted screen if the user lacks the required permission for a tab.
   - Real data only: All metrics originate from the mill database / React contexts with honest empty states and "+ Create first..." action buttons when zero records exist.

---

## 2. The 10 Core Module Workspaces

| Module ID | OS Workspace | Title & Subtitle | Icon | Allowed Roles | Default Route |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `mod-dashboard` | Executive Dashboard | Real-Time Mill Telemetry & Shift Performance | `LayoutDashboard` | All Authenticated Roles | `/` |
| `mod-orders` | Orders OS | PO Lifecycle, Buyer Pipelines & Cost Sheets | `ShoppingBag` | Owner, Super Admin, Production Mgr, Accountant | `/orders` |
| `mod-production` | Production OS | Weaving, Dyeing, Stitching & Floor Telemetry | `Factory` | Owner, Super Admin, Production Mgr, Supervisor, Worker | `/production` |
| `mod-inventory` | Inventory OS | Stock, Warehousing & Material Procurement | `Boxes` | Owner, Super Admin, Store Keeper, Accountant | `/inventory` |
| `mod-quality` | Quality OS | Testing, 4-Point Audits & CAPA Resolution | `ShieldCheck` | Owner, Super Admin, QC Inspector, Production Mgr | `/quality` |
| `mod-delivery` | Delivery OS | Challans, Gate Passes & Order Shipments | `Truck` | Owner, Super Admin, Store Keeper, Accountant | `/delivery` |
| `mod-hr` | HR OS | People, Attendance & Payroll | `Users` | Owner, Super Admin, HR Manager, HR Officer, Payroll Officer | `/hr` |
| `mod-finance` | Finance OS | Accounts, General Ledgers & Cost Profitability | `DollarSign` | Owner, Super Admin, Accountant | `/finance` |
| `mod-reports` | Reports OS | Enterprise Analytics & Format Builder | `BarChart3` | Owner, Super Admin, Production Mgr, Accountant, HR Manager | `/reports` |
| `mod-admin` | Administration OS | System Security, Users & Portal Manager | `Settings` | Owner, Super Admin | `/admin` |

---

## 3. Component Architecture

### 3.1 Reusable Workspace Shell (`ModuleWorkspace.tsx`)
Located at: `frontend/web/src/components/navigation/ModuleWorkspace.tsx`

**Props & Responsibilities:**
- `moduleKey`: Identifier matching `moduleNavData.ts`.
- `moduleTitle` & `moduleSubtitle`: Displayed in the prominent Fluent-style header.
- `moduleIconName`: Lucide icon dynamically rendered in a dedicated 40x40px rounded box.
- `tabs`: List of `ModuleTabConfig` defining id, label, route, required_permission, and optional `sub_pages`.
- `activeTabId`: Currently active tab ID.
- `onTabChange`: Callback fired on tab click, resetting or selecting sub-page.
- `activeSubPageId` & `onSubPageChange`: Secondary sub-navigation support.
- `quickActions`: 1–3 primary/secondary action buttons in the top-right (e.g. `+ New Order`, `Floor Entry`, `Receive GRN`).
- `breadcrumbs`: Array of navigation steps (e.g. `['Production OS', 'Weaving Shed', 'Looms Grid']`).
- `userRole`: Enforces RBAC tab rendering; if forbidden, renders a formal 403 access denied banner.
- `lastUpdated`: Live clock indicator ("Updated hh:mm:ss") proving live telemetric feed.

### 3.2 Small Sidebar Component (`Sidebar.tsx`)
Located at: `frontend/web/src/components/navigation/Sidebar.tsx`

**Features:**
- Width transitions: `224px` when expanded, `64px` when collapsed with smooth 0.2s cubic ease.
- Facility Branding: Static text `"Lahore Fashion Mill"` with spinning sub-text `"Single Manufacturing Unit"`.
- Clean module list: Only displays the 10 top-level modules. No accordion caret or child expansion.
- Role Filtering: Reads active user roles and filters modules via `MODULE_NAV_CONFIGS[].allowed_roles`.
- Active State: Active module item features a left 2px solid accent bar and light surface tint.
- Tooltips: When collapsed, hovering an icon displays a crisp tooltip with module title and Urdu subtitle.
- Footer Block: Displays logged-in staff member avatar, name, and role. If user has multiple portals assigned, renders a "Switch Portal" link; otherwise, displays a "Sign out" button.

### 3.3 Top App Bar (`PortalShell.tsx`)
Located at: `frontend/web/src/portals/PortalShell.tsx`

**Standardized Layout:**
- Left: Sidebar toggle hamburger button and active module title indicator.
- Center / Search: Global Search trigger (`Ctrl+K` / `⌘K`) launching quick navigation modal.
- Right:
  - Approvals pill badge displaying count of pending multi-tier approvals.
  - Notifications bell with live alert indicator.
  - User profile menu and avatar.
- No duplicate branch chips or multi-location dropdowns (enforcing single-unit design).

---

## 4. Database Seeding & RBAC Sync (`seed_module_nav`)

A Django management command synchronizes the navigation schema into `PortalNavItem` models:

```bash
python backend/manage.py seed_module_nav
```

### Role-Based Navigation Trees Generated:

1. **Owner (`owner` / `super_admin`):**
   - Receives access to all **10 modules**:
     1. Executive Dashboard (`/`)
     2. Orders OS (`/orders`)
     3. Production OS (`/production`)
     4. Inventory OS (`/inventory`)
     5. Quality OS (`/quality`)
     6. Delivery OS (`/delivery`)
     7. HR OS (`/hr`)
     8. Finance OS (`/finance`)
     9. Reports OS (`/reports`)
     10. Administration OS (`/admin`)

2. **HR Manager (`hr_manager`):**
   - Receives access to **3 modules**:
     1. HR Portal Dashboard (`/portal/hr`)
     2. HR OS (`/hr`) — 15 tabs: Employees, Attendance, Leave, Payroll, Advances, Thekedar, Recruitment, Ledgers, Letters, Compliance, etc.
     3. Reports OS (`/reports`) — HR & Attendance analytics.

3. **Store Keeper (`store_keeper`):**
   - Receives access to **3 modules**:
     1. Stores Dashboard (`/portal/stores`)
     2. Inventory OS (`/inventory`) — Stock, Items, Purchase Indents, GRN, Issues (GIN), Transfers, Stock Count, Labels.
     3. Delivery OS (`/delivery`) — Ready to ship, Outward Challans, Gate Passes, Transporters, POD tracking.

---

## 5. Department Sub-Workspaces (Production OS Example)

For manufacturing departments requiring specialized shop-floor tracking, `ModuleWorkspace` renders a secondary 200px sub-menu:

```
Production OS
├── Overview (6 KPIs, 9-stage WIP pipeline strip, bottleneck tracker)
├── Weaving Shed
│   ├── Looms Grid (Loom uptime, RPM, picks/min, warp stops)
│   ├── Beam Loading (Warp beam gaiting and sizing status)
│   ├── Shift Log (Loom logbook per 8-hour shift)
│   └── Efficiency (Rankings by weaver and loom model)
├── Dye House
│   ├── Recipe Book (Color formulations & liquor ratios)
│   ├── Dyeing Lots (Jet dye machines & winch status)
│   ├── Shade Matching (Lab dips & spectrophotometer approval)
│   └── Chemical Requisitions (Dyes store withdrawal requests)
├── Stitching Line
│   ├── Line Plan (Target per hour and operator assignment)
│   ├── Bundles / WIP (QR/Barcode tracked bundle flow)
│   ├── Hourly Board (Live hourly output vs target)
│   ├── DHU Tracking (Defects per Hundred Units)
│   └── Piece-rate Entry (Operator wages calculation)
└── Floor Entry (Embedded terminal for quick piece/meters submission)
```

---

## 6. Single-Unit Facility Guardrails

Lahore Fashion Mill operates as a single large-scale integrated textile composite facility. Multi-branch UI elements have been permanently decommissioned:
- **No Branch Filter:** Sidebar and headers do not contain branch drop-downs (`LHR`, `FSD`, `KHI`).
- **Static Facility Labels:** Header branding reads: `"Lahore Fashion Mill — Single Manufacturing Unit"`.
- **Honest Telemetry:** All metrics reflect live floor lots, challans, invoices, and attendance clocked in the Lahore facility.
- **Empty States:** When a table or register contains zero records, an empty state card renders with a descriptive prompt and a `+ Create first...` primary action button.

---

## 7. Verification & Testing

Every module workspace has been compiled and validated:
- `npm run build` in `frontend/web`: 1,989 modules transformed, 0 TypeScript errors, bundle generated cleanly in `dist/`.
- `python backend/manage.py check`: 0 silenced issues, Django configuration healthy.
- `python backend/manage.py seed_module_nav`: Successfully seeds navigation trees for Owner, HR Manager, and Store Keeper.
- `pytest backend/apps/accounts/tests.py backend/apps/portals/tests.py`: All portal and authentication test suites pass.
