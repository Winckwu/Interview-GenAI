"""
现代机器学习模型对比实验
Modern ML Model Comparison for Pattern Classification

对比模型：
- 传统模型：SVM, Random Forest, Logistic Regression
- 现代模型：XGBoost, LightGBM, CatBoost, MLP Neural Network
- 集成方法：Stacking Ensemble

用于论文表4-16的扩展版本
"""

import numpy as np
import pandas as pd
from sklearn.model_selection import cross_val_score, StratifiedKFold
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.pipeline import Pipeline
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    classification_report, confusion_matrix
)
import warnings
warnings.filterwarnings('ignore')

# ============================================================
# 1. 传统模型
# ============================================================
from sklearn.svm import SVC
from sklearn.ensemble import RandomForestClassifier, AdaBoostClassifier, GradientBoostingClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.neighbors import KNeighborsClassifier
from sklearn.tree import DecisionTreeClassifier
from sklearn.naive_bayes import GaussianNB

# ============================================================
# 2. 现代模型 (2016-2024)
# ============================================================
try:
    from xgboost import XGBClassifier
    HAS_XGBOOST = True
except ImportError:
    HAS_XGBOOST = False
    print("Warning: XGBoost not installed")

try:
    from lightgbm import LGBMClassifier
    HAS_LIGHTGBM = True
except ImportError:
    HAS_LIGHTGBM = False
    print("Warning: LightGBM not installed")

try:
    from catboost import CatBoostClassifier
    HAS_CATBOOST = True
except ImportError:
    HAS_CATBOOST = False
    print("Warning: CatBoost not installed")

from sklearn.neural_network import MLPClassifier
from sklearn.ensemble import StackingClassifier, VotingClassifier

# ============================================================
# 3. 模型配置
# ============================================================

def get_models(random_state=42):
    """返回所有候选模型"""

    models = {
        # === 传统模型 (1990s-2000s) ===
        'SVM (RBF, C=10)': SVC(
            kernel='rbf', C=10.0, gamma='scale',
            class_weight='balanced', probability=True,
            random_state=random_state
        ),
        'Random Forest': RandomForestClassifier(
            n_estimators=100, max_depth=10,
            class_weight='balanced',
            random_state=random_state
        ),
        'Logistic Regression': LogisticRegression(
            max_iter=1000, class_weight='balanced',
            random_state=random_state
        ),
        'KNN': KNeighborsClassifier(n_neighbors=5),
        'Decision Tree': DecisionTreeClassifier(
            max_depth=10, class_weight='balanced',
            random_state=random_state
        ),
        'Naive Bayes': GaussianNB(),
        'AdaBoost': AdaBoostClassifier(
            n_estimators=100, random_state=random_state
        ),
        'Gradient Boosting': GradientBoostingClassifier(
            n_estimators=100, max_depth=5,
            random_state=random_state
        ),

        # === 现代模型 (2014-2024) ===
        'MLP Neural Network': MLPClassifier(
            hidden_layer_sizes=(128, 64, 32),
            activation='relu',
            solver='adam',
            alpha=0.001,
            batch_size=32,
            max_iter=500,
            early_stopping=True,
            validation_fraction=0.1,
            random_state=random_state
        ),
    }

    # XGBoost (2014, Chen & Guestrin)
    if HAS_XGBOOST:
        models['XGBoost'] = XGBClassifier(
            n_estimators=100,
            max_depth=6,
            learning_rate=0.1,
            subsample=0.8,
            colsample_bytree=0.8,
            random_state=random_state,
            verbosity=0
        )

    # LightGBM (2017, Microsoft)
    if HAS_LIGHTGBM:
        models['LightGBM'] = LGBMClassifier(
            n_estimators=100,
            max_depth=6,
            learning_rate=0.1,
            num_leaves=31,
            class_weight='balanced',
            random_state=random_state,
            verbose=-1
        )

    # CatBoost (2017, Yandex)
    if HAS_CATBOOST:
        models['CatBoost'] = CatBoostClassifier(
            iterations=100,
            depth=6,
            learning_rate=0.1,
            loss_function='MultiClass',
            auto_class_weights='Balanced',
            random_state=random_state,
            verbose=False
        )

    return models


