/**
 * Trust Calibration Service
 *
 * Based on MR9 - Dynamic Trust Calibration
 * From 02-Empirical-Foundation-Supplement.md
 *
 * Core functionality:
 * - Maintains historical accuracy matrix (task types × AI models)
 * - Provides personalized trust recommendations
 * - Context-sensitive warnings for high-risk tasks
 * - Tracks user calibration drift (over-trust vs under-trust)
 */

// ============================================================
// Type Definitions
// ============================================================

export type TaskType =
  | 'academic_citation'
  | 'concept_explanation'
  | 'code_debugging'
  | 'math_proof'
  | 'grammar_check'
  | 'code_syntax'
  | 'brainstorming'
  | 'code_logic'
  | 'technical_docs'
  | 'data_analysis'
  | 'math_derivation'
  | 'medical_advice'
  | 'legal_advice'
  | 'financial_decision'
  | 'sql_generation'
  | 'market_data'
  | 'competitor_analysis'
  | 'technical_feasibility'
  | 'legal_compliance';

export type AIModel =
  | 'gpt-4-turbo'
  | 'gpt-4'
  | 'gpt-3.5-turbo'
  | 'claude-3-opus'
  | 'claude-3-sonnet'
  | 'claude-3-haiku';

export type RiskLevel = 'safe' | 'moderate' | 'high_risk' | 'critical';

export interface UserVerificationRecord {
  taskType: TaskType;
  aiModel: AIModel;
  wasCorrect: boolean;
  timestamp: Date;
  userTrustLevel?: number; // User's actual trust at the time (0-1)
}

export interface UserHistory {
  userId: string;
  verifications: UserVerificationRecord[];
  totalInteractions: number;
}

export interface TrustRecommendation {
  recommendedTrust: number; // 0-1 scale
  historicalAccuracy: number; // 0-1 scale
  userCalibration: number; // User's trust bias (-1 to 1, negative = over-trust)
  riskLevel: RiskLevel;
  warning?: string;
  rationale: {
    historicalData: string;
    userPattern: string;
    contextFactors: string[];
  };
  confidence: number; // How confident we are in this recommendation (0-1)
}

export interface AccuracyRecord {
  taskType: TaskType;
  aiModel: AIModel;
  historicalAccuracy: number; // 0-1 scale
  sampleSize: number; // Number of observations
  lastUpdated: Date;
}

// ============================================================
// Historical Accuracy Matrix
// ============================================================

/**
 * Initial accuracy data from empirical research
 * Source: 02-Empirical-Foundation-Supplement.md
 *
 * Based on:
 * - I41's trust matrix (lines 906-926)
 * - I3's heuristic rules (lines 928-960)
 * - I2's trust calibration data (lines 822-843)
 */
