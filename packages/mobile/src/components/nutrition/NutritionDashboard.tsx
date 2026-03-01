/**
 * Nutrition Dashboard Component
 * Task 17.11: Nutrition progress dashboard
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface NutritionDashboardProps {
  userId: string;
  progress: any;
  selectedDate: Date;
}

export const NutritionDashboard: React.FC<NutritionDashboardProps> = ({
  progress
}) => {
  const { overallScore } = progress;

  const getScoreColor = (score: number) => {
    if (score >= 80) return '#4CAF50';
    if (score >= 60) return '#FF9800';
    return '#F44336';
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Nutrition Score</Text>
      
      <View style={styles.scoreCircle}>
        <Text style={[styles.scoreText, { color: getScoreColor(overallScore) }]}>
          {overallScore}
        </Text>
        <Text style={styles.scoreLabel}>/ 100</Text>
      </View>

      <Text style={styles.description}>
        {overallScore >= 80 && 'Excellent! Keep up the great work!'}
        {overallScore >= 60 && overallScore < 80 && 'Good progress. Room for improvement.'}
        {overallScore < 60 && 'Focus on meal compliance and nutrient balance.'}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFF',
    margin: 16,
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
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
    marginBottom: 16
  },
  scoreCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16
  },
  scoreText: {
    fontSize: 48,
    fontWeight: 'bold'
  },
  scoreLabel: {
    fontSize: 16,
    color: '#666'
  },
  description: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20
  }
});
