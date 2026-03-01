/**
 * Project Progress Dashboard Service
 * 
 * Handles:
 * - Infrastructure project management (Task 23.1)
 * - Budget tracking with funding sources (Task 23.2)
 * - Timeline tracking with milestone management (Task 23.3)
 * - Progress percentage calculation (Task 23.4)
 * - Delay detection and tracking (Task 23.5)
 * - Project update system with photos (Task 23.6)
 * - Contractor and supervisor information (Task 23.7)
 * - Quality inspection reports (Task 23.8)
 * - Transparency document management (Task 23.9)
 */

import { Pool } from 'pg';

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

export type ProjectType = 
  | 'road' 
  | 'bridge' 
  | 'water_supply' 
  | 'sanitation' 
  | 'electricity' 
  | 'school' 
  | 'hospital' 
  | 'community_center' 
  | 'other';

export type ProjectStatus = 
  | 'planned' 
  | 'approved' 
  | 'in_progress' 
  | 'on_hold' 
  | 'completed' 
  | 'cancelled';

export type UpdateType = 
  | 'progress' 
  | 'milestone' 
  | 'delay' 
  | 'budget' 
  | 'quality' 
  | 'completion';

export interface FundingSource {
  source_name: string;
  amount: number;
  percentage: number;
}

export interface Milestone {
  milestone_id: string;
  name: string;
  description?: string;
  target_date: Date;
  completion_date?: Date;
  status: 'pending' | 'in_progress' | 'completed' | 'delayed';
  weight: number; // Percentage weight for progress calculation
}

export interface QualityInspection {
  inspection_id: string;
  inspection_date: Date;
  inspector_name: string;
  inspector_designation: string;
  quality_score: number; // 0-10
  findings: string;
  recommendations: string;
  photos?: string[];
  status: 'passed' | 'failed' | 'conditional';
}

export interface TransparencyDocument {
  document_id: string;
  document_type: 'tender' | 'contract' | 'approval' | 'budget' | 'report' | 'other';
  document_name: string;
  document_url: string;
  uploaded_date: Date;
  file_size?: number;
  description?: string;
}

export interface ProjectUpdate {
  update_id?: string;
  project_id: string;
  update_type: UpdateType;
  title: string;
  description: string;
  progress_percentage?: number;
  photos?: string[];
  videos?: string[];
  documents?: string[];
  updated_by: string;
  updated_by_role: 'contractor' | 'supervisor' | 'agency' | 'admin';
  update_date: Date;
}

export interface CreateProjectData {
  project_name: string;
  project_code?: string;
  project_type: ProjectType;
  description?: string;
  latitude?: number;
  longitude?: number;
  address?: string;
  district: string;
  state: string;
  pincode?: string;
  total_budget: number;
  budget_currency?: string;
  funding_sources?: FundingSource[];
  planned_start_date: Date;
  planned_end_date: Date;
  contractor_name?: string;
  contractor_contact?: string;
  supervisor_name?: string;
  supervisor_contact?: string;
  implementing_agency?: string;
  beneficiaries_count?: number;
}

export interface UpdateProjectData {
  project_name?: string;
  description?: string;
  status?: ProjectStatus;
  progress_percentage?: number;
  current_phase?: string;
  actual_start_date?: Date;
  actual_end_date?: Date;
  estimated_completion_date?: Date;
  contractor_name?: string;
  contractor_contact?: string;
  supervisor_name?: string;
  supervisor_contact?: string;
}

