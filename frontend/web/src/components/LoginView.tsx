import React, { useState } from 'react';
import { useAuth, DEMO_BRANCHES, DEMO_ROLES } from '../context/AuthContext';
import { 
  Building2, 
  ShieldCheck, 
  Sparkles, 
  Lock, 
  Mail, 
  ArrowRight, 
  KeyRound,
  CheckCircle2
} from 'lucide-react';
import type { RoleCode } from '../types';

export const LoginView: React.FC = () => {
  const { login, verify2FA } = useAuth();
  const [email, setEmail] = useState('owner@lahorefashion.com');
  const [password, setPassword] = useState('ChangeMe@12345');
  const branchId = DEMO_BRANCHES[0].id;
  const [roleCode, setRoleCode] = useState<RoleCode>('super_admin');
  
  // 2FA flow is dormant per PROMPT 9 (AUTH_2FA_ENABLED=false default)
  const [is2FAStep, setIs2FAStep] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password, branchId, roleCode);
      // 2FA disabled by default; directly authenticate user
    } catch {
      setError('Unable to authenticate with mill server. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await verify2FA(otpCode);
    } catch {
      setError('Invalid OTP code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemoLogin = (role: RoleCode, demoEmail: string) => {
    setRoleCode(role);
    setEmail(demoEmail);
    setPassword('ChangeMe@12345');
    login(demoEmail, 'ChangeMe@12345', branchId, role);
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'radial-gradient(ellipse at top, #0f1c3a 0%, #080c14 70%)',
      padding: '20px',
    }}>
      <div style={{
        width: '100%',
        maxWidth: '1060px',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
        background: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: 'var(--radius-xl)',
        overflow: 'hidden',
        boxShadow: '0 25px 60px rgba(0, 0, 0, 0.7)',
      }}>
        {/* Left Side: Brand & Manufacturing Highlights */}
        <div style={{
          padding: '40px',
          background: 'linear-gradient(145deg, rgba(16, 185, 129, 0.15) 0%, rgba(6, 182, 212, 0.08) 50%, rgba(15, 23, 42, 0.9) 100%)',
          borderRight: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
              <div style={{
                width: '46px',
                height: '46px',
                borderRadius: 'var(--radius-md)',
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 16px rgba(16, 185, 129, 0.4)',
              }}>
                <Sparkles size={24} color="white" />
              </div>
              <div>
                <h2 style={{ fontSize: '1.25rem', color: 'white', letterSpacing: '0.04em' }}>LAHORE FASHION</h2>
                <span style={{ fontSize: '0.72rem', color: 'var(--emerald-light)', letterSpacing: '0.08em', fontWeight: 600 }}>TEXTILE ERP SYSTEM</span>
              </div>
            </div>

            <h1 style={{ fontSize: '1.9rem', lineHeight: '1.25', color: 'white', marginBottom: '14px' }}>
              From Yarn to Global Fashion — <span style={{ color: 'var(--emerald-light)' }}>Integrated.</span>
            </h1>

            <p style={{ color: 'var(--text-dim)', fontSize: '0.92rem', lineHeight: '1.6', marginBottom: '28px' }}>
              Enterprise multi-branch textile manufacturing control: Real-time spinning, weaving, wet processing, laser cutting, piece-rate payroll, and export challans.
            </p>

            {/* Feature Bullets */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[
                'Multi-Branch Geofenced Access (Lahore, FSD, Multan, Karachi)',
                'FastAPI Real-Time WebSocket Loom Telemetry',
                'Role-Based Access Control (RBAC) across 15 Mill Modules',
                'Hardware 2FA / TOTP Brute-Force Protected',
              ].map((text, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.85rem', color: 'var(--text-main)' }}>
                  <CheckCircle2 size={16} color="var(--emerald)" />
                  <span>{text}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{
            marginTop: '32px',
            paddingTop: '20px',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            fontSize: '0.75rem',
            color: 'var(--text-sub)',
            display: 'flex',
            justifyContent: 'space-between',
          }}>
            <span>4 Mills Connected</span>
            <span>68 Running Looms</span>
            <span>240 Workers</span>
          </div>
        </div>

        {/* Right Side: Sign-In Form */}
        <div style={{ padding: '40px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          {!is2FAStep ? (
            <div>
              <div style={{ marginBottom: '24px' }}>
                <h2 style={{ fontSize: '1.45rem', color: 'white', marginBottom: '6px' }}>Mill Portal Sign In</h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  Enter your credentials and select your active mill location
                </p>
              </div>

              {error && (
                <div style={{
                  background: 'rgba(244, 63, 94, 0.15)',
                  border: '1px solid rgba(244, 63, 94, 0.3)',
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-md)',
                  color: '#fb7185',
                  fontSize: '0.85rem',
                  marginBottom: '18px',
                }}>
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-dim)', marginBottom: '6px' }}>
                    Email Address
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="email"
                      className="input-control"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      placeholder="name@lahorefashion.com"
                      style={{ paddingLeft: '38px' }}
                    />
                    <Mail size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '13px' }} />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-dim)', marginBottom: '6px' }}>
                    Password
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="password"
                      className="input-control"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      placeholder="••••••••••••"
                      style={{ paddingLeft: '38px' }}
                    />
                    <Lock size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '13px' }} />
                  </div>
                </div>

                {/* Branch Selection */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-dim)', marginBottom: '6px' }}>
                      Manufacturing Facility
                    </label>
                    <div style={{ position: 'relative' }}>
                      <div
                        className="input-control"
                        style={{ paddingLeft: '36px', display: 'flex', alignItems: 'center', color: '#f8fafc', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-light)' }}
                      >
                        Lahore Fashion Mill (Main Unit)
                      </div>
                      <Building2 size={16} color="var(--emerald)" style={{ position: 'absolute', left: '12px', top: '13px' }} />
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-dim)', marginBottom: '6px' }}>
                      Operational Role
                    </label>
                    <div style={{ position: 'relative' }}>
                      <select
                        className="input-control"
                        value={roleCode}
                        onChange={(e) => setRoleCode(e.target.value as RoleCode)}
                        style={{ paddingLeft: '36px', appearance: 'none', cursor: 'pointer' }}
                      >
                        {DEMO_ROLES.map(r => (
                          <option key={r.code} value={r.code} style={{ background: '#0f172a' }}>
                            {r.name}
                          </option>
                        ))}
                      </select>
                      <ShieldCheck size={16} color="#c084fc" style={{ position: 'absolute', left: '12px', top: '13px' }} />
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn btn-primary"
                  style={{ width: '100%', padding: '12px', marginTop: '6px' }}
                >
                  <span>{loading ? 'Authenticating...' : 'Sign In to Mill Dashboard'}</span>
                  <ArrowRight size={16} />
                </button>
              </form>

              {/* 1-Click Quick Demo Login Switcher */}
              <div style={{ marginTop: '24px', paddingTop: '18px', borderTop: '1px solid var(--border-light)' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-sub)', marginBottom: '10px' }}>
                  QUICK DEMO ONE-CLICK SIGN IN:
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => handleQuickDemoLogin('super_admin', 'owner@lahorefashion.com')}
                    className="btn btn-secondary"
                    style={{ fontSize: '0.78rem', padding: '7px 10px', justifyContent: 'flex-start' }}
                  >
                    <span>👑 Owner Admin</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickDemoLogin('production_manager', 'prod.manager@lahorefashion.com')}
                    className="btn btn-secondary"
                    style={{ fontSize: '0.78rem', padding: '7px 10px', justifyContent: 'flex-start' }}
                  >
                    <span>🧵 Prod. Manager</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickDemoLogin('accountant', 'accounts@lahorefashion.com')}
                    className="btn btn-secondary"
                    style={{ fontSize: '0.78rem', padding: '7px 10px', justifyContent: 'flex-start' }}
                  >
                    <span>💰 Accountant</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickDemoLogin('store_keeper', 'store@lahorefashion.com')}
                    className="btn btn-secondary"
                    style={{ fontSize: '0.78rem', padding: '7px 10px', justifyContent: 'flex-start' }}
                  >
                    <span>📦 Store Keeper</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* 2FA Challenge Step */
            <div className="animate-fade-in">
              <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                <div style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '50%',
                  background: 'rgba(16, 185, 129, 0.15)',
                  border: '1px solid var(--emerald)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 14px',
                }}>
                  <KeyRound size={28} color="var(--emerald)" />
                </div>
                <h2 style={{ fontSize: '1.35rem', color: 'white', marginBottom: '6px' }}>Two-Factor Authentication</h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  Enter the 6-digit verification code from your Google Authenticator or SMS
                </p>
              </div>

              <form onSubmit={handleVerify2FA} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <input
                    type="text"
                    maxLength={6}
                    autoFocus
                    className="input-control"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="0 0 0 0 0 0"
                    style={{
                      textAlign: 'center',
                      fontSize: '1.6rem',
                      letterSpacing: '0.35em',
                      fontFamily: 'var(--font-mono)',
                      padding: '14px',
                    }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || otpCode.length < 6}
                  className="btn btn-primary"
                  style={{ width: '100%', padding: '12px' }}
                >
                  <span>Verify & Unlock Mill</span>
                  <ArrowRight size={16} />
                </button>

                <button
                  type="button"
                  onClick={() => setIs2FAStep(false)}
                  className="btn btn-secondary"
                  style={{ width: '100%', padding: '10px', fontSize: '0.8rem' }}
                >
                  <span>Back to Credentials</span>
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
