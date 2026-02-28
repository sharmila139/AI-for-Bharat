/**
 * Knowledge Base API Endpoints
 * RESTful API for sustainable farming knowledge base
 */

import { Router, Request, Response } from 'express';
import { Pool } from 'pg';
import multer from 'multer';
import { KnowledgeBaseService } from '../services/agriculture/knowledge-base-service';
import { MediaManagementService } from '../services/agriculture/media-management.service';
import { EvidenceLevelService } from '../services/agriculture/evidence-level.service';
import { ImplementationGuideService } from '../services/agriculture/implementation-guide-service';
import {
  CreateArticleInput,
  UpdateArticleInput,
  ArticleSearchQuery,
  SupportedLanguage,
  ImplementationGuide,
} from '../services/agriculture/knowledge-base-types';

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB max file size
  },
  fileFilter: (_req, file, cb) => {
    // Allow images, videos, and audio
    const allowedMimes = [
      'image/jpeg', 'image/png', 'image/webp', 'image/gif',
      'video/mp4', 'video/webm', 'video/quicktime',
      'audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp4',
    ];
    
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images, videos, and audio files are allowed.'));
    }
  },
});

export function createKnowledgeBaseRouter(pool: Pool): Router {
  const router = Router();
  const knowledgeBaseService = new KnowledgeBaseService(pool);
  const mediaService = new MediaManagementService(pool);
  const guideService = new ImplementationGuideService();

  // ============================================================================
  // Article Management Endpoints
  // ============================================================================

  /**
   * POST /api/knowledge-base/articles
   * Create a new knowledge article
   */
  router.post('/articles', async (req: Request, res: Response) => {
    try {
      const input: CreateArticleInput = req.body;
      const authorId = req.user?.userId; // Assuming auth middleware sets req.user

      if (!authorId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Validate required fields
      if (!input.title || !input.content || !input.category || !input.evidence_level) {
        return res.status(400).json({ 
          error: 'Missing required fields: title, content, category, evidence_level' 
        });
      }

      const article = await knowledgeBaseService.createArticle(input, authorId);
      res.status(201).json(article);
    } catch (error) {
      console.error('Error creating article:', error);
      res.status(500).json({ error: 'Failed to create article' });
    }
  });

  /**
   * GET /api/knowledge-base/articles/:id
   * Get article by ID
   */
  router.get('/articles/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const language = req.query.language as SupportedLanguage | undefined;

      const article = await knowledgeBaseService.getArticleById(id, language);

      if (!article) {
        return res.status(404).json({ error: 'Article not found' });
      }

      res.json(article);
    } catch (error) {
      console.error('Error fetching article:', error);
      res.status(500).json({ error: 'Failed to fetch article' });
    }
  });

  /**
   * PUT /api/knowledge-base/articles/:id
   * Update an existing article
   */
  router.put('/articles/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const input: Partial<CreateArticleInput> = req.body;

      const updateInput: UpdateArticleInput = {
        article_id: id,
        ...input,
      };

      const article = await knowledgeBaseService.updateArticle(updateInput);
      res.json(article);
    } catch (error) {
      console.error('Error updating article:', error);
      res.status(500).json({ error: 'Failed to update article' });
    }
  });

  /**
   * DELETE /api/knowledge-base/articles/:id
   * Delete (archive) an article
   */
  router.delete('/articles/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const success = await knowledgeBaseService.deleteArticle(id);

      if (!success) {
        return res.status(404).json({ error: 'Article not found' });
      }

      res.json({ message: 'Article archived successfully' });
    } catch (error) {
      console.error('Error deleting article:', error);
      res.status(500).json({ error: 'Failed to delete article' });
    }
  });

  /**
   * POST /api/knowledge-base/articles/:id/verify
   * Verify (approve) an article (agricultural officers only)
   */
  router.post('/articles/:id/verify', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { verification_notes } = req.body;
      const verifiedBy = req.user?.userId;

      if (!verifiedBy) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Check if user has agricultural officer role
      // TODO: Implement proper role checking when user role system is in place
      // For now, we assume the middleware has validated the user's role
      // if (req.user?.role !== 'agricultural_officer') {
      //   return res.status(403).json({ error: 'Only agricultural officers can verify content' });
      // }

      const article = await knowledgeBaseService.verifyArticle({
        article_id: id,
        verified_by: verifiedBy,
        verification_notes,
      });

      res.json({
        message: 'Article verified successfully',
        article,
      });
    } catch (error) {
      console.error('Error verifying article:', error);
      res.status(500).json({ error: 'Failed to verify article' });
    }
  });

  /**
   * POST /api/knowledge-base/articles/:id/reject
   * Reject an article verification (agricultural officers only)
   */
  router.post('/articles/:id/reject', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { rejection_reason } = req.body;
      const rejectedBy = req.user?.userId;

      if (!rejectedBy) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      if (!rejection_reason) {
        return res.status(400).json({ error: 'Rejection reason is required' });
      }

      // Check if user has agricultural officer role
      // TODO: Implement proper role checking when user role system is in place
      // if (req.user?.role !== 'agricultural_officer') {
      //   return res.status(403).json({ error: 'Only agricultural officers can reject content' });
      // }

      const article = await knowledgeBaseService.rejectArticle(
        id,
        rejectedBy,
        rejection_reason
      );

      res.json({
        message: 'Article rejected',
        article,
      });
    } catch (error) {
      console.error('Error rejecting article:', error);
      res.status(500).json({ error: 'Failed to reject article' });
    }
  });

  /**
   * POST /api/knowledge-base/answers/:answerId/verify
   * Verify an answer as expert-reviewed (agricultural officers only)
   */
  router.post('/answers/:answerId/verify', async (req: Request, res: Response) => {
    try {
      const { answerId } = req.params;
      const verifiedBy = req.user?.userId;

      if (!verifiedBy) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Check if user has agricultural officer role
      // TODO: Implement proper role checking when user role system is in place
      // if (req.user?.role !== 'agricultural_officer') {
      //   return res.status(403).json({ error: 'Only agricultural officers can verify answers' });
      // }

      const answer = await knowledgeBaseService.verifyAnswer(answerId, verifiedBy);

      res.json({
        message: 'Answer verified as expert-reviewed',
        answer,
      });
    } catch (error) {
      console.error('Error verifying answer:', error);
      if (error instanceof Error && error.message === 'Answer not found') {
        return res.status(404).json({ error: 'Answer not found' });
      }
      res.status(500).json({ error: 'Failed to verify answer' });
    }
  });

  /**
   * POST /api/knowledge-base/success-stories/:storyId/verify
   * Verify (approve) a success story (agricultural officers only)
   */
  router.post('/success-stories/:storyId/verify', async (req: Request, res: Response) => {
    try {
      const { storyId } = req.params;
      const { verification_notes } = req.body;
      const verifiedBy = req.user?.userId;

      if (!verifiedBy) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Check if user has agricultural officer role
      // TODO: Implement proper role checking when user role system is in place
      // if (req.user?.role !== 'agricultural_officer') {
      //   return res.status(403).json({ error: 'Only agricultural officers can verify stories' });
      // }

      const story = await knowledgeBaseService.verifySuccessStory(
        storyId,
        verifiedBy,
        verification_notes
      );

      res.json({
        message: 'Success story verified and approved',
        story,
      });
    } catch (error) {
      console.error('Error verifying success story:', error);
      if (error instanceof Error && error.message === 'Success story not found') {
        return res.status(404).json({ error: 'Success story not found' });
      }
      res.status(500).json({ error: 'Failed to verify success story' });
    }
  });

  /**
   * POST /api/knowledge-base/success-stories/:storyId/reject
   * Reject a success story (agricultural officers only)
   */
  router.post('/success-stories/:storyId/reject', async (req: Request, res: Response) => {
    try {
      const { storyId } = req.params;
      const { rejection_reason } = req.body;
      const rejectedBy = req.user?.userId;

      if (!rejectedBy) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      if (!rejection_reason) {
        return res.status(400).json({ error: 'Rejection reason is required' });
      }

      // Check if user has agricultural officer role
      // TODO: Implement proper role checking when user role system is in place
      // if (req.user?.role !== 'agricultural_officer') {
      //   return res.status(403).json({ error: 'Only agricultural officers can reject stories' });
      // }

      const story = await knowledgeBaseService.rejectSuccessStory(
        storyId,
        rejectedBy,
        rejection_reason
      );

      res.json({
        message: 'Success story rejected',
        story,
      });
    } catch (error) {
      console.error('Error rejecting success story:', error);
      if (error instanceof Error && error.message === 'Success story not found') {
        return res.status(404).json({ error: 'Success story not found' });
      }
      res.status(500).json({ error: 'Failed to reject success story' });
    }
  });

  /**
   * GET /api/knowledge-base/verification/pending
   * Get all pending verification items (agricultural officers only)
   */
  router.get('/verification/pending', async (req: Request, res: Response) => {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Check if user has agricultural officer role
      // TODO: Implement proper role checking when user role system is in place
      // if (req.user?.role !== 'agricultural_officer') {
      //   return res.status(403).json({ error: 'Only agricultural officers can access verification queue' });
      // }

      const pendingItems = await knowledgeBaseService.getPendingVerificationItems();

      res.json({
        pending_articles: pendingItems.articles,
        pending_success_stories: pendingItems.success_stories,
        pending_answers: pendingItems.answers,
        total_pending: 
          pendingItems.articles.length + 
          pendingItems.success_stories.length + 
          pendingItems.answers.length,
      });
    } catch (error) {
      console.error('Error fetching pending verification items:', error);
      res.status(500).json({ error: 'Failed to fetch pending verification items' });
    }
  });

  /**
   * GET /api/knowledge-base/verification/history
   * Get verification history for the current officer
   */
  router.get('/verification/history', async (req: Request, res: Response) => {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Check if user has agricultural officer role
      // TODO: Implement proper role checking when user role system is in place
      // if (req.user?.role !== 'agricultural_officer') {
      //   return res.status(403).json({ error: 'Only agricultural officers can access verification history' });
      // }

      const limit = parseInt(req.query.limit as string) || 50;
      const history = await knowledgeBaseService.getVerificationHistory(userId, limit);

      res.json({
        verified_articles: history.verified_articles,
        verified_success_stories: history.verified_stories,
        verified_answers: history.verified_answers,
        total_verified: 
          history.verified_articles.length + 
          history.verified_stories.length + 
          history.verified_answers.length,
      });
    } catch (error) {
      console.error('Error fetching verification history:', error);
      res.status(500).json({ error: 'Failed to fetch verification history' });
    }
  });

  /**
   * GET /api/knowledge-base/verification/stats
   * Get verification statistics for the current officer
   */
  router.get('/verification/stats', async (req: Request, res: Response) => {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Check if user has agricultural officer role
      // TODO: Implement proper role checking when user role system is in place
      // if (req.user?.role !== 'agricultural_officer') {
      //   return res.status(403).json({ error: 'Only agricultural officers can access verification stats' });
      // }

      const stats = await knowledgeBaseService.getVerificationStats(userId);

      res.json(stats);
    } catch (error) {
      console.error('Error fetching verification stats:', error);
      res.status(500).json({ error: 'Failed to fetch verification stats' });
    }
  });

  /**
   * POST /api/knowledge-base/articles/:id/publish
   * Publish an article
   */
  router.post('/articles/:id/publish', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const article = await knowledgeBaseService.publishArticle({ article_id: id });
      res.json(article);
    } catch (error) {
      console.error('Error publishing article:', error);
      res.status(500).json({ error: 'Failed to publish article' });
    }
  });

  // ============================================================================
  // Search and Discovery Endpoints
  // ============================================================================

  /**
   * POST /api/knowledge-base/search
   * Search articles with natural language and filters
   */
  router.post('/search', async (req: Request, res: Response) => {
    try {
      const searchQuery: ArticleSearchQuery = req.body;

      const results = await knowledgeBaseService.searchArticles(searchQuery);
      res.json(results);
    } catch (error) {
      console.error('Error searching articles:', error);
      res.status(500).json({ error: 'Failed to search articles' });
    }
  });

  /**
   * GET /api/knowledge-base/categories/:category
   * Get articles by category
   */
  router.get('/categories/:category', async (req: Request, res: Response) => {
    try {
      const { category } = req.params;
      const language = req.query.language as SupportedLanguage | undefined;
      const limit = parseInt(req.query.limit as string) || 20;

      const articles = await knowledgeBaseService.getArticlesByCategory(
        category,
        language,
        limit
      );

      res.json(articles);
    } catch (error) {
      console.error('Error fetching articles by category:', error);
      res.status(500).json({ error: 'Failed to fetch articles' });
    }
  });

  /**
   * GET /api/knowledge-base/trending
   * Get trending articles
   */
  router.get('/trending', async (req: Request, res: Response) => {
    try {
      const language = req.query.language as SupportedLanguage | undefined;
      const limit = parseInt(req.query.limit as string) || 10;

      const articles = await knowledgeBaseService.getTrendingArticles(limit, language);
      res.json(articles);
    } catch (error) {
      console.error('Error fetching trending articles:', error);
      res.status(500).json({ error: 'Failed to fetch trending articles' });
    }
  });

  // ============================================================================
  // Community Engagement Endpoints
  // ============================================================================

  /**
   * POST /api/knowledge-base/articles/:id/rate
   * Rate an article
   */
  router.post('/articles/:id/rate', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { rating, review_text } = req.body;
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      if (!rating || rating < 1 || rating > 5) {
        return res.status(400).json({ error: 'Rating must be between 1 and 5' });
      }

      const articleRating = await knowledgeBaseService.rateArticle(
        id,
        userId,
        rating,
        review_text
      );

      res.json(articleRating);
    } catch (error) {
      console.error('Error rating article:', error);
      res.status(500).json({ error: 'Failed to rate article' });
    }
  });

  /**
   * GET /api/knowledge-base/articles/:id/ratings
   * Get article ratings
   */
  router.get('/articles/:id/ratings', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const limit = parseInt(req.query.limit as string) || 10;

      const ratings = await knowledgeBaseService.getArticleRatings(id, limit);
      res.json(ratings);
    } catch (error) {
      console.error('Error fetching ratings:', error);
      res.status(500).json({ error: 'Failed to fetch ratings' });
    }
  });

  /**
   * POST /api/knowledge-base/articles/:id/success-stories
   * Submit a success story
   */
  router.post('/articles/:id/success-stories', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const story = await knowledgeBaseService.submitSuccessStory({
        article_id: id,
        user_id: userId,
        ...req.body,
      });

      res.status(201).json(story);
    } catch (error) {
      console.error('Error submitting success story:', error);
      res.status(500).json({ error: 'Failed to submit success story' });
    }
  });

  /**
   * GET /api/knowledge-base/articles/:id/success-stories
   * Get success stories for an article
   */
  router.get('/articles/:id/success-stories', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const limit = parseInt(req.query.limit as string) || 10;

      const stories = await knowledgeBaseService.getSuccessStories(id, limit);
      res.json(stories);
    } catch (error) {
      console.error('Error fetching success stories:', error);
      res.status(500).json({ error: 'Failed to fetch success stories' });
    }
  });

  /**
   * POST /api/knowledge-base/articles/:id/questions
   * Ask a question about an article
   */
  router.post('/articles/:id/questions', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { question_text } = req.body;
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      if (!question_text) {
        return res.status(400).json({ error: 'Question text is required' });
      }

      const question = await knowledgeBaseService.askQuestion(id, userId, question_text);
      res.status(201).json(question);
    } catch (error) {
      console.error('Error asking question:', error);
      res.status(500).json({ error: 'Failed to ask question' });
    }
  });

  /**
   * POST /api/knowledge-base/questions/:questionId/answers
   * Answer a question
   */
  router.post('/questions/:questionId/answers', async (req: Request, res: Response) => {
    try {
      const { questionId } = req.params;
      const { answer_text, is_expert_answer } = req.body;
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      if (!answer_text) {
        return res.status(400).json({ error: 'Answer text is required' });
      }

      const answer = await knowledgeBaseService.answerQuestion(
        questionId,
        userId,
        answer_text,
        is_expert_answer || false
      );

      res.status(201).json(answer);
    } catch (error) {
      console.error('Error answering question:', error);
      res.status(500).json({ error: 'Failed to answer question' });
    }
  });

  /**
   * GET /api/knowledge-base/articles/:id/qa
   * Get Q&A for an article
   */
  router.get('/articles/:id/qa', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const limit = parseInt(req.query.limit as string) || 10;

      const qa = await knowledgeBaseService.getArticleQA(id, limit);
      res.json(qa);
    } catch (error) {
      console.error('Error fetching Q&A:', error);
      res.status(500).json({ error: 'Failed to fetch Q&A' });
    }
  });

  /**
   * POST /api/knowledge-base/questions/:questionId/upvote
   * Upvote a question
   */
  router.post('/questions/:questionId/upvote', async (req: Request, res: Response) => {
    try {
      const { questionId } = req.params;
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const question = await knowledgeBaseService.upvoteQuestion(questionId, userId);
      res.json(question);
    } catch (error) {
      console.error('Error upvoting question:', error);
      if (error instanceof Error && error.message === 'Question not found') {
        return res.status(404).json({ error: 'Question not found' });
      }
      res.status(500).json({ error: 'Failed to upvote question' });
    }
  });

  /**
   * POST /api/knowledge-base/answers/:answerId/upvote
   * Upvote an answer
   */
  router.post('/answers/:answerId/upvote', async (req: Request, res: Response) => {
    try {
      const { answerId } = req.params;
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const answer = await knowledgeBaseService.upvoteAnswer(answerId, userId);
      res.json(answer);
    } catch (error) {
      console.error('Error upvoting answer:', error);
      if (error instanceof Error && error.message === 'Answer not found') {
        return res.status(404).json({ error: 'Answer not found' });
      }
      res.status(500).json({ error: 'Failed to upvote answer' });
    }
  });

  /**
   * POST /api/knowledge-base/answers/:answerId/accept
   * Accept an answer as the solution
   */
  router.post('/answers/:answerId/accept', async (req: Request, res: Response) => {
    try {
      const { answerId } = req.params;
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const answer = await knowledgeBaseService.acceptAnswer(answerId, userId);
      res.json(answer);
    } catch (error) {
      console.error('Error accepting answer:', error);
      if (error instanceof Error) {
        if (error.message === 'Answer not found') {
          return res.status(404).json({ error: 'Answer not found' });
        }
        if (error.message === 'Only the question owner can accept an answer') {
          return res.status(403).json({ error: 'Only the question owner can accept an answer' });
        }
      }
      res.status(500).json({ error: 'Failed to accept answer' });
    }
  });

  /**
   * POST /api/knowledge-base/success-stories/:storyId/helpful
   * Mark a success story as helpful
   */
  router.post('/success-stories/:storyId/helpful', async (req: Request, res: Response) => {
    try {
      const { storyId } = req.params;
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const story = await knowledgeBaseService.markStoryHelpful(storyId, userId);
      res.json(story);
    } catch (error) {
      console.error('Error marking story as helpful:', error);
      if (error instanceof Error && error.message === 'Success story not found') {
        return res.status(404).json({ error: 'Success story not found' });
      }
      res.status(500).json({ error: 'Failed to mark story as helpful' });
    }
  });

  /**
   * GET /api/knowledge-base/users/:userId/questions
   * Get questions by user
   */
  router.get('/users/:userId/questions', async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const limit = parseInt(req.query.limit as string) || 20;

      const questions = await knowledgeBaseService.getUserQuestions(userId, limit);
      res.json(questions);
    } catch (error) {
      console.error('Error fetching user questions:', error);
      res.status(500).json({ error: 'Failed to fetch user questions' });
    }
  });

  /**
   * GET /api/knowledge-base/users/:userId/answers
   * Get answers by user
   */
  router.get('/users/:userId/answers', async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const limit = parseInt(req.query.limit as string) || 20;

      const answers = await knowledgeBaseService.getUserAnswers(userId, limit);
      res.json(answers);
    } catch (error) {
      console.error('Error fetching user answers:', error);
      res.status(500).json({ error: 'Failed to fetch user answers' });
    }
  });

  // ============================================================================
  // Analytics Endpoints
  // ============================================================================

  /**
   * GET /api/knowledge-base/articles/:id/analytics
   * Get article analytics
   */
  router.get('/articles/:id/analytics', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const analytics = await knowledgeBaseService.getArticleAnalytics(id);
      res.json(analytics);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      res.status(500).json({ error: 'Failed to fetch analytics' });
    }
  });

  /**
   * GET /api/knowledge-base/stats
   * Get knowledge base statistics
   */
  router.get('/stats', async (req: Request, res: Response) => {
    try {
      const stats = await knowledgeBaseService.getKnowledgeBaseStats();
      res.json(stats);
    } catch (error) {
      console.error('Error fetching stats:', error);
      res.status(500).json({ error: 'Failed to fetch stats' });
    }
  });

  // ============================================================================
  // Media Management Endpoints
  // ============================================================================

  /**
   * POST /api/knowledge-base/articles/:id/media
   * Upload media file to an article
   */
  router.post('/articles/:id/media', upload.single('file'), async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const file = req.file;

      if (!file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      // Parse multi-language caption and alt text from request body
      const caption = req.body.caption ? JSON.parse(req.body.caption) : undefined;
      const altText = req.body.altText ? JSON.parse(req.body.altText) : undefined;

      const media = await mediaService.uploadMedia(
        id,
        {
          file: file.buffer,
          filename: file.originalname,
          mimeType: file.mimetype,
          caption,
          altText,
        },
        {
          compressImages: true,
          generateThumbnails: true,
          maxImageSize: 500, // 500KB
        }
      );

      res.status(201).json(media);
    } catch (error) {
      console.error('Error uploading media:', error);
      res.status(500).json({ error: 'Failed to upload media' });
    }
  });

  /**
   * GET /api/knowledge-base/articles/:id/media
   * Get all media for an article
   */
  router.get('/articles/:id/media', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const media = await mediaService.getArticleMedia(id);
      res.json(media);
    } catch (error) {
      console.error('Error fetching media:', error);
      res.status(500).json({ error: 'Failed to fetch media' });
    }
  });

  /**
   * PUT /api/knowledge-base/media/:id
   * Update media metadata (caption, alt text, duration)
   */
  router.put('/media/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { caption, altText, duration } = req.body;

      const updates: any = {};
      if (caption) updates.caption = caption;
      if (altText) updates.altText = altText;
      if (duration !== undefined) updates.duration = duration;

      const media = await mediaService.updateMediaMetadata(id, updates);
      res.json(media);
    } catch (error) {
      console.error('Error updating media:', error);
      if (error instanceof Error && error.message === 'Media not found') {
        return res.status(404).json({ error: 'Media not found' });
      }
      res.status(500).json({ error: 'Failed to update media' });
    }
  });

  /**
   * DELETE /api/knowledge-base/media/:id
   * Delete a media file
   */
  router.delete('/media/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const success = await mediaService.deleteMedia(id);

      if (!success) {
        return res.status(404).json({ error: 'Media not found' });
      }

      res.json({ message: 'Media deleted successfully' });
    } catch (error) {
      console.error('Error deleting media:', error);
      res.status(500).json({ error: 'Failed to delete media' });
    }
  });

  /**
   * GET /api/knowledge-base/media/:id/adaptive
   * Get adaptive media URL based on bandwidth
   */
  router.get('/media/:id/adaptive', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const bandwidth = req.query.bandwidth as 'low' | 'medium' | 'high' | undefined;

      const url = await mediaService.getAdaptiveMediaUrl(id, bandwidth);
      res.json({ url });
    } catch (error) {
      console.error('Error getting adaptive media URL:', error);
      if (error instanceof Error && error.message === 'Media not found') {
        return res.status(404).json({ error: 'Media not found' });
      }
      res.status(500).json({ error: 'Failed to get media URL' });
    }
  });

  /**
   * GET /api/knowledge-base/media/:id/signed-url
   * Get signed URL for temporary media access
   */
  router.get('/media/:id/signed-url', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const expiresIn = parseInt(req.query.expiresIn as string) || 3600; // Default 1 hour

      const url = await mediaService.getSignedMediaUrl(id, expiresIn);
      res.json({ url, expiresIn });
    } catch (error) {
      console.error('Error getting signed URL:', error);
      if (error instanceof Error && error.message === 'Media not found') {
        return res.status(404).json({ error: 'Media not found' });
      }
      res.status(500).json({ error: 'Failed to get signed URL' });
    }
  });

  /**
   * GET /api/knowledge-base/media/:id/qualities
   * Get available video quality options
   */
  router.get('/media/:id/qualities', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      
      // Get media info first
      const query = 'SELECT file_url, media_type FROM article_media WHERE media_id = $1';
      const result = await pool.query(query, [id]);

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Media not found' });
      }

      const media = result.rows[0];

      if (media.media_type !== 'video') {
        return res.status(400).json({ error: 'Media is not a video' });
      }

      const qualities = await mediaService.getVideoQualities(media.file_url);
      res.json({ qualities });
    } catch (error) {
      console.error('Error getting video qualities:', error);
      res.status(500).json({ error: 'Failed to get video qualities' });
    }
  });

  // ============================================================================
  // Evidence Level Endpoints
  // ============================================================================

  /**
   * GET /api/knowledge-base/evidence-levels
   * Get information about all evidence levels
   */
  router.get('/evidence-levels', (_req: Request, res: Response) => {
    try {
      const info = EvidenceLevelService.getEvidenceLevelInfo();
      res.json(info);
    } catch (error) {
      console.error('Error fetching evidence level info:', error);
      res.status(500).json({ error: 'Failed to fetch evidence level information' });
    }
  });

  /**
   * GET /api/knowledge-base/evidence-levels/filters
   * Get evidence level filter options
   */
  router.get('/evidence-levels/filters', (req: Request, res: Response) => {
    try {
      const language = (req.query.language as 'en' | 'hi') || 'en';
      const filters = EvidenceLevelService.getEvidenceLevelFilters(language);
      res.json(filters);
    } catch (error) {
      console.error('Error fetching evidence level filters:', error);
      res.status(500).json({ error: 'Failed to fetch evidence level filters' });
    }
  });

  /**
   * POST /api/knowledge-base/articles/:id/validate-evidence
   * Validate evidence level for an article
   */
  router.post('/articles/:id/validate-evidence', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      // Get article
      const article = await knowledgeBaseService.getArticleById(id);
      if (!article) {
        return res.status(404).json({ error: 'Article not found' });
      }

      // Validate evidence level
      const validation = EvidenceLevelService.validateEvidenceLevel(
        article.evidence_level,
        article.scientific_references,
        article.verified_by
      );

      res.json({
        article_id: id,
        evidence_level: article.evidence_level,
        ...validation,
      });
    } catch (error) {
      console.error('Error validating evidence level:', error);
      res.status(500).json({ error: 'Failed to validate evidence level' });
    }
  });

  /**
   * POST /api/knowledge-base/articles/:id/classify-evidence
   * Automatically classify evidence level for an article
   */
  router.post('/articles/:id/classify-evidence', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      // Get article
      const article = await knowledgeBaseService.getArticleById(id);
      if (!article) {
        return res.status(404).json({ error: 'Article not found' });
      }

      // Classify evidence level
      const classification = EvidenceLevelService.classifyEvidenceLevel(
        article.scientific_references,
        article.verified_by,
        article.success_story_count
      );

      res.json({
        article_id: id,
        current_evidence_level: article.evidence_level,
        suggested_evidence_level: classification.level,
        ...classification,
      });
    } catch (error) {
      console.error('Error classifying evidence level:', error);
      res.status(500).json({ error: 'Failed to classify evidence level' });
    }
  });

  /**
   * GET /api/knowledge-base/articles/:id/evidence-badge
   * Get evidence level badge for display
   */
  router.get('/articles/:id/evidence-badge', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const language = (req.query.language as 'en' | 'hi') || 'en';

      // Get article
      const article = await knowledgeBaseService.getArticleById(id);
      if (!article) {
        return res.status(404).json({ error: 'Article not found' });
      }

      const badge = EvidenceLevelService.getEvidenceLevelBadge(
        article.evidence_level,
        language
      );

      res.json({
        article_id: id,
        ...badge,
        scientific_references_count: article.scientific_references.length,
        is_verified: !!article.verified_by,
      });
    } catch (error) {
      console.error('Error fetching evidence badge:', error);
      res.status(500).json({ error: 'Failed to fetch evidence badge' });
    }
  });

  // ============================================================================
  // Implementation Guide Endpoints
  // ============================================================================

  /**
   * POST /api/knowledge-base/articles/:id/implementation-guide
   * Add or update implementation guide for an article
   */
  router.post('/articles/:id/implementation-guide', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const guide: ImplementationGuide = req.body;

      // Validate the guide
      const errors = guideService.validateGuide(guide);
      if (errors.length > 0) {
        return res.status(400).json({ 
          error: 'Invalid implementation guide',
          validation_errors: errors,
        });
      }

      // Update article with implementation guide
      const article = await knowledgeBaseService.updateArticle({
        article_id: id,
        implementation_guide: guide,
      });

      res.json({
        article_id: id,
        implementation_guide: article.implementation_guide,
        message: 'Implementation guide added successfully',
      });
    } catch (error) {
      console.error('Error adding implementation guide:', error);
      res.status(500).json({ error: 'Failed to add implementation guide' });
    }
  });

  /**
   * GET /api/knowledge-base/articles/:id/implementation-guide
   * Get implementation guide for an article
   */
  router.get('/articles/:id/implementation-guide', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const language = req.query.language as SupportedLanguage | undefined;

      const article = await knowledgeBaseService.getArticleById(id, language);
      if (!article) {
        return res.status(404).json({ error: 'Article not found' });
      }

      if (!article.implementation_guide) {
        return res.status(404).json({ error: 'No implementation guide found for this article' });
      }

      res.json({
        article_id: id,
        implementation_guide: article.implementation_guide,
      });
    } catch (error) {
      console.error('Error fetching implementation guide:', error);
      res.status(500).json({ error: 'Failed to fetch implementation guide' });
    }
  });

  /**
   * POST /api/knowledge-base/implementation-guide/validate
   * Validate an implementation guide without saving
   */
  router.post('/implementation-guide/validate', (req: Request, res: Response) => {
    try {
      const guide: ImplementationGuide = req.body;

      const errors = guideService.validateGuide(guide);
      const isComplete = guideService.isGuideComplete(guide);

      res.json({
        is_valid: errors.length === 0,
        is_complete: isComplete,
        validation_errors: errors,
      });
    } catch (error) {
      console.error('Error validating implementation guide:', error);
      res.status(500).json({ error: 'Failed to validate implementation guide' });
    }
  });

  /**
   * GET /api/knowledge-base/implementation-guide/templates
   * Get all available implementation guide templates
   */
  router.get('/implementation-guide/templates', (_req: Request, res: Response) => {
    try {
      const templates = guideService.getTemplates();
      
      res.json({
        templates: templates.map(t => ({
          name: t.name,
          category: t.category,
          description: t.description,
          difficulty_level: t.guide.difficulty_level,
          timeline: t.guide.timeline,
          steps_count: t.guide.steps.length,
          materials_count: t.guide.materials.length,
          tools_count: t.guide.tools.length,
        })),
      });
    } catch (error) {
      console.error('Error fetching templates:', error);
      res.status(500).json({ error: 'Failed to fetch templates' });
    }
  });

  /**
   * GET /api/knowledge-base/implementation-guide/templates/:name
   * Get a specific implementation guide template
   */
  router.get('/implementation-guide/templates/:name', (req: Request, res: Response) => {
    try {
      const { name } = req.params;
      const template = guideService.getTemplateByName(name);

      if (!template) {
        return res.status(404).json({ error: 'Template not found' });
      }

      res.json(template);
    } catch (error) {
      console.error('Error fetching template:', error);
      res.status(500).json({ error: 'Failed to fetch template' });
    }
  });

  /**
   * POST /api/knowledge-base/articles/:id/implementation-guide/from-template
   * Apply a template to an article's implementation guide
   */
  router.post('/articles/:id/implementation-guide/from-template', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { template_name } = req.body;

      if (!template_name) {
        return res.status(400).json({ error: 'Template name is required' });
      }

      const template = guideService.getTemplateByName(template_name);
      if (!template) {
        return res.status(404).json({ error: 'Template not found' });
      }

      // Update article with template guide
      const article = await knowledgeBaseService.updateArticle({
        article_id: id,
        implementation_guide: template.guide,
      });

      res.json({
        article_id: id,
        template_name,
        implementation_guide: article.implementation_guide,
        message: 'Template applied successfully',
      });
    } catch (error) {
      console.error('Error applying template:', error);
      res.status(500).json({ error: 'Failed to apply template' });
    }
  });

  // ============================================================================
  // Crop Rotation Plan Endpoints
  // ============================================================================

  /**
   * POST /api/knowledge-base/crop-rotation/generate
   * Generate a crop rotation plan based on farm profile and goals
   */
  router.post('/crop-rotation/generate', async (req: Request, res: Response) => {
    try {
      const {
        district,
        state,
        soil_type,
        land_area,
        current_crop,
        previous_crops,
        farmer_goals,
        num_seasons,
        language,
      } = req.body;

      // Validate required fields
      if (!district || !state || !soil_type || !land_area || !farmer_goals || !num_seasons) {
        return res.status(400).json({
          error: 'Missing required fields: district, state, soil_type, land_area, farmer_goals, num_seasons',
        });
      }

      // Validate farmer goals
      const validGoals = ['yield', 'sustainability', 'profit'];
      if (!Array.isArray(farmer_goals) || !farmer_goals.every(goal => validGoals.includes(goal))) {
        return res.status(400).json({
          error: 'farmer_goals must be an array containing: yield, sustainability, or profit',
        });
      }

      // Validate num_seasons
      if (num_seasons < 4 || num_seasons > 16) {
        return res.status(400).json({
          error: 'num_seasons must be between 4 and 16 (2-4 years)',
        });
      }

      const plan = await knowledgeBaseService.generateRotationPlan({
        district,
        state,
        soil_type,
        land_area,
        current_crop,
        previous_crops: previous_crops || [],
        farmer_goals,
        num_seasons,
        language: language || 'en',
      });

      res.json({
        message: 'Crop rotation plan generated successfully',
        plan,
      });
    } catch (error) {
      console.error('Error generating crop rotation plan:', error);
      if (error instanceof Error) {
        return res.status(400).json({ error: error.message });
      }
      res.status(500).json({ error: 'Failed to generate crop rotation plan' });
    }
  });

  /**
   * POST /api/knowledge-base/crop-rotation/validate
   * Validate a rotation sequence for proper crop family rotation
   */
  router.post('/crop-rotation/validate', async (req: Request, res: Response) => {
    try {
      const { rotation_sequence } = req.body;

      if (!rotation_sequence || !Array.isArray(rotation_sequence)) {
        return res.status(400).json({
          error: 'rotation_sequence is required and must be an array',
        });
      }

      const validation = knowledgeBaseService.validateRotationSequence(rotation_sequence);

      res.json({
        message: validation.valid ? 'Rotation sequence is valid' : 'Rotation sequence has issues',
        ...validation,
      });
    } catch (error) {
      console.error('Error validating rotation sequence:', error);
      res.status(500).json({ error: 'Failed to validate rotation sequence' });
    }
  });

  /**
   * GET /api/knowledge-base/crop-rotation/recommendations/:cropFamily
   * Get rotation recommendations by crop family
   */
  router.get('/crop-rotation/recommendations/:cropFamily', async (req: Request, res: Response) => {
    try {
      const { cropFamily } = req.params;

      const recommendations = knowledgeBaseService.getRotationRecommendationsByCropFamily(cropFamily);

      res.json({
        crop_family: cropFamily,
        ...recommendations,
      });
    } catch (error) {
      console.error('Error fetching rotation recommendations:', error);
      res.status(500).json({ error: 'Failed to fetch rotation recommendations' });
    }
  });

  /**
   * POST /api/knowledge-base/crop-rotation/nutrient-balance
   * Calculate soil nutrient balance over rotation cycle
   */
  router.post('/crop-rotation/nutrient-balance', async (req: Request, res: Response) => {
    try {
      const { rotation_sequence } = req.body;

      if (!rotation_sequence || !Array.isArray(rotation_sequence)) {
        return res.status(400).json({
          error: 'rotation_sequence is required and must be an array',
        });
      }

      const balance = knowledgeBaseService.calculateSoilNutrientBalance(rotation_sequence);

      res.json({
        message: 'Soil nutrient balance calculated successfully',
        ...balance,
        interpretation: {
          nitrogen: balance.nitrogen_balance > 0 ? 'positive' : balance.nitrogen_balance < -20 ? 'critical' : 'moderate',
          phosphorus: balance.phosphorus_balance > -30 ? 'acceptable' : 'needs_supplementation',
          potassium: balance.potassium_balance > -30 ? 'acceptable' : 'needs_supplementation',
          organic_matter: balance.organic_matter_change > 10 ? 'excellent' : balance.organic_matter_change > 0 ? 'good' : 'poor',
          overall: balance.overall_health_score >= 70 ? 'healthy' : balance.overall_health_score >= 50 ? 'moderate' : 'poor',
        },
      });
    } catch (error) {
      console.error('Error calculating nutrient balance:', error);
      res.status(500).json({ error: 'Failed to calculate nutrient balance' });
    }
  });

  return router;
}

// Export for use in main app
export default createKnowledgeBaseRouter;
