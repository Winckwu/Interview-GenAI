/**
 * PatternRecognitionEngine
 * Identifies 6 AI usage patterns from user behavior
 * Based on analysis of 49 deep user interviews
 */

export type AIUsagePattern = 'A' | 'B' | 'C' | 'D' | 'E' | 'F';

export interface UserBehaviorData {
  totalInteractions: number;
  verificationRate: number; // 0-1
  modificationRate: number; // 0-1
  iterationFrequency: number; // 0-1
  promptSpecificity: number; // 0-100
  reflectionDepth: number; // 0-1
  taskDecompositionScore: number; // 0-1
  strategyDiversity: number; // 0-1
  independentAttemptRate: number; // 0-1
  errorAwareness: number; // 0-1
  crossModelUsage: number; // 0-100
  trustCalibrationAccuracy: number; // 0-1
}

export interface PatternAnalysis {
  primaryPattern: AIUsagePattern;
  secondaryPattern?: AIUsagePattern;
  confidence: number; // 0-1
  patternScores: Record<AIUsagePattern, number>;
  evidence: string[];
  recommendations: string[];
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
}

/**
 * Pattern Definitions (37/49 users across all patterns)
 */
const PATTERN_DEFINITIONS = {
  A: {
    name: 'Strategic Use',
    description: 'Careful planning before using AI, clear goals',
    userPercentage: 37,
    characteristics: {
      avgPromptLengthMin: 25,
      verificationRateMin: 0.6,
      iterationRateMin: 0.3,
      independenceRateMin: 0.7,
      acceptanceRateMax: 0.8
    }
  },
  B: {
    name: 'Iterative Optimization',
    description: 'Refines AI outputs through multiple iterations',
    userPercentage: 28,
    characteristics: {
      iterationRateMin: 0.5,
      questionsAskedRateMin: 0.4,
      acceptanceRateMax: 0.75,
      strategyDiversityMin: 0.6
    }
  },
  C: {
    name: 'Adaptive Adjustment',
    description: 'Dynamically adjusts approach based on task characteristics',
    userPercentage: 18,
    characteristics: {
      strategyDiversityMin: 0.7,
      avgPromptLengthMin: 20,
      reflectionFrequencyMin: 0.4,
      independenceRateMin: 0.6
    }
  },
  D: {
    name: 'Deep Verification',
    description: 'Thoroughly verifies and scrutinizes AI outputs',
    userPercentage: 25,
    characteristics: {
      verificationRateMin: 0.7,
      questionsAskedRateMin: 0.5,
      reflectionFrequencyMin: 0.5,
      acceptanceRateMax: 0.7
    }
  },
  E: {
    name: 'Teaching & Learning',
    description: 'Uses AI as educational tool with reflection',
    userPercentage: 16,
    characteristics: {
      reflectionFrequencyMin: 0.6,
      questionsAskedRateMin: 0.4,
      iterationRateMin: 0.4,
      strategyDiversityMin: 0.5
    }
  },
  F: {
    name: 'Passive Over-Reliance',
    description: 'Uncritical acceptance with minimal verification',
    userPercentage: 6,
    characteristics: {
      verificationRateMax: 0.2,
      iterationRateMax: 0.1,
      questionsAskedRateMax: 0.2,
      acceptanceRateMin: 0.95,
      avgPromptLengthMax: 10,
      independenceRateMax: 0.3
    }
  }
};

export class PatternRecognitionEngine {
  /**
   * Analyze user behavior and identify primary/secondary patterns
   */
  analyzeUserBehavior(data: UserBehaviorData): PatternAnalysis {
    if (data.totalInteractions < 1) {
      throw new Error('Insufficient data: minimum 1 interaction required');
    }

    const patternScores = this.calculatePatternScores(data);
    const sortedPatterns = Object.entries(patternScores)
      .sort(([_, scoreA], [__, scoreB]) => scoreB - scoreA);

    const primaryPattern = sortedPatterns[0][0] as AIUsagePattern;
    const primaryScore = sortedPatterns[0][1];
    const secondaryPattern = sortedPatterns[1]?.[0] as AIUsagePattern | undefined;

    const evidence = this.generateEvidence(data, primaryPattern);
    const recommendations = this.generateRecommendations(primaryPattern, secondaryPattern);
    const riskLevel = this.assessRiskLevel(data, primaryPattern);

    // Confidence is based on gap between top two patterns
    const secondaryScore = sortedPatterns[1]?.[1] ?? 0;
    const confidence = Math.max(0, Math.min(1, (primaryScore - secondaryScore) / 100));

    return {
      primaryPattern,
      secondaryPattern,
      confidence,
      patternScores,
      evidence,
      recommendations,
      riskLevel
    };
  }

