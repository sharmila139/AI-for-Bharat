/**
 * Property-Based Tests for Project Progress Dashboard
 * 
 * Tests:
 * - Property 35: Project Progress Calculation
 * - Property 36: Project Delay Detection
 */

import fc from 'fast-check';
import { Pool } from 'pg';
import { 
  ProjectProgressService, 
  ProjectStatus,
  Milestone,
} from '../project-progress';

// Mock database pool
const mockPool = {
  connect: jest.fn(),
  query: jest.fn(),
} as unknown as Pool;

describe('Project Progress Property Tests', () => {
  let service: ProjectProgressService;

  beforeEach(() => {
    service = new ProjectProgressService(mockPool);
    jest.clearAllMocks();
  });

  // ==========================================================================
  // CUSTOM ARBITRARIES FOR PROJECT DATA
  // ==========================================================================

  const milestoneArbitrary = fc.record({
    milestone_id: fc.uuid(),
    name: fc.string({ minLength: 5, maxLength: 50 }),
    description: fc.option(fc.string({ maxLength: 200 })),
    target_date: fc.date({ min: new Date('2024-01-01'), max: new Date('2026-12-31') }),
    completion_date: fc.option(fc.date({ min: new Date('2024-01-01'), max: new Date('2026-12-31') })),
    status: fc.constantFrom<'pending' | 'in_progress' | 'completed' | 'delayed'>('pending', 'in_progress', 'completed', 'delayed'),
    weight: fc.float({ min: 0, max: 100, noNaN: true }),
  });

  // ==========================================================================
  // PROPERTY 35: Project Progress Calculation
  // ==========================================================================

  describe('Property 35: Project Progress Calculation', () => {
    /**
     * **Validates: Requirements 15.4**
     * 
     * For any infrastructure project, the progress percentage should be between 
     * 0-100 and calculated as the weighted sum of completed milestone percentages.
     */
    test('progress percentage should always be between 0 and 100', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            project_id: fc.uuid(),
            milestones: fc.array(milestoneArbitrary, { minLength: 1, maxLength: 10 }),
          }),
          async (testData) => {
            const { project_id, milestones } = testData;

            // Mock project data
            const mockProject = {
              project_id,
              milestones,
              progress_percentage: 0,
            };

            (mockPool.query as jest.Mock)
              .mockResolvedValueOnce({ rows: [mockProject] }) // getProject call
              .mockResolvedValueOnce({}); // UPDATE query

            const progress = await service.calculateProgress(project_id);

            // Property: Progress should be between 0 and 100
            expect(progress).toBeGreaterThanOrEqual(0);
            expect(progress).toBeLessThanOrEqual(100);
            expect(Number.isFinite(progress)).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    test('progress with all completed milestones should be 100%', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            project_id: fc.uuid(),
            milestone_count: fc.integer({ min: 1, max: 10 }),
          }),
          async (testData) => {
            const { project_id, milestone_count } = testData;

            // Create milestones with equal weights, all completed
            const milestones: Milestone[] = Array.from({ length: milestone_count }, (_, i) => ({
              milestone_id: `MS-${i}`,
              name: `Milestone ${i + 1}`,
              target_date: new Date('2025-06-01'),
              completion_date: new Date('2025-05-15'),
              status: 'completed' as const,
              weight: 100 / milestone_count, // Equal weights
            }));

            const mockProject = {
              project_id,
              milestones,
              progress_percentage: 0,
            };

            (mockPool.query as jest.Mock)
              .mockResolvedValueOnce({ rows: [mockProject] }) // getProject call
              .mockResolvedValueOnce({}); // UPDATE query

            const progress = await service.calculateProgress(project_id);

            // Property: All completed milestones should result in 100% progress
            expect(progress).toBeCloseTo(100, 1);
          }
        ),
        { numRuns: 100 }
      );
    });

    test('progress with no completed milestones should be 0%', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            project_id: fc.uuid(),
            milestone_count: fc.integer({ min: 1, max: 10 }),
          }),
          async (testData) => {
            const { project_id, milestone_count } = testData;

            // Create milestones with equal weights, none completed
            const milestones: Milestone[] = Array.from({ length: milestone_count }, (_, i) => ({
              milestone_id: `MS-${i}`,
              name: `Milestone ${i + 1}`,
              target_date: new Date('2025-06-01'),
              status: fc.sample(fc.constantFrom<'pending' | 'in_progress' | 'delayed'>('pending', 'in_progress', 'delayed'), 1)[0],
              weight: 100 / milestone_count,
            }));

            const mockProject = {
              project_id,
              milestones,
              progress_percentage: 0,
            };

            (mockPool.query as jest.Mock)
              .mockResolvedValueOnce({ rows: [mockProject] }) // getProject call
              .mockResolvedValueOnce({}); // UPDATE query

            const progress = await service.calculateProgress(project_id);

            // Property: No completed milestones should result in 0% progress
            expect(progress).toBe(0);
          }
        ),
        { numRuns: 100 }
      );
    });

    test('progress should be weighted sum of completed milestones', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            project_id: fc.uuid(),
            weights: fc.array(fc.float({ min: 1, max: 50, noNaN: true }), { minLength: 2, maxLength: 5 }),
            completed_indices: fc.array(fc.integer({ min: 0, max: 4 }), { minLength: 0, maxLength: 5 }),
          }),
          async (testData) => {
            const { project_id, weights, completed_indices } = testData;

            // Normalize weights to sum to 100
            const totalWeight = weights.reduce((sum, w) => sum + w, 0);
            const normalizedWeights = weights.map(w => (w / totalWeight) * 100);

            // Create milestones
            const milestones: Milestone[] = weights.map((_, i) => ({
              milestone_id: `MS-${i}`,
              name: `Milestone ${i + 1}`,
              target_date: new Date('2025-06-01'),
              status: completed_indices.includes(i) ? 'completed' as const : 'pending' as const,
              weight: normalizedWeights[i],
              completion_date: completed_indices.includes(i) ? new Date('2025-05-15') : undefined,
            }));

            const mockProject = {
              project_id,
              milestones,
              progress_percentage: 0,
            };

            (mockPool.query as jest.Mock)
              .mockResolvedValueOnce({ rows: [mockProject] }) // getProject call
              .mockResolvedValueOnce({}); // UPDATE query

            const progress = await service.calculateProgress(project_id);

            // Calculate expected progress
            const expectedProgress = milestones
              .filter(m => m.status === 'completed')
              .reduce((sum, m) => sum + m.weight, 0);

            // Property: Progress should match weighted sum of completed milestones
            expect(progress).toBeCloseTo(expectedProgress, 1);
          }
        ),
        { numRuns: 100 }
      );
    });

    test('progress with zero total weight should use equal weights', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            project_id: fc.uuid(),
            milestone_count: fc.integer({ min: 2, max: 10 }),
            completed_count: fc.integer({ min: 0, max: 10 }),
          }),
          async (testData) => {
            const { project_id, milestone_count, completed_count } = testData;

            // Ensure completed_count doesn't exceed milestone_count
            const actualCompletedCount = Math.min(completed_count, milestone_count);

            // Create milestones with zero weights
            const milestones: Milestone[] = Array.from({ length: milestone_count }, (_, i) => ({
              milestone_id: `MS-${i}`,
              name: `Milestone ${i + 1}`,
              target_date: new Date('2025-06-01'),
              status: i < actualCompletedCount ? 'completed' as const : 'pending' as const,
              weight: 0, // Zero weight
              completion_date: i < actualCompletedCount ? new Date('2025-05-15') : undefined,
            }));

            const mockProject = {
              project_id,
              milestones,
              progress_percentage: 0,
            };

            (mockPool.query as jest.Mock)
              .mockResolvedValueOnce({ rows: [mockProject] }) // getProject call
              .mockResolvedValueOnce({}); // UPDATE query

            const progress = await service.calculateProgress(project_id);

            // Calculate expected progress with equal weights
            const expectedProgress = (actualCompletedCount / milestone_count) * 100;

            // Property: With zero weights, should use equal weights
            expect(progress).toBeCloseTo(expectedProgress, 1);
          }
        ),
        { numRuns: 100 }
      );
    });

    test('progress with no milestones should be 0%', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(),
          async (project_id) => {
            // Clear mocks for each iteration
            jest.clearAllMocks();

            const mockProject = {
              project_id,
              milestones: [], // No milestones
              progress_percentage: 0,
            };

            // Mock implementation to return project data then empty result for UPDATE
            (mockPool.query as jest.Mock)
              .mockImplementation((query: string) => {
                if (query.includes('SELECT')) {
                  return Promise.resolve({ rows: [mockProject], rowCount: 1 });
                }
                return Promise.resolve({ rows: [], rowCount: 0 });
              });

            const progress = await service.calculateProgress(project_id);

            // Property: No milestones should result in 0% progress
            expect(progress).toBe(0);
          }
        ),
        { numRuns: 100 }
      );
    });

    test('manually set progress should accept valid percentages', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            project_id: fc.uuid(),
            progress: fc.float({ min: 0, max: 100, noNaN: true }),
          }),
          async (testData) => {
            const { project_id, progress } = testData;

            (mockPool.query as jest.Mock).mockResolvedValueOnce({});

            await expect(service.setProgress(project_id, progress)).resolves.not.toThrow();

            // Verify the query was called with correct parameters
            expect(mockPool.query).toHaveBeenCalledWith(
              expect.stringContaining('UPDATE infrastructure_projects'),
              expect.arrayContaining([progress, project_id])
            );
          }
        ),
        { numRuns: 100 }
      );
    });

    test('manually set progress should reject invalid percentages', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            project_id: fc.uuid(),
            progress: fc.oneof(
              fc.double({ min: -100, max: -0.01, noNaN: true }),
              fc.double({ min: 100.01, max: 200, noNaN: true })
            ),
          }),
          async (testData) => {
            const { project_id, progress } = testData;

            // Property: Invalid progress values should be rejected
            await expect(service.setProgress(project_id, progress)).rejects.toThrow(
              'Progress percentage must be between 0 and 100'
            );
          }
        ),
        { numRuns: 100 }
      );
    });

    test('progress calculation should update database', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            project_id: fc.uuid(),
            milestones: fc.array(milestoneArbitrary, { minLength: 1, maxLength: 5 }),
          }),
          async (testData) => {
            // Clear mocks for each iteration
            jest.clearAllMocks();

            const { project_id, milestones } = testData;

            const mockProject = {
              project_id,
              milestones,
              progress_percentage: 0,
            };

            // Mock implementation to return project data then empty result for UPDATE
            (mockPool.query as jest.Mock)
              .mockImplementation((query: string) => {
                if (query.includes('SELECT')) {
                  return Promise.resolve({ rows: [mockProject], rowCount: 1 });
                }
                return Promise.resolve({ rows: [], rowCount: 0 });
              });

            await service.calculateProgress(project_id);

            // Property: Database should be updated with new progress
            expect(mockPool.query).toHaveBeenCalledWith(
              expect.stringContaining('UPDATE infrastructure_projects'),
              expect.arrayContaining([expect.any(Number), project_id])
            );
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // ==========================================================================
  // PROPERTY 36: Project Delay Detection
  // ==========================================================================

  describe('Property 36: Project Delay Detection', () => {
    /**
     * **Validates: Requirements 15.5**
     * 
     * For any infrastructure project, when current_date > expected_completion_date 
     * and status != 'completed', the project should be marked as delayed.
     */
    test('projects past expected completion should be marked delayed', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            project_id: fc.uuid(),
            days_overdue: fc.integer({ min: 1, max: 365 }),
            status: fc.constantFrom<ProjectStatus>('planned', 'approved', 'in_progress', 'on_hold'),
          }),
          async (testData) => {
            // Clear mocks for each iteration
            jest.clearAllMocks();

            const { project_id, days_overdue, status } = testData;

            const now = new Date();
            const expectedCompletion = new Date(now.getTime() - days_overdue * 24 * 60 * 60 * 1000);

            const mockProject = {
              project_id,
              status,
              planned_end_date: expectedCompletion,
              estimated_completion_date: null,
              is_delayed: false,
              delay_days: 0,
            };

            // Mock implementation
            (mockPool.query as jest.Mock)
              .mockImplementation((query: string) => {
                if (query.includes('SELECT')) {
                  return Promise.resolve({ rows: [mockProject], rowCount: 1 });
                }
                return Promise.resolve({ rows: [], rowCount: 0 });
              });

            await service.checkDelayStatus(project_id);

            // Property: Project should be marked as delayed
            const calls = (mockPool.query as jest.Mock).mock.calls;
            const updateCall = calls.find(
              call => typeof call[0] === 'string' && call[0].includes('UPDATE') && call[0].includes('is_delayed')
            );
            
            expect(updateCall).toBeDefined();
            expect(updateCall![0]).toContain('UPDATE infrastructure_projects');
            expect(updateCall![1]).toEqual([true, expect.any(Number), project_id]);
            
            // Verify delay_days is greater than 0
            const delayDays = updateCall![1][1];
            expect(delayDays).toBeGreaterThan(0);
          }
        ),
        { numRuns: 100 }
      );
    });

    test('projects before expected completion should not be delayed', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            project_id: fc.uuid(),
            days_remaining: fc.integer({ min: 1, max: 365 }),
            status: fc.constantFrom<ProjectStatus>('planned', 'approved', 'in_progress', 'on_hold'),
          }),
          async (testData) => {
            // Clear mocks for each iteration
            jest.clearAllMocks();

            const { project_id, days_remaining, status } = testData;

            const now = new Date();
            const expectedCompletion = new Date(now.getTime() + days_remaining * 24 * 60 * 60 * 1000);

            const mockProject = {
              project_id,
              status,
              planned_end_date: expectedCompletion,
              estimated_completion_date: null,
              is_delayed: false,
              delay_days: 0,
            };

            // Mock implementation
            (mockPool.query as jest.Mock)
              .mockImplementation((query: string) => {
                if (query.includes('SELECT')) {
                  return Promise.resolve({ rows: [mockProject], rowCount: 1 });
                }
                return Promise.resolve({ rows: [], rowCount: 0 });
              });

            await service.checkDelayStatus(project_id);

            // Property: Project should not be marked as delayed
            expect(mockPool.query).toHaveBeenCalledWith(
              expect.stringContaining('UPDATE infrastructure_projects'),
              expect.arrayContaining([false, 0, project_id])
            );
          }
        ),
        { numRuns: 100 }
      );
    });

    test('completed projects should not be checked for delays', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            project_id: fc.uuid(),
            days_overdue: fc.integer({ min: 1, max: 365 }),
          }),
          async (testData) => {
            // Clear mocks for each iteration
            jest.clearAllMocks();

            const { project_id, days_overdue } = testData;

            const now = new Date();
            const expectedCompletion = new Date(now.getTime() - days_overdue * 24 * 60 * 60 * 1000);

            const mockProject = {
              project_id,
              status: 'completed' as ProjectStatus,
              planned_end_date: expectedCompletion,
              estimated_completion_date: null,
              is_delayed: false,
              delay_days: 0,
            };

            // Mock implementation
            (mockPool.query as jest.Mock)
              .mockImplementation((query: string) => {
                if (query.includes('SELECT')) {
                  return Promise.resolve({ rows: [mockProject], rowCount: 1 });
                }
                return Promise.resolve({ rows: [], rowCount: 0 });
              });

            await service.checkDelayStatus(project_id);

            // Property: Completed projects should not trigger delay check
            expect(mockPool.query).toHaveBeenCalledTimes(1); // Only getProject, no UPDATE
          }
        ),
        { numRuns: 100 }
      );
    });

    test('cancelled projects should not be checked for delays', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            project_id: fc.uuid(),
            days_overdue: fc.integer({ min: 1, max: 365 }),
          }),
          async (testData) => {
            // Clear mocks for each iteration
            jest.clearAllMocks();

            const { project_id, days_overdue } = testData;

            const now = new Date();
            const expectedCompletion = new Date(now.getTime() - days_overdue * 24 * 60 * 60 * 1000);

            const mockProject = {
              project_id,
              status: 'cancelled' as ProjectStatus,
              planned_end_date: expectedCompletion,
              estimated_completion_date: null,
              is_delayed: false,
              delay_days: 0,
            };

            // Mock implementation
            (mockPool.query as jest.Mock)
              .mockImplementation((query: string) => {
                if (query.includes('SELECT')) {
                  return Promise.resolve({ rows: [mockProject], rowCount: 1 });
                }
                return Promise.resolve({ rows: [], rowCount: 0 });
              });

            await service.checkDelayStatus(project_id);

            // Property: Cancelled projects should not trigger delay check
            expect(mockPool.query).toHaveBeenCalledTimes(1); // Only getProject, no UPDATE
          }
        ),
        { numRuns: 100 }
      );
    });

    test('estimated completion date should take precedence over planned date', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            project_id: fc.uuid(),
            days_overdue_planned: fc.integer({ min: 10, max: 100 }),
            days_remaining_estimated: fc.integer({ min: 1, max: 50 }),
            status: fc.constantFrom<ProjectStatus>('in_progress', 'on_hold'),
          }),
          async (testData) => {
            // Clear mocks for each iteration
            jest.clearAllMocks();

            const { project_id, days_overdue_planned, days_remaining_estimated, status } = testData;

            const now = new Date();
            const plannedEnd = new Date(now.getTime() - days_overdue_planned * 24 * 60 * 60 * 1000);
            const estimatedEnd = new Date(now.getTime() + days_remaining_estimated * 24 * 60 * 60 * 1000);

            const mockProject = {
              project_id,
              status,
              planned_end_date: plannedEnd,
              estimated_completion_date: estimatedEnd, // Still in future
              is_delayed: false,
              delay_days: 0,
            };

            // Mock implementation
            (mockPool.query as jest.Mock)
              .mockImplementation((query: string) => {
                if (query.includes('SELECT')) {
                  return Promise.resolve({ rows: [mockProject], rowCount: 1 });
                }
                return Promise.resolve({ rows: [], rowCount: 0 });
              });

            await service.checkDelayStatus(project_id);

            // Property: Should use estimated date, so not delayed
            const calls = (mockPool.query as jest.Mock).mock.calls;
            const updateCall = calls.find(
              call => typeof call[0] === 'string' && call[0].includes('UPDATE') && call[0].includes('is_delayed')
            );
            
            expect(updateCall).toBeDefined();
            expect(updateCall![0]).toContain('UPDATE infrastructure_projects');
            expect(updateCall![1]).toEqual([false, 0, project_id]);
          }
        ),
        { numRuns: 100 }
      );
    });

    test('delay days should be calculated correctly', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            project_id: fc.uuid(),
            days_overdue: fc.integer({ min: 1, max: 365 }),
          }),
          async (testData) => {
            // Clear mocks for each iteration
            jest.clearAllMocks();

            const { project_id, days_overdue } = testData;

            const now = new Date();
            const expectedCompletion = new Date(now.getTime() - days_overdue * 24 * 60 * 60 * 1000);

            const mockProject = {
              project_id,
              status: 'in_progress' as ProjectStatus,
              planned_end_date: expectedCompletion,
              estimated_completion_date: null,
              is_delayed: false,
              delay_days: 0,
            };

            // Mock implementation
            (mockPool.query as jest.Mock)
              .mockImplementation((query: string) => {
                if (query.includes('SELECT')) {
                  return Promise.resolve({ rows: [mockProject], rowCount: 1 });
                }
                return Promise.resolve({ rows: [], rowCount: 0 });
              });

            await service.checkDelayStatus(project_id);

            // Property: Delay days should be approximately equal to days_overdue
            const calls = (mockPool.query as jest.Mock).mock.calls;
            const updateCall = calls.find(
              call => typeof call[0] === 'string' && call[0].includes('UPDATE') && call[0].includes('is_delayed')
            );
            
            expect(updateCall).toBeDefined();
            expect(updateCall![0]).toContain('UPDATE infrastructure_projects');
            expect(updateCall![1]).toEqual([true, expect.any(Number), project_id]);
            
            // Verify delay_days is approximately equal to days_overdue
            const calculatedDelayDays = updateCall![1][1];
            expect(calculatedDelayDays).toBeGreaterThan(0);
            expect(Math.abs(calculatedDelayDays - days_overdue)).toBeLessThanOrEqual(1);
          }
        ),
        { numRuns: 100 }
      );
    });

    test('adding delay reason should mark project as delayed', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            project_id: fc.uuid(),
            reason: fc.string({ minLength: 10, maxLength: 200 }),
          }),
          async (testData) => {
            const { project_id, reason } = testData;

            const mockProject = {
              project_id,
              delay_reasons: [],
            };

            (mockPool.query as jest.Mock)
              .mockResolvedValueOnce({ rows: [mockProject] }) // getProject call
              .mockResolvedValueOnce({}); // UPDATE query

            await service.addDelayReason(project_id, reason);

            // Property: Adding delay reason should set is_delayed to true
            expect(mockPool.query).toHaveBeenCalledWith(
              expect.stringContaining('is_delayed = TRUE'),
              expect.arrayContaining([expect.arrayContaining([reason]), project_id])
            );
          }
        ),
        { numRuns: 100 }
      );
    });

    test('updating estimated completion should recheck delay status', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            project_id: fc.uuid(),
            new_completion_date: fc.date({ min: new Date('2025-01-01'), max: new Date('2027-12-31') }),
          }),
          async (testData) => {
            // Clear mocks for each iteration
            jest.clearAllMocks();

            const { project_id, new_completion_date } = testData;

            const mockProject = {
              project_id,
              status: 'in_progress' as ProjectStatus,
              planned_end_date: new Date('2025-06-01'),
              estimated_completion_date: new_completion_date,
              is_delayed: false,
              delay_days: 0,
            };

            // Mock implementation
            (mockPool.query as jest.Mock)
              .mockImplementation((query: string) => {
                if (query.includes('SELECT')) {
                  return Promise.resolve({ rows: [mockProject], rowCount: 1 });
                }
                return Promise.resolve({ rows: [], rowCount: 0 });
              });

            await service.updateEstimatedCompletion(project_id, new_completion_date);

            // Property: Should update estimated date and recheck delay status
            expect(mockPool.query).toHaveBeenCalledTimes(3);
            expect(mockPool.query).toHaveBeenCalledWith(
              expect.stringContaining('estimated_completion_date'),
              expect.arrayContaining([new_completion_date, project_id])
            );
          }
        ),
        { numRuns: 100 }
      );
    });

    test('checkAllProjectsForDelays should process multiple projects', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(fc.uuid(), { minLength: 1, maxLength: 10 }),
          async (project_ids) => {
            // Clear mocks for each iteration
            jest.clearAllMocks();

            const mockProjects = project_ids.map(project_id => ({
              project_id,
              status: 'in_progress' as ProjectStatus,
              planned_end_date: new Date('2024-01-01'), // Past date
              estimated_completion_date: null,
              is_delayed: false,
              delay_days: 0,
            }));

            let projectIndex = 0;

            // Mock implementation
            (mockPool.query as jest.Mock)
              .mockImplementation((query: string) => {
                if (query.includes('SELECT project_id FROM infrastructure_projects')) {
                  // First query returns list of project IDs
                  return Promise.resolve({
                    rows: project_ids.map(id => ({ project_id: id })),
                    rowCount: project_ids.length,
                  });
                } else if (query.includes('SELECT')) {
                  // Subsequent queries return individual projects
                  const project = mockProjects[projectIndex % mockProjects.length];
                  projectIndex++;
                  return Promise.resolve({ rows: [project], rowCount: 1 });
                }
                return Promise.resolve({ rows: [], rowCount: 0 });
              });

            const count = await service.checkAllProjectsForDelays();

            // Property: Should return count of projects checked
            expect(count).toBe(project_ids.length);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
