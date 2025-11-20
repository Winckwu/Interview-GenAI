# Cross-Session Pattern Memory Implementation Plan

## Feature 4: Historical Pattern Memory & Adaptive Prior

### Architecture

```
[PatternHistoryService] (新建)
    ↓ (查询历史pattern)
[RealtimePatternRecognizer]
    ↓ (使用历史prior初始化)
[贝叶斯更新]
```

### 核心思想

**当前问题**:
```typescript
// 会话1: 用户表现为Pattern A (3次贝叶斯更新后置信度0.85)
// 会话2: 系统重启，又从uniform prior开始 (所有pattern=0.20)
// ❌ 浪费了会话1的信息
```

**解决方案**:
```typescript
// 会话1: Pattern A (confidence 0.85)
// → 存储到数据库: user_id=123, dominant_pattern=A, confidence=0.85
// 会话2: 初始化时查询历史
// → 使用informed prior: A=0.60, B=0.10, C=0.10, D=0.10, E=0.10
// ✅ 更快收敛到准确pattern
```

### 步骤1: 创建PatternHistoryService

**新文件**: `backend/src/services/PatternHistoryService.ts`

```typescript
import pool from '../config/database';

export interface UserPatternHistory {
  userId: string;
  dominantPattern: Pattern;
  dominantConfidence: number;
  patternDistribution: Record<Pattern, number>;  // 历史平均分布
  totalSessions: number;
  lastSessionAt: Date;
}

export class PatternHistoryService {
  /**
   * 获取用户的历史pattern分布
   * 用于初始化贝叶斯prior
   */
  async getUserPatternPrior(userId: string): Promise<Record<Pattern, number>> {
    // 1. 查询最近30天的pattern检测记录
    const result = await pool.query(
      `SELECT pattern_type, AVG(confidence) as avg_confidence, COUNT(*) as count
       FROM pattern_detections
       WHERE user_id = $1
       AND created_at > NOW() - INTERVAL '30 days'
       GROUP BY pattern_type`,
      [userId]
    );

    // 2. 如果没有历史数据，返回uniform prior
    if (result.rows.length === 0) {
      return this.getUniformPrior();
    }

    // 3. 计算加权先验概率
    const totalCount = result.rows.reduce((sum, row) => sum + parseInt(row.count), 0);
    const historicalDistribution: Record<string, number> = {};

    result.rows.forEach(row => {
      const pattern = row.pattern_type;
      const weight = parseInt(row.count) / totalCount;
      const confidence = parseFloat(row.avg_confidence);

      // 加权: 出现频率 × 平均置信度
      historicalDistribution[pattern] = weight * confidence;
    });

    // 4. 归一化到概率分布
    const total = Object.values(historicalDistribution).reduce((sum, val) => sum + val, 0);
    const normalizedDistribution: Record<Pattern, number> = {} as any;

    (['A', 'B', 'C', 'D', 'E', 'F'] as Pattern[]).forEach(pattern => {
      if (historicalDistribution[pattern]) {
        normalizedDistribution[pattern] = historicalDistribution[pattern] / total;
      } else {
        normalizedDistribution[pattern] = 0.01; // 最小值，避免完全为0
      }
    });

    // 5. 平滑处理：历史prior与uniform prior混合（80%历史 + 20%uniform）
    const smoothedPrior = this.smoothPrior(normalizedDistribution, 0.8);

    return smoothedPrior;
  }

  /**
   * 获取用户的dominant pattern（主导模式）
   */
  async getDominantPattern(userId: string): Promise<{
    pattern: Pattern;
    confidence: number;
    stability: number;  // 稳定性指标 (0-1)
  } | null> {
    // 查询最近10次pattern检测
    const result = await pool.query(
      `SELECT pattern_type, confidence, created_at
       FROM pattern_detections
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT 10`,
      [userId]
    );

    if (result.rows.length < 3) {
      return null; // 数据不足
    }

    // 计算最常见的pattern
    const patternCounts: Record<string, number> = {};
    result.rows.forEach(row => {
      const pattern = row.pattern_type;
      patternCounts[pattern] = (patternCounts[pattern] || 0) + 1;
    });

    const sortedPatterns = Object.entries(patternCounts)
      .sort((a, b) => b[1] - a[1]);

    const dominantPattern = sortedPatterns[0][0] as Pattern;
    const dominantCount = sortedPatterns[0][1];

    // 计算稳定性 (dominant pattern出现频率)
    const stability = dominantCount / result.rows.length;

    // 计算平均置信度
    const avgConfidence = result.rows
      .filter(row => row.pattern_type === dominantPattern)
      .reduce((sum, row) => sum + parseFloat(row.confidence), 0) / dominantCount;

    return {
      pattern: dominantPattern,
      confidence: avgConfidence,
      stability
    };
  }

  /**
   * 记录当前会话的pattern检测结果
   */
  async recordPatternDetection(
    userId: string,
    sessionId: string,
    pattern: Pattern,
    confidence: number,
    probabilities: Record<Pattern, number>
  ): Promise<void> {
    await pool.query(
      `INSERT INTO pattern_detections
       (user_id, session_id, pattern_type, confidence, probabilities, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW())`,
      [userId, sessionId, pattern, confidence, JSON.stringify(probabilities)]
    );
  }

  /**
   * Uniform prior (无历史信息时使用)
   */
  private getUniformPrior(): Record<Pattern, number> {
    return {
      'A': 1/6,
      'B': 1/6,
      'C': 1/6,
      'D': 1/6,
      'E': 1/6,
      'F': 1/6
    };
  }

  /**
   * 平滑先验概率
   * 混合历史prior和uniform prior，避免过度依赖历史
   */
  private smoothPrior(
    historicalPrior: Record<Pattern, number>,
    historicalWeight: number = 0.8
  ): Record<Pattern, number> {
    const uniformPrior = this.getUniformPrior();
    const uniformWeight = 1 - historicalWeight;

    const smoothed: Record<Pattern, number> = {} as any;

    (['A', 'B', 'C', 'D', 'E', 'F'] as Pattern[]).forEach(pattern => {
      smoothed[pattern] =
        historicalPrior[pattern] * historicalWeight +
        uniformPrior[pattern] * uniformWeight;
    });

    return smoothed;
  }
}

export default new PatternHistoryService();
```

