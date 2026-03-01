/**
 * Application Configuration
 */

export const config = {
  // API Configuration
  api: {
    baseUrl: process.env.API_BASE_URL || 'http://localhost:3000',
    timeout: 10000, // 10 seconds
  },

  // App Configuration
  app: {
    name: 'RuralConnect AI',
    version: '1.0.0',
    minAndroidVersion: 26, // Android 8.0
  },

  // Offline Configuration
  offline: {
    maxCacheAge: 30 * 24 * 60 * 60 * 1000, // 30 days in milliseconds
    syncBatchSize: 100,
    maxRetries: 5,
  },

  // Performance Configuration
  performance: {
    maxMemoryUsage: 200 * 1024 * 1024, // 200MB
    imageCompressionQuality: 0.8,
    maxImageSize: 500 * 1024, // 500KB
  },

  // Feature Flags
  features: {
    offlineMode: true,
    voiceInput: true,
    multiLanguage: true,
    gamification: true,
  },

  // Supported Languages
  languages: [
    { code: 'en', name: 'English' },
    { code: 'hi', name: 'हिंदी' },
    { code: 'ta', name: 'தமிழ்' },
    { code: 'te', name: 'తెలుగు' },
    { code: 'bn', name: 'বাংলা' },
    { code: 'mr', name: 'मराठी' },
    { code: 'gu', name: 'ગુજરાતી' },
    { code: 'kn', name: 'ಕನ್ನಡ' },
    { code: 'ml', name: 'മലയാളം' },
    { code: 'pa', name: 'ਪੰਜਾਬੀ' },
    { code: 'or', name: 'ଓଡ଼ିଆ' },
    { code: 'as', name: 'অসমীয়া' },
    { code: 'ur', name: 'اردو' },
  ],
} as const;

export type Config = typeof config;
