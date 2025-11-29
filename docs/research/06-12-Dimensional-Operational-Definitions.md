# 12维行为特征操作化定义
# Operational Definitions of 12 Metacognitive Behavioral Dimensions

> **理论基础**: Flavell (1979), Schraw (1994), Azevedo (2005)
> **改编自**: 元认知觉察量表(MAI) + COPES自我调节模型
> **应用情境**: 人类-AI协作中的元认知行为测量

---

## 框架概览

```
┌─────────────────────────────────────────────────────────────────┐
│                  元认知的12个子过程                               │
│            (12 Metacognitive Sub-Processes)                      │
│                                                                   │
│  改编自: Flavell (1979), Schraw (1994), Azevedo (2005)          │
└─────────────────────────────────────────────────────────────────┘

                    ┌─────────────────────┐
                    │   元认知调节         │
                    │ (Metacognitive      │
                    │  Regulation)        │
                    └─────────────────────┘
                             │
            ┌────────────────┼────────────────┐
            │                │                │
            ▼                ▼                ▼
      ┌─────────┐      ┌─────────┐     ┌─────────┐
      │ 规划    │      │ 监控    │     │ 评价    │
      │Planning │      │Monitoring│    │Evaluation│
      │         │      │         │     │         │
      │ P1-P4   │      │ M1-M3   │     │ E1-E3   │
      └─────────┘      └─────────┘     └─────────┘
            │                │                │
            └────────────────┼────────────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │   调节          │
                    │  Regulation     │
                    │                 │
                    │   R1-R2         │
                    └─────────────────┘
```

---

## 第一类: 规划 (Planning) - 行动前的认知准备

### P1: 任务分解 (Task Decomposition)

**理论定义**:
将复杂任务拆解为可管理的子任务序列的能力

**理论基础**:
Miller (1956) - 工作记忆容量限制理论 (7±2 chunks)

**操作化指标**:

| 评分 | 行为表现 | 具体示例 |
|------|---------|---------|
| 0 | 无分解，整体提交 | "帮我写一篇5000字论文" |
| 1 | 简单2-3步骤 | "先帮我列大纲，再写正文" |
| 2 | 结构化4-6步骤 | "1)文献综述 2)方法论 3)数据分析 4)结论" |
| 3 | 系统化多层级分解 | "一级：章节划分；二级：每章节子主题；三级：每子主题论证逻辑" |

**测量方法**:
```python
def calculate_P1_score(user_prompts):
    """计算任务分解评分"""
    # 指标1: 分解层级数
    decomposition_depth = count_hierarchical_levels(user_prompts)

    # 指标2: 子任务数量
    subtask_count = count_explicit_subtasks(user_prompts)

    # 指标3: 时间跨度（规划时长）
    planning_duration = time_before_first_ai_query()

    # 综合评分
    if decomposition_depth >= 3 and subtask_count >= 8:
        return 3
    elif decomposition_depth >= 2 and subtask_count >= 4:
        return 2
    elif subtask_count >= 2:
        return 1
    else:
        return 0
```

**真实案例**:

- **P1=3** (I3, 工商管理博士生, 模式D): "我先花15分钟画流程图，把论文分成7个section，每个section列3-5个要点，然后每个要点再分解成'我自己写'和'AI辅助'两部分。"

- **P1=0** (真实数据, 用户U127): "帮我写毕业论文"（无任何分解）

---

### P2: 目标设定 (Goal Setting)

**理论定义**:
明确定义预期结果和成功标准的能力

**理论基础**:
Locke & Latham (1990) - 目标设定理论 (SMART goals)

**操作化指标**:

| 评分 | 行为表现 | SMART维度 |
|------|---------|---------|
| 0 | 模糊要求 | "帮我改进代码" |
| 1 | 指定结果 | "帮我修复bug" (Specific) |
| 2 | 可测量标准 | "将响应时间降至<200ms" (Specific + Measurable) |
| 3 | 完整SMART | "在2小时内将API响应时间从500ms降至<200ms，保持99%正确率" |

