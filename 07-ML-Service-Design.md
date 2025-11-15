# ML服务设计 - Pattern Recognition Service

> **技术栈**：Python 3.10+ + FastAPI + scikit-learn + XGBoost  
> **目标**：实时分类用户的元认知使用模式（Pattern A-F）  
> **准确率目标**：>70%（考虑到49个样本的限制）

---

## 🎯 核心任务

**输入**：12维元认知特征向量  
**输出**：Pattern (A-F) + 置信度

**示例**：
```python
# 输入
features = {
    "prompt_specificity": 12.5,
    "verification_rate": 0.75,
    "iteration_frequency": 3.2,
    # ... 共12个特征
}

# 输出
{
    "pattern": "A",
    "confidence": 0.87,
    "all_probabilities": {
        "A": 0.87,
        "B": 0.05,
        "C": 0.04,
        "D": 0.02,
        "E": 0.01,
        "F": 0.01
    }
}
```

---

## 📊 12维特征定义

### **特征1: prompt_specificity（提示词具体性）**
**计算方法**：平均prompt词数  
**公式**：`sum(word_count per prompt) / total_prompts`  
**取值范围**：0-50（通常5-20）  
**Pattern关联**：
- Pattern A, D：通常 >12 词（详细具体）
- Pattern F：通常 <8 词（过于简短）

**Python实现**：
```python
def calc_prompt_specificity(interactions):
    if not interactions:
        return 0
    word_counts = [len(i.user_prompt.split()) for i in interactions]
    return sum(word_counts) / len(word_counts)
```

---

### **特征2: verification_rate（验证率）**
**计算方法**：被标记为"已验证"的交互占比  
**公式**：`verified_interactions / total_interactions`  
**取值范围**：0-1  
**Pattern关联**：
- Pattern A, D：>0.7（高验证）
- Pattern C：0.4-0.7（动态）
- Pattern F：<0.1（几乎不验证）

**Python实现**：
```python
def calc_verification_rate(interactions):
    if not interactions:
        return 0
    verified = sum(1 for i in interactions if i.was_verified)
    return verified / len(interactions)
```

---

### **特征3: iteration_frequency（迭代频率）**
**计算方法**：每小时平均迭代次数  
**定义**：连续修改同一任务算作迭代  
**取值范围**：0-20  
**Pattern关联**：
- Pattern B：>5（频繁迭代）
- Pattern A：2-4（适度迭代）
- Pattern F：<1（很少迭代）

**Python实现**：
```python
def calc_iteration_frequency(interactions, session_duration_hours):
    if session_duration_hours == 0:
        return 0
    # 检测连续的相似prompt（编辑距离<30%）
    iterations = 0
    for i in range(1, len(interactions)):
        similarity = calc_similarity(
            interactions[i].user_prompt,
            interactions[i-1].user_prompt
        )
        if similarity > 0.7:  # 70%相似度算迭代
            iterations += 1
    return iterations / session_duration_hours
```

---

### **特征4: modification_rate（修改率）**
**计算方法**：AI输出被修改的占比  
**公式**：`modified_interactions / total_interactions`  
**取值范围**：0-1  
**Pattern关联**：
- Pattern A：>0.6（频繁修改AI输出）
- Pattern F：<0.1（直接接受）

---

### **特征5: task_decomposition_score（任务分解得分）**
**计算方法**：检测用户是否将任务分解为子任务  
**启发式规则**：
- 提示词包含"第一步""然后""最后"等词 → +0.2
- 多个相关但独立的prompt序列 → +0.3
- 提示词包含明确的子任务列表 → +0.5

**取值范围**：0-1  
**Pattern关联**：
- Pattern A：>0.7（明显分解）
- Pattern B, C：0.3-0.6
- Pattern F：<0.2

---

### **特征6: reflection_depth（反思深度）**
**计算方法**：检测元认知反思语言  
**关键词权重**：
- "我理解了"、"这让我意识到" → +0.15
- "如果我..."、"为什么" → +0.1
- "我的策略是" → +0.2

**取值范围**：0-1  
**Pattern关联**：
- Pattern E：>0.6（高反思）
- Pattern F：<0.1

---

### **特征7: cross_model_usage（跨模型使用）**
**计算方法**：使用不同AI模型的占比  
**公式**：`unique_models_used / possible_models`  
**取值范围**：0-1  
**Pattern关联**：
- Pattern B, C：>0.3（实验多个模型）
- Pattern F：0（只用一个模型）

---

### **特征8: independent_attempt_rate（独立尝试率）**
**计算方法**：用户在查询AI前自己尝试的证据  
**启发式**：
- 提示词包含"我试过..."、"我尝试了" → +1
- 描述具体尝试过的方法 → +1

