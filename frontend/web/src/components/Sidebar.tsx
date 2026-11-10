import React, { useState } from 'react';
import type { ModuleKey } from '../types';
import { 
  LayoutDashboard, 
  Users, 
  FileSpreadsheet, 
  Layers, 
  Package, 
  CheckSquare, 
  UserCheck, 
  Clock, 
  Truck, 
  DollarSign, 
  BarChart3, 
  BellRing, 
  ShieldAlert, 
  Settings, 
  RefreshCw,
  Sparkles,
  ShieldCheck,
  Tablet,
  Printer
} from 'lucide-react';

interface SidebarProps {
  currentModule: ModuleKey;
  onSelectModule: (m: ModuleKey) => void;
  isOpen: boolean;
}

interface NavItem {
  key: ModuleKey;
  label: string;
  icon: React.ElementType;
  badge?: string;
  highlight?: boolean;
}

interface NavCategory {
  category: string;
  items: NavItem[];
}

export const Sidebar: React.FC<SidebarProps> = ({ currentModule, onSelectModule, isOpen }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isPinned, setIsPinned] = useState(false);

  const menu: NavCategory[] = [
    {
      category: 'EXECUTIVE',
      items: [
        { key: 'dashboard', label: 'Mill Overview', icon: LayoutDashboard },
        { key: 'reports', label: 'Analytics & BI', icon: BarChart3, badge: 'Live' },
      ],
    },
    {
      category: 'COMMERCIAL',
      items: [
        { key: 'clients', label: 'Clients & Accounts', icon: Users },
        { key: 'orders', label: 'Orders & Quotes', icon: FileSpreadsheet, badge: '16 New' },
        { key: 'finance', label: 'Ledger & Payments', icon: DollarSign },
      ],
    },
    {
      category: 'MANUFACTURING',
      items: [
        { key: 'production', label: 'Production Tracking', icon: Layers, highlight: true },
        { key: 'floor', label: 'Floor Entry & Kiosks', icon: Tablet, badge: 'Live', highlight: true },
        { key: 'inventory', label: 'Yarn & Fabric Stock', icon: Package },
        { key: 'quality', label: 'QC & Inspections', icon: CheckSquare },
        { key: 'delivery', label: 'Delivery & Challans', icon: Truck },
      ],
    },
    {
      category: 'WORKFORCE',
      items: [
        { key: 'labour', label: 'Workers & Piece-Rate', icon: UserCheck },
        { key: 'attendance', label: 'Attendance & Shifts', icon: Clock },
      ],
    },
    {
      category: 'ENTERPRISE SYSTEM',
      items: [
        { key: 'sync', label: 'Offline Sync (Mobile)', icon: RefreshCw },
        { key: 'notifications', label: 'WhatsApp & Alerts', icon: BellRing },
        { key: 'audit', label: 'Security & Audit Log', icon: ShieldAlert },
        { key: 'users', label: 'Users & RBAC Access', icon: ShieldCheck },
        { key: 'print', label: 'Print & Format Builder', icon: Printer, badge: 'Design', highlight: true },
        { key: 'settings', label: 'Mill Configuration', icon: Settings },
      ],
    },
  ];

  if (!isOpen) return null;

  const expanded = isPinned || isHovered;

  return (
    <aside 
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        width: expanded ? '260px' : '72px',
        transition: 'width 0.24s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.24s ease',
        background: 'linear-gradient(180deg, #1d4ed8 0%, #1e40af 60%, #172554 100%)',
        borderRight: '1px solid rgba(255, 255, 255, 0.15)',
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        userSelect: 'none',
        overflow: 'hidden',
        boxShadow: expanded ? '6px 0 30px rgba(0, 0, 0, 0.35)' : '2px 0 12px rgba(0, 0, 0, 0.15)',
      }}
    >
      {/* Brand Header */}
      <div style={{
        height: '70px',
        minHeight: '70px',
        display: 'flex',
        alignItems: 'center',
        padding: '0 15px',
        gap: '12px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.15)',
        background: 'rgba(0, 0, 0, 0.12)',
        overflow: 'hidden',
        justifyContent: expanded ? 'space-between' : 'center',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
          <div style={{
            width: '42px',
            minWidth: '42px',
            height: '42px',
            borderRadius: '10px',
            background: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 14px rgba(0, 0, 0, 0.2)',
            border: '1px solid rgba(255, 255, 255, 0.4)',
            cursor: 'pointer',
          }}
          title="Lahore Fashion Textile ERP"
          onClick={() => setIsPinned(!isPinned)}
          >
            <Sparkles size={22} color="#1d4ed8" />
          </div>
          {expanded && (
            <div style={{ minWidth: 0, overflow: 'hidden', whiteSpace: 'nowrap' }}>
              <div style={{
                fontFamily: 'var(--font-heading)',
                fontWeight: 800,
                fontSize: '1.05rem',
                letterSpacing: '0.04em',
                color: '#ffffff',
                textShadow: '0 1px 2px rgba(0, 0, 0, 0.2)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}>
                LAHORE FASHION
              </div>
              <div style={{ fontSize: '0.68rem', color: '#bfdbfe', letterSpacing: '0.08em', fontWeight: 600 }}>
                TEXTILE ERP • ENTERPRISE
              </div>
            </div>
          )}
        </div>

        {expanded && (
          <button
            onClick={() => setIsPinned(!isPinned)}
            title={isPinned ? 'Unpin Sidebar (Enable Hover Expand)' : 'Pin Sidebar Open'}
            style={{
              background: isPinned ? 'rgba(255, 255, 255, 0.25)' : 'transparent',
              border: 'none',
              color: '#ffffff',
              padding: '5px 8px',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.68rem',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            {isPinned ? 'PINNED' : 'PIN'}
          </button>
        )}
      </div>

      {/* Nav List */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        overflowX: 'hidden',
        padding: expanded ? '16px 12px' : '16px 8px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        transition: 'padding 0.2s ease',
      }}>
        {menu.map((cat, idx) => (
          <div key={idx}>
            {expanded && (
              <div style={{
                fontSize: '0.66rem',
                fontWeight: 700,
                color: '#93c5fd',
                letterSpacing: '0.09em',
                padding: '0 10px 6px',
                textTransform: 'uppercase',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}>
                {cat.category}
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {cat.items.map((item) => {
                const Icon = item.icon;
                const isActive = currentModule === item.key;

                return (
                  <button
                    key={item.key}
                    onClick={() => onSelectModule(item.key)}
                    title={!expanded ? item.label : undefined}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: expanded ? 'space-between' : 'center',
                      padding: expanded ? '9px 12px' : '11px 0',
                      borderRadius: 'var(--radius-md)',
                      background: isActive 
                        ? '#ffffff' 
                        : 'transparent',
                      color: isActive ? '#1e40af' : '#e0e7ff',
                      border: isActive ? '1px solid #ffffff' : '1px solid transparent',
                      cursor: 'pointer',
                      fontSize: '0.85rem',
                      fontWeight: isActive ? 700 : 500,
                      boxShadow: isActive ? '0 4px 16px rgba(0, 0, 0, 0.2)' : 'none',
                      transition: 'all var(--transition-fast)',
                      position: 'relative',
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.14)';
                        e.currentTarget.style.color = '#ffffff';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.background = 'transparent';
                        e.currentTarget.style.color = '#e0e7ff';
                      }
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                      <Icon 
                        size={expanded ? 17 : 20} 
                        color={isActive ? '#1d4ed8' : '#bfdbfe'} 
                        style={{ minWidth: expanded ? '17px' : '20px' }}
                      />
                      {expanded && (
                        <span style={{
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}>
                          {item.label}
                        </span>
                      )}
                    </div>

                    {expanded && item.badge && (
                      <span style={{
                        fontSize: '0.65rem',
                        padding: '2px 7px',
                        borderRadius: 'var(--radius-full)',
                        background: isActive ? '#1d4ed8' : 'rgba(255, 255, 255, 0.22)',
                        color: '#ffffff',
                        fontWeight: 700,
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        whiteSpace: 'nowrap',
                      }}>
                        {item.badge}
                      </span>
                    )}

                    {!expanded && item.badge && (
                      <span style={{
                        position: 'absolute',
                        top: '5px',
                        right: '10px',
                        width: '7px',
                        height: '7px',
                        borderRadius: '50%',
                        background: '#38bdf8',
                        border: '1px solid #ffffff',
                      }} />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Footer Info */}
      <div style={{
        padding: expanded ? '14px 16px' : '12px 6px',
        borderTop: '1px solid rgba(255, 255, 255, 0.15)',
        background: 'rgba(0, 0, 0, 0.15)',
        fontSize: '0.75rem',
        color: '#bfdbfe',
        display: 'flex',
        alignItems: 'center',
        justifyContent: expanded ? 'space-between' : 'center',
        overflow: 'hidden',
        whiteSpace: 'nowrap',
      }}>
        {expanded ? (
          <>
            <div>
              <span style={{ color: '#ffffff', fontWeight: 700 }}>Lahore Fashion v2.4</span>
              <div style={{ fontSize: '0.7rem', color: '#93c5fd' }}>Textile Industry Suite</div>
            </div>
            <span style={{
              fontSize: '0.65rem',
              padding: '2px 8px',
              borderRadius: 'var(--radius-full)',
              background: 'rgba(16, 185, 129, 0.25)',
              color: '#a7f3d0',
              border: '1px solid rgba(16, 185, 129, 0.5)',
              fontWeight: 700,
            }}>
              ONLINE
            </span>
          </>
        ) : (
          <span style={{
            width: '10px',
            height: '10px',
            borderRadius: '50%',
            background: '#10b981',
            boxShadow: '0 0 8px #10b981',
          }} title="System Online (Sync Ready)" />
        )}
      </div>
    </aside>
  );
};