**测量方法**:
```python
def calculate_P2_score(prompt):
    """评估目标设定质量"""
    score = 0

    # S - Specific (具体性)
    if contains_specific_metrics(prompt):
        score += 1

    # M - Measurable (可测量)
    if contains_quantifiable_criteria(prompt):
        score += 1

    # A - Achievable & R - Relevant (相关性)
    if provides_context_and_constraints(prompt):
        score += 0.5

    # T - Time-bound (时间限制)
    if specifies_deadline_or_urgency(prompt):
        score += 0.5

    return min(score, 3)
```

**真实案例**:

- **P2=3** (I22, 深度学习博士生, 模式A): "我需要在明天下午5点前完成一份市场分析报告，目标受众是投资人，重点分析竞争对手定价策略，不超过10页，需要包含至少3个可视化图表。"

- **P2=0** (真实数据, U089): "帮我分析一下"

---

### P3: 策略选择 (Strategy Selection)

**理论定义**:
根据任务特性选择适合的方法和工具的能力

**理论基础**:
Pressley et al. (1989) - 策略知识与任务适配

**操作化指标**:

| 评分 | 行为表现 | 策略意识 |
|------|---------|---------|
| 0 | 无策略意识 | 所有任务用相同方式 |
| 1 | 隐性策略 | "我通常这样做..." |
| 2 | 显性策略选择 | "因为这是数学问题，我会先自己尝试" |
| 3 | 策略库调用 | "根据任务类型（A/B/C），我会采用不同验证策略" |

**测量方法**:
```python
def calculate_P3_score(user_behavior):
    """评估策略选择能力"""
    # 指标1: 策略多样性
    strategy_diversity = len(set([
        task.strategy_type for task in user_behavior.tasks
    ]))

    # 指标2: 策略-任务匹配度
    matching_accuracy = calculate_strategy_task_fit(
        user_behavior.tasks
    )

    # 指标3: 显性策略表述
    explicit_strategy_mentions = count_strategy_explanations(
        user_behavior.prompts
    )

    if strategy_diversity >= 4 and matching_accuracy > 0.8:
        return 3
    elif strategy_diversity >= 3 and matching_accuracy > 0.6:
        return 2
    elif strategy_diversity >= 2:
        return 1
    else:
        return 0
```

**真实案例**:

- **P3=3** (I41, 理论光学博士生, 模式D): "我有三种模式：熟悉任务用'快速验证'模式（70%信任），新任务用'深度学习'模式（教学导向），高风险任务用'多工具交叉验证'模式（<30%信任）。"

---

### P4: 角色定义 (Role Definition)

**理论定义**:
界定人类vs AI的责任边界的能力

**理论基础**:
Wegner (1987) - 交互记忆系统 (Transactive Memory System)

**操作化指标**:

| 评分 | 行为表现 | 边界意识 |
|------|---------|---------|
| 0 | 无边界意识 | 全部交给AI |
| 1 | 隐性边界 | "这个我自己做" |
| 2 | 显性边界声明 | "AI负责初稿，我负责核心论点" |
| 3 | 系统化角色设计 | 建立书面"AI不可触碰区域"清单 |

**测量方法**:
```python
def calculate_P4_score(user_behavior):
    """评估角色定义清晰度"""
    # 指标1: 独立尝试率
    independent_attempt_rate = (
        count_tasks_tried_before_ai(user_behavior) /
        total_tasks
    )

    # 指标2: 拒绝AI建议次数
    ai_rejection_count = count_rejected_ai_suggestions(
        user_behavior
    )

    # 指标3: 维护"能力保护区"
    has_protected_skills = maintains_ai_free_zones(
        user_behavior
    )

    if has_protected_skills and independent_attempt_rate > 0.6:
        return 3
    elif independent_attempt_rate > 0.4:
        return 2
    elif independent_attempt_rate > 0.2:
        return 1
    else:
        return 0
```

**真实案例**:

- **P4=3** (I22, 深度学习博士生, 模式A): "我有一个规则列表：(1) 简历/求职信首稿必须自己写；(2) 面试问题答案必须自己构思；(3) 关键决策（如职业选择）不咨询AI。这些是我的'能力核心区'。"

