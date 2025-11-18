/**
 * SVM Pattern Classifier Service
 *
 * Provides SVM-based pattern classification by calling the Python microservice
 * Replaces the Bayesian method with ML-based prediction
 */

import axios, { AxiosInstance } from 'axios';
import { BehavioralSignals } from './BehaviorSignalDetector';

export type Pattern = 'A' | 'B' | 'C' | 'D' | 'E' | 'F';

export interface SVMPrediction {
  pattern: Pattern;
  probability: number;
  probabilities: Record<Pattern, number>;
  confidence: number;
  decisionScores?: Record<Pattern, number>;
}

export interface PatternEstimate {
  topPattern: Pattern;
  probability: number;
  confidence: number;
  probabilities: Map<Pattern, number>;
  needMoreData: boolean;
  evidence: string[];
}

/**
 * SVM Pattern Classifier
 * Communicates with Python microservice for predictions
 */
class SVMPatternClassifier {
  private apiClient: AxiosInstance;
  private srvmServiceUrl: string = process.env.SVM_SERVICE_URL || 'http://localhost:5002';
  private modelInfo: any = null;
  private initialized: boolean = false;
  private turnCount: number = 0;

  constructor() {
    this.apiClient = axios.create({
      baseURL: this.srvmServiceUrl,
      timeout: 5000,
    });

    // Don't block startup - initialize asynchronously in background
    this.initialize().catch(() => {
      // Silently fail - will retry on first use
    });
  }

  /**
   * Initialize classifier and load model info
   * Silently fails if SVM service not available - will retry on first use
   */
  private async initialize(): Promise<void> {
    try {
      const response = await this.apiClient.get('/model_info');
      this.modelInfo = response.data;
      this.initialized = true;
      console.log('✅ SVM Classifier initialized successfully');
    } catch (error) {
      // Silently fail - SVM service may not be running
      // Will retry on first prediction attempt
      this.initialized = false;
    }
  }

  /**
   * Convert behavioral signals to SVM input format
   */
  private signalsToFeatures(signals: BehavioralSignals): Record<string, number> {
    return {
      p1: signals.taskDecompositionEvidence,          // 0-3
      p2: signals.goalClarityScore,                   // 0-3
      p3: signals.strategyMentioned ? 2 : 0,          // 0-3
      p4: signals.preparationActions.length > 0 ? 2 : 0,  // 0-3
      m1: signals.verificationAttempted ? 2 : 0,      // 0-3
      m2: signals.qualityCheckMentioned ? 2 : 0,      // 0-3
      m3: signals.contextAwarenessIndicator,          // 0-3
      e1: signals.outputEvaluationPresent ? 2 : 0,    // 0-3
      e2: signals.reflectionDepth,                    // 0-3
      e3: signals.capabilityJudgmentShown ? 2 : 0,    // 0-3
      r1: signals.iterationCount,                     // 0-3
      r2: signals.trustCalibrationEvidence.length > 0 ? 2 : 0,  // 0-3
    };
  }

  /**
   * Predict pattern from behavioral signals using SVM
   */
  async predictPattern(signals: BehavioralSignals): Promise<PatternEstimate> {
    this.turnCount++;

    try {
      if (!this.initialized) {
        await this.initialize();
        if (!this.initialized) {
          throw new Error('SVM service not available');
        }
      }

      // Convert signals to features
      const features = this.signalsToFeatures(signals);

      // Call SVM service
      const response = await this.apiClient.post('/predict', {
        signals: features,
      });

      if (!response.data.success) {
        throw new Error(response.data.error);
      }

      const prediction: SVMPrediction = response.data;

      // Build evidence
      const evidence: string[] = [];

      // Add evidence based on strong signals
      if (signals.taskDecompositionEvidence === 3) {
        evidence.push('Strong task decomposition');
      } else if (signals.taskDecompositionEvidence === 0) {
        evidence.push('No task decomposition');
      }

      if (signals.verificationAttempted) {
        evidence.push('User attempted verification');
      }

      if (signals.iterationCount >= 2) {
        evidence.push(`Multiple iterations (${signals.iterationCount})`);
      }

      if (signals.aiRelianceDegree >= 3) {
        evidence.push('High AI reliance');
      }

      if (signals.reflectionDepth >= 2) {
        evidence.push('Deep reflection demonstrated');
      }

      // Convert probability object to Map
      const probabilities = new Map(Object.entries(prediction.probabilities) as [Pattern, number][]);

      // Determine if we need more data (confidence too low)
      const needMoreData = prediction.confidence < 0.2 && this.turnCount < 5;

      return {
        topPattern: prediction.pattern,
        probability: prediction.probability,
        confidence: prediction.confidence,
        probabilities,
        needMoreData,
        evidence,
      };
    } catch (error: any) {
      console.error('❌ SVM prediction error:', error.message);

      // Fallback to uniform distribution on error
      return {
        topPattern: 'B' as Pattern,
        probability: 1 / 6,
        confidence: 0,
        probabilities: new Map([
          ['A', 1 / 6],
          ['B', 1 / 6],
          ['C', 1 / 6],
          ['D', 1 / 6],
          ['E', 1 / 6],
          ['F', 1 / 6],
        ]),
        needMoreData: true,
        evidence: ['Error in SVM prediction, using default distribution'],
      };
    }
  }

  /**
   * Batch predict patterns for multiple signal sets
   */
  async batchPredict(signalsList: BehavioralSignals[]): Promise<PatternEstimate[]> {
    try {
      if (!this.initialized) {
        await this.initialize();
      }

      const features = signalsList.map((signals) =>
        this.signalsToFeatures(signals)
      );

      const response = await this.apiClient.post('/batch_predict', {
        signals_list: features,
      });

      if (!response.data.success) {
        throw new Error(response.data.error);
      }

      return response.data.results.map((pred: SVMPrediction) => ({
        topPattern: pred.pattern,
        probability: pred.probability,
        confidence: pred.confidence,
        probabilities: new Map(Object.entries(pred.probabilities) as [Pattern, number][]),
        needMoreData: false,
        evidence: [],
      }));
    } catch (error: any) {
      console.error('❌ Batch prediction error:', error.message);
      throw error;
    }
  }

  /**
   * Get model information
   */
  async getModelInfo(): Promise<any> {
    if (!this.initialized) {
      await this.initialize();
    }
    return this.modelInfo;
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.apiClient.get('/health');
      return response.data.status === 'ok' && response.data.model_loaded;
    } catch (error) {
      return false;
    }
  }

  /**
   * Reset classifier state
   */
  reset(): void {
    this.turnCount = 0;
  }
}

export default new SVMPatternClassifier();
