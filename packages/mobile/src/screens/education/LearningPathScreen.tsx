/**
 * Learning Path Screen
 * Task 35.6: Implement learning path recommendation display
 * 
 * Features:
 * - Display personalized learning recommendations based on knowledge state
 * - Visual journey/roadmap of learning path
 * - Show prerequisite topics and next steps
 * - Display estimated time and difficulty for each topic
 * - Show progress through the learning path
 * - Include reasons for recommendations
 * - Allow students to start recommended content directly
 * - Support filtering by subject or learning goal
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { OfflineIndicator } from '../../components/OfflineIndicator';
import educationService from '../../services/educationService';
import {
  ContentRecommendation,
  ContentItem,
  KnowledgeState,
  Subject,
  SUBJECTS,
} from '../../types/education';

interface LearningPathScreenProps {
  navigation: any;
  route: {
    params?: {
      studentId: string;
    };
  };
}

interface LearningPathItem {
  content: ContentItem;
  recommendation: ContentRecommendation;
  knowledgeState?: KnowledgeState;
  position: number;
  isCompleted: boolean;
  isInProgress: boolean;
  isLocked: boolean;
}

const { width } = Dimensions.get('window');

export const LearningPathScreen: React.FC<LearningPathScreenProps> = ({
  navigation,
  route,
}) => {
  const studentId = route.params?.studentId || 'demo-student';

  // State
  const [loading, setLoading] = useState(true);
  const [recommendations, setRecommendations] = useState<ContentRecommendation[]>([]);
  const [learningPath, setLearningPath] = useState<LearningPathItem[]>([]);
  const [knowledgeState, setKnowledgeState] = useState<KnowledgeState[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<Subject | 'all'>('all');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadLearningPath();
  }, []);

  useEffect(() => {
    if (recommendations.length > 0) {
      filterLearningPath();
    }
  }, [selectedSubject, recommendations]);

  const loadLearningPath = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load recommendations and knowledge state in parallel
      const [recs, knowledge] = await Promise.all([
        educationService.getContentRecommendations(studentId),
        educationService.getKnowledgeState(studentId),
      ]);

      setRecommendations(recs);
      setKnowledgeState(knowledge);

      // Load content details for each recommendation
      const pathItems: LearningPathItem[] = [];
      for (let i = 0; i < recs.length; i++) {
        const rec = recs[i];
        const content = await educationService.getContentById(rec.contentId);
        
        if (content) {
          const topicKnowledge = knowledge.find(
            k => k.topicName === content.topic
          );

          pathItems.push({
            content,
            recommendation: rec,
            knowledgeState: topicKnowledge,
            position: i + 1,
            isCompleted: topicKnowledge?.status === 'mastered',
            isInProgress: topicKnowledge?.status === 'learning' || topicKnowledge?.status === 'practicing',
            isLocked: false, // Could implement prerequisite logic here
          });
        }
      }

      setLearningPath(pathItems);
    } catch (err: any) {
      console.error('Error loading learning path:', err);
      setError(err.message || 'Failed to load learning path');
    } finally {
      setLoading(false);
    }
  };

  const filterLearningPath = () => {
    // Filter is handled by displaying all items but could be enhanced
    // to filter by subject if needed
  };

  const handleStartContent = (item: LearningPathItem) => {
    // Track that user started this content
    educationService.trackContentView(item.content.id, studentId);

    // Navigate to appropriate viewer based on content type
    if (item.content.contentType === 'video') {
      navigation.navigate('VideoPlayer', {
        contentId: item.content.id,
        content: item.content,
      });
    } else {
      navigation.navigate('ContentViewer', {
        contentId: item.content.id,
        content: item.content,
      });
    }
  };

  const getProgressPercentage = (): number => {
    if (learningPath.length === 0) return 0;
    const completed = learningPath.filter(item => item.isCompleted).length;
    return Math.round((completed / learningPath.length) * 100);
  };

  const getEstimatedTimeRemaining = (): number => {
    return learningPath
      .filter(item => !item.isCompleted)
      .reduce((total, item) => total + item.content.duration, 0);
  };

  const formatDuration = (minutes: number): string => {
    if (minutes < 60) {
      return `${minutes}m`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  const getDifficultyColor = (difficulty: string): string => {
    switch (difficulty) {
      case 'easy':
        return '#4CAF50';
      case 'medium':
        return '#FF9800';
      case 'hard':
        return '#F44336';
      default:
        return '#666';
    }
  };

  const getStatusIcon = (item: LearningPathItem): string => {
    if (item.isCompleted) return '✓';
    if (item.isInProgress) return '▶';
    if (item.isLocked) return '🔒';
    return '○';
  };

  const getStatusColor = (item: LearningPathItem): string => {
    if (item.isCompleted) return '#4CAF50';
    if (item.isInProgress) return '#2196F3';
    if (item.isLocked) return '#9E9E9E';
    return '#FF9800';
  };

  const renderSubjectFilter = () => {
    const subjects: Array<{ label: string; value: Subject | 'all' }> = [
      { label: 'All Subjects', value: 'all' },
      ...SUBJECTS.map(s => ({ label: s.label, value: s.value })),
    ];

    return (
      <ScrollView
        horizontal
        style={styles.filterContainer}
        showsHorizontalScrollIndicator={false}
      >
        {subjects.map(subject => (
          <TouchableOpacity
            key={subject.value}
            style={[
              styles.filterChip,
              selectedSubject === subject.value && styles.filterChipActive,
            ]}
            onPress={() => setSelectedSubject(subject.value)}
          >
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
      </ScrollView>
    );
  };

  const renderProgressSummary = () => {
    const progressPercentage = getProgressPercentage();
    const timeRemaining = getEstimatedTimeRemaining();
    const completedCount = learningPath.filter(item => item.isCompleted).length;

    return (
      <View style={styles.progressCard}>
        <Text style={styles.progressTitle}>Your Learning Journey</Text>

        {/* Progress Bar */}
        <View style={styles.progressBarContainer}>
          <View
            style={[
              styles.progressBar,
              { width: `${progressPercentage}%` },
            ]}
          />
        </View>

        <View style={styles.progressStats}>
          <Text style={styles.progressPercentage}>{progressPercentage}% Complete</Text>
          <Text style={styles.progressDetail}>
            {completedCount} of {learningPath.length} topics
          </Text>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text style={styles.statIcon}>⏱️</Text>
            <Text style={styles.statValue}>{formatDuration(timeRemaining)}</Text>
            <Text style={styles.statLabel}>Time Remaining</Text>
          </View>

          <View style={styles.statItem}>
            <Text style={styles.statIcon}>🎯</Text>
            <Text style={styles.statValue}>{learningPath.length}</Text>
            <Text style={styles.statLabel}>Total Topics</Text>
          </View>

          <View style={styles.statItem}>
            <Text style={styles.statIcon}>✓</Text>
            <Text style={styles.statValue}>{completedCount}</Text>
            <Text style={styles.statLabel}>Completed</Text>
          </View>
        </View>
      </View>
    );
  };

  const renderPathItem = (item: LearningPathItem, index: number) => {
    const statusColor = getStatusColor(item);
    const statusIcon = getStatusIcon(item);
    const difficultyColor = getDifficultyColor(item.content.difficulty);
    const isLastItem = index === learningPath.length - 1;

    return (
      <View key={item.content.id} style={styles.pathItemContainer}>
        {/* Connector Line */}
        {!isLastItem && <View style={styles.connectorLine} />}

        {/* Status Node */}
        <View style={[styles.statusNode, { borderColor: statusColor }]}>
          <Text style={[styles.statusIcon, { color: statusColor }]}>
            {statusIcon}
          </Text>
        </View>

        {/* Content Card */}
        <TouchableOpacity
          style={[
            styles.pathCard,
            item.isLocked && styles.pathCardLocked,
          ]}
          onPress={() => !item.isLocked && handleStartContent(item)}
          disabled={item.isLocked}
          activeOpacity={0.7}
        >
          {/* Position Badge */}
          <View style={styles.positionBadge}>
            <Text style={styles.positionText}>Step {item.position}</Text>
          </View>

          {/* Content Info */}
          <View style={styles.pathCardContent}>
            <Text style={styles.pathCardTitle} numberOfLines={2}>
              {item.content.title}
            </Text>

            <Text style={styles.pathCardDescription} numberOfLines={2}>
              {item.content.description}
            </Text>

            {/* Recommendation Reason */}
            <View style={styles.reasonContainer}>
              <Text style={styles.reasonIcon}>💡</Text>
              <Text style={styles.reasonText} numberOfLines={2}>
                {item.recommendation.reason}
              </Text>
            </View>

            {/* Metadata */}
            <View style={styles.pathMetadata}>
              <View style={styles.metadataItem}>
                <Text style={styles.metadataIcon}>📚</Text>
                <Text style={styles.metadataText}>
                  {SUBJECTS.find(s => s.value === item.content.subject)?.label}
                </Text>
              </View>

              <View style={styles.metadataItem}>
                <Text style={styles.metadataIcon}>⏱️</Text>
                <Text style={styles.metadataText}>
                  {formatDuration(item.content.duration)}
                </Text>
              </View>

              <View
                style={[
                  styles.difficultyBadge,
                  { backgroundColor: difficultyColor + '20' },
                ]}
              >
                <Text style={[styles.difficultyText, { color: difficultyColor }]}>
                  {item.content.difficulty.charAt(0).toUpperCase() + 
                   item.content.difficulty.slice(1)}
                </Text>
              </View>
            </View>

            {/* Knowledge State */}
            {item.knowledgeState && (
              <View style={styles.knowledgeStateContainer}>
                <Text style={styles.knowledgeStateLabel}>Your Progress:</Text>
                <View style={styles.knowledgeProgressBar}>
                  <View
                    style={[
                      styles.knowledgeProgress,
                      { width: `${item.knowledgeState.proficiency}%` },
                    ]}
                  />
                </View>
                <Text style={styles.knowledgeProficiency}>
                  {Math.round(item.knowledgeState.proficiency)}% Proficiency
                </Text>
              </View>
            )}

            {/* Action Button */}
            {!item.isLocked && (
              <TouchableOpacity
                style={[
                  styles.actionButton,
                  item.isCompleted && styles.actionButtonCompleted,
                  item.isInProgress && styles.actionButtonInProgress,
                ]}
                onPress={() => handleStartContent(item)}
              >
                <Text style={styles.actionButtonText}>
                  {item.isCompleted
                    ? 'Review'
                    : item.isInProgress
                    ? 'Continue'
                    : 'Start Learning'}
                </Text>
              </TouchableOpacity>
            )}

            {item.isLocked && (
              <View style={styles.lockedMessage}>
                <Text style={styles.lockedIcon}>🔒</Text>
                <Text style={styles.lockedText}>
                  Complete previous topics to unlock
                </Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>Building your learning path...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorIcon}>⚠️</Text>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadLearningPath}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (learningPath.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyIcon}>🎯</Text>
        <Text style={styles.emptyText}>No Learning Path Yet</Text>
        <Text style={styles.emptySubtext}>
          Complete a diagnostic assessment to get personalized recommendations
        </Text>
        <TouchableOpacity
          style={styles.startButton}
          onPress={() => navigation.navigate('DiagnosticAssessment', { studentId })}
        >
          <Text style={styles.startButtonText}>Start Assessment</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <OfflineIndicator />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Learning Path</Text>
        <Text style={styles.headerSubtitle}>
          Your personalized journey to mastery
        </Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Progress Summary */}
        {renderProgressSummary()}

        {/* Subject Filter */}
        {renderSubjectFilter()}

        {/* Learning Path */}
        <View style={styles.pathContainer}>
          <Text style={styles.sectionTitle}>Your Journey</Text>
          <Text style={styles.sectionSubtitle}>
            Follow this path to achieve your learning goals
          </Text>

          {learningPath.map((item, index) => renderPathItem(item, index))}
        </View>

        {/* Completion Message */}
        {getProgressPercentage() === 100 && (
          <View style={styles.completionCard}>
            <Text style={styles.completionIcon}>🎉</Text>
            <Text style={styles.completionTitle}>Congratulations!</Text>
            <Text style={styles.completionText}>
              You've completed your learning path. Keep exploring to master more topics!
            </Text>
            <TouchableOpacity
              style={styles.exploreButton}
              onPress={() => navigation.navigate('ContentLibrary', { studentId })}
            >
              <Text style={styles.exploreButtonText}>Explore More Content</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    padding: 20,
  },
  errorIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    padding: 20,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  startButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
  },
  startButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
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
  content: {
    flex: 1,
  },
  progressCard: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  progressTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  progressBarContainer: {
    height: 12,
    backgroundColor: '#E0E0E0',
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 6,
  },
  progressStats: {
    marginBottom: 20,
  },
  progressPercentage: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  progressDetail: {
    fontSize: 14,
    color: '#666',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
  },
  filterContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  filterChip: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  filterChipActive: {
    backgroundColor: '#2196F3',
    borderColor: '#2196F3',
  },
  filterChipText: {
    fontSize: 14,
    color: '#666',
  },
  filterChipTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  pathContainer: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 24,
  },
  pathItemContainer: {
    position: 'relative',
    marginBottom: 24,
    paddingLeft: 40,
  },
  connectorLine: {
    position: 'absolute',
    left: 19,
    top: 40,
    bottom: -24,
    width: 2,
    backgroundColor: '#E0E0E0',
  },
  statusNode: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 3,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusIcon: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  pathCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  pathCardLocked: {
    opacity: 0.6,
  },
  positionBadge: {
    backgroundColor: '#2196F3',
    paddingVertical: 6,
    paddingHorizontal: 12,
    alignSelf: 'flex-start',
  },
  positionText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  pathCardContent: {
    padding: 16,
  },
  pathCardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  pathCardDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 12,
  },
  reasonContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFF3E0',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  reasonIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  reasonText: {
    flex: 1,
    fontSize: 13,
    color: '#E65100',
    lineHeight: 18,
  },
  pathMetadata: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
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
  difficultyBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  difficultyText: {
    fontSize: 12,
    fontWeight: '600',
  },
  knowledgeStateContainer: {
    marginBottom: 12,
  },
  knowledgeStateLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 6,
  },
  knowledgeProgressBar: {
    height: 6,
    backgroundColor: '#E0E0E0',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 4,
  },
  knowledgeProgress: {
    height: '100%',
    backgroundColor: '#2196F3',
    borderRadius: 3,
  },
  knowledgeProficiency: {
    fontSize: 11,
    color: '#666',
  },
  actionButton: {
    backgroundColor: '#2196F3',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  actionButtonCompleted: {
    backgroundColor: '#4CAF50',
  },
  actionButtonInProgress: {
    backgroundColor: '#FF9800',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  lockedMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
  },
  lockedIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  lockedText: {
    fontSize: 14,
    color: '#666',
  },
  completionCard: {
    backgroundColor: '#E8F5E9',
    margin: 16,
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
  completionIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  completionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginBottom: 8,
  },
  completionText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  exploreButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
  },
  exploreButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default LearningPathScreen;

export default LearningPathScreen;
