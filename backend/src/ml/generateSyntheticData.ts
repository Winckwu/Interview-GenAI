/**
 * Comprehensive Synthetic Data Generation for All Patterns
 *
 * Generates synthetic samples for all 6 AI usage patterns (A-F) to achieve
 * a balanced dataset of 100+ samples. This addresses class imbalance issues
 * and ensures adequate representation for reliable model training.
 *
 * Current distribution (49 samples):
 * - Pattern A: 10 (20.4%) → Add 10 more → 20 total
 * - Pattern B: 5 (10.2%) → Add 10 more → 15 total
 * - Pattern C: 22 (44.9%) → Add 5 more → 27 total (still dominant but balanced)
 * - Pattern D: 9 (18.4%) → Add 5 more → 14 total
 * - Pattern E: 1 (2.0%) → Add 10 more → 11 total (critical underrepresentation)
 * - Pattern F: 2 (4.1%) → Add 20 more → 22 total (critical underrepresentation)
 * ─────────────────────────────────────────────────────────
 * Total: 49 + 60 = 109 samples
 */

interface SyntheticSample {
  id: string;
  pattern: 'A' | 'B' | 'C' | 'D' | 'E' | 'F';
  subtype: string;
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
  total_score: number;
  confidence: number;
  rationale: string;
}

/**
 * Pattern A: Strategic Decomposition & Control
 * Characteristics: High planning (P1-P4), strong monitoring (M1-M3), critical evaluation (E1-E3)
 * Expected total score: 25-32 (high)
 */
function generatePatternASamples(count: number = 10): SyntheticSample[] {
  const samples: SyntheticSample[] = [];
  const subtypes = [
    'Systematic Planner',
    'Detail-Oriented Strategist',
    'Process Optimizer',
  ];

  for (let i = 0; i < count; i++) {
    const subtype = subtypes[i % subtypes.length];
    samples.push({
      id: `A_SYS_${String(i + 1).padStart(2, '0')}`,
      pattern: 'A',
      subtype,
      p1: 3, // Complete decomposition
      p2: 3, // Clear, specific goals
      p3: 3, // Systematic strategy selection
      p4: 3, // Thorough resource planning
      m1: 3, // Continuous progress monitoring
      m2: 3, // Rigorous output verification
      m3: 3, // Full context awareness
      e1: 3, // Critical evaluation of results
      e2: 3, // Deep learning reflection
      e3: 3, // Accurate capability judgment
      r1: 3, // Continuous strategy adjustment
      r2: 2, // Calibrated trust (not blind)
      total_score: 35, // 3+3+3+3+3+3+3+3+3+3+3+2 = 35
      confidence: 0.90,
      rationale:
        'Professional systematically decomposes complex tasks, ' +
        'plans meticulously for AI usage, ' +
        'monitors outputs critically at each step, ' +
        'learns from AI mistakes and adjusts strategy continuously, ' +
        'maintains healthy skepticism about AI capabilities',
    });
  }

  return samples;
}

/**
 * Pattern B: Iterative Optimization & Calibration
 * Characteristics: Moderate-high planning, excellent monitoring, adaptive
 * Expected total score: 20-26 (moderate-high)
 */
function generatePatternBSamples(count: number = 10): SyntheticSample[] {
  const samples: SyntheticSample[] = [];

  for (let i = 0; i < count; i++) {
    samples.push({
      id: `B_ITER_${String(i + 1).padStart(2, '0')}`,
      pattern: 'B',
      subtype: 'Iterative Optimizer',
      p1: 2, // Good decomposition
      p2: 2, // Clear goals
      p3: 3, // Explores multiple strategies
      p4: 2, // Some resource planning
      m1: 3, // Strong progress monitoring
      m2: 3, // Validates outputs regularly
      m3: 2, // Moderate context awareness
      e1: 3, // Evaluates and refines
      e2: 2, // Some reflection but could be deeper
      e3: 2, // Reasonable capability judgment
      r1: 3, // Adjusts based on feedback
      r2: 1, // Carefully calibrated trust
      total_score: 28,
      confidence: 0.78,
      rationale:
        'Uses AI iteratively, refining prompts based on outputs, ' +
        'validates results multiple times, ' +
        'learns to optimize approach over time, ' +
        'balances efficiency with quality, ' +
        'understands AI strengths and limitations well',
    });
  }

  return samples;
}

/**
 * Pattern C: Context-Sensitive Adaptation
 * Characteristics: Flexible, adapts approach based on context
 * Expected total score: 18-24 (moderate)
 */
