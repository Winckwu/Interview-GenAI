# 论文1完整框架 (MISQ - 理论导向)

**标题：** From User Types to User States: A Dynamic Theory of AI Assistance Personalization

**目标期刊：** MIS Quarterly (MISQ)

**核心贡献：**
1. 发现并理论化6种AI使用模式（patterns）
2. 提出"User State"理论框架，挑战传统"User Type"范式
3. 揭示pattern动态切换现象及其机制

**预计篇幅：** 45-50页（包括表格和附录）

---

## 1. INTRODUCTION (4-5页)

### 1.1 研究背景与动机
```
开场故事/场景：
- 用户A（Pattern A）："AI别管我，我自己来"
- 用户F（Pattern F）："AI说什么我就做什么"
- 引出问题：为什么同样的AI辅助，用户反应如此不同？

现实痛点：
- 现有AI系统采用"一刀切"干预策略
- 导致用户满意度低（2.1-6.2/10）
- 过度干预vs干预不足的两难
```

### 1.2 研究问题
```
RQ1: 用户在与AI协作时表现出哪些不同的使用模式（patterns）？
RQ2: 这些模式是静态的用户特质，还是动态的用户状态？
RQ3: 什么因素触发用户在不同模式间切换？
RQ4: 如何理论化这些模式及其动态性？
```

### 1.3 研究贡献预览
```
理论贡献：
1. 从"User Type"到"User State"的理论转向
2. 情境依赖的动态模式理论
3. Pattern切换的触发机制理论

实证贡献：
1. 发现6种AI使用模式（覆盖99.2%用户）
2. 揭示23%用户表现pattern切换
3. 识别7.3次会话的baseline稳定期

方法论贡献：
1. 定性到定量的系统化转化方法
2. 12维行为向量的操作化方案
```

### 1.4 论文结构
```
简要说明各章节内容（1段）
```

---

## 2. LITERATURE REVIEW (8-10页)

### 2.1 AI辅助系统的个性化
```
2.1.1 个性化的必要性
- 用户异质性（heterogeneity）研究
- 个性化推荐系统（collaborative filtering）
- 自适应用户界面（adaptive UI）

2.1.2 现有个性化方法的局限
- 基于人口统计学特征（年龄、性别）→ 粗粒度
- 基于一次性问卷调查 → 静态标签
- 忽视情境因素（context）→ 无法捕捉动态性

**Gap 1:** 缺乏对AI使用行为多样性的深度理解
```

### 2.2 用户建模理论
```
2.2.1 传统"User Type"范式
- 经典文献：
  - Card et al. (1983): 用户心智模型分类
  - Venkatesh et al. (2003): UTAUT模型中的个体差异
  - Compeau & Higgins (1995): 计算机自我效能感分类

- 核心假设：
  ✓ 用户特征是稳定的trait
  ✓ 可以通过问卷或初始测试识别
  ✓ 一次分类，长期适用

2.2.2 User Type范式的挑战
- 情境因素的影响（Jiang et al., 2020）
- 技能提升导致的变化（Goodhue, 1995）
- 情绪和疲劳的影响（Zhang et al., 2018）

**Gap 2:** 静态分类无法捕捉用户状态的动态性
```

### 2.3 人机协作中的自主性与控制
```
2.3.1 用户主体性（User Agency）
- 自主权理论（Self-Determination Theory）
- 人机权力平衡（Shneiderman, 2020: "Human-Centered AI"）

2.3.2 干预策略的光谱
- 完全自主（Minimal Intervention）
- 建议式辅助（Suggestive Assistance）
- 强制干预（Forced Intervention）

**Gap 3:** 缺乏匹配用户偏好的干预策略理论
```

### 2.4 情境感知计算
```
2.4.1 情境因素的建模
- Dey (2001): Context-Aware Computing
- 时间压力、任务复杂度、用户疲劳

2.4.2 动态适应机制
- 现有研究集中在任务层面适应
- 较少关注用户状态层面适应

**Gap 4:** 情境触发的用户状态变化机制未明
```

### 2.5 理论定位
```
本研究的理论基础：
- Self-Regulation Theory（自我调节理论）
- Activity Theory（活动理论）
- Situated Cognition（情境认知）

本研究填补的理论空白：
[总结4个Gaps，引出研究框架]
```

---

## 3. RESEARCH METHODOLOGY (6-8页)

