"""
Hybrid Model Training Script
============================
Trains SVM classifier using hybrid dataset (synthetic + real user data).

This script:
1. Loads hybrid_training_data.csv (427 samples: 49 synthetic + 378 real)
2. Applies class balancing for Pattern F detection priority
3. Trains SVM with optimized hyperparameters
4. Saves model and scaler for production use
5. Generates detailed training report
"""

import pandas as pd
import numpy as np
import pickle
import json
from pathlib import Path
from datetime import datetime
from typing import Tuple, Dict

from sklearn.model_selection import train_test_split, cross_val_score, StratifiedKFold
from sklearn.preprocessing import StandardScaler
from sklearn.svm import SVC
from sklearn.metrics import (
    classification_report, confusion_matrix, accuracy_score,
    precision_score, recall_score, f1_score
)

# Pattern mapping
PATTERN_MAPPING = {'A': 0, 'B': 1, 'C': 2, 'D': 3, 'E': 4, 'F': 5}
REVERSE_PATTERN_MAPPING = {v: k for k, v in PATTERN_MAPPING.items()}

# Feature names
FEATURE_COLS = ['p1', 'p2', 'p3', 'p4', 'm1', 'm2', 'm3', 'e1', 'e2', 'e3', 'r1', 'r2']


def load_hybrid_data(csv_path: str) -> Tuple[np.ndarray, np.ndarray, pd.DataFrame]:
    """Load hybrid training data"""
    print("=" * 60)
    print("HYBRID MODEL TRAINING")
    print("=" * 60)
    print(f"\n📂 Loading data from: {csv_path}")

    df = pd.read_csv(csv_path)

    # Separate synthetic vs real
    real_count = df[df['user_id'].str.startswith('REAL_')].shape[0]
    synthetic_count = len(df) - real_count

    print(f"   Total samples: {len(df)}")
    print(f"   - Synthetic: {synthetic_count}")
    print(f"   - Real users: {real_count}")

    # Extract features and labels
    X = df[FEATURE_COLS].values
    y = df['pattern'].map(PATTERN_MAPPING).values

    # Show class distribution
    print(f"\n📊 Class Distribution:")
    for pattern_num in sorted(np.unique(y)):
        pattern_char = REVERSE_PATTERN_MAPPING[pattern_num]
        count = (y == pattern_num).sum()
        pct = (count / len(y)) * 100
        print(f"   Pattern {pattern_char}: {count:3d} ({pct:5.1f}%)")

    return X, y, df