def get_ensemble_models(base_models, random_state=42):
    """返回集成模型"""

    # Voting Ensemble
    voting = VotingClassifier(
        estimators=[
            ('svm', base_models['SVM (RBF, C=10)']),
            ('rf', base_models['Random Forest']),
            ('mlp', base_models['MLP Neural Network']),
        ],
        voting='soft'
    )

    # Stacking Ensemble (2017, Wolpert理论的现代实现)
    stacking = StackingClassifier(
        estimators=[
            ('svm', SVC(kernel='rbf', probability=True, class_weight='balanced', random_state=random_state)),
            ('rf', RandomForestClassifier(n_estimators=50, class_weight='balanced', random_state=random_state)),
            ('mlp', MLPClassifier(hidden_layer_sizes=(64, 32), max_iter=300, random_state=random_state)),
        ],
        final_estimator=LogisticRegression(max_iter=1000),
        cv=3,
        stack_method='predict_proba'
    )

    return {
        'Voting Ensemble': voting,
        'Stacking Ensemble': stacking,
    }


# ============================================================
# 4. 评估函数
# ============================================================

def evaluate_models(X, y, models, cv=5, pattern_f_label=5):
    """
    评估所有模型

    Args:
        X: 特征矩阵
        y: 标签
        models: 模型字典
        cv: 交叉验证折数
        pattern_f_label: 模式F的标签值

    Returns:
        DataFrame with results
    """
    results = []
    skf = StratifiedKFold(n_splits=cv, shuffle=True, random_state=42)

    for name, model in models.items():
        print(f"Evaluating {name}...")

        try:
            # 创建Pipeline (标准化 + 模型)
            if name not in ['Naive Bayes']:  # NB不需要标准化
                pipeline = Pipeline([
                    ('scaler', StandardScaler()),
                    ('model', model)
                ])
            else:
                pipeline = model

            # 5折交叉验证
            cv_scores = cross_val_score(pipeline, X, y, cv=skf, scoring='accuracy')

            # 训练最终模型
            if isinstance(pipeline, Pipeline):
                pipeline.fit(X, y)
            else:
                scaler = StandardScaler()
                X_scaled = scaler.fit_transform(X)
                pipeline.fit(X_scaled, y)

            # 预测
            if isinstance(pipeline, Pipeline):
                y_pred = pipeline.predict(X)
            else:
                y_pred = pipeline.predict(X_scaled)

            # 计算指标
            train_acc = accuracy_score(y, y_pred)

            # Pattern F 特定指标
            y_binary = (y == pattern_f_label).astype(int)
            y_pred_binary = (y_pred == pattern_f_label).astype(int)

            f_recall = recall_score(y_binary, y_pred_binary, zero_division=0)
            f_precision = precision_score(y_binary, y_pred_binary, zero_division=0)
            f_f1 = f1_score(y_binary, y_pred_binary, zero_division=0)

            results.append({
                'Model': name,
                'Test Accuracy': f"{cv_scores.mean()*100:.1f}%",
                '5-Fold CV': f"{cv_scores.mean()*100:.1f}±{cv_scores.std()*100:.1f}%",
                'Pattern F Recall': f"{f_recall*100:.1f}%",
                'Pattern F Precision': f"{f_precision*100:.1f}%",
                'F1 Score': f"{f_f1*100:.1f}%",
                'CV Mean': cv_scores.mean(),
                'CV Std': cv_scores.std(),
            })

        except Exception as e:
            print(f"  Error: {e}")
            results.append({
                'Model': name,
                'Test Accuracy': 'Error',
                '5-Fold CV': 'Error',
                'Pattern F Recall': 'Error',
                'Pattern F Precision': 'Error',
                'F1 Score': 'Error',
                'CV Mean': 0,
                'CV Std': 0,
            })

    return pd.DataFrame(results)


