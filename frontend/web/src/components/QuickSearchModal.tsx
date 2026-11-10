import React, { useState, useEffect } from 'react';
import type { ModuleKey } from '../types';
import { Search, X, Layers, Users, FileText, QrCode } from 'lucide-react';

interface QuickSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectModule: (m: ModuleKey) => void;
}

export const QuickSearchModal: React.FC<QuickSearchModalProps> = ({ isOpen, onClose, onSelectModule }) => {
  const [query, setQuery] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!isOpen) return null;

  const quickLinks = [
    { title: 'Floor Entry & Kiosks (Supervisor Inbox)', cat: 'Manufacturing Floor', module: 'floor' as ModuleKey, icon: QrCode },
    { title: 'Launch Kiosk Terminal Mode (Rugged UI)', cat: 'Floor Terminal', module: 'kiosk' as ModuleKey, icon: QrCode },
    { title: 'LOT-LF-8841 (Lawn Printed Kurti)', cat: 'Production Lot', module: 'production' as ModuleKey, icon: QrCode },
    { title: 'Khaadi Apparel (Master Buyer Account)', cat: 'Client Profile', module: 'clients' as ModuleKey, icon: Users },
    { title: 'PO-2026-904 (Sapphire Stretch Denim 12,000m)', cat: 'Active Order', module: 'orders' as ModuleKey, icon: FileText },
    { title: 'Loom Weaving Floor #01 (Faisalabad)', cat: 'Production Line', module: 'production' as ModuleKey, icon: Layers },
    { title: 'Cotton 40s Combed Yarn (Raw Material)', cat: 'Inventory Stock', module: 'inventory' as ModuleKey, icon: Layers },
  ];

  const filtered = quickLinks.filter(q => q.title.toLowerCase().includes(query.toLowerCase()) || q.cat.toLowerCase().includes(query.toLowerCase()));

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0, 0, 0, 0.75)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'center',
      paddingTop: '100px',
      zIndex: 100,
    }}
    onClick={onClose}
    >
      <div 
        style={{
          width: '100%',
          maxWidth: '580px',
          background: '#0f172a',
          border: '1px solid var(--border-light)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.8)',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '14px 18px',
          borderBottom: '1px solid var(--border-light)',
        }}>
          <Search size={18} color="var(--emerald)" />
          <input
            type="text"
            autoFocus
            placeholder="Search across orders, lots, yarn stocks, clients..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: 'var(--text-main)',
              fontSize: '0.95rem',
            }}
          />
          <button 
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
          >
            <X size={18} />
          </button>
        </div>

        <div style={{ padding: '8px', maxHeight: '340px', overflowY: 'auto' }}>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-sub)', fontWeight: 600, padding: '6px 12px', textTransform: 'uppercase' }}>
            Quick Navigation Results
          </div>

          {filtered.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                onClick={() => { onSelectModule(item.module); onClose(); }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-md)',
                  cursor: 'pointer',
                  transition: 'background var(--transition-fast)',
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <Icon size={16} color="var(--emerald-light)" />
                  <span style={{ fontSize: '0.88rem', fontWeight: 500, color: 'var(--text-main)' }}>
                    {item.title}
                  </span>
                </div>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', background: 'rgba(255, 255, 255, 0.04)', padding: '2px 8px', borderRadius: '4px' }}>
                  {item.cat}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
