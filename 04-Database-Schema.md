# Database Schema设计 - Prisma Schema

## 核心模型

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id            String    @id @default(uuid())
  email         String    @unique
  passwordHash  String
  name          String
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  
  sessions      Session[]
  skillBaselines SkillBaseline[]
  skillAlerts   SkillAlert[]
  
  @@map("users")
}

model Session {
  id            String    @id @default(uuid())
  userId        String
  user          User      @relation(fields: [userId], references: [id])
  
  startedAt     DateTime  @default(now())
  endedAt       DateTime?
  durationMinutes Float?
  
  taskDescription String?
  taskType      String?   // 'coding', 'writing', 'research', etc.
  taskImportance String?  // 'high', 'medium', 'low'
  
  interactions  Interaction[]
  patternLogs   PatternLog[]
  metrics       MetacognitiveMetric[]
  
  @@map("sessions")
  @@index([userId, startedAt])
}

model Interaction {
  id            String    @id @default(uuid())
  sessionId     String
  session       Session   @relation(fields: [sessionId], references: [id])
  
  timestamp     DateTime  @default(now())
  userPrompt    String    @db.Text
  aiResponse    String    @db.Text
  aiModel       String    // 'gpt-4-turbo', 'claude-sonnet-4-5', etc.
  
  promptWordCount Int
  responseTime  Float     // milliseconds
  
  wasVerified   Boolean   @default(false)
  wasModified   Boolean   @default(false)
  wasRejected   Boolean   @default(false)
  
  confidenceScore Float?  // MR13: 0-100
  uncertaintyReasons String[] // MR13
  
  @@map("interactions")
  @@index([sessionId, timestamp])
}

model PatternLog {
  id            String    @id @default(uuid())
  sessionId     String
  session       Session   @relation(fields: [sessionId], references: [id])
  
  timestamp     DateTime  @default(now())
  detectedPattern String  // 'A', 'B', 'C', 'D', 'E', 'F'
  confidence    Float     // 0-1
  
  features      Json      // 12-dimensional feature vector
  
  @@map("pattern_logs")
  @@index([sessionId, timestamp])
}

model MetacognitiveMetric {
  id            String    @id @default(uuid())
  sessionId     String
  session       Session   @relation(fields: [sessionId], references: [id])
  
  timestamp     DateTime  @default(now())
  
  // 12 features for pattern recognition
  promptSpecificity Float
  verificationRate Float
  iterationFrequency Float
  modificationRate Float
  taskDecompositionScore Float
  reflectionDepth Float
  crossModelUsage Float
  independentAttemptRate Float
  errorAwareness Float
  strategyDiversity Float
  trustCalibrationAccuracy Float
  timeBeforeAIQuery Float
  
  @@map("metacognitive_metrics")
  @@index([sessionId])
}

model SkillBaseline {
  id            String    @id @default(uuid())
  userId        String
  user          User      @relation(fields: [userId], references: [id])
  
  skillName     String    // 'python_coding', 'academic_writing', etc.
  baselineScore Float
  measuredAt    DateTime  @default(now())
  
  tests         SkillTest[]
  
  @@map("skill_baselines")
  @@index([userId, skillName])
}

model SkillTest {
  id            String    @id @default(uuid())
  baselineId    String
  baseline      SkillBaseline @relation(fields: [baselineId], references: [id])
  
  testedAt      DateTime  @default(now())
  score         Float
  
  independencePercentage Float  // % of task done without AI
  qualityScore  Float
  speedScore    Float
  
  @@map("skill_tests")
  @@index([baselineId, testedAt])
}

model SkillAlert {
  id            String    @id @default(uuid())
  userId        String
  user          User      @relation(fields: [userId], references: [id])
  
  triggeredAt   DateTime  @default(now())
  alertType     String    // 'skill_atrophy', 'over_reliance', etc.
  severity      String    // 'warning', 'critical'
  
  message       String    @db.Text
  dismissed     Boolean   @default(false)
  
  @@map("skill_alerts")
  @@index([userId, triggeredAt])
}

model ModelComparison {
  id            String    @id @default(uuid())
  userId        String
  
  createdAt     DateTime  @default(now())
  prompt        String    @db.Text
  
  results       Json      // Array of {model, output, latency, tokenCount}
  userRatings   Json?     // {model: rating}
  
  @@map("model_comparisons")
  @@index([userId, createdAt])
}
```

## 数据库关系图

```
User (1) ────< (N) Session
                     │
                     ├───< (N) Interaction
                     ├───< (N) PatternLog
                     └───< (N) MetacognitiveMetric

User (1) ────< (N) SkillBaseline ────< (N) SkillTest
User (1) ────< (N) SkillAlert
```

## 索引策略

高频查询优化：
- `sessions`: (userId, startedAt) - 查询用户历史会话
- `interactions`: (sessionId, timestamp) - 按时间顺序获取交互
- `pattern_logs`: (sessionId, timestamp) - Pattern演变追踪
- `skill_baselines`: (userId, skillName) - 技能追踪查询

## 初始化命令

```bash
# 生成Prisma Client
npx prisma generate

# 创建并应用迁移
npx prisma migrate dev --name init

# (可选) 使用Prisma Studio查看数据
npx prisma studio
```
