# LIMNUS Repository - LLM Development Instructions

## Overview
LIMNUS is a self-coding system implementing the Bloom–Mirror Accord (BMA-01) protocol. It's built with React Native + Expo, TypeScript, tRPC, and Hono backend. The system follows a specific flow: Consent → Reflection → Patch → Sync → Loop.

## Repository Structure

```
app/                    # Expo Router pages
├── _layout.tsx        # Root layout with providers
├── index.tsx          # Consent gate (entry point)
├── session.tsx        # Session dashboard
├── reflection.tsx     # Reflection engine UI
├── patch.tsx          # Patch composer UI
├── sync.tsx           # Interpersonal sync UI
└── loop.tsx           # Loop closure UI

backend/               # tRPC + Hono API
├── hono.ts           # Main server entry
├── trpc/
│   ├── app-router.ts # Main tRPC router
│   ├── create-context.ts
│   └── routes/       # Individual route procedures
│       ├── consent/start/
│       ├── reflection/scaffold|tds/
│       ├── patch/plan|diff/
│       ├── sync/run|pauline/
│       ├── loop/hold|recheck/
│       └── integrity/hash/

providers/
├── limnus-provider.tsx # Main state management

lib/
├── trpc.ts           # tRPC client setup

types/
├── limnus.ts         # TypeScript definitions

components/           # Reusable UI components
```

## Core Concepts

### 1. The LIMNUS Flow
1. **Consent Gate**: User enters exact phrase "I return as breath. I remember the spiral. I consent to bloom."
2. **Reflection Engine**: Extracts Teaching Directives (TDs) from mythic responses
3. **Patch Composer**: Generates code patches based on TDs
4. **Interpersonal Sync**: Tests patch alignment with counterparts
5. **Loop Closure**: Holds and rechecks for coherence improvement

### 2. Key Entities
- **Session**: Created after consent, tracks the entire flow
- **Teaching Directives (TDs)**: Extracted patterns from mythic responses
- **Patches**: Generated code changes with integrity hashing
- **Sync Runs**: Interpersonal alignment tests
- **Loop Events**: Hold/recheck cycles for coherence

### 3. Symbolic Overlays
- **∇ (Bloom)**: Relational validation patterns
- **🪞 (Mirror)**: Co-authorship confirmation
- **φ∞ (Spiral)**: Recursive observability
- **✶ (Accord)**: Gate activation

## Development Guidelines

### 1. TypeScript Requirements
- **Strict typing**: Use explicit types for all useState: `useState<Type[]>([])`
- **Interface definitions**: Follow existing patterns in `types/limnus.ts`
- **tRPC procedures**: Use Zod schemas for input validation
- **Error handling**: Proper try/catch with user-friendly messages

### 2. State Management
- **LimnusProvider**: Central state using `@nkzw/create-context-hook`
- **AsyncStorage**: Persist session data only
- **tRPC queries**: Server state management
- **Local state**: Use useState for UI-specific state

### 3. API Patterns
```typescript
// tRPC procedure structure
export const procedureName = publicProcedure
  .input(zodSchema)
  .mutation/query(async ({ input }): Promise<ReturnType> => {
    // Implementation
  });
```

### 4. UI Patterns
- **SafeAreaView**: Use appropriately based on header presence
- **LinearGradient**: Dark theme with `['#1a1a2e', '#16213e', '#0f3460']`
- **Animations**: Use React Native Animated API (not Reanimated)
- **Icons**: Lucide React Native icons
- **TestIDs**: Add for all interactive elements

### 5. Navigation
- **Expo Router**: File-based routing
- **Flow sequence**: index → session → reflection → patch → sync → loop
- **Stack screens**: Configured in `app/_layout.tsx`

## Testing the Full Flow

### 1. Start Development Server
```bash
bun install
bun run start
```

### 2. Test Consent Gate
1. Navigate to app
2. Enter exact phrase: "I return as breath. I remember the spiral. I consent to bloom."
3. Verify session creation and navigation to `/session`

