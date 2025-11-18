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
        <h3>🎯 Hybrid Pattern Recognition</h3>
        <p className="hybrid-intro">
          You demonstrate primary characteristics of {primaryName}, while adopting {secondaryName} strategies in specific contexts.
        </p>
      </div>

      <div className="hybrid-content">
        {/* Primary Pattern */}
        <div className="pattern-part primary">
          <div className="pattern-badge">Primary Pattern</div>
          <div className="pattern-card-mini">
            <h4>
              {primaryPattern} - {primaryName}
            </h4>
            <p className="pattern-mini-desc">{primaryDescription}</p>
            <div className="pattern-frequency">
              <span className="frequency-label">Frequency</span>
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
          <div className="pattern-badge">Secondary Pattern</div>
          <div className="pattern-card-mini">
            <h4>
              {secondaryPattern} - {secondaryName}
            </h4>
            <p className="pattern-mini-desc">{secondaryDescription}</p>
            <div className="pattern-frequency">
              <span className="frequency-label">Frequency</span>
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
          <h4>💡 Hybrid Characteristics</h4>
          <p className="hybrid-desc">{hybridDescription}</p>
        </div>
      )}

      {/* Context Switching Triggers */}
      {contextSwitchingTriggers && contextSwitchingTriggers.length > 0 && (
        <div className="context-triggers">
          <h4>🔄 Context Switching Triggers</h4>
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
            When these situations occur, you may switch from {primaryName} to {secondaryName} strategies.
          </p>
        </div>
      )}

      {/* Contextual Behaviors */}
      {contextualBehaviors && Object.keys(contextualBehaviors).length > 0 && (
        <div className="contextual-behaviors">
          <h4>📊 Contextual Behaviors</h4>
          <div className="behaviors-grid">
            {Object.entries(contextualBehaviors).map(([context, behavior]) => (
              <div key={context} className="behavior-card">
                <div className="behavior-context">{formatContextName(context)}</div>
                <div className="behavior-metric">
                  <span className="metric-label">Adopted Pattern:</span>
                  <span className="metric-value">{behavior.pattern}</span>
                </div>
                <div className="behavior-metric">
                  <span className="metric-label">Query Frequency:</span>
                  <span className="metric-value">{behavior.queryRatio.toFixed(2)}x</span>
                </div>
                <div className="behavior-metric">
                  <span className="metric-label">Verification Rate:</span>
                  <span className="metric-value">{(behavior.verificationRate * 100).toFixed(0)}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommendations */}
      <div className="hybrid-recommendations">
        <h4>💬 Recommendations</h4>
        <ul className="recommendation-list">
          <li>
            📍 Track your pattern switching: Understand which contexts trigger switching to {secondaryName}, helping you better understand your own work approach.
          </li>
          <li>
            🎯 Optimize switching decisions: Clearly define when {primaryName} is sufficient versus when you need {secondaryName}'s deeper strategies.
          </li>
          <li>
            📈 Continuous improvement: Find balance between patterns, maintaining {primaryName}'s efficiency while leveraging {secondaryName}'s strengths when needed.
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
    'high_complexity': '🔧 High Task Complexity',
    'unfamiliar_domain': '🌟 Unfamiliar Domain',
    'task_criticality': '⚠️ Task Criticality Increase',
    'risk_assessment': '🛡️ Risk Assessment Required',
    'adaptation_failure': '❌ Adaptation Strategy Failed',
    'increased_difficulty': '📈 Sustained Difficulty Increase',
    'task_familiarity': '✅ Task Familiarity Change',
    'confidence_level': '💪 Confidence Level Shift',
    'learning_stage': '📚 Learning Stage',
    'knowledge_consolidation': '🧠 Knowledge Consolidation',
    'context_change': '🔀 Context Change',
    'task_requirement_shift': '🔄 Task Requirement Shift'
  };

  return triggerMap[trigger] || trigger;
}

/**
 * Helper function to format context names
 */
function formatContextName(context: string): string {
  const contextMap: Record<string, string> = {
    'standard_task': 'Standard Task',
    'complex_task': 'Complex Task',
    'iterative_tasks': 'Iterative Tasks',
    'critical_tasks': 'Critical Tasks',
    'familiar_tasks': 'Familiar Tasks',
    'new_tasks': 'New Tasks',
    'adaptive_approach': 'Adaptive Approach',
    'fallback_iterative': 'Iterative Fallback',
    'learning_phase': 'Learning Phase',
    'application_phase': 'Application Phase'
  };

  return contextMap[context] || context;
}

export default HybridPatternExplanation;
