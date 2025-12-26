/**
 * Pattern Explanation Service
 *
 * Generates human-readable explanations for detected patterns using LLM.
 * Runs asynchronously to avoid blocking real-time detection.
 *
 * Architecture:
 * - SVM detects pattern in real-time (<10ms)
 * - This service generates explanation asynchronously (2-5s)
 * - Explanation is saved to database for later display
 */

import { callOpenAI } from './aiService';
import pool from '../config/database';
import { BehavioralSignals } from './BehaviorSignalDetector';

interface PatternExplanationResult {
  explanation: string;
  keyBehaviors: string[];
  recommendations: string[];
  riskLevel: 'low' | 'medium' | 'high';
}

/**
 * Convert numeric signal values to human-readable descriptions
 */
function describeSignal(name: string, value: number | boolean | string): string {
  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  }
  if (typeof value === 'number') {
    if (value <= 1) return 'Low';
    if (value <= 2) return 'Medium';
    return 'High';
  }
  return String(value);
}

/**
 * Generate LLM explanation for Pattern F detection
 */
export async function generatePatternFExplanation(
  sessionId: string,
  userId: string,
  signals: BehavioralSignals,
  conversationSummary: string,
  confidence: number
): Promise<PatternExplanationResult> {
  const prompt = `You are an AI learning advisor analyzing a student's interaction patterns with an AI tutor.

Based on the following behavioral signals, explain why this student shows "Pattern F - Passive Over-Reliance" behavior.

## Behavioral Signals Detected:
- Task Complexity: ${describeSignal('taskComplexity', signals.taskComplexity)} (${signals.taskComplexity}/3)
- AI Reliance Degree: ${describeSignal('aiRelianceDegree', signals.aiRelianceDegree)} (${signals.aiRelianceDegree}/3)
- Task Decomposition Evidence: ${describeSignal('taskDecomposition', signals.taskDecompositionEvidence)} (${signals.taskDecompositionEvidence}/3)
- Verification Attempted: ${signals.verificationAttempted ? 'Yes' : 'No'}
- Quality Check Score: ${describeSignal('qualityCheck', signals.qualityCheckScore)} (${signals.qualityCheckScore}/3)
- Reflection Depth: ${describeSignal('reflection', signals.reflectionDepth)} (${signals.reflectionDepth}/3)
- Iteration Count: ${signals.iterationCount}
- Detection Confidence: ${(confidence * 100).toFixed(0)}%

## Conversation Summary:
${conversationSummary || 'No detailed conversation available'}

## Instructions:
Provide a JSON response with:
1. "explanation": A brief, empathetic explanation (2-3 sentences) of why this pattern was detected. Write in second person ("You...").
2. "keyBehaviors": Array of 2-3 specific behaviors observed that indicate passive dependency
3. "recommendations": Array of 2-3 actionable suggestions to develop more active learning habits
4. "riskLevel": "low", "medium", or "high" based on how strongly the pattern is exhibited

Respond ONLY with valid JSON, no markdown.`;

  try {
    const response = await callOpenAI(prompt, []);

    // Parse the LLM response
    let result: PatternExplanationResult;
    try {
      // Try to extract JSON from response
      const jsonMatch = response.content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      // Fallback if parsing fails
      result = {
        explanation: 'Based on your interaction patterns, you may be accepting AI responses without sufficient verification. This is common when learning new material.',
        keyBehaviors: [
          'Limited verification of AI responses',
          'Minimal follow-up questions',
          'Quick acceptance without critical evaluation'
        ],
        recommendations: [
          'Try asking "why" after receiving an answer',
          'Verify key facts with additional sources',
          'Attempt problems yourself before asking for help'
        ],
        riskLevel: 'medium'
      };
    }

    // Save explanation to database
    await saveExplanationToDatabase(sessionId, result);

    console.log(`[PatternExplanation:${sessionId}] Generated explanation for Pattern F`);
    return result;

  } catch (error: any) {
    console.error(`[PatternExplanation:${sessionId}] Failed to generate explanation:`, error.message);

    // Return default explanation on error
    return {
      explanation: 'We noticed you might be relying heavily on AI responses. Consider verifying answers and asking follow-up questions to deepen your understanding.',
      keyBehaviors: ['High acceptance rate', 'Limited verification'],
      recommendations: ['Ask clarifying questions', 'Verify important information'],
      riskLevel: 'medium'
    };
  }
}

/**
 * Save explanation to database (updates pattern_logs features column)
 */
async function saveExplanationToDatabase(
  sessionId: string,
  explanation: PatternExplanationResult
): Promise<void> {
  try {
    // Update the features column to include the explanation
    await pool.query(
      `UPDATE pattern_logs
       SET features = features || $1::jsonb
       WHERE session_id = $2
       ORDER BY created_at DESC
       LIMIT 1`,
      [
        JSON.stringify({
          llmExplanation: explanation,
          explanationGeneratedAt: new Date().toISOString(),
        }),
        sessionId,
      ]
    );
  } catch (error: any) {
    console.warn(`[PatternExplanation] Failed to save to database:`, error.message);
  }
}

/**
 * Queue async explanation generation (non-blocking)
 */
export function queuePatternExplanation(
  sessionId: string,
  userId: string,
  signals: BehavioralSignals,
  confidence: number,
  conversationHistory?: Array<{ role: string; content: string }>
): void {
  // Create a brief summary from conversation history
  const conversationSummary = conversationHistory
    ? conversationHistory
        .filter(msg => msg.role === 'user')
        .slice(-5)  // Last 5 user messages
        .map(msg => `- ${msg.content.slice(0, 100)}...`)
        .join('\n')
    : '';

  // Run asynchronously (fire and forget)
  setImmediate(async () => {
    try {
      await generatePatternFExplanation(
        sessionId,
        userId,
        signals,
        conversationSummary,
        confidence
      );
    } catch (error: any) {
      console.error(`[PatternExplanation:${sessionId}] Async generation failed:`, error.message);
    }
  });
}

/**
 * Get stored explanation for a session
 */
export async function getPatternExplanation(
  sessionId: string
): Promise<PatternExplanationResult | null> {
  try {
    const result = await pool.query(
      `SELECT features->'llmExplanation' as explanation
       FROM pattern_logs
       WHERE session_id = $1
       AND features->'llmExplanation' IS NOT NULL
       ORDER BY created_at DESC
       LIMIT 1`,
      [sessionId]
    );

    if (result.rows.length > 0 && result.rows[0].explanation) {
      return result.rows[0].explanation;
    }
    return null;
  } catch (error: any) {
    console.error(`[PatternExplanation] Failed to get explanation:`, error.message);
    return null;
  }
}

export default {
  generatePatternFExplanation,
  queuePatternExplanation,
  getPatternExplanation,
};
