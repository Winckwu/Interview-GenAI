#!/usr/bin/env python3
"""
Train and Compare Models: Old vs Aligned Dimensions

This script:
1. Trains SVM on OLD dimension labels
2. Trains SVM on NEW aligned dimension labels
3. Compares performance metrics

Author: MCA Research Team
Date: 2024-12-03
"""

import pandas as pd
import numpy as np
import pickle
import json
from pathlib import Path
from datetime import datetime
from sklearn.model_selection import train_test_split, cross_val_score, StratifiedKFold
from sklearn.preprocessing import StandardScaler
from sklearn.svm import SVC
from sklearn.metrics import (
    classification_report, confusion_matrix, accuracy_score,
    precision_score, recall_score, f1_score
)

# Paths
PROJECT_ROOT = Path(__file__).parent.parent.parent.parent
OLD_DATA_PATH = PROJECT_ROOT / 'backend/src/ml/llm_annotated_training_data.csv'
NEW_DATA_PATH = PROJECT_ROOT / 'backend/src/ml/llm_annotated_aligned_v2.csv'
OUTPUT_DIR = PROJECT_ROOT / 'backend/src/ml/models'
COMPARISON_REPORT = PROJECT_ROOT / 'backend/src/ml/model_comparison_aligned_vs_old.json'

# Pattern mapping
PATTERN_MAPPING = {'A': 0, 'B': 1, 'C': 2, 'D': 3, 'E': 4, 'F': 5}
REVERSE_PATTERN = {v: k for k, v in PATTERN_MAPPING.items()}

# Feature columns
FEATURE_COLS = ['p1', 'p2', 'p3', 'p4', 'm1', 'm2', 'm3', 'e1', 'e2', 'e3', 'r1', 'r2']

# Dimension names for reporting
OLD_DIMENSION_NAMES = {
    'p1': 'Input Complexity',
    'p2': 'Question Quality',
    'p3': 'Context Provision',
    'p4': 'Problem Decomposition',  # OLD
    'm1': 'Iteration Frequency',
    'm2': 'Output Customization',
    'm3': 'Integration Effort',      # OLD
    'e1': 'Verification Behavior',
    'e2': 'Critical Evaluation',
    'e3': 'External Reference',
    'r1': 'Self-Reflection',
    'r2': 'Learning Indication'
}

NEW_DIMENSION_NAMES = {
    'p1': 'Task Understanding',
    'p2': 'Goal Setting',
    'p3': 'Strategy Planning',
    'p4': 'Role Definition',         # NEW - aligned with theory
    'm1': 'Process Tracking',
    'm2': 'Quality Checking',
    'm3': 'Trust Calibration',       # NEW - aligned with theory
    'e1': 'Quality Evaluation',
    'e2': 'Risk Assessment',
    'e3': 'Capability Judgment',
    'r1': 'Strategy Adjustment',
    'r2': 'Tool Switching'
}


def load_data(csv_path: Path):
    """Load and prepare training data"""
    print(f"📥 Loading data from {csv_path}...")

    if not csv_path.exists():
        print(f"❌ File not found: {csv_path}")
        return None, None

    df = pd.read_csv(csv_path)

    # Extract features and labels
    X = df[FEATURE_COLS].values
    y = df['pattern'].map(PATTERN_MAPPING).values

    print(f"✅ Loaded {len(X)} samples")
    print(f"   Class distribution: {dict(zip(*np.unique(y, return_counts=True)))}")

    return X, y


