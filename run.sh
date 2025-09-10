#!/bin/bash

# Exit immediately if a command exits with a non-zero status.
set -e

# --- Backend Setup ---
echo "🚀 Starting backend setup..."
cd backend

echo "📦 Installing backend dependencies..."
npm install

echo "IMPORTANT: Please ensure your backend/.env file is configured correctly."
read -p "Press [Enter] to continue once your .env file is ready..."

echo "🗄️ Running database migrations..."
npx prisma migrate dev

echo "🔨 Building backend..."
npm run build

echo "▶️ Starting backend server in the background..."
npm run start &
# Store the process ID of the last background command
BACKEND_PID=$!

cd ..

# --- Frontend Setup ---
echo "🚀 Starting frontend setup..."

echo "📦 Installing frontend dependencies..."
npm install

echo "▶️ Starting frontend development server..."
npm run dev

# Optional: Clean up the background server process when the script is exited
trap "echo 'Stopping backend server...'; kill $BACKEND_PID" EXIT

# Keep the script alive to keep the trap active if dev server detaches
wait
