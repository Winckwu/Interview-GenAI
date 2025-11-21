import React, { useState, useRef, useEffect } from 'react';
import './HoverTooltip.css';

/**
 * HoverTooltip Component
 * Shows a tooltip when hovering over the wrapped content
 * No visible icon - the entire wrapped content acts as the trigger
 */
interface HoverTooltipProps {
  /** The content to wrap */
  children: React.ReactNode;
  /** The tooltip text to show on hover */
  tooltip: string;
  /** Tooltip placement */
  placement?: 'top' | 'bottom' | 'left' | 'right';
  /** Optional: Show a small info icon in the corner */
  showIcon?: boolean;
}

const HoverTooltip: React.FC<HoverTooltipProps> = ({
  children,
  tooltip,
  placement = 'top',
  showIcon = false
}) => {
  const [show, setShow] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={containerRef}
      className="hover-tooltip-wrapper"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      {children}

      {showIcon && (
        <div className="hover-tooltip-icon">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" />
            <path d="M12 16V12M12 8H12.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      )}

      {show && (
        <div className={`hover-tooltip-content hover-tooltip-content--${placement}`} role="tooltip">
          {tooltip}
          <div className={`hover-tooltip-arrow hover-tooltip-arrow--${placement}`} />
        </div>
      )}
    </div>
  );
};

export default HoverTooltip;
