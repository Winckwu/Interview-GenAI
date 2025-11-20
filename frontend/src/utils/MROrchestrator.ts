/**
 * MR Dynamic Orchestrator
 *
 * Automatically adjusts MR tool activation strategy based on trust calibration.
 *
 * Design Philosophy:
 * - Low trust (0-40): Aggressive verification and support tools
 * - Medium trust (40-70): Balanced verification and reflection tools
 * - High trust (70-100): Light-touch reflection and learning tools
 *
 * This orchestrator operates in the background, analyzing each AI response
 * and recommending appropriate MR interventions based on context.
 */

import { calculateTrustScore, TrustProfile } from '../components/MR9DynamicTrustCalibration.utils';

export type MRToolType =
  | 'mr1-decomposition'
  | 'mr2-transparency'
  | 'mr3-agency'
  | 'mr4-roles'
  | 'mr5-iteration'
  | 'mr6-models'
  | 'mr7-failure'
  | 'mr8-recognition'
  | 'mr9-trust'
  | 'mr10-cost'
  | 'mr11-verify'
  | 'mr12-critical'
  | 'mr13-uncertainty'
  | 'mr14-reflection'
  | 'mr15-strategies'
  | 'mr16-warnings'
  | 'mr17-metrics'
  | 'mr18-warnings'
  | 'mr19-assessment';

export type TrustLevel = 'low' | 'medium' | 'high';

export interface MRRecommendation {
  tool: MRToolType;
  toolName: string;
  priority: 'high' | 'medium' | 'low';
  reason: string;
  icon: string;
  urgency: number; // 0-100, higher = more urgent
}

export interface OrchestrationContext {
  trustScore: number; // 0-100
  taskType: string;
  taskCriticality: 'low' | 'medium' | 'high';
  messageWasModified: boolean;
  messageWasVerified: boolean;
  consecutiveUnverified: number;
  aiConfidenceScore?: number; // 0-1
  userFamiliarity?: 'familiar' | 'moderate' | 'unfamiliar';
  hasUncertainty?: boolean;
}

export interface OrchestrationResult {
  trustLevel: TrustLevel;
  trustScore: number;
  recommendations: MRRecommendation[];
  interventionStyle: 'aggressive' | 'balanced' | 'light';
  summary: string;
}

/**
 * Map trust score to trust level category
 */
export function getTrustLevel(trustScore: number): TrustLevel {
  if (trustScore >= 70) return 'high';
  if (trustScore >= 40) return 'medium';
  return 'low';
}

/**
 * Core orchestration logic: Determine which MR tools to activate
 * based on trust calibration and context
 */
