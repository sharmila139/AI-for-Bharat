/**
 * API Configuration
 * Centralized API configuration for the mobile app
 */

import axios from 'axios';
import { getAuthToken, refreshAccessToken } from '../services/auth/auth-service';
import { MOCK_MODE, getMockResponse, MOCK_DELAY } from './mock-api';

// API Base URL - Update this with your backend URL
// For development: use your local IP address (not localhost)
// For production: use your deployed backend URL
export const API_BASE_URL = __DEV__
  ? 'http://10.0.2.2:3000/api' // Android emulator
  : 'https://api.ruralconnect.app';

// Mock API interceptor
const mockApiCall = (config: any): Promise<any> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const mockData = getMockResponse(config.url || '');
      resolve({
        data: mockData,
        status: 200,
        statusText: 'OK',
        headers: {},
        config,
      });
    }, MOCK_DELAY);
  });
};

// Create axios instance with default config
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  async (config) => {
    // Use mock API if enabled
    if (MOCK_MODE) {
      return mockApiCall(config);
    }

    const token = await getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If error is 401 and we haven't retried yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Try to refresh the token
        const refreshed = await refreshAccessToken();

        if (refreshed) {
          // Retry the original request with new token
          const token = await getAuthToken();
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return apiClient(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, user needs to log in again
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
