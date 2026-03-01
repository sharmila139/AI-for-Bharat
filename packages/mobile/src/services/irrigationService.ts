/**
 * Irrigation Service
 * Handles API calls for irrigation schedules and water usage tracking
 */

import axios from 'axios';

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000/api';

export interface IrrigationEvent {
  id: string;
  date: string;
  time: string;
  duration: number; // minutes
  waterAmount: number; // liters
  method: 'drip' | 'sprinkler' | 'flood' | 'manual';
  status: 'scheduled' | 'completed' | 'skipped' | 'missed';
  notes?: string;
  weatherAdjusted?: boolean;
}

export interface IrrigationSchedule {
  scheduleId: string;
  farmId: string;
  cropType: string;
  startDate: string;
  endDate: string;
  frequency: 'daily' | 'alternate' | 'weekly' | 'custom';
  events: IrrigationEvent[];
  totalWaterUsage: number; // liters
  efficiency: number; // percentage
  weatherBasedAdjustments: boolean;
}

export interface WaterUsageStats {
  period: 'week' | 'month' | 'season';
  totalUsage: number;
  averageDaily: number;
  efficiency: number;
  costEstimate: number;
  comparison: {
    previous: number;
    change: number; // percentage
  };
}

class IrrigationService {
  private getAuthToken(): string | null {
    return 'mock-token';
  }

  private getHeaders() {
    const token = this.getAuthToken();
    return {
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  /**
   * Get irrigation schedule for a farm
   */
  async getIrrigationSchedule(farmId: string): Promise<IrrigationSchedule> {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/agriculture/irrigation/schedule/${farmId}`,
        {
          headers: this.getHeaders(),
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching irrigation schedule:', error);
      throw error;
    }
  }

  /**
   * Update irrigation event status
   */
  async updateEventStatus(
    eventId: string,
    status: 'completed' | 'skipped',
    actualWaterAmount?: number,
    notes?: string
  ): Promise<void> {
    try {
      await axios.patch(
        `${API_BASE_URL}/agriculture/irrigation/events/${eventId}`,
        {
          status,
          actualWaterAmount,
          notes,
        },
        {
          headers: this.getHeaders(),
        }
      );
    } catch (error) {
      console.error('Error updating irrigation event:', error);
      throw error;
    }
  }

  /**
   * Adjust schedule based on weather
   */
  async adjustScheduleForWeather(farmId: string): Promise<IrrigationSchedule> {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/agriculture/irrigation/adjust-weather`,
        { farmId },
        {
          headers: this.getHeaders(),
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error adjusting schedule for weather:', error);
      throw error;
    }
  }

  /**
   * Get water usage statistics
   */
  async getWaterUsageStats(
    farmId: string,
    period: 'week' | 'month' | 'season'
  ): Promise<WaterUsageStats> {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/agriculture/irrigation/stats/${farmId}`,
        {
          headers: this.getHeaders(),
          params: { period },
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching water usage stats:', error);
      throw error;
    }
  }

  /**
   * Create custom irrigation event
   */
  async createCustomEvent(
    farmId: string,
    event: Partial<IrrigationEvent>
  ): Promise<IrrigationEvent> {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/agriculture/irrigation/events`,
        {
          farmId,
          ...event,
        },
        {
          headers: this.getHeaders(),
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error creating irrigation event:', error);
      throw error;
    }
  }
}

export default new IrrigationService();
