/**
 * Dietary Restriction Manager Component
 * Task 17.11: Dietary restriction management
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert
} from 'react-native';

interface DietaryRestrictionManagerProps {
  userId: string;
  restrictions: string[];
  onRestrictionsUpdated: () => void;
}

export const DietaryRestrictionManager: React.FC<DietaryRestrictionManagerProps> = ({
  restrictions,
  onRestrictionsUpdated
}) => {
  const [selectedRestrictions, setSelectedRestrictions] = useState<string[]>(
    restrictions || []
  );

  const availableRestrictions = [
    { value: 'vegetarian', label: 'Vegetarian', icon: '🥗' },
    { value: 'vegan', label: 'Vegan', icon: '🌱' },
    { value: 'gluten_free', label: 'Gluten Free', icon: '🌾' },
    { value: 'dairy_free', label: 'Dairy Free', icon: '🥛' },
    { value: 'nut_allergy', label: 'Nut Allergy', icon: '🥜' },
    { value: 'diabetic', label: 'Diabetic', icon: '🍬' },
    { value: 'low_sodium', label: 'Low Sodium', icon: '🧂' },
    { value: 'halal', label: 'Halal', icon: '☪️' },
    { value: 'jain', label: 'Jain', icon: '🕉️' }
  ];

  const toggleRestriction = (value: string) => {
    setSelectedRestrictions((prev) => {
      if (prev.includes(value)) {
        return prev.filter((r) => r !== value);
      } else {
        return [...prev, value];
      }
    });
  };

  const handleSave = () => {
    // In a real app, this would call an API to update restrictions
    Alert.alert('Success', 'Dietary restrictions updated');
    onRestrictionsUpdated();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Dietary Restrictions</Text>
      <Text style={styles.description}>
        Select any dietary restrictions or preferences
      </Text>

      <View style={styles.restrictionsGrid}>
        {availableRestrictions.map((restriction) => {
          const isSelected = selectedRestrictions.includes(restriction.value);

          return (
            <TouchableOpacity
              key={restriction.value}
              style={[
                styles.restrictionCard,
                isSelected && styles.restrictionCardSelected
              ]}
              onPress={() => toggleRestriction(restriction.value)}
            >
              <Text style={styles.restrictionIcon}>{restriction.icon}</Text>
              <Text
                style={[
                  styles.restrictionLabel,
                  isSelected && styles.restrictionLabelSelected
                ]}
              >
                {restriction.label}
              </Text>
              {isSelected && (
                <View style={styles.checkmark}>
                  <Text style={styles.checkmarkText}>✓</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
        <Text style={styles.saveButtonText}>Save Restrictions</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFF',
    margin: 16,
    marginTop: 0,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16
  },
  restrictionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6
  },
  restrictionCard: {
    width: '31%',
    margin: '1%',
    padding: 12,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'transparent',
    alignItems: 'center',
    position: 'relative'
  },
  restrictionCardSelected: {
    backgroundColor: '#E8F5E9',
    borderColor: '#4CAF50'
  },
  restrictionIcon: {
    fontSize: 32,
    marginBottom: 8
  },
  restrictionLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center'
  },
  restrictionLabelSelected: {
    color: '#4CAF50',
    fontWeight: 'bold'
  },
  checkmark: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center'
  },
  checkmarkText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold'
  },
  saveButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20
  },
  saveButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold'
  }
});
