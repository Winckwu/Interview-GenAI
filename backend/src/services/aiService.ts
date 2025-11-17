import OpenAI from 'openai';

/**
 * AI Service - Handles communication with OpenAI API
 * Securely manages API keys and model selection
 */

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
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

export default { callOpenAI, getModelInfo };