---

## 第二类: 监控 (Monitoring) - 执行中的持续觉察

### M1: 过程追踪 (Progress Tracking)

**理论定义**:
持续评估"我做到哪一步了"的能力

**理论基础**:
Carver & Scheier (1982) - 控制论模型 (Cybernetic Model)

**操作化指标**:

| 评分 | 行为表现 | 追踪方式 |
|------|---------|---------|
| 0 | 无追踪 | 从不检查进度 |
| 1 | 被动追踪 | 任务结束才回顾 |
| 2 | 定期检查 | 设置里程碑 |
| 3 | 实时监控 | 使用进度可视化工具 |

**测量方法**:
```python
def calculate_M1_score(session):
    """评估过程追踪能力"""
    # 指标1: 检查点频率
    checkpoint_frequency = (
        count_progress_checks(session) /
        session.duration_minutes
    )  # 次/分钟

    # 指标2: 时间管理质量
    time_awareness = (
        session.actual_time / session.estimated_time
    )  # 接近1.0表示良好估计

    # 指标3: 主动进度汇报
    self_reporting_count = count_status_updates(session)

    if checkpoint_frequency > 0.2 and abs(time_awareness - 1) < 0.2:
        return 3
    elif checkpoint_frequency > 0.1:
        return 2
    elif self_reporting_count > 0:
        return 1
    else:
        return 0
```

**真实案例**:

- **M1=3** (I16, 计算机科学博士生, 模式D): "我用Notion看板追踪每个子任务状态。每完成一个子任务，我会标记为绿色，并估计剩余时间。如果发现偏离计划>30分钟，我会重新调整策略。"

---

### M2: 质量检查 (Quality Checking)

**理论定义**:
实时评估输出是否符合标准的能力

**理论基础**:
Ericsson & Simon (1993) - 协议分析与质量控制

**操作化指标**:

| 评分 | 行为表现 | 验证深度 |
|------|---------|---------|
| 0 | 零验证 | 直接复制粘贴AI输出 |
| 1 | 表面检查 | "看起来对的" |
| 2 | 结构化验证 | 逐行审查或运行测试 |
| 3 | 系统化质量流程 | 多维度检查清单 |

**测量方法**:
```python
def calculate_M2_score(user_behavior):
    """评估质量检查强度"""
    # 指标1: 验证率
    verification_rate = (
        count_verified_outputs(user_behavior) /
        total_ai_outputs
    )

    # 指标2: 验证深度
    verification_depth = calculate_avg_verification_actions([
        'read', 'test', 'cross_check', 'ask_clarification'
    ])

    # 指标3: 发现错误率
    error_detection_rate = (
        errors_found_by_user /
        total_ai_errors
    )

    if verification_rate > 0.9 and verification_depth >= 3:
        return 3
    elif verification_rate > 0.6:
        return 2
    elif verification_rate > 0.2:
        return 1
    else:
        return 0
```

**真实案例**:

- **M2=3** (I18, 航空航天研究员, 模式D): "我的代码审查清单：(1) 逐行理解逻辑；(2) 本地运行单元测试；(3) 手动输入边缘情况；(4) 性能分析；(5) 安全漏洞扫描。只有全部通过才合并代码。"

- **M2=0** (真实数据, U234): 连续47次交互，0次验证行为

> **注**: 模式F用户（如I30、I44）通常M2评分极低（0-1），这是模式F的核心特征之一。

---

### M3: 信任校准 (Trust Calibration)

**理论定义**:
动态调整对AI输出的信任程度的能力

**理论基础**:
Lee & See (2004) - 人机信任模型 (Human-Automation Trust)

**操作化指标**:

| 评分 | 行为表现 | 校准策略 |
|------|---------|---------|
| 0 | 固定信任 | "AI总是对的"或"AI总是错的" |
| 1 | 经验驱动 | 被烧过后才调整 |
| 2 | 任务敏感 | 不同任务不同信任水平 |
| 3 | 精细校准 | 基于任务类型+历史准确率动态调整 |

