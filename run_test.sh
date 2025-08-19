#!/usr/bin/env bash
set -euo pipefail

echo "🔧 Making scripts executable..."
chmod +x validate_test_setup.sh test_limnus_flow.sh run_test.sh

echo "📋 Running setup validation..."
./validate_test_setup.sh

echo "🚀 Starting LIMNUS API server in background..."
bun run backend/server.ts &
SERVER_PID=$!

echo "⏳ Waiting for server to start..."
sleep 3

echo "🧪 Running complete LIMNUS flow test..."
if ./test_limnus_flow.sh; then
    echo "✅ All tests passed!"
    RESULT=0
else
    echo "❌ Tests failed!"
    RESULT=1
fi

echo "🛑 Stopping server..."
kill $SERVER_PID 2>/dev/null || true

exit $RESULT