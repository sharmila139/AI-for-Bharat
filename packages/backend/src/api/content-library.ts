/**
 * Content Library API Endpoints
 * Handles all content management, organization, and delivery endpoints
 */

import { Router, Request, Response } from 'express';
import { Pool } from 'pg';
import {
  ContentManagementService,
  ContentOrganizationService,
  VideoStreamingService,
  InteractiveSimulationsService,
  ContentAnalyticsService,
  RecommendationEngine,
  SubtitleService,
  LearningStyleAdaptationService
} from '../services/education/content';

const router = Router();

// Initialize services (in production, use dependency injection)
let contentMgmt: ContentManagementService;
let contentOrg: ContentOrganizationService;
let videoStreaming: VideoStreamingService;
let simulations: InteractiveSimulationsService;
let analytics: ContentAnalyticsService;
let recommendations: RecommendationEngine;
let subtitles: SubtitleService;
let learningStyle: LearningStyleAdaptationService;

export function initializeContentLibraryAPI(pool: Pool) {
  contentMgmt = new ContentManagementService(pool);
  contentOrg = new ContentOrganizationService(pool);
  videoStreaming = new VideoStreamingService(pool);
  simulations = new InteractiveSimulationsService(pool);
  analytics = new ContentAnalyticsService(pool);
  recommendations = new RecommendationEngine(pool);
  subtitles = new SubtitleService(pool);
  learningStyle = new LearningStyleAdaptationService(pool);
}

// ============================================================================
// CONTENT MANAGEMENT ENDPOINTS
// ============================================================================

/**
 * POST /api/content
 * Create new educational content
 */
