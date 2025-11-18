/**
 * Synthetic Pattern F Data Generation
 *
 * Addresses underrepresentation of Pattern F (Passive & Ineffective Use)
 * in the training dataset due to recruitment bias toward experienced users.
 *
 * Generates synthetic samples covering different Pattern F subtypes:
 * 1. Lazy Avoidant: Has capability but avoids systematic engagement
 * 2. Naive Oversimplifier: Genuine misunderstanding of AI limitations
 * 3. Cost-Cutting Sacrificer: Willingly sacrifices quality for efficiency
 * 4. Dependency Denier: Unaware of over-reliance and skill atrophy
 */

interface SyntheticPatternFSample {
  id: string;
  subtype: string;
  p1: number;
  p2: number;
  p3: number;
  p4: number;
  m1: number;
  m2: number;
  m3: number;
  e1: number;
  e2: number; // Critical: should be 0 for Pattern F
  e3: number;
  r1: number;
  r2: number;
  total_score: number;
  confidence: number;
  rationale: string;
}

/**
 * Generate a set of diverse Pattern F synthetic samples
 */
export function generatePatternFSamples(count: number = 20): SyntheticPatternFSample[] {
  const samples: SyntheticPatternFSample[] = [];

  // Subtype 1: Lazy Avoidant (has skill, doesn't use it systematically)
  // E.g., student who could do homework but doesn't bother
  for (let i = 0; i < 5; i++) {
    samples.push({
      id: `F_LAZY_${String(i + 1).padStart(2, '0')}`,
      subtype: 'Lazy Avoidant',
      p1: 1,                    // Avoids decomposition despite capability
      p2: 2,                    // Can set goals but doesn't consistently
      p3: 1,                    // Minimal strategy exploration
      p4: 0,                    // No resource planning
      m1: 1,                    // Minimal progress monitoring
      m2: 1,                    // Very little verification
      m3: 1,                    // No context awareness
      e1: 1,                    // Weak evaluation
      e2: 0,                    // ⚠️  NO learning reflection - key Pattern F marker
      e3: 1,                    // Limited capability judgment
      r1: 0,                    // No strategy adjustment
      r2: 1,                    // Basic trust, no calibration
      total_score: 10,          // Well below threshold (15)
      confidence: 0.45,         // Moderate-low confidence
      rationale:
        'Student uses ChatGPT for assignments but never reviews quality, ' +
        'takes whatever output without modification, ' +
        'no reflection on mistakes, ' +
        'treats AI as "submit button" not tool',
    });
  }

  // Subtype 2: Naive Oversimplifier (genuinely misunderstands AI)
  // E.g., elderly person who thinks AI is magic/infallible
  for (let i = 0; i < 5; i++) {
    samples.push({
      id: `F_NAIVE_${String(i + 1).padStart(2, '0')}`,
      subtype: 'Naive Oversimplifier',
      p1: 1,                    // No task structure
      p2: 1,                    // Vague goals ("just generate something")
      p3: 0,                    // No strategy selection
      p4: 0,                    // No preparation
      m1: 0,                    // No progress monitoring
      m2: 0,                    // No verification (trusts AI implicitly)
      m3: 0,                    // No context awareness
      e1: 1,                    // Weak evaluation (accepts outputs uncritically)
      e2: 0,                    // ⚠️  NO learning - believes AI is infallible
      e3: 0,                    // No capability judgment (thinks AI can do everything)
      r1: 0,                    // No adjustment
      r2: 1,                    // Blind trust
      total_score: 4,           // Very low - nearly zero engagement
      confidence: 0.40,         // Low confidence
      rationale:
        'Believes ChatGPT is "magic" that always works, ' +
        'uses for sensitive decisions without verification, ' +
        'no awareness of hallucinations, ' +
        'complete blind trust without reflection',
    });
  }

  // Subtype 3: Cost-Cutting Sacrificer (willingly sacrifices quality)
  // E.g., small business cutting corners to reduce costs
  for (let i = 0; i < 5; i++) {
    samples.push({
      id: `F_COST_${String(i + 1).padStart(2, '0')}`,
      subtype: 'Cost-Cutting Sacrificer',
      p1: 1,                    // Minimal decomposition
      p2: 2,                    // Goal: "use AI to save money"
      p3: 2,                    // Multi-tool but only for cost (cheap models)
      p4: 1,                    // Minimal resource planning
      m1: 1,                    // Only financial monitoring
      m2: 0,                    // No quality checking ("good enough")
      m3: 1,                    // Aware of context but doesn't adjust
      e1: 1,                    // Evaluates only cost, not quality
      e2: 0,                    // ⚠️  NO reflection on quality loss
      e3: 1,                    // Understands AI limits but ignores them
      r1: 0,                    // No quality adjustment
      r2: 1,                    // "Efficient" trust based on cost not quality
      total_score: 11,          // Below threshold
      confidence: 0.50,         // Low-moderate
      rationale:
        'Uses cheapest AI model for customer deliverables, ' +
        'no quality verification, ' +
        'accepts poor outputs to save cost, ' +
        'no learning from customer complaints, ' +
        'willingly sacrifices reputation',
    });
  }

  // Subtype 4: Dependency Denier (unaware of over-reliance)
  // E.g., professional whose skills atrophy from over-use
  for (let i = 0; i < 5; i++) {
    samples.push({
      id: `F_DEPEND_${String(i + 1).padStart(2, '0')}`,
      subtype: 'Dependency Denier',
      p1: 2,                    // Used to plan, now just dumps to AI
      p2: 2,                    // Sets goals but relies entirely on AI
      p3: 1,                    // Only uses one model
      p4: 0,                    // No prep, just "AI do it"
      m1: 0,                    // No monitoring
      m2: 1,                    // Minimal checking
      m3: 1,                    // Some context awareness
      e1: 2,                    // Evaluates output but accepts defaults
      e2: 0,                    // ⚠️  NO reflection on skill loss
      e3: 1,                    // Knows AI limits but denies personal atrophy
      r1: 1,                    // Some adjustment but passive
      r2: 3,                    // High trust (because doesn't verify)
      total_score: 14,          // Just below threshold
      confidence: 0.55,         // Moderate-low
      rationale:
        'Professional who now relies entirely on AI for daily work, ' +
        'no longer maintains own skills, ' +
        'high trust because no awareness of atrophy, ' +
        'no reflection on capability loss, ' +
        'at risk of sudden incompetence if AI unavailable',
    });
  }

  return samples;
}