const HISTORICAL_ACCURACY_MATRIX: AccuracyRecord[] = [
  // High Risk Tasks (10-30% accuracy)
  {
    taskType: 'academic_citation',
    aiModel: 'gpt-4-turbo',
    historicalAccuracy: 0.17, // From I41: 2/12 correct
    sampleSize: 12,
    lastUpdated: new Date('2024-10-01'),
  },
  {
    taskType: 'math_derivation',
    aiModel: 'gpt-4-turbo',
    historicalAccuracy: 0.25,
    sampleSize: 24,
    lastUpdated: new Date('2024-10-01'),
  },
  {
    taskType: 'legal_advice',
    aiModel: 'gpt-4-turbo',
    historicalAccuracy: 0.15,
    sampleSize: 18,
    lastUpdated: new Date('2024-10-01'),
  },
  {
    taskType: 'medical_advice',
    aiModel: 'gpt-4-turbo',
    historicalAccuracy: 0.20,
    sampleSize: 15,
    lastUpdated: new Date('2024-10-01'),
  },
  {
    taskType: 'market_data',
    aiModel: 'gpt-4-turbo',
    historicalAccuracy: 0.30, // From I2: should trust 30% not 70%
    sampleSize: 20,
    lastUpdated: new Date('2024-10-01'),
  },

  // Critical Risk Tasks (0-10% accuracy)
  {
    taskType: 'financial_decision',
    aiModel: 'gpt-4-turbo',
    historicalAccuracy: 0.05,
    sampleSize: 10,
    lastUpdated: new Date('2024-10-01'),
  },
  {
    taskType: 'legal_compliance',
    aiModel: 'gpt-4-turbo',
    historicalAccuracy: 0.05, // From I17: zero tolerance
    sampleSize: 8,
    lastUpdated: new Date('2024-10-01'),
  },

  // Moderate Tasks (40-60% accuracy)
  {
    taskType: 'math_proof',
    aiModel: 'gpt-4-turbo',
    historicalAccuracy: 0.40, // From I41: 8/20 correct
    sampleSize: 20,
    lastUpdated: new Date('2024-10-01'),
  },
  {
    taskType: 'code_logic',
    aiModel: 'gpt-4-turbo',
    historicalAccuracy: 0.50,
    sampleSize: 45,
    lastUpdated: new Date('2024-10-01'),
  },
  {
    taskType: 'technical_docs',
    aiModel: 'gpt-4-turbo',
    historicalAccuracy: 0.55,
    sampleSize: 32,
    lastUpdated: new Date('2024-10-01'),
  },
  {
    taskType: 'data_analysis',
    aiModel: 'gpt-4-turbo',
    historicalAccuracy: 0.50,
    sampleSize: 28,
    lastUpdated: new Date('2024-10-01'),
  },
  {
    taskType: 'technical_feasibility',
    aiModel: 'gpt-4-turbo',
    historicalAccuracy: 0.40, // From I2: small bias
    sampleSize: 15,
    lastUpdated: new Date('2024-10-01'),
  },

  // Good Tasks (70-80% accuracy)
  {
    taskType: 'code_debugging',
    aiModel: 'gpt-4-turbo',
    historicalAccuracy: 0.73, // From I41: 11/15 correct
    sampleSize: 15,
    lastUpdated: new Date('2024-10-01'),
  },
  {
    taskType: 'concept_explanation',
    aiModel: 'gpt-4-turbo',
    historicalAccuracy: 0.80, // From I41: 28/35 correct
    sampleSize: 35,
    lastUpdated: new Date('2024-10-01'),
  },
  {
    taskType: 'sql_generation',
    aiModel: 'gpt-4-turbo',
    historicalAccuracy: 0.71, // From I44: 5/7 correct
    sampleSize: 21,
    lastUpdated: new Date('2024-10-01'),
  },
  {
    taskType: 'competitor_analysis',
    aiModel: 'gpt-4-turbo',
    historicalAccuracy: 0.60, // From I2: accurate calibration
    sampleSize: 18,
    lastUpdated: new Date('2024-10-01'),
  },

  // Excellent Tasks (80-95% accuracy)
  {
    taskType: 'grammar_check',
    aiModel: 'gpt-4-turbo',
    historicalAccuracy: 0.85, // From I3's heuristics
    sampleSize: 120,
    lastUpdated: new Date('2024-10-01'),
  },
  {
    taskType: 'code_syntax',
    aiModel: 'gpt-4-turbo',
    historicalAccuracy: 0.88,
    sampleSize: 95,
    lastUpdated: new Date('2024-10-01'),
  },
  {
    taskType: 'brainstorming',
    aiModel: 'gpt-4-turbo',
    historicalAccuracy: 0.90, // From I2: 90% trust is appropriate
    sampleSize: 67,
    lastUpdated: new Date('2024-10-01'),
  },
];

// ============================================================
// Trust Calibration Service
// ============================================================

export class TrustCalibrationService {
  private accuracyMatrix: Map<string, AccuracyRecord>;

  constructor() {
    // Initialize accuracy matrix
    this.accuracyMatrix = new Map();
    HISTORICAL_ACCURACY_MATRIX.forEach(record => {
      const key = this.getMatrixKey(record.taskType, record.aiModel);
      this.accuracyMatrix.set(key, record);
    });
  }

