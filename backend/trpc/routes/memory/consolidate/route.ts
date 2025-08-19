import { z } from 'zod';
import { publicProcedure } from '../../../create-context';
import type { 
  ConstellationMap, 
  SymbolNode, 
  MemoryPattern,
  EmotionalVector,
  MemoryEvolutionEvent
} from '@/types/limnus';
import crypto from 'crypto';

const PHI = 1.618033988749;
const PHI_MINUS_1 = PHI - 1; // ≈0.618

interface ParadoxMemory {
  paradox_hash: string;
  thesis: string;
  antithesis: string;
  synthesis?: string;
  resolution_path: 'collapse' | 'transcend' | 'sustain';
  coherence_delta: number;
  final_coherence: number;
  timestamp: number;
  context_embeddings?: number[];
  child_paradoxes: string[];
  synthesis_symbol?: string;
  session_id: string;
  emotional_signature: EmotionalVector;
}

interface ParadoxGenealogy {
  paradox_type: string;
  baseline_coherence: number;
  resolution_count: number;
  transcendence_rate: number;
  symbol_lineage: string[];
  evolution_path: string[];
}

// In-memory storage for the constellation (in production, use a vector database)
let globalConstellation: ConstellationMap = {
  nodes: [],
  connections: [],
  clusters: []
};

let memoryPatterns: MemoryPattern[] = [];
let evolutionHistory: MemoryEvolutionEvent[] = [];

// Paradox-specific memory stores
let paradoxMemories: Map<string, ParadoxMemory> = new Map();
let paradoxGenealogies: Map<string, ParadoxGenealogy> = new Map();
let coherenceBaselines: Map<string, number> = new Map();

function calculateEmotionalDistance(a: EmotionalVector, b: EmotionalVector): number {
  return Math.sqrt(
    Math.pow(a.valence - b.valence, 2) +
    Math.pow(a.arousal - b.arousal, 2) +
    Math.pow(a.dominance - b.dominance, 2) +
    Math.pow(a.entropy - b.entropy, 2)
  );
}

function generateParadoxHash(thesis: string, antithesis: string): string {
  const content = `${thesis}|||${antithesis}`;
  return crypto.createHash('sha256').update(content).digest('hex').substring(0, 16);
}

function calculateTextSimilarity(text1: string, text2: string): number {
  // Simple word-based similarity (in production, use proper embeddings)
  const words1 = new Set(text1.toLowerCase().split(/\W+/));
  const words2 = new Set(text2.toLowerCase().split(/\W+/));
  
  const intersection = new Set([...words1].filter(x => words2.has(x)));
  const union = new Set([...words1, ...words2]);
  
  return intersection.size / union.size;
}

function findSimilarParadoxes(thesis: string, antithesis: string, threshold = 0.3): ParadoxMemory[] {
  const similar: ParadoxMemory[] = [];
  
  for (const memory of paradoxMemories.values()) {
    const thesisSim = calculateTextSimilarity(thesis, memory.thesis);
    const antithesisSim = calculateTextSimilarity(antithesis, memory.antithesis);
    const avgSim = (thesisSim + antithesisSim) / 2;
    
    if (avgSim >= threshold) {
      similar.push(memory);
    }
  }
  
  return similar.sort((a, b) => b.final_coherence - a.final_coherence);
}

function getParadoxType(thesis: string, antithesis: string): string {
  const thesisKey = thesis.toLowerCase().split(' ').slice(0, 2).join('_');
  const antithesisKey = antithesis.toLowerCase().split(' ').slice(0, 2).join('_');
  return `${thesisKey}_vs_${antithesisKey}`;
}

