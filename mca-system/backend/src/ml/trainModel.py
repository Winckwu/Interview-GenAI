"""
Pattern Recognition Model Training Pipeline

Trains three classification models (Random Forest, SVM, Neural Network) on 12-dimensional
metacognitive subprocess features to classify AI usage patterns (A-F).

Target Metrics:
- Overall Accuracy > 85%
- Pattern F Recall > 90% (critical for detecting ineffective use)
- Pattern A/C Precision > 85% (most prevalent patterns)
"""

import pandas as pd
import numpy as np
import warnings
from pathlib import Path
from typing import Dict, Tuple, List

import matplotlib.pyplot as plt
import seaborn as sns

from sklearn.model_selection import train_test_split, cross_val_score, StratifiedKFold
from sklearn.preprocessing import StandardScaler
from sklearn.ensemble import RandomForestClassifier
from sklearn.svm import SVC
from sklearn.neural_network import MLPClassifier
from sklearn.metrics import (
    classification_report, confusion_matrix, accuracy_score,
    precision_score, recall_score, f1_score, roc_auc_score
)

warnings.filterwarnings('ignore')

# Pattern mapping (used throughout the pipeline)
PATTERN_MAPPING = {'A': 0, 'B': 1, 'C': 2, 'D': 3, 'E': 4, 'F': 5}
REVERSE_PATTERN_MAPPING = {v: k for k, v in PATTERN_MAPPING.items()}

# ============================================================================
# 1. DATA LOADING & PREPROCESSING
# ============================================================================

def load_training_data(csv_path: str) -> Tuple[pd.DataFrame, np.ndarray, np.ndarray]:
    """Load and prepare training data"""
    print("📥 Loading training data...")

    df = pd.read_csv(csv_path)

    # Extract features (12 subprocess dimensions)
    feature_cols = ['p1', 'p2', 'p3', 'p4', 'm1', 'm2', 'm3', 'e1', 'e2', 'e3', 'r1', 'r2']
    X = df[feature_cols].values.astype(np.float64)

    # Convert pattern labels to numeric for ML (A=0, B=1, C=2, D=3, E=4, F=5)
    y = df['pattern'].map(PATTERN_MAPPING).values.astype(np.int32)

    print(f"  ✓ Loaded {len(df)} samples")
    print(f"  ✓ Feature dimensions: {X.shape[1]}")
    print(f"\n  Pattern Distribution:")
    for pattern_num in sorted(np.unique(y)):
        pattern_char = REVERSE_PATTERN_MAPPING[pattern_num]
        count = (y == pattern_num).sum()
        pct = (count / len(y)) * 100
        print(f"    Pattern {pattern_char}: {count:3d} ({pct:5.1f}%)")

    return df, X, y


def prepare_train_test_split(X: np.ndarray, y: np.ndarray, test_size: float = 0.2) -> Tuple:
    """Train-test split with stratification when possible"""
    print(f"\n📊 Preparing train-test split...")

    # Check if stratified split is possible
    # Stratification requires each class to have at least 2 samples
    min_class_size = min(np.bincount(y))
    use_stratification = min_class_size >= 2

    if not use_stratification:
        print(f"  ℹ️  Classes with < 2 samples detected (min={min_class_size})")
        print(f"  ℹ️  Using random split (stratification not possible)")
        X_train, X_test, y_train, y_test = train_test_split(
            X, y,
            test_size=test_size,
            random_state=42
        )
    else:
        # Adjust test size if necessary to ensure stratification works
        if min_class_size < 3:
            test_size = 0.15
            print(f"  ℹ️  Adjusted test_size to {test_size} due to small class sizes")

        print(f"  Using stratified split (test_size={test_size})...")

        X_train, X_test, y_train, y_test = train_test_split(
            X, y,
            test_size=test_size,
            stratify=y,
            random_state=42
        )

    print(f"  ✓ Training set: {len(X_train)} samples")
    print(f"  ✓ Test set: {len(X_test)} samples")

    return X_train, X_test, y_train, y_test


# ============================================================================
# 2. MODEL TRAINING
# ============================================================================

def train_random_forest(X_train: np.ndarray, y_train: np.ndarray, **kwargs) -> RandomForestClassifier:
    """Train Random Forest classifier"""
    print("\n🌲 Training Random Forest...")

    model = RandomForestClassifier(
        n_estimators=200,
        max_depth=15,
        min_samples_split=5,
        min_samples_leaf=2,
        random_state=42,
        n_jobs=-1,
        **kwargs
    )

    model.fit(X_train, y_train)
    print("  ✓ Random Forest trained")

    return model


