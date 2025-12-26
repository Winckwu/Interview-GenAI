/**
 * MR3: Reminder Frequency Control
 *
 * Simplified component that allows users to control how often they receive
 * metacognitive reminders (soft/medium/hard interventions).
 *
 * Levels:
 * - Minimal: Only critical warnings (hard tier)
 * - Balanced: Moderate guidance (medium + hard tier) - DEFAULT
 * - Active: Comprehensive coaching (all tiers)
 *
 * Pattern-based restrictions:
 * - Patterns A, C, E (high autonomy): All levels available
 * - Patterns B, D, F (need intervention): Minimal not available
 *
 * Evidence: 27/49 users (55%) fear AI over-intervention erodes autonomy
 */

import React, { useState, useCallback, useEffect } from 'react';
import './styles.css';

export type InterventionLevel = 'minimal' | 'balanced' | 'active';
export type UserPatternType = 'A' | 'B' | 'C' | 'D' | 'E' | 'F';

// Map old values to new for backwards compatibility
const LEVEL_MIGRATION: Record<string, InterventionLevel> = {
  'passive': 'minimal',
  'suggestive': 'balanced',
  'proactive': 'active',
};

// Pattern-based level restrictions
// Only Pattern F (Passive Dependency) needs intervention restrictions
// All other patterns have sufficient metacognitive engagement
const PATTERN_ALLOWED_LEVELS: Record<UserPatternType, InterventionLevel[]> = {
  'A': ['minimal', 'balanced', 'active'], // Strategic Decomposition - high planning & control
  'B': ['minimal', 'balanced', 'active'], // Iterative Refinement - active experimentation & learning
  'C': ['minimal', 'balanced', 'active'], // Context-Sensitive Adaptation - flexible strategies
  'D': ['minimal', 'balanced', 'active'], // Deep Verification - systematic verification
  'E': ['minimal', 'balanced', 'active'], // Pedagogical Reflection - learning-oriented
  'F': ['balanced', 'active'],             // Passive Dependency - CRITICAL: needs intervention
};

const PATTERN_RESTRICTION_MESSAGES: Record<UserPatternType, string> = {
  'A': '',
  'B': '',
  'C': '',
  'D': '',
  'E': '',
  'F': 'Your usage pattern shows signs of passive dependency. Maintaining reminders helps build healthier AI collaboration habits and prevents skill atrophy.',
};

// Pattern display names for UI
const PATTERN_DISPLAY: Record<UserPatternType, { name: string; icon: string; description: string }> = {
  'A': { name: 'Strategic Decomposition', icon: '🎯', description: 'High planning & control' },
  'B': { name: 'Iterative Refinement', icon: '🔄', description: 'Active experimentation' },
  'C': { name: 'Context-Adaptive', icon: '🌊', description: 'Flexible strategies' },
  'D': { name: 'Deep Verification', icon: '🔍', description: 'Systematic checking' },
  'E': { name: 'Pedagogical Reflection', icon: '📚', description: 'Learning-oriented' },
  'F': { name: 'Passive Dependency', icon: '⚠️', description: 'Needs intervention support' },
};

// LLM Explanation type
interface PatternExplanation {
  explanation: string;
  keyBehaviors: string[];
  recommendations: string[];
  riskLevel: 'low' | 'medium' | 'high';
}

interface MR3Props {
  interventionLevel?: InterventionLevel | string;
  onInterventionLevelChange?: (level: InterventionLevel) => void;
  sessionId?: string;
  compact?: boolean;
  userPattern?: UserPatternType; // Current user behavior pattern
}

const LEVEL_CONFIG = {
  minimal: {
    icon: '🔕',
    label: 'Minimal',
    description: 'Only critical warnings when needed',
    tiers: ['hard'],
  },
  balanced: {
    icon: '⚖️',
    label: 'Balanced',
    description: 'Moderate reminders for better habits',
    tiers: ['medium', 'hard'],
  },
  active: {
    icon: '🔔',
    label: 'Active',
    description: 'Comprehensive coaching support',
    tiers: ['soft', 'medium', 'hard'],
  },
} as const;

