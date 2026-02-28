/**
 * Seasonal Ingredient Availability Service
 * Tracks ingredient availability by month and suggests substitutes
 */

import { Pool } from 'pg';

export class SeasonalAvailabilityService {
  constructor(private pool: Pool) {}

  async checkIngredientAvailability(remedyId: string, month?: number): Promise<{
    all_available: boolean;
    unavailable_ingredients: Array<{ name: any; substitutes: any[] }>;
  }> {
    const currentMonth = month || new Date().getMonth() + 1;
    
    const query = `
      SELECT ingredient_name, seasonal_availability, substitutes
      FROM remedy_ingredients
      WHERE remedy_id = $1
    `;
    
    const result = await this.pool.query(query, [remedyId]);
    const unavailable: any[] = [];
    
    for (const ingredient of result.rows) {
      if (ingredient.seasonal_availability && 
          !ingredient.seasonal_availability.includes(currentMonth)) {
        unavailable.push({
          name: ingredient.ingredient_name,
          substitutes: ingredient.substitutes || []
        });
      }
    }
    
    return {
      all_available: unavailable.length === 0,
      unavailable_ingredients: unavailable
    };
  }

  async getSeasonalRemedies(month?: number): Promise<string[]> {
    const currentMonth = month || new Date().getMonth() + 1;
    
    const query = `
      SELECT DISTINCT r.remedy_id
      FROM remedies r
      INNER JOIN remedy_ingredients ri ON r.remedy_id = ri.remedy_id
      WHERE r.status = 'published'
      AND r.verification_status = 'verified'
      AND $1 = ANY(ri.seasonal_availability)
    `;
    
    const result = await this.pool.query(query, [currentMonth]);
    return result.rows.map(row => row.remedy_id);
  }
}

export function createSeasonalAvailabilityService(pool: Pool): SeasonalAvailabilityService {
  return new SeasonalAvailabilityService(pool);
}
