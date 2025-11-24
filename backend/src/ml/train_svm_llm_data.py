"""
Train Final SVM Model with LLM-Annotated Data
==============================================
Trains and saves the optimized SVM model using LLM-annotated training data.

Based on multi-model comparison results:
- Best model: SVM (RBF, C=10)
- Bootstrap accuracy: 92.1% (±3.2%)
- Pattern F Recall: 98.9% (±1.5%)
"""

import pandas as pd
import numpy as np
import json
import pickle
from pathlib import Path
from datetime import datetime
from sklearn.svm import SVC
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.metrics import classification_report, confusion_matrix, accuracy_score

PATTERN_MAPPING = {'A': 0, 'B': 1, 'C': 2, 'D': 3, 'E': 4, 'F': 5}
REVERSE_PATTERN_MAPPING = {v: k for k, v in PATTERN_MAPPING.items()}
FEATURE_COLS = ['p1', 'p2', 'p3', 'p4', 'm1', 'm2', 'm3', 'e1', 'e2', 'e3', 'r1', 'r2']


def train_and_save_model():
    script_dir = Path(__file__).parent

    print("=" * 70)
    print("TRAINING FINAL SVM MODEL WITH LLM-ANNOTATED DATA")
    print("=" * 70)

    # Load data
    data_path = script_dir / 'llm_annotated_training_data.csv'
    df = pd.read_csv(data_path)
    X = df[FEATURE_COLS].values
    y = df['pattern'].map(PATTERN_MAPPING).values

    print(f"\n📊 Dataset: {len(X)} samples")
    print(f"   Features: {len(FEATURE_COLS)}")

    # Pattern distribution
    print("\n📈 Pattern Distribution:")
    for p in ['A', 'B', 'C', 'D', 'E', 'F']:
        count = (y == PATTERN_MAPPING[p]).sum()
        pct = (count / len(y)) * 100
        print(f"   {p}: {count} ({pct:.1f}%)")

    # Scale features
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)

    # Train final model on full dataset
    print("\n🔧 Training SVM (RBF, C=10) on full dataset...")
    model = SVC(
        kernel='rbf',
        C=10.0,
        gamma='scale',
        probability=True,
        class_weight='balanced',
        random_state=42
    )
    model.fit(X_scaled, y)

    # Cross-validation score
    print("\n📊 Cross-Validation (5-fold):")
    cv_scores = cross_val_score(model, X_scaled, y, cv=5, scoring='accuracy')
    print(f"   Scores: {[f'{s*100:.1f}%' for s in cv_scores]}")
    print(f"   Mean: {cv_scores.mean()*100:.1f}% (±{cv_scores.std()*100:.1f}%)")

    # Train/test split for detailed evaluation
    X_train, X_test, y_train, y_test = train_test_split(
        X_scaled, y, test_size=0.2, random_state=42
    )
    model_eval = SVC(
        kernel='rbf', C=10.0, gamma='scale',
        probability=True, class_weight='balanced', random_state=42
    )
    model_eval.fit(X_train, y_train)
    y_pred = model_eval.predict(X_test)

    print("\n📊 Test Set Evaluation:")
    print(f"   Accuracy: {accuracy_score(y_test, y_pred)*100:.1f}%")

    # Per-class metrics
    print("\n📊 Per-Class Metrics:")
    for pattern_num in range(6):
        pattern_char = REVERSE_PATTERN_MAPPING[pattern_num]
        mask = (y_test == pattern_num)
        if mask.sum() > 0:
            tp = ((y_test == pattern_num) & (y_pred == pattern_num)).sum()
            fn = ((y_test == pattern_num) & (y_pred != pattern_num)).sum()
            recall = tp / (tp + fn) if (tp + fn) > 0 else 0
            print(f"   {pattern_char}: Recall = {recall*100:.1f}% (n={mask.sum()})")

    # Save model and scaler
    model_path = script_dir / 'svm_llm_model.pkl'
    scaler_path = script_dir / 'svm_llm_scaler.pkl'

    with open(model_path, 'wb') as f:
        pickle.dump(model, f)
    with open(scaler_path, 'wb') as f:
        pickle.dump(scaler, f)

    print(f"\n💾 Model saved to: {model_path}")
    print(f"💾 Scaler saved to: {scaler_path}")

    # Save metadata
    metadata = {
        'training_date': datetime.now().isoformat(),
        'data_source': 'llm_annotated_training_data.csv',
        'total_samples': len(X),
        'model_type': 'SVM',
        'kernel': 'rbf',
        'C': 10.0,
        'gamma': 'scale',
        'cv_accuracy_mean': float(cv_scores.mean()),
        'cv_accuracy_std': float(cv_scores.std()),
        'pattern_distribution': {
            REVERSE_PATTERN_MAPPING[i]: int((y == i).sum())
            for i in range(6)
        },
        'feature_columns': FEATURE_COLS,
        'notes': 'Trained on LLM-annotated real user data (378 users)'
    }

    metadata_path = script_dir / 'svm_llm_model_metadata.json'
    with open(metadata_path, 'w') as f:
        json.dump(metadata, f, indent=2)

    print(f"📝 Metadata saved to: {metadata_path}")

    print("\n✅ Training complete!")

    return model, scaler, metadata


if __name__ == '__main__':
    train_and_save_model()
