import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { usePortal } from '../PortalContext';
import {
  Layers,
  Lock,
  Mail,
  Building2,
  Package,
  AlertTriangle,
  ClipboardCheck,
  TrendingUp,
  Loader2,
  CheckCircle,
} from 'lucide-react';

export const ManagerLoginView: React.FC<{ onSuccessfulLogin?: () => void }> = ({ onSuccessfulLogin }) => {
  const { login } = useAuth();
  const { switchPortal, openLauncher } = usePortal();

  const [email, setEmail] = useState('manager.production@lahorefashion.com');
  const [password, setPassword] = useState('Password123!');
  const [branch, setBranch] = useState('1'); // Lahore HO
  const [rememberDevice, setRememberDevice] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('http://localhost:8000/api/v1/auth/portal/manager/login/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          branch_id: branch,
          remember_device: rememberDevice,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        localStorage.setItem('lf_token', data.access);
        localStorage.setItem('lf_refresh', data.refresh);
        localStorage.setItem('lf_active_portal', 'manager');
        switchPortal('manager');
        await login(email, password, branch, 'production_manager');
        if (onSuccessfulLogin) onSuccessfulLogin();
      } else {
        if (data.code === 'wrong_portal_access_denied') {
          setError(
            'Wrong portal: You do not have Production Manager privileges. Please open the App Launcher to access your assigned workspace.'
          );
        } else {
          // Demo fallback
          localStorage.setItem('lf_active_portal', 'manager');
          switchPortal('manager');
          await login(email, password, branch, 'production_manager');
          if (onSuccessfulLogin) onSuccessfulLogin();
        }
      }
    } catch {
      localStorage.setItem('lf_active_portal', 'manager');
      switchPortal('manager');
      await login(email, password, branch, 'production_manager');
      if (onSuccessfulLogin) onSuccessfulLogin();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        minHeight: '100vh',
        backgroundColor: '#F8FAFC',
        fontFamily: "'Inter', sans-serif",
      }}
    >
      {/* ── Left Side: Form Card ────────────────────────────────────────────── */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '48px 64px',
          backgroundColor: '#FFFFFF',
          maxWidth: '580px',
          boxShadow: '10px 0 30px rgba(0,0,0,0.04)',
          zIndex: 10,
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                backgroundColor: '#1E40AF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FFFFFF',
                fontWeight: 800,
                fontSize: '18px',
                boxShadow: '0 8px 16px -4px rgba(30, 64, 175, 0.4)',
              }}
            >
              MO
            </div>
            <div>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#2563EB', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Lahore Fashion ERP
              </div>
              <div style={{ fontSize: '18px', fontWeight: 800, color: '#0F172A' }}>
                Manager OS — Operations Control
              </div>
            </div>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#0F172A', margin: '0 0 6px 0' }}>
              Operations Login
            </h1>
            <p style={{ fontSize: '14px', color: '#64748B', margin: 0 }}>
              Plan, track and control production seamlessly across all departments.
            </p>
          </div>

          {error && (
            <div
              style={{
                padding: '12px 16px',
                borderRadius: '10px',
                backgroundColor: '#FEF2F2',
                border: '1px solid #FCA5A5',
                color: '#B91C1C',
                fontSize: '13px',
                marginBottom: '20px',
              }}
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSignIn} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                Email / Employee ID
              </label>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  border: '1px solid #CBD5E1',
                }}
              >
                <Mail size={16} color="#94A3B8" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  style={{ border: 'none', outline: 'none', width: '100%', fontSize: '14px' }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                Password
              </label>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  border: '1px solid #CBD5E1',
                }}
              >
                <Lock size={16} color="#94A3B8" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  style={{ border: 'none', outline: 'none', width: '100%', fontSize: '14px' }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                Plant / Mill Location
              </label>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 12px',
                  borderRadius: '10px',
                  border: '1px solid #CBD5E1',
                }}
              >
                <Building2 size={16} color="#94A3B8" />
                <select
                  value={branch}
                  onChange={(e) => setBranch(e.target.value)}
                  style={{ border: 'none', outline: 'none', width: '100%', fontSize: '13px', backgroundColor: 'transparent' }}
                >
                  <option value="1">Lahore Main Mill (HO)</option>
                  <option value="2">Faisalabad Weaving Unit</option>
                  <option value="3">Multan Processing</option>
                  <option value="4">Karachi Export Hub</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#475569', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={rememberDevice}
                  onChange={(e) => setRememberDevice(e.target.checked)}
                />
                Remember this workstation
              </label>
              <span style={{ fontSize: '12px', color: '#2563EB', fontWeight: 600, cursor: 'pointer' }}>
                Reset Access
              </span>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '12px',
                borderRadius: '10px',
                border: 'none',
                backgroundColor: '#1E40AF',
                color: '#FFFFFF',
                fontSize: '14px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 8px 16px -4px rgba(30, 64, 175, 0.4)',
                marginTop: '8px',
              }}
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle size={18} />}
              Sign In to Manager OS
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: '24px', fontSize: '13px', color: '#64748B' }}>
            Not an Operations Manager?{' '}
            <button
              onClick={openLauncher}
              style={{ background: 'none', border: 'none', color: '#1E40AF', fontWeight: 700, cursor: 'pointer', padding: 0, textDecoration: 'underline' }}
            >
              Open App Launcher
            </button>
          </div>
        </div>

        <div style={{ paddingTop: '24px', borderTop: '1px solid #F1F5F9', fontSize: '11px', color: '#94A3B8', display: 'flex', justifyContent: 'space-between' }}>
          <span>Lahore Fashion ERP v2.4 (Manager OS)</span>
          <span>Fast-Response Shop-Floor Mesh</span>
        </div>
      </div>

      {/* ── Right Side: Manager Hero Panel ──────────────────────────────────── */}
      <div
        style={{
          flex: 1.4,
          background: 'linear-gradient(135deg, #1E3A8A 0%, #1E40AF 50%, #1D4ED8 100%)',
          color: '#FFFFFF',
          padding: '64px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          position: 'relative',
        }}
      >
        <div>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              borderRadius: '20px',
              backgroundColor: 'rgba(255, 255, 255, 0.12)',
              fontSize: '12px',
              fontWeight: 600,
              marginBottom: '24px',
            }}
          >
            <TrendingUp size={14} color="#93C5FD" />
            <span>Mill Operations Control Center</span>
          </div>

          <h2 style={{ fontSize: '36px', fontWeight: 800, lineHeight: '1.2', margin: '0 0 16px 0', maxWidth: '580px' }}>
            Synchronize 9 Departments with Zero Bottlenecks
          </h2>
          <p style={{ fontSize: '16px', color: '#DBEAFE', lineHeight: '1.6', margin: '0 0 40px 0', maxWidth: '540px' }}>
            Live loom counters, bundle transfers, color lot recipes, stitching line balancing and daily production dispatching.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '18px', maxWidth: '680px' }}>
            {[
              { icon: Layers, title: 'Live Production', desc: 'Real-time output vs daily targets across all active departments.' },
              { icon: Package, title: 'Orders & Lots', desc: 'Critical path delivery tracking with delay mitigation alerts.' },
              { icon: AlertTriangle, title: 'Quality & Delays', desc: '4-Point fabric inspection grading and line stoppage alerts.' },
              { icon: ClipboardCheck, title: 'Approvals Inbox', desc: 'Overtime, stock transfers and batch discrepancy signoffs.' },
            ].map((t, i) => (
              <div
                key={i}
                style={{
                  padding: '20px',
                  borderRadius: '16px',
                  backgroundColor: 'rgba(255, 255, 255, 0.08)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.14)',
                }}
              >
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    backgroundColor: 'rgba(255, 255, 255, 0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '12px',
                    color: '#93C5FD',
                  }}
                >
                  <t.icon size={20} />
                </div>
                <h4 style={{ fontSize: '15px', fontWeight: 700, margin: '0 0 6px 0' }}>{t.title}</h4>
                <p style={{ fontSize: '12px', color: '#DBEAFE', lineHeight: '1.45', margin: 0 }}>{t.desc}</p>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '32px', paddingTop: '32px', borderTop: '1px solid rgba(255, 255, 255, 0.1)', fontSize: '12px', color: '#BFDBFE' }}>
          <span>✓ Sub-Second QR Lot Scanning</span>
          <span>✓ IoT Loom Telemetry</span>
          <span>✓ Automated Line Balancing</span>
        </div>
      </div>
    </div>
  );
};
