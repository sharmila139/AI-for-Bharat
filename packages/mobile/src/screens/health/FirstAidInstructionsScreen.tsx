/**
 * First Aid Instructions Screen
 * Step-by-step first aid guidance with risk assessment and emergency contacts
 * 
 * Features:
 * - Risk level display with color coding
 * - Step-by-step first aid instructions
 * - Progress tracking (mark steps as complete)
 * - Warnings and checkpoints
 * - Red flags section
 * - When to seek help guidance
 * - Emergency contacts for critical cases
 * - Outcome feedback collection
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Linking,
} from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { HealthStackParamList, HealthStackNavigationProp } from '../../navigation/types';
import healthService from '../../services/healthService';
import LoadingState from '../../components/LoadingState';
import ErrorState from '../../components/ErrorState';
import {
  SymptomAssessmentResult,
  RiskLevel,
  FirstAidStep,
} from '../../types/health';

type FirstAidInstructionsRouteProp = RouteProp<HealthStackParamList, 'FirstAidInstructions'>;

const FirstAidInstructionsScreen: React.FC = () => {
  const route = useRoute<FirstAidInstructionsRouteProp>();
  const navigation = useNavigation<HealthStackNavigationProp>();
  const { assessmentId, assessmentResult } = route.params;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result] = useState<SymptomAssessmentResult | null>(assessmentResult || null);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (!result && assessmentId) {
      // If we only have assessmentId, fetch the full result
      // For now, we'll use the passed result
      console.log('Assessment ID:', assessmentId);
    }
  }, [assessmentId, result]);

  /**
   * Get risk level color
   */
  const getRiskLevelColor = (riskLevel: RiskLevel): string => {
    switch (riskLevel) {
      case 'low':
        return '#4CAF50';
      case 'medium':
        return '#FF9800';
      case 'high':
        return '#FF5722';
      case 'critical':
        return '#B71C1C';
      default:
        return '#999';
    }
  };

  /**
   * Get risk level label
   */
  const getRiskLevelLabel = (riskLevel: RiskLevel): string => {
    switch (riskLevel) {
      case 'low':
        return 'Low Risk';
      case 'medium':
        return 'Medium Risk';
      case 'high':
        return 'High Risk';
      case 'critical':
        return 'CRITICAL - Immediate Action Required';
      default:
        return 'Unknown';
    }
  };

  /**
   * Toggle step completion
   */
  const toggleStepCompletion = (stepNumber: number) => {
    const newCompleted = new Set(completedSteps);
    if (newCompleted.has(stepNumber)) {
      newCompleted.delete(stepNumber);
    } else {
      newCompleted.add(stepNumber);
    }
    setCompletedSteps(newCompleted);
  };

  /**
   * Call emergency number
   */
  const handleCallEmergency = (phoneNumber: string) => {
    Alert.alert(
      'Call Emergency',
      `Do you want to call ${phoneNumber}?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Call',
          onPress: () => {
            Linking.openURL(`tel:${phoneNumber}`);
          },
        },
      ]
    );
  };

  /**
   * Submit outcome feedback
   */
  const handleSubmitFeedback = async (
    outcome: 'improved' | 'no_change' | 'worsened' | 'sought_medical_help' | 'unknown'
  ) => {
    if (!result) return;

    try {
      await healthService.recordOutcome(result.assessmentId, outcome);
      Alert.alert(
        'Thank You',
        'Your feedback helps us improve our recommendations.',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (err: any) {
      console.error('Error submitting feedback:', err);
      Alert.alert('Error', 'Failed to submit feedback. Please try again.');
    }
  };

  /**
   * Show feedback modal
   */
  const showFeedback = () => {
    Alert.alert(
      'How are you feeling now?',
      'Please let us know the outcome',
      [
        {
          text: 'Much Better',
          onPress: () => handleSubmitFeedback('improved'),
        },
        {
          text: 'No Change',
          onPress: () => handleSubmitFeedback('no_change'),
        },
        {
          text: 'Worse',
          onPress: () => handleSubmitFeedback('worsened'),
        },
        {
          text: 'Saw a Doctor',
          onPress: () => handleSubmitFeedback('sought_medical_help'),
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ]
    );
  };

  /**
   * Render risk assessment header
   */
  const renderRiskAssessment = () => {
    if (!result) return null;

    const { riskAssessment } = result;
    const riskColor = getRiskLevelColor(riskAssessment.riskLevel);
    const riskLabel = getRiskLevelLabel(riskAssessment.riskLevel);

    return (
      <View style={[styles.riskCard, { borderColor: riskColor }]}>
        <View style={styles.riskHeader}>
          <View style={[styles.riskBadge, { backgroundColor: riskColor }]}>
            <Text style={styles.riskBadgeText}>
              {riskAssessment.riskLevel.toUpperCase()}
            </Text>
          </View>
          <Text style={styles.riskConfidence}>
            {riskAssessment.confidence}% confidence
          </Text>
        </View>

        <Text style={[styles.riskLabel, { color: riskColor }]}>
          {riskLabel}
        </Text>

        <Text style={styles.emergencyCategory}>
          Category: {riskAssessment.emergencyCategory.replace(/_/g, ' ').toUpperCase()}
        </Text>

        {riskAssessment.requiresImmediateAttention && (
          <View style={styles.urgentBanner}>
            <Text style={styles.urgentIcon}>⚠️</Text>
            <Text style={styles.urgentText}>
              Immediate medical attention required
            </Text>
          </View>
        )}
      </View>
    );
  };

  /**
   * Render emergency contacts
   */
  const renderEmergencyContacts = () => {
    if (!result?.emergencyContacts) return null;

    const { emergencyContacts } = result;

    return (
      <View style={styles.emergencyCard}>
        <View style={styles.emergencyHeader}>
          <Text style={styles.sectionTitle}>🚨 Emergency Contacts</Text>
          <TouchableOpacity
            style={styles.manageContactsButton}
            onPress={() => navigation.navigate('EmergencyContacts')}
          >
            <Text style={styles.manageContactsText}>Manage</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.emergencyButton}
          onPress={() => handleCallEmergency(emergencyContacts.ambulance)}
        >
          <Text style={styles.emergencyIcon}>🚑</Text>
          <View style={styles.emergencyInfo}>
            <Text style={styles.emergencyLabel}>Ambulance</Text>
            <Text style={styles.emergencyNumber}>{emergencyContacts.ambulance}</Text>
          </View>
          <Text style={styles.callIcon}>📞</Text>
        </TouchableOpacity>

        {emergencyContacts.nearestHospital && (
          <View style={styles.hospitalCard}>
            <Text style={styles.hospitalIcon}>🏥</Text>
            <View style={styles.hospitalInfo}>
              <Text style={styles.hospitalName}>
                {emergencyContacts.nearestHospital.name}
              </Text>
              <Text style={styles.hospitalDistance}>
                {emergencyContacts.nearestHospital.distance}
              </Text>
              <TouchableOpacity
                onPress={() => handleCallEmergency(emergencyContacts.nearestHospital!.phone)}
              >
                <Text style={styles.hospitalPhone}>
                  📞 {emergencyContacts.nearestHospital.phone}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    );
  };

  /**
   * Render red flags
   */
  const renderRedFlags = () => {
    if (!result?.redFlags || result.redFlags.length === 0) return null;

    return (
      <View style={styles.redFlagsCard}>
        <Text style={styles.sectionTitle}>🚩 Warning Signs</Text>
        <Text style={styles.redFlagsSubtitle}>
          Seek immediate medical help if you experience:
        </Text>
        {result.redFlags.map((flag, index) => (
          <View key={index} style={styles.redFlagItem}>
            <Text style={styles.redFlagBullet}>⚠️</Text>
            <Text style={styles.redFlagText}>{flag}</Text>
          </View>
        ))}
      </View>
    );
  };

  /**
   * Render first aid step
   */
  const renderStep = (step: FirstAidStep) => {
    const isCompleted = completedSteps.has(step.stepNumber);

    return (
      <View key={step.stepNumber} style={styles.stepCard}>
        <View style={styles.stepHeader}>
          <TouchableOpacity
            style={[styles.checkbox, isCompleted && styles.checkboxChecked]}
            onPress={() => toggleStepCompletion(step.stepNumber)}
          >
            {isCompleted && <Text style={styles.checkmark}>✓</Text>}
          </TouchableOpacity>

          <View style={styles.stepNumberBadge}>
            <Text style={styles.stepNumberText}>Step {step.stepNumber}</Text>
          </View>

          {step.estimatedTime && (
            <View style={styles.timeEstimate}>
              <Text style={styles.timeIcon}>⏱️</Text>
              <Text style={styles.timeText}>{step.estimatedTime}</Text>
            </View>
          )}
        </View>

        <Text style={[styles.stepInstruction, isCompleted && styles.stepInstructionCompleted]}>
          {step.instruction}
        </Text>

        {step.warning && (
          <View style={styles.warningBox}>
            <Text style={styles.warningIcon}>⚠️</Text>
            <Text style={styles.warningText}>{step.warning}</Text>
          </View>
        )}

        {step.checkpoint && (
          <View style={styles.checkpointBox}>
            <Text style={styles.checkpointIcon}>✓</Text>
            <Text style={styles.checkpointText}>
              <Text style={styles.checkpointLabel}>Checkpoint: </Text>
              {step.checkpoint}
            </Text>
          </View>
        )}

        {step.requiredMaterials && step.requiredMaterials.length > 0 && (
          <View style={styles.materialsBox}>
            <Text style={styles.materialsTitle}>Required materials:</Text>
            <View style={styles.materialsList}>
              {step.requiredMaterials.map((material, index) => (
                <View key={index} style={styles.materialTag}>
                  <Text style={styles.materialText}>{material}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </View>
    );
  };

  /**
   * Render first aid steps
   */
  const renderFirstAidSteps = () => {
    if (!result?.firstAidSteps || result.firstAidSteps.length === 0) return null;

    const completedCount = completedSteps.size;
    const totalSteps = result.firstAidSteps.length;
    const progress = totalSteps > 0 ? (completedCount / totalSteps) * 100 : 0;

    return (
      <View style={styles.stepsContainer}>
        <View style={styles.stepsHeader}>
          <Text style={styles.sectionTitle}>📋 First Aid Steps</Text>
          <Text style={styles.progressText}>
            {completedCount} of {totalSteps} completed
          </Text>
        </View>

        <View style={styles.progressBarContainer}>
          <View style={[styles.progressBar, { width: `${progress}%` }]} />
        </View>

        {result.firstAidSteps.map(renderStep)}
      </View>
    );
  };

  /**
   * Render when to seek help
   */
  const renderWhenToSeekHelp = () => {
    if (!result?.whenToSeekHelp) return null;

    return (
      <View style={styles.seekHelpCard}>
        <Text style={styles.sectionTitle}>🏥 When to Seek Medical Help</Text>
        <Text style={styles.seekHelpText}>{result.whenToSeekHelp}</Text>
      </View>
    );
  };

  /**
   * Render action buttons
   */
  const renderActions = () => {
    const allStepsCompleted = result?.firstAidSteps.length === completedSteps.size;

    return (
      <View style={styles.actionsContainer}>
        {allStepsCompleted && (
          <TouchableOpacity
            style={styles.feedbackButton}
            onPress={showFeedback}
          >
            <Text style={styles.feedbackButtonText}>Provide Feedback</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.doneButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.doneButtonText}>Done</Text>
        </TouchableOpacity>
      </View>
    );
  };

  if (loading) {
    return <LoadingState message="Loading first aid instructions..." />;
  }

  if (error) {
    return (
      <ErrorState
        message={error}
        onRetry={() => {
          setError(null);
          setLoading(false);
        }}
      />
    );
  }

  if (!result) {
    return (
      <ErrorState
        message="No assessment result available"
        onRetry={() => navigation.goBack()}
      />
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {renderRiskAssessment()}
        {renderEmergencyContacts()}
        {renderRedFlags()}
        {renderFirstAidSteps()}
        {renderWhenToSeekHelp()}
        {renderActions()}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2196F3',
    marginBottom: 12,
  },
  // Risk Assessment Styles
  riskCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 3,
  },
  riskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  riskBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  riskBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  riskConfidence: {
    fontSize: 12,
    color: '#666',
  },
  riskLabel: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  emergencyCategory: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  urgentBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFEBEE',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  urgentIcon: {
    fontSize: 24,
    marginRight: 8,
  },
  urgentText: {
    flex: 1,
    fontSize: 14,
    fontWeight: 'bold',
    color: '#C62828',
  },
  // Emergency Contacts Styles
  emergencyCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  emergencyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  manageContactsButton: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  manageContactsText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2196F3',
  },
  emergencyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFEBEE',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#F44336',
  },
  emergencyIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  emergencyInfo: {
    flex: 1,
  },
  emergencyLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  emergencyNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#C62828',
  },
  callIcon: {
    fontSize: 24,
  },
  hospitalCard: {
    flexDirection: 'row',
    backgroundColor: '#E3F2FD',
    padding: 12,
    borderRadius: 8,
  },
  hospitalIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  hospitalInfo: {
    flex: 1,
  },
  hospitalName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  hospitalDistance: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  hospitalPhone: {
    fontSize: 13,
    color: '#2196F3',
    fontWeight: '600',
  },
  // Red Flags Styles
  redFlagsCard: {
    backgroundColor: '#FFF3E0',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#FF9800',
  },
  redFlagsSubtitle: {
    fontSize: 13,
    color: '#666',
    marginBottom: 12,
  },
  redFlagItem: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  redFlagBullet: {
    fontSize: 16,
    marginRight: 8,
    marginTop: 2,
  },
  redFlagText: {
    flex: 1,
    fontSize: 14,
    color: '#E65100',
    lineHeight: 20,
    fontWeight: '500',
  },
  // First Aid Steps Styles
  stepsContainer: {
    marginBottom: 16,
  },
  stepsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressText: {
    fontSize: 13,
    color: '#666',
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    marginBottom: 16,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 4,
  },
  stepCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#2196F3',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  checkboxChecked: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  checkmark: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  stepNumberBadge: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
  },
  stepNumberText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1976D2',
  },
  timeEstimate: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 'auto',
  },
  timeIcon: {
    fontSize: 14,
    marginRight: 4,
  },
  timeText: {
    fontSize: 12,
    color: '#666',
  },
  stepInstruction: {
    fontSize: 15,
    color: '#333',
    lineHeight: 22,
    marginBottom: 8,
  },
  stepInstructionCompleted: {
    color: '#999',
    textDecorationLine: 'line-through',
  },
  warningBox: {
    flexDirection: 'row',
    backgroundColor: '#FFF3E0',
    padding: 10,
    borderRadius: 8,
    marginTop: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
  },
  warningIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  warningText: {
    flex: 1,
    fontSize: 13,
    color: '#E65100',
    lineHeight: 18,
  },
  checkpointBox: {
    flexDirection: 'row',
    backgroundColor: '#E8F5E9',
    padding: 10,
    borderRadius: 8,
    marginTop: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  checkpointIcon: {
    fontSize: 16,
    marginRight: 8,
    color: '#4CAF50',
  },
  checkpointText: {
    flex: 1,
    fontSize: 13,
    color: '#2E7D32',
    lineHeight: 18,
  },
  checkpointLabel: {
    fontWeight: 'bold',
  },
  materialsBox: {
    marginTop: 8,
    padding: 10,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
  },
  materialsTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginBottom: 6,
  },
  materialsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  materialTag: {
    backgroundColor: '#fff',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  materialText: {
    fontSize: 11,
    color: '#333',
  },
  // When to Seek Help Styles
  seekHelpCard: {
    backgroundColor: '#E3F2FD',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#2196F3',
  },
  seekHelpText: {
    fontSize: 14,
    color: '#1565C0',
    lineHeight: 20,
  },
  // Actions Styles
  actionsContainer: {
    gap: 12,
  },
  feedbackButton: {
    backgroundColor: '#4CAF50',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  feedbackButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  doneButton: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#2196F3',
  },
  doneButtonText: {
    color: '#2196F3',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default FirstAidInstructionsScreen;
