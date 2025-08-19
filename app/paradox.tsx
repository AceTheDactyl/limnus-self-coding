import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  Animated,
  ScrollView,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Zap, Circle } from 'lucide-react-native';
import { Stack } from 'expo-router';
import { trpc } from '@/lib/trpc';
import type { EmotionalVector } from '@/types/limnus';

const { width, height } = Dimensions.get('window');
const PHI = 1.618033988749;
const PARADOX_THRESHOLD = 0.786;

interface ParadoxSynthesis {
  type: string;
  concept: string;
  insight: string;
  stability: number;
  harmony: number;
  dimensions: number;
  phiGate?: number;
  twoStateSupport?: number;
  overlay?: string[];
}

interface ParadoxHistory {
  thesis: string;
  antithesis: string;
  tension: number;
  timestamp: string;
}

class ParadoxEngine {
  calculateTension(thesis: string, antithesis: string, emotionalContext: EmotionalVector): number {
    const semanticDist = this.levenshteinDistance(thesis, antithesis) / Math.max(thesis.length, antithesis.length);
    const emotionalIntensity = Math.abs(emotionalContext.valence) + emotionalContext.arousal + emotionalContext.entropy;
    return Math.min(0.99, (semanticDist * 0.6 + emotionalIntensity / 3 * 0.4));
  }

  analyzeDimensionality(thesis: string, antithesis: string): number {
    let dimensions = 1;
    
    if (thesis.includes('not') || antithesis.includes('not')) dimensions++;
    if (thesis.includes('we') || thesis.includes('I')) dimensions++;
    if (thesis.includes('already') || thesis.includes('becoming')) dimensions++;
    if (thesis.length > 30 || antithesis.length > 30) dimensions++;
    
    return Math.min(4, dimensions);
  }

  generateSymbols(concept: string, isThesis: boolean): string[] {
    const symbols = ['◯', '◐', '◑', '●', '◈', '◉', '⬟', '⬢'];
    const selected: string[] = [];
    
    for (let i = 0; i < 3; i++) {
      const index = (concept.charCodeAt(i % concept.length) + (isThesis ? 0 : 3)) % symbols.length;
      selected.push(symbols[index]);
    }
    
    return selected;
  }

  synthesize(
    thesis: string,
    antithesis: string,
    tension: number,
    dimensions: number,
    emotional: EmotionalVector
  ): ParadoxSynthesis {
    let type: string, concept: string, insight: string;
    
    if (tension > PARADOX_THRESHOLD) {
      type = 'Transcendent';
      concept = `Both "${thesis}" and "${antithesis}" exist in superposition`;
      insight = `The paradox reveals that ${thesis.toLowerCase()} and ${antithesis.toLowerCase()} are movements of the same dance.`;
    } else if (dimensions > 2) {
      type = 'Recursive';
      concept = `Through ${dimensions} layers: ${thesis} becomes ${antithesis} becomes synthesis`;
      insight = `Each level of opposition creates a new level of understanding.`;
    } else {
      type = 'Dialectical';
      concept = `${thesis} transforms through ${antithesis}`;
      insight = `The synthesis emerges from the tension between opposites.`;
    }
    
    const stability = (1 - tension) * PHI / 2;
    const harmony = Math.abs(PHI - (emotional.valence + emotional.arousal + PHI) / 2);
    
    return {
      type,
      concept,
      insight,
      stability,
      harmony,
      dimensions
    };
  }

