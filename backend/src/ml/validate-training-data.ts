/**
 * Training Data Validation Tool
 *
 * Validates the extracted training data against research standards:
 * 1. Pattern distribution matches paper (A:37%, C:33%, E:14%, B:8%, D:8%)
 * 2. Each pattern has ≥4 high-quality samples
 * 3. Feature values are within expected ranges
 */

import fs from 'fs';
import path from 'path';

interface TrainingRow {
  user_id: string;
  pattern: string;
  scores: {
    p1: number;
    p2: number;
    p3: number;
    p4: number;
    m1: number;
    m2: number;
    m3: number;
    e1: number;
    e2: number;
    e3: number;
    r1: number;
    r2: number;
  };
  total_score: number;
  confidence: 'high' | 'moderate' | 'low';
  notes: string;
}

// Expected distribution from paper
const EXPECTED_DISTRIBUTION = {
  A: 0.37, // 37%
  C: 0.33, // 33%
  E: 0.14, // 14%
  B: 0.08, // 8%
  D: 0.08, // 8%
  F: 0.00, // 0% (no samples in original study)
};

// Expected feature ranges based on 08-Training-Data-Extraction-Guide.md
const FEATURE_RANGES = {
  total_score: { min: 0, max: 36 },
  pattern_A: { min_score: 28, max_score: 32 },
  pattern_B: { min_score: 25, max_score: 30 },
  pattern_C: { min_score: 28, max_score: 32 },
  pattern_D: { min_score: 26, max_score: 30 },
  pattern_E: { min_score: 24, max_score: 29 },
  pattern_F: { min_score: 0, max_score: 14 },
};

// Minimum high-quality samples per pattern
const MIN_SAMPLES_PER_PATTERN = 4;

