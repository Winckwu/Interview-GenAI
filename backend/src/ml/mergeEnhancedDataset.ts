/**
 * Merge Enhanced BD Samples with Hybrid Dataset
 *
 * Strategy:
 * - Start with hybrid dataset (79 samples: A-D all real, E-F real+synthetic)
 * - Add enhanced B samples (15 samples) to strengthen B pattern recognition
 * - Add enhanced D samples (15 samples) to strengthen D pattern recognition
 * - Result: Enhanced dataset (109 samples)
 *
 * Expected Improvements:
 * - Pattern B: More training samples + strong R1 signal (R1=3)
 * - Pattern D: More training samples + low P signal (P=1-3)
 * - Clearer decision boundaries for model training
 */

import * as fs from 'fs'
import * as path from 'path'

async function mergeEnhancedDataset(): Promise<void> {
  console.log('\n' + '═'.repeat(80))
  console.log('🔀 CREATING ENHANCED DATASET (Hybrid + Enhanced B & D)')
  console.log('═'.repeat(80) + '\n')

  const currentDir = path.dirname(new URL(import.meta.url).pathname)
  const hybridPath = path.join(currentDir, 'hybrid_training_data.csv')
  const enhancedBDPath = path.join(currentDir, 'enhanced_bd_synthetic_data.csv')
  const outputPath = path.join(currentDir, 'enhanced_training_data.csv')

  // Read hybrid data
  console.log('📖 Reading hybrid dataset...')
  const hybridContent = fs.readFileSync(hybridPath, 'utf-8')
  const hybridLines = hybridContent.trim().split('\n')
  const header = hybridLines[0]
  const hybridData = hybridLines.slice(1)

  console.log(`  ✓ Hybrid samples: ${hybridData.length}`)

  // Read enhanced BD data
  console.log('📖 Reading enhanced B & D synthetic data...')
  const enhancedContent = fs.readFileSync(enhancedBDPath, 'utf-8')
  const enhancedLines = enhancedContent.trim().split('\n')
  const enhancedData = enhancedLines.slice(1)

  console.log(`  ✓ Enhanced B samples: ${enhancedData.filter((l) => l.split(',')[1] === 'B').length}`)
  console.log(`  ✓ Enhanced D samples: ${enhancedData.filter((l) => l.split(',')[1] === 'D').length}`)

  // Merge: hybrid + enhanced B and D
  console.log('\n🔄 Creating enhanced dataset...')
  const enhancedLines_final = [header, ...hybridData, ...enhancedData]
  const enhancedContent_final = enhancedLines_final.join('\n')

  // Write enhanced file
  fs.writeFileSync(outputPath, enhancedContent_final)
  console.log(`  ✓ Enhanced dataset created: enhanced_training_data.csv`)

  // Analyze distribution
  console.log('\n📊 Distribution Analysis:')
  const patternCounts: Record<string, number> = {}
  let totalSamples = 0

  for (const line of enhancedLines_final.slice(1)) {
    const parts = line.split(',')
    const pattern = parts[1]

    patternCounts[pattern] = (patternCounts[pattern] || 0) + 1
    totalSamples++
  }

  // Compare with hybrid
  const hybridCounts: Record<string, number> = {}
  for (const line of hybridLines.slice(1)) {
    const parts = line.split(',')
    const pattern = parts[1]
    hybridCounts[pattern] = (hybridCounts[pattern] || 0) + 1
  }

  const patterns = ['A', 'B', 'C', 'D', 'E', 'F']

  console.log('\n  Pattern | Hybrid | Enhanced | Change | % of Total')
  console.log('  ─────────────────────────────────────────────────')

  for (const pattern of patterns) {
    const hybridCount = hybridCounts[pattern] || 0
    const enhancedCount = patternCounts[pattern] || 0
    const change = enhancedCount - hybridCount
    const pct = ((enhancedCount / totalSamples) * 100).toFixed(1)

    let arrow = ''
    if (pattern === 'B' || pattern === 'D') {
      arrow = ' ✅' // Emphasize the improvements
    }

    console.log(
      `    ${pattern}    |   ${String(hybridCount).padStart(2)}   |    ${String(enhancedCount).padStart(2)}    |  +${String(change).padStart(2)}   | ${String(pct).padStart(5)}%${arrow}`
    )
  }

  console.log('  ─────────────────────────────────────────────────')
  console.log(`  Total  |   ${String(hybridLines.length - 1).padStart(2)}   |    ${String(totalSamples).padStart(2)}    | +${String(totalSamples - (hybridLines.length - 1)).padStart(2)}   |  100%')

  console.log('\n🎯 Key Improvements:')
  const bChange = (patternCounts['B'] || 0) - (hybridCounts['B'] || 0)
  const dChange = (patternCounts['D'] || 0) - (hybridCounts['D'] || 0)
  console.log(
    `  Pattern B: ${hybridCounts['B'] || 0} -> ${patternCounts['B'] || 0} (+${bChange}) STRONGER ITERATION SIGNAL (R1=3)`
  )
  console.log(
    `  Pattern D: ${hybridCounts['D'] || 0} -> ${patternCounts['D'] || 0} (+${dChange}) CLEARER VERIFICATION SIGNAL (LOW P)`
  )

  console.log('\n' + '═'.repeat(80))
  console.log('✅ Enhanced dataset creation complete')
  console.log(`📁 Output: enhanced_training_data.csv (${totalSamples} samples)`)
  console.log('═'.repeat(80) + '\n')

  // Summary comparison
  console.log('\n📊 SUMMARY: Dataset Evolution\n')
  console.log('                  | Original | Hybrid | Enhanced')
  console.log('  ────────────────┼──────────┼────────┼─────────')
  console.log(`  Total Samples   |    49    |   79   |   ${String(totalSamples).padStart(3)}`)
  console.log(
    `  Pattern A       |    10    |   10   |   ${String(patternCounts['A'] || 0).padStart(3)}`
  )
  console.log(
    `  Pattern B       |     5    |    5   |   ${String(patternCounts['B'] || 0).padStart(3)}`
  )
  console.log(
    `  Pattern C       |    22    |   22   |   ${String(patternCounts['C'] || 0).padStart(3)}`
  )
  console.log(
    `  Pattern D       |     9    |    9   |   ${String(patternCounts['D'] || 0).padStart(3)}`
  )
  console.log(
    `  Pattern E       |     1    |   11   |   ${String(patternCounts['E'] || 0).padStart(3)}`
  )
  console.log(
    `  Pattern F       |     2    |   22   |   ${String(patternCounts['F'] || 0).padStart(3)}`
  )
  console.log('  ────────────────┼──────────┼────────┼─────────')

  console.log('\nExpected Performance Improvements:')
  console.log('  📈 Pattern B: Better recall due to +10 targeted samples with R1=3')
  console.log('  📈 Pattern D: Better recall due to +6 targeted samples with low P')
  console.log('  📈 Overall: Clearer decision boundaries for SVM/RF/XGBoost')
}

const isMainModule = import.meta.url === `file://${process.argv[1]}`
if (isMainModule) {
  mergeEnhancedDataset().catch(console.error)
}

export { mergeEnhancedDataset }
