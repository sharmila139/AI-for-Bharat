/**
 * Education Module Type Definitions
 * Types for student profiles, diagnostic assessments, and knowledge tracking
 */

// ============================================================================
// STUDENT PROFILE TYPES
// ============================================================================

export type GradeLevel = 
  | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | '11' | '12';

export type Subject = 
  | 'mathematics'
  | 'science'
  | 'english'
  | 'hindi'
  | 'social_studies'
  | 'computer_science';

export type LearningStyle = 'visual' | 'auditory' | 'kinesthetic' | 'mixed';

export interface StudentProfile {
  id: string;
  userId: string;
  name: string;
  age: number;
  gradeLevel: GradeLevel;
  subjects: Subject[];
  learningStyle: LearningStyle;
  preferredLanguage: string;
  createdAt: string;
  updatedAt: string;
}

export interface StudentProfileInput {
  userId: string;
  name: string;
  age: number;
  gradeLevel: GradeLevel;
  subjects: Subject[];
  learningStyle: LearningStyle;
  preferredLanguage: string;
}

// ============================================================================
// DIAGNOSTIC ASSESSMENT TYPES
// ============================================================================

export type QuestionType = 'multiple_choice' | 'true_false' | 'fill_blank' | 'short_answer';

export type DifficultyLevel = 'easy' | 'medium' | 'hard';

export interface AssessmentQuestion {
  id: string;
  topicId: string;
  topicName: string;
  question: string;
  questionType: QuestionType;
  options?: string[]; // For multiple choice
  correctAnswer: string | number;
  difficulty: DifficultyLevel;
  points: number;
}

export interface AssessmentResponse {
  questionId: string;
  answer: string | number;
  timeSpent: number; // in seconds
}

export interface DiagnosticAssessmentInput {
  studentId: string;
  subjectId: Subject;
  responses: AssessmentResponse[];
}

export interface DiagnosticAssessmentResult {
  assessmentId: string;
  studentId: string;
  subjectId: Subject;
  totalQuestions: number;
  correctAnswers: number;
  score: number; // percentage
  topicScores: TopicScore[];
  knowledgeState: KnowledgeState[];
  recommendations: string[];
  completedAt: string;
}

export interface TopicScore {
  topicId: string;
  topicName: string;
  questionsAttempted: number;
  correctAnswers: number;
  proficiency: number; // 0-100
}

// ============================================================================
// KNOWLEDGE STATE TYPES
// ============================================================================

export type KnowledgeStatus = 'not-started' | 'learning' | 'practicing' | 'mastered';

export interface KnowledgeState {
  studentId: string;
  topicId: string;
  topicName: string;
  subjectId: Subject;
  proficiency: number; // 0-100
  status: KnowledgeStatus;
  lastPracticed?: string;
  totalAttempts: number;
  successRate: number; // percentage
  updatedAt: string;
}

export interface KnowledgeStateUpdate {
  topicId: string;
  proficiency: number;
  status: KnowledgeStatus;
  correctAnswers: number;
  totalQuestions: number;
}

// ============================================================================
// QUIZ TYPES
// ============================================================================

export interface QuizResult {
  quizId: string;
  studentId: string;
  topicId: string;
  score: number; // percentage
  correctAnswers: number;
  totalQuestions: number;
  timeSpent: number; // in seconds
  responses: AssessmentResponse[];
  completedAt: string;
}

export interface Intervention {
  type: 'alternate_teaching' | 'prerequisite_review' | 'micro_learning';
  reason: string;
  recommendedContent: string[];
  message: string;
}

