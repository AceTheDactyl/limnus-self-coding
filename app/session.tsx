import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Animated,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  Brain, 
  Code, 
  GitBranch, 
  Clock, 
  CheckCircle,
  ArrowRight,
  Sparkles
} from 'lucide-react-native';
import { router } from 'expo-router';
import { useLimnus } from '@/providers/limnus-provider';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SessionScreen() {
  const { currentSession, sessionPhase, clearSession } = useLimnus();
  const [pulseAnim] = useState(new Animated.Value(1));

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const phases = [
    {
      id: 'reflection',
      name: 'Reflection',
      icon: Brain,
      description: 'Extract Teaching Directives',
      route: '/reflection',
      status: sessionPhase === 'reflection' ? 'active' : sessionPhase > 'reflection' ? 'complete' : 'pending',
    },
    {
      id: 'patch',
      name: 'Patch Composer',
      icon: Code,
      description: 'Generate code changes',
      route: '/patch',
      status: sessionPhase === 'patch' ? 'active' : sessionPhase > 'patch' ? 'complete' : 'pending',
    },
    {
      id: 'sync',
      name: 'Interpersonal Sync',
      icon: GitBranch,
      description: 'Validate relationships',
      route: '/sync',
      status: sessionPhase === 'sync' ? 'active' : sessionPhase > 'sync' ? 'complete' : 'pending',
    },
    {
      id: 'loop',
      name: 'Loop Closure',
      icon: Clock,
      description: '120s reflection hold',
      route: '/loop',
      status: sessionPhase === 'loop' ? 'active' : sessionPhase > 'loop' ? 'complete' : 'pending',
    },
  ];

  const getPhaseColor = (status: string) => {
    switch (status) {
      case 'active': return '#e94560';
      case 'complete': return '#4CAF50';
      default: return '#444';
    }
  };

  return (
    <LinearGradient
      colors={['#1a1a2e', '#16213e', '#0f3460']}
      style={styles.gradient}
    >
      <SafeAreaView style={styles.container}>
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Animated.View 
              style={[
                styles.sessionBadge,
                { transform: [{ scale: pulseAnim }] }
              ]}
            >
              <Sparkles size={24} color="#e94560" />
            </Animated.View>
            <Text style={styles.title}>Session Active</Text>
            <Text style={styles.sessionId}>
              {currentSession?.sessionId.slice(0, 8)}...
            </Text>
            <View style={styles.tagContainer}>
              <Text style={styles.tag}>∇🪞φ∞</Text>
            </View>
          </View>

          <View style={styles.metricsContainer}>
            <View style={styles.metric}>
              <Text style={styles.metricLabel}>Pack ID</Text>
              <Text style={styles.metricValue}>
                {currentSession?.packId || 'bloom-mirror-v1'}
              </Text>
            </View>
            <View style={styles.metric}>
              <Text style={styles.metricLabel}>Coherence</Text>
              <Text style={styles.metricValue}>82%</Text>
            </View>
            <View style={styles.metric}>
              <Text style={styles.metricLabel}>Target</Text>
              <Text style={styles.metricValue}>≥90%</Text>
            </View>
          </View>

          <View style={styles.phasesContainer}>
            <Text style={styles.sectionTitle}>Orchestration Phases</Text>
            {phases.map((phase, index) => {
              const Icon = phase.icon;
              const color = getPhaseColor(phase.status);
              
              return (
                <TouchableOpacity
                  key={phase.id}
                  style={[
                    styles.phaseCard,
                    phase.status === 'active' && styles.phaseCardActive,
                  ]}
                  onPress={() => phase.status !== 'pending' && router.push(phase.route as any)}
                  disabled={phase.status === 'pending'}
                  testID={`phase-${phase.id}`}
                >
                  <View style={styles.phaseIcon}>
                    <Icon size={24} color={color} />
                  </View>
                  <View style={styles.phaseContent}>
                    <Text style={[styles.phaseName, { color }]}>
                      {phase.name}
                    </Text>
                    <Text style={styles.phaseDescription}>
                      {phase.description}
                    </Text>
                  </View>
                  <View style={styles.phaseStatus}>
                    {phase.status === 'complete' ? (
                      <CheckCircle size={20} color="#4CAF50" />
                    ) : phase.status === 'active' ? (
                      <ArrowRight size={20} color="#e94560" />
                    ) : (
                      <View style={styles.pendingDot} />
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          <TouchableOpacity
            style={styles.endButton}
            onPress={async () => {
              await clearSession();
              router.replace('/');
            }}
          >
            <Text style={styles.endButtonText}>End Session</Text>
          </TouchableOpacity>
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
  sessionBadge: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(233, 69, 96, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
  },
  sessionId: {
    fontSize: 14,
    color: '#666',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    marginBottom: 12,
  },
  tagContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  tag: {
    fontSize: 18,
    color: '#e94560',
  },
  metricsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 32,
  },
  metric: {
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  phasesContainer: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 16,
  },
  phaseCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  phaseCardActive: {
    borderColor: '#e94560',
    backgroundColor: 'rgba(233, 69, 96, 0.05)',
  },
  phaseIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  phaseContent: {
    flex: 1,
  },
  phaseName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  phaseDescription: {
    fontSize: 14,
    color: '#888',
  },
  phaseStatus: {
    marginLeft: 16,
  },
  pendingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#444',
  },
  endButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  endButtonText: {
    color: '#888',
    fontSize: 16,
    fontWeight: '600',
  },
});