/**
 * Export synthetic samples to CSV format compatible with training_data.csv
 */
export function exportSyntheticToCSV(samples: SyntheticPatternFSample[]): string {
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
      'F', // Pattern F
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
      'false', // Synthetic samples are not mixed patterns
      `"${sample.subtype}: ${(sample.rationale || '').replace(/"/g, '""')}"`,
    ];

    lines.push(values.join(','));
  }

  return lines.join('\n');
}

/**
 * Generate validation report for synthetic data
 */
export function validateSyntheticSamples(samples: SyntheticPatternFSample[]): {
  valid: boolean;
  errors: string[];
  warnings: string[];
  stats: Record<string, any>;
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  for (const sample of samples) {
    // Check E2 is 0 for Pattern F
    if (sample.e2 !== 0) {
      errors.push(`${sample.id}: E2 must be 0 for Pattern F (got ${sample.e2})`);
    }

    // Check all scores are in valid range
    const subs = [
      'p1', 'p2', 'p3', 'p4', 'm1', 'm2', 'm3', 'e1', 'e2', 'e3', 'r1', 'r2',
    ];
    for (const sub of subs) {
      const val = sample[sub as keyof SyntheticPatternFSample] as number;
      if (typeof val !== 'number' || val < 0 || val > 3) {
        errors.push(`${sample.id}: ${sub.toUpperCase()} out of range (${val})`);
      }
    }

    // Check total score
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

    // Check confidence
    if (sample.confidence < 0 || sample.confidence > 1) {
      errors.push(`${sample.id}: Confidence out of range (${sample.confidence})`);
    }

    // Warning: Pattern F should be low total score
    if (sample.total_score >= 20) {
      warnings.push(
        `${sample.id}: Total score ${sample.total_score} is high for Pattern F (typically <18)`
      );
    }
  }

  // Calculate statistics
  const stats = {
    total_samples: samples.length,
    avg_total_score: samples.reduce((sum, s) => sum + s.total_score, 0) / samples.length,
    avg_confidence: samples.reduce((sum, s) => sum + s.confidence, 0) / samples.length,
    e2_all_zero: samples.every(s => s.e2 === 0),
    subtype_distribution: samples.reduce(
      (dist, s) => {
        dist[s.subtype] = (dist[s.subtype] || 0) + 1;
        return dist;
      },
      {} as Record<string, number>
    ),
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
  console.log('🔧 Generating Synthetic Pattern F Samples...\n');

  const samples = generatePatternFSamples(20);
  const validation = validateSyntheticSamples(samples);

  console.log('📊 Synthetic Data Generation Report');
  console.log('═'.repeat(60));

  console.log(`\nGenerated: ${validation.stats.total_samples} samples`);
  console.log(`  Lazy Avoidant: ${validation.stats.subtype_distribution['Lazy Avoidant'] || 0}`);
  console.log(`  Naive Oversimplifier: ${validation.stats.subtype_distribution['Naive Oversimplifier'] || 0}`);
  console.log(`  Cost-Cutting Sacrificer: ${validation.stats.subtype_distribution['Cost-Cutting Sacrificer'] || 0}`);
  console.log(`  Dependency Denier: ${validation.stats.subtype_distribution['Dependency Denier'] || 0}`);

  console.log(`\n📈 Statistics:`);
  console.log(`  Avg Total Score: ${(validation.stats.avg_total_score as number).toFixed(1)}/36`);
  console.log(`  Avg Confidence: ${(validation.stats.avg_confidence as number).toFixed(2)}`);
  console.log(`  All E2=0: ${validation.stats.e2_all_zero ? '✅' : '❌'}`);

  if (validation.errors.length > 0) {
    console.log(`\n❌ Validation Errors (${validation.errors.length}):`);
    validation.errors.slice(0, 5).forEach(err => console.log(`  • ${err}`));
  } else {
    console.log(`\n✅ All samples validated`);
  }

  if (validation.warnings.length > 0) {
    console.log(`\n⚠️  Warnings (${validation.warnings.length}):`);
    validation.warnings.forEach(warn => console.log(`  • ${warn}`));
  }

  // Export to CSV
  const csv = exportSyntheticToCSV(samples);
  console.log(`\n💾 CSV Export:`);
  console.log(`  Lines: ${csv.split('\n').length}`);
  console.log(`  Ready for: src/ml/synthetic_pattern_f.csv`);

  console.log('\n' + '═'.repeat(60));
  console.log('✅ Synthetic data generation complete');
}

if (require.main === module) {
  main().catch(console.error);
}

export { SyntheticPatternFSample };
export default generatePatternFSamples;
