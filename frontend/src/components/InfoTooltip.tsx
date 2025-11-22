import React, { useState } from 'react';
import './InfoTooltip.css';

/**
 * Modern InfoTooltip Component
 * A reusable tooltip component with beautiful animations and enhanced interactivity
 *
 * Features:
 * - Modern gradient SVG icon
 * - Smooth hover animations (scale, shadow)
 * - Animated tooltip content with fade-in effect
 * - Keyboard accessible (Enter/Space to toggle, Escape to close)
 * - ARIA compliant for screen readers
 * - Multiple variants (info, warning, error, success)
 */
interface InfoTooltipProps {
  text: string;
  placement?: 'top' | 'bottom' | 'left' | 'right';
  size?: 'small' | 'medium' | 'large';
  variant?: 'info' | 'warning' | 'error' | 'success';
  /** Use 'inline' for subtle icons that blend with text (like Dashboard style) */
  iconStyle?: 'default' | 'inline';
}

const InfoTooltip: React.FC<InfoTooltipProps> = ({
  text,
  placement = 'top',
  size = 'medium',
  variant = 'info',
  iconStyle = 'inline'
}) => {
  const [show, setShow] = useState(false);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setShow(!show);
    } else if (e.key === 'Escape') {
      setShow(false);
    }
  };

  const iconSizes = {
    small: 12,
    medium: 14,
    large: 16,
  };

  const iconSize = iconSizes[size];

  // Different icons for different variants
  const renderIcon = () => {
    switch (variant) {
      case 'warning':
        return (
          <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" className="info-icon-svg">
            <path d="M12 2L2 20h20L12 2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" className="info-circle" />
            <path d="M12 9v4M12 17h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="info-mark" />
          </svg>
        );
      case 'error':
        return (
          <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" className="info-icon-svg">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" className="info-circle" />
            <path d="M15 9l-6 6M9 9l6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="info-mark" />
          </svg>
        );
      case 'success':
        return (
          <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" className="info-icon-svg">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" className="info-circle" />
            <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="info-mark" />
          </svg>
        );
      default: // info
        return (
          <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" className="info-icon-svg">
            <circle cx="12" cy="12" r="8" fill="currentColor" className="info-circle" />
          </svg>
        );
    }
  };

  const iconStyleClass = iconStyle === 'inline' ? 'tooltip-icon--inline' : '';

  return (
    <div
      className={`info-tooltip info-tooltip--${placement}`}
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      <div
        className={`tooltip-icon tooltip-icon--${size} tooltip-icon--${variant} ${iconStyleClass}`}
        role="button"
        tabIndex={0}
        aria-label="More information"
        aria-expanded={show}
        onKeyDown={handleKeyDown}
        onClick={() => setShow(!show)}
      >
        {renderIcon()}
      </div>
      {show && (
        <div className={`tooltip-content tooltip-content--${placement} tooltip-content--${variant}`} role="tooltip">
          {text}
          <div className={`tooltip-arrow tooltip-arrow--${placement} tooltip-arrow--${variant}`} />
        </div>
      )}
    </div>
  );
};

export default InfoTooltip;
