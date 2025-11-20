# MCA系统架构设计

> **系统名称**：Metacognitive Collaborative Agent (MCA)  
> **架构模式**：前后端分离 + 微服务  
> **设计原则**：可扩展、模块化、实时响应

---

## 🏗️ 整体架构图

```
┌─────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                         │
│  ┌────────────────────────────────────────────────────────┐ │
│  │             React Frontend (Port 5173)                  │ │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐             │ │
│  │  │ Chat UI  │  │Dashboard │  │ Settings │             │ │
│  │  └──────────┘  └──────────┘  └──────────┘             │ │
│  │  - State Management: Zustand                           │ │
│  │  - UI Framework: shadcn/ui + Tailwind                  │ │
│  │  - Real-time Updates: WebSocket (optional)             │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              ↓ HTTPS/WSS
┌─────────────────────────────────────────────────────────────┐
│                        API GATEWAY LAYER                     │
│  ┌────────────────────────────────────────────────────────┐ │
│  │         Express API Server (Port 3000)                  │ │
│  │                                                          │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐   │ │
│  │  │   Auth      │  │  Session    │  │  Pattern    │   │ │
│  │  │  Service    │  │   Service   │  │  Detection  │   │ │
│  │  └─────────────┘  └─────────────┘  └─────────────┘   │ │
│  │                                                          │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐   │ │
│  │  │   AI Model  │  │   Skill     │  │  Analytics  │   │ │
│  │  │   Proxy     │  │  Monitoring │  │   Service   │   │ │
│  │  └─────────────┘  └─────────────┘  └─────────────┘   │ │
│  │                                                          │ │
│  │  - JWT Authentication                                   │ │
│  │  - Input Validation (Zod)                               │ │
│  │  - Rate Limiting                                        │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
           ↓                    ↓                    ↓
    ┌──────────┐        ┌──────────┐        ┌──────────┐
    │PostgreSQL│        │  Redis   │        │ ML Service│
    │(Prisma)  │        │  Cache   │        │(FastAPI)  │
    │Port 5432 │        │Port 6379 │        │Port 8000  │
    └──────────┘        └──────────┘        └──────────┘
           ↓                                        ↓
    ┌──────────┐                            ┌──────────┐
    │  Backup  │                            │  Model   │
    │ Storage  │                            │  Store   │
    └──────────┘                            └──────────┘
```

---

## 📦 四层架构详解

### **Layer 1: Presentation Layer（表示层）**
**技术栈**：React 18 + TypeScript + Vite + Tailwind CSS

**职责**：
- 用户界面渲染
- 用户交互处理
- 状态管理（Zustand）
- 实时数据展示

**核心页面**：
1. `/login` - 认证页面
2. `/dashboard` - 元认知仪表盘
3. `/session/:id` - 主聊天界面
4. `/analytics` - 分析和报告
5. `/profile` - 用户设置
6. `/comparison` - 跨模型比较（MR6）

**状态管理**：
```typescript
// 使用Zustand的3个核心store
authStore: {
  user: User | null,
  token: string,
  login(), logout()
}

sessionStore: {
  currentSession: Session,
  interactions: Interaction[],
  currentPattern: Pattern,
  createSession(), addInteraction()
}

uiStore: {
  sidebarOpen: boolean,
  theme: 'light' | 'dark',
  notifications: Notification[]
}
```

---

### **Layer 2: Application Layer（应用层）**
**技术栈**：Node.js + Express + TypeScript + Prisma

**职责**：
- 业务逻辑处理
- API路由管理
- 数据验证和转换
- 外部服务集成

**模块化设计**：
```
backend/src/
├── routes/           # API路由定义
│   ├── auth.routes.ts
│   ├── session.routes.ts
│   ├── interaction.routes.ts
│   ├── pattern.routes.ts
│   └── analytics.routes.ts
│
├── controllers/      # 业务逻辑控制器
│   ├── AuthController.ts
│   ├── SessionController.ts
│   └── PatternController.ts
│
├── services/         # 核心服务
│   ├── PatternDetectionService.ts
│   ├── SkillMonitoringService.ts
│   ├── AIModelProxyService.ts
│   └── ConfidenceCalculationService.ts
│
├── middleware/       # 中间件
│   ├── auth.middleware.ts
│   ├── validation.middleware.ts
│   └── errorHandler.middleware.ts
│
├── utils/            # 工具函数
│   ├── featureExtraction.ts
│   ├── ruleEngine.ts
│   └── logger.ts
│
└── prisma/           # 数据库
    └── schema.prisma
```

