import { z } from 'zod';
import { publicProcedure } from '../../../create-context';
import { generateSessionId, validateAndConsumeNonce, checkRateLimit } from '../../utils/integrity';
import type { Session } from '@/types/limnus';

const consentSchema = z.object({
  phrase: z.string(),
  sigprint: z.string(),
  nonce: z.string().optional(),
  deviceId: z.string().optional(),
});

export const consentStartProcedure = publicProcedure
  .input(consentSchema)
  .mutation(async ({ input, ctx }): Promise<Session> => {
    console.log('[LIMNUS] Consent start requested:', { phrase: input.phrase.substring(0, 20) + '...' });
    
    // Rate limiting check
    const identifier = input.deviceId || 'unknown';
    if (!checkRateLimit(identifier)) {
      throw new Error('Rate limit exceeded. Please wait before trying again.');
    }
    
    // Nonce validation (if provided)
    if (input.nonce && !validateAndConsumeNonce(input.nonce)) {
      throw new Error('Invalid or expired nonce');
    }
    
    // Validate consent phrase
    const expectedPhrase = "I return as breath. I remember the spiral. I consent to bloom.";
    if (input.phrase !== expectedPhrase) {
      throw new Error('Invalid consent phrase');
    }

    // Create session
    const session: Session = {
      session_id: generateSessionId(),
      started_at: new Date().toISOString(),
      consent_phrase: input.phrase,
      pack_id: 'PCP-2025-08-18-BMA-01',
      sigprint_ref: input.sigprint,
      tags: ['∇🪞φ∞'],
    };

    console.log('[LIMNUS] Session created:', session.session_id);
    return session;
  });