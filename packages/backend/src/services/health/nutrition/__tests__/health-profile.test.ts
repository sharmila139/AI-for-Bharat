/**
 * Unit tests for Health Profile Service
 */

import { Pool } from 'pg';
import { HealthProfileService } from '../health-profile.service';
import { CreateHealthProfileInput } from '../../../../types/nutrition';

// Mock pg Pool
const mockQuery = jest.fn();
jest.mock('pg', () => {
  return { 
    Pool: jest.fn().mockImplementation(() => ({
      query: mockQuery,
      connect: jest.fn(),
      end: jest.fn(),
    }))
  };
});

describe('HealthProfileService', () => {
  let service: HealthProfileService;
  let mockPool: jest.Mocked<Pool>;

  beforeEach(() => {
    mockPool = new Pool() as jest.Mocked<Pool>;
    service = new HealthProfileService(mockPool);
    jest.clearAllMocks();
    mockQuery.mockClear();
  });

  describe('createHealthProfile', () => {
    it('should create a health profile successfully', async () => {
      const input: CreateHealthProfileInput = {
        userId: 'user-123',
        heightCm: 170,
        weightKg: 70,
        activityLevel: 'moderate',
        occupationType: 'moderate_physical',
        dietaryRestrictions: ['vegetarian']
      };

      const mockResult = {
        rows: [{
          healthProfileId: 'profile-123',
          userId: 'user-123',
          heightCm: 170,
          weightKg: 70,
          bmi: 24.22,
          activityLevel: 'moderate',
          occupationType: 'moderate_physical',
          dietaryRestrictions: ['vegetarian'],
          createdAt: new Date(),
          updatedAt: new Date()
        }]
      };

      mockQuery.mockResolvedValue(mockResult as any);

      const result = await service.createHealthProfile(input);

      expect(result).toEqual(mockResult.rows[0]);
      expect(mockQuery).toHaveBeenCalledTimes(1);
    });

    it('should throw error if userId is missing', async () => {
      const input: any = {
        heightCm: 170,
        weightKg: 70
      };

      await expect(service.createHealthProfile(input)).rejects.toThrow('User ID is required');
    });

    it('should throw error for invalid height', async () => {
      const input: CreateHealthProfileInput = {
        userId: 'user-123',
        heightCm: 400,
        weightKg: 70
      };

      await expect(service.createHealthProfile(input)).rejects.toThrow('Height must be between 0 and 300 cm');
    });

    it('should throw error for invalid weight', async () => {
      const input: CreateHealthProfileInput = {
        userId: 'user-123',
        heightCm: 170,
        weightKg: 600
      };

      await expect(service.createHealthProfile(input)).rejects.toThrow('Weight must be between 0 and 500 kg');
    });

    it('should throw error for invalid dietary restriction', async () => {
      const input: CreateHealthProfileInput = {
        userId: 'user-123',
        dietaryRestrictions: ['invalid_restriction' as any]
      };

      await expect(service.createHealthProfile(input)).rejects.toThrow('Invalid dietary restriction');
    });

    it('should handle duplicate profile error', async () => {
      const input: CreateHealthProfileInput = {
        userId: 'user-123',
        heightCm: 170,
        weightKg: 70
      };

      mockQuery.mockRejectedValue({ code: '23505', message: 'duplicate key' });

      await expect(service.createHealthProfile(input)).rejects.toThrow('Health profile already exists for this user');
    });
  });

  describe('getHealthProfileByUserId', () => {
    it('should return health profile if found', async () => {
      const mockProfile = {
        healthProfileId: 'profile-123',
        userId: 'user-123',
        heightCm: 170,
        weightKg: 70,
        bmi: 24.22
      };

      mockQuery.mockResolvedValue({ rows: [mockProfile] } as any);

      const result = await service.getHealthProfileByUserId('user-123');

      expect(result).toEqual(mockProfile);
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('SELECT'),
        ['user-123']
      );
    });

    it('should return null if profile not found', async () => {
      mockQuery.mockResolvedValue({ rows: [] } as any);

      const result = await service.getHealthProfileByUserId('user-123');

      expect(result).toBeNull();
    });
  });

  describe('updateHealthProfile', () => {
    it('should update health profile successfully', async () => {
      const updates = {
        heightCm: 175,
        weightKg: 75,
        activityLevel: 'active' as const
      };

      const mockResult = {
        rows: [{
          healthProfileId: 'profile-123',
          userId: 'user-123',
          heightCm: 175,
          weightKg: 75,
          bmi: 24.49,
          activityLevel: 'active',
          updatedAt: new Date()
        }]
      };

      mockQuery.mockResolvedValue(mockResult as any);

      const result = await service.updateHealthProfile('user-123', updates);

      expect(result).toEqual(mockResult.rows[0]);
      expect(mockQuery).toHaveBeenCalledTimes(1);
    });

    it('should throw error if no fields to update', async () => {
      await expect(service.updateHealthProfile('user-123', {})).rejects.toThrow('No fields to update');
    });

    it('should throw error if profile not found', async () => {
      const updates = { heightCm: 175 };
      mockQuery.mockResolvedValue({ rows: [] } as any);

      await expect(service.updateHealthProfile('user-123', updates)).rejects.toThrow('Health profile not found');
    });

    it('should throw error for invalid height in update', async () => {
      const updates = { heightCm: 400 };

      await expect(service.updateHealthProfile('user-123', updates)).rejects.toThrow('Height must be between 0 and 300 cm');
    });
  });

  describe('deleteHealthProfile', () => {
    it('should delete health profile successfully', async () => {
      mockQuery.mockResolvedValue({ rowCount: 1 } as any);

      await service.deleteHealthProfile('user-123');

      expect(mockQuery).toHaveBeenCalledWith(
        'DELETE FROM health_profiles WHERE user_id = $1',
        ['user-123']
      );
    });

    it('should throw error if profile not found', async () => {
      mockQuery.mockResolvedValue({ rowCount: 0 } as any);

      await expect(service.deleteHealthProfile('user-123')).rejects.toThrow('Health profile not found');
    });
  });

  describe('calculateBMI', () => {
    it('should calculate BMI correctly', () => {
      const bmi = service.calculateBMI(170, 70);
      expect(bmi).toBe(24.22);
    });

    it('should throw error for invalid height', () => {
      expect(() => service.calculateBMI(0, 70)).toThrow('Height and weight must be positive numbers');
    });

    it('should throw error for invalid weight', () => {
      expect(() => service.calculateBMI(170, 0)).toThrow('Height and weight must be positive numbers');
    });

    it('should round BMI to 2 decimal places', () => {
      const bmi = service.calculateBMI(165, 68);
      expect(bmi.toString()).toMatch(/^\d+\.\d{2}$/);
    });
  });

  describe('getBMICategory', () => {
    it('should return Underweight for BMI < 18.5', () => {
      expect(service.getBMICategory(18)).toBe('Underweight');
    });

    it('should return Normal weight for BMI 18.5-24.9', () => {
      expect(service.getBMICategory(22)).toBe('Normal weight');
    });

    it('should return Overweight for BMI 25-29.9', () => {
      expect(service.getBMICategory(27)).toBe('Overweight');
    });

    it('should return Obese for BMI >= 30', () => {
      expect(service.getBMICategory(32)).toBe('Obese');
    });
  });

  describe('validateHealthProfile', () => {
    it('should validate correct profile', () => {
      const profile: Partial<CreateHealthProfileInput> = {
        userId: 'user-123',
        heightCm: 170,
        weightKg: 70,
        dietaryRestrictions: ['vegetarian']
      };

      const result = service.validateHealthProfile(profile);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect invalid height', () => {
      const profile: Partial<CreateHealthProfileInput> = {
        heightCm: 400
      };

      const result = service.validateHealthProfile(profile);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Height must be between 0 and 300 cm');
    });

    it('should detect invalid weight', () => {
      const profile: Partial<CreateHealthProfileInput> = {
        weightKg: 600
      };

      const result = service.validateHealthProfile(profile);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Weight must be between 0 and 500 kg');
    });

    it('should detect invalid dietary restriction', () => {
      const profile: Partial<CreateHealthProfileInput> = {
        dietaryRestrictions: ['invalid' as any]
      };

      const result = service.validateHealthProfile(profile);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should detect invalid emergency contact', () => {
      const profile: Partial<CreateHealthProfileInput> = {
        emergencyContacts: [{ name: '', phone: '', relationship: '', isPrimary: false }]
      };

      const result = service.validateHealthProfile(profile);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Emergency contact must have name and phone');
    });
  });
});