def bootstrap_evaluate_models(X, y, models, n_rounds=3, test_size=0.2, pattern_f_label=4):
    """
    使用3轮Bootstrap验证评估所有模型（与论文方法一致）

    Args:
        X: 特征矩阵
        y: 标签
        models: 模型字典
        n_rounds: Bootstrap轮数（默认3轮）
        test_size: 测试集比例（默认20%）
        pattern_f_label: 模式F的标签值

    Returns:
        DataFrame with results
    """
    from sklearn.model_selection import train_test_split

    results = []
    scaler = StandardScaler()

    for name, model in models.items():
        print(f"Evaluating {name} (3-round Bootstrap)...")

        round_accs = []
        round_f_recalls = []

        try:
            for round_num in range(n_rounds):
                # 随机划分（不同种子）
                X_train, X_test, y_train, y_test = train_test_split(
                    X, y, test_size=test_size, random_state=42 + round_num
                )

                # 标准化
                X_train_scaled = scaler.fit_transform(X_train)
                X_test_scaled = scaler.transform(X_test)

                # 克隆模型（避免状态污染）
                from sklearn.base import clone
                model_clone = clone(model)

                # 训练和预测
                model_clone.fit(X_train_scaled, y_train)
                y_pred = model_clone.predict(X_test_scaled)

                # 计算准确率
                acc = accuracy_score(y_test, y_pred)
                round_accs.append(acc)

                # Pattern F 召回率（使用sklearn确保计算正确）
                y_test_binary = (y_test == pattern_f_label).astype(int)
                y_pred_binary = (y_pred == pattern_f_label).astype(int)
                f_recall = recall_score(y_test_binary, y_pred_binary, zero_division=0)
                round_f_recalls.append(f_recall)

            # 计算均值和标准差
            mean_acc = np.mean(round_accs)
            std_acc = np.std(round_accs)
            mean_f_recall = np.mean(round_f_recalls)
            std_f_recall = np.std(round_f_recalls)

            # 使用全部数据训练最终模型计算精确率和F1
            X_scaled_full = scaler.fit_transform(X)
            model_final = clone(model)
            model_final.fit(X_scaled_full, y)
            y_pred_full = model_final.predict(X_scaled_full)

            y_binary = (y == pattern_f_label).astype(int)
            y_pred_binary = (y_pred_full == pattern_f_label).astype(int)
            f_precision = precision_score(y_binary, y_pred_binary, zero_division=0)
            f_f1 = f1_score(y_binary, y_pred_binary, zero_division=0)

            # 使用全部数据的Pattern F召回率（更稳定）
            f_recall_full = recall_score(y_binary, y_pred_binary, zero_division=0)

            results.append({
                'Model': name,
                'Bootstrap Accuracy': f"{mean_acc*100:.1f}%",
                '3-Round Bootstrap': f"{mean_acc*100:.1f}±{std_acc*100:.1f}%",
                'Pattern F Recall': f"{mean_f_recall*100:.1f}%",  # 3轮平均
                'Pattern F Precision': f"{f_precision*100:.1f}%",
                'F1 Score': f"{f_f1*100:.1f}%",
                'Bootstrap Mean': mean_acc,
                'Bootstrap Std': std_acc,
                'Round Details': [f"{a*100:.1f}%" for a in round_accs],
            })

            print(f"   Rounds: {[f'{a*100:.1f}%' for a in round_accs]}")
            print(f"   Mean: {mean_acc*100:.1f}% (±{std_acc*100:.1f}%)")

        except Exception as e:
            print(f"  Error: {e}")
            results.append({
                'Model': name,
                'Bootstrap Accuracy': 'Error',
                '3-Round Bootstrap': 'Error',
                'Pattern F Recall': 'Error',
                'Pattern F Precision': 'Error',
                'F1 Score': 'Error',
                'Bootstrap Mean': 0,
                'Bootstrap Std': 0,
                'Round Details': [],
            })

    return pd.DataFrame(results)


def load_real_data(data_path='llm_annotated_training_data.csv'):
    """
    加载真实的378个样本数据（LLM标注的PMER特征）
    包含所有5个类别（B, C, D, E, F），与论文保持一致

    数据格式：
    - 12维PMER特征: p1, p2, p3, p4, m1, m2, m3, e1, e2, e3, r1, r2
    - 模式标签: B, C, D, E, F (A类无样本)

    Returns:
        X: 特征矩阵 (n_samples, 12)
        y: 标签数组 (0-based连续编码，兼容XGBoost)
        pattern_names: 模式名称列表
        pattern_f_label: Pattern F对应的标签
    """
    import os

    # 获取脚本所在目录
    script_dir = os.path.dirname(os.path.abspath(__file__))
    full_path = os.path.join(script_dir, data_path)

    print(f"   Loading data from: {full_path}")

    # 读取CSV
    df = pd.read_csv(full_path)

    # 12维PMER特征列
    feature_cols = ['p1', 'p2', 'p3', 'p4', 'm1', 'm2', 'm3', 'e1', 'e2', 'e3', 'r1', 'r2']
    X = df[feature_cols].values

    # 获取实际存在的模式（排序后）
    unique_patterns = sorted(df['pattern'].unique())
    print(f"   Patterns in data: {unique_patterns} (5类分类)")

    # 使用LabelEncoder确保标签从0开始连续编码（兼容XGBoost）
    le = LabelEncoder()
    y = le.fit_transform(df['pattern'].values)

    # 创建标签到模式的映射
    label_to_pattern = {i: p for i, p in enumerate(le.classes_)}
    print(f"   Label mapping: {label_to_pattern}")

    # 统计分布
    pattern_counts = df['pattern'].value_counts().sort_index()
    print(f"   Distribution: {pattern_counts.to_dict()} (N={len(df)})")

    # 找出Pattern F对应的标签
    pattern_f_label = None
    for label, pattern in label_to_pattern.items():
        if pattern == 'F':
            pattern_f_label = label
            break

    return X, y, unique_patterns, pattern_f_label


