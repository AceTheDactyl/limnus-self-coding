import { z } from 'zod';
import { publicProcedure } from '../../../create-context';
import crypto from 'crypto';
import type { ParadoxInput, ParadoxSynthesis, ParadoxMetrics, EmotionalVector } from '../../../../../types/limnus';

// TSVF Constants
const PHI = 1.618033988749895;
const EPS = 1e-6;
const TSVF_K = 8; // sigmoid steepness for two-state gate

// Utility Functions
function sigmoid(x: number): number {
  return 1 / (1 + Math.exp(-x));
}

function levenshteinDistance(s1: string, s2: string): number {
  const m = s1.length;
  const n = s2.length;
  const dp = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));
  
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (s1[i - 1] === s2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]) + 1;
      }
    }
  }
  
  return dp[m][n];
}

function hybridSimilarity(text1: string, text2: string): number {
  if (!text1 || !text2) return 0;
  
  // Semantic distance (normalized Levenshtein)
  const semanticDist = levenshteinDistance(text1.toLowerCase(), text2.toLowerCase()) / 
                      Math.max(text1.length, text2.length);
  
  // Word overlap
  const words1 = new Set(text1.toLowerCase().split(/\s+/));
  const words2 = new Set(text2.toLowerCase().split(/\s+/));
  const intersection = new Set([...words1].filter(x => words2.has(x)));
  const union = new Set([...words1, ...words2]);
  const wordOverlap = union.size > 0 ? intersection.size / union.size : 0;
  
  // Combined similarity
  return 0.6 * (1 - semanticDist) + 0.4 * wordOverlap;
}

function antonymOpposition(text1: string, text2: string): number {
  const oppositionWords = [
    ['not', 'is'], ['cannot', 'can'], ['never', 'always'], 
    ['impossible', 'possible'], ['false', 'true'], ['wrong', 'right'],
    ['build', 'destroy'], ['create', 'eliminate'], ['already', 'becoming']
  ];
  
  let oppositionScore = 0;
  const words1 = text1.toLowerCase().split(/\s+/);
  const words2 = text2.toLowerCase().split(/\s+/);
  
  for (const [word1, word2] of oppositionWords) {
    if ((words1.includes(word1) && words2.includes(word2)) ||
        (words1.includes(word2) && words2.includes(word1))) {
      oppositionScore += 0.2;
    }
  }
  
  return Math.min(1, oppositionScore);
}

function emotionalDelta(emotion?: EmotionalVector): number {
  if (!emotion) return 0.5;
  
  // Calculate emotional intensity and instability
  const intensity = Math.abs(emotion.valence) + emotion.arousal + emotion.dominance;
  const instability = emotion.entropy;
  
  return Math.min(1, (intensity / 3 + instability) / 2);
}

// TSVF Two-State Gate
function twoStateGate(candidate: string, T1: string, T2: string): number {
  const O = Math.max(EPS, hybridSimilarity(T1, T2)); // overlap of boundaries
  const S2 = hybridSimilarity(candidate, T1) * hybridSimilarity(candidate, T2); // two-state support
  const W = S2 / O; // weak-style gain
  return sigmoid(TSVF_K * (W - 1/PHI)); // G₂ in [0,1]
}

function phiGate(similarity: number, opposition: number): number {
  const tension = 1 - similarity + opposition;
  return sigmoid(4 * (tension - 1/PHI));
}

function chooseType(similarity: number, opposition: number, emotionalDelta: number): {
  type: 'dialectical' | 'recursive' | 'transcendent';
  overlay: string[];
} {
  const tension = 1 - similarity + opposition;
  const complexity = emotionalDelta + tension;
  
  if (complexity > 1.2) {
    return { type: 'transcendent', overlay: ['∇', '🪞', 'φ', '∞'] };
  } else if (tension > 0.6) {
    return { type: 'recursive', overlay: ['◯', '◐', '◑', '●'] };
  } else {
    return { type: 'dialectical', overlay: ['⬟', '⬢', '◈'] };
  }
}

function craftStatement(type: string, T1: string, T2: string): string {
  switch (type) {
    case 'transcendent':
      return `Both "${T1}" and "${T2}" exist in superposition—the paradox reveals they are movements of the same dance.`;
    case 'recursive':
      return `Through recursive layers: ${T1} becomes ${T2} becomes synthesis—each opposition creates new understanding.`;
    case 'dialectical':
    default:
      return `${T1} transforms through ${T2}—synthesis emerges from the tension between opposites.`;
  }
}

