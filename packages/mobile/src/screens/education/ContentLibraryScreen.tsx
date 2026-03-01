/**
 * Content Library Screen
 * Task 35.2: Build content library with search and filters
 * 
 * Features:
 * - Search functionality with debouncing
 * - Filters for subject, grade, topic, difficulty, content type
 * - Content cards with thumbnails, titles, duration, metadata
 * - Content recommendations based on knowledge state
 * - Offline content browsing (cached content)
 * - Loading states and error handling
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  Modal,
} from 'react-native';
import { OfflineIndicator } from '../../components/OfflineIndicator';
import educationService from '../../services/educationService';
import {
  ContentItem,
  ContentSearchParams,
  Subject,
  GradeLevel,
  DifficultyLevel,
  ContentType,
  SUBJECTS,
  GRADE_LEVELS,
  CONTENT_TYPES,
  DIFFICULTY_LEVELS,
} from '../../types/education';

interface ContentLibraryScreenProps {
  navigation: any;
  route: {
    params?: {
      studentId: string;
    };
  };
}

export const ContentLibraryScreen: React.FC<ContentLibraryScreenProps> = ({
  navigation,
  route,
}) => {
  const studentId = route.params?.studentId || 'demo-student';

  // State
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [contentItems, setContentItems] = useState<ContentItem[]>([]);
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [selectedSubject, setSelectedSubject] = useState<Subject | undefined>();
  const [selectedGrade, setSelectedGrade] = useState<GradeLevel | undefined>();
  const [selectedDifficulty, setSelectedDifficulty] = useState<DifficultyLevel | undefined>();
  const [selectedContentType, setSelectedContentType] = useState<ContentType | undefined>();

  // Pagination
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // Debounce timer
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    // Debounce search
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      performSearch();
    }, 500);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery, selectedSubject, selectedGrade, selectedDifficulty, selectedContentType]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load recommendations
      const recs = await educationService.getContentRecommendations(studentId);
      setRecommendations(recs.map(r => r.contentId));

      // Load initial content
      await performSearch(true);
    } catch (err: any) {
      console.error('Error loading initial data:', err);
      setError(err.message || 'Failed to load content');
    } finally {
      setLoading(false);
    }
  };

  const performSearch = async (reset: boolean = false) => {
    try {
      if (reset) {
        setSearching(true);
        setPage(1);
      }

      const params: ContentSearchParams = {
        query: searchQuery || undefined,
        subject: selectedSubject,
        gradeLevel: selectedGrade,
        difficulty: selectedDifficulty,
        contentType: selectedContentType,
        page: reset ? 1 : page,
        limit: 20,
      };

      const result = await educationService.searchContent(params);

      if (reset) {
        setContentItems(result.items);
      } else {
        setContentItems(prev => [...prev, ...result.items]);
      }

      setHasMore(result.page < result.totalPages);
      setError(null);
    } catch (err: any) {
      console.error('Error searching content:', err);
      setError(err.message || 'Failed to search content');
    } finally {
      setSearching(false);
    }
  };

  const handleLoadMore = () => {
    if (!searching && hasMore) {
      setPage(prev => prev + 1);
      performSearch();
    }
  };

  const handleContentPress = (content: ContentItem) => {
    // Track view
    educationService.trackContentView(content.id, studentId);

    // Navigate to content viewer
    navigation.navigate('ContentViewer', {
      contentId: content.id,
      content,
    });
  };

  const clearFilters = () => {
    setSelectedSubject(undefined);
    setSelectedGrade(undefined);
    setSelectedDifficulty(undefined);
    setSelectedContentType(undefined);
    setSearchQuery('');
  };

  const getActiveFilterCount = (): number => {
    let count = 0;
    if (selectedSubject) count++;
    if (selectedGrade) count++;
    if (selectedDifficulty) count++;
    if (selectedContentType) count++;
    return count;
  };

  const getDifficultyColor = (difficulty: DifficultyLevel): string => {
    const level = DIFFICULTY_LEVELS.find(d => d.value === difficulty);
    return level?.color || '#666';
  };

  const getContentTypeIcon = (type: ContentType): string => {
    const contentType = CONTENT_TYPES.find(ct => ct.value === type);
    return contentType?.icon || '📄';
  };

  const formatDuration = (minutes: number): string => {
    if (minutes < 60) {
      return `${minutes}m`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  const renderContentCard = ({ item }: { item: ContentItem }) => {
    const isRecommended = recommendations.includes(item.id);

    return (
      <TouchableOpacity
        style={styles.contentCard}
        onPress={() => handleContentPress(item)}
        activeOpacity={0.7}
      >
        {/* Thumbnail */}
        <View style={styles.thumbnail}>
          <Text style={styles.thumbnailIcon}>{getContentTypeIcon(item.contentType)}</Text>
          {item.isOfflineAvailable && (
            <View style={styles.offlineBadge}>
              <Text style={styles.offlineBadgeText}>📥</Text>
            </View>
          )}
          {isRecommended && (
            <View style={styles.recommendedBadge}>
              <Text style={styles.recommendedBadgeText}>⭐ Recommended</Text>
            </View>
          )}
        </View>

        {/* Content Info */}
        <View style={styles.contentInfo}>
          <Text style={styles.contentTitle} numberOfLines={2}>
            {item.title}
          </Text>
          
          <Text style={styles.contentDescription} numberOfLines={2}>
            {item.description}
          </Text>

          {/* Metadata */}
          <View style={styles.metadata}>
            <View style={styles.metadataItem}>
              <Text style={styles.metadataIcon}>📚</Text>
              <Text style={styles.metadataText}>
                {SUBJECTS.find(s => s.value === item.subject)?.label}
              </Text>
            </View>

            <View style={styles.metadataItem}>
              <Text style={styles.metadataIcon}>🎓</Text>
              <Text style={styles.metadataText}>Class {item.gradeLevel}</Text>
            </View>

            <View style={styles.metadataItem}>
              <Text style={styles.metadataIcon}>⏱️</Text>
              <Text style={styles.metadataText}>{formatDuration(item.duration)}</Text>
            </View>
          </View>

          {/* Stats */}
          <View style={styles.stats}>
            <View
              style={[
                styles.difficultyBadge,
                { backgroundColor: getDifficultyColor(item.difficulty) + '20' },
              ]}
            >
              <Text
                style={[
                  styles.difficultyText,
                  { color: getDifficultyColor(item.difficulty) },
                ]}
              >
                {item.difficulty.charAt(0).toUpperCase() + item.difficulty.slice(1)}
              </Text>
            </View>

            <View style={styles.rating}>
              <Text style={styles.ratingText}>⭐ {item.rating.toFixed(1)}</Text>
            </View>

            <View style={styles.views}>
              <Text style={styles.viewsText}>👁️ {item.viewCount}</Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderFilterModal = () => (
    <Modal
      visible={showFilters}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowFilters(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Filters</Text>
            <TouchableOpacity onPress={() => setShowFilters(false)}>
              <Text style={styles.modalClose}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.filterScroll} showsVerticalScrollIndicator={false}>
            {/* Subject Filter */}
            <View style={styles.filterSection}>
              <Text style={styles.filterLabel}>Subject</Text>
              <View style={styles.filterOptions}>
                {SUBJECTS.map(subject => (
                  <TouchableOpacity
                    key={subject.value}
                    style={[
                      styles.filterChip,
                      selectedSubject === subject.value && styles.filterChipActive,
                    ]}
                    onPress={() =>
                      setSelectedSubject(
                        selectedSubject === subject.value ? undefined : subject.value
                      )
                    }
                  >
                    <Text style={styles.filterChipIcon}>{subject.icon}</Text>
                    <Text
                      style={[
                        styles.filterChipText,
                        selectedSubject === subject.value && styles.filterChipTextActive,
                      ]}
                    >
                      {subject.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Grade Filter */}
            <View style={styles.filterSection}>
              <Text style={styles.filterLabel}>Grade Level</Text>
              <View style={styles.filterOptions}>
                {GRADE_LEVELS.map(grade => (
                  <TouchableOpacity
                    key={grade.value}
                    style={[
                      styles.filterChip,
                      selectedGrade === grade.value && styles.filterChipActive,
                    ]}
                    onPress={() =>
                      setSelectedGrade(
                        selectedGrade === grade.value ? undefined : grade.value
                      )
                    }
                  >
                    <Text
                      style={[
                        styles.filterChipText,
                        selectedGrade === grade.value && styles.filterChipTextActive,
                      ]}
                    >
                      {grade.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Difficulty Filter */}
            <View style={styles.filterSection}>
              <Text style={styles.filterLabel}>Difficulty</Text>
              <View style={styles.filterOptions}>
                {DIFFICULTY_LEVELS.map(difficulty => (
                  <TouchableOpacity
                    key={difficulty.value}
                    style={[
                      styles.filterChip,
                      selectedDifficulty === difficulty.value && styles.filterChipActive,
                    ]}
                    onPress={() =>
                      setSelectedDifficulty(
                        selectedDifficulty === difficulty.value ? undefined : difficulty.value
                      )
                    }
                  >
                    <Text
                      style={[
                        styles.filterChipText,
                        selectedDifficulty === difficulty.value && styles.filterChipTextActive,
                      ]}
                    >
                      {difficulty.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Content Type Filter */}
            <View style={styles.filterSection}>
              <Text style={styles.filterLabel}>Content Type</Text>
              <View style={styles.filterOptions}>
                {CONTENT_TYPES.map(type => (
                  <TouchableOpacity
                    key={type.value}
                    style={[
                      styles.filterChip,
                      selectedContentType === type.value && styles.filterChipActive,
                    ]}
                    onPress={() =>
                      setSelectedContentType(
                        selectedContentType === type.value ? undefined : type.value
                      )
                    }
                  >
                    <Text style={styles.filterChipIcon}>{type.icon}</Text>
                    <Text
                      style={[
                        styles.filterChipText,
                        selectedContentType === type.value && styles.filterChipTextActive,
                      ]}
                    >
                      {type.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </ScrollView>

          {/* Filter Actions */}
          <View style={styles.filterActions}>
            <TouchableOpacity
              style={styles.clearButton}
              onPress={() => {
                clearFilters();
                setShowFilters(false);
              }}
            >
              <Text style={styles.clearButtonText}>Clear All</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.applyButton}
              onPress={() => setShowFilters(false)}
            >
              <Text style={styles.applyButtonText}>Apply Filters</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>Loading content library...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <OfflineIndicator />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Content Library</Text>
        <Text style={styles.headerSubtitle}>
          Explore educational content
        </Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search videos, simulations, games..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#999"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Text style={styles.clearIcon}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowFilters(true)}
        >
          <Text style={styles.filterIcon}>⚙️</Text>
          {getActiveFilterCount() > 0 && (
            <View style={styles.filterBadge}>
              <Text style={styles.filterBadgeText}>{getActiveFilterCount()}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Active Filters */}
      {getActiveFilterCount() > 0 && (
        <ScrollView
          horizontal
          style={styles.activeFilters}
          showsHorizontalScrollIndicator={false}
        >
          {selectedSubject && (
            <View style={styles.activeFilterChip}>
              <Text style={styles.activeFilterText}>
                {SUBJECTS.find(s => s.value === selectedSubject)?.label}
              </Text>
              <TouchableOpacity onPress={() => setSelectedSubject(undefined)}>
                <Text style={styles.activeFilterRemove}>✕</Text>
              </TouchableOpacity>
            </View>
          )}
          {selectedGrade && (
            <View style={styles.activeFilterChip}>
              <Text style={styles.activeFilterText}>Class {selectedGrade}</Text>
              <TouchableOpacity onPress={() => setSelectedGrade(undefined)}>
                <Text style={styles.activeFilterRemove}>✕</Text>
              </TouchableOpacity>
            </View>
          )}
          {selectedDifficulty && (
            <View style={styles.activeFilterChip}>
              <Text style={styles.activeFilterText}>
                {selectedDifficulty.charAt(0).toUpperCase() + selectedDifficulty.slice(1)}
              </Text>
              <TouchableOpacity onPress={() => setSelectedDifficulty(undefined)}>
                <Text style={styles.activeFilterRemove}>✕</Text>
              </TouchableOpacity>
            </View>
          )}
          {selectedContentType && (
            <View style={styles.activeFilterChip}>
              <Text style={styles.activeFilterText}>
                {CONTENT_TYPES.find(ct => ct.value === selectedContentType)?.label}
              </Text>
              <TouchableOpacity onPress={() => setSelectedContentType(undefined)}>
                <Text style={styles.activeFilterRemove}>✕</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      )}

      {/* Error State */}
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>⚠️ {error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => loadInitialData()}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Content List */}
      {!error && (
        <FlatList
          data={contentItems}
          renderItem={renderContentCard}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.contentList}
          showsVerticalScrollIndicator={false}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>📚</Text>
              <Text style={styles.emptyText}>No content found</Text>
              <Text style={styles.emptySubtext}>
                Try adjusting your search or filters
              </Text>
            </View>
          }
          ListFooterComponent={
            searching ? (
              <View style={styles.loadingMore}>
                <ActivityIndicator size="small" color="#2196F3" />
              </View>
            ) : null
          }
        />
      )}

      {/* Filter Modal */}
      {renderFilterModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  header: {
    backgroundColor: '#2196F3',
    padding: 20,
    paddingTop: 40,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#E3F2FD',
  },
  searchContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    paddingVertical: 12,
  },
  clearIcon: {
    fontSize: 20,
    color: '#999',
    padding: 4,
  },
  filterButton: {
    width: 48,
    height: 48,
    backgroundColor: '#fff',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  filterIcon: {
    fontSize: 24,
  },
  filterBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#F44336',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  activeFilters: {
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  activeFilterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2196F3',
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginRight: 8,
  },
  activeFilterText: {
    color: '#fff',
    fontSize: 14,
    marginRight: 6,
  },
  activeFilterRemove: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  errorContainer: {
    margin: 16,
    padding: 16,
    backgroundColor: '#FFEBEE',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FFCDD2',
  },
  errorText: {
    fontSize: 14,
    color: '#C62828',
    marginBottom: 12,
  },
  retryButton: {
    backgroundColor: '#F44336',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  contentList: {
    padding: 16,
  },
  contentCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  thumbnail: {
    height: 120,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  thumbnailIcon: {
    fontSize: 48,
  },
  offlineBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#4CAF50',
    borderRadius: 16,
    padding: 6,
  },
  offlineBadgeText: {
    fontSize: 16,
  },
  recommendedBadge: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    backgroundColor: '#FF9800',
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  recommendedBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  contentInfo: {
    padding: 16,
  },
  contentTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  contentDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 12,
  },
  metadata: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 12,
  },
  metadataItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metadataIcon: {
    fontSize: 14,
    marginRight: 4,
  },
  metadataText: {
    fontSize: 12,
    color: '#666',
  },
  stats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  difficultyBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  difficultyText: {
    fontSize: 12,
    fontWeight: '600',
  },
  rating: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 12,
    color: '#666',
  },
  views: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewsText: {
    fontSize: 12,
    color: '#666',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
  },
  loadingMore: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  modalClose: {
    fontSize: 28,
    color: '#666',
  },
  filterScroll: {
    flex: 1,
    padding: 20,
  },
  filterSection: {
    marginBottom: 24,
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  filterOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  filterChipActive: {
    backgroundColor: '#2196F3',
    borderColor: '#2196F3',
  },
  filterChipIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  filterChipText: {
    fontSize: 14,
    color: '#666',
  },
  filterChipTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  filterActions: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  clearButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    alignItems: 'center',
  },
  clearButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  applyButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#2196F3',
    alignItems: 'center',
  },
  applyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});

export default ContentLibraryScreen;
