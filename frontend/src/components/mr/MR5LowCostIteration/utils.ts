/**
 * MR5: Low-Cost Iteration Mechanism - Utilities
 *
 * Functions for:
 * - Managing conversation branches
 * - Generating variants with different parameters
 * - Comparing variants and branches
 * - Learning user preferences
 * - Recommending promising branches
 */

import { apiService } from '../../../services/api';

/**
 * Reference to parent conversation point
 */
export interface ParentReference {
  branchId: string;
  messageIndex: number;
}

/**
 * Conversation branch
 */
export interface ConversationBranch {
  id: string;
  name: string;
  parentRef: ParentReference;
  history: Array<{ role: 'user' | 'ai'; content: string; timestamp: Date }>;
  nextPrompt: string;
  createdAt: Date;
  rating: number; // 0-5 stars
  variantsCount: number;
}

/**
 * Generated variant with metadata
 */
export interface IterationVariant {
  id: string;
  content: string;
  temperature: number; // 0-1
  prompt: string;
  generatedAt: Date;
  rating?: 'good' | 'okay' | 'poor';
}

/**
 * Comparison result between variants
 */
export interface VariantComparison {
  variants: IterationVariant[];
  differences: DifferenceSummary[];
  metrics: ComparisonMetrics;
  recommendation: string;
}

/**
 * Identified differences between variants
 */
export interface DifferenceSummary {
  section: number;
  change: 'added' | 'removed' | 'modified';
  before?: string;
  after?: string;
}

/**
 * Metrics for variant comparison
 */
export interface ComparisonMetrics {
  lengths: number[];
  similarities: number[];
  readabilityScores: number[];
  tokenCounts: number[];
}

/**
 * Branch tree structure for visualization
 */
export interface BranchTree {
  main: ConversationBranch | null;
  children: ConversationBranch[];
  depths: Map<string, number>;
}

/**
 * Generate multiple variants with different temperature settings - uses GPT API
 */
export async function generateVariants(options: {
  prompt: string;
  count: number;
  temperatureRange: { min: number; max: number };
  baseVariant: string;
  conversationHistory?: Array<{ role: string; content: string }>;
}): Promise<IterationVariant[]> {
  const { prompt, count, temperatureRange, conversationHistory = [] } = options;

  try {
    // Build variant configurations based on count and temperature range
    const variantConfigs = [];
    const styles = ['precise', 'balanced', 'creative', 'technical', 'formal', 'casual'];

    for (let i = 0; i < count; i++) {
      // Interpolate temperature across range
      const temperature = temperatureRange.min + (i / Math.max(count - 1, 1)) * (temperatureRange.max - temperatureRange.min);

      // Select style based on temperature
      let style = 'balanced';
      if (temperature < 0.3) style = 'precise';
      else if (temperature < 0.5) style = 'formal';
      else if (temperature < 0.7) style = 'balanced';
      else if (temperature < 0.85) style = 'creative';
      else style = 'technical';

      variantConfigs.push({
        temperature,
        style,
        maxTokens: 2000,
      });
    }

    // Call the new batch-variants endpoint
    const response = await apiService.ai.batchVariants(
      prompt,
      conversationHistory,
      variantConfigs
    );

    if (response.data?.success && response.data?.data?.variants) {
      return response.data.data.variants.map((v: any) => ({
        id: v.id || `variant-${Date.now()}-${Math.random()}`,
        content: v.content,
        temperature: v.config?.temperature || 0.7,
        prompt,
        generatedAt: new Date(),
        style: v.config?.style,
        tokenUsage: v.usage,
      }));
    }
  } catch (error) {
    console.warn('[MR5] Batch variant generation failed, using local fallback:', error);
  }

  // Fallback to local generation
  const variants: IterationVariant[] = [];

  for (let i = 0; i < count; i++) {
    // Interpolate temperature across range
    const temperature = temperatureRange.min + (i / Math.max(count - 1, 1)) * (temperatureRange.max - temperatureRange.min);

    // Simulate variant generation
    const variant: IterationVariant = {
      id: `variant-${Date.now()}-${i}`,
      content: generateVariantContent(options.baseVariant, temperature),
      temperature,
      prompt,
      generatedAt: new Date(),
    };

    variants.push(variant);
  }

  return variants;
}

/**
 * Simulate variant generation with different parameters
 * In production, this would call an LLM API with temperature parameter
 */
function generateVariantContent(baseVariant: string, temperature: number): string {
  // Temperature affects creativity:
  // 0.0 = most deterministic, 1.0 = most creative/random

  // This is a simplified simulation
  // In reality, this would make an API call with temperature setting
  if (temperature < 0.3) {
    return `${baseVariant} (Conservative approach)`;
  } else if (temperature < 0.6) {
    return `${baseVariant} (Balanced approach)`;
  } else {
    return `${baseVariant} (Creative approach)`;
  }
}

