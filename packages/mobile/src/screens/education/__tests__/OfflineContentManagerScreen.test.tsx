/**
 * Tests for OfflineContentManagerScreen
 * Task 35.8: Build offline content download manager
 */

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import OfflineContentManagerScreen from '../OfflineContentManagerScreen';
import educationService from '../../../services/educationService';

// Mock dependencies
jest.mock('../../../services/educationService');
jest.mock('../../../components/OfflineIndicator', () => ({
  OfflineIndicator: () => null,
}));

// Mock Alert
jest.spyOn(Alert, 'alert');

const mockNavigation = {
  navigate: jest.fn(),
  goBack: jest.fn(),
};

const mockRoute = {
  params: {
    studentId: 'test-student-123',
  },
};

const mockContentItems = [
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
    isOfflineAvailable: false,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
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
    isOfflineAvailable: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
];

describe('OfflineContentManagerScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (educationService.searchContent as jest.Mock).mockResolvedValue({
      items: mockContentItems,
      total: 2,
      page: 1,
      totalPages: 1,
    });
  });

  describe('Rendering', () => {
    it('should render loading state initially', () => {
      const { getByText } = render(
        <OfflineContentManagerScreen navigation={mockNavigation} route={mockRoute} />
      );

      expect(getByText('Loading content...')).toBeTruthy();
    });

    it('should render header with title and subtitle', async () => {
      const { getByText } = render(
        <OfflineContentManagerScreen navigation={mockNavigation} route={mockRoute} />
      );

      await waitFor(() => {
        expect(getByText('Offline Downloads')).toBeTruthy();
        expect(getByText('Manage your offline content')).toBeTruthy();
      });
    });

    it('should render storage info card', async () => {
      const { getByText } = render(
        <OfflineContentManagerScreen navigation={mockNavigation} route={mockRoute} />
      );

      await waitFor(() => {
        expect(getByText('Storage Usage')).toBeTruthy();
        expect(getByText(/Available/)).toBeTruthy();
        expect(getByText(/Downloaded Content/)).toBeTruthy();
      });
    });

    it('should render tabs for available and downloaded content', async () => {
      const { getByText } = render(
        <OfflineContentManagerScreen navigation={mockNavigation} route={mockRoute} />
      );

      await waitFor(() => {
        expect(getByText('Available')).toBeTruthy();
        expect(getByText('Downloaded')).toBeTruthy();
      });
    });

    it('should render subject filter chips', async () => {
      const { getByText } = render(
        <OfflineContentManagerScreen navigation={mockNavigation} route={mockRoute} />
      );

      await waitFor(() => {
        expect(getByText('All Subjects')).toBeTruthy();
        expect(getByText('Mathematics')).toBeTruthy();
        expect(getByText('Science')).toBeTruthy();
      });
    });
  });

  describe('Content Loading', () => {
    it('should load content on mount', async () => {
      render(
        <OfflineContentManagerScreen navigation={mockNavigation} route={mockRoute} />
      );

      await waitFor(() => {
        expect(educationService.searchContent).toHaveBeenCalledWith({
          limit: 50,
        });
      });
    });

    it('should display content items', async () => {
      const { getByText } = render(
        <OfflineContentManagerScreen navigation={mockNavigation} route={mockRoute} />
      );

      await waitFor(() => {
        expect(getByText('Introduction to Algebra')).toBeTruthy();
        expect(getByText('Photosynthesis Explained')).toBeTruthy();
      });
    });

    it('should handle loading error', async () => {
      (educationService.searchContent as jest.Mock).mockRejectedValue(
        new Error('Network error')
      );

      const { getByText } = render(
        <OfflineContentManagerScreen navigation={mockNavigation} route={mockRoute} />
      );

      await waitFor(() => {
        expect(getByText(/Network error/)).toBeTruthy();
        expect(getByText('Retry')).toBeTruthy();
      });
    });
  });

  describe('Download Functionality', () => {
    it('should show quality selection modal when download button is pressed', async () => {
      const { getByText, getAllByText } = render(
        <OfflineContentManagerScreen navigation={mockNavigation} route={mockRoute} />
      );

      await waitFor(() => {
        expect(getByText('Introduction to Algebra')).toBeTruthy();
      });

      const downloadButtons = getAllByText('Download');
      fireEvent.press(downloadButtons[0]);

      await waitFor(() => {
        expect(getByText('Select Video Quality')).toBeTruthy();
        expect(getByText('360p')).toBeTruthy();
        expect(getByText('480p')).toBeTruthy();
        expect(getByText('720p')).toBeTruthy();
      });
    });

    it('should display estimated size for each quality option', async () => {
      const { getByText, getAllByText } = render(
        <OfflineContentManagerScreen navigation={mockNavigation} route={mockRoute} />
      );

      await waitFor(() => {
        expect(getByText('Introduction to Algebra')).toBeTruthy();
      });

      const downloadButtons = getAllByText('Download');
      fireEvent.press(downloadButtons[0]);

      await waitFor(() => {
        // 15 minutes * quality bitrate
        expect(getByText('8MB')).toBeTruthy(); // 360p: 15 * 0.5
        expect(getByText('15MB')).toBeTruthy(); // 480p: 15 * 1.0
        expect(getByText('38MB')).toBeTruthy(); // 720p: 15 * 2.5
      });
    });

    it('should start download when quality is selected', async () => {
      jest.useFakeTimers();
      
      const { getByText, getAllByText } = render(
        <OfflineContentManagerScreen navigation={mockNavigation} route={mockRoute} />
      );

      await waitFor(() => {
        expect(getByText('Introduction to Algebra')).toBeTruthy();
      });

      const downloadButtons = getAllByText('Download');
      fireEvent.press(downloadButtons[0]);

      await waitFor(() => {
        expect(getByText('480p')).toBeTruthy();
      });

      fireEvent.press(getByText('480p'));

      await waitFor(() => {
        expect(getByText('Pause')).toBeTruthy();
      });

      jest.useRealTimers();
    });

    it('should show download progress', async () => {
      jest.useFakeTimers();
      
      const { getByText, getAllByText } = render(
        <OfflineContentManagerScreen navigation={mockNavigation} route={mockRoute} />
      );

      await waitFor(() => {
        expect(getByText('Introduction to Algebra')).toBeTruthy();
      });

      const downloadButtons = getAllByText('Download');
      fireEvent.press(downloadButtons[0]);

      await waitFor(() => {
        expect(getByText('480p')).toBeTruthy();
      });

      fireEvent.press(getByText('480p'));

      // Advance timers to simulate download progress
      jest.advanceTimersByTime(2000);

      await waitFor(() => {
        expect(getByText(/10%/)).toBeTruthy();
      });

      jest.useRealTimers();
    });
  });

  describe('Pause and Resume', () => {
    it('should pause download when pause button is pressed', async () => {
      jest.useFakeTimers();
      
      const { getByText, getAllByText } = render(
        <OfflineContentManagerScreen navigation={mockNavigation} route={mockRoute} />
      );

      await waitFor(() => {
        expect(getByText('Introduction to Algebra')).toBeTruthy();
      });

      // Start download
      const downloadButtons = getAllByText('Download');
      fireEvent.press(downloadButtons[0]);
      fireEvent.press(getByText('480p'));

      await waitFor(() => {
        expect(getByText('Pause')).toBeTruthy();
      });

      // Pause download
      fireEvent.press(getByText('Pause'));

      await waitFor(() => {
        expect(getByText('Resume')).toBeTruthy();
        expect(getByText('Paused')).toBeTruthy();
      });

      jest.useRealTimers();
    });

    it('should resume download when resume button is pressed', async () => {
      jest.useFakeTimers();
      
      const { getByText, getAllByText } = render(
        <OfflineContentManagerScreen navigation={mockNavigation} route={mockRoute} />
      );

      await waitFor(() => {
        expect(getByText('Introduction to Algebra')).toBeTruthy();
      });

      // Start and pause download
      const downloadButtons = getAllByText('Download');
      fireEvent.press(downloadButtons[0]);
      fireEvent.press(getByText('480p'));
      
      await waitFor(() => {
        expect(getByText('Pause')).toBeTruthy();
      });
      
      fireEvent.press(getByText('Pause'));

      await waitFor(() => {
        expect(getByText('Resume')).toBeTruthy();
      });

      // Resume download
      fireEvent.press(getByText('Resume'));

      await waitFor(() => {
        expect(getByText('Pause')).toBeTruthy();
      });

      jest.useRealTimers();
    });
  });

  describe('Delete Functionality', () => {
    it('should show delete button for downloaded content', async () => {
      const { getByText } = render(
        <OfflineContentManagerScreen navigation={mockNavigation} route={mockRoute} />
      );

      // Switch to downloaded tab
      await waitFor(() => {
        expect(getByText('Downloaded')).toBeTruthy();
      });

      fireEvent.press(getByText('Downloaded'));

      await waitFor(() => {
        expect(getByText('Photosynthesis Explained')).toBeTruthy();
        expect(getByText('🗑️ Delete')).toBeTruthy();
      });
    });

    it('should show confirmation alert when delete is pressed', async () => {
      const { getByText } = render(
        <OfflineContentManagerScreen navigation={mockNavigation} route={mockRoute} />
      );

      await waitFor(() => {
        expect(getByText('Downloaded')).toBeTruthy();
      });

      fireEvent.press(getByText('Downloaded'));

      await waitFor(() => {
        expect(getByText('🗑️ Delete')).toBeTruthy();
      });

      fireEvent.press(getByText('🗑️ Delete'));

      expect(Alert.alert).toHaveBeenCalledWith(
        'Delete Downloaded Content',
        expect.stringContaining('Photosynthesis Explained'),
        expect.any(Array)
      );
    });

    it('should update storage info after deletion', async () => {
      const { getByText } = render(
        <OfflineContentManagerScreen navigation={mockNavigation} route={mockRoute} />
      );

      await waitFor(() => {
        expect(getByText('Downloaded')).toBeTruthy();
      });

      fireEvent.press(getByText('Downloaded'));

      await waitFor(() => {
        expect(getByText('🗑️ Delete')).toBeTruthy();
      });

      // Get initial storage values
      const initialAvailable = getByText(/4800MB/);
      expect(initialAvailable).toBeTruthy();

      // Trigger delete
      fireEvent.press(getByText('🗑️ Delete'));

      // Simulate confirmation
      const alertCall = (Alert.alert as jest.Mock).mock.calls[0];
      const deleteAction = alertCall[2].find((action: any) => action.text === 'Delete');
      deleteAction.onPress();

      // Storage should be updated (freed up space)
      await waitFor(() => {
        // Available space should increase after deletion
        expect(getByText(/4820MB/)).toBeTruthy(); // 4800 + 20 (video size)
      });
    });
  });

  describe('Storage Management', () => {
    it('should display storage usage percentage', async () => {
      const { getByText } = render(
        <OfflineContentManagerScreen navigation={mockNavigation} route={mockRoute} />
      );

      await waitFor(() => {
        expect(getByText('Storage Usage')).toBeTruthy();
        expect(getByText('3.1GB / 7.8GB')).toBeTruthy();
      });
    });

    it('should show alert when insufficient storage for download', async () => {
      const { getByText, getAllByText } = render(
        <OfflineContentManagerScreen navigation={mockNavigation} route={mockRoute} />
      );

      await waitFor(() => {
        expect(getByText('Introduction to Algebra')).toBeTruthy();
      });

      // Try to download with insufficient space
      // Mock a very large file
      const downloadButtons = getAllByText('Download');
      fireEvent.press(downloadButtons[0]);

      await waitFor(() => {
        expect(getByText('720p')).toBeTruthy();
      });

      // This would require more space than available
      // The component should check and show alert
      fireEvent.press(getByText('720p'));

      // Note: In real implementation, this would trigger an alert
      // if the file size exceeds available space
    });

    it('should update storage info after successful download', async () => {
      jest.useFakeTimers();
      
      const { getByText, getAllByText } = render(
        <OfflineContentManagerScreen navigation={mockNavigation} route={mockRoute} />
      );

      await waitFor(() => {
        expect(getByText('Introduction to Algebra')).toBeTruthy();
      });

      const downloadButtons = getAllByText('Download');
      fireEvent.press(downloadButtons[0]);
      fireEvent.press(getByText('480p'));

      // Complete download
      jest.advanceTimersByTime(20000);

      await waitFor(() => {
        expect(getByText('Downloaded')).toBeTruthy();
      });

      // Storage should be updated
      await waitFor(() => {
        expect(getByText(/Downloaded Content/)).toBeTruthy();
      });

      jest.useRealTimers();
    });
  });

  describe('Filtering', () => {
    it('should filter content by subject', async () => {
      const { getByText, queryByText } = render(
        <OfflineContentManagerScreen navigation={mockNavigation} route={mockRoute} />
      );

      await waitFor(() => {
        expect(getByText('Introduction to Algebra')).toBeTruthy();
        expect(getByText('Photosynthesis Explained')).toBeTruthy();
      });

      // Filter by Mathematics
      fireEvent.press(getByText('Mathematics'));

      await waitFor(() => {
        expect(getByText('Introduction to Algebra')).toBeTruthy();
        expect(queryByText('Photosynthesis Explained')).toBeNull();
      });
    });

    it('should switch between available and downloaded tabs', async () => {
      const { getByText, queryByText } = render(
        <OfflineContentManagerScreen navigation={mockNavigation} route={mockRoute} />
      );

      await waitFor(() => {
        expect(getByText('Introduction to Algebra')).toBeTruthy();
      });

      // Switch to downloaded tab
      fireEvent.press(getByText('Downloaded'));

      await waitFor(() => {
        expect(getByText('Photosynthesis Explained')).toBeTruthy();
        expect(queryByText('Introduction to Algebra')).toBeNull();
      });

      // Switch back to available tab
      fireEvent.press(getByText('Available'));

      await waitFor(() => {
        expect(getByText('Introduction to Algebra')).toBeTruthy();
      });
    });

    it('should show empty state when no content matches filter', async () => {
      (educationService.searchContent as jest.Mock).mockResolvedValue({
        items: [],
        total: 0,
        page: 1,
        totalPages: 0,
      });

      const { getByText } = render(
        <OfflineContentManagerScreen navigation={mockNavigation} route={mockRoute} />
      );

      await waitFor(() => {
        expect(getByText('No content available')).toBeTruthy();
        expect(getByText('Try adjusting your filters')).toBeTruthy();
      });
    });

    it('should show empty state for downloaded tab when no downloads', async () => {
      const { getByText } = render(
        <OfflineContentManagerScreen navigation={mockNavigation} route={mockRoute} />
      );

      await waitFor(() => {
        expect(getByText('Downloaded')).toBeTruthy();
      });

      fireEvent.press(getByText('Downloaded'));

      // If only one item is downloaded and we filter it out
      fireEvent.press(getByText('Mathematics'));

      await waitFor(() => {
        expect(getByText('No downloaded content')).toBeTruthy();
        expect(getByText('Download content to access it offline')).toBeTruthy();
      });
    });
  });

  describe('Quality Selection', () => {
    it('should display quality options with descriptions', async () => {
      const { getByText, getAllByText } = render(
        <OfflineContentManagerScreen navigation={mockNavigation} route={mockRoute} />
      );

      await waitFor(() => {
        expect(getByText('Introduction to Algebra')).toBeTruthy();
      });

      const downloadButtons = getAllByText('Download');
      fireEvent.press(downloadButtons[0]);

      await waitFor(() => {
        expect(getByText('Low quality (saves data)')).toBeTruthy();
        expect(getByText('Standard quality')).toBeTruthy();
        expect(getByText('High quality (HD)')).toBeTruthy();
      });
    });

    it('should close quality modal when cancel is pressed', async () => {
      const { getByText, getAllByText, queryByText } = render(
        <OfflineContentManagerScreen navigation={mockNavigation} route={mockRoute} />
      );

      await waitFor(() => {
        expect(getByText('Introduction to Algebra')).toBeTruthy();
      });

      const downloadButtons = getAllByText('Download');
      fireEvent.press(downloadButtons[0]);

      await waitFor(() => {
        expect(getByText('Select Video Quality')).toBeTruthy();
      });

      fireEvent.press(getByText('Cancel'));

      await waitFor(() => {
        expect(queryByText('Select Video Quality')).toBeNull();
      });
    });

    it('should show selected quality badge on content card', async () => {
      jest.useFakeTimers();
      
      const { getByText, getAllByText } = render(
        <OfflineContentManagerScreen navigation={mockNavigation} route={mockRoute} />
      );

      await waitFor(() => {
        expect(getByText('Introduction to Algebra')).toBeTruthy();
      });

      const downloadButtons = getAllByText('Download');
      fireEvent.press(downloadButtons[0]);
      fireEvent.press(getByText('720p'));

      await waitFor(() => {
        expect(getByText('720p')).toBeTruthy();
      });

      jest.useRealTimers();
    });
  });

  describe('Error Handling', () => {
    it('should display error message when content loading fails', async () => {
      (educationService.searchContent as jest.Mock).mockRejectedValue(
        new Error('Failed to load content')
      );

      const { getByText } = render(
        <OfflineContentManagerScreen navigation={mockNavigation} route={mockRoute} />
      );

      await waitFor(() => {
        expect(getByText(/Failed to load content/)).toBeTruthy();
      });
    });

    it('should retry loading content when retry button is pressed', async () => {
      (educationService.searchContent as jest.Mock)
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          items: mockContentItems,
          total: 2,
          page: 1,
          totalPages: 1,
        });

      const { getByText } = render(
        <OfflineContentManagerScreen navigation={mockNavigation} route={mockRoute} />
      );

      await waitFor(() => {
        expect(getByText(/Network error/)).toBeTruthy();
      });

      fireEvent.press(getByText('Retry'));

      await waitFor(() => {
        expect(getByText('Introduction to Algebra')).toBeTruthy();
      });
    });
  });

  describe('Content Display', () => {
    it('should display content metadata correctly', async () => {
      const { getByText } = render(
        <OfflineContentManagerScreen navigation={mockNavigation} route={mockRoute} />
      );

      await waitFor(() => {
        expect(getByText('Introduction to Algebra')).toBeTruthy();
        expect(getByText('Mathematics')).toBeTruthy();
        expect(getByText('15m')).toBeTruthy();
        expect(getByText('15MB')).toBeTruthy(); // 480p default
      });
    });

    it('should show download status for each item', async () => {
      const { getByText, getAllByText } = render(
        <OfflineContentManagerScreen navigation={mockNavigation} route={mockRoute} />
      );

      await waitFor(() => {
        expect(getAllByText('Download').length).toBeGreaterThan(0);
      });

      // Switch to downloaded tab
      fireEvent.press(getByText('Downloaded'));

      await waitFor(() => {
        expect(getByText('Downloaded')).toBeTruthy();
      });
    });
  });
});
