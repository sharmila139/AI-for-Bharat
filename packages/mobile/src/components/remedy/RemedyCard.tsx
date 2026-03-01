/**
 * Remedy Card Component
 * Displays remedy information in search results
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { RemedySearchResult } from '../../services/api/remedy-api';

interface RemedyCardProps {
  result: RemedySearchResult;
  onPress: () => void;
}

const DIFFICULTY_COLORS = {
  easy: '#4CAF50',
  moderate: '#FF9800',
  difficult: '#F44336',
};

const EVIDENCE_ICONS = {
  traditional: '📚',
  moderate: '🔬',
  strong: '✅',
};

export const RemedyCard: React.FC<RemedyCardProps> = ({ result, onPress }) => {
  const { remedy, relevance_score, average_rating, total_ratings, seasonal_available } = result;

  const renderRating = () => {
    if (!average_rating || total_ratings === 0) {
      return <Text style={styles.noRating}>No ratings yet</Text>;
    }

    const stars = '⭐'.repeat(Math.round(average_rating));
    return (
      <View style={styles.ratingContainer}>
        <Text style={styles.stars}>{stars}</Text>
        <Text style={styles.ratingText}>
          {average_rating.toFixed(1)} ({total_ratings})
        </Text>
      </View>
    );
  };

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>{remedy.names.en}</Text>
          {remedy.names.hi && (
            <Text style={styles.subtitle}>{remedy.names.hi}</Text>
          )}
        </View>
        {seasonal_available && (
          <View style={styles.seasonalBadge}>
            <Text style={styles.seasonalText}>🌿 Seasonal</Text>
          </View>
        )}
      </View>

      {remedy.description && (
        <Text style={styles.description} numberOfLines={2}>
          {remedy.description}
        </Text>
      )}

      <View style={styles.ailmentsContainer}>
        {remedy.ailments_treated.slice(0, 3).map((ailment, index) => (
          <View key={index} style={styles.ailmentTag}>
            <Text style={styles.ailmentText}>{ailment}</Text>
          </View>
        ))}
        {remedy.ailments_treated.length > 3 && (
          <Text style={styles.moreAilments}>
            +{remedy.ailments_treated.length - 3} more
          </Text>
        )}
      </View>

      <View style={styles.footer}>
        <View style={styles.metaRow}>
          {remedy.difficulty_level && (
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Difficulty:</Text>
              <Text
                style={[
                  styles.metaValue,
                  { color: DIFFICULTY_COLORS[remedy.difficulty_level] },
                ]}
              >
                {remedy.difficulty_level}
              </Text>
            </View>
          )}

          {remedy.preparation_time_minutes && (
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>⏱️ {remedy.preparation_time_minutes} min</Text>
            </View>
          )}

          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>
              {EVIDENCE_ICONS[remedy.evidence_level]} {remedy.evidence_level}
            </Text>
          </View>
        </View>

        <View style={styles.ratingRow}>
          {renderRating()}
          {remedy.efficacy_rating && (
            <View style={styles.efficacyBadge}>
              <Text style={styles.efficacyText}>
                Efficacy: {remedy.efficacy_rating.toFixed(1)}/5
              </Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  titleContainer: {
    flex: 1,
    marginRight: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  seasonalBadge: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  seasonalText: {
    fontSize: 11,
    color: '#4CAF50',
    fontWeight: '600',
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
    lineHeight: 20,
  },
  ailmentsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  ailmentTag: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
    marginRight: 6,
    marginBottom: 6,
  },
  ailmentText: {
    fontSize: 12,
    color: '#2196F3',
    fontWeight: '500',
  },
  moreAilments: {
    fontSize: 12,
    color: '#999',
    alignSelf: 'center',
    marginLeft: 4,
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 10,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 15,
    marginBottom: 4,
  },
  metaLabel: {
    fontSize: 12,
    color: '#666',
    marginRight: 4,
  },
  metaValue: {
    fontSize: 12,
    fontWeight: '600',
  },
  ratingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stars: {
    fontSize: 14,
    marginRight: 4,
  },
  ratingText: {
    fontSize: 12,
    color: '#666',
  },
  noRating: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
  },
  efficacyBadge: {
    backgroundColor: '#FFF3E0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  efficacyText: {
    fontSize: 11,
    color: '#FF9800',
    fontWeight: '600',
  },
});

export default RemedyCard;
