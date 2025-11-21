# 数据库迁移指南 - Message Branches

## 问题说明
你遇到的错误是因为 `postgres` 用户没有在 `public` schema 创建表的权限。

## 🔍 第一步：查找数据库所有者

```bash
psql -d interview_genai -c "SELECT d.datname, pg_catalog.pg_get_userbyid(d.datdba) as owner FROM pg_catalog.pg_database d WHERE d.datname = 'interview_genai';"
```

这会告诉你数据库是由哪个用户创建的（例如：`wuqi`, `postgres`, 或其他用户）。

---

## ✅ 解决方案1：使用数据库所有者运行（推荐）

如果输出显示 owner 是 `wuqi`（或你的系统用户名）：

```bash
cd backend
psql -d interview_genai -f scripts/create-branches-table.sql
```

**不需要指定 `-U` 参数**，因为默认就是你当前的系统用户。

---

## ✅ 解决方案2：授予postgres用户权限

如果你想让 `postgres` 用户也能创建表，以数据库所有者身份运行：

```bash
cd backend

# 假设你的系统用户是 wuqi
psql -d interview_genai -c "GRANT ALL ON SCHEMA public TO postgres;"
psql -d interview_genai -c "GRANT CREATE ON SCHEMA public TO postgres;"

# 然后运行迁移
psql -d interview_genai -f scripts/create-branches-table.sql
```

---

## ✅ 解决方案3：作为超级用户运行

如果你有超级用户权限：

```bash
cd backend
psql -U postgres -d postgres -c "ALTER DATABASE interview_genai OWNER TO postgres;"
psql -U postgres -d interview_genai -f scripts/create-branches-table.sql
```

---

## 🧪 验证迁移成功

运行完成后，检查表是否创建：

```bash
psql -d interview_genai -c "\dt message_branches"
```

应该看到：
```
             List of relations
 Schema |       Name        | Type  |  Owner
--------+-------------------+-------+----------
 public | message_branches  | table | wuqi (或其他)
```

检查表结构：
```bash
psql -d interview_genai -c "\d message_branches"
```

---

## 🚀 快速命令（最简单）

**如果你在Mac上使用Postgres.app，直接运行：**

```bash
cd backend
psql interview_genai -f scripts/create-branches-table.sql
```

就这么简单！不需要 `-U postgres`。

---

## ❓ 常见问题

### Q: 我不知道我的数据库owner是谁？
```bash
psql -d interview_genai -c "SELECT current_user;"
```

### Q: 如何查看所有用户？
```bash
psql -d interview_genai -c "\du"
```

### Q: 迁移成功后，如何确认功能可用？
启动后端服务器：
```bash
cd backend
npm run dev
```

前端应该能够正常保存和加载分支了！

---

## 📝 我推荐的命令（99%能成功）

```bash
cd backend
psql interview_genai -f scripts/create-branches-table.sql
```

试试这个！
