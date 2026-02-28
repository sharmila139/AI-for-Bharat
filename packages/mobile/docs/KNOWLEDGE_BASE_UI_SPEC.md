# Knowledge Base UI Specification

## Overview

This document provides a comprehensive specification for the Knowledge Base UI components in the RuralConnect AI mobile application. The UI enables farmers to search, browse, and interact with sustainable farming knowledge through an intuitive, accessible interface.

## Completed Components

### 1. KnowledgeBaseSearchScreen
**Location**: `packages/mobile/src/screens/agriculture/KnowledgeBaseSearchScreen.tsx`

**Features**:
- Natural language search input with voice search support
- Filter button with badge showing active filter count
- Trending articles display on initial load
- Search results with article count
- Pull-to-refresh functionality
- Empty state handling
- Loading indicators

**Props**: None (uses navigation)

**State Management**:
- Search query
- Articles list
- Loading states
- Filter state
- Trending vs search results mode

### 2. ArticleListItem
**Location**: `packages/mobile/src/components/knowledge-base/ArticleListItem.tsx`

**Features**:
- Thumbnail image display
- Article title and summary
- Category badge
- Evidence level badge
- Star rating with count
- View count
- Verified badge for verified content
- Applicable crops display
- Responsive card layout

**Props**:
```typescript
{
  article: {
    article_id: string;
    title: MultiLanguageText;
    summary?: MultiLanguageText;
    category: string;
    evidence_level: 'traditional' | 'moderate' | 'strong';
    average_rating?: number;
    rating_count: number;
    view_count: number;
    verified_by?: string;
    media?: { images?: Array<{ url: string; thumbnail_url?: string }> };
    applicable_crops?: string[];
  };
  onPress: () => void;
}
```

### 3. EvidenceBadge
**Location**: `packages/mobile/src/components/knowledge-base/EvidenceBadge.tsx`

**Features**:
- Visual badge with color coding
- Icon representation
- Label text
- Three evidence levels: traditional (orange), moderate (blue), strong (green)
- Size variants: small, medium, large

**Props**:
```typescript
{
  level: 'traditional' | 'moderate' | 'strong';
  size?: 'small' | 'medium' | 'large';
  showLabel?: boolean;
}
```

### 4. FilterModal
**Location**: `packages/mobile/src/components/knowledge-base/FilterModal.tsx`

**Features**:
- Category filter (single selection)
- Evidence level filter (multiple selection)
- Crops filter (multiple selection)
- Season filter (multiple selection)
- Sort by options (relevance, rating, date)
- Reset filters button
- Apply filters button
- Chip-based UI for selections
- Scrollable content

**Props**:
```typescript
{
  visible: boolean;
  filters: {
    category?: string;
    evidence_level?: string[];
    crops?: string[];
    regions?: string[];
    seasons?: string[];
    sort_by?: 'relevance' | 'rating' | 'date';
  };
  onApply: (filters: any) => void;
  onClose: () => void;
}
```

### 5. ArticleDetailScreen
**Location**: `packages/mobile/src/screens/agriculture/ArticleDetailScreen.tsx`

**Features**:
- Back navigation
- Bookmark toggle
- Share functionality
- Tab navigation (Content, Guide, Q&A, Stories)
- Full article content display
- Media gallery
- Evidence badge and verification status
- Applicable crops/regions/seasons tags
- Ratings component integration
- Implementation guide viewer
- Q&A section
- Success stories section

**Route Params**:
```typescript
{
  articleId: string;
}
```

### 6. knowledge-base-api Service
**Location**: `packages/mobile/src/services/api/knowledge-base-api.ts`

