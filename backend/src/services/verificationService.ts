/**
 * MR11 Verification Service
 *
 * Provides real verification capabilities with GPT-enhanced analysis:
 * - Code execution in sandboxed environment + GPT error explanation
 * - Math expression evaluation + GPT step-by-step breakdown
 * - Fact-checking via web search + GPT intelligent analysis
 * - Syntax checking + GPT code quality suggestions
 */

import { VM } from 'vm2';
import * as math from 'mathjs';
import OpenAI from 'openai';

// Initialize OpenAI client
const apiKey = process.env.OPENAI_API_KEY || '';
const openai = apiKey ? new OpenAI({ apiKey, timeout: 30000 }) : null;
const GPT_MODEL = process.env.AI_MODEL || 'gpt-4o-mini';

/**
 * GPT-enhanced analysis helper
 * Returns empty string if GPT is not available
 */
async function analyzeWithGPT(
  systemPrompt: string,
  userPrompt: string,
  maxTokens: number = 500
): Promise<string> {
  if (!openai) {
    console.log('[Verification] OpenAI not configured, skipping GPT analysis');
    return '';
  }

  try {
    const response = await openai.chat.completions.create({
      model: GPT_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.3, // Lower temperature for more factual responses
      max_tokens: maxTokens,
    });

    return response.choices[0]?.message?.content || '';
  } catch (error: any) {
    console.error('[Verification] GPT analysis failed:', error.message);
    return '';
  }
}

export type VerificationMethod = 'code-execution' | 'math-check' | 'fact-check' | 'syntax-check';
export type VerificationStatus = 'verified' | 'error-found' | 'partially-verified' | 'unable-to-verify';

export interface VerificationRequest {
  content: string;
  contentType: 'code' | 'math' | 'text' | 'citation';
  method: VerificationMethod;
  context?: string; // Additional context for fact-checking
}

export interface VerificationResult {
  status: VerificationStatus;
  confidence: number;
  findings: string[];
  discrepancies: string[];
  suggestions: string[];
  executionResult?: any;
  executionError?: string;
  sources?: string[];
}

/**
 * Verify code by executing in sandboxed VM
 */
export async function verifyCode(code: string): Promise<VerificationResult> {
  const findings: string[] = [];
  const discrepancies: string[] = [];
  const suggestions: string[] = [];
  let executionResult: any = null;
  let executionError: string | undefined;
  let status: VerificationStatus = 'verified';
  let confidence = 0.9;

  try {
    // Create sandboxed VM with timeout
    const vm = new VM({
      timeout: 3000, // 3 second timeout
      sandbox: {
        console: {
          log: (...args: any[]) => findings.push(`Console output: ${args.join(' ')}`),
          error: (...args: any[]) => discrepancies.push(`Console error: ${args.join(' ')}`),
        },
        Math,
        Date,
        JSON,
        Array,
        Object,
        String,
        Number,
        Boolean,
        parseInt,
        parseFloat,
        isNaN,
        isFinite,
      },
      eval: false,
      wasm: false,
    });

    // Execute the code
    executionResult = vm.run(code);

    findings.push('Code executed successfully without errors');
    if (executionResult !== undefined) {
      findings.push(`Return value: ${JSON.stringify(executionResult)}`);
    }

    // Check for common issues
    if (code.includes('eval(')) {
      suggestions.push('Avoid using eval() for security reasons');
    }
    if (code.includes('var ')) {
      suggestions.push('Consider using let/const instead of var');
    }

  } catch (error: any) {
    status = 'error-found';
    confidence = 1.0;
    executionError = error.message;
    discrepancies.push(`Execution error: ${error.message}`);

    // GPT-enhanced error explanation
    const gptAnalysis = await analyzeWithGPT(
      `You are a JavaScript debugging expert. Analyze the code error and provide:
1. A clear explanation of why the error occurred
2. The specific fix needed
3. A corrected code snippet if applicable
Keep your response concise and actionable.`,
      `Code:\n\`\`\`javascript\n${code}\n\`\`\`\n\nError: ${error.message}`,
      400
    );

    if (gptAnalysis) {
      findings.push('GPT Analysis:');
      gptAnalysis.split('\n').filter(line => line.trim()).slice(0, 5).forEach(line => {
        findings.push(`  ${line}`);
      });
    } else {
      // Fallback suggestions if GPT is not available
      if (error.message.includes('is not defined')) {
        suggestions.push('Check for undefined variables or missing imports');
      } else if (error.message.includes('SyntaxError')) {
        suggestions.push('Fix syntax error in the code');
      } else if (error.message.includes('timeout')) {
        suggestions.push('Code took too long to execute - possible infinite loop');
      }
    }
  }

  return {
    status,
    confidence,
    findings,
    discrepancies,
    suggestions,
    executionResult,
    executionError,
  };
}

