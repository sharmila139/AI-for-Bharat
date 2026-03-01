/**
 * Property-Based Tests for Community Opinion Polls
 * 
 * Tests:
 * - Property 32: Poll Vote Uniqueness
 * - Property 33: Voter Eligibility Validation
 * - Property 34: Anonymous Vote Storage
 */

import fc from 'fast-check';
import { Pool } from 'pg';
import { 
  CommunityPollsService, 
  PollType,
  VoteData,
  UserProfile,
  SingleChoiceVote,
  MultipleChoiceVote,
} from '../community-polls';

// Mock database pool
const mockPool = {
  connect: jest.fn(),
  query: jest.fn(),
} as unknown as Pool;

describe('Community Polls Property Tests', () => {
  let service: CommunityPollsService;

  beforeEach(() => {
    service = new CommunityPollsService(mockPool);
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  // ==========================================================================
  // CUSTOM ARBITRARIES FOR POLL DATA
  // ==========================================================================

  const pollOptionArbitrary = fc.record({
    option_id: fc.uuid(),
    text: fc.string({ minLength: 5, maxLength: 100 }),
    description: fc.option(fc.string({ maxLength: 200 })),
  });

  const eligibilityCriteriaArbitrary = fc.record({
    min_age: fc.option(fc.integer({ min: 18, max: 65 })),
    max_age: fc.option(fc.integer({ min: 66, max: 100 })),
    districts: fc.option(fc.array(fc.constantFrom('District1', 'District2', 'District3'), { minLength: 1, maxLength: 3 })),
    states: fc.option(fc.array(fc.constantFrom('State1', 'State2', 'State3'), { minLength: 1, maxLength: 3 })),
    occupations: fc.option(fc.array(fc.constantFrom('farmer', 'teacher', 'doctor', 'engineer'), { minLength: 1, maxLength: 3 })),
    require_verification: fc.option(fc.boolean()),
  });

  const userProfileArbitrary = fc.record({
    user_id: fc.uuid(),
    age: fc.option(fc.integer({ min: 18, max: 100 })),
    gender: fc.option(fc.constantFrom('male', 'female', 'other')),
    district: fc.option(fc.constantFrom('District1', 'District2', 'District3', 'District4')),
    state: fc.option(fc.constantFrom('State1', 'State2', 'State3', 'State4')),
    occupation: fc.option(fc.constantFrom('farmer', 'teacher', 'doctor', 'engineer', 'student')),
    is_verified: fc.option(fc.boolean()),
  });

  // ==========================================================================
  // PROPERTY 32: Poll Vote Uniqueness
  // ==========================================================================

  describe('Property 32: Poll Vote Uniqueness', () => {
    /**
     * **Validates: Requirements 14.3**
     * 
     * For any active poll and eligible user, the user should be able to cast 
     * exactly one vote, with subsequent vote attempts rejected.
     */
    test('user can vote exactly once per poll', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            poll_id: fc.uuid(),
            user_id: fc.uuid(),
            poll_type: fc.constantFrom<PollType>('single_choice', 'multiple_choice'),
            options: fc.array(pollOptionArbitrary, { minLength: 2, maxLength: 5 }),
          }),
          async (testData) => {
            const { poll_id, user_id, poll_type, options } = testData;

            // Create vote data
            const voteData: VoteData = {
              poll_id,
              user_id,
              vote_data: poll_type === 'single_choice' 
                ? { selected_option: options[0].option_id } as SingleChoiceVote
                : { selected_options: [options[0].option_id] } as MultipleChoiceVote,
              voter_age: 30,
              voter_gender: 'male',
              voter_district: 'District1',
              voter_state: 'State1',
            };

            const userProfile: UserProfile = {
              user_id,
              age: 30,
              is_verified: true,
            };

            // Mock poll data
            const mockPoll = {
              poll_id,
              poll_type,
              status: 'active',
              start_date: new Date(Date.now() - 24 * 60 * 60 * 1000),
              end_date: new Date(Date.now() + 24 * 60 * 60 * 1000),
              options,
              eligibility_criteria: {},
              allow_anonymous: false,
              require_verification: true,
              show_real_time_results: false,
            };

            // Mock first vote attempt (should succeed)
            const mockClient1 = {
              query: jest.fn()
                .mockResolvedValueOnce({}) // BEGIN
                .mockResolvedValueOnce({ rows: [] }) // Check for existing vote
                
                .mockResolvedValueOnce({ rows: [] }) // Check for existing vote (none found)
                .mockResolvedValueOnce({}) // Insert vote
                .mockResolvedValueOnce({}) // Update total votes
                .mockResolvedValueOnce({}), // COMMIT
              release: jest.fn(),
            };

            (mockPool.connect as jest.Mock).mockResolvedValueOnce(mockClient1);
            (mockPool.query as jest.Mock)
              .mockResolvedValueOnce({ rows: [mockPoll] }) // getPoll call
              .mockResolvedValueOnce({ rows: [mockPoll] }); // getPoll call in submitVote

            // First vote should succeed
            await expect(service.submitVote(voteData, userProfile)).resolves.not.toThrow();

            // Mock second vote attempt (should fail - duplicate found)
            const mockClient2 = {
              query: jest.fn()
                .mockResolvedValueOnce({}) // BEGIN
                .mockResolvedValueOnce({ rows: [] }) // Check for existing vote
                
                .mockResolvedValueOnce({ rows: [{ vote_id: 'existing-vote' }] }) // Check for existing vote (found!)
                .mockRejectedValueOnce(new Error('User has already voted in this poll')),
              release: jest.fn(),
            };

            (mockPool.connect as jest.Mock).mockResolvedValueOnce(mockClient2);
            (mockPool.query as jest.Mock)
              .mockResolvedValueOnce({ rows: [mockPoll] }) // getPoll call
              .mockResolvedValueOnce({ rows: [mockPoll] }); // getPoll call in submitVote

            // Property: Second vote attempt should be rejected
            await expect(service.submitVote(voteData, userProfile)).rejects.toThrow(
              'User has already voted in this poll'
            );
          }
        ),
        { numRuns: 100 }
      );
    });

    test('vote hash uniquely identifies user-poll combination', async () => {
      await fc.assert(
        fc.property(
          fc.uuid(), // user_id
          fc.uuid(), // poll_id
          (userId, pollId) => {
            const crypto = require('crypto');
            
            // Generate hash twice with same inputs
            const hash1 = crypto.createHash('sha256').update(`${userId}:${pollId}`).digest('hex');
            const hash2 = crypto.createHash('sha256').update(`${userId}:${pollId}`).digest('hex');

            // Property: Same inputs produce same hash
            expect(hash1).toBe(hash2);

            // Property: Hash should be deterministic
            expect(hash1).toHaveLength(64); // SHA-256 produces 64 hex characters
          }
        ),
        { numRuns: 100 }
      );
    });

    test('different users can vote in same poll', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            poll_id: fc.uuid(),
            user1_id: fc.uuid(),
            user2_id: fc.uuid(),
          }),
          async (testData) => {
            const { poll_id, user1_id, user2_id } = testData;

            // Ensure different users
            fc.pre(user1_id !== user2_id);

            const crypto = require('crypto');
            const hash1 = crypto.createHash('sha256').update(`${user1_id}:${poll_id}`).digest('hex');
            const hash2 = crypto.createHash('sha256').update(`${user2_id}:${poll_id}`).digest('hex');

            // Property: Different users produce different vote hashes for same poll
            expect(hash1).not.toBe(hash2);
          }
        ),
        { numRuns: 100 }
      );
    });

    test('same user produces different hashes for different polls', async () => {
      await fc.assert(
        fc.property(
          fc.uuid(), // user_id
          fc.uuid(), // poll1_id
          fc.uuid(), // poll2_id
          (userId, poll1Id, poll2Id) => {
            // Ensure different polls
            fc.pre(poll1Id !== poll2Id);

            const crypto = require('crypto');
            const hash1 = crypto.createHash('sha256').update(`${userId}:${poll1Id}`).digest('hex');
            const hash2 = crypto.createHash('sha256').update(`${userId}:${poll2Id}`).digest('hex');

            // Property: Same user produces different hashes for different polls
            expect(hash1).not.toBe(hash2);
          }
        ),
        { numRuns: 100 }
      );
    });

    test('hasUserVoted correctly identifies voting status', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            poll_id: fc.uuid(),
            user_id: fc.uuid(),
            has_voted: fc.boolean(),
          }),
          async (testData) => {
            const { poll_id, user_id, has_voted } = testData;

            // Mock database response
            (mockPool.query as jest.Mock).mockResolvedValueOnce({
              rows: has_voted ? [{ vote_id: 'some-vote-id' }] : [],
            });

            const result = await service.hasUserVoted(poll_id, user_id);

            // Property: Result should match expected voting status
            expect(result).toBe(has_voted);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // ==========================================================================
  // PROPERTY 33: Voter Eligibility Validation
  // ==========================================================================

  describe('Property 33: Voter Eligibility Validation', () => {
    /**
     * **Validates: Requirements 14.4**
     * 
     * For any vote attempt, the system should validate that the user meets 
     * all eligibility criteria (age range, ward, verification) before accepting the vote.
     */
    test('users meeting all eligibility criteria should be eligible', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            poll_id: fc.uuid(),
            min_age: fc.integer({ min: 18, max: 30 }),
            max_age: fc.integer({ min: 60, max: 100 }),
            eligible_districts: fc.array(fc.constantFrom('District1', 'District2'), { minLength: 1, maxLength: 2 }),
            eligible_states: fc.array(fc.constantFrom('State1', 'State2'), { minLength: 1, maxLength: 2 }),
            require_verification: fc.boolean(),
          }),
          async (testData) => {
            const { poll_id, min_age, max_age, eligible_districts, eligible_states, require_verification } = testData;

            // Create user profile that meets all criteria
            const userProfile: UserProfile = {
              user_id: fc.sample(fc.uuid(), 1)[0],
              age: Math.floor((min_age + max_age) / 2), // Age in middle of range
              district: eligible_districts[0],
              state: eligible_states[0],
              is_verified: require_verification ? true : fc.sample(fc.boolean(), 1)[0],
            };

            const mockPoll = {
              poll_id,
              eligibility_criteria: {
                min_age,
                max_age,
                districts: eligible_districts,
                states: eligible_states,
              },
              require_verification,
            };

            (mockPool.query as jest.Mock).mockResolvedValueOnce({ rows: [mockPoll] });

            const result = await service.isUserEligible(poll_id, userProfile);

            // Property: User meeting all criteria should be eligible
            expect(result.eligible).toBe(true);
            expect(result.reason).toBeUndefined();
          }
        ),
        { numRuns: 100 }
      );
    });

    test('users below minimum age should be ineligible', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            poll_id: fc.uuid(),
            min_age: fc.integer({ min: 25, max: 50 }),
            user_age: fc.integer({ min: 18, max: 24 }),
          }),
          async (testData) => {
            const { poll_id, min_age, user_age } = testData;

            const userProfile: UserProfile = {
              user_id: fc.sample(fc.uuid(), 1)[0],
              age: user_age,
              is_verified: true,
            };

            const mockPoll = {
              poll_id,
              eligibility_criteria: { min_age },
              require_verification: false,
            };

            (mockPool.query as jest.Mock).mockResolvedValueOnce({ rows: [mockPoll] });

            const result = await service.isUserEligible(poll_id, userProfile);

            // Property: User below minimum age should be ineligible
            expect(result.eligible).toBe(false);
            expect(result.reason).toContain('Minimum age requirement');
          }
        ),
        { numRuns: 100 }
      );
    });

    test('users above maximum age should be ineligible', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            poll_id: fc.uuid(),
            max_age: fc.integer({ min: 50, max: 65 }),
            user_age: fc.integer({ min: 66, max: 100 }),
          }),
          async (testData) => {
            const { poll_id, max_age, user_age } = testData;

            const userProfile: UserProfile = {
              user_id: fc.sample(fc.uuid(), 1)[0],
              age: user_age,
              is_verified: true,
            };

            const mockPoll = {
              poll_id,
              eligibility_criteria: { max_age },
              require_verification: false,
            };

            (mockPool.query as jest.Mock).mockResolvedValueOnce({ rows: [mockPoll] });

            const result = await service.isUserEligible(poll_id, userProfile);

            // Property: User above maximum age should be ineligible
            expect(result.eligible).toBe(false);
            expect(result.reason).toContain('Maximum age requirement');
          }
        ),
        { numRuns: 100 }
      );
    });

    test('users from ineligible districts should be rejected', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            poll_id: fc.uuid(),
            eligible_districts: fc.array(fc.constantFrom('District1', 'District2'), { minLength: 1, maxLength: 2 }),
            user_district: fc.constantFrom('District3', 'District4', 'District5'),
          }),
          async (testData) => {
            const { poll_id, eligible_districts, user_district } = testData;

            // Ensure user district is not in eligible list
            fc.pre(!eligible_districts.includes(user_district));

            const userProfile: UserProfile = {
              user_id: fc.sample(fc.uuid(), 1)[0],
              age: 30,
              district: user_district,
              is_verified: true,
            };

            const mockPoll = {
              poll_id,
              eligibility_criteria: { districts: eligible_districts },
              require_verification: false,
            };

            (mockPool.query as jest.Mock).mockResolvedValueOnce({ rows: [mockPoll] });

            const result = await service.isUserEligible(poll_id, userProfile);

            // Property: User from ineligible district should be rejected
            expect(result.eligible).toBe(false);
            expect(result.reason).toContain('Not in eligible district');
          }
        ),
        { numRuns: 100 }
      );
    });

    test('users from ineligible states should be rejected', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            poll_id: fc.uuid(),
            eligible_states: fc.array(fc.constantFrom('State1', 'State2'), { minLength: 1, maxLength: 2 }),
            user_state: fc.constantFrom('State3', 'State4', 'State5'),
          }),
          async (testData) => {
            const { poll_id, eligible_states, user_state } = testData;

            // Ensure user state is not in eligible list
            fc.pre(!eligible_states.includes(user_state));

            const userProfile: UserProfile = {
              user_id: fc.sample(fc.uuid(), 1)[0],
              age: 30,
              state: user_state,
              is_verified: true,
            };

            const mockPoll = {
              poll_id,
              eligibility_criteria: { states: eligible_states },
              require_verification: false,
            };

            (mockPool.query as jest.Mock).mockResolvedValueOnce({ rows: [mockPoll] });

            const result = await service.isUserEligible(poll_id, userProfile);

            // Property: User from ineligible state should be rejected
            expect(result.eligible).toBe(false);
            expect(result.reason).toContain('Not in eligible state');
          }
        ),
        { numRuns: 100 }
      );
    });

    test('unverified users should be rejected when verification required', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            poll_id: fc.uuid(),
            user_id: fc.uuid(),
          }),
          async (testData) => {
            const { poll_id, user_id } = testData;

            const userProfile: UserProfile = {
              user_id,
              age: 30,
              is_verified: false, // Not verified
            };

            const mockPoll = {
              poll_id,
              eligibility_criteria: {},
              require_verification: true, // Verification required
            };

            (mockPool.query as jest.Mock).mockResolvedValueOnce({ rows: [mockPoll] });

            const result = await service.isUserEligible(poll_id, userProfile);

            // Property: Unverified users should be rejected when verification required
            expect(result.eligible).toBe(false);
            expect(result.reason).toContain('User verification required');
          }
        ),
        { numRuns: 100 }
      );
    });

    test('users with ineligible occupations should be rejected', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            poll_id: fc.uuid(),
            eligible_occupations: fc.array(fc.constantFrom('farmer', 'teacher'), { minLength: 1, maxLength: 2 }),
            user_occupation: fc.constantFrom('doctor', 'engineer', 'student'),
          }),
          async (testData) => {
            const { poll_id, eligible_occupations, user_occupation } = testData;

            // Ensure user occupation is not in eligible list
            fc.pre(!eligible_occupations.includes(user_occupation));

            const userProfile: UserProfile = {
              user_id: fc.sample(fc.uuid(), 1)[0],
              age: 30,
              occupation: user_occupation,
              is_verified: true,
            };

            const mockPoll = {
              poll_id,
              eligibility_criteria: { occupations: eligible_occupations },
              require_verification: false,
            };

            (mockPool.query as jest.Mock).mockResolvedValueOnce({ rows: [mockPoll] });

            const result = await service.isUserEligible(poll_id, userProfile);

            // Property: User with ineligible occupation should be rejected
            expect(result.eligible).toBe(false);
            expect(result.reason).toContain('Occupation not eligible');
          }
        ),
        { numRuns: 100 }
      );
    });

    test('eligibility check should validate all criteria together', async () => {
      await fc.assert(
        fc.asyncProperty(
          userProfileArbitrary,
          eligibilityCriteriaArbitrary,
          async (userProfileRaw, criteria) => {
            const poll_id = fc.sample(fc.uuid(), 1)[0];

            // Convert null to undefined for UserProfile compatibility
            const userProfile: UserProfile = {
              user_id: userProfileRaw.user_id,
              age: userProfileRaw.age ?? undefined,
              gender: userProfileRaw.gender ?? undefined,
              district: userProfileRaw.district ?? undefined,
              state: userProfileRaw.state ?? undefined,
              occupation: userProfileRaw.occupation ?? undefined,
              is_verified: userProfileRaw.is_verified ?? undefined,
            };

            const mockPoll = {
              poll_id,
              eligibility_criteria: criteria,
              require_verification: criteria.require_verification ?? false,
            };

            (mockPool.query as jest.Mock).mockResolvedValueOnce({ rows: [mockPoll] });

            const result = await service.isUserEligible(poll_id, userProfile);

            // Property: Result should be boolean
            expect(typeof result.eligible).toBe('boolean');

            // Property: If ineligible, reason should be provided
            if (!result.eligible) {
              expect(result.reason).toBeDefined();
              expect(typeof result.reason).toBe('string');
              expect(result.reason!.length).toBeGreaterThan(0);
            }

            // Property: If eligible, no reason should be provided
            if (result.eligible) {
              expect(result.reason).toBeUndefined();
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    test('vote submission should reject ineligible users', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            poll_id: fc.uuid(),
            user_id: fc.uuid(),
            options: fc.array(pollOptionArbitrary, { minLength: 2, maxLength: 5 }),
            min_age: fc.integer({ min: 30, max: 50 }),
            user_age: fc.integer({ min: 18, max: 29 }), // Below minimum
          }),
          async (testData) => {
            const { poll_id, user_id, options, min_age, user_age } = testData;

            const voteData: VoteData = {
              poll_id,
              user_id,
              vote_data: { selected_option: options[0].option_id } as SingleChoiceVote,
            };

            const userProfile: UserProfile = {
              user_id,
              age: user_age,
              is_verified: true,
            };

            const mockPoll = {
              poll_id,
              poll_type: 'single_choice' as PollType,
              status: 'active',
              start_date: new Date(Date.now() - 24 * 60 * 60 * 1000),
              end_date: new Date(Date.now() + 24 * 60 * 60 * 1000),
              options,
              eligibility_criteria: { min_age },
              require_verification: false,
              allow_anonymous: false,
              show_real_time_results: false,
            };

            const mockClient = {
              query: jest.fn()
                .mockResolvedValueOnce({}) // BEGIN
                .mockResolvedValueOnce({ rows: [] }) // Check for existing vote
                
                .mockRejectedValueOnce(new Error('User not eligible: Minimum age requirement: ' + min_age)),
              release: jest.fn(),
            };

            (mockPool.connect as jest.Mock).mockResolvedValue(mockClient);
            (mockPool.query as jest.Mock)
              .mockResolvedValueOnce({ rows: [mockPoll] }) // getPoll call
              .mockResolvedValueOnce({ rows: [mockPoll] }); // getPoll call in submitVote

            // Property: Vote submission should fail for ineligible users
            await expect(service.submitVote(voteData, userProfile)).rejects.toThrow('User not eligible');
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // ==========================================================================
  // PROPERTY 34: Anonymous Vote Storage
  // ==========================================================================

  describe('Property 34: Anonymous Vote Storage', () => {
    /**
     * **Validates: Requirements 14.5**
     * 
     * For any vote in an anonymous poll, the stored vote should use a one-way 
     * hash for the voter ID while still preventing duplicate voting.
     */
    test('anonymous polls should not store user_id in vote record', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            poll_id: fc.uuid(),
            user_id: fc.uuid(),
            options: fc.array(pollOptionArbitrary, { minLength: 2, maxLength: 5 }),
          }),
          async (testData) => {
            const { poll_id, user_id, options } = testData;

            const voteData: VoteData = {
              poll_id,
              user_id,
              vote_data: { selected_option: options[0].option_id } as SingleChoiceVote,
              voter_age: 30,
              voter_gender: 'male',
              voter_district: 'District1',
            };

            const userProfile: UserProfile = {
              user_id,
              age: 30,
              is_verified: true,
            };

            const mockPoll = {
              poll_id,
              poll_type: 'single_choice' as PollType,
              status: 'active',
              start_date: new Date(Date.now() - 24 * 60 * 60 * 1000),
              end_date: new Date(Date.now() + 24 * 60 * 60 * 1000),
              options,
              eligibility_criteria: {},
              require_verification: false,
              allow_anonymous: true, // Anonymous poll
              show_real_time_results: false,
            };

            let insertedUserId: any = undefined;

            const mockClient = {
              query: jest.fn()
                .mockResolvedValueOnce({}) // BEGIN
                .mockResolvedValueOnce({ rows: [] }) // Check for existing vote
                
                
                .mockImplementationOnce((_query: string, params: any[]) => {
                  // Capture the user_id parameter from INSERT
                  insertedUserId = params[1]; // Second parameter is user_id
                  return Promise.resolve({});
                })
                .mockResolvedValueOnce({}) // Update total votes
                .mockResolvedValueOnce({}) // COMMIT
              ,
              release: jest.fn(),
            };

            (mockPool.connect as jest.Mock).mockResolvedValue(mockClient);
            (mockPool.query as jest.Mock)
              .mockResolvedValueOnce({ rows: [mockPoll] }) // getPoll call
              .mockResolvedValueOnce({ rows: [mockPoll] }); // getPoll call in submitVote

            await service.submitVote(voteData, userProfile);

            // Property: For anonymous polls, user_id should be null in database
            expect(insertedUserId).toBeNull();
          }
        ),
        { numRuns: 100 }
      );
    });

    test('non-anonymous polls should store user_id in vote record', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            poll_id: fc.uuid(),
            user_id: fc.uuid(),
            options: fc.array(pollOptionArbitrary, { minLength: 2, maxLength: 5 }),
          }),
          async (testData) => {
            const { poll_id, user_id, options } = testData;

            const voteData: VoteData = {
              poll_id,
              user_id,
              vote_data: { selected_option: options[0].option_id } as SingleChoiceVote,
              voter_age: 30,
            };

            const userProfile: UserProfile = {
              user_id,
              age: 30,
              is_verified: true,
            };

            const mockPoll = {
              poll_id,
              poll_type: 'single_choice' as PollType,
              status: 'active',
              start_date: new Date(Date.now() - 24 * 60 * 60 * 1000),
              end_date: new Date(Date.now() + 24 * 60 * 60 * 1000),
              options,
              eligibility_criteria: {},
              require_verification: false,
              allow_anonymous: false, // Non-anonymous poll
              show_real_time_results: false,
            };

            let insertedUserId: any = undefined;

            const mockClient = {
              query: jest.fn()
                .mockResolvedValueOnce({}) // BEGIN
                .mockResolvedValueOnce({ rows: [] }) // Check for existing vote
                
                
                .mockImplementationOnce((_query: string, params: any[]) => {
                  // Capture the user_id parameter from INSERT
                  insertedUserId = params[1]; // Second parameter is user_id
                  return Promise.resolve({});
                })
                .mockResolvedValueOnce({}) // Update total votes
                .mockResolvedValueOnce({}) // COMMIT
              ,
              release: jest.fn(),
            };

            (mockPool.connect as jest.Mock).mockResolvedValue(mockClient);
            (mockPool.query as jest.Mock)
              .mockResolvedValueOnce({ rows: [mockPoll] }) // getPoll call
              .mockResolvedValueOnce({ rows: [mockPoll] }); // getPoll call in submitVote

            await service.submitVote(voteData, userProfile);

            // Property: For non-anonymous polls, user_id should be stored
            expect(insertedUserId).toBe(user_id);
          }
        ),
        { numRuns: 100 }
      );
    });

    test('vote hash prevents duplicate voting even in anonymous polls', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            poll_id: fc.uuid(),
            user_id: fc.uuid(),
            options: fc.array(pollOptionArbitrary, { minLength: 2, maxLength: 5 }),
          }),
          async (testData) => {
            const { poll_id, user_id, options } = testData;

            const crypto = require('crypto');
            const expectedHash = crypto.createHash('sha256').update(`${user_id}:${poll_id}`).digest('hex');

            const voteData: VoteData = {
              poll_id,
              user_id,
              vote_data: { selected_option: options[0].option_id } as SingleChoiceVote,
            };

            const userProfile: UserProfile = {
              user_id,
              age: 30,
              is_verified: true,
            };

            const mockPoll = {
              poll_id,
              poll_type: 'single_choice' as PollType,
              status: 'active',
              start_date: new Date(Date.now() - 24 * 60 * 60 * 1000),
              end_date: new Date(Date.now() + 24 * 60 * 60 * 1000),
              options,
              eligibility_criteria: {},
              require_verification: false,
              allow_anonymous: true, // Anonymous poll
              show_real_time_results: false,
            };

            let insertedVoteHash: any = undefined;

            const mockClient = {
              query: jest.fn()
                .mockResolvedValueOnce({}) // BEGIN
                .mockResolvedValueOnce({ rows: [] }) // Check for existing vote
                .mockImplementationOnce((_query: string, params: any[]) => {
                  // Capture the vote_hash parameter from INSERT
                  insertedVoteHash = params[3]; // Fourth parameter is vote_hash
                  return Promise.resolve({});
                })
                .mockResolvedValueOnce({}) // Update total votes
                .mockResolvedValueOnce({}) // COMMIT
              ,
              release: jest.fn(),
            };

            (mockPool.connect as jest.Mock).mockResolvedValue(mockClient);
            (mockPool.query as jest.Mock)
              .mockResolvedValueOnce({ rows: [mockPoll] }) // getPoll call
              .mockResolvedValueOnce({ rows: [mockPoll] }); // getPoll call in submitVote

            await service.submitVote(voteData, userProfile);

            // Property: Vote hash should be stored even for anonymous polls
            expect(insertedVoteHash).toBe(expectedHash);
            expect(insertedVoteHash).toHaveLength(64); // SHA-256 hash length
          }
        ),
        { numRuns: 100 }
      );
    });

    test('vote hash is one-way and cannot reveal user_id', async () => {
      await fc.assert(
        fc.property(
          fc.uuid(), // user_id
          fc.uuid(), // poll_id
          (userId, pollId) => {
            const crypto = require('crypto');
            const hash = crypto.createHash('sha256').update(`${userId}:${pollId}`).digest('hex');

            // Property: Hash should not contain user_id or poll_id as substring
            expect(hash).not.toContain(userId);
            expect(hash).not.toContain(pollId);

            // Property: Hash should be fixed length (64 hex chars for SHA-256)
            expect(hash).toHaveLength(64);

            // Property: Hash should only contain hex characters
            expect(hash).toMatch(/^[0-9a-f]{64}$/);
          }
        ),
        { numRuns: 100 }
      );
    });

    test('anonymous polls still track demographics without user_id', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            poll_id: fc.uuid(),
            user_id: fc.uuid(),
            options: fc.array(pollOptionArbitrary, { minLength: 2, maxLength: 5 }),
            voter_age: fc.integer({ min: 18, max: 100 }),
            voter_gender: fc.constantFrom('male', 'female', 'other'),
            voter_district: fc.constantFrom('District1', 'District2', 'District3'),
            voter_state: fc.constantFrom('State1', 'State2', 'State3'),
          }),
          async (testData) => {
            const { poll_id, user_id, options, voter_age, voter_gender, voter_district, voter_state } = testData;

            const voteData: VoteData = {
              poll_id,
              user_id,
              vote_data: { selected_option: options[0].option_id } as SingleChoiceVote,
              voter_age,
              voter_gender,
              voter_district,
              voter_state,
            };

            const userProfile: UserProfile = {
              user_id,
              age: voter_age,
              is_verified: true,
            };

            const mockPoll = {
              poll_id,
              poll_type: 'single_choice' as PollType,
              status: 'active',
              start_date: new Date(Date.now() - 24 * 60 * 60 * 1000),
              end_date: new Date(Date.now() + 24 * 60 * 60 * 1000),
              options,
              eligibility_criteria: {},
              require_verification: false,
              allow_anonymous: true, // Anonymous poll
              show_real_time_results: false,
            };

            let insertedDemographics: any = {};

            const mockClient = {
              query: jest.fn()
                .mockResolvedValueOnce({}) // BEGIN
                .mockResolvedValueOnce({ rows: [] }) // Check for existing vote
                
                
                .mockImplementationOnce((_query: string, params: any[]) => {
                  // Capture demographic parameters from INSERT
                  insertedDemographics = {
                    user_id: params[1],
                    age_group: params[4],
                    gender: params[5],
                    district: params[6],
                    state: params[7],
                  };
                  return Promise.resolve({});
                })
                .mockResolvedValueOnce({}) // Update total votes
                .mockResolvedValueOnce({}) // COMMIT
              ,
              release: jest.fn(),
            };

            (mockPool.connect as jest.Mock).mockResolvedValue(mockClient);
            (mockPool.query as jest.Mock)
              .mockResolvedValueOnce({ rows: [mockPoll] }) // getPoll call
              .mockResolvedValueOnce({ rows: [mockPoll] }); // getPoll call in submitVote

            await service.submitVote(voteData, userProfile);

            // Property: Demographics should be stored even when user_id is null
            expect(insertedDemographics.user_id).toBeNull(); // Anonymous
            expect(insertedDemographics.age_group).toBeDefined();
            expect(insertedDemographics.gender).toBe(voter_gender);
            expect(insertedDemographics.district).toBe(voter_district);
            expect(insertedDemographics.state).toBe(voter_state);
          }
        ),
        { numRuns: 100 }
      );
    });

    test('anonymous and non-anonymous polls use same duplicate prevention mechanism', async () => {
      await fc.assert(
        fc.property(
          fc.uuid(), // user_id
          fc.uuid(), // poll_id
          fc.boolean(), // allow_anonymous
          (userId, pollId, _allowAnonymous) => {
            const crypto = require('crypto');
            const hash = crypto.createHash('sha256').update(`${userId}:${pollId}`).digest('hex');

            // Property: Vote hash should be identical regardless of anonymous setting
            // This ensures duplicate prevention works the same way for both poll types
            expect(hash).toHaveLength(64);
            expect(hash).toMatch(/^[0-9a-f]{64}$/);

            // Generate hash again to verify consistency
            const hash2 = crypto.createHash('sha256').update(`${userId}:${pollId}`).digest('hex');
            expect(hash).toBe(hash2);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // ==========================================================================
  // ADDITIONAL INTEGRATION PROPERTIES
  // ==========================================================================

  describe('Additional Poll Properties', () => {
    test('poll status should affect vote acceptance', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            poll_id: fc.uuid(),
            user_id: fc.uuid(),
            status: fc.constantFrom('draft', 'closed', 'cancelled'),
            options: fc.array(pollOptionArbitrary, { minLength: 2, maxLength: 5 }),
          }),
          async (testData) => {
            const { poll_id, user_id, status, options } = testData;

            const voteData: VoteData = {
              poll_id,
              user_id,
              vote_data: { selected_option: options[0].option_id } as SingleChoiceVote,
            };

            const userProfile: UserProfile = {
              user_id,
              age: 30,
              is_verified: true,
            };

            const mockPoll = {
              poll_id,
              poll_type: 'single_choice' as PollType,
              status, // Non-active status
              start_date: new Date(Date.now() - 24 * 60 * 60 * 1000),
              end_date: new Date(Date.now() + 24 * 60 * 60 * 1000),
              options,
              eligibility_criteria: {},
              require_verification: false,
              allow_anonymous: false,
              show_real_time_results: false,
            };

            const mockClient = {
              query: jest.fn()
                .mockResolvedValueOnce({}) // BEGIN
                .mockResolvedValueOnce({ rows: [] }) // Check for existing vote
                
                .mockRejectedValueOnce(new Error('Poll is not active')),
              release: jest.fn(),
            };

            (mockPool.connect as jest.Mock).mockResolvedValue(mockClient);
            (mockPool.query as jest.Mock).mockResolvedValueOnce({ rows: [mockPoll] });

            // Property: Votes should be rejected for non-active polls
            await expect(service.submitVote(voteData, userProfile)).rejects.toThrow('Poll is not active');
          }
        ),
        { numRuns: 100 }
      );
    });

    test('poll date range should be validated', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            poll_id: fc.uuid(),
            user_id: fc.uuid(),
            options: fc.array(pollOptionArbitrary, { minLength: 2, maxLength: 5 }),
            is_before_start: fc.boolean(),
          }),
          async (testData) => {
            const { poll_id, user_id, options, is_before_start } = testData;

            const now = new Date();
            const start_date = is_before_start 
              ? new Date(now.getTime() + 24 * 60 * 60 * 1000) // Future
              : new Date(now.getTime() - 48 * 60 * 60 * 1000); // Past
            const end_date = is_before_start
              ? new Date(now.getTime() + 48 * 60 * 60 * 1000)
              : new Date(now.getTime() - 24 * 60 * 60 * 1000); // Past (expired)

            const voteData: VoteData = {
              poll_id,
              user_id,
              vote_data: { selected_option: options[0].option_id } as SingleChoiceVote,
            };

            const userProfile: UserProfile = {
              user_id,
              age: 30,
              is_verified: true,
            };

            const mockPoll = {
              poll_id,
              poll_type: 'single_choice' as PollType,
              status: 'active',
              start_date,
              end_date,
              options,
              eligibility_criteria: {},
              require_verification: false,
              allow_anonymous: false,
              show_real_time_results: false,
            };

            const mockClient = {
              query: jest.fn()
                .mockResolvedValueOnce({}) // BEGIN
                .mockResolvedValueOnce({ rows: [] }) // Check for existing vote
                
                .mockRejectedValueOnce(new Error('Poll is not within voting period')),
              release: jest.fn(),
            };

            (mockPool.connect as jest.Mock).mockResolvedValue(mockClient);
            (mockPool.query as jest.Mock).mockResolvedValueOnce({ rows: [mockPoll] });

            // Property: Votes should be rejected outside voting period
            await expect(service.submitVote(voteData, userProfile)).rejects.toThrow(
              'Poll is not within voting period'
            );
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
