/**
 * Entity Extraction Service
 * Extracts structured entities from user queries for different modules
 */

import { getBedrockService } from '../bedrock';

export interface ExtractedEntity {
  type: string;
  value: string;
  confidence: number;
  normalized?: string;
  metadata?: Record<string, any>;
}

export interface EntityExtractionResult {
  entities: ExtractedEntity[];
  structuredData: Record<string, any>;
  module: string;
}

export class EntityExtractor {
  private bedrock = getBedrockService();

  /**
   * Extract entities from message based on module
   */
  async extractEntities(
    message: string,
    module: string,
    language: string = 'en'
  ): Promise<EntityExtractionResult> {
    const systemPrompt = this.buildExtractionPrompt(module, language);

    const prompt = `User message: "${message}"

Extract all relevant entities and return as JSON:
{
  "entities": [
    {
      "type": "<entity_type>",
      "value": "<extracted_value>",
      "confidence": <0.0-1.0>,
      "normalized": "<standardized_value>",
      "metadata": {}
    }
  ],
  "structuredData": {
    // Module-specific structured data
  }
}`;

    const response = await this.bedrock.generateWithCache(prompt, {
      modelType: 'haiku',
      systemPrompt,
      useCache: true,
      maxTokens: 800
    });

    return this.parseExtractionResponse(response.text, message, module);
  }

  /**
   * Build extraction prompt for specific module
   */
  private buildExtractionPrompt(module: string, language: string): string {
    const basePrompt = `You are an entity extraction system for RuralConnect AI.
Extract entities from user messages in ${language}.
Be precise and extract only explicitly mentioned information.`;

    const modulePrompts: Record<string, string> = {
      agriculture: `${basePrompt}

AGRICULTURE ENTITIES:
- crop_name: Names of crops (rice, wheat, tomato, cotton, etc.)
- soil_type: Soil types (alluvial, black, red, sandy, clayey, loamy)
- land_area: Area measurements (5 acres, 2 hectares, etc.)
- location: Village, district, state names
- season: Kharif, Rabi, Zaid, or months
- irrigation_type: Rainfed, drip, sprinkler, flood
- pest_name: Names of pests or diseases
- weather_condition: Rain, drought, temperature, etc.
- time_reference: Today, tomorrow, this week, next month
- price_query: Price-related information

STRUCTURED DATA:
{
  "crops": ["crop1", "crop2"],
  "location": "village/district",
  "landArea": { "value": 5, "unit": "acres" },
  "soilType": "black",
  "season": "kharif",
  "timeframe": "next_month"
}`,

      health: `${basePrompt}

HEALTH ENTITIES:
- symptom: Health symptoms (fever, cough, pain, headache, etc.)
- body_part: Body parts (head, stomach, chest, leg, etc.)
- duration: How long symptoms have lasted
- severity: Mild, moderate, severe
- age: Patient age
- gender: Patient gender
- existing_condition: Pre-existing medical conditions
- medication: Current medications
- allergy: Known allergies
- emergency_indicator: Words indicating emergency

STRUCTURED DATA:
{
  "symptoms": ["fever", "cough"],
  "bodyParts": ["chest"],
  "duration": "3 days",
  "severity": "moderate",
  "patientInfo": {
    "age": 45,
    "gender": "male"
  },
  "isEmergency": false
}`,

      education: `${basePrompt}

EDUCATION ENTITIES:
- subject: Subject names (math, science, english, history, etc.)
- grade: Class/grade level (1-12, college)
- topic: Specific topics within subjects
- exam_type: CBSE, ICSE, state board, competitive exams
- skill: Skills to learn (coding, english speaking, etc.)
- difficulty: Easy, medium, hard
- time_available: Study time available
- goal: Learning goals or targets

STRUCTURED DATA:
{
  "subjects": ["mathematics", "science"],
  "grade": 10,
  "topics": ["algebra", "geometry"],
  "examType": "CBSE",
  "difficulty": "medium",
  "goals": ["improve_marks", "exam_preparation"]
}`,

      infrastructure: `${basePrompt}

INFRASTRUCTURE ENTITIES:
- issue_type: Road, water, electricity, sanitation, etc.
- location: Specific location of issue
- severity: Minor, moderate, major, critical
- time_occurred: When the issue started
- affected_count: Number of people affected
- project_name: Name of community project
- department: Responsible government department
- urgency: Urgent, normal, low priority

STRUCTURED DATA:
{
  "issueType": "road_damage",
  "location": "Main Street, Village XYZ",
  "severity": "major",
  "timeOccurred": "2 days ago",
  "affectedCount": 500,
  "urgency": "high",
  "department": "PWD"
}`,

      general: `${basePrompt}

GENERAL ENTITIES:
- feature_name: App features mentioned
- navigation_intent: Where user wants to go
- help_topic: What user needs help with
- feedback_type: Complaint, suggestion, praise
- language_preference: Preferred language

STRUCTURED DATA:
{
  "feature": "crop_recommendation",
  "navigationTarget": "agriculture_module",
  "helpTopic": "how_to_report_issue"
}`
    };

    return modulePrompts[module] || modulePrompts.general;
  }

