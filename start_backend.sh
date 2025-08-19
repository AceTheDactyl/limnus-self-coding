#!/bin/bash

# Start LIMNUS Backend Server
echo "🚀 Starting LIMNUS Backend Server..."
echo "📡 Server will be available at: http://localhost:8787"
echo "🔍 tRPC endpoints at: http://localhost:8787/api/trpc"
echo "💡 Press Ctrl+C to stop the server"
echo ""

# Start the backend server
bun run backend/server.ts