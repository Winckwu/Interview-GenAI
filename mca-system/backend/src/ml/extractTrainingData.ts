/**
 * Training Data Extraction Script
 *
 * Extracts 12-dimensional subprocess scores (P1-P4, M1-M3, E1-E3, R1-R2)
 * from the LLM-assisted interview coding results (llm-coding-results.md)
 * and generates standardized CSV training data for the PatternRecognitionEngine.
 *
 * Based on 03-Pattern-Framework-Supplement.md and empirical interview coding.
 */

import * as fs from 'fs';
import * as path from 'path';

/**
 * Subprocess scores extracted from interview coding results
 */
export interface TrainingDataRow {
  user_id: string;
  pattern: 'A' | 'B' | 'C' | 'D' | 'E' | 'F';
  confidence: number; // 0-1
  p1: number; // Task Decomposition
  p2: number; // Goal Setting
  p3: number; // Strategy Selection
  p4: number; // Resource Planning
  m1: number; // Progress Monitoring
  m2: number; // Quality Checking
  m3: number; // Context Monitoring
  e1: number; // Result Evaluation
  e2: number; // Learning Reflection
  e3: number; // Capability Judgment
  r1: number; // Strategy Adjustment
  r2: number; // Trust Calibration
  total_score: number;
  is_mixed_pattern: boolean;
  notes: string;
}

export interface ExtractionResult {
  success: boolean;
  respondents_processed: number;
  respondents_failed: number;
  pattern_distribution: Record<string, number>;
  data: TrainingDataRow[];
  validation_errors: string[];
}

/**
 * Extract subprocess scores from a respondent's markdown section
 */
function extractSubprocessScores(
  respondentText: string
): Record<string, number> | null {
  const scores: Record<string, number> = {};

  // Match the subprocess scores table
  // Patterns:
  // | P1 Task Decomposition | 3 | ... |
  // | **P1 Task Decomposition** | **3** | ... |
  // Handle both bold and non-bold formats
  const subprocessPattern =
    /\|\s*\*?\*?(P[1-4]|M[1-3]|E[1-3]|R[1-2])\*?\*?\s+[^|]*\|\s*\*?\*?(\d)\*?\*?\s*\|/g;

  let match;
  while ((match = subprocessPattern.exec(respondentText)) !== null) {
    const subprocess = match[1];
    const score = parseInt(match[2], 10);

    if (score >= 0 && score <= 3) {
      scores[subprocess] = score;
    }
  }

  // Validate we have all 12 subprocesses
  const required = ['P1', 'P2', 'P3', 'P4', 'M1', 'M2', 'M3', 'E1', 'E2', 'E3', 'R1', 'R2'];
  for (const sub of required) {
    if (!(sub in scores)) {
      return null; // Missing subprocess scores
    }
  }

  return scores;
}

/**
 * Extract pattern and confidence from Pattern Determination section
 */
