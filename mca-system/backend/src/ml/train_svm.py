"""
SVM Pattern Classifier - Train and Save Model

Trains an SVM classifier on the training dataset and saves it for use in the system.
"""

import pandas as pd
import numpy as np
import pickle
import json
from pathlib import Path
from typing import Tuple
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.preprocessing import StandardScaler
from sklearn.svm import SVC
from sklearn.metrics import (
    classification_report, confusion_matrix, accuracy_score,
    precision_score, recall_score, f1_score
)

# Pattern mapping
PATTERN_MAPPING = {'A': 0, 'B': 1, 'C': 2, 'D': 3, 'E': 4, 'F': 5}
REVERSE_PATTERN_MAPPING = {v: k for k, v in PATTERN_MAPPING.items()}

# Feature names (12 behavioral signals)
FEATURE_NAMES = [
    'p1_task_decomposition',      # 0
    'p2_goal_clarity',             # 1
    'p3_strategy',                 # 2
    'p4_preparation',              # 3
    'm1_verification',             # 4
    'm2_quality_check',            # 5
    'm3_context_awareness',        # 6
    'e1_output_evaluation',        # 7
    'e2_reflection_depth',         # 8
    'e3_capability_judgment',      # 9
    'r1_iteration_count',          # 10
    'r2_trust_calibration',        # 11
]

def load_training_data(csv_path: str) -> Tuple[np.ndarray, np.ndarray]:
    """Load and prepare training data from CSV"""
    print(f"📥 Loading training data from {csv_path}...")

    df = pd.read_csv(csv_path)

    # Extract features (p1-r2)
    feature_columns = ['p1', 'p2', 'p3', 'p4', 'm1', 'm2', 'm3', 'e1', 'e2', 'e3', 'r1', 'r2']
    X = df[feature_columns].values

    # Extract labels (pattern A-F)
    y = df['pattern'].map(PATTERN_MAPPING).values

    print(f"✅ Loaded {len(X)} samples with {X.shape[1]} features")
    print(f"   Class distribution: {np.bincount(y)}")

    return X, y


def train_svm_model(X_train: np.ndarray, y_train: np.ndarray,
                    X_test: np.ndarray, y_test: np.ndarray) -> Tuple[SVC, StandardScaler]:
    """Train SVM classifier with optimal hyperparameters"""

    print("\n🤖 Training SVM Classifier...")

    # Standardize features (crucial for SVM)
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)

    # Train SVM with RBF kernel (handles non-linear patterns well)
    svm = SVC(
        kernel='rbf',
        C=10.0,              # Regularization parameter
        gamma='scale',       # Kernel coefficient
        probability=True,    # Enable probability estimates
        class_weight='balanced',  # Handle class imbalance
        random_state=42
    )

    svm.fit(X_train_scaled, y_train)

    # Evaluate on training set
    y_train_pred = svm.predict(X_train_scaled)
    train_acc = accuracy_score(y_train, y_train_pred)

    # Evaluate on test set
    y_test_pred = svm.predict(X_test_scaled)
    test_acc = accuracy_score(y_test, y_test_pred)

    print(f"✅ Training Accuracy: {train_acc:.4f} ({train_acc*100:.2f}%)")
    print(f"✅ Test Accuracy: {test_acc:.4f} ({test_acc*100:.2f}%)")

    # Cross-validation
    cv_scores = cross_val_score(svm, X_train_scaled, y_train, cv=5, scoring='accuracy')
    print(f"✅ Cross-Validation Accuracy: {cv_scores.mean():.4f} (+/- {cv_scores.std():.4f})")

    # Detailed classification report
    print("\n📊 Classification Report:")
    report = classification_report(
        y_test, y_test_pred,
        target_names=[REVERSE_PATTERN_MAPPING[i] for i in range(6)],
        digits=4
    )
    print(report)

    # Confusion matrix
    cm = confusion_matrix(y_test, y_test_pred)
    print("\n📊 Confusion Matrix:")
    print("     A    B    C    D    E    F")
    for i, row in enumerate(cm):
        label = REVERSE_PATTERN_MAPPING[i]
        print(f"{label}  {row}")

    # Pattern F specific metrics (high-risk)
    f_idx = PATTERN_MAPPING['F']
    f_predictions = y_test_pred == f_idx
    f_actual = y_test == f_idx
    f_tp = np.sum(f_predictions & f_actual)
    f_total = np.sum(f_actual)
    f_recall = f_tp / f_total if f_total > 0 else 0

    print(f"\n🚨 Pattern F (High-Risk) Detection:")
    print(f"   Recall: {f_recall:.4f} ({f_recall*100:.2f}%)")
    print(f"   Correctly Detected: {f_tp}/{f_total}")

    return svm, scaler, {
        'train_accuracy': train_acc,
        'test_accuracy': test_acc,
        'cv_mean': cv_scores.mean(),
        'cv_std': cv_scores.std(),
        'pattern_f_recall': f_recall,
        'classification_report': report,
        'confusion_matrix': cm.tolist()
    }


def save_model(svm: SVC, scaler: StandardScaler, output_dir: str = 'models'):
    """Save trained model and scaler"""

    output_path = Path(output_dir)
    output_path.mkdir(parents=True, exist_ok=True)

    # Save SVM model
    model_path = output_path / 'svm_model.pkl'
    with open(model_path, 'wb') as f:
        pickle.dump(svm, f)
    print(f"\n💾 Saved SVM model: {model_path}")

    # Save scaler
    scaler_path = output_path / 'svm_scaler.pkl'
    with open(scaler_path, 'wb') as f:
        pickle.dump(scaler, f)
    print(f"💾 Saved scaler: {scaler_path}")

    # Save feature names
    features_path = output_path / 'feature_names.json'
    with open(features_path, 'w') as f:
        json.dump(FEATURE_NAMES, f, indent=2)
    print(f"💾 Saved feature names: {features_path}")

    # Save pattern mapping
    mapping_path = output_path / 'pattern_mapping.json'
    with open(mapping_path, 'w') as f:
        json.dump({
            'pattern_to_id': PATTERN_MAPPING,
            'id_to_pattern': REVERSE_PATTERN_MAPPING
        }, f, indent=2)
    print(f"💾 Saved pattern mapping: {mapping_path}")


def main():
    print("="*80)
    print("🚀 SVM Pattern Classifier Training Pipeline")
    print("="*80)

    # Load data
    csv_path = 'augmented_training_data.csv'  # Use the largest dataset
    X, y = load_training_data(csv_path)

    # Split data
    print(f"\n📊 Splitting data (80% train, 20% test)...")
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    print(f"   Train set: {len(X_train)} samples")
    print(f"   Test set: {len(X_test)} samples")

    # Train SVM
    svm, scaler, metrics = train_svm_model(X_train, y_train, X_test, y_test)

    # Save model
    save_model(svm, scaler, output_dir='models')

    print("\n" + "="*80)
    print("✅ Training Complete!")
    print("="*80)
    print(f"\n📈 Summary:")
    print(f"   Test Accuracy: {metrics['test_accuracy']*100:.2f}%")
    print(f"   Pattern F Recall: {metrics['pattern_f_recall']*100:.2f}%")
    print(f"\n💡 Model saved to 'models/' directory")
    print(f"   Ready for use in TypeScript/Node.js backend")


if __name__ == '__main__':
    main()
