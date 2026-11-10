import React, { useState } from 'react';
import { ModuleWorkspace, type QuickActionItem } from '../../components/navigation/ModuleWorkspace';
import { MODULE_NAV_CONFIGS } from '../../components/navigation/moduleNavData';
import { useMillData } from '../../context/MillDataContext';
import { ReportsView } from '../../components/ReportsView';
import { FormatBuilderView } from '../../components/printing/FormatBuilderView';
import { useAuth } from '../../context/AuthContext';
import {
  ProductionTrendChart,
  ShiftPerformanceBars,
  QualityDefectTrendChart,
  FinancialRevenueTrendChart
} from '../../components/MillCharts';
import {
  Download,
  Printer
} from 'lucide-react';

interface ReportsWorkspaceViewProps {
  initialTab?: string;
}

export const ReportsWorkspaceView: React.FC<ReportsWorkspaceViewProps> = ({
  initialTab = 'rep-overview'
}) => {
  const { showToast } = useMillData();
  const { user } = useAuth();
  const repNav = MODULE_NAV_CONFIGS.find((m) => m.module === 'reports')!;
  const [activeTab, setActiveTab] = useState(initialTab);
  const [activeSubPage, setActiveSubPage] = useState<string | undefined>();

  const handleExport = (reportName: string) => {
    showToast('Report Exported', `${reportName} generated and exported to PDF successfully.`);
  };

  const quickActions: QuickActionItem[] = [
    {
      id: 'dl-morning-pack',
      label: 'Download Daily Pack',
      primary: true,
      onClick: () => handleExport('Daily Morning Pack')
    },
    {
      id: 'open-designer',
      label: 'Report Designer',
      onClick: () => setActiveTab('rep-designer')
    }
  ];

  return (
    <ModuleWorkspace
      moduleKey="reports"
      moduleTitle="Reports"
      moduleSubtitle="Enterprise Analytics & Format Builder"
      moduleIconName="BarChart3"
      tabs={repNav.tabs}
      activeTabId={activeTab}
      onTabChange={(tabId, subId) => {
        setActiveTab(tabId);
        setActiveSubPage(subId);
      }}
      activeSubPageId={activeSubPage}
      quickActions={quickActions}
      userRole={user?.role || 'owner'}
      breadcrumbs={['Reports OS', repNav.tabs.find((t) => t.id === activeTab)?.label || 'Overview']}
    >
      {/* 1. OVERVIEW */}
      {activeTab === 'rep-overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Quick Pack Download Bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#ffffff', padding: '16px 20px', borderRadius: 8, border: '1px solid #e2e8f0' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: '#0f172a' }}>Daily Executive Operational Telemetry</h3>
              <p style={{ margin: '2px 0 0', fontSize: 13, color: '#64748b' }}>Consolidated daily metrics for Lahore Fashion Mill management</p>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => handleExport('Daily Morning Pack')}
                style={{ padding: '7px 14px', borderRadius: 6, background: '#2563eb', color: '#ffffff', border: 'none', fontSize: 13, fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
              >
                <Download size={15} /> Download Morning Pack (PDF)
              </button>
            </div>
          </div>

          <ReportsView />
        </div>
      )}

      {/* 2. PRODUCTION REPORTS */}
      {activeTab === 'rep-production' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ background: '#ffffff', padding: '16px 20px', borderRadius: 8, border: '1px solid #e2e8f0' }}>
            <h3 style={{ margin: '0 0 4px', fontSize: 15, fontWeight: 600 }}>Production & Uptime Analytics</h3>
            <p style={{ margin: 0, fontSize: 13, color: '#64748b' }}>Daily loom efficiency, stage WIP meters, and bottleneck analysis</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div style={{ background: '#ffffff', padding: 20, borderRadius: 8, border: '1px solid #e2e8f0' }}>
              <h4 style={{ margin: '0 0 16px', fontSize: 14, color: '#0f172a' }}>Output Trend vs Target</h4>
              <ProductionTrendChart />
            </div>
            <div style={{ background: '#ffffff', padding: 20, borderRadius: 8, border: '1px solid #e2e8f0' }}>
              <h4 style={{ margin: '0 0 16px', fontSize: 14, color: '#0f172a' }}>Shift Output Comparison</h4>
              <ShiftPerformanceBars />
            </div>
          </div>
        </div>
      )}

      {/* 3. QUALITY REPORTS */}
      {activeTab === 'rep-quality' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ background: '#ffffff', padding: '16px 20px', borderRadius: 8, border: '1px solid #e2e8f0' }}>
            <h3 style={{ margin: '0 0 4px', fontSize: 15, fontWeight: 600 }}>Quality & 4-Point Audit Defects</h3>
            <p style={{ margin: 0, fontSize: 13, color: '#64748b' }}>Defect categorization: Weft bars, oil stains, yarn slubs, and color shading</p>
          </div>
          <div style={{ background: '#ffffff', padding: 20, borderRadius: 8, border: '1px solid #e2e8f0' }}>
            <QualityDefectTrendChart />
          </div>
        </div>
      )}

      {/* 4. STOCK REPORTS */}
      {activeTab === 'rep-stock' && (
        <div style={{ background: '#ffffff', padding: 20, borderRadius: 8, border: '1px solid #e2e8f0' }}>
          <h3 style={{ margin: '0 0 12px', fontSize: 15, fontWeight: 600 }}>Inventory Valuation & Aging Report</h3>
          <p style={{ margin: '0 0 16px', fontSize: 13, color: '#64748b' }}>Raw yarn bags, reactive chemical drums, and finished gray/dyed rolls</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
            <div style={{ padding: 14, background: '#f8fafc', borderRadius: 6 }}>
              <div style={{ fontSize: 12, color: '#64748b' }}>Raw Yarn Bags (Godown)</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#0f172a', marginTop: 4 }}>PKR 18.4M</div>
            </div>
            <div style={{ padding: 14, background: '#f8fafc', borderRadius: 6 }}>
              <div style={{ fontSize: 12, color: '#64748b' }}>Dyes & Auxiliaries Store</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#0f172a', marginTop: 4 }}>PKR 6.8M</div>
            </div>
            <div style={{ padding: 14, background: '#f8fafc', borderRadius: 6 }}>
              <div style={{ fontSize: 12, color: '#64748b' }}>Finished Goods Warehouse</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#0f172a', marginTop: 4 }}>PKR 14.2M</div>
            </div>
          </div>
        </div>
      )}

      {/* 5. HR & PAYROLL REPORTS */}
      {activeTab === 'rep-hr' && (
        <div style={{ background: '#ffffff', padding: 20, borderRadius: 8, border: '1px solid #e2e8f0' }}>
          <h3 style={{ margin: '0 0 12px', fontSize: 15, fontWeight: 600 }}>HR, Attendance & Labor Cost Reports</h3>
          <p style={{ margin: '0 0 16px', fontSize: 13, color: '#64748b' }}>Biometric punctuality, shift absenteeism, overtime hours, and piece-rate earnings</p>
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={() => handleExport('Monthly Wages Sheet')}
              style={{ padding: '7px 14px', borderRadius: 6, background: '#2563eb', color: '#fff', border: 'none', fontSize: 13, cursor: 'pointer' }}
            >
              Export Monthly Wages Sheet
            </button>
            <button
              onClick={() => handleExport('Attendance Muster Roll')}
              style={{ padding: '7px 14px', borderRadius: 6, border: '1px solid #cbd5e1', background: '#fff', fontSize: 13, cursor: 'pointer' }}
            >
              Export Muster Roll
            </button>
          </div>
        </div>
      )}

      {/* 6. FINANCE REPORTS */}
      {activeTab === 'rep-finance' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ background: '#ffffff', padding: '16px 20px', borderRadius: 8, border: '1px solid #e2e8f0' }}>
            <h3 style={{ margin: '0 0 4px', fontSize: 15, fontWeight: 600 }}>Revenue & Financial Margins</h3>
            <p style={{ margin: 0, fontSize: 13, color: '#64748b' }}>Monthly billings, collections, and operating margin analytics</p>
          </div>
          <div style={{ background: '#ffffff', padding: 20, borderRadius: 8, border: '1px solid #e2e8f0' }}>
            <FinancialRevenueTrendChart />
          </div>
        </div>
      )}

      {/* 7. MANAGEMENT DAILY PACK */}
      {activeTab === 'rep-management' && (
        <div style={{ background: '#ffffff', padding: 24, borderRadius: 8, border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
            <div>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Lahore Fashion Mill — Daily Morning Pack (8:00 AM)</h3>
              <p style={{ margin: '4px 0 0', fontSize: 13, color: '#64748b' }}>One-page executive briefing prepared for the Mill Owner and Plant Director</p>
            </div>
            <button
              onClick={() => window.print()}
              style={{ padding: '7px 16px', borderRadius: 6, background: '#2563eb', color: '#fff', border: 'none', fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <Printer size={15} /> Print Daily Pack
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 20 }}>
            <div style={{ padding: 14, background: '#f8fafc', borderRadius: 6, border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: 12, color: '#64748b' }}>Yesterday's Output</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#0f172a', marginTop: 4 }}>48,200 m</div>
              <div style={{ fontSize: 11, color: '#16a34a', marginTop: 2 }}>94% of daily target</div>
            </div>
            <div style={{ padding: 14, background: '#f8fafc', borderRadius: 6, border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: 12, color: '#64748b' }}>Looms Active</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#0f172a', marginTop: 4 }}>46 / 48</div>
              <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>2 looms under PM</div>
            </div>
            <div style={{ padding: 14, background: '#f8fafc', borderRadius: 6, border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: 12, color: '#64748b' }}>Daily Recoveries</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#0f172a', marginTop: 4 }}>PKR 3,250,000</div>
              <div style={{ fontSize: 11, color: '#16a34a', marginTop: 2 }}>From 2 key buyers</div>
            </div>
            <div style={{ padding: 14, background: '#f8fafc', borderRadius: 6, border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: 12, color: '#64748b' }}>Quality Pass Rate</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#16a34a', marginTop: 4 }}>98.2%</div>
              <div style={{ fontSize: 11, color: '#16a34a', marginTop: 2 }}>Zero critical rejections</div>
            </div>
          </div>
        </div>
      )}

      {/* 8. REPORT DESIGNER (FORMAT BUILDER) */}
      {activeTab === 'rep-designer' && (
        <div style={{ background: '#ffffff', borderRadius: 8, border: '1px solid #e2e8f0', padding: 20 }}>
          <FormatBuilderView onBack={() => setActiveTab('rep-overview')} />
        </div>
      )}

      {/* 9. SCHEDULED & HISTORY */}
      {activeTab === 'rep-scheduled' && (
        <div style={{ background: '#ffffff', padding: 20, borderRadius: 8, border: '1px solid #e2e8f0' }}>
          <h3 style={{ margin: '0 0 12px', fontSize: 15, fontWeight: 600 }}>Scheduled Dispatches & Generation Logs</h3>
          <p style={{ margin: '0 0 16px', fontSize: 13, color: '#64748b' }}>Automated email & WhatsApp dispatches for management reports</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { name: 'Daily Production & Efficiency Telemetry', time: 'Every day at 07:30 AM', recipients: 'Owner, Plant GM', status: 'Active' },
              { name: 'Weekly AR Overdue & Recovery Digest', time: 'Every Monday at 09:00 AM', recipients: 'Finance Controller, Owner', status: 'Active' },
              { name: 'Monthly Tax Annex-C Reconciliation', time: '10th of every month', recipients: 'Tax Manager', status: 'Active' },
            ].map((s, idx) => (
              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: '#f8fafc', borderRadius: 6, border: '1px solid #e2e8f0' }}>
                <div>
                  <div style={{ fontWeight: 600, color: '#0f172a', fontSize: 13 }}>{s.name}</div>
                  <div style={{ fontSize: 12, color: '#64748b' }}>{s.time} — Sent to: {s.recipients}</div>
                </div>
                <span style={{ fontSize: 11, fontWeight: 600, color: '#166534', background: '#dcfce7', padding: '3px 8px', borderRadius: 10 }}>
                  {s.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </ModuleWorkspace>
  );
};
