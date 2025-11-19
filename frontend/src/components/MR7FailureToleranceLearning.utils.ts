/**
 * MR7: Failure Tolerance and Learning Mechanism - Utilities
 *
 * Reframe failures as learning opportunities through structured analysis
 * and encouragement mechanisms. Supports Pattern B users who learn through
 * iterative refinement.
 */

import { apiService } from '../services/api';

export interface FailedIteration {
  id: string;
  taskDescription: string;
  attemptNumber: number;
  outputQuality: 'poor' | 'acceptable' | 'good';
  userRejection: boolean;
  rejectionReason?: string;
  timestamp: Date;
  aiResponse?: string;
  userFeedback?: string;
}

export interface FailureAnalysis {
  iterationId: string;
  failurePatterns: FailurePattern[];
  learningInsights: string[];
  recoveryStrategies: string[];
}

export interface FailurePattern {
  pattern: string;
  frequency: number;
  examples: string[];
  preventionTip: string;
}

export interface LearningLog {
  id: string;
  taskId: string;
  failureIteration: FailedIteration;
  analysis: FailureAnalysis;
  lessonsLearned: string;
  keyTakeaways: string[];
  nextTimeStrategy: string;
  timestamp: Date;
  rating: 'valuable' | 'somewhat' | 'not_useful';
}

export interface AchievementBadge {
  id: string;
  name: string;
  description: string;
  criterion: string;
  unlockedAt?: Date;
  progress: number; // 0-1
}

export interface FailureStatistics {
  totalIterations: number;
  totalFailures: number;
  averageAttemptsToSuccess: number;
  commonPatterns: string[];
  successRate: number; // 0-1
  learningLogsCreated: number;
}

// Predefined failure patterns
const COMMON_FAILURE_PATTERNS: Record<string, FailurePattern> = {
  unclear_prompt: {
    pattern: 'Unclear or ambiguous prompt',
    frequency: 0,
    examples: [],
    preventionTip: 'Use MR1 (Task Decomposition) to break down what you want clearly'
  },
  wrong_format: {
    pattern: 'Unexpected output format',
    frequency: 0,
    examples: [],
    preventionTip: 'Specify desired format explicitly: "Please provide as a bulleted list"'
  },
  context_missing: {
    pattern: 'AI missing important context',
    frequency: 0,
    examples: [],
    preventionTip: 'Provide background: "I\'m writing for an audience of...who expects..."'
  },
  quality_too_brief: {
    pattern: 'Output too brief or shallow',
    frequency: 0,
    examples: [],
    preventionTip: 'Request depth: "Provide detailed explanation with examples"'
  },
  quality_too_verbose: {
    pattern: 'Output too verbose or unfocused',
    frequency: 0,
    examples: [],
    preventionTip: 'Set constraints: "In 200 words or less" or "Focus only on..."'
  },
  wrong_tone: {
    pattern: 'Tone doesn\'t match requirements',
    frequency: 0,
    examples: [],
    preventionTip: 'Specify tone: "Write in professional tone" or "Use casual, friendly language"'
  },
  accuracy_issue: {
    pattern: 'Contains inaccuracies or errors',
    frequency: 0,
    examples: [],
    preventionTip: 'Use MR12 (Critical Thinking) to systematically verify claims'
  },
  irrelevant_content: {
    pattern: 'Includes irrelevant or off-topic content',
    frequency: 0,
    examples: [],
    preventionTip: 'Clarify scope: "Only include information about X, exclude Y"'
  }
};

// Achievement criteria
export const ACHIEVEMENT_BADGES: AchievementBadge[] = [
  {
    id: 'first_learning_log',
    name: '🎓 Reflective Learner',
    description: 'Created your first learning log from a failure',
    criterion: 'Create 1 learning log',
    progress: 0
  },
  {
    id: 'persistent_explorer',
    name: '🔄 Persistent Explorer',
    description: 'Iterate 3+ times on a single task',
    criterion: 'Iterate 3+ times',
    progress: 0
  },
  {
    id: 'pattern_detective',
    name: '🔍 Pattern Detective',
    description: 'Identify and learn from failure patterns',
    criterion: 'Identify 3 distinct failure patterns',
    progress: 0
  },
  {
    id: 'growth_mindset',
    name: '📈 Growth Mindset Champion',
    description: 'Create 5 learning logs documenting your growth',
    criterion: 'Create 5 learning logs',
    progress: 0
  },
  {
    id: 'resilience_master',
    name: '💪 Resilience Master',
    description: 'Successfully recover from failure (try again after rejection)',
    criterion: 'Succeed after rejection',
    progress: 0
  },
  {
    id: 'learning_streak',
    name: '🔥 Learning Streak',
    description: 'Create learning logs for 5 consecutive sessions',
    criterion: '5 consecutive learning sessions',
    progress: 0
  }
];

