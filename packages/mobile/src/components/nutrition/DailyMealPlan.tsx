/**
 * Daily Meal Plan Component
 * Task 17.11: Daily meal plan display (5 meals)
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Modal
} from 'react-native';

interface DailyMealPlanProps {
  dailyPlan: any;
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  onMealConsumed: (mealPlanId: string, rating: number) => void;
}

export const DailyMealPlan: React.FC<DailyMealPlanProps> = ({
  dailyPlan,
  selectedDate,
  onDateChange,
  onMealConsumed
}) => {
  const [selectedMeal, setSelectedMeal] = useState<any>(null);
  const [showMealDetail, setShowMealDetail] = useState(false);

  const mealTypeLabels: Record<string, string> = {
    breakfast: 'Breakfast',
    mid_morning: 'Mid-Morning Snack',
    lunch: 'Lunch',
    evening_snack: 'Evening Snack',
    dinner: 'Dinner'
  };

  const mealTypeIcons: Record<string, string> = {
    breakfast: '🌅',
    mid_morning: '☕',
    lunch: '🍛',
    evening_snack: '🍵',
    dinner: '🌙'
  };

  const handleMealPress = (meal: any) => {
    setSelectedMeal(meal);
    setShowMealDetail(true);
  };

  const handleMarkConsumed = (rating: number) => {
    if (selectedMeal) {
      onMealConsumed(selectedMeal.mealPlanId, rating);
      setShowMealDetail(false);
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-IN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const renderMealCard = (meal: any) => {
    const isConsumed = meal.consumed;

    return (
      <TouchableOpacity
        key={meal.mealPlanId}
        style={[styles.mealCard, isConsumed && styles.mealCardConsumed]}
        onPress={() => handleMealPress(meal)}
      >
        <View style={styles.mealHeader}>
          <View style={styles.mealTitleRow}>
            <Text style={styles.mealIcon}>
              {mealTypeIcons[meal.mealType]}
            </Text>
            <View style={styles.mealTitleContainer}>
              <Text style={styles.mealTitle}>
                {mealTypeLabels[meal.mealType]}
              </Text>
              <Text style={styles.mealTime}>{meal.mealTime}</Text>
            </View>
          </View>
          {isConsumed && (
            <View style={styles.consumedBadge}>
              <Text style={styles.consumedText}>✓ Done</Text>
            </View>
          )}
        </View>

        <View style={styles.mealNutrition}>
          <NutritionBadge
            label="Calories"
            value={`${meal.totalCalories}`}
            unit="kcal"
          />
          <NutritionBadge
            label="Protein"
            value={`${meal.totalProteinG}`}
            unit="g"
          />
          <NutritionBadge
            label="Carbs"
            value={`${meal.totalCarbsG}`}
            unit="g"
          />
          <NutritionBadge
            label="Fat"
            value={`${meal.totalFatG}`}
            unit="g"
          />
        </View>

        <View style={styles.mealFooter}>
          <Text style={styles.costText}>
            ₹{meal.estimatedCostInr.toFixed(2)}
          </Text>
          <Text style={styles.prepTimeText}>
            ⏱ {meal.preparationTimeMinutes} min
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.dateHeader}>
        <TouchableOpacity
          style={styles.dateButton}
          onPress={() => {
            const newDate = new Date(selectedDate);
            newDate.setDate(newDate.getDate() - 1);
            onDateChange(newDate);
          }}
        >
          <Text style={styles.dateButtonText}>←</Text>
        </TouchableOpacity>

        <Text style={styles.dateText}>{formatDate(selectedDate)}</Text>

        <TouchableOpacity
          style={styles.dateButton}
          onPress={() => {
            const newDate = new Date(selectedDate);
            newDate.setDate(newDate.getDate() + 1);
            onDateChange(newDate);
          }}
        >
          <Text style={styles.dateButtonText}>→</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.mealsContainer}>
        {dailyPlan.meals.map((meal: any) => renderMealCard(meal))}

        <View style={styles.dailySummary}>
          <Text style={styles.summaryTitle}>Daily Summary</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total Calories:</Text>
            <Text style={styles.summaryValue}>
              {dailyPlan.totalCalories} kcal
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total Cost:</Text>
            <Text style={styles.summaryValue}>
              ₹{dailyPlan.totalCostInr.toFixed(2)}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Meets Targets:</Text>
            <Text
              style={[
                styles.summaryValue,
                dailyPlan.meetsTargets ? styles.successText : styles.warningText
              ]}
            >
              {dailyPlan.meetsTargets ? 'Yes ✓' : 'Close'}
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Meal Detail Modal */}
      <Modal
        visible={showMealDetail}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowMealDetail(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedMeal && (
              <>
                <Text style={styles.modalTitle}>
                  {mealTypeLabels[selectedMeal.mealType]}
                </Text>

                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>Food Items</Text>
                  {selectedMeal.foodItems.map((item: any, index: number) => (
                    <View key={index} style={styles.foodItem}>
                      <Text style={styles.foodName}>{item.name}</Text>
                      <Text style={styles.foodQuantity}>
                        {item.quantity} {item.unit}
                      </Text>
                    </View>
                  ))}
                </View>

                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>Instructions</Text>
                  <Text style={styles.instructions}>
                    {selectedMeal.recipeInstructions}
                  </Text>
                </View>

                {!selectedMeal.consumed && (
                  <View style={styles.modalSection}>
                    <Text style={styles.modalSectionTitle}>
                      Mark as Consumed
                    </Text>
                    <Text style={styles.ratingLabel}>
                      How well did you follow this meal?
                    </Text>
                    <View style={styles.ratingButtons}>
                      {[1, 2, 3, 4, 5].map((rating) => (
                        <TouchableOpacity
                          key={rating}
                          style={styles.ratingButton}
                          onPress={() => handleMarkConsumed(rating)}
                        >
                          <Text style={styles.ratingButtonText}>
                            {'⭐'.repeat(rating)}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                )}

                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => setShowMealDetail(false)}
                >
                  <Text style={styles.closeButtonText}>Close</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const NutritionBadge: React.FC<{
  label: string;
  value: string;
  unit: string;
}> = ({ label, value, unit }) => (
  <View style={styles.nutritionBadge}>
    <Text style={styles.nutritionLabel}>{label}</Text>
    <Text style={styles.nutritionValue}>
      {value}
      <Text style={styles.nutritionUnit}>{unit}</Text>
    </Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  dateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0'
  },
  dateButton: {
    padding: 8
  },
  dateButtonText: {
    fontSize: 24,
    color: '#4CAF50'
  },
  dateText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    flex: 1
  },
  mealsContainer: {
    flex: 1,
    padding: 16
  },
  mealCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  mealCardConsumed: {
    backgroundColor: '#F1F8F4',
    borderWidth: 2,
    borderColor: '#4CAF50'
  },
  mealHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },
  mealTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1
  },
  mealIcon: {
    fontSize: 32,
    marginRight: 12
  },
  mealTitleContainer: {
    flex: 1
  },
  mealTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333'
  },
  mealTime: {
    fontSize: 14,
    color: '#666',
    marginTop: 2
  },
  consumedBadge: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12
  },
  consumedText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold'
  },
  mealNutrition: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12
  },
  nutritionBadge: {
    alignItems: 'center'
  },
  nutritionLabel: {
    fontSize: 10,
    color: '#666',
    marginBottom: 2
  },
  nutritionValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333'
  },
  nutritionUnit: {
    fontSize: 10,
    fontWeight: 'normal',
    color: '#666'
  },
  mealFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0'
  },
  costText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4CAF50'
  },
  prepTimeText: {
    fontSize: 14,
    color: '#666'
  },
  dailySummary: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666'
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333'
  },
  successText: {
    color: '#4CAF50'
  },
  warningText: {
    color: '#FF9800'
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end'
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%'
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20
  },
  modalSection: {
    marginBottom: 20
  },
  modalSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12
  },
  foodItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0'
  },
  foodName: {
    fontSize: 14,
    color: '#333'
  },
  foodQuantity: {
    fontSize: 14,
    color: '#666'
  },
  instructions: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20
  },
  ratingLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12
  },
  ratingButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  ratingButton: {
    flex: 1,
    padding: 12,
    marginHorizontal: 4,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    alignItems: 'center'
  },
  ratingButtonText: {
    fontSize: 16
  },
  closeButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center'
  },
  closeButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold'
  }
});
