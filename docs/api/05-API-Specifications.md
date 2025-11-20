# API规范文档 - REST API Specifications

> **Base URL**：`http://localhost:3000/api`  
> **认证方式**：JWT Bearer Token  
> **内容类型**：`application/json`

---

## 🔐 认证端点（Authentication）

### POST `/auth/register`
**用户注册**

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123",
  "name": "John Doe"
}
```

**Response (201 Created):**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "createdAt": "2024-11-15T10:30:00Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

---

### POST `/auth/login`
**用户登录**

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Response (200 OK):**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe"
  },
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

---

### GET `/auth/me`
**获取当前用户信息**

**Headers:** `Authorization: Bearer {token}`

**Response (200 OK):**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "name": "John Doe",
  "createdAt": "2024-11-15T10:30:00Z"
}
```

---

## 💬 交互记录（Interactions）

### POST `/interactions`
**创建新交互（用户发送消息给AI）**

**Request Body:**
```json
{
  "sessionId": "session-uuid",
  "userPrompt": "如何在Python中读取CSV文件？",
  "aiModel": "claude-sonnet-4-5"
}
```

**Response (201 Created):**
```json
{
  "id": "interaction-uuid",
  "sessionId": "session-uuid",
  "timestamp": "2024-11-15T10:35:00Z",
  "userPrompt": "如何在Python中读取CSV文件？",
  "aiResponse": "在Python中读取CSV文件...",
  "aiModel": "claude-sonnet-4-5",
  "promptWordCount": 8,
  "responseTime": 1234,
  "confidenceScore": 95,
  "uncertaintyReasons": []
}
```

---

### GET `/sessions/:sessionId/interactions`
**获取会话的所有交互**

**Query Parameters:**
- `limit` (optional): 返回最近N条，默认50
- `before` (optional): 时间戳，获取此时间之前的交互

**Response (200 OK):**
```json
{
  "interactions": [
    {
      "id": "interaction-1",
      "timestamp": "2024-11-15T10:35:00Z",
      "userPrompt": "...",
      "aiResponse": "...",
      "aiModel": "claude-sonnet-4-5",
      "wasVerified": false,
      "wasModified": false,
      "confidenceScore": 95
    },
    // ... more interactions
  ]
}
```

---

### PATCH `/interactions/:id`
**更新交互（标记为已验证/已修改）**

**Request Body:**
```json
{
  "wasVerified": true,
  "wasModified": true,
  "wasRejected": false
}
```

**Response (200 OK):**
```json
{
  "id": "interaction-uuid",
  "wasVerified": true,
  "wasModified": true,
  "wasRejected": false
}
```

---

## 🧠 Pattern检测（Pattern Detection）

### POST `/pattern-detection/analyze`
**实时分析当前会话的元认知模式**

**Request Body:**
```json
{
  "sessionId": "session-uuid"
}
```

