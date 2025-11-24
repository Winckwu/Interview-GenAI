"""
Multi-Model Comparison with LLM-Annotated Data
================================================
Compares multiple ML algorithms using the new LLM-annotated training data.
Includes three-round bootstrap validation for robust accuracy estimates.
"""

import pandas as pd
import numpy as np
import json
import time
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Tuple
from collections import defaultdict

from sklearn.model_selection import train_test_split, cross_val_score, StratifiedKFold
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    confusion_matrix, classification_report
)

# Models
from sklearn.svm import SVC
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier, AdaBoostClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.neighbors import KNeighborsClassifier
from sklearn.naive_bayes import GaussianNB
from sklearn.tree import DecisionTreeClassifier
from sklearn.neural_network import MLPClassifier

# Pattern mapping
PATTERN_MAPPING = {'A': 0, 'B': 1, 'C': 2, 'D': 3, 'E': 4, 'F': 5}
REVERSE_PATTERN_MAPPING = {v: k for k, v in PATTERN_MAPPING.items()}
FEATURE_COLS = ['p1', 'p2', 'p3', 'p4', 'm1', 'm2', 'm3', 'e1', 'e2', 'e3', 'r1', 'r2']


def load_data(csv_path: str) -> Tuple[np.ndarray, np.ndarray, pd.DataFrame]:
    """Load LLM-annotated training data"""
    df = pd.read_csv(csv_path)
    X = df[FEATURE_COLS].values
    y = df['pattern'].map(PATTERN_MAPPING).values
    return X, y, df


def get_models() -> Dict:
    """Define all models to compare"""
    return {
        'SVM (RBF, C=10)': SVC(
            kernel='rbf', C=10.0, gamma='scale',
            probability=True, class_weight='balanced', random_state=42
        ),
        'SVM (RBF, C=1)': SVC(
            kernel='rbf', C=1.0, gamma='scale',
            probability=True, class_weight='balanced', random_state=42
        ),
        'SVM (Linear)': SVC(
            kernel='linear', C=1.0,
            probability=True, class_weight='balanced', random_state=42
        ),
        'Random Forest': RandomForestClassifier(
            n_estimators=100, max_depth=10,
            class_weight='balanced', random_state=42
        ),
        'Gradient Boosting': GradientBoostingClassifier(
            n_estimators=100, max_depth=5,
            random_state=42
        ),
        'AdaBoost': AdaBoostClassifier(
            n_estimators=100, random_state=42
        ),
        'Logistic Regression': LogisticRegression(
            max_iter=1000, class_weight='balanced',
            multi_class='multinomial', random_state=42
        ),
        'KNN (k=5)': KNeighborsClassifier(
            n_neighbors=5, weights='distance'
        ),
        'KNN (k=3)': KNeighborsClassifier(
            n_neighbors=3, weights='distance'
        ),
        'Naive Bayes': GaussianNB(),
        'Decision Tree': DecisionTreeClassifier(
            max_depth=10, class_weight='balanced', random_state=42
        ),
        'MLP Neural Network': MLPClassifier(
            hidden_layer_sizes=(64, 32), max_iter=500,
            random_state=42, early_stopping=True
        ),
    }


def evaluate_model(model, X_train, X_test, y_train, y_test, model_name: str) -> Dict:
    """Train and evaluate a single model"""
    start_time = time.time()
    model.fit(X_train, y_train)
    train_time = time.time() - start_time

    y_pred = model.predict(X_test)
    y_pred_train = model.predict(X_train)

    results = {
        'model_name': model_name,
        'train_accuracy': accuracy_score(y_train, y_pred_train),
        'test_accuracy': accuracy_score(y_test, y_pred),
        'train_time_seconds': train_time,
        'per_class': {}
    }

    # Per-class metrics
    for pattern_num in range(6):
        pattern_char = REVERSE_PATTERN_MAPPING[pattern_num]
        mask_true = (y_test == pattern_num)

        tp = ((y_test == pattern_num) & (y_pred == pattern_num)).sum()
        fp = ((y_test != pattern_num) & (y_pred == pattern_num)).sum()
        fn = ((y_test == pattern_num) & (y_pred != pattern_num)).sum()

        precision = tp / (tp + fp) if (tp + fp) > 0 else 0
        recall = tp / (tp + fn) if (tp + fn) > 0 else 0
        f1 = 2 * precision * recall / (precision + recall) if (precision + recall) > 0 else 0
        support = mask_true.sum()

        results['per_class'][pattern_char] = {
            'precision': round(precision, 4),
            'recall': round(recall, 4),
            'f1': round(f1, 4),
            'support': int(support)
        }

    # Pattern F specific metrics (critical)
    results['pattern_f_recall'] = results['per_class']['F']['recall']
    results['pattern_f_precision'] = results['per_class']['F']['precision']
    results['pattern_f_f1'] = results['per_class']['F']['f1']

    # Macro averages
    active_patterns = [p for p in ['A', 'B', 'C', 'D', 'E', 'F'] if results['per_class'][p]['support'] > 0]
    results['macro_precision'] = round(np.mean([results['per_class'][p]['precision'] for p in active_patterns]), 4)
    results['macro_recall'] = round(np.mean([results['per_class'][p]['recall'] for p in active_patterns]), 4)
    results['macro_f1'] = round(np.mean([results['per_class'][p]['f1'] for p in active_patterns]), 4)

    return results


