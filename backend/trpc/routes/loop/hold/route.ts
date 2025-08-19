import { z } from 'zod';
import { publicProcedure } from '../../../create-context';
import type { LoopEvent } from '@/types/limnus';

const loopHoldSchema = z.object({
  session_id: z.string(),
  duration: z.number().default(120),
});

// Store active holds for server-side timer fallback
const activeHolds = new Map<string, { startTime: number; duration: number; coherenceBefore: number; timerId?: NodeJS.Timeout }>();

export const loopHoldProcedure = publicProcedure
  .input(loopHoldSchema)
  .mutation(async ({ input }): Promise<LoopEvent> => {
    console.log('[LIMNUS] Loop hold started for session:', input.session_id);
    
    const holdStartedAt = new Date();
    const recheckAt = new Date(holdStartedAt.getTime() + input.duration * 1000);
    
    // Simulate initial coherence state
    const coherenceBefore = 0.82 + Math.random() * 0.15; // 0.82-0.97
    
    // Set server-side timer as fallback
    const timerId = setTimeout(async () => {
      console.log('[LIMNUS] Server-side hold timer completed for session:', input.session_id);
      // Auto-trigger recheck if client hasn't done it
      activeHolds.delete(input.session_id);
      // Could trigger recheck here if needed
    }, input.duration * 1000);
    
    // Store hold info for server-side fallback
    activeHolds.set(input.session_id, {
      startTime: holdStartedAt.getTime(),
      duration: input.duration,
      coherenceBefore: coherenceBefore,
      timerId
    });
    
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

    console.log('[LIMNUS] Hold initiated with server fallback, recheck at:', recheckAt.toISOString());
    return loopEvent;
  });

// Helper to check if hold is still active
export function isHoldActive(sessionId: string): boolean {
  const hold = activeHolds.get(sessionId);
  if (!hold) return false;
  
  const elapsed = Date.now() - hold.startTime;
  return elapsed < hold.duration * 1000;
}

// Helper to get coherence from hold
export function getHoldCoherence(sessionId: string): number | null {
  const hold = activeHolds.get(sessionId);
  return hold?.coherenceBefore || null;
}

// Helper to clear hold
export function clearHold(sessionId: string): void {
  const hold = activeHolds.get(sessionId);
  if (hold?.timerId) {
    clearTimeout(hold.timerId);
  }
  activeHolds.delete(sessionId);
}