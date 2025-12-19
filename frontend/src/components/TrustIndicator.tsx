/**
 * TrustIndicator Component - Compact Version
 *
 * Displays MR9 Dynamic Trust Calibration indicator for AI messages.
 * Shows only trust score badge (MR recommendations moved to 3-tier intervention system).
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
  // recommendations and onRecommendationClick kept for API compatibility but not rendered
  // MR recommendations are now handled by the 3-tier intervention system
}) => {
  const [showTooltip, setShowTooltip] = useState(false);

  if (!badge) return null;

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

      {/* MR Recommendation Button REMOVED - now handled by 3-tier intervention system */}
    </div>
  );
};

export default TrustIndicator;
