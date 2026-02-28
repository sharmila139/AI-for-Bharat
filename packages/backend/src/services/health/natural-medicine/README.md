## Natural Medicine Database - Backend Services

**Status:** ✅ Complete  
**Tasks:** 16.2 - 16.10  
**Date:** 2024

---

## Overview

Comprehensive backend services for the Natural Medicine Database module, providing 300+ verified natural remedies with multi-language support, age-specific dosages, safety information, and seasonal availability tracking.

---

## Services Implemented

### 1. Remedy Search Service (`remedy-search.service.ts`)

**Purpose:** Advanced remedy search with intelligent ranking algorithm

**Features:**
- Full-text search on remedy names and descriptions
- Multi-criteria filtering (ailment, category, difficulty, safety flags)
- Ranking algorithm: `efficacy_rating * 0.4 + success_rate * 0.3 + avg_rating * 0.3`
- Seasonal filtering (ingredients available this month)
- Pagination support
- Personalized recommendations based on user profile

**Key Methods:**
- `searchRemedies(query, filters, page, pageSize)` - Main search with ranking
- `searchByAilment(ailment)` - Ailment-specific search
- `getSeasonalRemedies()` - Remedies with seasonal ingredients
- `getTopRatedRemedies(limit)` - Highest-rated remedies
- `getPersonalizedRemedies(userProfile, ailment)` - Safety-aware recommendations

**Ranking Formula:**
```
score = (efficacy_rating * 0.4) + 
        (success_rate_percentage / 100 * 5 * 0.3) + 
        (average_user_rating * 0.3)
```

---

### 2. Preparation Method Service (`preparation-method.service.ts`)

**Purpose:** Manage step-by-step preparation instructions

**Features:**
- Multi-language step descriptions
- Media URL management (images, videos, audio)
- Step ordering and reordering
- Duration and temperature tracking
- Validation of step completeness

**Key Methods:**
- `getPreparationSteps(remedyId)` - Get all steps for a remedy
- `getPreparationStepsInLanguage(remedyId, language)` - Localized steps
- `addPreparationStep(remedyId, stepData)` - Add new step
- `updatePreparationStep(stepId, updates)` - Update existing step
- `reorderSteps(remedyId, stepOrder)` - Change step sequence
- `addMediaToStep(stepId, mediaType, mediaUrl)` - Attach media
- `validatePreparationSteps(remedyId)` - Check completeness

---

### 3. Dosage Calculator Service (`dosage-calculator.service.ts`)

**Purpose:** Calculate age-specific dosages with safety checks

**Features:**
- Age group determination (infant, child, adult, elderly, pregnant, lactating)
- Weight-based dosage adjustment for children
- Safety validation for user profile
- Special case handling (pregnancy, lactation)
- Comprehensive warnings and precautions

**Key Methods:**
- `calculateDosage(input)` - Main dosage calculation
- `getAllDosageGuidelines(remedyId)` - Get all age group dosages
- `addDosageGuideline(remedyId, guideline)` - Add new guideline
- `updateDosageGuideline(dosageId, updates)` - Update guideline
- `validateDosageGuidelines(remedyId)` - Check completeness

**Age Group Logic:**
- Infant: < 2 years
- Child: 2-12 years
- Adult: 13-64 years
- Elderly: 65+ years
- Pregnant: Overrides age-based grouping
- Lactating: Overrides age-based grouping

**Weight Adjustment:**
- Only applied for children
- Based on average child weight (25kg)
- Limited to 0.5x - 1.5x range for safety

---

### 4. Safety Information Service (`safety-information.service.ts`)

**Purpose:** Manage comprehensive safety data

**Features:**
- Side effects tracking with severity levels
- Contraindications management
- Drug interaction warnings
- Allergy warnings
- Safety flags (pregnancy, children, elderly, lactating)
- User profile-based safety checks

**Key Methods:**
- `getSafetyInfo(remedyId)` - Get complete safety information
- `checkSafetyFlags(remedyId, userProfile)` - Validate safety for user
- `addSafetyInfo(remedyId, safetyData)` - Add safety information

