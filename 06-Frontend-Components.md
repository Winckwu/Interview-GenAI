# 前端组件架构 - React Component Design

> **框架**：React 18 + TypeScript  
> **样式**：Tailwind CSS + shadcn/ui  
> **状态管理**：Zustand  
> **路由**：React Router v6

---

## 📁 项目结构

```
frontend/src/
├── components/
│   ├── ui/                    # shadcn组件
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── card.tsx
│   │   ├── dialog.tsx
│   │   ├── alert.tsx
│   │   └── ...
│   │
│   ├── common/                # 共享组件
│   │   ├── Navbar.tsx
│   │   ├── Sidebar.tsx
│   │   ├── LoadingSpinner.tsx
│   │   ├── ErrorBoundary.tsx
│   │   └── ProtectedRoute.tsx
│   │
│   ├── chat/                  # 聊天相关
│   │   ├── ChatInterface.tsx
│   │   ├── MessageList.tsx
│   │   ├── MessageInput.tsx
│   │   ├── UserMessage.tsx
│   │   └── AIMessage.tsx
│   │
│   ├── pattern/               # Pattern相关
│   │   ├── PatternIndicator.tsx
│   │   ├── PatternHistory.tsx
│   │   ├── PatternExplanation.tsx
│   │   └── FeatureMetrics.tsx
│   │
│   ├── comparison/            # 跨模型比较 (MR6)
│   │   ├── ModelComparison.tsx
│   │   ├── ModelSelector.tsx
│   │   ├── OutputComparisonGrid.tsx
│   │   └── RatingWidget.tsx
│   │
│   ├── skill/                 # 技能监控 (MR16)
│   │   ├── SkillDashboard.tsx
│   │   ├── SkillTracker.tsx
│   │   ├── BaselineAssessment.tsx
│   │   └── SkillAlert.tsx
│   │
│   └── strategy/              # 策略指导 (MR15)
│       ├── StrategyTip.tsx
│       ├── TipBanner.tsx
│       └── StrategyLibrary.tsx
│
├── pages/
│   ├── LoginPage.tsx
│   ├── DashboardPage.tsx
│   ├── SessionPage.tsx
│   ├── ComparisonPage.tsx
│   ├── AnalyticsPage.tsx
│   └── ProfilePage.tsx
│
├── stores/
│   ├── authStore.ts
│   ├── sessionStore.ts
│   └── uiStore.ts
│
├── hooks/
│   ├── useAuth.ts
│   ├── useSession.ts
│   ├── usePatternDetection.ts
│   └── useModelComparison.ts
│
├── services/
│   ├── api.ts
│   ├── auth.service.ts
│   ├── session.service.ts
│   └── pattern.service.ts
│
├── types/
│   ├── user.types.ts
│   ├── session.types.ts
│   ├── pattern.types.ts
│   └── api.types.ts
│
├── utils/
│   ├── formatters.ts
│   ├── validators.ts
│   └── constants.ts
│
├── App.tsx
└── main.tsx
```

---

## 🎨 核心页面组件

### 1. SessionPage.tsx
**主聊天界面**

```tsx
import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { ChatInterface } from '@/components/chat/ChatInterface';
import { PatternIndicator } from '@/components/pattern/PatternIndicator';
import { StrategyTip } from '@/components/strategy/StrategyTip';
import { useSession } from '@/hooks/useSession';
import { usePatternDetection } from '@/hooks/usePatternDetection';

export const SessionPage: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const { session, interactions, addInteraction } = useSession(sessionId!);
  const { pattern, features, loading } = usePatternDetection(sessionId!);

  return (
    <div className="flex h-screen">
      {/* 主聊天区域 */}
      <div className="flex-1 flex flex-col">
        <ChatInterface
          sessionId={sessionId!}
          interactions={interactions}
          onSendMessage={addInteraction}
        />
      </div>

      {/* 右侧边栏 - Pattern指示器 */}
      <div className="w-80 border-l bg-gray-50 p-4 overflow-y-auto">
        <PatternIndicator
          pattern={pattern}
          confidence={features?.confidence || 0}
          features={features}
          loading={loading}
        />
        
        {/* 策略提示 */}
        <div className="mt-4">
          <StrategyTip sessionId={sessionId!} />
        </div>
      </div>
    </div>
  );
};
```

