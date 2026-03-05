/**
 * Grievance Tracking Screen
 * 
 * Features:
 * - Real-time status display
 * - Timeline with status change history
 * - Overdue indicator
 * - Resolution details
 * - Community verification voting
 * - Feedback rating submission
 * - Days open counter
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  RefreshControl,
  TextInput,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

// ============================================================================
// TYPES
// ============================================================================

type GrievanceStatus = 
  | 'submitted' 
  | 'acknowledged' 
  | 'in_progress' 
  | 'resolved' 
  | 'closed' 
  | 'rejected';

interface TimelineEntry {
  update_id: string;
  update_type: 'status_change' | 'assignment' | 'comment' | 'resolution' | 'escalation';
  update_text: string;
  photos?: string[];
  documents?: string[];
  updated_by?: string;
  updated_by_role?: 'citizen' | 'officer' | 'admin' | 'system';
  is_public: boolean;
  created_at: string;
}

interface GrievanceDetails {
  grievance_id: string;
  ticket_number: string;
  title: string;
  description: string;
  category: string;
  status: GrievanceStatus;
  ai_severity: string;
  created_at: string;
  is_overdue: boolean;
  days_open: number;
  sla_deadline: string;
  resolution_description?: string;
  resolution_photos?: string[];
  resolved_at?: string;
  user_rating?: number;
  user_feedback?: string;
  community_verified: boolean;
  verification_votes_yes: number;
  verification_votes_no: number;
  verification_threshold: number;
}

// ============================================================================
// COMPONENT
// ============================================================================

const GrievanceTrackingScreen: React.FC = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const params = route.params as { grievanceId?: string; ticketNumber?: string } | undefined;
  const grievanceId = params?.grievanceId || params?.ticketNumber;

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [grievance, setGrievance] = useState<GrievanceDetails | null>(null);
  const [timeline, setTimeline] = useState<TimelineEntry[]>([]);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [rating, setRating] = useState(0);
  const [feedbackText, setFeedbackText] = useState('');

  useEffect(() => {
    if (!grievanceId) {
      // Don't show error alert, just set loading to false
      setLoading(false);
      return;
    }
    loadGrievanceData();
  }, [grievanceId]);

  const loadGrievanceData = async () => {
    if (!grievanceId) return;
    
    try {
      setLoading(true);

      // Mock data in development mode
      if (__DEV__) {
        console.log('DEV MODE: Mock grievance details');
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Mock grievance data
        const mockGrievance: GrievanceDetails = {
          grievance_id: grievanceId,
          ticket_number: grievanceId.startsWith('GRV') ? grievanceId : `GRV${grievanceId.slice(-8)}`,
          title: 'Sample Grievance',
          description: 'This is a sample grievance for testing',
          category: 'road',
          status: 'in_progress',
          ai_severity: 'medium',
          created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          is_overdue: false,
          days_open: 3,
          sla_deadline: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(),
          community_verified: false,
          verification_votes_yes: 5,
          verification_votes_no: 1,
          verification_threshold: 10,
        };
        
        const mockTimeline: TimelineEntry[] = [
          {
            update_id: '1',
            update_type: 'status_change',
            update_text: 'Grievance submitted',
            is_public: true,
            created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          },
          {
            update_id: '2',
            update_type: 'status_change',
            update_text: 'Grievance acknowledged by authorities',
            is_public: true,
            created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          },
          {
            update_id: '3',
            update_type: 'status_change',
            update_text: 'Work in progress',
            is_public: true,
            created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          },
        ];
        
        setGrievance(mockGrievance);
        setTimeline(mockTimeline);
        setLoading(false);
        setRefreshing(false);
        return;
      }

      // Production API calls (commented out for now)
      /*
      // Fetch grievance details
      const grievanceResponse = await fetch(
        `${API_BASE_URL}/api/grievances/${grievanceId}`
      );
      const grievanceData = await grievanceResponse.json();

      // Fetch timeline
      const timelineResponse = await fetch(
        `${API_BASE_URL}/api/grievance-tracking/${grievanceId}/timeline`
      );
      const timelineData = await timelineResponse.json();

      // Fetch overdue status
      const overdueResponse = await fetch(
        `${API_BASE_URL}/api/grievance-tracking/${grievanceId}/overdue`
      );
      const overdueData = await overdueResponse.json();

      setGrievance({
        ...grievanceData.data,
        is_overdue: overdueData.data.is_overdue,
        days_open: overdueData.data.days_open,
      });
      setTimeline(timelineData.data);
      */
    } catch (error) {
      console.error('Error loading grievance:', error);
      setGrievance(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadGrievanceData();
  };

  const handleVerificationVote = async (voteType: 'yes' | 'no') => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/grievance-tracking/${grievanceId}/verify`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: 'current_user_id', // Replace with actual user ID
            vote_type: voteType,
          }),
        }
      );

      if (response.ok) {
        Alert.alert('Success', 'Your verification vote has been recorded');
        loadGrievanceData();
      } else {
        Alert.alert('Error', 'Failed to submit verification vote');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to submit verification vote');
      console.error(error);
    }
  };

  const handleSubmitFeedback = async () => {
    if (rating === 0) {
      Alert.alert('Error', 'Please select a rating');
      return;
    }

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/grievance-tracking/${grievanceId}/feedback`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: 'current_user_id', // Replace with actual user ID
            rating,
            feedback_text: feedbackText,
          }),
        }
      );

      if (response.ok) {
        Alert.alert('Success', 'Thank you for your feedback!');
        setShowFeedbackModal(false);
        loadGrievanceData();
      } else {
        Alert.alert('Error', 'Failed to submit feedback');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to submit feedback');
      console.error(error);
    }
  };

  const getStatusColor = (status: GrievanceStatus): string => {
    const colors: Record<GrievanceStatus, string> = {
      submitted: '#FFA500',
      acknowledged: '#4169E1',
      in_progress: '#1E90FF',
      resolved: '#32CD32',
      closed: '#808080',
      rejected: '#DC143C',
    };
    return colors[status] || '#808080';
  };

  const getStatusIcon = (status: GrievanceStatus): string => {
    const icons: Record<GrievanceStatus, string> = {
      submitted: 'file-document',
      acknowledged: 'check-circle',
      in_progress: 'progress-clock',
      resolved: 'check-all',
      closed: 'lock',
      rejected: 'close-circle',
    };
    return icons[status] || 'help-circle';
  };

  const getSeverityColor = (severity: string): string => {
    const colors: Record<string, string> = {
      low: '#90EE90',
      medium: '#FFD700',
      high: '#FF8C00',
      critical: '#DC143C',
    };
    return colors[severity] || '#808080';
  };

  const getTimelineIcon = (type: string): string => {
    const icons: Record<string, string> = {
      status_change: 'swap-horizontal',
      assignment: 'account-arrow-right',
      comment: 'comment-text',
      resolution: 'check-circle',
      escalation: 'arrow-up-bold',
    };
    return icons[type] || 'information';
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

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Loading grievance details...</Text>
      </View>
    );
  }

  if (!grievance && !loading) {
    return (
      <View style={styles.emptyContainer}>
        <Icon name="file-document-outline" size={80} color="#ccc" />
        <Text style={styles.emptyTitle}>No Grievance Selected</Text>
        <Text style={styles.emptyText}>
          Select a grievance from your list to view its details and track its progress.
        </Text>
        <TouchableOpacity
          style={styles.emptyButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.emptyButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header Card */}
      <View style={styles.headerCard}>
        <View style={styles.ticketRow}>
          <Text style={styles.ticketNumber}>{grievance.ticket_number}</Text>
          {grievance.is_overdue && (
            <View style={styles.overdueBadge}>
              <Icon name="clock-alert" size={16} color="#FFF" />
              <Text style={styles.overdueText}>OVERDUE</Text>
            </View>
          )}
        </View>

        <Text style={styles.title}>{grievance.title}</Text>
        <Text style={styles.description}>{grievance.description}</Text>

        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Icon name="tag" size={16} color="#666" />
            <Text style={styles.metaText}>{grievance.category}</Text>
          </View>
          <View
            style={[
              styles.severityBadge,
              { backgroundColor: getSeverityColor(grievance.ai_severity) },
            ]}
          >
            <Text style={styles.severityText}>{grievance.ai_severity}</Text>
          </View>
        </View>

        <View style={styles.daysOpenRow}>
          <Icon name="calendar-clock" size={20} color="#666" />
          <Text style={styles.daysOpenText}>
            Open for {grievance.days_open} days
          </Text>
        </View>
      </View>

      {/* Status Card */}
      <View style={styles.statusCard}>
        <Text style={styles.sectionTitle}>Current Status</Text>
        <View style={styles.statusRow}>
          <Icon
            name={getStatusIcon(grievance.status)}
            size={32}
            color={getStatusColor(grievance.status)}
          />
          <View style={styles.statusInfo}>
            <Text
              style={[
                styles.statusText,
                { color: getStatusColor(grievance.status) },
              ]}
            >
              {grievance.status.toUpperCase().replace('_', ' ')}
            </Text>
            <Text style={styles.statusSubtext}>
              Last updated: {formatDate(grievance.created_at)}
            </Text>
          </View>
        </View>
      </View>

      {/* Resolution Card (if resolved) */}
      {grievance.status === 'resolved' && grievance.resolution_description && (
        <View style={styles.resolutionCard}>
          <Text style={styles.sectionTitle}>Resolution Details</Text>
          <Text style={styles.resolutionText}>
            {grievance.resolution_description}
          </Text>
          {grievance.resolution_photos && grievance.resolution_photos.length > 0 && (
            <ScrollView horizontal style={styles.photoScroll}>
              {grievance.resolution_photos.map((photo, index) => (
                <Image
                  key={index}
                  source={{ uri: photo }}
                  style={styles.resolutionPhoto}
                />
              ))}
            </ScrollView>
          )}
          <Text style={styles.resolvedDate}>
            Resolved on: {formatDate(grievance.resolved_at!)}
          </Text>

          {/* Community Verification */}
          <View style={styles.verificationSection}>
            <Text style={styles.verificationTitle}>Community Verification</Text>
            <View style={styles.verificationStats}>
              <View style={styles.verificationStat}>
                <Icon name="thumb-up" size={20} color="#4CAF50" />
                <Text style={styles.verificationCount}>
                  {grievance.verification_votes_yes}
                </Text>
              </View>
              <View style={styles.verificationStat}>
                <Icon name="thumb-down" size={20} color="#DC143C" />
                <Text style={styles.verificationCount}>
                  {grievance.verification_votes_no}
                </Text>
              </View>
              {grievance.community_verified && (
                <View style={styles.verifiedBadge}>
                  <Icon name="check-decagram" size={20} color="#4CAF50" />
                  <Text style={styles.verifiedText}>VERIFIED</Text>
                </View>
              )}
            </View>

            {!grievance.community_verified && (
              <View style={styles.verificationButtons}>
                <TouchableOpacity
                  style={[styles.verifyButton, styles.verifyYes]}
                  onPress={() => handleVerificationVote('yes')}
                >
                  <Icon name="thumb-up" size={20} color="#FFF" />
                  <Text style={styles.verifyButtonText}>Fixed</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.verifyButton, styles.verifyNo]}
                  onPress={() => handleVerificationVote('no')}
                >
                  <Icon name="thumb-down" size={20} color="#FFF" />
                  <Text style={styles.verifyButtonText}>Not Fixed</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Feedback Section */}
          {!grievance.user_rating && (
            <TouchableOpacity
              style={styles.feedbackButton}
              onPress={() => setShowFeedbackModal(true)}
            >
              <Icon name="star" size={20} color="#FFF" />
              <Text style={styles.feedbackButtonText}>Rate Resolution</Text>
            </TouchableOpacity>
          )}

          {grievance.user_rating && (
            <View style={styles.feedbackDisplay}>
              <Text style={styles.feedbackTitle}>Your Feedback</Text>
              <View style={styles.ratingDisplay}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <Icon
                    key={star}
                    name="star"
                    size={24}
                    color={star <= grievance.user_rating! ? '#FFD700' : '#DDD'}
                  />
                ))}
              </View>
              {grievance.user_feedback && (
                <Text style={styles.feedbackTextDisplay}>
                  {grievance.user_feedback}
                </Text>
              )}
            </View>
          )}
        </View>
      )}

      {/* Timeline Card */}
      <View style={styles.timelineCard}>
        <Text style={styles.sectionTitle}>Timeline</Text>
        {timeline.map((entry, index) => (
          <View key={entry.update_id} style={styles.timelineEntry}>
            <View style={styles.timelineIconContainer}>
              <Icon
                name={getTimelineIcon(entry.update_type)}
                size={24}
                color="#4CAF50"
              />
              {index < timeline.length - 1 && <View style={styles.timelineLine} />}
            </View>
            <View style={styles.timelineContent}>
              <Text style={styles.timelineText}>{entry.update_text}</Text>
              <Text style={styles.timelineDate}>{formatDate(entry.created_at)}</Text>
              {entry.updated_by && (
                <Text style={styles.timelineAuthor}>
                  by {entry.updated_by_role}
                </Text>
              )}
              {entry.photos && entry.photos.length > 0 && (
                <ScrollView horizontal style={styles.timelinePhotoScroll}>
                  {entry.photos.map((photo, photoIndex) => (
                    <Image
                      key={photoIndex}
                      source={{ uri: photo }}
                      style={styles.timelinePhoto}
                    />
                  ))}
                </ScrollView>
              )}
            </View>
          </View>
        ))}
      </View>

      {/* Feedback Modal */}
      {showFeedbackModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Rate Resolution</Text>
            <View style={styles.ratingSelector}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity
                  key={star}
                  onPress={() => setRating(star)}
                >
                  <Icon
                    name="star"
                    size={40}
                    color={star <= rating ? '#FFD700' : '#DDD'}
                  />
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.modalLabel}>Additional Comments (Optional)</Text>
            <TextInput
              style={styles.feedbackInput}
              multiline
              numberOfLines={4}
              placeholder="Share your experience..."
              value={feedbackText}
              onChangeText={setFeedbackText}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowFeedbackModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.submitButton]}
                onPress={handleSubmitFeedback}
              >
                <Text style={styles.submitButtonText}>Submit</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </ScrollView>
  );
};

