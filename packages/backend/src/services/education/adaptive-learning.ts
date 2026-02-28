/**
 * Adaptive Learning Service
 * Implements Bayesian Knowledge Tracing and adaptive content selection
 */

import { v4 as uuidv4 } from 'uuid';

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

export interface StudentProfile {
  studentId: string;
  userId: string;
  gradeLevel: number;
  schoolName?: string;
  board: 'CBSE' | 'ICSE' | 'State' | 'Other';
  learningStyle: 'visual' | 'auditory' | 'kinesthetic' | 'mixed';
  preferredSubjects?: string[];
  targetGradeLevel?: number;
  targetExam?: string;
  studyHoursPerDay?: number;
  initialAssessmentCompleted: boolean;
  overallProficiencyLevel?: 'beginner' | 'elementary' | 'intermediate' | 'advanced';
}

export interface DiagnosticAssessment {
  assessmentId: string;
  studentId: string;
  subjectId: string;
  questions: DiagnosticQuestion[];
  responses: DiagnosticResponse[];
  overallScore: number;
  topicScores: Map<string, number>;
  recommendedStartingLevel: 'beginner' | 'elementary' | 'intermediate' | 'advanced';
  weakAreas: string[];
  strongAreas: string[];
}

export interface DiagnosticQuestion {
  questionId: string;
  topicId: string;
  difficulty: 'easy' | 'medium' | 'hard';
  question: string;
  options: string[];
  correctAnswer: number;
}

export interface DiagnosticResponse {
  questionId: string;
  selectedAnswer: number;
  isCorrect: boolean;
  timeSpentSeconds: number;
}

export interface KnowledgeState {
  knowledgeStateId: string;
  studentId: string;
  topicId: string;
  proficiencyScore: number; // 0-100
  pKnow: number; // Probability student knows the skill (0-1)
  pLearn: number; // Probability of learning (0-1)
  pGuess: number; // Probability of guessing correctly (0-1)
  pSlip: number; // Probability of making a mistake (0-1)
  masteryLevel: 'not_started' | 'learning' | 'practicing' | 'mastered';
  attemptsCount: number;
  correctAttempts: number;
  totalTimeMinutes: number;
  lastPracticedAt?: Date;
}

export interface QuizResult {
  quizId: string;
  topicId: string;
  score: number; // 0-100
  totalQuestions: number;
  correctAnswers: number;
  timeSpentMinutes: number;
  responses: QuizResponse[];
}

export interface QuizResponse {
  questionId: string;
  isCorrect: boolean;
  timeSpentSeconds: number;
}

export interface ContentRecommendation {
  contentId: string;
  topicId: string;
  title: string;
  contentType: 'video' | 'text' | 'interactive' | 'quiz' | 'practice';
  difficulty: 'easy' | 'medium' | 'hard';
  estimatedDuration: number;
  reason: string;
  priority: number;
}

export interface InterventionAction {
  type: 'alternate_teaching' | 'prerequisite_review' | 'micro_learning' | 'peer_support';
  reason: string;
  recommendedContent: ContentRecommendation[];
  message: string;
}

// ============================================================================
// ADAPTIVE LEARNING SERVICE
// ============================================================================

export class AdaptiveLearningService {
  /**
   * Create student profile with diagnostic assessment
   */
  async createStudentProfile(profileData: Partial<StudentProfile>): Promise<StudentProfile> {
    const studentId = uuidv4();
    
    const profile: StudentProfile = {
      studentId,
      userId: profileData.userId!,
      gradeLevel: profileData.gradeLevel!,
      schoolName: profileData.schoolName,
      board: profileData.board || 'State',
      learningStyle: profileData.learningStyle || 'mixed',
      preferredSubjects: profileData.preferredSubjects,
      targetGradeLevel: profileData.targetGradeLevel,
      targetExam: profileData.targetExam,
      studyHoursPerDay: profileData.studyHoursPerDay,
      initialAssessmentCompleted: false
    };
    
    // This would save to database
    console.log('Student profile created:', studentId);
    
    return profile;
  }
  
