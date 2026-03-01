/**
 * Content Library and Curriculum Alignment Services
 * Export all content-related services
 */

export { ContentManagementService } from './content-management';
export type { ContentData, VideoMetadata, ChapterMarker, ContentVersion, ApprovalWorkflow } from './content-management';

export { ContentOrganizationService } from './content-organization';
export type { Subject, Topic, CurriculumAlignment, ContentHierarchy, TopicWithSubtopics } from './content-organization';

export { VideoStreamingService } from './video-streaming';
export type { VideoQuality, VideoStreamingOptions, StreamingMetadata, BandwidthProfile, TranscodingJob } from './video-streaming';

export { InteractiveSimulationsService } from './interactive-simulations';
export type { 
  Simulation, Game, SimulationProgress, GameProgress,
  InteractiveElement, SimulationConfig, GameMechanics
} from './interactive-simulations';

export { ContentAnalyticsService } from './content-analytics';
export type { 
  ContentAnalytics, DropOffAnalysis, EngagementMetrics, 
  PopularContent, ViewEvent
} from './content-analytics';

export { RecommendationEngine } from './recommendation-engine';
export type { 
  RecommendationRequest, ContentRecommendation, SimilarContent,
  LearningPathRecommendation
} from './recommendation-engine';

export { SubtitleService } from './subtitle-service';
export type { 
  Subtitle, SubtitleCue, Transcript, TranscriptSearchResult,
  TranscriptMatch
} from './subtitle-service';

export { LearningStyleAdaptationService } from './learning-style-adaptation';
export type { 
  LearningStyle, LearningStyleProfile, ContentPreferences,
  AdaptiveContentRecommendation, PerformanceByStyle
} from './learning-style-adaptation';