---

### 2. DashboardPage.tsx
**元认知仪表盘**

```tsx
import React from 'react';
import { SkillDashboard } from '@/components/skill/SkillDashboard';
import { PatternHistory } from '@/components/pattern/PatternHistory';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { useAnalytics } from '@/hooks/useAnalytics';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const { analytics, loading } = useAnalytics(user?.id);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* 欢迎信息 */}
      <div>
        <h1 className="text-3xl font-bold">Welcome back, {user?.name}!</h1>
        <p className="text-gray-600">这是你的元认知成长仪表盘</p>
      </div>

      {/* 概览卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>总会话数</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">{analytics.totalSessions}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>主导模式</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">Pattern {analytics.dominantPattern}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>验证率</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">
              {(analytics.verificationRate * 100).toFixed(0)}%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Pattern历史图表 */}
      <PatternHistory userId={user?.id} />

      {/* 技能追踪 */}
      <SkillDashboard userId={user?.id} />
    </div>
  );
};
```

---

### 3. ComparisonPage.tsx
**跨模型比较页面（MR6）**

```tsx
import React, { useState } from 'react';
import { ModelSelector } from '@/components/comparison/ModelSelector';
import { OutputComparisonGrid } from '@/components/comparison/OutputComparisonGrid';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useModelComparison } from '@/hooks/useModelComparison';

export const ComparisonPage: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [selectedModels, setSelectedModels] = useState<string[]>([
    'gpt-4-turbo',
    'claude-sonnet-4-5'
  ]);
  
  const { compare, comparison, loading } = useModelComparison();

  const handleCompare = () => {
    compare(prompt, selectedModels);
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">跨模型比较</h1>

      {/* 输入区域 */}
      <div className="space-y-4 mb-6">
        <Textarea
          placeholder="输入你的提示词..."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={4}
          className="w-full"
        />

        <div className="flex items-center justify-between">
          <ModelSelector
            selected={selectedModels}
            onChange={setSelectedModels}
          />

          <Button
            onClick={handleCompare}
            disabled={!prompt || selectedModels.length === 0 || loading}
          >
            {loading ? '比较中...' : '开始比较'}
          </Button>
        </div>
      </div>

      {/* 比较结果 */}
      {comparison && (
        <OutputComparisonGrid
          responses={comparison.responses}
          onRate={(model, rating) => {
            // 保存评分
          }}
        />
      )}
    </div>
  );
};
```

---

## 🧩 核心功能组件

### ChatInterface.tsx
**聊天界面主组件**

```tsx
import React, { useState, useRef, useEffect } from 'react';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';
import { LoadingIndicator } from '@/components/common/LoadingIndicator';
import type { Interaction } from '@/types/session.types';

interface ChatInterfaceProps {
  sessionId: string;
  interactions: Interaction[];
  onSendMessage: (prompt: string, model: string) => Promise<void>;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({
  sessionId,
  interactions,
  onSendMessage,
}) => {
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 自动滚动到最新消息
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [interactions]);

  const handleSend = async (prompt: string, model: string) => {
    setLoading(true);
    try {
      await onSendMessage(prompt, model);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* 消息列表 */}
      <div className="flex-1 overflow-y-auto p-4">
        <MessageList interactions={interactions} />
        {loading && <LoadingIndicator />}
        <div ref={messagesEndRef} />
      </div>

      {/* 输入区域 */}
      <div className="border-t p-4">
        <MessageInput
          onSend={handleSend}
          disabled={loading}
        />
      </div>
    </div>
  );
};
```

---

### PatternIndicator.tsx
**实时Pattern指示器**