export interface ProjectDetails {
  project_id: string;
  project_name: string;
  project_code?: string;
  project_type: ProjectType;
  description?: string;
  latitude?: number;
  longitude?: number;
  address?: string;
  district: string;
  state: string;
  pincode?: string;
  total_budget: number;
  budget_currency: string;
  funding_sources?: FundingSource[];
  planned_start_date: Date;
  planned_end_date: Date;
  actual_start_date?: Date;
  actual_end_date?: Date;
  estimated_completion_date?: Date;
  progress_percentage: number;
  current_phase?: string;
  milestones?: Milestone[];
  is_delayed: boolean;
  delay_days: number;
  delay_reasons?: string[];
  contractor_name?: string;
  contractor_contact?: string;
  supervisor_name?: string;
  supervisor_contact?: string;
  implementing_agency?: string;
  quality_inspections?: QualityInspection[];
  quality_rating?: number;
  documents?: TransparencyDocument[];
  status: ProjectStatus;
  beneficiaries_count?: number;
  community_feedback_count: number;
  average_community_rating?: number;
  created_at: Date;
  updated_at: Date;
}

// ============================================================================
// PROJECT PROGRESS SERVICE
// ============================================================================

export class ProjectProgressService {
  constructor(private pool: Pool) {}

  // ==========================================================================
  // TASK 23.1: Infrastructure Project Management System
  // ==========================================================================

