/**
 * GrievanceReportScreen Tests
 * Comprehensive test suite for grievance reporting functionality
 */

import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { Alert } from 'react-native';
import GrievanceReportScreen from '../GrievanceReportScreen';
import * as grievanceApi from '../../../services/api/grievance-api';
import SyncQueue from '../../../services/sync/sync-queue';
import BackgroundSyncService from '../../../services/sync/background-sync';

// Mock dependencies
jest.mock('../../../services/api/grievance-api');
jest.mock('../../../services/sync/sync-queue');
jest.mock('../../../services/sync/background-sync');
jest.mock('../../../components/grievance/PhotoCapture', () => ({
  PhotoCapture: ({ photos, onPhotosChange }: any) => {
    const { View, Text, TouchableOpacity } = require('react-native');
    return (
      <View testID="photo-capture">
        <Text>Photos: {photos.length}</Text>
        <TouchableOpacity
          testID="add-photo-button"
          onPress={() => {
            onPhotosChange([
              ...photos,
              {
                uri: 'file://test-photo.jpg',
                type: 'image/jpeg',
                name: 'test-photo.jpg',
                size: 100000,
              },
            ]);
          }}
        >
          <Text>Add Photo</Text>
        </TouchableOpacity>
      </View>
    );
  },
}));

jest.mock('../../../components/grievance/CategorySelector', () => ({
  CategorySelector: ({ selectedCategory, onCategoryChange }: any) => {
    const { View, Text, TouchableOpacity } = require('react-native');
    return (
      <View testID="category-selector">
        <Text>Category: {selectedCategory || 'None'}</Text>
        <TouchableOpacity
          testID="select-category-button"
          onPress={() => onCategoryChange('road')}
        >
          <Text>Select Road</Text>
        </TouchableOpacity>
      </View>
    );
  },
}));

jest.mock('../../../components/grievance/LocationPicker', () => ({
  LocationPicker: ({ location, onLocationChange }: any) => {
    const { View, Text, TouchableOpacity } = require('react-native');
    return (
      <View testID="location-picker">
        <Text>
          Location: {location ? `${location.latitude}, ${location.longitude}` : 'None'}
        </Text>
        <TouchableOpacity
          testID="set-location-button"
          onPress={() => {
            onLocationChange({
              latitude: 12.9716,
              longitude: 77.5946,
              accuracy: 10,
            });
          }}
        >
          <Text>Set Location</Text>
        </TouchableOpacity>
      </View>
    );
  },
}));

jest.mock('../../../components/OfflineIndicator', () => ({
  OfflineIndicator: () => null,
}));

// Mock Alert
jest.spyOn(Alert, 'alert');

