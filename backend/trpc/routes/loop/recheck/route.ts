import { z } from 'zod';
import { publicProcedure } from '../../../create-context';
import type { LoopEvent } from '@/types/limnus';

const loopRecheckSchema = z.object({
  session_id: z.string(),
});

export const loopRecheckProcedure = publicProcedure
  .input(loopRecheckSchema)
  .mutation(async ({ input }): Promise<LoopEvent> => {
    console.log('[LIMNUS] Loop recheck for session:', input.session_id);
    
    const now = new Date();
    const coherenceBefore = 0.82 + Math.random() * 0.15; // 0.82-0.97
    const coherenceAfter = coherenceBefore + (Math.random() * 0.2 - 0.05); // ±5-15% change
    
    // Determine result based on coherence delta
    const coherenceDelta = coherenceAfter - coherenceBefore;
    let result: 'merged' | 'deferred' | 'rejected' = 'deferred';
    
    if (coherenceDelta >= 0.08) {
      result = 'merged';
    } else if (coherenceDelta < -0.1) {
      result = 'rejected';
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

    console.log('[LIMNUS] Recheck completed with result:', result, 'delta:', coherenceDelta.toFixed(3));
    return loopEvent;
  });