// ============================================================================
// STYLES
// ============================================================================

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
    backgroundColor: '#F5F5F5',
  },
  errorText: {
    marginTop: 16,
    fontSize: 18,
    color: '#DC143C',
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    padding: 32,
  },
  emptyTitle: {
    marginTop: 16,
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  emptyText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
  emptyButton: {
    marginTop: 24,
    paddingVertical: 12,
    paddingHorizontal: 32,
    backgroundColor: '#4CAF50',
    borderRadius: 8,
  },
  emptyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  headerCard: {
    backgroundColor: '#FFF',
    padding: 16,
    marginBottom: 8,
  },
  ticketRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  ticketNumber: {
    fontSize: 16,
    fontWeight: '700',
    color: '#4CAF50',
  },
  overdueBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DC143C',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    gap: 4,
  },
  overdueText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 12,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 14,
    color: '#666',
    textTransform: 'capitalize',
  },
  severityBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  severityText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  daysOpenRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  daysOpenText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  statusCard: {
    backgroundColor: '#FFF',
    padding: 16,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 12,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statusInfo: {
    flex: 1,
  },
  statusText: {
    fontSize: 18,
    fontWeight: '700',
  },
  statusSubtext: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  resolutionCard: {
    backgroundColor: '#FFF',
    padding: 16,
    marginBottom: 8,
  },
  resolutionText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 12,
  },
  photoScroll: {
    marginBottom: 12,
  },
  resolutionPhoto: {
    width: 120,
    height: 120,
    borderRadius: 8,
    marginRight: 8,
  },
  resolvedDate: {
    fontSize: 12,
    color: '#999',
    marginBottom: 16,
  },
  verificationSection: {
    borderTopWidth: 1,
    borderTopColor: '#EEE',
    paddingTop: 16,
    marginTop: 16,
  },
  verificationTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginBottom: 12,
  },
  verificationStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 12,
  },
  verificationStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  verificationCount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginLeft: 'auto',
  },
  verifiedText: {
    color: '#4CAF50',
    fontSize: 14,
    fontWeight: '700',
  },
  verificationButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  verifyButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 8,
  },
  verifyYes: {
    backgroundColor: '#4CAF50',
  },
  verifyNo: {
    backgroundColor: '#DC143C',
  },
  verifyButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  feedbackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FF9800',
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  feedbackButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  feedbackDisplay: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#F9F9F9',
    borderRadius: 8,
  },
  feedbackTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  ratingDisplay: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: 8,
  },
  feedbackTextDisplay: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  timelineCard: {
    backgroundColor: '#FFF',
    padding: 16,
    marginBottom: 16,
  },
  timelineEntry: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  timelineIconContainer: {
    alignItems: 'center',
    marginRight: 12,
  },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: '#DDD',
    marginTop: 8,
  },
  timelineContent: {
    flex: 1,
  },
  timelineText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
    marginBottom: 4,
  },
  timelineDate: {
    fontSize: 12,
    color: '#999',
    marginBottom: 2,
  },
  timelineAuthor: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  timelinePhotoScroll: {
    marginTop: 8,
  },
  timelinePhoto: {
    width: 80,
    height: 80,
    borderRadius: 4,
    marginRight: 8,
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 24,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },
  ratingSelector: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 16,
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  feedbackInput: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#333',
    textAlignVertical: 'top',
    marginBottom: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#F5F5F5',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: '#4CAF50',
  },
  submitButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

// API Base URL (replace with actual URL)
const API_BASE_URL = 'http://localhost:3000';

export default GrievanceTrackingScreen;