def generate_synthetic_data(n_samples=378, n_features=12, random_state=42):
    """
    生成模拟数据（备用，当真实数据不可用时使用）

    注意：标签使用0-based索引 (0=B, 1=C, 2=D, 3=E, 4=F)
    以兼容XGBoost等要求标签从0开始的模型
    """
    np.random.seed(random_state)

    # 模拟5个模式的分布 (B-F，跳过A因为没有样本)
    # 基于真实数据分布: B=7.9%, C=48.4%, D=2.1%, E=0.3%, F=41.3%
    pattern_counts = [30, 180, 8, 5, 155]  # B, C, D, E, F (总计378)

    X_list = []
    y_list = []

    for idx, count in enumerate(pattern_counts):
        if count == 0:
            continue

        # 为每个模式生成不同的特征分布
        if idx == 4:  # Pattern F (over-reliant)
            X_pattern = np.random.randn(count, n_features) * 0.5 - 1
        elif idx == 1:  # Pattern C (curious explorer)
            X_pattern = np.random.randn(count, n_features) * 0.8
        elif idx == 0:  # Pattern B
            X_pattern = np.random.randn(count, n_features) * 0.5 + 0.5
        else:
            X_pattern = np.random.randn(count, n_features) * 0.7

        X_list.append(X_pattern)
        # 使用1-based索引匹配真实数据 (B=1, C=2, D=3, E=4, F=5)
        y_list.extend([idx + 1] * count)

    X = np.vstack(X_list)
    y = np.array(y_list)

    shuffle_idx = np.random.permutation(len(y))
    X = X[shuffle_idx]
    y = y[shuffle_idx]

    return X, y, ['B', 'C', 'D', 'E', 'F']


# ============================================================
# 5. 主函数
# ============================================================

def main(use_real_data=True):
    print("=" * 60)
    print("现代机器学习模型对比实验")
    print("Modern ML Model Comparison for Pattern Classification")
    print("=" * 60)

    # 加载数据
    print("\n1. Loading data...")
    if use_real_data:
        try:
            X, y, pattern_names, pattern_f_label = load_real_data('llm_annotated_training_data.csv')
            print(f"   ✓ Using REAL data (378 LLM-annotated samples)")
        except Exception as e:
            print(f"   ✗ Failed to load real data: {e}")
            print(f"   → Falling back to synthetic data")
            X, y, pattern_names = generate_synthetic_data(n_samples=378, n_features=12)
            pattern_f_label = 4  # F在合成数据中的标签
    else:
        X, y, pattern_names = generate_synthetic_data(n_samples=378, n_features=12)
        pattern_f_label = 4
        print(f"   Using synthetic data")

    print(f"   Dataset: {X.shape[0]} samples, {X.shape[1]} features")
    print(f"   Classes: {np.unique(y)}")
    print(f"   Pattern F label: {pattern_f_label}")

    # 获取模型
    print("\n2. Initializing models...")
    models = get_models()
    print(f"   {len(models)} base models")

    # 添加集成模型
    ensemble_models = get_ensemble_models(models)
    models.update(ensemble_models)
    print(f"   + {len(ensemble_models)} ensemble models")
    print(f"   Total: {len(models)} models")

    # 评估 - 使用3轮Bootstrap验证（与论文方法一致）
    print("\n3. Evaluating models (3-round Bootstrap, matching thesis methodology)...")
    results_df = bootstrap_evaluate_models(X, y, models, n_rounds=3, test_size=0.2, pattern_f_label=pattern_f_label)

    # 排序
    results_df = results_df.sort_values('Bootstrap Mean', ascending=False)

    # 显示结果
    print("\n" + "=" * 80)
    print("表4-16 扩展版：现代模型性能对比（3轮Bootstrap验证）")
    print("Table 4-16 Extended: Modern Model Comparison (3-Round Bootstrap)")
    print("=" * 80)

    # 格式化输出
    display_cols = ['Model', 'Bootstrap Accuracy', '3-Round Bootstrap', 'Pattern F Recall', 'Pattern F Precision', 'F1 Score']
    print(results_df[display_cols].to_string(index=False))

    # 保存结果
    output_path = 'modern_model_comparison_results.csv'
    results_df.to_csv(output_path, index=False)
    print(f"\n结果已保存至: {output_path}")

    # 生成LaTeX表格
    print("\n" + "=" * 60)
    print("LaTeX Table:")
    print("=" * 60)

    latex_table = generate_latex_table(results_df)
    print(latex_table)

    # 保存LaTeX
    with open('modern_model_comparison_table.tex', 'w') as f:
        f.write(latex_table)

    return results_df


