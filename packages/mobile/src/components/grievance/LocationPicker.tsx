/**
 * Location Picker Component
 * Shows auto-extracted location from photo or allows manual selection
 * NOTE: expo-location temporarily disabled for build
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  TextInput,
} from 'react-native';
// import * as Location from 'expo-location'; // Temporarily disabled
import { GPSLocation } from '../../services/api/grievance-api';

interface LocationPickerProps {
  location: GPSLocation | null;
  onLocationChange: (location: GPSLocation | null) => void;
  extractedFromPhoto?: boolean;
  disabled?: boolean;
}

export const LocationPicker: React.FC<LocationPickerProps> = ({
  location,
  onLocationChange,
  extractedFromPhoto = false,
  disabled = false,
}) => {
  const [showManualInput, setShowManualInput] = useState(false);

  /**
   * Get current location - STUB
   */
  const getCurrentLocation = async () => {
    Alert.alert(
      'Location Feature',
      'Location services are temporarily unavailable. Please enter coordinates manually.',
      [{ text: 'OK', onPress: () => setShowManualInput(true) }]
    );
  };

  /**
   * Handle manual location input
   */
  const handleManualInput = () => {
    setShowManualInput(true);
  };

  /**
   * Clear location
   */
  const handleClearLocation = () => {
    Alert.alert(
      'Clear Location',
      'Are you sure you want to remove the location?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: () => {
            onLocationChange(null);
          },
        },
      ]
    );
  };

  const renderLocationInfo = () => {
    if (!location) {
      return (
        <View style={styles.placeholder}>
          <Text style={styles.placeholderIcon}>📍</Text>
          <Text style={styles.placeholderText}>No location added</Text>
        </View>
      );
    }

    return (
      <View style={styles.locationInfo}>
        <View style={styles.locationHeader}>
          <Text style={styles.locationIcon}>📍</Text>
          <View style={styles.locationContent}>
            {extractedFromPhoto && (
              <View style={styles.extractedBadge}>
                <Text style={styles.extractedBadgeText}>📷 From Photo</Text>
              </View>
            )}
            <Text style={styles.locationCoords}>
              {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
            </Text>
            {location.accuracy && (
              <Text style={styles.locationAccuracy}>
                Accuracy: ±{Math.round(location.accuracy)}m
              </Text>
            )}
          </View>
        </View>
        <TouchableOpacity
          style={styles.clearButton}
          onPress={handleClearLocation}
          disabled={disabled}
        >
          <Text style={styles.clearButtonText}>✕</Text>
        </TouchableOpacity>
      </View>
    );
  };

  if (showManualInput) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Location (Manual Entry)</Text>
        <Text style={styles.subtitle}>
          Enter coordinates
        </Text>
        <View style={styles.manualInputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Latitude"
            keyboardType="numeric"
            value={location?.latitude.toString() || ''}
            onChangeText={(text) => {
              const lat = parseFloat(text);
              if (!isNaN(lat)) {
                onLocationChange({
                  latitude: lat,
                  longitude: location?.longitude || 0,
                });
              }
            }}
          />
          <TextInput
            style={styles.input}
            placeholder="Longitude"
            keyboardType="numeric"
            value={location?.longitude.toString() || ''}
            onChangeText={(text) => {
              const lon = parseFloat(text);
              if (!isNaN(lon)) {
                onLocationChange({
                  latitude: location?.latitude || 0,
                  longitude: lon,
                });
              }
            }}
          />
          <TouchableOpacity
            style={styles.doneButton}
            onPress={() => setShowManualInput(false)}
          >
            <Text style={styles.doneButtonText}>Done</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Location</Text>
      <Text style={styles.subtitle}>
        Location helps authorities identify and resolve the issue
      </Text>

      {renderLocationInfo()}

      {!location && (
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.actionButton, styles.actionButtonPrimary]}
            onPress={getCurrentLocation}
            disabled={disabled}
          >
            <Text style={styles.actionButtonIcon}>📍</Text>
            <Text style={styles.actionButtonTextPrimary}>Use Current Location</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleManualInput}
            disabled={disabled}
          >
            <Text style={styles.actionButtonIcon}>✏️</Text>
            <Text style={styles.actionButtonText}>Enter Manually</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 15,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 13,
    color: '#666',
    marginBottom: 10,
  },
  placeholder: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    borderStyle: 'dashed',
  },
  placeholderIcon: {
    fontSize: 24,
    marginRight: 10,
  },
  placeholderText: {
    fontSize: 16,
    color: '#999',
  },
  locationInfo: {
    flexDirection: 'row',
    padding: 15,
    backgroundColor: '#E8F5E9',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#4CAF50',
    marginBottom: 10,
  },
  locationHeader: {
    flex: 1,
    flexDirection: 'row',
  },
  locationIcon: {
    fontSize: 24,
    marginRight: 10,
  },
  locationContent: {
    flex: 1,
  },
  extractedBadge: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginBottom: 6,
  },
  extractedBadgeText: {
    fontSize: 11,
    color: '#fff',
    fontWeight: '600',
  },
  locationAddress: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
    fontWeight: '500',
  },
  locationCoords: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  locationAccuracy: {
    fontSize: 11,
    color: '#666',
    fontStyle: 'italic',
  },
  clearButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  clearButtonText: {
    fontSize: 20,
    color: '#666',
  },
  actions: {
    gap: 10,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  actionButtonPrimary: {
    backgroundColor: '#2196F3',
    borderColor: '#2196F3',
  },
  actionButtonIcon: {
    fontSize: 20,
    marginRight: 10,
  },
  actionButtonText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  actionButtonTextPrimary: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#E3F2FD',
    borderRadius: 8,
  },
  loadingText: {
    marginLeft: 10,
    fontSize: 14,
    color: '#2196F3',
  },
  updateButton: {
    padding: 12,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2196F3',
    alignItems: 'center',
  },
  updateButtonText: {
    fontSize: 14,
    color: '#2196F3',
    fontWeight: '600',
  },
  manualInputContainer: {
    gap: 10,
  },
  input: {
    padding: 15,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    fontSize: 16,
  },
  doneButton: {
    padding: 15,
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    alignItems: 'center',
  },
  doneButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
});

export default LocationPicker;
