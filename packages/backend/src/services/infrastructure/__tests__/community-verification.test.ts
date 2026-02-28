/**
 * Community Verification Service Tests
 * Tests for community-based verification of grievance resolutions
 */

import { Pool } from 'pg';
import { CommunityVerificationService } from '../community-verification';

// Mock pg Pool
jest.mock('pg', () => {
  const mockQuery = jest.fn();
  
  return {
    Pool: jest.fn(() => ({
      query: mockQuery,
      connect: jest.fn(() => Promise.resolve({
        query: mockQuery,
        release: jest.fn()
      })),
      end: jest.fn()
    }))
  };
});

describe('CommunityVerificationService', () => {
  let pool: Pool;
  let service: CommunityVerificationService;
  let mockQuery: jest.Mock;

  const testGrievanceId = '123e4567-e89b-12d3-a456-426614174000';
  const testUserId1 = '123e4567-e89b-12d3-a456-426614174001';
  const testUserId2 = '123e4567-e89b-12d3-a456-426614174002';
  const testUserId3 = '123e4567-e89b-12d3-a456-426614174003';

  beforeEach(() => {
    jest.clearAllMocks();
    
    pool = new Pool();
    mockQuery = (pool as any).query;
    
    service = new CommunityVerificationService(pool);
  });

  describe('submitVerificationVote', () => {
    it('should successfully submit a yes vote', async () => {
      // Mock BEGIN
      mockQuery.mockResolvedValueOnce({});
      
      // Mock grievance query
      mockQuery.mockResolvedValueOnce({
        rows: [{
          grievance_id: testGrievanceId,
          ticket_number: 'GRV202402280001',
          status: 'resolved',
          community_verified: false,
          verification_votes_yes: 0,
          verification_votes_no: 0,
          verification_threshold: 3
        }]
      });

      // Mock existing vote check
      mockQuery.mockResolvedValueOnce({ rows: [] });

      // Mock insert vote
      mockQuery.mockResolvedValueOnce({
        rows: [{ vote_id: 'vote-id-1' }]
      });

      // Mock update grievance
      mockQuery.mockResolvedValueOnce({
        rows: [{
          verification_votes_yes: 1,
          verification_votes_no: 0,
          verification_threshold: 3,
          community_verified: false
        }]
      });

      // Mock COMMIT
      mockQuery.mockResolvedValueOnce({});

      const result = await service.submitVerificationVote({
        userId: testUserId2,
        grievanceId: testGrievanceId,
        vote: 'yes',
        comment: 'Issue is properly resolved'
      });

      expect(result.success).toBe(true);
      expect(result.newStatus.votesYes).toBe(1);
      expect(result.newStatus.votesNo).toBe(0);
      expect(result.newStatus.hasVoted).toBe(true);
      expect(result.newStatus.userVote).toBe('yes');
    });

    it('should prevent duplicate votes from same user', async () => {
      mockQuery.mockResolvedValueOnce({});
      
      mockQuery.mockResolvedValueOnce({
        rows: [{
          grievance_id: testGrievanceId,
          ticket_number: 'GRV202402280001',
          status: 'resolved',
          community_verified: false,
          verification_votes_yes: 1,
          verification_votes_no: 0,
          verification_threshold: 3
        }]
      });

      // Mock existing vote found
      mockQuery.mockResolvedValueOnce({
        rows: [{ vote_id: 'existing-vote', vote_type: 'yes' }]
      });

      await expect(
        service.submitVerificationVote({
          userId: testUserId2,
          grievanceId: testGrievanceId,
          vote: 'no'
        })
      ).rejects.toThrow('User has already voted on this grievance');
    });

    it('should mark grievance as verified when threshold met with >70% yes votes', async () => {
      mockQuery.mockResolvedValueOnce({});
      
      mockQuery.mockResolvedValueOnce({
        rows: [{
          grievance_id: testGrievanceId,
          ticket_number: 'GRV202402280001',
          status: 'resolved',
          community_verified: false,
          verification_votes_yes: 2,
          verification_votes_no: 0,
          verification_threshold: 3
        }]
      });

      mockQuery.mockResolvedValueOnce({ rows: [] });
      mockQuery.mockResolvedValueOnce({ rows: [{ vote_id: 'vote-id-3' }] });
      mockQuery.mockResolvedValueOnce({
        rows: [{
          verification_votes_yes: 3,
          verification_votes_no: 0,
          verification_threshold: 3,
          community_verified: false
        }]
      });

      // Mock update to verified
      mockQuery.mockResolvedValueOnce({});
      // Mock status update insert
      mockQuery.mockResolvedValueOnce({});
      // Mock COMMIT
      mockQuery.mockResolvedValueOnce({});

      const result = await service.submitVerificationVote({
        userId: testUserId3,
        grievanceId: testGrievanceId,
        vote: 'yes'
      });

      expect(result.newStatus.isVerified).toBe(true);
      expect(result.newStatus.votesYes).toBe(3);
      expect(result.newStatus.votesNo).toBe(0);
      expect(result.newStatus.verificationPercentage).toBe(100);
      expect(result.message).toContain('verified by community');
    });
  });

  describe('getVerificationStatus', () => {
    it('should return correct verification status', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{
          grievance_id: testGrievanceId,
          ticket_number: 'GRV202402280001',
          status: 'resolved',
          community_verified: false,
          verification_votes_yes: 1,
          verification_votes_no: 1,
          verification_threshold: 3
        }]
      });

      mockQuery.mockResolvedValueOnce({ rows: [] });

      const status = await service.getVerificationStatus(testGrievanceId, testUserId1);

      expect(status.grievanceId).toBe(testGrievanceId);
      expect(status.votesYes).toBe(1);
      expect(status.votesNo).toBe(1);
      expect(status.threshold).toBe(3);
      expect(status.verificationPercentage).toBe(50);
      expect(status.isVerified).toBe(false);
      expect(status.canVote).toBe(true);
      expect(status.hasVoted).toBe(false);
    });
  });

  describe('getVerificationVotes', () => {
    it('should return all votes for a grievance', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            vote_id: 'vote-1',
            vote_type: 'yes',
            comment: 'Good work',
            photos: [],
            created_at: new Date(),
            voter_name: 'Test User 1',
            user_id: testUserId1
          },
          {
            vote_id: 'vote-2',
            vote_type: 'no',
            comment: 'Not satisfied',
            photos: [],
            created_at: new Date(),
            voter_name: 'Test User 2',
            user_id: testUserId2
          }
        ]
      });

      const votes = await service.getVerificationVotes(testGrievanceId);

      expect(votes).toHaveLength(2);
      expect(votes[0].vote_type).toBe('yes');
      expect(votes[1].vote_type).toBe('no');
    });
  });

  describe('getPendingVerificationGrievances', () => {
    it('should return resolved grievances pending verification', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            grievance_id: testGrievanceId,
            ticket_number: 'GRV202402280001',
            title: 'Test Grievance',
            category: 'road',
            district: 'TestDistrict',
            state: 'TestState',
            photos: [],
            resolution_description: 'Fixed',
            resolution_photos: [],
            resolved_at: new Date(),
            verification_votes_yes: 0,
            verification_votes_no: 0,
            verification_threshold: 3,
            total_votes: 0
          }
        ]
      });

      const pending = await service.getPendingVerificationGrievances();

      expect(pending).toHaveLength(1);
      expect(pending[0].ticket_number).toBe('GRV202402280001');
    });
  });

  describe('edge cases', () => {
    it('should handle non-existent grievance', async () => {
      mockQuery.mockResolvedValueOnce({});
      mockQuery.mockResolvedValueOnce({ rows: [] });

      await expect(
        service.submitVerificationVote({
          userId: testUserId2,
          grievanceId: '00000000-0000-0000-0000-000000000000',
          vote: 'yes'
        })
      ).rejects.toThrow('Grievance not found');
    });

    it('should handle zero votes correctly', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{
          grievance_id: testGrievanceId,
          ticket_number: 'GRV202402280001',
          status: 'resolved',
          community_verified: false,
          verification_votes_yes: 0,
          verification_votes_no: 0,
          verification_threshold: 3
        }]
      });

      mockQuery.mockResolvedValueOnce({ rows: [] });

      const status = await service.getVerificationStatus(testGrievanceId);

      expect(status.votesYes).toBe(0);
      expect(status.votesNo).toBe(0);
      expect(status.verificationPercentage).toBe(0);
    });
  });
});
