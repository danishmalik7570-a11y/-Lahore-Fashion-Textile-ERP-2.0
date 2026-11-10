import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { MillDataProvider } from './context/MillDataContext';
import { PortalProvider, usePortal } from './portals/PortalContext';
import { PortalShell } from './portals/PortalShell';
import { ToastNotification } from './components/ToastNotification';
import { QuickSearchModal } from './components/QuickSearchModal';

// Dedicated Portal Views
import { HrLoginView } from './portals/hr/HrLoginView';
import { HrDashboardView } from './portals/hr/HrDashboardView';
import { ManagerLoginView } from './portals/manager/ManagerLoginView';
import { ManagerDashboardView } from './portals/manager/ManagerDashboardView';
import { FinanceDashboardView } from './portals/finance/FinanceDashboardView';
import { OwnerDashboardView } from './portals/owner/OwnerDashboardView';
import { PortalManagerView } from './portals/admin/PortalManagerView';
import { HrWorkspaceView } from './portals/hr/HrWorkspaceView';
import { OrdersWorkspaceView } from './portals/orders/OrdersWorkspaceView';
import { ProductionWorkspaceView } from './portals/production/ProductionWorkspaceView';
import { InventoryWorkspaceView } from './portals/inventory/InventoryWorkspaceView';
import { QualityWorkspaceView } from './portals/quality/QualityWorkspaceView';
import { DeliveryWorkspaceView } from './portals/delivery/DeliveryWorkspaceView';
import { FinanceWorkspaceView } from './portals/finance/FinanceWorkspaceView';
import { ReportsWorkspaceView } from './portals/reports/ReportsWorkspaceView';
import { AdminWorkspaceView } from './portals/admin/AdminWorkspaceView';

// Core Business Feature Modules
import { DashboardView } from './components/DashboardView';
import { KioskView } from './components/KioskView';
import { ModulePlaceholder } from './components/ModulePlaceholder';
import { LoginView } from './components/LoginView';

import type { ModuleKey, PortalSlug } from './types';
import { PORTAL_REGISTRY } from './portals/portalRegistry';
import { Sparkles } from 'lucide-react';

