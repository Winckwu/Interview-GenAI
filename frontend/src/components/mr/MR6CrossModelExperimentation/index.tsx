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
    label: '全部比较',
    icon: '🔄',
    models: ['gpt-4o', 'gpt-4o-mini', 'gpt-3.5-turbo'],
    description: '同时对比所有可用模型',
  },
  {
    id: 'quality-vs-speed',
    label: '质量 vs 速度',
    icon: '⚖️',
    models: ['gpt-4o', 'gpt-3.5-turbo'],
    description: '对比最高质量与最快速度',
  },
  {
    id: 'balanced',
    label: '性价比对比',
    icon: '💰',
    models: ['gpt-4o-mini', 'gpt-3.5-turbo'],
    description: '对比两个高性价比模型',
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

  // Auto-populate prompt from conversation if available
  const lastUserMessage = useMemo(() => {
    const userMessages = conversationHistory.filter(m => m.role === 'user');
    return userMessages.length > 0 ? userMessages[userMessages.length - 1].content : '';
  }, [conversationHistory]);

  const handleUseCurrentChat = useCallback(() => {
    if (lastUserMessage) {
      setUserPrompt(lastUserMessage);
      setActiveStep(2);
      flowTracker?.recordInteraction?.('MR6', 'use_current_chat', { promptLength: lastUserMessage.length });
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

  const getModelDisplayInfo = (model: ModelType) => {
    switch (model) {
      case 'gpt-4o':
        return { icon: '🤖', name: 'GPT-4o', tag: '最强大', tagColor: '#8b5cf6' };
      case 'gpt-4o-mini':
        return { icon: '⚡', name: 'GPT-4o Mini', tag: '均衡', tagColor: '#10b981' };
      case 'gpt-3.5-turbo':
        return { icon: '🚀', name: 'GPT-3.5', tag: '最快', tagColor: '#f59e0b' };
      default:
        return { icon: '🤖', name: model, tag: '', tagColor: '#6b7280' };
    }
  };

  return (
    <div className="mr6-container mr6-optimized">
      {/* Compact Header */}
      <div className="mr6-header-compact">
        <div className="mr6-header-left">
          <h1 className="mr6-title-compact">🔄 模型对比实验</h1>
          <p className="mr6-subtitle-compact">同时运行多个模型，找到最佳答案</p>
        </div>
        <button
          className="mr6-guide-toggle"
          onClick={() => setShowGuide(!showGuide)}
          title={showGuide ? '隐藏指南' : '显示指南'}
        >
          {showGuide ? '📖 隐藏指南' : '📖 模型指南'}
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
                <span className="mr6-guide-desc">复杂推理、代码生成、创意写作</span>
              </div>
            </div>
            <div className="mr6-guide-item">
              <span className="mr6-guide-icon">⚡</span>
              <div>
                <strong>GPT-4o Mini</strong>
                <span className="mr6-guide-desc">日常任务、快速回答、代码审查</span>
              </div>
            </div>
            <div className="mr6-guide-item">
              <span className="mr6-guide-icon">🚀</span>
              <div>
                <strong>GPT-3.5</strong>
                <span className="mr6-guide-desc">简单问题、快速事实、翻译</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Step Indicator */}
      <div className="mr6-steps">
        <div className={`mr6-step ${activeStep >= 1 ? 'active' : ''} ${activeStep > 1 ? 'completed' : ''}`}>
          <div className="mr6-step-number">1</div>
          <span>选择模型</span>
        </div>
        <div className="mr6-step-line" />
        <div className={`mr6-step ${activeStep >= 2 ? 'active' : ''} ${activeStep > 2 ? 'completed' : ''}`}>
          <div className="mr6-step-number">2</div>
          <span>输入问题</span>
        </div>
        <div className="mr6-step-line" />
        <div className={`mr6-step ${activeStep >= 3 ? 'active' : ''}`}>
          <div className="mr6-step-number">3</div>
          <span>查看结果</span>
        </div>
      </div>

      <div className="mr6-layout-optimized">
        {/* Left Panel - Controls */}
        <div className="mr6-controls-optimized">
          {/* Quick Presets */}
          <div className="mr6-quick-section">
            <h3 className="mr6-section-title">⚡ 快速选择</h3>
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
            <h3 className="mr6-section-title">🎯 选择模型</h3>
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
                      <span className="mr6-toggle-recommended">推荐</span>
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
              <h3 className="mr6-section-title">💬 输入问题</h3>
              {lastUserMessage && (
                <button
                  className="mr6-use-chat-btn"
                  onClick={handleUseCurrentChat}
                >
                  📋 使用当前对话
                </button>
              )}
            </div>
            <textarea
              className="mr6-textarea-optimized"
              placeholder="输入您想让多个模型回答的问题..."
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
                正在运行对比...
              </>
            ) : (
              <>▶️ 开始对比 ({selectedModels.length} 个模型)</>
            )}
          </button>

          {selectedModels.length === 0 && (
            <p className="mr6-warning">⚠️ 请至少选择一个模型</p>
          )}
        </div>

        {/* Right Panel - Results */}
        <div className="mr6-results-panel">
          {comparison ? (
            <>
              <div className="mr6-results-header">
                <h2 className="mr6-results-title">📊 对比结果</h2>
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
                      {metric === 'speed' && '⚡ 速度'}
                      {metric === 'tokenCount' && '📊 Token'}
                      {metric === 'cost' && '💰 成本'}
                      {metric === 'quality' && '⭐ 质量'}
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
                          <span>🏆 最佳</span>
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
                              {modelMetrics.quality > 0 ? `${modelMetrics.quality.toFixed(1)}/5` : '待评分'}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="mr6-card-content">
                        <p>{modelOutput || '无输出'}</p>
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
                        ✓ 使用这个答案
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Recommendation Box */}
              <div className="mr6-recommendation-compact">
                <div className="mr6-rec-icon">💡</div>
                <div className="mr6-rec-content">
                  <strong>建议：</strong>
                  <span>{comparison.reasoning}</span>
                  {comparison.recommendedFor.length > 0 && (
                    <span className="mr6-rec-tags">
                      适合: {comparison.recommendedFor.join('、')}
                    </span>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="mr6-empty-state-enhanced">
              <div className="mr6-empty-icon">🔬</div>
              <h3 className="mr6-empty-title">开始您的模型实验</h3>
              <p className="mr6-empty-desc">
                选择要比较的模型，输入问题，然后点击"开始对比"
              </p>
              <div className="mr6-empty-tips">
                <div className="mr6-tip">
                  <span className="mr6-tip-icon">💡</span>
                  <span>复杂问题用 GPT-4o，简单问题用 GPT-3.5 更快更省</span>
                </div>
                <div className="mr6-tip">
                  <span className="mr6-tip-icon">⚡</span>
                  <span>GPT-4o Mini 是日常使用的最佳选择</span>
                </div>
                <div className="mr6-tip">
                  <span className="mr6-tip-icon">🎯</span>
                  <span>同时对比多个模型，找到最适合你的答案</span>
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
