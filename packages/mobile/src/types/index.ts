/**
 * Common type definitions for RuralConnect AI Mobile App
 */

// User types
export interface User {
  id: string;
  phone: string;
  name: string;
  location: string;
  occupation: string;
  language: string;
  createdAt: Date;
  updatedAt: Date;
}

// Module types
export type ModuleType = 'agriculture' | 'health' | 'education' | 'infrastructure';

// Offline sync types
export interface SyncOperation {
  id: string;
  type: 'create' | 'update' | 'delete';
  entity: string;
  data: unknown;
  priority: 'emergency' | 'urgent' | 'normal';
  timestamp: Date;
  retryCount: number;
}

// Navigation types
export type RootStackParamList = {
  Home: undefined;
  Agriculture: undefined;
  Health: undefined;
  Education: undefined;
  Infrastructure: undefined;
  Profile: undefined;
  Settings: undefined;
};

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Error types
export interface AppError {
  code: string;
  message: string;
  details?: unknown;
}

// Re-export module-specific types
export * from './farm';
export * from './cropRecommendation';
export * from './health';
export * from './education';
