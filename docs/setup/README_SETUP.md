# 📚 Interview-GenAI - Complete Setup Guide

Your Interview-GenAI application is now configured and ready for deployment!

## 📋 Files Created for You

### 1. **SETUP_GUIDE.md**
Complete step-by-step setup instructions for your Mac, including:
- Database initialization
- Environment configuration
- Backend and frontend startup
- Testing procedures
- Troubleshooting guide

### 2. **quick-start.sh**
One-command startup script that:
- Checks Node.js and PostgreSQL
- Installs dependencies
- Starts backend on port 5001
- Starts frontend on port 3000
- Provides helpful commands

### 3. **test-complete-flow.sh**
Automated test script that verifies:
- ✅ User registration
- ✅ User login
- ✅ Session creation
- ✅ AI chat functionality
- ✅ Pattern fetching

### 4. **backend/.env.mac**
Template environment file configured for Mac with:
- PostgreSQL user: `wuqi`
- Database: `interview_genai`
- Port: 5001
- OpenAI API key placeholder

### 5. **frontend/src/utils/api-examples.ts**
Complete API client utilities showing:
- Authentication methods
- AI chat endpoints
- Session management
- Pattern and prediction APIs
- Error handling

## 🚀 Quick Start on Your Mac

### Step 1: Prepare Your Environment
```bash
# Copy the environment template
cd Interview-GenAI/backend
cp .env.mac .env

# Edit .env and add your OpenAI API key
nano .env
# Replace: sk-proj-YOUR-ACTUAL-API-KEY-HERE
# With: Your actual OpenAI API key from https://platform.openai.com/account/api-keys
```

### Step 2: Initialize Database (First Time Only)
```bash
# Login to PostgreSQL
psql -U postgres

# Inside psql:
CREATE USER wuqi WITH CREATEDB;
CREATE DATABASE interview_genai OWNER wuqi;
\q

# Initialize schema
cd Interview-GenAI/backend
psql -U wuqi -d interview_genai -f src/config/init.sql
```

### Step 3: Start the Application
```bash
cd Interview-GenAI
chmod +x quick-start.sh
./quick-start.sh
```

The app will start automatically:
- Frontend: http://localhost:3000
- Backend: http://localhost:5001

## 🧪 Testing Everything

```bash
# In a new terminal window (while servers are running)
cd Interview-GenAI
chmod +x test-complete-flow.sh
./test-complete-flow.sh
```

You should see:
```
✅ Registration successful
✅ Login successful
✅ Session created successfully
✅ AI chat successful
✅ Pattern fetch successful
```

## 📱 Using the Application

### Register & Login
1. Open http://localhost:3000
2. Click "Register" (or visit /register)
3. Fill in details:
   - Email: `test@example.com`
   - Username: `testuser`
   - Password: `Test123456`
   - User Type: "Efficient User"
4. Click "Login" with same credentials

### Send AI Messages
1. Click "Dashboard"
2. Click "开始对话" (Start New Session)
3. Type message: "What is the capital of France?"
4. Click "Send"
5. Receive AI response

### Explore Features
- **Patterns**: View your AI usage patterns
- **Predictions**: See pattern predictions
- **Evolution**: Track how your usage evolves
- **Settings**: Manage account and preferences

## 💻 API Reference

### Authentication
```typescript
import { loginUser, registerUser } from './utils/api-examples';

// Register
const result = await registerUser('user@example.com', 'username', 'password', 'efficient');

// Login
const login = await loginUser('user@example.com', 'password');
const token = login.data.token;
```

### Send Message to AI
```typescript
import { sendMessageToAI } from './utils/api-examples';

const response = await sendMessageToAI(
  'Your question here',
  [],  // empty conversation history for first message
  token
);

const aiResponse = response.data.response.content;
```

### Get Sessions
```typescript
import { getSessions } from './utils/api-examples';

const sessions = await getSessions(token);
```

