# Knowledge Base Content Management System

## Overview

The Knowledge Base system provides a comprehensive content management platform for sustainable farming practices, supporting 500+ articles with multi-language content, community engagement, and verification workflows.

## Features

### 1. Multi-Language Support
- **15+ Indian Languages**: English, Hindi, Tamil, Telugu, Bengali, Marathi, Gujarati, Kannada, Malayalam, Punjabi, Odia, Assamese, Urdu, Kashmiri, Konkani, Manipuri
- **JSONB Storage**: Efficient storage of multi-language content
- **Language Fallback**: Automatic fallback to English when translation unavailable

### 2. Content Types

#### Articles
- **Categories**: Organic farming, pest management, soil conservation, water management, crop rotation
- **Evidence Levels**: Traditional, Moderate, Strong (with scientific references)
- **Multi-format Media**: Images, videos, audio guides
- **Implementation Guides**: Step-by-step instructions with materials, tools, and timeline

#### Benefits Quantification
- **Environmental Impact**: Carbon reduction, water saved, soil improvement
- **Economic Returns**: ROI, payback period, cost reduction
- **Social Benefits**: Community impact, health benefits

### 3. Community Engagement

#### Ratings and Reviews
- 1-5 star rating system
- Written reviews
- Implementation tracking

#### Success Stories
- User-submitted success stories
- Results quantification (yield increase, cost reduction)
- Photo and video evidence
- Verification workflow

#### Q&A Discussions
- Community questions and answers
- Expert answer verification
- Upvoting system
- Accepted answer marking

### 4. Verification Workflow
- Extension officer verification
- Verification notes and dates
- Verified content badge
- Quality assurance process

### 5. Search and Discovery

#### Natural Language Search
- Full-text search across title, content, summary
- Multi-language search support
- Relevance ranking

#### Advanced Filtering
- Category and subcategory
- Evidence level
- Tags
- Applicable crops, regions, seasons
- Language availability
- Minimum rating

#### Sorting Options
- Relevance
- Rating
- Views
- Recent
- Success stories

### 6. Analytics

#### Article Analytics
- View count
- Average rating
- Success story count
- Question count
- Implementation count
- Engagement score

#### Knowledge Base Statistics
- Total articles by status
- Articles by category
- Articles by evidence level
- Articles by language
- Overall engagement metrics

## Database Schema

### Core Tables

#### knowledge_articles
Main article storage with multi-language content, media, and metadata.

**Key Fields:**
- `title`, `content`, `summary`: JSONB for multi-language
- `category`, `subcategory`, `tags`: Classification
- `evidence_level`: Traditional, Moderate, Strong
- `scientific_references`: JSONB array
- `implementation_guide`: JSONB with steps, materials, tools
- `benefits`: JSONB with environmental, economic, social
- `media`: JSONB with images, videos, audio
- `verification_date`, `verified_by`: Verification tracking
- `status`: Draft, Review, Published, Archived

#### crop_rotation_plans
3-5 year crop rotation sequences with benefits.

**Key Fields:**
- `rotation_sequence`: JSONB array of year/season/crop
- `soil_health_improvement`: Nutrient gains
- `financial_benefits`: Investment and returns

#### article_ratings
User ratings and reviews.

**Key Fields:**
- `rating`: 1-5 stars
- `review_text`: Optional review
- `implemented`: Implementation tracking

#### success_stories
Community success stories.

**Key Fields:**
- `title`, `story_text`: Multi-language JSONB
- `results_achieved`: Quantified results
- `verified`: Verification status

#### article_questions & article_answers
Q&A system.

**Key Fields:**
- `question_text`, `answer_text`: Question and answer content
- `is_expert_answer`: Expert verification
- `is_accepted`: Accepted answer flag
- `upvote_count`: Community voting

### Triggers

#### update_article_rating_stats
Automatically updates article rating statistics when ratings are added/updated/deleted.

#### update_question_answered_status
Marks questions as answered when an answer is accepted.

#### update_success_story_count
Updates article success story count when stories are approved.

## API Endpoints

### Article Management

```
POST   /api/knowledge-base/articles          Create article
GET    /api/knowledge-base/articles/:id      Get article
PUT    /api/knowledge-base/articles/:id      Update article
DELETE /api/knowledge-base/articles/:id      Archive article
POST   /api/knowledge-base/articles/:id/verify   Verify article
POST   /api/knowledge-base/articles/:id/publish  Publish article
```

### Search and Discovery

```
POST   /api/knowledge-base/search            Search articles
GET    /api/knowledge-base/categories/:cat   Get by category
GET    /api/knowledge-base/trending          Get trending
```

### Community Engagement

```
POST   /api/knowledge-base/articles/:id/rate              Rate article
GET    /api/knowledge-base/articles/:id/ratings           Get ratings
POST   /api/knowledge-base/articles/:id/success-stories   Submit story
GET    /api/knowledge-base/articles/:id/success-stories   Get stories
POST   /api/knowledge-base/articles/:id/questions         Ask question
POST   /api/knowledge-base/questions/:id/answers          Answer question
GET    /api/knowledge-base/articles/:id/qa                Get Q&A
```

### Analytics

```
GET    /api/knowledge-base/articles/:id/analytics   Article analytics
GET    /api/knowledge-base/stats                    KB statistics
```

## Usage Examples

### Creating an Article

