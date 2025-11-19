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
  compareModelOutputs,
  recommendModel,
  trackModelPerformance,
  ModelType,
  ComparisonMetrics,
} from './MR6CrossModelExperimentation.utils';
import './MR6CrossModelExperimentation.css';

interface MR6Props {
  prompt?: string;
  taskType?: string;
  onModelSelected?: (model: ModelType) => void;
  onComparisonComplete?: (comparison: ModelComparison) => void;
  availableModels?: ModelType[];
}

export const MR6CrossModelExperimentation: React.FC<MR6Props> = ({
  prompt = '',
  taskType = 'general',
  onModelSelected,
  onComparisonComplete,
  availableModels = ['gpt4', 'claude', 'gemini'],
}) => {
  const [selectedModels, setSelectedModels] = useState<ModelType[]>(availableModels);
  const [modelOutputs, setModelOutputs] = useState<Record<ModelType, string>>({
    gpt4: '',
    claude: '',
    gemini: '',
  });
  const [comparison, setComparison] = useState<ModelComparison | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedMetrics, setSelectedMetrics] = useState<(keyof ComparisonMetrics)[]>([
    'speed',
    'tokenCount',
    'quality',
  ]);
  const [userPrompt, setUserPrompt] = useState(prompt);

  const recommendedModel = useMemo(() => {
    return recommendModel(taskType);
  }, [taskType]);

  const handleRunExperiment = useCallback(async () => {
    if (!userPrompt) return;

    setIsLoading(true);
    // Simulate model calls
    setTimeout(() => {
      const outputs: Record<ModelType, string> = {
        gpt4: `GPT-4 Response to: ${userPrompt}\n[Comprehensive output with code examples]`,
        claude: `Claude Response to: ${userPrompt}\n[Analytical perspective with safety considerations]`,
        gemini: `Gemini Response to: ${userPrompt}\n[Real-time informed response with long context support]`,
      };

      setModelOutputs(outputs);

      // Compare outputs
      const comp = compareModelOutputs(selectedModels, outputs, taskType);
      setComparison(comp);
      onComparisonComplete?.(comp);

      setIsLoading(false);
    }, 1000);
  }, [userPrompt, selectedModels, taskType, onComparisonComplete]);

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
                      } else {
                        setSelectedModels(prev => prev.filter(m => m !== model));
                      }
                    }}
                  />
                  <span className="mr6-model-name">
                    {model === 'gpt4' && '🤖 GPT-4'}
                    {model === 'claude' && '🧠 Claude'}
                    {model === 'gemini' && '✨ Gemini'}
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
              {(['speed', 'tokenCount', 'quality', 'relevance'] as const).map(metric => (
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
              {selectedModels.map(model => (
                <div key={model} className="mr6-output-card">
                  <h3 className="mr6-output-title">
                    {model === 'gpt4' && '🤖 GPT-4'}
                    {model === 'claude' && '🧠 Claude'}
                    {model === 'gemini' && '✨ Gemini'}
                  </h3>

                  <div className="mr6-metrics">
                    {selectedMetrics.includes('speed') && (
                      <div className="mr6-metric">
                        <span>Speed:</span>
                        <span className="mr6-metric-value">
                          {Math.random().toFixed(2)}s
                        </span>
                      </div>
                    )}
                    {selectedMetrics.includes('tokenCount') && (
                      <div className="mr6-metric">
                        <span>Tokens:</span>
                        <span className="mr6-metric-value">
                          {Math.round(Math.random() * 500) + 200}
                        </span>
                      </div>
                    )}
                    {selectedMetrics.includes('quality') && (
                      <div className="mr6-metric">
                        <span>Quality:</span>
                        <span className="mr6-metric-value">
                          {'⭐'.repeat(Math.round(Math.random() * 5))}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="mr6-output-content">
                    <p>{modelOutputs[model]}</p>
                  </div>

                  <button
                    className="mr6-select-btn"
                    onClick={() => onModelSelected?.(model)}
                  >
                    Select This Output
                  </button>
                </div>
              ))}
            </div>

            <div className="mr6-recommendation-box">
              <h3 className="mr6-recommendation-title">💡 Best Choice</h3>
              <p className="mr6-recommendation-text">
                {comparison.bestModel === 'gpt4' && 'GPT-4 excels at coding and comprehensive tasks'}
                {comparison.bestModel === 'claude' && 'Claude provides the most thorough analysis'}
                {comparison.bestModel === 'gemini' && 'Gemini offers the longest context window'}
              </p>
            </div>
          </div>
        ) : (
          <div className="mr6-empty-state">
            <p>Enter your prompt and run the experiment to compare model outputs</p>
          </div>
        )}
      </div>

      <div className="mr6-model-guide">
        <h3 className="mr6-guide-title">Model Strengths</h3>
        <div className="mr6-guide-grid">
          <div className="mr6-guide-card">
            <h4>🤖 GPT-4</h4>
            <ul>
              <li>Comprehensive problem-solving</li>
              <li>Code generation and debugging</li>
              <li>Creative writing</li>
            </ul>
          </div>
          <div className="mr6-guide-card">
            <h4>🧠 Claude</h4>
            <ul>
              <li>Deep analysis and reasoning</li>
              <li>Safety-conscious responses</li>
              <li>Nuanced explanations</li>
            </ul>
          </div>
          <div className="mr6-guide-card">
            <h4>✨ Gemini</h4>
            <ul>
              <li>Long context support</li>
              <li>Real-time information</li>
              <li>Multi-modal capabilities</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MR6CrossModelExperimentation;
