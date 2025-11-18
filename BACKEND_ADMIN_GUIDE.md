# 后端管理系统 - 快速指南

## 🔐 登录信息

### 账号
- **用户名**: `admin01`
- **密码**: `qweasd`

---

## 🌐 访问地址

### 本地开发环境
```
后端地址: http://localhost:5001
登录页面: http://localhost:5001/login.html
管理仪表板: http://localhost:5001/admin-dashboard.html
```

### 生产环境
```
将 localhost:5001 替换为你的服务器地址
```

---

## 📝 启动步骤

### 1. 启动后端服务器

```bash
cd backend
npm run dev    # 开发模式
# 或
npm start      # 生产模式
```

后端会在 `http://localhost:5001` 启动

### 2. 访问登录页面

在浏览器打开: http://localhost:5001/login.html

### 3. 输入凭证

- 用户名: `admin01`
- 密码: `qweasd`
- 点击"登录"按钮

### 4. 查看管理仪表板

登录成功后，你会被重定向到管理仪表板，显示:
- 系统状态
- 数据库连接状态
- API版本
- 用户统计
- 会话统计
- 交互统计

---

## 🎯 管理仪表板功能

### 系统监控
- **系统状态**: 实时显示后端是否运行正常
- **数据库状态**: 显示PostgreSQL连接状态
- **环境信息**: 当前运行环境 (Development/Production)
- **时间信息**: 系统启动时间和当前时间

### 数据统计
- **总用户数**: 系统中注册的用户总数
- **总会话数**: 所有用户的工作会话总数
- **总交互数**: 与AI的交互记录总数

### API文档
在仪表板上显示所有可用的API端点：
- `/health` - 健康检查
- `/api/admin/dashboard` - 管理数据
- `/api/admin/stats` - 系统统计
- `/api/admin/users` - 用户列表
- `/api/auth/login` - 用户登录
- `/api/sessions` - 工作会话
- `/api/interactions` - AI交互记录
- 等更多...

### 自动刷新
- 仪表板每30秒自动刷新一次数据
- 可以手动点击"刷新"按钮立即更新

---

## 🔑 API端点

### 管理员认证

#### 登录
```bash
POST /api/admin/auth/login
Content-Type: application/json

{
  "username": "admin01",
  "password": "qweasd"
}
```

**响应**:
```json
{
  "success": true,
  "message": "登录成功",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "username": "admin01",
    "role": "admin"
  },
  "timestamp": "2025-11-18T10:30:00.000Z"
}
```

#### 验证Token
```bash
GET /api/admin/auth/verify
Authorization: Bearer <token>
```

#### 退出登录
```bash
POST /api/admin/auth/logout
```

---

## 💾 数据持久化

所有的登录信息和仪表板数据都存储在:
- **数据库**: PostgreSQL (interview_genai)
- **Token存储**: 浏览器 localStorage (adminToken)

---

## 🚀 高级功能

### 获取系统仪表板数据

需要认证token:

```bash
GET /api/admin/dashboard
Authorization: Bearer <your_token>
```

**响应**:
```json
{
  "success": true,
  "data": {
    "totalUsers": 5,
    "totalSessions": 23,
    "totalInteractions": 156,
    "patternDistribution": {
      "A": 45,
      "B": 67,
      "C": 44
    },
    "recentUsers": [
      {
        "id": "uuid",
        "username": "user1",
        "email": "user@example.com",
        "role": "user",
        "createdAt": "2025-11-17T10:30:00Z"
      }
    ]
  },
  "timestamp": "2025-11-18T10:30:00.000Z"
}
```

### 获取系统统计

```bash
GET /api/admin/stats
Authorization: Bearer <your_token>
```

### 获取用户列表

```bash
GET /api/admin/users?limit=50&offset=0
Authorization: Bearer <your_token>
```

---

## 🔒 安全性注意

⚠️ **重要**:

1. **修改默认密码**: 在生产环境中，请修改 `backend/src/routes/adminAuth.ts` 中的默认凭证
2. **使用HTTPS**: 在生产环境中必须使用HTTPS
3. **JWT密钥**: 修改 `JWT_SECRET` 环境变量为强密钥
4. **Token过期**: Token有效期为24小时，之后需要重新登录

### 修改默认凭证

编辑 `backend/src/routes/adminAuth.ts`:

```typescript
// 修改这两行
const ADMIN_USERNAME = 'your_new_username';
const ADMIN_PASSWORD = 'your_strong_password';
```

然后重启后端服务器。

---

## 📊 前端集成

除了后端管理界面外，还有前端应用提供:

- **前端地址**: http://localhost:3000
- **数据浏览器**: http://localhost:3000/data
  - 查看所有会话
  - 查看所有交互
  - 查看所有模式
  - 查看所有评估结果

---

## 🐛 故障排除

### "连接被拒绝"
- 检查后端是否正在运行: `npm run dev`
- 检查端口是否正确: 默认5001

### "数据库连接失败"
- 确保PostgreSQL正在运行
- 检查数据库凭证在 `.env` 文件中
- 运行 `createdb interview_genai` 创建数据库

### "登录失败"
- 确保使用正确的凭证: admin01 / qweasd
- 检查浏览器控制台是否有错误信息
- 清除localStorage缓存后重试

### Token过期
- 自动重定向到登录页面
- 重新登录获取新token

---

## 📚 相关文档

- [主快速启动指南](./QUICKSTART.md)
- [API文档](./QUICKSTART.md#-可用的api端点)
- [数据库架构](./backend/src/config/init.sql)

---

**最后更新**: 2025-11-18

Happy Coding! 🎉
