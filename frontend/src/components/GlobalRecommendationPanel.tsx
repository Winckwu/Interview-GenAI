/**
 * GlobalRecommendationPanel Component
 *
 * Displays global MR chain recommendations:
 * - Context-aware MR tool chain suggestions
 * - One-click chain activation
 * - Behavior pattern analysis
 * - Welcome message and session phase guidance
 *
 * Extracted from ChatSessionPage.tsx as part of Phase 3 refactoring.
 */

import React from 'react';
import { type MRRecommendationSet } from '../utils/GlobalMRRecommendationEngine';

export interface GlobalRecommendationPanelProps {
  // Recommendations data
  recommendations: MRRecommendationSet[];
  welcomeMessage: string;
  behaviorPattern: string;
  sessionPhase: string;

  // Visibility
  isVisible: boolean;
  onClose: () => void;

  // Expanded state
  expandedRecommendation: string | null;
  onToggleExpanded: (id: string) => void;

  // Actions
  onActivateRecommendation: (recommendationId: string) => void;
  onDismissRecommendation: (recommendationId: string) => void;

  // Stats
  verifiedCount: number;
  modifiedCount: number;
  totalMessages: number;
}

/**
 * Priority badge component
 */
const PriorityBadge: React.FC<{ priority: 'critical' | 'high' | 'medium' | 'low' }> = ({ priority }) => {
  const styles = {
    critical: { bg: '#fee2e2', color: '#991b1b', label: 'CRITICAL' },
    high: { bg: '#fed7aa', color: '#9a3412', label: 'HIGH' },
    medium: { bg: '#fef3c7', color: '#92400e', label: 'MEDIUM' },
    low: { bg: '#dbeafe', color: '#1e40af', label: 'LOW' },
  };

  const style = styles[priority];

  return (
    <span
      style={{
        padding: '0.25rem 0.5rem',
        backgroundColor: style.bg,
        color: style.color,
        fontSize: '0.625rem',
        fontWeight: '700',
        borderRadius: '0.25rem',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
      }}
    >
      {style.label}
    </span>
  );
};

/**
 * Recommendation card component
 */
