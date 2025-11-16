import {
  PatternRecognitionEngine,
  MetacognitiveFeatures,
} from './PatternRecognitionEngine.js';

const engine = new PatternRecognitionEngine();

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

// Access private method by casting
const engineAny = engine as any;
const scores = engineAny.convertToSubprocessScores(patternB_features);
const totalScore = engineAny.calculateTotalScore(scores);

console.log('Pattern B Feature Debug');
console.log('=======================\n');
console.log('Input Features:');
console.log('  iterationFrequency:', patternB_features.iterationFrequency);
console.log('  crossModelUsage:', patternB_features.crossModelUsage);
console.log('  trustCalibrationAccuracy:', patternB_features.trustCalibrationAccuracy);

console.log('\nConverted Subprocess Scores:');
console.log('  R1 (Strategy Adjustment):', scores.R1, '(from iterationFrequency)');
console.log('  R2 (Tool Switching):', scores.R2, '(from crossModelUsage)');
console.log('  M3 (Trust Calibration):', scores.M3, '(from trustCalibrationAccuracy)');

console.log('\nAll Scores:');
Object.entries(scores).forEach(([key, value]) => {
  console.log(`  ${key}: ${(value as number).toFixed(2)}`);
});

console.log('\nTotal Score:', totalScore.toFixed(1), '/36');

console.log('\nPattern B Detection Conditions:');
console.log('  R1 >= 2.3?', scores.R1 >= 2.3, `(${scores.R1.toFixed(2)})`);
console.log('  R2 >= 1.5?', scores.R2 >= 1.5, `(${scores.R2.toFixed(2)})`);
console.log('  M3 >= 1.8?', scores.M3 >= 1.8, `(${scores.M3.toFixed(2)})`);
console.log('  iterationFrequency >= 0.3?', patternB_features.iterationFrequency >= 0.3);

console.log('\nNow running detect():');
const result = engine.detect(patternB_features);
console.log('Detected Pattern:', result?.pattern || 'null');
if (result) {
  console.log('Confidence:', (result.confidence * 100).toFixed(1) + '%');
  console.log('Total Score:', result.rationale.total_score);
}
