import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  isLoading?: boolean;
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  isLoading = false,
  icon,
  children,
  style,
  disabled,
  className = '',
  ...rest
}) => {
  const [isHovered, setIsHovered] = React.useState(false);
  const [isFocused, setIsFocused] = React.useState(false);

  // Height and padding settings.
  // minHeight is set to ensure all touch targets are at least 44px (except sm if explicit)
  const sizeStyles = {
    sm: { height: '36px', minHeight: '36px', padding: '0 12px', fontSize: '13px' },
    md: { height: '44px', minHeight: '44px', padding: '0 16px', fontSize: '14px' },
    lg: { height: '48px', minHeight: '48px', padding: '0 24px', fontSize: '15px' },
  }[size];

  // Colors based on specs:
  // Primary blue: #1E5EFF
  // Success green: #12B76A
  // Danger red: #F04438
  // Secondary: white with 1px border #E5EAF2 and text #0B2545
  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return {
          backgroundColor: disabled ? '#A4BCFD' : isHovered ? '#164ECC' : '#1E5EFF',
          color: '#FFFFFF',
          border: '1px solid transparent',
        };
      case 'success':
        return {
          backgroundColor: disabled ? '#A6F4C5' : isHovered ? '#0E9355' : '#12B76A',
          color: '#FFFFFF',
          border: '1px solid transparent',
        };
      case 'danger':
        return {
          backgroundColor: disabled ? '#FECDCA' : isHovered ? '#D92D20' : '#F04438',
          color: '#FFFFFF',
          border: '1px solid transparent',
        };
      case 'outline':
        return {
          backgroundColor: isHovered ? '#F4F7FB' : '#FFFFFF',
          color: disabled ? '#98A2B3' : '#0B2545',
          border: '1px solid #E5EAF2',
        };
      case 'ghost':
        return {
          backgroundColor: isHovered ? '#F4F7FB' : 'transparent',
          color: disabled ? '#98A2B3' : '#6B7A90',
          border: '1px solid transparent',
        };
      case 'secondary':
      default:
        return {
          backgroundColor: isHovered ? '#F4F7FB' : '#FFFFFF',
          color: disabled ? '#98A2B3' : '#0B2545',
          border: '1px solid #E5EAF2',
        };
    }
  };

  const variantStyle = getVariantStyles();

  return (
    <button
      className={`lf-button ${className}`}
      disabled={disabled || isLoading}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        fontWeight: 600,
        borderRadius: '8px',
        cursor: disabled || isLoading ? 'not-allowed' : 'pointer',
        transition: 'background-color 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease',
        width: fullWidth ? '100%' : 'auto',
        outline: 'none',
        boxShadow: isFocused && !disabled ? '0 0 0 3px rgba(30, 94, 255, 0.25)' : 'none',
        ...sizeStyles,
        ...variantStyle,
        ...style,
      }}
      {...rest}
    >
      {isLoading ? (
        <span
          style={{
            width: '16px',
            height: '16px',
            border: '2px solid currentColor',
            borderRightColor: 'transparent',
            borderRadius: '50%',
            animation: 'spin 0.6s linear infinite',
            display: 'inline-block',
          }}
        />
      ) : (
        icon
      )}
      {children}
    </button>
  );
};