function generatePatternCSamples(count: number = 5): SyntheticSample[] {
  const samples: SyntheticSample[] = [];

  for (let i = 0; i < count; i++) {
    samples.push({
      id: `C_ADAPT_${String(i + 1).padStart(2, '0')}`,
      pattern: 'C',
      subtype: 'Context-Adaptive User',
      p1: 2, // Reasonable decomposition
      p2: 2, // Contextual goals
      p3: 2, // Selects appropriate strategies
      p4: 1, // Minimal resource planning
      m1: 2, // Monitors when necessary
      m2: 2, // Verifies key outputs
      m3: 3, // Highly context-aware
      e1: 2, // Evaluates in context
      e2: 2, // Reflects on lessons learned
      e3: 2, // Understands AI limitations contextually
      r1: 2, // Adjusts approach as needed
      r2: 2, // Balanced trust
      total_score: 24,
      confidence: 0.72,
      rationale:
        'Adapts AI usage strategy to task requirements, ' +
        'different approaches for different types of work, ' +
        'considers context in AI output evaluation, ' +
        'learns and adapts approach over time, ' +
        'pragmatic balance between efficiency and quality',
    });
  }

  return samples;
}

/**
 * Pattern D: Deep Verification & Critical Inquiry
 * Characteristics: High verification (M1-M3), critical evaluation, challenges AI
 * Expected total score: 20-26 (moderate-high)
 */
function generatePatternDSamples(count: number = 5): SyntheticSample[] {
  const samples: SyntheticSample[] = [];

  for (let i = 0; i < count; i++) {
    samples.push({
      id: `D_CRIT_${String(i + 1).padStart(2, '0')}`,
      pattern: 'D',
      subtype: 'Critical Verifier',
      p1: 1, // Less systematic decomposition
      p2: 2, // Sets goals
      p3: 2, // Explores strategies
      p4: 1, // Minimal upfront planning
      m1: 3, // Intensive progress monitoring
      m2: 3, // Rigorous verification
      m3: 3, // Deep context analysis
      e1: 3, // Very critical evaluation
      e2: 2, // Reflects on AI performance
      e3: 3, // Accurately assesses AI limitations
      r1: 2, // Adjusts as needed
      r2: 1, // Very low trust (questions everything)
      total_score: 26, // 1+2+2+1+3+3+3+3+2+3+2+1 = 26
      confidence: 0.75,
      rationale:
        'Questions every AI output thoroughly, ' +
        'validates against multiple sources, ' +
        'deeply analyzes context before accepting results, ' +
        'skeptical of AI capabilities, ' +
        'focuses on verification rather than planning',
    });
  }

  return samples;
}

/**
 * Pattern E: Teaching-Based Reflection
 * Characteristics: Uses AI as learning tool, strong reflection, good monitoring
 * Expected total score: 18-24 (moderate), E2 should be high (reflection)
 */
function generatePatternESamples(count: number = 10): SyntheticSample[] {
  const samples: SyntheticSample[] = [];

  for (let i = 0; i < count; i++) {
    samples.push({
      id: `E_TEACH_${String(i + 1).padStart(2, '0')}`,
      pattern: 'E',
      subtype: 'Learning-Focused User',
      p1: 2, // Some decomposition
      p2: 2, // Learning-oriented goals
      p3: 2, // Explores different prompting strategies
      p4: 1, // Minimal resource planning
      m1: 2, // Monitors learning process
      m2: 2, // Reviews outputs for understanding
      m3: 1, // Limited context awareness
      e1: 2, // Evaluates learning outcomes
      e2: 3, // ✅ STRONG reflection on what was learned
      e3: 2, // Understands AI as educational tool
      r1: 2, // Refines learning approach
      r2: 2, // Balanced trust in AI as teacher
      total_score: 23, // 2+2+2+1+2+2+1+2+3+2+2+2 = 23
      confidence: 0.68,
      rationale:
        'Views AI as teaching tool for deepening understanding, ' +
        'actively reflects on AI explanations, ' +
        'uses AI to explore topics rather than just get answers, ' +
        'learns how AI thinks about problems, ' +
        'improves own thinking through AI interactions',
    });
  }

  return samples;
}

/**
 * Pattern F: Passive & Ineffective Use
 * Characteristics: Low engagement, minimal reflection (E2=0), high trust without verification
 * Expected total score: 4-18 (low), E2 must be 0
 */
