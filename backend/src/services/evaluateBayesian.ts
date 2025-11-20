/**
 * Bayesian Pattern Recognizer Evaluation Script
 *
 * Tests Bayesian recognizer against SVM training dataset
 * Compares accuracy metrics with ML models
 */

import fs from 'fs';
import path from 'path';
import RealtimePatternRecognizer from '../services/RealtimePatternRecognizer';
import { BehavioralSignals } from '../services/BehaviorSignalDetector';

interface TrainingDataRecord {
  user_id: string;
  pattern: string;
  confidence: number;
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
  is_mixed_pattern: boolean;
  notes: string;
}

// CSV解析函数
function parseCSV(csvPath: string): TrainingDataRecord[] {
  const content = fs.readFileSync(csvPath, 'utf-8');
  const lines = content.split('\n').filter(line => line.trim());
  const headers = lines[0].split(',');

  return lines.slice(1).map(line => {
    const values = line.split(',');
    return {
      user_id: values[0],
      pattern: values[1],
      confidence: parseFloat(values[2]),
      p1: parseInt(values[3]),
      p2: parseInt(values[4]),
      p3: parseInt(values[5]),
      p4: parseInt(values[6]),
      m1: parseInt(values[7]),
      m2: parseInt(values[8]),
      m3: parseInt(values[9]),
      e1: parseInt(values[10]),
      e2: parseInt(values[11]),
      e3: parseInt(values[12]),
      r1: parseInt(values[13]),
      r2: parseInt(values[14]),
      total_score: parseInt(values[15]),
      is_mixed_pattern: values[16] === 'true',
      notes: values[17] || '',
    };
  });
}

// 将训练数据转换为BehavioralSignals
function convertToSignals(record: TrainingDataRecord): BehavioralSignals {
  return {
    // Planning信号 (P1-P4)
    taskDecompositionEvidence: record.p1,        // P1
    goalClarityScore: record.p2,                 // P2
    strategyMentioned: record.p3 > 1,            // P3
    preparationActions: record.p4 > 1 ? ['preparation_detected'] : [],  // P4

    // Monitoring信号 (M1-M3)
    verificationAttempted: record.m1 > 1,        // M1
    qualityCheckMentioned: record.m2 > 1,        // M2
    contextAwarenessIndicator: record.m3,        // M3

    // Evaluation信号 (E1-E3)
    outputEvaluationPresent: record.e1 > 1,      // E1
    reflectionDepth: record.e2,                  // E2
    capabilityJudgmentShown: record.e3 > 1,      // E3

    // Regulation信号 (R1-R2)
    iterationCount: record.r1,                   // R1
    trustCalibrationEvidence: record.r2 > 1 ? ['trust_evidence'] : [],  // R2

    // Additional
    taskComplexity: Math.min(3, Math.ceil(record.total_score / 10)),
    aiRelianceDegree: record.pattern === 'F' ? 3 : record.pattern === 'B' ? 2 : 1,
  };
}