**核心服务详解**：

#### **1. PatternDetectionService**
```typescript
class PatternDetectionService {
  async detectPattern(sessionId: string): Promise<PatternResult> {
    // 1. 获取会话所有交互
    const interactions = await this.getInteractions(sessionId);
    
    // 2. 计算12维特征
    const features = this.calculateFeatures(interactions);
    
    // 3. 判断使用规则引擎还是ML模型
    if (sessionDuration < 10) {
      return this.ruleBasedClassification(features);
    } else {
      return await this.mlBasedClassification(features);
    }
  }
  
  calculateFeatures(interactions): FeatureVector {
    return {
      prompt_specificity: this.calcPromptSpecificity(interactions),
      verification_rate: this.calcVerificationRate(interactions),
      iteration_frequency: this.calcIterationFrequency(interactions),
      // ... 共12个特征
    };
  }
}
```

#### **2. SkillMonitoringService**
```typescript
class SkillMonitoringService {
  async checkForAtrophy(userId: string): Promise<Alert[]> {
    // 1. 获取技能基线
    const baselines = await this.getSkillBaselines(userId);
    
    // 2. 计算当前能力
    const currentSkills = await this.assessCurrentSkills(userId);
    
    // 3. 比较并生成警告
    const alerts = [];
    for (const skill of baselines) {
      const degradation = this.calculateDegradation(
        skill.baselineScore,
        currentSkills[skill.name]
      );
      
      if (degradation > 0.3) {  // >30%退化
        alerts.push({
          type: 'skill_atrophy',
          severity: 'critical',
          message: `${skill.name}能力下降${degradation*100}%`
        });
      }
    }
    
    return alerts;
  }
}
```

#### **3. AIModelProxyService**（MR6实现）
```typescript
class AIModelProxyService {
  async compareModels(
    prompt: string, 
    models: string[]
  ): Promise<ComparisonResult> {
    // 并行请求多个模型
    const responses = await Promise.all(
      models.map(model => this.queryModel(model, prompt))
    );
    
    return {
      prompt,
      responses: responses.map((resp, idx) => ({
        model: models[idx],
        output: resp.text,
        latency: resp.latency,
        tokenCount: resp.tokenCount
      }))
    };
  }
  
  private async queryModel(model: string, prompt: string) {
    const startTime = Date.now();
    
    switch(model) {
      case 'gpt-4-turbo':
        return await this.openaiClient.chat.completions.create({...});
      case 'claude-sonnet-4-5':
        return await this.anthropicClient.messages.create({...});
      case 'gemini-pro':
        return await this.googleClient.generateContent({...});
    }
    
    // 计算延迟
    const latency = Date.now() - startTime;
    return { text, latency, tokenCount };
  }
}
```

---

### **Layer 3: Data Layer（数据层）**
**技术栈**：PostgreSQL + Prisma ORM + Redis

**职责**：
- 持久化存储
- 数据查询和索引
- 缓存热数据
- 数据备份

**数据库设计原则**：
1. **规范化**：避免数据冗余
2. **索引优化**：高频查询字段建立索引
3. **关系完整性**：外键约束确保一致性
4. **分区策略**：按时间分区历史数据

**Redis缓存策略**：
```typescript
// 缓存热点数据
cache.set(`session:${sessionId}:features`, features, 300); // 5分钟TTL
cache.set(`user:${userId}:pattern`, pattern, 600); // 10分钟TTL

// 避免缓存穿透
const pattern = await cache.get(`session:${id}:pattern`);
if (!pattern) {
  const computed = await PatternService.detect(id);
  await cache.set(`session:${id}:pattern`, computed);
  return computed;
}
```

---

### **Layer 4: Intelligence Layer（智能层）**
**技术栈**：Python + FastAPI + scikit-learn + pandas

