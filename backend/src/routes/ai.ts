import express, { Router, Request, Response } from 'express';
import { authenticateToken } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { callOpenAI, callOpenAIStream, getModelInfo, generateBatchVariants, callMultipleModels } from '../services/aiService';
import { searchWeb, formatSearchResultsForPrompt, shouldUseWebSearch } from '../services/webSearchService';

const router: Router = express.Router();

/**
 * POST /api/ai/chat
 * Get AI response to user prompt with conversation history
 * Supports optional web search augmentation
 */
router.post(
  '/chat',
  authenticateToken,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    const { userPrompt, conversationHistory = [], useWebSearch = false, autoDetectSearch = false } = req.body;

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
      const startTime = Date.now();
      let searchResults = null;
      let enhancedPrompt = userPrompt;

      // Determine if we should use web search
      const shouldSearch = useWebSearch || (autoDetectSearch && shouldUseWebSearch(userPrompt));

      if (shouldSearch) {
        try {
          console.log(`[Web Search] Searching for: ${userPrompt.substring(0, 100)}...`);
          searchResults = await searchWeb(userPrompt, 5);
          console.log(`[Web Search] Found ${searchResults.results.length} results from ${searchResults.source}`);

          // Enhance prompt with search results
          const searchContext = formatSearchResultsForPrompt(searchResults);
          enhancedPrompt = `${userPrompt}\n\nPlease use the following web search results to inform your response:\n${searchContext}\n\nBased on the search results above, please answer the original question. If the search results are relevant, cite them in your response. If they are not relevant, you may ignore them.`;
        } catch (searchError) {
          console.error('[Web Search] Error:', searchError);
          // Continue without search results
        }
      }

      // Call OpenAI with potentially enhanced prompt
      const aiResponse = await callOpenAI(enhancedPrompt, conversationHistory);
      const responseTime = Date.now() - startTime;

      res.json({
        success: true,
        data: {
          response: {
            content: aiResponse.content,
            model: aiResponse.model,
            responseTime,
            usage: aiResponse.usage,
            webSearchUsed: shouldSearch && searchResults !== null,
            searchResults: searchResults ? {
              query: searchResults.query,
              source: searchResults.source,
              resultCount: searchResults.results.length,
              results: searchResults.results.slice(0, 3).map(r => ({
                title: r.title,
                url: r.url,
              })),
            } : null,
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
 * POST /api/ai/chat/stream
 * Get AI response with Server-Sent Events (SSE) streaming
 * Provides real-time token-by-token response like Claude
 */
router.post(
  '/chat/stream',
  authenticateToken,
  async (req: Request, res: Response) => {
    const {
      userPrompt,
      conversationHistory = [],
      useWebSearch = false,
      autoDetectSearch = false,
      systemPrompt,  // MR4: Role-based system prompt to constrain AI behavior
    } = req.body;

    // Validation
    if (!userPrompt || userPrompt.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'User prompt is required',
      });
    }

    if (userPrompt.length > 4000) {
      return res.status(400).json({
        success: false,
        error: 'Prompt too long (max 4000 characters)',
      });
    }

    // Set SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // Disable nginx buffering
    res.flushHeaders();

    try {
      const startTime = Date.now();
      let searchResults = null;
      let enhancedPrompt = userPrompt;

      // Determine if we should use web search
      const shouldSearch = useWebSearch || (autoDetectSearch && shouldUseWebSearch(userPrompt));

      if (shouldSearch) {
        try {
          console.log(`[Web Search] Searching for: ${userPrompt.substring(0, 100)}...`);
          searchResults = await searchWeb(userPrompt, 5);
          console.log(`[Web Search] Found ${searchResults.results.length} results from ${searchResults.source}`);

          const searchContext = formatSearchResultsForPrompt(searchResults);
          enhancedPrompt = `${userPrompt}\n\nPlease use the following web search results to inform your response:\n${searchContext}\n\nBased on the search results above, please answer the original question. If the search results are relevant, cite them in your response. If they are not relevant, you may ignore them.`;

          // Send search results first
          res.write(`data: ${JSON.stringify({
            type: 'search',
            searchResults: {
              query: searchResults.query,
              source: searchResults.source,
              resultCount: searchResults.results.length,
              results: searchResults.results.slice(0, 3).map(r => ({
                title: r.title,
                url: r.url,
              })),
            }
          })}\n\n`);
        } catch (searchError) {
          console.error('[Web Search] Error:', searchError);
        }
      }

      // Stream AI response
      // MR4: Pass custom system prompt if provided for role constraint
      let fullContent = '';
      await callOpenAIStream(
        enhancedPrompt,
        conversationHistory,
        (chunk, done) => {
          if (done) {
            const responseTime = Date.now() - startTime;

            // Parse reasoning from <thinking> tags
            let reasoning = null;
            let cleanContent = fullContent;
            const thinkingMatch = fullContent.match(/<thinking>([\s\S]*?)<\/thinking>/);
            if (thinkingMatch) {
              reasoning = thinkingMatch[1].trim();
              // Remove thinking tags from display content
              cleanContent = fullContent.replace(/<thinking>[\s\S]*?<\/thinking>\s*/, '').trim();
              console.log('[AI] Extracted reasoning:', reasoning.substring(0, 100) + '...');
            } else {
              console.log('[AI] No <thinking> tags found in response. First 200 chars:', fullContent.substring(0, 200));
            }

            // Send completion event with metadata and reasoning
            res.write(`data: ${JSON.stringify({
              type: 'done',
              responseTime,
              webSearchUsed: shouldSearch && searchResults !== null,
              reasoning,
              cleanContent,
            })}\n\n`);
            res.end();
          } else {
            fullContent += chunk;
            // Send chunk (including thinking tags - frontend will handle display)
            res.write(`data: ${JSON.stringify({
              type: 'chunk',
              content: chunk
            })}\n\n`);
          }
        },
        { customSystemPrompt: systemPrompt }  // MR4: Role constraint
      );
    } catch (error: any) {
      console.error('AI Stream Error:', error);
      res.write(`data: ${JSON.stringify({
        type: 'error',
        error: error.message || 'Failed to stream AI response'
      })}\n\n`);
      res.end();
    }
  }
);

/**
 * POST /api/ai/search
 * Perform web search and return results
 */
router.post(
  '/search',
  authenticateToken,
  asyncHandler(async (req: Request, res: Response) => {
    const { query, maxResults = 5 } = req.body;

    if (!query || query.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Search query is required',
        timestamp: new Date().toISOString(),
      });
    }

    try {
      const searchResponse = await searchWeb(query, Math.min(maxResults, 10));

      res.json({
        success: true,
        data: {
          query: searchResponse.query,
          source: searchResponse.source,
          searchTime: searchResponse.searchTime,
          results: searchResponse.results,
        },
        message: `Found ${searchResponse.results.length} results`,
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      console.error('Web Search Error:', error);

      res.status(500).json({
        success: false,
        error: error.message || 'Search failed',
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

    const prompt = `You are a task decomposition expert and mentor. Analyze and break down this task into manageable subtasks with actionable guidance.

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
      "difficulty": "low/medium/high",
      "verificationMethod": "how to verify this subtask is complete",
      "howToApproach": ["step 1: specific action", "step 2: specific action", "step 3: specific action"],
      "tips": ["practical tip 1", "practical tip 2"],
      "aiCanHelp": ["specific way AI can assist", "another way AI can help"],
      "resources": ["tool or reference that might help"]
    }
  ]
}

IMPORTANT: For each subtask, provide:
- howToApproach: 2-4 concrete steps the user should take
- tips: 1-2 practical tips or best practices
- aiCanHelp: 1-2 specific ways AI can assist with this subtask
- resources: any tools, references, or skills needed

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

/**
 * POST /api/ai/batch-variants
 * Generate multiple variants with different parameters (temperature, style)
 * Supports MR5: Low-Cost Iteration Mechanism
 */
router.post(
  '/batch-variants',
  authenticateToken,
  asyncHandler(async (req: Request, res: Response) => {
    const { userPrompt, conversationHistory = [], variants = [] } = req.body;

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
      const startTime = Date.now();
      const responses = await generateBatchVariants(userPrompt, conversationHistory, variants);
      const totalTime = Date.now() - startTime;

      res.json({
        success: true,
        data: {
          variants: responses.map((r, idx) => ({
            id: `variant-${idx + 1}`,
            content: r.content,
            model: r.model,
            config: r.variantConfig,
            usage: r.usage,
          })),
          totalTime,
          count: responses.length,
        },
        message: `Generated ${responses.length} variants successfully`,
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      console.error('Batch Variants Error:', error);

      res.status(500).json({
        success: false,
        error: error.message || 'Failed to generate batch variants',
        timestamp: new Date().toISOString(),
      });
    }
  })
);

/**
 * POST /api/ai/multi-model
 * Call multiple AI models in parallel for comparison
 * Supports MR6: Cross-Model Experimentation
 */
router.post(
  '/multi-model',
  authenticateToken,
  asyncHandler(async (req: Request, res: Response) => {
    const { userPrompt, conversationHistory = [], models = [] } = req.body;

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
      const startTime = Date.now();
      const responses = await callMultipleModels(userPrompt, conversationHistory, models);
      const totalTime = Date.now() - startTime;

      // Calculate cost estimates (simplified)
      const costEstimates: Record<string, any> = {
        'gpt-4o': { input: 0.015, output: 0.06 },
        'gpt-4-turbo': { input: 0.01, output: 0.03 },
        'gpt-4o-mini': { input: 0.00015, output: 0.0006 },
        'gpt-3.5-turbo': { input: 0.0005, output: 0.0015 },
      };

      res.json({
        success: true,
        data: {
          comparisons: responses.map((r, idx) => {
            const costs = costEstimates[r.modelId] || { input: 0, output: 0 };
            const estimatedCost =
              (r.usage.promptTokens / 1000) * costs.input +
              (r.usage.completionTokens / 1000) * costs.output;

            return {
              id: `model-${idx + 1}`,
              modelId: r.modelId,
              modelName: r.model,
              content: r.content,
              latency: r.latency,
              usage: r.usage,
              estimatedCost: estimatedCost.toFixed(4),
            };
          }),
          totalTime,
          count: responses.length,
        },
        message: `Compared ${responses.length} models successfully`,
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      console.error('Multi-Model Error:', error);

      res.status(500).json({
        success: false,
        error: error.message || 'Failed to call multiple models',
        timestamp: new Date().toISOString(),
      });
    }
  })
);

export default router;
