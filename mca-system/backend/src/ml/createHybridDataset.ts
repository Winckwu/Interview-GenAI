/**
 * Create Hybrid Dataset (Option C)
 *
 * Strategy: Keep ALL real data (all patterns A-F)
 *           Add synthetic data ONLY for patterns E and F
 *
 * Rationale:
 * - Patterns A-D have adequate real samples (5-22 each)
 * - Patterns E-F critically underrepresented (1-2 samples)
 * - This approach reduces distribution shift while gaining rare pattern detection
 *
 * Expected result:
 * - Pattern A-D: Maintain ~70% performance on majority classes
 * - Pattern E-F: Improve to >90% recall with synthetic data
 * - Total accuracy: ~75-80% (vs 64% with full augmentation)
 */

import * as fs from 'fs';
import * as path from 'path';

async function createHybridDataset(): Promise<void> {
  console.log('\n' + '═'.repeat(70));
  console.log('🔀 CREATING HYBRID DATASET (Option C)');
  console.log('═'.repeat(70) + '\n');

  const currentDir = path.dirname(new URL(import.meta.url).pathname);
  const realPath = path.join(currentDir, 'training_data.csv');
  const syntheticPath = path.join(currentDir, 'synthetic_data.csv');
  const outputPath = path.join(currentDir, 'hybrid_training_data.csv');

  // Read real data
  console.log('📖 Reading real data...');
  const realContent = fs.readFileSync(realPath, 'utf-8');
  const realLines = realContent.trim().split('\n');
  const header = realLines[0];
  const realData = realLines.slice(1);

  console.log(`  ✓ Real samples: ${realData.length}`);

  // Read synthetic data
  console.log('📖 Reading synthetic data...');
  const syntheticContent = fs.readFileSync(syntheticPath, 'utf-8');
  const syntheticLines = syntheticContent.trim().split('\n');
  const syntheticData = syntheticLines.slice(1);

  console.log(`  ✓ Synthetic samples: ${syntheticData.length}`);

  // Filter synthetic data: ONLY keep E and F patterns
  console.log('\n🔍 Filtering synthetic data...');
  const syntheticEF = syntheticData.filter(line => {
    const pattern = line.split(',')[1];
    return pattern === 'E' || pattern === 'F';
  });

  console.log(`  ✓ Synthetic E samples: ${syntheticData.filter(l => l.split(',')[1] === 'E').length}`);
  console.log(`  ✓ Synthetic F samples: ${syntheticData.filter(l => l.split(',')[1] === 'F').length}`);
  console.log(`  ✓ Kept total: ${syntheticEF.length} (E+F only)`);

  // Merge: all real + synthetic E,F only
  console.log('\n🔄 Creating hybrid dataset...');
  const hybridLines = [header, ...realData, ...syntheticEF];
  const hybridContent = hybridLines.join('\n');

  // Write hybrid file
  fs.writeFileSync(outputPath, hybridContent);
  console.log(`  ✓ Hybrid dataset created: hybrid_training_data.csv`);

  // Analyze distribution
  console.log('\n📊 Distribution Analysis:');
  const patternCounts: Record<string, number> = {};
  let totalSamples = 0;

  for (const line of hybridLines.slice(1)) {
    const parts = line.split(',');
    const pattern = parts[1];

    patternCounts[pattern] = (patternCounts[pattern] || 0) + 1;
    totalSamples++;
  }

  const patterns = ['A', 'B', 'C', 'D', 'E', 'F'];
  const realCounts = {
    A: realData.filter(l => l.split(',')[1] === 'A').length,
    B: realData.filter(l => l.split(',')[1] === 'B').length,
    C: realData.filter(l => l.split(',')[1] === 'C').length,
    D: realData.filter(l => l.split(',')[1] === 'D').length,
    E: realData.filter(l => l.split(',')[1] === 'E').length,
    F: realData.filter(l => l.split(',')[1] === 'F').length,
  };

  console.log('\n  Pattern | Real | Synthetic | Total | % of All | Real Only %');
  console.log('  ─────────────────────────────────────────────────────────────');

  for (const pattern of patterns) {
    const total = patternCounts[pattern] || 0;
    const real = realCounts[pattern as keyof typeof realCounts] || 0;
    const synthetic = total - real;
    const pct = ((total / totalSamples) * 100).toFixed(1);
    const realPct = ((real / (realData.length)) * 100).toFixed(1);

    console.log(
      `     ${pattern}    |   ${String(real).padStart(2)}   |     ${String(synthetic).padStart(2)}      |  ${String(total).padStart(2)}   | ${String(pct).padStart(5)}% |     ${String(realPct).padStart(5)}%`
    );
  }

  console.log('  ─────────────────────────────────────────────────────────────');
  console.log(`  Total  |   ${String(realData.length).padStart(2)}   |     ${String(syntheticEF.length).padStart(2)}      |  ${String(totalSamples).padStart(2)}   |  100% |`);

  // Key improvements
  console.log('\n🎯 Key Improvements vs Original (49 samples):');

  const origPatternE = realCounts['E'];
  const hybridPatternE = patternCounts['E'] || 0;
  console.log(`  Pattern E: ${origPatternE} → ${hybridPatternE} (+${hybridPatternE - origPatternE}) ✅`);

  const origPatternF = realCounts['F'];
  const hybridPatternF = patternCounts['F'] || 0;
  console.log(`  Pattern F: ${origPatternF} → ${hybridPatternF} (+${hybridPatternF - origPatternF}) ✅`);

  console.log(`\n🎯 Key Differences vs Augmented (109 samples):`);
  const augmentedTotal = 109;
  const reductionRate = (((augmentedTotal - totalSamples) / augmentedTotal) * 100).toFixed(1);
  console.log(`  Total samples: 109 → ${totalSamples} (-${reductionRate}%)`);
  console.log(`  Distribution shift: Reduced (less synthetic A, B, C, D)`);
  console.log(`  Rare pattern support: Maintained (E: 11, F: 22)`);

  console.log('\n' + '═'.repeat(70));
  console.log('✅ Hybrid dataset creation complete');
  console.log(`📁 Output: hybrid_training_data.csv (${totalSamples} samples)`);
  console.log('═'.repeat(70) + '\n');

  // Comparison table
  console.log('📊 SUMMARY: Dataset Comparison\n');
  console.log('                | Original | Augmented | Hybrid');
  console.log('  ──────────────┼──────────┼───────────┼────────');
  console.log(`  Total Samples |    49    |    109    |  ${String(totalSamples).padStart(2)}`);
  console.log(`  Pattern A     |    10    |    20     |  ${String(patternCounts['A'] || 0).padStart(2)}`);
  console.log(`  Pattern B     |     5    |    15     |  ${String(patternCounts['B'] || 0).padStart(2)}`);
  console.log(`  Pattern C     |    22    |    27     |  ${String(patternCounts['C'] || 0).padStart(2)}`);
  console.log(`  Pattern D     |     9    |    14     |  ${String(patternCounts['D'] || 0).padStart(2)}`);
  console.log(`  Pattern E     |     1    |    11     |  ${String(patternCounts['E'] || 0).padStart(2)}`);
  console.log(`  Pattern F     |     2    |    22     |  ${String(patternCounts['F'] || 0).padStart(2)}`);
  console.log('  ──────────────┼──────────┼───────────┼────────');
  console.log(`  Worst Class % |    2.0   |   10.1    |  ${(((patternCounts['E'] || 0) / totalSamples) * 100).toFixed(1)}`);
}

const isMainModule = import.meta.url === `file://${process.argv[1]}`;
if (isMainModule) {
  createHybridDataset().catch(console.error);
}

export { createHybridDataset };
