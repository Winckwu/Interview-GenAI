/**
 * MR9: Dynamic Trust Calibration - Utilities
 *
 * Functions for:
 * - Calculating context-aware trust scores
 * - Assessing risk levels
 * - Recommending verification strategies
 * - Tracking historical accuracy by task type
 * - Learning from user validation patterns
 */

export type TaskType = 'coding' | 'writing' | 'analysis' | 'creative' | 'research' | 'design' | 'planning' | 'review';
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';
export type CriticalityLevel = 'low' | 'medium' | 'high';
export type FamiliarityLevel = 'familiar' | 'moderate' | 'unfamiliar';
export type TimePressureLevel = 'low' | 'medium' | 'high';

/**
 * Trust calculation factors
 */
export interface TrustFactors {
  taskTypeFactor: number; // 0-100
  taskTypeBaseScore: number; // 0-100
  criticalityAdjustment: number; // -40 to +20
  aiConfidenceFactor: number; // 0-30
  userHistoryFactor: number; // -20 to +20
}

/**
 * Complete trust profile
 */
export interface TrustProfile {
  score: number; // 0-100, final trust score
  factors: TrustFactors;
  confidence: number; // 0-1, how confident we are in this score
  reasoning: string;
}

/**
 * Verification strategy recommendation
 */
export interface VerificationStrategy {
  primaryCheck: string;
  secondaryChecks: string[];
  redFlags: string[];
  estimatedTime: string;
  tools: string[];
}

/**
 * Task type accuracy tracking
 */
export interface TaskTypeAccuracy {
  taskType: TaskType;
  accuracy: number; // 0-1
  samplesValidated: number;
  trend?: {
    direction: 'up' | 'down' | 'stable';
    percentageChange: number;
  };
}

/**
 * Base trust scores by task type (from research)
 * Lower = higher verification needed
 */
const TASK_TYPE_TRUST_MAP: Record<TaskType, number> = {
  'coding': 75,        // Code syntax is verifiable
  'writing': 65,       // Subject to interpretation
  'analysis': 55,      // Requires domain knowledge
  'creative': 50,      // Highly subjective
  'research': 40,      // May miss sources or have errors
  'design': 60,        // Visual feedback helps
  'planning': 70,      // Can be verified against goals
  'review': 80,        // Mostly factual/verifiable
};

/**
 * Criticality adjustment factors
 * More critical = lower trust threshold (require more verification)
 */
const CRITICALITY_ADJUSTMENT: Record<CriticalityLevel, number> = {
  'low': 5,      // Low stakes, can trust more
  'medium': 0,   // Neutral
  'high': -15,   // High stakes, require more verification
};

/**
 * Familiarity boost/penalty
 * More familiar domain = higher trust (user can spot errors)
 */
const FAMILIARITY_ADJUSTMENT: Record<FamiliarityLevel, number> = {
  'familiar': 10,     // User knows domain, can verify
  'moderate': 0,      // Neutral
  'unfamiliar': -10,  // User less likely to spot errors
};

/**
 * Time pressure adjustment
 * More pressure = lower trust (can't verify thoroughly)
 */
const TIME_PRESSURE_ADJUSTMENT: Record<TimePressureLevel, number> = {
  'low': 0,      // Neutral
  'medium': -5,  // Can verify most things
  'high': -15,   // Limited time for verification
};

/**
 * Red flags by task type
 */
const RED_FLAGS_BY_TYPE: Record<TaskType, string[]> = {
  'coding': [
    'Syntax errors in examples',
    'Missing error handling',
    'Potential security vulnerabilities',
    'Performance issues on large inputs',
  ],
  'writing': [
    'Grammatical inconsistencies',
    'Tone changes mid-text',
    'Factual inaccuracies',
    'Plagiarism risks',
  ],
  'analysis': [
    'Missing data sources',
    'Biased interpretations',
    'Correlation vs causation confusion',
    'Cherry-picked data',
  ],
  'creative': [
    'Generic or clichéd content',
    'Inconsistent creative direction',
    'Plagiarism from training data',
    'Lack of originality',
  ],
  'research': [
    'Outdated citations (>2 years)',
    'Missing recent breakthroughs',
    'Incorrect source attribution',
    'Limited source diversity',
  ],
  'design': [
    'Accessibility issues',
    'Inconsistent styling',
    'Poor contrast ratios',
    'Responsive design failures',
  ],
  'planning': [
    'Unrealistic timelines',
    'Missing dependencies',
    'Resource conflicts',
    'Scope creep risks',
  ],
  'review': [
    'Missed obvious errors',
    'Inconsistent feedback',
    'Tone issues',
    'Missing context',
  ],
};

