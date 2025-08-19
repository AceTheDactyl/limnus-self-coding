import { z } from 'zod';
import { publicProcedure } from '../../../create-context';
import crypto from 'crypto';
import type { 
  ParadoxInput, 
  ParadoxSynthesis, 
  ParadoxMetrics, 
  EmotionalVector,
  ParadoxResolution,
  ResolutionAttempt,
  ParadoxEngine
} from '../../../../../types/limnus';

// In-memory Paradox Resolution Engine state
let paradoxEngine: ParadoxEngine = {
  active_paradoxes: [],
  resolution_patterns: [],
  synthesis_genealogy: [],
  quantum_coherence: 0.618 // Start with φ-1
};

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
    timestamp: new Date().toISOString(),
    resolution_path: 'sustain', // Default, will be overridden by engine
    quantum_state: 'collapsed' // Default, will be overridden by engine
  };
}

// Enhanced Paradox Resolution Engine
function createParadoxResolution(
  thesis: string, 
  antithesis: string, 
  sessionId?: string
): ParadoxResolution {
  const paradox_id = `paradox_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const tension_score = Math.min(100, (1 - hybridSimilarity(thesis, antithesis)) * 100 + antonymOpposition(thesis, antithesis) * 50);
  
  return {
    paradox_id,
    thesis,
    antithesis,
    tension_score,
    resolution_attempts: [],
    current_state: 'unresolved',
    created_at: new Date().toISOString(),
    last_modified: new Date().toISOString()
  };
}

function createResolutionAttempt(
  strategy: 'dialectical_merge' | 'recursive_loop' | 'transcendent_leap' | 'quantum_superposition',
  synthesis: ParadoxSynthesis,
  sessionId?: string
): ResolutionAttempt {
  return {
    attempt_id: `attempt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    strategy,
    input_context: { sessionId },
    generated_synthesis: synthesis.statement,
    coherence_score: synthesis.metrics.phiGate * 100,
    emotional_resonance: {
      valence: Math.tanh(synthesis.metrics.similarity - 0.5),
      arousal: synthesis.metrics.tension,
      dominance: synthesis.metrics.complexity,
      entropy: synthesis.metrics.emotionalDelta
    },
    success: synthesis.metrics.phiGate > 0.618, // φ-gate threshold
    failure_reason: synthesis.metrics.phiGate <= 0.618 ? 'Below φ-gate threshold' : undefined,
    timestamp: new Date().toISOString()
  };
}

function updateQuantumCoherence(): void {
  if (paradoxEngine.active_paradoxes.length === 0) {
    paradoxEngine.quantum_coherence = 0.618;
    return;
  }
  
  const totalCoherence = paradoxEngine.active_paradoxes.reduce((sum, paradox) => {
    if (paradox.synthesis) {
      return sum + paradox.synthesis.metrics.phiGate;
    }
    const latestAttempt = paradox.resolution_attempts[paradox.resolution_attempts.length - 1];
    return sum + (latestAttempt ? latestAttempt.coherence_score / 100 : 0);
  }, 0);
  
  paradoxEngine.quantum_coherence = totalCoherence / paradoxEngine.active_paradoxes.length;
}

function determineResolutionPath(synthesis: ParadoxSynthesis): 'collapse' | 'transcend' | 'sustain' {
  if (synthesis.metrics.phiGate > 0.8) return 'transcend';
  if (synthesis.metrics.phiGate > 0.618) return 'sustain';
  return 'collapse';
}

function determineQuantumState(strategy: string): 'superposition' | 'entangled' | 'collapsed' {
  if (strategy === 'quantum_superposition') return 'superposition';
  if (strategy === 'recursive_loop') return 'entangled';
  return 'collapsed';
}

