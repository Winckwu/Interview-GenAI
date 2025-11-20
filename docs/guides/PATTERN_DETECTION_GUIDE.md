# 📊 Pattern 检测和自适应系统详解

## 概述

Interview-GenAI 系统通过分析用户的对话行为，自动检测用户属于 **6 种 AI 使用模式** 之一，然后根据模式提供相应的个性化帮助和指导。

---

## 🔍 6 种用户模式（Pattern A-F）

### **Pattern A: Strategic Decomposition & Control**（战略分解与控制）
**特征**：
- 仔细的任务规划
- 高度的验证和监控意识
- 独立思考，不过度依赖 AI
- 全面的评估方法

**表现**：
- ✅ 提出具体、详细的问题
- ✅ 验证 AI 的答案 (点击"Verify"按钮)
- ✅ 要求分解复杂任务
- ✅ 保持批判性思维

**得分条件**：
```
规划维度 (Planning) ≥ 10 分
监督维度 (Monitoring) ≥ 7 分
评估维度 (Evaluation) ≥ 7 分
信度：90%
```

---

### **Pattern B: Iterative Optimization & Calibration**（迭代优化与校准）
**特征**：
- 频繁迭代和修改
- 问题重新提问和细化
- 有选择性地接受 AI 建议
- 持续学习和优化

**表现**：
- 🔄 对同一任务进行多次迭代
- 🔄 点击"Modify"按钮改进响应
- 🔄 不断调整提示词
- 🔄 关注改进过程

**得分条件**：
```
迭代频率 (Iteration Frequency) ≥ 2.5
反思深度 (Reflection Depth) ≥ 1.5
信度：80%
```

---

### **Pattern C: Adaptive Adjustment**（自适应调整）
**特征**：
- 多策略并行使用
- 上下文感知的方法
- 灵活的角色转换
- 动态战略切换

**表现**：
- 🎯 使用多种不同的提示词风格
- 🎯 在不同场景应用不同策略
- 🎯 根据 AI 回应调整方法

**得分条件**：
```
策略多样性 (Strategy Diversity) ≥ 2
跨模型使用 (Cross-model Usage) ≥ 1.5
信度：80%
```

---

### **Pattern D: Deep Verification & Criticism**（深度验证与批评）
**特征**：
- 彻底的审查和检查
- 深入的问题探索
- 高度的反思
- 对细节的关注

**表现**：
- 🔍 频繁点击"Verify"按钮
- 🔍 问题具有探索性和批判性
- 🔍 高错误意识

**得分条件**：
```
验证率 (Verification Rate) ≥ 2.5
错误意识 (Error Awareness) ≥ 2
规划维度 ≤ 9
信度：85%
```

---

### **Pattern E: Teaching & Learning**（教学与学习）
**特征**：
- 用 AI 作为学习工具
- 高度的学习反思
- 重视知识构建过程
- 自主学习意愿强

**表现**：
- 📚 点击"Modify"显示学习尝试
- 📚 问题关于"如何学"而不仅仅"是什么"
- 📚 高修改率（显示学习过程）

**得分条件**：
```
反思深度 (Reflection Depth) ≥ 2.5
修改率 (Modification Rate) ≥ 2
信度：92%
```

---

### **Pattern F: Passive Over-Reliance ⚠️**（被动过度依赖 - 高风险）
**特征**：
- 不加批判的接受答案
- 最少的验证
- 被动学习态度
- 高度依赖 AI

**表现**：
- ❌ 很少验证 AI 的答案
- ❌ 不修改或反思
- ❌ 简短、笼统的问题
- ❌ 快速接受结果

**得分条件**（最强信号）：
```
反思深度 = 0 (没有修改/验证)
总体得分 < 15
信度：95%
```

---

## 📈 Pattern 检测算法

### **第 1 步：特征向量计算**

系统从用户的对话历史中提取 **12 个行为特征**：

```
【规划维度 (Planning)】
1. promptSpecificity     - 问题的具体性 (基于词数)
2. taskDecompositionScore - 任务分解能力
3. strategyDiversity     - 策略多样性
4. independentAttemptRate - 独立尝试率

【监督维度 (Monitoring)】
5. verificationRate       - 验证率 (点击Verify次数 / 总交互数)
6. trustCalibrationAccuracy - 信任校准准确性
7. sessionDurationPatterns  - 会话持续时间模式

【评估维度 (Evaluation)】
8. modificationRate      - 修改率 (点击Modify次数 / 总交互数)
9. reflectionDepth       - 反思深度 (KEY！)
10. errorAwareness       - 错误意识

【调节维度 (Regulation)】
11. iterationFrequency   - 迭代频率
12. crossModelUsage      - 跨模型使用
```

