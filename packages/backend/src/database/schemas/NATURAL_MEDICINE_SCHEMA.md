# Natural Medicine Database Schema Documentation

## Overview

The Natural Medicine Database schema provides a comprehensive system for storing, managing, and retrieving information about natural remedies with multi-language support. This schema is designed to support the Primary Healthcare Module's Natural Medicine Database feature (Requirement 8).

## Schema Version

- **Version**: 1.0
- **File**: `06_natural_medicine.sql`
- **Created**: 2024
- **Database**: PostgreSQL 12+

## Design Principles

### 1. Multi-Language Support
- All user-facing text (remedy names, ingredient names, instructions) stored in JSONB format
- Supports 15+ Indian languages plus scientific names
- English (`en`) is required; other languages are optional
- Format: `{"en": "English", "hi": "Hindi", "ta": "Tamil", "scientific": "Scientific name"}`

### 2. Normalized Design
- Separate tables for ingredients, preparation steps, dosage guidelines, and safety information
- Enables flexible querying and updates without data duplication
- Maintains referential integrity through foreign key constraints

### 3. Search Optimization
- Full-text search indexes on remedy names and descriptions
- GIN indexes on array fields (ailments, symptoms, seasonal availability)
- Composite indexes for common query patterns

### 4. Community-Driven Content
- User ratings and reviews with effectiveness tracking
- Automatic success rate calculation based on user feedback
- Verification workflow for Ayurvedic doctors

### 5. Safety First
- Comprehensive safety information required before publishing
- Age-specific dosage guidelines
- Drug interactions and contraindications tracking
- Validation triggers prevent publishing incomplete remedies

## Table Structure

### Core Tables

#### 1. `remedies`
**Purpose**: Core remedy information with multi-language names and verification status

**Key Fields**:
- `remedy_id` (UUID, PK): Unique identifier
- `names` (JSONB): Multi-language names including scientific name
- `ailments_treated` (TEXT[]): Array of ailments this remedy treats
- `efficacy_rating` (DECIMAL): Rating from 1.0 to 5.0
- `evidence_level` (VARCHAR): traditional | moderate | strong
- `success_rate_percentage` (DECIMAL): Calculated from user feedback
- `verification_status` (VARCHAR): pending | verified | rejected
- `status` (VARCHAR): draft | review | published | archived

**Indexes**:
- Full-text search on English names and descriptions
- GIN indexes on ailments and symptoms arrays
- Indexes on efficacy rating and success rate for ranking

#### 2. `remedy_ingredients`
**Purpose**: Ingredients for each remedy with seasonal availability

**Key Fields**:
- `ingredient_id` (UUID, PK)
- `remedy_id` (UUID, FK → remedies)
- `ingredient_name` (JSONB): Multi-language ingredient names
- `quantity` (VARCHAR): Amount needed (e.g., "1 teaspoon")
- `seasonal_availability` (INTEGER[]): Months when available (1-12)
- `substitutes` (JSONB): Alternative ingredients
- `display_order` (INTEGER): Order in recipe

**Features**:
- Tracks seasonal availability for ingredient sourcing
- Supports substitute ingredients for flexibility
- Ordered display for recipe presentation

#### 3. `preparation_methods`
**Purpose**: Step-by-step preparation instructions with media support

**Key Fields**:
- `step_id` (UUID, PK)
- `remedy_id` (UUID, FK → remedies)
- `step_number` (INTEGER): Order of steps
- `description` (TEXT): Step instructions
- `description_multilang` (JSONB): Multi-language instructions
- `duration_minutes` (INTEGER): Time for this step
- `temperature` (VARCHAR): Heat level or temperature
- `image_url`, `video_url`, `audio_url` (TEXT): Media resources

**Features**:
- Sequential step numbering
- Multi-modal content (text, images, video, audio)
- Timing and temperature guidance

#### 4. `dosage_guidelines`
**Purpose**: Age-specific dosage information for safe usage

**Key Fields**:
- `dosage_id` (UUID, PK)
- `remedy_id` (UUID, FK → remedies)
- `age_group` (VARCHAR): infant | child | adult | elderly | pregnant | lactating
- `age_range_min`, `age_range_max` (INTEGER): Age range in years
- `dosage_amount` (VARCHAR): How much to take
- `frequency` (VARCHAR): How often (e.g., "twice daily")
- `duration` (VARCHAR): How long to continue
- `best_time` (VARCHAR): Optimal timing (e.g., "before meals")

**Features**:
- Separate guidelines for each age group
- Special handling for pregnant and lactating women
- Flexible age range specification