def train_svm(X_train: np.ndarray, y_train: np.ndarray, **kwargs) -> SVC:
    """Train Support Vector Machine classifier"""
    print("\n🎯 Training Support Vector Machine...")

    # Scale features for SVM
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)

    model = SVC(
        kernel='rbf',
        C=1.0,
        gamma='scale',
        probability=True,
        random_state=42,
        **kwargs
    )

    model.fit(X_train_scaled, y_train)
    model.scaler = scaler  # Store scaler with model
    print("  ✓ SVM trained")

    return model


def train_neural_network(X_train: np.ndarray, y_train: np.ndarray, **kwargs) -> MLPClassifier:
    """Train Neural Network classifier"""
    print("\n🧠 Training Neural Network...")

    # Scale features for NN
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)

    model = MLPClassifier(
        hidden_layer_sizes=(128, 64, 32),
        activation='relu',
        alpha=0.001,
        learning_rate='adaptive',
        max_iter=500,
        random_state=42,
        **kwargs
    )

    model.fit(X_train_scaled, y_train)
    model.scaler = scaler  # Store scaler with model
    print("  ✓ Neural Network trained")

    return model


# ============================================================================
# 3. MODEL EVALUATION
# ============================================================================

def evaluate_model(
    model,
    X_train: np.ndarray,
    X_test: np.ndarray,
    y_train: np.ndarray,
    y_test: np.ndarray,
    model_name: str,
    scaler=None
) -> Dict:
    """Comprehensive model evaluation"""

    print(f"\n{'='*70}")
    print(f"📈 {model_name.upper()} EVALUATION")
    print(f"{'='*70}")

    # Prepare data (apply scaler if needed)
    if scaler is not None:
        X_train_eval = scaler.transform(X_train)
        X_test_eval = scaler.transform(X_test)
    else:
        X_train_eval = X_train
        X_test_eval = X_test

    # Predictions
    y_train_pred = model.predict(X_train_eval)
    y_test_pred = model.predict(X_test_eval)

    # Metrics
    train_acc = accuracy_score(y_train, y_train_pred)
    test_acc = accuracy_score(y_test, y_test_pred)

    print(f"\n🎯 Accuracy:")
    print(f"  Training: {train_acc:.4f} ({train_acc*100:.2f}%)")
    print(f"  Testing:  {test_acc:.4f} ({test_acc*100:.2f}%)")

    # Per-pattern metrics
    print(f"\n📊 Per-Pattern Metrics:")
    print(f"{'Pattern':<10} {'Precision':<12} {'Recall':<12} {'F1-Score':<12} {'Support':<10}")
    print("-" * 56)

    report_dict = classification_report(y_test, y_test_pred, output_dict=True)

    for pattern_num in sorted(np.unique(y_test)):
        pattern_char = REVERSE_PATTERN_MAPPING[pattern_num]
        metrics = report_dict.get(pattern_num, {})
        precision = metrics.get('precision', 0)
        recall = metrics.get('recall', 0)
        f1 = metrics.get('f1-score', 0)
        support = int(metrics.get('support', 0))

        print(f"{pattern_char:<10} {precision:<12.4f} {recall:<12.4f} {f1:<12.4f} {support:<10}")

    # Critical metrics
    print(f"\n⚠️  Critical Metrics:")
    f_num = PATTERN_MAPPING['F']
    if f_num in report_dict:
        f_recall = report_dict[f_num].get('recall', 0)
        print(f"  Pattern F Recall: {f_recall:.4f} ({f_recall*100:.2f}%) {'✅' if f_recall > 0.9 else '⚠️'}")

    a_num = PATTERN_MAPPING['A']
    if a_num in report_dict:
        a_precision = report_dict[a_num].get('precision', 0)
        print(f"  Pattern A Precision: {a_precision:.4f} ({a_precision*100:.2f}%) {'✅' if a_precision > 0.85 else '⚠️'}")

    c_num = PATTERN_MAPPING['C']
    if c_num in report_dict:
        c_precision = report_dict[c_num].get('precision', 0)
        print(f"  Pattern C Precision: {c_precision:.4f} ({c_precision*100:.2f}%) {'✅' if c_precision > 0.85 else '⚠️'}")

    # Confusion matrix
    cm = confusion_matrix(y_test, y_test_pred)
    print(f"\n🔢 Confusion Matrix:")
    print(cm)

    # Cross-validation
    print(f"\n🔄 Cross-Validation (5-fold):")
    cv_scores = cross_val_score(
        model, X_test_eval, y_test, cv=5, scoring='accuracy'
    )
    print(f"  Scores: {[f'{s:.4f}' for s in cv_scores]}")
    print(f"  Mean: {cv_scores.mean():.4f} (+/- {cv_scores.std():.4f})")

    return {
        'model_name': model_name,
        'train_accuracy': train_acc,
        'test_accuracy': test_acc,
        'y_test_pred': y_test_pred,
        'cm': cm,
        'report': report_dict,
        'cv_scores': cv_scores
    }


