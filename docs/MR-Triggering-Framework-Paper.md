# Adaptive Meta-Requirement Intervention Framework: A User-Pattern-Driven Approach to Supporting Human-AI Collaborative Metacognition

## Abstract

This paper presents an adaptive intervention framework for triggering Meta-Requirement (MR) tools in human-AI collaborative systems. Drawing from qualitative analysis of 49 semi-structured interviews with GenAI users across diverse domains, we identify six distinct user behavioral patterns (including a high-risk passive over-reliance pattern) and propose a pattern-aware triggering mechanism that dynamically activates appropriate metacognitive support tools. Our framework maps 12 metacognitive subprocesses derived from self-regulated learning theory to 19 MR intervention tools, establishing evidence-based trigger conditions that account for individual differences in user expertise, task characteristics, and interaction context. The proposed approach addresses the limitation of one-size-fits-all intervention strategies by tailoring support to user-specific metacognitive profiles.

**Keywords:** Human-AI Interaction, Metacognition, Adaptive Intervention, Self-Regulated Learning, GenAI, Large Language Models

---

## 1. Introduction

### 1.1 Background and Motivation

The rapid adoption of Generative AI (GenAI) tools has transformed knowledge work across domains, yet users exhibit substantial variation in their ability to effectively collaborate with AI systems (Tankelevitch et al., 2024). While prior research has identified metacognitive skills as critical for successful human-AI collaboration (Vaccaro et al., 2024), existing systems typically employ static intervention strategies that fail to account for individual differences in user expertise and behavioral patterns.

Our formative research with 49 GenAI users revealed a striking heterogeneity: total metacognitive competency scores ranged from 15 to 33 out of 36 (a 2.2× difference), with users clustering into six distinct behavioral patterns—including a high-risk "passive over-reliance" pattern requiring intensive intervention. This variance suggests that uniform intervention approaches may either overwhelm expert users with unnecessary prompts or provide insufficient support for novices and at-risk users.

### 1.2 Research Questions

This work addresses the following research questions:

**RQ1:** How can we systematically map user metacognitive behaviors to appropriate intervention tools?

**RQ2:** What trigger conditions optimize intervention effectiveness while minimizing user fatigue?

**RQ3:** How should intervention strategies adapt to different user behavioral patterns?

### 1.3 Contributions

This paper makes three primary contributions:

1. **Empirical mapping** between 12 metacognitive subprocesses from self-regulated learning theory and 19 Meta-Requirement intervention tools, grounded in qualitative interview data.

2. **Pattern-aware triggering framework** that differentiates intervention strategies based on six empirically-derived user behavioral patterns, including risk-based classification.

3. **Evidence-based trigger conditions** for each MR tool, with priority calculations that incorporate user profile, task characteristics, and interaction context.

---

## 2. Related Work

### 2.1 Metacognition in Human-AI Collaboration

Metacognition—the awareness and regulation of one's cognitive processes—has been identified as essential for effective AI tool use (Tankelevitch et al., 2024). Zimmerman's (2002) self-regulated learning framework provides a theoretical foundation, decomposing metacognition into planning, monitoring, evaluation, and regulation phases. Recent HCI research has begun applying these frameworks to human-AI interaction contexts (Gajos & Mamykina, 2022).

### 2.2 Adaptive Intervention Systems

Adaptive learning systems have long employed user modeling to personalize instructional content (Brusilovsky & Millán, 2007). However, existing approaches in AI-assisted tools typically rely on simple heuristics (e.g., error frequency) rather than comprehensive metacognitive profiling. Our work extends this tradition by developing multi-dimensional user models that capture distinct behavioral patterns.

### 2.3 Trust Calibration in AI Systems

Appropriate trust calibration is critical for effective human-AI collaboration (Lee & See, 2004). Users who over-trust AI may accept erroneous outputs, while those who under-trust may fail to leverage AI capabilities effectively. Our framework incorporates trust dynamics as a key factor in intervention triggering.

---

## 3. Methodology

### 3.1 Interview Study Design

We conducted semi-structured interviews with 49 participants recruited through purposive sampling to ensure diversity across:

- **Educational level:** Undergraduate (n=6), Master's (n=8), Doctoral/Postdoctoral (n=18), Professionals (n=17)
- **Domain:** STEM research (n=15), Business/Management (n=12), Humanities (n=8), Healthcare (n=5), Other (n=9)
- **GenAI experience:** 6 months to 3+ years of regular use

Interviews lasted 45-90 minutes and focused on high-risk task scenarios where metacognitive engagement was most salient.

### 3.2 Qualitative Analysis Framework

Following constructivist grounded theory methodology (Charmaz, 2014), we developed a coding framework comprising 12 metacognitive subprocesses organized into four phases:

**Planning Phase (P):**
- P1: Task Decomposition
- P2: Goal Setting
- P3: Strategy Selection
- P4: Resource Planning

**Monitoring Phase (M):**
- M1: Progress Monitoring
- M2: Quality Checking
- M3: Context Monitoring

**Evaluation Phase (E):**
- E1: Result Evaluation
- E2: Learning Reflection
- E3: Capability Judgment

**Regulation Phase (R):**
- R1: Strategy Adjustment
- R2: Trust Calibration

Each subprocess was scored 0-3 based on behavioral evidence, yielding total scores of 0-36.

### 3.3 Pattern Identification

Through iterative analysis and Bayesian+SVM classification, we identified six distinct behavioral patterns based on subprocess score distributions and characteristic behaviors:

| Pattern | Description | Prevalence | Defining Characteristics | Risk Level |
|---------|-------------|------------|-------------------------|------------|
| **A** | Strategic Decomposition & Control | 37% | P1≥2, M2≥2, E3≥2, Total≥24 | Low |
| **B** | Iterative Optimization | 16% | R1≥2, Total≥20 | Low |
| **C** | Context-Sensitive Adaptation | 29% | P3≥2, M3≥2, R2≥2, Total≥22 | Low |
| **D** | Deep Verification | 16% | M2=3, E1≥2, Total≥20 | Low |
| **E** | Learning-Oriented | 2% | E1+E2+E3≥6 | Low |
| **F** | Passive Over-Reliance | — | Total<15 OR (E2=0 AND Total<20) | **HIGH** |

**Note on Pattern F:** This high-risk pattern represents users who exhibit minimal metacognitive engagement with AI outputs. These users accept AI responses uncritically, demonstrate near-zero reflection depth (E2=0), and score significantly below average on overall metacognitive measures. Pattern F users require intensive intervention to prevent automation complacency and skill degradation.

---

## 4. MR-Subprocess Mapping Framework

### 4.1 Theoretical Foundation

We mapped the 12 metacognitive subprocesses to 19 Meta-Requirement intervention tools based on functional alignment and interview evidence. Table 1 presents the complete mapping with supporting evidence.

**Table 1: Subprocess-MR Mapping with Interview Evidence**

| Subprocess | Primary MR Tool(s) | Secondary MR Tool(s) | Evidence from Interviews |
|------------|-------------------|---------------------|-------------------------|
| P1 Task Decomposition | MR1-TaskDecomposition | - | I001: "一段一段输入"; I049: "Essay→Paragraphs→Sentences" hierarchical decomposition |
| P2 Goal Setting | MR4-RoleDefinition | MR2-Transparency | I001: "保证中心思想...要保持不变"; I019: Stakeholder context framework |
| P3 Strategy Selection | MR6-CrossModel, MR15-Strategies | MR5-Iteration | I016: "GPT + Claude + Gemini" strategic selection; I006: Prompt library building |
| P4 Resource Planning | MR10-CostBenefit | MR3-Agency | I001: "前期工作自己做好"; I034: Architecture-level preparation |
| M1 Progress Monitoring | MR17-Metrics | - | I011: "3448次迭代" tracking; I049: Context degradation awareness |
| M2 Quality Checking | MR11-Verification | MR6-CrossModel | I001: "逐字逐句对比"; I016: "两个AI左右脑互补" cross-validation |
| M3 Context Monitoring | MR8-Recognition, MR3-Agency | MR4-RoleDefinition | I004: "100页核心 vs 30页不重要" task differentiation |
| E1 Result Evaluation | MR12-CriticalThinking | MR13-Uncertainty | I034: "If it can argue with me" epistemological testing |
| E2 Learning Reflection | MR14-Reflection, MR7-FailureTolerance | MR19-Assessment | I006: "之前有过教训" explicit learning; I038: Trust cycle learning |
| E3 Capability Judgment | MR13-Uncertainty, MR8-Recognition | MR9-TrustCalibration | I001: "AI会偷懒...处理能力有限"; I018: Quantified 40-60% trust |
| R1 Strategy Adjustment | MR5-Iteration | MR15-Strategies | I002: "3-4次之后才能运行"; I011: 3448 iterations |
| R2 Trust Calibration | MR9-TrustCalibration, MR16/18-Warnings | - | I038: 20%→80%→20% trust cycle; I034: Constant 50% trust |

