# 统计分析脚本与可重复性文档
# Statistical Analysis Scripts and Reproducibility

**文档版本**: v1.0
**最后更新**: 2025-11-29
**用途**: 博士论文数据分析可重复性支撑材料

---

## 目录

1. [环境配置](#1-环境配置)
2. [数据预处理](#2-数据预处理)
3. [描述性统计](#3-描述性统计)
4. [信度分析](#4-信度分析)
5. [机器学习模型](#5-机器学习模型)
6. [效果量计算](#6-效果量计算)
7. [可视化脚本](#7-可视化脚本)

---

## 1. 环境配置

### 1.1 Python环境

```python
# requirements.txt
# 数据分析
pandas==2.0.3
numpy==1.24.3
scipy==1.11.1

# 机器学习
scikit-learn==1.3.0
xgboost==1.7.6
lightgbm==4.0.0

# 统计分析
statsmodels==0.14.0
pingouin==0.5.3
factor_analyzer==0.5.0

# 可视化
matplotlib==3.7.2
seaborn==0.12.2
plotly==5.15.0

# NLP特征提取
transformers==4.31.0
sentence-transformers==2.2.2

# 其他
jupyter==1.0.0
openpyxl==3.1.2
```

### 1.2 R环境

```r
# R packages
install.packages(c(
  "psych",      # 心理测量分析
  "lavaan",     # 结构方程模型
  "irr",        # 信度分析
  "ggplot2",    # 可视化
  "dplyr",      # 数据处理
  "tidyr",      # 数据整理
  "corrplot",   # 相关矩阵可视化
  "effectsize"  # 效应量计算
))
```

---

## 2. 数据预处理

### 2.1 数据加载与清洗

```python
import pandas as pd
import numpy as np
from typing import Dict, List, Tuple

def load_interview_data(file_path: str) -> pd.DataFrame:
    """
    加载访谈数据

    Parameters:
    -----------
    file_path : str
        数据文件路径

    Returns:
    --------
    pd.DataFrame
        清洗后的访谈数据
    """
    df = pd.read_excel(file_path)

    # 标准化列名
    df.columns = df.columns.str.lower().str.replace(' ', '_')

    # 处理缺失值
    df = df.dropna(subset=['participant_id', 'pattern'])

    # 数据类型转换
    df['age'] = pd.to_numeric(df['age'], errors='coerce')
    df['metacog_score'] = pd.to_numeric(df['metacog_score'], errors='coerce')

    return df

def load_questionnaire_data(file_path: str) -> Dict[str, pd.DataFrame]:
    """
    加载问卷数据

    Returns:
    --------
    Dict with keys: 'sus', 'satisfaction', 'expert'
    """
    data = {}

    # SUS数据
    data['sus'] = pd.read_excel(file_path, sheet_name='SUS')

    # 满意度数据
    data['satisfaction'] = pd.read_excel(file_path, sheet_name='Satisfaction')

    # 专家评估数据
    data['expert'] = pd.read_excel(file_path, sheet_name='Expert')

    return data
```

### 2.2 模式编码

```python
def encode_patterns(df: pd.DataFrame) -> pd.DataFrame:
    """
    将模式标签编码为数值
    """
    pattern_mapping = {
        'A': 0, 'B': 1, 'C': 2,
        'D': 3, 'E': 4, 'F': 5
    }

    df['pattern_code'] = df['pattern'].map(pattern_mapping)

    # 二分类：高风险(F) vs 非高风险
    df['high_risk'] = (df['pattern'] == 'F').astype(int)

    return df

def create_pattern_distribution(df: pd.DataFrame) -> pd.DataFrame:
    """
    计算模式分布
    """
    distribution = df['pattern'].value_counts()
    distribution_pct = df['pattern'].value_counts(normalize=True) * 100

    result = pd.DataFrame({
        'count': distribution,
        'percentage': distribution_pct.round(1)
    })

    return result.sort_index()
```

---

## 3. 描述性统计

### 3.1 样本人口统计学

```python
def compute_demographics(df: pd.DataFrame) -> Dict:
    """
    计算人口统计学描述
    """
    demographics = {
        'n': len(df),
        'age': {
            'mean': df['age'].mean(),
            'std': df['age'].std(),
            'min': df['age'].min(),
            'max': df['age'].max()
        },
        'gender': df['gender'].value_counts().to_dict(),
        'education': df['education'].value_counts().to_dict(),
        'occupation': df['occupation'].value_counts().to_dict()
    }

    return demographics

def generate_demographics_table(df: pd.DataFrame) -> pd.DataFrame:
    """
    生成人口统计学表格
    """
    # 年龄分布
    age_bins = [20, 25, 30, 35, 40, 50]
    age_labels = ['21-25', '26-30', '31-35', '36-40', '41-45']
    df['age_group'] = pd.cut(df['age'], bins=age_bins, labels=age_labels)

    tables = []

    # 各变量频率表
    for var in ['gender', 'education', 'age_group', 'occupation']:
        freq = df[var].value_counts()
        pct = df[var].value_counts(normalize=True) * 100
        table = pd.DataFrame({
            'variable': var,
            'category': freq.index,
            'n': freq.values,
            'percentage': pct.values.round(1)
        })
        tables.append(table)

    return pd.concat(tables, ignore_index=True)
```

### 3.2 模式分布统计

```python
def pattern_statistics(df: pd.DataFrame) -> pd.DataFrame:
    """
    各模式的描述性统计
    """
    stats = df.groupby('pattern').agg({
        'metacog_score': ['mean', 'std', 'min', 'max'],
        'age': ['mean', 'std'],
        'participant_id': 'count'
    }).round(2)

    stats.columns = ['_'.join(col) for col in stats.columns]
    stats = stats.rename(columns={'participant_id_count': 'n'})

    return stats
```

---

## 4. 信度分析

### 4.1 Cronbach's Alpha计算

```python
def cronbach_alpha(df: pd.DataFrame, items: List[str]) -> Dict:
    """
    计算Cronbach's Alpha系数

    Parameters:
    -----------
    df : pd.DataFrame
        数据框
    items : List[str]
        量表题目列名列表

    Returns:
    --------
    Dict with alpha, standardized_alpha, and item_statistics
    """
    item_data = df[items].dropna()
    n_items = len(items)
    n_subjects = len(item_data)

    # 计算各题目方差和总方差
    item_variances = item_data.var()
    total_variance = item_data.sum(axis=1).var()

    # Cronbach's Alpha
    alpha = (n_items / (n_items - 1)) * (1 - item_variances.sum() / total_variance)

    # 标准化Alpha
    corr_matrix = item_data.corr()
    mean_corr = corr_matrix.values[np.triu_indices(n_items, k=1)].mean()
    std_alpha = (n_items * mean_corr) / (1 + (n_items - 1) * mean_corr)

    # 项目统计
    item_total_corr = []
    alpha_if_deleted = []

    for item in items:
        # 项目-总分相关
        other_items = [i for i in items if i != item]
        total_without = item_data[other_items].sum(axis=1)
        corr = item_data[item].corr(total_without)
        item_total_corr.append(corr)

        # 删除后Alpha
        remaining_data = item_data[other_items]
        remaining_var = remaining_data.var().sum()
        remaining_total_var = remaining_data.sum(axis=1).var()
        n_remaining = len(other_items)
        alpha_del = (n_remaining / (n_remaining - 1)) * (1 - remaining_var / remaining_total_var)
        alpha_if_deleted.append(alpha_del)

    item_stats = pd.DataFrame({
        'item': items,
        'mean': item_data.mean().values,
        'std': item_data.std().values,
        'item_total_corr': item_total_corr,
        'alpha_if_deleted': alpha_if_deleted
    })

    return {
        'alpha': round(alpha, 3),
        'standardized_alpha': round(std_alpha, 3),
        'n_items': n_items,
        'n_subjects': n_subjects,
        'item_statistics': item_stats
    }
```

### 4.2 SUS信度分析

```python
def analyze_sus_reliability(df: pd.DataFrame) -> Dict:
    """
    SUS量表信度分析
    """
    sus_items = [f'sus_q{i}' for i in range(1, 11)]

    # 反向计分
    reverse_items = ['sus_q2', 'sus_q4', 'sus_q6', 'sus_q8', 'sus_q10']
    df_scored = df.copy()
    for item in reverse_items:
        df_scored[item] = 6 - df_scored[item]

    # 计算信度
    reliability = cronbach_alpha(df_scored, sus_items)

    # 计算SUS总分
    df_scored['sus_contribution'] = df_scored[sus_items].sum(axis=1) - 10
    df_scored['sus_score'] = df_scored['sus_contribution'] * 2.5

    reliability['sus_mean'] = df_scored['sus_score'].mean()
    reliability['sus_std'] = df_scored['sus_score'].std()

    return reliability
```

### 4.3 评分者间信度 (ICC)

```python
from scipy import stats

def intraclass_correlation(ratings: np.ndarray, icc_type: str = '2k') -> Dict:
    """
    计算组内相关系数 (ICC)

    Parameters:
    -----------
    ratings : np.ndarray
        评分矩阵 (subjects x raters)
    icc_type : str
        ICC类型: '1', '2', '3', '1k', '2k', '3k'

    Returns:
    --------
    Dict with ICC, F-value, p-value, and 95% CI
    """
    n, k = ratings.shape  # n subjects, k raters

    # 方差分析
    grand_mean = ratings.mean()

    # 被试间方差
    subject_means = ratings.mean(axis=1)
    ss_between = k * np.sum((subject_means - grand_mean) ** 2)
    df_between = n - 1
    ms_between = ss_between / df_between

    # 被试内方差
    ss_within = np.sum((ratings - subject_means.reshape(-1, 1)) ** 2)
    df_within = n * (k - 1)
    ms_within = ss_within / df_within

    # 评分者方差 (仅用于ICC(2)和ICC(3))
    rater_means = ratings.mean(axis=0)
    ss_rater = n * np.sum((rater_means - grand_mean) ** 2)
    df_rater = k - 1
    ms_rater = ss_rater / df_rater

    # 误差方差
    ss_error = ss_within - ss_rater
    df_error = df_within - df_rater
    ms_error = ss_error / df_error

    # 计算ICC
    if icc_type == '2k':
        icc = (ms_between - ms_error) / ms_between
        f_value = ms_between / ms_error
    elif icc_type == '2':
        icc = (ms_between - ms_error) / (ms_between + (k - 1) * ms_error +
              (k / n) * (ms_rater - ms_error))
        f_value = ms_between / ms_error

    # p值
    p_value = 1 - stats.f.cdf(f_value, df_between, df_error)

    # 95% CI (使用F分布)
    f_lower = f_value / stats.f.ppf(0.975, df_between, df_error)
    f_upper = f_value / stats.f.ppf(0.025, df_between, df_error)

    ci_lower = (f_lower - 1) / (f_lower + k - 1) if icc_type == '2k' else None
    ci_upper = (f_upper - 1) / (f_upper + k - 1) if icc_type == '2k' else None

    return {
        'icc': round(icc, 3),
        'f_value': round(f_value, 2),
        'p_value': round(p_value, 4),
        'ci_95': (round(ci_lower, 3), round(ci_upper, 3)) if ci_lower else None,
        'icc_type': icc_type
    }
```

---

## 5. 机器学习模型

### 5.1 特征工程

```python
from sklearn.preprocessing import StandardScaler
from sentence_transformers import SentenceTransformer

def extract_behavioral_features(session_data: pd.DataFrame) -> pd.DataFrame:
    """
    提取行为特征
    """
    features = pd.DataFrame()

    # B1: 总交互次数
    features['total_interactions'] = session_data.groupby('session_id').size()

    # B2: 平均提示词长度
    features['avg_prompt_length'] = session_data.groupby('session_id')['prompt_length'].mean()

    # B3: 最长提示词长度
    features['max_prompt_length'] = session_data.groupby('session_id')['prompt_length'].max()

    # B4: 修正/迭代次数
    features['refinement_count'] = session_data.groupby('session_id')['is_refinement'].sum()

    # B5: 验证行为次数
    features['verification_count'] = session_data.groupby('session_id')['is_verification'].sum()

    # 派生特征
    features['verification_rate'] = features['verification_count'] / features['total_interactions']
    features['refinement_rate'] = features['refinement_count'] / features['total_interactions']

    return features

def extract_semantic_features(prompts: List[str], model_name: str = 'all-MiniLM-L6-v2') -> np.ndarray:
    """
    使用Sentence-BERT提取语义特征
    """
    model = SentenceTransformer(model_name)
    embeddings = model.encode(prompts)

    return embeddings

def compute_metacog_scores(text: str) -> Dict[str, float]:
    """
    计算元认知语义得分

    使用关键词匹配和语义相似度
    """
    # 任务分解关键词
    task_decomp_keywords = ['分解', '分成', '步骤', 'breakdown', 'step by step']

    # 验证关键词
    verification_keywords = ['验证', '检查', '确认', 'verify', 'check', 'confirm']

    # 批判性思维关键词
    critical_keywords = ['但是', '然而', '质疑', 'but', 'however', 'question']

    # 反思关键词
    reflection_keywords = ['反思', '总结', '学到', 'reflect', 'learn', 'realize']

    scores = {}
    text_lower = text.lower()

    scores['task_decomposition_score'] = sum(1 for kw in task_decomp_keywords if kw in text_lower) / len(task_decomp_keywords)
    scores['verification_language_score'] = sum(1 for kw in verification_keywords if kw in text_lower) / len(verification_keywords)
    scores['critical_thinking_score'] = sum(1 for kw in critical_keywords if kw in text_lower) / len(critical_keywords)
    scores['reflection_score'] = sum(1 for kw in reflection_keywords if kw in text_lower) / len(reflection_keywords)

    return scores
```

### 5.2 模型训练

```python
from sklearn.model_selection import cross_val_score, StratifiedKFold
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier, VotingClassifier
from sklearn.metrics import classification_report, confusion_matrix, roc_auc_score

def train_pattern_classifier(X: np.ndarray, y: np.ndarray, cv: int = 5) -> Dict:
    """
    训练模式分类器

    Parameters:
    -----------
    X : np.ndarray
        特征矩阵
    y : np.ndarray
        模式标签
    cv : int
        交叉验证折数

    Returns:
    --------
    Dict with model, cv_scores, and feature_importance
    """
    # 标准化特征
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)

    # 定义基础分类器
    rf = RandomForestClassifier(
        n_estimators=100,
        max_depth=10,
        random_state=42
    )

    gb = GradientBoostingClassifier(
        n_estimators=100,
        max_depth=5,
        random_state=42
    )

    # 集成分类器
    ensemble = VotingClassifier(
        estimators=[('rf', rf), ('gb', gb)],
        voting='soft'
    )

    # 交叉验证
    skf = StratifiedKFold(n_splits=cv, shuffle=True, random_state=42)
    cv_scores = cross_val_score(ensemble, X_scaled, y, cv=skf, scoring='accuracy')

    # 训练最终模型
    ensemble.fit(X_scaled, y)

    # 特征重要性 (从RF获取)
    rf.fit(X_scaled, y)
    feature_importance = rf.feature_importances_

    return {
        'model': ensemble,
        'scaler': scaler,
        'cv_accuracy_mean': cv_scores.mean(),
        'cv_accuracy_std': cv_scores.std(),
        'cv_scores': cv_scores,
        'feature_importance': feature_importance
    }

def evaluate_model(model, X_test: np.ndarray, y_test: np.ndarray,
                   class_names: List[str]) -> Dict:
    """
    评估模型性能
    """
    y_pred = model.predict(X_test)
    y_proba = model.predict_proba(X_test)

    # 分类报告
    report = classification_report(y_test, y_pred, target_names=class_names, output_dict=True)

    # 混淆矩阵
    cm = confusion_matrix(y_test, y_pred)

    # ROC-AUC (多分类)
    try:
        auc = roc_auc_score(y_test, y_proba, multi_class='ovr')
    except:
        auc = None

    return {
        'classification_report': report,
        'confusion_matrix': cm,
        'roc_auc': auc,
        'accuracy': report['accuracy']
    }
```

### 5.3 模式F专项检测

```python
def train_pattern_f_detector(X: np.ndarray, y: np.ndarray) -> Dict:
    """
    训练模式F二分类检测器

    针对高风险用户的专项检测
    """
    # 转为二分类问题
    y_binary = (y == 5).astype(int)  # F=5

    # 处理类别不平衡
    from sklearn.utils.class_weight import compute_class_weight
    class_weights = compute_class_weight('balanced', classes=np.unique(y_binary), y=y_binary)
    weight_dict = dict(zip(np.unique(y_binary), class_weights))

    # 训练模型
    from sklearn.ensemble import RandomForestClassifier
    from sklearn.metrics import precision_recall_fscore_support

    model = RandomForestClassifier(
        n_estimators=100,
        max_depth=8,
        class_weight=weight_dict,
        random_state=42
    )

    # 交叉验证
    skf = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)

    precision_scores = []
    recall_scores = []
    f1_scores = []

    for train_idx, test_idx in skf.split(X, y_binary):
        X_train, X_test = X[train_idx], X[test_idx]
        y_train, y_test = y_binary[train_idx], y_binary[test_idx]

        model.fit(X_train, y_train)
        y_pred = model.predict(X_test)

        precision, recall, f1, _ = precision_recall_fscore_support(
            y_test, y_pred, average='binary', pos_label=1
        )

        precision_scores.append(precision)
        recall_scores.append(recall)
        f1_scores.append(f1)

    return {
        'precision_mean': np.mean(precision_scores),
        'precision_std': np.std(precision_scores),
        'recall_mean': np.mean(recall_scores),  # 灵敏度
        'recall_std': np.std(recall_scores),
        'f1_mean': np.mean(f1_scores),
        'f1_std': np.std(f1_scores)
    }
```

---

## 6. 效果量计算

### 6.1 Cohen's d

```python
def cohens_d(group1: np.ndarray, group2: np.ndarray) -> float:
    """
    计算Cohen's d效应量

    Parameters:
    -----------
    group1, group2 : np.ndarray
        两组数据

    Returns:
    --------
    float
        Cohen's d值
    """
    n1, n2 = len(group1), len(group2)
    var1, var2 = group1.var(), group2.var()

    # 合并标准差
    pooled_std = np.sqrt(((n1 - 1) * var1 + (n2 - 1) * var2) / (n1 + n2 - 2))

    d = (group1.mean() - group2.mean()) / pooled_std

    return round(d, 3)

def interpret_cohens_d(d: float) -> str:
    """
    解释Cohen's d效应量
    """
    d_abs = abs(d)
    if d_abs < 0.2:
        return "negligible"
    elif d_abs < 0.5:
        return "small"
    elif d_abs < 0.8:
        return "medium"
    else:
        return "large"
```

### 6.2 Eta-squared

```python
def eta_squared(df: pd.DataFrame, dv: str, between: str) -> float:
    """
    计算Eta-squared效应量 (ANOVA)

    Parameters:
    -----------
    df : pd.DataFrame
        数据框
    dv : str
        因变量列名
    between : str
        组间因子列名

    Returns:
    --------
    float
        Eta-squared值
    """
    from scipy import stats

    groups = [group[dv].values for name, group in df.groupby(between)]

    # ANOVA
    f_stat, p_value = stats.f_oneway(*groups)

    # 计算SS
    grand_mean = df[dv].mean()
    ss_between = sum(len(g) * (g.mean() - grand_mean) ** 2 for g in groups)
    ss_total = ((df[dv] - grand_mean) ** 2).sum()

    eta_sq = ss_between / ss_total

    return round(eta_sq, 3)
```

### 6.3 相关效应量

```python
def compute_effect_sizes(df: pd.DataFrame, dv: str, group_var: str) -> Dict:
    """
    计算多种效应量
    """
    from scipy import stats

    groups = df.groupby(group_var)[dv].apply(list).to_dict()
    group_names = list(groups.keys())

    results = {
        'eta_squared': eta_squared(df, dv, group_var),
        'pairwise_cohens_d': {}
    }

    # 两两比较的Cohen's d
    for i, g1 in enumerate(group_names):
        for g2 in group_names[i+1:]:
            d = cohens_d(np.array(groups[g1]), np.array(groups[g2]))
            results['pairwise_cohens_d'][f'{g1}_vs_{g2}'] = {
                'd': d,
                'interpretation': interpret_cohens_d(d)
            }

    return results
```

---

## 7. 可视化脚本

### 7.1 模式分布图

```python
import matplotlib.pyplot as plt
import seaborn as sns

def plot_pattern_distribution(df: pd.DataFrame, save_path: str = None):
    """
    绘制模式分布饼图和条形图
    """
    fig, axes = plt.subplots(1, 2, figsize=(14, 6))

    # 计算分布
    pattern_counts = df['pattern'].value_counts().sort_index()
    colors = ['#2ecc71', '#3498db', '#9b59b6', '#f39c12', '#1abc9c', '#e74c3c']

    # 饼图
    axes[0].pie(pattern_counts.values, labels=pattern_counts.index,
                autopct='%1.1f%%', colors=colors, startangle=90)
    axes[0].set_title('Pattern Distribution (N=49)', fontsize=14)

    # 条形图
    bars = axes[1].bar(pattern_counts.index, pattern_counts.values, color=colors)
    axes[1].set_xlabel('Pattern', fontsize=12)
    axes[1].set_ylabel('Count', fontsize=12)
    axes[1].set_title('Pattern Frequency', fontsize=14)

    # 添加数值标签
    for bar, count in zip(bars, pattern_counts.values):
        axes[1].text(bar.get_x() + bar.get_width()/2, bar.get_height() + 0.3,
                     str(count), ha='center', fontsize=11)

    plt.tight_layout()

    if save_path:
        plt.savefig(save_path, dpi=300, bbox_inches='tight')

    plt.show()
```

### 7.2 混淆矩阵热力图

```python
def plot_confusion_matrix(cm: np.ndarray, class_names: List[str],
                          save_path: str = None):
    """
    绘制混淆矩阵热力图
    """
    plt.figure(figsize=(10, 8))

    # 归一化
    cm_normalized = cm.astype('float') / cm.sum(axis=1)[:, np.newaxis]

    sns.heatmap(cm_normalized, annot=True, fmt='.2f', cmap='Blues',
                xticklabels=class_names, yticklabels=class_names)

    plt.xlabel('Predicted Label', fontsize=12)
    plt.ylabel('True Label', fontsize=12)
    plt.title('Confusion Matrix (Normalized)', fontsize=14)

    if save_path:
        plt.savefig(save_path, dpi=300, bbox_inches='tight')

    plt.show()
```

### 7.3 特征重要性图

```python
def plot_feature_importance(importance: np.ndarray, feature_names: List[str],
                            top_n: int = 10, save_path: str = None):
    """
    绘制特征重要性条形图
    """
    # 排序
    indices = np.argsort(importance)[::-1][:top_n]

    plt.figure(figsize=(10, 6))
    plt.barh(range(top_n), importance[indices][::-1], color='steelblue')
    plt.yticks(range(top_n), [feature_names[i] for i in indices[::-1]])
    plt.xlabel('Importance', fontsize=12)
    plt.title(f'Top {top_n} Feature Importance', fontsize=14)

    if save_path:
        plt.savefig(save_path, dpi=300, bbox_inches='tight')

    plt.show()
```

### 7.4 SUS分数分布

```python
def plot_sus_distribution(sus_scores: np.ndarray, save_path: str = None):
    """
    绘制SUS分数分布图
    """
    fig, axes = plt.subplots(1, 2, figsize=(14, 5))

    # 直方图
    axes[0].hist(sus_scores, bins=10, color='steelblue', edgecolor='white', alpha=0.7)
    axes[0].axvline(68, color='red', linestyle='--', label='Average (68)')
    axes[0].axvline(sus_scores.mean(), color='green', linestyle='-', label=f'Our Mean ({sus_scores.mean():.1f})')
    axes[0].set_xlabel('SUS Score', fontsize=12)
    axes[0].set_ylabel('Frequency', fontsize=12)
    axes[0].set_title('SUS Score Distribution', fontsize=14)
    axes[0].legend()

    # 箱线图
    axes[1].boxplot(sus_scores, vert=True)
    axes[1].axhline(68, color='red', linestyle='--', label='Average (68)')
    axes[1].set_ylabel('SUS Score', fontsize=12)
    axes[1].set_title('SUS Score Box Plot', fontsize=14)

    plt.tight_layout()

    if save_path:
        plt.savefig(save_path, dpi=300, bbox_inches='tight')

    plt.show()
```

---

## 附录：完整分析流程示例

```python
# main_analysis.py - 完整分析流程

def main():
    """
    主分析流程
    """
    # 1. 加载数据
    print("Loading data...")
    interview_df = load_interview_data('data/interview_data.xlsx')
    questionnaire_data = load_questionnaire_data('data/questionnaire_data.xlsx')

    # 2. 描述性统计
    print("\n=== Descriptive Statistics ===")
    demographics = compute_demographics(interview_df)
    pattern_dist = create_pattern_distribution(interview_df)
    print(f"Total participants: {demographics['n']}")
    print(f"Pattern distribution:\n{pattern_dist}")

    # 3. 信度分析
    print("\n=== Reliability Analysis ===")
    sus_reliability = analyze_sus_reliability(questionnaire_data['sus'])
    print(f"SUS Cronbach's Alpha: {sus_reliability['alpha']}")
    print(f"SUS Mean: {sus_reliability['sus_mean']:.1f}")

    # 4. 机器学习模型
    print("\n=== Machine Learning Model ===")
    # 特征提取
    X = extract_behavioral_features(session_data)
    y = interview_df['pattern_code'].values

    # 模型训练
    model_results = train_pattern_classifier(X, y)
    print(f"CV Accuracy: {model_results['cv_accuracy_mean']:.3f} ± {model_results['cv_accuracy_std']:.3f}")

    # 模式F检测
    f_detector = train_pattern_f_detector(X, y)
    print(f"Pattern F Recall (Sensitivity): {f_detector['recall_mean']:.3f}")

    # 5. 效应量
    print("\n=== Effect Sizes ===")
    effect_sizes = compute_effect_sizes(interview_df, 'metacog_score', 'pattern')
    print(f"Eta-squared: {effect_sizes['eta_squared']}")

    # 6. 可视化
    print("\n=== Generating Visualizations ===")
    plot_pattern_distribution(interview_df, 'figures/pattern_distribution.png')
    plot_sus_distribution(questionnaire_data['sus']['sus_score'].values, 'figures/sus_distribution.png')

    print("\nAnalysis complete!")

if __name__ == "__main__":
    main()
```

---

*本文档包含博士论文所有统计分析的可重复性脚本，确保研究结果可被验证和复现。*
