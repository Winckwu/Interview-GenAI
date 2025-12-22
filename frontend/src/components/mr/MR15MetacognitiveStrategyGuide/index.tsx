/**
 * MR15: Quick Tips - Simplified Strategy Guide
 *
 * Redesigned for better UX:
 * - Simple, contextual tips instead of overwhelming library
 * - 3 phases: Before Ask, While Working, After Response
 * - One-liner tips with quick actions
 * - Light progress tracking
 */

import React, { useState, useCallback, useEffect } from 'react';
import './styles.css';

// Simple tip structure
interface QuickTip {
  id: string;
  phase: 'before' | 'during' | 'after';
  tip: string;
  action: string;
  detail?: string;
}

// All quick tips organized by phase
const QUICK_TIPS: QuickTip[] = [
  // Before asking
  { id: 'think-first', phase: 'before', tip: 'Think for 2 minutes before asking', action: 'Set Timer', detail: 'Write down what you already know, then ask a specific question' },
  { id: 'break-down', phase: 'before', tip: 'Break big tasks into small steps', action: 'Try Now', detail: 'Ask about one step at a time, not everything at once' },
  { id: 'clear-goal', phase: 'before', tip: 'Know what "good enough" looks like', action: 'Define Goal', detail: 'Before iterating, decide what success means' },

  // While working
  { id: 'mark-unsure', phase: 'during', tip: 'Mark anything you need to verify', action: 'Got it', detail: 'Facts, dates, technical details - flag them for checking' },
  { id: 'understand', phase: 'during', tip: 'Can you explain this yourself?', action: 'Self-Check', detail: 'If you can\'t explain it, ask for clarification' },
  { id: 'ask-why', phase: 'during', tip: 'Ask "why" to understand reasoning', action: 'Try Now', detail: 'Don\'t just accept - understand the logic behind suggestions' },

  // After response
  { id: 'verify', phase: 'after', tip: 'Check important facts elsewhere', action: 'Verify', detail: 'Cross-reference key claims with other sources' },
  { id: 'iterate', phase: 'after', tip: 'Ask for variations if unsure', action: 'Request Options', detail: 'Get 2-3 different approaches, then pick the best' },
  { id: 'reflect', phase: 'after', tip: 'What did you learn from this?', action: 'Reflect', detail: 'Take a moment to consolidate what you gained' },
];

const PHASE_INFO = {
  before: { icon: '🎯', label: 'Before You Ask', color: '#3b82f6' },
  during: { icon: '👁️', label: 'While Working', color: '#f59e0b' },
  after: { icon: '✅', label: 'After Response', color: '#10b981' },
};

interface MR15Props {
  compact?: boolean;
  onTipApplied?: (tipId: string) => void;
  // Context for showing relevant tips
  currentPhase?: 'before' | 'during' | 'after';
}

