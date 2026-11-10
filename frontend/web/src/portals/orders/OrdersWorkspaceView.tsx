import React, { useState } from 'react';
import { ModuleWorkspace, type QuickActionItem } from '../../components/navigation/ModuleWorkspace';
import { MODULE_NAV_CONFIGS } from '../../components/navigation/moduleNavData';
import { OrdersView } from '../../components/OrdersView';
import { ClientsView } from '../../components/ClientsView';
import { useMillData } from '../../context/MillDataContext';
import { useAuth } from '../../context/AuthContext';

interface OrdersWorkspaceViewProps {
  initialTab?: string;
  onNavigateToClients?: () => void;
}

export const OrdersWorkspaceView: React.FC<OrdersWorkspaceViewProps> = ({
  initialTab = 'orders-overview',
}) => {
  const { user } = useAuth();
  const { orders, clients } = useMillData();
  const ordersNav = MODULE_NAV_CONFIGS.find((m) => m.module === 'orders')!;
  const [activeTabId, setActiveTabId] = useState(initialTab);
  const [activeSubPageId, setActiveSubPageId] = useState<string | undefined>(undefined);

  const totalMetres = orders.reduce((sum, o) => sum + o.quantityMetres, 0);
  const totalValue = orders.reduce((sum, o) => sum + o.totalAmountPKR, 0);
  const activeOrdersCount = orders.filter((o) => o.status !== 'Delivered').length;
  const delayedOrdersCount = orders.filter((o) => o.status === 'Dyeing').length;

  const handleTabChange = (tabId: string, subPageId?: string) => {
    setActiveTabId(tabId);
    setActiveSubPageId(subPageId);
  };

  const quickActions: QuickActionItem[] = [
    {
      id: 'act-new-order',
      label: '+ New Order',
      primary: true,
      onClick: () => setActiveTabId('orders-all'),
    },
    {
      id: 'act-quotation',
      label: 'New Quotation',
      onClick: () => setActiveTabId('orders-quotations'),
    },
    {
      id: 'act-bom',
      label: 'Calculate Yarn BOM',
      onClick: () => setActiveTabId('orders-bom'),
    },
  ];

  const renderTabContent = () => {
    switch (activeTabId) {
      case 'orders-overview':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* KPI Cards Strip */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '14px' }}>
              <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '16px' }}>
                <div style={{ fontSize: '12px', color: '#64748B', fontWeight: 600 }}>Active Booked Orders</div>
                <div style={{ fontSize: '24px', fontWeight: 700, color: '#0F172A', margin: '4px 0 2px 0' }}>
                  {activeOrdersCount}
                </div>
                <div style={{ fontSize: '11px', color: '#16A34A', fontWeight: 500 }}>{orders.length} total orders recorded</div>
              </div>

              <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '16px' }}>
                <div style={{ fontSize: '12px', color: '#64748B', fontWeight: 600 }}>Total Order Value</div>
                <div style={{ fontSize: '24px', fontWeight: 700, color: '#0F172A', margin: '4px 0 2px 0' }}>
                  PKR {(totalValue / 1_000_000).toFixed(1)}M
                </div>
                <div style={{ fontSize: '11px', color: '#475569' }}>Realized across buyers</div>
              </div>

              <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '16px' }}>
                <div style={{ fontSize: '12px', color: '#64748B', fontWeight: 600 }}>Fabric Quantity Booked</div>
                <div style={{ fontSize: '24px', fontWeight: 700, color: '#0F172A', margin: '4px 0 2px 0' }}>
                  {(totalMetres / 1_000).toFixed(0)}k <span style={{ fontSize: '14px', fontWeight: 500 }}>Metres</span>
                </div>
                <div style={{ fontSize: '11px', color: '#475569' }}>Warp/Weft programmed</div>
              </div>

              <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '16px' }}>
                <div style={{ fontSize: '12px', color: '#64748B', fontWeight: 600 }}>Due This Week</div>
                <div style={{ fontSize: '24px', fontWeight: 700, color: '#2563EB', margin: '4px 0 2px 0' }}>
                  4 Orders
                </div>
                <div style={{ fontSize: '11px', color: '#2563EB' }}>Target dispatch Nov 06</div>
              </div>

              <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '16px' }}>
                <div style={{ fontSize: '12px', color: '#64748B', fontWeight: 600 }}>Delayed Orders</div>
                <div style={{ fontSize: '24px', fontWeight: 700, color: delayedOrdersCount > 0 ? '#DC2626' : '#16A34A', margin: '4px 0 2px 0' }}>
                  {delayedOrdersCount}
                </div>
                <div style={{ fontSize: '11px', color: delayedOrdersCount > 0 ? '#DC2626' : '#16A34A' }}>
                  {delayedOrdersCount > 0 ? 'Expedite dye lot' : '100% On-Time'}
                </div>
              </div>
            </div>

            {/* Pipeline Funnel & Top Buyers */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px' }}>
              <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '20px' }}>
                <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#0F172A', margin: '0 0 16px 0' }}>
                  Order Pipeline Funnel & Stage Progression
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {[
                    { stage: 'Confirmed & BOM Released', count: '12 Orders', percent: '100%', color: '#2563EB' },
                    { stage: 'Yarn Issued / Weaving', count: '9 Orders', percent: '75%', color: '#0284C7' },
                    { stage: 'Dyeing & Finishing', count: '6 Orders', percent: '50%', color: '#0D9488' },
                    { stage: 'Inspection & Packing', count: '4 Orders', percent: '33%', color: '#F59E0B' },
                    { stage: 'Ready for Dispatch', count: '3 Orders', percent: '25%', color: '#16A34A' },
                  ].map((p, idx) => (
                    <div key={idx}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '4px' }}>
                        <span style={{ fontWeight: 600, color: '#334155' }}>{p.stage}</span>
                        <span style={{ color: '#64748B', fontWeight: 500 }}>{p.count}</span>
                      </div>
                      <div style={{ height: '8px', backgroundColor: '#F1F5F9', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ width: p.percent, height: '100%', backgroundColor: p.color, borderRadius: '4px' }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Top Buyers */}
              <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '20px' }}>
                <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#0F172A', margin: '0 0 14px 0' }}>
                  Top Textile Buyers (Volume)
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {clients.slice(0, 5).map((c, i) => (
                    <div
                      key={c.id || i}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '8px 10px',
                        backgroundColor: '#F8FAFC',
                        borderRadius: '6px',
                        fontSize: '13px',
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 600, color: '#0F172A' }}>{c.name}</div>
                        <div style={{ fontSize: '11px', color: '#64748B' }}>{c.city}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: 700, color: '#2563EB' }}>PKR {(c.creditLimitPKR / 1_000_000).toFixed(1)}M</div>
                        <div style={{ fontSize: '11px', color: '#64748B' }}>Credit Limit</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Needs Attention / Approvals List */}
            <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#0F172A', margin: 0 }}>
                  Needs Attention: Credit Limits & Pending Approvals
                </h3>
                <button
                  onClick={() => setActiveTabId('orders-approvals')}
                  style={{ fontSize: '12px', fontWeight: 600, color: '#2563EB', background: 'none', border: 'none', cursor: 'pointer' }}
                >
                  View Approvals Inbox →
                </button>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #E2E8F0', textAlign: 'left', color: '#64748B' }}>
                    <th style={{ padding: '8px 12px' }}>Order #</th>
                    <th style={{ padding: '8px 12px' }}>Buyer</th>
                    <th style={{ padding: '8px 12px' }}>Order Value</th>
                    <th style={{ padding: '8px 12px' }}>Attention Reason</th>
                    <th style={{ padding: '8px 12px' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { order: 'PO-2026-904', buyer: 'Sapphire Finishing Mills', val: 'PKR 3,480,000', reason: 'Credit limit 85% reached; Advance payment verified', badge: 'Review' },
                    { order: 'PO-2026-912', buyer: 'Gul Ahmed Textiles', val: 'PKR 1,850,000', reason: 'Special shade Lab Dip approval required from buyer', badge: 'Approve' },
                  ].map((row, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #F1F5F9' }}>
                      <td style={{ padding: '10px 12px', fontWeight: 600, color: '#0F172A' }}>{row.order}</td>
                      <td style={{ padding: '10px 12px' }}>{row.buyer}</td>
                      <td style={{ padding: '10px 12px', fontWeight: 600 }}>{row.val}</td>
                      <td style={{ padding: '10px 12px', color: '#D97706' }}>{row.reason}</td>
                      <td style={{ padding: '10px 12px' }}>
                        <button
                          onClick={() => alert(`Reviewing ${row.order}`)}
                          style={{
                            padding: '4px 10px',
                            borderRadius: '4px',
                            border: '1px solid #CBD5E1',
                            backgroundColor: '#FFFFFF',
                            fontSize: '12px',
                            cursor: 'pointer',
                          }}
                        >
                          {row.badge}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );

      case 'orders-all':
      case 'orders-new':
        return <OrdersView />;

      case 'orders-buyers':
        return <ClientsView />;

      case 'orders-quotations':
      case 'orders-tracking':
      case 'orders-bom':
      case 'orders-approvals':
      case 'orders-reports':
      default:
        return <OrdersView />;
    }
  };

  return (
    <ModuleWorkspace
      moduleKey="orders"
      moduleTitle="Orders"
      moduleSubtitle="Sales, Bookings & Production Orders"
      moduleIconName="ShoppingBag"
      tabs={ordersNav.tabs}
      activeTabId={activeTabId}
      onTabChange={handleTabChange}
      activeSubPageId={activeSubPageId}
      quickActions={quickActions}
      userRole={user?.role || 'owner'}
      breadcrumbs={['Orders OS', ordersNav.tabs.find((t) => t.id === activeTabId)?.label || 'Overview']}
    >
      {renderTabContent()}
    </ModuleWorkspace>
  );
};