  /**
   * Parse extraction response
   */
  private parseExtractionResponse(
    responseText: string,
    originalMessage: string,
    module: string
  ): EntityExtractionResult {
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          entities: parsed.entities || [],
          structuredData: parsed.structuredData || {},
          module
        };
      }
    } catch (error) {
      console.error('Failed to parse extraction response:', error);
    }

    // Fallback to keyword-based extraction
    return this.fallbackExtraction(originalMessage, module);
  }

  /**
   * Fallback entity extraction using patterns
   */
  private fallbackExtraction(message: string, module: string): EntityExtractionResult {
    const entities: ExtractedEntity[] = [];
    const structuredData: Record<string, any> = {};

    const lowerMessage = message.toLowerCase();

    if (module === 'agriculture') {
      // Extract crops
      const crops = ['rice', 'wheat', 'cotton', 'sugarcane', 'maize', 'tomato', 'potato', 'onion'];
      crops.forEach(crop => {
        if (lowerMessage.includes(crop)) {
          entities.push({
            type: 'crop_name',
            value: crop,
            confidence: 0.8,
            normalized: crop
          });
        }
      });

      // Extract land area
      const areaMatch = lowerMessage.match(/(\d+)\s*(acre|hectare|bigha)/);
      if (areaMatch) {
        entities.push({
          type: 'land_area',
          value: areaMatch[0],
          confidence: 0.9,
          normalized: areaMatch[1],
          metadata: { unit: areaMatch[2] }
        });
        structuredData.landArea = { value: parseInt(areaMatch[1]), unit: areaMatch[2] };
      }

      // Extract soil type
      const soilTypes = ['alluvial', 'black', 'red', 'sandy', 'clayey', 'loamy'];
      soilTypes.forEach(soil => {
        if (lowerMessage.includes(soil)) {
          entities.push({
            type: 'soil_type',
            value: soil,
            confidence: 0.8,
            normalized: soil
          });
          structuredData.soilType = soil;
        }
      });
    }

    if (module === 'health') {
      // Extract symptoms
      const symptoms = ['fever', 'cough', 'pain', 'headache', 'nausea', 'dizziness', 'fatigue'];
      symptoms.forEach(symptom => {
        if (lowerMessage.includes(symptom)) {
          entities.push({
            type: 'symptom',
            value: symptom,
            confidence: 0.8,
            normalized: symptom
          });
        }
      });

      // Extract duration
      const durationMatch = lowerMessage.match(/(\d+)\s*(day|week|month|hour)/);
      if (durationMatch) {
        entities.push({
          type: 'duration',
          value: durationMatch[0],
          confidence: 0.9,
          normalized: durationMatch[0]
        });
        structuredData.duration = durationMatch[0];
      }

      // Check for emergency indicators
      const emergencyWords = ['emergency', 'urgent', 'critical', 'severe', 'ambulance', 'hospital'];
      const isEmergency = emergencyWords.some(word => lowerMessage.includes(word));
      if (isEmergency) {
        structuredData.isEmergency = true;
        structuredData.severity = 'severe';
      }
    }

    if (module === 'education') {
      // Extract subjects
      const subjects = ['math', 'science', 'english', 'history', 'geography', 'physics', 'chemistry'];
      subjects.forEach(subject => {
        if (lowerMessage.includes(subject)) {
          entities.push({
            type: 'subject',
            value: subject,
            confidence: 0.8,
            normalized: subject
          });
        }
      });

      // Extract grade
      const gradeMatch = lowerMessage.match(/class\s*(\d+)|grade\s*(\d+)|(\d+)th\s*standard/);
      if (gradeMatch) {
        const grade = gradeMatch[1] || gradeMatch[2] || gradeMatch[3];
        entities.push({
          type: 'grade',
          value: grade,
          confidence: 0.9,
          normalized: grade
        });
        structuredData.grade = parseInt(grade);
      }
    }

    if (module === 'infrastructure') {
      // Extract issue types
      const issueTypes = ['road', 'water', 'electricity', 'drainage', 'sanitation', 'street light'];
      issueTypes.forEach(issue => {
        if (lowerMessage.includes(issue)) {
          entities.push({
            type: 'issue_type',
            value: issue,
            confidence: 0.8,
            normalized: issue.replace(' ', '_')
          });
          structuredData.issueType = issue.replace(' ', '_');
        }
      });
    }

    return {
      entities,
      structuredData,
      module
    };
  }

  /**
   * Normalize entity values
   */
  normalizeEntity(entity: ExtractedEntity): ExtractedEntity {
    const normalized = { ...entity };

    // Normalize crop names
    if (entity.type === 'crop_name') {
      const cropMap: Record<string, string> = {
        'paddy': 'rice',
        'dhan': 'rice',
        'gehun': 'wheat',
        'kapas': 'cotton',
        'makka': 'maize',
        'tamatar': 'tomato',
        'aloo': 'potato',
        'pyaz': 'onion'
      };
      normalized.normalized = cropMap[entity.value.toLowerCase()] || entity.value;
    }

    // Normalize units
    if (entity.type === 'land_area' && entity.metadata?.unit) {
      const unitMap: Record<string, string> = {
        'hectare': 'ha',
        'hectares': 'ha',
        'acre': 'ac',
        'acres': 'ac',
        'bigha': 'bigha'
      };
      entity.metadata.unit = unitMap[entity.metadata.unit] || entity.metadata.unit;
    }

    return normalized;
  }

  /**
   * Validate extracted entities
   */
  validateEntities(entities: ExtractedEntity[]): ExtractedEntity[] {
    return entities.filter(entity => {
      // Remove low confidence entities
      if (entity.confidence < 0.5) return false;

      // Remove empty values
      if (!entity.value || entity.value.trim() === '') return false;

      return true;
    });
  }

  /**
   * Merge duplicate entities
   */
  mergeDuplicates(entities: ExtractedEntity[]): ExtractedEntity[] {
    const merged = new Map<string, ExtractedEntity>();

    entities.forEach(entity => {
      const key = `${entity.type}:${entity.normalized || entity.value}`;
      const existing = merged.get(key);

      if (existing) {
        // Keep the one with higher confidence
        if (entity.confidence > existing.confidence) {
          merged.set(key, entity);
        }
      } else {
        merged.set(key, entity);
      }
    });

    return Array.from(merged.values());
  }
}

// Singleton instance
let extractorInstance: EntityExtractor | null = null;

export function getEntityExtractor(): EntityExtractor {
  if (!extractorInstance) {
    extractorInstance = new EntityExtractor();
  }
  return extractorInstance;
}

export default EntityExtractor;