### 4.2 Mapping Validation

The mapping was validated through:

1. **Inter-rater reliability:** Two researchers independently mapped subprocesses to MR tools, achieving Cohen's κ = 0.82.
2. **Member checking:** Five interview participants reviewed mappings for face validity.
3. **Theoretical consistency:** Mappings were verified against self-regulated learning literature.

---

## 5. Pattern-Aware Triggering Framework

### 5.1 Framework Architecture

Our triggering framework operates on three levels:

1. **User Profile Layer:** Maintains pattern classification and subprocess scores
2. **Context Layer:** Captures current task characteristics and interaction state
3. **Trigger Engine:** Evaluates conditions and calculates intervention priorities

```
┌─────────────────────────────────────────────────────────────────┐
│                    Trigger Decision Engine                       │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐ │
│  │ User Profile│  │   Context   │  │    Trigger Conditions   │ │
│  │   Layer     │  │    Layer    │  │    & Priority Calc      │ │
│  ├─────────────┤  ├─────────────┤  ├─────────────────────────┤ │
│  │ • Pattern   │  │ • Task Type │  │ • Base Priority         │ │
│  │ • P1-R2     │  │ • Criticality│ │ • Pattern Adjustment    │ │
│  │   Scores    │  │ • Trust Score│ │ • Subprocess Adjustment │ │
│  │ • History   │  │ • Message   │  │ • Context Adjustment    │ │
│  │             │  │   Features  │  │ • Fatigue Control       │ │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              ↓
                    MR Tool Recommendations
                    (Max 3 per AI message)
```

### 5.2 User Profile Model

The user profile captures both static pattern classification and dynamic behavioral indicators:

```
UserProfile = {
  pattern: Pattern ∈ {A, B, C, D, E, F, Unknown},  // F = High-Risk Passive Over-Reliance
  subprocessScores: {P1..P4, M1..M3, E1..E3, R1, R2} ∈ [0,3]¹²,
  behavioralIndicators: {
    iterationCount: ℕ,           // Current task iterations
    verificationRate: [0,1],     // Historical verification frequency
    trustHistory: [0,100]*,      // Trust score trajectory
    avgSessionLength: ℕ,         // Minutes
    toolEngagementRate: [0,1]    // MR tool interaction frequency
  }
}
```

### 5.3 Context Model

The context model captures task-level and message-level features:

```
InteractionContext = {
  // Task-level
  taskType: TaskType,
  taskCriticality: {low, medium, high},
  taskComplexity: {low, medium, high},
  isNewTaskType: Boolean,

  // Message-level
  messageLength: ℕ,
  containsCode: Boolean,
  containsDecisions: Boolean,
  uncertaintyIndicators: ℕ,

  // Session-level
  trustScore: [0,100],
  consecutiveUnverified: ℕ,
  messageIndex: ℕ,
  sessionDuration: ℕ,
  previousMRsShown: Set<MRType>
}
```

---

## 6. Evidence-Based Trigger Conditions

### 6.1 Trigger Condition Design Principles

Based on our interview analysis, we established five design principles:

**Principle 1: Pattern Differentiation**
> Different user patterns require fundamentally different intervention strategies. Pattern A users (37%) demonstrate strong self-regulation and require minimal prompting, while Pattern B users (16%) benefit from iteration support tools.

*Evidence:* I001 (Pattern A, P1=3) spontaneously decomposes tasks ("一段一段"), making MR1-Decomposition redundant. In contrast, I007 (Pattern B, P1=2) would benefit from decomposition scaffolding.

**Principle 2: Subprocess-Adjusted Priority**
> Users with high subprocess scores in a domain need lower intervention priority for corresponding MR tools, as they already exhibit the target behavior.