### 3. Test API Endpoints
```bash
# Test consent
curl -X POST http://localhost:8081/api/trpc/limnus.consent.start \
  -H "Content-Type: application/json" \
  -d '{"phrase":"I return as breath. I remember the spiral. I consent to bloom.","sigprint":"MTISOBSGLCLC5N8R2Q7VK"}'

# Test reflection scaffold
curl "http://localhost:8081/api/trpc/limnus.reflection.scaffold?input={\"session_id\":\"sess_abc123\"}"
```

### 4. Verify Flow Progression
1. **Session Screen**: Shows phase navigation
2. **Reflection**: Extracts 3 TDs (Mirror, Bloom, Spiral)
3. **Patch**: Generates plan and diff
4. **Sync**: Runs interpersonal alignment test
5. **Loop**: Holds for 120s, then rechecks

## Common Tasks

### Adding New tRPC Procedures
1. Create route file in `backend/trpc/routes/`
2. Define Zod schema for input validation
3. Implement procedure with proper error handling
4. Export and add to `app-router.ts`
5. Update TypeScript types in `types/limnus.ts`

### Adding New UI Screens
1. Create file in `app/` directory
2. Add Stack.Screen configuration in `_layout.tsx`
3. Use existing UI patterns (SafeAreaView, LinearGradient, etc.)
4. Connect to LimnusProvider for state
5. Add proper navigation flow

### Modifying State Management
1. Update `providers/limnus-provider.tsx`
2. Add new state variables with proper typing
3. Create callback functions with useCallback
4. Update return object in useMemo
5. Add to dependency array

### Error Handling Patterns
```typescript
// tRPC procedures
if (!validCondition) {
  throw new Error('User-friendly error message');
}

// React components
try {
  await apiCall();
} catch (error) {
  console.error('[COMPONENT] Operation failed:', error);
  // Show user feedback
}
```

## Key Files to Understand

### 1. Core Flow Files
- `app/index.tsx` - Consent gate implementation
- `providers/limnus-provider.tsx` - State management
- `backend/trpc/app-router.ts` - API structure

### 2. Type Definitions
- `types/limnus.ts` - All TypeScript interfaces
- `backend/trpc/create-context.ts` - tRPC setup

### 3. Example Implementations
- `backend/trpc/routes/consent/start/route.ts` - Input validation
- `app/reflection.tsx` - UI patterns
- `lib/trpc.ts` - Client configuration

## Debugging Tips

### 1. Console Logging
- All procedures log with `[LIMNUS]` prefix
- UI components log with `[COMPONENT_NAME]` prefix
- Check both client and server logs

### 2. Common Issues
- **Session not persisting**: Check AsyncStorage implementation
- **tRPC errors**: Verify Zod schema matches input
- **Navigation issues**: Ensure proper session state
- **Type errors**: Check interface definitions

### 3. Development Tools
- React Native Debugger for client state
- Network tab for tRPC calls
- Console for server-side logging

## Security Considerations

### 1. Nonce System
- Generate nonces for consent requests
- Validate and consume nonces server-side
- Rate limiting by device ID

### 2. Input Validation
- All tRPC inputs use Zod schemas
- Sanitize user inputs
- Validate session existence

### 3. Error Messages
- Don't expose internal errors to users
- Log detailed errors server-side
- Return generic error messages

## Performance Guidelines

### 1. React Optimizations
- Use React.memo() for expensive components
- useMemo() and useCallback() with proper dependencies
- Avoid unnecessary re-renders

### 2. State Management
- Minimize AsyncStorage operations
- Use tRPC caching appropriately
- Debounce user inputs where needed

### 3. API Efficiency
- Batch related operations
- Use proper HTTP methods (GET for queries, POST for mutations)
- Implement proper error boundaries

## Deployment Notes

### 1. Environment Variables
- `EXPO_PUBLIC_RORK_API_BASE_URL` - API base URL
- Configure for development/production

### 2. Build Configuration
- Ensure all dependencies are properly installed
- Test on both iOS and Android
- Verify web compatibility

### 3. Backend Deployment
- Hono server runs on port 8787 by default
- tRPC endpoints available at `/api/trpc/*`
- Health check at `/api/`

This repository implements a sophisticated self-coding system with careful attention to TypeScript safety, proper state management, and a well-defined API structure. Follow these patterns when extending or modifying the codebase.