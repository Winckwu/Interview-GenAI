#!/usr/bin/env python3
"""
LLM-based Conversation Annotator

Uses GPT-4 (or Claude) as a judge to annotate conversations with
12-dimensional metacognitive subprocess scores.

Methodology: LLM-as-a-Judge
- Semantic understanding instead of keyword matching
- Context-aware scoring
- Handles mixed Chinese/English conversations
- Captures implicit behaviors

Author: MCA Research Team
Date: 2024-11-24
"""

import os
import sys
import json
import csv
import time
from typing import Dict, List, Optional, Tuple
from collections import defaultdict
from openai import OpenAI

# Configuration
INPUT_CSV = 'docs/interviews/conv_history_active_users.csv'
OUTPUT_CSV = 'backend/src/ml/llm_annotated_training_data.csv'
OUTPUT_JSON = 'backend/src/ml/llm_annotations_detailed.json'
BATCH_SIZE = 10  # Number of users to process before saving checkpoint
MAX_RETRIES = 3
RETRY_DELAY = 5  # seconds

# Get project root
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

# Initialize OpenAI client
client = OpenAI(api_key=os.environ.get('OPENAI_API_KEY'))
MODEL = os.environ.get('AI_MODEL', 'gpt-4o')  # Use GPT-4 for better annotation quality

# Annotation prompt template
ANNOTATION_PROMPT = """You are an expert in metacognitive assessment and educational psychology.

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
  "reasoning": "<brief explanation for pattern classification>"
}}
"""


