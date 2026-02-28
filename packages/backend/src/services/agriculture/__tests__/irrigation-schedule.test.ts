/**
 * Unit tests for Irrigation Schedule Service
 */

import {
  IrrigationScheduleService,
  IrrigationScheduleInput,
  WeatherForecast,
  IrrigationEvent
} from '../irrigation-schedule';

describe('IrrigationScheduleService', () => {
  let service: IrrigationScheduleService;

  beforeEach(() => {
    service = new IrrigationScheduleService();
  });

  describe('generateSchedule', () => {
    it('should generate irrigation schedule for rice crop', () => {
      const input: IrrigationScheduleInput = {
        cropId: 'crop-001',
        cropName: 'rice',
        growthStage: 'Vegetative Growth',
        soilType: 'loamy',
        irrigationType: 'flood',
        landArea: 2,
        plantingDate: new Date('2024-06-01'),
        location: {
          latitude: 28.6139,
          longitude: 77.2090,
          region: 'north'
        }
      };

      const schedule = service.generateSchedule(input);

      expect(schedule.cropId).toBe('crop-001');
      expect(schedule.cropName).toBe('rice');
      expect(schedule.soilType).toBe('loamy');
      expect(schedule.irrigationType).toBe('flood');
      expect(schedule.events.length).toBeGreaterThan(0);
      expect(schedule.totalWaterRequired).toBeGreaterThan(0);
      expect(schedule.efficiency).toBe(60); // Flood irrigation efficiency
      expect(schedule.recommendations.length).toBeGreaterThan(0);
    });

    it('should generate schedule with drip irrigation', () => {
      const input: IrrigationScheduleInput = {
        cropId: 'crop-002',
        cropName: 'cotton',
        growthStage: 'Flowering & Boll Formation',
        soilType: 'black',
        irrigationType: 'drip',
        landArea: 1.5,
        plantingDate: new Date('2024-05-15'),
        location: {
          latitude: 21.1458,
          longitude: 79.0882,
          region: 'central'
        }
      };

      const schedule = service.generateSchedule(input);

      expect(schedule.irrigationType).toBe('drip');
      expect(schedule.efficiency).toBe(90); // Drip irrigation efficiency
      expect(schedule.events.every(e => e.method === 'drip')).toBe(true);
    });

    it('should generate schedule with sprinkler irrigation', () => {
      const input: IrrigationScheduleInput = {
        cropId: 'crop-003',
        cropName: 'wheat',
        growthStage: 'Tillering',
        soilType: 'sandy',
        irrigationType: 'sprinkler',
        landArea: 3,
        plantingDate: new Date('2024-11-01'),
        location: {
          latitude: 30.7333,
          longitude: 76.7794,
          region: 'north'
        }
      };

      const schedule = service.generateSchedule(input);

      expect(schedule.irrigationType).toBe('sprinkler');
      expect(schedule.efficiency).toBe(75); // Sprinkler irrigation efficiency
      expect(schedule.events.every(e => e.method === 'sprinkler')).toBe(true);
    });

    it('should generate events spanning 30 days', () => {
      const input: IrrigationScheduleInput = {
        cropId: 'crop-004',
        cropName: 'maize',
        growthStage: 'Vegetative Growth',
        soilType: 'loamy',
        irrigationType: 'drip',
        landArea: 2,
        plantingDate: new Date('2024-07-01'),
        location: {
          latitude: 28.6139,
          longitude: 77.2090,
          region: 'north'
        }
      };

      const schedule = service.generateSchedule(input);
      const firstEvent = schedule.events[0];
      const lastEvent = schedule.events[schedule.events.length - 1];

      const daysDiff = Math.floor(
        (lastEvent.scheduledDate.getTime() - firstEvent.scheduledDate.getTime()) / 
        (1000 * 60 * 60 * 24)
      );

      expect(daysDiff).toBeLessThanOrEqual(30);
    });

    it('should include next irrigation event', () => {
      const input: IrrigationScheduleInput = {
        cropId: 'crop-005',
        cropName: 'rice',
        growthStage: 'Reproductive Stage',
        soilType: 'clay',
        irrigationType: 'flood',
        landArea: 2,
        plantingDate: new Date('2024-06-01'),
        location: {
          latitude: 28.6139,
          longitude: 77.2090,
          region: 'north'
        }
      };

      const schedule = service.generateSchedule(input);

      if (schedule.nextIrrigation) {
        expect(schedule.nextIrrigation.status).toBe('scheduled');
        expect(schedule.nextIrrigation.scheduledDate.getTime()).toBeGreaterThan(Date.now());
      }
    });
  });

  describe('adjustForWeather', () => {
    it('should skip irrigation when rainfall exceeds 10mm within 48 hours', () => {
      const events: IrrigationEvent[] = [
        {
          id: 'IRR-001',
          scheduledDate: new Date('2024-03-15'),
          amount: 50,
          duration: 120,
          method: 'flood',
          status: 'scheduled',
          reason: 'Regular irrigation'
        }
      ];

      const forecast: WeatherForecast[] = [
        {
          date: new Date('2024-03-14'),
          rainfall: 8,
          temperature: { min: 20, max: 30 },
          humidity: 70
        },
        {
          date: new Date('2024-03-15'),
          rainfall: 5,
          temperature: { min: 22, max: 32 },
          humidity: 75
        }
      ];

      service.adjustForWeather(events, forecast);

      expect(events[0].status).toBe('skipped');
      expect(events[0].reason).toContain('rainfall forecast');
    });

    it('should reduce irrigation when rainfall is 5-10mm', () => {
      const events: IrrigationEvent[] = [
        {
          id: 'IRR-002',
          scheduledDate: new Date('2024-03-20'),
          amount: 60,
          duration: 150,
          method: 'sprinkler',
          status: 'scheduled',
          reason: 'Regular irrigation'
        }
      ];

      const forecast: WeatherForecast[] = [
        {
          date: new Date('2024-03-19'),
          rainfall: 3,
          temperature: { min: 18, max: 28 },
          humidity: 65
        },
        {
          date: new Date('2024-03-20'),
          rainfall: 4,
          temperature: { min: 20, max: 30 },
          humidity: 70
        }
      ];

      const originalAmount = events[0].amount;
      service.adjustForWeather(events, forecast);

      expect(events[0].status).toBe('adjusted');
      expect(events[0].amount).toBe(originalAmount * 0.5);
      expect(events[0].reason).toContain('Reduced by 50%');
    });

    it('should increase irrigation for high evapotranspiration', () => {
      const events: IrrigationEvent[] = [
        {
          id: 'IRR-003',
          scheduledDate: new Date('2024-05-10'),
          amount: 50,
          duration: 120,
          method: 'drip',
          status: 'scheduled',
          reason: 'Regular irrigation'
        }
      ];

      const forecast: WeatherForecast[] = [
        {
          date: new Date('2024-05-09'),
          rainfall: 0,
          temperature: { min: 30, max: 42 },
          humidity: 30,
          evapotranspiration: 9
        },
        {
          date: new Date('2024-05-10'),
          rainfall: 0,
          temperature: { min: 32, max: 44 },
          humidity: 25,
          evapotranspiration: 10
        }
      ];

      const originalAmount = events[0].amount;
      service.adjustForWeather(events, forecast);

      expect(events[0].status).toBe('adjusted');
      expect(events[0].amount).toBe(originalAmount * 1.2);
      expect(events[0].reason).toContain('high evapotranspiration');
    });

    it('should not adjust events that are already completed', () => {
      const events: IrrigationEvent[] = [
        {
          id: 'IRR-004',
          scheduledDate: new Date('2024-03-01'),
          amount: 50,
          duration: 120,
          method: 'flood',
          status: 'completed',
          reason: 'Regular irrigation',
          actualDate: new Date('2024-03-01'),
          actualAmount: 50
        }
      ];

      const forecast: WeatherForecast[] = [
        {
          date: new Date('2024-03-01'),
          rainfall: 15,
          temperature: { min: 20, max: 30 },
          humidity: 80
        }
      ];

      service.adjustForWeather(events, forecast);

      expect(events[0].status).toBe('completed');
      expect(events[0].amount).toBe(50);
    });
  });

  describe('recordIrrigationEvent', () => {
    it('should record actual irrigation event', () => {
      const input: IrrigationScheduleInput = {
        cropId: 'crop-006',
        cropName: 'wheat',
        growthStage: 'Jointing & Booting',
        soilType: 'loamy',
        irrigationType: 'sprinkler',
        landArea: 2,
        plantingDate: new Date('2024-11-01'),
        location: {
          latitude: 28.6139,
          longitude: 77.2090,
          region: 'north'
        }
      };

      const schedule = service.generateSchedule(input);
      const eventId = schedule.events[0].id;
      const actualDate = new Date();
      const actualAmount = 45;

      const updatedSchedule = service.recordIrrigationEvent(
        schedule,
        eventId,
        actualDate,
        actualAmount,
        'Completed as scheduled'
      );

      const event = updatedSchedule.events.find(e => e.id === eventId);
      expect(event?.status).toBe('completed');
      expect(event?.actualDate).toEqual(actualDate);
      expect(event?.actualAmount).toBe(actualAmount);
      expect(event?.notes).toBe('Completed as scheduled');
    });

    it('should throw error for non-existent event', () => {
      const input: IrrigationScheduleInput = {
        cropId: 'crop-007',
        cropName: 'rice',
        growthStage: 'Vegetative Growth',
        soilType: 'clay',
        irrigationType: 'flood',
        landArea: 2,
        plantingDate: new Date('2024-06-01'),
        location: {
          latitude: 28.6139,
          longitude: 77.2090,
          region: 'north'
        }
      };

      const schedule = service.generateSchedule(input);

      expect(() => {
        service.recordIrrigationEvent(
          schedule,
          'NON-EXISTENT-ID',
          new Date(),
          50
        );
      }).toThrow('Irrigation event NON-EXISTENT-ID not found');
    });
  });

  describe('calculateMetrics', () => {
    it('should calculate water usage metrics correctly', () => {
      const input: IrrigationScheduleInput = {
        cropId: 'crop-008',
        cropName: 'cotton',
        growthStage: 'Vegetative Growth',
        soilType: 'black',
        irrigationType: 'drip',
        landArea: 2,
        plantingDate: new Date('2024-05-01'),
        location: {
          latitude: 21.1458,
          longitude: 79.0882,
          region: 'central'
        }
      };

      const schedule = service.generateSchedule(input);

      // Simulate some completed and skipped events
      if (schedule.events.length > 0) {
        schedule.events[0].status = 'completed';
        schedule.events[0].actualAmount = schedule.events[0].amount;
      }
      if (schedule.events.length > 1) {
        schedule.events[1].status = 'skipped';
      }

      const metrics = service.calculateMetrics(schedule);

      expect(metrics.eventsCompleted).toBeGreaterThanOrEqual(0);
      expect(metrics.eventsSkipped).toBeGreaterThanOrEqual(0);
      expect(metrics.totalScheduled).toBeGreaterThanOrEqual(0);
      expect(metrics.efficiency).toBeGreaterThanOrEqual(0);
      expect(metrics.complianceRate).toBeGreaterThanOrEqual(0);
      expect(metrics.complianceRate).toBeLessThanOrEqual(100);
    });

    it('should calculate water savings from skipped events', () => {
      const input: IrrigationScheduleInput = {
        cropId: 'crop-009',
        cropName: 'maize',
        growthStage: 'Tasseling & Silking',
        soilType: 'loamy',
        irrigationType: 'sprinkler',
        landArea: 3,
        plantingDate: new Date('2024-07-01'),
        location: {
          latitude: 28.6139,
          longitude: 77.2090,
          region: 'north'
        }
      };

      const schedule = service.generateSchedule(input);

      // Skip some events
      schedule.events.forEach((event, index) => {
        if (index % 2 === 0) {
          event.status = 'skipped';
        }
      });

      const metrics = service.calculateMetrics(schedule);

      expect(metrics.waterSaved).toBeGreaterThan(0);
      expect(metrics.costSavings).toBeGreaterThan(0);
    });
  });

  describe('getUpcomingEvents', () => {
    it('should return events in next 7 days', () => {
      const input: IrrigationScheduleInput = {
        cropId: 'crop-010',
        cropName: 'rice',
        growthStage: 'Reproductive Stage',
        soilType: 'loamy',
        irrigationType: 'flood',
        landArea: 2,
        plantingDate: new Date('2024-06-01'),
        location: {
          latitude: 28.6139,
          longitude: 77.2090,
          region: 'north'
        }
      };

      const schedule = service.generateSchedule(input);
      const upcomingEvents = service.getUpcomingEvents(schedule);

      const now = new Date();
      const sevenDaysLater = new Date();
      sevenDaysLater.setDate(sevenDaysLater.getDate() + 7);

      upcomingEvents.forEach(event => {
        expect(event.scheduledDate.getTime()).toBeGreaterThanOrEqual(now.getTime());
        expect(event.scheduledDate.getTime()).toBeLessThanOrEqual(sevenDaysLater.getTime());
        expect(event.status).toBe('scheduled');
      });
    });
  });

  describe('getOverdueEvents', () => {
    it('should return overdue scheduled events', () => {
      const input: IrrigationScheduleInput = {
        cropId: 'crop-011',
        cropName: 'wheat',
        growthStage: 'Grain Filling',
        soilType: 'loamy',
        irrigationType: 'sprinkler',
        landArea: 2,
        plantingDate: new Date('2024-11-01'),
        location: {
          latitude: 28.6139,
          longitude: 77.2090,
          region: 'north'
        }
      };

      const schedule = service.generateSchedule(input);

      // Manually set some events to past dates
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 5);
      if (schedule.events.length > 0) {
        schedule.events[0].scheduledDate = pastDate;
      }

      const overdueEvents = service.getOverdueEvents(schedule);

      const now = new Date();
      overdueEvents.forEach(event => {
        expect(event.scheduledDate.getTime()).toBeLessThan(now.getTime());
        expect(event.status).toBe('scheduled');
      });
    });
  });

  describe('updateScheduleWithForecast', () => {
    it('should update schedule with new weather forecast', () => {
      const input: IrrigationScheduleInput = {
        cropId: 'crop-012',
        cropName: 'cotton',
        growthStage: 'Boll Development',
        soilType: 'black',
        irrigationType: 'drip',
        landArea: 2,
        plantingDate: new Date('2024-05-01'),
        location: {
          latitude: 21.1458,
          longitude: 79.0882,
          region: 'central'
        }
      };

      const schedule = service.generateSchedule(input);
      const originalLastUpdated = schedule.lastUpdated;

      // Wait a bit to ensure time difference
      const newForecast: WeatherForecast[] = [
        {
          date: new Date(Date.now() + 24 * 60 * 60 * 1000),
          rainfall: 15,
          temperature: { min: 22, max: 32 },
          humidity: 80
        }
      ];

      const updatedSchedule = service.updateScheduleWithForecast(schedule, newForecast);

      expect(updatedSchedule.lastUpdated.getTime()).toBeGreaterThanOrEqual(originalLastUpdated.getTime());
    });
  });

  describe('edge cases', () => {
    it('should handle unknown crop with default water requirements', () => {
      const input: IrrigationScheduleInput = {
        cropId: 'crop-013',
        cropName: 'unknown-crop',
        growthStage: 'Vegetative Growth',
        soilType: 'loamy',
        irrigationType: 'drip',
        landArea: 2,
        plantingDate: new Date('2024-06-01'),
        location: {
          latitude: 28.6139,
          longitude: 77.2090,
          region: 'north'
        }
      };

      const schedule = service.generateSchedule(input);

      expect(schedule.events.length).toBeGreaterThan(0);
      expect(schedule.totalWaterRequired).toBeGreaterThan(0);
    });

    it('should handle rainfed irrigation type', () => {
      const input: IrrigationScheduleInput = {
        cropId: 'crop-014',
        cropName: 'rice',
        growthStage: 'Vegetative Growth',
        soilType: 'loamy',
        irrigationType: 'rainfed',
        landArea: 2,
        plantingDate: new Date('2024-06-01'),
        location: {
          latitude: 28.6139,
          longitude: 77.2090,
          region: 'north'
        }
      };

      const schedule = service.generateSchedule(input);

      expect(schedule.irrigationType).toBe('rainfed');
      expect(schedule.events.length).toBeGreaterThan(0);
    });

    it('should handle small land area', () => {
      const input: IrrigationScheduleInput = {
        cropId: 'crop-015',
        cropName: 'wheat',
        growthStage: 'Tillering',
        soilType: 'sandy',
        irrigationType: 'drip',
        landArea: 0.5,
        plantingDate: new Date('2024-11-01'),
        location: {
          latitude: 28.6139,
          longitude: 77.2090,
          region: 'north'
        }
      };

      const schedule = service.generateSchedule(input);

      expect(schedule.landArea).toBe(0.5);
      expect(schedule.events.length).toBeGreaterThan(0);
    });

    it('should handle large land area', () => {
      const input: IrrigationScheduleInput = {
        cropId: 'crop-016',
        cropName: 'maize',
        growthStage: 'Vegetative Growth',
        soilType: 'loamy',
        irrigationType: 'sprinkler',
        landArea: 50,
        plantingDate: new Date('2024-07-01'),
        location: {
          latitude: 28.6139,
          longitude: 77.2090,
          region: 'north'
        }
      };

      const schedule = service.generateSchedule(input);

      expect(schedule.landArea).toBe(50);
      expect(schedule.events.length).toBeGreaterThan(0);
    });
  });

  describe('recommendations', () => {
    it('should provide irrigation method recommendations', () => {
      const input: IrrigationScheduleInput = {
        cropId: 'crop-017',
        cropName: 'rice',
        growthStage: 'Vegetative Growth',
        soilType: 'loamy',
        irrigationType: 'flood',
        landArea: 2,
        plantingDate: new Date('2024-06-01'),
        location: {
          latitude: 28.6139,
          longitude: 77.2090,
          region: 'north'
        }
      };

      const schedule = service.generateSchedule(input);

      expect(schedule.recommendations.length).toBeGreaterThan(0);
      expect(schedule.recommendations.some(r => 
        r.includes('drip') || r.includes('sprinkler')
      )).toBe(true);
    });

    it('should provide soil-specific recommendations', () => {
      const input: IrrigationScheduleInput = {
        cropId: 'crop-018',
        cropName: 'cotton',
        growthStage: 'Vegetative Growth',
        soilType: 'sandy',
        irrigationType: 'drip',
        landArea: 2,
        plantingDate: new Date('2024-05-01'),
        location: {
          latitude: 21.1458,
          longitude: 79.0882,
          region: 'central'
        }
      };

      const schedule = service.generateSchedule(input);

      expect(schedule.recommendations.some(r => 
        r.toLowerCase().includes('sandy')
      )).toBe(true);
    });

    it('should provide critical stage recommendations', () => {
      const input: IrrigationScheduleInput = {
        cropId: 'crop-019',
        cropName: 'wheat',
        growthStage: 'Flowering & Grain Formation',
        soilType: 'loamy',
        irrigationType: 'sprinkler',
        landArea: 2,
        plantingDate: new Date('2024-11-01'),
        location: {
          latitude: 28.6139,
          longitude: 77.2090,
          region: 'north'
        }
      };

      const schedule = service.generateSchedule(input);

      expect(schedule.recommendations.some(r => 
        r.toLowerCase().includes('critical')
      )).toBe(true);
    });
  });
});
