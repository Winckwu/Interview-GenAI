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

import React, { useState, useCallback, useEffect } from 'react';
import {
  ReflectionPrompt,
  ReflectionLog,
  generateReflectionPrompts,
  analyzeReflectionDepth,
} from './utils';
import { apiService } from '../../../services/api';
import './styles.css';

interface MR14Props {
  sessionId?: string;
  conversationSummary?: string;
  onReflectionComplete?: (log: ReflectionLog) => void;
  showMetacognitive?: boolean;
  onOpenMR15?: () => void; // NEW: Callback to open MR15 metacognitive strategy guide
}

interface DBReflectionLog {
  id: string;
  conversationSummary?: string;
  depthLevel?: string;
  depthScore?: number;
  isComplete: boolean;
  createdAt: string;
}

export const MR14GuidedReflectionMechanism: React.FC<MR14Props> = ({
  sessionId,
  conversationSummary = '',
  onReflectionComplete,
  showMetacognitive = true,
  onOpenMR15,
}) => {
  const [stage, setStage] = useState<'immediate' | 'structured' | 'metacognitive' | 'complete'>(
    'immediate'
  );
  const [reflections, setReflections] = useState<Record<string, string>>({});

  // Database history state
  const [showHistory, setShowHistory] = useState(false);
  const [dbHistory, setDbHistory] = useState<DBReflectionLog[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const immediatePrompts = generateReflectionPrompts('immediate');
  const structuredPrompts = generateReflectionPrompts('structured');
  const metacognitivePrompts = generateReflectionPrompts('metacognitive');

  /**
   * Load history from database
   */
  const loadHistoryFromDB = useCallback(async () => {
    setLoadingHistory(true);
    try {
      const response = await apiService.mrHistory.mr14.list({
        sessionId: sessionId || undefined,
        limit: 50,
      });
      setDbHistory(response.data.data.logs || []);
    } catch (error) {
      console.error('[MR14] Failed to load history:', error);
    } finally {
      setLoadingHistory(false);
    }
  }, [sessionId]);

  // Load history when showing history panel
  useEffect(() => {
    if (showHistory) {
      loadHistoryFromDB();
    }
  }, [showHistory, loadHistoryFromDB]);

  /**
   * Save reflection log to database
   */
  const saveLogToDB = useCallback(async (log: ReflectionLog) => {
    try {
      // Separate reflections by stage
      const immediateRefs: Record<string, string> = {};
      const structuredRefs: Record<string, string> = {};
      const metacognitiveRefs: Record<string, string> = {};

      Object.entries(log.reflections).forEach(([key, value]) => {
        if (key.startsWith('immediate')) immediateRefs[key] = value;
        else if (key.startsWith('structured')) structuredRefs[key] = value;
        else if (key.startsWith('metacognitive')) metacognitiveRefs[key] = value;
      });

      await apiService.mrHistory.mr14.create({
        sessionId: sessionId || undefined,
        conversationSummary: log.conversationSummary || undefined,
        immediateReflections: immediateRefs,
        structuredReflections: structuredRefs,
        metacognitiveReflections: metacognitiveRefs,
        depthLevel: log.depthAnalysis?.level,
        depthScore: log.depthAnalysis?.score,
        depthFeedback: log.depthAnalysis?.feedback,
        completedStages: ['immediate', 'structured', 'metacognitive'],
        isComplete: true,
      });
      console.log('[MR14] Reflection log saved to database');
    } catch (error) {
      console.error('[MR14] Failed to save to database:', error);
    }
  }, [sessionId]);

  const handleReflectionChange = useCallback(
    (promptId: string, value: string) => {
      setReflections(prev => ({ ...prev, [promptId]: value }));
    },
    []
  );

  const handleCompleteReflection = useCallback(async () => {
    const log: ReflectionLog = {
      timestamp: new Date(),
      reflections,
      conversationSummary,
      depthAnalysis: analyzeReflectionDepth(reflections),
    };

    // Save to database
    await saveLogToDB(log);

    onReflectionComplete?.(log);
    setStage('complete');
  }, [reflections, conversationSummary, onReflectionComplete, saveLogToDB]);

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

            {/* MR Integration: Recommend strategy learning after reflection */}
            {onOpenMR15 && (
              <div style={{
                backgroundColor: '#fef3c7',
                border: '2px solid #f59e0b',
                borderRadius: '0.5rem',
                padding: '1rem',
                margin: '1.5rem 0',
              }}>
                <h3 style={{ margin: '0 0 0.5rem 0', color: '#92400e' }}>
                  📚 Next Step: Learn Metacognitive Strategies
                </h3>
                <p style={{ margin: '0 0 1rem 0', fontSize: '0.875rem' }}>
                  Reflection complete! Now is a great time to learn metacognitive strategies. The system will teach you how to effectively plan, monitor, evaluate, and regulate your AI collaboration, helping you become a more effective AI user.
                </p>
                <button
                  onClick={onOpenMR15}
                  style={{
                    backgroundColor: '#f59e0b',
                    color: 'white',
                    padding: '0.5rem 1rem',
                    borderRadius: '0.375rem',
                    border: 'none',
                    cursor: 'pointer',
                    fontWeight: '500',
                  }}
                  title="Open Metacognitive Strategy Guide - Learn effective AI collaboration strategies"
                >
                  📚 Learn Metacognitive Strategies (MR15)
                </button>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="mr14-container">
      <div className="mr14-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
          <h1 className="mr14-title" style={{ margin: 0 }}>Guided Reflection</h1>
          <button
            onClick={() => setShowHistory(!showHistory)}
            style={{
              padding: '0.4rem 0.8rem',
              fontSize: '0.85rem',
              background: showHistory ? '#0066ff' : '#f0f0f0',
              color: showHistory ? 'white' : '#666',
              border: '1px solid #ddd',
              borderRadius: '4px',
              cursor: 'pointer',
              flexShrink: 0,
            }}
          >
            {showHistory ? 'Hide History' : 'View History'}
          </button>
        </div>
        <p className="mr14-subtitle">Deepen your learning through structured reflection</p>

        {/* Database History Panel */}
        {showHistory && (
          <div style={{
            margin: '1rem 0',
            padding: '1rem',
            background: '#f9f9f9',
            borderRadius: '6px',
            border: '1px solid #e0e0e0',
            textAlign: 'left',
          }}>
            <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem' }}>
              Reflection History ({dbHistory.length})
            </h3>
            {loadingHistory ? (
              <p style={{ color: '#666' }}>Loading history...</p>
            ) : dbHistory.length === 0 ? (
              <p style={{ color: '#666' }}>No reflection logs saved yet.</p>
            ) : (
              <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                {dbHistory.map((log) => (
                  <div
                    key={log.id}
                    style={{
                      padding: '0.75rem',
                      marginBottom: '0.5rem',
                      background: 'white',
                      borderRadius: '4px',
                      border: '1px solid #eee',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 600 }}>
                        Depth: {log.depthLevel || 'N/A'}
                        {log.depthScore && ` (Score: ${log.depthScore})`}
                      </span>
                      <span style={{
                        padding: '0.2rem 0.5rem',
                        borderRadius: '4px',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        background: log.isComplete ? '#d1fae5' : '#fef3c7',
                        color: log.isComplete ? '#065f46' : '#92400e',
                      }}>
                        {log.isComplete ? 'Complete' : 'In Progress'}
                      </span>
                    </div>
                    {log.conversationSummary && (
                      <div style={{ fontSize: '0.85rem', color: '#444', marginTop: '0.25rem' }}>
                        {log.conversationSummary.substring(0, 100)}
                        {log.conversationSummary.length > 100 ? '...' : ''}
                      </div>
                    )}
                    <div style={{ fontSize: '0.75rem', color: '#888', marginTop: '0.25rem' }}>
                      {new Date(log.createdAt).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
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
