/**
 * Content Library Screen Tests
 * Task 35.2: Build content library with search and filters
 */

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import ContentLibraryScreen from '../src/screens/education/ContentLibraryScreen';
import educationService from '../src/services/educationService';

// Mock the education service
jest.mock('../src/services/educationService');

// Mock the OfflineIndicator component
jest.mock('../src/components/OfflineIndicator', () => ({
  OfflineIndicator: () => null,
}));

// Mock navigation
const mockNavigate = jest.fn();
const mockNavigation = {
  navigate: mockNavigate,
  goBack: jest.fn(),
  setOptions: jest.fn(),
};

const mockRoute = {
  params: {
    studentId: 'test-student-123',
  },
};

describe('ContentLibraryScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock service responses
    (educationService.getContentRecommendations as jest.Mock).mockResolvedValue([
      { contentId: '1', reason: 'Based on your progress', relevanceScore: 0.9 },
    ]);
    
    (educationService.searchContent as jest.Mock).mockResolvedValue({
      items: [
        {
          id: '1',
          title: 'Introduction to Algebra',
          description: 'Learn the basics of algebraic expressions',
          subject: 'mathematics',
          topic: 'Algebra',
          gradeLevel: '8',
          difficulty: 'easy',
          contentType: 'video',
          duration: 15,
          language: 'English',
          viewCount: 1250,
          rating: 4.5,
          isOfflineAvailable: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: '2',
          title: 'Photosynthesis Explained',
          description: 'Understanding how plants make their own food',
          subject: 'science',
          topic: 'Biology',
          gradeLevel: '7',
          difficulty: 'medium',
          contentType: 'video',
          duration: 20,
          language: 'English',
          viewCount: 980,
          rating: 4.8,
          isOfflineAvailable: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
      total: 2,
      page: 1,
      totalPages: 1,
    });
  });

  it('renders the content library screen', async () => {
    const { getByText } = render(
      <ContentLibraryScreen navigation={mockNavigation as any} route={mockRoute as any} />
    );

    await waitFor(() => {
      expect(getByText('Content Library')).toBeTruthy();
      expect(getByText('Explore educational content')).toBeTruthy();
    });
  });

  it('displays content items after loading', async () => {
    const { getByText } = render(
      <ContentLibraryScreen navigation={mockNavigation as any} route={mockRoute as any} />
    );

    await waitFor(() => {
      expect(getByText('Introduction to Algebra')).toBeTruthy();
      expect(getByText('Photosynthesis Explained')).toBeTruthy();
    });
  });

  it('handles search input with debouncing', async () => {
    const { getByPlaceholderText } = render(
      <ContentLibraryScreen navigation={mockNavigation as any} route={mockRoute as any} />
    );

    await waitFor(() => {
      expect(getByPlaceholderText('Search videos, simulations, games...')).toBeTruthy();
    });

    const searchInput = getByPlaceholderText('Search videos, simulations, games...');
    
    fireEvent.changeText(searchInput, 'algebra');

    // Wait for debounce (500ms)
    await waitFor(
      () => {
        expect(educationService.searchContent).toHaveBeenCalledWith(
          expect.objectContaining({
            query: 'algebra',
          })
        );
      },
      { timeout: 1000 }
    );
  });

  it('opens filter modal when filter button is pressed', async () => {
    const { getByText, queryByText } = render(
      <ContentLibraryScreen navigation={mockNavigation as any} route={mockRoute as any} />
    );

    await waitFor(() => {
      expect(getByText('Content Library')).toBeTruthy();
    });

    // Filter modal should not be visible initially
    expect(queryByText('Filters')).toBeNull();

    // Find and press the filter button (by icon)
    const filterButton = getByText('⚙️');
    fireEvent.press(filterButton);

    // Filter modal should now be visible
    await waitFor(() => {
      expect(getByText('Filters')).toBeTruthy();
    });
  });

  it('applies subject filter', async () => {
    const { getByText, getAllByText, queryByText } = render(
      <ContentLibraryScreen navigation={mockNavigation as any} route={mockRoute as any} />
    );

    await waitFor(() => {
      expect(getByText('Content Library')).toBeTruthy();
    });

    // Open filter modal
    const filterButton = getByText('⚙️');
    fireEvent.press(filterButton);

    await waitFor(() => {
      expect(getByText('Filters')).toBeTruthy();
    });

    // Select Mathematics subject (get all instances and select the first one in the filter modal)
    const mathSubjects = getAllByText('Mathematics');
    fireEvent.press(mathSubjects[0]);

    // Apply filters (closes modal)
    const applyButton = getByText('Apply Filters');
    fireEvent.press(applyButton);

    // Modal should close
    await waitFor(() => {
      expect(queryByText('Filters')).toBeNull();
    });

    // Verify the filter was applied by checking if Mathematics appears in active filters
    // (it will show in the active filter chips at the top)
    await waitFor(() => {
      const mathTexts = getAllByText('Mathematics');
      // Should have at least one instance (in the active filter chip)
      expect(mathTexts.length).toBeGreaterThan(0);
    });
  });

  it('navigates to content viewer when content card is pressed', async () => {
    const { getByText } = render(
      <ContentLibraryScreen navigation={mockNavigation as any} route={mockRoute as any} />
    );

    await waitFor(() => {
      expect(getByText('Introduction to Algebra')).toBeTruthy();
    });

    // Press on content card
    const contentCard = getByText('Introduction to Algebra');
    fireEvent.press(contentCard);

    // Should navigate to ContentViewer
    expect(mockNavigate).toHaveBeenCalledWith('ContentViewer', expect.any(Object));
  });

  it('displays offline badge for offline-available content', async () => {
    const { getByText } = render(
      <ContentLibraryScreen navigation={mockNavigation as any} route={mockRoute as any} />
    );

    await waitFor(() => {
      expect(getByText('Introduction to Algebra')).toBeTruthy();
    });

    // Check for offline badge (📥 emoji)
    const offlineBadges = getByText('📥');
    expect(offlineBadges).toBeTruthy();
  });

  it('displays recommended badge for recommended content', async () => {
    const { getAllByText } = render(
      <ContentLibraryScreen navigation={mockNavigation as any} route={mockRoute as any} />
    );

    await waitFor(() => {
      const recommendedBadges = getAllByText('⭐ Recommended');
      expect(recommendedBadges.length).toBeGreaterThan(0);
    });
  });

  it('clears all filters when clear button is pressed', async () => {
    const { getByText, getAllByText } = render(
      <ContentLibraryScreen navigation={mockNavigation as any} route={mockRoute as any} />
    );

    await waitFor(() => {
      expect(getByText('Content Library')).toBeTruthy();
    });

    // Open filter modal
    const filterButton = getByText('⚙️');
    fireEvent.press(filterButton);

    await waitFor(() => {
      expect(getByText('Filters')).toBeTruthy();
    });

    // Select a filter (get all instances and select the first one in the filter modal)
    const mathSubjects = getAllByText('Mathematics');
    fireEvent.press(mathSubjects[0]);

    // Clear all filters
    const clearButton = getByText('Clear All');
    fireEvent.press(clearButton);

    // Wait for search to be called without filters
    await waitFor(
      () => {
        const lastCall = (educationService.searchContent as jest.Mock).mock.calls.slice(-1)[0];
        expect(lastCall[0].subject).toBeUndefined();
      },
      { timeout: 1000 }
    );
  });

  it('handles error state gracefully', async () => {
    // Mock service to throw error
    (educationService.searchContent as jest.Mock).mockRejectedValue(
      new Error('Network error')
    );

    const { getByText } = render(
      <ContentLibraryScreen navigation={mockNavigation as any} route={mockRoute as any} />
    );

    await waitFor(() => {
      expect(getByText(/Network error/i)).toBeTruthy();
      expect(getByText('Retry')).toBeTruthy();
    });
  });

  it('displays empty state when no content found', async () => {
    // Mock empty results
    (educationService.searchContent as jest.Mock).mockResolvedValue({
      items: [],
      total: 0,
      page: 1,
      totalPages: 0,
    });

    const { getByText } = render(
      <ContentLibraryScreen navigation={mockNavigation as any} route={mockRoute as any} />
    );

    await waitFor(() => {
      expect(getByText('No content found')).toBeTruthy();
      expect(getByText('Try adjusting your search or filters')).toBeTruthy();
    });
  });

  it('tracks content view when content is selected', async () => {
    (educationService.trackContentView as jest.Mock) = jest.fn().mockResolvedValue(undefined);

    const { getByText } = render(
      <ContentLibraryScreen navigation={mockNavigation as any} route={mockRoute as any} />
    );

    await waitFor(() => {
      expect(getByText('Introduction to Algebra')).toBeTruthy();
    });

    // Press on content card
    const contentCard = getByText('Introduction to Algebra');
    fireEvent.press(contentCard);

    // Should track content view
    expect(educationService.trackContentView).toHaveBeenCalledWith('1', 'test-student-123');
  });
});