function extractPatternInfo(
  respondentText: string
): { pattern: string; confidence: number; isMixed: boolean } | null {
  // Find PRIMARY PATTERN or CLASSIFICATION or Pattern: line
  let patternMatch = respondentText.match(
    /\*\*PRIMARY PATTERN:\s*([A-F])\s*-?\s*([^*]+)\*\*/
  );

  if (!patternMatch) {
    // Try CLASSIFICATION format (for borderline cases)
    patternMatch = respondentText.match(
      /\*\*CLASSIFICATION:\s*Pattern\s*([A-F])\s*-?\s*([^*]+)\*\*/
    );
  }

  if (!patternMatch) {
    // Try "### Pattern: **C** - ..." format (for later respondents)
    patternMatch = respondentText.match(
      /###\s+Pattern(?:\s+Analysis)?:\s+\*\*([A-F])\*\*\s*-?\s*([^|\n]*)/
    );
  }

  if (!patternMatch) {
    return null;
  }

  const pattern = patternMatch[1];

  // Extract confidence value
  // Patterns: "Confidence: HIGH", "Confidence: 0.85", "Confidence: MODERATE", "Confidence: VERY LOW"
  // Also try formats without "Confidence:" prefix
  let confidence = 0.5; // Default
  let confidenceMatch = respondentText.match(
    /\*\*Confidence:\s*([0-9]+\.[0-9]+|VERY LOW|HIGH|MODERATE|LOW)\*\*/i
  );

  if (confidenceMatch) {
    const confValue = confidenceMatch[1].toUpperCase();
    if (confValue === 'HIGH') {
      confidence = 0.9;
    } else if (confValue === 'MODERATE') {
      confidence = 0.7;
    } else if (confValue === 'VERY LOW') {
      confidence = 0.3;
    } else if (confValue === 'LOW') {
      confidence = 0.5;
    } else {
      const parsed = parseFloat(confidenceMatch[1]);
      if (!isNaN(parsed)) {
        confidence = parsed;
      }
    }
  } else {
    // Try alternative confidence formats without "Confidence:" prefix
    const altConfMatch = respondentText.match(
      /\*\*([0-9]+\.[0-9]+|VERY LOW|HIGH|MODERATE|LOW)\s+confidence\*\*/i
    );
    if (altConfMatch) {
      const confValue = altConfMatch[1].toUpperCase();
      if (confValue === 'HIGH') {
        confidence = 0.9;
      } else if (confValue === 'MODERATE') {
        confidence = 0.7;
      } else if (confValue === 'VERY LOW') {
        confidence = 0.3;
      } else if (confValue === 'LOW') {
        confidence = 0.5;
      } else {
        const parsed = parseFloat(altConfMatch[1]);
        if (!isNaN(parsed)) {
          confidence = parsed;
        }
      }
    } else {
      // If no explicit confidence, calculate from total score
      // Heuristic: higher total score → higher confidence
      // Note: This is a fallback; explicit confidence is preferred
      const totalMatch = respondentText.match(/\*\*Total Score:\s*(\d+)\/36\*\*/);
      if (totalMatch) {
        const totalScore = parseInt(totalMatch[1], 10);
        // Simple heuristic: 0-12 = 0.4, 13-20 = 0.6, 21-28 = 0.75, 29-36 = 0.85
        if (totalScore <= 12) confidence = 0.4;
        else if (totalScore <= 20) confidence = 0.6;
        else if (totalScore <= 28) confidence = 0.75;
        else confidence = 0.85;
      }
    }
  }

  // Check for mixed pattern
  const isMixedMatch = respondentText.match(/\*\*Mixed Pattern\*\*:\s*(Yes|No|Partially)/);
  const isMixed = isMixedMatch ? isMixedMatch[1] !== 'No' : false;

  return {
    pattern: pattern as 'A' | 'B' | 'C' | 'D' | 'E' | 'F',
    confidence: Math.min(1.0, Math.max(0, confidence)),
    isMixed,
  };
}

/**
 * Extract total score from respondent section
 * Note: We calculate from subprocess scores if available for consistency
 */
function extractTotalScore(respondentText: string, scores?: Record<string, number>): number | null {
  // If subprocess scores provided, calculate total from them
  if (scores) {
    const required = ['P1', 'P2', 'P3', 'P4', 'M1', 'M2', 'M3', 'E1', 'E2', 'E3', 'R1', 'R2'];
    let total = 0;
    for (const sub of required) {
      if (sub in scores) {
        total += scores[sub];
      } else {
        return null; // Can't calculate if missing subprocess
      }
    }
    return total;
  }

  // Fallback: extract from markdown
  const totalMatch = respondentText.match(/\*\*Total Score:\s*(\d+)\/36\*\*/);
  if (totalMatch) {
    return parseInt(totalMatch[1], 10);
  }
  return null;
}

/**
 * Extract and parse a single respondent's data
 */
