/**
 * Global MR Recommendation Engine
 *
 * Intelligently recommends MR tool combinations based on:
 * - User context (task type, behavior patterns, skill level)
 * - Session state (messages, interactions, patterns)
 * - Historical usage (what worked before)
 * - Metacognitive profile (from MR19)
 * - Trust calibration (from MR9)
 *
 * This is the orchestration layer that ties all MR chains together
 * into a coherent, personalized experience.
 */

import { getTrustLevel, calculateMessageTrustScore } from './MROrchestrator';

export type MRToolId =
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
  | 'mr16-atrophy'
  | 'mr17-visualization'
  | 'mr18-warnings'
  | 'mr19-assessment';

export type UserExperienceLevel = 'novice' | 'intermediate' | 'advanced';
export type SessionPhase = 'starting' | 'active' | 'iterating' | 'completing';
export type BehaviorPattern = 'over-reliant' | 'cautious' | 'balanced' | 'experimental';

export interface UserContext {
  userId?: string;
  experienceLevel: UserExperienceLevel;
  taskType: string;
  taskCriticality: 'low' | 'medium' | 'high';
  sessionPhase: SessionPhase;
  messageCount: number;
  verifiedCount: number;
  modifiedCount: number;
  consecutiveUnverified: number;
  hasUsedMRTools: string[];
  metacognitiveProfile?: {
    planning: number;
    monitoring: number;
    evaluation: number;
    regulation: number;
  };
  behaviorPattern?: BehaviorPattern;
}

export interface MRRecommendationSet {
  id: string;
  name: string;
  description: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  tools: MRToolId[];
  toolNames: string[];
  rationale: string;
  expectedBenefit: string;
  icon: string;
  color: string;
  triggers: string[];
  estimatedTime: string;
}

/**
 * Analyze user context and determine behavior pattern
 */
export function analyzeBehaviorPattern(context: UserContext): BehaviorPattern {
  const { messageCount, verifiedCount, modifiedCount, consecutiveUnverified } = context;

  if (messageCount === 0) return 'balanced';

  const verificationRate = verifiedCount / messageCount;
  const modificationRate = modifiedCount / messageCount;

  // Over-reliant: Low verification, low modification, high consecutive unverified
  if (verificationRate < 0.2 && modificationRate < 0.1 && consecutiveUnverified >= 5) {
    return 'over-reliant';
  }

  // Cautious: High verification, high modification
  if (verificationRate > 0.7 || modificationRate > 0.5) {
    return 'cautious';
  }

  // Experimental: High modification, moderate verification
  if (modificationRate > 0.3 && verificationRate > 0.3) {
    return 'experimental';
  }

  return 'balanced';
}

/**
 * Determine session phase based on message count and activity
 */
export function determineSessionPhase(context: UserContext): SessionPhase {
  const { messageCount, modifiedCount } = context;

  if (messageCount === 0) return 'starting';
  if (messageCount <= 3) return 'starting';
  if (modifiedCount >= 2) return 'iterating';
  if (messageCount >= 10) return 'completing';
  return 'active';
}

/**
 * Generate MR recommendations based on comprehensive context analysis
 */
