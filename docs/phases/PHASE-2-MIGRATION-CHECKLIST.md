# Phase 2: 样式迁移检查清单

## 📋 项目概览

**目标**: 将所有内联样式迁移到 CSS Module，建立可复用的组件样式库

**时间预估**: 2-3 天
**优先级**: 🔴 高
**影响范围**: 4 个页面，130+ 处内联样式

---

## ✅ Phase 1 基础设施验证

在开始 Phase 2 前，确保 Phase 1 已完成：

- [x] `frontend/src/styles/variables.css` 存在
- [x] `frontend/src/components/ErrorBoundary.tsx` 存在
- [x] `frontend/src/utils/validation.ts` 存在
- [x] `UI-UX-OPTIMIZATION-PLAN.md` 已审查
- [x] 开发环境中无错误

---

## 📁 Phase 2 文件创建清单

### 已创建文件

- [x] `PHASE-2-IMPLEMENTATION-GUIDE.md` - 实施指南（本周期）
- [x] `PHASE-2-MIGRATION-CHECKLIST.md` - 本清单
- [x] `frontend/src/styles/components.css` - 通用组件样式库
- [x] `frontend/src/pages/LoginPage.css` - LoginPage 样式

### 待创建文件

- [ ] `frontend/src/pages/RegisterPage.css` - RegisterPage 样式
- [ ] `frontend/src/pages/DashboardPage.css` - DashboardPage 样式
- [ ] `frontend/src/pages/MetacognitiveAssessmentPage.css` - 评估页面样式
- [ ] 其他页面 CSS（如需）

---

## 🎯 任务 1: 通用组件库集成

### 状态: ✅ 完成

**文件**: `frontend/src/styles/components.css`

**验证清单**:
- [x] 表单输入样式完成
- [x] 按钮样式完成
- [x] 卡片样式完成
- [x] 表单消息样式完成
- [x] 徽章和标签样式完成
- [x] 警告框样式完成
- [x] 响应式设计支持
- [x] 可访问性支持
- [x] 暗黑模式支持
- [x] 所有样式使用 CSS 变量

**下一步**: 在页面中导入此文件

---

## 🎯 任务 2: 迁移 LoginPage

### 状态: ⏳ 进行中

**文件**:
- `frontend/src/pages/LoginPage.tsx` (待更新)
- `frontend/src/pages/LoginPage.css` (已创建)

### 2.1 代码审查

当前代码分析:

```
LoginPage.tsx 统计:
├─ 总行数: 160
├─ 内联样式行: 40+ (lines 98-137)
├─ 样式对象数: 5
└─ 动态样式: focusedField 状态
```

### 2.2 迁移步骤

#### 步骤 2.2.1: 添加 CSS 导入

```typescript
// 在 LoginPage.tsx 顶部添加
import './LoginPage.css';
import '../styles/components.css'; // 通用组件样式
```

#### 步骤 2.2.2: 移除内联样式 - 邮箱输入

**当前代码** (lines 98-103):
```typescript
<input
  style={{
    borderColor: focusedField === 'email' ? '#667eea' : formErrors.email ? '#ef4444' : '#e5e7eb',
    backgroundColor: focusedField === 'email' ? '#f0f9ff' : '#f9fafb',
    transition: 'all 150ms ease',
  }}
/>
```

**更新后**:
```typescript
<input
  className={`form-input ${formErrors.email ? 'error' : ''}`}
/>
```

**CSS** (在 LoginPage.css 中已定义):
```css
.form-input {
  border-color: var(--color-border);
  background-color: var(--color-bg-secondary);
}

.form-input.error {
  border-color: var(--color-danger);
  background-color: var(--color-danger-light);
}
```

#### 步骤 2.2.3: 移除内联样式 - 密码输入

同上，使用相同的 `form-input` 类

#### 步骤 2.2.4: 移除内联样式 - 提交按钮

