/**
 * Health Service
 * API integration for symptom assessment and first aid with AWS Bedrock AI
 */

import apiClient from './api/client';
import bedrockService from './aws/bedrock-service';
import {
  SymptomAssessmentInput,
  SymptomAssessmentResult,
  PatientInfo,
  SymptomInput,
} from '../types/health';

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

interface SymptomCheckResponse {
  assessment: {
    severity: string;
    possibleConditions: string[];
    firstAidSteps: string[];
    seekHelpIf: string;
    recommendedRemedies: string[];
  };
}

// ============================================================================
// HEALTH SERVICE CLASS
// ============================================================================

class HealthService {
  /**
   * Check symptoms using simple text input with AWS Bedrock AI
   */
  async checkSymptoms(symptoms: string): Promise<SymptomCheckResponse> {
    try {
      // Build AI prompt
      const bedrockRequest = bedrockService.buildHealthAssessmentPrompt({
        symptoms,
      });

      // Invoke Bedrock AI
      const aiResponse = await bedrockService.invoke('health_assessment', bedrockRequest);

      if (aiResponse.success) {
        // Parse AI response
        const assessment = JSON.parse(aiResponse.content);
        
        return {
          assessment: {
            severity: assessment.severity || 'Moderate',
            possibleConditions: assessment.possibleConditions || [],
            firstAidSteps: assessment.firstAidSteps || [],
            seekHelpIf: assessment.seekHelpIf || 'Symptoms worsen or persist',
            recommendedRemedies: assessment.recommendedRemedies || [],
          },
        };
      }

      // If AI failed, use fallback
      return this.getOfflineSymptomCheck(symptoms);
    } catch (error: any) {
      console.error('Error checking symptoms:', error);
      
      // Handle offline mode - return basic assessment
      if (error.message?.includes('Network') || error.message?.includes('timeout')) {
        return this.getOfflineSymptomCheck(symptoms);
      }

      throw new Error(
        error.message || 'Failed to check symptoms. Please check your connection and try again.'
      );
    }
  }

  /**
   * Get natural remedies
   */
  async getRemedies(search?: string): Promise<any[]> {
    try {
      const endpoint = search 
        ? `/api/health/remedies?search=${encodeURIComponent(search)}`
        : '/api/health/remedies';
      
      const response = await apiClient.get<{ remedies: any[] }>(endpoint);

      if (response.success && response.data) {
        return response.data.remedies || [];
      }

      return this.getDefaultRemedies();
    } catch (error) {
      console.error('Error getting remedies:', error);
      return this.getDefaultRemedies();
    }
  }

  /**
   * Assess symptoms and get first aid recommendations (advanced version)
   */
  async assessSymptoms(
    symptoms: SymptomInput[],
    patientInfo: PatientInfo,
    inputMethod: 'voice' | 'text' | 'body_map',
    userId: string = 'user-001'
  ): Promise<SymptomAssessmentResult> {
    try {
      const input: SymptomAssessmentInput = {
        userId,
        symptoms,
        patientInfo,
        inputMethod,
      };

      const response = await apiClient.post<ApiResponse<SymptomAssessmentResult>>(
        '/health/assess-symptoms',
        input
      );

      if (response.success && response.data) {
        return response.data;
      }

      throw new Error(response.error || 'Failed to assess symptoms');
    } catch (error: any) {
      console.error('Error assessing symptoms:', error);
      
      // Handle offline mode - return basic assessment
      if (error.message?.includes('Network') || error.code === 'ECONNABORTED') {
        return this.getOfflineAssessment(symptoms, patientInfo);
      }

      throw new Error(
        error.response?.data?.error ||
        error.message ||
        'Failed to assess symptoms. Please check your connection and try again.'
      );
    }
  }

  /**
   * Record outcome feedback for an assessment
   */
  async recordOutcome(
    assessmentId: string,
    outcome: 'improved' | 'no_change' | 'worsened' | 'sought_medical_help' | 'unknown',
    notes?: string
  ): Promise<void> {
    try {
      const response = await apiClient.post<ApiResponse<void>>(
        `/health/assessment/${assessmentId}/outcome`,
        { outcome, notes }
      );

      if (!response.success) {
        throw new Error(response.error || 'Failed to record outcome');
      }
    } catch (error: any) {
      console.error('Error recording outcome:', error);
      
      // Don't throw error for outcome recording - it's not critical
      // Just log it and continue
      if (!error.message?.includes('Network')) {
        console.warn('Outcome recording failed, will retry later');
      }
    }
  }

