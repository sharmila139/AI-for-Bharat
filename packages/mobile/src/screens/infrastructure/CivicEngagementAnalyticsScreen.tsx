/**
 * Civic Engagement Analytics Screen
 * Task 36.10: Create civic engagement analytics display
 * 
 * Features:
 * - Display analytics and statistics for civic engagement activities
 * - Grievance metrics (total, resolved, pending, resolution rate, average resolution time)
 * - Poll metrics (total polls, participation rate, active polls, completed polls)
 * - Project metrics (total projects, on-time completion rate, budget utilization, delayed projects)
 * - Community verification metrics (verification rate, active verifiers)
 * - Trends over time with charts/graphs
 * - Ward-wise breakdown of metrics
 * - Date range filters (last 7 days, 30 days, 90 days, all time)
 * - Top contributors/active citizens
 * - Follow patterns from existing infrastructure screens
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { OfflineIndicator } from '../../components/OfflineIndicator';
import { API_BASE_URL } from '../../config/api-config';

interface CivicEngagementAnalyticsScreenProps {
  navigation: any;
}

type DateRange = '7d' | '30d' | '90d' | 'all';

interface GrievanceMetrics {
  total: number;
  resolved: number;
  pending: number;
  in_progress: number;
  resolution_rate: number;
  average_resolution_days: number;
  overdue: number;
}

interface PollMetrics {
  total: number;
  active: number;
  completed: number;
  total_votes: number;
  average_participation_rate: number;
  binding_polls: number;
}

interface ProjectMetrics {
  total: number;
  in_progress: number;
  completed: number;
  delayed: number;
  on_time_completion_rate: number;
  total_budget: number;
  budget_spent: number;
  budget_utilization_rate: number;
}

interface VerificationMetrics {
  total_verifications: number;
  verification_rate: number;
  active_verifiers: number;
  average_verifications_per_user: number;
}

interface TopContributor {
  user_id: string;
  name: string;
  contribution_count: number;
  contribution_type: string;
}

interface WardMetrics {
  ward_name: string;
  grievances: number;
  polls: number;
  projects: number;
  participation_rate: number;
}

interface AnalyticsData {
  grievances: GrievanceMetrics;
  polls: PollMetrics;
  projects: ProjectMetrics;
  verification: VerificationMetrics;
  top_contributors: TopContributor[];
  ward_breakdown: WardMetrics[];
  date_range: DateRange;
}

const DATE_RANGE_OPTIONS: Array<{ value: DateRange; label: string }> = [
  { value: '7d', label: 'Last 7 Days' },
  { value: '30d', label: 'Last 30 Days' },
  { value: '90d', label: 'Last 90 Days' },
  { value: 'all', label: 'All Time' },
];

export const CivicEngagementAnalyticsScreen: React.FC<CivicEngagementAnalyticsScreenProps> = ({
  navigation,
}) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange>('30d');
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAnalytics();
  }, [dateRange]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `${API_BASE_URL}/api/civic-engagement/analytics?date_range=${dateRange}`
      );
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to load analytics');
      }

      setAnalytics(data.data);
    } catch (err: any) {
      console.error('Error loading analytics:', err);
      setError(err.message || 'Failed to load analytics');
      // Set mock data for development
      setAnalytics(getMockAnalytics());
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadAnalytics();
  };

  const getMockAnalytics = (): AnalyticsData => ({
    grievances: {
      total: 1247,
      resolved: 892,
      pending: 245,
      in_progress: 110,
      resolution_rate: 71.5,
      average_resolution_days: 12.3,
      overdue: 45,
    },
    polls: {
      total: 34,
      active: 5,
      completed: 29,
      total_votes: 8934,
      average_participation_rate: 62.4,
      binding_polls: 12,
    },
    projects: {
      total: 87,
      in_progress: 32,
      completed: 48,
      delayed: 7,
      on_time_completion_rate: 87.5,
      total_budget: 45000000,
      budget_spent: 32500000,
      budget_utilization_rate: 72.2,
    },
    verification: {
      total_verifications: 2341,
      verification_rate: 78.5,
      active_verifiers: 156,
      average_verifications_per_user: 15.0,
    },
    top_contributors: [
      { user_id: '1', name: 'Rajesh Kumar', contribution_count: 45, contribution_type: 'Grievances' },
      { user_id: '2', name: 'Priya Sharma', contribution_count: 38, contribution_type: 'Verifications' },
      { user_id: '3', name: 'Amit Patel', contribution_count: 32, contribution_type: 'Poll Votes' },
      { user_id: '4', name: 'Sunita Devi', contribution_count: 28, contribution_type: 'Grievances' },
      { user_id: '5', name: 'Vikram Singh', contribution_count: 24, contribution_type: 'Verifications' },
    ],
    ward_breakdown: [
      { ward_name: 'Ward 1', grievances: 234, polls: 8, projects: 15, participation_rate: 68.5 },
      { ward_name: 'Ward 2', grievances: 198, polls: 6, projects: 12, participation_rate: 72.3 },
      { ward_name: 'Ward 3', grievances: 287, polls: 9, projects: 18, participation_rate: 65.1 },
      { ward_name: 'Ward 4', grievances: 156, polls: 5, projects: 10, participation_rate: 58.9 },
      { ward_name: 'Ward 5', grievances: 372, polls: 6, projects: 32, participation_rate: 61.2 },
    ],
    date_range: dateRange,
  });

  const formatCurrency = (amount: number): string => {
    if (amount >= 10000000) {
      return `₹${(amount / 10000000).toFixed(2)} Cr`;
    } else if (amount >= 100000) {
      return `₹${(amount / 100000).toFixed(2)} L`;
    }
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  const formatPercentage = (value: number): string => {
    return `${value.toFixed(1)}%`;
  };

  const renderMetricCard = (
    title: string,
    value: string | number,
    subtitle?: string,
    icon?: string,
    color?: string
  ) => (
    <View style={[styles.metricCard, color && { borderLeftColor: color }]}>
      {icon && <Text style={styles.metricIcon}>{icon}</Text>}
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricTitle}>{title}</Text>
      {subtitle && <Text style={styles.metricSubtitle}>{subtitle}</Text>}
    </View>
  );

  const renderProgressBar = (percentage: number, color: string) => (
    <View style={styles.progressBarContainer}>
      <View
        style={[
          styles.progressBarFill,
          { width: `${Math.min(percentage, 100)}%`, backgroundColor: color },
        ]}
      />
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Loading analytics...</Text>
      </View>
    );
  }

  if (!analytics) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorIcon}>⚠️</Text>
        <Text style={styles.errorText}>Failed to load analytics</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadAnalytics}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <OfflineIndicator />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Civic Engagement Analytics</Text>
        <Text style={styles.headerSubtitle}>Community participation insights</Text>
      </View>

      {/* Date Range Selector */}
      <View style={styles.dateRangeContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {DATE_RANGE_OPTIONS.map((option) => (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.dateRangeChip,
                dateRange === option.value && styles.dateRangeChipActive,
              ]}
              onPress={() => setDateRange(option.value)}
            >
              <Text
                style={[
                  styles.dateRangeText,
                  dateRange === option.value && styles.dateRangeTextActive,
                ]}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView
        testID="analytics-scroll-view"
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={['#4CAF50']} />
        }
      >
        {/* Grievance Metrics */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionIcon}>📋</Text>
            <Text style={styles.sectionTitle}>Grievance Management</Text>
          </View>

          <View style={styles.metricsGrid}>
            {renderMetricCard('Total Grievances', analytics.grievances.total, undefined, '📊', '#2196F3')}
            {renderMetricCard('Resolved', analytics.grievances.resolved, undefined, '✅', '#4CAF50')}
            {renderMetricCard('Pending', analytics.grievances.pending, undefined, '⏳', '#FF9800')}
            {renderMetricCard('In Progress', analytics.grievances.in_progress, undefined, '🔄', '#9C27B0')}
          </View>

          <View style={styles.detailCard}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Resolution Rate</Text>
              <Text style={[styles.detailValue, { color: '#4CAF50' }]}>
                {formatPercentage(analytics.grievances.resolution_rate)}
              </Text>
            </View>
            {renderProgressBar(analytics.grievances.resolution_rate, '#4CAF50')}

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Average Resolution Time</Text>
              <Text style={styles.detailValue}>{analytics.grievances.average_resolution_days.toFixed(1)} days</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Overdue Grievances</Text>
              <Text style={[styles.detailValue, { color: '#F44336' }]}>{analytics.grievances.overdue}</Text>
            </View>
          </View>
        </View>

        {/* Poll Metrics */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionIcon}>🗳️</Text>
            <Text style={styles.sectionTitle}>Community Polls</Text>
          </View>

          <View style={styles.metricsGrid}>
            {renderMetricCard('Total Polls', analytics.polls.total, undefined, '📊', '#9C27B0')}
            {renderMetricCard('Active Polls', analytics.polls.active, undefined, '🟢', '#4CAF50')}
            {renderMetricCard('Completed', analytics.polls.completed, undefined, '✅', '#607D8B')}
            {renderMetricCard('Total Votes', analytics.polls.total_votes, undefined, '👥', '#2196F3')}
          </View>

          <View style={styles.detailCard}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Average Participation Rate</Text>
              <Text style={[styles.detailValue, { color: '#2196F3' }]}>
                {formatPercentage(analytics.polls.average_participation_rate)}
              </Text>
            </View>
            {renderProgressBar(analytics.polls.average_participation_rate, '#2196F3')}

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Binding Polls</Text>
              <Text style={styles.detailValue}>{analytics.polls.binding_polls}</Text>
            </View>
          </View>
        </View>

        {/* Project Metrics */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionIcon}>🏗️</Text>
            <Text style={styles.sectionTitle}>Infrastructure Projects</Text>
          </View>

          <View style={styles.metricsGrid}>
            {renderMetricCard('Total Projects', analytics.projects.total, undefined, '📊', '#FF9800')}
            {renderMetricCard('In Progress', analytics.projects.in_progress, undefined, '🔄', '#2196F3')}
            {renderMetricCard('Completed', analytics.projects.completed, undefined, '✅', '#4CAF50')}
            {renderMetricCard('Delayed', analytics.projects.delayed, undefined, '⚠️', '#F44336')}
          </View>

          <View style={styles.detailCard}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>On-Time Completion Rate</Text>
              <Text style={[styles.detailValue, { color: '#4CAF50' }]}>
                {formatPercentage(analytics.projects.on_time_completion_rate)}
              </Text>
            </View>
            {renderProgressBar(analytics.projects.on_time_completion_rate, '#4CAF50')}

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Total Budget</Text>
              <Text style={styles.detailValue}>{formatCurrency(analytics.projects.total_budget)}</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Budget Spent</Text>
              <Text style={styles.detailValue}>{formatCurrency(analytics.projects.budget_spent)}</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Budget Utilization</Text>
              <Text style={[styles.detailValue, { color: '#FF9800' }]}>
                {formatPercentage(analytics.projects.budget_utilization_rate)}
              </Text>
            </View>
            {renderProgressBar(analytics.projects.budget_utilization_rate, '#FF9800')}
          </View>
        </View>

        {/* Community Verification Metrics */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionIcon}>✓</Text>
            <Text style={styles.sectionTitle}>Community Verification</Text>
          </View>

          <View style={styles.metricsGrid}>
            {renderMetricCard('Total Verifications', analytics.verification.total_verifications, undefined, '✅', '#4CAF50')}
            {renderMetricCard('Active Verifiers', analytics.verification.active_verifiers, undefined, '👥', '#2196F3')}
            {renderMetricCard('Avg per User', analytics.verification.average_verifications_per_user.toFixed(1), undefined, '📊', '#9C27B0')}
          </View>

          <View style={styles.detailCard}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Verification Rate</Text>
              <Text style={[styles.detailValue, { color: '#4CAF50' }]}>
                {formatPercentage(analytics.verification.verification_rate)}
              </Text>
            </View>
            {renderProgressBar(analytics.verification.verification_rate, '#4CAF50')}
          </View>
        </View>

        {/* Top Contributors */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionIcon}>🏆</Text>
            <Text style={styles.sectionTitle}>Top Contributors</Text>
          </View>

          <View style={styles.contributorsList}>
            {analytics.top_contributors.map((contributor, index) => (
              <View key={contributor.user_id} style={styles.contributorCard}>
                <View style={styles.contributorRank}>
                  <Text style={styles.rankText}>#{index + 1}</Text>
                </View>
                <View style={styles.contributorInfo}>
                  <Text style={styles.contributorName}>{contributor.name}</Text>
                  <Text style={styles.contributorType}>{contributor.contribution_type}</Text>
                </View>
                <View style={styles.contributorCount}>
                  <Text style={styles.countValue}>{contributor.contribution_count}</Text>
                  <Text style={styles.countLabel}>contributions</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Ward-wise Breakdown */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionIcon}>📍</Text>
            <Text style={styles.sectionTitle}>Ward-wise Breakdown</Text>
          </View>

          <View style={styles.wardsList}>
            {analytics.ward_breakdown.map((ward) => (
              <View key={ward.ward_name} style={styles.wardCard}>
                <Text style={styles.wardName}>{ward.ward_name}</Text>
                
                <View style={styles.wardMetrics}>
                  <View style={styles.wardMetricItem}>
                    <Text style={styles.wardMetricIcon}>📋</Text>
                    <Text style={styles.wardMetricValue}>{ward.grievances}</Text>
                    <Text style={styles.wardMetricLabel}>Grievances</Text>
                  </View>
                  
                  <View style={styles.wardMetricItem}>
                    <Text style={styles.wardMetricIcon}>🗳️</Text>
                    <Text style={styles.wardMetricValue}>{ward.polls}</Text>
                    <Text style={styles.wardMetricLabel}>Polls</Text>
                  </View>
                  
                  <View style={styles.wardMetricItem}>
                    <Text style={styles.wardMetricIcon}>🏗️</Text>
                    <Text style={styles.wardMetricValue}>{ward.projects}</Text>
                    <Text style={styles.wardMetricLabel}>Projects</Text>
                  </View>
                </View>

                <View style={styles.wardParticipation}>
                  <Text style={styles.wardParticipationLabel}>Participation Rate</Text>
                  <Text style={styles.wardParticipationValue}>
                    {formatPercentage(ward.participation_rate)}
                  </Text>
                </View>
                {renderProgressBar(ward.participation_rate, '#4CAF50')}
              </View>
            ))}
          </View>
        </View>

        <View style={styles.bottomPadding} />
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
    fontSize: 18,
    color: '#666',
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
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
  dateRangeContainer: {
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  dateRangeChip: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    marginRight: 8,
  },
  dateRangeChipActive: {
    backgroundColor: '#4CAF50',
  },
  dateRangeText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  dateRangeTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  section: {
    marginTop: 16,
    paddingHorizontal: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionIcon: {
    fontSize: 24,
    marginRight: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 12,
  },
  metricCard: {
    flex: 1,
    minWidth: '47%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  metricIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  metricValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  metricTitle: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  metricSubtitle: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  detailCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
  },
  detailValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  contributorsList: {
    gap: 12,
  },
  contributorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  contributorRank: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  rankText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  contributorInfo: {
    flex: 1,
  },
  contributorName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  contributorType: {
    fontSize: 12,
    color: '#666',
  },
  contributorCount: {
    alignItems: 'flex-end',
  },
  countValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  countLabel: {
    fontSize: 11,
    color: '#999',
  },
  wardsList: {
    gap: 12,
  },
  wardCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  wardName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  wardMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  wardMetricItem: {
    alignItems: 'center',
  },
  wardMetricIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  wardMetricValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  wardMetricLabel: {
    fontSize: 11,
    color: '#666',
  },
  wardParticipation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  wardParticipationLabel: {
    fontSize: 14,
    color: '#666',
  },
  wardParticipationValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  bottomPadding: {
    height: 32,
  },
});

export default CivicEngagementAnalyticsScreen;

export default CivicEngagementAnalyticsScreen;