def train_model(X, y, model_name="model"):
    """Train SVM model and return metrics"""
    print(f"\n🤖 Training {model_name}...")

    # Split data
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    # Scale features
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)

    # Train SVM with same hyperparameters
    svm = SVC(
        kernel='rbf',
        C=1.0,
        gamma='scale',
        probability=True,
        class_weight='balanced',
        random_state=42
    )

    svm.fit(X_train_scaled, y_train)

    # Predictions
    y_train_pred = svm.predict(X_train_scaled)
    y_test_pred = svm.predict(X_test_scaled)

    # Metrics
    train_acc = accuracy_score(y_train, y_train_pred)
    test_acc = accuracy_score(y_test, y_test_pred)

    # Cross-validation
    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
    cv_scores = cross_val_score(svm, X_train_scaled, y_train, cv=cv, scoring='accuracy')

    # Per-class metrics
    report = classification_report(y_test, y_test_pred, output_dict=True, zero_division=0)

    # Confusion matrix
    cm = confusion_matrix(y_test, y_test_pred)

    metrics = {
        'train_accuracy': float(train_acc),
        'test_accuracy': float(test_acc),
        'cv_mean': float(cv_scores.mean()),
        'cv_std': float(cv_scores.std()),
        'precision_macro': float(precision_score(y_test, y_test_pred, average='macro', zero_division=0)),
        'recall_macro': float(recall_score(y_test, y_test_pred, average='macro', zero_division=0)),
        'f1_macro': float(f1_score(y_test, y_test_pred, average='macro', zero_division=0)),
        'per_class_f1': {REVERSE_PATTERN[i]: float(report.get(str(i), {}).get('f1-score', 0)) for i in range(6)},
        'confusion_matrix': cm.tolist()
    }

    print(f"✅ Training Accuracy: {train_acc:.4f} ({train_acc*100:.2f}%)")
    print(f"✅ Test Accuracy: {test_acc:.4f} ({test_acc*100:.2f}%)")
    print(f"✅ CV Accuracy: {cv_scores.mean():.4f} (+/- {cv_scores.std():.4f})")
    print(f"✅ Macro F1: {metrics['f1_macro']:.4f}")

    return svm, scaler, metrics


def compute_feature_importance(svm, scaler, X, feature_names):
    """Compute feature importance using permutation"""
    from sklearn.inspection import permutation_importance

    X_scaled = scaler.transform(X)
    result = permutation_importance(svm, X_scaled, np.zeros(len(X)), n_repeats=10, random_state=42)

    importance = {}
    for i, name in enumerate(feature_names):
        importance[name] = float(abs(result.importances_mean[i]))

    return importance


def compare_label_differences(old_path, new_path):
    """Compare how labels differ between old and new annotations"""
    print("\n📊 Comparing label differences...")

    old_df = pd.read_csv(old_path)
    new_df = pd.read_csv(new_path)

    # Merge on user_id
    merged = old_df.merge(new_df, on='user_id', suffixes=('_old', '_new'))

    if len(merged) == 0:
        print("⚠️ No matching users found between datasets")
        return {}

    # Compare each dimension
    differences = {}
    for col in FEATURE_COLS:
        old_col = f"{col}_old"
        new_col = f"{col}_new"

        if old_col in merged.columns and new_col in merged.columns:
            diff = (merged[old_col] - merged[new_col]).abs()
            differences[col] = {
                'mean_diff': float(diff.mean()),
                'max_diff': int(diff.max()),
                'pct_changed': float((diff > 0).sum() / len(diff) * 100),
                'correlation': float(merged[old_col].corr(merged[new_col]))
            }

    # Compare pattern assignments
    pattern_changes = (merged['pattern_old'] != merged['pattern_new']).sum()

    print(f"\n📈 Dimension-level differences:")
    print(f"{'Dimension':<25} {'Mean Diff':<12} {'% Changed':<12} {'Correlation':<12}")
    print("-" * 60)
    for col, stats in differences.items():
        old_name = OLD_DIMENSION_NAMES.get(col, col)
        new_name = NEW_DIMENSION_NAMES.get(col, col)
        name = f"{col} ({new_name[:15]})"
        print(f"{name:<25} {stats['mean_diff']:<12.3f} {stats['pct_changed']:<12.1f} {stats['correlation']:<12.3f}")

    print(f"\n🔄 Pattern changes: {pattern_changes}/{len(merged)} ({pattern_changes/len(merged)*100:.1f}%)")

    return differences