  /**
   * Get emergency contacts based on location
   */
  async getEmergencyContacts(latitude?: number, longitude?: number): Promise<any> {
    try {
      const params = latitude && longitude ? { latitude, longitude } : {};
      
      const response = await apiClient.get<ApiResponse<any>>(
        '/health/emergency-contacts',
        params
      );

      if (response.success && response.data) {
        return response.data;
      }

      throw new Error(response.error || 'Failed to get emergency contacts');
    } catch (error: any) {
      console.error('Error getting emergency contacts:', error);
      
      // Return default emergency contacts
      return {
        ambulance: '108',
        nationalEmergency: '112',
        poisonControl: '1800-11-4477',
        womenHelpline: '1091',
        childHelpline: '1098',
      };
    }
  }

  /**
   * Get offline symptom check (fallback when no internet)
   */
  private getOfflineSymptomCheck(symptoms: string): SymptomCheckResponse {
    const lowerSymptoms = symptoms.toLowerCase();
    
    let severity = 'Moderate';
    let possibleConditions = ['Common illness'];
    let firstAidSteps = [
      'Rest in a comfortable position',
      'Stay hydrated',
      'Monitor symptoms for changes',
    ];
    let seekHelpIf = 'Symptoms worsen or persist for more than 24 hours';
    let recommendedRemedies = ['Ginger tea', 'Turmeric milk'];

    // Check for critical symptoms
    if (lowerSymptoms.includes('chest pain') || 
        lowerSymptoms.includes('difficulty breathing') ||
        lowerSymptoms.includes('severe bleeding')) {
      severity = 'Critical';
      possibleConditions = ['Medical Emergency'];
      firstAidSteps = [
        'Call emergency services immediately (108)',
        'Keep the person calm and comfortable',
        'Do not give anything to eat or drink',
      ];
      seekHelpIf = 'Seek immediate medical attention';
      recommendedRemedies = [];
    } else if (lowerSymptoms.includes('fever')) {
      severity = 'Moderate';
      possibleConditions = ['Fever', 'Viral infection'];
      firstAidSteps = [
        'Rest and stay hydrated',
        'Take fever-reducing medication if needed',
        'Use cool compresses',
      ];
      recommendedRemedies = ['Tulsi leaves tea', 'Ginger tea'];
    } else if (lowerSymptoms.includes('headache')) {
      severity = 'Mild';
      possibleConditions = ['Tension headache', 'Dehydration'];
      firstAidSteps = [
        'Rest in a quiet, dark room',
        'Drink plenty of water',
        'Apply cold compress to forehead',
      ];
      recommendedRemedies = ['Ginger tea', 'Peppermint oil'];
    }

    return {
      assessment: {
        severity,
        possibleConditions,
        firstAidSteps,
        seekHelpIf,
        recommendedRemedies,
      },
    };
  }