#### 5. `safety_information`
**Purpose**: Comprehensive safety data for each remedy

**Key Fields**:
- `safety_id` (UUID, PK)
- `remedy_id` (UUID, FK → remedies, UNIQUE)
- `side_effects` (JSONB): Array of side effects with severity
- `contraindications` (JSONB): Conditions where remedy should not be used
- `drug_interactions` (JSONB): Interactions with medications
- `allergy_warnings` (JSONB): Potential allergens
- `safe_for_pregnancy`, `safe_for_children`, etc. (BOOLEAN): Safety flags
- `warnings`, `precautions` (TEXT[]): Additional safety information

**JSONB Structure Examples**:
```json
// Side effects
[
  {"effect": "nausea", "severity": "mild", "frequency": "rare"},
  {"effect": "drowsiness", "severity": "moderate", "frequency": "occasional"}
]

// Drug interactions
[
  {"drug": "aspirin", "interaction": "increases bleeding risk", "severity": "moderate"}
]

// Contraindications
[
  {"condition": "kidney disease", "reason": "may worsen condition", "severity": "contraindicated"}
]
```

#### 6. `user_ratings`
**Purpose**: Community feedback and effectiveness tracking

**Key Fields**:
- `rating_id` (UUID, PK)
- `remedy_id` (UUID, FK → remedies)
- `user_id` (UUID, FK → users)
- `rating` (INTEGER): 1 to 5 stars
- `review_text` (TEXT): User's written review
- `ailment_treated` (VARCHAR): What they used it for
- `effectiveness` (VARCHAR): very_effective | effective | somewhat_effective | not_effective
- `days_used` (INTEGER): Duration of usage
- `helpful_count`, `not_helpful_count` (INTEGER): Community votes

**Features**:
- One rating per user per remedy (unique constraint)
- Effectiveness tracking separate from star rating
- Community voting on review helpfulness

## Automated Features

### Triggers

1. **Updated Timestamp Triggers**
   - Automatically updates `updated_at` on all tables when records are modified
   - Ensures accurate change tracking

2. **Success Rate Calculation**
   - Trigger: `update_success_rate_on_rating`
   - Automatically recalculates remedy success rate when ratings are added/updated
   - Formula: (Count of 'very_effective' + 'effective') / Total ratings with effectiveness * 100

3. **Remedy Completeness Validation**
   - Trigger: `validate_remedy_before_publish`
   - Prevents publishing remedies without required information:
     - Safety information must exist
     - At least one dosage guideline required
     - At least one preparation step required
     - At least one ingredient required

### Views

1. **`published_remedies_with_ratings`**
   - Combines remedy data with aggregated rating statistics
   - Shows only published and verified remedies
   - Includes: total ratings, average rating, positive feedback count

2. **`seasonal_remedies`**
   - Shows remedies with ingredients available in current month
   - Useful for seasonal recommendations
   - Filters by current month's number

3. **`top_rated_remedies`**
   - Top 50 remedies by average rating and efficacy
   - Requires minimum 5 ratings for inclusion
   - Ordered by average rating DESC, then efficacy rating DESC

## Query Patterns

### Search Remedies by Ailment
```sql
SELECT r.*, 
       COUNT(ur.rating_id) as rating_count,
       AVG(ur.rating) as avg_rating
FROM remedies r
LEFT JOIN user_ratings ur ON r.remedy_id = ur.remedy_id
WHERE r.status = 'published'
  AND r.verification_status = 'verified'
  AND 'headache' = ANY(r.ailments_treated)
GROUP BY r.remedy_id
ORDER BY r.efficacy_rating DESC, r.success_rate_percentage DESC;
```

### Get Complete Remedy with All Details
```sql
SELECT 
  r.*,
  json_agg(DISTINCT ri.*) as ingredients,
  json_agg(DISTINCT pm.* ORDER BY pm.step_number) as preparation_steps,
  json_agg(DISTINCT dg.*) as dosage_guidelines,
  si.* as safety_info
FROM remedies r
LEFT JOIN remedy_ingredients ri ON r.remedy_id = ri.remedy_id
LEFT JOIN preparation_methods pm ON r.remedy_id = pm.remedy_id
LEFT JOIN dosage_guidelines dg ON r.remedy_id = dg.remedy_id
LEFT JOIN safety_information si ON r.remedy_id = si.remedy_id
WHERE r.remedy_id = $1
GROUP BY r.remedy_id, si.safety_id;
```

### Find Remedies Safe for Children
```sql
SELECT r.*, si.safe_for_children
FROM remedies r
JOIN safety_information si ON r.remedy_id = si.remedy_id
WHERE si.safe_for_children = TRUE
  AND r.status = 'published'
  AND r.verification_status = 'verified';
```

