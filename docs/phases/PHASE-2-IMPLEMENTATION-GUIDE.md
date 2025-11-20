# Phase 2: 样式提取 - 实施指南

## 概述

Phase 2 的目标是将所有内联样式迁移到 CSS Module，建立可复用的组件样式库。

**目标**: CSS 一致性从 30% 提升到 70%
**时间**: 2-3 天
**页面**: LoginPage, RegisterPage, DashboardPage, MetacognitiveAssessmentPage
**收益**: 可维护性提升 50%、主题切换能力、代码重用率

---

## 任务分解

### 任务 1: 创建通用组件样式库

#### 1.1 创建 form-inputs.css
**路径**: `frontend/src/styles/form-inputs.css`

此文件包含所有表单输入元素的通用样式。

**包含的元素**:
- 文本输入 (input[type="text"])
- 邮箱输入 (input[type="email"])
- 密码输入 (input[type="password"])
- 文本域 (textarea)
- 选择框 (select)
- 复选框和单选框
- 标签 (label)
- 错误提示

**关键特性**:
- 使用 CSS 变量控制颜色、大小、间距
- 焦点状态和悬停状态
- 错误状态样式
- 禁用状态样式
- 响应式设计

#### 1.2 创建 buttons.css
**路径**: `frontend/src/styles/buttons.css`

此文件包含所有按钮的通用样式。

**按钮类型**:
- Primary (主按钮)
- Secondary (次按钮)
- Danger (危险按钮)
- Ghost (幽灵按钮)
- Disabled (禁用状态)
- Loading (加载状态)
- Size variations (小、中、大)

**特性**:
- 一致的边距和填充
- 悬停和活动状态
- 过渡效果
- 加载动画支持
- 无障碍聚焦指示器

#### 1.3 创建 cards.css
**路径**: `frontend/src/styles/cards.css`

此文件包含所有卡片容器的通用样式。

**卡片类型**:
- 标准卡片
- 带边框的卡片
- 带阴影的卡片
- 可交互的卡片 (悬停效果)
- 摘要卡片

**特性**:
- 背景颜色和边框
- 阴影和圆角
- 内部间距
- 悬停和焦点效果
- 动画过渡

#### 1.4 创建 forms.css
**路径**: `frontend/src/styles/forms.css`

此文件包含表单级别的样式。

**包含**:
- 表单容器布局
- 表单组 (form-group)
- 表单行 (form-row)
- 标签和输入对齐
- 错误消息样式
- 成功消息样式

---

### 任务 2: 迁移认证页面

#### 2.1 迁移 LoginPage

**当前状态**:
- 约 160 行代码
- 大量内联样式 (lines 98-137)
- 使用 focusedField 状态管理焦点样式

**迁移步骤**:

1. **创建 LoginPage.css**
```css
/* 认证页面容器 */
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: var(--sp-4);
}

/* 认证卡片 */
.auth-card {
  background: var(--color-bg-primary);
  border-radius: var(--radius-lg);
  padding: var(--sp-8);
  box-shadow: var(--shadow-xl);
  width: 100%;
  max-width: 420px;
}

/* 认证表单 */
.auth-form {
  display: flex;
  flex-direction: column;
  gap: var(--sp-6);
}

/* 表单组 */
.auth-form .form-group {
  display: flex;
  flex-direction: column;
  gap: var(--sp-2);
}

/* 标签 */
.auth-form label {
  font-size: var(--text-sm);
  font-weight: var(--fw-semibold);
  color: var(--color-text-primary);
}

/* 输入框 */
.auth-form input {
  padding: var(--sp-3);
  font-size: var(--text-base);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  font-family: inherit;
  transition: var(--transition-base);
}

.auth-form input:focus {
  outline: none;
  border-color: var(--color-primary);
  background-color: var(--color-bg-secondary);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.auth-form input.error {
  border-color: var(--color-danger);
  background-color: var(--color-danger-light);
}

/* 错误消息 */
.error-message {
  font-size: var(--text-sm);
  color: var(--color-danger);
  margin-top: var(--sp-1);
}

/* 按钮 */
.auth-button {
  padding: var(--sp-3);
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: var(--radius-md);
  font-size: var(--text-base);
  font-weight: var(--fw-semibold);
  cursor: pointer;
  transition: var(--transition-base);
}

.auth-button:hover:not(:disabled) {
  background: var(--color-primary-dark);
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

.auth-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

/* 页脚链接 */
.auth-footer {
  text-align: center;
  margin-top: var(--sp-6);
}

.auth-footer a {
  color: var(--color-primary);
  text-decoration: none;
  font-weight: var(--fw-semibold);
  transition: var(--transition-fast);
}

.auth-footer a:hover {
  text-decoration: underline;
  color: var(--color-primary-dark);
}

/* 响应式 */
@media (max-width: 768px) {
  .auth-card {
    padding: var(--sp-6);
  }
}
```

