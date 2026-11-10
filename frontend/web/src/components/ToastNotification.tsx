import React from 'react';
import { useMillData } from '../context/MillDataContext';
import { CheckCircle2, AlertCircle, Info, X, AlertTriangle } from 'lucide-react';

export const ToastNotification: React.FC = () => {
  const { toasts, dismissToast } = useMillData();

  if (toasts.length === 0) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: '76px',
        right: '24px',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        maxWidth: '400px',
        width: '100%',
        pointerEvents: 'none',
      }}
    >
      {toasts.map((toast) => {
        const isSuccess = toast.type === 'success';
        const isError = toast.type === 'error';
        const isWarning = toast.type === 'warning';

        return (
          <div
            key={toast.id}
            className="animate-slide-up"
            style={{
              pointerEvents: 'auto',
              background: '#ffffff',
              border: isSuccess 
                ? '1px solid #86efac' 
                : isError 
                ? '1px solid #fca5a5' 
                : isWarning 
                ? '1px solid #fde047' 
                : '1px solid #bfdbfe',
              borderRadius: 'var(--radius-md)',
              padding: '14px 16px',
              boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.15), 0 8px 10px -6px rgba(15, 23, 42, 0.1)',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px',
              borderLeft: isSuccess
                ? '4px solid #16a34a'
                : isError
                ? '4px solid #dc2626'
                : isWarning
                ? '4px solid #d97706'
                : '4px solid #2563eb',
            }}
          >
            <div style={{ marginTop: '2px', flexShrink: 0 }}>
              {isSuccess && <CheckCircle2 size={18} color="#16a34a" />}
              {isError && <AlertCircle size={18} color="#dc2626" />}
              {isWarning && <AlertTriangle size={18} color="#d97706" />}
              {!isSuccess && !isError && !isWarning && <Info size={18} color="#2563eb" />}
            </div>

            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#0f172a' }}>
                {toast.title}
              </div>
              <div style={{ fontSize: '0.8rem', color: '#475569', marginTop: '2px', lineHeight: 1.4 }}>
                {toast.message}
              </div>
            </div>

            <button
              onClick={() => dismissToast(toast.id)}
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: '#94a3b8',
                padding: '2px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#0f172a')}
              onMouseLeave={(e) => (e.currentTarget.style.color = '#94a3b8')}
            >
              <X size={15} />
            </button>
          </div>
        );
      })}
    </div>
  );
};