### Search by Ingredient Availability (Current Month)
```sql
SELECT DISTINCT r.*
FROM remedies r
JOIN remedy_ingredients ri ON r.remedy_id = ri.remedy_id
WHERE EXTRACT(MONTH FROM CURRENT_DATE)::INTEGER = ANY(ri.seasonal_availability)
  AND r.status = 'published';
```

## Data Integrity

### Constraints

1. **Check Constraints**:
   - Rating values: 1-5 range
   - Efficacy rating: 1.0-5.0 range
   - Success rate: 0-100 percentage
   - Age range: min <= max
   - Seasonal months: 1-12 only
   - Valid enum values for all status fields

2. **Foreign Key Constraints**:
   - All child tables reference `remedies` with CASCADE delete
   - User references for ratings and verification
   - Maintains referential integrity

3. **Unique Constraints**:
   - One safety record per remedy
   - One rating per user per remedy
   - Unique step numbers per remedy

4. **NOT NULL Constraints**:
   - Required fields: names, ailments_treated, evidence_level
   - Ensures minimum data quality

### JSONB Validation

- `names` must be an object with at least `en` key
- `ingredient_name` must be an object with at least `en` key
- Enforced through CHECK constraints

## Performance Considerations

### Indexes

1. **B-tree Indexes**: Standard lookups (status, category, ratings)
2. **GIN Indexes**: Array and JSONB searches (ailments, symptoms, seasonal availability)
3. **Full-text Indexes**: Text search on names and descriptions
4. **Partial Indexes**: Filtered indexes for common queries (verified remedies, safe for children)

### Query Optimization

- Use views for common aggregations
- Leverage indexes for filtering and sorting
- Consider materialized views for heavy analytics queries
- Use EXPLAIN ANALYZE to optimize slow queries

## Migration Strategy

### Initial Setup
1. Run `06_natural_medicine.sql` to create schema
2. Verify all tables, indexes, and triggers created
3. Test constraints with sample data

### Data Population
1. Import verified remedies from trusted sources
2. Require Ayurvedic doctor verification before publishing
3. Seed with 300+ remedies as per requirements

### Future Enhancements
- Add materialized views for analytics
- Implement full-text search ranking
- Add remedy recommendation algorithm
- Track remedy view counts and popularity

## Security Considerations

1. **Access Control**:
   - Only verified Ayurvedic doctors can verify remedies
   - Users can only edit their own ratings
   - Admins can manage all content

2. **Data Validation**:
   - Triggers prevent incomplete remedies from being published
   - Check constraints ensure data quality
   - JSONB structure validation

3. **Audit Trail**:
   - Created/updated timestamps on all tables
   - Verification tracking with user ID and timestamp
   - Rating history preserved

## Related Requirements

This schema implements the following requirements from the specification:

- **Requirement 8.1**: Database of 300+ natural remedies with multi-language names
- **Requirement 8.2**: Remedy search with ranking by efficacy and success rate
- **Requirement 8.3**: Preparation method documentation
- **Requirement 8.4**: Age-specific dosage calculator
- **Requirement 8.5**: Safety information (side effects, contraindications, drug interactions, allergy warnings)
- **Requirement 8.6**: Seasonal ingredient availability tracking
- **Requirement 8.7**: Efficacy rating and evidence level system
- **Requirement 8.8**: Video and audio instruction delivery (URLs stored)
- **Requirement 8.9**: Verification workflow for Ayurvedic doctors

## TypeScript Integration

TypeScript interfaces are defined in `packages/backend/src/types/natural-medicine.ts`:
- `Remedy`, `RemedyIngredient`, `PreparationMethod`, `DosageGuideline`
- `SafetyInformation`, `UserRating`, `CompleteRemedy`
- Request/Response types for API endpoints
- Search filters and result types

## Testing Recommendations

1. **Unit Tests**:
   - Test JSONB structure validation
   - Verify constraint enforcement
   - Test trigger functionality

2. **Integration Tests**:
   - Test complete remedy creation workflow
   - Verify search and ranking algorithms
   - Test verification workflow

3. **Performance Tests**:
   - Load test with 1000+ remedies
   - Test search performance with various filters
   - Verify index effectiveness

## Maintenance

### Regular Tasks
- Monitor query performance
- Update indexes based on query patterns
- Archive old ratings (optional)
- Backup verification data

### Monitoring
- Track remedy publication rate
- Monitor user rating activity
- Alert on verification backlog
- Track search performance metrics
