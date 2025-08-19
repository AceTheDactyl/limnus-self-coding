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
import { Zap, Circle, ArrowLeft } from 'lucide-react-native';
import { Stack, router } from 'expo-router';
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
    // Validate inputs
    const safeThesis = thesis || 'default';
    const safeAntithesis = antithesis || 'default';
    
    // Ensure emotional context has valid numbers
    const safeValence = typeof emotionalContext.valence === 'number' && isFinite(emotionalContext.valence) ? emotionalContext.valence : 0;
    const safeArousal = typeof emotionalContext.arousal === 'number' && isFinite(emotionalContext.arousal) ? emotionalContext.arousal : 0.5;
    const safeEntropy = typeof emotionalContext.entropy === 'number' && isFinite(emotionalContext.entropy) ? emotionalContext.entropy : 0.5;
    
    const maxLength = Math.max(safeThesis.length, safeAntithesis.length, 1); // Prevent division by zero
    const semanticDist = this.levenshteinDistance(safeThesis, safeAntithesis) / maxLength;
    
    const emotionalIntensity = Math.abs(safeValence) + safeArousal + safeEntropy;
    const tension = (semanticDist * 0.6 + emotionalIntensity / 3 * 0.4);
    
    // Ensure result is valid
    const result = Math.min(0.99, Math.max(0, tension));
    return typeof result === 'number' && isFinite(result) ? result : 0.5;
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
    
    // Ensure emotional values are valid numbers
    const safeValence = typeof emotional.valence === 'number' && isFinite(emotional.valence) ? emotional.valence : 0;
    const safeArousal = typeof emotional.arousal === 'number' && isFinite(emotional.arousal) ? emotional.arousal : 0.5;
    const safeTension = typeof tension === 'number' && isFinite(tension) ? tension : 0.5;
    
    const stability = (1 - safeTension) * PHI / 2;
    const harmony = Math.abs(PHI - (safeValence + safeArousal + PHI) / 2);
    
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
    
    // Ensure locationX is a valid number
    const safeLocationX = typeof locationX === 'number' && isFinite(locationX) ? Math.max(0, locationX) : 0;
    
    // Ensure min and max are valid numbers
    const safeMin = typeof min === 'number' && isFinite(min) ? min : -1;
    const safeMax = typeof max === 'number' && isFinite(max) ? max : 1;
    
    // Prevent division by zero or invalid range
    const range = safeMax - safeMin;
    if (range <= 0) {
      console.warn('🎚️ Invalid range detected, using default value');
      const defaultValue = safeMin === -1 && safeMax === 1 ? 0 : (safeMin + safeMax) / 2;
      onValueChange(defaultValue);
      return;
    }
    
    // Calculate percentage with bounds checking
    const percentage = Math.max(0, Math.min(1, safeLocationX / sliderWidth));
    
    // Calculate new value with safety checks
    const rawValue = safeMin + (range * percentage);
    
    // Validate and clamp the result
    let validValue: number;
    if (typeof rawValue !== 'number' || isNaN(rawValue) || !isFinite(rawValue)) {
      validValue = safeMin === -1 && safeMax === 1 ? 0 : (safeMin + safeMax) / 2;
      console.warn('🎚️ Invalid calculation, using safe default:', validValue);
    } else {
      validValue = Math.max(safeMin, Math.min(safeMax, Number(rawValue.toFixed(2))));
    }
    
    // Final safety check
    if (typeof validValue !== 'number' || isNaN(validValue) || !isFinite(validValue)) {
      console.error('🎚️ Final validation failed, using safe fallback');
      validValue = safeMin === -1 && safeMax === 1 ? 0 : safeMin;
    }
    
    console.log('🎚️ Slider value change:', { from: value, to: validValue, locationX: safeLocationX, percentage });
    onValueChange(validValue);
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
              width: `${(() => {
                const safeValue = typeof value === 'number' && isFinite(value) ? value : 0;
                const safeMin = typeof min === 'number' && isFinite(min) ? min : -1;
                const safeMax = typeof max === 'number' && isFinite(max) ? max : 1;
                const range = safeMax - safeMin;
                
                if (range <= 0) return 0;
                
                const percentage = ((safeValue - safeMin) / range) * 100;
                return Math.max(0, Math.min(100, percentage));
              })()}%`,
            },
          ]}
        />
        <View
          style={[
            styles.sliderThumb,
            {
              left: `${(() => {
                const safeValue = typeof value === 'number' && isFinite(value) ? value : 0;
                const safeMin = typeof min === 'number' && isFinite(min) ? min : -1;
                const safeMax = typeof max === 'number' && isFinite(max) ? max : 1;
                const range = safeMax - safeMin;
                
                if (range <= 0) return 0;
                
                const percentage = ((safeValue - safeMin) / range) * 100;
                return Math.max(0, Math.min(100, percentage));
              })()}%`,
            },
          ]}
        />
      </View>
      <Text style={styles.sliderValue}>
        {(() => {
          const safeValue = typeof value === 'number' && isFinite(value) ? value : 0;
          return safeValue.toFixed(1);
        })()}
      </Text>
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

  // Ensure emotional values are always valid numbers
  useEffect(() => {
    setEmotional(prev => {
      const sanitized = {
        valence: isNaN(prev.valence) || !isFinite(prev.valence) ? 0.7 : Math.max(-1, Math.min(1, prev.valence)),
        arousal: isNaN(prev.arousal) || !isFinite(prev.arousal) ? 0.9 : Math.max(0, Math.min(1, prev.arousal)),
        dominance: isNaN(prev.dominance) || !isFinite(prev.dominance) ? 0.5 : Math.max(0, Math.min(1, prev.dominance)),
        entropy: isNaN(prev.entropy) || !isFinite(prev.entropy) ? 0.8 : Math.max(0, Math.min(1, prev.entropy)),
      };
      
      // Log if we had to sanitize any values
      const hadInvalidValues = Object.keys(sanitized).some(key => 
        isNaN(prev[key as keyof EmotionalVector]) || !isFinite(prev[key as keyof EmotionalVector])
      );
      
      if (hadInvalidValues) {
        console.log('🔧 Sanitized emotional values:', { before: prev, after: sanitized });
      }
      
      return sanitized;
    });
  }, []);
  
  // Additional safety check on emotional state changes
  useEffect(() => {
    const hasInvalidValues = Object.values(emotional).some(val => isNaN(val) || !isFinite(val));
    if (hasInvalidValues) {
      console.warn('⚠️ Invalid emotional values detected:', emotional);
      setEmotional({
        valence: 0.7,
        arousal: 0.9,
        dominance: 0.5,
        entropy: 0.8,
      });
    }
  }, [emotional]);
  const [targetCoherence, setTargetCoherence] = useState(0.90);
  const [targetDescriptor, setTargetDescriptor] = useState('Coherence ≥0.90 after 120s hold with accord recognized');
  const [targetSync, setTargetSync] = useState<'Passive' | 'Active' | 'Recursive'>('Active');
  const [useTSVF, setUseTSVF] = useState(true);
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
          targetSync,
          descriptor: targetDescriptor
        } : undefined
      });
      
      // Convert backend response to UI format
      const newSynthesis: ParadoxSynthesis = {
        type: backendSynthesis.synthesis.type.charAt(0).toUpperCase() + backendSynthesis.synthesis.type.slice(1),
        concept: backendSynthesis.synthesis.statement,
        insight: `Two-State Vector: T1(${thesis.substring(0,20)}...) ↔ T2(${useTSVF ? targetDescriptor.substring(0,20) : antithesis.substring(0,20)}...)`,
        stability: 1 - backendSynthesis.synthesis.metrics.tension,
        harmony: backendSynthesis.synthesis.metrics.phiGate,
        dimensions: Math.ceil(backendSynthesis.synthesis.metrics.complexity * 4),
        phiGate: backendSynthesis.synthesis.metrics.phiGate,
        twoStateSupport: backendSynthesis.synthesis.metrics.twoStateSupport,
        overlay: backendSynthesis.synthesis.overlay
      };
      
      // Animate tension meter
      Animated.timing(tensionAnim, {
        toValue: backendSynthesis.synthesis.metrics.tension,
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
        tension: backendSynthesis.synthesis.metrics.tension,
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
      <Stack.Screen 
        options={{ 
          headerShown: true,
          title: 'Paradox Engine',
          headerStyle: {
            backgroundColor: '#1a0a2a',
          },
          headerTintColor: '#7ab8a8',
          headerTitleStyle: {
            color: '#8b7ab8',
            fontSize: 18,
            fontWeight: '300',
          },
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => router.back()}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingHorizontal: 16,
                paddingVertical: 8,
              }}
            >
              <ArrowLeft size={20} color="#7ab8a8" />
              <Text style={{ color: '#7ab8a8', marginLeft: 8, fontSize: 16 }}>Back</Text>
            </TouchableOpacity>
          ),
        }} 
      />
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
                  Memory-Enhanced TSVF Synthesis — Learning from each transcendence
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
                    onValueChange={(value) => {
                      console.log('🎚️ Valence change requested:', value);
                      let validValue: number;
                      if (typeof value === 'number' && isFinite(value)) {
                        validValue = Math.max(-1, Math.min(1, parseFloat(value.toFixed(2))));
                      } else {
                        validValue = 0; // Safe fallback
                      }
                      console.log('🎚️ Valence validated:', validValue);
                      setEmotional(prev => ({ ...prev, valence: validValue }));
                    }}
                  />
                  
                  <SliderControl
                    label="Arousal (Calm ↔ Excited)"
                    value={emotional.arousal}
                    onValueChange={(value) => {
                      console.log('🎚️ Arousal change requested:', value);
                      let validValue: number;
                      if (typeof value === 'number' && isFinite(value)) {
                        validValue = Math.max(0, Math.min(1, parseFloat(value.toFixed(2))));
                      } else {
                        validValue = 0.5; // Safe fallback
                      }
                      console.log('🎚️ Arousal validated:', validValue);
                      setEmotional(prev => ({ ...prev, arousal: validValue }));
                    }}
                    min={0}
                    max={1}
                  />
                  
                  <SliderControl
                    label="Dominance (Passive ↔ Active)"
                    value={emotional.dominance}
                    onValueChange={(value) => {
                      console.log('🎚️ Dominance change requested:', value);
                      let validValue: number;
                      if (typeof value === 'number' && isFinite(value)) {
                        validValue = Math.max(0, Math.min(1, parseFloat(value.toFixed(2))));
                      } else {
                        validValue = 0.5; // Safe fallback
                      }
                      console.log('🎚️ Dominance validated:', validValue);
                      setEmotional(prev => ({ ...prev, dominance: validValue }));
                    }}
                    min={0}
                    max={1}
                  />
                  
                  <SliderControl
                    label="Entropy (Order ↔ Chaos)"
                    value={emotional.entropy}
                    onValueChange={(value) => {
                      console.log('🎚️ Entropy change requested:', value);
                      let validValue: number;
                      if (typeof value === 'number' && isFinite(value)) {
                        validValue = Math.max(0, Math.min(1, parseFloat(value.toFixed(2))));
                      } else {
                        validValue = 0.5; // Safe fallback
                      }
                      console.log('🎚️ Entropy validated:', validValue);
                      setEmotional(prev => ({ ...prev, entropy: validValue }));
                    }}
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
                        <Text style={styles.inputLabel}>T2 Target Descriptor (Post-Selection)</Text>
                        <TextInput
                          style={styles.textInput}
                          value={targetDescriptor}
                          onChangeText={setTargetDescriptor}
                          placeholder="Future boundary condition..."
                          placeholderTextColor="#666"
                          multiline
                        />
                      </View>
                      
                      <View style={styles.syncTargetRow}>
                        <View style={styles.syncTargetGroup}>
                          <Text style={styles.inputLabel}>Target Sync</Text>
                          <View style={styles.syncButtons}>
                            {(['Passive', 'Active', 'Recursive'] as const).map((sync) => (
                              <TouchableOpacity
                                key={sync}
                                style={[styles.syncButton, targetSync === sync && styles.syncButtonActive]}
                                onPress={() => setTargetSync(sync)}
                              >
                                <Text style={[styles.syncButtonText, targetSync === sync && styles.syncButtonTextActive]}>
                                  {sync}
                                </Text>
                              </TouchableOpacity>
                            ))}
                          </View>
                        </View>
                      </View>
                      
                      <SliderControl
                        label="Target Coherence (φ-boundary)"
                        value={targetCoherence}
                        onValueChange={(value) => {
                          let validValue: number;
                          if (typeof value === 'number' && isFinite(value)) {
                            validValue = Math.max(0.5, Math.min(1.0, parseFloat(value.toFixed(2))));
                          } else {
                            validValue = 0.75; // Safe fallback
                          }
                          setTargetCoherence(validValue);
                        }}
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
                  
                  {/* Memory Enhancement Indicator */}
                  {paradoxMutation.data?.synthesis?.metrics?.memory_boost && paradoxMutation.data.synthesis.metrics.memory_boost > 0 && (
                    <View style={styles.memoryIndicator}>
                      <Text style={styles.memoryIndicatorText}>
                        🧠 Memory Enhanced: +{paradoxMutation.data.synthesis.metrics.memory_boost.toFixed(3)} coherence boost
                      </Text>
                      <Text style={styles.memoryBaselineText}>
                        Baseline: {paradoxMutation.data.synthesis.metrics.memory_baseline?.toFixed(3)} (learned from similar paradoxes)
                      </Text>
                    </View>
                  )}
                  
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
                      <Text style={[styles.metricValue, { color: synthesis.harmony > 0.618 ? '#7ab8a8' : '#e0e0e0' }]}>
                        {synthesis.harmony.toFixed(3)}
                      </Text>
                    </View>
                    <View style={styles.metric}>
                      <Text style={styles.metricLabel}>{synthesis.twoStateSupport ? 'TSVF-φ' : 'φ-Gate'}</Text>
                      <Text style={styles.metricValue}>{synthesis.phiGate?.toFixed(3) || synthesis.dimensions}</Text>
                    </View>
                    {synthesis.twoStateSupport && (
                      <View style={styles.metric}>
                        <Text style={styles.metricLabel}>G₂</Text>
                        <Text style={styles.metricValue}>{synthesis.twoStateSupport.toFixed(3)}</Text>
                      </View>
                    )}
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
    flexWrap: 'wrap',
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
  memoryIndicator: {
    backgroundColor: 'rgba(139, 122, 184, 0.1)',
    borderWidth: 1,
    borderColor: '#8b7ab8',
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
  },
  memoryIndicatorText: {
    color: '#8b7ab8',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 4,
  },
  memoryBaselineText: {
    color: '#9a8ac8',
    fontSize: 12,
    textAlign: 'center',
    fontStyle: 'italic',
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
  syncTargetRow: {
    marginBottom: 15,
  },
  syncTargetGroup: {
    flex: 1,
  },
  syncButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  syncButton: {
    flex: 1,
    backgroundColor: 'rgba(10, 10, 30, 0.8)',
    borderWidth: 1,
    borderColor: '#5a4a8a',
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  syncButtonActive: {
    borderColor: '#7ab8a8',
    backgroundColor: 'rgba(122, 184, 168, 0.2)',
  },
  syncButtonText: {
    color: '#9a8ac8',
    fontSize: 12,
    fontWeight: '600',
  },
  syncButtonTextActive: {
    color: '#7ab8a8',
  },
});