  /**
   * Calculate match score for each pattern (0-100)
   */
  private calculatePatternScores(data: UserBehaviorData): Record<AIUsagePattern, number> {
    const scores: Record<AIUsagePattern, number> = {
      A: this.matchPattern('A', data),
      B: this.matchPattern('B', data),
      C: this.matchPattern('C', data),
      D: this.matchPattern('D', data),
      E: this.matchPattern('E', data),
      F: this.matchPattern('F', data)
    };

    // Normalize to ensure they sum to 100
    const total = Object.values(scores).reduce((sum, score) => sum + score, 0);
    if (total > 0) {
      Object.keys(scores).forEach(pattern => {
        scores[pattern as AIUsagePattern] = (scores[pattern as AIUsagePattern] / total) * 100;
      });
    }

    return scores;
  }

  /**
   * Match behavior data against pattern characteristics
   */
  private matchPattern(pattern: AIUsagePattern, data: UserBehaviorData): number {
    const def = PATTERN_DEFINITIONS[pattern];
    let score = 0;
    let metricsMatched = 0;
    let metricsTotal = 0;

    // Map new properties to old pattern definition properties
    const avgPromptLength = data.promptSpecificity; // 0-100 scale
    const verificationRate = data.verificationRate; // 0-1
    const iterationRate = data.iterationFrequency; // 0-1
    const acceptanceRate = 1 - data.modificationRate; // inverted: not modified = accepted
    const independenceRate = data.independentAttemptRate; // 0-1
    const reflectionFrequency = data.reflectionDepth; // 0-1
    const strategyDiversity = data.strategyDiversity; // 0-1
    const questionsAskedRate = Math.min(data.errorAwareness, 1); // use error awareness as proxy

    // Check each characteristic
    const chars = def.characteristics;

    // avgPromptLengthMin
    if ('avgPromptLengthMin' in chars) {
      metricsTotal++;
      if (avgPromptLength >= (chars as any).avgPromptLengthMin) metricsMatched++;
    }

    // avgPromptLengthMax
    if ('avgPromptLengthMax' in chars) {
      metricsTotal++;
      if (avgPromptLength <= (chars as any).avgPromptLengthMax) metricsMatched++;
    }

    // verificationRateMin
    if ('verificationRateMin' in chars) {
      metricsTotal++;
      if (verificationRate >= (chars as any).verificationRateMin) metricsMatched++;
    }

    // verificationRateMax
    if ('verificationRateMax' in chars) {
      metricsTotal++;
      if (verificationRate <= (chars as any).verificationRateMax) metricsMatched++;
    }

    // iterationRateMin
    if ('iterationRateMin' in chars) {
      metricsTotal++;
      if (iterationRate >= (chars as any).iterationRateMin) metricsMatched++;
    }

    // iterationRateMax
    if ('iterationRateMax' in chars) {
      metricsTotal++;
      if (iterationRate <= (chars as any).iterationRateMax) metricsMatched++;
    }

    // questionsAskedRateMin
    if ('questionsAskedRateMin' in chars) {
      metricsTotal++;
      if (questionsAskedRate >= (chars as any).questionsAskedRateMin) metricsMatched++;
    }

    // questionsAskedRateMax
    if ('questionsAskedRateMax' in chars) {
      metricsTotal++;
      if (questionsAskedRate <= (chars as any).questionsAskedRateMax) metricsMatched++;
    }

    // acceptanceRateMin
    if ('acceptanceRateMin' in chars) {
      metricsTotal++;
      if (acceptanceRate >= (chars as any).acceptanceRateMin) metricsMatched++;
    }

    // acceptanceRateMax
    if ('acceptanceRateMax' in chars) {
      metricsTotal++;
      if (acceptanceRate <= (chars as any).acceptanceRateMax) metricsMatched++;
    }

    // independenceRateMin
    if ('independenceRateMin' in chars) {
      metricsTotal++;
      if (independenceRate >= (chars as any).independenceRateMin) metricsMatched++;
    }

    // independenceRateMax
    if ('independenceRateMax' in chars) {
      metricsTotal++;
      if (independenceRate <= (chars as any).independenceRateMax) metricsMatched++;
    }

    // reflectionFrequencyMin
    if ('reflectionFrequencyMin' in chars) {
      metricsTotal++;
      if (reflectionFrequency >= (chars as any).reflectionFrequencyMin) metricsMatched++;
    }

    // reflectionFrequencyMax
    if ('reflectionFrequencyMax' in chars) {
      metricsTotal++;
      if (reflectionFrequency <= (chars as any).reflectionFrequencyMax) metricsMatched++;
    }

    // strategyDiversityMin
    if ('strategyDiversityMin' in chars) {
      metricsTotal++;
      if (strategyDiversity >= (chars as any).strategyDiversityMin) metricsMatched++;
    }

    // strategyDiversityMax
    if ('strategyDiversityMax' in chars) {
      metricsTotal++;
      if (strategyDiversity <= (chars as any).strategyDiversityMax) metricsMatched++;
    }

    // Calculate percentage match
    if (metricsTotal > 0) {
      score = (metricsMatched / metricsTotal) * 100;
    }

    return score;
  }