  /**
   * Create a new infrastructure project
   */
  async createProject(data: CreateProjectData): Promise<string> {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');

      const result = await client.query(
        `INSERT INTO infrastructure_projects (
          project_name, project_code, project_type, description,
          latitude, longitude, address, district, state, pincode,
          total_budget, budget_currency, funding_sources,
          planned_start_date, planned_end_date,
          contractor_name, contractor_contact,
          supervisor_name, supervisor_contact,
          implementing_agency, beneficiaries_count,
          status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, 'planned')
        RETURNING project_id`,
        [
          data.project_name,
          data.project_code,
          data.project_type,
          data.description,
          data.latitude,
          data.longitude,
          data.address,
          data.district,
          data.state,
          data.pincode,
          data.total_budget,
          data.budget_currency || 'INR',
          data.funding_sources ? JSON.stringify(data.funding_sources) : null,
          data.planned_start_date,
          data.planned_end_date,
          data.contractor_name,
          data.contractor_contact,
          data.supervisor_name,
          data.supervisor_contact,
          data.implementing_agency,
          data.beneficiaries_count,
        ]
      );

      const projectId = result.rows[0].project_id;

      await client.query('COMMIT');
      return projectId;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get project by ID with all details
   */
  async getProject(projectId: string): Promise<ProjectDetails | null> {
    const result = await this.pool.query(
      `SELECT 
        project_id, project_name, project_code, project_type, description,
        latitude, longitude, address, district, state, pincode,
        total_budget, budget_currency, funding_sources,
        planned_start_date, planned_end_date,
        actual_start_date, actual_end_date, estimated_completion_date,
        progress_percentage, current_phase, milestones,
        is_delayed, delay_days, delay_reasons,
        contractor_name, contractor_contact,
        supervisor_name, supervisor_contact,
        implementing_agency,
        quality_inspections, quality_rating,
        documents, status,
        beneficiaries_count, community_feedback_count, average_community_rating,
        created_at, updated_at
       FROM infrastructure_projects
       WHERE project_id = $1`,
      [projectId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];
    return this.mapRowToProjectDetails(row);
  }

  /**
   * Update project details
   */
  async updateProject(projectId: string, data: UpdateProjectData): Promise<void> {
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (data.project_name !== undefined) {
      updates.push(`project_name = $${paramIndex++}`);
      values.push(data.project_name);
    }
    if (data.description !== undefined) {
      updates.push(`description = $${paramIndex++}`);
      values.push(data.description);
    }
    if (data.status !== undefined) {
      updates.push(`status = $${paramIndex++}`);
      values.push(data.status);
    }
    if (data.progress_percentage !== undefined) {
      updates.push(`progress_percentage = $${paramIndex++}`);
      values.push(data.progress_percentage);
    }
    if (data.current_phase !== undefined) {
      updates.push(`current_phase = $${paramIndex++}`);
      values.push(data.current_phase);
    }
    if (data.actual_start_date !== undefined) {
      updates.push(`actual_start_date = $${paramIndex++}`);
      values.push(data.actual_start_date);
    }
    if (data.actual_end_date !== undefined) {
      updates.push(`actual_end_date = $${paramIndex++}`);
      values.push(data.actual_end_date);
    }
    if (data.estimated_completion_date !== undefined) {
      updates.push(`estimated_completion_date = $${paramIndex++}`);
      values.push(data.estimated_completion_date);
    }
    if (data.contractor_name !== undefined) {
      updates.push(`contractor_name = $${paramIndex++}`);
      values.push(data.contractor_name);
    }
    if (data.contractor_contact !== undefined) {
      updates.push(`contractor_contact = $${paramIndex++}`);
      values.push(data.contractor_contact);
    }
    if (data.supervisor_name !== undefined) {
      updates.push(`supervisor_name = $${paramIndex++}`);
      values.push(data.supervisor_name);
    }
    if (data.supervisor_contact !== undefined) {
      updates.push(`supervisor_contact = $${paramIndex++}`);
      values.push(data.supervisor_contact);
    }

    if (updates.length === 0) {
      return;
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(projectId);

    await this.pool.query(
      `UPDATE infrastructure_projects SET ${updates.join(', ')} WHERE project_id = $${paramIndex}`,
      values
    );
  }

  /**
   * Delete project
   */
  async deleteProject(projectId: string): Promise<void> {
    await this.pool.query(
      'DELETE FROM infrastructure_projects WHERE project_id = $1',
      [projectId]
    );
  }

  /**
   * List projects with filters
   */
  async listProjects(filters?: {
    project_type?: ProjectType;
    status?: ProjectStatus;
    district?: string;
    state?: string;
    is_delayed?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<ProjectDetails[]> {
    let whereClause = '1=1';
    const params: any[] = [];
    let paramIndex = 1;

    if (filters?.project_type) {
      whereClause += ` AND project_type = $${paramIndex++}`;
      params.push(filters.project_type);
    }
    if (filters?.status) {
      whereClause += ` AND status = $${paramIndex++}`;
      params.push(filters.status);
    }
    if (filters?.district) {
      whereClause += ` AND district = $${paramIndex++}`;
      params.push(filters.district);
    }
    if (filters?.state) {
      whereClause += ` AND state = $${paramIndex++}`;
      params.push(filters.state);
    }
    if (filters?.is_delayed !== undefined) {
      whereClause += ` AND is_delayed = $${paramIndex++}`;
      params.push(filters.is_delayed);
    }

    const limit = filters?.limit || 50;
    const offset = filters?.offset || 0;

    const result = await this.pool.query(
      `SELECT 
        project_id, project_name, project_code, project_type, description,
        latitude, longitude, address, district, state, pincode,
        total_budget, budget_currency, funding_sources,
        planned_start_date, planned_end_date,
        actual_start_date, actual_end_date, estimated_completion_date,
        progress_percentage, current_phase, milestones,
        is_delayed, delay_days, delay_reasons,
        contractor_name, contractor_contact,
        supervisor_name, supervisor_contact,
        implementing_agency,
        quality_inspections, quality_rating,
        documents, status,
        beneficiaries_count, community_feedback_count, average_community_rating,
        created_at, updated_at
       FROM infrastructure_projects
       WHERE ${whereClause}
       ORDER BY created_at DESC
       LIMIT $${paramIndex++} OFFSET $${paramIndex}`,
      [...params, limit, offset]
    );

    return result.rows.map(row => this.mapRowToProjectDetails(row));
  }

  // ==========================================================================
  // TASK 23.2: Budget Tracking with Funding Sources
  // ==========================================================================

  /**
   * Update project budget and funding sources
   */
  async updateBudget(
    projectId: string,
    totalBudget: number,
    fundingSources?: FundingSource[]
  ): Promise<void> {
    // Validate funding sources add up to total budget
    if (fundingSources && fundingSources.length > 0) {
      const totalFromSources = fundingSources.reduce((sum, source) => sum + source.amount, 0);
      if (Math.abs(totalFromSources - totalBudget) > 0.01) {
        throw new Error('Funding sources must add up to total budget');
      }

      // Calculate percentages
      fundingSources.forEach(source => {
        source.percentage = (source.amount / totalBudget) * 100;
      });
    }

    await this.pool.query(
      `UPDATE infrastructure_projects
       SET total_budget = $1,
           funding_sources = $2,
           updated_at = CURRENT_TIMESTAMP
       WHERE project_id = $3`,
      [totalBudget, fundingSources ? JSON.stringify(fundingSources) : null, projectId]
    );
  }

  /**
   * Get budget details including funding sources
   */
  async getBudgetDetails(projectId: string) {
    const result = await this.pool.query(
      `SELECT 
        total_budget,
        budget_currency,
        funding_sources
       FROM infrastructure_projects
       WHERE project_id = $1`,
      [projectId]
    );

    if (result.rows.length === 0) {
      throw new Error('Project not found');
    }

    const row = result.rows[0];
    return {
      total_budget: parseFloat(row.total_budget),
      budget_currency: row.budget_currency,
      funding_sources: row.funding_sources || [],
    };
  }

  /**
   * Calculate budget spent and remaining
   */
  async calculateBudgetStatus(projectId: string) {
    const budget = await this.getBudgetDetails(projectId);
    const project = await this.getProject(projectId);

    if (!project) {
      throw new Error('Project not found');
    }

    // Estimate spent based on progress percentage
    const amountSpent = (budget.total_budget * project.progress_percentage) / 100;
    const remainingBalance = budget.total_budget - amountSpent;

    return {
      total_budget: budget.total_budget,
      amount_spent: amountSpent,
      remaining_balance: remainingBalance,
      budget_currency: budget.budget_currency,
      funding_sources: budget.funding_sources,
      progress_percentage: project.progress_percentage,
    };
  }

  // ==========================================================================
  // TASK 23.3: Timeline Tracking with Milestone Management
  // ==========================================================================

  /**
   * Add milestone to project
   */
  async addMilestone(
    projectId: string,
    milestone: Omit<Milestone, 'milestone_id'>
  ): Promise<string> {
    const project = await this.getProject(projectId);
    if (!project) {
      throw new Error('Project not found');
    }

    const milestones = project.milestones || [];
    const newMilestone: Milestone = {
      ...milestone,
      milestone_id: `MS-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    };

    milestones.push(newMilestone);

    await this.pool.query(
      `UPDATE infrastructure_projects
       SET milestones = $1,
           updated_at = CURRENT_TIMESTAMP
       WHERE project_id = $2`,
      [JSON.stringify(milestones), projectId]
    );

    return newMilestone.milestone_id;
  }

  /**
   * Update milestone status
   */
  async updateMilestone(
    projectId: string,
    milestoneId: string,
    updates: Partial<Omit<Milestone, 'milestone_id'>>
  ): Promise<void> {
    const project = await this.getProject(projectId);
    if (!project) {
      throw new Error('Project not found');
    }

    const milestones = project.milestones || [];
    const milestoneIndex = milestones.findIndex(m => m.milestone_id === milestoneId);

    if (milestoneIndex === -1) {
      throw new Error('Milestone not found');
    }

    milestones[milestoneIndex] = {
      ...milestones[milestoneIndex],
      ...updates,
    };

    await this.pool.query(
      `UPDATE infrastructure_projects
       SET milestones = $1,
           updated_at = CURRENT_TIMESTAMP
       WHERE project_id = $2`,
      [JSON.stringify(milestones), projectId]
    );

    // Recalculate progress based on milestones
    await this.calculateProgress(projectId);
  }

  /**
   * Get all milestones for a project
   */
  async getMilestones(projectId: string): Promise<Milestone[]> {
    const project = await this.getProject(projectId);
    if (!project) {
      throw new Error('Project not found');
    }

    return project.milestones || [];
  }

  /**
   * Delete milestone
   */
  async deleteMilestone(projectId: string, milestoneId: string): Promise<void> {
    const project = await this.getProject(projectId);
    if (!project) {
      throw new Error('Project not found');
    }

    const milestones = (project.milestones || []).filter(m => m.milestone_id !== milestoneId);

    await this.pool.query(
      `UPDATE infrastructure_projects
       SET milestones = $1,
           updated_at = CURRENT_TIMESTAMP
       WHERE project_id = $2`,
      [JSON.stringify(milestones), projectId]
    );

    // Recalculate progress
    await this.calculateProgress(projectId);
  }

  // ==========================================================================
  // TASK 23.4: Progress Percentage Calculation
  // ==========================================================================

  /**
   * Calculate progress percentage based on completed milestones
   */
  async calculateProgress(projectId: string): Promise<number> {
    const milestones = await this.getMilestones(projectId);

    if (milestones.length === 0) {
      return 0;
    }

    // Calculate weighted progress
    const totalWeight = milestones.reduce((sum, m) => sum + m.weight, 0);
    
    if (totalWeight === 0) {
      // If no weights assigned, use equal weights
      const completedCount = milestones.filter(m => m.status === 'completed').length;
      const progress = (completedCount / milestones.length) * 100;
      
      await this.pool.query(
        `UPDATE infrastructure_projects
         SET progress_percentage = $1,
             updated_at = CURRENT_TIMESTAMP
         WHERE project_id = $2`,
        [progress, projectId]
      );
      
      return progress;
    }

    // Calculate weighted progress
    const completedWeight = milestones
      .filter(m => m.status === 'completed')
      .reduce((sum, m) => sum + m.weight, 0);

    const progress = (completedWeight / totalWeight) * 100;

    await this.pool.query(
      `UPDATE infrastructure_projects
       SET progress_percentage = $1,
           updated_at = CURRENT_TIMESTAMP
       WHERE project_id = $2`,
      [progress, projectId]
    );

    return progress;
  }

  /**
   * Manually set progress percentage
   */
  async setProgress(projectId: string, progressPercentage: number): Promise<void> {
    if (progressPercentage < 0 || progressPercentage > 100) {
      throw new Error('Progress percentage must be between 0 and 100');
    }

    await this.pool.query(
      `UPDATE infrastructure_projects
       SET progress_percentage = $1,
           updated_at = CURRENT_TIMESTAMP
       WHERE project_id = $2`,
      [progressPercentage, projectId]
    );
  }

  // ==========================================================================
  // TASK 23.5: Delay Detection and Tracking
  // ==========================================================================

  /**
   * Check and update delay status for a project
   */
  async checkDelayStatus(projectId: string): Promise<void> {
    const project = await this.getProject(projectId);
    if (!project) {
      throw new Error('Project not found');
    }

    // Don't check delay for completed or cancelled projects
    if (project.status === 'completed' || project.status === 'cancelled') {
      return;
    }

    const now = new Date();
    const expectedCompletion = project.estimated_completion_date || project.planned_end_date;
    
    const isDelayed = now > expectedCompletion;
    const delayDays = isDelayed 
      ? Math.floor((now.getTime() - expectedCompletion.getTime()) / (1000 * 60 * 60 * 24))
      : 0;

    await this.pool.query(
      `UPDATE infrastructure_projects
       SET is_delayed = $1,
           delay_days = $2,
           updated_at = CURRENT_TIMESTAMP
       WHERE project_id = $3`,
      [isDelayed, delayDays, projectId]
    );
  }

  /**
   * Add delay reason
   */
  async addDelayReason(projectId: string, reason: string): Promise<void> {
    const project = await this.getProject(projectId);
    if (!project) {
      throw new Error('Project not found');
    }

    const delayReasons = project.delay_reasons || [];
    delayReasons.push(reason);

    await this.pool.query(
      `UPDATE infrastructure_projects
       SET delay_reasons = $1,
           is_delayed = TRUE,
           updated_at = CURRENT_TIMESTAMP
       WHERE project_id = $2`,
      [delayReasons, projectId]
    );
  }

  /**
   * Update estimated completion date
   */
  async updateEstimatedCompletion(projectId: string, newDate: Date): Promise<void> {
    await this.pool.query(
      `UPDATE infrastructure_projects
       SET estimated_completion_date = $1,
           updated_at = CURRENT_TIMESTAMP
       WHERE project_id = $2`,
      [newDate, projectId]
    );

    // Recheck delay status
    await this.checkDelayStatus(projectId);
  }

  /**
   * Check all projects for delays (scheduled job)
   */
  async checkAllProjectsForDelays(): Promise<number> {
    const result = await this.pool.query(
      `SELECT project_id FROM infrastructure_projects
       WHERE status IN ('approved', 'in_progress')
         AND (estimated_completion_date < CURRENT_DATE OR planned_end_date < CURRENT_DATE)`
    );

    for (const row of result.rows) {
      await this.checkDelayStatus(row.project_id);
    }

    return result.rowCount || 0;
  }

  // ==========================================================================
  // TASK 23.6: Project Update System with Photos
  // ==========================================================================

  /**
   * Add project update
   */
  async addProjectUpdate(update: ProjectUpdate): Promise<string> {
    const result = await this.pool.query(
      `INSERT INTO project_updates (
        project_id, update_type, title, description,
        progress_percentage, photos, videos, documents,
        updated_by, updated_by_role, update_date
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING update_id`,
      [
        update.project_id,
        update.update_type,
        update.title,
        update.description,
        update.progress_percentage,
        update.photos,
        update.videos,
        update.documents,
        update.updated_by,
        update.updated_by_role,
        update.update_date,
      ]
    );

    // If progress update, update project progress
    if (update.update_type === 'progress' && update.progress_percentage !== undefined) {
      await this.setProgress(update.project_id, update.progress_percentage);
    }

    return result.rows[0].update_id;
  }

  /**
   * Get all updates for a project
   */
  async getProjectUpdates(projectId: string): Promise<ProjectUpdate[]> {
    const result = await this.pool.query(
      `SELECT 
        update_id, project_id, update_type, title, description,
        progress_percentage, photos, videos, documents,
        updated_by, updated_by_role, update_date, created_at
       FROM project_updates
       WHERE project_id = $1
       ORDER BY update_date DESC, created_at DESC`,
      [projectId]
    );

    return result.rows.map(row => ({
      update_id: row.update_id,
      project_id: row.project_id,
      update_type: row.update_type,
      title: row.title,
      description: row.description,
      progress_percentage: row.progress_percentage ? parseFloat(row.progress_percentage) : undefined,
      photos: row.photos,
      videos: row.videos,
      documents: row.documents,
      updated_by: row.updated_by,
      updated_by_role: row.updated_by_role,
      update_date: new Date(row.update_date),
    }));
  }

  /**
   * Get latest update for a project
   */
  async getLatestUpdate(projectId: string): Promise<ProjectUpdate | null> {
    const result = await this.pool.query(
      `SELECT 
        update_id, project_id, update_type, title, description,
        progress_percentage, photos, videos, documents,
        updated_by, updated_by_role, update_date
       FROM project_updates
       WHERE project_id = $1
       ORDER BY update_date DESC, created_at DESC
       LIMIT 1`,
      [projectId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];
    return {
      update_id: row.update_id,
      project_id: row.project_id,
      update_type: row.update_type,
      title: row.title,
      description: row.description,
      progress_percentage: row.progress_percentage ? parseFloat(row.progress_percentage) : undefined,
      photos: row.photos,
      videos: row.videos,
      documents: row.documents,
      updated_by: row.updated_by,
      updated_by_role: row.updated_by_role,
      update_date: new Date(row.update_date),
    };
  }

  // ==========================================================================
  // TASK 23.7: Contractor and Supervisor Information Display
  // ==========================================================================

  /**
   * Update contractor information
   */
  async updateContractor(
    projectId: string,
    contractorName: string,
    contractorContact: string
  ): Promise<void> {
    await this.pool.query(
      `UPDATE infrastructure_projects
       SET contractor_name = $1,
           contractor_contact = $2,
           updated_at = CURRENT_TIMESTAMP
       WHERE project_id = $3`,
      [contractorName, contractorContact, projectId]
    );
  }

  /**
   * Update supervisor information
   */
  async updateSupervisor(
    projectId: string,
    supervisorName: string,
    supervisorContact: string
  ): Promise<void> {
    await this.pool.query(
      `UPDATE infrastructure_projects
       SET supervisor_name = $1,
           supervisor_contact = $2,
           updated_at = CURRENT_TIMESTAMP
       WHERE project_id = $3`,
      [supervisorName, supervisorContact, projectId]
    );
  }

  /**
   * Get contractor and supervisor information
   */
  async getStakeholders(projectId: string) {
    const result = await this.pool.query(
      `SELECT 
        contractor_name,
        contractor_contact,
        supervisor_name,
        supervisor_contact,
        implementing_agency
       FROM infrastructure_projects
       WHERE project_id = $1`,
      [projectId]
    );

    if (result.rows.length === 0) {
      throw new Error('Project not found');
    }

    return result.rows[0];
  }

  // ==========================================================================
  // TASK 23.8: Quality Inspection Report System
  // ==========================================================================

  /**
   * Add quality inspection report
   */
  async addQualityInspection(
    projectId: string,
    inspection: Omit<QualityInspection, 'inspection_id'>
  ): Promise<string> {
    const project = await this.getProject(projectId);
    if (!project) {
      throw new Error('Project not found');
    }

    const inspections = project.quality_inspections || [];
    const newInspection: QualityInspection = {
      ...inspection,
      inspection_id: `QI-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    };

    inspections.push(newInspection);

    // Calculate average quality rating
    const avgRating = inspections.reduce((sum, i) => sum + i.quality_score, 0) / inspections.length;

    await this.pool.query(
      `UPDATE infrastructure_projects
       SET quality_inspections = $1,
           quality_rating = $2,
           updated_at = CURRENT_TIMESTAMP
       WHERE project_id = $3`,
      [JSON.stringify(inspections), avgRating, projectId]
    );

    return newInspection.inspection_id;
  }

  /**
   * Get all quality inspections for a project
   */
  async getQualityInspections(projectId: string): Promise<QualityInspection[]> {
    const project = await this.getProject(projectId);
    if (!project) {
      throw new Error('Project not found');
    }

    return project.quality_inspections || [];
  }

  /**
   * Get latest quality inspection
   */
  async getLatestQualityInspection(projectId: string): Promise<QualityInspection | null> {
    const inspections = await this.getQualityInspections(projectId);
    
    if (inspections.length === 0) {
      return null;
    }

    // Sort by date and return latest
    return inspections.sort((a, b) => 
      new Date(b.inspection_date).getTime() - new Date(a.inspection_date).getTime()
    )[0];
  }

  /**
   * Get quality rating for a project
   */
  async getQualityRating(projectId: string): Promise<number | null> {
    const result = await this.pool.query(
      'SELECT quality_rating FROM infrastructure_projects WHERE project_id = $1',
      [projectId]
    );

    if (result.rows.length === 0) {
      throw new Error('Project not found');
    }

    return result.rows[0].quality_rating ? parseFloat(result.rows[0].quality_rating) : null;
  }

  // ==========================================================================
  // TASK 23.9: Transparency Document Management
  // ==========================================================================

  /**
   * Add transparency document
   */
  async addDocument(
    projectId: string,
    document: Omit<TransparencyDocument, 'document_id' | 'uploaded_date'>
  ): Promise<string> {
    const project = await this.getProject(projectId);
    if (!project) {
      throw new Error('Project not found');
    }

    const documents = project.documents || [];
    const newDocument: TransparencyDocument = {
      ...document,
      document_id: `DOC-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      uploaded_date: new Date(),
    };

    documents.push(newDocument);

    await this.pool.query(
      `UPDATE infrastructure_projects
       SET documents = $1,
           updated_at = CURRENT_TIMESTAMP
       WHERE project_id = $2`,
      [JSON.stringify(documents), projectId]
    );

    return newDocument.document_id;
  }

  /**
   * Get all documents for a project
   */
  async getDocuments(projectId: string): Promise<TransparencyDocument[]> {
    const project = await this.getProject(projectId);
    if (!project) {
      throw new Error('Project not found');
    }

    return project.documents || [];
  }

  /**
   * Get documents by type
   */
  async getDocumentsByType(
    projectId: string,
    documentType: TransparencyDocument['document_type']
  ): Promise<TransparencyDocument[]> {
    const documents = await this.getDocuments(projectId);
    return documents.filter(doc => doc.document_type === documentType);
  }

  /**
   * Delete document
   */
  async deleteDocument(projectId: string, documentId: string): Promise<void> {
    const project = await this.getProject(projectId);
    if (!project) {
      throw new Error('Project not found');
    }

    const documents = (project.documents || []).filter(doc => doc.document_id !== documentId);

    await this.pool.query(
      `UPDATE infrastructure_projects
       SET documents = $1,
           updated_at = CURRENT_TIMESTAMP
       WHERE project_id = $2`,
      [JSON.stringify(documents), projectId]
    );
  }

  // ==========================================================================
  // HELPER METHODS
  // ==========================================================================

  /**
   * Map database row to ProjectDetails
   */
  private mapRowToProjectDetails(row: any): ProjectDetails {
    return {
      project_id: row.project_id,
      project_name: row.project_name,
      project_code: row.project_code,
      project_type: row.project_type,
      description: row.description,
      latitude: row.latitude ? parseFloat(row.latitude) : undefined,
      longitude: row.longitude ? parseFloat(row.longitude) : undefined,
      address: row.address,
      district: row.district,
      state: row.state,
      pincode: row.pincode,
      total_budget: parseFloat(row.total_budget),
      budget_currency: row.budget_currency,
      funding_sources: row.funding_sources || [],
      planned_start_date: new Date(row.planned_start_date),
      planned_end_date: new Date(row.planned_end_date),
      actual_start_date: row.actual_start_date ? new Date(row.actual_start_date) : undefined,
      actual_end_date: row.actual_end_date ? new Date(row.actual_end_date) : undefined,
      estimated_completion_date: row.estimated_completion_date ? new Date(row.estimated_completion_date) : undefined,
      progress_percentage: parseFloat(row.progress_percentage),
      current_phase: row.current_phase,
      milestones: row.milestones || [],
      is_delayed: row.is_delayed,
      delay_days: row.delay_days,
      delay_reasons: row.delay_reasons,
      contractor_name: row.contractor_name,
      contractor_contact: row.contractor_contact,
      supervisor_name: row.supervisor_name,
      supervisor_contact: row.supervisor_contact,
      implementing_agency: row.implementing_agency,
      quality_inspections: row.quality_inspections || [],
      quality_rating: row.quality_rating ? parseFloat(row.quality_rating) : undefined,
      documents: row.documents || [],
      status: row.status,
      beneficiaries_count: row.beneficiaries_count,
      community_feedback_count: row.community_feedback_count,
      average_community_rating: row.average_community_rating ? parseFloat(row.average_community_rating) : undefined,
      created_at: new Date(row.created_at),
      updated_at: new Date(row.updated_at),
    };
  }
}

export default ProjectProgressService;
