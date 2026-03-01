/**
 * Community Polls API
 * 
 * REST endpoints for community opinion polls:
 * - GET /api/community-polls - List polls with filters
 * - GET /api/community-polls/:pollId - Get poll details
 * - POST /api/community-polls/:pollId/vote - Submit vote
 * - GET /api/community-polls/:pollId/results - Get poll results
 * - GET /api/community-polls/:pollId/eligibility - Check user eligibility
 * - GET /api/community-polls/:pollId/has-voted - Check if user has voted
 * - GET /api/community-polls/:pollId/commitment - Get binding commitment
 */

import { Router, Request, Response } from 'express';
import { Pool } from 'pg';
import { CommunityPollsService, VoteData, UserProfile } from '../services/infrastructure/community-polls';

const router = Router();

// ============================================================================
// MIDDLEWARE
// ============================================================================

/**
 * Middleware to inject service into request
 */
const injectService = (pool: Pool) => {
  return (req: Request, res: Response, next: Function) => {
    (req as any).pollsService = new CommunityPollsService(pool);
    next();
  };
};

/**
 * Middleware to extract user profile from request
 * In production, this would extract from JWT token
 */
const extractUserProfile = (req: Request, res: Response, next: Function) => {
  // Mock user profile - in production, extract from JWT
  const userProfile: UserProfile = {
    user_id: req.headers['x-user-id'] as string || 'user_123',
    age: parseInt(req.headers['x-user-age'] as string) || undefined,
    gender: req.headers['x-user-gender'] as string || undefined,
    district: req.headers['x-user-district'] as string || undefined,
    state: req.headers['x-user-state'] as string || undefined,
    occupation: req.headers['x-user-occupation'] as string || undefined,
    is_verified: req.headers['x-user-verified'] === 'true',
  };
  
  (req as any).userProfile = userProfile;
  next();
};

// ============================================================================
// ROUTES
// ============================================================================

/**
 * GET /api/community-polls
 * List polls with optional filters
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const service: CommunityPollsService = (req as any).pollsService;
    const userProfile: UserProfile = (req as any).userProfile;

    const filters = {
      status: req.query.status as any,
      district: req.query.district as string,
      state: req.query.state as string,
      is_binding: req.query.is_binding === 'true' ? true : req.query.is_binding === 'false' ? false : undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 50,
      offset: req.query.offset ? parseInt(req.query.offset as string) : 0,
    };

    const polls = await service.listPolls(filters);

    // For each poll, check if user has voted and is eligible
    const pollsWithStatus = await Promise.all(
      polls.map(async (poll) => {
        const hasVoted = await service.hasUserVoted(poll.poll_id, userProfile.user_id);
        const eligibility = await service.isUserEligible(poll.poll_id, userProfile);
        
        return {
          ...poll,
          user_has_voted: hasVoted,
          user_is_eligible: eligibility.eligible,
          eligibility_reason: eligibility.reason,
        };
      })
    );

    res.json({
      success: true,
      data: pollsWithStatus,
      count: pollsWithStatus.length,
    });
  } catch (error: any) {
    console.error('Error listing polls:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to list polls',
      message: error.message,
    });
  }
});

/**
 * GET /api/community-polls/:pollId
 * Get poll details
 */
router.get('/:pollId', async (req: Request, res: Response) => {
  try {
    const service: CommunityPollsService = (req as any).pollsService;
    const userProfile: UserProfile = (req as any).userProfile;
    const { pollId } = req.params;

    const poll = await service.getPoll(pollId);
    const hasVoted = await service.hasUserVoted(pollId, userProfile.user_id);
    const eligibility = await service.isUserEligible(pollId, userProfile);

    res.json({
      success: true,
      data: {
        ...poll,
        user_has_voted: hasVoted,
        user_is_eligible: eligibility.eligible,
        eligibility_reason: eligibility.reason,
      },
    });
  } catch (error: any) {
    console.error('Error getting poll:', error);
    res.status(error.message === 'Poll not found' ? 404 : 500).json({
      success: false,
      error: 'Failed to get poll',
      message: error.message,
    });
  }
});

/**
 * POST /api/community-polls/:pollId/vote
 * Submit a vote
 */