### 步骤2: 修改RealtimePatternRecognizer - 使用历史prior

**修改文件**: `backend/src/services/RealtimePatternRecognizer.ts`

```typescript
import PatternHistoryService from './PatternHistoryService';

export class RealtimePatternRecognizer {
  private patternProbabilities: Map<Pattern, number>;
  private userId: string;
  private sessionId: string;

  // ✨ 新增: 构造函数接收userId和sessionId
  constructor(userId: string, sessionId: string) {
    this.userId = userId;
    this.sessionId = sessionId;

    // 初始化为uniform prior（会在initialize()中更新）
    this.patternProbabilities = new Map([
      ['A', 1/6],
      ['B', 1/6],
      ['C', 1/6],
      ['D', 1/6],
      ['E', 1/6],
      ['F', 1/6],
    ]);
  }

  /**
   * ✨ 新增: 初始化方法 - 加载历史prior
   * 必须在第一次updateProbabilities之前调用
   */
  async initialize(): Promise<void> {
    // 1. 获取用户历史pattern prior
    const historicalPrior = await PatternHistoryService.getUserPatternPrior(this.userId);

    // 2. 更新初始概率
    (['A', 'B', 'C', 'D', 'E', 'F'] as Pattern[]).forEach(pattern => {
      this.patternProbabilities.set(pattern, historicalPrior[pattern]);
    });

    console.log('📊 Initialized with historical prior:', historicalPrior);

    // 3. 获取dominant pattern信息（用于日志）
    const dominant = await PatternHistoryService.getDominantPattern(this.userId);
    if (dominant) {
      console.log(`   Dominant pattern: ${dominant.pattern} (confidence=${dominant.confidence.toFixed(2)}, stability=${dominant.stability.toFixed(2)})`);
    }
  }

  /**
   * 贝叶斯更新（现有方法，添加记录逻辑）
   */
  updateProbabilities(signals: BehavioralSignals): PatternEstimate {
    // ... 现有贝叶斯更新逻辑 ...

    const estimate: PatternEstimate = {
      topPattern,
      probability: topProbability,
      confidence,
      probabilities: new Map(this.patternProbabilities),
      needMoreData: this.turnCount < 5,
      evidence
    };

    // ✨ 新增: 记录到数据库（异步，不阻塞）
    PatternHistoryService.recordPatternDetection(
      this.userId,
      this.sessionId,
      topPattern,
      topProbability,
      Object.fromEntries(this.patternProbabilities) as Record<Pattern, number>
    ).catch(err => {
      console.error('Failed to record pattern detection:', err);
    });

    return estimate;
  }
}
```

