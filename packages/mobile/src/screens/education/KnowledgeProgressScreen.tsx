/**
 * Knowledge Progress Screen
 * Task 35.5: Build knowledge state progress visualization
 * 
 * Features:
 * - Display proficiency levels (0-100) for each topic
 * - Visual progress indicators (progress bars, charts)
 * - Group topics by subject
 * - Color-code proficiency levels (red <60%, yellow 60-80%, green >80%)
 * - Show overall progress summary
 * - Display weak areas that need improvement
 * - Show strong areas and achievements
 * - Support filtering by subject
 * - Include recommendations for next learning steps
 * - Integrate with educationService for knowledge state data
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
  KnowledgeState,
  Subject,
  SUBJECTS,
  KNOWLEDGE_STATUS_COLORS,
} from '../../types/education';

interface KnowledgeProgressScreenProps {
  navigation: any;
  route: {
    params?: {
      studentId: string;
    };
  };
}

const { width } = Dimensions.get('window');

export const KnowledgeProgressScreen: React.FC<KnowledgeProgressScreenProps> = ({
  navigation,
  route,
}) => {
  const studentId = route.params?.studentId || 'demo-student';

  // State
  const [loading, setLoading] = useState(true);
  const [knowledgeState, setKnowledgeState] = useState<KnowledgeState[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<Subject | 'all'>('all');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadKnowledgeState();
  }, []);

  const loadKnowledgeState = async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await educationService.getKnowledgeState(studentId);
      setKnowledgeState(data);
    } catch (err: any) {
      console.error('Error loading knowledge state:', err);
      setError(err.message || 'Failed to load knowledge state');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Get proficiency color based on level
   */
  const getProficiencyColor = (proficiency: number): string => {
    if (proficiency < 60) return '#F44336'; // Red
    if (proficiency < 80) return '#FF9800'; // Yellow/Orange
    return '#4CAF50'; // Green
  };

  /**
   * Get proficiency label
   */
  const getProficiencyLabel = (proficiency: number): string => {
    if (proficiency < 25) return 'Beginner';
    if (proficiency < 50) return 'Developing';
    if (proficiency < 75) return 'Proficient';
    return 'Advanced';
  };

  /**
   * Filter knowledge state by subject
   */
  const getFilteredKnowledgeState = (): KnowledgeState[] => {
    if (selectedSubject === 'all') {
      return knowledgeState;
    }
    return knowledgeState.filter(ks => ks.subjectId === selectedSubject);
  };

  /**
   * Group knowledge state by subject
   */
  const getGroupedKnowledgeState = (): { [key: string]: KnowledgeState[] } => {
    const filtered = getFilteredKnowledgeState();
    const grouped: { [key: string]: KnowledgeState[] } = {};

    filtered.forEach(ks => {
      if (!grouped[ks.subjectId]) {
        grouped[ks.subjectId] = [];
      }
      grouped[ks.subjectId].push(ks);
    });

    return grouped;
  };

  /**
   * Calculate overall progress
   */
  const getOverallProgress = (): {
    averageProficiency: number;
    totalTopics: number;
    masteredTopics: number;
    learningTopics: number;
    notStartedTopics: number;
  } => {
    const filtered = getFilteredKnowledgeState();
    
    if (filtered.length === 0) {
      return {
        averageProficiency: 0,
        totalTopics: 0,
        masteredTopics: 0,
        learningTopics: 0,
        notStartedTopics: 0,
      };
    }

    const totalProficiency = filtered.reduce((sum, ks) => sum + ks.proficiency, 0);
    const averageProficiency = totalProficiency / filtered.length;

    const masteredTopics = filtered.filter(ks => ks.status === 'mastered').length;
    const learningTopics = filtered.filter(
      ks => ks.status === 'learning' || ks.status === 'practicing'
    ).length;
    const notStartedTopics = filtered.filter(ks => ks.status === 'not-started').length;

    return {
      averageProficiency,
      totalTopics: filtered.length,
      masteredTopics,
      learningTopics,
      notStartedTopics,
    };
  };

  /**
   * Get weak areas (proficiency < 60%)
   */
  const getWeakAreas = (): KnowledgeState[] => {
    return getFilteredKnowledgeState()
      .filter(ks => ks.proficiency < 60 && ks.status !== 'not-started')
      .sort((a, b) => a.proficiency - b.proficiency)
      .slice(0, 5);
  };

  /**
   * Get strong areas (proficiency >= 80%)
   */
  const getStrongAreas = (): KnowledgeState[] => {
    return getFilteredKnowledgeState()
      .filter(ks => ks.proficiency >= 80)
      .sort((a, b) => b.proficiency - a.proficiency)
      .slice(0, 5);
  };

  /**
   * Get recommendations for next steps
   */
  const getRecommendations = (): string[] => {
    const weakAreas = getWeakAreas();
    const notStarted = getFilteredKnowledgeState().filter(
      ks => ks.status === 'not-started'
    );
    const practicing = getFilteredKnowledgeState().filter(
      ks => ks.status === 'practicing'
    );

    const recommendations: string[] = [];

    if (weakAreas.length > 0) {
      recommendations.push(
        `Focus on improving ${weakAreas[0].topicName} (${Math.round(weakAreas[0].proficiency)}% proficiency)`
      );
    }

    if (practicing.length > 0) {
      recommendations.push(
        `Continue practicing ${practicing[0].topicName} to reach mastery`
      );
    }

    if (notStarted.length > 0) {
      recommendations.push(
        `Start learning ${notStarted[0].topicName} to expand your knowledge`
      );
    }

    if (recommendations.length === 0) {
      recommendations.push('Great job! Keep up the excellent work!');
    }

    return recommendations;
  };

  const renderOverallSummary = () => {
    const progress = getOverallProgress();

    return (
      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>Overall Progress</Text>

        {/* Average Proficiency */}
        <View style={styles.overallProficiency}>
          <View style={styles.circularProgress}>
            <Text style={styles.circularProgressText}>
              {Math.round(progress.averageProficiency)}%
            </Text>
            <Text style={styles.circularProgressLabel}>
              {getProficiencyLabel(progress.averageProficiency)}
            </Text>
          </View>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{progress.totalTopics}</Text>
            <Text style={styles.statLabel}>Total Topics</Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: '#E8F5E9' }]}>
            <Text style={[styles.statValue, { color: '#4CAF50' }]}>
              {progress.masteredTopics}
            </Text>
            <Text style={styles.statLabel}>Mastered</Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: '#FFF3E0' }]}>
            <Text style={[styles.statValue, { color: '#FF9800' }]}>
              {progress.learningTopics}
            </Text>
            <Text style={styles.statLabel}>Learning</Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: '#F5F5F5' }]}>
            <Text style={[styles.statValue, { color: '#9E9E9E' }]}>
              {progress.notStartedTopics}
            </Text>
            <Text style={styles.statLabel}>Not Started</Text>
          </View>
        </View>
      </View>
    );
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

  const renderTopicProgress = (topic: KnowledgeState) => {
    const proficiencyColor = getProficiencyColor(topic.proficiency);
    const statusColor = KNOWLEDGE_STATUS_COLORS[topic.status];

    return (
      <View key={topic.topicId} style={styles.topicCard}>
        <View style={styles.topicHeader}>
          <View style={styles.topicInfo}>
            <Text style={styles.topicName}>{topic.topicName}</Text>
            <View style={styles.topicMeta}>
              <View
                style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}
              >
                <Text style={[styles.statusText, { color: statusColor }]}>
                  {topic.status.replace('-', ' ').toUpperCase()}
                </Text>
              </View>
              {topic.lastPracticed && (
                <Text style={styles.lastPracticed}>
                  Last: {new Date(topic.lastPracticed).toLocaleDateString()}
                </Text>
              )}
            </View>
          </View>

          <View style={styles.proficiencyBadge}>
            <Text style={[styles.proficiencyText, { color: proficiencyColor }]}>
              {Math.round(topic.proficiency)}%
            </Text>
          </View>
        </View>

        {/* Progress Bar */}
        <View style={styles.progressBarContainer}>
          <View
            style={[
              styles.progressBar,
              {
                width: `${topic.proficiency}%`,
                backgroundColor: proficiencyColor,
              },
            ]}
          />
        </View>

        {/* Stats */}
        <View style={styles.topicStats}>
          <Text style={styles.topicStat}>
            📊 Success Rate: {Math.round(topic.successRate)}%
          </Text>
          <Text style={styles.topicStat}>
            🎯 Attempts: {topic.totalAttempts}
          </Text>
        </View>
      </View>
    );
  };

  const renderSubjectSection = (subjectId: Subject, topics: KnowledgeState[]) => {
    const subject = SUBJECTS.find(s => s.value === subjectId);
    if (!subject) return null;

    // Calculate subject average
    const avgProficiency =
      topics.reduce((sum, t) => sum + t.proficiency, 0) / topics.length;

    return (
      <View key={subjectId} style={styles.subjectSection}>
        <View style={styles.subjectHeader}>
          <View style={styles.subjectTitleContainer}>
            <Text style={styles.subjectIcon}>{subject.icon}</Text>
            <Text style={styles.subjectTitle}>{subject.label}</Text>
          </View>
          <Text style={styles.subjectAverage}>
            Avg: {Math.round(avgProficiency)}%
          </Text>
        </View>

        {topics.map(topic => renderTopicProgress(topic))}
      </View>
    );
  };

  const renderWeakAreas = () => {
    const weakAreas = getWeakAreas();

    if (weakAreas.length === 0) {
      return null;
    }

    return (
      <View style={styles.insightCard}>
        <Text style={styles.insightTitle}>⚠️ Areas Needing Improvement</Text>
        <Text style={styles.insightSubtitle}>
          Focus on these topics to boost your overall progress
        </Text>

        {weakAreas.map(topic => (
          <View key={topic.topicId} style={styles.insightItem}>
            <View style={styles.insightItemHeader}>
              <Text style={styles.insightItemName}>{topic.topicName}</Text>
              <Text style={[styles.insightItemValue, { color: '#F44336' }]}>
                {Math.round(topic.proficiency)}%
              </Text>
            </View>
            <View style={styles.insightProgressBar}>
              <View
                style={[
                  styles.insightProgress,
                  {
                    width: `${topic.proficiency}%`,
                    backgroundColor: '#F44336',
                  },
                ]}
              />
            </View>
          </View>
        ))}
      </View>
    );
  };

  const renderStrongAreas = () => {
    const strongAreas = getStrongAreas();

    if (strongAreas.length === 0) {
      return null;
    }

    return (
      <View style={styles.insightCard}>
        <Text style={styles.insightTitle}>🌟 Strong Areas</Text>
        <Text style={styles.insightSubtitle}>
          Great job! You're excelling in these topics
        </Text>

        {strongAreas.map(topic => (
          <View key={topic.topicId} style={styles.insightItem}>
            <View style={styles.insightItemHeader}>
              <Text style={styles.insightItemName}>{topic.topicName}</Text>
              <Text style={[styles.insightItemValue, { color: '#4CAF50' }]}>
                {Math.round(topic.proficiency)}%
              </Text>
            </View>
            <View style={styles.insightProgressBar}>
              <View
                style={[
                  styles.insightProgress,
                  {
                    width: `${topic.proficiency}%`,
                    backgroundColor: '#4CAF50',
                  },
                ]}
              />
            </View>
          </View>
        ))}
      </View>
    );
  };

  const renderRecommendations = () => {
    const recommendations = getRecommendations();

    return (
      <View style={styles.recommendationsCard}>
        <Text style={styles.recommendationsTitle}>💡 Next Steps</Text>
        {recommendations.map((rec, index) => (
          <View key={index} style={styles.recommendationItem}>
            <Text style={styles.recommendationBullet}>•</Text>
            <Text style={styles.recommendationText}>{rec}</Text>
          </View>
        ))}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>Loading knowledge progress...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorIcon}>⚠️</Text>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadKnowledgeState}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (knowledgeState.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyIcon}>📚</Text>
        <Text style={styles.emptyText}>No Progress Data Yet</Text>
        <Text style={styles.emptySubtext}>
          Complete a diagnostic assessment to start tracking your progress
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

  const groupedKnowledge = getGroupedKnowledgeState();

  return (
    <View style={styles.container}>
      <OfflineIndicator />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Knowledge Progress</Text>
        <Text style={styles.headerSubtitle}>Track your learning journey</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Overall Summary */}
        {renderOverallSummary()}

        {/* Subject Filter */}
        {renderSubjectFilter()}

        {/* Weak Areas */}
        {renderWeakAreas()}

        {/* Strong Areas */}
        {renderStrongAreas()}

        {/* Recommendations */}
        {renderRecommendations()}

        {/* Topics by Subject */}
        <View style={styles.topicsContainer}>
          <Text style={styles.sectionTitle}>Topics Progress</Text>
          {Object.entries(groupedKnowledge).map(([subjectId, topics]) =>
            renderSubjectSection(subjectId as Subject, topics)
          )}
        </View>
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
  summaryCard: {
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
  summaryTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  overallProficiency: {
    alignItems: 'center',
    marginBottom: 24,
  },
  circularProgress: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 8,
    borderColor: '#2196F3',
  },
  circularProgressText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  circularProgressLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#F5F5F5',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 28,
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
  insightCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  insightTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  insightSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  insightItem: {
    marginBottom: 16,
  },
  insightItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  insightItemName: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  insightItemValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  insightProgressBar: {
    height: 8,
    backgroundColor: '#F5F5F5',
    borderRadius: 4,
    overflow: 'hidden',
  },
  insightProgress: {
    height: '100%',
    borderRadius: 4,
  },
  recommendationsCard: {
    backgroundColor: '#FFF3E0',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#FFE0B2',
  },
  recommendationsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  recommendationItem: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  recommendationBullet: {
    fontSize: 16,
    color: '#FF9800',
    marginRight: 8,
    fontWeight: 'bold',
  },
  recommendationText: {
    flex: 1,
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  topicsContainer: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  subjectSection: {
    marginBottom: 24,
  },
  subjectHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  subjectTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  subjectIcon: {
    fontSize: 24,
    marginRight: 8,
  },
  subjectTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  subjectAverage: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  topicCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  topicHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  topicInfo: {
    flex: 1,
  },
  topicName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  topicMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  lastPracticed: {
    fontSize: 12,
    color: '#999',
  },
  proficiencyBadge: {
    marginLeft: 12,
  },
  proficiencyText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: '#F5F5F5',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  topicStats: {
    flexDirection: 'row',
    gap: 16,
  },
  topicStat: {
    fontSize: 12,
    color: '#666',
  },
});

export default KnowledgeProgressScreen;
