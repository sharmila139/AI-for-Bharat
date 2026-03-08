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
import { AgricultureStackNavigationProp } from '../../navigation/types';

const AgricultureHomeScreen: React.FC = () => {
  const navigation = useNavigation<AgricultureStackNavigationProp>();
  const { t } = useTranslation();

  const features = [
    {
      title: t('agriculture.crop_recommendation'),
      description: t('agriculture.get_recommendations'),
      onPress: () => navigation.navigate('CropRecommendation'),
    },
    {
      title: t('agriculture.soil_analysis'),
      description: t('agriculture.analyze_soil'),
      onPress: () => navigation.navigate('SoilAnalysis'),
    },
    {
      title: t('agriculture.weather'),
      description: t('agriculture.view_weather'),
      onPress: () => navigation.navigate('WeatherDashboard'),
    },
    {
      title: t('agriculture.knowledge_base'),
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
