/**
 * Property-Based Tests for Irrigation Schedule Service
 * Feature: ruralconnect-ai
 */

import fc from 'fast-check';
import {
  IrrigationScheduleService,
  IrrigationScheduleInput,
  WeatherForecast,
  IrrigationEvent
} from '../irrigation-schedule';

describe('IrrigationScheduleService - Property-Based Tests', () => {
  let service: IrrigationScheduleService;

  beforeEach(() => {
    service = new IrrigationScheduleService();
  });

  /**
   * Property 13: Irrigation Schedule Adjustment
   * For any irrigation schedule, when rainfall forecast exceeds 10mm within 48 hours,
   * the next scheduled irrigation event should be skipped or reduced
   * 
   * **Validates: Requirements 4.7**
   */
  describe('Property 13: Irrigation Schedule Adjustment', () => {
    it('should skip or reduce irrigation when rainfall exceeds 10mm within 48 hours', () => {
      fc.assert(
        fc.property(
          // Generate arbitrary irrigation event
          fc.record({
            id: fc.string({ minLength: 5, maxLength: 20 }),
            scheduledDate: fc.date({ min: new Date('2024-01-01'), max: new Date('2024-12-31') }),
            amount: fc.float({ min: 20, max: 100, noNaN: true }),
            duration: fc.integer({ min: 30, max: 300 }),
            method: fc.constantFrom('flood' as const, 'drip' as const, 'sprinkler' as const),
            status: fc.constant('scheduled' as const),
            reason: fc.constant('Regular irrigation')
          }),
          // Generate rainfall amount that exceeds 10mm
          fc.float({ min: Math.fround(10.1), max: 100, noNaN: true }),
          (event, totalRainfall) => {
            // Distribute rainfall across 2 days within 48-hour window
            const day1Rainfall = totalRainfall * 0.6;
            const day2Rainfall = totalRainfall * 0.4;
            
            const forecast: WeatherForecast[] = [
              {
                date: new Date(event.scheduledDate.getTime() - 24 * 60 * 60 * 1000),
                rainfall: day1Rainfall,
                temperature: { min: 20, max: 30 },
                humidity: 70
              },
              {
                date: event.scheduledDate,
                rainfall: day2Rainfall,
                temperature: { min: 22, max: 32 },
                humidity: 75
              }
            ];
            
            const events: IrrigationEvent[] = [{ ...event }];
            const originalAmount = event.amount;
            
            service.adjustForWeather(events, forecast);
            
            const adjustedEvent = events[0];
            
            // Property: Event should be skipped or reduced
            const isSkipped = adjustedEvent.status === 'skipped';
            const isReduced = adjustedEvent.status === 'adjusted' && adjustedEvent.amount < originalAmount;
            
            // When rainfall > 10mm, event must be skipped or reduced
            expect(isSkipped || isReduced).toBe(true);
            
            // If skipped, reason should mention rainfall
            if (isSkipped) {
              expect(adjustedEvent.reason).toContain('rainfall');
              // Check that reason contains a rainfall amount (don't check exact value due to floating point)
              expect(adjustedEvent.reason).toMatch(/\d+\.\d+mm/);
            }
            
            // If reduced, amount should be less than original
            if (isReduced) {
              expect(adjustedEvent.amount).toBeLessThan(originalAmount);
              expect(adjustedEvent.reason).toContain('rainfall');
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should not skip irrigation when rainfall is below 5mm within 48 hours', () => {
      fc.assert(
        fc.property(
          fc.record({
            id: fc.string({ minLength: 5, maxLength: 20 }),
            scheduledDate: fc.date({ min: new Date('2024-01-01'), max: new Date('2024-12-31') }),
            amount: fc.float({ min: 20, max: 100 }),
            duration: fc.integer({ min: 30, max: 300 }),
            method: fc.constantFrom('flood' as const, 'drip' as const, 'sprinkler' as const),
            status: fc.constant('scheduled' as const),
            reason: fc.constant('Regular irrigation')
          }),
          // Generate rainfall amount below 5mm (should not trigger any adjustment)
          fc.float({ min: 0, max: 5 }),
          (event, totalRainfall) => {
            const forecast: WeatherForecast[] = [
              {
                date: new Date(event.scheduledDate.getTime() - 24 * 60 * 60 * 1000),
                rainfall: totalRainfall * 0.5,
                temperature: { min: 20, max: 30 },
                humidity: 60
              },
              {
                date: event.scheduledDate,
                rainfall: totalRainfall * 0.5,
                temperature: { min: 22, max: 32 },
                humidity: 65
              }
            ];
            
            const events: IrrigationEvent[] = [event];
            const originalAmount = event.amount;
            
            service.adjustForWeather(events, forecast);
            
            const adjustedEvent = events[0];
            
            // Property: Event should remain scheduled with original amount
            expect(adjustedEvent.status).toBe('scheduled');
            expect(adjustedEvent.amount).toBe(originalAmount);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should reduce irrigation by 50% when rainfall is between 5-10mm', () => {
      fc.assert(
        fc.property(
          fc.record({
            id: fc.string({ minLength: 5, maxLength: 20 }),
            scheduledDate: fc.date({ min: new Date('2024-01-01'), max: new Date('2024-12-31') }),
            amount: fc.float({ min: 20, max: 100, noNaN: true }),
            duration: fc.integer({ min: 30, max: 300 }),
            method: fc.constantFrom('flood' as const, 'drip' as const, 'sprinkler' as const),
            status: fc.constant('scheduled' as const),
            reason: fc.constant('Regular irrigation')
          }),
          // Generate rainfall amount between 5-10mm
          fc.float({ min: Math.fround(5.1), max: 10, noNaN: true }),
          (event, totalRainfall) => {
            const forecast: WeatherForecast[] = [
              {
                date: new Date(event.scheduledDate.getTime() - 24 * 60 * 60 * 1000),
                rainfall: totalRainfall * 0.6,
                temperature: { min: 20, max: 30 },
                humidity: 65
              },
              {
                date: event.scheduledDate,
                rainfall: totalRainfall * 0.4,
                temperature: { min: 22, max: 32 },
                humidity: 70
              }
            ];
            
            const events: IrrigationEvent[] = [{ ...event }];
            const originalAmount = event.amount;
            
            service.adjustForWeather(events, forecast);
            
            const adjustedEvent = events[0];
            
            // Property: Event should be adjusted with 50% reduction
            expect(adjustedEvent.status).toBe('adjusted');
            expect(adjustedEvent.amount).toBeCloseTo(originalAmount * 0.5, 5);
            expect(adjustedEvent.reason).toContain('Reduced by 50%');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle exactly 10mm rainfall boundary correctly', () => {
      fc.assert(
        fc.property(
          fc.record({
            id: fc.string({ minLength: 5, maxLength: 20 }),
            scheduledDate: fc.date({ min: new Date('2024-01-01'), max: new Date('2024-12-31') }),
            amount: fc.float({ min: 20, max: 100 }),
            duration: fc.integer({ min: 30, max: 300 }),
            method: fc.constantFrom('flood' as const, 'drip' as const, 'sprinkler' as const),
            status: fc.constant('scheduled' as const),
            reason: fc.constant('Regular irrigation')
          }),
          (event) => {
            // Test exactly 10mm rainfall
            const forecast: WeatherForecast[] = [
              {
                date: new Date(event.scheduledDate.getTime() - 24 * 60 * 60 * 1000),
                rainfall: 6,
                temperature: { min: 20, max: 30 },
                humidity: 65
              },
              {
                date: event.scheduledDate,
                rainfall: 4,
                temperature: { min: 22, max: 32 },
                humidity: 70
              }
            ];
            
            const events: IrrigationEvent[] = [event];
            const originalAmount = event.amount;
            
            service.adjustForWeather(events, forecast);
            
            const adjustedEvent = events[0];
            
            // Property: At exactly 10mm, should be reduced but not skipped
            // (based on implementation: > 10mm skips, 5-10mm reduces)
            expect(adjustedEvent.status).toBe('adjusted');
            expect(adjustedEvent.amount).toBe(originalAmount * 0.5);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should correctly apply 48-hour window (before and after event)', () => {
      fc.assert(
        fc.property(
          fc.record({
            id: fc.string({ minLength: 5, maxLength: 20 }),
            scheduledDate: fc.date({ min: new Date('2024-06-15'), max: new Date('2024-06-15') }),
            amount: fc.float({ min: 20, max: 100 }),
            duration: fc.integer({ min: 30, max: 300 }),
            method: fc.constantFrom('flood' as const, 'drip' as const, 'sprinkler' as const),
            status: fc.constant('scheduled' as const),
            reason: fc.constant('Regular irrigation')
          }),
          fc.float({ min: 11, max: 50, noNaN: true }),
          (event, rainfall) => {
            // Test rainfall within 48-hour window (2 days before to 2 days after)
            const eventDate = new Date('2024-06-15T12:00:00');
            event.scheduledDate = eventDate;
            
            // Rainfall 1 day before event (within 48-hour window)
            const forecast1: WeatherForecast[] = [
              {
                date: new Date('2024-06-14T12:00:00'),
                rainfall: rainfall,
                temperature: { min: 20, max: 30 },
                humidity: 70
              }
            ];
            
            const events1: IrrigationEvent[] = [{ ...event }];
            service.adjustForWeather(events1, forecast1);
            
            // Property: Should be skipped due to rainfall within 48 hours
            expect(events1[0].status).toBe('skipped');
            
            // Rainfall 1 day after event (within 48-hour window)
            const forecast2: WeatherForecast[] = [
              {
                date: new Date('2024-06-16T12:00:00'),
                rainfall: rainfall,
                temperature: { min: 20, max: 30 },
                humidity: 70
              }
            ];
            
            const events2: IrrigationEvent[] = [{ ...event, status: 'scheduled' as const }];
            service.adjustForWeather(events2, forecast2);
            
            // Property: Should be skipped due to rainfall within 48 hours
            expect(events2[0].status).toBe('skipped');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should not adjust irrigation for rainfall outside 48-hour window', () => {
      fc.assert(
        fc.property(
          fc.record({
            id: fc.string({ minLength: 5, maxLength: 20 }),
            scheduledDate: fc.date({ min: new Date('2024-06-15'), max: new Date('2024-06-15') }),
            amount: fc.float({ min: 20, max: 100 }),
            duration: fc.integer({ min: 30, max: 300 }),
            method: fc.constantFrom('flood' as const, 'drip' as const, 'sprinkler' as const),
            status: fc.constant('scheduled' as const),
            reason: fc.constant('Regular irrigation')
          }),
          fc.float({ min: 15, max: 50 }),
          (event, rainfall) => {
            const eventDate = new Date('2024-06-15T12:00:00');
            event.scheduledDate = eventDate;
            
            // Rainfall 3 days before event (outside 48-hour window)
            const forecast: WeatherForecast[] = [
              {
                date: new Date('2024-06-12T12:00:00'),
                rainfall: rainfall,
                temperature: { min: 20, max: 30 },
                humidity: 70
              },
              {
                date: new Date('2024-06-18T12:00:00'),
                rainfall: rainfall,
                temperature: { min: 20, max: 30 },
                humidity: 70
              }
            ];
            
            const events: IrrigationEvent[] = [event];
            const originalAmount = event.amount;
            
            service.adjustForWeather(events, forecast);
            
            // Property: Should remain scheduled since rainfall is outside 48-hour window
            expect(events[0].status).toBe('scheduled');
            expect(events[0].amount).toBe(originalAmount);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle multiple events in schedule independently', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              id: fc.string({ minLength: 5, maxLength: 20 }),
              scheduledDate: fc.date({ min: new Date('2024-01-01'), max: new Date('2024-12-31') }),
              amount: fc.float({ min: 20, max: 100 }),
              duration: fc.integer({ min: 30, max: 300 }),
              method: fc.constantFrom('flood' as const, 'drip' as const, 'sprinkler' as const),
              status: fc.constant('scheduled' as const),
              reason: fc.constant('Regular irrigation')
            }),
            { minLength: 3, maxLength: 10 }
          ),
          (events) => {
            // Sort events by date
            events.sort((a, b) => a.scheduledDate.getTime() - b.scheduledDate.getTime());
            
            // Create forecast with high rainfall only around first event
            const firstEventDate = events[0].scheduledDate;
            const forecast: WeatherForecast[] = [
              {
                date: new Date(firstEventDate.getTime() - 24 * 60 * 60 * 1000),
                rainfall: 15,
                temperature: { min: 20, max: 30 },
                humidity: 70
              },
              {
                date: firstEventDate,
                rainfall: 5,
                temperature: { min: 22, max: 32 },
                humidity: 75
              }
            ];
            
            const eventsCopy = events.map(e => ({ ...e }));
            service.adjustForWeather(eventsCopy, forecast);
            
            // Property: Only first event should be affected
            expect(eventsCopy[0].status).toBe('skipped');
            
            // Property: Other events should remain scheduled (if far enough from first event)
            for (let i = 1; i < eventsCopy.length; i++) {
              const daysDiff = Math.abs(
                (eventsCopy[i].scheduledDate.getTime() - firstEventDate.getTime()) / 
                (24 * 60 * 60 * 1000)
              );
              
              if (daysDiff > 2) {
                expect(eventsCopy[i].status).toBe('scheduled');
              }
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should maintain proper irrigation frequency after adjustments', () => {
      fc.assert(
        fc.property(
          fc.record({
            cropId: fc.string({ minLength: 5, maxLength: 20 }),
            cropName: fc.constantFrom('rice', 'wheat', 'cotton', 'maize'),
            growthStage: fc.constantFrom('Vegetative Growth', 'Reproductive Stage'),
            soilType: fc.constantFrom('loamy' as const, 'clay' as const, 'black' as const),
            irrigationType: fc.constantFrom('drip' as const, 'sprinkler' as const),
            landArea: fc.float({ min: 1, max: 10 }),
            plantingDate: fc.date({ min: new Date('2024-01-01'), max: new Date('2024-12-31') }),
            location: fc.record({
              latitude: fc.float({ min: 8, max: 35 }),
              longitude: fc.float({ min: 68, max: 97 }),
              region: fc.constantFrom('north', 'south', 'central')
            })
          }),
          (input: IrrigationScheduleInput) => {
            // Generate schedule with weather forecast
            const forecast: WeatherForecast[] = [];
            const startDate = new Date();
            
            for (let i = 0; i < 30; i++) {
              const date = new Date(startDate);
              date.setDate(date.getDate() + i);
              
              // Add high rainfall on days 5, 15, 25
              const rainfall = (i === 5 || i === 15 || i === 25) ? 20 : 2;
              
              forecast.push({
                date,
                rainfall,
                temperature: { min: 20, max: 30 },
                humidity: 70
              });
            }
            
            input.weatherForecast = forecast;
            const schedule = service.generateSchedule(input);
            
            // Property: Should have both scheduled and skipped events
            const scheduledEvents = schedule.events.filter(e => e.status === 'scheduled');
            const skippedEvents = schedule.events.filter(e => e.status === 'skipped');
            
            expect(scheduledEvents.length).toBeGreaterThan(0);
            expect(skippedEvents.length).toBeGreaterThan(0);
            
            // Property: Total events should be reasonable for 30-day period
            expect(schedule.events.length).toBeGreaterThan(0);
            expect(schedule.events.length).toBeLessThan(31);
            
            // Property: Skipped events should have rainfall-related reasons
            skippedEvents.forEach(event => {
              expect(event.reason).toContain('rainfall');
            });
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Additional Property: Schedule Generation Consistency
   * For any valid input, the generated schedule should have consistent properties
   */
  describe('Schedule Generation Consistency', () => {
    it('should generate schedules with valid event dates and amounts', () => {
      fc.assert(
        fc.property(
          fc.record({
            cropId: fc.string({ minLength: 5, maxLength: 20 }),
            cropName: fc.constantFrom('rice', 'wheat', 'cotton', 'maize'),
            growthStage: fc.constantFrom(
              'Vegetative Growth',
              'Reproductive Stage',
              'Flowering',
              'Maturation'
            ),
            soilType: fc.constantFrom('sandy' as const, 'loamy' as const, 'clay' as const, 'silt' as const, 'red' as const, 'black' as const, 'alluvial' as const),
            irrigationType: fc.constantFrom('flood' as const, 'drip' as const, 'sprinkler' as const, 'rainfed' as const),
            landArea: fc.float({ min: 0.5, max: 50, noNaN: true }),
            plantingDate: fc.date({ min: new Date('2024-01-01'), max: new Date('2024-12-31') }),
            location: fc.record({
              latitude: fc.float({ min: 8, max: 35 }),
              longitude: fc.float({ min: 68, max: 97 }),
              region: fc.constantFrom('north', 'south', 'east', 'west', 'central')
            })
          }),
          (input: IrrigationScheduleInput) => {
            const schedule = service.generateSchedule(input);
            
            // Property: All events should have valid dates
            schedule.events.forEach(event => {
              expect(event.scheduledDate).toBeInstanceOf(Date);
              expect(event.scheduledDate.getTime()).not.toBeNaN();
            });
            
            // Property: All events should have positive amounts
            schedule.events.forEach(event => {
              expect(event.amount).toBeGreaterThan(0);
            });
            
            // Property: All events should have positive durations
            schedule.events.forEach(event => {
              expect(event.duration).toBeGreaterThan(0);
            });
            
            // Property: Total water required should be positive
            expect(schedule.totalWaterRequired).toBeGreaterThan(0);
            
            // Property: Efficiency should be between 0 and 100
            expect(schedule.efficiency).toBeGreaterThan(0);
            expect(schedule.efficiency).toBeLessThanOrEqual(100);
            
            // Property: Should have at least one event
            expect(schedule.events.length).toBeGreaterThan(0);
            
            // Property: Events should be in chronological order
            for (let i = 1; i < schedule.events.length; i++) {
              expect(schedule.events[i].scheduledDate.getTime())
                .toBeGreaterThanOrEqual(schedule.events[i - 1].scheduledDate.getTime());
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should generate schedules with irrigation method matching input', () => {
      fc.assert(
        fc.property(
          fc.record({
            cropId: fc.string({ minLength: 5, maxLength: 20 }),
            cropName: fc.constantFrom('rice', 'wheat', 'cotton', 'maize'),
            growthStage: fc.constantFrom('Vegetative Growth', 'Reproductive Stage'),
            soilType: fc.constantFrom('sandy' as const, 'loamy' as const, 'clay' as const),
            irrigationType: fc.constantFrom('flood' as const, 'drip' as const, 'sprinkler' as const),
            landArea: fc.float({ min: 1, max: 10 }),
            plantingDate: fc.date({ min: new Date('2024-01-01'), max: new Date('2024-12-31') }),
            location: fc.record({
              latitude: fc.float({ min: 8, max: 35 }),
              longitude: fc.float({ min: 68, max: 97 }),
              region: fc.constantFrom('north', 'south', 'central')
            })
          }),
          (input: IrrigationScheduleInput) => {
            const schedule = service.generateSchedule(input);
            
            // Property: All events should use the specified irrigation method
            schedule.events.forEach(event => {
              expect(event.method).toBe(input.irrigationType);
            });
            
            // Property: Schedule should record the irrigation type
            expect(schedule.irrigationType).toBe(input.irrigationType);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Additional Property: Water Usage Metrics Consistency
   * For any schedule with recorded events, metrics should be consistent
   */
  describe('Water Usage Metrics Consistency', () => {
    it('should calculate metrics with valid ranges', () => {
      fc.assert(
        fc.property(
          fc.record({
            cropId: fc.string({ minLength: 5, maxLength: 20 }),
            cropName: fc.constantFrom('rice', 'wheat', 'cotton', 'maize'),
            growthStage: fc.constantFrom('Vegetative Growth', 'Reproductive Stage'),
            soilType: fc.constantFrom('loamy' as const, 'clay' as const, 'black' as const),
            irrigationType: fc.constantFrom('flood' as const, 'drip' as const, 'sprinkler' as const),
            landArea: fc.float({ min: 1, max: 10, noNaN: true }),
            plantingDate: fc.date({ min: new Date('2024-01-01'), max: new Date('2024-12-31') }),
            location: fc.record({
              latitude: fc.float({ min: 8, max: 35, noNaN: true }),
              longitude: fc.float({ min: 68, max: 97, noNaN: true }),
              region: fc.constantFrom('north', 'south', 'central')
            })
          }),
          (input: IrrigationScheduleInput) => {
            const schedule = service.generateSchedule(input);
            
            // Simulate some completed and skipped events
            schedule.events.forEach((event, index) => {
              if (index % 3 === 0) {
                event.status = 'completed';
                event.actualAmount = event.amount;
              } else if (index % 3 === 1) {
                event.status = 'skipped';
              }
            });
            
            const metrics = service.calculateMetrics(schedule);
            
            // Property: Efficiency should be non-negative
            expect(metrics.efficiency).toBeGreaterThanOrEqual(0);
            
            // Property: Compliance rate should be between 0 and 100
            expect(metrics.complianceRate).toBeGreaterThanOrEqual(0);
            expect(metrics.complianceRate).toBeLessThanOrEqual(100);
            
            // Property: Event counts should be non-negative
            expect(metrics.eventsCompleted).toBeGreaterThanOrEqual(0);
            expect(metrics.eventsSkipped).toBeGreaterThanOrEqual(0);
            expect(metrics.eventsAdjusted).toBeGreaterThanOrEqual(0);
            
            // Property: Water amounts should be non-negative
            expect(metrics.totalScheduled).toBeGreaterThanOrEqual(0);
            expect(metrics.totalApplied).toBeGreaterThanOrEqual(0);
            expect(metrics.totalSkipped).toBeGreaterThanOrEqual(0);
            expect(metrics.waterSaved).toBeGreaterThanOrEqual(0);
            
            // Property: Cost savings should be non-negative
            expect(metrics.costSavings).toBeGreaterThanOrEqual(0);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Additional Property: Event Recording Idempotency
   * Recording the same event multiple times should maintain consistency
   */
  describe('Event Recording Consistency', () => {
    it('should maintain event status after recording', () => {
      fc.assert(
        fc.property(
          fc.record({
            cropId: fc.string({ minLength: 5, maxLength: 20 }),
            cropName: fc.constantFrom('rice', 'wheat', 'cotton'),
            growthStage: fc.constantFrom('Vegetative Growth', 'Reproductive Stage'),
            soilType: fc.constantFrom('loamy' as const, 'clay' as const),
            irrigationType: fc.constantFrom('drip' as const, 'sprinkler' as const),
            landArea: fc.float({ min: 1, max: 5 }),
            plantingDate: fc.date({ min: new Date('2024-01-01'), max: new Date('2024-12-31') }),
            location: fc.record({
              latitude: fc.float({ min: 8, max: 35 }),
              longitude: fc.float({ min: 68, max: 97 }),
              region: fc.constantFrom('north', 'south')
            })
          }),
          fc.date({ min: new Date('2024-01-01'), max: new Date('2024-12-31') }),
          fc.float({ min: 20, max: 100 }),
          (input: IrrigationScheduleInput, actualDate: Date, actualAmount: number) => {
            const schedule = service.generateSchedule(input);
            
            if (schedule.events.length === 0) return;
            
            const eventId = schedule.events[0].id;
            
            const updatedSchedule = service.recordIrrigationEvent(
              schedule,
              eventId,
              actualDate,
              actualAmount,
              'Test recording'
            );
            
            const recordedEvent = updatedSchedule.events.find(e => e.id === eventId);
            
            // Property: Event should be marked as completed
            expect(recordedEvent?.status).toBe('completed');
            
            // Property: Actual date should match recorded date
            expect(recordedEvent?.actualDate).toEqual(actualDate);
            
            // Property: Actual amount should match recorded amount
            expect(recordedEvent?.actualAmount).toBe(actualAmount);
            
            // Property: Notes should be preserved
            expect(recordedEvent?.notes).toBe('Test recording');
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