```tsx
import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import type { Pattern, FeatureVector } from '@/types/pattern.types';

interface PatternIndicatorProps {
  pattern: Pattern | null;
  confidence: number;
  features: FeatureVector | null;
  loading: boolean;
}

const PATTERN_LABELS = {
  A: '战略性分解与控制',
  B: '迭代优化与校准',
  C: '情境敏感适配',
  D: '深度核验与批判',
  E: '教学化反思',
  F: '无效使用'
};

const PATTERN_COLORS = {
  A: 'bg-blue-500',
  B: 'bg-green-500',
  C: 'bg-purple-500',
  D: 'bg-orange-500',
  E: 'bg-pink-500',
  F: 'bg-red-500'
};

export const PatternIndicator: React.FC<PatternIndicatorProps> = ({
  pattern,
  confidence,
  features,
  loading
}) => {
  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse">分析中...</div>
        </CardContent>
      </Card>
    );
  }

  if (!pattern) {
    return (
      <Card>
        <CardContent className="p-6 text-gray-500">
          开始对话后，系统将识别你的元认知模式
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>当前模式</span>
          <Badge className={PATTERN_COLORS[pattern]}>
            Pattern {pattern}
          </Badge>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* 模式名称和描述 */}
        <div>
          <h3 className="font-semibold">{PATTERN_LABELS[pattern]}</h3>
          <p className="text-sm text-gray-600 mt-1">
            {getPatternDescription(pattern)}
          </p>
        </div>

        {/* 置信度 */}
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span>置信度</span>
            <span>{(confidence * 100).toFixed(0)}%</span>
          </div>
          <Progress value={confidence * 100} />
        </div>

        {/* 关键特征 */}
        {features && (
          <div className="space-y-2">
            <h4 className="font-semibold text-sm">关键特征</h4>
            <div className="space-y-1 text-sm">
              <FeatureBar
                label="提示词具体性"
                value={features.prompt_specificity}
                max={20}
              />
              <FeatureBar
                label="验证率"
                value={features.verification_rate}
                max={1}
              />
              <FeatureBar
                label="迭代频率"
                value={features.iteration_frequency}
                max={10}
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const FeatureBar: React.FC<{ label: string; value: number; max: number }> = ({
  label,
  value,
  max
}) => (
  <div>
    <div className="flex justify-between text-xs mb-0.5">
      <span>{label}</span>
      <span>{value.toFixed(1)}</span>
    </div>
    <Progress value={(value / max) * 100} className="h-1" />
  </div>
);
```

---

### ModelComparison.tsx
**跨模型比较组件（MR6核心）**

```tsx
import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { RatingWidget } from './RatingWidget';

interface ModelResponse {
  model: string;
  output: string;
  latency: number;
  tokenCount: number;
}

interface OutputComparisonGridProps {
  responses: ModelResponse[];
  onRate: (model: string, rating: number) => void;
}

export const OutputComparisonGrid: React.FC<OutputComparisonGridProps> = ({
  responses,
  onRate
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {responses.map((response) => (
        <Card key={response.model} className="flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>{getModelDisplayName(response.model)}</span>
              <Badge variant="outline">
                {response.latency}ms
              </Badge>
            </CardTitle>
          </CardHeader>

          <CardContent className="flex-1 flex flex-col">
            {/* AI输出 */}
            <div className="flex-1 overflow-y-auto mb-4 prose prose-sm max-w-none">
              <ReactMarkdown
                components={{
                  code({node, inline, className, children, ...props}) {
                    const match = /language-(\w+)/.exec(className || '');
                    return !inline && match ? (
                      <SyntaxHighlighter
                        language={match[1]}
                        PreTag="div"
                        {...props}
                      >
                        {String(children).replace(/\n$/, '')}
                      </SyntaxHighlighter>
                    ) : (
                      <code className={className} {...props}>
                        {children}
                      </code>
                    );
                  }
                }}
              >
                {response.output}
              </ReactMarkdown>
            </div>

            {/* 统计信息 */}
            <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
              <span>Tokens: {response.tokenCount}</span>
            </div>

            {/* 评分 */}
            <RatingWidget
              onRate={(rating) => onRate(response.model, rating)}
            />
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

function getModelDisplayName(model: string): string {
  const names: Record<string, string> = {
    'gpt-4-turbo': 'GPT-4 Turbo',
    'claude-sonnet-4-5': 'Claude Sonnet 4.5',
    'gemini-pro': 'Gemini Pro'
  };
  return names[model] || model;
}
```

---

### SkillAlert.tsx
**技能退化警告（MR16）**

