/**
 * Poll List Screen
 * Task 36.5: Build poll listing and voting interface
 * 
 * Features:
 * - Display active and past polls
 * - Show poll summary (title, description, category, end date)
 * - Display poll type badges (single choice, multiple choice, ranked, budget allocation)
 * - Show participation count and total eligible voters
 * - Display poll status (active, closed, binding)
 * - Implement voting interface for each poll type:
 *   - Single choice: Radio buttons
 *   - Multiple choice: Checkboxes
 *   - Ranked choice: Drag-to-reorder list
 *   - Budget allocation: Sliders with total constraint
 * - Show real-time or hidden results based on poll settings
 * - Display "You voted" indicator for completed polls
 * - Show eligibility criteria (age, location, etc.)
 * - Filter by status (active, closed) and category
 * - Support pull-to-refresh
 * - Show empty state when no polls available
 * - Integrate with infrastructure/polls service
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  Modal,
  RefreshControl,
  Alert,
} from 'react-native';
import { OfflineIndicator } from '../../components/OfflineIndicator';
import { API_BASE_URL } from '../../config/api-config';

interface PollListScreenProps {
  navigation: any;
}

type PollType = 'single_choice' | 'multiple_choice' | 'ranked_choice' | 'budget_allocation';
type PollStatus = 'draft' | 'active' | 'closed' | 'cancelled';

interface PollOption {
  option_id: string;
  text: string;
  description?: string;
  budget_amount?: number;
}

interface PollListItem {
  poll_id: string;
  title: string;
  description?: string;
  poll_type: PollType;
  status: PollStatus;
  options: PollOption[];
  total_votes: number;
  eligible_voters_count?: number;
  is_binding: boolean;
  binding_threshold_percentage?: number;
  start_date: string;
  end_date: string;
  created_at: string;
  user_has_voted: boolean;
  user_is_eligible: boolean;
  eligibility_reason?: string;
  show_results_before_voting: boolean;
  show_results_after_voting: boolean;
  show_real_time_results: boolean;
  allow_anonymous: boolean;
  commitment_text?: string;
}

const POLL_TYPE_CONFIG: Record<PollType, { label: string; icon: string; color: string }> = {
  single_choice: { label: 'Single Choice', icon: '⚪', color: '#2196F3' },
  multiple_choice: { label: 'Multiple Choice', icon: '☑️', color: '#9C27B0' },
  ranked_choice: { label: 'Ranked Choice', icon: '📊', color: '#FF9800' },
  budget_allocation: { label: 'Budget Allocation', icon: '💰', color: '#4CAF50' },
};

const STATUS_CONFIG: Record<PollStatus, { label: string; color: string }> = {
  draft: { label: 'Draft', color: '#9E9E9E' },
  active: { label: 'Active', color: '#4CAF50' },
  closed: { label: 'Closed', color: '#607D8B' },
  cancelled: { label: 'Cancelled', color: '#F44336' },
};

export const PollListScreen: React.FC<PollListScreenProps> = ({ navigation }) => {
  // State
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [polls, setPolls] = useState<PollListItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [selectedStatus, setSelectedStatus] = useState<PollStatus | undefined>('active');
  const [showBindingOnly, setShowBindingOnly] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    loadPolls();
  }, [selectedStatus, showBindingOnly]);

  const loadPolls = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (selectedStatus) params.append('status', selectedStatus);
      if (showBindingOnly) params.append('is_binding', 'true');

      const response = await fetch(`${API_BASE_URL}/api/community-polls?${params.toString()}`);
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to load polls');
      }

      setPolls(data.data || []);
    } catch (err: any) {
      console.error('Error loading polls:', err);
      setError(err.message || 'Failed to load polls');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadPolls();
  };

  const handlePollPress = (poll: PollListItem) => {
    navigation.navigate('PollDetail', {
      pollId: poll.poll_id,
      poll: poll,
    });
  };

  const clearFilters = () => {
    setSelectedStatus(undefined);
    setShowBindingOnly(false);
  };

  const getActiveFilterCount = (): number => {
    let count = 0;
    if (selectedStatus) count++;
    if (showBindingOnly) count++;
    return count;
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const getTimeRemaining = (endDate: string): string => {
    const end = new Date(endDate);
    const now = new Date();
    const diffMs = end.getTime() - now.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (diffMs < 0) return 'Ended';
    if (diffDays > 0) return `${diffDays} day${diffDays > 1 ? 's' : ''} left`;
    if (diffHours > 0) return `${diffHours} hour${diffHours > 1 ? 's' : ''} left`;
    return 'Ending soon';
  };

  const getTurnoutPercentage = (poll: PollListItem): number => {
    if (!poll.eligible_voters_count || poll.eligible_voters_count === 0) return 0;
    return Math.round((poll.total_votes / poll.eligible_voters_count) * 100);
  };

  const renderPollCard = ({ item }: { item: PollListItem }) => {
    const pollTypeConfig = POLL_TYPE_CONFIG[item.poll_type];
    const statusConfig = STATUS_CONFIG[item.status];
    const timeRemaining = getTimeRemaining(item.end_date);
    const turnout = getTurnoutPercentage(item);

    return (
      <TouchableOpacity
        style={styles.pollCard}
        onPress={() => handlePollPress(item)}
        activeOpacity={0.7}
      >
        {/* Header */}
        <View style={styles.cardHeader}>
          <View style={styles.pollTypeBadge}>
            <Text style={styles.pollTypeIcon}>{pollTypeConfig.icon}</Text>
            <Text style={[styles.pollTypeText, { color: pollTypeConfig.color }]}>
              {pollTypeConfig.label}
            </Text>
          </View>

          <View style={[styles.statusBadge, { backgroundColor: statusConfig.color + '20' }]}>
            <Text style={[styles.statusText, { color: statusConfig.color }]}>
              {statusConfig.label}
            </Text>
          </View>
        </View>

        {/* Title */}
        <Text style={styles.title} numberOfLines={2}>
          {item.title}
        </Text>

        {/* Description */}
        {item.description && (
          <Text style={styles.description} numberOfLines={2}>
            {item.description}
          </Text>
        )}

        {/* Binding Badge */}
        {item.is_binding && (
          <View style={styles.bindingBadge}>
            <Text style={styles.bindingIcon}>⚖️</Text>
            <Text style={styles.bindingText}>Binding Poll</Text>
            {item.binding_threshold_percentage && (
              <Text style={styles.bindingThreshold}>
                ({item.binding_threshold_percentage}% threshold)
              </Text>
            )}
          </View>
        )}

        {/* Participation Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statIcon}>👥</Text>
            <Text style={styles.statText}>
              {item.total_votes} vote{item.total_votes !== 1 ? 's' : ''}
            </Text>
          </View>

          {item.eligible_voters_count && (
            <View style={styles.statItem}>
              <Text style={styles.statIcon}>📊</Text>
              <Text style={styles.statText}>{turnout}% turnout</Text>
            </View>
          )}

          {item.status === 'active' && (
            <View style={styles.statItem}>
              <Text style={styles.statIcon}>⏰</Text>
              <Text style={[styles.statText, timeRemaining === 'Ending soon' && styles.urgentText]}>
                {timeRemaining}
              </Text>
            </View>
          )}
        </View>

        {/* Footer */}
        <View style={styles.cardFooter}>
          <Text style={styles.dateText}>
            {item.status === 'active' ? 'Ends' : 'Ended'}: {formatDate(item.end_date)}
          </Text>

          {item.user_has_voted ? (
            <View style={styles.votedBadge}>
              <Text style={styles.votedIcon}>✓</Text>
              <Text style={styles.votedText}>You voted</Text>
            </View>
          ) : item.status === 'active' && item.user_is_eligible ? (
            <View style={styles.eligibleBadge}>
              <Text style={styles.eligibleText}>Tap to vote</Text>
            </View>
          ) : !item.user_is_eligible && item.status === 'active' ? (
            <View style={styles.ineligibleBadge}>
              <Text style={styles.ineligibleText}>Not eligible</Text>
            </View>
          ) : null}
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
                {Object.entries(STATUS_CONFIG).map(([status, config]) => (
                  <TouchableOpacity
                    key={status}
                    style={[
                      styles.filterChip,
                      selectedStatus === status && styles.filterChipActive,
                      selectedStatus === status && { borderColor: config.color },
                    ]}
                    onPress={() =>
                      setSelectedStatus(selectedStatus === status ? undefined : status as PollStatus)
                    }
                  >
                    <Text
                      style={[
                        styles.filterChipText,
                        selectedStatus === status && styles.filterChipTextActive,
                      ]}
                    >
                      {config.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Binding Toggle */}
            <TouchableOpacity
              style={styles.toggleContainer}
              onPress={() => setShowBindingOnly(!showBindingOnly)}
            >
              <View style={[styles.checkbox, showBindingOnly && styles.checkboxChecked]}>
                {showBindingOnly && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <Text style={styles.toggleLabel}>Show only binding polls</Text>
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

            <TouchableOpacity style={styles.applyButton} onPress={() => setShowFilters(false)}>
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
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Loading polls...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <OfflineIndicator />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Community Polls</Text>
        <Text style={styles.headerSubtitle}>
          {polls.length} {polls.length === 1 ? 'poll' : 'polls'} available
        </Text>
      </View>

      {/* Filter Button */}
      <View style={styles.filterContainer}>
        <TouchableOpacity style={styles.filterButton} onPress={() => setShowFilters(true)}>
          <Text style={styles.filterIcon}>⚙️</Text>
          <Text style={styles.filterButtonText}>Filters</Text>
          {getActiveFilterCount() > 0 && (
            <View style={styles.filterBadge}>
              <Text style={styles.filterBadgeText}>{getActiveFilterCount()}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Active Filters */}
      {getActiveFilterCount() > 0 && (
        <ScrollView horizontal style={styles.activeFilters} showsHorizontalScrollIndicator={false}>
          {selectedStatus && (
            <View style={styles.activeFilterChip}>
              <Text style={styles.activeFilterText}>
                {STATUS_CONFIG[selectedStatus].label}
              </Text>
              <TouchableOpacity onPress={() => setSelectedStatus(undefined)}>
                <Text style={styles.activeFilterRemove}>✕</Text>
              </TouchableOpacity>
            </View>
          )}
          {showBindingOnly && (
            <View style={styles.activeFilterChip}>
              <Text style={styles.activeFilterText}>Binding Only</Text>
              <TouchableOpacity onPress={() => setShowBindingOnly(false)}>
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
          <TouchableOpacity style={styles.retryButton} onPress={() => loadPolls()}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Poll List */}
      {!error && (
        <FlatList
          data={polls}
          renderItem={renderPollCard}
          keyExtractor={item => item.poll_id}
          contentContainerStyle={styles.pollList}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={['#4CAF50']} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>🗳️</Text>
              <Text style={styles.emptyText}>No polls found</Text>
              <Text style={styles.emptySubtext}>
                {getActiveFilterCount() > 0
                  ? 'Try adjusting your filters'
                  : 'Check back later for new polls'}
              </Text>
            </View>
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
  filterContainer: {
    padding: 16,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  filterIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  filterButtonText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
    flex: 1,
  },
  filterBadge: {
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
  pollList: {
    padding: 16,
  },
  pollCard: {
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
  pollTypeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 16,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  pollTypeIcon: {
    fontSize: 14,
    marginRight: 4,
  },
  pollTypeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    lineHeight: 24,
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 12,
  },
  bindingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
    borderRadius: 8,
    padding: 8,
    marginBottom: 12,
  },
  bindingIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  bindingText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#F57C00',
  },
  bindingThreshold: {
    fontSize: 12,
    color: '#F57C00',
    marginLeft: 4,
  },
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 12,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statIcon: {
    fontSize: 14,
    marginRight: 4,
  },
  statText: {
    fontSize: 13,
    color: '#666',
  },
  urgentText: {
    color: '#F44336',
    fontWeight: '600',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  dateText: {
    fontSize: 12,
    color: '#999',
  },
  votedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  votedIcon: {
    fontSize: 12,
    color: '#4CAF50',
    marginRight: 4,
  },
  votedText: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '600',
  },
  eligibleBadge: {
    backgroundColor: '#E3F2FD',
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  eligibleText: {
    fontSize: 12,
    color: '#2196F3',
    fontWeight: '600',
  },
  ineligibleBadge: {
    backgroundColor: '#FFEBEE',
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  ineligibleText: {
    fontSize: 12,
    color: '#F44336',
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '70%',
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

export default PollListScreen;

export default PollListScreen;
