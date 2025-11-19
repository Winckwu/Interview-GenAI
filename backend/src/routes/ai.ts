import express, { Router, Request, Response } from 'express';
import { authenticateToken } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { callOpenAI, getModelInfo } from '../services/aiService';

const router: Router = express.Router();

/**
 * POST /api/ai/chat
 * Get AI response to user prompt with conversation history
 */
router.post(
  '/chat',
  authenticateToken,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    const { userPrompt, conversationHistory = [] } = req.body;

    // Validation
    if (!userPrompt || userPrompt.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'User prompt is required',
        timestamp: new Date().toISOString(),
      });
    }

    if (userPrompt.length > 4000) {
      return res.status(400).json({
        success: false,
        error: 'Prompt too long (max 4000 characters)',
        timestamp: new Date().toISOString(),
      });
    }

    try {
      // Call OpenAI
      const startTime = Date.now();
      const aiResponse = await callOpenAI(userPrompt, conversationHistory);
      const responseTime = Date.now() - startTime;

      res.json({
        success: true,
        data: {
          response: {
            content: aiResponse.content,
            model: aiResponse.model,
            responseTime,
            usage: aiResponse.usage,
          },
        },
        message: 'AI response generated successfully',
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      console.error('AI Chat Error:', error);

      // Check for specific error types
      if (error.message.includes('API key')) {
        return res.status(500).json({
          success: false,
          error: 'AI service not properly configured',
          timestamp: new Date().toISOString(),
        });
      }

      if (error.message.includes('rate limit')) {
        return res.status(429).json({
          success: false,
          error: 'Too many requests. Please try again later.',
          timestamp: new Date().toISOString(),
        });
      }

      res.status(500).json({
        success: false,
        error: error.message || 'Failed to get AI response',
        timestamp: new Date().toISOString(),
      });
    }
  })
);

/**
 * GET /api/ai/models
 * Get available models and pricing info
 */
router.get(
  '/models',
  asyncHandler(async (_req: Request, res: Response) => {
    const models = getModelInfo();

    res.json({
      success: true,
      data: models,
      timestamp: new Date().toISOString(),
    });
  })
);

/**
 * POST /api/ai/health
 * Check if OpenAI API is accessible
 */
router.post(
  '/health',
  authenticateToken,
  asyncHandler(async (_req: Request, res: Response) => {
    try {
      // Try a simple call to test connectivity
      const testResponse = await callOpenAI('Say "ok"');

      res.json({
        success: true,
        data: {
          status: 'healthy',
          model: testResponse.model,
        },
        message: 'OpenAI API is accessible',
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      res.status(503).json({
        success: false,
        error: 'OpenAI API is not accessible',
        details: error.message,
        timestamp: new Date().toISOString(),
      });
    }
  })
);

/**
 * POST /api/ai/mr/decompose
 * MR1: Decompose a task into subtasks
 */
router.post(
  '/mr/decompose',
  authenticateToken,
  asyncHandler(async (req: Request, res: Response) => {
    const { task, strategy = 'sequential' } = req.body;

    if (!task || task.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Task description is required',
        timestamp: new Date().toISOString(),
      });
    }

    const prompt = `You are a task decomposition expert. Analyze and break down this task into manageable subtasks.

Task: "${task}"
Strategy: ${strategy}

Return a JSON object with this exact structure:
{
  "dimensions": [
    {"name": "Scope", "value": "brief assessment", "analysis": "explanation"},
    {"name": "Complexity", "value": "Low/Medium/High", "analysis": "explanation"},
    {"name": "Dependencies", "value": "list key dependencies", "analysis": "explanation"},
    {"name": "Duration", "value": "time estimate", "analysis": "explanation"},
    {"name": "Skills", "value": "required skills", "analysis": "explanation"}
  ],
  "subtasks": [
    {
      "id": "unique-id",
      "title": "subtask title",
      "description": "what needs to be done",
      "dependencies": ["id of dependent tasks"],
      "estimatedTime": "time in minutes",
      "difficulty": "low/medium/high"
    }
  ]
}

Use ${strategy} decomposition strategy:
- sequential: tasks must be done in order
- parallel: tasks can be done simultaneously
- hierarchical: tasks organized in tree structure

Return ONLY valid JSON, no markdown or explanations.`;

    try {
      const aiResponse = await callOpenAI(prompt);
      const parsed = JSON.parse(aiResponse.content);

      res.json({
        success: true,
        data: parsed,
        usage: aiResponse.usage,
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to decompose task',
        timestamp: new Date().toISOString(),
      });
    }
  })
);

