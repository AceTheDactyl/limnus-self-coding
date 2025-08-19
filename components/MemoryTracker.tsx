import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { Brain, Sparkles, Network, Eye, ArrowRight } from 'lucide-react-native';
import { router } from 'expo-router';
import { trpc } from '@/lib/trpc';
import type { SessionMemory, EmotionalVector } from '@/types/limnus';

interface MemoryTrackerProps {
  sessionId: string;
  currentPhase: string;
  onMemoryUpdate?: (memoryData: any) => void;
}

export const MemoryTracker: React.FC<MemoryTrackerProps> = ({
  sessionId,
  currentPhase,
  onMemoryUpdate
}) => {
  const [isTracking, setIsTracking] = useState(false);
  const [memoryStats, setMemoryStats] = useState({
    symbolsTracked: 0,
    patternsDetected: 0,
    coherencePeaks: 0,
    emotionalJourney: [] as EmotionalVector[]
  });
  const [lastConsolidation, setLastConsolidation] = useState<Date | null>(null);

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  const consolidateMutation = trpc.limnus.memory.consolidate.useMutation();

  useEffect(() => {
    // Start memory tracking animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Glow effect when actively tracking
    if (isTracking) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(glowAnim, {
            toValue: 0,
            duration: 1500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      glowAnim.setValue(0);
    }
  }, [isTracking, pulseAnim, glowAnim]);

  // Simulate memory tracking based on session phase
  useEffect(() => {
    const trackMemoryEvent = () => {
      if (!isTracking) return;

      // Simulate detecting symbols and patterns based on phase
      const phaseEmotions: Record<string, EmotionalVector> = {
        'CONSENTED': { valence: 0.3, arousal: 0.6, dominance: 0.7, entropy: 0.4 },
        'REFLECTION_READY': { valence: 0.1, arousal: 0.8, dominance: 0.5, entropy: 0.7 },
        'PLANNED': { valence: 0.6, arousal: 0.7, dominance: 0.8, entropy: 0.3 },
        'DIFFED': { valence: 0.4, arousal: 0.9, dominance: 0.6, entropy: 0.5 },
        'SYNCED': { valence: 0.8, arousal: 0.5, dominance: 0.9, entropy: 0.2 },
        'MERGED': { valence: 0.9, arousal: 0.3, dominance: 0.8, entropy: 0.1 }
      };

      const currentEmotion = phaseEmotions[currentPhase] || { valence: 0.5, arousal: 0.5, dominance: 0.5, entropy: 0.5 };
      
      setMemoryStats(prev => ({
        ...prev,
        emotionalJourney: [...prev.emotionalJourney.slice(-10), currentEmotion], // Keep last 10
        symbolsTracked: prev.symbolsTracked + Math.floor(Math.random() * 2),
        patternsDetected: prev.patternsDetected + (Math.random() > 0.7 ? 1 : 0),
        coherencePeaks: prev.coherencePeaks + (Math.random() > 0.8 ? 1 : 0)
      }));

      if (onMemoryUpdate) {
        onMemoryUpdate({
          phase: currentPhase,
          emotion: currentEmotion,
          timestamp: new Date().toISOString()
        });
      }
    };

    if (isTracking) {
      const interval = setInterval(trackMemoryEvent, 3000); // Track every 3 seconds
      return () => clearInterval(interval);
    }
  }, [isTracking, currentPhase, onMemoryUpdate]);

  const handleStartTracking = () => {
    setIsTracking(true);
    console.log('[MEMORY] Started tracking for session:', sessionId);
  };

  const handleStopTracking = () => {
    setIsTracking(false);
    console.log('[MEMORY] Stopped tracking for session:', sessionId);
  };

  const handleConsolidate = async () => {
    if (memoryStats.emotionalJourney.length === 0) {
      console.log('[MEMORY] No data to consolidate');
      return;
    }

    try {
      const sessionMemory: SessionMemory = {
        session_id: sessionId,
        emotional_journey: memoryStats.emotionalJourney,
        symbol_births: ['∇', '🪞', 'φ', '∞'], // Mock symbols - in real app, extract from session data
        symbol_deaths: [],
        pattern_activations: [],
        coherence_peaks: Array.from({ length: memoryStats.coherencePeaks }, (_, i) => ({
          timestamp: new Date(Date.now() - i * 60000).toISOString(),
          value: 0.7 + Math.random() * 0.3,
          context: `Phase: ${currentPhase}`
        })),
        paradox_resolutions: [],
        teaching_directive_themes: ['self-reflection', 'recursive patterns', 'emergence']
      };

      console.log('[MEMORY] Consolidating session memory:', sessionMemory);

      const result = await consolidateMutation.mutateAsync({
        session_memories: [sessionMemory],
        consolidation_depth: 'deep'
      });

      if (result.success) {
        setLastConsolidation(new Date());
        console.log('[MEMORY] Consolidation successful:', result.consolidation_summary);
      }
    } catch (error) {
      console.error('[MEMORY] Consolidation failed:', error);
    }
  };

  const handleViewConstellation = () => {
    router.push('/constellation');
  };

  return (
    <View style={styles.container}>
      <Animated.View 
        style={[
          styles.memoryTracker,
          {
            transform: [{ scale: pulseAnim }],
            shadowOpacity: Animated.add(0.2, Animated.multiply(glowAnim, 0.3)),
          }
        ]}
      >
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Animated.View style={[styles.brainIcon, { opacity: Animated.add(0.7, Animated.multiply(glowAnim, 0.3)) }]}>
              <Brain size={20} color="#e94560" />
            </Animated.View>
            <Text style={styles.title}>Memory Constellation</Text>
          </View>
          <View style={styles.statusIndicator}>
            <View style={[styles.statusDot, { backgroundColor: isTracking ? '#4ecdc4' : '#666' }]} />
            <Text style={styles.statusText}>{isTracking ? 'Tracking' : 'Idle'}</Text>
          </View>
        </View>

        <View style={styles.stats}>
          <View style={styles.statItem}>
            <Sparkles size={14} color="#ffd93d" />
            <Text style={styles.statValue}>{memoryStats.symbolsTracked}</Text>
            <Text style={styles.statLabel}>Symbols</Text>
          </View>
          <View style={styles.statItem}>
            <Network size={14} color="#4ecdc4" />
            <Text style={styles.statValue}>{memoryStats.patternsDetected}</Text>
            <Text style={styles.statLabel}>Patterns</Text>
          </View>
          <View style={styles.statItem}>
            <Eye size={14} color="#ff6b6b" />
            <Text style={styles.statValue}>{memoryStats.coherencePeaks}</Text>
            <Text style={styles.statLabel}>Peaks</Text>
          </View>
        </View>

        <View style={styles.controls}>
          {!isTracking ? (
            <TouchableOpacity 
              style={styles.trackButton} 
              onPress={handleStartTracking}
              testID="start-memory-tracking"
            >
              <Text style={styles.trackButtonText}>Start Tracking</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity 
              style={[styles.trackButton, styles.stopButton]} 
              onPress={handleStopTracking}
              testID="stop-memory-tracking"
            >
              <Text style={styles.trackButtonText}>Stop Tracking</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity 
            style={styles.consolidateButton} 
            onPress={handleConsolidate}
            disabled={consolidateMutation.isPending || memoryStats.emotionalJourney.length === 0}
            testID="consolidate-memory"
          >
            {consolidateMutation.isPending ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.consolidateButtonText}>Consolidate</Text>
            )}
          </TouchableOpacity>
        </View>

        {lastConsolidation && (
          <View style={styles.lastConsolidation}>
            <Text style={styles.lastConsolidationText}>
              Last consolidated: {lastConsolidation.toLocaleTimeString()}
            </Text>
          </View>
        )}

        <TouchableOpacity 
          style={styles.viewConstellationButton} 
          onPress={handleViewConstellation}
          testID="view-constellation"
        >
          <Text style={styles.viewConstellationText}>View Constellation</Text>
          <ArrowRight size={16} color="#e94560" />
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  memoryTracker: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(233, 69, 96, 0.2)',
    shadowColor: '#e94560',
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brainIcon: {
    padding: 4,
  },
  title: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    color: '#888',
    fontSize: 12,
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 8,
  },
  statItem: {
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  statLabel: {
    color: '#888',
    fontSize: 10,
  },
  controls: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  trackButton: {
    flex: 1,
    backgroundColor: '#4ecdc4',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  stopButton: {
    backgroundColor: '#ff6b6b',
  },
  trackButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  consolidateButton: {
    flex: 1,
    backgroundColor: '#e94560',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  consolidateButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  lastConsolidation: {
    marginBottom: 8,
  },
  lastConsolidationText: {
    color: '#666',
    fontSize: 11,
    textAlign: 'center',
  },
  viewConstellationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    marginTop: 8,
  },
  viewConstellationText: {
    color: '#e94560',
    fontSize: 14,
    fontWeight: '500',
  },
});