**Functions**:
- `searchArticles(query)` - Search with filters
- `getTrendingArticles(limit, language)` - Get trending content
- `getArticlesByCategory(category, language, limit)` - Category browsing
- `getArticleById(articleId, language)` - Get full article
- `rateArticle(articleId, rating, reviewText)` - Submit rating
- `getArticleRatings(articleId, limit)` - Get ratings
- `askQuestion(articleId, questionText)` - Ask question
- `answerQuestion(questionId, answerText, isExpert)` - Answer question
- `getArticleQA(articleId, limit)` - Get Q&A
- `upvoteQuestion(questionId)` - Upvote question
- `upvoteAnswer(answerId)` - Upvote answer
- `acceptAnswer(answerId)` - Accept answer
- `submitSuccessStory(articleId, storyData)` - Submit story
- `getSuccessStories(articleId, limit)` - Get stories
- `markStoryHelpful(storyId)` - Mark story helpful
- `bookmarkArticle(articleId)` - Bookmark
- `unbookmarkArticle(articleId)` - Remove bookmark
- `generateRotationPlan(planData)` - Generate crop rotation
- `validateRotationSequence(sequence)` - Validate rotation

## Components to Implement

### 7. MediaGallery
**Location**: `packages/mobile/src/components/knowledge-base/MediaGallery.tsx`

**Purpose**: Display article media (images, videos, audio) in a gallery format

**Features**:
- Image carousel with thumbnails
- Video player with quality selection
- Audio player with playback controls
- Full-screen image viewer
- Pinch-to-zoom for images
- Caption and alt text display
- Download for offline viewing
- Adaptive quality based on bandwidth

**Props**:
```typescript
{
  media: {
    images: Array<{
      url: string;
      thumbnail_url?: string;
      caption?: MultiLanguageText;
      alt_text?: MultiLanguageText;
    }>;
    videos: Array<{
      url: string;
      thumbnail_url?: string;
      caption?: MultiLanguageText;
      duration?: number;
    }>;
    audio: Array<{
      url: string;
      caption?: MultiLanguageText;
      duration?: number;
    }>;
  };
}
```

**UI Layout**:
```
┌─────────────────────────────┐
│  [Main Image/Video]         │
│                             │
│  ┌───┐ ┌───┐ ┌───┐ ┌───┐  │
│  │ 1 │ │ 2 │ │ 3 │ │ 4 │  │ <- Thumbnails
│  └───┘ └───┘ └───┘ └───┘  │
│                             │
│  Caption text here...       │
└─────────────────────────────┘
```

### 8. RatingComponent
**Location**: `packages/mobile/src/components/knowledge-base/RatingComponent.tsx`

**Purpose**: Display ratings and allow users to submit reviews

**Features**:
- Average rating display with stars
- Rating count
- Star rating input (1-5 stars)
- Review text input
- Submit button
- Recent reviews list
- User's own rating highlight
- Edit existing rating

**Props**:
```typescript
{
  articleId: string;
  currentRating?: number;
  ratingCount: number;
  ratings: Array<{
    rating_id: string;
    user_id: string;
    rating: number;
    review_text?: string;
    created_at: string;
  }>;
  onRatingSubmit: () => void;
}
```

**UI Layout**:
```
┌─────────────────────────────┐
│ ★★★★☆ 4.2 (156 ratings)    │
│                             │
│ Rate this article:          │
│ ☆☆☆☆☆                      │
│                             │
│ ┌─────────────────────────┐ │
│ │ Write your review...    │ │
│ └─────────────────────────┘ │
│ [Submit Rating]             │
│                             │
│ Recent Reviews:             │
│ ┌─────────────────────────┐ │
│ │ ★★★★★ User Name        │ │
│ │ Great article! Very...  │ │
│ │ 2 days ago              │ │
│ └─────────────────────────┘ │
└─────────────────────────────┘
```

### 9. QASection
**Location**: `packages/mobile/src/components/knowledge-base/QASection.tsx`

**Purpose**: Display Q&A and allow users to ask/answer questions

**Features**:
- Ask question button
- Question list with upvotes
- Answer list per question
- Upvote questions/answers
- Accept answer (for question owner)
- Expert answer badge
- Sort by: most upvoted, recent, accepted
- Expand/collapse answers
- Reply to answer

