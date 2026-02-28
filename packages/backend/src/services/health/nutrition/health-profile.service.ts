/**
 * Health Profile Management Service
 * Handles CRUD operations for user health profiles
 * Task 17.1: Create user health profile management
 */

import { Pool } from 'pg';
import {
  HealthProfile,
  CreateHealthProfileInput,
  UpdateHealthProfileInput
} from '../../../types/nutrition';

export class HealthProfileService {
  constructor(private db: Pool) {}

  /**
   * Create a new health profile for a user
   * Validates input and calculates BMI automatically
   */
  async createHealthProfile(input: CreateHealthProfileInput): Promise<HealthProfile> {
    const {
      userId,
      bloodGroup,
      heightCm,
      weightKg,
      activityLevel,
      occupationType,
      chronicConditions = [],
      allergies = [],
      currentMedications = [],
      dietaryRestrictions = [],
      foodAllergies = [],
      emergencyContacts = []
    } = input;

    // Validate required fields
    if (!userId) {
      throw new Error('User ID is required');
    }

    // Validate height and weight if provided
    if (heightCm !== undefined && (heightCm <= 0 || heightCm > 300)) {
      throw new Error('Height must be between 0 and 300 cm');
    }

    if (weightKg !== undefined && (weightKg <= 0 || weightKg > 500)) {
      throw new Error('Weight must be between 0 and 500 kg');
    }

    // Validate dietary restrictions
    const validRestrictions = ['vegetarian', 'vegan', 'gluten_free', 'lactose_intolerant', 'diabetic', 'none'];
    for (const restriction of dietaryRestrictions) {
      if (!validRestrictions.includes(restriction)) {
        throw new Error(`Invalid dietary restriction: ${restriction}`);
      }
    }

    const query = `
      INSERT INTO health_profiles (
        user_id,
        blood_group,
        height_cm,
        weight_kg,
        activity_level,
        occupation_type,
        chronic_conditions,
        allergies,
        current_medications,
        dietary_restrictions,
        food_allergies,
        emergency_contacts
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING 
        health_profile_id as "healthProfileId",
        user_id as "userId",
        blood_group as "bloodGroup",
        height_cm as "heightCm",
        weight_kg as "weightKg",
        bmi,
        activity_level as "activityLevel",
        occupation_type as "occupationType",
        chronic_conditions as "chronicConditions",
        allergies,
        current_medications as "currentMedications",
        dietary_restrictions as "dietaryRestrictions",
        food_allergies as "foodAllergies",
        emergency_contacts as "emergencyContacts",
        created_at as "createdAt",
        updated_at as "updatedAt"
    `;

    const values = [
      userId,
      bloodGroup || null,
      heightCm || null,
      weightKg || null,
      activityLevel || null,
      occupationType || null,
      chronicConditions,
      allergies,
      currentMedications,
      dietaryRestrictions,
      foodAllergies,
      JSON.stringify(emergencyContacts)
    ];

    try {
      const result = await this.db.query(query, values);
      return result.rows[0];
    } catch (error: any) {
      if (error.code === '23505') { // Unique violation
        throw new Error('Health profile already exists for this user');
      }
      throw new Error(`Failed to create health profile: ${error.message}`);
    }
  }

  /**
   * Get health profile by user ID
   */
  async getHealthProfileByUserId(userId: string): Promise<HealthProfile | null> {
    const query = `
      SELECT 
        health_profile_id as "healthProfileId",
        user_id as "userId",
        blood_group as "bloodGroup",
        height_cm as "heightCm",
        weight_kg as "weightKg",
        bmi,
        activity_level as "activityLevel",
        occupation_type as "occupationType",
        chronic_conditions as "chronicConditions",
        allergies,
        current_medications as "currentMedications",
        dietary_restrictions as "dietaryRestrictions",
        food_allergies as "foodAllergies",
        emergency_contacts as "emergencyContacts",
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM health_profiles
      WHERE user_id = $1
    `;

    const result = await this.db.query(query, [userId]);
    return result.rows[0] || null;
  }

  /**
   * Get health profile by profile ID
   */
  async getHealthProfileById(profileId: string): Promise<HealthProfile | null> {
    const query = `
      SELECT 
        health_profile_id as "healthProfileId",
        user_id as "userId",
        blood_group as "bloodGroup",
        height_cm as "heightCm",
        weight_kg as "weightKg",
        bmi,
        activity_level as "activityLevel",
        occupation_type as "occupationType",
        chronic_conditions as "chronicConditions",
        allergies,
        current_medications as "currentMedications",
        dietary_restrictions as "dietaryRestrictions",
        food_allergies as "foodAllergies",
        emergency_contacts as "emergencyContacts",
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM health_profiles
      WHERE health_profile_id = $1
    `;

    const result = await this.db.query(query, [profileId]);
    return result.rows[0] || null;
  }