/**
 * POST /api/ai/mr/variants
 * MR5: Generate prompt variants with different styles
 */
router.post(
  '/mr/variants',
  authenticateToken,
  asyncHandler(async (req: Request, res: Response) => {
    const { prompt, count = 3 } = req.body;

    if (!prompt || prompt.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Prompt is required',
        timestamp: new Date().toISOString(),
      });
    }

    const systemPrompt = `Generate ${count} different variations of responses to this prompt. Each variation should have a different style/approach.

Original prompt: "${prompt}"

Return a JSON array with this exact structure:
[
  {
    "id": "variant-1",
    "style": "style name (e.g., Concise, Detailed, Creative, Technical)",
    "content": "the response in this style",
    "characteristics": ["key traits of this response"]
  }
]

Make each variant meaningfully different in tone, length, or approach.
Return ONLY valid JSON array, no markdown.`;

    try {
      const aiResponse = await callOpenAI(systemPrompt);
      const parsed = JSON.parse(aiResponse.content);

      res.json({
        success: true,
        data: { variants: parsed },
        usage: aiResponse.usage,
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to generate variants',
        timestamp: new Date().toISOString(),
      });
    }
  })
);

/**
 * POST /api/ai/mr/critical-analysis
 * MR12: Analyze content for biases, logic issues, missing info
 */
router.post(
  '/mr/critical-analysis',
  authenticateToken,
  asyncHandler(async (req: Request, res: Response) => {
    const { content, taskType = 'general' } = req.body;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Content is required',
        timestamp: new Date().toISOString(),
      });
    }

    const prompt = `You are a critical thinking analyst. Analyze this AI-generated content for potential issues.

Content to analyze:
"${content}"

Task type: ${taskType}

Return a JSON object with this exact structure:
{
  "overallScore": 0-100,
  "issues": [
    {
      "type": "bias|logic|missing|accuracy|assumption",
      "severity": "low|medium|high",
      "location": "quote the problematic text",
      "explanation": "why this is an issue",
      "suggestion": "how to address it"
    }
  ],
  "strengths": ["list of strong points"],
  "recommendations": ["actionable suggestions for the user"]
}

Be thorough but fair. Not all content has issues.
Return ONLY valid JSON, no markdown.`;

    try {
      const aiResponse = await callOpenAI(prompt);
      const parsed = JSON.parse(aiResponse.content);

      res.json({
        success: true,
        data: parsed,
        usage: aiResponse.usage,
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to analyze content',
        timestamp: new Date().toISOString(),
      });
    }
  })
);

/**
 * POST /api/ai/mr/uncertainty
 * MR13: Identify uncertain or speculative content
 */
router.post(
  '/mr/uncertainty',
  authenticateToken,
  asyncHandler(async (req: Request, res: Response) => {
    const { content } = req.body;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Content is required',
        timestamp: new Date().toISOString(),
      });
    }

    const prompt = `Analyze this AI response and identify parts that contain uncertainty, speculation, or unverified claims.

Content:
"${content}"

Return a JSON object with this exact structure:
{
  "overallConfidence": 0-100,
  "uncertainAreas": [
    {
      "text": "the uncertain phrase or sentence",
      "type": "speculation|estimate|assumption|outdated|unverified",
      "confidence": 0-100,
      "reason": "why this is uncertain",
      "verificationSuggestion": "how to verify this"
    }
  ],
  "confidentAreas": [
    {
      "text": "well-supported statement",
      "reason": "why this is reliable"
    }
  ],
  "summary": "brief overall assessment"
}

Return ONLY valid JSON, no markdown.`;

    try {
      const aiResponse = await callOpenAI(prompt);
      const parsed = JSON.parse(aiResponse.content);

      res.json({
        success: true,
        data: parsed,
        usage: aiResponse.usage,
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to analyze uncertainty',
        timestamp: new Date().toISOString(),
      });
    }
  })
);

/**
 * POST /api/ai/mr/failure-analysis
 * MR7: Analyze AI failure and suggest improvements
 */
