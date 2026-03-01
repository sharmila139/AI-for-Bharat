/**
 * Crop Recommendation Input Screen
 * Form for collecting farm conditions to generate crop recommendations
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Modal,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { AgricultureStackNavigationProp } from '../../navigation/types';
import { FarmProfile } from '../../types/farm';
import {
  CropRecommendationInput,
  SOIL_TYPES,
  REGIONS,
  SEASONS,
  WATER_AVAILABILITY,
} from '../../types/cropRecommendation';
import farmProfileService from '../../services/farmProfileService';
import cropRecommendationService from '../../services/cropRecommendationService';
import LoadingState from '../../components/LoadingState';
import ErrorState from '../../components/ErrorState';

const CropRecommendationInputScreen: React.FC = () => {
  const navigation = useNavigation<AgricultureStackNavigationProp>();

  // Loading states
  const [loading, setLoading] = useState(false);
  const [farmsLoading, setFarmsLoading] = useState(true);
  const [farms, setFarms] = useState<FarmProfile[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Farm profile selection
  const [selectedFarm, setSelectedFarm] = useState<FarmProfile | null>(null);
  const [showFarmSelector, setShowFarmSelector] = useState(false);
  const [useManualEntry, setUseManualEntry] = useState(false);

  // Form state - Basic Info
  const [location, setLocation] = useState('');
  const [soilType, setSoilType] = useState('');
  const [season, setSeason] = useState('');
  const [region, setRegion] = useState('');

  // Form state - Soil Nutrients
  const [nitrogen, setNitrogen] = useState('');
  const [phosphorus, setPhosphorus] = useState('');
  const [potassium, setPotassium] = useState('');
  const [ph, setPh] = useState('');

  // Form state - Climate
  const [temperature, setTemperature] = useState('');
  const [humidity, setHumidity] = useState('');
  const [rainfall, setRainfall] = useState('');

  // Form state - Additional
  const [landSize, setLandSize] = useState('');
  const [budget, setBudget] = useState('');
  const [waterAvailability, setWaterAvailability] = useState('');
  const [previousCrop, setPreviousCrop] = useState('');

  useEffect(() => {
    loadFarms();
  }, []);

  const loadFarms = async () => {
    try {
      const farmList = await farmProfileService.getUserFarms();
      setFarms(farmList);
      if (farmList.length === 0) {
        setUseManualEntry(true);
      }
    } catch (err) {
      console.error('Error loading farms:', err);
      setUseManualEntry(true);
    } finally {
      setFarmsLoading(false);
    }
  };

  const handleFarmSelect = (farm: FarmProfile) => {
    setSelectedFarm(farm);
    setShowFarmSelector(false);
    
    // Pre-fill form with farm data
    setLocation(`${farm.location.district}, ${farm.location.state}`);
    if (farm.soilType) {
      const matchingSoil = SOIL_TYPES.find(s => 
        s.label.toLowerCase().includes(farm.soilType!.toLowerCase())
      );
      if (matchingSoil) {
        setSoilType(matchingSoil.value);
      }
    }
    if (farm.landSize) {
      setLandSize(farm.landSize.value.toString());
    }
  };

  const validateForm = (): boolean => {
    // Required fields
    if (!soilType) {
      Alert.alert('Validation Error', 'Please select soil type');
      return false;
    }
    if (!season) {
      Alert.alert('Validation Error', 'Please select season');
      return false;
    }
    if (!region) {
      Alert.alert('Validation Error', 'Please select region');
      return false;
    }

    // Validate numeric fields
    const numericFields = [
      { value: nitrogen, name: 'Nitrogen', min: 0, max: 200 },
      { value: phosphorus, name: 'Phosphorus', min: 0, max: 100 },
      { value: potassium, name: 'Potassium', min: 0, max: 150 },
      { value: ph, name: 'pH', min: 3, max: 10 },
      { value: temperature, name: 'Temperature', min: -10, max: 50 },
      { value: humidity, name: 'Humidity', min: 0, max: 100 },
      { value: rainfall, name: 'Rainfall', min: 0, max: 500 },
    ];

    for (const field of numericFields) {
      if (!field.value || field.value.trim() === '') {
        Alert.alert('Validation Error', `Please enter ${field.name}`);
        return false;
      }
      const numValue = parseFloat(field.value);
      if (isNaN(numValue) || numValue < field.min || numValue > field.max) {
        Alert.alert(
          'Validation Error',
          `${field.name} must be between ${field.min} and ${field.max}`
        );
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    setError(null);

    try {
      const input: CropRecommendationInput = {
        soilType,
        nitrogen: parseFloat(nitrogen),
        phosphorus: parseFloat(phosphorus),
        potassium: parseFloat(potassium),
        ph: parseFloat(ph),
        temperature: parseFloat(temperature),
        humidity: parseFloat(humidity),
        rainfall: parseFloat(rainfall),
        region,
        season,
        topN: 5,
      };

      const response = await cropRecommendationService.getCropRecommendations(input);

      // Navigate to results screen with the response
      navigation.navigate('CropRecommendationResults', { data: response });
    } catch (err: any) {
      console.error('Error getting recommendations:', err);
      setError(
        err.response?.data?.message ||
        'Failed to get crop recommendations. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const renderFarmSelector = () => (
    <Modal
      visible={showFarmSelector}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowFarmSelector(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Farm Profile</Text>
            <TouchableOpacity onPress={() => setShowFarmSelector(false)}>
              <Text style={styles.modalClose}>✕</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.farmList}>
            {farms.map((farm) => (
              <TouchableOpacity
                key={farm.farmId}
                style={styles.farmItem}
                onPress={() => handleFarmSelect(farm)}
              >
                <Text style={styles.farmItemName}>{farm.farmName}</Text>
                <Text style={styles.farmItemDetails}>
                  {farm.location.district}, {farm.location.state}
                </Text>
                {farm.soilType && (
                  <Text style={styles.farmItemDetails}>Soil: {farm.soilType}</Text>
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>

          <TouchableOpacity
            style={styles.manualEntryButton}
            onPress={() => {
              setShowFarmSelector(false);
              setUseManualEntry(true);
            }}
          >
            <Text style={styles.manualEntryButtonText}>Enter Manually</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  const renderSelector = (
    label: string,
    value: string,
    options: { value: string; label: string }[],
    onSelect: (value: string) => void
  ) => (
    <View style={styles.selectorContainer}>
      <Text style={styles.label}>{label} *</Text>
      <View style={styles.selectorButtons}>
        {options.map((option) => (
          <TouchableOpacity
            key={option.value}
            style={[
              styles.selectorButton,
              value === option.value && styles.selectorButtonActive,
            ]}
            onPress={() => onSelect(option.value)}
          >
            <Text
              style={[
                styles.selectorButtonText,
                value === option.value && styles.selectorButtonTextActive,
              ]}
            >
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  if (farmsLoading) {
    return <LoadingState message="Loading farm profiles..." />;
  }

  if (loading) {
    return <LoadingState message="Getting crop recommendations..." />;
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* Farm Profile Selection */}
        {!useManualEntry && farms.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Farm Profile</Text>
            {selectedFarm ? (
              <View style={styles.selectedFarmCard}>
                <Text style={styles.selectedFarmName}>{selectedFarm.farmName}</Text>
                <Text style={styles.selectedFarmDetails}>
                  {selectedFarm.location.district}, {selectedFarm.location.state}
                </Text>
                <TouchableOpacity
                  style={styles.changeFarmButton}
                  onPress={() => setShowFarmSelector(true)}
                >
                  <Text style={styles.changeFarmButtonText}>Change Farm</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.selectFarmButton}
                onPress={() => setShowFarmSelector(true)}
              >
                <Text style={styles.selectFarmButtonText}>
                  Select from Saved Farms
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Location */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Location</Text>
          
          <Text style={styles.label}>Location</Text>
          <TextInput
            style={styles.input}
            value={location}
            onChangeText={setLocation}
            placeholder="e.g., Pune, Maharashtra"
            placeholderTextColor="#999"
          />

          {renderSelector('Region', region, REGIONS, setRegion)}
        </View>

        {/* Soil Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Soil Information</Text>
          
          {renderSelector('Soil Type', soilType, SOIL_TYPES, setSoilType)}

          <View style={styles.row}>
            <View style={styles.thirdInput}>
              <Text style={styles.label}>Nitrogen (N) *</Text>
              <TextInput
                style={styles.input}
                value={nitrogen}
                onChangeText={setNitrogen}
                placeholder="0-200"
                placeholderTextColor="#999"
                keyboardType="decimal-pad"
              />
              <Text style={styles.hint}>kg/ha</Text>
            </View>
            <View style={styles.thirdInput}>
              <Text style={styles.label}>Phosphorus (P) *</Text>
              <TextInput
                style={styles.input}
                value={phosphorus}
                onChangeText={setPhosphorus}
                placeholder="0-100"
                placeholderTextColor="#999"
                keyboardType="decimal-pad"
              />
              <Text style={styles.hint}>kg/ha</Text>
            </View>
            <View style={styles.thirdInput}>
              <Text style={styles.label}>Potassium (K) *</Text>
              <TextInput
                style={styles.input}
                value={potassium}
                onChangeText={setPotassium}
                placeholder="0-150"
                placeholderTextColor="#999"
                keyboardType="decimal-pad"
              />
              <Text style={styles.hint}>kg/ha</Text>
            </View>
          </View>

          <Text style={styles.label}>Soil pH *</Text>
          <TextInput
            style={styles.input}
            value={ph}
            onChangeText={setPh}
            placeholder="3.0 - 10.0"
            placeholderTextColor="#999"
            keyboardType="decimal-pad"
          />
          <Text style={styles.hint}>Typical range: 5.5 - 7.5</Text>
        </View>

        {/* Climate Conditions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Climate Conditions</Text>
          
          {renderSelector('Season', season, SEASONS, setSeason)}

          <View style={styles.row}>
            <View style={styles.halfInput}>
              <Text style={styles.label}>Temperature *</Text>
              <TextInput
                style={styles.input}
                value={temperature}
                onChangeText={setTemperature}
                placeholder="e.g., 25"
                placeholderTextColor="#999"
                keyboardType="decimal-pad"
              />
              <Text style={styles.hint}>°C</Text>
            </View>
            <View style={styles.halfInput}>
              <Text style={styles.label}>Humidity *</Text>
              <TextInput
                style={styles.input}
                value={humidity}
                onChangeText={setHumidity}
                placeholder="0-100"
                placeholderTextColor="#999"
                keyboardType="decimal-pad"
              />
              <Text style={styles.hint}>%</Text>
            </View>
          </View>

          <Text style={styles.label}>Rainfall *</Text>
          <TextInput
            style={styles.input}
            value={rainfall}
            onChangeText={setRainfall}
            placeholder="e.g., 150"
            placeholderTextColor="#999"
            keyboardType="decimal-pad"
          />
          <Text style={styles.hint}>mm per month</Text>
        </View>

        {/* Additional Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Additional Information (Optional)</Text>
          
          <Text style={styles.label}>Land Size</Text>
          <TextInput
            style={styles.input}
            value={landSize}
            onChangeText={setLandSize}
            placeholder="e.g., 5"
            placeholderTextColor="#999"
            keyboardType="decimal-pad"
          />
          <Text style={styles.hint}>acres</Text>

          <Text style={styles.label}>Budget/Investment Capacity</Text>
          <TextInput
            style={styles.input}
            value={budget}
            onChangeText={setBudget}
            placeholder="e.g., 50000"
            placeholderTextColor="#999"
            keyboardType="numeric"
          />
          <Text style={styles.hint}>₹ (Rupees)</Text>

          <Text style={styles.label}>Previous Crop</Text>
          <TextInput
            style={styles.input}
            value={previousCrop}
            onChangeText={setPreviousCrop}
            placeholder="e.g., Rice, Wheat"
            placeholderTextColor="#999"
          />
        </View>

        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <Text style={styles.requiredNote}>* Required fields</Text>
      </ScrollView>

      {/* Submit Button */}
      <View style={styles.actionBar}>
        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
          activeOpacity={0.8}
        >
          <Text style={styles.submitButtonText}>
            Get Crop Recommendations
          </Text>
        </TouchableOpacity>
      </View>

      {renderFarmSelector()}
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
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#333',
    backgroundColor: '#fff',
  },
  hint: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfInput: {
    flex: 1,
  },
  thirdInput: {
    flex: 1,
  },
  selectorContainer: {
    marginTop: 8,
  },
  selectorButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 6,
  },
  selectorButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
  },
  selectorButtonActive: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  selectorButtonText: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },
  selectorButtonTextActive: {
    color: '#fff',
  },
  selectedFarmCard: {
    backgroundColor: '#E8F5E9',
    padding: 16,
    borderRadius: 8,
  },
  selectedFarmName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginBottom: 4,
  },
  selectedFarmDetails: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  changeFarmButton: {
    alignSelf: 'flex-start',
  },
  changeFarmButtonText: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '600',
  },
  selectFarmButton: {
    backgroundColor: '#4CAF50',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  selectFarmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  errorContainer: {
    backgroundColor: '#FFEBEE',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  errorText: {
    color: '#C62828',
    fontSize: 14,
  },
  requiredNote: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 8,
  },
  actionBar: {
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  submitButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#A5D6A7',
  },
  submitButtonText: {
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
    maxHeight: '80%',
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
  farmList: {
    maxHeight: 400,
  },
  farmItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  farmItemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  farmItemDetails: {
    fontSize: 14,
    color: '#666',
  },
  manualEntryButton: {
    margin: 16,
    padding: 16,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    alignItems: 'center',
  },
  manualEntryButtonText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '600',
  },
});

export default CropRecommendationInputScreen;
