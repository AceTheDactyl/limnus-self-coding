import { z } from 'zod';
import { publicProcedure } from '../../../create-context';
import { createNonce } from '../integrity';

const generateNonceSchema = z.object({
  deviceId: z.string().optional(),
});

export const generateNonceProcedure = publicProcedure
  .input(generateNonceSchema)
  .mutation(async ({ input }) => {
    console.log('[LIMNUS] Nonce generation requested for device:', input.deviceId || 'unknown');
    
    const { nonce, expiresAt } = createNonce();
    
    console.log('[LIMNUS] Nonce generated, expires at:', new Date(expiresAt).toISOString());
    return {
      nonce,
      expiresAt,
      validFor: 300 // 5 minutes in seconds
    };
  });