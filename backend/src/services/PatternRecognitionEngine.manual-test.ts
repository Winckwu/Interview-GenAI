/**
 * Manual Test Runner for Pattern Recognition Engine
 */

import {
  PatternRecognitionEngine,
  MetacognitiveFeatures,
} from './PatternRecognitionEngine.js';

const engine = new PatternRecognitionEngine();

console.log('🧪 Pattern Recognition Engine - Manual Test Suite\n');
console.log('=' .repeat(70));

// ============================================================
// Test Case 1: Pattern A
// ============================================================

console.log('\n📝 Test Case 1: Pattern A (Strategic Decomposition & Control)');
console.log('-'.repeat(70));

const patternA_features: MetacognitiveFeatures = {
  taskDecompositionScore: 3,
  promptSpecificity: 9.0,
  strategyDiversity: 3,
  independentAttemptRate: 0.9,
  sessionDurationPattern: 0.8,
  verificationRate: 0.85,
  trustCalibrationAccuracy: 0.8,
  modificationRate: 0.7,
  confidenceScore: 0.75,
  errorAwareness: 0.9,
  iterationFrequency: 0.4,
  crossModelUsage: 2,
};

const resultA = engine.detect(patternA_features);

console.log('Input Features (selected):');
console.log(`  - taskDecompositionScore: ${patternA_features.taskDecompositionScore}`);
console.log(`  - verificationRate: ${patternA_features.verificationRate}`);
console.log(`  - errorAwareness: ${patternA_features.errorAwareness}`);
console.log(`  - independentAttemptRate: ${patternA_features.independentAttemptRate}`);

console.log('\nDetection Result:');
console.log(`  Pattern: ${resultA.pattern}`);
console.log(`  Confidence: ${(resultA.confidence * 100).toFixed(1)}%`);
console.log(`  Total Score: ${resultA.rationale.total_score}/36`);
console.log(`  High Scores: ${resultA.rationale.high_scores.join(', ')}`);

console.log('\nKey Indicators:');
resultA.rationale.key_indicators?.forEach((indicator) => {
  console.log(`  ${indicator}`);
});

// Assertions
const testA_pass =
  resultA.pattern === 'A' &&
  resultA.confidence >= 0.75 &&
  resultA.rationale.high_scores.includes('P1') &&
  resultA.rationale.high_scores.includes('P4') &&
  resultA.rationale.high_scores.includes('M2') &&
  resultA.rationale.high_scores.includes('E3') &&
  resultA.rationale.total_score >= 28 &&
  resultA.rationale.total_score <= 32;

console.log(`\n${testA_pass ? '✅ PASS' : '❌ FAIL'}: Pattern A detection`);

// ============================================================
// Test Case 2: Pattern F (High Risk)
// ============================================================

console.log('\n\n📝 Test Case 2: Pattern F (Ineffective & Passive Use - High Risk)');
console.log('-'.repeat(70));

const patternF_features: MetacognitiveFeatures = {
  taskDecompositionScore: 0,
  promptSpecificity: 2.1,
  strategyDiversity: 0,
  independentAttemptRate: 0.05,
  sessionDurationPattern: 0.3,
  verificationRate: 0.05,
  trustCalibrationAccuracy: 0.1,
  modificationRate: 0.1,
  confidenceScore: 0.2,
  errorAwareness: 0.08,
  iterationFrequency: 0.08,
  crossModelUsage: 0,
};

const resultF = engine.detect(patternF_features);

console.log('Input Features (selected):');
console.log(`  - verificationRate: ${patternF_features.verificationRate} (⚠️ critical)`);
console.log(`  - errorAwareness: ${patternF_features.errorAwareness} (⚠️ very low)`);
console.log(`  - iterationFrequency: ${patternF_features.iterationFrequency} (⚠️ passive)`);
console.log(`  - promptSpecificity: ${patternF_features.promptSpecificity} (⚠️ simple)`);

console.log('\nDetection Result:');
console.log(`  Pattern: ${resultF.pattern}`);
console.log(`  Confidence: ${(resultF.confidence * 100).toFixed(1)}%`);
console.log(`  Alert Level: ${resultF.alert || 'none'}`);
console.log(`  Total Score: ${resultF.rationale.total_score}/36`);

console.log('\nRisk Indicators:');
resultF.rationale.key_indicators?.forEach((indicator) => {
  console.log(`  ${indicator}`);
});

// Assertions
const testF_pass =
  resultF.pattern === 'F' &&
  resultF.confidence >= 0.85 &&
  resultF.alert === 'high_risk' &&
  resultF.rationale.total_score < 15;

console.log(`\n${testF_pass ? '✅ PASS' : '❌ FAIL'}: Pattern F detection with high risk alert`);

// ============================================================
// Test Case 3: Pattern B (Iterative Optimization)
// ============================================================

