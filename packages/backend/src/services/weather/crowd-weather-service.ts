/**
 * Crowd-Sourced Weather Observation Service
 * Allows users to submit local weather observations to improve forecast accuracy
 * Features: observation submission, validation, aggregation, quality scoring
 */

import { WeatherLocation } from './weather-service';

export type ObservationType = 
  | 'temperature'
  | 'rainfall'
  | 'wind_speed'
  | 'humidity'
  | 'cloud_cover'
  | 'visibility'
  | 'general_condition';

export type WeatherCondition = 
  | 'clear'
  | 'partly_cloudy'
  | 'cloudy'
  | 'rainy'
  | 'heavy_rain'
  | 'stormy'
  | 'foggy'
  | 'hazy';

export interface WeatherObservation {
  id: string;
  userId: string;
  location: WeatherLocation;
  timestamp: Date;
  observationType: ObservationType;
  value?: number; // For numeric observations
  condition?: WeatherCondition; // For general conditions
  notes?: string;
  photoUrl?: string;
  verified: boolean;
  qualityScore: number; // 0-100
  metadata: {
    deviceType?: string;
    reportedBy?: string;
    verificationCount?: number;
    agreementScore?: number;
  };
}

export interface ObservationSubmission {
  userId: string;
  location: WeatherLocation;
  observationType: ObservationType;
  value?: number;
  condition?: WeatherCondition;
  notes?: string;
  photoUrl?: string;
}

export interface AggregatedObservation {
  location: WeatherLocation;
  timestamp: Date;
  observationType: ObservationType;
  averageValue?: number;
  mostCommonCondition?: WeatherCondition;
  observationCount: number;
  qualityScore: number;
  contributors: number;
}

export interface ObservationStats {
  totalObservations: number;
  verifiedObservations: number;
  uniqueContributors: number;
  averageQualityScore: number;
  observationsByType: Record<ObservationType, number>;
  recentObservations: WeatherObservation[];
}

/**
 * Crowd-Sourced Weather Observation Service
 * Validates: Requirements 5.9 - Crowd-sourced weather observations
 */
export class CrowdWeatherService {
  private observations: Map<string, WeatherObservation>;
  private userContributions: Map<string, number>;
  private locationObservations: Map<string, string[]>; // locationKey -> observationIds

  constructor() {
    this.observations = new Map();
    this.userContributions = new Map();
    this.locationObservations = new Map();
  }

  /**
   * Submit a weather observation
   */
  async submitObservation(submission: ObservationSubmission): Promise<WeatherObservation> {
    // Validate submission
    this.validateSubmission(submission);

    // Create observation
    const observation: WeatherObservation = {
      id: this.generateObservationId(),
      userId: submission.userId,
      location: submission.location,
      timestamp: new Date(),
      observationType: submission.observationType,
      value: submission.value,
      condition: submission.condition,
      notes: submission.notes,
      photoUrl: submission.photoUrl,
      verified: false,
      qualityScore: this.calculateInitialQualityScore(submission),
      metadata: {
        reportedBy: submission.userId,
        verificationCount: 0,
        agreementScore: 0
      }
    };

    // Store observation
    this.observations.set(observation.id, observation);

    // Update user contributions
    const userCount = this.userContributions.get(submission.userId) || 0;
    this.userContributions.set(submission.userId, userCount + 1);

    // Index by location
    const locationKey = this.getLocationKey(submission.location);
    const locationObs = this.locationObservations.get(locationKey) || [];
    locationObs.push(observation.id);
    this.locationObservations.set(locationKey, locationObs);

    // Auto-verify if user is trusted contributor
    if (userCount >= 10) {
      observation.verified = true;
      observation.qualityScore = Math.min(observation.qualityScore + 20, 100);
    }

    return observation;
  }

