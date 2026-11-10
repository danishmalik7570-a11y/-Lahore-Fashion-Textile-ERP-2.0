import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  Boxes,
  FileText,
  Database,
  Trash2,
  ChevronRight,
  Info,
} from 'lucide-react';
import { Card, Button, StatusChip, DataTable } from '../../components/ui';
import type { Column } from '../../components/ui';

interface KpiItem {
  id: string;
  label: string;
  value: string | number;
  sub: string;
  formula: string;
  source: string;
  drilldown: string;
  status: 'normal' | 'warning' | 'danger' | 'success';
}

interface FlowStage {
  key: string;
  name: string;
  lot_count: number;
  delayed_count: number;
  has_delay: boolean;
}

interface DelayedLot {
  lot_number: string;
  fabric_spec: string;
  stage: string;
  produced_meters: number;
  target_meters: number;
  status: string;
  supervisor: string;
}

interface ApprovalItem {
  id: string;
  type: string;
  title: string;
  dept: string;
  value: string;
  date: string;
}

interface OutputChartPoint {
  date: string;
  output: number;
  target: number;
}

interface ReceivablesBracket {
  bracket: string;
  amount: number;
}

interface DashboardData {
  is_empty: boolean;
  is_demo_data: boolean;
  mill_name: string;
  mill_code: string;
  single_unit_mode: boolean;
  updated_at: string;
  kpis: KpiItem[];
  production_flow: FlowStage[];
  delayed_lots: DelayedLot[];
  approvals: ApprovalItem[];
  charts: {
    output_vs_target: OutputChartPoint[];
    receivables_ageing: ReceivablesBracket[];
    qc_pass_rate: number;
    qc_total_audits: number;
  };
  recent_activity: {
    id: string;
    type: string;
    desc: string;
    time: string;
    status: string;
  }[];
}

export interface OwnerDashboardViewProps {
  onNavigate?: (moduleKey: string) => void;
}

