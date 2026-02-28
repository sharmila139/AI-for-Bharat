/**
 * Dosage Calculator Service
 * 
 * Calculates age-specific dosages based on:
 * - Age and weight
 * - Age group (infant, child, adult, elderly, pregnant, lactating)
 * - Special cases and safety checks
 */

import { Pool } from 'pg';
import { DosageGuideline, AgeGroup } from '../../../types/natural-medicine';

export interface DosageCalculationInput {
  remedy_id: string;
  age?: number; // Age in years
  weight?: number; // Weight in kg
  is_pregnant?: boolean;
  is_lactating?: boolean;
}

export interface DosageCalculationResult {
  dosage_guideline: DosageGuideline;
  age_group: AgeGroup;
  dosage_amount: string;
  frequency: string;
  duration?: string;
  best_time?: string;
  special_instructions?: string;
  warnings: string[];
  is_safe: boolean;
}

export class DosageCalculatorService {
  constructor(private pool: Pool) {}

  /**
   * Calculate appropriate dosage based on user profile
   */
  async calculateDosage(input: DosageCalculationInput): Promise<DosageCalculationResult> {
    // Determine age group
    const ageGroup = this.determineAgeGroup(input);
    
    // Get dosage guideline for the age group
    const dosageGuideline = await this.getDosageGuideline(input.remedy_id, ageGroup);
    
    if (!dosageGuideline) {
      throw new Error(`No dosage guideline found for age group: ${ageGroup}`);
    }
    
    // Check safety
    const safetyCheck = await this.checkSafety(input.remedy_id, input);
    
    // Adjust dosage based on weight if applicable
    const adjustedDosage = this.adjustDosageForWeight(
      dosageGuideline.dosage_amount,
      input.weight,
      ageGroup
    );
    
    return {
      dosage_guideline,
      age_group: ageGroup,
      dosage_amount: adjustedDosage,
      frequency: dosageGuideline.frequency,
      duration: dosageGuideline.duration,
      best_time: dosageGuideline.best_time,
      special_instructions: dosageGuideline.special_instructions,
      warnings: safetyCheck.warnings,
      is_safe: safetyCheck.is_safe
    };
  }

  /**
   * Determine age group from user profile
   */
  private determineAgeGroup(input: DosageCalculationInput): AgeGroup {
    if (input.is_pregnant) {
      return 'pregnant';
    }
    
    if (input.is_lactating) {
      return 'lactating';
    }
    
    if (!input.age) {
      return 'adult'; // Default to adult if age not provided
    }
    
    if (input.age < 2) {
      return 'infant';
    } else if (input.age >= 2 && input.age <= 12) {
      return 'child';
    } else if (input.age >= 13 && input.age <= 64) {
      return 'adult';
    } else {
      return 'elderly';
    }
  }

  /**
   * Get dosage guideline for specific age group
   */
  private async getDosageGuideline(
    remedyId: string,
    ageGroup: AgeGroup
  ): Promise<DosageGuideline | null> {
    const query = `
      SELECT *
      FROM dosage_guidelines
      WHERE remedy_id = $1 AND age_group = $2
      LIMIT 1
    `;
    
    const result = await this.pool.query(query, [remedyId, ageGroup]);
    
    if (result.rows.length === 0) {
      // Try to find a general adult guideline as fallback
      if (ageGroup !== 'adult') {
        return this.getDosageGuideline(remedyId, 'adult');
      }
      return null;
    }
    
    return result.rows[0];
  }

  /**
   * Get all dosage guidelines for a remedy
   */
  async getAllDosageGuidelines(remedyId: string): Promise<DosageGuideline[]> {
    const query = `
      SELECT *
      FROM dosage_guidelines
      WHERE remedy_id = $1
      ORDER BY 
        CASE age_group
          WHEN 'infant' THEN 1
          WHEN 'child' THEN 2
          WHEN 'adult' THEN 3
          WHEN 'elderly' THEN 4
          WHEN 'pregnant' THEN 5
          WHEN 'lactating' THEN 6
        END
    `;
    
    const result = await this.pool.query(query, [remedyId]);
    return result.rows;
  }

  /**
   * Check safety for specific user profile
   */
  private async checkSafety(
    remedyId: string,
    input: DosageCalculationInput
  ): Promise<{ is_safe: boolean; warnings: string[] }> {
    const query = `
      SELECT *
      FROM safety_information
      WHERE remedy_id = $1
    `;
    
    const result = await this.pool.query(query, [remedyId]);
    
    if (result.rows.length === 0) {
      return {
        is_safe: false,
        warnings: ['No safety information available for this remedy']
      };
    }
    
    const safetyInfo = result.rows[0];
    const warnings: string[] = [];
    let is_safe = true;
    
    // Check pregnancy safety
    if (input.is_pregnant && !safetyInfo.safe_for_pregnancy) {
      is_safe = false;
      warnings.push('This remedy is not safe during pregnancy');
    }
    
    // Check lactation safety
    if (input.is_lactating && !safetyInfo.safe_for_lactating) {
      is_safe = false;
      warnings.push('This remedy is not safe while breastfeeding');
    }
    
    // Check children safety
    if (input.age && input.age < 13 && !safetyInfo.safe_for_children) {
      is_safe = false;
      warnings.push('This remedy is not safe for children');
    }
    
    // Add general warnings
    if (safetyInfo.warnings && Array.isArray(safetyInfo.warnings)) {
      warnings.push(...safetyInfo.warnings);
    }
    
    return { is_safe, warnings };
  }

