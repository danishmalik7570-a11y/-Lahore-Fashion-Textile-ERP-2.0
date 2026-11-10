import React, { useState } from 'react';
import { ModuleWorkspace, type QuickActionItem } from '../../components/navigation/ModuleWorkspace';
import { MODULE_NAV_CONFIGS } from '../../components/navigation/moduleNavData';
import { QualityView } from '../../components/QualityView';
import { useMillData } from '../../context/MillDataContext';
import { useAuth } from '../../context/AuthContext';

interface QualityWorkspaceViewProps {
  initialTab?: string;
}

export const QualityWorkspaceView: React.FC<QualityWorkspaceViewProps> = ({
  initialTab = 'qc-overview',
}) => {
  const { user } = useAuth();
  const { qcAudits } = useMillData();
  const qcNav = MODULE_NAV_CONFIGS.find((m) => m.module === 'quality')!;
  const [activeTabId, setActiveTabId] = useState(initialTab);
  const [activeSubPageId, setActiveSubPageId] = useState<string | undefined>(undefined);

  const passedCount = qcAudits.filter((a) => a.result.includes('Pass')).length;
  const passRate = Math.round((passedCount / (qcAudits.length || 1)) * 100);

  const handleTabChange = (tabId: string, subPageId?: string) => {
    setActiveTabId(tabId);
    setActiveSubPageId(subPageId);
  };

  const quickActions: QuickActionItem[] = [
    {
      id: 'act-new-audit',
      label: '+ New 4-Point Audit',
      primary: true,
      onClick: () => setActiveTabId('qc-inspections'),
    },
    {
      id: 'act-spectro',
      label: 'Spectro Lab Test',
      onClick: () => setActiveTabId('qc-lab-tests'),
    },
    {
      id: 'act-capa',
      label: 'Issue CAPA',
      onClick: () => setActiveTabId('qc-capa'),
    },
  ];

  const renderTabContent = () => {
    switch (activeTabId) {
      case 'qc-overview':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* KPI Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '14px' }}>
              <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '16px' }}>
                <div style={{ fontSize: '12px', color: '#64748B', fontWeight: 600 }}>Quality Pass Rate</div>
                <div style={{ fontSize: '24px', fontWeight: 700, color: '#16A34A', margin: '4px 0 2px 0' }}>
                  {passRate}%
                </div>
                <div style={{ fontSize: '11px', color: '#16A34A' }}>ASTM D5430 4-Point standard</div>
              </div>

              <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '16px' }}>
                <div style={{ fontSize: '12px', color: '#64748B', fontWeight: 600 }}>Total Roll Audits</div>
                <div style={{ fontSize: '24px', fontWeight: 700, color: '#0F172A', margin: '4px 0 2px 0' }}>
                  {qcAudits.length}
                </div>
                <div style={{ fontSize: '11px', color: '#475569' }}>Grey & Dyed Fabric inspected</div>
              </div>

              <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '16px' }}>
                <div style={{ fontSize: '12px', color: '#64748B', fontWeight: 600 }}>Avg Defect Points/100m</div>
                <div style={{ fontSize: '24px', fontWeight: 700, color: '#2563EB', margin: '4px 0 2px 0' }}>
                  12.4
                </div>
                <div style={{ fontSize: '11px', color: '#2563EB' }}>Grade A threshold &lt; 15 pts</div>
              </div>

              <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '16px' }}>
                <div style={{ fontSize: '12px', color: '#64748B', fontWeight: 600 }}>Open CAPA Actions</div>
                <div style={{ fontSize: '24px', fontWeight: 700, color: '#D97706', margin: '4px 0 2px 0' }}>
                  2 Open
                </div>
                <div style={{ fontSize: '11px', color: '#D97706' }}>Root cause investigation</div>
              </div>

              <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '16px' }}>
                <div style={{ fontSize: '12px', color: '#64748B', fontWeight: 600 }}>Lab TAT (Turnaround)</div>
                <div style={{ fontSize: '24px', fontWeight: 700, color: '#0F172A', margin: '4px 0 2px 0' }}>
                  2.4 Hours
                </div>
                <div style={{ fontSize: '11px', color: '#16A34A' }}>Color fastness & Delta E</div>
              </div>
            </div>

            {/* Embedded Quality Auditor */}
            <QualityView />
          </div>
        );

      case 'qc-inspections':
      case 'qc-lab-tests':
      case 'qc-defects':
      case 'qc-checklists':
      case 'qc-capa':
      case 'qc-claims':
      case 'qc-supplier':
      case 'qc-reports':
      default:
        return <QualityView />;
    }
  };

  return (
    <ModuleWorkspace
      moduleKey="quality"
      moduleTitle="Quality"
      moduleSubtitle="Testing, 4-Point Audits & CAPA Resolution"
      moduleIconName="ShieldCheck"
      tabs={qcNav.tabs}
      activeTabId={activeTabId}
      onTabChange={handleTabChange}
      activeSubPageId={activeSubPageId}
      quickActions={quickActions}
      userRole={user?.role || 'owner'}
      breadcrumbs={['Quality OS', qcNav.tabs.find((t) => t.id === activeTabId)?.label || 'Overview']}
    >
      {renderTabContent()}
    </ModuleWorkspace>
  );
};
