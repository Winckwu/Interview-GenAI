import React, { useState } from 'react';
import './InfoTooltip.css';

/**
 * Modern InfoTooltip Component
 * A reusable tooltip component with beautiful animations and enhanced interactivity
 *
 * Features:
 * - Modern gradient SVG icon
 * - Smooth hover animations (scale, rotate, shadow)
 * - Animated tooltip content with fade-in effect
 * - Keyboard accessible (Enter/Space to toggle, Escape to close)
 * - ARIA compliant for screen readers
 */
interface InfoTooltipProps {
  text: string;
  placement?: 'top' | 'bottom' | 'left' | 'right';
  size?: 'small' | 'medium' | 'large';
}

const InfoTooltip: React.FC<InfoTooltipProps> = ({
  text,
  placement = 'top',
  size = 'medium'
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
    small: 16,
    medium: 18,
    large: 20,
  };

  const iconSize = iconSizes[size];

  return (
    <div
      className={`info-tooltip info-tooltip--${placement}`}
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      <div
        className={`tooltip-icon tooltip-icon--${size}`}
        role="button"
        tabIndex={0}
        aria-label="More information"
        aria-expanded={show}
        onKeyDown={handleKeyDown}
        onClick={() => setShow(!show)}
      >
        <svg
          width={iconSize}
          height={iconSize}
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="info-icon-svg"
        >
          <circle
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="2"
            fill="none"
            className="info-circle"
          />
          <path
            d="M12 16V12M12 8H12.01"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="info-mark"
          />
        </svg>
      </div>
      {show && (
        <div className={`tooltip-content tooltip-content--${placement}`} role="tooltip">
          {text}
          <div className={`tooltip-arrow tooltip-arrow--${placement}`} />
        </div>
      )}
    </div>
  );
};

export default InfoTooltip;