def bootstrap_validation(X, y, model_class, n_rounds=3, test_size=0.2) -> Dict:
    """
    Three-round bootstrap validation for robust accuracy estimation.
    """
    results = []
    scaler = StandardScaler()

    for round_num in range(n_rounds):
        # Random split with different seed
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=test_size, random_state=42 + round_num
        )

        X_train_scaled = scaler.fit_transform(X_train)
        X_test_scaled = scaler.transform(X_test)

        # Create fresh model instance
        model = model_class()
        model.fit(X_train_scaled, y_train)
        y_pred = model.predict(X_test_scaled)

        acc = accuracy_score(y_test, y_pred)

        # Pattern F recall
        f_mask = (y_test == PATTERN_MAPPING['F'])
        f_pred = (y_pred == PATTERN_MAPPING['F'])
        f_recall = (f_mask & f_pred).sum() / f_mask.sum() if f_mask.sum() > 0 else 0

        results.append({
            'round': round_num + 1,
            'accuracy': acc,
            'pattern_f_recall': f_recall
        })

    return {
        'rounds': results,
        'mean_accuracy': np.mean([r['accuracy'] for r in results]),
        'std_accuracy': np.std([r['accuracy'] for r in results]),
        'mean_f_recall': np.mean([r['pattern_f_recall'] for r in results]),
        'std_f_recall': np.std([r['pattern_f_recall'] for r in results])
    }


