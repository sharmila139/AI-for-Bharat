import { AgentTool } from './agent-executor';
import { getRAGService } from '../rag';

/**
 * Tool: Search knowledge base
 */
export const searchKnowledgeTool: AgentTool = {
  name: 'search_knowledge',
  description: 'Search the knowledge base for information about agriculture, health, education, or infrastructure',
  parameters: {
    query: {
      type: 'string',
      description: 'The search query',
      required: true,
    },
    category: {
      type: 'string',
      description: 'Category to search in: agriculture, health, education, infrastructure',
      required: false,
    },
  },
  execute: async (params) => {
    const ragService = getRAGService();
    const result = await ragService.query({
      question: params.query,
      category: params.category,
    });
    return `Found information (confidence: ${result.confidence.toFixed(2)}): ${result.answer}`;
  },
};

/**
 * Tool: Get weather information
 */
export const getWeatherTool: AgentTool = {
  name: 'get_weather',
  description: 'Get current weather and forecast for a location',
  parameters: {
    location: {
      type: 'string',
      description: 'Location name or coordinates',
      required: true,
    },
  },
  execute: async (params) => {
    // TODO: Integrate with weather API
    return `Weather for ${params.location}: Sunny, 28°C, Humidity 65%`;
  },
};

/**
 * Tool: Get crop recommendations
 */
export const getCropRecommendationsTool: AgentTool = {
  name: 'get_crop_recommendations',
  description: 'Get AI-powered crop recommendations based on farm details',
  parameters: {
    soilType: {
      type: 'string',
      description: 'Type of soil (e.g., clay, loam, sandy)',
      required: true,
    },
    farmSize: {
      type: 'number',
      description: 'Farm size in acres',
      required: true,
    },
    location: {
      type: 'string',
      description: 'Farm location',
      required: true,
    },
  },
  execute: async (params) => {
    // TODO: Integrate with crop recommendation ML model
    return `Top 3 crops for ${params.soilType} soil (${params.farmSize} acres): 
1. Rice - High profitability, suitable for monsoon
2. Wheat - Moderate profitability, winter crop
3. Sugarcane - High revenue, requires irrigation`;
  },
};

/**
 * Tool: Analyze symptoms
 */
export const analyzeSymptomsTool: AgentTool = {
  name: 'analyze_symptoms',
  description: 'Analyze health symptoms and provide first aid guidance',
  parameters: {
    symptoms: {
      type: 'string',
      description: 'Description of symptoms',
      required: true,
    },
    age: {
      type: 'number',
      description: 'Patient age',
      required: false,
    },
  },
  execute: async (params) => {
    // TODO: Integrate with symptom analysis model
    return `Symptom analysis: Based on "${params.symptoms}", this appears to be a minor condition. 
Recommended: Rest, hydration, and monitor for 24 hours. 
Seek medical attention if symptoms worsen.`;
  },
};

/**
 * Tool: Search natural remedies
 */
export const searchRemedyTool: AgentTool = {
  name: 'search_remedy',
  description: 'Search for natural remedies for common ailments',
  parameters: {
    ailment: {
      type: 'string',
      description: 'The ailment or condition',
      required: true,
    },
  },
  execute: async (params) => {
    // TODO: Query remedy database
    return `Natural remedies for ${params.ailment}:
1. Ginger tea - Anti-inflammatory properties
2. Turmeric milk - Boosts immunity
3. Honey and lemon - Soothes throat`;
  },
};

/**
 * Tool: Get learning content
 */
export const getLearningContentTool: AgentTool = {
  name: 'get_learning_content',
  description: 'Get educational content for a specific topic',
  parameters: {
    subject: {
      type: 'string',
      description: 'Subject name (e.g., Math, Science)',
      required: true,
    },
    grade: {
      type: 'number',
      description: 'Grade level (1-12)',
      required: true,
    },
    topic: {
      type: 'string',
      description: 'Specific topic',
      required: false,
    },
  },
  execute: async (params) => {
    // TODO: Query learning content database
    return `Found ${params.subject} content for Grade ${params.grade}${params.topic ? ` on ${params.topic}` : ''}:
- Video lessons: 5 available
- Practice quizzes: 3 available
- Interactive simulations: 2 available`;
  },
};

/**
 * Tool: Report grievance
 */
export const reportGrievanceTool: AgentTool = {
  name: 'report_grievance',
  description: 'Report an infrastructure or civic issue',
  parameters: {
    category: {
      type: 'string',
      description: 'Issue category (roads, water, electricity, etc.)',
      required: true,
    },
    description: {
      type: 'string',
      description: 'Description of the issue',
      required: true,
    },
    location: {
      type: 'string',
      description: 'Location of the issue',
      required: true,
    },
  },
  execute: async (params) => {
    // TODO: Create grievance in database
    const ticketNumber = `GRV${Date.now().toString().slice(-6)}`;
    return `Grievance reported successfully!
Ticket Number: ${ticketNumber}
Category: ${params.category}
Location: ${params.location}
Status: Pending review
You will receive updates via notification.`;
  },
};

/**
 * Tool: Calculator
 */
export const calculatorTool: AgentTool = {
  name: 'calculator',
  description: 'Perform mathematical calculations',
  parameters: {
    expression: {
      type: 'string',
      description: 'Mathematical expression to evaluate',
      required: true,
    },
  },
  execute: async (params) => {
    try {
      // Simple eval for basic math (in production, use a safe math parser)
      const result = eval(params.expression);
      return `Result: ${result}`;
    } catch (error) {
      return `ERROR: Invalid mathematical expression`;
    }
  },
};

/**
 * Get all default tools
 */
export function getDefaultTools(): AgentTool[] {
  return [
    searchKnowledgeTool,
    getWeatherTool,
    getCropRecommendationsTool,
    analyzeSymptomsTool,
    searchRemedyTool,
    getLearningContentTool,
    reportGrievanceTool,
    calculatorTool,
  ];
}
