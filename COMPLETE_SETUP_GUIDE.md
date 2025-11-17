# Interview-GenAI 完整部署指南

## 目录
1. [项目概述](#项目概述)
2. [Mac本地开发环境设置](#mac本地开发环境设置)
3. [前端应用结构](#前端应用结构)
4. [后端API服务](#后端api服务)
5. [数据库设置](#数据库设置)
6. [本地运行](#本地运行)
7. [云端部署](#云端部署)
8. [系统架构](#系统架构)

---

## 项目概述

**Interview-GenAI** 是一个高级机器学习系统，用于识别、预测和优化AI使用模式。

### 核心功能
- 🎯 AI使用模式识别（Pattern A-F）
- 📊 预测用户行为模式
- 🔄 自适应学习系统
- 📈 A/B干预策略测试
- 👥 用户进化追踪
- 📱 交互式仪表板

### 技术栈
- **前端**: React 18 + TypeScript + Vite
- **后端**: Express.js + TypeScript
- **数据库**: PostgreSQL（主要）/ MongoDB（备选）
- **部署**: Docker + Kubernetes / AWS / Vercel
- **监控**: PM2 + ELK Stack

---

## Mac本地开发环境设置

### 第1步：安装必备工具

#### 1.1 安装Homebrew（如果未安装）
```bash
# 检查是否已安装Homebrew
brew --version

# 如果未安装，执行以下命令
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# 添加到PATH（如果是Apple Silicon Mac）
echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zprofile
source ~/.zprofile
```

#### 1.2 安装Node.js和npm
```bash
# 使用Homebrew安装最新Node.js LTS
brew install node@20

# 验证安装
node --version      # v20.x.x
npm --version       # 10.x.x

# 升级npm到最新版本
npm install -g npm@latest

# 可选：安装nvm来管理多个Node版本
brew install nvm
echo 'export NVM_DIR="$HOME/.nvm"' >> ~/.zprofile
echo '[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"' >> ~/.zprofile
source ~/.zprofile
```

#### 1.3 安装Git
```bash
brew install git

# 配置Git
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```

#### 1.4 安装PostgreSQL
```bash
# 安装PostgreSQL
brew install postgresql@15

# 启动PostgreSQL服务
brew services start postgresql@15

# 验证安装
psql --version
```

#### 1.5 安装其他工具
```bash
# 安装Docker Desktop（从App Store或官网下载）
# 或使用Homebrew安装
brew install --cask docker

# 安装Redis（可选，用于缓存）
brew install redis

# 启动Redis
brew services start redis
```

### 第2步：克隆项目

```bash
# 克隆repository
cd ~/projects  # 选择你的项目目录
git clone https://github.com/Winckwu/Interview-GenAI.git
cd Interview-GenAI

# 检查当前分支
git branch -a

# 切换到特性分支
git checkout claude/expand-requirements-frustrations-01D3j3Dexg4EhHQVxfSydpK3
```

### 第3步：安装依赖

```bash
# 前端依赖
cd frontend
npm install

# 后端依赖（如果有）
cd ../backend
npm install

# 返回项目根目录
cd ..
```

---

## 前端应用结构

### 项目目录树
```
frontend/
├── index.html                 # HTML入口
├── vite.config.ts            # Vite配置
├── tsconfig.json             # TypeScript配置
├── package.json              # 依赖配置
├── src/
│   ├── main.tsx              # React入口
│   ├── App.tsx               # 主应用组件
│   ├── pages/                # 页面组件
│   │   ├── Dashboard.tsx      # 仪表板
│   │   ├── PredictionPage.tsx # 模式预测
│   │   ├── EvolutionPage.tsx  # 用户进化
│   │   ├── ABTestPage.tsx     # A/B测试
│   │   ├── LearnerPage.tsx    # 学习系统
│   │   ├── UsersPage.tsx      # 用户管理
│   │   └── LoginPage.tsx      # 登录页面
│   ├── components/           # 可复用组件
│   │   ├── Navigation.tsx     # 导航栏
│   │   ├── PatternCard.tsx    # 模式卡片
│   │   ├── Chart.tsx          # 图表组件
│   │   └── ...existing components
│   ├── api/                  # API集成
│   │   ├── client.ts         # Axios实例
│   │   ├── auth.ts           # 身份验证
│   │   ├── patterns.ts       # 模式API
│   │   ├── predictions.ts    # 预测API
│   │   └── users.ts          # 用户API
│   ├── store/                # 状态管理
│   │   ├── authStore.ts      # 身份验证状态
│   │   ├── userStore.ts      # 用户状态
│   │   └── patternStore.ts   # 模式状态
│   ├── styles/               # 全局样式
│   │   ├── index.scss        # 主样式文件
│   │   ├── variables.scss    # 变量定义
│   │   └── components.scss   # 组件样式
│   ├── types/                # TypeScript类型
│   │   └── index.ts          # 类型定义
│   └── utils/                # 工具函数
│       ├── format.ts         # 格式化
│       └── api.ts            # API辅助函数
├── public/                   # 静态文件
└── dist/                     # 构建输出

backend/
├── package.json
├── src/
│   ├── server.ts             # 主服务器文件
│   ├── app.ts                # Express应用
│   ├── routes/               # API路由
│   │   ├── auth.ts           # 身份验证路由
│   │   ├── patterns.ts       # 模式路由
│   │   ├── predictions.ts    # 预测路由
│   │   ├── users.ts          # 用户路由
│   │   └── analytics.ts      # 分析路由
│   ├── controllers/          # 控制器
│   │   ├── authController.ts
│   │   ├── patternController.ts
│   │   └── userController.ts
│   ├── services/             # 业务逻辑
│   │   ├── patternService.ts
│   │   ├── predictionService.ts
│   │   └── userService.ts
│   ├── models/               # 数据模型
│   │   ├── User.ts
│   │   ├── Pattern.ts
│   │   └── Prediction.ts
│   ├── middleware/           # 中间件
│   │   ├── auth.ts           # 身份验证中间件
│   │   └── errorHandler.ts   # 错误处理
│   ├── config/               # 配置文件
│   │   ├── database.ts
│   │   ├── env.ts
│   │   └── constants.ts
│   └── utils/                # 工具函数
│       ├── logger.ts
│       └── validators.ts
└── dist/
```

### 创建主要页面和组件

首先，让我创建完整的代码框架。由于篇幅限制，我会通过分模块详细说明实现。

---

## 后端API服务

### Express服务器架构

```typescript
// backend/src/server.ts
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { pool } from './config/database';
import authRoutes from './routes/auth';
import patternRoutes from './routes/patterns';
import predictionRoutes from './routes/predictions';
import userRoutes from './routes/users';
import analyticsRoutes from './routes/analytics';
import { errorHandler, requestLogger } from './middleware';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger);

// 路由
app.use('/api/auth', authRoutes);
app.use('/api/patterns', patternRoutes);
app.use('/api/predictions', predictionRoutes);
app.use('/api/users', userRoutes);
app.use('/api/analytics', analyticsRoutes);

// 健康检查
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// 错误处理
app.use(errorHandler);

// 启动服务器
app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
  console.log(`📊 API docs at http://localhost:${PORT}/api/docs`);
});

export default app;
```

### API端点规范

#### 1. 身份验证API
```
POST   /api/auth/register          # 注册新用户
POST   /api/auth/login             # 用户登录
POST   /api/auth/logout            # 用户登出
POST   /api/auth/refresh           # 刷新令牌
GET    /api/auth/me                # 获取当前用户
```

#### 2. 模式API
```
GET    /api/patterns                # 获取所有模式
GET    /api/patterns/:id            # 获取单个模式
POST   /api/patterns                # 创建模式
PUT    /api/patterns/:id            # 更新模式
DELETE /api/patterns/:id            # 删除模式
GET    /api/patterns/user/:userId   # 获取用户的模式
```

#### 3. 预测API
```
POST   /api/predictions/predict     # 预测用户模式
POST   /api/predictions/batch       # 批量预测
GET    /api/predictions/:userId     # 获取用户预测历史
POST   /api/predictions/feedback    # 提交预测反馈
GET    /api/predictions/accuracy    # 获取准确率统计
```

#### 4. 用户API
```
GET    /api/users                   # 获取所有用户（管理员）
GET    /api/users/:id               # 获取单个用户
PUT    /api/users/:id               # 更新用户信息
DELETE /api/users/:id               # 删除用户
GET    /api/users/:id/evolution     # 获取用户进化数据
POST   /api/users/:id/feedback      # 提交反馈
```

#### 5. 分析API
```
GET    /api/analytics/overview      # 获取系统概览
GET    /api/analytics/patterns      # 获取模式分布
GET    /api/analytics/success-rates # 获取成功率统计
GET    /api/analytics/learning      # 获取学习指标
POST   /api/analytics/export        # 导出数据
```

---

## 数据库设置

### PostgreSQL数据库架构

#### 1. 创建数据库
```bash
# 连接到PostgreSQL
psql postgres

# 创建数据库
CREATE DATABASE interview_genai;

# 连接到数据库
\c interview_genai

# 启用必要的扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
```

#### 2. 核心表结构

```sql
-- 用户表
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  username VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255),
  avatar_url VARCHAR(500),
  user_type ENUM('efficient', 'struggling', 'hybrid') DEFAULT 'struggling',
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_email (email),
  INDEX idx_username (username)
);

-- AI使用模式表
CREATE TABLE ai_patterns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  pattern_type CHAR(1) CHECK (pattern_type IN ('A', 'B', 'C', 'D', 'E', 'F')),
  confidence DECIMAL(3, 2) CHECK (confidence >= 0 AND confidence <= 1),
  query_ratio DECIMAL(4, 2),
  verification_rate DECIMAL(3, 2),
  independence_rate DECIMAL(3, 2),
  context_aware BOOLEAN DEFAULT FALSE,
  detected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user_id (user_id),
  INDEX idx_detected_at (detected_at)
);

-- 预测结果表
CREATE TABLE predictions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  task_id VARCHAR(100),
  task_type VARCHAR(50),
  predicted_pattern CHAR(1),
  predicted_confidence DECIMAL(3, 2),
  actual_pattern CHAR(1),
  feedback VARCHAR(50) CHECK (feedback IN ('accurate', 'inaccurate', 'partially_accurate')),
  is_correct BOOLEAN,
  prediction_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user_id (user_id),
  INDEX idx_is_correct (is_correct)
);

-- 用户进化跟踪表
CREATE TABLE evolution_tracking (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  time_point INT CHECK (time_point >= 0 AND time_point <= 4),
  starting_pattern CHAR(1),
  current_pattern CHAR(1),
  change_type VARCHAR(20),
  change_intensity DECIMAL(3, 2),
  milestones TEXT[],
  tracked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user_id (user_id),
  INDEX idx_time_point (time_point)
);

-- 干预记录表
CREATE TABLE interventions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  strategy VARCHAR(20) CHECK (strategy IN ('baseline', 'aggressive', 'adaptive')),
  pattern_before CHAR(1),
  pattern_after CHAR(1),
  success_metric DECIMAL(3, 2),
  satisfaction_rating INT CHECK (satisfaction_rating >= 1 AND satisfaction_rating <= 5),
  duration_days INT,
  applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user_id (user_id),
  INDEX idx_strategy (strategy)
);

-- 反馈数据表
CREATE TABLE feedback (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  prediction_id UUID REFERENCES predictions(id) ON DELETE SET NULL,
  feedback_type VARCHAR(50),
  predicted_pattern CHAR(1),
  actual_pattern CHAR(1),
  context VARCHAR(100),
  confidence_score DECIMAL(3, 2),
  submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user_id (user_id),
  INDEX idx_submitted_at (submitted_at)
);

-- 系统日志表
CREATE TABLE system_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(100),
  resource_type VARCHAR(50),
  resource_id VARCHAR(100),
  status VARCHAR(20),
  details JSONB,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user_id (user_id),
  INDEX idx_created_at (created_at)
);

