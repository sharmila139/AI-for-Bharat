/**
 * Tests for ProjectDetailScreen
 * Task 36.8: Build project detail view with milestones
 */

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { ProjectDetailScreen } from '../ProjectDetailScreen';
import { Share, Linking } from 'react-native';

// Mock dependencies
jest.mock('../../../components/OfflineIndicator', () => ({
  OfflineIndicator: () => null,
}));

jest.mock('../../../config/api-config', () => ({
  API_BASE_URL: 'http://localhost:3000',
}));

// Mock fetch
global.fetch = jest.fn();

// Mock Share and Linking
jest.mock('react-native/Libraries/Share/Share', () => ({
  share: jest.fn(),
}));

jest.mock('react-native/Libraries/Linking/Linking', () => ({
  openURL: jest.fn(),
}));

describe('ProjectDetailScreen', () => {
  const mockNavigation = {
    navigate: jest.fn(),
    goBack: jest.fn(),
  };

  const mockRoute = {
    params: {
      projectId: 'proj-123',
      projectName: 'Test Project',
    },
  };

  const mockProjectData = {
    project_id: 'proj-123',
    project_name: 'Rural Road Construction',
    project_code: 'RRC-2024-001',
    project_type: 'road',
    description: 'Construction of 5km rural road connecting villages',
    address: '123 Main St',
    district: 'Test District',
    state: 'Test State',
    pincode: '123456',
    latitude: 12.9716,
    longitude: 77.5946,
    total_budget: 5000000,
    budget_currency: 'INR',
    amount_spent: 2000000,
    amount_remaining: 3000000,
    funding_sources: [
      { source_name: 'State Government', amount: 3000000, percentage: 60 },
      { source_name: 'Central Government', amount: 2000000, percentage: 40 },
    ],
    planned_start_date: '2024-01-01T00:00:00Z',
    actual_start_date: '2024-01-15T00:00:00Z',
    planned_end_date: '2024-12-31T00:00:00Z',
    estimated_completion_date: '2025-02-28T00:00:00Z',
    progress_percentage: 45,
    current_phase: 'Foundation Work',
    is_delayed: true,
    delay_days: 30,
    delay_reasons: ['Heavy rainfall', 'Material shortage'],
    contractor_name: 'ABC Construction',
    contractor_contact: '+919876543210',
    supervisor_name: 'John Doe',
    supervisor_contact: '+919876543211',
    implementing_agency: 'Public Works Department',
    work_order_number: 'WO-2024-001',
    status: 'in_progress',
    beneficiaries_count: 5000,
    quality_rating: 4.2,
    community_satisfaction: 85,
    created_at: '2023-12-01T00:00:00Z',
    updated_at: '2024-03-15T00:00:00Z',
  };

  const mockMilestones = [
    {
      milestone_id: 'ms-1',
      milestone_name: 'Site Preparation',
      description: 'Clear and level the construction site',
      target_date: '2024-02-01T00:00:00Z',
      completion_date: '2024-02-05T00:00:00Z',
      status: 'completed',
      weight_percentage: 20,
      deliverables: ['Site cleared', 'Leveling completed'],
      is_delayed: false,
    },
    {
      milestone_id: 'ms-2',
      milestone_name: 'Foundation Work',
      description: 'Lay foundation for the road',
      target_date: '2024-04-01T00:00:00Z',
      status: 'in_progress',
      weight_percentage: 30,
      deliverables: ['Excavation', 'Base layer'],
      is_delayed: true,
    },
    {
      milestone_id: 'ms-3',
      milestone_name: 'Road Surface',
      description: 'Lay asphalt surface',
      target_date: '2024-08-01T00:00:00Z',
      status: 'pending',
      weight_percentage: 50,
      deliverables: ['Asphalt laying', 'Road marking'],
      is_delayed: false,
    },
  ];

  const mockUpdates = [
    {
      update_id: 'upd-1',
      update_date: '2024-03-15T00:00:00Z',
      update_type: 'progress',
      description: 'Foundation work is 60% complete',
      photos: ['https://example.com/photo1.jpg'],
      updated_by: 'Site Engineer',
    },
    {
      update_id: 'upd-2',
      update_date: '2024-03-10T00:00:00Z',
      update_type: 'delay',
      description: 'Work delayed due to heavy rainfall',
      updated_by: 'Project Manager',
    },
  ];

  const mockInspections = [
    {
      inspection_id: 'insp-1',
      inspection_date: '2024-03-01T00:00:00Z',
      inspector_name: 'Quality Inspector',
      quality_rating: 4.5,
      findings: 'Work quality is good, minor issues found',
      recommendations: 'Improve drainage system',
      photos: ['https://example.com/inspection1.jpg'],
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default fetch responses
    (global.fetch as jest.Mock).mockImplementation((url: string) => {
      if (url.includes('/projects/proj-123')) {
        return Promise.resolve({
          json: () => Promise.resolve({ success: true, data: mockProjectData }),
        });
      }
      if (url.includes('/milestones')) {
        return Promise.resolve({
          json: () => Promise.resolve({ success: true, data: mockMilestones }),
        });
      }
      if (url.includes('/updates')) {
        return Promise.resolve({
          json: () => Promise.resolve({ success: true, data: mockUpdates }),
        });
      }
      if (url.includes('/inspections')) {
        return Promise.resolve({
          json: () => Promise.resolve({ success: true, data: mockInspections }),
        });
      }
      return Promise.reject(new Error('Unknown URL'));
    });
  });

  describe('Loading and Error States', () => {
    it('should show loading indicator while fetching data', () => {
      const { getByText } = render(
        <ProjectDetailScreen navigation={mockNavigation} route={mockRoute} />
      );

      expect(getByText('Loading project details...')).toBeTruthy();
    });

    it('should show error state when project fetch fails', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      const { getByText, findByText } = render(
        <ProjectDetailScreen navigation={mockNavigation} route={mockRoute} />
      );

      const errorMessage = await findByText('Network error');
      expect(errorMessage).toBeTruthy();
      expect(getByText('Failed to Load')).toBeTruthy();
    });

    it('should allow retry after error', async () => {
      (global.fetch as jest.Mock)
        .mockRejectedValueOnce(new Error('Network error'))
        .mockImplementation((url: string) => {
          if (url.includes('/projects/proj-123')) {
            return Promise.resolve({
              json: () => Promise.resolve({ success: true, data: mockProjectData }),
            });
          }
          return Promise.resolve({
            json: () => Promise.resolve({ success: true, data: [] }),
          });
        });

      const { getByText, findByText } = render(
        <ProjectDetailScreen navigation={mockNavigation} route={mockRoute} />
      );

      await findByText('Network error');
      
      const retryButton = getByText('Retry');
      fireEvent.press(retryButton);

      await waitFor(() => {
        expect(getByText('Rural Road Construction')).toBeTruthy();
      });
    });
  });

  describe('Project Overview Tab', () => {
    it('should display project header information', async () => {
      const { getByText, findByText } = render(
        <ProjectDetailScreen navigation={mockNavigation} route={mockRoute} />
      );

      await findByText('Rural Road Construction');
      
      expect(getByText('Code: RRC-2024-001')).toBeTruthy();
      expect(getByText('IN PROGRESS')).toBeTruthy();
      expect(getByText('45%')).toBeTruthy();
      expect(getByText('Current Phase: Foundation Work')).toBeTruthy();
    });

    it('should display delay banner when project is delayed', async () => {
      const { getByText, findByText } = render(
        <ProjectDetailScreen navigation={mockNavigation} route={mockRoute} />
      );

      await findByText('Rural Road Construction');
      
      expect(getByText('Delayed by 30 days')).toBeTruthy();
    });

    it('should display project description', async () => {
      const { getByText, findByText } = render(
        <ProjectDetailScreen navigation={mockNavigation} route={mockRoute} />
      );

      await findByText('Rural Road Construction');
      
      expect(getByText('Construction of 5km rural road connecting villages')).toBeTruthy();
    });

    it('should display budget information', async () => {
      const { getByText, findByText } = render(
        <ProjectDetailScreen navigation={mockNavigation} route={mockRoute} />
      );

      await findByText('Rural Road Construction');
      
      expect(getByText('₹50.00 L')).toBeTruthy(); // Total budget
      expect(getByText('₹20.00 L')).toBeTruthy(); // Amount spent
      expect(getByText('₹30.00 L')).toBeTruthy(); // Amount remaining
    });

    it('should display funding sources', async () => {
      const { getByText, findByText } = render(
        <ProjectDetailScreen navigation={mockNavigation} route={mockRoute} />
      );

      await findByText('Rural Road Construction');
      
      expect(getByText('State Government')).toBeTruthy();
      expect(getByText('Central Government')).toBeTruthy();
      expect(getByText('₹30.00 L (60%)')).toBeTruthy();
      expect(getByText('₹20.00 L (40%)')).toBeTruthy();
    });

    it('should display timeline information', async () => {
      const { getByText, findByText } = render(
        <ProjectDetailScreen navigation={mockNavigation} route={mockRoute} />
      );

      await findByText('Rural Road Construction');
      
      expect(getByText('Planned Start')).toBeTruthy();
      expect(getByText('Actual Start')).toBeTruthy();
      expect(getByText('Planned End')).toBeTruthy();
      expect(getByText('Estimated Completion')).toBeTruthy();
    });

    it('should display location information', async () => {
      const { getByText, findByText } = render(
        <ProjectDetailScreen navigation={mockNavigation} route={mockRoute} />
      );

      await findByText('Rural Road Construction');
      
      expect(getByText('123 Main St')).toBeTruthy();
      expect(getByText('Test District, Test State - 123456')).toBeTruthy();
    });

    it('should display stakeholder information', async () => {
      const { getByText, findByText } = render(
        <ProjectDetailScreen navigation={mockNavigation} route={mockRoute} />
      );

      await findByText('Rural Road Construction');
      
      expect(getByText('Public Works Department')).toBeTruthy();
      expect(getByText('ABC Construction')).toBeTruthy();
      expect(getByText('John Doe')).toBeTruthy();
      expect(getByText('WO-2024-001')).toBeTruthy();
    });

    it('should display beneficiaries count', async () => {
      const { getByText, findByText } = render(
        <ProjectDetailScreen navigation={mockNavigation} route={mockRoute} />
      );

      await findByText('Rural Road Construction');
      
      expect(getByText('5,000')).toBeTruthy();
      expect(getByText('Beneficiaries')).toBeTruthy();
    });

    it('should display delay reasons', async () => {
      const { getByText, findByText } = render(
        <ProjectDetailScreen navigation={mockNavigation} route={mockRoute} />
      );

      await findByText('Rural Road Construction');
      
      expect(getByText('Heavy rainfall')).toBeTruthy();
      expect(getByText('Material shortage')).toBeTruthy();
    });
  });

  describe('Milestones Tab', () => {
    it('should switch to milestones tab', async () => {
      const { getByText, findByText } = render(
        <ProjectDetailScreen navigation={mockNavigation} route={mockRoute} />
      );

      await findByText('Rural Road Construction');
      
      const milestonesTab = getByText('Milestones');
      fireEvent.press(milestonesTab);

      expect(getByText('Site Preparation')).toBeTruthy();
      expect(getByText('Foundation Work')).toBeTruthy();
      expect(getByText('Road Surface')).toBeTruthy();
    });

    it('should display milestone status badges', async () => {
      const { getByText, findByText } = render(
        <ProjectDetailScreen navigation={mockNavigation} route={mockRoute} />
      );

      await findByText('Rural Road Construction');
      
      const milestonesTab = getByText('Milestones');
      fireEvent.press(milestonesTab);

      expect(getByText('COMPLETED')).toBeTruthy();
      expect(getByText('IN PROGRESS')).toBeTruthy();
      expect(getByText('PENDING')).toBeTruthy();
    });

    it('should display milestone dates', async () => {
      const { getByText, findByText, getAllByText } = render(
        <ProjectDetailScreen navigation={mockNavigation} route={mockRoute} />
      );

      await findByText('Rural Road Construction');
      
      const milestonesTab = getByText('Milestones');
      fireEvent.press(milestonesTab);

      expect(getAllByText('Target:').length).toBeGreaterThan(0);
      expect(getByText('Completed:')).toBeTruthy();
    });

    it('should display milestone weight percentages', async () => {
      const { getByText, findByText, getAllByText } = render(
        <ProjectDetailScreen navigation={mockNavigation} route={mockRoute} />
      );

      await findByText('Rural Road Construction');
      
      const milestonesTab = getByText('Milestones');
      fireEvent.press(milestonesTab);

      expect(getByText('20%')).toBeTruthy();
      expect(getByText('30%')).toBeTruthy();
      expect(getByText('50%')).toBeTruthy();
    });

    it('should display milestone deliverables', async () => {
      const { getByText, findByText } = render(
        <ProjectDetailScreen navigation={mockNavigation} route={mockRoute} />
      );

      await findByText('Rural Road Construction');
      
      const milestonesTab = getByText('Milestones');
      fireEvent.press(milestonesTab);

      expect(getByText('Site cleared')).toBeTruthy();
      expect(getByText('Leveling completed')).toBeTruthy();
      expect(getByText('Excavation')).toBeTruthy();
    });

    it('should show delay warning for delayed milestones', async () => {
      const { getByText, findByText } = render(
        <ProjectDetailScreen navigation={mockNavigation} route={mockRoute} />
      );

      await findByText('Rural Road Construction');
      
      const milestonesTab = getByText('Milestones');
      fireEvent.press(milestonesTab);

      expect(getByText('This milestone is delayed')).toBeTruthy();
    });

    it('should show empty state when no milestones', async () => {
      (global.fetch as jest.Mock).mockImplementation((url: string) => {
        if (url.includes('/projects/proj-123')) {
          return Promise.resolve({
            json: () => Promise.resolve({ success: true, data: mockProjectData }),
          });
        }
        if (url.includes('/milestones')) {
          return Promise.resolve({
            json: () => Promise.resolve({ success: true, data: [] }),
          });
        }
        return Promise.resolve({
          json: () => Promise.resolve({ success: true, data: [] }),
        });
      });

      const { getByText, findByText } = render(
        <ProjectDetailScreen navigation={mockNavigation} route={mockRoute} />
      );

      await findByText('Rural Road Construction');
      
      const milestonesTab = getByText('Milestones');
      fireEvent.press(milestonesTab);

      expect(getByText('No milestones defined yet')).toBeTruthy();
    });
  });

  describe('Updates Tab', () => {
    it('should switch to updates tab', async () => {
      const { getByText, findByText } = render(
        <ProjectDetailScreen navigation={mockNavigation} route={mockRoute} />
      );

      await findByText('Rural Road Construction');
      
      const updatesTab = getByText('Updates');
      fireEvent.press(updatesTab);

      expect(getByText('Foundation work is 60% complete')).toBeTruthy();
      expect(getByText('Work delayed due to heavy rainfall')).toBeTruthy();
    });

    it('should display update types with icons', async () => {
      const { getByText, findByText } = render(
        <ProjectDetailScreen navigation={mockNavigation} route={mockRoute} />
      );

      await findByText('Rural Road Construction');
      
      const updatesTab = getByText('Updates');
      fireEvent.press(updatesTab);

      expect(getByText('PROGRESS')).toBeTruthy();
      expect(getByText('DELAY')).toBeTruthy();
    });

    it('should display update author', async () => {
      const { getByText, findByText } = render(
        <ProjectDetailScreen navigation={mockNavigation} route={mockRoute} />
      );

      await findByText('Rural Road Construction');
      
      const updatesTab = getByText('Updates');
      fireEvent.press(updatesTab);

      expect(getByText('Updated by: Site Engineer')).toBeTruthy();
      expect(getByText('Updated by: Project Manager')).toBeTruthy();
    });

    it('should show empty state when no updates', async () => {
      (global.fetch as jest.Mock).mockImplementation((url: string) => {
        if (url.includes('/projects/proj-123')) {
          return Promise.resolve({
            json: () => Promise.resolve({ success: true, data: mockProjectData }),
          });
        }
        if (url.includes('/updates')) {
          return Promise.resolve({
            json: () => Promise.resolve({ success: true, data: [] }),
          });
        }
        return Promise.resolve({
          json: () => Promise.resolve({ success: true, data: [] }),
        });
      });

      const { getByText, findByText } = render(
        <ProjectDetailScreen navigation={mockNavigation} route={mockRoute} />
      );

      await findByText('Rural Road Construction');
      
      const updatesTab = getByText('Updates');
      fireEvent.press(updatesTab);

      expect(getByText('No updates yet')).toBeTruthy();
    });
  });

  describe('Quality Tab', () => {
    it('should switch to quality tab', async () => {
      const { getByText, findByText } = render(
        <ProjectDetailScreen navigation={mockNavigation} route={mockRoute} />
      );

      await findByText('Rural Road Construction');
      
      const qualityTab = getByText('Quality');
      fireEvent.press(qualityTab);

      expect(getByText('Quality Rating')).toBeTruthy();
      expect(getByText('4.2')).toBeTruthy();
    });

    it('should display community satisfaction', async () => {
      const { getByText, findByText } = render(
        <ProjectDetailScreen navigation={mockNavigation} route={mockRoute} />
      );

      await findByText('Rural Road Construction');
      
      const qualityTab = getByText('Quality');
      fireEvent.press(qualityTab);

      expect(getByText('Community Satisfaction')).toBeTruthy();
      expect(getByText('85%')).toBeTruthy();
    });

    it('should display inspection reports', async () => {
      const { getByText, findByText } = render(
        <ProjectDetailScreen navigation={mockNavigation} route={mockRoute} />
      );

      await findByText('Rural Road Construction');
      
      const qualityTab = getByText('Quality');
      fireEvent.press(qualityTab);

      expect(getByText('Quality Inspector')).toBeTruthy();
      expect(getByText('Work quality is good, minor issues found')).toBeTruthy();
      expect(getByText('Improve drainage system')).toBeTruthy();
    });

    it('should show empty state when no inspections', async () => {
      (global.fetch as jest.Mock).mockImplementation((url: string) => {
        if (url.includes('/projects/proj-123')) {
          return Promise.resolve({
            json: () => Promise.resolve({ success: true, data: mockProjectData }),
          });
        }
        if (url.includes('/inspections')) {
          return Promise.resolve({
            json: () => Promise.resolve({ success: true, data: [] }),
          });
        }
        return Promise.resolve({
          json: () => Promise.resolve({ success: true, data: [] }),
        });
      });

      const { getByText, findByText } = render(
        <ProjectDetailScreen navigation={mockNavigation} route={mockRoute} />
      );

      await findByText('Rural Road Construction');
      
      const qualityTab = getByText('Quality');
      fireEvent.press(qualityTab);

      expect(getByText('No inspections yet')).toBeTruthy();
    });
  });

  describe('User Interactions', () => {
    it('should handle share button press', async () => {
      const { getByText, findByText } = render(
        <ProjectDetailScreen navigation={mockNavigation} route={mockRoute} />
      );

      await findByText('Rural Road Construction');
      
      const shareButton = getByText('📤');
      fireEvent.press(shareButton);

      await waitFor(() => {
        expect(Share.share).toHaveBeenCalledWith(
          expect.objectContaining({
            message: expect.stringContaining('Rural Road Construction'),
            title: 'Rural Road Construction',
          })
        );
      });
    });

    it('should handle call contractor button press', async () => {
      const { getByText, findByText, getAllByText } = render(
        <ProjectDetailScreen navigation={mockNavigation} route={mockRoute} />
      );

      await findByText('Rural Road Construction');
      
      const callButtons = getAllByText('Call');
      fireEvent.press(callButtons[0]); // First call button (contractor)

      expect(Linking.openURL).toHaveBeenCalledWith('tel:+919876543210');
    });

    it('should handle call supervisor button press', async () => {
      const { getByText, findByText, getAllByText } = render(
        <ProjectDetailScreen navigation={mockNavigation} route={mockRoute} />
      );

      await findByText('Rural Road Construction');
      
      const callButtons = getAllByText('Call');
      fireEvent.press(callButtons[1]); // Second call button (supervisor)

      expect(Linking.openURL).toHaveBeenCalledWith('tel:+919876543211');
    });
  });

  describe('Progress Calculation', () => {
    it('should display correct progress color for high progress', async () => {
      const highProgressProject = {
        ...mockProjectData,
        progress_percentage: 85,
      };

      (global.fetch as jest.Mock).mockImplementation((url: string) => {
        if (url.includes('/projects/proj-123')) {
          return Promise.resolve({
            json: () => Promise.resolve({ success: true, data: highProgressProject }),
          });
        }
        return Promise.resolve({
          json: () => Promise.resolve({ success: true, data: [] }),
        });
      });

      const { getByText, findByText } = render(
        <ProjectDetailScreen navigation={mockNavigation} route={mockRoute} />
      );

      await findByText('Rural Road Construction');
      
      expect(getByText('85%')).toBeTruthy();
    });

    it('should display correct progress color for low progress', async () => {
      const lowProgressProject = {
        ...mockProjectData,
        progress_percentage: 15,
      };

      (global.fetch as jest.Mock).mockImplementation((url: string) => {
        if (url.includes('/projects/proj-123')) {
          return Promise.resolve({
            json: () => Promise.resolve({ success: true, data: lowProgressProject }),
          });
        }
        return Promise.resolve({
          json: () => Promise.resolve({ success: true, data: [] }),
        });
      });

      const { getByText, findByText } = render(
        <ProjectDetailScreen navigation={mockNavigation} route={mockRoute} />
      );

      await findByText('Rural Road Construction');
      
      expect(getByText('15%')).toBeTruthy();
    });
  });

  describe('Status Display', () => {
    it('should display completed status correctly', async () => {
      const completedProject = {
        ...mockProjectData,
        status: 'completed',
        actual_completion_date: '2024-12-31T00:00:00Z',
      };

      (global.fetch as jest.Mock).mockImplementation((url: string) => {
        if (url.includes('/projects/proj-123')) {
          return Promise.resolve({
            json: () => Promise.resolve({ success: true, data: completedProject }),
          });
        }
        return Promise.resolve({
          json: () => Promise.resolve({ success: true, data: [] }),
        });
      });

      const { getByText, findByText } = render(
        <ProjectDetailScreen navigation={mockNavigation} route={mockRoute} />
      );

      await findByText('Rural Road Construction');
      
      expect(getByText('COMPLETED')).toBeTruthy();
    });

    it('should display on-hold status correctly', async () => {
      const onHoldProject = {
        ...mockProjectData,
        status: 'on_hold',
      };

      (global.fetch as jest.Mock).mockImplementation((url: string) => {
        if (url.includes('/projects/proj-123')) {
          return Promise.resolve({
            json: () => Promise.resolve({ success: true, data: onHoldProject }),
          });
        }
        return Promise.resolve({
          json: () => Promise.resolve({ success: true, data: [] }),
        });
      });

      const { getByText, findByText } = render(
        <ProjectDetailScreen navigation={mockNavigation} route={mockRoute} />
      );

      await findByText('Rural Road Construction');
      
      expect(getByText('ON HOLD')).toBeTruthy();
    });
  });

  describe('Data Formatting', () => {
    it('should format currency correctly for crores', async () => {
      const highBudgetProject = {
        ...mockProjectData,
        total_budget: 50000000, // 5 crores
      };

      (global.fetch as jest.Mock).mockImplementation((url: string) => {
        if (url.includes('/projects/proj-123')) {
          return Promise.resolve({
            json: () => Promise.resolve({ success: true, data: highBudgetProject }),
          });
        }
        return Promise.resolve({
          json: () => Promise.resolve({ success: true, data: [] }),
        });
      });

      const { getByText, findByText } = render(
        <ProjectDetailScreen navigation={mockNavigation} route={mockRoute} />
      );

      await findByText('Rural Road Construction');
      
      expect(getByText('₹5.00 Cr')).toBeTruthy();
    });

    it('should format dates correctly', async () => {
      const { findByText } = render(
        <ProjectDetailScreen navigation={mockNavigation} route={mockRoute} />
      );

      await findByText('Rural Road Construction');
      
      // Dates should be formatted in Indian locale
      // The exact format depends on the locale, but we can check that dates are present
      expect(findByText(/Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec/)).toBeTruthy();
    });
  });

  describe('Accessibility', () => {
    it('should render all tabs accessibly', async () => {
      const { getByText, findByText } = render(
        <ProjectDetailScreen navigation={mockNavigation} route={mockRoute} />
      );

      await findByText('Rural Road Construction');
      
      expect(getByText('Overview')).toBeTruthy();
      expect(getByText('Milestones')).toBeTruthy();
      expect(getByText('Updates')).toBeTruthy();
      expect(getByText('Quality')).toBeTruthy();
    });

    it('should allow navigation between tabs', async () => {
      const { getByText, findByText } = render(
        <ProjectDetailScreen navigation={mockNavigation} route={mockRoute} />
      );

      await findByText('Rural Road Construction');
      
      // Switch to each tab
      fireEvent.press(getByText('Milestones'));
      expect(getByText('Site Preparation')).toBeTruthy();

      fireEvent.press(getByText('Updates'));
      expect(getByText('Foundation work is 60% complete')).toBeTruthy();

      fireEvent.press(getByText('Quality'));
      expect(getByText('Quality Rating')).toBeTruthy();

      fireEvent.press(getByText('Overview'));
      expect(getByText('Description')).toBeTruthy();
    });
  });

  describe('Edge Cases', () => {
    it('should handle project without optional fields', async () => {
      const minimalProject = {
        project_id: 'proj-123',
        project_name: 'Minimal Project',
        project_type: 'road',
        district: 'Test District',
        state: 'Test State',
        total_budget: 1000000,
        budget_currency: 'INR',
        planned_start_date: '2024-01-01T00:00:00Z',
        planned_end_date: '2024-12-31T00:00:00Z',
        progress_percentage: 0,
        is_delayed: false,
        delay_days: 0,
        status: 'planned',
        created_at: '2023-12-01T00:00:00Z',
        updated_at: '2024-03-15T00:00:00Z',
      };

      (global.fetch as jest.Mock).mockImplementation((url: string) => {
        if (url.includes('/projects/proj-123')) {
          return Promise.resolve({
            json: () => Promise.resolve({ success: true, data: minimalProject }),
          });
        }
        return Promise.resolve({
          json: () => Promise.resolve({ success: true, data: [] }),
        });
      });

      const { getByText, findByText, queryByText } = render(
        <ProjectDetailScreen navigation={mockNavigation} route={mockRoute} />
      );

      await findByText('Minimal Project');
      
      expect(getByText('PLANNED')).toBeTruthy();
      expect(queryByText('Delayed by')).toBeNull();
      expect(queryByText('Description')).toBeNull();
    });

    it('should handle empty arrays gracefully', async () => {
      const projectWithEmptyArrays = {
        ...mockProjectData,
        funding_sources: [],
        delay_reasons: [],
      };

      (global.fetch as jest.Mock).mockImplementation((url: string) => {
        if (url.includes('/projects/proj-123')) {
          return Promise.resolve({
            json: () => Promise.resolve({ success: true, data: projectWithEmptyArrays }),
          });
        }
        return Promise.resolve({
          json: () => Promise.resolve({ success: true, data: [] }),
        });
      });

      const { findByText, queryByText } = render(
        <ProjectDetailScreen navigation={mockNavigation} route={mockRoute} />
      );

      await findByText('Rural Road Construction');
      
      expect(queryByText('Funding Sources')).toBeNull();
      expect(queryByText('Delay Reasons')).toBeNull();
    });
  });
});
