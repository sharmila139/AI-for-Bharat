/**
 * Content Library Screen
 * Main interface for browsing and searching educational content
 * with comprehensive filtering and sorting options
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
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';

// Types
interface ContentItem {
  content_id: string;
  title: string;
  content_type: 'video' | 'simulation' | 'game' | 'quiz';
  difficulty_level: 'easy' | 'medium' | 'hard' | 'advanced';
  duration_minutes: number;
  thumbnail_url?: string;
  subject_name?: string;
  grade_level?: number;
  language: string;
  view_count: number;
  average_rating?: number;
  available_offline: boolean;
  offline_downloaded?: boolean;
}

interface SearchFilters {
  subject?: string;
  grade_level?: number;
  difficulty?: string;
  content_type?: string;
  language?: string;
}

type SortOption = 'popular' | 'recent' | 'recommended';

export default function ContentLibraryScreen() {
  const navigation = useNavigation();

  // Search and filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<SearchFilters>({});
  const [sortBy, setSortBy] = useState<SortOption>('popular');
  const [showFilters, setShowFilters] = useState(false);

  // Content state
  const [content, setContent] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // Load initial content
  useEffect(() => {
    loadContent();
  }, [sortBy, filters]);

  /**
   * Load content based on current filters and sort
   */
  const loadContent = async (pageNum: number = 1, append: boolean = false) => {
    if (pageNum === 1) {
      setLoading(true);
    }

    try {
      // TODO: Replace with actual API call
      const mockContent = generateMockContent(pageNum);
      
      if (append) {
        setContent(prev => [...prev, ...mockContent]);
      } else {
        setContent(mockContent);
      }
      
      setPage(pageNum);
      setHasMore(mockContent.length === 20);
    } catch (error) {
      console.error('Error loading content:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  /**
   * Handle search
   */
  const handleSearch = () => {
    loadContent(1, false);
  };

  /**
   * Handle refresh
   */
  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    loadContent(1, false);
  }, [sortBy, filters]);

  /**
   * Load more content (pagination)
   */
  const handleLoadMore = () => {
    if (!loading && hasMore) {
      loadContent(page + 1, true);
    }
  };

  /**
   * Navigate to content detail/player
   */
  const handleContentPress = (item: ContentItem) => {
    if (item.content_type === 'video') {
      navigation.navigate('VideoPlayer', { contentId: item.content_id });
    } else if (item.content_type === 'simulation' || item.content_type === 'game') {
      navigation.navigate('InteractiveContent', { contentId: item.content_id });
    } else if (item.content_type === 'quiz') {
      navigation.navigate('Quiz', { contentId: item.content_id });
    }
  };

  /**
   * Handle download for offline viewing
   */
  const handleDownload = (item: ContentItem) => {
    // TODO: Implement download functionality
    console.log('Download content:', item.content_id);
  };

  /**
   * Render content item
   */
  const renderContentItem = ({ item }: { item: ContentItem }) => (
    <TouchableOpacity
      style={styles.contentCard}
      onPress={() => handleContentPress(item)}
      activeOpacity={0.7}
    >
      {/* Thumbnail */}
      <View style={styles.thumbnailContainer}>
        {item.thumbnail_url ? (
          <Image
            source={{ uri: item.thumbnail_url }}
            style={styles.thumbnail}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.thumbnail, styles.thumbnailPlaceholder]}>
            <Icon
              name={getContentIcon(item.content_type)}
              size={40}
              color="#999"
            />
          </View>
        )}
        
        {/* Duration badge */}
        <View style={styles.durationBadge}>
          <Icon name="schedule" size={12} color="#fff" />
          <Text style={styles.durationText}>{item.duration_minutes}m</Text>
        </View>

        {/* Offline indicator */}
        {item.offline_downloaded && (
          <View style={styles.offlineBadge}>
            <Icon name="offline-pin" size={16} color="#4CAF50" />
          </View>
        )}
      </View>

      {/* Content info */}
      <View style={styles.contentInfo}>
        <Text style={styles.contentTitle} numberOfLines={2}>
          {item.title}
        </Text>
        
        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Icon name="school" size={14} color="#666" />
            <Text style={styles.metaText}>
              {item.subject_name || 'General'} • Grade {item.grade_level || 'All'}
            </Text>
          </View>
        </View>

        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Icon name="signal-cellular-alt" size={14} color="#666" />
            <Text style={styles.metaText}>{item.difficulty_level}</Text>
          </View>
          
          {item.average_rating && (
            <View style={styles.metaItem}>
              <Icon name="star" size={14} color="#FFC107" />
              <Text style={styles.metaText}>{item.average_rating.toFixed(1)}</Text>
            </View>
          )}
          
          <View style={styles.metaItem}>
            <Icon name="visibility" size={14} color="#666" />
            <Text style={styles.metaText}>{formatViewCount(item.view_count)}</Text>
          </View>
        </View>

        {/* Action buttons */}
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleContentPress(item)}
          >
            <Icon name="play-circle-outline" size={20} color="#007AFF" />
            <Text style={styles.actionText}>
              {item.content_type === 'video' ? 'Watch' : 'Start'}
            </Text>
          </TouchableOpacity>

          {item.available_offline && !item.offline_downloaded && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleDownload(item)}
            >
              <Icon name="download" size={20} color="#666" />
              <Text style={styles.actionText}>Download</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  /**
   * Render search header
   */
  const renderHeader = () => (
    <View style={styles.header}>
      {/* Search bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Icon name="search" size={24} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search educational content..."
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
          style={styles.filterButton}
          onPress={() => setShowFilters(!showFilters)}
        >
          <Icon name="filter-list" size={24} color="#007AFF" />
          {Object.keys(filters).length > 0 && (
            <View style={styles.filterBadge}>
              <Text style={styles.filterBadgeText}>
                {Object.keys(filters).length}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Filter chips */}
      {showFilters && (
        <View style={styles.filterSection}>
          <FilterChips
            filters={filters}
            onFilterChange={setFilters}
          />
        </View>
      )}

      {/* Sort options */}
      <View style={styles.sortContainer}>
        <Text style={styles.sortLabel}>Sort by:</Text>
        <TouchableOpacity
          style={[styles.sortChip, sortBy === 'popular' && styles.sortChipActive]}
          onPress={() => setSortBy('popular')}
        >
          <Text style={[styles.sortText, sortBy === 'popular' && styles.sortTextActive]}>
            Popular
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.sortChip, sortBy === 'recent' && styles.sortChipActive]}
          onPress={() => setSortBy('recent')}
        >
          <Text style={[styles.sortText, sortBy === 'recent' && styles.sortTextActive]}>
            Recent
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.sortChip, sortBy === 'recommended' && styles.sortChipActive]}
          onPress={() => setSortBy('recommended')}
        >
          <Text style={[styles.sortText, sortBy === 'recommended' && styles.sortTextActive]}>
            Recommended
          </Text>
        </TouchableOpacity>
      </View>

      {content.length > 0 && (
        <Text style={styles.resultCount}>
          {content.length} {content.length === 1 ? 'item' : 'items'}
        </Text>
      )}
    </View>
  );

  /**
   * Render empty state
   */
  const renderEmpty = () => {
    if (loading) return null;

    return (
      <View style={styles.emptyState}>
        <Icon name="video-library" size={64} color="#ccc" />
        <Text style={styles.emptyText}>No content found</Text>
        <Text style={styles.emptySubtext}>
          Try adjusting your search or filters
        </Text>
      </View>
    );
  };

  /**
   * Render footer (loading more)
   */
  const renderFooter = () => {
    if (!loading || page === 1) return null;

    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color="#007AFF" />
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={content}
        keyExtractor={(item) => item.content_id}
        renderItem={renderContentItem}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        ListFooterComponent={renderFooter}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
      />

      {loading && page === 1 && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      )}
    </View>
  );
}

