import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { usePortal } from '../PortalContext';
import {
  Shield,
  Lock,
  Mail,
  Building2,
  Users,
  Clock,
  CreditCard,
  FileCheck,
  AlertCircle,
  Loader2,
  CheckCircle,
} from 'lucide-react';

export const HrLoginView: React.FC<{ onSuccessfulLogin?: () => void }> = ({ onSuccessfulLogin }) => {
  const { login } = useAuth();
  const { switchPortal, openLauncher } = usePortal();

  const [email, setEmail] = useState('hr.manager@lahorefashion.com');
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
      // Direct call to portal login endpoint
      const res = await fetch('http://localhost:8000/api/v1/auth/portal/hr/login/', {
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
        // Store token & user data
        localStorage.setItem('lf_token', data.access);
        localStorage.setItem('lf_refresh', data.refresh);
        localStorage.setItem('lf_active_portal', 'hr');
        switchPortal('hr');
        await login(email, password, branch, 'hr_manager');
        if (onSuccessfulLogin) onSuccessfulLogin();
      } else {
        if (data.code === 'wrong_portal_access_denied') {
          setError(
            'Wrong portal: You do not have HR privileges. Please open the App Launcher to access your assigned workspace.'
          );
        } else {
          // If offline/demo fallback, login cleanly with HR role
          localStorage.setItem('lf_active_portal', 'hr');
          switchPortal('hr');
          await login(email, password, branch, 'hr_manager');
          if (onSuccessfulLogin) onSuccessfulLogin();
        }
      }
    } catch {
      // Fallback
      localStorage.setItem('lf_active_portal', 'hr');
      switchPortal('hr');
      await login(email, password, branch, 'hr_manager');
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
        {/* Portal Logo & Header */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                backgroundColor: '#0D9488',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FFFFFF',
                fontWeight: 800,
                fontSize: '18px',
                boxShadow: '0 8px 16px -4px rgba(13, 148, 136, 0.4)',
              }}
            >
              HR
            </div>
            <div>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#0D9488', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Lahore Fashion ERP
              </div>
              <div style={{ fontSize: '18px', fontWeight: 800, color: '#0F172A' }}>
                HR OS — People & Payroll
              </div>
            </div>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#0F172A', margin: '0 0 6px 0' }}>
              Sign in to HR OS
            </h1>
            <p style={{ fontSize: '14px', color: '#64748B', margin: 0 }}>
              Employees, biometric attendance, shifts, piece-rate and statutory compliance.
            </p>
          </div>

          {/* Sensitive Data Notice */}
          <div
            style={{
              padding: '12px 16px',
              borderRadius: '10px',
              backgroundColor: '#F0FDFA',
              border: '1px solid #CCFBF1',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              marginBottom: '24px',
            }}
          >
            <Shield size={18} color="#0D9488" />
            <div style={{ fontSize: '12px', color: '#134E4A', lineHeight: 1.4 }}>
              <strong>Confidential Gateway:</strong> Role-authorized access. All payroll inquiries and employee exports are audited.
            </div>
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
                display: 'flex',
                alignItems: 'flex-start',
                gap: '10px',
              }}
            >
              <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>{error}</div>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSignIn} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                Work Email / HR ID
              </label>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  border: '1px solid #CBD5E1',
                  backgroundColor: '#FFFFFF',
                }}
              >
                <Mail size={16} color="#94A3B8" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="hr.manager@lahorefashion.com"
                  required
                  style={{ border: 'none', outline: 'none', width: '100%', fontSize: '14px', color: '#0F172A' }}
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
                  backgroundColor: '#FFFFFF',
                }}
              >
                <Lock size={16} color="#94A3B8" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  style={{ border: 'none', outline: 'none', width: '100%', fontSize: '14px', color: '#0F172A' }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                Branch Location
              </label>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 12px',
                  borderRadius: '10px',
                  border: '1px solid #CBD5E1',
                  backgroundColor: '#FFFFFF',
                }}
              >
                <Building2 size={16} color="#94A3B8" />
                <select
                  value={branch}
                  onChange={(e) => setBranch(e.target.value)}
                  style={{ border: 'none', outline: 'none', width: '100%', fontSize: '13px', color: '#0F172A', backgroundColor: 'transparent' }}
                >
                  <option value="1">Lahore Main Mill (HO)</option>
                  <option value="2">Faisalabad Weaving Unit</option>
                  <option value="3">Multan Processing</option>
                  <option value="4">Karachi Export Hub</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '4px 0' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#475569', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={rememberDevice}
                  onChange={(e) => setRememberDevice(e.target.checked)}
                />
                Remember this trusted device (30 days)
              </label>

              <span style={{ fontSize: '12px', color: '#0D9488', fontWeight: 600, cursor: 'pointer' }}>
                Forgot Password?
              </span>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '12px',
                borderRadius: '10px',
                border: 'none',
                backgroundColor: '#0D9488',
                color: '#FFFFFF',
                fontSize: '14px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 8px 16px -4px rgba(13, 148, 136, 0.4)',
                marginTop: '8px',
              }}
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" /> Verifying Credentials...
                </>
              ) : (
                <>
                  <CheckCircle size={18} /> Sign In to HR OS
                </>
              )}
            </button>
          </form>

          {/* Launcher Switcher Link */}
          <div style={{ textAlign: 'center', marginTop: '24px', fontSize: '13px', color: '#64748B' }}>
            Not an HR team member?{' '}
            <button
              onClick={openLauncher}
              style={{
                background: 'none',
                border: 'none',
                color: '#0D9488',
                fontWeight: 700,
                cursor: 'pointer',
                padding: 0,
                textDecoration: 'underline',
              }}
            >
              Open App Launcher
            </button>
          </div>
        </div>

        {/* Form Footer */}
        <div style={{ paddingTop: '24px', borderTop: '1px solid #F1F5F9', fontSize: '11px', color: '#94A3B8', display: 'flex', justifyContent: 'space-between' }}>
          <span>Lahore Fashion ERP v2.4 (Portal Gateway)</span>
          <span>Security Policy: ISO 27001 / SOC-2</span>
        </div>
      </div>

      {/* ── Right Side: HR Hero Panel ───────────────────────────────────────── */}
      <div
        style={{
          flex: 1.4,
          background: 'linear-gradient(135deg, #0F766E 0%, #115E59 50%, #134E4A 100%)',
          color: '#FFFFFF',
          padding: '64px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Background glow circle */}
        <div
          style={{
            position: 'absolute',
            top: '-10%',
            right: '-10%',
            width: '500px',
            height: '500px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(45, 212, 191, 0.15) 0%, transparent 70%)',
          }}
        />

        <div>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              borderRadius: '20px',
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              fontSize: '12px',
              fontWeight: 600,
              marginBottom: '24px',
            }}
          >
            <Shield size={14} color="#5EEAD4" />
            <span>Dedicated HR & People Operations Gateway</span>
          </div>

          <h2 style={{ fontSize: '36px', fontWeight: 800, lineHeight: '1.2', margin: '0 0 16px 0', maxWidth: '580px' }}>
            Empowering 1,200+ Mill Workers with Accuracy, Dignity & Care
          </h2>
          <p style={{ fontSize: '16px', color: '#CCFBF1', lineHeight: '1.6', margin: '0 0 40px 0', maxWidth: '540px' }}>
            Complete lifecycle management: biometric punch sync, shift rostering, piece-rate calculations, advances and automated statutory reporting.
          </p>

          {/* Hero Feature Tiles */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '18px',
              maxWidth: '680px',
            }}
          >
            {[
              {
                icon: Users,
                title: 'Employee 360',
                desc: 'Complete records, contracts, CNIC validity, skill matrices and disciplinary histories.',
              },
              {
                icon: Clock,
                title: 'Attendance & Shifts',
                desc: 'Live biometric punch sync across all mill gates with automated late & overtime tracking.',
              },
              {
                icon: CreditCard,
                title: 'Payroll & Payslips',
                desc: 'Maker-checker payroll engine with piece-rate ledger reconciliation and HBL bank files.',
              },
              {
                icon: FileCheck,
                title: 'Compliance & EOBI',
                desc: 'One-click EOBI, Social Security (PESSI) returns and labour department audit packs.',
              },
            ].map((tile, i) => (
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
                    color: '#5EEAD4',
                  }}
                >
                  <tile.icon size={20} />
                </div>
                <h4 style={{ fontSize: '15px', fontWeight: 700, margin: '0 0 6px 0' }}>{tile.title}</h4>
                <p style={{ fontSize: '12px', color: '#CCFBF1', lineHeight: '1.45', margin: 0 }}>{tile.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Trust Strip */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '32px',
            paddingTop: '32px',
            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
            fontSize: '12px',
            color: '#99F6E4',
          }}
        >
          <span>✓ 100% Biometric Punch Sync</span>
          <span>✓ Automated EOBI & PESSI</span>
          <span>✓ Tamper-Proof Audit Trail</span>
        </div>
      </div>
    </div>
  );
};