export const MR15MetacognitiveStrategyGuide: React.FC<MR15Props> = ({
  compact = true,
  onTipApplied,
  currentPhase,
}) => {
  // Track which tips user has acknowledged
  const [learnedTips, setLearnedTips] = useState<Set<string>>(() => {
    const saved = localStorage.getItem('mr15-learned-tips');
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });

  // Expanded tip for detail view
  const [expandedTip, setExpandedTip] = useState<string | null>(null);

  // Active phase filter (null = show all)
  const [activePhase, setActivePhase] = useState<'before' | 'during' | 'after' | null>(currentPhase || null);

  // Save learned tips to localStorage
  useEffect(() => {
    localStorage.setItem('mr15-learned-tips', JSON.stringify([...learnedTips]));
  }, [learnedTips]);

  // Handle tip action
  const handleTipAction = useCallback((tip: QuickTip) => {
    setLearnedTips(prev => new Set([...prev, tip.id]));
    if (onTipApplied) {
      onTipApplied(tip.id);
    }
    setExpandedTip(null);
  }, [onTipApplied]);

  // Toggle tip expansion
  const toggleTip = useCallback((tipId: string) => {
    setExpandedTip(prev => prev === tipId ? null : tipId);
  }, []);

  // Filter tips by phase
  const filteredTips = activePhase
    ? QUICK_TIPS.filter(t => t.phase === activePhase)
    : QUICK_TIPS;

  // Calculate progress
  const totalTips = QUICK_TIPS.length;
  const learnedCount = learnedTips.size;

  return (
    <div className={`mr15-v2-container ${compact ? 'compact' : ''}`}>
      {/* Header */}
      <div className="mr15-v2-header">
        <div className="mr15-v2-title">
          <span className="mr15-v2-icon">💡</span>
          <span>Quick Tips</span>
        </div>
        <div className="mr15-v2-progress">
          {[...Array(5)].map((_, i) => (
            <span
              key={i}
              className={`mr15-v2-dot ${i < Math.ceil(learnedCount / 2) ? 'filled' : ''}`}
            />
          ))}
          <span className="mr15-v2-count">{learnedCount}/{totalTips}</span>
        </div>
      </div>

      {/* Phase Tabs */}
      <div className="mr15-v2-phases">
        <button
          className={`mr15-v2-phase-btn ${activePhase === null ? 'active' : ''}`}
          onClick={() => setActivePhase(null)}
        >
          All
        </button>
        {(['before', 'during', 'after'] as const).map(phase => (
          <button
            key={phase}
            className={`mr15-v2-phase-btn ${activePhase === phase ? 'active' : ''}`}
            onClick={() => setActivePhase(phase)}
            style={{ '--phase-color': PHASE_INFO[phase].color } as React.CSSProperties}
          >
            {PHASE_INFO[phase].icon}
          </button>
        ))}
      </div>

      {/* Tips List */}
      <div className="mr15-v2-tips">
        {(['before', 'during', 'after'] as const).map(phase => {
          const phaseTips = filteredTips.filter(t => t.phase === phase);
          if (phaseTips.length === 0) return null;

          return (
            <div key={phase} className="mr15-v2-section">
              {!activePhase && (
                <div
                  className="mr15-v2-section-header"
                  style={{ borderLeftColor: PHASE_INFO[phase].color }}
                >
                  <span>{PHASE_INFO[phase].icon}</span>
                  <span>{PHASE_INFO[phase].label}</span>
                </div>
              )}

              {phaseTips.map(tip => {
                const isLearned = learnedTips.has(tip.id);
                const isExpanded = expandedTip === tip.id;

                return (
                  <div
                    key={tip.id}
                    className={`mr15-v2-tip ${isLearned ? 'learned' : ''} ${isExpanded ? 'expanded' : ''}`}
                  >
                    <div
                      className="mr15-v2-tip-main"
                      onClick={() => toggleTip(tip.id)}
                    >
                      <span className={`mr15-v2-tip-check ${isLearned ? 'checked' : ''}`}>
                        {isLearned ? '✓' : '○'}
                      </span>
                      <span className="mr15-v2-tip-text">{tip.tip}</span>
                      <span className="mr15-v2-tip-arrow">{isExpanded ? '▲' : '▼'}</span>
                    </div>

                    {isExpanded && (
                      <div className="mr15-v2-tip-detail">
                        <p>{tip.detail}</p>
                        <button
                          className="mr15-v2-tip-action"
                          onClick={() => handleTipAction(tip)}
                          style={{ '--phase-color': PHASE_INFO[phase].color } as React.CSSProperties}
                        >
                          {isLearned ? '✓ Done' : tip.action}
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* Footer encouragement */}
      {learnedCount >= 5 && (
        <div className="mr15-v2-achievement">
          🎉 Great progress! You're developing strong AI collaboration habits.
        </div>
      )}
    </div>
  );
};

export default MR15MetacognitiveStrategyGuide;
