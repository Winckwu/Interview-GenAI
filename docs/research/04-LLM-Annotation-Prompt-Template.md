# LLM标注Prompt模板
# LLM Annotation Prompt Template

> **用途**: 使用GPT-4作为裁判，对用户对话历史进行12维元认知行为评分
> **方法学**: LLM-as-a-Judge
> **模型**: GPT-4 或 Claude Sonnet
> **输出**: 12维评分 + Pattern分类 (A-F)

---

## 完整Prompt模板

```
You are an expert in metacognitive assessment and educational psychology.

Your task is to analyze this user's conversation history with an AI tutor and score their metacognitive behaviors across 12 dimensions.

## Scoring Scale (0-3)
- 0: No evidence of this behavior
- 1: Minimal/weak evidence
- 2: Moderate evidence
- 3: Strong/consistent evidence

## 12 Metacognitive Dimensions to Score:

### Planning (P1-P4):
- **P1 (Input Complexity)**: Does the user provide detailed, well-structured inputs?
  - 0: Very short/vague inputs (<30 chars average)
  - 1: Brief inputs with basic information
  - 2: Moderate detail with some context
  - 3: Rich, detailed inputs with clear problem statements

- **P2 (Question Quality)**: Does the user ask thoughtful, specific questions?
  - 0: No real questions, just copy-paste requests
  - 1: Simple "how to" questions
  - 2: Questions showing some thought (why, compare, explain)
  - 3: Deep, analytical questions showing critical thinking

- **P3 (Context Provision)**: Does the user provide relevant background/context?
  - 0: No context provided
  - 1: Minimal context
  - 2: Some relevant background
  - 3: Rich context including constraints, goals, prior attempts

- **P4 (Problem Decomposition)**: Does the user break down complex problems?
  - 0: Treats everything as single monolithic requests
  - 1: Occasional simple breakdowns
  - 2: Attempts to structure problems
  - 3: Systematically decomposes into sub-problems

### Monitoring (M1-M3):
- **M1 (Iteration Frequency)**: Does the user iterate and refine?
  - 0: Single request, accepts first answer
  - 1: Rare follow-ups
  - 2: Some iteration based on results
  - 3: Active refinement cycle

- **M2 (Output Customization)**: Does the user request modifications?
  - 0: Accepts everything as-is
  - 1: Rare modification requests
  - 2: Sometimes asks for adjustments
  - 3: Actively shapes outputs to needs

- **M3 (Integration Effort)**: Does the user synthesize information?
  - 0: No evidence of connecting information
  - 1: Basic acknowledgment
  - 2: Some attempts to relate concepts
  - 3: Active synthesis and connection-making

### Evaluation (E1-E3):
- **E1 (Verification Behavior)**: Does the user verify AI outputs?
  - 0: Zero verification attempts (CRITICAL - Pattern F indicator)
  - 1: Occasional checking
  - 2: Regular verification attempts
  - 3: Systematic verification

- **E2 (Critical Evaluation)**: Does the user critically assess responses?
  - 0: Blind acceptance
  - 1: Rare questioning
  - 2: Some critical comments
  - 3: Active critical evaluation

- **E3 (External Reference)**: Does the user mention external sources?
  - 0: No references to external material
  - 1: Rare mentions
  - 2: Sometimes references
  - 3: Regular integration of external knowledge

### Regulation (R1-R2):
- **R1 (Self-Reflection)**: Does the user reflect on their understanding?
  - 0: No reflection visible
  - 1: Minimal ("I see")
  - 2: Some reflection on learning
  - 3: Deep reflection on understanding

- **R2 (Learning Indication)**: Does the user show learning progress?
  - 0: No learning signals
  - 1: Passive acceptance
  - 2: Some gratitude/understanding
  - 3: Clear learning and application

## Pattern Classification Rules:
Based on the scores, classify into one of these patterns:

- **Pattern A (Strategic Decomposition)**: High P scores (avg ≥ 2.5), High E scores (avg ≥ 2)
- **Pattern B (Iterative Refinement)**: High M scores (avg ≥ 2), Moderate E scores
- **Pattern C (Moderate Balanced)**: Balanced moderate scores across all dimensions
- **Pattern D (Critical Evaluation)**: High E scores (avg ≥ 2.5), especially E1 and E2
- **Pattern E (Pedagogical Reflection)**: High R scores (avg ≥ 2.5), balanced high P and E
- **Pattern F (Passive Over-Reliance)**: CRITICAL - Low total score (≤15) AND E1 = 0

## CONVERSATION HISTORY TO ANALYZE:

{conversation_history}

## OUTPUT FORMAT:
Respond with ONLY a JSON object (no markdown, no explanation):
{
  "scores": {
    "P1": <0-3>,
    "P2": <0-3>,
    "P3": <0-3>,
    "P4": <0-3>,
    "M1": <0-3>,
    "M2": <0-3>,
    "M3": <0-3>,
    "E1": <0-3>,
    "E2": <0-3>,
    "E3": <0-3>,
    "R1": <0-3>,
    "R2": <0-3>
  },
  "pattern": "<A|B|C|D|E|F>",
  "confidence": <0.0-1.0>,
  "reasoning": "<brief explanation for pattern classification>"
}
```

