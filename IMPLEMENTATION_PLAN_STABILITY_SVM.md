# Pattern Stability Indicator & SVM Integration Plan

## Feature 5: Pattern Stability Metric & Hybrid Recognition

### Architecture

```
[BehavioralSignals]
    ↓ (每回合)
    ├─→ [RealtimePatternRecognizer] (Bayesian) → P(pattern|signals)
    ├─→ [SVMPatternClassifier] (ML) → P(pattern|features)
    └─→ [HybridPatternEstimator] (新建) → 融合预测
            ↓
        [StabilityCalculator] (新建) → Stability指标
```

### 核心概念

**Stability指标定义**:
```
Stability = 连续N轮same pattern的程度

计算方法:
  - 简单版: 最近5轮中同一pattern出现的比例 (0-1)
  - 加权版: 越近的轮次权重越高
  - 置信度加权: 高置信度的轮次权重更高

例子:
  Turn 1-5: [A, A, A, A, A] → Stability = 1.0 (非常稳定)
  Turn 1-5: [A, A, B, A, B] → Stability = 0.4 (不稳定)
  Turn 1-5: [B, B, A, A, A] → Stability = 0.6 (A正在稳定)
```

### 步骤1: 创建StabilityCalculator

**新文件**: `backend/src/services/PatternStabilityCalculator.ts`

```typescript
export interface PatternHistoryEntry {
  pattern: Pattern;
  confidence: number;
  timestamp: number;
}

export interface StabilityMetrics {
  stability: number;              // 0-1: 主指标
  dominantPattern: Pattern;       // 稳定的是哪个pattern
  streakLength: number;           // 连续相同pattern的轮数
  volatility: number;             // 0-1: 波动性（1-stability）
  isStable: boolean;              // stability >= threshold
  trendDirection: 'converging' | 'diverging' | 'oscillating' | 'stable';
}

export class PatternStabilityCalculator {
  private readonly WINDOW_SIZE = 5;
  private readonly STABILITY_THRESHOLD = 0.7;

  /**
   * 计算pattern稳定性
   */
  calculateStability(history: PatternHistoryEntry[]): StabilityMetrics {
    if (history.length < 2) {
      return this.getDefaultMetrics();
    }

    // 取最近WINDOW_SIZE轮
    const recentHistory = history.slice(-this.WINDOW_SIZE);

    // 1. 计算加权稳定性
    const stability = this.calculateWeightedStability(recentHistory);

    // 2. 找出dominant pattern
    const dominantPattern = this.findDominantPattern(recentHistory);

    // 3. 计算streak length（连续相同pattern的轮数）
    const streakLength = this.calculateStreakLength(history);

    // 4. 波动性 = 1 - 稳定性
    const volatility = 1 - stability;

    // 5. 判断稳定性
    const isStable = stability >= this.STABILITY_THRESHOLD;

    // 6. 分析趋势方向
    const trendDirection = this.analyzeTrend(history);

    return {
      stability,
      dominantPattern,
      streakLength,
      volatility,
      isStable,
      trendDirection
    };
  }

  /**
   * 加权稳定性计算
   * 更近的轮次和更高置信度的预测有更高权重
   */
  private calculateWeightedStability(history: PatternHistoryEntry[]): number {
    if (history.length === 0) return 0;

    // 时间权重: 越近权重越高 [0.4, 0.6, 0.8, 0.9, 1.0]
    const timeWeights = history.map((_, idx) =>
      0.4 + (idx / (history.length - 1)) * 0.6
    );

    // 统计每个pattern的加权出现次数
    const patternWeights: Record<string, number> = {};
    let totalWeight = 0;

    history.forEach((entry, idx) => {
      const weight = timeWeights[idx] * entry.confidence;
      patternWeights[entry.pattern] = (patternWeights[entry.pattern] || 0) + weight;
      totalWeight += weight;
    });

    // 最高权重的pattern占比 = 稳定性
    const maxWeight = Math.max(...Object.values(patternWeights));
    const stability = totalWeight > 0 ? maxWeight / totalWeight : 0;

    return Math.min(stability, 1.0);
  }

  /**
   * 找出dominant pattern（出现最多的）
   */
  private findDominantPattern(history: PatternHistoryEntry[]): Pattern {
    const patternCounts: Record<string, number> = {};

    history.forEach(entry => {
      patternCounts[entry.pattern] = (patternCounts[entry.pattern] || 0) + 1;
    });

    const sorted = Object.entries(patternCounts)
      .sort((a, b) => b[1] - a[1]);

    return sorted[0]?.[0] as Pattern || 'B';
  }

  /**
   * 计算streak length（连续相同pattern的轮数）
   */
  private calculateStreakLength(history: PatternHistoryEntry[]): number {
    if (history.length === 0) return 0;

    const currentPattern = history[history.length - 1].pattern;
    let streak = 1;

    // 从后往前数，连续相同pattern的数量
    for (let i = history.length - 2; i >= 0; i--) {
      if (history[i].pattern === currentPattern) {
        streak++;
      } else {
        break;
      }
    }

    return streak;
  }

  /**
   * 分析趋势方向
   */
  private analyzeTrend(history: PatternHistoryEntry[]): 'converging' | 'diverging' | 'oscillating' | 'stable' {
    if (history.length < 5) return 'converging';

    const recent5 = history.slice(-5);
    const uniquePatterns = new Set(recent5.map(e => e.pattern));

    // 连续5轮都是同一个pattern → stable
    if (uniquePatterns.size === 1) {
      return 'stable';
    }

    // 最近3轮都是同一个pattern → converging
    const recent3 = history.slice(-3);
    const recent3Unique = new Set(recent3.map(e => e.pattern));
    if (recent3Unique.size === 1) {
      return 'converging';
    }

    // 前2轮是pattern A，后3轮是pattern B → converging
    const first2Pattern = recent5[0].pattern;
    const last3Pattern = recent5[4].pattern;
    const first2Same = recent5[0].pattern === recent5[1].pattern;
    const last3Same = recent5[2].pattern === recent5[3].pattern && recent5[3].pattern === recent5[4].pattern;

    if (first2Same && last3Same && first2Pattern !== last3Pattern) {
      return 'converging';
    }

    // 5轮中有3个或更多不同pattern → diverging
    if (uniquePatterns.size >= 3) {
      return 'diverging';
    }

    // 2个pattern来回切换 → oscillating
    if (uniquePatterns.size === 2) {
      const patternA = Array.from(uniquePatterns)[0];
      const patternB = Array.from(uniquePatterns)[1];
      let switches = 0;

      for (let i = 1; i < recent5.length; i++) {
        if (recent5[i].pattern !== recent5[i-1].pattern) {
          switches++;
        }
      }

      if (switches >= 3) {
        return 'oscillating';
      }
    }

    return 'converging';
  }

  private getDefaultMetrics(): StabilityMetrics {
    return {
      stability: 0,
      dominantPattern: 'B' as Pattern,
      streakLength: 0,
      volatility: 1,
      isStable: false,
      trendDirection: 'converging'
    };
  }
}
```

