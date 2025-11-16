/**
 * Manual Test Runner for Trust Calibration Service
 * Run with: npx tsx src/services/TrustCalibrationService.manual-test.ts
 */

import {
  TrustCalibrationService,
  UserHistory,
  type UserVerificationRecord,
} from './TrustCalibrationService.js';

console.log('🧪 Trust Calibration Service - Manual Test Suite\n');
console.log('='.repeat(70));

const service = new TrustCalibrationService();

// ============================================================
// Test Case 1: Academic Citation (High Risk - from user request example)
// ============================================================

console.log('\n\n📝 Test Case 1: Academic Citation (High Risk Task)');
console.log('-'.repeat(70));

const academicResult = service.recommendTrust('academic_citation', 'gpt-4-turbo');

console.log('\nTask: academic_citation');
console.log('AI Model: gpt-4-turbo');
console.log('\nRecommendation:');
console.log(`  Recommended Trust: ${Math.round(academicResult.recommendedTrust * 100)}%`);
console.log(`  Historical Accuracy: ${Math.round(academicResult.historicalAccuracy * 100)}%`);
console.log(`  Risk Level: ${academicResult.riskLevel}`);
console.log(`  Confidence: ${Math.round(academicResult.confidence * 100)}%`);

if (academicResult.warning) {
  console.log(`\n⚠️  WARNING: ${academicResult.warning}`);
}

console.log('\nRationale:');
console.log(`  ${academicResult.rationale.historicalData}`);
console.log(`  ${academicResult.rationale.userPattern}`);
if (academicResult.rationale.contextFactors.length > 0) {
  console.log('  Context Factors:');
  academicResult.rationale.contextFactors.forEach(factor => {
    console.log(`    - ${factor}`);
  });
}

// Assertion
const test1Pass =
  academicResult.historicalAccuracy === 0.17 &&
  academicResult.recommendedTrust >= 0.05 &&
  academicResult.recommendedTrust <= 0.10 &&
  academicResult.riskLevel === 'high_risk' &&
  academicResult.warning !== undefined;

console.log(`\n${test1Pass ? '✅ PASS' : '❌ FAIL'}: Academic citation shows high risk with low trust recommendation`);

// ============================================================
// Test Case 2: Grammar Check (Safe Task)
// ============================================================

console.log('\n\n📝 Test Case 2: Grammar Check (Safe Task)');
console.log('-'.repeat(70));

const grammarResult = service.recommendTrust('grammar_check', 'gpt-4-turbo');

console.log('\nTask: grammar_check');
console.log('AI Model: gpt-4-turbo');
console.log('\nRecommendation:');
console.log(`  Recommended Trust: ${Math.round(grammarResult.recommendedTrust * 100)}%`);
console.log(`  Historical Accuracy: ${Math.round(grammarResult.historicalAccuracy * 100)}%`);
console.log(`  Risk Level: ${grammarResult.riskLevel}`);
console.log(`  Confidence: ${Math.round(grammarResult.confidence * 100)}%`);

if (grammarResult.warning) {
  console.log(`\n⚠️  WARNING: ${grammarResult.warning}`);
} else {
  console.log('\n✓ No warnings (safe task)');
}

const test2Pass =
  grammarResult.historicalAccuracy === 0.85 &&
  grammarResult.recommendedTrust >= 0.75 &&
  grammarResult.riskLevel === 'safe' &&
  grammarResult.warning === undefined;

console.log(`\n${test2Pass ? '✅ PASS' : '❌ FAIL'}: Grammar check shows safe with high trust recommendation`);

// ============================================================
// Test Case 3: Over-trust Detection (from MR9 - I2)
// ============================================================

console.log('\n\n📝 Test Case 3: Over-trust Detection (Market Data - I2 scenario)');
console.log('-'.repeat(70));

const i2History: UserHistory = {
  userId: 'I2',
  verifications: [
    {
      taskType: 'market_data',
      aiModel: 'gpt-4-turbo',
      wasCorrect: false,
      timestamp: new Date('2024-09-01'),
      userTrustLevel: 0.70, // User trusted 70%
    },
    {
      taskType: 'market_data',
      aiModel: 'gpt-4-turbo',
      wasCorrect: false,
      timestamp: new Date('2024-09-05'),
      userTrustLevel: 0.68,
    },
    {
      taskType: 'market_data',
      aiModel: 'gpt-4-turbo',
      wasCorrect: true,
      timestamp: new Date('2024-09-10'),
      userTrustLevel: 0.65,
    },
  ],
  totalInteractions: 3,
};

