# Interview-GenAI Quick Start Guide

**Complete instructions for running Interview-GenAI locally and deploying to production.**

---

## 📋 Table of Contents

1. [Local Development Setup](#local-development-setup)
2. [Running with Docker](#running-with-docker)
3. [Cloud Deployment](#cloud-deployment)
4. [Testing the System](#testing-the-system)
5. [Troubleshooting](#troubleshooting)

---

## 🚀 Local Development Setup

### Prerequisites

- **macOS/Linux/Windows**
- **Node.js** 18.x or later
- **npm** 9.x or later
- **PostgreSQL** 15 (or use Docker)
- **Redis** 7 (or use Docker)
- **Git**

### Step 1: Clone and Setup

```bash
# Clone the repository
git clone <repo-url>
cd Interview-GenAI

# Copy environment files
cp .env.example .env
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# Update .env with your local database credentials
# Edit .env and set:
# DB_HOST=localhost
# REDIS_URL=redis://localhost:6379
```

### Step 2: Install Dependencies

```bash
# Backend dependencies
cd backend
npm install
cd ..

# Frontend dependencies
cd frontend
npm install
cd ..
```

### Step 3: Database Setup

#### Option A: Using PostgreSQL Locally

```bash
# Create database
createdb interview_genai

# Create tables and schema
psql interview_genai < backend/src/config/schema.sql

# Verify connection
psql interview_genai -c "SELECT NOW();"
```

#### Option B: Using Docker for Database

```bash
# Start PostgreSQL and Redis with Docker
docker-compose up -d postgres redis

# Wait for services to start (10 seconds)
sleep 10

# Initialize schema
docker-compose exec postgres psql -U postgres interview_genai < backend/src/config/schema.sql
```

### Step 4: Start Backend Server

```bash
cd backend

# Development mode with auto-reload
npm run dev

# Or production build
npm run build
npm start
```

Expected output:
```
🚀 Interview-GenAI Backend Server
📍 Running on port 5000
🌍 Environment: development
✓ Ready to accept connections
```

### Step 5: Start Frontend Application

```bash
cd frontend

# Development mode with hot reload
npm run dev

# Expected output:
#   VITE v4.x.x  ready in XXX ms
#
#   ➜  Local:   http://localhost:3000/
#   ➜  Press h to show help
```

Open browser: **http://localhost:3000**

### Step 6: Test the System

```bash
# Register a new account at http://localhost:3000/register
# - Email: test@example.com
# - Username: testuser
# - Password: Test123!@
# - User Type: efficient

# Login at http://localhost:3000/login
# View dashboard and create predictions
```

---

## 🐳 Running with Docker

### Complete Stack with Docker Compose

**One command to start everything:**

```bash
# Copy environment file
cp .env.example .env

# Start all services (PostgreSQL, Redis, Backend, Frontend)
docker-compose up -d

# Wait for services to start
sleep 15

# Initialize database
docker-compose exec postgres psql -U postgres interview_genai < backend/src/config/schema.sql

# Check status
docker-compose ps

# View logs
docker-compose logs -f

# Access application
# Frontend: http://localhost:3000
# API: http://localhost:5000
# Health: http://localhost:5000/health
```

### Individual Service Commands

```bash
# Stop all services
docker-compose down

# Restart specific service
docker-compose restart backend

# View service logs
docker-compose logs -f frontend
docker-compose logs -f backend

# Execute command in container
docker-compose exec backend npm run typecheck

# Remove volumes (data cleanup)
docker-compose down -v
```

### Building Custom Images

```bash
# Build backend image
docker build -t interview-genai-backend ./backend

# Build frontend image
docker build -t interview-genai-frontend ./frontend

# Run custom images
docker-compose -f docker-compose.yml up -d
```

---

## ☁️ Cloud Deployment

### Option 1: AWS with Amplify + ECS + RDS

#### Prerequisites
- AWS Account with CLI configured
- Docker images pushed to ECR

#### Deployment Steps

```bash
# 1. Create RDS PostgreSQL instance
aws rds create-db-instance \
  --db-instance-identifier interview-genai-db \
  --db-instance-class db.t4g.micro \
  --engine postgres \
  --master-username postgres \
  --master-user-password <SECURE_PASSWORD> \
  --allocated-storage 20 \
  --backup-retention-period 7

# 2. Create ECS Cluster
aws ecs create-cluster --cluster-name interview-genai

# 3. Create CloudWatch Log Group
aws logs create-log-group --log-group-name /ecs/interview-genai

# 4. Register Task Definition
aws ecs register-task-definition \
  --cli-input-json file://ecs-task-definition.json

# 5. Create ECS Service
aws ecs create-service \
  --cluster interview-genai \
  --service-name interview-genai-api \
  --task-definition interview-genai:1 \
  --desired-count 2

# 6. Deploy Frontend to Amplify
amplify init
amplify add hosting
amplify publish
```

### Option 2: Vercel + Railway

#### Frontend Deployment (Vercel)

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy frontend
cd frontend
vercel --prod

# Set environment variables in Vercel dashboard:
# VITE_API_URL = https://api.your-domain.com/api
```

#### Backend Deployment (Railway)

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login

# Initialize Railway project
cd backend
railway init

# Deploy
railway up

# Set environment variables:
# DATABASE_URL=postgresql://...
# REDIS_URL=redis://...
# JWT_SECRET=...
```

### Option 3: Heroku + Render

#### Backend (Render)

```bash
# Create Procfile
echo "web: npm start" > backend/Procfile

# Push to Render
# 1. Create Render account
# 2. Create Web Service
# 3. Connect GitHub repository
# 4. Set environment variables
# 5. Deploy
```

#### Database (Render PostgreSQL)

```bash
# Create managed PostgreSQL instance on Render
# Copy connection string
# Set DATABASE_URL in backend environment
```

### Option 4: Self-Hosted (VPS)

#### Using DigitalOcean/Linode

```bash
# 1. Create droplet with Docker preinstalled
# 2. SSH into server
ssh root@your-server-ip

# 3. Clone repository
git clone <repo-url>
cd Interview-GenAI

# 4. Copy environment file
cp .env.example .env
nano .env  # Edit with production values

# 5. Start services
docker-compose -f docker-compose.yml up -d

# 6. Set up reverse proxy (Nginx)
docker-compose exec backend curl http://localhost:5000/health

# 7. Enable HTTPS (Let's Encrypt)
docker run --rm -it -v /etc/letsencrypt:/etc/letsencrypt \
  certbot/certbot certonly --standalone \
  -d your-domain.com
```

---

## 🧪 Testing the System

### Health Checks

```bash
# Basic health check
curl http://localhost:5000/health

# Detailed health check
curl http://localhost:5000/health/detailed

# Expected response:
# {
#   "status": "ok",
#   "timestamp": "2025-11-17T10:30:00Z",
#   "environment": "development"
# }
```

### API Testing with cURL

```bash
# 1. Register user
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "username": "testuser",
    "password": "Test123!",
    "userType": "efficient"
  }'

# 2. Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!"
  }'

# Save token from response
TOKEN="your-token-here"

# 3. Verify token
curl http://localhost:5000/api/auth/verify \
  -H "Authorization: Bearer $TOKEN"

# 4. Get patterns
curl http://localhost:5000/api/patterns \
  -H "Authorization: Bearer $TOKEN"
```

### Frontend Testing

```bash
# 1. Open browser
open http://localhost:3000

# 2. Register account
# Fill form and submit

# 3. Login
# Enter credentials

# 4. Navigate pages
# - Dashboard: View metrics
# - Patterns: View usage patterns
# - Predictions: Create predictions
# - Evolution: View pattern changes
# - A/B Test: View test results
# - Settings: Modify preferences
```

### End-to-End Test Script

```bash
#!/bin/bash

echo "🧪 Running E2E tests..."

# Test health endpoint
echo "Testing /health..."
curl -s http://localhost:5000/health | jq .

# Test auth endpoints
echo "Testing /api/auth/register..."
curl -s -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "e2e-test@example.com",
    "username": "e2e-user",
    "password": "Test1234",
    "userType": "efficient"
  }' | jq .

echo "✓ Tests complete!"
```

---

## 🔧 Troubleshooting

### Port Already in Use

```bash
# Find process on port 5000
lsof -i :5000

# Kill process
kill -9 <PID>

# Or use different port
PORT=5001 npm run dev
```

### Database Connection Error

```bash
# Check PostgreSQL is running
psql interview_genai -c "SELECT NOW();"

# Or with Docker
docker-compose ps  # Check if postgres is running
docker-compose logs postgres  # View logs

# Recreate database
dropdb interview_genai
createdb interview_genai
psql interview_genai < backend/src/config/schema.sql
```

### Redis Connection Error

```bash
# Check Redis is running
redis-cli ping  # Should return "PONG"

# Or with Docker
docker-compose logs redis
```

### Frontend Can't Connect to Backend

```bash
# Check backend is running
curl http://localhost:5000/health

# Check CORS settings in backend
# Update .env: CORS_ORIGIN=http://localhost:3000

# Check vite.config.ts proxy settings
# Should proxy /api to http://localhost:5000
```

### Module Not Found Errors

```bash
# Rebuild dependencies
cd frontend && rm -rf node_modules && npm install
cd ../backend && rm -rf node_modules && npm install

# Clear build cache
cd frontend && rm -rf dist
cd ../backend && rm -rf dist
npm run build
```

### TypeScript Errors

```bash
# Type check
npm run typecheck

# Clear TypeScript cache
find . -name "*.tsbuildinfo" -delete
npm run build
```

---

## 📚 Documentation

- **Full Setup Guide**: See [COMPLETE_SETUP_GUIDE.md](./COMPLETE_SETUP_GUIDE.md)
- **Frontend Guide**: See [frontend/README.md](./frontend/README.md)
- **Backend Guide**: See [backend/README.md](./backend/README.md)
- **API Documentation**: See [backend/API.md](./backend/API.md)
- **Deployment Guide**: See [DEPLOYMENT.md](./DEPLOYMENT.md)

---

## 🆘 Getting Help

### Common Issues

1. **"Port 5000 is already in use"**
   - Change port: `PORT=5001 npm run dev`

2. **"Cannot find module 'express'"**
   - Install dependencies: `npm install`

3. **"Database connection refused"**
   - Start PostgreSQL: `docker-compose up -d postgres`

4. **"Frontend can't connect to API"**
   - Check CORS: `CORS_ORIGIN=http://localhost:3000`

### Support Channels

- GitHub Issues: Report bugs and feature requests
- Documentation: Check COMPLETE_SETUP_GUIDE.md
- API Docs: See backend/API.md
- Tests: Run `npm test` to verify setup

---

## ✅ Next Steps

1. **Local Development**
   - Follow steps above to run locally
   - Create test predictions
   - Explore all features

2. **Customization**
   - Modify database schema as needed
   - Add custom API endpoints
   - Update frontend components

3. **Deployment**
   - Choose cloud provider
   - Set up CI/CD pipeline
   - Deploy to production

4. **Monitoring**
   - Set up logging
   - Configure alerts
   - Monitor performance

---

**Last Updated**: November 17, 2025
**Version**: 1.0.0
**Status**: ✅ Ready for Deployment
