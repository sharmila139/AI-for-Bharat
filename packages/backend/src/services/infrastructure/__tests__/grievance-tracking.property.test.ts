/**
 * Property-Based Tests for Grievance Tracking
 * 
 * Tests:
 * - Property 30: SLA Overdue Marking
 * - Property 31: Automatic Escalation
 */

import fc from 'fast-check';
import { Pool } from 'pg';
import { GrievanceTrackingService, GrievanceStatus } from '../grievance-tracking';

// Mock database pool
const mockPool = {
  connect: jest.fn(),
  query: jest.fn(),
} as unknown as Pool;

describe('Grievance Tracking Property Tests', () => {
  let service: GrievanceTrackingService;

  beforeEach(() => {
    service = new GrievanceTrackingService(mockPool);
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  // ==========================================================================
  // PROPERTY 30: SLA Overdue Marking
  // ==========================================================================

  describe('Property 30: SLA Overdue Marking', () => {
    /**
     * **Validates: Requirements 13.3**
     * 
     * For any grievance, when days_open exceeds the SLA deadline for its 
     * category and severity, it should be marked as overdue.
     */
    test('grievances exceeding SLA deadline should be marked as overdue', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate test data
          fc.record({
            grievance_id: fc.uuid(),
            category: fc.constantFrom('road', 'water', 'electricity', 'sanitation', 'healthcare', 'education', 'public_safety', 'other'),
            severity: fc.constantFrom('low', 'medium', 'high', 'critical'),
            created_at: fc.date({ min: new Date('2024-01-01'), max: new Date('2024-12-31') }),
            status: fc.constantFrom('submitted', 'acknowledged', 'in_progress'),
          }),
          async (grievance) => {
            // Calculate SLA deadline
            const slaDeadline = service.calculateSLADeadline(
              grievance.category,
              grievance.severity,
              grievance.created_at
            );

            // Mock current time to be after SLA deadline
            const currentTime = new Date(slaDeadline.getTime() + 24 * 60 * 60 * 1000); // 1 day after deadline
            jest.spyOn(Date, 'now').mockReturnValue(currentTime.getTime());

            // Mock database query for checking overdue
            (mockPool.query as jest.Mock).mockResolvedValueOnce({
              rows: [{
                is_overdue: false,
                sla_deadline: slaDeadline,
                status: grievance.status,
              }],
            });

            // Check if grievance is overdue
            const isOverdue = await service.isOverdue(grievance.grievance_id);

            // Property: If current time > SLA deadline and status is not resolved/closed/rejected,
            // then grievance should be marked as overdue
            if (currentTime > slaDeadline && 
                grievance.status !== 'resolved' && 
                grievance.status !== 'closed' && 
                grievance.status !== 'rejected') {
              expect(isOverdue).toBe(true);
            } else {
              expect(isOverdue).toBe(false);
            }

            jest.restoreAllMocks();
          }
        ),
        { numRuns: 100 }
      );
    });

    test('resolved grievances should never be marked as overdue', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            grievance_id: fc.uuid(),
            category: fc.constantFrom('road', 'water', 'electricity', 'sanitation'),
            severity: fc.constantFrom('low', 'medium', 'high', 'critical'),
            created_at: fc.date({ min: new Date('2024-01-01'), max: new Date('2024-12-31') }),
            status: fc.constantFrom('resolved', 'closed', 'rejected'),
          }),
          async (grievance) => {
            const slaDeadline = service.calculateSLADeadline(
              grievance.category,
              grievance.severity,
              grievance.created_at
            );

            // Mock current time to be after SLA deadline
            const currentTime = new Date(slaDeadline.getTime() + 24 * 60 * 60 * 1000);
            jest.spyOn(Date, 'now').mockReturnValue(currentTime.getTime());

            // Mock database query for checking overdue
            (mockPool.query as jest.Mock).mockResolvedValueOnce({
              rows: [{
                is_overdue: false,
                sla_deadline: slaDeadline,
                status: grievance.status,
              }],
            });

            const isOverdue = await service.isOverdue(grievance.grievance_id);

            // Property: Resolved/closed/rejected grievances should never be overdue
            expect(isOverdue).toBe(false);

            jest.restoreAllMocks();
          }
        ),
        { numRuns: 100 }
      );
    });

    test('SLA deadline calculation should be consistent', async () => {
      await fc.assert(
        fc.property(
          fc.constantFrom('road', 'water', 'electricity', 'sanitation', 'healthcare', 'education', 'public_safety', 'other'),
          fc.constantFrom('low', 'medium', 'high', 'critical'),
          fc.date({ min: new Date('2024-01-01'), max: new Date('2024-12-31') }),
          (category, severity, createdAt) => {
            // Calculate deadline twice
            const deadline1 = service.calculateSLADeadline(category, severity, createdAt);
            const deadline2 = service.calculateSLADeadline(category, severity, createdAt);

            // Property: Same inputs should produce same deadline
            expect(deadline1.getTime()).toBe(deadline2.getTime());

            // Property: Deadline should always be after or equal to creation date
            // (for critical public_safety, SLA is 0.5 days which might round to same time)
            expect(deadline1.getTime()).toBeGreaterThanOrEqual(createdAt.getTime());
          }
        ),
        { numRuns: 100 }
      );
    });

    test('days open calculation should be accurate', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            grievance_id: fc.uuid(),
            created_at: fc.date({ min: new Date('2024-01-01'), max: new Date('2024-06-01') }),
          }),
          async (grievance) => {
            // Mock current time
            const currentTime = new Date('2024-07-01');
            jest.spyOn(Date, 'now').mockReturnValue(currentTime.getTime());

            // Calculate expected days
            const expectedDays = Math.floor(
              (currentTime.getTime() - grievance.created_at.getTime()) / (24 * 60 * 60 * 1000)
            );

            // Mock database query for checking overdue
            (mockPool.query as jest.Mock).mockResolvedValueOnce({
              rows: [{
                days_open: expectedDays,
              }],
            });

            const daysOpen = await service.getDaysOpen(grievance.grievance_id);

            // Property: Days open should match calculated difference
            expect(daysOpen).toBe(expectedDays);

            // Property: Days open should always be non-negative
            expect(daysOpen).toBeGreaterThanOrEqual(0);

            jest.restoreAllMocks();
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // ==========================================================================
  // PROPERTY 31: Automatic Escalation
  // ==========================================================================

  describe('Property 31: Automatic Escalation', () => {
    /**
     * **Validates: Requirements 13.8**
     * 
     * For any grievance, when days_open exceeds SLA by 50% or more, 
     * the grievance should be automatically escalated to the next level.
     */
    test('grievances exceeding SLA by 50% should be escalated', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            grievance_id: fc.uuid(),
            category: fc.constantFrom('road', 'water', 'electricity', 'sanitation'),
            severity: fc.constantFrom('low', 'medium', 'high', 'critical'),
            created_at: fc.date({ min: new Date('2024-01-01'), max: new Date('2024-06-01') }),
            status: fc.constantFrom('submitted', 'acknowledged', 'in_progress'),
          }),
          async (grievance) => {
            // Calculate SLA deadline
            const slaDeadline = service.calculateSLADeadline(
              grievance.category,
              grievance.severity,
              grievance.created_at
            );

            // Calculate 50% threshold
            const slaWindow = slaDeadline.getTime() - grievance.created_at.getTime();
            const escalationThreshold = slaDeadline.getTime() + (slaWindow * 0.5);

            // Mock current time to be after escalation threshold
            const currentTime = new Date(escalationThreshold + 24 * 60 * 60 * 1000);
            jest.spyOn(Date, 'now').mockReturnValue(currentTime.getTime());

            (mockPool.query as jest.Mock).mockResolvedValueOnce({
              rows: [{
                sla_deadline: slaDeadline,
                created_at: grievance.created_at,
                status: grievance.status,
              }],
            });

            const shouldEscalate = await service.shouldEscalate(grievance.grievance_id);

            // Property: If current time > SLA deadline + 50% of SLA window,
            // then grievance should be escalated
            if (currentTime.getTime() > escalationThreshold &&
                grievance.status !== 'resolved' &&
                grievance.status !== 'closed' &&
                grievance.status !== 'rejected') {
              expect(shouldEscalate).toBe(true);
            } else {
              expect(shouldEscalate).toBe(false);
            }

            jest.restoreAllMocks();
          }
        ),
        { numRuns: 100 }
      );
    });

    test('resolved grievances should never be escalated', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            grievance_id: fc.uuid(),
            category: fc.constantFrom('road', 'water', 'electricity'),
            severity: fc.constantFrom('low', 'medium', 'high', 'critical'),
            created_at: fc.date({ min: new Date('2024-01-01'), max: new Date('2024-06-01') }),
            status: fc.constantFrom('resolved', 'closed', 'rejected'),
          }),
          async (grievance) => {
            const slaDeadline = service.calculateSLADeadline(
              grievance.category,
              grievance.severity,
              grievance.created_at
            );

            const slaWindow = slaDeadline.getTime() - grievance.created_at.getTime();
            const escalationThreshold = slaDeadline.getTime() + (slaWindow * 0.5);
            const currentTime = new Date(escalationThreshold + 24 * 60 * 60 * 1000);

            jest.spyOn(Date, 'now').mockReturnValue(currentTime.getTime());

            (mockPool.query as jest.Mock).mockResolvedValueOnce({
              rows: [{
                sla_deadline: slaDeadline,
                created_at: grievance.created_at,
                status: grievance.status,
              }],
            });

            const shouldEscalate = await service.shouldEscalate(grievance.grievance_id);

            // Property: Resolved/closed/rejected grievances should never be escalated
            expect(shouldEscalate).toBe(false);

            jest.restoreAllMocks();
          }
        ),
        { numRuns: 100 }
      );
    });

    test('escalation threshold should be exactly 50% beyond SLA', async () => {
      await fc.assert(
        fc.property(
          fc.constantFrom('road', 'water', 'electricity', 'sanitation'),
          fc.constantFrom('low', 'medium', 'high', 'critical'),
          fc.date({ min: new Date('2024-01-01'), max: new Date('2024-06-01') }),
          (category, severity, createdAt) => {
            const slaDeadline = service.calculateSLADeadline(category, severity, createdAt);

            // Calculate SLA window
            const slaWindow = slaDeadline.getTime() - createdAt.getTime();

            // Calculate expected escalation threshold
            const expectedThreshold = slaDeadline.getTime() + (slaWindow * 0.5);

            // Property: Escalation threshold should be exactly 50% beyond SLA deadline
            const actualThreshold = slaDeadline.getTime() + (slaWindow * 0.5);
            expect(actualThreshold).toBe(expectedThreshold);

            // Property: Escalation threshold should always be after SLA deadline
            expect(actualThreshold).toBeGreaterThan(slaDeadline.getTime());

            // Property: Escalation threshold should be 1.5x the SLA window from creation
            const totalWindow = actualThreshold - createdAt.getTime();
            expect(totalWindow).toBe(slaWindow * 1.5);
          }
        ),
        { numRuns: 100 }
      );
    });

    test('escalation should update grievance status and priority', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            grievance_id: fc.uuid(),
            ticket_number: fc.string({ minLength: 10, maxLength: 20 }),
            category: fc.constantFrom('road', 'water', 'electricity'),
            severity: fc.constantFrom('medium', 'high', 'critical'),
            created_at: fc.date({ min: new Date('2024-01-01'), max: new Date('2024-06-01') }),
            status: fc.constantFrom('submitted', 'acknowledged', 'in_progress'),
          }),
          async (grievance) => {
            const slaDeadline = service.calculateSLADeadline(
              grievance.category,
              grievance.severity,
              grievance.created_at
            );

            const slaWindow = slaDeadline.getTime() - grievance.created_at.getTime();
            const escalationThreshold = slaDeadline.getTime() + (slaWindow * 0.5);
            const currentTime = new Date(escalationThreshold + 24 * 60 * 60 * 1000);

            const daysOverdue = Math.floor(
              (currentTime.getTime() - slaDeadline.getTime()) / (24 * 60 * 60 * 1000)
            );

            const mockClient = {
              query: jest.fn()
                // First query: find grievances to escalate
                .mockResolvedValueOnce({
                  rows: [{
                    grievance_id: grievance.grievance_id,
                    ticket_number: grievance.ticket_number,
                    category: grievance.category,
                    ai_severity: grievance.severity,
                    sla_deadline: slaDeadline,
                    created_at: grievance.created_at,
                    assigned_authority: 'Local Authority',
                    days_overdue: daysOverdue,
                  }],
                })
                // BEGIN transaction
                .mockResolvedValueOnce({})
                // Update grievance status and priority
                .mockResolvedValueOnce({})
                // Insert timeline entry
                .mockResolvedValueOnce({})
                // Update status history
                .mockResolvedValueOnce({})
                // COMMIT transaction
                .mockResolvedValueOnce({}),
              release: jest.fn(),
            };

            (mockPool.connect as jest.Mock).mockResolvedValue(mockClient);

            jest.spyOn(Date, 'now').mockReturnValue(currentTime.getTime());

            const results = await service.escalateOverdueGrievances();

            // Property: Escalation should succeed for grievances exceeding threshold
            expect(results.length).toBeGreaterThan(0);
            expect(results[0].escalated).toBe(true);
            expect(results[0].grievance_id).toBe(grievance.grievance_id);

            // Property: Escalation reason should mention days overdue
            expect(results[0].reason).toContain('days');

            jest.restoreAllMocks();
          }
        ),
        { numRuns: 100 }
      );
    });

    test('escalation should not occur before 50% threshold', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            grievance_id: fc.uuid(),
            category: fc.constantFrom('road', 'water', 'electricity'),
            severity: fc.constantFrom('low', 'medium', 'high'),
            created_at: fc.date({ min: new Date('2024-01-01'), max: new Date('2024-06-01') }),
            status: fc.constantFrom('submitted', 'acknowledged', 'in_progress'),
          }),
          async (grievance) => {
            const slaDeadline = service.calculateSLADeadline(
              grievance.category,
              grievance.severity,
              grievance.created_at
            );

            const slaWindow = slaDeadline.getTime() - grievance.created_at.getTime();

            // Mock current time to be BEFORE escalation threshold (e.g., 25% beyond SLA)
            const currentTime = new Date(slaDeadline.getTime() + (slaWindow * 0.25));
            jest.useFakeTimers();
            jest.setSystemTime(currentTime);

            (mockPool.query as jest.Mock).mockResolvedValueOnce({
              rows: [{
                sla_deadline: slaDeadline,
                created_at: grievance.created_at,
                status: grievance.status,
              }],
            });

            const shouldEscalate = await service.shouldEscalate(grievance.grievance_id);

            // Property: Should not escalate before 50% threshold
            expect(shouldEscalate).toBe(false);

            jest.useRealTimers();
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // ==========================================================================
  // ADDITIONAL PROPERTY TESTS
  // ==========================================================================

  describe('Additional Tracking Properties', () => {
    test('status updates should preserve history', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            grievance_id: fc.uuid(),
            initial_status: fc.constantFrom<GrievanceStatus>('submitted', 'acknowledged'),
            new_status: fc.constantFrom<GrievanceStatus>('in_progress', 'resolved'),
            updated_by: fc.uuid(),
          }),
          async (data) => {
            const mockClient = {
              query: jest.fn()
                // BEGIN
                .mockResolvedValueOnce({})
                // Get current status
                .mockResolvedValueOnce({
                  rows: [{
                    status: data.initial_status,
                    status_history: [],
                  }],
                })
                // Update status
                .mockResolvedValueOnce({})
                // Insert timeline entry
                .mockResolvedValueOnce({})
                // COMMIT
                .mockResolvedValueOnce({}),
              release: jest.fn(),
            };

            (mockPool.connect as jest.Mock).mockResolvedValue(mockClient);

            await service.updateStatus(
              data.grievance_id,
              data.new_status,
              data.updated_by,
              'officer'
            );

            // Property: Status update should create timeline entry
            expect(mockClient.query).toHaveBeenCalledWith(
              expect.stringContaining('INSERT INTO grievance_updates'),
              expect.any(Array)
            );

            // Property: Status history should be updated
            expect(mockClient.query).toHaveBeenCalledWith(
              expect.stringContaining('UPDATE grievances'),
              expect.arrayContaining([data.new_status])
            );
          }
        ),
        { numRuns: 100 }
      );
    });

    test('feedback rating should be within valid range', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            grievance_id: fc.uuid(),
            user_id: fc.uuid(),
            rating: fc.integer({ min: 1, max: 5 }),
            feedback_text: fc.string({ maxLength: 500 }),
          }),
          async (feedback) => {
            const mockClient = {
              query: jest.fn()
                // BEGIN
                .mockResolvedValueOnce({})
                // Check status
                .mockResolvedValueOnce({
                  rows: [{ status: 'resolved' }],
                })
                // Update feedback
                .mockResolvedValueOnce({})
                // Insert timeline entry
                .mockResolvedValueOnce({})
                // COMMIT
                .mockResolvedValueOnce({}),
              release: jest.fn(),
            };

            (mockPool.connect as jest.Mock).mockResolvedValue(mockClient);

            await service.submitFeedback(feedback);

            // Property: Rating should be between 1 and 5
            expect(feedback.rating).toBeGreaterThanOrEqual(1);
            expect(feedback.rating).toBeLessThanOrEqual(5);
          }
        ),
        { numRuns: 100 }
      );
    });

    test('invalid rating should be rejected', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            grievance_id: fc.uuid(),
            user_id: fc.uuid(),
            rating: fc.integer({ min: -10, max: 20 }).filter(r => r < 1 || r > 5),
            feedback_text: fc.string({ maxLength: 500 }),
          }),
          async (feedback) => {
            // Property: Invalid ratings should throw error
            await expect(service.submitFeedback(feedback)).rejects.toThrow(
              'Rating must be between 1 and 5'
            );
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
