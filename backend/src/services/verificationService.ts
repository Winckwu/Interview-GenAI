/**
 * MR11 Verification Service
 *
 * Provides real verification capabilities:
 * - Code execution in sandboxed environment
 * - Math expression evaluation
 * - Fact-checking via web search
 */

import { VM } from 'vm2';
import * as math from 'mathjs';

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

    // Provide helpful suggestions based on error type
    if (error.message.includes('is not defined')) {
      suggestions.push('Check for undefined variables or missing imports');
    } else if (error.message.includes('SyntaxError')) {
      suggestions.push('Fix syntax error in the code');
    } else if (error.message.includes('timeout')) {
      suggestions.push('Code took too long to execute - possible infinite loop');
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
      suggestions.push('Try searching with more specific terms');
      return { status, confidence, findings, discrepancies, suggestions, sources };
    }

    // Analyze search results
    let supportingResults = 0;
    let contradictingResults = 0;

    for (const result of searchResults.results.slice(0, 5)) {
      sources.push(result.url);

      // Simple heuristic: check if the snippet contains key terms from the claim
      const claimWords = claim.toLowerCase().split(/\s+/).filter(w => w.length > 3);
      const snippetLower = result.snippet.toLowerCase();

      let matchCount = 0;
      for (const word of claimWords) {
        if (snippetLower.includes(word)) {
          matchCount++;
        }
      }

      const matchRatio = claimWords.length > 0 ? matchCount / claimWords.length : 0;

      if (matchRatio > 0.5) {
        supportingResults++;
        findings.push(`Supporting source: "${result.title}"`);
      }
    }

    // Determine verification status based on results
    if (supportingResults >= 3) {
      status = 'verified';
      confidence = 0.8;
      findings.push(`Found ${supportingResults} sources that support this claim`);
    } else if (supportingResults >= 1) {
      status = 'partially-verified';
      confidence = 0.6;
      findings.push(`Found ${supportingResults} potentially relevant source(s)`);
      suggestions.push('Consider verifying with additional authoritative sources');
    } else {
      status = 'unable-to-verify';
      confidence = 0.3;
      findings.push('Could not find strong supporting evidence');
      suggestions.push('The claim may need manual verification from authoritative sources');
    }

  } catch (error: any) {
    status = 'unable-to-verify';
    confidence = 0.2;
    discrepancies.push(`Search error: ${error.message}`);
    suggestions.push('Try again or verify manually');
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

  } catch (error: any) {
    status = 'error-found';
    confidence = 1.0;
    discrepancies.push(`Syntax error: ${error.message}`);

    // Try to provide helpful location info
    const lineMatch = error.message.match(/line (\d+)/i);
    if (lineMatch) {
      suggestions.push(`Check line ${lineMatch[1]} for syntax errors`);
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
