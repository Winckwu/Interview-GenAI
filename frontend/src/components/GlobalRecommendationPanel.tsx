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
 * Styles extracted to CSS Module as part of Phase 4 refactoring.
 */

import React from 'react';
import { type MRRecommendationSet } from '../utils/GlobalMRRecommendationEngine';
import styles from './GlobalRecommendationPanel.module.css';

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
  const labels = {
    critical: 'CRITICAL',
    high: 'HIGH',
    medium: 'MEDIUM',
    low: 'LOW',
  };

  return (
    <span className={`${styles.priorityBadge} ${styles[priority]}`}>
      {labels[priority]}
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
      className={styles.card}
      style={{
        border: `2px solid ${recommendation.color}`,
      }}
    >
      {/* Card Header */}
      <div
        className={styles.cardHeader}
        style={{
          backgroundColor: `${recommendation.color}15`,
          borderBottom: isExpanded ? `1px solid ${recommendation.color}30` : 'none',
        }}
        onClick={onToggle}
      >
        <div className={styles.cardHeaderContent}>
          <span className={styles.cardIcon}>{recommendation.icon}</span>
          <div className={styles.cardTitleContainer}>
            <div className={styles.cardTitle}>
              {recommendation.name}
            </div>
            <div className={styles.cardMeta}>
              {recommendation.tools.length} MR tools • {recommendation.priority} priority
            </div>
          </div>
          <PriorityBadge priority={recommendation.priority} />
        </div>
        <span className={styles.expandIcon}>
          {isExpanded ? '▼' : '▶'}
        </span>
      </div>

      {/* Card Body (Expanded) */}
      {isExpanded && (
        <div className={styles.cardBody}>
          <p className={styles.description}>
            {recommendation.description}
          </p>

          <div className={styles.section}>
            <div className={styles.sectionLabel}>
              Rationale:
            </div>
            <div className={styles.sectionContent}>
              {recommendation.rationale}
            </div>
          </div>

          <div className={styles.section}>
            <div className={styles.sectionLabel}>
              Expected Benefit:
            </div>
            <div className={styles.benefit}>
              {recommendation.expectedBenefit}
            </div>
          </div>

          <div className={styles.section}>
            <div className={styles.sectionLabel}>
              MR Tools in this chain:
            </div>
            <div className={styles.toolBadgesContainer}>
              {recommendation.toolNames.map((toolName, idx) => (
                <span key={idx} className={styles.toolBadge}>
                  {toolName}
                </span>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className={styles.actionButtons}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onActivate();
              }}
              className={styles.activateButton}
              style={{
                backgroundColor: recommendation.color,
              }}
            >
              🚀 Activate Chain
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDismiss();
              }}
              className={styles.dismissButton}
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
    <div className={styles.panel}>
      {/* Panel Header */}
      <div className={styles.header}>
        <div>
          <h3 className={styles.headerTitle}>
            🎯 Smart Recommendations
          </h3>
          <p className={styles.headerSubtitle}>
            {sessionPhase} • {behaviorPattern} pattern
          </p>
        </div>
        <button
          onClick={onClose}
          className={styles.closeButton}
          title="Close panel"
        >
          ✕
        </button>
      </div>

      {/* Welcome Message & Stats */}
      {welcomeMessage && (
        <div className={styles.welcomeSection}>
          <p className={styles.welcomeMessage}>
            {welcomeMessage}
          </p>
          <div className={styles.statsContainer}>
            <span>📊 {totalMessages} messages</span>
            <span>✅ {verifiedCount} verified</span>
            <span>✎ {modifiedCount} modified</span>
          </div>
        </div>
      )}

      {/* Recommendations List */}
      <div className={styles.recommendationsList}>
        {recommendations.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>✨</div>
            <div className={styles.emptyTitle}>No recommendations at this time</div>
            <div className={styles.emptySubtitle}>
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
