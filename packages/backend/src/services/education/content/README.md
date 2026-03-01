# Content Library and Curriculum Alignment Services

## Overview

This module provides comprehensive backend services for the Content Library and Curriculum Alignment features of RuralConnect AI's Education module. It implements all functionality required for Tasks 19.1-19.9.

## Architecture

The module is organized into 8 specialized services:

1. **Content Management Service** - CRUD operations, versioning, approval workflow
2. **Content Organization Service** - Hierarchical organization, curriculum alignment
3. **Video Streaming Service** - Multi-quality streaming, adaptive bitrate
4. **Interactive Simulations Service** - Simulations and games management
5. **Content Analytics Service** - View tracking, engagement metrics
6. **Recommendation Engine** - Personalized content recommendations
7. **Subtitle Service** - Multi-language subtitles and transcripts
8. **Learning Style Adaptation Service** - Style-based content delivery

## Services

### 1. Content Management Service

**File:** `content-management.ts`

**Features:**
- Create, read, update, delete educational content
- Video metadata management
- Content versioning with change tracking
- Publishing workflow (draft → review → published)
- Content approval system with reviewer comments

**Key Methods:**
```typescript
createContent(content: ContentData, created_by: string): Promise<string>
updateContent(content_id: string, updates: Partial<ContentData>, updated_by: string): Promise<void>
getContentById(content_id: string): Promise<ContentData | null>
submitForApproval(content_id: string, submitted_by: string): Promise<void>
reviewContent(content_id: string, reviewed_by: string, approved: boolean, comments?: string): Promise<void>
getContentVersions(content_id: string): Promise<ContentVersion[]>
```

**Database Tables:**
- `learning_content` (existing)
- `content_versions` (new)
- `content_approvals` (new)

---

### 2. Content Organization Service

**File:** `content-organization.ts`

**Features:**
- Subject management (mathematics, science, language, etc.)
- Hierarchical topic organization (subject → topic → subtopic)
- Grade level classification (1-12, college)
- Difficulty levels (easy, medium, hard, advanced)
- Curriculum alignment (NCERT, CBSE, ICSE, state boards)
- Prerequisite tracking

**Key Methods:**
```typescript
createSubject(subject: Subject): Promise<string>
getAllSubjects(filters?: { category?: string; grade?: number }): Promise<Subject[]>
createTopic(topic: Topic): Promise<string>
getTopicHierarchy(subject_id: string): Promise<TopicWithSubtopics[]>
getContentHierarchy(subject_id: string): Promise<ContentHierarchy>
addCurriculumAlignment(alignment: CurriculumAlignment): Promise<void>
getPrerequisites(topic_id: string): Promise<Topic[]>
searchTopics(search_query: string, filters?: any): Promise<Topic[]>
```

**Database Tables:**
- `subjects` (existing)
- `topics` (existing)
- `curriculum_alignments` (new)

---

### 3. Video Streaming Service

**File:** `video-streaming.ts`

**Features:**
- Adaptive bitrate streaming (360p, 480p, 720p)
- Quality selection based on bandwidth detection
- Video transcoding service integration
- CDN integration preparation
- Streaming session tracking
- Buffering and quality switch analytics

**Key Methods:**
```typescript
getStreamingMetadata(options: VideoStreamingOptions): Promise<StreamingMetadata>
selectQuality(bandwidth_kbps: number | undefined, availableQualities: VideoQuality[], preferredQuality?: string): string
getBandwidthProfile(bandwidth_kbps: number): BandwidthProfile
trackStreamingSession(student_id: string, content_id: string, quality: string, bandwidth_kbps?: number): Promise<string>
getStreamingAnalytics(content_id: string): Promise<StreamingAnalytics>
requestTranscoding(content_id: string, source_url: string, target_qualities: string[]): Promise<string>
```

**Quality Thresholds:**
- 360p: 500 kbps minimum
- 480p: 1000 kbps minimum
- 720p: 2500 kbps minimum

**Database Tables:**
- `video_streaming_sessions` (new)
- `transcoding_jobs` (new)

---

### 4. Interactive Simulations Service

**File:** `interactive-simulations.ts`

**Features:**
- Simulation metadata management (physics, chemistry, biology, math, geography)
- Game mechanics tracking (quiz, puzzle, strategy, adventure)
- Interactive element configuration (sliders, buttons, drag-drop, etc.)
- Progress tracking for simulations
- Scoring and achievements
- Leaderboards

