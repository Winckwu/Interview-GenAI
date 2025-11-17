/**
 * MR18: Over-Reliance Warning System - Utilities
 *
 * Detect and intervene in Pattern F behaviors (uncritical over-reliance on AI).
 * Monitor for: uncritical acceptance, passive querying, lack of awareness
 */

export type OverRelianceIndicator = 'no-verification' | 'short-prompts' | 'no-iteration' | 'passive-awareness' | 'uncritical-acceptance';
export type InterventionLevel = 'none' | 'gentle' | 'moderate' | 'urgent';

export interface UsageSession {
  sessionId: string;
  timestamp: Date;
  promptLength: number;
  promptText: string;
  responseAccepted: boolean;
  wasVerified: boolean;
  wasIteratedOn: boolean;
  userAskedFollowUpQuestions: boolean;
}

export interface UserBehaviorProfile {
  totalSessions: number;
  avgPromptLength: number;
  verificationRate: number; // 0-1 percentage of outputs verified
  iterationRate: number; // 0-1 percentage that were iterated on
  questionsAskedRate: number; // 0-1 percentage with follow-up questions
  unverifiedConsecutive: number; // count of consecutive unverified outputs
  shortPromptRate: number; // 0-1 percentage of short prompts
  acceptanceRate: number; // 0-1 percentage of outputs accepted
}

export interface OverRelianceWarning {
  id: string;
  timestamp: Date;
  interventionLevel: InterventionLevel;
  indicators: OverRelianceIndicator[];
  metrics: {
    unverifiedCount: number;
    avgPromptLength: number;
    iterationCount: number;
    shortPromptCount: number;
  };
  warnings: string[];
  suggestedActions: string[];
  resources: string[];
  userAcknowledged: boolean;
}

// Thresholds for warning triggers
const THRESHOLDS = {
  consecutiveUnverified: 10, // trigger after 10 unverified outputs
  avgPromptLength: 10, // words below this is "short"
  shortPromptPercentage: 0.7, // 70% of prompts are short
  lowIterationRate: 0.1, // less than 10% iteration rate
  lowQuestionsRate: 0.2, // less than 20% ask follow-up questions
  lowVerificationRate: 0.2 // less than 20% verification
};

/**
 * Analyze user behavior for over-reliance patterns
 */
export function analyzeUserBehavior(
  sessions: UsageSession[]
): UserBehaviorProfile {
  if (sessions.length === 0) {
    return {
      totalSessions: 0,
      avgPromptLength: 0,
      verificationRate: 0,
      iterationRate: 0,
      questionsAskedRate: 0,
      unverifiedConsecutive: 0,
      shortPromptRate: 0,
      acceptanceRate: 1
    };
  }

  const totalSessions = sessions.length;
  const avgPromptLength =
    sessions.reduce((sum, s) => sum + s.promptLength, 0) / totalSessions;

  const verificationCount = sessions.filter(s => s.wasVerified).length;
  const verificationRate = verificationCount / totalSessions;

  const iterationCount = sessions.filter(s => s.wasIteratedOn).length;
  const iterationRate = iterationCount / totalSessions;

  const questionsCount = sessions.filter(
    s => s.userAskedFollowUpQuestions
  ).length;
  const questionsAskedRate = questionsCount / totalSessions;

  // Find consecutive unverified outputs
  let unverifiedConsecutive = 0;
  let currentUnverified = 0;
  for (const session of sessions) {
    if (!session.wasVerified) {
      currentUnverified++;
      unverifiedConsecutive = Math.max(unverifiedConsecutive, currentUnverified);
    } else {
      currentUnverified = 0;
    }
  }

  const shortPromptCount = sessions.filter(
    s => s.promptLength < THRESHOLDS.avgPromptLength
  ).length;
  const shortPromptRate = shortPromptCount / totalSessions;

  const acceptanceCount = sessions.filter(s => s.responseAccepted).length;
  const acceptanceRate = acceptanceCount / totalSessions;

  return {
    totalSessions,
    avgPromptLength,
    verificationRate,
    iterationRate,
    questionsAskedRate,
    unverifiedConsecutive,
    shortPromptRate,
    acceptanceRate
  };
}

/**
 * Detect over-reliance indicators
 */
export function detectOverRelianceIndicators(
  profile: UserBehaviorProfile
): OverRelianceIndicator[] {
  const indicators: OverRelianceIndicator[] = [];

  // Indicator 1: No verification
  if (profile.verificationRate < THRESHOLDS.lowVerificationRate) {
    indicators.push('no-verification');
  }

  // Indicator 2: Short prompts
  if (profile.shortPromptRate > THRESHOLDS.shortPromptPercentage) {
    indicators.push('short-prompts');
  }

  // Indicator 3: No iteration
  if (profile.iterationRate < THRESHOLDS.lowIterationRate) {
    indicators.push('no-iteration');
  }

  // Indicator 4: Passive awareness (not asking questions)
  if (profile.questionsAskedRate < THRESHOLDS.lowQuestionsRate) {
    indicators.push('passive-awareness');
  }

  // Indicator 5: Uncritical acceptance
  if (profile.acceptanceRate > 0.95 && profile.unverifiedConsecutive >= 5) {
    indicators.push('uncritical-acceptance');
  }

  return indicators;
}

/**
 * Determine intervention level based on indicators
 */
export function determineInterventionLevel(
  indicators: OverRelianceIndicator[],
  unverifiedConsecutive: number
): InterventionLevel {
  if (indicators.length === 0) {
    return 'none';
  }

  if (unverifiedConsecutive >= THRESHOLDS.consecutiveUnverified) {
    return 'urgent';
  }

  if (indicators.length >= 4) {
    return 'moderate';
  }

  if (indicators.length >= 2) {
    return 'moderate';
  }

  return 'gentle';
}

