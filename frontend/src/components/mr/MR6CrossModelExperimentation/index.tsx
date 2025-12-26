/**
 * MR6: Cross-Model Experimentation - React Component
 *
 * Enables parallel experimentation with multiple AI models (GPT, Claude, Gemini)
 * with unified interface, side-by-side comparison, and performance tracking.
 *
 * Design Rationale (24% of users - 12/49):
 * - I004: "Sometimes I use GPT, sometimes Claude" - manual switching
 * - I016: Uses GPT + Claude + Gemini but each requires separate operation
 * - I033 (Finance): Selects different models by task but tedious process
 *
 * Key insight: Models have complementary strengths
 * - GPT-4: Coding, comprehensive tasks
 * - Claude: Analysis, safety considerations
 * - Gemini: Long context, real-time information
 */

import React, { useState, useCallback, useMemo } from 'react';
import {
  ModelComparison,
  ModelPerformance,
  callMultipleModels,
  recommendModel,
  trackModelPerformance,
  ModelType,
  ComparisonMetrics,
} from './utils';
import './styles.css';

// Flow tracker interface for MR usage tracking
interface FlowTrackerProps {
  recordInteraction?: (mrId: string, interactionType: string, data?: any) => void;
  recordApply?: (mrId: string, result?: any) => void;
  recordComplete?: (mrId: string) => void;
}

interface MR6Props {
  prompt?: string;
  taskType?: string;
  conversationHistory?: Array<{ role: 'user' | 'ai'; content: string }>;
  onModelSelected?: (model: ModelType, output: string) => void;
  onComparisonComplete?: (comparison: ModelComparison) => void;
  availableModels?: ModelType[];
  // MR Flow Tracker integration
  flowTracker?: FlowTrackerProps;
}

