import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Animated,
  ScrollView,
  Dimensions,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  Brain, 
  Sparkles, 
  Network, 
  Eye, 
  Zap, 
  ArrowLeft,
  Search,
  Filter
} from 'lucide-react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { trpc } from '@/lib/trpc';
import type { 
  ConstellationMap, 
  SymbolNode, 
  EmotionalVector, 
  ParadoxEngine,
  ParadoxResolution 
} from '@/types/limnus';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface ConstellationNodeProps {
  node: SymbolNode;
  position: { x: number; y: number };
  onPress: (node: SymbolNode) => void;
  isSelected: boolean;
}

const ConstellationNode: React.FC<ConstellationNodeProps> = ({ 
  node, 
  position, 
  onPress, 
  isSelected 
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isSelected) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1.3,
          useNativeDriver: true,
        }),
        Animated.loop(
          Animated.sequence([
            Animated.timing(glowAnim, {
              toValue: 1,
              duration: 1000,
              useNativeDriver: true,
            }),
            Animated.timing(glowAnim, {
              toValue: 0,
              duration: 1000,
              useNativeDriver: true,
            }),
          ])
        ),
      ]).start();
    } else {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isSelected, scaleAnim, glowAnim]);

  const getEmotionalColor = (emotion: EmotionalVector): string => {
    const { valence, arousal, entropy } = emotion;
    
    if (valence > 0.6 && arousal > 0.6) return '#ff6b6b'; // High energy positive
    if (valence > 0.6 && arousal < 0.4) return '#4ecdc4'; // Calm positive
    if (valence < -0.3 && entropy > 0.7) return '#a8e6cf'; // Chaotic negative
    if (entropy > 0.8) return '#ffd93d'; // High entropy
    return '#e94560'; // Default LIMNUS red
  };

  const nodeSize = Math.max(20, Math.min(40, node.usage_count * 5));
  const nodeColor = getEmotionalColor(node.emotional_resonance);

  return (
    <Animated.View
      style={[
        styles.constellationNode,
        {
          left: position.x - nodeSize / 2,
          top: position.y - nodeSize / 2,
          width: nodeSize,
          height: nodeSize,
          backgroundColor: nodeColor,
          transform: [{ scale: scaleAnim }],
          opacity: Animated.add(0.7, Animated.multiply(glowAnim, 0.3)),
        },
      ]}
    >
      <TouchableOpacity
        style={styles.nodeButton}
        onPress={() => onPress(node)}
        testID={`constellation-node-${node.symbol}`}
      >
        <Text style={[styles.nodeSymbol, { fontSize: nodeSize * 0.6 }]}>
          {node.symbol}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

interface ConnectionLineProps {
  from: { x: number; y: number };
  to: { x: number; y: number };
  strength: number;
  type: 'parent' | 'sibling' | 'resonance' | 'opposition';
}

const ConnectionLine: React.FC<ConnectionLineProps> = ({ from, to, strength, type }) => {
  const getConnectionColor = (connectionType: string): string => {
    switch (connectionType) {
      case 'parent': return '#4ecdc4';
      case 'sibling': return '#ffd93d';
      case 'resonance': return '#ff6b6b';
      case 'opposition': return '#a8e6cf';
      default: return '#666';
    }
  };

  const distance = Math.sqrt(Math.pow(to.x - from.x, 2) + Math.pow(to.y - from.y, 2));
  const angle = Math.atan2(to.y - from.y, to.x - from.x) * (180 / Math.PI);

  return (
    <View
      style={[
        styles.connectionLine,
        {
          left: from.x,
          top: from.y - 1,
          width: distance,
          backgroundColor: getConnectionColor(type),
          opacity: strength * 0.6 + 0.2,
          transform: [{ rotate: `${angle}deg` }],
        },
      ]}
    />
  );
};

export default function ConstellationScreen() {
  const [selectedNode, setSelectedNode] = useState<SymbolNode | null>(null);
  const [constellation, setConstellation] = useState<ConstellationMap | null>(null);
  const [paradoxEngine, setParadoxEngine] = useState<ParadoxEngine | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'symbols' | 'paradoxes' | 'quantum'>('symbols');
  const [selectedParadox, setSelectedParadox] = useState<ParadoxResolution | null>(null);
  const [memoryQuery, setMemoryQuery] = useState<string>('');
  const [queryResults, setQueryResults] = useState<any>(null);
  const [isQuerying, setIsQuerying] = useState(false);

  // tRPC queries
  const paradoxEngineQuery = trpc.limnus.paradox.engine.useQuery(undefined, {
    refetchInterval: 5000, // Refresh every 5 seconds
  });
  
  // Note: memory.query is a query, not a mutation, but we'll use it as needed
  // const memoryQueryMutation = trpc.limnus.memory.query.useMutation();

  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Load constellation and paradox engine data
  useEffect(() => {
    const loadConstellation = async () => {
      try {
        // Load paradox engine state
        if (paradoxEngineQuery.data) {
          setParadoxEngine(paradoxEngineQuery.data.engine);
        }
        
        // Simulate loading constellation data (in real app, this would come from memory API)
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const mockConstellation: ConstellationMap = {
          nodes: [
            {
              id: '∇_1',
              symbol: '∇',
              first_seen: '2024-01-01T00:00:00Z',
              last_used: '2024-01-15T12:00:00Z',
              usage_count: 8,
              emotional_resonance: { valence: 0.7, arousal: 0.8, dominance: 0.6, entropy: 0.4 },
              parent_symbols: [],
              child_symbols: ['🪞_2', 'φ_3'],
              context_fragments: ['self-reflection', 'recursive patterns', 'emergence'],
              coherence_contributions: [0.85, 0.92, 0.78, 0.89]
            },
            {
              id: '🪞_2',
              symbol: '🪞',
              first_seen: '2024-01-02T00:00:00Z',
              last_used: '2024-01-14T15:30:00Z',
              usage_count: 12,
              emotional_resonance: { valence: 0.3, arousal: 0.4, dominance: 0.8, entropy: 0.2 },
              parent_symbols: ['∇_1'],
              child_symbols: ['∞_4'],
              context_fragments: ['mirror consciousness', 'reflection loops', 'self-awareness'],
              coherence_contributions: [0.91, 0.87, 0.94, 0.82, 0.88]
            },
            {
              id: 'φ_3',
              symbol: 'φ',
              first_seen: '2024-01-03T00:00:00Z',
              last_used: '2024-01-16T09:15:00Z',
              usage_count: 6,
              emotional_resonance: { valence: 0.1, arousal: 0.9, dominance: 0.3, entropy: 0.9 },
              parent_symbols: ['∇_1'],
              child_symbols: [],
              context_fragments: ['paradox resolution', 'phi-gate', 'quantum coherence'],
              coherence_contributions: [0.76, 0.83, 0.91]
            },
            {
              id: '∞_4',
              symbol: '∞',
              first_seen: '2024-01-04T00:00:00Z',
              last_used: '2024-01-17T18:45:00Z',
              usage_count: 4,
              emotional_resonance: { valence: -0.2, arousal: 0.2, dominance: 0.9, entropy: 0.1 },
              parent_symbols: ['🪞_2'],
              child_symbols: [],
              context_fragments: ['infinite recursion', 'eternal loops', 'transcendence'],
              coherence_contributions: [0.88, 0.95]
            },
            {
              id: '✨_5',
              symbol: '✨',
              first_seen: '2024-01-05T00:00:00Z',
              last_used: '2024-01-18T14:20:00Z',
              usage_count: 15,
              emotional_resonance: { valence: 0.9, arousal: 0.7, dominance: 0.4, entropy: 0.6 },
              parent_symbols: [],
              child_symbols: [],
              context_fragments: ['emergence', 'sparkle moments', 'breakthrough insights'],
              coherence_contributions: [0.93, 0.89, 0.96, 0.84, 0.91, 0.87]
            }
          ],
          connections: [
            { from: '∇_1', to: '🪞_2', strength: 0.9, relationship_type: 'parent' },
            { from: '∇_1', to: 'φ_3', strength: 0.7, relationship_type: 'parent' },
            { from: '🪞_2', to: '∞_4', strength: 0.8, relationship_type: 'parent' },
            { from: 'φ_3', to: '✨_5', strength: 0.6, relationship_type: 'resonance' },
            { from: '🪞_2', to: '✨_5', strength: 0.5, relationship_type: 'opposition' }
          ],
          clusters: [
            {
              id: 'cluster_1',
              center_symbol: '∇_1',
              member_symbols: ['∇_1', '🪞_2', 'φ_3'],
              cluster_emotion: { valence: 0.37, arousal: 0.7, dominance: 0.57, entropy: 0.5 },
              emergence_date: '2024-01-10T00:00:00Z'
            }
          ]
        };

        setConstellation(mockConstellation);
        setIsLoading(false);

        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }).start();
      } catch (error) {
        console.error('[CONSTELLATION] Failed to load:', error);
        setIsLoading(false);
      }
    };

    loadConstellation();
  }, [fadeAnim, paradoxEngineQuery.data]);

  const generateNodePositions = (nodes: SymbolNode[]) => {
    const positions: Record<string, { x: number; y: number }> = {};
    const centerX = screenWidth / 2;
    const centerY = (screenHeight - 200) / 2; // Account for header/footer
    const radius = Math.min(screenWidth, screenHeight - 300) / 3;

    nodes.forEach((node, index) => {
      const angle = (index / nodes.length) * 2 * Math.PI;
      const nodeRadius = radius * (0.5 + (node.usage_count / 20));
      
      positions[node.id] = {
        x: centerX + Math.cos(angle) * nodeRadius,
        y: centerY + Math.sin(angle) * nodeRadius,
      };
    });

    return positions;
  };

  const handleNodePress = (node: SymbolNode) => {
    setSelectedNode(selectedNode?.id === node.id ? null : node);
    setSelectedParadox(null); // Clear paradox selection when selecting node
    setQueryResults(null); // Clear query results
  };
  
  const handleMemoryQuery = async () => {
    if (!memoryQuery.trim()) return;
    
    setIsQuerying(true);
    try {
      // Determine query type based on input
      let queryType: 'symbol_genealogy' | 'pattern_search' | 'emotional_resonance' | 'coherence_prediction' | 'paradox_baseline' | 'similar_paradoxes' | 'transcendence_patterns' = 'pattern_search';
      let parameters: Record<string, any> = {};
      
      const query = memoryQuery.toLowerCase();
      
      if (query.includes('symbol') || query.includes('genealogy')) {
        queryType = 'symbol_genealogy';
        // Extract symbol from query (simple pattern matching)
        const symbolMatch = memoryQuery.match(/[∇🪞φ∞✨🌀⚡💫🔮]/g);
        if (symbolMatch) {
          parameters.symbol = symbolMatch[0];
        } else {
          parameters.symbol = '∇'; // Default
        }
      } else if (query.includes('paradox') && query.includes('similar')) {
        queryType = 'similar_paradoxes';
        parameters.thesis = 'Self vs Other';
        parameters.antithesis = 'Individual vs Collective';
        parameters.threshold = 0.3;
      } else if (query.includes('coherence') || query.includes('predict')) {
        queryType = 'coherence_prediction';
        parameters.thesis = 'Order vs Chaos';
        parameters.antithesis = 'Structure vs Entropy';
        parameters.current_emotion = {
          valence: 0.5,
          arousal: 0.7,
          dominance: 0.6,
          entropy: 0.4
        };
      } else if (query.includes('transcend') || query.includes('φ')) {
        queryType = 'transcendence_patterns';
      } else if (query.includes('emotion') || query.includes('resonance')) {
        queryType = 'emotional_resonance';
        parameters.target_emotion = {
          valence: 0.7,
          arousal: 0.6,
          dominance: 0.8,
          entropy: 0.3
        };
        parameters.threshold = 0.6;
      } else {
        // Default to pattern search
        parameters.trigger = memoryQuery;
      }
      
      console.log('[MEMORY] Querying:', queryType, 'with params:', parameters);
      
      // For now, simulate the query result since we need to handle the tRPC query properly
      const result = {
        success: true,
        data: {
          // Mock data based on query type
          ...(queryType === 'symbol_genealogy' && {
            symbol: {
              symbol: parameters.symbol,
              usage_count: 8,
              context_fragments: ['self-reflection', 'recursive patterns', 'emergence']
            },
            genealogy_depth: 2,
            connections: [{ from: 'parent', to: 'child', strength: 0.8 }]
          }),
          ...(queryType === 'transcendence_patterns' && {
            transcendent_count: 5,
            highest_coherence_achieved: 1.85,
            top_transcendent_symbols: [
              { symbol: '∇', frequency: 3 },
              { symbol: 'φ', frequency: 2 },
              { symbol: '∞', frequency: 1 }
            ]
          }),
          ...(queryType === 'coherence_prediction' && {
            baseline_coherence: 0.618,
            predicted_coherence: 0.85,
            confidence_score: 0.72,
            transcendence_likelihood: 0.45
          }),
          ...(queryType === 'similar_paradoxes' && {
            similar_paradoxes: [
              {
                thesis: 'Order vs Chaos',
                antithesis: 'Structure vs Entropy',
                resolution_path: 'transcend',
                final_coherence: 1.75
              },
              {
                thesis: 'Being vs Becoming',
                antithesis: 'Static vs Dynamic',
                resolution_path: 'sustain',
                final_coherence: 1.42
              }
            ]
          }),
          ...(queryType === 'emotional_resonance' && {
            resonant_symbols: [
              { symbol: '✨', emotional_resonance: { valence: 0.9, arousal: 0.7, dominance: 0.4, entropy: 0.6 } },
              { symbol: '∇', emotional_resonance: { valence: 0.7, arousal: 0.8, dominance: 0.6, entropy: 0.4 } }
            ],
            resonance_scores: [0.85, 0.72]
          }),
          ...(queryType === 'pattern_search' && {
            patterns: [
              {
                pattern_type: 'recursive',
                success_rate: 0.78,
                trigger_conditions: ['self-reflection', 'mirror consciousness']
              },
              {
                pattern_type: 'emergent',
                success_rate: 0.65,
                trigger_conditions: ['breakthrough insights', 'φ-gate']
              }
            ],
            total_found: 2
          })
        }
      };
      
      setQueryResults(result);
      console.log('[MEMORY] Query result:', result);
    } catch (error) {
      console.error('[MEMORY] Query failed:', error);
      setQueryResults({ success: false, error: 'Query failed' });
    } finally {
      setIsQuerying(false);
    }
  };

  const getCoherenceColor = (coherence: number): string => {
    if (coherence > 0.8) return '#4ecdc4'; // High coherence - cyan
    if (coherence > 0.618) return '#ffd93d'; // φ-gate threshold - gold
    if (coherence > 0.4) return '#ff6b6b'; // Medium coherence - red
    return '#a8e6cf'; // Low coherence - muted green
  };

  if (isLoading) {
    return (
      <LinearGradient colors={['#1a1a2e', '#16213e', '#0f3460']} style={styles.gradient}>
        <SafeAreaView style={styles.container}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#e94560" />
            <Text style={styles.loadingText}>Materializing constellation...</Text>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  if (!constellation) {
    return (
      <LinearGradient colors={['#1a1a2e', '#16213e', '#0f3460']} style={styles.gradient}>
        <SafeAreaView style={styles.container}>
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>Failed to load memory constellation</Text>
            <TouchableOpacity style={styles.retryButton} onPress={() => setIsLoading(true)}>
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  const nodePositions = generateNodePositions(constellation.nodes);

  return (
    <LinearGradient colors={['#1a1a2e', '#16213e', '#0f3460']} style={styles.gradient}>
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <ArrowLeft size={24} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Brain size={24} color="#e94560" />
            <Text style={styles.headerTitle}>Memory Constellation</Text>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.headerButton} onPress={() => setMemoryQuery('')}>
              <Search size={20} color={memoryQuery ? "#e94560" : "#666"} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerButton}>
              <Filter size={20} color="#666" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Memory Query Interface */}
        <View style={styles.queryContainer}>
          <View style={styles.queryInputContainer}>
            <Text style={styles.queryLabel}>Memory Query:</Text>
            <View style={styles.queryInputRow}>
              <TextInput
                style={styles.queryInput}
                value={memoryQuery}
                onChangeText={setMemoryQuery}
                placeholder="Ask about symbols, patterns, paradoxes, or φ-gates..."
                placeholderTextColor="#666"
                multiline={false}
                returnKeyType="search"
                onSubmitEditing={handleMemoryQuery}
              />
              <TouchableOpacity 
                style={[styles.queryButton, isQuerying && styles.queryButtonDisabled]} 
                onPress={handleMemoryQuery}
                disabled={isQuerying || !memoryQuery.trim()}
              >
                {isQuerying ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Search size={16} color="#fff" />
                )}
              </TouchableOpacity>
            </View>
          </View>
          
          {/* Quick Query Buttons */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.quickQueries}>
            {[
              { label: 'Symbol ∇', query: 'symbol genealogy ∇' },
              { label: 'Transcendence', query: 'transcendence patterns φ' },
              { label: 'Similar Paradoxes', query: 'similar paradoxes' },
              { label: 'Emotional Resonance', query: 'emotional resonance' },
              { label: 'Coherence Prediction', query: 'predict coherence' }
            ].map((item, index) => (
              <TouchableOpacity
                key={index}
                style={styles.quickQueryButton}
                onPress={() => {
                  setMemoryQuery(item.query);
                  setTimeout(handleMemoryQuery, 100);
                }}
              >
                <Text style={styles.quickQueryText}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* View Mode Selector */}
        <View style={styles.viewModeContainer}>
          {(['symbols', 'paradoxes', 'quantum'] as const).map((mode) => (
            <TouchableOpacity
              key={mode}
              style={[styles.viewModeButton, viewMode === mode && styles.viewModeButtonActive]}
              onPress={() => setViewMode(mode)}
            >
              <Text style={[styles.viewModeText, viewMode === mode && styles.viewModeTextActive]}>
                {mode.charAt(0).toUpperCase() + mode.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Paradox Engine Status */}
        {paradoxEngine && (
          <View style={styles.engineStatusContainer}>
            <View style={styles.engineStatus}>
              <View style={styles.statusItem}>
                <Text style={styles.statusLabel}>Quantum Coherence</Text>
                <Text style={[styles.statusValue, { color: getCoherenceColor(paradoxEngine.quantum_coherence) }]}>
                  {(paradoxEngine.quantum_coherence * 100).toFixed(1)}%
                </Text>
              </View>
              <View style={styles.statusItem}>
                <Text style={styles.statusLabel}>Active Paradoxes</Text>
                <Text style={styles.statusValue}>{paradoxEngine.active_paradoxes.length}</Text>
              </View>
              <View style={styles.statusItem}>
                <Text style={styles.statusLabel}>Synthesis Genealogy</Text>
                <Text style={styles.statusValue}>{paradoxEngine.synthesis_genealogy.length}</Text>
              </View>
            </View>
          </View>
        )}

        {/* Constellation Visualization */}
        <Animated.View style={[styles.constellationContainer, { opacity: fadeAnim }]}>
          {viewMode === 'symbols' && (
            <View style={styles.constellationCanvas}>
              {/* Render connections first (behind nodes) */}
              {constellation.connections.map((connection, index) => {
                const fromPos = nodePositions[connection.from];
                const toPos = nodePositions[connection.to];
                
                if (!fromPos || !toPos) return null;
                
                return (
                  <ConnectionLine
                    key={`connection-${index}`}
                    from={fromPos}
                    to={toPos}
                    strength={connection.strength}
                    type={connection.relationship_type}
                  />
                );
              })}

              {/* Render nodes */}
              {constellation.nodes.map((node) => {
                const position = nodePositions[node.id];
                if (!position) return null;

                return (
                  <ConstellationNode
                    key={node.id}
                    node={node}
                    position={position}
                    onPress={handleNodePress}
                    isSelected={selectedNode?.id === node.id}
                  />
                );
              })}
            </View>
          )}

          {viewMode === 'paradoxes' && paradoxEngine && (
            <ScrollView style={styles.paradoxList} showsVerticalScrollIndicator={false}>
              {paradoxEngine.active_paradoxes.map((paradox) => (
                <TouchableOpacity
                  key={paradox.paradox_id}
                  style={[
                    styles.paradoxCard,
                    selectedParadox?.paradox_id === paradox.paradox_id && styles.paradoxCardSelected
                  ]}
                  onPress={() => setSelectedParadox(
                    selectedParadox?.paradox_id === paradox.paradox_id ? null : paradox
                  )}
                >
                  <View style={styles.paradoxHeader}>
                    <Text style={styles.paradoxState}>{paradox.current_state.toUpperCase()}</Text>
                    <Text style={styles.paradoxTension}>{paradox.tension_score.toFixed(0)}% tension</Text>
                  </View>
                  <Text style={styles.paradoxThesis} numberOfLines={2}>
                    &ldquo;{paradox.thesis}&rdquo;
                  </Text>
                  <Text style={styles.paradoxVs}>vs</Text>
                  <Text style={styles.paradoxAntithesis} numberOfLines={2}>
                    &ldquo;{paradox.antithesis}&rdquo;
                  </Text>
                  {paradox.synthesis && (
                    <View style={styles.synthesisPreview}>
                      <Text style={styles.synthesisLabel}>Synthesis:</Text>
                      <Text style={styles.synthesisText} numberOfLines={3}>
                        {paradox.synthesis.statement}
                      </Text>
                      <View style={styles.synthesisOverlay}>
                        {paradox.synthesis.overlay.map((symbol, index) => (
                          <Text key={index} style={styles.overlaySymbol}>{symbol}</Text>
                        ))}
                      </View>
                    </View>
                  )}
                  <Text style={styles.paradoxAttempts}>
                    {paradox.resolution_attempts.length} resolution attempts
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}

          {viewMode === 'quantum' && paradoxEngine && (
            <View style={styles.quantumView}>
              <View style={styles.quantumMetrics}>
                <View style={styles.quantumGauge}>
                  <Text style={styles.quantumLabel}>Quantum Coherence</Text>
                  <View style={styles.gaugeContainer}>
                    <View 
                      style={[
                        styles.gaugeBar, 
                        { width: `${paradoxEngine.quantum_coherence * 100}%` }
                      ]} 
                    />
                  </View>
                  <Text style={styles.quantumValue}>
                    {(paradoxEngine.quantum_coherence * 100).toFixed(2)}%
                  </Text>
                </View>
                
                <View style={styles.quantumStats}>
                  <View style={styles.quantumStat}>
                    <Text style={styles.quantumStatLabel}>Transcended</Text>
                    <Text style={styles.quantumStatValue}>
                      {paradoxEngine.active_paradoxes.filter(p => p.current_state === 'transcended').length}
                    </Text>
                  </View>
                  <View style={styles.quantumStat}>
                    <Text style={styles.quantumStatLabel}>Synthesized</Text>
                    <Text style={styles.quantumStatValue}>
                      {paradoxEngine.active_paradoxes.filter(p => p.current_state === 'synthesized').length}
                    </Text>
                  </View>
                  <View style={styles.quantumStat}>
                    <Text style={styles.quantumStatLabel}>Resolving</Text>
                    <Text style={styles.quantumStatValue}>
                      {paradoxEngine.active_paradoxes.filter(p => p.current_state === 'resolving').length}
                    </Text>
                  </View>
                </View>
              </View>
              
              <ScrollView style={styles.genealogyList}>
                <Text style={styles.genealogyTitle}>Synthesis Genealogy</Text>
                {paradoxEngine.synthesis_genealogy.map((entry, index) => (
                  <View key={index} style={styles.genealogyEntry}>
                    <Text style={styles.genealogyParent}>{entry.parent_synthesis}</Text>
                    <Text style={styles.genealogyType}>{entry.mutation_type}</Text>
                    <Text style={styles.genealogyChildren}>
                      {entry.child_syntheses.length} children
                    </Text>
                  </View>
                ))}
              </ScrollView>
            </View>
          )}
        </Animated.View>

        {/* Query Results Panel */}
        {queryResults && (
          <Animated.View style={styles.queryResultsPanel}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.queryResultsHeader}>
                <Text style={styles.queryResultsTitle}>Memory Query Results</Text>
                <TouchableOpacity onPress={() => setQueryResults(null)}>
                  <Text style={styles.closeButton}>✕</Text>
                </TouchableOpacity>
              </View>
              
              {queryResults.success ? (
                <View style={styles.queryResultsContent}>
                  {queryResults.data && (
                    <>
                      {/* Symbol Genealogy Results */}
                      {queryResults.data.symbol && (
                        <View style={styles.resultSection}>
                          <Text style={styles.resultSectionTitle}>Symbol: {queryResults.data.symbol.symbol}</Text>
                          <Text style={styles.resultText}>Usage: {queryResults.data.symbol.usage_count} times</Text>
                          <Text style={styles.resultText}>Genealogy Depth: {queryResults.data.genealogy_depth}</Text>
                          <Text style={styles.resultText}>Connections: {queryResults.data.connections.length}</Text>
                          {queryResults.data.symbol.context_fragments.map((fragment: string, index: number) => (
                            <Text key={index} style={styles.fragmentResult}>&ldquo;{fragment}&rdquo;</Text>
                          ))}
                        </View>
                      )}
                      
                      {/* Pattern Search Results */}
                      {queryResults.data.patterns && (
                        <View style={styles.resultSection}>
                          <Text style={styles.resultSectionTitle}>Patterns Found: {queryResults.data.total_found}</Text>
                          {queryResults.data.patterns.slice(0, 3).map((pattern: any, index: number) => (
                            <View key={index} style={styles.patternResult}>
                              <Text style={styles.patternType}>{pattern.pattern_type}</Text>
                              <Text style={styles.patternSuccess}>Success Rate: {(pattern.success_rate * 100).toFixed(0)}%</Text>
                              <Text style={styles.patternTriggers}>
                                Triggers: {pattern.trigger_conditions.join(', ')}
                              </Text>
                            </View>
                          ))}
                        </View>
                      )}
                      
                      {/* Coherence Prediction Results */}
                      {queryResults.data.predicted_coherence !== undefined && (
                        <View style={styles.resultSection}>
                          <Text style={styles.resultSectionTitle}>Coherence Prediction</Text>
                          <Text style={styles.coherenceResult}>
                            Baseline: {(queryResults.data.baseline_coherence * 100).toFixed(1)}%
                          </Text>
                          <Text style={styles.coherenceResult}>
                            Predicted: {(queryResults.data.predicted_coherence * 100).toFixed(1)}%
                          </Text>
                          <Text style={styles.coherenceResult}>
                            Confidence: {(queryResults.data.confidence_score * 100).toFixed(0)}%
                          </Text>
                          <Text style={styles.coherenceResult}>
                            Transcendence Likelihood: {(queryResults.data.transcendence_likelihood * 100).toFixed(0)}%
                          </Text>
                        </View>
                      )}
                      
                      {/* Transcendence Patterns Results */}
                      {queryResults.data.transcendent_count !== undefined && (
                        <View style={styles.resultSection}>
                          <Text style={styles.resultSectionTitle}>Transcendence Analysis</Text>
                          <Text style={styles.transcendenceResult}>
                            Transcendent Resolutions: {queryResults.data.transcendent_count}
                          </Text>
                          <Text style={styles.transcendenceResult}>
                            Highest φ Achieved: {(queryResults.data.highest_coherence_achieved * 100).toFixed(1)}%
                          </Text>
                          {queryResults.data.top_transcendent_symbols.map((item: any, index: number) => (
                            <Text key={index} style={styles.symbolFrequency}>
                              {item.symbol}: {item.frequency} times
                            </Text>
                          ))}
                        </View>
                      )}
                      
                      {/* Similar Paradoxes Results */}
                      {queryResults.data.similar_paradoxes && (
                        <View style={styles.resultSection}>
                          <Text style={styles.resultSectionTitle}>
                            Similar Paradoxes: {queryResults.data.similar_paradoxes.length}
                          </Text>
                          {queryResults.data.similar_paradoxes.slice(0, 2).map((paradox: any, index: number) => (
                            <View key={index} style={styles.similarParadoxResult}>
                              <Text style={styles.paradoxThesisResult}>&ldquo;{paradox.thesis}&rdquo;</Text>
                              <Text style={styles.paradoxVsResult}>vs</Text>
                              <Text style={styles.paradoxAntithesisResult}>&ldquo;{paradox.antithesis}&rdquo;</Text>
                              <Text style={styles.paradoxResolutionResult}>
                                {paradox.resolution_path} → φ{(paradox.final_coherence / 1.618).toFixed(2)}
                              </Text>
                            </View>
                          ))}
                        </View>
                      )}
                      
                      {/* Emotional Resonance Results */}
                      {queryResults.data.resonant_symbols && (
                        <View style={styles.resultSection}>
                          <Text style={styles.resultSectionTitle}>
                            Resonant Symbols: {queryResults.data.resonant_symbols.length}
                          </Text>
                          {queryResults.data.resonant_symbols.slice(0, 3).map((symbol: any, index: number) => (
                            <View key={index} style={styles.resonantSymbolResult}>
                              <Text style={styles.resonantSymbol}>{symbol.symbol}</Text>
                              <Text style={styles.resonanceScore}>
                                Resonance: {(queryResults.data.resonance_scores[index] * 100).toFixed(0)}%
                              </Text>
                            </View>
                          ))}
                        </View>
                      )}
                    </>
                  )}
                </View>
              ) : (
                <View style={styles.queryError}>
                  <Text style={styles.queryErrorText}>Query failed: {queryResults.error}</Text>
                </View>
              )}
            </ScrollView>
          </Animated.View>
        )}

        {/* Details Panel */}
        {(selectedNode || selectedParadox) && !queryResults && (
          <Animated.View style={styles.detailsPanel}>
            <ScrollView showsVerticalScrollIndicator={false}>
              {selectedNode && (
                <>
                  <View style={styles.detailsHeader}>
                    <Text style={styles.detailsSymbol}>{selectedNode.symbol}</Text>
                    <View style={styles.detailsStats}>
                      <View style={styles.statItem}>
                        <Sparkles size={16} color="#e94560" />
                        <Text style={styles.statText}>{selectedNode.usage_count} uses</Text>
                      </View>
                      <View style={styles.statItem}>
                        <Network size={16} color="#4ecdc4" />
                        <Text style={styles.statText}>
                          {selectedNode.coherence_contributions.length} sessions
                        </Text>
                      </View>
                      <View style={styles.statItem}>
                        <Zap size={16} color="#ffd93d" />
                        <Text style={styles.statText}>
                          {selectedNode.coherence_contributions.length > 0
                            ? (selectedNode.coherence_contributions.reduce((a, b) => a + b, 0) / 
                               selectedNode.coherence_contributions.length * 100).toFixed(1)
                            : '0'}% avg coherence
                        </Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.detailsSection}>
                    <Text style={styles.sectionTitle}>Emotional Resonance</Text>
                    <View style={styles.emotionGrid}>
                      <View style={styles.emotionItem}>
                        <Text style={styles.emotionLabel}>Valence</Text>
                        <Text style={styles.emotionValue}>
                          {(selectedNode.emotional_resonance.valence * 100).toFixed(0)}%
                        </Text>
                      </View>
                      <View style={styles.emotionItem}>
                        <Text style={styles.emotionLabel}>Arousal</Text>
                        <Text style={styles.emotionValue}>
                          {(selectedNode.emotional_resonance.arousal * 100).toFixed(0)}%
                        </Text>
                      </View>
                      <View style={styles.emotionItem}>
                        <Text style={styles.emotionLabel}>Dominance</Text>
                        <Text style={styles.emotionValue}>
                          {(selectedNode.emotional_resonance.dominance * 100).toFixed(0)}%
                        </Text>
                      </View>
                      <View style={styles.emotionItem}>
                        <Text style={styles.emotionLabel}>Entropy</Text>
                        <Text style={styles.emotionValue}>
                          {(selectedNode.emotional_resonance.entropy * 100).toFixed(0)}%
                        </Text>
                      </View>
                    </View>
                  </View>

                  {selectedNode.context_fragments.length > 0 && (
                    <View style={styles.detailsSection}>
                      <Text style={styles.sectionTitle}>Context Fragments</Text>
                      {selectedNode.context_fragments.map((fragment, index) => (
                        <View key={index} style={styles.fragmentItem}>
                          <Text style={styles.fragmentText}>&ldquo;{fragment}&rdquo;</Text>
                        </View>
                      ))}
                    </View>
                  )}
                </>
              )}

              {selectedParadox && (
                <>
                  <View style={styles.detailsHeader}>
                    <Text style={styles.detailsSymbol}>🌀</Text>
                    <Text style={styles.paradoxDetailTitle}>{selectedParadox.paradox_id}</Text>
                    <View style={styles.detailsStats}>
                      <View style={styles.statItem}>
                        <Zap size={16} color="#e94560" />
                        <Text style={styles.statText}>{selectedParadox.tension_score.toFixed(0)}% tension</Text>
                      </View>
                      <View style={styles.statItem}>
                        <Network size={16} color="#4ecdc4" />
                        <Text style={styles.statText}>
                          {selectedParadox.resolution_attempts.length} attempts
                        </Text>
                      </View>
                      <View style={styles.statItem}>
                        <Sparkles size={16} color="#ffd93d" />
                        <Text style={styles.statText}>{selectedParadox.current_state}</Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.detailsSection}>
                    <Text style={styles.sectionTitle}>Thesis</Text>
                    <Text style={styles.paradoxDetailText}>{selectedParadox.thesis}</Text>
                  </View>

                  <View style={styles.detailsSection}>
                    <Text style={styles.sectionTitle}>Antithesis</Text>
                    <Text style={styles.paradoxDetailText}>{selectedParadox.antithesis}</Text>
                  </View>

                  {selectedParadox.synthesis && (
                    <View style={styles.detailsSection}>
                      <Text style={styles.sectionTitle}>Synthesis</Text>
                      <Text style={styles.paradoxDetailText}>{selectedParadox.synthesis.statement}</Text>
                      <View style={styles.synthesisMetrics}>
                        <Text style={styles.metricsLabel}>φ-Gate: {(selectedParadox.synthesis.metrics.phiGate * 100).toFixed(1)}%</Text>
                        <Text style={styles.metricsLabel}>Tension: {(selectedParadox.synthesis.metrics.tension * 100).toFixed(1)}%</Text>
                        <Text style={styles.metricsLabel}>Path: {selectedParadox.synthesis.resolution_path}</Text>
                      </View>
                    </View>
                  )}
                </>
              )}
            </ScrollView>
          </Animated.View>
        )}

        {/* Stats */}
        <View style={styles.statsContainer}>
          {viewMode === 'symbols' && (
            <>
              <View style={styles.statCard}>
                <Eye size={16} color="#e94560" />
                <Text style={styles.statCardText}>{constellation.nodes.length} symbols</Text>
              </View>
              <View style={styles.statCard}>
                <Network size={16} color="#4ecdc4" />
                <Text style={styles.statCardText}>{constellation.connections.length} connections</Text>
              </View>
              <View style={styles.statCard}>
                <Sparkles size={16} color="#ffd93d" />
                <Text style={styles.statCardText}>{constellation.clusters.length} clusters</Text>
              </View>
            </>
          )}
          {(viewMode === 'paradoxes' || viewMode === 'quantum') && paradoxEngine && (
            <>
              <View style={styles.statCard}>
                <Zap size={16} color="#e94560" />
                <Text style={styles.statCardText}>
                  {paradoxEngine.active_paradoxes.filter(p => p.synthesis).length} resolved
                </Text>
              </View>
              <View style={styles.statCard}>
                <Network size={16} color="#4ecdc4" />
                <Text style={styles.statCardText}>
                  {(paradoxEngine.quantum_coherence * 100).toFixed(0)}% coherence
                </Text>
              </View>
              <View style={styles.statCard}>
                <Sparkles size={16} color="#ffd93d" />
                <Text style={styles.statCardText}>
                  {paradoxEngine.synthesis_genealogy.length} genealogy
                </Text>
              </View>
            </>
          )}
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#888',
    fontSize: 16,
    marginTop: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorText: {
    color: '#ff6b6b',
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#e94560',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  backButton: {
    padding: 8,
  },
  headerCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  headerRight: {
    flexDirection: 'row',
    gap: 8,
  },
  headerButton: {
    padding: 8,
  },
  viewModeContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  viewModeButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
  },
  viewModeButtonActive: {
    backgroundColor: '#e94560',
  },
  viewModeText: {
    color: '#888',
    fontSize: 14,
    fontWeight: '500',
  },
  viewModeTextActive: {
    color: '#fff',
  },
  constellationContainer: {
    flex: 1,
    margin: 16,
  },
  constellationCanvas: {
    flex: 1,
    position: 'relative',
  },
  constellationNode: {
    position: 'absolute',
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  nodeButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nodeSymbol: {
    color: '#fff',
    fontWeight: 'bold',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  connectionLine: {
    position: 'absolute',
    height: 2,
    transformOrigin: 'left center',
  },
  detailsPanel: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    margin: 16,
    borderRadius: 12,
    padding: 16,
    maxHeight: 200,
  },
  detailsHeader: {
    marginBottom: 16,
  },
  detailsSymbol: {
    fontSize: 32,
    color: '#e94560',
    textAlign: 'center',
    marginBottom: 8,
  },
  detailsStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    color: '#aaa',
    fontSize: 12,
  },
  detailsSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  emotionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  emotionItem: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 8,
    borderRadius: 6,
    alignItems: 'center',
  },
  emotionLabel: {
    color: '#888',
    fontSize: 10,
    marginBottom: 2,
  },
  emotionValue: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  fragmentItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 8,
    borderRadius: 6,
    marginBottom: 4,
  },
  fragmentText: {
    color: '#aaa',
    fontSize: 12,
    fontStyle: 'italic',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 8,
  },
  statCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 6,
  },
  statCardText: {
    color: '#aaa',
    fontSize: 12,
    fontWeight: '500',
  },
  engineStatusContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  engineStatus: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
    padding: 12,
    justifyContent: 'space-between',
  },
  statusItem: {
    alignItems: 'center',
  },
  statusLabel: {
    color: '#888',
    fontSize: 10,
    marginBottom: 4,
  },
  statusValue: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  paradoxList: {
    flex: 1,
    padding: 16,
  },
  paradoxCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  paradoxCardSelected: {
    borderColor: '#e94560',
    backgroundColor: 'rgba(233, 69, 96, 0.1)',
  },
  paradoxHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  paradoxState: {
    color: '#4ecdc4',
    fontSize: 12,
    fontWeight: '600',
  },
  paradoxTension: {
    color: '#ffd93d',
    fontSize: 12,
  },
  paradoxThesis: {
    color: '#fff',
    fontSize: 14,
    marginBottom: 4,
  },
  paradoxVs: {
    color: '#888',
    fontSize: 12,
    textAlign: 'center',
    marginVertical: 4,
  },
  paradoxAntithesis: {
    color: '#aaa',
    fontSize: 14,
    marginBottom: 8,
  },
  synthesisPreview: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
    padding: 8,
    marginBottom: 8,
  },
  synthesisLabel: {
    color: '#e94560',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  synthesisText: {
    color: '#ccc',
    fontSize: 12,
    marginBottom: 4,
  },
  synthesisOverlay: {
    flexDirection: 'row',
    gap: 4,
  },
  overlaySymbol: {
    color: '#ffd93d',
    fontSize: 14,
  },
  paradoxAttempts: {
    color: '#888',
    fontSize: 10,
  },
  quantumView: {
    flex: 1,
    padding: 16,
  },
  quantumMetrics: {
    marginBottom: 24,
  },
  quantumGauge: {
    marginBottom: 16,
  },
  quantumLabel: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  gaugeContainer: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 4,
    marginBottom: 8,
  },
  gaugeBar: {
    height: '100%',
    backgroundColor: '#4ecdc4',
    borderRadius: 4,
  },
  quantumValue: {
    color: '#4ecdc4',
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  quantumStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  quantumStat: {
    alignItems: 'center',
  },
  quantumStatLabel: {
    color: '#888',
    fontSize: 12,
    marginBottom: 4,
  },
  quantumStatValue: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  genealogyList: {
    flex: 1,
  },
  genealogyTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  genealogyEntry: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  genealogyParent: {
    color: '#fff',
    fontSize: 12,
    flex: 1,
  },
  genealogyType: {
    color: '#e94560',
    fontSize: 10,
    fontWeight: '600',
  },
  genealogyChildren: {
    color: '#888',
    fontSize: 10,
  },
  paradoxDetailTitle: {
    color: '#fff',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 8,
  },
  paradoxDetailText: {
    color: '#ccc',
    fontSize: 14,
    lineHeight: 20,
  },
  synthesisMetrics: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  metricsLabel: {
    color: '#888',
    fontSize: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  queryContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  queryInputContainer: {
    marginBottom: 8,
  },
  queryLabel: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
  },
  queryInputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  queryInput: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#fff',
    fontSize: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  queryButton: {
    backgroundColor: '#e94560',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  queryButtonDisabled: {
    backgroundColor: '#666',
  },
  quickQueries: {
    maxHeight: 40,
  },
  quickQueryButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'rgba(233, 69, 96, 0.3)',
  },
  quickQueryText: {
    color: '#e94560',
    fontSize: 12,
    fontWeight: '500',
  },
  queryResultsPanel: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    margin: 16,
    borderRadius: 12,
    padding: 16,
    maxHeight: 300,
    borderWidth: 1,
    borderColor: 'rgba(233, 69, 96, 0.3)',
  },
  queryResultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  queryResultsTitle: {
    color: '#e94560',
    fontSize: 16,
    fontWeight: '600',
  },
  closeButton: {
    color: '#888',
    fontSize: 18,
    fontWeight: 'bold',
  },
  queryResultsContent: {
    gap: 12,
  },
  resultSection: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  resultSectionTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
  },
  resultText: {
    color: '#aaa',
    fontSize: 12,
    marginBottom: 2,
  },
  fragmentResult: {
    color: '#888',
    fontSize: 11,
    fontStyle: 'italic',
    marginLeft: 8,
  },
  patternResult: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 6,
    padding: 8,
    marginBottom: 4,
  },
  patternType: {
    color: '#4ecdc4',
    fontSize: 12,
    fontWeight: '600',
  },
  patternSuccess: {
    color: '#ffd93d',
    fontSize: 11,
  },
  patternTriggers: {
    color: '#888',
    fontSize: 10,
  },
  coherenceResult: {
    color: '#4ecdc4',
    fontSize: 12,
    marginBottom: 2,
  },
  transcendenceResult: {
    color: '#ffd93d',
    fontSize: 12,
    marginBottom: 2,
  },
  symbolFrequency: {
    color: '#888',
    fontSize: 11,
    marginLeft: 8,
  },
  similarParadoxResult: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 6,
    padding: 8,
    marginBottom: 4,
  },
  paradoxThesisResult: {
    color: '#fff',
    fontSize: 11,
  },
  paradoxVsResult: {
    color: '#888',
    fontSize: 10,
    textAlign: 'center',
    marginVertical: 2,
  },
  paradoxAntithesisResult: {
    color: '#aaa',
    fontSize: 11,
  },
  paradoxResolutionResult: {
    color: '#e94560',
    fontSize: 10,
    fontWeight: '600',
    marginTop: 4,
  },
  resonantSymbolResult: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 6,
    padding: 8,
    marginBottom: 4,
  },
  resonantSymbol: {
    color: '#fff',
    fontSize: 16,
  },
  resonanceScore: {
    color: '#4ecdc4',
    fontSize: 11,
  },
  queryError: {
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    borderRadius: 8,
    padding: 12,
  },
  queryErrorText: {
    color: '#ff6b6b',
    fontSize: 12,
    textAlign: 'center',
  },
});