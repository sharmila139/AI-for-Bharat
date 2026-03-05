/**
 * Project Dashboard Screen
 * Task 36.7: Create project dashboard with progress bars
 * 
 * Features:
 * - Display list of infrastructure projects with key information
 * - Show visual progress bars for each project
 * - Include project status, budget, timeline, and completion percentage
 * - Add filtering and sorting capabilities (by status, progress, ward)
 * - Show project categories (roads, water, electricity, schools, etc.)
 * - Include search functionality
 * - Display project delays and alerts
 * - Add navigation to project detail view (task 36.8)
 * - Follow patterns from existing screens (GrievanceListScreen, PollListScreen)
 * - Include proper TypeScript types and error handling
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
import { API_BASE_URL } from '../../config/api-config';

interface ProjectDashboardScreenProps {
  navigation: any;
}

type ProjectType = 
  | 'road' 
  | 'bridge' 
  | 'water_supply' 
  | 'sanitation' 
  | 'electricity' 
  | 'school' 
  | 'hospital' 
  | 'community_center' 
  | 'other';

type ProjectStatus = 
  | 'planned' 
  | 'approved' 
  | 'in_progress' 
  | 'on_hold' 
  | 'completed' 
  | 'cancelled';

interface FundingSource {
  source_name: string;
  amount: number;
  percentage: number;
}

interface ProjectListItem {
  project_id: string;
  project_name: string;
  project_code?: string;
  project_type: ProjectType;
  description?: string;
  address?: string;
  district: string;
  state: string;
  total_budget: number;
  budget_currency: string;
  funding_sources?: FundingSource[];
  planned_start_date: string;
  planned_end_date: string;
  estimated_completion_date?: string;
  progress_percentage: number;
  current_phase?: string;
  is_delayed: boolean;
  delay_days: number;
  delay_reasons?: string[];
  contractor_name?: string;
  implementing_agency?: string;
  status: ProjectStatus;
  beneficiaries_count?: number;
  created_at: string;
  updated_at: string;
}

const PROJECT_TYPE_CONFIG: Record<ProjectType, { label: string; icon: string; color: string }> = {
  road: { label: 'Roads', icon: '🛣️', color: '#FF9800' },
  bridge: { label: 'Bridge', icon: '🌉', color: '#9C27B0' },
  water_supply: { label: 'Water Supply', icon: '💧', color: '#2196F3' },
  sanitation: { label: 'Sanitation', icon: '🚮', color: '#4CAF50' },
  electricity: { label: 'Electricity', icon: '⚡', color: '#FFC107' },
  school: { label: 'School', icon: '🎓', color: '#3F51B5' },
  hospital: { label: 'Hospital', icon: '🏥', color: '#F44336' },
  community_center: { label: 'Community Center', icon: '🏛️', color: '#00BCD4' },
  other: { label: 'Other', icon: '📋', color: '#607D8B' },
};

const STATUS_CONFIG: Record<ProjectStatus, { label: string; color: string }> = {
  planned: { label: 'Planned', color: '#9E9E9E' },
  approved: { label: 'Approved', color: '#2196F3' },
  in_progress: { label: 'In Progress', color: '#FF9800' },
  on_hold: { label: 'On Hold', color: '#FFC107' },
  completed: { label: 'Completed', color: '#4CAF50' },
  cancelled: { label: 'Cancelled', color: '#F44336' },
};

export const ProjectDashboardScreen: React.FC<ProjectDashboardScreenProps> = ({
  navigation,
}) => {
  // State
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [projects, setProjects] = useState<ProjectListItem[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [selectedStatus, setSelectedStatus] = useState<ProjectStatus | undefined>();
  const [selectedType, setSelectedType] = useState<ProjectType | undefined>();
  const [showDelayedOnly, setShowDelayedOnly] = useState(false);
  const [sortBy, setSortBy] = useState<'progress' | 'budget' | 'date'>('date');

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
      loadProjects();
    }, 500);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery, selectedStatus, selectedType, showDelayedOnly, sortBy]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      setError(null);
      await loadProjects();
    } catch (err: any) {
      console.error('Error loading initial data:', err);
      setError(err.message || 'Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  const loadProjects = async () => {
    try {
      setLoading(true);

      const params = new URLSearchParams();
      if (selectedStatus) params.append('status', selectedStatus);
      if (selectedType) params.append('project_type', selectedType);
      if (showDelayedOnly) params.append('is_delayed', 'true');

      const response = await fetch(`${API_BASE_URL}/api/projects?${params.toString()}`);
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to load projects');
      }

      let filteredProjects = data.data || [];

      // Client-side search filtering
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        filteredProjects = filteredProjects.filter((project: ProjectListItem) =>
          project.project_name.toLowerCase().includes(query) ||
          project.project_code?.toLowerCase().includes(query) ||
          project.description?.toLowerCase().includes(query) ||
          project.district.toLowerCase().includes(query)
        );
      }

      // Client-side sorting
      filteredProjects.sort((a: ProjectListItem, b: ProjectListItem) => {
        if (sortBy === 'progress') {
          return b.progress_percentage - a.progress_percentage;
        } else if (sortBy === 'budget') {
          return b.total_budget - a.total_budget;
        } else {
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        }
      });

      setProjects(filteredProjects);
      setError(null);
    } catch (err: any) {
      console.error('Error loading projects:', err);
      setError(err.message || 'Failed to load projects');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadProjects();
  };

  const handleProjectPress = (project: ProjectListItem) => {
    navigation.navigate('ProjectDetail', {
      projectId: project.project_id,
      projectName: project.project_name,
    });
  };

  const clearFilters = () => {
    setSelectedStatus(undefined);
    setSelectedType(undefined);
    setShowDelayedOnly(false);
    setSortBy('date');
    setSearchQuery('');
  };

  const getActiveFilterCount = (): number => {
    let count = 0;
    if (selectedStatus) count++;
    if (selectedType) count++;
    if (showDelayedOnly) count++;
    if (sortBy !== 'date') count++;
    return count;
  };

  const formatCurrency = (amount: number): string => {
    if (amount >= 10000000) {
      return `₹${(amount / 10000000).toFixed(2)} Cr`;
    } else if (amount >= 100000) {
      return `₹${(amount / 100000).toFixed(2)} L`;
    } else if (amount >= 1000) {
      return `₹${(amount / 1000).toFixed(2)} K`;
    }
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const getProgressColor = (progress: number): string => {
    if (progress >= 75) return '#4CAF50';
    if (progress >= 50) return '#FF9800';
    if (progress >= 25) return '#FFC107';
    return '#F44336';
  };

  const getStatusColor = (status: ProjectStatus): string => {
    return STATUS_CONFIG[status]?.color || '#666';
  };

  const getStatusLabel = (status: ProjectStatus): string => {
    return STATUS_CONFIG[status]?.label || status;
  };

  const getTypeIcon = (type: ProjectType): string => {
    return PROJECT_TYPE_CONFIG[type]?.icon || '📋';
  };

  const getTypeLabel = (type: ProjectType): string => {
    return PROJECT_TYPE_CONFIG[type]?.label || type;
  };

  const getTypeColor = (type: ProjectType): string => {
    return PROJECT_TYPE_CONFIG[type]?.color || '#666';
  };

  const renderProjectCard = ({ item }: { item: ProjectListItem }) => {
    const progressColor = getProgressColor(item.progress_percentage);
    const statusColor = getStatusColor(item.status);
    const typeColor = getTypeColor(item.project_type);

    return (
      <TouchableOpacity
        style={styles.projectCard}
        onPress={() => handleProjectPress(item)}
        activeOpacity={0.7}
      >
        {/* Header */}
        <View style={styles.cardHeader}>
          <View style={styles.typeContainer}>
            <Text style={styles.typeIcon}>{getTypeIcon(item.project_type)}</Text>
            <Text style={[styles.typeText, { color: typeColor }]}>
              {getTypeLabel(item.project_type)}
            </Text>
          </View>

          {item.is_delayed && (
            <View style={styles.delayBadge}>
              <Text style={styles.delayIcon}>⚠️</Text>
              <Text style={styles.delayText}>{item.delay_days}d delay</Text>
            </View>
          )}
        </View>

        {/* Project Name */}
        <Text style={styles.projectName} numberOfLines={2}>
          {item.project_name}
        </Text>

        {/* Project Code */}
        {item.project_code && (
          <Text style={styles.projectCode}>Code: {item.project_code}</Text>
        )}

        {/* Description */}
        {item.description && (
          <Text style={styles.description} numberOfLines={2}>
            {item.description}
          </Text>
        )}

        {/* Progress Bar */}
        <View style={styles.progressSection}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressLabel}>Progress</Text>
            <Text style={[styles.progressPercentage, { color: progressColor }]}>
              {item.progress_percentage}%
            </Text>
          </View>
          <View style={styles.progressBarContainer}>
            <View
              style={[
                styles.progressBarFill,
                {
                  width: `${item.progress_percentage}%`,
                  backgroundColor: progressColor,
                },
              ]}
            />
          </View>
          {item.current_phase && (
            <Text style={styles.currentPhase}>Current: {item.current_phase}</Text>
          )}
        </View>

        {/* Budget and Timeline */}
        <View style={styles.infoGrid}>
          <View style={styles.infoItem}>
            <Text style={styles.infoIcon}>💰</Text>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Budget</Text>
              <Text style={styles.infoValue}>
                {formatCurrency(item.total_budget)}
              </Text>
            </View>
          </View>

          <View style={styles.infoItem}>
            <Text style={styles.infoIcon}>📅</Text>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Timeline</Text>
              <Text style={styles.infoValue}>
                {formatDate(item.planned_start_date)} - {formatDate(item.planned_end_date)}
              </Text>
            </View>
          </View>
        </View>

        {/* Location and Agency */}
        <View style={styles.metadata}>
          <View style={styles.metadataItem}>
            <Text style={styles.metadataIcon}>📍</Text>
            <Text style={styles.metadataText} numberOfLines={1}>
              {item.district}, {item.state}
            </Text>
          </View>

          {item.implementing_agency && (
            <View style={styles.metadataItem}>
              <Text style={styles.metadataIcon}>🏢</Text>
              <Text style={styles.metadataText} numberOfLines={1}>
                {item.implementing_agency}
              </Text>
            </View>
          )}

          {item.beneficiaries_count && (
            <View style={styles.metadataItem}>
              <Text style={styles.metadataIcon}>👥</Text>
              <Text style={styles.metadataText}>
                {item.beneficiaries_count.toLocaleString()} beneficiaries
              </Text>
            </View>
          )}
        </View>

        {/* Footer */}
        <View style={styles.cardFooter}>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: statusColor + '20' },
            ]}
          >
            <Text style={[styles.statusText, { color: statusColor }]}>
              {getStatusLabel(item.status)}
            </Text>
          </View>

          {item.contractor_name && (
            <Text style={styles.contractorText} numberOfLines={1}>
              {item.contractor_name}
            </Text>
          )}
        </View>

        {/* Delay Reasons */}
        {item.is_delayed && item.delay_reasons && item.delay_reasons.length > 0 && (
          <View style={styles.delayReasonsContainer}>
            <Text style={styles.delayReasonsLabel}>Delay Reasons:</Text>
            <Text style={styles.delayReasonsText} numberOfLines={2}>
              {item.delay_reasons.join(', ')}
            </Text>
          </View>
        )}
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
            <Text style={styles.modalTitle}>Filters & Sort</Text>
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
                      setSelectedStatus(
                        selectedStatus === status ? undefined : status as ProjectStatus
                      )
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

            {/* Project Type Filter */}
            <View style={styles.filterSection}>
              <Text style={styles.filterLabel}>Project Type</Text>
              <View style={styles.filterOptions}>
                {Object.entries(PROJECT_TYPE_CONFIG).map(([type, config]) => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.filterChip,
                      selectedType === type && styles.filterChipActive,
                    ]}
                    onPress={() =>
                      setSelectedType(
                        selectedType === type ? undefined : type as ProjectType
                      )
                    }
                  >
                    <Text style={styles.filterChipIcon}>{config.icon}</Text>
                    <Text
                      style={[
                        styles.filterChipText,
                        selectedType === type && styles.filterChipTextActive,
                      ]}
                    >
                      {config.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Delayed Projects Toggle */}
            <TouchableOpacity
              style={styles.toggleContainer}
              onPress={() => setShowDelayedOnly(!showDelayedOnly)}
            >
              <View style={[styles.checkbox, showDelayedOnly && styles.checkboxChecked]}>
                {showDelayedOnly && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <Text style={styles.toggleLabel}>Show only delayed projects</Text>
            </TouchableOpacity>

            {/* Sort Options */}
            <View style={styles.filterSection}>
              <Text style={styles.filterLabel}>Sort By</Text>
              <View style={styles.sortOptions}>
                {[
                  { value: 'date', label: 'Latest First', icon: '📅' },
                  { value: 'progress', label: 'Progress', icon: '📊' },
                  { value: 'budget', label: 'Budget', icon: '💰' },
                ].map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.sortOption,
                      sortBy === option.value && styles.sortOptionActive,
                    ]}
                    onPress={() => setSortBy(option.value as any)}
                  >
                    <Text style={styles.sortIcon}>{option.icon}</Text>
                    <Text
                      style={[
                        styles.sortText,
                        sortBy === option.value && styles.sortTextActive,
                      ]}
                    >
                      {option.label}
                    </Text>
                    {sortBy === option.value && (
                      <Text style={styles.sortCheck}>✓</Text>
                    )}
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
              <Text style={styles.applyButtonText}>Apply</Text>
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
        <Text style={styles.loadingText}>Loading projects...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <OfflineIndicator />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Infrastructure Projects</Text>
        <Text style={styles.headerSubtitle}>
          {projects.length} {projects.length === 1 ? 'project' : 'projects'}
        </Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search projects, code, district..."
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
          {selectedType && (
            <View style={styles.activeFilterChip}>
              <Text style={styles.activeFilterText}>
                {getTypeLabel(selectedType)}
              </Text>
              <TouchableOpacity onPress={() => setSelectedType(undefined)}>
                <Text style={styles.activeFilterRemove}>✕</Text>
              </TouchableOpacity>
            </View>
          )}
          {showDelayedOnly && (
            <View style={styles.activeFilterChip}>
              <Text style={styles.activeFilterText}>Delayed Only</Text>
              <TouchableOpacity onPress={() => setShowDelayedOnly(false)}>
                <Text style={styles.activeFilterRemove}>✕</Text>
              </TouchableOpacity>
            </View>
          )}
          {sortBy !== 'date' && (
            <View style={styles.activeFilterChip}>
              <Text style={styles.activeFilterText}>
                Sort: {sortBy === 'progress' ? 'Progress' : 'Budget'}
              </Text>
              <TouchableOpacity onPress={() => setSortBy('date')}>
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

      {/* Project List */}
      {!error && (
        <FlatList
          data={projects}
          renderItem={renderProjectCard}
          keyExtractor={item => item.project_id}
          contentContainerStyle={styles.projectList}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={['#4CAF50']}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>🏗️</Text>
              <Text style={styles.emptyText}>No projects found</Text>
              <Text style={styles.emptySubtext}>
                {getActiveFilterCount() > 0
                  ? 'Try adjusting your filters'
                  : 'Check back later for new projects'}
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
  projectList: {
    padding: 16,
  },
  projectCard: {
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
  typeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 16,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  typeIcon: {
    fontSize: 16,
    marginRight: 4,
  },
  typeText: {
    fontSize: 13,
    fontWeight: '600',
  },
  delayBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFEBEE',
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  delayIcon: {
    fontSize: 12,
    marginRight: 4,
  },
  delayText: {
    fontSize: 12,
    color: '#F44336',
    fontWeight: '600',
  },
  projectName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    lineHeight: 24,
    marginBottom: 4,
  },
  projectCode: {
    fontSize: 12,
    color: '#999',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 12,
  },
  progressSection: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#F9F9F9',
    borderRadius: 8,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
  },
  progressPercentage: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 6,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  currentPhase: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  infoGrid: {
    marginBottom: 12,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  infoIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
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
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
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
  contractorText: {
    flex: 1,
    fontSize: 12,
    color: '#666',
    marginLeft: 12,
    textAlign: 'right',
  },
  delayReasonsContainer: {
    marginTop: 12,
    padding: 10,
    backgroundColor: '#FFF3E0',
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#FF9800',
  },
  delayReasonsLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#F57C00',
    marginBottom: 4,
  },
  delayReasonsText: {
    fontSize: 12,
    color: '#E65100',
    lineHeight: 16,
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
  sortOptions: {
    gap: 8,
  },
  sortOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  sortOptionActive: {
    backgroundColor: '#E8F5E9',
    borderColor: '#4CAF50',
  },
  sortIcon: {
    fontSize: 18,
    marginRight: 10,
  },
  sortText: {
    flex: 1,
    fontSize: 15,
    color: '#666',
  },
  sortTextActive: {
    color: '#4CAF50',
    fontWeight: '600',
  },
  sortCheck: {
    fontSize: 18,
    color: '#4CAF50',
    fontWeight: 'bold',
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

export default ProjectDashboardScreen;

export default ProjectDashboardScreen;
