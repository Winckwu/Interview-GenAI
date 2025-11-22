/**
 * TrustIndicator Component - Compact Version
 *
 * Displays MR9 Dynamic Trust Calibration indicator for AI messages.
 * Shows trust score badge and recommended MR tool to activate.
 * Redesigned: Single-line compact layout with hover tooltips.
 */

import React, { useState } from 'react';

export interface TrustBadge {
  icon: string;
  label: string;
  color: string;
  bgColor: string;
}

export interface MRRecommendation {
  tool: string;
  toolName: string;
  icon: string;
  reason: string;
  priority: 'high' | 'medium' | 'low';
  urgency: number;
}

export interface TrustIndicatorProps {
  trustScore: number;
  badge: TrustBadge;
  recommendations: MRRecommendation[];
  onRecommendationClick: (recommendation: MRRecommendation) => void;
}

export const TrustIndicator: React.FC<TrustIndicatorProps> = ({
  trustScore,
  badge,
  recommendations,
  onRecommendationClick,
}) => {
  const [showTooltip, setShowTooltip] = useState(false);

  if (!badge) return null;

  const topRecommendation = recommendations[0];

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', position: 'relative' }}>
      {/* Trust Badge - Compact */}
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.375rem',
          padding: '0.375rem 0.625rem',
          backgroundColor: badge.bgColor,
          border: `1px solid ${badge.color}`,
          borderRadius: '1rem',
          fontSize: '0.75rem',
          fontWeight: 600,
          cursor: 'help',
          transition: 'all 0.2s ease',
        }}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        title={`${badge.label}: AI confidence level is ${trustScore.toFixed(0)}%`}
      >
        <span>{badge.icon}</span>
        <span style={{ color: badge.color }}>{trustScore.toFixed(0)}%</span>
      </div>

      {/* Tooltip on hover */}
      {showTooltip && (
        <div
          style={{
            position: 'absolute',
            bottom: '100%',
            left: '50%',
            transform: 'translateX(-50%)',
            marginBottom: '0.5rem',
            padding: '0.5rem 0.75rem',
            backgroundColor: '#1f2937',
            color: 'white',
            borderRadius: '0.375rem',
            fontSize: '0.75rem',
            whiteSpace: 'nowrap',
            zIndex: 100,
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          }}
        >
          <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>{badge.label}</div>
          <div style={{ color: '#9ca3af' }}>Confidence: {trustScore.toFixed(0)}%</div>
        </div>
      )}

      {/* MR Recommendation Button - Compact */}
      {topRecommendation && (
        <button
          onClick={() => onRecommendationClick(topRecommendation)}
          title={topRecommendation.reason}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.375rem',
            padding: '0.375rem 0.75rem',
            backgroundColor: badge.color,
            color: 'white',
            border: 'none',
            borderRadius: '1rem',
            fontSize: '0.75rem',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-1px)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.2)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.15)';
          }}
        >
          <span>{topRecommendation.icon}</span>
          <span>{topRecommendation.toolName}</span>
        </button>
      )}
    </div>
  );
};

export default TrustIndicator;
