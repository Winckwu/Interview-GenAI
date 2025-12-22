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
 * Evidence: 27/49 users (55%) fear AI over-intervention erodes autonomy
 */

import React, { useState, useCallback, useEffect } from 'react';
import './styles.css';

export type InterventionLevel = 'minimal' | 'balanced' | 'active';

// Map old values to new for backwards compatibility
const LEVEL_MIGRATION: Record<string, InterventionLevel> = {
  'passive': 'minimal',
  'suggestive': 'balanced',
  'proactive': 'active',
};

interface MR3Props {
  interventionLevel?: InterventionLevel | string;
  onInterventionLevelChange?: (level: InterventionLevel) => void;
  sessionId?: string;
  compact?: boolean;
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
}) => {
  // Migrate old level names if needed
  const normalizeLevel = (level: string | undefined): InterventionLevel => {
    if (!level) return 'balanced';
    if (level in LEVEL_MIGRATION) return LEVEL_MIGRATION[level];
    if (level in LEVEL_CONFIG) return level as InterventionLevel;
    return 'balanced';
  };

  const [level, setLevel] = useState<InterventionLevel>(() =>
    normalizeLevel(externalLevel)
  );
  const [isExpanded, setIsExpanded] = useState(!compact);

  // Sync with external prop
  useEffect(() => {
    if (externalLevel) {
      setLevel(normalizeLevel(externalLevel));
    }
  }, [externalLevel]);

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
  }, []);

  const handleLevelChange = useCallback((newLevel: InterventionLevel) => {
    setLevel(newLevel);
    onInterventionLevelChange?.(newLevel);
  }, [onInterventionLevelChange]);

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
            {levels.map((l) => (
              <button
                key={l}
                className={`mr3-compact-option ${level === l ? 'active' : ''}`}
                onClick={() => handleLevelChange(l)}
              >
                <span>{LEVEL_CONFIG[l].icon}</span>
                <span>{LEVEL_CONFIG[l].label}</span>
              </button>
            ))}
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

          return (
            <button
              key={l}
              className={`mr3-level-btn ${isActive ? 'active' : ''}`}
              onClick={() => handleLevelChange(l)}
              aria-pressed={isActive}
            >
              <span className="mr3-level-icon">{cfg.icon}</span>
              <span className="mr3-level-label">{cfg.label}</span>
              {l === 'balanced' && (
                <span className="mr3-level-default">Default</span>
              )}
            </button>
          );
        })}
      </div>

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
