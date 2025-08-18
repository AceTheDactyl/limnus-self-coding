import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { X, Archive, CheckCircle } from 'lucide-react-native';
import { trpc } from '@/lib/trpc';

interface PaulineTestModalProps {
  visible: boolean;
  onClose: () => void;
  sessionId: string;
  patchId: string;
  onComplete: (outcome: 'Passive' | 'Active' | 'Recursive') => void;
}

interface Response {
  question: string;
  answer: string;
  confidence: number;
}

export function PaulineTestModal({
  visible,
  onClose,
  sessionId,
  patchId,
  onComplete,
}: PaulineTestModalProps) {
  const [responses, setResponses] = useState<Response[]>([]);
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [archiveAsLatent, setArchiveAsLatent] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const promptsQuery = trpc.limnus.sync.prompts.useQuery();
  const paulineTestMutation = trpc.limnus.sync.pauline.useMutation();

  const prompts = promptsQuery.data?.prompts || [];
  const currentPrompt = prompts[currentStep];

  const handleAnswerChange = (answer: string) => {
    const newResponses = [...responses];
    newResponses[currentStep] = {
      question: currentPrompt?.question || '',
      answer,
      confidence: newResponses[currentStep]?.confidence || 0.5,
    };
    setResponses(newResponses);
  };

  const handleConfidenceChange = (confidence: number) => {
    const newResponses = [...responses];
    newResponses[currentStep] = {
      question: currentPrompt?.question || '',
      answer: newResponses[currentStep]?.answer || '',
      confidence,
    };
    setResponses(newResponses);
  };

  const handleNext = () => {
    if (currentStep < prompts.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleSubmit();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    if (responses.length !== prompts.length) {
      Alert.alert('Error', 'Please complete all questions before submitting.');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await paulineTestMutation.mutateAsync({
        session_id: sessionId,
        patch_id: patchId,
        responses,
        archive_as_latent: archiveAsLatent,
      });

      console.log('[PAULINE] Test completed:', result);
      onComplete(result.outcome);
      onClose();
    } catch (error) {
      console.error('[PAULINE] Test failed:', error);
      Alert.alert('Error', 'Failed to complete Pauline Test. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentResponse = responses[currentStep];
  const isLastStep = currentStep === prompts.length - 1;
  const canProceed = currentResponse?.answer?.trim() && currentResponse?.confidence !== undefined;

  if (!visible || !currentPrompt) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Pauline Test - Module 19</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X size={24} color="#666" />
          </TouchableOpacity>
        </View>

        <View style={styles.progress}>
          <Text style={styles.progressText}>
            Question {currentStep + 1} of {prompts.length}
          </Text>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { width: `${((currentStep + 1) / prompts.length) * 100}%` },
              ]}
            />
          </View>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <Text style={styles.instructions}>
            {promptsQuery.data?.instructions}
          </Text>

          <View style={styles.questionCard}>
            <Text style={styles.question}>{currentPrompt.question}</Text>

            <TextInput
              style={styles.answerInput}
              placeholder="Share your intuitive response..."
              placeholderTextColor="#999"
              multiline
              numberOfLines={4}
              value={currentResponse?.answer || ''}
              onChangeText={handleAnswerChange}
              testID={`answer-input-${currentStep}`}
            />

            <View style={styles.confidenceSection}>
              <Text style={styles.confidenceLabel}>
                Confidence Level: {Math.round((currentResponse?.confidence || 0.5) * 100)}%
              </Text>
              <View style={styles.confidenceSlider}>
                {[0, 0.25, 0.5, 0.75, 1].map((value) => (
                  <TouchableOpacity
                    key={value}
                    style={[
                      styles.confidenceButton,
                      currentResponse?.confidence === value && styles.confidenceButtonActive,
                    ]}
                    onPress={() => handleConfidenceChange(value)}
                    testID={`confidence-${value}`}
                  >
                    <Text
                      style={[
                        styles.confidenceButtonText,
                        currentResponse?.confidence === value && styles.confidenceButtonTextActive,
                      ]}
                    >
                      {Math.round(value * 100)}%
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          {isLastStep && (
            <TouchableOpacity
              style={[styles.archiveOption, archiveAsLatent && styles.archiveOptionActive]}
              onPress={() => setArchiveAsLatent(!archiveAsLatent)}
              testID="archive-toggle"
            >
              <Archive size={20} color={archiveAsLatent ? '#3B82F6' : '#666'} />
              <Text style={[styles.archiveText, archiveAsLatent && styles.archiveTextActive]}>
                Archive as Latent Sync for future processing
              </Text>
            </TouchableOpacity>
          )}
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.button, styles.secondaryButton]}
            onPress={handlePrevious}
            disabled={currentStep === 0}
          >
            <Text style={[styles.buttonText, styles.secondaryButtonText]}>Previous</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.primaryButton, !canProceed && styles.buttonDisabled]}
            onPress={handleNext}
            disabled={!canProceed || isSubmitting}
            testID="next-button"
          >
            {isLastStep ? (
              <>
                <CheckCircle size={16} color="#fff" />
                <Text style={styles.buttonText}>
                  {isSubmitting ? 'Processing...' : 'Complete Test'}
                </Text>
              </>
            ) : (
              <Text style={styles.buttonText}>Next</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  title: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: '#fff',
  },
  closeButton: {
    padding: 4,
  },
  progress: {
    padding: 20,
    paddingBottom: 10,
  },
  progressText: {
    fontSize: 14,
    color: '#888',
    marginBottom: 8,
  },
  progressBar: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 2,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#3B82F6',
    borderRadius: 2,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  instructions: {
    fontSize: 14,
    color: '#aaa',
    marginBottom: 20,
    lineHeight: 20,
  },
  questionCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  question: {
    fontSize: 16,
    fontWeight: '500' as const,
    color: '#fff',
    marginBottom: 16,
    lineHeight: 24,
  },
  answerInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
    padding: 12,
    color: '#fff',
    fontSize: 14,
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: 20,
  },
  confidenceSection: {
    marginTop: 8,
  },
  confidenceLabel: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: '#fff',
    marginBottom: 12,
  },
  confidenceSlider: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  confidenceButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  confidenceButtonActive: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  confidenceButtonText: {
    fontSize: 12,
    color: '#888',
    fontWeight: '500' as const,
  },
  confidenceButtonTextActive: {
    color: '#fff',
  },
  archiveOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginTop: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  archiveOptionActive: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderColor: '#3B82F6',
  },
  archiveText: {
    fontSize: 14,
    color: '#888',
    marginLeft: 8,
    flex: 1,
  },
  archiveTextActive: {
    color: '#3B82F6',
  },
  footer: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  primaryButton: {
    backgroundColor: '#3B82F6',
  },
  secondaryButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#fff',
  },
  secondaryButtonText: {
    color: '#888',
  },
});