  /**
   * Get trust recommendation for a specific task
   *
   * @param taskType - Type of task being performed
   * @param aiModel - AI model being used
   * @param userHistory - Optional user's verification history for personalization
   * @returns Trust recommendation with rationale
   */
  public recommendTrust(
    taskType: TaskType,
    aiModel: AIModel,
    userHistory?: UserHistory
  ): TrustRecommendation {
    // Get historical accuracy
    const accuracyRecord = this.getAccuracy(taskType, aiModel);
    const historicalAccuracy = accuracyRecord?.historicalAccuracy || 0.5;

    // Calculate user calibration if history provided
    const userCalibration = userHistory
      ? this.calculateUserCalibration(userHistory, taskType)
      : 0;

    // Determine risk level
    const riskLevel = this.determineRiskLevel(taskType, historicalAccuracy);

    // Calculate recommended trust (adjusted for user calibration)
    const baseRecommendation = this.calculateBaseTrust(historicalAccuracy, riskLevel);
    const recommendedTrust = this.adjustForUserCalibration(
      baseRecommendation,
      userCalibration,
      riskLevel
    );

    // Generate warning if needed
    const warning = this.generateWarning(taskType, riskLevel, historicalAccuracy, userCalibration);

    // Build rationale
    const rationale = this.buildRationale(
      taskType,
      aiModel,
      historicalAccuracy,
      accuracyRecord?.sampleSize || 0,
      userHistory,
      userCalibration,
      riskLevel
    );

    // Calculate confidence in recommendation
    const confidence = this.calculateConfidence(
      accuracyRecord?.sampleSize || 0,
      userHistory?.verifications.length || 0
    );

    return {
      recommendedTrust,
      historicalAccuracy,
      userCalibration,
      riskLevel,
      warning,
      rationale,
      confidence,
    };
  }

  /**
   * Update accuracy matrix with new verification data
   */
  public updateAccuracy(
    taskType: TaskType,
    aiModel: AIModel,
    wasCorrect: boolean
  ): void {
    const key = this.getMatrixKey(taskType, aiModel);
    const existing = this.accuracyMatrix.get(key);

    if (existing) {
      // Update existing record with Bayesian update
      const totalCorrect = existing.historicalAccuracy * existing.sampleSize;
      const newTotalCorrect = totalCorrect + (wasCorrect ? 1 : 0);
      const newSampleSize = existing.sampleSize + 1;

      this.accuracyMatrix.set(key, {
        ...existing,
        historicalAccuracy: newTotalCorrect / newSampleSize,
        sampleSize: newSampleSize,
        lastUpdated: new Date(),
      });
    } else {
      // Create new record
      this.accuracyMatrix.set(key, {
        taskType,
        aiModel,
        historicalAccuracy: wasCorrect ? 1.0 : 0.0,
        sampleSize: 1,
        lastUpdated: new Date(),
      });
    }
  }

  /**
   * Get user's calibration pattern across all tasks
   * Returns calibration metrics and recommendations
   */
  public analyzeUserCalibration(userHistory: UserHistory): {
    overallCalibration: number;
    taskCalibrations: { taskType: TaskType; calibration: number }[];
    recommendation: string;
  } {
    const taskCalibrations = new Map<TaskType, number[]>();

    // Group by task type
    userHistory.verifications.forEach(record => {
      if (record.userTrustLevel !== undefined) {
        if (!taskCalibrations.has(record.taskType)) {
          taskCalibrations.set(record.taskType, []);
        }

        const accuracy = this.getAccuracy(record.taskType, record.aiModel);
        if (accuracy) {
          const calibrationError = record.userTrustLevel - accuracy.historicalAccuracy;
          taskCalibrations.get(record.taskType)!.push(calibrationError);
        }
      }
    });

    // Calculate per-task calibration
    const taskResults: { taskType: TaskType; calibration: number }[] = [];
    let totalCalibration = 0;
    let totalTasks = 0;

    taskCalibrations.forEach((errors, taskType) => {
      const avgError = errors.reduce((sum, e) => sum + e, 0) / errors.length;
      taskResults.push({ taskType, calibration: avgError });
      totalCalibration += avgError;
      totalTasks++;
    });

    const overallCalibration = totalTasks > 0 ? totalCalibration / totalTasks : 0;

    // Generate recommendation
    let recommendation = '';
    if (overallCalibration > 0.2) {
      recommendation = 'You tend to over-trust AI outputs. Consider verifying more carefully, especially for high-risk tasks.';
    } else if (overallCalibration < -0.2) {
      recommendation = 'You tend to under-trust AI outputs. You may be spending more time verifying than necessary for low-risk tasks.';
    } else {
      recommendation = 'Your trust calibration is well-balanced. Keep monitoring for specific task types.';
    }

    return {
      overallCalibration,
      taskCalibrations: taskResults,
      recommendation,
    };
  }