  /**
   * Get observations for a location within a time range
   */
  getObservations(
    location: WeatherLocation,
    radiusKm: number = 10,
    hoursBack: number = 24
  ): WeatherObservation[] {
    const cutoffTime = new Date(Date.now() - hoursBack * 60 * 60 * 1000);
    const observations: WeatherObservation[] = [];

    for (const obs of this.observations.values()) {
      if (obs.timestamp < cutoffTime) continue;

      const distance = this.calculateDistance(location, obs.location);
      if (distance <= radiusKm) {
        observations.push(obs);
      }
    }

    // Sort by timestamp descending
    return observations.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  /**
   * Get aggregated observations for a location
   */
  getAggregatedObservations(
    location: WeatherLocation,
    radiusKm: number = 10,
    hoursBack: number = 3
  ): AggregatedObservation[] {
    const observations = this.getObservations(location, radiusKm, hoursBack);
    const aggregated: Map<ObservationType, AggregatedObservation> = new Map();

    for (const obs of observations) {
      if (!aggregated.has(obs.observationType)) {
        aggregated.set(obs.observationType, {
          location,
          timestamp: new Date(),
          observationType: obs.observationType,
          observationCount: 0,
          qualityScore: 0,
          contributors: 0
        });
      }

      const agg = aggregated.get(obs.observationType)!;
      agg.observationCount++;

      // Aggregate numeric values
      if (obs.value !== undefined) {
        if (agg.averageValue === undefined) {
          agg.averageValue = obs.value;
        } else {
          agg.averageValue = (agg.averageValue * (agg.observationCount - 1) + obs.value) / agg.observationCount;
        }
      }

      // Track most common condition
      if (obs.condition) {
        // Simple implementation - could be improved with proper counting
        agg.mostCommonCondition = obs.condition;
      }

      // Update quality score
      agg.qualityScore = (agg.qualityScore * (agg.observationCount - 1) + obs.qualityScore) / agg.observationCount;
    }

    // Count unique contributors
    const uniqueUsers = new Set(observations.map(o => o.userId));
    for (const agg of aggregated.values()) {
      agg.contributors = uniqueUsers.size;
    }

    return Array.from(aggregated.values());
  }

  /**
   * Verify an observation (by another user or system)
   */
  verifyObservation(observationId: string, verifierId: string, agrees: boolean): boolean {
    const observation = this.observations.get(observationId);
    if (!observation) return false;

    // Don't allow self-verification
    if (observation.userId === verifierId) return false;

    observation.metadata.verificationCount = (observation.metadata.verificationCount || 0) + 1;

    // Update agreement score
    const currentAgreement = observation.metadata.agreementScore || 0;
    const verificationCount = observation.metadata.verificationCount;
    observation.metadata.agreementScore = 
      (currentAgreement * (verificationCount - 1) + (agrees ? 100 : 0)) / verificationCount;

    // Update quality score based on agreement
    if (observation.metadata.agreementScore >= 70 && verificationCount >= 3) {
      observation.verified = true;
      observation.qualityScore = Math.min(observation.qualityScore + 10, 100);
    } else if (observation.metadata.agreementScore < 30 && verificationCount >= 3) {
      observation.qualityScore = Math.max(observation.qualityScore - 20, 0);
    }

    return true;
  }

  /**
   * Get observation statistics
   */
  getStatistics(location?: WeatherLocation, radiusKm: number = 50): ObservationStats {
    let observations: WeatherObservation[];

    if (location) {
      observations = this.getObservations(location, radiusKm, 24 * 7); // Last 7 days
    } else {
      observations = Array.from(this.observations.values());
    }

    const observationsByType: Record<ObservationType, number> = {
      temperature: 0,
      rainfall: 0,
      wind_speed: 0,
      humidity: 0,
      cloud_cover: 0,
      visibility: 0,
      general_condition: 0
    };

    let totalQualityScore = 0;
    let verifiedCount = 0;

    for (const obs of observations) {
      observationsByType[obs.observationType]++;
      totalQualityScore += obs.qualityScore;
      if (obs.verified) verifiedCount++;
    }

    const uniqueContributors = new Set(observations.map(o => o.userId)).size;

    return {
      totalObservations: observations.length,
      verifiedObservations: verifiedCount,
      uniqueContributors,
      averageQualityScore: observations.length > 0 ? totalQualityScore / observations.length : 0,
      observationsByType,
      recentObservations: observations.slice(0, 10)
    };
  }

  /**
   * Get user contribution count
   */
  getUserContributions(userId: string): number {
    return this.userContributions.get(userId) || 0;
  }

  /**
   * Get top contributors
   */
  getTopContributors(limit: number = 10): Array<{ userId: string; contributions: number }> {
    const contributors = Array.from(this.userContributions.entries())
      .map(([userId, contributions]) => ({ userId, contributions }))
      .sort((a, b) => b.contributions - a.contributions)
      .slice(0, limit);

    return contributors;
  }

  /**
   * Validate observation submission
   */
  private validateSubmission(submission: ObservationSubmission): void {
    // Check required fields
    if (!submission.userId) {
      throw new Error('User ID is required');
    }

    if (!submission.location || 
        submission.location.latitude === undefined || 
        submission.location.longitude === undefined) {
      throw new Error('Valid location is required');
    }

    // Validate location bounds
    if (submission.location.latitude < -90 || submission.location.latitude > 90) {
      throw new Error('Invalid latitude');
    }

    if (submission.location.longitude < -180 || submission.location.longitude > 180) {
      throw new Error('Invalid longitude');
    }

    // Validate observation type
    const validTypes: ObservationType[] = [
      'temperature', 'rainfall', 'wind_speed', 'humidity', 
      'cloud_cover', 'visibility', 'general_condition'
    ];
    if (!validTypes.includes(submission.observationType)) {
      throw new Error('Invalid observation type');
    }

    // Validate numeric values
    if (submission.value !== undefined) {
      if (submission.observationType === 'temperature' && 
          (submission.value < -50 || submission.value > 60)) {
        throw new Error('Temperature out of valid range (-50 to 60°C)');
      }

      if (submission.observationType === 'rainfall' && 
          (submission.value < 0 || submission.value > 500)) {
        throw new Error('Rainfall out of valid range (0 to 500mm)');
      }

      if (submission.observationType === 'wind_speed' && 
          (submission.value < 0 || submission.value > 50)) {
        throw new Error('Wind speed out of valid range (0 to 50 m/s)');
      }

      if (submission.observationType === 'humidity' && 
          (submission.value < 0 || submission.value > 100)) {
        throw new Error('Humidity out of valid range (0 to 100%)');
      }
    }

    // Validate condition for general_condition type
    if (submission.observationType === 'general_condition' && !submission.condition) {
      throw new Error('Condition is required for general_condition observations');
    }
  }

  /**
   * Calculate initial quality score for an observation
   */
  private calculateInitialQualityScore(submission: ObservationSubmission): number {
    let score = 50; // Base score

    // Bonus for photo evidence
    if (submission.photoUrl) {
      score += 20;
    }

    // Bonus for detailed notes
    if (submission.notes && submission.notes.length > 20) {
      score += 10;
    }

    // Bonus for numeric measurements (more precise)
    if (submission.value !== undefined) {
      score += 10;
    }

    // Bonus for trusted user (checked in submitObservation)
    // Will be added there based on contribution history

    return Math.min(score, 100);
  }

  /**
   * Calculate distance between two locations (Haversine formula)
   */
  private calculateDistance(loc1: WeatherLocation, loc2: WeatherLocation): number {
    const R = 6371; // Earth's radius in km
    const dLat = this.toRadians(loc2.latitude - loc1.latitude);
    const dLon = this.toRadians(loc2.longitude - loc1.longitude);

    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(loc1.latitude)) * 
      Math.cos(this.toRadians(loc2.latitude)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Convert degrees to radians
   */
  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * Generate location key for indexing
   */
  private getLocationKey(location: WeatherLocation): string {
    return `${location.latitude.toFixed(2)},${location.longitude.toFixed(2)}`;
  }

  /**
   * Generate unique observation ID
   */
  private generateObservationId(): string {
    return `OBS-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Clear all observations (for testing)
   */
  clear(): void {
    this.observations.clear();
    this.userContributions.clear();
    this.locationObservations.clear();
  }
}

/**
 * Create crowd weather service instance
 */
export function createCrowdWeatherService(): CrowdWeatherService {
  return new CrowdWeatherService();
}