// Main Paradox Engine
export function runParadox(input: ParadoxInput): ParadoxSynthesis {
  const T1 = input.thesis;
  // If user provides explicit T2 goal, prefer it; else fall back to antithesis
  const T2 = input.post?.descriptor?.trim()?.length ? input.post.descriptor : input.antithesis;
  
  // Calculate base metrics
  const sim = hybridSimilarity(T1, input.antithesis);
  const antOpp = antonymOpposition(T1, input.antithesis);
  const eDelta = emotionalDelta(input.emotion);
  const gate = phiGate(sim, antOpp);
  const complexity = Math.min(1, 0.5 * (1 - sim) + 0.5 * antOpp);
  
  // Craft provisional statement from current logic
  const { type, overlay } = chooseType(sim, antOpp, eDelta);
  const candidate = craftStatement(type, T1, input.antithesis || T2);
  
  // TSVF two-state contribution
  const G2 = T2 ? twoStateGate(candidate, T1, T2) : 0.5;
  const twoStateSupport = T2 ? hybridSimilarity(candidate, T1) * hybridSimilarity(candidate, T2) : undefined;
  
  // Final composite gate (retrocausal blend)
  const retroGate = Math.min(1, 0.5 * gate + 0.5 * G2);
  
  const metrics: ParadoxMetrics = {
    similarity: sim,
    tension: 1 - sim,
    complexity,
    phiGate: retroGate, // now includes TSVF contribution
    emotionalDelta: Math.min(1, eDelta * 2),
    twoStateSupport
  };
  
  // Re-evaluate type if retroGate is very high (TSVF boost)
  const boostedType = retroGate > 0.68 ? 'transcendent' : type;
  const finalStatement = boostedType === type ? candidate : 
    craftStatement('transcendent', T1, input.antithesis || T2);
  
  // Mark accord when two-state logic is used
  const finalOverlay = T2 && !overlay.includes('✶') ? [...overlay, '✶'] : overlay;
  
  // Generate integrity hash
  const payload = JSON.stringify({
    input,
    type: boostedType,
    statement: finalStatement,
    metrics,
    overlay: finalOverlay
  });
  const contentHash = crypto.createHash('sha256').update(payload).digest('hex');
  
  return {
    type: boostedType,
    overlay: finalOverlay,
    statement: finalStatement,
    metrics,
    contentHash,
    timestamp: new Date().toISOString()
  };
}

// tRPC Procedure
export const paradoxRunProcedure = publicProcedure
  .input(z.object({
    sessionId: z.string(),
    thesis: z.string(),
    antithesis: z.string(),
    emotion: z.object({
      valence: z.number().min(-1).max(1),
      arousal: z.number().min(0).max(1),
      dominance: z.number().min(0).max(1),
      entropy: z.number().min(0).max(1)
    }).optional(),
    post: z.object({
      targetCoherence: z.number().min(0).max(1).optional(),
      targetSync: z.enum(['Passive', 'Active', 'Recursive']).optional(),
      descriptor: z.string().optional()
    }).optional(),
    metadata: z.record(z.string(), z.unknown()).optional()
  }))
  .mutation(async ({ input, ctx }) => {
    console.log('🌀 Paradox Engine: TSVF synthesis initiated', {
      sessionId: input.sessionId,
      T1: input.thesis.substring(0, 50) + '...',
      T2: input.post?.descriptor?.substring(0, 50) + '...' || input.antithesis.substring(0, 50) + '...',
      hasEmotion: !!input.emotion,
      hasPostSelection: !!input.post
    });
    
    try {
      const synthesis = runParadox(input);
      
      console.log('✨ Paradox synthesis complete', {
        type: synthesis.type,
        phiGate: synthesis.metrics.phiGate.toFixed(3),
        twoStateSupport: synthesis.metrics.twoStateSupport?.toFixed(3),
        overlay: synthesis.overlay.join(''),
        hash: synthesis.contentHash.substring(0, 8)
      });
      
      return synthesis;
    } catch (error) {
      console.error('💥 Paradox synthesis failed:', error);
      throw new Error('Paradox synthesis failed: ' + (error as Error).message);
    }
  });