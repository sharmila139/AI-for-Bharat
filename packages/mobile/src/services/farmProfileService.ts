/**
 * Farm Profile Service
 * Handles API calls for farm profile management
 */

import axios from 'axios';
import { FarmProfile, CreateFarmProfileInput, UpdateFarmProfileInput } from '../types/farm';

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000/api';

class FarmProfileService {
  private getAuthToken(): string | null {
    // In a real app, get token from secure storage
    // For now, return a placeholder
    return 'mock-token';
  }

  private getHeaders() {
    const token = this.getAuthToken();
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  /**
   * Get all farm profiles for the current user
   */
  async getUserFarms(): Promise<FarmProfile[]> {
    try {
      const response = await axios.get(`${API_BASE_URL}/farms`, {
        headers: this.getHeaders(),
      });
      return response.data.farms || [];
    } catch (error) {
      console.error('Error fetching user farms:', error);
      throw error;
    }
  }

  /**
   * Get a specific farm profile by ID
   */
  async getFarmProfile(farmId: string): Promise<FarmProfile> {
    try {
      const response = await axios.get(`${API_BASE_URL}/farms/${farmId}`, {
        headers: this.getHeaders(),
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching farm profile:', error);
      throw error;
    }
  }

  /**
   * Create a new farm profile
   */
  async createFarmProfile(data: CreateFarmProfileInput): Promise<FarmProfile> {
    try {
      const response = await axios.post(`${API_BASE_URL}/farms`, data, {
        headers: this.getHeaders(),
      });
      return response.data;
    } catch (error) {
      console.error('Error creating farm profile:', error);
      throw error;
    }
  }

  /**
   * Update an existing farm profile
   */
  async updateFarmProfile(farmId: string, data: UpdateFarmProfileInput): Promise<FarmProfile> {
    try {
      const response = await axios.put(`${API_BASE_URL}/farms/${farmId}`, data, {
        headers: this.getHeaders(),
      });
      return response.data;
    } catch (error) {
      console.error('Error updating farm profile:', error);
      throw error;
    }
  }

  /**
   * Delete a farm profile
   */
  async deleteFarmProfile(farmId: string): Promise<void> {
    try {
      await axios.delete(`${API_BASE_URL}/farms/${farmId}`, {
        headers: this.getHeaders(),
      });
    } catch (error) {
      console.error('Error deleting farm profile:', error);
      throw error;
    }
  }
}

export default new FarmProfileService();