def run_full_comparison():
    """Run complete model comparison with bootstrap validation"""
    script_dir = Path(__file__).parent
    data_path = script_dir / 'llm_annotated_training_data.csv'

    print("=" * 80)
    print("MULTI-MODEL COMPARISON WITH LLM-ANNOTATED DATA")
    print("=" * 80)

    # Load data
    print(f"\n📂 Loading data from: {data_path}")
    X, y, df = load_data(str(data_path))
    print(f"   Total samples: {len(X)}")
    print(f"   Features: {len(FEATURE_COLS)}")

    # Pattern distribution
    print("\n📊 Pattern Distribution in Training Data:")
    for pattern in ['A', 'B', 'C', 'D', 'E', 'F']:
        count = (y == PATTERN_MAPPING[pattern]).sum()
        pct = (count / len(y)) * 100
        print(f"   {pattern}: {count} ({pct:.1f}%)")

    # Split data (without stratify due to rare classes)
    # Filter out classes with < 2 samples for stable training
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )
    print(f"\n📊 Data Split:")
    print(f"   Training set: {len(X_train)}")
    print(f"   Test set: {len(X_test)}")

    # Standardize
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)
    X_scaled = scaler.fit_transform(X)

    # Get models
    models = get_models()
    all_results = []

    print("\n" + "=" * 80)
    print("TRAINING AND EVALUATING MODELS")
    print("=" * 80)

    for model_name, model in models.items():
        print(f"\n🔧 {model_name}...")

        # Evaluate
        results = evaluate_model(
            model, X_train_scaled, X_test_scaled,
            y_train, y_test, model_name
        )

        # Cross-validation
        model_fresh = get_models()[model_name]
        try:
            cv_scores = cross_val_score(model_fresh, X_scaled, y, cv=5, scoring='accuracy')
            results['cv_mean'] = round(cv_scores.mean(), 4)
            results['cv_std'] = round(cv_scores.std(), 4)
        except:
            results['cv_mean'] = 0
            results['cv_std'] = 0

        all_results.append(results)

        print(f"   Test Accuracy: {results['test_accuracy']*100:.1f}%")
        print(f"   CV Accuracy: {results['cv_mean']*100:.1f}% (±{results['cv_std']*100:.1f}%)")
        print(f"   Pattern F Recall: {results['pattern_f_recall']*100:.1f}%")

    # Sort by test accuracy
    all_results.sort(key=lambda x: x['test_accuracy'], reverse=True)

    # Print comparison table
    print("\n" + "=" * 80)
    print("COMPARISON RESULTS (Sorted by Test Accuracy)")
    print("=" * 80)

    print(f"\n{'Model':<25} {'Test Acc':<10} {'CV Acc':<14} {'F Recall':<10} {'Macro F1':<10}")
    print("-" * 75)

    for r in all_results:
        print(f"{r['model_name']:<25} "
              f"{r['test_accuracy']*100:>6.1f}%   "
              f"{r['cv_mean']*100:>5.1f}±{r['cv_std']*100:.1f}%    "
              f"{r['pattern_f_recall']*100:>6.1f}%   "
              f"{r['macro_f1']:>6.4f}")

    # Best model
    best = all_results[0]
    print("\n" + "=" * 80)
    print("🏆 BEST MODEL")
    print("=" * 80)
    print(f"""
   Model: {best['model_name']}
   Test Accuracy: {best['test_accuracy']*100:.1f}%
   CV Accuracy: {best['cv_mean']*100:.1f}% (±{best['cv_std']*100:.1f}%)
   Pattern F Recall: {best['pattern_f_recall']*100:.1f}%
   Pattern F Precision: {best['pattern_f_precision']*100:.1f}%
   Macro F1: {best['macro_f1']:.4f}
""")

    # Three-round bootstrap validation for top 3 models
    print("=" * 80)
    print("THREE-ROUND BOOTSTRAP VALIDATION (Top 3 Models)")
    print("=" * 80)

    top_3_models = {
        'SVM (RBF, C=10)': lambda: SVC(kernel='rbf', C=10.0, gamma='scale', probability=True, class_weight='balanced', random_state=42),
        'Random Forest': lambda: RandomForestClassifier(n_estimators=100, max_depth=10, class_weight='balanced', random_state=42),
        'Gradient Boosting': lambda: GradientBoostingClassifier(n_estimators=100, max_depth=5, random_state=42)
    }

    bootstrap_results = {}
    for model_name, model_factory in top_3_models.items():
        print(f"\n🔄 Bootstrap validation for {model_name}...")
        bv_results = bootstrap_validation(X, y, model_factory, n_rounds=3)
        bootstrap_results[model_name] = bv_results

        print(f"   Round 1: {bv_results['rounds'][0]['accuracy']*100:.1f}%")
        print(f"   Round 2: {bv_results['rounds'][1]['accuracy']*100:.1f}%")
        print(f"   Round 3: {bv_results['rounds'][2]['accuracy']*100:.1f}%")
        print(f"   Mean: {bv_results['mean_accuracy']*100:.1f}% (±{bv_results['std_accuracy']*100:.1f}%)")
        print(f"   Pattern F Recall: {bv_results['mean_f_recall']*100:.1f}% (±{bv_results['std_f_recall']*100:.1f}%)")

    # Save results
    output = {
        'comparison_date': datetime.now().isoformat(),
        'data_source': 'llm_annotated_training_data.csv',
        'total_samples': len(X),
        'pattern_distribution': {
            REVERSE_PATTERN_MAPPING[i]: int((y == i).sum())
            for i in range(6)
        },
        'model_results': all_results,
        'bootstrap_validation': bootstrap_results,
        'best_model': {
            'name': best['model_name'],
            'test_accuracy': best['test_accuracy'],
            'cv_accuracy': best['cv_mean'],
            'pattern_f_recall': best['pattern_f_recall']
        }
    }

    output_path = script_dir / 'llm_model_comparison_results.json'
    with open(output_path, 'w') as f:
        json.dump(output, f, indent=2, default=str)

    print(f"\n💾 Results saved to: {output_path}")

    return output


if __name__ == '__main__':
    run_full_comparison()
