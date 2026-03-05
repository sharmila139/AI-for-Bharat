/**
 * Poll Detail Screen
 * Task 36.5: Build poll voting interface
 * 
 * Features:
 * - Display full poll details
 * - Implement voting interface for each poll type
 * - Show results based on visibility settings
 * - Display eligibility information
 * - Show commitment for binding polls
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TextInput,
} from 'react-native';
import { OfflineIndicator } from '../../components/OfflineIndicator';
import { API_BASE_URL } from '../../config/api-config';
import { SingleChoiceVoting } from '../../components/polls/SingleChoiceVoting';
import { MultipleChoiceVoting } from '../../components/polls/MultipleChoiceVoting';
import { RankedChoiceVoting } from '../../components/polls/RankedChoiceVoting';
import { BudgetAllocationVoting } from '../../components/polls/BudgetAllocationVoting';
import { PollResults } from '../../components/polls/PollResults';

interface PollDetailScreenProps {
  navigation: any;
  route: any;
}

type PollType = 'single_choice' | 'multiple_choice' | 'ranked_choice' | 'budget_allocation';

interface PollOption {
  option_id: string;
  text: string;
  description?: string;
  budget_amount?: number;
}

interface PollDetail {
  poll_id: string;
  title: string;
  description?: string;
  poll_type: PollType;
  status: string;
  options: PollOption[];
  total_votes: number;
  eligible_voters_count?: number;
  is_binding: boolean;
  binding_threshold_percentage?: number;
  commitment_text?: string;
  start_date: string;
  end_date: string;
  user_has_voted: boolean;
  user_is_eligible: boolean;
  eligibility_reason?: string;
  show_results_before_voting: boolean;
  show_results_after_voting: boolean;
  show_real_time_results: boolean;
  allow_anonymous: boolean;
  eligibility_criteria?: any;
}

export const PollDetailScreen: React.FC<PollDetailScreenProps> = ({ navigation, route }) => {
  const { pollId } = route.params;

  const [loading, setLoading] = useState(true);
  const [poll, setPoll] = useState<PollDetail | null>(null);
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [voteData, setVoteData] = useState<any>(null);

  useEffect(() => {
    loadPollDetails();
  }, [pollId]);

  const loadPollDetails = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${API_BASE_URL}/api/community-polls/${pollId}`);
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to load poll');
      }

      setPoll(data.data);

      // Load results if allowed
      if (
        data.data.show_results_before_voting ||
        (data.data.user_has_voted && data.data.show_results_after_voting) ||
        data.data.show_real_time_results
      ) {
        await loadResults();
      }
    } catch (err: any) {
      console.error('Error loading poll:', err);
      setError(err.message || 'Failed to load poll');
    } finally {
      setLoading(false);
    }
  };

  const loadResults = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/community-polls/${pollId}/results`);
      const data = await response.json();

      if (data.success) {
        setResults(data.data);
      }
    } catch (err) {
      console.error('Error loading results:', err);
    }
  };

  const handleSubmitVote = async () => {
    if (!poll || !voteData) return;

    try {
      setSubmitting(true);

      const response = await fetch(`${API_BASE_URL}/api/community-polls/${pollId}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vote_data: voteData }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to submit vote');
      }

      Alert.alert('Success', 'Your vote has been submitted!', [
        {
          text: 'OK',
          onPress: () => {
            loadPollDetails();
          },
        },
      ]);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to submit vote');
    } finally {
      setSubmitting(false);
    }
  };

  const renderVotingInterface = () => {
    if (!poll) return null;

    if (poll.user_has_voted) {
      return (
        <View style={styles.votedContainer}>
          <Text style={styles.votedIcon}>✓</Text>
          <Text style={styles.votedTitle}>You have already voted</Text>
          <Text style={styles.votedText}>Thank you for participating!</Text>
        </View>
      );
    }

    if (!poll.user_is_eligible) {
      return (
        <View style={styles.ineligibleContainer}>
          <Text style={styles.ineligibleIcon}>⚠️</Text>
          <Text style={styles.ineligibleTitle}>Not Eligible</Text>
          <Text style={styles.ineligibleText}>
            {poll.eligibility_reason || 'You do not meet the eligibility criteria for this poll'}
          </Text>
        </View>
      );
    }

    if (poll.status !== 'active') {
      return (
        <View style={styles.closedContainer}>
          <Text style={styles.closedIcon}>🔒</Text>
          <Text style={styles.closedTitle}>Poll Closed</Text>
          <Text style={styles.closedText}>This poll is no longer accepting votes</Text>
        </View>
      );
    }

    switch (poll.poll_type) {
      case 'single_choice':
        return (
          <SingleChoiceVoting
            options={poll.options}
            onVoteChange={setVoteData}
            selectedOption={voteData?.selected_option}
          />
        );
      case 'multiple_choice':
        return (
          <MultipleChoiceVoting
            options={poll.options}
            onVoteChange={setVoteData}
            selectedOptions={voteData?.selected_options || []}
          />
        );
      case 'ranked_choice':
        return (
          <RankedChoiceVoting
            options={poll.options}
            onVoteChange={setVoteData}
            rankings={voteData?.rankings || []}
          />
        );
      case 'budget_allocation':
        return (
          <BudgetAllocationVoting
            options={poll.options}
            onVoteChange={setVoteData}
            allocations={voteData?.allocations || []}
          />
        );
      default:
        return null;
    }
  };

  const canShowResults = () => {
    if (!poll) return false;
    return (
      poll.show_results_before_voting ||
      (poll.user_has_voted && poll.show_results_after_voting) ||
      poll.show_real_time_results
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Loading poll...</Text>
      </View>
    );
  }

  if (error || !poll) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorIcon}>⚠️</Text>
        <Text style={styles.errorText}>{error || 'Poll not found'}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadPollDetails}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <OfflineIndicator />

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>{poll.title}</Text>
          {poll.description && <Text style={styles.description}>{poll.description}</Text>}
        </View>

        {/* Binding Info */}
        {poll.is_binding && poll.commitment_text && (
          <View style={styles.bindingInfo}>
            <Text style={styles.bindingIcon}>⚖️</Text>
            <View style={styles.bindingContent}>
              <Text style={styles.bindingTitle}>Binding Commitment</Text>
              <Text style={styles.bindingText}>{poll.commitment_text}</Text>
              {poll.binding_threshold_percentage && (
                <Text style={styles.bindingThreshold}>
                  Requires {poll.binding_threshold_percentage}% approval
                </Text>
              )}
            </View>
          </View>
        )}

        {/* Eligibility Criteria */}
        {poll.eligibility_criteria && (
          <View style={styles.eligibilityInfo}>
            <Text style={styles.sectionTitle}>Eligibility Criteria</Text>
            {/* Display eligibility criteria details */}
          </View>
        )}

        {/* Voting Interface */}
        <View style={styles.votingSection}>
          <Text style={styles.sectionTitle}>Cast Your Vote</Text>
          {renderVotingInterface()}
        </View>

        {/* Submit Button */}
        {poll.status === 'active' && poll.user_is_eligible && !poll.user_has_voted && voteData && (
          <TouchableOpacity
            style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
            onPress={handleSubmitVote}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.submitButtonText}>Submit Vote</Text>
            )}
          </TouchableOpacity>
        )}

        {/* Results */}
        {canShowResults() && results && (
          <View style={styles.resultsSection}>
            <Text style={styles.sectionTitle}>Results</Text>
            <PollResults results={results} pollType={poll.poll_type} />
          </View>
        )}

        {/* Stats */}
        <View style={styles.statsSection}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{poll.total_votes}</Text>
            <Text style={styles.statLabel}>Total Votes</Text>
          </View>
          {poll.eligible_voters_count && (
            <View style={styles.statCard}>
              <Text style={styles.statValue}>
                {Math.round((poll.total_votes / poll.eligible_voters_count) * 100)}%
              </Text>
              <Text style={styles.statLabel}>Turnout</Text>
            </View>
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
    padding: 20,
    backgroundColor: '#F5F5F5',
  },
  errorIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    paddingHorizontal: 24,
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
  header: {
    backgroundColor: '#fff',
    padding: 20,
    paddingTop: 40,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
  },
  bindingInfo: {
    flexDirection: 'row',
    backgroundColor: '#FFF3E0',
    padding: 16,
    margin: 16,
    borderRadius: 12,
  },
  bindingIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  bindingContent: {
    flex: 1,
  },
  bindingTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#F57C00',
    marginBottom: 4,
  },
  bindingText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 8,
  },
  bindingThreshold: {
    fontSize: 12,
    color: '#F57C00',
    fontWeight: '600',
  },
  eligibilityInfo: {
    backgroundColor: '#fff',
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
  },
  votingSection: {
    backgroundColor: '#fff',
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  votedContainer: {
    alignItems: 'center',
    padding: 32,
  },
  votedIcon: {
    fontSize: 64,
    color: '#4CAF50',
    marginBottom: 16,
  },
  votedTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  votedText: {
    fontSize: 16,
    color: '#666',
  },
  ineligibleContainer: {
    alignItems: 'center',
    padding: 32,
  },
  ineligibleIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  ineligibleTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  ineligibleText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  closedContainer: {
    alignItems: 'center',
    padding: 32,
  },
  closedIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  closedTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  closedText: {
    fontSize: 16,
    color: '#666',
  },
  submitButton: {
    backgroundColor: '#4CAF50',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  resultsSection: {
    backgroundColor: '#fff',
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
  },
  statsSection: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
  },
});

export default PollDetailScreen;

export default PollDetailScreen;
