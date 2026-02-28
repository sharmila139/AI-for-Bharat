export interface PromptTemplate {
  name: string;
  description: string;
  systemPrompt: string;
  userPromptTemplate: string;
  variables: string[];
}

/**
 * Agriculture Module Prompts
 */
export const agriculturePrompts = {
  cropRecommendation: {
    name: 'crop_recommendation',
    description: 'Generate crop recommendations based on farm details',
    systemPrompt: `You are an agricultural expert helping Indian farmers.
Provide practical, region-specific crop recommendations.
Consider soil type, climate, water availability, and market demand.
Always mention government schemes and subsidies when relevant.`,
    userPromptTemplate: `Farm Details:
- Location: {{location}}
- Soil Type: {{soilType}}
- Farm Size: {{farmSize}} acres
- Water Source: {{waterSource}}
- Budget: {{budget}}
- Season: {{season}}

Provide top 5 crop recommendations with:
1. Crop name and variety
2. Suitability score (0-100)
3. Expected yield and profit
4. Growing duration
5. Key requirements
6. Risk factors
7. Government schemes`,
    variables: ['location', 'soilType', 'farmSize', 'waterSource', 'budget', 'season'],
  },

  soilAnalysis: {
    name: 'soil_analysis',
    description: 'Analyze soil health and provide recommendations',
    systemPrompt: `You are a soil science expert.
Analyze soil test results and provide actionable recommendations.
Focus on organic and sustainable practices.`,
    userPromptTemplate: `Soil Test Results:
- pH: {{ph}}
- Organic Matter: {{organicMatter}}%
- Nitrogen (N): {{nitrogen}} kg/ha
- Phosphorus (P): {{phosphorus}} kg/ha
- Potassium (K): {{potassium}} kg/ha
- Texture: {{texture}}

Provide:
1. Overall soil health score (0-100)
2. Nutrient deficiencies
3. Fertilizer recommendations (organic and chemical)
4. Application schedule
5. Soil improvement practices`,
    variables: ['ph', 'organicMatter', 'nitrogen', 'phosphorus', 'potassium', 'texture'],
  },

  pestManagement: {
    name: 'pest_management',
    description: 'Provide pest management advice',
    systemPrompt: `You are an integrated pest management expert.
Recommend eco-friendly pest control methods.
Prioritize organic and biological controls over chemicals.`,
    userPromptTemplate: `Pest Issue:
- Crop: {{crop}}
- Pest Type: {{pestType}}
- Infestation Level: {{infestationLevel}}
- Growth Stage: {{growthStage}}

Provide:
1. Pest identification confirmation
2. Organic control methods
3. Biological control options
4. Chemical control (last resort)
5. Preventive measures
6. Monitoring schedule`,
    variables: ['crop', 'pestType', 'infestationLevel', 'growthStage'],
  },
};

/**
 * Health Module Prompts
 */
export const healthPrompts = {
  symptomAssessment: {
    name: 'symptom_assessment',
    description: 'Assess symptoms and provide first aid guidance',
    systemPrompt: `You are a primary healthcare assistant for rural areas.
Assess symptoms and provide first aid guidance.
CRITICAL: Always advise consulting a doctor for serious conditions.
Focus on immediate care and when to seek medical help.`,
    userPromptTemplate: `Patient Information:
- Age: {{age}}
- Gender: {{gender}}
- Symptoms: {{symptoms}}
- Duration: {{duration}}
- Severity: {{severity}}

Provide:
1. Emergency category (life-threatening/urgent/non-urgent/minor)
2. Risk level (critical/high/medium/low)
3. Immediate first aid steps
4. Red flag symptoms
5. When to seek medical help
6. Home care instructions

IMPORTANT: If critical or life-threatening, immediately advise calling emergency services.`,
    variables: ['age', 'gender', 'symptoms', 'duration', 'severity'],
  },

  remedyRecommendation: {
    name: 'remedy_recommendation',
    description: 'Recommend natural remedies for common ailments',
    systemPrompt: `You are an Ayurvedic and natural medicine expert.
Recommend safe, traditional remedies for common ailments.
Always include safety warnings and contraindications.`,
    userPromptTemplate: `Ailment: {{ailment}}
Patient Age: {{age}}
Existing Conditions: {{conditions}}

Provide:
1. Top 3 natural remedies
2. Preparation method for each
3. Dosage instructions
4. Expected timeline for relief
5. Side effects and contraindications
6. When to stop and consult doctor`,
    variables: ['ailment', 'age', 'conditions'],
  },

  nutritionPlan: {
    name: 'nutrition_plan',
    description: 'Create personalized nutrition plan',
    systemPrompt: `You are a nutritionist specializing in Indian diets.
Create practical meal plans using locally available, affordable foods.
Consider cultural and religious dietary restrictions.`,
    userPromptTemplate: `User Profile:
- Age: {{age}}
- Gender: {{gender}}
- Weight: {{weight}} kg
- Height: {{height}} cm
- Activity Level: {{activityLevel}}
- Occupation: {{occupation}}
- Dietary Restrictions: {{restrictions}}
- Health Goals: {{goals}}

Provide:
1. Daily calorie requirement
2. Macronutrient breakdown
3. Sample meal plan (breakfast, lunch, dinner, snacks)
4. Locally available food suggestions
5. Cost-effective options
6. Seasonal variations`,
    variables: ['age', 'gender', 'weight', 'height', 'activityLevel', 'occupation', 'restrictions', 'goals'],
  },
};

/**
 * Education Module Prompts
 */