### **第 2 步：特征提取公式**

例如，反思深度的计算：

```python
# 反思深度 = 修改次数 / 总交互数 * 3
# 范围：0-3，其中 0 表示没有任何修改
reflectionDepth = min(max(modificationCount / totalInteractions * 3, 0.5), 3)

# 验证率 = 验证次数 / 总交互数 * 3
verificationRate = min(verificationCount / totalInteractions * 3, 3)
```

### **第 3 步：决策树分类**

系统使用规则-阈值混合方法（类似 SVM 分类）：

```python
# 1. 首先检查 Pattern F（危险信号）
if reflectionDepth == 0 and totalScore < 15:
    return Pattern F  # 高风险！

# 2. 检查 Pattern E（教学型）
elif reflectionDepth >= 2.5:
    return Pattern E

# 3. 检查 Pattern A（战略型）
elif planningTotal >= 10 and monitoringTotal >= 7 and evaluationTotal >= 7:
    return Pattern A

# 4. 检查 Pattern D（深度验证型）
elif verificationRate >= 2.5 and errorAwareness >= 2:
    return Pattern D

# 5. 检查 Pattern C（适应型）
elif strategyDiversity >= 2 and crossModelUsage >= 1.5:
    return Pattern C

# 6. 检查 Pattern B（迭代型）
elif iterationFrequency >= 2.5 and reflectionDepth >= 1.5:
    return Pattern B

# 默认
else:
    return Pattern A
```

---

## 🎯 自适应帮助机制

### **触发时间**

Pattern 检测在以下情况触发：

1. **自动触发**：用户完成 3+ 次交互后自动分析
2. **手动触发**：用户可以在"Patterns"页面查看当前模式
3. **持续监测**：每个会话都会生成一个模式日志

### **前端显示**

在聊天界面，当检测到 Pattern 时显示：

```
┌─────────────────────────────────────┐
│ 🟢 Pattern Detected                 │
├─────────────────────────────────────┤
│ Pattern: A - Strategic Decomposition│
│ Confidence: 90%                      │
│                                      │
│ Reasoning:                           │
│ • High planning dimension score     │
│ • Strong verification behavior     │
│ • Comprehensive evaluation approach│
└─────────────────────────────────────┘
```

### **自适应建议**

根据检测到的模式，系统会提供：

| Pattern | 建议 | 示例 |
|---------|------|------|
| **A** | 维持当前方法，鼓励更深入的验证 | "你的战略规划很好，试试要求 AI 解释更多细节" |
| **B** | 鼓励保存修改过程，记录学习路径 | "你的迭代很有效，考虑保存修改历史来跟踪改进" |
| **C** | 鼓励体系化方法，整合多策略 | "你的灵活性很好，试试将成功的策略整合成框架" |
| **D** | 平衡批评与接受，避免过度设计 | "你的验证意识很强，注意不要过度思考" |
| **E** | 提供更多学习资源和反思提示 | "你展现了很强的学习意愿，试试总结关键概念" |
| **F** | ⚠️ **警告**：提供风险提示和安全指导 | "检测到过度依赖风险，建议：\n1. 验证关键信息\n2. 理解而非照搬\n3. 多来源确认" |

---

## 💾 数据存储

### **Pattern Logs 表**

```sql
CREATE TABLE pattern_logs (
  id UUID PRIMARY KEY,
  session_id UUID NOT NULL,
  detected_pattern CHAR(1),           -- A-F
  confidence DECIMAL(3,2),            -- 0.50-0.95
  features JSONB,                     -- 12个特征的完整数据
  reasoning TEXT[],                   -- 推理过程
  created_at TIMESTAMP
);
```

