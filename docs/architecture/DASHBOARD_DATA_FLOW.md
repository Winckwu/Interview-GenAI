# Dashboard Data Flow & Real-time Updates Guide

## 📊 Dashboard数据来源说明

### 1. **Prediction Accuracy** (预测准确率)
**当前状态**: 从API获取，但预测系统暂未完全实现
**来源**: `/api/predictions` endpoint
**数据流**:
```
用户交互 → 后端计算预测 → 保存到predictions表 → DashboardPage.fetchPredictions()
→ 计算: correctPredictions / totalPredictions * 100
```

### 2. **Current Pattern** (当前交互模式)
**当前状态**: 已实现，基于用户交互行为自动检测
**来源**: `/api/patterns` endpoint
**数据流**:
```
ChatSessionPage → 用户交互(验证/修改/拒绝) → 收集行为指标
→ /patterns/analyze API → 检测用户模式(A-F)
→ DashboardPage.fetchPatterns() → 显示Current Pattern
```

### 3. **Pattern Evolution** (模式演变)
**当前状态**: 已实现，追踪模式的改进
**来源**: `/api/evolution` endpoint
**数据流**:
```
检测到新模式 → 与之前模式比较
→ /evolution/analyze API → 识别改进/回归/停滞
→ DashboardPage.fetchEvolutions() → 显示improvement count
```

### 4. **Weekly Accuracy Trend** (周准确率趋势)
**当前状态**: ❌ 硬编码的模拟数据
**应该来自**: 预测数据统计
**需要实现**:
```
按日期分组所有预测
→ 计算每周的准确率
→ 生成图表数据
```

### 5. **Pattern Distribution** (模式分布)
**当前状态**: ❌ 硬编码的模拟数据
**应该来自**: 用户历史中各模式的出现次数
**需要实现**:
```
统计patterns数组中每种模式(A-F)的出现次数
→ 生成: [{name: 'Pattern A', value: 15}, ...]
```

### 6. **Intervention Strategy Effectiveness** (干预策略有效性)
**当前状态**: ❌ 硬编码的模拟数据
**应该来自**: 应用不同策略后的结果
**需要实现**:
```
基于evolution数据统计改进成功率
→ 为不同策略计算successRate
```

---

## 🔄 实现步骤详解

### 第一步：确保ChatSessionPage正确保存交互数据

**文件**: `ChatSessionPage.tsx` - `handleSendMessage` 函数

```typescript
// 现有代码已经：
1. 发送用户消息到AI API
2. 保存interaction到数据库，包括:
   - userPrompt
   - aiResponse
   - responseTime
   - wasVerified / wasModified / wasRejected (默认false)

// 缺少的：
- 计算12个行为指标 (reflectionDepth, verificationFrequency 等)
- 确保这些指标被保存到interaction.metrics
```

### 第二步：集成模式检测

**现有**: ChatSessionPage已在第3次交互后调用 `detectPattern()`
**流程**:
```
Messages count >= 4 → detectPattern()
→ POST /patterns/analyze {sessionId}
→ 后端检测用户模式
→ 返回 {pattern: 'A-F', confidence: 0.xx}
```

### 第三步：实时更新Dashboard

**当前问题**:
- DashboardPage在挂载时加载数据
- 用户在ChatSessionPage的交互不会自动刷新Dashboard

**解决方案**:
```
方案A: 定期轮询 (简单但低效)
→ useEffect + setInterval 每30秒调用 fetchPatterns/fetchEvolutions

方案B: WebSocket实时推送 (复杂但实时)
→ 当检测到新模式时，服务器推送给客户端

方案C: 全局状态 + Zustand (推荐)
→ 在sessionStore中添加pattern和evolution数据
→ ChatSessionPage更新时，同时更新全局状态
→ Dashboard订阅这些状态变化
```

### 第四步：生成真实图表数据

#### 4a. Weekly Accuracy Trend
```typescript
// 从predictions数据计算
const weeklyAccuracyData = predictions.reduce((acc, pred) => {
  const week = getWeekNumber(pred.createdAt);
  const existing = acc.find(w => w.week === week);

  if (existing) {
    existing.total++;
    if (pred.isCorrect) existing.correct++;
  } else {
    acc.push({
      week: `Week ${week}`,
      correct: pred.isCorrect ? 1 : 0,
      total: 1
    });
  }
  return acc;
}, []).map(w => ({
  week: w.week,
  accuracy: (w.correct / w.total * 100).toFixed(1)
}));
```

#### 4b. Pattern Distribution
```typescript
// 从patterns数据计算
const patternDistribution = ['A', 'B', 'C', 'D', 'E', 'F'].map(type => ({
  name: `Pattern ${type}`,
  value: patterns.filter(p => p.patternType === type).length
}));
```

#### 4c. Intervention Strategy Effectiveness
```typescript
// 基于evolution数据中changeType的成功率
const baselineSuccess = evolutions.filter(
  e => e.changeType === 'improvement' &&
  isPatternImprovement(e.fromPattern, e.toPattern)
).length / evolutions.length * 100;
// 类似计算 Aggressive 和 Adaptive
```

---

## 📋 具体代码修改清单

### ChatSessionPage.tsx
- [ ] 确认 `detectPattern()` 在交互后被调用
- [ ] 确认行为指标被保存（如有必要补充）

### DashboardPage.tsx
- [ ] 在 `useEffect` 中定期调用 `fetchPatterns(user?.id)` 和 `fetchEvolutions(user?.id)`
- [ ] 使用真实patterns数据而不是模拟数据
- [ ] 计算真实的 `weeklyAccuracyData`
- [ ] 计算真实的 `patternDistribution`
- [ ] 计算真实的 `interventionData`

### patternStore.ts (可选)
- [ ] 添加自动刷新逻辑
- [ ] 添加WebSocket连接支持（高级功能）

---

## 🎯 预期结果

用户完成对话后，Dashboard会显示：
- ✅ Current Pattern: 基于用户的验证/修改/拒绝行为
- ✅ Pattern Evolution: 该用户的模式改进次数
- ✅ Prediction Accuracy: 系统预测用户能力的准确率（当预测系统完整时）
- ✅ Weekly Accuracy Trend: 用户周准确率变化
- ✅ Pattern Distribution: 该用户历史中各模式的出现频率

所有数据都来自用户实际的对话交互，而不是硬编码的模拟数据。

---

## 🚀 推荐实现顺序

1. **最快见效** (5分钟): 添加定期刷新 DashboardPage 数据
2. **替换图表数据** (10分钟): 用真实patterns数据生成distribution
3. **完整集成** (30分钟): 添加全局状态管理，实现实时同步
4. **高级功能** (1小时+): WebSocket实时推送