export interface Acceleration {
  enabled: boolean;
  reason: string;
  nextLevel: string;
  message: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

export const GRADE_LEVELS: { label: string; value: GradeLevel }[] = [
  { label: 'Class 1', value: '1' },
  { label: 'Class 2', value: '2' },
  { label: 'Class 3', value: '3' },
  { label: 'Class 4', value: '4' },
  { label: 'Class 5', value: '5' },
  { label: 'Class 6', value: '6' },
  { label: 'Class 7', value: '7' },
  { label: 'Class 8', value: '8' },
  { label: 'Class 9', value: '9' },
  { label: 'Class 10', value: '10' },
  { label: 'Class 11', value: '11' },
  { label: 'Class 12', value: '12' },
];

export const SUBJECTS: { label: string; value: Subject; icon: string }[] = [
  { label: 'Mathematics', value: 'mathematics', icon: '🔢' },
  { label: 'Science', value: 'science', icon: '🔬' },
  { label: 'English', value: 'english', icon: '📚' },
  { label: 'Hindi', value: 'hindi', icon: '🇮🇳' },
  { label: 'Social Studies', value: 'social_studies', icon: '🌍' },
  { label: 'Computer Science', value: 'computer_science', icon: '💻' },
];

export const LEARNING_STYLES: { label: string; value: LearningStyle; description: string }[] = [
  { 
    label: 'Visual', 
    value: 'visual', 
    description: 'Learn best through images, diagrams, and videos' 
  },
  { 
    label: 'Auditory', 
    value: 'auditory', 
    description: 'Learn best through listening and discussions' 
  },
  { 
    label: 'Kinesthetic', 
    value: 'kinesthetic', 
    description: 'Learn best through hands-on activities and practice' 
  },
  { 
    label: 'Mixed', 
    value: 'mixed', 
    description: 'Combination of all learning styles' 
  },
];

export const KNOWLEDGE_STATUS_COLORS: { [key in KnowledgeStatus]: string } = {
  'not-started': '#9E9E9E',
  'learning': '#2196F3',
  'practicing': '#FF9800',
  'mastered': '#4CAF50',
};

export const PROFICIENCY_LEVELS = [
  { min: 0, max: 25, label: 'Beginner', color: '#F44336' },
  { min: 26, max: 50, label: 'Developing', color: '#FF9800' },
  { min: 51, max: 75, label: 'Proficient', color: '#2196F3' },
  { min: 76, max: 100, label: 'Advanced', color: '#4CAF50' },
];

// ============================================================================
// CONTENT LIBRARY TYPES
// ============================================================================

export type ContentType = 'video' | 'simulation' | 'game' | 'article';

export interface ContentItem {
  id: string;
  title: string;
  description: string;
  subject: Subject;
  topic: string;
  gradeLevel: GradeLevel;
  difficulty: DifficultyLevel;
  contentType: ContentType;
  duration: number; // in minutes
  thumbnailUrl?: string;
  videoUrl?: string;
  language: string;
  viewCount: number;
  rating: number; // 0-5
  isOfflineAvailable: boolean;
  prerequisiteTopics?: string[];
  nextTopics?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ContentFilters {
  subjects: Subject[];
  grades: GradeLevel[];
  topics: string[];
  difficulties: DifficultyLevel[];
  contentTypes: ContentType[];
}

export interface ContentSearchParams {
  query?: string;
  subject?: Subject;
  gradeLevel?: GradeLevel;
  topic?: string;
  difficulty?: DifficultyLevel;
  contentType?: ContentType;
  page?: number;
  limit?: number;
}

export interface ContentRecommendation {
  contentId: string;
  reason: string;
  relevanceScore: number;
}

export const CONTENT_TYPES: { label: string; value: ContentType; icon: string }[] = [
  { label: 'Video', value: 'video', icon: '🎥' },
  { label: 'Simulation', value: 'simulation', icon: '🔬' },
  { label: 'Game', value: 'game', icon: '🎮' },
  { label: 'Article', value: 'article', icon: '📄' },
];

export const DIFFICULTY_LEVELS: { label: string; value: DifficultyLevel; color: string }[] = [
  { label: 'Easy', value: 'easy', color: '#4CAF50' },
  { label: 'Medium', value: 'medium', color: '#FF9800' },
  { label: 'Hard', value: 'hard', color: '#F44336' },
];

// ============================================================================
// VIDEO PLAYER TYPES
// ============================================================================

export type VideoQuality = '360p' | '480p' | '720p';

export interface VideoSource {
  quality: VideoQuality;
  url: string;
  bitrate: number; // in kbps
}

export interface ChapterMarker {
  id: string;
  title: string;
  timestamp: number; // in seconds
  description?: string;
}

export interface VideoSubtitle {
  language: string;
  url: string;
  label: string;
}

export interface VideoProgress {
  contentId: string;
  studentId: string;
  currentTime: number; // in seconds
  duration: number; // in seconds
  completed: boolean;
  watchTime: number; // total watch time in seconds
  lastWatched: string;
}

export interface VideoMetadata {
  id: string;
  title: string;
  description: string;
  duration: number; // in seconds
  sources: VideoSource[];
  chapters: ChapterMarker[];
  subtitles: VideoSubtitle[];
  thumbnailUrl?: string;
  isOfflineAvailable: boolean;
  offlineUrl?: string;
}

export const VIDEO_QUALITIES: { label: string; value: VideoQuality; description: string }[] = [
  { label: '360p', value: '360p', description: 'Low quality (saves data)' },
  { label: '480p', value: '480p', description: 'Standard quality' },
  { label: '720p', value: '720p', description: 'High quality (HD)' },
];

export const PLAYBACK_SPEEDS = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0];

// ============================================================================
// ACHIEVEMENT AND BADGE TYPES
// ============================================================================

export type AchievementCategory = 
  | 'learning'
  | 'progress'
  | 'mastery'
  | 'streaks'
  | 'engagement'
  | 'milestones';

export type AchievementStatus = 'locked' | 'in_progress' | 'earned';

export interface Achievement {
  id: string;
  name: string;
  description: string;
  category: AchievementCategory;
  iconUrl?: string;
  iconEmoji?: string;
  status: AchievementStatus;
  progress: number; // 0-100 for partially completed achievements
  maxProgress: number; // Total required for completion
  earnedAt?: string; // ISO date when earned
  xpReward: number;
  unlockRequirements?: string[];
}

export interface AchievementStats {
  totalAchievements: number;
  earnedAchievements: number;
  completionPercentage: number;
  totalXpEarned: number;
  recentAchievements: Achievement[];
}

export const ACHIEVEMENT_CATEGORIES: { 
  label: string; 
  value: AchievementCategory; 
  icon: string;
  color: string;
}[] = [
  { label: 'Learning', value: 'learning', icon: '📚', color: '#2196F3' },
  { label: 'Progress', value: 'progress', icon: '📈', color: '#4CAF50' },
  { label: 'Mastery', value: 'mastery', icon: '🏆', color: '#FFD700' },
  { label: 'Streaks', value: 'streaks', icon: '🔥', color: '#FF5722' },
  { label: 'Engagement', value: 'engagement', icon: '⭐', color: '#9C27B0' },
  { label: 'Milestones', value: 'milestones', icon: '🎯', color: '#FF9800' },
];