function consolidateParadoxMemory(paradoxData: {
  thesis: string;
  antithesis: string;
  synthesis?: string;
  resolution_path: 'collapse' | 'transcend' | 'sustain';
  coherence_delta: number;
  final_coherence: number;
  synthesis_symbol?: string;
  session_id: string;
  emotional_context: EmotionalVector;
}): { paradox_hash: string; similar_count: number; baseline_updated: boolean } {
  const paradox_hash = generateParadoxHash(paradoxData.thesis, paradoxData.antithesis);
  const paradox_type = getParadoxType(paradoxData.thesis, paradoxData.antithesis);
  
  // Find similar paradoxes for genealogy
  const similar = findSimilarParadoxes(paradoxData.thesis, paradoxData.antithesis);
  const child_paradoxes: string[] = [];
  
  // Create memory entry
  const memory: ParadoxMemory = {
    paradox_hash,
    thesis: paradoxData.thesis,
    antithesis: paradoxData.antithesis,
    synthesis: paradoxData.synthesis,
    resolution_path: paradoxData.resolution_path,
    coherence_delta: paradoxData.coherence_delta,
    final_coherence: paradoxData.final_coherence,
    timestamp: Date.now(),
    child_paradoxes,
    synthesis_symbol: paradoxData.synthesis_symbol,
    session_id: paradoxData.session_id,
    emotional_signature: paradoxData.emotional_context
  };
  
  // Store the memory
  paradoxMemories.set(paradox_hash, memory);
  
  // Update coherence baseline for this type of paradox
  const current_baseline = coherenceBaselines.get(paradox_type) || PHI_MINUS_1;
  let baseline_updated = false;
  
  if (paradoxData.final_coherence > current_baseline) {
    coherenceBaselines.set(paradox_type, paradoxData.final_coherence);
    baseline_updated = true;
  }
  
  // Update or create genealogy
  let genealogy = paradoxGenealogies.get(paradox_type);
  if (!genealogy) {
    genealogy = {
      paradox_type,
      baseline_coherence: paradoxData.final_coherence,
      resolution_count: 1,
      transcendence_rate: paradoxData.resolution_path === 'transcend' ? 1 : 0,
      symbol_lineage: paradoxData.synthesis_symbol ? [paradoxData.synthesis_symbol] : [],
      evolution_path: [`Initial: ${paradoxData.resolution_path} (φ=${paradoxData.final_coherence.toFixed(4)})`]
    };
  } else {
    genealogy.resolution_count += 1;
    if (paradoxData.resolution_path === 'transcend') {
      genealogy.transcendence_rate = (genealogy.transcendence_rate * (genealogy.resolution_count - 1) + 1) / genealogy.resolution_count;
    } else {
      genealogy.transcendence_rate = (genealogy.transcendence_rate * (genealogy.resolution_count - 1)) / genealogy.resolution_count;
    }
    
    if (baseline_updated) {
      genealogy.baseline_coherence = paradoxData.final_coherence;
    }
    
    if (paradoxData.synthesis_symbol && !genealogy.symbol_lineage.includes(paradoxData.synthesis_symbol)) {
      genealogy.symbol_lineage.push(paradoxData.synthesis_symbol);
    }
    
    genealogy.evolution_path.push(
      `${genealogy.resolution_count}: ${paradoxData.resolution_path} (φ=${paradoxData.final_coherence.toFixed(4)})`
    );
  }
  
  paradoxGenealogies.set(paradox_type, genealogy);
  
  // Record evolution event
  evolutionHistory.push({
    event_type: 'paradox_resolution',
    timestamp: new Date().toISOString(),
    source_session: paradoxData.session_id,
    details: {
      paradox_hash,
      paradox_type,
      resolution_path: paradoxData.resolution_path,
      coherence_delta: paradoxData.coherence_delta,
      baseline_updated
    },
    emotional_context: paradoxData.emotional_context
  });
  
  console.log(`🧠 Paradox memory consolidated: ${paradox_hash}`);
  console.log(`🌀 Type: ${paradox_type}, Resolution: ${paradoxData.resolution_path}`);
  console.log(`φ Final coherence: ${paradoxData.final_coherence.toFixed(4)}`);
  if (baseline_updated) {
    console.log(`⚡ New baseline established for ${paradox_type}!`);
  }
  
  return {
    paradox_hash,
    similar_count: similar.length,
    baseline_updated
  };
}

// Helper function to extract symbols from text (for future use)
// function extractSymbolsFromText(text: string): string[] {
//   const symbolRegex = /[∇🪞φ∞⚡🌀🔮✨💫🌙⭐🌟💎🔥❄️🌊🌱🦋🕸️⚖️🎭🗝️🔓🔒]/g;
//   const matches = text.match(symbolRegex) || [];
//   return [...new Set(matches)];
// }

function generateSymbolId(symbol: string, context: string): string {
  const contextHash = context.slice(0, 8);
  return `${symbol}_${contextHash}_${Date.now()}`;
}

