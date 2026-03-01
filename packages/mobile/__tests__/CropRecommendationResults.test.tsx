/**
 * Tests for CropRecommendationResultsScreen
 */

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { Alert } from 'react-native';
import CropRecommendationResultsScreen from '../src/screens/agriculture/CropRecommendationResultsScreen';
import { CropRecommendationResponse } from '../src/types/cropRecommendation';

// Mock navigation
const mockNavigate = jest.fn();
const mockGoBack = jest.fn();

jest.mock('@react-navigation/native', () => {
  const actualNav = jest.requireActual('@react-navigation/native');
  return {
    ...actualNav,
    useNavigation: () => ({
      navigate: mockNavigate,
      goBack: mockGoBack,
    }),
    useRoute: () => ({
      params: {
        data: mockRecommendationData,
      },
    }),
  };
});

// Mock Alert
jest.spyOn(Alert, 'alert');

// Mock recommendation data
const mockRecommendationData: CropRecommendationResponse = {
  recommendations: [
    {
      crop: 'Rice',
      overallScore: 85.5,
      soilScore: 90,
      climateScore: 85,
      seasonalScore: 88,
      marketScore: 78,
      suitabilityLevel: 'Excellent',
      improvementSuggestions: [
        'Consider adding organic matter to improve soil health',
        'Monitor water levels during monsoon season',
      ],
    },
    {
      crop: 'Wheat',
      overallScore: 78.2,
      soilScore: 80,
      climateScore: 75,
      seasonalScore: 82,
      marketScore: 76,
      suitabilityLevel: 'Good',
      improvementSuggestions: [
        'Ensure proper drainage to prevent waterlogging',
      ],
    },
    {
      crop: 'Cotton',
      overallScore: 65.8,
      soilScore: 70,
      climateScore: 68,
      seasonalScore: 60,
      marketScore: 65,
      suitabilityLevel: 'Fair',
      improvementSuggestions: [
        'Consider irrigation during dry spells',
        'Monitor for pest infestations',
      ],
    },
    {
      crop: 'Sugarcane',
      overallScore: 72.4,
      soilScore: 75,
      climateScore: 70,
      seasonalScore: 74,
      marketScore: 70,
      suitabilityLevel: 'Good',
    },
    {
      crop: 'Maize',
      overallScore: 68.9,
      soilScore: 72,
      climateScore: 65,
      seasonalScore: 70,
      marketScore: 68,
      suitabilityLevel: 'Fair',
    },
  ],
  farmConditions: {
    soilType: 'alluvial',
    nitrogen: 80,
    phosphorus: 45,
    potassium: 60,
    ph: 6.5,
    temperature: 28,
    humidity: 75,
    rainfall: 150,
    region: 'north',
    season: 'kharif',
  },
  source: 'ml-model',
  timestamp: '2024-02-27T10:30:00Z',
};

