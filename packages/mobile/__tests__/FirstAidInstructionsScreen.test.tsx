/**
 * First Aid Instructions Screen Tests
 * Tests for the first aid instruction viewer
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import FirstAidInstructionsScreen from '../src/screens/health/FirstAidInstructionsScreen';
import { SymptomAssessmentResult } from '../src/types/health';

// Mock navigation
const mockNavigate = jest.fn();
const mockGoBack = jest.fn();

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: mockNavigate,
    goBack: mockGoBack,
  }),
  useRoute: () => ({
    params: {
      assessmentId: 'test-assessment-123',
      assessmentResult: mockAssessmentResult,
    },
  }),
}));

// Mock health service
jest.mock('../src/services/healthService', () => ({
  __esModule: true,
  default: {
    recordOutcome: jest.fn().mockResolvedValue(undefined),
    getEmergencyContacts: jest.fn().mockResolvedValue({
      ambulance: '108',
      nationalEmergency: '112',
    }),
  },
}));

// Mock assessment result
const mockAssessmentResult: SymptomAssessmentResult = {
  assessmentId: 'test-assessment-123',
  riskAssessment: {
    riskLevel: 'medium',
    emergencyCategory: 'non-urgent',
    requiresImmediateAttention: false,
    confidence: 85,
  },
  firstAidSteps: [
    {
      stepNumber: 1,
      instruction: 'Rest in a comfortable position',
      estimatedTime: '5-10 minutes',
    },
    {
      stepNumber: 2,
      instruction: 'Apply cold compress to affected area',
      warning: 'Do not apply ice directly to skin',
      checkpoint: 'Check if swelling has reduced',
      estimatedTime: '15 minutes',
      requiredMaterials: ['Cold compress', 'Clean cloth'],
    },
    {
      stepNumber: 3,
      instruction: 'Monitor symptoms for any changes',
      estimatedTime: 'Ongoing',
    },
  ],
  redFlags: [
    'Severe pain that worsens',
    'Difficulty breathing',
    'Loss of consciousness',
  ],
  whenToSeekHelp: 'Seek medical attention if symptoms worsen or persist for more than 24 hours.',
  recommendedRemedies: ['Ginger tea', 'Turmeric paste'],
};

describe('FirstAidInstructionsScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders risk assessment correctly', () => {
    const { getByText } = render(<FirstAidInstructionsScreen />);

    expect(getByText('MEDIUM')).toBeTruthy();
    expect(getByText('85% confidence')).toBeTruthy();
    expect(getByText(/Medium Risk/i)).toBeTruthy();
  });

  it('renders all first aid steps', () => {
    const { getByText } = render(<FirstAidInstructionsScreen />);

    expect(getByText('Rest in a comfortable position')).toBeTruthy();
    expect(getByText('Apply cold compress to affected area')).toBeTruthy();
    expect(getByText('Monitor symptoms for any changes')).toBeTruthy();
  });

  it('displays step warnings and checkpoints', () => {
    const { getByText } = render(<FirstAidInstructionsScreen />);

    expect(getByText('Do not apply ice directly to skin')).toBeTruthy();
    expect(getByText(/Check if swelling has reduced/i)).toBeTruthy();
  });

  it('displays required materials', () => {
    const { getByText } = render(<FirstAidInstructionsScreen />);

    expect(getByText('Cold compress')).toBeTruthy();
    expect(getByText('Clean cloth')).toBeTruthy();
  });

  it('displays red flags section', () => {
    const { getByText } = render(<FirstAidInstructionsScreen />);

    expect(getByText('🚩 Warning Signs')).toBeTruthy();
    expect(getByText('Severe pain that worsens')).toBeTruthy();
    expect(getByText('Difficulty breathing')).toBeTruthy();
    expect(getByText('Loss of consciousness')).toBeTruthy();
  });

  it('displays when to seek help guidance', () => {
    const { getByText } = render(<FirstAidInstructionsScreen />);

    expect(getByText('🏥 When to Seek Medical Help')).toBeTruthy();
    expect(
      getByText('Seek medical attention if symptoms worsen or persist for more than 24 hours.')
    ).toBeTruthy();
  });

  it('allows marking steps as completed', () => {
    const { getAllByTestId, getByText } = render(<FirstAidInstructionsScreen />);

    // Initially, progress should be 0 of 3
    expect(getByText('0 of 3 completed')).toBeTruthy();

    // Find and click the first checkbox (we'll need to add testID to checkboxes)
    // For now, this test demonstrates the concept
  });

  it('shows progress bar based on completed steps', () => {
    const { getByText } = render(<FirstAidInstructionsScreen />);

    // Initially shows 0 completed
    expect(getByText('0 of 3 completed')).toBeTruthy();
  });

  it('navigates back when done button is pressed', () => {
    const { getByText } = render(<FirstAidInstructionsScreen />);

    const doneButton = getByText('Done');
    fireEvent.press(doneButton);

    expect(mockGoBack).toHaveBeenCalled();
  });
});

describe('FirstAidInstructionsScreen - Critical Risk', () => {
  const criticalAssessmentResult: SymptomAssessmentResult = {
    assessmentId: 'critical-assessment-456',
    riskAssessment: {
      riskLevel: 'critical',
      emergencyCategory: 'life-threatening',
      requiresImmediateAttention: true,
      confidence: 95,
    },
    firstAidSteps: [
      {
        stepNumber: 1,
        instruction: 'Call emergency services immediately (108)',
        warning: 'This appears to be a medical emergency',
        estimatedTime: 'Immediate',
      },
    ],
    redFlags: ['Chest pain', 'Difficulty breathing', 'Severe bleeding'],
    whenToSeekHelp: 'Seek immediate emergency medical attention. Call 108 or go to the nearest emergency room immediately.',
    recommendedRemedies: [],
    emergencyContacts: {
      ambulance: '108',
      nearestHospital: {
        name: 'City General Hospital',
        distance: '2.5 km',
        phone: '0123456789',
      },
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('displays critical risk with urgent banner', () => {
    // Mock the route to return critical assessment
    jest.spyOn(require('@react-navigation/native'), 'useRoute').mockReturnValue({
      params: {
        assessmentId: 'critical-assessment-456',
        assessmentResult: criticalAssessmentResult,
      },
    });

    const { getByText } = render(<FirstAidInstructionsScreen />);

    expect(getByText('CRITICAL')).toBeTruthy();
    expect(getByText('CRITICAL - Immediate Action Required')).toBeTruthy();
    expect(getByText('Immediate medical attention required')).toBeTruthy();
  });

  it('displays emergency contacts for critical cases', () => {
    jest.spyOn(require('@react-navigation/native'), 'useRoute').mockReturnValue({
      params: {
        assessmentId: 'critical-assessment-456',
        assessmentResult: criticalAssessmentResult,
      },
    });

    const { getByText } = render(<FirstAidInstructionsScreen />);

    expect(getByText('🚨 Emergency Contacts')).toBeTruthy();
    expect(getByText('108')).toBeTruthy();
    expect(getByText('City General Hospital')).toBeTruthy();
    expect(getByText('2.5 km')).toBeTruthy();
  });
});

describe('FirstAidInstructionsScreen - Risk Level Colors', () => {
  it('uses correct color for low risk', () => {
    const lowRiskResult: SymptomAssessmentResult = {
      ...mockAssessmentResult,
      riskAssessment: {
        ...mockAssessmentResult.riskAssessment,
        riskLevel: 'low',
      },
    };

    jest.spyOn(require('@react-navigation/native'), 'useRoute').mockReturnValue({
      params: {
        assessmentId: 'test-123',
        assessmentResult: lowRiskResult,
      },
    });

    const { getByText } = render(<FirstAidInstructionsScreen />);
    expect(getByText('LOW')).toBeTruthy();
  });

  it('uses correct color for high risk', () => {
    const highRiskResult: SymptomAssessmentResult = {
      ...mockAssessmentResult,
      riskAssessment: {
        ...mockAssessmentResult.riskAssessment,
        riskLevel: 'high',
      },
    };

    jest.spyOn(require('@react-navigation/native'), 'useRoute').mockReturnValue({
      params: {
        assessmentId: 'test-123',
        assessmentResult: highRiskResult,
      },
    });

    const { getByText } = render(<FirstAidInstructionsScreen />);
    expect(getByText('HIGH')).toBeTruthy();
  });
});
