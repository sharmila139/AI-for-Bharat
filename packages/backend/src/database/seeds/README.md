# Knowledge Base Seed Data

This directory contains seed scripts to populate the RuralConnect AI knowledge base with 500+ articles on sustainable farming practices.

## Overview

The seed script generates comprehensive articles covering:

- **Organic Farming** (150 articles): Composting, green manure, biofertilizers, organic inputs
- **Pest Management** (150 articles): Natural pesticides, biological control, IPM, disease management
- **Soil Conservation** (100 articles): Mulching, terracing, cover crops, erosion control
- **Water Management** (100 articles): Irrigation systems, rainwater harvesting, watershed management
- **Crop Rotation** (50 articles): Cereal-based, legume-based, vegetable-based rotations

## Features

### Multi-Language Support
- All articles include English and Hindi translations
- Titles, content, summaries, and implementation guides in both languages

### Evidence Levels
- **Strong**: Scientifically validated practices (60% of articles)
- **Moderate**: Field-tested with good results (30% of articles)
- **Traditional**: Time-tested traditional knowledge (10% of articles)

### Comprehensive Content
Each article includes:
- Multi-language title and content
- Category and subcategory classification
- Searchable tags
- Evidence level with scientific references
- Step-by-step implementation guide
- Materials and tools required
- Environmental, economic, and social benefits
- Applicable crops, regions, and seasons
- Community engagement metrics (views, ratings, success stories)

## Usage

### Prerequisites
- PostgreSQL database running
- Database schema created (run migrations first)
- Environment variables configured

### Running the Seed Script

```bash
# From the backend directory
cd packages/backend

# Set environment variables
export DB_HOST=localhost
export DB_PORT=5432
export DB_NAME=ruralconnect
export DB_USER=postgres
export DB_PASSWORD=your_password

# Run the seed script
npm run seed:knowledge-base
# or
ts-node src/database/seeds/knowledge-base-seed.ts
```

### Expected Output

```
Starting knowledge base seed process...

Generating organic farming articles...
Generating pest management articles...
Generating soil conservation articles...
Generating water management articles...
Generating crop rotation articles...
Generated 550 articles

Inserting batch 1/11...
Inserting batch 2/11...
...
Successfully seeded 550 articles!

=== Knowledge Base Statistics ===

Total Articles: 550

Articles by Category:
  organic_farming: 150
  pest_management: 150
  soil_conservation: 100
  water_management: 100
  crop_rotation: 50

Articles by Evidence Level:
  strong: 330
  moderate: 165
  traditional: 55

Articles by Language:
  English: 550
  Hindi: 550

=================================

Knowledge base seed completed successfully!
```

## Article Distribution

### By Category
| Category | Count | Percentage |
|----------|-------|------------|
| Organic Farming | 150 | 27.3% |
| Pest Management | 150 | 27.3% |
| Soil Conservation | 100 | 18.2% |
| Water Management | 100 | 18.2% |
| Crop Rotation | 50 | 9.1% |

### By Evidence Level
| Evidence Level | Count | Percentage |
|----------------|-------|------------|
| Strong | 330 | 60% |
| Moderate | 165 | 30% |
| Traditional | 55 | 10% |

### By Subcategory
- **Organic Farming**: composting, greenManure, biofertilizers, organicInputs
- **Pest Management**: naturalPesticides, biologicalControl, ipm, diseaseManagement
- **Soil Conservation**: mulching, terracing, coverCrops, erosionControl
- **Water Management**: irrigation, rainwaterHarvesting, watershedManagement, waterConservation
- **Crop Rotation**: cerealBased, legumeBased, vegetableBased

## Data Quality

### Diversity
- Multiple article variations for each topic (10 variations per topic)
- Different perspectives: complete guides, best practices, step-by-step methods
- Targeted content: for small farms, large farms, beginners, advanced users
- Regional and seasonal variations

### Realistic Metrics
- View counts: 0-1000 (randomized)
- Ratings: 1-5 stars with realistic distribution
- Success stories: 0-20 per article
- Published dates: Distributed over the past year

### Applicability
- Crops: Rice, wheat, maize, cotton, sugarcane, pulses, vegetables, fruits, millets, oilseeds
- Regions: Punjab, Haryana, UP, Maharashtra, Karnataka, Tamil Nadu, AP, West Bengal, All-India
- Seasons: Kharif, Rabi, Zaid, Year-round

## Validation

After seeding, verify the data:

```sql
-- Check total count
SELECT COUNT(*) FROM knowledge_articles;

-- Check category distribution
SELECT category, COUNT(*) 
FROM knowledge_articles 
GROUP BY category;

-- Check evidence level distribution
SELECT evidence_level, COUNT(*) 
FROM knowledge_articles 
GROUP BY evidence_level;

-- Check multi-language support
SELECT 
  COUNT(*) FILTER (WHERE title->>'en' IS NOT NULL) as has_english,
  COUNT(*) FILTER (WHERE title->>'hi' IS NOT NULL) as has_hindi
FROM knowledge_articles;

-- Sample articles
SELECT 
  title->>'en' as title,
  category,
  subcategory,
  evidence_level,
  view_count,
  rating_count
FROM knowledge_articles
LIMIT 10;
```

## Maintenance

### Resetting the Database
To clear existing articles and reseed:

```sql
-- Delete all articles
DELETE FROM knowledge_articles;

-- Reset sequences if needed
-- (The seed script checks for existing articles and skips if found)
```

### Adding More Articles
To add more articles, modify the topic arrays in `knowledge-base-seed.ts` and adjust the article counts in the generation logic.

## Notes

- The seed script is idempotent - it checks for existing articles and skips seeding if data already exists
- All articles are marked as 'published' status
- Scientific references are placeholder data - replace with real references in production
- Media URLs are empty - populate with actual images/videos as needed
- Implementation guides are template-based - customize for specific practices
