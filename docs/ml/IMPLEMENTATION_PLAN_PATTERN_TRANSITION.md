# Pattern Transition Detection Implementation Plan

## Feature 1: Real-time Pattern Transition Detection

### Architecture

```
[RealtimePatternRecognizer]
    ↓ (每回合更新)
[PatternTransitionDetector] (新建)
    ↓ (检测A→B/D/F)
[TransitionEventHandler] (新建)
    ↓ (记录+触发干预)
[InterventionManager]
```

### 步骤1: 创建PatternTransitionDetector (新文件)

**文件位置**: `backend/src/services/PatternTransitionDetector.ts`

**核心功能**:
```typescript
export interface PatternTransition {
  fromPattern: Pattern;
  toPattern: Pattern;
  transitionType: 'improvement' | 'regression' | 'lateral' | 'oscillation';
  confidence: number;
  triggerFactors: {
    // 触发因素
    taskComplexityIncrease?: boolean;      // 任务变复杂
    timeRessure?: boolean;                  // 时间压力
    fatigueIndicator?: boolean;             // 疲劳迹象
    consecutiveFailures?: number;           // 连续失败次数
    verificationRateDrop?: number;          // 验证率下降幅度
    // ... 更多因素
  };
  timestamp: Date;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export class PatternTransitionDetector {
  private patternHistory: Array<{pattern: Pattern, timestamp: number, confidence: number}> = [];
  private readonly HISTORY_WINDOW = 5; // 保留最近5次pattern估计

  /**
   * 检测pattern转换
   * 调用时机：每次RealtimePatternRecognizer更新后
   */
  detectTransition(
    currentEstimate: PatternEstimate,
    signals: BehavioralSignals,
    sessionContext: {
      messageCount: number,
      taskComplexity: number,
      timeElapsed: number
    }
  ): PatternTransition | null {
    // 1. 添加到历史
    this.patternHistory.push({
      pattern: currentEstimate.topPattern,
      timestamp: Date.now(),
      confidence: currentEstimate.confidence
    });

    // 2. 保持窗口大小
    if (this.patternHistory.length > this.HISTORY_WINDOW) {
      this.patternHistory.shift();
    }

    // 3. 需要至少3个数据点才能检测转换
    if (this.patternHistory.length < 3) {
      return null;
    }

    // 4. 检测稳定转换（连续3次同一pattern → 新pattern）
    const recent3 = this.patternHistory.slice(-3);
    const prev2Same = recent3[0].pattern === recent3[1].pattern;
    const currentDifferent = recent3[2].pattern !== recent3[1].pattern;

    if (prev2Same && currentDifferent) {
      const fromPattern = recent3[1].pattern;
      const toPattern = recent3[2].pattern;

      // 5. 分类转换类型
      const transitionType = this.classifyTransition(fromPattern, toPattern);

      // 6. 分析触发因素
      const triggerFactors = this.analyzeTriggerFactors(
        fromPattern,
        toPattern,
        signals,
        sessionContext
      );

      // 7. 计算严重性
      const severity = this.calculateSeverity(fromPattern, toPattern, triggerFactors);

      return {
        fromPattern,
        toPattern,
        transitionType,
        confidence: recent3[2].confidence,
        triggerFactors,
        timestamp: new Date(),
        severity
      };
    }

    return null;
  }

  /**
   * 分类转换类型
   */
  private classifyTransition(from: Pattern, to: Pattern): 'improvement' | 'regression' | 'lateral' | 'oscillation' {
    // Pattern等级: A/D > C/E > B > F
    const patternRank: Record<Pattern, number> = {
      'A': 5, 'D': 5,  // 最优
      'C': 4, 'E': 4,  // 良好
      'B': 3,          // 中等
      'F': 1           // 危险
    };

    const rankChange = patternRank[to] - patternRank[from];

    if (rankChange > 0) return 'improvement';
    if (rankChange < 0) return 'regression';

    // 检查oscillation (A↔D, C↔E之间频繁切换)
    if ((from === 'A' && to === 'D') || (from === 'D' && to === 'A')) {
      return 'oscillation';
    }

    return 'lateral';
  }

  /**
   * 分析触发因素
   */
  private analyzeTriggerFactors(
    from: Pattern,
    to: Pattern,
    signals: BehavioralSignals,
    context: any
  ): any {
    const factors: any = {};

    // A→B/D/F的关键触发因素
    if (from === 'A') {
      // 检查验证率下降
      const prevVerificationRate = this.getPreviousMetric('verificationRate');
      if (prevVerificationRate && !signals.verificationAttempted) {
        factors.verificationRateDrop = prevVerificationRate;
      }

      // 检查任务复杂度变化
      if (signals.taskComplexity > 2) {
        factors.taskComplexityIncrease = true;
      }

      // 检查时间压力（消息间隔突然缩短）
      const avgInterval = this.getAverageMessageInterval();
      if (avgInterval < 30000) { // < 30秒
        factors.timePressure = true;
      }

      // 检查疲劳（会话时长>60分钟且verificationRate下降）
      if (context.timeElapsed > 60 * 60 * 1000) {
        factors.fatigueIndicator = true;
      }
    }

    // A→F (critical regression)
    if (from === 'A' && to === 'F') {
      factors.criticalRegression = true;
      factors.aiRelianceDegree = signals.aiRelianceDegree;
    }

    return factors;
  }

  /**
   * 计算严重性
   */
  private calculateSeverity(from: Pattern, to: Pattern, factors: any): 'low' | 'medium' | 'high' | 'critical' {
    // A→F = critical
    if (from === 'A' && to === 'F') return 'critical';

    // 任何pattern→F = high
    if (to === 'F') return 'high';

    // A→B/D = medium (可能是暂时性退化)
    if (from === 'A' && (to === 'B' || to === 'D')) return 'medium';

    return 'low';
  }

  // 辅助方法（需要实现历史metrics tracking）
  private getPreviousMetric(metricName: string): number | null {
    // TODO: 从历史记录中获取
    return null;
  }

  private getAverageMessageInterval(): number {
    // TODO: 计算平均消息间隔
    return 60000;
  }
}
```