  /**
   * Conduct diagnostic assessment to establish baseline knowledge
   */
  async conductDiagnosticAssessment(
    studentId: string,
    subjectId: string,
    responses: DiagnosticResponse[]
  ): Promise<DiagnosticAssessment> {
    // Calculate scores
    const correctCount = responses.filter(r => r.isCorrect).length;
    const overallScore = (correctCount / responses.length) * 100;
    
    // Group by topic and calculate topic scores
    const topicScores = new Map<string, number>();
    // This would query questions to get topic IDs
    
    // Determine recommended starting level
    let recommendedStartingLevel: 'beginner' | 'elementary' | 'intermediate' | 'advanced';
    if (overallScore < 40) {
      recommendedStartingLevel = 'beginner';
    } else if (overallScore < 60) {
      recommendedStartingLevel = 'elementary';
    } else if (overallScore < 80) {
      recommendedStartingLevel = 'intermediate';
    } else {
      recommendedStartingLevel = 'advanced';
    }
    
    const assessment: DiagnosticAssessment = {
      assessmentId: uuidv4(),
      studentId,
      subjectId,
      questions: [], // Would be populated from database
      responses,
      overallScore,
      topicScores,
      recommendedStartingLevel,
      weakAreas: [], // Topics with score < 50%
      strongAreas: [] // Topics with score > 80%
    };
    
    return assessment;
  }
  
  /**
   * Initialize knowledge state for a topic
   * Property 24: Knowledge State Bounds
   */
  initializeKnowledgeState(studentId: string, topicId: string): KnowledgeState {
    return {
      knowledgeStateId: uuidv4(),
      studentId,
      topicId,
      proficiencyScore: 0, // Must be 0-100
      pKnow: 0.0, // Initial probability of knowing
      pLearn: 0.3, // Default learning rate
      pGuess: 0.25, // Default guess probability (1/4 for multiple choice)
      pSlip: 0.1, // Default slip probability
      masteryLevel: 'not_started', // Must be one of four valid values
      attemptsCount: 0,
      correctAttempts: 0,
      totalTimeMinutes: 0
    };
  }
  
  /**
   * Update knowledge state using Bayesian Knowledge Tracing
   * Property 25: Bayesian Knowledge Tracing Update
   */
  updateKnowledgeState(
    currentState: KnowledgeState,
    quizResult: QuizResult
  ): KnowledgeState {
    const { correctAnswers, totalQuestions } = quizResult;
    
    // Update attempt counts
    const newAttemptsCount = currentState.attemptsCount + 1;
    const newCorrectAttempts = currentState.correctAttempts + correctAnswers;
    
    // Bayesian Knowledge Tracing update
    const observedCorrect = correctAnswers / totalQuestions;
    
    // Update P(Know) using Bayes' theorem
    // P(Know|Correct) = P(Correct|Know) * P(Know) / P(Correct)
    // P(Correct|Know) = 1 - P(Slip)
    // P(Correct|~Know) = P(Guess)
    // P(Correct) = P(Correct|Know) * P(Know) + P(Correct|~Know) * P(~Know)
    
    const pCorrectGivenKnow = 1 - currentState.pSlip;
    const pCorrectGivenNotKnow = currentState.pGuess;
    const pCorrect = pCorrectGivenKnow * currentState.pKnow + 
                     pCorrectGivenNotKnow * (1 - currentState.pKnow);
    
    let newPKnow: number;
    if (observedCorrect > 0.5) {
      // Student got more than half correct - update P(Know) upward
      newPKnow = (pCorrectGivenKnow * currentState.pKnow) / pCorrect;
    } else {
      // Student got less than half correct - update P(Know) downward
      newPKnow = currentState.pKnow * 0.9; // Decay factor
    }
    
    // Apply learning: P(Know_new) = P(Know_old) + (1 - P(Know_old)) * P(Learn)
    newPKnow = newPKnow + (1 - newPKnow) * currentState.pLearn;
    
    // Ensure P(Know) stays in [0, 1]
    newPKnow = Math.max(0, Math.min(1, newPKnow));
    
    // Convert P(Know) to proficiency score (0-100)
    const newProficiencyScore = newPKnow * 100;
    
    // Update mastery level based on proficiency
    let newMasteryLevel: 'not_started' | 'learning' | 'practicing' | 'mastered';
    if (newProficiencyScore < 30) {
      newMasteryLevel = 'learning';
    } else if (newProficiencyScore < 70) {
      newMasteryLevel = 'practicing';
    } else {
      newMasteryLevel = 'mastered';
    }
    
    return {
      ...currentState,
      proficiencyScore: newProficiencyScore,
      pKnow: newPKnow,
      masteryLevel: newMasteryLevel,
      attemptsCount: newAttemptsCount,
      correctAttempts: newCorrectAttempts,
      totalTimeMinutes: currentState.totalTimeMinutes + quizResult.timeSpentMinutes,
      lastPracticedAt: new Date()
    };
  }
  
