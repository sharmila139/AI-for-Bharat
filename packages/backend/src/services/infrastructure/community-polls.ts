/**
 * Community Opinion Polls Service
 * 
 * Handles:
 * - Poll creation and management (Task 22.1)
 * - Multiple poll types: single, multiple, ranked, budget (Task 22.2)
 * - Eligibility criteria validation (Task 22.3)
 * - Voting system with duplicate prevention (Task 22.4)
 * - Anonymous voting with one-way hashing (Task 22.5)
 * - Real-time and hidden result display (Task 22.6)
 * - Result calculation with demographic breakdown (Task 22.7)
 * - Binding poll commitment tracking (Task 22.8)
 */

import { Pool } from 'pg';
import crypto from 'crypto';

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

export type PollType = 'single_choice' | 'multiple_choice' | 'ranked_choice' | 'budget_allocation';
export type PollStatus = 'draft' | 'active' | 'closed' | 'cancelled';

export interface PollOption {
  option_id: string;
  text: string;
  description?: string;
  budget_amount?: number; // For budget allocation polls
}

export interface EligibilityCriteria {
  min_age?: number;
  max_age?: number;
  districts?: string[];
  states?: string[];
  occupations?: string[];
  require_verification?: boolean;
}

export interface CreatePollData {
  created_by: string;
  title: string;
  description?: string;
  poll_type: PollType;
  options: PollOption[];
  eligibility_criteria?: EligibilityCriteria;
  allow_anonymous?: boolean;
  require_verification?: boolean;
  max_votes_per_user?: number;
  show_results_before_voting?: boolean;
  show_results_after_voting?: boolean;
  show_real_time_results?: boolean;
  is_binding?: boolean;
  binding_threshold_percentage?: number;
  commitment_text?: string;
  start_date: Date;
  end_date: Date;
}

export interface UpdatePollData {
  title?: string;
  description?: string;
  options?: PollOption[];
  eligibility_criteria?: EligibilityCriteria;
  start_date?: Date;
  end_date?: Date;
  status?: PollStatus;
}

export interface VoteData {
  poll_id: string;
  user_id: string;
  vote_data: SingleChoiceVote | MultipleChoiceVote | RankedChoiceVote | BudgetAllocationVote;
  voter_age?: number;
  voter_gender?: string;
  voter_district?: string;
  voter_state?: string;
}

export interface SingleChoiceVote {
  selected_option: string; // option_id
}

export interface MultipleChoiceVote {
  selected_options: string[]; // array of option_ids
}

export interface RankedChoiceVote {
  rankings: { option_id: string; rank: number }[];
}

export interface BudgetAllocationVote {
  allocations: { option_id: string; amount: number }[];
}

export interface PollResults {
  poll_id: string;
  total_votes: number;
  turnout_percentage: number;
  results_by_option: Record<string, OptionResult>;
  demographic_breakdown?: DemographicBreakdown;
  is_binding_threshold_met?: boolean;
}

export interface OptionResult {
  option_id: string;
  option_text: string;
  vote_count: number;
  percentage: number;
  average_rank?: number; // For ranked choice
  total_budget_allocated?: number; // For budget allocation
}

export interface DemographicBreakdown {
  by_age_group: Record<string, Record<string, number>>;
  by_gender: Record<string, Record<string, number>>;
  by_district: Record<string, Record<string, number>>;
}

export interface UserProfile {
  user_id: string;
  age?: number;
  gender?: string;
  district?: string;
  state?: string;
  occupation?: string;
  is_verified?: boolean;
}

// ============================================================================
// COMMUNITY POLLS SERVICE
// ============================================================================

export class CommunityPollsService {
  constructor(private pool: Pool) {}

  // ==========================================================================
  // TASK 22.1: Poll Creation and Management System
  // ==========================================================================

