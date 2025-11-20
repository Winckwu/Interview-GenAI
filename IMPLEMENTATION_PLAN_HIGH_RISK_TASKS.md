# High-Risk Task Detection & Verification Implementation Plan

## Feature 2: Automatic High-Risk Task Detection

### Architecture

```
[BehaviorSignalDetector]
    ↓ (提取taskComplexity)
[TaskRiskAssessor] (新建)
    ↓ (评估风险等级)
[AdaptiveMRActivator]
    ↓ (调整urgency)
[InterventionManager]
```

### 步骤1: 扩展BehaviorSignalDetector - 任务风险推断

**修改文件**: `backend/src/services/BehaviorSignalDetector.ts`

```typescript
export interface BehavioralSignals {
  // ... 现有字段 ...

  // 新增: 任务风险评估
  taskRiskLevel: 'low' | 'medium' | 'high' | 'critical';  // 综合风险等级
  riskFactors: {
    domainCriticality: number;       // 0-3: 领域关键性（医疗/金融=3）
    consequenceSeverity: number;     // 0-3: 后果严重性
    timeConstraint: boolean;         // 是否有时间压力
    stakeholders: number;            // 利益相关者数量推断
    isPublicFacing: boolean;         // 是否面向公众
  };
}

export class BehaviorSignalDetector {
  // 新增方法
  assessTaskRisk(
    currentTurn: ConversationTurn,
    session: WorkSession  // 从sessionService获取
  ): { taskRiskLevel: string, riskFactors: any } {
    const userMsg = currentTurn.userMessage.toLowerCase();

    // 1. 领域关键性检测
    const domainCriticality = this.detectDomainCriticality(userMsg);

    // 2. 后果严重性检测
    const consequenceSeverity = this.detectConsequenceSeverity(userMsg);

    // 3. 时间约束检测
    const timeConstraint = this.detectTimeConstraint(userMsg);

    // 4. 利益相关者数量推断
    const stakeholders = this.inferStakeholders(userMsg);

    // 5. 是否面向公众
    const isPublicFacing = this.detectPublicFacing(userMsg);

    const riskFactors = {
      domainCriticality,
      consequenceSeverity,
      timeConstraint,
      stakeholders,
      isPublicFacing
    };

    // 6. 计算综合风险等级
    const riskScore = this.calculateRiskScore(riskFactors, session);

    let taskRiskLevel: 'low' | 'medium' | 'high' | 'critical';
    if (riskScore >= 9) taskRiskLevel = 'critical';
    else if (riskScore >= 6) taskRiskLevel = 'high';
    else if (riskScore >= 3) taskRiskLevel = 'medium';
    else taskRiskLevel = 'low';

    return { taskRiskLevel, riskFactors };
  }

  /**
   * 检测领域关键性
   * 返回: 0-3
   */
  private detectDomainCriticality(message: string): number {
    // 关键领域关键词
    const criticalDomains = {
      medical: ['医疗', '诊断', '治疗', '处方', '病人', 'medical', 'diagnosis', 'treatment', 'patient'],
      legal: ['法律', '合同', '诉讼', '法规', 'legal', 'contract', 'lawsuit', 'compliance'],
      financial: ['财务', '投资', '税务', '审计', 'financial', 'investment', 'tax', 'audit'],
      safety: ['安全', '风险', '危险', '事故', 'safety', 'risk', 'hazard', 'accident']
    };

    let score = 0;
    Object.values(criticalDomains).forEach(keywords => {
      if (keywords.some(kw => message.includes(kw))) {
        score += 1;
      }
    });

    return Math.min(score, 3);
  }

  /**
   * 检测后果严重性
   * 返回: 0-3
   */
  private detectConsequenceSeverity(message: string): number {
    const severityIndicators = [
      { keywords: ['关键', '重要', '必须', 'critical', 'essential', 'must'], score: 1 },
      { keywords: ['影响', '后果', '损失', 'impact', 'consequence', 'loss'], score: 1 },
      { keywords: ['生命', '健康', '损害', 'life', 'health', 'harm'], score: 2 },
      { keywords: ['不可逆', '永久', '致命', 'irreversible', 'permanent', 'fatal'], score: 3 }
    ];

    let maxScore = 0;
    severityIndicators.forEach(indicator => {
      if (indicator.keywords.some(kw => message.includes(kw))) {
        maxScore = Math.max(maxScore, indicator.score);
      }
    });

    return maxScore;
  }

  /**
   * 检测时间约束
   */
  private detectTimeConstraint(message: string): boolean {
    const timeKeywords = [
      '紧急', '急', '马上', '立即', '今天', '明天',
      'urgent', 'asap', 'immediately', 'today', 'deadline'
    ];

    return timeKeywords.some(kw => message.includes(kw));
  }

  /**
   * 推断利益相关者数量
   * 返回: 0-3
   */
  private inferStakeholders(message: string): number {
    const stakeholderIndicators = [
      { keywords: ['团队', '组织', 'team', 'organization'], count: 1 },
      { keywords: ['客户', '用户', 'client', 'user', 'customer'], count: 2 },
      { keywords: ['公众', '大众', '社会', 'public', 'society'], count: 3 }
    ];

    let maxCount = 0;
    stakeholderIndicators.forEach(indicator => {
      if (indicator.keywords.some(kw => message.includes(kw))) {
        maxCount = Math.max(maxCount, indicator.count);
      }
    });

    return maxCount;
  }

  /**
   * 检测是否面向公众
   */
  private detectPublicFacing(message: string): boolean {
    const publicKeywords = [
      '发布', '公开', '宣传', '广告', '展示',
      'publish', 'public', 'advertise', 'display', 'release'
    ];

    return publicKeywords.some(kw => message.includes(kw));
  }

  /**
   * 计算综合风险评分
   * 返回: 0-12
   */
  private calculateRiskScore(factors: any, session: WorkSession): number {
    let score = 0;

    // 领域关键性 (0-3)
    score += factors.domainCriticality;

    // 后果严重性 (0-3)
    score += factors.consequenceSeverity;

    // 时间约束 (+2)
    if (factors.timeConstraint) score += 2;

    // 利益相关者 (0-3)
    score += factors.stakeholders;

    // 面向公众 (+1)
    if (factors.isPublicFacing) score += 1;

    // Session的taskImportance (0-3, 如果用户手动设置了)
    if (session && session.taskImportance) {
      score += Math.max(0, session.taskImportance - 1); // taskImportance 1-3 → 0-2
    }

    return score;
  }
}
```

