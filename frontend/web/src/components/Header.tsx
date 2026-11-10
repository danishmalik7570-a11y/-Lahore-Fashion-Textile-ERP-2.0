import React, { useState } from 'react';
import { useAuth, DEMO_ROLES } from '../context/AuthContext';
import { 
  Building2, 
  ShieldCheck, 
  Bell, 
  Search, 
  Menu, 
  LogOut, 
  ChevronDown, 
  Sparkles,
  CheckCircle2
} from 'lucide-react';

interface HeaderProps {
  onToggleSidebar: () => void;
  onOpenSearch: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onToggleSidebar, onOpenSearch }) => {
  const { user, activeRole, isWsConnected, switchDemoRole, logout } = useAuth();
  
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotificationMenu, setShowNotificationMenu] = useState(false);

  const notifications = [
    { id: 1, type: 'critical', title: 'Weaving Yarn Shortage', desc: 'Lot #LF-W892 Cotton 40s yarn below 200 kg threshold', time: '10m ago' },
    { id: 2, type: 'success', title: 'QC Inspection Passed', desc: 'Grey Fabric Lot #GF-402 passed 4-Point inspection', time: '25m ago' },
    { id: 3, type: 'info', title: 'Export Challan Dispatched', desc: 'Challan #CH-9941 cleared Karachi Port container gate', time: '1h ago' },
  ];

  return (
    <header style={{
      height: '70px',
      backgroundColor: '#ffffff',
      borderBottom: '1px solid #e2e8f0',
      boxShadow: '0 2px 6px rgba(15, 23, 42, 0.04)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 24px',
      position: 'sticky',
      top: 0,
      zIndex: 40,
    }}>
      {/* Left: Mobile Toggle & Global Search */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1, maxWidth: '460px' }}>
        <button 
          onClick={onToggleSidebar}
          style={{
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            color: 'var(--text-dim)',
            cursor: 'pointer',
            padding: '8px',
            display: 'flex',
            alignItems: 'center',
            borderRadius: 'var(--radius-sm)',
            transition: 'all var(--transition-fast)',
          }}
          title="Toggle Navigation"
        >
          <Menu size={20} />
        </button>

        {/* Global Fast Search Trigger */}
        <div 
          onClick={onOpenSearch}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            background: '#f8fafc',
            border: '1px solid #cbd5e1',
            borderRadius: 'var(--radius-md)',
            padding: '8px 14px',
            cursor: 'pointer',
            width: '100%',
            color: 'var(--text-muted)',
            fontSize: '0.85rem',
            transition: 'border-color var(--transition-fast)',
          }}
        >
          <Search size={16} color="var(--blue-primary)" />
          <span style={{ flex: 1, color: '#64748b' }}>Search lots, yarn codes, clients, orders...</span>
          <kbd style={{
            background: '#e2e8f0',
            padding: '2px 6px',
            borderRadius: '4px',
            fontSize: '0.7rem',
            color: '#334155',
            fontWeight: 600,
          }}>Ctrl K</kbd>
        </div>
      </div>

      {/* Right Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        {/* Real-time WebSocket Status */}
        <div 
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: '#f0fdf4',
            border: '1px solid #bbf7d0',
            padding: '6px 12px',
            borderRadius: 'var(--radius-full)',
            fontSize: '0.75rem',
            fontWeight: 700,
            color: '#15803d',
          }}
          title="FastAPI + Django Channels Realtime Telemetry Live"
        >
          <span className={`pulsing-dot ${isWsConnected ? 'online' : ''}`} />
          <span style={{ letterSpacing: '0.04em' }}>LIVE MILL TELEMETRY</span>
        </div>

        {/* Single Unit Facility Indicator (No branch switcher) */}
        <div style={{ position: 'relative' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: 'var(--radius-md)',
              padding: '6px 12px',
              color: '#334155',
              fontSize: '0.82rem',
              fontWeight: 600,
            }}
          >
            <Building2 size={15} color="#475569" />
            <span>Lahore Fashion Mill</span>
          </div>
        </div>

        {/* Role Switcher */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => { setShowRoleMenu(!showRoleMenu); setShowUserMenu(false); }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: '#eff6ff',
              border: '1px solid #bfdbfe',
              borderRadius: 'var(--radius-md)',
              padding: '7px 12px',
              color: '#1d4ed8',
              cursor: 'pointer',
              fontSize: '0.85rem',
              fontWeight: 700,
            }}
            title="Switch Persona / Role for Demo Simulation"
          >
            <ShieldCheck size={16} />
            <span>{DEMO_ROLES.find(r => r.code === activeRole)?.name || 'Role'}</span>
            <ChevronDown size={14} />
          </button>

          {showRoleMenu && (
            <div className="glass-dropdown" style={{
              position: 'absolute',
              top: 'calc(100% + 8px)',
              right: 0,
              width: '320px',
              padding: '8px',
              maxHeight: '400px',
              overflowY: 'auto',
              zIndex: 50,
            }}>
              <div style={{ padding: '8px 12px', fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700, display: 'flex', justifyContent: 'space-between' }}>
                <span>Simulate Factory Persona</span>
                <Sparkles size={14} color="#d97706" />
              </div>
              {DEMO_ROLES.map(r => (
                <div
                  key={r.code}
                  onClick={() => { switchDemoRole(r.code); setShowRoleMenu(false); }}
                  style={{
                    padding: '9px 12px',
                    borderRadius: 'var(--radius-sm)',
                    cursor: 'pointer',
                    background: activeRole === r.code ? '#eff6ff' : 'transparent',
                    border: activeRole === r.code ? '1px solid #bfdbfe' : '1px solid transparent',
                    marginBottom: '4px',
                  }}
                >
                  <div style={{ fontWeight: 700, fontSize: '0.85rem', color: activeRole === r.code ? '#1d4ed8' : '#0f172a' }}>
                    {r.name}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '2px' }}>
                    {r.desc}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Notification Bell */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => { setShowNotificationMenu(!showNotificationMenu); setShowRoleMenu(false); }}
            style={{
              position: 'relative',
              background: '#ffffff',
              border: '1px solid #cbd5e1',
              borderRadius: 'var(--radius-md)',
              width: '38px',
              height: '38px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#334155',
              cursor: 'pointer',
              boxShadow: 'var(--shadow-xs)',
            }}
          >
            <Bell size={18} />
            <span style={{
              position: 'absolute',
              top: '-4px',
              right: '-4px',
              background: '#dc2626',
              color: 'white',
              fontSize: '0.65rem',
              fontWeight: 700,
              width: '18px',
              height: '18px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 6px rgba(220, 38, 38, 0.4)',
            }}>
              3
            </span>
          </button>

          {showNotificationMenu && (
            <div className="glass-dropdown" style={{
              position: 'absolute',
              top: 'calc(100% + 8px)',
              right: 0,
              width: '340px',
              padding: '12px',
              zIndex: 50,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#0f172a' }}>Mill Alerts & Notifications</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--blue-primary)', cursor: 'pointer', fontWeight: 600 }}>Mark all read</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {notifications.map(n => (
                  <div key={n.id} style={{
                    padding: '10px',
                    borderRadius: 'var(--radius-sm)',
                    background: '#f8fafc',
                    borderLeft: n.type === 'critical' ? '3px solid #dc2626' : n.type === 'success' ? '3px solid #16a34a' : '3px solid #2563eb',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 700, color: '#0f172a' }}>
                      <span>{n.title}</span>
                      <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{n.time}</span>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#475569', marginTop: '4px' }}>{n.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* User Profile & Logout */}
        <div style={{ position: 'relative' }}>
          <div
            onClick={() => { setShowUserMenu(!showUserMenu); setShowRoleMenu(false); }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              cursor: 'pointer',
              padding: '4px 6px',
              borderRadius: 'var(--radius-md)',
            }}
          >
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: '0.9rem',
              color: '#ffffff',
              boxShadow: 'var(--shadow-blue-glow)',
            }}>
              {user ? user.name.charAt(0) : 'U'}
            </div>
          </div>

          {showUserMenu && (
            <div className="glass-dropdown" style={{
              position: 'absolute',
              top: 'calc(100% + 8px)',
              right: 0,
              width: '260px',
              padding: '14px',
              zIndex: 50,
            }}>
              <div style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '10px', marginBottom: '10px' }}>
                <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#0f172a' }}>{user?.name}</div>
                <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{user?.email}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px' }}>
                  <CheckCircle2 size={13} color="#16a34a" />
                  <span style={{ fontSize: '0.75rem', color: '#16a34a', fontWeight: 600 }}>2FA Hardware / TOTP Active</span>
                </div>
              </div>

              <button
                onClick={logout}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  color: '#dc2626',
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-sm)',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                }}
              >
                <LogOut size={16} />
                <span>Sign Out of ERP</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
