/**
 * Remedy Search Screen
 * Main screen for searching natural remedies with comprehensive filters
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { RemedyCard } from '../../components/remedy/RemedyCard';
import { FilterPanel } from '../../components/remedy/FilterPanel';
import { OfflineIndicator } from '../../components/OfflineIndicator';
import {
  searchRemedies,
  getSeasonalRemedies,
  getTopRatedRemedies,
  RemedySearchFilters,
  RemedySearchResult,
} from '../../services/api/remedy-api';
import BackgroundSyncService from '../../services/sync/background-sync';

interface RemedySearchScreenProps {
  navigation: any;
  route?: {
    params?: {
      ailment?: string;
    };
  };
}

type SortOption = 'relevance' | 'rating' | 'efficacy';

export const RemedySearchScreen: React.FC<RemedySearchScreenProps> = ({
  navigation,
  route,
}) => {
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<RemedySearchFilters>({});
  const [sortBy, setSortBy] = useState<SortOption>('relevance');
  
  // Results state
  const [results, setResults] = useState<RemedySearchResult[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  
  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Quick filters state
  const [showSeasonalOnly, setShowSeasonalOnly] = useState(false);
  const [showTopRated, setShowTopRated] = useState(false);

  useEffect(() => {
    // Check connectivity
    const connectivity = BackgroundSyncService.getConnectivityStatus();
    setIsOnline(connectivity.isOnline);

    const listener = (online: boolean) => {
      setIsOnline(online);
    };
    BackgroundSyncService.addConnectivityListener(listener);

    return () => {
      BackgroundSyncService.removeConnectivityListener(listener);
    };
  }, []);

  useEffect(() => {
    // Load initial results or ailment-specific search
    if (route?.params?.ailment) {
      setSearchQuery(route.params.ailment);
      performSearch(route.params.ailment, filters, 1);
    } else {
      loadTopRated();
    }
  }, []);

  /**
   * Perform search with current query and filters
   */
  const performSearch = async (
    query: string,
    searchFilters: RemedySearchFilters,
    pageNum: number = 1,
    append: boolean = false
  ) => {
    if (pageNum === 1) {
      setIsLoading(true);
    } else {
      setIsLoadingMore(true);
    }
    setError(null);

    try {
      let response;
      
      if (showSeasonalOnly) {
        response = await getSeasonalRemedies(pageNum, 20);
      } else if (showTopRated) {
        const topRated = await getTopRatedRemedies(20);
        response = {
          results: topRated,
          total_count: topRated.length,
          page: 1,
          page_size: 20,
          filters_applied: {},
        };
      } else {
        response = await searchRemedies(query || undefined, searchFilters, pageNum, 20);
      }

      const sortedResults = sortResults(response.results, sortBy);

      if (append) {
        setResults((prev) => [...prev, ...sortedResults]);
      } else {
        setResults(sortedResults);
      }

      setTotalCount(response.total_count);
      setPage(pageNum);
      setHasMore(sortedResults.length === 20);
    } catch (err: any) {
      console.error('Search error:', err);
      setError(err.message || 'Failed to search remedies');
      
      if (!isOnline) {
        Alert.alert(
          'Offline Mode',
          'You are offline. Showing cached results if available.'
        );
      }
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
      setIsRefreshing(false);
    }
  };

  /**
   * Sort results based on selected option
   */
  const sortResults = (
    resultsToSort: RemedySearchResult[],
    sortOption: SortOption
  ): RemedySearchResult[] => {
    const sorted = [...resultsToSort];
    
    switch (sortOption) {
      case 'rating':
        return sorted.sort((a, b) => {
          const ratingA = a.average_rating || 0;
          const ratingB = b.average_rating || 0;
          return ratingB - ratingA;
        });
      
      case 'efficacy':
        return sorted.sort((a, b) => {
          const efficacyA = a.remedy.efficacy_rating || 0;
          const efficacyB = b.remedy.efficacy_rating || 0;
          return efficacyB - efficacyA;
        });
      
      case 'relevance':
      default:
        return sorted.sort((a, b) => b.relevance_score - a.relevance_score);
    }
  };

  /**
   * Load top-rated remedies
   */
  const loadTopRated = async () => {
    setIsLoading(true);
    setShowTopRated(true);
    setShowSeasonalOnly(false);
    try {
      const topRated = await getTopRatedRemedies(20);
      setResults(topRated);
      setTotalCount(topRated.length);
      setHasMore(false);
    } catch (err: any) {
      console.error('Error loading top rated:', err);
      setError('Failed to load top-rated remedies');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Load seasonal remedies
   */
  const loadSeasonal = async () => {
    setIsLoading(true);
    setShowSeasonalOnly(true);
    setShowTopRated(false);
    try {
      const response = await getSeasonalRemedies(1, 20);
      setResults(response.results);
      setTotalCount(response.total_count);
      setHasMore(response.results.length === 20);
    } catch (err: any) {
      console.error('Error loading seasonal:', err);
      setError('Failed to load seasonal remedies');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handle search submission
   */
  const handleSearch = () => {
    setShowTopRated(false);
    setShowSeasonalOnly(false);
    performSearch(searchQuery, filters, 1);
  };

  /**
   * Handle filter application
   */
  const handleApplyFilters = () => {
    setShowFilters(false);
    setShowTopRated(false);
    setShowSeasonalOnly(false);
    performSearch(searchQuery, filters, 1);
  };

  /**
   * Reset filters
   */
  const handleResetFilters = () => {
    setFilters({});
  };

  /**
   * Handle sort change
   */
  const handleSortChange = (newSort: SortOption) => {
    setSortBy(newSort);
    const sorted = sortResults(results, newSort);
    setResults(sorted);
  };

  /**
   * Load more results (pagination)
   */
  const handleLoadMore = () => {
    if (!isLoadingMore && hasMore && !showTopRated) {
      performSearch(searchQuery, filters, page + 1, true);
    }
  };

  /**
   * Refresh results
   */
  const handleRefresh = () => {
    setIsRefreshing(true);
    if (showTopRated) {
      loadTopRated();
    } else if (showSeasonalOnly) {
      loadSeasonal();
    } else {
      performSearch(searchQuery, filters, 1);
    }
  };

  /**
   * Navigate to remedy detail
   */
  const handleRemedyPress = (result: RemedySearchResult) => {
    navigation.navigate('RemedyDetail', { remedyId: result.remedy.remedy_id });
  };

  /**
   * Render search header
   */
  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by ailment or remedy name..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={handleSearch}
          returnKeyType="search"
        />
        <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
          <Text style={styles.searchButtonText}>🔍</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.quickFilters}>
        <TouchableOpacity
          style={[styles.quickFilterChip, showTopRated && styles.quickFilterChipActive]}
          onPress={loadTopRated}
        >
          <Text style={[styles.quickFilterText, showTopRated && styles.quickFilterTextActive]}>
            ⭐ Top Rated
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.quickFilterChip, showSeasonalOnly && styles.quickFilterChipActive]}
          onPress={loadSeasonal}
        >
          <Text style={[styles.quickFilterText, showSeasonalOnly && styles.quickFilterTextActive]}>
            🌿 Seasonal
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowFilters(true)}
        >
          <Text style={styles.filterButtonText}>
            🎛️ Filters {Object.keys(filters).length > 0 && `(${Object.keys(filters).length})`}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.sortContainer}>
        <Text style={styles.sortLabel}>Sort by:</Text>
        <TouchableOpacity
          style={[styles.sortChip, sortBy === 'relevance' && styles.sortChipActive]}
          onPress={() => handleSortChange('relevance')}
        >
          <Text style={[styles.sortText, sortBy === 'relevance' && styles.sortTextActive]}>
            Relevance
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.sortChip, sortBy === 'rating' && styles.sortChipActive]}
          onPress={() => handleSortChange('rating')}
        >
          <Text style={[styles.sortText, sortBy === 'rating' && styles.sortTextActive]}>
            Rating
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.sortChip, sortBy === 'efficacy' && styles.sortChipActive]}
          onPress={() => handleSortChange('efficacy')}
        >
          <Text style={[styles.sortText, sortBy === 'efficacy' && styles.sortTextActive]}>
            Efficacy
          </Text>
        </TouchableOpacity>
      </View>

      {totalCount > 0 && (
        <Text style={styles.resultCount}>
          {totalCount} {totalCount === 1 ? 'remedy' : 'remedies'} found
        </Text>
      )}
    </View>
  );

  /**
   * Render empty state
   */
  const renderEmpty = () => {
    if (isLoading) return null;

    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyIcon}>🔍</Text>
        <Text style={styles.emptyTitle}>No remedies found</Text>
        <Text style={styles.emptyText}>
          Try adjusting your search or filters
        </Text>
      </View>
    );
  };

  /**
   * Render footer (loading more indicator)
   */
  const renderFooter = () => {
    if (!isLoadingMore) return null;

    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color="#2196F3" />
        <Text style={styles.footerLoaderText}>Loading more...</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <OfflineIndicator />
      
      {error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={() => setError(null)}>
            <Text style={styles.errorClose}>✕</Text>
          </TouchableOpacity>
        </View>
      )}

      <FlatList
        data={results}
        keyExtractor={(item) => item.remedy.remedy_id}
        renderItem={({ item }) => (
          <RemedyCard result={item} onPress={() => handleRemedyPress(item)} />
        )}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        ListFooterComponent={renderFooter}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
      />

      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#2196F3" />
          <Text style={styles.loadingText}>Searching remedies...</Text>
        </View>
      )}

      <FilterPanel
        visible={showFilters}
        filters={filters}
        onFiltersChange={setFilters}
        onClose={() => setShowFilters(false)}
        onApply={handleApplyFilters}
        onReset={handleResetFilters}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  listContent: {
    padding: 15,
  },
  header: {
    marginBottom: 15,
  },
  searchContainer: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    padding: 12,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    fontSize: 15,
    marginRight: 8,
  },
  searchButton: {
    width: 48,
    height: 48,
    backgroundColor: '#2196F3',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchButtonText: {
    fontSize: 20,
  },
  quickFilters: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  quickFilterChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#fff',
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  quickFilterChipActive: {
    backgroundColor: '#E3F2FD',
    borderColor: '#2196F3',
  },
  quickFilterText: {
    fontSize: 13,
    color: '#666',
  },
  quickFilterTextActive: {
    color: '#2196F3',
    fontWeight: '600',
  },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#fff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  filterButtonText: {
    fontSize: 13,
    color: '#666',
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
    borderColor: '#ddd',
  },
  sortChipActive: {
    backgroundColor: '#2196F3',
    borderColor: '#2196F3',
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
    marginBottom: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 15,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  footerLoader: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  footerLoaderText: {
    marginLeft: 10,
    fontSize: 14,
    color: '#666',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  errorBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#FFEBEE',
    borderBottomWidth: 1,
    borderBottomColor: '#FFCDD2',
  },
  errorText: {
    flex: 1,
    fontSize: 14,
    color: '#C62828',
  },
  errorClose: {
    fontSize: 20,
    color: '#C62828',
    marginLeft: 10,
  },
});

export default RemedySearchScreen;