// Enhanced tRPC Procedures
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
    console.log('🌀 Paradox Resolution Engine: TSVF synthesis initiated', {
      sessionId: input.sessionId,
      T1: input.thesis.substring(0, 50) + '...',
      T2: input.post?.descriptor?.substring(0, 50) + '...' || input.antithesis.substring(0, 50) + '...',
      hasEmotion: !!input.emotion,
      hasPostSelection: !!input.post,
      activeParadoxes: paradoxEngine.active_paradoxes.length,
      quantumCoherence: paradoxEngine.quantum_coherence.toFixed(3)
    });
    
    try {
      // Generate synthesis using existing TSVF engine
      const synthesis = runParadox(input);
      
      // Enhanced synthesis with resolution metadata
      const enhancedSynthesis: ParadoxSynthesis = {
        ...synthesis,
        resolution_path: determineResolutionPath(synthesis),
        quantum_state: determineQuantumState('transcendent_leap') // Default strategy
      };
      
      // Find or create paradox resolution
      let paradox = paradoxEngine.active_paradoxes.find(
        p => p.thesis === input.thesis && p.antithesis === input.antithesis
      );
      
      if (!paradox) {
        paradox = createParadoxResolution(input.thesis, input.antithesis, input.sessionId);
        paradoxEngine.active_paradoxes.push(paradox);
        console.log(`🆕 New paradox created: ${paradox.paradox_id}`);
      }
      
      // Create resolution attempt
      const attempt = createResolutionAttempt('transcendent_leap', enhancedSynthesis, input.sessionId);
      paradox.resolution_attempts.push(attempt);
      paradox.last_modified = new Date().toISOString();
      
      // Update paradox state based on synthesis quality
      if (attempt.success) {
        paradox.synthesis = enhancedSynthesis;
        paradox.current_state = enhancedSynthesis.resolution_path === 'transcend' ? 'transcended' : 'synthesized';
        
        // Track synthesis genealogy
        const genealogyEntry = {
          parent_synthesis: paradox.paradox_id,
          child_syntheses: [],
          mutation_type: enhancedSynthesis.type === 'transcendent' ? 'transcendence' as const : 'evolution' as const
        };
        paradoxEngine.synthesis_genealogy.push(genealogyEntry);
        
        console.log(`✨ Paradox resolved: ${paradox.current_state} via ${enhancedSynthesis.resolution_path}`);
      } else {
        paradox.current_state = 'resolving';
        console.log(`🔄 Paradox resolution attempt failed, continuing to resolve...`);
      }
      
      // Update quantum coherence
      updateQuantumCoherence();
      
      console.log('🌌 Paradox synthesis complete', {
        paradoxId: paradox.paradox_id,
        type: enhancedSynthesis.type,
        phiGate: enhancedSynthesis.metrics.phiGate.toFixed(3),
        twoStateSupport: enhancedSynthesis.metrics.twoStateSupport?.toFixed(3),
        overlay: enhancedSynthesis.overlay.join(''),
        resolutionPath: enhancedSynthesis.resolution_path,
        quantumState: enhancedSynthesis.quantum_state,
        systemCoherence: paradoxEngine.quantum_coherence.toFixed(3),
        hash: enhancedSynthesis.contentHash.substring(0, 8)
      });
      
      return {
        synthesis: enhancedSynthesis,
        paradox_id: paradox.paradox_id,
        resolution_state: paradox.current_state,
        engine_stats: {
          active_paradoxes: paradoxEngine.active_paradoxes.length,
          quantum_coherence: paradoxEngine.quantum_coherence,
          resolved_count: paradoxEngine.active_paradoxes.filter(p => p.synthesis).length,
          transcended_count: paradoxEngine.active_paradoxes.filter(p => p.current_state === 'transcended').length
        }
      };
    } catch (error) {
      console.error('💥 Paradox synthesis failed:', error);
      throw new Error('Paradox synthesis failed: ' + (error as Error).message);
    }
  });

// Get Paradox Engine State
export const getParadoxEngineProcedure = publicProcedure
  .query(async () => {
    const stats = {
      total_paradoxes: paradoxEngine.active_paradoxes.length,
      unresolved: paradoxEngine.active_paradoxes.filter(p => p.current_state === 'unresolved').length,
      resolving: paradoxEngine.active_paradoxes.filter(p => p.current_state === 'resolving').length,
      synthesized: paradoxEngine.active_paradoxes.filter(p => p.current_state === 'synthesized').length,
      transcended: paradoxEngine.active_paradoxes.filter(p => p.current_state === 'transcended').length,
      quantum_coherence: paradoxEngine.quantum_coherence,
      average_tension: paradoxEngine.active_paradoxes.length > 0 ?
        paradoxEngine.active_paradoxes.reduce((sum, p) => sum + p.tension_score, 0) / paradoxEngine.active_paradoxes.length : 0,
      synthesis_genealogy_depth: paradoxEngine.synthesis_genealogy.length
    };
    
    return {
      engine: paradoxEngine,
      stats,
      recent_paradoxes: paradoxEngine.active_paradoxes
        .sort((a, b) => new Date(b.last_modified).getTime() - new Date(a.last_modified).getTime())
        .slice(0, 5)
    };
  });