/**
 * Rate a variant based on user feedback
 */
export function rateVariant(variantId: string, rating: 'good' | 'okay' | 'poor'): void {
  // Store rating in localStorage for persistence
  const ratings = JSON.parse(localStorage.getItem('mr5-variant-ratings') || '{}');
  ratings[variantId] = rating;
  localStorage.setItem('mr5-variant-ratings', JSON.stringify(ratings));
}

/**
 * Get branch tree structure from flat array
 */
export function getBranchTree(branches: ConversationBranch[]): BranchTree {
  const depths = new Map<string, number>();
  depths.set('main', 0);

  // Calculate depth of each branch based on parent references
  branches.forEach(branch => {
    let depth = 1;
    let current = branch;
    const visited = new Set<string>();

    while (current.parentRef.branchId !== 'main' && !visited.has(current.parentRef.branchId)) {
      visited.add(current.parentRef.branchId);
      const parent = branches.find(b => b.id === current.parentRef.branchId);
      if (!parent) break;
      current = parent;
      depth++;
    }

    depths.set(branch.id, depth);
  });

  return {
    main: null,
    children: branches,
    depths,
  };
}

/**
 * Calculate similarity between two text strings (0-1)
 */
function calculateSimilarity(text1: string, text2: string): number {
  // Simple similarity: character overlap
  const set1 = new Set(text1.toLowerCase().split(''));
  const set2 = new Set(text2.toLowerCase().split(''));

  const intersection = Array.from(set1).filter(c => set2.has(c)).length;
  const union = new Set([...set1, ...set2]).size;

  return union === 0 ? 1 : intersection / union;
}

/**
 * Calculate readability score (0-100)
 * Based on average word length, sentence length, etc.
 */
function calculateReadabilityScore(text: string): number {
  const words = text.split(/\s+/).length;
  const sentences = text.split(/[.!?]+/).length;
  const avgWordLength = text.replace(/\s/g, '').length / words;

  // Flesch Reading Ease adapted formula
  const score = Math.max(
    0,
    Math.min(100, 206.835 - 1.015 * (words / sentences) - 84.6 * (avgWordLength / 4.7))
  );

  return score;
}

/**
 * Compare multiple variants and return detailed comparison
 */
export function compareBranches(variants: IterationVariant[]): VariantComparison {
  if (variants.length < 2) {
    throw new Error('Need at least 2 variants to compare');
  }

  // Calculate metrics
  const lengths = variants.map(v => v.content.length);
  const similarities = variants.map((v, idx) =>
    idx === 0 ? 1 : calculateSimilarity(variants[0].content, v.content)
  );
  const readabilityScores = variants.map(v => calculateReadabilityScore(v.content));
  const tokenCounts = variants.map(v => Math.round(v.content.length / 4)); // Approx 4 chars per token

  // Identify differences (simplified)
  const differences: DifferenceSummary[] = [];
  if (variants.length >= 2) {
    const wordsA = variants[0].content.split(/\s+/);
    const wordsB = variants[1].content.split(/\s+/);

    for (let i = 0; i < Math.max(wordsA.length, wordsB.length); i++) {
      if (wordsA[i] !== wordsB[i]) {
        differences.push({
          section: i,
          change: 'modified',
          before: wordsA[i],
          after: wordsB[i],
        });
      }
    }
  }

  // Generate recommendation
  const bestIdx = readabilityScores.indexOf(Math.max(...readabilityScores));
  const recommendation = `Variant ${bestIdx + 1} has the best readability score (${readabilityScores[bestIdx].toFixed(1)})`;

  return {
    variants,
    differences,
    metrics: {
      lengths,
      similarities,
      readabilityScores,
      tokenCounts,
    },
    recommendation,
  };
}

/**
 * Get most promising branches based on ratings and iteration history
 */
export function getPromissingBranches(
  branches: ConversationBranch[],
  ratings: Array<[string, 'good' | 'okay' | 'poor']>
): ConversationBranch[] {
  const ratingMap = new Map(ratings);

  // Calculate score for each branch based on:
  // 1. Branch rating (0-5 stars)
  // 2. Number of variants with "good" rating
  // 3. Recency
  const scores = branches.map(branch => {
    let score = branch.rating * 2; // Base score from branch rating

    // Add points for good variants
    const goodRatings = ratings.filter(([_, rating]) => rating === 'good').length;
    score += goodRatings * 3;

    // Boost recent branches slightly
    const ageMinutes = (new Date().getTime() - branch.createdAt.getTime()) / 60000;
    if (ageMinutes < 30) score += 2;

    return { branch, score };
  });

  // Sort by score and return top 3
  return scores
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map(item => item.branch);
}