function parseRespondent(
  respondentId: string,
  respondentText: string
): TrainingDataRow | null {
  try {
    const scores = extractSubprocessScores(respondentText);
    if (!scores) {
      return null;
    }

    const patternInfo = extractPatternInfo(respondentText);
    if (!patternInfo) {
      return null;
    }

    // Calculate total score from subprocess scores for consistency
    const totalScore = extractTotalScore(respondentText, scores);
    if (totalScore === null) {
      return null;
    }

    return {
      user_id: respondentId,
      pattern: patternInfo.pattern,
      confidence: patternInfo.confidence,
      p1: scores['P1'],
      p2: scores['P2'],
      p3: scores['P3'],
      p4: scores['P4'],
      m1: scores['M1'],
      m2: scores['M2'],
      m3: scores['M3'],
      e1: scores['E1'],
      e2: scores['E2'],
      e3: scores['E3'],
      r1: scores['R1'],
      r2: scores['R2'],
      total_score: totalScore,
      is_mixed_pattern: patternInfo.isMixed,
      notes: `Confidence: ${(patternInfo.confidence * 100).toFixed(0)}%`,
    };
  } catch (error) {
    return null;
  }
}

/**
 * Validate extracted training data
 */
function validateData(data: TrainingDataRow[]): string[] {
  const errors: string[] = [];

  // Check completeness: all 49 respondents
  const expectedIds = new Set<string>();
  for (let i = 1; i <= 49; i++) {
    expectedIds.add(`I${String(i).padStart(3, '0')}`);
  }

  const foundIds = new Set(data.map(row => row.user_id));
  for (const id of expectedIds) {
    if (!foundIds.has(id)) {
      errors.push(`Missing respondent: ${id}`);
    }
  }

  // Check feature ranges
  for (const row of data) {
    const subprocesses = ['p1', 'p2', 'p3', 'p4', 'm1', 'm2', 'm3', 'e1', 'e2', 'e3', 'r1', 'r2'];
    for (const sub of subprocesses) {
      const value = row[sub as keyof TrainingDataRow];
      if (typeof value === 'number' && (value < 0 || value > 3)) {
        errors.push(`${row.user_id}: ${sub.toUpperCase()} out of range (0-3): ${value}`);
      }
    }

    // Validate total score
    if (row.total_score < 0 || row.total_score > 36) {
      errors.push(`${row.user_id}: total_score out of range (0-36): ${row.total_score}`);
    }

    // Validate confidence
    if (row.confidence < 0 || row.confidence > 1) {
      errors.push(`${row.user_id}: confidence out of range (0-1): ${row.confidence}`);
    }

    // Validate pattern
    if (!['A', 'B', 'C', 'D', 'E', 'F'].includes(row.pattern)) {
      errors.push(`${row.user_id}: invalid pattern: ${row.pattern}`);
    }
  }

  return errors;
}

/**
 * Calculate pattern distribution
 */
function calculatePatternDistribution(data: TrainingDataRow[]): Record<string, number> {
  const distribution: Record<string, number> = {
    A: 0,
    B: 0,
    C: 0,
    D: 0,
    E: 0,
    F: 0,
  };

  for (const row of data) {
    distribution[row.pattern]++;
  }

  return distribution;
}

/**
 * Convert training data to CSV format
 */
function toCSV(data: TrainingDataRow[]): string {
  const headers = [
    'user_id',
    'pattern',
    'confidence',
    'p1',
    'p2',
    'p3',
    'p4',
    'm1',
    'm2',
    'm3',
    'e1',
    'e2',
    'e3',
    'r1',
    'r2',
    'total_score',
    'is_mixed_pattern',
    'notes',
  ];

  const lines: string[] = [headers.join(',')];

  for (const row of data) {
    const values = [
      row.user_id,
      row.pattern,
      row.confidence.toFixed(3),
      row.p1,
      row.p2,
      row.p3,
      row.p4,
      row.m1,
      row.m2,
      row.m3,
      row.e1,
      row.e2,
      row.e3,
      row.r1,
      row.r2,
      row.total_score,
      row.is_mixed_pattern ? 'true' : 'false',
      `"${(row.notes || '').replace(/"/g, '""')}"`, // Escape quotes in notes
    ];
    lines.push(values.join(','));
  }

  return lines.join('\n');
}

/**
 * Main extraction function
 */
