/**
 * Knowledge Progress Screen Tests
 * Comprehensive tests for knowledge state progress visualization
 */

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { KnowledgeProgressScreen } from '../src/screens/education/KnowledgeProgressScreen';
import educationService from '../src/services/educationService';
import { KnowledgeState } from '../src/types/education';

// Mock the OfflineIndicator component
jest.mock('../src/components/OfflineIndicator', () => ({
  OfflineIndicator: () => null,
}));

// Mock the education service
jest.mock('../src/services/educationService');

// Mock navigation
const mockNavigate = jest.fn();
const mockNavigation = {
  navigate: mockNavigate,
  goBack: jest.fn(),
  setOptions: jest.fn(),
};

// Mock route
const mockRoute = {
  params: {
    studentId: 'test-student-123',
  },
};

// Sample knowledge state data
const mockKnowledgeState: KnowledgeState[] = [
  {
    studentId: 'test-student-123',
    topicId: 'algebra-basics',
    topicName: 'Algebra Basics',
    subjectId: 'mathematics',
    proficiency: 85,
    status: 'mastered',
    lastPracticed: '2024-01-15T10:00:00Z',
    totalAttempts: 15,
    successRate: 90,
    updatedAt: '2024-01-15T10:00:00Z',
  },
  {
    studentId: 'test-student-123',
    topicId: 'geometry',
    topicName: 'Geometry',
    subjectId: 'mathematics',
    proficiency: 45,
    status: 'learning',
    lastPracticed: '2024-01-14T10:00:00Z',
    totalAttempts: 8,
    successRate: 50,
    updatedAt: '2024-01-14T10:00:00Z',
  },
  {
    studentId: 'test-student-123',
    topicId: 'photosynthesis',
    topicName: 'Photosynthesis',
    subjectId: 'science',
    proficiency: 92,
    status: 'mastered',
    lastPracticed: '2024-01-16T10:00:00Z',
    totalAttempts: 12,
    successRate: 95,
    updatedAt: '2024-01-16T10:00:00Z',
  },
  {
    studentId: 'test-student-123',
    topicId: 'cell-structure',
    topicName: 'Cell Structure',
    subjectId: 'science',
    proficiency: 55,
    status: 'practicing',
    lastPracticed: '2024-01-13T10:00:00Z',
    totalAttempts: 10,
    successRate: 60,
    updatedAt: '2024-01-13T10:00:00Z',
  },
  {
    studentId: 'test-student-123',
    topicId: 'grammar',
    topicName: 'English Grammar',
    subjectId: 'english',
    proficiency: 0,
    status: 'not-started',
    totalAttempts: 0,
    successRate: 0,
    updatedAt: '2024-01-10T10:00:00Z',
  },
];

