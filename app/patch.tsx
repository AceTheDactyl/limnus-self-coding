import React, { useEffect, useState, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Code, FileCode, ArrowRight, Hash } from 'lucide-react-native';
import { router } from 'expo-router';
import { useLimnus } from '@/providers/limnus-provider';
import { SafeAreaView } from 'react-native-safe-area-context';
import SymbolOverlayLegend, { type SymbolicOverlay } from '@/components/SymbolOverlayLegend';

export default function PatchScreen() {
  const { generatePatch, currentPatch, setSessionPhase } = useLimnus();
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeFilters, setActiveFilters] = useState<SymbolicOverlay[]>([]);


  const handleGeneration = useCallback(async () => {
    setIsGenerating(true);
    try {
      await generatePatch();
    } catch (error) {
      console.error('Failed to generate patch:', error);
    } finally {
      setIsGenerating(false);
    }
  }, [generatePatch]);

  useEffect(() => {
    handleGeneration();
  }, [handleGeneration]);

  const proceedToSync = () => {
    setSessionPhase('sync');
    router.push('/sync');
  };



  return (
    <LinearGradient
      colors={['#1a1a2e', '#16213e', '#0f3460']}
      style={styles.gradient}
    >
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Code size={32} color="#e94560" />
            <Text style={styles.title}>Patch Composer</Text>
            <Text style={styles.subtitle}>Generating code changes</Text>
          </View>

          {isGenerating ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#e94560" />
              <Text style={styles.loadingText}>Composing patch...</Text>
            </View>
          ) : currentPatch ? (
            <>
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <FileCode size={20} color="#888" />
                  <Text style={styles.sectionTitle}>Change Plan</Text>
                </View>
                <View style={styles.planCard}>
                  <Text style={styles.planText}>{currentPatch.plan}</Text>
                </View>
              </View>

              <SymbolOverlayLegend
                overlays={currentPatch.overlays as SymbolicOverlay[]}
                showCounts={true}
                counts={{
                  Bloom: 2,
                  Mirror: 1,
                  Spiral: 3,
                  Accord: 1,
                }}
                rationale={currentPatch.rationale}
                testLines={[
                  'Recursive observability test for Spiral overlay',
                  'Co-authorship validation for Mirror overlay',
                  'Relational validation test for Bloom overlay',
                  'Active outcome gating for Accord overlay'
                ]}
                onFilterChange={setActiveFilters}
              />

              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Code size={20} color="#888" />
                  <Text style={styles.sectionTitle}>Code Diff</Text>
                </View>
                <View style={styles.diffContainer}>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View>
                      {currentPatch.diff.split('\n').map((line, index) => {
                        const isAddition = line.startsWith('+');
                        const isDeletion = line.startsWith('-');
                        const isHeader = line.startsWith('@@');
                        
                        // Filter diff lines based on active filters
                        const shouldShowLine = activeFilters.length === 0 || 
                          activeFilters.some((filter: SymbolicOverlay) => 
                            line.toLowerCase().includes(filter.toLowerCase()) ||
                            line.includes('∇') || line.includes('🪞') || 
                            line.includes('φ∞') || line.includes('✶')
                          );
                        
                        if (!shouldShowLine) return null;
                        
                        return (
                          <View key={index} style={styles.diffLine}>
                            <Text style={styles.lineNumber}>{index + 1}</Text>
                            <Text style={[
                              styles.diffText,
                              isAddition && styles.diffAddition,
                              isDeletion && styles.diffDeletion,
                              isHeader && styles.diffHeader,
                            ]}>
                              {line}
                            </Text>
                          </View>
                        );
                      })}
                    </View>
                  </ScrollView>
                </View>
              </View>

              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Hash size={20} color="#888" />
                  <Text style={styles.sectionTitle}>Integrity</Text>
                </View>
                <View style={styles.integrityCard}>
                  <Text style={styles.integrityLabel}>Method</Text>
                  <Text style={styles.integrityValue}>TT+CC+SS+PP+RR</Text>
                  <Text style={styles.integrityLabel}>SHA256</Text>
                  <Text style={styles.integrityHash}>{currentPatch.integrity}</Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.proceedButton}
                onPress={proceedToSync}
                testID="proceed-sync"
              >
                <LinearGradient
                  colors={['#e94560', '#c23652']}
                  style={styles.buttonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Text style={styles.buttonText}>Run Sync Test</Text>
                  <ArrowRight size={20} color="#fff" />
                </LinearGradient>
              </TouchableOpacity>
            </>
          ) : null}
        </ScrollView>
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
  scrollContent: {
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: '#fff',
    marginTop: 12,
  },
  subtitle: {
    fontSize: 14,
    color: '#888',
    marginTop: 4,
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 48,
  },
  loadingText: {
    color: '#888',
    marginTop: 12,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  planCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  planText: {
    fontSize: 14,
    color: '#aaa',
    lineHeight: 20,
  },
  overlaysContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  overlayBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  overlayBadgeSelected: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  overlayDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  overlayText: {
    fontSize: 14,
    fontWeight: '600',
  },
  diffContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  diffLine: {
    flexDirection: 'row',
    marginBottom: 2,
  },
  lineNumber: {
    width: 30,
    fontSize: 11,
    color: '#555',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    marginRight: 12,
  },
  diffText: {
    fontSize: 12,
    color: '#aaa',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  diffAddition: {
    color: '#4CAF50',
  },
  diffDeletion: {
    color: '#f44336',
  },
  diffHeader: {
    color: '#2196F3',
  },
  integrityCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  integrityLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  integrityValue: {
    fontSize: 14,
    color: '#fff',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    marginBottom: 12,
  },
  integrityHash: {
    fontSize: 11,
    color: '#888',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  proceedButton: {
    marginTop: 32,
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});