def main():
    print("=" * 70)
    print("🔬 Model Comparison: Old Dimensions vs Aligned Dimensions")
    print("=" * 70)
    print(f"Timestamp: {datetime.now().isoformat()}")

    results = {
        'timestamp': datetime.now().isoformat(),
        'old_model': None,
        'new_model': None,
        'comparison': {},
        'label_differences': {}
    }

    # Train old model
    print("\n" + "=" * 70)
    print("📦 OLD MODEL (Original dimensions)")
    print("=" * 70)
    X_old, y_old = load_data(OLD_DATA_PATH)

    if X_old is not None:
        svm_old, scaler_old, metrics_old = train_model(X_old, y_old, "Old Model")
        results['old_model'] = metrics_old

        # Save old model
        with open(OUTPUT_DIR / 'svm_model_old.pkl', 'wb') as f:
            pickle.dump({'model': svm_old, 'scaler': scaler_old}, f)

    # Train new model
    print("\n" + "=" * 70)
    print("📦 NEW MODEL (Aligned dimensions)")
    print("=" * 70)
    X_new, y_new = load_data(NEW_DATA_PATH)

    if X_new is not None:
        svm_new, scaler_new, metrics_new = train_model(X_new, y_new, "New Model")
        results['new_model'] = metrics_new

        # Save new model
        with open(OUTPUT_DIR / 'svm_model_aligned.pkl', 'wb') as f:
            pickle.dump({'model': svm_new, 'scaler': scaler_new}, f)

    # Compare
    if results['old_model'] and results['new_model']:
        print("\n" + "=" * 70)
        print("📊 COMPARISON SUMMARY")
        print("=" * 70)

        old = results['old_model']
        new = results['new_model']

        comparison = {
            'test_accuracy_diff': new['test_accuracy'] - old['test_accuracy'],
            'cv_accuracy_diff': new['cv_mean'] - old['cv_mean'],
            'f1_macro_diff': new['f1_macro'] - old['f1_macro'],
            'per_class_f1_diff': {
                k: new['per_class_f1'].get(k, 0) - old['per_class_f1'].get(k, 0)
                for k in old['per_class_f1'].keys()
            }
        }
        results['comparison'] = comparison

        print(f"\n{'Metric':<25} {'Old':<12} {'New':<12} {'Diff':<12} {'Change'}")
        print("-" * 70)

        def format_diff(diff):
            if diff > 0:
                return f"✅ +{diff:.4f}"
            elif diff < 0:
                return f"❌ {diff:.4f}"
            else:
                return f"   {diff:.4f}"

        print(f"{'Test Accuracy':<25} {old['test_accuracy']:<12.4f} {new['test_accuracy']:<12.4f} {format_diff(comparison['test_accuracy_diff'])}")
        print(f"{'CV Accuracy':<25} {old['cv_mean']:<12.4f} {new['cv_mean']:<12.4f} {format_diff(comparison['cv_accuracy_diff'])}")
        print(f"{'Macro F1':<25} {old['f1_macro']:<12.4f} {new['f1_macro']:<12.4f} {format_diff(comparison['f1_macro_diff'])}")

        print(f"\nPer-class F1 differences:")
        for pattern in ['A', 'B', 'C', 'D', 'E', 'F']:
            diff = comparison['per_class_f1_diff'].get(pattern, 0)
            old_f1 = old['per_class_f1'].get(pattern, 0)
            new_f1 = new['per_class_f1'].get(pattern, 0)
            print(f"  Pattern {pattern}: {old_f1:.3f} → {new_f1:.3f} ({format_diff(diff)})")

        # Label differences
        if OLD_DATA_PATH.exists() and NEW_DATA_PATH.exists():
            results['label_differences'] = compare_label_differences(OLD_DATA_PATH, NEW_DATA_PATH)

    # Save comparison report
    with open(COMPARISON_REPORT, 'w') as f:
        json.dump(results, f, indent=2)

    print(f"\n💾 Comparison report saved to {COMPARISON_REPORT}")

    # Final verdict
    if results['old_model'] and results['new_model']:
        diff = comparison['test_accuracy_diff']
        print("\n" + "=" * 70)
        print("🏆 VERDICT")
        print("=" * 70)
        if diff > 0.02:
            print(f"✅ NEW aligned model is BETTER (+{diff*100:.2f}% accuracy)")
            print("   Recommendation: Use aligned dimensions")
        elif diff < -0.02:
            print(f"⚠️ OLD model performs better ({diff*100:.2f}% accuracy)")
            print("   Note: Theory alignment may still be valuable for interpretability")
        else:
            print(f"≈ Models perform similarly (diff: {diff*100:.2f}%)")
            print("   Recommendation: Use aligned dimensions for better interpretability")


if __name__ == "__main__":
    main()
