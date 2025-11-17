/**
 * MR10: Cost-Benefit Decision Support - Utilities
 *
 * Help users make explicit ROI calculations between using AI vs doing tasks
 * manually. Support Pattern C users who strategically delegate specific subtasks.
 */

export type TaskRiskLevel = 'low' | 'medium' | 'high';
export type TaskDeadline = 'tight' | 'moderate' | 'relaxed';
export type TaskType = 'learning' | 'production' | 'exploration' | 'problem-solving';
export type AIUsageDecision = 'use-ai' | 'do-manually' | 'hybrid';

export interface CostBenefitAnalysis {
  taskDescription: string;
  taskType: TaskType;
  deadline: TaskDeadline;
  riskLevel: TaskRiskLevel;

  // Time analysis
  manualTimeMinutes: number;
  aiAssistedTimeMinutes: number;
  timeSavingsPercent: number;

  // Quality analysis
  qualityRisk: string;
  verificationEffortMinutes: number;

  // Learning analysis
  learningBenefit: string;
  skillsDeveloped: string[];

  // Overall recommendation
  recommendation: AIUsageDecision;
  recommendationReason: string;

  // Warnings (if any)
  warnings: string[];

  // Decision strategy
  suggestedStrategy: string[];
}

export interface DecisionLog {
  id: string;
  taskDescription: string;
  analysis: CostBenefitAnalysis;
  userDecision: AIUsageDecision;
  decisionReasoning: string;
  timestamp: Date;

  // Post-reflection
  actualOutcome?: {
    timeTakenMinutes: number;
    qualityAssessment: 'below-expected' | 'as-expected' | 'above-expected';
    benefitAssessment: string;
    lessonsLearned: string;
  };
}

// Task profile definitions
const TASK_TIME_PROFILES: Record<string, { manual: number; aiAssisted: number }> = {
  'code-review': { manual: 45, aiAssisted: 15 },
  'documentation': { manual: 60, aiAssisted: 20 },
  'analysis': { manual: 90, aiAssisted: 30 },
  'writing': { manual: 75, aiAssisted: 25 },
  'research': { manual: 120, aiAssisted: 40 },
  'debugging': { manual: 90, aiAssisted: 20 },
  'testing': { manual: 60, aiAssisted: 15 },
  'planning': { manual: 45, aiAssisted: 15 },
  'brainstorming': { manual: 60, aiAssisted: 10 },
  'refactoring': { manual: 75, aiAssisted: 25 }
};

const LEARNING_OPPORTUNITY: Record<TaskType, { benefit: string; skills: string[] }> = {
  learning: {
    benefit: 'HIGH - This is a learning opportunity. Doing it yourself accelerates skill development.',
    skills: ['Deep understanding', 'Problem-solving', 'Decision-making', 'Domain expertise']
  },
  production: {
    benefit: 'MEDIUM - Production tasks have some learning value but are primarily about delivery.',
    skills: ['Efficiency', 'Quality standards', 'Professional execution']
  },
  exploration: {
    benefit: 'MEDIUM - Exploration benefits from both AI assistance and human discovery.',
    skills: ['Creative thinking', 'Pattern recognition', 'Critical evaluation']
  },
  'problem-solving': {
    benefit: 'HIGH - Problem-solving builds deep expertise and confidence.',
    skills: ['Analytical thinking', 'Systems thinking', 'Resilience', 'Creativity']
  }
};

const RISK_STRATEGIES: Record<TaskRiskLevel, { verification: number; confidence: string }> = {
  low: { verification: 5, confidence: 'You can trust AI output with minimal verification' },
  medium: { verification: 20, confidence: 'Plan to verify key sections' },
  high: { verification: 45, confidence: 'Substantial verification needed - time savings reduce significantly' }
};

const DEADLINE_GUIDANCE: Record<TaskDeadline, string> = {
  tight: 'Time pressure favors AI assistance, but don\'t skip quality verification',
  moderate: 'You have flexibility. Consider learning value vs. time savings.',
  relaxed: 'You can afford to do more manually for learning, or use AI for efficiency'
};

/**
 * Analyze cost-benefit of using AI vs manual completion
 */