export function generateMRRecommendations(context: UserContext): MRRecommendationSet[] {
  const recommendations: MRRecommendationSet[] = [];
  const behaviorPattern = analyzeBehaviorPattern(context);
  const sessionPhase = determineSessionPhase(context);

  // ================================================================
  // CRITICAL PRIORITY: Address immediate risks
  // ================================================================

  // Over-reliance detected - Critical intervention needed
  if (behaviorPattern === 'over-reliant') {
    recommendations.push({
      id: 'critical-overreliance',
      name: 'Critical: Build Verification Habits',
      description: 'You\'re accepting AI outputs without verification - this is risky!',
      priority: 'critical',
      tools: ['mr11-verify', 'mr12-critical', 'mr9-trust', 'mr14-reflection'],
      toolNames: ['Verification', 'Critical Thinking', 'Trust Calibration', 'Reflection'],
      rationale: 'Low verification rate detected. Build safer AI collaboration habits.',
      expectedBenefit: 'Reduce errors, develop critical evaluation skills',
      icon: '🚨',
      color: '#ef4444',
      triggers: ['Low verification rate', 'High consecutive unverified'],
      estimatedTime: '10-15 min',
    });
  }

  // ================================================================
  // HIGH PRIORITY: Session-specific recommendations
  // ================================================================

  // Starting phase - Task setup chain
  if (sessionPhase === 'starting' && !context.hasUsedMRTools.includes('mr1-decomposition')) {
    recommendations.push({
      id: 'startup-chain',
      name: 'Task Startup Chain',
      description: 'Decompose task → Define roles → Analyze characteristics',
      priority: 'high',
      tools: ['mr1-decomposition', 'mr4-roles', 'mr8-recognition'],
      toolNames: ['Task Decomposition', 'Role Definition', 'Task Recognition'],
      rationale: 'New session detected. Proper planning prevents confusion later.',
      expectedBenefit: 'Clear structure, appropriate AI collaboration mode',
      icon: '🎯',
      color: '#3b82f6',
      triggers: ['Session start', 'No MR tools used yet'],
      estimatedTime: '5-8 min',
    });
  }

  // Iterating phase - Iteration & comparison chain
  if (sessionPhase === 'iterating' || context.modifiedCount >= 2) {
    recommendations.push({
      id: 'iteration-chain',
      name: 'Iteration & Comparison Chain',
      description: 'Explore variants → Compare AI models → Learn from differences',
      priority: 'high',
      tools: ['mr5-iteration', 'mr6-models', 'mr2-transparency'],
      toolNames: ['Low-Cost Iteration', 'Model Comparison', 'Process Transparency'],
      rationale: 'Multiple modifications detected. Systematic iteration is more efficient.',
      expectedBenefit: 'Find best solution faster, understand model strengths',
      icon: '🔄',
      color: '#f59e0b',
      triggers: ['Multiple modifications', 'Iterating phase'],
      estimatedTime: '10-12 min',
    });
  }

  // ================================================================
  // MEDIUM PRIORITY: Skill development & learning
  // ================================================================

  // Learning & Skill Monitoring Triangle
  if (
    context.experienceLevel !== 'novice' &&
    !context.hasUsedMRTools.includes('mr19-assessment')
  ) {
    recommendations.push({
      id: 'learning-triangle',
      name: 'Learning & Skill Development Triangle',
      description: 'Monitor skills → Visualize progress → Assess capabilities',
      priority: 'medium',
      tools: ['mr16-atrophy', 'mr17-visualization', 'mr19-assessment'],
      toolNames: ['Skill Monitoring', 'Learning Visualization', 'Capability Assessment'],
      rationale: 'Build long-term AI collaboration excellence through self-awareness.',
      expectedBenefit: 'Prevent skill decay, understand your strengths',
      icon: '📊',
      color: '#8b5cf6',
      triggers: ['Intermediate+ user', 'No assessment yet'],
      estimatedTime: '15-20 min',
    });
  }

  // Reflection & Strategy Chain
  if (
    context.messageCount >= 5 &&
    !context.hasUsedMRTools.includes('mr14-reflection') &&
    behaviorPattern !== 'over-reliant'
  ) {
    recommendations.push({
      id: 'reflection-chain',
      name: 'Reflection & Strategy Chain',
      description: 'Reflect on interactions → Learn strategies → Assess capabilities',
      priority: 'medium',
      tools: ['mr14-reflection', 'mr15-strategies', 'mr19-assessment'],
      toolNames: ['Guided Reflection', 'Strategy Guide', 'Capability Assessment'],
      rationale: 'Develop metacognitive awareness for better AI collaboration.',
      expectedBenefit: 'Deeper understanding, strategic thinking',
      icon: '💭',
      color: '#10b981',
      triggers: ['Multiple interactions', 'No reflection yet'],
      estimatedTime: '12-15 min',
    });
  }

  // ================================================================
  // LOW PRIORITY: Optional enhancements
  // ================================================================

  // Cautious users - Reduce verification overhead
  if (behaviorPattern === 'cautious') {
    recommendations.push({
      id: 'trust-calibration',
      name: 'Trust Calibration & Efficiency',
      description: 'Calibrate trust → Streamline verification → Cost-benefit analysis',
      priority: 'low',
      tools: ['mr9-trust', 'mr10-cost', 'mr3-agency'],
      toolNames: ['Trust Calibration', 'Cost-Benefit', 'Agency Control'],
      rationale: 'You\'re very cautious. Learn when to trust AI to save time.',
      expectedBenefit: 'Work faster without sacrificing quality',
      icon: '⚡',
      color: '#06b6d4',
      triggers: ['High verification rate', 'Cautious pattern'],
      estimatedTime: '8-10 min',
    });
  }

  // Experimental users - Learn from failures
  if (behaviorPattern === 'experimental' && !context.hasUsedMRTools.includes('mr7-failure')) {
    recommendations.push({
      id: 'experimental-learning',
      name: 'Experimental Learning Tools',
      description: 'Learn from failures → Iterate systematically → Track improvements',
      priority: 'low',
      tools: ['mr7-failure', 'mr5-iteration', 'mr17-visualization'],
      toolNames: ['Failure Learning', 'Iteration', 'Learning Visualization'],
      rationale: 'You experiment a lot. Systematically track what works.',
      expectedBenefit: 'Learn faster from experiments',
      icon: '🧪',
      color: '#ec4899',
      triggers: ['High modification rate', 'Experimental pattern'],
      estimatedTime: '10-12 min',
    });
  }

  // ================================================================
  // CONTEXT-SPECIFIC: Task type recommendations
  // ================================================================

  // High criticality tasks - Extra verification
  if (context.taskCriticality === 'high' && !context.hasUsedMRTools.includes('mr11-verify')) {
    recommendations.push({
      id: 'high-stakes-verification',
      name: 'High-Stakes Verification Suite',
      description: 'Comprehensive verification for critical tasks',
      priority: 'high',
      tools: ['mr11-verify', 'mr12-critical', 'mr13-uncertainty', 'mr6-models'],
      toolNames: ['Verification', 'Critical Thinking', 'Uncertainty', 'Model Comparison'],
      rationale: 'High-stakes task detected. Multiple verification layers recommended.',
      expectedBenefit: 'Minimize errors in critical work',
      icon: '🔍',
      color: '#dc2626',
      triggers: ['High criticality', 'No verification tools used'],
      estimatedTime: '15-20 min',
    });
  }

  return recommendations.sort((a, b) => {
    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });
}