const PortalAwareLogin: React.FC = () => {
  const { activePortal, switchPortal } = usePortal();

  return (
    <div>
      {/* Top Portal Switcher Bar for Quick Front-Door Testing */}
      <div
        style={{
          backgroundColor: '#0F172A',
          color: '#FFFFFF',
          padding: '8px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '12px',
          borderBottom: '1px solid #1E293B',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Sparkles size={14} color="#F59E0B" />
          <span style={{ fontWeight: 600 }}>Front-Door Portal Switcher (Prompt 7):</span>
          <span style={{ color: '#94A3B8' }}>Select any role-wise branded login page</span>
        </div>

        <div style={{ display: 'flex', gap: '6px' }}>
          {(['hr', 'manager', 'finance', 'owner', 'stores', 'qc', 'admin'] as PortalSlug[]).map((slug) => {
            const isSel = activePortal === slug;
            const meta = PORTAL_REGISTRY[slug];
            return (
              <button
                key={slug}
                onClick={() => switchPortal(slug)}
                style={{
                  padding: '3px 10px',
                  borderRadius: '12px',
                  border: isSel ? '1px solid #38BDF8' : '1px solid rgba(255,255,255,0.15)',
                  backgroundColor: isSel ? '#0284C7' : 'rgba(255,255,255,0.06)',
                  color: '#FFFFFF',
                  fontSize: '11px',
                  fontWeight: isSel ? 700 : 500,
                  cursor: 'pointer',
                  textTransform: 'uppercase',
                }}
              >
                {slug} ({meta.code})
              </button>
            );
          })}
        </div>
      </div>

      {/* Render dedicated login screen */}
      {activePortal === 'hr' ? (
        <HrLoginView />
      ) : activePortal === 'manager' ? (
        <ManagerLoginView />
      ) : (
        <LoginView />
      )}
    </div>
  );
};

const MainLayout: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const { activePortal } = usePortal();
  const [currentModule, setCurrentModule] = useState<ModuleKey>('dashboard');
  const [activeNav, setActiveNav] = useState<string>('dashboard');
  const [subTab, setSubTab] = useState<string>('');
  const [searchModalOpen, setSearchModalOpen] = useState(false);

  // Sync initial URL route (e.g. /portal/dept/floor-entry or /portal/floor/entry)
  useEffect(() => {
    const path = window.location.pathname;
    if (path.includes('/floor-entry') || path.includes('/floor/entry')) {
      setCurrentModule('floor-entry');
      setActiveNav('floor-entry');
    }
  }, []);

  // Reset to dashboard (or floor-entry for kiosk portal) whenever user switches active portal
  useEffect(() => {
    if (activePortal === 'kiosk') {
      setCurrentModule('floor-entry');
      setActiveNav('floor-entry');
    } else {
      setCurrentModule('dashboard');
      setActiveNav('dashboard');
    }
    setSubTab('');
  }, [activePortal]);

  if (!isAuthenticated) {
    return <PortalAwareLogin />;
  }

  const handleNavigate = (navKey: string) => {
    setActiveNav(navKey);

    if (navKey === 'clients' || navKey === 'orders:clients' || navKey === 'finance:client-ledgers') {
      setCurrentModule('clients');
      setSubTab('');
    } else if (navKey === 'hr' || navKey === 'labour' || navKey === 'employees' || navKey.startsWith('hr:')) {
      setCurrentModule('labour');
      if (navKey === 'attendance' || navKey === 'hr:attendance') setSubTab('attendance');
      else if (navKey === 'payroll' || navKey === 'hr:payroll') setSubTab('payroll');
      else if (navKey === 'compliance' || navKey === 'hr:compliance') setSubTab('compliance');
      else setSubTab('workers');
    } else if (navKey === 'attendance') {
      setCurrentModule('labour');
      setSubTab('attendance');
    } else if (navKey === 'payroll') {
      setCurrentModule('labour');
      setSubTab('payroll');
    } else if (navKey === 'compliance') {
      setCurrentModule('labour');
      setSubTab('compliance');
    } else if (navKey === 'finance' || navKey.startsWith('finance:')) {
      setCurrentModule('finance');
      if (navKey === 'payments' || navKey === 'finance:payables') setSubTab('payables');
      else setSubTab('receivables');
    } else if (navKey === 'payments') {
      setCurrentModule('finance');
      setSubTab('payables');
    } else if (navKey === 'orders' || navKey.startsWith('orders:')) {
      setCurrentModule('orders');
      setSubTab('');
    } else if (navKey === 'production' || navKey.startsWith('production:') || navKey === 'delays') {
      setCurrentModule('production');
      setSubTab('');
    } else if (navKey === 'floor-entry' || navKey === '/portal/dept/floor-entry' || navKey === '/portal/floor/entry') {
      setCurrentModule('floor-entry');
      setActiveNav('floor-entry');
      setSubTab('');
      try {
        const targetUrl = activePortal === 'dept' ? '/portal/dept/floor-entry' : '/portal/floor/entry';
        window.history.pushState(null, '', targetUrl);
      } catch {
        // Ignore history pushState issues
      }
    } else if (navKey === 'floor') {
      setCurrentModule('floor');
      setSubTab('');
    } else if (navKey === 'quality' || navKey === 'quality_stock' || navKey.startsWith('quality:')) {
      setCurrentModule('quality');
      setSubTab('');
    } else if (navKey === 'inventory' || navKey.startsWith('inventory:')) {
      setCurrentModule('inventory');
      setSubTab('');
    } else if (navKey === 'delivery' || navKey.startsWith('delivery:')) {
      setCurrentModule('delivery');
      setSubTab('');
    } else if (navKey === 'reports' || navKey.startsWith('reports:')) {
      setCurrentModule('reports');
      setSubTab('');
    } else if (navKey === 'admin' || navKey.startsWith('admin:') || navKey === 'users' || navKey === 'roles' || navKey.startsWith('admin:users') || navKey.startsWith('admin:roles')) {
      setCurrentModule('admin');
      setSubTab(navKey === 'roles' || navKey === 'admin:roles' ? 'roles' : '');
    } else if (navKey === 'portals' || navKey.startsWith('admin:portals')) {
      setCurrentModule('admin');
      setSubTab('');
    } else if (navKey === 'print' || navKey.startsWith('admin:print')) {
      setCurrentModule('admin');
      setSubTab('');
    } else if (navKey === 'settings' || navKey === 'audit' || navKey.startsWith('admin:settings') || navKey.startsWith('admin:audit')) {
      setCurrentModule('admin');
      setSubTab('');
    } else {
      setCurrentModule('dashboard');
      setActiveNav('dashboard');
      setSubTab('');
    }
  };

  const renderActiveModule = () => {
    switch (currentModule) {
      case 'dashboard':
        // Render dedicated role dashboard based on active portal
        if (activePortal === 'hr') return <HrDashboardView />;
        if (activePortal === 'manager') return <ManagerDashboardView />;
        if (activePortal === 'finance') return <FinanceDashboardView />;
        if (activePortal === 'owner') return <OwnerDashboardView onNavigate={handleNavigate} />;
        if (activePortal === 'admin') return <PortalManagerView />;
        return <DashboardView onNavigate={(mod) => handleNavigate(mod)} />;

      case 'orders':
      case 'clients':
        return (
          <OrdersWorkspaceView
            initialTab={
              currentModule === 'clients' || activeNav === 'clients'
                ? 'orders-buyers'
                : activeNav.startsWith('orders-')
                ? activeNav
                : 'orders-overview'
            }
          />
        );

      case 'production':
      case 'floor':
      case 'floor-entry':
        return (
          <ProductionWorkspaceView
            initialTab={
              activeNav === 'floor-entry' || currentModule === 'floor-entry'
                ? 'prod-floor-entry'
                : activeNav.startsWith('prod-')
                ? activeNav
                : 'prod-overview'
            }
            onNavigateToKiosk={() => {
              setCurrentModule('kiosk');
              setActiveNav('kiosk');
            }}
          />
        );
      case 'kiosk':
        return <KioskView />;
      case 'inventory':
        return (
          <InventoryWorkspaceView
            initialTab={activeNav.startsWith('inv-') ? activeNav : 'inv-overview'}
          />
        );
      case 'quality':
        return (
          <QualityWorkspaceView
            initialTab={activeNav.startsWith('qc-') ? activeNav : 'qc-overview'}
          />
        );
      case 'hr':
      case 'labour':
      case 'attendance':
        return (
          <HrWorkspaceView
            initialTab={
              activeNav === 'attendance'
                ? 'hr-attendance'
                : activeNav === 'payroll'
                ? 'hr-payroll'
                : activeNav === 'compliance'
                ? 'hr-compliance'
                : activeNav.startsWith('hr-')
                ? activeNav
                : 'hr-overview'
            }
            onNavigateLetters={() => {
              setCurrentModule('admin');
              setActiveNav('adm-print-formats');
            }}
          />
        );
      case 'delivery':
        return <DeliveryWorkspaceView />;
      case 'finance':
        return (
          <FinanceWorkspaceView
            initialTab={
              activeNav.startsWith('fin-')
                ? activeNav
                : subTab === 'payables'
                ? 'fin-payables'
                : 'fin-overview'
            }
          />
        );
      case 'reports':
        return (
          <ReportsWorkspaceView
            initialTab={activeNav.startsWith('rep-') ? activeNav : 'rep-overview'}
          />
        );
      case 'admin':
      case 'users':
      case 'portals':
      case 'settings':
      case 'print':
        return (
          <AdminWorkspaceView
            initialTab={
              activeNav === 'users'
                ? 'adm-users'
                : activeNav === 'roles'
                ? 'adm-roles'
                : activeNav === 'portals'
                ? 'adm-portals'
                : activeNav === 'print'
                ? 'adm-print-formats'
                : activeNav.startsWith('adm-')
                ? activeNav
                : 'adm-overview'
            }
          />
        );
      default:
        return <ModulePlaceholder moduleKey={currentModule} />;
    }
  };

  return (
    <PortalShell
      activeNav={activeNav}
      onSelectNav={handleNavigate}
      onOpenSearch={() => setSearchModalOpen(true)}
    >
      {renderActiveModule()}

      {/* Global Quick Search Modal */}
      <QuickSearchModal
        isOpen={searchModalOpen}
        onClose={() => setSearchModalOpen(false)}
        onSelectModule={(mod) => {
          setCurrentModule(mod);
          setActiveNav(mod);
        }}
      />

      {/* Global Toast Notifications */}
      <ToastNotification />
    </PortalShell>
  );
};

export function App() {
  return (
    <AuthProvider>
      <PortalProvider>
        <MillDataProvider>
          <MainLayout />
        </MillDataProvider>
      </PortalProvider>
    </AuthProvider>
  );
}

export default App;
