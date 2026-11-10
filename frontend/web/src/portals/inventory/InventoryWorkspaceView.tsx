import React, { useState } from 'react';
import { ModuleWorkspace, type QuickActionItem } from '../../components/navigation/ModuleWorkspace';
import { MODULE_NAV_CONFIGS } from '../../components/navigation/moduleNavData';
import { InventoryView } from '../../components/InventoryView';
import { useMillData } from '../../context/MillDataContext';
import { useAuth } from '../../context/AuthContext';

interface InventoryWorkspaceViewProps {
  initialTab?: string;
}

export const InventoryWorkspaceView: React.FC<InventoryWorkspaceViewProps> = ({
  initialTab = 'inv-overview',
}) => {
  const { user } = useAuth();
  const { inventory } = useMillData();
  const invNav = MODULE_NAV_CONFIGS.find((m) => m.module === 'inventory')!;
  const [activeTabId, setActiveTabId] = useState(initialTab);
  const [activeSubPageId, setActiveSubPageId] = useState<string | undefined>(undefined);

  const totalStockValuation = inventory.reduce((sum, item) => sum + item.currentStock * item.unitCostPKR, 0);
  const lowStockCount = inventory.filter((item) => item.currentStock <= item.reorderLevel).length;

  const handleTabChange = (tabId: string, subPageId?: string) => {
    setActiveTabId(tabId);
    setActiveSubPageId(subPageId);
  };

  const quickActions: QuickActionItem[] = [
    {
      id: 'act-add-stock',
      label: '+ Receive GRN',
      primary: true,
      onClick: () => setActiveTabId('inv-grn'),
    },
    {
      id: 'act-gin-issue',
      label: 'Issue GIN',
      onClick: () => setActiveTabId('inv-issues'),
    },
    {
      id: 'act-stock-count',
      label: 'Stock Count',
      onClick: () => setActiveTabId('inv-count'),
    },
  ];

  const renderTabContent = () => {
    switch (activeTabId) {
      case 'inv-overview':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* KPI Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '14px' }}>
              <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '16px' }}>
                <div style={{ fontSize: '12px', color: '#64748B', fontWeight: 600 }}>Total Stock Valuation</div>
                <div style={{ fontSize: '24px', fontWeight: 700, color: '#0F172A', margin: '4px 0 2px 0' }}>
                  PKR {(totalStockValuation / 1_000_000).toFixed(2)}M
                </div>
                <div style={{ fontSize: '11px', color: '#16A34A' }}>Weighted average valuation</div>
              </div>

              <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '16px' }}>
                <div style={{ fontSize: '12px', color: '#64748B', fontWeight: 600 }}>Below Minimum Stock</div>
                <div style={{ fontSize: '24px', fontWeight: 700, color: lowStockCount > 0 ? '#DC2626' : '#16A34A', margin: '4px 0 2px 0' }}>
                  {lowStockCount} Items
                </div>
                <div style={{ fontSize: '11px', color: lowStockCount > 0 ? '#DC2626' : '#16A34A' }}>
                  {lowStockCount > 0 ? 'Reorder indents required' : 'Optimal buffer'}
                </div>
              </div>

              <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '16px' }}>
                <div style={{ fontSize: '12px', color: '#64748B', fontWeight: 600 }}>Pending GRN Receipts</div>
                <div style={{ fontSize: '24px', fontWeight: 700, color: '#2563EB', margin: '4px 0 2px 0' }}>
                  3 POs
                </div>
                <div style={{ fontSize: '11px', color: '#2563EB' }}>Weighbridge verification ready</div>
              </div>

              <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '16px' }}>
                <div style={{ fontSize: '12px', color: '#64748B', fontWeight: 600 }}>Total SKUs / Items</div>
                <div style={{ fontSize: '24px', fontWeight: 700, color: '#0F172A', margin: '4px 0 2px 0' }}>
                  {inventory.length}
                </div>
                <div style={{ fontSize: '11px', color: '#475569' }}>Yarn, Grey, Dyes & Accessories</div>
              </div>

              <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '16px' }}>
                <div style={{ fontSize: '12px', color: '#64748B', fontWeight: 600 }}>Stock Accuracy Rate</div>
                <div style={{ fontSize: '24px', fontWeight: 700, color: '#16A34A', margin: '4px 0 2px 0' }}>
                  99.4%
                </div>
                <div style={{ fontSize: '11px', color: '#16A34A' }}>Post-audit physical match</div>
              </div>
            </div>

            {/* Embedded Stock Manager */}
            <InventoryView />
          </div>
        );

      case 'inv-stock':
      case 'inv-items':
      case 'inv-purchase':
      case 'inv-grn':
      case 'inv-issues':
      case 'inv-transfers':
      case 'inv-count':
      case 'inv-labels':
      case 'inv-valuation':
      default:
        return <InventoryView />;
    }
  };

  return (
    <ModuleWorkspace
      moduleKey="inventory"
      moduleTitle="Inventory"
      moduleSubtitle="Stock, Warehousing & Material Procurement"
      moduleIconName="Boxes"
      tabs={invNav.tabs}
      activeTabId={activeTabId}
      onTabChange={handleTabChange}
      activeSubPageId={activeSubPageId}
      quickActions={quickActions}
      userRole={user?.role || 'owner'}
      breadcrumbs={['Inventory OS', invNav.tabs.find((t) => t.id === activeTabId)?.label || 'Overview']}
    >
      {renderTabContent()}
    </ModuleWorkspace>
  );
};