router.post('/:pollId/vote', async (req: Request, res: Response) => {
  try {
    const service: CommunityPollsService = (req as any).pollsService;
    const userProfile: UserProfile = (req as any).userProfile;
    const { pollId } = req.params;
    const { vote_data } = req.body;

    if (!vote_data) {
      return res.status(400).json({
        success: false,
        error: 'vote_data is required',
      });
    }

    const voteData: VoteData = {
      poll_id: pollId,
      user_id: userProfile.user_id,
      vote_data,
      voter_age: userProfile.age,
      voter_gender: userProfile.gender,
      voter_district: userProfile.district,
      voter_state: userProfile.state,
    };

    await service.submitVote(voteData, userProfile);

    res.json({
      success: true,
      message: 'Vote submitted successfully',
    });
  } catch (error: any) {
    console.error('Error submitting vote:', error);
    res.status(400).json({
      success: false,
      error: 'Failed to submit vote',
      message: error.message,
    });
  }
});

/**
 * GET /api/community-polls/:pollId/results
 * Get poll results (respects visibility settings)
 */
router.get('/:pollId/results', async (req: Request, res: Response) => {
  try {
    const service: CommunityPollsService = (req as any).pollsService;
    const userProfile: UserProfile = (req as any).userProfile;
    const { pollId } = req.params;

    const results = await service.getResults(pollId, userProfile.user_id);

    if (!results) {
      return res.status(403).json({
        success: false,
        error: 'Results are not available',
        message: 'Results are hidden based on poll visibility settings',
      });
    }

    res.json({
      success: true,
      data: results,
    });
  } catch (error: any) {
    console.error('Error getting results:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get results',
      message: error.message,
    });
  }
});

/**
 * GET /api/community-polls/:pollId/eligibility
 * Check if user is eligible to vote
 */
router.get('/:pollId/eligibility', async (req: Request, res: Response) => {
  try {
    const service: CommunityPollsService = (req as any).pollsService;
    const userProfile: UserProfile = (req as any).userProfile;
    const { pollId } = req.params;

    const eligibility = await service.isUserEligible(pollId, userProfile);

    res.json({
      success: true,
      data: eligibility,
    });
  } catch (error: any) {
    console.error('Error checking eligibility:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check eligibility',
      message: error.message,
    });
  }
});

/**
 * GET /api/community-polls/:pollId/has-voted
 * Check if user has already voted
 */
router.get('/:pollId/has-voted', async (req: Request, res: Response) => {
  try {
    const service: CommunityPollsService = (req as any).pollsService;
    const userProfile: UserProfile = (req as any).userProfile;
    const { pollId } = req.params;

    const hasVoted = await service.hasUserVoted(pollId, userProfile.user_id);

    res.json({
      success: true,
      data: {
        has_voted: hasVoted,
      },
    });
  } catch (error: any) {
    console.error('Error checking vote status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check vote status',
      message: error.message,
    });
  }
});

/**
 * GET /api/community-polls/:pollId/commitment
 * Get binding poll commitment details
 */
router.get('/:pollId/commitment', async (req: Request, res: Response) => {
  try {
    const service: CommunityPollsService = (req as any).pollsService;
    const { pollId } = req.params;

    const commitment = await service.getBindingCommitment(pollId);

    if (!commitment) {
      return res.status(404).json({
        success: false,
        error: 'Poll is not binding',
      });
    }

    res.json({
      success: true,
      data: commitment,
    });
  } catch (error: any) {
    console.error('Error getting commitment:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get commitment',
      message: error.message,
    });
  }
});

/**
 * GET /api/community-polls/:pollId/statistics
 * Get poll statistics
 */
router.get('/:pollId/statistics', async (req: Request, res: Response) => {
  try {
    const service: CommunityPollsService = (req as any).pollsService;
    const { pollId } = req.params;

    const statistics = await service.getPollStatistics(pollId);

    res.json({
      success: true,
      data: statistics,
    });
  } catch (error: any) {
    console.error('Error getting statistics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get statistics',
      message: error.message,
    });
  }
});

// ============================================================================
// EXPORT
// ============================================================================

export const createCommunityPollsRouter = (pool: Pool): Router => {
  router.use(injectService(pool));
  router.use(extractUserProfile);
  return router;
};

export default router;
