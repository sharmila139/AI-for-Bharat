/**
 * Soil Health Card OCR Screen
 * 
 * Mobile screen for capturing soil health card images, processing with OCR,
 * and providing manual correction interface when needed.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';

interface SoilHealthCardData {
  pH?: number;
  nitrogen?: number;
  phosphorus?: number;
  potassium?: number;
  organicCarbon?: number;
  sulfur?: number;
  zinc?: number;
  iron?: number;
  copper?: number;
  manganese?: number;
  boron?: number;
  electricalConductivity?: number;
}

interface OCRResult {
  success: boolean;
  data?: any;
  rawData?: SoilHealthCardData;
  needsManualReview: boolean;
  confidence: number;
  error?: {
    code: string;
    message: string;
  };
}

export const SoilHealthCardOCRScreen: React.FC = () => {
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [ocrResult, setOcrResult] = useState<OCRResult | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [editedData, setEditedData] = useState<SoilHealthCardData>({});

  /**
   * Handle image capture from camera
   */
  const handleCaptureImage = async () => {
    // In production, use react-native-image-picker or expo-image-picker
    Alert.alert('Camera', 'Camera functionality would be implemented here');
    
    // Simulated image capture
    setImageUri('https://example.com/soil-card.jpg');
  };

  /**
   * Handle image selection from gallery
   */
  const handleSelectImage = async () => {
    // In production, use react-native-image-picker or expo-image-picker
    Alert.alert('Gallery', 'Gallery selection would be implemented here');
  };

  /**
   * Process image with OCR
   */
  const handleProcessImage = async () => {
    if (!imageUri) {
      Alert.alert('Error', 'Please capture or select an image first');
      return;
    }

    setIsProcessing(true);

    try {
      // In production, call the backend OCR API
      // const response = await fetch('/api/agriculture/ocr/soil-health-card', {
      //   method: 'POST',
      //   body: formData,
      // });
      // const result = await response.json();

      // Simulated OCR result
      const simulatedResult: OCRResult = {
        success: true,
        rawData: {
          pH: 6.8,
          nitrogen: 245,
          phosphorus: 18,
          potassium: 156,
          organicCarbon: 0.62,
          zinc: 0.8,
        },
        needsManualReview: true,
        confidence: 78,
      };

      setOcrResult(simulatedResult);
      setEditedData(simulatedResult.rawData || {});

      if (simulatedResult.needsManualReview) {
        setEditMode(true);
        Alert.alert(
          'Review Required',
          `OCR confidence is ${simulatedResult.confidence}%. Please review and correct the extracted values.`
        );
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to process image');
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * Update a field value
   */
  const handleFieldChange = (field: keyof SoilHealthCardData, value: string) => {
    const numValue = parseFloat(value);
    setEditedData(prev => ({
      ...prev,
      [field]: isNaN(numValue) ? undefined : numValue,
    }));
  };

  /**
   * Save corrected data
   */
  const handleSaveData = async () => {
    try {
      // Validate data
      const hasRequiredFields = editedData.pH || editedData.nitrogen || editedData.phosphorus;
      
      if (!hasRequiredFields) {
        Alert.alert('Error', 'Please enter at least pH, Nitrogen, or Phosphorus values');
        return;
      }

      // In production, save to backend and local database
      Alert.alert('Success', 'Soil health data saved successfully');
      
      // Reset state
      setImageUri(null);
      setOcrResult(null);
      setEditedData({});
      setEditMode(false);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to save data');
    }
  };

  /**
   * Render field input
   */
  const renderFieldInput = (
    label: string,
    field: keyof SoilHealthCardData,
    unit: string,
    placeholder: string
  ) => {
    const value = editedData[field];
    const hasValue = value !== undefined;

    return (
      <View style={styles.fieldContainer}>
        <Text style={styles.fieldLabel}>{label}</Text>
        <View style={styles.inputRow}>
          <TextInput
            style={[styles.input, hasValue && styles.inputWithValue]}
            value={value?.toString() || ''}
            onChangeText={(text) => handleFieldChange(field, text)}
            placeholder={placeholder}
            keyboardType="decimal-pad"
            editable={editMode}
          />
          <Text style={styles.unit}>{unit}</Text>
        </View>
      </View>
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Soil Health Card Scanner</Text>
        <Text style={styles.subtitle}>
          Scan your government soil health card to extract nutrient values
        </Text>
      </View>

      {/* Image Capture Section */}
      {!imageUri && (
        <View style={styles.captureSection}>
          <TouchableOpacity style={styles.button} onPress={handleCaptureImage}>
            <Text style={styles.buttonText}>📷 Capture Photo</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.buttonSecondary} onPress={handleSelectImage}>
            <Text style={styles.buttonSecondaryText}>🖼️ Select from Gallery</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Image Preview */}
      {imageUri && !ocrResult && (
        <View style={styles.previewSection}>
          <Image source={{ uri: imageUri }} style={styles.imagePreview} />
          <TouchableOpacity style={styles.button} onPress={handleProcessImage} disabled={isProcessing}>
            {isProcessing ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>🔍 Extract Data</Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity style={styles.buttonSecondary} onPress={() => setImageUri(null)}>
            <Text style={styles.buttonSecondaryText}>↩️ Retake Photo</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* OCR Results and Manual Correction */}
      {ocrResult && (
        <View style={styles.resultsSection}>
          {/* Confidence Indicator */}
          <View style={styles.confidenceBar}>
            <Text style={styles.confidenceLabel}>
              OCR Confidence: {ocrResult.confidence}%
            </Text>
            <View style={styles.confidenceBarContainer}>
              <View
                style={[
                  styles.confidenceBarFill,
                  {
                    width: `${ocrResult.confidence}%`,
                    backgroundColor:
                      ocrResult.confidence >= 85
                        ? '#4CAF50'
                        : ocrResult.confidence >= 70
                        ? '#FF9800'
                        : '#F44336',
                  },
                ]}
              />
            </View>
          </View>

          {/* Manual Review Notice */}
          {ocrResult.needsManualReview && (
            <View style={styles.reviewNotice}>
              <Text style={styles.reviewNoticeText}>
                ⚠️ Please review and correct the extracted values below
              </Text>
            </View>
          )}

          {/* Edit Mode Toggle */}
          <TouchableOpacity
            style={styles.editToggle}
            onPress={() => setEditMode(!editMode)}
          >
            <Text style={styles.editToggleText}>
              {editMode ? '✓ Done Editing' : '✏️ Edit Values'}
            </Text>
          </TouchableOpacity>

          {/* Primary Nutrients */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Primary Nutrients (NPK)</Text>
            {renderFieldInput('Nitrogen (N)', 'nitrogen', 'kg/ha', 'e.g., 245')}
            {renderFieldInput('Phosphorus (P)', 'phosphorus', 'kg/ha', 'e.g., 18')}
            {renderFieldInput('Potassium (K)', 'potassium', 'kg/ha', 'e.g., 156')}
          </View>

          {/* Soil Properties */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Soil Properties</Text>
            {renderFieldInput('pH', 'pH', '', 'e.g., 6.8')}
            {renderFieldInput('Organic Carbon', 'organicCarbon', '%', 'e.g., 0.62')}
            {renderFieldInput('Electrical Conductivity', 'electricalConductivity', 'dS/m', 'e.g., 0.45')}
          </View>

          {/* Micronutrients */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Micronutrients</Text>
            {renderFieldInput('Sulfur (S)', 'sulfur', 'ppm', 'e.g., 15')}
            {renderFieldInput('Zinc (Zn)', 'zinc', 'ppm', 'e.g., 0.8')}
            {renderFieldInput('Iron (Fe)', 'iron', 'ppm', 'e.g., 8.5')}
            {renderFieldInput('Copper (Cu)', 'copper', 'ppm', 'e.g., 0.3')}
            {renderFieldInput('Manganese (Mn)', 'manganese', 'ppm', 'e.g., 3.2')}
            {renderFieldInput('Boron (B)', 'boron', 'ppm', 'e.g., 0.7')}
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.button} onPress={handleSaveData}>
              <Text style={styles.buttonText}>💾 Save Data</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.buttonSecondary}
              onPress={() => {
                setImageUri(null);
                setOcrResult(null);
                setEditedData({});
                setEditMode(false);
              }}
            >
              <Text style={styles.buttonSecondaryText}>🔄 Start Over</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Help Section */}
      <View style={styles.helpSection}>
        <Text style={styles.helpTitle}>Tips for Best Results:</Text>
        <Text style={styles.helpText}>• Ensure good lighting (natural daylight is best)</Text>
        <Text style={styles.helpText}>• Hold camera steady and parallel to document</Text>
        <Text style={styles.helpText}>• Make sure text is in focus and clearly readable</Text>
        <Text style={styles.helpText}>• Avoid shadows, glare, or reflections</Text>
        <Text style={styles.helpText}>• Capture the entire document within the frame</Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
  },
  captureSection: {
    padding: 20,
  },
  previewSection: {
    padding: 20,
  },
  imagePreview: {
    width: '100%',
    height: 300,
    borderRadius: 8,
    marginBottom: 16,
    backgroundColor: '#e0e0e0',
  },
  button: {
    backgroundColor: '#4CAF50',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonSecondary: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  buttonSecondaryText: {
    color: '#4CAF50',
    fontSize: 16,
    fontWeight: '600',
  },
  resultsSection: {
    padding: 20,
  },
  confidenceBar: {
    marginBottom: 16,
  },
  confidenceLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  confidenceBarContainer: {
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  confidenceBarFill: {
    height: '100%',
  },
  reviewNotice: {
    backgroundColor: '#FFF3CD',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
  },
  reviewNoticeText: {
    color: '#856404',
    fontSize: 14,
  },
  editToggle: {
    backgroundColor: '#2196F3',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
  },
  editToggleText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  section: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  fieldContainer: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  inputWithValue: {
    backgroundColor: '#fff',
    borderColor: '#4CAF50',
  },
  unit: {
    marginLeft: 8,
    fontSize: 14,
    color: '#666',
    minWidth: 60,
  },
  actionButtons: {
    marginTop: 8,
  },
  helpSection: {
    padding: 20,
    backgroundColor: '#E3F2FD',
    margin: 20,
    borderRadius: 8,
  },
  helpTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1976D2',
    marginBottom: 12,
  },
  helpText: {
    fontSize: 14,
    color: '#1565C0',
    marginBottom: 6,
  },
});
