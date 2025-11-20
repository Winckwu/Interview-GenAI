# MCA系统实施路线图（MR1-MR23）

## 项目概况

**总体任务**：实现基于49次深度访谈的23个Meta-Requirements
**已完成**：MR11 (VerificationToolbar), MR13 (UncertaintyIndicator), MR16 (SkillMonitoringDashboard)
**待实现**：20个MRs，分4个阶段

---

## 优先级说明与数据支持

### 为什么按这个顺序？

**关键（Critical）- 解决最普遍的挫折**：
- MR13 (98%用户): "AI假装确定" - 最普遍的挫折
- MR3 (55%用户): 害怕失去控制
- MR23 (35%专业): 隐私完全阻挡

**高优先级（High）- 影响>50%用户**：
- MR1 (45%用户): 分解困难
- MR2 (76%用户): 看不清思考过程
- MR11 (61%用户): 验证工具分散  ✅ DONE
- MR15 (67%用户): 不了解策略
- MR9 (84%用户): 信任水平波动

**中等优先级（Medium）- 增强体验或预防**：
- MR5 (33%用户): 频繁迭代
- MR8 (57%用户): 根据任务调整
- MR12 (49%用户): 需要评估指导

**低优先级（Lower）- 可选优化**：
- MR4, MR6, MR7, MR10, MR17, MR19
- MR18, MR16 ✅ DONE

---

## 分阶段实施计划

### Phase 1: 核心基础（0-4周）

**目标**：解决最普遍的用户挫折，建立信任基础

| MR | 组件名 | 代码量 | 难度 | 已完成 |
|----|--------|--------|------|--------|
| MR1 | TaskDecompositionScaffold | 2000行 | 中 | ❌ |
| MR2 | ProcessTransparency | 2500行 | 中 | ❌ |
| MR3 | HumanAgencyControl | 1500行 | 低 | ❌ |
| MR15 | MetacognitiveStrategyGuide | 1800行 | 低 | ❌ |
| MR11 | VerificationToolbar | 3500行 | 中 | ✅ |
| MR13 | UncertaintyIndicator | 3000行 | 高 | ✅ |

**预计工作量**：80小时

**交付物**：
- 5个新React组件（MR1,2,3,15 + 改进MR13展示）
- 5个demo文件
- 5个QA验证报告
- 1个整合指南

---

### Phase 2: 适应性智能（4-12周）

**目标**：支持多样化使用模式，实现个性化适应

| MR | 组件名 | 代码量 | 难度 | 依赖 |
|----|--------|--------|------|------|
| MR4 | RoleDefinitionGuide | 1200行 | 低 | MR3 |
| MR5 | LowCostIteration | 2800行 | 中 | MR1 |
| MR6 | CrossModelComparison | 3000行 | 中 | MR9 |
| MR8 | TaskCharacteristicDetection | 2500行 | 高 | MR3 |
| MR9 | DynamicTrustCalibration | 2200行 | 高 | MR13 |
| MR12 | CriticalThinkingScaffold | 1800行 | 低 | MR2 |
| MR14 | GuidedReflection | 1600行 | 低 | MR3 |
| MR19 | MetacognitiveAssessment | 2800行 | 高 | MR3,8,9 |

**预计工作量**：120小时

**关键集成点**：
- MR19诊断结果驱动其他组件的自适应
- MR5与MR6互补（版本管理 + 模型选择）
- MR8的任务特征自动加载MR9的信任推荐

---

### Phase 3: 预防性干预（12-20周）

**目标**：防止能力退化，深化元认知发展

| MR | 组件名 | 代码量 | 难度 | 依赖 |
|----|--------|--------|------|------|
| MR7 | FailureLearningSystem | 1400行 | 低 | MR5 |
| MR10 | CostBenefitAnalysis | 1600行 | 低 | MR8 |
| MR16 | SkillAtrophyPrevention | 3500行 | 中 | MR9,15 | ✅ |
| MR17 | LearningVisualization | 2200行 | 中 | MR14,19 |
| MR18 | OverRelianceWarning | 1800行 | 中 | MR19,16 |

**预计工作量**：80小时