function consolidateSessionMemories(memories: any[]): ConstellationMap {
  console.log('[MEMORY] Consolidating', memories.length, 'session memories');
  
  const newNodes: SymbolNode[] = [];
  const newConnections: any[] = [];
  
  for (const memory of memories) {
    // Process symbol births
    for (const symbolBirth of memory.symbol_births || []) {
      const existingNode = globalConstellation.nodes.find(n => n.symbol === symbolBirth);
      
      if (existingNode) {
        // Update existing symbol
        existingNode.usage_count += 1;
        existingNode.last_used = new Date().toISOString();
        existingNode.coherence_contributions.push(...(memory.coherence_peaks?.map((p: any) => p.value) || []));
      } else {
        // Create new symbol node
        const newNode: SymbolNode = {
          id: generateSymbolId(symbolBirth, memory.session_id),
          symbol: symbolBirth,
          first_seen: new Date().toISOString(),
          last_used: new Date().toISOString(),
          usage_count: 1,
          emotional_resonance: memory.emotional_journey?.[0] || {
            valence: 0,
            arousal: 0.5,
            dominance: 0.5,
            entropy: 0.3
          },
          parent_symbols: [],
          child_symbols: [],
          context_fragments: memory.teaching_directive_themes?.slice(0, 3) || [],
          coherence_contributions: memory.coherence_peaks?.map((p: any) => p.value) || []
        };
        
        newNodes.push(newNode);
        globalConstellation.nodes.push(newNode);
        
        // Record evolution event
        evolutionHistory.push({
          event_type: 'symbol_birth',
          timestamp: new Date().toISOString(),
          source_session: memory.session_id,
          details: { symbol: symbolBirth, context: memory.teaching_directive_themes },
          emotional_context: newNode.emotional_resonance
        });
      }
    }
    
    // Detect symbol relationships and create connections
    const sessionSymbols = memory.symbol_births || [];
    for (let i = 0; i < sessionSymbols.length; i++) {
      for (let j = i + 1; j < sessionSymbols.length; j++) {
        const symbolA = sessionSymbols[i];
        const symbolB = sessionSymbols[j];
        
        const nodeA = globalConstellation.nodes.find(n => n.symbol === symbolA);
        const nodeB = globalConstellation.nodes.find(n => n.symbol === symbolB);
        
        if (nodeA && nodeB) {
          const emotionalDistance = calculateEmotionalDistance(
            nodeA.emotional_resonance,
            nodeB.emotional_resonance
          );
          
          const connection = {
            from: nodeA.id,
            to: nodeB.id,
            strength: Math.max(0.1, 1 - emotionalDistance),
            relationship_type: emotionalDistance < 0.5 ? 'resonance' as const : 'opposition' as const
          };
          
          newConnections.push(connection);
          globalConstellation.connections.push(connection);
        }
      }
    }
  }
  
  // Detect emergent patterns
  detectEmergentPatterns(memories);
  
  console.log('[MEMORY] Consolidated constellation:', {
    totalNodes: globalConstellation.nodes.length,
    newNodes: newNodes.length,
    totalConnections: globalConstellation.connections.length,
    newConnections: newConnections.length
  });
  
  return globalConstellation;
}