describe('CropRecommendationResultsScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly with recommendation data', () => {
    const { getByText } = render(
      <NavigationContainer>
        <CropRecommendationResultsScreen />
      </NavigationContainer>
    );

    expect(getByText('Top 5 Crop Recommendations')).toBeTruthy();
    expect(getByText('Rice')).toBeTruthy();
    expect(getByText('Wheat')).toBeTruthy();
    expect(getByText('Cotton')).toBeTruthy();
    expect(getByText('Sugarcane')).toBeTruthy();
    expect(getByText('Maize')).toBeTruthy();
  });

  it('displays correct suitability levels', () => {
    const { getByText, getAllByText } = render(
      <NavigationContainer>
        <CropRecommendationResultsScreen />
      </NavigationContainer>
    );

    expect(getByText('Excellent')).toBeTruthy();
    // There are multiple "Good" labels (Wheat and Sugarcane)
    expect(getAllByText('Good').length).toBeGreaterThan(0);
    // There are multiple "Fair" labels (Cotton and Maize)
    expect(getAllByText('Fair').length).toBeGreaterThan(0);
  });

  it('displays overall scores correctly', () => {
    const { getByText } = render(
      <NavigationContainer>
        <CropRecommendationResultsScreen />
      </NavigationContainer>
    );

    // Check for rounded scores
    expect(getByText('86')).toBeTruthy(); // Rice: 85.5 rounded
    expect(getByText('78')).toBeTruthy(); // Wheat: 78.2 rounded
    expect(getByText('66')).toBeTruthy(); // Cotton: 65.8 rounded
  });

  it('displays farm conditions correctly', () => {
    const { getByText } = render(
      <NavigationContainer>
        <CropRecommendationResultsScreen />
      </NavigationContainer>
    );

    expect(getByText('🌾 Farm Conditions Used')).toBeTruthy();
    expect(getByText('alluvial')).toBeTruthy();
    expect(getByText('kharif')).toBeTruthy();
    expect(getByText('north')).toBeTruthy();
    expect(getByText('28°C')).toBeTruthy();
    expect(getByText('75%')).toBeTruthy();
    expect(getByText('150mm')).toBeTruthy();
    expect(getByText('6.5')).toBeTruthy();
    expect(getByText('80-45-60')).toBeTruthy(); // NPK values
  });

  it('expands crop details when tapped', async () => {
    const { getByText, queryByText } = render(
      <NavigationContainer>
        <CropRecommendationResultsScreen />
      </NavigationContainer>
    );

    // Initially, detailed scores should not be visible
    expect(queryByText('Detailed Scores')).toBeNull();

    // Tap on Rice card
    const riceCard = getByText('Rice');
    fireEvent.press(riceCard);

    // Wait for expansion
    await waitFor(() => {
      expect(getByText('Detailed Scores')).toBeTruthy();
      expect(getByText('Soil Compatibility')).toBeTruthy();
      expect(getByText('Climate Match')).toBeTruthy();
      expect(getByText('Seasonal Suitability')).toBeTruthy();
      expect(getByText('Market Potential')).toBeTruthy();
    });
  });

  it('displays improvement suggestions when expanded', async () => {
    const { getByText } = render(
      <NavigationContainer>
        <CropRecommendationResultsScreen />
      </NavigationContainer>
    );

    // Tap on Rice card to expand
    const riceCard = getByText('Rice');
    fireEvent.press(riceCard);

    // Wait for suggestions to appear
    await waitFor(() => {
      expect(getByText('💡 Improvement Suggestions')).toBeTruthy();
      expect(getByText('Consider adding organic matter to improve soil health')).toBeTruthy();
      expect(getByText('Monitor water levels during monsoon season')).toBeTruthy();
    });
  });

  it('collapses crop details when tapped again', async () => {
    const { getByText, queryByText } = render(
      <NavigationContainer>
        <CropRecommendationResultsScreen />
      </NavigationContainer>
    );

    const riceCard = getByText('Rice');

    // Expand
    fireEvent.press(riceCard);
    await waitFor(() => {
      expect(getByText('Detailed Scores')).toBeTruthy();
    });

    // Collapse
    fireEvent.press(riceCard);
    await waitFor(() => {
      expect(queryByText('Detailed Scores')).toBeNull();
    });
  });

  it('displays correct ranking numbers', () => {
    const { getByText } = render(
      <NavigationContainer>
        <CropRecommendationResultsScreen />
      </NavigationContainer>
    );

    expect(getByText('#1')).toBeTruthy();
    expect(getByText('#2')).toBeTruthy();
    expect(getByText('#3')).toBeTruthy();
    expect(getByText('#4')).toBeTruthy();
    expect(getByText('#5')).toBeTruthy();
  });

  it('displays source metadata correctly', () => {
    const { getByText } = render(
      <NavigationContainer>
        <CropRecommendationResultsScreen />
      </NavigationContainer>
    );

    expect(getByText(/Source: 🤖 AI Model/)).toBeTruthy();
    expect(getByText(/Generated:/)).toBeTruthy();
  });

  it('handles save button press', () => {
    const { getByText } = render(
      <NavigationContainer>
        <CropRecommendationResultsScreen />
      </NavigationContainer>
    );

    const saveButton = getByText('💾 Save');
    fireEvent.press(saveButton);

    expect(Alert.alert).toHaveBeenCalledWith(
      'Save Recommendations',
      'This feature will allow you to save recommendations for future reference.',
      [{ text: 'OK' }]
    );
  });

  it('handles share button press', () => {
    const { getByText } = render(
      <NavigationContainer>
        <CropRecommendationResultsScreen />
      </NavigationContainer>
    );

    const shareButton = getByText('📤 Share');
    fireEvent.press(shareButton);

    expect(Alert.alert).toHaveBeenCalledWith(
      'Share Recommendations',
      'This feature will allow you to share recommendations with others.',
      [{ text: 'OK' }]
    );
  });

  it('handles new recommendation button press', () => {
    const { getByText } = render(
      <NavigationContainer>
        <CropRecommendationResultsScreen />
      </NavigationContainer>
    );

    const newButton = getByText('🔄 New');
    fireEvent.press(newButton);

    expect(mockGoBack).toHaveBeenCalled();
  });

  it('displays info box with instructions', () => {
    const { getByText } = render(
      <NavigationContainer>
        <CropRecommendationResultsScreen />
      </NavigationContainer>
    );

    expect(
      getByText(/Tap on any crop to view detailed scores and improvement suggestions/)
    ).toBeTruthy();
  });

  it('handles missing improvement suggestions gracefully', async () => {
    const { getByText, queryByText } = render(
      <NavigationContainer>
        <CropRecommendationResultsScreen />
      </NavigationContainer>
    );

    // Tap on Sugarcane (which has no suggestions)
    const sugarcaneCard = getByText('Sugarcane');
    fireEvent.press(sugarcaneCard);

    await waitFor(() => {
      expect(getByText('Detailed Scores')).toBeTruthy();
      // Suggestions section should not appear
      expect(queryByText('💡 Improvement Suggestions')).toBeNull();
    });
  });

  it('displays correct score colors based on value', () => {
    const { getByText } = render(
      <NavigationContainer>
        <CropRecommendationResultsScreen />
      </NavigationContainer>
    );

    // High score (>= 80) should be green
    const riceScore = getByText('86');
    expect(riceScore.props.style).toMatchObject(
      expect.arrayContaining([
        expect.objectContaining({ color: '#2E7D32' }),
      ])
    );

    // Medium score (60-79) should be light green
    const wheatScore = getByText('78');
    expect(wheatScore.props.style).toMatchObject(
      expect.arrayContaining([
        expect.objectContaining({ color: '#689F38' }),
      ])
    );
  });
});

describe('CropRecommendationResultsScreen - Error Handling', () => {
  it('displays error state when no data is provided', () => {
    // Mock useRoute to return no data
    jest.spyOn(require('@react-navigation/native'), 'useRoute').mockReturnValue({
      params: {},
    });

    const { getByText } = render(
      <NavigationContainer>
        <CropRecommendationResultsScreen />
      </NavigationContainer>
    );

    expect(getByText('No recommendation data available. Please try again.')).toBeTruthy();
    expect(getByText('Go Back')).toBeTruthy();
  });

  it('handles retry from error state', () => {
    // Mock useRoute to return no data
    jest.spyOn(require('@react-navigation/native'), 'useRoute').mockReturnValue({
      params: {},
    });

    const { getByText } = render(
      <NavigationContainer>
        <CropRecommendationResultsScreen />
      </NavigationContainer>
    );

    const retryButton = getByText('Go Back');
    fireEvent.press(retryButton);

    expect(mockGoBack).toHaveBeenCalled();
  });
});
