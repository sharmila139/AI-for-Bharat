# Implementation Guide Documentation

## Overview

Implementation guides provide step-by-step instructions for farmers to implement sustainable farming practices. Each guide includes:

- **Steps**: Detailed, sequential instructions with duration estimates
- **Materials**: Required materials with quantities and costs
- **Tools**: Required and optional tools
- **Timeline**: Overall time to complete the implementation
- **Difficulty Level**: Easy, medium, or hard

## Structure

### ImplementationGuide Interface

```typescript
interface ImplementationGuide {
  steps: ImplementationStep[];
  materials: Material[];
  tools: Tool[];
  timeline: string;
  difficulty_level?: 'easy' | 'medium' | 'hard';
}
```

### ImplementationStep

```typescript
interface ImplementationStep {
  step: number;                      // Sequential step number (1, 2, 3...)
  description: MultiLanguageText;    // Step description in multiple languages
  duration?: string;                 // Time required (e.g., "2-3 hours")
  image_url?: string;                // Optional image showing the step
  warnings?: MultiLanguageText[];    // Safety warnings or important notes
}
```

### Material

```typescript
interface Material {
  name: MultiLanguageText;           // Material name in multiple languages
  quantity: string;                  // Amount needed (e.g., "100 kg", "5 liters")
  cost?: number;                     // Cost in local currency
  where_to_find?: MultiLanguageText; // Where to source the material
}
```

### Tool

```typescript
interface Tool {
  name: MultiLanguageText;           // Tool name in multiple languages
  optional?: boolean;                // Whether the tool is optional
}
```

## Validation Rules

The `ImplementationGuideService` validates guides to ensure they are complete and practical:

### Required Fields

1. **Steps**: At least one step is required
   - Each step must have a sequential number
   - Each step must have a description in at least English
   - Step numbers must be consecutive (1, 2, 3...)

2. **Materials**: At least one material is required
   - Each material must have a name in at least English
   - Each material must have a quantity

3. **Tools**: At least one tool is required
   - Each tool must have a name in at least English

4. **Timeline**: Overall timeline is required (e.g., "45-60 days", "2-3 weeks")

5. **Difficulty Level** (optional): Must be 'easy', 'medium', or 'hard' if provided

## Available Templates

The service provides pre-built templates for common farming practices:

### 1. Composting
- **Category**: Organic Farming
- **Difficulty**: Easy
- **Timeline**: 45-60 days
- **Description**: Create nutrient-rich compost from farm waste

### 2. Vermicompost
- **Category**: Organic Farming
- **Difficulty**: Medium
- **Timeline**: 45-60 days
- **Description**: Create high-quality vermicompost using earthworms

### 3. Green Manure
- **Category**: Soil Conservation
- **Difficulty**: Easy
- **Timeline**: 60-75 days
- **Description**: Improve soil fertility using green manure crops

### 4. Mulching
- **Category**: Water Management
- **Difficulty**: Easy
- **Timeline**: 1-2 days
- **Description**: Conserve soil moisture and suppress weeds using mulch

### 5. Drip Irrigation
- **Category**: Water Management
- **Difficulty**: Hard
- **Timeline**: 3-5 days for 1 acre
- **Description**: Install efficient drip irrigation system to save water

### 6. Natural Pest Control
- **Category**: Pest Management
- **Difficulty**: Medium
- **Timeline**: 2-4 weeks
- **Description**: Control pests using natural methods without chemicals

## API Endpoints

### Add Implementation Guide to Article

```http
POST /api/knowledge-base/articles/:id/implementation-guide
Content-Type: application/json

{
  "steps": [...],
  "materials": [...],
  "tools": [...],
  "timeline": "45-60 days",
  "difficulty_level": "easy"
}
```

### Get Implementation Guide

```http
GET /api/knowledge-base/articles/:id/implementation-guide?language=hi
```

### Validate Guide

```http
POST /api/knowledge-base/implementation-guide/validate
Content-Type: application/json

{
  "steps": [...],
  "materials": [...],
  "tools": [...],
  "timeline": "45-60 days"
}
```

### Get All Templates

```http
GET /api/knowledge-base/implementation-guide/templates
```

### Get Specific Template

```http
GET /api/knowledge-base/implementation-guide/templates/composting
```

### Apply Template to Article

```http
POST /api/knowledge-base/articles/:id/implementation-guide/from-template
Content-Type: application/json

{
  "template_name": "composting"
}
```

## Example: Complete Implementation Guide

Here's a complete example of a composting implementation guide:

