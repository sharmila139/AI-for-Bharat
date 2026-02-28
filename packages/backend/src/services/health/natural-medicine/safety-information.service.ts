/**
 * Safety Information Service
 * Manages side effects, contraindications, drug interactions, and safety flags
 */

import { Pool } from 'pg';
import { SafetyInformation } from '../../../types/natural-medicine';

export class SafetyInformationService {
  constructor(private pool: Pool) {}

  async getSafetyInfo(remedyId: string): Promise<SafetyInformation | null> {
    const query = `SELECT * FROM safety_information WHERE remedy_id = $1`;
    const result = await this.pool.query(query, [remedyId]);
    return result.rows[0] || null;
  }

  async checkSafetyFlags(remedyId: string, userProfile: {
    is_pregnant?: boolean;
    is_lactating?: boolean;
    is_child?: boolean;
    is_elderly?: boolean;
  }): Promise<{ is_safe: boolean; warnings: string[] }> {
    const safetyInfo = await this.getSafetyInfo(remedyId);
    
    if (!safetyInfo) {
      return { is_safe: false, warnings: ['No safety information available'] };
    }
    
    const warnings: string[] = [];
    let is_safe = true;
    
    if (userProfile.is_pregnant && !safetyInfo.safe_for_pregnancy) {
      is_safe = false;
      warnings.push('Not safe during pregnancy');
    }
    
    if (userProfile.is_lactating && !safetyInfo.safe_for_lactating) {
      is_safe = false;
      warnings.push('Not safe while breastfeeding');
    }
    
    if (userProfile.is_child && !safetyInfo.safe_for_children) {
      is_safe = false;
      warnings.push('Not safe for children');
    }
    
    if (safetyInfo.warnings) {
      warnings.push(...safetyInfo.warnings);
    }
    
    return { is_safe, warnings };
  }

  async addSafetyInfo(remedyId: string, safetyData: Omit<SafetyInformation, 'safety_id' | 'remedy_id' | 'created_at' | 'updated_at'>): Promise<SafetyInformation> {
    const query = `
      INSERT INTO safety_information (
        remedy_id, side_effects, contraindications, drug_interactions,
        allergy_warnings, safe_for_pregnancy, safe_for_children,
        safe_for_elderly, safe_for_lactating, warnings, precautions
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `;
    
    const result = await this.pool.query(query, [
      remedyId,
      JSON.stringify(safetyData.side_effects || []),
      JSON.stringify(safetyData.contraindications || []),
      JSON.stringify(safetyData.drug_interactions || []),
      JSON.stringify(safetyData.allergy_warnings || []),
      safetyData.safe_for_pregnancy,
      safetyData.safe_for_children,
      safetyData.safe_for_elderly,
      safetyData.safe_for_lactating,
      safetyData.warnings || [],
      safetyData.precautions || []
    ]);
    
    return result.rows[0];
  }
}

export function createSafetyInformationService(pool: Pool): SafetyInformationService {
  return new SafetyInformationService(pool);
}