  /**
   * Select next content based on student's knowledge state
   * Adaptive content selection algorithm
   */
  selectNextContent(
    _studentId: string,
    knowledgeStates: KnowledgeState[],
    learningStyle: string
  ): ContentRecommendation[] {
    const recommendations: ContentRecommendation[] = [];
    
    // Find topics that need attention
    const topicsNeedingWork = knowledgeStates
      .filter(ks => ks.proficiencyScore < 70)
      .sort((a, b) => a.proficiencyScore - b.proficiencyScore);
    
    for (const ks of topicsNeedingWork.slice(0, 3)) {
      // Select content type based on learning style and proficiency
      let contentType: 'video' | 'text' | 'interactive' | 'quiz' | 'practice';
      
      if (ks.proficiencyScore < 30) {
        // Learning phase - use preferred learning style
        contentType = learningStyle === 'visual' ? 'video' : 
                     learningStyle === 'auditory' ? 'video' :
                     learningStyle === 'kinesthetic' ? 'interactive' : 'video';
      } else if (ks.proficiencyScore < 70) {
        // Practicing phase - use practice and quizzes
        contentType = 'practice';
      } else {
        // Mastery phase - use challenging quizzes
        contentType = 'quiz';
      }
      
      // Select difficulty based on proficiency
      let difficulty: 'easy' | 'medium' | 'hard';
      if (ks.proficiencyScore < 40) {
        difficulty = 'easy';
      } else if (ks.proficiencyScore < 70) {
        difficulty = 'medium';
      } else {
        difficulty = 'hard';
      }
      
      recommendations.push({
        contentId: `content-${ks.topicId}`,
        topicId: ks.topicId,
        title: `Content for topic ${ks.topicId}`,
        contentType,
        difficulty,
        estimatedDuration: 15,
        reason: `Proficiency: ${ks.proficiencyScore.toFixed(1)}% - needs improvement`,
        priority: 100 - ks.proficiencyScore
      });
    }
    
    return recommendations.sort((a, b) => b.priority - a.priority);
  }
  
  /**
   * Trigger intervention for low quiz scores
   * Property 26: Low Score Intervention
   */
  triggerIntervention(
    quizResult: QuizResult,
    knowledgeState: KnowledgeState
  ): InterventionAction | null {
    // Check if score is below 60%
    if (quizResult.score >= 60) {
      return null;
    }
    
    // Determine intervention type based on pattern
    let interventionType: 'alternate_teaching' | 'prerequisite_review' | 'micro_learning' | 'peer_support';
    let message: string;
    
    if (knowledgeState.attemptsCount === 1) {
      // First attempt - try alternate teaching style
      interventionType = 'alternate_teaching';
      message = 'Let\'s try a different approach to help you understand this better.';
    } else if (knowledgeState.proficiencyScore < 20) {
      // Very low proficiency - review prerequisites
      interventionType = 'prerequisite_review';
      message = 'It looks like we need to review some foundational concepts first.';
    } else if (quizResult.score < 40) {
      // Very low score - break into smaller chunks
      interventionType = 'micro_learning';
      message = 'Let\'s break this down into smaller, easier-to-understand pieces.';
    } else {
      // Moderate score - peer support might help
      interventionType = 'peer_support';
      message = 'You\'re making progress! Let\'s try some practice exercises.';
    }
    
    // Generate recommended content based on intervention type
    const recommendedContent: ContentRecommendation[] = [
      {
        contentId: `intervention-${quizResult.topicId}`,
        topicId: quizResult.topicId,
        title: 'Review Content',
        contentType: interventionType === 'alternate_teaching' ? 'video' : 'practice',
        difficulty: 'easy',
        estimatedDuration: 10,
        reason: `Intervention: ${interventionType}`,
        priority: 100
      }
    ];
    
    return {
      type: interventionType,
      reason: `Quiz score ${quizResult.score}% is below 60% threshold`,
      recommendedContent,
      message
    };
  }
  