# ============================================================================
# 4. FEATURE IMPORTANCE ANALYSIS
# ============================================================================

def analyze_feature_importance(model, feature_names: List[str], model_name: str):
    """Analyze and visualize feature importance"""

    if not hasattr(model, 'feature_importances_'):
        print(f"\n  ℹ️  {model_name} does not provide feature importance")
        return None

    print(f"\n📊 Feature Importance Analysis ({model_name}):")

    importances = model.feature_importances_
    indices = np.argsort(importances)[::-1]

    print(f"{'Rank':<6} {'Feature':<10} {'Importance':<12} {'Cumulative':<12}")
    print("-" * 42)

    cumulative = 0
    for rank, idx in enumerate(indices[:5], 1):
        cumulative += importances[idx]
        print(f"{rank:<6} {feature_names[idx]:<10} {importances[idx]:<12.4f} {cumulative:<12.4f}")

    return {
        'importances': importances,
        'indices': indices,
        'feature_names': feature_names
    }


# ============================================================================
# 5. MODEL COMPARISON & VISUALIZATION
# ============================================================================

def compare_models(results: Dict[str, Dict]) -> pd.DataFrame:
    """Compare model performance"""

    print(f"\n{'='*70}")
    print("🏆 MODEL COMPARISON")
    print(f"{'='*70}")

    comparison_data = []
    for model_name, result in results.items():
        comparison_data.append({
            'Model': model_name,
            'Train Accuracy': result['train_accuracy'],
            'Test Accuracy': result['test_accuracy'],
            'CV Mean': result['cv_scores'].mean(),
            'CV Std': result['cv_scores'].std()
        })

    comparison_df = pd.DataFrame(comparison_data)
    print("\n" + comparison_df.to_string(index=False))

    # Identify best model
    best_model = comparison_df.loc[comparison_df['Test Accuracy'].idxmax(), 'Model']
    best_acc = comparison_df['Test Accuracy'].max()
    print(f"\n🥇 Best Model: {best_model} (Test Accuracy: {best_acc:.4f})")

    return comparison_df


def visualize_results(results: Dict[str, Dict], output_dir: str):
    """Generate visualization plots"""

    print(f"\n📊 Generating visualizations...")

    output_path = Path(output_dir)
    output_path.mkdir(parents=True, exist_ok=True)

    # 1. Accuracy comparison
    fig, axes = plt.subplots(1, 2, figsize=(14, 5))

    models = list(results.keys())
    train_accs = [results[m]['train_accuracy'] for m in models]
    test_accs = [results[m]['test_accuracy'] for m in models]

    x = np.arange(len(models))
    width = 0.35

    axes[0].bar(x - width/2, train_accs, width, label='Train', alpha=0.8)
    axes[0].bar(x + width/2, test_accs, width, label='Test', alpha=0.8)
    axes[0].set_ylabel('Accuracy')
    axes[0].set_title('Model Accuracy Comparison')
    axes[0].set_xticks(x)
    axes[0].set_xticklabels(models)
    axes[0].legend()
    axes[0].set_ylim([0.7, 1.0])
    axes[0].axhline(y=0.85, color='r', linestyle='--', label='Target (85%)')

    # 2. Cross-validation scores
    for model, result in results.items():
        axes[1].plot(result['cv_scores'], marker='o', label=model)

    axes[1].set_ylabel('CV Fold Score')
    axes[1].set_title('Cross-Validation Performance')
    axes[1].set_xlabel('Fold')
    axes[1].legend()
    axes[1].set_ylim([0.7, 1.0])

    plt.tight_layout()
    plt.savefig(output_path / 'model_comparison.png', dpi=300, bbox_inches='tight')
    print(f"  ✓ Saved: model_comparison.png")

    # 3. Confusion matrices
    fig, axes = plt.subplots(1, 3, figsize=(15, 4))

    for idx, (model_name, result) in enumerate(results.items()):
        cm = result['cm']
        pattern_nums = sorted([int(p) for p in result['report'].keys() if p not in ['accuracy', 'macro avg', 'weighted avg']])
        pattern_labels = [REVERSE_PATTERN_MAPPING[p] for p in pattern_nums]

        sns.heatmap(
            cm, annot=True, fmt='d', cmap='Blues',
            xticklabels=pattern_labels, yticklabels=pattern_labels,
            ax=axes[idx], cbar=False
        )
        axes[idx].set_title(f'{model_name}\n(Accuracy: {result["test_accuracy"]:.4f})')
        axes[idx].set_ylabel('True Label')
        axes[idx].set_xlabel('Predicted Label')

    plt.tight_layout()
    plt.savefig(output_path / 'confusion_matrices.png', dpi=300, bbox_inches='tight')
    print(f"  ✓ Saved: confusion_matrices.png")