### 步骤3: 更新使用RealtimePatternRecognizer的代码

**修改文件**: `backend/src/routes/mca.ts` (或任何使用Recognizer的地方)

```typescript
// 之前:
// const recognizer = new RealtimePatternRecognizer();

// ✅ 现在:
const recognizer = new RealtimePatternRecognizer(userId, sessionId);
await recognizer.initialize();  // ← 必须调用！

// 然后使用
const estimate = recognizer.updateProbabilities(signals);
```

### 步骤4: 数据库表（确认是否已存在）

```sql
-- 应该已经有这个表，如果没有则创建
CREATE TABLE IF NOT EXISTS pattern_detections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  session_id UUID NOT NULL,
  pattern_type VARCHAR(1) NOT NULL CHECK (pattern_type IN ('A','B','C','D','E','F')),
  confidence DECIMAL(4,3) NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
  probabilities JSONB,  -- {"A": 0.6, "B": 0.1, ...}
  created_at TIMESTAMP DEFAULT NOW(),

  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (session_id) REFERENCES work_sessions(id)
);

CREATE INDEX idx_pattern_detections_user ON pattern_detections(user_id);
CREATE INDEX idx_pattern_detections_created ON pattern_detections(created_at DESC);
```

### 测试场景

**场景1: 新用户（无历史）**

```
User ID: new_user_123
History: 空

initialize() 输出:
  📊 Initialized with uniform prior: {A: 0.167, B: 0.167, C: 0.167, D: 0.167, E: 0.167, F: 0.167}
  No dominant pattern found

Turn 1: 检测为Pattern A (0.4)
Turn 2: 检测为Pattern A (0.65)
Turn 3: 检测为Pattern A (0.82)  ← 收敛需要3轮
```

**场景2: Pattern A老用户**

```
User ID: experienced_user_456
History: 过去30天有20次Pattern A检测 (avg confidence 0.85)

initialize() 输出:
  📊 Initialized with historical prior: {A: 0.60, B: 0.10, C: 0.10, D: 0.08, E: 0.08, F: 0.04}
  Dominant pattern: A (confidence=0.85, stability=0.90)

Turn 1: 检测为Pattern A (0.75)  ← 从0.60起步，更快收敛
Turn 2: 检测为Pattern A (0.88)  ← 只需2轮就达到高置信度
```

**场景3: Pattern A用户突然变Pattern F（检测异常）**

```
History: Pattern A (stability=0.90)
Prior: {A: 0.60, F: 0.04}

Turn 1: 强烈的Pattern F信号（无验证、高依赖）
  → P(F|signals) = 0.04 × likelihood(signals|F) = 0.04 × 5.0 = 0.20
  → P(A|signals) = 0.60 × likelihood(signals|A) = 0.60 × 0.1 = 0.06
  → 归一化后: F=0.77, A=0.23
  → 检测为Pattern F (confidence=0.54)

Turn 2: 再次Pattern F信号
  → P(F|signals) = 0.77 × 5.0 = 3.85
  → 归一化后: F=0.92
  → 确认Pattern F (confidence=0.92)

✅ 虽然起点不同，但2轮后仍能正确检测异常转换
✅ 同时触发PatternTransitionDetector: A→F (critical regression)
```

## 优势分析

| 方面 | Uniform Prior | Historical Prior | 优势 |
|------|---------------|------------------|------|
| **新用户** | 3-5轮收敛 | 3-5轮收敛 | 无差异 |
| **稳定用户** | 3-5轮收敛 | 1-2轮收敛 | ✅ 快50% |
| **异常检测** | 容易误判 | 能区分真异常vs噪声 | ✅ 更准确 |
| **数据效率** | 浪费历史信息 | 充分利用历史 | ✅ 跨会话学习 |

## 实现优先级

| 步骤 | 工作量 | 价值 | 优先级 |
|------|--------|------|--------|
| 步骤1: PatternHistoryService | 3小时 | 极高 | P0 |
| 步骤2: 修改Recognizer | 2小时 | 极高 | P0 |
| 步骤3: 更新调用代码 | 1小时 | 高 | P1 |
| 步骤4: 数据库表确认 | 0.5小时 | 高 | P1 |

**总计**: 约6.5小时

## 研究价值

1. **跨会话学习**: 证明系统能从历史数据中学习用户"baseline pattern"
2. **收敛速度**: 量化"历史先验"对检测速度的提升（约50%）
3. **异常检测**: 更准确区分"真正的pattern转换"vs"偶然噪声"