  /**
   * Accelerate learning path for high performers
   */
  accelerateLearningPath(
    quizResult: QuizResult,
    _knowledgeState: KnowledgeState
  ): ContentRecommendation[] | null {
    // Check if score is above 90%
    if (quizResult.score < 90) {
      return null;
    }
    
    // Student is excelling - provide more challenging content
    const advancedContent: ContentRecommendation[] = [
      {
        contentId: `advanced-${quizResult.topicId}`,
        topicId: quizResult.topicId,
        title: 'Advanced Challenge',
        contentType: 'quiz',
        difficulty: 'hard',
        estimatedDuration: 20,
        reason: `Excellent performance (${quizResult.score}%) - ready for advanced content`,
        priority: 90
      }
    ];
    
    return advancedContent;
  }
  
  /**
   * Track engagement metrics
   */
  trackEngagement(sessionData: {
    studentId: string;
    contentId: string;
    durationMinutes: number;
    progressPercentage: number;
    completed: boolean;
    pausesCount: number;
    rewindsCount: number;
    playbackSpeed: number;
  }): void {
    // Calculate engagement score
    const engagementScore = this.calculateEngagementScore(sessionData);
    
    console.log('Engagement tracked:', {
      studentId: sessionData.studentId,
      contentId: sessionData.contentId,
      engagementScore
    });
    
    // This would save to learning_sessions table
  }
  
  /**
   * Calculate engagement score based on session metrics
   */
  private calculateEngagementScore(sessionData: {
    durationMinutes: number;
    progressPercentage: number;
    completed: boolean;
    pausesCount: number;
    rewindsCount: number;
    playbackSpeed: number;
  }): number {
    let score = 0;
    
    // Completion bonus
    if (sessionData.completed) {
      score += 40;
    } else {
      score += sessionData.progressPercentage * 0.4;
    }
    
    // Duration score (up to 30 points)
    const expectedDuration = 15; // minutes
    const durationScore = Math.min(30, (sessionData.durationMinutes / expectedDuration) * 30);
    score += durationScore;
    
    // Interaction score (up to 30 points)
    // Moderate pauses and rewinds indicate engagement
    const pauseScore = Math.min(15, sessionData.pausesCount * 3);
    const rewindScore = Math.min(15, sessionData.rewindsCount * 5);
    score += pauseScore + rewindScore;
    
    // Playback speed penalty (watching too fast might indicate skipping)
    if (sessionData.playbackSpeed > 1.5) {
      score *= 0.9;
    }
    
    return Math.min(100, score);
  }
  
  /**
   * Get student progress summary
   */
  async getProgressSummary(_studentId: string): Promise<{
    topicsStudied: number;
    averageProficiency: number;
    totalStudyMinutes: number;
    masteredTopics: number;
    learningTopics: number;
  }> {
    // This would query knowledge_state table
    // For now, return placeholder
    return {
      topicsStudied: 0,
      averageProficiency: 0,
      totalStudyMinutes: 0,
      masteredTopics: 0,
      learningTopics: 0
    };
  }
}

export const adaptiveLearningService = new AdaptiveLearningService();
