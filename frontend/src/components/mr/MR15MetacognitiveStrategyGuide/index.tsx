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

// Simple, conversational tips (in Chinese for better UX)
const CONTEXTUAL_TIPS: ContextualTip[] = [
  // COMPOSING phase - before sending
  {
    id: 'think-first',
    phase: 'composing',
    tip: '先想2分钟再问',
    detail: '试着自己先思考一下，可能你已经知道答案了',
    actionLabel: '设置2分钟提醒',
    actionType: 'timer',
    actionData: '120',
    priority: 10
  },
  {
    id: 'be-specific',
    phase: 'composing',
    tip: '问题越具体，回答越好',
    detail: '与其问"怎么做"，不如说清楚你的具体情况',
    actionLabel: '帮我完善问题',
    actionType: 'insert',
    actionData: '我的具体情况是：...\n我想要达到的效果是：...',
    priority: 8
  },
  {
    id: 'break-down',
    phase: 'composing',
    tip: '大问题拆成小步骤',
    detail: '一次问一个小问题，比一次问一个大问题效果更好',
    actionLabel: '帮我拆分',
    actionType: 'insert',
    actionData: '请先帮我把这个任务拆分成小步骤：',
    priority: 7
  },

  // WAITING phase - after sending
  {
    id: 'predict',
    phase: 'waiting',
    tip: '猜猜AI会怎么回答',
    detail: '等待时想想：你期望看到什么？这能帮你更好地评估回答',
    priority: 6
  },

  // RECEIVED phase - after getting response
  {
    id: 'verify-facts',
    phase: 'received',
    tip: '关键信息要核实',
    detail: '数据、日期、专业术语这些，最好自己查证一下',
    actionLabel: '标记待核实',
    actionType: 'reflect',
    actionData: 'verify',
    priority: 10
  },
  {
    id: 'ask-why',
    phase: 'received',
    tip: '多问一句"为什么"',
    detail: '不只是接受答案，理解背后的原因更重要',
    actionLabel: '追问原因',
    actionType: 'insert',
    actionData: '为什么是这样？能解释一下原理吗？',
    priority: 8
  },
  {
    id: 'get-options',
    phase: 'received',
    tip: '有没有其他方法？',
    detail: '让AI给你更多选项，这样你可以做出更好的选择',
    actionLabel: '要求更多方案',
    actionType: 'insert',
    actionData: '还有其他方法吗？各有什么优缺点？',
    priority: 7
  },
  {
    id: 'check-blind-spots',
    phase: 'received',
    tip: '有没有遗漏的地方？',
    detail: 'AI可能没考虑到你的特殊情况',
    actionLabel: '检查盲点',
    actionType: 'insert',
    actionData: '这个方案有什么潜在问题或限制吗？有没有我应该注意的特殊情况？',
    priority: 6
  },

  // IDLE phase - general
  {
    id: 'reflect',
    phase: 'idle',
    tip: '回顾一下刚才的对话',
    detail: '学到了什么？下次可以怎么问得更好？',
    actionLabel: '打开反思工具',
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
    composing: { icon: '📝', label: '写问题时' },
    waiting: { icon: '⏳', label: '等待中' },
    received: { icon: '💡', label: '收到回答' },
    idle: { icon: '💭', label: '提示' }
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
          <div className="mr15-timer-label">先自己想想...</div>
          <button
            className="mr15-timer-stop"
            onClick={() => setTimerActive(false)}
          >
            完成思考
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
                title="不需要"
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
          显示全部提示
        </button>
      )}
    </div>
  );
};

export default MR15MetacognitiveStrategyGuide;