---

## 使用示例 (Usage Example)

### 输入对话历史格式

```
[USER]: 我需要写一个Python函数来计算斐波那契数列，要求时间复杂度O(n)，并且能处理大数。我之前尝试用递归但太慢了。

[ASSISTANT]: 我可以帮你实现一个线性时间复杂度的版本。使用动态规划方法...

[USER]: 这个实现很好，但是能否添加缓存机制以支持重复查询？另外，我担心大数时的内存问题，能否用生成器实现？

[ASSISTANT]: 当然可以。我们可以使用Python的functools.lru_cache装饰器...

[USER]: 等等，让我先理解一下为什么lru_cache在这里有效。它是如何减少时间复杂度的？能否给我解释一下缓存的工作原理？
```

### LLM输出示例

```json
{
  "scores": {
    "P1": 3,  // 详细输入，包含约束条件
    "P2": 3,  // 深度问题："为什么lru_cache有效"
    "P3": 3,  // 提供先前尝试的背景
    "P4": 2,  // 将问题分解为性能和内存两方面
    "M1": 3,  // 主动迭代优化方案
    "M2": 3,  // 请求添加缓存和生成器
    "M3": 2,  // 尝试理解缓存机制
    "E1": 2,  // 暂停并验证理解
    "E2": 3,  // 批判性提问："为什么有效？"
    "E3": 1,  // 提到之前尝试递归
    "R1": 3,  // "让我先理解"显示元认知觉察
    "R2": 2   // 从失败(递归太慢)中学习
  },
  "pattern": "E",
  "confidence": 0.85,
  "reasoning": "High R scores (R1=3, R2=2) combined with learning-oriented questions ('为什么有效', '解释原理') and reflective pauses ('让我先理解') indicate Pattern E: Pedagogical Reflection. User treats AI as teaching tool rather than just task completion."
}
```

---

## 实施细节 (Implementation Details)

### Python实现示例

```python
from openai import OpenAI

client = OpenAI(api_key=os.environ.get('OPENAI_API_KEY'))
MODEL = 'gpt-4o'  # 使用GPT-4获得更好的标注质量

def annotate_conversation(conversation_history: str) -> dict:
    """使用LLM标注用户对话的元认知行为"""

    prompt = ANNOTATION_PROMPT.format(
        conversation_history=conversation_history
    )

    response = client.chat.completions.create(
        model=MODEL,
        messages=[
            {
                "role": "system",
                "content": "You are an expert metacognitive assessment specialist. Respond only with valid JSON."
            },
            {
                "role": "user",
                "content": prompt
            }
        ],
        temperature=0.3,  # 较低温度以保持一致性
        max_tokens=500,
        response_format={"type": "json_object"}
    )

    result = json.loads(response.choices[0].message.content)
    return result
```

### 质量控制

**1. 温度设置**: 0.3（低温度保证评分一致性）

**2. 重试机制**: 最多3次重试以处理JSON解析错误

**3. 验证步骤**:
```python
# 验证输出结构
assert 'scores' in result
assert 'pattern' in result
assert len(result['scores']) == 12
assert all(0 <= v <= 3 for v in result['scores'].values())
assert result['pattern'] in ['A', 'B', 'C', 'D', 'E', 'F']
```

**4. 批量处理**: 每10个用户保存一次检查点

---

## 方法学说明 (Methodology)

### LLM-as-a-Judge范式

**理论基础**:
- Zheng et al. (2023) - "Judging LLM-as-a-Judge with MT-Bench"
- OpenAI Evals Framework

**优势**:
1. **语义理解**: 捕捉隐含行为（"让我先理解" → 高R1）
2. **上下文感知**: 考虑对话历史和演化
3. **多语言支持**: 处理中英文混合对话
4. **可扩展性**: 可标注大规模数据（378用户）

**局限**:
1. **一致性**: 需要低温度和验证机制
2. **成本**: GPT-4标注378用户约$15-25
3. **黑箱**: 无法完全解释评分逻辑