**职责**：
- Pattern分类（A-F）
- 特征工程
- 模型训练和更新
- 预测服务

**ML Service API**：
```python
# ml-service/main.py
from fastapi import FastAPI
from model import PatternClassifier

app = FastAPI()
classifier = PatternClassifier.load()

@app.post("/predict")
async def predict_pattern(features: FeatureVector):
    """
    输入：12维特征向量
    输出：Pattern (A-F) + 置信度
    """
    prediction = classifier.predict(features)
    
    return {
        "pattern": prediction.class_label,
        "confidence": prediction.probability,
        "all_probabilities": {
            "A": prediction.proba_A,
            "B": prediction.proba_B,
            # ...
        }
    }

@app.post("/retrain")
async def retrain_model(training_data: TrainingDataset):
    """
    允许系统定期重新训练模型
    """
    classifier.fit(training_data.X, training_data.y)
    classifier.save()
    return {"status": "success"}
```

**Ensemble模型架构**：
```python
class PatternClassifier:
    def __init__(self):
        self.rf = RandomForestClassifier(n_estimators=100)
        self.svm = SVC(kernel='rbf', probability=True)
        self.xgb = XGBClassifier()
        
    def predict(self, features):
        # Soft voting ensemble
        rf_proba = self.rf.predict_proba(features)
        svm_proba = self.svm.predict_proba(features)
        xgb_proba = self.xgb.predict_proba(features)
        
        # 加权平均
        ensemble_proba = (
            0.4 * rf_proba + 
            0.3 * svm_proba + 
            0.3 * xgb_proba
        )
        
        predicted_class = np.argmax(ensemble_proba)
        confidence = np.max(ensemble_proba)
        
        # 如果置信度<60%，触发规则引擎
        if confidence < 0.6:
            return self.fallback_rule_based(features)
        
        return Pattern(predicted_class, confidence)
```

---

## 🔄 关键数据流

### **Flow 1: 用户交互 → Pattern检测**
```
1. 用户在ChatInterface输入prompt
   ↓
2. Frontend: POST /api/interactions
   - 发送prompt到后端
   ↓
3. Backend: InteractionController
   - 调用AIModelProxy获取AI回复
   - 保存Interaction到数据库
   ↓
4. Backend: PatternDetectionService
   - 计算当前session的12维特征
   - 如果<10分钟：规则引擎分类
   - 如果≥10分钟：调用ML Service
   ↓
5. ML Service: POST /predict
   - 接收特征向量
   - Ensemble模型预测Pattern
   - 返回Pattern + 置信度
   ↓
6. Backend: 保存PatternLog到数据库
   ↓
7. Frontend: 实时更新UI
   - PatternIndicator显示当前Pattern
   - 如果Pattern变化，触发通知
```

### **Flow 2: 跨模型比较（MR6）**
```
1. 用户在ModelComparison页面输入prompt
   ↓
2. Frontend: POST /api/ai-comparison/compare
   - 发送prompt + 选中的模型列表
   ↓
3. Backend: AIModelProxyService
   - Promise.all并行请求：
     * OpenAI GPT-4
     * Anthropic Claude
     * Google Gemini
   ↓
4. 各API返回响应（2-5秒）
   ↓
5. Backend: 汇总结果
   - 计算各模型延迟
   - 统计token数
   - 保存到ModelComparison表
   ↓
6. Frontend: 并排三栏显示
   - 用户可对每个输出评分
   ↓
7. 评分 POST /api/ai-comparison/rate
   - 保存用户偏好
   - 用于未来推荐模型
```

### **Flow 3: 技能退化监控（MR16）**
```
每日定时任务 (Cron Job):
1. SkillMonitoringService.checkAllUsers()
   ↓
2. 对每个用户：
   - 获取最近30天使用数据
   - 计算独立完成率
   - 与SkillBaseline比较
   ↓
3. 如果发现退化>30%：
   - 创建SkillAlert记录
   - 触发通知（邮件/站内信）
   ↓
4. 前端Dashboard显示Alert
   ↓
5. 严重情况：强制干预
   - 阻止AI访问
   - 要求完成独立任务
   - 任务通过后才恢复AI权限
```

