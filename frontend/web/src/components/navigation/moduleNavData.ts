export interface ModuleTabConfig {
  id: string;
  label: string;
  route: string;
  order: number;
  required_permission?: string;
  sub_pages?: { id: string; label: string; route: string }[];
}

export interface ModuleNavConfig {
  id: string;
  module: string;
  label: string;
  subtitle: string;
  icon: string;
  route: string;
  order: number;
  required_permission?: string;
  allowed_roles: string[];
  tabs: ModuleTabConfig[];
}

export const MODULE_NAV_CONFIGS: ModuleNavConfig[] = [
  {
    id: 'mod-dashboard',
    module: 'dashboard',
    label: 'Dashboard',
    subtitle: 'Mill Command Center & Operational Telemetry',
    icon: 'LayoutDashboard',
    route: '/dashboard',
    order: 1,
    required_permission: 'dashboard.view',
    allowed_roles: ['owner', 'super_admin', 'branch_admin', 'production_manager', 'accountant', 'store_keeper', 'hr_manager', 'qc_inspector', 'supervisor'],
    tabs: []
  },
  {
    id: 'mod-orders',
    module: 'orders',
    label: 'Orders',
    subtitle: 'Sales, Bookings & Production Orders',
    icon: 'ShoppingBag',
    route: '/orders',
    order: 2,
    required_permission: 'orders.view',
    allowed_roles: ['owner', 'super_admin', 'production_manager', 'accountant', 'merchandiser'],
    tabs: [
      { id: 'orders-overview', label: 'Overview', route: '/orders', order: 1, required_permission: 'orders.view' },
      { id: 'orders-all', label: 'All Orders', route: '/orders/all', order: 2, required_permission: 'orders.view' },
      { id: 'orders-new', label: 'New Order', route: '/orders/new', order: 3, required_permission: 'orders.create' },
      { id: 'orders-quotations', label: 'Quotations', route: '/orders/quotations', order: 4, required_permission: 'orders.view' },
      { id: 'orders-tracking', label: 'Order Tracking', route: '/orders/tracking', order: 5, required_permission: 'orders.view' },
      { id: 'orders-buyers', label: 'Buyers / Clients', route: '/orders/buyers', order: 6, required_permission: 'clients.view' },
      { id: 'orders-bom', label: 'BOM & Specs', route: '/orders/bom', order: 7, required_permission: 'orders.view' },
      { id: 'orders-approvals', label: 'Approvals', route: '/orders/approvals', order: 8, required_permission: 'orders.approve' },
      { id: 'orders-reports', label: 'Reports', route: '/orders/reports', order: 9, required_permission: 'reports.view' }
    ]
  },
  {
    id: 'mod-production',
    module: 'production',
    label: 'Production',
    subtitle: 'Shop Floor & Department Manufacturing Execution',
    icon: 'Factory',
    route: '/production',
    order: 3,
    required_permission: 'production.view',
    allowed_roles: ['owner', 'super_admin', 'production_manager', 'supervisor', 'qc_inspector'],
    tabs: [
      { id: 'prod-overview', label: 'Overview', route: '/production', order: 1, required_permission: 'production.view' },
      { id: 'prod-planning', label: 'Planning Board', route: '/production/planning', order: 2, required_permission: 'production.view' },
      { id: 'prod-lots', label: 'Lots & QR', route: '/production/lots', order: 3, required_permission: 'production.view' },
      { id: 'prod-yarn-store', label: 'Yarn Store', route: '/production/yarn-store', order: 4, required_permission: 'production.view' },
      {
        id: 'prod-weaving',
        label: 'Weaving',
        route: '/production/weaving',
        order: 5,
        required_permission: 'production.view',
        sub_pages: [
          { id: 'weav-warping', label: 'Warping', route: '/production/weaving/warping' },
          { id: 'weav-sizing', label: 'Sizing', route: '/production/weaving/sizing' },
          { id: 'weav-looms', label: 'Looms Board', route: '/production/weaving/looms' },
          { id: 'weav-rolls', label: 'Rolls', route: '/production/weaving/rolls' },
          { id: 'weav-inspection', label: 'Inspection', route: '/production/weaving/inspection' }
        ]
      },
      { id: 'prod-knitting', label: 'Knitting', route: '/production/knitting', order: 6, required_permission: 'production.view' },
      { id: 'prod-grey-store', label: 'Grey Store', route: '/production/grey-store', order: 7, required_permission: 'production.view' },
      {
        id: 'prod-dyeing',
        label: 'Dyeing',
        route: '/production/dyeing',
        order: 8,
        required_permission: 'production.view',
        sub_pages: [
          { id: 'dye-batches', label: 'Batch Cards', route: '/production/dyeing/batches' },
          { id: 'dye-lab-dip', label: 'Lab Dip', route: '/production/dyeing/lab-dip' },
          { id: 'dye-shade-approval', label: 'Shade Approval', route: '/production/dyeing/shade-approval' },
          { id: 'dye-finishing-range', label: 'Finishing Range', route: '/production/dyeing/finishing-range' },
          { id: 'dye-effluent', label: 'Effluent Treatment', route: '/production/dyeing/effluent' }
        ]
      },
      { id: 'prod-printing', label: 'Printing', route: '/production/printing', order: 9, required_permission: 'production.view' },
      { id: 'prod-cutting', label: 'Cutting', route: '/production/cutting', order: 10, required_permission: 'production.view' },
      {
        id: 'prod-stitching',
        label: 'Stitching',
        route: '/production/stitching',
        order: 11,
        required_permission: 'production.view',
        sub_pages: [
          { id: 'stitch-line-plan', label: 'Line Plan', route: '/production/stitching/line-plan' },
          { id: 'stitch-bundles', label: 'Bundles / WIP', route: '/production/stitching/bundles' },
          { id: 'stitch-hourly', label: 'Hourly Board', route: '/production/stitching/hourly' },
          { id: 'stitch-dhu', label: 'DHU Tracking', route: '/production/stitching/dhu' },
          { id: 'stitch-piece-rate', label: 'Piece-rate Entry', route: '/production/stitching/piece-rate' }
        ]
      },
      { id: 'prod-packing', label: 'Finishing & Packing', route: '/production/packing', order: 12, required_permission: 'production.view' },
      { id: 'prod-floor-entry', label: 'Floor Entry', route: '/production/floor-entry', order: 13, required_permission: 'entry.create' },
      { id: 'prod-alerts', label: 'Alerts & Delays', route: '/production/alerts', order: 14, required_permission: 'production.view' },
      { id: 'prod-traceability', label: 'Traceability', route: '/production/traceability', order: 15, required_permission: 'production.view' },
      { id: 'prod-reports', label: 'Reports', route: '/production/reports', order: 16, required_permission: 'reports.view' }
    ]
  },
  {
    id: 'mod-inventory',
    module: 'inventory',
    label: 'Inventory',
    subtitle: 'Stock, Warehousing & Material Procurement',
    icon: 'Boxes',
    route: '/inventory',
    order: 4,
    required_permission: 'inventory.view',
    allowed_roles: ['owner', 'super_admin', 'store_keeper', 'accountant'],
    tabs: [
      { id: 'inv-overview', label: 'Overview', route: '/inventory', order: 1, required_permission: 'inventory.view' },
      { id: 'inv-stock', label: 'Stock', route: '/inventory/stock', order: 2, required_permission: 'inventory.view' },
      { id: 'inv-items', label: 'Items', route: '/inventory/items', order: 3, required_permission: 'inventory.view' },
      { id: 'inv-purchase', label: 'Purchase', route: '/inventory/purchase', order: 4, required_permission: 'inventory.view' },
      { id: 'inv-grn', label: 'GRN / Receiving', route: '/inventory/grn', order: 5, required_permission: 'inventory.create' },
      { id: 'inv-issues', label: 'Issues & Returns', route: '/inventory/issues', order: 6, required_permission: 'inventory.edit' },
      { id: 'inv-transfers', label: 'Transfers & Adjustments', route: '/inventory/transfers', order: 7, required_permission: 'inventory.edit' },
      { id: 'inv-count', label: 'Stock Count', route: '/inventory/count', order: 8, required_permission: 'inventory.view' },
      { id: 'inv-labels', label: 'Labels & Barcodes', route: '/inventory/labels', order: 9, required_permission: 'inventory.view' },
      { id: 'inv-valuation', label: 'Valuation & Reports', route: '/inventory/valuation', order: 10, required_permission: 'reports.view' }
    ]
  },
  {
    id: 'mod-quality',
    module: 'quality',
    label: 'Quality',
    subtitle: 'Testing, 4-Point Audits & CAPA Resolution',
    icon: 'ShieldCheck',
    route: '/quality',
    order: 5,
    required_permission: 'quality.view',
    allowed_roles: ['owner', 'super_admin', 'qc_inspector', 'production_manager'],
    tabs: [
      { id: 'qc-overview', label: 'Overview', route: '/quality', order: 1, required_permission: 'quality.view' },
      { id: 'qc-inspections', label: 'Inspections', route: '/quality/inspections', order: 2, required_permission: 'quality.view' },
      { id: 'qc-lab-tests', label: 'Lab Tests', route: '/quality/lab-tests', order: 3, required_permission: 'quality.view' },
      { id: 'qc-defects', label: 'Defects & Rework', route: '/quality/defects', order: 4, required_permission: 'quality.view' },
      { id: 'qc-checklists', label: 'Checklists / Templates', route: '/quality/checklists', order: 5, required_permission: 'quality.view' },
      { id: 'qc-capa', label: 'CAPA', route: '/quality/capa', order: 6, required_permission: 'quality.edit' },
      { id: 'qc-claims', label: 'Customer Claims', route: '/quality/claims', order: 7, required_permission: 'quality.view' },
      { id: 'qc-supplier', label: 'Supplier Quality', route: '/quality/supplier', order: 8, required_permission: 'quality.view' },
      { id: 'qc-reports', label: 'Reports', route: '/quality/reports', order: 9, required_permission: 'reports.view' }
    ]
  },
  {
    id: 'mod-delivery',
    module: 'delivery',
    label: 'Delivery',
    subtitle: 'Challans, Gate Passes & Order Shipments',
    icon: 'Truck',
    route: '/delivery',
    order: 6,
    required_permission: 'delivery.view',
    allowed_roles: ['owner', 'super_admin', 'store_keeper', 'accountant'],
    tabs: [
      { id: 'del-overview', label: 'Overview', route: '/delivery', order: 1, required_permission: 'delivery.view' },
      { id: 'del-ready', label: 'Ready to Ship', route: '/delivery/ready', order: 2, required_permission: 'delivery.view' },
      { id: 'del-challans', label: 'Challans', route: '/delivery/challans', order: 3, required_permission: 'delivery.view' },
      { id: 'del-gate-passes', label: 'Gate Passes', route: '/delivery/gate-passes', order: 4, required_permission: 'delivery.view' },
      { id: 'del-transporters', label: 'Transporters & Vehicles', route: '/delivery/transporters', order: 5, required_permission: 'delivery.view' },
      { id: 'del-tracking', label: 'Tracking & POD', route: '/delivery/tracking', order: 6, required_permission: 'delivery.view' },
      { id: 'del-returns', label: 'Returns & Claims', route: '/delivery/returns', order: 7, required_permission: 'delivery.view' },
      { id: 'del-reports', label: 'Reports', route: '/delivery/reports', order: 8, required_permission: 'reports.view' }
    ]
  },
  {
    id: 'mod-hr',
    module: 'hr',
    label: 'HR',
    subtitle: 'People, Attendance & Payroll',
    icon: 'Users',
    route: '/hr',
    order: 7,
    required_permission: 'labour.view',
    allowed_roles: ['owner', 'super_admin', 'hr_manager', 'hr_officer', 'payroll_officer'],
    tabs: [
      { id: 'hr-overview', label: 'Overview', route: '/hr', order: 1, required_permission: 'labour.view' },
      { id: 'hr-employees', label: 'Employees', route: '/hr/employees', order: 2, required_permission: 'labour.view' },
      { id: 'hr-attendance', label: 'Attendance', route: '/hr/attendance', order: 3, required_permission: 'labour.view' },
      { id: 'hr-leave', label: 'Leave', route: '/hr/leave', order: 4, required_permission: 'labour.view' },
      { id: 'hr-payroll', label: 'Payroll', route: '/hr/payroll', order: 5, required_permission: 'labour.view' },
      { id: 'hr-advances', label: 'Advances & Loans', route: '/hr/advances', order: 6, required_permission: 'labour.view' },
      { id: 'hr-contractors', label: 'Contractors (Thekedar)', route: '/hr/contractors', order: 7, required_permission: 'labour.view' },
      { id: 'hr-recruitment', label: 'Recruitment', route: '/hr/recruitment', order: 8, required_permission: 'labour.view' },
      { id: 'hr-performance', label: 'Performance & Training', route: '/hr/performance', order: 9, required_permission: 'labour.view' },
      { id: 'hr-exit', label: 'Discipline & Exit', route: '/hr/exit', order: 10, required_permission: 'labour.view' },
      { id: 'hr-compliance', label: 'Compliance', route: '/hr/compliance', order: 11, required_permission: 'compliance.view' },
      { id: 'hr-ledgers', label: 'Employee Ledgers', route: '/hr/ledgers', order: 12, required_permission: 'labour.view' },
      { id: 'hr-letters', label: 'Letters & Forms', route: '/hr/letters', order: 13, required_permission: 'labour.view' },
      { id: 'hr-reports', label: 'Reports', route: '/hr/reports', order: 14, required_permission: 'reports.view' },
      { id: 'hr-settings', label: 'HR Settings', route: '/hr/settings', order: 15, required_permission: 'settings.edit' }
    ]
  },
  {
    id: 'mod-finance',
    module: 'finance',
    label: 'Finance',
    subtitle: 'Accounts, General Ledgers & Cost Profitability',
    icon: 'DollarSign',
    route: '/finance',
    order: 8,
    required_permission: 'finance.view',
    allowed_roles: ['owner', 'super_admin', 'accountant'],
    tabs: [
      { id: 'fin-overview', label: 'Overview', route: '/finance', order: 1, required_permission: 'finance.view' },
      { id: 'fin-client-ledgers', label: 'Client Ledgers', route: '/finance/client-ledgers', order: 2, required_permission: 'finance.view' },
      { id: 'fin-invoices', label: 'Invoices', route: '/finance/invoices', order: 3, required_permission: 'finance.view' },
      { id: 'fin-receipts', label: 'Receipts & Payments', route: '/finance/receipts', order: 4, required_permission: 'finance.view' },
      { id: 'fin-cheques', label: 'Cheques', route: '/finance/cheques', order: 5, required_permission: 'finance.view' },
      { id: 'fin-payables', label: 'Supplier Payables', route: '/finance/payables', order: 6, required_permission: 'finance.view' },
      { id: 'fin-employee-ledgers', label: 'Employee Ledgers', route: '/finance/employee-ledgers', order: 7, required_permission: 'finance.view' },
      { id: 'fin-cashbook', label: 'Cash & Bank Book', route: '/finance/cashbook', order: 8, required_permission: 'finance.view' },
      { id: 'fin-journal', label: 'Journal & Adjustments', route: '/finance/journal', order: 9, required_permission: 'finance.edit' },
      { id: 'fin-costing', label: 'Costing & Profit', route: '/finance/costing', order: 10, required_permission: 'finance.view' },
      { id: 'fin-trial-balance', label: 'Trial Balance & Period Close', route: '/finance/trial-balance', order: 11, required_permission: 'finance.view' },
      { id: 'fin-tax', label: 'Tax', route: '/finance/tax', order: 12, required_permission: 'finance.view' },
      { id: 'fin-reports', label: 'Reports', route: '/finance/reports', order: 13, required_permission: 'reports.view' }
    ]
  },
  {
    id: 'mod-reports',
    module: 'reports',
    label: 'Reports',
    subtitle: 'Enterprise Analytics & Format Builder',
    icon: 'BarChart3',
    route: '/reports',
    order: 9,
    required_permission: 'reports.view',
    allowed_roles: ['owner', 'super_admin', 'production_manager', 'accountant', 'hr_manager'],
    tabs: [
      { id: 'rep-overview', label: 'Overview', route: '/reports', order: 1, required_permission: 'reports.view' },
      { id: 'rep-production', label: 'Production', route: '/reports/production', order: 2, required_permission: 'reports.view' },
      { id: 'rep-quality', label: 'Quality', route: '/reports/quality', order: 3, required_permission: 'reports.view' },
      { id: 'rep-stock', label: 'Stock', route: '/reports/stock', order: 4, required_permission: 'reports.view' },
      { id: 'rep-hr', label: 'HR & Payroll', route: '/reports/hr', order: 5, required_permission: 'reports.view' },
      { id: 'rep-finance', label: 'Finance', route: '/reports/finance', order: 6, required_permission: 'reports.view' },
      { id: 'rep-management', label: 'Management (Daily Pack)', route: '/reports/management', order: 7, required_permission: 'reports.view' },
      { id: 'rep-designer', label: 'Report Designer', route: '/reports/designer', order: 8, required_permission: 'reports.view' },
      { id: 'rep-scheduled', label: 'Scheduled & History', route: '/reports/scheduled', order: 9, required_permission: 'reports.view' }
    ]
  },
  {
    id: 'mod-admin',
    module: 'admin',
    label: 'Administration',
    subtitle: 'System Security, Users & Portal Manager',
    icon: 'Settings',
    route: '/admin',
    order: 10,
    required_permission: 'users.view',
    allowed_roles: ['owner', 'super_admin'],
    tabs: [
      { id: 'adm-overview', label: 'Overview', route: '/admin', order: 1, required_permission: 'users.view' },
      { id: 'adm-users', label: 'Users', route: '/admin/users', order: 2, required_permission: 'users.view' },
      { id: 'adm-roles', label: 'Roles & Permission Matrix', route: '/admin/roles', order: 3, required_permission: 'users.edit' },
      { id: 'adm-portals', label: 'Portals & Navigation', route: '/admin/portals', order: 4, required_permission: 'settings.edit' },
      { id: 'adm-approval-policies', label: 'Approval Policies', route: '/admin/approval-policies', order: 5, required_permission: 'settings.edit' },
      { id: 'adm-print-formats', label: 'Print Formats', route: '/admin/print-formats', order: 6, required_permission: 'settings.edit' },
      { id: 'adm-company', label: 'Company Settings', route: '/admin/company', order: 7, required_permission: 'settings.edit' },
      { id: 'adm-integrations', label: 'Integrations', route: '/admin/integrations', order: 8, required_permission: 'settings.edit' },
      { id: 'adm-audit', label: 'Audit Log', route: '/admin/audit', order: 9, required_permission: 'audit.view' },
      { id: 'adm-sessions', label: 'Sessions & Devices', route: '/admin/sessions', order: 10, required_permission: 'users.view' },
      { id: 'adm-health', label: 'Backups & System Health', route: '/admin/health', order: 11, required_permission: 'settings.edit' }
    ]
  }
];
