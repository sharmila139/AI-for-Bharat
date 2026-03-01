/**
 * Navigation Type Definitions
 * Type-safe navigation for RuralConnect AI
 */

import { NavigatorScreenParams } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';

// Root Stack Navigator - Handles authentication flow
export type RootStackParamList = {
  Splash: undefined;
  Onboarding: undefined;
  Auth: NavigatorScreenParams<AuthStackParamList>;
  Main: NavigatorScreenParams<MainTabParamList>;
};

// Auth Stack Navigator - Login/Signup flow
export type AuthStackParamList = {
  PhoneInput: undefined;
  OTPVerification: { phoneNumber: string };
  ProfileSetup: { userId: string };
};

// Main Tab Navigator - Bottom tabs for 4 modules + Dashboard
export type MainTabParamList = {
  MainTabs: undefined;
  Dashboard: undefined;
  AgricultureTab: NavigatorScreenParams<AgricultureStackParamList>;
  HealthTab: NavigatorScreenParams<HealthStackParamList>;
  EducationTab: NavigatorScreenParams<EducationStackParamList>;
  InfrastructureTab: NavigatorScreenParams<InfrastructureStackParamList>;
  Settings: undefined;
  Profile: undefined;
  AppSettings: undefined;
  NotificationSettings: undefined;
  LanguageSettings: undefined;
  AccessibilitySettings: undefined;
  About: undefined;
  HelpSupport: undefined;
};

// Agriculture Stack Navigator
export type AgricultureStackParamList = {
  AgricultureHome: undefined;
  FarmProfileList: undefined;
  FarmProfileDetail: { farmId: string };
  FarmProfileForm: { mode: 'create' | 'edit'; farmId?: string };
  CropRecommendationInput: undefined;
  CropRecommendationResults: { data: any }; // CropRecommendationResponse
  CropRecommendation: undefined;
  SoilAnalysis: undefined;
  SoilHealthCardOCR: undefined;
  SoilHealthReport: { reportId: string };
  IrrigationSchedule: { farmId?: string };
  WeatherDashboard: undefined;
  WeatherAlerts: undefined;
  KnowledgeBaseSearch: undefined;
  ArticleDetail: { articleId: string };
  CropRotationPlan: { farmId?: string };
};

// Health Stack Navigator
export type HealthStackParamList = {
  HealthHome: undefined;
  SymptomInput: undefined;
  FirstAid: undefined;
  FirstAidInstructions: { 
    assessmentId: string; 
    assessmentResult?: any; // SymptomAssessmentResult
  };
  RemedySearch: undefined;
  RemedyDetail: { remedyId: string };
  NutritionTracking: undefined;
  EmergencyContacts: undefined;
};

// Education Stack Navigator
export type EducationStackParamList = {
  EducationHome: undefined;
  StudentProfile: undefined;
  DiagnosticAssessment: { studentId: string };
  ContentLibrary: { studentId?: string };
  ContentViewer: { contentId: string; content?: any };
  VideoPlayer: { contentId: string };
  Quiz: { quizId: string; studentId: string; topicId: string };
  Progress: undefined;
};

// Infrastructure Stack Navigator
export type InfrastructureStackParamList = {
  InfrastructureHome: undefined;
  GrievanceReport: undefined;
  GrievanceTracking: undefined;
  GrievanceDetail: { grievanceId: string };
  CommunityPolls: undefined;
  PollDetail: { pollId: string };
  ProjectProgress: undefined;
  ProjectDetail: { projectId: string };
};

// Navigation prop types for type-safe navigation
export type RootStackNavigationProp = StackNavigationProp<RootStackParamList>;
export type AuthStackNavigationProp = StackNavigationProp<AuthStackParamList>;
export type MainTabNavigationProp = BottomTabNavigationProp<MainTabParamList>;
export type AgricultureStackNavigationProp = StackNavigationProp<AgricultureStackParamList>;
export type HealthStackNavigationProp = StackNavigationProp<HealthStackParamList>;
export type EducationStackNavigationProp = StackNavigationProp<EducationStackParamList>;
export type InfrastructureStackNavigationProp = StackNavigationProp<InfrastructureStackParamList>;

// Deep linking configuration
export const linking = {
  prefixes: ['ruralconnect://', 'https://ruralconnect.app'],
  config: {
    screens: {
      Splash: 'splash',
      Onboarding: 'onboarding',
      Auth: {
        screens: {
          PhoneInput: 'login',
          OTPVerification: 'verify',
          ProfileSetup: 'setup',
        },
      },
      Main: {
        screens: {
          Dashboard: 'home',
          AgricultureTab: {
            screens: {
              AgricultureHome: 'agriculture',
              FarmProfileList: 'agriculture/farms',
              FarmProfileDetail: 'agriculture/farm/:farmId',
              FarmProfileForm: 'agriculture/farm/form',
              CropRecommendationInput: 'agriculture/crop-recommendation',
              CropRecommendationResults: 'agriculture/crop-recommendation/results',
              CropRecommendation: 'agriculture/crop-recommendation/legacy',
              SoilAnalysis: 'agriculture/soil-analysis',
              WeatherDashboard: 'agriculture/weather',
              KnowledgeBaseSearch: 'agriculture/knowledge-base',
              ArticleDetail: 'agriculture/article/:articleId',
            },
          },
          HealthTab: {
            screens: {
              HealthHome: 'health',
              RemedySearch: 'health/remedies',
              RemedyDetail: 'health/remedy/:remedyId',
              NutritionTracking: 'health/nutrition',
              FirstAid: 'health/first-aid',
            },
          },
          EducationTab: {
            screens: {
              EducationHome: 'education',
              ContentLibrary: 'education/library',
              VideoPlayer: 'education/video/:contentId',
              Quiz: 'education/quiz/:quizId',
              Progress: 'education/progress',
            },
          },
          InfrastructureTab: {
            screens: {
              InfrastructureHome: 'infrastructure',
              GrievanceReport: 'infrastructure/report',
              GrievanceTracking: 'infrastructure/grievances',
              GrievanceDetail: 'infrastructure/grievance/:grievanceId',
              CommunityPolls: 'infrastructure/polls',
              PollDetail: 'infrastructure/poll/:pollId',
              ProjectProgress: 'infrastructure/projects',
              ProjectDetail: 'infrastructure/project/:projectId',
            },
          },
        },
      },
    },
  },
};