def load_conversations(csv_path: str) -> Dict[str, List[Dict]]:
    """Load conversations from CSV and group by user."""
    users = defaultdict(list)

    with open(csv_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            user_id = row.get('user_id', row.get('UserID', ''))
            if user_id:
                users[user_id].append({
                    'role': row.get('role', row.get('Role', '')),
                    'content': row.get('content', row.get('Content', '')),
                    'timestamp': row.get('timestamp', row.get('Timestamp', ''))
                })

    print(f"Loaded {len(users)} unique users")
    return dict(users)


def format_conversation_for_prompt(messages: List[Dict], max_messages: int = 50) -> str:
    """Format conversation history for the annotation prompt."""
    # Limit to most recent messages to fit context window
    recent = messages[-max_messages:] if len(messages) > max_messages else messages

    formatted = []
    for msg in recent:
        role = msg['role'].upper() if msg['role'] else 'UNKNOWN'
        content = msg['content'][:500] if msg['content'] else ''  # Truncate long messages
        formatted.append(f"[{role}]: {content}")

    return "\n\n".join(formatted)


def annotate_user(user_id: str, messages: List[Dict]) -> Optional[Dict]:
    """Use LLM to annotate a single user's conversation history."""

    # Filter to user messages only for analysis
    user_messages = [m for m in messages if m['role'].lower() in ['user', 'human']]

    if len(user_messages) < 2:
        print(f"  Skipping {user_id}: insufficient user messages ({len(user_messages)})")
        return None

    # Format conversation
    conv_text = format_conversation_for_prompt(messages)
    prompt = ANNOTATION_PROMPT.format(conversation_history=conv_text)

    # Call LLM with retries
    for attempt in range(MAX_RETRIES):
        try:
            response = client.chat.completions.create(
                model=MODEL,
                messages=[
                    {"role": "system", "content": "You are an expert metacognitive assessment specialist. Respond only with valid JSON."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.3,  # Lower temperature for consistency
                max_tokens=500,
                response_format={"type": "json_object"}
            )

            # Parse response
            result_text = response.choices[0].message.content
            result = json.loads(result_text)

            # Validate structure
            if 'scores' not in result or 'pattern' not in result:
                raise ValueError("Invalid response structure")

            # Add metadata
            result['user_id'] = user_id
            result['message_count'] = len(messages)
            result['user_message_count'] = len(user_messages)

            return result

        except json.JSONDecodeError as e:
            print(f"  JSON parse error for {user_id}, attempt {attempt+1}: {e}")
        except Exception as e:
            print(f"  Error annotating {user_id}, attempt {attempt+1}: {e}")

        if attempt < MAX_RETRIES - 1:
            time.sleep(RETRY_DELAY)

    return None


def save_checkpoint(annotations: List[Dict], output_csv: str, output_json: str):
    """Save current annotations to files."""

    # Save detailed JSON
    with open(output_json, 'w', encoding='utf-8') as f:
        json.dump(annotations, f, indent=2, ensure_ascii=False)

    # Save CSV for training
    with open(output_csv, 'w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        writer.writerow(['user_id', 'P1', 'P2', 'P3', 'P4', 'M1', 'M2', 'M3',
                         'E1', 'E2', 'E3', 'R1', 'R2', 'pattern', 'confidence', 'source'])

        for ann in annotations:
            scores = ann['scores']
            writer.writerow([
                ann['user_id'],
                scores['P1'], scores['P2'], scores['P3'], scores['P4'],
                scores['M1'], scores['M2'], scores['M3'],
                scores['E1'], scores['E2'], scores['E3'],
                scores['R1'], scores['R2'],
                ann['pattern'],
                ann.get('confidence', 0.8),
                'llm_annotation'
            ])

    print(f"  Checkpoint saved: {len(annotations)} annotations")


def main():
    """Main annotation pipeline."""
    print("=" * 60)
    print("LLM-based Conversation Annotator")
    print("Methodology: LLM-as-a-Judge (GPT-4)")
    print("=" * 60)

    # Check API key
    if not os.environ.get('OPENAI_API_KEY'):
        print("ERROR: OPENAI_API_KEY not set!")
        print("Please set: export OPENAI_API_KEY=your_key")
        sys.exit(1)

    # Load conversations
    csv_path = os.path.join(PROJECT_ROOT, INPUT_CSV)
    output_csv = os.path.join(PROJECT_ROOT, OUTPUT_CSV)
    output_json = os.path.join(PROJECT_ROOT, OUTPUT_JSON)

    print(f"\nLoading conversations from: {csv_path}")
    users = load_conversations(csv_path)

    # Load existing checkpoint if available
    annotations = []
    processed_users = set()

    if os.path.exists(output_json):
        try:
            with open(output_json, 'r') as f:
                annotations = json.load(f)
                processed_users = {a['user_id'] for a in annotations}
                print(f"Loaded checkpoint: {len(annotations)} already processed")
        except:
            pass

    # Process users
    total = len(users)
    remaining = [uid for uid in users.keys() if uid not in processed_users]

    print(f"\nTotal users: {total}")
    print(f"Already processed: {len(processed_users)}")
    print(f"Remaining: {len(remaining)}")
    print(f"Model: {MODEL}")
    print("\nStarting annotation...\n")

    for i, user_id in enumerate(remaining):
        messages = users[user_id]
        print(f"[{i+1}/{len(remaining)}] Annotating user {user_id[:8]}... ({len(messages)} messages)")

        result = annotate_user(user_id, messages)

        if result:
            annotations.append(result)
            pattern = result['pattern']
            scores = result['scores']
            total_score = sum(scores.values())
            print(f"  → Pattern {pattern} (total score: {total_score}/36)")

        # Save checkpoint periodically
        if (i + 1) % BATCH_SIZE == 0:
            save_checkpoint(annotations, output_csv, output_json)

        # Rate limiting
        time.sleep(0.5)

    # Final save
    save_checkpoint(annotations, output_csv, output_json)

    # Summary statistics
    print("\n" + "=" * 60)
    print("ANNOTATION COMPLETE")
    print("=" * 60)

    pattern_counts = defaultdict(int)
    total_scores = defaultdict(float)

    for ann in annotations:
        pattern_counts[ann['pattern']] += 1
        for dim, score in ann['scores'].items():
            total_scores[dim] += score

    print(f"\nTotal annotated: {len(annotations)}")
    print("\nPattern Distribution:")
    for pattern in ['A', 'B', 'C', 'D', 'E', 'F']:
        count = pattern_counts[pattern]
        pct = count / len(annotations) * 100 if annotations else 0
        print(f"  Pattern {pattern}: {count} ({pct:.1f}%)")

    print("\nDimension Averages:")
    for dim in ['P1', 'P2', 'P3', 'P4', 'M1', 'M2', 'M3', 'E1', 'E2', 'E3', 'R1', 'R2']:
        avg = total_scores[dim] / len(annotations) if annotations else 0
        print(f"  {dim}: {avg:.2f}")

    print(f"\nOutput files:")
    print(f"  CSV: {output_csv}")
    print(f"  JSON: {output_json}")


if __name__ == '__main__':
    main()
