/**
 * Natural Medicine API Endpoints
 * 
 * RESTful API for natural medicine database with:
 * - Remedy search and filtering
 * - Dosage calculation
 * - Safety information
 * - Seasonal availability
 * - User ratings
 * - Verification workflow
 */

import { Router, Request, Response } from 'express';
import { Pool } from 'pg';
import {
  RemedySearchService,
  PreparationMethodService,
  DosageCalculatorService,
  SafetyInformationService,
  SeasonalAvailabilityService,
  EfficacyRatingService,
  MediaDeliveryService,
  VerificationWorkflowService
} from '../services/health/natural-medicine';

export function createNaturalMedicineRouter(pool: Pool): Router {
  const router = Router();
  
  // Initialize services
  const searchService = new RemedySearchService(pool);
  const preparationService = new PreparationMethodService(pool);
  const dosageService = new DosageCalculatorService(pool);
  const safetyService = new SafetyInformationService(pool);
  const seasonalService = new SeasonalAvailabilityService(pool);
  const efficacyService = new EfficacyRatingService(pool);
  const mediaService = new MediaDeliveryService(pool);
  const verificationService = new VerificationWorkflowService(pool);
  
  /**
   * POST /api/natural-medicine/search
   * Search remedies with filters and ranking
   */
  router.post('/search', async (req: Request, res: Response) => {
    try {
      const { query, filters, page = 1, page_size = 20 } = req.body;
      
      const results = await searchService.searchRemedies(
        query,
        filters,
        page,
        page_size
      );
      
      res.json(results);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });
  
  /**
   * GET /api/natural-medicine/remedies/:id
   * Get complete remedy details
   */
  router.get('/remedies/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      
      // Get remedy basic info
      const remedyQuery = `SELECT * FROM remedies WHERE remedy_id = $1`;
      const remedyResult = await pool.query(remedyQuery, [id]);
      
      if (remedyResult.rows.length === 0) {
        return res.status(404).json({ error: 'Remedy not found' });
      }
      
      const remedy = remedyResult.rows[0];
      
      // Get related data
      const [
        ingredients,
        preparationSteps,
        dosageGuidelines,
        safetyInfo,
        efficacyRating,
        media
      ] = await Promise.all([
        pool.query('SELECT * FROM remedy_ingredients WHERE remedy_id = $1 ORDER BY display_order', [id]),
        preparationService.getPreparationSteps(id),
        dosageService.getAllDosageGuidelines(id),
        safetyService.getSafetyInfo(id),
        efficacyService.getEfficacyRating(id),
        mediaService.getRemedyMedia(id)
      ]);
      
      res.json({
        ...remedy,
        ingredients: ingredients.rows,
        preparation_steps: preparationSteps,
        dosage_guidelines: dosageGuidelines,
        safety_info: safetyInfo,
        efficacy_rating: efficacyRating,
        media
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });
  
  /**
   * POST /api/natural-medicine/dosage/calculate
   * Calculate age-specific dosage
   */
  router.post('/dosage/calculate', async (req: Request, res: Response) => {
    try {
      const dosageInput = req.body;
      const result = await dosageService.calculateDosage(dosageInput);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });
  
  /**
   * GET /api/natural-medicine/remedies/:id/safety
   * Get safety information for a remedy
   */
  router.get('/remedies/:id/safety', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const safetyInfo = await safetyService.getSafetyInfo(id);
      
      if (!safetyInfo) {
        return res.status(404).json({ error: 'Safety information not found' });
      }
      
      res.json(safetyInfo);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });
  
  /**
   * POST /api/natural-medicine/safety/check
   * Check safety for user profile
   */
  router.post('/safety/check', async (req: Request, res: Response) => {
    try {
      const { remedy_id, user_profile } = req.body;
      const result = await safetyService.checkSafetyFlags(remedy_id, user_profile);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });
  
  /**
   * GET /api/natural-medicine/seasonal
   * Get seasonal remedies (ingredients available this month)
   */
  router.get('/seasonal', async (req: Request, res: Response) => {
    try {
      const { month, page = 1, page_size = 20 } = req.query;
      
      const results = await searchService.getSeasonalRemedies(
        Number(page),
        Number(page_size)
      );
      
      res.json(results);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });
  
  /**
   * GET /api/natural-medicine/remedies/:id/availability
   * Check ingredient availability for a remedy
   */
  router.get('/remedies/:id/availability', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { month } = req.query;
      
      const result = await seasonalService.checkIngredientAvailability(
        id,
        month ? Number(month) : undefined
      );
      
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });
  
  /**
   * GET /api/natural-medicine/top-rated
   * Get top-rated remedies
   */
  router.get('/top-rated', async (req: Request, res: Response) => {
    try {
      const { limit = 10 } = req.query;
      const results = await searchService.getTopRatedRemedies(Number(limit));
      res.json(results);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });
  
  /**
   * POST /api/natural-medicine/ratings
   * Add user rating for a remedy
   */
  router.post('/ratings', async (req: Request, res: Response) => {
    try {
      const { remedy_id, user_id, rating, effectiveness, review_text } = req.body;
      
      if (!remedy_id || !user_id || !rating) {
        return res.status(400).json({ error: 'Missing required fields' });
      }
      
      if (rating < 1 || rating > 5) {
        return res.status(400).json({ error: 'Rating must be between 1 and 5' });
      }
      
      await efficacyService.addUserRating(
        remedy_id,
        user_id,
        rating,
        effectiveness,
        review_text
      );
      
      res.json({ success: true, message: 'Rating added successfully' });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });
  
  /**
   * GET /api/natural-medicine/verification/pending
   * Get remedies pending verification (admin/doctor only)
   */
  router.get('/verification/pending', async (req: Request, res: Response) => {
    try {
      // TODO: Add authentication middleware to verify user is a doctor/admin
      const pending = await verificationService.getPendingVerifications();
      res.json(pending);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });
  
  /**
   * POST /api/natural-medicine/verification/review
   * Review a remedy (doctor/admin only)
   */
  router.post('/verification/review', async (req: Request, res: Response) => {
    try {
      // TODO: Add authentication middleware
      const { remedy_id, reviewer_id, status, notes } = req.body;
      
      if (!remedy_id || !reviewer_id || !status) {
        return res.status(400).json({ error: 'Missing required fields' });
      }
      
      if (status !== 'verified' && status !== 'rejected') {
        return res.status(400).json({ error: 'Invalid status' });
      }
      
      await verificationService.reviewRemedy({
        remedy_id,
        reviewer_id,
        status,
        notes
      });
      
      res.json({ success: true, message: 'Review submitted successfully' });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });
  
  /**
   * GET /api/natural-medicine/remedies/:id/media
   * Get all media URLs for a remedy
   */
  router.get('/remedies/:id/media', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const media = await mediaService.getRemedyMedia(id);
      res.json(media);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });
  
  /**
   * GET /api/natural-medicine/search/ailment/:ailment
   * Search remedies by specific ailment
   */
  router.get('/search/ailment/:ailment', async (req: Request, res: Response) => {
    try {
      const { ailment } = req.params;
      const { page = 1, page_size = 20 } = req.query;
      
      const results = await searchService.searchByAilment(
        ailment,
        Number(page),
        Number(page_size)
      );
      
      res.json(results);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });
  
  /**
   * POST /api/natural-medicine/personalized
   * Get personalized remedy recommendations
   */
  router.post('/personalized', async (req: Request, res: Response) => {
    try {
      const { user_profile, ailment, limit = 10 } = req.body;
      
      const results = await searchService.getPersonalizedRemedies(
        user_profile,
        ailment,
        limit
      );
      
      res.json(results);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });
  
  return router;
}