function generatePatternFSamples(count: number = 20): SyntheticSample[] {
  const samples: SyntheticSample[] = [];
  const subtypes = [
    'Lazy Avoidant',
    'Naive Oversimplifier',
    'Cost-Cutting Sacrificer',
    'Dependency Denier',
  ];

  // Lazy Avoidant (5)
  for (let i = 0; i < 5; i++) {
    samples.push({
      id: `F_LAZY_${String(i + 1).padStart(2, '0')}`,
      pattern: 'F',
      subtype: 'Lazy Avoidant',
      p1: 1,
      p2: 2,
      p3: 1,
      p4: 0,
      m1: 1,
      m2: 1,
      m3: 1,
      e1: 1,
      e2: 0, // ⚠️  CRITICAL: No reflection
      e3: 1,
      r1: 0,
      r2: 1,
      total_score: 10,
      confidence: 0.45,
      rationale:
        'Uses AI passively without reviewing outputs, ' +
        'never reflects on quality or mistakes, ' +
        'accepts whatever AI generates, ' +
        'no learning from experience, ' +
        'treats AI as automatic solution provider',
    });
  }

  // Naive Oversimplifier (5)
  for (let i = 0; i < 5; i++) {
    samples.push({
      id: `F_NAIVE_${String(i + 1).padStart(2, '0')}`,
      pattern: 'F',
      subtype: 'Naive Oversimplifier',
      p1: 1,
      p2: 1,
      p3: 0,
      p4: 0,
      m1: 0,
      m2: 0,
      m3: 0,
      e1: 1,
      e2: 0, // ⚠️  CRITICAL: No learning from mistakes
      e3: 0,
      r1: 0,
      r2: 1,
      total_score: 4,
      confidence: 0.40,
      rationale:
        'Believes AI is infallible and always correct, ' +
        'uses for critical decisions without verification, ' +
        'no awareness of AI hallucinations, ' +
        'never reflects on errors, ' +
        'complete blind trust',
    });
  }

  // Cost-Cutting Sacrificer (5)
  for (let i = 0; i < 5; i++) {
    samples.push({
      id: `F_COST_${String(i + 1).padStart(2, '0')}`,
      pattern: 'F',
      subtype: 'Cost-Cutting Sacrificer',
      p1: 1,
      p2: 2,
      p3: 2,
      p4: 1,
      m1: 1,
      m2: 0,
      m3: 1,
      e1: 1,
      e2: 0, // ⚠️  CRITICAL: No reflection on quality loss
      e3: 1,
      r1: 0,
      r2: 1,
      total_score: 11,
      confidence: 0.50,
      rationale:
        'Sacrifices quality for cost savings, ' +
        'uses cheapest AI options without quality check, ' +
        'accepts poor outputs to save money, ' +
        'never reflects on reputation damage, ' +
        'willingly cuts corners',
    });
  }

  // Dependency Denier (5)
  for (let i = 0; i < 5; i++) {
    samples.push({
      id: `F_DEPEND_${String(i + 1).padStart(2, '0')}`,
      pattern: 'F',
      subtype: 'Dependency Denier',
      p1: 2,
      p2: 2,
      p3: 1,
      p4: 0,
      m1: 0,
      m2: 1,
      m3: 1,
      e1: 2,
      e2: 0, // ⚠️  CRITICAL: No reflection on skill loss
      e3: 1,
      r1: 1,
      r2: 3,
      total_score: 14,
      confidence: 0.55,
      rationale:
        'Over-relies on AI and loses own skills, ' +
        'unaware of personal capability atrophy, ' +
        'high trust due to lack of self-reflection, ' +
        'no awareness of growing dependency, ' +
        'at risk of sudden incompetence if AI unavailable',
    });
  }

  return samples;
}

/**
 * Generate all synthetic samples for all patterns
 */
export function generateAllSyntheticSamples(): SyntheticSample[] {
  const allSamples: SyntheticSample[] = [];

  console.log('📊 Generating Synthetic Samples...');
  console.log('  Pattern A: Generating 10 samples...');
  allSamples.push(...generatePatternASamples(10));

  console.log('  Pattern B: Generating 10 samples...');
  allSamples.push(...generatePatternBSamples(10));

  console.log('  Pattern C: Generating 5 samples...');
  allSamples.push(...generatePatternCSamples(5));

  console.log('  Pattern D: Generating 5 samples...');
  allSamples.push(...generatePatternDSamples(5));

  console.log('  Pattern E: Generating 10 samples...');
  allSamples.push(...generatePatternESamples(10));

  console.log('  Pattern F: Generating 20 samples...');
  allSamples.push(...generatePatternFSamples(20));

  return allSamples;
}

/**
 * Export synthetic samples to CSV format
 */
export function exportToCSV(samples: SyntheticSample[]): string {
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

  for (const sample of samples) {
    const values = [
      sample.id,
      sample.pattern,
      sample.confidence.toFixed(3),
      sample.p1,
      sample.p2,
      sample.p3,
      sample.p4,
      sample.m1,
      sample.m2,
      sample.m3,
      sample.e1,
      sample.e2,
      sample.e3,
      sample.r1,
      sample.r2,
      sample.total_score,
      'false',
      `"${sample.subtype}: ${(sample.rationale || '').replace(/"/g, '""')}"`,
    ];

    lines.push(values.join(','));
  }

  return lines.join('\n');
}

