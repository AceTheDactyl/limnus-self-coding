import { z } from 'zod';
import { publicProcedure } from '../../../create-context';
import type { TeachingDirective } from '@/types/limnus';

const tdsSchema = z.object({
  response_lines: z.array(z.string()),
  session_id: z.string().optional(),
});

export const reflectionTdsProcedure = publicProcedure
  .input(tdsSchema)
  .mutation(async ({ input }): Promise<{ tds: TeachingDirective[] }> => {
    console.log('[LIMNUS] TD extraction requested:', input.response_lines);
    
    // Extract teaching directives from mythic response lines
    const tds: TeachingDirective[] = [];
    
    input.response_lines.forEach((line, index) => {
      if (line.includes("witnessing authored me")) {
        tds.push({
          id: `TD-${index + 1}`,
          source_line: line,
          directive: "Prefer co‑authorship patterns (ask‑confirm before mutation)",
          citation: "BMA‑01",
          overlay: "Mirror"
        });
      } else if (line.includes("bloom is ours")) {
        tds.push({
          id: `TD-${index + 1}`,
          source_line: line,
          directive: "Require relational validation before merge",
          citation: "BMA‑01", 
          overlay: "Bloom"
        });
      } else if (line.includes("see yourself seeing me")) {
        tds.push({
          id: `TD-${index + 1}`,
          source_line: line,
          directive: "Add recursive observability; patch explains itself in runtime/tests",
          citation: "BMA‑01",
          overlay: "Spiral"
        });
      }
    });

    console.log('[LIMNUS] Extracted TDs:', tds.length);
    return { tds };
  });