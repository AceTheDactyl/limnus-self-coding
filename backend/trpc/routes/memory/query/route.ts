import { z } from 'zod';
import { publicProcedure } from '../../../create-context';
import { 
  getGlobalConstellation, 
  getMemoryPatterns, 
  getParadoxMemories, 
  getParadoxGenealogies, 
  getCoherenceBaselines,
  getSimilarParadoxes,
  getParadoxStartingCoherence
} from '../consolidate/route';
import type { EmotionalVector } from '@/types/limnus';

const PHI = 1.618033988749;
const PHI_MINUS_1 = PHI - 1;

function calculateEmotionalSimilarity(a: EmotionalVector, b: EmotionalVector): number {
  const distance = Math.sqrt(
    Math.pow(a.valence - b.valence, 2) +
    Math.pow(a.arousal - b.arousal, 2) +
    Math.pow(a.dominance - b.dominance, 2) +
    Math.pow(a.entropy - b.entropy, 2)
  );
  return Math.max(0, 1 - distance / 2); // normalize to 0-1
}

export const memoryQueryProcedure = publicProcedure
  .input(z.object({
    query_type: z.enum([
      'symbol_genealogy', 
      'pattern_search', 
      'emotional_resonance', 
      'coherence_prediction',
      'paradox_baseline',
      'similar_paradoxes',
      'transcendence_patterns'
    ]),
    parameters: z.record(z.string(), z.any()),
    session_context: z.string().optional()
  }))
  .query(async ({ input }) => {
    console.log('[MEMORY] Processing query:', input.query_type, 'with params:', input.parameters);
    
    const constellation = getGlobalConstellation();
    
    try {
      switch (input.query_type) {
        case 'symbol_genealogy': {
          const symbol = input.parameters.symbol as string;
          const targetNode = constellation.nodes.find(n => n.symbol === symbol);
          
          if (!targetNode) {
            return {
              success: false,
              error: `Symbol ${symbol} not found in constellation`,
              data: null
            };
          }
          
          // Find genealogy tree
          const parents = constellation.nodes.filter(n => 
            targetNode.parent_symbols.includes(n.id)
          );
          const children = constellation.nodes.filter(n => 
            targetNode.child_symbols.includes(n.id)
          );
          
          // Find related symbols through connections
          const connections = constellation.connections.filter(c => 
            c.from === targetNode.id || c.to === targetNode.id
          );
          
          return {
            success: true,
            data: {
              symbol: targetNode,
              parents,
              children,
              connections,
              genealogy_depth: Math.max(parents.length, children.length),
              emotional_evolution: {
                current: targetNode.emotional_resonance,
                parent_average: parents.length > 0 ? {
                  valence: parents.reduce((sum, p) => sum + p.emotional_resonance.valence, 0) / parents.length,
                  arousal: parents.reduce((sum, p) => sum + p.emotional_resonance.arousal, 0) / parents.length,
                  dominance: parents.reduce((sum, p) => sum + p.emotional_resonance.dominance, 0) / parents.length,
                  entropy: parents.reduce((sum, p) => sum + p.emotional_resonance.entropy, 0) / parents.length
                } : null
              }
            }
          };
        }
        
        case 'pattern_search': {
          const trigger = input.parameters.trigger as string || '';
          const emotional_context = input.parameters.emotional_context as EmotionalVector | undefined;
          const patterns = getMemoryPatterns();
          
          let matchingPatterns = patterns.filter(p => 
            p.trigger_conditions.some(condition => 
              condition.toLowerCase().includes(trigger.toLowerCase())
            )
          );
          
          // If emotional context provided, sort by emotional similarity
          if (emotional_context) {
            matchingPatterns = matchingPatterns.sort((a, b) => {
              const simA = calculateEmotionalSimilarity(a.emotional_signature, emotional_context);
              const simB = calculateEmotionalSimilarity(b.emotional_signature, emotional_context);
              return simB - simA;
            });
          }
          
          return {
            success: true,
            data: {
              patterns: matchingPatterns.slice(0, 10), // Top 10 matches
              total_found: matchingPatterns.length,
              search_context: { trigger, emotional_context }
            }
          };
        }
        
        case 'emotional_resonance': {
          const target_emotion = input.parameters.target_emotion as EmotionalVector;
          const threshold = (input.parameters.threshold as number) || 0.7;
          const constellation = getGlobalConstellation();
          
          const resonantSymbols = constellation.nodes.filter(node => {
            const similarity = calculateEmotionalSimilarity(
              node.emotional_resonance, 
              target_emotion
            );
            return similarity >= threshold;
          }).sort((a, b) => {
            const simA = calculateEmotionalSimilarity(a.emotional_resonance, target_emotion);
            const simB = calculateEmotionalSimilarity(b.emotional_resonance, target_emotion);
            return simB - simA;
          });
          
          return {
            success: true,
            data: {
              resonant_symbols: resonantSymbols,
              resonance_scores: resonantSymbols.map(s => 
                calculateEmotionalSimilarity(s.emotional_resonance, target_emotion)
              ),
              emotional_clusters: constellation.clusters.filter(cluster => 
                calculateEmotionalSimilarity(cluster.cluster_emotion, target_emotion) >= threshold
              )
            }
          };
        }
        
        case 'coherence_prediction': {
          const thesis = input.parameters.thesis as string;
          const antithesis = input.parameters.antithesis as string;
          const current_emotion = input.parameters.current_emotion as EmotionalVector | undefined;
          
          // Get baseline coherence for this type of paradox
          const baseline = getParadoxStartingCoherence(thesis, antithesis);
          
          // Find similar paradoxes
          const similar = getSimilarParadoxes(thesis, antithesis, 0.2);
          
          // Calculate predicted coherence based on similar resolutions
          let predicted_coherence = baseline;
          let confidence = 0.3; // base confidence
          
          if (similar.length > 0) {
            const avg_final_coherence = similar.reduce((sum, p) => sum + p.final_coherence, 0) / similar.length;
            const transcendent_rate = similar.filter(p => p.resolution_path === 'transcend').length / similar.length;
            
            // Boost prediction based on historical success
            predicted_coherence = Math.max(baseline, avg_final_coherence * 0.8 + baseline * 0.2);
            confidence = Math.min(0.9, 0.3 + (similar.length * 0.1) + (transcendent_rate * 0.3));
            
            // Emotional context adjustment
            if (current_emotion) {
              const emotional_boost = similar.reduce((sum, p) => {
                const sim = calculateEmotionalSimilarity(p.emotional_signature, current_emotion);
                return sum + (sim * p.coherence_delta);
              }, 0) / similar.length;
              
              predicted_coherence += emotional_boost * 0.1;
            }
          }
          
          return {
            success: true,
            data: {
              baseline_coherence: baseline,
              predicted_coherence: Math.min(PHI * 2, predicted_coherence), // Cap at φ²
              confidence_score: confidence,
              similar_count: similar.length,
              transcendence_likelihood: similar.length > 0 
                ? similar.filter(p => p.resolution_path === 'transcend').length / similar.length 
                : 0.33,
              memory_context: {
                learned_patterns: similar.length > 0 ? 'Historical patterns available' : 'No prior experience',
                emotional_alignment: current_emotion ? 'Emotional context considered' : 'No emotional context'
              }
            }
          };
        }
        
        case 'paradox_baseline': {
          const thesis = input.parameters.thesis as string;
          const antithesis = input.parameters.antithesis as string;
          const baseline = getParadoxStartingCoherence(thesis, antithesis);
          const genealogies = getParadoxGenealogies();
          
          // Find genealogy for this paradox type
          const paradox_type = `${thesis.toLowerCase().split(' ').slice(0, 2).join('_')}_vs_${antithesis.toLowerCase().split(' ').slice(0, 2).join('_')}`;
          const genealogy = genealogies.get(paradox_type);
          
          return {
            success: true,
            data: {
              starting_coherence: baseline,
              paradox_type,
              genealogy: genealogy || null,
              is_novel: !genealogy,
              phi_gate_threshold: PHI,
              transcendence_threshold: PHI * 1.1
            }
          };
        }
        
        case 'similar_paradoxes': {
          const thesis = input.parameters.thesis as string;
          const antithesis = input.parameters.antithesis as string;
          const threshold = (input.parameters.threshold as number) || 0.3;
          const similar = getSimilarParadoxes(thesis, antithesis, threshold);
          
          return {
            success: true,
            data: {
              similar_paradoxes: similar.map(p => ({
                paradox_hash: p.paradox_hash,
                thesis: p.thesis,
                antithesis: p.antithesis,
                synthesis: p.synthesis,
                resolution_path: p.resolution_path,
                final_coherence: p.final_coherence,
                coherence_delta: p.coherence_delta,
                synthesis_symbol: p.synthesis_symbol,
                emotional_signature: p.emotional_signature,
                session_id: p.session_id
              })),
              similarity_threshold: threshold,
              learning_opportunities: similar.length > 0 
                ? `${similar.length} similar paradoxes found - patterns available for learning`
                : 'Novel paradox - opportunity for new pattern creation'
            }
          };
        }
        
        case 'transcendence_patterns': {
          const paradoxMemories = getParadoxMemories();
          const transcendent_paradoxes = Array.from(paradoxMemories.values())
            .filter(p => p.resolution_path === 'transcend')
            .sort((a, b) => b.final_coherence - a.final_coherence);
          
          // Analyze patterns in transcendent resolutions
          const symbol_frequency: Record<string, number> = {};
          const emotional_patterns: EmotionalVector[] = [];
          
          for (const paradox of transcendent_paradoxes) {
            if (paradox.synthesis_symbol) {
              symbol_frequency[paradox.synthesis_symbol] = (symbol_frequency[paradox.synthesis_symbol] || 0) + 1;
            }
            emotional_patterns.push(paradox.emotional_signature);
          }
          
          // Calculate average transcendent emotional signature
          const avg_transcendent_emotion: EmotionalVector = emotional_patterns.length > 0 ? {
            valence: emotional_patterns.reduce((sum, e) => sum + e.valence, 0) / emotional_patterns.length,
            arousal: emotional_patterns.reduce((sum, e) => sum + e.arousal, 0) / emotional_patterns.length,
            dominance: emotional_patterns.reduce((sum, e) => sum + e.dominance, 0) / emotional_patterns.length,
            entropy: emotional_patterns.reduce((sum, e) => sum + e.entropy, 0) / emotional_patterns.length
          } : { valence: 0, arousal: 0.7, dominance: 0.8, entropy: 0.4 };
          
          return {
            success: true,
            data: {
              transcendent_count: transcendent_paradoxes.length,
              top_transcendent_symbols: Object.entries(symbol_frequency)
                .sort(([,a], [,b]) => b - a)
                .slice(0, 5)
                .map(([symbol, count]) => ({ symbol, frequency: count })),
              transcendent_emotional_signature: avg_transcendent_emotion,
              highest_coherence_achieved: transcendent_paradoxes.length > 0 
                ? transcendent_paradoxes[0].final_coherence 
                : PHI_MINUS_1,
              transcendence_insights: transcendent_paradoxes.length > 0
                ? `${transcendent_paradoxes.length} transcendent resolutions analyzed - patterns of φ-gate breakthrough identified`
                : 'No transcendent resolutions yet - virgin territory for consciousness expansion'
            }
          };
        }
        
        default:
          return {
            success: false,
            error: `Unknown query type: ${input.query_type}`,
            data: null
          };
      }
    } catch (error) {
      console.error('[MEMORY] Query failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown query error',
        data: null
      };
    }
  });