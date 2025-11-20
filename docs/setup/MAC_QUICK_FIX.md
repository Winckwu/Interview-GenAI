# Mac 上的 403 认证错误 - 快速修复

## 问题
在 Mac 上点击对话时出现：
```
403 Forbidden: Invalid or expired token
Access denied
```

## 快速修复（3 步）

### 1️⃣ 拉取最新代码到 Mac
在 Mac 的终端运行：

```bash
cd Interview-GenAI
git pull origin claude/fix-database-connection-01MSzdjixVq6j2FHNFvLetyg
```

### 2️⃣ 清除浏览器缓存

**方法 A：使用开发者工具（推荐）**
1. 打开浏览器到 `http://localhost:3000`
2. 按 `F12` 打开开发者工具
3. 在浏览器控制台粘贴并执行：
```javascript
window.debug.clearAuthAndReload()
```

**方法 B：手动清除**
1. 按 `F12` 打开开发者工具
2. 点击 `Application` 标签
3. 点击左边 `Local Storage`
4. 点击 `http://localhost:3000`
5. 找到 `auth-storage` 并删除它
6. 刷新页面 (Cmd+R)

**方法 C：使用无痕模式**
1. 按 `Cmd+Shift+N` 打开新的无痕窗口
2. 访问 `http://localhost:3000`

### 3️⃣ 重新登录并测试

```bash
# 前端应该自动在 http://localhost:3000
# 后端应该在 http://localhost:5001/api/ai/models

# 如果后端没运行，重启它：
cd Interview-GenAI/backend
npm run dev
```

## 验证修复成功

1. 打开浏览器开发者工具 (F12)
2. 切换到 Console 标签
3. 运行诊断：
```javascript
window.debug.fullDiagnosis()
```

应该看到：
```
✅ Backend connected: true
✅ Auth verify success: true
```

## 如果还是有问题

### 方案 A：完整重启

```bash
# 1. 停止所有进程 (按 Ctrl+C)

# 2. 清空缓存
cd Interview-GenAI/frontend
rm -rf node_modules
npm install

cd Interview-GenAI/backend
rm -rf node_modules
npm install
npm install openai

# 3. 重启后端
cd Interview-GenAI/backend
npm run dev

# 4. 在另一个终端重启前端
cd Interview-GenAI/frontend
npm run dev

# 5. 在浏览器中清除 localStorage 并重新登录
```

### 方案 B：检查后端配置

确保 `backend/.env` 配置正确：

```bash
cat backend/.env | grep -E "DB_USER|OPENAI_API_KEY|JWT_SECRET"
```

应该看到：
- `DB_USER=wuqi` （Mac 用户）
- `OPENAI_API_KEY=sk-proj-...` （你的 API 密钥）
- `JWT_SECRET=your-super-secret-jwt-key...`

如果不对，编辑 `.env` 文件修正。

### 方案 C：检查数据库连接

```bash
# 确保数据库运行中
psql -U wuqi -d interview_genai -c "SELECT COUNT(*) FROM users;"

# 如果报错，重新初始化数据库
psql -U wuqi -d interview_genai -f backend/src/config/init.sql
```

## 测试命令

如果想手动测试认证流程：

```bash
# 1. 测试后端是否运行
curl http://localhost:5001/api/ai/models

# 2. 测试登录
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123"}'

# 应该得到包含 "token" 的响应
```

## 浏览器控制台调试命令

所有这些命令都可以在浏览器控制台 (F12) 中运行：

```javascript
// 查看存储的 token
window.debug.checkStorage()

// 测试后端连接
window.debug.testBackendHealth()

// 测试 auth/verify 端点
window.debug.testAuthVerify()

// 完整诊断
window.debug.fullDiagnosis()

// 清除认证信息并重新加载页面
window.debug.clearAuthAndReload()
```

## 常见原因和解决方案

| 问题 | 原因 | 解决方案 |
|------|------|--------|
| localStorage 中没有 token | 登录失败或浏览器缓存被清除 | 重新登录 |
| Token 格式不对 | 之前的版本代码有 bug | 清除 localStorage 重新登录 |
| 后端无法验证 token | JWT_SECRET 不匹配 | 重启后端，清除 localStorage |
| "User not found" | 数据库中没有该用户 | 确保登录使用的账户存在 |
| Token 已过期 | 登录超过 24 小时 | 重新登录 |

## 需要帮助？

1. 查看详细排查指南：`TROUBLESHOOTING_AUTH.md`
2. 查看系统设置指南：`SETUP_GUIDE.md`
3. 运行自动测试：`bash test-complete-flow.sh`

所有这些文件都已经添加到项目中，只需从 git 拉取最新代码即可。
