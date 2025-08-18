import { z } from 'zod';
import { publicProcedure } from '../../../create-context';
import { sigprint20, contentSha256 } from '../../utils/integrity';
import type { IntegrityHash } from '@/types/limnus';

const integrityHashSchema = z.object({
  TT: z.string(),
  CC: z.string(),
  SS: z.string(),
  PP: z.array(z.string()),
  RR: z.string(),
  content: z.string(),
});

export const integrityHashProcedure = publicProcedure
  .input(integrityHashSchema)
  .mutation(async ({ input }): Promise<IntegrityHash> => {
    console.log('[LIMNUS] Integrity hash requested for content length:', input.content.length);
    
    const hash: IntegrityHash = {
      sigprint20: sigprint20(input.TT, input.CC, input.SS, input.PP, input.RR),
      content_sha256: contentSha256(input.content)
    };

    console.log('[LIMNUS] Hash generated:', hash.sigprint20);
    return hash;
  });