---

## 🔒 安全架构

### **认证和授权**
```typescript
// JWT Token结构
{
  userId: string,
  email: string,
  role: 'user' | 'admin',
  iat: number,
  exp: number  // 24小时过期
}

// 中间件
app.use('/api/*', authenticateJWT);

// 路由级别权限
router.get('/admin/*', requireRole('admin'));
```

### **数据隐私（MR23预留）**
```
当前实现：
- 所有通信HTTPS
- API Keys环境变量存储
- 数据库连接加密
- JWT token安全传输

未来实现（Phase 4）：
- 本地推理模式
- 端到端加密
- 联邦学习
- 差分隐私
```

### **速率限制**
```typescript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 100, // 最多100次请求
  message: '请求过于频繁，请稍后再试'
});

app.use('/api/', limiter);

// AI调用专门限制（成本控制）
const aiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1分钟
  max: 10, // 最多10次AI调用
  keyGenerator: (req) => req.user.id // 按用户限制
});

app.use('/api/interactions', aiLimiter);
```

---

## 📊 监控和日志

### **日志系统**
```typescript
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
  ],
});

// 结构化日志
logger.info('Pattern detected', {
  userId: user.id,
  sessionId: session.id,
  pattern: 'A',
  confidence: 0.85,
  features: {...}
});
```

### **性能监控**
```typescript
// 请求时间追踪
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info('Request completed', {
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration: `${duration}ms`
    });
  });
  next();
});
```

---

## 🚀 部署架构

### **开发环境**
```yaml
# docker-compose.dev.yml
services:
  frontend:
    build: ./frontend
    ports: ["5173:5173"]
    volumes: ["./frontend:/app"]
    
  backend:
    build: ./backend
    ports: ["3000:3000"]
    depends_on: [postgres, redis]
    
  ml-service:
    build: ./ml-service
    ports: ["8000:8000"]
    
  postgres:
    image: postgres:15
    ports: ["5432:5432"]
    
  redis:
    image: redis:7
    ports: ["6379:6379"]
```

### **生产环境**
```
Frontend (Vercel):
- 自动CI/CD
- CDN分发
- 环境变量注入

Backend (Railway/AWS):
- 自动扩展
- 负载均衡
- 健康检查

Database (Supabase):
- 自动备份
- 读写分离
- 连接池管理

ML Service (Fly.io):
- GPU加速
- 模型版本管理
- A/B测试支持
```

---

## 📈 可扩展性设计

### **水平扩展策略**
1. **无状态API服务器**：可启动多个backend实例
2. **负载均衡**：Nginx/ALB分发请求
3. **数据库读写分离**：主从复制
4. **Redis集群**：分布式缓存

### **垂直扩展准备**
1. **数据库分区**：按时间/用户ID分区
2. **微服务拆分**：Pattern服务、Skill服务独立
3. **消息队列**：RabbitMQ/Kafka处理异步任务

---

## 🔧 技术栈总览

| 层级 | 技术 | 版本 | 用途 |
|------|------|------|------|
| **前端** | React | 18.x | UI框架 |
| | TypeScript | 5.x | 类型安全 |
| | Vite | 5.x | 构建工具 |
| | Tailwind CSS | 3.x | 样式 |
| | shadcn/ui | latest | 组件库 |
| | Zustand | 4.x | 状态管理 |
| | React Router | 6.x | 路由 |
| **后端** | Node.js | 18.x | 运行时 |
| | Express | 4.x | Web框架 |
| | Prisma | 5.x | ORM |
| | Zod | 3.x | 验证 |
| | JWT | 9.x | 认证 |
| **数据库** | PostgreSQL | 15.x | 主数据库 |
| | Redis | 7.x | 缓存 |
| **ML** | Python | 3.10+ | ML语言 |
| | FastAPI | 0.104+ | API框架 |
| | scikit-learn | 1.3+ | ML库 |
| | XGBoost | 2.0+ | Ensemble |

---

**文档版本**：v1.0  
**最后更新**：2024-11-15  
**下一步**：参考05-API-Specifications.md了解具体API设计