const RecommendationCard: React.FC<{
  recommendation: MRRecommendationSet;
  isExpanded: boolean;
  onToggle: () => void;
  onActivate: () => void;
  onDismiss: () => void;
}> = ({ recommendation, isExpanded, onToggle, onActivate, onDismiss }) => {
  return (
    <div
      style={{
        border: `2px solid ${recommendation.color}`,
        borderRadius: '0.5rem',
        marginBottom: '0.75rem',
        backgroundColor: '#fff',
        overflow: 'hidden',
      }}
    >
      {/* Card Header */}
      <div
        style={{
          padding: '0.75rem',
          backgroundColor: `${recommendation.color}15`,
          borderBottom: isExpanded ? `1px solid ${recommendation.color}30` : 'none',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          cursor: 'pointer',
        }}
        onClick={onToggle}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1 }}>
          <span style={{ fontSize: '1.25rem' }}>{recommendation.icon}</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: '600', fontSize: '0.875rem', color: '#1f2937', marginBottom: '0.25rem' }}>
              {recommendation.name}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
              {recommendation.tools.length} MR tools • {recommendation.priority} priority
            </div>
          </div>
          <PriorityBadge priority={recommendation.priority} />
        </div>
        <span style={{ fontSize: '0.875rem', color: '#9ca3af', marginLeft: '0.5rem' }}>
          {isExpanded ? '▼' : '▶'}
        </span>
      </div>

      {/* Card Body (Expanded) */}
      {isExpanded && (
        <div style={{ padding: '0.75rem' }}>
          <p style={{ margin: '0 0 0.75rem 0', fontSize: '0.8125rem', color: '#4b5563', lineHeight: '1.5' }}>
            {recommendation.description}
          </p>

          <div style={{ marginBottom: '0.75rem' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: '600', color: '#6b7280', marginBottom: '0.375rem' }}>
              Rationale:
            </div>
            <div style={{ fontSize: '0.75rem', color: '#6b7280', lineHeight: '1.4' }}>
              {recommendation.rationale}
            </div>
          </div>

          <div style={{ marginBottom: '0.75rem' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: '600', color: '#6b7280', marginBottom: '0.375rem' }}>
              Expected Benefit:
            </div>
            <div style={{ fontSize: '0.75rem', color: '#059669', lineHeight: '1.4', fontWeight: '500' }}>
              {recommendation.expectedBenefit}
            </div>
          </div>

          <div style={{ marginBottom: '0.75rem' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: '600', color: '#6b7280', marginBottom: '0.375rem' }}>
              MR Tools in this chain:
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
              {recommendation.toolNames.map((toolName, idx) => (
                <span
                  key={idx}
                  style={{
                    padding: '0.25rem 0.5rem',
                    backgroundColor: '#f3f4f6',
                    border: '1px solid #e5e7eb',
                    borderRadius: '0.25rem',
                    fontSize: '0.7rem',
                    color: '#374151',
                  }}
                >
                  {toolName}
                </span>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onActivate();
              }}
              style={{
                flex: 1,
                padding: '0.5rem 0.75rem',
                backgroundColor: recommendation.color,
                color: '#fff',
                border: 'none',
                borderRadius: '0.375rem',
                cursor: 'pointer',
                fontSize: '0.8125rem',
                fontWeight: '600',
                transition: 'opacity 0.2s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.9')}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
            >
              🚀 Activate Chain
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDismiss();
              }}
              style={{
                padding: '0.5rem 0.75rem',
                backgroundColor: '#f3f4f6',
                color: '#6b7280',
                border: '1px solid #e5e7eb',
                borderRadius: '0.375rem',
                cursor: 'pointer',
                fontSize: '0.8125rem',
                fontWeight: '500',
              }}
            >
              Dismiss
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Main panel component
 */
export const GlobalRecommendationPanel: React.FC<GlobalRecommendationPanelProps> = ({
  recommendations,
  welcomeMessage,
  behaviorPattern,
  sessionPhase,
  isVisible,
  onClose,
  expandedRecommendation,
  onToggleExpanded,
  onActivateRecommendation,
  onDismissRecommendation,
  verifiedCount,
  modifiedCount,
  totalMessages,
}) => {
  if (!isVisible) return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '2rem',
        right: '2rem',
        width: '420px',
        maxWidth: 'calc(100vw - 4rem)',
        maxHeight: 'calc(100vh - 4rem)',
        backgroundColor: '#fff',
        borderRadius: '0.75rem',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        border: '1px solid #e5e7eb',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        zIndex: 1000,
      }}
    >
      {/* Panel Header */}
      <div
        style={{
          padding: '1rem',
          borderBottom: '1px solid #e5e7eb',
          backgroundColor: '#f9fafb',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div>
          <h3 style={{ margin: '0 0 0.25rem 0', fontSize: '1rem', fontWeight: '600', color: '#1f2937' }}>
            🎯 Smart Recommendations
          </h3>
          <p style={{ margin: 0, fontSize: '0.75rem', color: '#6b7280' }}>
            {sessionPhase} • {behaviorPattern} pattern
          </p>
        </div>
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontSize: '1.25rem',
            color: '#9ca3af',
            padding: '0.25rem',
          }}
          title="Close panel"
        >
          ✕
        </button>
      </div>

      {/* Welcome Message & Stats */}
      {welcomeMessage && (
        <div style={{ padding: '1rem', borderBottom: '1px solid #e5e7eb', backgroundColor: '#eff6ff' }}>
          <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.8125rem', color: '#1e40af', lineHeight: '1.5' }}>
            {welcomeMessage}
          </p>
          <div style={{ display: 'flex', gap: '1rem', fontSize: '0.75rem', color: '#6b7280' }}>
            <span>📊 {totalMessages} messages</span>
            <span>✅ {verifiedCount} verified</span>
            <span>✎ {modifiedCount} modified</span>
          </div>
        </div>
      )}

      {/* Recommendations List */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '1rem' }}>
        {recommendations.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem 1rem', color: '#9ca3af' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>✨</div>
            <div style={{ fontSize: '0.875rem', fontWeight: '500' }}>No recommendations at this time</div>
            <div style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>
              Continue your session and check back later
            </div>
          </div>
        ) : (
          recommendations.map((rec) => (
            <RecommendationCard
              key={rec.id}
              recommendation={rec}
              isExpanded={expandedRecommendation === rec.id}
              onToggle={() => onToggleExpanded(rec.id)}
              onActivate={() => onActivateRecommendation(rec.id)}
              onDismiss={() => onDismissRecommendation(rec.id)}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default GlobalRecommendationPanel;
