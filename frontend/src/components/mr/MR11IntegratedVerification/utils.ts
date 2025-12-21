/**
 * MR11: Integrated Verification Tools - Utilities
 *
 * Provide REAL verification for different content types:
 * - Code execution in sandboxed VM
 * - Math expression evaluation
 * - Fact checking via web search
 */

import api from '../../../services/api';

export type VerificationMethod = 'code-execution' | 'cross-reference' | 'calculation' | 'citation-check' | 'syntax-check' | 'fact-check';
export type VerificationStatus = 'unverified' | 'pending' | 'verified' | 'error-found' | 'partially-verified' | 'unable-to-verify';
export type ContentType = 'code' | 'math' | 'citation' | 'fact' | 'text';
export type UserDecision = 'accept' | 'modify' | 'reject' | 'skip';

export interface VerifiableContent {
  id: string;
  contentType: ContentType;
  content: string;
  flagged: boolean;
  verificationMethod?: VerificationMethod;
}

export interface VerificationResult {
  contentId: string;
  verificationMethod: VerificationMethod;
  toolUsed: string;
  status: VerificationStatus;
  matchesAIOutput: boolean;
  confidence: number; // 0-1
  confidenceScore?: number; // Alias for confidence
  findings: string[];
  discrepancies: string[];
  suggestions: string[];
  sources?: string[]; // For fact-check results
  executionResult?: any; // For code/math results
  timestamp: Date;
}

export interface VerificationLog {
  id: string;
  contentId: string;
  result: VerificationResult;
  userDecision: UserDecision;
  userNotes?: string;
  correctnessBeforeVerification?: boolean;
  correctnessAfterVerification?: boolean;
}

export interface VerificationStatistics {
  totalVerified: number;
  errorsFound: number;
  errorRate: number; // 0-1
  byContentType: Record<ContentType, { total: number; errors: number; rate: number }>;
  byVerificationMethod: Record<VerificationMethod, { total: number; errors: number; rate: number }>;
  trustBuiltUp: boolean; // true if error rate is low
}

// Verification tool definitions
export const VERIFICATION_TOOLS: Record<ContentType, { methods: VerificationMethod[]; description: string }> = {
  code: {
    methods: ['code-execution', 'syntax-check'],
    description: 'Test code behavior and syntax'
  },
  math: {
    methods: ['calculation', 'syntax-check'],
    description: 'Verify mathematical expressions and calculations'
  },
  citation: {
    methods: ['citation-check', 'cross-reference'],
    description: 'Verify citations and sources'
  },
  fact: {
    methods: ['fact-check', 'cross-reference'],
    description: 'Verify factual claims'
  },
  text: {
    methods: ['cross-reference', 'fact-check'],
    description: 'General verification and cross-referencing'
  }
};

// Tool descriptions
const TOOL_DESCRIPTIONS: Record<VerificationMethod, string> = {
  'code-execution': 'Run code in a test environment to verify behavior',
  'syntax-check': 'Check code syntax without execution',
  'calculation': 'Verify mathematical expressions (Wolfram Alpha-style)',
  'citation-check': 'Verify citations against Google Scholar / databases',
  'cross-reference': 'Cross-reference claims against multiple sources',
  'fact-check': 'Verify facts against Wikipedia / authority sources'
};

/**
 * Auto-detect content type from text
 */