/**
 * Verification strategies by task type
 */
const VERIFICATION_STRATEGIES: Record<TaskType, Omit<VerificationStrategy, 'estimatedTime'>> = {
  'coding': {
    primaryCheck: 'Test the code in your environment',
    secondaryChecks: [
      'Check for edge cases and error handling',
      'Review security implications',
      'Verify performance on realistic data',
    ],
    redFlags: RED_FLAGS_BY_TYPE['coding'],
    tools: ['Compiler/Linter', 'Unit Tests', 'Code Review Tools'],
  },
  'writing': {
    primaryCheck: 'Read aloud for flow and clarity',
    secondaryChecks: [
      'Check for plagiarism',
      'Verify tone consistency',
      'Fact-check claims',
    ],
    redFlags: RED_FLAGS_BY_TYPE['writing'],
    tools: ['Plagiarism Checker', 'Grammar Checker', 'Fact Checker'],
  },
  'analysis': {
    primaryCheck: 'Verify data sources independently',
    secondaryChecks: [
      'Check statistical calculations',
      'Validate assumptions',
      'Cross-reference conclusions',
    ],
    redFlags: RED_FLAGS_BY_TYPE['analysis'],
    tools: ['Data Verification Tools', 'Statistical Software', 'Domain Resources'],
  },
  'creative': {
    primaryCheck: 'Evaluate originality and fit',
    secondaryChecks: [
      'Check for plagiarism',
      'Assess consistency',
      'Test with target audience feedback',
    ],
    redFlags: RED_FLAGS_BY_TYPE['creative'],
    tools: ['Plagiarism Detector', 'Style Analyzer', 'A/B Testing'],
  },
  'research': {
    primaryCheck: 'Verify all citations in original sources',
    secondaryChecks: [
      'Check publication dates',
      'Verify author credentials',
      'Cross-reference with recent surveys',
    ],
    redFlags: RED_FLAGS_BY_TYPE['research'],
    tools: ['Academic Databases', 'Citation Managers', 'Literature Review Tools'],
  },
  'design': {
    primaryCheck: 'Test with actual users/devices',
    secondaryChecks: [
      'Check accessibility (WCAG AA)',
      'Verify responsive design',
      'Validate color contrast',
    ],
    redFlags: RED_FLAGS_BY_TYPE['design'],
    tools: ['Browser Testing', 'Accessibility Checker', 'Device Emulator'],
  },
  'planning': {
    primaryCheck: 'Review timelines and dependencies',
    secondaryChecks: [
      'Identify resource conflicts',
      'Check for missing steps',
      'Validate with stakeholders',
    ],
    redFlags: RED_FLAGS_BY_TYPE['planning'],
    tools: ['Gantt Charts', 'Dependency Analyzer', 'Resource Planner'],
  },
  'review': {
    primaryCheck: 'Compare against criteria or standards',
    secondaryChecks: [
      'Check for missed issues',
      'Verify completeness',
      'Validate consistency',
    ],
    redFlags: RED_FLAGS_BY_TYPE['review'],
    tools: ['Checklist Tools', 'Comparison Tools', 'Documentation'],
  },
};

/**
 * Main function: Calculate trust score based on task context
 */
