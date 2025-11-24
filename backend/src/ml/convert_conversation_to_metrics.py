"""
Conversation History to 12-Dimension Metrics Converter
======================================================
Converts real conversation history data from conv_history_active_users.csv
to the 12-dimensional metacognitive subprocess metrics format.

Metric Definitions:
- P1-P4 (Perception): Input analysis and initial engagement
- M1-M3 (Modification): How users modify/iterate on AI outputs
- E1-E3 (Evaluation): Verification and validation behaviors
- R1-R2 (Reflection): Metacognitive reflection depth

Each metric is scored 0-3:
- 0: Not observed / Very low
- 1: Low
- 2: Medium
- 3: High

Author: MCA System
Date: 2024-11-24
"""

import csv
import re
from collections import defaultdict
from typing import Dict, List, Tuple
from pathlib import Path

# Keyword patterns for behavior detection
VERIFICATION_KEYWORDS = [
    'is this correct', 'can you check', 'verify', 'are you sure',
    'double check', 'confirm', 'is that right', 'make sure'
]

QUESTION_KEYWORDS = [
    'why', 'how', 'what if', 'explain', 'can you clarify',
    'i don\'t understand', 'could you elaborate', 'what does'
]

MODIFICATION_KEYWORDS = [
    'change', 'modify', 'adjust', 'update', 'revise', 'instead',
    'alternatively', 'try again', 'different', 'another way'
]

REFLECTION_KEYWORDS = [
    'i think', 'i understand', 'so basically', 'in other words',
    'let me try', 'i see', 'that makes sense', 'i realized'
]

CRITICAL_KEYWORDS = [
    'but', 'however', 'actually', 'wait', 'hold on', 'not quite',
    'i disagree', 'that\'s not', 'incorrect'
]


def analyze_conversation(messages: List[Dict]) -> Dict[str, int]:
    """
    Analyze a single conversation and extract 12-dimension metrics.

    Returns metrics dict with p1-p4, m1-m3, e1-e3, r1-r2
    """
    user_messages = [m for m in messages if m['sender'] == 'user']
    ai_messages = [m for m in messages if m['sender'] == 'assistant']

    if not user_messages:
        return None

    # Collect all user text
    all_user_text = ' '.join(m['text'].lower() for m in user_messages)

    # Calculate raw metrics
    metrics = {}

    # === P1: Input Complexity (based on avg message length) ===
    avg_len = sum(len(m['text']) for m in user_messages) / len(user_messages)
    if avg_len < 30:
        metrics['p1'] = 1
    elif avg_len < 80:
        metrics['p1'] = 2
    else:
        metrics['p1'] = 3

    # === P2: Question Quality (based on question depth) ===
    question_count = sum(1 for kw in QUESTION_KEYWORDS if kw in all_user_text)
    if question_count == 0:
        metrics['p2'] = 1
    elif question_count <= 2:
        metrics['p2'] = 2
    else:
        metrics['p2'] = 3

    # === P3: Context Provision (based on detail in messages) ===
    has_context = any(len(m['text']) > 100 for m in user_messages)
    has_specifics = bool(re.search(r'\d+|example|specific|for instance', all_user_text))
    metrics['p3'] = 1 + int(has_context) + int(has_specifics)

    # === P4: Problem Decomposition (multi-part questions) ===
    multi_part = bool(re.search(r'first|then|also|and also|additionally|1\.|2\.', all_user_text))
    follow_up_count = len(user_messages) - 1
    if multi_part and follow_up_count > 2:
        metrics['p4'] = 3
    elif multi_part or follow_up_count > 1:
        metrics['p4'] = 2
    else:
        metrics['p4'] = 1

    # === M1: Iteration Frequency (follow-up modifications) ===
    modification_count = sum(1 for kw in MODIFICATION_KEYWORDS if kw in all_user_text)
    if modification_count == 0:
        metrics['m1'] = 0 if len(user_messages) <= 1 else 1
    elif modification_count <= 2:
        metrics['m1'] = 2
    else:
        metrics['m1'] = 3

    # === M2: Output Customization (requests for changes) ===
    customization = bool(re.search(r'can you|could you|please|make it|show me', all_user_text))
    specificity = bool(re.search(r'step by step|detail|more|less|simpler|easier', all_user_text))
    metrics['m2'] = 1 + int(customization) + int(specificity)

    # === M3: Integration Effort (combining/synthesizing) ===
    integration = bool(re.search(r'combine|together|overall|summary|connection', all_user_text))
    comparison = bool(re.search(r'compare|difference|similar|versus|vs', all_user_text))
    metrics['m3'] = 1 + int(integration) + int(comparison)

    # === E1: Verification Behavior ===
    verification_count = sum(1 for kw in VERIFICATION_KEYWORDS if kw in all_user_text)
    if verification_count == 0:
        metrics['e1'] = 0
    elif verification_count == 1:
        metrics['e1'] = 1
    elif verification_count <= 3:
        metrics['e1'] = 2
    else:
        metrics['e1'] = 3

    # === E2: Critical Evaluation ===
    critical_count = sum(1 for kw in CRITICAL_KEYWORDS if kw in all_user_text)
    if critical_count == 0:
        metrics['e2'] = 1
    elif critical_count <= 2:
        metrics['e2'] = 2
    else:
        metrics['e3'] = 3
    metrics['e2'] = min(metrics.get('e2', 1), 3)

    # === E3: External Reference (mentions of other sources) ===
    external = bool(re.search(r'book|lecture|professor|class|notes|textbook|source', all_user_text))
    metrics['e3'] = 2 if external else 1

    # === R1: Self-Reflection ===
    reflection_count = sum(1 for kw in REFLECTION_KEYWORDS if kw in all_user_text)
    if reflection_count == 0:
        metrics['r1'] = 1
    elif reflection_count <= 2:
        metrics['r1'] = 2
    else:
        metrics['r1'] = 3

    # === R2: Learning Indication ===
    learning = bool(re.search(r'thank|got it|understand now|learned|helpful|makes sense', all_user_text))
    practice = bool(re.search(r'let me try|i\'ll|practice|attempt', all_user_text))
    metrics['r2'] = 1 + int(learning) + int(practice)

    # Ensure all values are in range [0, 3]
    for key in metrics:
        metrics[key] = max(0, min(3, metrics[key]))

    return metrics