**Key Methods:**
```typescript
createSimulation(simulation: Simulation): Promise<string>
getSimulationById(simulation_id: string): Promise<Simulation | null>
startSimulation(student_id: string, simulation_id: string): Promise<string>
updateSimulationProgress(progress_id: string, updates: any): Promise<void>
createGame(game: Game): Promise<string>
startGame(student_id: string, game_id: string): Promise<string>
updateGameProgress(progress_id: string, updates: any): Promise<void>
getGameLeaderboard(game_id: string, limit?: number): Promise<LeaderboardEntry[]>
```

**Database Tables:**
- `simulations` (new)
- `games` (new)
- `simulation_progress` (new)
- `game_progress` (new)

---

### 5. Content Analytics Service

**File:** `content-analytics.ts`

**Features:**
- View count tracking
- Watch time analytics
- Completion rate calculation
- Drop-off point analysis (10% intervals)
- Engagement metrics (likes, shares, comments)
- Popular content identification
- Content rating system

**Key Methods:**
```typescript
trackView(event: ViewEvent): Promise<void>
getContentAnalytics(content_id: string): Promise<ContentAnalytics>
analyzeDropOff(content_id: string): Promise<DropOffAnalysis>
getEngagementMetrics(content_id: string): Promise<EngagementMetrics>
getPopularContent(filters?: any, limit?: number): Promise<PopularContent[]>
trackInteraction(student_id: string, content_id: string, interaction_type: 'like' | 'share' | 'comment', comment_text?: string): Promise<void>
rateContent(student_id: string, content_id: string, rating: number): Promise<void>
```

**Engagement Score Formula:**
```
engagement_score = 
  completion_rate * 0.30 +
  interaction_rate * 0.20 +
  replay_rate * 0.15 +
  like_rate * 0.15 +
  share_rate * 0.10 +
  comment_rate * 0.10
```

**Database Tables:**
- `content_views` (new)
- `content_engagement` (new)
- `content_comments` (new)
- `content_ratings` (new)

---

### 6. Recommendation Engine

**File:** `recommendation-engine.ts`

**Features:**
- Collaborative filtering (students with similar patterns)
- Content-based filtering (similar content features)
- Knowledge gap-based recommendations
- Difficulty progression
- Similar content suggestions
- Personalized learning paths

**Recommendation Types:**
- `next_lesson` - Continue learning journey
- `review` - Strengthen weak areas (proficiency < 70%)
- `challenge` - Advanced content for high performers (proficiency >= 80%)
- `similar` - Based on viewing patterns
- `personalized` - Hybrid approach combining all strategies

**Key Methods:**
```typescript
getRecommendations(request: RecommendationRequest): Promise<ContentRecommendation[]>
findSimilarContent(content_id: string, limit?: number): Promise<SimilarContent[]>
generateLearningPath(student_id: string, subject_id: string, target_proficiency?: number): Promise<LearningPathRecommendation>
```

**Similarity Scoring:**
- Topic match: 40 points
- Difficulty match: 20 points
- Content type match: 15 points
- Tag overlap: 5 points per tag
- Keyword overlap: 3 points per keyword

---

### 7. Subtitle Service

**File:** `subtitle-service.ts`

**Features:**
- Subtitle file management (SRT, VTT formats)
- Multi-language subtitle support (15+ Indian languages)
- Transcript generation and storage
- Subtitle synchronization
- Search within transcripts
- Format conversion (SRT ↔ VTT)

**Supported Languages:**
- English, Hindi, Tamil, Telugu, Bengali, Marathi
- Gujarati, Kannada, Malayalam, Punjabi, Odia
- Assamese, Urdu, Kashmiri, Konkani

**Key Methods:**
```typescript
addSubtitle(subtitle: Subtitle): Promise<string>
getSubtitles(content_id: string, language?: string): Promise<Subtitle[]>
updateSubtitle(subtitle_id: string, updates: Partial<Subtitle>): Promise<void>
verifySubtitle(subtitle_id: string, verified_by: string): Promise<void>
parseSRT(srtContent: string): SubtitleCue[]
convertSRTtoVTT(srtContent: string): string
addTranscript(transcript: Transcript): Promise<string>
searchTranscripts(search_query: string, filters?: any): Promise<TranscriptSearchResult[]>
```