2. **更新 LoginPage.tsx**
```typescript
import './LoginPage.css';
import '../styles/form-inputs.css';

// 移除所有内联 style={{...}}
// 改为使用 className

// 示例：
// 之前
<input
  style={{
    borderColor: focusedField === 'email' ? '#667eea' : formErrors.email ? '#ef4444' : '#e5e7eb',
    backgroundColor: focusedField === 'email' ? '#f0f9ff' : '#f9fafb',
  }}
/>

// 之后
<input
  className={`form-input ${formErrors.email ? 'error' : ''} ${focusedField === 'email' ? 'focused' : ''}`}
/>

// 在 CSS 中处理
.form-input {
  /* 默认样式 */
  border-color: var(--color-border);
  background-color: var(--color-bg-secondary);
}

.form-input.focused {
  border-color: var(--color-primary);
  background-color: var(--color-bg-secondary);
}

.form-input.error {
  border-color: var(--color-danger);
  background-color: var(--color-danger-light);
}
```

#### 2.2 迁移 RegisterPage

类似于 LoginPage，需要：
1. 创建 `RegisterPage.css`
2. 移除所有内联样式
3. 添加 CSS 变量引用
4. 处理密码强度指示器的样式

**RegisterPage 额外元素**:
- 密码强度指示器
- 确认密码输入
- 条款和条件复选框
- 创建账户按钮

---

### 任务 3: 迁移 DashboardPage

**当前状态**:
- 约 520 行代码
- 大量内联样式（lines 152-520）
- 复杂的图表和指标展示

**主要组件**:
1. **Header / 统计指标** - 4 个指标卡片
2. **Info Tooltip** - 信息提示组件
3. **Quick Actions** - 快速操作区域
4. **Analytics Charts** - 数据可视化图表

**迁移步骤**:

1. **创建 DashboardPage.css**（300+ 行）