**Props**:
```typescript
{
  articleId: string;
  qaData: Array<{
    question_id: string;
    question_text: string;
    user_id: string;
    upvotes: number;
    created_at: string;
    answers: Array<{
      answer_id: string;
      answer_text: string;
      user_id: string;
      upvotes: number;
      is_expert_answer: boolean;
      is_accepted: boolean;
      created_at: string;
    }>;
  }>;
  onRefresh: () => void;
}
```

**UI Layout**:
```
┌─────────────────────────────┐
│ [Ask a Question]            │
│                             │
│ ┌─────────────────────────┐ │
│ │ ↑ 15  Q: How to apply?  │ │
│ │       User • 3 days ago │ │
│ │                         │ │
│ │   ✓ A: You should...    │ │ <- Accepted
│ │     Expert • 2 days ago │ │
│ │     ↑ 8                 │ │
│ │                         │ │
│ │   A: Another way is...  │ │
│ │     User • 1 day ago    │ │
│ │     ↑ 3                 │ │
│ └─────────────────────────┘ │
└─────────────────────────────┘
```

### 10. SuccessStoryCard
**Location**: `packages/mobile/src/components/knowledge-base/SuccessStoryCard.tsx`

**Purpose**: Display success stories from farmers

**Features**:
- Story title and description
- Before/after photos
- Results achieved (yield increase, cost reduction, etc.)
- Location and crop information
- Helpful count
- Mark as helpful button
- Verification badge
- Share story

**Props**:
```typescript
{
  story: {
    story_id: string;
    article_id: string;
    user_id: string;
    title: MultiLanguageText;
    description: MultiLanguageText;
    before_photos?: string[];
    after_photos?: string[];
    results_achieved: {
      yield_increase?: string;
      cost_reduction?: string;
      time_saved?: string;
      other_benefits?: string;
    };
    location: string;
    crop: string;
    implementation_duration: string;
    helpful_count: number;
    verified_by?: string;
    created_at: string;
  };
}
```

**UI Layout**:
```
┌─────────────────────────────┐
│ ✓ Verified Success Story    │
│                             │
│ Increased Yield by 40%      │
│ Rice • Maharashtra          │
│                             │
│ ┌──────┐      ┌──────┐     │
│ │Before│  →   │After │     │
│ └──────┘      └──────┘     │
│                             │
│ Story description...        │
│                             │
│ Results:                    │
│ • Yield: +40%               │
│ • Cost: -25%                │
│                             │
│ 👍 45 found helpful         │
│ [Mark as Helpful]           │
└─────────────────────────────┘
```

### 11. ImplementationGuideViewer
**Location**: `packages/mobile/src/components/knowledge-base/ImplementationGuideViewer.tsx`

**Purpose**: Display step-by-step implementation guides

**Features**:
- Step-by-step instructions with images
- Materials list with quantities and costs
- Tools required
- Timeline display
- Difficulty level indicator
- Progress tracking (mark steps as complete)
- Warnings and tips highlighting
- Print/download guide
- Offline access

**Props**:
```typescript
{
  guide: {
    steps: Array<{
      step: number;
      description: MultiLanguageText;
      duration?: string;
      image_url?: string;
      warnings?: MultiLanguageText[];
    }>;
    materials: Array<{
      name: MultiLanguageText;
      quantity: string;
      cost?: number;
      where_to_find?: MultiLanguageText;
    }>;
    tools: Array<{
      name: MultiLanguageText;
      optional?: boolean;
    }>;
    timeline: string;
    difficulty_level?: 'easy' | 'medium' | 'hard';
  };
}
```