  // ============================================================
  // Private Helper Methods
  // ============================================================

  private getMatrixKey(taskType: TaskType, aiModel: AIModel): string {
    return `${taskType}::${aiModel}`;
  }

  private getAccuracy(taskType: TaskType, aiModel: AIModel): AccuracyRecord | undefined {
    const key = this.getMatrixKey(taskType, aiModel);
    return this.accuracyMatrix.get(key);
  }

  private determineRiskLevel(taskType: TaskType, accuracy: number): RiskLevel {
    // Critical tasks (zero tolerance)
    if (['financial_decision', 'legal_compliance', 'medical_advice'].includes(taskType)) {
      return 'critical';
    }

    // Accuracy-based risk
    if (accuracy < 0.10) return 'critical'; // Only < 10% is critical
    if (accuracy < 0.40) return 'high_risk';
    if (accuracy < 0.70) return 'moderate';
    return 'safe';
  }

  private calculateBaseTrust(accuracy: number, riskLevel: RiskLevel): number {
    // For critical tasks, always recommend very low trust
    if (riskLevel === 'critical') {
      return Math.min(accuracy * 0.5, 0.10); // Cap at 10%
    }

    // For high-risk tasks, be conservative
    if (riskLevel === 'high_risk') {
      // Very low accuracy (< 30%): reduce by 50%
      if (accuracy < 0.30) {
        return accuracy * 0.5; // e.g., 17% → 8.5%
      }
      // Regular high-risk: reduce by 30%
      return accuracy * 0.7;
    }

    // For moderate tasks, slight reduction
    if (riskLevel === 'moderate') {
      return accuracy * 0.85; // Reduce by 15%
    }

    // For safe tasks, trust close to accuracy
    return accuracy * 0.95; // Slight reduction for safety
  }

  private adjustForUserCalibration(
    baseTrust: number,
    userCalibration: number,
    riskLevel: RiskLevel
  ): number {
    // If user over-trusts (positive calibration), reduce recommendation more
    // If user under-trusts (negative calibration), increase slightly

    let adjustment = 0;

    if (userCalibration > 0.1) {
      // User over-trusts - reduce recommendation
      adjustment = -0.1;
    } else if (userCalibration < -0.1) {
      // User under-trusts - increase slightly (but carefully for high-risk)
      adjustment = riskLevel === 'critical' ? 0 : 0.05;
    }

    const adjusted = Math.max(0, Math.min(1, baseTrust + adjustment));
    return Math.round(adjusted * 100) / 100; // Round to 2 decimals
  }

  private calculateUserCalibration(
    userHistory: UserHistory,
    taskType: TaskType
  ): number {
    // Filter verifications for this task type
    const relevantVerifications = userHistory.verifications.filter(
      v => v.taskType === taskType && v.userTrustLevel !== undefined
    );

    if (relevantVerifications.length === 0) {
      return 0; // No data
    }

    // Calculate average trust vs accuracy gap
    let totalGap = 0;
    let count = 0;

    relevantVerifications.forEach(verification => {
      const accuracy = this.getAccuracy(verification.taskType, verification.aiModel);
      if (accuracy && verification.userTrustLevel !== undefined) {
        const gap = verification.userTrustLevel - accuracy.historicalAccuracy;
        totalGap += gap;
        count++;
      }
    });

    return count > 0 ? totalGap / count : 0;
  }

