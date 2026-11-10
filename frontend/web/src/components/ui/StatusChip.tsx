import React from 'react';

export type StatusVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

export interface StatusChipProps {
  label: React.ReactNode;
  variant?: StatusVariant;
  count?: number;
  showDot?: boolean;
  style?: React.CSSProperties;
  className?: string;
  onClick?: () => void;
}

export const StatusChip: React.FC<StatusChipProps> = ({
  label,
  variant = 'neutral',
  count,
  showDot = true,
  style,
  className = '',
  onClick,
}) => {
  const stylesMap: Record<
    StatusVariant,
    { bg: string; border: string; text: string; dot: string }
  > = {
    success: {
      bg: '#ECFDF3',
      border: '#D1FADF',
      text: '#027A48',
      dot: '#12B76A',
    },
    warning: {
      bg: '#FEF0C7',
      border: '#FEDF89',
      text: '#B54708',
      dot: '#F79009',
    },
    danger: {
      bg: '#FEF3F2',
      border: '#FECDCA',
      text: '#B42318',
      dot: '#F04438',
    },
    info: {
      bg: '#EFF8FF',
      border: '#B2DDFF',
      text: '#175CD3',
      dot: '#1E5EFF',
    },
    neutral: {
      bg: '#F8FAFC',
      border: '#E5EAF2',
      text: '#344054',
      dot: '#6B7A90',
    },
  };

  const current = stylesMap[variant];

  return (
    <div
      className={`lf-status-chip ${className}`}
      onClick={onClick}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '4px 10px',
        borderRadius: '16px',
        backgroundColor: current.bg,
        border: `1px solid ${current.border}`,
        color: current.text,
        fontSize: '12px',
        fontWeight: 600,
        lineHeight: '16px',
        cursor: onClick ? 'pointer' : 'default',
        whiteSpace: 'nowrap',
        ...style,
      }}
    >
      {showDot && (
        <span
          style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            backgroundColor: current.dot,
            flexShrink: 0,
          }}
        />
      )}
      <span>{label}</span>
      {typeof count === 'number' && (
        <span
          style={{
            backgroundColor: current.dot,
            color: '#FFFFFF',
            fontSize: '11px',
            fontWeight: 700,
            borderRadius: '10px',
            padding: '1px 6px',
            marginLeft: '2px',
          }}
        >
          {count}
        </span>
      )}
    </div>
  );
};
