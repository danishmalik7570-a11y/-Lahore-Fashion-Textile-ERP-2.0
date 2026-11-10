export interface NavGroupConfig {
  id: string;
  module: string;
  label: string;
  label_ur?: string;
  icon: string;
  route?: string;
  badge?: string;
  required_permission?: string;
  allowed_roles?: string[];
  allowed_portals?: string[];
  children?: NavChildConfig[];
}

export interface NavChildConfig {
  id: string;
  key: string;
  label: string;
  label_ur?: string;
  route: string;
  badge?: string;
  required_permission?: string;
  allowed_roles?: string[];
  allowed_portals?: string[];
}

/**
 * Standard enterprise navigation hierarchy for Lahore Fashion Mill.
 * Strictly adheres to specified 10-module top-level structure.
 */
export const ENTERPRISE_NAV_MANIFEST: NavGroupConfig[] = [
  {
    id: 'group-dashboard',
    module: 'dashboard',
    label: 'Dashboard',
    label_ur: 'ڈیش بورڈ',
    icon: 'LayoutDashboard',
    route: 'dashboard',
    // No dropdown
  },
  {
    id: 'group-orders',
    module: 'orders',
    label: 'Orders',
    label_ur: 'آرڈرز',
    icon: 'ShoppingBag',
    allowed_roles: ['owner', 'super_admin', 'production_manager', 'accountant'],
    allowed_portals: ['owner', 'manager', 'finance'],
    children: [
      { id: 'orders-all', key: 'orders:all', label: 'All Orders', label_ur: 'تمام آرڈرز', route: 'orders' },
      { id: 'orders-new', key: 'orders:new', label: 'New Order', label_ur: 'نیا آرڈر', route: 'orders' },
      { id: 'orders-quotes', key: 'orders:quotes', label: 'Quotations', label_ur: 'کوٹیشنز', route: 'orders' },
      { id: 'orders-tracking', key: 'orders:tracking', label: 'Order Tracking', label_ur: 'آرڈر ٹریکنگ', route: 'orders' },
      { id: 'orders-clients', key: 'clients', label: 'Clients & Accounts', label_ur: 'کسٹمرز و اکاؤنٹس', route: 'clients' },
    ],
  },
  {
    id: 'group-production',
    module: 'production',
    label: 'Production',
    label_ur: 'پیداوار',
    icon: 'Factory',
    allowed_roles: ['owner', 'super_admin', 'production_manager', 'supervisor', 'qc_inspector'],
    allowed_portals: ['owner', 'manager', 'dept', 'floor'],
    children: [
      { id: 'prod-planning', key: 'production:planning', label: 'Planning Board', label_ur: 'پلاننگ بورڈ', route: 'production' },
      { id: 'prod-lots', key: 'production:lots', label: 'Lots & QR', label_ur: 'لاٹس اور کیو آر', route: 'production' },
      { id: 'prod-yarn', key: 'production:yarn', label: 'Yarn Store', label_ur: 'یارن اسٹور', route: 'inventory' },
      { id: 'prod-weaving', key: 'production:weaving', label: 'Weaving', label_ur: 'ویونگ', route: 'production' },
      { id: 'prod-knitting', key: 'production:knitting', label: 'Knitting', label_ur: 'نٹنگ', route: 'production' },
      { id: 'prod-grey', key: 'production:grey', label: 'Grey Store', label_ur: 'گرے اسٹور', route: 'inventory' },
      { id: 'prod-dyeing', key: 'production:dyeing', label: 'Dyeing', label_ur: 'ڈائینگ', route: 'production' },
      { id: 'prod-printing', key: 'production:printing', label: 'Printing', label_ur: 'پرنٹنگ', route: 'production' },
      { id: 'prod-cutting', key: 'production:cutting', label: 'Cutting', label_ur: 'کٹنگ', route: 'production' },
      { id: 'prod-stitching', key: 'production:stitching', label: 'Stitching', label_ur: 'سلائی / اسٹچنگ', route: 'production' },
      { id: 'prod-packing', key: 'production:packing', label: 'Finishing & Packing', label_ur: 'فنشنگ اور پیکنگ', route: 'production' },
      {
        id: 'prod-floor-entry',
        key: 'floor-entry',
        label: 'Floor Entry',
        label_ur: 'فلور انٹری',
        route: 'floor-entry',
        required_permission: 'entry.create',
      },
    ],
  },
  {
    id: 'group-inventory',
    module: 'inventory',
    label: 'Inventory',
    label_ur: 'اسٹاک و گودام',
    icon: 'Boxes',
    allowed_roles: ['owner', 'super_admin', 'store_keeper', 'accountant'],
    allowed_portals: ['owner', 'manager', 'stores'],
    children: [
      { id: 'inv-stock', key: 'inventory:stock', label: 'Stock', label_ur: 'موجودہ اسٹاک', route: 'inventory' },
      { id: 'inv-grn', key: 'inventory:grn', label: 'GRN / Purchase', label_ur: 'جی آر این / خریداری', route: 'inventory' },
      { id: 'inv-issues', key: 'inventory:issues', label: 'Issues', label_ur: 'جاری کردہ سامان', route: 'inventory' },
      { id: 'inv-transfers', key: 'inventory:transfers', label: 'Transfers', label_ur: 'منتقلی', route: 'inventory' },
      { id: 'inv-suppliers', key: 'inventory:suppliers', label: 'Suppliers', label_ur: 'سپلائرز', route: 'inventory' },
      { id: 'inv-count', key: 'inventory:count', label: 'Stock Count', label_ur: 'اسٹاک گنتی', route: 'inventory' },
    ],
  },
  {
    id: 'group-quality',
    module: 'quality',
    label: 'Quality',
    label_ur: 'معیار و تفتیش',
    icon: 'ShieldCheck',
    allowed_roles: ['owner', 'super_admin', 'qc_inspector', 'production_manager'],
    allowed_portals: ['owner', 'manager', 'qc'],
    children: [
      { id: 'qc-inspections', key: 'quality:inspections', label: 'Inspections', label_ur: 'معائنہ', route: 'quality' },
      { id: 'qc-lab', key: 'quality:lab', label: 'Lab Tests', label_ur: 'لیب ٹیسٹ', route: 'quality' },
      { id: 'qc-defects', key: 'quality:defects', label: 'Defects', label_ur: 'نقائص', route: 'quality' },
      { id: 'qc-rework', key: 'quality:rework', label: 'Rework', label_ur: 'دوبارہ کام', route: 'quality' },
      { id: 'qc-claims', key: 'quality:claims', label: 'Claims', label_ur: 'دعوے', route: 'quality' },
    ],
  },
  {
    id: 'group-delivery',
    module: 'delivery',
    label: 'Delivery',
    label_ur: 'ترسیل و ڈسپیچ',
    icon: 'Truck',
    allowed_roles: ['owner', 'super_admin', 'store_keeper', 'accountant'],
    allowed_portals: ['owner', 'manager', 'stores'],
    children: [
      { id: 'del-challans', key: 'delivery:challans', label: 'Challans', label_ur: 'چالان', route: 'delivery' },
      { id: 'del-gate-passes', key: 'delivery:gate-passes', label: 'Gate Passes', label_ur: 'گیٹ پاس', route: 'delivery' },
      { id: 'del-transporters', key: 'delivery:transporters', label: 'Transporters', label_ur: 'ٹرانسپورٹرز', route: 'delivery' },
      { id: 'del-pod', key: 'delivery:pod', label: 'Proof of Delivery', label_ur: 'وصولی کا ثبوت', route: 'delivery' },
    ],
  },
  {
    id: 'group-hr',
    module: 'hr',
    label: 'HR',
    label_ur: 'انسانی وسائل',
    icon: 'Users',
    allowed_roles: ['owner', 'super_admin', 'hr_manager'],
    allowed_portals: ['owner', 'hr', 'manager'],
    children: [
      { id: 'hr-employees', key: 'employees', label: 'Employees', label_ur: 'ملازمین کی فہرست', route: 'labour' },
      { id: 'hr-attendance', key: 'attendance', label: 'Attendance', label_ur: 'حاضری لاگز', route: 'labour' },
      { id: 'hr-shifts', key: 'hr:shifts', label: 'Shifts & Roster', label_ur: 'شفٹس و روسٹر', route: 'labour' },
      { id: 'hr-leave', key: 'hr:leave', label: 'Leave', label_ur: 'رخصت', route: 'labour' },
      { id: 'hr-overtime', key: 'hr:overtime', label: 'Overtime', label_ur: 'اوور ٹائم', route: 'labour' },
      { id: 'hr-payroll', key: 'payroll', label: 'Payroll', label_ur: 'تنخواہیں اور سلپس', route: 'labour' },
      { id: 'hr-advances', key: 'hr:advances', label: 'Advances & Loans', label_ur: 'ایڈوانس اور قرضے', route: 'labour' },
      { id: 'hr-contractors', key: 'hr:contractors', label: 'Contractors', label_ur: 'ٹھیکیدار', route: 'labour' },
      { id: 'hr-recruitment', key: 'hr:recruitment', label: 'Recruitment', label_ur: 'بھرتی', route: 'labour' },
      { id: 'hr-training', key: 'hr:training', label: 'Performance & Training', label_ur: 'کارکردگی اور تربیت', route: 'labour' },
      { id: 'hr-exit', key: 'hr:exit', label: 'Exit & Settlement', label_ur: 'فائنل سیٹلمنٹ', route: 'labour' },
      { id: 'hr-compliance', key: 'compliance', label: 'Compliance', label_ur: 'قانونی تقاضے (ای او بی آئی)', route: 'labour' },
    ],
  },
  {
    id: 'group-finance',
    module: 'finance',
    label: 'Finance',
    label_ur: 'مالیات و کھاتے',
    icon: 'DollarSign',
    badge: '1 pending',
    allowed_roles: ['owner', 'super_admin', 'accountant'],
    allowed_portals: ['owner', 'finance', 'manager'],
    children: [
      { id: 'fin-client-ledgers', key: 'finance:client-ledgers', label: 'Client Ledgers', label_ur: 'کسٹمر کھاتے', route: 'clients' },
      { id: 'fin-invoices', key: 'finance', label: 'Invoices', label_ur: 'انوائسز اور وصولیاں', route: 'finance' },
      { id: 'fin-receipts', key: 'finance:receipts', label: 'Receipts & Payments', label_ur: 'رسیدیں اور ادائیگیاں', route: 'finance' },
      { id: 'fin-cheques', key: 'finance:cheques', label: 'Cheques', label_ur: 'چیکس', route: 'finance' },
      { id: 'fin-payables', key: 'payments', label: 'Supplier Payables', label_ur: 'سپلائر ادائیگیاں', route: 'finance' },
      { id: 'fin-employee-ledgers', key: 'finance:employee-ledgers', label: 'Employee Ledgers', label_ur: 'ملازمین کے لیجر', route: 'finance' },
      { id: 'fin-costing', key: 'finance:costing', label: 'Costing & Profit', label_ur: 'لاگت اور منافع', route: 'finance' },
    ],
  },
  {
    id: 'group-reports',
    module: 'reports',
    label: 'Reports',
    label_ur: 'رپورٹس و گوشوارے',
    icon: 'BarChart3',
    allowed_roles: ['owner', 'super_admin', 'production_manager', 'accountant', 'hr_manager'],
    allowed_portals: ['owner', 'manager', 'finance', 'hr'],
    children: [
      { id: 'rep-prod', key: 'reports:production', label: 'Production', label_ur: 'پیداواری رپورٹ', route: 'reports' },
      { id: 'rep-quality', key: 'reports:quality', label: 'Quality', label_ur: 'کوالٹی رپورٹ', route: 'reports' },
      { id: 'rep-stock', key: 'reports:stock', label: 'Stock', label_ur: 'اسٹاک رپورٹ', route: 'reports' },
      { id: 'rep-hr', key: 'reports:hr', label: 'HR', label_ur: 'لیبر و ایچ آر رپورٹ', route: 'reports' },
      { id: 'rep-finance', key: 'reports:finance', label: 'Finance', label_ur: 'مالیاتی رپورٹ', route: 'reports' },
      { id: 'rep-management', key: 'reports', label: 'Management', label_ur: 'انتظامی رپورٹ', route: 'reports' },
    ],
  },
  {
    id: 'group-admin',
    module: 'admin',
    label: 'Administration',
    label_ur: 'انتظامی کنٹرول',
    icon: 'Settings',
    allowed_roles: ['owner', 'super_admin'],
    allowed_portals: ['owner', 'admin'],
    children: [
      { id: 'adm-users', key: 'users', label: 'Users', label_ur: 'صارفین کا انتظام', route: 'users' },
      { id: 'adm-roles', key: 'roles', label: 'Roles & Permission Matrix', label_ur: 'کردار اور اختیارات', route: 'users' },
      { id: 'adm-portals', key: 'portals', label: 'Portal Manager', label_ur: 'پورٹل مینیجر', route: 'portals' },
      { id: 'adm-print', key: 'print', label: 'Print Formats', label_ur: 'پرنٹ فارمیٹس', route: 'print' },
      { id: 'adm-settings', key: 'settings', label: 'Settings', label_ur: 'سسٹم سیٹنگز', route: 'settings' },
      { id: 'adm-audit', key: 'audit', label: 'Audit Log', label_ur: 'آڈٹ لاگ', route: 'settings' },
    ],
  },
];
