/**
 * Article List Item Component
 * Card component for displaying article preview in lists
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import EvidenceBadge from './EvidenceBadge';
import { useLanguage } from '../../contexts/LanguageContext';

interface ArticleListItemProps {
  article: {
    article_id: string;
    title: { [key: string]: string };
    summary?: { [key: string]: string };
    category: string;
    evidence_level: 'traditional' | 'moderate' | 'strong';
    average_rating?: number;
    rating_count: number;
    view_count: number;
    verified_by?: string;
    media?: {
      images?: Array<{ url: string; thumbnail_url?: string }>;
    };
    applicable_crops?: string[];
    published_at?: string;
  };
  onPress: () => void;
}

export default function ArticleListItem({ article, onPress }: ArticleListItemProps) {
  const { currentLanguage, t } = useLanguage();

  const title = article.title[currentLanguage] || article.title['en'] || '';
  const summary = article.summary?.[currentLanguage] || article.summary?.['en'] || '';
  const thumbnailUrl = article.media?.images?.[0]?.thumbnail_url || article.media?.images?.[0]?.url;

  const getCategoryLabel = (category: string) => {
    const categoryMap: { [key: string]: string } = {
      organic_farming: t('knowledge_base.category.organic_farming'),
      pest_management: t('knowledge_base.category.pest_management'),
      soil_conservation: t('knowledge_base.category.soil_conservation'),
      water_management: t('knowledge_base.category.water_management'),
      crop_rotation: t('knowledge_base.category.crop_rotation'),
      general: t('knowledge_base.category.general'),
    };
    return categoryMap[category] || category;
  };

  const formatNumber = (num: number) => {
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}k`;
    }
    return num.toString();
  };

  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.card}>
        {/* Thumbnail Image */}
        {thumbnailUrl && (
          <Image
            source={{ uri: thumbnailUrl }}
            style={styles.thumbnail}
            resizeMode="cover"
          />
        )}

        {/* Content */}
        <View style={styles.content}>
          {/* Category and Evidence Badge */}
          <View style={styles.headerRow}>
            <Text style={styles.category}>{getCategoryLabel(article.category)}</Text>
            <EvidenceBadge level={article.evidence_level} size="small" />
          </View>

          {/* Title */}
          <Text style={styles.title} numberOfLines={2}>
            {title}
          </Text>

          {/* Summary */}
          {summary && (
            <Text style={styles.summary} numberOfLines={2}>
              {summary}
            </Text>
          )}

          {/* Applicable Crops */}
          {article.applicable_crops && article.applicable_crops.length > 0 && (
            <View style={styles.cropsContainer}>
              <Icon name="eco" size={14} color="#4CAF50" />
              <Text style={styles.cropsText} numberOfLines={1}>
                {article.applicable_crops.slice(0, 3).join(', ')}
                {article.applicable_crops.length > 3 && ` +${article.applicable_crops.length - 3}`}
              </Text>
            </View>
          )}

          {/* Footer with Stats */}
          <View style={styles.footer}>
            {/* Rating */}
            <View style={styles.stat}>
              <Icon name="star" size={16} color="#FFC107" />
              <Text style={styles.statText}>
                {article.average_rating?.toFixed(1) || '0.0'} ({article.rating_count})
              </Text>
            </View>

            {/* Views */}
            <View style={styles.stat}>
              <Icon name="visibility" size={16} color="#666" />
              <Text style={styles.statText}>{formatNumber(article.view_count)}</Text>
            </View>

            {/* Verified Badge */}
            {article.verified_by && (
              <View style={styles.verifiedBadge}>
                <Icon name="verified" size={16} color="#4CAF50" />
                <Text style={styles.verifiedText}>{t('knowledge_base.verified')}</Text>
              </View>
            )}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 12,
    marginVertical: 6,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  thumbnail: {
    width: '100%',
    height: 180,
    backgroundColor: '#f0f0f0',
  },
  content: {
    padding: 12,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  category: {
    fontSize: 12,
    fontWeight: '600',
    color: '#007AFF',
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 6,
    lineHeight: 22,
  },
  summary: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 8,
  },
  cropsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  cropsText: {
    fontSize: 12,
    color: '#4CAF50',
    marginLeft: 4,
    flex: 1,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  statText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 'auto',
  },
  verifiedText: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '600',
    marginLeft: 4,
  },
});
