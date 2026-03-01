/**
 * Photo Capture Component
 * Handles camera capture and gallery selection for grievance photos
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  Alert,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { MAX_PHOTOS_PER_GRIEVANCE, COMPRESSED_PHOTO_MAX_SIZE } from '../../config/api-config';

export interface CapturedPhoto {
  uri: string;
  type: string;
  name: string;
  size: number;
}

interface PhotoCaptureProps {
  photos: CapturedPhoto[];
  onPhotosChange: (photos: CapturedPhoto[]) => void;
  maxPhotos?: number;
  disabled?: boolean;
}

export const PhotoCapture: React.FC<PhotoCaptureProps> = ({
  photos,
  onPhotosChange,
  maxPhotos = MAX_PHOTOS_PER_GRIEVANCE,
  disabled = false,
}) => {
  const [compressing, setCompressing] = useState(false);

  /**
   * Request camera permissions
   */
  const requestCameraPermission = async (): Promise<boolean> => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Camera permission is required to take photos. Please enable it in settings.'
      );
      return false;
    }
    return true;
  };

  /**
   * Request gallery permissions
   */
  const requestGalleryPermission = async (): Promise<boolean> => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Gallery permission is required to select photos. Please enable it in settings.'
      );
      return false;
    }
    return true;
  };

  /**
   * Compress image to meet size requirements
   */
  const compressImage = async (uri: string): Promise<string> => {
    try {
      // Start with 85% quality
      let quality = 0.85;
      let compressed = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: 1920 } }], // Max width 1920px
        { compress: quality, format: ImageManipulator.SaveFormat.JPEG }
      );

      // Get file size
      const response = await fetch(compressed.uri);
      const blob = await response.blob();
      let size = blob.size;

      // Reduce quality until size is acceptable
      while (size > COMPRESSED_PHOTO_MAX_SIZE && quality > 0.3) {
        quality -= 0.1;
        compressed = await ImageManipulator.manipulateAsync(
          uri,
          [{ resize: { width: 1920 } }],
          { compress: quality, format: ImageManipulator.SaveFormat.JPEG }
        );
        
        const newResponse = await fetch(compressed.uri);
        const newBlob = await newResponse.blob();
        size = newBlob.size;
      }

      return compressed.uri;
    } catch (error) {
      console.error('Error compressing image:', error);
      throw error;
    }
  };

  /**
   * Handle camera capture
   */
  const handleCameraCapture = async () => {
    if (disabled || photos.length >= maxPhotos) {
      Alert.alert('Limit Reached', `You can only add up to ${maxPhotos} photos.`);
      return;
    }

    const hasPermission = await requestCameraPermission();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await processPhoto(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Camera error:', error);
      Alert.alert('Error', 'Failed to capture photo. Please try again.');
    }
  };

  /**
   * Handle gallery selection
   */
  const handleGallerySelect = async () => {
    if (disabled || photos.length >= maxPhotos) {
      Alert.alert('Limit Reached', `You can only add up to ${maxPhotos} photos.`);
      return;
    }

    const hasPermission = await requestGalleryPermission();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        allowsMultipleSelection: true,
        selectionLimit: maxPhotos - photos.length,
      });

      if (!result.canceled && result.assets.length > 0) {
        for (const asset of result.assets) {
          await processPhoto(asset.uri);
        }
      }
    } catch (error) {
      console.error('Gallery error:', error);
      Alert.alert('Error', 'Failed to select photo. Please try again.');
    }
  };

  /**
   * Process and compress photo
   */
  const processPhoto = async (uri: string) => {
    setCompressing(true);
    try {
      // Compress image
      const compressedUri = await compressImage(uri);

      // Get file info
      const response = await fetch(compressedUri);
      const blob = await response.blob();
      const size = blob.size;

      // Create photo object
      const photo: CapturedPhoto = {
        uri: compressedUri,
        type: 'image/jpeg',
        name: `photo_${Date.now()}.jpg`,
        size,
      };

      // Add to photos array
      onPhotosChange([...photos, photo]);
    } catch (error) {
      console.error('Error processing photo:', error);
      Alert.alert('Error', 'Failed to process photo. Please try again.');
    } finally {
      setCompressing(false);
    }
  };

  /**
   * Remove photo
   */
  const handleRemovePhoto = (index: number) => {
    Alert.alert(
      'Remove Photo',
      'Are you sure you want to remove this photo?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            const newPhotos = photos.filter((_, i) => i !== index);
            onPhotosChange(newPhotos);
          },
        },
      ]
    );
  };

  /**
   * Show photo options
   */
  const showPhotoOptions = () => {
    Alert.alert(
      'Add Photo',
      'Choose a source',
      [
        {
          text: 'Camera',
          onPress: handleCameraCapture,
        },
        {
          text: 'Gallery',
          onPress: handleGallerySelect,
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Photos</Text>
        <Text style={styles.subtitle}>
          {photos.length}/{maxPhotos} photos added
        </Text>
      </View>

      {photos.length > 0 && (
        <ScrollView horizontal style={styles.photoList} showsHorizontalScrollIndicator={false}>
          {photos.map((photo, index) => (
            <View key={index} style={styles.photoContainer}>
              <Image source={{ uri: photo.uri }} style={styles.photo} />
              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => handleRemovePhoto(index)}
              >
                <Text style={styles.removeButtonText}>×</Text>
              </TouchableOpacity>
              <Text style={styles.photoSize}>
                {(photo.size / 1024).toFixed(0)}KB
              </Text>
            </View>
          ))}
        </ScrollView>
      )}

      {compressing && (
        <View style={styles.compressingContainer}>
          <ActivityIndicator size="small" color="#2196F3" />
          <Text style={styles.compressingText}>Compressing image...</Text>
        </View>
      )}

      {photos.length < maxPhotos && !disabled && (
        <TouchableOpacity
          style={styles.addButton}
          onPress={showPhotoOptions}
          disabled={compressing}
        >
          <Text style={styles.addButtonIcon}>📷</Text>
          <Text style={styles.addButtonText}>
            {photos.length === 0 ? 'Add Photo' : 'Add Another Photo'}
          </Text>
        </TouchableOpacity>
      )}

      {photos.length === 0 && (
        <Text style={styles.helpText}>
          Take a clear photo of the infrastructure issue. Photos help authorities understand and resolve the problem faster.
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 15,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
  },
  photoList: {
    marginBottom: 15,
  },
  photoContainer: {
    marginRight: 10,
    position: 'relative',
  },
  photo: {
    width: 120,
    height: 120,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  removeButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#F44336',
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  removeButtonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    lineHeight: 22,
  },
  photoSize: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    color: '#fff',
    fontSize: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  compressingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#E3F2FD',
    borderRadius: 8,
    marginBottom: 10,
  },
  compressingText: {
    marginLeft: 10,
    fontSize: 14,
    color: '#2196F3',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    backgroundColor: '#2196F3',
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  addButtonIcon: {
    fontSize: 24,
    marginRight: 10,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  helpText: {
    fontSize: 14,
    color: '#666',
    marginTop: 10,
    lineHeight: 20,
  },
});

export default PhotoCapture;
