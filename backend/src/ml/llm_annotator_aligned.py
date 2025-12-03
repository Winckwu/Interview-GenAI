#!/usr/bin/env python3
"""
LLM-based Conversation Annotator (Aligned Version)

Uses Claude/GPT as a judge to annotate conversations with
12-dimensional metacognitive subprocess scores.

KEY CHANGE: Dimensions are now aligned with theoretical framework from interviews.
- P4: Role Definition (was: Problem Decomposition)
- M3: Trust Calibration (was: Integration Effort)

Methodology: LLM-as-a-Judge with theory-aligned dimensions
References:
- Winne & Perry (2000) - Event measures of metacognition
- Azevedo et al. (2010) - Trace data inference
- Veenman et al. (2006) - Multi-method validation

Author: MCA Research Team
Date: 2024-12-03
Version: 2.0 (Aligned)
"""

import os
import sys
import json
import csv
import time
from typing import Dict, List, Optional, Tuple
from collections import defaultdict

# Try to import anthropic first, fall back to openai
try:
    import anthropic
    USE_CLAUDE = True
    client = anthropic.Anthropic(api_key=os.environ.get('ANTHROPIC_API_KEY'))
    MODEL = "claude-sonnet-4-20250514"
except ImportError:
    from openai import OpenAI
    USE_CLAUDE = False
    client = OpenAI(api_key=os.environ.get('OPENAI_API_KEY'))
    MODEL = os.environ.get('AI_MODEL', 'gpt-4o')

# Configuration
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
INPUT_CSV = os.path.join(PROJECT_ROOT, 'docs/interviews/conv_history_active_users.csv')
OUTPUT_CSV = os.path.join(PROJECT_ROOT, 'backend/src/ml/llm_annotated_aligned_v2.csv')
OUTPUT_JSON = os.path.join(PROJECT_ROOT, 'backend/src/ml/llm_annotations_aligned_v2.json')
CHECKPOINT_JSON = os.path.join(PROJECT_ROOT, 'backend/src/ml/annotation_checkpoint_v2.json')

BATCH_SIZE = 10
MAX_RETRIES = 3
RETRY_DELAY = 5

