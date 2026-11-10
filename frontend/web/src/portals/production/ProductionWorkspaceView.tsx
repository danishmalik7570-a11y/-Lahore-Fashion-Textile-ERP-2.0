import React, { useState } from 'react';
import { ModuleWorkspace, type QuickActionItem } from '../../components/navigation/ModuleWorkspace';
import { MODULE_NAV_CONFIGS } from '../../components/navigation/moduleNavData';
import { ProductionView } from '../../components/ProductionView';
import { FloorManagementView } from '../../components/FloorManagementView';
import { useMillData } from '../../context/MillDataContext';
import { useAuth } from '../../context/AuthContext';
import {
  QrCode,
} from 'lucide-react';

interface ProductionWorkspaceViewProps {
  initialTab?: string;
  onNavigateToKiosk?: () => void;
}

export const ProductionWorkspaceView: React.FC<ProductionWorkspaceViewProps> = ({
  initialTab = 'prod-overview',
  onNavigateToKiosk,
}) => {
  const { user } = useAuth();
  const { lots } = useMillData();
  const prodNav = MODULE_NAV_CONFIGS.find((m) => m.module === 'production')!;
  const [activeTabId, setActiveTabId] = useState(initialTab);
  const [activeSubPageId, setActiveSubPageId] = useState<string | undefined>('dye-batches');

  const delayedLots = lots.filter((l) => l.status === 'Bottleneck');
  const avgEfficiency = Math.round(lots.reduce((acc, l) => acc + l.efficiencyPercent, 0) / (lots.length || 1));

  const handleTabChange = (tabId: string, subPageId?: string) => {
    setActiveTabId(tabId);
    if (subPageId) {
      setActiveSubPageId(subPageId);
    } else {
      const tab = prodNav.tabs.find((t) => t.id === tabId);
      if (tab?.sub_pages && tab.sub_pages.length > 0) {
        setActiveSubPageId(tab.sub_pages[0].id);
      } else {
        setActiveSubPageId(undefined);
      }
    }
  };

  const quickActions: QuickActionItem[] = [
    {
      id: 'act-new-lot',
      label: '+ Create Lot',
      primary: true,
      onClick: () => setActiveTabId('prod-lots'),
    },
    {
      id: 'act-floor-entry',
      label: 'Floor Data Entry',
      onClick: () => setActiveTabId('prod-floor-entry'),
    },
    {
      id: 'act-planning',
      label: 'Planning Board',
      onClick: () => setActiveTabId('prod-planning'),
    },
  ];

  const renderTabContent = () => {
    switch (activeTabId) {
      case 'prod-overview':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* 6 KPI Cards Strip */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '12px' }}>
              <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '14px' }}>
                <div style={{ fontSize: '11px', color: '#64748B', fontWeight: 600 }}>Active WIP Lots</div>
                <div style={{ fontSize: '22px', fontWeight: 700, color: '#0F172A', margin: '4px 0 2px 0' }}>
                  {lots.length}
                </div>
                <div style={{ fontSize: '11px', color: '#16A34A' }}>Across 9 stages</div>
              </div>

              <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '14px' }}>
                <div style={{ fontSize: '11px', color: '#64748B', fontWeight: 600 }}>Output vs Target</div>
                <div style={{ fontSize: '22px', fontWeight: 700, color: '#0F172A', margin: '4px 0 2px 0' }}>
                  94.2%
                </div>
                <div style={{ fontSize: '11px', color: '#2563EB' }}>Target: 42,000 m/day</div>
              </div>

              <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '14px' }}>
                <div style={{ fontSize: '11px', color: '#64748B', fontWeight: 600 }}>Delayed Lots</div>
                <div style={{ fontSize: '22px', fontWeight: 700, color: delayedLots.length > 0 ? '#DC2626' : '#16A34A', margin: '4px 0 2px 0' }}>
                  {delayedLots.length}
                </div>
                <div style={{ fontSize: '11px', color: '#DC2626' }}>Exceeding stage SLA</div>
              </div>

              <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '14px' }}>
                <div style={{ fontSize: '11px', color: '#64748B', fontWeight: 600 }}>OEE / Efficiency</div>
                <div style={{ fontSize: '22px', fontWeight: 700, color: '#0F172A', margin: '4px 0 2px 0' }}>
                  {avgEfficiency || 88}%
                </div>
                <div style={{ fontSize: '11px', color: '#16A34A' }}>World-class target &gt;85%</div>
              </div>

              <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '14px' }}>
                <div style={{ fontSize: '11px', color: '#64748B', fontWeight: 600 }}>Wastage Rate</div>
                <div style={{ fontSize: '22px', fontWeight: 700, color: '#0F172A', margin: '4px 0 2px 0' }}>
                  1.6%
                </div>
                <div style={{ fontSize: '11px', color: '#16A34A' }}>Below 2.5% threshold</div>
              </div>

              <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '14px' }}>
                <div style={{ fontSize: '11px', color: '#64748B', fontWeight: 600 }}>Looms Running</div>
                <div style={{ fontSize: '22px', fontWeight: 700, color: '#0F172A', margin: '4px 0 2px 0' }}>
                  68 / 72
                </div>
                <div style={{ fontSize: '11px', color: '#475569' }}>4 in planned maintenance</div>
              </div>
            </div>

            {/* Mill Flow WIP Strip across 9 Stages */}
            <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '20px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#0F172A', margin: '0 0 16px 0' }}>
                Mill Flow WIP Strip — Live Stage Telemetry
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(9, 1fr)', gap: '8px' }}>
                {[
                  { name: 'Yarn Store', count: '4 Lots', delay: 0 },
                  { name: 'Weaving', count: '9 Lots', delay: 1 },
                  { name: 'Knitting', count: '3 Lots', delay: 0 },
                  { name: 'Grey Store', count: '5 Lots', delay: 0 },
                  { name: 'Dyeing', count: '7 Lots', delay: 2 },
                  { name: 'Printing', count: '4 Lots', delay: 0 },
                  { name: 'Cutting', count: '5 Lots', delay: 0 },
                  { name: 'Stitching', count: '8 Lots', delay: 1 },
                  { name: 'Packing', count: '3 Lots', delay: 0 },
                ].map((stg, i) => (
                  <div
                    key={i}
                    onClick={() => setActiveTabId(stg.name.toLowerCase().replace(' ', '-'))}
                    style={{
                      padding: '12px 8px',
                      borderRadius: '6px',
                      backgroundColor: '#F8FAFC',
                      border: '1px solid #E2E8F0',
                      textAlign: 'center',
                      cursor: 'pointer',
                      transition: 'border-color 0.15s ease',
                    }}
                  >
                    <div style={{ fontSize: '12px', fontWeight: 600, color: '#0F172A' }}>{stg.name}</div>
                    <div style={{ fontSize: '15px', fontWeight: 700, color: '#2563EB', margin: '4px 0' }}>{stg.count}</div>
                    {stg.delay > 0 ? (
                      <span style={{ fontSize: '10px', color: '#DC2626', backgroundColor: '#FEF2F2', padding: '1px 5px', borderRadius: '4px', fontWeight: 600 }}>
                        {stg.delay} Delayed
                      </span>
                    ) : (
                      <span style={{ fontSize: '10px', color: '#16A34A', backgroundColor: '#F0FDF4', padding: '1px 5px', borderRadius: '4px', fontWeight: 600 }}>
                        On Schedule
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Embed Main Production Board View */}
            <ProductionView />
          </div>
        );

      case 'prod-lots':
      case 'prod-planning':
      case 'prod-alerts':
      case 'prod-traceability':
      case 'prod-reports':
        return <ProductionView />;

      case 'prod-floor-entry':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 4px 0', color: '#0F172A' }}>
                  Shop-Floor Data Entry & Approvals
                </h2>
                <p style={{ margin: 0, fontSize: '13px', color: '#64748B' }}>
                  Professional light entry mode for shift supervisors, operators, and late reconciliation.
                </p>
              </div>
              {onNavigateToKiosk && (
                <button
                  onClick={onNavigateToKiosk}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '6px',
                    backgroundColor: '#0F172A',
                    color: '#FFFFFF',
                    border: 'none',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <QrCode size={15} /> Launch Kiosk Terminal Mode
                </button>
              )}
            </div>
            <FloorManagementView onLaunchKiosk={onNavigateToKiosk || (() => {})} />
          </div>
        );

      // Department Sub-workspaces (Dyeing, Stitching, Weaving, etc.)
      case 'prod-weaving':
      case 'prod-dyeing':
      case 'prod-stitching':
      case 'prod-yarn-store':
      case 'prod-knitting':
      case 'prod-grey-store':
      case 'prod-printing':
      case 'prod-cutting':
      case 'prod-packing':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 4px 0', color: '#0F172A', textTransform: 'capitalize' }}>
                  {activeTabId.replace('prod-', '').replace('-', ' ')} Department Workspace
                </h2>
                <p style={{ margin: 0, fontSize: '13px', color: '#64748B' }}>
                  Job cards, shift entries, machine allocations, and stage quality control.
                </p>
              </div>
              <button
                onClick={() => alert(`New Job Card for ${activeTabId}`)}
                style={{
                  padding: '8px 14px',
                  borderRadius: '6px',
                  backgroundColor: '#0F172A',
                  color: '#FFFFFF',
                  border: 'none',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                + Issue Job Card
              </button>
            </div>

            <ProductionView />
          </div>
        );

      default:
        return <ProductionView />;
    }
  };

  return (
    <ModuleWorkspace
      moduleKey="production"
      moduleTitle="Production"
      moduleSubtitle="Shop Floor & Department Manufacturing Execution"
      moduleIconName="Factory"
      tabs={prodNav.tabs}
      activeTabId={activeTabId}
      onTabChange={handleTabChange}
      activeSubPageId={activeSubPageId}
      quickActions={quickActions}
      userRole={user?.role || 'owner'}
      breadcrumbs={['Production OS', prodNav.tabs.find((t) => t.id === activeTabId)?.label || 'Overview']}
    >
      {renderTabContent()}
    </ModuleWorkspace>
  );
};