export const MR6CrossModelExperimentation: React.FC<MR6Props> = ({
  prompt = '',
  taskType = 'general',
  conversationHistory = [],
  onModelSelected,
  onComparisonComplete,
  availableModels = ['gpt-4o', 'gpt-4o-mini', 'gpt-3.5-turbo'],
  flowTracker,
}) => {
  const [selectedModels, setSelectedModels] = useState<ModelType[]>(availableModels);
  const [comparison, setComparison] = useState<ModelComparison | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedMetrics, setSelectedMetrics] = useState<(keyof ComparisonMetrics)[]>([
    'speed',
    'tokenCount',
    'cost',
  ]);
  const [userPrompt, setUserPrompt] = useState(prompt);

  const recommendedModel = useMemo(() => {
    return recommendModel(taskType);
  }, [taskType]);

  const handleRunExperiment = useCallback(async () => {
    if (!userPrompt) return;

    setIsLoading(true);

    // Track running the experiment
    flowTracker?.recordInteraction?.('MR6', 'run_experiment', {
      modelCount: selectedModels.length,
      models: selectedModels,
      promptLength: userPrompt.length
    });

    try {
      // Convert conversation history to API format
      const apiHistory = conversationHistory.map(msg => ({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: msg.content,
      }));

      // Call the multi-model API
      const comp = await callMultipleModels(
        userPrompt,
        apiHistory,
        selectedModels
      );

      setComparison(comp);

      // Track viewing comparison results
      flowTracker?.recordInteraction?.('MR6', 'view_comparison', {
        bestModel: comp.bestModel,
        modelCount: selectedModels.length
      });

      onComparisonComplete?.(comp);
    } catch (error) {
      console.error('[MR6] Failed to run experiment:', error);
    } finally {
      setIsLoading(false);
    }
  }, [userPrompt, conversationHistory, selectedModels, onComparisonComplete, flowTracker]);

  return (
    <div className="mr6-container">
      <div className="mr6-header">
        <h1 className="mr6-title">Cross-Model Experimentation</h1>
        <p className="mr6-subtitle">Compare outputs from multiple AI models to find the best solution</p>
      </div>

      <div className="mr6-layout">
        <div className="mr6-controls">
          <div className="mr6-prompt-input">
            <h3 className="mr6-label">Your Prompt</h3>
            <textarea
              className="mr6-textarea"
              placeholder="Enter your prompt here to compare how different models respond..."
              value={userPrompt}
              onChange={e => setUserPrompt(e.target.value)}
              rows={3}
            />
          </div>

          <div className="mr6-model-selector">
            <h3 className="mr6-label">Select Models</h3>
            <div className="mr6-model-grid">
              {availableModels.map(model => (
                <label key={model} className="mr6-model-checkbox">
                  <input
                    type="checkbox"
                    checked={selectedModels.includes(model)}
                    onChange={e => {
                      if (e.target.checked) {
                        setSelectedModels(prev => [...prev, model]);
                        // Track model selection
                        flowTracker?.recordInteraction?.('MR6', 'select_model', { model, action: 'add' });
                      } else {
                        setSelectedModels(prev => prev.filter(m => m !== model));
                        flowTracker?.recordInteraction?.('MR6', 'select_model', { model, action: 'remove' });
                      }
                    }}
                  />
                  <span className="mr6-model-name">
                    {model === 'gpt-4o' && '🤖 GPT-4o (Most Capable)'}
                    {model === 'gpt-4o-mini' && '⚡ GPT-4o Mini (Fast & Balanced)'}
                    {model === 'gpt-3.5-turbo' && '🚀 GPT-3.5 Turbo (Fastest)'}
                  </span>
                  {model === recommendedModel && (
                    <span className="mr6-recommended">Recommended</span>
                  )}
                </label>
              ))}
            </div>
          </div>

          <div className="mr6-metric-selector">
            <h3 className="mr6-label">Compare by:</h3>
            <div className="mr6-metric-checkboxes">
              {(['speed', 'tokenCount', 'cost', 'quality'] as const).map(metric => (
                <label key={metric} className="mr6-metric-checkbox">
                  <input
                    type="checkbox"
                    checked={selectedMetrics.includes(metric)}
                    onChange={e => {
                      if (e.target.checked) {
                        setSelectedMetrics(prev => [...prev, metric]);
                      } else {
                        setSelectedMetrics(prev => prev.filter(m => m !== metric));
                      }
                    }}
                  />
                  <span>{metric.charAt(0).toUpperCase() + metric.slice(1)}</span>
                </label>
              ))}
            </div>
          </div>

          <button
            className="mr6-run-btn"
            onClick={handleRunExperiment}
            disabled={isLoading || !userPrompt || selectedModels.length === 0}
          >
            {isLoading ? '⏳ Running Experiment...' : '▶️ Run Comparison'}
          </button>
        </div>

        {comparison ? (
          <div className="mr6-comparison-panel">
            <h2 className="mr6-comparison-title">Comparison Results</h2>

            <div className="mr6-outputs-grid">
              {selectedModels.map(model => {
                const modelMetrics = comparison.metrics[model];
                const modelOutput = comparison.outputs[model];

                return (
                  <div key={model} className="mr6-output-card">
                    <h3 className="mr6-output-title">
                      {model === 'gpt-4o' && '🤖 GPT-4o'}
                      {model === 'gpt-4o-mini' && '⚡ GPT-4o Mini'}
                      {model === 'gpt-3.5-turbo' && '🚀 GPT-3.5 Turbo'}
                      {model === comparison.bestModel && (
                        <span style={{ marginLeft: '0.5rem', fontSize: '0.875rem', color: '#10b981' }}>
                          ✓ Best
                        </span>
                      )}
                    </h3>

                    <div className="mr6-metrics">
                      {selectedMetrics.includes('speed') && modelMetrics && (
                        <div className="mr6-metric">
                          <span>⚡ Speed:</span>
                          <span className="mr6-metric-value">
                            {modelMetrics.speed.toFixed(2)}s
                          </span>
                        </div>
                      )}
                      {selectedMetrics.includes('tokenCount') && modelMetrics && (
                        <div className="mr6-metric">
                          <span>📊 Tokens:</span>
                          <span className="mr6-metric-value">
                            {modelMetrics.tokenCount}
                          </span>
                        </div>
                      )}
                      {selectedMetrics.includes('cost') && modelMetrics && (
                        <div className="mr6-metric">
                          <span>💰 Cost:</span>
                          <span className="mr6-metric-value">
                            ${modelMetrics.cost.toFixed(4)}
                          </span>
                        </div>
                      )}
                      {selectedMetrics.includes('quality') && modelMetrics && (
                        <div className="mr6-metric">
                          <span>⭐ Quality:</span>
                          <span className="mr6-metric-value">
                            {modelMetrics.quality > 0 ? `${modelMetrics.quality.toFixed(1)}/5` : 'Rate below'}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="mr6-output-content">
                      <p>{modelOutput || 'No output available'}</p>
                    </div>

                    <button
                      className="mr6-select-btn"
                      onClick={() => {
                        // Track making a selection (completing the MR flow)
                        flowTracker?.recordInteraction?.('MR6', 'make_selection', { model });
                        flowTracker?.recordApply?.('MR6', { model, output: modelOutput });
                        flowTracker?.recordComplete?.('MR6');
                        onModelSelected?.(model, modelOutput || '');
                      }}
                    >
                      ✓ Replace with This Answer
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="mr6-recommendation-box">
              <h3 className="mr6-recommendation-title">💡 Recommendation</h3>
              <p className="mr6-recommendation-text">{comparison.reasoning}</p>
              {comparison.recommendedFor.length > 0 && (
                <div style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: '#6b7280' }}>
                  <strong>Best for:</strong> {comparison.recommendedFor.join(', ')}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="mr6-empty-state">
            <p>Enter your prompt and run the experiment to compare model outputs</p>
          </div>
        )}
      </div>

      <div className="mr6-model-guide">
        <h3 className="mr6-guide-title">Model Comparison Guide</h3>
        <div className="mr6-guide-grid">
          <div className="mr6-guide-card">
            <h4>🤖 GPT-4o</h4>
            <ul>
              <li><strong>Best for:</strong> Complex reasoning, coding, creative writing</li>
              <li><strong>Speed:</strong> Medium (~2-3s)</li>
              <li><strong>Cost:</strong> $0.015/$0.06 per 1K tokens</li>
              <li><strong>Quality:</strong> Highest accuracy</li>
            </ul>
          </div>
          <div className="mr6-guide-card">
            <h4>⚡ GPT-4o Mini</h4>
            <ul>
              <li><strong>Best for:</strong> General tasks, quick answers, code review</li>
              <li><strong>Speed:</strong> Fast (~1.5-2s)</li>
              <li><strong>Cost:</strong> $0.00015/$0.0006 per 1K tokens</li>
              <li><strong>Quality:</strong> Good balance</li>
            </ul>
          </div>
          <div className="mr6-guide-card">
            <h4>🚀 GPT-3.5 Turbo</h4>
            <ul>
              <li><strong>Best for:</strong> Simple questions, quick facts, translation</li>
              <li><strong>Speed:</strong> Very fast (~1s)</li>
              <li><strong>Cost:</strong> $0.0005/$0.0015 per 1K tokens</li>
              <li><strong>Quality:</strong> Good for simple tasks</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MR6CrossModelExperimentation;
