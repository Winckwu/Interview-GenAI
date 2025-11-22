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

  const dotSizes: Record<string, number> = {
    small: 6,
    medium: 8,
    large: 10,
  };

  const dotSize = dotSizes[size] || 6;

  return (
    <span
      className="info-tooltip-wrapper"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      <span
        className="info-tooltip-dot"
        style={{
          width: dotSize,
          height: dotSize,
        }}
      />
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
