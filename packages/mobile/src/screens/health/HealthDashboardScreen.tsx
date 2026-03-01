/**
 * Health Dashboard Screen
 * Task 34.9: Create health dashboard with metrics
 * 
 * Features:
 * - Overview of health metrics (BMI, calorie intake, compliance)
 * - Recent assessments and remedies
 * - Meal plan progress
 * - Quick access to all health features
 * - Health tips and recommendations
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
} from 'react-native';
import { OfflineIndicator } from '../../components/OfflineIndicator';

interface HealthDashboardScreenProps {
  navigation: any;
  route: {
    params?: {
      userId: string;
    };
  };
}

interface HealthMetrics {
  bmi: number;
  bmiCategory: string;
  targetCalories: number;
  consumedCalories: number;
  compliancePercentage: number;
  weight: number;
  lastUpdated: string;
}

interface RecentActivity {
  id: string;
  type: 'assessment' | 'remedy' | 'meal';
  title: string;
  subtitle: string;
  date: string;
  icon: string;
}

export const HealthDashboardScreen: React.FC<HealthDashboardScreenProps> = ({
  navigation,
}) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [metrics, setMetrics] = useState<HealthMetrics | null>(null);
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [healthTips, setHealthTips] = useState<string[]>([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      // TODO: Call API to get dashboard data
      // Simulated data for now
      await new Promise((resolve) => setTimeout(resolve, 500));

      setMetrics({
        bmi: 23.5,
        bmiCategory: 'Normal',
        targetCalories: 2200,
        consumedCalories: 1850,
        compliancePercentage: 75,
        weight: 68,
        lastUpdated: new Date().toISOString(),
      });

      setRecentActivities([
        {
          id: '1',
          type: 'assessment',
          title: 'Symptom Assessment',
          subtitle: 'Headache - Low risk',
          date: '2 hours ago',
          icon: '🩺',
        },
        {
          id: '2',
          type: 'meal',
          title: 'Lunch Consumed',
          subtitle: 'Dal with roti - 450 kcal',
          date: '3 hours ago',
          icon: '🍛',
        },
        {
          id: '3',
          type: 'remedy',
          title: 'Viewed Remedy',
          subtitle: 'Ginger tea for cold',
          date: 'Yesterday',
          icon: '🌿',
        },
      ]);

      setHealthTips([
        'Drink at least 8 glasses of water daily',
        'Get 7-8 hours of sleep for better health',
        'Include more fruits and vegetables in your diet',
        'Take a 30-minute walk daily',
      ]);
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  const getBMIColor = (bmi: number): string => {
    if (bmi < 18.5) return '#FF9800';
    if (bmi < 25) return '#4CAF50';
    if (bmi < 30) return '#FF9800';
    return '#F44336';
  };

  const getCalorieProgress = (): number => {
    if (!metrics) return 0;
    return (metrics.consumedCalories / metrics.targetCalories) * 100;
  };

  const quickActions = [
    {
      id: 'symptom',
      title: 'Symptom Check',
      icon: '🩺',
      color: '#2196F3',
      screen: 'SymptomInput',
    },
    {
      id: 'remedy',
      title: 'Find Remedy',
      icon: '🌿',
      color: '#4CAF50',
      screen: 'RemedySearch',
    },
    {
      id: 'meal',
      title: 'Meal Plan',
      icon: '🍽️',
      color: '#FF9800',
      screen: 'NutritionTracking',
    },
    {
      id: 'firstaid',
      title: 'First Aid',
      icon: '🚑',
      color: '#F44336',
      screen: 'FirstAid',
    },
  ];

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <OfflineIndicator />

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Health Dashboard</Text>
          <Text style={styles.headerSubtitle}>
            Track your health and wellness
          </Text>
        </View>

        {/* Health Metrics */}
        {metrics && (
          <View style={styles.metricsCard}>
            <Text style={styles.cardTitle}>Your Health Metrics</Text>

            <View style={styles.metricsGrid}>
              {/* BMI */}
              <View style={styles.metricBox}>
                <Text style={styles.metricLabel}>BMI</Text>
                <Text
                  style={[
                    styles.metricValue,
                    { color: getBMIColor(metrics.bmi) },
                  ]}
                >
                  {metrics.bmi.toFixed(1)}
                </Text>
                <Text style={styles.metricCategory}>{metrics.bmiCategory}</Text>
              </View>

              {/* Weight */}
              <View style={styles.metricBox}>
                <Text style={styles.metricLabel}>Weight</Text>
                <Text style={styles.metricValue}>{metrics.weight}</Text>
                <Text style={styles.metricCategory}>kg</Text>
              </View>

              {/* Compliance */}
              <View style={styles.metricBox}>
                <Text style={styles.metricLabel}>Compliance</Text>
                <Text style={[styles.metricValue, { color: '#4CAF50' }]}>
                  {metrics.compliancePercentage}%
                </Text>
                <Text style={styles.metricCategory}>This week</Text>
              </View>
            </View>

            {/* Calorie Progress */}
            <View style={styles.calorieSection}>
              <View style={styles.calorieLabelRow}>
                <Text style={styles.calorieLabel}>Daily Calories</Text>
                <Text style={styles.calorieValue}>
                  {metrics.consumedCalories} / {metrics.targetCalories} kcal
                </Text>
              </View>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${Math.min(getCalorieProgress(), 100)}%`,
                      backgroundColor:
                        getCalorieProgress() > 110
                          ? '#F44336'
                          : getCalorieProgress() > 90
                          ? '#4CAF50'
                          : '#FF9800',
                    },
                  ]}
                />
              </View>
              <Text style={styles.progressText}>
                {getCalorieProgress().toFixed(0)}% of target
              </Text>
            </View>
          </View>
        )}

        {/* Quick Actions */}
        <View style={styles.quickActionsCard}>
          <Text style={styles.cardTitle}>Quick Actions</Text>

          <View style={styles.actionsGrid}>
            {quickActions.map((action) => (
              <TouchableOpacity
                key={action.id}
                style={[styles.actionButton, { backgroundColor: action.color }]}
                onPress={() => navigation.navigate(action.screen)}
              >
                <Text style={styles.actionIcon}>{action.icon}</Text>
                <Text style={styles.actionTitle}>{action.title}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Recent Activity */}
        <View style={styles.activityCard}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Recent Activity</Text>
            <TouchableOpacity>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>

          {recentActivities.map((activity) => (
            <TouchableOpacity key={activity.id} style={styles.activityItem}>
              <Text style={styles.activityIcon}>{activity.icon}</Text>
              <View style={styles.activityContent}>
                <Text style={styles.activityTitle}>{activity.title}</Text>
                <Text style={styles.activitySubtitle}>{activity.subtitle}</Text>
              </View>
              <Text style={styles.activityDate}>{activity.date}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Meal Plan Progress */}
        <View style={styles.mealPlanCard}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Today's Meal Plan</Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('NutritionTracking')}
            >
              <Text style={styles.viewAllText}>View Plan</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.mealProgress}>
            <View style={styles.mealItem}>
              <Text style={styles.mealIcon}>🌅</Text>
              <Text style={styles.mealName}>Breakfast</Text>
              <View style={styles.mealStatus}>
                <Text style={styles.mealStatusText}>✓</Text>
              </View>
            </View>

            <View style={styles.mealItem}>
              <Text style={styles.mealIcon}>☕</Text>
              <Text style={styles.mealName}>Mid-Morning</Text>
              <View style={[styles.mealStatus, styles.mealStatusPending]}>
                <Text style={styles.mealStatusTextPending}>○</Text>
              </View>
            </View>

            <View style={styles.mealItem}>
              <Text style={styles.mealIcon}>🍛</Text>
              <Text style={styles.mealName}>Lunch</Text>
              <View style={styles.mealStatus}>
                <Text style={styles.mealStatusText}>✓</Text>
              </View>
            </View>

            <View style={styles.mealItem}>
              <Text style={styles.mealIcon}>🍵</Text>
              <Text style={styles.mealName}>Evening</Text>
              <View style={[styles.mealStatus, styles.mealStatusPending]}>
                <Text style={styles.mealStatusTextPending}>○</Text>
              </View>
            </View>

            <View style={styles.mealItem}>
              <Text style={styles.mealIcon}>🌙</Text>
              <Text style={styles.mealName}>Dinner</Text>
              <View style={[styles.mealStatus, styles.mealStatusPending]}>
                <Text style={styles.mealStatusTextPending}>○</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Health Tips */}
        <View style={styles.tipsCard}>
          <Text style={styles.cardTitle}>💡 Health Tips</Text>

          {healthTips.map((tip, index) => (
            <View key={index} style={styles.tipItem}>
              <Text style={styles.tipBullet}>•</Text>
              <Text style={styles.tipText}>{tip}</Text>
            </View>
          ))}
        </View>

        {/* Emergency Contact */}
        <TouchableOpacity
          style={styles.emergencyButton}
          onPress={() => navigation.navigate('EmergencyContacts')}
        >
          <Text style={styles.emergencyIcon}>🚨</Text>
          <View style={styles.emergencyContent}>
            <Text style={styles.emergencyTitle}>Emergency Contacts</Text>
            <Text style={styles.emergencySubtitle}>
              Quick access to emergency services
            </Text>
          </View>
          <Text style={styles.emergencyArrow}>→</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    backgroundColor: '#4CAF50',
    padding: 20,
    paddingTop: 40,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#E8F5E9',
  },
  metricsCard: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  metricsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  metricBox: {
    flex: 1,
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#F9F9F9',
    borderRadius: 8,
    marginHorizontal: 4,
  },
  metricLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  metricValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  metricCategory: {
    fontSize: 11,
    color: '#999',
  },
  calorieSection: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  calorieLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  calorieLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  calorieValue: {
    fontSize: 14,
    color: '#666',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#F0F0F0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 6,
  },
  progressFill: {
    height: '100%',
  },
  progressText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'right',
  },
  quickActionsCard: {
    backgroundColor: '#fff',
    margin: 16,
    marginTop: 0,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionButton: {
    width: '47%',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  actionIcon: {
    fontSize: 36,
    marginBottom: 8,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  activityCard: {
    backgroundColor: '#fff',
    margin: 16,
    marginTop: 0,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  viewAllText: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '600',
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  activityIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  activitySubtitle: {
    fontSize: 12,
    color: '#666',
  },
  activityDate: {
    fontSize: 11,
    color: '#999',
  },
  mealPlanCard: {
    backgroundColor: '#fff',
    margin: 16,
    marginTop: 0,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  mealProgress: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  mealItem: {
    alignItems: 'center',
  },
  mealIcon: {
    fontSize: 24,
    marginBottom: 6,
  },
  mealName: {
    fontSize: 10,
    color: '#666',
    marginBottom: 6,
  },
  mealStatus: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mealStatusPending: {
    backgroundColor: '#E0E0E0',
  },
  mealStatusText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  mealStatusTextPending: {
    color: '#999',
    fontSize: 14,
  },
  tipsCard: {
    backgroundColor: '#FFF9E6',
    margin: 16,
    marginTop: 0,
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FFE082',
  },
  tipItem: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  tipBullet: {
    fontSize: 14,
    color: '#666',
    marginRight: 8,
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  emergencyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFEBEE',
    margin: 16,
    marginTop: 0,
    marginBottom: 32,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FFCDD2',
  },
  emergencyIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  emergencyContent: {
    flex: 1,
  },
  emergencyTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#F44336',
    marginBottom: 2,
  },
  emergencySubtitle: {
    fontSize: 12,
    color: '#666',
  },
  emergencyArrow: {
    fontSize: 24,
    color: '#F44336',
  },
});

export default HealthDashboardScreen;
