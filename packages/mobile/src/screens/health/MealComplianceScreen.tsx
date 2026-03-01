/**
 * Meal Compliance Screen
 * Task 34.8: Implement meal compliance tracking interface
 * 
 * Features:
 * - Mark meals as consumed/skipped
 * - Track daily compliance percentage
 * - Show weekly compliance trends
 * - Nutrient gap analysis
 * - Meal replacement suggestions
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { OfflineIndicator } from '../../components/OfflineIndicator';

interface MealComplianceScreenProps {
  navigation: any;
  route: {
    params?: {
      userId: string;
    };
  };
}

interface DayCompliance {
  date: string;
  percentage: number;
  consumedMeals: number;
  totalMeals: number;
}

interface NutrientGap {
  nutrient: string;
  target: number;
  actual: number;
  unit: string;
  percentage: number;
}

export const MealComplianceScreen: React.FC<MealComplianceScreenProps> = ({
  navigation,
  route,
}) => {
  const userId = route.params?.userId || 'user-001';

  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [dailyCompliance, setDailyCompliance] = useState<any>(null);
  const [weeklyCompliance, setWeeklyCompliance] = useState<DayCompliance[]>([]);
  const [nutrientGaps, setNutrientGaps] = useState<NutrientGap[]>([]);
  const [mealSuggestions, setMealSuggestions] = useState<any[]>([]);

  useEffect(() => {
    loadComplianceData();
  }, [selectedDate]);

  const loadComplianceData = async () => {
    setLoading(true);
    try {
      // TODO: Call API to get compliance data
      // Simulated data for now
      await new Promise((resolve) => setTimeout(resolve, 500));

      setDailyCompliance({
        date: selectedDate.toISOString().split('T')[0],
        plannedMeals: 5,
        consumedMeals: 3,
        skippedMeals: 2,
        compliancePercentage: 60,
        meals: [
          { type: 'breakfast', consumed: true, time: '08:00 AM' },
          { type: 'mid_morning', consumed: false, time: '11:00 AM' },
          { type: 'lunch', consumed: true, time: '01:00 PM' },
          { type: 'evening_snack', consumed: true, time: '04:00 PM' },
          { type: 'dinner', consumed: false, time: '08:00 PM' },
        ],
      });

      // Weekly compliance (last 7 days)
      const weekly: DayCompliance[] = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date(selectedDate);
        date.setDate(date.getDate() - i);
        weekly.push({
          date: date.toISOString().split('T')[0],
          percentage: Math.floor(Math.random() * 40) + 60, // 60-100%
          consumedMeals: Math.floor(Math.random() * 3) + 3, // 3-5
          totalMeals: 5,
        });
      }
      setWeeklyCompliance(weekly);

      // Nutrient gaps
      setNutrientGaps([
        { nutrient: 'Protein', target: 60, actual: 45, unit: 'g', percentage: 75 },
        { nutrient: 'Fiber', target: 30, actual: 18, unit: 'g', percentage: 60 },
        { nutrient: 'Calcium', target: 1000, actual: 750, unit: 'mg', percentage: 75 },
        { nutrient: 'Iron', target: 18, actual: 12, unit: 'mg', percentage: 67 },
      ]);

      // Meal replacement suggestions
      setMealSuggestions([
        {
          missedMeal: 'Mid-Morning Snack',
          suggestion: 'Banana with peanut butter',
          calories: 200,
          protein: 8,
        },
        {
          missedMeal: 'Dinner',
          suggestion: 'Dal with roti and vegetables',
          calories: 450,
          protein: 18,
        },
      ]);
    } catch (error: any) {
      Alert.alert('Error', 'Failed to load compliance data');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkMeal = async (mealType: string, consumed: boolean) => {
    try {
      // TODO: Call API to mark meal
      Alert.alert(
        'Success',
        `Meal marked as ${consumed ? 'consumed' : 'skipped'}`
      );
      loadComplianceData();
    } catch (error: any) {
      Alert.alert('Error', 'Failed to update meal status');
    }
  };

  const getMealIcon = (mealType: string): string => {
    const icons: Record<string, string> = {
      breakfast: '🌅',
      mid_morning: '☕',
      lunch: '🍛',
      evening_snack: '🍵',
      dinner: '🌙',
    };
    return icons[mealType] || '🍽️';
  };

  const getMealLabel = (mealType: string): string => {
    const labels: Record<string, string> = {
      breakfast: 'Breakfast',
      mid_morning: 'Mid-Morning',
      lunch: 'Lunch',
      evening_snack: 'Evening Snack',
      dinner: 'Dinner',
    };
    return labels[mealType] || mealType;
  };

  const getComplianceColor = (percentage: number): string => {
    if (percentage >= 80) return '#4CAF50';
    if (percentage >= 60) return '#FF9800';
    return '#F44336';
  };

  const getDayName = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { weekday: 'short' });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Loading compliance data...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <OfflineIndicator />

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Daily Compliance Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Today's Compliance</Text>

          <View style={styles.complianceCircle}>
            <Text style={styles.compliancePercentage}>
              {dailyCompliance.compliancePercentage}%
            </Text>
            <Text style={styles.complianceLabel}>
              {dailyCompliance.consumedMeals}/{dailyCompliance.plannedMeals} meals
            </Text>
          </View>

          <View style={styles.mealsGrid}>
            {dailyCompliance.meals.map((meal: any) => (
              <TouchableOpacity
                key={meal.type}
                style={[
                  styles.mealItem,
                  meal.consumed && styles.mealItemConsumed,
                ]}
                onPress={() => handleMarkMeal(meal.type, !meal.consumed)}
              >
                <Text style={styles.mealIcon}>{getMealIcon(meal.type)}</Text>
                <Text style={styles.mealName}>{getMealLabel(meal.type)}</Text>
                <Text style={styles.mealTime}>{meal.time}</Text>
                {meal.consumed && (
                  <View style={styles.checkmark}>
                    <Text style={styles.checkmarkText}>✓</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Weekly Trend */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Weekly Compliance Trend</Text>

          <View style={styles.weeklyChart}>
            {weeklyCompliance.map((day) => (
              <View key={day.date} style={styles.chartBar}>
                <View
                  style={[
                    styles.barFill,
                    {
                      height: `${day.percentage}%`,
                      backgroundColor: getComplianceColor(day.percentage),
                    },
                  ]}
                />
                <Text style={styles.barLabel}>{getDayName(day.date)}</Text>
                <Text style={styles.barValue}>{day.percentage}%</Text>
              </View>
            ))}
          </View>

          <View style={styles.weeklyStats}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Average</Text>
              <Text style={styles.statValue}>
                {Math.round(
                  weeklyCompliance.reduce((sum, d) => sum + d.percentage, 0) /
                    weeklyCompliance.length
                )}
                %
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Best Day</Text>
              <Text style={styles.statValue}>
                {Math.max(...weeklyCompliance.map((d) => d.percentage))}%
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Total Meals</Text>
              <Text style={styles.statValue}>
                {weeklyCompliance.reduce((sum, d) => sum + d.consumedMeals, 0)}
              </Text>
            </View>
          </View>
        </View>

        {/* Nutrient Gaps */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Nutrient Gap Analysis</Text>
          <Text style={styles.cardSubtitle}>
            Based on consumed meals vs. targets
          </Text>

          {nutrientGaps.map((gap) => (
            <View key={gap.nutrient} style={styles.nutrientRow}>
              <View style={styles.nutrientInfo}>
                <Text style={styles.nutrientName}>{gap.nutrient}</Text>
                <Text style={styles.nutrientValues}>
                  {gap.actual}/{gap.target} {gap.unit}
                </Text>
              </View>
              <View style={styles.nutrientProgress}>
                <View style={styles.progressBar}>
                  <View
                    style={[
                      styles.progressFill,
                      {
                        width: `${gap.percentage}%`,
                        backgroundColor:
                          gap.percentage >= 80
                            ? '#4CAF50'
                            : gap.percentage >= 60
                            ? '#FF9800'
                            : '#F44336',
                      },
                    ]}
                  />
                </View>
                <Text style={styles.progressText}>{gap.percentage}%</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Meal Replacement Suggestions */}
        {mealSuggestions.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Meal Replacement Suggestions</Text>
            <Text style={styles.cardSubtitle}>
              Quick alternatives for missed meals
            </Text>

            {mealSuggestions.map((suggestion, index) => (
              <View key={index} style={styles.suggestionCard}>
                <View style={styles.suggestionHeader}>
                  <Text style={styles.suggestionMissed}>
                    Missed: {suggestion.missedMeal}
                  </Text>
                </View>
                <Text style={styles.suggestionTitle}>
                  {suggestion.suggestion}
                </Text>
                <View style={styles.suggestionNutrition}>
                  <Text style={styles.suggestionNutrient}>
                    {suggestion.calories} kcal
                  </Text>
                  <Text style={styles.suggestionNutrient}>
                    {suggestion.protein}g protein
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.suggestionButton}
                  onPress={() => {
                    Alert.alert(
                      'Add to Plan',
                      'Would you like to add this to your meal plan?',
                      [
                        { text: 'Cancel', style: 'cancel' },
                        { text: 'Add', onPress: () => {} },
                      ]
                    );
                  }}
                >
                  <Text style={styles.suggestionButtonText}>Add to Plan</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {/* Tips */}
        <View style={styles.tipsCard}>
          <Text style={styles.tipsTitle}>💡 Tips for Better Compliance</Text>
          <Text style={styles.tipText}>
            • Set reminders for meal times
          </Text>
          <Text style={styles.tipText}>
            • Prep meals in advance on weekends
          </Text>
          <Text style={styles.tipText}>
            • Keep healthy snacks readily available
          </Text>
          <Text style={styles.tipText}>
            • Track your progress daily
          </Text>
        </View>
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
  card: {
    backgroundColor: '#fff',
    margin: 16,
    marginBottom: 0,
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
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 13,
    color: '#666',
    marginBottom: 16,
  },
  complianceCircle: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  compliancePercentage: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  complianceLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
  },
  mealsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  mealItem: {
    width: '30%',
    backgroundColor: '#F5F5F5',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  mealItemConsumed: {
    backgroundColor: '#E8F5E9',
    borderColor: '#4CAF50',
  },
  mealIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  mealName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    marginBottom: 4,
  },
  mealTime: {
    fontSize: 10,
    color: '#666',
  },
  checkmark: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#4CAF50',
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmarkText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  weeklyChart: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 150,
    marginBottom: 20,
  },
  chartBar: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 2,
  },
  barFill: {
    width: '100%',
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
    minHeight: 20,
  },
  barLabel: {
    fontSize: 10,
    color: '#666',
    marginTop: 4,
  },
  barValue: {
    fontSize: 9,
    color: '#999',
  },
  weeklyStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  nutrientRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  nutrientInfo: {
    flex: 1,
  },
  nutrientName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  nutrientValues: {
    fontSize: 12,
    color: '#666',
  },
  nutrientProgress: {
    flex: 1,
    alignItems: 'flex-end',
  },
  progressBar: {
    width: '100%',
    height: 8,
    backgroundColor: '#F0F0F0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 4,
  },
  progressFill: {
    height: '100%',
  },
  progressText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
  },
  suggestionCard: {
    backgroundColor: '#F9F9F9',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  suggestionHeader: {
    marginBottom: 8,
  },
  suggestionMissed: {
    fontSize: 12,
    color: '#F44336',
    fontWeight: '600',
  },
  suggestionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  suggestionNutrition: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
  },
  suggestionNutrient: {
    fontSize: 13,
    color: '#666',
  },
  suggestionButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 10,
    borderRadius: 6,
    alignItems: 'center',
  },
  suggestionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  tipsCard: {
    backgroundColor: '#FFF9E6',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FFE082',
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  tipText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 6,
    lineHeight: 20,
  },
});

export default MealComplianceScreen;
