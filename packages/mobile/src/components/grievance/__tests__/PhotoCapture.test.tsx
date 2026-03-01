/**
 * PhotoCapture Component Tests
 */

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { PhotoCapture, CapturedPhoto } from '../PhotoCapture';
import * as ImagePicker from 'expo-image-picker';

// Mock expo-image-picker
jest.mock('expo-image-picker');
jest.mock('expo-image-manipulator');

describe('PhotoCapture', () => {
  const mockPhotos: CapturedPhoto[] = [];
  const mockOnPhotosChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    Alert.alert = jest.fn();
  });

  it('renders correctly with no photos', () => {
    const { getByText } = render(
      <PhotoCapture photos={mockPhotos} onPhotosChange={mockOnPhotosChange} />
    );

    expect(getByText('Photos')).toBeTruthy();
    expect(getByText('0/5 photos added')).toBeTruthy();
    expect(getByText('Add Photo')).toBeTruthy();
  });

  it('renders correctly with photos', () => {
    const photos: CapturedPhoto[] = [
      {
        uri: 'file://photo1.jpg',
        type: 'image/jpeg',
        name: 'photo1.jpg',
        size: 100000,
      },
    ];

    const { getByText } = render(
      <PhotoCapture photos={photos} onPhotosChange={mockOnPhotosChange} />
    );

    expect(getByText('1/5 photos added')).toBeTruthy();
    expect(getByText('Add Another Photo')).toBeTruthy();
  });

  it('shows alert when max photos reached', () => {
    const photos: CapturedPhoto[] = Array(5).fill({
      uri: 'file://photo.jpg',
      type: 'image/jpeg',
      name: 'photo.jpg',
      size: 100000,
    });

    const { getByText } = render(
      <PhotoCapture photos={photos} onPhotosChange={mockOnPhotosChange} />
    );

    const addButton = getByText('Add Another Photo');
    fireEvent.press(addButton);

    expect(Alert.alert).toHaveBeenCalledWith(
      'Limit Reached',
      'You can only add up to 5 photos.'
    );
  });

  it('requests camera permission when capturing photo', async () => {
    (ImagePicker.requestCameraPermissionsAsync as jest.Mock).mockResolvedValue({
      status: 'granted',
    });
    (ImagePicker.launchCameraAsync as jest.Mock).mockResolvedValue({
      canceled: true,
    });

    const { getByText } = render(
      <PhotoCapture photos={mockPhotos} onPhotosChange={mockOnPhotosChange} />
    );

    const addButton = getByText('Add Photo');
    fireEvent.press(addButton);

    // Wait for alert to show
    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalled();
    });
  });

  it('requests gallery permission when selecting photo', async () => {
    (ImagePicker.requestMediaLibraryPermissionsAsync as jest.Mock).mockResolvedValue({
      status: 'granted',
    });
    (ImagePicker.launchImageLibraryAsync as jest.Mock).mockResolvedValue({
      canceled: true,
    });

    const { getByText } = render(
      <PhotoCapture photos={mockPhotos} onPhotosChange={mockOnPhotosChange} />
    );

    const addButton = getByText('Add Photo');
    fireEvent.press(addButton);

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalled();
    });
  });

  it('disables add button when disabled prop is true', () => {
    const { getByText } = render(
      <PhotoCapture
        photos={mockPhotos}
        onPhotosChange={mockOnPhotosChange}
        disabled={true}
      />
    );

    const addButton = getByText('Add Photo');
    expect(addButton.props.accessibilityState?.disabled).toBe(true);
  });

  it('shows help text when no photos added', () => {
    const { getByText } = render(
      <PhotoCapture photos={mockPhotos} onPhotosChange={mockOnPhotosChange} />
    );

    expect(
      getByText(/Take a clear photo of the infrastructure issue/)
    ).toBeTruthy();
  });

  it('displays photo size in KB', () => {
    const photos: CapturedPhoto[] = [
      {
        uri: 'file://photo1.jpg',
        type: 'image/jpeg',
        name: 'photo1.jpg',
        size: 102400, // 100KB
      },
    ];

    const { getByText } = render(
      <PhotoCapture photos={photos} onPhotosChange={mockOnPhotosChange} />
    );

    expect(getByText('100KB')).toBeTruthy();
  });

  it('calls onPhotosChange when removing photo', async () => {
    const photos: CapturedPhoto[] = [
      {
        uri: 'file://photo1.jpg',
        type: 'image/jpeg',
        name: 'photo1.jpg',
        size: 100000,
      },
    ];

    const { getByText } = render(
      <PhotoCapture photos={photos} onPhotosChange={mockOnPhotosChange} />
    );

    // Mock Alert.alert to auto-confirm
    (Alert.alert as jest.Mock).mockImplementation((title, message, buttons) => {
      const confirmButton = buttons?.find((b: any) => b.text === 'Remove');
      if (confirmButton) {
        confirmButton.onPress();
      }
    });

    const removeButton = getByText('×');
    fireEvent.press(removeButton);

    await waitFor(() => {
      expect(mockOnPhotosChange).toHaveBeenCalledWith([]);
    });
  });
});
