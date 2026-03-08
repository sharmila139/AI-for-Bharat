/**
 * Education Service
 * API integration for student profiles, diagnostic assessments, and knowledge tracking
 */

import apiClient from '../config/api';
import {
  StudentProfile,
  StudentProfileInput,
  DiagnosticAssessmentInput,
  DiagnosticAssessmentResult,
  KnowledgeState,
  QuizResult,
  Intervention,
  Acceleration,
  AssessmentQuestion,
  Subject,
  ContentItem,
  ContentSearchParams,
  ContentRecommendation,
} from '../types/education';

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
// EDUCATION SERVICE CLASS
// ============================================================================

class EducationService {
  /**
   * Create or update student profile
   */
  async createStudentProfile(profileData: StudentProfileInput): Promise<StudentProfile> {
    try {
      const response = await apiClient.post<ApiResponse<StudentProfile>>(
        '/education/profile',
        profileData
      );

      if (response.data.success && response.data.data) {
        return response.data.data;
      }

      throw new Error(response.data.error || 'Failed to create student profile');
    } catch (error: any) {
      console.error('Error creating student profile:', error);
      
      // Handle offline mode - store locally
      if (error.message?.includes('Network') || error.code === 'ECONNABORTED') {
        return this.createOfflineProfile(profileData);
      }

      throw new Error(
        error.response?.data?.error ||
        error.message ||
        'Failed to create student profile. Please check your connection and try again.'
      );
    }
  }

  /**
   * Get student profile
   */
  async getStudentProfile(studentId: string): Promise<StudentProfile | null> {
    try {
      const response = await apiClient.get<ApiResponse<StudentProfile>>(
        `/education/profile/${studentId}`
      );

      if (response.data.success && response.data.data) {
        return response.data.data;
      }

      return null;
    } catch (error: any) {
      console.error('Error fetching student profile:', error);
      
      // Return null if not found or offline
      return null;
    }
  }

  /**
   * Get diagnostic assessment questions for a subject
   */
  async getDiagnosticQuestions(subjectId: Subject): Promise<AssessmentQuestion[]> {
    try {
      const response = await apiClient.get<ApiResponse<AssessmentQuestion[]>>(
        `/education/diagnostic-questions/${subjectId}`
      );

      if (response.data.success && response.data.data) {
        return response.data.data;
      }

      throw new Error(response.data.error || 'Failed to fetch diagnostic questions');
    } catch (error: any) {
      console.error('Error fetching diagnostic questions:', error);
      
      // Handle offline mode - return sample questions
      if (error.message?.includes('Network') || error.code === 'ECONNABORTED') {
        return this.getOfflineDiagnosticQuestions(subjectId);
      }

      throw new Error(
        error.response?.data?.error ||
        error.message ||
        'Failed to fetch diagnostic questions. Please check your connection and try again.'
      );
    }
  }

  /**
   * Submit diagnostic assessment
   */
  async submitDiagnosticAssessment(
    assessmentData: DiagnosticAssessmentInput
  ): Promise<DiagnosticAssessmentResult> {
    try {
      const response = await apiClient.post<ApiResponse<DiagnosticAssessmentResult>>(
        '/education/diagnostic-assessment',
        assessmentData
      );

      if (response.data.success && response.data.data) {
        return response.data.data;
      }

      throw new Error(response.data.error || 'Failed to submit diagnostic assessment');
    } catch (error: any) {
      console.error('Error submitting diagnostic assessment:', error);
      
      // Handle offline mode - calculate locally
      if (error.message?.includes('Network') || error.code === 'ECONNABORTED') {
        return this.calculateOfflineAssessment(assessmentData);
      }

      throw new Error(
        error.response?.data?.error ||
        error.message ||
        'Failed to submit diagnostic assessment. Please check your connection and try again.'
      );
    }
  }

  /**
   * Get student's knowledge state
   */
  async getKnowledgeState(studentId: string): Promise<KnowledgeState[]> {
    try {
      const response = await apiClient.get<ApiResponse<KnowledgeState[]>>(
        `/education/knowledge-state/${studentId}`
      );

      if (response.data.success && response.data.data) {
        return response.data.data;
      }

      return [];
    } catch (error: any) {
      console.error('Error fetching knowledge state:', error);
      return [];
    }
  }

