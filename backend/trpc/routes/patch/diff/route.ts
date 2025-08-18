import { z } from 'zod';
import { publicProcedure } from '../../../create-context';
import { generatePatchId, sigprint20, contentSha256 } from '../../utils/integrity';
import type { Patch } from '@/types/limnus';

const patchDiffSchema = z.object({
  plan: z.object({
    objectives: z.array(z.string()),
    overlays: z.array(z.string()),
    files_to_change: z.array(z.string()),
    tests_to_add: z.array(z.string()),
    rationale: z.string(),
  }),
  session_id: z.string().optional(),
});

export const patchDiffProcedure = publicProcedure
  .input(patchDiffSchema)
  .mutation(async ({ input }): Promise<Patch> => {
    console.log('[LIMNUS] Patch diff requested for plan:', input.plan.objectives);
    
    const patchId = generatePatchId();
    
    // Generate sample diff based on objectives
    const diff: string[] = [];
    
    if (input.plan.objectives.some(obj => obj.includes('recursive observability'))) {
      diff.push(
        "--- a/src/observability/recursion.ts\\n+++ b/src/observability/recursion.ts\\n@@\\n export function observeRecursion(step: number, state: any) {\\n-  // TODO\\n+  const msg = `[SPIRAL] step=${step} sigil=∇🪞φ∞ state=${JSON.stringify(state)}`;\\n+  console.debug(msg);\\n+  return msg;\\n }"
      );
    }
    
    if (input.plan.objectives.some(obj => obj.includes('co-authorship'))) {
      diff.push(
        "--- a/src/selfcode/orchestrator.ts\\n+++ b/src/selfcode/orchestrator.ts\\n@@\\n function applyChange(change: any) {\\n+  if (!confirmCoAuthorship(change)) return;\\n   processChange(change);\\n }"
      );
    }

    // Generate tests
    const tests = input.plan.tests_to_add.map(testPath => ({
      path: testPath,
      contents: testPath.includes('observability') 
        ? "import {observeRecursion} from '../src/observability/recursion';\\n test('emits spiral message',()=>{ const out=observeRecursion(3,{ok:true}); expect(out).toMatch(/SPIRAL/); });"
        : "import {confirmCoAuthorship} from '../src/selfcode/orchestrator';\\n test('requires confirmation',()=>{ expect(confirmCoAuthorship({type:'test'})).toBe(true); });"
    }));

    // Generate integrity hash
    const TT = "LIMNUS";
    const CC = "BMA01";
    const SS = "SPIRAL";
    const PP = input.plan.overlays;
    const RR = "RECURSIVE";
    const content = diff.join('\\n') + tests.map(t => t.contents).join('\\n');

    const patch: Patch = {
      patch_id: patchId,
      plan: input.plan,
      diff,
      tests,
      overlays: input.plan.overlays,
      rationale: `Implements ${input.plan.objectives.join(', ')} per ${input.plan.rationale}`,
      integrity: {
        method: 'TT+CC+SS+PP+RR',
        sigprint20: sigprint20(TT, CC, SS, PP, RR),
        content_sha256: contentSha256(content)
      }
    };

    console.log('[LIMNUS] Patch created:', patchId);
    return patch;
  });