*Evidence:* I016 (M2=3) already performs systematic cross-validation ("两个AI左右脑互补"). Triggering MR11-Verification would be redundant; instead, MR6-CrossModel tools should be enhanced.

**Principle 3: Behavioral Evidence Over Assumptions**
> Trigger conditions should be based on observable behaviors (iteration count, verification actions) rather than assumed needs.

*Evidence:* I038's trust evolution (20%→80%→20%) demonstrates that trust is dynamic and experience-dependent, requiring adaptive rather than static triggers.

**Principle 4: Expert User Respect**
> High-scoring users (Pattern A, D) should receive fewer interventions to avoid disruption of effective workflows.

*Evidence:* I034 (33/36, Pattern A) maintains constant 50% trust through architectural understanding. Frequent trust calibration prompts would be counterproductive.

**Principle 5: Safety-First for Warnings**
> Security and risk warnings (MR16, MR18) should trigger unconditionally when risks are detected, regardless of user pattern.

*Evidence:* I016's dangerous command scenario demonstrates that even expert users (Pattern D) benefit from safety checks for high-risk operations.

### 6.2 Complete Trigger Condition Specification

**Table 2: MR Tool Trigger Conditions with Priority Formulas**

| MR Tool | Trigger Condition | Priority Formula | Pattern Modifiers |
|---------|-------------------|------------------|-------------------|
| **MR1-Decomposition** | `(taskComplexity=high ∨ msgLength>1500) ∧ P1<3` | `60 + (3-P1)×15` | A: -20, B: +10 |
| **MR2-Transparency** | `(isNewUser ∨ familiarity=unfamiliar) ∧ E3<2` | `40 + (2-E3)×20` | D: -15 |
| **MR3-Agency** | `(aiSuggestsAction ∨ containsDecisions) ∧ pattern≠A` | `50 + decisionCount×10` | A: skip |
| **MR4-RoleDefinition** | `(isNewSession ∧ taskTypeChanged) ∨ pattern=C` | `45 + M3×5` | C: +15 |
| **MR5-Iteration** | `(iterationCount≥2 ∨ modified) ∧ R1≥2` | `55 + R1×10` | B: +20 |
| **MR6-CrossModel** | `pattern=D ∨ (trustScore<45 ∧ criticality=high)` | `65 + (pattern=D?20:0)` | D: +20 |
| **MR7-FailureTolerance** | `(hasFailedBefore ∨ trustDecline>20%) ∧ E2≥2` | `50 + E2×15` | E: +15 |
| **MR8-Recognition** | `(pattern=C ∨ taskTypeNew) ∧ M3≥2` | `55 + M3×10` | C: +10 |
| **MR9-TrustCalibration** | `(trustChange>15% ∨ R2≥2) ∧ msgIndex≥3` | `50 + R2×10` | D: +10 |
| **MR10-CostBenefit** | `(criticality=high ∨ irreversibleAction) ∧ P4<2` | `60 + risk×15` | A: -10 |
| **MR11-Verification** | `(M2<2 ∧ unverified≥2) ∨ criticality=high` | `70 + (3-M2)×10` | D: -15 (already verifies) |
| **MR12-CriticalThinking** | `(trustScore<50 ∨ controversialClaim) ∧ E1≥2` | `65 + E1×10` | D: +10 |
| **MR13-Uncertainty** | `(hasUncertainty ∨ aiConfidence<0.5) ∧ E3≥2` | `75 + uncertaintyCount×5` | - |
| **MR14-Reflection** | `(msgIndex mod 3 = 0) ∧ pattern≠A` | `45 - (pattern=A?15:0)` | A: skip, E: +15 |
| **MR15-Strategies** | `pattern=E ∨ (E2≥2 ∧ sessionDuration>15)` | `35 + E2×15` | E: +25 |
| **MR16-Warning** | `riskDetected ∨ securityConcern` | `90` (unconditional) | - |
| **MR17-Metrics** | `(pattern=B ∧ iterationCount≥3) ∨ sessionComplete` | `40 + M1×10` | B: +15 |
| **MR18-OverReliance** | `unverifiedConsecutive≥4 ∧ M2<2` | `70 + (5-consecutive)×5` | - |
| **MR19-Assessment** | `(sessionEnding ∨ milestone) ∧ E1+E2+E3≥5` | `45 + totalE×5` | E: +10 |