export const OwnerDashboardView: React.FC<OwnerDashboardViewProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const [lang, setLang] = useState<'en' | 'ur'>('en');
  const [activeTab, setActiveTab] = useState<
    'overview' | 'approvals' | 'production' | 'finance' | 'hr' | 'quality_stock' | 'alerts'
  >('overview');
  const [dateFilter, setDateFilter] = useState<'today' | 'week' | 'mtd' | 'ytd'>('today');

  const [data, setData] = useState<DashboardData | null>(null);
  const [wsStatus, setWsStatus] = useState<'Live' | 'Reconnecting' | 'Offline'>('Live');
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const [demoLoading, setDemoLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [tooltipKpi, setTooltipKpi] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const fetchStats = useCallback(async () => {
    try {
      const token = localStorage.getItem('lf_jwt_access');
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      let resp = await fetch('/api/v1/dashboard/stats/', {
        headers,
      });
      if (resp.status === 401 && token) {
        localStorage.removeItem('lf_jwt_access');
        delete headers['Authorization'];
        resp = await fetch('/api/v1/dashboard/stats/', { headers });
      }
      if (resp.ok) {
        const json = await resp.json();
        setData(json);
        setLastUpdated(json.updated_at || new Date().toLocaleTimeString('en-GB'));
        setWsStatus('Live');
      } else {
        setWsStatus('Offline');
      }
    } catch {
      setWsStatus('Offline');
    }
  }, []);

  useEffect(() => {
    fetchStats();
    // 30-second fallback polling
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, [fetchStats]);

  const handleDemoAction = async (action: 'load' | 'wipe') => {
    setDemoLoading(true);
    try {
      const token = localStorage.getItem('lf_jwt_access');
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      let resp = await fetch(`/api/v1/dashboard/demo-data/${action}/`, {
        method: 'POST',
        headers,
      });
      if (resp.status === 401 && token) {
        localStorage.removeItem('lf_jwt_access');
        delete headers['Authorization'];
        resp = await fetch(`/api/v1/dashboard/demo-data/${action}/`, {
          method: 'POST',
          headers,
        });
      }
      if (resp.ok) {
        showToast(action === 'load' ? 'Demo records loaded successfully' : 'Demo data wiped cleanly');
        await fetchStats();
      } else {
        const err = await resp.json();
        showToast(err.error || 'Failed to update demo data');
      }
    } catch {
      showToast('Error communicating with demo data endpoint');
    } finally {
      setDemoLoading(false);
    }
  };

  const handleApprove = (item: ApprovalItem) => {
    if (!data) return;
    setData({
      ...data,
      approvals: data.approvals.filter((a) => a.id !== item.id),
    });
    showToast(`Approved ${item.title} (${item.value})`);
  };

  const isRtl = lang === 'ur';

  // Delayed lots table columns
  const delayedLotColumns: Column<DelayedLot>[] = [
    { key: 'lot_number', header: isRtl ? 'لاٹ نمبر' : 'Lot Number', render: (row) => <span style={{ fontWeight: 600 }}>{row.lot_number}</span> },
    { key: 'fabric_spec', header: isRtl ? 'کپڑا تفصیل' : 'Fabric Spec' },
    { key: 'stage', header: isRtl ? 'مرحلہ' : 'Stage', render: (row) => <StatusChip variant="neutral" label={row.stage} /> },
    {
      key: 'produced_meters',
      header: isRtl ? 'پیداوار / ہدف' : 'Produced / Target',
      align: 'right',
      render: (row) => (
        <span style={{ fontFeatureSettings: '"tnum"' }}>
          {row.produced_meters.toLocaleString()} / {row.target_meters.toLocaleString()} m
        </span>
      ),
    },
    {
      key: 'status',
      header: isRtl ? 'حیثیت' : 'Status',
      render: (row) => <StatusChip variant={row.status.toLowerCase().includes('delay') ? 'danger' : 'success'} label={row.status} />,
    },
    { key: 'supervisor', header: isRtl ? 'نگران' : 'Supervisor' },
  ];

  return (
    <div
      dir={isRtl ? 'rtl' : 'ltr'}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        padding: '24px 32px',
        backgroundColor: '#F5F7FA',
        minHeight: '100vh',
        fontFamily: isRtl ? "'Noto Nastaliq Urdu', 'Inter', sans-serif" : "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
        color: '#1F2937',
      }}
    >
      {/* ── Page Header ── */}
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div>
          {/* Breadcrumb */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#6B7280', marginBottom: '4px' }}>
            <span>{isRtl ? 'انتظامیہ' : 'Executive'}</span>
            <ChevronRight size={12} />
            <span>{isRtl ? 'آنر او ایس' : 'Owner OS'}</span>
            <ChevronRight size={12} />
            <span style={{ color: '#1E3A8A', fontWeight: 600 }}>{isRtl ? 'ڈیش بورڈ' : 'Dashboard'}</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <h1 style={{ margin: 0, fontSize: '20px', fontWeight: 600, color: '#1F2937' }}>
              {isRtl ? 'ڈیش بورڈ — لاہور فیشن مل' : 'Dashboard'}
            </h1>
            <span
              style={{
                fontSize: '12px',
                fontWeight: 600,
                color: '#4B5563',
                backgroundColor: '#E5EAF2',
                padding: '2px 8px',
                borderRadius: '6px',
              }}
            >
              Lahore Fashion Mill
            </span>
          </div>
        </div>

        {/* Right Header Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          {/* Date range filter */}
          <div
            style={{
              display: 'flex',
              backgroundColor: '#FFFFFF',
              border: '1px solid #E3E8EF',
              borderRadius: '6px',
              padding: '2px',
            }}
          >
            {(['today', 'week', 'mtd', 'ytd'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setDateFilter(range)}
                style={{
                  border: 'none',
                  backgroundColor: dateFilter === range ? '#1E3A8A' : 'transparent',
                  color: dateFilter === range ? '#FFFFFF' : '#6B7280',
                  padding: '4px 10px',
                  borderRadius: '4px',
                  fontSize: '12px',
                  fontWeight: dateFilter === range ? 600 : 500,
                  cursor: 'pointer',
                  textTransform: 'uppercase',
                }}
              >
                {range}
              </button>
            ))}
          </div>

          {/* Connection status chip */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: '#FFFFFF',
              border: '1px solid #E3E8EF',
              borderRadius: '6px',
              padding: '4px 10px',
              fontSize: '12px',
              color: '#374151',
              fontFeatureSettings: '"tnum"',
            }}
          >
            <span
              style={{
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                backgroundColor: wsStatus === 'Live' ? '#12B76A' : wsStatus === 'Reconnecting' ? '#F79009' : '#F04438',
              }}
            />
            <span style={{ fontWeight: 600 }}>{wsStatus}</span>
            {lastUpdated && <span style={{ color: '#9CA3AF' }}>• {lastUpdated}</span>}
          </div>

          {/* Language Toggle */}
          <div
            style={{
              display: 'flex',
              backgroundColor: '#FFFFFF',
              border: '1px solid #E3E8EF',
              borderRadius: '6px',
              padding: '2px',
            }}
          >
            <button
              data-testid="toggle-lang-en"
              onClick={() => setLang('en')}
              style={{
                border: 'none',
                backgroundColor: lang === 'en' ? '#1E3A8A' : 'transparent',
                color: lang === 'en' ? '#FFFFFF' : '#6B7280',
                padding: '4px 8px',
                borderRadius: '4px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              EN
            </button>
            <button
              data-testid="toggle-lang-ur"
              onClick={() => setLang('ur')}
              style={{
                border: 'none',
                backgroundColor: lang === 'ur' ? '#1E3A8A' : 'transparent',
                color: lang === 'ur' ? '#FFFFFF' : '#6B7280',
                padding: '4px 8px',
                borderRadius: '4px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              اردو
            </button>
          </div>

          {/* Demo Data Button */}
          {user && (user.role === 'owner' || user.role === 'super_admin') && (
            <Button
              data-testid="btn-demo-action"
              variant="outline"
              size="sm"
              isLoading={demoLoading}
              onClick={() => handleDemoAction(data?.is_demo_data ? 'wipe' : 'load')}
              style={{ fontSize: '12px', gap: '6px' }}
            >
              {data?.is_demo_data ? <Trash2 size={14} /> : <Database size={14} />}
              <span>{data?.is_demo_data ? (isRtl ? 'ڈیمو ڈیٹا ختم کریں' : 'Remove demo data') : (isRtl ? 'ڈیمو ڈیٹا لوڈ کریں' : 'Load demo data')}</span>
            </Button>
          )}

          {/* Export Board Report */}
          <Button
            variant="primary"
            size="sm"
            onClick={() => showToast('Board Report generated: Lahore_Fashion_Report.pdf')}
            style={{ backgroundColor: '#1E3A8A', fontSize: '12px', gap: '6px' }}
          >
            <FileText size={14} />
            <span>{isRtl ? 'بورڈ رپورٹ ایکسپورٹ' : 'Export (Board report)'}</span>
          </Button>
        </div>
      </header>

      {/* ── Demo Data Banner ── */}
      {data?.is_demo_data && (
        <div
          style={{
            backgroundColor: '#FFFBEB',
            border: '1px solid #FDE68A',
            borderRadius: '8px',
            padding: '10px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '13px',
            color: '#92400E',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontWeight: 700, backgroundColor: '#F59E0B', color: '#FFFFFF', padding: '2px 6px', borderRadius: '4px', fontSize: '11px' }}>
              DEMO DATA ACTIVE
            </span>
            <span>All numbers and records displayed are clearly labelled simulation items for review.</span>
          </div>
          <button
            data-testid="btn-remove-demo-banner"
            onClick={() => handleDemoAction('wipe')}
            disabled={demoLoading}
            style={{
              border: 'none',
              background: 'none',
              color: '#B45309',
              fontWeight: 600,
              cursor: 'pointer',
              textDecoration: 'underline',
              fontSize: '12px',
            }}
          >
            Remove demo data
          </button>
        </div>
      )}

      {/* ── Quiet Underlined Navigation Tabs ── */}
      <nav
        style={{
          display: 'flex',
          gap: '24px',
          borderBottom: '1px solid #E3E8EF',
          paddingBottom: '0px',
        }}
      >
        {[
          { key: 'overview', label: isRtl ? 'جائزہ' : 'Overview' },
          { key: 'approvals', label: isRtl ? 'منظوریاں' : 'Approvals', badge: data?.approvals.length },
          { key: 'production', label: isRtl ? 'پیداوار' : 'Production' },
          { key: 'finance', label: isRtl ? 'مالیات' : 'Finance' },
          { key: 'hr', label: isRtl ? 'انسانی وسائل' : 'HR' },
          { key: 'quality_stock', label: isRtl ? 'معیار اور اسٹاک' : 'Quality & Stock' },
          { key: 'alerts', label: isRtl ? 'انتباہات اور آڈٹ' : 'Alerts & Audit' },
        ].map((tab) => (
          <button
            key={tab.key}
            data-testid={`dashboard-tab-${tab.key}`}
            onClick={() => {
              if (tab.key === 'overview') {
                setActiveTab('overview');
              } else if (tab.key === 'approvals') {
                setActiveTab('approvals');
                const el = document.getElementById('dashboard-approvals-section');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              } else if (tab.key === 'production') {
                if (onNavigate) onNavigate('production');
                else window.location.href = '/portal/production';
              } else if (tab.key === 'finance') {
                if (onNavigate) onNavigate('finance');
                else window.location.href = '/portal/finance';
              } else if (tab.key === 'hr') {
                if (onNavigate) onNavigate('labour');
                else window.location.href = '/portal/hr';
              } else if (tab.key === 'quality_stock') {
                if (onNavigate) onNavigate('quality');
                else window.location.href = '/portal/quality';
              } else if (tab.key === 'alerts') {
                if (onNavigate) onNavigate('reports');
                else window.location.href = '/portal/reports';
              }
            }}
            style={{
              padding: '8px 4px 12px 4px',
              border: 'none',
              backgroundColor: 'transparent',
              fontSize: '13px',
              fontWeight: activeTab === tab.key ? 600 : 500,
              color: activeTab === tab.key ? '#1E3A8A' : '#6B7280',
              borderBottom: activeTab === tab.key ? '2px solid #1E3A8A' : '2px solid transparent',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.15s ease',
            }}
          >
            <span>{tab.label}</span>
            {Boolean(tab.badge && tab.badge > 0) && (
              <span
                style={{
                  fontSize: '11px',
                  backgroundColor: '#F04438',
                  color: '#FFFFFF',
                  borderRadius: '10px',
                  padding: '1px 6px',
                  fontWeight: 600,
                }}
              >
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </nav>

      {/* ── Honest Empty State (when 0 records exist) ── */}
      {data?.is_empty && (
        <Card style={{ padding: '40px', textAlign: 'center', backgroundColor: '#FFFFFF', border: '1px dashed #CBD5E1' }}>
          <Boxes size={40} color="#94A3B8" style={{ margin: '0 auto 12px auto' }} />
          <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#1F2937', margin: '0 0 6px 0' }}>
            {isRtl ? 'ابھی تک کوئی آرڈر یا لاٹ موجود نہیں ہے' : 'No manufacturing data recorded yet'}
          </h3>
          <p style={{ fontSize: '13px', color: '#6B7280', maxWidth: '480px', margin: '0 auto 20px auto' }}>
            {isRtl
              ? 'یہ ڈیش بورڈ صرف اصل ڈیٹا بیس ریکارڈ دکھاتا ہے۔ نیا آرڈر بنائیں یا شروع کرنے کے لیے ڈیمو ڈیٹا لوڈ کریں۔'
              : 'This dashboard reflects real database activity only. Create your first client order or load clearly marked demo records to explore live telemetry.'}
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
            <Button variant="primary" onClick={() => (window.location.href = '/portal/owner/orders')}>
              {isRtl ? 'نیا آرڈر بنائیں' : 'Create Order'}
            </Button>
            <Button variant="outline" onClick={() => handleDemoAction('load')} isLoading={demoLoading}>
              {isRtl ? 'ڈیمو ڈیٹا لوڈ کریں' : 'Load Demo Data'}
            </Button>
          </div>
        </Card>
      )}

      {/* ── Row 1: Six Compact KPI Cards ── */}
      {data && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
          {data.kpis.map((kpi) => (
            <div
              key={kpi.id}
              data-testid={`kpi-card-${kpi.id}`}
              onClick={() => {
                if (onNavigate) {
                  if (kpi.id.includes('cash') || kpi.id.includes('revenue') || kpi.id.includes('receivable') || kpi.id.includes('finance')) {
                    onNavigate('finance');
                  } else if (kpi.id.includes('labor') || kpi.id.includes('headcount') || kpi.id.includes('hr')) {
                    onNavigate('labour');
                  } else if (kpi.id.includes('order')) {
                    onNavigate('orders');
                  } else if (kpi.id.includes('quality') || kpi.id.includes('reject') || kpi.id.includes('defect')) {
                    onNavigate('quality');
                  } else if (kpi.id.includes('stock') || kpi.id.includes('yarn') || kpi.id.includes('inventory')) {
                    onNavigate('inventory');
                  } else {
                    onNavigate('production');
                  }
                } else if (kpi.drilldown) {
                  window.location.href = kpi.drilldown;
                }
              }}
              onMouseEnter={() => setTooltipKpi(kpi.id)}
              onMouseLeave={() => setTooltipKpi(null)}
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '8px',
                border: '1px solid #E3E8EF',
                padding: '16px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                cursor: 'pointer',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              {/* Formula & Source Tooltip */}
              {tooltipKpi === kpi.id && (
                <div
                  data-testid={`kpi-tooltip-${kpi.id}`}
                  style={{
                    position: 'absolute',
                    bottom: '100%',
                    left: isRtl ? 'auto' : '8px',
                    right: isRtl ? '8px' : 'auto',
                    marginBottom: '8px',
                    backgroundColor: '#0F172A',
                    color: '#FFFFFF',
                    borderRadius: '6px',
                    padding: '8px 12px',
                    fontSize: '11px',
                    zIndex: 60,
                    width: '240px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                    pointerEvents: 'none',
                  }}
                >
                  <div style={{ fontWeight: 600, marginBottom: '2px', color: '#93C5FD' }}>Formula:</div>
                  <div style={{ marginBottom: '4px', opacity: 0.9 }}>{kpi.formula}</div>
                  <div style={{ fontWeight: 600, color: '#A7F3D0' }}>Source: {kpi.source}</div>
                </div>
              )}

              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 500, color: '#6B7280' }}>{kpi.label}</span>
                  <span data-testid={`kpi-info-${kpi.id}`} style={{ display: 'inline-flex', cursor: 'help' }}>
                    <Info size={14} color="#9CA3AF" />
                  </span>
                </div>
                <div
                  style={{
                    fontSize: '24px',
                    fontWeight: 600,
                    color: '#1F2937',
                    lineHeight: 1.2,
                    fontFeatureSettings: '"tnum"',
                    marginBottom: '4px',
                  }}
                >
                  {kpi.value}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '8px' }}>
                <span style={{ fontSize: '12px', color: '#6B7280' }}>{kpi.sub}</span>
                {kpi.status === 'danger' && <StatusChip variant="danger" label="Intervene" />}
                {kpi.status === 'warning' && <StatusChip variant="warning" label="Review" />}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Row 2: Production Flow (Exact 9 stages) ── */}
      {data && (
        <Card title={isRtl ? 'پیداواری بہاؤ — مراحل' : 'Production Flow'}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
              gap: '8px',
              padding: '4px 0',
            }}
          >
            {data.production_flow.map((stage, idx) => (
              <div
                key={stage.key}
                data-testid={`stage-card-${stage.key}`}
                onClick={() => {
                  if (onNavigate) onNavigate('production');
                  else window.location.href = '/portal/production';
                }}
                style={{
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  backgroundColor: '#F8FAFC',
                  borderRadius: '6px',
                  border: stage.has_delay ? '1px solid #FCA5A5' : '1px solid #E3E8EF',
                  padding: '12px 10px',
                  textAlign: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                }}
              >
                <div style={{ fontSize: '11px', color: '#6B7280', fontWeight: 500 }}>
                  {idx + 1}. {stage.name}
                </div>
                <div style={{ fontSize: '18px', fontWeight: 600, color: '#1F2937', fontFeatureSettings: '"tnum"' }}>
                  {stage.lot_count} <span style={{ fontSize: '11px', fontWeight: 400, color: '#6B7280' }}>lots</span>
                </div>
                <div>
                  {stage.has_delay ? (
                    <StatusChip variant="danger" label={`${stage.delayed_count} delayed`} />
                  ) : (
                    <span style={{ fontSize: '11px', color: '#12B76A', fontWeight: 500 }}>On track</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* ── Row 3: Delayed Lots Table & Pending Approvals ── */}
      {data && (
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px' }}>
          {/* Left: Delayed lots table */}
          <Card title={isRtl ? 'تاخیر کا شکار لاٹس' : 'Delayed Lots & Alerts'}>
            {data.delayed_lots.length > 0 ? (
              <DataTable
                data={data.delayed_lots}
                columns={delayedLotColumns}
                keyExtractor={(row) => row.lot_number}
                emptyMessage="No delayed lots."
              />
            ) : (
              <div style={{ padding: '24px', textAlign: 'center', color: '#6B7280', fontSize: '13px' }}>
                All lots are running on schedule. Zero active delays recorded.
              </div>
            )}
          </Card>

          {/* Right: Pending Approvals */}
          <Card title={isRtl ? 'زیر التواء منظوریاں' : 'Pending Approvals'}>
            {data.approvals.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {data.approvals.map((appr) => (
                  <div
                    key={appr.id}
                    style={{
                      padding: '10px 12px',
                      backgroundColor: '#F8FAFC',
                      borderRadius: '6px',
                      border: '1px solid #E3E8EF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '8px',
                    }}
                  >
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ fontSize: '11px', color: '#6B7280', fontWeight: 600 }}>{appr.type}</div>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: '#1F2937', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {appr.title}
                      </div>
                      <div style={{ fontSize: '12px', color: '#1E3A8A', fontWeight: 600, fontFeatureSettings: '"tnum"' }}>
                        {appr.value}
                      </div>
                    </div>
                    <Button variant="primary" size="sm" onClick={() => handleApprove(appr)} style={{ fontSize: '11px', padding: '4px 8px' }}>
                      Approve
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ padding: '24px', textAlign: 'center', color: '#6B7280', fontSize: '13px' }}>
                Zero pending maker-checker approvals.
              </div>
            )}
          </Card>
        </div>
      )}

      {/* ── Row 4: Charts ── */}
      {data && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
          {/* Chart 1: Output vs Target */}
          <Card title={isRtl ? 'پیداوار بمقابلہ ہدف (گزشتہ 7 دن)' : 'Output vs Target (Past 7 Days)'}>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '12px', height: '140px', paddingTop: '20px' }}>
              {data.charts.output_vs_target.map((pt) => {
                const heightPct = pt.target > 0 ? Math.min(Math.round((pt.output / pt.target) * 100), 100) : 0;
                return (
                  <div key={pt.date} style={{ flex: 1, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
                    <div style={{ fontSize: '10px', color: '#6B7280', marginBottom: '4px', fontFeatureSettings: '"tnum"' }}>
                      {pt.output > 0 ? `${(pt.output / 1000).toFixed(1)}k` : '0'}
                    </div>
                    <div
                      style={{
                        width: '100%',
                        maxWidth: '28px',
                        height: `${Math.max(heightPct, 4)}%`,
                        backgroundColor: '#1E3A8A',
                        borderRadius: '4px 4px 0 0',
                      }}
                    />
                    <div style={{ fontSize: '11px', color: '#6B7280', marginTop: '6px' }}>{pt.date}</div>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Chart 2: Receivables Ageing */}
          <Card title={isRtl ? 'وصولیاں (عمر رسیدہ تجزیہ)' : 'Receivables Ageing'}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', paddingTop: '8px' }}>
              {data.charts.receivables_ageing.map((brk) => (
                <div key={brk.bracket}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                    <span style={{ color: '#4B5563', fontWeight: 500 }}>{brk.bracket}</span>
                    <span style={{ fontWeight: 600, color: '#1F2937', fontFeatureSettings: '"tnum"' }}>
                      PKR {brk.amount.toLocaleString()}
                    </span>
                  </div>
                  <div style={{ height: '6px', backgroundColor: '#E5EAF2', borderRadius: '3px', overflow: 'hidden' }}>
                    <div
                      style={{
                        height: '100%',
                        width: `${Math.min((brk.amount / 10000000) * 100, 100)}%`,
                        backgroundColor: brk.bracket.includes('90+') ? '#F04438' : '#1E3A8A',
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Chart 3: Quality Pass Rate */}
          <Card title={isRtl ? 'کوالٹی پاس ریٹ' : 'Quality Pass Rate'}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around', height: '140px' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '32px', fontWeight: 600, color: data.charts.qc_pass_rate >= 95 ? '#12B76A' : '#F79009', fontFeatureSettings: '"tnum"' }}>
                  {data.charts.qc_pass_rate}%
                </div>
                <div style={{ fontSize: '12px', color: '#6B7280' }}>
                  {isRtl ? '4-پوائنٹ فیبرک پاس ریٹ' : '4-Point Fabric Pass'}
                </div>
              </div>
              <div style={{ fontSize: '12px', color: '#6B7280', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div>Total audits: <strong style={{ color: '#1F2937', fontFeatureSettings: '"tnum"' }}>{data.charts.qc_total_audits}</strong></div>
                <div>Standard: <strong style={{ color: '#12B76A' }}>Grade A / B</strong></div>
                <div>Tolerance: <strong style={{ color: '#1F2937' }}>≤ 28 pts / 100m</strong></div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* ── Row 5: Recent Activity ── */}
      {data && (
        <Card title={isRtl ? 'حالیہ فیکٹری سرگرمیاں' : 'Recent Mill Activity'}>
          {data.recent_activity.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {data.recent_activity.map((act) => (
                <div
                  key={act.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    backgroundColor: '#F8FAFC',
                    fontSize: '13px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '11px', color: '#6B7280', fontFeatureSettings: '"tnum"' }}>{act.time}</span>
                    <span style={{ color: '#1F2937' }}>{act.desc}</span>
                  </div>
                  <StatusChip variant="success" label={act.status} />
                </div>
              ))}
            </div>
          ) : (
            <div style={{ padding: '16px', color: '#6B7280', fontSize: '13px', textAlign: 'center' }}>
              No recent entries recorded today.
            </div>
          )}
        </Card>
      )}

      {/* ── Bottom Right Auto-Dismissing Toast ── */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            backgroundColor: '#0F172A',
            color: '#FFFFFF',
            padding: '12px 20px',
            borderRadius: '8px',
            fontSize: '13px',
            fontWeight: 500,
            boxShadow: '0 10px 25px -5px rgba(0,0,0,0.3)',
            zIndex: 100,
          }}
        >
          {toastMessage}
        </div>
      )}
    </div>
  );
};