# NEW ALIGNED ANNOTATION PROMPT
ANNOTATION_PROMPT_ALIGNED = """You are an expert in metacognitive assessment and educational psychology.

Your task is to analyze this user's conversation history with an AI tutor and score their metacognitive behaviors across 12 dimensions.

## IMPORTANT: Theory-Aligned Dimensions
These dimensions are derived from qualitative interview research (N=49) and aligned with metacognition theory (Zimmerman 2000, Nelson & Narens 1990).

## Scoring Scale (0-3)
- 0: No evidence of this behavior
- 1: Minimal/weak evidence
- 2: Moderate evidence
- 3: Strong/consistent evidence

## 12 Metacognitive Dimensions (ALIGNED VERSION):

### Planning (P1-P4) - Pre-action cognitive preparation:

- **P1 (Task Understanding & Analysis)**: Does the user demonstrate understanding of the task requirements?
  - 0: Vague, unclear requests ("帮我写个东西")
  - 1: Basic task description ("帮我写一篇AI的文章")
  - 2: Clear requirements with constraints ("写2000字AI伦理文章，面向大学生")
  - 3: Systematic analysis with key elements identified ("核心论点是X，需覆盖隐私、偏见、就业三方面，读者是非技术背景...")
  - Keywords: 需求说明, 背景介绍, 约束条件, 受众定义, 预期产出

- **P2 (Goal Setting)**: Does the user set specific, measurable goals?
  - 0: No clear goal ("帮我改进一下")
  - 1: Vague goal ("让它更好")
  - 2: Specific goal ("把响应时间降到200ms以下")
  - 3: SMART goal - Specific, Measurable, Time-bound ("在保持95%准确率前提下，将响应时间从500ms降至200ms，今天完成")
  - Keywords: 目标是, 希望达到, 成功标准, 验收条件, 具体指标

- **P3 (Strategy Selection & Planning)**: Does the user show strategic thinking?
  - 0: No strategy, direct questioning ("怎么做X？")
  - 1: Implicit simple strategy ("先帮我列个大纲")
  - 2: Explicit multi-step plan ("我打算分三步：1)理清需求 2)设计架构 3)实现代码")
  - 3: Systematic strategy with alternatives ("我的计划是...，如果不行可以尝试...，你觉得合理吗？")
  - Keywords: 计划, 步骤, 先...再..., 策略, 方法, 如果...就...

- **P4 (Role Definition)**: Does the user define AI's role and human-AI boundaries? [CRITICAL - NEW ALIGNMENT]
  - 0: No role definition (just asks questions directly)
  - 1: Implicit role expectation ("帮我检查代码" implies AI as reviewer)
  - 2: Explicit role instruction ("你是资深Python开发者，请从代码质量角度给建议")
  - 3: Systematic role + boundary definition ("你作为技术顾问提供建议，最终决策由我来做。请不要直接改代码，只给建议")
  - Keywords: 你是, 你的角色, 你负责, 我负责, 请不要, 边界, 分工

### Monitoring (M1-M3) - Execution phase tracking:

- **M1 (Process Tracking)**: Does the user track progress and confirm milestones?
  - 0: No tracking, one-shot interaction (single Q&A then leaves)
  - 1: Occasional confirmation ("好的，继续")
  - 2: Stage-wise checking ("第一部分完成了，让我确认一下...好的没问题，进入第二部分")
  - 3: Systematic progress tracking ("目前完成3/5模块，进度60%。第三个有问题需要先解决...")
  - Keywords: 进度, 完成了, 接下来, 目前, 阶段, 检查点, 回顾

- **M2 (Quality Checking)**: Does the user actively check and request modifications?
  - 0: Accepts everything without checking ("好的谢谢" then ends)
  - 1: Occasional modification requests ("这里改一下")
  - 2: Actively points out issues ("第二段逻辑有问题，因为...，请修正")
  - 3: Systematic quality review ("让我逐条检查：1)准确性-有错误... 2)完整性-缺少X 3)逻辑性-有漏洞...")
  - Keywords: 不对, 有问题, 请修改, 检查, 核实, 这里错了, 为什么

- **M3 (Trust Calibration)**: Does the user adjust trust based on context? [CRITICAL - NEW ALIGNMENT]
  - 0: Fixed trust (always trusts OR always distrusts)
  - 1: Occasional trust/doubt expression ("这个我不太确定对不对")
  - 2: Context-sensitive trust adjustment ("代码部分我比较信任你，但这个医学建议我需要再查证")
  - 3: Systematic trust calibration ("事实性问题我会交叉验证，创意建议我更愿意采纳，专业判断我持保留态度")
  - Keywords: 信任, 相信, 怀疑, 不确定, 需要验证, 这个领域你擅长吗

### Evaluation (E1-E3) - Quality judgment:

- **E1 (Quality Evaluation)**: Does the user evaluate output quality?
  - 0: No evaluation expressed
  - 1: Simple good/bad judgment ("不错" / "不行")
  - 2: Reasoned evaluation ("方案不错因为考虑了X和Y，但Z还可以改进")
  - 3: Multi-dimensional systematic assessment ("准确性8/10，完整性7/10，可用性9/10，整体评价...")
  - Keywords: 好, 不好, 评分, 满意, 质量, 达到预期, 符合要求

- **E2 (Risk Assessment)**: Does the user consider potential risks and consequences?
  - 0: No risk awareness (just uses output directly)
  - 1: Implicit risk awareness ("这个应该没问题吧？")
  - 2: Explicit risk identification ("这方案有风险：如果X发生，可能导致Y")
  - 3: Systematic risk assessment ("评估风险：技术风险-低因为...；业务风险-中因为...；缓解措施是...")
  - Keywords: 风险, 问题, 如果出错, 后果, 安全吗, 会不会, 万一

- **E3 (Capability Judgment)**: Does the user understand AI's capability boundaries?
  - 0: No boundary awareness (expects AI to perfectly answer everything)
  - 1: Vague capability awareness ("你能做这个吗？")
  - 2: Clear boundary understanding ("这涉及最新数据，可能超出你的知识范围")
  - 3: Systematic capability mapping ("你擅长代码逻辑，但实时数据和专业判断需要我补充。A部分交给你，B部分我处理")
  - Keywords: 你能, 你擅长, 你的局限, 我自己来, 这个你可能不知道, 知识截止

### Regulation (R1-R2) - Adaptive adjustment:

- **R1 (Strategy Adjustment)**: Does the user adjust strategies based on feedback?
  - 0: No adjustment, repeats same approach
  - 1: Passive adjustment (after AI suggests) ("好的，按你说的方式重新问")
  - 2: Active strategy change ("这个方法效果不好，我换个角度问...")
  - 3: Systematic strategy optimization ("前两次问题是提示词太模糊。我总结了更有效的模式：先背景，再需求，最后约束")
  - Keywords: 换个方式, 重新尝试, 调整, 改变策略, 上次的问题是, 这次我

- **R2 (Tool Switching)**: Does the user flexibly switch tools/methods?
  - 0: Single tool dependence (only uses this one AI)
  - 1: Awareness of alternatives ("也许我应该去Google查一下")
  - 2: Active tool switching ("ChatGPT答得不好，我去问Claude试试" / "让我用代码验证这个结果")
  - 3: Systematic tool combination ("验证流程：1)AI初稿 2)Google Scholar核查 3)专业论坛验证 4)运行测试代码")
  - Keywords: 其他工具, 换一个, 验证, Google, 搜索, 测试, 运行, 对比

## Pattern Classification Rules:
Based on scores, classify into one of these patterns:

- **Pattern A (Strategic Decomposition)**: High P scores (avg ≥ 2.5), especially P3 and P4
- **Pattern B (Iterative Refinement)**: High M scores (avg ≥ 2), especially M1 and M2
- **Pattern C (Moderate Balanced)**: Balanced moderate scores across all dimensions
- **Pattern D (Critical Evaluation)**: High E scores (avg ≥ 2.5), especially E1 and E2
- **Pattern E (Pedagogical Reflection)**: High R scores (avg ≥ 2.5), balanced high P and E
- **Pattern F (Passive Over-Reliance)**: CRITICAL - Low total score (≤15) AND E1 ≤ 1

## CONVERSATION HISTORY TO ANALYZE:

{conversation_history}

## OUTPUT FORMAT:
Respond with ONLY a JSON object (no markdown, no explanation):
{{
  "scores": {{
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
  }},
  "pattern": "<A|B|C|D|E|F>",
  "confidence": <0.0-1.0>,
  "reasoning": "<brief explanation of pattern assignment>"
}}
"""