export function orchestrateMRActivation(context: OrchestrationContext): OrchestrationResult {
  const { trustScore, taskCriticality, messageWasModified, messageWasVerified, consecutiveUnverified } = context;

  const trustLevel = getTrustLevel(trustScore);
  const recommendations: MRRecommendation[] = [];

  // ============================================================
  // LOW TRUST (0-40): Aggressive verification and support
  // ============================================================
  if (trustLevel === 'low') {
    // PRIORITY 1: Verification tools
    recommendations.push({
      tool: 'mr11-verify',
      toolName: 'Integrated Verification',
      priority: 'high',
      reason: 'Low trust score requires thorough verification of this output',
      icon: '🔍',
      urgency: 90,
    });

    // PRIORITY 2: Critical thinking scaffolding
    recommendations.push({
      tool: 'mr12-critical',
      toolName: 'Critical Thinking Scaffolding',
      priority: 'high',
      reason: 'Apply critical analysis to evaluate claims and identify potential issues',
      icon: '🧠',
      urgency: 85,
    });

    // PRIORITY 3: Multi-model comparison
    recommendations.push({
      tool: 'mr6-models',
      toolName: 'Cross-Model Comparison',
      priority: 'high',
      reason: 'Compare this output with responses from other AI models for validation',
      icon: '🔄',
      urgency: 80,
    });

    // If AI shows uncertainty, prioritize transparency
    if (context.hasUncertainty || (context.aiConfidenceScore && context.aiConfidenceScore < 0.6)) {
      recommendations.push({
        tool: 'mr13-uncertainty',
        toolName: 'Transparent Uncertainty',
        priority: 'high',
        reason: 'AI expressed uncertainty - review confidence levels before trusting',
        icon: '⚠️',
        urgency: 95,
      });
    }

    // Always recommend reflection for low trust
    recommendations.push({
      tool: 'mr14-reflection',
      toolName: 'Guided Reflection',
      priority: 'medium',
      reason: 'Reflect on this interaction to build better judgment',
      icon: '💭',
      urgency: 70,
    });

    return {
      trustLevel,
      trustScore,
      recommendations: recommendations.sort((a, b) => b.urgency - a.urgency),
      interventionStyle: 'aggressive',
      summary: `⚠️ Low trust detected (${trustScore.toFixed(0)}%). Multiple verification tools recommended before accepting this output.`,
    };
  }

  // ============================================================
  // MEDIUM TRUST (40-70): Balanced verification and reflection
  // ============================================================
  if (trustLevel === 'medium') {
    // Check if message was modified (iteration signal)
    if (messageWasModified) {
      recommendations.push({
        tool: 'mr5-iteration',
        toolName: 'Low-Cost Iteration',
        priority: 'high',
        reason: 'You modified this response - use branching to explore alternatives',
        icon: '🌳',
        urgency: 85,
      });

      recommendations.push({
        tool: 'mr6-models',
        toolName: 'Cross-Model Comparison',
        priority: 'medium',
        reason: 'Compare different AI models to find the best solution',
        icon: '🔄',
        urgency: 75,
      });
    }

    // If multiple consecutive unverified, suggest verification
    if (consecutiveUnverified >= 3) {
      recommendations.push({
        tool: 'mr11-verify',
        toolName: 'Integrated Verification',
        priority: 'high',
        reason: `You've accepted ${consecutiveUnverified} responses without verification - time to check`,
        icon: '🔍',
        urgency: 80,
      });
    }

    // Always recommend reflection for medium trust
    recommendations.push({
      tool: 'mr14-reflection',
      toolName: 'Guided Reflection',
      priority: 'medium',
      reason: 'Take a moment to reflect on this AI response',
      icon: '💭',
      urgency: 65,
    });

    // If high criticality, add extra verification
    if (taskCriticality === 'high') {
      recommendations.push({
        tool: 'mr12-critical',
        toolName: 'Critical Thinking Scaffolding',
        priority: 'high',
        reason: 'High-stakes task requires critical evaluation',
        icon: '🧠',
        urgency: 90,
      });
    }

    // Suggest process transparency
    recommendations.push({
      tool: 'mr2-transparency',
      toolName: 'Process Transparency',
      priority: 'low',
      reason: 'Review how AI generated this response',
      icon: '👁️',
      urgency: 50,
    });

    return {
      trustLevel,
      trustScore,
      recommendations: recommendations.sort((a, b) => b.urgency - a.urgency),
      interventionStyle: 'balanced',
      summary: `⚡ Medium trust (${trustScore.toFixed(0)}%). Selective verification recommended for important sections.`,
    };
  }

  // ============================================================
  // HIGH TRUST (70-100): Light-touch reflection and learning
  // ============================================================
  if (trustLevel === 'high') {
    // Light-touch reflection
    recommendations.push({
      tool: 'mr14-reflection',
      toolName: 'Quick Reflection',
      priority: 'low',
      reason: 'Quick check: Are you confident in this response?',
      icon: '💭',
      urgency: 40,
    });

    // Suggest process transparency for learning
    recommendations.push({
      tool: 'mr2-transparency',
      toolName: 'Process Transparency',
      priority: 'low',
      reason: 'Optional: Review how AI generated this response',
      icon: '👁️',
      urgency: 30,
    });

    // If modified, still suggest iteration
    if (messageWasModified) {
      recommendations.push({
        tool: 'mr5-iteration',
        toolName: 'Iteration Tools',
        priority: 'low',
        reason: 'Explore alternatives if needed',
        icon: '🌳',
        urgency: 35,
      });
    }

    // Metacognitive strategy learning (lower priority)
    recommendations.push({
      tool: 'mr15-strategies',
      toolName: 'Metacognitive Strategies',
      priority: 'low',
      reason: 'Learn effective AI collaboration strategies',
      icon: '📚',
      urgency: 25,
    });

    return {
      trustLevel,
      trustScore,
      recommendations: recommendations.sort((a, b) => b.urgency - a.urgency),
      interventionStyle: 'light',
      summary: `✅ High trust (${trustScore.toFixed(0)}%). Light verification suggested - spot check important details.`,
    };
  }

  // Fallback (should never reach here)
  return {
    trustLevel: 'medium',
    trustScore,
    recommendations: [],
    interventionStyle: 'balanced',
    summary: 'Unable to determine appropriate interventions',
  };
}

