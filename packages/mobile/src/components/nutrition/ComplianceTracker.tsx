/**
 * Compliance Tracker Component
 * Task 17.11: Compliance tracking visualization
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface ComplianceTrackerProps {
  userId: string;
  compliance: any;
  selectedDate: Date;
}

export const ComplianceTracker: React.FC<ComplianceTrackerProps> = ({
  compliance
}) => {
  const { plannedMeals, consumedMeals, compliancePercentage, missedMeals } = compliance;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Meal Compliance</Text>

      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{consumedMeals}</Text>
          <Text style={styles.statLabel}>Consumed</Text>
        </View>

        <View style={styles.statBox}>
          <Text style={styles.statValue}>{plannedMeals}</Text>
          <Text style={styles.statLabel}>Planned</Text>
        </View>

        <View style={styles.statBox}>
          <Text style={[styles.statValue, { color: '#4CAF50' }]}>
            {compliancePercentage}%
          </Text>
          <Text style={styles.statLabel}>Compliance</Text>
        </View>
      </View>

      <View style={styles.progressBar}>
        <View
          style={[
            styles.progressFill,
            { width: `${compliancePercentage}%` }
          ]}
        />
      </View>

      {missedMeals.length > 0 && (
        <View style={styles.missedSection}>
          <Text style={styles.missedTitle}>Missed Meals:</Text>
          <Text style={styles.missedText}>
            {missedMeals.map((m: string) => m.replace('_', ' ')).join(', ')}
          </Text>
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
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16
  },
  statBox: {
    alignItems: 'center'
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333'
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4
  },
  progressBar: {
    height: 8,
    backgroundColor: '#F0F0F0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 16
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4CAF50'
  },
  missedSection: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0'
  },
  missedTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 4
  },
  missedText: {
    fontSize: 14,
    color: '#F44336',
    textTransform: 'capitalize'
  }
});