### 步骤2: 创建HybridPatternEstimator - 融合Bayesian和SVM

**新文件**: `backend/src/services/HybridPatternEstimator.ts`

```typescript
import { RealtimePatternRecognizer, PatternEstimate as BayesianEstimate } from './RealtimePatternRecognizer';
import SVMPatternClassifier from './SVMPatternClassifier';
import { PatternStabilityCalculator, PatternHistoryEntry, StabilityMetrics } from './PatternStabilityCalculator';
import { BehavioralSignals } from './BehaviorSignalDetector';

export interface HybridPatternEstimate {
  // 融合预测
  topPattern: Pattern;
  confidence: number;
  probability: number;
  probabilities: Map<Pattern, number>;

  // 稳定性指标
  stability: StabilityMetrics;

  // 各方法的预测
  bayesianPrediction: BayesianEstimate;
  svmPrediction: any | null;  // 可能失败

  // 元信息
  method: 'bayesian' | 'svm' | 'ensemble';
  evidence: string[];
}

export class HybridPatternEstimator {
  private bayesianRecognizer: RealtimePatternRecognizer;
  private stabilityCalculator = new PatternStabilityCalculator();
  private patternHistory: PatternHistoryEntry[] = [];

  constructor(userId: string, sessionId: string) {
    this.bayesianRecognizer = new RealtimePatternRecognizer(userId, sessionId);
  }

  async initialize(): Promise<void> {
    await this.bayesianRecognizer.initialize();
  }

  /**
   * 混合预测: Bayesian + SVM + Stability
   */
  async estimate(signals: BehavioralSignals): Promise<HybridPatternEstimate> {
    // 1. Bayesian预测
    const bayesianEstimate = this.bayesianRecognizer.updateProbabilities(signals);

    // 2. SVM预测（可能失败，fallback到bayesian）
    let svmEstimate = null;
    let useSVM = false;

    try {
      svmEstimate = await SVMPatternClassifier.predictPattern(signals);
      useSVM = true;
    } catch (error) {
      console.warn('SVM prediction failed, using Bayesian only:', error);
    }

    // 3. 融合预测
    let fusedEstimate: any;
    let method: 'bayesian' | 'svm' | 'ensemble';

    if (useSVM && svmEstimate) {
      // 加权平均: 60% Bayesian + 40% SVM (Bayesian更稳定)
      fusedEstimate = this.fusePredictions(bayesianEstimate, svmEstimate, 0.6, 0.4);
      method = 'ensemble';
    } else {
      // Fallback: 只用Bayesian
      fusedEstimate = bayesianEstimate;
      method = 'bayesian';
    }

    // 4. 更新历史
    this.patternHistory.push({
      pattern: fusedEstimate.topPattern,
      confidence: fusedEstimate.confidence,
      timestamp: Date.now()
    });

    // 保持窗口大小
    if (this.patternHistory.length > 10) {
      this.patternHistory.shift();
    }

    // 5. 计算稳定性
    const stability = this.stabilityCalculator.calculateStability(this.patternHistory);

    // 6. 调整置信度（如果pattern不稳定，降低置信度）
    let adjustedConfidence = fusedEstimate.confidence;
    if (!stability.isStable) {
      adjustedConfidence *= 0.8;  // 降低20%
    }

    return {
      topPattern: fusedEstimate.topPattern,
      confidence: adjustedConfidence,
      probability: fusedEstimate.probability,
      probabilities: fusedEstimate.probabilities,
      stability,
      bayesianPrediction: bayesianEstimate,
      svmPrediction: svmEstimate,
      method,
      evidence: fusedEstimate.evidence
    };
  }

  /**
   * 融合Bayesian和SVM的预测结果
   */
  private fusePredictions(
    bayesian: BayesianEstimate,
    svm: any,
    bayesianWeight: number,
    svmWeight: number
  ): any {
    // 加权平均概率分布
    const fusedProbs = new Map<Pattern, number>();

    (['A', 'B', 'C', 'D', 'E', 'F'] as Pattern[]).forEach(pattern => {
      const bayesianProb = bayesian.probabilities.get(pattern) || 0;
      const svmProb = svm.probabilities[pattern] || 0;

      const fusedProb = bayesianProb * bayesianWeight + svmProb * svmWeight;
      fusedProbs.set(pattern, fusedProb);
    });

    // 归一化
    const total = Array.from(fusedProbs.values()).reduce((sum, p) => sum + p, 0);
    fusedProbs.forEach((prob, pattern) => {
      fusedProbs.set(pattern, prob / total);
    });

    // 找出top pattern
    const sorted = Array.from(fusedProbs.entries())
      .sort((a, b) => b[1] - a[1]);

    const topPattern = sorted[0][0];
    const topProb = sorted[0][1];
    const secondProb = sorted[1][1];
    const confidence = topProb - secondProb;

    return {
      topPattern,
      probability: topProb,
      confidence,
      probabilities: fusedProbs,
      evidence: [
        ...bayesian.evidence,
        `SVM agrees with ${(svm.probability * 100).toFixed(0)}% confidence`
      ]
    };
  }

  /**
   * 获取当前稳定性指标
   */
  getStabilityMetrics(): StabilityMetrics {
    return this.stabilityCalculator.calculateStability(this.patternHistory);
  }
}
```

