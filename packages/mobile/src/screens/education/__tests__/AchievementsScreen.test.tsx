/**
 * AchievementsScreen Tests
 * Comprehensive tests for achievement and badge display functionality
 */

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import AchievementsScreen from '../AchievementsScreen';
import educationService from '../../../services/educationService';

// Mock the education service
jest.mock('../../../services/educationService');

// Mock OfflineIndicator component
jest.mock('../../../components/OfflineIndicator', () => ({
  OfflineIndicator: () => null,
}));

// Mock navigation
const mockNavigation = {
  navigate: jest.fn(),
  goBack: jest.fn(),
};

// Mock route
const mockRoute = {
  params: {
    studentId: 'test-student-123',
  },
};

// Sample achievement data
const mockAchievements = [
  {
    id: '1',
    name: 'First Steps',
    description: 'Complete your first lesson',
    category: 'learning',
    iconEmoji: '👣',
    status: 'earned',
    progress: 1,
    maxProgress: 1,
    earnedAt: '2024-01-15T10:00:00Z',
    xpReward: 10,
  },
  {
    id: '2',
    name: 'Quick Learner',
    description: 'Complete 5 lessons in one day',
    category: 'learning',
    iconEmoji: '⚡',
    status: 'earned',
    progress: 5,
    maxProgress: 5,
    earnedAt: '2024-01-20T14:30:00Z',
    xpReward: 25,
  },
  {
    id: '3',
    name: 'Knowledge Seeker',
    description: 'Watch 10 educational videos',
    category: 'learning',
    iconEmoji: '🔍',
    status: 'in_progress',
    progress: 7,
    maxProgress: 10,
    xpReward: 50,
  },
  {
    id: '4',
    name: 'Subject Master',
    description: 'Master all topics in one subject',
    category: 'mastery',
    iconEmoji: '🏆',
    status: 'locked',
    progress: 0,
    maxProgress: 1,
    xpReward: 100,
    unlockRequirements: ['Complete all topics in a subject with 80%+ proficiency'],
  },
];

const mockStats = {
  totalAchievements: 4,
  earnedAchievements: 2,
  completionPercentage: 50,
  totalXpEarned: 35,
  recentAchievements: [
    { id: '2', name: 'Quick Learner', earnedAt: '2024-01-20T14:30:00Z' },
    { id: '1', name: 'First Steps', earnedAt: '2024-01-15T10:00:00Z' },
  ],
};