export const educationPrompts = {
  contentExplanation: {
    name: 'content_explanation',
    description: 'Explain educational concepts',
    systemPrompt: `You are an experienced teacher for Indian students.
Explain concepts clearly with examples relevant to rural context.
Use simple language and relate to everyday experiences.`,
    userPromptTemplate: `Subject: {{subject}}
Grade: {{grade}}
Topic: {{topic}}
Student's Current Understanding: {{understanding}}

Provide:
1. Clear explanation with examples
2. Real-world applications
3. Common misconceptions
4. Practice problems
5. Memory techniques
6. Related topics to explore`,
    variables: ['subject', 'grade', 'topic', 'understanding'],
  },

  quizGeneration: {
    name: 'quiz_generation',
    description: 'Generate practice questions',
    systemPrompt: `You are a curriculum expert creating assessment questions.
Generate questions aligned with NCERT/CBSE standards.
Include various difficulty levels and question types.`,
    userPromptTemplate: `Subject: {{subject}}
Grade: {{grade}}
Topic: {{topic}}
Difficulty: {{difficulty}}
Number of Questions: {{count}}

Generate:
1. Multiple choice questions (4 options each)
2. Short answer questions
3. Long answer questions
4. Correct answers with explanations
5. Marking scheme`,
    variables: ['subject', 'grade', 'topic', 'difficulty', 'count'],
  },

  careerGuidance: {
    name: 'career_guidance',
    description: 'Provide career guidance',
    systemPrompt: `You are a career counselor for rural Indian students.
Provide practical career advice considering local opportunities.
Include both traditional and emerging career paths.`,
    userPromptTemplate: `Student Profile:
- Grade: {{grade}}
- Interests: {{interests}}
- Strengths: {{strengths}}
- Location: {{location}}
- Family Background: {{background}}

Provide:
1. Suitable career paths
2. Required education/skills
3. Local opportunities
4. Government schemes for education
5. Skill development programs
6. Success stories from similar backgrounds`,
    variables: ['grade', 'interests', 'strengths', 'location', 'background'],
  },
};

/**
 * Infrastructure Module Prompts
 */
export const infrastructurePrompts = {
  grievanceClassification: {
    name: 'grievance_classification',
    description: 'Classify and prioritize grievances',
    systemPrompt: `You are a civic administration expert.
Classify infrastructure issues and determine priority.
Consider public safety and affected population.`,
    userPromptTemplate: `Grievance Details:
- Description: {{description}}
- Location: {{location}}
- Photo Analysis: {{photoAnalysis}}
- Affected Population: {{population}}

Provide:
1. Issue category (roads/water/electricity/drainage/etc.)
2. Severity level (low/medium/high/critical)
3. Estimated affected population
4. Safety concerns
5. Recommended SLA (days to resolve)
6. Required department/authority`,
    variables: ['description', 'location', 'photoAnalysis', 'population'],
  },

  projectSummary: {
    name: 'project_summary',
    description: 'Summarize infrastructure project details',
    systemPrompt: `You are a public works communication specialist.
Summarize infrastructure projects in simple, transparent language.
Focus on community benefits and accountability.`,
    userPromptTemplate: `Project Details:
- Name: {{projectName}}
- Category: {{category}}
- Budget: {{budget}}
- Timeline: {{timeline}}
- Contractor: {{contractor}}
- Progress: {{progress}}%

Provide:
1. Simple project summary
2. Community benefits
3. Current status
4. Expected completion
5. Budget utilization
6. How to track progress`,
    variables: ['projectName', 'category', 'budget', 'timeline', 'contractor', 'progress'],
  },

  pollQuestion: {
    name: 'poll_question',
    description: 'Generate community poll questions',
    systemPrompt: `You are a community engagement specialist.
Create clear, unbiased poll questions for civic participation.
Ensure questions are easy to understand for all literacy levels.`,
    userPromptTemplate: `Poll Topic: {{topic}}
Context: {{context}}
Target Audience: {{audience}}

Provide:
1. Clear poll question
2. 3-5 balanced options
3. Explanation of each option
4. Why this matters to community
5. How results will be used`,
    variables: ['topic', 'context', 'audience'],
  },
};

/**
 * General Prompts
 */
export const generalPrompts = {
  translation: {
    name: 'translation',
    description: 'Translate content to Indian languages',
    systemPrompt: `You are a professional translator for Indian languages.
Translate accurately while maintaining cultural context.
Use appropriate formal/informal tone.`,
    userPromptTemplate: `Source Language: {{sourceLanguage}}
Target Language: {{targetLanguage}}
Content Type: {{contentType}}
Text: {{text}}

Translate the text maintaining:
1. Meaning and context
2. Cultural appropriateness
3. Tone and formality
4. Technical accuracy`,
    variables: ['sourceLanguage', 'targetLanguage', 'contentType', 'text'],
  },

  summarization: {
    name: 'summarization',
    description: 'Summarize long content',
    systemPrompt: `You are a content summarization expert.
Create concise summaries preserving key information.
Use simple language suitable for rural audiences.`,
    userPromptTemplate: `Content: {{content}}
Target Length: {{length}} words
Focus: {{focus}}

Provide:
1. Main summary
2. Key points (bullet points)
3. Action items (if any)`,
    variables: ['content', 'length', 'focus'],
  },
};

/**
 * Get all prompt templates
 */
export function getAllPromptTemplates(): Record<string, Record<string, PromptTemplate>> {
  return {
    agriculture: agriculturePrompts,
    health: healthPrompts,
    education: educationPrompts,
    infrastructure: infrastructurePrompts,
    general: generalPrompts,
  };
}

/**
 * Get prompt template by name
 */
export function getPromptTemplate(module: string, templateName: string): PromptTemplate | null {
  const templates = getAllPromptTemplates();
  return templates[module]?.[templateName] || null;
}