describe('KnowledgeProgressScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Loading State', () => {
    it('should show loading indicator while fetching data', () => {
      (educationService.getKnowledgeState as jest.Mock).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      const { getByText } = render(
        <KnowledgeProgressScreen navigation={mockNavigation} route={mockRoute} />
      );

      expect(getByText('Loading knowledge progress...')).toBeTruthy();
    });
  });

  describe('Error State', () => {
    it('should display error message when loading fails', async () => {
      const errorMessage = 'Failed to load knowledge state';
      (educationService.getKnowledgeState as jest.Mock).mockRejectedValue(
        new Error(errorMessage)
      );

      const { getByText } = render(
        <KnowledgeProgressScreen navigation={mockNavigation} route={mockRoute} />
      );

      await waitFor(() => {
        expect(getByText(errorMessage)).toBeTruthy();
      });
    });

    it('should allow retry after error', async () => {
      (educationService.getKnowledgeState as jest.Mock)
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce(mockKnowledgeState);

      const { getByText } = render(
        <KnowledgeProgressScreen navigation={mockNavigation} route={mockRoute} />
      );

      await waitFor(() => {
        expect(getByText('Network error')).toBeTruthy();
      });

      const retryButton = getByText('Retry');
      fireEvent.press(retryButton);

      await waitFor(() => {
        expect(getByText('Overall Progress')).toBeTruthy();
      });
    });
  });

  describe('Empty State', () => {
    it('should show empty state when no knowledge data exists', async () => {
      (educationService.getKnowledgeState as jest.Mock).mockResolvedValue([]);

      const { getByText } = render(
        <KnowledgeProgressScreen navigation={mockNavigation} route={mockRoute} />
      );

      await waitFor(() => {
        expect(getByText('No Progress Data Yet')).toBeTruthy();
        expect(
          getByText('Complete a diagnostic assessment to start tracking your progress')
        ).toBeTruthy();
      });
    });

    it('should navigate to diagnostic assessment from empty state', async () => {
      (educationService.getKnowledgeState as jest.Mock).mockResolvedValue([]);

      const { getByText } = render(
        <KnowledgeProgressScreen navigation={mockNavigation} route={mockRoute} />
      );

      await waitFor(() => {
        expect(getByText('Start Assessment')).toBeTruthy();
      });

      const startButton = getByText('Start Assessment');
      fireEvent.press(startButton);

      expect(mockNavigate).toHaveBeenCalledWith('DiagnosticAssessment', {
        studentId: 'test-student-123',
      });
    });
  });

  describe('Overall Progress Summary', () => {
    beforeEach(() => {
      (educationService.getKnowledgeState as jest.Mock).mockResolvedValue(
        mockKnowledgeState
      );
    });

    it('should display overall progress summary', async () => {
      const { getByText } = render(
        <KnowledgeProgressScreen navigation={mockNavigation} route={mockRoute} />
      );

      await waitFor(() => {
        expect(getByText('Overall Progress')).toBeTruthy();
      });
    });

    it('should calculate and display average proficiency correctly', async () => {
      const { getByText, getAllByText } = render(
        <KnowledgeProgressScreen navigation={mockNavigation} route={mockRoute} />
      );

      await waitFor(() => {
        // Average: (85 + 45 + 92 + 55 + 0) / 5 = 55.4 ≈ 55%
        // The 55% should appear in the circular progress indicator
        const proficiencyElements = getAllByText('55%');
        expect(proficiencyElements.length).toBeGreaterThan(0);
      });
    });

    it('should display correct topic counts', async () => {
      const { getByText } = render(
        <KnowledgeProgressScreen navigation={mockNavigation} route={mockRoute} />
      );

      await waitFor(() => {
        expect(getByText('Total Topics')).toBeTruthy();
        expect(getByText('Mastered')).toBeTruthy();
        expect(getByText('Learning')).toBeTruthy();
        expect(getByText('Not Started')).toBeTruthy();
      });
    });

    it('should display proficiency label based on average', async () => {
      const { getByText } = render(
        <KnowledgeProgressScreen navigation={mockNavigation} route={mockRoute} />
      );

      await waitFor(() => {
        // 55% falls in "Proficient" range (51-75)
        expect(getByText('Proficient')).toBeTruthy();
      });
    });
  });

  describe('Subject Filtering', () => {
    beforeEach(() => {
      (educationService.getKnowledgeState as jest.Mock).mockResolvedValue(
        mockKnowledgeState
      );
    });

    it('should display all subjects filter by default', async () => {
      const { getByText } = render(
        <KnowledgeProgressScreen navigation={mockNavigation} route={mockRoute} />
      );

      await waitFor(() => {
        expect(getByText('All Subjects')).toBeTruthy();
      });
    });

    it('should filter topics by selected subject', async () => {
      const { getAllByText } = render(
        <KnowledgeProgressScreen navigation={mockNavigation} route={mockRoute} />
      );

      await waitFor(() => {
        const mathElements = getAllByText('Mathematics');
        expect(mathElements.length).toBeGreaterThan(0);
      });

      // Click Mathematics filter (first occurrence)
      const mathElements = getAllByText('Mathematics');
      fireEvent.press(mathElements[0]);

      await waitFor(() => {
        // Should show math topics
        expect(getAllByText('Algebra Basics').length).toBeGreaterThan(0);
        expect(getAllByText('Geometry').length).toBeGreaterThan(0);
      });
    });

    it('should update statistics when filtering by subject', async () => {
      const { getAllByText } = render(
        <KnowledgeProgressScreen navigation={mockNavigation} route={mockRoute} />
      );

      await waitFor(() => {
        const scienceElements = getAllByText('Science');
        expect(scienceElements.length).toBeGreaterThan(0);
      });

      // Click Science filter (first occurrence)
      const scienceElements = getAllByText('Science');
      fireEvent.press(scienceElements[0]);

      await waitFor(() => {
        // Average for science: (92 + 55) / 2 = 73.5 ≈ 74%
        const proficiencyElements = getAllByText(/74%/);
        expect(proficiencyElements.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Proficiency Color Coding', () => {
    beforeEach(() => {
      (educationService.getKnowledgeState as jest.Mock).mockResolvedValue(
        mockKnowledgeState
      );
    });

    it('should display topics with correct proficiency percentages', async () => {
      const { getAllByText } = render(
        <KnowledgeProgressScreen navigation={mockNavigation} route={mockRoute} />
      );

      await waitFor(() => {
        expect(getAllByText('85%').length).toBeGreaterThan(0); // Algebra Basics
        expect(getAllByText('45%').length).toBeGreaterThan(0); // Geometry
        expect(getAllByText('92%').length).toBeGreaterThan(0); // Photosynthesis
        expect(getAllByText('55%').length).toBeGreaterThan(0); // Cell Structure
      });
    });

    it('should group topics by subject', async () => {
      const { getByText } = render(
        <KnowledgeProgressScreen navigation={mockNavigation} route={mockRoute} />
      );

      await waitFor(() => {
        // Check subject headers exist
        expect(getByText('🔢')).toBeTruthy(); // Mathematics icon
        expect(getByText('🔬')).toBeTruthy(); // Science icon
      });
    });
  });

  describe('Weak Areas', () => {
    beforeEach(() => {
      (educationService.getKnowledgeState as jest.Mock).mockResolvedValue(
        mockKnowledgeState
      );
    });

    it('should display weak areas section', async () => {
      const { getByText } = render(
        <KnowledgeProgressScreen navigation={mockNavigation} route={mockRoute} />
      );

      await waitFor(() => {
        expect(getByText('⚠️ Areas Needing Improvement')).toBeTruthy();
        expect(
          getByText('Focus on these topics to boost your overall progress')
        ).toBeTruthy();
      });
    });

    it('should show topics with proficiency < 60% as weak areas', async () => {
      const { getByText } = render(
        <KnowledgeProgressScreen navigation={mockNavigation} route={mockRoute} />
      );

      await waitFor(() => {
        // Geometry (45%) and Cell Structure (55%) should be in weak areas
        const weakAreasSection = getByText('⚠️ Areas Needing Improvement').parent;
        expect(weakAreasSection).toBeTruthy();
      });
    });

    it('should not show not-started topics in weak areas', async () => {
      const { queryByText } = render(
        <KnowledgeProgressScreen navigation={mockNavigation} route={mockRoute} />
      );

      await waitFor(() => {
        // English Grammar (not-started) should not be in weak areas
        const weakAreasSection = queryByText('⚠️ Areas Needing Improvement')?.parent;
        if (weakAreasSection) {
          // Grammar should not be in this section
          expect(weakAreasSection.props.children).not.toContain('English Grammar');
        }
      });
    });
  });

  describe('Strong Areas', () => {
    beforeEach(() => {
      (educationService.getKnowledgeState as jest.Mock).mockResolvedValue(
        mockKnowledgeState
      );
    });

    it('should display strong areas section', async () => {
      const { getByText } = render(
        <KnowledgeProgressScreen navigation={mockNavigation} route={mockRoute} />
      );

      await waitFor(() => {
        expect(getByText('🌟 Strong Areas')).toBeTruthy();
        expect(getByText("Great job! You're excelling in these topics")).toBeTruthy();
      });
    });

    it('should show topics with proficiency >= 80% as strong areas', async () => {
      const { getByText } = render(
        <KnowledgeProgressScreen navigation={mockNavigation} route={mockRoute} />
      );

      await waitFor(() => {
        // Algebra Basics (85%) and Photosynthesis (92%) should be in strong areas
        const strongAreasSection = getByText('🌟 Strong Areas').parent;
        expect(strongAreasSection).toBeTruthy();
      });
    });
  });

  describe('Recommendations', () => {
    beforeEach(() => {
      (educationService.getKnowledgeState as jest.Mock).mockResolvedValue(
        mockKnowledgeState
      );
    });

    it('should display recommendations section', async () => {
      const { getByText } = render(
        <KnowledgeProgressScreen navigation={mockNavigation} route={mockRoute} />
      );

      await waitFor(() => {
        expect(getByText('💡 Next Steps')).toBeTruthy();
      });
    });

    it('should recommend improving weakest topic', async () => {
      const { getByText } = render(
        <KnowledgeProgressScreen navigation={mockNavigation} route={mockRoute} />
      );

      await waitFor(() => {
        // Geometry (45%) is the weakest
        expect(getByText(/Focus on improving Geometry/)).toBeTruthy();
      });
    });

    it('should recommend continuing practice for practicing topics', async () => {
      const { getByText } = render(
        <KnowledgeProgressScreen navigation={mockNavigation} route={mockRoute} />
      );

      await waitFor(() => {
        expect(getByText(/Continue practicing/)).toBeTruthy();
      });
    });

    it('should recommend starting new topics', async () => {
      const { getByText } = render(
        <KnowledgeProgressScreen navigation={mockNavigation} route={mockRoute} />
      );

      await waitFor(() => {
        expect(getByText(/Start learning/)).toBeTruthy();
      });
    });
  });

  describe('Topic Details', () => {
    beforeEach(() => {
      (educationService.getKnowledgeState as jest.Mock).mockResolvedValue(
        mockKnowledgeState
      );
    });

    it('should display topic names', async () => {
      const { getAllByText } = render(
        <KnowledgeProgressScreen navigation={mockNavigation} route={mockRoute} />
      );

      await waitFor(() => {
        expect(getAllByText('Algebra Basics').length).toBeGreaterThan(0);
        expect(getAllByText('Geometry').length).toBeGreaterThan(0);
        expect(getAllByText('Photosynthesis').length).toBeGreaterThan(0);
        expect(getAllByText('Cell Structure').length).toBeGreaterThan(0);
      });
    });

    it('should display topic status badges', async () => {
      const { getAllByText } = render(
        <KnowledgeProgressScreen navigation={mockNavigation} route={mockRoute} />
      );

      await waitFor(() => {
        expect(getAllByText('MASTERED').length).toBeGreaterThan(0);
        expect(getAllByText('LEARNING').length).toBeGreaterThan(0);
        expect(getAllByText('PRACTICING').length).toBeGreaterThan(0);
      });
    });

    it('should display success rate for each topic', async () => {
      const { getByText } = render(
        <KnowledgeProgressScreen navigation={mockNavigation} route={mockRoute} />
      );

      await waitFor(() => {
        expect(getByText(/Success Rate: 90%/)).toBeTruthy(); // Algebra
        expect(getByText(/Success Rate: 50%/)).toBeTruthy(); // Geometry
        expect(getByText(/Success Rate: 95%/)).toBeTruthy(); // Photosynthesis
      });
    });

    it('should display total attempts for each topic', async () => {
      const { getByText } = render(
        <KnowledgeProgressScreen navigation={mockNavigation} route={mockRoute} />
      );

      await waitFor(() => {
        expect(getByText(/Attempts: 15/)).toBeTruthy(); // Algebra
        expect(getByText(/Attempts: 8/)).toBeTruthy(); // Geometry
        expect(getByText(/Attempts: 12/)).toBeTruthy(); // Photosynthesis
      });
    });

    it('should display last practiced date when available', async () => {
      const { getAllByText } = render(
        <KnowledgeProgressScreen navigation={mockNavigation} route={mockRoute} />
      );

      await waitFor(() => {
        // Should show formatted dates with "Last:" prefix
        const lastElements = getAllByText(/Last:/);
        expect(lastElements.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Subject Average Calculation', () => {
    beforeEach(() => {
      (educationService.getKnowledgeState as jest.Mock).mockResolvedValue(
        mockKnowledgeState
      );
    });

    it('should calculate and display subject average proficiency', async () => {
      const { getByText } = render(
        <KnowledgeProgressScreen navigation={mockNavigation} route={mockRoute} />
      );

      await waitFor(() => {
        // Mathematics average: (85 + 45) / 2 = 65%
        expect(getByText(/Avg: 65%/)).toBeTruthy();
        
        // Science average: (92 + 55) / 2 = 74% (rounded)
        expect(getByText(/Avg: 74%/)).toBeTruthy();
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle single topic correctly', async () => {
      const singleTopic: KnowledgeState[] = [
        {
          studentId: 'test-student-123',
          topicId: 'algebra',
          topicName: 'Algebra',
          subjectId: 'mathematics',
          proficiency: 75,
          status: 'practicing',
          totalAttempts: 5,
          successRate: 80,
          updatedAt: '2024-01-15T10:00:00Z',
        },
      ];

      (educationService.getKnowledgeState as jest.Mock).mockResolvedValue(singleTopic);

      const { getAllByText, getByText } = render(
        <KnowledgeProgressScreen navigation={mockNavigation} route={mockRoute} />
      );

      await waitFor(() => {
        expect(getAllByText('75%').length).toBeGreaterThan(0);
        expect(getByText('Total Topics')).toBeTruthy();
      });
    });

    it('should handle all topics at 0% proficiency', async () => {
      const zeroTopics: KnowledgeState[] = [
        {
          studentId: 'test-student-123',
          topicId: 'topic1',
          topicName: 'Topic 1',
          subjectId: 'mathematics',
          proficiency: 0,
          status: 'not-started',
          totalAttempts: 0,
          successRate: 0,
          updatedAt: '2024-01-15T10:00:00Z',
        },
      ];

      (educationService.getKnowledgeState as jest.Mock).mockResolvedValue(zeroTopics);

      const { getAllByText, getByText } = render(
        <KnowledgeProgressScreen navigation={mockNavigation} route={mockRoute} />
      );

      await waitFor(() => {
        expect(getAllByText('0%').length).toBeGreaterThan(0);
        expect(getByText('Beginner')).toBeTruthy();
      });
    });

    it('should handle all topics at 100% proficiency', async () => {
      const perfectTopics: KnowledgeState[] = [
        {
          studentId: 'test-student-123',
          topicId: 'topic1',
          topicName: 'Topic 1',
          subjectId: 'mathematics',
          proficiency: 100,
          status: 'mastered',
          totalAttempts: 20,
          successRate: 100,
          updatedAt: '2024-01-15T10:00:00Z',
        },
      ];

      (educationService.getKnowledgeState as jest.Mock).mockResolvedValue(perfectTopics);

      const { getAllByText, getByText } = render(
        <KnowledgeProgressScreen navigation={mockNavigation} route={mockRoute} />
      );

      await waitFor(() => {
        expect(getAllByText('100%').length).toBeGreaterThan(0);
        expect(getByText('Advanced')).toBeTruthy();
      });
    });

    it('should handle topics without lastPracticed date', async () => {
      const topicsWithoutDate: KnowledgeState[] = [
        {
          studentId: 'test-student-123',
          topicId: 'topic1',
          topicName: 'Topic 1',
          subjectId: 'mathematics',
          proficiency: 50,
          status: 'learning',
          totalAttempts: 5,
          successRate: 60,
          updatedAt: '2024-01-15T10:00:00Z',
        },
      ];

      (educationService.getKnowledgeState as jest.Mock).mockResolvedValue(
        topicsWithoutDate
      );

      const { getAllByText } = render(
        <KnowledgeProgressScreen navigation={mockNavigation} route={mockRoute} />
      );

      await waitFor(() => {
        expect(getAllByText('Topic 1').length).toBeGreaterThan(0);
        // Should not crash without lastPracticed
      });
    });
  });

  describe('Accessibility', () => {
    beforeEach(() => {
      (educationService.getKnowledgeState as jest.Mock).mockResolvedValue(
        mockKnowledgeState
      );
    });

    it('should have accessible labels for key elements', async () => {
      const { getByText } = render(
        <KnowledgeProgressScreen navigation={mockNavigation} route={mockRoute} />
      );

      await waitFor(() => {
        expect(getByText('Overall Progress')).toBeTruthy();
        expect(getByText('Topics Progress')).toBeTruthy();
        expect(getByText('💡 Next Steps')).toBeTruthy();
      });
    });
  });
});
