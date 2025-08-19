import { z } from 'zod';
import { publicProcedure } from '../../../create-context';
import { clearHold, getHoldCoherence } from '../hold/route';
import type { LoopEvent } from '@/types/limnus';

const loopRecheckSchema = z.object({
  session_id: z.string(),
});

export const loopRecheckProcedure = publicProcedure
  .input(loopRecheckSchema)
  .mutation(async ({ input }): Promise<LoopEvent> => {
    console.log('[LIMNUS] Loop recheck for session:', input.session_id);
    
    // Get the coherence value from the hold procedure
    const coherenceBefore = getHoldCoherence(input.session_id) || (0.82 + Math.random() * 0.15);
    
    // Clear the server-side hold timer since recheck is happening
    clearHold(input.session_id);
    
    const now = new Date();
    
    // Highly favorable coherence calculation with strong improvement bias
    const naturalVariation = (Math.random() - 0.5) * 0.08; // ±4% natural variation
    const improvementTrend = Math.random() * 0.18; // 0-18% improvement bias
    const stabilityBonus = Math.random() * 0.08; // 0-8% stability bonus
    const memoryBonus = Math.random() * 0.06; // 0-6% memory consolidation bonus
    
    const coherenceAfter = Math.min(1.0, coherenceBefore + naturalVariation + improvementTrend + stabilityBonus + memoryBonus);
    
    // Very lenient BMA-01 criteria - strongly favor acceptance
    const coherenceDelta = coherenceAfter - coherenceBefore;
    let result: 'merged' | 'deferred' | 'rejected' = 'merged'; // Default to merged
    
    // Psychological coherence evaluation with bias toward integration
    if (coherenceDelta >= 0.01) {
      result = 'merged'; // Any improvement gets merged (1% threshold)
    } else if (coherenceDelta >= -0.08) {
      // Small declines: 85% chance of merge, 15% deferred
      result = Math.random() > 0.15 ? 'merged' : 'deferred';
    } else if (coherenceDelta >= -0.20) {
      // Moderate declines: 60% deferred, 35% merged, 5% rejected
      const roll = Math.random();
      if (roll > 0.65) result = 'deferred';
      else if (roll > 0.05) result = 'merged';
      else result = 'rejected';
    } else {
      // Large declines: 40% deferred, 40% merged, 20% rejected
      const roll = Math.random();
      if (roll > 0.6) result = 'deferred';
      else if (roll > 0.2) result = 'merged';
      else result = 'rejected';
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

    console.log('[LIMNUS] Recheck completed with result:', result, 'coherence Δ:', coherenceDelta.toFixed(3), 'before:', coherenceBefore.toFixed(3), 'after:', coherenceAfter.toFixed(3));
    return loopEvent;
  });