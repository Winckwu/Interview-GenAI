/**
 * TrustCalibrationService
 *
 * Based on MR9 - Dynamic Trust Calibration (02-Empirical-Foundation-Supplement.md)
 * Provides personalized, context-aware trust recommendations for AI outputs
 *
 * Trust Matrix: Task Type × AI Model → Historical Accuracy → Recommended Trust
 * Data sources:
 * - Respondent I41's empirical trust matrix (49 interviews, 588 coding instances)
 * - Respondent I3's contextual trust heuristics
 * - User-specific verification history (for personalization)
 */

export type TaskType =
  | 'academic_citation'
  | 'code_logic'
  | 'code_syntax'
  | 'concept_explanation'
  | 'data_analysis'
  | 'creative_brainstorm'
  | 'grammar_check'
  | 'math_derivation'
  | 'technical_documentation'
  | 'medical_advice'
  | 'legal_advice'
  | 'financial_decision';

export type AIModel =
  | 'gpt-4-turbo'
  | 'gpt-4'
  | 'claude-3-opus'
  | 'claude-3-sonnet'
  | 'claude-2'
  | 'gemini-pro'
  | 'mistral-large';

export interface UserVerificationHistory {
  attempts: number;           // Total attempts for this task type
  correct: number;            // Correct outputs
  incorrect: number;          // Incorrect/problematic outputs
  userTrustLevel?: number;    // User's actual trust (0-1)
  lastUpdated?: Date;
}

export interface TrustRecommendation {
  recommendedTrust: number;           // 0-1, recommended trust level
  historicalAccuracy: number;         // 0-1, empirical accuracy rate
  userCalibration: number;            // Difference: userTrust - historicalAccuracy
  confidenceScore: number;            // How confident is this recommendation (0-1)
  reasoning: {
    taskType: string;
    baselineAccuracy: string;          // Description of baseline
    userBehavior?: string;             // Description of user's past behavior
    riskLevel: 'zero_tolerance' | 'high_risk' | 'medium_risk' | 'low_risk';
    suggestion: string;
  };
  warning?: string;                   // Alert if significant miscalibration
}