export function calculateTrustScore(options: {
  taskType: TaskType;
  aiConfidenceScore: number; // 0-1
  taskCriticality: CriticalityLevel;
  taskFamiliarity: FamiliarityLevel;
  timePressure: TimePressureLevel;
  userValidationHistory?: Array<{ taskType: string; correct: boolean; timestamp: Date }>;
}): TrustProfile {
  const {
    taskType,
    aiConfidenceScore,
    taskCriticality,
    taskFamiliarity,
    timePressure,
    userValidationHistory = [],
  } = options;

  // 1. Task type base score
  const taskTypeBaseScore = TASK_TYPE_TRUST_MAP[taskType];
  const taskTypeFactor = Math.min(taskTypeBaseScore, 100);

  // 2. Criticality adjustment
  const criticalityAdjustment = CRITICALITY_ADJUSTMENT[taskCriticality];

  // 3. AI confidence factor (max 30 points)
  const aiConfidenceFactor = Math.min(aiConfidenceScore * 30, 30);

  // 4. User history factor (based on their accuracy on this task type)
  let userHistoryFactor = 0;
  if (userValidationHistory.length > 0) {
    const taskValidations = userValidationHistory.filter(v => v.taskType === taskType);
    if (taskValidations.length > 0) {
      const accuracy = taskValidations.filter(v => v.correct).length / taskValidations.length;
      // User's accuracy influences score: accurate history = +20, inaccurate = -20
      userHistoryFactor = (accuracy - 0.5) * 40;
    }
  }

  // 5. Combine factors
  let score = taskTypeFactor + criticalityAdjustment + aiConfidenceFactor + userHistoryFactor;
  score = Math.max(0, Math.min(100, score)); // Clamp 0-100

  // 6. Confidence in the score (how sure are we?)
  let confidence = 0.6; // Base confidence
  if (userValidationHistory.length > 5) confidence += 0.2; // More data = more confident
  if (Math.abs(aiConfidenceScore - score / 100) < 0.2) confidence += 0.1; // Score alignment
  confidence = Math.min(confidence, 0.95);

  const reasoning = generateTrustReasoning({
    taskType,
    taskTypeBaseScore,
    criticalityAdjustment,
    aiConfidenceScore,
    userHistoryFactor,
  });

  return {
    score,
    factors: {
      taskTypeFactor,
      taskTypeBaseScore,
      criticalityAdjustment,
      aiConfidenceFactor,
      userHistoryFactor,
    },
    confidence,
    reasoning,
  };
}

/**
 * Generate human-readable reasoning for trust score
 */
function generateTrustReasoning(options: {
  taskType: TaskType;
  taskTypeBaseScore: number;
  criticalityAdjustment: number;
  aiConfidenceScore: number;
  userHistoryFactor: number;
}): string {
  const {
    taskType,
    taskTypeBaseScore,
    criticalityAdjustment,
    aiConfidenceScore,
    userHistoryFactor,
  } = options;

  const reasons: string[] = [];

  // Task type reasoning
  if (taskTypeBaseScore >= 75) {
    reasons.push(`${taskType} tasks are generally verifiable`);
  } else if (taskTypeBaseScore >= 55) {
    reasons.push(`${taskType} tasks require careful review`);
  } else {
    reasons.push(`${taskType} tasks need expert verification`);
  }

  // Criticality reasoning
  if (criticalityAdjustment < 0) {
    reasons.push('High stakes require cautious verification');
  } else if (criticalityAdjustment > 0) {
    reasons.push('Low stakes allow lighter verification');
  }

  // AI confidence reasoning
  if (aiConfidenceScore >= 0.8) {
    reasons.push('AI is quite confident in this output');
  } else if (aiConfidenceScore < 0.5) {
    reasons.push('AI has low confidence - verify carefully');
  }

  // User history reasoning
  if (userHistoryFactor > 0) {
    reasons.push('Your history shows strong accuracy on this type');
  } else if (userHistoryFactor < 0) {
    reasons.push('Previous errors on this type suggest caution');
  }

  return reasons.join('; ');
}

/**
 * Determine risk level based on trust profile and criticality
 */
export function getRiskLevel(trustProfile: TrustProfile, criticality: CriticalityLevel): RiskLevel {
  const { score } = trustProfile;

  // Risk is inverse of trust, adjusted by criticality
  if (criticality === 'high') {
    if (score >= 80) return 'low';
    if (score >= 60) return 'medium';
    if (score >= 40) return 'high';
    return 'critical';
  } else if (criticality === 'medium') {
    if (score >= 70) return 'low';
    if (score >= 50) return 'medium';
    if (score >= 30) return 'high';
    return 'critical';
  } else {
    // low criticality
    if (score >= 60) return 'low';
    if (score >= 40) return 'medium';
    return 'high';
  }
}

/**
 * Generate verification strategy recommendation
 */
