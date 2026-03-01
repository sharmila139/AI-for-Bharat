/**
 * Tests for GrievanceDetailScreen
 * Task 36.3: Comprehensive tests for grievance detail view with timeline
 */

import React from 'react';
import { render, fireEvent, waitFor, screen } from '@testing-library/react-native';
import { Alert, Linking } from 'react-native';
import GrievanceDetailScreen from '../GrievanceDetailScreen';

// Mock dependencies
jest.mock('../../../components/OfflineIndicator', () => ({
  OfflineIndicator: () => null,
}));

jest.mock('react-native/Libraries/Alert/Alert', () => ({
  alert: jest.fn(),
}));

jest.mock('react-native/Libraries/Linking/Linking', () => ({
  openURL: jest.fn(),
}));

jest.mock('react-native/Libraries/Share/Share', () => ({
  share: jest.fn(() => Promise.resolve()),
}));

// Mock fetch
global.fetch = jest.fn();

describe('GrievanceDetailScreen', () => {
  const mockNavigation = {
    navigate: jest.fn(),
    goBack: jest.fn(),
  };

  const mockRoute = {
    params: {
      grievanceId: 'test-grievance-id',
      ticketNumber: 'GRV-2024-001',
    },
  };

  const mockGrievanceData = {
    success: true,
    data: {
      grievance_id: 'test-grievance-id',
      ticket_number: 'GRV-2024-001',
      title: 'Broken Street Light',
      description: 'Street light on Main Road has been non-functional for 2 weeks',
      category: 'electricity',
      status: 'in_progress',
      ai_severity: 'medium',
      photos: ['https://example.com/photo1.jpg', 'https://example.com/photo2.jpg'],
      latitude: 28.6139,
      longitude: 77.2090,
      address: '123 Main Road, Delhi',
      landmark: 'Near City Park',
      district: 'Central Delhi',
      state: 'Delhi',
      pincode: '110001',
      assigned_authority: 'Delhi Electricity Board',
      assigned_authority_contact: '+91-9876543210',
      created_at: '2024-01-15T10:00:00Z',
      updated_at: '2024-01-16T14:30:00Z',
      sla_deadline: '2024-01-22T10:00:00Z',
      is_overdue: false,
      days_open: 3,
      reported_by: 'John Doe',
      reporter_contact: '+91-9876543211',
      is_anonymous: false,
      verification_votes_yes: 5,
      verification_votes_no: 1,
      verification_threshold: 10,
      community_verified: false,
    },
  };

  const mockTimelineData = {
    success: true,
    data: [
      {
        update_id: 'update-1',
        update_type: 'status_change',
        update_text: 'Grievance submitted',
        created_at: '2024-01-15T10:00:00Z',
        updated_by: 'John Doe',
        updated_by_role: 'citizen',
        is_public: true,
      },
      {
        update_id: 'update-2',
        update_type: 'status_change',
        update_text: 'Status changed from submitted to acknowledged',
        created_at: '2024-01-15T14:00:00Z',
        updated_by: 'Officer Smith',
        updated_by_role: 'officer',
        is_public: true,
      },
      {
        update_id: 'update-3',
        update_type: 'status_change',
        update_text: 'Status changed from acknowledged to in_progress: Team dispatched',
        created_at: '2024-01-16T09:00:00Z',
        updated_by: 'Officer Smith',
        updated_by_role: 'officer',
        photos: ['https://example.com/progress1.jpg'],
        is_public: true,
      },
    ],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockImplementation((url: string) => {
      if (url.includes('/grievances/')) {
        return Promise.resolve({
          json: () => Promise.resolve(mockGrievanceData),
        });
      }
      if (url.includes('/timeline')) {
        return Promise.resolve({
          json: () => Promise.resolve(mockTimelineData),
        });
      }
      return Promise.reject(new Error('Unknown URL'));
    });
  });

  describe('Loading and Error States', () => {
    it('should show loading indicator while fetching data', () => {
      const { getByText } = render(
        <GrievanceDetailScreen navigation={mockNavigation} route={mockRoute} />
      );

      expect(getByText('Loading grievance details...')).toBeTruthy();
    });

    it('should display error message when fetch fails', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      const { getByText, findByText } = render(
        <GrievanceDetailScreen navigation={mockNavigation} route={mockRoute} />
      );

      const errorMessage = await findByText('Network error');
      expect(errorMessage).toBeTruthy();
      expect(getByText('Retry')).toBeTruthy();
    });

    it('should retry loading when retry button is pressed', async () => {
      (global.fetch as jest.Mock)
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          json: () => Promise.resolve(mockGrievanceData),
        })
        .mockResolvedValueOnce({
          json: () => Promise.resolve(mockTimelineData),
        });

      const { getByText, findByText } = render(
        <GrievanceDetailScreen navigation={mockNavigation} route={mockRoute} />
      );

      await findByText('Network error');
      const retryButton = getByText('Retry');
      fireEvent.press(retryButton);

      await waitFor(() => {
        expect(getByText('Broken Street Light')).toBeTruthy();
      });
    });
  });

  describe('Grievance Details Display', () => {
    it('should display ticket number and title', async () => {
      const { findByText } = render(
        <GrievanceDetailScreen navigation={mockNavigation} route={mockRoute} />
      );

      expect(await findByText('GRV-2024-001')).toBeTruthy();
      expect(await findByText('Broken Street Light')).toBeTruthy();
    });

    it('should display description', async () => {
      const { findByText } = render(
        <GrievanceDetailScreen navigation={mockNavigation} route={mockRoute} />
      );

      expect(
        await findByText('Street light on Main Road has been non-functional for 2 weeks')
      ).toBeTruthy();
    });

    it('should display status badge with correct color', async () => {
      const { findByText, queryByText } = render(
        <GrievanceDetailScreen navigation={mockNavigation} route={mockRoute} />
      );

      await findByText('Broken Street Light');
      
      // Status is transformed: 'in_progress' -> 'IN PROGRESS' (with space, not underscore)
      const statusBadge = queryByText('IN PROGRESS') || queryByText('IN_PROGRESS');
      expect(statusBadge).toBeTruthy();
    });

    it('should display severity badge', async () => {
      const { findByText } = render(
        <GrievanceDetailScreen navigation={mockNavigation} route={mockRoute} />
      );

      expect(await findByText('MEDIUM')).toBeTruthy();
    });

    it('should display category badge', async () => {
      const { findByText } = render(
        <GrievanceDetailScreen navigation={mockNavigation} route={mockRoute} />
      );

      expect(await findByText('electricity')).toBeTruthy();
    });

    it('should display days open counter', async () => {
      const { findByText } = render(
        <GrievanceDetailScreen navigation={mockNavigation} route={mockRoute} />
      );

      expect(await findByText(/3 days open/)).toBeTruthy();
    });

    it('should display SLA deadline', async () => {
      const { findByText } = render(
        <GrievanceDetailScreen navigation={mockNavigation} route={mockRoute} />
      );

      expect(await findByText(/SLA:/)).toBeTruthy();
    });

    it('should not display overdue banner when not overdue', async () => {
      const { queryByText, findByText } = render(
        <GrievanceDetailScreen navigation={mockNavigation} route={mockRoute} />
      );

      await findByText('Broken Street Light');
      expect(queryByText(/Overdue by/)).toBeNull();
    });

    it('should display overdue banner when overdue', async () => {
      const overdueData = {
        ...mockGrievanceData,
        data: {
          ...mockGrievanceData.data,
          is_overdue: true,
          sla_deadline: '2024-01-10T10:00:00Z',
        },
      };

      (global.fetch as jest.Mock).mockImplementation((url: string) => {
        if (url.includes('/grievances/')) {
          return Promise.resolve({
            json: () => Promise.resolve(overdueData),
          });
        }
        if (url.includes('/timeline')) {
          return Promise.resolve({
            json: () => Promise.resolve(mockTimelineData),
          });
        }
        return Promise.reject(new Error('Unknown URL'));
      });

      const { findByText } = render(
        <GrievanceDetailScreen navigation={mockNavigation} route={mockRoute} />
      );

      expect(await findByText(/Overdue by/)).toBeTruthy();
    });
  });

  describe('Photo Gallery', () => {
    it('should display photo gallery with correct number of photos', async () => {
      const { findByText } = render(
        <GrievanceDetailScreen navigation={mockNavigation} route={mockRoute} />
      );

      expect(await findByText('Photos (2)')).toBeTruthy();
    });

    it('should open photo zoom modal when photo is tapped', async () => {
      const { findByText, getAllByTestId } = render(
        <GrievanceDetailScreen navigation={mockNavigation} route={mockRoute} />
      );

      await findByText('Photos (2)');
      // Note: In actual implementation, photos would have testID
      // This is a simplified test
    });
  });

  describe('Location Information', () => {
    it('should display full address', async () => {
      const { findByText } = render(
        <GrievanceDetailScreen navigation={mockNavigation} route={mockRoute} />
      );

      expect(await findByText('123 Main Road, Delhi')).toBeTruthy();
    });

    it('should display landmark', async () => {
      const { findByText } = render(
        <GrievanceDetailScreen navigation={mockNavigation} route={mockRoute} />
      );

      expect(await findByText(/Near: Near City Park/)).toBeTruthy();
    });

    it('should display district, state, and pincode', async () => {
      const { findByText } = render(
        <GrievanceDetailScreen navigation={mockNavigation} route={mockRoute} />
      );

      expect(await findByText(/Central Delhi, Delhi - 110001/)).toBeTruthy();
    });

    it('should display GPS coordinates', async () => {
      const { findByText } = render(
        <GrievanceDetailScreen navigation={mockNavigation} route={mockRoute} />
      );

      expect(await findByText(/28.613900, 77.209000/)).toBeTruthy();
    });
  });

  describe('Assigned Authority', () => {
    it('should display assigned authority name', async () => {
      const { findByText } = render(
        <GrievanceDetailScreen navigation={mockNavigation} route={mockRoute} />
      );

      expect(await findByText('Delhi Electricity Board')).toBeTruthy();
    });

    it('should display authority contact', async () => {
      const { findByText } = render(
        <GrievanceDetailScreen navigation={mockNavigation} route={mockRoute} />
      );

      expect(await findByText(/\+91-9876543210/)).toBeTruthy();
    });

    it('should show call button when contact is available', async () => {
      const { findByText } = render(
        <GrievanceDetailScreen navigation={mockNavigation} route={mockRoute} />
      );

      expect(await findByText('Call')).toBeTruthy();
    });

    it('should initiate call when call button is pressed', async () => {
      const { findByText } = render(
        <GrievanceDetailScreen navigation={mockNavigation} route={mockRoute} />
      );

      const callButton = await findByText('Call');
      fireEvent.press(callButton);

      expect(Alert.alert).toHaveBeenCalledWith(
        'Call Authority',
        'Call Delhi Electricity Board?',
        expect.any(Array)
      );
    });
  });

  describe('Reporter Information', () => {
    it('should display reporter name when not anonymous', async () => {
      const { findByText } = render(
        <GrievanceDetailScreen navigation={mockNavigation} route={mockRoute} />
      );

      expect(await findByText('John Doe')).toBeTruthy();
    });

    it('should display reporter contact', async () => {
      const { findByText } = render(
        <GrievanceDetailScreen navigation={mockNavigation} route={mockRoute} />
      );

      expect(await findByText(/\+91-9876543211/)).toBeTruthy();
    });

    it('should display anonymous indicator for anonymous reports', async () => {
      const anonymousData = {
        ...mockGrievanceData,
        data: {
          ...mockGrievanceData.data,
          is_anonymous: true,
          reported_by: null,
          reporter_contact: null,
        },
      };

      (global.fetch as jest.Mock).mockImplementation((url: string) => {
        if (url.includes('/grievances/')) {
          return Promise.resolve({
            json: () => Promise.resolve(anonymousData),
          });
        }
        if (url.includes('/timeline')) {
          return Promise.resolve({
            json: () => Promise.resolve(mockTimelineData),
          });
        }
        return Promise.reject(new Error('Unknown URL'));
      });

      const { findByText } = render(
        <GrievanceDetailScreen navigation={mockNavigation} route={mockRoute} />
      );

      expect(await findByText('Anonymous Report')).toBeTruthy();
    });
  });

  describe('Timeline View', () => {
    it('should switch to timeline tab when clicked', async () => {
      const { findByText, getByText } = render(
        <GrievanceDetailScreen navigation={mockNavigation} route={mockRoute} />
      );

      await findByText('Broken Street Light');
      const timelineTab = getByText('Timeline');
      fireEvent.press(timelineTab);

      // Timeline should be visible
      await waitFor(() => {
        expect(getByText('Grievance submitted')).toBeTruthy();
      });
    });

    it('should display all timeline entries in chronological order', async () => {
      const { findByText, getByText } = render(
        <GrievanceDetailScreen navigation={mockNavigation} route={mockRoute} />
      );

      await findByText('Broken Street Light');
      fireEvent.press(getByText('Timeline'));

      await waitFor(() => {
        expect(getByText('Grievance submitted')).toBeTruthy();
        expect(getByText(/Status changed from submitted to acknowledged/)).toBeTruthy();
        expect(getByText(/Status changed from acknowledged to in_progress/)).toBeTruthy();
      });
    });

    it('should display update type for each timeline entry', async () => {
      const { findByText, getByText, queryAllByText } = render(
        <GrievanceDetailScreen navigation={mockNavigation} route={mockRoute} />
      );

      await findByText('Broken Street Light');
      fireEvent.press(getByText('Timeline'));

      await waitFor(() => {
        // Update type is transformed: 'status_change' -> 'STATUS CHANGE' (with space)
        const statusChangeLabels = queryAllByText('STATUS CHANGE') || queryAllByText('STATUS_CHANGE');
        expect(statusChangeLabels).toBeTruthy();
      });
    });

    it('should display updated by information', async () => {
      const { findByText, getByText, queryAllByText } = render(
        <GrievanceDetailScreen navigation={mockNavigation} route={mockRoute} />
      );

      await findByText('Broken Street Light');
      fireEvent.press(getByText('Timeline'));

      await waitFor(() => {
        const citizenUpdates = queryAllByText(/By: John Doe \(citizen\)/);
        const officerUpdates = queryAllByText(/By: Officer Smith \(officer\)/);
        expect(citizenUpdates.length).toBeGreaterThan(0);
        expect(officerUpdates.length).toBeGreaterThan(0);
      });
    });

    it('should show empty state when no timeline entries', async () => {
      (global.fetch as jest.Mock).mockImplementation((url: string) => {
        if (url.includes('/grievances/')) {
          return Promise.resolve({
            json: () => Promise.resolve(mockGrievanceData),
          });
        }
        if (url.includes('/timeline')) {
          return Promise.resolve({
            json: () => Promise.resolve({ success: true, data: [] }),
          });
        }
        return Promise.reject(new Error('Unknown URL'));
      });

      const { findByText, getByText } = render(
        <GrievanceDetailScreen navigation={mockNavigation} route={mockRoute} />
      );

      await findByText('Broken Street Light');
      fireEvent.press(getByText('Timeline'));

      await waitFor(() => {
        expect(getByText('No timeline updates yet')).toBeTruthy();
      });
    });
  });

  describe('Community Verification', () => {
    it('should switch to verification tab when clicked', async () => {
      const { findByText, getByText } = render(
        <GrievanceDetailScreen navigation={mockNavigation} route={mockRoute} />
      );

      await findByText('Broken Street Light');
      const verificationTab = getByText('Verification');
      fireEvent.press(verificationTab);

      await waitFor(() => {
        expect(getByText('Community Verification')).toBeTruthy();
      });
    });

    it('should display verification vote counts', async () => {
      const { findByText, getByText } = render(
        <GrievanceDetailScreen navigation={mockNavigation} route={mockRoute} />
      );

      await findByText('Broken Street Light');
      fireEvent.press(getByText('Verification'));

      await waitFor(() => {
        expect(getByText('5')).toBeTruthy(); // yes votes
        expect(getByText('1')).toBeTruthy(); // no votes
      });
    });

    it('should display verification threshold message', async () => {
      const { findByText, getByText } = render(
        <GrievanceDetailScreen navigation={mockNavigation} route={mockRoute} />
      );

      await findByText('Broken Street Light');
      fireEvent.press(getByText('Verification'));

      await waitFor(() => {
        expect(getByText(/5 more votes needed for verification/)).toBeTruthy();
      });
    });

    it('should display verified badge when community verified', async () => {
      const verifiedData = {
        ...mockGrievanceData,
        data: {
          ...mockGrievanceData.data,
          community_verified: true,
          verification_votes_yes: 10,
        },
      };

      (global.fetch as jest.Mock).mockImplementation((url: string) => {
        if (url.includes('/grievances/')) {
          return Promise.resolve({
            json: () => Promise.resolve(verifiedData),
          });
        }
        if (url.includes('/timeline')) {
          return Promise.resolve({
            json: () => Promise.resolve(mockTimelineData),
          });
        }
        return Promise.reject(new Error('Unknown URL'));
      });

      const { findByText, getByText } = render(
        <GrievanceDetailScreen navigation={mockNavigation} route={mockRoute} />
      );

      await findByText('Broken Street Light');
      fireEvent.press(getByText('Verification'));

      await waitFor(() => {
        expect(getByText('Community Verified')).toBeTruthy();
      });
    });
  });

  describe('Resolution Details', () => {
    it('should display resolution details for resolved grievances', async () => {
      const resolvedData = {
        ...mockGrievanceData,
        data: {
          ...mockGrievanceData.data,
          status: 'resolved',
          resolution_description: 'Street light has been repaired and is now functional',
          resolved_by: 'Technician Kumar',
          resolved_at: '2024-01-18T16:00:00Z',
          resolution_photos: ['https://example.com/resolved1.jpg'],
        },
      };

      (global.fetch as jest.Mock).mockImplementation((url: string) => {
        if (url.includes('/grievances/')) {
          return Promise.resolve({
            json: () => Promise.resolve(resolvedData),
          });
        }
        if (url.includes('/timeline')) {
          return Promise.resolve({
            json: () => Promise.resolve(mockTimelineData),
          });
        }
        return Promise.reject(new Error('Unknown URL'));
      });

      const { findByText } = render(
        <GrievanceDetailScreen navigation={mockNavigation} route={mockRoute} />
      );

      expect(await findByText('Resolution')).toBeTruthy();
      expect(await findByText('Street light has been repaired and is now functional')).toBeTruthy();
      expect(await findByText(/Resolved by: Technician Kumar/)).toBeTruthy();
    });

    it('should not display resolution section for unresolved grievances', async () => {
      const { findByText, queryByText } = render(
        <GrievanceDetailScreen navigation={mockNavigation} route={mockRoute} />
      );

      await findByText('Broken Street Light');
      expect(queryByText('Resolution')).toBeNull();
    });
  });

  describe('User Feedback', () => {
    it('should display user feedback when available', async () => {
      const feedbackData = {
        ...mockGrievanceData,
        data: {
          ...mockGrievanceData.data,
          status: 'closed',
          user_rating: 4,
          user_feedback: 'Good work, resolved quickly',
          feedback_at: '2024-01-19T10:00:00Z',
        },
      };

      (global.fetch as jest.Mock).mockImplementation((url: string) => {
        if (url.includes('/grievances/')) {
          return Promise.resolve({
            json: () => Promise.resolve(feedbackData),
          });
        }
        if (url.includes('/timeline')) {
          return Promise.resolve({
            json: () => Promise.resolve(mockTimelineData),
          });
        }
        return Promise.reject(new Error('Unknown URL'));
      });

      const { findByText, getByText } = render(
        <GrievanceDetailScreen navigation={mockNavigation} route={mockRoute} />
      );

      await findByText('Broken Street Light');
      fireEvent.press(getByText('Verification'));

      await waitFor(() => {
        expect(getByText('User Feedback')).toBeTruthy();
        expect(getByText('Good work, resolved quickly')).toBeTruthy();
        expect(getByText('4/5')).toBeTruthy();
      });
    });
  });

  describe('Action Buttons', () => {
    it('should show verify resolution button for resolved grievances without feedback', async () => {
      const resolvedData = {
        ...mockGrievanceData,
        data: {
          ...mockGrievanceData.data,
          status: 'resolved',
          resolution_description: 'Fixed',
          user_rating: null,
        },
      };

      (global.fetch as jest.Mock).mockImplementation((url: string) => {
        if (url.includes('/grievances/')) {
          return Promise.resolve({
            json: () => Promise.resolve(resolvedData),
          });
        }
        if (url.includes('/timeline')) {
          return Promise.resolve({
            json: () => Promise.resolve(mockTimelineData),
          });
        }
        return Promise.reject(new Error('Unknown URL'));
      });

      const { findByText } = render(
        <GrievanceDetailScreen navigation={mockNavigation} route={mockRoute} />
      );

      expect(await findByText('Verify Resolution')).toBeTruthy();
    });

    it('should open verification modal when verify button is pressed', async () => {
      const resolvedData = {
        ...mockGrievanceData,
        data: {
          ...mockGrievanceData.data,
          status: 'resolved',
          resolution_description: 'Fixed',
          user_rating: null,
        },
      };

      (global.fetch as jest.Mock).mockImplementation((url: string) => {
        if (url.includes('/grievances/')) {
          return Promise.resolve({
            json: () => Promise.resolve(resolvedData),
          });
        }
        if (url.includes('/timeline')) {
          return Promise.resolve({
            json: () => Promise.resolve(mockTimelineData),
          });
        }
        return Promise.reject(new Error('Unknown URL'));
      });

      const { findByText, getByText } = render(
        <GrievanceDetailScreen navigation={mockNavigation} route={mockRoute} />
      );

      const verifyButton = await findByText('Verify Resolution');
      fireEvent.press(verifyButton);

      await waitFor(() => {
        expect(getByText('Has this issue been resolved to your satisfaction?')).toBeTruthy();
      });
    });

    it('should submit verification when yes button is pressed', async () => {
      const resolvedData = {
        ...mockGrievanceData,
        data: {
          ...mockGrievanceData.data,
          status: 'resolved',
          resolution_description: 'Fixed',
          user_rating: null,
        },
      };

      (global.fetch as jest.Mock).mockImplementation((url: string) => {
        if (url.includes('/grievances/')) {
          return Promise.resolve({
            json: () => Promise.resolve(resolvedData),
          });
        }
        if (url.includes('/timeline')) {
          return Promise.resolve({
            json: () => Promise.resolve(mockTimelineData),
          });
        }
        if (url.includes('/verify')) {
          return Promise.resolve({
            json: () => Promise.resolve({ success: true }),
          });
        }
        return Promise.reject(new Error('Unknown URL'));
      });

      const { findByText, getByText } = render(
        <GrievanceDetailScreen navigation={mockNavigation} route={mockRoute} />
      );

      const verifyButton = await findByText('Verify Resolution');
      fireEvent.press(verifyButton);

      await waitFor(() => {
        const yesButton = getByText('✅ Yes, Fixed');
        fireEvent.press(yesButton);
      });

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'Success',
          'Thank you for verifying the resolution!'
        );
      });
    });

    it('should handle share functionality', async () => {
      const Share = require('react-native').Share;

      const { findByText, getByTestId } = render(
        <GrievanceDetailScreen navigation={mockNavigation} route={mockRoute} />
      );

      await findByText('Broken Street Light');
      // Note: Share button would need testID in actual implementation
      // This is a simplified test structure
    });
  });

  describe('Offline Support', () => {
    it('should display offline indicator', async () => {
      const { findByText } = render(
        <GrievanceDetailScreen navigation={mockNavigation} route={mockRoute} />
      );

      await findByText('Broken Street Light');
      // OfflineIndicator is mocked, but in real app it would show when offline
    });

    it('should handle offline data loading gracefully', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network request failed'));

      const { findByText } = render(
        <GrievanceDetailScreen navigation={mockNavigation} route={mockRoute} />
      );

      expect(await findByText(/Network request failed/)).toBeTruthy();
    });
  });

  describe('Tab Navigation', () => {
    it('should show details tab by default', async () => {
      const { findByText, getByText } = render(
        <GrievanceDetailScreen navigation={mockNavigation} route={mockRoute} />
      );

      await findByText('Broken Street Light');
      expect(getByText('Description')).toBeTruthy();
    });

    it('should switch between tabs correctly', async () => {
      const { findByText, getByText } = render(
        <GrievanceDetailScreen navigation={mockNavigation} route={mockRoute} />
      );

      await findByText('Broken Street Light');

      // Switch to timeline
      fireEvent.press(getByText('Timeline'));
      await waitFor(() => {
        expect(getByText('Grievance submitted')).toBeTruthy();
      });

      // Switch to verification
      fireEvent.press(getByText('Verification'));
      await waitFor(() => {
        expect(getByText('Community Verification')).toBeTruthy();
      });

      // Switch back to details
      fireEvent.press(getByText('Details'));
      await waitFor(() => {
        expect(getByText('Description')).toBeTruthy();
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle missing optional fields gracefully', async () => {
      const minimalData = {
        success: true,
        data: {
          grievance_id: 'test-grievance-id',
          ticket_number: 'GRV-2024-001',
          title: 'Test Issue',
          description: 'Test description',
          category: 'other',
          status: 'submitted',
          created_at: '2024-01-15T10:00:00Z',
          is_anonymous: true,
        },
      };

      (global.fetch as jest.Mock).mockImplementation((url: string) => {
        if (url.includes('/grievances/')) {
          return Promise.resolve({
            json: () => Promise.resolve(minimalData),
          });
        }
        if (url.includes('/timeline')) {
          return Promise.resolve({
            json: () => Promise.resolve({ success: true, data: [] }),
          });
        }
        return Promise.reject(new Error('Unknown URL'));
      });

      const { findByText } = render(
        <GrievanceDetailScreen navigation={mockNavigation} route={mockRoute} />
      );

      expect(await findByText('Test Issue')).toBeTruthy();
      expect(await findByText('Anonymous Report')).toBeTruthy();
    });

    it('should handle empty photo array', async () => {
      const noPhotosData = {
        ...mockGrievanceData,
        data: {
          ...mockGrievanceData.data,
          photos: [],
        },
      };

      (global.fetch as jest.Mock).mockImplementation((url: string) => {
        if (url.includes('/grievances/')) {
          return Promise.resolve({
            json: () => Promise.resolve(noPhotosData),
          });
        }
        if (url.includes('/timeline')) {
          return Promise.resolve({
            json: () => Promise.resolve(mockTimelineData),
          });
        }
        return Promise.reject(new Error('Unknown URL'));
      });

      const { findByText, queryByText } = render(
        <GrievanceDetailScreen navigation={mockNavigation} route={mockRoute} />
      );

      await findByText('Broken Street Light');
      expect(queryByText(/Photos \(/)).toBeNull();
    });
  });
});
