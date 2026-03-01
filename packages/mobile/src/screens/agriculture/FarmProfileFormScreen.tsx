/**
 * Farm Profile Form Screen
 * Create or edit farm profiles
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
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { AgricultureStackNavigationProp, AgricultureStackParamList } from '../../navigation/types';
import { CreateFarmProfileInput } from '../../types/farm';
import farmProfileService from '../../services/farmProfileService';
import LoadingState from '../../components/LoadingState';

type FarmProfileFormRouteProp = RouteProp<AgricultureStackParamList, 'FarmProfileForm'>;

const FarmProfileFormScreen: React.FC = () => {
  const navigation = useNavigation<AgricultureStackNavigationProp>();
  const route = useRoute<FarmProfileFormRouteProp>();
  const { mode, farmId } = route.params;

  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(mode === 'edit');
  
  // Form state
  const [farmName, setFarmName] = useState('');
  const [address, setAddress] = useState('');
  const [district, setDistrict] = useState('');
  const [state, setState] = useState('');
  const [pincode, setPincode] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [landValue, setLandValue] = useState('');
  const [landUnit, setLandUnit] = useState<'acre' | 'hectare'>('acre');
  const [soilType, setSoilType] = useState('');
  const [irrigationType, setIrrigationType] = useState<string>('');

  useEffect(() => {
    if (mode === 'edit' && farmId) {
      loadFarmProfile();
    }
  }, [mode, farmId]);

  const loadFarmProfile = async () => {
    try {
      const farm = await farmProfileService.getFarmProfile(farmId!);
      setFarmName(farm.farmName);
      setAddress(farm.location.address);
      setDistrict(farm.location.district);
      setState(farm.location.state);
      setPincode(farm.location.pincode);
      setLatitude(farm.location.latitude.toString());
      setLongitude(farm.location.longitude.toString());
      setLandValue(farm.landSize.value.toString());
      setLandUnit(farm.landSize.unit);
      setSoilType(farm.soilType || '');
      setIrrigationType(farm.irrigationType || '');
    } catch (err) {
      Alert.alert('Error', 'Failed to load farm profile');
      navigation.goBack();
    } finally {
      setInitialLoading(false);
    }
  };

  const validateForm = (): boolean => {
    if (!farmName.trim()) {
      Alert.alert('Validation Error', 'Please enter farm name');
      return false;
    }
    if (!address.trim() || !district.trim() || !state.trim() || !pincode.trim()) {
      Alert.alert('Validation Error', 'Please fill in all location fields');
      return false;
    }
    if (!landValue || isNaN(parseFloat(landValue)) || parseFloat(landValue) <= 0) {
      Alert.alert('Validation Error', 'Please enter a valid land size');
      return false;
    }
    if (latitude && (isNaN(parseFloat(latitude)) || parseFloat(latitude) < -90 || parseFloat(latitude) > 90)) {
      Alert.alert('Validation Error', 'Please enter a valid latitude (-90 to 90)');
      return false;
    }
    if (longitude && (isNaN(parseFloat(longitude)) || parseFloat(longitude) < -180 || parseFloat(longitude) > 180)) {
      Alert.alert('Validation Error', 'Please enter a valid longitude (-180 to 180)');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const formData: CreateFarmProfileInput = {
        farmName: farmName.trim(),
        location: {
          address: address.trim(),
          district: district.trim(),
          state: state.trim(),
          pincode: pincode.trim(),
          latitude: latitude ? parseFloat(latitude) : 0,
          longitude: longitude ? parseFloat(longitude) : 0,
        },
        landSize: {
          value: parseFloat(landValue),
          unit: landUnit,
        },
        ...(soilType && { soilType: soilType.trim() }),
        ...(irrigationType && { irrigationType: irrigationType as any }),
      };

      if (mode === 'create') {
        await farmProfileService.createFarmProfile(formData);
        Alert.alert('Success', 'Farm profile created successfully');
      } else {
        await farmProfileService.updateFarmProfile(farmId!, formData);
        Alert.alert('Success', 'Farm profile updated successfully');
      }
      
      navigation.goBack();
    } catch (err) {
      console.error('Error saving farm profile:', err);
      Alert.alert('Error', 'Failed to save farm profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return <LoadingState message="Loading farm profile..." />;
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* Basic Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Basic Information</Text>
          
          <Text style={styles.label}>Farm Name *</Text>
          <TextInput
            style={styles.input}
            value={farmName}
            onChangeText={setFarmName}
            placeholder="e.g., Green Valley Farm"
            placeholderTextColor="#999"
          />
        </View>

        {/* Location */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Location *</Text>
          
          <Text style={styles.label}>Address</Text>
          <TextInput
            style={styles.input}
            value={address}
            onChangeText={setAddress}
            placeholder="Street address or village name"
            placeholderTextColor="#999"
            multiline
          />

          <Text style={styles.label}>District</Text>
          <TextInput
            style={styles.input}
            value={district}
            onChangeText={setDistrict}
            placeholder="e.g., Pune"
            placeholderTextColor="#999"
          />

          <Text style={styles.label}>State</Text>
          <TextInput
            style={styles.input}
            value={state}
            onChangeText={setState}
            placeholder="e.g., Maharashtra"
            placeholderTextColor="#999"
          />

          <Text style={styles.label}>PIN Code</Text>
          <TextInput
            style={styles.input}
            value={pincode}
            onChangeText={setPincode}
            placeholder="e.g., 411001"
            placeholderTextColor="#999"
            keyboardType="numeric"
            maxLength={6}
          />

          <Text style={styles.label}>Coordinates (Optional)</Text>
          <View style={styles.row}>
            <View style={styles.halfInput}>
              <TextInput
                style={styles.input}
                value={latitude}
                onChangeText={setLatitude}
                placeholder="Latitude"
                placeholderTextColor="#999"
                keyboardType="decimal-pad"
              />
            </View>
            <View style={styles.halfInput}>
              <TextInput
                style={styles.input}
                value={longitude}
                onChangeText={setLongitude}
                placeholder="Longitude"
                placeholderTextColor="#999"
                keyboardType="decimal-pad"
              />
            </View>
          </View>
        </View>

        {/* Land Size */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Land Size *</Text>
          
          <View style={styles.row}>
            <View style={styles.halfInput}>
              <Text style={styles.label}>Value</Text>
              <TextInput
                style={styles.input}
                value={landValue}
                onChangeText={setLandValue}
                placeholder="e.g., 5"
                placeholderTextColor="#999"
                keyboardType="decimal-pad"
              />
            </View>
            <View style={styles.halfInput}>
              <Text style={styles.label}>Unit</Text>
              <View style={styles.unitSelector}>
                <TouchableOpacity
                  style={[styles.unitButton, landUnit === 'acre' && styles.unitButtonActive]}
                  onPress={() => setLandUnit('acre')}
                >
                  <Text style={[styles.unitButtonText, landUnit === 'acre' && styles.unitButtonTextActive]}>
                    Acre
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.unitButton, landUnit === 'hectare' && styles.unitButtonActive]}
                  onPress={() => setLandUnit('hectare')}
                >
                  <Text style={[styles.unitButtonText, landUnit === 'hectare' && styles.unitButtonTextActive]}>
                    Hectare
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>

        {/* Farm Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Farm Details (Optional)</Text>
          
          <Text style={styles.label}>Soil Type</Text>
          <TextInput
            style={styles.input}
            value={soilType}
            onChangeText={setSoilType}
            placeholder="e.g., Loamy, Sandy, Clay"
            placeholderTextColor="#999"
          />

          <Text style={styles.label}>Irrigation Type</Text>
          <View style={styles.irrigationSelector}>
            {['drip', 'sprinkler', 'flood', 'rainfed', 'mixed'].map((type) => (
              <TouchableOpacity
                key={type}
                style={[
                  styles.irrigationButton,
                  irrigationType === type && styles.irrigationButtonActive,
                ]}
                onPress={() => setIrrigationType(type)}
              >
                <Text
                  style={[
                    styles.irrigationButtonText,
                    irrigationType === type && styles.irrigationButtonTextActive,
                  ]}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

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
            {loading ? 'Saving...' : mode === 'create' ? 'Create Farm Profile' : 'Update Farm Profile'}
          </Text>
        </TouchableOpacity>
      </View>
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
    paddingBottom: 80,
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
    marginTop: 8,
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
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfInput: {
    flex: 1,
  },
  unitSelector: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 6,
  },
  unitButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  unitButtonActive: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  unitButtonText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  unitButtonTextActive: {
    color: '#fff',
  },
  irrigationSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 6,
  },
  irrigationButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
  },
  irrigationButtonActive: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  irrigationButtonText: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },
  irrigationButtonTextActive: {
    color: '#fff',
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
});

export default FarmProfileFormScreen;