  /**
   * Generate evidence for pattern identification
   */
  private generateEvidence(data: UserBehaviorData, pattern: AIUsagePattern): string[] {
    const evidence: string[] = [];

    // Map new properties to pattern-friendly names
    const avgPromptLength = data.promptSpecificity;
    const verificationRate = data.verificationRate;
    const iterationRate = data.iterationFrequency;
    const acceptanceRate = 1 - data.modificationRate;
    const independenceRate = data.independentAttemptRate;
    const reflectionFrequency = data.reflectionDepth;
    const strategyDiversity = data.strategyDiversity;
    const questionsAskedRate = Math.min(data.errorAwareness, 1);

    switch (pattern) {
      case 'A':
        if (avgPromptLength >= 25) evidence.push('Long, detailed prompts indicate planning');
        if (verificationRate >= 0.6) evidence.push('High verification rate shows critical thinking');
        if (iterationRate >= 0.3) evidence.push('Regular iteration refines outputs');
        if (independenceRate >= 0.7) evidence.push('Maintains high independence');
        break;

      case 'B':
        if (iterationRate >= 0.5) evidence.push('Frequent iteration on outputs');
        if (questionsAskedRate >= 0.4) evidence.push('Asks follow-up questions regularly');
        if (acceptanceRate <= 0.75) evidence.push('Selective acceptance of outputs');
        break;

      case 'C':
        if (strategyDiversity >= 0.7) evidence.push('Uses diverse strategies');
        if (avgPromptLength >= 20) evidence.push('Detailed prompt composition');
        if (reflectionFrequency >= 0.4) evidence.push('Regular reflection on approach');
        break;

      case 'D':
        if (verificationRate >= 0.7) evidence.push('Thorough verification of outputs');
        if (questionsAskedRate >= 0.5) evidence.push('Asks probing questions');
        if (reflectionFrequency >= 0.5) evidence.push('Deep reflection on results');
        break;

      case 'E':
        if (reflectionFrequency >= 0.6) evidence.push('Frequent reflection on learning');
        if (questionsAskedRate >= 0.4) evidence.push('Curiosity-driven questioning');
        if (iterationRate >= 0.4) evidence.push('Iterative approach to learning');
        break;

      case 'F':
        if (verificationRate <= 0.2) evidence.push('Minimal verification of outputs');
        if (iterationRate <= 0.1) evidence.push('Little to no iteration');
        if (questionsAskedRate <= 0.2) evidence.push('Rarely questions outputs');
        if (acceptanceRate >= 0.95) evidence.push('Uncritical acceptance of outputs');
        break;
    }

    return evidence;
  }

  /**
   * Generate personalized recommendations
   */
  private generateRecommendations(
    primary: AIUsagePattern,
    _secondary?: AIUsagePattern
  ): string[] {
    const recommendations: string[] = [];

    switch (primary) {
      case 'A':
        recommendations.push('Continue strategic approach - very effective');
        recommendations.push('Consider MR12 (Critical Thinking) to deepen verification skills');
        break;

      case 'B':
        recommendations.push('Your iterative approach is excellent for quality');
        recommendations.push('Try MR5 (Low-Cost Iteration) for faster feedback loops');
        break;

      case 'C':
        recommendations.push('Strategy diversity is your strength');
        recommendations.push('Use MR8 (Task Recognition) to match strategies to task types');
        break;

      case 'D':
        recommendations.push('Your verification rigor is exemplary');
        recommendations.push('Use MR11 (Verification Tools) to verify more efficiently');
        break;

      case 'E':
        recommendations.push('Teaching-focused approach builds deep understanding');
        recommendations.push('Use MR14 (Guided Reflection) to structure learning');
        break;

      case 'F':
        recommendations.push('⚠️ Over-reliance detected - critical intervention needed');
        recommendations.push('Use MR18 (Over-Reliance Warning) immediately');
        recommendations.push('Start with MR12 (Critical Thinking Scaffolding)');
        recommendations.push('Practice verification with MR11 (Integrated Verification)');
        break;
    }

    return recommendations;
  }

  /**
   * Assess risk level based on pattern
   */
  private assessRiskLevel(data: UserBehaviorData, pattern: AIUsagePattern): 'low' | 'medium' | 'high' | 'critical' {
    // Map new properties
    const verificationRate = data.verificationRate;
    const iterationRate = data.iterationFrequency;
    const acceptanceRate = 1 - data.modificationRate;
    const independenceRate = data.independentAttemptRate;
    const questionsAskedRate = Math.min(data.errorAwareness, 1);

    // Pattern F is always high/critical risk
    if (pattern === 'F') {
      if (verificationRate < 0.05 && acceptanceRate > 0.99) {
        return 'critical';
      }
      return 'high';
    }

    // Check boundary conditions (mixing patterns)
    const riskFactors = [
      verificationRate < 0.2,
      iterationRate < 0.1,
      questionsAskedRate < 0.15,
      acceptanceRate > 0.9,
      independenceRate < 0.3
    ];

    const riskScore = riskFactors.filter(Boolean).length;

    if (riskScore >= 4) return 'critical';
    if (riskScore === 3) return 'high';
    if (riskScore === 2) return 'medium';
    return 'low';
  }
}

export default PatternRecognitionEngine;
