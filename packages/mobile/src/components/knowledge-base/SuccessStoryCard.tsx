/**
 * Success Story Card Component
 * Display success stories from farmers
 * TODO: Implement full functionality as per UI spec
 */

import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { markStoryHelpful } from '../../services/api/knowledge-base-api';
import { useLanguage } from '../../contexts/LanguageContext';

interface SuccessStoryCardProps {
  story: {
    story_id: string;
    title: { [key: string]: string };
    description: { [key: string]: string };
    before_photos?: string[];
    after_photos?: string[];
    results_achieved: {
      yield_increase?: string;
      cost_reduction?: string;
      time_saved?: string;
    };
    location: string;
    crop: string;
    helpful_count: number;
    verified_by?: string;
  };
}

export default function SuccessStoryCard({ story }: SuccessStoryCardProps) {
  const { currentLanguage, t } = useLanguage();

  const title = story.title[currentLanguage] || story.title['en'];
  const description = story.description[currentLanguage] || story.description['en'];

  const handleMarkHelpful = async () => {
    try {
      await markStoryHelpful(story.story_id);
    } catch (error) {
      console.error('Error marking story helpful:', error);
    }
  };

  return (
    <View style={styles.container}>
      {story.verified_by && (
        <View style={styles.verifiedBadge}>
          <Icon name="verified" size={16} color="#4CAF50" />
          <Text style={styles.verifiedText}>{t('knowledge_base.verified_story')}</Text>
        </View>
      )}

      <Text style={styles.title}>{title}</Text>
      
      <View style={styles.metaRow}>
        <Icon name="eco" size={14} color="#666" />
        <Text style={styles.metaText}>{story.crop}</Text>
        <Icon name="location-on" size={14} color="#666" style={styles.metaIcon} />
        <Text style={styles.metaText}>{story.location}</Text>
      </View>

      {(story.before_photos || story.after_photos) && (
        <View style={styles.photosRow}>
          {story.before_photos && story.before_photos[0] && (
            <View style={styles.photoContainer}>
              <Text style={styles.photoLabel}>{t('knowledge_base.before')}</Text>
              <Image source={{ uri: story.before_photos[0] }} style={styles.photo} />
            </View>
          )}
          <Icon name="arrow-forward" size={24} color="#666" style={styles.arrow} />
          {story.after_photos && story.after_photos[0] && (
            <View style={styles.photoContainer}>
              <Text style={styles.photoLabel}>{t('knowledge_base.after')}</Text>
              <Image source={{ uri: story.after_photos[0] }} style={styles.photo} />
            </View>
          )}
        </View>
      )}

      <Text style={styles.description} numberOfLines={3}>
        {description}
      </Text>

      {story.results_achieved && (
        <View style={styles.resultsSection}>
          <Text style={styles.resultsTitle}>{t('knowledge_base.results')}:</Text>
          {story.results_achieved.yield_increase && (
            <View style={styles.resultItem}>
              <Icon name="trending-up" size={16} color="#4CAF50" />
              <Text style={styles.resultText}>
                {t('knowledge_base.yield')}: {story.results_achieved.yield_increase}
              </Text>
            </View>
          )}
          {story.results_achieved.cost_reduction && (
            <View style={styles.resultItem}>
              <Icon name="savings" size={16} color="#4CAF50" />
              <Text style={styles.resultText}>
                {t('knowledge_base.cost')}: {story.results_achieved.cost_reduction}
              </Text>
            </View>
          )}
          {story.results_achieved.time_saved && (
            <View style={styles.resultItem}>
              <Icon name="schedule" size={16} color="#4CAF50" />
              <Text style={styles.resultText}>
                {t('knowledge_base.time')}: {story.results_achieved.time_saved}
              </Text>
            </View>
          )}
        </View>
      )}

      <View style={styles.footer}>
        <View style={styles.helpfulCount}>
          <Icon name="thumb-up" size={16} color="#666" />
          <Text style={styles.helpfulText}>
            {story.helpful_count} {t('knowledge_base.found_helpful')}
          </Text>
        </View>
        <TouchableOpacity style={styles.helpfulButton} onPress={handleMarkHelpful}>
          <Text style={styles.helpfulButtonText}>{t('knowledge_base.mark_helpful')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  verifiedText: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '600',
    marginLeft: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  metaIcon: {
    marginLeft: 12,
  },
  metaText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  photosRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 12,
  },
  photoContainer: {
    alignItems: 'center',
  },
  photoLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  photo: {
    width: 120,
    height: 120,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  arrow: {
    marginHorizontal: 12,
  },
  description: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
    marginBottom: 12,
  },
  resultsSection: {
    backgroundColor: '#f8f8f8',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  resultsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  resultText: {
    fontSize: 13,
    color: '#333',
    marginLeft: 8,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  helpfulCount: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  helpfulText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  helpfulButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  helpfulButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
});
