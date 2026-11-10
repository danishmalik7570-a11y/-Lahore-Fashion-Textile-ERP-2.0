import React from 'react';

export interface ChipProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  selected?: boolean;
  variant?: 'primary' | 'danger' | 'neutral';
  children: React.ReactNode;
}

export const Chip: React.FC<ChipProps> = ({
  selected = false,
  variant = 'primary',
  children,
  style,
  disabled,
  className = '',
  ...rest
}) => {
  const [isHovered, setIsHovered] = React.useState(false);
  const [isFocused, setIsFocused] = React.useState(false);

  const getColors = () => {
    if (variant === 'danger') {
      if (selected) {
        return {
          backgroundColor: '#FEE4E2',
          borderColor: '#F04438',
          color: '#B42318',
        };
      }
      return {
        backgroundColor: isHovered ? '#FEF3F2' : '#FFFFFF',
        borderColor: '#E5EAF2',
        color: '#0B2545',
      };
    }

    if (selected) {
      return {
        backgroundColor: '#EFF4FF',
        borderColor: '#1E5EFF',
        color: '#1E5EFF',
      };
    }

    return {
      backgroundColor: isHovered ? '#F4F7FB' : '#FFFFFF',
      borderColor: '#E5EAF2',
      color: '#0B2545',
    };
  };

  const colors = getColors();

  return (
    <button
      type="button"
      className={`lf-chip ${className}`}
      disabled={disabled}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '44px',
        padding: '8px 16px',
        borderRadius: '8px',
        border: `1px solid ${colors.borderColor}`,
        backgroundColor: colors.backgroundColor,
        color: colors.color,
        fontSize: '13px',
        fontWeight: selected ? 600 : 500,
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'all 0.15s ease',
        outline: 'none',
        boxShadow: isFocused && !disabled ? '0 0 0 3px rgba(30, 94, 255, 0.25)' : 'none',
        ...style,
      }}
      {...rest}
    >
      {children}
    </button>
  );
};
