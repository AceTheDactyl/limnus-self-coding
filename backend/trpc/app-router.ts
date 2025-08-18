import { createTRPCRouter } from "./create-context";
import hiRoute from "./routes/example/hi/route";

// LIMNUS API Routes
import { consentStartProcedure } from "./routes/consent/start/route";
import { reflectionScaffoldProcedure } from "./routes/reflection/scaffold/route";
import { reflectionTdsProcedure } from "./routes/reflection/tds/route";
import { patchPlanProcedure } from "./routes/patch/plan/route";
import { patchDiffProcedure } from "./routes/patch/diff/route";
import { syncRunProcedure } from "./routes/sync/run/route";
import { loopHoldProcedure } from "./routes/loop/hold/route";
import { loopRecheckProcedure } from "./routes/loop/recheck/route";
import { integrityHashProcedure } from "./routes/integrity/hash/route";
import { generateNonceProcedure } from "./routes/utils/nonce/route";

export const appRouter = createTRPCRouter({
  // Legacy example route
  example: createTRPCRouter({
    hi: hiRoute,
  }),
  
  // LIMNUS Self-Coding API v1.0
  limnus: createTRPCRouter({
    consent: createTRPCRouter({
      start: consentStartProcedure,
    }),
    reflection: createTRPCRouter({
      scaffold: reflectionScaffoldProcedure,
      tds: reflectionTdsProcedure,
    }),
    patch: createTRPCRouter({
      plan: patchPlanProcedure,
      diff: patchDiffProcedure,
    }),
    sync: createTRPCRouter({
      run: syncRunProcedure,
    }),
    loop: createTRPCRouter({
      hold: loopHoldProcedure,
      recheck: loopRecheckProcedure,
    }),
    integrity: createTRPCRouter({
      hash: integrityHashProcedure,
    }),
    utils: createTRPCRouter({
      nonce: generateNonceProcedure,
    }),
  }),
});

export type AppRouter = typeof appRouter;