```tsx
import React from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertTriangle, XCircle } from 'lucide-react';

interface SkillAlertProps {
  alert: {
    id: string;
    severity: 'warning' | 'critical';
    message: string;
    actionRequired: boolean;
    intervention?: {
      type: string;
      task: {
        id: string;
        description: string;
      };
    };
  };
  onDismiss: (id: string) => void;
  onStartTask?: (taskId: string) => void;
}

export const SkillAlert: React.FC<SkillAlertProps> = ({
  alert,
  onDismiss,
  onStartTask
}) => {
  const isWarning = alert.severity === 'warning';
  
  return (
    <Alert variant={isWarning ? 'default' : 'destructive'}>
      {isWarning ? (
        <AlertTriangle className="h-4 w-4" />
      ) : (
        <XCircle className="h-4 w-4" />
      )}
      
      <AlertTitle>
        {isWarning ? '⚠️ 技能退化警告' : '🚨 严重警告'}
      </AlertTitle>
      
      <AlertDescription className="mt-2 space-y-3">
        <p>{alert.message}</p>
        
        {alert.intervention && (
          <div className="bg-white p-3 rounded border">
            <p className="font-semibold mb-2">需要完成独立任务：</p>
            <p className="text-sm">{alert.intervention.task.description}</p>
            <Button
              className="mt-2"
              size="sm"
              onClick={() => onStartTask?.(alert.intervention!.task.id)}
            >
              开始任务
            </Button>
          </div>
        )}
        
        {!alert.actionRequired && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDismiss(alert.id)}
          >
            我知道了
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
};
```

---

## 🔄 状态管理（Zustand）

### sessionStore.ts

```typescript
import create from 'zustand';
import type { Session, Interaction } from '@/types/session.types';
import { sessionService } from '@/services/session.service';

interface SessionStore {
  currentSession: Session | null;
  interactions: Interaction[];
  loading: boolean;
  
  createSession: (data: CreateSessionDto) => Promise<void>;
  loadSession: (sessionId: string) => Promise<void>;
  addInteraction: (prompt: string, model: string) => Promise<void>;
  endSession: () => Promise<void>;
}

export const useSessionStore = create<SessionStore>((set, get) => ({
  currentSession: null,
  interactions: [],
  loading: false,
  
  createSession: async (data) => {
    set({ loading: true });
    try {
      const session = await sessionService.create(data);
      set({ currentSession: session, interactions: [] });
    } finally {
      set({ loading: false });
    }
  },
  
  loadSession: async (sessionId) => {
    set({ loading: true });
    try {
      const [session, interactions] = await Promise.all([
        sessionService.getById(sessionId),
        sessionService.getInteractions(sessionId)
      ]);
      set({ currentSession: session, interactions });
    } finally {
      set({ loading: false });
    }
  },
  
  addInteraction: async (prompt, model) => {
    const sessionId = get().currentSession?.id;
    if (!sessionId) return;
    
    const interaction = await sessionService.createInteraction({
      sessionId,
      userPrompt: prompt,
      aiModel: model
    });
    
    set((state) => ({
      interactions: [...state.interactions, interaction]
    }));
  },
  
  endSession: async () => {
    const sessionId = get().currentSession?.id;
    if (!sessionId) return;
    
    await sessionService.endSession(sessionId);
    set({ currentSession: null, interactions: [] });
  }
}));
```

---

## 🎣 自定义Hooks

### usePatternDetection.ts

```typescript
import { useState, useEffect } from 'react';
import { patternService } from '@/services/pattern.service';
import type { Pattern, FeatureVector } from '@/types/pattern.types';

export function usePatternDetection(sessionId: string) {
  const [pattern, setPattern] = useState<Pattern | null>(null);
  const [features, setFeatures] = useState<FeatureVector | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!sessionId) return;

    const detectPattern = async () => {
      setLoading(true);
      try {
        const result = await patternService.analyze(sessionId);
        setPattern(result.detectedPattern);
        setFeatures(result.features);
      } finally {
        setLoading(false);
      }
    };

    // 初次检测
    detectPattern();

    // 每30秒重新检测
    const interval = setInterval(detectPattern, 30000);

    return () => clearInterval(interval);
  }, [sessionId]);

  return { pattern, features, loading };
}
```

---

**文档版本**：v1.0  
**最后更新**：2024-11-15  
**下一步**：参考07-ML-Service-Design.md了解ML服务设计
