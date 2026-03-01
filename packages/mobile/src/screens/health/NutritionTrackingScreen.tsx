/**
 * Nutrition Tracking Screen
 * RuralConnect AI - Health Module
 * Task 17.11: Build nutrition tracking UI with meal plans
 * 
 * Features:
 * - Health profile setup form
 * - Daily meal plan display (5 meals)
 * - Meal consumption tracking
 * - Nutrition progress dashboard
 * - Compliance tracking visualization
 * - Nutrient gap display
 * - Dietary restriction management
 * - Offline support
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Alert
} from 'react-native';
import { NutritionApiService } from '../../services/api/nutrition-api';
import { HealthProfileForm } from '../../components/nutrition/HealthProfileForm';
import { DailyMealPlan } from '../../components/nutrition/DailyMealPlan';
import { NutritionDashboard } from '../../components/nutrition/NutritionDashboard';
import { ComplianceTracker } from '../../components/nutrition/ComplianceTracker';
import { NutrientGapDisplay } from '../../components/nutrition/NutrientGapDisplay';
import { DietaryRestrictionManager } from '../../components/nutrition/DietaryRestrictionManager';
import { OfflineIndicator } from '../../components/OfflineIndicator';

interface NutritionTrackingScreenProps {
  userId: string;
  navigation: any;
}

type TabType = 'today' | 'progress' | 'profile';

export const NutritionTrackingScreen: React.FC<NutritionTrackingScreenProps> = ({
  userId,
  navigation
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('today');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [hasProfile, setHasProfile] = useState(false);
  const [healthProfile, setHealthProfile] = useState<any>(null);
  const [dailyPlan, setDailyPlan] = useState<any>(null);
  const [progress, setProgress] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState(new Date());

  const nutritionApi = new NutritionApiService();

  useEffect(() => {
    loadData();
  }, [userId, selectedDate]);

  const loadData = async () => {
    try {
      setLoading(true);

      // Check if user has health profile
      const profile = await nutritionApi.getHealthProfile(userId);
      
      if (profile) {
        setHasProfile(true);
        setHealthProfile(profile);

        // Load daily meal plan
        await loadDailyPlan();

        // Load progress data
        await loadProgress();
      } else {
        setHasProfile(false);
      }
    } catch (error: any) {
      console.error('Error loading nutrition data:', error);
      if (error.message !== 'Health profile not found') {
        Alert.alert('Error', 'Failed to load nutrition data');
      }
    } finally {
      setLoading(false);
    }
  };

  const loadDailyPlan = async () => {
    try {
      const plan = await nutritionApi.getDailyMealPlan(
        userId,
        selectedDate.toISOString().split('T')[0]
      );
      setDailyPlan(plan);
    } catch (error) {
      console.error('Error loading daily plan:', error);
    }
  };

  const loadProgress = async () => {
    try {
      const progressData = await nutritionApi.getDailyProgress(
        userId,
        selectedDate.toISOString().split('T')[0]
      );
      setProgress(progressData);
    } catch (error) {
      console.error('Error loading progress:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleProfileCreated = async (profile: any) => {
    setHealthProfile(profile);
    setHasProfile(true);
    await loadData();
  };

  const handleMealConsumed = async (mealPlanId: string, rating: number) => {
    try {
      await nutritionApi.markMealConsumed(mealPlanId, rating);
      await loadDailyPlan();
      await loadProgress();
      Alert.alert('Success', 'Meal marked as consumed');
    } catch (error) {
      Alert.alert('Error', 'Failed to mark meal as consumed');
    }
  };

  const handleDateChange = (date: Date) => {
    setSelectedDate(date);
  };

  const renderTabBar = () => (
    <View style={styles.tabBar}>
      <TouchableOpacity
        style={[styles.tab, activeTab === 'today' && styles.activeTab]}
        onPress={() => setActiveTab('today')}
      >
        <Text style={[styles.tabText, activeTab === 'today' && styles.activeTabText]}>
          Today's Plan
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.tab, activeTab === 'progress' && styles.activeTab]}
        onPress={() => setActiveTab('progress')}
      >
        <Text style={[styles.tabText, activeTab === 'progress' && styles.activeTabText]}>
          Progress
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.tab, activeTab === 'profile' && styles.activeTab]}
        onPress={() => setActiveTab('profile')}
      >
        <Text style={[styles.tabText, activeTab === 'profile' && styles.activeTabText]}>
          Profile
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderContent = () => {
    if (!hasProfile) {
      return (
        <View style={styles.setupContainer}>
          <Text style={styles.setupTitle}>Set Up Your Health Profile</Text>
          <Text style={styles.setupDescription}>
            Create your health profile to get personalized nutrition plans based on your needs.
          </Text>
          <HealthProfileForm
            userId={userId}
            onProfileCreated={handleProfileCreated}
          />
        </View>
      );
    }

    switch (activeTab) {
      case 'today':
        return (
          <View style={styles.contentContainer}>
            {dailyPlan ? (
              <DailyMealPlan
                dailyPlan={dailyPlan}
                selectedDate={selectedDate}
                onDateChange={handleDateChange}
                onMealConsumed={handleMealConsumed}
              />
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>
                  No meal plan for this date
                </Text>
                <TouchableOpacity
                  style={styles.generateButton}
                  onPress={loadDailyPlan}
                >
                  <Text style={styles.generateButtonText}>
                    Generate Meal Plan
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        );

      case 'progress':
        return (
          <ScrollView
            style={styles.contentContainer}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
          >
            {progress && (
              <>
                <NutritionDashboard
                  userId={userId}
                  progress={progress}
                  selectedDate={selectedDate}
                />

                <ComplianceTracker
                  userId={userId}
                  compliance={progress.compliance}
                  selectedDate={selectedDate}
                />

                <NutrientGapDisplay
                  userId={userId}
                  nutrientGaps={progress.nutrientGaps}
                  recommendations={progress.recommendations}
                />
              </>
            )}
          </ScrollView>
        );

      case 'profile':
        return (
          <ScrollView
            style={styles.contentContainer}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
          >
            <View style={styles.profileSection}>
              <Text style={styles.sectionTitle}>Health Profile</Text>
              {healthProfile && (
                <View style={styles.profileInfo}>
                  <ProfileInfoRow label="Age" value={`${healthProfile.age} years`} />
                  <ProfileInfoRow label="Gender" value={healthProfile.gender} />
                  <ProfileInfoRow label="Weight" value={`${healthProfile.weightKg} kg`} />
                  <ProfileInfoRow label="Height" value={`${healthProfile.heightCm} cm`} />
                  <ProfileInfoRow label="Activity Level" value={healthProfile.activityLevel} />
                  <ProfileInfoRow label="Occupation" value={healthProfile.occupationType} />
                  <ProfileInfoRow
                    label="Target Calories"
                    value={`${healthProfile.targetCalories} kcal/day`}
                  />
                </View>
              )}

              <TouchableOpacity
                style={styles.editButton}
                onPress={() => {
                  // Navigate to edit profile
                }}
              >
                <Text style={styles.editButtonText}>Edit Profile</Text>
              </TouchableOpacity>
            </View>

            <DietaryRestrictionManager
              userId={userId}
              restrictions={healthProfile?.dietaryRestrictions || []}
              onRestrictionsUpdated={loadData}
            />
          </ScrollView>
        );

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Loading nutrition data...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <OfflineIndicator />
      
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Nutrition Tracking</Text>
        <Text style={styles.headerSubtitle}>
          Personalized meal plans for optimal health
        </Text>
      </View>

      {hasProfile && renderTabBar()}

      {renderContent()}
    </View>
  );
};

const ProfileInfoRow: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <View style={styles.profileInfoRow}>
    <Text style={styles.profileInfoLabel}>{label}:</Text>
    <Text style={styles.profileInfoValue}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5'
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5'
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666'
  },
  header: {
    backgroundColor: '#4CAF50',
    padding: 20,
    paddingTop: 40
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 4
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#E8F5E9'
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0'
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent'
  },
  activeTab: {
    borderBottomColor: '#4CAF50'
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666'
  },
  activeTabText: {
    color: '#4CAF50',
    fontWeight: 'bold'
  },
  setupContainer: {
    flex: 1,
    padding: 20
  },
  setupTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8
  },
  setupDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 24,
    lineHeight: 20
  },
  contentContainer: {
    flex: 1
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center'
  },
  generateButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8
  },
  generateButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold'
  },
  profileSection: {
    backgroundColor: '#FFF',
    margin: 16,
    padding: 16,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16
  },
  profileInfo: {
    marginBottom: 16
  },
  profileInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0'
  },
  profileInfoLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500'
  },
  profileInfoValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: 'bold'
  },
  editButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center'
  },
  editButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold'
  }
});
