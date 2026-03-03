/**
 * Realm Database Configuration - STUB VERSION
 * NOTE: Realm has been temporarily removed for build compatibility
 * This is a stub implementation that will be replaced when Realm is re-added
 */

// Stub types to maintain compatibility
export interface User {
  _id: string;
  phoneNumber: string;
  name?: string;
  email?: string;
  profileData?: string;
  lastSyncedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface FarmProfile {
  _id: string;
  userId: string;
  farmName?: string;
  landArea: number;
  soilType: string;
  irrigationType: string;
  region: string;
  crops: string;
  lastSyncedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface MarketPriceCache {
  _id: string;
  commodity: string;
  market: string;
  price: number;
  unit: string;
  date: Date;
  cachedAt: Date;
  expiresAt: Date;
}

export interface WeatherCache {
  _id: string;
  location: string;
  temperature: number;
  humidity: number;
  rainfall: number;
  forecast: string;
  cachedAt: Date;
  expiresAt: Date;
}

export interface ContentCache {
  _id: string;
  contentType: string;
  contentId: string;
  title: string;
  data: string;
  cachedAt: Date;
  expiresAt: Date;
}

export interface OfflineOperation {
  _id: string;
  operationType: string;
  entityType: string;
  entityId: string;
  data: string;
  priority: number;
  status: string;
  retryCount: number;
  createdAt: Date;
  lastAttemptAt?: Date;
  error?: string;
}

// Stub Realm Database Manager
export class RealmDatabase {
  private static instance: any = null;

  static async initialize(): Promise<any> {
    console.warn('RealmDatabase: Using stub implementation');
    this.instance = {};
    return this.instance;
  }

  static getInstance(): any {
    if (!this.instance) {
      console.warn('RealmDatabase: Using stub implementation');
      this.instance = {};
    }
    return this.instance;
  }

  static close(): void {
    this.instance = null;
  }

  static async clearAll(): Promise<void> {
    console.warn('RealmDatabase.clearAll: Stub implementation - no-op');
  }

  static getSize(): number {
    return 0;
  }
}

// Stub helper functions
export const saveUser = (userData: Partial<User>): void => {
  console.warn('saveUser: Stub implementation - no-op');
};

export const getUser = (userId: string): User | null => {
  console.warn('getUser: Stub implementation - returning null');
  return null;
};

export const saveFarmProfile = (farmData: Partial<FarmProfile>): void => {
  console.warn('saveFarmProfile: Stub implementation - no-op');
};

export const getFarmProfiles = (userId: string): any => {
  console.warn('getFarmProfiles: Stub implementation - returning empty array');
  return [];
};

export const cacheMarketPrice = (priceData: Partial<MarketPriceCache>): void => {
  console.warn('cacheMarketPrice: Stub implementation - no-op');
};

export const getCachedMarketPrices = (commodity: string): any => {
  console.warn('getCachedMarketPrices: Stub implementation - returning empty array');
  return [];
};

export const cacheWeather = (weatherData: Partial<WeatherCache>): void => {
  console.warn('cacheWeather: Stub implementation - no-op');
};

export const getCachedWeather = (location: string): WeatherCache | null => {
  console.warn('getCachedWeather: Stub implementation - returning null');
  return null;
};

export const cacheContent = (contentData: Partial<ContentCache>): void => {
  console.warn('cacheContent: Stub implementation - no-op');
};

export const getCachedContent = (contentType: string, contentId: string): ContentCache | null => {
  console.warn('getCachedContent: Stub implementation - returning null');
  return null;
};

export const cleanExpiredCache = (): void => {
  console.warn('cleanExpiredCache: Stub implementation - no-op');
};

export default RealmDatabase;