  /**
   * Get offline assessment (fallback when no internet)
   */
  private getOfflineAssessment(
    symptoms: SymptomInput[],
    patientInfo: PatientInfo
  ): SymptomAssessmentResult {
    // Simple offline risk assessment
    const hasCriticalSymptom = symptoms.some(s => s.severity === 'critical');
    const hasSevereSymptom = symptoms.some(s => s.severity === 'severe');
    
    let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';
    let emergencyCategory: 'minor' | 'non-urgent' | 'urgent' | 'life-threatening' = 'minor';
    
    if (hasCriticalSymptom) {
      riskLevel = 'critical';
      emergencyCategory = 'life-threatening';
    } else if (hasSevereSymptom) {
      riskLevel = 'high';
      emergencyCategory = 'urgent';
    } else if (symptoms.some(s => s.severity === 'moderate')) {
      riskLevel = 'medium';
      emergencyCategory = 'non-urgent';
    }

    const requiresImmediateAttention = riskLevel === 'critical' || emergencyCategory === 'life-threatening';

    return {
      assessmentId: `offline-${Date.now()}`,
      riskAssessment: {
        riskLevel,
        emergencyCategory,
        requiresImmediateAttention,
        confidence: 60, // Lower confidence for offline assessment
      },
      firstAidSteps: requiresImmediateAttention
        ? [
            {
              stepNumber: 1,
              instruction: 'Call emergency services immediately (108)',
              warning: 'This appears to be a medical emergency',
              estimatedTime: 'Immediate',
            },
            {
              stepNumber: 2,
              instruction: 'Keep the person calm and comfortable',
              estimatedTime: '1-2 minutes',
            },
          ]
        : [
            {
              stepNumber: 1,
              instruction: 'Rest in a comfortable position',
              estimatedTime: '5-10 minutes',
            },
            {
              stepNumber: 2,
              instruction: 'Monitor symptoms for any changes',
              estimatedTime: 'Ongoing',
            },
          ],
      redFlags: requiresImmediateAttention
        ? ['Seek immediate medical attention', 'Do not delay treatment']
        : [],
      whenToSeekHelp: requiresImmediateAttention
        ? 'Seek immediate emergency medical attention. Call 108 or go to the nearest emergency room immediately.'
        : 'Monitor symptoms. Seek medical attention if symptoms worsen or persist.',
      recommendedRemedies: [],
      emergencyContacts: requiresImmediateAttention
        ? {
            ambulance: '108',
            nearestHospital: {
              name: 'Nearest Emergency Facility',
              distance: 'Unknown (offline)',
              phone: '108',
            },
          }
        : undefined,
    };
  }

  /**
   * Get default remedies (offline fallback)
   */
  private getDefaultRemedies() {
    return [
      {
        name: 'Ginger Tea',
        condition: 'Cold & Cough',
        efficacy: 92,
        preparation: 'Boil fresh ginger in water for 10 minutes',
        benefits: ['Reduces inflammation', 'Soothes throat', 'Boosts immunity'],
      },
      {
        name: 'Turmeric Milk',
        condition: 'Joint Pain',
        efficacy: 88,
        preparation: 'Mix turmeric powder in warm milk',
        benefits: ['Anti-inflammatory', 'Pain relief', 'Better sleep'],
      },
      {
        name: 'Tulsi Leaves',
        condition: 'Fever',
        efficacy: 85,
        preparation: 'Boil tulsi leaves in water and drink',
        benefits: ['Reduces fever', 'Antibacterial', 'Boosts immunity'],
      },
    ];
  }

  /**
   * Voice-to-text conversion (placeholder for future implementation)
   */
  async convertVoiceToText(audioUri: string): Promise<string> {
    // TODO: Integrate with speech-to-text service
    console.log('Voice to text conversion:', audioUri);
    throw new Error('Voice input not yet implemented');
  }

  /**
   * Get common symptoms for quick selection
   */
  getCommonSymptoms() {
    return [
      { label: 'Fever', value: 'fever', icon: '🌡️' },
      { label: 'Headache', value: 'headache', icon: '🤕' },
      { label: 'Cough', value: 'cough', icon: '😷' },
      { label: 'Sore Throat', value: 'sore_throat', icon: '🗣️' },
      { label: 'Stomach Pain', value: 'stomach_pain', icon: '🤢' },
      { label: 'Nausea', value: 'nausea', icon: '🤮' },
      { label: 'Diarrhea', value: 'diarrhea', icon: '💩' },
      { label: 'Vomiting', value: 'vomiting', icon: '🤮' },
      { label: 'Dizziness', value: 'dizziness', icon: '😵' },
      { label: 'Fatigue', value: 'fatigue', icon: '😴' },
      { label: 'Body Ache', value: 'body_ache', icon: '💪' },
      { label: 'Chest Pain', value: 'chest_pain', icon: '❤️' },
      { label: 'Difficulty Breathing', value: 'difficulty_breathing', icon: '🫁' },
      { label: 'Rash', value: 'rash', icon: '🔴' },
      { label: 'Joint Pain', value: 'joint_pain', icon: '🦴' },
    ];
  }
}

export default new HealthService();