/**
 * Calculate variant preference learning
 * Learns which characteristics user prefers based on ratings
 */
export interface PreferencePattern {
  preferredTemperature: number;
  preferredLength: 'short' | 'medium' | 'long';
  preferredStyle: 'creative' | 'balanced' | 'conservative';
  goodRatingCount: number;
  poorRatingCount: number;
}

export function learnUserPreferences(variants: IterationVariant[]): PreferencePattern {
  const goodVariants = variants.filter(v => v.rating === 'good');
  const poorVariants = variants.filter(v => v.rating === 'poor');

  // Calculate average temperature of good variants
  const avgGoodTemp = goodVariants.length > 0 ? goodVariants.reduce((sum, v) => sum + v.temperature, 0) / goodVariants.length : 0.5;

  // Determine style preference
  let preferredStyle: 'creative' | 'balanced' | 'conservative' = 'balanced';
  if (avgGoodTemp < 0.33) preferredStyle = 'conservative';
  else if (avgGoodTemp > 0.67) preferredStyle = 'creative';

  // Determine length preference
  const avgGoodLength = goodVariants.length > 0 ? goodVariants.reduce((sum, v) => sum + v.content.length, 0) / goodVariants.length : 200;
  let preferredLength: 'short' | 'medium' | 'long' = 'medium';
  if (avgGoodLength < 150) preferredLength = 'short';
  else if (avgGoodLength > 400) preferredLength = 'long';

  return {
    preferredTemperature: avgGoodTemp,
    preferredLength,
    preferredStyle,
    goodRatingCount: goodVariants.length,
    poorRatingCount: poorVariants.length,
  };
}

/**
 * Get iteration recommendations based on history
 */
export interface IterationRecommendation {
  strategy: string;
  reason: string;
  suggestedTemperatureRange: { min: number; max: number };
  suggestedVariantCount: number;
}

export function getIterationRecommendation(
  branchHistory: ConversationBranch[],
  preferences: PreferencePattern
): IterationRecommendation {
  const recommendations: IterationRecommendation[] = [
    {
      strategy: 'Conservative refinement',
      reason: 'You prefer balanced outputs; make small tweaks',
      suggestedTemperatureRange: { min: 0.2, max: 0.4 },
      suggestedVariantCount: 3,
    },
    {
      strategy: 'Creative exploration',
      reason: 'You prefer more creative outputs; expand the range',
      suggestedTemperatureRange: { min: 0.6, max: 0.9 },
      suggestedVariantCount: 5,
    },
    {
      strategy: 'Diverse generation',
      reason: 'Mix of your preferences; generate across the range',
      suggestedTemperatureRange: { min: 0.2, max: 0.8 },
      suggestedVariantCount: 6,
    },
  ];

  // Select recommendation based on preference
  const selectedIdx =
    preferences.preferredStyle === 'conservative'
      ? 0
      : preferences.preferredStyle === 'creative'
        ? 1
        : 2;

  return recommendations[selectedIdx];
}

/**
 * Track iteration metrics for analytics
 */
export interface IterationMetrics {
  totalBranches: number;
  totalVariantsGenerated: number;
  averageIterationsPerBranch: number;
  timeToResolution: number; // minutes
  userSatisfactionRate: number; // 0-1
}

export function calculateIterationMetrics(branches: ConversationBranch[]): IterationMetrics {
  const totalBranches = branches.length;
  const totalVariantsGenerated = branches.reduce((sum, b) => sum + b.variantsCount, 0);
  const averageIterationsPerBranch = totalBranches > 0 ? totalVariantsGenerated / totalBranches : 0;

  // Calculate time to resolution (time from first branch to highest-rated branch)
  let timeToResolution = 0;
  if (branches.length > 0) {
    const firstBranch = branches[0];
    const bestBranch = branches.reduce((best, b) => (b.rating > best.rating ? b : best));
    timeToResolution = (bestBranch.createdAt.getTime() - firstBranch.createdAt.getTime()) / 60000;
  }

  // Calculate satisfaction (percentage of branches with rating >= 3)
  const satisfiedBranches = branches.filter(b => b.rating >= 3).length;
  const userSatisfactionRate = branches.length > 0 ? satisfiedBranches / branches.length : 0;

  return {
    totalBranches,
    totalVariantsGenerated,
    averageIterationsPerBranch,
    timeToResolution,
    userSatisfactionRate,
  };
}

export default {
  generateVariants,
  rateVariant,
  getBranchTree,
  compareBranches,
  getPromissingBranches,
  learnUserPreferences,
  getIterationRecommendation,
  calculateIterationMetrics,
};