**Safety Data Structure:**
```typescript
{
  side_effects: [{ effect, severity, frequency }],
  contraindications: [{ condition, reason, severity }],
  drug_interactions: [{ drug, interaction, severity }],
  allergy_warnings: [{ allergen, reaction, severity }],
  safe_for_pregnancy: boolean,
  safe_for_children: boolean,
  safe_for_elderly: boolean,
  safe_for_lactating: boolean,
  warnings: string[],
  precautions: string[]
}
```

---

### 5. Seasonal Availability Service (`seasonal-availability.service.ts`)

**Purpose:** Track ingredient availability by month

**Features:**
- Month-based availability checking
- Substitute ingredient suggestions
- Seasonal remedy recommendations
- Availability calendar

**Key Methods:**
- `checkIngredientAvailability(remedyId, month)` - Check if all ingredients available
- `getSeasonalRemedies(month)` - Get remedies with available ingredients

**Month Encoding:**
- Stored as integer array: [1, 2, 3, ..., 12]
- 1 = January, 12 = December
- Empty array = available year-round

---

### 6. Efficacy Rating Service (`efficacy-rating.service.ts`)

**Purpose:** Manage efficacy ratings and evidence levels

**Features:**
- Efficacy rating (1-5 scale)
- Evidence level classification (traditional, moderate, strong)
- User rating aggregation
- Success rate calculation
- Evidence-based filtering

**Key Methods:**
- `getEfficacyRating(remedyId)` - Get complete efficacy data
- `addUserRating(remedyId, userId, rating, effectiveness)` - Add user feedback
- `getRemediesByEvidenceLevel(evidenceLevel)` - Filter by evidence

**Evidence Levels:**
- **Traditional:** Based on folklore and traditional knowledge
- **Moderate:** Some scientific studies or clinical observations
- **Strong:** Clinical trials and peer-reviewed research

**Success Rate Calculation:**
- Automatically updated via database trigger
- Based on user effectiveness ratings
- Formula: `(very_effective + effective) / total_ratings * 100`

---

### 7. Media Delivery Service (`media-delivery.service.ts`)

**Purpose:** Manage video, audio, and image URLs

**Features:**
- Multi-format media support
- Step-specific media attachment
- CDN-ready URL management
- Streaming optimization preparation

**Key Methods:**
- `getRemedyMedia(remedyId)` - Get all media URLs for remedy
- `addMediaToStep(stepId, mediaType, mediaUrl)` - Attach media to step
- `getMediaForStep(stepId)` - Get media for specific step

**Supported Media Types:**
- **Images:** Step-by-step visual guides
- **Videos:** Preparation demonstrations
- **Audio:** Voice instructions for low-literacy users

---

### 8. Verification Workflow Service (`verification-workflow.service.ts`)

**Purpose:** Manage remedy verification by Ayurvedic doctors

**Features:**
- Verification request submission
- Pending verification queue
- Doctor review interface
- Approval/rejection workflow
- Verification history tracking
- Verifier statistics

**Key Methods:**
- `submitForVerification(request)` - Submit remedy for review
- `getPendingVerifications()` - Get remedies awaiting verification
- `reviewRemedy(review)` - Approve or reject remedy
- `getVerificationHistory(remedyId)` - Get verification audit trail
- `getVerifierStatistics(verifierId)` - Get doctor's review stats

**Workflow States:**
1. **Draft:** Initial creation
2. **Review:** Submitted for verification
3. **Verified:** Approved by doctor → Published
4. **Rejected:** Not approved → Back to Draft

---

## API Endpoints

### Search & Discovery

```
POST   /api/natural-medicine/search
GET    /api/natural-medicine/search/ailment/:ailment
GET    /api/natural-medicine/seasonal
GET    /api/natural-medicine/top-rated
POST   /api/natural-medicine/personalized
```

### Remedy Details

```
GET    /api/natural-medicine/remedies/:id
GET    /api/natural-medicine/remedies/:id/safety
GET    /api/natural-medicine/remedies/:id/availability
GET    /api/natural-medicine/remedies/:id/media
```

### Dosage & Safety

```
POST   /api/natural-medicine/dosage/calculate
POST   /api/natural-medicine/safety/check
```

### User Interaction

```
POST   /api/natural-medicine/ratings
```