export function analyzeCostBenefit(
  taskDescription: string,
  taskType: TaskType,
  deadline: TaskDeadline,
  riskLevel: TaskRiskLevel,
  manualTimeEstimate?: number,
  complexity: 1 | 2 | 3 | 4 | 5 = 3
): CostBenefitAnalysis {

  // Get baseline time estimate (adjust by complexity)
  const complexityFactor = 0.8 + (complexity - 1) * 0.1;
  const baselineTask = Object.values(TASK_TIME_PROFILES).reduce(
    (a, b) => ({ manual: a.manual + b.manual, aiAssisted: a.aiAssisted + b.aiAssisted }),
    { manual: 0, aiAssisted: 0 }
  );
  const avgManualTime = baselineTask.manual / Object.keys(TASK_TIME_PROFILES).length;
  const avgAiTime = baselineTask.aiAssisted / Object.keys(TASK_TIME_PROFILES).length;

  const manualTime = manualTimeEstimate || Math.round(avgManualTime * complexityFactor);
  const aiTime = Math.round(avgAiTime * complexityFactor);

  // Add verification time based on risk
  const verificationTime = RISK_STRATEGIES[riskLevel].verification;
  const totalAiTime = aiTime + verificationTime;

  const timeSavingsPercent = Math.round(((manualTime - totalAiTime) / manualTime) * 100);
  const timeSavingMinutes = manualTime - totalAiTime;

  // Quality risk assessment
  let qualityRisk = 'Low risk - AI is reliable for this task type';
  if (riskLevel === 'medium') {
    qualityRisk = 'Medium risk - Requires targeted verification of key sections';
  } else if (riskLevel === 'high') {
    qualityRisk = 'High risk - Extensive verification needed, time savings may not materialize';
  }

  // Learning analysis
  const learning = LEARNING_OPPORTUNITY[taskType];

  // Recommendation logic
  let recommendation: AIUsageDecision = 'hybrid';
  let recommendationReason = '';
  const warnings: string[] = [];
  const strategies: string[] = [];

  if (deadline === 'tight' && timeSavingMinutes > 0) {
    recommendation = 'use-ai';
    recommendationReason = `Time pressure favors AI. Save ${timeSavingMinutes} minutes, then verify.`;
    strategies.push('Quick draft using AI');
    strategies.push('Verify critical sections (10-15 min)');
    strategies.push('Accept and move forward');
  } else if (taskType === 'learning' && deadline === 'relaxed') {
    recommendation = 'do-manually';
    recommendationReason = `This is a learning opportunity. The time invested builds lasting skills.`;
    strategies.push('Work through the task yourself');
    strategies.push('Use AI to verify specific sections you\'re unsure about');
    strategies.push('Reflect on what you learned');
    warnings.push(`Warning: Using AI here would reduce your learning by ~${100 - timeSavingsPercent}%.`);
  } else if (riskLevel === 'high' && deadline !== 'tight') {
    recommendation = 'do-manually';
    recommendationReason = `This is high-risk. Manual completion builds confidence and catches errors early.`;
    strategies.push('Do the task manually');
    strategies.push('Use AI as a verification/review tool after completion');
    strategies.push('Compare AI suggestions to your work');
    warnings.push('Time savings would be mostly consumed by verification anyway.');
  } else {
    recommendation = 'hybrid';
    recommendationReason = `Use AI for initial draft, then enhance with human judgment.`;
    strategies.push('Ask AI for initial draft or ideas');
    strategies.push(`Review and verify (${verificationTime} min)`);
    strategies.push('Integrate with your expertise');
  }

  return {
    taskDescription,
    taskType,
    deadline,
    riskLevel,
    manualTimeMinutes: manualTime,
    aiAssistedTimeMinutes: totalAiTime,
    timeSavingsPercent,
    qualityRisk,
    verificationEffortMinutes: verificationTime,
    learningBenefit: learning.benefit,
    skillsDeveloped: learning.skills,
    recommendation,
    recommendationReason,
    warnings,
    suggestedStrategy: strategies
  };
}

/**
 * Create a decision log for a task
 */
