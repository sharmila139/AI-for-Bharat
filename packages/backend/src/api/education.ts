/**
 * Education Module API Endpoints
 * Provides adaptive learning, content management, and progress tracking
 */

import { Router, Request, Response } from 'express';
import { adaptiveLearningService } from '../services/education/adaptive-learning';
import { videoDownloadService } from '../services/education/video-download';

const router = Router();

// ============================================================================
// STUDENT PROFILE ENDPOINTS
// ============================================================================

/**
 * POST /api/education/profile
 * Create or update student profile
 */
router.post('/profile', async (req: Request, res: Response) => {
  try {
    const profileData = req.body;
    
    if (!profileData.userId || !profileData.gradeLevel) {
      return res.status(400).json({
        error: 'userId and gradeLevel are required'
      });
    }
    
    const profile = await adaptiveLearningService.createStudentProfile(profileData);
    
    res.json({
      success: true,
      data: profile
    });
  } catch (error) {
    console.error('Error creating student profile:', error);
    res.status(500).json({
      error: 'Failed to create student profile',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/education/profile/:studentId
 * Get student profile
 */
router.get('/profile/:studentId', async (req: Request, res: Response) => {
  try {
    const { studentId } = req.params;
    
    // This would query student_profiles table
    res.json({
      success: true,
      message: 'Student profile endpoint - to be implemented with database'
    });
  } catch (error) {
    console.error('Error fetching student profile:', error);
    res.status(500).json({
      error: 'Failed to fetch student profile',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// ============================================================================
// DIAGNOSTIC ASSESSMENT ENDPOINTS
// ============================================================================

/**
 * POST /api/education/diagnostic-assessment
 * Submit diagnostic assessment responses
 */
router.post('/diagnostic-assessment', async (req: Request, res: Response) => {
  try {
    const { studentId, subjectId, responses } = req.body;
    
    if (!studentId || !subjectId || !responses) {
      return res.status(400).json({
        error: 'studentId, subjectId, and responses are required'
      });
    }
    
    const assessment = await adaptiveLearningService.conductDiagnosticAssessment(
      studentId,
      subjectId,
      responses
    );
    
    res.json({
      success: true,
      data: assessment
    });
  } catch (error) {
    console.error('Error conducting diagnostic assessment:', error);
    res.status(500).json({
      error: 'Failed to conduct diagnostic assessment',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// ============================================================================
// KNOWLEDGE STATE ENDPOINTS
// ============================================================================

/**
 * GET /api/education/knowledge-state/:studentId
 * Get student's knowledge state for all topics
 */
router.get('/knowledge-state/:studentId', async (req: Request, res: Response) => {
  try {
    const { studentId } = req.params;
    
    // This would query knowledge_state table
    res.json({
      success: true,
      message: 'Knowledge state endpoint - to be implemented with database'
    });
  } catch (error) {
    console.error('Error fetching knowledge state:', error);
    res.status(500).json({
      error: 'Failed to fetch knowledge state',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/education/quiz-result
 * Submit quiz result and update knowledge state
 */
router.post('/quiz-result', async (req: Request, res: Response) => {
  try {
    const { studentId, topicId, quizResult } = req.body;
    
    if (!studentId || !topicId || !quizResult) {
      return res.status(400).json({
        error: 'studentId, topicId, and quizResult are required'
      });
    }
    
    // Get current knowledge state
    const currentState = adaptiveLearningService.initializeKnowledgeState(studentId, topicId);
    
    // Update using Bayesian Knowledge Tracing
    const updatedState = adaptiveLearningService.updateKnowledgeState(currentState, quizResult);
    
    // Check for intervention
    const intervention = adaptiveLearningService.triggerIntervention(quizResult, updatedState);
    
    // Check for acceleration
    const acceleration = adaptiveLearningService.accelerateLearningPath(quizResult, updatedState);
    
    res.json({
      success: true,
      data: {
        knowledgeState: updatedState,
        intervention,
        acceleration
      }
    });
  } catch (error) {
    console.error('Error processing quiz result:', error);
    res.status(500).json({
      error: 'Failed to process quiz result',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// ============================================================================
// CONTENT RECOMMENDATION ENDPOINTS
// ============================================================================

/**
 * GET /api/education/recommendations/:studentId
 * Get personalized content recommendations
 */
router.get('/recommendations/:studentId', async (req: Request, res: Response) => {
  try {
    const { studentId } = req.params;
    const { learningStyle } = req.query;
    
    // This would query knowledge_state and generate recommendations
    const knowledgeStates = []; // Would be fetched from database
    const recommendations = adaptiveLearningService.selectNextContent(
      studentId,
      knowledgeStates,
      learningStyle as string || 'mixed'
    );
    
    res.json({
      success: true,
      data: recommendations
    });
  } catch (error) {
    console.error('Error generating recommendations:', error);
    res.status(500).json({
      error: 'Failed to generate recommendations',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// ============================================================================
// PROGRESS TRACKING ENDPOINTS
// ============================================================================

/**
 * GET /api/education/progress/:studentId
 * Get student progress summary
 */
router.get('/progress/:studentId', async (req: Request, res: Response) => {
  try {
    const { studentId } = req.params;
    
    const progress = await adaptiveLearningService.getProgressSummary(studentId);
    
    res.json({
      success: true,
      data: progress
    });
  } catch (error) {
    console.error('Error fetching progress:', error);
    res.status(500).json({
      error: 'Failed to fetch progress',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/education/track-engagement
 * Track learning session engagement
 */
router.post('/track-engagement', async (req: Request, res: Response) => {
  try {
    const sessionData = req.body;
    
    if (!sessionData.studentId || !sessionData.contentId) {
      return res.status(400).json({
        error: 'studentId and contentId are required'
      });
    }
    
    adaptiveLearningService.trackEngagement(sessionData);
    
    res.json({
      success: true,
      message: 'Engagement tracked successfully'
    });
  } catch (error) {
    console.error('Error tracking engagement:', error);
    res.status(500).json({
      error: 'Failed to track engagement',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// ============================================================================
// VIDEO DOWNLOAD ENDPOINTS
// ============================================================================

/**
 * GET /api/education/video/:contentId/quality-options
 * Get available quality options for a video
 */
router.get('/video/:contentId/quality-options', (req: Request, res: Response) => {
  try {
    const { contentId } = req.params;
    
    const qualityOptions = videoDownloadService.getQualityOptions(contentId);
    
    res.json({
      success: true,
      data: qualityOptions
    });
  } catch (error) {
    console.error('Error fetching quality options:', error);
    res.status(500).json({
      error: 'Failed to fetch quality options',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/education/video/download
 * Queue video for download
 */
router.post('/video/download', async (req: Request, res: Response) => {
  try {
    const downloadRequest = req.body;
    
    if (!downloadRequest.contentId || !downloadRequest.quality) {
      return res.status(400).json({
        error: 'contentId and quality are required'
      });
    }
    
    const downloadProgress = await videoDownloadService.queueDownload(downloadRequest);
    
    res.json({
      success: true,
      data: downloadProgress
    });
  } catch (error) {
    console.error('Error queuing download:', error);
    res.status(500).json({
      error: 'Failed to queue download',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/education/video/download/:contentId/progress
 * Get download progress
 */
router.get('/video/download/:contentId/progress', async (req: Request, res: Response) => {
  try {
    const { contentId } = req.params;
    
    const progress = await videoDownloadService.getDownloadProgress(contentId);
    
    if (!progress) {
      return res.status(404).json({
        error: 'Download not found'
      });
    }
    
    res.json({
      success: true,
      data: progress
    });
  } catch (error) {
    console.error('Error fetching download progress:', error);
    res.status(500).json({
      error: 'Failed to fetch download progress',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/education/video/download/:contentId/pause
 * Pause video download
 */
router.post('/video/download/:contentId/pause', async (req: Request, res: Response) => {
  try {
    const { contentId } = req.params;
    
    await videoDownloadService.pauseDownload(contentId);
    
    res.json({
      success: true,
      message: 'Download paused'
    });
  } catch (error) {
    console.error('Error pausing download:', error);
    res.status(500).json({
      error: 'Failed to pause download',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/education/video/download/:contentId/resume
 * Resume video download
 */
router.post('/video/download/:contentId/resume', async (req: Request, res: Response) => {
  try {
    const { contentId } = req.params;
    
    await videoDownloadService.resumeDownload(contentId);
    
    res.json({
      success: true,
      message: 'Download resumed'
    });
  } catch (error) {
    console.error('Error resuming download:', error);
    res.status(500).json({
      error: 'Failed to resume download',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * DELETE /api/education/video/download/:contentId
 * Delete downloaded video
 */
router.delete('/video/download/:contentId', async (req: Request, res: Response) => {
  try {
    const { contentId } = req.params;
    
    await videoDownloadService.deleteDownload(contentId);
    
    res.json({
      success: true,
      message: 'Download deleted'
    });
  } catch (error) {
    console.error('Error deleting download:', error);
    res.status(500).json({
      error: 'Failed to delete download',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/education/video/downloads/:studentId
 * Get all downloaded videos for a student
 */
router.get('/video/downloads/:studentId', async (req: Request, res: Response) => {
  try {
    const { studentId } = req.params;
    
    const downloads = await videoDownloadService.getDownloadedVideos(studentId);
    
    res.json({
      success: true,
      data: downloads
    });
  } catch (error) {
    console.error('Error fetching downloads:', error);
    res.status(500).json({
      error: 'Failed to fetch downloads',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