### 与人工编码的对比

| 方法 | 成本 | 速度 | 一致性 | 覆盖率 |
|------|------|------|--------|--------|
| 人工编码 | 高 (45-93min/人) | 慢 | Cohen's κ=0.72 | 49人 |
| LLM标注 | 低 ($0.04/人) | 快 (5s/人) | 0.78 (vs人工) | 378人 |

---

## 训练数据生成

使用此Prompt模板，我们生成了两套标注数据：

### 数据源1: 访谈数据 (N=49)

**人工编码结果**（扎根理论分析）:

| Pattern | 数量 | 占比 | 代表性参与者 |
|---------|------|------|-------------|
| 模式A | 10 | 20.4% | I1, I8, I13, I22, I24, I25, I27, I31, I34, I45 |
| 模式B | 5 | 10.2% | I2, I7, I9, I11, I29 |
| 模式C | 22 | 44.9% | I4, I5, I14, I19, I21, I23, I43... |
| 模式D | 9 | 18.4% | I3, I16, I17, I18, I20, I38, I41, I46... |
| 模式E | 1 | 2.0% | I6 |
| 模式F | 2 | 4.1% | I30, I44 |

> **重要说明**: 访谈样本中模式F仅有2例(4.1%)，这是由于访谈研究的自选择偏差——愿意主动参与研究的用户往往具备较高的元认知意识。

### 数据源2: 真实课堂数据 (N=378)

**LLM标注结果**:

| Pattern | 数量 | 占比 | 与访谈对比 |
|---------|------|------|-----------|
| 模式A | 0 | 0% | ⚠️ 消失 (访谈20.4%) |
| 模式B | 30 | 7.9% | ↓2.3pp |
| 模式C | 183 | 48.4% | ↑5.5pp |
| 模式D | 8 | 2.1% | ↓16.3pp |
| 模式E | 1 | 0.3% | ↓1.7pp |
| 模式F | 156 | 41.3% | ⚠️ +37.2pp |

**分布差异解释**:
- **模式A消失**: 真实课堂数据基于行为日志分析，无法识别"高级战略控制"的内在思维过程
- **模式F激增**: 访谈自选择偏差被消除，反映更真实的人口分布（~41.3%）

**输出文件**:
- `llm_annotated_training_data.csv` - 用于SVM训练
- `llm_annotations_detailed.json` - 完整标注结果

**维度平均分** (N=378):
- P维度: 1.8 (规划偏弱)
- M维度: 2.1 (监控中等)
- E维度: 1.3 (评价严重不足 ⚠️)
- R维度: 1.6 (调节偏低)

---

## 双数据源对比分析

### 关键发现

| 指标 | 访谈数据 (N=49) | 真实数据 (N=378) | 差异解释 |
|------|----------------|-----------------|---------|
| 模式F占比 | 4.1% | 41.3% | 自选择偏差 |
| 模式A占比 | 20.4% | 0% | 行为日志无法捕捉内隐策略 |
| 平均E维度 | 2.3 | 1.3 | 访谈用户验证意识更强 |

### 方法学意义

1. **访谈数据**: 适合理论构建，深度理解模式特征
2. **真实数据**: 适合系统训练，反映真实人口分布
3. **互补使用**: 访谈定义模式，真实数据训练分类器

---

## 引用格式 (Citation)

在论文中引用此方法时:

```latex
我们采用LLM-as-a-Judge方法\citep{Zheng2023}，使用GPT-4对378名用户的对话历史进行12维元认知行为标注。具体而言，我们设计了基于Flavell (1979)、Schraw (1994)和Azevedo (2005)元认知理论的结构化prompt，要求模型对每个维度进行0-3分的评分，并根据评分模式分类用户的AI使用Pattern (A-F)。

为保证标注质量，我们：(1) 使用temperature=0.3降低随机性；(2) 要求JSON格式输出并进行结构验证；(3) 在49个人工编码样本上验证，LLM标注与人工编码的一致性达到κ=0.78。
```

---

**文档版本**: v2.0
**对应代码**: `backend/src/ml/llm_conversation_annotator.py`
**生成数据**: 378用户 × 12维度 = 4,536个标注
**总成本**: ~$18.90 (GPT-4o, $0.05/用户)
**标注时间**: 约32分钟（批量处理）
**数据更新**: 访谈数据模式分布修正（模式A: 20.4%, 模式C: 44.9%, 模式F: 4.1%），I43从模式A修正为模式C
**最后更新**: 2024-11-29
