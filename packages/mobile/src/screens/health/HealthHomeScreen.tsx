import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { HealthStackNavigationProp } from '../../navigation/types';

const HealthHomeScreen: React.FC = () => {
  const navigation = useNavigation<HealthStackNavigationProp>();
  const { t } = useTranslation();

  const features = [
    {
      title: t('health.symptom_checker'),
      description: t('health.enter_symptoms'),
      icon: '🩺',
      onPress: () => navigation.navigate('SymptomInput'),
    },
    {
      title: t('health.first_aid'),
      description: 'AI-guided emergency first aid instructions',
      icon: '🚑',
      onPress: () => navigation.navigate('FirstAid'),
    },
    {
      title: t('health.emergency'),
      description: 'Manage emergency contacts for quick access',
      icon: '📞',
      onPress: () => navigation.navigate('EmergencyContacts'),
    },
    {
      title: t('health.remedies'),
      description: t('health.recommended_remedies'),
      icon: '🌿',
      onPress: () => navigation.navigate('RemedySearch'),
    },
    {
      title: t('health.nutrition'),
      description: t('health.meal_plan'),
      icon: '🥗',
      onPress: () => navigation.navigate('NutritionTracking'),
    },
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.featuresContainer}>
        {features.map((feature, index) => (
          <TouchableOpacity
            key={index}
            style={styles.featureCard}
            onPress={feature.onPress}
          >
            <View style={styles.featureHeader}>
              <Text style={styles.featureIcon}>{feature.icon}</Text>
              <Text style={styles.featureTitle}>{feature.title}</Text>
            </View>
            <Text style={styles.featureDescription}>{feature.description}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  featuresContainer: {
    padding: 16,
    paddingTop: 20,
  },
  featureCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  featureHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  featureIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  featureDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
});

export default HealthHomeScreen;
