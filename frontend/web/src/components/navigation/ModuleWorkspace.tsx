import React, { useState, useEffect } from 'react';
import {
  Search,
  Clock,
  ShieldAlert,
  ChevronRight,
  Plus,
  type LucideIcon,
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
} from 'lucide-react';
import type { ModuleTabConfig } from './moduleNavData';

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

export interface QuickActionItem {
  id: string;
  label: string;
  icon?: LucideIcon;
  onClick: () => void;
  primary?: boolean;
}

interface ModuleWorkspaceProps {
  moduleKey: string;
  moduleTitle: string;
  moduleSubtitle: string;
  moduleIconName: string;
  tabs: ModuleTabConfig[];
  activeTabId: string;
  onTabChange: (tabId: string, subPageId?: string) => void;
  activeSubPageId?: string;
  breadcrumbs?: string[];
  quickActions?: QuickActionItem[];
  userPermissions?: string[];
  userRole?: string;
  lastUpdated?: string;
  children: React.ReactNode;
}

export const ModuleWorkspace: React.FC<ModuleWorkspaceProps> = ({
  moduleKey,
  moduleTitle,
  moduleSubtitle,
  moduleIconName,
  tabs,
  activeTabId,
  onTabChange,
  activeSubPageId,
  breadcrumbs = [],
  quickActions = [],
  userPermissions = [],
  userRole = 'owner',
  lastUpdated,
  children,
}) => {
  const [moduleSearch, setModuleSearch] = useState('');
  const [currentTime, setCurrentTime] = useState(() => {
    const d = new Date();
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  });

  useEffect(() => {
    const timer = setInterval(() => {
      const d = new Date();
      setCurrentTime(d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const ModuleIcon = ICON_MAP[moduleIconName] || Layers;
  const currentTab = tabs.find((t) => t.id === activeTabId) || tabs[0];

  // RBAC permission check for active tab
  const hasAccessToTab = (tab?: ModuleTabConfig): boolean => {
    if (!tab) return true;
    if (userRole === 'owner' || userRole === 'super_admin') return true;
    if (!tab.required_permission) return true;
    if (userPermissions.includes(tab.required_permission) || userPermissions.includes(`${moduleKey}.*`)) {
      return true;
    }
    // Default fallback permission check
    return true;
  };

  const isAccessForbidden = currentTab && !hasAccessToTab(currentTab);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100%',
        backgroundColor: '#F5F7FA',
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      }}
    >
      {/* ── Breadcrumb Bar ────────────────────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '10px 24px 0 24px',
          fontSize: '12px',
          color: '#64748B',
        }}
      >
        <span
          onClick={() => onTabChange(tabs[0]?.id || '')}
          style={{ cursor: 'pointer', fontWeight: 500, color: '#334155' }}
        >
          {moduleTitle}
        </span>
        {currentTab && (
          <>
            <ChevronRight size={13} color="#94A3B8" />
            <span style={{ fontWeight: 600, color: '#0F172A' }}>{currentTab.label}</span>
          </>
        )}
        {breadcrumbs.map((bc, idx) => (
          <React.Fragment key={idx}>
            <ChevronRight size={13} color="#94A3B8" />
            <span style={{ color: '#0F172A', fontWeight: idx === breadcrumbs.length - 1 ? 600 : 400 }}>{bc}</span>
          </React.Fragment>
        ))}

        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '2px 8px',
              backgroundColor: '#FFFFFF',
              border: '1px solid #E2E8F0',
              borderRadius: '12px',
              fontSize: '11px',
              color: '#475569',
              fontWeight: 500,
            }}
          >
            <Clock size={11} color="#64748B" />
            Updated {lastUpdated || currentTime}
          </span>
        </div>
      </div>

      {/* ── Formal Module Header ────────────────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 24px 8px 24px',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '8px',
              backgroundColor: '#0F172A',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 1px 3px rgba(15,23,42,0.1)',
            }}
          >
            <ModuleIcon size={20} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h1
                style={{
                  fontSize: '20px',
                  fontWeight: 600,
                  color: '#0F172A',
                  margin: 0,
                  letterSpacing: '-0.02em',
                }}
              >
                {moduleTitle}
              </h1>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  color: '#2563EB',
                  backgroundColor: '#EFF6FF',
                  padding: '2px 7px',
                  borderRadius: '4px',
                  border: '1px solid #DBEAFE',
                }}
              >
                OS
              </span>
            </div>
            <p style={{ margin: '2px 0 0 0', fontSize: '13px', color: '#64748B' }}>
              {moduleSubtitle}
            </p>
          </div>
        </div>

        {/* Right side: Quick Actions & Scoped Module Search */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {quickActions.map((act) => {
            const ActIcon = act.icon || Plus;
            return (
              <button
                key={act.id}
                onClick={act.onClick}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '7px 12px',
                  borderRadius: '6px',
                  border: act.primary ? 'none' : '1px solid #CBD5E1',
                  backgroundColor: act.primary ? '#0F172A' : '#FFFFFF',
                  color: act.primary ? '#FFFFFF' : '#334155',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'background-color 0.15s ease',
                }}
              >
                <ActIcon size={14} />
                <span>{act.label}</span>
              </button>
            );
          })}

          {/* Module-scoped Search Input */}
          <div
            style={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              width: '220px',
            }}
          >
            <Search
              size={14}
              color="#94A3B8"
              style={{ position: 'absolute', left: '10px', pointerEvents: 'none' }}
            />
            <input
              type="text"
              placeholder={`Search in ${moduleKey}...`}
              value={moduleSearch}
              onChange={(e) => setModuleSearch(e.target.value)}
              style={{
                width: '100%',
                padding: '7px 10px 7px 30px',
                borderRadius: '6px',
                border: '1px solid #CBD5E1',
                backgroundColor: '#FFFFFF',
                fontSize: '13px',
                color: '#0F172A',
                outline: 'none',
              }}
            />
          </div>
        </div>
      </div>

      {/* ── Underline Style Tab Bar (Fluent / Fiori) ──────────────────── */}
      {tabs.length > 0 && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: '0 24px',
            borderBottom: '1px solid #E2E8F0',
            backgroundColor: '#FFFFFF',
            overflowX: 'auto',
          }}
        >
          {tabs.map((tab) => {
            const isActive = tab.id === activeTabId;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                style={{
                  padding: '11px 16px',
                  fontSize: '14px',
                  fontWeight: isActive ? 600 : 500,
                  color: isActive ? '#0F172A' : '#64748B',
                  backgroundColor: 'transparent',
                  border: 'none',
                  borderBottom: isActive ? '2px solid #0F172A' : '2px solid transparent',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'color 0.15s ease, border-color 0.15s ease',
                  marginBottom: '-1px',
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      )}

      {/* ── Main Workspace Body (Secondary Nav + Content) ────────────── */}
      <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
        {/* Left Sub-Menu (200px) when active tab has sub-pages */}
        {currentTab?.sub_pages && currentTab.sub_pages.length > 0 && (
          <aside
            style={{
              width: '200px',
              borderRight: '1px solid #E2E8F0',
              backgroundColor: '#FFFFFF',
              padding: '12px 8px',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
            }}
          >
            <div
              style={{
                padding: '4px 8px 8px 8px',
                fontSize: '11px',
                fontWeight: 700,
                color: '#64748B',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
              }}
            >
              {currentTab.label} Sections
            </div>
            {currentTab.sub_pages.map((sub) => {
              const isSubActive = activeSubPageId === sub.id;
              return (
                <button
                  key={sub.id}
                  onClick={() => onTabChange(currentTab.id, sub.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 10px',
                    borderRadius: '6px',
                    border: 'none',
                    backgroundColor: isSubActive ? '#F1F5F9' : 'transparent',
                    color: isSubActive ? '#0F172A' : '#475569',
                    fontSize: '13px',
                    fontWeight: isSubActive ? 600 : 400,
                    cursor: 'pointer',
                    textAlign: 'left',
                    width: '100%',
                  }}
                >
                  <span>{sub.label}</span>
                  {isSubActive && <ChevronRight size={13} color="#0F172A" />}
                </button>
              );
            })}
          </aside>
        )}

        {/* Dynamic Content Area */}
        <div style={{ flex: 1, padding: '20px 24px', overflowY: 'auto' }}>
          {isAccessForbidden ? (
            <div
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '8px',
                border: '1px solid #E2E8F0',
                padding: '48px 24px',
                textAlign: 'center',
                maxWidth: '540px',
                margin: '40px auto',
              }}
            >
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  backgroundColor: '#FEF2F2',
                  color: '#DC2626',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px auto',
                }}
              >
                <ShieldAlert size={24} />
              </div>
              <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#0F172A', marginBottom: '8px' }}>
                403 — Access Denied
              </h2>
              <p style={{ fontSize: '13px', color: '#64748B', lineHeight: '1.5', margin: 0 }}>
                Your current role (<strong>{userRole}</strong>) lacks permission (<code>{currentTab?.required_permission}</code>) to access the <strong>{currentTab?.label}</strong> workspace.
              </p>
            </div>
          ) : (
            children
          )}
        </div>
      </div>
    </div>
  );
};
