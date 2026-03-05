/**
 * Achievements Screen
 * Task 35.7: Create achievement and badge display
 * 
 * Features:
 * - Display earned badges with icons and descriptions
 * - Show locked/unearned badges with unlock requirements
 * - Group achievements by category (learning, progress, mastery, streaks, etc.)
 * - Show achievement progress bars for partially completed achievements
 * - Display achievement unlock dates
 * - Include achievement statistics (total earned, completion percentage)
 * - Show recent achievements prominently
 * - Support filtering by achievement category
 * - Display achievement details when tapped
 * - Celebrate new achievements with visual feedback
 * - Integrate with educationService for achievement data
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Modal,
  Animated,
} from 'react-native';
import { OfflineIndicator } from '../../components/OfflineIndicator';
import educationService from '../../services/educationService';
import {
  Achievement,
  AchievementStats,
  AchievementCategory,
  ACHIEVEMENT_CATEGORIES,
} from '../../types/education';

interface AchievementsScreenProps {
  navigation: any;
  route: {
    params?: {
      studentId: string;
    };
  };
}

export const AchievementsScreen: React.FC<AchievementsScreenProps> = ({
  navigation,
  route,
}) => {
  const studentId = route.params?.studentId || 'demo-student';

  // State
  const [loading, setLoading] = useState(true);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [stats, setStats] = useState<AchievementStats | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<AchievementCategory | 'all'>('all');
  const [selectedAchievement, setSelectedAchievement] = useState<Achievement | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [celebrationAnimation] = useState(new Animated.Value(0));

  useEffect(() => {
    loadAchievements();
  }, []);

  const loadAchievements = async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await educationService.getAchievements(studentId);
      setAchievements(data.achievements || []);
      setStats(data.stats || null);
    } catch (err: any) {
      console.error('Error loading achievements:', err);
      setError(err.message || 'Failed to load achievements');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Filter achievements by category
   */
  const getFilteredAchievements = (): Achievement[] => {
    if (selectedCategory === 'all') {
      return achievements;
    }
    return achievements.filter(a => a.category === selectedCategory);
  };

  /**
   * Group achievements by category
   */
  const getGroupedAchievements = (): { [key: string]: Achievement[] } => {
    const filtered = getFilteredAchievements();
    const grouped: { [key: string]: Achievement[] } = {};

    filtered.forEach(achievement => {
      if (!grouped[achievement.category]) {
        grouped[achievement.category] = [];
      }
      grouped[achievement.category]!.push(achievement);
    });

    return grouped;
  };

  /**
   * Get achievements by status
   */
  const getAchievementsByStatus = (status: 'earned' | 'in_progress' | 'locked'): Achievement[] => {
    return getFilteredAchievements().filter(a => a.status === status);
  };

  /**
   * Handle achievement tap
   */
  const handleAchievementTap = (achievement: Achievement) => {
    setSelectedAchievement(achievement);
    setShowDetailModal(true);
  };

  /**
   * Format date
   */
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  /**
   * Render achievement statistics
   */
  const renderStats = () => {
    if (!stats) return null;

    return (
      <View style={styles.statsCard}>
        <Text style={styles.statsTitle}>Your Progress</Text>

        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.earnedAchievements}</Text>
            <Text style={styles.statLabel}>Earned</Text>
          </View>

          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.totalAchievements}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>

          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: '#4CAF50' }]}>
              {stats.completionPercentage}%
            </Text>
            <Text style={styles.statLabel}>Complete</Text>
          </View>

          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: '#FF9800' }]}>
              {stats.totalXpEarned}
            </Text>
            <Text style={styles.statLabel}>Total XP</Text>
          </View>
        </View>

        {/* Progress Bar */}
        <View style={styles.overallProgressContainer}>
          <View style={styles.overallProgressBar}>
            <View
              style={[
                styles.overallProgress,
                { width: `${stats.completionPercentage}%` },
              ]}
            />
          </View>
          <Text style={styles.overallProgressText}>
            {stats.earnedAchievements} of {stats.totalAchievements} achievements unlocked
          </Text>
        </View>
      </View>
    );
  };

  /**
   * Render recent achievements
   */
  const renderRecentAchievements = () => {
    if (!stats?.recentAchievements || stats.recentAchievements.length === 0) {
      return null;
    }

    const recentAchievements = stats.recentAchievements
      .map(recent => achievements.find(a => a.id === recent.id))
      .filter(Boolean) as Achievement[];

    if (recentAchievements.length === 0) return null;

    return (
      <View style={styles.recentSection}>
        <Text style={styles.sectionTitle}>🎉 Recently Earned</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {recentAchievements.map(achievement => (
            <TouchableOpacity
              key={achievement.id}
              style={styles.recentCard}
              onPress={() => handleAchievementTap(achievement)}
            >
              <Text style={styles.recentIcon}>{achievement.iconEmoji || '🏆'}</Text>
              <Text style={styles.recentName} numberOfLines={2}>
                {achievement.name}
              </Text>
              <Text style={styles.recentDate}>
                {achievement.earnedAt && formatDate(achievement.earnedAt)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  };

  /**
   * Render category filter
   */
  const renderCategoryFilter = () => {
    const categories: Array<{ label: string; value: AchievementCategory | 'all'; icon: string }> = [
      { label: 'All', value: 'all', icon: '🎯' },
      ...ACHIEVEMENT_CATEGORIES.map(c => ({ label: c.label, value: c.value, icon: c.icon })),
    ];

    return (
      <ScrollView
        horizontal
        style={styles.filterContainer}
        showsHorizontalScrollIndicator={false}
      >
        {categories.map(category => {
          const count = category.value === 'all'
            ? achievements.length
            : achievements.filter(a => a.category === category.value).length;

          return (
            <TouchableOpacity
              key={category.value}
              style={[
                styles.filterChip,
                selectedCategory === category.value && styles.filterChipActive,
              ]}
              onPress={() => setSelectedCategory(category.value)}
            >
              <Text style={styles.filterIcon}>{category.icon}</Text>
              <Text
                style={[
                  styles.filterText,
                  selectedCategory === category.value && styles.filterTextActive,
                ]}
              >
                {category.label}
              </Text>
              <View style={styles.filterBadge}>
                <Text style={styles.filterBadgeText}>{count}</Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    );
  };

  /**
   * Render achievement card
   */
  const renderAchievementCard = (achievement: Achievement) => {
    const isEarned = achievement.status === 'earned';
    const isInProgress = achievement.status === 'in_progress';
    const isLocked = achievement.status === 'locked';

    const categoryInfo = ACHIEVEMENT_CATEGORIES.find(c => c.value === achievement.category);
    const progressPercentage = (achievement.progress / achievement.maxProgress) * 100;

    return (
      <TouchableOpacity
        key={achievement.id}
        style={[
          styles.achievementCard,
          isLocked && styles.achievementCardLocked,
        ]}
        onPress={() => handleAchievementTap(achievement)}
      >
        {/* Icon */}
        <View
          style={[
            styles.achievementIcon,
            isEarned && styles.achievementIconEarned,
            isInProgress && styles.achievementIconInProgress,
            isLocked && styles.achievementIconLocked,
          ]}
        >
          <Text style={[styles.achievementEmoji, isLocked && styles.achievementEmojiLocked]}>
            {achievement.iconEmoji || '🏆'}
          </Text>
        </View>

        {/* Content */}
        <View style={styles.achievementContent}>
          <View style={styles.achievementHeader}>
            <Text
              style={[
                styles.achievementName,
                isLocked && styles.achievementNameLocked,
              ]}
            >
              {achievement.name}
            </Text>
            {isEarned && (
              <View style={styles.earnedBadge}>
                <Text style={styles.earnedBadgeText}>✓</Text>
              </View>
            )}
          </View>

          <Text
            style={[
              styles.achievementDescription,
              isLocked && styles.achievementDescriptionLocked,
            ]}
            numberOfLines={2}
          >
            {achievement.description}
          </Text>

          {/* Progress Bar for In Progress */}
          {isInProgress && (
            <View style={styles.progressSection}>
              <View style={styles.progressBarContainer}>
                <View
                  style={[
                    styles.progressBar,
                    { width: `${progressPercentage}%` },
                  ]}
                />
              </View>
              <Text style={styles.progressText}>
                {achievement.progress} / {achievement.maxProgress}
              </Text>
            </View>
          )}

          {/* Unlock Requirements for Locked */}
          {isLocked && achievement.unlockRequirements && (
            <View style={styles.requirementsSection}>
              <Text style={styles.requirementsLabel}>🔒 Unlock:</Text>
              {achievement.unlockRequirements.map((req, index) => (
                <Text key={index} style={styles.requirementText} numberOfLines={1}>
                  • {req}
                </Text>
              ))}
            </View>
          )}

          {/* Footer */}
          <View style={styles.achievementFooter}>
            <View style={[styles.categoryBadge, { backgroundColor: categoryInfo?.color + '20' }]}>
              <Text style={[styles.categoryText, { color: categoryInfo?.color }]}>
                {categoryInfo?.label}
              </Text>
            </View>

            <View style={styles.xpBadge}>
              <Text style={styles.xpText}>+{achievement.xpReward} XP</Text>
            </View>
          </View>

          {/* Earned Date */}
          {isEarned && achievement.earnedAt && (
            <Text style={styles.earnedDate}>
              Earned on {formatDate(achievement.earnedAt)}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  /**
   * Render achievement detail modal
   */
  const renderDetailModal = () => {
    if (!selectedAchievement) return null;

    const isEarned = selectedAchievement.status === 'earned';
    const isInProgress = selectedAchievement.status === 'in_progress';
    const isLocked = selectedAchievement.status === 'locked';
    const categoryInfo = ACHIEVEMENT_CATEGORIES.find(c => c.value === selectedAchievement.category);
    const progressPercentage = (selectedAchievement.progress / selectedAchievement.maxProgress) * 100;

    return (
      <Modal
        visible={showDetailModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDetailModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Close Button */}
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowDetailModal(false)}
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>

            {/* Icon */}
            <View
              style={[
                styles.modalIcon,
                isEarned && styles.modalIconEarned,
                isInProgress && styles.modalIconInProgress,
                isLocked && styles.modalIconLocked,
              ]}
            >
              <Text style={styles.modalEmoji}>
                {selectedAchievement.iconEmoji || '🏆'}
              </Text>
            </View>

            {/* Status Badge */}
            {isEarned && (
              <View style={styles.modalStatusBadge}>
                <Text style={styles.modalStatusText}>✓ EARNED</Text>
              </View>
            )}
            {isInProgress && (
              <View style={[styles.modalStatusBadge, { backgroundColor: '#FF9800' }]}>
                <Text style={styles.modalStatusText}>IN PROGRESS</Text>
              </View>
            )}
            {isLocked && (
              <View style={[styles.modalStatusBadge, { backgroundColor: '#9E9E9E' }]}>
                <Text style={styles.modalStatusText}>🔒 LOCKED</Text>
              </View>
            )}

            {/* Name */}
            <Text style={styles.modalName}>{selectedAchievement.name}</Text>

            {/* Description */}
            <Text style={styles.modalDescription}>
              {selectedAchievement.description}
            </Text>

            {/* Progress */}
            {isInProgress && (
              <View style={styles.modalProgressSection}>
                <Text style={styles.modalProgressLabel}>Progress</Text>
                <View style={styles.modalProgressBar}>
                  <View
                    style={[
                      styles.modalProgress,
                      { width: `${progressPercentage}%` },
                    ]}
                  />
                </View>
                <Text style={styles.modalProgressText}>
                  {selectedAchievement.progress} / {selectedAchievement.maxProgress} ({Math.round(progressPercentage)}%)
                </Text>
              </View>
            )}

            {/* Unlock Requirements */}
            {isLocked && selectedAchievement.unlockRequirements && (
              <View style={styles.modalRequirements}>
                <Text style={styles.modalRequirementsTitle}>Unlock Requirements:</Text>
                {selectedAchievement.unlockRequirements.map((req, index) => (
                  <Text key={index} style={styles.modalRequirementText}>
                    • {req}
                  </Text>
                ))}
              </View>
            )}

            {/* Details */}
            <View style={styles.modalDetails}>
              <View style={styles.modalDetailRow}>
                <Text style={styles.modalDetailLabel}>Category:</Text>
                <View style={[styles.modalCategoryBadge, { backgroundColor: categoryInfo?.color + '20' }]}>
                  <Text style={[styles.modalCategoryText, { color: categoryInfo?.color }]}>
                    {categoryInfo?.icon} {categoryInfo?.label}
                  </Text>
                </View>
              </View>

              <View style={styles.modalDetailRow}>
                <Text style={styles.modalDetailLabel}>Reward:</Text>
                <Text style={styles.modalDetailValue}>
                  +{selectedAchievement.xpReward} XP
                </Text>
              </View>

              {isEarned && selectedAchievement.earnedAt && (
                <View style={styles.modalDetailRow}>
                  <Text style={styles.modalDetailLabel}>Earned:</Text>
                  <Text style={styles.modalDetailValue}>
                    {formatDate(selectedAchievement.earnedAt)}
                  </Text>
                </View>
              )}
            </View>

            {/* Action Button */}
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => setShowDetailModal(false)}
            >
              <Text style={styles.modalButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  };

  /**
   * Render main content
   */
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF9800" />
        <Text style={styles.loadingText}>Loading achievements...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorIcon}>⚠️</Text>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadAchievements}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (achievements.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyIcon}>🏆</Text>
        <Text style={styles.emptyText}>No Achievements Yet</Text>
        <Text style={styles.emptySubtext}>
          Start learning to unlock achievements and earn badges!
        </Text>
      </View>
    );
  }

  const groupedAchievements = getGroupedAchievements();
  const earnedAchievements = getAchievementsByStatus('earned');
  const inProgressAchievements = getAchievementsByStatus('in_progress');
  const lockedAchievements = getAchievementsByStatus('locked');

  return (
    <View style={styles.container}>
      <OfflineIndicator />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Achievements</Text>
        <Text style={styles.headerSubtitle}>Unlock badges and earn rewards</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Statistics */}
        {renderStats()}

        {/* Recent Achievements */}
        {renderRecentAchievements()}

        {/* Category Filter */}
        {renderCategoryFilter()}

        {/* Achievements List */}
        <View style={styles.achievementsContainer}>
          {/* Earned Achievements */}
          {earnedAchievements.length > 0 && (
            <View style={styles.achievementSection}>
              <Text style={styles.achievementSectionTitle}>
                ✓ Earned ({earnedAchievements.length})
              </Text>
              {earnedAchievements.map(achievement => renderAchievementCard(achievement))}
            </View>
          )}

          {/* In Progress Achievements */}
          {inProgressAchievements.length > 0 && (
            <View style={styles.achievementSection}>
              <Text style={styles.achievementSectionTitle}>
                ⏳ In Progress ({inProgressAchievements.length})
              </Text>
              {inProgressAchievements.map(achievement => renderAchievementCard(achievement))}
            </View>
          )}

          {/* Locked Achievements */}
          {lockedAchievements.length > 0 && (
            <View style={styles.achievementSection}>
              <Text style={styles.achievementSectionTitle}>
                🔒 Locked ({lockedAchievements.length})
              </Text>
              {lockedAchievements.map(achievement => renderAchievementCard(achievement))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Detail Modal */}
      {renderDetailModal()}
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
    backgroundColor: '#FF9800',
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
  },
  header: {
    backgroundColor: '#FF9800',
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
    color: '#FFF3E0',
  },
  content: {
    flex: 1,
  },
  statsCard: {
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
  statsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FF9800',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
  },
  overallProgressContainer: {
    marginTop: 8,
  },
  overallProgressBar: {
    height: 12,
    backgroundColor: '#F5F5F5',
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 8,
  },
  overallProgress: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 6,
  },
  overallProgressText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  recentSection: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  recentCard: {
    backgroundColor: '#fff',
    width: 120,
    padding: 16,
    borderRadius: 12,
    marginRight: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  recentIcon: {
    fontSize: 48,
    marginBottom: 8,
  },
  recentName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    marginBottom: 4,
  },
  recentDate: {
    fontSize: 10,
    color: '#999',
    textAlign: 'center',
  },
  filterContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  filterChipActive: {
    backgroundColor: '#FF9800',
    borderColor: '#FF9800',
  },
  filterIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  filterText: {
    fontSize: 14,
    color: '#666',
    marginRight: 6,
  },
  filterTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  filterBadge: {
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  filterBadgeText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
  },
  achievementsContainer: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  achievementSection: {
    marginBottom: 24,
  },
  achievementSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  achievementCard: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  achievementCardLocked: {
    opacity: 0.6,
  },
  achievementIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  achievementIconEarned: {
    backgroundColor: '#FFD700',
  },
  achievementIconInProgress: {
    backgroundColor: '#FF9800',
  },
  achievementIconLocked: {
    backgroundColor: '#E0E0E0',
  },
  achievementEmoji: {
    fontSize: 32,
  },
  achievementEmojiLocked: {
    opacity: 0.5,
  },
  achievementContent: {
    flex: 1,
  },
  achievementHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  achievementName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  achievementNameLocked: {
    color: '#999',
  },
  earnedBadge: {
    backgroundColor: '#4CAF50',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  earnedBadgeText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  achievementDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  achievementDescriptionLocked: {
    color: '#999',
  },
  progressSection: {
    marginBottom: 8,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: '#F5F5F5',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 4,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#FF9800',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: '#666',
  },
  requirementsSection: {
    marginBottom: 8,
  },
  requirementsLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  requirementText: {
    fontSize: 12,
    color: '#999',
  },
  achievementFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  categoryBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: '600',
  },
  xpBadge: {
    backgroundColor: '#FFF3E0',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  xpText: {
    fontSize: 11,
    color: '#FF9800',
    fontWeight: '600',
  },
  earnedDate: {
    fontSize: 11,
    color: '#999',
    marginTop: 4,
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
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 20,
    color: '#666',
  },
  modalIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalIconEarned: {
    backgroundColor: '#FFD700',
  },
  modalIconInProgress: {
    backgroundColor: '#FF9800',
  },
  modalIconLocked: {
    backgroundColor: '#E0E0E0',
  },
  modalEmoji: {
    fontSize: 56,
  },
  modalStatusBadge: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: 16,
  },
  modalStatusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  modalName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 8,
  },
  modalDescription: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  modalProgressSection: {
    width: '100%',
    marginBottom: 24,
  },
  modalProgressLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  modalProgressBar: {
    height: 12,
    backgroundColor: '#F5F5F5',
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 8,
  },
  modalProgress: {
    height: '100%',
    backgroundColor: '#FF9800',
    borderRadius: 6,
  },
  modalProgressText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  modalRequirements: {
    width: '100%',
    backgroundColor: '#FFF3E0',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  modalRequirementsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  modalRequirementText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  modalDetails: {
    width: '100%',
    marginBottom: 24,
  },
  modalDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalDetailLabel: {
    fontSize: 14,
    color: '#666',
  },
  modalDetailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  modalCategoryBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  modalCategoryText: {
    fontSize: 12,
    fontWeight: '600',
  },
  modalButton: {
    backgroundColor: '#FF9800',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default AchievementsScreen;

export default AchievementsScreen;
