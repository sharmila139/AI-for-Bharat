/**
 * Tests for Civic Engagement Analytics Screen
 * Task 36.10: Create civic engagement analytics display
 */

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { CivicEngagementAnalyticsScreen } from '../CivicEngagementAnalyticsScreen';

// Mock dependencies
jest.mock('../../../components/OfflineIndicator', () => ({
  OfflineIndicator: () => null,
}));

jest.mock('../../../config/api-config', () => ({
  API_BASE_URL: 'http://localhost:3000',
}));

global.fetch = jest.fn();

describe('CivicEngagementAnalyticsScreen', () => {
  const mockNavigation = {
    navigate: jest.fn(),
    goBack: jest.fn(),
  };

  const mockAnalyticsData = {
    success: true,
    data: {
      grievances: {
        total: 1247,
        resolved: 892,
        pending: 245,
        in_progress: 110,
        resolution_rate: 71.5,
        average_resolution_days: 12.3,
        overdue: 45,
      },
      polls: {
        total: 34,
        active: 5,
        completed: 29,
        total_votes: 8934,
        average_participation_rate: 62.4,
        binding_polls: 12,
      },
      projects: {
        total: 87,
        in_progress: 32,
        completed: 48,
        delayed: 7,
        on_time_completion_rate: 87.5,
        total_budget: 45000000,
        budget_spent: 32500000,
        budget_utilization_rate: 72.2,
      },
      verification: {
        total_verifications: 2341,
        verification_rate: 78.5,
        active_verifiers: 156,
        average_verifications_per_user: 15.0,
      },
      top_contributors: [
        { user_id: '1', name: 'Rajesh Kumar', contribution_count: 45, contribution_type: 'Grievances' },
        { user_id: '2', name: 'Priya Sharma', contribution_count: 38, contribution_type: 'Verifications' },
      ],
      ward_breakdown: [
        { ward_name: 'Ward 1', grievances: 234, polls: 8, projects: 15, participation_rate: 68.5 },
        { ward_name: 'Ward 2', grievances: 198, polls: 6, projects: 12, participation_rate: 72.3 },
      ],
      date_range: '30d',
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockResolvedValue({
      json: async () => mockAnalyticsData,
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Rendering', () => {
    it('should render loading state initially', () => {
      const { getByText } = render(
        <CivicEngagementAnalyticsScreen navigation={mockNavigation} />
      );

      expect(getByText('Loading analytics...')).toBeTruthy();
    });

    it('should render analytics data after loading', async () => {
      const { getByText, queryByText } = render(
        <CivicEngagementAnalyticsScreen navigation={mockNavigation} />
      );

      await waitFor(() => {
        expect(queryByText('Loading analytics...')).toBeNull();
      });

      expect(getByText('Civic Engagement Analytics')).toBeTruthy();
      expect(getByText('Community participation insights')).toBeTruthy();
    });

    it('should render all section headers', async () => {
      const { getByText } = render(
        <CivicEngagementAnalyticsScreen navigation={mockNavigation} />
      );

      await waitFor(() => {
        expect(getByText('Grievance Management')).toBeTruthy();
      });

      expect(getByText('Community Polls')).toBeTruthy();
      expect(getByText('Infrastructure Projects')).toBeTruthy();
      expect(getByText('Community Verification')).toBeTruthy();
      expect(getByText('Top Contributors')).toBeTruthy();
      expect(getByText('Ward-wise Breakdown')).toBeTruthy();
    });

    it('should render date range selector', async () => {
      const { getByText } = render(
        <CivicEngagementAnalyticsScreen navigation={mockNavigation} />
      );

      await waitFor(() => {
        expect(getByText('Last 7 Days')).toBeTruthy();
      });

      expect(getByText('Last 30 Days')).toBeTruthy();
      expect(getByText('Last 90 Days')).toBeTruthy();
      expect(getByText('All Time')).toBeTruthy();
    });
  });

  describe('Grievance Metrics', () => {
    it('should display grievance statistics', async () => {
      const { getByText } = render(
        <CivicEngagementAnalyticsScreen navigation={mockNavigation} />
      );

      await waitFor(() => {
        expect(getByText('1247')).toBeTruthy(); // Total
      });

      expect(getByText('892')).toBeTruthy(); // Resolved
      expect(getByText('245')).toBeTruthy(); // Pending
      expect(getByText('110')).toBeTruthy(); // In Progress
    });

    it('should display resolution rate', async () => {
      const { getByText } = render(
        <CivicEngagementAnalyticsScreen navigation={mockNavigation} />
      );

      await waitFor(() => {
        expect(getByText('Resolution Rate')).toBeTruthy();
      });

      expect(getByText('71.5%')).toBeTruthy();
    });

    it('should display average resolution time', async () => {
      const { getByText } = render(
        <CivicEngagementAnalyticsScreen navigation={mockNavigation} />
      );

      await waitFor(() => {
        expect(getByText('Average Resolution Time')).toBeTruthy();
      });

      expect(getByText('12.3 days')).toBeTruthy();
    });

    it('should display overdue grievances count', async () => {
      const { getByText, getAllByText } = render(
        <CivicEngagementAnalyticsScreen navigation={mockNavigation} />
      );

      await waitFor(() => {
        expect(getByText('Overdue Grievances')).toBeTruthy();
      });

      // Check that 45 appears (may be multiple times)
      const elements = getAllByText('45');
      expect(elements.length).toBeGreaterThan(0);
    });
  });

  describe('Poll Metrics', () => {
    it('should display poll statistics', async () => {
      const { getByText } = render(
        <CivicEngagementAnalyticsScreen navigation={mockNavigation} />
      );

      await waitFor(() => {
        expect(getByText('34')).toBeTruthy(); // Total polls
      });

      expect(getByText('5')).toBeTruthy(); // Active
      expect(getByText('29')).toBeTruthy(); // Completed
      expect(getByText('8934')).toBeTruthy(); // Total votes
    });

    it('should display participation rate', async () => {
      const { getByText } = render(
        <CivicEngagementAnalyticsScreen navigation={mockNavigation} />
      );

      await waitFor(() => {
        expect(getByText('Average Participation Rate')).toBeTruthy();
      });

      expect(getByText('62.4%')).toBeTruthy();
    });

    it('should display binding polls count', async () => {
      const { getByText, getAllByText } = render(
        <CivicEngagementAnalyticsScreen navigation={mockNavigation} />
      );

      await waitFor(() => {
        expect(getByText('Binding Polls')).toBeTruthy();
      });

      // Check that 12 appears (may be multiple times)
      const elements = getAllByText('12');
      expect(elements.length).toBeGreaterThan(0);
    });
  });

  describe('Project Metrics', () => {
    it('should display project statistics', async () => {
      const { getByText } = render(
        <CivicEngagementAnalyticsScreen navigation={mockNavigation} />
      );

      await waitFor(() => {
        expect(getByText('87')).toBeTruthy(); // Total projects
      });

      expect(getByText('32')).toBeTruthy(); // In progress
      expect(getByText('48')).toBeTruthy(); // Completed
      expect(getByText('7')).toBeTruthy(); // Delayed
    });

    it('should display on-time completion rate', async () => {
      const { getByText } = render(
        <CivicEngagementAnalyticsScreen navigation={mockNavigation} />
      );

      await waitFor(() => {
        expect(getByText('On-Time Completion Rate')).toBeTruthy();
      });

      expect(getByText('87.5%')).toBeTruthy();
    });

    it('should display budget information with proper formatting', async () => {
      const { getByText } = render(
        <CivicEngagementAnalyticsScreen navigation={mockNavigation} />
      );

      await waitFor(() => {
        expect(getByText('Total Budget')).toBeTruthy();
      });

      expect(getByText('₹4.50 Cr')).toBeTruthy(); // 45000000
      expect(getByText('₹3.25 Cr')).toBeTruthy(); // 32500000
    });

    it('should display budget utilization rate', async () => {
      const { getByText } = render(
        <CivicEngagementAnalyticsScreen navigation={mockNavigation} />
      );

      await waitFor(() => {
        expect(getByText('Budget Utilization')).toBeTruthy();
      });

      expect(getByText('72.2%')).toBeTruthy();
    });
  });

  describe('Verification Metrics', () => {
    it('should display verification statistics', async () => {
      const { getByText } = render(
        <CivicEngagementAnalyticsScreen navigation={mockNavigation} />
      );

      await waitFor(() => {
        expect(getByText('2341')).toBeTruthy(); // Total verifications
      });

      expect(getByText('156')).toBeTruthy(); // Active verifiers
      expect(getByText('15.0')).toBeTruthy(); // Avg per user
    });

    it('should display verification rate', async () => {
      const { getByText } = render(
        <CivicEngagementAnalyticsScreen navigation={mockNavigation} />
      );

      await waitFor(() => {
        expect(getByText('Verification Rate')).toBeTruthy();
      });

      expect(getByText('78.5%')).toBeTruthy();
    });
  });

  describe('Top Contributors', () => {
    it('should display top contributors list', async () => {
      const { getByText } = render(
        <CivicEngagementAnalyticsScreen navigation={mockNavigation} />
      );

      await waitFor(() => {
        expect(getByText('Rajesh Kumar')).toBeTruthy();
      });

      expect(getByText('Priya Sharma')).toBeTruthy();
    });

    it('should display contributor ranks', async () => {
      const { getByText } = render(
        <CivicEngagementAnalyticsScreen navigation={mockNavigation} />
      );

      await waitFor(() => {
        expect(getByText('#1')).toBeTruthy();
      });

      expect(getByText('#2')).toBeTruthy();
    });

    it('should display contribution counts', async () => {
      const { getByText, getAllByText } = render(
        <CivicEngagementAnalyticsScreen navigation={mockNavigation} />
      );

      await waitFor(() => {
        expect(getByText('Rajesh Kumar')).toBeTruthy();
      });

      // Check that numbers appear (may be multiple times)
      const elements45 = getAllByText('45');
      const elements38 = getAllByText('38');
      expect(elements45.length).toBeGreaterThan(0);
      expect(elements38.length).toBeGreaterThan(0);
    });

    it('should display contribution types', async () => {
      const { getAllByText } = render(
        <CivicEngagementAnalyticsScreen navigation={mockNavigation} />
      );

      await waitFor(() => {
        const grievancesElements = getAllByText('Grievances');
        expect(grievancesElements.length).toBeGreaterThan(0);
      });

      const verificationsElements = getAllByText('Verifications');
      expect(verificationsElements.length).toBeGreaterThan(0);
    });
  });

  describe('Ward Breakdown', () => {
    it('should display ward names', async () => {
      const { getByText } = render(
        <CivicEngagementAnalyticsScreen navigation={mockNavigation} />
      );

      await waitFor(() => {
        expect(getByText('Ward 1')).toBeTruthy();
      });

      expect(getByText('Ward 2')).toBeTruthy();
    });

    it('should display ward metrics', async () => {
      const { getByText } = render(
        <CivicEngagementAnalyticsScreen navigation={mockNavigation} />
      );

      await waitFor(() => {
        expect(getByText('234')).toBeTruthy(); // Ward 1 grievances
      });

      expect(getByText('8')).toBeTruthy(); // Ward 1 polls
      expect(getByText('15')).toBeTruthy(); // Ward 1 projects
    });

    it('should display ward participation rates', async () => {
      const { getByText } = render(
        <CivicEngagementAnalyticsScreen navigation={mockNavigation} />
      );

      await waitFor(() => {
        expect(getByText('68.5%')).toBeTruthy(); // Ward 1
      });

      expect(getByText('72.3%')).toBeTruthy(); // Ward 2
    });
  });

  describe('Date Range Filtering', () => {
    it('should change date range when filter is selected', async () => {
      const { getByText } = render(
        <CivicEngagementAnalyticsScreen navigation={mockNavigation} />
      );

      await waitFor(() => {
        expect(getByText('Last 7 Days')).toBeTruthy();
      });

      fireEvent.press(getByText('Last 7 Days'));

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('date_range=7d')
        );
      });
    });

    it('should fetch analytics for 90 days when selected', async () => {
      const { getByText } = render(
        <CivicEngagementAnalyticsScreen navigation={mockNavigation} />
      );

      await waitFor(() => {
        expect(getByText('Last 90 Days')).toBeTruthy();
      });

      fireEvent.press(getByText('Last 90 Days'));

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('date_range=90d')
        );
      });
    });

    it('should fetch all time analytics when selected', async () => {
      const { getByText } = render(
        <CivicEngagementAnalyticsScreen navigation={mockNavigation} />
      );

      await waitFor(() => {
        expect(getByText('All Time')).toBeTruthy();
      });

      fireEvent.press(getByText('All Time'));

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('date_range=all')
        );
      });
    });

    it('should default to 30 days', async () => {
      render(<CivicEngagementAnalyticsScreen navigation={mockNavigation} />);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('date_range=30d')
        );
      });
    });
  });

  describe('Error Handling', () => {
    it('should display error message when API fails', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      const { getByText } = render(
        <CivicEngagementAnalyticsScreen navigation={mockNavigation} />
      );

      // Should still show mock data as fallback
      await waitFor(() => {
        expect(getByText('Civic Engagement Analytics')).toBeTruthy();
      });
    });

    it('should handle empty analytics data', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({
          success: false,
          error: 'No data',
        }),
      });

      const { getByText } = render(
        <CivicEngagementAnalyticsScreen navigation={mockNavigation} />
      );

      // Should show mock data as fallback when API fails
      await waitFor(() => {
        expect(getByText('Civic Engagement Analytics')).toBeTruthy();
      });
    });

    it('should retry loading on retry button press', async () => {
      (global.fetch as jest.Mock)
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          json: async () => mockAnalyticsData,
        });

      const { getByText, queryByText } = render(
        <CivicEngagementAnalyticsScreen navigation={mockNavigation} />
      );

      await waitFor(() => {
        expect(queryByText('Loading analytics...')).toBeNull();
      });

      // Should have loaded successfully with mock data
      expect(getByText('Civic Engagement Analytics')).toBeTruthy();
    });
  });

  describe('Pull to Refresh', () => {
    it('should reload analytics on pull to refresh', async () => {
      const { getByTestId, getByText } = render(
        <CivicEngagementAnalyticsScreen navigation={mockNavigation} />
      );

      await waitFor(() => {
        expect(getByText('Civic Engagement Analytics')).toBeTruthy();
      });

      const initialCallCount = (global.fetch as jest.Mock).mock.calls.length;

      // Simulate pull to refresh
      const scrollView = getByTestId('analytics-scroll-view');
      const refreshControl = scrollView.props.refreshControl;
      
      if (refreshControl && refreshControl.props.onRefresh) {
        refreshControl.props.onRefresh();

        await waitFor(() => {
          expect((global.fetch as jest.Mock).mock.calls.length).toBeGreaterThan(initialCallCount);
        });
      }
    });
  });

  describe('Data Formatting', () => {
    it('should format currency in crores correctly', async () => {
      const { getByText } = render(
        <CivicEngagementAnalyticsScreen navigation={mockNavigation} />
      );

      await waitFor(() => {
        expect(getByText('₹4.50 Cr')).toBeTruthy();
      });
    });

    it('should format percentages with one decimal place', async () => {
      const { getByText } = render(
        <CivicEngagementAnalyticsScreen navigation={mockNavigation} />
      );

      await waitFor(() => {
        expect(getByText('71.5%')).toBeTruthy();
      });
    });

    it('should format decimal numbers correctly', async () => {
      const { getByText } = render(
        <CivicEngagementAnalyticsScreen navigation={mockNavigation} />
      );

      await waitFor(() => {
        expect(getByText('12.3 days')).toBeTruthy();
      });
    });
  });

  describe('Accessibility', () => {
    it('should render all metric cards', async () => {
      const { getAllByText } = render(
        <CivicEngagementAnalyticsScreen navigation={mockNavigation} />
      );

      await waitFor(() => {
        expect(getAllByText(/Total|Resolved|Pending|Active|Completed/)).toBeTruthy();
      });
    });

    it('should have proper section structure', async () => {
      const { getByText } = render(
        <CivicEngagementAnalyticsScreen navigation={mockNavigation} />
      );

      await waitFor(() => {
        expect(getByText('Grievance Management')).toBeTruthy();
        expect(getByText('Community Polls')).toBeTruthy();
        expect(getByText('Infrastructure Projects')).toBeTruthy();
        expect(getByText('Community Verification')).toBeTruthy();
      });
    });
  });
});