export function getVerificationStrategy(options: {
  taskType: TaskType;
  trustScore: number;
  riskLevel: RiskLevel;
  taskCriticality: CriticalityLevel;
}): VerificationStrategy {
  const { taskType, trustScore, riskLevel, taskCriticality } = options;

  const baseStrategy = VERIFICATION_STRATEGIES[taskType];

  // Estimate verification time based on trust and criticality
  let estimatedTime = '5-10 min';
  if (trustScore >= 80) {
    estimatedTime = 'Quick spot-check (2-3 min)';
  } else if (trustScore >= 60) {
    estimatedTime = 'Thorough review (10-15 min)';
  } else if (trustScore >= 40) {
    estimatedTime = 'Detailed verification (20-30 min)';
  } else {
    estimatedTime = 'Expert review required (30+ min)';
  }

  if (taskCriticality === 'high') {
    estimatedTime = 'Expert review recommended (30+ min)';
  }

  return {
    ...baseStrategy,
    estimatedTime,
  };
}

/**
 * Generate historical accuracy data from user validations
 */
export function generateAccuracyHistory(
  validations: Array<{
    isCorrect: boolean;
    taskType: string;
    notes?: string;
    timestamp: Date;
  }>
): TaskTypeAccuracy[] {
  if (validations.length === 0) return [];

  // Group validations by task type
  const byTaskType = new Map<string, typeof validations>();
  validations.forEach(val => {
    if (!byTaskType.has(val.taskType)) {
      byTaskType.set(val.taskType, []);
    }
    byTaskType.get(val.taskType)!.push(val);
  });

  // Calculate accuracy for each type
  const results: TaskTypeAccuracy[] = [];

  byTaskType.forEach((vals, taskType) => {
    const correct = vals.filter(v => v.isCorrect).length;
    const accuracy = correct / vals.length;

    // Calculate trend (compare recent vs older)
    let trend: TaskTypeAccuracy['trend'] | undefined;
    if (vals.length >= 4) {
      const midpoint = Math.floor(vals.length / 2);
      const olderAccuracy = vals.slice(0, midpoint).filter(v => v.isCorrect).length / midpoint;
      const recentAccuracy =
        vals.slice(midpoint).filter(v => v.isCorrect).length / (vals.length - midpoint);
      const percentageChange = ((recentAccuracy - olderAccuracy) / olderAccuracy) * 100;

      if (Math.abs(percentageChange) < 5) {
        trend = { direction: 'stable', percentageChange };
      } else if (percentageChange > 0) {
        trend = { direction: 'up', percentageChange };
      } else {
        trend = { direction: 'down', percentageChange };
      }
    }

    results.push({
      taskType: taskType as TaskType,
      accuracy,
      samplesValidated: vals.length,
      trend,
    });
  });

  return results.sort((a, b) => b.accuracy - a.accuracy);
}

/**
 * Calculate confidence boost/penalty based on user's track record
 */
export function calculateUserHistoryFactor(
  validations: Array<{ taskType: string; correct: boolean; timestamp: Date }>,
  currentTaskType: string
): number {
  if (validations.length === 0) return 0;

  const taskValidations = validations.filter(v => v.taskType === currentTaskType);
  if (taskValidations.length === 0) return 0;

  const accuracy = taskValidations.filter(v => v.isCorrect).length / taskValidations.length;
  // Scale: 0% accuracy = -20, 50% = 0, 100% = +20
  return (accuracy - 0.5) * 40;
}

/**
 * Predict which output type user will find reliable
 */
export function getPersonalizedRecommendation(
  validations: Array<{ taskType: string; correct: boolean; timestamp: Date }>
): string {
  if (validations.length < 3) {
    return 'Build your accuracy profile by validating outputs';
  }

  const accuracy = generateAccuracyHistory(validations);
  const bestType = accuracy[0];
  const worstType = accuracy[accuracy.length - 1];

  return `You're most accurate with ${bestType.taskType} (${(bestType.accuracy * 100).toFixed(0)}%) and least with ${worstType.taskType} (${(worstType.accuracy * 100).toFixed(0)}%)`;
}

export default {
  calculateTrustScore,
  getRiskLevel,
  getVerificationStrategy,
  generateAccuracyHistory,
  calculateUserHistoryFactor,
  getPersonalizedRecommendation,
};