  private generateWarning(
    taskType: TaskType,
    riskLevel: RiskLevel,
    accuracy: number,
    userCalibration: number
  ): string | undefined {
    // Critical tasks always get critical warning
    if (riskLevel === 'critical') {
      return `CRITICAL: This is a ${taskType.replace('_', ' ')} task. AI accuracy is only ${Math.round(accuracy * 100)}%. DO NOT use AI output directly for decision-making. Verify all information independently.`;
    }

    // Severe over-trust gets priority warning (even for high-risk tasks)
    if (userCalibration > 0.3) {
      return `CALIBRATION WARNING: You tend to over-trust AI on this task type. Historical data shows lower accuracy than your typical trust level.`;
    }

    // High-risk task warning
    if (riskLevel === 'high_risk') {
      return `HIGH RISK: AI accuracy for ${taskType.replace('_', ' ')} is ${Math.round(accuracy * 100)}%. Thorough verification required.`;
    }

    return undefined;
  }

  private buildRationale(
    taskType: TaskType,
    aiModel: AIModel,
    historicalAccuracy: number,
    sampleSize: number,
    userHistory: UserHistory | undefined,
    userCalibration: number,
    riskLevel: RiskLevel
  ): TrustRecommendation['rationale'] {
    const historicalData = sampleSize > 0
      ? `Based on ${sampleSize} observations, ${aiModel} achieves ${Math.round(historicalAccuracy * 100)}% accuracy on ${taskType.replace('_', ' ')} tasks.`
      : `Limited historical data for ${taskType.replace('_', ' ')} with ${aiModel}. Using general estimates.`;

    let userPattern = 'No personal history available.';
    if (userHistory && userHistory.verifications.length > 0) {
      const taskVerifications = userHistory.verifications.filter(v => v.taskType === taskType);
      if (taskVerifications.length > 0) {
        const userAccuracy = taskVerifications.filter(v => v.wasCorrect).length / taskVerifications.length;

        if (userCalibration > 0.2) {
          userPattern = `Your ${taskVerifications.length} verifications show you tend to over-trust (calibration: ${Math.round(userCalibration * 100)}%). Your observed accuracy: ${Math.round(userAccuracy * 100)}%.`;
        } else if (userCalibration < -0.2) {
          userPattern = `Your ${taskVerifications.length} verifications show you tend to under-trust. Your observed accuracy: ${Math.round(userAccuracy * 100)}%.`;
        } else {
          userPattern = `Your ${taskVerifications.length} verifications show well-calibrated trust. Your observed accuracy: ${Math.round(userAccuracy * 100)}%.`;
        }
      }
    }

    const contextFactors: string[] = [];

    if (riskLevel === 'critical') {
      contextFactors.push('Zero-tolerance domain: errors can have severe consequences');
      contextFactors.push('Always verify independently before using AI output');
    } else if (riskLevel === 'high_risk') {
      contextFactors.push('High-risk task: verification strongly recommended');
    }

    if (historicalAccuracy < 0.30) {
      contextFactors.push('AI frequently makes errors on this task type');
    }

    if (sampleSize < 10) {
      contextFactors.push('Limited data: recommendation may be less reliable');
    }

    return {
      historicalData,
      userPattern,
      contextFactors,
    };
  }

  private calculateConfidence(sampleSize: number, userVerifications: number): number {
    // Confidence based on data availability
    let confidence = 0.5; // Base confidence

    // Historical data contribution (0-0.4)
    if (sampleSize >= 50) {
      confidence += 0.4;
    } else if (sampleSize >= 20) {
      confidence += 0.3;
    } else if (sampleSize >= 10) {
      confidence += 0.2;
    } else if (sampleSize >= 5) {
      confidence += 0.1;
    }

    // User history contribution (0-0.1)
    if (userVerifications >= 10) {
      confidence += 0.1;
    } else if (userVerifications >= 5) {
      confidence += 0.05;
    }

    return Math.min(1.0, confidence);
  }
}

export default TrustCalibrationService;
