/**
 * Symptom Assessment Service
 * Handles symptom input, risk assessment, and first aid recommendations
 */

import { v4 as uuidv4 } from 'uuid';

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

export interface SymptomInput {
  symptomName: string;
  severity: 'mild' | 'moderate' | 'severe' | 'critical';
  duration: 'less_than_1_hour' | '1_to_6_hours' | '6_to_24_hours' | '1_to_3_days' | '3_to_7_days' | 'more_than_week';
  bodyPart?: string;
  additionalDetails?: string;
}

export interface PatientInfo {
  age: number;
  gender: 'male' | 'female' | 'other';
  chronicConditions?: string[];
  currentMedications?: string[];
}

export interface SymptomAssessmentInput {
  userId: string;
  symptoms: SymptomInput[];
  patientInfo: PatientInfo;
  inputMethod: 'voice' | 'text' | 'body_map';
}

export interface RiskAssessment {
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  emergencyCategory: 'minor' | 'non-urgent' | 'urgent' | 'life-threatening';
  requiresImmediateAttention: boolean;
  confidence: number;
}

export interface FirstAidStep {
  stepNumber: number;
  instruction: string;
  warning?: string;
  checkpoint?: string;
  estimatedTime?: string;
  requiredMaterials?: string[];
}

export interface SymptomAssessmentResult {
  assessmentId: string;
  riskAssessment: RiskAssessment;
  firstAidSteps: FirstAidStep[];
  redFlags: string[];
  whenToSeekHelp: string;
  recommendedRemedies: string[];
  emergencyContacts?: {
    ambulance: string;
    nearestHospital?: {
      name: string;
      distance: string;
      phone: string;
    };
  };
}

// ============================================================================
// EMERGENCY CLASSIFICATION RULES
// ============================================================================

const LIFE_THREATENING_SYMPTOMS = [
  'chest pain',
  'difficulty breathing',
  'severe bleeding',
  'unconsciousness',
  'seizure',
  'stroke symptoms',
  'severe allergic reaction',
  'poisoning',
  'severe burns',
  'head injury with confusion'
];

const URGENT_SYMPTOMS = [
  'high fever',
  'severe pain',
  'persistent vomiting',
  'severe diarrhea',
  'severe headache',
  'vision problems',
  'severe abdominal pain',
  'broken bone',
  'deep cut'
];

const RED_FLAGS = {
  'chest pain': [
    'Pain radiating to arm, jaw, or back',
    'Shortness of breath',
    'Sweating and nausea',
    'Feeling of impending doom'
  ],
  'difficulty breathing': [
    'Bluish lips or face',
    'Inability to speak in full sentences',
    'Severe wheezing',
    'Rapid breathing'
  ],
  'severe bleeding': [
    'Blood spurting from wound',
    'Bleeding that won\'t stop after 10 minutes of pressure',
    'Large amount of blood loss',
    'Signs of shock (pale, cold, rapid pulse)'
  ],
  'high fever': [
    'Temperature above 103°F (39.4°C)',
    'Fever with stiff neck',
    'Fever with severe headache',
    'Fever with confusion or altered mental state'
  ]
};

// ============================================================================
// SYMPTOM ASSESSMENT SERVICE
// ============================================================================

export class SymptomAssessmentService {
  /**
   * Assess symptoms and provide risk level
   */
  async assessSymptoms(input: SymptomAssessmentInput): Promise<SymptomAssessmentResult> {
    // 1. Classify emergency category
    const emergencyCategory = this.classifyEmergencyCategory(input.symptoms);
    
    // 2. Calculate risk level
    const riskLevel = this.calculateRiskLevel(input.symptoms, input.patientInfo);
    
    // 3. Determine if immediate attention is required
    const requiresImmediateAttention = emergencyCategory === 'life-threatening' || riskLevel === 'critical';
    
    // 4. Get first aid steps
    const firstAidSteps = await this.getFirstAidSteps(input.symptoms, emergencyCategory);
    
    // 5. Get red flags
    const redFlags = this.getRedFlags(input.symptoms);
    
    // 6. Get when to seek help guidance
    const whenToSeekHelp = this.getWhenToSeekHelp(emergencyCategory, riskLevel);
    
    // 7. Get recommended remedies (only for non-emergency cases)
    const recommendedRemedies = requiresImmediateAttention ? [] : await this.getRecommendedRemedies(input.symptoms);
    
    // 8. Get emergency contacts if critical
    const emergencyContacts = requiresImmediateAttention ? this.getEmergencyContacts() : undefined;
    
    const assessmentId = uuidv4();
    
    const riskAssessment: RiskAssessment = {
      riskLevel,
      emergencyCategory,
      requiresImmediateAttention,
      confidence: this.calculateConfidence(input.symptoms)
    };
    
    return {
      assessmentId,
      riskAssessment,
      firstAidSteps,
      redFlags,
      whenToSeekHelp,
      recommendedRemedies,
      emergencyContacts
    };
  }
  