  /**
   * Update health profile
   * BMI is automatically recalculated if height or weight changes
   */
  async updateHealthProfile(
    userId: string,
    updates: UpdateHealthProfileInput
  ): Promise<HealthProfile> {
    // Validate height and weight if provided
    if (updates.heightCm !== undefined && (updates.heightCm <= 0 || updates.heightCm > 300)) {
      throw new Error('Height must be between 0 and 300 cm');
    }

    if (updates.weightKg !== undefined && (updates.weightKg <= 0 || updates.weightKg > 500)) {
      throw new Error('Weight must be between 0 and 500 kg');
    }

    // Validate dietary restrictions if provided
    if (updates.dietaryRestrictions) {
      const validRestrictions = ['vegetarian', 'vegan', 'gluten_free', 'lactose_intolerant', 'diabetic', 'none'];
      for (const restriction of updates.dietaryRestrictions) {
        if (!validRestrictions.includes(restriction)) {
          throw new Error(`Invalid dietary restriction: ${restriction}`);
        }
      }
    }

    const updateFields: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    // Build dynamic update query
    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined) {
        const dbKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
        
        if (key === 'emergencyContacts') {
          updateFields.push(`${dbKey} = $${paramCount}`);
          values.push(JSON.stringify(value));
        } else {
          updateFields.push(`${dbKey} = $${paramCount}`);
          values.push(value);
        }
        paramCount++;
      }
    });

    if (updateFields.length === 0) {
      throw new Error('No fields to update');
    }

    updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(userId);

    const query = `
      UPDATE health_profiles
      SET ${updateFields.join(', ')}
      WHERE user_id = $${paramCount}
      RETURNING 
        health_profile_id as "healthProfileId",
        user_id as "userId",
        blood_group as "bloodGroup",
        height_cm as "heightCm",
        weight_kg as "weightKg",
        bmi,
        activity_level as "activityLevel",
        occupation_type as "occupationType",
        chronic_conditions as "chronicConditions",
        allergies,
        current_medications as "currentMedications",
        dietary_restrictions as "dietaryRestrictions",
        food_allergies as "foodAllergies",
        emergency_contacts as "emergencyContacts",
        created_at as "createdAt",
        updated_at as "updatedAt"
    `;

    const result = await this.db.query(query, values);
    
    if (result.rows.length === 0) {
      throw new Error('Health profile not found');
    }

    return result.rows[0];
  }

  /**
   * Delete health profile
   */
  async deleteHealthProfile(userId: string): Promise<void> {
    const query = 'DELETE FROM health_profiles WHERE user_id = $1';
    const result = await this.db.query(query, [userId]);

    if (result.rowCount === 0) {
      throw new Error('Health profile not found');
    }
  }

  /**
   * Calculate BMI from height and weight
   */
  calculateBMI(heightCm: number, weightKg: number): number {
    if (heightCm <= 0 || weightKg <= 0) {
      throw new Error('Height and weight must be positive numbers');
    }

    const heightM = heightCm / 100;
    const bmi = weightKg / (heightM * heightM);
    return Math.round(bmi * 100) / 100; // Round to 2 decimal places
  }

  /**
   * Get BMI category
   */
  getBMICategory(bmi: number): string {
    if (bmi < 18.5) return 'Underweight';
    if (bmi < 25) return 'Normal weight';
    if (bmi < 30) return 'Overweight';
    return 'Obese';
  }

  /**
   * Validate health profile data
   */
  validateHealthProfile(profile: Partial<CreateHealthProfileInput>): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (profile.heightCm !== undefined) {
      if (profile.heightCm <= 0 || profile.heightCm > 300) {
        errors.push('Height must be between 0 and 300 cm');
      }
    }

    if (profile.weightKg !== undefined) {
      if (profile.weightKg <= 0 || profile.weightKg > 500) {
        errors.push('Weight must be between 0 and 500 kg');
      }
    }

    if (profile.dietaryRestrictions) {
      const validRestrictions = ['vegetarian', 'vegan', 'gluten_free', 'lactose_intolerant', 'diabetic', 'none'];
      for (const restriction of profile.dietaryRestrictions) {
        if (!validRestrictions.includes(restriction)) {
          errors.push(`Invalid dietary restriction: ${restriction}`);
        }
      }
    }

    if (profile.emergencyContacts) {
      for (const contact of profile.emergencyContacts) {
        if (!contact.name || !contact.phone) {
          errors.push('Emergency contact must have name and phone');
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}
