"""
SVM Pattern Classifier - Final Optimized Training

Uses tuned hyperparameters:
- C: 0.1
- Gamma: 0.1
- Achieves ~73% accuracy (close to original 77%)
"""

import pandas as pd
import numpy as np
import pickle
import json
from pathlib import Path
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.preprocessing import StandardScaler
from sklearn.svm import SVC
from sklearn.metrics import (
    classification_report, confusion_matrix, accuracy_score
)

# Pattern mapping
PATTERN_MAPPING = {'A': 0, 'B': 1, 'C': 2, 'D': 3, 'E': 4, 'F': 5}
REVERSE_PATTERN_MAPPING = {v: k for k, v in PATTERN_MAPPING.items()}

# Feature names
FEATURE_NAMES = [
    'p1_task_decomposition',
    'p2_goal_clarity',
    'p3_strategy',
    'p4_preparation',
    'm1_verification',
    'm2_quality_check',
    'm3_context_awareness',
    'e1_output_evaluation',
    'e2_reflection_depth',
    'e3_capability_judgment',
    'r1_iteration_count',
    'r2_trust_calibration',
]

def load_training_data(csv_path: str) -> tuple:
    """Load training data"""
    print(f"📥 Loading training data from {csv_path}...")
    df = pd.read_csv(csv_path)
    feature_columns = ['p1', 'p2', 'p3', 'p4', 'm1', 'm2', 'm3', 'e1', 'e2', 'e3', 'r1', 'r2']
    X = df[feature_columns].values.astype(float)
    y = df['pattern'].map(PATTERN_MAPPING).values
    print(f"✅ Loaded {len(X)} samples with {X.shape[1]} features")
    print(f"   Class distribution: {np.bincount(y)}")
    return df, X, y


def train_and_evaluate(X_train, y_train, X_test, y_test):
    """Train SVM with optimized parameters"""
    print("\n🤖 Training SVM with Optimized Parameters...")
    print("   C: 0.1 (tuned)")
    print("   Gamma: 0.1 (tuned)")
    print("   Kernel: RBF")

    # Scale features
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)

    # Train with optimized parameters
    svm = SVC(
        kernel='rbf',
        C=0.1,              # ✅ Tuned
        gamma=0.1,          # ✅ Tuned
        probability=True,
        random_state=42,
        class_weight='balanced'
    )

    svm.fit(X_train_scaled, y_train)

    # Evaluate
    y_train_pred = svm.predict(X_train_scaled)
    y_test_pred = svm.predict(X_test_scaled)

    train_acc = accuracy_score(y_train, y_train_pred)
    test_acc = accuracy_score(y_test, y_test_pred)

    print(f"\n✅ Training Accuracy: {train_acc*100:.2f}%")
    print(f"✅ Test Accuracy: {test_acc*100:.2f}%")

    # Cross-validation
    cv_scores = cross_val_score(svm, X_train_scaled, y_train, cv=5)
    print(f"✅ Cross-Validation: {cv_scores.mean()*100:.2f}% (+/- {cv_scores.std()*100:.2f}%)")

    # Classification report
    print("\n📊 Classification Report:")
    print(classification_report(
        y_test, y_test_pred,
        target_names=[REVERSE_PATTERN_MAPPING[i] for i in range(6)],
        digits=4
    ))

    # Pattern F metrics
    f_idx = PATTERN_MAPPING['F']
    f_tp = np.sum((y_test_pred == f_idx) & (y_test == f_idx))
    f_total = np.sum(y_test == f_idx)
    f_recall = f_tp / f_total if f_total > 0 else 0

    print(f"🚨 Pattern F Detection:")
    print(f"   Recall: {f_recall*100:.2f}%")
    print(f"   Detected: {f_tp}/{f_total}")

    return svm, scaler


def save_model(svm, scaler, output_dir='models'):
    """Save model and scaler"""
    output_path = Path(output_dir)
    output_path.mkdir(parents=True, exist_ok=True)

    # Save model
    with open(output_path / 'svm_model.pkl', 'wb') as f:
        pickle.dump(svm, f)
    print(f"\n💾 Saved SVM model: {output_path / 'svm_model.pkl'}")

    # Save scaler
    with open(output_path / 'svm_scaler.pkl', 'wb') as f:
        pickle.dump(scaler, f)
    print(f"💾 Saved scaler: {output_path / 'svm_scaler.pkl'}")

    # Save feature names
    with open(output_path / 'feature_names.json', 'w') as f:
        json.dump(FEATURE_NAMES, f, indent=2)
    print(f"💾 Saved feature names: {output_path / 'feature_names.json'}")

    # Save pattern mapping
    with open(output_path / 'pattern_mapping.json', 'w') as f:
        json.dump({
            'pattern_to_id': PATTERN_MAPPING,
            'id_to_pattern': REVERSE_PATTERN_MAPPING
        }, f, indent=2)
    print(f"💾 Saved pattern mapping: {output_path / 'pattern_mapping.json'}")


def main():
    print("="*80)
    print("🚀 SVM Pattern Classifier - FINAL Optimized Training")
    print("="*80)
    print("\n🎯 Using Tuned Hyperparameters:")
    print("   C: 0.1 (vs original 1.0, better than 10.0)")
    print("   Gamma: 0.1 (vs original scale)")
    print("   Expected: ~73% accuracy (close to 77%)")

    current_dir = Path(__file__).parent

    # Use augmented dataset (largest)
    csv_path = current_dir / 'augmented_training_data.csv'
    if not csv_path.exists():
        print(f"❌ File not found: {csv_path}")
        return

    # Load data
    df, X, y = load_training_data(str(csv_path))

    # Split
    print(f"\n📊 Splitting data (80/20)...")
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    print(f"   Train: {len(X_train)}, Test: {len(X_test)}")

    # Train
    svm, scaler = train_and_evaluate(X_train, y_train, X_test, y_test)

    # Save
    save_model(svm, scaler, output_dir='models')

    print("\n" + "="*80)
    print("✅ SVM Model Ready!")
    print("="*80)
    print("\n🎉 Model files saved to 'models/'")
    print("   - svm_model.pkl (trained classifier)")
    print("   - svm_scaler.pkl (StandardScaler)")
    print("   - feature_names.json (feature mapping)")
    print("   - pattern_mapping.json (pattern IDs)")
    print("\n✨ Ready for deployment in Python microservice")


if __name__ == '__main__':
    main()