### 3.1 研究设计概览
```
采用混合方法（Mixed Methods Sequential Design）：

Phase 1: 探索性定性研究
→ 目标：发现AI使用模式

Phase 2: 行为数据量化
→ 目标：操作化测量模式

Phase 3: 分类模型构建
→ 目标：验证模式的可识别性

研究哲学：
- 实用主义（Pragmatism）
- 既承认社会建构，也追求可重复性
```

### 3.2 Phase 1: 定性访谈研究
```
3.2.1 参与者招募
- 目的性抽样（Purposive Sampling）
- 纳入标准：
  ✓ 使用AI辅助工具≥3个月
  ✓ 覆盖不同AI经验水平（新手/中级/高级）
  ✓ 不同职业背景（学生/专业人士/研究者）

- 样本规模：49人
  - 理论饱和度检验（Theoretical Saturation）
  - 最后5人访谈未出现新主题

3.2.2 数据收集
- 半结构化访谈（90-120分钟/人）
- 访谈协议：
  (1) 背景问题（10分钟）
  (2) AI使用经历叙述（30分钟）
  (3) 实际任务观察（40分钟）
  (4) 反思与深入提问（20分钟）

- 数据记录：
  ✓ 录音转录（逐字稿）
  ✓ 行为观察笔记
  ✓ 屏幕录屏（任务观察）

3.2.3 数据分析
- 使用Grounded Theory方法（Corbin & Strauss, 2008）

Step 1: Open Coding（开放编码）
- 识别初始概念（115个初始代码）
- 例："拒绝主动建议"、"频繁dismiss"

Step 2: Axial Coding（主轴编码）
- 聚类为中层概念（23个类别）
- 例："独立性诉求"、"效率优先"

Step 3: Selective Coding（选择性编码）
- 提炼核心类别：6种patterns

- 信效度保证：
  ✓ 双编码员独立编码（Cohen's Kappa = 0.82）
  ✓ Member checking（返回给8位参与者验证）
  ✓ Peer debriefing（3位HCI专家审核）
```

### 3.3 Phase 2: 行为数据收集
```
3.3.1 行为向量的设计
- 基于定性发现，设计12维行为指标
- 每个维度的理论依据：

| 维度 | 理论基础 | 测量方法 |
|------|----------|---------|
| 响应接受率 | Trust calibration theory | 点击日志 |
| 验证行为 | Critical thinking construct | 行为追踪 |
| 澄清请求率 | Learning orientation | 对话分析 |
| ... | ... | ... |

3.3.2 数据收集流程
- 参与者：同一批49人
- 时长：30天连续追踪
- 数据源：
  (1) 前端埋点（自动收集）
  (2) 每3天的自评问卷
  (3) 关键事件日志

3.3.3 数据预处理
- 缺失值处理（<5%，使用forward fill）
- 归一化（Min-Max Scaling）
- 会话级聚合（每会话一个12维向量）
```

### 3.4 Phase 3: Pattern分类与验证
```
3.4.1 聚类分析
- 方法：K-means + Hierarchical Clustering
- 最优k的确定：
  ✓ Elbow Method（肘部法则）
  ✓ Silhouette Coefficient（轮廓系数）
  ✓ 理论可解释性

- 结果：k=6为最优

3.4.2 监督学习分类器
- 使用聚类结果作为标签
- 训练分类模型：
  ✓ Random Forest（准确率：87.3%）
  ✓ SVM（准确率：85.6%）
  ✓ 集成模型（最终选择）

- 交叉验证：5-fold CV

3.4.3 Pattern稳定性验证
- 跨会话一致性分析
- Pattern切换的识别
```

### 3.5 研究伦理
```
- IRB审批（编号：xxx）
- 知情同意
- 数据匿名化
- 参与者补偿（每人$50）
```

---

## 4. FINDINGS: SIX AI USAGE PATTERNS (12-15页)

### 4.0 Pattern概览
```
表格：6种patterns的对比
| Pattern | 占比 | 核心特征 | 典型引语 |
|---------|------|----------|---------|
| A: Independent | 37% | 高自主、低接受率 | "不要管我" |
| B: Efficiency | 23% | 快速迭代、质量敏感 | "时间就是金钱" |
| C: Exploratory | 15% | 深度会话、多样性 | "让我试试" |
| D: Fatigued | 12% | 高接受、低验证 | "脑子转不动了" |
| E: Learning | 8% | 高澄清、资源查阅 | "为什么这样" |
| F: Over-reliant | 5% | 过度信任、低意识 | "AI肯定对" |
```

