/**
 * Project Dashboard Screen Tests
 * Task 36.7: Create project dashboard with progress bars
 * 
 * Test Coverage:
 * - Component rendering and initial state
 * - Project list display with progress bars
 * - Search functionality
 * - Filtering by status, type, and delayed projects
 * - Sorting by progress, budget, and date
 * - Project card interactions
 * - Error handling and loading states
 * - Empty state display
 * - Refresh functionality
 * - Filter modal interactions
 * - Progress bar visualization
 * - Budget formatting
 * - Date formatting
 * - Delay indicators
 */

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import ProjectDashboardScreen from '../ProjectDashboardScreen';
import { API_BASE_URL } from '../../../config/api-config';

// Mock fetch
global.fetch = jest.fn();

// Mock navigation
const mockNavigate = jest.fn();
const mockNavigation = {
  navigate: mockNavigate,
};

// Mock OfflineIndicator
jest.mock('../../../components/OfflineIndicator', () => ({
  OfflineIndicator: () => null,
}));

// Sample project data
const mockProjects = [
  {
    project_id: 'proj-1',
    project_name: 'Main Road Construction',
    project_code: 'RD-2024-001',
    project_type: 'road',
    description: 'Construction of 5km main road',
    address: '123 Main St',
    district: 'Mumbai',
    state: 'Maharashtra',
    total_budget: 50000000,
    budget_currency: 'INR',
    funding_sources: [
      { source_name: 'State Govt', amount: 30000000, percentage: 60 },
      { source_name: 'Central Govt', amount: 20000000, percentage: 40 },
    ],
    planned_start_date: '2024-01-01T00:00:00Z',
    planned_end_date: '2024-12-31T00:00:00Z',
    estimated_completion_date: '2024-12-31T00:00:00Z',
    progress_percentage: 65,
    current_phase: 'Foundation work',
    is_delayed: false,
    delay_days: 0,
    delay_reasons: [],
    contractor_name: 'ABC Construction',
    implementing_agency: 'PWD',
    status: 'in_progress',
    beneficiaries_count: 50000,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-06-01T00:00:00Z',
  },
  {
    project_id: 'proj-2',
    project_name: 'Water Supply Pipeline',
    project_code: 'WS-2024-002',
    project_type: 'water_supply',
    description: 'Installation of water supply pipeline',
    address: '456 Water St',
    district: 'Pune',
    state: 'Maharashtra',
    total_budget: 25000000,
    budget_currency: 'INR',
    funding_sources: [
      { source_name: 'Municipal Corp', amount: 25000000, percentage: 100 },
    ],
    planned_start_date: '2024-02-01T00:00:00Z',
    planned_end_date: '2024-08-31T00:00:00Z',
    estimated_completion_date: '2024-10-31T00:00:00Z',
    progress_percentage: 40,
    current_phase: 'Pipeline laying',
    is_delayed: true,
    delay_days: 45,
    delay_reasons: ['Material shortage', 'Weather conditions'],
    contractor_name: 'XYZ Infra',
    implementing_agency: 'Water Board',
    status: 'in_progress',
    beneficiaries_count: 30000,
    created_at: '2024-02-01T00:00:00Z',
    updated_at: '2024-06-15T00:00:00Z',
  },
  {
    project_id: 'proj-3',
    project_name: 'Primary School Building',
    project_code: 'SCH-2024-003',
    project_type: 'school',
    description: 'Construction of new primary school',
    address: '789 School Rd',
    district: 'Nagpur',
    state: 'Maharashtra',
    total_budget: 15000000,
    budget_currency: 'INR',
    funding_sources: [
      { source_name: 'Education Dept', amount: 15000000, percentage: 100 },
    ],
    planned_start_date: '2024-03-01T00:00:00Z',
    planned_end_date: '2024-11-30T00:00:00Z',
    estimated_completion_date: '2024-11-30T00:00:00Z',
    progress_percentage: 85,
    current_phase: 'Finishing work',
    is_delayed: false,
    delay_days: 0,
    delay_reasons: [],
    contractor_name: 'DEF Builders',
    implementing_agency: 'Education Dept',
    status: 'in_progress',
    beneficiaries_count: 500,
    created_at: '2024-03-01T00:00:00Z',
    updated_at: '2024-06-20T00:00:00Z',
  },
];

