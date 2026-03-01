/**
 * Budget Allocation Voting Component
 * Implements slider interface with total constraint for budget allocation polls
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Slider from '@react-native-community/slider';

interface PollOption {
  option_id: string;
  text: string;
  description?: string;
  budget_amount?: number;
}

interface BudgetAllocationVotingProps {
  options: PollOption[];
  allocations: Array<{ option_id: string; amount: number }>;
  onVoteChange: (vote: { allocations: Array<{ option_id: string; amount: number }> }) => void;
}

export const BudgetAllocationVoting: React.FC<BudgetAllocationVotingProps> = ({
  options,
  allocations,
  onVoteChange,
}) => {
  const totalBudget = options.reduce((sum, opt) => sum + (opt.budget_amount || 0), 0);
  
  const [amounts, setAmounts] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    allocations.forEach(alloc => {
      initial[alloc.option_id] = alloc.amount;
    });
    options.forEach(opt => {
      if (!(opt.option_id in initial)) {
        initial[opt.option_id] = 0;
      }
    });
    return initial;
  });

  const totalAllocated = Object.values(amounts).reduce((sum, val) => sum + val, 0);
  const remaining = totalBudget - totalAllocated;

  useEffect(() => {
    const allocations = Object.entries(amounts)
      .filter(([_, amount]) => amount > 0)
      .map(([option_id, amount]) => ({ option_id, amount }));
    onVoteChange({ allocations });
  }, [amounts]);

  const handleAmountChange = (optionId: string, value: number) => {
    const newAmounts = { ...amounts };
    const oldValue = newAmounts[optionId];
    const diff = value - oldValue;
    
    // Check if we have enough remaining budget
    if (diff > remaining) {
      // Allocate only what's remaining
      newAmounts[optionId] = oldValue + remaining;
    } else {
      newAmounts[optionId] = value;
    }
    
    setAmounts(newAmounts);
  };

  const formatCurrency = (amount: number): string => {
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  const getPercentage = (amount: number): number => {
    if (totalBudget === 0) return 0;
    return Math.round((amount / totalBudget) * 100);
  };

  return (
    <View style={styles.container}>
      {/* Budget Summary */}
      <View style={styles.summaryCard}>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Total Budget:</Text>
          <Text style={styles.summaryValue}>{formatCurrency(totalBudget)}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Allocated:</Text>
          <Text style={[styles.summaryValue, { color: '#4CAF50' }]}>
            {formatCurrency(totalAllocated)}
          </Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Remaining:</Text>
          <Text
            style={[
              styles.summaryValue,
              { color: remaining < 0 ? '#F44336' : '#FF9800' },
            ]}
          >
            {formatCurrency(remaining)}
          </Text>
        </View>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${Math.min((totalAllocated / totalBudget) * 100, 100)}%`,
                backgroundColor: remaining < 0 ? '#F44336' : '#4CAF50',
              },
            ]}
          />
        </View>
        <Text style={styles.progressText}>{getPercentage(totalAllocated)}%</Text>
      </View>

      {/* Options with Sliders */}
      <View style={styles.optionsContainer}>
        {options.map((option) => {
          const amount = amounts[option.option_id] || 0;
          const maxAmount = option.budget_amount || totalBudget;

          return (
            <View key={option.option_id} style={styles.optionCard}>
              <View style={styles.optionHeader}>
                <Text style={styles.optionText}>{option.text}</Text>
                <Text style={styles.optionAmount}>{formatCurrency(amount)}</Text>
              </View>
              
              {option.description && (
                <Text style={styles.optionDescription}>{option.description}</Text>
              )}

              <View style={styles.sliderContainer}>
                <Slider
                  style={styles.slider}
                  minimumValue={0}
                  maximumValue={maxAmount}
                  step={1000}
                  value={amount}
                  onValueChange={(value) => handleAmountChange(option.option_id, value)}
                  minimumTrackTintColor="#4CAF50"
                  maximumTrackTintColor="#E0E0E0"
                  thumbTintColor="#4CAF50"
                />
                <View style={styles.sliderLabels}>
                  <Text style={styles.sliderLabel}>₹0</Text>
                  <Text style={styles.sliderLabel}>{formatCurrency(maxAmount)}</Text>
                </View>
              </View>

              {amount > 0 && (
                <View style={styles.allocationInfo}>
                  <Text style={styles.allocationText}>
                    {getPercentage(amount)}% of total budget
                  </Text>
                </View>
              )}
            </View>
          );
        })}
      </View>

      {remaining < 0 && (
        <View style={styles.warningBox}>
          <Text style={styles.warningIcon}>⚠️</Text>
          <Text style={styles.warningText}>
            You have exceeded the total budget. Please reduce allocations.
          </Text>
        </View>
      )}

      <View style={styles.infoBox}>
        <Text style={styles.infoText}>
          Allocate the budget across options using the sliders. Total must not exceed the budget.
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
  summaryCard: {
    backgroundColor: '#F5F5F5',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    width: 50,
    textAlign: 'right',
  },
  optionsContainer: {
    gap: 16,
  },
  optionCard: {
    backgroundColor: '#F5F5F5',
    padding: 16,
    borderRadius: 12,
  },
  optionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  optionText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  optionAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  optionDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  sliderContainer: {
    marginTop: 8,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: -8,
  },
  sliderLabel: {
    fontSize: 12,
    color: '#999',
  },
  allocationInfo: {
    marginTop: 8,
    backgroundColor: '#E8F5E9',
    padding: 8,
    borderRadius: 8,
  },
  allocationText: {
    fontSize: 13,
    color: '#4CAF50',
    textAlign: 'center',
    fontWeight: '600',
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFEBEE',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  warningIcon: {
    fontSize: 20,
  },
  warningText: {
    flex: 1,
    fontSize: 14,
    color: '#F44336',
  },
  infoBox: {
    backgroundColor: '#E3F2FD',
    padding: 12,
    borderRadius: 8,
  },
  infoText: {
    fontSize: 13,
    color: '#2196F3',
    textAlign: 'center',
  },
});
