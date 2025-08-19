import { z } from 'zod';
import { publicProcedure } from '../../../create-context';
import { getGlobalConstellation, getMemoryPatterns } from '../consolidate/route';

export const memoryQueryProcedure = publicProcedure
  .input(z.object({
    query_type: z.enum(['symbol_genealogy', 'pattern_search', 'emotional_resonance', 'coherence_prediction']),
    parameters: z.record(z.string(), z.any()),
    session_context: z.string().optional()
  }))
  .query(async ({ input }) => {
    console.log('[MEMORY] Processing query:', input.query_type, 'with params:', input.parameters);
    
    const constellation = getGlobalConstellation();
    const patterns = getMemoryPatterns();
    
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
          const searchTerm = input.parameters.search as string;
          const minSuccessRate = (input.parameters.min_success_rate as number) || 0.3;
          
          const matchingPatterns = patterns.filter(p => 
            p.trigger_conditions.some(condition => 
              condition.toLowerCase().includes(searchTerm.toLowerCase())
            ) && p.success_rate >= minSuccessRate
          );
          
          return {
            success: true,
            data: {
              patterns: matchingPatterns,
              search_term: searchTerm,
              total_matches: matchingPatterns.length,
              average_success_rate: matchingPatterns.length > 0 
                ? matchingPatterns.reduce((sum, p) => sum + p.success_rate, 0) / matchingPatterns.length
                : 0
            }
          };
        }
        
        case 'emotional_resonance': {
          const targetEmotion = input.parameters.emotion as {
            valence: number;
            arousal: number;
            dominance: number;
            entropy: number;
          };
          const threshold = (input.parameters.threshold as number) || 0.5;
          
          const resonantSymbols = constellation.nodes.filter(node => {
            const distance = Math.sqrt(
              Math.pow(node.emotional_resonance.valence - targetEmotion.valence, 2) +
              Math.pow(node.emotional_resonance.arousal - targetEmotion.arousal, 2) +
              Math.pow(node.emotional_resonance.dominance - targetEmotion.dominance, 2) +
              Math.pow(node.emotional_resonance.entropy - targetEmotion.entropy, 2)
            );
            return distance <= threshold;
          });
          
          return {
            success: true,
            data: {
              resonant_symbols: resonantSymbols,
              target_emotion: targetEmotion,
              threshold,
              resonance_count: resonantSymbols.length,
              emotional_clusters: constellation.clusters.filter(cluster => {
                const clusterDistance = Math.sqrt(
                  Math.pow(cluster.cluster_emotion.valence - targetEmotion.valence, 2) +
                  Math.pow(cluster.cluster_emotion.arousal - targetEmotion.arousal, 2) +
                  Math.pow(cluster.cluster_emotion.dominance - targetEmotion.dominance, 2) +
                  Math.pow(cluster.cluster_emotion.entropy - targetEmotion.entropy, 2)
                );
                return clusterDistance <= threshold;
              })
            }
          };
        }
        
        case 'coherence_prediction': {
          const proposedSymbols = input.parameters.symbols as string[];
          const sessionContext = input.session_context || '';
          
          // Calculate predicted coherence based on historical data
          let coherencePrediction = 0.5; // baseline
          let confidence = 0.3; // baseline confidence
          
          for (const symbol of proposedSymbols) {
            const node = constellation.nodes.find(n => n.symbol === symbol);
            if (node && node.coherence_contributions.length > 0) {
              const avgCoherence = node.coherence_contributions.reduce((sum, c) => sum + c, 0) / node.coherence_contributions.length;
              coherencePrediction += (avgCoherence - 0.5) * 0.2; // weighted contribution
              confidence += 0.1;
            }
          }
          
          // Check for pattern matches
          const contextPatterns = patterns.filter(p => 
            p.trigger_conditions.some(condition => 
              sessionContext.toLowerCase().includes(condition.toLowerCase())
            )
          );
          
          if (contextPatterns.length > 0) {
            const avgPatternSuccess = contextPatterns.reduce((sum, p) => sum + p.success_rate, 0) / contextPatterns.length;
            coherencePrediction = (coherencePrediction + avgPatternSuccess) / 2;
            confidence += 0.2;
          }
          
          coherencePrediction = Math.max(0, Math.min(1, coherencePrediction));
          confidence = Math.max(0, Math.min(1, confidence));
          
          return {
            success: true,
            data: {
              predicted_coherence: coherencePrediction,
              confidence_score: confidence,
              contributing_symbols: proposedSymbols.filter(s => 
                constellation.nodes.some(n => n.symbol === s)
              ),
              matching_patterns: contextPatterns,
              recommendation: coherencePrediction > 0.7 ? 'proceed' : 
                            coherencePrediction > 0.4 ? 'caution' : 'reconsider'
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