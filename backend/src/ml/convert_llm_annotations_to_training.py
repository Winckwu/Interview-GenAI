"""
Convert LLM Annotations to Training Data Format
================================================
Converts all claude_annotations_batch*.json files to CSV training format.

For batches with detailed scores: uses actual P1-R2 scores
For batches with only pattern/total: estimates scores based on typical distributions
"""

import json
import csv
from pathlib import Path
from typing import Dict, List
import random

# Pattern-specific score distributions (based on analysis of batches 0-12)
PATTERN_SCORE_TEMPLATES = {
    'A': {'P1': 3, 'P2': 3, 'P3': 3, 'P4': 3, 'M1': 2, 'M2': 3, 'M3': 2, 'E1': 2, 'E2': 2, 'E3': 2, 'R1': 3, 'R2': 3},
    'B': {'P1': 2, 'P2': 2, 'P3': 2, 'P4': 2, 'M1': 2, 'M2': 2, 'M3': 2, 'E1': 2, 'E2': 1, 'E3': 1, 'R1': 2, 'R2': 2},
    'C': {'P1': 1, 'P2': 2, 'P3': 1, 'P4': 2, 'M1': 2, 'M2': 1, 'M3': 1, 'E1': 1, 'E2': 1, 'E3': 0, 'R1': 1, 'R2': 1},
    'D': {'P1': 2, 'P2': 3, 'P3': 2, 'P4': 2, 'M1': 3, 'M2': 3, 'M3': 2, 'E1': 3, 'E2': 3, 'E3': 2, 'R1': 2, 'R2': 2},
    'E': {'P1': 2, 'P2': 2, 'P3': 2, 'P4': 2, 'M1': 2, 'M2': 2, 'M3': 3, 'E1': 2, 'E2': 2, 'E3': 3, 'R1': 2, 'R2': 2},
    'F': {'P1': 0, 'P2': 1, 'P3': 0, 'P4': 1, 'M1': 0, 'M2': 0, 'M3': 0, 'E1': 0, 'E2': 0, 'E3': 0, 'R1': 0, 'R2': 1}
}


def estimate_scores_from_pattern_and_total(pattern: str, total: int) -> Dict[str, int]:
    """
    Estimate individual dimension scores based on pattern and total.
    Uses template as base and adjusts to match total.
    """
    template = PATTERN_SCORE_TEMPLATES.get(pattern, PATTERN_SCORE_TEMPLATES['C']).copy()
    template_total = sum(template.values())

    # Calculate difference
    diff = total - template_total

    # Adjust scores to match total
    dims = list(template.keys())
    random.shuffle(dims)  # Add some randomness

    for dim in dims:
        if diff == 0:
            break
        if diff > 0 and template[dim] < 3:
            add = min(diff, 3 - template[dim])
            template[dim] += add
            diff -= add
        elif diff < 0 and template[dim] > 0:
            sub = min(-diff, template[dim])
            template[dim] -= sub
            diff += sub

    return template


def load_batch_file(filepath: Path) -> List[Dict]:
    """Load a single batch file and extract annotations."""
    with open(filepath, 'r') as f:
        data = json.load(f)

    annotations = data.get('annotations', [])
    results = []

    for ann in annotations:
        user_id = ann.get('user_id', '')
        pattern = ann.get('pattern', 'C')
        total = ann.get('total', 10)
        confidence = ann.get('confidence', 0.8)

        # Check if detailed scores exist
        if 'scores' in ann and isinstance(ann['scores'], dict):
            scores = {k.lower(): v for k, v in ann['scores'].items()}
        else:
            # Estimate scores from pattern and total
            scores = {k.lower(): v for k, v in estimate_scores_from_pattern_and_total(pattern, total).items()}

        results.append({
            'user_id': user_id,
            'pattern': pattern,
            'confidence': confidence,
            'p1': scores.get('p1', 1),
            'p2': scores.get('p2', 1),
            'p3': scores.get('p3', 1),
            'p4': scores.get('p4', 1),
            'm1': scores.get('m1', 1),
            'm2': scores.get('m2', 1),
            'm3': scores.get('m3', 1),
            'e1': scores.get('e1', 1),
            'e2': scores.get('e2', 1),
            'e3': scores.get('e3', 1),
            'r1': scores.get('r1', 1),
            'r2': scores.get('r2', 1),
            'total_score': total,
            'is_mixed_pattern': 'false',
            'notes': f'LLM-annotated (confidence: {confidence})'
        })

    return results


def main():
    script_dir = Path(__file__).parent

    # Find all batch files
    batch_files = sorted(script_dir.glob('claude_annotations_batch*.json'))

    print("=" * 70)
    print("CONVERTING LLM ANNOTATIONS TO TRAINING FORMAT")
    print("=" * 70)

    all_records = []

    for batch_file in batch_files:
        print(f"\n📂 Processing: {batch_file.name}")
        records = load_batch_file(batch_file)
        print(f"   Found {len(records)} annotations")
        all_records.extend(records)

    print(f"\n📊 Total records: {len(all_records)}")

    # Count pattern distribution
    pattern_counts = {}
    for rec in all_records:
        p = rec['pattern']
        pattern_counts[p] = pattern_counts.get(p, 0) + 1

    print("\n📈 Pattern Distribution:")
    for p in sorted(pattern_counts.keys()):
        count = pattern_counts[p]
        pct = (count / len(all_records)) * 100
        print(f"   {p}: {count} ({pct:.1f}%)")

    # Write to CSV
    output_path = script_dir / 'llm_annotated_training_data.csv'
    fieldnames = ['user_id', 'pattern', 'confidence',
                  'p1', 'p2', 'p3', 'p4', 'm1', 'm2', 'm3',
                  'e1', 'e2', 'e3', 'r1', 'r2',
                  'total_score', 'is_mixed_pattern', 'notes']

    with open(output_path, 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(all_records)

    print(f"\n✅ Training data saved to: {output_path}")

    return all_records


if __name__ == '__main__':
    main()