function parseCSV(csvPath: string): TrainingRow[] {
  const content = fs.readFileSync(csvPath, 'utf-8');
  const lines = content.split('\n').slice(1); // Skip header

  return lines
    .filter(line => line.trim().length > 0)
    .map(line => {
      const parts = line.split(',');
      return {
        user_id: parts[0],
        pattern: parts[1],
        scores: {
          p1: parseInt(parts[2]),
          p2: parseInt(parts[3]),
          p3: parseInt(parts[4]),
          p4: parseInt(parts[5]),
          m1: parseInt(parts[6]),
          m2: parseInt(parts[7]),
          m3: parseInt(parts[8]),
          e1: parseInt(parts[9]),
          e2: parseInt(parts[10]),
          e3: parseInt(parts[11]),
          r1: parseInt(parts[12]),
          r2: parseInt(parts[13]),
        },
        total_score: parseInt(parts[14]),
        confidence: parts[15] as 'high' | 'moderate' | 'low',
        notes: parts.slice(16).join(',').replace(/"/g, ''),
      };
    });
}

function validateDistribution(data: TrainingRow[]): {
  actual: Record<string, number>;
  expected: Record<string, number>;
  pass: boolean;
  issues: string[];
} {
  const issues: string[] = [];

  // Calculate actual distribution
  const counts: Record<string, number> = {};
  data.forEach(row => {
    counts[row.pattern] = (counts[row.pattern] || 0) + 1;
  });

  const actual: Record<string, number> = {};
  Object.keys(counts).forEach(pattern => {
    actual[pattern] = counts[pattern] / data.length;
  });

  // Check against expected
  let pass = true;
  const tolerance = 0.10; // ±10% tolerance

  Object.entries(EXPECTED_DISTRIBUTION).forEach(([pattern, expectedPct]) => {
    const actualPct = actual[pattern] || 0;
    const diff = Math.abs(actualPct - expectedPct);

    if (expectedPct > 0 && diff > tolerance) {
      issues.push(
        `Pattern ${pattern}: Expected ${(expectedPct * 100).toFixed(0)}%, got ${(actualPct * 100).toFixed(0)}% (diff: ${(diff * 100).toFixed(0)}%)`
      );
      pass = false;
    }
  });

  return { actual, expected: EXPECTED_DISTRIBUTION, pass, issues };
}

function validateSampleQuality(data: TrainingRow[]): {
  pass: boolean;
  issues: string[];
  stats: Record<string, { total: number; high: number; moderate: number; low: number }>;
} {
  const issues: string[] = [];
  const stats: Record<
    string,
    { total: number; high: number; moderate: number; low: number }
  > = {};

  // Group by pattern
  data.forEach(row => {
    if (!stats[row.pattern]) {
      stats[row.pattern] = { total: 0, high: 0, moderate: 0, low: 0 };
    }
    stats[row.pattern].total++;
    stats[row.pattern][row.confidence]++;
  });

  let pass = true;

  // Check each pattern has ≥4 high-quality samples
  Object.entries(stats).forEach(([pattern, counts]) => {
    if (EXPECTED_DISTRIBUTION[pattern as keyof typeof EXPECTED_DISTRIBUTION] > 0) {
      if (counts.high < MIN_SAMPLES_PER_PATTERN) {
        issues.push(
          `Pattern ${pattern}: Only ${counts.high} high-confidence samples (need ≥${MIN_SAMPLES_PER_PATTERN})`
        );
        pass = false;
      }
    }
  });

  return { pass, issues, stats };
}

function validateFeatureRanges(data: TrainingRow[]): {
  pass: boolean;
  issues: string[];
  outliers: Array<{ user_id: string; pattern: string; score: number; issue: string }>;
} {
  const issues: string[] = [];
  const outliers: Array<{ user_id: string; pattern: string; score: number; issue: string }> = [];
  let pass = true;

  data.forEach(row => {
    // Check total score range
    if (row.total_score < 0 || row.total_score > 36) {
      outliers.push({
        user_id: row.user_id,
        pattern: row.pattern,
        score: row.total_score,
        issue: `Total score ${row.total_score} out of range [0, 36]`,
      });
      pass = false;
    }

    // Check pattern-specific score ranges
    const key = `pattern_${row.pattern}` as keyof typeof FEATURE_RANGES;
    if (FEATURE_RANGES[key]) {
      const range = FEATURE_RANGES[key];
      if (row.total_score < range.min_score || row.total_score > range.max_score) {
        outliers.push({
          user_id: row.user_id,
          pattern: row.pattern,
          score: row.total_score,
          issue: `Pattern ${row.pattern} score ${row.total_score} outside expected range [${range.min_score}, ${range.max_score}]`,
        });
        // Note: This is a warning, not a failure (edge cases exist)
      }
    }

    // Check individual subprocess scores (0-3)
    Object.entries(row.scores).forEach(([subprocess, score]) => {
      if (score < 0 || score > 3) {
        outliers.push({
          user_id: row.user_id,
          pattern: row.pattern,
          score: score,
          issue: `Subprocess ${subprocess} score ${score} out of range [0, 3]`,
        });
        pass = false;
      }
    });
  });

  if (outliers.length > 0) {
    issues.push(`Found ${outliers.length} feature value outliers (see details below)`);
  }

  return { pass, issues, outliers };
}

function generateReport(csvPath: string): void {
  console.log('📊 Training Data Validation Report');
  console.log('='.repeat(70));
  console.log(`\nInput file: ${csvPath}\n`);

  const data = parseCSV(csvPath);
  console.log(`Total samples: ${data.length}`);

  if (data.length < 49) {
    console.log(
      `⚠️  WARNING: Expected 49 samples (from 49 interviewees), got ${data.length}`
    );
    console.log(
      '   Each transcript file may contain MULTIPLE interviewees that need to be separated.\n'
    );
  }

  // Validation 1: Pattern Distribution
  console.log('\n' + '─'.repeat(70));
  console.log('1️⃣  Pattern Distribution Validation');
  console.log('─'.repeat(70));

  const distResult = validateDistribution(data);

  console.log('\nExpected distribution (from paper):');
  Object.entries(distResult.expected)
    .filter(([_, pct]) => pct > 0)
    .sort((a, b) => b[1] - a[1])
    .forEach(([pattern, pct]) => {
      console.log(`   Pattern ${pattern}: ${(pct * 100).toFixed(0)}%`);
    });

  console.log('\nActual distribution:');
  Object.entries(distResult.actual)
    .sort((a, b) => b[1] - a[1])
    .forEach(([pattern, pct]) => {
      const expected = distResult.expected[pattern as keyof typeof distResult.expected] || 0;
      const diff = pct - expected;
      const emoji = Math.abs(diff) > 0.1 ? '❌' : '✅';
      console.log(
        `   ${emoji} Pattern ${pattern}: ${(pct * 100).toFixed(0)}% (expected ${(expected * 100).toFixed(0)}%, diff ${diff > 0 ? '+' : ''}${(diff * 100).toFixed(0)}%)`
      );
    });

  console.log(
    `\nDistribution test: ${distResult.pass ? '✅ PASS' : '❌ FAIL'}`
  );
  if (distResult.issues.length > 0) {
    console.log('Issues:');
    distResult.issues.forEach(issue => console.log(`   - ${issue}`));
  }

  // Validation 2: Sample Quality
  console.log('\n' + '─'.repeat(70));
  console.log('2️⃣  Sample Quality Validation');
  console.log('─'.repeat(70));

  const qualityResult = validateSampleQuality(data);

  console.log('\nSample breakdown by pattern:');
  Object.entries(qualityResult.stats)
    .sort((a, b) => b[1].total - a[1].total)
    .forEach(([pattern, counts]) => {
      console.log(`\n   Pattern ${pattern}:`);
      console.log(`     Total: ${counts.total}`);
      console.log(`     High confidence: ${counts.high}`);
      console.log(`     Moderate confidence: ${counts.moderate}`);
      console.log(`     Low confidence: ${counts.low}`);

      const needsHigh = EXPECTED_DISTRIBUTION[pattern as keyof typeof EXPECTED_DISTRIBUTION] > 0;
      if (needsHigh) {
        const emoji = counts.high >= MIN_SAMPLES_PER_PATTERN ? '✅' : '❌';
        console.log(
          `     ${emoji} High-quality samples: ${counts.high} (need ≥${MIN_SAMPLES_PER_PATTERN})`
        );
      }
    });

  console.log(
    `\nQuality test: ${qualityResult.pass ? '✅ PASS' : '❌ FAIL'}`
  );
  if (qualityResult.issues.length > 0) {
    console.log('Issues:');
    qualityResult.issues.forEach(issue => console.log(`   - ${issue}`));
  }

  // Validation 3: Feature Ranges
  console.log('\n' + '─'.repeat(70));
  console.log('3️⃣  Feature Value Range Validation');
  console.log('─'.repeat(70));

  const rangeResult = validateFeatureRanges(data);

  console.log('\nScore statistics:');
  const scores = data.map(row => row.total_score);
  const min = Math.min(...scores);
  const max = Math.max(...scores);
  const avg = scores.reduce((sum, s) => sum + s, 0) / scores.length;

  console.log(`   Min score: ${min}/36`);
  console.log(`   Max score: ${max}/36`);
  console.log(`   Avg score: ${avg.toFixed(1)}/36`);

  if (rangeResult.outliers.length > 0) {
    console.log(`\n⚠️  Found ${rangeResult.outliers.length} outliers:`);
    rangeResult.outliers.slice(0, 10).forEach(outlier => {
      console.log(`   - ${outlier.user_id} (${outlier.pattern}): ${outlier.issue}`);
    });
    if (rangeResult.outliers.length > 10) {
      console.log(`   ... and ${rangeResult.outliers.length - 10} more`);
    }
  }

  console.log(
    `\nRange test: ${rangeResult.pass ? '✅ PASS' : '❌ FAIL'}`
  );

  // Overall Summary
  console.log('\n' + '='.repeat(70));
  console.log('📋 Overall Validation Summary');
  console.log('='.repeat(70));

  const allPass = distResult.pass && qualityResult.pass && rangeResult.pass;

  console.log(`\n1. Pattern Distribution: ${distResult.pass ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`2. Sample Quality: ${qualityResult.pass ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`3. Feature Ranges: ${rangeResult.pass ? '✅ PASS' : '❌ FAIL'}`);

  console.log(`\n${'='.repeat(70)}`);
  console.log(allPass ? '🎉 ALL TESTS PASSED!' : '⚠️  VALIDATION FAILED - MANUAL REVIEW REQUIRED');
  console.log('='.repeat(70));

  if (!allPass) {
    console.log('\n📝 Recommendations:');
    console.log('\n1. The current output is from AUTOMATED keyword matching only.');
    console.log('   This is expected to be inaccurate and requires manual coding.');
    console.log(
      '\n2. Each transcript file may contain MULTIPLE interviewees (e.g., I001-I015).'
    );
    console.log('   These need to be manually separated and coded individually.');
    console.log('\n3. Manual coding process (per 08-Training-Data-Extraction-Guide.md):');
    console.log('   a) Read each complete interview transcript');
    console.log('   b) Apply evidence strength criteria (0-3) for each subprocess');
    console.log('   c) Quote specific examples for each rating');
    console.log("   d) Distinguish 'knowing' vs 'doing' behaviors");
    console.log('   e) Have 3 coders independently code 20% of samples');
    console.log('   f) Calculate Cohen\'s κ (target ≥ 0.70)');
    console.log('\n4. Expected timeline: 45-60 minutes per interview for trained coders');
  }
}

// CLI
const args = process.argv.slice(2);
if (args.length < 1) {
  console.error('Usage: npx tsx validate-training-data.ts <csv-file>');
  process.exit(1);
}

generateReport(args[0]);