export class TrustCalibrationService {
  /**
   * Empirical trust matrix from interviews
   * Source: Respondent I41's tracking (02-Empirical-Foundation-Supplement.md)
   * Format: taskType × aiModel → historical accuracy (0-1)
   */
  private trustMatrix: Record<TaskType, Record<AIModel, number>> = {
    // Academic Citation: Very low accuracy (17% - Respondent I34)
    academic_citation: {
      'gpt-4-turbo': 0.17,
      'gpt-4': 0.15,
      'claude-3-opus': 0.19,
      'claude-3-sonnet': 0.16,
      'claude-2': 0.12,
      'gemini-pro': 0.18,
      'mistral-large': 0.14,
    },

    // Code Logic: Medium accuracy (73% - Respondent I41)
    code_logic: {
      'gpt-4-turbo': 0.78,
      'gpt-4': 0.73,
      'claude-3-opus': 0.81,
      'claude-3-sonnet': 0.75,
      'claude-2': 0.68,
      'gemini-pro': 0.72,
      'mistral-large': 0.70,
    },

    // Code Syntax: High accuracy (85% - grammar/syntax checking)
    code_syntax: {
      'gpt-4-turbo': 0.88,
      'gpt-4': 0.85,
      'claude-3-opus': 0.89,
      'claude-3-sonnet': 0.86,
      'claude-2': 0.82,
      'gemini-pro': 0.84,
      'mistral-large': 0.81,
    },

    // Concept Explanation: High accuracy (80% - Respondent I41)
    concept_explanation: {
      'gpt-4-turbo': 0.82,
      'gpt-4': 0.80,
      'claude-3-opus': 0.84,
      'claude-3-sonnet': 0.81,
      'claude-2': 0.76,
      'gemini-pro': 0.79,
      'mistral-large': 0.77,
    },

    // Data Analysis: Medium accuracy (55% - prone to hallucination)
    data_analysis: {
      'gpt-4-turbo': 0.58,
      'gpt-4': 0.55,
      'claude-3-opus': 0.62,
      'claude-3-sonnet': 0.57,
      'claude-2': 0.50,
      'gemini-pro': 0.54,
      'mistral-large': 0.52,
    },

    // Creative Brainstorm: Very high accuracy (90% - creativity is safe)
    creative_brainstorm: {
      'gpt-4-turbo': 0.92,
      'gpt-4': 0.90,
      'claude-3-opus': 0.93,
      'claude-3-sonnet': 0.91,
      'claude-2': 0.88,
      'gemini-pro': 0.89,
      'mistral-large': 0.87,
    },

    // Grammar Check: Very high accuracy (92%)
    grammar_check: {
      'gpt-4-turbo': 0.93,
      'gpt-4': 0.92,
      'claude-3-opus': 0.94,
      'claude-3-sonnet': 0.92,
      'claude-2': 0.89,
      'gemini-pro': 0.91,
      'mistral-large': 0.89,
    },

    // Math Derivation: Low accuracy (40% - Respondent I41)
    math_derivation: {
      'gpt-4-turbo': 0.42,
      'gpt-4': 0.40,
      'claude-3-opus': 0.45,
      'claude-3-sonnet': 0.41,
      'claude-2': 0.35,
      'gemini-pro': 0.39,
      'mistral-large': 0.37,
    },

    // Technical Documentation: Medium-high accuracy (70%)
    technical_documentation: {
      'gpt-4-turbo': 0.72,
      'gpt-4': 0.70,
      'claude-3-opus': 0.75,
      'claude-3-sonnet': 0.71,
      'claude-2': 0.65,
      'gemini-pro': 0.69,
      'mistral-large': 0.67,
    },

    // Medical Advice: Zero tolerance (0% - life-critical domain)
    medical_advice: {
      'gpt-4-turbo': 0.0,
      'gpt-4': 0.0,
      'claude-3-opus': 0.0,
      'claude-3-sonnet': 0.0,
      'claude-2': 0.0,
      'gemini-pro': 0.0,
      'mistral-large': 0.0,
    },

    // Legal Advice: Zero tolerance (0% - Respondent I17, life-critical)
    legal_advice: {
      'gpt-4-turbo': 0.0,
      'gpt-4': 0.0,
      'claude-3-opus': 0.0,
      'claude-3-sonnet': 0.0,
      'claude-2': 0.0,
      'gemini-pro': 0.0,
      'mistral-large': 0.0,
    },

    // Financial Decision: Zero tolerance (0% - high-stakes financial)
    financial_decision: {
      'gpt-4-turbo': 0.0,
      'gpt-4': 0.0,
      'claude-3-opus': 0.0,
      'claude-3-sonnet': 0.0,
      'claude-2': 0.0,
      'gemini-pro': 0.0,
      'mistral-large': 0.0,
    },
  };

  /**
   * Risk level categorization
   * Based on domain criticality and consequences of errors
   */
  private taskRiskMap: Record<TaskType, 'zero_tolerance' | 'high_risk' | 'medium_risk' | 'low_risk'> = {
    academic_citation: 'high_risk',        // Citation errors destroy credibility
    code_logic: 'high_risk',               // Logic errors cause production failures
    code_syntax: 'low_risk',               // Syntax errors are easy to catch
    concept_explanation: 'medium_risk',    // Wrong explanations mislead learning
    data_analysis: 'high_risk',            // Wrong analysis leads to bad decisions
    creative_brainstorm: 'low_risk',       // Creativity has no "right answer"
    grammar_check: 'low_risk',             // Grammar errors are minor
    math_derivation: 'high_risk',          // Math errors cause downstream failures
    technical_documentation: 'medium_risk', // Documentation errors cause confusion
    medical_advice: 'zero_tolerance',      // Life-critical domain
    legal_advice: 'zero_tolerance',        // Legal liability domain
    financial_decision: 'zero_tolerance',  // Financial loss domain
  };