**关键集成点**：
- MR16 + MR18并联工作（结果 + 过程检测）
- MR17可视化显示MR14反思的数据
- MR10驱动用户做出"有AI还是无AI"的决策

---

### Phase 4: 企业级隐私（20-32周）

**目标**：解锁专业市场（金融、医疗、法律）

| MR | 组件名 | 代码量 | 难度 | 依赖 |
|----|--------|--------|------|------|
| MR23 | PrivacyArchitecture | 5000行+ | 非常高 | 全部 |

**预计工作量**：200小时

**技术挑战**：
- 本地推理引擎集成（Llama, Mistral）
- 联邦学习框架
- 同态加密原型
- 企业合规认证

**市场潜力**：
- I33（金融）: 无法现在使用
- I17（律师）: 无法现在使用
- I26（医疗）: 无法现在使用
- 这3个加起来代表万亿美元市场

---

## 详细实施计划 - Phase 1 优先序列

### Week 1-2: MR3 + MR15（基础控制和教学）

**MR3: Human Agency Control**
- 干预强度滑块（Passive/Suggestive/Proactive）
- "不使用AI继续"按钮（任何地方都可见）
- "保存纯人工版本"对照选项
- 会话暂停功能
- **工作量**：20小时

**MR15: Metacognitive Strategy Guide**
- 4类策略库（Planning/Monitoring/Evaluation/Regulation）
- Just-in-time提示（检测问题行为）
- 案例库：有效 vs 无效使用
- 支架淡化算法
- **工作量**：25小时

**为什么先做这两个**：
- 不破坏MR13/MR16，可独立开发
- 为其他组件提供基础（控制权 + 教学框架）

---

### Week 2-3: MR1 + MR2（规划透明性）

**MR1: Task Decomposition Scaffold**
- 多维分析引擎（scope/dependencies/verification）
- 自适应支架（能力检测→淡化支持）
- 用户修改界面
- 分解历史追踪
- **工作量**：35小时

**MR2: Process Transparency**
- 版本历史追踪（每个提示周期）
- Git-like差异可视化
- 推理链展示
- 时间线视图
- 导出功能（JSON/Markdown/PDF）
- **工作量**：40小时

**为什么配对**：
- MR1展示"分解是什么"
- MR2显示"分解如何演变"
- 共同支持"理解AI决策"的目标

---

### Week 4: 整合 + 验证 + 文档

- 4个组件的demo文件
- QA验证报告（每个MR）
- Phase 1总体整合指南
- 用户反馈收集

---

## 代码结构标准

### 每个MR的交付物结构

```
/frontend/src/components/
├── MR<N><Name>.tsx                    # 主组件（1500-3500行）
├── MR<N><Name>.css                    # 样式（700-1200行）
├── MR<N><Name>.demo.tsx               # 演示（600-1000行）
└── MR<N><Name>.utils.ts               # 辅助函数（300-500行）

/frontend/docs/
├── MR<N>_Verification.md              # QA报告（400-600行）
├── MR<N>_Design_Rationale.md          # 设计理由（如果复杂）
└── MR<N>_API_Reference.md             # API文档（200-300行）

/backend/ (如需要)
├── mr<N>-models.ts                    # 数据模型
├── mr<N>-logic.ts                     # 业务逻辑
└── mr<N>-tests.spec.ts                # 单元测试
```

### 质量标准

**每个MR必须满足**：
- ✅ 100% TypeScript + 完整类型
- ✅ WCAG 2.1 AA 无障碍
- ✅ 响应式设计（4个断点）
- ✅ 暗模式 + 高对比度
- ✅ 完整demo（3-5个场景）
- ✅ QA验证报告（10+ 项）
- ✅ Git提交（清晰的消息）

---

## 时间表（总计）

| 阶段 | 周数 | 工作时间 | MRs | 交付日期 |
|------|------|---------|-----|---------|
| Phase 1 | 4周 | 80小时 | MR1,2,3,15 + MR11,13 | 2024年12月中 |
| Phase 2 | 8周 | 120小时 | MR4,5,6,8,9,12,14,19 | 2025年2月中 |
| Phase 3 | 8周 | 80小时 | MR7,10,16,17,18 | 2025年4月中 |
| Phase 4 | 12周 | 200小时 | MR23 | 2025年7月中 |
| **总计** | **32周** | **480小时** | **23 MRs** | **2025年7月** |