// Success statistics
const SUCCESS_STATISTICS = [
  { iterations: 1, successRate: 0.15, message: '15% of tasks succeed on first try' },
  { iterations: 2, successRate: 0.35, message: '35% need 2 iterations' },
  { iterations: 3, successRate: 0.60, message: '60% succeed within 3 iterations' },
  { iterations: 4, successRate: 0.75, message: '75% succeed within 4 iterations' },
  { iterations: 5, successRate: 0.85, message: '85% succeed within 5 iterations' }
];

/**
 * Identify failure patterns from an iteration - uses GPT API with fallback
 */
export async function analyzeFailure(
  iteration: FailedIteration,
  previousAttempts: FailedIteration[] = []
): Promise<FailureAnalysis> {
  // Try GPT-powered analysis
  try {
    const response = await apiService.ai.analyzeFailure(
      iteration.taskDescription,
      iteration.rejectionReason || 'Output not satisfactory',
      iteration.aiResponse,
      previousAttempts.map(a => ({ task: a.taskDescription, issue: a.rejectionReason }))
    );

    if (response.data?.success && response.data?.data) {
      const aiData = response.data.data;

      const patterns: FailurePattern[] = [{
        pattern: aiData.category || 'unknown',
        frequency: 1,
        examples: aiData.patterns || [],
        preventionTip: aiData.improvedPrompt || 'Try a different approach'
      }];

      const insights = (aiData.learningPoints || []).map((lp: any) => lp.point);
      insights.unshift(aiData.rootCause || 'Analysis complete');

      return {
        iterationId: iteration.id,
        failurePatterns: patterns,
        learningInsights: insights,
        recoveryStrategies: aiData.preventionStrategies || []
      };
    }
  } catch (error) {
    console.warn('[MR7] GPT failure analysis failed, using local fallback:', error);
  }

  // Fallback to local analysis
  const patterns: FailurePattern[] = [];
  const insights: string[] = [];
  const strategies: string[] = [];

  // Detect patterns
  if (iteration.rejectionReason) {
    const reason = iteration.rejectionReason.toLowerCase();

    if (reason.includes('unclear') || reason.includes('ambiguous')) {
      patterns.push({ ...COMMON_FAILURE_PATTERNS.unclear_prompt });
    }
    if (reason.includes('format') || reason.includes('structure')) {
      patterns.push({ ...COMMON_FAILURE_PATTERNS.wrong_format });
    }
    if (reason.includes('context') || reason.includes('background')) {
      patterns.push({ ...COMMON_FAILURE_PATTERNS.context_missing });
    }
    if (reason.includes('brief') || reason.includes('shallow')) {
      patterns.push({ ...COMMON_FAILURE_PATTERNS.quality_too_brief });
    }
    if (reason.includes('long') || reason.includes('verbose')) {
      patterns.push({ ...COMMON_FAILURE_PATTERNS.quality_too_verbose });
    }
    if (reason.includes('tone') || reason.includes('style')) {
      patterns.push({ ...COMMON_FAILURE_PATTERNS.wrong_tone });
    }
    if (reason.includes('incorrect') || reason.includes('error')) {
      patterns.push({ ...COMMON_FAILURE_PATTERNS.accuracy_issue });
    }
    if (reason.includes('irrelevant') || reason.includes('off-topic')) {
      patterns.push({ ...COMMON_FAILURE_PATTERNS.irrelevant_content });
    }
  }

  // Generate insights
  insights.push(`This is attempt #${iteration.attemptNumber}. Most tasks succeed within 4-5 iterations.`);

  if (patterns.length > 0) {
    insights.push(`Detected ${patterns.length} potential pattern(s) that might help with the next attempt.`);
  }

  if (previousAttempts.length > 0) {
    const samePatternCount = previousAttempts.filter(
      a => a.taskDescription === iteration.taskDescription && a.userRejection
    ).length;
    if (samePatternCount > 0) {
      insights.push(`You've attempted this task ${samePatternCount} time(s) before. Try a different angle.`);
    }
  }

  // Generate recovery strategies
  if (patterns.length > 0) {
    patterns.forEach(p => {
      strategies.push(`• ${p.preventionTip}`);
    });
  }

  strategies.push('• Try asking the AI for alternatives or different approaches');
  strategies.push('• Use MR14 (Guided Reflection) to think about what went wrong');
  strategies.push('• Break down the problem further using MR1 (Task Decomposition)');

  return {
    iterationId: iteration.id,
    failurePatterns: patterns,
    learningInsights: insights,
    recoveryStrategies: strategies
  };
}

/**
 * Create a learning log from a failed iteration
 */
export function createLearningLog(
  iteration: FailedIteration,
  analysis: FailureAnalysis,
  lessonText: string,
  nextStrategy: string
): LearningLog {
  const keyTakeaways = extractKeyTakeaways(lessonText);

  return {
    id: `log-${iteration.id}-${Date.now()}`,
    taskId: iteration.id,
    failureIteration: iteration,
    analysis,
    lessonsLearned: lessonText,
    keyTakeaways,
    nextTimeStrategy: nextStrategy,
    timestamp: new Date(),
    rating: 'valuable'
  };
}

