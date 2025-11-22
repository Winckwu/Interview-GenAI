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

import { calculateTrustScore, TrustProfile } from '../components/mr/MR9DynamicTrustCalibration/utils';
import {
  UserProfile,
  TriggerContext,
  getMRRecommendations,
  createDefaultUserProfile,
  createDefaultTriggerContext,
  classifyUserPattern,
} from './MRAdaptiveTrigger';

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
 * Enhanced rule-based confidence analysis
 * Quick initial screening with more comprehensive factors
 */
function analyzeMessageConfidence(content: string): { score: number; needsDeepAnalysis: boolean } {
  if (!content || content.length < 10) return { score: 0.5, needsDeepAnalysis: false };

  let score = 0.7; // Base score
  let uncertaintySignals = 0;

  // 1. Uncertainty indicators (reduce confidence)
  const uncertaintyPatterns = [
    // English
    /\b(might|maybe|perhaps|possibly|could be|may be)\b/gi,
    /\b(not sure|uncertain|unsure|unclear)\b/gi,
    /\b(I think|I believe|I guess|I suppose|it seems|appears to)\b/gi,
    /\b(probably|likely|unlikely|potentially)\b/gi,
    /\b(in my opinion|from my perspective)\b/gi,
    // Chinese
    /(可能|也许|或许|大概|不确定|不太确定)/g,
    /(我认为|我觉得|我想|似乎|好像|应该是)/g,
    /(据我所知|如果我没记错)/g,
  ];
  uncertaintyPatterns.forEach(pattern => {
    const matches = content.match(pattern);
    if (matches) {
      uncertaintySignals += matches.length;
      score -= matches.length * 0.025;
    }
  });

  // 2. Confidence indicators (increase confidence)
  const confidencePatterns = [
    /\b(definitely|certainly|clearly|obviously|absolutely)\b/gi,
    /\b(must|always|never|specifically|exactly|precisely)\b/gi,
    /\b(is|are|will|does)\b(?!\s*(not|n't))/gi, // Declarative statements
    /(一定|确定|肯定|明确|显然|必须|就是|正是)/g,
  ];
  confidencePatterns.forEach(pattern => {
    const matches = content.match(pattern);
    if (matches) score += Math.min(matches.length * 0.015, 0.06);
  });

  // 3. Structure quality (organized = higher confidence)
  const hasNumberedList = /^\s*\d+[.)]\s/m.test(content);
  const hasBulletList = /^\s*[-*•]\s/m.test(content);
  const hasHeaders = /^#{1,3}\s|^\*\*[^*]+\*\*:/m.test(content);
  const hasCodeBlocks = /```[\s\S]*?```/.test(content);
  const hasTables = /\|.*\|.*\|/m.test(content);

  if (hasNumberedList) score += 0.04;
  if (hasBulletList) score += 0.03;
  if (hasHeaders) score += 0.03;
  if (hasCodeBlocks) score += 0.05;
  if (hasTables) score += 0.04;

  // 4. Evidence of specificity (concrete details = higher confidence)
  const hasNumbers = /\d+(\.\d+)?(%|个|次|年|月|日|元|美元|\$|GB|MB|KB)/.test(content);
  const hasUrls = /https?:\/\/\S+/.test(content);
  const hasQuotes = /"[^"]{10,}"/.test(content);

  if (hasNumbers) score += 0.03;
  if (hasUrls) score += 0.02;
  if (hasQuotes) score += 0.02;

  // 5. Question marks (asking questions = less confident in providing answer)
  const questionCount = (content.match(/\?/g) || []).length;
  if (questionCount > 2) score -= 0.03;

  // 6. Hedging phrases (reduce confidence)
  const hedgingPhrases = [
    /to some extent/gi, /in general/gi, /for the most part/gi,
    /it depends/gi, /that said/gi, /however/gi,
    /在一定程度上/g, /一般来说/g, /通常情况下/g,
  ];
  hedgingPhrases.forEach(pattern => {
    if (pattern.test(content)) score -= 0.02;
  });

  // 7. Length factor
  const length = content.length;
  if (length < 50) score -= 0.12;
  else if (length < 100) score -= 0.08;
  else if (length > 200 && length < 2000) score += 0.04;
  else if (length > 4000) score -= 0.02;

  // Determine if needs GPT deep analysis
  const needsDeepAnalysis =
    (length > 500 && uncertaintySignals >= 2) || // Long message with uncertainty
    (score >= 0.55 && score <= 0.75) || // Ambiguous middle range
    (uncertaintySignals >= 3); // High uncertainty

  // Clamp to valid range
  return {
    score: Math.max(0.25, Math.min(0.95, score)),
    needsDeepAnalysis
  };
}

// Cache for GPT analysis results
const gptAnalysisCache = new Map<string, number>();

/**
 * GPT-powered deep confidence analysis
 * Called for important/ambiguous messages
 */