**当前代码** (lines 133-137):
```typescript
<button
  style={{
    opacity: loading ? 0.7 : 1,
    transform: loading ? 'scale(0.98)' : 'scale(1)',
    transition: 'all 150ms ease',
  }}
>
```

**更新后**:
```typescript
<button className="auth-submit">
```

**CSS** (在 LoginPage.css 中已定义):
```css
.auth-submit:disabled {
  opacity: 0.6;
}

.auth-submit.loading {
  pointer-events: none;
}
```

#### 步骤 2.2.5: 检查加载动画

**当前代码** (line 141):
```typescript
<span style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }}>⏳</span>
```

**更新后**:
```typescript
<span>⏳</span>
```

**CSS** (已在 LoginPage.css 中定义):
```css
.auth-submit.loading::after {
  animation: spin 0.75s linear infinite;
}
```

### 2.3 测试 LoginPage

测试清单:

- [ ] 页面加载正常
- [ ] 输入框焦点样式正确
- [ ] 错误消息样式正确
- [ ] 禁用状态正常
- [ ] 加载动画正常
- [ ] 颜色一致
- [ ] 间距一致
- [ ] 响应式设计正常
- [ ] 暗黑模式正常
- [ ] 无 CSS 错误或警告

### 2.4 提交 LoginPage

```bash
git add frontend/src/pages/LoginPage.tsx
git add frontend/src/pages/LoginPage.css
git commit -m "Migrate LoginPage to CSS Module

- Extract all inline styles from LoginPage.tsx
- Create LoginPage.css with complete styling
- Use CSS variables for all colors and spacing
- Remove focusedField-based style management
- Improve accessibility with focus states
- Add responsive design and dark mode support"
```

---

## 🎯 任务 3: 迁移 RegisterPage

### 状态: ⏳ 准备中

**类似于 LoginPage**，RegisterPage 需要：

### 3.1 额外元素

RegisterPage 有一些额外的元素需要样式：

```
├─ 密码强度指示器
│  ├─ 弱 (红色)
│  ├─ 一般 (黄色)
│  ├─ 较好 (蓝色)
│  └─ 很好 (绿色)
├─ 确认密码输入
├─ 条款和条件复选框
└─ 创建账户按钮
```

### 3.2 密码强度样式

在 `RegisterPage.css` 中添加：

```css
.password-strength {
  display: flex;
  gap: var(--sp-2);
  margin-top: var(--sp-2);
}

.strength-bar {
  flex: 1;
  height: 4px;
  background-color: var(--color-bg-tertiary);
  border-radius: var(--radius-full);
  overflow: hidden;
}

.strength-bar.weak {
  background-color: var(--color-danger);
}

.strength-bar.fair {
  background-color: var(--color-warning);
}

.strength-bar.good {
  background-color: var(--color-primary);
}

.strength-bar.strong {
  background-color: var(--color-success);
}

.strength-label {
  font-size: var(--text-xs);
  font-weight: var(--fw-semibold);
  color: var(--color-text-secondary);
}
```

### 3.3 迁移步骤

1. 创建 `frontend/src/pages/RegisterPage.css`
2. 复制 LoginPage.css 作为基础
3. 添加密码强度指示器样式
4. 添加复选框样式
5. 移除 RegisterPage.tsx 中的内联样式
6. 测试所有功能
7. 提交更改

---

## 🎯 任务 4: 迁移 DashboardPage

### 状态: ⏳ 准备中

**当前状态**:
- 大量内联样式 (lines 152-520)
- 复杂的布局和图表
- 多种组件类型

### 4.1 主要组件

```
DashboardPage 组件:
├─ 标题区域
├─ 指标网格 (4 个卡片)
├─ Info Tooltip 组件
├─ 快速操作区域
└─ 数据图表区域
```

### 4.2 创建 DashboardPage.css

这个文件会很大（300+ 行）。结构：

