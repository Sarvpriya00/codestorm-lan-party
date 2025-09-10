#!/bin/bash

echo "🔧 Fixing CodeStorm Login and WebSocket Issues"

# Navigate to backend directory
cd backend

echo "📦 Installing/updating backend dependencies..."
npm install

echo "🔧 Generating Prisma client..."
npx prisma generate

echo "🗄️  Running database migrations..."
npx prisma db push

echo "👤 Creating test users..."
node create-test-user.js

echo "🔍 Testing database connection..."
node test-db.js

echo "🌐 Testing WebSocket connection..."
cd ..
node test-websocket.js &
WS_TEST_PID=$!

# Start backend server for testing
echo "🖥️  Starting backend server for testing..."
cd backend
npm run dev &
BACKEND_PID=$!

# Wait for backend to start
sleep 5

# Kill the WebSocket test
kill $WS_TEST_PID 2>/dev/null

# Test WebSocket again with server running
echo "🔄 Testing WebSocket with server running..."
cd ..
node test-websocket.js

# Stop backend server
kill $BACKEND_PID 2>/dev/null

echo ""
echo "✅ Login and WebSocket fixes applied!"
echo "📋 Summary of changes:"
echo "   - Fixed WebSocket URL configuration"
echo "   - Added environment variables for backend host"
echo "   - Improved error handling in login flow"
echo "   - Added HTTP fallback for login"
echo "   - Enhanced WebSocket authentication"
echo "   - Created test users and database setup"
echo ""
echo "🚀 You can now start the development environment with:"
echo "   ./start-dev.sh"
echo ""
echo "👤 Test credentials:"
echo "   Username: test_user"
echo "   Password: test123"
echo ""
echo "   Admin credentials:"
echo "   Username: admin"
echo "   Password: admin123"