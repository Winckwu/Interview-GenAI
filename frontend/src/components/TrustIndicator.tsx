/**
 * TrustIndicator Component
 *
 * Displays MR9 Dynamic Trust Calibration indicator for AI messages.
 * Shows trust score badge and recommended MR tool to activate.
 *
 * Extracted from ChatSessionPage.tsx as part of Phase 2 refactoring.
 * Styles extracted to CSS Module as part of Phase 4 refactoring.
 */

import React from 'react';
import styles from './TrustIndicator.module.css';

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
      className={styles.container}
      style={{
        backgroundColor: badge.bgColor,
        border: `1px solid ${badge.color}`,
      }}
    >
      <div className={styles.header}>
        <span>{badge.icon}</span>
        <span className={styles.badge} style={{ color: badge.color }}>{badge.label}</span>
        <span className={styles.score}>({trustScore.toFixed(0)}%)</span>
      </div>
      {recommendations.length > 0 && (
        <button
          onClick={() => onRecommendationClick(recommendations[0])}
          className={styles.recommendation}
          style={{ backgroundColor: badge.color }}
          title={recommendations[0].reason}
        >
          {recommendations[0].icon} {recommendations[0].toolName}
        </button>
      )}
    </div>
  );
};

export default TrustIndicator;