  /**
   * Adjust dosage based on weight
   * Uses simple proportional adjustment for children
   */
  private adjustDosageForWeight(
    baseDosage: string,
    weight?: number,
    ageGroup?: AgeGroup
  ): string {
    // Only adjust for children if weight is provided
    if (!weight || ageGroup !== 'child') {
      return baseDosage;
    }
    
    // Extract numeric value from dosage string (e.g., "1 teaspoon" -> 1)
    const match = baseDosage.match(/^(\d+(?:\.\d+)?)/);
    if (!match) {
      return baseDosage;
    }
    
    const baseAmount = parseFloat(match[1]);
    
    // Simple weight-based adjustment for children
    // Assuming average child weight of 25kg
    const averageChildWeight = 25;
    const adjustmentFactor = weight / averageChildWeight;
    
    // Limit adjustment to 0.5x - 1.5x range for safety
    const limitedFactor = Math.max(0.5, Math.min(1.5, adjustmentFactor));
    
    const adjustedAmount = (baseAmount * limitedFactor).toFixed(1);
    
    // Replace the numeric part in the original dosage string
    return baseDosage.replace(/^(\d+(?:\.\d+)?)/, adjustedAmount);
  }

  /**
   * Add a new dosage guideline
   */
  async addDosageGuideline(
    remedyId: string,
    guideline: {
      age_group: AgeGroup;
      age_range_min?: number;
      age_range_max?: number;
      dosage_amount: string;
      frequency: string;
      duration?: string;
      special_instructions?: string;
      special_instructions_multilang?: Record<string, string>;
      best_time?: string;
    }
  ): Promise<DosageGuideline> {
    const query = `
      INSERT INTO dosage_guidelines (
        remedy_id, age_group, age_range_min, age_range_max,
        dosage_amount, frequency, duration,
        special_instructions, special_instructions_multilang, best_time
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `;
    
    const result = await this.pool.query(query, [
      remedyId,
      guideline.age_group,
      guideline.age_range_min || null,
      guideline.age_range_max || null,
      guideline.dosage_amount,
      guideline.frequency,
      guideline.duration || null,
      guideline.special_instructions || null,
      guideline.special_instructions_multilang ? JSON.stringify(guideline.special_instructions_multilang) : null,
      guideline.best_time || null
    ]);
    
    return result.rows[0];
  }

  /**
   * Update dosage guideline
   */
  async updateDosageGuideline(
    dosageId: string,
    updates: Partial<{
      dosage_amount: string;
      frequency: string;
      duration: string;
      special_instructions: string;
      best_time: string;
    }>
  ): Promise<DosageGuideline> {
    const setClauses: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;
    
    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined) {
        setClauses.push(`${key} = $${paramIndex++}`);
        values.push(value);
      }
    });
    
    if (setClauses.length === 0) {
      throw new Error('No updates provided');
    }
    
    values.push(dosageId);
    
    const query = `
      UPDATE dosage_guidelines
      SET ${setClauses.join(', ')}
      WHERE dosage_id = $${paramIndex}
      RETURNING *
    `;
    
    const result = await this.pool.query(query, values);
    
    if (result.rows.length === 0) {
      throw new Error('Dosage guideline not found');
    }
    
    return result.rows[0];
  }

  /**
   * Validate dosage guidelines completeness for a remedy
   */
  async validateDosageGuidelines(remedyId: string): Promise<{
    is_valid: boolean;
    errors: string[];
    missing_age_groups: AgeGroup[];
  }> {
    const guidelines = await this.getAllDosageGuidelines(remedyId);
    const errors: string[] = [];
    
    if (guidelines.length === 0) {
      errors.push('No dosage guidelines found');
      return {
        is_valid: false,
        errors,
        missing_age_groups: ['infant', 'child', 'adult', 'elderly', 'pregnant', 'lactating']
      };
    }
    
    // Check for essential age groups
    const essentialGroups: AgeGroup[] = ['child', 'adult'];
    const existingGroups = guidelines.map(g => g.age_group);
    const missingGroups = essentialGroups.filter(g => !existingGroups.includes(g));
    
    if (missingGroups.length > 0) {
      errors.push(`Missing dosage guidelines for: ${missingGroups.join(', ')}`);
    }
    
    return {
      is_valid: errors.length === 0,
      errors,
      missing_age_groups: missingGroups
    };
  }
}

/**
 * Create dosage calculator service instance
 */
export function createDosageCalculatorService(pool: Pool): DosageCalculatorService {
  return new DosageCalculatorService(pool);
}
