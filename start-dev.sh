#!/bin/bash

echo "🚀 Starting CodeStorm Development Environment"

# Check if backend dependencies are installed
if [ ! -d "backend/node_modules" ]; then
    echo "📦 Installing backend dependencies..."
    cd backend && npm install && cd ..
fi

# Check if frontend dependencies are installed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing frontend dependencies..."
    npm install
fi

# Generate Prisma client
echo "🔧 Generating Prisma client..."
cd backend && npx prisma generate && cd ..

# Create test users
echo "👤 Creating test users..."
cd backend && node create-test-user.js && cd ..

# Start backend server
echo "🖥️  Starting backend server on port 3000..."
cd backend && npm run dev &
BACKEND_PID=$!

# Wait a moment for backend to start
sleep 3

# Start frontend server
echo "🌐 Starting frontend server..."
npm run dev &
FRONTEND_PID=$!

echo ""
echo "✅ Development environment started!"
echo "📍 Frontend: http://localhost:5173"
echo "📍 Backend: http://localhost:3000"
echo "👤 Test credentials:"
echo "   Username: test_user"
echo "   Password: test123"
echo ""
echo "   Admin credentials:"
echo "   Username: admin"
echo "   Password: admin123"
echo ""
echo "Press Ctrl+C to stop all servers"

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Stopping servers..."
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    exit 0
}

# Set trap to cleanup on script exit
trap cleanup SIGINT SIGTERM

# Wait for processes
wait