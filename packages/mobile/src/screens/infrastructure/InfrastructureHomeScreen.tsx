import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { InfrastructureStackNavigationProp } from '../../navigation/types';

const InfrastructureHomeScreen: React.FC = () => {
  const navigation = useNavigation<InfrastructureStackNavigationProp>();

  const features = [
    {
      title: 'Report Grievance',
      description: 'Report infrastructure issues with photos',
      onPress: () => navigation.navigate('GrievanceReport'),
    },
    {
      title: 'Track Grievances',
      description: 'Monitor status of reported issues',
      onPress: () => navigation.navigate('GrievanceList'),
    },
    {
      title: 'Community Polls',
      description: 'Participate in local decision-making',
      onPress: () => navigation.navigate('CommunityPolls'),
    },
    {
      title: 'Project Progress',
      description: 'Track infrastructure project development',
      onPress: () => navigation.navigate('ProjectProgress'),
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

export default InfrastructureHomeScreen;