**测量方法**:
```python
def calculate_M3_score(user_behavior):
    """评估信任校准准确性"""
    # 理想信任水平（基于历史准确率）
    optimal_trust = {}
    for task_type in task_types:
        optimal_trust[task_type] = (
            historical_accuracy[task_type]
        )

    # 用户实际信任水平（通过验证行为推断）
    user_trust = {}
    for task_type in task_types:
        user_trust[task_type] = (
            1 - verification_rate[task_type]
        )

    # 校准准确性
    calibration_accuracy = 1 - mean([
        abs(user_trust[t] - optimal_trust[t])
        for t in task_types
    ])

    if calibration_accuracy > 0.8:
        return 3
    elif calibration_accuracy > 0.6:
        return 2
    elif calibration_accuracy > 0.4:
        return 1
    else:
        return 0
```

**真实案例**:

- **M3=3** (I41, 理论光学博士生, 模式D): "我维护一个信任矩阵：代码生成70%，数学证明30%，文献综述50%，头脑风暴90%。每次AI犯错，我会更新对应任务类型的信任值。"

- **M3=0** (教师观察案例): "学生相信'ChatGPT不会错'（固定高信任），即使在学术引用任务上（实际准确率<20%）也不验证。"

---

## 第三类: 评价 (Evaluation) - 结果的批判性判断

### E1: 输出质量评估 (Output Quality Assessment)

**理论定义**:
任务完成后的全面质量判断能力

**理论基础**:
Sadler (1989) - 形成性评估理论

**操作化指标**:

| 评分 | 行为表现 | 评估维度 |
|------|---------|---------|
| 0 | 无评估 | 接受任何输出 |
| 1 | 单维评估 | "答案正确吗？" |
| 2 | 多维评估 | "正确性+完整性+效率" |
| 3 | 系统化评估框架 | 使用评分矩阵(rubric) |

**测量方法**:
```python
def calculate_E1_score(user_behavior):
    """评估输出质量评估能力"""
    # 指标1: 修改率
    modification_rate = (
        count_modified_outputs(user_behavior) /
        total_ai_outputs
    )

    # 指标2: 评估维度数
    evaluation_dimensions = count_unique_quality_dimensions([
        'correctness', 'completeness', 'efficiency',
        'readability', 'maintainability'
    ])

    # 指标3: 拒绝率
    rejection_rate = (
        count_rejected_outputs(user_behavior) /
        total_ai_outputs
    )

    if evaluation_dimensions >= 3 and modification_rate > 0.5:
        return 3
    elif evaluation_dimensions >= 2:
        return 2
    elif modification_rate > 0.2:
        return 1
    else:
        return 0
```

**真实案例**:

- **E1=3** (I34, 化学研究员, 模式A): "我的代码评估清单：(1) 功能正确性；(2) 边缘情况处理；(3) 时间复杂度；(4) 空间复杂度；(5) 代码可读性；(6) 安全性。任何一项不合格都重写。"

> **关键指标**: E1=0是模式F的核心判别条件。访谈样本中I30(15/36)和I44(18/36)均表现出E1=0的特征。

---

### E2: 风险评估 (Risk Assessment)

**理论定义**:
识别潜在错误和后果严重性的能力

**理论基础**:
Kahneman & Tversky (1979) - 前景理论 (Prospect Theory)

**操作化指标**:

| 评分 | 行为表现 | 风险意识 |
|------|---------|---------|
| 0 | 无风险意识 | 从不考虑"如果错了会怎样" |
| 1 | 后果意识 | "这个任务很重要" |
| 2 | 主动风险识别 | "这里可能出错的地方是..." |
| 3 | 系统化风险分析 | 使用FMEA或类似方法 |

