/**
 * Health Service
 * API integration for symptom assessment and first aid
 */

import apiClient from '../config/api';
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

// ============================================================================
// HEALTH SERVICE CLASS
// ============================================================================

class HealthService {
  /**
   * Assess symptoms and get first aid recommendations
   */
  async assessSymptoms(
    symptoms: SymptomInput[],
    patientInfo: PatientInfo,
    inputMethod: 'voice' | 'text' | 'body_map',
    userId: string = 'user-001' // TODO: Get from auth context
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

      if (response.data.success && response.data.data) {
        return response.data.data;
      }

      throw new Error(response.data.error || 'Failed to assess symptoms');
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

      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to record outcome');
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
        { params }
      );

      if (response.data.success && response.data.data) {
        return response.data.data;
      }

      throw new Error(response.data.error || 'Failed to get emergency contacts');
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