-- 创建索引以优化查询
CREATE INDEX idx_patterns_user_detected ON ai_patterns(user_id, detected_at);
CREATE INDEX idx_predictions_feedback ON predictions(user_id, is_correct, created_at);
CREATE INDEX idx_interventions_user_strategy ON interventions(user_id, strategy, applied_at);
```

#### 3. 创建View用于分析

```sql
-- 用户模式分布视图
CREATE VIEW user_pattern_distribution AS
SELECT
  u.id,
  u.username,
  p.pattern_type,
  COUNT(*) as count,
  AVG(p.confidence) as avg_confidence,
  MAX(p.detected_at) as last_detected
FROM users u
LEFT JOIN ai_patterns p ON u.id = p.user_id
GROUP BY u.id, p.pattern_type;

-- 预测准确率视图
CREATE VIEW prediction_accuracy_stats AS
SELECT
  DATE(p.created_at) as date,
  COUNT(*) as total_predictions,
  SUM(CASE WHEN p.is_correct THEN 1 ELSE 0 END) as correct,
  ROUND(SUM(CASE WHEN p.is_correct THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 2) as accuracy_rate
FROM predictions p
GROUP BY DATE(p.created_at);

-- 干预策略效果视图
CREATE VIEW intervention_effectiveness AS
SELECT
  i.strategy,
  COUNT(*) as total_interventions,
  AVG(i.success_metric) as avg_success,
  AVG(i.satisfaction_rating) as avg_satisfaction,
  COUNT(CASE WHEN i.pattern_after != i.pattern_before THEN 1 END) as pattern_changed
FROM interventions i
GROUP BY i.strategy;
```

---

## 本地运行

### 完整的本地开发启动流程

#### 步骤1：启动数据库
```bash
# 启动PostgreSQL
brew services start postgresql@15

# 验证PostgreSQL是否运行
psql postgres -c "SELECT version();"

# 创建数据库并导入schema
psql postgres < backend/src/config/schema.sql

# 导入初始数据（可选）
psql interview_genai < backend/src/config/seed.sql
```

#### 步骤2：配置环境变量
```bash
# 创建.env文件在backend目录
cat > backend/.env << 'EOF'
# 服务器配置
NODE_ENV=development
PORT=5000
HOST=localhost

# 数据库配置
DB_HOST=localhost
DB_PORT=5432
DB_NAME=interview_genai
DB_USER=postgres
DB_PASSWORD=your_password

# JWT配置
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRY=24h

# CORS配置
CORS_ORIGIN=http://localhost:3000

# 日志配置
LOG_LEVEL=debug

# 文件上传
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760

# Redis配置（可选）
REDIS_URL=redis://localhost:6379
EOF

# 创建前端.env文件
cat > frontend/.env << 'EOF'
VITE_API_URL=http://localhost:5000/api
VITE_APP_NAME=Interview GenAI
VITE_DEBUG=true
EOF
```

#### 步骤3：安装依赖
```bash
# 从项目根目录
cd frontend
npm install

cd ../backend
npm install

cd ..
```

#### 步骤4：启动后端服务
```bash
# 方式1：开发模式
cd backend
npm run dev

# 方式2：使用nodemon自动重启
npm run dev:watch

# 方式3：使用PM2生产模式
npm install -g pm2
pm2 start npm --name "genai-api" -- run start
```

#### 步骤5：启动前端应用（新终端窗口）
```bash
cd frontend
npm run dev

# 前端应用将在 http://localhost:3000 启动
# 自动打开浏览器，支持热模块替换(HMR)
```

#### 步骤6：运行测试
```bash
# 测试前端
cd frontend
npm test

# 测试后端
cd ../backend
npm test

# 生成覆盖率报告
npm run test:coverage
```

#### 步骤7：验证系统
```bash
# 验证后端健康状态
curl http://localhost:5000/health

# 验证数据库连接
curl http://localhost:5000/api/auth/status

# 验证前端
open http://localhost:3000
```

### 常见问题排查

```bash
# 问题：端口已被占用
# 解决方案：更改端口或杀死占用进程
lsof -i :5000  # 查看占用5000端口的进程
kill -9 <PID>

# 问题：数据库连接失败
# 解决方案：检查PostgreSQL状态
brew services list | grep postgresql
brew services restart postgresql@15

# 问题：npm依赖冲突
# 解决方案：清除缓存重新安装
npm cache clean --force
rm -rf node_modules package-lock.json
npm install

# 问题：TypeScript编译错误
# 解决方案：检查类型定义
npm run type-check

# 问题：端口3000或5000被占用
# 解决方案：使用不同端口
# 在vite.config.ts中修改端口
# 在.env中修改PORT变量
```

---

## 云端部署

### 选项1：AWS部署（推荐）

#### 1.1 使用AWS Amplify部署前端

```bash
# 安装Amplify CLI
npm install -g @aws-amplify/cli

# 初始化Amplify项目
cd frontend
amplify init

# 添加托管环境
amplify add hosting

# 部署
amplify publish
```

#### 1.2 使用AWS RDS部署数据库

```bash
# AWS CLI配置
aws configure
# 输入: Access Key ID, Secret Access Key, Region, Output Format

# 创建RDS实例（PostgreSQL）
aws rds create-db-instance \
  --db-instance-identifier interview-genai-db \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --master-username admin \
  --master-user-password YourPassword123! \
  --allocated-storage 20 \
  --publicly-accessible true \
  --region us-east-1

# 获取数据库端点
aws rds describe-db-instances \
  --db-instance-identifier interview-genai-db \
  --query 'DBInstances[0].Endpoint'
```

#### 1.3 使用AWS ECS部署后端

```bash
# 创建Docker镜像
cd backend
docker build -t interview-genai-api:latest .

# 标记镜像用于ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com

docker tag interview-genai-api:latest YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/interview-genai-api:latest

docker push YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/interview-genai-api:latest
```

### 选项2：Vercel部署（快速）

#### 2.1 部署前端到Vercel

```bash
# 安装Vercel CLI
npm install -g vercel

# 从项目根目录部署
cd frontend
vercel

# 按照提示完成部署
# 选择项目名称、框架（Vite）等
```

#### 2.2 环境变量配置
```bash
# 在Vercel控制面板中设置环境变量
VITE_API_URL=https://your-api-domain.com/api
VITE_APP_NAME=Interview GenAI
```

### 选项3：Docker+Kubernetes部署

#### 3.1 创建Dockerfile

```dockerfile
# frontend/Dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

# backend/Dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 5000
CMD ["npm", "start"]
```

#### 3.2 Docker Compose部署

```yaml
# docker-compose.yml
version: '3.9'

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
      POSTGRES_DB: interview_genai
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - genai-network

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    networks:
      - genai-network

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    environment:
      DB_HOST: postgres
      DB_PORT: 5432
      DB_NAME: interview_genai
      REDIS_URL: redis://redis:6379
    ports:
      - "5000:5000"
    depends_on:
      - postgres
      - redis
    networks:
      - genai-network
    restart: unless-stopped

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    ports:
      - "3000:80"
    environment:
      VITE_API_URL: http://localhost:5000/api
    depends_on:
      - backend
    networks:
      - genai-network
    restart: unless-stopped

volumes:
  postgres_data:

networks:
  genai-network:
    driver: bridge
```

#### 3.3 启动Docker Compose

```bash
# 启动所有服务
docker-compose up -d

# 查看日志
docker-compose logs -f

# 停止服务
docker-compose down

# 清理所有数据
docker-compose down -v
```

#### 3.4 Kubernetes部署

```yaml
# kubernetes/postgres-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: postgres
spec:
  replicas: 1
  selector:
    matchLabels:
      app: postgres
  template:
    metadata:
      labels:
        app: postgres
    spec:
      containers:
      - name: postgres
        image: postgres:15-alpine
        ports:
        - containerPort: 5432
        env:
        - name: POSTGRES_PASSWORD
          valueFrom:
            secretKeyRef:
              name: db-secret
              key: password
        volumeMounts:
        - name: data
          mountPath: /var/lib/postgresql/data
      volumes:
      - name: data
        emptyDir: {}

# kubernetes/backend-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: backend
spec:
  replicas: 3
  selector:
    matchLabels:
      app: backend
  template:
    metadata:
      labels:
        app: backend
    spec:
      containers:
      - name: backend
        image: interview-genai-api:latest
        ports:
        - containerPort: 5000
        env:
        - name: DB_HOST
          value: postgres
        - name: NODE_ENV
          value: production
        livenessProbe:
          httpGet:
            path: /health
            port: 5000
          initialDelaySeconds: 30
          periodSeconds: 10

# kubernetes/service.yaml
apiVersion: v1
kind: Service
metadata:
  name: backend-service
spec:
  type: LoadBalancer
  selector:
    app: backend
  ports:
  - protocol: TCP
    port: 5000
    targetPort: 5000
```

#### 3.5 应用Kubernetes配置

```bash
# 创建命名空间
kubectl create namespace interview-genai

# 创建数据库凭证
kubectl create secret generic db-secret \
  --from-literal=password=YourPassword123! \
  -n interview-genai

# 应用配置
kubectl apply -f kubernetes/ -n interview-genai

# 检查部署状态
kubectl get deployments -n interview-genai
kubectl get pods -n interview-genai
kubectl get services -n interview-genai

# 查看日志
kubectl logs -f deployment/backend -n interview-genai

# 端口转发（本地测试）
kubectl port-forward service/backend-service 5000:5000 -n interview-genai
```

---

## 系统架构

### 高级架构图
```
┌─────────────────────────────────────────────────────────────┐
│                    客户端 (Mac浏览器)                          │
│                   localhost:3000                              │
└────────────────────────┬────────────────────────────────────┘
                         │
                         │ HTTP/HTTPS
                         │
┌────────────────────────▼────────────────────────────────────┐
│            前端应用 (React + Vite)                            │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Pages: Dashboard, Prediction, Evolution, A/B Test   │   │
│  │ Components: Charts, Cards, Forms, Navigation        │   │
│  │ State: Zustand (Auth, User, Pattern)               │   │
│  │ API Client: Axios + Interceptors                   │   │
│  └──────────────────────────────────────────────────────┘   │
└────────────────────────┬────────────────────────────────────┘
                         │
                         │ REST API (http://localhost:5000)
                         │
┌────────────────────────▼────────────────────────────────────┐
│           后端API服务 (Express.js)                           │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Routes:                                               │   │
│  │  - /api/auth (登录、注册、刷新令牌)                    │   │
│  │  - /api/patterns (模式CRUD操作)                       │   │
│  │  - /api/predictions (预测、反馈)                      │   │
│  │  - /api/users (用户管理)                              │   │
│  │  - /api/analytics (分析统计)                          │   │
│  │                                                      │   │
│  │ Middleware: Authentication, Logging, Error Handler  │   │
│  │ Services: Pattern Detection, ML Models              │   │
│  │ Controllers: Request/Response处理                   │   │
│  └──────────────────────────────────────────────────────┘   │
└────────────────────────┬────────────────────────────────────┘
                         │
          ┌──────────────┼──────────────┐
          │              │              │
   ┌──────▼────┐  ┌──────▼────┐  ┌──────▼──────┐
   │ PostgreSQL │  │   Redis   │  │  File Store │
   │ (users,    │  │  (cache,  │  │  (uploads)  │
   │ patterns,  │  │  sessions)│  │             │
   │ predictions)│  │           │  │             │
   └───────────┘  └───────────┘  └─────────────┘
```

### 数据流

```
User Input (浏览器)
     ↓
React Components (Frontend)
     ↓
Zustand Store (State Management)
     ↓
Axios API Client
     ↓
HTTP Request (localhost:5000)
     ↓
Express Router
     ↓
Middleware (Auth, Validation)
     ↓
Controller
     ↓
Service (Business Logic)
     ↓
PostgreSQL Database
     ↓
Response JSON
     ↓
Axios Interceptor
     ↓
Store Update
     ↓
Component Re-render
     ↓
Updated UI (浏览器)
```

### 部署架构

#### 本地开发
```
Mac电脑
├── Frontend: http://localhost:3000 (Vite)
├── Backend: http://localhost:5000 (Express)
├── Database: localhost:5432 (PostgreSQL)
└── Cache: localhost:6379 (Redis)
```

#### 云端生产
```
AWS / GCP / Azure
├── CDN
│   └── Frontend (React SPA)
├── Load Balancer
│   └── API Servers (多实例)
│       ├── Authentication
│       ├── Pattern Recognition
│       └── Analytics Engine
├── RDS
│   └── PostgreSQL (主从复制)
├── ElastiCache
│   └── Redis (分布式缓存)
└── S3 / Object Storage
    └── 用户数据 & 日志
```

---

## 监控和日志

### 日志系统配置

```typescript
// backend/src/config/logger.ts
import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

export default logger;
```

### 性能监控

```bash
# 使用PM2监控
pm2 monit

# 使用New Relic APM（云端）
npm install newrelic
# 在app启动前加载: require('newrelic')

# 使用Datadog监控
# 参考: https://docs.datadoghq.com/agent/basic_agent_usage/
```

---

## 安全最佳实践

### 环境变量管理
```bash
# 绝不提交.env文件到Git
echo ".env" >> .gitignore
echo ".env.local" >> .gitignore

# 使用.env.example作为模板
cp .env .env.example
# 删除.env.example中的敏感值
```

### 数据库安全
```sql
-- 创建只读用户用于查询
CREATE USER readonly_user WITH PASSWORD 'secure_password';
GRANT SELECT ON ALL TABLES IN SCHEMA public TO readonly_user;

-- 启用SSL连接
# 在postgresql.conf中
ssl = on
ssl_cert_file = '/path/to/cert.pem'
ssl_key_file = '/path/to/key.pem'
```

### API安全
```typescript
// 后端验证
- HTTPS only
- JWT token (short-lived)
- Rate limiting
- CORS configuration
- SQL injection prevention (use parameterized queries)
- XSS protection (sanitize inputs)
- CSRF tokens
```

---

## 总结

现在你可以：

1. ✅ 在Mac上完整运行整个系统
2. ✅ 本地开发和测试
3. ✅ 部署到云端（AWS/Vercel/Docker）
4. ✅ 使用真实数据库存储
5. ✅ 让真实用户访问系统

### 快速参考

```bash
# 一键启动（从项目根目录）
docker-compose up -d

# 或分别启动
# 终端1：后端
cd backend && npm run dev

# 终端2：前端
cd frontend && npm run dev

# 终端3：数据库
brew services start postgresql@15

# 访问应用
open http://localhost:3000
```

---

**需要帮助？**
- 检查logs目录中的日志
- 查看docker-compose.yml配置
- 参考API文档和系统设计文档