/**
 * Verify mathematical expression
 */
export async function verifyMath(expression: string, context?: string): Promise<VerificationResult> {
  const findings: string[] = [];
  const discrepancies: string[] = [];
  const suggestions: string[] = [];
  let status: VerificationStatus = 'verified';
  let confidence = 0.95;
  let executionResult: any = null;

  try {
    // Clean up the expression
    let cleanExpr = expression
      .replace(/\s+/g, ' ')
      .trim();

    // Try to extract mathematical expressions from text
    const mathPatterns = [
      /(\d+[\s]*[+\-*/^%][\s]*\d+[\s]*[+\-*/^%=\d\s]*)/g,
      /([a-zA-Z]+\s*=\s*[\d.]+)/g,
      /(\d+\.?\d*)/g,
    ];

    // Check if it's a claim like "2+2=5"
    const equalityMatch = cleanExpr.match(/(.+?)\s*=\s*(.+)/);
    if (equalityMatch) {
      const leftSide = equalityMatch[1].trim();
      const rightSide = equalityMatch[2].trim();

      try {
        const leftResult = math.evaluate(leftSide);
        const rightResult = math.evaluate(rightSide);

        executionResult = { left: leftResult, right: rightResult };

        if (Math.abs(leftResult - rightResult) < 0.0001) {
          findings.push(`Verified: ${leftSide} = ${rightResult}`);
          findings.push('Mathematical equality is correct');
        } else {
          status = 'error-found';
          confidence = 1.0;
          discrepancies.push(`Incorrect: ${leftSide} = ${leftResult}, not ${rightSide}`);
          suggestions.push(`The correct answer is: ${leftSide} = ${leftResult}`);
        }
      } catch {
        // If can't evaluate both sides, try just one
        try {
          const result = math.evaluate(leftSide);
          executionResult = result;
          findings.push(`Calculated: ${leftSide} = ${result}`);

          if (result.toString() !== rightSide) {
            status = 'error-found';
            discrepancies.push(`AI claimed result is ${rightSide}, but actual result is ${result}`);
          }
        } catch (e: any) {
          status = 'unable-to-verify';
          confidence = 0.3;
          discrepancies.push(`Cannot evaluate expression: ${e.message}`);
        }
      }
    } else {
      // Just evaluate the expression
      try {
        const result = math.evaluate(cleanExpr);
        executionResult = result;
        findings.push(`Expression evaluated: ${cleanExpr} = ${result}`);
        findings.push('Mathematical expression is valid');
      } catch {
        // Try to find and evaluate sub-expressions
        let foundAny = false;
        for (const pattern of mathPatterns) {
          const matches = cleanExpr.match(pattern);
          if (matches) {
            for (const match of matches) {
              try {
                const result = math.evaluate(match);
                findings.push(`Sub-expression: ${match} = ${result}`);
                foundAny = true;
              } catch {
                // Skip invalid sub-expressions
              }
            }
          }
        }

        if (!foundAny) {
          status = 'unable-to-verify';
          confidence = 0.3;
          findings.push('No evaluable mathematical expressions found');
        }
      }
    }

  } catch (error: any) {
    status = 'unable-to-verify';
    confidence = 0.3;
    discrepancies.push(`Math evaluation error: ${error.message}`);
    suggestions.push('Ensure the expression uses standard mathematical notation');
  }

  // GPT-enhanced step-by-step explanation
  if (executionResult !== null) {
    const gptAnalysis = await analyzeWithGPT(
      `You are a math tutor. Given a mathematical expression and its result, provide a clear step-by-step breakdown of how the answer was calculated. Use simple language. Format steps as numbered list.`,
      `Expression: ${expression}\nResult: ${JSON.stringify(executionResult)}`,
      300
    );

    if (gptAnalysis) {
      findings.push('Step-by-step breakdown:');
      gptAnalysis.split('\n').filter(line => line.trim()).slice(0, 6).forEach(line => {
        findings.push(`  ${line}`);
      });
    }
  }

  return {
    status,
    confidence,
    findings,
    discrepancies,
    suggestions,
    executionResult,
  };
}

/**
 * Verify facts using web search
 * Provides detailed analysis with specific source citations and actionable suggestions
 */
