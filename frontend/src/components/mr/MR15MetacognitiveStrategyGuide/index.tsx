/**
 * MR15: Contextual Strategy Tips
 *
 * Key principles:
 * 1. 情境化触发 - Shows tips based on what user is currently doing
 * 2. 简化展示 - Only 1-2 most relevant tips at a time
 * 3. 实践导向 - Actions directly affect current task
 * 4. 通俗化语言 - Simple, conversational language
 */
import React, { useState, useEffect, useCallback } from 'react';
import './styles.css';

// User's current context/phase
export type UserPhase =
  | 'composing'   // Writing a message
  | 'waiting'     // Sent message, waiting for response
  | 'received'    // Just got AI response
  | 'idle';       // Not actively doing anything

// Tip structure
interface ContextualTip {
  id: string;
  phase: UserPhase | UserPhase[];
  tip: string;           // Short, conversational
  detail?: string;       // Expanded explanation
  actionLabel?: string;  // Button text
  actionType?: 'insert' | 'timer' | 'open-tool' | 'reflect';
  actionData?: string;   // Data for action
  priority: number;      // Higher = more important
}

// Simple, conversational tips in English
const CONTEXTUAL_TIPS: ContextualTip[] = [
  // COMPOSING phase - before sending
  {
    id: 'think-first',
    phase: 'composing',
    tip: 'Think for 2 minutes before asking',
    detail: 'Try thinking it through first - you might already know the answer!',
    actionLabel: 'Start 2-min timer',
    actionType: 'timer',
    actionData: '120',
    priority: 10
  },
  {
    id: 'be-specific',
    phase: 'composing',
    tip: 'Be specific for better answers',
    detail: 'Instead of "how to do X", describe your specific situation',
    actionLabel: 'Add context template',
    actionType: 'insert',
    actionData: 'My situation: ...\nWhat I want to achieve: ...',
    priority: 8
  },
  {
    id: 'break-down',
    phase: 'composing',
    tip: 'Break big tasks into small steps',
    detail: 'Ask one small question at a time for better results',
    actionLabel: 'Ask to break down',
    actionType: 'insert',
    actionData: 'Please help me break this task into smaller steps first:',
    priority: 7
  },

  // WAITING phase - after sending
  {
    id: 'predict',
    phase: 'waiting',
    tip: 'Predict what AI will say',
    detail: 'While waiting, think: what do you expect? This helps you evaluate the response',
    priority: 6
  },

  // RECEIVED phase - after getting response
  {
    id: 'verify-facts',
    phase: 'received',
    tip: 'Verify key facts',
    detail: 'Double-check dates, data, and technical terms from other sources',
    actionLabel: 'Mark for verification',
    actionType: 'reflect',
    actionData: 'verify',
    priority: 10
  },
  {
    id: 'ask-why',
    phase: 'received',
    tip: 'Ask "why" to understand',
    detail: "Don't just accept - understand the reasoning behind the answer",
    actionLabel: 'Ask for explanation',
    actionType: 'insert',
    actionData: 'Why is this the case? Can you explain the reasoning?',
    priority: 8
  },
  {
    id: 'get-options',
    phase: 'received',
    tip: 'Ask for alternatives',
    detail: 'Get multiple options so you can make a better choice',
    actionLabel: 'Request alternatives',
    actionType: 'insert',
    actionData: 'Are there other approaches? What are the pros and cons of each?',
    priority: 7
  },
  {
    id: 'check-blind-spots',
    phase: 'received',
    tip: 'Check for blind spots',
    detail: 'AI might not have considered your specific situation',
    actionLabel: 'Ask about limitations',
    actionType: 'insert',
    actionData: 'What are the potential issues or limitations with this approach? Anything I should watch out for?',
    priority: 6
  },

  // IDLE phase - general
  {
    id: 'reflect',
    phase: 'idle',
    tip: 'Reflect on the conversation',
    detail: 'What did you learn? How can you ask better next time?',
    actionLabel: 'Open reflection tool',
    actionType: 'open-tool',
    actionData: 'mr14-reflection',
    priority: 5
  }
];

interface MR15Props {
  // Current user phase (auto-detected or passed from parent)
  phase?: UserPhase;

  // Callbacks for actions
  onInsertText?: (text: string) => void;      // Insert text into input
  onOpenTool?: (toolId: string) => void;      // Open another MR tool
  onStartTimer?: (seconds: number) => void;   // Start a timer
  onReflect?: (type: string) => void;         // Trigger reflection

  // Legacy props for compatibility
  taskType?: string;
  userLevel?: string;
  onStrategySelect?: (strategy: any) => void;
  onOpenMR19?: () => void;

  // Display options
  compact?: boolean;
  maxTips?: number;  // Max tips to show (default: 2)
}