### **数据示例**

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "sessionId": "session-123",
  "detectedPattern": "A",
  "confidence": 0.90,
  "features": {
    "promptSpecificity": 2.8,
    "verificationRate": 2.6,
    "reflectionDepth": 1.8,
    "modificationRate": 1.2,
    "iterationFrequency": 2.1,
    "errorAwareness": 2.5
  },
  "reasoning": [
    "High planning dimension score",
    "Strong verification and monitoring",
    "Comprehensive evaluation approach"
  ],
  "createdAt": "2024-11-18T10:30:00Z"
}
```

---

## 🔄 持续改进循环

```
┌─────────────────────────────────────────────┐
│ 1. User Interacts with AI                    │
│    ↓                                          │
│ 2. System Records:                            │
│    - Messages sent                            │
│    - Verify/Modify clicks                    │
│    - Response times                          │
│    ↓                                          │
│ 3. Feature Extraction                        │
│    - Calculate 12 behavioral metrics         │
│    ↓                                          │
│ 4. Pattern Detection                         │
│    - Run decision tree classifier             │
│    - Calculate confidence score              │
│    ↓                                          │
│ 5. Display Pattern to User                   │
│    - Show detection results                  │
│    - Display confidence and reasoning        │
│    ↓                                          │
│ 6. Adaptive Response                         │
│    - Tailor suggestions based on pattern    │
│    - Warn if Pattern F detected              │
│    ↓                                          │
│ 7. Continuous Monitoring                     │
│    - Re-analyze as user continues           │
│    - Update pattern if behavior changes      │
└─────────────────────────────────────────────┘
```

---

## 📊 实时示例

### **用户交互序列**

```
交互 1: "如何学习 Python？"
       → promptSpecificity +0.5（有点宽泛）

交互 2: 点击 Verify
       → verificationRate +1

交互 3: 点击 Modify，改进提示词
       → modificationRate +1, reflectionDepth +1

交互 4: "能否解释闭包？"
       → promptSpecificity +1（更具体）

交互 5: 点击 Verify
       → verificationRate +1

【结果】
总交互：5 次
Verification: 2 次 → verificationRate = 2/5 * 3 = 1.2
Modification: 1 次 → reflectionDepth = 1/5 * 3 = 0.6
planningTotal ≈ 6, monitoringTotal ≈ 3, evaluationTotal ≈ 1.6

【分类】
✓ 不符合 Pattern F（reflectionDepth > 0）
✓ 不符合 Pattern A（分数不够高）
✓ 符合 Pattern B（有迭代）
→ 检测到：Pattern B（信度 80%）
```

---

## ⚠️ Pattern F 风险警告

当系统检测到 Pattern F 时，会显示：

```
╔════════════════════════════════════╗
║ ⚠️  Passive Over-Reliance Risk     ║
╠════════════════════════════════════╣
║ Detection Signals:                 ║
║ • No content verification (0%)    ║
║ • No reflection/modification      ║
║ • Passive acceptance pattern       ║
║                                    ║
║ Recommendations:                   ║
║ 1️⃣  Ask "Why?" questions           ║
║ 2️⃣  Cross-check important facts   ║
║ 3️⃣  Try modifying AI responses    ║
║ 4️⃣  Engage in active learning     ║
╚════════════════════════════════════╝
```

---

## 🎓 自适应学习路径

根据 Pattern，系统会建议不同的学习策略：

| Pattern | 学习建议 |
|---------|---------|
| **A** | 深化验证技能，学习更多检查方法 |
| **B** | 记录迭代过程，建立知识库 |
| **C** | 比较不同方法，理解权衡 |
| **D** | 平衡批判与接纳，培养判断力 |
| **E** | 构建概念图，深化理解 |
| **F** | **必读**：学习批判性思维，安全使用 AI |

---

## 📈 长期追踪

系统保存所有 Pattern 日志，用户可以看到：

- 📊 Pattern 趋势（是否在改进？）
- 🎯 特征演变（哪些行为在改变？）
- 💡 模式历史（学习进度）
- 🏆 达成成就（从 F 升级到 A）

---

## 总结

Interview-GenAI 的自适应系统通过：

1. **自动分析**：从对话中提取 12 个行为特征
2. **智能分类**：用 SVM 风格的决策树识别 6 种模式
3. **个性化反馈**：根据模式提供定制化建议
4. **持续监测**：随着用户行为变化而更新模式
5. **风险警告**：及时发现过度依赖 AI 的风险

这样，系统不仅是 AI 助手，更是一个**学习教练**，帮助用户成为更聪明、更独立的 AI 使用者！ 🚀
