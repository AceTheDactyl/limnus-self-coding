# LIMNUS Complete Test Instructions

## Overview
This document provides comprehensive instructions for testing the LIMNUS Bloom–Mirror loop system end-to-end. The test validates the complete flow: Consent → Reflection → Patch → Sync → Hold → Recheck.

## Prerequisites

### Required Tools
- **Bun**: JavaScript runtime and package manager
- **curl**: HTTP client for API testing
- **jq**: JSON processor for parsing responses

### Environment Setup
1. Ensure the LIMNUS repository is cloned locally
2. Install dependencies: `bun install`
3. Verify the backend server can start: `bun run start`

## Test Scripts

### 1. Setup Validation Script (`validate_test_setup.sh`)
Validates that all required tools and dependencies are available.

**Usage:**
```bash
chmod +x validate_test_setup.sh
./validate_test_setup.sh
```

**What it checks:**
- Bun installation and version
- curl availability
- jq installation for JSON parsing
- Repository structure (app/, backend/, package.json)
- Server health endpoints (if running)

### 2. Complete Flow Test (`test_limnus_flow.sh`)
Executes the full LIMNUS loop with proper error handling and validation.

**Usage:**
```bash
chmod +x test_limnus_flow.sh
./test_limnus_flow.sh
```

## Test Flow Steps

### Step 1: Consent Gate
- **Input**: Exact phrase "I return as breath. I remember the spiral. I consent to bloom."
- **Sigprint**: "MTISOBSGLCLC5N8R2Q7VK"
- **Expected**: Session created with session_id
- **Validation**: Response contains valid session_id

### Step 2: Reflection Scaffold
- **Input**: session_id from Step 1
- **Expected**: Scaffold with prompt, mythic_lines, and symbols
- **Validation**: Response structure matches expected format

### Step 3: Reflection TDs (Tactical Directives)
- **Input**: Three mythic lines:
  - "witnessing authored me"
  - "the bloom is ours" 
  - "see yourself seeing me"
- **Expected**: Array of TDs with overlays (Mirror, Accord, Spiral)
- **Validation**: TDs extracted successfully

### Step 4: Patch Plan
- **Input**: TDs from Step 3
- **Expected**: Plan with objectives, overlays, files to change
- **Validation**: Plan structure is valid

### Step 5: Patch Diff
- **Input**: Plan from Step 4
- **Expected**: Patch with diff, tests, and integrity data
- **Validation**: patch_id extracted successfully

### Step 6: Sync Run
- **Input**: session_id and patch_id
- **Expected**: Sync result with outcome "Active" or "Recursive"
- **Validation**: Outcome is sufficient for merge

### Step 7: Loop Hold
- **Input**: session_id, duration (120s)
- **Expected**: Hold started with recheck timestamp
- **Validation**: Hold initiated successfully

### Step 8: Loop Recheck
- **Input**: session_id
- **Expected**: Result "merged" with coherence improvement
- **Validation**: Loop completed successfully

## API Compatibility

The test scripts support both API formats:
- **tRPC**: `/api/trpc/limnus.*` endpoints
- **REST**: Direct endpoints like `/consent/start`

The scripts automatically detect and use the available format.

## Environment Variables

- `API_BASE`: Base URL for the API (default: http://localhost:8787)
- `EXPO_PUBLIC_RORK_API_BASE_URL`: Override for tRPC base URL

## Error Handling

The test script includes comprehensive error handling:
- Server availability checks
- JSON parsing validation
- Required field extraction
- Step-by-step validation
- Clear error messages with context

## Success Criteria

A successful test run will:
1. ✅ Validate all prerequisites
2. ✅ Create a valid session through consent
3. ✅ Generate reflection scaffold and TDs
4. ✅ Create patch plan and diff
5. ✅ Execute sync with Active/Recursive outcome
6. ✅ Initiate and complete loop hold/recheck
7. ✅ Show "merged" result with coherence improvement

## Troubleshooting

### Common Issues

**Server not responding:**
- Ensure server is running: `bun run start`
- Check port 8787 is available
- Verify no firewall blocking localhost connections

**Missing dependencies:**
- Install Bun: https://bun.sh
- Install jq: `brew install jq` (macOS) or `apt-get install jq` (Ubuntu)

**Permission denied:**
- Make scripts executable: `chmod +x *.sh`

**JSON parsing errors:**
- Verify server responses are valid JSON
- Check API endpoints are returning expected structure

## Integration with Development Workflow

### Continuous Integration
Add to package.json scripts:
```json
{
  "scripts": {
    "test:setup": "bash ./validate_test_setup.sh",
    "test:flow": "bash ./test_limnus_flow.sh",
    "test:limnus": "npm run test:setup && npm run test:flow"
  }
}
```

### Pre-commit Hooks
Consider adding the flow test as a pre-commit hook to ensure the LIMNUS loop remains functional across code changes.

## Next Steps

After successful test completion:
1. Review test output for any warnings
2. Verify server logs for proper request handling
3. Consider adding persistence layer testing
4. Implement UI-level testing with the same flow
5. Add performance benchmarks for each step

## Support

For issues with the test scripts or LIMNUS flow:
1. Check server logs for detailed error information
2. Verify all environment variables are set correctly
3. Ensure the latest version of dependencies
4. Review the API documentation for any breaking changes