/**
 * Farm Profile List Screen
 * Displays all farm profiles for the user
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { AgricultureStackNavigationProp } from '../../navigation/types';
import { FarmProfile } from '../../types/farm';
import farmProfileService from '../../services/farmProfileService';
import LoadingState from '../../components/LoadingState';
import ErrorState from '../../components/ErrorState';

const FarmProfileListScreen: React.FC = () => {
  const navigation = useNavigation<AgricultureStackNavigationProp>();
  const [farms, setFarms] = useState<FarmProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadFarms = useCallback(async () => {
    try {
      setError(null);
      const farmList = await farmProfileService.getUserFarms();
      setFarms(farmList);
    } catch (err) {
      console.error('Error loading farms:', err);
      setError('Failed to load farm profiles. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadFarms();
  }, [loadFarms]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadFarms();
  };

  const handleCreateFarm = () => {
    navigation.navigate('FarmProfileForm', { mode: 'create' });
  };

  const handleFarmPress = (farm: FarmProfile) => {
    navigation.navigate('FarmProfileDetail', { farmId: farm.farmId });
  };

  const renderFarmCard = ({ item }: { item: FarmProfile }) => (
    <TouchableOpacity
      style={styles.farmCard}
      onPress={() => handleFarmPress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.farmCardHeader}>
        <Text style={styles.farmName}>{item.farmName}</Text>
        <View style={styles.landSizeBadge}>
          <Text style={styles.landSizeText}>
            {item.landSize.value} {item.landSize.unit}
          </Text>
        </View>
      </View>
      
      <View style={styles.farmDetails}>
        <Text style={styles.detailText}>
          📍 {item.location.district}, {item.location.state}
        </Text>
        {item.soilType && (
          <Text style={styles.detailText}>🌱 Soil: {item.soilType}</Text>
        )}
        {item.irrigationType && (
          <Text style={styles.detailText}>💧 Irrigation: {item.irrigationType}</Text>
        )}
        {item.currentCrops && item.currentCrops.length > 0 && (
          <Text style={styles.detailText}>
            🌾 {item.currentCrops.length} crop(s) growing
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>🏡</Text>
      <Text style={styles.emptyTitle}>No Farm Profiles</Text>
      <Text style={styles.emptyText}>
        Create your first farm profile to get personalized crop recommendations and insights.
      </Text>
      <TouchableOpacity style={styles.createButton} onPress={handleCreateFarm}>
        <Text style={styles.createButtonText}>Create Farm Profile</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return <LoadingState message="Loading farm profiles..." />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={loadFarms} />;
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={farms}
        renderItem={renderFarmCard}
        keyExtractor={(item) => item.farmId}
        contentContainerStyle={farms.length === 0 ? styles.emptyList : styles.list}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      />
      
      {farms.length > 0 && (
        <TouchableOpacity
          style={styles.floatingButton}
          onPress={handleCreateFarm}
          activeOpacity={0.8}
        >
          <Text style={styles.floatingButtonText}>+</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  list: {
    padding: 16,
  },
  emptyList: {
    flexGrow: 1,
  },
  farmCard: {
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
  farmCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  farmName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2E7D32',
    flex: 1,
  },
  landSizeBadge: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  landSizeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2E7D32',
  },
  farmDetails: {
    gap: 6,
  },
  detailText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  createButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  floatingButton: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  floatingButtonText: {
    color: '#fff',
    fontSize: 32,
    fontWeight: '300',
  },
});

export default FarmProfileListScreen;
