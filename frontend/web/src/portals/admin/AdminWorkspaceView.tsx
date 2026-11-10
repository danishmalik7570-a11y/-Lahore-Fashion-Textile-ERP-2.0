import React, { useState } from 'react';
import { ModuleWorkspace, type QuickActionItem } from '../../components/navigation/ModuleWorkspace';
import { MODULE_NAV_CONFIGS } from '../../components/navigation/moduleNavData';
import { UserManagementView } from '../../components/UserManagementView';
import { PortalManagerView } from './PortalManagerView';
import { SettingsView } from '../../components/SettingsView';
import { FormatBuilderView } from '../../components/printing/FormatBuilderView';
import { useAuth } from '../../context/AuthContext';
import {
  Users,
  ShieldCheck,
  LayoutGrid,
  Printer,
  Database,
  Lock
} from 'lucide-react';

interface AdminWorkspaceViewProps {
  initialTab?: string;
}

export const AdminWorkspaceView: React.FC<AdminWorkspaceViewProps> = ({
  initialTab = 'adm-overview'
}) => {
  const { user } = useAuth();
  const admNav = MODULE_NAV_CONFIGS.find((m) => m.module === 'admin')!;
  const [activeTab, setActiveTab] = useState(initialTab);
  const [activeSubPage, setActiveSubPage] = useState<string | undefined>();

  const quickActions: QuickActionItem[] = [
    {
      id: 'add-user',
      label: '+ Add User',
      primary: true,
      onClick: () => setActiveTab('adm-users')
    },
    {
      id: 'edit-roles',
      label: 'Roles & Matrix',
      onClick: () => setActiveTab('adm-roles')
    }
  ];

  return (
    <ModuleWorkspace
      moduleKey="admin"
      moduleTitle="Administration"
      moduleSubtitle="System Security, Users & Portal Manager"
      moduleIconName="Settings"
      tabs={admNav.tabs}
      activeTabId={activeTab}
      onTabChange={(tabId, subId) => {
        setActiveTab(tabId);
        setActiveSubPage(subId);
      }}
      activeSubPageId={activeSubPage}
      quickActions={quickActions}
      userRole={user?.role || 'owner'}
      breadcrumbs={['Administration OS', admNav.tabs.find((t) => t.id === activeTab)?.label || 'Overview']}
    >
      {/* 1. OVERVIEW */}
      {activeTab === 'adm-overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* 5 KPI CARDS */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
            <div style={{ background: '#ffffff', borderRadius: 8, border: '1px solid #e2e8f0', padding: '16px 20px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 13, color: '#64748b', fontWeight: 500 }}>Active Users</span>
                <div style={{ width: 32, height: 32, borderRadius: 6, background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Users size={18} color="#2563eb" />
                </div>
              </div>
              <div style={{ fontSize: 24, fontWeight: 700, color: '#0f172a' }}>18 Staff</div>
              <div style={{ fontSize: 12, color: '#16a34a', marginTop: 4 }}>
                ● Active in Lahore Fashion Mill
              </div>
            </div>

            <div style={{ background: '#ffffff', borderRadius: 8, border: '1px solid #e2e8f0', padding: '16px 20px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 13, color: '#64748b', fontWeight: 500 }}>System Roles</span>
                <div style={{ width: 32, height: 32, borderRadius: 6, background: '#f5f3ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ShieldCheck size={18} color="#7c3aed" />
                </div>
              </div>
              <div style={{ fontSize: 24, fontWeight: 700, color: '#0f172a' }}>10 Roles</div>
              <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>
                RBAC matrix enforced
              </div>
            </div>

            <div style={{ background: '#ffffff', borderRadius: 8, border: '1px solid #e2e8f0', padding: '16px 20px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 13, color: '#64748b', fontWeight: 500 }}>Active Portals</span>
                <div style={{ width: 32, height: 32, borderRadius: 6, background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <LayoutGrid size={18} color="#16a34a" />
                </div>
              </div>
              <div style={{ fontSize: 24, fontWeight: 700, color: '#0f172a' }}>11 Portals</div>
              <div style={{ fontSize: 12, color: '#16a34a', marginTop: 4 }}>
                All configured & seeded
              </div>
            </div>

            <div style={{ background: '#ffffff', borderRadius: 8, border: '1px solid #e2e8f0', padding: '16px 20px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 13, color: '#64748b', fontWeight: 500 }}>Security Health</span>
                <div style={{ width: 32, height: 32, borderRadius: 6, background: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Lock size={18} color="#059669" />
                </div>
              </div>
              <div style={{ fontSize: 24, fontWeight: 700, color: '#0f172a' }}>100% Passed</div>
              <div style={{ fontSize: 12, color: '#16a34a', marginTop: 4 }}>
                2FA & audit logging active
              </div>
            </div>

            <div style={{ background: '#ffffff', borderRadius: 8, border: '1px solid #e2e8f0', padding: '16px 20px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 13, color: '#64748b', fontWeight: 500 }}>Database Backup</span>
                <div style={{ width: 32, height: 32, borderRadius: 6, background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Database size={18} color="#2563eb" />
                </div>
              </div>
              <div style={{ fontSize: 24, fontWeight: 700, color: '#0f172a' }}>Up to date</div>
              <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>
                Automated night snapshot
              </div>
            </div>
          </div>

          {/* QUICK SHORTCUTS GRID */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
            <div
              onClick={() => setActiveTab('adm-users')}
              style={{ background: '#ffffff', borderRadius: 8, border: '1px solid #e2e8f0', padding: 20, cursor: 'pointer', transition: 'all 0.15s ease' }}
            >
              <Users size={24} color="#2563eb" style={{ marginBottom: 12 }} />
              <h4 style={{ margin: '0 0 6px', fontSize: 15, color: '#0f172a' }}>User Accounts & Passwords</h4>
              <p style={{ margin: 0, fontSize: 13, color: '#64748b' }}>Provision mill staff, reset credentials, assign roles, and enforce 2FA verification.</p>
            </div>

            <div
              onClick={() => setActiveTab('adm-roles')}
              style={{ background: '#ffffff', borderRadius: 8, border: '1px solid #e2e8f0', padding: 20, cursor: 'pointer', transition: 'all 0.15s ease' }}
            >
              <ShieldCheck size={24} color="#7c3aed" style={{ marginBottom: 12 }} />
              <h4 style={{ margin: '0 0 6px', fontSize: 15, color: '#0f172a' }}>Roles & Permission Matrix</h4>
              <p style={{ margin: 0, fontSize: 13, color: '#64748b' }}>Fine-grained CRUD and module workspace access control across all 10 modules.</p>
            </div>

            <div
              onClick={() => setActiveTab('adm-portals')}
              style={{ background: '#ffffff', borderRadius: 8, border: '1px solid #e2e8f0', padding: 20, cursor: 'pointer', transition: 'all 0.15s ease' }}
            >
              <LayoutGrid size={24} color="#16a34a" style={{ marginBottom: 12 }} />
              <h4 style={{ margin: '0 0 6px', fontSize: 15, color: '#0f172a' }}>Portals & Navigation Trees</h4>
              <p style={{ margin: 0, fontSize: 13, color: '#64748b' }}>Manage portal assignments, sidebar menu items, and module workspace order.</p>
            </div>

            <div
              onClick={() => setActiveTab('adm-print-formats')}
              style={{ background: '#ffffff', borderRadius: 8, border: '1px solid #e2e8f0', padding: 20, cursor: 'pointer', transition: 'all 0.15s ease' }}
            >
              <Printer size={24} color="#ea580c" style={{ marginBottom: 12 }} />
              <h4 style={{ margin: '0 0 6px', fontSize: 15, color: '#0f172a' }}>Print Format Designer</h4>
              <p style={{ margin: 0, fontSize: 13, color: '#64748b' }}>Design official print templates for Delivery Challans, Tax Invoices, and Gate Passes.</p>
            </div>
          </div>
        </div>
      )}

      {/* 2. USERS */}
      {activeTab === 'adm-users' && (
        <div style={{ background: '#ffffff', borderRadius: 8, border: '1px solid #e2e8f0', padding: 20 }}>
          <UserManagementView />
        </div>
      )}

      {/* 3. ROLES & PERMISSIONS */}
      {activeTab === 'adm-roles' && (
        <div style={{ background: '#ffffff', borderRadius: 8, border: '1px solid #e2e8f0', padding: 20 }}>
          <UserManagementView />
        </div>
      )}

      {/* 4. PORTALS & NAVIGATION */}
      {activeTab === 'adm-portals' && (
        <div style={{ background: '#ffffff', borderRadius: 8, border: '1px solid #e2e8f0', padding: 20 }}>
          <PortalManagerView />
        </div>
      )}

      {/* 5. APPROVAL POLICIES */}
      {activeTab === 'adm-approval-policies' && (
        <div style={{ background: '#ffffff', borderRadius: 8, border: '1px solid #e2e8f0', padding: 20 }}>
          <h3 style={{ margin: '0 0 12px', fontSize: 15, fontWeight: 600 }}>Multi-Tier Approval Policies</h3>
          <p style={{ margin: '0 0 16px', fontSize: 13, color: '#64748b' }}>Approval thresholds for PO issuance, invoice clearance, and stock scrap</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { rule: 'Purchase Orders > PKR 500,000', approver: 'Mill Owner (Two-factor Step-Up required)', status: 'Enforced' },
              { rule: 'Payment Vouchers > PKR 200,000', approver: 'Finance Controller & Owner', status: 'Enforced' },
              { rule: 'Quality Rejection Overrides', approver: 'Plant Director', status: 'Enforced' },
            ].map((p, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: '#f8fafc', borderRadius: 6, border: '1px solid #e2e8f0' }}>
                <div>
                  <div style={{ fontWeight: 600, color: '#0f172a', fontSize: 13 }}>{p.rule}</div>
                  <div style={{ fontSize: 12, color: '#64748b' }}>Approver: {p.approver}</div>
                </div>
                <span style={{ fontSize: 11, fontWeight: 600, color: '#166534', background: '#dcfce7', padding: '3px 8px', borderRadius: 10 }}>
                  {p.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 6. PRINT FORMATS */}
      {activeTab === 'adm-print-formats' && (
        <div style={{ background: '#ffffff', borderRadius: 8, border: '1px solid #e2e8f0', padding: 20 }}>
          <FormatBuilderView onBack={() => setActiveTab('adm-overview')} />
        </div>
      )}

      {/* 7. COMPANY SETTINGS */}
      {activeTab === 'adm-company' && (
        <div style={{ background: '#ffffff', borderRadius: 8, border: '1px solid #e2e8f0', padding: 20 }}>
          <SettingsView />
        </div>
      )}

      {/* 8. INTEGRATIONS */}
      {activeTab === 'adm-integrations' && (
        <div style={{ background: '#ffffff', borderRadius: 8, border: '1px solid #e2e8f0', padding: 20 }}>
          <SettingsView />
        </div>
      )}

      {/* 9. AUDIT LOG */}
      {activeTab === 'adm-audit' && (
        <div style={{ background: '#ffffff', borderRadius: 8, border: '1px solid #e2e8f0', padding: 20 }}>
          <SettingsView />
        </div>
      )}

      {/* 10. SESSIONS & DEVICES */}
      {activeTab === 'adm-sessions' && (
        <div style={{ background: '#ffffff', borderRadius: 8, border: '1px solid #e2e8f0', padding: 20 }}>
          <h3 style={{ margin: '0 0 12px', fontSize: 15, fontWeight: 600 }}>Active Sessions & Device Log</h3>
          <p style={{ margin: '0 0 16px', fontSize: 13, color: '#64748b' }}>Connected terminals and desktop browsers logged into Lahore Fashion Mill portal</p>
          <div style={{ padding: 16, background: '#f8fafc', borderRadius: 6, border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>Current Device: Chrome / Windows (Active Terminal)</div>
            <div style={{ fontSize: 12, color: '#16a34a', marginTop: 4 }}>IP: 192.168.10.45 — Lahore Fashion Mill LAN</div>
          </div>
        </div>
      )}

      {/* 11. BACKUPS & SYSTEM HEALTH */}
      {activeTab === 'adm-health' && (
        <div style={{ background: '#ffffff', borderRadius: 8, border: '1px solid #e2e8f0', padding: 20 }}>
          <h3 style={{ margin: '0 0 12px', fontSize: 15, fontWeight: 600 }}>System Health & Database Maintenance</h3>
          <p style={{ margin: '0 0 16px', fontSize: 13, color: '#64748b' }}>PostgreSQL database backup and server uptime metrics</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
            <div style={{ padding: 14, background: '#f8fafc', borderRadius: 6 }}>
              <div style={{ fontSize: 12, color: '#64748b' }}>Database Size</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#0f172a', marginTop: 4 }}>84.2 MB</div>
            </div>
            <div style={{ padding: 14, background: '#f8fafc', borderRadius: 6 }}>
              <div style={{ fontSize: 12, color: '#64748b' }}>Last Backup</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#16a34a', marginTop: 4 }}>03:00 AM (OK)</div>
            </div>
            <div style={{ padding: 14, background: '#f8fafc', borderRadius: 6 }}>
              <div style={{ fontSize: 12, color: '#64748b' }}>Django & Node Health</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#16a34a', marginTop: 4 }}>Healthy (0 errors)</div>
            </div>
          </div>
        </div>
      )}
    </ModuleWorkspace>
  );
};
