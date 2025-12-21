/**
 * TrustIndicator Component - Enhanced Version with Content Analysis
 *
 * Displays MR9 Dynamic Trust Calibration indicator for AI messages.
 * Now includes specific verification suggestions based on content analysis.
 */

import React, { useState, useMemo } from 'react';
import {
  analyzeContent,
  getTrustIcon,
  getTrustColor,
  type VerificationSuggestion,
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
  aiContent?: string;  // AI response content for analysis
}

export const TrustIndicator: React.FC<TrustIndicatorProps> = ({
  trustScore,
  badge,
  aiContent = '',
  // recommendations and onRecommendationClick kept for API compatibility but not rendered
  // MR recommendations are now handled by the 3-tier intervention system
}) => {
  const [showTooltip, setShowTooltip] = useState(false);

  // Analyze content for specific suggestions
  const analysis = useMemo(() => {
    return analyzeContent(aiContent, trustScore);
  }, [aiContent, trustScore]);

  const trustIcon = getTrustIcon(trustScore);
  const trustColor = getTrustColor(trustScore);

  if (!badge) return null;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', position: 'relative' }}>
      {/* Trust Badge - Enhanced with action label */}
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.5rem 0.75rem',
          backgroundColor: badge.bgColor,
          border: 'none',
          borderRadius: '1rem',
          fontSize: '0.8rem',
          fontWeight: 600,
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          boxShadow: showTooltip ? '0 4px 12px rgba(0,0,0,0.15)' : 'none',
        }}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        onClick={() => setShowTooltip(!showTooltip)}
      >
        <span>{trustIcon}</span>
        <span style={{ color: trustColor, fontWeight: 700 }}>{trustScore.toFixed(0)}%</span>
        <span style={{
          color: '#6b7280',
          fontSize: '0.75rem',
          borderLeft: '1px solid #e5e7eb',
          paddingLeft: '0.5rem',
          marginLeft: '0.25rem'
        }}>
          {analysis.actionLabel}
        </span>
      </div>

      {/* Enhanced Tooltip with specific suggestions */}
      {showTooltip && (
        <div
          style={{
            position: 'absolute',
            bottom: '100%',
            left: '0',
            marginBottom: '0.5rem',
            padding: '0.75rem',
            backgroundColor: '#1f2937',
            color: 'white',
            borderRadius: '0.5rem',
            fontSize: '0.8rem',
            minWidth: '280px',
            maxWidth: '350px',
            zIndex: 100,
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.25)',
          }}
        >
          {/* Header */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            marginBottom: '0.75rem',
            paddingBottom: '0.5rem',
            borderBottom: '1px solid #374151'
          }}>
            <span style={{ fontSize: '1.2rem' }}>{trustIcon}</span>
            <div>
              <div style={{ fontWeight: 700, color: trustColor }}>
                {badge.label} · {trustScore.toFixed(0)}%
              </div>
              <div style={{ color: '#9ca3af', fontSize: '0.7rem' }}>
                {analysis.actionLabel}
              </div>
            </div>
          </div>

          {/* Suggestions */}
          {analysis.suggestions.length > 0 ? (
            <div>
              <div style={{
                fontSize: '0.7rem',
                color: '#9ca3af',
                marginBottom: '0.5rem',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                📋 建议检查
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {analysis.suggestions.map((suggestion, index) => (
                  <SuggestionItem key={index} suggestion={suggestion} />
                ))}
              </div>
            </div>
          ) : (
            <div style={{ color: '#9ca3af', fontSize: '0.75rem' }}>
              未检测到需要特别注意的内容
            </div>
          )}

          {/* Tip */}
          <div style={{
            marginTop: '0.75rem',
            paddingTop: '0.5rem',
            borderTop: '1px solid #374151',
            color: '#6b7280',
            fontSize: '0.65rem'
          }}>
            💡 点击 Verify 确认内容正确，点击 Modify 修改不准确处
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Individual suggestion item component
 */
const SuggestionItem: React.FC<{ suggestion: VerificationSuggestion }> = ({ suggestion }) => {
  const priorityColors = {
    high: '#ef4444',
    medium: '#f59e0b',
    low: '#6b7280',
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'flex-start',
      gap: '0.5rem',
      padding: '0.375rem 0.5rem',
      backgroundColor: '#374151',
      borderRadius: '0.375rem',
      borderLeft: `3px solid ${priorityColors[suggestion.priority]}`,
    }}>
      <span style={{ fontSize: '0.9rem', flexShrink: 0 }}>{suggestion.icon}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontWeight: 600,
          color: '#f3f4f6',
          fontSize: '0.75rem',
          lineHeight: 1.3
        }}>
          {suggestion.text}
        </div>
        <div style={{
          color: '#9ca3af',
          fontSize: '0.65rem',
          marginTop: '0.125rem'
        }}>
          {suggestion.reason}
        </div>
      </div>
    </div>
  );
};

export default TrustIndicator;
