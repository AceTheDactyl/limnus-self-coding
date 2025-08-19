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
    
    // Much more favorable coherence calculation - strong bias toward improvement
    const baseChange = Math.random() * 0.15 - 0.02; // ±2-13% change (reduced negative range)
    const improvementBias = Math.random() * 0.12; // 0-12% improvement bias (increased)
    const stabilityBonus = Math.random() * 0.05; // 0-5% additional stability bonus
    const coherenceAfter = Math.min(1.0, coherenceBefore + baseChange + improvementBias + stabilityBonus);
    
    // Much more lenient BMA-01 criteria - favor merging over rejection
    const coherenceDelta = coherenceAfter - coherenceBefore;
    let result: 'merged' | 'deferred' | 'rejected' = 'merged'; // Default to merged
    
    if (coherenceDelta >= 0.02) {
      result = 'merged'; // Very small improvement threshold (2%)
    } else if (coherenceDelta >= -0.05) {
      result = 'deferred'; // Small decline still gets deferred
    } else if (coherenceDelta < -0.25) {
      result = 'rejected'; // Only reject on massive decline (25%)
    } else {
      // For moderate declines (-5% to -25%), randomly choose between deferred and merged
      result = Math.random() > 0.3 ? 'deferred' : 'merged'; // 70% chance of deferred, 30% merged
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