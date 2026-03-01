/**
 * Multiple Choice Voting Component
 * Implements checkbox interface for multiple choice polls
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface PollOption {
  option_id: string;
  text: string;
  description?: string;
}

interface MultipleChoiceVotingProps {
  options: PollOption[];
  selectedOptions: string[];
  onVoteChange: (vote: { selected_options: string[] }) => void;
}

export const MultipleChoiceVoting: React.FC<MultipleChoiceVotingProps> = ({
  options,
  selectedOptions,
  onVoteChange,
}) => {
  const handleToggle = (optionId: string) => {
    const newSelection = selectedOptions.includes(optionId)
      ? selectedOptions.filter(id => id !== optionId)
      : [...selectedOptions, optionId];
    
    onVoteChange({ selected_options: newSelection });
  };

  return (
    <View style={styles.container}>
      {options.map((option) => {
        const isSelected = selectedOptions.includes(option.option_id);
        
        return (
          <TouchableOpacity
            key={option.option_id}
            style={[styles.optionCard, isSelected && styles.optionCardSelected]}
            onPress={() => handleToggle(option.option_id)}
            activeOpacity={0.7}
          >
            <View style={styles.checkboxContainer}>
              <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
                {isSelected && <Text style={styles.checkmark}>✓</Text>}
              </View>
            </View>
            <View style={styles.optionContent}>
              <Text style={styles.optionText}>{option.text}</Text>
              {option.description && <Text style={styles.optionDescription}>{option.description}</Text>}
            </View>
          </TouchableOpacity>
        );
      })}
      
      <View style={styles.selectionInfo}>
        <Text style={styles.selectionText}>
          {selectedOptions.length} option{selectedOptions.length !== 1 ? 's' : ''} selected
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F5F5F5',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  optionCardSelected: {
    backgroundColor: '#E8F5E9',
    borderColor: '#4CAF50',
  },
  checkboxContainer: {
    marginRight: 12,
    paddingTop: 2,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#999',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  checkmark: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  optionContent: {
    flex: 1,
  },
  optionText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  selectionInfo: {
    backgroundColor: '#E3F2FD',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  selectionText: {
    fontSize: 14,
    color: '#2196F3',
    fontWeight: '600',
  },
});