export async function analyzeWithGPT(content: string, api: any): Promise<number> {
  // Check cache first (use content hash as key)
  const cacheKey = content.slice(0, 200);
  if (gptAnalysisCache.has(cacheKey)) {
    return gptAnalysisCache.get(cacheKey)!;
  }

  try {
    const response = await api.post('/ai/chat', {
      userPrompt: `Analyze the confidence level of this AI response. Return ONLY a number between 30-95.

Consider:
- Certainty of statements (hedging words reduce score)
- Specificity of information (concrete details increase score)
- Structure and organization
- Whether claims are supported

Content (first 800 chars):
"${content.slice(0, 800)}"

Return only the number:`,
      conversationHistory: [],
    });

    const scoreStr = response.data?.data?.response?.content?.trim();
    const score = parseInt(scoreStr);

    if (!isNaN(score) && score >= 0 && score <= 100) {
      const normalizedScore = Math.max(30, Math.min(95, score));
      gptAnalysisCache.set(cacheKey, normalizedScore);
      return normalizedScore;
    }
  } catch (err) {
    console.error('GPT analysis failed:', err);
  }

  return 70; // Fallback
}

/**
 * Hybrid confidence analysis
 * Rule-based quick scan + optional GPT deep analysis
 */
export function analyzeMessageConfidenceHybrid(
  content: string
): { score: number; needsDeepAnalysis: boolean; method: 'rule' | 'gpt' } {
  const ruleResult = analyzeMessageConfidence(content);
  return {
    ...ruleResult,
    method: 'rule',
  };
}

/**
 * Calculate trust score from message context
 * Uses real message content analysis for confidence scoring
 * Returns score and whether GPT deep analysis is recommended
 */
