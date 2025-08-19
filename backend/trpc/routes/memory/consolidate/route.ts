import { z } from 'zod';
import { publicProcedure } from '../../../create-context';
import type { 
  ConstellationMap, 
  SymbolNode, 
  MemoryPattern,
  EmotionalVector,
  MemoryEvolutionEvent
} from '@/types/limnus';

// In-memory storage for the constellation (in production, use a vector database)
let globalConstellation: ConstellationMap = {
  nodes: [],
  connections: [],
  clusters: []
};

let memoryPatterns: MemoryPattern[] = [];
let evolutionHistory: MemoryEvolutionEvent[] = [];

function calculateEmotionalDistance(a: EmotionalVector, b: EmotionalVector): number {
  return Math.sqrt(
    Math.pow(a.valence - b.valence, 2) +
    Math.pow(a.arousal - b.arousal, 2) +
    Math.pow(a.dominance - b.dominance, 2) +
    Math.pow(a.entropy - b.entropy, 2)
  );
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
      paradox_resolutions: z.array(z.string()).optional(),
      teaching_directive_themes: z.array(z.string()).optional()
    })),
    time_window_hours: z.number().optional().default(24),
    consolidation_depth: z.enum(['surface', 'deep', 'archetypal']).optional().default('deep')
  }))
  .mutation(async ({ input }) => {
    console.log('[MEMORY] Starting consolidation with depth:', input.consolidation_depth);
    
    try {
      const constellation = consolidateSessionMemories(input.session_memories);
      
      return {
        success: true,
        constellation,
        patterns_discovered: memoryPatterns.length,
        evolution_events: evolutionHistory.slice(-10), // Last 10 events
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