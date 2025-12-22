import OpenAI from 'openai';

/**
 * AI Service - Handles communication with OpenAI API
 * Securely manages API keys and model selection
 */

// Validate API key on initialization
const apiKey = process.env.OPENAI_API_KEY;
if (!apiKey) {
  console.error('WARNING: OPENAI_API_KEY is not set in environment variables!');
} else {
  console.log(`OpenAI API Key loaded (length: ${apiKey.length} chars)`);
}

const client = new OpenAI({
  apiKey: apiKey,
  timeout: 60000, // 60 seconds timeout
  maxRetries: 3,  // Retry up to 3 times on connection errors
});

const MODEL = process.env.AI_MODEL || 'gpt-4o-mini'; // Default to cost-effective model

interface AIResponse {
  content: string;
  model: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

// Streaming callback type
export type StreamCallback = (chunk: string, done: boolean) => void;

/**
 * Call OpenAI API with user prompt
 * @param userPrompt - User's message
 * @param conversationHistory - Optional previous messages for context
 * @returns AI response with token usage
 */
export const callOpenAI = async (
  userPrompt: string,
  conversationHistory: Array<{ role: string; content: string }> = []
): Promise<AIResponse> => {
  try {
    // Build messages array
    const messages: any[] = [];

    // Add system prompt
    messages.push({
      role: 'system',
      content: `You are a helpful AI assistant. Be concise, accurate, and provide clear explanations.
                Help users think critically about their tasks and learn from your responses.`,
    });

    // Add conversation history if provided
    if (conversationHistory.length > 0) {
      messages.push(...conversationHistory);
    }

    // Add current user message
    messages.push({
      role: 'user',
      content: userPrompt,
    });

    // Call OpenAI
    const response = await client.chat.completions.create({
      model: MODEL,
      messages,
      temperature: 0.7, // Balance creativity and consistency
      max_tokens: 2000,
      top_p: 0.9,
    });

    // Extract response
    const aiMessage = response.choices[0]?.message?.content || '';

    if (!aiMessage) {
      throw new Error('No content in OpenAI response');
    }

    return {
      content: aiMessage,
      model: MODEL,
      usage: {
        promptTokens: response.usage?.prompt_tokens || 0,
        completionTokens: response.usage?.completion_tokens || 0,
        totalTokens: response.usage?.total_tokens || 0,
      },
    };
  } catch (error: any) {
    console.error('OpenAI API Error:', error);
    throw new Error(`Failed to get AI response: ${error.message}`);
  }
};

/**
 * Options for streaming AI response
 */
export interface StreamOptions {
  customSystemPrompt?: string;  // MR4: Role-based system prompt to constrain AI behavior
}

/**
 * Call OpenAI API with streaming response
 * @param userPrompt - User's message
 * @param conversationHistory - Optional previous messages for context
 * @param onChunk - Callback for each streamed chunk
 * @param options - Additional options including custom system prompt
 * @returns Final usage stats
 */
export const callOpenAIStream = async (
  userPrompt: string,
  conversationHistory: Array<{ role: string; content: string }> = [],
  onChunk: StreamCallback,
  options: StreamOptions = {}
): Promise<{ model: string; content: string }> => {
  const MAX_RETRIES = 3;
  const BASE_DELAY_MS = 1000; // 1 second base delay for exponential backoff

  // Build messages array (outside retry loop to avoid rebuilding)
  const messages: any[] = [];

  // Base system prompt with reasoning instruction
  const baseSystemPrompt = `You are a helpful AI assistant. Be concise, accurate, and provide clear explanations.

**MANDATORY REQUIREMENT - MUST FOLLOW:**
You MUST start EVERY response with <thinking> tags. This is NON-NEGOTIABLE.

Required format for ALL responses:
<thinking>
1. Understanding: [what user is asking]
2. Analysis: [key considerations and factors]
3. Approach: [how you'll address this]
</thinking>

[Your actual response here]

RULES:
- ALWAYS include <thinking> tags at the START of your response
- Keep thinking section brief but meaningful (3-5 points)
- The thinking section shows your reasoning process
- NEVER skip or omit the <thinking> section

This helps users understand AI decision-making and builds transparency.`;

  // MR4: If custom role system prompt is provided, append it to base prompt
  let finalSystemPrompt = baseSystemPrompt;
  if (options.customSystemPrompt) {
    finalSystemPrompt = `${baseSystemPrompt}

---

**ROLE CONSTRAINT (MR4 - User Defined):**
${options.customSystemPrompt}

You MUST adhere to the role constraints above while maintaining the thinking format requirement.`;
  }

  // Add system prompt
  messages.push({
    role: 'system',
    content: finalSystemPrompt,
  });

  // Add conversation history if provided
  if (conversationHistory.length > 0) {
    messages.push(...conversationHistory);
  }

  // Add current user message
  messages.push({
    role: 'user',
    content: userPrompt,
  });

  // Retry loop with exponential backoff
  let lastError: Error | null = null;
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      // Call OpenAI with streaming
      const stream = await client.chat.completions.create({
        model: MODEL,
        messages,
        temperature: 0.7,
        max_tokens: 2000,
        top_p: 0.9,
        stream: true,
      });

      let fullContent = '';

      // Process stream
      for await (const chunk of stream) {
        const delta = chunk.choices[0]?.delta?.content || '';
        if (delta) {
          fullContent += delta;
          onChunk(delta, false);
        }
      }

      // Signal completion
      onChunk('', true);

      return {
        model: MODEL,
        content: fullContent,
      };
    } catch (error: any) {
      lastError = error;
      const isRetryable =
        error.message?.includes('terminated') ||
        error.message?.includes('network') ||
        error.message?.includes('timeout') ||
        error.message?.includes('ECONNRESET') ||
        error.message?.includes('ETIMEDOUT') ||
        error.code === 'ECONNRESET' ||
        error.code === 'ETIMEDOUT';

      if (!isRetryable || attempt === MAX_RETRIES - 1) {
        // Non-retryable error or last attempt
        console.error(`OpenAI Streaming Error (attempt ${attempt + 1}/${MAX_RETRIES}):`, error);
        break;
      }

      // Calculate delay with exponential backoff: 1s, 2s, 4s
      const delayMs = BASE_DELAY_MS * Math.pow(2, attempt);
      console.warn(`OpenAI stream error (attempt ${attempt + 1}/${MAX_RETRIES}), retrying in ${delayMs}ms:`, error.message);

      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }

  // All retries exhausted
  throw new Error(`Failed to stream AI response after ${MAX_RETRIES} attempts: ${lastError?.message}`);
};

/**
 * Get available models info
 */
export const getModelInfo = () => {
  return {
    currentModel: MODEL,
    availableModels: [
      {
        id: 'gpt-4o',
        name: 'GPT-4o (最优)',
        costPer1kTokens: { input: 0.015, output: 0.06 },
        speed: 'Medium',
        quality: 'Excellent',
      },
      {
        id: 'gpt-4-turbo',
        name: 'GPT-4 Turbo',
        costPer1kTokens: { input: 0.01, output: 0.03 },
        speed: 'Medium',
        quality: 'Very Good',
      },
      {
        id: 'gpt-4o-mini',
        name: 'GPT-4o Mini (推荐)',
        costPer1kTokens: { input: 0.00015, output: 0.0006 },
        speed: 'Fast',
        quality: 'Good',
      },
      {
        id: 'gpt-3.5-turbo',
        name: 'GPT-3.5 Turbo (成本低)',
        costPer1kTokens: { input: 0.0005, output: 0.0015 },
        speed: 'Very Fast',
        quality: 'Good',
      },
    ],
  };
};

/**
 * Generate multiple variants with different parameters
 * @param userPrompt - User's message
 * @param variants - Array of variant configurations
 * @returns Array of AI responses with different parameters
 */