```css
/* 仪表盘容器 */
.dashboard-page {
  max-width: 1400px;
  margin: 0 auto;
  padding: var(--sp-8);
  background: var(--color-bg-secondary);
  min-height: 100vh;
}

/* 页面标题 */
.dashboard-header {
  margin-bottom: var(--sp-8);
}

.dashboard-title {
  font-size: var(--text-3xl);
  font-weight: var(--fw-bold);
  color: var(--color-text-primary);
  margin: 0 0 var(--sp-2) 0;
}

.dashboard-subtitle {
  font-size: var(--text-base);
  color: var(--color-text-secondary);
  margin: 0;
}

/* 指标网格 */
.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--sp-6);
  margin-bottom: var(--sp-8);
}

/* 指标卡片 */
.metric-card {
  background: var(--color-bg-primary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--sp-6);
  box-shadow: var(--shadow-sm);
  transition: var(--transition-base);
}

.metric-card:hover {
  box-shadow: var(--shadow-md);
  border-color: var(--color-primary-lighter);
}

.metric-label {
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
  margin-bottom: var(--sp-2);
  display: flex;
  align-items: center;
  gap: var(--sp-2);
}

.metric-value {
  font-size: var(--text-3xl);
  font-weight: var(--fw-bold);
  color: var(--color-primary);
  margin-bottom: var(--sp-2);
}

.metric-change {
  font-size: var(--text-sm);
  color: var(--color-success);
}

/* 快速操作区域 */
.quick-actions {
  background: var(--color-bg-primary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--sp-8);
  margin-bottom: var(--sp-8);
}

.quick-actions-title {
  font-size: var(--text-xl);
  font-weight: var(--fw-semibold);
  color: var(--color-text-primary);
  margin-bottom: var(--sp-6);
}

.quick-actions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: var(--sp-4);
}

.action-button {
  padding: var(--sp-4);
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  cursor: pointer;
  text-align: center;
  transition: var(--transition-base);
  text-decoration: none;
  color: var(--color-text-primary);
}

.action-button:hover {
  background: var(--color-primary-lighter);
  border-color: var(--color-primary);
  color: var(--color-primary-dark);
  transform: translateY(-2px);
}

.action-icon {
  font-size: 1.5rem;
  margin-bottom: var(--sp-2);
  display: block;
}

.action-label {
  font-size: var(--text-sm);
  font-weight: var(--fw-semibold);
}

/* 图表容器 */
.charts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(500px, 1fr));
  gap: var(--sp-6);
}

.chart-container {
  background: var(--color-bg-primary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--sp-6);
  box-shadow: var(--shadow-sm);
}

.chart-title {
  font-size: var(--text-lg);
  font-weight: var(--fw-semibold);
  color: var(--color-text-primary);
  margin-bottom: var(--sp-4);
}

/* 响应式 */
@media (max-width: 1024px) {
  .charts-grid {
    grid-template-columns: 1fr;
  }

  .metrics-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .dashboard-page {
    padding: var(--sp-4);
  }

  .metrics-grid {
    grid-template-columns: 1fr;
  }

  .quick-actions-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .dashboard-title {
    font-size: var(--text-2xl);
  }
}
```

2. **迁移 DashboardPage.tsx**
- 移除所有 `style={{...}}` 内联样式
- 添加 `import './DashboardPage.css'`
- 使用 `className` 代替内联样式
- 保留业务逻辑不变

---

### 任务 4: 迁移 MetacognitiveAssessmentPage

**当前状态**:
- 问卷界面
- 进度条
- 问题卡片
- 完成屏幕

**创建 MetacognitiveAssessmentPage.css**

---

## 实施流程

### 第 1 天: 创建基础组件库

```
上午:
├─ 创建 form-inputs.css (表单输入样式)
├─ 创建 buttons.css (按钮样式)
├─ 创建 cards.css (卡片样式)
└─ 创建 forms.css (表单容器样式)

下午:
├─ 测试各组件在浏览器中的外观
├─ 验证 CSS 变量正确应用
├─ 处理 IE/旧浏览器兼容性
└─ 提交基础库
```

### 第 2 天: 迁移认证页面

```
上午:
├─ 迁移 LoginPage
├─ 移除内联样式
├─ 创建 LoginPage.css
└─ 测试焦点和错误状态

下午:
├─ 迁移 RegisterPage
├─ 处理密码强度指示器
├─ 测试验证流程
└─ 提交认证页面
```

### 第 3 天: 迁移仪表盘和评估页面

```
上午:
├─ 迁移 DashboardPage
├─ 处理图表容器样式
├─ 测试响应式设计
└─ 验证暗黑模式

下午:
├─ 迁移 MetacognitiveAssessmentPage
├─ 创建进度条样式
├─ 创建问卷卡片样式
└─ 最终测试和优化
```

---

## 测试检查表

### 样式一致性
- [ ] 所有输入框样式一致
- [ ] 所有按钮样式一致
- [ ] 所有卡片样式一致
- [ ] 间距和填充一致

### 功能性
- [ ] 焦点状态正常工作
- [ ] 错误状态正常显示
- [ ] 禁用状态正确应用
- [ ] 悬停效果流畅

### 可访问性
- [ ] 焦点指示器可见
- [ ] 颜色对比达到 WCAG AA
- [ ] 表单标签正确关联
- [ ] 键盘导航正常

