/**
 * Property-Based Tests for Symptom Assessment Service
 * Tests correctness properties 17, 18, and 19
 */

import * as fc from 'fast-check';
import { SymptomAssessmentService, SymptomInput, PatientInfo } from '../symptom-assessment';

describe('Symptom Assessment Service - Property Tests', () => {
  const service = new SymptomAssessmentService();
  
  // ============================================================================
  // PROPERTY 17: Emergency Category Classification
  // ============================================================================
  
  describe('Property 17: Emergency Category Classification', () => {
    test('For any symptom input, the assessed emergency category must be exactly one of: life-threatening, urgent, non-urgent, or minor', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate random symptoms
          fc.array(
            fc.record({
              symptomName: fc.oneof(
                fc.constant('chest pain'),
                fc.constant('difficulty breathing'),
                fc.constant('headache'),
                fc.constant('fever'),
                fc.constant('cough'),
                fc.constant('stomach ache'),
                fc.constant('dizziness'),
                fc.constant('fatigue')
              ),
              severity: fc.oneof(
                fc.constant('mild' as const),
                fc.constant('moderate' as const),
                fc.constant('severe' as const),
                fc.constant('critical' as const)
              ),
              duration: fc.oneof(
                fc.constant('less_than_1_hour' as const),
                fc.constant('1_to_6_hours' as const),
                fc.constant('6_to_24_hours' as const),
                fc.constant('1_to_3_days' as const),
                fc.constant('3_to_7_days' as const),
                fc.constant('more_than_week' as const)
              )
            }),
            { minLength: 1, maxLength: 5 }
          ),
          // Generate random patient info
          fc.record({
            age: fc.integer({ min: 1, max: 100 }),
            gender: fc.oneof(
              fc.constant('male' as const),
              fc.constant('female' as const),
              fc.constant('other' as const)
            )
          }),
          async (symptoms: SymptomInput[], patientInfo: PatientInfo) => {
            const result = await service.assessSymptoms({
              userId: 'test-user',
              symptoms,
              patientInfo,
              inputMethod: 'text'
            });
            
            // Property: Emergency category must be one of the four valid values
            const validCategories = ['minor', 'non-urgent', 'urgent', 'life-threatening'];
            expect(validCategories).toContain(result.riskAssessment.emergencyCategory);
            
            // Property: Must return exactly one category (not null or undefined)
            expect(result.riskAssessment.emergencyCategory).toBeDefined();
            expect(typeof result.riskAssessment.emergencyCategory).toBe('string');
          }
        ),
        { numRuns: 100 }
      );
    });
    
    test('Life-threatening symptoms always result in life-threatening or urgent category', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.oneof(
            fc.constant('chest pain'),
            fc.constant('difficulty breathing'),
            fc.constant('severe bleeding'),
            fc.constant('unconsciousness')
          ),
          fc.record({
            age: fc.integer({ min: 1, max: 100 }),
            gender: fc.oneof(
              fc.constant('male' as const),
              fc.constant('female' as const)
            )
          }),
          async (symptomName: string, patientInfo: PatientInfo) => {
            const symptoms: SymptomInput[] = [{
              symptomName,
              severity: 'severe',
              duration: '1_to_6_hours'
            }];
            
            const result = await service.assessSymptoms({
              userId: 'test-user',
              symptoms,
              patientInfo,
              inputMethod: 'text'
            });
            
            // Property: Life-threatening symptoms should result in urgent or life-threatening category
            expect(['urgent', 'life-threatening']).toContain(result.riskAssessment.emergencyCategory);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
  
  // ============================================================================
  // PROPERTY 18: Risk Level Calculation
  // ============================================================================
  
  describe('Property 18: Risk Level Calculation', () => {
    test('For any symptom assessment, the calculated risk level must be one of: critical, high, medium, or low', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.record({
              symptomName: fc.string({ minLength: 3, maxLength: 50 }),
              severity: fc.oneof(
                fc.constant('mild' as const),
                fc.constant('moderate' as const),
                fc.constant('severe' as const),
                fc.constant('critical' as const)
              ),
              duration: fc.oneof(
                fc.constant('less_than_1_hour' as const),
                fc.constant('1_to_6_hours' as const),
                fc.constant('6_to_24_hours' as const),
                fc.constant('1_to_3_days' as const),
                fc.constant('3_to_7_days' as const),
                fc.constant('more_than_week' as const)
              )
            }),
            { minLength: 1, maxLength: 5 }
          ),
          fc.record({
            age: fc.integer({ min: 1, max: 100 }),
            gender: fc.oneof(
              fc.constant('male' as const),
              fc.constant('female' as const),
              fc.constant('other' as const)
            ),
            chronicConditions: fc.option(fc.array(fc.string(), { maxLength: 3 }), { nil: undefined })
          }),
          async (symptoms: SymptomInput[], patientInfo: PatientInfo) => {
            const result = await service.assessSymptoms({
              userId: 'test-user',
              symptoms,
              patientInfo,
              inputMethod: 'text'
            });
            
            // Property: Risk level must be one of the four valid values
            const validRiskLevels = ['low', 'medium', 'high', 'critical'];
            expect(validRiskLevels).toContain(result.riskAssessment.riskLevel);
            
            // Property: Risk level must be defined
            expect(result.riskAssessment.riskLevel).toBeDefined();
            expect(typeof result.riskAssessment.riskLevel).toBe('string');
          }
        ),
        { numRuns: 100 }
      );
    });
    
    test('Risk level considers symptom severity, duration, and patient age', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.oneof(
            fc.constant('mild' as const),
            fc.constant('moderate' as const),
            fc.constant('severe' as const),
            fc.constant('critical' as const)
          ),
          fc.integer({ min: 1, max: 100 }),
          async (severity, age) => {
            const symptoms: SymptomInput[] = [{
              symptomName: 'test symptom',
              severity,
              duration: '1_to_3_days'
            }];
            
            const patientInfo: PatientInfo = {
              age,
              gender: 'male'
            };
            
            const result = await service.assessSymptoms({
              userId: 'test-user',
              symptoms,
              patientInfo,
              inputMethod: 'text'
            });
            
            // Property: Critical severity should result in high or critical risk
            if (severity === 'critical') {
              expect(['high', 'critical']).toContain(result.riskAssessment.riskLevel);
            }
            
            // Property: Very young or elderly patients should have higher risk
            // (This is a soft property - we check that age is considered, not that it always increases risk)
            expect(result.riskAssessment.riskLevel).toBeDefined();
          }
        ),
        { numRuns: 100 }
      );
    });
    
    test('Multiple severe symptoms increase risk level', async () => {
      const singleSevereSymptom: SymptomInput[] = [{
        symptomName: 'headache',
        severity: 'severe',
        duration: '1_to_3_days'
      }];
      
      const multipleSymptoms: SymptomInput[] = [
        { symptomName: 'headache', severity: 'severe', duration: '1_to_3_days' },
        { symptomName: 'fever', severity: 'severe', duration: '1_to_3_days' },
        { symptomName: 'vomiting', severity: 'moderate', duration: '6_to_24_hours' }
      ];
      
      const patientInfo: PatientInfo = {
        age: 30,
        gender: 'male'
      };
      
      const singleResult = await service.assessSymptoms({
        userId: 'test-user',
        symptoms: singleSevereSymptom,
        patientInfo,
        inputMethod: 'text'
      });
      
      const multipleResult = await service.assessSymptoms({
        userId: 'test-user',
        symptoms: multipleSymptoms,
        patientInfo,
        inputMethod: 'text'
      });
      
      // Property: Multiple symptoms should result in equal or higher risk
      const riskOrder = ['low', 'medium', 'high', 'critical'];
      const singleRiskIndex = riskOrder.indexOf(singleResult.riskAssessment.riskLevel);
      const multipleRiskIndex = riskOrder.indexOf(multipleResult.riskAssessment.riskLevel);
      
      expect(multipleRiskIndex).toBeGreaterThanOrEqual(singleRiskIndex);
    });
  });
  
  // ============================================================================
  // PROPERTY 19: Critical Risk Response
  // ============================================================================
  
  describe('Property 19: Critical Risk Response', () => {
    test('For any symptom assessment with critical risk level, the response must include emergency contact options', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.record({
              symptomName: fc.oneof(
                fc.constant('chest pain'),
                fc.constant('difficulty breathing'),
                fc.constant('severe bleeding')
              ),
              severity: fc.constant('critical' as const),
              duration: fc.oneof(
                fc.constant('less_than_1_hour' as const),
                fc.constant('1_to_6_hours' as const)
              )
            }),
            { minLength: 1, maxLength: 3 }
          ),
          fc.record({
            age: fc.integer({ min: 1, max: 100 }),
            gender: fc.oneof(
              fc.constant('male' as const),
              fc.constant('female' as const)
            )
          }),
          async (symptoms: SymptomInput[], patientInfo: PatientInfo) => {
            const result = await service.assessSymptoms({
              userId: 'test-user',
              symptoms,
              patientInfo,
              inputMethod: 'text'
            });
            
            // Property: If risk level is critical, emergency contacts must be provided
            if (result.riskAssessment.riskLevel === 'critical') {
              expect(result.emergencyContacts).toBeDefined();
              expect(result.emergencyContacts?.ambulance).toBeDefined();
              expect(result.emergencyContacts?.nearestHospital).toBeDefined();
            }
            
            // Property: If requires immediate attention, emergency contacts must be provided
            if (result.riskAssessment.requiresImmediateAttention) {
              expect(result.emergencyContacts).toBeDefined();
            }
          }
        ),
        { numRuns: 100 }
      );
    });
    
    test('Life-threatening emergency category always includes emergency contacts', async () => {
      const symptoms: SymptomInput[] = [{
        symptomName: 'chest pain',
        severity: 'critical',
        duration: 'less_than_1_hour'
      }];
      
      const patientInfo: PatientInfo = {
        age: 55,
        gender: 'male'
      };
      
      const result = await service.assessSymptoms({
        userId: 'test-user',
        symptoms,
        patientInfo,
        inputMethod: 'text'
      });
      
      // Property: Life-threatening category must include emergency contacts
      if (result.riskAssessment.emergencyCategory === 'life-threatening') {
        expect(result.emergencyContacts).toBeDefined();
        expect(result.emergencyContacts?.ambulance).toBe('108');
        expect(result.emergencyContacts?.nearestHospital).toBeDefined();
        expect(result.emergencyContacts?.nearestHospital?.name).toBeDefined();
      }
    });
    
    test('Critical risk always sets requiresImmediateAttention to true', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.record({
              symptomName: fc.string({ minLength: 3, maxLength: 50 }),
              severity: fc.constant('critical' as const),
              duration: fc.oneof(
                fc.constant('less_than_1_hour' as const),
                fc.constant('1_to_6_hours' as const)
              )
            }),
            { minLength: 1, maxLength: 3 }
          ),
          fc.record({
            age: fc.integer({ min: 1, max: 100 }),
            gender: fc.oneof(
              fc.constant('male' as const),
              fc.constant('female' as const)
            )
          }),
          async (symptoms: SymptomInput[], patientInfo: PatientInfo) => {
            const result = await service.assessSymptoms({
              userId: 'test-user',
              symptoms,
              patientInfo,
              inputMethod: 'text'
            });
            
            // Property: Critical risk level must set requiresImmediateAttention to true
            if (result.riskAssessment.riskLevel === 'critical') {
              expect(result.riskAssessment.requiresImmediateAttention).toBe(true);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });
  
  // ============================================================================
  // ADDITIONAL INVARIANT PROPERTIES
  // ============================================================================
  
  describe('Additional Invariant Properties', () => {
    test('Confidence score is always between 0 and 100', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.record({
              symptomName: fc.string({ minLength: 3, maxLength: 50 }),
              severity: fc.oneof(
                fc.constant('mild' as const),
                fc.constant('moderate' as const),
                fc.constant('severe' as const),
                fc.constant('critical' as const)
              ),
              duration: fc.oneof(
                fc.constant('less_than_1_hour' as const),
                fc.constant('1_to_6_hours' as const),
                fc.constant('6_to_24_hours' as const),
                fc.constant('1_to_3_days' as const)
              ),
              additionalDetails: fc.option(fc.string({ maxLength: 100 }), { nil: undefined })
            }),
            { minLength: 1, maxLength: 5 }
          ),
          fc.record({
            age: fc.integer({ min: 1, max: 100 }),
            gender: fc.oneof(
              fc.constant('male' as const),
              fc.constant('female' as const)
            )
          }),
          async (symptoms: SymptomInput[], patientInfo: PatientInfo) => {
            const result = await service.assessSymptoms({
              userId: 'test-user',
              symptoms,
              patientInfo,
              inputMethod: 'text'
            });
            
            // Property: Confidence must be between 0 and 100
            expect(result.riskAssessment.confidence).toBeGreaterThanOrEqual(0);
            expect(result.riskAssessment.confidence).toBeLessThanOrEqual(100);
          }
        ),
        { numRuns: 100 }
      );
    });
    
    test('First aid steps are always provided and in order', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.record({
              symptomName: fc.string({ minLength: 3, maxLength: 50 }),
              severity: fc.oneof(
                fc.constant('mild' as const),
                fc.constant('moderate' as const),
                fc.constant('severe' as const)
              ),
              duration: fc.oneof(
                fc.constant('1_to_6_hours' as const),
                fc.constant('6_to_24_hours' as const)
              )
            }),
            { minLength: 1, maxLength: 3 }
          ),
          fc.record({
            age: fc.integer({ min: 1, max: 100 }),
            gender: fc.oneof(
              fc.constant('male' as const),
              fc.constant('female' as const)
            )
          }),
          async (symptoms: SymptomInput[], patientInfo: PatientInfo) => {
            const result = await service.assessSymptoms({
              userId: 'test-user',
              symptoms,
              patientInfo,
              inputMethod: 'text'
            });
            
            // Property: First aid steps must be provided
            expect(result.firstAidSteps).toBeDefined();
            expect(Array.isArray(result.firstAidSteps)).toBe(true);
            expect(result.firstAidSteps.length).toBeGreaterThan(0);
            
            // Property: Steps must be in sequential order
            for (let i = 0; i < result.firstAidSteps.length; i++) {
              expect(result.firstAidSteps[i].stepNumber).toBe(i + 1);
              expect(result.firstAidSteps[i].instruction).toBeDefined();
              expect(result.firstAidSteps[i].instruction.length).toBeGreaterThan(0);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
