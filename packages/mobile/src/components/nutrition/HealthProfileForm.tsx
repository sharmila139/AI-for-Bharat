/**
 * Health Profile Form Component
 * Task 17.11: Health profile setup form
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert
} from 'react-native';
import { NutritionApiService } from '../../services/api/nutrition-api';

interface HealthProfileFormProps {
  userId: string;
  onProfileCreated: (profile: any) => void;
}

export const HealthProfileForm: React.FC<HealthProfileFormProps> = ({
  userId,
  onProfileCreated
}) => {
  const [formData, setFormData] = useState({
    age: '',
    gender: 'male',
    weightKg: '',
    heightCm: '',
    activityLevel: 'moderate',
    occupationType: 'moderate',
    healthConditions: [] as string[],
    dietaryRestrictions: [] as string[]
  });
  const [loading, setLoading] = useState(false);

  const nutritionApi = new NutritionApiService();

  const activityLevels = [
    { value: 'sedentary', label: 'Sedentary (Little/no exercise)' },
    { value: 'light', label: 'Light (1-3 days/week)' },
    { value: 'moderate', label: 'Moderate (3-5 days/week)' },
    { value: 'active', label: 'Active (6-7 days/week)' },
    { value: 'very_active', label: 'Very Active (Intense daily)' }
  ];

  const occupationTypes = [
    { value: 'sedentary', label: 'Sedentary (Office work)' },
    { value: 'light', label: 'Light (Teacher, Shopkeeper)' },
    { value: 'moderate', label: 'Moderate (Farmer, Mechanic)' },
    { value: 'heavy', label: 'Heavy Labor (Construction)' }
  ];

  const handleSubmit = async () => {
    // Validation
    if (!formData.age || !formData.weightKg || !formData.heightCm) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);

      // Calculate nutritional requirements
      const requirements = await nutritionApi.calculateRequirements({
        weightKg: parseFloat(formData.weightKg),
        heightCm: parseFloat(formData.heightCm),
        age: parseInt(formData.age),
        gender: formData.gender,
        activityLevel: formData.activityLevel,
        occupationType: formData.occupationType,
        healthConditions: formData.healthConditions,
        goal: 'maintenance'
      });

      // Create health profile
      const profile = await nutritionApi.createHealthProfile({
        userId,
        age: parseInt(formData.age),
        gender: formData.gender,
        weightKg: parseFloat(formData.weightKg),
        heightCm: parseFloat(formData.heightCm),
        activityLevel: formData.activityLevel,
        occupationType: formData.occupationType,
        healthConditions: formData.healthConditions,
        dietaryRestrictions: formData.dietaryRestrictions,
        targetCalories: requirements.requirements.calories.targetCalories,
        targetProteinG: requirements.requirements.macronutrients.protein.grams,
        targetCarbsG: requirements.requirements.macronutrients.carbohydrates.grams,
        targetFatG: requirements.requirements.macronutrients.fats.grams,
        targetFiberG: requirements.requirements.macronutrients.fiber.grams
      });

      Alert.alert('Success', 'Health profile created successfully');
      onProfileCreated(profile);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to create profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.label}>Age *</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter your age"
          keyboardType="numeric"
          value={formData.age}
          onChangeText={(text) => setFormData({ ...formData, age: text })}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Gender *</Text>
        <View style={styles.radioGroup}>
          <TouchableOpacity
            style={[
              styles.radioButton,
              formData.gender === 'male' && styles.radioButtonActive
            ]}
            onPress={() => setFormData({ ...formData, gender: 'male' })}
          >
            <Text
              style={[
                styles.radioText,
                formData.gender === 'male' && styles.radioTextActive
              ]}
            >
              Male
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.radioButton,
              formData.gender === 'female' && styles.radioButtonActive
            ]}
            onPress={() => setFormData({ ...formData, gender: 'female' })}
          >
            <Text
              style={[
                styles.radioText,
                formData.gender === 'female' && styles.radioTextActive
              ]}
            >
              Female
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Weight (kg) *</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter your weight"
          keyboardType="numeric"
          value={formData.weightKg}
          onChangeText={(text) => setFormData({ ...formData, weightKg: text })}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Height (cm) *</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter your height"
          keyboardType="numeric"
          value={formData.heightCm}
          onChangeText={(text) => setFormData({ ...formData, heightCm: text })}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Activity Level *</Text>
        {activityLevels.map((level) => (
          <TouchableOpacity
            key={level.value}
            style={[
              styles.optionButton,
              formData.activityLevel === level.value && styles.optionButtonActive
            ]}
            onPress={() => setFormData({ ...formData, activityLevel: level.value })}
          >
            <Text
              style={[
                styles.optionText,
                formData.activityLevel === level.value && styles.optionTextActive
              ]}
            >
              {level.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Occupation Type *</Text>
        {occupationTypes.map((occupation) => (
          <TouchableOpacity
            key={occupation.value}
            style={[
              styles.optionButton,
              formData.occupationType === occupation.value && styles.optionButtonActive
            ]}
            onPress={() => setFormData({ ...formData, occupationType: occupation.value })}
          >
            <Text
              style={[
                styles.optionText,
                formData.occupationType === occupation.value && styles.optionTextActive
              ]}
            >
              {occupation.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        style={[styles.submitButton, loading && styles.submitButtonDisabled]}
        onPress={handleSubmit}
        disabled={loading}
      >
        <Text style={styles.submitButtonText}>
          {loading ? 'Creating Profile...' : 'Create Profile'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  section: {
    marginBottom: 24
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8
  },
  input: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    padding: 12,
    fontSize: 16
  },
  radioGroup: {
    flexDirection: 'row',
    gap: 12
  },
  radioButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#FFF'
  },
  radioButtonActive: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50'
  },
  radioText: {
    fontSize: 14,
    color: '#666'
  },
  radioTextActive: {
    color: '#FFF',
    fontWeight: 'bold'
  },
  optionButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: '#FFF'
  },
  optionButtonActive: {
    backgroundColor: '#E8F5E9',
    borderColor: '#4CAF50'
  },
  optionText: {
    fontSize: 14,
    color: '#666'
  },
  optionTextActive: {
    color: '#4CAF50',
    fontWeight: '600'
  },
  submitButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 32
  },
  submitButtonDisabled: {
    backgroundColor: '#A5D6A7'
  },
  submitButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold'
  }
});
