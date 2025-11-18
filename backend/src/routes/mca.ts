/**
 * MCA (Metacognitive Assessment) Routes
 *
 * Three-Layer Real-Time Adaptive MR System:
 * Layer 1: Behavior Signal Detection
 * Layer 2: Realtime Pattern Recognition
 * Layer 3: Adaptive MR Activation
 */

import express, { Request, Response } from 'express';
import BehaviorSignalDetector, { ConversationTurn } from '../services/BehaviorSignalDetector';
import RealtimePatternRecognizer from '../services/RealtimePatternRecognizer';
import AdaptiveMRActivator from '../services/AdaptiveMRActivator';

const router = express.Router();

// Store recognizers per session
const recognizerMap = new Map<string, RealtimePatternRecognizer>();

/**
 * GET /mca/status/:sessionId
 * Get current MCA analysis status for a session
 */
router.get('/status/:sessionId', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;

    if (!sessionId) {
      return res.status(400).json({
        success: false,
        error: 'Session ID is required',
      });
    }

    const recognizer = recognizerMap.get(sessionId);

    if (!recognizer) {
      return res.json({
        success: true,
        data: {
          sessionId,
          status: 'not_started',
          estimatedPattern: null,
          analysisLog: [],
        },
      });
    }

    const estimate = recognizer.getCurrentEstimate();

    res.json({
      success: true,
      data: {
        sessionId,
        status: 'analyzing',
        estimatedPattern: estimate.topPattern,
        confidence: estimate.probability,
        confidenceMargin: estimate.confidence,
        needMoreData: estimate.needMoreData,
        analysisLog: recognizer.getAnalysisLog(),
      },
    });
  } catch (error: any) {
    console.error('MCA status error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get MCA status',
    });
  }
});

/**
 * POST /mca/orchestrate
 * Main orchestration endpoint - ties all three layers together
 *
 * Input:
 * - sessionId: string
 * - conversationTurns: Array of {id, userMessage, aiResponse?, timestamp, sessionId}
 * - currentTurnIndex: number (index of current message in conversation)
 *
 * Process:
 * 1. Extract behavioral signals from latest turn (Layer 1)
 * 2. Update pattern probabilities (Layer 2)
 * 3. Determine active MRs (Layer 3)
 *
 * Output:
 * - signals: Extracted behavioral signals
 * - pattern: Current pattern estimate
 * - activeMRs: List of MRs to display
 * - turnCount: Number of user turns processed
 * - isHighRiskF: Whether user shows high-risk Pattern F signals
 */
router.post('/orchestrate', async (req: Request, res: Response) => {
  try {
    const { sessionId, conversationTurns, currentTurnIndex } = req.body;

    if (!sessionId || !conversationTurns || conversationTurns.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'sessionId and conversationTurns are required',
      });
    }

    // Initialize recognizer for this session if not already done
    if (!recognizerMap.has(sessionId)) {
      recognizerMap.set(sessionId, new RealtimePatternRecognizer());
    }
    const recognizer = recognizerMap.get(sessionId)!;

    // Find the latest user turn to analyze
    const latestUserTurnIndex = Math.max(
      ...[...conversationTurns.keys()].filter((i) => conversationTurns[i].userMessage),
      -1
    );

    if (latestUserTurnIndex === -1) {
      return res.json({
        success: true,
        data: {
          signals: null,
          pattern: null,
          activeMRs: [],
          turnCount: 0,
          isHighRiskF: false,
        },
      });
    }

    // Get history up to current turn for context
    const historyTurns = conversationTurns.slice(0, latestUserTurnIndex);
    const currentTurn = conversationTurns[latestUserTurnIndex];

    // Layer 1: Extract behavioral signals from current turn
    const signals = BehaviorSignalDetector.detectSignals(
      currentTurn as ConversationTurn,
      historyTurns as ConversationTurn[]
    );

    // Layer 2: Update pattern probabilities with Bayesian updating
    const patternEstimate = recognizer.updateProbabilities(signals);

    // Layer 3: Determine active MRs based on pattern and signals
    const turnCount = conversationTurns.filter((t: any) => t.userMessage).length;
    const activeMRs = AdaptiveMRActivator.determineActiveMRs(
      signals,
      patternEstimate,
      turnCount
    );

    // Check for high-risk Pattern F
    const isHighRiskF = recognizer.isHighRiskF(signals);

    // Log this orchestration step
    console.log(`[MCA:${sessionId}] Turn ${turnCount}:`, {
      topPattern: patternEstimate.topPattern,
      probability: (patternEstimate.probability * 100).toFixed(1) + '%',
      activeMRCount: activeMRs.length,
      isHighRiskF,
    });

    res.json({
      success: true,
      data: {
        signals,
        pattern: patternEstimate,
        activeMRs,
        turnCount,
        isHighRiskF,
      },
    });
  } catch (error: any) {
    console.error('MCA orchestration error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to orchestrate MCA analysis',
    });
  }
});

/**
 * POST /mca/reset/:sessionId
 * Reset pattern recognizer for a session
 * Used when starting a new analysis or debugging
 */
router.post('/reset/:sessionId', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;

    if (!sessionId) {
      return res.status(400).json({
        success: false,
        error: 'Session ID is required',
      });
    }

    // Remove the recognizer to reset state
    recognizerMap.delete(sessionId);

    res.json({
      success: true,
      message: `Recognizer reset for session ${sessionId}`,
    });
  } catch (error: any) {
    console.error('MCA reset error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to reset MCA analysis',
    });
  }
});

/**
 * GET /mca/patterns/:sessionId
 * Get all patterns detected so far in a session
 */
router.get('/patterns/:sessionId', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;

    if (!sessionId) {
      return res.status(400).json({
        success: false,
        error: 'Session ID is required',
      });
    }

    const recognizer = recognizerMap.get(sessionId);

    if (!recognizer) {
      return res.json({
        success: true,
        data: {
          sessionId,
          probabilities: {},
          analysisLog: [],
        },
      });
    }

    res.json({
      success: true,
      data: {
        sessionId,
        probabilities: recognizer.getProbabilities(),
        analysisLog: recognizer.getAnalysisLog(),
      },
    });
  } catch (error: any) {
    console.error('MCA patterns error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get MCA patterns',
    });
  }
});

export default router;