### 响应式设计
- [ ] 手机端 (375px) 正常
- [ ] 平板端 (768px) 正常
- [ ] 桌面端 (1024px+) 正常
- [ ] 图表正确缩放

### 暗黑模式
- [ ] 颜色正确转换
- [ ] 对比度足够
- [ ] 所有元素可见
- [ ] 图表可读

### 性能
- [ ] CSS 文件大小合理 (< 50KB)
- [ ] 页面加载时间 < 2s
- [ ] 无 CSS 解析错误
- [ ] 无浏览器警告

---

## 提交策略

### Commit 1: 基础组件库
```
Add reusable component styles for Phase 2

- Create form-inputs.css with input, textarea, select styles
- Create buttons.css with primary, secondary, danger variants
- Create cards.css with card container styles
- Create forms.css with form layout and grouping
- All styles use CSS variables for theming
- Includes responsive design and accessibility support
```

### Commit 2: 认证页面迁移
```
Migrate LoginPage and RegisterPage to CSS Modules

- Extract LoginPage inline styles to LoginPage.css
- Extract RegisterPage inline styles to RegisterPage.css
- Remove inline style={{}} objects
- Use className instead of style props
- All styles reference CSS variables
- Maintain existing functionality and behavior
```

### Commit 3: 仪表盘和评估页面
```
Migrate DashboardPage and MetacognitiveAssessmentPage to CSS

- Extract DashboardPage styles (300+ lines)
- Extract MetacognitiveAssessmentPage styles
- Create responsive grid layouts
- Handle dark mode support
- Improve component reusability
```

### Commit 4: Phase 2 验证和优化
```
Complete Phase 2: CSS consistency verification and optimization

- Verify all pages use CSS variables
- Test responsive design across devices
- Validate dark mode support
- Fix remaining inline styles
- Performance optimization
- CSS consistency improved from 30% to 70%
```

---

## 成功指标

### 代码指标
- [ ] 0 个内联 style 属性（在迁移的页面中）
- [ ] 100% CSS 变量使用率
- [ ] 所有颜色来自 `--color-*` 变量
- [ ] 所有间距来自 `--sp-*` 变量

### 设计指标
- [ ] 所有页面视觉一致
- [ ] 按钮样式统一
- [ ] 输入框样式统一
- [ ] 卡片样式统一

### 用户体验
- [ ] 焦点状态清晰
- [ ] 悬停反馈明显
- [ ] 错误提示清楚
- [ ] 加载速度快

### 技术指标
- [ ] Lighthouse 性能评分 ≥ 50
- [ ] CSS 文件总大小 < 100KB
- [ ] 无 CSS 警告或错误
- [ ] 暗黑模式完全工作

---

## 常见问题

### Q: 如何处理已有的内联样式？
A: 使用 className 和 CSS Module。业务逻辑产生的动态样式（如颜色、宽度）转为 CSS 变量或数据属性。

### Q: 如何保证响应式设计？
A: 使用 CSS Grid 和 Flexbox，在 variables.css 中定义的断点处应用媒体查询。

### Q: 暗黑模式怎么处理？
A: 所有颜色已在 variables.css 中定义暗黑模式值。只需确保使用 `--color-*` 变量。

### Q: 如何测试旧浏览器兼容性？
A: CSS 变量在 IE 不支持。如需支持，使用 CSS fallback 或 PostCSS 插件。

### Q: 可以使用 SCSS 或 Less 吗？
A: 可以，但会增加构建步骤。当前建议使用纯 CSS 和 CSS 变量。

---

## 下一步

Phase 2 完成后：
- CSS 一致性提升到 70%
- 所有页面使用 CSS Module
- 主题切换基础准备完毕
- 为 Phase 3 性能优化铺平道路

---

**预计完成**: 2-3 天
**优先级**: 高（影响后续 Phase）
**开始日期**: 待批准
**预期完成日期**: 2025-11-20 ~ 2025-11-21