def train_model(X: np.ndarray, y: np.ndarray) -> Tuple[SVC, StandardScaler, Dict]:
    """Train SVM with class balancing for Pattern F priority"""

    print("\n🔧 Preparing Training...")

    # Check for classes with too few samples for stratified split
    class_counts = np.bincount(y, minlength=6)
    min_class_count = class_counts[class_counts > 0].min()

    if min_class_count < 2:
        print(f"   Note: Some classes have <2 samples, using non-stratified split")
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42
        )
    else:
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42, stratify=y
        )

    print(f"   Training set: {len(X_train)} samples")
    print(f"   Test set: {len(X_test)} samples")

    # Standardize features
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)

    # Custom class weights: prioritize Pattern F detection
    # Pattern F (5) gets higher weight for better recall
    class_weights = {
        0: 1.0,  # A
        1: 1.0,  # B
        2: 0.8,  # C (most common, slight down-weight)
        3: 1.0,  # D
        4: 1.0,  # E
        5: 2.0,  # F (critical, up-weight for better recall)
    }

    print("\n🤖 Training SVM Classifier...")
    print(f"   Class weights: Pattern F = 2.0x (critical detection)")

    # Train SVM
    svm = SVC(
        kernel='rbf',
        C=10.0,
        gamma='scale',
        probability=True,
        class_weight=class_weights,
        random_state=42
    )

    svm.fit(X_train_scaled, y_train)

    # Evaluate
    print("\n📈 Evaluating Model...")

    y_pred = svm.predict(X_test_scaled)
    y_pred_train = svm.predict(X_train_scaled)

    # Calculate metrics
    metrics = {
        'train_accuracy': accuracy_score(y_train, y_pred_train),
        'test_accuracy': accuracy_score(y_test, y_pred),
        'per_class': {}
    }

    print(f"\n   Training Accuracy: {metrics['train_accuracy']*100:.1f}%")
    print(f"   Test Accuracy: {metrics['test_accuracy']*100:.1f}%")

    # Per-class metrics
    print("\n📋 Per-Class Test Metrics:")
    print(f"   {'Pattern':<8} {'Precision':<10} {'Recall':<10} {'F1':<10} {'Support':<10}")
    print("   " + "-" * 48)

    for pattern_num in sorted(np.unique(y)):
        pattern_char = REVERSE_PATTERN_MAPPING[pattern_num]

        # Calculate metrics for this class
        mask_true = (y_test == pattern_num)
        mask_pred = (y_pred == pattern_num)

        tp = ((y_test == pattern_num) & (y_pred == pattern_num)).sum()
        fp = ((y_test != pattern_num) & (y_pred == pattern_num)).sum()
        fn = ((y_test == pattern_num) & (y_pred != pattern_num)).sum()

        precision = tp / (tp + fp) if (tp + fp) > 0 else 0
        recall = tp / (tp + fn) if (tp + fn) > 0 else 0
        f1 = 2 * precision * recall / (precision + recall) if (precision + recall) > 0 else 0
        support = mask_true.sum()

        metrics['per_class'][pattern_char] = {
            'precision': precision,
            'recall': recall,
            'f1': f1,
            'support': int(support)
        }

        print(f"   {pattern_char:<8} {precision:.2f}       {recall:.2f}       {f1:.2f}       {support}")

    # Confusion matrix (with all labels to handle missing classes)
    cm = confusion_matrix(y_test, y_pred, labels=[0, 1, 2, 3, 4, 5])
    metrics['confusion_matrix'] = cm.tolist()

    print("\n📊 Confusion Matrix:")
    print("   Predicted ->  A    B    C    D    E    F")
    print("   Actual ↓")
    for i, pattern in enumerate(['A', 'B', 'C', 'D', 'E', 'F']):
        row = '   ' + f"{pattern}  " + '   '.join(f"{cm[i][j]:3d}" for j in range(6))
        print(row)

    # Cross-validation
    print("\n🔄 5-Fold Cross-Validation...")
    X_scaled = scaler.fit_transform(X)
    cv_scores = cross_val_score(svm, X_scaled, y, cv=5, scoring='accuracy')
    metrics['cv_scores'] = cv_scores.tolist()
    metrics['cv_mean'] = cv_scores.mean()
    metrics['cv_std'] = cv_scores.std()

    print(f"   Scores: {[f'{s:.3f}' for s in cv_scores]}")
    print(f"   Mean: {cv_scores.mean():.3f} (±{cv_scores.std():.3f})")

    # Pattern F specific check
    f_metrics = metrics['per_class'].get('F', {})
    f_recall = f_metrics.get('recall', 0)
    print(f"\n⚠️  Pattern F (Critical) Detection:")
    print(f"   Recall: {f_recall*100:.1f}% (Target: >90%)")
    if f_recall >= 0.9:
        print("   ✅ PASS: Pattern F detection meets target")
    else:
        print("   ⚠️  WARNING: Pattern F recall below target")

    return svm, scaler, metrics


def save_model(svm: SVC, scaler: StandardScaler, metrics: Dict, output_dir: Path):
    """Save trained model and metadata"""

    print("\n💾 Saving Model...")

    # Save model
    model_path = output_dir / 'svm_hybrid_model.pkl'
    with open(model_path, 'wb') as f:
        pickle.dump(svm, f)
    print(f"   Model: {model_path}")

    # Save scaler
    scaler_path = output_dir / 'svm_hybrid_scaler.pkl'
    with open(scaler_path, 'wb') as f:
        pickle.dump(scaler, f)
    print(f"   Scaler: {scaler_path}")

    # Save metrics
    metrics['trained_at'] = datetime.now().isoformat()
    metrics['data_source'] = 'hybrid_training_data.csv'
    metrics['model_type'] = 'SVM (RBF kernel)'

    metrics_path = output_dir / 'svm_hybrid_metrics.json'
    with open(metrics_path, 'w') as f:
        json.dump(metrics, f, indent=2)
    print(f"   Metrics: {metrics_path}")

    return model_path, scaler_path, metrics_path


def main():
    script_dir = Path(__file__).parent

    # Load data
    data_path = script_dir / 'hybrid_training_data.csv'
    X, y, df = load_hybrid_data(str(data_path))

    # Train model
    svm, scaler, metrics = train_model(X, y)

    # Save model
    model_path, scaler_path, metrics_path = save_model(svm, scaler, metrics, script_dir)

    print("\n" + "=" * 60)
    print("TRAINING COMPLETE")
    print("=" * 60)
    print(f"""
Summary:
- Total samples: {len(X)} (49 synthetic + 378 real)
- Test accuracy: {metrics['test_accuracy']*100:.1f}%
- CV accuracy: {metrics['cv_mean']*100:.1f}% (±{metrics['cv_std']*100:.1f}%)
- Pattern F recall: {metrics['per_class']['F']['recall']*100:.1f}%

Model files saved to: {script_dir}
""")

    return metrics


if __name__ == '__main__':
    main()
