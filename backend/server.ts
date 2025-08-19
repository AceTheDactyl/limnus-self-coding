import app from "./hono";

const port = process.env.PORT || 8787;

console.log(`🚀 LIMNUS API server starting on port ${port}`);

Bun.serve({
  port: Number(port),
  fetch: app.fetch,
});

console.log(`✨ LIMNUS API server running at http://localhost:${port}`);
console.log(`📡 tRPC endpoints available at http://localhost:${port}/api/trpc`);
console.log(`🔍 Health check: http://localhost:${port}/api`);