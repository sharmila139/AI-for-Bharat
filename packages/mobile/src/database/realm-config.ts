/**
 * Realm Database Configuration
 * Local storage for offline-first architecture
 */

import Realm from 'realm';

// User Schema
export class User extends Realm.Object<User> {
  _id!: string;
  phoneNumber!: string;
  name?: string;
  email?: string;
  profileData?: string; // JSON string
  lastSyncedAt?: Date;
  createdAt!: Date;
  updatedAt!: Date;

  static schema: Realm.ObjectSchema = {
    name: 'User',
    primaryKey: '_id',
    properties: {
      _id: 'string',
      phoneNumber: 'string',
      name: 'string?',
      email: 'string?',
      profileData: 'string?',
      lastSyncedAt: 'date?',
      createdAt: 'date',
      updatedAt: 'date'
    }
  };
}

// Farm Profile Schema
export class FarmProfile extends Realm.Object<FarmProfile> {
  _id!: string;
  userId!: string;
  farmName?: string;
  landArea!: number;
  soilType!: string;
  irrigationType!: string;
  region!: string;
  crops!: string; // JSON array string
  lastSyncedAt?: Date;
  createdAt!: Date;
  updatedAt!: Date;

  static schema: Realm.ObjectSchema = {
    name: 'FarmProfile',
    primaryKey: '_id',
    properties: {
      _id: 'string',
      userId: 'string',
      farmName: 'string?',
      landArea: 'double',
      soilType: 'string',
      irrigationType: 'string',
      region: 'string',
      crops: 'string',
      lastSyncedAt: 'date?',
      createdAt: 'date',
      updatedAt: 'date'
    }
  };
}

// Market Price Cache Schema
export class MarketPriceCache extends Realm.Object<MarketPriceCache> {
  _id!: string;
  commodity!: string;
  market!: string;
  price!: number;
  unit!: string;
  date!: Date;
  cachedAt!: Date;
  expiresAt!: Date;

  static schema: Realm.ObjectSchema = {
    name: 'MarketPriceCache',
    primaryKey: '_id',
    properties: {
      _id: 'string',
      commodity: 'string',
      market: 'string',
      price: 'double',
      unit: 'string',
      date: 'date',
      cachedAt: 'date',
      expiresAt: 'date'
    }
  };
}

// Weather Cache Schema
export class WeatherCache extends Realm.Object<WeatherCache> {
  _id!: string;
  location!: string;
  temperature!: number;
  humidity!: number;
  rainfall!: number;
  forecast!: string; // JSON string
  cachedAt!: Date;
  expiresAt!: Date;

  static schema: Realm.ObjectSchema = {
    name: 'WeatherCache',
    primaryKey: '_id',
    properties: {
      _id: 'string',
      location: 'string',
      temperature: 'double',
      humidity: 'double',
      rainfall: 'double',
      forecast: 'string',
      cachedAt: 'date',
      expiresAt: 'date'
    }
  };
}


// Content Cache Schema (for education, health, agriculture content)
export class ContentCache extends Realm.Object<ContentCache> {
  _id!: string;
  contentType!: string; // 'education', 'health', 'agriculture'
  contentId!: string;
  title!: string;
  data!: string; // JSON string
  cachedAt!: Date;
  expiresAt!: Date;

  static schema: Realm.ObjectSchema = {
    name: 'ContentCache',
    primaryKey: '_id',
    properties: {
      _id: 'string',
      contentType: 'string',
      contentId: 'string',
      title: 'string',
      data: 'string',
      cachedAt: 'date',
      expiresAt: 'date'
    }
  };
}

// Offline Operation Queue Schema
export class OfflineOperation extends Realm.Object<OfflineOperation> {
  _id!: string;
  operationType!: string; // 'create', 'update', 'delete'
  entityType!: string; // 'user', 'farm', 'grievance', etc.
  entityId!: string;
  data!: string; // JSON string
  priority!: number; // 1-10, higher is more important
  status!: string; // 'pending', 'syncing', 'synced', 'failed'
  retryCount!: number;
  createdAt!: Date;
  lastAttemptAt?: Date;
  error?: string;

  static schema: Realm.ObjectSchema = {
    name: 'OfflineOperation',
    primaryKey: '_id',
    properties: {
      _id: 'string',
      operationType: 'string',
      entityType: 'string',
      entityId: 'string',
      data: 'string',
      priority: 'int',
      status: 'string',
      retryCount: { type: 'int', default: 0 },
      createdAt: 'date',
      lastAttemptAt: 'date?',
      error: 'string?'
    }
  };
}

// Realm Configuration
const realmConfig: Realm.Configuration = {
  schema: [
    User,
    FarmProfile,
    MarketPriceCache,
    WeatherCache,
    ContentCache,
    OfflineOperation
  ],
  schemaVersion: 1,
  migration: (oldRealm: Realm, newRealm: Realm) => {
    // Handle schema migrations here
    if (oldRealm.schemaVersion < 1) {
      // Migration logic for version 1
    }
  }
};

// Realm Database Manager
export class RealmDatabase {
  private static instance: Realm | null = null;