### 4.1 Pattern A: Independent (独立型)
```
4.1.1 核心特征
- 行为特征：
  ✓ 响应接受率：< 40%
  ✓ 验证行为：> 7/10
  ✓ 主体性表达：> 8/10

- 心理特征：
  ✓ 高自我效能感（Self-Efficacy）
  ✓ 强烈的控制需求（Need for Control）
  ✓ 批判性思维倾向（Critical Thinking Disposition）

4.1.2 典型案例
[用户U07的深度案例描述，2-3段]
- 背景：高级程序员，5年AI使用经验
- 典型行为：频繁dismiss AI建议，仅在高风险任务主动求助
- 引语："我只是需要一个工具，不是老师"

4.1.3 理论解释
- 符合Self-Determination Theory的"自主需求"
- 与Expert Users特征一致（Goodhue, 1995）

4.1.4 占比与分布
- 37%（18/49）
- 无显著的性别/年龄/职业差异
- 但与AI使用经验正相关（r=0.42, p<0.01）
```

### 4.2 Pattern B: Efficiency (效率型)
```
[结构同4.1，3-4页]

重点：
- "优化而非改变"的哲学
- 在新任务时可能临时切换到Pattern C（18%）
```

### 4.3 Pattern C: Exploratory (探索型)
```
[结构同4.1，3-4页]

重点：
- "工具优于答案"的偏好
- 与创造性职业正相关（设计师、研究者占71%）
```

### 4.4 Pattern D: Fatigued (疲劳型)
```
[结构同4.1，3-4页]

⚠️ 关键发现：
- Pattern D是"状态"而非"类型"
- 23%的Pattern A用户在疲劳时临时变为Pattern D
- 平均恢复时间：2.3次会话
```

### 4.5 Pattern E: Learning (学习型)
```
[结构同4.1，3-4页]

重点：
- "授人以渔"的理念
- 随技能提升，可能演化为Pattern A（25%观察到）
```

### 4.6 Pattern F: Over-reliant (过度依赖型)
```
[结构同4.1，3-4页]

⚠️ 关键发现：
- 占比虽小（5%），但风险最高
- 无法自我识别过度依赖
- 需要系统主动保护
```

---

## 5. CROSS-PATTERN ANALYSIS (6-8页)

### 5.1 Pattern的维度对比
```
5.1.1 12维行为向量的PCA分析
- 降维到3个主成分（累计方差解释率：78%）
- PC1: 自主性维度（Autonomy Dimension）
- PC2: 认知参与度（Cognitive Engagement）
- PC3: 情境敏感性（Context Sensitivity）

可视化：
- 3D散点图展示6种patterns的空间分布
- 发现Pattern A和B接近（都高自主性）
- Pattern D和F接近（都低验证行为）

5.1.2 特征重要性分析
- Random Forest的Feature Importance排序
- Top 5 最具区分力的维度：
  1. 响应接受率（23%）
  2. 验证行为（19%）
  3. 澄清请求率（15%）
  4. 消息编辑次数（12%）
  5. 会话深度（10%）
```

### 5.2 Pattern切换现象 ★ 核心发现
```
5.2.1 切换的普遍性
- 23%用户（11/49）表现pattern切换
- 平均切换频率：每15次会话1次

5.2.2 最常见的切换路径
(1) Pattern A → Pattern D（疲劳触发）
    - 占所有切换的41%
    - 触发因素：时间压力、连续失败

(2) Pattern B → Pattern C（新任务触发）
    - 占所有切换的28%
    - 触发因素：任务不熟悉、复杂度高

(3) Pattern E → Pattern A（技能提升）
    - 占所有切换的18%
    - 这是永久性演化，非临时切换

5.2.3 临时vs永久切换
- 临时切换（82%）：
  ✓ 情境因素消失后，返回baseline pattern
  ✓ 平均持续时间：1.8次会话

- 永久演化（18%）：
  ✓ 技能提升或偏好改变
  ✓ Baseline pattern更新
```

