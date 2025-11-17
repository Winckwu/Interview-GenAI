/**
 * Merge Original and Synthetic Training Data
 *
 * Combines the original 49 interview samples with 60 synthetic samples
 * to create an augmented dataset of 109 total samples.
 */

import * as fs from 'fs';
import * as path from 'path';

async function mergeDatasets(): Promise<void> {
  console.log('\n' + '═'.repeat(70));
  console.log('🔀 MERGING ORIGINAL AND SYNTHETIC DATA');
  console.log('═'.repeat(70) + '\n');

  const currentDir = path.dirname(new URL(import.meta.url).pathname);
  const originalPath = path.join(currentDir, 'training_data.csv');
  const syntheticPath = path.join(currentDir, 'synthetic_data.csv');
  const outputPath = path.join(currentDir, 'augmented_training_data.csv');

  // Read original data
  console.log('📖 Reading original data...');
  const originalContent = fs.readFileSync(originalPath, 'utf-8');
  const originalLines = originalContent.trim().split('\n');
  const header = originalLines[0];
  const originalData = originalLines.slice(1);

  console.log(`  ✓ Original samples: ${originalData.length}`);

  // Read synthetic data
  console.log('📖 Reading synthetic data...');
  const syntheticContent = fs.readFileSync(syntheticPath, 'utf-8');
  const syntheticLines = syntheticContent.trim().split('\n');
  const syntheticData = syntheticLines.slice(1); // Skip header (same format)

  console.log(`  ✓ Synthetic samples: ${syntheticData.length}`);

  // Merge data
  console.log('\n🔄 Merging datasets...');
  const mergedLines = [header, ...originalData, ...syntheticData];
  const mergedContent = mergedLines.join('\n');

  // Write merged file
  fs.writeFileSync(outputPath, mergedContent);
  console.log(`  ✓ Merged file created: augmented_training_data.csv`);

  // Analyze distribution
  console.log('\n📊 Distribution Analysis:');
  const patternCounts: Record<string, number> = {};
  let totalScore = 0;
  let totalSamples = 0;

  for (const line of mergedLines.slice(1)) {
    const parts = line.split(',');
    const pattern = parts[1]; // pattern column
    const totalScoreStr = parts[15]; // total_score column

    patternCounts[pattern] = (patternCounts[pattern] || 0) + 1;
    totalScore += parseFloat(totalScoreStr);
    totalSamples++;
  }

  const patterns = ['A', 'B', 'C', 'D', 'E', 'F'];
  for (const pattern of patterns) {
    const count = patternCounts[pattern] || 0;
    const percentage = ((count / totalSamples) * 100).toFixed(1);
    const original = originalData.filter(l => l.split(',')[1] === pattern).length;
    const synthetic = syntheticData.filter(l => l.split(',')[1] === pattern).length;

    console.log(
      `  Pattern ${pattern}: ${String(count).padStart(3)} samples (${String(percentage).padStart(5)}%) ` +
        `[Real: ${original}, Synthetic: ${synthetic}]`
    );
  }

  console.log(`  ─────────────────────────────────────────────────────────`);
  console.log(`  Total: ${totalSamples} samples`);
  console.log(`  Avg Total Score: ${(totalScore / totalSamples).toFixed(1)}/36`);

  // Key improvements
  console.log('\n🎯 Key Improvements:');
  const origPatternE = originalData.filter(l => l.split(',')[1] === 'E').length;
  const augPatternE = (patternCounts['E'] || 0);
  console.log(`  Pattern E: ${origPatternE} → ${augPatternE} (+${augPatternE - origPatternE}) ✅`);

  const origPatternF = originalData.filter(l => l.split(',')[1] === 'F').length;
  const augPatternF = (patternCounts['F'] || 0);
  console.log(`  Pattern F: ${origPatternF} → ${augPatternF} (+${augPatternF - origPatternF}) ✅`);

  const improvement = (((totalSamples - originalData.length) / originalData.length) * 100).toFixed(1);
  console.log(`  Total dataset size: ${originalData.length} → ${totalSamples} (+${improvement}%) ✅`);

  console.log('\n' + '═'.repeat(70));
  console.log('✅ Dataset merge complete');
  console.log(`📁 Output: augmented_training_data.csv (${totalSamples} samples)`);
  console.log('═'.repeat(70) + '\n');
}

const isMainModule = import.meta.url === `file://${process.argv[1]}`;
if (isMainModule) {
  mergeDatasets().catch(console.error);
}

export { mergeDatasets };