describe('GrievanceReportScreen', () => {
  const mockNavigation = {
    goBack: jest.fn(),
    replace: jest.fn(),
    navigate: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock online status
    (BackgroundSyncService.getConnectivityStatus as jest.Mock).mockReturnValue({
      isOnline: true,
    });
    (BackgroundSyncService.addConnectivityListener as jest.Mock).mockImplementation(() => {});
    (BackgroundSyncService.removeConnectivityListener as jest.Mock).mockImplementation(() => {});
    
    // Mock successful submission
    (grievanceApi.submitGrievance as jest.Mock).mockResolvedValue({
      ticketNumber: 'GRV-2024-001',
      isDuplicate: false,
    });
    
    // Mock AI classification
    (grievanceApi.classifyGrievancePhoto as jest.Mock).mockResolvedValue({
      category: 'road',
      confidence: 90,
      severity: 'high',
    });
  });

  describe('Form Rendering', () => {
    it('should render all form sections', () => {
      const { getByText, getByPlaceholderText, getByTestId } = render(
        <GrievanceReportScreen navigation={mockNavigation} />
      );

      expect(getByText('Report Infrastructure Issue')).toBeTruthy();
      expect(getByTestId('photo-capture')).toBeTruthy();
      expect(getByPlaceholderText(/Brief title/i)).toBeTruthy();
      expect(getByPlaceholderText(/Describe the issue/i)).toBeTruthy();
      expect(getByTestId('category-selector')).toBeTruthy();
      expect(getByTestId('location-picker')).toBeTruthy();
    });

    it('should render anonymous reporting checkbox', () => {
      const { getByText } = render(
        <GrievanceReportScreen navigation={mockNavigation} />
      );

      expect(getByText('Report Anonymously')).toBeTruthy();
      expect(getByText('Your identity will be kept private')).toBeTruthy();
    });

    it('should show submit button', () => {
      const { getByText } = render(
        <GrievanceReportScreen navigation={mockNavigation} />
      );

      expect(getByText('Submit Grievance')).toBeTruthy();
    });
  });

  describe('Form Validation', () => {
    it('should show error when submitting without photo', async () => {
      const { getByText } = render(
        <GrievanceReportScreen navigation={mockNavigation} />
      );

      const submitButton = getByText('Submit Grievance');
      fireEvent.press(submitButton);

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'Photo Required',
          'Please add at least one photo of the issue.'
        );
      });
    });

    it('should show error when submitting without title', async () => {
      const { getByText, getByTestId } = render(
        <GrievanceReportScreen navigation={mockNavigation} />
      );

      // Add photo
      const addPhotoButton = getByTestId('add-photo-button');
      fireEvent.press(addPhotoButton);

      // Try to submit
      const submitButton = getByText('Submit Grievance');
      fireEvent.press(submitButton);

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'Title Required',
          'Please provide a brief title for the issue.'
        );
      });
    });

    it('should show error when submitting without description', async () => {
      const { getByText, getByTestId, getByPlaceholderText } = render(
        <GrievanceReportScreen navigation={mockNavigation} />
      );

      // Add photo
      fireEvent.press(getByTestId('add-photo-button'));

      // Add title
      const titleInput = getByPlaceholderText(/Brief title/i);
      fireEvent.changeText(titleInput, 'Test Issue');

      // Try to submit
      fireEvent.press(getByText('Submit Grievance'));

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'Description Required',
          'Please describe the issue in detail.'
        );
      });
    });

    it('should show error when submitting without category', async () => {
      const { getByText, getByTestId, getByPlaceholderText } = render(
        <GrievanceReportScreen navigation={mockNavigation} />
      );

      // Add photo
      fireEvent.press(getByTestId('add-photo-button'));

      // Add title
      fireEvent.changeText(getByPlaceholderText(/Brief title/i), 'Test Issue');

      // Add description
      fireEvent.changeText(
        getByPlaceholderText(/Describe the issue/i),
        'This is a test description'
      );

      // Try to submit
      fireEvent.press(getByText('Submit Grievance'));

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'Category Required',
          'Please select or verify the issue category.'
        );
      });
    });

    it('should show error when anonymous reporting without contact', async () => {
      const { getByText, getByTestId, getByPlaceholderText } = render(
        <GrievanceReportScreen navigation={mockNavigation} />
      );

      // Add photo
      fireEvent.press(getByTestId('add-photo-button'));

      // Add title and description
      fireEvent.changeText(getByPlaceholderText(/Brief title/i), 'Test Issue');
      fireEvent.changeText(
        getByPlaceholderText(/Describe the issue/i),
        'Test description'
      );

      // Select category
      fireEvent.press(getByTestId('select-category-button'));

      // Enable anonymous reporting
      const anonymousCheckbox = getByText('Report Anonymously');
      fireEvent.press(anonymousCheckbox);

      // Try to submit
      fireEvent.press(getByText('Submit Grievance'));

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'Contact Required',
          'For anonymous reports, please provide a contact number for follow-up.'
        );
      });
    });
  });

  describe('Photo Capture', () => {
    it('should add photo when photo capture button is pressed', () => {
      const { getByTestId, getByText } = render(
        <GrievanceReportScreen navigation={mockNavigation} />
      );

      const addPhotoButton = getByTestId('add-photo-button');
      fireEvent.press(addPhotoButton);

      expect(getByText('Photos: 1')).toBeTruthy();
    });

    it('should trigger AI classification when photo and description are added', async () => {
      const { getByTestId, getByPlaceholderText } = render(
        <GrievanceReportScreen navigation={mockNavigation} />
      );

      // Add description first
      const descriptionInput = getByPlaceholderText(/Describe the issue/i);
      fireEvent.changeText(descriptionInput, 'Large pothole on main road');

      // Add photo
      const addPhotoButton = getByTestId('add-photo-button');
      fireEvent.press(addPhotoButton);

      await waitFor(() => {
        expect(grievanceApi.classifyGrievancePhoto).toHaveBeenCalledWith(
          'file://test-photo.jpg',
          'Large pothole on main road'
        );
      });
    });
  });

  describe('Category Selection', () => {
    it('should update category when selected', () => {
      const { getByTestId, getByText } = render(
        <GrievanceReportScreen navigation={mockNavigation} />
      );

      const selectCategoryButton = getByTestId('select-category-button');
      fireEvent.press(selectCategoryButton);

      expect(getByText('Category: road')).toBeTruthy();
    });

    it('should auto-select category when AI confidence is high', async () => {
      (grievanceApi.classifyGrievancePhoto as jest.Mock).mockResolvedValue({
        category: 'water',
        confidence: 90,
        severity: 'medium',
      });

      const { getByTestId, getByPlaceholderText } = render(
        <GrievanceReportScreen navigation={mockNavigation} />
      );

      // Add description and photo
      fireEvent.changeText(
        getByPlaceholderText(/Describe the issue/i),
        'Water leakage'
      );
      fireEvent.press(getByTestId('add-photo-button'));

      await waitFor(() => {
        expect(getByTestId('category-selector')).toBeTruthy();
      });
    });
  });

  describe('Location Selection', () => {
    it('should update location when set', () => {
      const { getByTestId, getByText } = render(
        <GrievanceReportScreen navigation={mockNavigation} />
      );

      const setLocationButton = getByTestId('set-location-button');
      fireEvent.press(setLocationButton);

      expect(getByText(/Location: 12.9716, 77.5946/)).toBeTruthy();
    });
  });

  describe('Anonymous Reporting', () => {
    it('should toggle anonymous reporting', () => {
      const { getByText, queryByPlaceholderText } = render(
        <GrievanceReportScreen navigation={mockNavigation} />
      );

      // Initially, contact field should not be visible
      expect(queryByPlaceholderText(/For follow-up/i)).toBeNull();

      // Enable anonymous reporting
      const anonymousCheckbox = getByText('Report Anonymously');
      fireEvent.press(anonymousCheckbox);

      // Contact field should now be visible
      expect(queryByPlaceholderText(/For follow-up/i)).toBeTruthy();
    });

    it('should accept contact number for anonymous reports', () => {
      const { getByText, getByPlaceholderText } = render(
        <GrievanceReportScreen navigation={mockNavigation} />
      );

      // Enable anonymous reporting
      fireEvent.press(getByText('Report Anonymously'));

      // Enter contact number
      const contactInput = getByPlaceholderText(/For follow-up/i);
      fireEvent.changeText(contactInput, '9876543210');

      expect(contactInput.props.value).toBe('9876543210');
    });
  });

  describe('Form Submission - Online', () => {
    it('should submit grievance successfully when online', async () => {
      const { getByText, getByTestId, getByPlaceholderText } = render(
        <GrievanceReportScreen navigation={mockNavigation} />
      );

      // Fill form
      fireEvent.press(getByTestId('add-photo-button'));
      fireEvent.changeText(getByPlaceholderText(/Brief title/i), 'Pothole Issue');
      fireEvent.changeText(
        getByPlaceholderText(/Describe the issue/i),
        'Large pothole causing accidents'
      );
      fireEvent.press(getByTestId('select-category-button'));
      fireEvent.press(getByTestId('set-location-button'));

      // Submit
      fireEvent.press(getByText('Submit Grievance'));

      await waitFor(() => {
        expect(grievanceApi.submitGrievance).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'Pothole Issue',
            description: 'Large pothole causing accidents',
            category: 'road',
            location: {
              latitude: 12.9716,
              longitude: 77.5946,
              accuracy: 10,
            },
            photos: expect.arrayContaining([
              expect.objectContaining({
                uri: 'file://test-photo.jpg',
              }),
            ]),
            isAnonymous: false,
          })
        );
      });
    });

    it('should show success alert with ticket number', async () => {
      const { getByText, getByTestId, getByPlaceholderText } = render(
        <GrievanceReportScreen navigation={mockNavigation} />
      );

      // Fill and submit form
      fireEvent.press(getByTestId('add-photo-button'));
      fireEvent.changeText(getByPlaceholderText(/Brief title/i), 'Test Issue');
      fireEvent.changeText(getByPlaceholderText(/Describe the issue/i), 'Test description');
      fireEvent.press(getByTestId('select-category-button'));
      fireEvent.press(getByText('Submit Grievance'));

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'Grievance Submitted',
          expect.stringContaining('GRV-2024-001'),
          expect.any(Array)
        );
      });
    });

    it('should show duplicate warning when duplicate is detected', async () => {
      (grievanceApi.submitGrievance as jest.Mock).mockResolvedValue({
        ticketNumber: 'GRV-2024-002',
        isDuplicate: true,
      });

      const { getByText, getByTestId, getByPlaceholderText } = render(
        <GrievanceReportScreen navigation={mockNavigation} />
      );

      // Fill and submit form
      fireEvent.press(getByTestId('add-photo-button'));
      fireEvent.changeText(getByPlaceholderText(/Brief title/i), 'Test Issue');
      fireEvent.changeText(getByPlaceholderText(/Describe the issue/i), 'Test description');
      fireEvent.press(getByTestId('select-category-button'));
      fireEvent.press(getByText('Submit Grievance'));

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'Grievance Submitted',
          expect.stringContaining('similar grievance was found nearby'),
          expect.any(Array)
        );
      });
    });

    it('should handle submission error', async () => {
      (grievanceApi.submitGrievance as jest.Mock).mockRejectedValue(
        new Error('Network error')
      );

      const { getByText, getByTestId, getByPlaceholderText } = render(
        <GrievanceReportScreen navigation={mockNavigation} />
      );

      // Fill and submit form
      fireEvent.press(getByTestId('add-photo-button'));
      fireEvent.changeText(getByPlaceholderText(/Brief title/i), 'Test Issue');
      fireEvent.changeText(getByPlaceholderText(/Describe the issue/i), 'Test description');
      fireEvent.press(getByTestId('select-category-button'));
      fireEvent.press(getByText('Submit Grievance'));

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'Submission Failed',
          expect.stringContaining('Network error')
        );
      });
    });
  });

  describe('Form Submission - Offline', () => {
    beforeEach(() => {
      (BackgroundSyncService.getConnectivityStatus as jest.Mock).mockReturnValue({
        isOnline: false,
      });
      // Mock SyncQueue.enqueue properly
      SyncQueue.enqueue = jest.fn().mockResolvedValue(undefined);
    });

    it('should show offline indicator when offline', () => {
      const { getByText } = render(
        <GrievanceReportScreen navigation={mockNavigation} />
      );

      expect(getByText('Queue for Submission')).toBeTruthy();
    });

    it('should queue grievance for offline sync', async () => {
      const { getByText, getByTestId, getByPlaceholderText } = render(
        <GrievanceReportScreen navigation={mockNavigation} />
      );

      // Fill and submit form
      fireEvent.press(getByTestId('add-photo-button'));
      fireEvent.changeText(getByPlaceholderText(/Brief title/i), 'Test Issue');
      fireEvent.changeText(getByPlaceholderText(/Describe the issue/i), 'Test description');
      fireEvent.press(getByTestId('select-category-button'));
      fireEvent.press(getByText('Queue for Submission'));

      await waitFor(() => {
        expect(SyncQueue.enqueue).toHaveBeenCalledWith({
          type: 'grievance_submission',
          data: expect.objectContaining({
            title: 'Test Issue',
            description: 'Test description',
            category: 'road',
          }),
          priority: 'high',
        });
      });
    });

    it('should show offline queue confirmation', async () => {
      const { getByText, getByTestId, getByPlaceholderText } = render(
        <GrievanceReportScreen navigation={mockNavigation} />
      );

      // Fill and submit form
      fireEvent.press(getByTestId('add-photo-button'));
      fireEvent.changeText(getByPlaceholderText(/Brief title/i), 'Test Issue');
      fireEvent.changeText(getByPlaceholderText(/Describe the issue/i), 'Test description');
      fireEvent.press(getByTestId('select-category-button'));
      fireEvent.press(getByText('Queue for Submission'));

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'Queued for Submission',
          expect.stringContaining('offline'),
          expect.any(Array)
        );
      });
    });
  });

  describe('Character Limits', () => {
    it('should enforce title character limit', () => {
      const { getByPlaceholderText, getByText } = render(
        <GrievanceReportScreen navigation={mockNavigation} />
      );

      const titleInput = getByPlaceholderText(/Brief title/i);
      const longTitle = 'a'.repeat(150);
      fireEvent.changeText(titleInput, longTitle);

      // Should show character count
      expect(getByText(/\/100/)).toBeTruthy();
    });

    it('should enforce description character limit', () => {
      const { getByPlaceholderText, getByText } = render(
        <GrievanceReportScreen navigation={mockNavigation} />
      );

      const descriptionInput = getByPlaceholderText(/Describe the issue/i);
      const longDescription = 'a'.repeat(600);
      fireEvent.changeText(descriptionInput, longDescription);

      // Should show character count
      expect(getByText(/\/500/)).toBeTruthy();
    });
  });

  describe('AI Classification Retry', () => {
    it('should show retry button when AI confidence is low', async () => {
      (grievanceApi.classifyGrievancePhoto as jest.Mock).mockResolvedValue({
        category: 'road',
        confidence: 70,
        severity: 'medium',
      });

      const { getByTestId, getByPlaceholderText, findByText } = render(
        <GrievanceReportScreen navigation={mockNavigation} />
      );

      // Add description and photo
      fireEvent.changeText(
        getByPlaceholderText(/Describe the issue/i),
        'Test description'
      );
      fireEvent.press(getByTestId('add-photo-button'));

      // Wait for classification
      await waitFor(() => {
        expect(grievanceApi.classifyGrievancePhoto).toHaveBeenCalled();
      });

      // Retry button should be visible
      const retryButton = await findByText(/Retry AI Classification/i);
      expect(retryButton).toBeTruthy();
    });

    it('should retry classification when retry button is pressed', async () => {
      (grievanceApi.classifyGrievancePhoto as jest.Mock)
        .mockResolvedValueOnce({
          category: 'road',
          confidence: 70,
          severity: 'medium',
        })
        .mockResolvedValueOnce({
          category: 'road',
          confidence: 90,
          severity: 'high',
        });

      const { getByTestId, getByPlaceholderText, findByText } = render(
        <GrievanceReportScreen navigation={mockNavigation} />
      );

      // Add description and photo
      fireEvent.changeText(
        getByPlaceholderText(/Describe the issue/i),
        'Test description'
      );
      fireEvent.press(getByTestId('add-photo-button'));

      // Wait for initial classification
      await waitFor(() => {
        expect(grievanceApi.classifyGrievancePhoto).toHaveBeenCalledTimes(1);
      });

      // Press retry button
      const retryButton = await findByText(/Retry AI Classification/i);
      fireEvent.press(retryButton);

      // Should call classification again
      await waitFor(() => {
        expect(grievanceApi.classifyGrievancePhoto).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('Navigation', () => {
    it('should navigate to tracking screen after successful submission', async () => {
      const { getByText, getByTestId, getByPlaceholderText } = render(
        <GrievanceReportScreen navigation={mockNavigation} />
      );

      // Fill and submit form
      fireEvent.press(getByTestId('add-photo-button'));
      fireEvent.changeText(getByPlaceholderText(/Brief title/i), 'Test Issue');
      fireEvent.changeText(getByPlaceholderText(/Describe the issue/i), 'Test description');
      fireEvent.press(getByTestId('select-category-button'));
      fireEvent.press(getByText('Submit Grievance'));

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalled();
      });

      // Simulate pressing "Track Status" button in alert
      const alertCall = (Alert.alert as jest.Mock).mock.calls[0];
      const trackStatusButton = alertCall[2][0];
      trackStatusButton.onPress();

      expect(mockNavigation.replace).toHaveBeenCalledWith('GrievanceTracking', {
        ticketNumber: 'GRV-2024-001',
      });
    });

    it('should go back after pressing Done in success alert', async () => {
      const { getByText, getByTestId, getByPlaceholderText } = render(
        <GrievanceReportScreen navigation={mockNavigation} />
      );

      // Fill and submit form
      fireEvent.press(getByTestId('add-photo-button'));
      fireEvent.changeText(getByPlaceholderText(/Brief title/i), 'Test Issue');
      fireEvent.changeText(getByPlaceholderText(/Describe the issue/i), 'Test description');
      fireEvent.press(getByTestId('select-category-button'));
      fireEvent.press(getByText('Submit Grievance'));

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalled();
      });

      // Simulate pressing "Done" button in alert
      const alertCall = (Alert.alert as jest.Mock).mock.calls[0];
      const doneButton = alertCall[2][1];
      doneButton.onPress();

      expect(mockNavigation.goBack).toHaveBeenCalled();
    });
  });

  describe('Connectivity Changes', () => {
    it('should update UI when connectivity changes', () => {
      let connectivityListener: (online: boolean) => void;
      (BackgroundSyncService.addConnectivityListener as jest.Mock).mockImplementation(
        (listener) => {
          connectivityListener = listener;
        }
      );

      const { getByText, rerender } = render(
        <GrievanceReportScreen navigation={mockNavigation} />
      );

      // Initially online
      expect(getByText('Submit Grievance')).toBeTruthy();

      // Simulate going offline
      act(() => {
        connectivityListener!(false);
      });

      rerender(<GrievanceReportScreen navigation={mockNavigation} />);

      // Should show offline text
      expect(getByText(/offline/i)).toBeTruthy();
    });
  });
});