**假设**：
- 全职开发（每周40小时）
- 包括测试、文档、Git管理
- 不包括团队讨论/反馈轮次

---

## 成功指标 & KPIs

### Phase 1 完成后
- ✅ MR13 用户满意度 +50%
- ✅ MR3 "感到有控制权"评分 >4.5/5
- ✅ MR1 分解采用率 >70%
- ✅ MR2 版本回溯使用率 >30%

### Phase 2 完成后
- ✅ MR9 信任校准准确性 >80%
- ✅ MR19 诊断准确性 >75%
- ✅ 整体用户参与度 +40%
- ✅ 支持多样化使用模式（A-E）

### Phase 3 完成后
- ✅ MR16 技能维持率 >90%
- ✅ MR18 模式F检测率 >85%
- ✅ 长期用户留存率 +60%

### Phase 4 完成后
- ✅ 专业用户采纳率 +300%
- ✅ 企业客户 >50
- ✅ HIPAA/SEC合规认证获得

---

## 资源需求

### 开发
- 1-2名高级React/TypeScript开发者
- 1名后端开发者（特别是Phase 4）
- 设计师（UX/可视化）

### 测试&QA
- 1名QA工程师
- 用户测试小组（5-10名，来自各模式）

### 文档&支持
- 技术文档编写者
- 用户教育/培训

---

## 风险及缓解

### 技术风险

**MR6跨模型API集成复杂性**
- 风险：多API管理和同步
- 缓解：早期原型(Week 8)，如有问题可降级为单模型比较

**MR19诊断准确性**
- 风险：行为数据可能噪声大
- 缓解：混合方法（行为+自我报告+直接测量）

**MR23隐私架构**
- 风险：本地推理性能（慢10-100倍）
- 缓解：分级方案，用户可选云/本地

### 业务风险

**用户采纳**
- 风险：新功能学习曲线陡峭
- 缓解：Just-in-time教学(MR15)，渐进式释放支架

**隐私合规**
- 风险：HIPAA/SEC审批流程长
- 缓解：早期与法律/合规团队协调（Phase 2）

---

## 下一步行动

### 立即（本周）
- [ ] 创建Phase 1的4个MR仓库分支
- [ ] 为MR3准备设计模型和原型
- [ ] 为MR15准备策略库和案例

### 短期（1-2周）
- [ ] 完成MR3原型（干预强度控制）
- [ ] 完成MR15原型（策略教学）
- [ ] 开始MR1设计（分解脚手架）

### 中期（第2-4周）
- [ ] Phase 1 demo和验证
- [ ] 用户测试（小组，3-5人）
- [ ] 反馈迭代

---

## 相关文档

| 文档 | 用途 |
|------|------|
| MR_Design_Rationale.md | 为什么设计每个MR（49访谈证据） |
| 02-19-Meta-Requirements.md | 详细技术规范 |
| llm-coding-results.md | 完整访谈编码 |
| VerificationToolbar_Verification.md | MR11 QA报告 |
| UncertaintyIndicator_Verification.md | MR13 QA报告 |
| SkillMonitoringDashboard_Verification.md | MR16 QA报告 |

---

## FAQ

**Q: 为什么不同时做所有MRs？**
A:
1. 资源限制（1-2开发者）
2. MRs间有依赖关系（Phase 2依赖Phase 1）
3. 渐进式发布获得反馈优于大爆炸发布

**Q: 能否跳过低优先级MRs？**
A:
- 可以：MR4, MR7, MR10可完全跳过（可选增强）
- 不建议：MR16, MR18是预防性的，值得做

**Q: Phase 4成本能降低吗？**
A:
- 本地推理(Phase 2)可减少隐私需求50%
- 可延迟完整同态加密到产品第二版本

**Q: 如何处理用户反馈？**
A:
- Phase 1后收集反馈
- 可延迟Phase 2的1-2个功能基于反馈
- 持续迭代直到满足用户需求

---

**文档作者**：Claude Code
**完成日期**：2024-11-17
**版本**：1.0
