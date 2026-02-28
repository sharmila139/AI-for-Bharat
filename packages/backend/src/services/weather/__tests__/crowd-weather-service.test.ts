/**
 * Unit tests for Crowd-Sourced Weather Observation Service
 */

import { 
  CrowdWeatherService, 
  ObservationSubmission
} from '../crowd-weather-service';
import { WeatherLocation } from '../weather-service';

describe('CrowdWeatherService', () => {
  let service: CrowdWeatherService;
  const testLocation: WeatherLocation = {
    latitude: 28.6139,
    longitude: 77.2090,
    name: 'New Delhi'
  };

  beforeEach(() => {
    service = new CrowdWeatherService();
  });

  describe('submitObservation', () => {
    it('should submit a valid temperature observation', async () => {
      const submission: ObservationSubmission = {
        userId: 'user1',
        location: testLocation,
        observationType: 'temperature',
        value: 32.5,
        notes: 'Measured with thermometer'
      };

      const observation = await service.submitObservation(submission);

      expect(observation.id).toBeDefined();
      expect(observation.userId).toBe('user1');
      expect(observation.observationType).toBe('temperature');
      expect(observation.value).toBe(32.5);
      expect(observation.verified).toBe(false);
      expect(observation.qualityScore).toBeGreaterThan(0);
    });

    it('should submit a general condition observation', async () => {
      const submission: ObservationSubmission = {
        userId: 'user2',
        location: testLocation,
        observationType: 'general_condition',
        condition: 'rainy',
        notes: 'Light rain observed'
      };

      const observation = await service.submitObservation(submission);

      expect(observation.condition).toBe('rainy');
      expect(observation.observationType).toBe('general_condition');
    });

    it('should give higher quality score for observations with photos', async () => {
      const withoutPhoto: ObservationSubmission = {
        userId: 'user3',
        location: testLocation,
        observationType: 'rainfall',
        value: 10
      };

      const withPhoto: ObservationSubmission = {
        userId: 'user4',
        location: testLocation,
        observationType: 'rainfall',
        value: 10,
        photoUrl: 'https://example.com/photo.jpg'
      };

      const obs1 = await service.submitObservation(withoutPhoto);
      const obs2 = await service.submitObservation(withPhoto);

      expect(obs2.qualityScore).toBeGreaterThan(obs1.qualityScore);
    });

    it('should auto-verify observations from trusted contributors', async () => {
      const submission: ObservationSubmission = {
        userId: 'trusted-user',
        location: testLocation,
        observationType: 'temperature',
        value: 30
      };

      // Submit 10 observations to become trusted
      for (let i = 0; i < 10; i++) {
        await service.submitObservation(submission);
      }

      // 11th observation should be auto-verified
      const obs = await service.submitObservation(submission);
      expect(obs.verified).toBe(true);
    });

    it('should reject observation with invalid temperature', async () => {
      const submission: ObservationSubmission = {
        userId: 'user5',
        location: testLocation,
        observationType: 'temperature',
        value: 100 // Too high
      };

      await expect(service.submitObservation(submission)).rejects.toThrow(
        'Temperature out of valid range'
      );
    });

    it('should reject observation with invalid humidity', async () => {
      const submission: ObservationSubmission = {
        userId: 'user6',
        location: testLocation,
        observationType: 'humidity',
        value: 150 // Invalid
      };

      await expect(service.submitObservation(submission)).rejects.toThrow(
        'Humidity out of valid range'
      );
    });

    it('should reject observation without location', async () => {
      const submission: ObservationSubmission = {
        userId: 'user7',
        location: {} as WeatherLocation,
        observationType: 'temperature',
        value: 25
      };

      await expect(service.submitObservation(submission)).rejects.toThrow(
        'Valid location is required'
      );
    });

    it('should reject general_condition without condition value', async () => {
      const submission: ObservationSubmission = {
        userId: 'user8',
        location: testLocation,
        observationType: 'general_condition'
      };

      await expect(service.submitObservation(submission)).rejects.toThrow(
        'Condition is required'
      );
    });
  });

  describe('getObservations', () => {
    beforeEach(async () => {
      // Submit test observations
      await service.submitObservation({
        userId: 'user1',
        location: testLocation,
        observationType: 'temperature',
        value: 30
      });

      await service.submitObservation({
        userId: 'user2',
        location: { ...testLocation, latitude: testLocation.latitude + 0.01 },
        observationType: 'rainfall',
        value: 5
      });
    });

    it('should retrieve observations within radius', () => {
      const observations = service.getObservations(testLocation, 10, 24);
      expect(observations.length).toBeGreaterThan(0);
    });

    it('should filter observations by time', async () => {
      // Submit old observation (simulate by clearing and re-adding)
      await service.submitObservation({
        userId: 'user3',
        location: testLocation,
        observationType: 'temperature',
        value: 25
      });

      const recentObs = service.getObservations(testLocation, 10, 1);
      expect(recentObs.length).toBeGreaterThan(0);
    });

    it('should sort observations by timestamp descending', () => {
      const observations = service.getObservations(testLocation, 10, 24);
      
      for (let i = 1; i < observations.length; i++) {
        expect(observations[i - 1].timestamp.getTime()).toBeGreaterThanOrEqual(
          observations[i].timestamp.getTime()
        );
      }
    });
  });

  describe('getAggregatedObservations', () => {
    beforeEach(async () => {
      // Submit multiple temperature observations
      await service.submitObservation({
        userId: 'user1',
        location: testLocation,
        observationType: 'temperature',
        value: 30
      });

      await service.submitObservation({
        userId: 'user2',
        location: testLocation,
        observationType: 'temperature',
        value: 32
      });

      await service.submitObservation({
        userId: 'user3',
        location: testLocation,
        observationType: 'rainfall',
        value: 5
      });
    });

    it('should aggregate observations by type', () => {
      const aggregated = service.getAggregatedObservations(testLocation, 10, 24);
      
      expect(aggregated.length).toBeGreaterThan(0);
      
      const tempAgg = aggregated.find(a => a.observationType === 'temperature');
      expect(tempAgg).toBeDefined();
      expect(tempAgg!.observationCount).toBe(2);
      expect(tempAgg!.averageValue).toBe(31); // (30 + 32) / 2
    });

    it('should calculate average values correctly', () => {
      const aggregated = service.getAggregatedObservations(testLocation, 10, 24);
      
      const tempAgg = aggregated.find(a => a.observationType === 'temperature');
      expect(tempAgg!.averageValue).toBeCloseTo(31, 1);
    });

    it('should count unique contributors', () => {
      const aggregated = service.getAggregatedObservations(testLocation, 10, 24);
      
      const tempAgg = aggregated.find(a => a.observationType === 'temperature');
      expect(tempAgg!.contributors).toBe(3); // 3 unique users
    });
  });

  describe('verifyObservation', () => {
    let observationId: string;

    beforeEach(async () => {
      const obs = await service.submitObservation({
        userId: 'user1',
        location: testLocation,
        observationType: 'temperature',
        value: 30
      });
      observationId = obs.id;
    });

    it('should allow verification by another user', () => {
      const result = service.verifyObservation(observationId, 'user2', true);
      expect(result).toBe(true);
    });

    it('should not allow self-verification', () => {
      const result = service.verifyObservation(observationId, 'user1', false);
      expect(result).toBe(false);
    });

    it('should mark observation as verified after sufficient agreements', () => {
      service.verifyObservation(observationId, 'user2', true);
      service.verifyObservation(observationId, 'user3', true);
      service.verifyObservation(observationId, 'user4', true);

      const observations = service.getObservations(testLocation, 10, 24);
      const obs = observations.find(o => o.id === observationId);
      
      expect(obs!.verified).toBe(true);
    });

    it('should decrease quality score for disagreements', () => {
      const initialObs = service.getObservations(testLocation, 10, 24)
        .find(o => o.id === observationId);
      const initialScore = initialObs!.qualityScore;

      service.verifyObservation(observationId, 'user2', false);
      service.verifyObservation(observationId, 'user3', false);
      service.verifyObservation(observationId, 'user4', false);

      const updatedObs = service.getObservations(testLocation, 10, 24)
        .find(o => o.id === observationId);
      
      expect(updatedObs!.qualityScore).toBeLessThan(initialScore);
    });
  });

  describe('getStatistics', () => {
    beforeEach(async () => {
      await service.submitObservation({
        userId: 'user1',
        location: testLocation,
        observationType: 'temperature',
        value: 30
      });

      await service.submitObservation({
        userId: 'user2',
        location: testLocation,
        observationType: 'rainfall',
        value: 5
      });

      await service.submitObservation({
        userId: 'user1',
        location: testLocation,
        observationType: 'humidity',
        value: 70
      });
    });

    it('should return correct total observations', () => {
      const stats = service.getStatistics();
      expect(stats.totalObservations).toBe(3);
    });

    it('should count unique contributors', () => {
      const stats = service.getStatistics();
      expect(stats.uniqueContributors).toBe(2);
    });

    it('should count observations by type', () => {
      const stats = service.getStatistics();
      expect(stats.observationsByType.temperature).toBe(1);
      expect(stats.observationsByType.rainfall).toBe(1);
      expect(stats.observationsByType.humidity).toBe(1);
    });

    it('should calculate average quality score', () => {
      const stats = service.getStatistics();
      expect(stats.averageQualityScore).toBeGreaterThan(0);
      expect(stats.averageQualityScore).toBeLessThanOrEqual(100);
    });

    it('should include recent observations', () => {
      const stats = service.getStatistics();
      expect(stats.recentObservations.length).toBeGreaterThan(0);
      expect(stats.recentObservations.length).toBeLessThanOrEqual(10);
    });
  });

  describe('getUserContributions', () => {
    it('should track user contributions', async () => {
      await service.submitObservation({
        userId: 'user1',
        location: testLocation,
        observationType: 'temperature',
        value: 30
      });

      await service.submitObservation({
        userId: 'user1',
        location: testLocation,
        observationType: 'rainfall',
        value: 5
      });

      const count = service.getUserContributions('user1');
      expect(count).toBe(2);
    });

    it('should return 0 for users with no contributions', () => {
      const count = service.getUserContributions('nonexistent-user');
      expect(count).toBe(0);
    });
  });

  describe('getTopContributors', () => {
    beforeEach(async () => {
      // User1: 3 contributions
      for (let i = 0; i < 3; i++) {
        await service.submitObservation({
          userId: 'user1',
          location: testLocation,
          observationType: 'temperature',
          value: 30
        });
      }

      // User2: 5 contributions
      for (let i = 0; i < 5; i++) {
        await service.submitObservation({
          userId: 'user2',
          location: testLocation,
          observationType: 'temperature',
          value: 30
        });
      }

      // User3: 1 contribution
      await service.submitObservation({
        userId: 'user3',
        location: testLocation,
        observationType: 'temperature',
        value: 30
      });
    });

    it('should return top contributors sorted by contribution count', () => {
      const top = service.getTopContributors(10);
      
      expect(top.length).toBe(3);
      expect(top[0].userId).toBe('user2');
      expect(top[0].contributions).toBe(5);
      expect(top[1].userId).toBe('user1');
      expect(top[1].contributions).toBe(3);
      expect(top[2].userId).toBe('user3');
      expect(top[2].contributions).toBe(1);
    });

    it('should limit results to specified count', () => {
      const top = service.getTopContributors(2);
      expect(top.length).toBe(2);
    });
  });
});
