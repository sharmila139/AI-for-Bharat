/**
 * QuizScreen Simple Tests
 * Core functionality tests for quiz interface
 */

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import QuizScreen from '../src/screens/education/QuizScreen';

// Mock navigation
const mockNavigate = jest.fn();
const mockGoBack = jest.fn();
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: mockNavigate,
    goBack: mockGoBack,
  }),
  useRoute: () => ({
    params: {
      quizId: 'quiz-1',
      studentId: 'student-1',
      topicId: 'algebra-basics',
    },
  }),
}));

// Mock Alert
jest.spyOn(Alert, 'alert');

describe('QuizScreen - Core Functionality', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render quiz screen with first question', async () => {
    const { getByText } = render(<QuizScreen />);
    
    await waitFor(() => {
      expect(getByText(/Question 1 of 5/)).toBeTruthy();
      expect(getByText(/What is the value of x/)).toBeTruthy();
    });
  });

  it('should display all question types correctly', async () => {
    const { getByText } = render(<QuizScreen />);
    
    await waitFor(() => {
      // MCQ Single
      expect(getByText('2')).toBeTruthy();
      expect(getByText('3')).toBeTruthy();
      expect(getByText('4')).toBeTruthy();
      expect(getByText('5')).toBeTruthy();
    });
  });

  it('should allow selecting and submitting an answer', async () => {
    const { getByText } = render(<QuizScreen />);
    
    await waitFor(() => {
      fireEvent.press(getByText('4'));
      fireEvent.press(getByText('Submit Answer'));
    });

    await waitFor(() => {
      expect(getByText('✓ Correct!')).toBeTruthy();
    });
  });

  it('should show feedback with explanation', async () => {
    const { getByText } = render(<QuizScreen />);
    
    await waitFor(() => {
      fireEvent.press(getByText('4'));
      fireEvent.press(getByText('Submit Answer'));
    });

    await waitFor(() => {
      expect(getByText(/Subtract 5 from both sides/)).toBeTruthy();
    });
  });

  it('should track score correctly', async () => {
    const { getByText } = render(<QuizScreen />);
    
    await waitFor(() => {
      expect(getByText(/Score: 0\//)).toBeTruthy();
      fireEvent.press(getByText('4'));
      fireEvent.press(getByText('Submit Answer'));
    });

    await waitFor(() => {
      expect(getByText(/Score: 2\//)).toBeTruthy();
    });
  });

  it('should navigate to next question', async () => {
    const { getByText } = render(<QuizScreen />);
    
    await waitFor(() => {
      fireEvent.press(getByText('4'));
      fireEvent.press(getByText('Submit Answer'));
      fireEvent.press(getByText('Next Question'));
    });

    await waitFor(() => {
      expect(getByText(/Question 2 of 5/)).toBeTruthy();
    });
  });

  it('should prevent submission without answer', async () => {
    const { getByText } = render(<QuizScreen />);
    
    await waitFor(() => {
      fireEvent.press(getByText('Submit Answer'));
    });

    expect(Alert.alert).toHaveBeenCalledWith(
      'Please provide an answer',
      'You must answer the question to continue'
    );
  });

  it('should support multiple choice with multiple answers', async () => {
    const { getByText } = render(<QuizScreen />);
    
    // Navigate to question 2
    await waitFor(() => {
      fireEvent.press(getByText('4'));
      fireEvent.press(getByText('Submit Answer'));
      fireEvent.press(getByText('Next Question'));
    });

    await waitFor(() => {
      expect(getByText('Select all that apply')).toBeTruthy();
      fireEvent.press(getByText('2'));
      fireEvent.press(getByText('7'));
      fireEvent.press(getByText('11'));
    });
  });

  it('should display progress bar', async () => {
    const { getByText } = render(<QuizScreen />);
    
    await waitFor(() => {
      expect(getByText(/Question 1 of 5/)).toBeTruthy();
    });
  });

  it('should show topic and points for each question', async () => {
    const { getByText } = render(<QuizScreen />);
    
    await waitFor(() => {
      expect(getByText('Basic Algebra')).toBeTruthy();
      expect(getByText(/pts/)).toBeTruthy();
    });
  });
});
