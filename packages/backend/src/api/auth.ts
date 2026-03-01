/**
 * Authentication API
 * Handles phone + OTP authentication and user profile management
 */

import { v4 as uuidv4 } from 'uuid';

// Mock OTP storage (in production, use Redis with TTL)
const otpStore = new Map<string, { otp: string; expiresAt: number }>();

// Mock user storage (in production, use PostgreSQL)
const userStore = new Map<string, User>();

// Mock token storage (in production, use Redis)
const tokenStore = new Map<string, TokenData>();

export interface User {
  id: string;
  phoneNumber: string;
  name?: string;
  village?: string;
  occupation?: string;
  age?: number;
  gender?: string;
  language?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TokenData {
  userId: string;
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresAt: number;
  refreshTokenExpiresAt: number;
}

export interface SendOTPRequest {
  phoneNumber: string;
}

export interface SendOTPResponse {
  success: boolean;
  message: string;
  expiresIn: number; // seconds
}

export interface VerifyOTPRequest {
  phoneNumber: string;
  otp: string;
}

export interface VerifyOTPResponse {
  success: boolean;
  message: string;
  accessToken?: string;
  refreshToken?: string;
  user?: User;
  isNewUser?: boolean;
}

export interface CreateProfileRequest {
  userId: string;
  name: string;
  village: string;
  occupation: string;
  age?: number;
  gender?: string;
  language?: string;
}

export interface CreateProfileResponse {
  success: boolean;
  message: string;
  user?: User;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface RefreshTokenResponse {
  success: boolean;
  message: string;
  accessToken?: string;
  refreshToken?: string;
}

/**
 * Send OTP to phone number
 * In production, integrate with Twilio or AWS SNS
 */
export async function sendOTP(request: SendOTPRequest): Promise<SendOTPResponse> {
  const { phoneNumber } = request;

  // Validate phone number (10 digits)
  if (!/^\d{10}$/.test(phoneNumber)) {
    return {
      success: false,
      message: 'Invalid phone number. Must be 10 digits.',
      expiresIn: 0,
    };
  }

  // Generate 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  // Store OTP with 5-minute expiry
  const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes
  otpStore.set(phoneNumber, { otp, expiresAt });

  // In production, send OTP via SMS using Twilio/AWS SNS
  console.log(`[AUTH] OTP for ${phoneNumber}: ${otp}`);

  return {
    success: true,
    message: 'OTP sent successfully',
    expiresIn: 300, // 5 minutes in seconds
  };
}

/**
 * Verify OTP and authenticate user
 * Returns JWT tokens and user data
 */
export async function verifyOTP(request: VerifyOTPRequest): Promise<VerifyOTPResponse> {
  const { phoneNumber, otp } = request;

  // Check if OTP exists
  const storedOTP = otpStore.get(phoneNumber);
  if (!storedOTP) {
    return {
      success: false,
      message: 'OTP not found or expired. Please request a new OTP.',
    };
  }

  // Check if OTP is expired
  if (Date.now() > storedOTP.expiresAt) {
    otpStore.delete(phoneNumber);
    return {
      success: false,
      message: 'OTP expired. Please request a new OTP.',
    };
  }

  // Verify OTP
  if (storedOTP.otp !== otp) {
    return {
      success: false,
      message: 'Invalid OTP. Please try again.',
    };
  }

  // OTP verified, remove from store
  otpStore.delete(phoneNumber);

  // Check if user exists
  let user = Array.from(userStore.values()).find(u => u.phoneNumber === phoneNumber);
  let isNewUser = false;

  if (!user) {
    // Create new user
    user = {
      id: uuidv4(),
      phoneNumber,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    userStore.set(user.id, user);
    isNewUser = true;
  }

  // Generate JWT tokens
  const accessToken = generateToken('access', user.id);
  const refreshToken = generateToken('refresh', user.id);

  // Store tokens
  const accessTokenExpiresAt = Date.now() + 15 * 60 * 1000; // 15 minutes
  const refreshTokenExpiresAt = Date.now() + 30 * 24 * 60 * 60 * 1000; // 30 days

  tokenStore.set(accessToken, {
    userId: user.id,
    accessToken,
    refreshToken,
    accessTokenExpiresAt,
    refreshTokenExpiresAt,
  });

  return {
    success: true,
    message: 'Authentication successful',
    accessToken,
    refreshToken,
    user,
    isNewUser,
  };
}

/**
 * Create or update user profile
 */
export async function createProfile(request: CreateProfileRequest): Promise<CreateProfileResponse> {
  const { userId, name, village, occupation, age, gender, language } = request;

  // Validate required fields
  if (!name || !village || !occupation) {
    return {
      success: false,
      message: 'Name, village, and occupation are required.',
    };
  }

  // Get user
  const user = userStore.get(userId);
  if (!user) {
    return {
      success: false,
      message: 'User not found.',
    };
  }

  // Update user profile
  user.name = name;
  user.village = village;
  user.occupation = occupation;
  user.age = age;
  user.gender = gender;
  user.language = language || 'en';
  user.updatedAt = new Date();

  userStore.set(userId, user);

  return {
    success: true,
    message: 'Profile created successfully',
    user,
  };
}

/**
 * Refresh access token using refresh token
 */
export async function refreshAccessToken(request: RefreshTokenRequest): Promise<RefreshTokenResponse> {
  const { refreshToken } = request;

  // Find token data
  const tokenData = Array.from(tokenStore.values()).find(t => t.refreshToken === refreshToken);

  if (!tokenData) {
    return {
      success: false,
      message: 'Invalid refresh token.',
    };
  }

  // Check if refresh token is expired
  if (Date.now() > tokenData.refreshTokenExpiresAt) {
    tokenStore.delete(tokenData.accessToken);
    return {
      success: false,
      message: 'Refresh token expired. Please log in again.',
    };
  }

  // Generate new access token
  const newAccessToken = generateToken('access', tokenData.userId);
  const newRefreshToken = generateToken('refresh', tokenData.userId);

  // Update token store
  tokenStore.delete(tokenData.accessToken);

  const accessTokenExpiresAt = Date.now() + 15 * 60 * 1000; // 15 minutes
  const refreshTokenExpiresAt = Date.now() + 30 * 24 * 60 * 60 * 1000; // 30 days

  tokenStore.set(newAccessToken, {
    userId: tokenData.userId,
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
    accessTokenExpiresAt,
    refreshTokenExpiresAt,
  });

  return {
    success: true,
    message: 'Token refreshed successfully',
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
  };
}

/**
 * Get user by access token
 */
export async function getUserByToken(accessToken: string): Promise<User | null> {
  const tokenData = tokenStore.get(accessToken);
  if (!tokenData) {
    return null;
  }

  // Check if access token is expired
  if (Date.now() > tokenData.accessTokenExpiresAt) {
    return null;
  }

  return userStore.get(tokenData.userId) || null;
}

/**
 * Generate JWT token (mock implementation)
 * In production, use jsonwebtoken library with proper signing
 */
function generateToken(type: 'access' | 'refresh', userId: string): string {
  const prefix = type === 'access' ? 'acc' : 'ref';
  return `${prefix}_${userId}_${Date.now()}_${Math.random().toString(36).substring(7)}`;
}

/**
 * Validate access token
 */
export async function validateToken(accessToken: string): Promise<boolean> {
  const tokenData = tokenStore.get(accessToken);
  if (!tokenData) {
    return false;
  }

  return Date.now() <= tokenData.accessTokenExpiresAt;
}

/**
 * Logout user (invalidate tokens)
 */
export async function logout(accessToken: string): Promise<boolean> {
  const tokenData = tokenStore.get(accessToken);
  if (tokenData) {
    tokenStore.delete(accessToken);
    return true;
  }
  return false;
}
