#!/bin/bash

# LIMNUS Web Development Startup Script
echo "🚀 Starting LIMNUS web development environment..."

# Start backend server in background
echo "📡 Starting backend server..."
bun run backend/server.ts &
SERVER_PID=$!

# Wait for server to start
echo "⏳ Waiting for backend server to start..."
sleep 3

# Check if server is running
if curl -f http://localhost:8787/api > /dev/null 2>&1; then
    echo "✅ Backend server is running on http://localhost:8787"
    echo "🔗 tRPC endpoints available at: http://localhost:8787/api/trpc"
else
    echo "❌ Backend server failed to start"
    kill $SERVER_PID 2>/dev/null
    exit 1
fi

echo "🌐 Starting Expo web frontend..."
echo "Press Ctrl+C to stop both backend and frontend"
echo ""

# Function to cleanup on exit
cleanup() {
    echo "\n🛑 Stopping backend server..."
    kill $SERVER_PID 2>/dev/null || true
    echo "✅ Cleanup complete"
    exit 0
}

# Set trap to cleanup on script exit
trap cleanup INT TERM

# Start Expo web frontend (this will block)
bunx rork start -p g8fd2881wnxqj3m2z5eh2 --web --tunnel

# If we get here, cleanup
cleanup