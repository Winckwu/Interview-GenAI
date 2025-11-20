/**
 * MR6: Cross-Model Experimentation - Utilities
 */

import { apiService } from '../../../services/api';

export type ModelType = 'gpt-4o' | 'gpt-4o-mini' | 'gpt-3.5-turbo';

export interface ComparisonMetrics {
  speed: number;
  tokenCount: number;
  quality: number;
  relevance: number;
  cost: number;
}

export interface ModelComparison {
  models: ModelType[];
  outputs: Record<ModelType, string>;
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

/**
 * Call multiple AI models in parallel and compare outputs
 */
export async function callMultipleModels(
  userPrompt: string,
  conversationHistory: Array<{ role: string; content: string }> = [],
  models: ModelType[] = ['gpt-4o', 'gpt-4o-mini', 'gpt-3.5-turbo']
): Promise<ModelComparison> {
  try {
    // Call backend multi-model endpoint
    const response = await apiService.ai.multiModel(
      userPrompt,
      conversationHistory,
      models
    );

    if (response.data?.success && response.data?.data?.comparisons) {
      const comparisons = response.data.data.comparisons;
      const outputs: Record<ModelType, string> = {} as any;
      const metrics: Record<ModelType, ComparisonMetrics> = {} as any;

      comparisons.forEach((comp: any) => {
        const modelId = comp.modelId as ModelType;
        outputs[modelId] = comp.content;
        metrics[modelId] = {
          speed: comp.latency / 1000, // Convert ms to seconds
          tokenCount: comp.usage?.totalTokens || 0,
          quality: 0, // Will be set by user rating
          relevance: 0, // Will be set by user rating
          cost: comp.estimatedCost || 0,
        };
      });

      // Determine best model based on latency and token efficiency
      const bestModel = models.reduce((best, model) => {
        const bestMetrics = metrics[best];
        const currentMetrics = metrics[model];

        // Lower latency + lower token count = better
        const bestScore = bestMetrics.speed * 0.5 + (bestMetrics.tokenCount / 1000) * 0.5;
        const currentScore = currentMetrics.speed * 0.5 + (currentMetrics.tokenCount / 1000) * 0.5;

        return currentScore < bestScore ? model : best;
      });

      return {
        models,
        outputs,
        metrics,
        bestModel,
        reasoning: generateReasoning(bestModel, metrics),
        recommendedFor: getRecommendedTasks(bestModel),
      };
    }
  } catch (error) {
    console.error('[MR6] Multi-model call failed:', error);
  }

  // Fallback to mock data
  return generateMockComparison(models, userPrompt);
}

function generateReasoning(bestModel: ModelType, metrics: Record<ModelType, ComparisonMetrics>): string {
  const metric = metrics[bestModel];
  if (bestModel === 'gpt-4o') {
    return `GPT-4o provides the most capable and comprehensive responses, ideal for complex tasks.`;
  } else if (bestModel === 'gpt-4o-mini') {
    return `GPT-4o Mini offers the best balance of speed (${metric.speed.toFixed(2)}s) and quality at lower cost ($${metric.cost.toFixed(4)}).`;
  } else {
    return `GPT-3.5 Turbo is the fastest option (${metric.speed.toFixed(2)}s) with lowest cost ($${metric.cost.toFixed(4)}), suitable for simple tasks.`;
  }
}

function getRecommendedTasks(model: ModelType): string[] {
  const recommendations: Record<ModelType, string[]> = {
    'gpt-4o': ['Complex reasoning', 'Code generation', 'Creative writing', 'Analysis'],
    'gpt-4o-mini': ['General tasks', 'Quick answers', 'Code review', 'Summarization'],
    'gpt-3.5-turbo': ['Simple questions', 'Quick facts', 'Basic formatting', 'Translation'],
  };
  return recommendations[model] || [];
}

function generateMockComparison(models: ModelType[], prompt: string): ModelComparison {
  const outputs: Record<ModelType, string> = {} as any;
  const metrics: Record<ModelType, ComparisonMetrics> = {} as any;

  models.forEach(model => {
    outputs[model] = `${model} Response to: ${prompt}\n[Mock response for testing]`;
    metrics[model] = {
      speed: model === 'gpt-3.5-turbo' ? 1.2 : model === 'gpt-4o-mini' ? 1.8 : 2.5,
      tokenCount: Math.round(Math.random() * 300) + 200,
      quality: model === 'gpt-4o' ? 4.5 : model === 'gpt-4o-mini' ? 4.0 : 3.5,
      relevance: 4.0,
      cost: model === 'gpt-3.5-turbo' ? 0.0001 : model === 'gpt-4o-mini' ? 0.0003 : 0.001,
    };
  });

  return {
    models,
    outputs,
    metrics,
    bestModel: models[0],
    reasoning: 'Mock comparison for testing',
    recommendedFor: ['testing'],
  };
}

export function compareModelOutputs(
  models: ModelType[],
  outputs: Record<ModelType, string>,
  taskType: string
): ModelComparison {
  // This function is now deprecated in favor of callMultipleModels
  return generateMockComparison(models, '');
}

export function recommendModel(taskType: string): ModelType {
  const recommendations: Record<string, ModelType> = {
    coding: 'gpt-4o',
    analysis: 'gpt-4o',
    research: 'gpt-4o',
    creative: 'gpt-4o',
    simple: 'gpt-3.5-turbo',
    quick: 'gpt-4o-mini',
    default: 'gpt-4o-mini',
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
