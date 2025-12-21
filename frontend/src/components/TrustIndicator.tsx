/**
 * TrustIndicator Component - Enhanced with Content Analysis
 *
 * Displays MR9 Dynamic Trust Calibration indicator for AI messages.
 * Shows WHY the trust score is what it is with color-coded factors.
 */

import React, { useState, useMemo } from 'react';
import {
  analyzeContentFactors,
  getTrustIcon,
  getTrustColors,
  type TrustFactor,
} from '../utils/contentAnalyzer';

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
  aiContent?: string;
}

export const TrustIndicator: React.FC<TrustIndicatorProps> = ({
  trustScore,
  badge,
  aiContent = '',
}) => {
  const [showTooltip, setShowTooltip] = useState(false);

  // Analyze content for factors explaining the score
  const analysis = useMemo(() => {
    return analyzeContentFactors(aiContent, trustScore);
  }, [aiContent, trustScore]);

  const trustIcon = getTrustIcon(trustScore);
  const colors = getTrustColors(trustScore);

  if (!badge) return null;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', position: 'relative' }}>
      {/* Trust Badge */}
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.5rem 0.75rem',
          backgroundColor: colors.bgLight,
          border: `1px solid ${colors.border}`,
          borderRadius: '1rem',
          fontSize: '0.8rem',
          fontWeight: 600,
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          boxShadow: showTooltip ? `0 4px 12px ${colors.bg}40` : 'none',
        }}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        onClick={() => setShowTooltip(!showTooltip)}
      >
        <span>{trustIcon}</span>
        <span style={{ color: colors.text, fontWeight: 700 }}>{trustScore.toFixed(0)}%</span>
        <span style={{
          color: colors.text,
          fontSize: '0.7rem',
          opacity: 0.8,
        }}>
          {analysis.actionLabel}
        </span>
      </div>

      {/* Tooltip with factors */}
      {showTooltip && (
        <div
          style={{
            position: 'absolute',
            bottom: '100%',
            left: '0',
            marginBottom: '0.5rem',
            padding: '0.75rem',
            backgroundColor: colors.bgLight,
            border: `1px solid ${colors.border}`,
            borderRadius: '0.5rem',
            fontSize: '0.8rem',
            minWidth: '260px',
            maxWidth: '320px',
            zIndex: 100,
            boxShadow: `0 4px 20px ${colors.bg}30`,
          }}
        >
          {/* Header */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            marginBottom: '0.75rem',
            paddingBottom: '0.5rem',
            borderBottom: `1px solid ${colors.border}`
          }}>
            <span style={{ fontSize: '1.2rem' }}>{trustIcon}</span>
            <div>
              <div style={{ fontWeight: 700, color: colors.text }}>
                {badge.label} · {trustScore.toFixed(0)}%
              </div>
              <div style={{ color: colors.text, fontSize: '0.7rem', opacity: 0.7 }}>
                {analysis.actionLabel}
              </div>
            </div>
          </div>

          {/* Factors explaining the score */}
          <div>
            <div style={{
              fontSize: '0.7rem',
              color: colors.text,
              marginBottom: '0.5rem',
              fontWeight: 600,
              opacity: 0.7,
            }}>
              Score factors:
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
              {analysis.factors.map((factor, index) => (
                <FactorItem key={index} factor={factor} colors={colors} />
              ))}
            </div>
          </div>

          {/* Tip */}
          <div style={{
            marginTop: '0.75rem',
            paddingTop: '0.5rem',
            borderTop: `1px solid ${colors.border}`,
            color: colors.text,
            fontSize: '0.65rem',
            opacity: 0.6,
          }}>
            💡 Click Verify to confirm or Modify to correct
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Individual factor item
 */
const FactorItem: React.FC<{
  factor: TrustFactor;
  colors: { text: string; bg: string; bgLight: string; border: string };
}> = ({ factor, colors }) => {
  const impactColors = {
    positive: '#16a34a',  // green
    negative: '#dc2626',  // red
    neutral: '#6b7280',   // gray
  };

  const impactBg = {
    positive: '#dcfce7',
    negative: '#fee2e2',
    neutral: '#f3f4f6',
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      padding: '0.375rem 0.5rem',
      backgroundColor: impactBg[factor.impact],
      borderRadius: '0.375rem',
      fontSize: '0.75rem',
    }}>
      <span style={{ fontSize: '0.85rem', flexShrink: 0 }}>{factor.icon}</span>
      <span style={{
        flex: 1,
        color: impactColors[factor.impact],
        fontWeight: 500,
      }}>
        {factor.text}
      </span>
      {factor.points !== 0 && (
        <span style={{
          fontSize: '0.65rem',
          color: impactColors[factor.impact],
          fontWeight: 600,
        }}>
          {factor.points > 0 ? '+' : ''}{factor.points.toFixed(0)}%
        </span>
      )}
    </div>
  );
};

export default TrustIndicator;
