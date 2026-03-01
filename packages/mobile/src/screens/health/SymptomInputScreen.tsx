/**
 * Symptom Input Screen
 * Comprehensive symptom input with text, voice, and body map support
 * 
 * Features:
 * - Three input methods: text entry, voice input, body map
 * - Common symptom suggestions
 * - Multiple symptoms with severity and duration
 * - Patient context (age, gender)
 * - Navigation to assessment results
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { HealthStackNavigationProp } from '../../navigation/types';
import healthService from '../../services/healthService';
import LoadingState from '../../components/LoadingState';
import {
  SymptomInput,
  PatientInfo,
  InputMethod,
  COMMON_SYMPTOMS,
  SEVERITY_OPTIONS,
  DURATION_OPTIONS,
  SymptomSeverity,
  SymptomDuration,
} from '../../types/health';

const SymptomInputScreen: React.FC = () => {
  const navigation = useNavigation<HealthStackNavigationProp>();

  // Input method selection
  const [inputMethod, setInputMethod] = useState<InputMethod>('text');
  const [showMethodSelector, setShowMethodSelector] = useState(false);

  // Symptoms list
  const [symptoms, setSymptoms] = useState<SymptomInput[]>([]);
  const [currentSymptom, setCurrentSymptom] = useState<Partial<SymptomInput>>({
    symptomName: '',
    severity: 'moderate',
    duration: '1_to_6_hours',
  });

  // Patient info
  const [age, setAge] = useState('');
  const [gender, setGender] = useState<'male' | 'female' | 'other'>('male');
  const [chronicConditions, setChronicConditions] = useState('');
  const [currentMedications, setCurrentMedications] = useState('');

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCommonSymptoms, setShowCommonSymptoms] = useState(false);

  /**
   * Add symptom to list
   */
  const handleAddSymptom = () => {
    if (!currentSymptom.symptomName || currentSymptom.symptomName.trim() === '') {
      Alert.alert('Validation Error', 'Please enter a symptom name');
      return;
    }

    if (!currentSymptom.severity) {
      Alert.alert('Validation Error', 'Please select symptom severity');
      return;
    }

    if (!currentSymptom.duration) {
      Alert.alert('Validation Error', 'Please select symptom duration');
      return;
    }

    const newSymptom: SymptomInput = {
      symptomName: currentSymptom.symptomName,
      severity: currentSymptom.severity as SymptomSeverity,
      duration: currentSymptom.duration as SymptomDuration,
      bodyPart: currentSymptom.bodyPart,
      additionalDetails: currentSymptom.additionalDetails,
    };

    setSymptoms([...symptoms, newSymptom]);
    
    // Reset current symptom
    setCurrentSymptom({
      symptomName: '',
      severity: 'moderate',
      duration: '1_to_6_hours',
    });
    
    setShowCommonSymptoms(false);
  };

  /**
   * Remove symptom from list
   */
  const handleRemoveSymptom = (index: number) => {
    setSymptoms(symptoms.filter((_, i) => i !== index));
  };

  /**
   * Select common symptom
   */
  const handleSelectCommonSymptom = (symptomLabel: string) => {
    setCurrentSymptom({
      ...currentSymptom,
      symptomName: symptomLabel,
    });
    setShowCommonSymptoms(false);
  };

  /**
   * Validate and submit assessment
   */
  const handleSubmit = async () => {
    // Validate symptoms
    if (symptoms.length === 0) {
      Alert.alert('Validation Error', 'Please add at least one symptom');
      return;
    }

    // Validate patient info
    if (!age || age.trim() === '') {
      Alert.alert('Validation Error', 'Please enter patient age');
      return;
    }

    const ageNum = parseInt(age);
    if (isNaN(ageNum) || ageNum < 0 || ageNum > 120) {
      Alert.alert('Validation Error', 'Please enter a valid age (0-120)');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const patientInfo: PatientInfo = {
        age: ageNum,
        gender,
        chronicConditions: chronicConditions
          ? chronicConditions.split(',').map(c => c.trim())
          : undefined,
        currentMedications: currentMedications
          ? currentMedications.split(',').map(m => m.trim())
          : undefined,
      };

      const result = await healthService.assessSymptoms(
        symptoms,
        patientInfo,
        inputMethod
      );

      // Navigate to FirstAidInstructionsScreen
      navigation.navigate('FirstAidInstructions', {
        assessmentId: result.assessmentId,
        assessmentResult: result,
      });
    } catch (err: any) {
      console.error('Error submitting assessment:', err);
      setError(err.message || 'Failed to assess symptoms. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Render input method selector
   */
  const renderMethodSelector = () => (
    <Modal
      visible={showMethodSelector}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowMethodSelector(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Input Method</Text>
            <TouchableOpacity onPress={() => setShowMethodSelector(false)}>
              <Text style={styles.modalClose}>✕</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[
              styles.methodOption,
              inputMethod === 'text' && styles.methodOptionActive,
            ]}
            onPress={() => {
              setInputMethod('text');
              setShowMethodSelector(false);
            }}
          >
            <Text style={styles.methodOptionIcon}>✍️</Text>
            <View style={styles.methodOptionContent}>
              <Text style={styles.methodOptionTitle}>Text Entry</Text>
              <Text style={styles.methodOptionDescription}>
                Type symptoms manually with suggestions
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.methodOption,
              inputMethod === 'voice' && styles.methodOptionActive,
            ]}
            onPress={() => {
              Alert.alert('Coming Soon', 'Voice input will be available in the next update');
              setShowMethodSelector(false);
            }}
          >
            <Text style={styles.methodOptionIcon}>🎤</Text>
            <View style={styles.methodOptionContent}>
              <Text style={styles.methodOptionTitle}>Voice Input</Text>
              <Text style={styles.methodOptionDescription}>
                Speak your symptoms for hands-free reporting
              </Text>
              <Text style={styles.comingSoonBadge}>Coming Soon</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.methodOption,
              inputMethod === 'body_map' && styles.methodOptionActive,
            ]}
            onPress={() => {
              Alert.alert('Coming Soon', 'Body map will be available in the next update');
              setShowMethodSelector(false);
            }}
          >
            <Text style={styles.methodOptionIcon}>🧍</Text>
            <View style={styles.methodOptionContent}>
              <Text style={styles.methodOptionTitle}>Body Map</Text>
              <Text style={styles.methodOptionDescription}>
                Tap on body diagram to indicate pain location
              </Text>
              <Text style={styles.comingSoonBadge}>Coming Soon</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  /**
   * Render common symptoms modal
   */
  const renderCommonSymptoms = () => (
    <Modal
      visible={showCommonSymptoms}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowCommonSymptoms(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Common Symptoms</Text>
            <TouchableOpacity onPress={() => setShowCommonSymptoms(false)}>
              <Text style={styles.modalClose}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.commonSymptomsList}>
            {COMMON_SYMPTOMS.map((symptom) => (
              <TouchableOpacity
                key={symptom.value}
                style={styles.commonSymptomItem}
                onPress={() => handleSelectCommonSymptom(symptom.label)}
              >
                <Text style={styles.commonSymptomIcon}>{symptom.icon}</Text>
                <Text style={styles.commonSymptomLabel}>{symptom.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  if (loading) {
    return <LoadingState message="Assessing symptoms..." />;
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* Input Method Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Input Method</Text>
          <TouchableOpacity
            style={styles.methodSelector}
            onPress={() => setShowMethodSelector(true)}
          >
            <View style={styles.methodSelectorContent}>
              <Text style={styles.methodSelectorIcon}>
                {inputMethod === 'text' ? '✍️' : inputMethod === 'voice' ? '🎤' : '🧍'}
              </Text>
              <View style={styles.methodSelectorText}>
                <Text style={styles.methodSelectorTitle}>
                  {inputMethod === 'text'
                    ? 'Text Entry'
                    : inputMethod === 'voice'
                    ? 'Voice Input'
                    : 'Body Map'}
                </Text>
                <Text style={styles.methodSelectorDescription}>
                  {inputMethod === 'text'
                    ? 'Type symptoms manually'
                    : inputMethod === 'voice'
                    ? 'Speak your symptoms'
                    : 'Tap on body diagram'}
                </Text>
              </View>
            </View>
            <Text style={styles.methodSelectorArrow}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Current Symptom Input */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Add Symptom</Text>

          <Text style={styles.label}>Symptom Name *</Text>
          <View style={styles.symptomInputRow}>
            <TextInput
              style={[styles.input, styles.symptomInput]}
              value={currentSymptom.symptomName}
              onChangeText={(text) =>
                setCurrentSymptom({ ...currentSymptom, symptomName: text })
              }
              placeholder="e.g., Headache, Fever, Cough"
              placeholderTextColor="#999"
            />
            <TouchableOpacity
              style={styles.suggestButton}
              onPress={() => setShowCommonSymptoms(true)}
            >
              <Text style={styles.suggestButtonText}>💡</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>Severity *</Text>
          <View style={styles.severityButtons}>
            {SEVERITY_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.severityButton,
                  currentSymptom.severity === option.value && {
                    backgroundColor: option.color,
                    borderColor: option.color,
                  },
                ]}
                onPress={() =>
                  setCurrentSymptom({ ...currentSymptom, severity: option.value })
                }
              >
                <Text
                  style={[
                    styles.severityButtonText,
                    currentSymptom.severity === option.value && styles.severityButtonTextActive,
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Duration *</Text>
          <View style={styles.durationButtons}>
            {DURATION_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.durationButton,
                  currentSymptom.duration === option.value && styles.durationButtonActive,
                ]}
                onPress={() =>
                  setCurrentSymptom({ ...currentSymptom, duration: option.value })
                }
              >
                <Text
                  style={[
                    styles.durationButtonText,
                    currentSymptom.duration === option.value && styles.durationButtonTextActive,
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Additional Details (Optional)</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={currentSymptom.additionalDetails}
            onChangeText={(text) =>
              setCurrentSymptom({ ...currentSymptom, additionalDetails: text })
            }
            placeholder="Any additional information about this symptom..."
            placeholderTextColor="#999"
            multiline
            numberOfLines={3}
          />

          <TouchableOpacity style={styles.addButton} onPress={handleAddSymptom}>
            <Text style={styles.addButtonText}>+ Add Symptom</Text>
          </TouchableOpacity>
        </View>

        {/* Added Symptoms List */}
        {symptoms.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Symptoms ({symptoms.length})</Text>
            {symptoms.map((symptom, index) => (
              <View key={index} style={styles.symptomCard}>
                <View style={styles.symptomCardHeader}>
                  <Text style={styles.symptomCardTitle}>{symptom.symptomName}</Text>
                  <TouchableOpacity onPress={() => handleRemoveSymptom(index)}>
                    <Text style={styles.removeButton}>✕</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.symptomCardDetails}>
                  <View style={styles.symptomBadge}>
                    <Text style={styles.symptomBadgeText}>
                      {SEVERITY_OPTIONS.find(s => s.value === symptom.severity)?.label}
                    </Text>
                  </View>
                  <View style={styles.symptomBadge}>
                    <Text style={styles.symptomBadgeText}>
                      {DURATION_OPTIONS.find(d => d.value === symptom.duration)?.label}
                    </Text>
                  </View>
                </View>
                {symptom.additionalDetails && (
                  <Text style={styles.symptomCardDetails}>{symptom.additionalDetails}</Text>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Patient Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Patient Information</Text>

          <Text style={styles.label}>Age *</Text>
          <TextInput
            style={styles.input}
            value={age}
            onChangeText={setAge}
            placeholder="Enter age"
            placeholderTextColor="#999"
            keyboardType="numeric"
          />

          <Text style={styles.label}>Gender *</Text>
          <View style={styles.genderButtons}>
            {(['male', 'female', 'other'] as const).map((g) => (
              <TouchableOpacity
                key={g}
                style={[
                  styles.genderButton,
                  gender === g && styles.genderButtonActive,
                ]}
                onPress={() => setGender(g)}
              >
                <Text
                  style={[
                    styles.genderButtonText,
                    gender === g && styles.genderButtonTextActive,
                  ]}
                >
                  {g.charAt(0).toUpperCase() + g.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Chronic Conditions (Optional)</Text>
          <TextInput
            style={styles.input}
            value={chronicConditions}
            onChangeText={setChronicConditions}
            placeholder="e.g., Diabetes, Hypertension (comma separated)"
            placeholderTextColor="#999"
          />

          <Text style={styles.label}>Current Medications (Optional)</Text>
          <TextInput
            style={styles.input}
            value={currentMedications}
            onChangeText={setCurrentMedications}
            placeholder="e.g., Aspirin, Metformin (comma separated)"
            placeholderTextColor="#999"
          />
        </View>

        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <Text style={styles.requiredNote}>* Required fields</Text>
      </ScrollView>

      {/* Submit Button */}
      <View style={styles.actionBar}>
        <TouchableOpacity
          style={[styles.submitButton, (loading || symptoms.length === 0) && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading || symptoms.length === 0}
        >
          <Text style={styles.submitButtonText}>Get Assessment</Text>
        </TouchableOpacity>
      </View>

      {renderMethodSelector()}
      {renderCommonSymptoms()}
    </KeyboardAvoidingView>
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
    paddingBottom: 100,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2196F3',
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#333',
    backgroundColor: '#fff',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  symptomInputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  symptomInput: {
    flex: 1,
  },
  suggestButton: {
    width: 48,
    height: 48,
    backgroundColor: '#E3F2FD',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  suggestButtonText: {
    fontSize: 24,
  },
  severityButtons: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 6,
  },
  severityButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  severityButtonText: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },
  severityButtonTextActive: {
    color: '#fff',
  },
  durationButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 6,
  },
  durationButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
  },
  durationButtonActive: {
    backgroundColor: '#2196F3',
    borderColor: '#2196F3',
  },
  durationButtonText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  durationButtonTextActive: {
    color: '#fff',
  },
  addButton: {
    backgroundColor: '#2196F3',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  symptomCard: {
    backgroundColor: '#E3F2FD',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  symptomCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  symptomCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1976D2',
    flex: 1,
  },
  removeButton: {
    fontSize: 20,
    color: '#666',
    paddingHorizontal: 8,
  },
  symptomCardDetails: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 4,
  },
  symptomBadge: {
    backgroundColor: '#fff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  symptomBadgeText: {
    fontSize: 11,
    color: '#1976D2',
    fontWeight: '500',
  },
  genderButtons: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 6,
  },
  genderButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  genderButtonActive: {
    backgroundColor: '#2196F3',
    borderColor: '#2196F3',
  },
  genderButtonText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  genderButtonTextActive: {
    color: '#fff',
  },
  errorContainer: {
    backgroundColor: '#FFEBEE',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  errorText: {
    color: '#C62828',
    fontSize: 14,
  },
  requiredNote: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 8,
  },
  actionBar: {
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  submitButton: {
    backgroundColor: '#2196F3',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#90CAF9',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  methodSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  methodSelectorContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  methodSelectorIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  methodSelectorText: {
    flex: 1,
  },
  methodSelectorTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  methodSelectorDescription: {
    fontSize: 12,
    color: '#666',
  },
  methodSelectorArrow: {
    fontSize: 24,
    color: '#999',
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  modalClose: {
    fontSize: 24,
    color: '#666',
  },
  methodOption: {
    flexDirection: 'row',
    padding: 16,
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    backgroundColor: '#fff',
  },
  methodOptionActive: {
    borderColor: '#2196F3',
    backgroundColor: '#E3F2FD',
  },
  methodOptionIcon: {
    fontSize: 40,
    marginRight: 12,
  },
  methodOptionContent: {
    flex: 1,
  },
  methodOptionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  methodOptionDescription: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },
  comingSoonBadge: {
    fontSize: 11,
    color: '#FF9800',
    fontWeight: '600',
    marginTop: 4,
  },
  commonSymptomsList: {
    maxHeight: 400,
  },
  commonSymptomItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  commonSymptomIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  commonSymptomLabel: {
    fontSize: 16,
    color: '#333',
  },
});

export default SymptomInputScreen;
