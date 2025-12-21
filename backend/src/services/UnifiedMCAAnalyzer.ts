/**
 * Unified MCA Analyzer
 *
 * Uses GPT to perform comprehensive analysis in a single API call:
 * 1. Accurate behavioral signal detection
 * 2. Pattern classification
 * 3. MR activation decisions
 * 4. Pre-generated content for triggered MRs
 */

import { callOpenAI } from './aiService';

export interface BehaviorSignals {
  taskComplexity: number;           // 0-3
  taskDecompositionEvidence: number; // 0-3
  aiRelianceDegree: number;         // 0-3
  verificationIntent: boolean;
  reflectionDepth: number;          // 0-3
  goalClarity: number;              // 0-3
  strategyMentioned: boolean;
}

export interface PatternPrediction {
  pattern: 'A' | 'B' | 'C' | 'D' | 'E' | 'F';
  confidence: number;
  reasoning: string;
}

export interface MRContent {
  mrId: string;
  shouldTrigger: boolean;
  priority: 'high' | 'medium' | 'low';
  tier: 'soft' | 'medium' | 'hard';
  message: string;
  content: any;
}

export interface UnifiedAnalysisResult {
  signals: BehaviorSignals;
  pattern: PatternPrediction;
  activeMRs: MRContent[];
  analysisReasoning: string;
}

export class UnifiedMCAAnalyzer {
  /**
   * Perform comprehensive MCA analysis using GPT
   */
  static async analyze(
    userMessage: string,
    conversationHistory: Array<{ role: string; content: string }>,
    sessionContext?: {
      taskType?: string;
      turnCount?: number;
    }
  ): Promise<UnifiedAnalysisResult> {

    const historyText = conversationHistory
      .slice(-6) // Last 6 messages for context
      .map(m => `${m.role}: ${m.content}`)
      .join('\n');

    const prompt = `You are a Metacognitive Analysis Agent. Analyze this user message and conversation to detect behavioral patterns and recommend interventions.

## Current User Message:
"${userMessage}"

## Recent Conversation History:
${historyText || '(First message in conversation)'}

## Task Context:
- Task Type: ${sessionContext?.taskType || 'general'}
- Turn Count: ${sessionContext?.turnCount || 1}

## Your Analysis Tasks:

### 1. Behavioral Signals (rate 0-3)
Analyze the user's metacognitive behaviors:
- taskComplexity: How complex is the requested task? (0=trivial, 3=very complex)
- taskDecompositionEvidence: Did user break down the task? (0=no, 3=detailed breakdown)
- aiRelianceDegree: How much is user relying on AI? (0=independent, 3=full dependence)
- verificationIntent: Does user plan to verify? (true/false)
- reflectionDepth: Is user reflecting on process? (0=none, 3=deep)
- goalClarity: How clear are the goals? (0=vague, 3=crystal clear)
- strategyMentioned: Did user mention an approach? (true/false)

### 2. Pattern Classification
Classify into one of these patterns:
- A: Strategic Learner (plans, verifies, reflects)
- B: Efficient Executor (gets things done but skips verification)
- C: Curious Explorer (asks many questions, explores)
- D: Passive Consumer (minimal engagement)
- E: Critical Thinker (questions everything, verifies)
- F: Over-reliant User (depends heavily on AI without verification)

### 3. MR Activation & Content Generation
Based on signals, determine which MRs should trigger and pre-generate their content:

**MR1 (Task Decomposition)** - Trigger if: taskComplexity > 1.5 AND taskDecompositionEvidence < 2
If triggered, generate subtasks for the user's task.

**MR13 (Uncertainty Display)** - Trigger if: taskComplexity > 1
If triggered, identify uncertain aspects in the AI's potential response.

**MR14 (Guided Reflection)** - Trigger if: reflectionDepth < 1 AND turnCount > 2
If triggered, generate 3 reflection questions.

**MR12 (Critical Thinking)** - Trigger if: verificationIntent == false AND aiRelianceDegree > 2
If triggered, generate critical thinking prompts.

**MR18 (Over-Dependence Warning)** - Trigger if: aiRelianceDegree >= 3 AND verificationIntent == false AND reflectionDepth < 1 AND turnCount > 3
This is a warning pattern - ONLY trigger after user has had at least 3 exchanges with AI. Do NOT trigger on first few messages.

### 4. Tier Selection Guidelines (CRITICAL - Follow Strictly)
For each triggered MR, assign the appropriate tier:

- **"soft"**: DEFAULT tier. Use for most MRs (MR1, MR13, MR14, etc.). Gentle blue notification.

- **"medium"**: Use sparingly for moderate concerns. Orange popup alert.
  Criteria: aiRelianceDegree >= 2 AND (verificationIntent == false OR reflectionDepth < 1) AND turnCount > 2
  IMPORTANT: Never use medium tier on the first 2 turns of a conversation.

- **"hard"**: RARELY USED. Red blocking modal. Use ONLY for MR18 AND ALL of these must be true:
  * aiRelianceDegree == 3 (MUST be exactly 3, complete reliance)
  * verificationIntent == false
  * reflectionDepth == 0 (MUST be exactly 0)
  * Pattern is F with confidence > 0.7
  * turnCount > 3 (not early in conversation)

IMPORTANT: Most interventions should be "soft" or "medium". Use "hard" very rarely (less than 10% of cases).

## Response Format (JSON only):
{
  "signals": {
    "taskComplexity": <0-3>,
    "taskDecompositionEvidence": <0-3>,
    "aiRelianceDegree": <0-3>,
    "verificationIntent": <boolean>,
    "reflectionDepth": <0-3>,
    "goalClarity": <0-3>,
    "strategyMentioned": <boolean>
  },
  "pattern": {
    "pattern": "<A-F>",
    "confidence": <0-1>,
    "reasoning": "<brief explanation>"
  },
  "activeMRs": [
    {
      "mrId": "MR1",
      "shouldTrigger": true,
      "priority": "high",
      "tier": "soft",
      "message": "This task is complex. Breaking it into smaller steps will help you manage it better.",
      "content": {
        "suggestedSubtasks": [
          {"id": "1", "title": "...", "description": "...", "estimatedTime": "..."}
        ],
        "reasoning": "..."
      }
    },
    {
      "mrId": "MR18",
      "shouldTrigger": true,
      "priority": "high",
      "tier": "medium",
      "message": "Consider verifying this AI response before proceeding.",
      "content": {
        "warningType": "over-dependence",
        "suggestions": ["Verify key facts", "Consider alternative approaches", "Question assumptions"]
      }
    }
  ],
  "analysisReasoning": "<overall analysis summary>"
}

Return ONLY valid JSON. Generate content for ALL triggered MRs.`;

    try {
      const response = await callOpenAI(prompt);
      const result = JSON.parse(response.content);

      // Validate and normalize the response
      return this.normalizeResult(result);
    } catch (error: any) {
      console.error('UnifiedMCAAnalyzer error:', error);
      // Return default/fallback result
      return this.getDefaultResult();
    }
  }

