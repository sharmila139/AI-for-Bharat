/**
 * Preparation Method Documentation Service
 * 
 * Manages step-by-step preparation instructions with:
 * - Multi-language support
 * - Media URL management (images, videos, audio)
 * - Step ordering and validation
 */

import { Pool } from 'pg';
import { PreparationMethod } from '../../../types/natural-medicine';

export class PreparationMethodService {
  constructor(private pool: Pool) {}

  /**
   * Get all preparation steps for a remedy
   */
  async getPreparationSteps(remedyId: string): Promise<PreparationMethod[]> {
    const query = `
      SELECT *
      FROM preparation_methods
      WHERE remedy_id = $1
      ORDER BY step_number ASC
    `;
    
    const result = await this.pool.query(query, [remedyId]);
    return result.rows;
  }

  /**
   * Get preparation steps in a specific language
   */
  async getPreparationStepsInLanguage(
    remedyId: string,
    language: string = 'en'
  ): Promise<Array<Omit<PreparationMethod, 'description_multilang'> & { description: string }>> {
    const steps = await this.getPreparationSteps(remedyId);
    
    return steps.map(step => ({
      ...step,
      description: step.description_multilang?.[language] || step.description
    }));
  }

  /**
   * Add a new preparation step
   */
  async addPreparationStep(
    remedyId: string,
    stepData: {
      step_number: number;
      description: string;
      description_multilang?: Record<string, string>;
      duration_minutes?: number;
      temperature?: string;
      image_url?: string;
      video_url?: string;
      audio_url?: string;
    }
  ): Promise<PreparationMethod> {
    const query = `
      INSERT INTO preparation_methods (
        remedy_id, step_number, description, description_multilang,
        duration_minutes, temperature, image_url, video_url, audio_url
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;
    
    const result = await this.pool.query(query, [
      remedyId,
      stepData.step_number,
      stepData.description,
      stepData.description_multilang ? JSON.stringify(stepData.description_multilang) : null,
      stepData.duration_minutes || null,
      stepData.temperature || null,
      stepData.image_url || null,
      stepData.video_url || null,
      stepData.audio_url || null
    ]);
    
    return result.rows[0];
  }

  /**
   * Update a preparation step
   */
  async updatePreparationStep(
    stepId: string,
    updates: Partial<{
      description: string;
      description_multilang: Record<string, string>;
      duration_minutes: number;
      temperature: string;
      image_url: string;
      video_url: string;
      audio_url: string;
    }>
  ): Promise<PreparationMethod> {
    const setClauses: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;
    
    if (updates.description !== undefined) {
      setClauses.push(`description = $${paramIndex++}`);
      values.push(updates.description);
    }
    
    if (updates.description_multilang !== undefined) {
      setClauses.push(`description_multilang = $${paramIndex++}`);
      values.push(JSON.stringify(updates.description_multilang));
    }
    
    if (updates.duration_minutes !== undefined) {
      setClauses.push(`duration_minutes = $${paramIndex++}`);
      values.push(updates.duration_minutes);
    }
    
    if (updates.temperature !== undefined) {
      setClauses.push(`temperature = $${paramIndex++}`);
      values.push(updates.temperature);
    }
    
    if (updates.image_url !== undefined) {
      setClauses.push(`image_url = $${paramIndex++}`);
      values.push(updates.image_url);
    }
    
    if (updates.video_url !== undefined) {
      setClauses.push(`video_url = $${paramIndex++}`);
      values.push(updates.video_url);
    }
    
    if (updates.audio_url !== undefined) {
      setClauses.push(`audio_url = $${paramIndex++}`);
      values.push(updates.audio_url);
    }
    
    if (setClauses.length === 0) {
      throw new Error('No updates provided');
    }
    
    values.push(stepId);
    
    const query = `
      UPDATE preparation_methods
      SET ${setClauses.join(', ')}
      WHERE step_id = $${paramIndex}
      RETURNING *
    `;
    
    const result = await this.pool.query(query, values);
    
    if (result.rows.length === 0) {
      throw new Error('Preparation step not found');
    }
    
    return result.rows[0];
  }

  /**
   * Delete a preparation step
   */
  async deletePreparationStep(stepId: string): Promise<void> {
    const query = `DELETE FROM preparation_methods WHERE step_id = $1`;
    await this.pool.query(query, [stepId]);
  }

  /**
   * Reorder preparation steps
   */
  async reorderSteps(
    remedyId: string,
    stepOrder: Array<{ step_id: string; new_step_number: number }>
  ): Promise<void> {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');
      
      for (const { step_id, new_step_number } of stepOrder) {
        await client.query(
          `UPDATE preparation_methods 
           SET step_number = $1 
           WHERE step_id = $2 AND remedy_id = $3`,
          [new_step_number, step_id, remedyId]
        );
      }
      
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Add media to a preparation step
   */
  async addMediaToStep(
    stepId: string,
    mediaType: 'image' | 'video' | 'audio',
    mediaUrl: string
  ): Promise<PreparationMethod> {
    const columnMap = {
      image: 'image_url',
      video: 'video_url',
      audio: 'audio_url'
    };
    
    const column = columnMap[mediaType];
    
    const query = `
      UPDATE preparation_methods
      SET ${column} = $1
      WHERE step_id = $2
      RETURNING *
    `;
    
    const result = await this.pool.query(query, [mediaUrl, stepId]);
    
    if (result.rows.length === 0) {
      throw new Error('Preparation step not found');
    }
    
    return result.rows[0];
  }

  /**
   * Get total preparation time for a remedy
   */
  async getTotalPreparationTime(remedyId: string): Promise<number> {
    const query = `
      SELECT COALESCE(SUM(duration_minutes), 0) as total_time
      FROM preparation_methods
      WHERE remedy_id = $1
    `;
    
    const result = await this.pool.query(query, [remedyId]);
    return parseInt(result.rows[0].total_time);
  }

  /**
   * Validate preparation steps completeness
   */
  async validatePreparationSteps(remedyId: string): Promise<{
    is_valid: boolean;
    errors: string[];
  }> {
    const steps = await this.getPreparationSteps(remedyId);
    const errors: string[] = [];
    
    if (steps.length === 0) {
      errors.push('No preparation steps found');
      return { is_valid: false, errors };
    }
    
    // Check for sequential step numbers
    const stepNumbers = steps.map(s => s.step_number).sort((a, b) => a - b);
    for (let i = 0; i < stepNumbers.length; i++) {
      if (stepNumbers[i] !== i + 1) {
        errors.push(`Missing step number ${i + 1}`);
      }
    }
    
    // Check for empty descriptions
    const emptySteps = steps.filter(s => !s.description || s.description.trim() === '');
    if (emptySteps.length > 0) {
      errors.push(`${emptySteps.length} step(s) have empty descriptions`);
    }
    
    return {
      is_valid: errors.length === 0,
      errors
    };
  }
}

/**
 * Create preparation method service instance
 */
export function createPreparationMethodService(pool: Pool): PreparationMethodService {
  return new PreparationMethodService(pool);
}