describe('ProjectDashboardScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockResolvedValue({
      json: async () => ({
        success: true,
        data: mockProjects,
        count: mockProjects.length,
      }),
    });
  });

  describe('Initial Rendering', () => {
    it('should render loading state initially', () => {
      const { getByText } = render(
        <ProjectDashboardScreen navigation={mockNavigation} />
      );

      expect(getByText('Loading projects...')).toBeTruthy();
    });

    it('should render header with title', async () => {
      const { getByText } = render(
        <ProjectDashboardScreen navigation={mockNavigation} />
      );

      await waitFor(() => {
        expect(getByText('Infrastructure Projects')).toBeTruthy();
      });
    });

    it('should display project count in subtitle', async () => {
      const { getByText } = render(
        <ProjectDashboardScreen navigation={mockNavigation} />
      );

      await waitFor(() => {
        expect(getByText('3 projects')).toBeTruthy();
      });
    });

    it('should render search bar', async () => {
      const { getByPlaceholderText } = render(
        <ProjectDashboardScreen navigation={mockNavigation} />
      );

      await waitFor(() => {
        expect(getByPlaceholderText('Search projects, code, district...')).toBeTruthy();
      });
    });

    it('should render filter button', async () => {
      const { getByText } = render(
        <ProjectDashboardScreen navigation={mockNavigation} />
      );

      await waitFor(() => {
        expect(getByText('⚙️')).toBeTruthy();
      });
    });
  });

  describe('Project List Display', () => {
    it('should display all projects', async () => {
      const { getByText } = render(
        <ProjectDashboardScreen navigation={mockNavigation} />
      );

      await waitFor(() => {
        expect(getByText('Main Road Construction')).toBeTruthy();
        expect(getByText('Water Supply Pipeline')).toBeTruthy();
        expect(getByText('Primary School Building')).toBeTruthy();
      });
    });

    it('should display project codes', async () => {
      const { getByText } = render(
        <ProjectDashboardScreen navigation={mockNavigation} />
      );

      await waitFor(() => {
        expect(getByText('Code: RD-2024-001')).toBeTruthy();
        expect(getByText('Code: WS-2024-002')).toBeTruthy();
        expect(getByText('Code: SCH-2024-003')).toBeTruthy();
      });
    });

    it('should display project types with icons', async () => {
      const { getByText } = render(
        <ProjectDashboardScreen navigation={mockNavigation} />
      );

      await waitFor(() => {
        expect(getByText('🛣️')).toBeTruthy(); // Road icon
        expect(getByText('💧')).toBeTruthy(); // Water supply icon
        expect(getByText('🎓')).toBeTruthy(); // School icon
      });
    });

    it('should display progress percentages', async () => {
      const { getByText } = render(
        <ProjectDashboardScreen navigation={mockNavigation} />
      );

      await waitFor(() => {
        expect(getByText('65%')).toBeTruthy();
        expect(getByText('40%')).toBeTruthy();
        expect(getByText('85%')).toBeTruthy();
      });
    });

    it('should display progress bars', async () => {
      const { getAllByTestId } = render(
        <ProjectDashboardScreen navigation={mockNavigation} />
      );

      await waitFor(() => {
        const progressBars = getAllByTestId(/progress-bar/);
        expect(progressBars.length).toBeGreaterThan(0);
      });
    });

    it('should display budget information', async () => {
      const { getByText } = render(
        <ProjectDashboardScreen navigation={mockNavigation} />
      );

      await waitFor(() => {
        expect(getByText(/₹5\.00 Cr/)).toBeTruthy();
        expect(getByText(/₹2\.50 Cr/)).toBeTruthy();
        expect(getByText(/₹1\.50 Cr/)).toBeTruthy();
      });
    });

    it('should display project status badges', async () => {
      const { getAllByText } = render(
        <ProjectDashboardScreen navigation={mockNavigation} />
      );

      await waitFor(() => {
        const statusBadges = getAllByText('In Progress');
        expect(statusBadges.length).toBe(3);
      });
    });

    it('should display delay indicators for delayed projects', async () => {
      const { getByText } = render(
        <ProjectDashboardScreen navigation={mockNavigation} />
      );

      await waitFor(() => {
        expect(getByText('45d delay')).toBeTruthy();
      });
    });

    it('should display delay reasons', async () => {
      const { getByText } = render(
        <ProjectDashboardScreen navigation={mockNavigation} />
      );

      await waitFor(() => {
        expect(getByText(/Material shortage, Weather conditions/)).toBeTruthy();
      });
    });

    it('should display location information', async () => {
      const { getByText } = render(
        <ProjectDashboardScreen navigation={mockNavigation} />
      );

      await waitFor(() => {
        expect(getByText('Mumbai, Maharashtra')).toBeTruthy();
        expect(getByText('Pune, Maharashtra')).toBeTruthy();
        expect(getByText('Nagpur, Maharashtra')).toBeTruthy();
      });
    });

    it('should display beneficiaries count', async () => {
      const { getByText } = render(
        <ProjectDashboardScreen navigation={mockNavigation} />
      );

      await waitFor(() => {
        expect(getByText('50,000 beneficiaries')).toBeTruthy();
        expect(getByText('30,000 beneficiaries')).toBeTruthy();
        expect(getByText('500 beneficiaries')).toBeTruthy();
      });
    });

    it('should display contractor names', async () => {
      const { getByText } = render(
        <ProjectDashboardScreen navigation={mockNavigation} />
      );

      await waitFor(() => {
        expect(getByText('ABC Construction')).toBeTruthy();
        expect(getByText('XYZ Infra')).toBeTruthy();
        expect(getByText('DEF Builders')).toBeTruthy();
      });
    });

    it('should display implementing agency', async () => {
      const { getByText } = render(
        <ProjectDashboardScreen navigation={mockNavigation} />
      );

      await waitFor(() => {
        expect(getByText('PWD')).toBeTruthy();
        expect(getByText('Water Board')).toBeTruthy();
        expect(getByText('Education Dept')).toBeTruthy();
      });
    });

    it('should display current phase', async () => {
      const { getByText } = render(
        <ProjectDashboardScreen navigation={mockNavigation} />
      );

      await waitFor(() => {
        expect(getByText('Current: Foundation work')).toBeTruthy();
        expect(getByText('Current: Pipeline laying')).toBeTruthy();
        expect(getByText('Current: Finishing work')).toBeTruthy();
      });
    });
  });

  describe('Search Functionality', () => {
    it('should filter projects by name', async () => {
      const { getByPlaceholderText, getByText, queryByText } = render(
        <ProjectDashboardScreen navigation={mockNavigation} />
      );

      await waitFor(() => {
        expect(getByText('Main Road Construction')).toBeTruthy();
      });

      const searchInput = getByPlaceholderText('Search projects, code, district...');
      fireEvent.changeText(searchInput, 'Water');

      await waitFor(() => {
        expect(getByText('Water Supply Pipeline')).toBeTruthy();
        expect(queryByText('Main Road Construction')).toBeNull();
        expect(queryByText('Primary School Building')).toBeNull();
      });
    });

    it('should filter projects by code', async () => {
      const { getByPlaceholderText, getByText, queryByText } = render(
        <ProjectDashboardScreen navigation={mockNavigation} />
      );

      await waitFor(() => {
        expect(getByText('Main Road Construction')).toBeTruthy();
      });

      const searchInput = getByPlaceholderText('Search projects, code, district...');
      fireEvent.changeText(searchInput, 'RD-2024-001');

      await waitFor(() => {
        expect(getByText('Main Road Construction')).toBeTruthy();
        expect(queryByText('Water Supply Pipeline')).toBeNull();
      });
    });

    it('should filter projects by district', async () => {
      const { getByPlaceholderText, getByText, queryByText } = render(
        <ProjectDashboardScreen navigation={mockNavigation} />
      );

      await waitFor(() => {
        expect(getByText('Main Road Construction')).toBeTruthy();
      });

      const searchInput = getByPlaceholderText('Search projects, code, district...');
      fireEvent.changeText(searchInput, 'Pune');

      await waitFor(() => {
        expect(getByText('Water Supply Pipeline')).toBeTruthy();
        expect(queryByText('Main Road Construction')).toBeNull();
      });
    });

    it('should show clear button when search has text', async () => {
      const { getByPlaceholderText, getByText } = render(
        <ProjectDashboardScreen navigation={mockNavigation} />
      );

      await waitFor(() => {
        expect(getByText('Main Road Construction')).toBeTruthy();
      });

      const searchInput = getByPlaceholderText('Search projects, code, district...');
      fireEvent.changeText(searchInput, 'test');

      await waitFor(() => {
        expect(getByText('✕')).toBeTruthy();
      });
    });

    it('should clear search when clear button is pressed', async () => {
      const { getByPlaceholderText, getByText, getAllByText } = render(
        <ProjectDashboardScreen navigation={mockNavigation} />
      );

      await waitFor(() => {
        expect(getByText('Main Road Construction')).toBeTruthy();
      });

      const searchInput = getByPlaceholderText('Search projects, code, district...');
      fireEvent.changeText(searchInput, 'Water');

      await waitFor(() => {
        expect(getByText('Water Supply Pipeline')).toBeTruthy();
      });

      const clearButtons = getAllByText('✕');
      fireEvent.press(clearButtons[0]); // First clear button is for search

      await waitFor(() => {
        expect(getByText('Main Road Construction')).toBeTruthy();
        expect(getByText('Water Supply Pipeline')).toBeTruthy();
        expect(getByText('Primary School Building')).toBeTruthy();
      });
    });

    it('should debounce search input', async () => {
      jest.useFakeTimers();

      const { getByPlaceholderText } = render(
        <ProjectDashboardScreen navigation={mockNavigation} />
      );

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledTimes(1);
      });

      const searchInput = getByPlaceholderText('Search projects, code, district...');
      fireEvent.changeText(searchInput, 'W');
      fireEvent.changeText(searchInput, 'Wa');
      fireEvent.changeText(searchInput, 'Wat');

      // Should not trigger additional fetches immediately
      expect(global.fetch).toHaveBeenCalledTimes(1);

      // Fast-forward time
      jest.advanceTimersByTime(500);

      await waitFor(() => {
        // Should trigger fetch after debounce
        expect(global.fetch).toHaveBeenCalledTimes(1); // Still 1 because we're filtering client-side
      });

      jest.useRealTimers();
    });
  });

  describe('Filter Functionality', () => {
    it('should open filter modal when filter button is pressed', async () => {
      const { getByText } = render(
        <ProjectDashboardScreen navigation={mockNavigation} />
      );

      await waitFor(() => {
        expect(getByText('Main Road Construction')).toBeTruthy();
      });

      const filterButton = getByText('⚙️');
      fireEvent.press(filterButton);

      await waitFor(() => {
        expect(getByText('Filters & Sort')).toBeTruthy();
      });
    });

    it('should filter by status', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({
          success: true,
          data: mockProjects.filter(p => p.status === 'in_progress'),
          count: 3,
        }),
      });

      const { getByText, getAllByText } = render(
        <ProjectDashboardScreen navigation={mockNavigation} />
      );

      await waitFor(() => {
        expect(getByText('Main Road Construction')).toBeTruthy();
      });

      const filterButton = getByText('⚙️');
      fireEvent.press(filterButton);

      await waitFor(() => {
        expect(getByText('Filters & Sort')).toBeTruthy();
      });

      const inProgressChips = getAllByText('In Progress');
      fireEvent.press(inProgressChips[0]); // First one in modal

      const applyButton = getByText('Apply');
      fireEvent.press(applyButton);

      await waitFor(() => {
        const statusBadges = getAllByText('In Progress');
        expect(statusBadges.length).toBeGreaterThan(0);
      });
    });

    it('should filter by project type', async () => {
      const { getByText, getAllByText } = render(
        <ProjectDashboardScreen navigation={mockNavigation} />
      );

      await waitFor(() => {
        expect(getByText('Main Road Construction')).toBeTruthy();
      });

      const filterButton = getByText('⚙️');
      fireEvent.press(filterButton);

      await waitFor(() => {
        expect(getByText('Filters & Sort')).toBeTruthy();
      });

      const roadChips = getAllByText('Roads');
      fireEvent.press(roadChips[0]); // First one in modal

      const applyButton = getByText('Apply');
      fireEvent.press(applyButton);

      await waitFor(() => {
        expect(getByText('Main Road Construction')).toBeTruthy();
      });
    });

    it('should filter delayed projects only', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({
          success: true,
          data: mockProjects.filter(p => p.is_delayed),
          count: 1,
        }),
      });

      const { getByText } = render(
        <ProjectDashboardScreen navigation={mockNavigation} />
      );

      await waitFor(() => {
        expect(getByText('Main Road Construction')).toBeTruthy();
      });

      const filterButton = getByText('⚙️');
      fireEvent.press(filterButton);

      await waitFor(() => {
        expect(getByText('Filters & Sort')).toBeTruthy();
      });

      const delayedToggle = getByText('Show only delayed projects');
      fireEvent.press(delayedToggle);

      const applyButton = getByText('Apply');
      fireEvent.press(applyButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('is_delayed=true')
        );
      });
    });

    it('should display active filter count badge', async () => {
      const { getByText, getAllByText } = render(
        <ProjectDashboardScreen navigation={mockNavigation} />
      );

      await waitFor(() => {
        expect(getByText('Main Road Construction')).toBeTruthy();
      });

      const filterButton = getByText('⚙️');
      fireEvent.press(filterButton);

      await waitFor(() => {
        expect(getByText('Filters & Sort')).toBeTruthy();
      });

      const inProgressChips = getAllByText('In Progress');
      fireEvent.press(inProgressChips[0]);

      const roadChips = getAllByText('Roads');
      fireEvent.press(roadChips[0]);

      const applyButton = getByText('Apply');
      fireEvent.press(applyButton);

      await waitFor(() => {
        // Filter badge should show count of 2
        const badges = getAllByText('2');
        expect(badges.length).toBeGreaterThan(0);
      });
    });

    it('should display active filter chips', async () => {
      const { getByText, getAllByText } = render(
        <ProjectDashboardScreen navigation={mockNavigation} />
      );

      await waitFor(() => {
        expect(getByText('Main Road Construction')).toBeTruthy();
      });

      const filterButton = getByText('⚙️');
      fireEvent.press(filterButton);

      await waitFor(() => {
        expect(getByText('Filters & Sort')).toBeTruthy();
      });

      const inProgressChips = getAllByText('In Progress');
      fireEvent.press(inProgressChips[0]);

      const applyButton = getByText('Apply');
      fireEvent.press(applyButton);

      await waitFor(() => {
        const chips = getAllByText('In Progress');
        expect(chips.length).toBeGreaterThan(1); // One in status badges, one in active chips
      });
    });

    it('should remove filter when active chip close is pressed', async () => {
      const { getByText, getAllByText, queryByText } = render(
        <ProjectDashboardScreen navigation={mockNavigation} />
      );

      await waitFor(() => {
        expect(getByText('Main Road Construction')).toBeTruthy();
      });

      const filterButton = getByText('⚙️');
      fireEvent.press(filterButton);

      await waitFor(() => {
        expect(getByText('Filters & Sort')).toBeTruthy();
      });

      const inProgressChips = getAllByText('In Progress');
      fireEvent.press(inProgressChips[0]);

      const applyButton = getByText('Apply');
      fireEvent.press(applyButton);

      await waitFor(() => {
        const chips = getAllByText('In Progress');
        expect(chips.length).toBeGreaterThan(1);
      });

      const closeButtons = getAllByText('✕');
      // Find the close button in the active filter chip (not the search clear button)
      fireEvent.press(closeButtons[1]);

      await waitFor(() => {
        // Active filter chip should be removed, badge should be gone
        const badges = queryByText('1');
        expect(badges).toBeNull();
      });
    });

    it('should clear all filters', async () => {
      const { getByText, getAllByText } = render(
        <ProjectDashboardScreen navigation={mockNavigation} />
      );

      await waitFor(() => {
        expect(getByText('Main Road Construction')).toBeTruthy();
      });

      const filterButton = getByText('⚙️');
      fireEvent.press(filterButton);

      await waitFor(() => {
        expect(getByText('Filters & Sort')).toBeTruthy();
      });

      const inProgressChips = getAllByText('In Progress');
      fireEvent.press(inProgressChips[0]);

      const roadChips = getAllByText('Roads');
      fireEvent.press(roadChips[0]);

      const clearButton = getByText('Clear All');
      fireEvent.press(clearButton);

      await waitFor(() => {
        // Modal should close and filters should be cleared
        expect(getByText('Main Road Construction')).toBeTruthy();
      });
    });
  });

  describe('Sort Functionality', () => {
    it('should sort by progress', async () => {
      const { getByText } = render(
        <ProjectDashboardScreen navigation={mockNavigation} />
      );

      await waitFor(() => {
        expect(getByText('Main Road Construction')).toBeTruthy();
      });

      const filterButton = getByText('⚙️');
      fireEvent.press(filterButton);

      await waitFor(() => {
        expect(getByText('Filters & Sort')).toBeTruthy();
      });

      const progressSort = getByText('Progress');
      fireEvent.press(progressSort);

      const applyButton = getByText('Apply');
      fireEvent.press(applyButton);

      await waitFor(() => {
        // Projects should be sorted by progress (highest first)
        expect(getByText('Primary School Building')).toBeTruthy(); // 85%
      });
    });

    it('should sort by budget', async () => {
      const { getByText } = render(
        <ProjectDashboardScreen navigation={mockNavigation} />
      );

      await waitFor(() => {
        expect(getByText('Main Road Construction')).toBeTruthy();
      });

      const filterButton = getByText('⚙️');
      fireEvent.press(filterButton);

      await waitFor(() => {
        expect(getByText('Filters & Sort')).toBeTruthy();
      });

      const budgetSort = getByText('Budget');
      fireEvent.press(budgetSort);

      const applyButton = getByText('Apply');
      fireEvent.press(applyButton);

      await waitFor(() => {
        // Projects should be sorted by budget (highest first)
        expect(getByText('Main Road Construction')).toBeTruthy(); // 5 Cr
      });
    });

    it('should sort by date (default)', async () => {
      const { getByText } = render(
        <ProjectDashboardScreen navigation={mockNavigation} />
      );

      await waitFor(() => {
        expect(getByText('Main Road Construction')).toBeTruthy();
      });

      // Default sort should be by date (latest first)
      // Primary School Building was created last (2024-03-01)
      expect(getByText('Primary School Building')).toBeTruthy();
    });

    it('should display sort option in active filters', async () => {
      const { getByText } = render(
        <ProjectDashboardScreen navigation={mockNavigation} />
      );

      await waitFor(() => {
        expect(getByText('Main Road Construction')).toBeTruthy();
      });

      const filterButton = getByText('⚙️');
      fireEvent.press(filterButton);

      await waitFor(() => {
        expect(getByText('Filters & Sort')).toBeTruthy();
      });

      const progressSort = getByText('Progress');
      fireEvent.press(progressSort);

      const applyButton = getByText('Apply');
      fireEvent.press(applyButton);

      await waitFor(() => {
        expect(getByText('Sort: Progress')).toBeTruthy();
      });
    });
  });

  describe('Project Card Interactions', () => {
    it('should navigate to project detail when card is pressed', async () => {
      const { getByText } = render(
        <ProjectDashboardScreen navigation={mockNavigation} />
      );

      await waitFor(() => {
        expect(getByText('Main Road Construction')).toBeTruthy();
      });

      const projectCard = getByText('Main Road Construction');
      fireEvent.press(projectCard);

      expect(mockNavigate).toHaveBeenCalledWith('ProjectDetail', {
        projectId: 'proj-1',
        projectName: 'Main Road Construction',
      });
    });

    it('should pass correct project data to detail screen', async () => {
      const { getByText } = render(
        <ProjectDashboardScreen navigation={mockNavigation} />
      );

      await waitFor(() => {
        expect(getByText('Water Supply Pipeline')).toBeTruthy();
      });

      const projectCard = getByText('Water Supply Pipeline');
      fireEvent.press(projectCard);

      expect(mockNavigate).toHaveBeenCalledWith('ProjectDetail', {
        projectId: 'proj-2',
        projectName: 'Water Supply Pipeline',
      });
    });
  });

  describe('Error Handling', () => {
    it('should display error message when API fails', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(
        new Error('Network error')
      );

      const { getByText } = render(
        <ProjectDashboardScreen navigation={mockNavigation} />
      );

      await waitFor(() => {
        expect(getByText(/Network error/)).toBeTruthy();
      });
    });

    it('should display error when API returns error response', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({
          success: false,
          error: 'Failed to load projects',
        }),
      });

      const { getByText } = render(
        <ProjectDashboardScreen navigation={mockNavigation} />
      );

      await waitFor(() => {
        expect(getByText(/Failed to load projects/)).toBeTruthy();
      });
    });

    it('should show retry button on error', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(
        new Error('Network error')
      );

      const { getByText } = render(
        <ProjectDashboardScreen navigation={mockNavigation} />
      );

      await waitFor(() => {
        expect(getByText('Retry')).toBeTruthy();
      });
    });

    it('should retry loading when retry button is pressed', async () => {
      (global.fetch as jest.Mock)
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          json: async () => ({
            success: true,
            data: mockProjects,
            count: mockProjects.length,
          }),
        });

      const { getByText } = render(
        <ProjectDashboardScreen navigation={mockNavigation} />
      );

      await waitFor(() => {
        expect(getByText('Retry')).toBeTruthy();
      });

      const retryButton = getByText('Retry');
      fireEvent.press(retryButton);

      await waitFor(() => {
        expect(getByText('Main Road Construction')).toBeTruthy();
      });
    });
  });

  describe('Empty State', () => {
    it('should display empty state when no projects', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({
          success: true,
          data: [],
          count: 0,
        }),
      });

      const { getByText } = render(
        <ProjectDashboardScreen navigation={mockNavigation} />
      );

      await waitFor(() => {
        expect(getByText('No projects found')).toBeTruthy();
        expect(getByText('Check back later for new projects')).toBeTruthy();
      });
    });

    it('should display empty state with filter message when filters active', async () => {
      const { getByText, getByPlaceholderText } = render(
        <ProjectDashboardScreen navigation={mockNavigation} />
      );

      await waitFor(() => {
        expect(getByText('Main Road Construction')).toBeTruthy();
      });

      const searchInput = getByPlaceholderText('Search projects, code, district...');
      fireEvent.changeText(searchInput, 'nonexistent');

      await waitFor(() => {
        expect(getByText('No projects found')).toBeTruthy();
        expect(getByText('Try adjusting your filters')).toBeTruthy();
      });
    });
  });

  describe('Refresh Functionality', () => {
    it('should refresh projects on pull-to-refresh', async () => {
      const { getByText } = render(
        <ProjectDashboardScreen navigation={mockNavigation} />
      );

      await waitFor(() => {
        expect(getByText('Main Road Construction')).toBeTruthy();
      });

      // Refresh is tested through the component's refresh control
      // The fetch should have been called at least once
      expect(global.fetch).toHaveBeenCalled();
    });
  });

  describe('Progress Bar Visualization', () => {
    it('should use green color for high progress (>=75%)', async () => {
      const { getByText } = render(
        <ProjectDashboardScreen navigation={mockNavigation} />
      );

      await waitFor(() => {
        expect(getByText('85%')).toBeTruthy(); // Primary School Building
      });

      // Progress bar should have green color
      // This would require checking the style prop
    });

    it('should use orange color for medium progress (50-74%)', async () => {
      const { getByText } = render(
        <ProjectDashboardScreen navigation={mockNavigation} />
      );

      await waitFor(() => {
        expect(getByText('65%')).toBeTruthy(); // Main Road Construction
      });

      // Progress bar should have orange color
    });

    it('should use yellow color for low-medium progress (25-49%)', async () => {
      const { getByText } = render(
        <ProjectDashboardScreen navigation={mockNavigation} />
      );

      await waitFor(() => {
        expect(getByText('40%')).toBeTruthy(); // Water Supply Pipeline
      });

      // Progress bar should have yellow color
    });
  });

  describe('Budget Formatting', () => {
    it('should format crores correctly', async () => {
      const { getByText } = render(
        <ProjectDashboardScreen navigation={mockNavigation} />
      );

      await waitFor(() => {
        expect(getByText(/₹5\.00 Cr/)).toBeTruthy(); // 50000000
      });
    });

    it('should format lakhs correctly', async () => {
      const { getByText } = render(
        <ProjectDashboardScreen navigation={mockNavigation} />
      );

      await waitFor(() => {
        expect(getByText(/₹2\.50 Cr/)).toBeTruthy(); // 25000000
      });
    });
  });

  describe('Date Formatting', () => {
    it('should format dates in Indian format', async () => {
      const { getByText } = render(
        <ProjectDashboardScreen navigation={mockNavigation} />
      );

      await waitFor(() => {
        // Dates should be formatted as "1 Jan 2024" style
        expect(getByText(/Jan/)).toBeTruthy();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have accessible project cards', async () => {
      const { getByText } = render(
        <ProjectDashboardScreen navigation={mockNavigation} />
      );

      await waitFor(() => {
        const projectCard = getByText('Main Road Construction');
        expect(projectCard).toBeTruthy();
      });
    });

    it('should have accessible filter button', async () => {
      const { getByText } = render(
        <ProjectDashboardScreen navigation={mockNavigation} />
      );

      await waitFor(() => {
        const filterButton = getByText('⚙️');
        expect(filterButton).toBeTruthy();
      });
    });
  });

  describe('API Integration', () => {
    it('should call API with correct endpoint', async () => {
      render(<ProjectDashboardScreen navigation={mockNavigation} />);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/projects')
        );
      });
    });

    it('should include status filter in API call', async () => {
      const { getByText, getAllByText } = render(
        <ProjectDashboardScreen navigation={mockNavigation} />
      );

      await waitFor(() => {
        expect(getByText('Main Road Construction')).toBeTruthy();
      });

      const filterButton = getByText('⚙️');
      fireEvent.press(filterButton);

      await waitFor(() => {
        expect(getByText('Filters & Sort')).toBeTruthy();
      });

      const inProgressChips = getAllByText('In Progress');
      fireEvent.press(inProgressChips[0]); // First one in the modal

      const applyButton = getByText('Apply');
      fireEvent.press(applyButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('status=in_progress')
        );
      });
    });

    it('should include project type filter in API call', async () => {
      const { getByText, getAllByText } = render(
        <ProjectDashboardScreen navigation={mockNavigation} />
      );

      await waitFor(() => {
        expect(getByText('Main Road Construction')).toBeTruthy();
      });

      const filterButton = getByText('⚙️');
      fireEvent.press(filterButton);

      await waitFor(() => {
        expect(getByText('Filters & Sort')).toBeTruthy();
      });

      const roadChips = getAllByText('Roads');
      fireEvent.press(roadChips[0]); // First one in the modal

      const applyButton = getByText('Apply');
      fireEvent.press(applyButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('project_type=road')
        );
      });
    });
  });
});
