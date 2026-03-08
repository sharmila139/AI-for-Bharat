/**
 * Soil Analysis Screen
 * Photo capture and upload for soil analysis
 * 
 * Features:
 * - Camera and gallery integration
 * - Photo preview before upload
 * - Analysis type selection (direct photo or health card OCR)
 * - Upload to backend API
 * - Loading and error states
 * - Permission handling
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  Platform,
  PermissionsAndroid,
  Modal,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { launchCamera, launchImageLibrary, ImagePickerResponse } from 'react-native-image-picker';
import { AgricultureStackNavigationProp } from '../../navigation/types';
import soilAnalysisService, { SoilAnalysisResult } from '../../services/soilAnalysisService';
import LoadingState from '../../components/LoadingState';
import ErrorState from '../../components/ErrorState';

type AnalysisType = 'photo' | 'health-card';

const SoilAnalysisScreen: React.FC = () => {
  const navigation = useNavigation<AgricultureStackNavigationProp>();

  // State
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [analysisType, setAnalysisType] = useState<AnalysisType>('photo');
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showTypeSelector, setShowTypeSelector] = useState(false);
  const [guidelines, setGuidelines] = useState<string[]>([]);

  useEffect(() => {
    loadGuidelines();
  }, []);

  const loadGuidelines = async () => {
    try {
      const { guidelines: guidelinesList } = await soilAnalysisService.getQualityRequirements();
      setGuidelines(guidelinesList);
    } catch (err) {
      console.error('Error loading guidelines:', err);
    }
  };

  /**
   * Request camera permission on Android
   */
  const requestCameraPermission = async (): Promise<boolean> => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.CAMERA,
          {
            title: 'Camera Permission',
            message: 'RuralConnect needs access to your camera to capture soil photos.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.warn('Camera permission error:', err);
        return false;
      }
    }
    return true;
  };

  /**
   * Handle camera capture
   */
  const handleTakePhoto = async () => {
    const hasPermission = await requestCameraPermission();
    
    if (!hasPermission) {
      Alert.alert(
        'Permission Denied',
        'Camera permission is required to take photos. Please enable it in your device settings.'
      );
      return;
    }

    launchCamera(
      {
        mediaType: 'photo',
        quality: 0.8,
        maxWidth: 1920,
        maxHeight: 1080,
        saveToPhotos: false,
        includeBase64: false,
      },
      handleImageResponse
    );
  };

  /**
   * Handle gallery selection
   */
  const handleSelectFromGallery = () => {
    launchImageLibrary(
      {
        mediaType: 'photo',
        quality: 0.8,
        maxWidth: 1920,
        maxHeight: 1080,
        includeBase64: false,
      },
      handleImageResponse
    );
  };

  /**
   * Handle image picker response
   */
  const handleImageResponse = (response: ImagePickerResponse) => {
    if (response.didCancel) {
      console.log('User cancelled image picker');
      return;
    }

    if (response.errorCode) {
      console.error('ImagePicker Error:', response.errorMessage);
      Alert.alert('Error', response.errorMessage || 'Failed to select image');
      return;
    }

    if (response.assets && response.assets.length > 0) {
      const asset = response.assets[0];
      if (asset.uri) {
        setSelectedImage(asset.uri);
        setError(null);
      }
    }
  };

  /**
   * Handle photo upload and analysis
   */
  const handleUploadAndAnalyze = async () => {
    if (!selectedImage) {
      Alert.alert('No Image', 'Please capture or select a photo first.');
      return;
    }

    setUploading(true);
    setAnalyzing(true);
    setError(null);

    try {
      const result: SoilAnalysisResult = await soilAnalysisService.analyzeSoilPhoto(
        selectedImage,
        analysisType
      );

      setUploading(false);
      setAnalyzing(false);

      if (result.success) {
        // Build analysis message from AI response
        let analysisMessage = '';
        
        if (result.data?.analysis) {
          const analysis = result.data.analysis;
          
          analysisMessage += `🌱 Soil Health: ${analysis.soilHealth || 'Unknown'}\n\n`;
          
          if (analysis.deficiencies && analysis.deficiencies.length > 0) {
            analysisMessage += `⚠️ Deficiencies:\n${analysis.deficiencies.map(d => `  • ${d}`).join('\n')}\n\n`;
          }
          
          if (analysis.recommendations && analysis.recommendations.length > 0) {
            analysisMessage += `💡 Recommendations:\n`;
            analysis.recommendations.slice(0, 3).forEach((rec, idx) => {
              analysisMessage += `${idx + 1}. ${rec.action}\n`;
            });
            analysisMessage += '\n';
          }
          
          if (analysis.fertilizerAdvice) {
            analysisMessage += `🌾 Fertilizer Advice:\n${analysis.fertilizerAdvice.substring(0, 200)}${analysis.fertilizerAdvice.length > 200 ? '...' : ''}`;
          }
        } else {
          // Fallback to basic info
          analysisMessage = `Soil Type: ${result.data?.soilType}\nConfidence: ${(result.data?.confidence || 0) * 100}%`;
        }
        
        // Navigate to results screen
        Alert.alert(
          '✅ Analysis Complete',
          analysisMessage,
          [
            {
              text: 'Analyze Another',
              onPress: () => {
                setSelectedImage(null);
                setError(null);
              },
            },
            {
              text: 'OK',
              style: 'cancel',
            },
          ],
          { cancelable: true }
        );
      } else {
        // Handle analysis failure
        const errorMessage = result.error?.message || 'Analysis failed';
        
        if (result.requiresManualReview) {
          Alert.alert(
            'Manual Review Required',
            `${errorMessage}\n\nThe image quality or confidence level is below the threshold. Please try again with a clearer photo or contact support for manual review.`,
            [
              {
                text: 'Try Again',
                onPress: () => {
                  setSelectedImage(null);
                  setError(null);
                },
              },
              { text: 'OK' },
            ]
          );
        } else {
          setError(errorMessage);
        }
      }
    } catch (err: any) {
      console.error('Upload error:', err);
      setUploading(false);
      setAnalyzing(false);
      setError(
        err.message || 'Failed to upload and analyze photo. Please check your connection and try again.'
      );
    }
  };

  /**
   * Render analysis type selector modal
   */
  const renderTypeSelector = () => (
    <Modal
      visible={showTypeSelector}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowTypeSelector(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Analysis Type</Text>
            <TouchableOpacity onPress={() => setShowTypeSelector(false)}>
              <Text style={styles.modalClose}>✕</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[
              styles.typeOption,
              analysisType === 'photo' && styles.typeOptionActive,
            ]}
            onPress={() => {
              setAnalysisType('photo');
              setShowTypeSelector(false);
            }}
          >
            <Text style={styles.typeOptionIcon}>📸</Text>
            <View style={styles.typeOptionContent}>
              <Text style={styles.typeOptionTitle}>Direct Soil Photo</Text>
              <Text style={styles.typeOptionDescription}>
                Take a photo of soil sample for AI-based analysis of soil type, texture, and
                nutrient indicators
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.typeOption,
              analysisType === 'health-card' && styles.typeOptionActive,
            ]}
            onPress={() => {
              setAnalysisType('health-card');
              setShowTypeSelector(false);
            }}
          >
            <Text style={styles.typeOptionIcon}>📄</Text>
            <View style={styles.typeOptionContent}>
              <Text style={styles.typeOptionTitle}>Soil Health Card</Text>
              <Text style={styles.typeOptionDescription}>
                Capture government soil health card for OCR extraction of nutrient values and pH
                levels
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  /**
   * Render guidelines
   */
  const renderGuidelines = () => {
    if (guidelines.length === 0) return null;

    return (
      <View style={styles.guidelinesContainer}>
        <Text style={styles.guidelinesTitle}>📋 Photo Guidelines</Text>
        {guidelines.map((guideline, index) => (
          <View key={index} style={styles.guidelineItem}>
            <Text style={styles.guidelineBullet}>•</Text>
            <Text style={styles.guidelineText}>{guideline}</Text>
          </View>
        ))}
      </View>
    );
  };

  if (analyzing) {
    return (
      <LoadingState
        message={
          analysisType === 'photo'
            ? 'Analyzing soil photo...\nThis may take a few moments.'
            : 'Extracting data from health card...\nPlease wait.'
        }
      />
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* Analysis Type Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Analysis Type</Text>
          <TouchableOpacity
            style={styles.typeSelector}
            onPress={() => setShowTypeSelector(true)}
          >
            <View style={styles.typeSelectorContent}>
              <Text style={styles.typeSelectorIcon}>
                {analysisType === 'photo' ? '📸' : '📄'}
              </Text>
              <View style={styles.typeSelectorText}>
                <Text style={styles.typeSelectorTitle}>
                  {analysisType === 'photo' ? 'Direct Soil Photo' : 'Soil Health Card'}
                </Text>
                <Text style={styles.typeSelectorDescription}>
                  {analysisType === 'photo'
                    ? 'AI-based soil analysis'
                    : 'OCR extraction from document'}
                </Text>
              </View>
            </View>
            <Text style={styles.typeSelectorArrow}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Photo Capture/Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {selectedImage ? 'Photo Preview' : 'Capture Photo'}
          </Text>

          {selectedImage ? (
            <View style={styles.previewContainer}>
              <Image source={{ uri: selectedImage }} style={styles.previewImage} />
              <View style={styles.previewActions}>
                <TouchableOpacity
                  style={styles.previewActionButton}
                  onPress={() => setSelectedImage(null)}
                >
                  <Text style={styles.previewActionText}>✕ Remove</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.previewActionButton}
                  onPress={handleTakePhoto}
                >
                  <Text style={styles.previewActionText}>📸 Retake</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.captureContainer}>
              <View style={styles.captureIconContainer}>
                <Text style={styles.captureIcon}>📷</Text>
              </View>
              <Text style={styles.captureText}>
                {analysisType === 'photo'
                  ? 'Take a clear photo of your soil sample'
                  : 'Capture your soil health card document'}
              </Text>
              <View style={styles.captureButtons}>
                <TouchableOpacity style={styles.captureButton} onPress={handleTakePhoto}>
                  <Text style={styles.captureButtonIcon}>📸</Text>
                  <Text style={styles.captureButtonText}>Take Photo</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.captureButton}
                  onPress={handleSelectFromGallery}
                >
                  <Text style={styles.captureButtonIcon}>🖼️</Text>
                  <Text style={styles.captureButtonText}>Choose from Gallery</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        {/* Guidelines */}
        {!selectedImage && renderGuidelines()}

        {/* Error Display */}
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorIcon}>⚠️</Text>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity
              style={styles.errorRetryButton}
              onPress={() => {
                setError(null);
                setSelectedImage(null);
              }}
            >
              <Text style={styles.errorRetryText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Upload Button */}
      {selectedImage && !error && (
        <View style={styles.actionBar}>
          <TouchableOpacity
            style={[styles.uploadButton, uploading && styles.uploadButtonDisabled]}
            onPress={handleUploadAndAnalyze}
            disabled={uploading}
          >
            <Text style={styles.uploadButtonText}>
              {uploading ? 'Uploading...' : 'Upload & Analyze'}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {renderTypeSelector()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 100,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginBottom: 12,
  },
  typeSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  typeSelectorContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  typeSelectorIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  typeSelectorText: {
    flex: 1,
  },
  typeSelectorTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  typeSelectorDescription: {
    fontSize: 12,
    color: '#666',
  },
  typeSelectorArrow: {
    fontSize: 24,
    color: '#999',
    marginLeft: 8,
  },
  captureContainer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  captureIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  captureIcon: {
    fontSize: 48,
  },
  captureText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  captureButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  captureButton: {
    flex: 1,
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    minWidth: 140,
  },
  captureButtonIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  captureButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  previewContainer: {
    alignItems: 'center',
  },
  previewImage: {
    width: '100%',
    height: 300,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    resizeMode: 'cover',
  },
  previewActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  previewActionButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  previewActionText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  guidelinesContainer: {
    backgroundColor: '#E3F2FD',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  guidelinesTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1976D2',
    marginBottom: 12,
  },
  guidelineItem: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  guidelineBullet: {
    fontSize: 14,
    color: '#1976D2',
    marginRight: 8,
    marginTop: 2,
  },
  guidelineText: {
    flex: 1,
    fontSize: 14,
    color: '#1565C0',
    lineHeight: 20,
  },
  errorContainer: {
    backgroundColor: '#FFEBEE',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  errorText: {
    fontSize: 14,
    color: '#C62828',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 20,
  },
  errorRetryButton: {
    backgroundColor: '#fff',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#C62828',
  },
  errorRetryText: {
    color: '#C62828',
    fontSize: 14,
    fontWeight: '600',
  },
  actionBar: {
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  uploadButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  uploadButtonDisabled: {
    backgroundColor: '#A5D6A7',
  },
  uploadButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  modalClose: {
    fontSize: 24,
    color: '#666',
  },
  typeOption: {
    flexDirection: 'row',
    padding: 16,
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    backgroundColor: '#fff',
  },
  typeOptionActive: {
    borderColor: '#4CAF50',
    backgroundColor: '#E8F5E9',
  },
  typeOptionIcon: {
    fontSize: 40,
    marginRight: 12,
  },
  typeOptionContent: {
    flex: 1,
  },
  typeOptionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  typeOptionDescription: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },
});

export default SoilAnalysisScreen;
