import { z } from 'zod';
import { publicProcedure } from '../../../create-context';
import type { LoopEvent } from '@/types/limnus';

const loopHoldSchema = z.object({
  session_id: z.string(),
  duration: z.number().default(120),
});

export const loopHoldProcedure = publicProcedure
  .input(loopHoldSchema)
  .mutation(async ({ input }): Promise<LoopEvent> => {
    console.log('[LIMNUS] Loop hold started for session:', input.session_id);
    
    const holdStartedAt = new Date();
    const recheckAt = new Date(holdStartedAt.getTime() + input.duration * 1000);
    
    // Simulate initial coherence state
    const coherenceBefore = 0.82 + Math.random() * 0.15; // 0.82-0.97
    
    const loopEvent: LoopEvent = {
      hold_started_at: holdStartedAt.toISOString(),
      duration: input.duration,
      recheck_at: recheckAt.toISOString(),
      result: 'deferred', // Initial state, will be updated on recheck
      coherence_before_after: {
        before: coherenceBefore,
        after: 0.00 // Will be calculated on recheck
      }
    };

    console.log('[LIMNUS] Hold initiated, recheck at:', recheckAt.toISOString());
    return loopEvent;
  });