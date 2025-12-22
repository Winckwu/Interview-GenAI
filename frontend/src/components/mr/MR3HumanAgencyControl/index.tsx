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
// High autonomy patterns (A, C, E): Can choose any level
// Low autonomy patterns (B, D, F): Minimum is 'balanced'
const PATTERN_ALLOWED_LEVELS: Record<UserPatternType, InterventionLevel[]> = {
  'A': ['minimal', 'balanced', 'active'], // Strategic Learner - high autonomy
  'B': ['balanced', 'active'],             // Efficient Executor - skips verification
  'C': ['minimal', 'balanced', 'active'], // Curious Explorer - active learner
  'D': ['balanced', 'active'],             // Passive Consumer - needs guidance
  'E': ['minimal', 'balanced', 'active'], // Critical Thinker - high autonomy
  'F': ['balanced', 'active'],             // Over-reliant - needs intervention most
};

const PATTERN_RESTRICTION_MESSAGES: Record<UserPatternType, string> = {
  'A': '',
  'B': 'Based on your usage patterns, maintaining at least moderate reminders helps ensure verification habits.',
  'C': '',
  'D': 'Based on your usage patterns, maintaining reminders helps build stronger AI collaboration habits.',
  'E': '',
  'F': 'Based on your usage patterns, reminders are important to help maintain healthy AI interaction habits.',
};

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
  const isDefault = level === 'balanced';

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
            onClick={() => handleLevelChange('balanced')}
            title="Reset to default"
          >
            Reset
          </button>
        )}
      </div>

      <p className="mr3-subtitle">
        Control how often you receive metacognitive reminders
      </p>

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
              {l === 'balanced' && (
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
