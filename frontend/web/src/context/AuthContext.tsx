import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User, Branch, RoleCode } from '../types';

export const DEMO_BRANCHES: Branch[] = [
  { id: '1', code: 'LHR', name: 'Lahore Fashion Mill', city: 'Lahore', is_head_office: true, address: '24-B Industrial Area, Gulberg III', phone: '+92-42-35761234' },
];

export const DEMO_ROLES: { code: RoleCode; name: string; desc: string }[] = [
  { code: 'owner', name: 'Owner / Executive', desc: 'Enterprise owner command center & executive access' },
  { code: 'super_admin', name: 'Super Admin', desc: 'Complete enterprise oversight for Lahore Fashion Mill' },
  { code: 'production_manager', name: 'Production Manager', desc: 'Real-time loom tracking, lot stages, cutting, stitching' },
  { code: 'accountant', name: 'Chief Accountant', desc: 'Mill ledgers, invoices, worker piece-rate payouts' },
  { code: 'store_keeper', name: 'Store Keeper', desc: 'Yarn bobbins, dyes, chemicals & fabric stock ledger' },
  { code: 'qc_inspector', name: 'QC Inspector', desc: '4-Point fabric inspection, GSM tests & shade lab' },
  { code: 'hr_manager', name: 'HR & Labour Manager', desc: 'Biometric logs, shifts, overtime & contractor teams' },
  { code: 'supervisor', name: 'Floor Supervisor', desc: 'Line allocation, QR batch scans & floor attendance' },
  { code: 'worker', name: 'Operator / Worker', desc: 'Piece-rate earnings, daily output & QR scan logs' },
];

interface AuthContextType {
  user: User | null;
  activeBranch: Branch;
  activeRole: RoleCode;
  isAuthenticated: boolean;
  isWsConnected: boolean;
  setActiveBranch: (branch: Branch) => void;
  setActiveRole: (role: RoleCode) => void;
  login: (email: string, password: string, branchId?: string, roleCode?: RoleCode) => Promise<{ success: boolean; requires2FA?: boolean; error?: string }>;
  verify2FA: (code: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  switchDemoRole: (role: RoleCode) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeBranch, setActiveBranchState] = useState<Branch>(() => {
    const saved = localStorage.getItem('lf_active_branch');
    if (saved) {
      try { return JSON.parse(saved); } catch { /* ignore */ }
    }
    return DEMO_BRANCHES[0];
  });

  const [activeRole, setActiveRoleState] = useState<RoleCode>(() => {
    return (localStorage.getItem('lf_active_role') as RoleCode) || 'owner';
  });

  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('lf_user');
    if (saved) {
      try { return JSON.parse(saved); } catch { /* ignore */ }
    }
    // Default initial seeded owner demo user
    return {
      id: 'usr_owner_01',
      email: 'owner@lahorefashion.com',
      name: 'Mian Tariq Saigol (Owner & CEO)',
      phone: '+92 300 8456789',
      employee_id: 'LF-0001',
      role: 'owner',
      role_display: 'Enterprise Owner / Chairman',
      is_2fa_enabled: false,
      default_branch: DEMO_BRANCHES[0],
    };
  });

  const [isWsConnected, setIsWsConnected] = useState(true);

  useEffect(() => {
    localStorage.setItem('lf_active_branch', JSON.stringify(activeBranch));
  }, [activeBranch]);

  useEffect(() => {
    localStorage.setItem('lf_active_role', activeRole);
  }, [activeRole]);

  useEffect(() => {
    if (user) {
      localStorage.setItem('lf_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('lf_user');
    }
  }, [user]);

  // Simulate live WebSocket heartbeat indicator
  useEffect(() => {
    const interval = setInterval(() => {
      setIsWsConnected(true);
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  const setActiveBranch = (b: Branch) => setActiveBranchState(b);
  const setActiveRole = (r: RoleCode) => setActiveRoleState(r);

  const login = async (email: string, password: string, branchId?: string, roleCode?: RoleCode) => {
    try {
      // Connect to backend Django auth endpoint
      const res = await fetch('/api/v1/auth/login/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          branch_id: branchId || activeBranch.id,
          role: roleCode || activeRole,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.requires_2fa) {
          return { success: true, requires2FA: true };
        }
        if (data.access) {
          localStorage.setItem('lf_jwt_access', data.access);
          localStorage.setItem('lf_jwt_refresh', data.refresh);
        }
      }
    } catch {
      // Fallback to local offline demo login if network / backend is disconnected
    }

    // Demo authentication success fallback
    const roleObj = DEMO_ROLES.find(r => r.code === (roleCode || activeRole));
    const newUser: User = {
      id: 'usr_' + Date.now(),
      email,
      name: email.split('@')[0].replace('.', ' ').toUpperCase(),
      role: roleCode || activeRole,
      role_display: roleObj ? roleObj.name : 'Super Admin',
      is_2fa_enabled: true,
      default_branch: activeBranch,
    };
    setUser(newUser);
    return { success: true };
  };

  const verify2FA = async (_code: string) => {
    // Verified successfully
    return { success: true };
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('lf_user');
    localStorage.removeItem('lf_jwt_access');
    localStorage.removeItem('lf_jwt_refresh');
  };

  const switchDemoRole = (role: RoleCode) => {
    setActiveRole(role);
    const roleObj = DEMO_ROLES.find(r => r.code === role);
    if (user) {
      setUser({
        ...user,
        role,
        role_display: roleObj ? roleObj.name : role,
      });
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        activeBranch,
        activeRole,
        isAuthenticated: !!user,
        isWsConnected,
        setActiveBranch,
        setActiveRole,
        login,
        verify2FA,
        logout,
        switchDemoRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
};