export function calculateMessageTrustScore(options: {
  taskType?: string;
  taskCriticality?: 'low' | 'medium' | 'high';
  aiConfidenceScore?: number;
  messageContent?: string;
  messageWasVerified?: boolean;
  messageWasModified?: boolean;
  userValidationHistory?: Array<{ taskType: string; correct: boolean; timestamp: Date }>;
}): { score: number; needsDeepAnalysis: boolean } {
  const {
    taskType = 'general',
    taskCriticality = 'medium',
    aiConfidenceScore,
    messageContent = '',
    messageWasVerified = false,
    messageWasModified = false,
    userValidationHistory = [],
  } = options;

  // Use real content analysis if available, otherwise fall back to provided score
  const analysis = messageContent
    ? analyzeMessageConfidence(messageContent)
    : { score: aiConfidenceScore ?? 0.7, needsDeepAnalysis: false };

  const realConfidence = analysis.score;

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
    aiConfidenceScore: realConfidence,
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

  return {
    score: adjustedScore,
    needsDeepAnalysis: analysis.needsDeepAnalysis,
  };
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

// ============================================================
// Adaptive Orchestration (Evidence-Based)
// ============================================================

export type { UserProfile, TriggerContext };
export { createDefaultUserProfile, createDefaultTriggerContext, classifyUserPattern };

/**
 * Enhanced orchestration result with adaptive triggering
 */
export interface AdaptiveOrchestrationResult extends OrchestrationResult {
  userPattern: string;
  adaptiveRecommendations: Array<{
    tool: MRToolType;
    priority: number;
    reason: string;
    category: string;
  }>;
}

/**
 * Adaptive MR orchestration using evidence-based triggering framework
 *
 * This function combines:
 * 1. Trust-based orchestration (existing logic)
 * 2. Pattern-aware adaptive triggering (new evidence-based logic)
 */
export function orchestrateMRActivationAdaptive(
  context: OrchestrationContext,
  userProfile: UserProfile,
  triggerContext: TriggerContext
): AdaptiveOrchestrationResult {
  // Get base orchestration result
  const baseResult = orchestrateMRActivation(context);

  // Get adaptive recommendations
  const adaptiveRecs = getMRRecommendations(userProfile, triggerContext, 3);

  // Merge recommendations: adaptive takes priority, fill with base if needed
  const mergedRecommendations: MRRecommendation[] = [];
  const usedTools = new Set<MRToolType>();

  // First, add adaptive recommendations (they're evidence-based)
  for (const rec of adaptiveRecs) {
    if (!usedTools.has(rec.tool)) {
      mergedRecommendations.push({
        tool: rec.tool,
        toolName: getToolName(rec.tool),
        priority: rec.result.priority >= 70 ? 'high' : rec.result.priority >= 50 ? 'medium' : 'low',
        reason: rec.result.reason,
        icon: getToolIcon(rec.tool),
        urgency: rec.result.priority,
      });
      usedTools.add(rec.tool);
    }
  }

  // Then, fill with base recommendations if we have room
  for (const rec of baseResult.recommendations) {
    if (mergedRecommendations.length >= 5) break;
    if (!usedTools.has(rec.tool)) {
      mergedRecommendations.push(rec);
      usedTools.add(rec.tool);
    }
  }

  // Sort by urgency
  mergedRecommendations.sort((a, b) => b.urgency - a.urgency);

  return {
    ...baseResult,
    recommendations: mergedRecommendations,
    userPattern: userProfile.pattern,
    adaptiveRecommendations: adaptiveRecs.map(r => ({
      tool: r.tool,
      priority: r.result.priority,
      reason: r.result.reason,
      category: r.result.category,
    })),
  };
}

/**
 * Get display name for MR tool
 */
function getToolName(tool: MRToolType): string {
  const names: Record<MRToolType, string> = {
    'mr1-decomposition': 'Task Decomposition',
    'mr2-transparency': 'Process Transparency',
    'mr3-agency': 'User Agency',
    'mr4-roles': 'Role Definition',
    'mr5-iteration': 'Low-Cost Iteration',
    'mr6-models': 'Cross-Model Comparison',
    'mr7-failure': 'Failure Tolerance',
    'mr8-recognition': 'Task Recognition',
    'mr9-trust': 'Trust Calibration',
    'mr10-cost': 'Cost-Benefit Analysis',
    'mr11-verify': 'Integrated Verification',
    'mr12-critical': 'Critical Thinking',
    'mr13-uncertainty': 'Transparent Uncertainty',
    'mr14-reflection': 'Guided Reflection',
    'mr15-strategies': 'Metacognitive Strategies',
    'mr16-warnings': 'Risk Warning',
    'mr17-metrics': 'Progress Metrics',
    'mr18-warnings': 'Over-Reliance Warning',
    'mr19-assessment': 'Self-Assessment',
  };
  return names[tool] || tool;
}

/**
 * Get icon for MR tool
 */
function getToolIcon(tool: MRToolType): string {
  const icons: Record<MRToolType, string> = {
    'mr1-decomposition': '🧩',
    'mr2-transparency': '👁️',
    'mr3-agency': '🎯',
    'mr4-roles': '🎭',
    'mr5-iteration': '🌳',
    'mr6-models': '🔄',
    'mr7-failure': '💡',
    'mr8-recognition': '🔍',
    'mr9-trust': '⚖️',
    'mr10-cost': '💰',
    'mr11-verify': '✅',
    'mr12-critical': '🧠',
    'mr13-uncertainty': '⚠️',
    'mr14-reflection': '💭',
    'mr15-strategies': '📚',
    'mr16-warnings': '🚨',
    'mr17-metrics': '📊',
    'mr18-warnings': '⚡',
    'mr19-assessment': '📋',
  };
  return icons[tool] || '📌';
}

/**
 * Build trigger context from message and session data
 */
export function buildTriggerContext(
  message: { content: string; wasModified?: boolean },
  sessionData: {
    taskType?: string;
    taskImportance?: number;
    messageIndex: number;
    sessionDuration: number;
    consecutiveUnverified: number;
    iterationCount?: number;
  },
  trustScore: number,
  previousMRsShown: Set<MRToolType> = new Set()
): TriggerContext {
  const content = message.content;

  // Analyze message features
  const containsCode = /```[\s\S]*?```|`[^`]+`/.test(content);
  const containsDecisions = /should|recommend|suggest|决定|建议|应该/.test(content);
  const uncertaintyIndicators = (content.match(/might|maybe|perhaps|possibly|可能|也许|或许/gi) || []).length;
  const hasControversialClaim = /controversial|debatable|disputed|争议|有争议/.test(content);

  return {
    taskType: sessionData.taskType || 'general',
    taskCriticality: sessionData.taskImportance === 3 ? 'high' : sessionData.taskImportance === 2 ? 'medium' : 'low',
    taskComplexity: content.length > 2000 ? 'high' : content.length > 500 ? 'medium' : 'low',
    isNewTaskType: sessionData.messageIndex === 0,
    messageLength: content.length,
    containsCode,
    containsDecisions,
    uncertaintyIndicators,
    hasControversialClaim,
    trustScore,
    consecutiveUnverified: sessionData.consecutiveUnverified,
    messageIndex: sessionData.messageIndex,
    sessionDuration: sessionData.sessionDuration,
    iterationCount: sessionData.iterationCount || 0,
    messageWasModified: message.wasModified || false,
    hasFailedBefore: false, // Would need to track this
    previousMRsShown,
    recentTrustChange: 0, // Would need to calculate from history
  };
}

export default {
  getTrustLevel,
  orchestrateMRActivation,
  orchestrateMRActivationAdaptive,
  calculateMessageTrustScore,
  getTopRecommendations,
  shouldShowMRTool,
  generateInterventionMessage,
  buildTriggerContext,
  createDefaultUserProfile,
  createDefaultTriggerContext,
  classifyUserPattern,
};
