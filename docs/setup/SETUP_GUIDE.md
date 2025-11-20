# Interview-GenAI Setup Guide for Mac

## Prerequisites
- Node.js 18+ installed
- PostgreSQL 12+ installed and running
- OpenAI API key

## Database Setup (One-time)

### 1. Create Database User (if not already created)
```bash
# Login to PostgreSQL
psql -U postgres

# Create wuqi user with no password
CREATE USER wuqi WITH CREATEDB;

# Create database owned by wuqi
CREATE DATABASE interview_genai OWNER wuqi;

# Exit psql
\q
```

### 2. Initialize Database Schema
```bash
cd /path/to/Interview-GenAI/backend

# Run the initialization script
psql -U wuqi -d interview_genai -f src/config/init.sql
```

Verify tables were created:
```bash
psql -U wuqi -d interview_genai -c "\dt"
```

## Backend Configuration

### 1. Update `.env` file
```bash
cd /path/to/Interview-GenAI/backend

# Edit .env with your OpenAI API key
```

**Required `.env` for Mac:**
```
# Node Environment
NODE_ENV=development
PORT=5001

# Database Configuration (for Mac)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=interview_genai
DB_USER=wuqi
DB_PASSWORD=

# Redis Configuration
REDIS_URL=redis://localhost:6379

# JWT Authentication
JWT_SECRET=your-super-secret-jwt-key-change-in-production-this-must-be-long-and-random
JWT_EXPIRY=24h

# OpenAI Configuration
OPENAI_API_KEY=sk-proj-YOUR-ACTUAL-API-KEY-HERE
AI_MODEL=gpt-4o-mini

# CORS Configuration
CORS_ORIGIN=http://localhost:3000

# Logging
LOG_LEVEL=debug

# Application
APP_NAME=Interview-GenAI-API
APP_VERSION=1.0.0
```

### 2. Install Dependencies
```bash
cd /path/to/Interview-GenAI/backend
npm install
npm install openai  # Make sure OpenAI package is installed
```

### 3. Start Backend
```bash
cd /path/to/Interview-GenAI/backend
npm run dev
```

You should see:
```
✓ Database connected
✓ Server running on port 5001
```

## Frontend Setup

### 1. Install Dependencies
```bash
cd /path/to/Interview-GenAI/frontend
npm install
```

### 2. Start Frontend
```bash
cd /path/to/Interview-GenAI/frontend
npm run dev
```

Frontend will be available at `http://localhost:3000`

## Testing the Complete Flow

### 1. Access Application
Open browser to `http://localhost:3000`

### 2. Register Account
- Click "Register" or navigate to registration page
- Fill in:
  - Email: `test@example.com`
  - Username: `testuser`
  - Password: `Test123456`
  - User Type: Select "Efficient User"
- Click Register

### 3. Login
- Email: `test@example.com`
- Password: `Test123456`
- Click Login

### 4. Test Chat
- Click "Dashboard" in navigation
- Click "开始对话" (Start New Session) button
- Type a message: "What is the capital of France?"
- Click Send button
- You should receive an AI response from GPT-4o-mini

### 5. Verify Other Features
- Click "Patterns" to view usage patterns
- Click "Predictions" to view predictions
- Click "Evolution" to view evolution tracking
- Click "Settings" to manage account

## Troubleshooting

### Issue: Database connection failed
```
Error: role "wuqi" does not exist
```
**Solution:** Follow "Database Setup" section above

### Issue: OpenAI API returns error
```
Error: Failed to get AI response
```
**Possible causes:**
1. Invalid API key - verify in `.env`
2. API key has no credits - check OpenAI billing
3. Invalid API format - must start with `sk-proj-`

### Issue: Port 5001 already in use
```bash
# Find process using port 5001
lsof -i :5001

# Kill the process
kill -9 <PID>

# Then restart npm run dev
```

### Issue: Frontend can't connect to backend
Check that:
1. Backend is running on port 5001: `curl http://localhost:5001/api/ai/models`
2. `vite.config.ts` has correct proxy: `target: 'http://localhost:5001'`
3. Both services are running (backend on 5001, frontend on 3000)

## Project Structure

```
Interview-GenAI/
├── backend/                  # Express.js backend
│   ├── src/
│   │   ├── routes/          # API routes
│   │   ├── services/        # Business logic
│   │   ├── middleware/      # Auth, error handling
│   │   ├── config/          # Database config
│   │   └── index.ts         # Server entry point
│   ├── .env                 # Environment variables (NOT in git)
│   └── package.json
├── frontend/                # React Vite frontend
│   ├── src/
│   │   ├── pages/           # Page components
│   │   ├── components/      # Reusable components
│   │   ├── stores/          # Zustand state management
│   │   └── App.tsx          # App entry point
│   ├── vite.config.ts       # Vite proxy config
│   └── package.json
└── README.md
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/verify` - Verify JWT token
- `POST /api/auth/logout` - Logout user

### AI Chat
- `POST /api/ai/chat` - Send message to AI
- `GET /api/ai/models` - Get available models

### Sessions
- `GET /api/sessions` - Get user's sessions
- `POST /api/sessions` - Create new session
- `GET /api/sessions/:id` - Get session details

### Patterns
- `GET /api/patterns` - Get user's patterns
- `POST /api/patterns` - Create pattern

### Predictions
- `GET /api/predictions` - Get user's predictions
- `POST /api/predictions` - Create prediction

## Key Technologies

- **Frontend:** React 18, TypeScript, Vite, Zustand, Tailwind CSS
- **Backend:** Express.js, TypeScript, PostgreSQL, JWT, OpenAI API
- **Database:** PostgreSQL with 10+ tables
- **Authentication:** JWT token-based
- **AI:** OpenAI GPT-4o-mini (configurable)

## Support

For issues:
1. Check backend logs: `npm run dev` output in terminal
2. Check frontend browser console: DevTools > Console
3. Test API directly: `curl -X GET http://localhost:5001/api/ai/models`
4. Verify database: `psql -U wuqi -d interview_genai -c "SELECT * FROM users;"`
