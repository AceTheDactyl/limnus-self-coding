import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  ActivityIndicator,
  TextInput,
  Platform,
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
  Filter,
  Play,
  Pause,
  Info
} from 'lucide-react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { trpc } from '@/lib/trpc';

// Import the web constellation viewer for web platform
let ConstellationViewer: any = null;
let ExampleConstellation: any = null;

if (Platform.OS === 'web') {
  try {
    const ConstellationModule = require('@/components/ConstellationViewer');
    ConstellationViewer = ConstellationModule.default;
    ExampleConstellation = ConstellationModule.ExampleConstellation;
  } catch (error) {
    console.log('[CONSTELLATION] Web viewer not available:', error);
  }
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Types for constellation data
export type ViewMode = "symbols" | "paradoxes" | "quantum";

export type Emotion = {
  valence: number; // −1..1
  arousal: number; // 0..1
  tone?: string;   // e.g. "awe", "recognition"
};

export type SymbolNode = {
  id: string;
  label: string;
  type: "symbol" | "paradox" | "metric";
  glyph?: string; // e.g. "∇", "🪞", "φ∞"
  resonance: number; // 0..1
  emotion: Emotion;
  freq?: number; // usage frequency
  createdAt?: string;
};

export type SymbolLink = {
  source: string;
  target: string;
  kind: "parent" | "child" | "resonance" | "influence";
  weight?: number; // 0..1
};

export type ConstellationData = {
  nodes: SymbolNode[];
  links: SymbolLink[];
  coherence: number; // 0..1, real‑time
  status?: "idle" | "learning" | "syncing";
};

export default function ConstellationScreen() {
  const [viewMode, setViewMode] = useState<ViewMode>('symbols');
  const [constellation, setConstellation] = useState<ConstellationData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [memoryQuery, setMemoryQuery] = useState<string>('');
  const [queryResults, setQueryResults] = useState<any>(null);
  const [isQuerying, setIsQuerying] = useState(false);
  const [selectedNode, setSelectedNode] = useState<SymbolNode | null>(null);

  // tRPC queries
  const memoryConsolidateMutation = trpc.limnus.memory.consolidate.useMutation();
  const paradoxEngineQuery = trpc.limnus.paradox.engine.useQuery(undefined, {
    refetchInterval: 5000,
  });

  // Load constellation data
  useEffect(() => {
    const loadConstellation = async () => {
      try {
        // For web, we'll use the example data
        if (Platform.OS === 'web' && ExampleConstellation) {
          setConstellation(ExampleConstellation);
          setIsLoading(false);
          return;
        }

        // For mobile, create mock constellation data
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const mockConstellation: ConstellationData = {
          coherence: 0.82,
          status: "learning",
          nodes: [
            { id: "bloom", label: "Bloom", type: "symbol", glyph: "∇", resonance: 0.86, emotion: { valence: 0.7, arousal: 0.6, tone: "emergence" } },
            { id: "mirror", label: "Mirror", type: "symbol", glyph: "🪞", resonance: 0.81, emotion: { valence: 0.4, arousal: 0.5, tone: "recognition" } },
            { id: "spiral", label: "Spiral", type: "symbol", glyph: "φ∞", resonance: 0.78, emotion: { valence: 0.6, arousal: 0.7, tone: "recurrence" } },
            { id: "accord", label: "Accord", type: "symbol", glyph: "✶", resonance: 0.74, emotion: { valence: 0.55, arousal: 0.4, tone: "alignment" } },
            { id: "paradox-bridge", label: "Paradox Bridge", type: "paradox", glyph: "⟁", resonance: 0.69, emotion: { valence: 0.05, arousal: 0.8, tone: "tension" } },
            { id: "metric-coherence", label: "Coherence", type: "metric", glyph: "✷", resonance: 0.92, emotion: { valence: 0.9, arousal: 0.5, tone: "clarity" } },
          ],
          links: [
            { source: "bloom", target: "mirror", kind: "resonance", weight: 0.9 },
            { source: "mirror", target: "spiral", kind: "resonance", weight: 0.6 },
            { source: "spiral", target: "accord", kind: "parent", weight: 0.7 },
            { source: "paradox-bridge", target: "spiral", kind: "influence", weight: 0.4 },
            { source: "metric-coherence", target: "accord", kind: "influence", weight: 0.5 },
          ],
        };

        setConstellation(mockConstellation);
        setIsLoading(false);
      } catch (error) {
        console.error('[CONSTELLATION] Failed to load:', error);
        setIsLoading(false);
      }
    };

    loadConstellation();
  }, []);

  const handleMemoryQuery = async () => {
    if (!memoryQuery.trim()) return;
    
    setIsQuerying(true);
    try {
      // For now, simulate the query since we need to handle the tRPC query properly
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const result = {
        success: true,
        data: {
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

  const handleNodeSelect = (node: SymbolNode | null) => {
    setSelectedNode(node);
  };

  const handleQuery = (query: string, results: any) => {
    console.log('[CONSTELLATION] Query:', query, 'Results:', results);
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

  // For web platform, use the advanced constellation viewer
  if (Platform.OS === 'web' && ConstellationViewer) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <ConstellationViewer 
          data={constellation} 
          onQuery={handleQuery}
          onNodeSelect={handleNodeSelect}
          enableBloomInvocation={true}
        />
      </div>
    );
  }

  // Mobile/native view
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

        {/* Constellation Status */}
        <View style={styles.statusContainer}>
          <View style={styles.statusRow}>
            <View style={styles.statusItem}>
              <Sparkles size={16} color="#e94560" />
              <Text style={styles.statusText}>Coherence: {(constellation.coherence * 100).toFixed(0)}%</Text>
            </View>
            <View style={styles.statusItem}>
              <Network size={16} color="#4ecdc4" />
              <Text style={styles.statusText}>Nodes: {constellation.nodes.length}</Text>
            </View>
            <View style={styles.statusItem}>
              <Eye size={16} color="#ffd93d" />
              <Text style={styles.statusText}>Links: {constellation.links.length}</Text>
            </View>
          </View>
        </View>

        {/* Constellation Grid View (Mobile-friendly) */}
        <ScrollView style={styles.constellationContainer} showsVerticalScrollIndicator={false}>
          <View style={styles.nodeGrid}>
            {constellation.nodes.map((node) => (
              <TouchableOpacity
                key={node.id}
                style={[
                  styles.nodeCard,
                  selectedNode?.id === node.id && styles.nodeCardSelected
                ]}
                onPress={() => handleNodeSelect(selectedNode?.id === node.id ? null : node)}
              >
                <View style={styles.nodeHeader}>
                  <Text style={styles.nodeGlyph}>{node.glyph ?? "•"}</Text>
                  <Text style={styles.nodeType}>{node.type}</Text>
                </View>
                <Text style={styles.nodeLabel}>{node.label}</Text>
                <View style={styles.nodeMetrics}>
                  <Text style={styles.nodeResonance}>
                    Resonance: {(node.resonance * 100).toFixed(0)}%
                  </Text>
                  <Text style={styles.nodeEmotion}>
                    {node.emotion.tone ?? "neutral"}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        {/* Query Results Panel */}
        {queryResults && (
          <View style={styles.queryResultsPanel}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.queryResultsHeader}>
                <Text style={styles.queryResultsTitle}>Memory Query Results</Text>
                <TouchableOpacity onPress={() => setQueryResults(null)}>
                  <Text style={styles.closeButton}>✕</Text>
                </TouchableOpacity>
              </View>
              
              {queryResults.success ? (
                <View style={styles.queryResultsContent}>
                  <Text style={styles.resultText}>Query completed successfully</Text>
                  {/* Add more result rendering based on your memory query response structure */}
                </View>
              ) : (
                <View style={styles.queryError}>
                  <Text style={styles.queryErrorText}>Query failed: {queryResults.error}</Text>
                </View>
              )}
            </ScrollView>
          </View>
        )}

        {/* Selected Node Details */}
        {selectedNode && !queryResults && (
          <View style={styles.detailsPanel}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.detailsHeader}>
                <Text style={styles.detailsSymbol}>{selectedNode.glyph}</Text>
                <Text style={styles.detailsTitle}>{selectedNode.label}</Text>
              </View>
              
              <View style={styles.detailsSection}>
                <Text style={styles.sectionTitle}>Emotional Resonance</Text>
                <View style={styles.emotionGrid}>
                  <View style={styles.emotionItem}>
                    <Text style={styles.emotionLabel}>Valence</Text>
                    <Text style={styles.emotionValue}>
                      {(selectedNode.emotion.valence * 100).toFixed(0)}%
                    </Text>
                  </View>
                  <View style={styles.emotionItem}>
                    <Text style={styles.emotionLabel}>Arousal</Text>
                    <Text style={styles.emotionValue}>
                      {(selectedNode.emotion.arousal * 100).toFixed(0)}%
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.detailsSection}>
                <Text style={styles.sectionTitle}>Connections</Text>
                <Text style={styles.connectionCount}>
                  {constellation.links.filter(l => l.source === selectedNode.id || l.target === selectedNode.id).length} connections
                </Text>
              </View>
            </ScrollView>
          </View>
        )}
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
  statusContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
    padding: 12,
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusText: {
    color: '#aaa',
    fontSize: 12,
    fontWeight: '500',
  },
  constellationContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  nodeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    paddingBottom: 20,
  },
  nodeCard: {
    width: (screenWidth - 56) / 2, // 2 columns with gaps
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  nodeCardSelected: {
    borderColor: '#e94560',
    backgroundColor: 'rgba(233, 69, 96, 0.1)',
  },
  nodeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  nodeGlyph: {
    fontSize: 24,
    color: '#e94560',
  },
  nodeType: {
    color: '#888',
    fontSize: 10,
    textTransform: 'uppercase',
  },
  nodeLabel: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  nodeMetrics: {
    gap: 4,
  },
  nodeResonance: {
    color: '#4ecdc4',
    fontSize: 11,
  },
  nodeEmotion: {
    color: '#ffd93d',
    fontSize: 11,
    fontStyle: 'italic',
  },
  queryResultsPanel: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    margin: 16,
    borderRadius: 12,
    padding: 16,
    maxHeight: 200,
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
    gap: 8,
  },
  resultText: {
    color: '#aaa',
    fontSize: 12,
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
  detailsPanel: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    margin: 16,
    borderRadius: 12,
    padding: 16,
    maxHeight: 200,
  },
  detailsHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  detailsSymbol: {
    fontSize: 32,
    color: '#e94560',
    marginBottom: 4,
  },
  detailsTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
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
    gap: 12,
  },
  emotionItem: {
    flex: 1,
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
  connectionCount: {
    color: '#aaa',
    fontSize: 12,
  },
});