def load_conversations(csv_path: str) -> Dict[str, List[Dict]]:
    """Load and group conversations by user"""
    print(f"📥 Loading conversations from {csv_path}...")

    user_conversations = defaultdict(list)

    with open(csv_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            user_id = row.get('hash_id', '')
            if user_id:
                user_conversations[user_id].append({
                    'sender': row.get('sender', ''),
                    'text': row.get('text', ''),
                    'timestamp': row.get('timestamp', '')
                })

    print(f"✅ Loaded conversations for {len(user_conversations)} users")
    return dict(user_conversations)


def format_conversation_for_annotation(messages: List[Dict], max_chars: int = 8000) -> str:
    """Format conversation for LLM annotation"""
    formatted = []
    total_chars = 0

    for msg in messages:
        sender = msg.get('sender', 'unknown')
        text = msg.get('text', '')

        if not text.strip():
            continue

        # Truncate long messages
        if len(text) > 500:
            text = text[:500] + "..."

        line = f"[{sender}]: {text}"

        if total_chars + len(line) > max_chars:
            formatted.append("... (conversation truncated)")
            break

        formatted.append(line)
        total_chars += len(line)

    return "\n".join(formatted)


def annotate_with_llm(conversation_text: str) -> Optional[Dict]:
    """Call LLM to annotate conversation"""
    prompt = ANNOTATION_PROMPT_ALIGNED.format(conversation_history=conversation_text)

    for attempt in range(MAX_RETRIES):
        try:
            if USE_CLAUDE:
                response = client.messages.create(
                    model=MODEL,
                    max_tokens=1000,
                    messages=[{"role": "user", "content": prompt}]
                )
                content = response.content[0].text
            else:
                response = client.chat.completions.create(
                    model=MODEL,
                    messages=[{"role": "user", "content": prompt}],
                    max_tokens=1000,
                    temperature=0.1
                )
                content = response.choices[0].message.content

            # Parse JSON response
            content = content.strip()
            if content.startswith("```"):
                content = content.split("```")[1]
                if content.startswith("json"):
                    content = content[4:]

            result = json.loads(content)
            return result

        except json.JSONDecodeError as e:
            print(f"⚠️ JSON parse error (attempt {attempt+1}): {e}")
            if attempt < MAX_RETRIES - 1:
                time.sleep(RETRY_DELAY)
        except Exception as e:
            print(f"⚠️ API error (attempt {attempt+1}): {e}")
            if attempt < MAX_RETRIES - 1:
                time.sleep(RETRY_DELAY)

    return None


def load_checkpoint() -> Dict:
    """Load annotation checkpoint"""
    if os.path.exists(CHECKPOINT_JSON):
        with open(CHECKPOINT_JSON, 'r') as f:
            return json.load(f)
    return {"completed_users": [], "annotations": {}}


def save_checkpoint(checkpoint: Dict):
    """Save annotation checkpoint"""
    with open(CHECKPOINT_JSON, 'w') as f:
        json.dump(checkpoint, f, indent=2)


def main():
    print("=" * 60)
    print("🔄 LLM Annotator (ALIGNED VERSION 2.0)")
    print("=" * 60)
    print("Key changes from v1.0:")
    print("  - P4: Problem Decomposition → Role Definition")
    print("  - M3: Integration Effort → Trust Calibration")
    print("=" * 60)

    # Load conversations
    conversations = load_conversations(INPUT_CSV)

    # Load checkpoint
    checkpoint = load_checkpoint()
    completed_users = set(checkpoint.get("completed_users", []))
    annotations = checkpoint.get("annotations", {})

    # Filter users to annotate
    users_to_annotate = [u for u in conversations.keys() if u not in completed_users]

    print(f"\n📊 Progress: {len(completed_users)}/{len(conversations)} users annotated")
    print(f"📝 Remaining: {len(users_to_annotate)} users")

    if not users_to_annotate:
        print("✅ All users already annotated!")
    else:
        # Annotate remaining users
        for i, user_id in enumerate(users_to_annotate):
            print(f"\n[{i+1}/{len(users_to_annotate)}] Annotating user {user_id[:8]}...")

            # Format conversation
            conv_text = format_conversation_for_annotation(conversations[user_id])

            if len(conv_text) < 50:
                print(f"  ⚠️ Conversation too short, skipping")
                annotations[user_id] = {
                    "scores": {"P1":0,"P2":0,"P3":0,"P4":0,"M1":0,"M2":0,"M3":0,"E1":0,"E2":0,"E3":0,"R1":0,"R2":0},
                    "pattern": "F",
                    "confidence": 0.5,
                    "reasoning": "Conversation too short to analyze"
                }
            else:
                # Call LLM
                result = annotate_with_llm(conv_text)

                if result:
                    annotations[user_id] = result
                    print(f"  ✅ Pattern: {result.get('pattern')} (conf: {result.get('confidence', 0):.2f})")
                else:
                    print(f"  ❌ Annotation failed")
                    annotations[user_id] = {
                        "scores": {"P1":0,"P2":0,"P3":0,"P4":0,"M1":0,"M2":0,"M3":0,"E1":0,"E2":0,"E3":0,"R1":0,"R2":0},
                        "pattern": "F",
                        "confidence": 0.5,
                        "reasoning": "Annotation failed"
                    }

            completed_users.add(user_id)

            # Save checkpoint every BATCH_SIZE users
            if (i + 1) % BATCH_SIZE == 0:
                checkpoint = {"completed_users": list(completed_users), "annotations": annotations}
                save_checkpoint(checkpoint)
                print(f"  💾 Checkpoint saved ({len(completed_users)} users)")

            # Rate limiting
            time.sleep(0.5)

    # Save final results
    print("\n💾 Saving final results...")

    # Save detailed JSON
    with open(OUTPUT_JSON, 'w', encoding='utf-8') as f:
        json.dump(annotations, f, indent=2, ensure_ascii=False)

    # Save CSV for training
    with open(OUTPUT_CSV, 'w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        writer.writerow(['user_id', 'pattern', 'confidence',
                        'p1', 'p2', 'p3', 'p4', 'm1', 'm2', 'm3',
                        'e1', 'e2', 'e3', 'r1', 'r2', 'total_score',
                        'is_mixed_pattern', 'notes'])

        for user_id, ann in annotations.items():
            scores = ann.get('scores', {})
            total = sum(scores.values())
            writer.writerow([
                user_id,
                ann.get('pattern', 'F'),
                ann.get('confidence', 0.5),
                scores.get('P1', 0), scores.get('P2', 0), scores.get('P3', 0), scores.get('P4', 0),
                scores.get('M1', 0), scores.get('M2', 0), scores.get('M3', 0),
                scores.get('E1', 0), scores.get('E2', 0), scores.get('E3', 0),
                scores.get('R1', 0), scores.get('R2', 0),
                total,
                'false',
                f"LLM-annotated-aligned-v2 (confidence: {ann.get('confidence', 0.5)})"
            ])

    print(f"✅ Saved {len(annotations)} annotations to {OUTPUT_CSV}")

    # Print distribution
    pattern_counts = defaultdict(int)
    for ann in annotations.values():
        pattern_counts[ann.get('pattern', 'F')] += 1

    print("\n📊 Pattern Distribution:")
    for pattern in sorted(pattern_counts.keys()):
        count = pattern_counts[pattern]
        pct = count / len(annotations) * 100
        print(f"  Pattern {pattern}: {count} ({pct:.1f}%)")


if __name__ == "__main__":
    main()