### 步骤3: 更新API使用Hybrid Estimator

**修改文件**: `backend/src/routes/mca.ts`

```typescript
import { HybridPatternEstimator } from '../services/HybridPatternEstimator';

// 创建estimator
const estimator = new HybridPatternEstimator(userId, sessionId);
await estimator.initialize();

// 使用
const estimate = await estimator.estimate(signals);

// 返回给前端（包含stability指标）
res.json({
  success: true,
  data: {
    pattern: estimate.topPattern,
    confidence: estimate.confidence,
    stability: estimate.stability,  // ✅ 新增
    method: estimate.method,         // ✅ 新增（bayesian/svm/ensemble）
    evidence: estimate.evidence
  }
});
```

### 步骤4: 前端显示稳定性指标

**修改文件**: `frontend/src/components/PatternAnalysisWindow.tsx`

```typescript
// 在pattern显示区域添加stability indicator

{stability.isStable ? (
  <div className="stability-indicator stable">
    ✅ Stable Pattern (streak: {stability.streakLength} turns)
  </div>
) : (
  <div className="stability-indicator unstable">
    ⚠️ Pattern Transitioning ({stability.trendDirection})
    <div className="stability-bar">
      <div className="fill" style={{width: `${stability.stability * 100}%`}} />
    </div>
  </div>
)}

{/* Volatility warning */}
{stability.volatility > 0.6 && (
  <div className="volatility-warning">
    ⚡ High volatility detected. Pattern may be changing.
  </div>
)}
```