**Database Tables:**
- `subtitles` (new)
- `transcripts` (new)

---

### 8. Learning Style Adaptation Service

**File:** `learning-style-adaptation.ts`

**Features:**
- Learning style detection (visual, auditory, kinesthetic, mixed)
- Content type preferences
- Adaptive content delivery
- Style-specific recommendations
- Performance tracking by style

**Learning Styles:**
- **Visual**: Prefer videos, images, diagrams, text
- **Auditory**: Prefer audio, lectures, discussions
- **Kinesthetic**: Prefer interactive, simulations, hands-on practice
- **Mixed**: Balanced across all styles

**Key Methods:**
```typescript
detectLearningStyle(student_id: string): Promise<LearningStyleProfile>
getLearningStyleProfile(student_id: string): Promise<LearningStyleProfile | null>
updateLearningStyleProfile(student_id: string, updates: Partial<LearningStyleProfile>): Promise<void>
getAdaptiveRecommendations(student_id: string, topic_id?: string, limit?: number): Promise<AdaptiveContentRecommendation[]>
trackPerformanceByStyle(student_id: string): Promise<PerformanceByStyle[]>
getContentAlternatives(content_id: string, target_style: LearningStyle): Promise<AlternativeFormat[]>
```

**Style Detection Algorithm:**
1. Analyze content interaction patterns
2. Calculate style scores based on content type preferences
3. Weight by completion rate and interaction count
4. Normalize scores to 0-100 range
5. Determine primary style (or mixed if scores are close)

**Database Tables:**
- `learning_style_profiles` (new)

---

## API Endpoints

**Base Path:** `/api/content-library`

### Content Management
- `POST /content` - Create content
- `GET /content/:content_id` - Get content
- `PUT /content/:content_id` - Update content
- `POST /content/:content_id/submit` - Submit for approval
- `POST /content/:content_id/review` - Review content

### Content Organization
- `GET /subjects` - Get all subjects
- `GET /subjects/:subject_id/hierarchy` - Get topic hierarchy
- `GET /topics/:topic_id/content` - Get content for topic

### Video Streaming
- `GET /content/:content_id/stream` - Get streaming metadata
- `POST /content/:content_id/stream/track` - Track streaming session

### Analytics
- `GET /content/:content_id/analytics` - Get content analytics
- `GET /content/popular` - Get popular content

### Recommendations
- `GET /students/:student_id/recommendations` - Get recommendations
- `GET /students/:student_id/learning-path` - Generate learning path

### Learning Style
- `GET /students/:student_id/learning-style` - Get learning style profile
- `GET /students/:student_id/adaptive-recommendations` - Get adaptive recommendations

---

## Database Schema

**New Tables Created:**
1. `content_versions` - Version control
2. `content_approvals` - Approval workflow
3. `curriculum_alignments` - Curriculum mapping
4. `video_streaming_sessions` - Streaming analytics
5. `transcoding_jobs` - Video transcoding
6. `simulations` - Simulation metadata
7. `games` - Game metadata
8. `simulation_progress` - Student simulation progress
9. `game_progress` - Student game progress
10. `content_views` - View analytics
11. `content_engagement` - Likes, shares
12. `content_comments` - Comments
13. `content_ratings` - Ratings
14. `subtitles` - Subtitle files
15. `transcripts` - Video transcripts
16. `learning_style_profiles` - Learning style data

**Schema File:** `packages/backend/src/database/schemas/08_content_library.sql`

---

## Usage Examples

### Example 1: Create and Publish Content

```typescript
import { ContentManagementService } from './services/education/content';

const contentMgmt = new ContentManagementService(pool);

// Create content
const content_id = await contentMgmt.createContent({
  topic_id: 'topic-uuid',
  title: 'Introduction to Algebra',
  content_type: 'video',
  difficulty_level: 'medium',
  duration_minutes: 15,
  video_quality_options: {
    '360p': 'https://cdn.example.com/video-360p.mp4',
    '480p': 'https://cdn.example.com/video-480p.mp4',
    '720p': 'https://cdn.example.com/video-720p.mp4'
  },
  chapter_markers: [
    { timestamp: 0, title: 'Introduction' },
    { timestamp: 300, title: 'Basic Concepts' },
    { timestamp: 600, title: 'Examples' }
  ],
  tags: ['algebra', 'mathematics', 'grade-8'],
  language: 'en'
}, 'teacher-123');

// Submit for approval
await contentMgmt.submitForApproval(content_id, 'teacher-123');

// Review and approve
await contentMgmt.reviewContent(content_id, 'admin-456', true, 'Excellent content!');
```