export const MR15MetacognitiveStrategyGuide: React.FC<MR15Props> = ({
  phase = 'idle',
  onInsertText,
  onOpenTool,
  onStartTimer,
  onReflect,
  onStrategySelect,
  compact = true,
  maxTips = 2
}) => {
  const [expandedTip, setExpandedTip] = useState<string | null>(null);
  const [dismissedTips, setDismissedTips] = useState<Set<string>>(() => {
    // Load dismissed tips from localStorage
    const saved = localStorage.getItem('mr15-dismissed');
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });
  const [timerActive, setTimerActive] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);

  // Save dismissed tips
  useEffect(() => {
    localStorage.setItem('mr15-dismissed', JSON.stringify([...dismissedTips]));
  }, [dismissedTips]);

  // Get tips relevant to current phase
  const relevantTips = CONTEXTUAL_TIPS
    .filter(tip => {
      const phases = Array.isArray(tip.phase) ? tip.phase : [tip.phase];
      return phases.includes(phase) && !dismissedTips.has(tip.id);
    })
    .sort((a, b) => b.priority - a.priority)
    .slice(0, maxTips);

  // Handle action button click
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
          // Built-in timer
          setTimerSeconds(parseInt(tip.actionData || '120'));
          setTimerActive(true);
        }
        break;
      case 'open-tool':
        if (onOpenTool && tip.actionData) {
          onOpenTool(tip.actionData);
        }
        break;
      case 'reflect':
        if (onReflect && tip.actionData) {
          onReflect(tip.actionData);
        }
        break;
    }

    // Notify parent
    if (onStrategySelect) {
      onStrategySelect({ id: tip.id, action: tip.actionType });
    }

    // Dismiss this tip after action
    setDismissedTips(prev => new Set([...prev, tip.id]));
    setExpandedTip(null);
  }, [onInsertText, onStartTimer, onOpenTool, onReflect, onStrategySelect]);

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

  // Dismiss a tip
  const dismissTip = (tipId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDismissedTips(prev => new Set([...prev, tipId]));
  };

  // Phase labels
  const phaseLabels: Record<UserPhase, { icon: string; label: string }> = {
    composing: { icon: '📝', label: 'Writing' },
    waiting: { icon: '⏳', label: 'Waiting' },
    received: { icon: '💡', label: 'Response received' },
    idle: { icon: '💭', label: 'Tips' }
  };

  const currentPhase = phaseLabels[phase];

  // If no relevant tips and no timer, show nothing (contextual!)
  if (relevantTips.length === 0 && !timerActive) {
    return null;
  }

  return (
    <div className={`mr15-contextual ${compact ? 'mr15-compact' : ''}`}>
      {/* Timer overlay */}
      {timerActive && (
        <div className="mr15-timer">
          <div className="mr15-timer-display">
            {Math.floor(timerSeconds / 60)}:{(timerSeconds % 60).toString().padStart(2, '0')}
          </div>
          <div className="mr15-timer-label">Think it through first...</div>
          <button
            className="mr15-timer-stop"
            onClick={() => setTimerActive(false)}
          >
            Done thinking
          </button>
        </div>
      )}

      {/* Phase indicator - minimal */}
      <div className="mr15-phase">
        <span className="mr15-phase-icon">{currentPhase.icon}</span>
        <span className="mr15-phase-label">{currentPhase.label}</span>
      </div>

      {/* Tips - only 1-2 most relevant */}
      <div className="mr15-tips">
        {relevantTips.map(tip => (
          <div
            key={tip.id}
            className={`mr15-tip ${expandedTip === tip.id ? 'mr15-tip-expanded' : ''}`}
          >
            <div
              className="mr15-tip-main"
              onClick={() => setExpandedTip(expandedTip === tip.id ? null : tip.id)}
            >
              <span className="mr15-tip-text">{tip.tip}</span>
              <button
                className="mr15-tip-dismiss"
                onClick={(e) => dismissTip(tip.id, e)}
                title="Dismiss"
              >
                ×
              </button>
            </div>

            {expandedTip === tip.id && tip.detail && (
              <div className="mr15-tip-detail">
                <p>{tip.detail}</p>
                {tip.actionLabel && (
                  <button
                    className="mr15-action-btn"
                    onClick={() => handleAction(tip)}
                  >
                    {tip.actionLabel}
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Reset link - only show if some tips dismissed */}
      {dismissedTips.size > 0 && relevantTips.length === 0 && (
        <button
          className="mr15-reset"
          onClick={() => setDismissedTips(new Set())}
        >
          Show all tips
        </button>
      )}
    </div>
  );
};

export default MR15MetacognitiveStrategyGuide;