export function createDecisionLog(
  taskDescription: string,
  analysis: CostBenefitAnalysis,
  userDecision: AIUsageDecision,
  decisionReasoning: string
): DecisionLog {
  return {
    id: `decision-${Date.now()}`,
    taskDescription,
    analysis,
    userDecision,
    decisionReasoning,
    timestamp: new Date()
  };
}

/**
 * Update decision log with actual outcome
 */
export function updateDecisionOutcome(
  log: DecisionLog,
  actualTime: number,
  quality: 'below-expected' | 'as-expected' | 'above-expected',
  benefits: string
): DecisionLog {
  return {
    ...log,
    actualOutcome: {
      timeTakenMinutes: actualTime,
      qualityAssessment: quality,
      benefitAssessment: benefits,
      lessonsLearned: ''
    }
  };
}

/**
 * Get cost-benefit ROI message
 */
export function getROIMessage(analysis: CostBenefitAnalysis): string {
  const savings = analysis.manualTimeMinutes - analysis.aiAssistedTimeMinutes;

  if (savings <= 0) {
    return 'Using AI won\'t save time for this task due to verification needs. Consider manual completion.';
  }

  if (savings < 10) {
    return `Small time savings (${savings} min). Decision depends on other factors (learning value, deadline).`;
  }

  if (savings > 60) {
    return `Significant time savings: ${analysis.timeSavingsPercent}% (${savings} minutes). Strong ROI for using AI.`;
  }

  return `Moderate time savings: ${analysis.timeSavingsPercent}% (${savings} minutes). Consider other factors.`;
}

/**
 * Get decision recommendation message
 */
export function getDecisionMessage(analysis: CostBenefitAnalysis): string {
  if (analysis.recommendation === 'use-ai') {
    return `✅ Recommended: Use AI. Save ~${analysis.manualTimeMinutes - analysis.aiAssistedTimeMinutes} minutes.`;
  }
  if (analysis.recommendation === 'do-manually') {
    return `✅ Recommended: Do it manually. Build skills and confidence.`;
  }
  return `✅ Recommended: Hybrid approach. Use AI for draft, add human judgment.`;
}

/**
 * Estimate learning opportunity cost
 */
export function estimateLearningCost(
  taskType: TaskType,
  skipManualWork: boolean
): { cost: string; percentage: number } {
  const learning = LEARNING_OPPORTUNITY[taskType];

  if (!skipManualWork) {
    return { cost: 'You will complete this task and build expertise', percentage: 100 };
  }

  if (taskType === 'learning' || taskType === 'problem-solving') {
    return {
      cost: `You skip an important learning opportunity. Estimated learning loss: 70-80% of skill development.`,
      percentage: 25
    };
  }

  if (taskType === 'production') {
    return {
      cost: `Some efficiency learning lost, but production focus is maintained.`,
      percentage: 60
    };
  }

  return {
    cost: `Moderate learning opportunity loss. You miss hands-on discovery.`,
    percentage: 50
  };
}

/**
 * Get deadline-specific guidance
 */
export function getDeadlineGuidance(deadline: TaskDeadline): string {
  return DEADLINE_GUIDANCE[deadline];
}

/**
 * Assess quality risk level
 */
export function assessQualityRisk(
  taskType: string,
  criticality: 'low' | 'medium' | 'high',
  userFamiliarity: 'unfamiliar' | 'moderate' | 'expert'
): TaskRiskLevel {

  // High criticality → high risk
  if (criticality === 'high') return 'high';

  // User unfamiliar + complex task → high risk
  if (userFamiliarity === 'unfamiliar' && ['analysis', 'research', 'problem-solving'].includes(taskType)) {
    return 'high';
  }

  // User familiar with simple task → low risk
  if (userFamiliarity === 'expert' && ['documentation', 'brainstorming'].includes(taskType)) {
    return 'low';
  }

  return 'medium';
}

export default {
  analyzeCostBenefit,
  createDecisionLog,
  updateDecisionOutcome,
  getROIMessage,
  getDecisionMessage,
  estimateLearningCost,
  getDeadlineGuidance,
  assessQualityRisk
};
