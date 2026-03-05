/**
 * Grievance Report Screen
 * Main screen for reporting infrastructure issues with photo capture,
 * AI classification, and location extraction
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { PhotoCapture, CapturedPhoto } from '../../components/grievance/PhotoCapture';
import { CategorySelector } from '../../components/grievance/CategorySelector';
import { LocationPicker } from '../../components/grievance/LocationPicker';
import { OfflineIndicator } from '../../components/OfflineIndicator';
import {
  submitGrievance,
  classifyGrievancePhoto,
  GrievanceCategory,
  SeverityLevel,
  GPSLocation,
  GrievanceSubmissionInput,
} from '../../services/api/grievance-api';
import SyncQueue from '../../services/sync/sync-queue';
import BackgroundSyncService from '../../services/sync/background-sync';

interface GrievanceReportScreenProps {
  navigation: any;
}

export const GrievanceReportScreen: React.FC<GrievanceReportScreenProps> = ({
  navigation,
}) => {
  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [photos, setPhotos] = useState<CapturedPhoto[]>([]);
  const [category, setCategory] = useState<GrievanceCategory | null>(null);
  const [location, setLocation] = useState<GPSLocation | null>(null);
  const [address, setAddress] = useState('');
  const [landmark, setLandmark] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [reporterContact, setReporterContact] = useState('');

  // AI classification state
  const [aiCategory, setAiCategory] = useState<GrievanceCategory | null>(null);
  const [aiConfidence, setAiConfidence] = useState<number>(0);
  const [aiSeverity, setAiSeverity] = useState<SeverityLevel | null>(null);
  const [isClassifying, setIsClassifying] = useState(false);
  const [locationExtractedFromPhoto, setLocationExtractedFromPhoto] = useState(false);

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    // Check connectivity status
    const connectivity = BackgroundSyncService.getConnectivityStatus();
    setIsOnline(connectivity.isOnline);

    // Listen for connectivity changes
    const listener = (online: boolean) => {
      setIsOnline(online);
    };
    BackgroundSyncService.addConnectivityListener(listener);

    return () => {
      BackgroundSyncService.removeConnectivityListener(listener);
    };
  }, []);

  /**
   * Classify photo when first photo is added
   */
  useEffect(() => {
    if (photos.length > 0 && !aiCategory && description.trim()) {
      classifyPhoto();
    }
  }, [photos, description]);

  /**
   * Classify photo using AI
   */
  const classifyPhoto = async () => {
    if (photos.length === 0) return;

    setIsClassifying(true);
    try {
      const result = await classifyGrievancePhoto(photos[0].uri, description);
      
      setAiCategory(result.category);
      setAiConfidence(result.confidence);
      setAiSeverity(result.severity);

      // Auto-select category if confidence is high
      if (result.confidence >= 85 && !category) {
        setCategory(result.category);
      }
    } catch (error) {
      console.error('Classification error:', error);
      // Fail silently - user can still select category manually
    } finally {
      setIsClassifying(false);
    }
  };

  /**
   * Extract location from photo EXIF data
   */
  const extractLocationFromPhoto = async () => {
    // TODO: Implement EXIF extraction on mobile
    // For now, this is a placeholder
    // In production, use expo-image-picker's exif data or a library like react-native-exif
    console.log('Location extraction from EXIF not yet implemented');
  };

  /**
   * Validate form
   */
  const validateForm = (): boolean => {
    if (photos.length === 0) {
      Alert.alert('Photo Required', 'Please add at least one photo of the issue.');
      return false;
    }

    if (!title.trim()) {
      Alert.alert('Title Required', 'Please provide a brief title for the issue.');
      return false;
    }

    if (!description.trim()) {
      Alert.alert('Description Required', 'Please describe the issue in detail.');
      return false;
    }

    if (!category) {
      Alert.alert('Category Required', 'Please select or verify the issue category.');
      return false;
    }

    if (isAnonymous && !reporterContact.trim()) {
      Alert.alert(
        'Contact Required',
        'For anonymous reports, please provide a contact number for follow-up.'
      );
      return false;
    }

    return true;
  };

  /**
   * Submit grievance
   */
  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      const input: GrievanceSubmissionInput = {
        title: title.trim(),
        description: description.trim(),
        category: category!,
        location: location || undefined,
        address: address.trim() || undefined,
        landmark: landmark.trim() || undefined,
        photos: photos.map((p) => ({
          uri: p.uri,
          type: p.type,
          name: p.name,
          size: p.size,
        })),
        isAnonymous,
        reporterContact: isAnonymous ? reporterContact.trim() : undefined,
      };

      // Submit grievance (works in both online and offline mode with mock data)
      const result = await submitGrievance(input);
      showSuccessScreen(result.ticketNumber, result.isDuplicate);
    } catch (error: any) {
      console.error('Submission error:', error);
      Alert.alert(
        'Submission Failed',
        error.message || 'Failed to submit grievance. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Show success screen
   */
  const showSuccessScreen = (ticketNumber: string, isDuplicate: boolean) => {
    Alert.alert(
      'Grievance Submitted',
      `Your ticket number is: ${ticketNumber}\n\n${
        isDuplicate
          ? 'Note: A similar grievance was found nearby. Your report has been linked to it.'
          : 'Authorities have been notified and will address the issue soon.'
      }`,
      [
        {
          text: 'Track Status',
          onPress: () => {
            // Navigate to tracking screen
            navigation.replace('GrievanceTracking', { ticketNumber });
          },
        },
        {
          text: 'Done',
          onPress: () => navigation.goBack(),
        },
      ]
    );
  };

  /**
   * Retry AI classification
   */
  const handleRetryClassification = () => {
    if (description.trim()) {
      classifyPhoto();
    } else {
      Alert.alert(
        'Description Required',
        'Please add a description first to help AI classify the issue.'
      );
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <OfflineIndicator showDetails />
      
      <ScrollView style={styles.scrollView} keyboardShouldPersistTaps="handled">
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>Report Infrastructure Issue</Text>
            <Text style={styles.subtitle}>
              Help improve your community by reporting issues
            </Text>
          </View>

          {/* Photo Capture */}
          <PhotoCapture
            photos={photos}
            onPhotosChange={setPhotos}
            disabled={isSubmitting}
          />

          {/* Title Input */}
          <View style={styles.section}>
            <Text style={styles.label}>Title *</Text>
            <TextInput
              style={styles.input}
              placeholder="Brief title (e.g., 'Large pothole on Main Road')"
              value={title}
              onChangeText={setTitle}
              maxLength={100}
              editable={!isSubmitting}
            />
            <Text style={styles.charCount}>{title.length}/100</Text>
          </View>

          {/* Description Input */}
          <View style={styles.section}>
            <Text style={styles.label}>Description *</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Describe the issue in detail..."
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
              maxLength={500}
              editable={!isSubmitting}
            />
            <Text style={styles.charCount}>{description.length}/500</Text>
          </View>

          {/* Category Selection */}
          <CategorySelector
            selectedCategory={category}
            onCategoryChange={setCategory}
            aiCategory={aiCategory || undefined}
            aiConfidence={aiConfidence}
            aiSeverity={aiSeverity || undefined}
            isClassifying={isClassifying}
            disabled={isSubmitting}
          />

          {aiCategory && aiConfidence < 85 && (
            <TouchableOpacity
              style={styles.retryButton}
              onPress={handleRetryClassification}
              disabled={isClassifying}
            >
              <Text style={styles.retryButtonText}>🔄 Retry AI Classification</Text>
            </TouchableOpacity>
          )}

          {/* Location Picker */}
          <LocationPicker
            location={location}
            onLocationChange={setLocation}
            extractedFromPhoto={locationExtractedFromPhoto}
            disabled={isSubmitting}
          />

          {/* Address Input */}
          <View style={styles.section}>
            <Text style={styles.label}>Address (Optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="Street address or area name"
              value={address}
              onChangeText={setAddress}
              editable={!isSubmitting}
            />
          </View>

          {/* Landmark Input */}
          <View style={styles.section}>
            <Text style={styles.label}>Nearby Landmark (Optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., 'Near City Hospital'"
              value={landmark}
              onChangeText={setLandmark}
              editable={!isSubmitting}
            />
          </View>

          {/* Anonymous Reporting */}
          <TouchableOpacity
            style={styles.checkboxContainer}
            onPress={() => setIsAnonymous(!isAnonymous)}
            disabled={isSubmitting}
          >
            <View style={[styles.checkbox, isAnonymous && styles.checkboxChecked]}>
              {isAnonymous && <Text style={styles.checkmark}>✓</Text>}
            </View>
            <View style={styles.checkboxContent}>
              <Text style={styles.checkboxLabel}>Report Anonymously</Text>
              <Text style={styles.checkboxDescription}>
                Your identity will be kept private
              </Text>
            </View>
          </TouchableOpacity>

          {/* Contact for Anonymous */}
          {isAnonymous && (
            <View style={styles.section}>
              <Text style={styles.label}>Contact Number *</Text>
              <TextInput
                style={styles.input}
                placeholder="For follow-up (kept confidential)"
                value={reporterContact}
                onChangeText={setReporterContact}
                keyboardType="phone-pad"
                maxLength={15}
                editable={!isSubmitting}
              />
            </View>
          )}

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.submitButtonText}>Submit Grievance</Text>
            )}
          </TouchableOpacity>

          {!isOnline && (
            <Text style={styles.offlineNote}>
              You are offline. Using mock submission for testing.
            </Text>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
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
    padding: 15,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
  },
  section: {
    marginVertical: 10,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    padding: 15,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    fontSize: 16,
    color: '#333',
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  charCount: {
    fontSize: 12,
    color: '#999',
    textAlign: 'right',
    marginTop: 5,
  },
  retryButton: {
    padding: 12,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2196F3',
    alignItems: 'center',
    marginVertical: 10,
  },
  retryButtonText: {
    fontSize: 14,
    color: '#2196F3',
    fontWeight: '600',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#fff',
    borderRadius: 8,
    marginVertical: 10,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#ddd',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#2196F3',
    borderColor: '#2196F3',
  },
  checkmark: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  checkboxContent: {
    flex: 1,
  },
  checkboxLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  checkboxDescription: {
    fontSize: 13,
    color: '#666',
  },
  submitButton: {
    padding: 18,
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  submitButtonDisabled: {
    backgroundColor: '#ccc',
  },
  submitButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  offlineNote: {
    fontSize: 13,
    color: '#FF9800',
    textAlign: 'center',
    fontStyle: 'italic',
    marginBottom: 20,
  },
});

export default GrievanceReportScreen;

export default GrievanceReportScreen;
