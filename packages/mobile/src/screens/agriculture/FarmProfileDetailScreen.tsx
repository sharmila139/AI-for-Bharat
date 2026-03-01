/**
 * Farm Profile Detail Screen
 * Displays detailed information about a farm profile
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { AgricultureStackNavigationProp, AgricultureStackParamList } from '../../navigation/types';
import { FarmProfile } from '../../types/farm';
import farmProfileService from '../../services/farmProfileService';
import LoadingState from '../../components/LoadingState';
import ErrorState from '../../components/ErrorState';

type FarmProfileDetailRouteProp = RouteProp<AgricultureStackParamList, 'FarmProfileDetail'>;

const FarmProfileDetailScreen: React.FC = () => {
  const navigation = useNavigation<AgricultureStackNavigationProp>();
  const route = useRoute<FarmProfileDetailRouteProp>();
  const { farmId } = route.params;

  const [farm, setFarm] = useState<FarmProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadFarmProfile();
  }, [farmId]);

  const loadFarmProfile = async () => {
    try {
      setError(null);
      setLoading(true);
      const farmData = await farmProfileService.getFarmProfile(farmId);
      setFarm(farmData);
    } catch (err) {
      console.error('Error loading farm profile:', err);
      setError('Failed to load farm profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    if (farm) {
      navigation.navigate('FarmProfileForm', { mode: 'edit', farmId: farm.farmId });
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Farm Profile',
      'Are you sure you want to delete this farm profile? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await farmProfileService.deleteFarmProfile(farmId);
              navigation.goBack();
            } catch (err) {
              Alert.alert('Error', 'Failed to delete farm profile. Please try again.');
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return <LoadingState message="Loading farm details..." />;
  }

  if (error || !farm) {
    return <ErrorState message={error || 'Farm not found'} onRetry={loadFarmProfile} />;
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* Header Section */}
        <View style={styles.header}>
          <Text style={styles.farmName}>{farm.farmName}</Text>
          <View style={styles.landSizeBadge}>
            <Text style={styles.landSizeText}>
              {farm.landSize.value} {farm.landSize.unit}
            </Text>
          </View>
        </View>

        {/* Location Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📍 Location</Text>
          <View style={styles.sectionContent}>
            <Text style={styles.infoText}>{farm.location.address}</Text>
            <Text style={styles.infoText}>
              {farm.location.district}, {farm.location.state}
            </Text>
            <Text style={styles.infoText}>PIN: {farm.location.pincode}</Text>
            <Text style={styles.infoTextSmall}>
              Coordinates: {farm.location.latitude.toFixed(6)}, {farm.location.longitude.toFixed(6)}
            </Text>
          </View>
        </View>

        {/* Farm Details Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🌱 Farm Details</Text>
          <View style={styles.sectionContent}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Soil Type:</Text>
              <Text style={styles.detailValue}>{farm.soilType || 'Not specified'}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Irrigation:</Text>
              <Text style={styles.detailValue}>{farm.irrigationType || 'Not specified'}</Text>
            </View>
          </View>
        </View>

        {/* Current Crops Section */}
        {farm.currentCrops && farm.currentCrops.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🌾 Current Crops</Text>
            <View style={styles.sectionContent}>
              {farm.currentCrops.map((crop, index) => (
                <View key={index} style={styles.cropCard}>
                  <Text style={styles.cropName}>{crop.cropName}</Text>
                  <Text style={styles.cropDetail}>Area: {crop.area} {farm.landSize.unit}</Text>
                  <Text style={styles.cropDetail}>
                    Sowing: {new Date(crop.sowingDate).toLocaleDateString()}
                  </Text>
                  <Text style={styles.cropDetail}>
                    Expected Harvest: {new Date(crop.expectedHarvestDate).toLocaleDateString()}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Metadata Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ℹ️ Information</Text>
          <View style={styles.sectionContent}>
            <Text style={styles.infoTextSmall}>
              Created: {new Date(farm.createdAt).toLocaleDateString()}
            </Text>
            <Text style={styles.infoTextSmall}>
              Last Updated: {new Date(farm.updatedAt).toLocaleDateString()}
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.actionBar}>
        <TouchableOpacity
          style={[styles.actionButton, styles.editButton]}
          onPress={handleEdit}
          activeOpacity={0.8}
        >
          <Text style={styles.actionButtonText}>Edit Profile</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.deleteButton]}
          onPress={handleDelete}
          activeOpacity={0.8}
        >
          <Text style={styles.actionButtonText}>Delete</Text>
        </TouchableOpacity>
      </View>
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
    paddingBottom: 80,
  },
  header: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  farmName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginBottom: 12,
  },
  landSizeBadge: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  landSizeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2E7D32',
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  sectionContent: {
    gap: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  infoTextSmall: {
    fontSize: 12,
    color: '#999',
    lineHeight: 18,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 14,
    color: '#333',
    textTransform: 'capitalize',
  },
  cropCard: {
    backgroundColor: '#F1F8E9',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  cropName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2E7D32',
    marginBottom: 6,
  },
  cropDetail: {
    fontSize: 13,
    color: '#558B2F',
    lineHeight: 18,
  },
  actionBar: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  editButton: {
    backgroundColor: '#4CAF50',
  },
  deleteButton: {
    backgroundColor: '#f44336',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default FarmProfileDetailScreen;
