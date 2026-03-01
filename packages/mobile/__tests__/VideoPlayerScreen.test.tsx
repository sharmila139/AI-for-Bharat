/**
 * VideoPlayerScreen Tests
 * Task 35.3: Test video player with quality selection
 */

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import VideoPlayerScreen from '../src/screens/education/VideoPlayerScreen';
import educationService from '../src/services/educationService';

// Mock the education service
jest.mock('../src/services/educationService');

// Mock OfflineIndicator component
jest.mock('../src/components/OfflineIndicator', () => ({
  OfflineIndicator: () => null,
}));

// Mock navigation
const mockNavigation = {
  goBack: jest.fn(),
  navigate: jest.fn(),
};

const mockRoute = {
  params: {
    contentId: 'test-video-1',
  },
};

// Mock video metadata
const mockVideoMetadata = {
  id: 'test-video-1',
  title: 'Test Educational Video',
  description: 'This is a test video for learning',
  duration: 600, // 10 minutes
  sources: [
    {
      quality: '360p',
      url: 'https://example.com/video-360p.mp4',
      bitrate: 500,
    },
    {
      quality: '480p',
      url: 'https://example.com/video-480p.mp4',
      bitrate: 1000,
    },
    {
      quality: '720p',
      url: 'https://example.com/video-720p.mp4',
      bitrate: 2500,
    },
  ],
  chapters: [
    {
      id: '1',
      title: 'Introduction',
      timestamp: 0,
      description: 'Overview of the topic',
    },
    {
      id: '2',
      title: 'Main Concepts',
      timestamp: 120,
      description: 'Core learning material',
    },
  ],
  subtitles: [],
  isOfflineAvailable: true,
};

