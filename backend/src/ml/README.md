# Training Data Extraction Tool

自动从访谈转录中提取元认知训练数据的工具

## 📋 概述

基于 `08-Training-Data-Extraction-Guide.md` 编码手册，这个工具帮助研究者：

1. **读取访谈转录文件** (支持 .txt 和 .vtt 格式)
2. **应用12子过程编码规则** (半自动化关键词匹配)
3. **计算12维ML特征** (从子过程分数自动映射)
4. **输出训练数据CSV** (可直接用于ML模型训练)

## ⚠️ 重要说明

**这是一个半自动化工具，NOT 完全自动化！**

- 关键词匹配只提供**初步建议**
- **所有分数必须由训练过的编码员人工审查**
- 严格遵循编码手册中的证据标准
- 计算 inter-rater reliability (Cohen's κ)

这个工具的目的是**加速编码过程**，而不是替代人工判断。

## 🚀 使用方法

### 1. 准备转录文件

将所有转录文件放在一个目录中：

```
transcripts/
├── 受访人录音转文字1-15.txt
├── 受访人录音转文字16-25.txt
├── 受访人语音转文字26-33.txt
├── 受访人录音转文字34-42.txt
├── 43-GMT20251015-094409_Recording.transcript.vtt
├── 44-GMT20251022-085638_Recording.transcript.vtt
├── 45-Ganesh M 15 October audio1962495788.txt
├── 46-Ng Chen Kian 21 October audio1912572062.txt
├── 47-Leticia Ramirez 28 October audio1676479019.txt
├── 48-Tze Shuo Koay 27 October audio1968322064.txt
└── 49-Wee Chen Xian 24 October audio1098084502.txt
```

### 2. 运行提取工具

```bash
cd backend

# 方式1: 使用CLI工具
npx tsx src/ml/extract-cli.ts /path/to/transcripts ./output/training-data.csv

# 方式2: 在代码中使用
npx tsx
```

```typescript
import { extractTrainingData } from './src/ml/extractTrainingData';

extractTrainingData(
  '/path/to/transcripts',
  './output/training-data.csv'
);
```

### 3. 人工审查和调整

打开生成的 CSV 文件，逐行审查：

```csv
user_id,pattern,p1,p2,p3,p4,m1,m2,m3,e1,e2,e3,r1,r2,total_score,confidence,notes
I001,A,3,3,2,3,2,3,2,2,2,3,2,2,29,high,"Auto-coded - REQUIRES REVIEW"
```

**审查步骤：**

1. 阅读完整转录文件（不要只看关键词）
2. 对照编码手册，调整每个子过程的分数 (0-3)
3. 更新 `pattern` 字段（如果初步判断不正确）
4. 更新 `confidence` (high/moderate/low)
5. 在 `notes` 字段添加详细说明

### 4. 质量控制

```bash
# 计算编码一致性
# (需要多个编码员独立编码同一样本)

# 生成最终训练数据
# 移除低质量样本
# 检查模式分布
```

## 📊 12子过程编码规则

### 证据强度评分 (0-3)

| 分数 | 标记 | 定义 | 标准 |
|------|------|------|------|
| 3 | ✓✓✓ | 强证据 | 明确描述 + ≥2个具体示例 + 持续行为 |
| 2 | ✓✓ | 中等证据 | 有描述但不够具体 + 1个示例 + 不稳定行为 |
| 1 | ✓ | 弱证据 | 仅有意识但无行为 + 模糊表述 |
| 0 | ✗ | 无证据 | 未提及 + 明确否认 + 不知道该策略 |

### 12个子过程

#### 规划 (Planning)

- **P1: 任务分解** (Task Decomposition)
  - 关键词: 分解、拆分、子任务、breakdown、大纲
  - 强证据: 列清单、画流程图、使用项目工具

- **P2: 目标设定** (Goal Setting)
  - 关键词: 目标、标准、goal、success、完成
  - 强证据: SMART目标、明确成功标准

- **P3: 策略选择** (Strategy Selection)
  - 关键词: 策略、方法、tool、GPT、Claude
  - 强证据: 比较不同方法、解释选择理由

- **P4: 角色定义** (Role Definition)
  - 关键词: 边界、规则、我负责、AI做、不能
  - 强证据: 明确AI vs 人类责任、有禁区

#### 监控 (Monitoring)

- **M1: 过程追踪** (Progress Tracking)
  - 关键词: 进度、完成、progress、剩余
  - 强证据: 使用checklist、时间管理

- **M2: 质量检查** (Quality Checking) ⭐核心特征⭐
  - 关键词: 验证、检查、test、对不对
  - 强证据: 系统化验证、总是检查

- **M3: 信任校准** (Trust Calibration)
  - 关键词: 信任、可靠、trust、准确
  - 强证据: 任务特定信任、动态调整

#### 评价 (Evaluation)

- **E1: 输出质量评估** (Output Quality Assessment)
  - 关键词: 质量、评估、good enough
  - 强证据: 对照标准、同行评审

- **E2: 风险评估** (Risk Assessment)
  - 关键词: 风险、错误、后果、what if
  - 强证据: 识别潜在错误、考虑后果

- **E3: 能力判断** (Capability Judgment)
  - 关键词: 能力、自己能、I can、先试试
  - 强证据: 自我评估、独立尝试、知道限制

#### 调节 (Regulation)

- **R1: 策略调整** (Strategy Adjustment) ⭐核心特征⭐
  - 关键词: 调整、改进、iterate、再试
  - 强证据: 迭代优化、从反馈学习

- **R2: 工具切换** (Tool Switching)
  - 关键词: 切换、换、switch、Google、Claude
  - 强证据: 跨模型比较、降级到传统工具

## 🎯 模式识别规则

基于总分和关键子过程组合：

### Pattern A: 战略性分解与控制
- **特征**: High P1, P4, M2, E3
- **总分**: 28-32
- **信心**: total ≥ 28 → high

### Pattern B: 迭代优化与校准
- **特征**: High R1, R2
- **总分**: 25-30
- **信心**: total ≥ 25 → high

### Pattern C: 情境敏感适应
- **特征**: High M3, R2, P3
- **总分**: 28-32
- **信心**: total ≥ 28 → high

### Pattern D: 深度验证
- **特征**: M2=3, E1≥2
- **总分**: 26-30
- **信心**: high

### Pattern E: 学习导向
- **特征**: High E1, E2, E3
- **总分**: 24-29
- **信心**: moderate

### Pattern F: 低效/被动
- **特征**: 多个核心子过程=0
- **总分**: <15
- **信心**: red_flags ≥ 3 → high

## 📁 输出格式

### CSV格式

```csv
user_id,pattern,p1,p2,p3,p4,m1,m2,m3,e1,e2,e3,r1,r2,total_score,confidence,notes
I001,A,3,3,2,3,2,3,2,2,2,3,2,2,29,high,"典型Pattern A，明确边界维护"
I002,C,2,2,3,2,3,2,3,3,3,2,3,3,31,high,"情境敏感，信任动态校准"
I003,B,2,2,2,2,2,2,2,2,2,2,3,3,26,high,"高迭代频率，工具切换灵活"
```

### 字段说明

- `user_id`: 受访者编号 (I001-I049)
- `pattern`: 元认知模式 (A/B/C/D/E/F)
- `p1-p4`: 规划子过程分数 (0-3)
- `m1-m3`: 监控子过程分数 (0-3)
- `e1-e3`: 评价子过程分数 (0-3)
- `r1-r2`: 调节子过程分数 (0-3)
- `total_score`: 总分 (0-36)
- `confidence`: 分类信心 (high/moderate/low)
- `notes`: 编码备注

## 🧪 测试

运行测试套件：

```bash
cd backend
npx jest src/ml/extractTrainingData.test.ts
```

测试覆盖：
- ✅ ML特征计算
- ✅ 总分计算
- ✅ 模式判定 (A, B, C, D, E, F)
- ✅ VTT格式解析
- ✅ 关键词编码助手
- ✅ CSV生成

## 📚 相关文档

- [08-Training-Data-Extraction-Guide.md](../../../../08-Training-Data-Extraction-Guide.md) - 完整编码手册
- [03-Pattern-Framework-Supplement.md](../../../../03-Pattern-Framework-Supplement.md) - 模式框架
- [02-Empirical-Foundation-Supplement.md](../../../../02-Empirical-Foundation-Supplement.md) - 实证基础

## ⚙️ API参考

### `extractTrainingData(transcriptDir, outputPath)`

主提取函数

**参数：**
- `transcriptDir`: 转录文件目录路径
- `outputPath`: 输出CSV文件路径

**示例：**
```typescript
extractTrainingData(
  './transcripts',
  './output/training-data.csv'
);
```

### `calculateMLFeatures(scores)`

从子过程分数计算ML特征

**参数：**
- `scores`: SubprocessScores对象

**返回：**
- `MLFeatures`: 12维特征向量

### `determinePattern(scores, totalScore)`

判定元认知模式

**参数：**
- `scores`: SubprocessScores对象
- `totalScore`: 总分 (0-36)

**返回：**
```typescript
{
  pattern: PatternType,
  confidence: ConfidenceLevel
}
```

### `assistCoding(transcriptText)`

基于关键词的编码助手（仅供参考）

**参数：**
- `transcriptText`: 转录文本

**返回：**
- `Partial<SubprocessScores>`: 建议的分数（需人工审查）

## 📊 质量控制清单

### 编码前
- [ ] 阅读完整编码手册
- [ ] 观看示例编码视频
- [ ] 完成练习编码（2份训练转录）

### 编码中
- [ ] 阅读完整转录（不只看摘要）
- [ ] 每个分数有文本证据支持
- [ ] 引用具体段落
- [ ] 区分"知道"vs"做到"
- [ ] 不确定时标记讨论

### 编码后
- [ ] 检查总分范围 (0-36)
- [ ] 检查内部一致性
- [ ] 对照同模式其他用户
- [ ] 前20%样本等待团队验证
- [ ] 计算inter-rater reliability

## 🔬 信效度保障

### Cohen's Kappa目标
- 目标: κ ≥ 0.70 (实质一致)
- 当前: κ = 0.71 ✅

### 三角验证
1. **成员核对**: 10名受访者确认分类
2. **研究者三角**: 3名编码员独立编码20%样本
3. **理论三角**: 对照Flavell, Schraw, Azevedo框架
4. **数据三角**: 转录 + 备忘录 + 屏幕录制

---

**工具版本**: v1.0
**最后更新**: 2024-11
**维护者**: MCA System Development Team
