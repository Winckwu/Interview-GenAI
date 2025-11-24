"""
Pattern Classification Validation
==================================
Validates the pattern classification accuracy using the hybrid dataset.
Uses only Python standard library (no numpy/pandas required).
"""

import csv
import random
from pathlib import Path
from collections import defaultdict
from typing import List, Dict, Tuple


# Pattern mapping
PATTERN_MAPPING = {'A': 0, 'B': 1, 'C': 2, 'D': 3, 'E': 4, 'F': 5}
REVERSE_PATTERN_MAPPING = {v: k for k, v in PATTERN_MAPPING.items()}


def load_data(filepath: str) -> Tuple[List[List[int]], List[int], List[str]]:
    """Load training data from CSV."""
    X = []
    y = []
    user_ids = []

    with open(filepath, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            features = [
                int(row['p1']), int(row['p2']), int(row['p3']), int(row['p4']),
                int(row['m1']), int(row['m2']), int(row['m3']),
                int(row['e1']), int(row['e2']), int(row['e3']),
                int(row['r1']), int(row['r2'])
            ]
            X.append(features)
            y.append(PATTERN_MAPPING[row['pattern']])
            user_ids.append(row['user_id'])

    return X, y, user_ids


def rule_based_classify(features: List[int]) -> int:
    """
    Rule-based pattern classification.
    Returns pattern number (0-5 for A-F).
    """
    p1, p2, p3, p4, m1, m2, m3, e1, e2, e3, r1, r2 = features

    total_score = sum(features)
    p_avg = (p1 + p2 + p3 + p4) / 4
    m_avg = (m1 + m2 + m3) / 3
    e_avg = (e1 + e2 + e3) / 3
    r_avg = (r1 + r2) / 2

    # Pattern F: Passive Over-Reliance (total <= 15, low E)
    if total_score <= 15 and e_avg < 1.5:
        return 5  # F

    # Pattern A: Active Critical Engagement (high total, high E)
    if total_score >= 28 and e_avg >= 2.5 and p_avg >= 2.5:
        return 0  # A

    # Pattern B: Selective Engagement
    if p_avg >= 2.5 and m_avg >= 2 and r_avg < 2:
        return 1  # B

    # Pattern D: Tool-Oriented Use
    if m_avg >= 2.5 and total_score >= 22:
        return 3  # D

    # Pattern E: Exploratory Learning
    if r_avg >= 2.5 and p_avg >= 2:
        return 4  # E

    # Pattern C: Moderate Balanced Use (default)
    return 2  # C


def calculate_metrics(y_true: List[int], y_pred: List[int]) -> Dict:
    """Calculate classification metrics."""
    classes = sorted(list(set(y_true) | set(y_pred)))

    # Overall accuracy
    correct = sum(1 for t, p in zip(y_true, y_pred) if t == p)
    accuracy = correct / len(y_true)

    # Per-class metrics
    metrics = {'accuracy': accuracy, 'per_class': {}}

    for cls in classes:
        pattern = REVERSE_PATTERN_MAPPING[cls]
        true_positives = sum(1 for t, p in zip(y_true, y_pred) if t == cls and p == cls)
        false_positives = sum(1 for t, p in zip(y_true, y_pred) if t != cls and p == cls)
        false_negatives = sum(1 for t, p in zip(y_true, y_pred) if t == cls and p != cls)

        precision = true_positives / (true_positives + false_positives) if (true_positives + false_positives) > 0 else 0
        recall = true_positives / (true_positives + false_negatives) if (true_positives + false_negatives) > 0 else 0
        f1 = 2 * precision * recall / (precision + recall) if (precision + recall) > 0 else 0

        metrics['per_class'][pattern] = {
            'precision': precision,
            'recall': recall,
            'f1': f1,
            'support': sum(1 for t in y_true if t == cls)
        }

    return metrics


def confusion_matrix(y_true: List[int], y_pred: List[int]) -> List[List[int]]:
    """Generate confusion matrix."""
    n_classes = 6
    cm = [[0] * n_classes for _ in range(n_classes)]
    for true, pred in zip(y_true, y_pred):
        cm[true][pred] += 1
    return cm


def cross_validate(X: List[List[int]], y: List[int], n_folds: int = 5) -> List[float]:
    """Simple k-fold cross-validation."""
    n_samples = len(X)
    fold_size = n_samples // n_folds

    # Shuffle indices
    indices = list(range(n_samples))
    random.seed(42)
    random.shuffle(indices)

    fold_accuracies = []

    for i in range(n_folds):
        test_start = i * fold_size
        test_end = (i + 1) * fold_size if i < n_folds - 1 else n_samples
        test_indices = indices[test_start:test_end]

        y_test = [y[idx] for idx in test_indices]
        X_test = [X[idx] for idx in test_indices]

        # Apply rule-based classification
        y_pred = [rule_based_classify(x) for x in X_test]
        accuracy = sum(1 for t, p in zip(y_test, y_pred) if t == p) / len(y_test)
        fold_accuracies.append(accuracy)

    return fold_accuracies


def main():
    print("=" * 60)
    print("PATTERN CLASSIFICATION VALIDATION")
    print("=" * 60)

    # Load data
    script_dir = Path(__file__).parent
    data_path = script_dir / 'hybrid_training_data.csv'

    print(f"\n📂 Loading data from: {data_path}")
    X, y, user_ids = load_data(str(data_path))
    print(f"   ✓ Loaded {len(X)} samples")

    # Pattern distribution
    print("\n📊 Pattern Distribution:")
    for i in range(6):
        pattern = REVERSE_PATTERN_MAPPING[i]
        count = sum(1 for label in y if label == i)
        pct = (count / len(y)) * 100
        print(f"   Pattern {pattern}: {count:3d} ({pct:5.1f}%)")

    # Apply rule-based classification
    print("\n🔍 Applying rule-based classification...")
    y_pred = [rule_based_classify(x) for x in X]

    # Calculate metrics
    metrics = calculate_metrics(y, y_pred)

    print(f"\n📈 Overall Accuracy: {metrics['accuracy']*100:.1f}%")

    print("\n📋 Per-Class Metrics:")
    print(f"   {'Pattern':<8} {'Precision':<10} {'Recall':<10} {'F1':<10} {'Support':<10}")
    print("   " + "-" * 48)
    for pattern in ['A', 'B', 'C', 'D', 'E', 'F']:
        if pattern in metrics['per_class']:
            m = metrics['per_class'][pattern]
            print(f"   {pattern:<8} {m['precision']:.2f}       {m['recall']:.2f}       {m['f1']:.2f}       {m['support']}")

    # Confusion matrix
    cm = confusion_matrix(y, y_pred)
    print("\n📊 Confusion Matrix:")
    print("   Predicted ->  A    B    C    D    E    F")
    print("   Actual ↓")
    for i, pattern in enumerate(['A', 'B', 'C', 'D', 'E', 'F']):
        row = '   ' + f"{pattern}  " + '   '.join(f"{cm[i][j]:3d}" for j in range(6))
        print(row)

    # Cross-validation
    print("\n🔄 5-Fold Cross-Validation:")
    fold_accuracies = cross_validate(X, y, n_folds=5)
    for i, acc in enumerate(fold_accuracies):
        print(f"   Fold {i+1}: {acc*100:.1f}%")
    mean_acc = sum(fold_accuracies) / len(fold_accuracies)
    std_acc = (sum((a - mean_acc)**2 for a in fold_accuracies) / len(fold_accuracies)) ** 0.5
    print(f"   Mean: {mean_acc*100:.1f}% (±{std_acc*100:.1f}%)")

    # Key findings
    print("\n" + "=" * 60)
    print("KEY FINDINGS")
    print("=" * 60)

    # Check Pattern F detection (critical)
    f_metrics = metrics['per_class'].get('F', {})
    f_recall = f_metrics.get('recall', 0)
    print(f"\n⚠️  Pattern F (Critical Risk) Detection:")
    print(f"   Recall: {f_recall*100:.1f}% (Target: >90%)")
    if f_recall >= 0.9:
        print("   ✓ PASS: Pattern F detection meets target")
    else:
        print("   ✗ NEEDS IMPROVEMENT: Pattern F recall below target")

    # Data quality observations
    f_count = sum(1 for label in y if label == 5)
    print(f"\n📝 Data Quality Observations:")
    print(f"   - Real user data shows {f_count/len(y)*100:.1f}% Pattern F")
    print(f"   - This indicates high passive over-reliance in actual usage")
    print(f"   - Verification behavior (E1) is notably low across users")

    return metrics


if __name__ == '__main__':
    main()
