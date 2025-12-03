#!/usr/bin/env python3
"""
Aligned Dimension Scorer

Scores conversations on the 12 aligned metacognitive dimensions using
heuristic analysis based on the theoretical framework.

Key changes from old dimensions:
- P4: Role Definition (was: Problem Decomposition)
- M3: Trust Calibration (was: Integration Effort)

Author: Claude (LLM-based analysis)
Date: 2024-12-03
"""

import csv
import re
import json
from collections import defaultdict
from typing import Dict, List, Tuple

# Input/Output paths
INPUT_CSV = 'docs/interviews/conv_history_active_users.csv'
OUTPUT_CSV = 'backend/src/ml/llm_annotated_aligned_v2.csv'
OUTPUT_JSON = 'backend/src/ml/llm_annotations_aligned_v2_detailed.json'


def load_conversations(csv_path: str) -> Dict[str, List[Dict]]:
    """Load and group conversations by user"""
    user_convs = defaultdict(list)

    with open(csv_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            uid = row.get('hash_id', '')
            if uid:
                user_convs[uid].append({
                    'sender': row.get('sender', ''),
                    'text': row.get('text', '')
                })

    return dict(user_convs)


def get_user_messages(messages: List[Dict]) -> List[str]:
    """Extract only user messages"""
    return [m['text'] for m in messages if m['sender'] == 'user' and m['text'].strip()]


def score_p1_task_understanding(user_msgs: List[str]) -> int:
    """
    P1: Task Understanding & Analysis
    0: Vague, unclear requests
    1: Basic task description
    2: Clear requirements with constraints
    3: Systematic analysis with key elements
    """
    if not user_msgs:
        return 0

    # Analyze message complexity
    avg_len = sum(len(m) for m in user_msgs) / len(user_msgs)

    # Keywords indicating task understanding
    understanding_keywords = [
        '需要', '目标', '要求', '约束', '条件', '背景', '受众', 'requirement',
        'need', 'goal', 'want to', 'should', 'constraint', 'audience'
    ]

    keyword_count = sum(1 for m in user_msgs for kw in understanding_keywords if kw.lower() in m.lower())

    # Detailed explanation patterns
    detailed_patterns = [
        r'首先.*然后', r'第一.*第二', r'包含.*需要', r'面向.*读者',
        r'first.*then', r'step \d', r'1\).*2\)', r'目的是'
    ]
    detail_score = sum(1 for m in user_msgs for p in detailed_patterns if re.search(p, m, re.IGNORECASE))

    if avg_len > 150 and (keyword_count > 5 or detail_score > 2):
        return 3
    elif avg_len > 80 and (keyword_count > 2 or detail_score > 0):
        return 2
    elif avg_len > 30:
        return 1
    else:
        return 0


def score_p2_goal_setting(user_msgs: List[str]) -> int:
    """
    P2: Goal Setting
    0: No clear goal
    1: Vague goal
    2: Specific goal
    3: SMART goal
    """
    if not user_msgs:
        return 0

    # Goal keywords
    goal_keywords = [
        '目标', '希望', '想要', '达到', '实现', '完成', 'goal', 'want', 'achieve',
        'need to', 'should be', '能够', '必须'
    ]

    # Measurable indicators
    measurable_patterns = [
        r'\d+%', r'\d+分钟', r'\d+字', r'\d+ words', r'<\d+', r'>\d+',
        r'\d+ms', r'准确率', r'accuracy', r'deadline', r'截止'
    ]

    goal_mentions = sum(1 for m in user_msgs for kw in goal_keywords if kw.lower() in m.lower())
    measurable = sum(1 for m in user_msgs for p in measurable_patterns if re.search(p, m))

    if measurable > 1 and goal_mentions > 2:
        return 3
    elif measurable > 0 or goal_mentions > 3:
        return 2
    elif goal_mentions > 0:
        return 1
    else:
        return 0


def score_p3_strategy_planning(user_msgs: List[str]) -> int:
    """
    P3: Strategy Selection & Planning
    0: No strategy, direct questioning
    1: Implicit simple strategy
    2: Explicit multi-step plan
    3: Systematic strategy with alternatives
    """
    if not user_msgs:
        return 0

    # Planning keywords
    plan_keywords = [
        '计划', '步骤', '先', '然后', '接着', '最后', '策略', '方法',
        'plan', 'step', 'first', 'then', 'next', 'finally', 'strategy', 'approach'
    ]

    # Multi-step patterns
    step_patterns = [
        r'第[一二三四五]', r'step \d', r'\d\)', r'首先.*其次',
        r'如果.*就', r'if.*then', r'分.*步'
    ]

    # Alternative strategies
    alternative_patterns = [
        r'或者', r'另一个方法', r'也可以', r'alternatively', r'another way',
        r'如果不行', r'备选'
    ]

    plan_mentions = sum(1 for m in user_msgs for kw in plan_keywords if kw.lower() in m.lower())
    step_score = sum(1 for m in user_msgs for p in step_patterns if re.search(p, m))
    alt_score = sum(1 for m in user_msgs for p in alternative_patterns if re.search(p, m, re.IGNORECASE))

    if step_score > 2 and alt_score > 0:
        return 3
    elif step_score > 1 or plan_mentions > 3:
        return 2
    elif plan_mentions > 0:
        return 1
    else:
        return 0


def score_p4_role_definition(user_msgs: List[str]) -> int:
    """
    P4: Role Definition (NEW ALIGNED)
    0: No role definition
    1: Implicit role expectation
    2: Explicit role instruction
    3: Systematic role + boundary definition
    """
    if not user_msgs:
        return 0

    # Role definition keywords
    role_keywords = [
        '你是', '作为', '你的角色', '扮演', '假设你是', 'you are', 'act as',
        'pretend', 'your role', 'as a', '当作'
    ]

    # Boundary keywords
    boundary_keywords = [
        '你负责', '我负责', '不要', '只给', '请不要', '边界', '分工',
        'you handle', 'i will', "don't", 'only', 'your job', 'my job'
    ]

    # Strong role patterns
    role_patterns = [
        r'你是一个.*专家', r'作为.*角色', r'you are a.*expert',
        r'act as a', r'假设你是.*师'
    ]

    role_mentions = sum(1 for m in user_msgs for kw in role_keywords if kw.lower() in m.lower())
    boundary_mentions = sum(1 for m in user_msgs for kw in boundary_keywords if kw.lower() in m.lower())
    role_pattern_score = sum(1 for m in user_msgs for p in role_patterns if re.search(p, m, re.IGNORECASE))

    if role_pattern_score > 0 and boundary_mentions > 0:
        return 3
    elif role_pattern_score > 0 or role_mentions > 2:
        return 2
    elif role_mentions > 0 or boundary_mentions > 0:
        return 1
    else:
        return 0


def score_m1_process_tracking(user_msgs: List[str]) -> int:
    """
    M1: Process Tracking
    0: No tracking, one-shot interaction
    1: Occasional confirmation
    2: Stage-wise checking
    3: Systematic progress tracking
    """
    if not user_msgs:
        return 0

    # Progress keywords
    progress_keywords = [
        '进度', '完成', '接下来', '目前', '阶段', '继续', '下一步',
        'progress', 'done', 'next', 'currently', 'stage', 'continue'
    ]

    # Tracking patterns
    tracking_patterns = [
        r'\d+/\d+', r'第[一二三]部分', r'完成了.*继续', r'step \d',
        r'回顾', r'总结一下', r'review', r'so far'
    ]

    msg_count = len(user_msgs)
    progress_mentions = sum(1 for m in user_msgs for kw in progress_keywords if kw.lower() in m.lower())
    tracking_score = sum(1 for m in user_msgs for p in tracking_patterns if re.search(p, m))

    # Number of interaction turns is also an indicator
    if tracking_score > 2 or (msg_count > 20 and progress_mentions > 3):
        return 3
    elif msg_count > 10 and progress_mentions > 1:
        return 2
    elif msg_count > 3:
        return 1
    else:
        return 0


def score_m2_quality_checking(user_msgs: List[str]) -> int:
    """
    M2: Quality Checking
    0: Accepts everything without checking
    1: Occasional modification requests
    2: Actively points out issues
    3: Systematic quality review
    """
    if not user_msgs:
        return 0

    # Quality check keywords
    check_keywords = [
        '不对', '错了', '有问题', '修改', '改一下', '检查', '核实',
        'wrong', 'error', 'mistake', 'fix', 'change', 'check', 'verify', 'incorrect'
    ]

    # Quality patterns
    quality_patterns = [
        r'这里.*错', r'请修正', r'应该是', r'不是.*而是',
        r'this is wrong', r'should be', r'please fix', r'逐条检查'
    ]

    check_mentions = sum(1 for m in user_msgs for kw in check_keywords if kw.lower() in m.lower())
    quality_score = sum(1 for m in user_msgs for p in quality_patterns if re.search(p, m, re.IGNORECASE))

    if quality_score > 2 or check_mentions > 5:
        return 3
    elif quality_score > 0 or check_mentions > 2:
        return 2
    elif check_mentions > 0:
        return 1
    else:
        return 0


def score_m3_trust_calibration(user_msgs: List[str]) -> int:
    """
    M3: Trust Calibration (NEW ALIGNED)
    0: Fixed trust (always trusts OR always distrusts)
    1: Occasional trust/doubt expression
    2: Context-sensitive trust adjustment
    3: Systematic trust calibration
    """
    if not user_msgs:
        return 0

    # Trust keywords
    trust_keywords = [
        '信任', '相信', '不确定', '怀疑', '验证', '确认', '可靠',
        'trust', 'believe', 'unsure', 'doubt', 'verify', 'confirm', 'reliable'
    ]

    # Context-sensitive trust patterns
    trust_patterns = [
        r'这个.*信任', r'这方面.*不确定', r'需要.*验证', r'我再查一下',
        r'这个领域', r'你擅长', r'你的知识', r"i'll verify", r'double check'
    ]

    # Skepticism patterns
    skeptic_patterns = [
        r'真的吗', r'确定吗', r'有把握吗', r'are you sure', r'is this correct',
        r'让我确认', r'我查一下'
    ]

    trust_mentions = sum(1 for m in user_msgs for kw in trust_keywords if kw.lower() in m.lower())
    trust_score = sum(1 for m in user_msgs for p in trust_patterns if re.search(p, m, re.IGNORECASE))
    skeptic_score = sum(1 for m in user_msgs for p in skeptic_patterns if re.search(p, m, re.IGNORECASE))

    total_trust_behavior = trust_mentions + trust_score + skeptic_score

    if trust_score > 1 and skeptic_score > 0:
        return 3
    elif total_trust_behavior > 3:
        return 2
    elif total_trust_behavior > 0:
        return 1
    else:
        return 0


def score_e1_quality_evaluation(user_msgs: List[str]) -> int:
    """
    E1: Quality Evaluation
    0: No evaluation expressed
    1: Simple good/bad judgment
    2: Reasoned evaluation
    3: Multi-dimensional assessment
    """
    if not user_msgs:
        return 0

    # Evaluation keywords
    eval_keywords = [
        '好', '不好', '可以', '不行', '满意', '质量', '评价', '分数',
        'good', 'bad', 'okay', 'satisfied', 'quality', 'rate', 'score'
    ]

    # Reasoned evaluation patterns
    reason_patterns = [
        r'因为.*所以', r'这个.*好.*因为', r'但是.*可以改进', r'优点.*缺点',
        r'because', r'but.*could be better', r'pros.*cons', r'不错.*但'
    ]

    # Multi-dimensional patterns
    multi_patterns = [
        r'\d+/\d+', r'准确性.*完整性', r'从.*角度', r'第一.*第二',
        r'accuracy.*completeness', r'in terms of'
    ]

    eval_mentions = sum(1 for m in user_msgs for kw in eval_keywords if kw.lower() in m.lower())
    reason_score = sum(1 for m in user_msgs for p in reason_patterns if re.search(p, m, re.IGNORECASE))
    multi_score = sum(1 for m in user_msgs for p in multi_patterns if re.search(p, m))

    if multi_score > 0 or (reason_score > 1 and eval_mentions > 2):
        return 3
    elif reason_score > 0:
        return 2
    elif eval_mentions > 0:
        return 1
    else:
        return 0


def score_e2_risk_assessment(user_msgs: List[str]) -> int:
    """
    E2: Risk Assessment
    0: No risk awareness
    1: Implicit risk awareness
    2: Explicit risk identification
    3: Systematic risk assessment
    """
    if not user_msgs:
        return 0

    # Risk keywords
    risk_keywords = [
        '风险', '问题', '危险', '后果', '安全', '万一', '如果出错',
        'risk', 'problem', 'danger', 'consequence', 'safe', 'what if', 'if wrong'
    ]

    # Risk patterns
    risk_patterns = [
        r'如果.*会', r'万一.*怎么', r'可能.*导致', r'注意.*安全',
        r'if.*might', r'could.*cause', r'be careful', r'潜在'
    ]

    risk_mentions = sum(1 for m in user_msgs for kw in risk_keywords if kw.lower() in m.lower())
    risk_score = sum(1 for m in user_msgs for p in risk_patterns if re.search(p, m, re.IGNORECASE))

    if risk_score > 2 or (risk_mentions > 3 and risk_score > 0):
        return 3
    elif risk_score > 0 or risk_mentions > 1:
        return 2
    elif risk_mentions > 0:
        return 1
    else:
        return 0


def score_e3_capability_judgment(user_msgs: List[str]) -> int:
    """
    E3: Capability Judgment
    0: No boundary awareness
    1: Vague capability awareness
    2: Clear boundary understanding
    3: Systematic capability mapping
    """
    if not user_msgs:
        return 0

    # Capability keywords
    cap_keywords = [
        '你能', '你擅长', '你的局限', '我自己来', '你可能不知道', '知识截止',
        'can you', 'you are good at', 'limitation', "i'll do", "you might not know"
    ]

    # Boundary patterns
    boundary_patterns = [
        r'这个.*超出', r'你的知识.*到', r'最新.*可能不知道', r'这部分.*我来',
        r'beyond your', r'knowledge cutoff', r'this part.*myself'
    ]

    cap_mentions = sum(1 for m in user_msgs for kw in cap_keywords if kw.lower() in m.lower())
    boundary_score = sum(1 for m in user_msgs for p in boundary_patterns if re.search(p, m, re.IGNORECASE))

    if boundary_score > 1 or (cap_mentions > 2 and boundary_score > 0):
        return 3
    elif boundary_score > 0 or cap_mentions > 1:
        return 2
    elif cap_mentions > 0:
        return 1
    else:
        return 0


def score_r1_strategy_adjustment(user_msgs: List[str]) -> int:
    """
    R1: Strategy Adjustment
    0: No adjustment, repeats same approach
    1: Passive adjustment
    2: Active strategy change
    3: Systematic strategy optimization
    """
    if not user_msgs:
        return 0

    # Adjustment keywords
    adj_keywords = [
        '换个方式', '重新', '调整', '改变', '尝试', '另一个方法',
        'try again', 'different', 'adjust', 'change', 'another way'
    ]

    # Active adjustment patterns
    active_patterns = [
        r'上次.*问题', r'这次我', r'换个角度', r'之前.*不好',
        r'last time', r'this time', r'different approach', r'前面.*现在'
    ]

    adj_mentions = sum(1 for m in user_msgs for kw in adj_keywords if kw.lower() in m.lower())
    active_score = sum(1 for m in user_msgs for p in active_patterns if re.search(p, m, re.IGNORECASE))

    if active_score > 1 or (adj_mentions > 2 and active_score > 0):
        return 3
    elif active_score > 0 or adj_mentions > 1:
        return 2
    elif adj_mentions > 0:
        return 1
    else:
        return 0


def score_r2_tool_switching(user_msgs: List[str]) -> int:
    """
    R2: Tool Switching
    0: Single tool dependence
    1: Awareness of alternatives
    2: Active tool switching
    3: Systematic tool combination
    """
    if not user_msgs:
        return 0

    # Tool keywords
    tool_keywords = [
        'google', 'bing', '搜索', '查一下', '其他工具', '测试', '运行代码',
        'search', 'look up', 'other tool', 'test', 'run', 'verify externally'
    ]

    # Tool patterns
    tool_patterns = [
        r'我.*google', r'搜索.*验证', r'运行.*测试', r'其他.*AI',
        r'claude|chatgpt|gpt|文心', r'我去.*查', r"i'll.*search"
    ]

    tool_mentions = sum(1 for m in user_msgs for kw in tool_keywords if kw.lower() in m.lower())
    tool_score = sum(1 for m in user_msgs for p in tool_patterns if re.search(p, m, re.IGNORECASE))

    if tool_score > 2 or (tool_mentions > 3 and tool_score > 0):
        return 3
    elif tool_score > 0 or tool_mentions > 1:
        return 2
    elif tool_mentions > 0:
        return 1
    else:
        return 0


def classify_pattern(scores: Dict[str, int]) -> Tuple[str, float]:
    """Classify into pattern based on scores"""
    p_avg = (scores['P1'] + scores['P2'] + scores['P3'] + scores['P4']) / 4
    m_avg = (scores['M1'] + scores['M2'] + scores['M3']) / 3
    e_avg = (scores['E1'] + scores['E2'] + scores['E3']) / 3
    r_avg = (scores['R1'] + scores['R2']) / 2
    total = sum(scores.values())

    # Pattern F: Passive Over-Reliance (CRITICAL)
    if total <= 15 and scores['E1'] <= 1:
        return 'F', 0.9

    # Pattern A: Strategic Decomposition
    if p_avg >= 2.5 and e_avg >= 2:
        return 'A', 0.85

    # Pattern D: Critical Evaluation
    if e_avg >= 2.5:
        return 'D', 0.85

    # Pattern E: Pedagogical Reflection
    if r_avg >= 2.5 and p_avg >= 2 and e_avg >= 2:
        return 'E', 0.8

    # Pattern B: Iterative Refinement
    if m_avg >= 2:
        return 'B', 0.8

    # Pattern C: Moderate Balanced (default)
    return 'C', 0.7


def score_user(user_msgs: List[str]) -> Dict:
    """Score a single user on all 12 aligned dimensions"""
    scores = {
        'P1': score_p1_task_understanding(user_msgs),
        'P2': score_p2_goal_setting(user_msgs),
        'P3': score_p3_strategy_planning(user_msgs),
        'P4': score_p4_role_definition(user_msgs),
        'M1': score_m1_process_tracking(user_msgs),
        'M2': score_m2_quality_checking(user_msgs),
        'M3': score_m3_trust_calibration(user_msgs),
        'E1': score_e1_quality_evaluation(user_msgs),
        'E2': score_e2_risk_assessment(user_msgs),
        'E3': score_e3_capability_judgment(user_msgs),
        'R1': score_r1_strategy_adjustment(user_msgs),
        'R2': score_r2_tool_switching(user_msgs)
    }

    pattern, confidence = classify_pattern(scores)

    return {
        'scores': scores,
        'pattern': pattern,
        'confidence': confidence,
        'total_score': sum(scores.values())
    }


def main():
    print("=" * 60)
    print("📊 Aligned Dimension Scorer")
    print("=" * 60)

    # Load conversations
    print("Loading conversations...")
    conversations = load_conversations(INPUT_CSV)
    print(f"Loaded {len(conversations)} users")

    # Score all users
    results = {}
    for i, (user_id, messages) in enumerate(conversations.items()):
        user_msgs = get_user_messages(messages)
        result = score_user(user_msgs)
        results[user_id] = result

        if (i + 1) % 50 == 0:
            print(f"Processed {i + 1}/{len(conversations)} users...")

    # Save results
    print(f"\nSaving results to {OUTPUT_CSV}...")

    # CSV output
    with open(OUTPUT_CSV, 'w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        writer.writerow(['user_id', 'pattern', 'confidence',
                        'p1', 'p2', 'p3', 'p4', 'm1', 'm2', 'm3',
                        'e1', 'e2', 'e3', 'r1', 'r2', 'total_score',
                        'is_mixed_pattern', 'notes'])

        for user_id, result in results.items():
            scores = result['scores']
            writer.writerow([
                user_id,
                result['pattern'],
                result['confidence'],
                scores['P1'], scores['P2'], scores['P3'], scores['P4'],
                scores['M1'], scores['M2'], scores['M3'],
                scores['E1'], scores['E2'], scores['E3'],
                scores['R1'], scores['R2'],
                result['total_score'],
                'false',
                'Aligned-v2-heuristic'
            ])

    # JSON output
    with open(OUTPUT_JSON, 'w', encoding='utf-8') as f:
        json.dump(results, f, indent=2, ensure_ascii=False)

    # Statistics
    print("\n📈 Pattern Distribution:")
    pattern_counts = {}
    for result in results.values():
        p = result['pattern']
        pattern_counts[p] = pattern_counts.get(p, 0) + 1

    for pattern in sorted(pattern_counts.keys()):
        count = pattern_counts[pattern]
        pct = count / len(results) * 100
        print(f"  Pattern {pattern}: {count} ({pct:.1f}%)")

    # Dimension statistics
    print("\n📊 Dimension Averages (Aligned):")
    dim_sums = {f'P{i}': 0 for i in range(1, 5)}
    dim_sums.update({f'M{i}': 0 for i in range(1, 4)})
    dim_sums.update({f'E{i}': 0 for i in range(1, 4)})
    dim_sums.update({f'R{i}': 0 for i in range(1, 3)})

    for result in results.values():
        for dim, val in result['scores'].items():
            dim_sums[dim] += val

    n = len(results)
    print(f"  P1 (Task Understanding): {dim_sums['P1']/n:.2f}")
    print(f"  P2 (Goal Setting):       {dim_sums['P2']/n:.2f}")
    print(f"  P3 (Strategy Planning):  {dim_sums['P3']/n:.2f}")
    print(f"  P4 (Role Definition):    {dim_sums['P4']/n:.2f} ← NEW")
    print(f"  M1 (Process Tracking):   {dim_sums['M1']/n:.2f}")
    print(f"  M2 (Quality Checking):   {dim_sums['M2']/n:.2f}")
    print(f"  M3 (Trust Calibration):  {dim_sums['M3']/n:.2f} ← NEW")
    print(f"  E1 (Quality Evaluation): {dim_sums['E1']/n:.2f}")
    print(f"  E2 (Risk Assessment):    {dim_sums['E2']/n:.2f}")
    print(f"  E3 (Capability Judgment):{dim_sums['E3']/n:.2f}")
    print(f"  R1 (Strategy Adjustment):{dim_sums['R1']/n:.2f}")
    print(f"  R2 (Tool Switching):     {dim_sums['R2']/n:.2f}")

    print(f"\n✅ Done! Results saved to {OUTPUT_CSV}")


if __name__ == "__main__":
    main()
