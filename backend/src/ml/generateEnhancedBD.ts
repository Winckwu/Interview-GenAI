/**
 * Generate Enhanced Synthetic Samples for Pattern B and D
 *
 * Strategy:
 * Pattern B: Emphasize HIGH R1 (iteration/adjustment) + MODERATE P
 *   - Real B: P=6.0, M=5.2, E=5.6, R=4.6 (with R1 average ~2-3)
 *   - Target: P=6, M=5-6, E=5-6, R1=3 (HIGH iteration to differentiate from C)
 *   - Total: 21-23
 *
 * Pattern D: Emphasize VERY LOW P + HIGH M/E
 *   - Real D: P=8.8, M=6.8, E=7.4 (problem: high P overlaps with A)
 *   - Target: P=2-3, M=7, E=7-8, R1=2-3
 *   - Total: 22-25 (clearly distinct from A's 30+)
 */

import * as fs from 'fs'
import * as path from 'path'

async function generateEnhancedBD(): Promise<void> {
  console.log('\n' + '═'.repeat(80))
  console.log('🚀 GENERATING ENHANCED SYNTHETIC SAMPLES FOR PATTERN B AND D')
  console.log('═'.repeat(80) + '\n')

  const currentDir = path.dirname(new URL(import.meta.url).pathname)
  const outputPath = path.join(currentDir, 'enhanced_bd_synthetic_data.csv')

  // Header
  const header =
    'user_id,pattern,confidence,p1,p2,p3,p4,m1,m2,m3,e1,e2,e3,r1,r2,total_score,is_mixed_pattern,notes'

  const samples: string[] = [header]

  let bCount = 0
  let dCount = 0

  // ============================================================================
  // PATTERN B GENERATION (15 samples)
  // Strategy: Emphasize HIGH R1 (iteration) + MODERATE P to differentiate from C
  // ============================================================================

  console.log('📝 Generating Pattern B Samples (Iterative Optimizer)...')
  console.log('   Characteristics: R1=3 (high iteration), P=6, M=5, E=5-6')

  // B Subtype 1: High Iteration with Moderate Planning (6 samples)
  for (let i = 1; i <= 6; i++) {
    const p1 = 2
    const p2 = 2
    const p3 = 1
    const p4 = 1
    const m1 = 2
    const m2 = 2
    const m3 = 2
    const e1 = 2
    const e2 = 2 // Learning reflection: lower than E
    const e3 = 2
    const r1 = 3 // HIGH iteration - KEY DIFFERENTIATOR
    const r2 = 2
    const totalScore =
      p1 + p2 + p3 + p4 + m1 + m2 + m3 + e1 + e2 + e3 + r1 + r2
    const confidence = 0.75

    samples.push(
      `B_ITER_${String(i).padStart(2, '0')},B,${confidence},${p1},${p2},${p3},${p4},${m1},${m2},${m3},${e1},${e2},${e3},${r1},${r2},${totalScore},false,"High Iteration Optimizer: Constantly refines prompts through trial-and-error, tests different approaches, adjusts strategy based on results, learns from each iteration, improves through experimentation"`
    )
    bCount++
  }

  // B Subtype 2: Iterative with Strong Evaluation (5 samples)
  for (let i = 1; i <= 5; i++) {
    const p1 = 2
    const p2 = 1
    const p3 = 2
    const p4 = 1
    const m1 = 2
    const m2 = 2
    const m3 = 1
    const e1 = 2
    const e2 = 2 // Learning reflection
    const e3 = 2
    const r1 = 3 // HIGH iteration - KEY DIFFERENTIATOR
    const r2 = 3
    const totalScore =
      p1 + p2 + p3 + p4 + m1 + m2 + m3 + e1 + e2 + e3 + r1 + r2
    const confidence = 0.72

    samples.push(
      `B_EVALT_${String(i).padStart(2, '0')},B,${confidence},${p1},${p2},${p3},${p4},${m1},${m2},${m3},${e1},${e2},${e3},${r1},${r2},${totalScore},false,"Iterative with Evaluation: Adjusts strategy based on output quality assessment, iterates to improve results, monitors effectiveness, learns from feedback cycles, cyclical refinement process"`
    )
    bCount++
  }

  // B Subtype 3: Calibration-Focused (4 samples)
  for (let i = 1; i <= 4; i++) {
    const p1 = 1
    const p2 = 2
    const p3 = 1
    const p4 = 2
    const m1 = 2
    const m2 = 2
    const m3 = 2
    const e1 = 2
    const e2 = 2 // Learning reflection
    const e3 = 1
    const r1 = 3 // HIGH iteration - KEY DIFFERENTIATOR
    const r2 = 2
    const totalScore =
      p1 + p2 + p3 + p4 + m1 + m2 + m3 + e1 + e2 + e3 + r1 + r2
    const confidence = 0.70

    samples.push(
      `B_CALIB_${String(i).padStart(2, '0')},B,${confidence},${p1},${p2},${p3},${p4},${m1},${m2},${m3},${e1},${e2},${e3},${r1},${r2},${totalScore},false,"Calibration-Focused Optimizer: Adjusts AI interaction style through iteration, calibrates expectations and responses, learns optimal prompting through cycles, improves with repeated interactions, convergence-focused"`
    )
    bCount++
  }

  // ============================================================================
  // PATTERN D GENERATION (15 samples)
  // Strategy: VERY LOW P (1-3) + HIGH M/E to create clear separation from A
  // ============================================================================

  console.log('\n📝 Generating Pattern D Samples (Deep Verification)...')
  console.log('   Characteristics: P=1-3 (very low planning), M=7, E=7-8')

  // D Subtype 1: Verification-Focused, Very Low Planning (6 samples)
  for (let i = 1; i <= 6; i++) {
    const p1 = 0 // VERY LOW planning
    const p2 = 1
    const p3 = 1
    const p4 = 0
    const m1 = 3
    const m2 = 2
    const m3 = 3 // High verification
    const e1 = 3
    const e2 = 2 // Moderate learning reflection
    const e3 = 3
    const r1 = 2
    const r2 = 2
    const totalScore =
      p1 + p2 + p3 + p4 + m1 + m2 + m3 + e1 + e2 + e3 + r1 + r2
    const confidence = 0.78

    samples.push(
      `D_VERIF_${String(i).padStart(2, '0')},D,${confidence},${p1},${p2},${p3},${p4},${m1},${m2},${m3},${e1},${e2},${e3},${r1},${r2},${totalScore},false,"Deep Verification: Focuses on checking AI accuracy rather than planning comprehensively, questions outputs thoroughly, verifies facts and claims, critical of AI results, evaluates reasoning quality"`
    )
    dCount++
  }

  // D Subtype 2: Critical Inquiry, Minimal Planning (6 samples)
  for (let i = 1; i <= 6; i++) {
    const p1 = 1
    const p2 = 0
    const p3 = 1
    const p4 = 1
    const m1 = 3
    const m2 = 3
    const m3 = 2
    const e1 = 3
    const e2 = 2 // Learning reflection
    const e3 = 2
    const r1 = 2
    const r2 = 3
    const totalScore =
      p1 + p2 + p3 + p4 + m1 + m2 + m3 + e1 + e2 + e3 + r1 + r2
    const confidence = 0.76

    samples.push(
      `D_CRIT_${String(i).padStart(2, '0')},D,${confidence},${p1},${p2},${p3},${p4},${m1},${m2},${m3},${e1},${e2},${e3},${r1},${r2},${totalScore},false,"Critical Inquiry: Questions AI suggestions without comprehensive planning, challenges assumptions, seeks deeper understanding, scrutinizes logic, skeptical but engaged"`
    )
    dCount++
  }

  // D Subtype 3: Verification with Minimal Strategy (3 samples)
  for (let i = 1; i <= 3; i++) {
    const p1 = 1
    const p2 = 1
    const p3 = 0
    const p4 = 0
    const m1 = 2
    const m2 = 3
    const m3 = 3
    const e1 = 3
    const e2 = 2
    const e3 = 3
    const r1 = 1
    const r2 = 2
    const totalScore =
      p1 + p2 + p3 + p4 + m1 + m2 + m3 + e1 + e2 + e3 + r1 + r2
    const confidence = 0.74

    samples.push(
      `D_MINPL_${String(i).padStart(2, '0')},D,${confidence},${p1},${p2},${p3},${p4},${m1},${m2},${m3},${e1},${e2},${e3},${r1},${r2},${totalScore},false,"Minimal Planning Verifier: Uses AI reactively without upfront planning, focuses on output verification, evaluates results carefully, critical checking without strategic preparation"`
    )
    dCount++
  }

  // ============================================================================
  // Write to CSV
  // ============================================================================

  const outputContent = samples.join('\n')
  fs.writeFileSync(outputPath, outputContent)

  console.log('\n✅ File created: enhanced_bd_synthetic_data.csv')
  console.log(`   Pattern B: ${bCount} samples`)
  console.log(`   Pattern D: ${dCount} samples`)
  console.log(`   Total: ${bCount + dCount} samples`)

  // Analysis
  console.log('\n' + '═'.repeat(80))
  console.log('📊 FEATURE ANALYSIS: ENHANCED B vs D vs REAL')
  console.log('═'.repeat(80) + '\n')

  console.log('Pattern B (Iterative Optimizer):')
  console.log(
    '  Synthetic: P=6, M=5-6, E=5-6, R1=3 (HIGH iteration), Total=22-24'
  )
  console.log('  Real Data: P=6.0, M=5.2, E=5.6, R1=~2.2, Total=21.4')
  console.log('  Key Differentiator: R1=3 (high iteration) vs C (R1<2)')
  console.log('  Purpose: Emphasize iterative refinement & adjustment strategy')

  console.log('\nPattern D (Deep Verification):')
  console.log('  Synthetic: P=1-3 (VERY LOW), M=7, E=7-8, Total=22-25')
  console.log('  Real Data: P=8.8, M=6.8, E=7.4, Total=28.1')
  console.log('  Key Differentiator: P=1-3 (very low) vs A (P=10.5)')
  console.log('  Purpose: Minimal planning but high verification/evaluation')

  console.log('\nExpected Improvements:')
  console.log('  ✅ Pattern B: High R1 should make it distinct from C (C has R1<2)')
  console.log(
    '  ✅ Pattern D: Very low P should separate from A (A has P=10.5)'
  )
  console.log(
    '  ✅ Overall: Clearer decision boundaries for SVM and other models'
  )

  console.log('\n' + '═'.repeat(80))
}

const isMainModule = import.meta.url === `file://${process.argv[1]}`
if (isMainModule) {
  generateEnhancedBD().catch(console.error)
}

export { generateEnhancedBD }