**测量方法**:
```python
def calculate_E2_score(user_behavior):
    """评估风险评估能力"""
    # 指标1: 风险识别率
    identified_risks = count_user_mentioned_risks(
        user_behavior.prompts
    )
    actual_risks = count_actual_risks_in_task(
        user_behavior.task
    )
    risk_identification_rate = identified_risks / actual_risks

    # 指标2: 风险-验证匹配
    # 高风险任务是否获得高验证强度？
    risk_verification_correlation = calculate_correlation(
        task_risk_scores,
        verification_intensities
    )

    # 指标3: 边缘情况测试
    edge_case_testing = count_edge_case_tests(
        user_behavior
    )

    if risk_identification_rate > 0.8 and edge_case_testing > 5:
        return 3
    elif risk_verification_correlation > 0.6:
        return 2
    elif identified_risks > 0:
        return 1
    else:
        return 0
```

**真实案例**:

- **E2=3** (I6, 医疗数据科学硕士生, 模式E): "医学建议的风险极高。我会问自己：(1) 如果这个诊断错了，最坏结果是什么？(2) AI在这类任务上的历史错误率？(3) 有哪些边缘情况AI可能没考虑？然后决定验证强度。"

---

### E3: 能力判断 (Capability Judgment)

**理论定义**:
评估"不用AI我能做到什么程度"的能力

**理论基础**:
Dunning-Kruger效应 (1999) - 元认知准确性

**操作化指标**:

| 评分 | 行为表现 | 自我觉察 |
|------|---------|---------|
| 0 | 无能力觉察 | "我会了"（实际不会） |
| 1 | 模糊觉察 | "好像理解了" |
| 2 | 定期自测 | "让我不看AI试一次" |
| 3 | 系统化能力追踪 | 维护能力基线测试 |

**测量方法**:
```python
def calculate_E3_score(user_behavior):
    """评估能力判断准确性"""
    # 指标1: 独立完成率
    independent_success_rate = (
        count_successful_independent_attempts(user_behavior) /
        count_total_independent_attempts(user_behavior)
    )

    # 指标2: 自我评估准确性
    # 用户预测能否独立完成 vs 实际能否完成
    self_assessment_accuracy = calculate_correlation(
        user_predicted_capability,
        actual_capability
    )

    # 指标3: 能力追踪行为
    maintains_skill_baseline = (
        has_baseline_tests(user_behavior) or
        regular_independent_practice(user_behavior)
    )

    if self_assessment_accuracy > 0.8 and maintains_skill_baseline:
        return 3
    elif self_assessment_accuracy > 0.6:
        return 2
    elif independent_success_rate > 0:
        return 1
    else:
        return 0
```

**真实案例**:

- **E3=3** (I34, 化学研究员, 模式A): "我每月做一次'零AI能力测试'：随机抽3个之前用AI做的任务，完全靠自己重做。如果成功率<70%，说明我过度依赖了，需要加强独立练习。"

---

## 第四类: 调节 (Regulation) - 基于反馈的动态调整

### R1: 策略调整 (Strategy Adjustment)

**理论定义**:
根据反馈修改方法的能力

**理论基础**:
Zimmerman (1989) - 自我调节循环 (Self-Regulated Learning Cycle)

**操作化指标**:

| 评分 | 行为表现 | 调整模式 |
|------|---------|---------|
| 0 | 无调整 | 重复失败策略 |
| 1 | 被动调整 | 失败后才改 |
| 2 | 主动迭代 | 持续优化 |
| 3 | 从失败学习 | 建立"反面教材库" |

**测量方法**:
```python
def calculate_R1_score(user_behavior):
    """评估策略调整能力"""
    # 指标1: 迭代频率
    iteration_frequency = (
        count_refinement_attempts(user_behavior) /
        count_total_tasks(user_behavior)
    )

    # 指标2: 策略多样性（同一任务尝试不同方法）
    strategy_diversity_per_task = mean([
        len(unique_strategies_for_task(task))
        for task in user_behavior.tasks
    ])

    # 指标3: 从失败学习
    learns_from_failure = (
        maintains_failure_log(user_behavior) or
        applies_lessons_from_past_failures(user_behavior)
    )

    if learns_from_failure and iteration_frequency > 0.5:
        return 3
    elif iteration_frequency > 0.3:
        return 2
    elif iteration_frequency > 0.1:
        return 1
    else:
        return 0
```