export const generateBatchVariants = async (
  userPrompt: string,
  conversationHistory: Array<{ role: string; content: string }> = [],
  variants: Array<{
    temperature?: number;
    style?: string;
    maxTokens?: number;
  }> = []
): Promise<Array<AIResponse & { variantConfig: any }>> => {
  try {
    // If no variants specified, use default presets
    if (variants.length === 0) {
      variants = [
        { temperature: 0.3, style: 'precise', maxTokens: 2000 },
        { temperature: 0.7, style: 'balanced', maxTokens: 2000 },
        { temperature: 0.9, style: 'creative', maxTokens: 2000 },
      ];
    }

    // Build base messages
    const baseMessages: any[] = [
      {
        role: 'system',
        content: `You are a helpful AI assistant. Be concise, accurate, and provide clear explanations.
                  Help users think critically about their tasks and learn from your responses.`,
      },
      ...conversationHistory,
      {
        role: 'user',
        content: userPrompt,
      },
    ];

    // Generate all variants in parallel
    const variantPromises = variants.map(async (variant) => {
      // Adjust system prompt based on style
      let systemPrompt = baseMessages[0].content;
      if (variant.style === 'formal') {
        systemPrompt += ' Use formal, professional language.';
      } else if (variant.style === 'casual') {
        systemPrompt += ' Use casual, friendly language.';
      } else if (variant.style === 'technical') {
        systemPrompt += ' Use technical, detailed language with precise terminology.';
      } else if (variant.style === 'creative') {
        systemPrompt += ' Be creative and think outside the box.';
      } else if (variant.style === 'precise') {
        systemPrompt += ' Be extremely precise and accurate. Stick to facts.';
      }

      const messages = [
        { role: 'system', content: systemPrompt },
        ...baseMessages.slice(1),
      ];

      const response = await client.chat.completions.create({
        model: MODEL,
        messages,
        temperature: variant.temperature ?? 0.7,
        max_tokens: variant.maxTokens ?? 2000,
        top_p: 0.9,
      });

      const aiMessage = response.choices[0]?.message?.content || '';

      return {
        content: aiMessage,
        model: MODEL,
        usage: {
          promptTokens: response.usage?.prompt_tokens || 0,
          completionTokens: response.usage?.completion_tokens || 0,
          totalTokens: response.usage?.total_tokens || 0,
        },
        variantConfig: variant,
      };
    });

    return await Promise.all(variantPromises);
  } catch (error: any) {
    console.error('Batch Variants Generation Error:', error);
    throw new Error(`Failed to generate batch variants: ${error.message}`);
  }
};

/**
 * Call multiple AI models in parallel for comparison
 * @param userPrompt - User's message
 * @param models - Array of model IDs to use
 * @returns Array of responses from different models
 */
export const callMultipleModels = async (
  userPrompt: string,
  conversationHistory: Array<{ role: string; content: string }> = [],
  models: string[] = []
): Promise<Array<AIResponse & { modelId: string; latency: number }>> => {
  try {
    // If no models specified, use defaults
    if (models.length === 0) {
      models = ['gpt-4o-mini', 'gpt-3.5-turbo'];
    }

    // Filter to only OpenAI models (Claude/Gemini would need separate API clients)
    const supportedModels = models.filter((m) =>
      ['gpt-4o', 'gpt-4-turbo', 'gpt-4o-mini', 'gpt-3.5-turbo', 'gpt-4'].includes(m)
    );

    if (supportedModels.length === 0) {
      throw new Error('No supported models specified');
    }

    // Build messages
    const messages: any[] = [
      {
        role: 'system',
        content: `You are a helpful AI assistant. Be concise, accurate, and provide clear explanations.
                  Help users think critically about their tasks and learn from your responses.`,
      },
      ...conversationHistory,
      {
        role: 'user',
        content: userPrompt,
      },
    ];

    // Call all models in parallel
    const modelPromises = supportedModels.map(async (modelId) => {
      const startTime = Date.now();

      const response = await client.chat.completions.create({
        model: modelId,
        messages,
        temperature: 0.7,
        max_tokens: 2000,
        top_p: 0.9,
      });

      const latency = Date.now() - startTime;
      const aiMessage = response.choices[0]?.message?.content || '';

      return {
        content: aiMessage,
        model: modelId,
        modelId,
        latency,
        usage: {
          promptTokens: response.usage?.prompt_tokens || 0,
          completionTokens: response.usage?.completion_tokens || 0,
          totalTokens: response.usage?.total_tokens || 0,
        },
      };
    });

    return await Promise.all(modelPromises);
  } catch (error: any) {
    console.error('Multi-Model Call Error:', error);
    throw new Error(`Failed to call multiple models: ${error.message}`);
  }
};

export default { callOpenAI, callOpenAIStream, getModelInfo, generateBatchVariants, callMultipleModels };