**UI Layout**:
```
┌─────────────────────────────┐
│ Difficulty: ●●○ Medium      │
│ Timeline: 2-3 weeks         │
│                             │
│ Materials Needed:           │
│ • Compost - 50kg - ₹500     │
│ • Seeds - 2kg - ₹200        │
│                             │
│ Tools Required:             │
│ • Spade                     │
│ • Watering can (optional)   │
│                             │
│ Steps:                      │
│ ┌─────────────────────────┐ │
│ │ ☐ Step 1: Prepare soil  │ │
│ │   [Image]               │ │
│ │   Description...        │ │
│ │   ⚠ Warning: Avoid...   │ │
│ │   Duration: 2 days      │ │
│ └─────────────────────────┘ │
│ ┌─────────────────────────┐ │
│ │ ☐ Step 2: Plant seeds   │ │
│ │   ...                   │ │
│ └─────────────────────────┘ │
└─────────────────────────────┘
```

### 12. CropRotationPlanViewer
**Location**: `packages/mobile/src/components/knowledge-base/CropRotationPlanViewer.tsx`

**Purpose**: Visualize crop rotation plans

**Features**:
- Timeline visualization (3-5 years)
- Season-wise crop display
- Benefits per rotation
- Soil health improvement indicators
- Financial breakdown
- Export plan as PDF
- Set reminders for planting
- Alternative crop suggestions

**Props**:
```typescript
{
  plan: {
    plan_id: string;
    rotation_sequence: Array<{
      year: number;
      season: string;
      crop: string;
      benefits: MultiLanguageText;
      expected_yield?: string;
    }>;
    soil_health_improvement: {
      nitrogen_gain?: string;
      phosphorus_gain?: string;
      potassium_gain?: string;
      organic_matter?: string;
      description: MultiLanguageText;
    };
    financial_breakdown: {
      total_investment: number;
      expected_revenue: number;
      profit_margin: string;
      year_wise_breakdown: Array<{
        year: number;
        investment: number;
        revenue: number;
        profit: number;
      }>;
    };
  };
}
```

**UI Layout**:
```
┌─────────────────────────────┐
│ 3-Year Rotation Plan        │
│                             │
│ Year 1                      │
│ ├─ Kharif: Rice             │
│ │  Benefits: N fixation     │
│ └─ Rabi: Wheat              │
│    Benefits: Soil cover     │
│                             │
│ Year 2                      │
│ ├─ Kharif: Pulses           │
│ └─ Rabi: Mustard            │
│                             │
│ Year 3                      │
│ ├─ Kharif: Cotton           │
│ └─ Rabi: Chickpea           │
│                             │
│ Soil Health Improvement:    │
│ ┌─────────────────────────┐ │
│ │ Nitrogen:  ████░░ +40%  │ │
│ │ Phosphorus:███░░░ +30%  │ │
│ │ Organic:   █████░ +50%  │ │
│ └─────────────────────────┘ │
│                             │
│ Financial Summary:          │
│ Investment: ₹1,50,000       │
│ Revenue:    ₹2,25,000       │
│ Profit:     ₹75,000 (50%)   │
│                             │
│ [Export Plan] [Set Reminder]│
└─────────────────────────────┘
```

## Additional Features to Implement

### Voice Search Integration
**Hook**: `useVoiceSearch`
**Location**: `packages/mobile/src/hooks/useVoiceSearch.ts`

**Features**:
- Start/stop voice recording
- Speech-to-text conversion
- Multi-language support
- Error handling
- Permission management

### Offline Content Caching
**Service**: `OfflineCacheService`
**Location**: `packages/mobile/src/services/cache/offline-cache-service.ts`

**Features**:
- Cache articles for offline reading
- Cache media files
- Sync bookmarks
- Queue actions for online sync
- Storage management
- Cache expiration

### Language Context
**Context**: `LanguageContext`
**Location**: `packages/mobile/src/contexts/LanguageContext.tsx`

**Features**:
- Current language state
- Language switcher
- Translation function (t)
- RTL support
- Fallback to English

### Auth Context
**Context**: `AuthContext`
**Location**: `packages/mobile/src/contexts/AuthContext.tsx`

**Features**:
- User authentication state
- User profile
- Login/logout
- Token management

## Styling Guidelines