/**
 * Generate warning message with specific metrics
 */
export function generateOverRelianceWarning(
  profile: UserBehaviorProfile,
  indicators: OverRelianceIndicator[]
): OverRelianceWarning {
  const interventionLevel = determineInterventionLevel(
    indicators,
    profile.unverifiedConsecutive
  );

  const warnings: string[] = [];
  const suggestedActions: string[] = [];
  const resources: string[] = [];

  // Build specific warnings
  if (indicators.includes('no-verification')) {
    warnings.push(
      `You've accepted ${Math.round(
        profile.acceptanceRate * 100
      )}% of AI outputs without verification`
    );
    suggestedActions.push('Try verifying the next few AI outputs');
    resources.push('Integrated Verification Tools (MR11)');
  }

  if (indicators.includes('short-prompts')) {
    warnings.push(
      `Your prompts average ${Math.round(
        profile.avgPromptLength
      )} words (recommended: >15)`
    );
    suggestedActions.push(
      'Practice writing more detailed prompts that specify what you want'
    );
    resources.push('Task Decomposition Scaffold (MR1)');
  }

  if (indicators.includes('no-iteration')) {
    warnings.push(
      `You rarely iterate: only ${Math.round(
        profile.iterationRate * 100
      )}% of outputs are improved`
    );
    suggestedActions.push('Try asking for improvements on the next response');
    resources.push('Low-Cost Iteration Mechanism (MR5)');
  }

  if (indicators.includes('passive-awareness')) {
    warnings.push(
      `You rarely ask follow-up questions (${Math.round(
        profile.questionsAskedRate * 100
      )}% of time)`
    );
    suggestedActions.push(
      'Try asking "Why?" or requesting alternatives next time'
    );
    resources.push('Critical Thinking Scaffolding (MR12)');
  }

  if (
    indicators.includes('uncritical-acceptance') ||
    profile.unverifiedConsecutive >= THRESHOLDS.consecutiveUnverified
  ) {
    warnings.push(
      `${profile.unverifiedConsecutive} consecutive outputs accepted without any verification`
    );
    suggestedActions.push('Complete a brief "Critical Thinking" tutorial');
    suggestedActions.push('Verify the next output before accepting it');
    resources.push('Critical Thinking Scaffolding (MR12)');
  }

  // Add general resources
  if (resources.length === 0) {
    resources.push('Metacognitive Strategy Guide (MR15)');
  }
  resources.push('Guided Reflection Mechanism (MR14)');
  resources.push('Dynamic Trust Calibration (MR9)');

  return {
    id: `warning-${Date.now()}`,
    timestamp: new Date(),
    interventionLevel,
    indicators,
    metrics: {
      unverifiedCount: Math.round(
        profile.totalSessions * (1 - profile.verificationRate)
      ),
      avgPromptLength: Math.round(profile.avgPromptLength),
      iterationCount: Math.round(
        profile.totalSessions * profile.iterationRate
      ),
      shortPromptCount: Math.round(
        profile.totalSessions * profile.shortPromptRate
      )
    },
    warnings,
    suggestedActions,
    resources,
    userAcknowledged: false
  };
}

/**
 * Get warning message based on intervention level
 */
export function getWarningMessage(level: InterventionLevel): string {
  const messages: Record<InterventionLevel, string> = {
    none: 'Your usage pattern is healthy. Keep practicing critical thinking!',
    gentle:
      '⚠️ We noticed some patterns that might indicate increasing reliance. Try to ask more questions and verify occasionally.',
    moderate:
      '⚠️ ⚠️ We\'ve detected signs of over-reliance. Consider taking action to maintain your skills.',
    urgent:
      '🚨 🚨 CRITICAL: Your usage pattern suggests over-reliance is developing. Immediate action recommended to prevent skill atrophy.'
  };

  return messages[level];
}

/**
 * Get color for intervention level
 */
export function getWarningColor(level: InterventionLevel): string {
  const colors: Record<InterventionLevel, string> = {
    none: '#4caf50', // green
    gentle: '#2196f3', // blue
    moderate: '#ff9800', // orange
    urgent: '#f44336' // red
  };

  return colors[level];
}

/**
 * Record user acknowledgment of warning
 */
export function acknowledgeWarning(warning: OverRelianceWarning): OverRelianceWarning {
  return {
    ...warning,
    userAcknowledged: true
  };
}

/**
 * Check if user has taken corrective action
 */
export function checkCorrectiveAction(
  newProfile: UserBehaviorProfile,
  oldProfile: UserBehaviorProfile
): string[] {
  const improvements: string[] = [];

  if (
    newProfile.verificationRate > oldProfile.verificationRate &&
    newProfile.verificationRate > 0
  ) {
    improvements.push('✅ Started verifying outputs');
  }

  if (newProfile.avgPromptLength > oldProfile.avgPromptLength + 5) {
    improvements.push('✅ Writing longer, more detailed prompts');
  }

  if (newProfile.iterationRate > oldProfile.iterationRate + 0.1) {
    improvements.push('✅ Iterating more frequently');
  }

  if (newProfile.questionsAskedRate > oldProfile.questionsAskedRate + 0.1) {
    improvements.push('✅ Asking more follow-up questions');
  }

  return improvements;
}

export default {
  analyzeUserBehavior,
  detectOverRelianceIndicators,
  determineInterventionLevel,
  generateOverRelianceWarning,
  getWarningMessage,
  getWarningColor,
  acknowledgeWarning,
  checkCorrectiveAction
};
