/**
 * Student Profile Screen
 * Create and manage student profile for personalized learning
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { EducationStackNavigationProp } from '../../navigation/types';
import educationService from '../../services/educationService';
import {
  StudentProfileInput,
  GradeLevel,
  Subject,
  LearningStyle,
  GRADE_LEVELS,
  SUBJECTS,
  LEARNING_STYLES,
} from '../../types/education';
import { LoadingState } from '../../components/LoadingState';
import { ErrorState } from '../../components/ErrorState';

const StudentProfileScreen: React.FC = () => {
  const navigation = useNavigation<EducationStackNavigationProp>();

  // Form state
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [gradeLevel, setGradeLevel] = useState<GradeLevel | null>(null);
  const [selectedSubjects, setSelectedSubjects] = useState<Subject[]>([]);
  const [learningStyle, setLearningStyle] = useState<LearningStyle>('mixed');
  const [preferredLanguage, setPreferredLanguage] = useState('english');

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Toggle subject selection
   */
  const toggleSubject = (subject: Subject) => {
    if (selectedSubjects.includes(subject)) {
      setSelectedSubjects(selectedSubjects.filter(s => s !== subject));
    } else {
      setSelectedSubjects([...selectedSubjects, subject]);
    }
  };

  /**
   * Validate form
   */
  const validateForm = (): boolean => {
    if (!name.trim()) {
      Alert.alert('Validation Error', 'Please enter student name');
      return false;
    }

    const ageNum = parseInt(age);
    if (!age || isNaN(ageNum) || ageNum < 5 || ageNum > 20) {
      Alert.alert('Validation Error', 'Please enter a valid age (5-20)');
      return false;
    }

    if (!gradeLevel) {
      Alert.alert('Validation Error', 'Please select grade level');
      return false;
    }

    if (selectedSubjects.length === 0) {
      Alert.alert('Validation Error', 'Please select at least one subject');
      return false;
    }

    return true;
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const profileData: StudentProfileInput = {
        userId: 'user-001', // TODO: Get from auth context
        name: name.trim(),
        age: parseInt(age),
        gradeLevel: gradeLevel!,
        subjects: selectedSubjects,
        learningStyle,
        preferredLanguage,
      };

      const profile = await educationService.createStudentProfile(profileData);

      Alert.alert(
        'Success',
        'Student profile created successfully!',
        [
          {
            text: 'Start Diagnostic Assessment',
            onPress: () => navigation.navigate('DiagnosticAssessment', { 
              studentId: profile.id 
            }),
          },
        ]
      );
    } catch (err: any) {
      console.error('Error creating profile:', err);
      setError(err.message || 'Failed to create student profile');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingState message="Creating student profile..." />;
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Student Profile</Text>
        <Text style={styles.subtitle}>
          Let's personalize your learning experience
        </Text>
      </View>

      {error && <ErrorState message={error} onRetry={() => setError(null)} />}

      <View style={styles.form}>
        {/* Name Input */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Student Name *</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Enter student name"
            placeholderTextColor="#999"
          />
        </View>

        {/* Age Input */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Age *</Text>
          <TextInput
            style={styles.input}
            value={age}
            onChangeText={setAge}
            placeholder="Enter age"
            placeholderTextColor="#999"
            keyboardType="numeric"
          />
        </View>

        {/* Grade Level Selection */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Grade Level *</Text>
          <View style={styles.optionsGrid}>
            {GRADE_LEVELS.map((grade) => (
              <TouchableOpacity
                key={grade.value}
                style={[
                  styles.optionButton,
                  gradeLevel === grade.value && styles.optionButtonSelected,
                ]}
                onPress={() => setGradeLevel(grade.value)}
              >
                <Text
                  style={[
                    styles.optionText,
                    gradeLevel === grade.value && styles.optionTextSelected,
                  ]}
                >
                  {grade.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Subject Selection */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Subjects * (Select at least one)</Text>
          <View style={styles.subjectGrid}>
            {SUBJECTS.map((subject) => (
              <TouchableOpacity
                key={subject.value}
                style={[
                  styles.subjectCard,
                  selectedSubjects.includes(subject.value) && styles.subjectCardSelected,
                ]}
                onPress={() => toggleSubject(subject.value)}
              >
                <Text style={styles.subjectIcon}>{subject.icon}</Text>
                <Text
                  style={[
                    styles.subjectText,
                    selectedSubjects.includes(subject.value) && styles.subjectTextSelected,
                  ]}
                >
                  {subject.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Learning Style Selection */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Learning Style</Text>
          <Text style={styles.hint}>How do you learn best?</Text>
          {LEARNING_STYLES.map((style) => (
            <TouchableOpacity
              key={style.value}
              style={[
                styles.learningStyleCard,
                learningStyle === style.value && styles.learningStyleCardSelected,
              ]}
              onPress={() => setLearningStyle(style.value)}
            >
              <View style={styles.learningStyleContent}>
                <Text
                  style={[
                    styles.learningStyleTitle,
                    learningStyle === style.value && styles.learningStyleTitleSelected,
                  ]}
                >
                  {style.label}
                </Text>
                <Text style={styles.learningStyleDescription}>
                  {style.description}
                </Text>
              </View>
              <View
                style={[
                  styles.radio,
                  learningStyle === style.value && styles.radioSelected,
                ]}
              />
            </TouchableOpacity>
          ))}
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={styles.submitButton}
          onPress={handleSubmit}
          disabled={loading}
        >
          <Text style={styles.submitButtonText}>
            Create Profile & Start Assessment
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 20,
    backgroundColor: '#FF9800',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#ffffff',
    opacity: 0.9,
  },
  form: {
    padding: 16,
  },
  formGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  hint: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  input: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  optionButtonSelected: {
    backgroundColor: '#FF9800',
    borderColor: '#FF9800',
  },
  optionText: {
    fontSize: 14,
    color: '#333',
  },
  optionTextSelected: {
    color: '#ffffff',
    fontWeight: '600',
  },
  subjectGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  subjectCard: {
    width: '47%',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ddd',
  },
  subjectCardSelected: {
    borderColor: '#FF9800',
    backgroundColor: '#FFF3E0',
  },
  subjectIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  subjectText: {
    fontSize: 14,
    color: '#333',
    textAlign: 'center',
  },
  subjectTextSelected: {
    color: '#FF9800',
    fontWeight: '600',
  },
  learningStyleCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 2,
    borderColor: '#ddd',
  },
  learningStyleCardSelected: {
    borderColor: '#FF9800',
    backgroundColor: '#FFF3E0',
  },
  learningStyleContent: {
    flex: 1,
  },
  learningStyleTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  learningStyleTitleSelected: {
    color: '#FF9800',
  },
  learningStyleDescription: {
    fontSize: 14,
    color: '#666',
  },
  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#ddd',
  },
  radioSelected: {
    borderColor: '#FF9800',
    backgroundColor: '#FF9800',
  },
  submitButton: {
    backgroundColor: '#FF9800',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
  },
});

export default StudentProfileScreen;
