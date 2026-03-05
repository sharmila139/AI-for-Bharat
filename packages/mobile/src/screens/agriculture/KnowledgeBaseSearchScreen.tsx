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
// Temporarily commented out until contexts are properly set up
// import Icon from 'react-native-vector-icons/MaterialIcons';
// import ArticleListItem from '../../components/knowledge-base/ArticleListItem';
// import FilterModal from '../../components/knowledge-base/FilterModal';
// import { searchArticles, getTrendingArticles } from '../../services/api/knowledge-base-api';
// import { useLanguage } from '../../contexts/LanguageContext';
// import { useVoiceSearch } from '../../hooks/useVoiceSearch';

interface SearchFilters {
  category?: string;
  evidence_level?: string[];
  crops?: string[];
  regions?: string[];
  seasons?: string[];
  sort_by?: 'relevance' | 'rating' | 'date';
}

interface Article {
  id: string;
  title: string;
  summary: string;
  category: string;
}

export default function KnowledgeBaseSearchScreen() {
  const navigation = useNavigation();
  // Temporarily use hardcoded language until context is set up
  const currentLanguage = 'en';
  const t = (key: string) => key;

  const [searchQuery, setSearchQuery] = useState('');
  const [articles, setArticles] = useState<Article[]>([]);
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
  }, []);

  const loadTrendingArticles = async () => {
    try {
      setLoading(true);
      // Mock data for development
      const mockArticles: Article[] = [
        {
          id: '1',
          title: 'Organic Pest Control Methods',
          summary: 'Learn natural ways to protect your crops from pests',
          category: 'Pest Management',
        },
        {
          id: '2',
          title: 'Water Conservation Techniques',
          summary: 'Efficient irrigation methods for sustainable farming',
          category: 'Water Management',
        },
        {
          id: '3',
          title: 'Crop Rotation Benefits',
          summary: 'Improve soil health through strategic crop rotation',
          category: 'Soil Health',
        },
        {
          id: '4',
          title: 'Composting Guide',
          summary: 'Create nutrient-rich compost for your farm',
          category: 'Soil Health',
        },
        {
          id: '5',
          title: 'Integrated Pest Management',
          summary: 'Holistic approach to pest control',
          category: 'Pest Management',
        },
      ];
      setArticles(mockArticles);
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
      
      // Mock search - filter articles by query
      const filtered = articles.filter(article =>
        article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        article.summary.toLowerCase().includes(searchQuery.toLowerCase())
      );

      setArticles(filtered.length > 0 ? filtered : articles);
    } catch (error) {
      console.error('Error searching articles:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVoiceSearch = async () => {
    // Temporarily disabled until voice search is set up
    console.log('Voice search not yet implemented');
    /*
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
    */
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
    // Temporarily disabled until ArticleDetail screen is fixed
    console.log('Navigate to article:', articleId);
    // navigation.navigate('ArticleDetail', { articleId });
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={styles.title}>
        {showTrending ? 'Trending Articles' : 'Search Results'}
      </Text>
      {!showTrending && (
        <Text style={styles.resultCount}>
          {articles.length} articles found
        </Text>
      )}
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyIcon}>🔍</Text>
      <Text style={styles.emptyText}>
        {showTrending 
          ? 'No trending articles available' 
          : 'No results found'}
      </Text>
      <Text style={styles.emptySubtext}>
        Try a different search term
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search sustainable farming practices..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Text style={styles.clearIcon}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity
          style={styles.voiceButton}
          onPress={handleVoiceSearch}
        >
          <Text style={styles.voiceIcon}>🎤</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setFilterModalVisible(true)}
        >
          <Text style={styles.filterIcon}>⚙️</Text>
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
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.articleCard}
            onPress={() => handleArticlePress(item.id)}
          >
            <Text style={styles.articleCategory}>{item.category}</Text>
            <Text style={styles.articleTitle}>{item.title}</Text>
            <Text style={styles.articleSummary} numberOfLines={2}>
              {item.summary}
            </Text>
          </TouchableOpacity>
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
          <ActivityIndicator size="large" color="#4CAF50" />
        </View>
      )}
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
    fontSize: 20,
  },
  clearIcon: {
    fontSize: 18,
    color: '#666',
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
  voiceIcon: {
    fontSize: 20,
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
  filterIcon: {
    fontSize: 20,
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
  articleCard: {
    backgroundColor: '#fff',
    padding: 16,
    marginHorizontal: 12,
    marginVertical: 6,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  articleCategory: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '600',
    marginBottom: 4,
  },
  articleTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  articleSummary: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    minHeight: 300,
  },
  emptyIcon: {
    fontSize: 64,
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
