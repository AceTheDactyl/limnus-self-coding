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
import type { ConstellationMap, SymbolNode, EmotionalVector } from '@/types/limnus';

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
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'full' | 'emotional' | 'genealogy'>('full');

  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Mock data for demonstration - in real app, this would come from memory consolidation
  useEffect(() => {
    const loadConstellation = async () => {
      try {
        // Simulate loading constellation data
        await new Promise(resolve => setTimeout(resolve, 1000));
        
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
  }, [fadeAnim]);

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
            <TouchableOpacity style={styles.headerButton}>
              <Search size={20} color="#666" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerButton}>
              <Filter size={20} color="#666" />
            </TouchableOpacity>
          </View>
        </View>

        {/* View Mode Selector */}
        <View style={styles.viewModeContainer}>
          {(['full', 'emotional', 'genealogy'] as const).map((mode) => (
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

        {/* Constellation Visualization */}
        <Animated.View style={[styles.constellationContainer, { opacity: fadeAnim }]}>
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
        </Animated.View>

        {/* Node Details Panel */}
        {selectedNode && (
          <Animated.View style={styles.detailsPanel}>
            <ScrollView showsVerticalScrollIndicator={false}>
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
            </ScrollView>
          </Animated.View>
        )}

        {/* Constellation Stats */}
        <View style={styles.statsContainer}>
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
});