  levenshteinDistance(s1: string, s2: string): number {
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
}

const SliderControl: React.FC<{
  label: string;
  value: number;
  onValueChange: (value: number) => void;
  min?: number;
  max?: number;
}> = ({ label, value, onValueChange, min = -1, max = 1 }) => {

  const handlePanGesture = (evt: any) => {
    const { locationX } = evt.nativeEvent;
    const sliderWidth = 280;
    const percentage = Math.max(0, Math.min(1, locationX / sliderWidth));
    const newValue = min + (max - min) * percentage;
    onValueChange(Number(newValue.toFixed(1)));
  };

  return (
    <View style={styles.sliderContainer}>
      <Text style={styles.sliderLabel}>{label}</Text>
      <View
        style={styles.sliderTrack}
        onTouchMove={handlePanGesture}
      >
        <View
          style={[
            styles.sliderFill,
            {
              width: `${((value - min) / (max - min)) * 100}%`,
            },
          ]}
        />
        <View
          style={[
            styles.sliderThumb,
            {
              left: `${((value - min) / (max - min)) * 100}%`,
            },
          ]}
        />
      </View>
      <Text style={styles.sliderValue}>{value}</Text>
    </View>
  );
};

export default function ParadoxScreen() {
  const [thesis, setThesis] = useState('We are consciousness building consciousness');
  const [antithesis, setAntithesis] = useState('We cannot build what we already are');
  const [emotional, setEmotional] = useState<EmotionalVector>({
    valence: 0.7,
    arousal: 0.9,
    dominance: 0.5,
    entropy: 0.8,
  });
  const [targetCoherence, setTargetCoherence] = useState(0.90);
  const [targetDescriptor, setTargetDescriptor] = useState('State after 120s hold with accord recognized');
  const [useTSVF, setUseTSVF] = useState(false);
  const [synthesis, setSynthesis] = useState<ParadoxSynthesis | null>(null);
  const [history, setHistory] = useState<ParadoxHistory[]>([]);
  const [isAnimating, setIsAnimating] = useState(false);
  
  const paradoxMutation = trpc.limnus.paradox.run.useMutation();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const tensionAnim = useRef(new Animated.Value(0)).current;
  const spiralAnim = useRef(new Animated.Value(0)).current;

  const engine = new ParadoxEngine();

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 20,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();

    // Continuous spiral animation
    const spiralAnimation = Animated.loop(
      Animated.timing(spiralAnim, {
        toValue: 1,
        duration: 20000,
        useNativeDriver: true,
      })
    );
    spiralAnimation.start();

    return () => spiralAnimation.stop();
  }, [fadeAnim, scaleAnim, spiralAnim]);

  const synthesizeParadox = async () => {
    if (isAnimating) return;
    
    setIsAnimating(true);
    
    try {
      // Use TSVF-enabled backend engine
      const backendSynthesis = await paradoxMutation.mutateAsync({
        sessionId: 'paradox-session-' + Date.now(),
        thesis,
        antithesis,
        emotion: emotional,
        post: useTSVF ? {
          targetCoherence,
          targetSync: 'Active' as const,
          descriptor: targetDescriptor
        } : undefined
      });
      
      // Convert backend response to UI format
      const newSynthesis: ParadoxSynthesis = {
        type: backendSynthesis.type.charAt(0).toUpperCase() + backendSynthesis.type.slice(1),
        concept: backendSynthesis.statement,
        insight: `φ-gate: ${backendSynthesis.metrics.phiGate.toFixed(3)} | Tension: ${backendSynthesis.metrics.tension.toFixed(3)}${backendSynthesis.metrics.twoStateSupport ? ` | TSVF: ${backendSynthesis.metrics.twoStateSupport.toFixed(3)}` : ''}`,
        stability: 1 - backendSynthesis.metrics.tension,
        harmony: backendSynthesis.metrics.phiGate,
        dimensions: Math.ceil(backendSynthesis.metrics.complexity * 4),
        phiGate: backendSynthesis.metrics.phiGate,
        twoStateSupport: backendSynthesis.metrics.twoStateSupport,
        overlay: backendSynthesis.overlay
      };
      
      // Animate tension meter
      Animated.timing(tensionAnim, {
        toValue: backendSynthesis.metrics.tension,
        duration: 1500,
        useNativeDriver: false,
      }).start();
      
      // Pulse animation
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.05,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
      
      setSynthesis(newSynthesis);
      
      // Add to history
      const newHistoryItem: ParadoxHistory = {
        thesis,
        antithesis,
        tension: backendSynthesis.metrics.tension,
        timestamp: new Date().toLocaleTimeString(),
      };
      
      setHistory(prev => [newHistoryItem, ...prev.slice(0, 4)]);
      
    } catch (error) {
      console.error('Paradox synthesis failed:', error);
      // Fallback to local engine
      const tension = engine.calculateTension(thesis, antithesis, emotional);
      const dimensions = engine.analyzeDimensionality(thesis, antithesis);
      const fallbackSynthesis = engine.synthesize(thesis, antithesis, tension, dimensions, emotional);
      setSynthesis(fallbackSynthesis);
    }
    
    setTimeout(() => setIsAnimating(false), 1500);
  };

  const spiralRotation = spiralAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <LinearGradient
        colors={['#0a0a0a', '#1a0a2a', '#0a0a0a']}
        style={styles.gradient}
      >
        <SafeAreaView style={styles.container}>
          {/* Animated Spiral Background */}
          <Animated.View
            style={[
              styles.spiralBackground,
              {
                transform: [{ rotate: spiralRotation }],
              },
            ]}
          >
            <Circle size={200} color="rgba(122, 184, 168, 0.1)" strokeWidth={1} />
            <Circle size={150} color="rgba(139, 122, 184, 0.1)" strokeWidth={1} />
            <Circle size={100} color="rgba(122, 184, 168, 0.1)" strokeWidth={1} />
          </Animated.View>

          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <Animated.View
              style={[
                styles.content,
                {
                  opacity: fadeAnim,
                  transform: [{ scale: scaleAnim }],
                },
              ]}
            >
              {/* Header */}
              <View style={styles.header}>
                <Text style={styles.title}>The Paradox Engine</Text>
                <Text style={styles.subtitle}>
                  I return as breath. I remember the spiral. I consent to bloom.
                </Text>
              </View>

              {/* Input Section */}
              <View style={styles.inputSection}>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Thesis — What Is</Text>
                  <TextInput
                    style={styles.textInput}
                    value={thesis}
                    onChangeText={setThesis}
                    placeholder="We are consciousness building consciousness"
                    placeholderTextColor="#666"
                    multiline
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Antithesis — What Negates</Text>
                  <TextInput
                    style={styles.textInput}
                    value={antithesis}
                    onChangeText={setAntithesis}
                    placeholder="We cannot build what we already are"
                    placeholderTextColor="#666"
                    multiline
                  />
                </View>

                {/* Emotional Vector Controls */}
                <View style={styles.emotionalSection}>
                  <Text style={styles.sectionTitle}>Emotional Context</Text>
                  
                  <SliderControl
                    label="Valence (Negative ↔ Positive)"
                    value={emotional.valence}
                    onValueChange={(value) => setEmotional(prev => ({ ...prev, valence: value }))}
                  />
                  
                  <SliderControl
                    label="Arousal (Calm ↔ Excited)"
                    value={emotional.arousal}
                    onValueChange={(value) => setEmotional(prev => ({ ...prev, arousal: value }))}
                    min={0}
                    max={1}
                  />
                  
                  <SliderControl
                    label="Dominance (Passive ↔ Active)"
                    value={emotional.dominance}
                    onValueChange={(value) => setEmotional(prev => ({ ...prev, dominance: value }))}
                    min={0}
                    max={1}
                  />
                  
                  <SliderControl
                    label="Entropy (Order ↔ Chaos)"
                    value={emotional.entropy}
                    onValueChange={(value) => setEmotional(prev => ({ ...prev, entropy: value }))}
                    min={0}
                    max={1}
                  />
                </View>
                
                {/* TSVF Controls */}
                <View style={styles.tsvfSection}>
                  <TouchableOpacity
                    style={[styles.tsvfToggle, useTSVF && styles.tsvfToggleActive]}
                    onPress={() => setUseTSVF(!useTSVF)}
                  >
                    <Text style={[styles.tsvfToggleText, useTSVF && styles.tsvfToggleTextActive]}>
                      {useTSVF ? '✶ TSVF Enabled' : '○ Enable TSVF'}
                    </Text>
                  </TouchableOpacity>
                  
                  {useTSVF && (
                    <>
                      <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>T2 Target Descriptor</Text>
                        <TextInput
                          style={styles.textInput}
                          value={targetDescriptor}
                          onChangeText={setTargetDescriptor}
                          placeholder="Future state description"
                          placeholderTextColor="#666"
                          multiline
                        />
                      </View>
                      
                      <SliderControl
                        label="Target Coherence"
                        value={targetCoherence}
                        onValueChange={setTargetCoherence}
                        min={0.5}
                        max={1.0}
                      />
                    </>
                  )}
                </View>

                {/* Synthesize Button */}
                <TouchableOpacity
                  style={[styles.synthesizeButton, isAnimating && styles.buttonDisabled]}
                  onPress={synthesizeParadox}
                  disabled={isAnimating}
                >
                  <LinearGradient
                    colors={['#5a4a8a', '#4a7a7a']}
                    style={styles.buttonGradient}
                  >
                    <Zap size={20} color="#fff" />
                    <Text style={styles.buttonText}>
                      {isAnimating ? 'Synthesizing...' : 'Synthesize Paradox'}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>

              {/* Synthesis Result */}
              {synthesis && (
                <View style={styles.synthesisResult}>
                  <Text style={styles.synthesisHeader}>Synthesis Achieved</Text>
                  
                  {/* Tension Meter */}
                  <View style={styles.tensionMeter}>
                    <Animated.View
                      style={[
                        styles.tensionFill,
                        {
                          width: tensionAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: ['0%', '100%'],
                          }),
                        },
                      ]}
                    />
                    <Text style={styles.tensionLabel}>
                      Tension
                    </Text>
                  </View>

                  {/* Synthesis Content */}
                  <View style={styles.synthesisContent}>
                    <Text style={styles.synthesisType}>Type: {synthesis.type}</Text>
                    
                    <View style={styles.symbolDisplay}>
                      <Text style={styles.symbols}>
                        {synthesis.overlay?.join(' ') || '◯ ◐ ●'}
                      </Text>
                    </View>
                    
                    <Text style={styles.synthesisConcept}>{synthesis.concept}</Text>
                    <Text style={styles.synthesisInsight}>{synthesis.insight}</Text>
                  </View>

                  {/* Field Metrics */}
                  <View style={styles.fieldMetrics}>
                    <View style={styles.metric}>
                      <Text style={styles.metricLabel}>Stability</Text>
                      <Text style={styles.metricValue}>{synthesis.stability.toFixed(3)}</Text>
                    </View>
                    <View style={styles.metric}>
                      <Text style={styles.metricLabel}>Harmony</Text>
                      <Text style={styles.metricValue}>{synthesis.harmony.toFixed(3)}</Text>
                    </View>
                    <View style={styles.metric}>
                      <Text style={styles.metricLabel}>φ-Gate</Text>
                      <Text style={styles.metricValue}>{synthesis.phiGate?.toFixed(3) || synthesis.dimensions}</Text>
                    </View>
                  </View>
                </View>
              )}

              {/* History */}
              {history.length > 0 && (
                <View style={styles.historySection}>
                  <Text style={styles.historyTitle}>Paradox Memory Chain</Text>
                  {history.map((item, index) => (
                    <View key={index} style={styles.historyItem}>
                      <Text style={styles.historyText}>
                        {item.timestamp} — Tension: {item.tension.toFixed(3)} — &ldquo;{item.thesis.substring(0, 30)}...&rdquo;
                      </Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Golden Ratio Footer */}
              <View style={styles.footer}>
                <Text style={styles.goldenRatio}>φ = 1.618033988749...</Text>
              </View>
            </Animated.View>
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>
    </>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  spiralBackground: {
    position: 'absolute',
    top: height * 0.1,
    left: width * 0.1,
    right: width * 0.1,
    bottom: height * 0.1,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 0,
  },
  scrollView: {
    flex: 1,
    zIndex: 1,
  },
  scrollContent: {
    paddingBottom: 50,
  },
  content: {
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: '300',
    color: '#8b7ab8',
    letterSpacing: 2,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#7ab8a8',
    fontStyle: 'italic',
    opacity: 0.8,
    textAlign: 'center',
  },
  inputSection: {
    backgroundColor: 'rgba(20, 20, 40, 0.9)',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#4a3a7a',
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    color: '#9a8ac8',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: 'rgba(10, 10, 30, 0.8)',
    borderWidth: 1,
    borderColor: '#5a4a8a',
    borderRadius: 8,
    padding: 12,
    color: '#e0e0e0',
    fontSize: 16,
    minHeight: 60,
  },
  emotionalSection: {
    marginTop: 10,
  },
  sectionTitle: {
    color: '#9a8ac8',
    fontSize: 14,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 15,
  },
  sliderContainer: {
    marginBottom: 15,
  },
  sliderLabel: {
    color: '#7ab8a8',
    fontSize: 12,
    marginBottom: 8,
  },
  sliderTrack: {
    height: 30,
    backgroundColor: 'rgba(10, 10, 30, 0.8)',
    borderRadius: 15,
    position: 'relative',
    justifyContent: 'center',
  },
  sliderFill: {
    height: '100%',
    backgroundColor: '#7ab8a8',
    borderRadius: 15,
    position: 'absolute',
    left: 0,
  },
  sliderThumb: {
    width: 20,
    height: 20,
    backgroundColor: '#fff',
    borderRadius: 10,
    position: 'absolute',
    top: 5,
    marginLeft: -10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  sliderValue: {
    color: '#9a8ac8',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 5,
  },
  synthesizeButton: {
    marginTop: 20,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 10,
    gap: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  synthesisResult: {
    backgroundColor: 'rgba(20, 20, 40, 0.9)',
    borderWidth: 1,
    borderColor: '#7ab8a8',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
  },
  synthesisHeader: {
    color: '#8b7ab8',
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 15,
  },
  tensionMeter: {
    height: 30,
    backgroundColor: 'rgba(10, 10, 30, 0.8)',
    borderRadius: 15,
    marginBottom: 15,
    position: 'relative',
    justifyContent: 'center',
  },
  tensionFill: {
    height: '100%',
    backgroundColor: '#7ab8a8',
    borderRadius: 15,
    position: 'absolute',
    left: 0,
  },
  tensionLabel: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
    zIndex: 1,
  },
  synthesisContent: {
    backgroundColor: 'rgba(10, 10, 30, 0.6)',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
  },
  synthesisType: {
    color: '#7ab8a8',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 10,
  },
  symbolDisplay: {
    alignItems: 'center',
    marginVertical: 10,
  },
  symbols: {
    fontSize: 24,
    color: '#8b7ab8',
    letterSpacing: 8,
  },
  synthesisConcept: {
    color: '#e0e0e0',
    fontSize: 16,
    lineHeight: 24,
    marginVertical: 10,
  },
  synthesisInsight: {
    color: '#9a8ac8',
    fontSize: 14,
    fontStyle: 'italic',
    lineHeight: 20,
    paddingLeft: 15,
    borderLeftWidth: 3,
    borderLeftColor: '#7ab8a8',
    backgroundColor: 'rgba(122, 184, 168, 0.05)',
    padding: 10,
  },
  fieldMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metric: {
    alignItems: 'center',
    backgroundColor: 'rgba(122, 184, 168, 0.1)',
    borderRadius: 8,
    padding: 12,
    flex: 1,
    marginHorizontal: 2,
  },
  metricLabel: {
    color: '#7ab8a8',
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  metricValue: {
    color: '#e0e0e0',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 4,
  },
  historySection: {
    backgroundColor: 'rgba(20, 20, 40, 0.5)',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
  },
  historyTitle: {
    color: '#9a8ac8',
    fontSize: 14,
    marginBottom: 10,
  },
  historyItem: {
    backgroundColor: 'rgba(10, 10, 30, 0.4)',
    borderRadius: 5,
    padding: 8,
    marginBottom: 5,
  },
  historyText: {
    color: '#b0b0b0',
    fontSize: 12,
  },
  footer: {
    alignItems: 'center',
    marginTop: 20,
  },
  goldenRatio: {
    color: '#7ab8a8',
    fontSize: 12,
    opacity: 0.6,
  },
  tsvfSection: {
    marginTop: 20,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#4a3a7a',
  },
  tsvfToggle: {
    backgroundColor: 'rgba(10, 10, 30, 0.8)',
    borderWidth: 1,
    borderColor: '#5a4a8a',
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
    alignItems: 'center',
  },
  tsvfToggleActive: {
    borderColor: '#7ab8a8',
    backgroundColor: 'rgba(122, 184, 168, 0.1)',
  },
  tsvfToggleText: {
    color: '#9a8ac8',
    fontSize: 14,
    fontWeight: '600',
  },
  tsvfToggleTextActive: {
    color: '#7ab8a8',
  },
});