// 评估函数
async function evaluateBayesian(): Promise<void> {
  console.log('🧪 Starting Bayesian Pattern Recognizer Evaluation\n');
  console.log('=' .repeat(80));

  // 加载数据集
  const mlDir = path.join(__dirname, '../../mca-system/backend/src/ml');
  const datasets = [
    'training_data.csv',
    'enhanced_training_data.csv',
    'augmented_training_data.csv'
  ];

  for (const datasetName of datasets) {
    const csvPath = path.join(mlDir, datasetName);
    if (!fs.existsSync(csvPath)) {
      console.log(`⚠️  ${datasetName} not found, skipping...`);
      continue;
    }

    console.log(`\n📊 Evaluating on ${datasetName}`);
    console.log('-'.repeat(80));

    const data = parseCSV(csvPath);
    console.log(`📈 Dataset size: ${data.length} samples\n`);

    // 初始化识别器 (使用虚拟用户ID进行评估，确保从均匀先验开始)
    const recognizer = new RealtimePatternRecognizer('eval-user', `eval-session-${datasetName}`);
    await recognizer.initialize(); // Will use uniform prior for eval-user (no history)

    // 统计变量
    const predictions: Array<{
      actual: string;
      predicted: string;
      probability: number;
      correct: boolean;
    }> = [];

    const confusionMatrix: Record<string, Record<string, number>> = {
      A: {A: 0, B: 0, C: 0, D: 0, E: 0, F: 0},
      B: {A: 0, B: 0, C: 0, D: 0, E: 0, F: 0},
      C: {A: 0, B: 0, C: 0, D: 0, E: 0, F: 0},
      D: {A: 0, B: 0, C: 0, D: 0, E: 0, F: 0},
      E: {A: 0, B: 0, C: 0, D: 0, E: 0, F: 0},
      F: {A: 0, B: 0, C: 0, D: 0, E: 0, F: 0},
    };

    // 对每个样本进行预测
    for (const record of data) {
      const signals = convertToSignals(record);
      const estimate = recognizer.updateProbabilities(signals);

      const isCorrect = estimate.topPattern === record.pattern;
      predictions.push({
        actual: record.pattern,
        predicted: estimate.topPattern,
        probability: estimate.probability,
        correct: isCorrect,
      });

      confusionMatrix[record.pattern][estimate.topPattern]++;
    }

    // 计算指标
    const correct = predictions.filter(p => p.correct).length;
    const accuracy = (correct / predictions.length) * 100;

    // 按pattern计算精度、召回率、F1
    const patternMetrics: Record<string, {
      precision: number;
      recall: number;
      f1: number;
      support: number;
    }> = {};

    for (const pattern of ['A', 'B', 'C', 'D', 'E', 'F']) {
      const tp = confusionMatrix[pattern][pattern];
      const fp = Object.keys(confusionMatrix)
        .filter(p => p !== pattern)
        .reduce((sum, p) => sum + confusionMatrix[p][pattern], 0);
      const fn = Object.keys(confusionMatrix[pattern])
        .filter(p => p !== pattern)
        .reduce((sum, p) => sum + confusionMatrix[pattern][p], 0);

      const precision = tp + fp > 0 ? (tp / (tp + fp)) * 100 : 0;
      const recall = tp + fn > 0 ? (tp / (tp + fn)) * 100 : 0;
      const f1 = precision + recall > 0 ? (2 * precision * recall) / (precision + recall) : 0;
      const support = Object.values(confusionMatrix[pattern]).reduce((a, b) => a + b, 0);

      patternMetrics[pattern] = {
        precision: isNaN(precision) ? 0 : precision,
        recall: isNaN(recall) ? 0 : recall,
        f1: isNaN(f1) ? 0 : f1,
        support,
      };
    }

    // 打印结果
    console.log(`\n✅ Overall Accuracy: ${accuracy.toFixed(2)}%\n`);

    console.log('📋 Per-Pattern Metrics:');
    console.log('Pattern | Precision | Recall | F1-Score | Support');
    console.log('--------|-----------|--------|----------|--------');

    for (const pattern of ['A', 'B', 'C', 'D', 'E', 'F']) {
      const m = patternMetrics[pattern];
      console.log(
        `   ${pattern}    | ${m.precision.toFixed(2)}%     | ${m.recall.toFixed(2)}%   | ${m.f1.toFixed(2)}%     |   ${m.support}`
      );
    }

    // 计算加权平均
    const totalSupport = Object.values(patternMetrics).reduce((sum, m) => sum + m.support, 0);
    const weightedF1 = Object.values(patternMetrics).reduce((sum, m) => {
      return sum + (m.f1 * m.support / totalSupport);
    }, 0);
    const weightedRecall = Object.values(patternMetrics).reduce((sum, m) => {
      return sum + (m.recall * m.support / totalSupport);
    }, 0);
    const weightedPrecision = Object.values(patternMetrics).reduce((sum, m) => {
      return sum + (m.precision * m.support / totalSupport);
    }, 0);

    console.log('--------|-----------|--------|----------|--------');
    console.log(
      `Average | ${weightedPrecision.toFixed(2)}%     | ${weightedRecall.toFixed(2)}%   | ${weightedF1.toFixed(2)}%     |  ${totalSupport}`
    );

    // 打印混淆矩阵
    console.log('\n📊 Confusion Matrix:');
    console.log('        Predicted');
    console.log('        A    B    C    D    E    F');
    for (const actual of ['A', 'B', 'C', 'D', 'E', 'F']) {
      const row = `${actual}   | ${confusionMatrix[actual]['A']}    ${confusionMatrix[actual]['B']}    ${confusionMatrix[actual]['C']}    ${confusionMatrix[actual]['D']}    ${confusionMatrix[actual]['E']}    ${confusionMatrix[actual]['F']}`;
      console.log(row);
    }

    // 打印Pattern F的特殊分析（高风险模式）
    console.log('\n🚨 Pattern F (High-Risk) Analysis:');
    const patternFPredictions = predictions.filter(p => p.actual === 'F');
    if (patternFPredictions.length > 0) {
      const patternFCorrect = patternFPredictions.filter(p => p.correct).length;
      const patternFRecall = (patternFCorrect / patternFPredictions.length) * 100;
      console.log(`  - Recall (Sensitivity): ${patternFRecall.toFixed(2)}%`);
      console.log(`  - Samples: ${patternFPredictions.length}`);
      console.log(`  - Correctly Detected: ${patternFCorrect}`);
      console.log(`  - Average Confidence: ${(patternFPredictions.reduce((sum, p) => sum + p.probability, 0) / patternFPredictions.length * 100).toFixed(2)}%`);
    }
  }

  console.log('\n' + '='.repeat(80));
  console.log('\n📌 Evaluation Complete!');
}

// 运行评估
evaluateBayesian().catch(error => {
  console.error('❌ Evaluation error:', error);
  process.exit(1);
});
