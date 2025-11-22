/**
 * Web Search Service
 *
 * Provides web search functionality using Tavily API or DuckDuckGo fallback.
 * Used to augment AI responses with real-time web information.
 */

export interface SearchResult {
  title: string;
  url: string;
  content: string;
  score?: number;
}

export interface SearchResponse {
  query: string;
  results: SearchResult[];
  searchTime: number;
  source: 'tavily' | 'duckduckgo' | 'mock';
}

/**
 * Search the web using Tavily API
 * Tavily is optimized for AI applications and provides clean, relevant results
 */
async function searchWithTavily(query: string, maxResults: number = 5): Promise<SearchResult[]> {
  const apiKey = process.env.TAVILY_API_KEY;

  if (!apiKey) {
    throw new Error('TAVILY_API_KEY not configured');
  }

  const response = await fetch('https://api.tavily.com/search', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      api_key: apiKey,
      query,
      search_depth: 'basic',
      max_results: maxResults,
      include_answer: false,
      include_raw_content: false,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Tavily API error: ${response.status} - ${error}`);
  }

  const data = await response.json();

  return (data.results || []).map((result: any) => ({
    title: result.title || 'Untitled',
    url: result.url || '',
    content: result.content || result.snippet || '',
    score: result.score,
  }));
}

/**
 * Fallback search using DuckDuckGo Instant Answer API
 * Free but less comprehensive than Tavily
 */
async function searchWithDuckDuckGo(query: string, maxResults: number = 5): Promise<SearchResult[]> {
  const encodedQuery = encodeURIComponent(query);
  const response = await fetch(
    `https://api.duckduckgo.com/?q=${encodedQuery}&format=json&no_html=1&skip_disambig=1`
  );

  if (!response.ok) {
    throw new Error(`DuckDuckGo API error: ${response.status}`);
  }

  const data = await response.json();
  const results: SearchResult[] = [];

  // Abstract (main answer)
  if (data.Abstract) {
    results.push({
      title: data.Heading || query,
      url: data.AbstractURL || '',
      content: data.Abstract,
      score: 1.0,
    });
  }

  // Related topics
  if (data.RelatedTopics) {
    for (const topic of data.RelatedTopics.slice(0, maxResults - results.length)) {
      if (topic.Text && topic.FirstURL) {
        results.push({
          title: topic.Text.split(' - ')[0] || 'Related',
          url: topic.FirstURL,
          content: topic.Text,
          score: 0.8,
        });
      }
    }
  }

  return results;
}

/**
 * Mock search for development/testing when no API key is available
 */
function mockSearch(query: string): SearchResult[] {
  return [
    {
      title: `Search result for: ${query}`,
      url: 'https://example.com/result1',
      content: `This is a mock search result for "${query}". Configure TAVILY_API_KEY for real search results.`,
      score: 0.9,
    },
    {
      title: 'How to enable web search',
      url: 'https://tavily.com',
      content: 'Get your API key from tavily.com to enable real web search functionality.',
      score: 0.8,
    },
  ];
}

/**
 * Main search function with fallback chain
 */
export async function searchWeb(query: string, maxResults: number = 5): Promise<SearchResponse> {
  const startTime = Date.now();
  let results: SearchResult[] = [];
  let source: 'tavily' | 'duckduckgo' | 'mock' = 'mock';

  // Try Tavily first (best quality)
  if (process.env.TAVILY_API_KEY) {
    try {
      results = await searchWithTavily(query, maxResults);
      source = 'tavily';
    } catch (error) {
      console.error('Tavily search failed:', error);
    }
  }

  // Fallback to DuckDuckGo
  if (results.length === 0) {
    try {
      results = await searchWithDuckDuckGo(query, maxResults);
      source = 'duckduckgo';
    } catch (error) {
      console.error('DuckDuckGo search failed:', error);
    }
  }

  // Final fallback to mock
  if (results.length === 0) {
    results = mockSearch(query);
    source = 'mock';
  }

  return {
    query,
    results,
    searchTime: Date.now() - startTime,
    source,
  };
}

/**
 * Format search results for inclusion in AI prompt
 */
export function formatSearchResultsForPrompt(searchResponse: SearchResponse): string {
  if (searchResponse.results.length === 0) {
    return '';
  }

  const formatted = searchResponse.results
    .map((result, index) => {
      return `[${index + 1}] ${result.title}\nURL: ${result.url}\n${result.content}\n`;
    })
    .join('\n');

  return `\n---\nWeb Search Results for "${searchResponse.query}":\n${formatted}\n---\n`;
}

/**
 * Detect if a query would benefit from web search
 * Returns true for queries about current events, recent information, etc.
 */
export function shouldUseWebSearch(query: string): boolean {
  const webSearchIndicators = [
    // Time-sensitive
    /最新|latest|recent|current|today|now|2024|2025/i,
    // News and events
    /新闻|news|事件|event|发生|happened/i,
    // Research and facts
    /是什么|what is|how to|怎么|如何|where|在哪/i,
    // Prices and data
    /价格|price|多少钱|cost|股票|stock/i,
    // Weather
    /天气|weather|温度|temperature/i,
    // Specific entities that need current info
    /公司|company|产品|product|官网|official/i,
  ];

  return webSearchIndicators.some(pattern => pattern.test(query));
}

export default {
  searchWeb,
  formatSearchResultsForPrompt,
  shouldUseWebSearch,
};