/**
 * Extract key takeaways from lesson text
 */
function extractKeyTakeaways(text: string): string[] {
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  return sentences
    .slice(0, 3)
    .map(s => s.trim())
    .filter(s => s.length > 10);
}

/**
 * Calculate failure statistics
 */
export function calculateFailureStatistics(
  iterations: FailedIteration[],
  logs: LearningLog[]
): FailureStatistics {
  const failureCount = iterations.filter(i => i.userRejection).length;

  // Group by task and find attempts to success
  const taskAttempts: Record<string, number> = {};
  let totalAttempts = 0;
  let successfulTasks = 0;

  iterations.forEach(iter => {
    const task = iter.taskDescription;
    if (!taskAttempts[task]) {
      taskAttempts[task] = 0;
    }
    taskAttempts[task]++;
    totalAttempts++;

    if (!iter.userRejection) {
      successfulTasks++;
    }
  });

  const avgAttempts = Object.values(taskAttempts).length > 0
    ? Object.values(taskAttempts).reduce((a, b) => a + b, 0) / Object.keys(taskAttempts).length
    : 0;

  // Find common patterns
  const patternMap: Record<string, number> = {};
  logs.forEach(log => {
    log.analysis.failurePatterns.forEach(p => {
      patternMap[p.pattern] = (patternMap[p.pattern] || 0) + 1;
    });
  });

  const commonPatterns = Object.entries(patternMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([pattern]) => pattern);

  return {
    totalIterations: iterations.length,
    totalFailures: failureCount,
    averageAttemptsToSuccess: Math.round(avgAttempts * 10) / 10,
    commonPatterns,
    successRate: totalAttempts > 0 ? successfulTasks / totalAttempts : 0,
    learningLogsCreated: logs.length
  };
}

/**
 * Get encouragement message based on statistics
 */
export function getEncouragementMessage(stats: FailureStatistics): string {
  if (stats.totalIterations === 0) {
    return 'Ready to explore and learn? Start your first iteration!';
  }

  if (stats.successRate >= 0.8) {
    return `🌟 You're mastering this! ${Math.round(stats.successRate * 100)}% success rate shows strong growth.`;
  }

  if (stats.successRate >= 0.6) {
    return `🚀 Good progress! ${Math.round(stats.successRate * 100)}% of your iterations succeed. Keep going!`;
  }

  if (stats.learningLogsCreated > 0) {
    return `📚 You've learned from ${stats.learningLogsCreated} iterations. Each failure is building expertise.`;
  }

  return `💡 You're exploring and learning. Most tasks need 3-4 iterations - you're on the right track!`;
}

/**
 * Update achievement progress
 */
export function updateAchievementProgress(
  badges: AchievementBadge[],
  iterations: FailedIteration[],
  logs: LearningLog[]
): AchievementBadge[] {
  return badges.map(badge => {
    let progress = badge.progress;

    if (badge.id === 'first_learning_log') {
      progress = logs.length > 0 ? 1 : 0;
    } else if (badge.id === 'persistent_explorer') {
      progress = Math.min(iterations.length / 3, 1);
    } else if (badge.id === 'pattern_detective') {
      const uniquePatterns = new Set<string>();
      logs.forEach(log => {
        log.analysis.failurePatterns.forEach(p => {
          uniquePatterns.add(p.pattern);
        });
      });
      progress = Math.min(uniquePatterns.size / 3, 1);
    } else if (badge.id === 'growth_mindset') {
      progress = Math.min(logs.length / 5, 1);
    } else if (badge.id === 'resilience_master') {
      // Check if there's a successful iteration after a rejection
      let found = false;
      for (let i = 0; i < iterations.length - 1; i++) {
        if (iterations[i].userRejection && !iterations[i + 1].userRejection) {
          found = true;
          break;
        }
      }
      progress = found ? 1 : 0;
    } else if (badge.id === 'learning_streak') {
      // Count consecutive sessions with learning logs
      let streak = 0;
      const logDates = logs.map(l => l.timestamp.toDateString());
      const uniqueDates = [...new Set(logDates)];
      progress = Math.min(uniqueDates.length / 5, 1);
    }

    return {
      ...badge,
      progress,
      unlockedAt: progress === 1 && !badge.unlockedAt ? new Date() : badge.unlockedAt
    };
  });
}

/**
 * Get success expectation message based on iteration count
 */
export function getSuccessExpectation(attemptNumber: number): string {
  for (const stat of SUCCESS_STATISTICS) {
    if (attemptNumber <= stat.iterations) {
      return stat.message;
    }
  }
  return 'You\'re highly persistent! Most tasks succeed within 5 iterations - great effort!';
}

export default {
  analyzeFailure,
  createLearningLog,
  calculateFailureStatistics,
  getEncouragementMessage,
  updateAchievementProgress,
  getSuccessExpectation
};
