import React, { useState } from 'react';
import { PORTAL_REGISTRY } from '../portalRegistry';
import type { PortalDefinition } from '../portalRegistry';
import { usePortal } from '../PortalContext';
import type { PortalSlug } from '../../types';
import { Save } from 'lucide-react';

export const PortalManagerView: React.FC = () => {
  const { switchPortal } = usePortal();
  const [portalsList, setPortalsList] = useState<PortalDefinition[]>(Object.values(PORTAL_REGISTRY));
  const [selectedSlug, setSelectedSlug] = useState<PortalSlug>('hr');

  const currentPortal = portalsList.find((p) => p.slug === selectedSlug) || portalsList[0];

  // Dormant: 2FA is centrally disabled in settings (AUTH_2FA_ENABLED=false)
  // const handleToggle2FA = (slug: PortalSlug) => {
  //   setPortalsList((prev) =>
  //     prev.map((p) => (p.slug === slug ? { ...p, require_2fa: !p.require_2fa } : p))
  //   );
  // };

  const handleUpdateTimeout = (slug: PortalSlug, minutes: number) => {
    setPortalsList((prev) =>
      prev.map((p) => (p.slug === slug ? { ...p, session_timeout_minutes: minutes } : p))
    );
  };

  const handleSavePortalConfig = () => {
    alert(`Portal configuration for [${currentPortal.name}] saved to database!`);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* ── Page Header ────────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#38BDF8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Admin Console
            </span>
            <span style={{ fontSize: '11px', backgroundColor: '#E0F2FE', color: '#0369A1', padding: '2px 8px', borderRadius: '12px', fontWeight: 700 }}>
              Config-Driven Portals
            </span>
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#0F172A', margin: 0 }}>
            Enterprise Portal Manager & Security Policies
          </h1>
        </div>

        <button
          onClick={handleSavePortalConfig}
          style={{
            padding: '9px 18px',
            borderRadius: '8px',
            border: 'none',
            backgroundColor: '#0F172A',
            color: '#FFFFFF',
            fontSize: '13px',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <Save size={16} /> Save Changes to DB
        </button>
      </div>

      {/* ── Main Layout: Left Portal Selector & Right Editor ───────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '24px' }}>
        {/* Left: Portals List */}
        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '16px',
            border: '1px solid #E2E8F0',
            padding: '16px',
            maxHeight: '75vh',
            overflowY: 'auto',
          }}
        >
          <div style={{ fontSize: '12px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', marginBottom: '12px', paddingLeft: '8px' }}>
            Configured Portals ({portalsList.length})
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {portalsList.map((portal) => {
              const isSelected = portal.slug === selectedSlug;
              return (
                <div
                  key={portal.slug}
                  onClick={() => setSelectedSlug(portal.slug)}
                  style={{
                    padding: '12px 14px',
                    borderRadius: '10px',
                    backgroundColor: isSelected ? '#EFF6FF' : 'transparent',
                    border: isSelected ? '1px solid #BFDBFE' : '1px solid transparent',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: isSelected ? '#1E40AF' : '#0F172A' }}>
                      {portal.name}
                    </div>
                    <div style={{ fontSize: '11px', color: '#64748B' }}>
                      /{portal.slug} • {portal.session_timeout_minutes}m timeout
                    </div>
                  </div>

                  <span
                    style={{
                      width: '10px',
                      height: '10px',
                      borderRadius: '50%',
                      backgroundColor: portal.theme_json.accent,
                    }}
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Selected Portal Configuration Editor */}
        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '16px',
            border: '1px solid #E2E8F0',
            padding: '28px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid #F1F5F9' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div
                style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: '12px',
                  backgroundColor: currentPortal.theme_json.accent,
                  color: '#FFFFFF',
                  fontWeight: 800,
                  fontSize: '18px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {currentPortal.code.substring(0, 2)}
              </div>
              <div>
                <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                  {currentPortal.name}
                </h2>
                <span style={{ fontSize: '12px', color: '#64748B' }}>
                  Slug: <code style={{ backgroundColor: '#F1F5F9', padding: '2px 6px', borderRadius: '4px' }}>/{currentPortal.slug}</code>
                </span>
              </div>
            </div>

            <button
              onClick={() => switchPortal(currentPortal.slug)}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                border: '1px solid #CBD5E1',
                backgroundColor: '#FFFFFF',
                color: '#1E293B',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Open This Portal
            </button>
          </div>

          {/* Configuration Form Sections */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* 1. Login Copy & Branding */}
            <div>
              <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#0F172A', margin: '0 0 12px 0' }}>
                1. Login Page Branding & Typography
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                    Login Title
                  </label>
                  <input
                    type="text"
                    defaultValue={currentPortal.login_title}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '13px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                    Brand Tag / Accent Label
                  </label>
                  <input
                    type="text"
                    defaultValue={currentPortal.theme_json.tag}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '13px' }}
                  />
                </div>
              </div>
            </div>

            {/* 2. Security & Session Policies */}
            <div>
              <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#0F172A', margin: '0 0 12px 0' }}>
                2. Security & Session Timeout Policy
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div style={{ padding: '14px', borderRadius: '10px', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: '#0F172A' }}>Two-Factor Authentication (2FA)</div>
                      <div style={{ fontSize: '11px', color: '#64748B' }}>Centrally disabled in system config (AUTH_2FA_ENABLED=false)</div>
                    </div>
                    <span
                      style={{
                        padding: '4px 10px',
                        borderRadius: '12px',
                        backgroundColor: '#F1F5F9',
                        color: '#64748B',
                        fontWeight: 700,
                        fontSize: '11px',
                        border: '1px solid #E2E8F0',
                      }}
                    >
                      DISABLED (OFF)
                    </span>
                  </div>
                </div>

                <div style={{ padding: '14px', borderRadius: '10px', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0' }}>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#0F172A' }}>Inactivity Auto-Lockout</div>
                  <div style={{ fontSize: '11px', color: '#64748B', marginBottom: '8px' }}>
                    Lock workstation after idle duration
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {[15, 30, 60, 120].map((mins) => (
                      <button
                        key={mins}
                        onClick={() => handleUpdateTimeout(currentPortal.slug, mins)}
                        style={{
                          padding: '4px 10px',
                          borderRadius: '6px',
                          border: currentPortal.session_timeout_minutes === mins ? '2px solid #0F172A' : '1px solid #CBD5E1',
                          backgroundColor: currentPortal.session_timeout_minutes === mins ? '#0F172A' : '#FFFFFF',
                          color: currentPortal.session_timeout_minutes === mins ? '#FFFFFF' : '#334155',
                          fontSize: '11px',
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        {mins}m
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* 3. Authorized Roles Matrix */}
            <div>
              <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#0F172A', margin: '0 0 12px 0' }}>
                3. Role Authorization Matrix
              </h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {['super_admin', 'branch_admin', 'production_manager', 'accountant', 'store_keeper', 'qc_inspector', 'hr_manager', 'supervisor', 'worker'].map((role) => {
                  const isAllowed = currentPortal.allowed_roles.includes(role) || role === 'super_admin';
                  return (
                    <span
                      key={role}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '20px',
                        backgroundColor: isAllowed ? '#EFF6FF' : '#F1F5F9',
                        border: isAllowed ? '1px solid #BFDBFE' : '1px solid #CBD5E1',
                        color: isAllowed ? '#1D4ED8' : '#94A3B8',
                        fontSize: '12px',
                        fontWeight: 600,
                      }}
                    >
                      {isAllowed ? '✓ ' : ''}{role}
                    </span>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
