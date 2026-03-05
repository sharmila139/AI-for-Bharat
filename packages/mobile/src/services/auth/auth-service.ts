/**
 * Authentication Service
 * Handles user authentication and token management
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

// Storage keys
const ACCESS_TOKEN_KEY = '@ruralconnect:access_token';
const REFRESH_TOKEN_KEY = '@ruralconnect:refresh_token';
const USER_DATA_KEY = '@ruralconnect:user_data';

// API base URL (update with your backend URL)
// For Android emulator, use 10.0.2.2 instead of localhost
// For iOS simulator, use localhost or your machine's IP
const API_BASE_URL = __DEV__
  ? 'http://10.0.2.2:3000/api'
  : 'https://api.ruralconnect.app';

export interface User {
  id: string;
  phoneNumber: string;
  name?: string;
  village?: string;
  occupation?: string;
  age?: number;
  gender?: string;
  language?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface SendOTPResponse {
  success: boolean;
  message: string;
  expiresIn: number;
}

export interface VerifyOTPResponse {
  success: boolean;
  message: string;
  accessToken?: string;
  refreshToken?: string;
  user?: User;
  isNewUser?: boolean;
}

export interface CreateProfileResponse {
  success: boolean;
  message: string;
  user?: User;
}

/**
 * Send OTP to phone number
 */
export const sendOTP = async (phoneNumber: string): Promise<SendOTPResponse> => {
  // Mock OTP for development/testing
  if (__DEV__) {
    console.log('DEV MODE: Mock OTP sent. Use any 6-digit code (e.g., 123456)');
    return {
      success: true,
      message: 'OTP sent successfully (DEV MODE: use 123456)',
      expiresIn: 300,
    };
  }

  try {
    const response = await axios.post(`${API_BASE_URL}/auth/send-otp`, {
      phoneNumber,
    });
    return response.data;
  } catch (error: any) {
    console.error('Error sending OTP:', error);
    return {
      success: false,
      message: error.response?.data?.message || 'Failed to send OTP. Please try again.',
      expiresIn: 0,
    };
  }
};

/**
 * Verify OTP and authenticate user
 */
export const verifyOTP = async (
  phoneNumber: string,
  otp: string
): Promise<VerifyOTPResponse> => {
  // Mock OTP verification for development/testing
  if (__DEV__) {
    console.log('DEV MODE: Mock OTP verification');
    
    // Accept any 6-digit OTP in dev mode
    if (otp.length === 6) {
      const mockUser: User = {
        id: 'mock-user-' + phoneNumber,
        phoneNumber,
        name: 'Test User',
        village: 'Test Village',
        occupation: 'Farmer',
        language: 'en',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const mockTokens = {
        accessToken: 'mock-access-token-' + Date.now(),
        refreshToken: 'mock-refresh-token-' + Date.now(),
      };

      // Store tokens
      await setAuthTokens(mockTokens);
      await setUserData(mockUser);

      return {
        success: true,
        message: 'OTP verified successfully (DEV MODE)',
        accessToken: mockTokens.accessToken,
        refreshToken: mockTokens.refreshToken,
        user: mockUser,
        isNewUser: false,
      };
    }
  }

  try {
    const response = await axios.post(`${API_BASE_URL}/auth/verify-otp`, {
      phoneNumber,
      otp,
    });

    const data = response.data;

    if (data.success && data.accessToken && data.refreshToken) {
      // Store tokens
      await setAuthTokens({
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
      });

      // Store user data
      if (data.user) {
        await setUserData(data.user);
      }
    }

    return data;
  } catch (error: any) {
    console.error('Error verifying OTP:', error);
    return {
      success: false,
      message: error.response?.data?.message || 'Failed to verify OTP. Please try again.',
    };
  }
};

/**
 * Create or update user profile
 */
export const createProfile = async (
  userId: string,
  profileData: {
    name: string;
    village: string;
    occupation: string;
    age?: number;
    gender?: string;
    language?: string;
  }
): Promise<CreateProfileResponse> => {
  try {
    const accessToken = await getAuthToken();
    const response = await axios.post(
      `${API_BASE_URL}/auth/profile`,
      {
        userId,
        ...profileData,
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    const data = response.data;

    if (data.success && data.user) {
      await setUserData(data.user);
    }

    return data;
  } catch (error: any) {
    console.error('Error creating profile:', error);
    return {
      success: false,
      message: error.response?.data?.message || 'Failed to create profile. Please try again.',
    };
  }
};

/**
 * Refresh access token
 */
export const refreshAccessToken = async (): Promise<boolean> => {
  try {
    const refreshToken = await getRefreshToken();
    if (!refreshToken) {
      return false;
    }

    const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
      refreshToken,
    });

    const data = response.data;

    if (data.success && data.accessToken && data.refreshToken) {
      await setAuthTokens({
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
      });
      return true;
    }

    return false;
  } catch (error) {
    console.error('Error refreshing token:', error);
    return false;
  }
};

/**
 * Get access token from storage
 */
export const getAuthToken = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem(ACCESS_TOKEN_KEY);
  } catch (error) {
    console.error('Error getting auth token:', error);
    return null;
  }
};

/**
 * Get refresh token from storage
 */
export const getRefreshToken = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem(REFRESH_TOKEN_KEY);
  } catch (error) {
    console.error('Error getting refresh token:', error);
    return null;
  }
};

/**
 * Set auth tokens in storage
 */
export const setAuthTokens = async (tokens: AuthTokens): Promise<void> => {
  try {
    await AsyncStorage.multiSet([
      [ACCESS_TOKEN_KEY, tokens.accessToken],
      [REFRESH_TOKEN_KEY, tokens.refreshToken],
    ]);
  } catch (error) {
    console.error('Error setting auth tokens:', error);
  }
};

/**
 * Clear auth tokens from storage
 */
export const clearAuthToken = async (): Promise<void> => {
  try {
    await AsyncStorage.multiRemove([ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY, USER_DATA_KEY]);
  } catch (error) {
    console.error('Error clearing auth tokens:', error);
  }
};

/**
 * Check if user is authenticated
 */
export const isAuthenticated = async (): Promise<boolean> => {
  const token = await getAuthToken();
  return token !== null;
};

/**
 * Get user data from storage
 */
export const getUserData = async (): Promise<User | null> => {
  try {
    const userData = await AsyncStorage.getItem(USER_DATA_KEY);
    return userData ? JSON.parse(userData) : null;
  } catch (error) {
    console.error('Error getting user data:', error);
    return null;
  }
};

/**
 * Set user data in storage
 */
export const setUserData = async (user: User): Promise<void> => {
  try {
    await AsyncStorage.setItem(USER_DATA_KEY, JSON.stringify(user));
  } catch (error) {
    console.error('Error setting user data:', error);
  }
};

/**
 * Logout user
 */
export const logout = async (): Promise<void> => {
  try {
    const accessToken = await getAuthToken();
    if (accessToken) {
      // Call logout API
      await axios.post(
        `${API_BASE_URL}/auth/logout`,
        {},
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
    }
  } catch (error) {
    console.error('Error logging out:', error);
  } finally {
    // Clear local storage regardless of API call result
    await clearAuthToken();
  }
};
