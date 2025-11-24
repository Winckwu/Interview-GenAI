"""
Multi-Model Comparison for Pattern Classification
==================================================
Compares multiple ML algorithms on the hybrid training dataset.

Models compared:
1. Support Vector Machine (SVM) - RBF kernel
2. Random Forest
3. Logistic Regression
4. K-Nearest Neighbors (KNN)
5. Gradient Boosting
6. Naive Bayes
7. Decision Tree
8. Multi-Layer Perceptron (MLP)

Metrics evaluated:
- Overall Accuracy
- Cross-Validation Score
- Per-class Precision, Recall, F1
- Pattern F Recall (critical metric)
- Training Time
"""

import pandas as pd
import numpy as np
import json
import time
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Tuple

from sklearn.model_selection import train_test_split, cross_val_score, StratifiedKFold
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    confusion_matrix, classification_report
)

# Models
from sklearn.svm import SVC
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.neighbors import KNeighborsClassifier
from sklearn.naive_bayes import GaussianNB
from sklearn.tree import DecisionTreeClassifier
from sklearn.neural_network import MLPClassifier

# Pattern mapping
PATTERN_MAPPING = {'A': 0, 'B': 1, 'C': 2, 'D': 3, 'E': 4, 'F': 5}
REVERSE_PATTERN_MAPPING = {v: k for k, v in PATTERN_MAPPING.items()}
FEATURE_COLS = ['p1', 'p2', 'p3', 'p4', 'm1', 'm2', 'm3', 'e1', 'e2', 'e3', 'r1', 'r2']


def load_data(csv_path: str) -> Tuple[np.ndarray, np.ndarray]:
    """Load hybrid training data"""
    df = pd.read_csv(csv_path)
    X = df[FEATURE_COLS].values
    y = df['pattern'].map(PATTERN_MAPPING).values
    return X, y


def get_models() -> Dict:
    """Define all models to compare"""
    return {
        'SVM (RBF)': SVC(
            kernel='rbf', C=10.0, gamma='scale',
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

    # Train
    start_time = time.time()
    model.fit(X_train, y_train)
    train_time = time.time() - start_time

    # Predict
    y_pred = model.predict(X_test)
    y_pred_train = model.predict(X_train)

    # Calculate metrics
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
    results['macro_precision'] = round(np.mean([
        results['per_class'][p]['precision'] for p in ['A', 'B', 'C', 'D', 'E', 'F']
        if results['per_class'][p]['support'] > 0
    ]), 4)
    results['macro_recall'] = round(np.mean([
        results['per_class'][p]['recall'] for p in ['A', 'B', 'C', 'D', 'E', 'F']
        if results['per_class'][p]['support'] > 0
    ]), 4)
    results['macro_f1'] = round(np.mean([
        results['per_class'][p]['f1'] for p in ['A', 'B', 'C', 'D', 'E', 'F']
        if results['per_class'][p]['support'] > 0
    ]), 4)

    return results


def cross_validate_model(model, X, y, cv=5) -> Dict:
    """Perform cross-validation"""
    try:
        scores = cross_val_score(model, X, y, cv=cv, scoring='accuracy')
        return {
            'cv_scores': [round(s, 4) for s in scores],
            'cv_mean': round(scores.mean(), 4),
            'cv_std': round(scores.std(), 4)
        }
    except Exception as e:
        return {
            'cv_scores': [],
            'cv_mean': 0,
            'cv_std': 0,
            'cv_error': str(e)
        }


def run_comparison(data_path: str) -> Dict:
    """Run full model comparison"""

    print("=" * 70)
    print("MULTI-MODEL COMPARISON FOR PATTERN CLASSIFICATION")
    print("=" * 70)

    # Load data
    print(f"\n📂 Loading data from: {data_path}")
    X, y = load_data(data_path)
    print(f"   Total samples: {len(X)}")
    print(f"   Features: {len(FEATURE_COLS)}")

    # Split data
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )
    print(f"   Training set: {len(X_train)}")
    print(f"   Test set: {len(X_test)}")

    # Standardize features
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)
    X_scaled = scaler.fit_transform(X)

    # Get models
    models = get_models()

    # Results storage
    all_results = []

    print("\n" + "=" * 70)
    print("TRAINING AND EVALUATING MODELS")
    print("=" * 70)

    for model_name, model in models.items():
        print(f"\n🔧 {model_name}...")

        # Train and evaluate
        results = evaluate_model(
            model, X_train_scaled, X_test_scaled,
            y_train, y_test, model_name
        )

        # Cross-validation (with fresh model instance)
        model_fresh = get_models()[model_name]
        cv_results = cross_validate_model(model_fresh, X_scaled, y, cv=5)
        results.update(cv_results)

        all_results.append(results)

        print(f"   Test Accuracy: {results['test_accuracy']*100:.1f}%")
        print(f"   CV Accuracy: {results['cv_mean']*100:.1f}% (±{results['cv_std']*100:.1f}%)")
        print(f"   Pattern F Recall: {results['pattern_f_recall']*100:.1f}%")
        print(f"   Train Time: {results['train_time_seconds']:.3f}s")

    # Sort by test accuracy
    all_results.sort(key=lambda x: x['test_accuracy'], reverse=True)

    return {
        'comparison_date': datetime.now().isoformat(),
        'dataset': {
            'total_samples': len(X),
            'train_samples': len(X_train),
            'test_samples': len(X_test),
            'features': len(FEATURE_COLS)
        },
        'results': all_results
    }


