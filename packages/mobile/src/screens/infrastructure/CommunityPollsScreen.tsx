/**
 * Community Polls Screen
 * 
 * Features:
 * - Poll listing with filters
 * - Support for 4 poll types: single choice, multiple choice, ranked choice, budget allocation
 * - Voting interface for each poll type
 * - Results display with charts/visualizations
 * - Demographic breakdowns
 * - Binding poll commitments
 * - Eligibility status
 * - Already voted indicator
 * - Result visibility settings
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
  TextInput,
  Modal,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

// ============================================================================
// TYPES
// ============================================================================

type PollType = 'single_choice' | 'multiple_choice' | 'ranked_choice' | 'budget_allocation';
type PollStatus = 'draft' | 'active' | 'closed' | 'cancelled';

interface PollOption {
  option_id: string;
  text: string;
  description?: string;
  budget_amount?: number;
}

interface Poll {
  poll_id: string;
  title: string;
  description?: string;
  poll_type: PollType;
  status: PollStatus;
  options: PollOption[];
  start_date: string;
  end_date: string;
  total_votes: number;
  is_binding: boolean;
  user_has_voted: boolean;
  user_is_eligible: boolean;
  eligibility_reason?: string;
  show_results_before_voting?: boolean;
  show_results_after_voting?: boolean;
  show_real_time_results?: boolean;
}

interface PollResults {
  poll_id: string;
  total_votes: number;
  turnout_percentage: number;
  results_by_option: Record<string, OptionResult>;
  demographic_breakdown?: DemographicBreakdown;
  is_binding_threshold_met?: boolean;
}

interface OptionResult {
  option_id: string;
  option_text: string;
  vote_count: number;
  percentage: number;
  average_rank?: number;
  total_budget_allocated?: number;
}

interface DemographicBreakdown {
  by_age_group: Record<string, Record<string, number>>;
  by_gender: Record<string, Record<string, number>>;
  by_district: Record<string, Record<string, number>>;
}

interface BindingCommitment {
  poll_id: string;
  is_binding: boolean;
  threshold_percentage?: number;
  threshold_met: boolean;
  commitment_text?: string;
  winning_option: OptionResult | null;
  total_votes: number;
  turnout_percentage: number;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const CommunityPollsScreen: React.FC = () => {
  const navigation = useNavigation();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [polls, setPolls] = useState<Poll[]>([]);
  const [selectedPoll, setSelectedPoll] = useState<Poll | null>(null);
  const [pollResults, setPollResults] = useState<PollResults | null>(null);
  const [bindingCommitment, setBindingCommitment] = useState<BindingCommitment | null>(null);
  const [showVoteModal, setShowVoteModal] = useState(false);
  const [showResultsModal, setShowResultsModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState<PollStatus | 'all'>('active');

  // Vote state for different poll types
  const [singleChoiceVote, setSingleChoiceVote] = useState<string>('');
  const [multipleChoiceVote, setMultipleChoiceVote] = useState<string[]>([]);
  const [rankedChoiceVote, setRankedChoiceVote] = useState<{ option_id: string; rank: number }[]>([]);
  const [budgetAllocationVote, setBudgetAllocationVote] = useState<{ option_id: string; amount: number }[]>([]);

  useEffect(() => {
    loadPolls();
  }, [filterStatus]);

  const loadPolls = async () => {
    try {
      setLoading(true);

      const statusParam = filterStatus === 'all' ? '' : `?status=${filterStatus}`;
      const response = await fetch(`${API_BASE_URL}/api/community-polls${statusParam}`);
      const data = await response.json();

      if (data.success) {
        setPolls(data.data);
      } else {
        Alert.alert('Error', 'Failed to load polls');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load polls');
      console.error(error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadPolls();
  };

  const handlePollPress = async (poll: Poll) => {
    setSelectedPoll(poll);
    
    // Reset vote state
    setSingleChoiceVote('');
    setMultipleChoiceVote([]);
    setRankedChoiceVote([]);
    setBudgetAllocationVote(poll.options.map(opt => ({ option_id: opt.option_id, amount: 0 })));

    // If user has voted or poll is closed, show results
    if (poll.user_has_voted || poll.status === 'closed') {
      await loadResults(poll.poll_id);
      setShowResultsModal(true);
    } else if (!poll.user_is_eligible) {
      Alert.alert('Not Eligible', poll.eligibility_reason || 'You are not eligible to vote in this poll');
    } else {
      setShowVoteModal(true);
    }
  };

  const loadResults = async (pollId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/community-polls/${pollId}/results`);
      const data = await response.json();

      if (data.success) {
        setPollResults(data.data);

        // Load binding commitment if applicable
        if (selectedPoll?.is_binding) {
          const commitmentResponse = await fetch(`${API_BASE_URL}/api/community-polls/${pollId}/commitment`);
          const commitmentData = await commitmentResponse.json();
          if (commitmentData.success) {
            setBindingCommitment(commitmentData.data);
          }
        }
      } else {
        Alert.alert('Results Hidden', data.message || 'Results are not available yet');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load results');
      console.error(error);
    }
  };

  const handleSubmitVote = async () => {
    if (!selectedPoll) return;

    let voteData: any;

    switch (selectedPoll.poll_type) {
      case 'single_choice':
        if (!singleChoiceVote) {
          Alert.alert('Error', 'Please select an option');
          return;
        }
        voteData = { selected_option: singleChoiceVote };
        break;

      case 'multiple_choice':
        if (multipleChoiceVote.length === 0) {
          Alert.alert('Error', 'Please select at least one option');
          return;
        }
        voteData = { selected_options: multipleChoiceVote };
        break;

      case 'ranked_choice':
        if (rankedChoiceVote.length === 0) {
          Alert.alert('Error', 'Please rank at least one option');
          return;
        }
        voteData = { rankings: rankedChoiceVote };
        break;

      case 'budget_allocation':
        const totalAllocated = budgetAllocationVote.reduce((sum, a) => sum + a.amount, 0);
        const totalBudget = selectedPoll.options.reduce((sum, opt) => sum + (opt.budget_amount || 0), 0);
        if (totalAllocated > totalBudget) {
          Alert.alert('Error', `Total allocation (${totalAllocated}) exceeds available budget (${totalBudget})`);
          return;
        }
        voteData = { allocations: budgetAllocationVote.filter(a => a.amount > 0) };
        break;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/community-polls/${selectedPoll.poll_id}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vote_data: voteData }),
      });

      const data = await response.json();

      if (data.success) {
        Alert.alert('Success', 'Your vote has been recorded!');
        setShowVoteModal(false);
        loadPolls(); // Refresh poll list
        
        // Show results if allowed
        if (selectedPoll.show_results_after_voting || selectedPoll.show_real_time_results) {
          await loadResults(selectedPoll.poll_id);
          setShowResultsModal(true);
        }
      } else {
        Alert.alert('Error', data.message || 'Failed to submit vote');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to submit vote');
      console.error(error);
    }
  };

  const toggleMultipleChoice = (optionId: string) => {
    if (multipleChoiceVote.includes(optionId)) {
      setMultipleChoiceVote(multipleChoiceVote.filter(id => id !== optionId));
    } else {
      setMultipleChoiceVote([...multipleChoiceVote, optionId]);
    }
  };

  const handleRankOption = (optionId: string, rank: number) => {
    const existing = rankedChoiceVote.find(r => r.option_id === optionId);
    if (existing) {
      setRankedChoiceVote(rankedChoiceVote.map(r => 
        r.option_id === optionId ? { ...r, rank } : r
      ));
    } else {
      setRankedChoiceVote([...rankedChoiceVote, { option_id: optionId, rank }]);
    }
  };

  const handleBudgetAllocation = (optionId: string, amount: number) => {
    setBudgetAllocationVote(budgetAllocationVote.map(a =>
      a.option_id === optionId ? { ...a, amount } : a
    ));
  };

  const getPollTypeIcon = (type: PollType): string => {
    const icons: Record<PollType, string> = {
      single_choice: 'radiobox-marked',
      multiple_choice: 'checkbox-marked',
      ranked_choice: 'format-list-numbered',
      budget_allocation: 'currency-usd',
    };
    return icons[type];
  };

  const getPollTypeLabel = (type: PollType): string => {
    const labels: Record<PollType, string> = {
      single_choice: 'Single Choice',
      multiple_choice: 'Multiple Choice',
      ranked_choice: 'Ranked Choice',
      budget_allocation: 'Budget Allocation',
    };
    return labels[type];
  };

  const getStatusColor = (status: PollStatus): string => {
    const colors: Record<PollStatus, string> = {
      draft: '#808080',
      active: '#4CAF50',
      closed: '#2196F3',
      cancelled: '#DC143C',
    };
    return colors[status];
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const getDaysRemaining = (endDate: string): number => {
    const end = new Date(endDate);
    const now = new Date();
    const diff = end.getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Loading polls...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Filter Tabs */}
      <View style={styles.filterTabs}>
        <TouchableOpacity
          style={[styles.filterTab, filterStatus === 'active' && styles.filterTabActive]}
          onPress={() => setFilterStatus('active')}
        >
          <Text style={[styles.filterTabText, filterStatus === 'active' && styles.filterTabTextActive]}>
            Active
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterTab, filterStatus === 'closed' && styles.filterTabActive]}
          onPress={() => setFilterStatus('closed')}
        >
          <Text style={[styles.filterTabText, filterStatus === 'closed' && styles.filterTabTextActive]}>
            Closed
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterTab, filterStatus === 'all' && styles.filterTabActive]}
          onPress={() => setFilterStatus('all')}
        >
          <Text style={[styles.filterTabText, filterStatus === 'all' && styles.filterTabTextActive]}>
            All
          </Text>
        </TouchableOpacity>
      </View>

      {/* Poll List */}
      <ScrollView
        style={styles.pollList}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {polls.length === 0 ? (
          <View style={styles.emptyState}>
            <Icon name="vote" size={64} color="#CCC" />
            <Text style={styles.emptyText}>No polls available</Text>
          </View>
        ) : (
          polls.map((poll) => (
            <TouchableOpacity
              key={poll.poll_id}
              style={styles.pollCard}
              onPress={() => handlePollPress(poll)}
            >
              <View style={styles.pollHeader}>
                <View style={styles.pollTypeRow}>
                  <Icon name={getPollTypeIcon(poll.poll_type)} size={20} color="#4CAF50" />
                  <Text style={styles.pollTypeText}>{getPollTypeLabel(poll.poll_type)}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(poll.status) }]}>
                  <Text style={styles.statusText}>{poll.status.toUpperCase()}</Text>
                </View>
              </View>

              <Text style={styles.pollTitle}>{poll.title}</Text>
              {poll.description && (
                <Text style={styles.pollDescription} numberOfLines={2}>
                  {poll.description}
                </Text>
              )}

              <View style={styles.pollMeta}>
                <View style={styles.metaItem}>
                  <Icon name="calendar" size={16} color="#666" />
                  <Text style={styles.metaText}>
                    {poll.status === 'active' 
                      ? `${getDaysRemaining(poll.end_date)} days left`
                      : `Ended ${formatDate(poll.end_date)}`
                    }
                  </Text>
                </View>
                <View style={styles.metaItem}>
                  <Icon name="account-group" size={16} color="#666" />
                  <Text style={styles.metaText}>{poll.total_votes} votes</Text>
                </View>
              </View>

              {poll.is_binding && (
                <View style={styles.bindingBadge}>
                  <Icon name="gavel" size={16} color="#FF9800" />
                  <Text style={styles.bindingText}>BINDING POLL</Text>
                </View>
              )}

              {poll.user_has_voted && (
                <View style={styles.votedBadge}>
                  <Icon name="check-circle" size={16} color="#4CAF50" />
                  <Text style={styles.votedText}>You voted</Text>
                </View>
              )}

              {!poll.user_is_eligible && (
                <View style={styles.ineligibleBadge}>
                  <Icon name="alert-circle" size={16} color="#DC143C" />
                  <Text style={styles.ineligibleText}>Not eligible</Text>
                </View>
              )}
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {/* Vote Modal */}
      {selectedPoll && (
        <VoteModal
          visible={showVoteModal}
          poll={selectedPoll}
          singleChoiceVote={singleChoiceVote}
          setSingleChoiceVote={setSingleChoiceVote}
          multipleChoiceVote={multipleChoiceVote}
          toggleMultipleChoice={toggleMultipleChoice}
          rankedChoiceVote={rankedChoiceVote}
          handleRankOption={handleRankOption}
          budgetAllocationVote={budgetAllocationVote}
          handleBudgetAllocation={handleBudgetAllocation}
          onSubmit={handleSubmitVote}
          onClose={() => setShowVoteModal(false)}
        />
      )}

      {/* Results Modal */}
      {selectedPoll && pollResults && (
        <ResultsModal
          visible={showResultsModal}
          poll={selectedPoll}
          results={pollResults}
          bindingCommitment={bindingCommitment}
          onClose={() => setShowResultsModal(false)}
        />
      )}
    </View>
  );
};