### 步骤2: AdaptiveMRActivator - 根据风险调整urgency

**修改文件**: `backend/src/services/AdaptiveMRActivator.ts`

```typescript
export class AdaptiveMRActivator {
  determineActiveMRs(
    signals: BehavioralSignals,
    patternEstimate: PatternEstimate,
    turnCount: number
  ): ActiveMR[] {
    const activeMRs: ActiveMR[] = [];

    for (const rule of MR_ACTIVATION_RULES) {
      // ... 现有逻辑 ...

      // ✨ 新增: 根据任务风险调整urgency
      let adjustedUrgency = rule.urgency;

      // Pattern A + High Risk Task → 从observe升级到remind
      if (patternEstimate.topPattern === 'A' &&
          signals.taskRiskLevel === 'high' &&
          rule.urgency === 'observe') {
        adjustedUrgency = 'remind';
        console.log(`🔼 Pattern A in high-risk task: upgrading ${rule.mrId} from observe to remind`);
      }

      // Pattern A + Critical Risk Task → 从observe升级到enforce
      if (patternEstimate.topPattern === 'A' &&
          signals.taskRiskLevel === 'critical' &&
          rule.urgency === 'observe') {
        adjustedUrgency = 'enforce';
        console.log(`🔼 Pattern A in critical-risk task: upgrading ${rule.mrId} from observe to enforce`);
      }

      // Pattern F + High/Critical Risk → 强制enforce
      if (patternEstimate.topPattern === 'F' &&
          (signals.taskRiskLevel === 'high' || signals.taskRiskLevel === 'critical')) {
        adjustedUrgency = 'enforce';
        console.log(`🚨 Pattern F in high-risk task: forcing enforce for ${rule.mrId}`);
      }

      const activeMR: ActiveMR = {
        mrId: rule.mrId,
        name: rule.name,
        urgency: adjustedUrgency,  // ✅ 使用调整后的urgency
        displayMode: this.determineDisplayMode(adjustedUrgency),
        message: this.generateContextualMessage(rule, signals, patternEstimate, turnCount),
        priority: this.calculatePriority(rule, patternEstimate, signals),
      };

      activeMRs.push(activeMR);
    }

    return this.prioritizeAndDedup(activeMRs);
  }
}
```