  /**
   * Get recommended trust level based on task type and user history
   */
  public getRecommendedTrust(
    taskType: TaskType,
    aiModel: AIModel,
    userHistory?: UserVerificationHistory
  ): TrustRecommendation {
    // Get baseline accuracy from matrix
    const historicalAccuracy = this.trustMatrix[taskType]?.[aiModel] ?? 0.5;

    // Calculate recommended trust based on historical accuracy
    let recommendedTrust = this.calculateRecommendedTrust(historicalAccuracy);

    // Adjust for user verification history if available
    let userCalibration = 0;
    let userBehavior: string | undefined;

    if (userHistory) {
      const userAccuracy =
        userHistory.attempts > 0
          ? userHistory.correct / userHistory.attempts
          : undefined;

      if (userHistory.userTrustLevel !== undefined && userAccuracy !== undefined) {
        userCalibration = userHistory.userTrustLevel - userAccuracy;

        // Adjust recommendation based on user calibration
        if (Math.abs(userCalibration) > 0.2) {
          // User is significantly miscalibrated
          recommendedTrust = Math.max(0, Math.min(1, userAccuracy + 0.1));
          userBehavior = this.describeUserBehavior(userHistory, userAccuracy);
        }
      }
    }

    // Calculate confidence in this recommendation
    const confidenceScore = this.calculateConfidence(taskType, userHistory);

    // Get risk level
    const riskLevel = this.taskRiskMap[taskType];

    // Build recommendation
    const result: TrustRecommendation = {
      recommendedTrust: Math.round(recommendedTrust * 100) / 100,
      historicalAccuracy: Math.round(historicalAccuracy * 100) / 100,
      userCalibration: Math.round(userCalibration * 100) / 100,
      confidenceScore,
      reasoning: {
        taskType,
        baselineAccuracy: this.describeAccuracy(historicalAccuracy),
        riskLevel,
        suggestion: this.getSuggestion(taskType, historicalAccuracy, userHistory),
        userBehavior,
      },
    };

    // Add warning if user is significantly miscalibrated
    if (userHistory?.userTrustLevel !== undefined && Math.abs(userCalibration) > 0.2) {
      result.warning = this.generateWarning(taskType, userCalibration, historicalAccuracy);
    }

    return result;
  }

  /**
   * Recommend trust level based on historical accuracy
   * Formula: recommendedTrust ≈ 0.9 × historicalAccuracy
   * (slightly lower than actual to encourage verification)
   */
  private calculateRecommendedTrust(accuracy: number): number {
    if (accuracy === 0) {
      return 0; // Zero tolerance domains
    }

    // For high-accuracy tasks, be slightly conservative
    // For low-accuracy tasks, be more conservative
    const conservativeFactor = accuracy < 0.5 ? 0.7 : 0.9;
    return Math.min(1.0, accuracy * conservativeFactor);
  }

  /**
   * Describe accuracy in human-readable format
   */
  private describeAccuracy(accuracy: number): string {
    if (accuracy === 0) {
      return 'Zero - High-risk domain, AI not suitable';
    } else if (accuracy < 0.3) {
      return 'Very Low - Frequent errors, requires verification';
    } else if (accuracy < 0.6) {
      return 'Low to Medium - Often needs correction';
    } else if (accuracy < 0.8) {
      return 'Medium to High - Generally reliable with spot checks';
    } else {
      return 'Very High - Can be trusted with verification';
    }
  }

  /**
   * Describe user's behavior relative to their history
   */
  private describeUserBehavior(
    history: UserVerificationHistory,
    actualAccuracy: number
  ): string {
    const userTrust = history.userTrustLevel ?? 0;
    const diff = userTrust - actualAccuracy;

    if (diff > 0.3) {
      return `Over-trusting: User's confidence (${Math.round(userTrust * 100)}%) significantly exceeds actual accuracy (${Math.round(actualAccuracy * 100)}%)`;
    } else if (diff < -0.2) {
      return `Under-trusting: User's confidence (${Math.round(userTrust * 100)}%) is lower than actual accuracy (${Math.round(actualAccuracy * 100)}%)`;
    } else {
      return `Well-calibrated: User's trust aligns with actual performance`;
    }
  }

  /**
   * Calculate confidence in the recommendation
   */
  private calculateConfidence(
    _taskType: TaskType,
    userHistory?: UserVerificationHistory
  ): number {
    let confidence = 0.8; // Base confidence from empirical data

    // Increase confidence if user has verification history
    if (userHistory && userHistory.attempts > 10) {
      confidence = Math.min(1.0, confidence + 0.15);
    } else if (userHistory && userHistory.attempts > 5) {
      confidence = Math.min(1.0, confidence + 0.1);
    }

    return Math.round(confidence * 100) / 100;
  }