// ============================================================================
// VOTE MODAL COMPONENT
// ============================================================================

interface VoteModalProps {
  visible: boolean;
  poll: Poll;
  singleChoiceVote: string;
  setSingleChoiceVote: (value: string) => void;
  multipleChoiceVote: string[];
  toggleMultipleChoice: (optionId: string) => void;
  rankedChoiceVote: { option_id: string; rank: number }[];
  handleRankOption: (optionId: string, rank: number) => void;
  budgetAllocationVote: { option_id: string; amount: number }[];
  handleBudgetAllocation: (optionId: string, amount: number) => void;
  onSubmit: () => void;
  onClose: () => void;
}

const VoteModal: React.FC<VoteModalProps> = ({
  visible,
  poll,
  singleChoiceVote,
  setSingleChoiceVote,
  multipleChoiceVote,
  toggleMultipleChoice,
  rankedChoiceVote,
  handleRankOption,
  budgetAllocationVote,
  handleBudgetAllocation,
  onSubmit,
  onClose,
}) => {
  const renderVoteInterface = () => {
    switch (poll.poll_type) {
      case 'single_choice':
        return (
          <View>
            {poll.options.map((option) => (
              <TouchableOpacity
                key={option.option_id}
                style={[
                  styles.optionButton,
                  singleChoiceVote === option.option_id && styles.optionButtonSelected,
                ]}
                onPress={() => setSingleChoiceVote(option.option_id)}
              >
                <Icon
                  name={singleChoiceVote === option.option_id ? 'radiobox-marked' : 'radiobox-blank'}
                  size={24}
                  color={singleChoiceVote === option.option_id ? '#4CAF50' : '#999'}
                />
                <View style={styles.optionContent}>
                  <Text style={styles.optionText}>{option.text}</Text>
                  {option.description && (
                    <Text style={styles.optionDescription}>{option.description}</Text>
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        );

      case 'multiple_choice':
        return (
          <View>
            {poll.options.map((option) => (
              <TouchableOpacity
                key={option.option_id}
                style={[
                  styles.optionButton,
                  multipleChoiceVote.includes(option.option_id) && styles.optionButtonSelected,
                ]}
                onPress={() => toggleMultipleChoice(option.option_id)}
              >
                <Icon
                  name={multipleChoiceVote.includes(option.option_id) ? 'checkbox-marked' : 'checkbox-blank-outline'}
                  size={24}
                  color={multipleChoiceVote.includes(option.option_id) ? '#4CAF50' : '#999'}
                />
                <View style={styles.optionContent}>
                  <Text style={styles.optionText}>{option.text}</Text>
                  {option.description && (
                    <Text style={styles.optionDescription}>{option.description}</Text>
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        );

      case 'ranked_choice':
        return (
          <View>
            <Text style={styles.instructionText}>Rank options from 1 (most preferred) to {poll.options.length}</Text>
            {poll.options.map((option) => {
              const ranking = rankedChoiceVote.find(r => r.option_id === option.option_id);
              return (
                <View key={option.option_id} style={styles.rankedOption}>
                  <View style={styles.optionContent}>
                    <Text style={styles.optionText}>{option.text}</Text>
                    {option.description && (
                      <Text style={styles.optionDescription}>{option.description}</Text>
                    )}
                  </View>
                  <View style={styles.rankSelector}>
                    {[1, 2, 3, 4, 5].slice(0, poll.options.length).map((rank) => (
                      <TouchableOpacity
                        key={rank}
                        style={[
                          styles.rankButton,
                          ranking?.rank === rank && styles.rankButtonSelected,
                        ]}
                        onPress={() => handleRankOption(option.option_id, rank)}
                      >
                        <Text
                          style={[
                            styles.rankButtonText,
                            ranking?.rank === rank && styles.rankButtonTextSelected,
                          ]}
                        >
                          {rank}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              );
            })}
          </View>
        );

      case 'budget_allocation':
        const totalBudget = poll.options.reduce((sum, opt) => sum + (opt.budget_amount || 0), 0);
        const totalAllocated = budgetAllocationVote.reduce((sum, a) => sum + a.amount, 0);
        const remaining = totalBudget - totalAllocated;

        return (
          <View>
            <View style={styles.budgetHeader}>
              <Text style={styles.budgetLabel}>Total Budget: ₹{totalBudget.toLocaleString()}</Text>
              <Text style={[styles.budgetLabel, remaining < 0 && styles.budgetExceeded]}>
                Remaining: ₹{remaining.toLocaleString()}
              </Text>
            </View>
            {poll.options.map((option) => {
              const allocation = budgetAllocationVote.find(a => a.option_id === option.option_id);
              return (
                <View key={option.option_id} style={styles.budgetOption}>
                  <View style={styles.optionContent}>
                    <Text style={styles.optionText}>{option.text}</Text>
                    {option.description && (
                      <Text style={styles.optionDescription}>{option.description}</Text>
                    )}
                    <Text style={styles.budgetMax}>Max: ₹{option.budget_amount?.toLocaleString()}</Text>
                  </View>
                  <TextInput
                    style={styles.budgetInput}
                    keyboardType="numeric"
                    placeholder="0"
                    value={allocation?.amount ? allocation.amount.toString() : ''}
                    onChangeText={(text) => {
                      const amount = parseInt(text) || 0;
                      handleBudgetAllocation(option.option_id, Math.min(amount, option.budget_amount || 0));
                    }}
                  />
                </View>
              );
            })}
          </View>
        );
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{poll.title}</Text>
            <TouchableOpacity onPress={onClose}>
              <Icon name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody}>
            {poll.description && (
              <Text style={styles.modalDescription}>{poll.description}</Text>
            )}
            {renderVoteInterface()}
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.submitButton} onPress={onSubmit}>
              <Text style={styles.submitButtonText}>Submit Vote</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

// ============================================================================
// RESULTS MODAL COMPONENT
// ============================================================================

interface ResultsModalProps {
  visible: boolean;
  poll: Poll;
  results: PollResults;
  bindingCommitment: BindingCommitment | null;
  onClose: () => void;
}

const ResultsModal: React.FC<ResultsModalProps> = ({
  visible,
  poll,
  results,
  bindingCommitment,
  onClose,
}) => {
  const [showDemographics, setShowDemographics] = useState(false);

  const renderResultsChart = () => {
    const sortedResults = Object.values(results.results_by_option).sort((a, b) => {
      if (poll.poll_type === 'ranked_choice') {
        return (a.average_rank || Infinity) - (b.average_rank || Infinity);
      }
      return b.percentage - a.percentage;
    });

    return (
      <View style={styles.resultsChart}>
        {sortedResults.map((result, index) => (
          <View key={result.option_id} style={styles.resultRow}>
            <View style={styles.resultHeader}>
              <View style={styles.resultRank}>
                <Text style={styles.resultRankText}>#{index + 1}</Text>
              </View>
              <Text style={styles.resultOptionText}>{result.option_text}</Text>
            </View>

            <View style={styles.resultBar}>
              <View
                style={[
                  styles.resultBarFill,
                  { width: `${result.percentage}%` },
                ]}
              />
            </View>

            <View style={styles.resultStats}>
              <Text style={styles.resultPercentage}>{result.percentage.toFixed(1)}%</Text>
              <Text style={styles.resultVotes}>{result.vote_count} votes</Text>
              {poll.poll_type === 'ranked_choice' && result.average_rank && (
                <Text style={styles.resultRankAvg}>Avg rank: {result.average_rank.toFixed(2)}</Text>
              )}
              {poll.poll_type === 'budget_allocation' && result.total_budget_allocated && (
                <Text style={styles.resultBudget}>₹{result.total_budget_allocated.toLocaleString()}</Text>
              )}
            </View>
          </View>
        ))}
      </View>
    );
  };

  const renderDemographics = () => {
    if (!results.demographic_breakdown) {
      return (
        <Text style={styles.noDemographics}>Demographic data not available for anonymous polls</Text>
      );
    }

    const { by_age_group, by_gender, by_district } = results.demographic_breakdown;

    return (
      <View style={styles.demographicsContainer}>
        {/* By Age Group */}
        {Object.keys(by_age_group).length > 0 && (
          <View style={styles.demographicSection}>
            <Text style={styles.demographicTitle}>By Age Group</Text>
            {Object.entries(by_age_group).map(([ageGroup, votes]) => (
              <View key={ageGroup} style={styles.demographicRow}>
                <Text style={styles.demographicLabel}>{ageGroup.replace('_', '-')}</Text>
                <Text style={styles.demographicValue}>
                  {Object.values(votes).reduce((sum, v) => sum + v, 0)} votes
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* By Gender */}
        {Object.keys(by_gender).length > 0 && (
          <View style={styles.demographicSection}>
            <Text style={styles.demographicTitle}>By Gender</Text>
            {Object.entries(by_gender).map(([gender, votes]) => (
              <View key={gender} style={styles.demographicRow}>
                <Text style={styles.demographicLabel}>{gender}</Text>
                <Text style={styles.demographicValue}>
                  {Object.values(votes).reduce((sum, v) => sum + v, 0)} votes
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* By District */}
        {Object.keys(by_district).length > 0 && (
          <View style={styles.demographicSection}>
            <Text style={styles.demographicTitle}>By District</Text>
            {Object.entries(by_district).map(([district, votes]) => (
              <View key={district} style={styles.demographicRow}>
                <Text style={styles.demographicLabel}>{district}</Text>
                <Text style={styles.demographicValue}>
                  {Object.values(votes).reduce((sum, v) => sum + v, 0)} votes
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Poll Results</Text>
            <TouchableOpacity onPress={onClose}>
              <Icon name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody}>
            <Text style={styles.pollTitleInModal}>{poll.title}</Text>

            {/* Summary Stats */}
            <View style={styles.summaryStats}>
              <View style={styles.statCard}>
                <Icon name="account-group" size={32} color="#4CAF50" />
                <Text style={styles.statValue}>{results.total_votes}</Text>
                <Text style={styles.statLabel}>Total Votes</Text>
              </View>
              <View style={styles.statCard}>
                <Icon name="percent" size={32} color="#2196F3" />
                <Text style={styles.statValue}>{results.turnout_percentage.toFixed(1)}%</Text>
                <Text style={styles.statLabel}>Turnout</Text>
              </View>
            </View>

            {/* Binding Commitment */}
            {bindingCommitment && (
              <View style={styles.commitmentCard}>
                <View style={styles.commitmentHeader}>
                  <Icon name="gavel" size={24} color="#FF9800" />
                  <Text style={styles.commitmentTitle}>Binding Commitment</Text>
                </View>
                {bindingCommitment.threshold_met ? (
                  <View>
                    <Text style={styles.commitmentMet}>✓ Threshold Met</Text>
                    {bindingCommitment.winning_option && (
                      <Text style={styles.winningOption}>
                        Winning Option: {bindingCommitment.winning_option.option_text}
                      </Text>
                    )}
                    {bindingCommitment.commitment_text && (
                      <Text style={styles.commitmentText}>{bindingCommitment.commitment_text}</Text>
                    )}
                  </View>
                ) : (
                  <Text style={styles.commitmentNotMet}>
                    Threshold not met ({bindingCommitment.threshold_percentage}% required)
                  </Text>
                )}
              </View>
            )}

            {/* Results Chart */}
            {renderResultsChart()}

            {/* Demographics Toggle */}
            <TouchableOpacity
              style={styles.demographicsToggle}
              onPress={() => setShowDemographics(!showDemographics)}
            >
              <Text style={styles.demographicsToggleText}>
                {showDemographics ? 'Hide' : 'Show'} Demographic Breakdown
              </Text>
              <Icon
                name={showDemographics ? 'chevron-up' : 'chevron-down'}
                size={24}
                color="#4CAF50"
              />
            </TouchableOpacity>

            {showDemographics && renderDemographics()}
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
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
  filterTabs: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  filterTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  filterTabActive: {
    backgroundColor: '#E8F5E9',
  },
  filterTabText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  filterTabTextActive: {
    color: '#4CAF50',
  },
  pollList: {
    flex: 1,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: '#999',
  },
  pollCard: {
    backgroundColor: '#FFF',
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  pollHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  pollTypeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pollTypeText: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '700',
  },
  pollTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
  },
  pollDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 12,
  },
  pollMeta: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 8,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: '#666',
  },
  bindingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
    paddingVertical: 4,
  },
  bindingText: {
    fontSize: 12,
    color: '#FF9800',
    fontWeight: '700',
  },
  votedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
  },
  votedText: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '600',
  },
  ineligibleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
  },
  ineligibleText: {
    fontSize: 12,
    color: '#DC143C',
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
  },
  modalBody: {
    padding: 16,
  },
  modalDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 16,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    marginBottom: 12,
  },
  optionButtonSelected: {
    borderColor: '#4CAF50',
    backgroundColor: '#E8F5E9',
  },
  optionContent: {
    flex: 1,
    marginLeft: 12,
  },
  optionText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 18,
  },
  instructionText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    fontStyle: 'italic',
  },
  rankedOption: {
    marginBottom: 16,
  },
  rankSelector: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  rankButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#DDD',
    justifyContent: 'center',
    alignItems: 'center',
  },
  rankButtonSelected: {
    borderColor: '#4CAF50',
    backgroundColor: '#4CAF50',
  },
  rankButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#666',
  },
  rankButtonTextSelected: {
    color: '#FFF',
  },
  budgetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    marginBottom: 16,
  },
  budgetLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  budgetExceeded: {
    color: '#DC143C',
  },
  budgetOption: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  budgetMax: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  budgetInput: {
    width: 100,
    height: 40,
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
    textAlign: 'right',
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#EEE',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  submitButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#4CAF50',
    alignItems: 'center',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
  closeButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#4CAF50',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
  pollTitleInModal: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 16,
  },
  summaryStats: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  commitmentCard: {
    backgroundColor: '#FFF3E0',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FF9800',
  },
  commitmentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  commitmentTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FF9800',
  },
  commitmentMet: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4CAF50',
    marginBottom: 8,
  },
  commitmentNotMet: {
    fontSize: 14,
    fontWeight: '600',
    color: '#DC143C',
  },
  winningOption: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  commitmentText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  resultsChart: {
    marginBottom: 16,
  },
  resultRow: {
    marginBottom: 16,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  resultRank: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  resultRankText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFF',
  },
  resultOptionText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  resultBar: {
    height: 24,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 8,
  },
  resultBarFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
  },
  resultStats: {
    flexDirection: 'row',
    gap: 16,
  },
  resultPercentage: {
    fontSize: 16,
    fontWeight: '700',
    color: '#4CAF50',
  },
  resultVotes: {
    fontSize: 14,
    color: '#666',
  },
  resultRankAvg: {
    fontSize: 14,
    color: '#666',
  },
  resultBudget: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FF9800',
  },
  demographicsToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    marginBottom: 16,
  },
  demographicsToggleText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4CAF50',
  },
  demographicsContainer: {
    marginBottom: 16,
  },
  noDemographics: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
    textAlign: 'center',
    padding: 16,
  },
  demographicSection: {
    marginBottom: 16,
  },
  demographicTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
  },
  demographicRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  demographicLabel: {
    fontSize: 14,
    color: '#666',
    textTransform: 'capitalize',
  },
  demographicValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
});

// API Base URL (replace with actual URL)
const API_BASE_URL = 'http://localhost:3000';

export default CommunityPollsScreen;
