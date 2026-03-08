import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { AgricultureStackNavigationProp } from '../../navigation/types';

const AgricultureHomeScreen: React.FC = () => {
  const navigation = useNavigation<AgricultureStackNavigationProp>();

  const features = [
    {
      title: 'Crop Recommendation',
      description: 'AI-powered crop suggestions based on your farm',
      onPress: () => navigation.navigate('CropRecommendation'),
    },
    {
      title: 'Soil Analysis',
      description: 'Analyze soil health and get fertilizer recommendations',
      onPress: () => navigation.navigate('SoilAnalysis'),
    },
    {
      title: 'Weather Dashboard',
      description: 'Hyper-local weather forecasts and alerts',
      onPress: () => navigation.navigate('WeatherDashboard'),
    },
    {
      title: 'Knowledge Base',
      description: 'Sustainable farming practices and techniques',
      onPress: () => navigation.navigate('KnowledgeBaseSearch'),
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
            <Text style={styles.featureTitle}>{feature.title}</Text>
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
  featureTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  featureDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
});

export default AgricultureHomeScreen;
