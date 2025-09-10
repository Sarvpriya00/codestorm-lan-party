#!/bin/bash

echo "🚀 Starting CodeStorm Servers"

# Kill any existing processes
pkill -f "ts-node" 2>/dev/null
pkill -f "vite" 2>/dev/null

# Wait a moment
sleep 2

# Start backend server
echo "🖥️  Starting backend server on port 3001..."
cd backend && npm run dev &
BACKEND_PID=$!
cd ..

# Wait for backend to start
echo "⏳ Waiting for backend to start..."
sleep 5

# Test backend connection
if curl -s http://localhost:3001/health > /dev/null; then
    echo "✅ Backend server is running on port 3001"
else
    echo "❌ Backend server failed to start"
    exit 1
fi

# Start frontend server
echo "🌐 Starting frontend server..."
VITE_BACKEND_HOST=localhost:3001 VITE_API_BASE_URL=http://localhost:3001/api npm run dev &
FRONTEND_PID=$!

# Wait for frontend to start
echo "⏳ Waiting for frontend to start..."
sleep 5

echo ""
echo "✅ Servers started successfully!"
echo "📍 Backend: http://localhost:3001"
echo "📍 Frontend: Check the terminal output for the port"
echo ""
echo "👤 Test credentials:"
echo "   Username: admin"
echo "   Password: admin123"
echo ""
echo "   Username: test_user"
echo "   Password: test123"
echo ""
echo "Press Ctrl+C to stop all servers"

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Stopping servers..."
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    pkill -f "ts-node" 2>/dev/null
    pkill -f "vite" 2>/dev/null
    exit 0
}

# Set trap to cleanup on script exit
trap cleanup SIGINT SIGTERM

# Wait for processes
wait