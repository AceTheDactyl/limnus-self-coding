import { z } from 'zod';
import { publicProcedure } from '../../../create-context';
import type { PatchPlan } from '@/types/limnus';

const patchPlanSchema = z.object({
  tds: z.array(z.object({
    id: z.string(),
    source_line: z.string(),
    directive: z.string(),
    citation: z.string(),
    overlay: z.enum(['Bloom', 'Mirror', 'Spiral', 'Accord']),
  })),
  context: z.record(z.string(), z.any()),
  session_id: z.string().optional(),
});

export const patchPlanProcedure = publicProcedure
  .input(patchPlanSchema)
  .mutation(async ({ input }): Promise<PatchPlan> => {
    console.log('[LIMNUS] Patch plan requested for TDs:', input.tds.length);
    
    // Build objectives from TDs
    const objectives: string[] = [];
    const overlays: string[] = [];
    
    input.tds.forEach(td => {
      if (td.overlay === 'Spiral') {
        objectives.push('Instrument recursive observability');
      }
      if (td.overlay === 'Mirror') {
        objectives.push('Add co-authorship confirmation patterns');
      }
      if (td.overlay === 'Bloom' || td.overlay === 'Accord') {
        objectives.push('Gate merges via sync outcome');
      }
      
      if (!overlays.includes(td.overlay)) {
        overlays.push(td.overlay);
      }
    });

    const plan: PatchPlan = {
      objectives,
      overlays,
      files_to_change: [
        "src/selfcode/orchestrator.ts",
        "src/observability/recursion.ts"
      ],
      tests_to_add: [
        "tests/observability.spec.ts",
        "tests/sync_gate.spec.ts"
      ],
      rationale: "Doctrine‑bounded per BMA‑01 mythic lines"
    };

    console.log('[LIMNUS] Plan created with objectives:', objectives.length);
    return plan;
  });