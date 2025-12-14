"""
Train CatBoost Pattern Classification Model
============================================
Trains and saves the CatBoost model using LLM-annotated training data.

Based on multi-model comparison results:
- Best model: CatBoost
- Bootstrap accuracy: 93.0% (+/-1.6%)
- Pattern F Recall: 97.9%
- Pattern F Precision: 98.1%

CatBoost is a gradient boosting library that:
- Handles categorical features natively
- Reduces overfitting with ordered boosting
- Works well with imbalanced classes
"""

import pandas as pd
import numpy as np
import json
import pickle
from pathlib import Path
from datetime import datetime
from catboost import CatBoostClassifier
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.metrics import classification_report, confusion_matrix, accuracy_score, recall_score, precision_score

PATTERN_MAPPING = {'A': 0, 'B': 1, 'C': 2, 'D': 3, 'E': 4, 'F': 5}
REVERSE_PATTERN_MAPPING = {v: k for k, v in PATTERN_MAPPING.items()}
FEATURE_COLS = ['p1', 'p2', 'p3', 'p4', 'm1', 'm2', 'm3', 'e1', 'e2', 'e3', 'r1', 'r2']


def bootstrap_validation(X, y, n_rounds=3, test_size=0.2):
    """
    Three-round bootstrap validation matching thesis methodology.
    """
    results = []
    scaler = StandardScaler()

    for round_num in range(n_rounds):
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=test_size, random_state=42 + round_num
        )

        X_train_scaled = scaler.fit_transform(X_train)
        X_test_scaled = scaler.transform(X_test)

        model = CatBoostClassifier(
            iterations=500,
            depth=6,
            learning_rate=0.1,
            loss_function='MultiClass',
            class_weights={0: 1.0, 1: 1.0, 2: 1.0, 3: 1.0, 4: 10.0, 5: 1.5},  # Balance for rare classes
            random_seed=42 + round_num,
            verbose=False
        )
        model.fit(X_train_scaled, y_train)
        y_pred = model.predict(X_test_scaled).flatten()

        acc = accuracy_score(y_test, y_pred)

        # Pattern F metrics
        y_test_f = (y_test == PATTERN_MAPPING['F']).astype(int)
        y_pred_f = (y_pred == PATTERN_MAPPING['F']).astype(int)
        f_recall = recall_score(y_test_f, y_pred_f, zero_division=0)
        f_precision = precision_score(y_test_f, y_pred_f, zero_division=0)

        results.append({
            'round': round_num + 1,
            'accuracy': acc,
            'pattern_f_recall': f_recall,
            'pattern_f_precision': f_precision
        })

    return results


