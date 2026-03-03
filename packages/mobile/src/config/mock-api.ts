/**
 * Mock API Configuration
 * Provides mock data when backend is not available
 * This allows the app to run and demonstrate UI/UX
 */

export const MOCK_MODE = true; // Set to false when backend is ready

export const mockResponses = {
  // Auth endpoints
  '/auth/login': {
    success: true,
    data: {
      user: {
        id: '1',
        name: 'Demo Farmer',
        phone: '+919876543210',
        language: 'en',
        role: 'farmer',
      },
      tokens: {
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
      },
    },
  },

  '/auth/register': {
    success: true,
    data: {
      user: {
        id: '1',
        name: 'New Farmer',
        phone: '+919876543210',
        language: 'en',
        role: 'farmer',
      },
      tokens: {
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
      },
    },
  },

  // Dashboard
  '/dashboard': {
    success: true,
    data: {
      weather: {
        temperature: 28,
        condition: 'Partly Cloudy',
        humidity: 65,
        rainfall: 0,
      },
      crops: [
        {
          id: '1',
          name: 'Rice',
          stage: 'Flowering',
          health: 'Good',
          daysToHarvest: 45,
        },
        {
          id: '2',
          name: 'Wheat',
          stage: 'Vegetative',
          health: 'Excellent',
          daysToHarvest: 60,
        },
      ],
      alerts: [
        {
          id: '1',
          type: 'weather',
          message: 'Heavy rainfall expected in 2 days',
          severity: 'warning',
        },
      ],
    },
  },

  // Crop recommendations
  '/agriculture/crop-recommendations': {
    success: true,
    data: {
      recommendations: [
        {
          crop: 'Rice',
          suitability: 95,
          season: 'Kharif',
          expectedYield: '4-5 tons/hectare',
          waterRequirement: 'High',
          reasons: [
            'Soil pH is optimal (6.5-7.0)',
            'Good water availability',
            'Suitable temperature range',
          ],
        },
        {
          crop: 'Wheat',
          suitability: 88,
          season: 'Rabi',
          expectedYield: '3-4 tons/hectare',
          waterRequirement: 'Medium',
          reasons: [
            'Good soil fertility',
            'Moderate water requirement',
            'Suitable for rotation',
          ],
        },
      ],
    },
  },

  // Soil analysis
  '/agriculture/soil-analysis': {
    success: true,
    data: {
      analysis: {
        pH: 6.8,
        nitrogen: 'Medium',
        phosphorus: 'High',
        potassium: 'Medium',
        organicMatter: 'Good',
        recommendations: [
          'Add organic compost to improve soil structure',
          'Consider nitrogen supplementation for next crop',
          'Maintain current phosphorus levels',
        ],
      },
    },
  },

  // Market prices
  '/agriculture/market-prices': {
    success: true,
    data: {
      prices: [
        {
          crop: 'Rice',
          price: 2100,
          unit: 'per quintal',
          market: 'Local Mandi',
          trend: 'up',
          change: '+5%',
        },
        {
          crop: 'Wheat',
          price: 2050,
          unit: 'per quintal',
          market: 'Local Mandi',
          trend: 'stable',
          change: '0%',
        },
      ],
    },
  },

  // Health services
  '/health/services': {
    success: true,
    data: {
      services: [
        {
          id: '1',
          name: 'Primary Health Center',
          type: 'PHC',
          distance: '5 km',
          available: true,
        },
        {
          id: '2',
          name: 'Community Health Center',
          type: 'CHC',
          distance: '12 km',
          available: true,
        },
      ],
    },
  },

  // Education content
  '/education/courses': {
    success: true,
    data: {
      courses: [
        {
          id: '1',
          title: 'Modern Farming Techniques',
          duration: '2 hours',
          language: 'Hindi',
          progress: 0,
        },
        {
          id: '2',
          title: 'Organic Farming Basics',
          duration: '1.5 hours',
          language: 'English',
          progress: 0,
        },
      ],
    },
  },
};

// Mock API delay to simulate network
export const MOCK_DELAY = 500; // milliseconds

export const getMockResponse = (endpoint: string): any => {
  // Remove query parameters
  const cleanEndpoint = endpoint.split('?')[0];
  
  // Find matching mock response
  for (const [key, value] of Object.entries(mockResponses)) {
    if (cleanEndpoint.includes(key)) {
      return value;
    }
  }

  // Default response if no match found
  return {
    success: true,
    data: {},
    message: 'Mock data not available for this endpoint',
  };
};