### 测试场景

**场景1: 稳定的Pattern A用户**

```
Turn 1-5: [A(0.8), A(0.85), A(0.88), A(0.90), A(0.92)]

Stability Metrics:
  stability: 0.95
  dominantPattern: A
  streakLength: 5
  volatility: 0.05
  isStable: true
  trendDirection: 'stable'

显示: ✅ Stable Pattern A (streak: 5 turns)
```

**场景2: A→B转换中**

```
Turn 1-5: [A(0.8), A(0.75), B(0.6), B(0.7), B(0.8)]

Stability Metrics:
  stability: 0.52
  dominantPattern: B
  streakLength: 3
  volatility: 0.48
  isStable: false
  trendDirection: 'converging'

显示: ⚠️ Pattern Transitioning (converging)
     [===------] 52%
```

**场景3: A↔D振荡**

```
Turn 1-6: [A(0.7), D(0.7), A(0.7), D(0.7), A(0.7), D(0.7)]

Stability Metrics:
  stability: 0.35
  dominantPattern: A (轮流出现，随机选一个)
  streakLength: 1
  volatility: 0.65
  isStable: false
  trendDirection: 'oscillating'

显示: ⚠️ Pattern Transitioning (oscillating)
     ⚡ High volatility detected. Pattern may be changing.
```

**场景4: Bayesian vs SVM不一致**

```
Bayesian: Pattern A (0.75)
SVM: Pattern D (0.68)

Ensemble:
  A: 0.75 × 0.6 + 0.20 × 0.4 = 0.53
  D: 0.15 × 0.6 + 0.68 × 0.4 = 0.36
  → Top: A (0.53), confidence = 0.17 (低)

Stability (假设历史都是A):
  stability: 0.85
  isStable: true
  → 调整后confidence = 0.17 × 1.0 = 0.17 (保持，因为稳定)

结论: 虽然SVM认为是D，但历史稳定性支持A，最终预测A
```

## SVM vs Bayesian 对比

| 方面 | Bayesian | SVM (77%准确) | Hybrid Ensemble |
|------|----------|---------------|-----------------|
| **冷启动** | 慢（需3-5轮） | 快（1轮可预测） | ✅ 快 + 准 |
| **历史利用** | 好（prior） | 无 | ✅ 最好 |
| **可解释性** | 高（evidence） | 低（黑盒） | ✅ 高（保留evidence） |
| **鲁棒性** | 中（受noise影响） | 高（训练鲁棒） | ✅ 最高（互补） |
| **依赖** | 无 | Python服务 | ✅ Fallback机制 |

## 实现优先级

| 步骤 | 工作量 | 价值 | 优先级 |
|------|--------|------|--------|
| 步骤1: StabilityCalculator | 2小时 | 高 | P0 |
| 步骤2: HybridEstimator | 3小时 | 极高 | P0 |
| 步骤3: API集成 | 1小时 | 高 | P1 |
| 步骤4: 前端显示 | 2小时 | 中 | P2 |

**总计**: 约8小时

## 研究价值

1. **Stability指标**: 首次量化"pattern稳定性"，区分稳定用户vs过渡期用户
2. **Ensemble方法**: 证明传统方法(Bayesian)和ML方法(SVM)可以互补
3. **动态置信度**: 根据stability调整confidence，避免过度自信
4. **Trend分析**: converging/diverging/oscillating提供pattern演化的细粒度洞察