router.post('/content', async (req: Request, res: Response) => {
  try {
    const content = req.body;
    const created_by = req.body.created_by || 'system';
    
    const content_id = await contentMgmt.createContent(content, created_by);
    
    res.status(201).json({
      success: true,
      content_id,
      message: 'Content created successfully'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/content/:content_id
 * Get content by ID
 */
router.get('/content/:content_id', async (req: Request, res: Response) => {
  try {
    const { content_id } = req.params;
    const content = await contentMgmt.getContentById(content_id);
    
    if (!content) {
      return res.status(404).json({
        success: false,
        error: 'Content not found'
      });
    }
    
    res.json({
      success: true,
      content
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * PUT /api/content/:content_id
 * Update content
 */
router.put('/content/:content_id', async (req: Request, res: Response) => {
  try {
    const { content_id } = req.params;
    const updates = req.body;
    const updated_by = req.body.updated_by || 'system';
    
    await contentMgmt.updateContent(content_id, updates, updated_by);
    
    res.json({
      success: true,
      message: 'Content updated successfully'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/content/:content_id/submit
 * Submit content for approval
 */
router.post('/content/:content_id/submit', async (req: Request, res: Response) => {
  try {
    const { content_id } = req.params;
    const { submitted_by } = req.body;
    
    await contentMgmt.submitForApproval(content_id, submitted_by);
    
    res.json({
      success: true,
      message: 'Content submitted for approval'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/content/:content_id/review
 * Review and approve/reject content
 */
router.post('/content/:content_id/review', async (req: Request, res: Response) => {
  try {
    const { content_id } = req.params;
    const { reviewed_by, approved, comments } = req.body;
    
    await contentMgmt.reviewContent(content_id, reviewed_by, approved, comments);
    
    res.json({
      success: true,
      message: approved ? 'Content approved' : 'Content rejected'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================================================
// CONTENT ORGANIZATION ENDPOINTS
// ============================================================================

/**
 * GET /api/subjects
 * Get all subjects
 */
router.get('/subjects', async (req: Request, res: Response) => {
  try {
    const { category, grade } = req.query;
    const filters: any = {};
    
    if (category) filters.category = category as string;
    if (grade) filters.grade = parseInt(grade as string);
    
    const subjects = await contentOrg.getAllSubjects(filters);
    
    res.json({
      success: true,
      subjects
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/subjects/:subject_id/hierarchy
 * Get topic hierarchy for a subject
 */
router.get('/subjects/:subject_id/hierarchy', async (req: Request, res: Response) => {
  try {
    const { subject_id } = req.params;
    const hierarchy = await contentOrg.getContentHierarchy(subject_id);
    
    res.json({
      success: true,
      hierarchy
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/topics/:topic_id/content
 * Get content for a topic
 */
router.get('/topics/:topic_id/content', async (req: Request, res: Response) => {
  try {
    const { topic_id } = req.params;
    const { content_type, difficulty_level, language, status } = req.query;
    
    const filters: any = {};
    if (content_type) filters.content_type = content_type as string;
    if (difficulty_level) filters.difficulty_level = difficulty_level as string;
    if (language) filters.language = language as string;
    if (status) filters.status = status as string;
    
    const content = await contentMgmt.getContentByTopic(topic_id, filters);
    
    res.json({
      success: true,
      content
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================================================
// VIDEO STREAMING ENDPOINTS
// ============================================================================

/**
 * GET /api/content/:content_id/stream
 * Get video streaming metadata
 */
router.get('/content/:content_id/stream', async (req: Request, res: Response) => {
  try {
    const { content_id } = req.params;
    const { quality, bandwidth } = req.query;
    
    const metadata = await videoStreaming.getStreamingMetadata({
      content_id,
      preferred_quality: quality as any,
      bandwidth_kbps: bandwidth ? parseInt(bandwidth as string) : undefined
    });
    
    res.json({
      success: true,
      metadata
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/content/:content_id/stream/track
 * Track streaming session
 */
router.post('/content/:content_id/stream/track', async (req: Request, res: Response) => {
  try {
    const { content_id } = req.params;
    const { student_id, quality, bandwidth_kbps } = req.body;
    
    const session_id = await videoStreaming.trackStreamingSession(
      student_id,
      content_id,
      quality,
      bandwidth_kbps
    );
    
    res.json({
      success: true,
      session_id
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================================================
// ANALYTICS ENDPOINTS
// ============================================================================

/**
 * GET /api/content/:content_id/analytics
 * Get content analytics
 */
router.get('/content/:content_id/analytics', async (req: Request, res: Response) => {
  try {
    const { content_id } = req.params;
    const contentAnalytics = await analytics.getContentAnalytics(content_id);
    
    res.json({
      success: true,
      analytics: contentAnalytics
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/content/popular
 * Get popular content
 */
router.get('/content/popular', async (req: Request, res: Response) => {
  try {
    const { topic_id, subject_id, content_type, time_period_days, limit } = req.query;
    
    const filters: any = {};
    if (topic_id) filters.topic_id = topic_id as string;
    if (subject_id) filters.subject_id = subject_id as string;
    if (content_type) filters.content_type = content_type as string;
    if (time_period_days) filters.time_period_days = parseInt(time_period_days as string);
    
    const popular = await analytics.getPopularContent(
      filters,
      limit ? parseInt(limit as string) : 10
    );
    
    res.json({
      success: true,
      popular_content: popular
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================================================
// RECOMMENDATION ENDPOINTS
// ============================================================================

/**
 * GET /api/students/:student_id/recommendations
 * Get personalized recommendations
 */
router.get('/students/:student_id/recommendations', async (req: Request, res: Response) => {
  try {
    const { student_id } = req.params;
    const { topic_id, subject_id, type, limit } = req.query;
    
    const recs = await recommendations.getRecommendations({
      student_id,
      topic_id: topic_id as string,
      subject_id: subject_id as string,
      recommendation_type: type as any,
      max_recommendations: limit ? parseInt(limit as string) : 10
    });
    
    res.json({
      success: true,
      recommendations: recs
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/students/:student_id/learning-path
 * Generate personalized learning path
 */
router.get('/students/:student_id/learning-path', async (req: Request, res: Response) => {
  try {
    const { student_id } = req.params;
    const { subject_id, target_proficiency } = req.query;
    
    if (!subject_id) {
      return res.status(400).json({
        success: false,
        error: 'subject_id is required'
      });
    }
    
    const path = await recommendations.generateLearningPath(
      student_id,
      subject_id as string,
      target_proficiency ? parseInt(target_proficiency as string) : 80
    );
    
    res.json({
      success: true,
      learning_path: path
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================================================
// LEARNING STYLE ENDPOINTS
// ============================================================================

/**
 * GET /api/students/:student_id/learning-style
 * Get or detect learning style
 */
router.get('/students/:student_id/learning-style', async (req: Request, res: Response) => {
  try {
    const { student_id } = req.params;
    const profile = await learningStyle.getLearningStyleProfile(student_id);
    
    res.json({
      success: true,
      profile
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/students/:student_id/adaptive-recommendations
 * Get style-adapted recommendations
 */
router.get('/students/:student_id/adaptive-recommendations', async (req: Request, res: Response) => {
  try {
    const { student_id } = req.params;
    const { topic_id, limit } = req.query;
    
    const recs = await learningStyle.getAdaptiveRecommendations(
      student_id,
      topic_id as string,
      limit ? parseInt(limit as string) : 10
    );
    
    res.json({
      success: true,
      recommendations: recs
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