export async function extractTrainingData(
  markdownFilePath: string,
  outputCsvPath: string
): Promise<ExtractionResult> {
  const result: ExtractionResult = {
    success: false,
    respondents_processed: 0,
    respondents_failed: 0,
    pattern_distribution: {},
    data: [],
    validation_errors: [],
  };

  try {
    // Read markdown file
    const markdownContent = fs.readFileSync(markdownFilePath, 'utf-8');

    // Split by respondent sections
    // Pattern: ## I{NUMBER} - Name (Background)
    // Use matchAll to get all matches
    const respondentPattern = /## (I\d{3})\s*-\s*([^\n]+)/g;
    const matches = Array.from(markdownContent.matchAll(respondentPattern));

    const respondents: Array<{ id: string; text: string }> = [];

    for (let i = 0; i < matches.length; i++) {
      const currentMatch = matches[i];
      const respondentId = currentMatch[1];
      const startIndex = currentMatch.index;

      // Find the next respondent or end of file
      const endIndex = i + 1 < matches.length ? matches[i + 1].index : markdownContent.length;

      const respondentText = markdownContent.substring(startIndex, endIndex);
      respondents.push({ id: respondentId, text: respondentText });
    }

    // Parse each respondent
    for (const respondent of respondents) {
      const parsed = parseRespondent(respondent.id, respondent.text);

      if (parsed) {
        result.data.push(parsed);
        result.respondents_processed++;
      } else {
        result.respondents_failed++;
      }
    }

    // Validate data
    result.validation_errors = validateData(result.data);

    // Calculate pattern distribution
    result.pattern_distribution = calculatePatternDistribution(result.data);

    // Sort data by user_id
    result.data.sort((a, b) => a.user_id.localeCompare(b.user_id));

    // Write CSV file
    const csvContent = toCSV(result.data);
    fs.writeFileSync(outputCsvPath, csvContent, 'utf-8');

    result.success = result.validation_errors.length === 0 && result.respondents_processed === 49;

    return result;
  } catch (error) {
    result.validation_errors.push(`Extraction error: ${(error as Error).message}`);
    return result;
  }
}

/**
 * Print extraction summary
 */
export function printExtractionSummary(result: ExtractionResult): void {
  console.log('\n📊 Training Data Extraction Summary');
  console.log('═'.repeat(50));

  console.log(`\n✅ Processed: ${result.respondents_processed}/49`);
  console.log(`❌ Failed: ${result.respondents_failed}`);

  console.log('\n📈 Pattern Distribution:');
  for (const pattern of ['A', 'B', 'C', 'D', 'E', 'F']) {
    const count = result.pattern_distribution[pattern] || 0;
    const percent = ((count / result.respondents_processed) * 100).toFixed(1);
    console.log(`   Pattern ${pattern}: ${count} (${percent}%)`);
  }

  console.log('\n⚠️  Validation Errors: ' + result.validation_errors.length);
  if (result.validation_errors.length > 0) {
    result.validation_errors.slice(0, 5).forEach(error => {
      console.log(`   • ${error}`);
    });
    if (result.validation_errors.length > 5) {
      console.log(`   ... and ${result.validation_errors.length - 5} more`);
    }
  }

  console.log('\n' + (result.success ? '✅' : '❌') + ' Status:', result.success ? 'SUCCESS' : 'FAILED');
  console.log('═'.repeat(50));
}

/**
 * CLI Entry Point
 */
async function main(): Promise<void> {
  // Resolve paths for ES modules
  const currentDir = path.dirname(new URL(import.meta.url).pathname);
  const markdownPath = path.join(currentDir, '../../../../backend/llm-coding-results.md');
  const outputPath = path.join(currentDir, 'training_data.csv');

  console.log('🚀 Extracting training data from interview coding results...\n');

  const result = await extractTrainingData(markdownPath, outputPath);

  printExtractionSummary(result);

  if (result.success) {
    console.log(`\n💾 CSV exported to: ${outputPath}`);
    console.log(`📦 Ready for PatternRecognitionEngine training`);
  } else {
    console.error('\n❌ Extraction failed. Check validation errors above.');
    process.exit(1);
  }
}

// Run if called directly
const isMainModule = import.meta.url === `file://${process.argv[1]}`;
if (isMainModule) {
  main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export default extractTrainingData;