const marketResult = service.recommendTrust('market_data', 'gpt-4-turbo', i2History);

console.log('\nTask: market_data (User I2 from MR9)');
console.log('User Trust Pattern: Trusted 65-70% on average');
console.log('Historical Accuracy: 30%');
console.log('\nRecommendation:');
console.log(`  Recommended Trust: ${Math.round(marketResult.recommendedTrust * 100)}%`);
console.log(`  Historical Accuracy: ${Math.round(marketResult.historicalAccuracy * 100)}%`);
console.log(`  User Calibration: ${marketResult.userCalibration >= 0 ? '+' : ''}${Math.round(marketResult.userCalibration * 100)}% (${marketResult.userCalibration > 0 ? 'over-trust' : 'under-trust'})`);
console.log(`  Risk Level: ${marketResult.riskLevel}`);

if (marketResult.warning) {
  console.log(`\n⚠️  WARNING: ${marketResult.warning}`);
}

console.log('\nRationale:');
console.log(`  ${marketResult.rationale.historicalData}`);
console.log(`  ${marketResult.rationale.userPattern}`);

const test3Pass =
  marketResult.historicalAccuracy === 0.30 &&
  marketResult.userCalibration > 0.2 && // Over-trust detected
  marketResult.warning !== undefined &&
  marketResult.warning.includes('CALIBRATION');

console.log(`\n${test3Pass ? '✅ PASS' : '❌ FAIL'}: Over-trust pattern detected for I2 market data scenario`);

// ============================================================
// Test Case 4: Legal Compliance (Critical Risk)
// ============================================================

console.log('\n\n📝 Test Case 4: Legal Compliance (Critical Risk - I17 scenario)');
console.log('-'.repeat(70));

const legalResult = service.recommendTrust('legal_compliance', 'gpt-4-turbo');

console.log('\nTask: legal_compliance');
console.log('AI Model: gpt-4-turbo');
console.log('\nRecommendation:');
console.log(`  Recommended Trust: ${Math.round(legalResult.recommendedTrust * 100)}%`);
console.log(`  Historical Accuracy: ${Math.round(legalResult.historicalAccuracy * 100)}%`);
console.log(`  Risk Level: ${legalResult.riskLevel}`);

if (legalResult.warning) {
  console.log(`\n🚨 CRITICAL WARNING:`);
  console.log(`  ${legalResult.warning}`);
}

console.log('\nContext Factors:');
legalResult.rationale.contextFactors.forEach(factor => {
  console.log(`  - ${factor}`);
});

const test4Pass =
  legalResult.riskLevel === 'critical' &&
  legalResult.recommendedTrust <= 0.05 &&
  legalResult.warning !== undefined &&
  legalResult.warning.includes('CRITICAL');

console.log(`\n${test4Pass ? '✅ PASS' : '❌ FAIL'}: Legal compliance flagged as critical with zero-tolerance warning`);

// ============================================================
// Test Case 5: User Calibration Analysis (I41 scenario)
// ============================================================

console.log('\n\n📝 Test Case 5: User Calibration Analysis (I41 with Trust Matrix)');
console.log('-'.repeat(70));

