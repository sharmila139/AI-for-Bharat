/**
 * Grievance List Screen
 * Task 36.2: Build grievance list with filters and search
 * 
 * Features:
 * - Search by ticket number, title, description
 * - Filter by status, category, date range, my grievances
 * - Status badges with color coding
 * - Pull-to-refresh functionality
 * - Infinite scroll/pagination
 * - Empty state
 * - Offline indicator
 * - Tap to view details
 * - Overdue indicator
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
  RefreshControl,
} from 'react-native';
import { OfflineIndicator } from '../../components/OfflineIndicator';
import {
  searchGrievances,
  GrievanceSearchParams,
  GrievanceListItem,
  GrievanceCategory,
  GrievanceStatus,
} from '../../services/api/grievance-api';

interface GrievanceListScreenProps {
  navigation: any;
}

const CATEGORIES: Array<{ value: GrievanceCategory; label: string; icon: string }> = [
  { value: 'road', label: 'Roads', icon: '🛣️' },
  { value: 'water', label: 'Water', icon: '💧' },
  { value: 'electricity', label: 'Electricity', icon: '⚡' },
  { value: 'sanitation', label: 'Sanitation', icon: '🚮' },
  { value: 'healthcare', label: 'Healthcare', icon: '🏥' },
  { value: 'education', label: 'Education', icon: '🎓' },
  { value: 'public_safety', label: 'Public Safety', icon: '🚨' },
  { value: 'other', label: 'Other', icon: '📋' },
];

const STATUSES: Array<{ value: GrievanceStatus; label: string; color: string }> = [
  { value: 'submitted', label: 'Submitted', color: '#2196F3' },
  { value: 'acknowledged', label: 'Acknowledged', color: '#9C27B0' },
  { value: 'in_progress', label: 'In Progress', color: '#FF9800' },
  { value: 'resolved', label: 'Resolved', color: '#4CAF50' },
  { value: 'closed', label: 'Closed', color: '#607D8B' },
  { value: 'rejected', label: 'Rejected', color: '#F44336' },
];

export const GrievanceListScreen: React.FC<GrievanceListScreenProps> = ({
  navigation,
}) => {
  // State
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searching, setSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [grievances, setGrievances] = useState<GrievanceListItem[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [selectedStatus, setSelectedStatus] = useState<GrievanceStatus | undefined>();
  const [selectedCategory, setSelectedCategory] = useState<GrievanceCategory | undefined>();
  const [startDate, setStartDate] = useState<string | undefined>();
  const [endDate, setEndDate] = useState<string | undefined>();
  const [myGrievancesOnly, setMyGrievancesOnly] = useState(true); // Default to true

  // Pagination
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

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
      performSearch(true);
    }, 500);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery, selectedStatus, selectedCategory, startDate, endDate, myGrievancesOnly]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      setError(null);
      await performSearch(true);
    } catch (err: any) {
      console.error('Error loading initial data:', err);
      setError(err.message || 'Failed to load grievances');
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

      const params: GrievanceSearchParams = {
        query: searchQuery || undefined,
        status: selectedStatus,
        category: selectedCategory,
        startDate,
        endDate,
        myGrievances: myGrievancesOnly || undefined,
        page: reset ? 1 : page,
        limit: 20,
      };

      const result = await searchGrievances(params);

      if (reset) {
        setGrievances(result.items);
      } else {
        setGrievances(prev => [...prev, ...result.items]);
      }

      setHasMore(result.hasMore);
      setTotalCount(result.total);
      setError(null);
    } catch (err: any) {
      console.error('Error searching grievances:', err);
      setError(err.message || 'Failed to search grievances');
    } finally {
      setSearching(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    performSearch(true);
  };

  const handleLoadMore = () => {
    if (!searching && hasMore) {
      setPage(prev => prev + 1);
      performSearch();
    }
  };

  const handleGrievancePress = (grievance: GrievanceListItem) => {
    navigation.navigate('GrievanceTracking', {
      grievanceId: grievance.grievanceId,
      ticketNumber: grievance.ticketNumber,
    });
  };

  const clearFilters = () => {
    setSelectedStatus(undefined);
    setSelectedCategory(undefined);
    setStartDate(undefined);
    setEndDate(undefined);
    setMyGrievancesOnly(false);
    setSearchQuery('');
  };

  const getActiveFilterCount = (): number => {
    let count = 0;
    if (selectedStatus) count++;
    if (selectedCategory) count++;
    if (startDate || endDate) count++;
    if (myGrievancesOnly) count++;
    return count;
  };

  const getStatusColor = (status: GrievanceStatus): string => {
    const statusConfig = STATUSES.find(s => s.value === status);
    return statusConfig?.color || '#666';
  };

  const getStatusLabel = (status: GrievanceStatus): string => {
    const statusConfig = STATUSES.find(s => s.value === status);
    return statusConfig?.label || status;
  };

  const getCategoryIcon = (category: GrievanceCategory): string => {
    const categoryConfig = CATEGORIES.find(c => c.value === category);
    return categoryConfig?.icon || '📋';
  };

  const getCategoryLabel = (category: GrievanceCategory): string => {
    const categoryConfig = CATEGORIES.find(c => c.value === category);
    return categoryConfig?.label || category;
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return date.toLocaleDateString();
  };

  const renderGrievanceCard = ({ item }: { item: GrievanceListItem }) => {
    return (
      <TouchableOpacity
        style={styles.grievanceCard}
        onPress={() => handleGrievancePress(item)}
        activeOpacity={0.7}
      >
        {/* Header */}
        <View style={styles.cardHeader}>
          <View style={styles.ticketContainer}>
            <Text style={styles.ticketLabel}>Ticket:</Text>
            <Text style={styles.ticketNumber}>{item.ticketNumber}</Text>
          </View>
          {item.isOverdue && (
            <View style={styles.overdueBadge}>
              <Text style={styles.overdueText}>⚠️ Overdue</Text>
            </View>
          )}
        </View>

        {/* Title and Category */}
        <View style={styles.titleRow}>
          <Text style={styles.categoryIcon}>{getCategoryIcon(item.category)}</Text>
          <Text style={styles.title} numberOfLines={2}>
            {item.title}
          </Text>
        </View>

        {/* Description */}
        <Text style={styles.description} numberOfLines={2}>
          {item.description}
        </Text>

        {/* Metadata */}
        <View style={styles.metadata}>
          <View style={styles.metadataItem}>
            <Text style={styles.metadataIcon}>📍</Text>
            <Text style={styles.metadataText} numberOfLines={1}>
              {item.address || 'Location not specified'}
            </Text>
          </View>

          <View style={styles.metadataItem}>
            <Text style={styles.metadataIcon}>📅</Text>
            <Text style={styles.metadataText}>{formatDate(item.createdAt)}</Text>
          </View>

          <View style={styles.metadataItem}>
            <Text style={styles.metadataIcon}>⏱️</Text>
            <Text style={styles.metadataText}>{item.daysOpen} days open</Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.cardFooter}>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: getStatusColor(item.status) + '20' },
            ]}
          >
            <Text
              style={[
                styles.statusText,
                { color: getStatusColor(item.status) },
              ]}
            >
              {getStatusLabel(item.status)}
            </Text>
          </View>

          <Text style={styles.categoryLabel}>{getCategoryLabel(item.category)}</Text>
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
            {/* Status Filter */}
            <View style={styles.filterSection}>
              <Text style={styles.filterLabel}>Status</Text>
              <View style={styles.filterOptions}>
                {STATUSES.map(status => (
                  <TouchableOpacity
                    key={status.value}
                    style={[
                      styles.filterChip,
                      selectedStatus === status.value && styles.filterChipActive,
                      selectedStatus === status.value && { borderColor: status.color },
                    ]}
                    onPress={() =>
                      setSelectedStatus(
                        selectedStatus === status.value ? undefined : status.value
                      )
                    }
                  >
                    <Text
                      style={[
                        styles.filterChipText,
                        selectedStatus === status.value && styles.filterChipTextActive,
                      ]}
                    >
                      {status.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Category Filter */}
            <View style={styles.filterSection}>
              <Text style={styles.filterLabel}>Category</Text>
              <View style={styles.filterOptions}>
                {CATEGORIES.map(category => (
                  <TouchableOpacity
                    key={category.value}
                    style={[
                      styles.filterChip,
                      selectedCategory === category.value && styles.filterChipActive,
                    ]}
                    onPress={() =>
                      setSelectedCategory(
                        selectedCategory === category.value ? undefined : category.value
                      )
                    }
                  >
                    <Text style={styles.filterChipIcon}>{category.icon}</Text>
                    <Text
                      style={[
                        styles.filterChipText,
                        selectedCategory === category.value && styles.filterChipTextActive,
                      ]}
                    >
                      {category.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* My Grievances Toggle */}
            <TouchableOpacity
              style={styles.toggleContainer}
              onPress={() => setMyGrievancesOnly(!myGrievancesOnly)}
            >
              <View style={[styles.checkbox, myGrievancesOnly && styles.checkboxChecked]}>
                {myGrievancesOnly && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <Text style={styles.toggleLabel}>Show only my grievances</Text>
            </TouchableOpacity>
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
        <Text style={styles.loadingText}>Loading grievances...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <OfflineIndicator />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Grievances</Text>
        <Text style={styles.headerSubtitle}>
          {totalCount} {totalCount === 1 ? 'grievance' : 'grievances'} found
        </Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search by ticket, title, description..."
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
          {selectedStatus && (
            <View style={styles.activeFilterChip}>
              <Text style={styles.activeFilterText}>
                {getStatusLabel(selectedStatus)}
              </Text>
              <TouchableOpacity onPress={() => setSelectedStatus(undefined)}>
                <Text style={styles.activeFilterRemove}>✕</Text>
              </TouchableOpacity>
            </View>
          )}
          {selectedCategory && (
            <View style={styles.activeFilterChip}>
              <Text style={styles.activeFilterText}>
                {getCategoryLabel(selectedCategory)}
              </Text>
              <TouchableOpacity onPress={() => setSelectedCategory(undefined)}>
                <Text style={styles.activeFilterRemove}>✕</Text>
              </TouchableOpacity>
            </View>
          )}
          {myGrievancesOnly && (
            <View style={styles.activeFilterChip}>
              <Text style={styles.activeFilterText}>My Grievances</Text>
              <TouchableOpacity onPress={() => setMyGrievancesOnly(false)}>
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

      {/* Grievance List */}
      {!error && (
        <FlatList
          data={grievances}
          renderItem={renderGrievanceCard}
          keyExtractor={item => item.grievanceId}
          contentContainerStyle={styles.grievanceList}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={['#2196F3']}
            />
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>📋</Text>
              <Text style={styles.emptyText}>No grievances found</Text>
              <Text style={styles.emptySubtext}>
                {getActiveFilterCount() > 0
                  ? 'Try adjusting your filters'
                  : 'Report an issue to get started'}
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
    backgroundColor: '#4CAF50',
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
    color: '#E8F5E9',
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
    backgroundColor: '#4CAF50',
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
  grievanceList: {
    padding: 16,
  },
  grievanceCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  ticketContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ticketLabel: {
    fontSize: 12,
    color: '#999',
    marginRight: 4,
  },
  ticketNumber: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  overdueBadge: {
    backgroundColor: '#FFEBEE',
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  overdueText: {
    fontSize: 12,
    color: '#F44336',
    fontWeight: '600',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  categoryIcon: {
    fontSize: 24,
    marginRight: 8,
  },
  title: {
    flex: 1,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    lineHeight: 24,
  },
  description: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 12,
  },
  metadata: {
    marginBottom: 12,
  },
  metadataItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  metadataIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  metadataText: {
    flex: 1,
    fontSize: 12,
    color: '#666',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusBadge: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  categoryLabel: {
    fontSize: 12,
    color: '#999',
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
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
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
  toggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    marginBottom: 16,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#ddd',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  checkmark: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  toggleLabel: {
    fontSize: 16,
    color: '#333',
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
    backgroundColor: '#4CAF50',
    alignItems: 'center',
  },
  applyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});

export default GrievanceListScreen;

export default GrievanceListScreen;
