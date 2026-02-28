/**
 * Article Detail Screen
 * Full article view with content, media, ratings, Q&A, and success stories
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Share,
  Alert,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import EvidenceBadge from '../../components/knowledge-base/EvidenceBadge';
import MediaGallery from '../../components/knowledge-base/MediaGallery';
import RatingComponent from '../../components/knowledge-base/RatingComponent';
import QASection from '../../components/knowledge-base/QASection';
import SuccessStoryCard from '../../components/knowledge-base/SuccessStoryCard';
import ImplementationGuideViewer from '../../components/knowledge-base/ImplementationGuideViewer';
import { 
  getArticleById, 
  bookmarkArticle, 
  unbookmarkArticle,
  getArticleRatings,
  getArticleQA,
  getSuccessStories,
} from '../../services/api/knowledge-base-api';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';

export default function ArticleDetailScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { currentLanguage, t } = useLanguage();
  const { user } = useAuth();
  
  const { articleId } = route.params as { articleId: string };

  const [article, setArticle] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [activeTab, setActiveTab] = useState<'content' | 'guide' | 'qa' | 'stories'>('content');
  const [ratings, setRatings] = useState([]);
  const [qaData, setQAData] = useState([]);
  const [stories, setStories] = useState([]);

  useEffect(() => {
    loadArticle();
  }, [articleId, currentLanguage]);

  useEffect(() => {
    if (activeTab === 'qa' && qaData.length === 0) {
      loadQA();
    } else if (activeTab === 'stories' && stories.length === 0) {
      loadStories();
    }
  }, [activeTab]);

  const loadArticle = async () => {
    try {
      setLoading(true);
      const data = await getArticleById(articleId, currentLanguage);
      setArticle(data);
      
      // Load ratings
      const ratingsData = await getArticleRatings(articleId, 5);
      setRatings(ratingsData);
      
      // Check if bookmarked (from local storage or API)
      // TODO: Implement bookmark check
    } catch (error) {
      console.error('Error loading article:', error);
      Alert.alert(t('common.error'), t('knowledge_base.error_loading_article'));
    } finally {
      setLoading(false);
    }
  };

  const loadQA = async () => {
    try {
      const data = await getArticleQA(articleId, 10);
      setQAData(data);
    } catch (error) {
      console.error('Error loading Q&A:', error);
    }
  };

  const loadStories = async () => {
    try {
      const data = await getSuccessStories(articleId, 10);
      setStories(data);
    } catch (error) {
      console.error('Error loading success stories:', error);
    }
  };

  const handleBookmark = async () => {
    try {
      if (isBookmarked) {
        await unbookmarkArticle(articleId);
        setIsBookmarked(false);
      } else {
        await bookmarkArticle(articleId);
        setIsBookmarked(true);
      }
    } catch (error) {
      console.error('Error toggling bookmark:', error);
    }
  };

  const handleShare = async () => {
    try {
      const title = article.title[currentLanguage] || article.title['en'];
      await Share.share({
        message: `${title}\n\n${t('knowledge_base.share_message')}`,
        title: title,
      });
    } catch (error) {
      console.error('Error sharing article:', error);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (!article) {
    return (
      <View style={styles.errorContainer}>
        <Icon name="error-outline" size={64} color="#ccc" />
        <Text style={styles.errorText}>{t('knowledge_base.article_not_found')}</Text>
      </View>
    );
  }

  const title = article.title[currentLanguage] || article.title['en'];
  const content = article.content[currentLanguage] || article.content['en'];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={handleBookmark} style={styles.headerButton}>
            <Icon 
              name={isBookmarked ? "bookmark" : "bookmark-border"} 
              size={24} 
              color="#007AFF" 
            />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleShare} style={styles.headerButton}>
            <Icon name="share" size={24} color="#007AFF" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'content' && styles.tabActive]}
          onPress={() => setActiveTab('content')}
        >
          <Text style={[styles.tabText, activeTab === 'content' && styles.tabTextActive]}>
            {t('knowledge_base.content')}
          </Text>
        </TouchableOpacity>
        {article.implementation_guide && (
          <TouchableOpacity
            style={[styles.tab, activeTab === 'guide' && styles.tabActive]}
            onPress={() => setActiveTab('guide')}
          >
            <Text style={[styles.tabText, activeTab === 'guide' && styles.tabTextActive]}>
              {t('knowledge_base.guide')}
            </Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[styles.tab, activeTab === 'qa' && styles.tabActive]}
          onPress={() => setActiveTab('qa')}
        >
          <Text style={[styles.tabText, activeTab === 'qa' && styles.tabTextActive]}>
            {t('knowledge_base.qa')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'stories' && styles.tabActive]}
          onPress={() => setActiveTab('stories')}
        >
          <Text style={[styles.tabText, activeTab === 'stories' && styles.tabTextActive]}>
            {t('knowledge_base.stories')}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView style={styles.scrollContent}>
        {activeTab === 'content' && (
          <View style={styles.contentTab}>
            {/* Title and Meta */}
            <View style={styles.titleSection}>
              <Text style={styles.title}>{title}</Text>
              <View style={styles.metaRow}>
                <EvidenceBadge level={article.evidence_level} size="medium" />
                {article.verified_by && (
                  <View style={styles.verifiedBadge}>
                    <Icon name="verified" size={16} color="#4CAF50" />
                    <Text style={styles.verifiedText}>{t('knowledge_base.verified')}</Text>
                  </View>
                )}
              </View>
            </View>

            {/* Media Gallery */}
            {article.media && (
              <MediaGallery media={article.media} />
            )}

            {/* Content */}
            <View style={styles.contentSection}>
              <Text style={styles.contentText}>{content}</Text>
            </View>

            {/* Applicable Info */}
            {article.applicable_crops && article.applicable_crops.length > 0 && (
              <View style={styles.infoSection}>
                <Text style={styles.infoTitle}>{t('knowledge_base.applicable_crops')}</Text>
                <View style={styles.tagContainer}>
                  {article.applicable_crops.map((crop: string, index: number) => (
                    <View key={index} style={styles.tag}>
                      <Text style={styles.tagText}>{crop}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Ratings */}
            <RatingComponent
              articleId={articleId}
              currentRating={article.average_rating}
              ratingCount={article.rating_count}
              ratings={ratings}
              onRatingSubmit={loadArticle}
            />
          </View>
        )}

        {activeTab === 'guide' && article.implementation_guide && (
          <ImplementationGuideViewer guide={article.implementation_guide} />
        )}

        {activeTab === 'qa' && (
          <QASection
            articleId={articleId}
            qaData={qaData}
            onRefresh={loadQA}
          />
        )}

        {activeTab === 'stories' && (
          <View style={styles.storiesTab}>
            {stories.map((story: any) => (
              <SuccessStoryCard key={story.story_id} story={story} />
            ))}
            {stories.length === 0 && (
              <View style={styles.emptyState}>
                <Icon name="auto-stories" size={48} color="#ccc" />
                <Text style={styles.emptyText}>{t('knowledge_base.no_stories')}</Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
    textAlign: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerActions: {
    flexDirection: 'row',
  },
  headerButton: {
    marginLeft: 16,
  },
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: '#007AFF',
  },
  tabText: {
    fontSize: 14,
    color: '#666',
  },
  tabTextActive: {
    color: '#007AFF',
    fontWeight: '600',
  },
  scrollContent: {
    flex: 1,
  },
  contentTab: {
    padding: 16,
  },
  titleSection: {
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
    lineHeight: 32,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 12,
  },
  verifiedText: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '600',
    marginLeft: 4,
  },
  contentSection: {
    marginVertical: 16,
  },
  contentText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#333',
  },
  infoSection: {
    marginVertical: 16,
    padding: 16,
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  tag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#4CAF5020',
    margin: 4,
  },
  tagText: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '600',
  },
  storiesTab: {
    padding: 16,
  },
  emptyState: {
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
    textAlign: 'center',
  },
});
