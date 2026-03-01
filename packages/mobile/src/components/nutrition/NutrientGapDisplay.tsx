/**
 * Nutrient Gap Display Component
 * Task 17.11: Nutrient gap display
 */

import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';

interface NutrientGapDisplayProps {
  userId: string;
  nutrientGaps: any[];
  recommendations: any[];
}

export const NutrientGapDisplay: React.FC<NutrientGapDisplayProps> = ({
  nutrientGaps,
  recommendations
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'adequate':
        return '#4CAF50';
      case 'deficient':
        return '#F44336';
      case 'excess':
        return '#FF9800';
      default:
        return '#666';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'adequate':
        return '✓';
      case 'deficient':
        return '↓';
      case 'excess':
        return '↑';
      default:
        return '•';
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Nutrient Analysis</Text>

      <View style={styles.gapsContainer}>
        {nutrientGaps.map((gap, index) => (
          <View key={index} style={styles.gapRow}>
            <View style={styles.gapHeader}>
              <Text style={styles.nutrientName}>{gap.nutrient}</Text>
              <View
                style={[
                  styles.statusBadge,
                  { backgroundColor: getStatusColor(gap.status) }
                ]}
              >
                <Text style={styles.statusText}>
                  {getStatusIcon(gap.status)} {gap.status}
                </Text>
              </View>
            </View>

            <View style={styles.gapDetails}>
              <Text style={styles.gapText}>
                Target: {gap.targetAmount} {gap.unit}
              </Text>
              <Text style={styles.gapText}>
                Actual: {gap.actualAmount} {gap.unit}
              </Text>
              {gap.gapAmount !== 0 && (
                <Text
                  style={[
                    styles.gapAmount,
                    { color: gap.gapAmount > 0 ? '#F44336' : '#FF9800' }
                  ]}
                >
                  Gap: {Math.abs(gap.gapAmount)} {gap.unit} (
                  {Math.abs(gap.gapPercentage)}%)
                </Text>
              )}
            </View>
          </View>
        ))}
      </View>

      {recommendations.length > 0 && (
        <View style={styles.recommendationsSection}>
          <Text style={styles.recommendationsTitle}>Recommendations</Text>
          {recommendations.map((rec, index) => (
            <View key={index} style={styles.recommendation}>
              <Text style={styles.recommendationNutrient}>
                {rec.nutrient}:
              </Text>
              <Text style={styles.recommendationText}>{rec.reasoning}</Text>
              {rec.suggestedFoods.length > 0 && (
                <Text style={styles.suggestedFoods}>
                  Try: {rec.suggestedFoods.join(', ')}
                </Text>
              )}
            </View>
          ))}
        </View>
      )}
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
    marginBottom: 16
  },
  gapsContainer: {
    marginBottom: 16
  },
  gapRow: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0'
  },
  gapHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  nutrientName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333'
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12
  },
  statusText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'capitalize'
  },
  gapDetails: {
    marginTop: 4
  },
  gapText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2
  },
  gapAmount: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 4
  },
  recommendationsSection: {
    paddingTop: 16,
    borderTopWidth: 2,
    borderTopColor: '#F0F0F0'
  },
  recommendationsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12
  },
  recommendation: {
    backgroundColor: '#F5F5F5',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12
  },
  recommendationNutrient: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 4
  },
  recommendationText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 4
  },
  suggestedFoods: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic'
  }
});
