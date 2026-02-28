/**
 * Property-Based Tests for Remedy Safety Information
 * 
 * Feature: ruralconnect-ai
 * Property 21: Remedy Safety Information
 * 
 * **Validates: Requirements 8.5**
 * 
 * Tests that all published remedies have complete safety data:
 * - All published remedies have non-empty safety fields
 * - Safety flags are properly set
 * - Contraindication checking works correctly
 * - Drug interaction warnings are present
 */

import * as fc from 'fast-check';
import { Pool } from 'pg';
import { SafetyInformationService } from '../safety-information.service';
import { SafetyInformation } from '../../../../types/natural-medicine';

// Mock database pool
const mockPool = {
  connect: jest.fn(),
  query: jest.fn(),
  end: jest.fn(),
} as unknown as Pool;

describe('Property 21: Remedy Safety Information', () => {
  let safetyService: SafetyInformationService;

  beforeEach(() => {
    safetyService = new SafetyInformationService(mockPool);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  /**
   * Property: All published remedies must have safety information
   * For any published remedy, safety information must exist and be non-null
   */
  test('Property 21.1: All published remedies have safety information', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(),
        async (remedyId) => {
          // Mock safety information with all required fields
          const mockSafety: SafetyInformation = {
            safety_id: 'safety-1',
            remedy_id: remedyId,
            side_effects: [
              { effect: 'Mild nausea', severity: 'mild', frequency: 'rare' },
            ],
            contraindications: [
              { condition: 'Pregnancy', reason: 'Not tested', severity: 'caution' },
            ],
            drug_interactions: [
              { drug: 'Aspirin', interaction: 'May increase bleeding', severity: 'moderate' },
            ],
            allergy_warnings: [
              { allergen: 'Pollen', reaction: 'Rash', severity: 'mild' },
            ],
            safe_for_pregnancy: false,
            safe_for_children: true,
            safe_for_elderly: true,
            safe_for_lactating: false,
            warnings: ['Consult doctor before use'],
            precautions: ['Take with food'],
            created_at: new Date(),
            updated_at: new Date(),
          };

          (mockPool.query as jest.Mock).mockResolvedValueOnce({
            rows: [mockSafety],
          });

          const result = await safetyService.getSafetyInfo(remedyId);

          // Verify safety information exists
          expect(result).not.toBeNull();
          expect(result).toBeDefined();
          
          // Verify all required fields are present
          expect(result?.remedy_id).toBe(remedyId);
          expect(result?.safe_for_pregnancy).toBeDefined();
          expect(result?.safe_for_children).toBeDefined();
          expect(result?.safe_for_elderly).toBeDefined();
          expect(result?.safe_for_lactating).toBeDefined();
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Safety fields must be non-empty arrays or have meaningful values
   * For any remedy with safety info, arrays should not be empty if they exist
   */
  test('Property 21.2: Safety information has complete data', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          remedy_id: fc.uuid(),
          side_effects: fc.array(
            fc.record({
              effect: fc.string({ minLength: 1, maxLength: 100 }),
              severity: fc.constantFrom('mild' as const, 'moderate' as const, 'severe' as const),
              frequency: fc.constantFrom('rare' as const, 'occasional' as const, 'common' as const),
            }),
            { minLength: 1, maxLength: 5 }
          ),
          contraindications: fc.array(
            fc.record({
              condition: fc.string({ minLength: 1, maxLength: 100 }),
              reason: fc.string({ minLength: 1, maxLength: 200 }),
              severity: fc.constantFrom('caution' as const, 'avoid' as const, 'contraindicated' as const),
            }),
            { minLength: 1, maxLength: 5 }
          ),
          drug_interactions: fc.array(
            fc.record({
              drug: fc.string({ minLength: 1, maxLength: 100 }),
              interaction: fc.string({ minLength: 1, maxLength: 200 }),
              severity: fc.constantFrom('mild' as const, 'moderate' as const, 'severe' as const),
            }),
            { minLength: 1, maxLength: 5 }
          ),
          allergy_warnings: fc.array(
            fc.record({
              allergen: fc.string({ minLength: 1, maxLength: 100 }),
              reaction: fc.string({ minLength: 1, maxLength: 200 }),
              severity: fc.constantFrom('mild' as const, 'moderate' as const, 'severe' as const),
            }),
            { minLength: 1, maxLength: 5 }
          ),
        }),
        async (safetyData) => {
          const mockSafety: SafetyInformation = {
            safety_id: 'safety-1',
            remedy_id: safetyData.remedy_id,
            side_effects: safetyData.side_effects,
            contraindications: safetyData.contraindications,
            drug_interactions: safetyData.drug_interactions,
            allergy_warnings: safetyData.allergy_warnings,
            safe_for_pregnancy: true,
            safe_for_children: true,
            safe_for_elderly: true,
            safe_for_lactating: true,
            warnings: ['Test warning'],
            precautions: ['Test precaution'],
            created_at: new Date(),
            updated_at: new Date(),
          };

          (mockPool.query as jest.Mock).mockResolvedValueOnce({
            rows: [mockSafety],
          });

          const result = await safetyService.getSafetyInfo(safetyData.remedy_id);

          // Verify all arrays have content
          expect(result?.side_effects).toBeDefined();
          expect(result?.side_effects!.length).toBeGreaterThan(0);
          
          expect(result?.contraindications).toBeDefined();
          expect(result?.contraindications!.length).toBeGreaterThan(0);
          
          expect(result?.drug_interactions).toBeDefined();
          expect(result?.drug_interactions!.length).toBeGreaterThan(0);
          
          expect(result?.allergy_warnings).toBeDefined();
          expect(result?.allergy_warnings!.length).toBeGreaterThan(0);

          // Verify each item has required fields
          result?.side_effects?.forEach((effect) => {
            expect(effect.effect).toBeTruthy();
            expect(effect.severity).toBeTruthy();
            expect(effect.frequency).toBeTruthy();
          });

          result?.contraindications?.forEach((contra) => {
            expect(contra.condition).toBeTruthy();
            expect(contra.reason).toBeTruthy();
            expect(contra.severity).toBeTruthy();
          });

          result?.drug_interactions?.forEach((interaction) => {
            expect(interaction.drug).toBeTruthy();
            expect(interaction.interaction).toBeTruthy();
            expect(interaction.severity).toBeTruthy();
          });

          result?.allergy_warnings?.forEach((warning) => {
            expect(warning.allergen).toBeTruthy();
            expect(warning.reaction).toBeTruthy();
            expect(warning.severity).toBeTruthy();
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Safety flags are boolean values
   * All safety flags must be true or false, never null or undefined
   */
  test('Property 21.3: Safety flags are properly set as booleans', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          remedy_id: fc.uuid(),
          safe_for_pregnancy: fc.boolean(),
          safe_for_children: fc.boolean(),
          safe_for_elderly: fc.boolean(),
          safe_for_lactating: fc.boolean(),
        }),
        async (safetyFlags) => {
          const mockSafety: SafetyInformation = {
            safety_id: 'safety-1',
            remedy_id: safetyFlags.remedy_id,
            side_effects: [],
            contraindications: [],
            drug_interactions: [],
            allergy_warnings: [],
            safe_for_pregnancy: safetyFlags.safe_for_pregnancy,
            safe_for_children: safetyFlags.safe_for_children,
            safe_for_elderly: safetyFlags.safe_for_elderly,
            safe_for_lactating: safetyFlags.safe_for_lactating,
            warnings: [],
            precautions: [],
            created_at: new Date(),
            updated_at: new Date(),
          };

          (mockPool.query as jest.Mock).mockResolvedValueOnce({
            rows: [mockSafety],
          });

          const result = await safetyService.getSafetyInfo(safetyFlags.remedy_id);

          // Verify all flags are boolean
          expect(typeof result?.safe_for_pregnancy).toBe('boolean');
          expect(typeof result?.safe_for_children).toBe('boolean');
          expect(typeof result?.safe_for_elderly).toBe('boolean');
          expect(typeof result?.safe_for_lactating).toBe('boolean');

          // Verify values match input
          expect(result?.safe_for_pregnancy).toBe(safetyFlags.safe_for_pregnancy);
          expect(result?.safe_for_children).toBe(safetyFlags.safe_for_children);
          expect(result?.safe_for_elderly).toBe(safetyFlags.safe_for_elderly);
          expect(result?.safe_for_lactating).toBe(safetyFlags.safe_for_lactating);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Contraindication checking works correctly
   * When checking safety for a user profile, contraindications should be identified
   */
  test('Property 21.4: Contraindication checking identifies risks', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          remedy_id: fc.uuid(),
          is_pregnant: fc.boolean(),
          is_lactating: fc.boolean(),
          age: fc.integer({ min: 0, max: 100 }),
        }),
        async (userProfile) => {
          const mockSafety: SafetyInformation = {
            safety_id: 'safety-1',
            remedy_id: userProfile.remedy_id,
            side_effects: [],
            contraindications: [
              { condition: 'Pregnancy', reason: 'Not tested', severity: 'contraindicated' },
              { condition: 'Lactation', reason: 'May affect milk', severity: 'avoid' },
            ],
            drug_interactions: [],
            allergy_warnings: [],
            safe_for_pregnancy: false,
            safe_for_children: userProfile.age < 12,
            safe_for_elderly: userProfile.age >= 65,
            safe_for_lactating: false,
            warnings: [],
            precautions: [],
            created_at: new Date(),
            updated_at: new Date(),
          };

          (mockPool.query as jest.Mock).mockResolvedValueOnce({
            rows: [mockSafety],
          });

          const result = await safetyService.checkSafetyFlags(
            userProfile.remedy_id,
            userProfile
          );

          // If user is pregnant and remedy is not safe for pregnancy, should be flagged
          if (userProfile.is_pregnant && !mockSafety.safe_for_pregnancy) {
            expect(result.is_safe).toBe(false);
            expect(result.warnings.length).toBeGreaterThan(0);
          }

          // If user is lactating and remedy is not safe for lactation, should be flagged
          if (userProfile.is_lactating && !mockSafety.safe_for_lactating) {
            expect(result.is_safe).toBe(false);
            expect(result.warnings.length).toBeGreaterThan(0);
          }

          // Verify warnings array exists
          expect(Array.isArray(result.warnings)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Drug interactions have required fields
   * All drug interactions must have drug name, interaction description, and severity
   */
  test('Property 21.5: Drug interactions have complete information', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          remedy_id: fc.uuid(),
          interactions: fc.array(
            fc.record({
              drug: fc.string({ minLength: 1, maxLength: 100 }),
              interaction: fc.string({ minLength: 1, maxLength: 200 }),
              severity: fc.constantFrom('mild' as const, 'moderate' as const, 'severe' as const),
            }),
            { minLength: 1, maxLength: 10 }
          ),
        }),
        async (data) => {
          const mockSafety: SafetyInformation = {
            safety_id: 'safety-1',
            remedy_id: data.remedy_id,
            side_effects: [],
            contraindications: [],
            drug_interactions: data.interactions,
            allergy_warnings: [],
            safe_for_pregnancy: true,
            safe_for_children: true,
            safe_for_elderly: true,
            safe_for_lactating: true,
            warnings: [],
            precautions: [],
            created_at: new Date(),
            updated_at: new Date(),
          };

          (mockPool.query as jest.Mock).mockResolvedValueOnce({
            rows: [mockSafety],
          });

          const result = await safetyService.getSafetyInfo(data.remedy_id);

          // Verify all drug interactions have required fields
          expect(result?.drug_interactions).toBeDefined();
          expect(result?.drug_interactions!.length).toBeGreaterThan(0);

          result?.drug_interactions?.forEach((interaction) => {
            // Drug name must be non-empty
            expect(interaction.drug).toBeTruthy();
            expect(interaction.drug.length).toBeGreaterThan(0);

            // Interaction description must be non-empty
            expect(interaction.interaction).toBeTruthy();
            expect(interaction.interaction.length).toBeGreaterThan(0);

            // Severity must be one of the valid values
            expect(['mild', 'moderate', 'severe']).toContain(interaction.severity);
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Severity levels are valid enum values
   * All severity fields must be one of the predefined values
   */
  test('Property 21.6: Severity levels are valid enum values', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(),
        async (remedyId) => {
          const mockSafety: SafetyInformation = {
            safety_id: 'safety-1',
            remedy_id: remedyId,
            side_effects: [
              { effect: 'Nausea', severity: 'mild', frequency: 'rare' },
              { effect: 'Headache', severity: 'moderate', frequency: 'occasional' },
              { effect: 'Dizziness', severity: 'severe', frequency: 'common' },
            ],
            contraindications: [
              { condition: 'Test1', reason: 'Reason1', severity: 'caution' },
              { condition: 'Test2', reason: 'Reason2', severity: 'avoid' },
              { condition: 'Test3', reason: 'Reason3', severity: 'contraindicated' },
            ],
            drug_interactions: [
              { drug: 'Drug1', interaction: 'Int1', severity: 'mild' },
              { drug: 'Drug2', interaction: 'Int2', severity: 'moderate' },
              { drug: 'Drug3', interaction: 'Int3', severity: 'severe' },
            ],
            allergy_warnings: [
              { allergen: 'Allergen1', reaction: 'Reaction1', severity: 'mild' },
              { allergen: 'Allergen2', reaction: 'Reaction2', severity: 'moderate' },
              { allergen: 'Allergen3', reaction: 'Reaction3', severity: 'severe' },
            ],
            safe_for_pregnancy: true,
            safe_for_children: true,
            safe_for_elderly: true,
            safe_for_lactating: true,
            warnings: [],
            precautions: [],
            created_at: new Date(),
            updated_at: new Date(),
          };

          (mockPool.query as jest.Mock).mockResolvedValueOnce({
            rows: [mockSafety],
          });

          const result = await safetyService.getSafetyInfo(remedyId);

          // Verify side effect severities
          result?.side_effects?.forEach((effect) => {
            expect(['mild', 'moderate', 'severe']).toContain(effect.severity);
            expect(['rare', 'occasional', 'common']).toContain(effect.frequency);
          });

          // Verify contraindication severities
          result?.contraindications?.forEach((contra) => {
            expect(['caution', 'avoid', 'contraindicated']).toContain(contra.severity);
          });

          // Verify drug interaction severities
          result?.drug_interactions?.forEach((interaction) => {
            expect(['mild', 'moderate', 'severe']).toContain(interaction.severity);
          });

          // Verify allergy warning severities
          result?.allergy_warnings?.forEach((warning) => {
            expect(['mild', 'moderate', 'severe']).toContain(warning.severity);
          });
        }
      ),
      { numRuns: 100 }
    );
  });
});
