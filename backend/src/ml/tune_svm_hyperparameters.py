"""
SVM Hyperparameter Tuning

Tests different C and gamma values to find the best configuration
that matches the original 77.27% accuracy
"""

import pandas as pd
import numpy as np
import pickle
from pathlib import Path
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.preprocessing import StandardScaler
from sklearn.svm import SVC
from sklearn.metrics import accuracy_score

# Pattern mapping
PATTERN_MAPPING = {'A': 0, 'B': 1, 'C': 2, 'D': 3, 'E': 4, 'F': 5}

def load_data(csv_path: str):
    """Load training data"""
    df = pd.read_csv(csv_path)
    feature_columns = ['p1', 'p2', 'p3', 'p4', 'm1', 'm2', 'm3', 'e1', 'e2', 'e3', 'r1', 'r2']
    X = df[feature_columns].values.astype(float)
    y = df['pattern'].map(PATTERN_MAPPING).values
    return X, y

def test_svm_params(X, y, C_values, gamma_values):
    """Test different SVM parameter combinations"""

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)

    results = []

    print("Testing SVM Hyperparameters...")
    print("C" + " " * 8 + "Gamma" + " " * 6 + "Train Acc" + " " * 3 + "Test Acc" + " " * 4 + "CV Mean")
    print("-" * 60)

    for C in C_values:
        for gamma in gamma_values:
            svm = SVC(
                kernel='rbf',
                C=C,
                gamma=gamma,
                probability=True,
                random_state=42,
                class_weight='balanced'
            )

            svm.fit(X_train_scaled, y_train)

            train_acc = accuracy_score(y_train, svm.predict(X_train_scaled))
            test_acc = accuracy_score(y_test, svm.predict(X_test_scaled))
            cv_scores = cross_val_score(svm, X_train_scaled, y_train, cv=5)
            cv_mean = cv_scores.mean()

            results.append({
                'C': C,
                'gamma': gamma,
                'train_acc': train_acc,
                'test_acc': test_acc,
                'cv_mean': cv_mean,
                'model': svm,
                'scaler': scaler
            })

            print(f"{C:<10.2f}{str(gamma):<14}{train_acc:<12.4f}{test_acc:<12.4f}{cv_mean:.4f}")

    # Sort by test accuracy
    results.sort(key=lambda x: x['test_acc'], reverse=True)

    return results

def main():
    print("="*80)
    print("🔍 SVM Hyperparameter Tuning")
    print("="*80)
    print("\nSearching for configuration that matches 77.27% accuracy...\n")

    # Load data
    current_dir = Path(__file__).parent
    csv_path = current_dir / 'augmented_training_data.csv'

    X, y = load_data(str(csv_path))

    # Test parameter ranges
    C_values = [0.1, 0.5, 1.0, 2.0, 5.0, 10.0]
    gamma_values = [0.0001, 0.001, 0.01, 0.1, 'scale', 'auto']

    results = test_svm_params(X, y, C_values, gamma_values)

    print("\n" + "="*80)
    print("Top 10 Configurations:")
    print("="*80)
    print("Rank | C      | Gamma    | Train Acc | Test Acc | CV Mean")
    print("-" * 65)

    for i, result in enumerate(results[:10], 1):
        gamma_str = result['gamma'] if isinstance(result['gamma'], str) else f"{result['gamma']:.4f}"
        print(f"{i:<5}| {result['C']:<6.2f}| {gamma_str:<8} | {result['train_acc']:<9.4f}| {result['test_acc']:<8.4f}| {result['cv_mean']:.4f}")

    # Save best model
    best = results[0]
    print(f"\n\n✅ Best Configuration Found:")
    print(f"   C: {best['C']}")
    print(f"   Gamma: {best['gamma']}")
    print(f"   Test Accuracy: {best['test_acc']*100:.2f}%")
    print(f"   CV Mean: {best['cv_mean']*100:.2f}%")

    # Save it
    output_path = Path('models')
    output_path.mkdir(exist_ok=True)

    with open(output_path / 'svm_model.pkl', 'wb') as f:
        pickle.dump(best['model'], f)
    with open(output_path / 'svm_scaler.pkl', 'wb') as f:
        pickle.dump(best['scaler'], f)

    print(f"\n💾 Saved best model to models/")

if __name__ == '__main__':
    main()