def train_and_save_model():
    script_dir = Path(__file__).parent
    models_dir = script_dir / 'models'
    models_dir.mkdir(exist_ok=True)

    print("=" * 70)
    print("TRAINING CATBOOST PATTERN CLASSIFICATION MODEL")
    print("=" * 70)

    # Load data
    data_path = script_dir / 'llm_annotated_training_data.csv'
    df = pd.read_csv(data_path)
    X = df[FEATURE_COLS].values
    y = df['pattern'].map(PATTERN_MAPPING).values

    print(f"\nDataset: {len(X)} samples")
    print(f"Features: {len(FEATURE_COLS)}")

    # Pattern distribution
    print("\nPattern Distribution:")
    for p in ['A', 'B', 'C', 'D', 'E', 'F']:
        count = (y == PATTERN_MAPPING[p]).sum()
        pct = (count / len(y)) * 100
        print(f"   {p}: {count} ({pct:.1f}%)")

    # Scale features
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)

    # Bootstrap validation
    print("\n3-Round Bootstrap Validation:")
    bootstrap_results = bootstrap_validation(X, y)

    accs = [r['accuracy'] for r in bootstrap_results]
    f_recalls = [r['pattern_f_recall'] for r in bootstrap_results]

    for r in bootstrap_results:
        print(f"   Round {r['round']}: {r['accuracy']*100:.1f}% (F Recall: {r['pattern_f_recall']*100:.1f}%)")

    print(f"\n   Mean Accuracy: {np.mean(accs)*100:.1f}% (+/-{np.std(accs)*100:.1f}%)")
    print(f"   Mean F Recall: {np.mean(f_recalls)*100:.1f}% (+/-{np.std(f_recalls)*100:.1f}%)")

    # Train final model on full dataset
    print("\nTraining CatBoost on full dataset...")
    model = CatBoostClassifier(
        iterations=500,
        depth=6,
        learning_rate=0.1,
        loss_function='MultiClass',
        class_weights={0: 1.0, 1: 1.0, 2: 1.0, 3: 1.0, 4: 10.0, 5: 1.5},
        random_seed=42,
        verbose=False
    )
    model.fit(X_scaled, y)

    # Cross-validation score
    print("\nCross-Validation (5-fold):")
    cv_scores = cross_val_score(model, X_scaled, y, cv=5, scoring='accuracy')
    print(f"   Scores: {[f'{s*100:.1f}%' for s in cv_scores]}")
    print(f"   Mean: {cv_scores.mean()*100:.1f}% (+/-{cv_scores.std()*100:.1f}%)")

    # Train/test split for detailed evaluation
    X_train, X_test, y_train, y_test = train_test_split(
        X_scaled, y, test_size=0.2, random_state=42
    )
    model_eval = CatBoostClassifier(
        iterations=500, depth=6, learning_rate=0.1,
        loss_function='MultiClass',
        class_weights={0: 1.0, 1: 1.0, 2: 1.0, 3: 1.0, 4: 10.0, 5: 1.5},
        random_seed=42, verbose=False
    )
    model_eval.fit(X_train, y_train)
    y_pred = model_eval.predict(X_test).flatten()

    print("\nTest Set Evaluation:")
    print(f"   Accuracy: {accuracy_score(y_test, y_pred)*100:.1f}%")

    # Per-class metrics
    print("\nPer-Class Metrics:")
    for pattern_num in range(6):
        pattern_char = REVERSE_PATTERN_MAPPING[pattern_num]
        mask = (y_test == pattern_num)
        if mask.sum() > 0:
            tp = ((y_test == pattern_num) & (y_pred == pattern_num)).sum()
            fn = ((y_test == pattern_num) & (y_pred != pattern_num)).sum()
            recall = tp / (tp + fn) if (tp + fn) > 0 else 0
            print(f"   {pattern_char}: Recall = {recall*100:.1f}% (n={mask.sum()})")

    # Save model and scaler
    catboost_model_path = models_dir / 'catboost_model.pkl'
    catboost_scaler_path = models_dir / 'catboost_scaler.pkl'

    with open(catboost_model_path, 'wb') as f:
        pickle.dump(model, f)
    with open(catboost_scaler_path, 'wb') as f:
        pickle.dump(scaler, f)

    # Also save as native CatBoost format
    model.save_model(str(models_dir / 'catboost_model.cbm'))

    print(f"\nModel saved to: {catboost_model_path}")
    print(f"Scaler saved to: {catboost_scaler_path}")
    print(f"Native format: {models_dir / 'catboost_model.cbm'}")

    # Save metadata
    metadata = {
        'training_date': datetime.now().isoformat(),
        'data_source': 'llm_annotated_training_data.csv',
        'total_samples': len(X),
        'model_type': 'CatBoost',
        'model_params': {
            'iterations': 500,
            'depth': 6,
            'learning_rate': 0.1,
            'loss_function': 'MultiClass'
        },
        'bootstrap_validation': {
            'n_rounds': 3,
            'mean_accuracy': float(np.mean(accs)),
            'std_accuracy': float(np.std(accs)),
            'mean_f_recall': float(np.mean(f_recalls)),
            'std_f_recall': float(np.std(f_recalls)),
            'rounds': bootstrap_results
        },
        'cv_accuracy_mean': float(cv_scores.mean()),
        'cv_accuracy_std': float(cv_scores.std()),
        'pattern_distribution': {
            REVERSE_PATTERN_MAPPING[i]: int((y == i).sum())
            for i in range(6)
        },
        'feature_columns': FEATURE_COLS,
        'notes': 'CatBoost model trained on LLM-annotated real user data (378 users). Best accuracy among all models tested.'
    }

    metadata_path = models_dir / 'catboost_model_metadata.json'
    with open(metadata_path, 'w') as f:
        json.dump(metadata, f, indent=2, default=str)

    print(f"Metadata saved to: {metadata_path}")

    print("\nTraining complete!")

    return model, scaler, metadata


if __name__ == '__main__':
    train_and_save_model()