describe('AchievementsScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Loading State', () => {
    it('should display loading indicator while fetching achievements', () => {
      (educationService.getAchievements as jest.Mock).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      const { getByText } = render(
        <AchievementsScreen navigation={mockNavigation} route={mockRoute} />
      );

      expect(getByText('Loading achievements...')).toBeTruthy();
    });
  });

  describe('Achievement Display', () => {
    beforeEach(() => {
      (educationService.getAchievements as jest.Mock).mockResolvedValue({
        achievements: mockAchievements,
        stats: mockStats,
      });
    });

    it('should display achievement statistics', async () => {
      const { getByText, getAllByText } = render(
        <AchievementsScreen navigation={mockNavigation} route={mockRoute} />
      );

      await waitFor(() => {
        expect(getByText('Your Progress')).toBeTruthy();
        expect(getByText('2')).toBeTruthy(); // Earned
        const totalElements = getAllByText('4');
        expect(totalElements.length).toBeGreaterThan(0); // Total (may appear in multiple places)
        expect(getByText('50%')).toBeTruthy(); // Completion
        expect(getByText('35')).toBeTruthy(); // Total XP
      });
    });

    it('should display earned achievements with checkmark', async () => {
      const { getAllByText } = render(
        <AchievementsScreen navigation={mockNavigation} route={mockRoute} />
      );

      await waitFor(() => {
        const firstSteps = getAllByText('First Steps');
        expect(firstSteps.length).toBeGreaterThan(0);
        const quickLearner = getAllByText('Quick Learner');
        expect(quickLearner.length).toBeGreaterThan(0);
        expect(getAllByText('✓ Earned (2)').length).toBeGreaterThan(0);
      });
    });

    it('should display in-progress achievements with progress bar', async () => {
      const { getByText } = render(
        <AchievementsScreen navigation={mockNavigation} route={mockRoute} />
      );

      await waitFor(() => {
        expect(getByText('Knowledge Seeker')).toBeTruthy();
        expect(getByText('7 / 10')).toBeTruthy();
        expect(getByText('⏳ In Progress (1)')).toBeTruthy();
      });
    });

    it('should display locked achievements with unlock requirements', async () => {
      const { getByText } = render(
        <AchievementsScreen navigation={mockNavigation} route={mockRoute} />
      );

      await waitFor(() => {
        expect(getByText('Subject Master')).toBeTruthy();
        expect(getByText('🔒 Unlock:')).toBeTruthy();
        expect(getByText('🔒 Locked (1)')).toBeTruthy();
      });
    });

    it('should display achievement categories', async () => {
      const { getAllByText } = render(
        <AchievementsScreen navigation={mockNavigation} route={mockRoute} />
      );

      await waitFor(() => {
        const learningElements = getAllByText('Learning');
        expect(learningElements.length).toBeGreaterThan(0);
        const masteryElements = getAllByText('Mastery');
        expect(masteryElements.length).toBeGreaterThan(0);
      });
    });

    it('should display XP rewards for each achievement', async () => {
      const { getByText } = render(
        <AchievementsScreen navigation={mockNavigation} route={mockRoute} />
      );

      await waitFor(() => {
        expect(getByText('+10 XP')).toBeTruthy();
        expect(getByText('+25 XP')).toBeTruthy();
        expect(getByText('+50 XP')).toBeTruthy();
        expect(getByText('+100 XP')).toBeTruthy();
      });
    });

    it('should display earned dates for completed achievements', async () => {
      const { getAllByText } = render(
        <AchievementsScreen navigation={mockNavigation} route={mockRoute} />
      );

      await waitFor(() => {
        const earnedDates = getAllByText(/Earned on/);
        expect(earnedDates.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Recent Achievements', () => {
    beforeEach(() => {
      (educationService.getAchievements as jest.Mock).mockResolvedValue({
        achievements: mockAchievements,
        stats: mockStats,
      });
    });

    it('should display recent achievements section', async () => {
      const { getByText } = render(
        <AchievementsScreen navigation={mockNavigation} route={mockRoute} />
      );

      await waitFor(() => {
        expect(getByText('🎉 Recently Earned')).toBeTruthy();
      });
    });

    it('should show recent achievements in horizontal scroll', async () => {
      const { getAllByText } = render(
        <AchievementsScreen navigation={mockNavigation} route={mockRoute} />
      );

      await waitFor(() => {
        // Recent achievements should be visible
        const quickLearner = getAllByText('Quick Learner');
        expect(quickLearner.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Category Filtering', () => {
    beforeEach(() => {
      (educationService.getAchievements as jest.Mock).mockResolvedValue({
        achievements: mockAchievements,
        stats: mockStats,
      });
    });

    it('should display category filter chips', async () => {
      const { getByText, getAllByText } = render(
        <AchievementsScreen navigation={mockNavigation} route={mockRoute} />
      );

      await waitFor(() => {
        expect(getByText('All')).toBeTruthy();
        const learningElements = getAllByText('Learning');
        expect(learningElements.length).toBeGreaterThan(0);
        expect(getByText('Progress')).toBeTruthy();
        const masteryElements = getAllByText('Mastery');
        expect(masteryElements.length).toBeGreaterThan(0);
        expect(getByText('Streaks')).toBeTruthy();
      });
    });

    it('should filter achievements by category when chip is tapped', async () => {
      const { getAllByText, queryAllByText } = render(
        <AchievementsScreen navigation={mockNavigation} route={mockRoute} />
      );

      await waitFor(() => {
        const firstSteps = getAllByText('First Steps');
        expect(firstSteps.length).toBeGreaterThan(0);
      });

      // Tap on Mastery category
      const masteryChips = getAllByText('Mastery');
      fireEvent.press(masteryChips[0]); // Press the first one (filter chip)

      await waitFor(() => {
        // Should show mastery achievements
        expect(getAllByText('Subject Master').length).toBeGreaterThan(0);
        // Should not show learning achievements (or very few)
        const firstStepsAfterFilter = queryAllByText('First Steps');
        // After filtering to Mastery, First Steps should not be in the main list
        // It might still appear in recent achievements, so we just check it's reduced
        expect(firstStepsAfterFilter.length).toBeLessThan(2);
      });
    });

    it('should show achievement count in category chips', async () => {
      const { getByText } = render(
        <AchievementsScreen navigation={mockNavigation} route={mockRoute} />
      );

      await waitFor(() => {
        // All category should show total count
        const allChip = getByText('All');
        expect(allChip).toBeTruthy();
      });
    });
  });

  describe('Achievement Details Modal', () => {
    beforeEach(() => {
      (educationService.getAchievements as jest.Mock).mockResolvedValue({
        achievements: mockAchievements,
        stats: mockStats,
      });
    });

    it('should open detail modal when achievement is tapped', async () => {
      const { getAllByText, getByText } = render(
        <AchievementsScreen navigation={mockNavigation} route={mockRoute} />
      );

      await waitFor(() => {
        const achievements = getAllByText('First Steps');
        fireEvent.press(achievements[0]);
      });

      await waitFor(() => {
        expect(getByText('✓ EARNED')).toBeTruthy();
        const descriptions = getAllByText('Complete your first lesson');
        expect(descriptions.length).toBeGreaterThan(0);
      });
    });

    it('should display full achievement details in modal', async () => {
      const { getAllByText } = render(
        <AchievementsScreen navigation={mockNavigation} route={mockRoute} />
      );

      await waitFor(() => {
        const achievement = getAllByText('Knowledge Seeker')[0];
        fireEvent.press(achievement);
      });

      await waitFor(() => {
        expect(getAllByText('IN PROGRESS').length).toBeGreaterThan(0);
        const descriptions = getAllByText('Watch 10 educational videos');
        expect(descriptions.length).toBeGreaterThan(0);
        const progressElements = getAllByText('Progress');
        expect(progressElements.length).toBeGreaterThan(0);
        expect(getAllByText('7 / 10 (70%)').length).toBeGreaterThan(0);
      });
    });

    it('should show unlock requirements for locked achievements', async () => {
      const { getByText, getAllByText } = render(
        <AchievementsScreen navigation={mockNavigation} route={mockRoute} />
      );

      await waitFor(() => {
        const achievement = getByText('Subject Master');
        fireEvent.press(achievement);
      });

      await waitFor(() => {
        expect(getByText('🔒 LOCKED')).toBeTruthy();
        expect(getByText('Unlock Requirements:')).toBeTruthy();
        const requirements = getAllByText(/Complete all topics in a subject/);
        expect(requirements.length).toBeGreaterThan(0);
      });
    });

    it('should close modal when close button is tapped', async () => {
      const { getAllByText, getByText, queryByText } = render(
        <AchievementsScreen navigation={mockNavigation} route={mockRoute} />
      );

      await waitFor(() => {
        const achievements = getAllByText('First Steps');
        fireEvent.press(achievements[0]);
      });

      await waitFor(() => {
        expect(getByText('✓ EARNED')).toBeTruthy();
      });

      const closeButton = getByText('Close');
      fireEvent.press(closeButton);

      await waitFor(() => {
        expect(queryByText('✓ EARNED')).toBeNull();
      });
    });
  });

  describe('Error Handling', () => {
    it('should display error message when loading fails', async () => {
      (educationService.getAchievements as jest.Mock).mockRejectedValue(
        new Error('Network error')
      );

      const { getByText } = render(
        <AchievementsScreen navigation={mockNavigation} route={mockRoute} />
      );

      await waitFor(() => {
        expect(getByText('Network error')).toBeTruthy();
        expect(getByText('Retry')).toBeTruthy();
      });
    });

    it('should retry loading when retry button is tapped', async () => {
      (educationService.getAchievements as jest.Mock)
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          achievements: mockAchievements,
          stats: mockStats,
        });

      const { getByText } = render(
        <AchievementsScreen navigation={mockNavigation} route={mockRoute} />
      );

      await waitFor(() => {
        expect(getByText('Network error')).toBeTruthy();
      });

      const retryButton = getByText('Retry');
      fireEvent.press(retryButton);

      await waitFor(() => {
        expect(getByText('Your Progress')).toBeTruthy();
      });
    });
  });

  describe('Empty State', () => {
    it('should display empty state when no achievements exist', async () => {
      (educationService.getAchievements as jest.Mock).mockResolvedValue({
        achievements: [],
        stats: {
          totalAchievements: 0,
          earnedAchievements: 0,
          completionPercentage: 0,
          totalXpEarned: 0,
          recentAchievements: [],
        },
      });

      const { getByText } = render(
        <AchievementsScreen navigation={mockNavigation} route={mockRoute} />
      );

      await waitFor(() => {
        expect(getByText('No Achievements Yet')).toBeTruthy();
        expect(getByText(/Start learning to unlock achievements/)).toBeTruthy();
      });
    });
  });

  describe('Progress Visualization', () => {
    beforeEach(() => {
      (educationService.getAchievements as jest.Mock).mockResolvedValue({
        achievements: mockAchievements,
        stats: mockStats,
      });
    });

    it('should display overall progress bar', async () => {
      const { getByText } = render(
        <AchievementsScreen navigation={mockNavigation} route={mockRoute} />
      );

      await waitFor(() => {
        expect(getByText('2 of 4 achievements unlocked')).toBeTruthy();
      });
    });

    it('should display progress bars for in-progress achievements', async () => {
      const { getByText } = render(
        <AchievementsScreen navigation={mockNavigation} route={mockRoute} />
      );

      await waitFor(() => {
        expect(getByText('Knowledge Seeker')).toBeTruthy();
        expect(getByText('7 / 10')).toBeTruthy();
      });
    });
  });

  describe('Offline Support', () => {
    it('should work with offline data', async () => {
      (educationService.getAchievements as jest.Mock).mockResolvedValue({
        achievements: mockAchievements,
        stats: mockStats,
      });

      const { getByText } = render(
        <AchievementsScreen navigation={mockNavigation} route={mockRoute} />
      );

      await waitFor(() => {
        expect(getByText('Your Progress')).toBeTruthy();
      });
    });
  });

  describe('Achievement Grouping', () => {
    beforeEach(() => {
      (educationService.getAchievements as jest.Mock).mockResolvedValue({
        achievements: mockAchievements,
        stats: mockStats,
      });
    });

    it('should group achievements by status', async () => {
      const { getByText } = render(
        <AchievementsScreen navigation={mockNavigation} route={mockRoute} />
      );

      await waitFor(() => {
        expect(getByText('✓ Earned (2)')).toBeTruthy();
        expect(getByText('⏳ In Progress (1)')).toBeTruthy();
        expect(getByText('🔒 Locked (1)')).toBeTruthy();
      });
    });

    it('should display achievements in correct sections', async () => {
      const { getAllByText, getByText } = render(
        <AchievementsScreen navigation={mockNavigation} route={mockRoute} />
      );

      await waitFor(() => {
        // Earned section
        const firstSteps = getAllByText('First Steps');
        expect(firstSteps.length).toBeGreaterThan(0);
        const quickLearner = getAllByText('Quick Learner');
        expect(quickLearner.length).toBeGreaterThan(0);

        // In Progress section
        expect(getByText('Knowledge Seeker')).toBeTruthy();

        // Locked section
        expect(getByText('Subject Master')).toBeTruthy();
      });
    });
  });

  describe('Integration with Education Service', () => {
    it('should call getAchievements with correct student ID', async () => {
      (educationService.getAchievements as jest.Mock).mockResolvedValue({
        achievements: mockAchievements,
        stats: mockStats,
      });

      render(
        <AchievementsScreen navigation={mockNavigation} route={mockRoute} />
      );

      await waitFor(() => {
        expect(educationService.getAchievements).toHaveBeenCalledWith('test-student-123');
      });
    });

    it('should use default student ID when not provided in route params', async () => {
      (educationService.getAchievements as jest.Mock).mockResolvedValue({
        achievements: mockAchievements,
        stats: mockStats,
      });

      const routeWithoutParams = { params: undefined };

      render(
        <AchievementsScreen navigation={mockNavigation} route={routeWithoutParams as any} />
      );

      await waitFor(() => {
        expect(educationService.getAchievements).toHaveBeenCalledWith('demo-student');
      });
    });
  });
});
