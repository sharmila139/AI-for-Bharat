/**
 * Single Choice Voting Component
 * Implements radio button interface for single choice polls
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface PollOption {
  option_id: string;
  text: string;
  description?: string;
}

interface SingleChoiceVotingProps {
  options: PollOption[];
  selectedOption?: string;
  onVoteChange: (vote: { selected_option: string }) => void;
}

export const SingleChoiceVoting: React.FC<SingleChoiceVotingProps> = ({
  options,
  selectedOption,
  onVoteChange,
}) => {
  const handleSelect = (optionId: string) => {
    onVoteChange({ selected_option: optionId });
  };

  return (
    <View style={styles.container}>
      {options.map((option, index) => (
        <TouchableOpacity
          key={option.option_id}
          style={[
            styles.optionCard,
            selectedOption === option.option_id && styles.optionCardSelected,
          ]}
          onPress={() => handleSelect(option.option_id)}
          activeOpacity={0.7}
        >
          <View style={styles.radioContainer}>
            <View style={[styles.radio, selectedOption === option.option_id && styles.radioSelected]}>
              {selectedOption === option.option_id && <View style={styles.radioDot} />}
            </View>
          </View>
          <View style={styles.optionContent}>
            <Text style={styles.optionText}>{option.text}</Text>
            {option.description && <Text style={styles.optionDescription}>{option.description}</Text>}
          </View>
        </TouchableOpacity>
      ))}
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
  radioContainer: {
    marginRight: 12,
    paddingTop: 2,
  },
  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#999',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioSelected: {
    borderColor: '#4CAF50',
  },
  radioDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#4CAF50',
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
});