  /**
   * Normalize and validate the GPT response
   */
  private static normalizeResult(result: any): UnifiedAnalysisResult {
    return {
      signals: {
        taskComplexity: this.clamp(result.signals?.taskComplexity ?? 1, 0, 3),
        taskDecompositionEvidence: this.clamp(result.signals?.taskDecompositionEvidence ?? 0, 0, 3),
        aiRelianceDegree: this.clamp(result.signals?.aiRelianceDegree ?? 1, 0, 3),
        verificationIntent: result.signals?.verificationIntent ?? false,
        reflectionDepth: this.clamp(result.signals?.reflectionDepth ?? 0, 0, 3),
        goalClarity: this.clamp(result.signals?.goalClarity ?? 1, 0, 3),
        strategyMentioned: result.signals?.strategyMentioned ?? false,
      },
      pattern: {
        pattern: result.pattern?.pattern || 'B',
        confidence: this.clamp(result.pattern?.confidence ?? 0.5, 0, 1),
        reasoning: result.pattern?.reasoning || 'Default classification',
      },
      activeMRs: (result.activeMRs || []).filter((mr: any) => mr.shouldTrigger),
      analysisReasoning: result.analysisReasoning || 'Analysis completed',
    };
  }

  /**
   * Get default result when analysis fails
   */
  private static getDefaultResult(): UnifiedAnalysisResult {
    return {
      signals: {
        taskComplexity: 1,
        taskDecompositionEvidence: 0,
        aiRelianceDegree: 1,
        verificationIntent: false,
        reflectionDepth: 0,
        goalClarity: 1,
        strategyMentioned: false,
      },
      pattern: {
        pattern: 'B',
        confidence: 0.5,
        reasoning: 'Default classification due to analysis error',
      },
      activeMRs: [],
      analysisReasoning: 'Analysis failed, using defaults',
    };
  }

  private static clamp(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max);
  }
}

export default UnifiedMCAAnalyzer;