### 6.3 Pattern-Specific Strategy Profiles

**Table 3: Intervention Strategy by User Pattern**

| Pattern | Core MR Tools | Suppressed MR Tools | Rationale |
|---------|--------------|---------------------|-----------|
| **A** (Strategic Control) | MR11, MR5 | MR1, MR14, MR3 | Already decomposes; needs iteration support for exploration |
| **B** (Iterative) | MR5, MR17, MR1 | - | Core behavior is iteration; needs decomposition to reduce cycles |
| **C** (Context-Adaptive) | MR8, MR4, MR9 | - | Strengthen context recognition; support role switching |
| **D** (Deep Verification) | MR6, MR12, MR7 | MR11 | Already verifies; enhance multi-model and critical thinking |
| **E** (Learning-Oriented) | MR15, MR14, MR19 | - | Support explicit learning and metacognitive development |

---

## 7. Implementation Considerations

### 7.1 Priority Calculation Algorithm

```
function calculateMRPriority(mr: MRType, user: UserProfile, ctx: Context): Priority {
  // 1. Check trigger condition
  if (!evaluateTriggerCondition(mr, user, ctx)) {
    return { shouldTrigger: false, priority: 0 }
  }

  // 2. Calculate base priority
  let priority = BASE_PRIORITY[mr]

  // 3. Apply subprocess adjustment
  priority += calculateSubprocessAdjustment(mr, user.subprocessScores)

  // 4. Apply pattern modifier
  priority += PATTERN_MODIFIERS[user.pattern][mr] ?? 0

  // 5. Apply context adjustment
  priority += calculateContextAdjustment(mr, ctx)

  // 6. Apply fatigue control
  if (ctx.previousMRsShown.has(mr)) {
    priority -= 30  // Reduce priority if recently shown
  }

  // 7. Clamp to valid range
  priority = clamp(priority, 0, 100)

  return {
    shouldTrigger: priority >= THRESHOLD,
    priority: priority,
    reason: generateReason(mr, user, ctx)
  }
}
```

### 7.2 Display Strategy

To prevent intervention fatigue, we implement the following constraints:

1. **Maximum interventions per message:** 3 MR tools
2. **Selection method:** Top 3 by priority score
3. **Cooldown period:** Same MR tool cannot appear within 5 consecutive messages
4. **Category limits:** Maximum 2 verification-type MRs, 1 reflection-type MR per message
5. **Safety override:** Warning MRs (MR16, MR18) bypass all limits

### 7.3 User Profile Initialization and Update

**Initial Profile (New Users):**
- Pattern: Unknown
- All subprocess scores: 2 (neutral)
- Behavioral indicators: Default values

**Profile Update Triggers:**
- After MR19-Assessment completion: Full profile recalculation
- After 10 interactions: Pattern re-classification based on behavioral evidence
- Continuous: Behavioral indicators updated per interaction

---

## 8. Discussion

### 8.1 Theoretical Implications

Our framework extends self-regulated learning theory to the human-AI collaboration context by demonstrating that metacognitive support must account for individual differences. The six-pattern taxonomy—with explicit identification of high-risk passive over-reliance behaviors—provides a parsimonious yet descriptive model of user variation that can inform future intervention design and safety considerations.

### 8.2 Design Implications

**For Researchers:**
- User pattern classification should precede intervention design
- Subprocess-level measurement enables fine-grained personalization
- Trust dynamics require longitudinal tracking, not point-in-time assessment

**For Practitioners:**
- Avoid one-size-fits-all intervention strategies
- Respect expert users by reducing intervention frequency
- Prioritize safety warnings unconditionally

### 8.3 Limitations

1. **Sample composition:** Our interview cohort skewed toward academic users; generalizability to other populations requires validation.
2. **Pattern stability:** We assume patterns are relatively stable; longitudinal studies are needed to assess pattern evolution.
3. **Trigger threshold tuning:** Optimal threshold values require empirical calibration through deployment studies.

### 8.4 Future Work