/**
 * Validate synthetic samples
 */
export function validateSamples(samples: SyntheticSample[]): {
  valid: boolean;
  errors: string[];
  warnings: string[];
  stats: Record<string, any>;
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  for (const sample of samples) {
    // Validate pattern
    if (!['A', 'B', 'C', 'D', 'E', 'F'].includes(sample.pattern)) {
      errors.push(`${sample.id}: Invalid pattern ${sample.pattern}`);
    }

    // Validate subprocess scores
    const subs = ['p1', 'p2', 'p3', 'p4', 'm1', 'm2', 'm3', 'e1', 'e2', 'e3', 'r1', 'r2'];
    for (const sub of subs) {
      const val = sample[sub as keyof SyntheticSample] as number;
      if (typeof val !== 'number' || val < 0 || val > 3) {
        errors.push(`${sample.id}: ${sub.toUpperCase()} out of range (${val})`);
      }
    }

    // Validate total score
    const calculated = [
      sample.p1, sample.p2, sample.p3, sample.p4,
      sample.m1, sample.m2, sample.m3,
      sample.e1, sample.e2, sample.e3,
      sample.r1, sample.r2,
    ].reduce((a, b) => a + b, 0);

    if (sample.total_score !== calculated) {
      errors.push(
        `${sample.id}: Total mismatch (${sample.total_score} vs ${calculated})`
      );
    }

    // Pattern F specific validation
    if (sample.pattern === 'F' && sample.e2 !== 0) {
      errors.push(`${sample.id}: Pattern F must have E2=0 (got ${sample.e2})`);
    }

    // Confidence validation
    if (sample.confidence < 0 || sample.confidence > 1) {
      errors.push(`${sample.id}: Confidence out of range (${sample.confidence})`);
    }
  }

  // Calculate statistics
  const stats = {
    total_samples: samples.length,
    by_pattern: Object.fromEntries(
      ['A', 'B', 'C', 'D', 'E', 'F'].map(p => [
        p,
        samples.filter(s => s.pattern === p).length,
      ])
    ),
    avg_total_score: samples.reduce((sum, s) => sum + s.total_score, 0) / samples.length,
    avg_confidence: samples.reduce((sum, s) => sum + s.confidence, 0) / samples.length,
  };

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    stats,
  };
}

/**
 * CLI Entry Point
 */
async function main(): Promise<void> {
  const path = await import('path');
  const fs = await import('fs').then(m => m.promises);

  console.log('\n' + '═'.repeat(70));
  console.log('🔧 SYNTHETIC DATA GENERATION FOR ALL PATTERNS');
  console.log('═'.repeat(70) + '\n');

  const samples = generateAllSyntheticSamples();
  const validation = validateSamples(samples);

  console.log('\n📊 Validation Report');
  console.log('─'.repeat(70));

  if (validation.errors.length > 0) {
    console.log(`\n❌ Validation Errors (${validation.errors.length}):`);
    validation.errors.forEach(err => console.log(`  • ${err}`));
    process.exit(1);
  } else {
    console.log('✅ All samples validated successfully\n');
  }

  console.log('📈 Sample Distribution:');
  const stats = validation.stats as any;
  const distrib = stats.by_pattern;
  console.log(`  Pattern A: ${distrib.A} samples`);
  console.log(`  Pattern B: ${distrib.B} samples`);
  console.log(`  Pattern C: ${distrib.C} samples`);
  console.log(`  Pattern D: ${distrib.D} samples`);
  console.log(`  Pattern E: ${distrib.E} samples`);
  console.log(`  Pattern F: ${distrib.F} samples`);
  console.log(`  ─────────────────────`);
  console.log(`  Total:    ${stats.total_samples} samples`);

  console.log(`\n📊 Statistics:`);
  console.log(`  Avg Total Score: ${(stats.avg_total_score as number).toFixed(1)}/36`);
  console.log(`  Avg Confidence:  ${(stats.avg_confidence as number).toFixed(2)}`);

  // Export to CSV
  const csv = exportToCSV(samples);
  const currentDir = path.dirname(new URL(import.meta.url).pathname);
  const outputPath = path.join(currentDir, 'synthetic_data.csv');

  await fs.writeFile(outputPath, csv);
  console.log(`\n💾 CSV Export:`);
  console.log(`  File: synthetic_data.csv`);
  console.log(`  Rows: ${csv.split('\n').length} (including header)`);
  console.log(`  Location: ${outputPath}`);

  console.log('\n' + '═'.repeat(70));
  console.log('✅ Synthetic data generation complete');
  console.log('═'.repeat(70) + '\n');
}

const isMainModule = import.meta.url === `file://${process.argv[1]}`;
if (isMainModule) {
  main().catch(console.error);
}

export type { SyntheticSample };
