import React from 'react';

export interface StepperProps {
  value: number;
  onChange: (val: number) => void;
  min?: number;
  max?: number;
  step?: number;
  size?: 'md' | 'lg';
  unit?: string;
  disabled?: boolean;
  'aria-label'?: string;
}

export const Stepper: React.FC<StepperProps> = ({
  value,
  onChange,
  min = 0,
  max = 9999,
  step = 1,
  size = 'lg',
  unit,
  disabled = false,
  'aria-label': ariaLabel = 'Quantity stepper',
}) => {
  const isLarge = size === 'lg';
  const buttonSize = isLarge ? '56px' : '44px';

  const handleDecrement = () => {
    if (disabled || value <= min) return;
    onChange(Math.max(min, value - step));
  };

  const handleIncrement = () => {
    if (disabled || value >= max) return;
    onChange(Math.min(max, value + step));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    if (raw === '') {
      onChange(min);
      return;
    }
    const parsed = parseInt(raw, 10);
    if (!isNaN(parsed)) {
      onChange(Math.min(max, Math.max(min, parsed)));
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === '+' || e.key === '=' || e.key === 'ArrowUp') {
      e.preventDefault();
      handleIncrement();
    } else if (e.key === '-' || e.key === '_' || e.key === 'ArrowDown') {
      e.preventDefault();
      handleDecrement();
    }
  };

  return (
    <div
      role="group"
      aria-label={ariaLabel}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px',
        userSelect: 'none',
      }}
    >
      <button
        type="button"
        onClick={handleDecrement}
        disabled={disabled || value <= min}
        aria-label="Decrease quantity"
        style={{
          width: buttonSize,
          height: buttonSize,
          minWidth: '44px',
          minHeight: '44px',
          borderRadius: '8px',
          backgroundColor: '#FFFFFF',
          border: '1px solid #E5EAF2',
          color: disabled || value <= min ? '#CBD5E1' : '#0B2545',
          fontSize: isLarge ? '26px' : '20px',
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: disabled || value <= min ? 'not-allowed' : 'pointer',
          transition: 'all 0.15s ease',
          outline: 'none',
        }}
        onMouseEnter={(e) => {
          if (!disabled && value > min) e.currentTarget.style.backgroundColor = '#F4F7FB';
        }}
        onMouseLeave={(e) => {
          if (!disabled) e.currentTarget.style.backgroundColor = '#FFFFFF';
        }}
        onFocus={(e) => {
          if (!disabled) e.currentTarget.style.boxShadow = '0 0 0 3px rgba(30, 94, 255, 0.25)';
        }}
        onBlur={(e) => {
          e.currentTarget.style.boxShadow = 'none';
        }}
      >
        −
      </button>

      <div
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minWidth: isLarge ? '120px' : '90px',
          height: buttonSize,
          backgroundColor: '#FFFFFF',
          border: '1px solid #E5EAF2',
          borderRadius: '8px',
          padding: '0 12px',
        }}
      >
        <input
          type="number"
          value={value}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          min={min}
          max={max}
          aria-label={ariaLabel}
          style={{
            width: '100%',
            border: 'none',
            backgroundColor: 'transparent',
            textAlign: 'center',
            fontSize: isLarge ? '40px' : '24px',
            fontWeight: 700,
            fontVariantNumeric: 'tabular-nums',
            color: '#0B2545',
            outline: 'none',
            MozAppearance: 'textfield',
          }}
        />
        {unit && (
          <span
            style={{
              position: 'absolute',
              right: '12px',
              bottom: '8px',
              fontSize: '11px',
              fontWeight: 600,
              color: '#6B7A90',
              textTransform: 'uppercase',
            }}
          >
            {unit}
          </span>
        )}
      </div>

      <button
        type="button"
        onClick={handleIncrement}
        disabled={disabled || value >= max}
        aria-label="Increase quantity"
        style={{
          width: buttonSize,
          height: buttonSize,
          minWidth: '44px',
          minHeight: '44px',
          borderRadius: '8px',
          backgroundColor: '#FFFFFF',
          border: '1px solid #E5EAF2',
          color: disabled || value >= max ? '#CBD5E1' : '#0B2545',
          fontSize: isLarge ? '26px' : '20px',
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: disabled || value >= max ? 'not-allowed' : 'pointer',
          transition: 'all 0.15s ease',
          outline: 'none',
        }}
        onMouseEnter={(e) => {
          if (!disabled && value < max) e.currentTarget.style.backgroundColor = '#F4F7FB';
        }}
        onMouseLeave={(e) => {
          if (!disabled) e.currentTarget.style.backgroundColor = '#FFFFFF';
        }}
        onFocus={(e) => {
          if (!disabled) e.currentTarget.style.boxShadow = '0 0 0 3px rgba(30, 94, 255, 0.25)';
        }}
        onBlur={(e) => {
          e.currentTarget.style.boxShadow = 'none';
        }}
      >
        +
      </button>
    </div>
  );
};