1. Longitudinal deployment study to validate trigger effectiveness
2. Machine learning approaches to automatic pattern classification
3. Extension to collaborative (multi-user) AI interaction contexts

---

## 9. Conclusion

This paper presents an adaptive Meta-Requirement intervention framework grounded in empirical analysis of 49 GenAI user interviews. By mapping metacognitive subprocesses to intervention tools and developing pattern-aware trigger conditions, we address the limitation of uniform intervention strategies. Our framework provides a principled approach to personalizing metacognitive support in human-AI collaborative systems, with the goal of enhancing user agency while respecting individual expertise levels.

---

## References

Brusilovsky, P., & Millán, E. (2007). User models for adaptive hypermedia and adaptive educational systems. In *The adaptive web* (pp. 3-53). Springer.

Charmaz, K. (2014). *Constructing grounded theory*. Sage.

Gajos, K. Z., & Mamykina, L. (2022). Do people engage cognitively with AI? Impact of AI assistance on incidental learning. In *Proceedings of the 2022 CHI Conference on Human Factors in Computing Systems* (pp. 1-16).

Lee, J. D., & See, K. A. (2004). Trust in automation: Designing for appropriate reliance. *Human factors*, 46(1), 50-80.

Tankelevitch, L., Kewenig, V., Simkute, A., Scott, A. E., Sarkar, A., Sellen, A., & Rintel, S. (2024). The metacognitive demands and opportunities of generative AI. In *Proceedings of the 2024 CHI Conference on Human Factors in Computing Systems* (pp. 1-24).

Vaccaro, K., Agarwal, D., Gundugola, R., Srinivasan, A., & Gilbert, E. (2024). Investigating How AI Assistance Affects Trust and Reliance in Human-AI Collaboration. In *Proceedings of the 2024 ACM Conference on Computer-Supported Cooperative Work*.

Zimmerman, B. J. (2002). Becoming a self-regulated learner: An overview. *Theory into practice*, 41(2), 64-70.

---

## Appendix A: Complete Subprocess Scoring Rubric

| Score | Criteria | Example Evidence |
|-------|----------|------------------|
| 0 | No evidence of subprocess | No mention of decomposition, verification, etc. |
| 1 | Minimal/reactive evidence | "边做边改" (edit while doing) - brief mention |
| 2 | Moderate/consistent evidence | "重复2-3次确认" - verification habit but not systematic |
| 3 | Strong/systematic evidence | "逐字逐句对比" - systematic, cross-context behavior |

## Appendix B: Pattern Classification Decision Tree

```
START
  │
  ├─ Total Score ≥ 24?
  │   ├─ YES: Check Pattern A conditions
  │   │   └─ P1≥2 ∧ M2≥2 ∧ E3≥2? → Pattern A
  │   └─ NO: Continue
  │
  ├─ M2 = 3 ∧ E1 ≥ 2 ∧ Total ≥ 20?
  │   └─ YES → Pattern D
  │
  ├─ E1+E2+E3 ≥ 6?
  │   └─ YES → Pattern E
  │
  ├─ P3≥2 ∧ M3≥2 ∧ R2≥2 ∧ Total ≥ 22?
  │   └─ YES → Pattern C
  │
  ├─ R1 ≥ 2 ∧ Total ≥ 20?
  │   └─ YES → Pattern B
  │
  └─ DEFAULT → Pattern C (most common fallback)
```

## Appendix C: Interview Evidence Summary by MR Tool

| MR Tool | Supporting Interview Cases | Key Quotes |
|---------|---------------------------|------------|
| MR1 | I001, I013, I049 | "一段一段输入" (I001); "发散-收敛模型" (I013) |
| MR5 | I002, I007, I011 | "3-4次之后才能运行" (I002); "3448次迭代" (I011) |
| MR6 | I016, I018, I019 | "两个AI左右脑互补" (I016); "Multi-model cherry-picking" (I018) |
| MR9 | I038, I034 | "20%→80%→20%" trust cycle (I038); "Constant 50%" (I034) |
| MR11 | I001, I016, I017 | "逐字逐句对比" (I001); "双重验证+三角验证" (I017) |
| MR14 | I006, I038 | "之前有过教训" (I006); "Revert to old way" (I038) |
| MR15 | I006 | "专门的文档去记录一些我常用的提示符" (I006) |
