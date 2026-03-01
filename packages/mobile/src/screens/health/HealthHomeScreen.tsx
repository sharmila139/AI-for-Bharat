import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { HealthStackNavigationProp } from '../../navigation/types';

const HealthHomeScreen: React.FC = () => {
  const navigation = useNavigation<HealthStackNavigationProp>();

  const features = [
    {
      title: 'Symptom Assessment',
      description: 'Get AI-powered health assessment and first aid guidance',
      icon: '🩺',
      onPress: () => navigation.navigate('SymptomInput'),
    },
    {
      title: 'First Aid Assistant',
      description: 'AI-guided emergency first aid instructions',
      icon: '🚑',
      onPress: () => navigation.navigate('FirstAid'),
    },
    {
      title: 'Emergency Contacts',
      description: 'Manage emergency contacts for quick access',
      icon: '📞',
      onPress: () => navigation.navigate('EmergencyContacts'),
    },
    {
      title: 'Natural Remedies',
      description: 'Verified traditional medicine database',
      icon: '🌿',
      onPress: () => navigation.navigate('RemedySearch'),
    },
    {
      title: 'Nutrition Tracking',
      description: 'Personalized meal plans and nutrition guidance',
      icon: '🥗',
      onPress: () => navigation.navigate('NutritionTracking'),
    },
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Primary Healthcare</Text>
        <Text style={styles.subtitle}>
          Health guidance at your fingertips
        </Text>
      </View>

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
  header: {
    padding: 20,
    backgroundColor: '#2196F3',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#ffffff',
    opacity: 0.9,
  },
  featuresContainer: {
    padding: 16,
  },
  featureCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
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