def classify_pattern(metrics: Dict[str, int]) -> Tuple[str, float]:
    """
    Classify user pattern (A-F) based on 12-dimension metrics.
    Returns (pattern, confidence)
    """
    total_score = sum(metrics.values())

    # Calculate dimension averages
    p_avg = (metrics['p1'] + metrics['p2'] + metrics['p3'] + metrics['p4']) / 4
    m_avg = (metrics['m1'] + metrics['m2'] + metrics['m3']) / 3
    e_avg = (metrics['e1'] + metrics['e2'] + metrics['e3']) / 3
    r_avg = (metrics['r1'] + metrics['r2']) / 2

    # Pattern Classification Rules

    # Pattern F: Passive Over-Reliance (Critical Risk)
    # Low engagement across all dimensions
    if total_score <= 15 and e_avg < 1.5 and p_avg < 2:
        return 'F', 0.85

    # Pattern A: Active Critical Engagement
    # High across all dimensions, especially E (evaluation)
    if total_score >= 28 and e_avg >= 2.5 and p_avg >= 2.5:
        return 'A', 0.85

    # Pattern B: Selective Engagement
    # High P, moderate M/E, lower R
    if p_avg >= 2.5 and m_avg >= 2 and r_avg < 2:
        return 'B', 0.75

    # Pattern D: Tool-Oriented Use
    # High M (modification), moderate others
    if m_avg >= 2.5 and total_score >= 22:
        return 'D', 0.80

    # Pattern E: Exploratory Learning
    # High R (reflection), good P, variable M/E
    if r_avg >= 2.5 and p_avg >= 2:
        return 'E', 0.75

    # Pattern C: Moderate Balanced Use (default/most common)
    if total_score >= 18:
        return 'C', 0.70

    # Low engagement but not Pattern F
    return 'C', 0.50


def convert_csv_to_metrics(input_path: str, output_path: str) -> Dict:
    """
    Main conversion function.
    Reads conversation history and outputs training data format.
    """
    print(f"📂 Reading conversation history from: {input_path}")

    # Group messages by user
    user_conversations = defaultdict(lambda: defaultdict(list))

    with open(input_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            hash_id = row.get('hash_id', '')
            conv_id = row.get('conversation_id', '')
            sender = row.get('sender', '')
            text = row.get('text', '') or ''

            if hash_id and conv_id and sender in ['user', 'assistant']:
                user_conversations[hash_id][conv_id].append({
                    'sender': sender,
                    'text': text
                })

    print(f"  ✓ Found {len(user_conversations)} unique users")

    # Analyze each user's conversations
    results = []
    pattern_counts = defaultdict(int)

    for user_id, conversations in user_conversations.items():
        # Aggregate metrics across all user conversations
        all_metrics = []
        for conv_id, messages in conversations.items():
            metrics = analyze_conversation(messages)
            if metrics:
                all_metrics.append(metrics)

        if not all_metrics:
            continue

        # Average metrics across conversations
        avg_metrics = {}
        for key in ['p1', 'p2', 'p3', 'p4', 'm1', 'm2', 'm3', 'e1', 'e2', 'e3', 'r1', 'r2']:
            avg_metrics[key] = round(sum(m[key] for m in all_metrics) / len(all_metrics))

        # Classify pattern
        pattern, confidence = classify_pattern(avg_metrics)
        pattern_counts[pattern] += 1

        # Calculate total score
        total_score = sum(avg_metrics.values())

        # Create output row
        results.append({
            'user_id': f"REAL_{user_id[:8]}",
            'pattern': pattern,
            'confidence': confidence,
            **avg_metrics,
            'total_score': total_score,
            'is_mixed_pattern': 'false',
            'notes': f"Converted from {len(all_metrics)} conversations"
        })

    print(f"  ✓ Analyzed {len(results)} users with valid data")
    print(f"\n📊 Pattern Distribution:")
    for pattern in sorted(pattern_counts.keys()):
        count = pattern_counts[pattern]
        pct = (count / len(results)) * 100
        print(f"    Pattern {pattern}: {count:3d} ({pct:5.1f}%)")

    # Write output
    print(f"\n📝 Writing to: {output_path}")

    fieldnames = ['user_id', 'pattern', 'confidence',
                  'p1', 'p2', 'p3', 'p4', 'm1', 'm2', 'm3',
                  'e1', 'e2', 'e3', 'r1', 'r2',
                  'total_score', 'is_mixed_pattern', 'notes']

    with open(output_path, 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(results)

    print(f"  ✓ Written {len(results)} records")

    return {
        'total_users': len(results),
        'pattern_distribution': dict(pattern_counts)
    }


if __name__ == '__main__':
    # Define paths
    script_dir = Path(__file__).parent
    input_file = script_dir.parent.parent.parent / 'docs' / 'interviews' / 'conv_history_active_users.csv'
    output_file = script_dir / 'real_user_training_data.csv'

    # Run conversion
    stats = convert_csv_to_metrics(str(input_file), str(output_file))

    print(f"\n✅ Conversion complete!")
    print(f"   Total users processed: {stats['total_users']}")
    print(f"   Output file: {output_file}")