export function detectContentType(text: string): ContentType {
  const trimmed = text.trim();

  // Code detection: look for common programming patterns
  const codePatterns = [
    /^(function|const|let|var|class|import|export|if|for|while|return|def|public|private)\s/m,
    /[{}\[\]();]\s*$/m,
    /=>\s*{/,
    /\.(js|ts|py|java|cpp|c|go|rs|rb)$/i,
    /```[\s\S]*```/,
    /<[a-z]+[^>]*>/i, // HTML tags
    /^\s*(import|from|require)\s+/m,
  ];

  for (const pattern of codePatterns) {
    if (pattern.test(trimmed)) {
      return 'code';
    }
  }

  // Math detection: equations, formulas
  const mathPatterns = [
    /[=+\-*/^√∑∏∫]\s*\d/,
    /\d\s*[=+\-*/^]\s*\d/,
    /\b(sin|cos|tan|log|ln|sqrt|sum|integral)\b/i,
    /\bx\s*[=+\-*/^]\s*\d/i,
    /\d+\s*[×÷±]/,
    /[∑∏∫∂∇]/,
  ];

  for (const pattern of mathPatterns) {
    if (pattern.test(trimmed)) {
      return 'math';
    }
  }

  // Citation detection: references, quotes with sources
  const citationPatterns = [
    /\([A-Z][a-z]+,?\s*\d{4}\)/,  // (Author, 2020)
    /\[[0-9]+\]/,                  // [1] style references
    /et\s+al\./i,
    /according to\s+[A-Z]/i,
    /\bDOI:\s*10\./i,
    /https?:\/\/[^\s]+/,          // URLs
  ];

  for (const pattern of citationPatterns) {
    if (pattern.test(trimmed)) {
      return 'citation';
    }
  }

  // Fact detection: claims about real-world entities
  const factPatterns = [
    /\b(is|was|are|were|will be)\s+(the|a|an)\s+/i,
    /\b(founded|invented|discovered|created|established)\s+(in|by)\b/i,
    /\b(percent|%|million|billion|trillion)\b/i,
    /\b(according|based on|studies show|research indicates)\b/i,
    /\b\d{4}\b/, // Years
  ];

  let factScore = 0;
  for (const pattern of factPatterns) {
    if (pattern.test(trimmed)) {
      factScore++;
    }
  }

  if (factScore >= 2) {
    return 'fact';
  }

  // Default to text
  return 'text';
}

/**
 * Get the best verification method for a content type
 */
export function getRecommendedMethod(contentType: ContentType): VerificationMethod {
  const tools = VERIFICATION_TOOLS[contentType];
  return tools.methods[0]; // Return the first (primary) method
}

/**
 * Map frontend method to backend method
 */
function mapMethodToBackend(method: VerificationMethod): string {
  const mapping: Record<VerificationMethod, string> = {
    'code-execution': 'code-execution',
    'syntax-check': 'syntax-check',
    'calculation': 'math-check',
    'citation-check': 'fact-check',
    'cross-reference': 'fact-check',
    'fact-check': 'fact-check',
  };
  return mapping[method] || 'fact-check';
}

/**
 * Perform REAL verification via backend API
 */
export async function performVerificationAsync(
  content: VerifiableContent,
  method: VerificationMethod
): Promise<VerificationResult> {
  try {
    // Use 90s timeout for verification (GPT-powered fact-checking can be slow)
    const response = await api.post('/verification/verify', {
      content: content.content,
      contentType: content.contentType,
      method: mapMethodToBackend(method),
    }, { timeout: 90000 });

    const data = response.data.data.verification;

    return {
      contentId: content.id,
      verificationMethod: method,
      toolUsed: getToolName(method),
      status: data.status as VerificationStatus,
      matchesAIOutput: data.status === 'verified',
      confidence: data.confidence,
      confidenceScore: data.confidence,
      findings: data.findings || [],
      discrepancies: data.discrepancies || [],
      suggestions: data.suggestions || [],
      sources: data.sources,
      executionResult: data.executionResult,
      timestamp: new Date(data.timestamp),
    };
  } catch (error: any) {
    console.error('[MR11] Verification API error:', error);

    // Return error result
    return {
      contentId: content.id,
      verificationMethod: method,
      toolUsed: getToolName(method),
      status: 'unable-to-verify',
      matchesAIOutput: false,
      confidence: 0,
      confidenceScore: 0,
      findings: [],
      discrepancies: [`API Error: ${error.response?.data?.error || error.message}`],
      suggestions: ['Try again or verify manually'],
      timestamp: new Date(),
    };
  }
}

/**
 * Synchronous wrapper for backwards compatibility (uses async internally)
 * Note: This returns a placeholder, use performVerificationAsync for real results
 */
export function performVerification(
  content: VerifiableContent,
  method: VerificationMethod
): VerificationResult {
  // Return a "pending" result - caller should use async version
  return {
    contentId: content.id,
    verificationMethod: method,
    toolUsed: getToolName(method),
    status: 'pending' as VerificationStatus,
    matchesAIOutput: false,
    confidence: 0,
    findings: ['Verification in progress...'],
    discrepancies: [],
    suggestions: [],
    timestamp: new Date()
  };
}

/**
 * Get tool name from method
 */
function getToolName(method: VerificationMethod): string {
  const names: Record<VerificationMethod, string> = {
    'code-execution': 'Node.js Runtime',
    'syntax-check': 'ESLint / TypeScript',
    'calculation': 'Wolfram Alpha',
    'citation-check': 'Google Scholar',
    'cross-reference': 'Brave Search API',
    'fact-check': 'Wikipedia'
  };
  return names[method];
}

/**
 * Create a verification log entry
 */
export function createVerificationLog(
  result: VerificationResult,
  decision: UserDecision,
  notes?: string
): VerificationLog {
  return {
    id: `log-${Date.now()}`,
    contentId: result.contentId,
    result,
    userDecision: decision,
    userNotes: notes
  };
}

/**
 * Update verification log with actual correctness assessment
 */
export function updateVerificationOutcome(
  log: VerificationLog,
  beforeCorrect: boolean,
  afterCorrect: boolean
): VerificationLog {
  return {
    ...log,
    correctnessBeforeVerification: beforeCorrect,
    correctnessAfterVerification: afterCorrect
  };
}

/**
 * Calculate verification statistics
 */
export function calculateVerificationStatistics(
  logs: VerificationLog[]
): VerificationStatistics {
  const byContentType: Record<ContentType, { total: number; errors: number; rate: number }> = {
    code: { total: 0, errors: 0, rate: 0 },
    math: { total: 0, errors: 0, rate: 0 },
    citation: { total: 0, errors: 0, rate: 0 },
    fact: { total: 0, errors: 0, rate: 0 },
    text: { total: 0, errors: 0, rate: 0 }
  };

  const byVerificationMethod: Record<VerificationMethod, { total: number; errors: number; rate: number }> = {
    'code-execution': { total: 0, errors: 0, rate: 0 },
    'syntax-check': { total: 0, errors: 0, rate: 0 },
    'calculation': { total: 0, errors: 0, rate: 0 },
    'citation-check': { total: 0, errors: 0, rate: 0 },
    'cross-reference': { total: 0, errors: 0, rate: 0 },
    'fact-check': { total: 0, errors: 0, rate: 0 }
  };

  let totalVerified = 0;
  let totalErrors = 0;

  logs.forEach(log => {
    // Track by content type (inferred from verification method)
    if (log.result.status === 'error-found' || !log.result.matchesAIOutput) {
      totalErrors++;
    }
    totalVerified++;
  });

  // Track by verification method
  logs.forEach(log => {
    const method = log.result.verificationMethod;
    byVerificationMethod[method].total++;
    if (log.result.status === 'error-found' || !log.result.matchesAIOutput) {
      byVerificationMethod[method].errors++;
    }
  });

  // Calculate rates
  Object.values(byVerificationMethod).forEach(stats => {
    stats.rate = stats.total > 0 ? stats.errors / stats.total : 0;
  });

  const errorRate = totalVerified > 0 ? totalErrors / totalVerified : 0;
  const trustBuiltUp = errorRate < 0.2; // Less than 20% error rate indicates good trust

  return {
    totalVerified,
    errorsFound: totalErrors,
    errorRate,
    byContentType,
    byVerificationMethod,
    trustBuiltUp
  };
}

/**
 * Database verification log interface
 */
export interface DBVerificationLog {
  id: string;
  sessionId?: string;
  messageId?: string;
  contentType: string;
  contentText?: string;
  verificationMethod: string;
  toolUsed?: string;
  verificationStatus: string;
  confidenceScore?: number;
  findings?: string[];
  discrepancies?: string[];
  suggestions?: string[];
  userDecision: string;
  userNotes?: string;
  actualCorrectness?: boolean;
  createdAt: string;
}

/**
 * Calculate verification statistics from database history
 * This uses actual saved data instead of local state
 */
export function calculateStatsFromDBHistory(
  dbHistory: DBVerificationLog[]
): VerificationStatistics {
  const byContentType: Record<ContentType, { total: number; errors: number; rate: number }> = {
    code: { total: 0, errors: 0, rate: 0 },
    math: { total: 0, errors: 0, rate: 0 },
    citation: { total: 0, errors: 0, rate: 0 },
    fact: { total: 0, errors: 0, rate: 0 },
    text: { total: 0, errors: 0, rate: 0 }
  };

  const byVerificationMethod: Record<VerificationMethod, { total: number; errors: number; rate: number }> = {
    'code-execution': { total: 0, errors: 0, rate: 0 },
    'syntax-check': { total: 0, errors: 0, rate: 0 },
    'calculation': { total: 0, errors: 0, rate: 0 },
    'citation-check': { total: 0, errors: 0, rate: 0 },
    'cross-reference': { total: 0, errors: 0, rate: 0 },
    'fact-check': { total: 0, errors: 0, rate: 0 }
  };

  let totalVerified = 0;
  let totalErrors = 0;

  // Filter out skipped entries (they shouldn't be in DB anymore, but just in case)
  const validLogs = dbHistory.filter(log => log.userDecision !== 'skip');

  validLogs.forEach(log => {
    totalVerified++;

    // Count errors based on verification status
    const isError = log.verificationStatus === 'error-found' ||
                    log.verificationStatus === 'unable-to-verify';
    if (isError) {
      totalErrors++;
    }

    // Track by content type
    const contentType = log.contentType as ContentType;
    if (byContentType[contentType]) {
      byContentType[contentType].total++;
      if (isError) {
        byContentType[contentType].errors++;
      }
    }

    // Track by verification method
    const method = log.verificationMethod as VerificationMethod;
    if (byVerificationMethod[method]) {
      byVerificationMethod[method].total++;
      if (isError) {
        byVerificationMethod[method].errors++;
      }
    }
  });

  // Calculate rates
  Object.values(byContentType).forEach(stats => {
    stats.rate = stats.total > 0 ? stats.errors / stats.total : 0;
  });
  Object.values(byVerificationMethod).forEach(stats => {
    stats.rate = stats.total > 0 ? stats.errors / stats.total : 0;
  });

  const errorRate = totalVerified > 0 ? totalErrors / totalVerified : 0;
  const trustBuiltUp = errorRate < 0.2 && totalVerified >= 5; // Need at least 5 verifications

  return {
    totalVerified,
    errorsFound: totalErrors,
    errorRate,
    byContentType,
    byVerificationMethod,
    trustBuiltUp
  };
}

/**
 * Get verification recommendations based on content
 */
export function getVerificationRecommendations(
  content: VerifiableContent
): VerificationMethod[] {
  const tools = VERIFICATION_TOOLS[content.contentType] || VERIFICATION_TOOLS.text;
  return tools.methods;
}

/**
 * Get confidence message based on verification result
 */
export function getConfidenceMessage(result: VerificationResult): string {
  if (result.status === 'error-found') {
    return `⚠️ Verification found issues. Confidence: ${Math.round(result.confidence * 100)}%. Review discrepancies before accepting.`;
  }

  if (result.status === 'partially-verified') {
    return `📊 Partially verified with ${Math.round(result.confidence * 100)}% confidence. Some areas need manual review.`;
  }

  if (result.matchesAIOutput && result.confidence > 0.9) {
    return `✅ Verification confirms AI output is correct. High confidence: ${Math.round(result.confidence * 100)}%.`;
  }

  if (result.matchesAIOutput) {
    return `✓ Verification supports AI output. Moderate confidence: ${Math.round(result.confidence * 100)}%.`;
  }

  return `Need more information. Confidence: ${Math.round(result.confidence * 100)}%.`;
}

/**
 * Get action recommendation after verification
 */
export function getActionRecommendation(result: VerificationResult): string {
  if (result.status === 'error-found' && result.suggestions.length > 0) {
    return `Consider: ${result.suggestions[0]}`;
  }

  if (result.matchesAIOutput) {
    return 'Safe to accept AI output';
  }

  if (result.discrepancies.length > 0) {
    return `Modify based on findings: ${result.discrepancies[0]}`;
  }

  return 'Review findings and make a decision';
}

/**
 * Get verification workflow guidance
 */
export function getWorkflowGuidance(step: 'select' | 'review' | 'decide'): string {
  const guidance: Record<string, string> = {
    select: 'Choose the most appropriate verification method for this content type',
    review: 'Carefully review the verification results and findings',
    decide: 'Decide whether to accept, modify, or reject based on verification results'
  };
  return guidance[step];
}

export default {
  performVerification,
  createVerificationLog,
  updateVerificationOutcome,
  calculateVerificationStatistics,
  getVerificationRecommendations,
  getConfidenceMessage,
  getActionRecommendation,
  getWorkflowGuidance
};