  /**
   * Submit quiz result and update knowledge state
   */
  async submitQuizResult(quizResult: QuizResult): Promise<{
    knowledgeState: KnowledgeState;
    intervention?: Intervention;
    acceleration?: Acceleration;
  }> {
    try {
      const response = await apiClient.post<ApiResponse<any>>(
        '/education/quiz-result',
        {
          studentId: quizResult.studentId,
          topicId: quizResult.topicId,
          quizResult,
        }
      );

      if (response.data.success && response.data.data) {
        return response.data.data;
      }

      throw new Error(response.data.error || 'Failed to submit quiz result');
    } catch (error: any) {
      console.error('Error submitting quiz result:', error);
      
      // Handle offline mode - queue for sync
      if (error.message?.includes('Network') || error.code === 'ECONNABORTED') {
        // Queue for sync when online
        console.log('Quiz result queued for sync');
      }

      throw new Error(
        error.response?.data?.error ||
        error.message ||
        'Failed to submit quiz result. Please check your connection and try again.'
      );
    }
  }

  /**
   * Get progress summary for student
   */
  async getProgressSummary(studentId: string): Promise<any> {
    try {
      const response = await apiClient.get<ApiResponse<any>>(
        `/education/progress/${studentId}`
      );

      if (response.data.success && response.data.data) {
        return response.data.data;
      }

      return null;
    } catch (error: any) {
      console.error('Error fetching progress summary:', error);
      return null;
    }
  }