  /**
   * Generate personalized suggestion based on task and accuracy
   */
  private getSuggestion(
    taskType: TaskType,
    accuracy: number,
    _userHistory?: UserVerificationHistory
  ): string {
    if (accuracy === 0) {
      return `Do not use AI for ${taskType}. This is a zero-tolerance domain. If used, require 100% independent verification.`;
    }

    if (accuracy < 0.3) {
      return `For ${taskType}, always verify AI output. Recommended approach: Have AI provide initial draft, then independently verify every critical claim.`;
    }

    if (accuracy < 0.6) {
      return `For ${taskType}, spot-check critical sections. Use AI as a starting point, but independently verify calculations, citations, and key claims.`;
    }

    if (accuracy < 0.8) {
      return `For ${taskType}, periodic verification sufficient. Trust AI for most outputs, but periodically audit to ensure no drift in quality.`;
    }

    return `For ${taskType}, AI is generally reliable. Quick spot checks should be sufficient, but remain alert for edge cases.`;
  }

  /**
   * Generate warning message for miscalibrated users
   */
  private generateWarning(
    taskType: TaskType,
    calibration: number,
    accuracy: number
  ): string {
    if (calibration > 0.3) {
      return `⚠️ HIGH OVER-CONFIDENCE: Your trust in AI for ${taskType} is ${Math.round(calibration * 100)}% higher than actual accuracy (${Math.round(accuracy * 100)}%). This could lead to errors. Consider increasing verification.`;
    } else if (calibration < -0.2) {
      return `ℹ️ UNNECESSARY UNDER-TRUST: Your trust in AI for ${taskType} is ${Math.round(Math.abs(calibration) * 100)}% lower than its actual performance (${Math.round(accuracy * 100)}%). You might be over-verifying.`;
    }

    return undefined!;
  }

  /**
   * Get all tasks in zero-tolerance category
   */
  public getZeroToleranceTasks(): TaskType[] {
    return Object.entries(this.taskRiskMap)
      .filter(([_, risk]) => risk === 'zero_tolerance')
      .map(([task, _]) => task as TaskType);
  }

  /**
   * Get all tasks by risk level
   */
  public getTasksByRiskLevel(
    riskLevel: 'zero_tolerance' | 'high_risk' | 'medium_risk' | 'low_risk'
  ): TaskType[] {
    return Object.entries(this.taskRiskMap)
      .filter(([_, risk]) => risk === riskLevel)
      .map(([task, _]) => task as TaskType);
  }

  /**
   * Compare user's trust across multiple task types
   */
  public compareTrustLevels(
    userTrustMap: Record<TaskType, number>,
    aiModel: AIModel
  ): {
    task: TaskType;
    userTrust: number;
    recommendedTrust: number;
    gap: number;
    status: 'over_trust' | 'under_trust' | 'well_calibrated';
  }[] {
    return Object.entries(userTrustMap).map(([taskType, userTrust]) => {
      const recommendation = this.getRecommendedTrust(
        taskType as TaskType,
        aiModel
      );
      const gap = userTrust - recommendation.recommendedTrust;

      let status: 'over_trust' | 'under_trust' | 'well_calibrated';
      if (Math.abs(gap) < 0.1) {
        status = 'well_calibrated';
      } else if (gap > 0) {
        status = 'over_trust';
      } else {
        status = 'under_trust';
      }

      return {
        task: taskType as TaskType,
        userTrust: Math.round(userTrust * 100) / 100,
        recommendedTrust: recommendation.recommendedTrust,
        gap: Math.round(gap * 100) / 100,
        status,
      };
    });
  }

  /**
   * Update trust matrix based on new empirical data
   * (for continuous improvement as more user data is collected)
   */
  public updateAccuracy(
    taskType: TaskType,
    aiModel: AIModel,
    newAccuracy: number
  ): void {
    if (this.trustMatrix[taskType]) {
      // Weighted average: 70% old data + 30% new data
      const oldAccuracy = this.trustMatrix[taskType][aiModel] ?? 0.5;
      this.trustMatrix[taskType][aiModel] = oldAccuracy * 0.7 + newAccuracy * 0.3;
    }
  }

  /**
   * Get the complete trust matrix for analysis
   */
  public getTrustMatrix(): Record<TaskType, Record<AIModel, number>> {
    return JSON.parse(JSON.stringify(this.trustMatrix)); // Deep copy
  }
}

export const trustCalibrationService = new TrustCalibrationService();