/**
 * Calculate trust score from message context
 * Wrapper around MR9's calculateTrustScore with sensible defaults
 */
export function calculateMessageTrustScore(options: {
  taskType?: string;
  taskCriticality?: 'low' | 'medium' | 'high';
  aiConfidenceScore?: number;
  messageWasVerified?: boolean;
  messageWasModified?: boolean;
  userValidationHistory?: Array<{ taskType: string; correct: boolean; timestamp: Date }>;
}): number {
  const {
    taskType = 'general',
    taskCriticality = 'medium',
    aiConfidenceScore = 0.7,
    messageWasVerified = false,
    messageWasModified = false,
    userValidationHistory = [],
  } = options;

  // Map taskType to MR9's task types
  const taskTypeMapping: Record<string, any> = {
    'coding': 'coding',
    'code': 'coding',
    'programming': 'coding',
    'writing': 'writing',
    'text': 'writing',
    'analysis': 'analysis',
    'research': 'research',
    'design': 'design',
    'creative': 'creative',
    'planning': 'planning',
    'review': 'review',
    'general': 'analysis', // Default to analysis
  };

  const mappedTaskType = taskTypeMapping[taskType.toLowerCase()] || 'analysis';

  const profile = calculateTrustScore({
    taskType: mappedTaskType,
    aiConfidenceScore,
    taskCriticality,
    taskFamiliarity: 'moderate',
    timePressure: 'medium',
    userValidationHistory,
  });

  // Adjust based on verification status
  let adjustedScore = profile.score;
  if (messageWasVerified) {
    adjustedScore = Math.min(100, adjustedScore + 10); // Boost if verified
  }
  if (messageWasModified) {
    adjustedScore = Math.max(0, adjustedScore - 5); // Slight penalty if modified
  }

  return adjustedScore;
}

/**
 * Get top N recommendations by urgency
 */
export function getTopRecommendations(
  recommendations: MRRecommendation[],
  count: number = 3
): MRRecommendation[] {
  return recommendations
    .sort((a, b) => b.urgency - a.urgency)
    .slice(0, count);
}

/**
 * Check if a specific MR tool should be shown based on orchestration result
 */
export function shouldShowMRTool(
  tool: MRToolType,
  orchestrationResult: OrchestrationResult,
  minUrgency: number = 50
): boolean {
  const recommendation = orchestrationResult.recommendations.find(r => r.tool === tool);
  return recommendation ? recommendation.urgency >= minUrgency : false;
}

/**
 * Generate intervention message for user
 */
export function generateInterventionMessage(orchestrationResult: OrchestrationResult): string {
  const { trustLevel, recommendations, interventionStyle } = orchestrationResult;

  if (recommendations.length === 0) {
    return 'No specific interventions recommended';
  }

  const topRecommendation = recommendations[0];

  if (interventionStyle === 'aggressive') {
    return `⚠️ Verification strongly recommended: ${topRecommendation.reason}`;
  } else if (interventionStyle === 'balanced') {
    return `💡 Consider: ${topRecommendation.reason}`;
  } else {
    return `✨ Optional: ${topRecommendation.reason}`;
  }
}

export default {
  getTrustLevel,
  orchestrateMRActivation,
  calculateMessageTrustScore,
  getTopRecommendations,
  shouldShowMRTool,
  generateInterventionMessage,
};