```css
/* 容器和布局 */
.dashboard-page { ... }
.dashboard-header { ... }
.dashboard-title { ... }

/* 指标部分 */
.metrics-grid { ... }
.metric-card { ... }
.metric-label { ... }
.metric-value { ... }

/* 快速操作 */
.quick-actions { ... }
.action-button { ... }
.action-icon { ... }

/* 图表 */
.charts-grid { ... }
.chart-container { ... }
.chart-title { ... }

/* 响应式设计 */
@media (max-width: 1024px) { ... }
@media (max-width: 768px) { ... }
```

### 4.3 迁移步骤

1. 创建 `frontend/src/pages/DashboardPage.css`
2. 从 PHASE-2-IMPLEMENTATION-GUIDE.md 复制代码
3. 移除 DashboardPage.tsx 中的所有 style={{}} 对象
4. 将样式应用为 className
5. 测试响应式设计
6. 验证图表显示正确
7. 提交更改

### 4.4 测试 DashboardPage

- [ ] 指标卡片显示正确
- [ ] 图表正确渲染
- [ ] 快速操作按钮可点击
- [ ] 响应式布局正常
- [ ] 暗黑模式颜色正确
- [ ] 无样式冲突
- [ ] Lighthouse 评分提升

---

## 🎯 任务 5: 迁移 MetacognitiveAssessmentPage

### 状态: ⏳ 准备中

**页面特点**:
- 多步问卷
- 进度条
- 问题卡片
- 完成屏幕

### 5.1 主要样式

```
├─ 问卷容器
├─ 进度条 (progress bar)
├─ 问题卡片
├─ 选项按钮
└─ 导航按钮 (上一步/下一步)
```

### 5.2 创建 MetacognitiveAssessmentPage.css

关键样式：

```css
/* 进度条 */
.progress-bar {
  width: 100%;
  height: 4px;
  background-color: var(--color-bg-tertiary);
  border-radius: var(--radius-full);
  overflow: hidden;
  margin-bottom: var(--sp-6);
}

.progress-fill {
  height: 100%;
  background-color: var(--color-primary);
  transition: width var(--transition-base);
}

/* 问题卡片 */
.question-card {
  background: var(--color-bg-primary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--sp-6);
  margin-bottom: var(--sp-6);
}

/* 选项 */
.option-button {
  padding: var(--sp-4);
  border: 2px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-bg-secondary);
  cursor: pointer;
  transition: var(--transition-base);
  text-align: left;
  margin-bottom: var(--sp-3);
}

.option-button:hover {
  border-color: var(--color-primary);
  background: var(--color-primary-lighter);
}

.option-button.selected {
  border-color: var(--color-primary);
  background: var(--color-primary);
  color: white;
}
```

---

## 🔍 验证清单 (所有页面)

### 代码质量检查

对每个迁移的页面执行：

- [ ] 无 `style={{...}}` 对象（除非绝对必要）
- [ ] 所有颜色使用 `--color-*` 变量
- [ ] 所有间距使用 `--sp-*` 变量
- [ ] 所有圆角使用 `--radius-*` 变量
- [ ] 所有阴影使用 `--shadow-*` 变量
- [ ] 所有过渡使用 `--transition-*` 变量

### 样式一致性检查

- [ ] 所有输入框样式一致
- [ ] 所有按钮样式一致
- [ ] 所有卡片样式一致
- [ ] 所有间距逻辑一致
- [ ] 所有颜色使用正确

### 浏览器兼容性检查

在以下浏览器中测试：

- [ ] Chrome (最新)
- [ ] Firefox (最新)
- [ ] Safari (最新)
- [ ] Edge (最新)
- [ ] Mobile Chrome
- [ ] Mobile Safari

### 响应式设计检查

测试以下尺寸：

- [ ] 手机 (375px)
- [ ] 小平板 (480px)
- [ ] 平板 (768px)
- [ ] 小桌面 (1024px)
- [ ] 桌面 (1440px)
- [ ] 大屏幕 (1920px)

### 可访问性检查

- [ ] 焦点指示器可见
- [ ] 颜色对比达到 WCAG AA
- [ ] 键盘导航正常
- [ ] 屏幕阅读器友好
- [ ] 标签正确关联