**Response (200 OK):**
```json
{
  "sessionId": "session-uuid",
  "detectedPattern": "A",
  "confidence": 0.87,
  "features": {
    "prompt_specificity": 12.5,
    "verification_rate": 0.75,
    "iteration_frequency": 3.2,
    "modification_rate": 0.65,
    "task_decomposition_score": 0.8,
    "reflection_depth": 0.6,
    "cross_model_usage": 0.0,
    "independent_attempt_rate": 0.3,
    "error_awareness": 0.85,
    "strategy_diversity": 0.7,
    "trust_calibration_accuracy": 0.8,
    "time_before_ai_query": 5.2
  },
  "method": "ml_ensemble",
  "timestamp": "2024-11-15T10:40:00Z",
  "allProbabilities": {
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

### GET `/pattern-detection/history/:sessionId`
**获取会话的Pattern变化历史**

**Response (200 OK):**
```json
{
  "sessionId": "session-uuid",
  "patternLogs": [
    {
      "id": "log-1",
      "timestamp": "2024-11-15T10:40:00Z",
      "detectedPattern": "A",
      "confidence": 0.87
    },
    {
      "id": "log-2",
      "timestamp": "2024-11-15T10:45:00Z",
      "detectedPattern": "A",
      "confidence": 0.91
    }
  ]
}
```

---

## 🔀 跨模型比较（AI Model Comparison）- MR6

### POST `/ai-comparison/compare`
**并行请求多个AI模型并比较输出**

**Request Body:**
```json
{
  "prompt": "解释量子纠缠的原理",
  "models": ["gpt-4-turbo", "claude-sonnet-4-5", "gemini-pro"]
}
```

**Response (200 OK):**
```json
{
  "id": "comparison-uuid",
  "prompt": "解释量子纠缠的原理",
  "responses": [
    {
      "model": "gpt-4-turbo",
      "output": "量子纠缠是...",
      "latency": 2300,
      "tokenCount": 350,
      "timestamp": "2024-11-15T10:50:00Z"
    },
    {
      "model": "claude-sonnet-4-5",
      "output": "量子纠缠是...",
      "latency": 1800,
      "tokenCount": 420,
      "timestamp": "2024-11-15T10:50:01Z"
    },
    {
      "model": "gemini-pro",
      "output": "量子纠缠是...",
      "latency": 2100,
      "tokenCount": 380,
      "timestamp": "2024-11-15T10:50:02Z"
    }
  ],
  "createdAt": "2024-11-15T10:50:00Z"
}
```

---

### POST `/ai-comparison/rate`
**用户对比较结果评分**

**Request Body:**
```json
{
  "comparisonId": "comparison-uuid",
  "ratings": {
    "gpt-4-turbo": 4,
    "claude-sonnet-4-5": 5,
    "gemini-pro": 3
  }
}
```

**Response (200 OK):**
```json
{
  "comparisonId": "comparison-uuid",
  "ratings": {
    "gpt-4-turbo": 4,
    "claude-sonnet-4-5": 5,
    "gemini-pro": 3
  },
  "userPreference": "claude-sonnet-4-5"
}
```

---

## 📊 分析和统计（Analytics）

### GET `/users/:userId/analytics`
**获取用户的元认知分析数据**

**Query Parameters:**
- `startDate` (optional): 开始日期
- `endDate` (optional): 结束日期
- `period` (optional): `day` | `week` | `month`

**Response (200 OK):**
```json
{
  "userId": "user-uuid",
  "period": {
    "start": "2024-11-01",
    "end": "2024-11-15"
  },
  "summary": {
    "totalSessions": 45,
    "totalInteractions": 567,
    "averageSessionDuration": 28.5,
    "dominantPattern": "A",
    "patternDistribution": {
      "A": 0.67,
      "B": 0.15,
      "C": 0.10,
      "D": 0.05,
      "E": 0.03,
      "F": 0.00
    }
  },
  "metacognitiveMetrics": {
    "averagePromptSpecificity": 11.8,
    "overallVerificationRate": 0.72,
    "independentAttemptRate": 0.35,
    "strategyDiversity": 0.65
  },
  "modelUsage": {
    "gpt-4-turbo": 0.45,
    "claude-sonnet-4-5": 0.40,
    "gemini-pro": 0.15
  },
  "patternTrend": [
    {"date": "2024-11-01", "pattern": "C"},
    {"date": "2024-11-08", "pattern": "A"},
    {"date": "2024-11-15", "pattern": "A"}
  ]
}
```

---

## 🎯 技能监控（Skill Monitoring）- MR16

### POST `/skill-baseline/assess`
**建立技能基线（首次使用）**

**Request Body:**
```json
{
  "skillName": "python_coding",
  "assessmentTask": "编写一个快速排序算法",
  "independentScore": 85,
  "completionTime": 15,
  "qualityMetrics": {
    "correctness": 0.9,
    "codeQuality": 0.85,
    "efficiency": 0.8
  }
}
```

**Response (201 Created):**
```json
{
  "id": "baseline-uuid",
  "userId": "user-uuid",
  "skillName": "python_coding",
  "baselineScore": 85,
  "measuredAt": "2024-11-15T10:00:00Z"
}
```

---

### GET `/skill-baseline/compare`
**比较当前能力与基线**

**Query Parameters:**
- `skillName`: 要比较的技能名称

**Response (200 OK):**
```json
{
  "skillName": "python_coding",
  "baseline": {
    "score": 85,
    "measuredAt": "2024-11-01T10:00:00Z"
  },
  "current": {
    "score": 78,
    "measuredAt": "2024-11-15T10:00:00Z"
  },
  "degradation": 0.08,
  "degradationPercentage": "8%",
  "status": "warning",
  "trend": "declining",
  "historicalTests": [
    {"date": "2024-11-01", "score": 85},
    {"date": "2024-11-08", "score": 82},
    {"date": "2024-11-15", "score": 78}
  ]
}
```

---

### POST `/skill-alert/check`
**检查是否需要触发技能退化警告**

**Request Body:**
```json
{
  "userId": "user-uuid"
}
```

**Response (200 OK):**
```json
{
  "alerts": [
    {
      "id": "alert-uuid",
      "alertType": "skill_atrophy",
      "severity": "warning",
      "skillName": "python_coding",
      "message": "你的Python编程能力相比基线下降了8%，建议进行独立练习。",
      "triggeredAt": "2024-11-15T10:00:00Z",
      "actionRequired": false
    },
    {
      "id": "alert-uuid-2",
      "alertType": "over_reliance",
      "severity": "critical",
      "message": "你已连续20次交互未进行任何验证，强烈建议增加批判性审查。",
      "triggeredAt": "2024-11-15T10:05:00Z",
      "actionRequired": true,
      "intervention": {
        "type": "forced_practice",
        "description": "完成一个独立编程任务后才能继续使用AI",
        "task": {
          "id": "task-uuid",
          "description": "不使用AI，编写一个二分查找算法",
          "estimatedTime": 15
        }
      }
    }
  ]
}
```

---

### POST `/skill-alert/:id/dismiss`
**用户确认已阅读警告**

**Response (200 OK):**
```json
{
  "id": "alert-uuid",
  "dismissed": true
}
```

---

## 💡 元认知策略指导（Strategy Tips）- MR15

### GET `/strategy-tips`
**获取当前适用的策略提示**

**Query Parameters:**
- `sessionId`: 当前会话ID
- `context` (optional): `planning` | `monitoring` | `evaluation` | `regulation`

**Response (200 OK):**
```json
{
  "tips": [
    {
      "id": "tip-1",
      "trigger": "low_prompt_specificity",
      "priority": "high",
      "category": "planning",
      "content": "你的提示词平均只有5个词。尝试提供更多上下文和具体要求，AI会给出更准确的回答。",
      "example": {
        "bad": "Python排序",
        "good": "用Python实现快速排序算法，要求时间复杂度O(nlogn)，并添加注释解释关键步骤"
      },
      "dismissible": true
    },
    {
      "id": "tip-2",
      "trigger": "zero_verification_streak",
      "priority": "critical",
      "category": "monitoring",
      "content": "你已连续10次未验证AI输出。建议至少抽查重要部分，避免累积错误。",
      "dismissible": false,
      "actionButton": {
        "text": "学习验证技巧",
        "link": "/learn/verification-strategies"
      }
    }
  ]
}
```

---

### POST `/strategy-tips/:id/dismiss`
**用户选择不再显示某条提示**

**Response (200 OK):**
```json
{
  "id": "tip-1",
  "dismissed": true
}
```

---

## 📐 置信度计算（Confidence Calculation）- MR13

### POST `/confidence/calculate`
**计算AI输出的置信度**

**Request Body:**
```json
{
  "output": "AI生成的文本内容...",
  "taskType": "coding",
  "context": {
    "userExpertise": "intermediate",
    "taskImportance": "high"
  }
}
```

**Response (200 OK):**
```json
{
  "overallConfidence": 75,
  "method": "ensemble",
  "uncertaintyReasons": [
    "此领域训练数据有限",
    "知识截止日期：2024年1月"
  ],
  "knowledgeBoundary": "这是基于训练数据的推理，建议交叉验证",
  "sentenceConfidences": [
    {
      "sentence": "Python使用pandas读取CSV...",
      "confidence": 95,
      "level": "high"
    },
    {
      "sentence": "2024年最新版本增加了...",
      "confidence": 45,
      "level": "low",
      "reason": "可能已过时"
    }
  ]
}
```

---

## 🔧 系统管理（Admin）

### GET `/admin/stats`
**获取系统统计数据（管理员）**

**Headers:** `Authorization: Bearer {admin_token}`

**Response (200 OK):**
```json
{
  "totalUsers": 1234,
  "activeSessions": 45,
  "totalInteractions": 567890,
  "modelUsage": {
    "gpt-4-turbo": 45000,
    "claude-sonnet-4-5": 40000,
    "gemini-pro": 15000
  },
  "patternDistribution": {
    "A": 0.37,
    "B": 0.08,
    "C": 0.33,
    "D": 0.08,
    "E": 0.14,
    "F": 0.00
  },
  "averageConfidence": 0.82,
  "skillAlertRate": 0.15
}
```

---

## ⚠️ 错误响应格式

所有错误响应遵循统一格式：

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "人类可读的错误信息",
    "details": {
      "field": "具体字段名",
      "reason": "详细原因"
    }
  }
}
```

**常见错误码**：
- `401` - UNAUTHORIZED: Token缺失或无效
- `403` - FORBIDDEN: 无权限访问
- `404` - NOT_FOUND: 资源不存在
- `422` - VALIDATION_ERROR: 输入验证失败
- `429` - RATE_LIMIT_EXCEEDED: 请求过于频繁
- `500` - INTERNAL_ERROR: 服务器内部错误
- `503` - SERVICE_UNAVAILABLE: 服务暂时不可用（如ML服务down）

---

## 📝 实现优先级

### **Phase 1（立即）**
- ✅ 认证端点
- ✅ 会话管理
- ✅ 交互记录

### **Phase 2（核心功能）**
- ✅ Pattern检测
- ✅ 跨模型比较（MR6）
- ✅ 置信度计算（MR13）

### **Phase 3（高级功能）**
- ✅ 技能监控（MR16）
- ✅ 策略提示（MR15）
- ✅ 分析统计

---

**文档版本**：v1.0  
**最后更新**：2024-11-15  
**下一步**：参考06-Frontend-Components.md了解前端如何调用这些API