/**
 * Get a quick recommendation for immediate action
 */
export function getQuickRecommendation(context: UserContext): MRRecommendationSet | null {
  const recommendations = generateMRRecommendations(context);
  if (recommendations.length === 0) return null;

  // Return highest priority recommendation
  return recommendations[0];
}

/**
 * Check if a specific MR chain should be recommended
 */
export function shouldRecommendChain(
  chainId: string,
  context: UserContext
): boolean {
  const recommendations = generateMRRecommendations(context);
  return recommendations.some(rec => rec.id === chainId);
}

/**
 * Get completion status for recommended chains
 */
export function getChainCompletionStatus(
  recommendations: MRRecommendationSet[],
  usedTools: string[]
): Record<string, { total: number; completed: number; percentage: number }> {
  const status: Record<string, any> = {};

  recommendations.forEach(rec => {
    const completed = rec.tools.filter(tool => usedTools.includes(tool)).length;
    status[rec.id] = {
      total: rec.tools.length,
      completed,
      percentage: Math.round((completed / rec.tools.length) * 100),
    };
  });

  return status;
}

/**
 * Generate personalized welcome message with recommendations
 */
export function generateWelcomeMessage(context: UserContext): string {
  const quickRec = getQuickRecommendation(context);

  if (!quickRec) {
    return 'Welcome! Start chatting with AI and I\'ll recommend helpful tools as you go.';
  }

  if (quickRec.priority === 'critical') {
    return `⚠️ Important: ${quickRec.description} I recommend starting with verification tools to build safer habits.`;
  }

  if (quickRec.priority === 'high') {
    return `💡 Tip: ${quickRec.description} This will help you ${quickRec.expectedBenefit.toLowerCase()}.`;
  }

  return `✨ Ready to collaborate! When you're ready, explore ${quickRec.name} to ${quickRec.expectedBenefit.toLowerCase()}.`;
}

export default {
  analyzeBehaviorPattern,
  determineSessionPhase,
  generateMRRecommendations,
  getQuickRecommendation,
  shouldRecommendChain,
  getChainCompletionStatus,
  generateWelcomeMessage,
};
