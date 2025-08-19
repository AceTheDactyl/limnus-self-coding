import { createTRPCReact } from "@trpc/react-query";
import { httpLink } from "@trpc/client";
import type { AppRouter } from "@/backend/trpc/app-router";
import superjson from "superjson";

export const trpc = createTRPCReact<AppRouter>();

const getBaseUrl = () => {
  if (process.env.EXPO_PUBLIC_RORK_API_BASE_URL) {
    return process.env.EXPO_PUBLIC_RORK_API_BASE_URL;
  }

  // Default to localhost for development
  if (__DEV__) {
    return 'http://localhost:8787';
  }

  throw new Error(
    "No base url found, please set EXPO_PUBLIC_RORK_API_BASE_URL"
  );
};

const baseUrl = getBaseUrl();
console.log('[TRPC] Connecting to:', `${baseUrl}/api/trpc`);

export const trpcClient = trpc.createClient({
  links: [
    httpLink({
      url: `${baseUrl}/api/trpc`,
      transformer: superjson,
      fetch: (url, options) => {
        console.log('[TRPC] Making request to:', url);
        return fetch(url, options).catch((error) => {
          console.error('[TRPC] Fetch error:', error);
          console.error('[TRPC] URL:', url);
          console.error('[TRPC] Options:', options);
          
          // Provide more helpful error messages
          if (error.message.includes('Failed to fetch') || error.code === 'NETWORK_ERROR') {
            const helpfulError = new Error(
              `Cannot connect to LIMNUS backend server at ${baseUrl}. ` +
              `Please ensure the backend server is running on port 8787. ` +
              `You can start it with: bun run backend/server.ts`
            );
            helpfulError.name = 'BackendConnectionError';
            throw helpfulError;
          }
          
          throw error;
        });
      },
    }),
  ],
});