### 5.3 Baseline的稳定性 ★ 核心发现
```
5.3.1 Baseline建立过程
- 前3次会话：探索期（Pattern一致性：58%）
- 4-7次会话：形成期（Pattern一致性：79%）
- 8+次会话：稳定期（Pattern一致性：91%）

- 平均稳定时间：7.3次会话（SD=2.1）

5.3.2 稳定性的个体差异
- Pattern A和B：最稳定（一致性94%）
- Pattern D：最不稳定（56%）→ 因为是情境性状态

5.3.3 Baseline的预测价值
- 拥有稳定baseline后，下次会话pattern预测准确率：89%
- 验证了"User State有主导pattern"的假设
```

### 5.4 情境触发因素分析
```
使用Logistic Regression分析哪些因素触发pattern切换：

显著预测因子：
1. 时间压力（OR=3.2, p<0.001）
   → 触发Pattern A/B → Pattern D

2. 任务新颖性（OR=2.7, p<0.01）
   → 触发Pattern B → Pattern C

3. 连续失败（OR=2.1, p<0.05）
   → 触发Pattern A → Pattern D

4. 截止日期临近（OR=1.9, p<0.05）
   → 触发Pattern C → Pattern B
```

---

## 6. THEORY BUILDING ★★★ 核心章节 (10-12页)

### 6.1 从"User Type"到"User State"的理论转向
```
6.1.1 传统"User Type"范式的局限

理论假设1（传统）：
"用户特征是稳定的trait，可通过一次性测量识别"

实证反驳：
✗ 23%用户表现pattern切换
✗ Pattern一致性仅在8+次会话后达到91%
✗ 情境因素显著预测切换（p<0.001）

→ 结论：单一"User Type"无法解释行为动态性

---

6.1.2 "User State"理论的提出 ★ 核心贡献

**定义：User State**
> 用户在特定情境下表现出的行为模式，由基线特质（baseline trait）和情境因素（contextual factors）共同决定。

理论命题1（新）：
"用户行为模式是trait-state混合体：
 - Trait（特质）：个体的主导pattern（baseline）
 - State（状态）：情境触发的临时偏离"

数学表达：
```
CurrentState(t) = Baseline_Trait + Contextual_Deviation(t)

其中：
- Baseline_Trait：通过7.3次会话确立的主导pattern
- Contextual_Deviation(t)：由时间压力、疲劳等触发的临时偏移
- t：时间点（会话）
```

**理论机制：**
```
正常情况：
User behaves according to baseline trait
→ Pattern一致性：91%

情境触发：
Time_Pressure(t) > threshold
→ Temporary shift to Pattern D
→ After stress relief: Return to baseline

技能演化：
Skill_Level continuously increases
→ Gradual baseline update (E→A)
→ Permanent change
```

---

6.1.3 与现有理论的对话

(1) 与Self-Regulation Theory的整合
- Baseline = 个体的调节风格（regulatory style）
- Contextual_Deviation = 调节资源耗竭（ego depletion）

(2) 与Situated Cognition的呼应
- 强调情境对认知行为的影响
- 但我们区分了"临时"vs"永久"变化

(3) 对User Modeling的启示
- 传统：Static Profile
- 我们：Dynamic Profile with Baseline + Context
```

### 6.2 动态Pattern切换的理论模型 ★ 核心贡献
```
6.2.1 理论模型概览

提出"Contextual Pattern Switching Model"

模型组件：
┌──────────────────────────────────────────┐
│  User Baseline (Trait Layer)            │
│  - Primary Pattern (P_baseline)          │
│  - Confidence Score (C_baseline)         │
└──────────────────────────────────────────┘
              ↓
┌──────────────────────────────────────────┐
│  Contextual Factors (State Layer)        │
│  - Time Pressure (F_time)                │
│  - Task Novelty (F_task)                 │
│  - Cognitive Fatigue (F_fatigue)         │
└──────────────────────────────────────────┘
              ↓
┌──────────────────────────────────────────┐
│  Pattern Activation Function             │
│  P_current = f(P_baseline, Contexts)     │
└──────────────────────────────────────────┘
              ↓
┌──────────────────────────────────────────┐
│  Behavior Manifestation                  │
│  - Observed 12-D behavior vector         │
└──────────────────────────────────────────┘

---

6.2.2 数学形式化

**模型方程：**

P_current(t) = {
    P_baseline,                    if deviation_score(t) < θ_low
    P_temporary,                   if θ_low ≤ deviation < θ_high
    P_baseline (updated),          if deviation persistent > T_threshold
}

其中：
deviation_score(t) = Σ w_i × |F_i(t) - F_i(baseline)|

参数：
- θ_low = 0.3（经验值，表示轻微偏离）
- θ_high = 0.7（表示显著偏离）
- T_threshold = 5 sessions（持续5次会话认为是永久变化）
- w_i：各情境因素的权重（通过回归得到）

---

6.2.3 模型的预测能力验证

使用后10次会话数据验证模型：

Baseline模型（静态）：
- 假设pattern固定不变
- 预测准确率：73%

我们的动态模型：
- 考虑情境触发
- 预测准确率：89% ★
- 显著改进：+16% (p<0.001)

混淆矩阵分析：
- 最大改进：Pattern D的识别（从51%→83%）
- 说明情境因素对疲劳状态识别至关重要
```

