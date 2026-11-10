import React from 'react';

export interface CardProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  headerAction?: React.ReactNode;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({
  title,
  subtitle,
  headerAction,
  padding = 'md',
  children,
  style,
  className = '',
  ...rest
}) => {
  const paddingMap = {
    none: '0',
    sm: '12px 16px',
    md: '20px 24px',
    lg: '24px 32px',
  };

  return (
    <div
      className={`lf-card ${className}`}
      style={{
        backgroundColor: '#FFFFFF',
        border: '1px solid #E5EAF2',
        borderRadius: '12px',
        boxShadow: '0 1px 3px rgba(11, 37, 69, 0.05), 0 1px 2px rgba(11, 37, 69, 0.03)',
        overflow: 'hidden',
        transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
        ...style,
      }}
      {...rest}
    >
      {(title || headerAction) && (
        <div
          style={{
            padding: '16px 24px',
            borderBottom: '1px solid #E5EAF2',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
          }}
        >
          <div>
            {typeof title === 'string' ? (
              <h3
                style={{
                  margin: 0,
                  fontSize: '16px',
                  fontWeight: 600,
                  color: '#0B2545',
                  lineHeight: '20px',
                }}
              >
                {title}
              </h3>
            ) : (
              title
            )}
            {subtitle && (
              <div
                style={{
                  fontSize: '12px',
                  color: '#6B7A90',
                  marginTop: '2px',
                  lineHeight: '16px',
                }}
              >
                {subtitle}
              </div>
            )}
          </div>
          {headerAction && <div>{headerAction}</div>}
        </div>
      )}
      <div style={{ padding: paddingMap[padding] }}>{children}</div>
    </div>
  );
};
