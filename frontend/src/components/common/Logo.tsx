import React from 'react';

/**
 * Logo Component
 * Hexagonal Pattern Matrix design representing the 6 metacognitive patterns (A-F)
 */

interface LogoProps {
  size?: number;
  showText?: boolean;
  variant?: 'default' | 'light' | 'dark' | 'monochrome';
}

const Logo: React.FC<LogoProps> = ({
  size = 40,
  showText = true,
  variant = 'default'
}) => {
  const getColors = () => {
    switch (variant) {
      case 'light':
        return {
          primary: '#667eea',
          secondary: '#764ba2',
          text: '#667eea',
          stroke: '#667eea',
        };
      case 'dark':
        return {
          primary: '#667eea',
          secondary: '#764ba2',
          text: '#667eea',
          stroke: '#667eea',
        };
      case 'monochrome':
        return {
          primary: '#333',
          secondary: '#666',
          text: '#333',
          stroke: '#333',
        };
      default:
        return {
          primary: '#667eea',
          secondary: '#764ba2',
          text: '#667eea',
          stroke: '#667eea',
        };
    }
  };

  const colors = getColors();

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: showText ? '12px' : '0'
    }}>
      {/* Hexagonal Pattern Matrix SVG */}
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        xmlns="http://www.w3.org/2000/svg"
        style={{ flexShrink: 0 }}
      >
        <g transform="translate(50, 50)">
          {/* Outer Hexagon */}
          <polygon
            points="0,-30 26,-15 26,15 0,30 -26,15 -26,-15"
            fill="none"
            stroke={colors.stroke}
            strokeWidth="2.5"
          />

          {/* Middle Hexagon */}
          <polygon
            points="0,-20 17.5,-10 17.5,10 0,20 -17.5,10 -17.5,-10"
            fill="none"
            stroke={colors.secondary}
            strokeWidth="1.75"
            opacity="0.7"
          />

          {/* Inner Hexagon */}
          <polygon
            points="0,-10 8.5,-5 8.5,5 0,10 -8.5,5 -8.5,-5"
            fill={colors.primary}
            opacity="0.25"
          />

          {/* Pattern Points representing 6 patterns (A-F) */}
          <circle cx="0" cy="-30" r="2.5" fill={colors.primary}/>
          <circle cx="26" cy="-15" r="2.5" fill={colors.secondary}/>
          <circle cx="26" cy="15" r="2.5" fill={colors.primary}/>
          <circle cx="0" cy="30" r="2.5" fill={colors.secondary}/>
          <circle cx="-26" cy="15" r="2.5" fill={colors.primary}/>
          <circle cx="-26" cy="-15" r="2.5" fill={colors.secondary}/>

          {/* Center AI Symbol */}
          <text
            x="0"
            y="4"
            textAnchor="middle"
            fontFamily="Inter, Arial, sans-serif"
            fontSize="14"
            fontWeight="700"
            fill={colors.text}
          >
            AI
          </text>
        </g>
      </svg>

      {/* Text Logo */}
      {showText && (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          lineHeight: 1.2,
        }}>
          <span style={{
            fontSize: size > 35 ? '18px' : '16px',
            fontWeight: 600,
            color: 'var(--color-text-primary, #1f2937)',
          }}>
            AI Pattern Recognition
          </span>
          <span style={{
            fontSize: size > 35 ? '11px' : '10px',
            fontWeight: 500,
            color: 'var(--color-text-secondary, #6b7280)',
            letterSpacing: '0.5px',
          }}>
            METACOGNITIVE SYSTEM
          </span>
        </div>
      )}
    </div>
  );
};

export default Logo;