**取值范围**：0-10（会话中独立尝试次数）  
**Pattern关联**：
- Pattern A, E：>3
- Pattern F：0

---

### **特征9: error_awareness（错误觉察）**
**计算方法**：用户发现并报告AI错误的频率  
**公式**：`rejected_interactions / total_interactions`  
**取值范围**：0-1  
**Pattern关联**：
- Pattern D：>0.3（高敏感度）
- Pattern F：0（未意识到错误）

---

### **特征10: strategy_diversity（策略多样性）**
**计算方法**：用户使用不同协作策略的数量  
**策略类型**：
- 任务分解
- 迭代优化
- 验证检查
- 跨模型比较
- 反思性提问

**公式**：`strategies_used / 5`  
**取值范围**：0-1  
**Pattern关联**：
- Pattern C：>0.6（灵活切换）
- Pattern F：<0.2

---

### **特征11: trust_calibration_accuracy（信任校准准确性）**
**计算方法**：用户对不同任务类型的信任水平是否合理  
**理想校准**：
- 高风险任务（医疗、法律）：低信任（高验证）
- 低风险任务（头脑风暴）：高信任（低验证）

**测量**：观察验证行为与任务重要性的相关性  
**取值范围**：0-1（1=完美校准）  
**Pattern关联**：
- Pattern C, D：>0.7
- Pattern F：<0.3（盲目信任或盲目不信）

---

### **特征12: time_before_ai_query（AI查询前思考时间）**
**计算方法**：用户平均在第一次AI查询前的时间  
**单位**：分钟  
**取值范围**：0-30  
**Pattern关联**：
- Pattern A, E：>5分钟（先自己思考）
- Pattern F：<1分钟（立即求助AI）

---

## 🤖 ML模型架构

### **Ensemble模型设计**

```python
from sklearn.ensemble import RandomForestClassifier, VotingClassifier
from sklearn.svm import SVC
from xgboost import XGBClassifier

class PatternClassifier:
    def __init__(self):
        # 三个基础模型
        self.rf = RandomForestClassifier(
            n_estimators=100,
            max_depth=10,
            min_samples_split=5,
            random_state=42
        )
        
        self.svm = SVC(
            kernel='rbf',
            C=1.0,
            gamma='scale',
            probability=True,  # 启用概率输出
            random_state=42
        )
        
        self.xgb = XGBClassifier(
            n_estimators=100,
            max_depth=6,
            learning_rate=0.1,
            random_state=42
        )
        
        # Soft voting ensemble
        self.ensemble = VotingClassifier(
            estimators=[
                ('rf', self.rf),
                ('svm', self.svm),
                ('xgb', self.xgb)
            ],
            voting='soft',  # 使用概率平均
            weights=[0.4, 0.3, 0.3]  # Random Forest权重稍高
        )
        
        self.scaler = StandardScaler()
        self.label_encoder = LabelEncoder()
    
    def train(self, X, y):
        # 1. 标准化特征
        X_scaled = self.scaler.fit_transform(X)
        
        # 2. 编码标签 (A-F → 0-5)
        y_encoded = self.label_encoder.fit_transform(y)
        
        # 3. 训练ensemble
        self.ensemble.fit(X_scaled, y_encoded)
        
        # 4. 交叉验证
        scores = cross_val_score(
            self.ensemble, 
            X_scaled, 
            y_encoded, 
            cv=5,
            scoring='f1_macro'
        )
        print(f"Cross-validation F1: {scores.mean():.3f} (+/- {scores.std():.3f})")
    
    def predict(self, features):
        # 1. 标准化
        X = self.scaler.transform([features])
        
        # 2. 预测概率
        probas = self.ensemble.predict_proba(X)[0]
        
        # 3. 获取最高概率的类别
        predicted_idx = np.argmax(probas)
        predicted_pattern = self.label_encoder.inverse_transform([predicted_idx])[0]
        confidence = probas[predicted_idx]
        
        # 4. 如果置信度<60%，fallback到规则引擎
        if confidence < 0.6:
            return self.rule_based_fallback(features)
        
        return {
            'pattern': predicted_pattern,
            'confidence': float(confidence),
            'all_probabilities': {
                label: float(prob) 
                for label, prob in zip(self.label_encoder.classes_, probas)
            }
        }
    
    def rule_based_fallback(self, features):
        """
        规则引擎：当ML不确定时使用
        """
        # Rule 1: 高验证率 + 高分解 → Pattern A
        if features[1] > 0.7 and features[4] > 0.7:
            return {'pattern': 'A', 'confidence': 0.75}
        
        # Rule 2: 高迭代 + 跨模型 → Pattern B
        if features[2] > 5 and features[6] > 0.3:
            return {'pattern': 'B', 'confidence': 0.70}
        
        # Rule 3: 高策略多样性 → Pattern C
        if features[9] > 0.6:
            return {'pattern': 'C', 'confidence': 0.72}
        
        # Rule 4: 高错误觉察 + 高验证 → Pattern D
        if features[8] > 0.3 and features[1] > 0.9:
            return {'pattern': 'D', 'confidence': 0.70}
        
        # Rule 5: 高反思深度 → Pattern E
        if features[5] > 0.6:
            return {'pattern': 'E', 'confidence': 0.68}
        
        # Rule 6: 低验证 + 低分解 + 低独立尝试 → Pattern F
        if features[1] < 0.1 and features[4] < 0.2 and features[7] == 0:
            return {'pattern': 'F', 'confidence': 0.65}
        
        # 默认：Pattern C（最常见）
        return {'pattern': 'C', 'confidence': 0.50}
```