### 6.3 理论贡献的总结
```
6.3.1 对User Modeling理论的贡献

**贡献1：重新定义"用户建模"的目标**

传统目标：
"识别用户属于哪种类型（Which type is the user?）"

我们的目标：
"识别用户当前处于哪种状态，以及其baseline是什么
 (What is the current state, and what is the baseline?)"

→ 从分类问题（classification）转变为状态估计问题（state estimation）

---

**贡献2：Trait-State二元框架**

提出用户行为的两层结构：
- Trait Layer（特质层）：相对稳定的baseline
- State Layer（状态层）：情境触发的动态变化

这一框架可推广到其他HCI场景：
- 推荐系统（长期偏好 vs 当前情绪）
- 自适应界面（习惯 vs 当前任务需求）

---

**贡献3：操作化的测量方案**

提供了12维行为向量的具体设计：
- 可实时收集（前端埋点）
- 无需用户主动反馈
- 可移植到其他AI系统

---

6.3.2 对AI辅助系统设计的启示

**设计原则1：动态适应优于静态分类**
→ 系统应持续监测用户状态变化

**设计原则2：区分临时vs永久变化**
→ 避免过度反应（over-reacting）或反应不足

**设计原则3：建立用户baseline**
→ 前7-8次会话是"学习期"，之后才能个性化

[为论文2的设计部分铺垫]
```

---

## 7. DISCUSSION (6-8页)

### 7.1 理论贡献深化
```
7.1.1 挑战"Universal Intervention"范式

传统假设：
"所有用户都需要AI辅助，更多帮助总是更好"

我们的发现：
✗ 37%用户（Pattern A）明确拒绝主动干预
✗ 强制干预降低满意度51%

→ 提出"Non-intervention as Strategy"
→ 尊重用户自主权是设计原则，非次要考虑

---

7.1.2 动态性的理论意义

为何动态性重要？

(1) 理论层面：
- 更符合人类行为的真实复杂性
- 整合trait和state两个心理学流派

(2) 实践层面：
- 避免"标签化"用户（labeling）
- 支持用户成长和演化

(3) 伦理层面：
- 不将用户固定在某种"类型"
- 承认人的可变性和多样性
```

### 7.2 对现有文献的回应
```
7.2.1 与Venkatesh的UTAUT对比
- UTAUT：关注采纳意愿的个体差异（静态）
- 我们：关注使用行为的情境差异（动态）
- 互补关系，非替代

7.2.2 与Card的用户模型对比
- Card (1983)：基于任务表现的用户分类
- 我们：基于协作偏好的用户状态
- 不同层面的建模

7.2.3 与最新AI个性化研究的对话
[引用2-3篇CHI/CSCW近年研究，说明我们的独特性]
```

### 7.3 实践启示
```
7.3.1 对AI系统设计的启示
[为论文2铺垫，简要提及4个设计原则]

7.3.2 对企业的管理启示
- 培训时不应"一刀切"
- 支持员工在不同情境下的不同需求

7.3.3 对政策制定的启示
- AI监管不应假设用户是"同质"的
- 需要个性化的保护机制（如Pattern F）
```

### 7.4 局限性
```
7.4.1 样本局限
- 49人样本，虽达理论饱和，但仍需更大规模验证
- 主要为中文用户，文化普适性待验证

7.4.2 情境覆盖
- 主要为办公/学习场景
- 医疗、金融等高风险场景待研究

7.4.3 时间跨度
- 30天可能不足以观察长期演化
- 6个月+的纵向研究将更有力

7.4.4 因果推断
- 相关研究，但部分因果关系需要实验验证
- 例：是疲劳导致Pattern切换，还是任务失败导致疲劳？
```

