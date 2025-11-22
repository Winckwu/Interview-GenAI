import React, { useState } from 'react';
import './InfoTooltip.css';

interface InfoTooltipProps {
  text: string;
  placement?: 'top' | 'bottom' | 'left' | 'right';
  size?: 'small' | 'medium' | 'large';
}

const InfoTooltip: React.FC<InfoTooltipProps> = ({
  text,
  placement = 'top',
  size = 'small'
}) => {
  const [show, setShow] = useState(false);

  const iconSizes: Record<string, number> = {
    small: 14,
    medium: 16,
    large: 18,
  };

  const iconSize = iconSizes[size] || 14;

  return (
    <span
      className="info-tooltip-wrapper"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      <span
        className="info-tooltip-icon"
        style={{
          width: iconSize,
          height: iconSize,
          fontSize: iconSize * 0.7,
        }}
      >
        ?
      </span>
      {show && (
        <span className={`info-tooltip-content info-tooltip-content--${placement}`}>
          {text}
          <span className={`info-tooltip-arrow info-tooltip-arrow--${placement}`} />
        </span>
      )}
    </span>
  );
};

export default InfoTooltip;
