/**
 * Hybrid Pattern Explanation Component
 * Explains how primary and secondary patterns combine
 * Shows context-specific behaviors and switching triggers
 */

import React from 'react';

interface HybridPatternExplanationProps {
  primaryPattern: string;
  secondaryPattern: string;
  primaryName: string;
  secondaryName: string;
  primaryDescription: string;
  secondaryDescription: string;
  hybridDescription?: string;
  contextSwitchingTriggers?: string[];
  contextualBehaviors?: Record<string, {
    pattern: string;
    queryRatio: number;
    verificationRate: number;
  }>;
}

export const HybridPatternExplanation: React.FC<HybridPatternExplanationProps> = ({
  primaryPattern,
  secondaryPattern,
  primaryName,
  secondaryName,
  primaryDescription,
  secondaryDescription,
  hybridDescription,
  contextSwitchingTriggers = [],
  contextualBehaviors
}) => {
  return (
    <div className="hybrid-pattern-explanation">
      <div className="hybrid-header">
        <h3>🎯 混合模式识别</h3>
        <p className="hybrid-intro">
          您展现出{primaryName}的主要特征，同时在特定情境下也会采用{secondaryName}的策略。
        </p>
      </div>

      <div className="hybrid-content">
        {/* Primary Pattern */}
        <div className="pattern-part primary">
          <div className="pattern-badge">主要模式</div>
          <div className="pattern-card-mini">
            <h4>
              {primaryPattern} - {primaryName}
            </h4>
            <p className="pattern-mini-desc">{primaryDescription}</p>
            <div className="pattern-frequency">
              <span className="frequency-label">出现频率</span>
              <div className="frequency-bar">
                <div className="frequency-fill" style={{ width: '70%' }}></div>
              </div>
              <span className="frequency-percent">~70%</span>
            </div>
          </div>
        </div>

        {/* Plus Icon */}
        <div className="pattern-connector">
          <span className="plus-icon">+</span>
        </div>

        {/* Secondary Pattern */}
        <div className="pattern-part secondary">
          <div className="pattern-badge">次要模式</div>
          <div className="pattern-card-mini">
            <h4>
              {secondaryPattern} - {secondaryName}
            </h4>
            <p className="pattern-mini-desc">{secondaryDescription}</p>
            <div className="pattern-frequency">
              <span className="frequency-label">出现频率</span>
              <div className="frequency-bar">
                <div className="frequency-fill" style={{ width: '30%' }}></div>
              </div>
              <span className="frequency-percent">~30%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Hybrid Characteristics */}
      {hybridDescription && (
        <div className="hybrid-characteristics">
          <h4>💡 混合特征</h4>
          <p className="hybrid-desc">{hybridDescription}</p>
        </div>
      )}

      {/* Context Switching Triggers */}
      {contextSwitchingTriggers && contextSwitchingTriggers.length > 0 && (
        <div className="context-triggers">
          <h4>🔄 切换触发条件</h4>
          <ul className="trigger-list">
            {contextSwitchingTriggers.map((trigger, idx) => (
              <li key={idx}>
                <span className="trigger-label">
                  {formatTrigger(trigger)}
                </span>
              </li>
            ))}
          </ul>
          <p className="trigger-note">
            当出现上述情况时，您可能会从{primaryName}切换到{secondaryName}的策略。
          </p>
        </div>
      )}

      {/* Contextual Behaviors */}
      {contextualBehaviors && Object.keys(contextualBehaviors).length > 0 && (
        <div className="contextual-behaviors">
          <h4>📊 不同情境下的行为</h4>
          <div className="behaviors-grid">
            {Object.entries(contextualBehaviors).map(([context, behavior]) => (
              <div key={context} className="behavior-card">
                <div className="behavior-context">{formatContextName(context)}</div>
                <div className="behavior-metric">
                  <span className="metric-label">采用模式：</span>
                  <span className="metric-value">{behavior.pattern}</span>
                </div>
                <div className="behavior-metric">
                  <span className="metric-label">查询频率：</span>
                  <span className="metric-value">{behavior.queryRatio.toFixed(2)}x</span>
                </div>
                <div className="behavior-metric">
                  <span className="metric-label">验证率：</span>
                  <span className="metric-value">{(behavior.verificationRate * 100).toFixed(0)}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommendations */}
      <div className="hybrid-recommendations">
        <h4>💬 建议</h4>
        <ul className="recommendation-list">
          <li>
            📍 记录您的模式切换：了解在什么情境下您会切换到{secondaryName}，这有助于更好地理解自己的工作方式。
          </li>
          <li>
            🎯 优化切换决策：明确定义什么时候{primaryName}足够，什么时候需要{secondaryName}的更深入策略。
          </li>
          <li>
            📈 持续改进：在两种模式之间找到平衡点，既能保持{primaryName}的效率，又能在需要时发挥{secondaryName}的优势。
          </li>
        </ul>
      </div>
    </div>
  );
};

/**
 * Helper function to format trigger names
 */
function formatTrigger(trigger: string): string {
  const triggerMap: Record<string, string> = {
    'high_complexity': '🔧 任务复杂度增加',
    'unfamiliar_domain': '🌟 进入不熟悉领域',
    'task_criticality': '⚠️ 任务重要性提升',
    'risk_assessment': '🛡️ 需要风险评估',
    'adaptation_failure': '❌ 适应策略失效',
    'increased_difficulty': '📈 难度持续增加',
    'task_familiarity': '✅ 任务熟悉度变化',
    'confidence_level': '💪 自信心水平变化',
    'learning_stage': '📚 学习阶段',
    'knowledge_consolidation': '🧠 知识巩固',
    'context_change': '🔀 上下文改变',
    'task_requirement_shift': '🔄 任务需求变化'
  };

  return triggerMap[trigger] || trigger;
}

/**
 * Helper function to format context names
 */
function formatContextName(context: string): string {
  const contextMap: Record<string, string> = {
    'standard_task': '标准任务',
    'complex_task': '复杂任务',
    'iterative_tasks': '迭代任务',
    'critical_tasks': '关键任务',
    'familiar_tasks': '熟悉任务',
    'new_tasks': '新任务',
    'adaptive_approach': '适应性方法',
    'fallback_iterative': '迭代降级',
    'learning_phase': '学习阶段',
    'application_phase': '应用阶段'
  };

  return contextMap[context] || context;
}

export default HybridPatternExplanation;
