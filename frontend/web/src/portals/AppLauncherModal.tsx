import React, { useState } from 'react';
import { usePortal } from './PortalContext';
import { useAuth } from '../context/AuthContext';
import {
  Grid,
  Search,
  X,
  ExternalLink,
  Clock,
  Sparkles,
  CheckCircle,
  Briefcase,
  Layers,
  Users,
  DollarSign,
  Boxes,
  BarChart3,
  Calendar,
  Zap,
  LayoutDashboard,
  Scan,
  ShieldCheck,
  Sliders,
} from 'lucide-react';

const ICON_MAP: Record<string, React.FC<{ size?: number; className?: string; style?: React.CSSProperties }>> = {
  owner: Briefcase,
  manager: Layers,
  dept: LayoutDashboard,
  hr: Users,
  finance: DollarSign,
  stores: Boxes,
  qc: BarChart3,
  planning: Calendar,
  maintenance: Zap,
  floor: LayoutDashboard,
  kiosk: Scan,
  client: ExternalLink,
  partner: Briefcase,
  audit: ShieldCheck,
  admin: Sliders,
};

export const AppLauncherModal: React.FC = () => {
  const { isLauncherOpen, closeLauncher, activePortal, switchPortal, allowedPortals } = usePortal();
  const { user } = useAuth();
  const [search, setSearch] = useState('');

  if (!isLauncherOpen) return null;

  const filteredPortals = allowedPortals.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.code.toLowerCase().includes(search.toLowerCase()) ||
      p.description.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        backgroundColor: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        animation: 'fadeIn 0.15s ease-out',
      }}
      onClick={closeLauncher}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '1060px',
          maxHeight: '90vh',
          backgroundColor: '#FFFFFF',
          borderRadius: '20px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          border: '1px solid #E2E8F0',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '24px 32px',
            borderBottom: '1px solid #E2E8F0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'linear-gradient(135deg, #F8FAFC 0%, #FFFFFF 100%)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div
              style={{
                width: '46px',
                height: '46px',
                borderRadius: '12px',
                backgroundColor: 'var(--portal-accent, #3B82F6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FFFFFF',
                boxShadow: '0 8px 16px -4px rgba(59, 130, 246, 0.3)',
              }}
            >
              <Grid size={24} />
            </div>
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#0F172A', margin: 0 }}>
                Enterprise App Launcher & Portal Switcher
              </h2>
              <p style={{ fontSize: '13px', color: '#64748B', margin: '4px 0 0 0' }}>
                Signed in as <strong style={{ color: '#0F172A' }}>{user?.name}</strong> • Available role portals: {allowedPortals.length}
              </p>
            </div>
          </div>

          <button
            onClick={closeLauncher}
            style={{
              padding: '8px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: '#F1F5F9',
              color: '#64748B',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Search Bar */}
        <div style={{ padding: '16px 32px', backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              backgroundColor: '#FFFFFF',
              border: '1px solid #CBD5E1',
              borderRadius: '12px',
              padding: '10px 16px',
            }}
          >
            <Search size={18} color="#94A3B8" />
            <input
              type="text"
              placeholder="Search portal by name, role or module (e.g. HR, Production, Finance, QC, Floor)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                border: 'none',
                outline: 'none',
                width: '100%',
                fontSize: '14px',
                color: '#0F172A',
              }}
              autoFocus
            />
          </div>
        </div>

        {/* Portals Grid */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px 32px' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))',
              gap: '18px',
            }}
          >
            {filteredPortals.map((portal) => {
              const IconComp = ICON_MAP[portal.slug] || Layers;
              const isCurrent = activePortal === portal.slug;
              const accent = portal.theme_json.accent || '#3B82F6';

              return (
                <div
                  key={portal.slug}
                  onClick={() => switchPortal(portal.slug)}
                  style={{
                    border: isCurrent ? `2px solid ${accent}` : '1px solid #E2E8F0',
                    borderRadius: '16px',
                    padding: '20px',
                    backgroundColor: isCurrent ? `${accent}0A` : '#FFFFFF',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    position: 'relative',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    boxShadow: isCurrent
                      ? `0 10px 25px -5px ${accent}25`
                      : '0 2px 4px rgba(0, 0, 0, 0.02)',
                  }}
                  onMouseEnter={(e) => {
                    if (!isCurrent) {
                      e.currentTarget.style.borderColor = accent;
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 12px 20px -8px rgba(0, 0, 0, 0.1)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isCurrent) {
                      e.currentTarget.style.borderColor = '#E2E8F0';
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.02)';
                    }
                  }}
                >
                  {isCurrent && (
                    <div
                      style={{
                        position: 'absolute',
                        top: '12px',
                        right: '12px',
                        backgroundColor: accent,
                        color: '#FFFFFF',
                        fontSize: '11px',
                        fontWeight: 700,
                        padding: '3px 8px',
                        borderRadius: '20px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      <CheckCircle size={12} /> Active
                    </div>
                  )}

                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '14px' }}>
                      <div
                        style={{
                          width: '44px',
                          height: '44px',
                          borderRadius: '12px',
                          backgroundColor: `${accent}18`,
                          color: accent,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <IconComp size={22} />
                      </div>
                      <div>
                        <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#0F172A', margin: 0 }}>
                          {portal.name}
                        </h3>
                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: 600,
                            color: accent,
                            textTransform: 'uppercase',
                            letterSpacing: '0.04em',
                          }}
                        >
                          {portal.theme_json.tag || portal.code}
                        </span>
                      </div>
                    </div>

                    <p style={{ fontSize: '13px', color: '#64748B', lineHeight: '1.45', margin: 0 }}>
                      {portal.description}
                    </p>
                  </div>

                  <div
                    style={{
                      marginTop: '18px',
                      paddingTop: '12px',
                      borderTop: '1px solid #F1F5F9',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontSize: '12px',
                      color: '#94A3B8',
                    }}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Clock size={12} /> {portal.session_timeout_minutes}m timeout
                    </span>

                    <span
                      style={{
                        color: accent,
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      Open OS <ExternalLink size={12} />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredPortals.length === 0 && (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: '#94A3B8' }}>
              <Search size={36} style={{ margin: '0 auto 12px auto', opacity: 0.5 }} />
              <p style={{ fontSize: '15px', fontWeight: 600, color: '#475569' }}>No portals match "{search}"</p>
              <p style={{ fontSize: '13px' }}>Try searching for HR, Finance, Manager, QC, or Stores.</p>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div
          style={{
            padding: '16px 32px',
            backgroundColor: '#F8FAFC',
            borderTop: '1px solid #E2E8F0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '12px',
            color: '#64748B',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={14} color="#F59E0B" />
            <span>Single Sign-On (SSO) active — Seamless switching across all authorized portals</span>
          </div>

          <div style={{ display: 'flex', gap: '16px' }}>
            <span>Need more access? Contact IT Admin</span>
          </div>
        </div>
      </div>
    </div>
  );
};