  /**
   * Create a new poll
   */
  async createPoll(data: CreatePollData): Promise<string> {
    // Validate dates
    if (data.end_date <= data.start_date) {
      throw new Error('End date must be after start date');
    }

    // Validate options
    if (!data.options || data.options.length < 2) {
      throw new Error('Poll must have at least 2 options');
    }

    // Validate budget allocation
    if (data.poll_type === 'budget_allocation') {
      const hasValidBudgets = data.options.every(opt => 
        opt.budget_amount !== undefined && opt.budget_amount > 0
      );
      if (!hasValidBudgets) {
        throw new Error('Budget allocation polls require budget_amount for all options');
      }
    }

    const result = await this.pool.query(
      `INSERT INTO polls (
        created_by, title, description, poll_type, options,
        eligibility_criteria, eligible_districts, eligible_states,
        min_age, max_age, allow_anonymous, require_verification,
        max_votes_per_user, show_results_before_voting,
        show_results_after_voting, show_real_time_results,
        is_binding, binding_threshold_percentage, commitment_text,
        start_date, end_date, status
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22
      ) RETURNING poll_id`,
      [
        data.created_by,
        data.title,
        data.description,
        data.poll_type,
        JSON.stringify(data.options),
        JSON.stringify(data.eligibility_criteria || {}),
        data.eligibility_criteria?.districts || null,
        data.eligibility_criteria?.states || null,
        data.eligibility_criteria?.min_age || null,
        data.eligibility_criteria?.max_age || null,
        data.allow_anonymous ?? false,
        data.require_verification ?? true,
        data.max_votes_per_user ?? 1,
        data.show_results_before_voting ?? false,
        data.show_results_after_voting ?? true,
        data.show_real_time_results ?? false,
        data.is_binding ?? false,
        data.binding_threshold_percentage || null,
        data.commitment_text || null,
        data.start_date,
        data.end_date,
        'draft',
      ]
    );

    return result.rows[0].poll_id;
  }