### 步骤2: 集成到RealtimePatternRecognizer

**修改文件**: `backend/src/services/RealtimePatternRecognizer.ts`

在 `updateProbabilities` 方法末尾添加:

```typescript
// 导入
import { PatternTransitionDetector } from './PatternTransitionDetector';

export class RealtimePatternRecognizer {
  private transitionDetector = new PatternTransitionDetector();

  updateProbabilities(signals: BehavioralSignals): PatternEstimate {
    // ... 现有代码 ...

    const estimate: PatternEstimate = {
      topPattern,
      probability: topProbability,
      confidence,
      probabilities: new Map(this.patternProbabilities),
      needMoreData: this.turnCount < 5,
      evidence
    };

    // ✨ 新增: 检测pattern转换
    const transition = this.transitionDetector.detectTransition(
      estimate,
      signals,
      {
        messageCount: this.turnCount,
        taskComplexity: signals.taskComplexity,
        timeElapsed: Date.now() - this.sessionStartTime
      }
    );

    // 如果检测到转换，记录并触发事件
    if (transition) {
      this.handlePatternTransition(transition);
    }

    return estimate;
  }

  private handlePatternTransition(transition: PatternTransition): void {
    console.log(`🔄 Pattern Transition Detected: ${transition.fromPattern} → ${transition.toPattern}`);
    console.log(`   Type: ${transition.transitionType}, Severity: ${transition.severity}`);
    console.log(`   Trigger Factors:`, transition.triggerFactors);

    // 发送事件到前端（通过WebSocket或轮询）
    // 或存储到数据库
    // 或触发特殊干预
  }
}
```

### 步骤3: 数据库存储Evolution记录

**SQL Migration**:

```sql
-- 已有表: pattern_detections (存储每次pattern检测)
-- 新增表: pattern_transitions (存储转换事件)

CREATE TABLE pattern_transitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  session_id UUID NOT NULL,
  from_pattern VARCHAR(1) NOT NULL CHECK (from_pattern IN ('A','B','C','D','E','F')),
  to_pattern VARCHAR(1) NOT NULL CHECK (to_pattern IN ('A','B','C','D','E','F')),
  transition_type VARCHAR(20) NOT NULL CHECK (transition_type IN ('improvement','regression','lateral','oscillation')),
  confidence DECIMAL(3,2) NOT NULL,
  severity VARCHAR(10) NOT NULL CHECK (severity IN ('low','medium','high','critical')),
  trigger_factors JSONB,  -- {taskComplexityIncrease: true, timePressure: true, ...}
  created_at TIMESTAMP DEFAULT NOW(),

  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (session_id) REFERENCES work_sessions(id)
);

CREATE INDEX idx_pattern_transitions_user ON pattern_transitions(user_id);
CREATE INDEX idx_pattern_transitions_severity ON pattern_transitions(severity);
CREATE INDEX idx_pattern_transitions_created ON pattern_transitions(created_at DESC);
```

### 步骤4: API Endpoint

**新增路由**: `backend/src/routes/patterns.ts`

```typescript
// GET /api/patterns/transitions/:userId
router.get('/transitions/:userId', async (req, res) => {
  const { userId } = req.params;
  const { limit = 50 } = req.query;

  const result = await pool.query(
    `SELECT * FROM pattern_transitions
     WHERE user_id = $1
     ORDER BY created_at DESC
     LIMIT $2`,
    [userId, limit]
  );

  res.json({ success: true, data: result.rows });
});

// GET /api/patterns/transitions/critical/:userId
// 获取critical/high severity的转换（需要干预的）
router.get('/transitions/critical/:userId', async (req, res) => {
  const { userId } = req.params;

  const result = await pool.query(
    `SELECT * FROM pattern_transitions
     WHERE user_id = $1
     AND severity IN ('critical', 'high')
     AND created_at > NOW() - INTERVAL '7 days'
     ORDER BY created_at DESC`,
    [userId]
  );

  res.json({ success: true, data: result.rows });
});
```

### 测试场景

**场景1: Pattern A → F (Critical Regression)**

模拟输入序列:
```
Turn 1-3: Pattern A (high decomposition, high verification)
Turn 4: 突然长prompt + 无verification → Pattern F信号
Turn 5: 再次无verification → 确认Pattern F
→ 触发critical transition alert
```

预期输出:
```json
{
  "fromPattern": "A",
  "toPattern": "F",
  "transitionType": "regression",
  "severity": "critical",
  "triggerFactors": {
    "verificationRateDrop": 0.85,
    "criticalRegression": true,
    "aiRelianceDegree": 3
  },
  "confidence": 0.82
}
```

**场景2: Pattern A → D (Lateral Shift)**

```
Turn 1-3: Pattern A (balanced verification)
Turn 4-5: 突然大量verification关键词 → Pattern D
→ 触发medium alert (可能是任务复杂度上升，用户自适应)
```

## 实现优先级

| 步骤 | 工作量 | 价值 | 优先级 |
|------|--------|------|--------|
| 步骤1: PatternTransitionDetector类 | 4小时 | 极高 | P0 |
| 步骤2: 集成到Recognizer | 1小时 | 极高 | P0 |
| 步骤3: 数据库表 | 1小时 | 高 | P1 |
| 步骤4: API路由 | 2小时 | 中 | P2 |

**总计**: 约8小时可完成基础版本

## 研究价值

1. **动态性证明**: 首次系统性记录用户在单个会话内的pattern转换
2. **触发因素分析**: 揭示什么情境导致Pattern A用户退化
3. **干预时机**: 在A→F转换的早期（A→B阶段）就介入