console.log('\n\n📝 Test Case 3: Pattern B (Iterative Optimization & Calibration)');
console.log('-'.repeat(70));

const patternB_features: MetacognitiveFeatures = {
  taskDecompositionScore: 2,
  promptSpecificity: 7.0,
  strategyDiversity: 2.5,
  independentAttemptRate: 0.5,
  sessionDurationPattern: 0.6,
  verificationRate: 0.6,
  trustCalibrationAccuracy: 0.85,
  modificationRate: 0.7,
  confidenceScore: 0.6,
  errorAwareness: 0.65,
  iterationFrequency: 0.85, // 8-9 iterations avg (high iteration)
  crossModelUsage: 2.5,
};

const resultB = engine.detect(patternB_features);

console.log('Input Features (selected):');
console.log(`  - iterationFrequency: ${patternB_features.iterationFrequency} (high)`);
console.log(`  - crossModelUsage: ${patternB_features.crossModelUsage}`);
console.log(`  - trustCalibrationAccuracy: ${patternB_features.trustCalibrationAccuracy}`);

console.log('\nDetection Result:');
console.log(`  Pattern: ${resultB.pattern}`);
console.log(`  Confidence: ${(resultB.confidence * 100).toFixed(1)}%`);
console.log(`  Total Score: ${resultB.rationale.total_score}/36`);
console.log(`  High Scores: ${resultB.rationale.high_scores.join(', ')}`);

console.log('\nKey Indicators:');
resultB.rationale.key_indicators?.forEach((indicator) => {
  console.log(`  ${indicator}`);
});

const testB_pass =
  resultB.pattern === 'B' &&
  resultB.rationale.high_scores.includes('R1') &&
  resultB.rationale.high_scores.includes('R2');

console.log(`\n${testB_pass ? '✅ PASS' : '❌ FAIL'}: Pattern B detection`);

// ============================================================
// Test Case 4: Pattern D (Deep Verification)
// ============================================================

console.log('\n\n📝 Test Case 4: Pattern D (Deep Verification)');
console.log('-'.repeat(70));

const patternD_features: MetacognitiveFeatures = {
  taskDecompositionScore: 2,
  promptSpecificity: 8.0,
  strategyDiversity: 2,
  independentAttemptRate: 0.7,
  sessionDurationPattern: 0.8,
  verificationRate: 0.95, // >90%!
  trustCalibrationAccuracy: 0.6,
  modificationRate: 0.85,
  confidenceScore: 0.9,
  errorAwareness: 0.8,
  iterationFrequency: 0.4,
  crossModelUsage: 2.5,
};

const resultD = engine.detect(patternD_features);

console.log('Input Features (selected):');
console.log(`  - verificationRate: ${patternD_features.verificationRate} (⭐ extreme)`);
console.log(`  - modificationRate: ${patternD_features.modificationRate}`);
console.log(`  - confidenceScore: ${patternD_features.confidenceScore}`);

console.log('\nDetection Result:');
console.log(`  Pattern: ${resultD.pattern}`);
console.log(`  Confidence: ${(resultD.confidence * 100).toFixed(1)}%`);
console.log(`  Total Score: ${resultD.rationale.total_score}/36`);
console.log(`  High Scores: ${resultD.rationale.high_scores.join(', ')}`);

const testD_pass =
  resultD.pattern === 'D' &&
  resultD.rationale.high_scores.includes('M2') &&
  resultD.rationale.high_scores.includes('E1') &&
  resultD.rationale.high_scores.includes('E2');

console.log(`\n${testD_pass ? '✅ PASS' : '❌ FAIL'}: Pattern D detection`);

// ============================================================
// Test Summary
// ============================================================

console.log('\n\n' + '='.repeat(70));
console.log('📊 Test Summary');
console.log('='.repeat(70));

const allTests = [
  { name: 'Pattern A (Strategic Decomposition)', passed: testA_pass },
  { name: 'Pattern F (High Risk)', passed: testF_pass },
  { name: 'Pattern B (Iterative Optimization)', passed: testB_pass },
  { name: 'Pattern D (Deep Verification)', passed: testD_pass },
];

allTests.forEach((test, idx) => {
  console.log(`${idx + 1}. ${test.name}: ${test.passed ? '✅ PASS' : '❌ FAIL'}`);
});

const passedCount = allTests.filter((t) => t.passed).length;
const totalCount = allTests.length;

console.log('\n' + '-'.repeat(70));
console.log(`Total: ${passedCount}/${totalCount} tests passed`);

if (passedCount === totalCount) {
  console.log('\n🎉 All tests PASSED! Pattern Recognition Engine is working correctly.');
} else {
  console.log('\n⚠️ Some tests FAILED. Please review the implementation.');
  process.exit(1);
}