/**
 * Filter Chips Component
 */
interface FilterChipsProps {
  filters: SearchFilters;
  onFilterChange: (filters: SearchFilters) => void;
}

const FilterChips: React.FC<FilterChipsProps> = ({ filters, onFilterChange }) => {
  const subjects = ['mathematics', 'science', 'language', 'social studies', 'arts', 'vocational'];
  const difficulties = ['easy', 'medium', 'hard', 'advanced'];
  const contentTypes = ['video', 'simulation', 'game', 'quiz'];
  const grades = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

  return (
    <View style={styles.filterChipsContainer}>
      {/* Subject filter */}
      <View style={styles.filterGroup}>
        <Text style={styles.filterGroupLabel}>Subject:</Text>
        <View style={styles.chipRow}>
          {subjects.map(subject => (
            <TouchableOpacity
              key={subject}
              style={[
                styles.filterChip,
                filters.subject === subject && styles.filterChipActive
              ]}
              onPress={() => onFilterChange({
                ...filters,
                subject: filters.subject === subject ? undefined : subject
              })}
            >
              <Text style={[
                styles.filterChipText,
                filters.subject === subject && styles.filterChipTextActive
              ]}>
                {subject}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Grade level filter */}
      <View style={styles.filterGroup}>
        <Text style={styles.filterGroupLabel}>Grade:</Text>
        <View style={styles.chipRow}>
          {grades.map(grade => (
            <TouchableOpacity
              key={grade}
              style={[
                styles.filterChip,
                filters.grade_level === grade && styles.filterChipActive
              ]}
              onPress={() => onFilterChange({
                ...filters,
                grade_level: filters.grade_level === grade ? undefined : grade
              })}
            >
              <Text style={[
                styles.filterChipText,
                filters.grade_level === grade && styles.filterChipTextActive
              ]}>
                {grade}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Difficulty filter */}
      <View style={styles.filterGroup}>
        <Text style={styles.filterGroupLabel}>Difficulty:</Text>
        <View style={styles.chipRow}>
          {difficulties.map(difficulty => (
            <TouchableOpacity
              key={difficulty}
              style={[
                styles.filterChip,
                filters.difficulty === difficulty && styles.filterChipActive
              ]}
              onPress={() => onFilterChange({
                ...filters,
                difficulty: filters.difficulty === difficulty ? undefined : difficulty
              })}
            >
              <Text style={[
                styles.filterChipText,
                filters.difficulty === difficulty && styles.filterChipTextActive
              ]}>
                {difficulty}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Content type filter */}
      <View style={styles.filterGroup}>
        <Text style={styles.filterGroupLabel}>Type:</Text>
        <View style={styles.chipRow}>
          {contentTypes.map(type => (
            <TouchableOpacity
              key={type}
              style={[
                styles.filterChip,
                filters.content_type === type && styles.filterChipActive
              ]}
              onPress={() => onFilterChange({
                ...filters,
                content_type: filters.content_type === type ? undefined : type
              })}
            >
              <Text style={[
                styles.filterChipText,
                filters.content_type === type && styles.filterChipTextActive
              ]}>
                {type}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Clear filters */}
      {Object.keys(filters).length > 0 && (
        <TouchableOpacity
          style={styles.clearFiltersButton}
          onPress={() => onFilterChange({})}
        >
          <Text style={styles.clearFiltersText}>Clear all filters</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

// Helper functions
const getContentIcon = (type: string): string => {
  switch (type) {
    case 'video': return 'play-circle-outline';
    case 'simulation': return 'science';
    case 'game': return 'sports-esports';
    case 'quiz': return 'quiz';
    default: return 'library-books';
  }
};

const formatViewCount = (count: number): string => {
  if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
  if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
  return count.toString();
};

// Mock data generator (replace with actual API)
const generateMockContent = (page: number): ContentItem[] => {
  const subjects = ['Mathematics', 'Science', 'Language', 'Social Studies'];
  const types: Array<'video' | 'simulation' | 'game' | 'quiz'> = ['video', 'simulation', 'game', 'quiz'];
  const difficulties: Array<'easy' | 'medium' | 'hard' | 'advanced'> = ['easy', 'medium', 'hard', 'advanced'];
  
  return Array.from({ length: 20 }, (_, i) => ({
    content_id: `content_${page}_${i}`,
    title: `Educational Content ${page * 20 + i + 1}`,
    content_type: types[i % types.length],
    difficulty_level: difficulties[i % difficulties.length],
    duration_minutes: 10 + (i % 50),
    subject_name: subjects[i % subjects.length],
    grade_level: 1 + (i % 12),
    language: 'English',
    view_count: Math.floor(Math.random() * 10000),
    average_rating: 3 + Math.random() * 2,
    available_offline: i % 3 === 0,
    offline_downloaded: i % 6 === 0,
  }));
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  listContent: {
    padding: 12,
  },
  header: {
    marginBottom: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginRight: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 44,
    fontSize: 16,
    color: '#333',
  },
  filterButton: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
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
  filterSection: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  filterChipsContainer: {
    gap: 12,
  },
  filterGroup: {
    marginBottom: 8,
  },
  filterGroupLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#f0f0f0',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  filterChipActive: {
    backgroundColor: '#E3F2FD',
    borderColor: '#007AFF',
  },
  filterChipText: {
    fontSize: 13,
    color: '#666',
    textTransform: 'capitalize',
  },
  filterChipTextActive: {
    color: '#007AFF',
    fontWeight: '600',
  },
  clearFiltersButton: {
    alignSelf: 'flex-start',
    paddingVertical: 8,
  },
  clearFiltersText: {
    fontSize: 14,
    color: '#FF3B30',
    fontWeight: '600',
  },
  sortContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sortLabel: {
    fontSize: 14,
    color: '#666',
    marginRight: 10,
  },
  sortChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#fff',
    borderRadius: 15,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  sortChipActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  sortText: {
    fontSize: 13,
    color: '#666',
  },
  sortTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  resultCount: {
    fontSize: 13,
    color: '#999',
  },
  contentCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
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
  thumbnailContainer: {
    position: 'relative',
    width: '100%',
    height: 180,
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  thumbnailPlaceholder: {
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  durationBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    gap: 4,
  },
  durationText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  offlineBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 4,
  },
  contentInfo: {
    padding: 12,
  },
  contentTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 13,
    color: '#666',
    textTransform: 'capitalize',
  },
  actionRow: {
    flexDirection: 'row',
    marginTop: 8,
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: '#f0f0f0',
    gap: 6,
  },
  actionText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '600',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
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
  footerLoader: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
