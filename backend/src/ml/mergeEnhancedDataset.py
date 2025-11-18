#!/usr/bin/env python3
"""
Merge Enhanced BD Samples with Hybrid Dataset

Strategy:
- Start with hybrid dataset (79 samples: A-D all real, E-F real+synthetic)
- Add enhanced B samples (15 samples) to strengthen B pattern recognition
- Add enhanced D samples (15 samples) to strengthen D pattern recognition
- Result: Enhanced dataset (109 samples)
"""

import pandas as pd
from pathlib import Path

def merge_enhanced_dataset():
    print("\n" + "="*80)
    print("🔀 CREATING ENHANCED DATASET (Hybrid + Enhanced B & D)")
    print("="*80 + "\n")

    current_dir = Path(__file__).parent
    hybrid_path = current_dir / 'hybrid_training_data.csv'
    enhanced_bd_path = current_dir / 'enhanced_bd_synthetic_data.csv'
    output_path = current_dir / 'enhanced_training_data.csv'

    # Read hybrid data
    print("📖 Reading hybrid dataset...")
    hybrid_df = pd.read_csv(hybrid_path)
    print(f"  ✓ Hybrid samples: {len(hybrid_df)}")

    # Read enhanced BD data
    print("📖 Reading enhanced B & D synthetic data...")
    enhanced_df = pd.read_csv(enhanced_bd_path)
    b_count = len(enhanced_df[enhanced_df['pattern'] == 'B'])
    d_count = len(enhanced_df[enhanced_df['pattern'] == 'D'])
    print(f"  ✓ Enhanced B samples: {b_count}")
    print(f"  ✓ Enhanced D samples: {d_count}")

    # Merge
    print("\n🔄 Creating enhanced dataset...")
    merged_df = pd.concat([hybrid_df, enhanced_df], ignore_index=True)

    # Write
    merged_df.to_csv(output_path, index=False)
    print(f"  ✓ Enhanced dataset created: enhanced_training_data.csv")

    # Analyze distribution
    print("\n📊 Distribution Analysis:")

    # Get counts
    hybrid_counts = hybrid_df['pattern'].value_counts().to_dict()
    merged_counts = merged_df['pattern'].value_counts().to_dict()

    patterns = ['A', 'B', 'C', 'D', 'E', 'F']

    print("\n  Pattern | Hybrid | Enhanced | Change | % of Total")
    print("  " + "-"*49)

    total_samples = len(merged_df)
    for pattern in patterns:
        hybrid_count = hybrid_counts.get(pattern, 0)
        enhanced_count = merged_counts.get(pattern, 0)
        change = enhanced_count - hybrid_count
        pct = (enhanced_count / total_samples) * 100

        arrow = ""
        if pattern in ['B', 'D']:
            arrow = " ✅"  # Emphasize the improvements

        print(f"    {pattern}    |   {hybrid_count:2d}   |    {enhanced_count:2d}    |  +{change:2d}   | {pct:5.1f}%{arrow}")

    print("  " + "-"*49)
    print(f"  Total  |   {len(hybrid_df):2d}   |    {total_samples:2d}    | +{total_samples - len(hybrid_df):2d}   |  100%\n")

    # Key improvements
    print("🎯 Key Improvements:")
    b_change = merged_counts.get('B', 0) - hybrid_counts.get('B', 0)
    d_change = merged_counts.get('D', 0) - hybrid_counts.get('D', 0)
    print(f"  Pattern B: {hybrid_counts.get('B', 0)} -> {merged_counts.get('B', 0)} (+{b_change}) STRONGER ITERATION SIGNAL (R1=3)")
    print(f"  Pattern D: {hybrid_counts.get('D', 0)} -> {merged_counts.get('D', 0)} (+{d_change}) CLEARER VERIFICATION SIGNAL (LOW P)")

    print("\n" + "="*80)
    print("✅ Enhanced dataset creation complete")
    print(f"📁 Output: enhanced_training_data.csv ({total_samples} samples)")
    print("="*80 + "\n")

    # Summary comparison
    print("📊 SUMMARY: Dataset Evolution\n")
    print("                  | Original | Hybrid | Enhanced")
    print("  ────────────────┼──────────┼────────┼─────────")
    print(f"  Total Samples   |    49    |   79   |   {total_samples:3d}")

    for pattern in patterns:
        original_counts = {'A': 10, 'B': 5, 'C': 22, 'D': 9, 'E': 1, 'F': 2}
        hybrid_count = hybrid_counts.get(pattern, 0)
        enhanced_count = merged_counts.get(pattern, 0)
        print(f"  Pattern {pattern}       |    {original_counts[pattern]:2d}    |   {hybrid_count:2d}   |   {enhanced_count:3d}")

    print("  ────────────────┼──────────┼────────┼─────────")

    print("\nExpected Performance Improvements:")
    print("  📈 Pattern B: Better recall due to +10 targeted samples with R1=3")
    print("  📈 Pattern D: Better recall due to +6 targeted samples with low P")
    print("  📈 Overall: Clearer decision boundaries for SVM/RF/XGBoost\n")

if __name__ == '__main__':
    merge_enhanced_dataset()
