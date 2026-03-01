/**
 * Nutrition Profile Setup Screen
 * Task 34.6: Create nutrition profile setup screens
 * 
 * Features:
 * - Collect user health profile (age, gender, height, weight, activity level)
 * - Calculate BMI and calorie requirements
 * - Collect dietary restrictions and preferences
 * - Set health goals (weight loss, muscle gain, maintenance)
 * - Occupation-based calorie adjustment
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { OfflineIndicator } from '../../components/OfflineIndicator';

interface NutritionProfileSetupScreenProps {
  navigation: any;
  route: {
    params?: {
      userId: string;
    };
  };
}

type HealthGoal = 'weight_loss' | 'muscle_gain' | 'maintenance' | 'general_health';
type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
type OccupationType = 'sedentary' | 'light' | 'moderate' | 'heavy';
type Gender = 'male' | 'female' | 'other';

interface ProfileData {
  age: string;
  gender: Gender;
  weightKg: string;
  heightCm: string;
  activityLevel: ActivityLevel;
  occupationType: OccupationType;
  healthGoal: HealthGoal;
  dietaryRestrictions: string[];
  healthConditions: string[];
}

export const NutritionProfileSetupScreen: React.FC<NutritionProfileSetupScreenProps> = ({
  navigation,
  route,
}) => {
  const userId = route.params?.userId || 'user-001'; // TODO: Get from auth context

  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [calculatedBMI, setCalculatedBMI] = useState<number | null>(null);
  const [calculatedCalories, setCalculatedCalories] = useState<number | null>(null);

  const [profileData, setProfileData] = useState<ProfileData>({
    age: '',
    gender: 'male',
    weightKg: '',
    heightCm: '',
    activityLevel: 'moderate',
    occupationType: 'moderate',
    healthGoal: 'maintenance',
    dietaryRestrictions: [],
    healthConditions: [],
  });

  const totalSteps = 4;

  // Calculate BMI
  const calculateBMI = (weightKg: number, heightCm: number): number => {
    const heightM = heightCm / 100;
    return weightKg / (heightM * heightM);
  };

  // Calculate calorie requirements
  const calculateCalories = (
    weightKg: number,
    heightCm: number,
    age: number,
    gender: Gender,
    activityLevel: ActivityLevel,
    occupationType: OccupationType,
    healthGoal: HealthGoal
  ): number => {
    // Calculate BMR using Mifflin-St Jeor Equation
    let bmr: number;
    if (gender === 'male') {
      bmr = 10 * weightKg + 6.25 * heightCm - 5 * age + 5;
    } else {
      bmr = 10 * weightKg + 6.25 * heightCm - 5 * age - 161;
    }

    // Activity multipliers
    const activityMultipliers: Record<ActivityLevel, number> = {
      sedentary: 1.2,
      light: 1.375,
      moderate: 1.55,
      active: 1.725,
      very_active: 1.9,
    };

    // Occupation adjustments (additional calories)
    const occupationAdjustments: Record<OccupationType, number> = {
      sedentary: 0,
      light: 200,
      moderate: 400,
      heavy: 600,
    };

    // Calculate TDEE (Total Daily Energy Expenditure)
    let tdee = bmr * activityMultipliers[activityLevel];
    tdee += occupationAdjustments[occupationType];

    // Adjust for health goals
    const goalAdjustments: Record<HealthGoal, number> = {
      weight_loss: -500, // 500 calorie deficit
      muscle_gain: 300, // 300 calorie surplus
      maintenance: 0,
      general_health: 0,
    };

    return Math.round(tdee + goalAdjustments[healthGoal]);
  };

  const getBMICategory = (bmi: number): { category: string; color: string } => {
    if (bmi < 18.5) return { category: 'Underweight', color: '#FF9800' };
    if (bmi < 25) return { category: 'Normal', color: '#4CAF50' };
    if (bmi < 30) return { category: 'Overweight', color: '#FF9800' };
    return { category: 'Obese', color: '#F44336' };
  };

  const handleNext = () => {
    // Validate current step
    if (currentStep === 1) {
      if (!profileData.age || !profileData.weightKg || !profileData.heightCm) {
        Alert.alert('Required Fields', 'Please fill in all required fields');
        return;
      }

      const age = parseInt(profileData.age);
      const weight = parseFloat(profileData.weightKg);
      const height = parseFloat(profileData.heightCm);

      if (age < 1 || age > 120) {
        Alert.alert('Invalid Age', 'Please enter a valid age between 1 and 120');
        return;
      }

      if (weight < 20 || weight > 300) {
        Alert.alert('Invalid Weight', 'Please enter a valid weight between 20 and 300 kg');
        return;
      }

      if (height < 50 || height > 250) {
        Alert.alert('Invalid Height', 'Please enter a valid height between 50 and 250 cm');
        return;
      }

      // Calculate BMI
      const bmi = calculateBMI(weight, height);
      setCalculatedBMI(bmi);
    }

    if (currentStep === 3) {
      // Calculate calorie requirements
      const calories = calculateCalories(
        parseFloat(profileData.weightKg),
        parseFloat(profileData.heightCm),
        parseInt(profileData.age),
        profileData.gender,
        profileData.activityLevel,
        profileData.occupationType,
        profileData.healthGoal
      );
      setCalculatedCalories(calories);
    }

    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    } else {
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);

    try {
      // TODO: Call API to create health profile
      // const response = await nutritionApi.createHealthProfile({
      //   userId,
      //   ...profileData,
      //   targetCalories: calculatedCalories,
      // });

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      Alert.alert(
        'Success',
        'Your nutrition profile has been created successfully!',
        [
          {
            text: 'OK',
            onPress: () => navigation.navigate('NutritionTracking'),
          },
        ]
      );
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to create profile');
    } finally {
      setLoading(false);
    }
  };

  const toggleDietaryRestriction = (restriction: string) => {
    setProfileData((prev) => ({
      ...prev,
      dietaryRestrictions: prev.dietaryRestrictions.includes(restriction)
        ? prev.dietaryRestrictions.filter((r) => r !== restriction)
        : [...prev.dietaryRestrictions, restriction],
    }));
  };

  const renderStep1 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Basic Information</Text>
      <Text style={styles.stepDescription}>
        Tell us about yourself to calculate your nutritional needs
      </Text>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Age *</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter your age"
          keyboardType="numeric"
          value={profileData.age}
          onChangeText={(text) => setProfileData({ ...profileData, age: text })}
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Gender *</Text>
        <View style={styles.radioGroup}>
          {(['male', 'female', 'other'] as Gender[]).map((gender) => (
            <TouchableOpacity
              key={gender}
              style={[
                styles.radioButton,
                profileData.gender === gender && styles.radioButtonActive,
              ]}
              onPress={() => setProfileData({ ...profileData, gender })}
            >
              <Text
                style={[
                  styles.radioText,
                  profileData.gender === gender && styles.radioTextActive,
                ]}
              >
                {gender.charAt(0).toUpperCase() + gender.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Weight (kg) *</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter your weight"
          keyboardType="numeric"
          value={profileData.weightKg}
          onChangeText={(text) => setProfileData({ ...profileData, weightKg: text })}
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Height (cm) *</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter your height"
          keyboardType="numeric"
          value={profileData.heightCm}
          onChangeText={(text) => setProfileData({ ...profileData, heightCm: text })}
        />
      </View>

      {calculatedBMI && (
        <View style={styles.bmiCard}>
          <Text style={styles.bmiLabel}>Your BMI</Text>
          <Text style={styles.bmiValue}>{calculatedBMI.toFixed(1)}</Text>
          <Text
            style={[
              styles.bmiCategory,
              { color: getBMICategory(calculatedBMI).color },
            ]}
          >
            {getBMICategory(calculatedBMI).category}
          </Text>
        </View>
      )}
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Activity & Occupation</Text>
      <Text style={styles.stepDescription}>
        Help us understand your daily activity level
      </Text>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Activity Level *</Text>
        {[
          { value: 'sedentary', label: 'Sedentary', desc: 'Little or no exercise' },
          { value: 'light', label: 'Light', desc: '1-3 days/week' },
          { value: 'moderate', label: 'Moderate', desc: '3-5 days/week' },
          { value: 'active', label: 'Active', desc: '6-7 days/week' },
          { value: 'very_active', label: 'Very Active', desc: 'Intense daily exercise' },
        ].map((level) => (
          <TouchableOpacity
            key={level.value}
            style={[
              styles.optionCard,
              profileData.activityLevel === level.value && styles.optionCardActive,
            ]}
            onPress={() =>
              setProfileData({ ...profileData, activityLevel: level.value as ActivityLevel })
            }
          >
            <Text
              style={[
                styles.optionTitle,
                profileData.activityLevel === level.value && styles.optionTitleActive,
              ]}
            >
              {level.label}
            </Text>
            <Text style={styles.optionDesc}>{level.desc}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Occupation Type *</Text>
        {[
          { value: 'sedentary', label: 'Sedentary', desc: 'Office work, desk job' },
          { value: 'light', label: 'Light', desc: 'Teacher, shopkeeper' },
          { value: 'moderate', label: 'Moderate', desc: 'Farmer, mechanic' },
          { value: 'heavy', label: 'Heavy Labor', desc: 'Construction, mining' },
        ].map((occupation) => (
          <TouchableOpacity
            key={occupation.value}
            style={[
              styles.optionCard,
              profileData.occupationType === occupation.value && styles.optionCardActive,
            ]}
            onPress={() =>
              setProfileData({
                ...profileData,
                occupationType: occupation.value as OccupationType,
              })
            }
          >
            <Text
              style={[
                styles.optionTitle,
                profileData.occupationType === occupation.value && styles.optionTitleActive,
              ]}
            >
              {occupation.label}
            </Text>
            <Text style={styles.optionDesc}>{occupation.desc}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderStep3 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Health Goals</Text>
      <Text style={styles.stepDescription}>
        What would you like to achieve with your nutrition plan?
      </Text>

      <View style={styles.formGroup}>
        {[
          {
            value: 'weight_loss',
            label: 'Weight Loss',
            desc: 'Lose weight gradually and safely',
            icon: '📉',
          },
          {
            value: 'muscle_gain',
            label: 'Muscle Gain',
            desc: 'Build muscle and strength',
            icon: '💪',
          },
          {
            value: 'maintenance',
            label: 'Maintenance',
            desc: 'Maintain current weight',
            icon: '⚖️',
          },
          {
            value: 'general_health',
            label: 'General Health',
            desc: 'Improve overall health',
            icon: '🌟',
          },
        ].map((goal) => (
          <TouchableOpacity
            key={goal.value}
            style={[
              styles.goalCard,
              profileData.healthGoal === goal.value && styles.goalCardActive,
            ]}
            onPress={() =>
              setProfileData({ ...profileData, healthGoal: goal.value as HealthGoal })
            }
          >
            <Text style={styles.goalIcon}>{goal.icon}</Text>
            <View style={styles.goalContent}>
              <Text
                style={[
                  styles.goalTitle,
                  profileData.healthGoal === goal.value && styles.goalTitleActive,
                ]}
              >
                {goal.label}
              </Text>
              <Text style={styles.goalDesc}>{goal.desc}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderStep4 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Dietary Preferences</Text>
      <Text style={styles.stepDescription}>
        Select any dietary restrictions or preferences
      </Text>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Dietary Restrictions (Optional)</Text>
        {[
          'Vegetarian',
          'Vegan',
          'Gluten-Free',
          'Dairy-Free',
          'Nut Allergy',
          'Diabetic',
          'Low Sodium',
          'Halal',
          'Jain',
        ].map((restriction) => (
          <TouchableOpacity
            key={restriction}
            style={[
              styles.checkboxCard,
              profileData.dietaryRestrictions.includes(restriction) &&
                styles.checkboxCardActive,
            ]}
            onPress={() => toggleDietaryRestriction(restriction)}
          >
            <View style={styles.checkbox}>
              {profileData.dietaryRestrictions.includes(restriction) && (
                <Text style={styles.checkmark}>✓</Text>
              )}
            </View>
            <Text style={styles.checkboxLabel}>{restriction}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {calculatedCalories && (
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Your Daily Calorie Target</Text>
          <Text style={styles.summaryValue}>{calculatedCalories} kcal</Text>
          <Text style={styles.summaryNote}>
            Based on your profile, activity level, and health goals
          </Text>
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <OfflineIndicator />

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              { width: `${(currentStep / totalSteps) * 100}%` },
            ]}
          />
        </View>
        <Text style={styles.progressText}>
          Step {currentStep} of {totalSteps}
        </Text>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {currentStep === 1 && renderStep1()}
        {currentStep === 2 && renderStep2()}
        {currentStep === 3 && renderStep3()}
        {currentStep === 4 && renderStep4()}
      </ScrollView>

      {/* Navigation Buttons */}
      <View style={styles.buttonContainer}>
        {currentStep > 1 && (
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.nextButton, loading && styles.nextButtonDisabled]}
          onPress={handleNext}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.nextButtonText}>
              {currentStep === totalSteps ? 'Complete Setup' : 'Next'}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  progressContainer: {
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  progressBar: {
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  stepContainer: {
    padding: 20,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  stepDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 24,
    lineHeight: 20,
  },
  formGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    padding: 14,
    fontSize: 16,
  },
  radioGroup: {
    flexDirection: 'row',
    gap: 8,
  },
  radioButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  radioButtonActive: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  radioText: {
    fontSize: 14,
    color: '#666',
  },
  radioTextActive: {
    color: '#fff',
    fontWeight: 'bold',
  },
  bmiCard: {
    backgroundColor: '#E8F5E9',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  bmiLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  bmiValue: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 4,
  },
  bmiCategory: {
    fontSize: 18,
    fontWeight: '600',
  },
  optionCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DDD',
    marginBottom: 12,
  },
  optionCardActive: {
    backgroundColor: '#E8F5E9',
    borderColor: '#4CAF50',
    borderWidth: 2,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  optionTitleActive: {
    color: '#4CAF50',
  },
  optionDesc: {
    fontSize: 13,
    color: '#666',
  },
  goalCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#DDD',
    marginBottom: 12,
  },
  goalCardActive: {
    backgroundColor: '#E8F5E9',
    borderColor: '#4CAF50',
    borderWidth: 2,
  },
  goalIcon: {
    fontSize: 32,
    marginRight: 16,
  },
  goalContent: {
    flex: 1,
  },
  goalTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  goalTitleActive: {
    color: '#4CAF50',
  },
  goalDesc: {
    fontSize: 13,
    color: '#666',
  },
  checkboxCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DDD',
    marginBottom: 8,
  },
  checkboxCardActive: {
    backgroundColor: '#E8F5E9',
    borderColor: '#4CAF50',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: '#DDD',
    borderRadius: 4,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmark: {
    fontSize: 16,
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  checkboxLabel: {
    fontSize: 15,
    color: '#333',
  },
  summaryCard: {
    backgroundColor: '#4CAF50',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  summaryTitle: {
    fontSize: 14,
    color: '#fff',
    marginBottom: 8,
  },
  summaryValue: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  summaryNote: {
    fontSize: 12,
    color: '#E8F5E9',
    textAlign: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    gap: 12,
  },
  backButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#4CAF50',
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4CAF50',
  },
  nextButton: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: 8,
    backgroundColor: '#4CAF50',
    alignItems: 'center',
  },
  nextButtonDisabled: {
    backgroundColor: '#A5D6A7',
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
});

export default NutritionProfileSetupScreen;
