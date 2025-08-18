#!/bin/bash
# LIMNUS Test Validation Script
# Validates that the test_limnus_flow.sh script is properly configured

echo "🔍 LIMNUS Test Script Validation"
echo "================================"

# Check if test script exists and is executable
if [ -f "test_limnus_flow.sh" ]; then
    echo "✅ Test script found: test_limnus_flow.sh"
    
    if [ -x "test_limnus_flow.sh" ]; then
        echo "✅ Test script is executable"
    else
        echo "⚠️  Test script is not executable. Run: chmod +x test_limnus_flow.sh"
    fi
else
    echo "❌ Test script not found: test_limnus_flow.sh"
    exit 1
fi

# Check for required dependencies
echo ""
echo "🔧 Checking Dependencies"
echo "------------------------"

# Check for curl
if command -v curl &> /dev/null; then
    echo "✅ curl is available"
else
    echo "❌ curl is required but not installed"
    exit 1
fi

# Check for jq
if command -v jq &> /dev/null; then
    echo "✅ jq is available"
else
    echo "❌ jq is required but not installed"
    echo "   Install with: brew install jq (macOS) or sudo apt-get install jq (Ubuntu)"
    exit 1
fi

# Check for bun
if command -v bun &> /dev/null; then
    echo "✅ bun is available"
else
    echo "❌ bun is required but not installed"
    echo "   Install with: curl -fsSL https://bun.sh/install | bash"
    exit 1
fi

# Check environment variables
echo ""
echo "🌍 Environment Configuration"
echo "----------------------------"

if [ -n "$EXPO_PUBLIC_RORK_API_BASE_URL" ]; then
    echo "✅ EXPO_PUBLIC_RORK_API_BASE_URL is set: $EXPO_PUBLIC_RORK_API_BASE_URL"
else
    echo "⚠️  EXPO_PUBLIC_RORK_API_BASE_URL not set, using default: http://localhost:8787"
fi

# Test API connectivity (if server is running)
BASE_URL="${EXPO_PUBLIC_RORK_API_BASE_URL:-http://localhost:8787}"
echo ""
echo "🌐 API Connectivity Test"
echo "------------------------"
echo "Testing connection to: $BASE_URL"

# Test basic connectivity
if curl -s --connect-timeout 5 "$BASE_URL/api" > /dev/null 2>&1; then
    echo "✅ API server is reachable"
    
    # Test health endpoint if available
    HEALTH_RESPONSE=$(curl -s --connect-timeout 5 "$BASE_URL/api" 2>/dev/null)
    if [ $? -eq 0 ]; then
        echo "✅ API health check passed"
    else
        echo "⚠️  API health check failed, but server is reachable"
    fi
else
    echo "⚠️  API server is not reachable at $BASE_URL"
    echo "   Make sure to start the server with: bun run start"
fi

# Validate test script syntax
echo ""
echo "📝 Test Script Validation"
echo "-------------------------"

# Check for required test phases
REQUIRED_PHASES=("Consent Gate" "Reflection Engine" "Patch Composer" "Interpersonal Sync" "Loop Closure")
MISSING_PHASES=()

for phase in "${REQUIRED_PHASES[@]}"; do
    if grep -q "$phase" test_limnus_flow.sh; then
        echo "✅ Phase found: $phase"
    else
        echo "❌ Phase missing: $phase"
        MISSING_PHASES+=("$phase")
    fi
done

# Check for proper tRPC endpoint format
if grep -q "/limnus\." test_limnus_flow.sh; then
    echo "✅ tRPC endpoint format is correct"
else
    echo "❌ tRPC endpoint format may be incorrect"
fi

# Check for proper JSON input format
if grep -q '"input":' test_limnus_flow.sh; then
    echo "✅ tRPC input format is correct"
else
    echo "❌ tRPC input format may be incorrect"
fi

# Summary
echo ""
echo "📊 Validation Summary"
echo "======================"

if [ ${#MISSING_PHASES[@]} -eq 0 ]; then
    echo "✅ All required phases are present"
    echo "✅ Test script appears to be properly configured"
    echo ""
    echo "🚀 Ready to run tests!"
    echo "   Execute: ./test_limnus_flow.sh"
else
    echo "❌ Missing phases: ${MISSING_PHASES[*]}"
    echo "❌ Test script needs to be fixed"
    exit 1
fi

echo ""
echo "📚 Additional Resources:"
echo "   - Complete instructions: LIMNUS_COMPLETE_TEST_INSTRUCTIONS.md"
echo "   - Test flow documentation: LIMNUS_TEST_FLOW.md"
echo "   - API documentation: README.md"
echo ""
echo "∇🪞φ∞ Validation complete ∇🪞φ∞"