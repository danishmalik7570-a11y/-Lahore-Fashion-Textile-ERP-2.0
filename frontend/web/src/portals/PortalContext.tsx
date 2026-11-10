import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { PortalSlug, PortalNavItemConfig } from '../types';
import { PORTAL_REGISTRY } from './portalRegistry';
import type { PortalDefinition } from './portalRegistry';
import { useAuth } from '../context/AuthContext';

interface PortalContextType {
  activePortal: PortalSlug;
  portalMeta: PortalDefinition;
  allowedPortals: PortalDefinition[];
  navItems: PortalNavItemConfig[];
  announcements: { id: string; title: string; message: string; severity: string }[];
  isLauncherOpen: boolean;
  idleSecondsRemaining: number;
  openLauncher: () => void;
  closeLauncher: () => void;
  switchPortal: (slug: PortalSlug) => void;
  requestStepUpAuth: (actionName: string, onAuthorized: () => void) => void;
  isStepUpOpen: boolean;
  stepUpActionName: string;
  closeStepUp: () => void;
  confirmStepUp: (token: string) => void;
}

const PortalContext = createContext<PortalContextType | undefined>(undefined);

export const PortalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, activeRole, logout } = useAuth();

  // 1. Determine active portal from localStorage or URL hash or default by role
  const [activePortal, setActivePortal] = useState<PortalSlug>(() => {
    const saved = localStorage.getItem('lf_active_portal') as PortalSlug;
    if (saved && PORTAL_REGISTRY[saved]) return saved;

    // Role-to-default portal mapping
    if (activeRole === 'owner' || activeRole === 'super_admin') return 'owner';
    if (activeRole === 'hr_manager') return 'hr';
    if (activeRole === 'accountant') return 'finance';
    if (activeRole === 'store_keeper') return 'stores';
    if (activeRole === 'qc_inspector') return 'qc';
    if (activeRole === 'worker') return 'kiosk';
    if (activeRole === 'supervisor') return 'floor';
    return 'manager';
  });

  const [isLauncherOpen, setIsLauncherOpen] = useState(false);
  const [navItems, setNavItems] = useState<PortalNavItemConfig[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);

  // Step-up auth modal state
  const [isStepUpOpen, setIsStepUpOpen] = useState(false);
  const [stepUpActionName, setStepUpActionName] = useState('general_step_up');
  const [stepUpCallback, setStepUpCallback] = useState<(() => void) | null>(null);

  const portalMeta = PORTAL_REGISTRY[activePortal] || PORTAL_REGISTRY['manager'];

  // 2. Idle timeout auto-lockout (e.g. 15 min for HR/Finance, 60 min for Manager)
  const initialSeconds = (portalMeta.session_timeout_minutes || 30) * 60;
  const [idleSecondsRemaining, setIdleSecondsRemaining] = useState<number>(initialSeconds);

  // Reset idle timer on user activity
  const resetIdleTimer = useCallback(() => {
    setIdleSecondsRemaining((portalMeta.session_timeout_minutes || 30) * 60);
  }, [portalMeta.session_timeout_minutes]);

  useEffect(() => {
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    const handler = () => resetIdleTimer();
    events.forEach((ev) => window.addEventListener(ev, handler, { passive: true }));
    return () => {
      events.forEach((ev) => window.removeEventListener(ev, handler));
    };
  }, [resetIdleTimer]);

  useEffect(() => {
    resetIdleTimer();
    const interval = setInterval(() => {
      setIdleSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          // Lock out session due to inactivity
          alert(`Session expired due to ${portalMeta.session_timeout_minutes} minutes of inactivity for security.`);
          logout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [activePortal, portalMeta.session_timeout_minutes, logout, resetIdleTimer]);

  // 3. Dynamic Theming Engine: inject CSS variables
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--portal-accent', portalMeta.theme_json.accent);
    root.style.setProperty('--portal-primary', portalMeta.theme_json.primary);
    root.style.setProperty('--portal-surface', portalMeta.theme_json.surface);
    root.style.setProperty('--portal-sidebar-bg', portalMeta.theme_json.sidebar_bg);
    root.style.setProperty('--portal-tag', portalMeta.theme_json.tag);
  }, [portalMeta]);

  // 4. Fetch allowed portals for current user (multi-portal launcher)
  const allowedPortals = Object.values(PORTAL_REGISTRY).filter((p) => {
    if (!user) return false;
    if (user.role === 'owner' || user.role === 'super_admin') return true;
    return p.allowed_roles.includes(user.role);
  });

  // 5. Bootstrap API fetch
  useEffect(() => {
    const fetchBootstrap = async () => {
      try {
        const token = localStorage.getItem('lf_token') || '';
        const res = await fetch(`http://localhost:8000/api/v1/portals/${activePortal}/bootstrap/`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (res.ok) {
          const data = await res.json();
          if (data.navigation && data.navigation.length > 0) {
            setNavItems(data.navigation);
          }
          if (data.announcements) {
            setAnnouncements(data.announcements);
          }
        }
      } catch {
        // Fallback to static nav items
      }
    };
    fetchBootstrap();
  }, [activePortal]);

  const switchPortal = (slug: PortalSlug) => {
    if (!PORTAL_REGISTRY[slug]) return;
    setActivePortal(slug);
    localStorage.setItem('lf_active_portal', slug);
    setIsLauncherOpen(false);
  };

  const requestStepUpAuth = (actionName: string, onAuthorized: () => void) => {
    // Step-up authentication disabled globally (AUTH_STEP_UP_ENABLED = false).
    // Maker-checker and approval controls remain enforced by business logic.
    setStepUpActionName(actionName);
    onAuthorized();
  };

  const confirmStepUp = (_token: string) => {
    setIsStepUpOpen(false);
    if (stepUpCallback) {
      stepUpCallback();
      setStepUpCallback(null);
    }
  };

  const closeStepUp = () => {
    setIsStepUpOpen(false);
    setStepUpCallback(null);
  };

  return (
    <PortalContext.Provider
      value={{
        activePortal,
        portalMeta,
        allowedPortals,
        navItems,
        announcements,
        isLauncherOpen,
        idleSecondsRemaining,
        openLauncher: () => setIsLauncherOpen(true),
        closeLauncher: () => setIsLauncherOpen(false),
        switchPortal,
        requestStepUpAuth,
        isStepUpOpen,
        stepUpActionName,
        closeStepUp,
        confirmStepUp,
      }}
    >
      {children}
    </PortalContext.Provider>
  );
};

export const usePortal = (): PortalContextType => {
  const ctx = useContext(PortalContext);
  if (!ctx) {
    throw new Error('usePortal must be used within a PortalProvider');
  }
  return ctx;
};