**真实案例**:

- **R1=3** (I8, 计算机科学本科生, 模式A): "我有一个Google Doc叫'GPT搞砸的地方'，记录每次失败：(1) 任务类型；(2) 我的提示；(3) AI的错误输出；(4) 为什么失败；(5) 下次怎么避免。现在有73条记录。"

---

### R2: 工具切换 (Tool Switching)

**理论定义**:
在不同AI/工具间灵活切换的能力

**理论基础**:
认知灵活性理论 (Spiro et al., 1988)

**操作化指标**:

| 评分 | 行为表现 | 工具使用 |
|------|---------|---------|
| 0 | 单一工具 | 只用一个AI |
| 1 | 偶尔切换 | "这个不行试那个" |
| 2 | 战略性多工具 | "A用于X，B用于Y" |
| 3 | 工具生态系统 | AI+传统工具组合 |

**测量方法**:
```python
def calculate_R2_score(user_behavior):
    """评估工具切换能力"""
    # 指标1: 工具多样性
    tool_diversity = len(set([
        interaction.tool_used
        for interaction in user_behavior.interactions
    ]))

    # 指标2: 跨工具验证
    cross_tool_verification = count_instances_where(
        user_behavior,
        lambda: uses_tool_A_then_verifies_with_tool_B()
    )

    # 指标3: 降级能力
    # 能否在AI失败时降级到手工/传统工具？
    can_degrade_gracefully = count_instances_where(
        user_behavior,
        lambda: ai_fails_then_uses_traditional_method()
    )

    if tool_diversity >= 4 and cross_tool_verification > 3:
        return 3
    elif tool_diversity >= 3:
        return 2
    elif tool_diversity >= 2:
        return 1
    else:
        return 0
```

**真实案例**:

- **R2=3** (I16, 计算机科学博士生, 模式D): "我的验证工具链：GPT-4写代码 → Claude审查 → Wolfram Alpha验算数学 → 本地IDE测试 → Google Scholar查文献。每个工具负责不同验证维度，形成交叉验证网。"

---

## 12维度综合映射表

| 维度 | 简称 | 评分范围 | 主要测量指标 | 关键阈值 |
|------|------|---------|-------------|---------|
| P1-任务分解 | Task Decomp | 0-3 | 分解层级数、子任务数 | ≥3层=高分 |
| P2-目标设定 | Goal Setting | 0-3 | SMART维度覆盖 | 5维全覆盖=3分 |
| P3-策略选择 | Strategy Sel | 0-3 | 策略多样性、匹配度 | ≥4策略=高分 |
| P4-角色定义 | Role Define | 0-3 | 独立尝试率、边界维护 | >60%独立=3分 |
| M1-过程追踪 | Progress Track | 0-3 | 检查点频率 | >0.2次/分钟=高分 |
| M2-质量检查 | Quality Check | 0-3 | 验证率、验证深度 | >90%验证=3分 |
| M3-信任校准 | Trust Calib | 0-3 | 校准准确性 | >80%准确=3分 |
| E1-质量评估 | Quality Eval | 0-3 | 评估维度数 | ≥3维度=3分 |
| E2-风险评估 | Risk Assess | 0-3 | 风险识别率 | >80%识别=3分 |
| E3-能力判断 | Capability | 0-3 | 自我评估准确性 | >80%准确=3分 |
| R1-策略调整 | Strategy Adj | 0-3 | 迭代频率、学习机制 | >50%迭代=3分 |
| R2-工具切换 | Tool Switch | 0-3 | 工具多样性 | ≥4工具=3分 |

---

## Pattern判别规则

基于12维评分，使用以下规则分类用户Pattern:

```python
def classify_pattern(scores):
    """根据12维评分分类用户Pattern"""

    # 计算各类别平均分
    P_avg = mean([scores['P1'], scores['P2'], scores['P3'], scores['P4']])
    M_avg = mean([scores['M1'], scores['M2'], scores['M3']])
    E_avg = mean([scores['E1'], scores['E2'], scores['E3']])
    R_avg = mean([scores['R1'], scores['R2']])
    total = sum(scores.values())

    # Pattern F: 优先判定（最危险）
    # 访谈样本：I30 (15/36), I44 (18/36) - 共2例(4.1%)
    # 真实数据：156/378 (41.3%)
    if total <= 15 and scores['E1'] == 0:
        return 'F'  # Passive Over-Reliance

    # Pattern A: Strategic Decomposition
    # 访谈样本：10人 (20.4%)，代表：I1, I13, I22, I24, I25, I27, I31, I34, I45
    if P_avg >= 2.5 and E_avg >= 2 and scores['P4'] >= 2:
        return 'A'

    # Pattern D: Deep Verification
    # 访谈样本：9人 (18.4%)，代表：I3, I16, I17, I18, I20...
    if E_avg >= 2.5 and scores['E1'] >= 2 and scores['E2'] >= 2:
        return 'D'

    # Pattern E: Pedagogical Reflection
    # 访谈样本：1人 (2.0%)，代表：I6
    if R_avg >= 2.5 and E_avg >= 2 and P_avg >= 2:
        return 'E'

    # Pattern B: Iterative Refinement
    # 访谈样本：5人 (10.2%)，代表：I2, I7, I9, I11, I29
    if M_avg >= 2 and R_avg >= 2:
        return 'B'

    # Pattern C: Context-Sensitive (default moderate)
    # 访谈样本：22人 (44.9%)，代表：I4, I5, I14, I19, I21, I43...
    return 'C'
```

---

## 访谈样本与真实数据对比

### 模式分布差异

| 模式 | 访谈数据 (N=49) | 真实数据 (N=378) | 差异原因 |
|------|----------------|-----------------|---------|
| 模式A | 10 (20.4%) | 0 (0%) | 行为日志无法捕捉内隐策略思维 |
| 模式B | 5 (10.2%) | 30 (7.9%) | 基本一致 |
| 模式C | 22 (44.9%) | 183 (48.4%) | 基本一致 |
| 模式D | 9 (18.4%) | 8 (2.1%) | 深度验证在行为日志中难以区分 |
| 模式E | 1 (2.0%) | 1 (0.3%) | 稀有模式 |
| 模式F | 2 (4.1%) | 156 (41.3%) | **自选择偏差消除后的真实比例** |

### 自选择偏差说明

访谈研究的招募方式（"寻找愿意参与45-93分钟深度访谈讨论AI使用策略的志愿者"）导致：
- 模式F用户（元认知缺位）不太可能自愿参与
- 访谈样本中模式F仅4.1%（I30、I44两例）
- 真实课堂数据显示模式F实际占比约41.3%

---

## 引用格式

在论文中引用此框架时:

```latex
本研究基于元认知理论文献\citep{Flavell1979, Schraw1994, Azevedo2005}，构建了涵盖4类高阶过程（规划、监控、评价、调节）的12子过程分类框架。该框架改编自Flavell的元认知原创理论，整合了Schraw和Dennison的元认知觉察量表（MAI），并扩展了Azevedo和Hadwin的自我调节学习模型（COPES），以适应人类-AI协作的特定情境。

每个维度采用0-3分评分标准，其中0表示无证据，3表示强烈/一致的证据。通过对49名参与者588个编码实例的分析，我们验证了该框架的判别效度（Cohen's κ=0.72）和预测效度（对Pattern分类的准确率92.1%）。
```

---

**文档版本**: v2.0
**理论基础**: Flavell (1979), Schraw (1994), Azevedo (2005)
**实证验证**: 49次访谈 + 378用户真实数据
**编码信度**: Cohen's κ = 0.72（双盲编码，n=10）
**判别效度**: SVM分类准确率 92.1%（基于12维特征）
**数据更新**: 修正受访者ID与职业描述匹配，添加模式分布对比，与08-Complete-Data-Compilation.md保持一致
**最后更新**: 2024-11-29