// Resolve Multiple Paradoxes (Batch Processing)
export const resolveParadoxBatchProcedure = publicProcedure
  .input(z.object({
    paradox_ids: z.array(z.string()),
    strategy: z.enum(['dialectical_merge', 'recursive_loop', 'transcendent_leap', 'quantum_superposition']).optional(),
    session_id: z.string().optional()
  }))
  .mutation(async ({ input }) => {
    const { paradox_ids, strategy = 'transcendent_leap', session_id } = input;
    const results = [];
    
    console.log(`🔄 Batch resolving ${paradox_ids.length} paradoxes with strategy: ${strategy}`);
    
    for (const paradox_id of paradox_ids) {
      const paradox = paradoxEngine.active_paradoxes.find(p => p.paradox_id === paradox_id);
      if (!paradox || paradox.synthesis) {
        results.push({ paradox_id, status: 'skipped', reason: paradox ? 'already resolved' : 'not found' });
        continue;
      }
      
      try {
        // Create paradox input for existing engine
        const paradoxInput: ParadoxInput = {
          sessionId: session_id || 'batch_resolution',
          thesis: paradox.thesis,
          antithesis: paradox.antithesis
        };
        
        const synthesis = runParadox(paradoxInput);
        const enhancedSynthesis: ParadoxSynthesis = {
          ...synthesis,
          resolution_path: determineResolutionPath(synthesis),
          quantum_state: determineQuantumState(strategy)
        };
        
        const attempt = createResolutionAttempt(strategy, enhancedSynthesis, session_id);
        paradox.resolution_attempts.push(attempt);
        paradox.last_modified = new Date().toISOString();
        
        if (attempt.success) {
          paradox.synthesis = enhancedSynthesis;
          paradox.current_state = enhancedSynthesis.resolution_path === 'transcend' ? 'transcended' : 'synthesized';
          results.push({ paradox_id, status: 'resolved', synthesis: enhancedSynthesis });
        } else {
          paradox.current_state = 'resolving';
          results.push({ paradox_id, status: 'attempted', coherence: attempt.coherence_score });
        }
      } catch (error) {
        results.push({ paradox_id, status: 'failed', error: (error as Error).message });
      }
    }
    
    updateQuantumCoherence();
    
    console.log(`✨ Batch resolution complete: ${results.filter(r => r.status === 'resolved').length} resolved, quantum coherence: ${paradoxEngine.quantum_coherence.toFixed(3)}`);
    
    return {
      results,
      new_quantum_coherence: paradoxEngine.quantum_coherence,
      engine_stats: {
        total_paradoxes: paradoxEngine.active_paradoxes.length,
        resolved_count: paradoxEngine.active_paradoxes.filter(p => p.synthesis).length
      }
    };
  });

// Clear Resolved Paradoxes
export const clearResolvedParadoxesProcedure = publicProcedure
  .mutation(async () => {
    const beforeCount = paradoxEngine.active_paradoxes.length;
    const resolvedParadoxes = paradoxEngine.active_paradoxes.filter(
      p => p.current_state === 'synthesized' || p.current_state === 'transcended'
    );
    
    // Archive resolved paradoxes in genealogy before clearing
    for (const paradox of resolvedParadoxes) {
      if (paradox.synthesis) {
        const existingEntry = paradoxEngine.synthesis_genealogy.find(
          g => g.parent_synthesis === paradox.paradox_id
        );
        if (!existingEntry) {
          paradoxEngine.synthesis_genealogy.push({
            parent_synthesis: paradox.paradox_id,
            child_syntheses: [],
            mutation_type: paradox.synthesis.type === 'transcendent' ? 'transcendence' : 'evolution'
          });
        }
      }
    }
    
    // Keep only unresolved and resolving paradoxes
    paradoxEngine.active_paradoxes = paradoxEngine.active_paradoxes.filter(
      p => p.current_state === 'unresolved' || p.current_state === 'resolving'
    );
    
    const afterCount = paradoxEngine.active_paradoxes.length;
    updateQuantumCoherence();
    
    console.log(`🧹 Cleared ${beforeCount - afterCount} resolved paradoxes. ${afterCount} remain active. Genealogy entries: ${paradoxEngine.synthesis_genealogy.length}`);
    
    return {
      cleared_count: beforeCount - afterCount,
      remaining_count: afterCount,
      archived_to_genealogy: resolvedParadoxes.length,
      new_quantum_coherence: paradoxEngine.quantum_coherence,
      genealogy_depth: paradoxEngine.synthesis_genealogy.length
    };
  });