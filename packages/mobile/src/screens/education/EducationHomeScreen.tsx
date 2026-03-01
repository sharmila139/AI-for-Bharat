import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { EducationStackNavigationProp } from '../../navigation/types';

const EducationHomeScreen: React.FC = () => {
  const navigation = useNavigation<EducationStackNavigationProp>();

  const features = [
    {
      title: 'Student Profile',
      description: 'Create your learning profile and preferences',
      onPress: () => navigation.navigate('StudentProfile'),
    },
    {
      title: 'Diagnostic Assessment',
      description: 'Assess your knowledge and get personalized recommendations',
      onPress: () => navigation.navigate('DiagnosticAssessment', { 
        studentId: 'student-001' // TODO: Get from profile
      }),
    },
    {
      title: 'Content Library',
      description: 'Curriculum-aligned educational videos and lessons',
      onPress: () => navigation.navigate('ContentLibrary'),
    },
    {
      title: 'My Progress',
      description: 'Track your learning journey and achievements',
      onPress: () => navigation.navigate('Progress'),
    },
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Education & Skills</Text>
        <Text style={styles.subtitle}>
          Adaptive learning for everyone
        </Text>
      </View>

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
  header: {
    padding: 20,
    backgroundColor: '#FF9800',
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

export default EducationHomeScreen;
