"""
Merge Real User Data with Existing Training Data
=================================================
Combines the converted real user metrics with existing synthetic training data.

This creates a hybrid dataset that:
1. Preserves the balanced pattern distribution from synthetic data
2. Adds real-world behavioral patterns for improved model generalization
3. Maintains data integrity and format consistency
"""

import csv
from pathlib import Path
from collections import defaultdict


def merge_datasets(synthetic_path: str, real_path: str, output_path: str) -> dict:
    """
    Merge synthetic and real training data.
    """
    print("📊 Merging training datasets...")
    print(f"   Synthetic data: {synthetic_path}")
    print(f"   Real data: {real_path}")

    # Read synthetic data
    synthetic_data = []
    with open(synthetic_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        synthetic_data = list(reader)

    print(f"   ✓ Loaded {len(synthetic_data)} synthetic records")

    # Read real data
    real_data = []
    with open(real_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        real_data = list(reader)

    print(f"   ✓ Loaded {len(real_data)} real records")

    # Count patterns before merge
    print("\n📈 Pattern Distribution BEFORE merge:")
    synthetic_patterns = defaultdict(int)
    for row in synthetic_data:
        synthetic_patterns[row['pattern']] += 1
    for p in sorted(synthetic_patterns.keys()):
        print(f"     Synthetic {p}: {synthetic_patterns[p]}")

    real_patterns = defaultdict(int)
    for row in real_data:
        real_patterns[row['pattern']] += 1
    for p in sorted(real_patterns.keys()):
        print(f"     Real {p}: {real_patterns[p]}")

    # Merge datasets
    merged_data = synthetic_data + real_data

    # Count patterns after merge
    print("\n📈 Pattern Distribution AFTER merge:")
    merged_patterns = defaultdict(int)
    for row in merged_data:
        merged_patterns[row['pattern']] += 1
    for p in sorted(merged_patterns.keys()):
        count = merged_patterns[p]
        pct = (count / len(merged_data)) * 100
        print(f"     {p}: {count} ({pct:.1f}%)")

    # Write merged data
    fieldnames = ['user_id', 'pattern', 'confidence',
                  'p1', 'p2', 'p3', 'p4', 'm1', 'm2', 'm3',
                  'e1', 'e2', 'e3', 'r1', 'r2',
                  'total_score', 'is_mixed_pattern', 'notes']

    with open(output_path, 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(merged_data)

    print(f"\n✅ Merged dataset written to: {output_path}")
    print(f"   Total records: {len(merged_data)}")

    return {
        'synthetic_count': len(synthetic_data),
        'real_count': len(real_data),
        'total_count': len(merged_data),
        'pattern_distribution': dict(merged_patterns)
    }


if __name__ == '__main__':
    script_dir = Path(__file__).parent

    # Input files
    synthetic_file = script_dir / 'training_data.csv'
    real_file = script_dir / 'real_user_training_data.csv'

    # Output file
    output_file = script_dir / 'hybrid_training_data.csv'

    # Run merge
    stats = merge_datasets(str(synthetic_file), str(real_file), str(output_file))

    print(f"\n📋 Summary:")
    print(f"   Synthetic samples: {stats['synthetic_count']}")
    print(f"   Real user samples: {stats['real_count']}")
    print(f"   Total samples: {stats['total_count']}")