  /**
   * Classify emergency category based on symptoms
   * Property 17: Emergency Category Classification
   */
  private classifyEmergencyCategory(symptoms: SymptomInput[]): 'minor' | 'non-urgent' | 'urgent' | 'life-threatening' {
    // Check for life-threatening symptoms
    for (const symptom of symptoms) {
      const symptomLower = symptom.symptomName.toLowerCase();
      
      if (LIFE_THREATENING_SYMPTOMS.some(ls => symptomLower.includes(ls))) {
        return 'life-threatening';
      }
      
      // Critical severity is always urgent or life-threatening
      if (symptom.severity === 'critical') {
        return 'life-threatening';
      }
    }
    
    // Check for urgent symptoms
    for (const symptom of symptoms) {
      const symptomLower = symptom.symptomName.toLowerCase();
      
      if (URGENT_SYMPTOMS.some(us => symptomLower.includes(us))) {
        return 'urgent';
      }
      
      // Severe symptoms are urgent
      if (symptom.severity === 'severe') {
        return 'urgent';
      }
    }
    
    // Check if symptoms are moderate and recent
    const hasModerateRecent = symptoms.some(s => 
      s.severity === 'moderate' && 
      (s.duration === 'less_than_1_hour' || s.duration === '1_to_6_hours')
    );
    
    if (hasModerateRecent) {
      return 'non-urgent';
    }
    
    return 'minor';
  }
  
  /**
   * Calculate risk level based on symptoms, severity, duration, and patient age
   * Property 18: Risk Level Calculation
   */
  private calculateRiskLevel(symptoms: SymptomInput[], patientInfo: PatientInfo): 'low' | 'medium' | 'high' | 'critical' {
    let riskScore = 0;
    
    // Factor 1: Symptom severity
    for (const symptom of symptoms) {
      switch (symptom.severity) {
        case 'critical':
          riskScore += 40;
          break;
        case 'severe':
          riskScore += 30;
          break;
        case 'moderate':
          riskScore += 15;
          break;
        case 'mild':
          riskScore += 5;
          break;
      }
    }
    
    // Factor 2: Duration (longer duration increases risk)
    const maxDuration = symptoms.reduce((max, s) => {
      const durationScore = this.getDurationScore(s.duration);
      return Math.max(max, durationScore);
    }, 0);
    riskScore += maxDuration;
    
    // Factor 3: Patient age (very young or elderly are higher risk)
    if (patientInfo.age < 5 || patientInfo.age > 65) {
      riskScore += 15;
    } else if (patientInfo.age < 12 || patientInfo.age > 55) {
      riskScore += 10;
    }
    
    // Factor 4: Chronic conditions
    if (patientInfo.chronicConditions && patientInfo.chronicConditions.length > 0) {
      riskScore += patientInfo.chronicConditions.length * 5;
    }
    
    // Factor 5: Multiple symptoms
    if (symptoms.length > 3) {
      riskScore += 10;
    }
    
    // Classify risk level based on score
    if (riskScore >= 70) return 'critical';
    if (riskScore >= 45) return 'high';
    if (riskScore >= 25) return 'medium';
    return 'low';
  }
  
  private getDurationScore(duration: string): number {
    switch (duration) {
      case 'more_than_week': return 20;
      case '3_to_7_days': return 15;
      case '1_to_3_days': return 10;
      case '6_to_24_hours': return 5;
      case '1_to_6_hours': return 3;
      case 'less_than_1_hour': return 1;
      default: return 0;
    }
  }
  
