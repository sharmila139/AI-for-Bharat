/**
 * Nutrition Tracking Screen
 * RuralConnect AI - Health Module
 * Simplified version for development
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

interface NutritionTrackingScreenProps {
  userId?: string;
  navigation: any;
}

type TabType = 'today' | 'progress' | 'profile';

interface Meal {
  id: string;
  name: string;
  time: string;
  items: string[];
  calories: number;
  consumed: boolean;
}

export const NutritionTrackingScreen: React.FC<NutritionTrackingScreenProps> = ({
  userId = 'mock-user',
  navigation
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('today');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dailyPlan, setDailyPlan] = useState<Meal[]>([]);
  const [targetCalories] = useState(2200);
  const [consumedCalories, setConsumedCalories] = useState(0);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      const mockMeals: Meal[] = [
        {
          id: '1',
          name: 'Breakfast',
          time: '7:00 AM',
          items: ['Roti (2)', 'Dal', 'Vegetable Curry'],
          calories: 450,
          consumed: true,
        },
        {
          id: '2',
          name: 'Mid-Morning Snack',
          time: '10:00 AM',
          items: ['Banana', 'Handful of Nuts'],
          calories: 200,
          consumed: false,
        },
        {
          id: '3',
          name: 'Lunch',
          time: '1:00 PM',
          items: ['Rice', 'Dal', 'Vegetable', 'Curd'],
          calories: 600,
          consumed: true,
        },
        {
          id: '4',
          name: 'Evening Snack',
          time: '4:00 PM',
          items: ['Tea', 'Biscuits'],
          calories: 150,
          consumed: false,
        },
        {
          id: '5',
          name: 'Dinner',
          time: '8:00 PM',
          items: ['Roti (3)', 'Vegetable', 'Dal'],
          calories: 500,
          consumed: false,
        },
      ];

      setDailyPlan(mockMeals);
      
      const consumed = mockMeals
        .filter(meal => meal.consumed)
        .reduce((sum, meal) => sum + meal.calories, 0);
      setConsumedCalories(consumed);

    } catch (error) {
      console.error('Error loading nutrition data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const toggleMealConsumed = (mealId: string) => {
    setDailyPlan(prevPlan => {
      const updated = prevPlan.map(meal =>
        meal.id === mealId ? { ...meal, consumed: !meal.consumed } : meal
      );
      
      const consumed = updated
        .filter(meal => meal.consumed)
        .reduce((sum, meal) => sum + meal.calories, 0);
      setConsumedCalories(consumed);
      
      return updated;
    });
  };

  const renderTodayTab = () => (
    <View style={styles.tabContent}>
      <View style={styles.calorieCard}>
        <Text style={styles.cardTitle}>Daily Calorie Goal</Text>
        <View style={styles.calorieProgress}>
          <Text style={styles.calorieValue}>{consumedCalories}</Text>
          <Text style={styles.calorieSeparator}>/</Text>
          <Text style={styles.calorieTarget}>{targetCalories}</Text>
          <Text style={styles.calorieUnit}>kcal</Text>
        </View>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${Math.min((consumedCalories / targetCalories) * 100, 100)}%`,
                backgroundColor: consumedCalories > targetCalories ? '#F44336' : '#4CAF50',
              },
            ]}
          />
        </View>
        <Text style={styles.progressText}>
          {Math.round((consumedCalories / targetCalories) * 100)}% of daily goal
        </Text>
      </View>

      <View style={styles.mealSection}>
        <Text style={styles.sectionTitle}>Today's Meal Plan</Text>
        {dailyPlan.map(meal => (
          <TouchableOpacity
            key={meal.id}
            style={[styles.mealCard, meal.consumed && styles.mealCardConsumed]}
            onPress={() => toggleMealConsumed(meal.id)}
          >
            <View style={styles.mealHeader}>
              <View style={styles.mealInfo}>
                <Text style={[styles.mealName, meal.consumed && styles.mealNameConsumed]}>
                  {meal.name}
                </Text>
                <Text style={styles.mealTime}>{meal.time}</Text>
              </View>
              <View style={styles.mealStatus}>
                <Text style={styles.mealCalories}>{meal.calories} kcal</Text>
                <View style={[styles.checkbox, meal.consumed && styles.checkboxChecked]}>
                  {meal.consumed && <Text style={styles.checkmark}>✓</Text>}
                </View>
              </View>
            </View>
            <View style={styles.mealItems}>
              {meal.items.map((item, index) => (
                <Text key={index} style={styles.mealItem}>
                  • {item}
                </Text>
              ))}
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderProgressTab = () => (
    <View style={styles.tabContent}>
      <View style={styles.placeholderCard}>
        <Text style={styles.placeholderIcon}>📊</Text>
        <Text style={styles.placeholderTitle}>Progress Tracking</Text>
        <Text style={styles.placeholderText}>
          View your nutrition progress, compliance rates, and health trends over time.
        </Text>
        <Text style={styles.placeholderSubtext}>Coming soon...</Text>
      </View>
    </View>
  );

  const renderProfileTab = () => (
    <View style={styles.tabContent}>
      <View style={styles.placeholderCard}>
        <Text style={styles.placeholderIcon}>👤</Text>
        <Text style={styles.placeholderTitle}>Health Profile</Text>
        <Text style={styles.placeholderText}>
          Set up your health profile including age, weight, activity level, and dietary restrictions.
        </Text>
        <Text style={styles.placeholderSubtext}>Coming soon...</Text>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Loading nutrition plan...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'today' && styles.activeTab]}
          onPress={() => setActiveTab('today')}
        >
          <Text style={[styles.tabText, activeTab === 'today' && styles.activeTabText]}>
            Today
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

      <ScrollView
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      >
        {activeTab === 'today' && renderTodayTab()}
        {activeTab === 'progress' && renderProgressTab()}
        {activeTab === 'profile' && renderProfileTab()}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeTab: {
    borderBottomWidth: 3,
    borderBottomColor: '#4CAF50',
  },
  tabText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#4CAF50',
    fontWeight: '700',
  },
  scrollView: {
    flex: 1,
  },
  tabContent: {
    padding: 16,
  },
  calorieCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    marginBottom: 12,
  },
  calorieProgress: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 16,
  },
  calorieValue: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  calorieSeparator: {
    fontSize: 24,
    color: '#999',
    marginHorizontal: 8,
  },
  calorieTarget: {
    fontSize: 28,
    fontWeight: '600',
    color: '#999',
  },
  calorieUnit: {
    fontSize: 16,
    color: '#999',
    marginLeft: 8,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  mealSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  mealCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  mealCardConsumed: {
    borderColor: '#4CAF50',
    backgroundColor: '#f1f8f4',
  },
  mealHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  mealInfo: {
    flex: 1,
  },
  mealName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  mealNameConsumed: {
    color: '#4CAF50',
  },
  mealTime: {
    fontSize: 14,
    color: '#666',
  },
  mealStatus: {
    alignItems: 'flex-end',
  },
  mealCalories: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4CAF50',
    marginBottom: 8,
  },
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#ccc',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  checkboxChecked: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  checkmark: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  mealItems: {
    paddingLeft: 8,
  },
  mealItem: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
    lineHeight: 20,
  },
  placeholderCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  placeholderIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  placeholderTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
    textAlign: 'center',
  },
  placeholderText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 16,
  },
  placeholderSubtext: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
  },
});

export default NutritionTrackingScreen;
