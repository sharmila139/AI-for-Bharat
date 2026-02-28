/**
 * Rating Component
 * Display ratings and allow users to submit reviews
 * TODO: Implement full functionality as per UI spec
 */

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, StyleSheet, FlatList } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { rateArticle } from '../../services/api/knowledge-base-api';
import { useLanguage } from '../../contexts/LanguageContext';

interface RatingComponentProps {
  articleId: string;
  currentRating?: number;
  ratingCount: number;
  ratings: any[];
  onRatingSubmit: () => void;
}

export default function RatingComponent({
  articleId,
  currentRating = 0,
  ratingCount,
  ratings,
  onRatingSubmit,
}: RatingComponentProps) {
  const { t } = useLanguage();
  const [userRating, setUserRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (userRating === 0) return;
    
    try {
      setSubmitting(true);
      await rateArticle(articleId, userRating, reviewText);
      setUserRating(0);
      setReviewText('');
      onRatingSubmit();
    } catch (error) {
      console.error('Error submitting rating:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const renderStars = (rating: number, interactive: boolean = false) => {
    return (
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity
            key={star}
            onPress={() => interactive && setUserRating(star)}
            disabled={!interactive}
          >
            <Icon
              name={star <= rating ? 'star' : 'star-border'}
              size={interactive ? 32 : 16}
              color="#FFC107"
            />
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.averageSection}>
        {renderStars(Math.round(currentRating))}
        <Text style={styles.averageText}>
          {currentRating.toFixed(1)} ({ratingCount} {t('knowledge_base.ratings')})
        </Text>
      </View>

      <View style={styles.inputSection}>
        <Text style={styles.label}>{t('knowledge_base.rate_article')}</Text>
        {renderStars(userRating, true)}
        <TextInput
          style={styles.reviewInput}
          placeholder={t('knowledge_base.write_review')}
          value={reviewText}
          onChangeText={setReviewText}
          multiline
          numberOfLines={3}
        />
        <TouchableOpacity
          style={[styles.submitButton, userRating === 0 && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={userRating === 0 || submitting}
        >
          <Text style={styles.submitButtonText}>
            {submitting ? t('common.submitting') : t('knowledge_base.submit_rating')}
          </Text>
        </TouchableOpacity>
      </View>

      {ratings.length > 0 && (
        <View style={styles.reviewsSection}>
          <Text style={styles.sectionTitle}>{t('knowledge_base.recent_reviews')}</Text>
          <FlatList
            data={ratings}
            keyExtractor={(item) => item.rating_id}
            renderItem={({ item }) => (
              <View style={styles.reviewCard}>
                {renderStars(item.rating)}
                {item.review_text && (
                  <Text style={styles.reviewText}>{item.review_text}</Text>
                )}
                <Text style={styles.reviewDate}>
                  {new Date(item.created_at).toLocaleDateString()}
                </Text>
              </View>
            )}
            scrollEnabled={false}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
    padding: 16,
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
  },
  averageSection: {
    alignItems: 'center',
    marginBottom: 16,
  },
  starsContainer: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  averageText: {
    fontSize: 14,
    color: '#666',
  },
  inputSection: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  reviewInput: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    minHeight: 80,
    textAlignVertical: 'top',
  },
  submitButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#ccc',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  reviewsSection: {
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  reviewCard: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  reviewText: {
    fontSize: 14,
    color: '#333',
    marginTop: 8,
    lineHeight: 20,
  },
  reviewDate: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
});