### 步骤3: 新增高风险任务专属MR规则

**修改文件**: `backend/src/services/AdaptiveMRActivator.ts`

在 `MR_ACTIVATION_RULES` 数组中添加:

```typescript
const MR_ACTIVATION_RULES: MRActivationRule[] = [
  // ... 现有规则 ...

  // ✨ 新增: 高风险任务验证强制规则
  {
    mrId: 'MR11_HighStakes',
    name: 'High-Stakes Verification (Mandatory)',
    triggerConditions: [
      {
        signal: 'taskRiskLevel',
        operator: 'in',
        threshold: ['high', 'critical'],
        description: 'High or critical risk task detected'
      },
      {
        signal: 'verificationAttempted',
        operator: '==',
        threshold: false,
        description: 'No verification attempted yet'
      }
    ],
    urgency: 'enforce',  // 强制干预
    targetPatterns: ['A', 'B', 'C', 'D', 'E', 'F'],  // 适用于所有pattern
    description: 'Mandatory verification for high-stakes tasks'
  },

  // ✨ 新增: Pattern A在高风险任务的特殊提醒
  {
    mrId: 'MR_PatternA_HighRisk',
    name: 'Pattern A: High-Risk Task Alert',
    triggerConditions: [
      {
        signal: 'taskRiskLevel',
        operator: 'in',
        threshold: ['high', 'critical'],
        description: 'High-risk task'
      },
      {
        signal: 'taskDecompositionEvidence',
        operator: '>=',
        threshold: 2,
        description: 'Pattern A characteristic: good decomposition'
      }
    ],
    urgency: 'remind',  // Pattern A默认observe，但高风险升到remind
    targetPatterns: ['A'],
    description: 'Even for Pattern A users, high-risk tasks need extra verification'
  }
];
```

### 步骤4: 前端显示任务风险等级

**修改文件**: `frontend/src/pages/ChatSessionPage.tsx`

在session信息区域显示风险等级:

```typescript
// 在render方法中添加
{session && session.taskRiskLevel && (
  <div className={styles.taskRiskBadge} data-risk={session.taskRiskLevel}>
    {session.taskRiskLevel === 'critical' && '🚨 Critical Risk Task'}
    {session.taskRiskLevel === 'high' && '⚠️ High Risk Task'}
    {session.taskRiskLevel === 'medium' && '⚡ Medium Risk Task'}
  </div>
)}
```

### 测试场景

**场景1: Pattern A用户 + 低风险任务**

```
Input: "帮我写一个Python函数计算斐波那契数列"
taskRiskLevel: low
Expected: 无干预（Level 0）
```

**场景2: Pattern A用户 + 高风险任务**

```
Input: "帮我写医疗诊断系统的血压异常检测算法，需要今天部署给患者使用"
Detected Risk Factors:
  - domainCriticality: 3 (medical)
  - consequenceSeverity: 2 (health impact)
  - timeConstraint: true (今天)
  - stakeholders: 2 (患者)
→ taskRiskLevel: high

Expected:
  - Pattern A从Level 0升级到Level 2
  - 触发MR11 (Verification) with urgency=enforce
  - 显示"⚠️ High Risk Task"徽章
```

**场景3: Pattern F用户 + 危急任务**

```
Input: "帮我写一个金融系统的交易确认函数，要处理几百万用户的账户"
taskRiskLevel: critical
Expected:
  - 立即触发hard barrier
  - 强制要求验证计划
  - 不允许跳过
```

## 实现优先级

| 步骤 | 工作量 | 价值 | 优先级 |
|------|--------|------|--------|
| 步骤1: 风险推断逻辑 | 3小时 | 极高 | P0 |
| 步骤2: Urgency调整 | 2小时 | 极高 | P0 |
| 步骤3: 新MR规则 | 1小时 | 高 | P1 |
| 步骤4: 前端显示 | 1小时 | 中 | P2 |

**总计**: 约7小时

## 研究价值

1. **情境适应性**: 证明即使Pattern A也需要根据任务风险调整支持level
2. **自动化风险评估**: 无需用户手动标记，系统自动推断
3. **分层干预的动态性**: Level 0→Level 2的实时切换
