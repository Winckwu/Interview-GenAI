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

// Quick compare preset configurations
interface QuickPreset {
  id: string;
  label: string;
  icon: string;
  models: ModelType[];
  description: string;
}

const QUICK_PRESETS: QuickPreset[] = [
  {
    id: 'all',
    label: 'Compare All',
    icon: '🔄',
    models: ['gpt-4o', 'gpt-4o-mini', 'gpt-3.5-turbo'],
    description: 'Compare all available models simultaneously',
  },
  {
    id: 'quality-vs-speed',
    label: 'Quality vs Speed',
    icon: '⚖️',
    models: ['gpt-4o', 'gpt-3.5-turbo'],
    description: 'Compare highest quality with fastest speed',
  },
  {
    id: 'balanced',
    label: 'Cost-Effective',
    icon: '💰',
    models: ['gpt-4o-mini', 'gpt-3.5-turbo'],
    description: 'Compare two cost-effective models',
  },
];

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
  const [error, setError] = useState<string | null>(null);
  const [selectedMetrics, setSelectedMetrics] = useState<(keyof ComparisonMetrics)[]>([
    'speed',
    'tokenCount',
    'cost',
  ]);
  const [userPrompt, setUserPrompt] = useState(prompt);
  const [showGuide, setShowGuide] = useState(false);
  const [activeStep, setActiveStep] = useState<1 | 2 | 3>(1);

  const recommendedModel = useMemo(() => {
    return recommendModel(taskType);
  }, [taskType]);

  // Auto-populate prompt from conversation or initial prompt prop
  const lastUserMessage = useMemo(() => {
    // First try to get from conversation history
    const userMessages = conversationHistory.filter(m => m.role === 'user');
    if (userMessages.length > 0) {
      return userMessages[userMessages.length - 1].content;
    }
    // Fall back to prompt prop
    return prompt || '';
  }, [conversationHistory, prompt]);

  const handleUseCurrentChat = useCallback(() => {
    const messageToUse = lastUserMessage;
    if (messageToUse) {
      setUserPrompt(messageToUse);
      setActiveStep(2);
      flowTracker?.recordInteraction?.('MR6', 'use_current_chat', { promptLength: messageToUse.length });
    }
  }, [lastUserMessage, flowTracker]);

  const handleQuickPreset = useCallback((preset: QuickPreset) => {
    setSelectedModels(preset.models);
    setActiveStep(2);
    flowTracker?.recordInteraction?.('MR6', 'quick_preset', { presetId: preset.id, models: preset.models });
  }, [flowTracker]);

  const handleRunExperiment = useCallback(async () => {
    if (!userPrompt) return;

    setIsLoading(true);
    setActiveStep(3);
    setError(null);
    setComparison(null);

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
    } catch (err: any) {
      console.error('[MR6] Failed to run experiment:', err);
      setError(err.message || 'Failed to call AI models. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [userPrompt, conversationHistory, selectedModels, onComparisonComplete, flowTracker]);

  const getModelDisplayInfo = (model: ModelType) => {
    switch (model) {
      case 'gpt-4o':
        return { icon: '🤖', name: 'GPT-4o', tag: 'Most Capable', tagColor: '#8b5cf6' };
      case 'gpt-4o-mini':
        return { icon: '⚡', name: 'GPT-4o Mini', tag: 'Balanced', tagColor: '#10b981' };
      case 'gpt-3.5-turbo':
        return { icon: '🚀', name: 'GPT-3.5', tag: 'Fastest', tagColor: '#f59e0b' };
      default:
        return { icon: '🤖', name: model, tag: '', tagColor: '#6b7280' };
    }
  };

  return (
    <div className="mr6-container mr6-optimized">
      {/* Compact Header */}
      <div className="mr6-header-compact">
        <div className="mr6-header-left">
          <h1 className="mr6-title-compact">🔄 Model Comparison</h1>
          <p className="mr6-subtitle-compact">Run multiple models simultaneously, find the best answer</p>
        </div>
        <button
          className="mr6-guide-toggle"
          onClick={() => setShowGuide(!showGuide)}
          title={showGuide ? 'Hide Guide' : 'Show Guide'}
        >
          {showGuide ? '📖 Hide Guide' : '📖 Model Guide'}
        </button>
      </div>

      {/* Collapsible Model Guide */}
      {showGuide && (
        <div className="mr6-model-guide-compact">
          <div className="mr6-guide-grid-compact">
            <div className="mr6-guide-item">
              <span className="mr6-guide-icon">🤖</span>
              <div>
                <strong>GPT-4o</strong>
                <span className="mr6-guide-desc">Complex reasoning, code generation, creative writing</span>
              </div>
            </div>
            <div className="mr6-guide-item">
              <span className="mr6-guide-icon">⚡</span>
              <div>
                <strong>GPT-4o Mini</strong>
                <span className="mr6-guide-desc">Daily tasks, quick answers, code review</span>
              </div>
            </div>
            <div className="mr6-guide-item">
              <span className="mr6-guide-icon">🚀</span>
              <div>
                <strong>GPT-3.5</strong>
                <span className="mr6-guide-desc">Simple questions, quick facts, translation</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Step Indicator */}
      <div className="mr6-steps">
        <div className={`mr6-step ${activeStep >= 1 ? 'active' : ''} ${activeStep > 1 ? 'completed' : ''}`}>
          <div className="mr6-step-number">1</div>
          <span>Select Models</span>
        </div>
        <div className="mr6-step-line" />
        <div className={`mr6-step ${activeStep >= 2 ? 'active' : ''} ${activeStep > 2 ? 'completed' : ''}`}>
          <div className="mr6-step-number">2</div>
          <span>Enter Prompt</span>
        </div>
        <div className="mr6-step-line" />
        <div className={`mr6-step ${activeStep >= 3 ? 'active' : ''}`}>
          <div className="mr6-step-number">3</div>
          <span>View Results</span>
        </div>
      </div>

      <div className="mr6-layout-optimized">
        {/* Left Panel - Controls */}
        <div className="mr6-controls-optimized">
          {/* Quick Presets */}
          <div className="mr6-quick-section">
            <h3 className="mr6-section-title">⚡ Quick Select</h3>
            <div className="mr6-preset-grid">
              {QUICK_PRESETS.map(preset => (
                <button
                  key={preset.id}
                  className={`mr6-preset-btn ${
                    selectedModels.length === preset.models.length &&
                    preset.models.every(m => selectedModels.includes(m))
                      ? 'active'
                      : ''
                  }`}
                  onClick={() => handleQuickPreset(preset)}
                  title={preset.description}
                >
                  <span className="mr6-preset-icon">{preset.icon}</span>
                  <span className="mr6-preset-label">{preset.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Model Selection */}
          <div className="mr6-model-section">
            <h3 className="mr6-section-title">🎯 Select Models</h3>
            <div className="mr6-model-toggles">
              {availableModels.map(model => {
                const info = getModelDisplayInfo(model);
                const isSelected = selectedModels.includes(model);
                return (
                  <button
                    key={model}
                    className={`mr6-model-toggle ${isSelected ? 'selected' : ''}`}
                    onClick={() => {
                      if (isSelected) {
                        setSelectedModels(prev => prev.filter(m => m !== model));
                        flowTracker?.recordInteraction?.('MR6', 'select_model', { model, action: 'remove' });
                      } else {
                        setSelectedModels(prev => [...prev, model]);
                        flowTracker?.recordInteraction?.('MR6', 'select_model', { model, action: 'add' });
                      }
                    }}
                  >
                    <span className="mr6-toggle-icon">{info.icon}</span>
                    <span className="mr6-toggle-name">{info.name}</span>
                    <span
                      className="mr6-toggle-tag"
                      style={{ backgroundColor: info.tagColor }}
                    >
                      {info.tag}
                    </span>
                    {model === recommendedModel && (
                      <span className="mr6-toggle-recommended">Recommended</span>
                    )}
                    <span className={`mr6-toggle-check ${isSelected ? 'visible' : ''}`}>✓</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Prompt Input */}
          <div className="mr6-prompt-section">
            <div className="mr6-prompt-header">
              <h3 className="mr6-section-title">💬 Enter Prompt</h3>
              {lastUserMessage && (
                <button
                  className="mr6-use-chat-btn"
                  onClick={handleUseCurrentChat}
                >
                  📋 Use Current Chat
                </button>
              )}
            </div>
            <textarea
              className="mr6-textarea-optimized"
              placeholder="Enter a question for multiple models to answer..."
              value={userPrompt}
              onChange={e => {
                setUserPrompt(e.target.value);
                if (e.target.value && activeStep < 2) setActiveStep(2);
              }}
              rows={3}
            />
          </div>

          {/* Run Button */}
          <button
            className="mr6-run-btn-optimized"
            onClick={handleRunExperiment}
            disabled={isLoading || !userPrompt || selectedModels.length === 0}
          >
            {isLoading ? (
              <>
                <span className="mr6-loading-spinner" />
                Running comparison...
              </>
            ) : (
              <>▶️ Start Comparison ({selectedModels.length} models)</>
            )}
          </button>

          {selectedModels.length === 0 && (
            <p className="mr6-warning">⚠️ Please select at least one model</p>
          )}
        </div>

        {/* Right Panel - Results */}
        <div className="mr6-results-panel">
          {error ? (
            <div className="mr6-error-state">
              <div className="mr6-error-icon">❌</div>
              <h3 className="mr6-error-title">Failed to Compare Models</h3>
              <p className="mr6-error-desc">{error}</p>
              <button
                className="mr6-retry-btn"
                onClick={() => {
                  setError(null);
                  setActiveStep(2);
                }}
              >
                Try Again
              </button>
            </div>
          ) : comparison ? (
            <>
              <div className="mr6-results-header">
                <h2 className="mr6-results-title">📊 Comparison Results</h2>
                <div className="mr6-metric-pills">
                  {(['speed', 'tokenCount', 'cost', 'quality'] as const).map(metric => (
                    <button
                      key={metric}
                      className={`mr6-metric-pill ${selectedMetrics.includes(metric) ? 'active' : ''}`}
                      onClick={() => {
                        if (selectedMetrics.includes(metric)) {
                          setSelectedMetrics(prev => prev.filter(m => m !== metric));
                        } else {
                          setSelectedMetrics(prev => [...prev, metric]);
                        }
                      }}
                    >
                      {metric === 'speed' && '⚡ Speed'}
                      {metric === 'tokenCount' && '📊 Tokens'}
                      {metric === 'cost' && '💰 Cost'}
                      {metric === 'quality' && '⭐ Quality'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mr6-cards-grid">
                {selectedModels.map(model => {
                  const modelMetrics = comparison.metrics[model];
                  const modelOutput = comparison.outputs[model];
                  const info = getModelDisplayInfo(model);
                  const isBest = model === comparison.bestModel;

                  return (
                    <div
                      key={model}
                      className={`mr6-result-card ${isBest ? 'best' : ''}`}
                    >
                      {isBest && (
                        <div className="mr6-best-badge">
                          <span>🏆 Best</span>
                        </div>
                      )}

                      <div className="mr6-card-header">
                        <span className="mr6-card-icon">{info.icon}</span>
                        <h3 className="mr6-card-title">{info.name}</h3>
                      </div>

                      <div className="mr6-card-metrics">
                        {selectedMetrics.includes('speed') && modelMetrics && (
                          <div className="mr6-card-metric">
                            <span className="mr6-metric-label">⚡</span>
                            <span className="mr6-metric-val">{modelMetrics.speed.toFixed(2)}s</span>
                          </div>
                        )}
                        {selectedMetrics.includes('tokenCount') && modelMetrics && (
                          <div className="mr6-card-metric">
                            <span className="mr6-metric-label">📊</span>
                            <span className="mr6-metric-val">{modelMetrics.tokenCount}</span>
                          </div>
                        )}
                        {selectedMetrics.includes('cost') && modelMetrics && (
                          <div className="mr6-card-metric">
                            <span className="mr6-metric-label">💰</span>
                            <span className="mr6-metric-val">${modelMetrics.cost.toFixed(4)}</span>
                          </div>
                        )}
                        {selectedMetrics.includes('quality') && modelMetrics && (
                          <div className="mr6-card-metric">
                            <span className="mr6-metric-label">⭐</span>
                            <span className="mr6-metric-val">
                              {modelMetrics.quality > 0 ? `${modelMetrics.quality.toFixed(1)}/5` : 'Pending'}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="mr6-card-content">
                        <p>{modelOutput || 'No output'}</p>
                      </div>

                      <button
                        className="mr6-card-select-btn"
                        onClick={() => {
                          flowTracker?.recordInteraction?.('MR6', 'make_selection', { model });
                          flowTracker?.recordApply?.('MR6', { model, output: modelOutput });
                          flowTracker?.recordComplete?.('MR6');
                          onModelSelected?.(model, modelOutput || '');
                        }}
                      >
                        ✓ Use This Response
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Recommendation Box */}
              <div className="mr6-recommendation-compact">
                <div className="mr6-rec-icon">💡</div>
                <div className="mr6-rec-content">
                  <strong>Recommendation: </strong>
                  <span>{comparison.reasoning}</span>
                  {comparison.recommendedFor.length > 0 && (
                    <span className="mr6-rec-tags">
                      Best for: {comparison.recommendedFor.join(', ')}
                    </span>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="mr6-empty-state-enhanced">
              <div className="mr6-empty-icon">🔬</div>
              <h3 className="mr6-empty-title">Start Your Model Experiment</h3>
              <p className="mr6-empty-desc">
                Select models to compare, enter a prompt, then click "Start Comparison"
              </p>
              <div className="mr6-empty-tips">
                <div className="mr6-tip">
                  <span className="mr6-tip-icon">💡</span>
                  <span>Use GPT-4o for complex tasks, GPT-3.5 for simple ones to save time and cost</span>
                </div>
                <div className="mr6-tip">
                  <span className="mr6-tip-icon">⚡</span>
                  <span>GPT-4o Mini is the best choice for everyday use</span>
                </div>
                <div className="mr6-tip">
                  <span className="mr6-tip-icon">🎯</span>
                  <span>Compare multiple models at once to find the best answer for you</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MR6CrossModelExperimentation;
