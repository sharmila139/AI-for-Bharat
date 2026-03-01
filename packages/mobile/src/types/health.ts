/**
 * Health Module Type Definitions
 * Types for symptom assessment, first aid, and health tracking
 */

// ============================================================================
// SYMPTOM INPUT TYPES
// ============================================================================

export type SymptomSeverity = 'mild' | 'moderate' | 'severe' | 'critical';

export type SymptomDuration =
  | 'less_than_1_hour'
  | '1_to_6_hours'
  | '6_to_24_hours'
  | '1_to_3_days'
  | '3_to_7_days'
  | 'more_than_week';

export type InputMethod = 'voice' | 'text' | 'body_map';

export interface SymptomInput {
  symptomName: string;
  severity: SymptomSeverity;
  duration: SymptomDuration;
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
  inputMethod: InputMethod;
}

// ============================================================================
// ASSESSMENT RESULT TYPES
// ============================================================================

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';
export type EmergencyCategory = 'minor' | 'non-urgent' | 'urgent' | 'life-threatening';

export interface RiskAssessment {
  riskLevel: RiskLevel;
  emergencyCategory: EmergencyCategory;
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

export interface EmergencyContact {
  ambulance: string;
  nearestHospital?: {
    name: string;
    distance: string;
    phone: string;
  };
}

export interface SymptomAssessmentResult {
  assessmentId: string;
  riskAssessment: RiskAssessment;
  firstAidSteps: FirstAidStep[];
  redFlags: string[];
  whenToSeekHelp: string;
  recommendedRemedies: string[];
  emergencyContacts?: EmergencyContact;
}

// ============================================================================
// BODY MAP TYPES
// ============================================================================

export type BodyPart =
  | 'head'
  | 'neck'
  | 'chest'
  | 'abdomen'
  | 'back'
  | 'left_arm'
  | 'right_arm'
  | 'left_leg'
  | 'right_leg'
  | 'left_hand'
  | 'right_hand'
  | 'left_foot'
  | 'right_foot';

export interface BodyMapSelection {
  bodyPart: BodyPart;
  symptomType: string;
  severity: SymptomSeverity;
}

// ============================================================================
// COMMON SYMPTOMS
// ============================================================================

export const COMMON_SYMPTOMS = [
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

export const SEVERITY_OPTIONS: { label: string; value: SymptomSeverity; color: string }[] = [
  { label: 'Mild', value: 'mild', color: '#4CAF50' },
  { label: 'Moderate', value: 'moderate', color: '#FF9800' },
  { label: 'Severe', value: 'severe', color: '#F44336' },
  { label: 'Critical', value: 'critical', color: '#B71C1C' },
];

export const DURATION_OPTIONS: { label: string; value: SymptomDuration }[] = [
  { label: 'Less than 1 hour', value: 'less_than_1_hour' },
  { label: '1-6 hours', value: '1_to_6_hours' },
  { label: '6-24 hours', value: '6_to_24_hours' },
  { label: '1-3 days', value: '1_to_3_days' },
  { label: '3-7 days', value: '3_to_7_days' },
  { label: 'More than a week', value: 'more_than_week' },
];

// ============================================================================
// BODY PARTS MAPPING
// ============================================================================

export const BODY_PARTS_MAP: { [key in BodyPart]: string } = {
  head: 'Head',
  neck: 'Neck',
  chest: 'Chest',
  abdomen: 'Abdomen',
  back: 'Back',
  left_arm: 'Left Arm',
  right_arm: 'Right Arm',
  left_leg: 'Left Leg',
  right_leg: 'Right Leg',
  left_hand: 'Left Hand',
  right_hand: 'Right Hand',
  left_foot: 'Left Foot',
  right_foot: 'Right Foot',
};

// ============================================================================
// EMERGENCY CONTACT TYPES
// ============================================================================

export type EmergencyContactType =
  | 'family'
  | 'doctor'
  | 'hospital'
  | 'ambulance'
  | 'police'
  | 'fire_department'
  | 'other';

export interface EmergencyContactInfo {
  id: string;
  name: string;
  relationship: string;
  phoneNumber: string;
  contactType: EmergencyContactType;
  isPrimary: boolean;
  createdAt: string;
  updatedAt: string;
}

export const CONTACT_TYPE_OPTIONS: { label: string; value: EmergencyContactType; icon: string }[] = [
  { label: 'Family Member', value: 'family', icon: '👨‍👩‍👧‍👦' },
  { label: 'Doctor', value: 'doctor', icon: '👨‍⚕️' },
  { label: 'Hospital', value: 'hospital', icon: '🏥' },
  { label: 'Ambulance', value: 'ambulance', icon: '🚑' },
  { label: 'Police', value: 'police', icon: '👮' },
  { label: 'Fire Department', value: 'fire_department', icon: '🚒' },
  { label: 'Other', value: 'other', icon: '📞' },
];
