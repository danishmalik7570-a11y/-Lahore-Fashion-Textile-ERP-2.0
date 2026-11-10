import React, { useState } from 'react';
import { usePortal } from './PortalContext';
import { useAuth } from '../context/AuthContext';
import { AppLauncherModal } from './AppLauncherModal';
import { StepUpAuthModal } from './StepUpAuthModal';
import { Sidebar } from '../components/navigation/Sidebar';
import {
  Menu,
  Grid,
  Search,
  CheckSquare,
  ChevronDown,
  LogOut,
  Sparkles,
  Bell,
} from 'lucide-react';

interface PortalShellProps {
  children: React.ReactNode;
  activeNav?: string;
  onSelectNav?: (route: string) => void;
  onOpenSearch?: () => void;
}

export const PortalShell: React.FC<PortalShellProps> = ({
  children,
  activeNav,
  onSelectNav,
  onOpenSearch,
}) => {
  const { portalMeta, openLauncher, idleSecondsRemaining, announcements } = usePortal();
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [approvalsCount] = useState(4);

  // Format idle seconds into MM:SS
  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const isMinimalShell = portalMeta.slug === 'kiosk' || user?.role === 'worker';

  return (
    <div
      style={{
        display: 'flex',
        minHeight: '100vh',
        backgroundColor: 'var(--portal-surface, #F4F7FB)',
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      }}
    >
      {/* ── Left Sidebar (hidden in minimal shell mode) ─────────────────────────── */}
      {!isMinimalShell && (
        <Sidebar
          activeNav={activeNav}
          onSelectNav={onSelectNav}
          user={user}
          activeRole={user?.role || 'owner'}
          activePortal={portalMeta.slug}
          isCollapsed={!sidebarOpen}
          onToggleCollapse={() => setSidebarOpen(!sidebarOpen)}
          onSignOut={logout}
          idleTimerText={`Lock: ${formatTimer(idleSecondsRemaining)}`}
          onOpenPortalSwitcher={openLauncher}
          hasMultiplePortals={Boolean(user && (user.role === 'owner' || user.role === 'super_admin'))}
        />
      )}

      {/* ── Main Content Area ───────────────────────────────────────────────────── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflowY: 'auto' }}>
        {/* Top Header */}
        <header
          style={{
            height: '64px',
            backgroundColor: '#FFFFFF',
            borderBottom: '1px solid #E2E8F0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 24px',
            position: 'sticky',
            top: 0,
            zIndex: 30,
            boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
          }}
        >
          {/* Left: Hamburger, Portal Tag & Scoped Search */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {!isMinimalShell && (
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                style={{
                  border: 'none',
                  background: 'none',
                  color: '#64748B',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  padding: '6px',
                  borderRadius: '6px',
                }}
              >
                <Menu size={20} />
              </button>
            )}

            {/* Global Scoped Search */}
            <div
              onClick={onOpenSearch}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '8px 16px',
                borderRadius: '8px',
                backgroundColor: '#F1F5F9',
                border: '1px solid #CBD5E1',
                color: '#64748B',
                fontSize: '13px',
                cursor: 'pointer',
                width: '320px',
              }}
            >
              <Search size={16} />
              <span style={{ flex: 1 }}>Global search (Ctrl+K)...</span>
              <span
                style={{
                  fontSize: '11px',
                  backgroundColor: '#FFFFFF',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  border: '1px solid #CBD5E1',
                  fontWeight: 600,
                  color: '#334155',
                }}
              >
                Ctrl+K
              </span>
            </div>
          </div>

          {/* Right: Approvals Inbox, Notifications Bell & User Menu */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* Approvals Inbox Pill */}
            <button
              onClick={() => onSelectNav && onSelectNav('orders:approvals')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                borderRadius: '6px',
                backgroundColor: '#FEF2F2',
                border: '1px solid #FEE2E2',
                color: '#B91C1C',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
              title="Pending Approvals"
            >
              <CheckSquare size={15} />
              <span>Approvals</span>
              <span
                style={{
                  backgroundColor: '#EF4444',
                  color: '#FFFFFF',
                  borderRadius: '10px',
                  padding: '1px 6px',
                  fontSize: '11px',
                  fontWeight: 700,
                }}
              >
                {approvalsCount}
              </span>
            </button>

            {/* Notifications Bell */}
            <button
              onClick={() => {}}
              style={{
                position: 'relative',
                background: '#FFFFFF',
                border: '1px solid #CBD5E1',
                borderRadius: '6px',
                width: '34px',
                height: '34px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#334155',
                cursor: 'pointer',
              }}
              title="Notifications"
            >
              <Bell size={16} />
              <span
                style={{
                  position: 'absolute',
                  top: '6px',
                  right: '6px',
                  width: '6px',
                  height: '6px',
                  backgroundColor: '#EF4444',
                  borderRadius: '50%',
                }}
              />
            </button>

            {/* User Profile Dropdown */}
            <div style={{ position: 'relative' }}>
              <div
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '4px 8px',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  border: '1px solid transparent',
                }}
              >
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    backgroundColor: '#1E293B',
                    color: '#FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: '14px',
                  }}
                >
                  {user?.name.charAt(0) || 'U'}
                </div>
                <div style={{ textAlign: 'left', display: 'block' }}>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#0F172A', lineHeight: 1.2 }}>{user?.name}</div>
                  <div style={{ fontSize: '11px', color: '#64748B' }}>{user?.role_display || user?.role}</div>
                </div>
                <ChevronDown size={14} color="#64748B" />
              </div>

              {userMenuOpen && (
                <div
                  style={{
                    position: 'absolute',
                    top: '100%',
                    right: 0,
                    marginTop: '8px',
                    width: '220px',
                    backgroundColor: '#FFFFFF',
                    borderRadius: '12px',
                    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.15)',
                    border: '1px solid #E2E8F0',
                    padding: '6px',
                    zIndex: 50,
                  }}
                >
                  <div style={{ padding: '8px 12px', borderBottom: '1px solid #F1F5F9' }}>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#0F172A' }}>{user?.name}</div>
                    <div style={{ fontSize: '11px', color: '#64748B' }}>{user?.email}</div>
                  </div>

                  <button
                    onClick={openLauncher}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      borderRadius: '6px',
                      border: 'none',
                      backgroundColor: 'transparent',
                      color: '#334155',
                      fontSize: '13px',
                      cursor: 'pointer',
                      textAlign: 'left',
                    }}
                  >
                    <Grid size={16} /> Switch Portal
                  </button>

                  <button
                    onClick={logout}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      borderRadius: '6px',
                      border: 'none',
                      backgroundColor: 'transparent',
                      color: '#EF4444',
                      fontSize: '13px',
                      cursor: 'pointer',
                      textAlign: 'left',
                      marginTop: '4px',
                    }}
                  >
                    <LogOut size={16} /> Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Global Portal Announcement Banner (if any) */}
        {announcements && announcements.length > 0 && (
          <div
            style={{
              padding: '10px 24px',
              backgroundColor: '#EFF6FF',
              borderBottom: '1px solid #DBEAFE',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '13px',
              color: '#1E40AF',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sparkles size={16} color="#3B82F6" />
              <span>
                <strong>{announcements[0].title}:</strong> {announcements[0].message}
              </span>
            </div>
            <span style={{ fontSize: '11px', color: '#60A5FA' }}>Enterprise Broadcast</span>
          </div>
        )}

        {/* Dynamic Page Content */}
        <main style={{ flex: 1, padding: '24px 32px 64px 32px' }}>
          {children}
        </main>
      </div>

      {/* Global Modals */}
      <AppLauncherModal />
      <StepUpAuthModal />
    </div>
  );
};