### 暗黑模式检查

在系统暗黑模式下测试：

- [ ] 颜色正确转换
- [ ] 文本对比充分
- [ ] 所有元素可见
- [ ] 图表可读

### 性能检查

- [ ] Lighthouse 性能评分
- [ ] CSS 文件大小
- [ ] 页面加载时间
- [ ] 无重排或重绘问题

---

## 📊 完成度跟踪

| 页面 | CSS 创建 | 代码迁移 | 测试 | 提交 | 状态 |
|------|---------|---------|------|------|------|
| 组件库 | ✅ | ✅ | ⏳ | ⏳ | 进行中 |
| LoginPage | ✅ | ⏳ | ⏳ | ⏳ | 即将开始 |
| RegisterPage | ⏳ | ⏳ | ⏳ | ⏳ | 待开始 |
| DashboardPage | ⏳ | ⏳ | ⏳ | ⏳ | 待开始 |
| AssessmentPage | ⏳ | ⏳ | ⏳ | ⏳ | 待开始 |

---

## 🚀 完成标准

Phase 2 完成时应达到：

- [x] 所有 CSS 文件创建完毕
- [ ] 所有页面代码迁移完毕
- [ ] 所有页面通过测试
- [ ] CSS 一致性: 30% → 70%
- [ ] 所有 style={{}} 对象移除 (除必要)
- [ ] Lighthouse 性能评分: ≥ 50
- [ ] 暗黑模式完全支持
- [ ] 响应式设计验证
- [ ] 所有更改提交

---

## 📝 提交信息模板

### 单个页面迁移

```
Migrate [PageName] to CSS Module

- Extract all inline styles from [PageName].tsx
- Create [PageName].css with complete styling
- Use CSS variables for all colors and spacing
- Improve [specific improvements]
- Add responsive design support
- Verify dark mode compatibility

Removed [X] inline style objects
CSS consistency improved: 30% → [new percentage]%
```

### 最终 Phase 2 提交

```
Complete Phase 2: CSS Extraction and Styling

This commit finalizes Phase 2 with:
- All pages migrated to CSS Modules
- Reusable component styles library (components.css)
- CSS variables used for all styling
- Responsive design across all pages
- Dark mode support verified
- Accessibility standards met (WCAG AA)

Summary:
- 4 pages migrated (LoginPage, RegisterPage, DashboardPage, AssessmentPage)
- 0 inline styles in production code
- CSS consistency: 30% → 70%
- All styles use design system tokens
- Lighthouse performance: ≥ 50

Ready for Phase 3: Performance Optimization
```

---

## 📞 常见问题

### Q: 如果有动态样式怎么办？
A: 使用 CSS classes 和 JavaScript 来切换，或使用 CSS 自定义属性 (CSS variables)

```typescript
// 例如，基于状态改变颜色
<div className={`card ${isActive ? 'active' : ''}`} />
```

### Q: 需要支持 IE 吗？
A: CSS 变量在 IE 11 中不支持。如需支持，请使用 PostCSS 或 CSS-in-JS

### Q: 暗黑模式怎么测试？
A: 在 Chrome DevTools 中：Rendering → Emulate CSS media feature prefers-color-scheme

### Q: 如何保持样式不变？
A: 逐步迁移，频繁测试，参考 LoginPage.css 作为模板

---

## 📅 时间表

| 日期 | 任务 | 预期完成 |
|------|------|---------|
| 今天 | 通用库 + LoginPage | 当日 |
| 明天 | RegisterPage + DashboardPage | 当日 |
| 后天 | AssessmentPage + 测试 | 当日 |
| **本周末** | **Phase 2 完成** | **70% CSS 一致性** |

---

**Phase 2 目标**: CSS 一致性 30% → 70%
**预计完成**: 2025-11-20 ~ 2025-11-21
**状态**: ✅ 基础准备完毕，即将启动页面迁移