describe('VideoPlayerScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (educationService.getVideoMetadata as jest.Mock).mockResolvedValue(mockVideoMetadata);
    (educationService.getVideoProgress as jest.Mock).mockResolvedValue(null);
  });

  it('renders loading state initially', () => {
    const { getByText } = render(
      <VideoPlayerScreen navigation={mockNavigation} route={mockRoute} />
    );

    expect(getByText('Loading video...')).toBeTruthy();
  });

  it('loads and displays video metadata', async () => {
    const { getAllByText, getByText } = render(
      <VideoPlayerScreen navigation={mockNavigation} route={mockRoute} />
    );

    await waitFor(() => {
      const titles = getAllByText('Test Educational Video');
      expect(titles.length).toBeGreaterThan(0);
      expect(getByText('This is a test video for learning')).toBeTruthy();
    });

    expect(educationService.getVideoMetadata).toHaveBeenCalledWith('test-video-1');
  });

  it('displays quality badge with default quality', async () => {
    const { getByText } = render(
      <VideoPlayerScreen navigation={mockNavigation} route={mockRoute} />
    );

    await waitFor(() => {
      expect(getByText('480p')).toBeTruthy();
    });
  });

  it('displays chapter list', async () => {
    const { getByText } = render(
      <VideoPlayerScreen navigation={mockNavigation} route={mockRoute} />
    );

    await waitFor(() => {
      expect(getByText('Chapters')).toBeTruthy();
      expect(getByText('Introduction')).toBeTruthy();
      expect(getByText('Main Concepts')).toBeTruthy();
    });
  });

  it('opens quality selection modal', async () => {
    const { getAllByText, getByText } = render(
      <VideoPlayerScreen navigation={mockNavigation} route={mockRoute} />
    );

    await waitFor(() => {
      const titles = getAllByText('Test Educational Video');
      expect(titles.length).toBeGreaterThan(0);
    });

    // Find and click the quality/settings button (⚙️)
    const settingsButtons = getAllByText('⚙️');
    fireEvent.press(settingsButtons[0]);

    await waitFor(() => {
      expect(getByText('Video Quality')).toBeTruthy();
      expect(getByText('360p')).toBeTruthy();
      expect(getByText('720p')).toBeTruthy();
    });
  });

  it('changes video quality', async () => {
    const { getAllByText, getByText } = render(
      <VideoPlayerScreen navigation={mockNavigation} route={mockRoute} />
    );

    await waitFor(() => {
      const titles = getAllByText('Test Educational Video');
      expect(titles.length).toBeGreaterThan(0);
    });

    // Open quality menu
    const settingsButtons = getAllByText('⚙️');
    fireEvent.press(settingsButtons[0]);

    await waitFor(() => {
      expect(getByText('Video Quality')).toBeTruthy();
    });

    // Select 720p
    const quality720p = getAllByText('720p');
    fireEvent.press(quality720p[0]);

    // Quality should be updated (check badge)
    await waitFor(() => {
      const badges = getAllByText('720p');
      expect(badges.length).toBeGreaterThan(0);
    });
  });

  it('opens playback speed modal', async () => {
    const { getAllByText, getByText, container } = render(
      <VideoPlayerScreen navigation={mockNavigation} route={mockRoute} />
    );

    await waitFor(() => {
      const titles = getAllByText('Test Educational Video');
      expect(titles.length).toBeGreaterThan(0);
    });

    // Tap video to show controls
    const videoContainer = container.findByProps({ style: expect.objectContaining({}) });
    if (videoContainer) {
      fireEvent.press(videoContainer);
    }

    // Click speed button (1.0x) - use getAllByText since it might appear multiple times
    await waitFor(() => {
      const speedButtons = getAllByText('1.0x');
      expect(speedButtons.length).toBeGreaterThan(0);
      fireEvent.press(speedButtons[0]);
    });

    await waitFor(() => {
      expect(getByText('Playback Speed')).toBeTruthy();
      expect(getByText('0.5x')).toBeTruthy();
      expect(getByText('2.0x')).toBeTruthy();
    });
  });

  it('opens chapters modal', async () => {
    const { getAllByText, getByText } = render(
      <VideoPlayerScreen navigation={mockNavigation} route={mockRoute} />
    );

    await waitFor(() => {
      const titles = getAllByText('Test Educational Video');
      expect(titles.length).toBeGreaterThan(0);
    });

    // Click chapters button (📑)
    const chaptersButtons = getAllByText('📑');
    fireEvent.press(chaptersButtons[0]);

    await waitFor(() => {
      // Should show chapters modal with title
      const chaptersTexts = getAllByText('Chapters');
      expect(chaptersTexts.length).toBeGreaterThan(0);
    });
  });

  it('displays video progress when available', async () => {
    const mockProgress = {
      contentId: 'test-video-1',
      studentId: 'demo-student',
      currentTime: 300,
      duration: 600,
      completed: false,
      watchTime: 300,
      lastWatched: new Date().toISOString(),
    };

    (educationService.getVideoProgress as jest.Mock).mockResolvedValue(mockProgress);

    const { getByText } = render(
      <VideoPlayerScreen navigation={mockNavigation} route={mockRoute} />
    );

    await waitFor(() => {
      expect(getByText(/50% watched/)).toBeTruthy();
    });
  });

  it('shows completed status when video is finished', async () => {
    const mockProgress = {
      contentId: 'test-video-1',
      studentId: 'demo-student',
      currentTime: 600,
      duration: 600,
      completed: true,
      watchTime: 600,
      lastWatched: new Date().toISOString(),
    };

    (educationService.getVideoProgress as jest.Mock).mockResolvedValue(mockProgress);

    const { getByText } = render(
      <VideoPlayerScreen navigation={mockNavigation} route={mockRoute} />
    );

    await waitFor(() => {
      expect(getByText('✓ Completed')).toBeTruthy();
    });
  });

  it('handles error state', async () => {
    (educationService.getVideoMetadata as jest.Mock).mockRejectedValue(
      new Error('Failed to load video')
    );

    const { getByText } = render(
      <VideoPlayerScreen navigation={mockNavigation} route={mockRoute} />
    );

    await waitFor(() => {
      expect(getByText('Failed to load video')).toBeTruthy();
      expect(getByText('Retry')).toBeTruthy();
      expect(getByText('Go Back')).toBeTruthy();
    });
  });

  it('navigates back when back button is pressed', async () => {
    const { getAllByText, getByText } = render(
      <VideoPlayerScreen navigation={mockNavigation} route={mockRoute} />
    );

    await waitFor(() => {
      const titles = getAllByText('Test Educational Video');
      expect(titles.length).toBeGreaterThan(0);
    });

    // Find and press back button (←)
    const backButton = getByText('←');
    fireEvent.press(backButton);

    expect(mockNavigation.goBack).toHaveBeenCalled();
  });

  it('displays video details section', async () => {
    const { getByText } = render(
      <VideoPlayerScreen navigation={mockNavigation} route={mockRoute} />
    );

    await waitFor(() => {
      expect(getByText('Video Details')).toBeTruthy();
      expect(getByText('Duration:')).toBeTruthy();
      expect(getByText('Available Qualities:')).toBeTruthy();
      expect(getByText('Offline Available:')).toBeTruthy();
      expect(getByText('Yes ✓')).toBeTruthy();
    });
  });
});
