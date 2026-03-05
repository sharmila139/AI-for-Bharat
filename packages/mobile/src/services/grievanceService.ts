/**
 * Grievance Service
 * Handles API calls for infrastructure grievances
 */

import apiClient from './api/client';

export interface Grievance {
  id: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  location: string;
  submittedAt: string;
}

export interface GrievanceSubmitParams {
  description: string;
  location?: string;
  category?: string;
}

export interface GrievanceSubmitResponse {
  ticketId: string;
  category: string;
  priority: string;
  estimatedResolution: string;
}

class GrievanceService {
  /**
   * Submit a new grievance
   */
  async submitGrievance(params: GrievanceSubmitParams): Promise<GrievanceSubmitResponse> {
    try {
      const response = await apiClient.post<GrievanceSubmitResponse>(
        '/api/infrastructure/grievance',
        params
      );

      if (response.success && response.data) {
        return response.data;
      }

      throw new Error(response.error || 'Failed to submit grievance');
    } catch (error: any) {
      console.error('Error submitting grievance:', error);
      throw new Error(error.message || 'Failed to submit grievance');
    }
  }

  /**
   * Get list of grievances
   */
  async getGrievances(): Promise<Grievance[]> {
    try {
      const response = await apiClient.get<{ grievances: Grievance[] }>(
        '/api/infrastructure/grievance'
      );

      if (response.success && response.data) {
        return response.data.grievances || [];
      }

      return [];
    } catch (error) {
      console.error('Error getting grievances:', error);
      return [];
    }
  }

  /**
   * Get grievance by ID
   */
  async getGrievanceById(id: string): Promise<Grievance | null> {
    try {
      const response = await apiClient.get<Grievance>(
        `/api/infrastructure/grievance/${id}`
      );

      if (response.success && response.data) {
        return response.data;
      }

      return null;
    } catch (error) {
      console.error('Error getting grievance:', error);
      return null;
    }
  }
}

export default new GrievanceService();