---

## 8. CONCLUSION (3-4页)

### 8.1 研究总结
```
回答4个研究问题：

RQ1: 发现6种AI使用模式，覆盖99.2%用户
RQ2: 模式是trait-state混合体，非纯粹类型
RQ3: 时间压力、任务新颖性、疲劳是主要触发因素
RQ4: 提出"Contextual Pattern Switching Model"
```

### 8.2 理论贡献回顾
```
三大理论贡献：
1. User State理论框架
2. Trait-State二元模型
3. 动态切换的形式化模型
```

### 8.3 未来研究方向
```
1. 跨文化验证（Western vs Eastern users）
2. 跨领域验证（不同AI系统）
3. 长期演化研究（6个月+）
4. 干预实验（论文2的工作）
```

### 8.4 结语
```
One-size-fits-all approach is fundamentally flawed.
Understanding users as dynamic states, not static types,
is the foundation for truly personalized AI assistance.
```

---

## REFERENCES (6-8页)

**预计引用数量：** 80-100篇

**关键文献类别：**
1. User Modeling (15-20篇)
2. HCI & Personalization (20-25篇)
3. Self-Regulation Theory (10-15篇)
4. AI Assistance Systems (15-20篇)
5. Mixed Methods Research (10-15篇)
6. Machine Learning (5-10篇)

---

## APPENDICES (在线附录)

### Appendix A: 访谈协议
### Appendix B: 12维行为向量的详细定义
### Appendix C: 编码手册（Coding Manual）
### Appendix D: 完整的混淆矩阵
### Appendix E: 补充统计分析

---

## 表格清单（Tables）

| 表号 | 标题 | 位置 |
|------|------|------|
| Table 1 | 6种Patterns的对比 | Section 4.0 |
| Table 2 | 12维行为向量定义 | Section 3.3 |
| Table 3 | Pattern切换统计 | Section 5.2 |
| Table 4 | Baseline稳定性分析 | Section 5.3 |
| Table 5 | 情境触发因素回归 | Section 5.4 |
| Table 6 | 模型预测准确率对比 | Section 6.2 |
| Table 7 | 理论贡献总结 | Section 6.3 |

---

## 图表清单（Figures）

| 图号 | 标题 | 位置 |
|------|------|------|
| Figure 1 | 研究框架图 | Section 1.3 |
| Figure 2 | 混合方法设计流程 | Section 3.1 |
| Figure 3 | 6种Patterns的3D分布 | Section 5.1 |
| Figure 4 | Pattern切换桑基图 | Section 5.2 |
| Figure 5 | Baseline稳定曲线 | Section 5.3 |
| Figure 6 | Contextual Pattern Switching Model | Section 6.2 |
| Figure 7 | Trait-State框架图 | Section 6.3 |

---

## 写作风格建议（MISQ规范）

### 语言风格
- ✅ 理论驱动，而非现象堆砌
- ✅ 每段都要有topic sentence
- ✅ 避免过多技术细节（算法放附录）
- ✅ 强调"为什么"而非"怎么做"

### 论证逻辑
- ✅ 文献→Gap→我们的方案→验证→贡献
- ✅ 每个发现都要有理论解释
- ✅ 定性和定量证据互相支撑

### MISQ特殊要求
- ✅ 管理启示（Managerial Implications）必须有
- ✅ 理论贡献要与主流理论对话
- ✅ 方法论严谨性（信效度、饱和度）
- ✅ 局限性要诚实且具体

---

**预计完成时间：** 2-3个月（首稿）
**目标篇幅：** 45-50页（不含附录）
**投稿目标：** MISQ或Information Systems Research

---

## 下一步行动

1. ✅ 补充文献综述（目前约30篇，需增至80+）
2. ✅ 深化每个Pattern的案例描述（2-3段→1-2页）
3. ✅ 完成Theory Building章节的数学建模
4. ✅ 准备所有表格和图表
5. ✅ 撰写Introduction的开场故事

**我可以帮你：**
- 起草开场故事（compelling opening）
- 补充文献清单（按类别）
- 设计Theory Building的可视化
