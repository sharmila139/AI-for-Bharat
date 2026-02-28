/**
 * Knowledge Base Search Screen
 * Main interface for searching and browsing sustainable farming knowledge
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import ArticleListItem from '../../components/knowledge-base/ArticleListItem';
import FilterModal from '../../components/knowledge-base/FilterModal';
import { searchArticles, getTrendingArticles } from '../../services/api/knowledge-base-api';
import { useLanguage } from '../../contexts/LanguageContext';
import { useVoiceSearch } from '../../hooks/useVoiceSearch';

interface SearchFilters {
  category?: string;
  evidence_level?: string[];
  crops?: string[];
  regions?: string[];
  seasons?: string[];
  sort_by?: 'relevance' | 'rating' | 'date';
}

export default function KnowledgeBaseSearchScreen() {
  const navigation = useNavigation();
  const { currentLanguage, t } = useLanguage();
  const { startVoiceSearch, isListening } = useVoiceSearch();

  const [searchQuery, setSearchQuery] = useState('');
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({
    sort_by: 'relevance',
  });
  const [showTrending, setShowTrending] = useState(true);

  // Load trending articles on mount
  useEffect(() => {
    loadTrendingArticles();
  }, [currentLanguage]);

  const loadTrendingArticles = async () => {
    try {
      setLoading(true);
      const trending = await getTrendingArticles(10, currentLanguage);
      setArticles(trending);
      setShowTrending(true);
    } catch (error) {
      console.error('Error loading trending articles:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim() && Object.keys(filters).length === 1) {
      loadTrendingArticles();
      return;
    }

    try {
      setLoading(true);
      setShowTrending(false);
      
      const results = await searchArticles({
        query: searchQuery.trim(),
        language: currentLanguage,
        ...filters,
        limit: 20,
      });

      setArticles(results);
    } catch (error) {
      console.error('Error searching articles:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVoiceSearch = async () => {
    try {
      const voiceQuery = await startVoiceSearch();
      if (voiceQuery) {
        setSearchQuery(voiceQuery);
        // Trigger search after voice input
        setTimeout(() => handleSearch(), 100);
      }
    } catch (error) {
      console.error('Voice search error:', error);
    }
  };

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    if (showTrending) {
      await loadTrendingArticles();
    } else {
      await handleSearch();
    }
    setRefreshing(false);
  }, [showTrending, searchQuery, filters]);

  const handleFilterApply = (newFilters: SearchFilters) => {
    setFilters(newFilters);
    setFilterModalVisible(false);
    // Trigger search with new filters
    setTimeout(() => handleSearch(), 100);
  };

  const handleArticlePress = (articleId: string) => {
    navigation.navigate('ArticleDetail', { articleId });
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={styles.title}>
        {showTrending ? t('knowledge_base.trending') : t('knowledge_base.search_results')}
      </Text>
      {!showTrending && (
        <Text style={styles.resultCount}>
          {articles.length} {t('knowledge_base.articles_found')}
        </Text>
      )}
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Icon name="search-off" size={64} color="#ccc" />
      <Text style={styles.emptyText}>
        {showTrending 
          ? t('knowledge_base.no_trending') 
          : t('knowledge_base.no_results')}
      </Text>
      <Text style={styles.emptySubtext}>
        {t('knowledge_base.try_different_search')}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Icon name="search" size={24} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder={t('knowledge_base.search_placeholder')}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Icon name="close" size={20} color="#666" />
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity
          style={[styles.voiceButton, isListening && styles.voiceButtonActive]}
          onPress={handleVoiceSearch}
          disabled={isListening}
        >
          <Icon 
            name={isListening ? "mic" : "mic-none"} 
            size={24} 
            color={isListening ? "#fff" : "#007AFF"} 
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setFilterModalVisible(true)}
        >
          <Icon name="filter-list" size={24} color="#007AFF" />
          {Object.keys(filters).length > 1 && (
            <View style={styles.filterBadge}>
              <Text style={styles.filterBadgeText}>
                {Object.keys(filters).length - 1}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Articles List */}
      <FlatList
        data={articles}
        keyExtractor={(item) => item.article_id}
        renderItem={({ item }) => (
          <ArticleListItem
            article={item}
            onPress={() => handleArticlePress(item.article_id)}
          />
        )}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={!loading && renderEmptyState()}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        contentContainerStyle={styles.listContent}
      />

      {/* Loading Indicator */}
      {loading && !refreshing && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      )}

      {/* Filter Modal */}
      <FilterModal
        visible={filterModalVisible}
        filters={filters}
        onApply={handleFilterApply}
        onClose={() => setFilterModalVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  searchContainer: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginRight: 8,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 16,
    color: '#333',
  },
  voiceButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  voiceButtonActive: {
    backgroundColor: '#007AFF',
  },
  filterButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  filterBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  filterBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  header: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  resultCount: {
    fontSize: 14,
    color: '#666',
  },
  listContent: {
    flexGrow: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    minHeight: 300,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