const i41History: UserHistory = {
  userId: 'I41',
  verifications: [
    // Well-calibrated user from MR9
    { taskType: 'academic_citation', aiModel: 'gpt-4-turbo', wasCorrect: false, timestamp: new Date('2024-09-01'), userTrustLevel: 0.05 },
    { taskType: 'academic_citation', aiModel: 'gpt-4-turbo', wasCorrect: false, timestamp: new Date('2024-09-02'), userTrustLevel: 0.05 },
    { taskType: 'concept_explanation', aiModel: 'gpt-4-turbo', wasCorrect: true, timestamp: new Date('2024-09-03'), userTrustLevel: 0.75 },
    { taskType: 'concept_explanation', aiModel: 'gpt-4-turbo', wasCorrect: true, timestamp: new Date('2024-09-04'), userTrustLevel: 0.78 },
    { taskType: 'code_debugging', aiModel: 'gpt-4-turbo', wasCorrect: true, timestamp: new Date('2024-09-05'), userTrustLevel: 0.70 },
    { taskType: 'code_debugging', aiModel: 'gpt-4-turbo', wasCorrect: true, timestamp: new Date('2024-09-06'), userTrustLevel: 0.72 },
    { taskType: 'math_proof', aiModel: 'gpt-4-turbo', wasCorrect: false, timestamp: new Date('2024-09-07'), userTrustLevel: 0.30 },
    { taskType: 'math_proof', aiModel: 'gpt-4-turbo', wasCorrect: true, timestamp: new Date('2024-09-08'), userTrustLevel: 0.32 },
  ],
  totalInteractions: 8,
};

const calibrationAnalysis = service.analyzeUserCalibration(i41History);

console.log('\nUser: I41 (maintains trust matrix in Google Sheets)');
console.log(`Overall Calibration: ${calibrationAnalysis.overallCalibration >= 0 ? '+' : ''}${Math.round(calibrationAnalysis.overallCalibration * 100)}%`);
console.log('\nPer-Task Calibration:');
calibrationAnalysis.taskCalibrations.forEach(task => {
  const emoji = Math.abs(task.calibration) < 0.2 ? '✓' : '⚠️';
  console.log(`  ${emoji} ${task.taskType}: ${task.calibration >= 0 ? '+' : ''}${Math.round(task.calibration * 100)}%`);
});
console.log(`\nRecommendation: ${calibrationAnalysis.recommendation}`);

const test5Pass =
  Math.abs(calibrationAnalysis.overallCalibration) <= 0.2 &&
  calibrationAnalysis.recommendation.includes('well-balanced');

console.log(`\n${test5Pass ? '✅ PASS' : '❌ FAIL'}: I41 shows well-calibrated trust pattern`);

// ============================================================
// Test Case 6: Accuracy Matrix Update
// ============================================================

console.log('\n\n📝 Test Case 6: Accuracy Matrix Update');
console.log('-'.repeat(70));

const initialSql = service.recommendTrust('sql_generation', 'gpt-4-turbo');
console.log(`\nInitial SQL Generation Accuracy: ${Math.round(initialSql.historicalAccuracy * 100)}%`);

// Simulate user finding a correct SQL result
service.updateAccuracy('sql_generation', 'gpt-4-turbo', true);

const updatedSql = service.recommendTrust('sql_generation', 'gpt-4-turbo');
console.log(`Updated SQL Generation Accuracy: ${Math.round(updatedSql.historicalAccuracy * 100)}%`);

const test6Pass = updatedSql.historicalAccuracy > initialSql.historicalAccuracy;

console.log(`\n${test6Pass ? '✅ PASS' : '❌ FAIL'}: Accuracy matrix updates correctly with new verification`);

// ============================================================
// Test Summary
// ============================================================

console.log('\n\n' + '='.repeat(70));
console.log('📊 Test Summary');
console.log('='.repeat(70));

const tests = [
  { name: 'Academic Citation (High Risk)', pass: test1Pass },
  { name: 'Grammar Check (Safe)', pass: test2Pass },
  { name: 'Over-trust Detection (I2)', pass: test3Pass },
  { name: 'Legal Compliance (Critical)', pass: test4Pass },
  { name: 'User Calibration Analysis (I41)', pass: test5Pass },
  { name: 'Accuracy Matrix Update', pass: test6Pass },
];

tests.forEach((test, index) => {
  console.log(`${index + 1}. ${test.name}: ${test.pass ? '✅ PASS' : '❌ FAIL'}`);
});

const passedCount = tests.filter(t => t.pass).length;
const totalCount = tests.length;

console.log('\n' + '-'.repeat(70));
console.log(`Total: ${passedCount}/${totalCount} tests passed`);

if (passedCount === totalCount) {
  console.log('\n🎉 All tests PASSED! Trust Calibration Service is working correctly.\n');
} else {
  console.log(`\n⚠️  Some tests FAILED. Please review the implementation.\n`);
  process.exit(1);
}
