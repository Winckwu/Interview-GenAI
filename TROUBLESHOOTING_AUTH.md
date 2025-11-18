# 🔧 Frontend 403 Forbidden 错误排查指南

当你在访问受保护的路由时看到 `403 Forbidden` 错误，这通常表示 JWT token 认证失败。

## 问题症状

- 显示：`Access denied` 或 `403 Forbidden` 错误
- 在浏览器控制台显示：`Failed to load resource: the server responded with a status of 403`
- 登录后点击某些功能就出现错误

## 原因分析

403 错误可能由以下原因引起：

1. **Token 没有被保存到 localStorage**
   - 登录过程中出现问题

2. **Token 格式不正确**
   - localStorage 中的数据被损坏

3. **JWT_SECRET 不匹配**
   - 后端使用的 JWT_SECRET 与生成 token 时使用的不一致

4. **Token 已过期**
   - Token 的有效期已经超出（默认 24 小时）

## 诊断步骤

### 步骤 1: 使用调试工具

1. 打开浏览器
2. 按 `F12` 打开开发者工具
3. 点击 `Console` 标签
4. 在控制台输入并执行：

```javascript
window.debug.fullDiagnosis()
```

这会输出：
- ✅ localStorage 中的 token 信息
- ✅ 后端连接状态
- ✅ `/api/auth/verify` 请求的响应

### 步骤 2: 检查具体信息

根据 `fullDiagnosis()` 的输出，执行相应的命令：

```javascript
// 只检查 localStorage
window.debug.checkStorage()

// 只测试后端连接
window.debug.testBackendHealth()

// 只测试 auth/verify 端点
window.debug.testAuthVerify()
```

### 步骤 3: 查看网络请求

1. 打开开发者工具 > Network 标签
2. 刷新页面
3. 找到 `/api/auth/verify` 请求
4. 查看：
   - **Headers** 标签：检查 `Authorization: Bearer ...` 是否存在
   - **Response** 标签：查看后端返回的错误信息

## 解决方案

### 方案 1: 清空 localStorage 并重新登录（最常用）

```javascript
// 在浏览器控制台执行
window.debug.clearAuthAndReload()
```

或手动操作：
1. 打开开发者工具 > Application
2. 找到 Storage > Local Storage
3. 删除 `auth-storage` 条目
4. 刷新页面，重新登录

### 方案 2: 检查后端 .env 文件

确保 `backend/.env` 中的 JWT_SECRET 配置正确：

```bash
# 在 Mac 上
cat backend/.env | grep JWT_SECRET
```

应该看到：
```
JWT_SECRET=your-super-secret-jwt-key-change-in-production-this-must-be-long-and-random
```

### 方案 3: 重启后端

有时 JWT token 在后端进程重启后会失效：

```bash
# 1. 停止后端进程 (Ctrl+C)
# 2. 重新启动
cd Interview-GenAI/backend
npm run dev
```

然后清空 localStorage 并重新登录。

### 方案 4: 检查时钟同步（Mac）

在某些情况下，系统时钟偏差可能导致 JWT 验证失败：

```bash
# 检查系统时间
date

# 同步时间（如果偏离很大）
sudo ntpdate -s time.nist.gov
```

## 常见错误信息

### "Invalid or expired token" (403)

**原因**: Token 格式不对或已过期

**解决**:
```javascript
window.debug.clearAuthAndReload()
```

### "Access token required" (401)

**原因**: 请求中没有包含 token

**解决**: 检查 localStorage 是否有 token
```javascript
window.debug.checkStorage()
```

### "User not found" (404)

**原因**: Token 中的用户 ID 在数据库中不存在

**解决**: 确保数据库用户存在
```bash
# 在 Mac 上检查
psql -U wuqi -d interview_genai -c "SELECT * FROM users;"
```

## 完整修复流程

如果以上方法都不行，按以下步骤完整修复：

### 1. 停止所有服务
```bash
# 停止前端和后端
# 前端：在终端按 Ctrl+C
# 后端：在另一个终端按 Ctrl+C
```

### 2. 清空本地缓存
```bash
# 删除 node_modules 并重新安装
cd Interview-GenAI/frontend
rm -rf node_modules
npm install

cd Interview-GenAI/backend
rm -rf node_modules
npm install
npm install openai
```

### 3. 重启数据库（可选，如果认为数据库有问题）
```bash
# 停止 PostgreSQL
brew services stop postgresql@15

# 等待 5 秒
sleep 5

# 启动 PostgreSQL
brew services start postgresql@15

# 验证连接
psql -U wuqi -d interview_genai -c "SELECT COUNT(*) FROM users;"
```

### 4. 重启后端
```bash
cd Interview-GenAI/backend
npm run dev
```

### 5. 重启前端
```bash
cd Interview-GenAI/frontend
npm run dev
```

### 6. 在浏览器中清空缓存
- DevTools > Application > Storage > Clear site data
- 或者使用无痕模式 (Cmd+Shift+N on Mac)

### 7. 重新登录
- 访问 http://localhost:3000
- 重新注册或使用已有账户登录

## 测试 Token

如果想手动测试 token，可以使用 curl：

```bash
# 1. 获取 token
TOKEN=$(curl -s -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123"}' \
  | grep -o '"token":"[^"]*' | cut -d'"' -f4)

echo "Token: $TOKEN"

# 2. 测试 token
curl -X GET http://localhost:5001/api/auth/verify \
  -H "Authorization: Bearer $TOKEN"
```

## 仍然有问题？

### 检查错误日志

1. **后端日志**：查看终端中 `npm run dev` 的输出
2. **前端日志**：打开浏览器开发者工具 > Console
3. **浏览器网络**：DevTools > Network，过滤 `/api/` 请求

### 获取详细错误信息

在浏览器控制台输入：

```javascript
// 获取最后一个 auth/verify 的完整错误
window.debug.testAuthVerify().then(result => {
  console.log('Full response:', result);
})
```

## 相关文件位置

- 前端 API 配置：`frontend/src/services/api.ts`
- 认证 Store：`frontend/src/stores/authStore.ts`
- 后端认证中间件：`backend/src/middleware/auth.ts`
- 后端 JWT 配置：`backend/.env`

## 更多帮助

- 查看系统架构：`SETUP_GUIDE.md`
- 查看完整设置：`README_SETUP.md`
- 运行自动测试：`bash test-complete-flow.sh`
