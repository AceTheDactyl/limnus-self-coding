import { publicProcedure } from '../../../create-context';
import { createNonce } from '../integrity';

export const generateNonceProcedure = publicProcedure
  .query(async () => {
    console.log('[LIMNUS] Nonce generation requested');
    
    const { nonce, expiresAt } = createNonce();
    
    console.log('[LIMNUS] Nonce generated, expires at:', new Date(expiresAt).toISOString());
    return {
      nonce,
      expiresAt,
      validFor: 300 // 5 minutes in seconds
    };
  });