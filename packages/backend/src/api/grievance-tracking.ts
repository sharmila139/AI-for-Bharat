/**
 * Grievance Tracking and Transparency API
 * 
 * Provides REST endpoints for:
 * - Status tracking and updates
 * - Timeline and history
 * - Resolution documentation
 * - Community verification
 * - Feedback collection
 * - Dashboard statistics
 * - Escalation management
 */

import { Router, Request, Response } from 'express';
import { Pool } from 'pg';
import { GrievanceTrackingService, GrievanceStatus } from '../services/infrastructure/grievance-tracking';

const router = Router();

// Initialize service
let trackingService: GrievanceTrackingService;

export function initializeGrievanceTrackingAPI(pool: Pool) {
  trackingService = new GrievanceTrackingService(pool);
  return router;
}

// ============================================================================
// STATUS TRACKING ENDPOINTS
// ============================================================================

/**
 * GET /api/grievance-tracking/:grievanceId/status
 * Get current status of a grievance
 */
router.get('/:grievanceId/status', async (req: Request, res: Response) => {
  try {
    const { grievanceId } = req.params;
    const status = await trackingService.getStatus(grievanceId);
    
    res.json({
      success: true,
      data: { status },
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * PUT /api/grievance-tracking/:grievanceId/status
 * Update grievance status
 */
router.put('/:grievanceId/status', async (req: Request, res: Response) => {
  try {
    const { grievanceId } = req.params;
    const { status, updated_by, updated_by_role, notes, photos } = req.body;

    if (!status || !updated_by || !updated_by_role) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: status, updated_by, updated_by_role',
      });
    }

    await trackingService.updateStatus(
      grievanceId,
      status as GrievanceStatus,
      updated_by,
      updated_by_role,
      notes,
      photos
    );

    res.json({
      success: true,
      message: 'Status updated successfully',
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/grievance-tracking/:grievanceId/status-history
 * Get status change history
 */
router.get('/:grievanceId/status-history', async (req: Request, res: Response) => {
  try {
    const { grievanceId } = req.params;
    const history = await trackingService.getStatusHistory(grievanceId);
    
    res.json({
      success: true,
      data: history,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

// ============================================================================
// TIMELINE ENDPOINTS
// ============================================================================

/**
 * GET /api/grievance-tracking/:grievanceId/timeline
 * Get complete timeline for a grievance
 */
router.get('/:grievanceId/timeline', async (req: Request, res: Response) => {
  try {
    const { grievanceId } = req.params;
    const timeline = await trackingService.getTimeline(grievanceId);
    
    res.json({
      success: true,
      data: timeline,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

// ============================================================================
// OVERDUE TRACKING ENDPOINTS
// ============================================================================

/**
 * GET /api/grievance-tracking/:grievanceId/overdue
 * Check if grievance is overdue
 */
router.get('/:grievanceId/overdue', async (req: Request, res: Response) => {
  try {
    const { grievanceId } = req.params;
    const isOverdue = await trackingService.isOverdue(grievanceId);
    const daysOpen = await trackingService.getDaysOpen(grievanceId);
    
    res.json({
      success: true,
      data: {
        is_overdue: isOverdue,
        days_open: daysOpen,
      },
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/grievance-tracking/mark-overdue
 * Mark all overdue grievances (admin/system endpoint)
 */
router.post('/mark-overdue', async (req: Request, res: Response) => {
  try {
    const count = await trackingService.markOverdueGrievances();
    
    res.json({
      success: true,
      message: `Marked ${count} grievances as overdue`,
      data: { count },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// ============================================================================
// RESOLUTION ENDPOINTS
// ============================================================================

/**
 * POST /api/grievance-tracking/:grievanceId/resolve
 * Mark grievance as resolved with documentation
 */
router.post('/:grievanceId/resolve', async (req: Request, res: Response) => {
  try {
    const { grievanceId } = req.params;
    const { resolution_description, resolution_photos, resolved_by, resolved_at } = req.body;

    if (!resolution_description || !resolved_by) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: resolution_description, resolved_by',
      });
    }

    await trackingService.resolveGrievance({
      grievance_id: grievanceId,
      resolution_description,
      resolution_photos,
      resolved_by,
      resolved_at: resolved_at ? new Date(resolved_at) : undefined,
    });

    res.json({
      success: true,
      message: 'Grievance resolved successfully',
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/grievance-tracking/:grievanceId/resolution
 * Get resolution details
 */
router.get('/:grievanceId/resolution', async (req: Request, res: Response) => {
  try {
    const { grievanceId } = req.params;
    const resolution = await trackingService.getResolution(grievanceId);
    
    res.json({
      success: true,
      data: resolution,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

// ============================================================================
// COMMUNITY VERIFICATION ENDPOINTS
// ============================================================================

/**
 * POST /api/grievance-tracking/:grievanceId/verify
 * Submit community verification vote
 */
router.post('/:grievanceId/verify', async (req: Request, res: Response) => {
  try {
    const { grievanceId } = req.params;
    const { user_id, vote_type, comment, photos } = req.body;

    if (!user_id || !vote_type) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: user_id, vote_type',
      });
    }

    if (vote_type !== 'yes' && vote_type !== 'no') {
      return res.status(400).json({
        success: false,
        error: 'vote_type must be "yes" or "no"',
      });
    }

    await trackingService.submitVerificationVote({
      grievance_id: grievanceId,
      user_id,
      vote_type,
      comment,
      photos,
    });

    res.json({
      success: true,
      message: 'Verification vote submitted successfully',
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/grievance-tracking/:grievanceId/verification
 * Get verification status and votes
 */
router.get('/:grievanceId/verification', async (req: Request, res: Response) => {
  try {
    const { grievanceId } = req.params;
    const status = await trackingService.getVerificationStatus(grievanceId);
    const votes = await trackingService.getVerificationVotes(grievanceId);
    
    res.json({
      success: true,
      data: {
        status,
        votes,
      },
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

// ============================================================================
// FEEDBACK ENDPOINTS
// ============================================================================

/**
 * POST /api/grievance-tracking/:grievanceId/feedback
 * Submit feedback rating for resolved grievance
 */
router.post('/:grievanceId/feedback', async (req: Request, res: Response) => {
  try {
    const { grievanceId } = req.params;
    const { user_id, rating, feedback_text } = req.body;

    if (!user_id || !rating) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: user_id, rating',
      });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        error: 'Rating must be between 1 and 5',
      });
    }

    await trackingService.submitFeedback({
      grievance_id: grievanceId,
      user_id,
      rating,
      feedback_text,
    });

    res.json({
      success: true,
      message: 'Feedback submitted successfully',
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/grievance-tracking/:grievanceId/feedback
 * Get feedback for a grievance
 */
router.get('/:grievanceId/feedback', async (req: Request, res: Response) => {
  try {
    const { grievanceId } = req.params;
    const feedback = await trackingService.getFeedback(grievanceId);
    
    res.json({
      success: true,
      data: feedback,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

// ============================================================================
// DASHBOARD ENDPOINTS
// ============================================================================

/**
 * GET /api/grievance-tracking/dashboard/statistics
 * Get public dashboard statistics
 */
router.get('/dashboard/statistics', async (req: Request, res: Response) => {
  try {
    const { district, state, start_date, end_date } = req.query;

    const statistics = await trackingService.getDashboardStatistics(
      district as string,
      state as string,
      start_date ? new Date(start_date as string) : undefined,
      end_date ? new Date(end_date as string) : undefined
    );
    
    res.json({
      success: true,
      data: statistics,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// ============================================================================
// ESCALATION ENDPOINTS
// ============================================================================

/**
 * POST /api/grievance-tracking/escalate
 * Escalate overdue grievances (admin/system endpoint)
 */
router.post('/escalate', async (req: Request, res: Response) => {
  try {
    const results = await trackingService.escalateOverdueGrievances();
    
    const escalatedCount = results.filter(r => r.escalated).length;
    const failedCount = results.filter(r => !r.escalated).length;
    
    res.json({
      success: true,
      message: `Escalated ${escalatedCount} grievances, ${failedCount} failed`,
      data: {
        escalated_count: escalatedCount,
        failed_count: failedCount,
        results,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/grievance-tracking/:grievanceId/should-escalate
 * Check if grievance should be escalated
 */
router.get('/:grievanceId/should-escalate', async (req: Request, res: Response) => {
  try {
    const { grievanceId } = req.params;
    const shouldEscalate = await trackingService.shouldEscalate(grievanceId);
    
    res.json({
      success: true,
      data: { should_escalate: shouldEscalate },
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

export default router;
