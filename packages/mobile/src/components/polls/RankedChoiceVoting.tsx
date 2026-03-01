/**
 * Ranked Choice Voting Component
 * Implements drag-to-reorder interface for ranked choice polls
 */

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface PollOption {
  option_id: string;
  text: string;
  description?: string;
}

interface RankedChoiceVotingProps {
  options: PollOption[];
  rankings: Array<{ option_id: string; rank: number }>;
  onVoteChange: (vote: { rankings: Array<{ option_id: string; rank: number }> }) => void;
}

export const RankedChoiceVoting: React.FC<RankedChoiceVotingProps> = ({
  options,
  rankings,
  onVoteChange,
}) => {
  const [rankedOptions, setRankedOptions] = useState<string[]>(
    rankings.sort((a, b) => a.rank - b.rank).map(r => r.option_id)
  );

  const unrankedOptions = options.filter(opt => !rankedOptions.includes(opt.option_id));

  const handleAddToRanking = (optionId: string) => {
    const newRanked = [...rankedOptions, optionId];
    setRankedOptions(newRanked);
    updateVote(newRanked);
  };

  const handleRemoveFromRanking = (optionId: string) => {
    const newRanked = rankedOptions.filter(id => id !== optionId);
    setRankedOptions(newRanked);
    updateVote(newRanked);
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const newRanked = [...rankedOptions];
    [newRanked[index - 1], newRanked[index]] = [newRanked[index], newRanked[index - 1]];
    setRankedOptions(newRanked);
    updateVote(newRanked);
  };

  const handleMoveDown = (index: number) => {
    if (index === rankedOptions.length - 1) return;
    const newRanked = [...rankedOptions];
    [newRanked[index], newRanked[index + 1]] = [newRanked[index + 1], newRanked[index]];
    setRankedOptions(newRanked);
    updateVote(newRanked);
  };

  const updateVote = (ranked: string[]) => {
    const rankings = ranked.map((option_id, index) => ({
      option_id,
      rank: index + 1,
    }));
    onVoteChange({ rankings });
  };

  const getOptionById = (id: string) => options.find(opt => opt.option_id === id);

  return (
    <View style={styles.container}>
      {/* Ranked Options */}
      {rankedOptions.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Ranking</Text>
          {rankedOptions.map((optionId, index) => {
            const option = getOptionById(optionId);
            if (!option) return null;

            return (
              <View key={optionId} style={styles.rankedCard}>
                <View style={styles.rankBadge}>
                  <Text style={styles.rankNumber}>{index + 1}</Text>
                </View>
                <View style={styles.optionContent}>
                  <Text style={styles.optionText}>{option.text}</Text>
                </View>
                <View style={styles.controls}>
                  <TouchableOpacity
                    style={[styles.controlButton, index === 0 && styles.controlButtonDisabled]}
                    onPress={() => handleMoveUp(index)}
                    disabled={index === 0}
                  >
                    <Text style={styles.controlIcon}>▲</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.controlButton,
                      index === rankedOptions.length - 1 && styles.controlButtonDisabled,
                    ]}
                    onPress={() => handleMoveDown(index)}
                    disabled={index === rankedOptions.length - 1}
                  >
                    <Text style={styles.controlIcon}>▼</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => handleRemoveFromRanking(optionId)}
                  >
                    <Text style={styles.removeIcon}>✕</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
        </View>
      )}

      {/* Unranked Options */}
      {unrankedOptions.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Available Options</Text>
          {unrankedOptions.map((option) => (
            <TouchableOpacity
              key={option.option_id}
              style={styles.unrankedCard}
              onPress={() => handleAddToRanking(option.option_id)}
              activeOpacity={0.7}
            >
              <Text style={styles.optionText}>{option.text}</Text>
              <Text style={styles.addIcon}>+</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <View style={styles.infoBox}>
        <Text style={styles.infoText}>
          Tap options to add them to your ranking. Use arrows to reorder.
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
  section: {
    gap: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  rankedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    padding: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
  rankBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  rankNumber: {
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
  },
  controls: {
    flexDirection: 'row',
    gap: 4,
  },
  controlButton: {
    width: 32,
    height: 32,
    backgroundColor: '#fff',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  controlButtonDisabled: {
    opacity: 0.3,
  },
  controlIcon: {
    fontSize: 12,
    color: '#4CAF50',
  },
  removeButton: {
    width: 32,
    height: 32,
    backgroundColor: '#FFEBEE',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeIcon: {
    fontSize: 16,
    color: '#F44336',
    fontWeight: 'bold',
  },
  unrankedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F5F5F5',
    padding: 16,
    borderRadius: 12,
  },
  addIcon: {
    fontSize: 24,
    color: '#4CAF50',
    fontWeight: 'bold',
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
