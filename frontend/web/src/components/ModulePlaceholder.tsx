import React from 'react';
import type { ModuleKey } from '../types';
import { 
  Users, 
  FileSpreadsheet, 
  Layers, 
  Package, 
  CheckSquare, 
  UserCheck, 
  Clock, 
  Truck, 
  DollarSign, 
  BarChart3, 
  BellRing, 
  ShieldAlert, 
  Settings, 
  RefreshCw,
  Plus,
  Filter,
  Download,
  ExternalLink,
  Printer,
  Grid
} from 'lucide-react';

interface ModulePlaceholderProps {
  moduleKey: ModuleKey;
}

export const ModulePlaceholder: React.FC<ModulePlaceholderProps> = ({ moduleKey }) => {
  const details: Record<ModuleKey, { title: string; subtitle: string; phase: string; icon: React.ElementType; stats: { label: string; val: string }[] }> = {
    dashboard: { title: 'Mill Overview', subtitle: 'Factory level telemetry', phase: 'Phase 2', icon: Layers, stats: [] },
    clients: { 
      title: 'Clients & Accounts Master', 
      subtitle: '16 Verified Textile Apparel & Fashion Brands with Credit Term Enforcement', 
      phase: 'Phase 3', 
      icon: Users,
      stats: [{ label: 'Active Clients', val: '16' }, { label: 'Total Credit Limit', val: 'PKR 120M' }, { label: 'Payment Overdue', val: 'PKR 4.2M' }] 
    },
    orders: { 
      title: 'Orders & Quotation Wizard', 
      subtitle: 'Buyer POs, Fabric Construction Specs (Warp/Weft count, GSM, Reed/Pick) & Costings', 
      phase: 'Phase 4', 
      icon: FileSpreadsheet,
      stats: [{ label: 'Open POs', val: '24' }, { label: 'Under Weaving', val: '14' }, { label: 'Dispatched Today', val: '3' }] 
    },
    production: { 
      title: 'Loom & Stage Production Tracking', 
      subtitle: 'Real-time Lot Progress, QR Scanning & Mill Line Allocations', 
      phase: 'Phase 5', 
      icon: Layers,
      stats: [{ label: 'Active Lots', val: '42' }, { label: 'Running Looms', val: '68' }, { label: 'Daily Metres', val: '38,450 m' }] 
    },
    floor: { 
      title: 'Floor Entry & Kiosks', 
      subtitle: 'Shop-floor data entry for every role, supervisory approvals inbox, late paper reconciliation', 
      phase: 'Prompt 5', 
      icon: Layers,
      stats: [{ label: 'Active Kiosks', val: '8 Online' }, { label: 'Approvals Pending', val: '14' }, { label: 'Late Entries', val: '1.8%' }] 
    },
    'floor-entry': {
      title: 'Floor Data Entry',
      subtitle: 'Shop-floor data entry: scan QR, piece-rate, rejects logging and earnings preview',
      phase: 'Embedded',
      icon: Layers,
      stats: [{ label: 'Scanner Status', val: 'Ready' }, { label: 'Active Mode', val: 'Embedded' }, { label: 'Speed', val: '<3s / bundle' }]
    },
    kiosk: { 
      title: 'Kiosk Terminal Mode', 
      subtitle: 'Fullscreen rugged Android kiosk interface with Urdu audio and giant touchpads', 
      phase: 'Prompt 5', 
      icon: Layers,
      stats: [{ label: 'Scan Speed', val: '< 6 sec' }, { label: 'Idle Timeout', val: '25s' }, { label: 'Live Rate', val: 'PKR 22.5/pc' }] 
    },
    inventory: { 
      title: 'Yarn, Chemicals & Fabric Stock Ledger', 
      subtitle: 'Multi-warehouse stock, cotton bales, reactive dyes & packaging accessories', 
      phase: 'Phase 6', 
      icon: Package,
      stats: [{ label: 'Yarn in Stock', val: '64,200 kg' }, { label: 'Grey Fabric Roll', val: '124,000 m' }, { label: 'Dyes & Chem', val: '8,400 kg' }] 
    },
    quality: { 
      title: 'Quality Assurance & 4-Point Inspection', 
      subtitle: 'ASTM D5430 Fabric Inspection, Lab Dipping, GSM Tests & Defect Logging', 
      phase: 'Phase 7', 
      icon: CheckSquare,
      stats: [{ label: 'Inspect Pass Rate', val: '98.4%' }, { label: 'Lots Checked Today', val: '18' }, { label: 'Defect Points/100m', val: '14.2' }] 
    },
    labour: { 
      title: 'Labour & Piece-Rate Payroll', 
      subtitle: 'Worker Skill Grades, Shift Rates, Production Piece-Rate Calculations & Overtime', 
      phase: 'Phase 8', 
      icon: UserCheck,
      stats: [{ label: 'Enrolled Workers', val: '240' }, { label: 'Biometric Verified', val: '184' }, { label: 'Weekly Payout Est.', val: 'PKR 1.84M' }] 
    },
    attendance: { 
      title: 'Biometric Attendance & Geofenced Shifts', 
      subtitle: 'Mill Entrance Gates, Floor Scanners, Leave Management & Overtime Logs', 
      phase: 'Phase 8', 
      icon: Clock,
      stats: [{ label: 'Shift A (Morning)', val: '120 Workers' }, { label: 'Shift B (Evening)', val: '64 Workers' }, { label: 'Late Clock-ins', val: '4' }] 
    },
    delivery: { 
      title: 'Delivery Challans & Gate Passes', 
      subtitle: 'Dispatch Tracking, Proof of Delivery (POD) Signature & Vehicle Gate Passes', 
      phase: 'Phase 9', 
      icon: Truck,
      stats: [{ label: 'Today Challans', val: '8' }, { label: 'En Route Karachi', val: '2 Containers' }, { label: 'Signed PODs', val: '6' }] 
    },
    finance: { 
      title: 'Mill Financial Ledgers & Invoicing', 
      subtitle: 'Sales Tax Invoices, Advance Receipts, Withholding Tax (WHT) & Aging Reports', 
      phase: 'Phase 10', 
      icon: DollarSign,
      stats: [{ label: 'Monthly Billing', val: 'PKR 48.6M' }, { label: 'Receivables (0-30d)', val: 'PKR 28.2M' }, { label: 'Tax Deductions', val: 'PKR 3.4M' }] 
    },
    reports: { 
      title: 'Analytics & Executive BI Reports', 
      subtitle: 'Weaving efficiency, Yarn yield %, Machine downtime analysis & P&L snapshot', 
      phase: 'Phase 11', 
      icon: BarChart3,
      stats: [{ label: 'Saved Reports', val: '14' }, { label: 'Auto PDF Mailer', val: 'Daily 8PM' }, { label: 'Yarn Yield Avg', val: '94.6%' }] 
    },
    notifications: { 
      title: 'WhatsApp Cloud API & SMS Alerting', 
      subtitle: 'Automated buyer dispatch updates, shift overtime alerts & inventory thresholds', 
      phase: 'Phase 11', 
      icon: BellRing,
      stats: [{ label: 'WhatsApp Sent Today', val: '142' }, { label: 'Delivery Alerts', val: '38' }, { label: 'Delivery Rate', val: '99.2%' }] 
    },
    audit: { 
      title: 'Enterprise Audit Trail & Security', 
      subtitle: 'Immutable record of every lot status transition, user login & financial change', 
      phase: 'Phase 12', 
      icon: ShieldAlert,
      stats: [{ label: 'Logged Events (24h)', val: '1,840' }, { label: 'Failed Logins', val: '0' }, { label: 'Security Status', val: 'Hardened' }] 
    },
    settings: { 
      title: 'Textile Mill Configuration', 
      subtitle: 'Custom sequences (LOT-0001, PO-0001), 9 stage setups & printer calibration', 
      phase: 'Phase 12', 
      icon: Settings,
      stats: [{ label: 'Configured Stages', val: '9' }, { label: 'Thermal Printers', val: '4 Active' }, { label: 'Auto QR Prefix', val: 'Enabled' }] 
    },
    users: {
      title: 'Users & RBAC Access Matrix',
      subtitle: 'Dynamic role assignments, Segregation of Duties (SoD) & field privacy masking',
      phase: 'Phase 3C',
      icon: Users,
      stats: [{ label: 'Enrolled Users', val: '6' }, { label: 'Active Roles', val: '9' }, { label: 'SoD Rules', val: '4 Enforced' }]
    },
    sync: { 
      title: 'Mobile Worker Offline Sync Queue', 
      subtitle: 'IndexedDB SQLite offline event caching & batch conflict reconciliation', 
      phase: 'Phase 12', 
      icon: RefreshCw,
      stats: [{ label: 'Sync Status', val: 'Up to Date' }, { label: 'Pending Mobile Buffers', val: '0' }, { label: 'Latency', val: '14ms' }] 
    },
    print: {
      title: 'Print Format Designer & Template Library',
      subtitle: 'Drag-and-drop mm-accurate visual print builder for all documents & reports',
      phase: 'Phase 6',
      icon: Printer,
      stats: [{ label: 'Default Templates', val: '24' }, { label: 'Active Printers', val: 'Zebra + Laser' }, { label: 'Engine', val: 'WeasyPrint' }]
    },
    hr: {
      title: 'HR OS Workspace',
      subtitle: 'Complete human resources, biometrics, leave, advances, and payroll ecosystem',
      phase: 'Prompt 10',
      icon: Users,
      stats: [{ label: 'Total Headcount', val: '142' }, { label: 'Biometrics', val: 'Live Online' }, { label: 'Payroll Cycle', val: 'October 2026' }]
    },
    admin: {
      title: 'Administration OS',
      subtitle: 'System security, user credentials, RBAC matrix, and audit controls',
      phase: 'Prompt 10',
      icon: Settings,
      stats: [{ label: 'Enrolled Users', val: '6' }, { label: 'Roles', val: '9' }, { label: 'Backups', val: 'Operational' }]
    },
    portals: {
      title: 'Enterprise Portal Manager & Security Policies',
      subtitle: 'Config-driven 15 role-wise branded portals, idle timers, and authentication workflows',
      phase: 'Prompt 7 & 9',
      icon: Grid,
      stats: [{ label: 'Configured Portals', val: '15 OS' }, { label: 'Security Mode', val: 'Password-Direct (2FA Bypass)' }, { label: 'Active Portals', val: 'Live' }]
    },
  };

  const curr = details[moduleKey] || details.dashboard;
  const Icon = curr.icon;

  return (
    <div className="animate-fade-in" style={{ padding: '28px', maxWidth: '1600px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Module Title Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px',
        borderBottom: '1px solid var(--border-light)',
        paddingBottom: '20px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            width: '52px',
            height: '52px',
            borderRadius: 'var(--radius-lg)',
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(6, 182, 212, 0.2))',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Icon size={26} color="var(--emerald-light)" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h1 style={{ fontSize: '1.5rem', color: 'var(--text-main)' }}>{curr.title}</h1>
              <span className="badge badge-emerald">{curr.phase}</span>
            </div>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              {curr.subtitle}
            </p>
          </div>
        </div>

        {/* Action Bar */}
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn btn-primary">
            <Plus size={16} />
            <span>Create New Entry</span>
          </button>
          <button className="btn btn-secondary">
            <Filter size={16} />
            <span>Filter</span>
          </button>
          <button className="btn btn-secondary">
            <Download size={16} />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Module KPI Metric Badges */}
      {curr.stats.length > 0 && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '16px',
        }}>
          {curr.stats.map((st, idx) => (
            <div key={idx} className="glass-panel" style={{ padding: '18px' }}>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>{st.label}</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, marginTop: '6px', color: 'var(--emerald-light)' }}>
                {st.val}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Interactive Module Preview Body */}
      <div className="glass-panel" style={{ padding: '32px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
        <div style={{
          width: '64px',
          height: '64px',
          borderRadius: '50%',
          background: 'rgba(255, 255, 255, 0.04)',
          border: '1px dashed var(--border-light)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <Icon size={28} color="var(--text-muted)" />
        </div>

        <div style={{ maxWidth: '540px' }}>
          <h3 style={{ fontSize: '1.15rem', color: 'var(--text-main)', marginBottom: '8px' }}>
            {curr.title} Module Scaffolding Ready
          </h3>
          <p style={{ color: 'var(--text-dim)', fontSize: '0.9rem', lineHeight: '1.5' }}>
            Backend API endpoints, models and validation are configured in Django. Full interactive data tables, forms and modal wizards for this section are scheduled in <strong>{curr.phase}</strong>.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
          <a 
            href="/api/docs/" 
            target="_blank" 
            rel="noreferrer" 
            className="btn btn-secondary" 
            style={{ fontSize: '0.85rem' }}
          >
            <span>Explore API Schema (Swagger)</span>
            <ExternalLink size={14} />
          </a>
        </div>
      </div>
    </div>
  );
};