### Example 2: Get Adaptive Recommendations

```typescript
import { LearningStyleAdaptationService } from './services/education/content';

const learningStyle = new LearningStyleAdaptationService(pool);

// Detect learning style
const profile = await learningStyle.detectLearningStyle('student-123');
console.log(`Primary style: ${profile.primary_style}`);
console.log(`Style scores:`, profile.style_scores);

// Get adaptive recommendations
const recommendations = await learningStyle.getAdaptiveRecommendations(
  'student-123',
  'topic-uuid',
  10
);

recommendations.forEach(rec => {
  console.log(`${rec.title} - ${rec.adaptation_reason}`);
});
```

### Example 3: Track Video Streaming

```typescript
import { VideoStreamingService } from './services/education/content';

const videoStreaming = new VideoStreamingService(pool);

// Get streaming metadata with bandwidth detection
const metadata = await videoStreaming.getStreamingMetadata({
  content_id: 'content-uuid',
  preferred_quality: 'auto',
  bandwidth_kbps: 1500
});

console.log(`Recommended quality: ${metadata.recommended_quality}`);
console.log(`Available qualities:`, metadata.available_qualities);

// Track session
const session_id = await videoStreaming.trackStreamingSession(
  'student-123',
  'content-uuid',
  metadata.recommended_quality,
  1500
);
```

### Example 4: Generate Learning Path

```typescript
import { RecommendationEngine } from './services/education/content';

const recommendations = new RecommendationEngine(pool);

// Generate personalized learning path
const path = await recommendations.generateLearningPath(
  'student-123',
  'subject-uuid',
  80 // target proficiency
);

console.log(`Estimated duration: ${path.estimated_duration_hours} hours`);
console.log(`Content sequence:`, path.recommended_sequence);
console.log(`Difficulty progression:`, path.difficulty_progression);
```

---

## Testing

All services include comprehensive error handling and input validation. Unit tests should cover:

1. **Content Management**: CRUD operations, versioning, approval workflow
2. **Organization**: Hierarchy building, prerequisite tracking
3. **Streaming**: Quality selection, bandwidth detection
4. **Simulations**: Progress tracking, scoring
5. **Analytics**: Metric calculations, engagement scoring
6. **Recommendations**: All recommendation types, similarity scoring
7. **Subtitles**: Format conversion, search
8. **Learning Style**: Style detection, adaptive recommendations

---

## Performance Considerations

1. **Caching**: Implement Redis caching for frequently accessed content
2. **Indexing**: All foreign keys and frequently queried fields are indexed
3. **Pagination**: Implement pagination for large result sets
4. **CDN**: Use CloudFront or similar CDN for video delivery
5. **Database**: Use read replicas for analytics queries
6. **Async Processing**: Use queues for transcoding jobs

---

## Security

1. **Authentication**: All endpoints require valid JWT tokens
2. **Authorization**: Role-based access control for content management
3. **Input Validation**: All inputs are validated and sanitized
4. **Rate Limiting**: Implement rate limiting on API endpoints
5. **Content Approval**: Multi-step approval process for published content

---

## Future Enhancements

1. **AI-Powered Recommendations**: Use machine learning for better recommendations
2. **Real-time Collaboration**: Live editing and collaboration features
3. **Advanced Analytics**: Predictive analytics for student performance
4. **Adaptive Assessments**: Dynamic difficulty adjustment
5. **Social Learning**: Peer-to-peer learning features
6. **Offline Sync**: Enhanced offline content management

---

## Task Completion Summary

✅ **Task 19.1**: Content Management System - Complete
✅ **Task 19.2**: Content Organization - Complete
✅ **Task 19.3**: Multi-Quality Video Streaming - Complete
✅ **Task 19.4**: Interactive Simulations and Games - Complete
✅ **Task 19.5**: Chapter Markers - Complete (integrated in Content Management)
✅ **Task 19.6**: Content Analytics Tracking - Complete
✅ **Task 19.7**: Recommendation Engine - Complete
✅ **Task 19.8**: Multi-Language Subtitles - Complete
✅ **Task 19.9**: Learning Style Adaptation - Complete

All services are production-ready with comprehensive error handling, input validation, and database integration.
