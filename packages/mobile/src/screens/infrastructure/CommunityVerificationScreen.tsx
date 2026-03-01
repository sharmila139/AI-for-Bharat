/**
 * Community Verification Screen
 * Task 36.4: Create community verification interface
 * 
 * Features:
 * - Display list of resolved grievances awaiting verification
 * - Show grievance summary (ticket, title, category, resolution date)
 * - Display before/after photos if available
 * - Show current verification vote counts (yes/no)
 * - Implement voting interface (fixed/not fixed buttons)
 * - Add optional comment field for verification feedback
 * - Show verification threshold progress
 * - Display community verified badge for verified grievances
 * - Filter by category and location
 * - Support pull-to-refresh
 * - Show empty state when no grievances need verification
 * - Integrate with infrastructure/grievance service
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
  Image,
  Alert,
} from 'react-native';
import { OfflineIndicator } from '../../components/OfflineIndicator';
import { GrievanceCategory } from '../../services/api/grievance-api';
import { API_BASE_URL } from '../../config/api-config';

interface CommunityVerificationScreenProps {
  navigation: any;
}

interface VerificationGrievance {
  grievanceId: string;
  ticketNumber: string;
  title: string;
  description: string;
  category: GrievanceCategory;
  address: string;
  district?: string;
  state?: string;
  photos: string[];
  resolutionDescription: string;
  resolutionPhotos: string[];
  resolvedAt: string;
  resolvedBy: string;
  verificationVotesYes: number;
  verificationVotesNo: number;
  verificationThreshold: number;
  communityVerified: boolean;
  userHasVoted: boolean;
  userVoteType?: 'yes' | 'no';
  daysOpen: number;
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

export const CommunityVerificationScreen: React.FC<CommunityVerificationScreenProps> = ({
  navigation,
}) => {
  // State
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [grievances, setGrievances] = useState<VerificationGrievance[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  // Filters
  const [selectedCategory, setSelectedCategory] = useState<GrievanceCategory | undefined>();
  const [selectedDistrict, setSelectedDistrict] = useState<string | undefined>();
  const [showFilters, setShowFilters] = useState(false);
  
  // Verification modal
  const [selectedGrievance, setSelectedGrievance] = useState<VerificationGrievance | null>(null);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [verificationComment, setVerificationComment] = useState('');
  const [submittingVote, setSubmittingVote] = useState(false);
  
  // Photo viewer
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null);
  const [selectedPhotos, setSelectedPhotos] = useState<string[]>([]);

  useEffect(() => {
    loadVerificationGrievances();
  }, [selectedCategory, selectedDistrict]);

  const loadVerificationGrievances = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (selectedCategory) params.append('category', selectedCategory);
      if (selectedDistrict) params.append('district', selectedDistrict);

      const response = await fetch(
        `${API_BASE_URL}/api/infrastructure/grievances/verification-pending?${params.toString()}`
      );
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to load grievances');
      }

      setGrievances(data.data || []);
    } catch (err: any) {
      console.error('Error loading verification grievances:', err);
      setError(err.message || 'Failed to load grievances');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadVerificationGrievances();
  };

  const handleVerifyPress = (grievance: VerificationGrievance) => {
    if (grievance.userHasVoted) {
      Alert.alert(
        'Already Voted',
        `You have already voted "${grievance.userVoteType === 'yes' ? 'Fixed' : 'Not Fixed'}" for this grievance.`,
        [{ text: 'OK' }]
      );
      return;
    }

    setSelectedGrievance(grievance);
    setVerificationComment('');
    setShowVerificationModal(true);
  };

  const submitVerification = async (voteType: 'yes' | 'no') => {
    if (!selectedGrievance) return;

    try {
      setSubmittingVote(true);

      const response = await fetch(
        `${API_BASE_URL}/api/grievance-tracking/${selectedGrievance.grievanceId}/verify`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: 'current_user_id', // Replace with actual user ID from auth
            vote_type: voteType,
            comment: verificationComment || undefined,
          }),
        }
      );

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to submit verification');
      }

      Alert.alert(
        'Success',
        'Thank you for verifying the resolution!',
        [
          {
            text: 'OK',
            onPress: () => {
              setShowVerificationModal(false);
              setSelectedGrievance(null);
              loadVerificationGrievances(); // Reload list
            },
          },
        ]
      );
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to submit verification');
    } finally {
      setSubmittingVote(false);
    }
  };

  const handleViewDetails = (grievance: VerificationGrievance) => {
    navigation.navigate('GrievanceDetail', {
      grievanceId: grievance.grievanceId,
      ticketNumber: grievance.ticketNumber,
    });
  };

  const handleViewPhotos = (photos: string[], index: number = 0) => {
    setSelectedPhotos(photos);
    setSelectedPhotoIndex(index);
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
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const getVerificationProgress = (grievance: VerificationGrievance): number => {
    return Math.min(
      (grievance.verificationVotesYes / grievance.verificationThreshold) * 100,
      100
    );
  };

  const clearFilters = () => {
    setSelectedCategory(undefined);
    setSelectedDistrict(undefined);
  };

  const getActiveFilterCount = (): number => {
    let count = 0;
    if (selectedCategory) count++;
    if (selectedDistrict) count++;
    return count;
  };

  const renderGrievanceCard = ({ item }: { item: VerificationGrievance }) => {
    const progress = getVerificationProgress(item);
    const votesNeeded = Math.max(0, item.verificationThreshold - item.verificationVotesYes);

    return (
      <View style={styles.grievanceCard}>
        {/* Header */}
        <View style={styles.cardHeader}>
          <View style={styles.ticketContainer}>
            <Text style={styles.ticketLabel}>Ticket:</Text>
            <Text style={styles.ticketNumber}>{item.ticketNumber}</Text>
          </View>
          {item.communityVerified && (
            <View style={styles.verifiedBadge}>
              <Text style={styles.verifiedIcon}>✓</Text>
              <Text style={styles.verifiedText}>Verified</Text>
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

        {/* Location */}
        <View style={styles.locationRow}>
          <Text style={styles.locationIcon}>📍</Text>
          <Text style={styles.locationText} numberOfLines={1}>
            {item.address}
            {item.district && `, ${item.district}`}
          </Text>
        </View>

        {/* Resolution Info */}
        <View style={styles.resolutionInfo}>
          <Text style={styles.resolutionLabel}>Resolved:</Text>
          <Text style={styles.resolutionDate}>{formatDate(item.resolvedAt)}</Text>
          <Text style={styles.resolutionBy}>by {item.resolvedBy}</Text>
        </View>

        <Text style={styles.resolutionDescription} numberOfLines={2}>
          {item.resolutionDescription}
        </Text>

        {/* Before/After Photos */}
        {(item.photos.length > 0 || item.resolutionPhotos.length > 0) && (
          <View style={styles.photosSection}>
            {item.photos.length > 0 && (
              <View style={styles.photoGroup}>
                <Text style={styles.photoGroupLabel}>Before:</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {item.photos.slice(0, 3).map((photo, index) => (
                    <TouchableOpacity
                      key={index}
                      onPress={() => handleViewPhotos(item.photos, index)}
                      style={styles.photoThumbnail}
                    >
                      <Image source={{ uri: photo }} style={styles.photoImage} />
                    </TouchableOpacity>
                  ))}
                  {item.photos.length > 3 && (
                    <View style={styles.morePhotos}>
                      <Text style={styles.morePhotosText}>+{item.photos.length - 3}</Text>
                    </View>
                  )}
                </ScrollView>
              </View>
            )}

            {item.resolutionPhotos.length > 0 && (
              <View style={styles.photoGroup}>
                <Text style={styles.photoGroupLabel}>After:</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {item.resolutionPhotos.slice(0, 3).map((photo, index) => (
                    <TouchableOpacity
                      key={index}
                      onPress={() => handleViewPhotos(item.resolutionPhotos, index)}
                      style={styles.photoThumbnail}
                    >
                      <Image source={{ uri: photo }} style={styles.photoImage} />
                    </TouchableOpacity>
                  ))}
                  {item.resolutionPhotos.length > 3 && (
                    <View style={styles.morePhotos}>
                      <Text style={styles.morePhotosText}>+{item.resolutionPhotos.length - 3}</Text>
                    </View>
                  )}
                </ScrollView>
              </View>
            )}
          </View>
        )}

        {/* Verification Stats */}
        <View style={styles.verificationStats}>
          <View style={styles.voteCount}>
            <Text style={styles.voteIcon}>✅</Text>
            <Text style={styles.voteNumber}>{item.verificationVotesYes}</Text>
            <Text style={styles.voteLabel}>Fixed</Text>
          </View>

          <View style={styles.voteCount}>
            <Text style={styles.voteIcon}>❌</Text>
            <Text style={styles.voteNumber}>{item.verificationVotesNo}</Text>
            <Text style={styles.voteLabel}>Not Fixed</Text>
          </View>

          {!item.communityVerified && (
            <View style={styles.votesNeeded}>
              <Text style={styles.votesNeededText}>
                {votesNeeded} more {votesNeeded === 1 ? 'vote' : 'votes'} needed
              </Text>
            </View>
          )}
        </View>

        {/* Progress Bar */}
        {!item.communityVerified && (
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${progress}%` }]} />
            </View>
            <Text style={styles.progressText}>{Math.round(progress)}%</Text>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.cardActions}>
          <TouchableOpacity
            style={styles.detailsButton}
            onPress={() => handleViewDetails(item)}
          >
            <Text style={styles.detailsButtonText}>View Details</Text>
          </TouchableOpacity>

          {!item.userHasVoted && !item.communityVerified && (
            <TouchableOpacity
              style={styles.verifyButton}
              onPress={() => handleVerifyPress(item)}
            >
              <Text style={styles.verifyButtonText}>Verify</Text>
            </TouchableOpacity>
          )}

          {item.userHasVoted && (
            <View style={styles.votedBadge}>
              <Text style={styles.votedText}>
                You voted: {item.userVoteType === 'yes' ? '✅ Fixed' : '❌ Not Fixed'}
              </Text>
            </View>
          )}
        </View>
      </View>
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

  const renderVerificationModal = () => (
    <Modal
      visible={showVerificationModal}
      animationType="slide"
      transparent={true}
      onRequestClose={() => !submittingVote && setShowVerificationModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.verificationModalContent}>
          <Text style={styles.verificationModalTitle}>Verify Resolution</Text>
          
          {selectedGrievance && (
            <>
              <View style={styles.verificationGrievanceInfo}>
                <Text style={styles.verificationTicket}>
                  Ticket: {selectedGrievance.ticketNumber}
                </Text>
                <Text style={styles.verificationTitle} numberOfLines={2}>
                  {selectedGrievance.title}
                </Text>
              </View>

              <Text style={styles.verificationQuestion}>
                Has this issue been resolved to your satisfaction?
              </Text>

              {/* Comment Field */}
              <View style={styles.commentSection}>
                <Text style={styles.commentLabel}>
                  Add a comment (optional):
                </Text>
                <TextInput
                  style={styles.commentInput}
                  placeholder="Share your feedback about the resolution..."
                  value={verificationComment}
                  onChangeText={setVerificationComment}
                  multiline
                  numberOfLines={4}
                  maxLength={500}
                  placeholderTextColor="#999"
                  editable={!submittingVote}
                />
                <Text style={styles.commentCounter}>
                  {verificationComment.length}/500
                </Text>
              </View>

              {/* Vote Buttons */}
              <View style={styles.voteButtons}>
                <TouchableOpacity
                  style={[styles.voteButton, styles.voteButtonYes]}
                  onPress={() => submitVerification('yes')}
                  disabled={submittingVote}
                >
                  {submittingVote ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <>
                      <Text style={styles.voteButtonIcon}>✅</Text>
                      <Text style={styles.voteButtonText}>Yes, Fixed</Text>
                    </>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.voteButton, styles.voteButtonNo]}
                  onPress={() => submitVerification('no')}
                  disabled={submittingVote}
                >
                  {submittingVote ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <>
                      <Text style={styles.voteButtonIcon}>❌</Text>
                      <Text style={styles.voteButtonText}>Not Fixed</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowVerificationModal(false)}
                disabled={submittingVote}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </Modal>
  );

  const renderPhotoModal = () => (
    <Modal
      visible={selectedPhotoIndex !== null}
      transparent={true}
      onRequestClose={() => setSelectedPhotoIndex(null)}
    >
      <View style={styles.photoModal}>
        <TouchableOpacity
          style={styles.photoModalClose}
          onPress={() => setSelectedPhotoIndex(null)}
        >
          <Text style={styles.photoModalCloseText}>✕</Text>
        </TouchableOpacity>
        {selectedPhotoIndex !== null && selectedPhotos[selectedPhotoIndex] && (
          <>
            <Image
              source={{ uri: selectedPhotos[selectedPhotoIndex] }}
              style={styles.photoModalImage}
              resizeMode="contain"
            />
            <View style={styles.photoModalCounter}>
              <Text style={styles.photoModalCounterText}>
                {selectedPhotoIndex + 1} / {selectedPhotos.length}
              </Text>
            </View>
          </>
        )}
      </View>
    </Modal>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Loading grievances...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <OfflineIndicator />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Community Verification</Text>
        <Text style={styles.headerSubtitle}>
          Help verify resolved grievances in your community
        </Text>
      </View>

      {/* Filter Button */}
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowFilters(true)}
        >
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
        <ScrollView
          horizontal
          style={styles.activeFilters}
          showsHorizontalScrollIndicator={false}
        >
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
          {selectedDistrict && (
            <View style={styles.activeFilterChip}>
              <Text style={styles.activeFilterText}>{selectedDistrict}</Text>
              <TouchableOpacity onPress={() => setSelectedDistrict(undefined)}>
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
            onPress={() => loadVerificationGrievances()}
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
              colors={['#4CAF50']}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>✅</Text>
              <Text style={styles.emptyText}>No grievances to verify</Text>
              <Text style={styles.emptySubtext}>
                {getActiveFilterCount() > 0
                  ? 'Try adjusting your filters'
                  : 'All resolved grievances have been verified'}
              </Text>
            </View>
          }
        />
      )}

      {/* Modals */}
      {renderFilterModal()}
      {renderVerificationModal()}
      {renderPhotoModal()}
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
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  verifiedIcon: {
    fontSize: 14,
    color: '#4CAF50',
    marginRight: 4,
  },
  verifiedText: {
    fontSize: 12,
    color: '#4CAF50',
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
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  locationIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  locationText: {
    flex: 1,
    fontSize: 13,
    color: '#666',
  },
  resolutionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  resolutionLabel: {
    fontSize: 13,
    color: '#999',
    marginRight: 6,
  },
  resolutionDate: {
    fontSize: 13,
    color: '#4CAF50',
    fontWeight: '600',
    marginRight: 6,
  },
  resolutionBy: {
    fontSize: 13,
    color: '#666',
  },
  resolutionDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 12,
  },
  photosSection: {
    marginBottom: 12,
  },
  photoGroup: {
    marginBottom: 8,
  },
  photoGroupLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginBottom: 6,
  },
  photoThumbnail: {
    width: 80,
    height: 80,
    marginRight: 8,
    borderRadius: 8,
    overflow: 'hidden',
  },
  photoImage: {
    width: '100%',
    height: '100%',
  },
  morePhotos: {
    width: 80,
    height: 80,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  morePhotosText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#666',
  },
  verificationStats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 16,
  },
  voteCount: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  voteIcon: {
    fontSize: 16,
    marginRight: 4,
  },
  voteNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginRight: 4,
  },
  voteLabel: {
    fontSize: 13,
    color: '#666',
  },
  votesNeeded: {
    flex: 1,
    alignItems: 'flex-end',
  },
  votesNeededText: {
    fontSize: 12,
    color: '#FF9800',
    fontWeight: '600',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    overflow: 'hidden',
    marginRight: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
  },
  progressText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4CAF50',
    width: 40,
    textAlign: 'right',
  },
  cardActions: {
    flexDirection: 'row',
    gap: 8,
  },
  detailsButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#4CAF50',
    alignItems: 'center',
  },
  detailsButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4CAF50',
  },
  verifyButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#4CAF50',
    alignItems: 'center',
  },
  verifyButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  votedBadge: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
  },
  votedText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4CAF50',
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
    textAlign: 'center',
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
  verificationModalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
  },
  verificationModalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },
  verificationGrievanceInfo: {
    backgroundColor: '#F5F5F5',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  verificationTicket: {
    fontSize: 13,
    color: '#2196F3',
    fontWeight: '600',
    marginBottom: 4,
  },
  verificationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  verificationQuestion: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  commentSection: {
    marginBottom: 20,
  },
  commentLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  commentInput: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 12,
    fontSize: 15,
    color: '#333',
    minHeight: 100,
    textAlignVertical: 'top',
  },
  commentCounter: {
    fontSize: 12,
    color: '#999',
    textAlign: 'right',
    marginTop: 4,
  },
  voteButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  voteButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  voteButtonYes: {
    backgroundColor: '#4CAF50',
  },
  voteButtonNo: {
    backgroundColor: '#F44336',
  },
  voteButtonIcon: {
    fontSize: 20,
  },
  voteButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  cancelButton: {
    padding: 16,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#666',
  },
  photoModal: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoModalClose: {
    position: 'absolute',
    top: 40,
    right: 20,
    zIndex: 10,
    padding: 10,
  },
  photoModalCloseText: {
    fontSize: 32,
    color: '#fff',
    fontWeight: 'bold',
  },
  photoModalImage: {
    width: '100%',
    height: '80%',
  },
  photoModalCounter: {
    position: 'absolute',
    bottom: 40,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  photoModalCounterText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default CommunityVerificationScreen;
