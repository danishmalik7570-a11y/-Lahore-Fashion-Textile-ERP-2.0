import React from 'react';
import {
  LayoutDashboard,
  ShoppingBag,
  Factory,
  Boxes,
  ShieldCheck,
  Truck,
  Users,
  DollarSign,
  BarChart3,
  Settings,
  Layers,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Building2,
  RefreshCw,
  type LucideIcon,
} from 'lucide-react';
import type { User, RoleCode, PortalSlug } from '../../types';
import { MODULE_NAV_CONFIGS } from './moduleNavData';

const ICON_MAP: Record<string, LucideIcon> = {
  LayoutDashboard,
  ShoppingBag,
  Factory,
  Boxes,
  ShieldCheck,
  Truck,
  Users,
  DollarSign,
  BarChart3,
  Settings,
  Layers,
};

interface SidebarProps {
  activeNav?: string;
  onSelectNav?: (route: string) => void;
  user: User | null;
  activeRole: RoleCode;
  activePortal?: PortalSlug;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onSignOut: () => void;
  idleTimerText?: string;
  onOpenPortalSwitcher?: () => void;
  hasMultiplePortals?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeNav = 'dashboard',
  onSelectNav,
  user,
  activeRole,
  isCollapsed,
  onToggleCollapse,
  onSignOut,
  onOpenPortalSwitcher,
  hasMultiplePortals = false,
}) => {
  // Permission filter: which modules appear in the sidebar
  const visibleModules = MODULE_NAV_CONFIGS.filter((mod) => {
    if (activeRole === 'owner' || activeRole === 'super_admin') return true;
    if (mod.allowed_roles.includes(activeRole)) return true;
    return false;
  });

  return (
    <aside
      style={{
        width: isCollapsed ? '64px' : '224px',
        minWidth: isCollapsed ? '64px' : '224px',
        height: '100vh',
        backgroundColor: '#0F172A',
        color: '#F8FAFC',
        display: 'flex',
        flexDirection: 'column',
        borderRight: '1px solid #1E293B',
        transition: 'width 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        position: 'sticky',
        top: 0,
        zIndex: 50,
        userSelect: 'none',
      }}
    >
      {/* ── Sidebar Top Header ────────────────────────────────────────── */}
      <div
        style={{
          height: '60px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: isCollapsed ? 'center' : 'space-between',
          padding: isCollapsed ? '0' : '0 16px',
          borderBottom: '1px solid #1E293B',
        }}
      >
        {!isCollapsed ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '30px',
                height: '30px',
                borderRadius: '6px',
                backgroundColor: '#1E293B',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#38BDF8',
              }}
            >
              <Building2 size={16} />
            </div>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#FFFFFF', lineHeight: 1.2 }}>
                Lahore Fashion Mill
              </div>
              <div style={{ fontSize: '11px', color: '#64748B', fontWeight: 500 }}>
                Single Unit Facility
              </div>
            </div>
          </div>
        ) : (
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '6px',
              backgroundColor: '#1E293B',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#38BDF8',
            }}
            title="Lahore Fashion Mill"
          >
            <Building2 size={18} />
          </div>
        )}
      </div>

      {/* ── Module List (Order, Permission-Filtered, Small & Simple) ──── */}
      <nav
        style={{
          flex: 1,
          padding: '12px 8px',
          display: 'flex',
          flexDirection: 'column',
          gap: '2px',
          overflowY: 'auto',
        }}
      >
        {visibleModules.map((mod) => {
          const Icon = ICON_MAP[mod.icon] || Layers;
          const isActive =
            activeNav === mod.module ||
            activeNav === mod.route ||
            (activeNav.startsWith(mod.module) && activeNav !== 'dashboard');

          return (
            <button
              key={mod.id}
              onClick={() => onSelectNav && onSelectNav(mod.module)}
              title={isCollapsed ? `${mod.label} OS` : undefined}
              style={{
                height: '40px',
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: isCollapsed ? '0' : '0 12px',
                justifyContent: isCollapsed ? 'center' : 'flex-start',
                borderRadius: '6px',
                border: 'none',
                borderLeft: isActive ? '2px solid #38BDF8' : '2px solid transparent',
                backgroundColor: isActive ? 'rgba(56, 189, 248, 0.12)' : 'transparent',
                color: isActive ? '#FFFFFF' : '#94A3B8',
                fontSize: '14px',
                fontWeight: isActive ? 600 : 500,
                cursor: 'pointer',
                transition: 'background-color 0.15s ease, color 0.15s ease',
                position: 'relative',
              }}
            >
              <Icon size={18} color={isActive ? '#38BDF8' : '#94A3B8'} />
              {!isCollapsed && <span>{mod.label}</span>}
              {/* Approvals Dot indicator if pending */}
              {mod.module === 'orders' && !isCollapsed && (
                <span
                  style={{
                    marginLeft: 'auto',
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    backgroundColor: '#F59E0B',
                  }}
                  title="Pending approvals"
                />
              )}
            </button>
          );
        })}
      </nav>

      {/* ── Bottom Section: User Block, Switch Portal, Sign Out ─────── */}
      <div
        style={{
          borderTop: '1px solid #1E293B',
          padding: '10px 8px',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
        }}
      >
        {/* User Block */}
        {!isCollapsed ? (
          <div
            style={{
              padding: '6px 8px',
              borderRadius: '6px',
              backgroundColor: 'rgba(255, 255, 255, 0.03)',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            <div
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                backgroundColor: '#334155',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '12px',
                fontWeight: 700,
              }}
            >
              {user?.name?.charAt(0) || 'U'}
            </div>
            <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
              <div
                style={{
                  fontSize: '13px',
                  fontWeight: 600,
                  color: '#F8FAFC',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {user?.name || 'Administrator'}
              </div>
              <div
                style={{
                  fontSize: '11px',
                  color: '#94A3B8',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  textTransform: 'capitalize',
                }}
              >
                {user?.role?.replace('_', ' ') || activeRole}
              </div>
            </div>
          </div>
        ) : (
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              padding: '4px 0',
            }}
            title={`${user?.name || 'User'} (${user?.role || activeRole})`}
          >
            <div
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                backgroundColor: '#334155',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '12px',
                fontWeight: 700,
              }}
            >
              {user?.name?.charAt(0) || 'U'}
            </div>
          </div>
        )}

        {/* Switch Portal Button (only if user has > 1 portal) */}
        {hasMultiplePortals && (
          <button
            onClick={onOpenPortalSwitcher}
            title={isCollapsed ? 'Switch portal' : undefined}
            style={{
              height: '34px',
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: isCollapsed ? 'center' : 'flex-start',
              gap: '10px',
              padding: isCollapsed ? '0' : '0 10px',
              borderRadius: '6px',
              border: 'none',
              backgroundColor: 'transparent',
              color: '#38BDF8',
              fontSize: '13px',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'background-color 0.15s ease',
            }}
          >
            <RefreshCw size={15} />
            {!isCollapsed && <span>Switch portal</span>}
          </button>
        )}

        {/* Sign Out Button */}
        <button
          onClick={onSignOut}
          title={isCollapsed ? 'Sign out' : undefined}
          style={{
            height: '34px',
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: isCollapsed ? 'center' : 'flex-start',
            gap: '10px',
            padding: isCollapsed ? '0' : '0 10px',
            borderRadius: '6px',
            border: 'none',
            backgroundColor: 'transparent',
            color: '#EF4444',
            fontSize: '13px',
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'background-color 0.15s ease',
          }}
        >
          <LogOut size={15} />
          {!isCollapsed && <span>Sign out</span>}
        </button>

        {/* Collapse / Expand Toggle */}
        <button
          onClick={onToggleCollapse}
          style={{
            height: '30px',
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '6px',
            border: 'none',
            backgroundColor: 'rgba(255, 255, 255, 0.04)',
            color: '#94A3B8',
            cursor: 'pointer',
            fontSize: '12px',
          }}
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </div>
    </aside>
  );
};