# ============================================================================
# 6. MAIN TRAINING PIPELINE
# ============================================================================

def main():
    """Main training pipeline"""

    print("\n" + "="*70)
    print("🚀 PATTERN RECOGNITION MODEL TRAINING PIPELINE")
    print("="*70)

    # Paths
    current_dir = Path(__file__).parent

    # Try datasets in priority order: Hybrid > Augmented > Original
    csv_path = None
    dataset_name = None

    # Priority 1: Hybrid dataset (recommended)
    if (current_dir / 'hybrid_training_data.csv').exists():
        csv_path = current_dir / 'hybrid_training_data.csv'
        dataset_name = "Hybrid"
    # Priority 2: Augmented dataset
    elif (current_dir / 'augmented_training_data.csv').exists():
        csv_path = current_dir / 'augmented_training_data.csv'
        dataset_name = "Augmented"
    # Priority 3: Original dataset
    elif (current_dir / 'training_data.csv').exists():
        csv_path = current_dir / 'training_data.csv'
        dataset_name = "Original"

    output_dir = current_dir / 'models'

    if csv_path is None or not csv_path.exists():
        print(f"❌ No training data found!")
        return

    print(f"📊 Using {dataset_name} Dataset: {csv_path.name}")

    # 1. Load data
    df, X, y = load_training_data(str(csv_path))
    feature_names = ['p1', 'p2', 'p3', 'p4', 'm1', 'm2', 'm3', 'e1', 'e2', 'e3', 'r1', 'r2']

    # 2. Split data
    X_train, X_test, y_train, y_test = prepare_train_test_split(X, y, test_size=0.2)

    # 3. Train models
    print("\n" + "="*70)
    print("🤖 TRAINING MODELS")
    print("="*70)

    rf_model = train_random_forest(X_train, y_train)
    svm_model = train_svm(X_train, y_train)
    nn_model = train_neural_network(X_train, y_train)

    # 4. Evaluate models
    results = {}

    results['Random Forest'] = evaluate_model(
        rf_model, X_train, X_test, y_train, y_test,
        'Random Forest'
    )

    # Need to pass scaler for SVM
    results['SVM'] = evaluate_model(
        svm_model, X_train, X_test, y_train, y_test,
        'SVM', scaler=svm_model.scaler
    )

    # Need to pass scaler for NN
    results['Neural Network'] = evaluate_model(
        nn_model, X_train, X_test, y_train, y_test,
        'Neural Network', scaler=nn_model.scaler
    )

    # 5. Feature importance
    print("\n" + "="*70)
    print("🔍 FEATURE IMPORTANCE")
    print("="*70)

    analyze_feature_importance(rf_model, feature_names, 'Random Forest')

    # 6. Model comparison
    comparison_df = compare_models(results)

    # 7. Visualizations
    visualize_results(results, output_dir)

    # 8. Final summary
    print("\n" + "="*70)
    print("✅ TRAINING COMPLETE")
    print("="*70)

    best_model_name = comparison_df.loc[comparison_df['Test Accuracy'].idxmax(), 'Model']
    best_acc = comparison_df['Test Accuracy'].max()

    print(f"\n🏆 Best Model: {best_model_name}")
    print(f"   Test Accuracy: {best_acc:.4f} ({best_acc*100:.2f}%)")

    # Check target metrics
    print(f"\n📋 Target Metrics:")
    print(f"  Overall Accuracy > 85%: {'✅' if best_acc > 0.85 else '⚠️'}")

    best_result = results[best_model_name]
    f_num = PATTERN_MAPPING['F']
    if f_num in best_result['report']:
        f_recall = best_result['report'][f_num].get('recall', 0)
        print(f"  Pattern F Recall > 90%: {'✅' if f_recall > 0.9 else '⚠️'} ({f_recall*100:.2f}%)")

    a_num = PATTERN_MAPPING['A']
    if a_num in best_result['report']:
        a_prec = best_result['report'][a_num].get('precision', 0)
        print(f"  Pattern A Precision > 85%: {'✅' if a_prec > 0.85 else '⚠️'} ({a_prec*100:.2f}%)")

    print(f"\n💾 Output directory: {output_dir}")
    print(f"   ✓ model_comparison.png")
    print(f"   ✓ confusion_matrices.png")

    return results, comparison_df


if __name__ == '__main__':
    results, comparison_df = main()