  /**
   * Initialize Realm database
   */
  static async initialize(): Promise<Realm> {
    if (!this.instance) {
      this.instance = await Realm.open(realmConfig);
    }
    return this.instance;
  }

  /**
   * Get Realm instance
   */
  static getInstance(): Realm {
    if (!this.instance) {
      throw new Error('Realm not initialized. Call initialize() first.');
    }
    return this.instance;
  }

  /**
   * Close Realm database
   */
  static close(): void {
    if (this.instance && !this.instance.isClosed) {
      this.instance.close();
      this.instance = null;
    }
  }

  /**
   * Clear all data (for testing or logout)
   */
  static async clearAll(): Promise<void> {
    const realm = this.getInstance();
    realm.write(() => {
      realm.deleteAll();
    });
  }

  /**
   * Get database size
   */
  static getSize(): number {
    const realm = this.getInstance();
    return realm.path ? 0 : 0; // Would need native module to get actual size
  }
}

// Helper functions for common operations

/**
 * Save user data
 */
export const saveUser = (userData: Partial<User>): void => {
  const realm = RealmDatabase.getInstance();
  realm.write(() => {
    realm.create('User', {
      ...userData,
      updatedAt: new Date()
    }, Realm.UpdateMode.Modified);
  });
};

/**
 * Get user by ID
 */
export const getUser = (userId: string): User | null => {
  const realm = RealmDatabase.getInstance();
  return realm.objectForPrimaryKey('User', userId);
};

/**
 * Save farm profile
 */
export const saveFarmProfile = (farmData: Partial<FarmProfile>): void => {
  const realm = RealmDatabase.getInstance();
  realm.write(() => {
    realm.create('FarmProfile', {
      ...farmData,
      updatedAt: new Date()
    }, Realm.UpdateMode.Modified);
  });
};

/**
 * Get farm profiles for user
 */
export const getFarmProfiles = (userId: string): Realm.Results<FarmProfile> => {
  const realm = RealmDatabase.getInstance();
  return realm.objects('FarmProfile').filtered('userId = $0', userId);
};

/**
 * Cache market price
 */
export const cacheMarketPrice = (priceData: Partial<MarketPriceCache>): void => {
  const realm = RealmDatabase.getInstance();
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 24); // 24 hour cache

  realm.write(() => {
    realm.create('MarketPriceCache', {
      ...priceData,
      cachedAt: new Date(),
      expiresAt
    }, Realm.UpdateMode.Modified);
  });
};

/**
 * Get cached market prices
 */
export const getCachedMarketPrices = (commodity: string): Realm.Results<MarketPriceCache> => {
  const realm = RealmDatabase.getInstance();
  const now = new Date();
  return realm.objects('MarketPriceCache')
    .filtered('commodity = $0 AND expiresAt > $1', commodity, now)
    .sorted('date', true);
};

/**
 * Cache weather data
 */
export const cacheWeather = (weatherData: Partial<WeatherCache>): void => {
  const realm = RealmDatabase.getInstance();
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 6); // 6 hour cache

  realm.write(() => {
    realm.create('WeatherCache', {
      ...weatherData,
      cachedAt: new Date(),
      expiresAt
    }, Realm.UpdateMode.Modified);
  });
};

/**
 * Get cached weather
 */
export const getCachedWeather = (location: string): WeatherCache | null => {
  const realm = RealmDatabase.getInstance();
  const now = new Date();
  const results = realm.objects('WeatherCache')
    .filtered('location = $0 AND expiresAt > $1', location, now)
    .sorted('cachedAt', true);
  
  return results.length > 0 ? results[0] : null;
};

/**
 * Cache content
 */
export const cacheContent = (contentData: Partial<ContentCache>): void => {
  const realm = RealmDatabase.getInstance();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30); // 30 day cache

  realm.write(() => {
    realm.create('ContentCache', {
      ...contentData,
      cachedAt: new Date(),
      expiresAt
    }, Realm.UpdateMode.Modified);
  });
};

/**
 * Get cached content
 */
export const getCachedContent = (contentType: string, contentId: string): ContentCache | null => {
  const realm = RealmDatabase.getInstance();
  const now = new Date();
  const results = realm.objects('ContentCache')
    .filtered('contentType = $0 AND contentId = $1 AND expiresAt > $2', contentType, contentId, now);
  
  return results.length > 0 ? results[0] : null;
};

/**
 * Clean expired cache
 */
export const cleanExpiredCache = (): void => {
  const realm = RealmDatabase.getInstance();
  const now = new Date();

  realm.write(() => {
    // Clean market prices
    const expiredPrices = realm.objects('MarketPriceCache').filtered('expiresAt < $0', now);
    realm.delete(expiredPrices);

    // Clean weather
    const expiredWeather = realm.objects('WeatherCache').filtered('expiresAt < $0', now);
    realm.delete(expiredWeather);

    // Clean content
    const expiredContent = realm.objects('ContentCache').filtered('expiresAt < $0', now);
    realm.delete(expiredContent);
  });
};

export default RealmDatabase;
