#!/bin/bash

# Start LIMNUS development environment
echo "🚀 Starting LIMNUS development environment..."

# Start backend server in background
echo "📡 Starting backend server..."
bun run backend/server.ts &
SERVER_PID=$!

# Wait for server to start
echo "⏳ Waiting for server to start..."
sleep 3

# Check if server is running
if curl -f http://localhost:8787/api > /dev/null 2>&1; then
    echo "✅ Backend server is running on http://localhost:8787"
else
    echo "❌ Backend server failed to start"
    kill $SERVER_PID 2>/dev/null
    exit 1
fi

echo "📱 Starting Expo app..."
echo "Backend API available at: http://localhost:8787/api/trpc"
echo "Press Ctrl+C to stop both server and app"

# Function to cleanup on exit
cleanup() {
    echo "\n🛑 Stopping backend server..."
    kill $SERVER_PID 2>/dev/null || true
    exit 0
}

# Set trap to cleanup on script exit
trap cleanup INT TERM

# Start Expo (this will block)
bunx rork start -p g8fd2881wnxqj3m2z5eh2 --tunnel

# If we get here, cleanup
cleanup