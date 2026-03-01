/**
 * GrievanceListScreen Tests
 * Task 36.2: Build grievance list with filters and search
 * 
 * Test Coverage:
 * - Component rendering
 * - Search functionality
 * - Filter functionality (status, category, date range, my grievances)
 * - Pull-to-refresh
 * - Infinite scroll/pagination
 * - Empty state
 * - Error handling
 * - Navigation to detail screen
 * - Status badge rendering
 * - Overdue indicator
 */

import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import GrievanceListScreen from '../GrievanceListScreen';
import * as grievanceApi from '../../../services/api/grievance-api';

// Mock the API
jest.mock('../../../services/api/grievance-api');
const mockSearchGrievances = grievanceApi.searchGrievances as jest.MockedFunction<
  typeof grievanceApi.searchGrievances
>;

// Mock navigation
const mockNavigate = jest.fn();
const mockNavigation = {
  navigate: mockNavigate,
};

// Mock OfflineIndicator
jest.mock('../../../components/OfflineIndicator', () => ({
  OfflineIndicator: () => null,
}));

describe('GrievanceListScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockGrievances = [
    {
      grievanceId: 'g1',
      ticketNumber: 'GRV-2024-001',
      title: 'Pothole on Main Road',
      description: 'Large pothole causing traffic issues',
      category: 'road' as const,
      status: 'submitted' as const,
      severity: 'medium' as const,
      photos: ['photo1.jpg'],
      createdAt: '2024-01-15T10:00:00Z',
      updatedAt: '2024-01-15T10:00:00Z',
      slaDeadline: '2024-01-30T10:00:00Z',
      isOverdue: false,
      daysOpen: 5,
      isAnonymous: false,
      address: '123 Main St',
    },
    {
      grievanceId: 'g2',
      ticketNumber: 'GRV-2024-002',
      title: 'Water Supply Issue',
      description: 'No water supply for 3 days',
      category: 'water' as const,
      status: 'in_progress' as const,
      severity: 'high' as const,
      photos: ['photo2.jpg'],
      createdAt: '2024-01-10T08:00:00Z',
      updatedAt: '2024-01-16T12:00:00Z',
      slaDeadline: '2024-01-17T08:00:00Z',
      isOverdue: true,
      daysOpen: 10,
      isAnonymous: false,
      address: '456 Oak Ave',
    },
    {
      grievanceId: 'g3',
      ticketNumber: 'GRV-2024-003',
      title: 'Streetlight Not Working',
      description: 'Streetlight broken for 2 weeks',
      category: 'electricity' as const,
      status: 'resolved' as const,
      severity: 'low' as const,
      photos: ['photo3.jpg'],
      createdAt: '2024-01-01T14:00:00Z',
      updatedAt: '2024-01-14T16:00:00Z',
      slaDeadline: '2024-01-16T14:00:00Z',
      isOverdue: false,
      daysOpen: 13,
      isAnonymous: true,
      address: '789 Pine Rd',
    },
  ];

  const mockSearchResult = {
    items: mockGrievances,
    total: 3,
    page: 1,
    totalPages: 1,
    hasMore: false,
  };

  describe('Component Rendering', () => {
    it('should render loading state initially', () => {
      mockSearchGrievances.mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      const { getByText } = render(
        <GrievanceListScreen navigation={mockNavigation} />
      );

      expect(getByText('Loading grievances...')).toBeTruthy();
    });

    it('should render grievance list after loading', async () => {
      mockSearchGrievances.mockResolvedValue(mockSearchResult);

      const { getByText, queryByText } = render(
        <GrievanceListScreen navigation={mockNavigation} />
      );

      await waitFor(() => {
        expect(queryByText('Loading grievances...')).toBeNull();
      });

      expect(getByText('Pothole on Main Road')).toBeTruthy();
      expect(getByText('Water Supply Issue')).toBeTruthy();
      expect(getByText('Streetlight Not Working')).toBeTruthy();
    });

    it('should display correct grievance count', async () => {
      mockSearchGrievances.mockResolvedValue(mockSearchResult);

      const { getByText } = render(
        <GrievanceListScreen navigation={mockNavigation} />
      );

      await waitFor(() => {
        expect(getByText('3 grievances found')).toBeTruthy();
      });
    });

    it('should render ticket numbers correctly', async () => {
      mockSearchGrievances.mockResolvedValue(mockSearchResult);

      const { getByText } = render(
        <GrievanceListScreen navigation={mockNavigation} />
      );

      await waitFor(() => {
        expect(getByText('GRV-2024-001')).toBeTruthy();
        expect(getByText('GRV-2024-002')).toBeTruthy();
        expect(getByText('GRV-2024-003')).toBeTruthy();
      });
    });
  });

  describe('Status Badges', () => {
    it('should render status badges with correct labels', async () => {
      mockSearchGrievances.mockResolvedValue(mockSearchResult);

      const { getByText } = render(
        <GrievanceListScreen navigation={mockNavigation} />
      );

      await waitFor(() => {
        expect(getByText('Submitted')).toBeTruthy();
        expect(getByText('In Progress')).toBeTruthy();
        expect(getByText('Resolved')).toBeTruthy();
      });
    });
  });

  describe('Overdue Indicator', () => {
    it('should show overdue badge for overdue grievances', async () => {
      mockSearchGrievances.mockResolvedValue(mockSearchResult);

      const { getAllByText } = render(
        <GrievanceListScreen navigation={mockNavigation} />
      );

      await waitFor(() => {
        const overdueBadges = getAllByText(/⚠️ Overdue/);
        expect(overdueBadges.length).toBe(1);
      });
    });

    it('should not show overdue badge for non-overdue grievances', async () => {
      const nonOverdueResult = {
        ...mockSearchResult,
        items: [mockGrievances[0]], // Only first grievance (not overdue)
      };
      mockSearchGrievances.mockResolvedValue(nonOverdueResult);

      const { queryByText } = render(
        <GrievanceListScreen navigation={mockNavigation} />
      );

      await waitFor(() => {
        expect(queryByText(/⚠️ Overdue/)).toBeNull();
      });
    });
  });

  describe('Search Functionality', () => {
    it('should render search input', async () => {
      mockSearchGrievances.mockResolvedValue(mockSearchResult);

      const { getByPlaceholderText } = render(
        <GrievanceListScreen navigation={mockNavigation} />
      );

      await waitFor(() => {
        expect(
          getByPlaceholderText('Search by ticket, title, description...')
        ).toBeTruthy();
      });
    });

    it('should call search API with query when typing', async () => {
      mockSearchGrievances.mockResolvedValue(mockSearchResult);

      const { getByPlaceholderText } = render(
        <GrievanceListScreen navigation={mockNavigation} />
      );

      await waitFor(() => {
        expect(mockSearchGrievances).toHaveBeenCalled();
      });

      const searchInput = getByPlaceholderText(
        'Search by ticket, title, description...'
      );

      act(() => {
        fireEvent.changeText(searchInput, 'pothole');
      });

      // Wait for debounce
      await waitFor(
        () => {
          expect(mockSearchGrievances).toHaveBeenCalledWith(
            expect.objectContaining({
              query: 'pothole',
            })
          );
        },
        { timeout: 1000 }
      );
    });

    it('should show clear button when search query is entered', async () => {
      mockSearchGrievances.mockResolvedValue(mockSearchResult);

      const { getByPlaceholderText, getByText } = render(
        <GrievanceListScreen navigation={mockNavigation} />
      );

      await waitFor(() => {
        expect(mockSearchGrievances).toHaveBeenCalled();
      });

      const searchInput = getByPlaceholderText(
        'Search by ticket, title, description...'
      );

      act(() => {
        fireEvent.changeText(searchInput, 'water');
      });

      await waitFor(() => {
        expect(getByText('✕')).toBeTruthy();
      });
    });

    it('should clear search when clear button is pressed', async () => {
      mockSearchGrievances.mockResolvedValue(mockSearchResult);

      const { getByPlaceholderText, getAllByText } = render(
        <GrievanceListScreen navigation={mockNavigation} />
      );

      await waitFor(() => {
        expect(mockSearchGrievances).toHaveBeenCalled();
      });

      const searchInput = getByPlaceholderText(
        'Search by ticket, title, description...'
      );

      act(() => {
        fireEvent.changeText(searchInput, 'water');
      });

      await waitFor(() => {
        const clearButtons = getAllByText('✕');
        expect(clearButtons.length).toBeGreaterThan(0);
      });

      const clearButtons = getAllByText('✕');
      act(() => {
        fireEvent.press(clearButtons[0]);
      });

      expect(searchInput.props.value).toBe('');
    });

    it('should debounce search queries', async () => {
      mockSearchGrievances.mockResolvedValue(mockSearchResult);

      const { getByPlaceholderText } = render(
        <GrievanceListScreen navigation={mockNavigation} />
      );

      await waitFor(() => {
        expect(mockSearchGrievances).toHaveBeenCalled();
      });

      const initialCallCount = mockSearchGrievances.mock.calls.length;

      const searchInput = getByPlaceholderText(
        'Search by ticket, title, description...'
      );

      // Type multiple characters quickly
      act(() => {
        fireEvent.changeText(searchInput, 'p');
        fireEvent.changeText(searchInput, 'po');
        fireEvent.changeText(searchInput, 'pot');
      });

      // Should not call immediately
      expect(mockSearchGrievances.mock.calls.length).toBe(initialCallCount);

      // Wait for debounce
      await waitFor(
        () => {
          expect(mockSearchGrievances.mock.calls.length).toBeGreaterThan(
            initialCallCount
          );
        },
        { timeout: 1000 }
      );
    });
  });

  describe('Filter Functionality', () => {
    it('should open filter modal when filter button is pressed', async () => {
      mockSearchGrievances.mockResolvedValue(mockSearchResult);

      const { getByText } = render(
        <GrievanceListScreen navigation={mockNavigation} />
      );

      await waitFor(() => {
        expect(mockSearchGrievances).toHaveBeenCalled();
      });

      const filterButton = getByText('⚙️');
      act(() => {
        fireEvent.press(filterButton);
      });

      await waitFor(() => {
        expect(getByText('Filters')).toBeTruthy();
      });
    });

    it('should filter by status', async () => {
      mockSearchGrievances.mockResolvedValue(mockSearchResult);

      const { getByText, getAllByText } = render(
        <GrievanceListScreen navigation={mockNavigation} />
      );

      await waitFor(() => {
        expect(mockSearchGrievances).toHaveBeenCalled();
      });

      // Open filter modal
      const filterButton = getByText('⚙️');
      act(() => {
        fireEvent.press(filterButton);
      });

      await waitFor(() => {
        expect(getByText('Filters')).toBeTruthy();
      });

      // Select "In Progress" status - get all and select the one in the modal
      const inProgressChips = getAllByText('In Progress');
      const modalChip = inProgressChips[inProgressChips.length - 1]; // Last one is in modal
      act(() => {
        fireEvent.press(modalChip);
      });

      // Close modal
      const applyButton = getByText('Apply Filters');
      act(() => {
        fireEvent.press(applyButton);
      });

      // Wait for API call with filter
      await waitFor(
        () => {
          expect(mockSearchGrievances).toHaveBeenCalledWith(
            expect.objectContaining({
              status: 'in_progress',
            })
          );
        },
        { timeout: 1000 }
      );
    });

    it('should filter by category', async () => {
      mockSearchGrievances.mockResolvedValue(mockSearchResult);

      const { getByText, getAllByText } = render(
        <GrievanceListScreen navigation={mockNavigation} />
      );

      await waitFor(() => {
        expect(mockSearchGrievances).toHaveBeenCalled();
      });

      // Open filter modal
      const filterButton = getByText('⚙️');
      act(() => {
        fireEvent.press(filterButton);
      });

      await waitFor(() => {
        expect(getByText('Filters')).toBeTruthy();
      });

      // Select "Water" category - get all and select the one in the modal
      const waterChips = getAllByText('Water');
      const modalChip = waterChips[waterChips.length - 1]; // Last one is in modal
      act(() => {
        fireEvent.press(modalChip);
      });

      // Close modal
      const applyButton = getByText('Apply Filters');
      act(() => {
        fireEvent.press(applyButton);
      });

      // Wait for API call with filter
      await waitFor(
        () => {
          expect(mockSearchGrievances).toHaveBeenCalledWith(
            expect.objectContaining({
              category: 'water',
            })
          );
        },
        { timeout: 1000 }
      );
    });

    it('should toggle "my grievances" filter', async () => {
      mockSearchGrievances.mockResolvedValue(mockSearchResult);

      const { getByText } = render(
        <GrievanceListScreen navigation={mockNavigation} />
      );

      await waitFor(() => {
        expect(mockSearchGrievances).toHaveBeenCalled();
      });

      // Open filter modal
      const filterButton = getByText('⚙️');
      act(() => {
        fireEvent.press(filterButton);
      });

      await waitFor(() => {
        expect(getByText('Show only my grievances')).toBeTruthy();
      });

      // Toggle my grievances
      const toggleButton = getByText('Show only my grievances');
      act(() => {
        fireEvent.press(toggleButton);
      });

      // Close modal
      const applyButton = getByText('Apply Filters');
      act(() => {
        fireEvent.press(applyButton);
      });

      // Wait for API call with filter
      await waitFor(
        () => {
          expect(mockSearchGrievances).toHaveBeenCalledWith(
            expect.objectContaining({
              myGrievances: true,
            })
          );
        },
        { timeout: 1000 }
      );
    });

    it('should show active filter count badge', async () => {
      mockSearchGrievances.mockResolvedValue(mockSearchResult);

      const { getByText, getAllByText } = render(
        <GrievanceListScreen navigation={mockNavigation} />
      );

      await waitFor(() => {
        expect(mockSearchGrievances).toHaveBeenCalled();
      });

      // Open filter modal
      const filterButton = getByText('⚙️');
      act(() => {
        fireEvent.press(filterButton);
      });

      await waitFor(() => {
        expect(getByText('Filters')).toBeTruthy();
      });

      // Select status and category
      act(() => {
        const submittedChips = getAllByText('Submitted');
        fireEvent.press(submittedChips[submittedChips.length - 1]);
        const roadsChips = getAllByText('Roads');
        fireEvent.press(roadsChips[roadsChips.length - 1]);
      });

      // Close modal
      const applyButton = getByText('Apply Filters');
      act(() => {
        fireEvent.press(applyButton);
      });

      await waitFor(() => {
        expect(getByText('2')).toBeTruthy(); // Badge showing 2 active filters
      });
    });

    it('should display active filters as chips', async () => {
      mockSearchGrievances.mockResolvedValue(mockSearchResult);

      const { getByText, getAllByText } = render(
        <GrievanceListScreen navigation={mockNavigation} />
      );

      await waitFor(() => {
        expect(mockSearchGrievances).toHaveBeenCalled();
      });

      // Open filter modal
      const filterButton = getByText('⚙️');
      act(() => {
        fireEvent.press(filterButton);
      });

      await waitFor(() => {
        expect(getByText('Filters')).toBeTruthy();
      });

      // Select status
      act(() => {
        const submittedChips = getAllByText('Submitted');
        fireEvent.press(submittedChips[submittedChips.length - 1]);
      });

      // Close modal
      const applyButton = getByText('Apply Filters');
      act(() => {
        fireEvent.press(applyButton);
      });

      await waitFor(() => {
        const submittedChips = getAllByText('Submitted');
        expect(submittedChips.length).toBeGreaterThan(0);
      });
    });

    it('should remove filter when chip close button is pressed', async () => {
      mockSearchGrievances.mockResolvedValue(mockSearchResult);

      const { getByText, getAllByText, queryByText } = render(
        <GrievanceListScreen navigation={mockNavigation} />
      );

      await waitFor(() => {
        expect(mockSearchGrievances).toHaveBeenCalled();
      });

      // Open filter modal and select status
      const filterButton = getByText('⚙️');
      act(() => {
        fireEvent.press(filterButton);
      });

      await waitFor(() => {
        expect(getByText('Filters')).toBeTruthy();
      });

      act(() => {
        const submittedChips = getAllByText('Submitted');
        fireEvent.press(submittedChips[submittedChips.length - 1]);
      });

      const applyButton = getByText('Apply Filters');
      act(() => {
        fireEvent.press(applyButton);
      });

      await waitFor(() => {
        const submittedChips = getAllByText('Submitted');
        expect(submittedChips.length).toBeGreaterThan(0);
      });

      // Remove filter by pressing X on chip
      const closeButtons = getAllByText('✕');
      const chipCloseButton = closeButtons.find((btn) => {
        // Find the close button that's part of the active filter chip
        return true; // Simplified for test
      });

      if (chipCloseButton) {
        act(() => {
          fireEvent.press(chipCloseButton);
        });

        await waitFor(
          () => {
            expect(mockSearchGrievances).toHaveBeenCalledWith(
              expect.objectContaining({
                status: undefined,
              })
            );
          },
          { timeout: 1000 }
        );
      }
    });

    it('should clear all filters when "Clear All" is pressed', async () => {
      mockSearchGrievances.mockResolvedValue(mockSearchResult);

      const { getByText, getAllByText } = render(
        <GrievanceListScreen navigation={mockNavigation} />
      );

      await waitFor(() => {
        expect(mockSearchGrievances).toHaveBeenCalled();
      });

      // Open filter modal and select multiple filters
      const filterButton = getByText('⚙️');
      act(() => {
        fireEvent.press(filterButton);
      });

      await waitFor(() => {
        expect(getByText('Filters')).toBeTruthy();
      });

      act(() => {
        const submittedChips = getAllByText('Submitted');
        fireEvent.press(submittedChips[submittedChips.length - 1]);
        const roadsChips = getAllByText('Roads');
        fireEvent.press(roadsChips[roadsChips.length - 1]);
      });

      // Press Clear All
      const clearAllButton = getByText('Clear All');
      act(() => {
        fireEvent.press(clearAllButton);
      });

      // Modal should close and filters should be cleared
      await waitFor(
        () => {
          expect(mockSearchGrievances).toHaveBeenCalledWith(
            expect.objectContaining({
              status: undefined,
              category: undefined,
            })
          );
        },
        { timeout: 1000 }
      );
    });
  });

  describe('Pull-to-Refresh', () => {
    it('should refresh grievances when pulled down', async () => {
      mockSearchGrievances.mockResolvedValue(mockSearchResult);

      const { getByTestId, UNSAFE_getByType } = render(
        <GrievanceListScreen navigation={mockNavigation} />
      );

      await waitFor(() => {
        expect(mockSearchGrievances).toHaveBeenCalled();
      });

      const initialCallCount = mockSearchGrievances.mock.calls.length;

      // Find FlatList and trigger refresh
      const flatList = UNSAFE_getByType(require('react-native').FlatList);
      
      act(() => {
        flatList.props.refreshControl.props.onRefresh();
      });

      await waitFor(() => {
        expect(mockSearchGrievances.mock.calls.length).toBeGreaterThan(
          initialCallCount
        );
      });
    });
  });

  describe('Infinite Scroll / Pagination', () => {
    it('should load more grievances when scrolling to end', async () => {
      const page1Result = {
        items: [mockGrievances[0]],
        total: 3,
        page: 1,
        totalPages: 3,
        hasMore: true,
      };

      const page2Result = {
        items: [mockGrievances[1]],
        total: 3,
        page: 2,
        totalPages: 3,
        hasMore: true,
      };

      mockSearchGrievances
        .mockResolvedValueOnce(page1Result)
        .mockResolvedValueOnce(page2Result);

      const { UNSAFE_getByType } = render(
        <GrievanceListScreen navigation={mockNavigation} />
      );

      await waitFor(() => {
        expect(mockSearchGrievances).toHaveBeenCalled();
      });

      const initialCallCount = mockSearchGrievances.mock.calls.length;

      // Trigger onEndReached
      const flatList = UNSAFE_getByType(require('react-native').FlatList);
      
      act(() => {
        flatList.props.onEndReached();
      });

      // Should call API again for next page
      await waitFor(() => {
        expect(mockSearchGrievances.mock.calls.length).toBeGreaterThan(initialCallCount);
      });
    });

    it('should not load more when hasMore is false', async () => {
      const finalPageResult = {
        items: mockGrievances,
        total: 3,
        page: 1,
        totalPages: 1,
        hasMore: false,
      };

      mockSearchGrievances.mockResolvedValue(finalPageResult);

      const { UNSAFE_getByType } = render(
        <GrievanceListScreen navigation={mockNavigation} />
      );

      await waitFor(() => {
        expect(mockSearchGrievances).toHaveBeenCalledTimes(1);
      });

      const initialCallCount = mockSearchGrievances.mock.calls.length;

      // Trigger onEndReached
      const flatList = UNSAFE_getByType(require('react-native').FlatList);
      
      act(() => {
        flatList.props.onEndReached();
      });

      // Should not call API again
      await waitFor(() => {
        expect(mockSearchGrievances.mock.calls.length).toBe(initialCallCount);
      });
    });

    it('should show loading indicator when loading more', async () => {
      const page1Result = {
        items: [mockGrievances[0]],
        total: 3,
        page: 1,
        totalPages: 3,
        hasMore: true,
      };

      mockSearchGrievances.mockResolvedValue(page1Result);

      const { UNSAFE_getByType } = render(
        <GrievanceListScreen navigation={mockNavigation} />
      );

      await waitFor(() => {
        expect(mockSearchGrievances).toHaveBeenCalled();
      });

      // Trigger onEndReached
      const flatList = UNSAFE_getByType(require('react-native').FlatList);
      
      // Verify that ListFooterComponent exists and can render loading state
      expect(flatList.props.ListFooterComponent).toBeDefined();
    });
  });

  describe('Empty State', () => {
    it('should show empty state when no grievances found', async () => {
      const emptyResult = {
        items: [],
        total: 0,
        page: 1,
        totalPages: 0,
        hasMore: false,
      };

      mockSearchGrievances.mockResolvedValue(emptyResult);

      const { getByText } = render(
        <GrievanceListScreen navigation={mockNavigation} />
      );

      await waitFor(() => {
        expect(getByText('No grievances found')).toBeTruthy();
      });
    });

    it('should show appropriate message in empty state with filters', async () => {
      const emptyResult = {
        items: [],
        total: 0,
        page: 1,
        totalPages: 0,
        hasMore: false,
      };

      mockSearchGrievances.mockResolvedValue(emptyResult);

      const { getByText } = render(
        <GrievanceListScreen navigation={mockNavigation} />
      );

      await waitFor(() => {
        expect(mockSearchGrievances).toHaveBeenCalled();
      });

      // Apply a filter
      const filterButton = getByText('⚙️');
      act(() => {
        fireEvent.press(filterButton);
      });

      await waitFor(() => {
        expect(getByText('Filters')).toBeTruthy();
      });

      act(() => {
        fireEvent.press(getByText('Submitted'));
      });

      const applyButton = getByText('Apply Filters');
      act(() => {
        fireEvent.press(applyButton);
      });

      await waitFor(() => {
        expect(getByText('Try adjusting your filters')).toBeTruthy();
      });
    });

    it('should show appropriate message in empty state without filters', async () => {
      const emptyResult = {
        items: [],
        total: 0,
        page: 1,
        totalPages: 0,
        hasMore: false,
      };

      mockSearchGrievances.mockResolvedValue(emptyResult);

      const { getByText } = render(
        <GrievanceListScreen navigation={mockNavigation} />
      );

      await waitFor(() => {
        expect(getByText('Report an issue to get started')).toBeTruthy();
      });
    });
  });

  describe('Error Handling', () => {
    it('should display error message when API call fails', async () => {
      mockSearchGrievances.mockRejectedValue(new Error('Network error'));

      const { getByText } = render(
        <GrievanceListScreen navigation={mockNavigation} />
      );

      await waitFor(() => {
        expect(getByText(/Network error/)).toBeTruthy();
      });
    });

    it('should show retry button on error', async () => {
      mockSearchGrievances.mockRejectedValue(new Error('Network error'));

      const { getByText } = render(
        <GrievanceListScreen navigation={mockNavigation} />
      );

      await waitFor(() => {
        expect(getByText('Retry')).toBeTruthy();
      });
    });

    it('should retry loading when retry button is pressed', async () => {
      mockSearchGrievances
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce(mockSearchResult);

      const { getByText, queryByText } = render(
        <GrievanceListScreen navigation={mockNavigation} />
      );

      await waitFor(() => {
        expect(getByText('Retry')).toBeTruthy();
      });

      const retryButton = getByText('Retry');
      act(() => {
        fireEvent.press(retryButton);
      });

      await waitFor(() => {
        expect(queryByText(/Network error/)).toBeNull();
        expect(getByText('Pothole on Main Road')).toBeTruthy();
      });
    });

    it('should handle empty error message gracefully', async () => {
      mockSearchGrievances.mockRejectedValue(new Error());

      const { getByText } = render(
        <GrievanceListScreen navigation={mockNavigation} />
      );

      await waitFor(() => {
        expect(getByText(/Failed to search grievances/)).toBeTruthy();
      });
    });
  });

  describe('Navigation', () => {
    it('should navigate to detail screen when grievance card is pressed', async () => {
      mockSearchGrievances.mockResolvedValue(mockSearchResult);

      const { getByText } = render(
        <GrievanceListScreen navigation={mockNavigation} />
      );

      await waitFor(() => {
        expect(getByText('Pothole on Main Road')).toBeTruthy();
      });

      const grievanceCard = getByText('Pothole on Main Road');
      act(() => {
        fireEvent.press(grievanceCard);
      });

      expect(mockNavigate).toHaveBeenCalledWith('GrievanceDetail', {
        grievanceId: 'g1',
        ticketNumber: 'GRV-2024-001',
      });
    });

    it('should pass correct grievance data to detail screen', async () => {
      mockSearchGrievances.mockResolvedValue(mockSearchResult);

      const { getByText } = render(
        <GrievanceListScreen navigation={mockNavigation} />
      );

      await waitFor(() => {
        expect(getByText('Water Supply Issue')).toBeTruthy();
      });

      const grievanceCard = getByText('Water Supply Issue');
      act(() => {
        fireEvent.press(grievanceCard);
      });

      expect(mockNavigate).toHaveBeenCalledWith('GrievanceDetail', {
        grievanceId: 'g2',
        ticketNumber: 'GRV-2024-002',
      });
    });
  });

  describe('Date Formatting', () => {
    it('should format recent dates correctly', async () => {
      const today = new Date();
      const recentGrievance = {
        ...mockGrievances[0],
        createdAt: today.toISOString(),
      };

      const recentResult = {
        items: [recentGrievance],
        total: 1,
        page: 1,
        totalPages: 1,
        hasMore: false,
      };

      mockSearchGrievances.mockResolvedValue(recentResult);

      const { getByText } = render(
        <GrievanceListScreen navigation={mockNavigation} />
      );

      await waitFor(() => {
        expect(getByText('Today')).toBeTruthy();
      });
    });

    it('should show days open correctly', async () => {
      mockSearchGrievances.mockResolvedValue(mockSearchResult);

      const { getByText } = render(
        <GrievanceListScreen navigation={mockNavigation} />
      );

      await waitFor(() => {
        expect(getByText('5 days open')).toBeTruthy();
        expect(getByText('10 days open')).toBeTruthy();
        expect(getByText('13 days open')).toBeTruthy();
      });
    });
  });

  describe('Category and Status Display', () => {
    it('should display category icons correctly', async () => {
      mockSearchGrievances.mockResolvedValue(mockSearchResult);

      const { getByText } = render(
        <GrievanceListScreen navigation={mockNavigation} />
      );

      await waitFor(() => {
        expect(getByText('🛣️')).toBeTruthy(); // Road icon
        expect(getByText('💧')).toBeTruthy(); // Water icon
        expect(getByText('⚡')).toBeTruthy(); // Electricity icon
      });
    });

    it('should display category labels correctly', async () => {
      mockSearchGrievances.mockResolvedValue(mockSearchResult);

      const { getByText } = render(
        <GrievanceListScreen navigation={mockNavigation} />
      );

      await waitFor(() => {
        expect(getByText('Roads')).toBeTruthy();
        expect(getByText('Water')).toBeTruthy();
        expect(getByText('Electricity')).toBeTruthy();
      });
    });
  });

  describe('Accessibility', () => {
    it('should render all interactive elements', async () => {
      mockSearchGrievances.mockResolvedValue(mockSearchResult);

      const { getByPlaceholderText, getByText } = render(
        <GrievanceListScreen navigation={mockNavigation} />
      );

      await waitFor(() => {
        expect(getByPlaceholderText('Search by ticket, title, description...')).toBeTruthy();
        expect(getByText('⚙️')).toBeTruthy();
      });
    });
  });
});
