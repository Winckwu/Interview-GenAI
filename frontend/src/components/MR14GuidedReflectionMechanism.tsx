/**
 * MR14: Guided Reflection Mechanism - React Component
 *
 * Guides users through structured reflection after AI interactions,
 * using Vygotsky's Zone of Proximal Development principles.
 *
 * Design Rationale (29% of users - 14/49):
 * - I028: "Use AI to reflect on what I learned"
 * - I031: Confused after conversation: "Did I really understand?"
 * - I045: Wants systematic learning but lacks framework
 */

import React, { useState, useCallback } from 'react';
import {
  ReflectionPrompt,
  ReflectionLog,
  generateReflectionPrompts,
  analyzeReflectionDepth,
} from './MR14GuidedReflectionMechanism.utils';
import './MR14GuidedReflectionMechanism.css';

interface MR14Props {
  conversationSummary?: string;
  onReflectionComplete?: (log: ReflectionLog) => void;
  showMetacognitive?: boolean;
}

export const MR14GuidedReflectionMechanism: React.FC<MR14Props> = ({
  conversationSummary = '',
  onReflectionComplete,
  showMetacognitive = true,
}) => {
  const [stage, setStage] = useState<'immediate' | 'structured' | 'metacognitive' | 'complete'>(
    'immediate'
  );
  const [reflections, setReflections] = useState<Record<string, string>>({});

  const immediatePrompts = generateReflectionPrompts('immediate');
  const structuredPrompts = generateReflectionPrompts('structured');
  const metacognitivePrompts = generateReflectionPrompts('metacognitive');

  const handleReflectionChange = useCallback(
    (promptId: string, value: string) => {
      setReflections(prev => ({ ...prev, [promptId]: value }));
    },
    []
  );

  const handleCompleteReflection = useCallback(() => {
    const log: ReflectionLog = {
      timestamp: new Date(),
      reflections,
      conversationSummary,
      depthAnalysis: analyzeReflectionDepth(reflections),
    };

    onReflectionComplete?.(log);
    setStage('complete');
  }, [reflections, conversationSummary, onReflectionComplete]);

  const renderStage = () => {
    switch (stage) {
      case 'immediate':
        return (
          <div className="mr14-stage">
            <h2 className="mr14-stage-title">What Just Happened?</h2>
            <p className="mr14-stage-subtitle">Quick reflection on the conversation</p>

            {immediatePrompts.map(prompt => (
              <div key={prompt.id} className="mr14-prompt-item">
                <div className="mr14-prompt-options">
                  {prompt.options?.map((option, idx) => (
                    <label key={idx} className="mr14-option">
                      <input
                        type="radio"
                        name={prompt.id}
                        value={option}
                        checked={reflections[prompt.id] === option}
                        onChange={e => handleReflectionChange(prompt.id, e.target.value)}
                      />
                      <span>{option}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}

            <button className="mr14-next-btn" onClick={() => setStage('structured')}>
              Next: Deeper Reflection →
            </button>
          </div>
        );

      case 'structured':
        return (
          <div className="mr14-stage">
            <h2 className="mr14-stage-title">What Did You Learn?</h2>
            <p className="mr14-stage-subtitle">Structured learning reflection</p>

            {structuredPrompts.map(prompt => (
              <div key={prompt.id} className="mr14-text-prompt">
                <h3 className="mr14-prompt-question">{prompt.text}</h3>
                <textarea
                  className="mr14-reflection-textarea"
                  placeholder="Your response..."
                  value={reflections[prompt.id] || ''}
                  onChange={e => handleReflectionChange(prompt.id, e.target.value)}
                  rows={3}
                />
              </div>
            ))}

            <button className="mr14-next-btn" onClick={() => setStage('metacognitive')}>
              Next: Metacognitive Check →
            </button>
          </div>
        );

      case 'metacognitive':
        return (
          <div className="mr14-stage">
            <h2 className="mr14-stage-title">Metacognitive Check</h2>
            <p className="mr14-stage-subtitle">Assess your understanding and strategy</p>

            {metacognitivePrompts.map(prompt => (
              <div key={prompt.id} className="mr14-text-prompt">
                <h3 className="mr14-prompt-question">{prompt.text}</h3>
                <textarea
                  className="mr14-reflection-textarea"
                  placeholder="Your response..."
                  value={reflections[prompt.id] || ''}
                  onChange={e => handleReflectionChange(prompt.id, e.target.value)}
                  rows={3}
                />
              </div>
            ))}

            <button className="mr14-complete-btn" onClick={handleCompleteReflection}>
              Complete Reflection
            </button>
          </div>
        );

      case 'complete':
        return (
          <div className="mr14-completion">
            <div className="mr14-success-message">
              <span className="mr14-success-icon">✓</span>
              <h2>Reflection Complete!</h2>
              <p>Your reflection has been saved to your learning log.</p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="mr14-container">
      <div className="mr14-header">
        <h1 className="mr14-title">Guided Reflection</h1>
        <p className="mr14-subtitle">Deepen your learning through structured reflection</p>
      </div>

      <div className="mr14-progress">
        <div className={`mr14-progress-item ${stage === 'immediate' || ['structured', 'metacognitive', 'complete'].includes(stage) ? 'active' : ''}`}>
          Immediate
        </div>
        <div className={`mr14-progress-item ${['structured', 'metacognitive', 'complete'].includes(stage) ? 'active' : ''}`}>
          Structured
        </div>
        {showMetacognitive && (
          <div className={`mr14-progress-item ${['metacognitive', 'complete'].includes(stage) ? 'active' : ''}`}>
            Metacognitive
          </div>
        )}
        <div className={`mr14-progress-item ${stage === 'complete' ? 'active' : ''}`}>
          Complete
        </div>
      </div>

      <div className="mr14-content">{renderStage()}</div>
    </div>
  );
};

export default MR14GuidedReflectionMechanism;