---

## 🚀 FastAPI服务实现

```python
# ml-service/main.py
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Dict, List
import numpy as np
from model import PatternClassifier

app = FastAPI(title="MCA Pattern Recognition Service")

# 全局模型实例
classifier = PatternClassifier()

# 启动时加载训练好的模型
@app.on_event("startup")
async def load_model():
    try:
        classifier.load('./models/pattern_classifier.pkl')
        print("✅ Model loaded successfully")
    except FileNotFoundError:
        print("⚠️ No trained model found. Using rule-based engine only.")

class FeatureVector(BaseModel):
    prompt_specificity: float
    verification_rate: float
    iteration_frequency: float
    modification_rate: float
    task_decomposition_score: float
    reflection_depth: float
    cross_model_usage: float
    independent_attempt_rate: float
    error_awareness: float
    strategy_diversity: float
    trust_calibration_accuracy: float
    time_before_ai_query: float

class PredictionResponse(BaseModel):
    pattern: str
    confidence: float
    all_probabilities: Dict[str, float]
    method: str  # 'ml_ensemble' or 'rule_based'

@app.post("/predict", response_model=PredictionResponse)
async def predict_pattern(features: FeatureVector):
    """
    主预测endpoint
    """
    try:
        # 转换为numpy array
        feature_array = np.array([
            features.prompt_specificity,
            features.verification_rate,
            features.iteration_frequency,
            features.modification_rate,
            features.task_decomposition_score,
            features.reflection_depth,
            features.cross_model_usage,
            features.independent_attempt_rate,
            features.error_awareness,
            features.strategy_diversity,
            features.trust_calibration_accuracy,
            features.time_before_ai_query
        ])
        
        # 预测
        result = classifier.predict(feature_array)
        result['method'] = 'ml_ensemble' if result['confidence'] >= 0.6 else 'rule_based'
        
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health_check():
    return {"status": "healthy", "model_loaded": classifier.is_loaded()}

@app.post("/retrain")
async def retrain_model(training_data: TrainingData):
    """
    允许系统定期重新训练模型
    """
    try:
        X = np.array(training_data.features)
        y = np.array(training_data.labels)
        
        classifier.train(X, y)
        classifier.save('./models/pattern_classifier.pkl')
        
        return {"status": "success", "samples": len(y)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
```

---

## 📁 项目结构

```
ml-service/
├── main.py                 # FastAPI app
├── model.py                # PatternClassifier类
├── features.py             # 特征提取函数
├── train.py                # 训练脚本
├── requirements.txt        # Python依赖
├── models/                 # 保存训练好的模型
│   ├── pattern_classifier.pkl
│   └── scaler.pkl
└── data/                   # 训练数据
    └── training_data.csv
```

---

## 🎓 训练数据准备

### **从49个访谈提取特征**

你需要手动从访谈中提取特征，创建`training_data.csv`：

```csv
prompt_specificity,verification_rate,iteration_frequency,modification_rate,task_decomposition_score,reflection_depth,cross_model_usage,independent_attempt_rate,error_awareness,strategy_diversity,trust_calibration_accuracy,time_before_ai_query,pattern_label
12.5,0.75,3.2,0.65,0.80,0.45,0.00,3,0.20,0.70,0.80,5.5,A
8.3,0.15,7.8,0.55,0.30,0.25,0.67,1,0.10,0.60,0.55,2.1,B
15.2,0.68,2.5,0.72,0.55,0.35,0.50,4,0.25,0.85,0.90,4.2,C
18.5,0.92,1.8,0.45,0.60,0.40,0.33,5,0.42,0.65,0.95,7.3,D
11.0,0.85,4.2,0.68,0.75,0.88,0.00,6,0.30,0.55,0.75,8.5,E
5.2,0.05,0.5,0.08,0.15,0.10,0.00,0,0.02,0.20,0.25,0.5,F
...（共49行，每个访谈一行）
```