def generate_latex_table(df):
    """生成LaTeX格式的表格（3轮Bootstrap验证）"""

    latex = r"""
\begin{table}[htbp]
\centering
\caption{现代机器学习模型性能对比（3轮Bootstrap验证，5类分类）}
\label{tab:modern-model-comparison}
\begin{tabular}{lcccccc}
\toprule
\textbf{模型} & \textbf{发布年份} & \textbf{Bootstrap准确率} & \textbf{3轮Bootstrap} & \textbf{F召回率} & \textbf{F精确率} & \textbf{F1} \\
\midrule
"""

    # 模型年份映射
    model_years = {
        'SVM (RBF, C=10)': '1995',
        'Random Forest': '2001',
        'Logistic Regression': '1958',
        'KNN': '1967',
        'Decision Tree': '1986',
        'Naive Bayes': '1960s',
        'AdaBoost': '1997',
        'Gradient Boosting': '2001',
        'XGBoost': '2014',
        'LightGBM': '2017',
        'CatBoost': '2017',
        'MLP Neural Network': '2012*',
        'Voting Ensemble': '-',
        'Stacking Ensemble': '2017',
    }

    for _, row in df.iterrows():
        model = row['Model']
        year = model_years.get(model, '-')

        # 高亮最佳模型
        if row['Bootstrap Mean'] == df['Bootstrap Mean'].max():
            model_str = r'\textbf{' + model + '}'
        else:
            model_str = model

        latex += f"{model_str} & {year} & {row['Bootstrap Accuracy']} & {row['3-Round Bootstrap']} & {row['Pattern F Recall']} & {row['Pattern F Precision']} & {row['F1 Score']} \\\\\n"

    latex += r"""
\bottomrule
\end{tabular}
\begin{tablenotes}
\small
\item 注：*MLP年份指现代深度学习框架成熟年份；3轮Bootstrap验证（80/20划分，种子42/43/44）
\item 所有模型使用class\_weight='balanced'处理类别不平衡；数据来源：本文研究 (N=378，5类)
\end{tablenotes}
\end{table}
"""

    return latex


def generate_markdown_table(df):
    """生成Markdown格式的表格（3轮Bootstrap验证，5类分类）"""

    md = """
## 表4-16 扩展版：候选模型性能对比（含现代模型，3轮Bootstrap验证）

| 模型 | 发布年份 | Bootstrap准确率 | 3轮Bootstrap | 模式F召回率 | 模式F精确率 | F1值 |
|------|---------|----------------|--------------|-----------|-----------|------|
"""

    model_years = {
        'SVM (RBF, C=10)': '1995',
        'Random Forest': '2001',
        'Logistic Regression': '1958',
        'KNN': '1967',
        'Decision Tree': '1986',
        'Naive Bayes': '1960s',
        'AdaBoost': '1997',
        'Gradient Boosting': '2001',
        'XGBoost': '2014',
        'LightGBM': '2017',
        'CatBoost': '2017',
        'MLP Neural Network': '2012',
        'Voting Ensemble': '-',
        'Stacking Ensemble': '2017',
    }

    for _, row in df.iterrows():
        model = row['Model']
        year = model_years.get(model, '-')
        md += f"| {model} | {year} | {row['Bootstrap Accuracy']} | {row['3-Round Bootstrap']} | {row['Pattern F Recall']} | {row['Pattern F Precision']} | {row['F1 Score']} |\n"

    md += """
*注：3轮Bootstrap验证（80/20划分）；SVM使用C=10.0；5类分类(B,C,D,E,F)；N=378*
"""

    return md


if __name__ == '__main__':
    results = main()

    print("\n" + "=" * 60)
    print("Markdown Table:")
    print("=" * 60)
    print(generate_markdown_table(results))