export const MR3HumanAgencyControl: React.FC<MR3Props> = ({
  interventionLevel: externalLevel,
  onInterventionLevelChange,
  sessionId,
  compact = false,
  userPattern,
}) => {
  // Get allowed levels based on user pattern
  const allowedLevels = userPattern
    ? PATTERN_ALLOWED_LEVELS[userPattern]
    : ['minimal', 'balanced', 'active'] as InterventionLevel[];

  const restrictionMessage = userPattern
    ? PATTERN_RESTRICTION_MESSAGES[userPattern]
    : '';

  // LLM Explanation state for Pattern F
  const [explanation, setExplanation] = useState<PatternExplanation | null>(null);
  const [loadingExplanation, setLoadingExplanation] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);

  // Fetch LLM explanation when Pattern F is detected
  useEffect(() => {
    if (userPattern === 'F' && sessionId) {
      const fetchExplanation = async () => {
        setLoadingExplanation(true);
        try {
          const response = await fetch(`/api/mca/explanation/${sessionId}`);
          const data = await response.json();
          if (data.success && data.data.hasExplanation) {
            setExplanation(data.data.explanation);
          }
        } catch (error) {
          console.warn('[MR3] Failed to fetch pattern explanation:', error);
        } finally {
          setLoadingExplanation(false);
        }
      };

      // Delay fetch slightly to allow async generation to complete
      const timer = setTimeout(fetchExplanation, 3000);
      return () => clearTimeout(timer);
    }
  }, [userPattern, sessionId]);

  // Migrate old level names if needed, respecting pattern restrictions
  const normalizeLevel = useCallback((level: string | undefined): InterventionLevel => {
    let normalized: InterventionLevel = 'balanced';
    if (!level) {
      normalized = 'balanced';
    } else if (level in LEVEL_MIGRATION) {
      normalized = LEVEL_MIGRATION[level];
    } else if (level in LEVEL_CONFIG) {
      normalized = level as InterventionLevel;
    }

    // If the level is not allowed for this pattern, default to the minimum allowed
    if (!allowedLevels.includes(normalized)) {
      normalized = allowedLevels[0]; // First allowed level (usually 'balanced')
    }

    return normalized;
  }, [allowedLevels]);

  const [level, setLevel] = useState<InterventionLevel>(() =>
    normalizeLevel(externalLevel)
  );
  const [isExpanded, setIsExpanded] = useState(!compact);

  // Sync with external prop
  useEffect(() => {
    if (externalLevel) {
      setLevel(normalizeLevel(externalLevel));
    }
  }, [externalLevel, normalizeLevel]);

  // Re-validate level when pattern changes
  useEffect(() => {
    if (!allowedLevels.includes(level)) {
      const newLevel = allowedLevels[0];
      setLevel(newLevel);
      onInterventionLevelChange?.(newLevel);
    }
  }, [userPattern, allowedLevels, level, onInterventionLevelChange]);

  // Persist to localStorage
  useEffect(() => {
    localStorage.setItem('mr3-intervention-level', level);
  }, [level]);

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('mr3-intervention-level');
    if (saved && !externalLevel) {
      setLevel(normalizeLevel(saved));
    }
  }, [externalLevel, normalizeLevel]);

  const handleLevelChange = useCallback((newLevel: InterventionLevel) => {
    // Only allow changing to permitted levels
    if (!allowedLevels.includes(newLevel)) return;
    setLevel(newLevel);
    onInterventionLevelChange?.(newLevel);
  }, [onInterventionLevelChange, allowedLevels]);

  const levels: InterventionLevel[] = ['minimal', 'balanced', 'active'];
  const currentIndex = levels.indexOf(level);
  const config = LEVEL_CONFIG[level];
  const isDefault = level === 'active';

  if (compact) {
    return (
      <div className="mr3-compact">
        <button
          className="mr3-compact-toggle"
          onClick={() => setIsExpanded(!isExpanded)}
          aria-expanded={isExpanded}
        >
          <span className="mr3-compact-icon">{config.icon}</span>
          <span className="mr3-compact-label">Reminders: {config.label}</span>
          <span className="mr3-compact-arrow">{isExpanded ? '▲' : '▼'}</span>
        </button>

        {isExpanded && (
          <div className="mr3-compact-dropdown">
            {levels.map((l) => {
              const isAllowed = allowedLevels.includes(l);
              return (
                <button
                  key={l}
                  className={`mr3-compact-option ${level === l ? 'active' : ''} ${!isAllowed ? 'disabled' : ''}`}
                  onClick={() => isAllowed && handleLevelChange(l)}
                  disabled={!isAllowed}
                  title={!isAllowed ? 'Not available for your current usage pattern' : ''}
                >
                  <span>{LEVEL_CONFIG[l].icon}</span>
                  <span>{LEVEL_CONFIG[l].label}</span>
                  {!isAllowed && <span className="mr3-locked">🔒</span>}
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="mr3-container mr3-simplified">
      <div className="mr3-header">
        <h3 className="mr3-title">
          <span className="mr3-title-icon">🎚️</span>
          Reminder Frequency
        </h3>
        {!isDefault && (
          <button
            className="mr3-reset-btn"
            onClick={() => handleLevelChange('active')}
            title="Reset to default"
          >
            Reset
          </button>
        )}
      </div>

      <p className="mr3-subtitle">
        Control how often you receive metacognitive reminders
      </p>

      {/* Current Pattern Indicator */}
      {userPattern && (
        <div className="mr3-pattern-indicator" style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.5rem 0.75rem',
          marginBottom: '0.75rem',
          backgroundColor: userPattern === 'F' ? '#fef2f2' : '#f0fdf4',
          border: `1px solid ${userPattern === 'F' ? '#fecaca' : '#bbf7d0'}`,
          borderRadius: '0.5rem',
          fontSize: '0.85rem',
        }}>
          <span style={{ fontSize: '1.1rem' }}>{PATTERN_DISPLAY[userPattern].icon}</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, color: userPattern === 'F' ? '#dc2626' : '#15803d' }}>
              Current: Pattern {userPattern} - {PATTERN_DISPLAY[userPattern].name}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
              {PATTERN_DISPLAY[userPattern].description}
            </div>
          </div>
          {/* Show explanation toggle for Pattern F */}
          {userPattern === 'F' && (explanation || loadingExplanation) && (
            <button
              onClick={() => setShowExplanation(!showExplanation)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: '0.8rem',
                color: '#6b7280',
                padding: '0.25rem',
              }}
              title={showExplanation ? 'Hide details' : 'Show details'}
            >
              {showExplanation ? '▼' : '▶'} Details
            </button>
          )}
        </div>
      )}

      {/* LLM Explanation for Pattern F */}
      {userPattern === 'F' && showExplanation && (
        <div style={{
          padding: '0.75rem',
          marginBottom: '0.75rem',
          backgroundColor: '#fef3c7',
          border: '1px solid #fcd34d',
          borderRadius: '0.5rem',
          fontSize: '0.85rem',
        }}>
          {loadingExplanation ? (
            <div style={{ color: '#92400e', textAlign: 'center' }}>
              <span style={{ marginRight: '0.5rem' }}>🔍</span>
              Analyzing your interaction pattern...
            </div>
          ) : explanation ? (
            <div>
              {/* Explanation */}
              <div style={{ marginBottom: '0.75rem', color: '#92400e' }}>
                <strong>📝 Analysis:</strong> {explanation.explanation}
              </div>

              {/* Key Behaviors */}
              {explanation.keyBehaviors && explanation.keyBehaviors.length > 0 && (
                <div style={{ marginBottom: '0.75rem' }}>
                  <strong style={{ color: '#92400e' }}>🔍 Observed Behaviors:</strong>
                  <ul style={{ margin: '0.25rem 0 0 1rem', padding: 0, color: '#78350f' }}>
                    {explanation.keyBehaviors.map((behavior, idx) => (
                      <li key={idx} style={{ marginBottom: '0.15rem' }}>{behavior}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Recommendations */}
              {explanation.recommendations && explanation.recommendations.length > 0 && (
                <div>
                  <strong style={{ color: '#15803d' }}>💡 Suggestions:</strong>
                  <ul style={{ margin: '0.25rem 0 0 1rem', padding: 0, color: '#166534' }}>
                    {explanation.recommendations.map((rec, idx) => (
                      <li key={idx} style={{ marginBottom: '0.15rem' }}>{rec}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <div style={{ color: '#92400e', textAlign: 'center' }}>
              <span style={{ marginRight: '0.5rem' }}>ℹ️</span>
              Explanation will be available after more interactions.
            </div>
          )}
        </div>
      )}

      {/* Level Selector */}
      <div className="mr3-level-selector">
        {levels.map((l, idx) => {
          const cfg = LEVEL_CONFIG[l];
          const isActive = level === l;
          const isAllowed = allowedLevels.includes(l);

          return (
            <button
              key={l}
              className={`mr3-level-btn ${isActive ? 'active' : ''} ${!isAllowed ? 'disabled' : ''}`}
              onClick={() => isAllowed && handleLevelChange(l)}
              aria-pressed={isActive}
              disabled={!isAllowed}
              title={!isAllowed ? 'Not available for your current usage pattern' : ''}
            >
              <span className="mr3-level-icon">{cfg.icon}</span>
              <span className="mr3-level-label">{cfg.label}</span>
              {l === 'active' && (
                <span className="mr3-level-default">Default</span>
              )}
              {!isAllowed && <span className="mr3-locked-icon">🔒</span>}
            </button>
          );
        })}
      </div>

      {/* Pattern restriction notice */}
      {restrictionMessage && (
        <div className="mr3-restriction-notice">
          <span className="mr3-restriction-icon">ℹ️</span>
          <span className="mr3-restriction-text">{restrictionMessage}</span>
        </div>
      )}

      {/* Current Level Description */}
      <div className="mr3-current-level">
        <div className="mr3-level-description">
          <span className="mr3-desc-icon">{config.icon}</span>
          <span className="mr3-desc-text">{config.description}</span>
        </div>

        {/* Visual indicator of what tiers are enabled */}
        <div className="mr3-tier-indicators">
          <span className="mr3-tier-label">Active reminders:</span>
          <div className="mr3-tier-badges">
            {['soft', 'medium', 'hard'].map((tier) => {
              const isEnabled = config.tiers.includes(tier as any);
              return (
                <span
                  key={tier}
                  className={`mr3-tier-badge mr3-tier-${tier} ${isEnabled ? 'enabled' : 'disabled'}`}
                  title={
                    tier === 'soft' ? 'Gentle tips and suggestions' :
                    tier === 'medium' ? 'Important reminders' :
                    'Critical warnings'
                  }
                >
                  {tier === 'soft' ? '💡' : tier === 'medium' ? '⚠️' : '🚨'}
                </span>
              );
            })}
          </div>
        </div>
      </div>

      {/* Help text */}
      <p className="mr3-help-text">
        {level === 'minimal' && "You'll only see critical warnings when there's a significant concern."}
        {level === 'balanced' && "You'll receive moderate guidance to help build better AI collaboration habits."}
        {level === 'active' && "You'll get comprehensive coaching with tips, reminders, and warnings."}
      </p>
    </div>
  );
};

/**
 * Helper function to get allowed tiers based on intervention level
 */
export function getAllowedTiers(level: InterventionLevel | string): string[] {
  const normalizedLevel = level in LEVEL_CONFIG
    ? level as InterventionLevel
    : (LEVEL_MIGRATION[level] || 'balanced');
  return [...LEVEL_CONFIG[normalizedLevel].tiers];
}

/**
 * Check if a tier is allowed based on current intervention level
 */
export function isTierAllowed(tier: 'soft' | 'medium' | 'hard', level: InterventionLevel | string): boolean {
  const allowedTiers = getAllowedTiers(level);
  return allowedTiers.includes(tier);
}

export default MR3HumanAgencyControl;
