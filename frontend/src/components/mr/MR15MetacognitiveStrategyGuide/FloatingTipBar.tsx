/**
 * MR15 Floating Tip Bar
 *
 * A minimal, non-intrusive tip bar that appears above the input area.
 * Shows contextual tips based on user's current phase.
 *
 * Features:
 * - Auto-shows based on intervention level (Level 2+)
 * - User can permanently disable
 * - Shows only 1 most relevant tip at a time
 * - Expandable for details and actions
 */
import React, { useState, useEffect, useCallback } from 'react';
import type { UserPhase } from './index';
import './FloatingTipBar.css';

// Tip structure (same as main component)
interface ContextualTip {
  id: string;
  phase: UserPhase | UserPhase[];
  tip: string;
  detail?: string;
  actionLabel?: string;
  actionType?: 'insert' | 'timer' | 'open-tool' | 'reflect';
  actionData?: string;
  priority: number;
}

// Tips data - single source of truth
const CONTEXTUAL_TIPS: ContextualTip[] = [
  // COMPOSING phase
  {
    id: 'think-first',
    phase: 'composing',
    tip: 'Think for 2 minutes before asking',
    detail: 'Try thinking it through first - you might already know the answer!',
    actionLabel: 'Start timer',
    actionType: 'timer',
    actionData: '120',
    priority: 10
  },
  {
    id: 'be-specific',
    phase: 'composing',
    tip: 'Be specific for better answers',
    detail: 'Describe your specific situation instead of asking general questions',
    actionLabel: 'Add template',
    actionType: 'insert',
    actionData: 'My situation: ...\nWhat I want to achieve: ...',
    priority: 8
  },

  // WAITING phase
  {
    id: 'predict',
    phase: 'waiting',
    tip: 'Predict what AI will say',
    detail: 'This helps you evaluate the response more critically',
    priority: 6
  },

  // RECEIVED phase
  {
    id: 'verify-facts',
    phase: 'received',
    tip: 'Verify key facts before trusting',
    detail: 'Double-check dates, data, and technical terms',
    actionLabel: 'Open verification',
    actionType: 'open-tool',
    actionData: 'mr11-verification',
    priority: 10
  },
  {
    id: 'ask-why',
    phase: 'received',
    tip: 'Ask "why" to understand the reasoning',
    detail: "Don't just accept - understand why this is the answer",
    actionLabel: 'Ask why',
    actionType: 'insert',
    actionData: 'Why is this the case? Can you explain the reasoning?',
    priority: 8
  },

  // IDLE phase
  {
    id: 'reflect',
    phase: 'idle',
    tip: 'Take a moment to reflect on what you learned',
    detail: 'Reflection helps consolidate learning',
    actionLabel: 'Open reflection',
    actionType: 'open-tool',
    actionData: 'mr14-reflection',
    priority: 5
  }
];

interface FloatingTipBarProps {
  phase: UserPhase;
  interventionLevel: number;  // 1-4, tips show at level 2+
  onInsertText?: (text: string) => void;
  onOpenTool?: (toolId: string) => void;
  onStartTimer?: (seconds: number) => void;
}

const STORAGE_KEY = 'mr15-tips-disabled';

export const FloatingTipBar: React.FC<FloatingTipBarProps> = ({
  phase,
  interventionLevel,
  onInsertText,
  onOpenTool,
  onStartTimer,
}) => {
  const [isDisabled, setIsDisabled] = useState(() => {
    return localStorage.getItem(STORAGE_KEY) === 'true';
  });
  const [isExpanded, setIsExpanded] = useState(false);
  const [dismissedTips, setDismissedTips] = useState<Set<string>>(() => {
    const saved = localStorage.getItem('mr15-dismissed-floating');
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });
  const [timerActive, setTimerActive] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);

  // Save dismissed tips
  useEffect(() => {
    localStorage.setItem('mr15-dismissed-floating', JSON.stringify([...dismissedTips]));
  }, [dismissedTips]);

  // Timer countdown
  useEffect(() => {
    if (!timerActive || timerSeconds <= 0) return;
    const interval = setInterval(() => {
      setTimerSeconds(prev => {
        if (prev <= 1) {
          setTimerActive(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [timerActive, timerSeconds]);

  // Get the most relevant tip for current phase
  const currentTip = CONTEXTUAL_TIPS
    .filter(tip => {
      const phases = Array.isArray(tip.phase) ? tip.phase : [tip.phase];
      return phases.includes(phase) && !dismissedTips.has(tip.id);
    })
    .sort((a, b) => b.priority - a.priority)[0];

  // Handle action
  const handleAction = useCallback((tip: ContextualTip) => {
    switch (tip.actionType) {
      case 'insert':
        if (onInsertText && tip.actionData) {
          onInsertText(tip.actionData);
        }
        break;
      case 'timer':
        if (onStartTimer && tip.actionData) {
          onStartTimer(parseInt(tip.actionData));
        } else {
          setTimerSeconds(parseInt(tip.actionData || '120'));
          setTimerActive(true);
        }
        break;
      case 'open-tool':
        if (onOpenTool && tip.actionData) {
          onOpenTool(tip.actionData);
        }
        break;
    }
    setIsExpanded(false);
    setDismissedTips(prev => new Set([...prev, tip.id]));
  }, [onInsertText, onOpenTool, onStartTimer]);

  // Dismiss current tip
  const dismissTip = () => {
    if (currentTip) {
      setDismissedTips(prev => new Set([...prev, currentTip.id]));
    }
    setIsExpanded(false);
  };

  // Permanently disable tips
  const disableTips = () => {
    setIsDisabled(true);
    localStorage.setItem(STORAGE_KEY, 'true');
  };

  // Don't show if:
  // - User disabled tips
  // - Intervention level is 1 (minimal)
  // - No relevant tip
  // - Timer is not active and no tip
  if (isDisabled || interventionLevel < 2 || (!currentTip && !timerActive)) {
    return null;
  }

  // Timer mode
  if (timerActive) {
    return (
      <div className="floating-tip-bar floating-tip-timer">
        <span className="floating-tip-timer-icon">⏱️</span>
        <span className="floating-tip-timer-display">
          {Math.floor(timerSeconds / 60)}:{(timerSeconds % 60).toString().padStart(2, '0')}
        </span>
        <span className="floating-tip-timer-text">Think it through...</span>
        <button
          className="floating-tip-timer-done"
          onClick={() => setTimerActive(false)}
        >
          Done
        </button>
      </div>
    );
  }

  if (!currentTip) return null;

  return (
    <div className={`floating-tip-bar ${isExpanded ? 'expanded' : ''}`}>
      <div
        className="floating-tip-main"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <span className="floating-tip-icon">💡</span>
        <span className="floating-tip-text">{currentTip.tip}</span>
        <button
          className="floating-tip-dismiss"
          onClick={(e) => { e.stopPropagation(); dismissTip(); }}
          title="Dismiss"
        >
          ×
        </button>
      </div>

      {isExpanded && (
        <div className="floating-tip-expanded">
          {currentTip.detail && (
            <p className="floating-tip-detail">{currentTip.detail}</p>
          )}
          <div className="floating-tip-actions">
            {currentTip.actionLabel && (
              <button
                className="floating-tip-action-btn"
                onClick={() => handleAction(currentTip)}
              >
                {currentTip.actionLabel}
              </button>
            )}
            <button
              className="floating-tip-disable-btn"
              onClick={disableTips}
            >
              Don't show tips
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FloatingTipBar;