### Colors
- Primary: `#007AFF` (iOS blue)
- Success: `#4CAF50` (green)
- Warning: `#FF9800` (orange)
- Error: `#FF3B30` (red)
- Info: `#2196F3` (blue)
- Text Primary: `#333`
- Text Secondary: `#666`
- Text Tertiary: `#999`
- Background: `#fff`
- Background Secondary: `#f5f5f5`
- Border: `#e0e0e0`

### Typography
- Title: 24px, bold
- Heading: 20px, bold
- Subheading: 16px, semi-bold
- Body: 16px, regular
- Caption: 14px, regular
- Small: 12px, regular

### Spacing
- Extra Small: 4px
- Small: 8px
- Medium: 12px
- Large: 16px
- Extra Large: 24px
- XXL: 32px

### Border Radius
- Small: 4px
- Medium: 8px
- Large: 12px
- Round: 50%

### Shadows (iOS)
```typescript
{
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.1,
  shadowRadius: 4,
}
```

### Elevation (Android)
- Low: 2
- Medium: 4
- High: 8

## Accessibility Guidelines

1. **Screen Reader Support**
   - Add `accessibilityLabel` to all interactive elements
   - Use `accessibilityHint` for complex actions
   - Set `accessibilityRole` appropriately

2. **Touch Targets**
   - Minimum 44x44 points for all touchable elements
   - Adequate spacing between interactive elements

3. **Color Contrast**
   - Minimum 4.5:1 for normal text
   - Minimum 3:1 for large text
   - Don't rely on color alone for information

4. **Text Scaling**
   - Support dynamic type sizes
   - Test with large text settings
   - Ensure layouts don't break with scaled text

5. **Voice Commands**
   - Support voice input for search
   - Provide audio feedback for actions
   - Text-to-speech for content reading

## Performance Considerations

1. **Image Optimization**
   - Use thumbnail URLs for lists
   - Lazy load images
   - Cache images locally
   - Compress before upload

2. **List Performance**
   - Use `FlatList` with `keyExtractor`
   - Implement `getItemLayout` for fixed heights
   - Use `removeClippedSubviews` on Android
   - Limit initial render count

3. **API Calls**
   - Implement request debouncing for search
   - Cache API responses
   - Use pagination for large lists
   - Handle offline gracefully

4. **Memory Management**
   - Clean up listeners on unmount
   - Release media resources
   - Limit cache size
   - Monitor memory usage

## Testing Strategy

1. **Unit Tests**
   - Test API service functions
   - Test utility functions
   - Test component logic

2. **Component Tests**
   - Test rendering with different props
   - Test user interactions
   - Test error states
   - Test loading states

3. **Integration Tests**
   - Test navigation flows
   - Test API integration
   - Test offline functionality
   - Test multi-language support

4. **E2E Tests**
   - Test complete user journeys
   - Test search and filter flow
   - Test article reading flow
   - Test community engagement flow

## Implementation Priority

### Phase 1 (Completed)
- ✅ KnowledgeBaseSearchScreen
- ✅ ArticleListItem
- ✅ EvidenceBadge
- ✅ FilterModal
- ✅ ArticleDetailScreen
- ✅ knowledge-base-api service

### Phase 2 (High Priority)
- MediaGallery
- RatingComponent
- QASection
- ImplementationGuideViewer

### Phase 3 (Medium Priority)
- SuccessStoryCard
- CropRotationPlanViewer
- Voice search hook
- Offline caching service

### Phase 4 (Low Priority)
- Advanced filters
- Personalized recommendations
- Social sharing enhancements
- Analytics tracking

## Conclusion

This specification provides a comprehensive blueprint for implementing the Knowledge Base UI in the RuralConnect AI mobile application. The completed components provide the core search and browsing functionality, while the remaining components will enable full community engagement and implementation guidance features.

All components follow React Native best practices, accessibility guidelines, and the design system established for the application. The modular architecture allows for incremental implementation and easy maintenance.
