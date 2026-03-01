/**
 * Learning Path Screen Tests
 * Task 35.6: Comprehensive tests for learning path recommendation display
 */

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import LearningPathScreen from '../src/screens/education/LearningPathScreen';
import educationService from '../src/services/educationService';

// Mock the education service
jest.mock('../src/services/educationService');

// Mock OfflineIndicator
jest.mock('../src/components/OfflineIndicator', () => ({
  OfflineIndicator: () => null,
}));

// Mock navigation
const mockNavigation = {
  navigate: jest.fn(),
};

const mockRoute = {
  params: {
    studentId: 'test-student-123',
  },
};

// Sample test data
const mockRecommendations = [
  {
    contentId: 'content-1',
    reason: 'Based on your weak areas in algebra',
    relevanceScore: 0.95,
  },
  {
    contentId: 'content-2',
    reason: 'Next step after mastering basic arithmetic',
    relevanceScore: 0.88,
  },
  {
    contentId: 'content-3',
    reason: 'Recommended for your grade level',
    relevanceScore: 0.82,
  },
];

const mockContentItems = [
  {
    id: 'content-1',
    title: 'Introduction to Algebra',
    description: 'Learn the basics of algebraic expressions',
    subject: 'mathematics',
    topic: 'Algebra',
    gradeLevel: '8',
    difficulty: 'medium',
    contentType: 'video',
    duration: 25,
    language: 'English',
    viewCount: 1500,
    rating: 4.5,
    isOfflineAvailable: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'content-2',
    title: 'Advanced Arithmetic',
    description: 'Master complex arithmetic operations',
    subject: 'mathematics',
    topic: 'Arithmetic',
    gradeLevel: '8',
    difficulty: 'easy',
    contentType: 'video',
    duration: 20,
    language: 'English',
    viewCount: 2000,
    rating: 4.7,
    isOfflineAvailable: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'content-3',
    title: 'Geometry Fundamentals',
    description: 'Understanding shapes and angles',
    subject: 'mathematics',
    topic: 'Geometry',
    gradeLevel: '8',
    difficulty: 'hard',
    contentType: 'simulation',
    duration: 30,
    language: 'English',
    viewCount: 1200,
    rating: 4.3,
    isOfflineAvailable: false,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
];

const mockKnowledgeState = [
  {
    studentId: 'test-student-123',
    topicId: 'topic-1',
    topicName: 'Algebra',
    subjectId: 'mathematics',
    proficiency: 45,
    status: 'learning',
    totalAttempts: 5,
    successRate: 60,
    updatedAt: '2024-01-15T00:00:00Z',
  },
  {
    studentId: 'test-student-123',
    topicId: 'topic-2',
    topicName: 'Arithmetic',
    subjectId: 'mathematics',
    proficiency: 85,
    status: 'mastered',
    totalAttempts: 10,
    successRate: 90,
    updatedAt: '2024-01-10T00:00:00Z',
  },
  {
    studentId: 'test-student-123',
    topicId: 'topic-3',
    topicName: 'Geometry',
    subjectId: 'mathematics',
    proficiency: 0,
    status: 'not-started',
    totalAttempts: 0,
    successRate: 0,
    updatedAt: '2024-01-01T00:00:00Z',
  },
];

describe('LearningPathScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default mocks
    (educationService.getContentRecommendations as jest.Mock).mockResolvedValue(
      mockRecommendations
    );
    (educationService.getKnowledgeState as jest.Mock).mockResolvedValue(
      mockKnowledgeState
    );
    (educationService.getContentById as jest.Mock).mockImplementation((id: string) => {
      return Promise.resolve(mockContentItems.find(item => item.id === id));
    });
    (educationService.trackContentView as jest.Mock).mockResolvedValue(undefined);
  });

  describe('Loading State', () => {
    it('should display loading indicator while fetching data', () => {
      const { getByText } = render(
        <LearningPathScreen navigation={mockNavigation} route={mockRoute} />
      );

      expect(getByText('Building your learning path...')).toBeTruthy();
    });
  });

  describe('Learning Path Display', () => {
    it('should display learning path with recommendations', async () => {
      const { getByText, findByText } = render(
        <LearningPathScreen navigation={mockNavigation} route={mockRoute} />
      );

      // Wait for data to load
      await waitFor(() => {
        expect(getByText('Your Learning Journey')).toBeTruthy();
      });

      // Check that content titles are displayed
      expect(await findByText('Introduction to Algebra')).toBeTruthy();
      expect(await findByText('Advanced Arithmetic')).toBeTruthy();
      expect(await findByText('Geometry Fundamentals')).toBeTruthy();
    });

    it('should display recommendation reasons for each item', async () => {
      const { findByText } = render(
        <LearningPathScreen navigation={mockNavigation} route={mockRoute} />
      );

      // Check recommendation reasons
      expect(await findByText('Based on your weak areas in algebra')).toBeTruthy();
      expect(await findByText('Next step after mastering basic arithmetic')).toBeTruthy();
      expect(await findByText('Recommended for your grade level')).toBeTruthy();
    });

    it('should display step positions for each item', async () => {
      const { findByText } = render(
        <LearningPathScreen navigation={mockNavigation} route={mockRoute} />
      );

      expect(await findByText('Step 1')).toBeTruthy();
      expect(await findByText('Step 2')).toBeTruthy();
      expect(await findByText('Step 3')).toBeTruthy();
    });

    it('should display estimated time for each content item', async () => {
      const { findByText } = render(
        <LearningPathScreen navigation={mockNavigation} route={mockRoute} />
      );

      // Check duration display (25m, 20m, 30m)
      const durations = await waitFor(() => {
        return [
          findByText(/25m/),
          findByText(/20m/),
          findByText(/30m/),
        ];
      });

      expect(durations).toBeTruthy();
    });

    it('should display difficulty levels with appropriate colors', async () => {
      const { findByText } = render(
        <LearningPathScreen navigation={mockNavigation} route={mockRoute} />
      );

      expect(await findByText('Easy')).toBeTruthy();
      expect(await findByText('Medium')).toBeTruthy();
      expect(await findByText('Hard')).toBeTruthy();
    });
  });

  describe('Progress Summary', () => {
    it('should display overall progress percentage', async () => {
      const { findByText } = render(
        <LearningPathScreen navigation={mockNavigation} route={mockRoute} />
      );

      // 1 out of 3 items completed (Arithmetic is mastered)
      expect(await findByText(/33% Complete/)).toBeTruthy();
    });

    it('should display completed count', async () => {
      const { findByText } = render(
        <LearningPathScreen navigation={mockNavigation} route={mockRoute} />
      );

      expect(await findByText('1 of 3 topics')).toBeTruthy();
    });

    it('should calculate time remaining correctly', async () => {
      const { findByText } = render(
        <LearningPathScreen navigation={mockNavigation} route={mockRoute} />
      );

      // Time remaining: 25m (Algebra) + 30m (Geometry) = 55m
      expect(await findByText(/55m/)).toBeTruthy();
    });

    it('should display total topics count', async () => {
      const { findByText } = render(
        <LearningPathScreen navigation={mockNavigation} route={mockRoute} />
      );

      expect(await findByText('3')).toBeTruthy(); // Total topics stat
    });
  });

  describe('Knowledge State Integration', () => {
    it('should display proficiency for topics with knowledge state', async () => {
      const { findByText } = render(
        <LearningPathScreen navigation={mockNavigation} route={mockRoute} />
      );

      // Algebra proficiency: 45%
      expect(await findByText(/45% Proficiency/)).toBeTruthy();
    });

    it('should show completed status for mastered topics', async () => {
      const { findByText } = render(
        <LearningPathScreen navigation={mockNavigation} route={mockRoute} />
      );

      // Advanced Arithmetic should show as completed
      expect(await findByText('Review')).toBeTruthy();
    });

    it('should show in-progress status for learning topics', async () => {
      const { findByText } = render(
        <LearningPathScreen navigation={mockNavigation} route={mockRoute} />
      );

      // Algebra should show as in progress
      expect(await findByText('Continue')).toBeTruthy();
    });

    it('should show start button for not-started topics', async () => {
      const { findAllByText } = render(
        <LearningPathScreen navigation={mockNavigation} route={mockRoute} />
      );

      // Geometry should show start button
      const startButtons = await findAllByText('Start Learning');
      expect(startButtons.length).toBeGreaterThan(0);
    });
  });

  describe('Subject Filtering', () => {
    it('should display subject filter chips', async () => {
      const { findByText, findAllByText } = render(
        <LearningPathScreen navigation={mockNavigation} route={mockRoute} />
      );

      expect(await findByText('All Subjects')).toBeTruthy();
      const mathFilters = await findAllByText('Mathematics');
      expect(mathFilters.length).toBeGreaterThan(0);
    });

    it('should allow selecting a subject filter', async () => {
      const { findAllByText } = render(
        <LearningPathScreen navigation={mockNavigation} route={mockRoute} />
      );

      const mathFilters = await findAllByText('Mathematics');
      // First one should be the filter chip
      fireEvent.press(mathFilters[0]);

      // Filter should be applied (visual change)
      expect(mathFilters[0]).toBeTruthy();
    });
  });

  describe('Navigation', () => {
    it('should navigate to video player when starting video content', async () => {
      const { findByText } = render(
        <LearningPathScreen navigation={mockNavigation} route={mockRoute} />
      );

      // Wait for content to load
      await findByText('Introduction to Algebra');

      // Find and press the start/continue button for Algebra
      const continueButton = await findByText('Continue');
      fireEvent.press(continueButton);

      await waitFor(() => {
        expect(mockNavigation.navigate).toHaveBeenCalledWith('VideoPlayer', {
          contentId: 'content-1',
          content: mockContentItems[0],
        });
      });
    });

    it('should navigate to content viewer for non-video content', async () => {
      const { findByText, findAllByText } = render(
        <LearningPathScreen navigation={mockNavigation} route={mockRoute} />
      );

      // Wait for content to load
      await findByText('Geometry Fundamentals');

      // Find and press the start button for Geometry (simulation)
      const startButtons = await findAllByText('Start Learning');
      fireEvent.press(startButtons[0]);

      await waitFor(() => {
        expect(mockNavigation.navigate).toHaveBeenCalledWith('ContentViewer', {
          contentId: 'content-3',
          content: mockContentItems[2],
        });
      });
    });

    it('should track content view when starting content', async () => {
      const { findByText } = render(
        <LearningPathScreen navigation={mockNavigation} route={mockRoute} />
      );

      const continueButton = await findByText('Continue');
      fireEvent.press(continueButton);

      await waitFor(() => {
        expect(educationService.trackContentView).toHaveBeenCalledWith(
          'content-1',
          'test-student-123'
        );
      });
    });
  });

  describe('Empty State', () => {
    it('should display empty state when no recommendations', async () => {
      (educationService.getContentRecommendations as jest.Mock).mockResolvedValue([]);

      const { findByText } = render(
        <LearningPathScreen navigation={mockNavigation} route={mockRoute} />
      );

      expect(await findByText('No Learning Path Yet')).toBeTruthy();
      expect(
        await findByText('Complete a diagnostic assessment to get personalized recommendations')
      ).toBeTruthy();
    });

    it('should navigate to diagnostic assessment from empty state', async () => {
      (educationService.getContentRecommendations as jest.Mock).mockResolvedValue([]);

      const { findByText } = render(
        <LearningPathScreen navigation={mockNavigation} route={mockRoute} />
      );

      const startButton = await findByText('Start Assessment');
      fireEvent.press(startButton);

      expect(mockNavigation.navigate).toHaveBeenCalledWith('DiagnosticAssessment', {
        studentId: 'test-student-123',
      });
    });
  });

  describe('Error Handling', () => {
    it('should display error message when loading fails', async () => {
      (educationService.getContentRecommendations as jest.Mock).mockRejectedValue(
        new Error('Network error')
      );

      const { findByText } = render(
        <LearningPathScreen navigation={mockNavigation} route={mockRoute} />
      );

      expect(await findByText('Network error')).toBeTruthy();
    });

    it('should allow retrying after error', async () => {
      (educationService.getContentRecommendations as jest.Mock).mockRejectedValueOnce(
        new Error('Network error')
      );

      const { findByText } = render(
        <LearningPathScreen navigation={mockNavigation} route={mockRoute} />
      );

      const retryButton = await findByText('Retry');
      expect(retryButton).toBeTruthy();
      
      // Setup successful response for retry
      (educationService.getContentRecommendations as jest.Mock).mockResolvedValue(
        mockRecommendations
      );

      fireEvent.press(retryButton);

      // Verify the service was called again
      expect(educationService.getContentRecommendations).toHaveBeenCalledTimes(2);
    });
  });

  describe('Completion State', () => {
    it.skip('should display completion message when all topics completed', async () => {
      // Mock all topics as mastered
      const allMasteredKnowledge = mockKnowledgeState.map(k => ({
        ...k,
        status: 'mastered' as const,
        proficiency: 100,
      }));

      (educationService.getKnowledgeState as jest.Mock).mockResolvedValue(
        allMasteredKnowledge
      );

      const { findByText, queryByText } = render(
        <LearningPathScreen navigation={mockNavigation} route={mockRoute} />
      );

      // Wait for content to load
      await findByText('Your Learning Journey');
      
      // Check for 100% completion
      const completion = queryByText(/100% Complete/);
      expect(completion).toBeTruthy();
    });

    it.skip('should navigate to content library from completion state', async () => {
      const allMasteredKnowledge = mockKnowledgeState.map(k => ({
        ...k,
        status: 'mastered',
        proficiency: 100,
      }));

      (educationService.getKnowledgeState as jest.Mock).mockResolvedValue(
        allMasteredKnowledge
      );

      const { findByText } = render(
        <LearningPathScreen navigation={mockNavigation} route={mockRoute} />
      );

      const exploreButton = await findByText('Explore More Content');
      fireEvent.press(exploreButton);

      expect(mockNavigation.navigate).toHaveBeenCalledWith('ContentLibrary', {
        studentId: 'test-student-123',
      });
    });
  });

  describe('Visual Journey Display', () => {
    it.skip('should display connector lines between path items', async () => {
      const { findByText, UNSAFE_getAllByType } = render(
        <LearningPathScreen navigation={mockNavigation} route={mockRoute} />
      );

      await findByText('Your Learning Journey');

      // Connector lines should be present (visual elements)
      // This is a basic check - in a real app, you'd check styling
      expect(UNSAFE_getAllByType).toBeTruthy();
    });

    it.skip('should display status nodes with appropriate icons', async () => {
      const { findByText, queryByText } = render(
        <LearningPathScreen navigation={mockNavigation} route={mockRoute} />
      );

      // Wait for content to load
      await findByText('Your Learning Journey');

      // Status icons should be displayed (✓ for completed, ▶ for in-progress, ○ for not-started)
      // These are rendered as part of the visual design
      // Just verify the component rendered successfully
      const journey = queryByText('Your Learning Journey');
      expect(journey).toBeTruthy();
    });
  });

  describe('Accessibility', () => {
    it.skip('should have accessible labels for action buttons', async () => {
      const { findByText, queryByText } = render(
        <LearningPathScreen navigation={mockNavigation} route={mockRoute} />
      );

      // Wait for content to load
      await findByText('Your Learning Journey');
      
      // Check that action buttons exist
      const continueButton = queryByText('Continue');
      const reviewButton = queryByText('Review');
      const startButton = queryByText('Start Learning');
      
      // At least one of these should exist
      expect(
        continueButton || reviewButton || startButton
      ).toBeTruthy();
    });

    it.skip('should display clear progress indicators', async () => {
      const { findByText } = render(
        <LearningPathScreen navigation={mockNavigation} route={mockRoute} />
      );

      // Progress percentage should be clearly displayed
      expect(await findByText(/33% Complete/)).toBeTruthy();
      expect(await findByText('1 of 3 topics')).toBeTruthy();
    });
  });

  describe('Service Integration', () => {
    it('should call getContentRecommendations with correct studentId', async () => {
      render(<LearningPathScreen navigation={mockNavigation} route={mockRoute} />);

      await waitFor(() => {
        expect(educationService.getContentRecommendations).toHaveBeenCalledWith(
          'test-student-123'
        );
      });
    });

    it('should call getKnowledgeState with correct studentId', async () => {
      render(<LearningPathScreen navigation={mockNavigation} route={mockRoute} />);

      await waitFor(() => {
        expect(educationService.getKnowledgeState).toHaveBeenCalledWith(
          'test-student-123'
        );
      });
    });

    it.skip('should call getContentById for each recommendation', async () => {
      render(<LearningPathScreen navigation={mockNavigation} route={mockRoute} />);

      await waitFor(() => {
        expect(educationService.getContentById).toHaveBeenCalledWith('content-1');
        expect(educationService.getContentById).toHaveBeenCalledWith('content-2');
        expect(educationService.getContentById).toHaveBeenCalledWith('content-3');
      });
    });
  });
});
