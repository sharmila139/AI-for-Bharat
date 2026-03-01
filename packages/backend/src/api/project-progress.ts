/**
 * Project Progress Dashboard API
 * 
 * RESTful API endpoints for infrastructure project management
 */

import { Router, Request, Response } from 'express';
import { Pool } from 'pg';
import ProjectProgressService from '../services/infrastructure/project-progress';

const router = Router();

/**
 * Initialize project progress routes
 */
export function initProjectProgressRoutes(pool: Pool): Router {
  const service = new ProjectProgressService(pool);

  // ==========================================================================
  // PROJECT CRUD OPERATIONS
  // ==========================================================================

  /**
   * POST /api/projects
   * Create a new infrastructure project
   */
  router.post('/projects', async (req: Request, res: Response) => {
    try {
      const projectId = await service.createProject(req.body);
      const project = await service.getProject(projectId);
      
      res.status(201).json({
        success: true,
        data: project,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(400).json({
        success: false,
        error: errorMessage,
      });
    }
  });

  /**
   * GET /api/projects/:projectId
   * Get project details by ID
   */
  router.get('/projects/:projectId', async (req: Request, res: Response) => {
    try {
      const project = await service.getProject(req.params.projectId);
      
      if (!project) {
        return res.status(404).json({
          success: false,
          error: 'Project not found',
        });
      }

      res.json({
        success: true,
        data: project,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({
        success: false,
        error: errorMessage,
      });
    }
  });

  /**
   * PUT /api/projects/:projectId
   * Update project details
   */
  router.put('/projects/:projectId', async (req: Request, res: Response) => {
    try {
      await service.updateProject(req.params.projectId, req.body);
      const project = await service.getProject(req.params.projectId);
      
      res.json({
        success: true,
        data: project,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(400).json({
        success: false,
        error: errorMessage,
      });
    }
  });

  /**
   * DELETE /api/projects/:projectId
   * Delete a project
   */
  router.delete('/projects/:projectId', async (req: Request, res: Response) => {
    try {
      await service.deleteProject(req.params.projectId);
      
      res.json({
        success: true,
        message: 'Project deleted successfully',
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({
        success: false,
        error: errorMessage,
      });
    }
  });

  /**
   * GET /api/projects
   * List projects with filters
   */
  router.get('/projects', async (req: Request, res: Response) => {
    try {
      const filters = {
        project_type: req.query.project_type as any,
        status: req.query.status as any,
        district: req.query.district as string,
        state: req.query.state as string,
        is_delayed: req.query.is_delayed === 'true' ? true : req.query.is_delayed === 'false' ? false : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
        offset: req.query.offset ? parseInt(req.query.offset as string) : undefined,
      };

      const projects = await service.listProjects(filters);
      
      res.json({
        success: true,
        data: projects,
        count: projects.length,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({
        success: false,
        error: errorMessage,
      });
    }
  });

  // ==========================================================================
  // BUDGET MANAGEMENT
  // ==========================================================================

  /**
   * PUT /api/projects/:projectId/budget
   * Update project budget and funding sources
   */
  router.put('/projects/:projectId/budget', async (req: Request, res: Response) => {
    try {
      const { total_budget, funding_sources } = req.body;
      
      await service.updateBudget(req.params.projectId, total_budget, funding_sources);
      
      const budget = await service.getBudgetDetails(req.params.projectId);
      
      res.json({
        success: true,
        data: budget,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(400).json({
        success: false,
        error: errorMessage,
      });
    }
  });

  /**
   * GET /api/projects/:projectId/budget
   * Get budget details
   */
  router.get('/projects/:projectId/budget', async (req: Request, res: Response) => {
    try {
      const budget = await service.getBudgetDetails(req.params.projectId);
      
      res.json({
        success: true,
        data: budget,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({
        success: false,
        error: errorMessage,
      });
    }
  });

  /**
   * GET /api/projects/:projectId/budget/status
   * Get budget status (spent, remaining)
   */
  router.get('/projects/:projectId/budget/status', async (req: Request, res: Response) => {
    try {
      const status = await service.calculateBudgetStatus(req.params.projectId);
      
      res.json({
        success: true,
        data: status,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({
        success: false,
        error: errorMessage,
      });
    }
  });

  // ==========================================================================
  // MILESTONE MANAGEMENT
  // ==========================================================================

  /**
   * POST /api/projects/:projectId/milestones
   * Add a milestone
   */
  router.post('/projects/:projectId/milestones', async (req: Request, res: Response) => {
    try {
      const milestoneId = await service.addMilestone(req.params.projectId, req.body);
      const milestones = await service.getMilestones(req.params.projectId);
      const milestone = milestones.find(m => m.milestone_id === milestoneId);
      
      res.status(201).json({
        success: true,
        data: milestone,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(400).json({
        success: false,
        error: errorMessage,
      });
    }
  });

  /**
   * GET /api/projects/:projectId/milestones
   * Get all milestones
   */
  router.get('/projects/:projectId/milestones', async (req: Request, res: Response) => {
    try {
      const milestones = await service.getMilestones(req.params.projectId);
      
      res.json({
        success: true,
        data: milestones,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({
        success: false,
        error: errorMessage,
      });
    }
  });

  /**
   * PUT /api/projects/:projectId/milestones/:milestoneId
   * Update milestone
   */
  router.put('/projects/:projectId/milestones/:milestoneId', async (req: Request, res: Response) => {
    try {
      await service.updateMilestone(req.params.projectId, req.params.milestoneId, req.body);
      const milestones = await service.getMilestones(req.params.projectId);
      const milestone = milestones.find(m => m.milestone_id === req.params.milestoneId);
      
      res.json({
        success: true,
        data: milestone,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(400).json({
        success: false,
        error: errorMessage,
      });
    }
  });

  /**
   * DELETE /api/projects/:projectId/milestones/:milestoneId
   * Delete milestone
   */
  router.delete('/projects/:projectId/milestones/:milestoneId', async (req: Request, res: Response) => {
    try {
      await service.deleteMilestone(req.params.projectId, req.params.milestoneId);
      
      res.json({
        success: true,
        message: 'Milestone deleted successfully',
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({
        success: false,
        error: errorMessage,
      });
    }
  });

  // ==========================================================================
  // PROGRESS TRACKING
  // ==========================================================================

  /**
   * POST /api/projects/:projectId/progress/calculate
   * Calculate progress based on milestones
   */
  router.post('/projects/:projectId/progress/calculate', async (req: Request, res: Response) => {
    try {
      const progress = await service.calculateProgress(req.params.projectId);
      
      res.json({
        success: true,
        data: { progress_percentage: progress },
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({
        success: false,
        error: errorMessage,
      });
    }
  });

  /**
   * PUT /api/projects/:projectId/progress
   * Manually set progress percentage
   */
  router.put('/projects/:projectId/progress', async (req: Request, res: Response) => {
    try {
      const { progress_percentage } = req.body;
      
      await service.setProgress(req.params.projectId, progress_percentage);
      
      res.json({
        success: true,
        data: { progress_percentage },
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(400).json({
        success: false,
        error: errorMessage,
      });
    }
  });

  // ==========================================================================
  // DELAY MANAGEMENT
  // ==========================================================================

  /**
   * POST /api/projects/:projectId/delay/check
   * Check and update delay status
   */
  router.post('/projects/:projectId/delay/check', async (req: Request, res: Response) => {
    try {
      await service.checkDelayStatus(req.params.projectId);
      const project = await service.getProject(req.params.projectId);
      
      res.json({
        success: true,
        data: {
          is_delayed: project?.is_delayed,
          delay_days: project?.delay_days,
          delay_reasons: project?.delay_reasons,
        },
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({
        success: false,
        error: errorMessage,
      });
    }
  });

  /**
   * POST /api/projects/:projectId/delay/reason
   * Add delay reason
   */
  router.post('/projects/:projectId/delay/reason', async (req: Request, res: Response) => {
    try {
      const { reason } = req.body;
      
      await service.addDelayReason(req.params.projectId, reason);
      const project = await service.getProject(req.params.projectId);
      
      res.json({
        success: true,
        data: {
          delay_reasons: project?.delay_reasons,
        },
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(400).json({
        success: false,
        error: errorMessage,
      });
    }
  });

  /**
   * PUT /api/projects/:projectId/completion-date
   * Update estimated completion date
   */
  router.put('/projects/:projectId/completion-date', async (req: Request, res: Response) => {
    try {
      const { estimated_completion_date } = req.body;
      
      await service.updateEstimatedCompletion(req.params.projectId, new Date(estimated_completion_date));
      const project = await service.getProject(req.params.projectId);
      
      res.json({
        success: true,
        data: {
          estimated_completion_date: project?.estimated_completion_date,
          is_delayed: project?.is_delayed,
          delay_days: project?.delay_days,
        },
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(400).json({
        success: false,
        error: errorMessage,
      });
    }
  });

  // ==========================================================================
  // PROJECT UPDATES
  // ==========================================================================

  /**
   * POST /api/projects/:projectId/updates
   * Add project update
   */
  router.post('/projects/:projectId/updates', async (req: Request, res: Response) => {
    try {
      const updateData = {
        ...req.body,
        project_id: req.params.projectId,
        update_date: req.body.update_date ? new Date(req.body.update_date) : new Date(),
      };
      
      const updateId = await service.addProjectUpdate(updateData);
      const updates = await service.getProjectUpdates(req.params.projectId);
      const update = updates.find(u => u.update_id === updateId);
      
      res.status(201).json({
        success: true,
        data: update,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(400).json({
        success: false,
        error: errorMessage,
      });
    }
  });

  /**
   * GET /api/projects/:projectId/updates
   * Get all project updates
   */
  router.get('/projects/:projectId/updates', async (req: Request, res: Response) => {
    try {
      const updates = await service.getProjectUpdates(req.params.projectId);
      
      res.json({
        success: true,
        data: updates,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({
        success: false,
        error: errorMessage,
      });
    }
  });

  /**
   * GET /api/projects/:projectId/updates/latest
   * Get latest project update
   */
  router.get('/projects/:projectId/updates/latest', async (req: Request, res: Response) => {
    try {
      const update = await service.getLatestUpdate(req.params.projectId);
      
      res.json({
        success: true,
        data: update,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({
        success: false,
        error: errorMessage,
      });
    }
  });

  // ==========================================================================
  // STAKEHOLDER MANAGEMENT
  // ==========================================================================

  /**
   * PUT /api/projects/:projectId/contractor
   * Update contractor information
   */
  router.put('/projects/:projectId/contractor', async (req: Request, res: Response) => {
    try {
      const { contractor_name, contractor_contact } = req.body;
      
      await service.updateContractor(req.params.projectId, contractor_name, contractor_contact);
      
      res.json({
        success: true,
        data: { contractor_name, contractor_contact },
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(400).json({
        success: false,
        error: errorMessage,
      });
    }
  });

  /**
   * PUT /api/projects/:projectId/supervisor
   * Update supervisor information
   */
  router.put('/projects/:projectId/supervisor', async (req: Request, res: Response) => {
    try {
      const { supervisor_name, supervisor_contact } = req.body;
      
      await service.updateSupervisor(req.params.projectId, supervisor_name, supervisor_contact);
      
      res.json({
        success: true,
        data: { supervisor_name, supervisor_contact },
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(400).json({
        success: false,
        error: errorMessage,
      });
    }
  });

  /**
   * GET /api/projects/:projectId/stakeholders
   * Get all stakeholder information
   */
  router.get('/projects/:projectId/stakeholders', async (req: Request, res: Response) => {
    try {
      const stakeholders = await service.getStakeholders(req.params.projectId);
      
      res.json({
        success: true,
        data: stakeholders,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({
        success: false,
        error: errorMessage,
      });
    }
  });

  // ==========================================================================
  // QUALITY INSPECTIONS
  // ==========================================================================

  /**
   * POST /api/projects/:projectId/inspections
   * Add quality inspection report
   */
  router.post('/projects/:projectId/inspections', async (req: Request, res: Response) => {
    try {
      const inspectionData = {
        ...req.body,
        inspection_date: req.body.inspection_date ? new Date(req.body.inspection_date) : new Date(),
      };
      
      const inspectionId = await service.addQualityInspection(req.params.projectId, inspectionData);
      const inspections = await service.getQualityInspections(req.params.projectId);
      const inspection = inspections.find(i => i.inspection_id === inspectionId);
      
      res.status(201).json({
        success: true,
        data: inspection,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(400).json({
        success: false,
        error: errorMessage,
      });
    }
  });

  /**
   * GET /api/projects/:projectId/inspections
   * Get all quality inspections
   */
  router.get('/projects/:projectId/inspections', async (req: Request, res: Response) => {
    try {
      const inspections = await service.getQualityInspections(req.params.projectId);
      
      res.json({
        success: true,
        data: inspections,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({
        success: false,
        error: errorMessage,
      });
    }
  });

  /**
   * GET /api/projects/:projectId/inspections/latest
   * Get latest quality inspection
   */
  router.get('/projects/:projectId/inspections/latest', async (req: Request, res: Response) => {
    try {
      const inspection = await service.getLatestQualityInspection(req.params.projectId);
      
      res.json({
        success: true,
        data: inspection,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({
        success: false,
        error: errorMessage,
      });
    }
  });

  /**
   * GET /api/projects/:projectId/quality-rating
   * Get quality rating
   */
  router.get('/projects/:projectId/quality-rating', async (req: Request, res: Response) => {
    try {
      const rating = await service.getQualityRating(req.params.projectId);
      
      res.json({
        success: true,
        data: { quality_rating: rating },
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({
        success: false,
        error: errorMessage,
      });
    }
  });

  // ==========================================================================
  // TRANSPARENCY DOCUMENTS
  // ==========================================================================

  /**
   * POST /api/projects/:projectId/documents
   * Add transparency document
   */
  router.post('/projects/:projectId/documents', async (req: Request, res: Response) => {
    try {
      const documentId = await service.addDocument(req.params.projectId, req.body);
      const documents = await service.getDocuments(req.params.projectId);
      const document = documents.find(d => d.document_id === documentId);
      
      res.status(201).json({
        success: true,
        data: document,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(400).json({
        success: false,
        error: errorMessage,
      });
    }
  });

  /**
   * GET /api/projects/:projectId/documents
   * Get all documents
   */
  router.get('/projects/:projectId/documents', async (req: Request, res: Response) => {
    try {
      const documentType = req.query.type as any;
      
      const documents = documentType
        ? await service.getDocumentsByType(req.params.projectId, documentType)
        : await service.getDocuments(req.params.projectId);
      
      res.json({
        success: true,
        data: documents,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({
        success: false,
        error: errorMessage,
      });
    }
  });

  /**
   * DELETE /api/projects/:projectId/documents/:documentId
   * Delete document
   */
  router.delete('/projects/:projectId/documents/:documentId', async (req: Request, res: Response) => {
    try {
      await service.deleteDocument(req.params.projectId, req.params.documentId);
      
      res.json({
        success: true,
        message: 'Document deleted successfully',
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({
        success: false,
        error: errorMessage,
      });
    }
  });

  return router;
}

export default initProjectProgressRoutes;
