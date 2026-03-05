/**
 * Grievance Detail Screen
 * Task 36.3: Implement grievance detail view with timeline
 * 
 * Features:
 * - Display full grievance details (ticket, title, description, category, status)
 * - Photo gallery with zoom capability
 * - Location map with address details
 * - Timeline view showing all status changes and updates
 * - Assigned authority and contact information
 * - SLA deadline with overdue indicator
 * - Days open counter
 * - Severity level with visual indicator
 * - Reporter information (if not anonymous)
 * - Community verification votes/status
 * - Resolution details if resolved
 * - Action buttons (verify resolution, add comment, share)
 * - Offline viewing support
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Image,
  Modal,
  Dimensions,
  Alert,
  Share,
  Linking,
} from 'react-native';
import { OfflineIndicator } from '../../components/OfflineIndicator';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface GrievanceDetailScreenProps {
  navigation: any;
  route: {
    params: {
      grievanceId: string;
      ticketNumber?: string;
    };
  };
}

export const GrievanceDetailScreen: React.FC<GrievanceDetailScreenProps> = ({
  navigation,
  route,
}) => {
  const { grievanceId, ticketNumber } = route.params;

  // State
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [grievance, setGrievance] = useState<any>(null);
  const [timeline, setTimeline] = useState<any[]>([]);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'timeline' | 'verification'>('details');

  useEffect(() => {
    loadGrievanceDetails();
  }, [grievanceId]);

  const loadGrievanceDetails = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load grievance details
      const detailsResponse = await fetch(
        `${API_BASE_URL}/api/infrastructure/grievances/${grievanceId}`
      );
      const detailsData = await detailsResponse.json();
      
      if (!detailsData.success) {
        throw new Error(detailsData.error || 'Failed to load grievance');
      }

      setGrievance(detailsData.data);

      // Load timeline
      const timelineResponse = await fetch(
        `${API_BASE_URL}/api/grievance-tracking/${grievanceId}/timeline`
      );
      const timelineData = await timelineResponse.json();
      
      if (timelineData.success) {
        setTimeline(timelineData.data);
      }
    } catch (err: any) {
      console.error('Error loading grievance details:', err);
      setError(err.message || 'Failed to load grievance details');
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    if (!grievance) return;

    try {
      await Share.share({
        message: `Grievance #${grievance.ticket_number}\n\n${grievance.title}\n\nStatus: ${grievance.status}\nCategory: ${grievance.category}\n\nTrack at: [App Link]`,
        title: `Grievance #${grievance.ticket_number}`,
      });
    } catch (err) {
      console.error('Error sharing:', err);
    }
  };

  const handleCallAuthority = () => {
    if (!grievance?.assigned_authority_contact) {
      Alert.alert('No Contact', 'No contact information available for the assigned authority.');
      return;
    }

    Alert.alert(
      'Call Authority',
      `Call ${grievance.assigned_authority}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Call',
          onPress: () => Linking.openURL(`tel:${grievance.assigned_authority_contact}`),
        },
      ]
    );
  };

  const handleVerifyResolution = () => {
    setShowVerificationModal(true);
  };

  const submitVerification = async (isFixed: boolean, comment?: string) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/grievance-tracking/${grievanceId}/verify`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: 'current_user_id', // Replace with actual user ID
            vote_type: isFixed ? 'yes' : 'no',
            comment,
          }),
        }
      );

      const data = await response.json();

      if (data.success) {
        Alert.alert('Success', 'Thank you for verifying the resolution!');
        setShowVerificationModal(false);
        loadGrievanceDetails(); // Reload to get updated verification status
      } else {
        throw new Error(data.error);
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to submit verification');
    }
  };

  const getStatusColor = (status: string): string => {
    const colors: Record<string, string> = {
      submitted: '#2196F3',
      acknowledged: '#9C27B0',
      in_progress: '#FF9800',
      resolved: '#4CAF50',
      closed: '#607D8B',
      rejected: '#F44336',
    };
    return colors[status] || '#666';
  };

  const getSeverityColor = (severity: string): string => {
    const colors: Record<string, string> = {
      low: '#4CAF50',
      medium: '#FF9800',
      high: '#F44336',
      critical: '#9C27B0',
    };
    return colors[severity] || '#666';
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatTimeAgo = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return formatDate(dateString);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Loading grievance details...</Text>
      </View>
    );
  }

  if (error || !grievance) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorIcon}>⚠️</Text>
        <Text style={styles.errorTitle}>Failed to Load</Text>
        <Text style={styles.errorText}>{error || 'Grievance not found'}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadGrievanceDetails}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <OfflineIndicator />

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header Card */}
        <View style={styles.headerCard}>
          <View style={styles.ticketRow}>
            <View style={styles.ticketContainer}>
              <Text style={styles.ticketLabel}>Ticket:</Text>
              <Text style={styles.ticketNumber}>{grievance.ticket_number}</Text>
            </View>
            <TouchableOpacity onPress={handleShare} style={styles.shareButton}>
              <Text style={styles.shareIcon}>📤</Text>
            </TouchableOpacity>
          </View>

          {grievance.is_overdue && (
            <View style={styles.overdueBanner}>
              <Text style={styles.overdueIcon}>⚠️</Text>
              <Text style={styles.overdueText}>
                Overdue by {Math.floor((new Date().getTime() - new Date(grievance.sla_deadline).getTime()) / (1000 * 60 * 60 * 24))} days
              </Text>
            </View>
          )}

          <Text style={styles.title}>{grievance.title}</Text>

          {/* Status and Severity Badges */}
          <View style={styles.badgeRow}>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: getStatusColor(grievance.status) + '20' },
              ]}
            >
              <Text
                style={[
                  styles.statusText,
                  { color: getStatusColor(grievance.status) },
                ]}
              >
                {grievance.status.replace('_', ' ').toUpperCase()}
              </Text>
            </View>

            <View
              style={[
                styles.severityBadge,
                { backgroundColor: getSeverityColor(grievance.ai_severity) + '20' },
              ]}
            >
              <Text
                style={[
                  styles.severityText,
                  { color: getSeverityColor(grievance.ai_severity) },
                ]}
              >
                {grievance.ai_severity?.toUpperCase() || 'MEDIUM'}
              </Text>
            </View>

            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>{grievance.category}</Text>
            </View>
          </View>

          {/* Days Open */}
          <View style={styles.daysOpenContainer}>
            <Text style={styles.daysOpenIcon}>⏱️</Text>
            <Text style={styles.daysOpenText}>
              {grievance.days_open || 0} days open
            </Text>
            {grievance.sla_deadline && (
              <Text style={styles.slaText}>
                • SLA: {formatDate(grievance.sla_deadline)}
              </Text>
            )}
          </View>
        </View>

        {/* Tabs */}
        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'details' && styles.tabActive]}
            onPress={() => setActiveTab('details')}
          >
            <Text style={[styles.tabText, activeTab === 'details' && styles.tabTextActive]}>
              Details
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'timeline' && styles.tabActive]}
            onPress={() => setActiveTab('timeline')}
          >
            <Text style={[styles.tabText, activeTab === 'timeline' && styles.tabTextActive]}>
              Timeline
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'verification' && styles.tabActive]}
            onPress={() => setActiveTab('verification')}
          >
            <Text style={[styles.tabText, activeTab === 'verification' && styles.tabTextActive]}>
              Verification
            </Text>
          </TouchableOpacity>
        </View>

        {/* Tab Content */}
        {activeTab === 'details' && (
          <View style={styles.tabContent}>
            {/* Description */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Description</Text>
              <Text style={styles.description}>{grievance.description}</Text>
            </View>

            {/* Photo Gallery */}
            {grievance.photos && grievance.photos.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Photos ({grievance.photos.length})</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photoGallery}>
                  {grievance.photos.map((photo: string, index: number) => (
                    <TouchableOpacity
                      key={index}
                      onPress={() => setSelectedPhotoIndex(index)}
                      style={styles.photoThumbnail}
                    >
                      <Image source={{ uri: photo }} style={styles.photoImage} />
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* Location */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Location</Text>
              <View style={styles.locationCard}>
                <Text style={styles.locationIcon}>📍</Text>
                <View style={styles.locationDetails}>
                  <Text style={styles.locationAddress}>{grievance.address || 'Address not specified'}</Text>
                  {grievance.landmark && (
                    <Text style={styles.locationLandmark}>Near: {grievance.landmark}</Text>
                  )}
                  {grievance.district && grievance.state && (
                    <Text style={styles.locationArea}>
                      {grievance.district}, {grievance.state}
                      {grievance.pincode && ` - ${grievance.pincode}`}
                    </Text>
                  )}
                  {grievance.latitude && grievance.longitude && (
                    <Text style={styles.locationCoords}>
                      {grievance.latitude.toFixed(6)}, {grievance.longitude.toFixed(6)}
                    </Text>
                  )}
                </View>
              </View>
            </View>

            {/* Assigned Authority */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Assigned Authority</Text>
              <View style={styles.authorityCard}>
                <View style={styles.authorityInfo}>
                  <Text style={styles.authorityName}>{grievance.assigned_authority || 'Not assigned yet'}</Text>
                  {grievance.assigned_authority_contact && (
                    <Text style={styles.authorityContact}>
                      📞 {grievance.assigned_authority_contact}
                    </Text>
                  )}
                </View>
                {grievance.assigned_authority_contact && (
                  <TouchableOpacity style={styles.callButton} onPress={handleCallAuthority}>
                    <Text style={styles.callButtonText}>Call</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* Reporter Information */}
            {!grievance.is_anonymous && grievance.reported_by && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Reported By</Text>
                <View style={styles.reporterCard}>
                  <Text style={styles.reporterName}>{grievance.reported_by}</Text>
                  {grievance.reporter_contact && (
                    <Text style={styles.reporterContact}>📞 {grievance.reporter_contact}</Text>
                  )}
                  <Text style={styles.reportedDate}>Reported on {formatDate(grievance.created_at)}</Text>
                </View>
              </View>
            )}

            {grievance.is_anonymous && (
              <View style={styles.section}>
                <View style={styles.anonymousCard}>
                  <Text style={styles.anonymousIcon}>🔒</Text>
                  <Text style={styles.anonymousText}>Anonymous Report</Text>
                </View>
              </View>
            )}

            {/* Resolution Details */}
            {grievance.status === 'resolved' && grievance.resolution_description && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Resolution</Text>
                <View style={styles.resolutionCard}>
                  <Text style={styles.resolutionText}>{grievance.resolution_description}</Text>
                  {grievance.resolved_by && (
                    <Text style={styles.resolvedBy}>Resolved by: {grievance.resolved_by}</Text>
                  )}
                  {grievance.resolved_at && (
                    <Text style={styles.resolvedDate}>Resolved on: {formatDate(grievance.resolved_at)}</Text>
                  )}
                  {grievance.resolution_photos && grievance.resolution_photos.length > 0 && (
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.resolutionPhotos}>
                      {grievance.resolution_photos.map((photo: string, index: number) => (
                        <Image key={index} source={{ uri: photo }} style={styles.resolutionPhoto} />
                      ))}
                    </ScrollView>
                  )}
                </View>
              </View>
            )}
          </View>
        )}

        {activeTab === 'timeline' && (
          <View style={styles.tabContent}>
            {timeline.length === 0 ? (
              <View style={styles.emptyTimeline}>
                <Text style={styles.emptyTimelineIcon}>📋</Text>
                <Text style={styles.emptyTimelineText}>No timeline updates yet</Text>
              </View>
            ) : (
              <View style={styles.timelineContainer}>
                {timeline.map((entry, index) => (
                  <View key={entry.update_id} style={styles.timelineEntry}>
                    <View style={styles.timelineDot}>
                      <View style={[
                        styles.timelineDotInner,
                        entry.update_type === 'status_change' && styles.timelineDotStatus,
                        entry.update_type === 'resolution' && styles.timelineDotResolution,
                        entry.update_type === 'escalation' && styles.timelineDotEscalation,
                      ]} />
                    </View>
                    {index < timeline.length - 1 && <View style={styles.timelineLine} />}
                    
                    <View style={styles.timelineContent}>
                      <View style={styles.timelineHeader}>
                        <Text style={styles.timelineType}>
                          {entry.update_type.replace('_', ' ').toUpperCase()}
                        </Text>
                        <Text style={styles.timelineTime}>{formatTimeAgo(entry.created_at)}</Text>
                      </View>
                      
                      <Text style={styles.timelineText}>{entry.update_text}</Text>
                      
                      {entry.updated_by && (
                        <Text style={styles.timelineUpdatedBy}>
                          By: {entry.updated_by} ({entry.updated_by_role})
                        </Text>
                      )}
                      
                      {entry.photos && entry.photos.length > 0 && (
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.timelinePhotos}>
                          {entry.photos.map((photo: string, photoIndex: number) => (
                            <Image key={photoIndex} source={{ uri: photo }} style={styles.timelinePhoto} />
                          ))}
                        </ScrollView>
                      )}
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        {activeTab === 'verification' && (
          <View style={styles.tabContent}>
            {/* Verification Status */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Community Verification</Text>
              <View style={styles.verificationCard}>
                <View style={styles.verificationStats}>
                  <View style={styles.verificationStat}>
                    <Text style={styles.verificationStatNumber}>
                      {grievance.verification_votes_yes || 0}
                    </Text>
                    <Text style={styles.verificationStatLabel}>✅ Fixed</Text>
                  </View>
                  <View style={styles.verificationStat}>
                    <Text style={styles.verificationStatNumber}>
                      {grievance.verification_votes_no || 0}
                    </Text>
                    <Text style={styles.verificationStatLabel}>❌ Not Fixed</Text>
                  </View>
                </View>
                
                {grievance.community_verified && (
                  <View style={styles.verifiedBadge}>
                    <Text style={styles.verifiedIcon}>✓</Text>
                    <Text style={styles.verifiedText}>Community Verified</Text>
                  </View>
                )}
                
                {!grievance.community_verified && grievance.verification_threshold && (
                  <Text style={styles.verificationThreshold}>
                    {grievance.verification_threshold - (grievance.verification_votes_yes || 0)} more votes needed for verification
                  </Text>
                )}
              </View>
            </View>

            {/* User Feedback */}
            {grievance.user_rating && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>User Feedback</Text>
                <View style={styles.feedbackCard}>
                  <View style={styles.ratingRow}>
                    <Text style={styles.ratingStars}>
                      {'⭐'.repeat(grievance.user_rating)}
                    </Text>
                    <Text style={styles.ratingText}>{grievance.user_rating}/5</Text>
                  </View>
                  {grievance.user_feedback && (
                    <Text style={styles.feedbackText}>{grievance.user_feedback}</Text>
                  )}
                  {grievance.feedback_at && (
                    <Text style={styles.feedbackDate}>
                      Submitted on {formatDate(grievance.feedback_at)}
                    </Text>
                  )}
                </View>
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* Action Buttons */}
      {grievance.status === 'resolved' && !grievance.user_rating && (
        <View style={styles.actionBar}>
          <TouchableOpacity
            style={styles.verifyButton}
            onPress={handleVerifyResolution}
          >
            <Text style={styles.verifyButtonText}>Verify Resolution</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Photo Zoom Modal */}
      {selectedPhotoIndex !== null && grievance.photos && (
        <Modal
          visible={true}
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
            <Image
              source={{ uri: grievance.photos[selectedPhotoIndex] }}
              style={styles.photoModalImage}
              resizeMode="contain"
            />
            <View style={styles.photoModalCounter}>
              <Text style={styles.photoModalCounterText}>
                {selectedPhotoIndex + 1} / {grievance.photos.length}
              </Text>
            </View>
          </View>
        </Modal>
      )}

      {/* Verification Modal */}
      {showVerificationModal && (
        <Modal
          visible={true}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowVerificationModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Verify Resolution</Text>
              <Text style={styles.modalSubtitle}>
                Has this issue been resolved to your satisfaction?
              </Text>
              
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalButtonYes]}
                  onPress={() => submitVerification(true)}
                >
                  <Text style={styles.modalButtonText}>✅ Yes, Fixed</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalButtonNo]}
                  onPress={() => submitVerification(false)}
                >
                  <Text style={styles.modalButtonText}>❌ Not Fixed</Text>
                </TouchableOpacity>
              </View>
              
              <TouchableOpacity
                style={styles.modalCancel}
                onPress={() => setShowVerificationModal(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
};

// Add API_BASE_URL constant (should be imported from config)
const API_BASE_URL = 'http://localhost:3000'; // Replace with actual API URL

export default GrievanceDetailScreen;

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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#F5F5F5',
  },
  errorIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  headerCard: {
    backgroundColor: '#fff',
    padding: 20,
    marginBottom: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  ticketRow: {
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
    fontSize: 14,
    color: '#999',
    marginRight: 6,
  },
  ticketNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  shareButton: {
    padding: 8,
  },
  shareIcon: {
    fontSize: 24,
  },
  overdueBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFEBEE',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  overdueIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  overdueText: {
    fontSize: 14,
    color: '#F44336',
    fontWeight: '600',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
    lineHeight: 30,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
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
  severityBadge: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  severityText: {
    fontSize: 12,
    fontWeight: '600',
  },
  categoryBadge: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: '#E3F2FD',
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2196F3',
  },
  daysOpenContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  daysOpenIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  daysOpenText: {
    fontSize: 14,
    color: '#666',
  },
  slaText: {
    fontSize: 12,
    color: '#999',
    marginLeft: 8,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: '#4CAF50',
  },
  tabText: {
    fontSize: 15,
    color: '#666',
    fontWeight: '500',
  },
  tabTextActive: {
    color: '#4CAF50',
    fontWeight: '600',
  },
  tabContent: {
    backgroundColor: '#F5F5F5',
    paddingBottom: 20,
  },
  section: {
    backgroundColor: '#fff',
    padding: 20,
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  description: {
    fontSize: 15,
    color: '#666',
    lineHeight: 22,
  },
  photoGallery: {
    marginTop: 8,
  },
  photoThumbnail: {
    width: 120,
    height: 120,
    marginRight: 12,
    borderRadius: 8,
    overflow: 'hidden',
  },
  photoImage: {
    width: '100%',
    height: '100%',
  },
  locationCard: {
    flexDirection: 'row',
    backgroundColor: '#F9F9F9',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  locationIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  locationDetails: {
    flex: 1,
  },
  locationAddress: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  locationLandmark: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  locationArea: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  locationCoords: {
    fontSize: 12,
    color: '#999',
    fontFamily: 'monospace',
  },
  authorityCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F9F9F9',
    padding: 16,
    borderRadius: 12,
  },
  authorityInfo: {
    flex: 1,
  },
  authorityName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  authorityContact: {
    fontSize: 14,
    color: '#666',
  },
  callButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  callButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  reporterCard: {
    backgroundColor: '#F9F9F9',
    padding: 16,
    borderRadius: 12,
  },
  reporterName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  reporterContact: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  reportedDate: {
    fontSize: 12,
    color: '#999',
  },
  anonymousCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9F9F9',
    padding: 16,
    borderRadius: 12,
  },
  anonymousIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  anonymousText: {
    fontSize: 15,
    color: '#666',
    fontStyle: 'italic',
  },
  resolutionCard: {
    backgroundColor: '#E8F5E9',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  resolutionText: {
    fontSize: 15,
    color: '#333',
    lineHeight: 22,
    marginBottom: 12,
  },
  resolvedBy: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  resolvedDate: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  resolutionPhotos: {
    marginTop: 8,
  },
  resolutionPhoto: {
    width: 100,
    height: 100,
    borderRadius: 8,
    marginRight: 8,
  },
  timelineContainer: {
    padding: 20,
  },
  timelineEntry: {
    position: 'relative',
    paddingLeft: 40,
    marginBottom: 24,
  },
  timelineDot: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  timelineDotInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#2196F3',
  },
  timelineDotStatus: {
    backgroundColor: '#FF9800',
  },
  timelineDotResolution: {
    backgroundColor: '#4CAF50',
  },
  timelineDotEscalation: {
    backgroundColor: '#F44336',
  },
  timelineLine: {
    position: 'absolute',
    left: 11,
    top: 24,
    bottom: -24,
    width: 2,
    backgroundColor: '#E0E0E0',
  },
  timelineContent: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  timelineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  timelineType: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4CAF50',
  },
  timelineTime: {
    fontSize: 12,
    color: '#999',
  },
  timelineText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
    marginBottom: 8,
  },
  timelineUpdatedBy: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  timelinePhotos: {
    marginTop: 8,
  },
  timelinePhoto: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 8,
  },
  emptyTimeline: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTimelineIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTimelineText: {
    fontSize: 16,
    color: '#666',
  },
  verificationCard: {
    backgroundColor: '#F9F9F9',
    padding: 16,
    borderRadius: 12,
  },
  verificationStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  verificationStat: {
    alignItems: 'center',
  },
  verificationStatNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  verificationStatLabel: {
    fontSize: 14,
    color: '#666',
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4CAF50',
    padding: 12,
    borderRadius: 8,
  },
  verifiedIcon: {
    fontSize: 20,
    color: '#fff',
    marginRight: 8,
  },
  verifiedText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  verificationThreshold: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  feedbackCard: {
    backgroundColor: '#FFF3E0',
    padding: 16,
    borderRadius: 12,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  ratingStars: {
    fontSize: 24,
    marginRight: 8,
  },
  ratingText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FF9800',
  },
  feedbackText: {
    fontSize: 15,
    color: '#333',
    lineHeight: 22,
    marginBottom: 8,
  },
  feedbackDate: {
    fontSize: 12,
    color: '#999',
  },
  actionBar: {
    backgroundColor: '#fff',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  verifyButton: {
    backgroundColor: '#4CAF50',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  verifyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  photoModal: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
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
    width: SCREEN_WIDTH,
    height: '80%',
  },
  photoModalCounter: {
    position: 'absolute',
    bottom: 40,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  photoModalCounterText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 15,
    color: '#666',
    marginBottom: 24,
    textAlign: 'center',
  },
  modalButtons: {
    gap: 12,
    marginBottom: 16,
  },
  modalButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalButtonYes: {
    backgroundColor: '#4CAF50',
  },
  modalButtonNo: {
    backgroundColor: '#F44336',
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  modalCancel: {
    padding: 12,
    alignItems: 'center',
  },
  modalCancelText: {
    color: '#666',
    fontSize: 15,
  },
});

export default GrievanceDetailScreen;
