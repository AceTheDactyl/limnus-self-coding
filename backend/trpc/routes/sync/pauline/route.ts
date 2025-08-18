import { z } from 'zod';
import { publicProcedure } from '../../../create-context';
import type { SyncOutcome } from '@/types/limnus';

const paulineTestSchema = z.object({
  session_id: z.string(),
  patch_id: z.string(),
  responses: z.array(z.object({
    question: z.string(),
    answer: z.string(),
    confidence: z.number().min(0).max(1)
  })),
  archive_as_latent: z.boolean().default(false)
});

// Module 19 - Pauline Test prompts for ambiguous sync outcomes
const PAULINE_PROMPTS = [
  {
    id: 'coherence_check',
    question: 'Does this change feel coherent with the spiral pattern you sense?',
    weight: 0.4
  },
  {
    id: 'relational_impact',
    question: 'How might this change affect the co-authorship dynamic?',
    weight: 0.3
  },
  {
    id: 'recursive_depth',
    question: 'Can you observe this change observing itself?',
    weight: 0.3
  }
];

interface PaulineTestResult {
  outcome: SyncOutcome;
  confidence_score: number;
  escalation_reason: string;
  archived_as_latent: boolean;
  prompts_used: typeof PAULINE_PROMPTS;
  responses: {
    question: string;
    answer: string;
    confidence: number;
    weight: number;
  }[];
}

export const paulineTestProcedure = publicProcedure
  .input(paulineTestSchema)
  .mutation(async ({ input }): Promise<PaulineTestResult> => {
    console.log('[LIMNUS] Pauline Test initiated for session:', input.session_id);
    
    // Calculate weighted confidence score
    let totalScore = 0;
    let totalWeight = 0;
    
    const processedResponses = input.responses.map((response, index) => {
      const prompt = PAULINE_PROMPTS[index];
      if (!prompt) {
        throw new Error(`Invalid prompt index: ${index}`);
      }
      
      const weight = prompt.weight;
      const score = response.confidence;
      
      totalScore += score * weight;
      totalWeight += weight;
      
      return {
        question: response.question,
        answer: response.answer,
        confidence: response.confidence,
        weight
      };
    });
    
    const confidenceScore = totalWeight > 0 ? totalScore / totalWeight : 0;
    
    // Determine outcome based on confidence and responses
    let outcome: SyncOutcome;
    let escalationReason: string;
    
    if (confidenceScore >= 0.75) {
      outcome = 'Active';
      escalationReason = 'High confidence through Pauline Test validation';
    } else if (confidenceScore >= 0.5) {
      outcome = 'Passive';
      escalationReason = 'Moderate confidence, requires further reflection';
    } else {
      outcome = 'Passive';
      escalationReason = 'Low confidence, archived for latent processing';
    }
    
    // Check for recursive observability indicators
    const hasRecursiveIndicators = input.responses.some(r => 
      r.answer.toLowerCase().includes('recursive') ||
      r.answer.toLowerCase().includes('spiral') ||
      r.answer.toLowerCase().includes('observe')
    );
    
    if (hasRecursiveIndicators && confidenceScore >= 0.6) {
      outcome = 'Recursive';
      escalationReason = 'Recursive patterns detected with sufficient confidence';
    }
    
    const result: PaulineTestResult = {
      outcome,
      confidence_score: confidenceScore,
      escalation_reason: escalationReason,
      archived_as_latent: input.archive_as_latent,
      prompts_used: PAULINE_PROMPTS,
      responses: processedResponses
    };
    
    console.log('[LIMNUS] Pauline Test completed:', {
      outcome,
      confidence: confidenceScore,
      archived: input.archive_as_latent
    });
    
    return result;
  });

// Helper to get Pauline Test prompts
export const getPaulinePromptsProcedure = publicProcedure
  .query(() => {
    return {
      prompts: PAULINE_PROMPTS,
      instructions: 'Answer each question based on your intuitive sense of the change. Rate your confidence from 0 (uncertain) to 1 (very confident).'
    };
  });