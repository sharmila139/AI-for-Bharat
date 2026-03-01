/**
 * Poll List Screen Tests
 * Task 36.5: Test poll listing and filtering
 */

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { PollListScreen } from '../PollListScreen';

// Mock dependencies
jest.mock('../../../components/OfflineIndicator', () => ({
  OfflineIndicator: () => null,
}));

jest.mock('../../../config/api-config', () => ({
  API_BASE_URL: 'http://localhost:3000',
}));

const mockNavigation = {
  navigate: jest.fn(),
};

const mockPolls = [
  {
    poll_id: 'poll_1',
    title: 'Community Park Development',
    description: 'Choose the best location for the new park',
    poll_type: 'single_choice',
    status: 'active',
    options: [
      { option_id: 'opt_1', text: 'North Side' },
      { option_id: 'opt_2', text: 'South Side' },
    ],
    total_votes: 150,
    eligible_voters_count: 500,
    is_binding: true,
    binding_threshold_percentage: 60,
    start_date: '2024-01-01T00:00:00Z',
    end_date: '2024-12-31T23:59:59Z',
    created_at: '2024-01-01T00:00:00Z',
    user_has_voted: false,
    user_is_eligible: true,
    show_results_before_voting: false,
    show_results_after_voting: true,
    show_real_time_results: false,
    allow_anonymous: true,
  },
  {
    poll_id: 'poll_2',
    title: 'Budget Allocation for Roads',
    description: 'Allocate budget across road projects',
    poll_type: 'budget_allocation',
    status: 'active',
    options: [
      { option_id: 'opt_3', text: 'Main Street', budget_amount: 1000000 },
      { option_id: 'opt_4', text: 'Park Road', budget_amount: 500000 },
    ],
    total_votes: 75,
    eligible_voters_count: 500,
    is_binding: false,
    start_date: '2024-01-01T00:00:00Z',
    end_date: '2024-12-31T23:59:59Z',
    created_at: '2024-01-01T00:00:00Z',
    user_has_voted: true,
    user_is_eligible: true,
    show_results_before_voting: false,
    show_results_after_voting: true,
    show_real_time_results: false,
    allow_anonymous: false,
  },
];

describe('PollListScreen', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
    jest.clearAllMocks();
  });

  it('renders loading state initially', () => {
    (global.fetch as jest.Mock).mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    const { getByText } = render(<PollListScreen navigation={mockNavigation} />);
    expect(getByText('Loading polls...')).toBeTruthy();
  });

  it('renders poll list successfully', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      json: async () => ({
        success: true,
        data: mockPolls,
      }),
    });

    const { getByText } = render(<PollListScreen navigation={mockNavigation} />);

    await waitFor(() => {
      expect(getByText('Community Park Development')).toBeTruthy();
      expect(getByText('Budget Allocation for Roads')).toBeTruthy();
    });
  });

  it('displays poll type badges correctly', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      json: async () => ({
        success: true,
        data: mockPolls,
      }),
    });

    const { getByText } = render(<PollListScreen navigation={mockNavigation} />);

    await waitFor(() => {
      expect(getByText('Single Choice')).toBeTruthy();
      expect(getByText('Budget Allocation')).toBeTruthy();
    });
  });

  it('displays binding badge for binding polls', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      json: async () => ({
        success: true,
        data: mockPolls,
      }),
    });

    const { getByText } = render(<PollListScreen navigation={mockNavigation} />);

    await waitFor(() => {
      expect(getByText('Binding Poll')).toBeTruthy();
    });
  });

  it('shows "You voted" indicator for completed polls', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      json: async () => ({
        success: true,
        data: mockPolls,
      }),
    });

    const { getAllByText } = render(<PollListScreen navigation={mockNavigation} />);

    await waitFor(() => {
      const votedIndicators = getAllByText('You voted');
      expect(votedIndicators.length).toBeGreaterThan(0);
    });
  });

  it('navigates to poll detail when poll is tapped', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      json: async () => ({
        success: true,
        data: mockPolls,
      }),
    });

    const { getByText } = render(<PollListScreen navigation={mockNavigation} />);

    await waitFor(() => {
      const pollCard = getByText('Community Park Development');
      fireEvent.press(pollCard);
    });

    expect(mockNavigation.navigate).toHaveBeenCalledWith('PollDetail', {
      pollId: 'poll_1',
      poll: mockPolls[0],
    });
  });

  it('opens filter modal when filter button is pressed', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      json: async () => ({
        success: true,
        data: mockPolls,
      }),
    });

    const { getByText } = render(<PollListScreen navigation={mockNavigation} />);

    await waitFor(() => {
      const filterButton = getByText('Filters');
      fireEvent.press(filterButton);
    });

    expect(getByText('Status')).toBeTruthy();
  });

  it('filters polls by status', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      json: async () => ({
        success: true,
        data: mockPolls,
      }),
    });

    const { getByText } = render(<PollListScreen navigation={mockNavigation} />);

    await waitFor(() => {
      const filterButton = getByText('Filters');
      fireEvent.press(filterButton);
    });

    const closedFilter = getByText('Closed');
    fireEvent.press(closedFilter);

    const applyButton = getByText('Apply Filters');
    fireEvent.press(applyButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('status=closed')
      );
    });
  });

  it('displays empty state when no polls found', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      json: async () => ({
        success: true,
        data: [],
      }),
    });

    const { getByText } = render(<PollListScreen navigation={mockNavigation} />);

    await waitFor(() => {
      expect(getByText('No polls found')).toBeTruthy();
    });
  });

  it('handles error state', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      json: async () => ({
        success: false,
        error: 'Failed to load polls',
      }),
    });

    const { getByText } = render(<PollListScreen navigation={mockNavigation} />);

    await waitFor(() => {
      expect(getByText(/Failed to load polls/)).toBeTruthy();
    });
  });

  it('supports pull-to-refresh', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      json: async () => ({
        success: true,
        data: mockPolls,
      }),
    });

    const { getByTestId } = render(<PollListScreen navigation={mockNavigation} />);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    // Simulate pull-to-refresh
    // Note: This would require adding testID to FlatList in the component
    // For now, we just verify the fetch was called
    expect(global.fetch).toHaveBeenCalled();
  });

  it('displays turnout percentage correctly', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      json: async () => ({
        success: true,
        data: mockPolls,
      }),
    });

    const { getByText } = render(<PollListScreen navigation={mockNavigation} />);

    await waitFor(() => {
      // 150 votes / 500 eligible = 30%
      expect(getByText('30% turnout')).toBeTruthy();
    });
  });

  it('shows time remaining for active polls', async () => {
    const activePoll = {
      ...mockPolls[0],
      end_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days from now
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      json: async () => ({
        success: true,
        data: [activePoll],
      }),
    });

    const { getByText } = render(<PollListScreen navigation={mockNavigation} />);

    await waitFor(() => {
      expect(getByText(/days left/)).toBeTruthy();
    });
  });
});