## 🔧 Environment Configuration

Your `.env` file (in `backend/` directory):

```env
# For Mac with wuqi user
DB_USER=wuqi
DB_PASSWORD=

# Your OpenAI API key
OPENAI_API_KEY=sk-proj-your-actual-key-here

# Backend port
PORT=5001

# Frontend CORS
CORS_ORIGIN=http://localhost:3000
```

## ⚠️ Important Notes

### Database User
- **Mac**: Uses `wuqi` user (no password)
- **Cloud**: Uses `postgres` user (password: `postgres`)
- Check your database configuration in `.env`

### OpenAI API Key
- Keep it SECRET
- Never commit `.env` to git
- Only for development on your Mac
- Will be in environment variables in production

### Ports
- Frontend: 3000 (Vite dev server)
- Backend: 5001 (Express.js API)
- Database: 5432 (PostgreSQL)

## 🐛 Troubleshooting

### "PostgreSQL is not running"
```bash
# Start PostgreSQL
brew services start postgresql@15
# or
pg_ctl -D /usr/local/var/postgres start
```

### "Port 5001 already in use"
```bash
# Kill process using port 5001
lsof -i :5001
kill -9 <PID>
```

### "Database connection failed"
```bash
# Check if database exists
psql -U wuqi -d interview_genai -c "SELECT * FROM users LIMIT 1;"

# If not, reinitialize:
psql -U wuqi -d interview_genai -f backend/src/config/init.sql
```

### "AI chat returns 'Connection error'"
```bash
# Verify OpenAI API key
grep OPENAI_API_KEY backend/.env

# Test with curl
curl -X GET http://localhost:5001/api/ai/models
```

## 📊 System Architecture

```
┌─────────────────────────────────────────────────────┐
│  React Frontend (Port 3000)                         │
│  - Pages: Dashboard, Chat, Patterns, Predictions... │
│  - State: Zustand stores                            │
│  - Styling: Tailwind CSS                            │
└────────────┬────────────────────────────────────────┘
             │ (HTTP Requests)
             │
┌────────────▼────────────────────────────────────────┐
│  Express Backend (Port 5001)                        │
│  - Routes: Auth, AI, Sessions, Patterns...          │
│  - Middleware: JWT, Error Handling                  │
└────────────┬────────────────────────────────────────┘
             │ (SQL Queries)
             │
┌────────────▼────────────────────────────────────────┐
│  PostgreSQL Database                                │
│  - 10+ tables: users, sessions, interactions...     │
└─────────────────────────────────────────────────────┘
             │ (API Calls)
             │
┌────────────▼────────────────────────────────────────┐
│  OpenAI API (GPT-4o-mini)                           │
│  - Secure proxy through backend                     │
└─────────────────────────────────────────────────────┘
```

## 📝 Next Steps

1. **On your Mac:**
   - Follow SETUP_GUIDE.md
   - Run quick-start.sh
   - Run test-complete-flow.sh
   - Test the application

2. **Customization:**
   - Modify pages in `frontend/src/pages/`
   - Add routes in `backend/src/routes/`
   - Change AI model in `.env` (gpt-4o, gpt-4-turbo, etc.)

3. **Deployment:**
   - Configure environment variables
   - Set up PostgreSQL in production
   - Use production OpenAI API key with proper limits
   - Build frontend: `npm run build`
   - Set up CI/CD pipeline

## 📞 Support Files

- `SETUP_GUIDE.md` - Complete setup instructions
- `test-complete-flow.sh` - Automated testing
- `quick-start.sh` - Quick startup script
- `.env.mac` - Environment template for Mac
- `api-examples.ts` - API usage examples

## ✅ System Status

Current test results:
- ✅ User registration: WORKING
- ✅ User login: WORKING
- ✅ Session creation: WORKING
- ✅ Pattern fetching: WORKING
- ⚠️  AI chat: Needs OpenAI API key validation

Your system is ready to use on your Mac!
