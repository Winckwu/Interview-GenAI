#!/bin/bash

# Interview-GenAI Quick Start Script for Mac
# This script sets up and starts both backend and frontend

set -e  # Exit on error

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$PROJECT_DIR/backend"
FRONTEND_DIR="$PROJECT_DIR/frontend"

echo "🚀 Interview-GenAI Quick Start"
echo "======================================"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

echo "✅ Node.js version: $(node --version)"

# Check if PostgreSQL is running
if ! pg_isready -h localhost &> /dev/null; then
    echo "❌ PostgreSQL is not running. Please start PostgreSQL first."
    exit 1
fi

echo "✅ PostgreSQL is running"
echo ""

# Start backend
echo "🔧 Starting Backend Server..."
cd "$BACKEND_DIR"

if [ ! -d "node_modules" ]; then
    echo "   Installing backend dependencies..."
    npm install --silent
    npm install openai --silent
fi

npm run dev &
BACKEND_PID=$!
echo "   Backend starting (PID: $BACKEND_PID)"

# Wait for backend to start
sleep 3

# Check if backend is running
if ! curl -s http://localhost:5001/api/ai/models > /dev/null 2>&1; then
    echo "❌ Backend failed to start"
    kill $BACKEND_PID
    exit 1
fi

echo "✅ Backend is running on http://localhost:5001"
echo ""

# Start frontend
echo "🎨 Starting Frontend Server..."
cd "$FRONTEND_DIR"

if [ ! -d "node_modules" ]; then
    echo "   Installing frontend dependencies..."
    npm install --silent
fi

npm run dev &
FRONTEND_PID=$!
echo "   Frontend starting (PID: $FRONTEND_PID)"

# Wait for frontend to start
sleep 3

echo "✅ Frontend is running on http://localhost:3000"
echo ""

echo "======================================"
echo "✅ Application Started Successfully!"
echo "======================================"
echo ""
echo "📱 Frontend: http://localhost:3000"
echo "🔌 Backend:  http://localhost:5001"
echo ""
echo "🧪 To run tests:"
echo "   bash test-complete-flow.sh"
echo ""
echo "⏹️  To stop servers:"
echo "   Press Ctrl+C here, or:"
echo "   kill $BACKEND_PID $FRONTEND_PID"
echo ""

# Keep the script running
wait $BACKEND_PID $FRONTEND_PID
