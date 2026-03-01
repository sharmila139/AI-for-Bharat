/**
 * Diagnostic Assessment Screen
 * Initial knowledge assessment to establish baseline proficiency
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { EducationStackNavigationProp, EducationStackParamList } from '../../navigation/types';
import educationService from '../../services/educationService';
import {
  AssessmentQuestion,
  AssessmentResponse,
  DiagnosticAssessmentResult,
  Subject,
  SUBJECTS,
} from '../../types/education';
import { LoadingState } from '../../components/LoadingState';
import { ErrorState } from '../../components/ErrorState';

type DiagnosticAssessmentRouteProp = RouteProp<EducationStackParamList, 'DiagnosticAssessment'>;

const DiagnosticAssessmentScreen: React.FC = () => {
  const navigation = useNavigation<EducationStackNavigationProp>();
  const route = useRoute<DiagnosticAssessmentRouteProp>();
  const { studentId } = route.params;

  // State
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [questions, setQuestions] = useState<AssessmentQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [responses, setResponses] = useState<AssessmentResponse[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [startTime, setStartTime] = useState<number>(Date.now());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [assessmentStarted, setAssessmentStarted] = useState(false);
  const [assessmentComplete, setAssessmentComplete] = useState(false);
  const [result, setResult] = useState<DiagnosticAssessmentResult | null>(null);

  const currentQuestion = questions[currentQuestionIndex];
  const progress = questions.length > 0 ? (currentQuestionIndex + 1) / questions.length : 0;

  /**
   * Load questions for selected subject
   */
  const loadQuestions = async (subject: Subject) => {
    setLoading(true);
    setError(null);

    try {
      const fetchedQuestions = await educationService.getDiagnosticQuestions(subject);
      setQuestions(fetchedQuestions);
      setAssessmentStarted(true);
      setStartTime(Date.now());
    } catch (err: any) {
      console.error('Error loading questions:', err);
      setError(err.message || 'Failed to load assessment questions');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle subject selection
   */
  const handleSubjectSelect = (subject: Subject) => {
    setSelectedSubject(subject);
    loadQuestions(subject);
  };

  /**
   * Handle answer selection
   */
  const handleAnswerSelect = (answer: string) => {
    setSelectedAnswer(answer);
  };

  /**
   * Handle next question
   */
  const handleNext = () => {
    if (!selectedAnswer || !currentQuestion) {
      Alert.alert('Please select an answer', 'You must select an answer to continue');
      return;
    }

    // Record response
    const timeSpent = Math.floor((Date.now() - startTime) / 1000);
    const response: AssessmentResponse = {
      questionId: currentQuestion.id,
      answer: selectedAnswer,
      timeSpent,
    };

    const newResponses = [...responses, response];
    setResponses(newResponses);

    // Move to next question or finish
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedAnswer(null);
      setStartTime(Date.now());
    } else {
      // Assessment complete
      submitAssessment(newResponses);
    }
  };

  /**
   * Submit assessment
   */
  const submitAssessment = async (finalResponses: AssessmentResponse[]) => {
    setLoading(true);
    setError(null);

    try {
      const assessmentResult = await educationService.submitDiagnosticAssessment({
        studentId,
        subjectId: selectedSubject!,
        responses: finalResponses,
      });

      setResult(assessmentResult);
      setAssessmentComplete(true);
    } catch (err: any) {
      console.error('Error submitting assessment:', err);
      setError(err.message || 'Failed to submit assessment');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle assessment completion
   */
  const handleComplete = () => {
    Alert.alert(
      'Assessment Complete',
      'Your knowledge profile has been created. Start learning now!',
      [
        {
          text: 'View Progress',
          onPress: () => navigation.navigate('Progress'),
        },
        {
          text: 'Browse Content',
          onPress: () => navigation.navigate('ContentLibrary'),
        },
      ]
    );
  };

  if (loading) {
    return <LoadingState message="Loading assessment..." />;
  }

  // Subject selection screen
  if (!assessmentStarted) {
    return (
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Diagnostic Assessment</Text>
          <Text style={styles.subtitle}>
            Select a subject to begin your assessment
          </Text>
        </View>

        {error && <ErrorState message={error} onRetry={() => setError(null)} />}

        <View style={styles.content}>
          <Text style={styles.sectionTitle}>Choose a Subject</Text>
          <View style={styles.subjectGrid}>
            {SUBJECTS.map((subject) => (
              <TouchableOpacity
                key={subject.value}
                style={styles.subjectCard}
                onPress={() => handleSubjectSelect(subject.value)}
              >
                <Text style={styles.subjectIcon}>{subject.icon}</Text>
                <Text style={styles.subjectLabel}>{subject.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.infoBox}>
            <Text style={styles.infoTitle}>About this assessment:</Text>
            <Text style={styles.infoText}>
              • 10-15 questions to evaluate your current knowledge
            </Text>
            <Text style={styles.infoText}>
              • Takes approximately 10-15 minutes
            </Text>
            <Text style={styles.infoText}>
              • Helps us personalize your learning path
            </Text>
            <Text style={styles.infoText}>
              • No pressure - this is just to understand your starting point
            </Text>
          </View>
        </View>
      </ScrollView>
    );
  }

  // Assessment complete screen
  if (assessmentComplete && result) {
    return (
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Assessment Complete! 🎉</Text>
          <Text style={styles.subtitle}>
            Here's your knowledge profile
          </Text>
        </View>

        <View style={styles.content}>
          <View style={styles.resultCard}>
            <Text style={styles.resultTitle}>Overall Score</Text>
            <Text style={styles.resultScore}>{Math.round(result.score)}%</Text>
            <Text style={styles.resultSubtext}>
              {result.correctAnswers} out of {result.totalQuestions} correct
            </Text>
          </View>

          {result.topicScores.length > 0 && (
            <View style={styles.topicsSection}>
              <Text style={styles.sectionTitle}>Topic Breakdown</Text>
              {result.topicScores.map((topic, index) => (
                <View key={index} style={styles.topicCard}>
                  <View style={styles.topicHeader}>
                    <Text style={styles.topicName}>{topic.topicName}</Text>
                    <Text style={styles.topicScore}>
                      {Math.round(topic.proficiency)}%
                    </Text>
                  </View>
                  <View style={styles.progressBar}>
                    <View
                      style={[
                        styles.progressFill,
                        { width: `${topic.proficiency}%` },
                      ]}
                    />
                  </View>
                  <Text style={styles.topicDetails}>
                    {topic.correctAnswers}/{topic.questionsAttempted} correct
                  </Text>
                </View>
              ))}
            </View>
          )}

          {result.recommendations.length > 0 && (
            <View style={styles.recommendationsSection}>
              <Text style={styles.sectionTitle}>Recommendations</Text>
              {result.recommendations.map((rec, index) => (
                <View key={index} style={styles.recommendationCard}>
                  <Text style={styles.recommendationText}>• {rec}</Text>
                </View>
              ))}
            </View>
          )}

          <TouchableOpacity
            style={styles.completeButton}
            onPress={handleComplete}
          >
            <Text style={styles.completeButtonText}>
              Start Learning
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  // Question screen
  if (!currentQuestion) {
    return <LoadingState message="Loading question..." />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.progressHeader}>
        <Text style={styles.progressText}>
          Question {currentQuestionIndex + 1} of {questions.length}
        </Text>
        <View style={styles.progressBarContainer}>
          <View style={[styles.progressBarFill, { width: `${progress * 100}%` }]} />
        </View>
      </View>

      <ScrollView style={styles.questionContainer}>
        <View style={styles.questionCard}>
          <Text style={styles.topicBadge}>{currentQuestion.topicName}</Text>
          <Text style={styles.questionText}>{currentQuestion.question}</Text>

          {currentQuestion.questionType === 'multiple_choice' && currentQuestion.options && (
            <View style={styles.optionsContainer}>
              {currentQuestion.options.map((option, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.optionCard,
                    selectedAnswer === option && styles.optionCardSelected,
                  ]}
                  onPress={() => handleAnswerSelect(option)}
                >
                  <View
                    style={[
                      styles.optionRadio,
                      selectedAnswer === option && styles.optionRadioSelected,
                    ]}
                  />
                  <Text
                    style={[
                      styles.optionText,
                      selectedAnswer === option && styles.optionTextSelected,
                    ]}
                  >
                    {option}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.nextButton,
            !selectedAnswer && styles.nextButtonDisabled,
          ]}
          onPress={handleNext}
          disabled={!selectedAnswer}
        >
          <Text style={styles.nextButtonText}>
            {currentQuestionIndex < questions.length - 1 ? 'Next' : 'Finish'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
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
  content: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  subjectGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  subjectCard: {
    width: '47%',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  subjectIcon: {
    fontSize: 40,
    marginBottom: 8,
  },
  subjectLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
  infoBox: {
    backgroundColor: '#E3F2FD',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1976D2',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#1565C0',
    marginBottom: 4,
  },
  progressHeader: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  progressText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#FF9800',
  },
  questionContainer: {
    flex: 1,
  },
  questionCard: {
    backgroundColor: '#ffffff',
    margin: 16,
    borderRadius: 12,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  topicBadge: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FF9800',
    backgroundColor: '#FFF3E0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: 16,
  },
  questionText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 24,
    lineHeight: 26,
  },
  optionsContainer: {
    gap: 12,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: '#E0E0E0',
  },
  optionCardSelected: {
    backgroundColor: '#FFF3E0',
    borderColor: '#FF9800',
  },
  optionRadio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#999',
    marginRight: 12,
  },
  optionRadioSelected: {
    borderColor: '#FF9800',
    backgroundColor: '#FF9800',
  },
  optionText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  optionTextSelected: {
    fontWeight: '600',
    color: '#FF9800',
  },
  footer: {
    padding: 16,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#ddd',
  },
  nextButton: {
    backgroundColor: '#FF9800',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  nextButtonDisabled: {
    backgroundColor: '#BDBDBD',
  },
  nextButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
  },
  resultCard: {
    backgroundColor: '#4CAF50',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
  },
  resultTitle: {
    fontSize: 16,
    color: '#ffffff',
    opacity: 0.9,
    marginBottom: 8,
  },
  resultScore: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  resultSubtext: {
    fontSize: 14,
    color: '#ffffff',
    opacity: 0.9,
  },
  topicsSection: {
    marginBottom: 24,
  },
  topicCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  topicHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  topicName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  topicScore: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FF9800',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FF9800',
  },
  topicDetails: {
    fontSize: 12,
    color: '#666',
  },
  recommendationsSection: {
    marginBottom: 24,
  },
  recommendationCard: {
    backgroundColor: '#E3F2FD',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  recommendationText: {
    fontSize: 14,
    color: '#1565C0',
  },
  completeButton: {
    backgroundColor: '#FF9800',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  completeButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
  },
});

export default DiagnosticAssessmentScreen;