  /**
   * Get first aid steps for symptoms
   */
  private async getFirstAidSteps(_symptoms: SymptomInput[], emergencyCategory: string): Promise<FirstAidStep[]> {
    // This would query the first_aid_protocols table
    // For now, return basic steps based on emergency category
    
    if (emergencyCategory === 'life-threatening') {
      return [
        {
          stepNumber: 1,
          instruction: 'Call emergency services immediately (108 or local emergency number)',
          warning: 'Do not delay - this is a medical emergency',
          estimatedTime: 'Immediate'
        },
        {
          stepNumber: 2,
          instruction: 'Keep the person calm and comfortable',
          checkpoint: 'Check if person is conscious and breathing',
          estimatedTime: '1-2 minutes'
        },
        {
          stepNumber: 3,
          instruction: 'Do not give anything to eat or drink',
          warning: 'This could cause complications',
          estimatedTime: 'Ongoing'
        },
        {
          stepNumber: 4,
          instruction: 'Monitor vital signs until help arrives',
          checkpoint: 'Check breathing and pulse every 2 minutes',
          estimatedTime: 'Until help arrives'
        }
      ];
    }
    
    // Return generic first aid steps for non-emergency cases
    return [
      {
        stepNumber: 1,
        instruction: 'Rest in a comfortable position',
        estimatedTime: '5-10 minutes'
      },
      {
        stepNumber: 2,
        instruction: 'Monitor symptoms for any changes',
        checkpoint: 'Note if symptoms worsen',
        estimatedTime: 'Ongoing'
      },
      {
        stepNumber: 3,
        instruction: 'Stay hydrated with water or oral rehydration solution',
        estimatedTime: 'Throughout the day'
      }
    ];
  }
  
  /**
   * Get red flag symptoms that require immediate medical attention
   */
  private getRedFlags(symptoms: SymptomInput[]): string[] {
    const redFlags: string[] = [];
    
    for (const symptom of symptoms) {
      const symptomLower = symptom.symptomName.toLowerCase();
      
      for (const [key, flags] of Object.entries(RED_FLAGS)) {
        if (symptomLower.includes(key)) {
          redFlags.push(...flags);
        }
      }
    }
    
    return [...new Set(redFlags)]; // Remove duplicates
  }
  
  /**
   * Get guidance on when to seek medical help
   */
  private getWhenToSeekHelp(emergencyCategory: string, riskLevel: string): string {
    if (emergencyCategory === 'life-threatening' || riskLevel === 'critical') {
      return 'Seek immediate emergency medical attention. Call 108 or go to the nearest emergency room immediately.';
    }
    
    if (emergencyCategory === 'urgent' || riskLevel === 'high') {
      return 'Seek medical attention within the next few hours. Visit a doctor or urgent care facility today.';
    }
    
    if (riskLevel === 'medium') {
      return 'Schedule a doctor\'s appointment within 24-48 hours if symptoms persist or worsen.';
    }
    
    return 'Monitor symptoms. Seek medical attention if symptoms worsen or persist for more than a few days.';
  }
  
  /**
   * Get recommended natural remedies for non-emergency symptoms
   */
  private async getRecommendedRemedies(_symptoms: SymptomInput[]): Promise<string[]> {
    // This would query the natural_remedies table
    // For now, return empty array (will be implemented in remedy service)
    return [];
  }
  
  /**
   * Get emergency contacts
   * Property 19: Critical Risk Response
   */
  private getEmergencyContacts() {
    return {
      ambulance: '108',
      nearestHospital: {
        name: 'Nearest Primary Health Center',
        distance: 'Location-based (to be implemented)',
        phone: 'To be determined based on location'
      }
    };
  }
  
  /**
   * Calculate confidence score for the assessment
   */
  private calculateConfidence(symptoms: SymptomInput[]): number {
    // Base confidence
    let confidence = 70;
    
    // More symptoms = higher confidence
    if (symptoms.length >= 3) {
      confidence += 10;
    }
    
    // Detailed symptoms = higher confidence
    const hasDetails = symptoms.some(s => s.additionalDetails && s.additionalDetails.length > 20);
    if (hasDetails) {
      confidence += 10;
    }
    
    // Severity specified = higher confidence
    const hasSeverity = symptoms.every(s => s.severity);
    if (hasSeverity) {
      confidence += 10;
    }
    
    return Math.min(confidence, 95); // Cap at 95%
  }
  
  /**
   * Save assessment to database
   */
  async saveAssessment(assessment: SymptomAssessmentResult, _input: SymptomAssessmentInput): Promise<void> {
    // This would save to symptom_assessments table
    // Implementation will be added when database connection is set up
    console.log('Assessment saved:', assessment.assessmentId);
  }
  
  /**
   * Record outcome feedback
   */
  async recordOutcome(
    assessmentId: string,
    outcome: 'improved' | 'no_change' | 'worsened' | 'sought_medical_help' | 'unknown',
    _notes?: string
  ): Promise<void> {
    // This would update the symptom_assessments table
    console.log('Outcome recorded for assessment:', assessmentId, outcome);
  }
}

export const symptomAssessmentService = new SymptomAssessmentService();
