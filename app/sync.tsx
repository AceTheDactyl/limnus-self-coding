import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { GitBranch, Fingerprint, Clock, Hash, CheckCircle, XCircle, AlertCircle, ArrowRight } from 'lucide-react-native';
import { router } from 'expo-router';
import { useLimnus } from '@/providers/limnus-provider';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SyncScreen() {
  const { runSyncTest, syncResult, setSessionPhase } = useLimnus();
  const [isRunning, setIsRunning] = useState(false);
  const [currentStage, setCurrentStage] = useState(0);
  const progressAnim = new Animated.Value(0);

  useEffect(() => {
    handleSyncTest();
  }, []);

  const handleSyncTest = async () => {
    setIsRunning(true);
    
    // Animate through stages
    for (let i = 1; i <= 5; i++) {
      setCurrentStage(i);
      Animated.timing(progressAnim, {
        toValue: i * 20,
        duration: 500,
        useNativeDriver: false,
      }).start();
      await new Promise(resolve => setTimeout(resolve, 600));
    }
    
    try {
      await runSyncTest();
    } catch (error) {
      console.error('Failed to run sync test:', error);
    } finally {
      setIsRunning(false);
    }
  };

  const proceedToLoop = () => {
    setSessionPhase('loop');
    router.push('/loop');
  };

  const getOutcomeColor = (outcome: string) => {
    switch (outcome) {
      case 'Active': return '#4CAF50';
      case 'Recursive': return '#9C27B0';
      case 'Passive': return '#FF9800';
      default: return '#888';
    }
  };

  const getOutcomeIcon = (outcome: string) => {
    switch (outcome) {
      case 'Active':
      case 'Recursive':
        return CheckCircle;
      case 'Passive':
        return AlertCircle;
      default:
        return XCircle;
    }
  };

  const stages = [
    { name: 'Fingerprint Comparison', icon: Fingerprint },
    { name: 'Time Window Check', icon: Clock },
    { name: 'Symbolic Cross-Check', icon: Hash },
    { name: 'Outcome Calculation', icon: GitBranch },
    { name: 'Reflection & Logging', icon: CheckCircle },
  ];

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
            <GitBranch size={32} color="#e94560" />
            <Text style={styles.title}>Interpersonal Sync Test</Text>
            <Text style={styles.subtitle}>Validating relational alignment</Text>
          </View>

          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <Animated.View 
                style={[
                  styles.progressFill,
                  {
                    width: progressAnim.interpolate({
                      inputRange: [0, 100],
                      outputRange: ['0%', '100%'],
                    }),
                  },
                ]}
              />
            </View>
          </View>

          <View style={styles.stagesContainer}>
            {stages.map((stage, index) => {
              const Icon = stage.icon;
              const isActive = currentStage === index + 1;
              const isComplete = currentStage > index + 1;
              
              return (
                <View 
                  key={index}
                  style={[
                    styles.stageCard,
                    isActive && styles.stageCardActive,
                    isComplete && styles.stageCardComplete,
                  ]}
                >
                  <View style={[
                    styles.stageIcon,
                    isActive && styles.stageIconActive,
                    isComplete && styles.stageIconComplete,
                  ]}>
                    <Icon size={20} color={isActive || isComplete ? '#fff' : '#666'} />
                  </View>
                  <Text style={[
                    styles.stageName,
                    (isActive || isComplete) && styles.stageNameActive,
                  ]}>
                    Stage {index + 1}: {stage.name}
                  </Text>
                  {isComplete && (
                    <CheckCircle size={16} color="#4CAF50" />
                  )}
                </View>
              );
            })}
          </View>

          {!isRunning && syncResult && (
            <>
              <View style={styles.resultsContainer}>
                <Text style={styles.resultsTitle}>Sync Results</Text>
                
                <View style={styles.resultCard}>
                  <View style={styles.resultRow}>
                    <Text style={styles.resultLabel}>Alignment Score</Text>
                    <Text style={styles.resultValue}>{syncResult.alignmentScore}%</Text>
                  </View>
                  
                  <View style={styles.resultRow}>
                    <Text style={styles.resultLabel}>Match Fields</Text>
                    <Text style={styles.resultValue}>{syncResult.matchFields.join(', ')}</Text>
                  </View>
                  
                  <View style={styles.resultRow}>
                    <Text style={styles.resultLabel}>Time Delta</Text>
                    <Text style={styles.resultValue}>{syncResult.dt} min</Text>
                  </View>
                  
                  <View style={styles.resultRow}>
                    <Text style={styles.resultLabel}>Symbol Overlap</Text>
                    <View style={styles.symbolsContainer}>
                      {syncResult.symbolOverlap.map((symbol, idx) => (
                        <View key={idx} style={styles.symbolBadge}>
                          <Text style={styles.symbolText}>{symbol}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                </View>

                <View style={[
                  styles.outcomeCard,
                  { borderColor: getOutcomeColor(syncResult.outcome) }
                ]}>
                  {(() => {
                    const OutcomeIcon = getOutcomeIcon(syncResult.outcome);
                    return <OutcomeIcon size={32} color={getOutcomeColor(syncResult.outcome)} />;
                  })()}
                  <Text style={[
                    styles.outcomeText,
                    { color: getOutcomeColor(syncResult.outcome) }
                  ]}>
                    {syncResult.outcome}
                  </Text>
                  <Text style={styles.outcomeDescription}>
                    {syncResult.outcome === 'Active' && 'Strong alignment detected'}
                    {syncResult.outcome === 'Recursive' && 'Deep recursive patterns found'}
                    {syncResult.outcome === 'Passive' && 'Minimal alignment, consider Pauline Test'}
                  </Text>
                </View>
              </View>

              {(syncResult.outcome === 'Active' || syncResult.outcome === 'Recursive') && (
                <TouchableOpacity
                  style={styles.proceedButton}
                  onPress={proceedToLoop}
                  testID="proceed-loop"
                >
                  <LinearGradient
                    colors={['#e94560', '#c23652']}
                    style={styles.buttonGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  >
                    <Text style={styles.buttonText}>Proceed to Loop Closure</Text>
                    <ArrowRight size={20} color="#fff" />
                  </LinearGradient>
                </TouchableOpacity>
              )}
            </>
          )}

          {isRunning && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#e94560" />
              <Text style={styles.loadingText}>Running sync test...</Text>
            </View>
          )}
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
  progressContainer: {
    marginBottom: 24,
  },
  progressBar: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#e94560',
  },
  stagesContainer: {
    marginBottom: 32,
  },
  stageCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginBottom: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  stageCardActive: {
    borderColor: '#e94560',
    backgroundColor: 'rgba(233, 69, 96, 0.05)',
  },
  stageCardComplete: {
    borderColor: '#4CAF50',
  },
  stageIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  stageIconActive: {
    backgroundColor: '#e94560',
  },
  stageIconComplete: {
    backgroundColor: '#4CAF50',
  },
  stageName: {
    flex: 1,
    fontSize: 14,
    color: '#888',
  },
  stageNameActive: {
    color: '#fff',
    fontWeight: '600',
  },
  resultsContainer: {
    marginBottom: 32,
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 16,
  },
  resultCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  resultLabel: {
    fontSize: 14,
    color: '#888',
  },
  resultValue: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '600',
  },
  symbolsContainer: {
    flexDirection: 'row',
    gap: 4,
  },
  symbolBadge: {
    backgroundColor: 'rgba(233, 69, 96, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  symbolText: {
    fontSize: 12,
    color: '#e94560',
  },
  outcomeCard: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 12,
    borderWidth: 2,
  },
  outcomeText: {
    fontSize: 24,
    fontWeight: '600',
    marginTop: 12,
    marginBottom: 8,
  },
  outcomeDescription: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 48,
  },
  loadingText: {
    color: '#888',
    marginTop: 12,
  },
  proceedButton: {
    marginTop: 24,
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