router.post(
  '/mr/failure-analysis',
  authenticateToken,
  asyncHandler(async (req: Request, res: Response) => {
    const { task, issue, originalPrompt, previousFailures = [] } = req.body;

    if (!task || !issue) {
      return res.status(400).json({
        success: false,
        error: 'Task and issue description are required',
        timestamp: new Date().toISOString(),
      });
    }

    const prompt = `Analyze this AI interaction failure and help the user learn from it.

Task: "${task}"
Issue: "${issue}"
Original prompt: "${originalPrompt || 'Not provided'}"
Previous similar failures: ${previousFailures.length > 0 ? JSON.stringify(previousFailures) : 'None'}

Return a JSON object with this exact structure:
{
  "rootCause": "main reason for the failure",
  "category": "prompt_clarity|context_missing|expectation_mismatch|model_limitation|wrong_tool",
  "patterns": ["recurring patterns if any"],
  "improvedPrompt": "a better version of the original prompt",
  "learningPoints": [
    {
      "point": "key lesson",
      "explanation": "why this matters",
      "example": "concrete example"
    }
  ],
  "preventionStrategies": ["how to avoid similar issues"]
}

Return ONLY valid JSON, no markdown.`;

    try {
      const aiResponse = await callOpenAI(prompt);
      const parsed = JSON.parse(aiResponse.content);

      res.json({
        success: true,
        data: parsed,
        usage: aiResponse.usage,
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to analyze failure',
        timestamp: new Date().toISOString(),
      });
    }
  })
);

/**
 * POST /api/ai/mr/reflection
 * MR14: Generate personalized reflection questions
 */
router.post(
  '/mr/reflection',
  authenticateToken,
  asyncHandler(async (req: Request, res: Response) => {
    const { messages, sessionContext = '' } = req.body;

    if (!messages || messages.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Messages are required',
        timestamp: new Date().toISOString(),
      });
    }

    const conversationSummary = messages
      .slice(-10)
      .map((m: any) => `${m.role}: ${m.content.substring(0, 200)}...`)
      .join('\n');

    const prompt = `Based on this conversation, generate personalized reflection questions to help the user learn and grow.

Conversation summary:
${conversationSummary}

Session context: ${sessionContext || 'General discussion'}

Return a JSON object with this exact structure:
{
  "immediate": [
    {"question": "reflection question", "purpose": "why this matters"}
  ],
  "structured": [
    {"question": "deeper question", "purpose": "learning goal"}
  ],
  "metacognitive": [
    {"question": "thinking-about-thinking question", "purpose": "self-awareness goal"}
  ],
  "insights": ["key observations about the conversation"],
  "growthAreas": ["suggested areas for improvement"]
}

Questions should be specific to the conversation content, not generic.
Return ONLY valid JSON, no markdown.`;

    try {
      const aiResponse = await callOpenAI(prompt);
      const parsed = JSON.parse(aiResponse.content);

      res.json({
        success: true,
        data: parsed,
        usage: aiResponse.usage,
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to generate reflection',
        timestamp: new Date().toISOString(),
      });
    }
  })
);

/**
 * POST /api/ai/mr/strategy
 * MR15: Recommend metacognitive strategies for the task
 */
router.post(
  '/mr/strategy',
  authenticateToken,
  asyncHandler(async (req: Request, res: Response) => {
    const { taskType, taskDescription = '', userLevel = 'intermediate' } = req.body;

    if (!taskType) {
      return res.status(400).json({
        success: false,
        error: 'Task type is required',
        timestamp: new Date().toISOString(),
      });
    }

    const prompt = `Recommend metacognitive strategies for this task.

Task type: ${taskType}
Task description: ${taskDescription || 'Not specified'}
User level: ${userLevel}

Return a JSON object with this exact structure:
{
  "primaryStrategy": {
    "name": "strategy name",
    "description": "what it is",
    "steps": ["step 1", "step 2"],
    "benefits": ["why it helps"],
    "whenToUse": "ideal situations"
  },
  "alternativeStrategies": [
    {
      "name": "alternative name",
      "description": "brief description",
      "tradeoffs": "pros and cons vs primary"
    }
  ],
  "pitfalls": ["common mistakes to avoid"],
  "checkpoints": [
    {"when": "timing", "check": "what to verify"}
  ],
  "adaptations": {
    "beginner": "how to simplify",
    "advanced": "how to extend"
  }
}

Return ONLY valid JSON, no markdown.`;

    try {
      const aiResponse = await callOpenAI(prompt);
      const parsed = JSON.parse(aiResponse.content);

      res.json({
        success: true,
        data: parsed,
        usage: aiResponse.usage,
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to recommend strategy',
        timestamp: new Date().toISOString(),
      });
    }
  })
);

export default router;