export async function verifyFact(
  claim: string,
  searchFunction: (query: string) => Promise<{ results: Array<{ title: string; snippet: string; url: string }> }>
): Promise<VerificationResult> {
  const findings: string[] = [];
  const discrepancies: string[] = [];
  const suggestions: string[] = [];
  const sources: string[] = [];
  let status: VerificationStatus = 'partially-verified';
  let confidence = 0.6;

  try {
    // Search for the claim
    const searchResults = await searchFunction(claim);

    if (searchResults.results.length === 0) {
      status = 'unable-to-verify';
      confidence = 0.2;
      findings.push('No search results found for this claim');
      suggestions.push('Try rephrasing the claim or breaking it into smaller, more specific statements');
      suggestions.push('Check if the claim contains proper nouns that might have alternate spellings');
      return { status, confidence, findings, discrepancies, suggestions, sources };
    }

    // Extract key terms from claim (filter out common words)
    const stopWords = ['the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'shall', 'can', 'need', 'dare', 'ought', 'used', 'to', 'of', 'in', 'for', 'on', 'with', 'at', 'by', 'from', 'as', 'into', 'through', 'during', 'before', 'after', 'above', 'below', 'between', 'under', 'again', 'further', 'then', 'once', 'here', 'there', 'when', 'where', 'why', 'how', 'all', 'each', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very', 'just', 'and', 'but', 'if', 'or', 'because', 'until', 'while', 'this', 'that', 'these', 'those'];
    const claimWords = claim.toLowerCase()
      .split(/\s+/)
      .filter(w => w.length > 2 && !stopWords.includes(w))
      .map(w => w.replace(/[.,!?;:'"()]/g, ''));

    findings.push(`Searching for key terms: "${claimWords.slice(0, 5).join(', ')}${claimWords.length > 5 ? '...' : ''}"`);

    // Analyze search results with detailed reporting
    let supportingResults = 0;
    const relevantSnippets: { title: string; snippet: string; matchedTerms: string[] }[] = [];

    for (const result of searchResults.results.slice(0, 5)) {
      sources.push(result.url);
      const snippetLower = result.snippet.toLowerCase();
      const titleLower = result.title.toLowerCase();

      // Find which terms matched
      const matchedTerms: string[] = [];
      for (const word of claimWords) {
        if (snippetLower.includes(word) || titleLower.includes(word)) {
          matchedTerms.push(word);
        }
      }

      const matchRatio = claimWords.length > 0 ? matchedTerms.length / claimWords.length : 0;

      if (matchRatio > 0.3) {
        supportingResults++;
        relevantSnippets.push({
          title: result.title,
          snippet: result.snippet.slice(0, 150) + (result.snippet.length > 150 ? '...' : ''),
          matchedTerms,
        });
      }
    }

    // Add detailed findings about relevant sources
    if (relevantSnippets.length > 0) {
      findings.push(`Found ${relevantSnippets.length} relevant source(s):`);
      relevantSnippets.slice(0, 3).forEach((s, i) => {
        findings.push(`  ${i + 1}. "${s.title}" - matches: ${s.matchedTerms.join(', ')}`);
      });
    }

    // Determine verification status based on results
    if (supportingResults >= 3) {
      status = 'verified';
      confidence = 0.85;
      findings.push(`Multiple sources (${supportingResults}) discuss this topic consistently`);
      suggestions.push('Cross-reference with the original source links provided below for full context');
    } else if (supportingResults >= 1) {
      status = 'partially-verified';
      confidence = 0.55;
      findings.push(`Limited coverage found (${supportingResults} source${supportingResults > 1 ? 's' : ''})`);

      // Specific suggestions based on content
      if (claimWords.some(w => /\d{4}/.test(w))) {
        suggestions.push('This claim contains dates - verify the exact timeline from official records');
      }
      if (claimWords.some(w => ['percent', 'percentage', '%'].some(p => w.includes(p)) || /^\d+$/.test(w))) {
        suggestions.push('This claim contains numbers - verify statistics from the original data source');
      }
      suggestions.push('Click the source links below to read the full context');
      suggestions.push('Consider searching for the specific person/organization mentioned for official statements');
    } else {
      status = 'unable-to-verify';
      confidence = 0.25;
      discrepancies.push('No sources found discussing this specific claim');

      // Actionable suggestions
      suggestions.push('The claim may be too specific or recent - try searching news sources directly');
      suggestions.push('Check if proper nouns in the claim are spelled correctly');
      suggestions.push('Break down the claim into smaller, verifiable statements');
      if (claim.length > 100) {
        suggestions.push('The claim is quite long - try verifying the main assertion separately');
      }
    }

    // GPT-enhanced intelligent analysis of search results
    if (relevantSnippets.length > 0) {
      const snippetsText = relevantSnippets.slice(0, 3).map((s, i) =>
        `Source ${i + 1}: "${s.title}"\nSnippet: ${s.snippet}`
      ).join('\n\n');

      const gptAnalysis = await analyzeWithGPT(
        `You are a fact-checker. Analyze whether the search results support, contradict, or are inconclusive about the given claim. Provide:
1. Your verdict: SUPPORTS, CONTRADICTS, or INCONCLUSIVE
2. Key evidence from the sources
3. What's missing or needs further verification
Be concise and objective.`,
        `Claim to verify: "${claim}"\n\nSearch Results:\n${snippetsText}`,
        400
      );

      if (gptAnalysis) {
        findings.push('AI Analysis of Sources:');
        gptAnalysis.split('\n').filter(line => line.trim()).slice(0, 6).forEach(line => {
          findings.push(`  ${line}`);
        });

        // Adjust status based on GPT analysis
        const analysisLower = gptAnalysis.toLowerCase();
        if (analysisLower.includes('contradicts') || analysisLower.includes('false') || analysisLower.includes('incorrect')) {
          if (status === 'verified' || status === 'partially-verified') {
            status = 'partially-verified';
            confidence = Math.min(confidence, 0.5);
            discrepancies.push('AI analysis found potential contradictions in sources');
          }
        } else if (analysisLower.includes('supports') || analysisLower.includes('confirms') || analysisLower.includes('correct')) {
          if (status === 'partially-verified') {
            confidence = Math.min(confidence + 0.15, 0.9);
          }
        }
      }
    }

  } catch (error: any) {
    status = 'unable-to-verify';
    confidence = 0.2;
    discrepancies.push(`Search error: ${error.message}`);
    suggestions.push('Web search failed - try again in a few moments');
    suggestions.push('You can manually verify by searching Google or checking Wikipedia');
  }

  return {
    status,
    confidence,
    findings,
    discrepancies,
    suggestions,
    sources,
  };
}

/**
 * Check code syntax without execution
 */
export async function checkSyntax(code: string): Promise<VerificationResult> {
  const findings: string[] = [];
  const discrepancies: string[] = [];
  const suggestions: string[] = [];
  let status: VerificationStatus = 'verified';
  let confidence = 0.9;

  try {
    // Try to parse the code
    new Function(code);
    findings.push('JavaScript syntax is valid');

    // Additional checks
    const issues: string[] = [];

    // Check for common issues
    if (code.includes('==') && !code.includes('===')) {
      issues.push('Uses loose equality (==) instead of strict equality (===)');
    }
    if (/\bvar\b/.test(code)) {
      issues.push('Uses var instead of let/const');
    }
    if (code.includes('async') && !code.includes('await')) {
      issues.push('Async function without await');
    }

    if (issues.length > 0) {
      status = 'partially-verified';
      confidence = 0.7;
      for (const issue of issues) {
        suggestions.push(issue);
      }
    }

    // GPT-enhanced code quality review (for valid syntax)
    const gptReview = await analyzeWithGPT(
      `You are a senior JavaScript code reviewer. Analyze the code for:
1. Potential bugs or edge cases
2. Security concerns
3. Performance issues
4. Best practice violations
Provide 3-5 specific, actionable suggestions. Be concise.`,
      `\`\`\`javascript\n${code}\n\`\`\``,
      400
    );

    if (gptReview) {
      findings.push('Code Quality Review:');
      gptReview.split('\n').filter(line => line.trim()).slice(0, 5).forEach(line => {
        findings.push(`  ${line}`);
      });
    }

  } catch (error: any) {
    status = 'error-found';
    confidence = 1.0;
    discrepancies.push(`Syntax error: ${error.message}`);

    // GPT-enhanced error explanation for syntax errors
    const gptAnalysis = await analyzeWithGPT(
      `You are a JavaScript expert. Explain this syntax error in simple terms and show exactly how to fix it.`,
      `Code:\n\`\`\`javascript\n${code}\n\`\`\`\n\nError: ${error.message}`,
      300
    );

    if (gptAnalysis) {
      findings.push('Error Explanation:');
      gptAnalysis.split('\n').filter(line => line.trim()).slice(0, 4).forEach(line => {
        findings.push(`  ${line}`);
      });
    } else {
      // Fallback
      const lineMatch = error.message.match(/line (\d+)/i);
      if (lineMatch) {
        suggestions.push(`Check line ${lineMatch[1]} for syntax errors`);
      }
    }
  }

  return {
    status,
    confidence,
    findings,
    discrepancies,
    suggestions,
  };
}

export default {
  verifyCode,
  verifyMath,
  verifyFact,
  checkSyntax,
};