### **数据提取指南**

对于每个访谈参与者（I1-I49），阅读访谈记录并估计12个特征：

1. **prompt_specificity**: 访谈中描述的平均prompt词数
2. **verification_rate**: 他们说验证了多少比例的AI输出？
3. **iteration_frequency**: 描述了多少次迭代行为？
4. **modification_rate**: 多常修改AI输出？
5. **task_decomposition_score**: 是否展现分解策略？(0=无, 1=明显)
6. **reflection_depth**: 访谈中反思语言的丰富程度 (0-1)
7. **cross_model_usage**: 是否使用多个模型？(0=单一, 1=全部)
8. **independent_attempt_rate**: 描述了多少次先自己尝试？
9. **error_awareness**: 多常发现AI错误？(0-1)
10. **strategy_diversity**: 使用了几种不同策略？(0-1)
11. **trust_calibration_accuracy**: 信任是否随任务类型合理变化？(0-1)
12. **time_before_ai_query**: 描述的平均"先思考"时间（分钟）
13. **pattern_label**: Pattern A-F（根据你论文中的分类）

---

## 🔬 模型评估

```python
# train.py
from sklearn.metrics import classification_report, confusion_matrix
import seaborn as sns
import matplotlib.pyplot as plt

def evaluate_model(classifier, X_test, y_test):
    # 预测
    y_pred = [classifier.predict(x)['pattern'] for x in X_test]
    
    # 分类报告
    print(classification_report(y_test, y_pred))
    
    # 混淆矩阵
    cm = confusion_matrix(y_test, y_pred, labels=['A', 'B', 'C', 'D', 'E', 'F'])
    plt.figure(figsize=(10, 8))
    sns.heatmap(cm, annot=True, fmt='d', 
                xticklabels=['A', 'B', 'C', 'D', 'E', 'F'],
                yticklabels=['A', 'B', 'C', 'D', 'E', 'F'])
    plt.title('Pattern Classification Confusion Matrix')
    plt.ylabel('True Pattern')
    plt.xlabel('Predicted Pattern')
    plt.savefig('confusion_matrix.png')
    
    # 特征重要性（Random Forest）
    importances = classifier.rf.feature_importances_
    feature_names = [
        'prompt_specificity', 'verification_rate', 'iteration_frequency',
        'modification_rate', 'task_decomposition_score', 'reflection_depth',
        'cross_model_usage', 'independent_attempt_rate', 'error_awareness',
        'strategy_diversity', 'trust_calibration_accuracy', 'time_before_ai_query'
    ]
    
    plt.figure(figsize=(12, 6))
    plt.bar(feature_names, importances)
    plt.xticks(rotation=45, ha='right')
    plt.title('Feature Importance')
    plt.tight_layout()
    plt.savefig('feature_importance.png')
```

---

## ⚡ 性能优化

### **1. 模型缓存**
```python
from functools import lru_cache

@lru_cache(maxsize=1000)
def cached_predict(features_tuple):
    features = np.array(features_tuple)
    return classifier.predict(features)
```

### **2. 批量预测**
```python
@app.post("/predict_batch")
async def predict_batch(feature_list: List[FeatureVector]):
    results = []
    for features in feature_list:
        result = classifier.predict(features.to_array())
        results.append(result)
    return results
```

### **3. 异步处理**
```python
import asyncio

@app.post("/predict_async")
async def predict_async(features: FeatureVector):
    loop = asyncio.get_event_loop()
    result = await loop.run_in_executor(
        None, 
        classifier.predict, 
        features.to_array()
    )
    return result
```

---

## 🐛 故障排查

### **问题1：准确率<50%**
**可能原因**：
- 训练数据标注错误
- 特征提取不准确
- 类别严重不平衡

**解决方案**：
- 重新检查训练数据
- 使用SMOTE过采样少数类
- 调整class_weight参数

### **问题2：置信度总是很低**
**可能原因**：
- 模型过于谨慎
- 类别边界模糊

**解决方案**：
- 降低fallback阈值（从0.6降到0.5）
- 增强规则引擎

### **问题3：总是预测Pattern C**
**可能原因**：
- Pattern C样本占比过高（33%）
- 模型欠拟合

**解决方案**：
- 平衡训练数据
- 增加模型复杂度

---

**文档版本**：v1.0  
**最后更新**：2024-11-15  
**下一步**：开始训练数据提取，然后训练模型！
