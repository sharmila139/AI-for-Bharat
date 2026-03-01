/**
 * Poll Results Component
 * Task 36.6: Implement poll results visualization
 * 
 * Features:
 * - Bar charts for all poll types
 * - Pie chart for single/multiple choice
 * - Demographic breakdowns by age and ward
 * - Vote counts, percentages, and participation metrics
 * - Ranked choice average rankings
 * - Budget allocation totals
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

type PollType = 'single_choice' | 'multiple_choice' | 'ranked_choice' | 'budget_allocation';

interface OptionResult {
  option_id: string;
  option_text: string;
  vote_count: number;
  percentage: number;
  average_rank?: number;
  total_budget_allocated?: number;
}

interface DemographicBreakdown {
  age_groups?: Record<string, { vote_count: number; percentage: number }>;
  wards?: Record<string, { vote_count: number; percentage: number }>;
}

interface PollResultsData {
  poll_id: string;
  total_votes: number;
  turnout_percentage: number;
  results_by_option: Record<string, OptionResult>;
  is_binding_threshold_met?: boolean;
  demographic_breakdown?: DemographicBreakdown;
}

interface PollResultsProps {
  results: PollResultsData;
  pollType: PollType;
  showDemographics?: boolean;
}

export const PollResults: React.FC<PollResultsProps> = ({ 
  results, 
  pollType,
  showDemographics = false 
}) => {
  const [viewMode, setViewMode] = useState<'bar' | 'pie'>('bar');
  const [showDemographicBreakdown, setShowDemographicBreakdown] = useState(showDemographics);

  const sortedResults = Object.values(results.results_by_option).sort((a, b) => {
    if (pollType === 'ranked_choice' && a.average_rank && b.average_rank) {
      return a.average_rank - b.average_rank; // Lower rank is better
    }
    return b.percentage - a.percentage; // Higher percentage first
  });

  const formatCurrency = (amount: number): string => {
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  const getColorForIndex = (index: number): string => {
    const colors = [
      '#4CAF50', // Green
      '#2196F3', // Blue
      '#FF9800', // Orange
      '#9C27B0', // Purple
      '#F44336', // Red
      '#00BCD4', // Cyan
      '#FFEB3B', // Yellow
      '#795548', // Brown
    ];
    return colors[index % colors.length];
  };

  const renderBarChart = () => (
    <View style={styles.barChartContainer}>
      {sortedResults.map((result, index) => (
        <View key={String(result.option_id)} style={styles.barChartRow}>
          <View style={styles.barChartLabel}>
            <Text style={styles.barChartLabelText} numberOfLines={2}>
              {result.option_text}
            </Text>
          </View>
          
          <View style={styles.barChartBarContainer}>
            <View
              style={[
                styles.barChartBar,
                {
                  width: `${Math.max(0, Math.min(100, result.percentage))}%` as any,
                  backgroundColor: getColorForIndex(index),
                },
              ]}
            />
          </View>
          
          <View style={styles.barChartValue}>
            <Text style={styles.barChartValueText}>{result.percentage.toFixed(1)}%</Text>
            <Text style={styles.barChartVoteCount}>({result.vote_count})</Text>
          </View>
        </View>
      ))}
    </View>
  );

  const renderPieChart = () => {
    if (pollType === 'ranked_choice' || pollType === 'budget_allocation') {
      return (
        <View style={styles.pieChartUnavailable}>
          <Text style={styles.pieChartUnavailableText}>
            Pie chart not available for {pollType === 'ranked_choice' ? 'ranked choice' : 'budget allocation'} polls
          </Text>
        </View>
      );
    }

    // Calculate pie chart segments
    let currentAngle = 0;
    const segments = sortedResults.map((result, index) => {
      const angle = (result.percentage / 100) * 360;
      const segment = {
        ...result,
        startAngle: currentAngle,
        endAngle: currentAngle + angle,
        color: getColorForIndex(index),
      };
      currentAngle += angle;
      return segment;
    });

    return (
      <View style={styles.pieChartContainer}>
        {/* Simplified pie chart representation using colored boxes */}
        <View style={styles.pieChartLegend}>
          {segments.map((segment) => (
            <View key={String(segment.option_id)} style={styles.pieChartLegendItem}>
              <View
                style={[
                  styles.pieChartLegendColor,
                  { backgroundColor: segment.color },
                ]}
              />
              <View style={styles.pieChartLegendText}>
                <Text style={styles.pieChartLegendLabel} numberOfLines={2}>
                  {segment.option_text}
                </Text>
                <Text style={styles.pieChartLegendValue}>
                  {segment.percentage.toFixed(1)}% ({segment.vote_count} votes)
                </Text>
              </View>
            </View>
          ))}
        </View>
      </View>
    );
  };

  const renderDemographicBreakdown = () => {
    if (!results.demographic_breakdown) {
      return (
        <View style={styles.demographicUnavailable}>
          <Text style={styles.demographicUnavailableText}>
            Demographic data not available for this poll
          </Text>
        </View>
      );
    }

    const { age_groups, wards } = results.demographic_breakdown;

    // Check if there's actually any data
    const hasAgeGroups = age_groups && Object.keys(age_groups).length > 0;
    const hasWards = wards && Object.keys(wards).length > 0;

    if (!hasAgeGroups && !hasWards) {
      return (
        <View style={styles.demographicUnavailable}>
          <Text style={styles.demographicUnavailableText}>
            Demographic data not available for this poll
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.demographicContainer}>
        {/* Age Groups */}
        {hasAgeGroups && (
          <View style={styles.demographicSection}>
            <Text style={styles.demographicSectionTitle}>By Age Group</Text>
            {Object.entries(age_groups!).map(([ageGroup, data]) => (
              <View key={ageGroup} style={styles.demographicRow}>
                <Text style={styles.demographicLabel}>{ageGroup}</Text>
                <View style={styles.demographicBarContainer}>
                  <View
                    style={[
                      styles.demographicBar,
                      { width: `${Math.max(0, Math.min(100, data.percentage))}%` as any },
                    ]}
                  />
                </View>
                <Text style={styles.demographicValue}>
                  {data.percentage.toFixed(1)}% ({data.vote_count})
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Wards */}
        {hasWards && (
          <View style={styles.demographicSection}>
            <Text style={styles.demographicSectionTitle}>By Ward</Text>
            {Object.entries(wards!).map(([ward, data]) => (
              <View key={ward} style={styles.demographicRow}>
                <Text style={styles.demographicLabel}>{ward}</Text>
                <View style={styles.demographicBarContainer}>
                  <View
                    style={[
                      styles.demographicBar,
                      { width: `${Math.max(0, Math.min(100, data.percentage))}%` as any },
                    ]}
                  />
                </View>
                <Text style={styles.demographicValue}>
                  {data.percentage.toFixed(1)}% ({data.vote_count})
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>
    );
  };

  const renderResultBar = (result: OptionResult, index: number) => (
    <View key={String(result.option_id)} style={styles.resultCard}>
      <View style={styles.resultHeader}>
        <View style={styles.resultHeaderLeft}>
          <View
            style={[
              styles.resultColorIndicator,
              { backgroundColor: getColorForIndex(index) },
            ]}
          />
          <Text style={styles.optionText} numberOfLines={2}>
            {result.option_text}
          </Text>
        </View>
        <Text style={styles.percentageText}>{result.percentage.toFixed(1)}%</Text>
      </View>

      <View style={styles.progressBar}>
        <View
          style={[
            styles.progressFill,
            {
              width: `${Math.max(0, Math.min(100, result.percentage))}%` as any,
              backgroundColor: getColorForIndex(index),
            },
          ]}
        />
      </View>

      <View style={styles.resultFooter}>
        <Text style={styles.voteCount}>
          {result.vote_count} vote{result.vote_count !== 1 ? 's' : ''}
        </Text>
        
        {pollType === 'ranked_choice' && result.average_rank && (
          <Text style={styles.rankText}>Avg rank: {result.average_rank.toFixed(1)}</Text>
        )}
        
        {pollType === 'budget_allocation' && result.total_budget_allocated !== undefined && (
          <Text style={styles.budgetText}>
            {formatCurrency(result.total_budget_allocated)}
          </Text>
        )}
      </View>
    </View>
  );

  const canShowPieChart = pollType === 'single_choice' || pollType === 'multiple_choice';

  return (
    <View style={styles.container}>
      {/* Summary */}
      <View style={styles.summaryCard}>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Total Votes:</Text>
          <Text style={styles.summaryValue}>{results.total_votes}</Text>
        </View>
        {results.turnout_percentage > 0 && (
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Turnout:</Text>
            <Text style={styles.summaryValue}>{results.turnout_percentage.toFixed(1)}%</Text>
          </View>
        )}
        {results.is_binding_threshold_met !== undefined && (
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Binding Threshold:</Text>
            <Text
              style={[
                styles.summaryValue,
                { color: results.is_binding_threshold_met ? '#4CAF50' : '#F44336' },
              ]}
            >
              {results.is_binding_threshold_met ? 'Met ✓' : 'Not Met'}
            </Text>
          </View>
        )}
      </View>

      {/* View Mode Toggle */}
      {canShowPieChart && sortedResults.length > 0 && (
        <View style={styles.viewModeToggle}>
          <TouchableOpacity
            style={[
              styles.viewModeButton,
              viewMode === 'bar' && styles.viewModeButtonActive,
            ]}
            onPress={() => setViewMode('bar')}
          >
            <Text
              style={[
                styles.viewModeButtonText,
                viewMode === 'bar' && styles.viewModeButtonTextActive,
              ]}
            >
              📊 Bar Chart
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.viewModeButton,
              viewMode === 'pie' && styles.viewModeButtonActive,
            ]}
            onPress={() => setViewMode('pie')}
          >
            <Text
              style={[
                styles.viewModeButtonText,
                viewMode === 'pie' && styles.viewModeButtonTextActive,
              ]}
            >
              🥧 Pie Chart
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Results Visualization */}
      {sortedResults.length > 0 ? (
        <View style={styles.resultsContainer}>
          {viewMode === 'bar' ? renderBarChart() : renderPieChart()}
        </View>
      ) : (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No votes yet</Text>
        </View>
      )}

      {/* Detailed Results List */}
      {sortedResults.length > 0 && (
        <View style={styles.detailedResultsContainer}>
          <Text style={styles.detailedResultsTitle}>Detailed Results</Text>
          {sortedResults.map((result, index) => renderResultBar(result, index))}
        </View>
      )}

      {/* Demographics Toggle */}
      {results.demographic_breakdown && (
        <TouchableOpacity
          style={styles.demographicToggle}
          onPress={() => setShowDemographicBreakdown(!showDemographicBreakdown)}
        >
          <Text style={styles.demographicToggleText}>
            {showDemographicBreakdown ? '▼' : '▶'} Demographic Breakdown
          </Text>
        </TouchableOpacity>
      )}

      {/* Demographic Breakdown */}
      {showDemographicBreakdown && renderDemographicBreakdown()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
  summaryCard: {
    backgroundColor: '#F5F5F5',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  viewModeToggle: {
    flexDirection: 'row',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 4,
    gap: 4,
  },
  viewModeButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  viewModeButtonActive: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  viewModeButtonText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  viewModeButtonTextActive: {
    color: '#333',
    fontWeight: '600',
  },
  resultsContainer: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
  },
  barChartContainer: {
    gap: 16,
  },
  barChartRow: {
    gap: 8,
  },
  barChartLabel: {
    marginBottom: 4,
  },
  barChartLabelText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  barChartBarContainer: {
    height: 32,
    backgroundColor: '#F0F0F0',
    borderRadius: 6,
    overflow: 'hidden',
  },
  barChartBar: {
    height: '100%',
    borderRadius: 6,
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  barChartValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  barChartValueText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  barChartVoteCount: {
    fontSize: 13,
    color: '#666',
  },
  pieChartContainer: {
    alignItems: 'center',
  },
  pieChartLegend: {
    width: '100%',
    gap: 12,
  },
  pieChartLegendItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  pieChartLegendColor: {
    width: 24,
    height: 24,
    borderRadius: 4,
    marginTop: 2,
  },
  pieChartLegendText: {
    flex: 1,
  },
  pieChartLegendLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  pieChartLegendValue: {
    fontSize: 13,
    color: '#666',
  },
  pieChartUnavailable: {
    padding: 32,
    alignItems: 'center',
  },
  pieChartUnavailableText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  detailedResultsContainer: {
    gap: 12,
  },
  detailedResultsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  resultCard: {
    backgroundColor: '#F5F5F5',
    padding: 16,
    borderRadius: 12,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  resultHeaderLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  resultColorIndicator: {
    width: 4,
    height: 20,
    borderRadius: 2,
    marginTop: 2,
  },
  optionText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  percentageText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginLeft: 12,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  resultFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  voteCount: {
    fontSize: 13,
    color: '#666',
  },
  rankText: {
    fontSize: 13,
    color: '#666',
    fontWeight: '600',
  },
  budgetText: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  demographicToggle: {
    backgroundColor: '#F5F5F5',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  demographicToggleText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  demographicContainer: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    gap: 20,
  },
  demographicSection: {
    gap: 12,
  },
  demographicSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  demographicRow: {
    gap: 8,
  },
  demographicLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  demographicBarContainer: {
    height: 24,
    backgroundColor: '#F0F0F0',
    borderRadius: 6,
    overflow: 'hidden',
  },
  demographicBar: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 6,
  },
  demographicValue: {
    fontSize: 13,
    color: '#666',
  },
  demographicUnavailable: {
    backgroundColor: '#F5F5F5',
    padding: 32,
    borderRadius: 12,
    alignItems: 'center',
  },
  demographicUnavailableText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  emptyState: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
  },
});
