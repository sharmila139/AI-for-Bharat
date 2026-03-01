/**
 * Quiz Screen
 * Interactive quiz interface with multiple question types
 * Supports MCQ (single/multiple), True/False, Fill-in-the-blank, Matching
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { EducationStackNavigationProp, EducationStackParamList } from '../../navigation/types';
import educationService from '../../services/educationService';
import { LoadingState } from '../../components/LoadingState';
import { ErrorState } from '../../components/ErrorState';

type QuizRouteProp = RouteProp<EducationStackParamList, 'Quiz'>;

// Extended question types for quiz
export type QuizQuestionType = 
  | 'mcq_single'      // Multiple choice - single answer
  | 'mcq_multiple'    // Multiple choice - multiple answers
  | 'true_false'      // True/False
  | 'fill_blank'      // Fill in the blank
  | 'matching';       // Match pairs

export interface QuizQuestion {
  id: string;
  topicId: string;
  topicName: string;
  question: string;
  questionType: QuizQuestionType;
  options?: string[];           // For MCQ and True/False
  correctAnswer: string | string[] | { [key: string]: string }; // Flexible for different types
  explanation?: string;         // Explanation shown after answer
  points: number;
  matchPairs?: { left: string; right: string }[]; // For matching questions
}

export interface QuizResponse {
  questionId: string;
  answer: string | string[] | { [key: string]: string };
  isCorrect: boolean;
  timeSpent: number;
}

const QuizScreen: React.FC = () => {
  const navigation = useNavigation<EducationStackNavigationProp>();
  const route = useRoute<QuizRouteProp>();
  const { quizId, studentId, topicId } = route.params;

  // State
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [responses, setResponses] = useState<QuizResponse[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<string | string[] | { [key: string]: string } | null>(null);
  const [fillBlankAnswer, setFillBlankAnswer] = useState('');
  const [matchingAnswers, setMatchingAnswers] = useState<{ [key: string]: string }>({});
  const [startTime, setStartTime] = useState<number>(Date.now());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [quizComplete, setQuizComplete] = useState(false);
  const [totalScore, setTotalScore] = useState(0);
  const [maxScore, setMaxScore] = useState(0);

  const currentQuestion = questions[currentQuestionIndex];
  const progress = questions.length > 0 ? (currentQuestionIndex + 1) / questions.length : 0;

  /**
   * Load quiz questions
   */
  useEffect(() => {
    loadQuizQuestions();
  }, []);

  const loadQuizQuestions = async () => {
    setLoading(true);
    setError(null);

    try {
      // In a real app, this would fetch from the API
      // For now, using mock data
      const mockQuestions = getMockQuizQuestions(topicId);
      setQuestions(mockQuestions);
      setMaxScore(mockQuestions.reduce((sum, q) => sum + q.points, 0));
    } catch (err: any) {
      console.error('Error loading quiz questions:', err);
      setError(err.message || 'Failed to load quiz questions');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Check if answer is correct
   */
  const checkAnswer = (userAnswer: string | string[] | { [key: string]: string }): boolean => {
    if (!currentQuestion) return false;

    const correctAnswer = currentQuestion.correctAnswer;

    // MCQ Single
    if (currentQuestion.questionType === 'mcq_single' || currentQuestion.questionType === 'true_false') {
      return userAnswer === correctAnswer;
    }

    // MCQ Multiple
    if (currentQuestion.questionType === 'mcq_multiple') {
      const userAnswers = Array.isArray(userAnswer) ? userAnswer.sort() : [];
      const correctAnswers = Array.isArray(correctAnswer) ? correctAnswer.sort() : [];
      return JSON.stringify(userAnswers) === JSON.stringify(correctAnswers);
    }

    // Fill in the blank
    if (currentQuestion.questionType === 'fill_blank') {
      const userText = typeof userAnswer === 'string' ? userAnswer.trim().toLowerCase() : '';
      const correctText = typeof correctAnswer === 'string' ? correctAnswer.trim().toLowerCase() : '';
      return userText === correctText;
    }

    // Matching
    if (currentQuestion.questionType === 'matching') {
      return JSON.stringify(userAnswer) === JSON.stringify(correctAnswer);
    }

    return false;
  };

  /**
   * Handle answer submission
   */
  const handleSubmitAnswer = () => {
    let answer: string | string[] | { [key: string]: string } | null = null;

    // Get answer based on question type
    if (currentQuestion.questionType === 'fill_blank') {
      answer = fillBlankAnswer;
    } else if (currentQuestion.questionType === 'matching') {
      answer = matchingAnswers;
    } else {
      answer = selectedAnswer;
    }

    if (!answer || (Array.isArray(answer) && answer.length === 0) || 
        (typeof answer === 'object' && Object.keys(answer).length === 0)) {
      Alert.alert('Please provide an answer', 'You must answer the question to continue');
      return;
    }

    // Check if correct
    const correct = checkAnswer(answer);
    setIsCorrect(correct);
    setShowFeedback(true);

    // Record response
    const timeSpent = Math.floor((Date.now() - startTime) / 1000);
    const response: QuizResponse = {
      questionId: currentQuestion.id,
      answer,
      isCorrect: correct,
      timeSpent,
    };

    setResponses([...responses, response]);

    // Update score
    if (correct) {
      setTotalScore(totalScore + currentQuestion.points);
    }
  };

  /**
   * Handle next question
   */
  const handleNext = () => {
    setShowFeedback(false);
    
    if (currentQuestionIndex < questions.length - 1) {
      // Move to next question
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      resetAnswerState();
      setStartTime(Date.now());
    } else {
      // Quiz complete
      completeQuiz();
    }
  };

  /**
   * Reset answer state for new question
   */
  const resetAnswerState = () => {
    setSelectedAnswer(null);
    setFillBlankAnswer('');
    setMatchingAnswers({});
  };

  /**
   * Complete quiz and show results
   */
  const completeQuiz = () => {
    setQuizComplete(true);
    // In a real app, submit to backend
    // educationService.submitQuizResult(...)
  };

  /**
   * Handle MCQ single answer selection
   */
  const handleMCQSingleSelect = (option: string) => {
    if (!showFeedback) {
      setSelectedAnswer(option);
    }
  };

  /**
   * Handle MCQ multiple answer selection
   */
  const handleMCQMultipleSelect = (option: string) => {
    if (showFeedback) return;

    const current = Array.isArray(selectedAnswer) ? selectedAnswer : [];
    if (current.includes(option)) {
      setSelectedAnswer(current.filter(a => a !== option));
    } else {
      setSelectedAnswer([...current, option]);
    }
  };

  /**
   * Handle matching pair selection
   */
  const handleMatchingSelect = (leftItem: string, rightItem: string) => {
    if (showFeedback) return;

    setMatchingAnswers({
      ...matchingAnswers,
      [leftItem]: rightItem,
    });
  };

  /**
   * Render question based on type
   */
  const renderQuestion = () => {
    if (!currentQuestion) return null;

    switch (currentQuestion.questionType) {
      case 'mcq_single':
      case 'true_false':
        return renderMCQSingle();
      case 'mcq_multiple':
        return renderMCQMultiple();
      case 'fill_blank':
        return renderFillBlank();
      case 'matching':
        return renderMatching();
      default:
        return null;
    }
  };

  /**
   * Render MCQ Single Answer
   */
  const renderMCQSingle = () => {
    if (!currentQuestion.options) return null;

    return (
      <View style={styles.optionsContainer}>
        {currentQuestion.options.map((option, index) => {
          const isSelected = selectedAnswer === option;
          const showCorrect = showFeedback && option === currentQuestion.correctAnswer;
          const showIncorrect = showFeedback && isSelected && !isCorrect;

          return (
            <TouchableOpacity
              key={index}
              style={[
                styles.optionCard,
                isSelected && styles.optionCardSelected,
                showCorrect && styles.optionCardCorrect,
                showIncorrect && styles.optionCardIncorrect,
              ]}
              onPress={() => handleMCQSingleSelect(option)}
              disabled={showFeedback}
            >
              <View
                style={[
                  styles.optionRadio,
                  isSelected && styles.optionRadioSelected,
                  showCorrect && styles.optionRadioCorrect,
                  showIncorrect && styles.optionRadioIncorrect,
                ]}
              />
              <Text
                style={[
                  styles.optionText,
                  isSelected && styles.optionTextSelected,
                ]}
              >
                {option}
              </Text>
              {showCorrect && <Text style={styles.checkmark}>✓</Text>}
              {showIncorrect && <Text style={styles.crossmark}>✗</Text>}
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  /**
   * Render MCQ Multiple Answers
   */
  const renderMCQMultiple = () => {
    if (!currentQuestion.options) return null;

    const selectedOptions = Array.isArray(selectedAnswer) ? selectedAnswer : [];

    return (
      <View style={styles.optionsContainer}>
        <Text style={styles.instructionText}>Select all that apply</Text>
        {currentQuestion.options.map((option, index) => {
          const isSelected = selectedOptions.includes(option);
          const correctAnswers = Array.isArray(currentQuestion.correctAnswer) 
            ? currentQuestion.correctAnswer 
            : [];
          const showCorrect = showFeedback && correctAnswers.includes(option);
          const showIncorrect = showFeedback && isSelected && !correctAnswers.includes(option);

          return (
            <TouchableOpacity
              key={index}
              style={[
                styles.optionCard,
                isSelected && styles.optionCardSelected,
                showCorrect && styles.optionCardCorrect,
                showIncorrect && styles.optionCardIncorrect,
              ]}
              onPress={() => handleMCQMultipleSelect(option)}
              disabled={showFeedback}
            >
              <View
                style={[
                  styles.optionCheckbox,
                  isSelected && styles.optionCheckboxSelected,
                  showCorrect && styles.optionCheckboxCorrect,
                  showIncorrect && styles.optionCheckboxIncorrect,
                ]}
              >
                {isSelected && <Text style={styles.checkboxCheck}>✓</Text>}
              </View>
              <Text
                style={[
                  styles.optionText,
                  isSelected && styles.optionTextSelected,
                ]}
              >
                {option}
              </Text>
              {showCorrect && <Text style={styles.checkmark}>✓</Text>}
              {showIncorrect && <Text style={styles.crossmark}>✗</Text>}
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  /**
   * Render Fill in the Blank
   */
  const renderFillBlank = () => {
    return (
      <View style={styles.fillBlankContainer}>
        <Text style={styles.instructionText}>Type your answer below</Text>
        <TextInput
          style={[
            styles.fillBlankInput,
            showFeedback && (isCorrect ? styles.inputCorrect : styles.inputIncorrect),
          ]}
          value={fillBlankAnswer}
          onChangeText={setFillBlankAnswer}
          placeholder="Enter your answer..."
          editable={!showFeedback}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {showFeedback && (
          <View style={styles.correctAnswerBox}>
            <Text style={styles.correctAnswerLabel}>Correct Answer:</Text>
            <Text style={styles.correctAnswerText}>
              {currentQuestion.correctAnswer as string}
            </Text>
          </View>
        )}
      </View>
    );
  };

  /**
   * Render Matching Question
   */
  const renderMatching = () => {
    if (!currentQuestion.matchPairs) return null;

    const leftItems = currentQuestion.matchPairs.map(pair => pair.left);
    const rightItems = [...currentQuestion.matchPairs.map(pair => pair.right)].sort(() => Math.random() - 0.5);

    return (
      <View style={styles.matchingContainer}>
        <Text style={styles.instructionText}>Match the items on the left with the right</Text>
        {leftItems.map((leftItem, index) => {
          const selectedRight = matchingAnswers[leftItem];
          const correctAnswer = currentQuestion.matchPairs?.find(p => p.left === leftItem)?.right;
          const showCorrect = showFeedback && selectedRight === correctAnswer;
          const showIncorrect = showFeedback && selectedRight && selectedRight !== correctAnswer;

          return (
            <View key={index} style={styles.matchingRow}>
              <View style={styles.matchingLeft}>
                <Text style={styles.matchingLeftText}>{leftItem}</Text>
              </View>
              <View style={styles.matchingArrow}>
                <Text style={styles.arrowText}>→</Text>
              </View>
              <View style={styles.matchingRight}>
                {!selectedRight && !showFeedback ? (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View style={styles.matchingOptions}>
                      {rightItems.map((rightItem, idx) => (
                        <TouchableOpacity
                          key={idx}
                          style={styles.matchingOption}
                          onPress={() => handleMatchingSelect(leftItem, rightItem)}
                        >
                          <Text style={styles.matchingOptionText}>{rightItem}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </ScrollView>
                ) : (
                  <View
                    style={[
                      styles.matchingSelected,
                      showCorrect && styles.matchingCorrect,
                      showIncorrect && styles.matchingIncorrect,
                    ]}
                  >
                    <Text style={styles.matchingSelectedText}>{selectedRight}</Text>
                    {showCorrect && <Text style={styles.checkmark}>✓</Text>}
                    {showIncorrect && <Text style={styles.crossmark}>✗</Text>}
                  </View>
                )}
              </View>
            </View>
          );
        })}
        {showFeedback && !isCorrect && (
          <View style={styles.correctAnswerBox}>
            <Text style={styles.correctAnswerLabel}>Correct Matches:</Text>
            {currentQuestion.matchPairs.map((pair, idx) => (
              <Text key={idx} style={styles.correctMatchText}>
                {pair.left} → {pair.right}
              </Text>
            ))}
          </View>
        )}
      </View>
    );
  };

  if (loading) {
    return <LoadingState message="Loading quiz..." />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={loadQuizQuestions} />;
  }

  // Quiz complete screen
  if (quizComplete) {
    const percentage = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;
    const correctCount = responses.filter(r => r.isCorrect).length;

    // Topic breakdown
    const topicScores: { [key: string]: { correct: number; total: number } } = {};
    responses.forEach((response, index) => {
      const question = questions[index];
      if (!topicScores[question.topicName]) {
        topicScores[question.topicName] = { correct: 0, total: 0 };
      }
      topicScores[question.topicName].total++;
      if (response.isCorrect) {
        topicScores[question.topicName].correct++;
      }
    });

    return (
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Quiz Complete! 🎉</Text>
          <Text style={styles.subtitle}>Here are your results</Text>
        </View>

        <View style={styles.content}>
          <View style={[
            styles.resultCard,
            percentage >= 90 ? styles.resultExcellent :
            percentage >= 70 ? styles.resultGood :
            percentage >= 50 ? styles.resultFair :
            styles.resultNeedsWork
          ]}>
            <Text style={styles.resultTitle}>Your Score</Text>
            <Text style={styles.resultScore}>{percentage}%</Text>
            <Text style={styles.resultSubtext}>
              {correctCount} out of {questions.length} correct
            </Text>
            <Text style={styles.resultPoints}>
              {totalScore} / {maxScore} points
            </Text>
          </View>

          {Object.keys(topicScores).length > 0 && (
            <View style={styles.topicsSection}>
              <Text style={styles.sectionTitle}>Topic Breakdown</Text>
              {Object.entries(topicScores).map(([topic, scores], index) => {
                const topicPercentage = (scores.correct / scores.total) * 100;
                return (
                  <View key={index} style={styles.topicCard}>
                    <View style={styles.topicHeader}>
                      <Text style={styles.topicName}>{topic}</Text>
                      <Text style={styles.topicScore}>
                        {Math.round(topicPercentage)}%
                      </Text>
                    </View>
                    <View style={styles.progressBar}>
                      <View
                        style={[
                          styles.progressFill,
                          { width: `${topicPercentage}%` },
                        ]}
                      />
                    </View>
                    <Text style={styles.topicDetails}>
                      {scores.correct}/{scores.total} correct
                    </Text>
                  </View>
                );
              })}
            </View>
          )}

          <View style={styles.feedbackSection}>
            <Text style={styles.sectionTitle}>Feedback</Text>
            <View style={styles.feedbackCard}>
              {percentage >= 90 && (
                <Text style={styles.feedbackText}>
                  🌟 Excellent work! You've mastered this topic. Ready for more challenging content?
                </Text>
              )}
              {percentage >= 70 && percentage < 90 && (
                <Text style={styles.feedbackText}>
                  👍 Good job! You have a solid understanding. Review the questions you missed to improve further.
                </Text>
              )}
              {percentage >= 50 && percentage < 70 && (
                <Text style={styles.feedbackText}>
                  📚 You're making progress! Consider reviewing the learning materials and trying again.
                </Text>
              )}
              {percentage < 50 && (
                <Text style={styles.feedbackText}>
                  💪 Keep practicing! Review the prerequisite topics and learning materials before retrying.
                </Text>
              )}
            </View>
          </View>

          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.secondaryButtonText}>Back to Content</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => {
                // Reset and retake
                setQuizComplete(false);
                setCurrentQuestionIndex(0);
                setResponses([]);
                setTotalScore(0);
                resetAnswerState();
                setStartTime(Date.now());
              }}
            >
              <Text style={styles.primaryButtonText}>Retake Quiz</Text>
            </TouchableOpacity>
          </View>
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
      {/* Progress Header */}
      <View style={styles.progressHeader}>
        <View style={styles.progressInfo}>
          <Text style={styles.progressText}>
            Question {currentQuestionIndex + 1} of {questions.length}
          </Text>
          <Text style={styles.scoreText}>
            Score: {totalScore}/{maxScore}
          </Text>
        </View>
        <View style={styles.progressBarContainer}>
          <View style={[styles.progressBarFill, { width: `${progress * 100}%` }]} />
        </View>
      </View>

      {/* Question Content */}
      <ScrollView style={styles.questionContainer}>
        <View style={styles.questionCard}>
          <View style={styles.questionHeader}>
            <Text style={styles.topicBadge}>{currentQuestion.topicName}</Text>
            <Text style={styles.pointsBadge}>{currentQuestion.points} pts</Text>
          </View>
          <Text style={styles.questionText}>{currentQuestion.question}</Text>

          {renderQuestion()}

          {/* Feedback */}
          {showFeedback && (
            <View style={[
              styles.feedbackBox,
              isCorrect ? styles.feedbackCorrect : styles.feedbackIncorrect,
            ]}>
              <Text style={styles.feedbackTitle}>
                {isCorrect ? '✓ Correct!' : '✗ Incorrect'}
              </Text>
              {currentQuestion.explanation && (
                <Text style={styles.feedbackExplanation}>
                  {currentQuestion.explanation}
                </Text>
              )}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Footer Actions */}
      <View style={styles.footer}>
        {!showFeedback ? (
          <TouchableOpacity
            style={styles.submitButton}
            onPress={handleSubmitAnswer}
          >
            <Text style={styles.submitButtonText}>Submit Answer</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.nextButton}
            onPress={handleNext}
          >
            <Text style={styles.nextButtonText}>
              {currentQuestionIndex < questions.length - 1 ? 'Next Question' : 'View Results'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

/**
 * Mock quiz questions for testing
 */
function getMockQuizQuestions(topicId: string): QuizQuestion[] {
  return [
    {
      id: '1',
      topicId,
      topicName: 'Basic Algebra',
      question: 'What is the value of x in the equation: 2x + 5 = 13?',
      questionType: 'mcq_single',
      options: ['2', '3', '4', '5'],
      correctAnswer: '4',
      explanation: 'Subtract 5 from both sides: 2x = 8, then divide by 2: x = 4',
      points: 2,
    },
    {
      id: '2',
      topicId,
      topicName: 'Basic Algebra',
      question: 'Which of the following are prime numbers? (Select all that apply)',
      questionType: 'mcq_multiple',
      options: ['2', '4', '7', '9', '11'],
      correctAnswer: ['2', '7', '11'],
      explanation: 'Prime numbers are only divisible by 1 and themselves. 2, 7, and 11 are prime.',
      points: 3,
    },
    {
      id: '3',
      topicId,
      topicName: 'Basic Algebra',
      question: 'The sum of angles in a triangle is always 180 degrees.',
      questionType: 'true_false',
      options: ['True', 'False'],
      correctAnswer: 'True',
      explanation: 'This is a fundamental property of triangles in Euclidean geometry.',
      points: 1,
    },
    {
      id: '4',
      topicId,
      topicName: 'Basic Algebra',
      question: 'What is the square root of 144?',
      questionType: 'fill_blank',
      correctAnswer: '12',
      explanation: '12 × 12 = 144, so √144 = 12',
      points: 2,
    },
    {
      id: '5',
      topicId,
      topicName: 'Basic Algebra',
      question: 'Match each mathematical operation with its symbol:',
      questionType: 'matching',
      matchPairs: [
        { left: 'Addition', right: '+' },
        { left: 'Subtraction', right: '-' },
        { left: 'Multiplication', right: '×' },
        { left: 'Division', right: '÷' },
      ],
      correctAnswer: {
        'Addition': '+',
        'Subtraction': '-',
        'Multiplication': '×',
        'Division': '÷',
      },
      explanation: 'These are the standard mathematical operation symbols.',
      points: 4,
    },
  ];
}

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
  progressHeader: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  scoreText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FF9800',
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
  questionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  topicBadge: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FF9800',
    backgroundColor: '#FFF3E0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  pointsBadge: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4CAF50',
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  questionText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 24,
    lineHeight: 26,
  },
  instructionText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
    marginBottom: 16,
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
  optionCardCorrect: {
    backgroundColor: '#E8F5E9',
    borderColor: '#4CAF50',
  },
  optionCardIncorrect: {
    backgroundColor: '#FFEBEE',
    borderColor: '#F44336',
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
  optionRadioCorrect: {
    borderColor: '#4CAF50',
    backgroundColor: '#4CAF50',
  },
  optionRadioIncorrect: {
    borderColor: '#F44336',
    backgroundColor: '#F44336',
  },
  optionCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#999',
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionCheckboxSelected: {
    borderColor: '#FF9800',
    backgroundColor: '#FF9800',
  },
  optionCheckboxCorrect: {
    borderColor: '#4CAF50',
    backgroundColor: '#4CAF50',
  },
  optionCheckboxIncorrect: {
    borderColor: '#F44336',
    backgroundColor: '#F44336',
  },
  checkboxCheck: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  optionText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  optionTextSelected: {
    fontWeight: '600',
  },
  checkmark: {
    fontSize: 20,
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  crossmark: {
    fontSize: 20,
    color: '#F44336',
    fontWeight: 'bold',
  },
  fillBlankContainer: {
    gap: 16,
  },
  fillBlankInput: {
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    borderWidth: 2,
    borderColor: '#E0E0E0',
  },
  inputCorrect: {
    borderColor: '#4CAF50',
    backgroundColor: '#E8F5E9',
  },
  inputIncorrect: {
    borderColor: '#F44336',
    backgroundColor: '#FFEBEE',
  },
  correctAnswerBox: {
    backgroundColor: '#E3F2FD',
    borderRadius: 8,
    padding: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  correctAnswerLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1976D2',
    marginBottom: 4,
  },
  correctAnswerText: {
    fontSize: 16,
    color: '#1565C0',
    fontWeight: '600',
  },
  correctMatchText: {
    fontSize: 14,
    color: '#1565C0',
    marginTop: 4,
  },
  matchingContainer: {
    gap: 12,
  },
  matchingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  matchingLeft: {
    flex: 1,
    backgroundColor: '#E3F2FD',
    borderRadius: 8,
    padding: 12,
  },
  matchingLeftText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1976D2',
  },
  matchingArrow: {
    paddingHorizontal: 8,
  },
  arrowText: {
    fontSize: 20,
    color: '#999',
  },
  matchingRight: {
    flex: 1,
  },
  matchingOptions: {
    flexDirection: 'row',
    gap: 8,
  },
  matchingOption: {
    backgroundColor: '#FFF3E0',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#FFB74D',
  },
  matchingOptionText: {
    fontSize: 14,
    color: '#F57C00',
    fontWeight: '600',
  },
  matchingSelected: {
    backgroundColor: '#FFF3E0',
    borderRadius: 8,
    padding: 12,
    borderWidth: 2,
    borderColor: '#FF9800',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  matchingCorrect: {
    backgroundColor: '#E8F5E9',
    borderColor: '#4CAF50',
  },
  matchingIncorrect: {
    backgroundColor: '#FFEBEE',
    borderColor: '#F44336',
  },
  matchingSelectedText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  feedbackBox: {
    marginTop: 24,
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
  },
  feedbackCorrect: {
    backgroundColor: '#E8F5E9',
    borderLeftColor: '#4CAF50',
  },
  feedbackIncorrect: {
    backgroundColor: '#FFEBEE',
    borderLeftColor: '#F44336',
  },
  feedbackTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  feedbackExplanation: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  footer: {
    padding: 16,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#ddd',
  },
  submitButton: {
    backgroundColor: '#FF9800',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  submitButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
  },
  nextButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  nextButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
  },
  resultCard: {
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
  },
  resultExcellent: {
    backgroundColor: '#4CAF50',
  },
  resultGood: {
    backgroundColor: '#2196F3',
  },
  resultFair: {
    backgroundColor: '#FF9800',
  },
  resultNeedsWork: {
    backgroundColor: '#F44336',
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
  resultPoints: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '600',
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
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
  feedbackSection: {
    marginBottom: 24,
  },
  feedbackCard: {
    backgroundColor: '#E3F2FD',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  feedbackText: {
    fontSize: 14,
    color: '#1565C0',
    lineHeight: 20,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: '#FF9800',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FF9800',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF9800',
  },
});

export default QuizScreen;
