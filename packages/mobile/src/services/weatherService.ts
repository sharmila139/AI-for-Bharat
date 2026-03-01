/**
 * Weather Service
 * Handles API calls for weather data, forecasts, and alerts
 */

import axios from 'axios';

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000/api';

export interface WeatherLocation {
  latitude: number;
  longitude: number;
  name?: string;
  district?: string;
  state?: string;
}

export interface CurrentWeather {
  temperature: number;
  feelsLike: number;
  humidity: number;
  windSpeed: number;
  windDirection: string;
  pressure: number;
  visibility: number;
  uvIndex: number;
  description: string;
  icon: string;
  timestamp: string;
}

export interface HourlyForecast {
  time: string;
  temperature: number;
  feelsLike: number;
  rainfall: number;
  humidity: number;
  windSpeed: number;
  description: string;
  icon: string;
}

export interface DailyForecast {
  date: string;
  temperature: { min: number; max: number };
  rainfall: number;
  humidity: { min: number; max: number };
  windSpeed: number;
  description: string;
  icon: string;
  sunrise: string;
  sunset: string;
}

export interface WeatherAlert {
  id: string;
  type: 'frost' | 'heavy_rain' | 'heatwave' | 'storm' | 'drought' | 'high_wind' | 'pest_risk';
  severity: 'info' | 'warning' | 'critical';
  title: string;
  description: string;
  advisories: string[];
  cropSpecific: string[];
  validFrom: string;
  validUntil: string;
  affectedAreas: string[];
  isActive: boolean;
}

export interface CropAdvisory {
  cropType: string;
  advisory: string;
  actions: string[];
  priority: 'low' | 'medium' | 'high';
}

export interface WeatherData {
  current: CurrentWeather;
  hourly: HourlyForecast[];
  daily: DailyForecast[];
  alerts: WeatherAlert[];
  cropAdvisories: CropAdvisory[];
  lastUpdated: string;
}

class WeatherService {
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
   * Get complete weather data for a location
   */
  async getWeatherData(location: WeatherLocation): Promise<WeatherData> {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/agriculture/weather`,
        {
          headers: this.getHeaders(),
          params: {
            latitude: location.latitude,
            longitude: location.longitude,
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching weather data:', error);
      throw error;
    }
  }

  /**
   * Get current weather conditions
   */
  async getCurrentWeather(location: WeatherLocation): Promise<CurrentWeather> {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/agriculture/weather/current`,
        {
          headers: this.getHeaders(),
          params: {
            latitude: location.latitude,
            longitude: location.longitude,
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching current weather:', error);
      throw error;
    }
  }

  /**
   * Get hourly forecast (48 hours)
   */
  async getHourlyForecast(location: WeatherLocation): Promise<HourlyForecast[]> {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/agriculture/weather/hourly`,
        {
          headers: this.getHeaders(),
          params: {
            latitude: location.latitude,
            longitude: location.longitude,
          },
        }
      );
      return response.data.forecast || [];
    } catch (error) {
      console.error('Error fetching hourly forecast:', error);
      throw error;
    }
  }

  /**
   * Get daily forecast (14 days)
   */
  async getDailyForecast(location: WeatherLocation): Promise<DailyForecast[]> {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/agriculture/weather/daily`,
        {
          headers: this.getHeaders(),
          params: {
            latitude: location.latitude,
            longitude: location.longitude,
          },
        }
      );
      return response.data.forecast || [];
    } catch (error) {
      console.error('Error fetching daily forecast:', error);
      throw error;
    }
  }

  /**
   * Get active weather alerts
   */
  async getWeatherAlerts(location: WeatherLocation): Promise<WeatherAlert[]> {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/agriculture/weather/alerts`,
        {
          headers: this.getHeaders(),
          params: {
            latitude: location.latitude,
            longitude: location.longitude,
          },
        }
      );
      return response.data.alerts || [];
    } catch (error) {
      console.error('Error fetching weather alerts:', error);
      throw error;
    }
  }

  /**
   * Get crop-specific weather advisories
   */
  async getCropAdvisories(
    location: WeatherLocation,
    cropTypes: string[]
  ): Promise<CropAdvisory[]> {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/agriculture/weather/crop-advisories`,
        {
          latitude: location.latitude,
          longitude: location.longitude,
          cropTypes,
        },
        {
          headers: this.getHeaders(),
        }
      );
      return response.data.advisories || [];
    } catch (error) {
      console.error('Error fetching crop advisories:', error);
      throw error;
    }
  }

  /**
   * Submit crowd-sourced weather observation
   */
  async submitObservation(
    location: WeatherLocation,
    observation: {
      temperature?: number;
      rainfall?: number;
      windSpeed?: number;
      conditions: string;
      notes?: string;
    }
  ): Promise<void> {
    try {
      await axios.post(
        `${API_BASE_URL}/agriculture/weather/observations`,
        {
          latitude: location.latitude,
          longitude: location.longitude,
          ...observation,
          timestamp: new Date().toISOString(),
        },
        {
          headers: this.getHeaders(),
        }
      );
    } catch (error) {
      console.error('Error submitting weather observation:', error);
      throw error;
    }
  }

  /**
   * Get alert severity color
   */
  getSeverityColor(severity: string): string {
    switch (severity) {
      case 'critical':
        return '#DC2626';
      case 'warning':
        return '#F59E0B';
      case 'info':
        return '#3B82F6';
      default:
        return '#6B7280';
    }
  }

  /**
   * Get alert type icon
   */
  getAlertIcon(type: string): string {
    const icons: Record<string, string> = {
      frost: '❄️',
      heavy_rain: '🌧️',
      heatwave: '🌡️',
      storm: '⛈️',
      drought: '☀️',
      high_wind: '💨',
      pest_risk: '🐛',
    };
    return icons[type] || '⚠️';
  }
}

export default new WeatherService();