```typescript
const article = await knowledgeBaseService.createArticle({
  title: {
    en: 'Organic Pest Control with Neem',
    hi: 'नीम से जैविक कीट नियंत्रण'
  },
  content: {
    en: 'Neem oil is an effective organic pesticide...',
    hi: 'नीम का तेल एक प्रभावी जैविक कीटनाशक है...'
  },
  category: 'pest_management',
  evidence_level: 'strong',
  scientific_references: [
    {
      title: 'Efficacy of Neem Oil',
      authors: 'Kumar et al.',
      year: 2023,
      journal: 'Journal of Organic Agriculture'
    }
  ],
  implementation_guide: {
    steps: [
      {
        step: 1,
        description: {
          en: 'Mix 5ml neem oil with 1 liter water',
          hi: '5 मिली नीम का तेल 1 लीटर पानी में मिलाएं'
        },
        duration: '5 minutes'
      }
    ],
    materials: [
      {
        name: { en: 'Neem oil', hi: 'नीम का तेल' },
        quantity: '100ml',
        cost: 150
      }
    ],
    tools: [
      {
        name: { en: 'Spray bottle', hi: 'स्प्रे बोतल' }
      }
    ],
    timeline: '1 week'
  },
  benefits: {
    environmental: {
      description: {
        en: 'No chemical residue in soil',
        hi: 'मिट्टी में कोई रासायनिक अवशेष नहीं'
      },
      impact: 'high'
    },
    economic: {
      description: {
        en: 'Reduces pesticide costs by 70%',
        hi: 'कीटनाशक लागत में 70% की कमी'
      },
      roi: '300%',
      payback_period: '1 season'
    }
  },
  applicable_crops: ['rice', 'wheat', 'vegetables'],
  applicable_regions: ['punjab', 'haryana', 'up'],
  applicable_seasons: ['kharif', 'rabi'],
  available_languages: ['en', 'hi'],
  primary_language: 'en'
}, 'user-123');
```

### Searching Articles

```typescript
const results = await knowledgeBaseService.searchArticles({
  query: 'organic pest control',
  filters: {
    category: 'pest_management',
    evidence_level: 'strong',
    applicable_crops: ['rice'],
    language: 'hi',
    verified_only: true,
    min_rating: 4
  },
  sort_by: 'rating',
  sort_order: 'desc',
  page: 1,
  limit: 20,
  language: 'hi'
});
```

### Rating an Article

```typescript
const rating = await knowledgeBaseService.rateArticle(
  'article-123',
  'user-456',
  5,
  'Very helpful! Increased my yield by 30%'
);
```

### Submitting a Success Story

```typescript
const story = await knowledgeBaseService.submitSuccessStory({
  article_id: 'article-123',
  user_id: 'user-456',
  title: {
    en: 'Doubled My Tomato Yield',
    hi: 'मेरी टमाटर की उपज दोगुनी हो गई'
  },
  story_text: {
    en: 'After following the organic pest control method...',
    hi: 'जैविक कीट नियंत्रण विधि का पालन करने के बाद...'
  },
  results_achieved: {
    yield_increase: '100%',
    cost_reduction: '50%',
    time_saved: '5 hours/week'
  },
  images: ['https://example.com/before.jpg', 'https://example.com/after.jpg'],
  location_district: 'Ludhiana',
  location_state: 'Punjab'
});
```

## Integration with AI Assistant

The knowledge base integrates with the AI assistant for:

1. **Natural Language Search**: Users can ask questions in their language
2. **Intent Understanding**: AI detects when users need knowledge base content
3. **Contextual Recommendations**: AI suggests relevant articles based on user context
4. **Voice Interaction**: Text-to-speech for article content

## Performance Considerations

### Indexing
- Full-text search index on title, content, summary
- GIN indexes on arrays (tags, crops, languages)
- B-tree indexes on frequently queried fields

### Caching
- Cache popular articles in Redis
- Cache search results for common queries
- Cache statistics for dashboard

### Optimization
- Lazy loading of media content
- Pagination for large result sets
- Efficient JSONB queries

## Content Guidelines

### Article Quality
- Minimum 500 words for main content
- At least 3 scientific references for "strong" evidence
- Clear step-by-step instructions
- High-quality images and videos

### Multi-Language
- Professional translations (not machine-translated)
- Cultural adaptation of content
- Local terminology and examples

### Verification
- Extension officer review required
- Field testing for implementation guides
- Regular content updates

## Future Enhancements

1. **AI-Powered Recommendations**: Personalized article suggestions
2. **Offline Sync**: Download articles for offline access
3. **Video Transcription**: Automatic subtitle generation
4. **Community Moderation**: User-driven content quality
5. **Gamification**: Badges for contributions and implementations
6. **Integration with Crop Recommendations**: Link articles to recommended crops
7. **Seasonal Reminders**: Notify users of relevant seasonal practices

## Testing

Run unit tests:
```bash
npm test knowledge-base-service.test.ts
```

Run integration tests:
```bash
npm test knowledge-base-integration.test.ts
```

## Deployment

1. Run database migrations:
```bash
psql -d ruralconnect -f packages/backend/src/database/schemas/02_agriculture_knowledge_enhanced.sql
```

2. Seed initial content:
```bash
npm run seed:knowledge-base
```

3. Configure environment variables:
```
KNOWLEDGE_BASE_CACHE_TTL=3600
KNOWLEDGE_BASE_MAX_UPLOAD_SIZE=10485760
```

## Support

For questions or issues, contact the development team or refer to the main project documentation.