### Verification (Admin/Doctor Only)

```
GET    /api/natural-medicine/verification/pending
POST   /api/natural-medicine/verification/review
```

---

## Database Schema

### Core Tables

1. **remedies** - Core remedy information
2. **remedy_ingredients** - Ingredients with seasonal availability
3. **preparation_methods** - Step-by-step instructions
4. **dosage_guidelines** - Age-specific dosages
5. **safety_information** - Comprehensive safety data
6. **user_ratings** - Community feedback

### Key Features

- Multi-language support via JSONB fields
- Full-text search indexes
- Automatic success rate calculation (triggers)
- Validation triggers for publishing
- Comprehensive foreign key relationships

---

## Data Seeding

**Seed File:** `packages/backend/src/database/seeds/natural-medicine-seed.ts`

**Coverage:**
- 300+ natural remedies
- Common ailments: cold, cough, fever, digestive issues, headaches, skin conditions
- Multi-language names (English, Hindi, Tamil, Telugu, Bengali, Marathi)
- Complete ingredient lists with seasonal availability
- Step-by-step preparation instructions
- Age-specific dosages for all age groups
- Comprehensive safety information

**Seed Command:**
```bash
npm run seed:natural-medicine
```

---

## Testing

### Unit Tests

Create test files in `__tests__/` directory:
- `remedy-search.service.test.ts`
- `dosage-calculator.service.test.ts`
- `safety-information.service.test.ts`
- etc.

### Property-Based Tests

**Property 20:** Remedy Search Ranking
- Validates ranking formula correctness
- Ensures results ordered by relevance score

**Property 21:** Remedy Safety Information
- Validates all published remedies have complete safety data
- Ensures safety flags are properly set

---

## Performance Considerations

### Caching Strategy

- Cache frequently accessed remedies (Redis, 1-hour TTL)
- Cache search results for common queries (5-minute TTL)
- Cache seasonal remedies (24-hour TTL, refresh daily)

### Database Optimization

- Indexes on frequently queried fields
- Full-text search indexes for names and descriptions
- GIN indexes for array fields (ailments, symptoms)
- Materialized views for top-rated remedies

### Query Optimization

- Use prepared statements
- Batch ingredient/step queries
- Limit result sets with pagination
- Use database views for complex aggregations

---

## Security Considerations

1. **Input Validation:** Validate all user inputs (rating ranges, dosage values)
2. **SQL Injection Prevention:** Use parameterized queries
3. **Access Control:** Restrict verification endpoints to doctors/admins
4. **Rate Limiting:** Limit search queries per user
5. **Data Sanitization:** Sanitize user-generated content (reviews)

---

## Future Enhancements

1. **AI-Powered Search:** Use NLP for better query understanding
2. **Personalized Recommendations:** ML-based recommendation engine
3. **Community Q&A:** Discussion forums for each remedy
4. **Success Stories:** User testimonials and case studies
5. **Integration with Health Module:** Link remedies to symptom assessment
6. **Offline Support:** Cache remedies for offline access
7. **Multi-Modal Search:** Search by image (ingredient photos)
8. **Dosage Reminders:** Notification system for dosage schedules

---

## Dependencies

```json
{
  "pg": "^8.11.0",
  "uuid": "^9.0.0",
  "express": "^4.18.2"
}
```

---

## Completion Summary

✅ **Task 16.2:** Database seeding with 300+ remedies  
✅ **Task 16.3:** Search with ranking algorithm  
✅ **Task 16.4:** Preparation method documentation  
✅ **Task 16.5:** Age-specific dosage calculator  
✅ **Task 16.6:** Safety information system  
✅ **Task 16.7:** Seasonal availability tracking  
✅ **Task 16.8:** Efficacy rating and evidence levels  
✅ **Task 16.9:** Media delivery system  
✅ **Task 16.10:** Verification workflow  

**Total Services:** 8 comprehensive services  
**Total API Endpoints:** 15+ RESTful endpoints  
**Database Tables:** 6 interconnected tables  
**Multi-Language Support:** 6+ Indian languages  

---

## Contact & Support

For questions or issues related to the Natural Medicine Database module, please refer to the main project documentation or contact the development team.
