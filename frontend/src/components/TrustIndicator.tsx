/**
 * TrustIndicator Component
 *
 * Displays MR9 Dynamic Trust Calibration indicator for AI messages.
 * Shows trust score badge and recommended MR tool to activate.
 *
 * Extracted from ChatSessionPage.tsx as part of Phase 2 refactoring.
 */

import React from 'react';

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
  if (!badge) return null;

  return (
    <div
      style={{
        marginTop: '0.75rem',
        padding: '0.5rem 0.75rem',
        backgroundColor: badge.bgColor,
        borderRadius: '0.375rem',
        border: `1px solid ${badge.color}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        fontSize: '0.75rem',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <span>{badge.icon}</span>
        <span style={{ fontWeight: '600', color: badge.color }}>{badge.label}</span>
        <span style={{ opacity: 0.7 }}>({trustScore.toFixed(0)}%)</span>
      </div>
      {recommendations.length > 0 && (
        <button
          onClick={() => onRecommendationClick(recommendations[0])}
          style={{
            fontSize: '0.7rem',
            padding: '0.25rem 0.5rem',
            backgroundColor: badge.color,
            color: '#fff',
            border: 'none',
            borderRadius: '0.25rem',
            cursor: 'pointer',
            fontWeight: '500',
          }}
          title={recommendations[0].reason}
        >
          {recommendations[0].icon} {recommendations[0].toolName}
        </button>
      )}
    </div>
  );
};

export default TrustIndicator;
