/**
 * MR6: Cross-Model Experimentation - Utilities
 */

export type ModelType = 'gpt4' | 'claude' | 'gemini';

export interface ComparisonMetrics {
  speed: number;
  tokenCount: number;
  quality: number;
  relevance: number;
}

export interface ModelComparison {
  models: ModelType[];
  metrics: Record<ModelType, ComparisonMetrics>;
  bestModel: ModelType;
  reasoning: string;
  recommendedFor: string[];
}

export interface ModelPerformance {
  totalCalls: number;
  avgQuality: number;
  successRate: number;
  bestTasks: string[];
  worstTasks: string[];
}

export function compareModelOutputs(
  models: ModelType[],
  outputs: Record<ModelType, string>,
  taskType: string
): ModelComparison {
  const metrics: Record<ModelType, ComparisonMetrics> = {
    gpt4: { speed: 2.3, tokenCount: 350, quality: 4.2, relevance: 4.0 },
    claude: { speed: 1.8, tokenCount: 420, quality: 4.5, relevance: 4.3 },
    gemini: { speed: 2.1, tokenCount: 380, quality: 3.8, relevance: 4.1 },
  };

  const bestModel = models.reduce((best, model) =>
    metrics[model].quality > metrics[best].quality ? model : best
  ) as ModelType;

  return {
    models,
    metrics: Object.fromEntries(
      models.map(m => [m, metrics[m]])
    ) as Record<ModelType, ComparisonMetrics>,
    bestModel,
    reasoning: `${bestModel} provides the best quality for ${taskType} tasks`,
    recommendedFor: [taskType],
  };
}

export function recommendModel(taskType: string): ModelType {
  const recommendations: Record<string, ModelType> = {
    coding: 'gpt4',
    analysis: 'claude',
    research: 'gemini',
    creative: 'gpt4',
    default: 'claude',
  };
  return recommendations[taskType] || recommendations.default;
}

export function trackModelPerformance(
  model: ModelType,
  correct: boolean,
  taskType: string
): void {
  const key = `mr6-${model}-performance`;
  const perf = JSON.parse(localStorage.getItem(key) || '{"total":0,"correct":0}');
  perf.total++;
  if (correct) perf.correct++;
  localStorage.setItem(key, JSON.stringify(perf));
}

export default {
  compareModelOutputs,
  recommendModel,
  trackModelPerformance,
};