def print_comparison_table(results: Dict):
    """Print formatted comparison table"""

    print("\n" + "=" * 70)
    print("COMPARISON RESULTS (Sorted by Test Accuracy)")
    print("=" * 70)

    # Header
    print(f"\n{'Model':<25} {'Test Acc':<10} {'CV Acc':<12} {'F Recall':<10} {'F1 Macro':<10} {'Time':<8}")
    print("-" * 75)

    for r in results['results']:
        print(f"{r['model_name']:<25} "
              f"{r['test_accuracy']*100:>6.1f}%   "
              f"{r['cv_mean']*100:>5.1f}±{r['cv_std']*100:.1f}%  "
              f"{r['pattern_f_recall']*100:>6.1f}%   "
              f"{r['macro_f1']:>6.4f}   "
              f"{r['train_time_seconds']:>6.3f}s")

    # Best model summary
    best = results['results'][0]
    print("\n" + "=" * 70)
    print("BEST MODEL SUMMARY")
    print("=" * 70)
    print(f"""
🏆 Best Model: {best['model_name']}
   - Test Accuracy: {best['test_accuracy']*100:.1f}%
   - CV Accuracy: {best['cv_mean']*100:.1f}% (±{best['cv_std']*100:.1f}%)
   - Pattern F Recall: {best['pattern_f_recall']*100:.1f}%
   - Pattern F Precision: {best['pattern_f_precision']*100:.1f}%
   - Macro F1: {best['macro_f1']:.4f}
   - Training Time: {best['train_time_seconds']:.3f}s
""")

    # Pattern F analysis
    print("=" * 70)
    print("PATTERN F DETECTION ANALYSIS (Critical Metric)")
    print("=" * 70)
    print(f"\n{'Model':<25} {'F Precision':<12} {'F Recall':<12} {'F F1':<12}")
    print("-" * 60)

    # Sort by Pattern F recall
    f_sorted = sorted(results['results'], key=lambda x: x['pattern_f_recall'], reverse=True)
    for r in f_sorted:
        status = "✅" if r['pattern_f_recall'] >= 0.9 else "⚠️"
        print(f"{r['model_name']:<25} "
              f"{r['pattern_f_precision']*100:>8.1f}%   "
              f"{r['pattern_f_recall']*100:>8.1f}%   "
              f"{r['pattern_f_f1']:>8.4f}  {status}")


def generate_latex_table(results: Dict) -> str:
    """Generate LaTeX table for paper"""

    latex = r"""
\begin{table}[htbp]
\centering
\caption{Comparison of Machine Learning Models for User Pattern Classification}
\label{tab:model_comparison}
\begin{tabular}{lcccccc}
\toprule
\textbf{Model} & \textbf{Test Acc.} & \textbf{CV Acc.} & \textbf{F Recall} & \textbf{Macro F1} & \textbf{Time (s)} \\
\midrule
"""

    for r in results['results']:
        latex += f"{r['model_name']} & {r['test_accuracy']*100:.1f}\\% & {r['cv_mean']*100:.1f}±{r['cv_std']*100:.1f}\\% & {r['pattern_f_recall']*100:.1f}\\% & {r['macro_f1']:.3f} & {r['train_time_seconds']:.3f} \\\\\n"

    latex += r"""
\bottomrule
\end{tabular}
\end{table}
"""
    return latex


def main():
    script_dir = Path(__file__).parent
    data_path = script_dir / 'hybrid_training_data.csv'
    output_path = script_dir / 'model_comparison_results.json'
    latex_path = script_dir / 'model_comparison_table.tex'

    # Run comparison
    results = run_comparison(str(data_path))

    # Print results
    print_comparison_table(results)

    # Save JSON results
    with open(output_path, 'w') as f:
        json.dump(results, f, indent=2)
    print(f"\n💾 Results saved to: {output_path}")

    # Generate and save LaTeX table
    latex_table = generate_latex_table(results)
    with open(latex_path, 'w') as f:
        f.write(latex_table)
    print(f"📝 LaTeX table saved to: {latex_path}")

    return results


if __name__ == '__main__':
    main()
