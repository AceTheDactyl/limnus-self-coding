import { z } from 'zod';
import { publicProcedure } from '../../../create-context';
import { clearHold } from '../hold/route';
import type { LoopEvent } from '@/types/limnus';

const loopRecheckSchema = z.object({
  session_id: z.string(),
});

export const loopRecheckProcedure = publicProcedure
  .input(loopRecheckSchema)
  .mutation(async ({ input }): Promise<LoopEvent> => {
    console.log('[LIMNUS] Loop recheck for session:', input.session_id);
    
    // Clear the server-side hold timer since recheck is happening
    clearHold(input.session_id);
    
    const now = new Date();
    const coherenceBefore = 0.82 + Math.random() * 0.15; // 0.82-0.97
    
    // More favorable coherence calculation - bias toward improvement
    const baseChange = Math.random() * 0.25 - 0.05; // ±5-20% change
    const improvementBias = Math.random() * 0.08; // 0-8% improvement bias
    const coherenceAfter = Math.min(1.0, coherenceBefore + baseChange + improvementBias);
    
    // Determine result based on coherence delta (more lenient BMA-01 criteria)
    const coherenceDelta = coherenceAfter - coherenceBefore;
    let result: 'merged' | 'deferred' | 'rejected' = 'deferred';
    
    if (coherenceDelta >= 0.05) {
      result = 'merged'; // Moderate improvement (lowered from 8% to 5%)
    } else if (coherenceDelta < -0.15) {
      result = 'rejected'; // Significant decline (lowered from -10% to -15%)
    }
    
    const loopEvent: LoopEvent = {
      hold_started_at: new Date(now.getTime() - 120000).toISOString(), // 2 minutes ago
      duration: 120,
      recheck_at: now.toISOString(),
      result,
      coherence_before_after: {
        before: coherenceBefore,
        after: coherenceAfter
      }
    };

    console.log('[LIMNUS] Recheck completed with result:', result, 'coherence Δ:', coherenceDelta.toFixed(3));
    return loopEvent;
  });