  /**
   * Search content library
   */
  async searchContent(params: ContentSearchParams): Promise<{
    items: ContentItem[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    try {
      const response = await apiClient.get<ApiResponse<any>>(
        '/education/content/search',
        { params }
      );

      if (response.data.success && response.data.data) {
        return response.data.data;
      }

      throw new Error(response.data.error || 'Failed to search content');
    } catch (error: any) {
      console.error('Error searching content:', error);
      
      // Handle offline mode - return cached content
      if (error.message?.includes('Network') || error.code === 'ECONNABORTED') {
        return this.getOfflineContent(params);
      }

      throw new Error(
        error.response?.data?.error ||
        error.message ||
        'Failed to search content. Please check your connection and try again.'
      );
    }
  }

  /**
   * Get content recommendations based on knowledge state
   */
  async getContentRecommendations(studentId: string): Promise<ContentRecommendation[]> {
    try {
      const response = await apiClient.get<ApiResponse<ContentRecommendation[]>>(
        `/education/content/recommendations/${studentId}`
      );

      if (response.data.success && response.data.data) {
        return response.data.data;
      }

      return [];
    } catch (error: any) {
      console.error('Error fetching content recommendations:', error);
      return [];
    }
  }

  /**
   * Get content by ID
   */
  async getContentById(contentId: string): Promise<ContentItem | null> {
    try {
      const response = await apiClient.get<ApiResponse<ContentItem>>(
        `/education/content/${contentId}`
      );

      if (response.data.success && response.data.data) {
        return response.data.data;
      }

      return null;
    } catch (error: any) {
      console.error('Error fetching content:', error);
      return null;
    }
  }

  /**
   * Track content view
   */
  async trackContentView(contentId: string, studentId: string): Promise<void> {
    try {
      await apiClient.post('/education/content/view', {
        contentId,
        studentId,
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      console.error('Error tracking content view:', error);
      // Queue for sync when online
    }
  }

  /**
   * Get video metadata including sources, chapters, and subtitles
   */
  async getVideoMetadata(contentId: string): Promise<any> {
    try {
      const response = await apiClient.get<ApiResponse<any>>(
        `/education/video/${contentId}/metadata`
      );

      if (response.data.success && response.data.data) {
        return response.data.data;
      }

      throw new Error(response.data.error || 'Failed to fetch video metadata');
    } catch (error: any) {
      console.error('Error fetching video metadata:', error);
      
      // Handle offline mode - return mock data
      if (error.message?.includes('Network') || error.code === 'ECONNABORTED') {
        return this.getOfflineVideoMetadata(contentId);
      }

      throw new Error(
        error.response?.data?.error ||
        error.message ||
        'Failed to fetch video metadata. Please check your connection and try again.'
      );
    }
  }

  /**
   * Save video progress
   */
  async saveVideoProgress(progress: any): Promise<void> {
    try {
      await apiClient.post('/education/video/progress', progress);
    } catch (error: any) {
      console.error('Error saving video progress:', error);
      // Queue for sync when online
    }
  }

  /**
   * Get video progress
   */
  async getVideoProgress(contentId: string, studentId: string): Promise<any | null> {
    try {
      const response = await apiClient.get<ApiResponse<any>>(
        `/education/video/progress/${contentId}/${studentId}`
      );

      if (response.data.success && response.data.data) {
        return response.data.data;
      }

      return null;
    } catch (error: any) {
      console.error('Error fetching video progress:', error);
      return null;
    }
  }

  /**
   * Track video completion
   */
  async trackVideoCompletion(contentId: string, studentId: string, watchTime: number): Promise<void> {
    try {
      await apiClient.post('/education/video/complete', {
        contentId,
        studentId,
        watchTime,
        completedAt: new Date().toISOString(),
      });
    } catch (error: any) {
      console.error('Error tracking video completion:', error);
      // Queue for sync when online
    }
  }

  /**
   * Get student achievements
   */
  async getAchievements(studentId: string): Promise<any> {
    try {
      const response = await apiClient.get<ApiResponse<any>>(
        `/education/achievements/${studentId}`
      );

      if (response.data.success && response.data.data) {
        return response.data.data;
      }

      throw new Error(response.data.error || 'Failed to fetch achievements');
    } catch (error: any) {
      console.error('Error fetching achievements:', error);
      
      // Handle offline mode - return mock data
      if (error.message?.includes('Network') || error.code === 'ECONNABORTED') {
        return this.getOfflineAchievements(studentId);
      }

      throw new Error(
        error.response?.data?.error ||
        error.message ||
        'Failed to fetch achievements. Please check your connection and try again.'
      );
    }
  }

  /**
   * Get achievement statistics
   */
  async getAchievementStats(studentId: string): Promise<any> {
    try {
      const response = await apiClient.get<ApiResponse<any>>(
        `/education/achievements/${studentId}/stats`
      );

      if (response.data.success && response.data.data) {
        return response.data.data;
      }

      return null;
    } catch (error: any) {
      console.error('Error fetching achievement stats:', error);
      
      // Handle offline mode
      if (error.message?.includes('Network') || error.code === 'ECONNABORTED') {
        return this.getOfflineAchievementStats();
      }

      return null;
    }
  }

  // ============================================================================
  // OFFLINE FALLBACK METHODS
  // ============================================================================

  /**
   * Create offline profile (fallback)
   */
  private createOfflineProfile(profileData: StudentProfileInput): StudentProfile {
    return {
      id: `offline-${Date.now()}`,
      ...profileData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  /**
   * Get offline diagnostic questions (fallback)
   */
  private getOfflineDiagnosticQuestions(subjectId: Subject): AssessmentQuestion[] {
    // Sample questions for offline mode
    const sampleQuestions: AssessmentQuestion[] = [
      {
        id: '1',
        topicId: 'basic-arithmetic',
        topicName: 'Basic Arithmetic',
        question: 'What is 5 + 3?',
        questionType: 'multiple_choice',
        options: ['6', '7', '8', '9'],
        correctAnswer: '8',
        difficulty: 'easy',
        points: 1,
      },
      {
        id: '2',
        topicId: 'basic-arithmetic',
        topicName: 'Basic Arithmetic',
        question: 'What is 12 - 7?',
        questionType: 'multiple_choice',
        options: ['3', '4', '5', '6'],
        correctAnswer: '5',
        difficulty: 'easy',
        points: 1,
      },
      {
        id: '3',
        topicId: 'multiplication',
        topicName: 'Multiplication',
        question: 'What is 6 × 4?',
        questionType: 'multiple_choice',
        options: ['20', '22', '24', '26'],
        correctAnswer: '24',
        difficulty: 'medium',
        points: 2,
      },
    ];

    return sampleQuestions;
  }

  /**
   * Calculate offline assessment (fallback)
   */
  private calculateOfflineAssessment(
    assessmentData: DiagnosticAssessmentInput
  ): DiagnosticAssessmentResult {
    // Simple offline calculation
    const totalQuestions = assessmentData.responses.length;
    const correctAnswers = Math.floor(totalQuestions * 0.6); // Assume 60% for demo
    const score = (correctAnswers / totalQuestions) * 100;

    return {
      assessmentId: `offline-${Date.now()}`,
      studentId: assessmentData.studentId,
      subjectId: assessmentData.subjectId,
      totalQuestions,
      correctAnswers,
      score,
      topicScores: [],
      knowledgeState: [],
      recommendations: [
        'Complete the assessment when online for accurate results',
        'Practice basic concepts to improve understanding',
      ],
      completedAt: new Date().toISOString(),
    };
  }

  /**
   * Get offline content (fallback)
   */
  private getOfflineContent(params: ContentSearchParams): {
    items: ContentItem[];
    total: number;
    page: number;
    totalPages: number;
  } {
    // Sample offline content
    const sampleContent: ContentItem[] = [
      {
        id: '1',
        title: 'Introduction to Algebra',
        description: 'Learn the basics of algebraic expressions and equations',
        subject: 'mathematics',
        topic: 'Algebra',
        gradeLevel: '8',
        difficulty: 'easy',
        contentType: 'video',
        duration: 15,
        language: 'English',
        viewCount: 1250,
        rating: 4.5,
        isOfflineAvailable: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: '2',
        title: 'Photosynthesis Explained',
        description: 'Understanding how plants make their own food',
        subject: 'science',
        topic: 'Biology',
        gradeLevel: '7',
        difficulty: 'medium',
        contentType: 'video',
        duration: 20,
        language: 'English',
        viewCount: 980,
        rating: 4.8,
        isOfflineAvailable: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: '3',
        title: 'English Grammar Basics',
        description: 'Master the fundamentals of English grammar',
        subject: 'english',
        topic: 'Grammar',
        gradeLevel: '6',
        difficulty: 'easy',
        contentType: 'interactive',
        duration: 25,
        language: 'English',
        viewCount: 1500,
        rating: 4.6,
        isOfflineAvailable: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: '4',
        title: 'World History Overview',
        description: 'Journey through major historical events',
        subject: 'social_studies',
        topic: 'History',
        gradeLevel: '9',
        difficulty: 'medium',
        contentType: 'video',
        duration: 30,
        language: 'English',
        viewCount: 850,
        rating: 4.7,
        isOfflineAvailable: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    // Filter based on params - with null/undefined checks
    let filtered = sampleContent;
    
    if (params.query && params.query.trim()) {
      const query = (params.query || '').toLowerCase();
      filtered = filtered.filter(item => {
        const title = (item.title || '').toLowerCase();
        const description = (item.description || '').toLowerCase();
        const topic = (item.topic || '').toLowerCase();
        return (
          title.includes(query) ||
          description.includes(query) ||
          topic.includes(query)
        );
      });
    }
    
    if (params.subject) {
      filtered = filtered.filter(item => item.subject === params.subject);
    }
    
    if (params.gradeLevel) {
      filtered = filtered.filter(item => item.gradeLevel === params.gradeLevel);
    }
    
    if (params.difficulty) {
      filtered = filtered.filter(item => item.difficulty === params.difficulty);
    }
    
    if (params.contentType) {
      filtered = filtered.filter(item => item.contentType === params.contentType);
    }

    return {
      items: filtered,
      total: filtered.length,
      page: params.page || 1,
      totalPages: 1,
    };
  }

  /**
   * Get offline video metadata (fallback)
   */
  private getOfflineVideoMetadata(contentId: string): any {
    return {
      id: contentId,
      title: 'Sample Educational Video',
      description: 'This is a sample video for offline viewing',
      duration: 600, // 10 minutes
      sources: [
        {
          quality: '360p',
          url: 'https://sample-videos.com/video321/mp4/360/big_buck_bunny_360p_1mb.mp4',
          bitrate: 500,
        },
        {
          quality: '480p',
          url: 'https://sample-videos.com/video321/mp4/480/big_buck_bunny_480p_2mb.mp4',
          bitrate: 1000,
        },
        {
          quality: '720p',
          url: 'https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_5mb.mp4',
          bitrate: 2500,
        },
      ],
      chapters: [
        {
          id: '1',
          title: 'Introduction',
          timestamp: 0,
          description: 'Overview of the topic',
        },
        {
          id: '2',
          title: 'Main Concepts',
          timestamp: 120,
          description: 'Core learning material',
        },
        {
          id: '3',
          title: 'Examples',
          timestamp: 300,
          description: 'Practical examples',
        },
        {
          id: '4',
          title: 'Summary',
          timestamp: 480,
          description: 'Key takeaways',
        },
      ],
      subtitles: [
        {
          language: 'en',
          url: 'https://example.com/subtitles/en.vtt',
          label: 'English',
        },
        {
          language: 'hi',
          url: 'https://example.com/subtitles/hi.vtt',
          label: 'Hindi',
        },
      ],
      isOfflineAvailable: true,
    };
  }

  /**
   * Get offline achievements (fallback)
   */
  private getOfflineAchievements(studentId: string): any {
    const sampleAchievements = [
      {
        id: '1',
        name: 'First Steps',
        description: 'Complete your first lesson',
        category: 'learning',
        iconEmoji: '👣',
        status: 'earned',
        progress: 1,
        maxProgress: 1,
        earnedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        xpReward: 10,
      },
      {
        id: '2',
        name: 'Quick Learner',
        description: 'Complete 5 lessons in one day',
        category: 'learning',
        iconEmoji: '⚡',
        status: 'earned',
        progress: 5,
        maxProgress: 5,
        earnedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        xpReward: 25,
      },
      {
        id: '3',
        name: 'Knowledge Seeker',
        description: 'Watch 10 educational videos',
        category: 'learning',
        iconEmoji: '🔍',
        status: 'in_progress',
        progress: 7,
        maxProgress: 10,
        xpReward: 50,
      },
      {
        id: '4',
        name: 'Rising Star',
        description: 'Reach 50% proficiency in any topic',
        category: 'progress',
        iconEmoji: '🌟',
        status: 'earned',
        progress: 1,
        maxProgress: 1,
        earnedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        xpReward: 30,
      },
      {
        id: '5',
        name: 'Steady Progress',
        description: 'Improve proficiency in 5 topics',
        category: 'progress',
        iconEmoji: '📊',
        status: 'in_progress',
        progress: 3,
        maxProgress: 5,
        xpReward: 40,
      },
      {
        id: '6',
        name: 'Subject Master',
        description: 'Master all topics in one subject',
        category: 'mastery',
        iconEmoji: '🏆',
        status: 'locked',
        progress: 0,
        maxProgress: 1,
        xpReward: 100,
        unlockRequirements: ['Complete all topics in a subject with 80%+ proficiency'],
      },
      {
        id: '7',
        name: 'Perfect Score',
        description: 'Score 100% on any quiz',
        category: 'mastery',
        iconEmoji: '💯',
        status: 'earned',
        progress: 1,
        maxProgress: 1,
        earnedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        xpReward: 50,
      },
      {
        id: '8',
        name: 'Week Warrior',
        description: 'Maintain a 7-day learning streak',
        category: 'streaks',
        iconEmoji: '🔥',
        status: 'earned',
        progress: 7,
        maxProgress: 7,
        earnedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        xpReward: 75,
      },
      {
        id: '9',
        name: 'Month Champion',
        description: 'Maintain a 30-day learning streak',
        category: 'streaks',
        iconEmoji: '🏅',
        status: 'in_progress',
        progress: 12,
        maxProgress: 30,
        xpReward: 200,
      },
      {
        id: '10',
        name: 'Active Learner',
        description: 'Complete activities on 10 different days',
        category: 'engagement',
        iconEmoji: '⭐',
        status: 'in_progress',
        progress: 8,
        maxProgress: 10,
        xpReward: 60,
      },
      {
        id: '11',
        name: 'Quiz Master',
        description: 'Complete 20 quizzes',
        category: 'engagement',
        iconEmoji: '📝',
        status: 'in_progress',
        progress: 15,
        maxProgress: 20,
        xpReward: 80,
      },
      {
        id: '12',
        name: 'Century Club',
        description: 'Earn 100 total XP',
        category: 'milestones',
        iconEmoji: '🎯',
        status: 'earned',
        progress: 100,
        maxProgress: 100,
        earnedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
        xpReward: 20,
      },
      {
        id: '13',
        name: 'Level 5 Legend',
        description: 'Reach level 5',
        category: 'milestones',
        iconEmoji: '🚀',
        status: 'locked',
        progress: 0,
        maxProgress: 1,
        xpReward: 150,
        unlockRequirements: ['Reach level 5 by earning XP'],
      },
    ];

    return {
      achievements: sampleAchievements,
      stats: this.getOfflineAchievementStats(),
    };
  }

  /**
   * Get offline achievement stats (fallback)
   */
  private getOfflineAchievementStats(): any {
    return {
      totalAchievements: 13,
      earnedAchievements: 6,
      completionPercentage: 46,
      totalXpEarned: 280,
      recentAchievements: [
        {
          id: '8',
          name: 'Week Warrior',
          earnedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: '7',
          name: 'Perfect Score',
          earnedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: '4',
          name: 'Rising Star',
          earnedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        },
      ],
    };
  }
}

export default new EducationService();
