# Natural Language Search Implementation

## Overview

This document describes the natural language search implementation for the RuralConnect AI Knowledge Base, which enables farmers to search using conversational queries in their language.

## Features Implemented

### 1. Intent Understanding

The system parses natural language queries to extract:
- **Crop entities**: Identifies crops mentioned (rice, wheat, maize, etc.)
- **Category entities**: Detects farming categories (pest management, organic farming, water management, etc.)
- **Tag entities**: Extracts relevant tags (fertilizer, natural methods, techniques, etc.)

#### Example Query Processing:
- **Input**: "How to control pests in rice naturally?"
- **Extracted**:
  - Crops: `['rice']`
  - Categories: `['pest_management']`
  - Tags: `['natural_methods']`

### 2. Multi-Language Support

The system supports both English and Hindi queries:

- **Language Detection**: Automatically detects if query contains Devanagari script
- **Text Search Configuration**: Uses appropriate PostgreSQL text search configuration
  - English queries: `'english'` configuration
  - Hindi queries: `'simple'` configuration (better for non-English languages)
- **Multi-language Content Search**: Searches across both English and Hindi content fields

#### Example Hindi Query:
- **Input**: "धान में कीट नियंत्रण" (Pest control in rice)
- **Processing**: Detects Hindi, uses simple text search, searches both `title->>'hi'` and `content->>'hi'`

### 3. Query Preprocessing

#### Stop Word Removal
Removes common words that don't add semantic value:
- English: how, to, what, is, the, a, an, in, for, of, and, or
- Hindi: कैसे, क्या, है, में, के, लिए, और, या

#### Synonym Expansion
Expands queries with synonyms for better matching:
- `pest` → `pest, insect, bug`
- `paddy` → `paddy, rice`
- `fertilizer` → `fertilizer, fertiliser, manure`
- `organic` → `organic, natural, bio`
- `water` → `water, irrigation, moisture`

This ensures queries like "pest control" also match articles about "insect management".

### 4. Advanced Relevance Ranking

The system uses a multi-factor ranking algorithm:

#### Ranking Factors:

1. **Text Match Relevance** (PostgreSQL ts_rank):
   - Title matches: **4x weight** (highest priority)
   - Summary matches: **2x weight**
   - Content matches: **1x weight**

2. **Evidence Level Bonus**:
   - Strong evidence: **+0.3**
   - Moderate evidence: **+0.2**
   - Traditional knowledge: **+0.1**

3. **Recency Bonus**:
   - Published in last 30 days: **+0.2**
   - Published in last 90 days: **+0.1**
   - Older articles: **+0.0**

4. **Popularity Bonus**:
   - Normalized rating (0-1): **×0.1**
   - Normalized views (0-1): **×0.05**

#### Ranking Formula:
```
score = 4.0 × ts_rank(title) 
      + 1.0 × ts_rank(content)
      + 2.0 × ts_rank(summary)
      + evidence_bonus
      + recency_bonus
      + (rating/5.0 × 0.1)
      + (min(views/1000, 1.0) × 0.05)
```

### 5. Entity-Based Filtering

Extracted entities are automatically applied as filters:

- **Crop entities** → Filter by `applicable_crops`
- **Category entities** → Filter by `category`
- **Tag entities** → Filter by `tags`

This ensures results are highly relevant to the user's intent.

## Example Queries

### Query 1: Pest Management
**Input**: "How to control pests in rice naturally?"

**Processing**:
- Detected crops: `rice`
- Detected categories: `pest_management`
- Detected tags: `natural_methods`
- Expanded query: "control pests rice naturally manage prevent insect bug"

**SQL Filters Applied**:
```sql
WHERE applicable_crops && ARRAY['rice']
  AND category = ANY(ARRAY['pest_management'])
  AND tags && ARRAY['natural_methods']
  AND (title || content || summary) @@ plainto_tsquery('english', '...')
```

### Query 2: Organic Farming
**Input**: "Best organic fertilizer for wheat"

**Processing**:
- Detected crops: `wheat`
- Detected categories: `organic_farming`
- Detected tags: `fertilizer`, `best_practices`
- Expanded query: "best organic fertilizer wheat natural bio fertiliser manure"

### Query 3: Water Conservation
**Input**: "Water saving techniques"

**Processing**:
- Detected categories: `water_management`
- Detected tags: `conservation`, `techniques`
- Expanded query: "water saving techniques irrigation moisture conserve reduce method practice"

### Query 4: Hindi Query
**Input**: "धान में कीट नियंत्रण"

**Processing**:
- Language detected: Hindi
- Text search config: `simple`
- Searches both Hindi and English content
- Detected crops: `rice` (धान)
- Detected categories: `pest_management` (कीट नियंत्रण)

## Implementation Details

### Key Methods

#### `searchArticles(searchQuery: ArticleSearchQuery)`
Main search method that orchestrates the entire search process.

#### `parseNaturalLanguageQuery(query: string)`
Extracts intent and entities from natural language queries.

#### `detectLanguage(query: string)`
Detects if query is in Hindi (Devanagari script) or English.

#### `expandQueryWithSynonyms(query: string)`
Expands query with synonyms for better matching.

### Database Schema

The implementation leverages PostgreSQL features:

- **JSONB fields**: Multi-language content storage (`title`, `content`, `summary`)
- **Array fields**: Crops, tags, regions, seasons
- **Full-text search**: GIN indexes on text content
- **ts_rank**: PostgreSQL text search ranking function

### Performance Considerations

1. **Indexes**: GIN indexes on JSONB fields and arrays for fast filtering
2. **Parameterized queries**: All queries use parameterized values to prevent SQL injection
3. **Efficient ranking**: Ranking calculation done in database for better performance
4. **Pagination**: Results are paginated to limit data transfer

## Testing

Comprehensive unit tests cover:

- ✅ Basic search with filters
- ✅ Natural language query processing
- ✅ Crop entity extraction
- ✅ Hindi language queries
- ✅ Relevance ranking with multiple factors
- ✅ Synonym expansion
- ✅ Category extraction from conversational queries
- ✅ Water management queries
- ✅ Title match prioritization
- ✅ Evidence level bonus
- ✅ Recency bonus
- ✅ Multi-language content search

All tests pass successfully.

## Future Enhancements

Potential improvements for future iterations:

1. **Machine Learning**: Train ML model for better intent classification
2. **Contextual Understanding**: Use embeddings for semantic search
3. **Query Suggestions**: Auto-complete and query suggestions
4. **Spell Correction**: Handle typos and misspellings
5. **Regional Language Support**: Add more Indian languages (Tamil, Telugu, Bengali, etc.)
6. **Voice Search**: Integrate with speech-to-text for voice queries
7. **Search Analytics**: Track popular queries and improve based on user behavior

## Validation Against Requirements

This implementation satisfies **Requirement 6.2** from the spec:

✅ Uses natural language processing to understand intent and return relevant articles
✅ Users can search using conversational queries in their language
✅ System understands farmer's intent even with informal language
✅ Returns relevant articles ranked by relevance

The implementation also validates **Property 15** from the design document:
> For any search query in the knowledge base, all returned articles should contain keywords or concepts related to the search intent.
