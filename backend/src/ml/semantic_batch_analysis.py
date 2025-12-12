#!/usr/bin/env python3
"""
Batch Semantic Analysis Tool

This script outputs formatted conversation data for semantic analysis.
The actual analysis is performed by the LLM reading and understanding
the conversations in context.

Output format designed for LLM analysis of 12 aligned dimensions.
"""

import csv
import json
from collections import defaultdict

INPUT_CSV = 'docs/interviews/conv_history_active_users.csv'
OUTPUT_FILE = 'backend/src/ml/conversations_for_analysis.txt'

def load_conversations():
    user_convs = defaultdict(list)
    with open(INPUT_CSV, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            uid = row.get('hash_id', '')
            if uid:
                user_convs[uid].append({
                    'sender': row.get('sender', ''),
                    'text': row.get('text', '')
                })
    return dict(user_convs)

def format_user_conversation(uid, messages, max_msgs=15):
    """Format a user's conversation for semantic analysis"""
    lines = []
    lines.append(f"USER_ID: {uid}")
    lines.append(f"TOTAL_MESSAGES: {len(messages)}")
    lines.append("-" * 40)

    # Get alternating user/assistant messages
    count = 0
    for msg in messages:
        if count >= max_msgs:
            lines.append(f"... (truncated, {len(messages) - count} more messages)")
            break

        sender = msg['sender']
        text = msg['text'][:500]  # Truncate long messages

        if text.strip():
            lines.append(f"[{sender}]: {text}")
            count += 1

    return "\n".join(lines)

def main():
    convs = load_conversations()
    users = list(convs.keys())

    print(f"Total users: {len(users)}")
    print(f"Output file: {OUTPUT_FILE}")

    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        f.write("=" * 60 + "\n")
        f.write("CONVERSATION DATA FOR SEMANTIC ANALYSIS\n")
        f.write("=" * 60 + "\n")
        f.write("Instructions: Analyze each user's conversation to score\n")
        f.write("the 12 aligned metacognitive dimensions (0-3 scale).\n")
        f.write("=" * 60 + "\n\n")

        for i, uid in enumerate(users):
            f.write(f"\n{'='*60}\n")
            f.write(f"CASE {i+1}/{len(users)}\n")
            f.write(f"{'='*60}\n")
            f.write(format_user_conversation(uid, convs[uid]))
            f.write("\n")

    print(f"✅ Wrote {len(users)} users to {OUTPUT_FILE}")

if __name__ == "__main__":
    main()