```json
{
  "steps": [
    {
      "step": 1,
      "description": {
        "en": "Select a shaded, well-drained location for your compost pit. Dig a pit 3 feet deep, 3 feet wide, and 9 feet long.",
        "hi": "अपने खाद गड्ढे के लिए छायादार, अच्छी जल निकासी वाली जगह चुनें। 3 फीट गहरा, 3 फीट चौड़ा और 9 फीट लंबा गड्ढा खोदें।"
      },
      "duration": "2-3 hours",
      "warnings": [
        {
          "en": "Avoid waterlogged areas to prevent anaerobic decomposition",
          "hi": "अवायवीय अपघटन को रोकने के लिए जलभराव वाले क्षेत्रों से बचें"
        }
      ]
    },
    {
      "step": 2,
      "description": {
        "en": "Layer green materials (fresh leaves, grass clippings, kitchen waste) and brown materials (dry leaves, straw, wood chips) in a 1:3 ratio.",
        "hi": "हरी सामग्री (ताजी पत्तियां, घास की कतरनें, रसोई का कचरा) और भूरी सामग्री (सूखी पत्तियां, पुआल, लकड़ी के चिप्स) को 1:3 के अनुपात में परत लगाएं।"
      },
      "duration": "1-2 hours"
    }
  ],
  "materials": [
    {
      "name": {
        "en": "Green waste (fresh leaves, grass)",
        "hi": "हरा कचरा (ताजी पत्तियां, घास)"
      },
      "quantity": "100 kg",
      "cost": 0,
      "where_to_find": {
        "en": "Farm waste",
        "hi": "खेत का कचरा"
      }
    },
    {
      "name": {
        "en": "Brown waste (dry leaves, straw)",
        "hi": "भूरा कचरा (सूखी पत्तियां, पुआल)"
      },
      "quantity": "300 kg",
      "cost": 0,
      "where_to_find": {
        "en": "Farm waste",
        "hi": "खेत का कचरा"
      }
    }
  ],
  "tools": [
    {
      "name": {
        "en": "Spade or shovel",
        "hi": "फावड़ा या बेलचा"
      },
      "optional": false
    },
    {
      "name": {
        "en": "Pitchfork",
        "hi": "पिचफोर्क"
      },
      "optional": false
    }
  ],
  "timeline": "45-60 days",
  "difficulty_level": "easy"
}
```

## Best Practices for Creating Guides

### 1. Clear and Actionable Steps

- Use simple, direct language
- Start each step with an action verb
- Include specific measurements and quantities
- Provide duration estimates for each step

### 2. Comprehensive Materials List

- List all required materials with exact quantities
- Include cost estimates to help farmers budget
- Specify where materials can be sourced
- Distinguish between free farm waste and purchased items

### 3. Tool Requirements

- Clearly mark optional vs. required tools
- Use common tool names that farmers recognize
- Suggest alternatives when possible

### 4. Safety Warnings

- Include warnings for potentially dangerous steps
- Highlight common mistakes to avoid
- Provide troubleshooting tips

### 5. Multi-Language Support

- Always provide English translations
- Add translations in regional languages
- Use culturally appropriate terminology
- Consider local farming practices

### 6. Realistic Timelines

- Provide realistic time estimates
- Account for waiting periods (decomposition, drying, etc.)
- Mention seasonal considerations
- Include maintenance schedules

### 7. Visual Aids

- Add images for complex steps
- Use diagrams for layouts and measurements
- Include before/after photos
- Show proper technique demonstrations

## Integration with Knowledge Base

Implementation guides are stored as JSONB in the `knowledge_articles` table:

```sql
CREATE TABLE knowledge_articles (
  ...
  implementation_guide JSONB,
  ...
);
```

This allows for:
- Flexible schema evolution
- Efficient querying
- Multi-language content storage
- Easy updates without schema changes

## Validation Example

```typescript
import { ImplementationGuideService } from './implementation-guide-service';

const guideService = new ImplementationGuideService();

const guide = {
  steps: [
    {
      step: 1,
      description: { en: 'First step' },
      duration: '1 hour'
    }
  ],
  materials: [
    {
      name: { en: 'Material 1' },
      quantity: '10 kg'
    }
  ],
  tools: [
    {
      name: { en: 'Tool 1' },
      optional: false
    }
  ],
  timeline: '1 week',
  difficulty_level: 'easy'
};

// Validate the guide
const errors = guideService.validateGuide(guide);

if (errors.length === 0) {
  console.log('Guide is valid!');
} else {
  console.log('Validation errors:', errors);
}

// Check if guide is complete
const isComplete = guideService.isGuideComplete(guide);
console.log('Guide is complete:', isComplete);
```

## Frontend Display Recommendations

### Step-by-Step View

- Display steps in a numbered list or stepper component
- Show duration for each step
- Highlight warnings prominently
- Allow users to mark steps as complete
- Show progress indicator

### Materials Checklist

- Display as a checklist
- Show total cost calculation
- Group by where to find (farm waste vs. purchased)
- Allow users to mark items as acquired

### Tools List

- Separate required and optional tools
- Show tool images if available
- Suggest alternatives for expensive tools

### Timeline Visualization

- Show overall timeline prominently
- Break down by phases if applicable
- Indicate waiting periods clearly
- Show seasonal considerations

### Difficulty Indicator

- Use visual badges (Easy/Medium/Hard)
- Explain what makes it that difficulty level
- Suggest prerequisites for harder guides

## Conclusion

Implementation guides are a critical feature for making sustainable farming practices accessible and actionable for farmers. By providing clear, step-by-step instructions with all necessary information, we empower farmers to successfully implement new techniques and improve their farming practices.
