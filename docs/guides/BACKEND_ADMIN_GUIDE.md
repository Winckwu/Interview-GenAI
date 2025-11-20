# Backend Admin System - Quick Guide

## 🔐 Login Credentials

### Account
- **Username**: `admin01`
- **Password**: `qweasd`

---

## 🌐 Access URLs

### Local Development
```
Backend URL: http://localhost:5001
Login Page: http://localhost:5001/login.html
Admin Dashboard: http://localhost:5001/admin-dashboard.html
```

### Production
```
Replace localhost:5001 with your server address
```

---

## 📝 Getting Started

### 1. Start Backend Server

```bash
cd backend
npm run dev    # Development mode
# or
npm start      # Production mode
```

Backend will start at `http://localhost:5001`

### 2. Open Login Page

Visit in your browser: http://localhost:5001/login.html

### 3. Enter Credentials

- Username: `admin01`
- Password: `qweasd`
- Click "Login" button

### 4. View Admin Dashboard

After successful login, you'll be redirected to the admin dashboard showing:
- System status
- Database connection status
- API version
- User statistics
- Session statistics
- Interaction statistics

---

## 🎯 Admin Dashboard Features

### System Monitoring
- **System Status**: Real-time backend health check
- **Database Status**: PostgreSQL connection status
- **Environment Info**: Current environment (Development/Production)
- **Time Info**: System start time and current time

### Data Statistics
- **Total Users**: Total registered users in the system
- **Total Sessions**: All user work sessions
- **Total Interactions**: AI interaction records

### API Documentation
Shows all available API endpoints on the dashboard:
- `/health` - Health check
- `/api/admin/dashboard` - Admin data
- `/api/admin/stats` - System statistics
- `/api/admin/users` - User list
- `/api/auth/login` - User login
- `/api/sessions` - Work sessions
- `/api/interactions` - AI interaction logs
- And more...

### Auto Refresh
- Dashboard auto-refreshes data every 30 seconds
- Manual refresh button available for immediate updates

---

## 🔑 API Endpoints

### Admin Authentication

#### Login
```bash
POST /api/admin/auth/login
Content-Type: application/json

{
  "username": "admin01",
  "password": "qweasd"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "username": "admin01",
    "role": "admin"
  },
  "timestamp": "2025-11-18T10:30:00.000Z"
}
```

#### Verify Token
```bash
GET /api/admin/auth/verify
Authorization: Bearer <token>
```

#### Logout
```bash
POST /api/admin/auth/logout
```

---

## 💾 Data Persistence

All login info and dashboard data are stored in:
- **Database**: PostgreSQL (interview_genai)
- **Token Storage**: Browser localStorage (adminToken)

---

## 🚀 Advanced Features

### Get Admin Dashboard Data

Requires auth token:

```bash
GET /api/admin/dashboard
Authorization: Bearer <your_token>
```

**Response**:
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

### Get System Statistics

```bash
GET /api/admin/stats
Authorization: Bearer <your_token>
```

### Get User List

```bash
GET /api/admin/users?limit=50&offset=0
Authorization: Bearer <your_token>
```

---

## 🔒 Security Notes

⚠️ **IMPORTANT**:

1. **Change Default Credentials**: In production, modify `backend/src/routes/adminAuth.ts` with new credentials
2. **Use HTTPS**: HTTPS is required in production environments
3. **JWT Secret**: Change `JWT_SECRET` environment variable to a strong key
4. **Token Expiration**: Tokens expire after 24 hours, requiring re-login

### Change Default Credentials

Edit `backend/src/routes/adminAuth.ts`:

```typescript
// Modify these two lines
const ADMIN_USERNAME = 'your_new_username';
const ADMIN_PASSWORD = 'your_strong_password';
```

Then restart the backend server.

---

## 📊 Frontend Integration

In addition to the backend admin interface, there's also a frontend app:

- **Frontend URL**: http://localhost:3000
- **Data Browser**: http://localhost:3000/data
  - View all sessions
  - View all interactions
  - View all patterns
  - View all assessment results

---

## 🐛 Troubleshooting

### "Connection Refused"
- Check if backend is running: `npm run dev`
- Check if port is correct: default 5001

### "Database Connection Failed"
- Ensure PostgreSQL is running
- Check database credentials in `.env` file
- Run `createdb interview_genai` to create database

### "Login Failed"
- Ensure correct credentials: admin01 / qweasd
- Check browser console for error messages
- Clear localStorage cache and retry

### "Token Expired"
- You'll be redirected to login page
- Re-login to get a new token

---

## 📚 Related Documentation

- [Main Quick Start Guide](./QUICKSTART.md)
- [API Documentation](./QUICKSTART.md#-可用的api端点)
- [Database Schema](./backend/src/config/init.sql)

---

**Last Updated**: 2025-11-18

Happy Coding! 🎉