  /**
   * Update an existing poll
   */
  async updatePoll(pollId: string, data: UpdatePollData): Promise<void> {
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (data.title !== undefined) {
      updates.push(`title = $${paramIndex++}`);
      values.push(data.title);
    }

    if (data.description !== undefined) {
      updates.push(`description = $${paramIndex++}`);
      values.push(data.description);
    }

    if (data.options !== undefined) {
      updates.push(`options = $${paramIndex++}`);
      values.push(JSON.stringify(data.options));
    }

    if (data.eligibility_criteria !== undefined) {
      updates.push(`eligibility_criteria = $${paramIndex++}`);
      values.push(JSON.stringify(data.eligibility_criteria));
      
      if (data.eligibility_criteria.districts) {
        updates.push(`eligible_districts = $${paramIndex++}`);
        values.push(data.eligibility_criteria.districts);
      }
      
      if (data.eligibility_criteria.states) {
        updates.push(`eligible_states = $${paramIndex++}`);
        values.push(data.eligibility_criteria.states);
      }
      
      if (data.eligibility_criteria.min_age !== undefined) {
        updates.push(`min_age = $${paramIndex++}`);
        values.push(data.eligibility_criteria.min_age);
      }
      
      if (data.eligibility_criteria.max_age !== undefined) {
        updates.push(`max_age = $${paramIndex++}`);
        values.push(data.eligibility_criteria.max_age);
      }
    }

    if (data.start_date !== undefined) {
      updates.push(`start_date = $${paramIndex++}`);
      values.push(data.start_date);
    }

    if (data.end_date !== undefined) {
      updates.push(`end_date = $${paramIndex++}`);
      values.push(data.end_date);
    }

    if (data.status !== undefined) {
      updates.push(`status = $${paramIndex++}`);
      values.push(data.status);
    }

    if (updates.length === 0) {
      return;
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(pollId);

    await this.pool.query(
      `UPDATE polls SET ${updates.join(', ')} WHERE poll_id = $${paramIndex}`,
      values
    );
  }

  /**
   * Get poll by ID
   */
  async getPoll(pollId: string) {
    const result = await this.pool.query(
      `SELECT * FROM polls WHERE poll_id = $1`,
      [pollId]
    );

    if (result.rows.length === 0) {
      throw new Error('Poll not found');
    }

    const row = result.rows[0];
    return {
      poll_id: row.poll_id,
      created_by: row.created_by,
      title: row.title,
      description: row.description,
      poll_type: row.poll_type,
      options: row.options,
      eligibility_criteria: row.eligibility_criteria,
      allow_anonymous: row.allow_anonymous,
      require_verification: row.require_verification,
      max_votes_per_user: row.max_votes_per_user,
      show_results_before_voting: row.show_results_before_voting,
      show_results_after_voting: row.show_results_after_voting,
      show_real_time_results: row.show_real_time_results,
      is_binding: row.is_binding,
      binding_threshold_percentage: row.binding_threshold_percentage,
      commitment_text: row.commitment_text,
      start_date: new Date(row.start_date),
      end_date: new Date(row.end_date),
      status: row.status,
      total_votes: row.total_votes,
      results: row.results,
      demographic_breakdown: row.demographic_breakdown,
      created_at: new Date(row.created_at),
      updated_at: new Date(row.updated_at),
    };
  }

  /**
   * Delete a poll
   */
  async deletePoll(pollId: string): Promise<void> {
    await this.pool.query(
      `DELETE FROM polls WHERE poll_id = $1`,
      [pollId]
    );
  }

  /**
   * Activate a poll (change status from draft to active)
   */
  async activatePoll(pollId: string): Promise<void> {
    const poll = await this.getPoll(pollId);
    
    if (poll.status !== 'draft') {
      throw new Error('Only draft polls can be activated');
    }

    await this.updatePoll(pollId, { status: 'active' });
  }

  /**
   * Close a poll
   */
  async closePoll(pollId: string): Promise<void> {
    await this.updatePoll(pollId, { status: 'closed' });
    
    // Calculate final results
    await this.calculateResults(pollId);
  }

  // ==========================================================================
  // TASK 22.3: Eligibility Criteria Validation
  // ==========================================================================

  /**
   * Check if user is eligible to vote in a poll
   */
  async isUserEligible(pollId: string, userProfile: UserProfile): Promise<{ eligible: boolean; reason?: string }> {
    const poll = await this.getPoll(pollId);
    const criteria = poll.eligibility_criteria;

    // Check verification requirement
    if (poll.require_verification && !userProfile.is_verified) {
      return { eligible: false, reason: 'User verification required' };
    }

    // Check age range
    if (criteria.min_age !== undefined && userProfile.age !== undefined) {
      if (userProfile.age < criteria.min_age) {
        return { eligible: false, reason: `Minimum age requirement: ${criteria.min_age}` };
      }
    }

    if (criteria.max_age !== undefined && userProfile.age !== undefined) {
      if (userProfile.age > criteria.max_age) {
        return { eligible: false, reason: `Maximum age requirement: ${criteria.max_age}` };
      }
    }

    // Check location (district)
    if (criteria.districts && criteria.districts.length > 0) {
      if (!userProfile.district || !criteria.districts.includes(userProfile.district)) {
        return { eligible: false, reason: 'Not in eligible district' };
      }
    }

    // Check location (state)
    if (criteria.states && criteria.states.length > 0) {
      if (!userProfile.state || !criteria.states.includes(userProfile.state)) {
        return { eligible: false, reason: 'Not in eligible state' };
      }
    }

    // Check occupation
    if (criteria.occupations && criteria.occupations.length > 0) {
      if (!userProfile.occupation || !criteria.occupations.includes(userProfile.occupation)) {
        return { eligible: false, reason: 'Occupation not eligible' };
      }
    }

    return { eligible: true };
  }

  /**
   * Validate eligibility criteria
   * Currently unused but kept for future validation needs
   */
  /*
  private validateEligibilityCriteria(_criteria: EligibilityCriteria): void {
    if (_criteria.min_age !== undefined && _criteria.max_age !== undefined) {
      if (_criteria.min_age > _criteria.max_age) {
        throw new Error('Minimum age cannot be greater than maximum age');
      }
    }

    if (_criteria.min_age !== undefined && _criteria.min_age < 0) {
      throw new Error('Minimum age cannot be negative');
    }

    if (_criteria.max_age !== undefined && _criteria.max_age < 0) {
      throw new Error('Maximum age cannot be negative');
    }
  }
  */

  // ==========================================================================
  // TASK 22.4 & 22.5: Voting System with Duplicate Prevention and Anonymous Voting
  // ==========================================================================

  /**
   * Generate one-way hash for anonymous voting
   * Uses SHA-256 hash of user_id + poll_id
   */
  private generateVoteHash(userId: string, pollId: string): string {
    const data = `${userId}:${pollId}`;
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  /**
   * Submit a vote
   */
  async submitVote(voteData: VoteData, userProfile: UserProfile): Promise<void> {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');

      // Get poll details
      const poll = await this.getPoll(voteData.poll_id);

      // Check if poll is active
      if (poll.status !== 'active') {
        throw new Error('Poll is not active');
      }

      // Check if poll is within voting period
      const now = new Date();
      if (now < poll.start_date || now > poll.end_date) {
        throw new Error('Poll is not within voting period');
      }

      // Check eligibility
      const eligibility = await this.isUserEligible(voteData.poll_id, userProfile);
      if (!eligibility.eligible) {
        throw new Error(`User not eligible: ${eligibility.reason}`);
      }

      // Validate vote data based on poll type
      this.validateVoteData(poll.poll_type, voteData.vote_data, poll.options);

      // Generate vote hash for duplicate prevention
      const voteHash = this.generateVoteHash(voteData.user_id, voteData.poll_id);

      // Check for duplicate vote
      const existingVote = await client.query(
        `SELECT vote_id FROM poll_votes WHERE vote_hash = $1`,
        [voteHash]
      );

      if (existingVote.rows.length > 0) {
        throw new Error('User has already voted in this poll');
      }

      // Determine voter demographics for analysis
      const voterAgeGroup = this.getAgeGroup(voteData.voter_age);

      // Insert vote
      await client.query(
        `INSERT INTO poll_votes (
          poll_id, user_id, vote_data, vote_hash,
          voter_age_group, voter_gender, voter_district, voter_state,
          verified
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          voteData.poll_id,
          poll.allow_anonymous ? null : voteData.user_id,
          JSON.stringify(voteData.vote_data),
          voteHash,
          voterAgeGroup,
          voteData.voter_gender,
          voteData.voter_district,
          voteData.voter_state,
          userProfile.is_verified ?? false,
        ]
      );

      // Update total votes count
      await client.query(
        `UPDATE polls SET total_votes = total_votes + 1 WHERE poll_id = $1`,
        [voteData.poll_id]
      );

      // If real-time results enabled, recalculate results
      if (poll.show_real_time_results) {
        await this.calculateResults(voteData.poll_id, client);
      }

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Check if user has already voted
   */
  async hasUserVoted(pollId: string, userId: string): Promise<boolean> {
    const voteHash = this.generateVoteHash(userId, pollId);
    
    const result = await this.pool.query(
      `SELECT vote_id FROM poll_votes WHERE vote_hash = $1`,
      [voteHash]
    );

    return result.rows.length > 0;
  }

  /**
   * Get age group from age
   */
  private getAgeGroup(age?: number): string | null {
    if (!age) return null;
    
    if (age < 18) return 'under_18';
    if (age < 25) return '18_24';
    if (age < 35) return '25_34';
    if (age < 45) return '35_44';
    if (age < 55) return '45_54';
    if (age < 65) return '55_64';
    return '65_plus';
  }

  // ==========================================================================
  // TASK 22.2: Multiple Poll Types Validation
  // ==========================================================================

  /**
   * Validate vote data based on poll type
   */
  private validateVoteData(pollType: PollType, voteData: any, options: PollOption[]): void {
    const optionIds = options.map(opt => opt.option_id);

    switch (pollType) {
      case 'single_choice':
        this.validateSingleChoiceVote(voteData as SingleChoiceVote, optionIds);
        break;
      case 'multiple_choice':
        this.validateMultipleChoiceVote(voteData as MultipleChoiceVote, optionIds);
        break;
      case 'ranked_choice':
        this.validateRankedChoiceVote(voteData as RankedChoiceVote, optionIds);
        break;
      case 'budget_allocation':
        this.validateBudgetAllocationVote(voteData as BudgetAllocationVote, options);
        break;
      default:
        throw new Error(`Unknown poll type: ${pollType}`);
    }
  }

  /**
   * Validate single choice vote
   */
  private validateSingleChoiceVote(vote: SingleChoiceVote, validOptionIds: string[]): void {
    if (!vote.selected_option) {
      throw new Error('Single choice vote must have a selected option');
    }

    if (!validOptionIds.includes(vote.selected_option)) {
      throw new Error('Invalid option selected');
    }
  }

  /**
   * Validate multiple choice vote
   */
  private validateMultipleChoiceVote(vote: MultipleChoiceVote, validOptionIds: string[]): void {
    if (!vote.selected_options || vote.selected_options.length === 0) {
      throw new Error('Multiple choice vote must have at least one selected option');
    }

    for (const optionId of vote.selected_options) {
      if (!validOptionIds.includes(optionId)) {
        throw new Error(`Invalid option selected: ${optionId}`);
      }
    }

    // Check for duplicates
    const uniqueOptions = new Set(vote.selected_options);
    if (uniqueOptions.size !== vote.selected_options.length) {
      throw new Error('Duplicate options selected');
    }
  }

  /**
   * Validate ranked choice vote
   */
  private validateRankedChoiceVote(vote: RankedChoiceVote, validOptionIds: string[]): void {
    if (!vote.rankings || vote.rankings.length === 0) {
      throw new Error('Ranked choice vote must have at least one ranking');
    }

    const rankedOptionIds = vote.rankings.map(r => r.option_id);
    const ranks = vote.rankings.map(r => r.rank);

    // Check all option IDs are valid
    for (const optionId of rankedOptionIds) {
      if (!validOptionIds.includes(optionId)) {
        throw new Error(`Invalid option in ranking: ${optionId}`);
      }
    }

    // Check for duplicate options
    const uniqueOptions = new Set(rankedOptionIds);
    if (uniqueOptions.size !== rankedOptionIds.length) {
      throw new Error('Duplicate options in ranking');
    }

    // Check ranks are sequential starting from 1
    const sortedRanks = [...ranks].sort((a, b) => a - b);
    for (let i = 0; i < sortedRanks.length; i++) {
      if (sortedRanks[i] !== i + 1) {
        throw new Error('Ranks must be sequential starting from 1');
      }
    }
  }

  /**
   * Validate budget allocation vote
   */
  private validateBudgetAllocationVote(vote: BudgetAllocationVote, options: PollOption[]): void {
    if (!vote.allocations || vote.allocations.length === 0) {
      throw new Error('Budget allocation vote must have at least one allocation');
    }

    const optionIds = options.map(opt => opt.option_id);
    let totalAllocated = 0;

    for (const allocation of vote.allocations) {
      if (!optionIds.includes(allocation.option_id)) {
        throw new Error(`Invalid option in allocation: ${allocation.option_id}`);
      }

      if (allocation.amount < 0) {
        throw new Error('Allocation amount cannot be negative');
      }

      totalAllocated += allocation.amount;
    }

    // Calculate total budget available
    const totalBudget = options.reduce((sum, opt) => sum + (opt.budget_amount || 0), 0);

    if (totalAllocated > totalBudget) {
      throw new Error(`Total allocation (${totalAllocated}) exceeds available budget (${totalBudget})`);
    }
  }

  // ==========================================================================
  // TASK 22.6 & 22.7: Result Display and Calculation with Demographics
  // ==========================================================================

  /**
   * Get poll results (respects visibility settings)
   */
  async getResults(pollId: string, userId?: string): Promise<PollResults | null> {
    const poll = await this.getPoll(pollId);

    // Check if results should be shown
    const hasVoted = userId ? await this.hasUserVoted(pollId, userId) : false;
    
    if (poll.status === 'active') {
      // Active poll - check visibility settings
      if (!poll.show_real_time_results) {
        if (!poll.show_results_before_voting && !hasVoted) {
          return null; // Results hidden before voting
        }
        if (!poll.show_results_after_voting && hasVoted) {
          return null; // Results hidden after voting
        }
      }
    }

    // Return cached results if available
    if (poll.results) {
      return {
        poll_id: pollId,
        total_votes: poll.total_votes,
        turnout_percentage: this.calculateTurnoutPercentage(poll),
        results_by_option: poll.results,
        demographic_breakdown: poll.demographic_breakdown,
        is_binding_threshold_met: this.isBindingThresholdMet(poll),
      };
    }

    // Calculate results if not cached
    return await this.calculateResults(pollId);
  }

  /**
   * Calculate poll results
   */
  async calculateResults(pollId: string, client?: any): Promise<PollResults> {
    const useClient = client || this.pool;
    
    const poll = await this.getPoll(pollId);

    // Get all votes
    const votesResult = await useClient.query(
      `SELECT vote_data, voter_age_group, voter_gender, voter_district, voter_state
       FROM poll_votes
       WHERE poll_id = $1`,
      [pollId]
    );

    const votes = votesResult.rows;
    const totalVotes = votes.length;

    // Calculate results based on poll type
    let resultsByOption: Record<string, OptionResult>;

    switch (poll.poll_type) {
      case 'single_choice':
        resultsByOption = this.calculateSingleChoiceResults(votes, poll.options);
        break;
      case 'multiple_choice':
        resultsByOption = this.calculateMultipleChoiceResults(votes, poll.options);
        break;
      case 'ranked_choice':
        resultsByOption = this.calculateRankedChoiceResults(votes, poll.options);
        break;
      case 'budget_allocation':
        resultsByOption = this.calculateBudgetAllocationResults(votes, poll.options);
        break;
      default:
        throw new Error(`Unknown poll type: ${poll.poll_type}`);
    }

    // Calculate demographic breakdown (only for non-anonymous polls)
    const demographicBreakdown = poll.allow_anonymous 
      ? undefined 
      : this.calculateDemographicBreakdown(votes, poll.poll_type);

    const results: PollResults = {
      poll_id: pollId,
      total_votes: totalVotes,
      turnout_percentage: this.calculateTurnoutPercentage(poll),
      results_by_option: resultsByOption,
      demographic_breakdown: demographicBreakdown,
      is_binding_threshold_met: this.isBindingThresholdMet(poll),
    };

    // Cache results in database
    await useClient.query(
      `UPDATE polls 
       SET results = $1, demographic_breakdown = $2, updated_at = CURRENT_TIMESTAMP
       WHERE poll_id = $3`,
      [JSON.stringify(resultsByOption), JSON.stringify(demographicBreakdown), pollId]
    );

    return results;
  }

  /**
   * Calculate single choice results
   */
  private calculateSingleChoiceResults(votes: any[], options: PollOption[]): Record<string, OptionResult> {
    const results: Record<string, OptionResult> = {};
    const voteCounts: Record<string, number> = {};

    // Initialize counts
    for (const option of options) {
      voteCounts[option.option_id] = 0;
    }

    // Count votes
    for (const vote of votes) {
      const voteData = vote.vote_data as SingleChoiceVote;
      if (voteCounts[voteData.selected_option] !== undefined) {
        voteCounts[voteData.selected_option]++;
      }
    }

    // Calculate percentages
    const totalVotes = votes.length;
    for (const option of options) {
      const count = voteCounts[option.option_id];
      results[option.option_id] = {
        option_id: option.option_id,
        option_text: option.text,
        vote_count: count,
        percentage: totalVotes > 0 ? (count / totalVotes) * 100 : 0,
      };
    }

    return results;
  }

  /**
   * Calculate multiple choice results
   */
  private calculateMultipleChoiceResults(votes: any[], options: PollOption[]): Record<string, OptionResult> {
    const results: Record<string, OptionResult> = {};
    const voteCounts: Record<string, number> = {};

    // Initialize counts
    for (const option of options) {
      voteCounts[option.option_id] = 0;
    }

    // Count votes (each option can be selected multiple times)
    for (const vote of votes) {
      const voteData = vote.vote_data as MultipleChoiceVote;
      for (const optionId of voteData.selected_options) {
        if (voteCounts[optionId] !== undefined) {
          voteCounts[optionId]++;
        }
      }
    }

    // Calculate percentages (based on total voters, not total selections)
    const totalVoters = votes.length;
    for (const option of options) {
      const count = voteCounts[option.option_id];
      results[option.option_id] = {
        option_id: option.option_id,
        option_text: option.text,
        vote_count: count,
        percentage: totalVoters > 0 ? (count / totalVoters) * 100 : 0,
      };
    }

    return results;
  }

  /**
   * Calculate ranked choice results
   */
  private calculateRankedChoiceResults(votes: any[], options: PollOption[]): Record<string, OptionResult> {
    const results: Record<string, OptionResult> = {};
    const rankSums: Record<string, number> = {};
    const rankCounts: Record<string, number> = {};

    // Initialize
    for (const option of options) {
      rankSums[option.option_id] = 0;
      rankCounts[option.option_id] = 0;
    }

    // Sum ranks
    for (const vote of votes) {
      const voteData = vote.vote_data as RankedChoiceVote;
      for (const ranking of voteData.rankings) {
        if (rankSums[ranking.option_id] !== undefined) {
          rankSums[ranking.option_id] += ranking.rank;
          rankCounts[ranking.option_id]++;
        }
      }
    }

    // Calculate average ranks and percentages
    const totalVoters = votes.length;
    for (const option of options) {
      const count = rankCounts[option.option_id];
      const avgRank = count > 0 ? rankSums[option.option_id] / count : 0;
      
      results[option.option_id] = {
        option_id: option.option_id,
        option_text: option.text,
        vote_count: count,
        percentage: totalVoters > 0 ? (count / totalVoters) * 100 : 0,
        average_rank: avgRank,
      };
    }

    return results;
  }

  /**
   * Calculate budget allocation results
   */
  private calculateBudgetAllocationResults(votes: any[], options: PollOption[]): Record<string, OptionResult> {
    const results: Record<string, OptionResult> = {};
    const budgetSums: Record<string, number> = {};
    const allocationCounts: Record<string, number> = {};

    // Initialize
    for (const option of options) {
      budgetSums[option.option_id] = 0;
      allocationCounts[option.option_id] = 0;
    }

    // Sum budget allocations
    for (const vote of votes) {
      const voteData = vote.vote_data as BudgetAllocationVote;
      for (const allocation of voteData.allocations) {
        if (budgetSums[allocation.option_id] !== undefined) {
          budgetSums[allocation.option_id] += allocation.amount;
          allocationCounts[allocation.option_id]++;
        }
      }
    }

    // Calculate totals and percentages
    const totalBudgetAllocated = Object.values(budgetSums).reduce((sum, val) => sum + val, 0);

    for (const option of options) {
      const totalBudget = budgetSums[option.option_id];
      const count = allocationCounts[option.option_id];
      
      results[option.option_id] = {
        option_id: option.option_id,
        option_text: option.text,
        vote_count: count,
        percentage: totalBudgetAllocated > 0 ? (totalBudget / totalBudgetAllocated) * 100 : 0,
        total_budget_allocated: totalBudget,
      };
    }

    return results;
  }

  /**
   * Calculate demographic breakdown
   */
  private calculateDemographicBreakdown(votes: any[], pollType: PollType): DemographicBreakdown {
    const byAgeGroup: Record<string, Record<string, number>> = {};
    const byGender: Record<string, Record<string, number>> = {};
    const byDistrict: Record<string, Record<string, number>> = {};

    for (const vote of votes) {
      const voteData = vote.vote_data;
      let selectedOptions: string[] = [];

      // Extract selected options based on poll type
      switch (pollType) {
        case 'single_choice':
          selectedOptions = [(voteData as SingleChoiceVote).selected_option];
          break;
        case 'multiple_choice':
          selectedOptions = (voteData as MultipleChoiceVote).selected_options;
          break;
        case 'ranked_choice':
          // Use top-ranked option
          const rankings = (voteData as RankedChoiceVote).rankings;
          const topRanked = rankings.find(r => r.rank === 1);
          if (topRanked) selectedOptions = [topRanked.option_id];
          break;
        case 'budget_allocation':
          // Use option with highest allocation
          const allocations = (voteData as BudgetAllocationVote).allocations;
          if (allocations.length > 0) {
            const maxAllocation = allocations.reduce((max, a) => 
              a.amount > max.amount ? a : max
            );
            selectedOptions = [maxAllocation.option_id];
          }
          break;
      }

      // Count by demographics
      for (const optionId of selectedOptions) {
        // By age group
        if (vote.voter_age_group) {
          if (!byAgeGroup[vote.voter_age_group]) {
            byAgeGroup[vote.voter_age_group] = {};
          }
          byAgeGroup[vote.voter_age_group][optionId] = 
            (byAgeGroup[vote.voter_age_group][optionId] || 0) + 1;
        }

        // By gender
        if (vote.voter_gender) {
          if (!byGender[vote.voter_gender]) {
            byGender[vote.voter_gender] = {};
          }
          byGender[vote.voter_gender][optionId] = 
            (byGender[vote.voter_gender][optionId] || 0) + 1;
        }

        // By district
        if (vote.voter_district) {
          if (!byDistrict[vote.voter_district]) {
            byDistrict[vote.voter_district] = {};
          }
          byDistrict[vote.voter_district][optionId] = 
            (byDistrict[vote.voter_district][optionId] || 0) + 1;
        }
      }
    }

    return {
      by_age_group: byAgeGroup,
      by_gender: byGender,
      by_district: byDistrict,
    };
  }

  /**
   * Calculate turnout percentage
   */
  private calculateTurnoutPercentage(_poll: any): number {
    // This would require knowing the total eligible voters
    // For now, return 0 as placeholder
    // In production, this would query the users table with eligibility criteria
    return 0;
  }

  // ==========================================================================
  // TASK 22.8: Binding Poll Commitment Tracking
  // ==========================================================================

  /**
   * Check if binding poll threshold is met
   */
  private isBindingThresholdMet(poll: any): boolean {
    if (!poll.is_binding || !poll.binding_threshold_percentage) {
      return false;
    }

    // Calculate turnout percentage
    // This would require knowing total eligible voters
    // For now, we check if any votes were cast
    return poll.total_votes > 0;
  }

  /**
   * Get binding poll commitment
   */
  async getBindingCommitment(pollId: string) {
    const poll = await this.getPoll(pollId);

    if (!poll.is_binding) {
      return null;
    }

    const results = await this.getResults(pollId);
    
    if (!results) {
      return null;
    }

    return {
      poll_id: pollId,
      is_binding: poll.is_binding,
      threshold_percentage: poll.binding_threshold_percentage,
      threshold_met: results.is_binding_threshold_met,
      commitment_text: poll.commitment_text,
      winning_option: this.getWinningOption(results.results_by_option, poll.poll_type),
      total_votes: results.total_votes,
      turnout_percentage: results.turnout_percentage,
    };
  }

  /**
   * Get winning option based on poll type
   */
  private getWinningOption(results: Record<string, OptionResult>, pollType: PollType): OptionResult | null {
    const options = Object.values(results);
    
    if (options.length === 0) {
      return null;
    }

    switch (pollType) {
      case 'single_choice':
      case 'multiple_choice':
        // Highest vote count
        return options.reduce((max, opt) => 
          opt.vote_count > max.vote_count ? opt : max
        );
      
      case 'ranked_choice':
        // Lowest average rank (best ranking)
        return options.reduce((best, opt) => {
          const bestRank = best.average_rank ?? Infinity;
          const optRank = opt.average_rank ?? Infinity;
          return optRank < bestRank ? opt : best;
        });
      
      case 'budget_allocation':
        // Highest total budget allocated
        return options.reduce((max, opt) => {
          const maxBudget = max.total_budget_allocated ?? 0;
          const optBudget = opt.total_budget_allocated ?? 0;
          return optBudget > maxBudget ? opt : max;
        });
      
      default:
        return null;
    }
  }

  /**
   * Mark binding commitment as implemented
   */
  async markCommitmentImplemented(pollId: string, implementationNotes: string): Promise<void> {
    const poll = await this.getPoll(pollId);

    if (!poll.is_binding) {
      throw new Error('Poll is not binding');
    }

    // This would typically update a separate commitment tracking table
    // For now, we'll add it to the poll's metadata
    await this.pool.query(
      `UPDATE polls 
       SET eligibility_criteria = jsonb_set(
         COALESCE(eligibility_criteria, '{}'::jsonb),
         '{implementation}',
         jsonb_build_object(
           'implemented', true,
           'implementation_date', CURRENT_TIMESTAMP,
           'notes', $2
         )
       )
       WHERE poll_id = $1`,
      [pollId, implementationNotes]
    );
  }

  // ==========================================================================
  // UTILITY METHODS
  // ==========================================================================

  /**
   * List polls with filters
   */
  async listPolls(filters?: {
    status?: PollStatus;
    created_by?: string;
    district?: string;
    state?: string;
    is_binding?: boolean;
    limit?: number;
    offset?: number;
  }) {
    let whereClause = '1=1';
    const params: any[] = [];
    let paramIndex = 1;

    if (filters?.status) {
      whereClause += ` AND status = $${paramIndex++}`;
      params.push(filters.status);
    }

    if (filters?.created_by) {
      whereClause += ` AND created_by = $${paramIndex++}`;
      params.push(filters.created_by);
    }

    if (filters?.district) {
      whereClause += ` AND $${paramIndex} = ANY(eligible_districts)`;
      params.push(filters.district);
      paramIndex++;
    }

    if (filters?.state) {
      whereClause += ` AND $${paramIndex} = ANY(eligible_states)`;
      params.push(filters.state);
      paramIndex++;
    }

    if (filters?.is_binding !== undefined) {
      whereClause += ` AND is_binding = $${paramIndex++}`;
      params.push(filters.is_binding);
    }

    const limit = filters?.limit ?? 50;
    const offset = filters?.offset ?? 0;

    const result = await this.pool.query(
      `SELECT 
        poll_id, title, description, poll_type, status,
        start_date, end_date, total_votes, is_binding,
        created_at, updated_at
       FROM polls
       WHERE ${whereClause}
       ORDER BY created_at DESC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...params, limit, offset]
    );

    return result.rows.map(row => ({
      poll_id: row.poll_id,
      title: row.title,
      description: row.description,
      poll_type: row.poll_type,
      status: row.status,
      start_date: new Date(row.start_date),
      end_date: new Date(row.end_date),
      total_votes: row.total_votes,
      is_binding: row.is_binding,
      created_at: new Date(row.created_at),
      updated_at: new Date(row.updated_at),
    }));
  }

  /**
   * Get poll statistics
   */
  async getPollStatistics(pollId: string) {
    const poll = await this.getPoll(pollId);
    const results = await this.getResults(pollId);

    if (!results) {
      return {
        poll_id: pollId,
        total_votes: 0,
        status: poll.status,
        participation_rate: 0,
      };
    }

    return {
      poll_id: pollId,
      total_votes: results.total_votes,
      status: poll.status,
      participation_rate: results.turnout_percentage,
      results_summary: results.results_by_option,
      has_demographic_data: !!results.demographic_breakdown,
    };
  }
}

export default CommunityPollsService;