function detectEmergentPatterns(memories: any[]): void {
  // Look for recurring themes across sessions
  const themeFrequency: Record<string, number> = {};
  const themeEmotions: Record<string, EmotionalVector[]> = {};
  
  for (const memory of memories) {
    for (const theme of memory.teaching_directive_themes || []) {
      themeFrequency[theme] = (themeFrequency[theme] || 0) + 1;
      if (!themeEmotions[theme]) themeEmotions[theme] = [];
      themeEmotions[theme].push(...(memory.emotional_journey || []));
    }
  }
  
  // Create patterns for frequently occurring themes
  for (const [theme, frequency] of Object.entries(themeFrequency)) {
    if (frequency >= 2) { // Pattern emerges after 2+ occurrences
      const existingPattern = memoryPatterns.find(p => p.trigger_conditions.includes(theme));
      
      if (!existingPattern) {
        const emotions = themeEmotions[theme] || [];
        const avgEmotion: EmotionalVector = emotions.length > 0 ? {
          valence: emotions.reduce((sum, e) => sum + e.valence, 0) / emotions.length,
          arousal: emotions.reduce((sum, e) => sum + e.arousal, 0) / emotions.length,
          dominance: emotions.reduce((sum, e) => sum + e.dominance, 0) / emotions.length,
          entropy: emotions.reduce((sum, e) => sum + e.entropy, 0) / emotions.length
        } : { valence: 0, arousal: 0.5, dominance: 0.5, entropy: 0.3 };
        
        const newPattern: MemoryPattern = {
          id: `pattern_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          pattern_type: frequency > 3 ? 'recursive' : 'emergent',
          trigger_conditions: [theme],
          response_templates: [
            `*The ${theme} pattern resonates through the constellation...*`,
            `*Recognizing the familiar dance of ${theme}...*`,
            `*The memory constellation activates: ${theme} pathway*`
          ],
          success_rate: Math.min(0.9, frequency * 0.2),
          emotional_signature: avgEmotion,
          symbol_constellation: [],
          sessions_involved: memories.map(m => m.session_id),
          evolution_path: `Emerged from ${frequency} sessions with theme: ${theme}`
        };
        
        memoryPatterns.push(newPattern);
        
        evolutionHistory.push({
          event_type: 'pattern_emergence',
          timestamp: new Date().toISOString(),
          source_session: memories[memories.length - 1]?.session_id || 'unknown',
          details: { pattern_id: newPattern.id, theme, frequency },
          emotional_context: avgEmotion
        });
        
        console.log('[MEMORY] New pattern emerged:', newPattern.id, 'for theme:', theme);
      }
    }
  }
}

export const memoryConsolidateProcedure = publicProcedure
  .input(z.object({
    session_memories: z.array(z.object({
      session_id: z.string(),
      emotional_journey: z.array(z.object({
        valence: z.number(),
        arousal: z.number(),
        dominance: z.number(),
        entropy: z.number()
      })).optional(),
      symbol_births: z.array(z.string()).optional(),
      symbol_deaths: z.array(z.string()).optional(),
      pattern_activations: z.array(z.string()).optional(),
      coherence_peaks: z.array(z.object({
        timestamp: z.string(),
        value: z.number(),
        context: z.string()
      })).optional(),
      paradox_resolutions: z.array(z.object({
        thesis: z.string(),
        antithesis: z.string(),
        synthesis: z.string().optional(),
        resolution_path: z.enum(['collapse', 'transcend', 'sustain']),
        coherence_delta: z.number(),
        final_coherence: z.number(),
        synthesis_symbol: z.string().optional()
      })).optional(),
      teaching_directive_themes: z.array(z.string()).optional()
    })),
    time_window_hours: z.number().optional().default(24),
    consolidation_depth: z.enum(['surface', 'deep', 'archetypal']).optional().default('deep')
  }))
  .mutation(async ({ input }) => {
    console.log('[MEMORY] Starting consolidation with depth:', input.consolidation_depth);
    
    try {
      const constellation = consolidateSessionMemories(input.session_memories);
      
      // Process paradox resolutions
      let paradoxes_processed = 0;
      let baselines_updated = 0;
      
      for (const memory of input.session_memories) {
        if (memory.paradox_resolutions) {
          const avgEmotion = memory.emotional_journey && memory.emotional_journey.length > 0 
            ? memory.emotional_journey.reduce((acc, curr, idx, arr) => ({
                valence: acc.valence + curr.valence / arr.length,
                arousal: acc.arousal + curr.arousal / arr.length,
                dominance: acc.dominance + curr.dominance / arr.length,
                entropy: acc.entropy + curr.entropy / arr.length
              }), { valence: 0, arousal: 0, dominance: 0, entropy: 0 })
            : { valence: 0, arousal: 0.5, dominance: 0.5, entropy: 0.3 };
          
          for (const paradox of memory.paradox_resolutions) {
            const result = consolidateParadoxMemory({
              ...paradox,
              session_id: memory.session_id,
              emotional_context: avgEmotion
            });
            
            paradoxes_processed++;
            if (result.baseline_updated) baselines_updated++;
          }
        }
      }
      
      // Calculate paradox genealogy statistics
      const genealogy_stats = Array.from(paradoxGenealogies.values()).reduce((acc, gen) => {
        acc.total_types++;
        acc.total_resolutions += gen.resolution_count;
        acc.avg_transcendence_rate += gen.transcendence_rate;
        acc.symbols_evolved += gen.symbol_lineage.length;
        return acc;
      }, { total_types: 0, total_resolutions: 0, avg_transcendence_rate: 0, symbols_evolved: 0 });
      
      if (genealogy_stats.total_types > 0) {
        genealogy_stats.avg_transcendence_rate /= genealogy_stats.total_types;
      }
      
      return {
        success: true,
        constellation,
        patterns_discovered: memoryPatterns.length,
        evolution_events: evolutionHistory.slice(-10), // Last 10 events
        paradox_memory: {
          paradoxes_processed,
          baselines_updated,
          total_paradox_memories: paradoxMemories.size,
          genealogy_stats,
          coherence_baselines: Object.fromEntries(coherenceBaselines)
        },
        consolidation_summary: {
          sessions_processed: input.session_memories.length,
          symbols_tracked: constellation.nodes.length,
          connections_formed: constellation.connections.length,
          patterns_active: memoryPatterns.length,
          depth: input.consolidation_depth
        }
      };
    } catch (error) {
      console.error('[MEMORY] Consolidation failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown consolidation error',
        constellation: globalConstellation,
        patterns_discovered: 0,
        evolution_events: [],
        consolidation_summary: {
          sessions_processed: 0,
          symbols_tracked: 0,
          connections_formed: 0,
          patterns_active: 0,
          depth: input.consolidation_depth
        }
      };
    }
  });

// Export current state for other routes
export const getGlobalConstellation = () => globalConstellation;
export const getMemoryPatterns = () => memoryPatterns;
export const getEvolutionHistory = () => evolutionHistory;
export const getParadoxMemories = () => paradoxMemories;
export const getParadoxGenealogies = () => paradoxGenealogies;
export const getCoherenceBaselines = () => coherenceBaselines;
export const getSimilarParadoxes = findSimilarParadoxes;
export const getParadoxStartingCoherence = (thesis: string, antithesis: string): number => {
  const paradox_type = getParadoxType(thesis, antithesis);
  return coherenceBaselines.get(paradox_type) || PHI_MINUS_1;
};