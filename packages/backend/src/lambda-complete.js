/**
 * Complete AWS Lambda Handler with Bedrock Integration
 * RuralConnect AI Backend
 */

const { BedrockRuntimeClient, InvokeModelCommand } = require('@aws-sdk/client-bedrock-runtime');
const { S3Client, GetObjectCommand, PutObjectCommand } = require('@aws-sdk/client-s3');

// Initialize AWS clients
const bedrock = new BedrockRuntimeClient({ region: process.env.AWS_REGION || 'us-east-1' });
const s3 = new S3Client({ region: process.env.AWS_REGION || 'us-east-1' });

const DATA_BUCKET = 'ruralconnect-data-032761628276';

// ============================================
// Utility Functions
// ============================================

/**
 * Read JSON data from S3
 */
async function readS3Data(key) {
    try {
        const command = new GetObjectCommand({
            Bucket: DATA_BUCKET,
            Key: key
        });
        const response = await s3.send(command);
        const str = await response.Body.transformToString();
        return JSON.parse(str);
    } catch (error) {
        console.error(`Error reading S3 data ${key}:`, error);
        return null;
    }
}

/**
 * Write JSON data to S3
 */
async function writeS3Data(key, data) {
    try {
        const command = new PutObjectCommand({
            Bucket: DATA_BUCKET,
            Key: key,
            Body: JSON.stringify(data, null, 2),
            ContentType: 'application/json'
        });
        await s3.send(command);
        return true;
    } catch (error) {
        console.error(`Error writing S3 data ${key}:`, error);
        return false;
    }
}

/**
 * Call AWS Bedrock with fallback
 */
async function callBedrock(prompt, systemPrompt = '') {
    // Try Claude 3 Sonnet first
    try {
        const response = await invokeClaude(prompt, systemPrompt);
        return { success: true, data: response, model: 'claude-3-sonnet' };
    } catch (error) {
        console.error('Claude failed, trying Titan:', error);
        
        // Fallback to Titan
        try {
            const response = await invokeTitan(prompt);
            return { success: true, data: response, model: 'titan-text' };
        } catch (titanError) {
            console.error('Titan also failed:', titanError);
            return { success: false, error: 'AI models unavailable' };
        }
    }
}

/**
 * Invoke Claude 3 Sonnet
 */
async function invokeClaude(prompt, systemPrompt = '') {
    const payload = {
        anthropic_version: 'bedrock-2023-05-31',
        max_tokens: 2000,
        temperature: 0.7,
        messages: [
            {
                role: 'user',
                content: prompt
            }
        ]
    };
    
    if (systemPrompt) {
        payload.system = systemPrompt;
    }
    
    const command = new InvokeModelCommand({
        modelId: 'anthropic.claude-3-sonnet-20240229-v1:0',
        contentType: 'application/json',
        accept: 'application/json',
        body: JSON.stringify(payload)
    });
    
    const response = await bedrock.send(command);
    const result = JSON.parse(new TextDecoder().decode(response.body));
    return result.content[0].text;
}

/**
 * Invoke Titan Text (fallback)
 */
async function invokeTitan(prompt) {
    const payload = {
        inputText: prompt,
        textGenerationConfig: {
            maxTokenCount: 2000,
            temperature: 0.7,
            topP: 0.9
        }
    };
    
    const command = new InvokeModelCommand({
        modelId: 'amazon.titan-text-express-v1',
        contentType: 'application/json',
        accept: 'application/json',
        body: JSON.stringify(payload)
    });
    
    const response = await bedrock.send(command);
    const result = JSON.parse(new TextDecoder().decode(response.body));
    return result.results[0].outputText;
}

/**
 * Create HTTP response
 */
function createResponse(statusCode, body) {
    return {
        statusCode,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type'
        },
        body: JSON.stringify(body)
    };
}

// ============================================
// Agriculture Handlers
// ============================================

async function handleCropRecommendations(body) {
    try {
        const { soilType, location, season, farmSize } = body || {};
        
        // Read crops data
        const crops = await readS3Data('crops.json');
        if (!crops) {
            return createResponse(500, { success: false, error: 'Crops data unavailable' });
        }
        
        // Create AI prompt
        const prompt = `You are an agricultural expert. Based on the following farm details, recommend the top 3 most suitable crops:

Soil Type: ${soilType || 'Loam'}
Location: ${location || 'North India'}
Season: ${season || 'Kharif'}
Farm Size: ${farmSize || '2 hectares'}

Available crops: ${crops.map(c => c.name).join(', ')}

For each recommended crop, provide:
1. Suitability score (0-100)
2. Expected yield
3. 3 specific reasons why it's suitable
4. Water requirement
5. Investment needed

Format as JSON array with fields: crop, suitability, expectedYield, waterRequirement, investment, reasons (array of strings)`;

        const systemPrompt = 'You are an expert agricultural advisor helping farmers in India. Provide practical, actionable advice based on local conditions.';
        
        // Call Bedrock
        const aiResponse = await callBedrock(prompt, systemPrompt);
        
        if (aiResponse.success) {
            try {
                // Parse AI response
                const text = aiResponse.data;
                const jsonMatch = text.match(/\[[\s\S]*\]/);
                const recommendations = jsonMatch ? JSON.parse(jsonMatch[0]) : [];
                
                return createResponse(200, {
                    success: true,
                    data: {
                        recommendations,
                        aiModel: aiResponse.model
                    }
                });
            } catch (parseError) {
                // Fallback to rule-based
                const filtered = crops.filter(c => 
                    !season || c.season.includes(season)
                ).slice(0, 3);
                
                return createResponse(200, {
                    success: true,
                    data: {
                        recommendations: filtered.map(c => ({
                            crop: c.name,
                            suitability: 85,
                            season: c.season,
                            expectedYield: c.expectedYield,
                            waterRequirement: c.waterRequirement,
                            investment: c.investment,
                            reasons: [
                                `Suitable for ${c.season} season`,
                                `Expected yield: ${c.expectedYield}`,
                                `Market price: ${c.marketPrice}`
                            ]
                        })),
                        fallback: true
                    }
                });
            }
        } else {
            // Fallback to rule-based
            const filtered = crops.slice(0, 3);
            return createResponse(200, {
                success: true,
                data: {
                    recommendations: filtered.map(c => ({
                        crop: c.name,
                        suitability: 85,
                        season: c.season,
                        expectedYield: c.expectedYield,
                        waterRequirement: c.waterRequirement,
                        investment: c.investment,
                        reasons: [
                            `Suitable for ${c.season} season`,
                            `Expected yield: ${c.expectedYield}`,
                            `Market price: ${c.marketPrice}`
                        ]
                    })),
                    fallback: true
                }
            });
        }
    } catch (error) {
        console.error('Crop recommendations error:', error);
        return createResponse(500, { success: false, error: error.message });
    }
}

async function handleSoilAnalysis(body) {
    try {
        const { pH, nitrogen, phosphorus, potassium, organicMatter } = body || {};
        
        const prompt = `Analyze this soil composition and provide recommendations:

pH: ${pH || 6.5}
Nitrogen: ${nitrogen || 'Medium'}
Phosphorus: ${phosphorus || 'Medium'}
Potassium: ${potassium || 'Medium'}
Organic Matter: ${organicMatter || 'Good'}

Provide:
1. Overall soil health score (0-100)
2. 3-4 specific recommendations to improve soil
3. Suitable fertilizers
4. Crop suitability

Format as JSON with fields: healthScore, recommendations (array), fertilizers (array), suitableCrops (array)`;

        const aiResponse = await callBedrock(prompt);
        
        if (aiResponse.success) {
            try {
                const text = aiResponse.data;
                const jsonMatch = text.match(/\{[\s\S]*\}/);
                const analysis = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
                
                if (analysis) {
                    return createResponse(200, {
                        success: true,
                        data: { analysis, aiModel: aiResponse.model }
                    });
                }
            } catch (parseError) {
                console.error('Parse error:', parseError);
            }
        }
        
        // Fallback
        return createResponse(200, {
            success: true,
            data: {
                analysis: {
                    healthScore: 75,
                    recommendations: [
                        'Add organic compost to improve soil structure',
                        'Consider nitrogen supplementation for next crop',
                        'Maintain current phosphorus levels'
                    ],
                    fertilizers: ['Organic compost', 'Urea', 'DAP'],
                    suitableCrops: ['Rice', 'Wheat', 'Maize']
                },
                fallback: true
            }
        });
    } catch (error) {
        console.error('Soil analysis error:', error);
        return createResponse(500, { success: false, error: error.message });
    }
}

// ============================================
// Health Handlers
// ============================================

async function handleSymptomCheck(body) {
    try {
        const { symptoms } = body || {};
        
        if (!symptoms) {
            return createResponse(400, { success: false, error: 'Symptoms required' });
        }
        
        // Read remedies data
        const remedies = await readS3Data('remedies.json');
        
        const prompt = `You are a healthcare assistant. A patient describes these symptoms:

"${symptoms}"

Provide:
1. Severity assessment (Low/Medium/High/Critical)
2. Possible conditions (2-3)
3. Immediate first aid steps (3-4 steps)
4. When to seek medical help
5. Recommended natural remedies

IMPORTANT: Always advise seeking professional medical help for serious symptoms.

Format as JSON with fields: severity, possibleConditions (array), firstAidSteps (array), seekHelpIf (string), recommendedRemedies (array of remedy names)`;

        const systemPrompt = 'You are a medical first aid assistant. Provide helpful guidance but always emphasize seeking professional medical help when needed. Never diagnose or prescribe medication.';
        
        const aiResponse = await callBedrock(prompt, systemPrompt);
        
        if (aiResponse.success) {
            try {
                const text = aiResponse.data;
                const jsonMatch = text.match(/\{[\s\S]*\}/);
                const assessment = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
                
                if (assessment) {
                    // Enrich with remedy details
                    if (remedies && assessment.recommendedRemedies) {
                        assessment.remedyDetails = remedies.filter(r => 
                            assessment.recommendedRemedies.some(name => 
                                r.name.toLowerCase().includes(name.toLowerCase())
                            )
                        );
                    }
                    
                    return createResponse(200, {
                        success: true,
                        data: { assessment, aiModel: aiResponse.model }
                    });
                }
            } catch (parseError) {
                console.error('Parse error:', parseError);
            }
        }
        
        // Fallback
        return createResponse(200, {
            success: true,
            data: {
                assessment: {
                    severity: 'Medium',
                    possibleConditions: ['Common cold', 'Flu'],
                    firstAidSteps: [
                        'Rest and stay hydrated',
                        'Monitor your temperature',
                        'Try natural remedies like ginger tea',
                        'Seek medical help if symptoms worsen'
                    ],
                    seekHelpIf: 'Symptoms persist for more than 3 days or worsen',
                    recommendedRemedies: ['Ginger Tea', 'Honey and Lemon']
                },
                fallback: true
            }
        });
    } catch (error) {
        console.error('Symptom check error:', error);
        return createResponse(500, { success: false, error: error.message });
    }
}

async function handleGetRemedies(query) {
    try {
        const remedies = await readS3Data('remedies.json');
        
        if (!remedies) {
            return createResponse(500, { success: false, error: 'Remedies data unavailable' });
        }
        
        // Filter by search query if provided
        let filtered = remedies;
        if (query.search) {
            const search = query.search.toLowerCase();
            filtered = remedies.filter(r => 
                r.name.toLowerCase().includes(search) ||
                r.condition.toLowerCase().includes(search) ||
                Object.values(r.localNames).some(name => name.includes(search))
            );
        }
        
        return createResponse(200, {
            success: true,
            data: { remedies: filtered }
        });
    } catch (error) {
        console.error('Get remedies error:', error);
        return createResponse(500, { success: false, error: error.message });
    }
}

// ============================================
// Infrastructure Handlers
// ============================================

async function handleSubmitGrievance(body) {
    try {
        const { description, category, location } = body || {};
        
        if (!description) {
            return createResponse(400, { success: false, error: 'Description required' });
        }
        
        // Use AI to categorize and prioritize
        const prompt = `Categorize this grievance and assign priority:

Description: "${description}"
Location: ${location || 'Not specified'}

Provide:
1. Category (Road Repair, Water Supply, Street Light, Sanitation, Other)
2. Priority (Low, Medium, High, Critical)
3. Estimated resolution time
4. Assigned authority

Format as JSON with fields: category, priority, estimatedTime, authority`;

        const aiResponse = await callBedrock(prompt);
        
        let grievanceData = {
            category: category || 'Other',
            priority: 'Medium',
            estimatedTime: '7-14 days',
            authority: 'Local Municipality'
        };
        
        if (aiResponse.success) {
            try {
                const text = aiResponse.data;
                const jsonMatch = text.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    grievanceData = { ...grievanceData, ...JSON.parse(jsonMatch[0]) };
                }
            } catch (parseError) {
                console.error('Parse error:', parseError);
            }
        }
        
        // Generate ticket ID
        const ticketId = `GRV-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`;
        
        // Create grievance object
        const grievance = {
            id: ticketId,
            description,
            location: location || 'Not specified',
            ...grievanceData,
            status: 'Pending',
            submittedAt: new Date().toISOString(),
            updates: []
        };
        
        // Read existing grievances
        let grievances = await readS3Data('grievances.json') || [];
        grievances.push(grievance);
        
        // Write back to S3
        await writeS3Data('grievances.json', grievances);
        
        return createResponse(200, {
            success: true,
            data: { grievance, ticketId }
        });
    } catch (error) {
        console.error('Submit grievance error:', error);
        return createResponse(500, { success: false, error: error.message });
    }
}

async function handleGetGrievances() {
    try {
        const grievances = await readS3Data('grievances.json') || [];
        
        return createResponse(200, {
            success: true,
            data: { grievances: grievances.slice(-20).reverse() } // Last 20, newest first
        });
    } catch (error) {
        console.error('Get grievances error:', error);
        return createResponse(500, { success: false, error: error.message });
    }
}

// ============================================
// Translation Handlers (Section 26)
// ============================================

/**
 * Get list of all supported languages
 * GET /api/translations/languages
 */
async function handleGetLanguages() {
    try {
        const translations = await readS3Data('translations.json');
        
        if (!translations || !translations.languages) {
            return createResponse(200, {
                success: true,
                data: {
                    languages: [
                        { code: 'en', name: 'English', nativeName: 'English', flag: '🇬🇧', rtl: false },
                        { code: 'hi', name: 'Hindi', nativeName: 'हिंदी', flag: '🇮🇳', rtl: false }
                    ]
                }
            });
        }
        
        return createResponse(200, {
            success: true,
            data: { languages: translations.languages }
        });
    } catch (error) {
        console.error('Get languages error:', error);
        return createResponse(500, { success: false, error: error.message });
    }
}

/**
 * Get translations for a specific language and optional module
 * GET /api/translations/{lang} - Get all translations for language
 * GET /api/translations/{lang}/{module} - Get translations for specific module
 */
async function handleGetTranslations(langCode, module = null) {
    try {
        const translations = await readS3Data('translations.json');
        
        if (!translations) {
            return createResponse(404, {
                success: false,
                error: 'Translations not found'
            });
        }
        
        // Check if language exists
        const language = translations.languages?.find(l => l.code === langCode);
        if (!language) {
            return createResponse(404, {
                success: false,
                error: `Language '${langCode}' not supported`
            });
        }
        
        // Get translations for the language
        const langTranslations = translations.translations?.[langCode];
        if (!langTranslations) {
            return createResponse(404, {
                success: false,
                error: `Translations not available for '${langCode}'`
            });
        }
        
        // If module specified, return only that module's translations
        if (module) {
            const moduleTranslations = langTranslations[module];
            if (!moduleTranslations) {
                return createResponse(404, {
                    success: false,
                    error: `Module '${module}' translations not found for '${langCode}'`
                });
            }
            
            return createResponse(200, {
                success: true,
                data: {
                    language: language,
                    module: module,
                    translations: moduleTranslations
                }
            });
        }
        
        // Return all translations for the language
        return createResponse(200, {
            success: true,
            data: {
                language: language,
                translations: langTranslations
            }
        });
    } catch (error) {
        console.error('Get translations error:', error);
        return createResponse(500, { success: false, error: error.message });
    }
}

/**
 * Translate text using AWS Bedrock
 * POST /api/translations/translate
 * Body: { text: string, sourceLang: string, targetLang: string }
 */
async function handleTranslate(body) {
    try {
        const { text, sourceLang = 'en', targetLang } = body;
        
        if (!text || !targetLang) {
            return createResponse(400, {
                success: false,
                error: 'Missing required fields: text, targetLang'
            });
        }
        
        // Get language names
        const translations = await readS3Data('translations.json');
        const targetLanguage = translations?.languages?.find(l => l.code === targetLang);
        const sourceLanguage = translations?.languages?.find(l => l.code === sourceLang);
        
        if (!targetLanguage) {
            return createResponse(400, {
                success: false,
                error: `Target language '${targetLang}' not supported`
            });
        }
        
        // Create translation prompt
        const prompt = `Translate the following text from ${sourceLanguage?.name || sourceLang} to ${targetLanguage.name}. 
Only provide the translation, no explanations or additional text.

Text to translate: ${text}

Translation:`;
        
        // Call Bedrock for translation
        const result = await callBedrock(prompt, 'You are a professional translator specializing in Indian languages. Provide accurate, natural translations.');
        
        if (!result.success) {
            // Fallback: return original text with error
            return createResponse(200, {
                success: true,
                data: {
                    translatedText: text,
                    sourceLang: sourceLang,
                    targetLang: targetLang,
                    fallback: true,
                    message: 'Translation service unavailable, showing original text'
                }
            });
        }
        
        return createResponse(200, {
            success: true,
            data: {
                translatedText: result.data,
                sourceLang: sourceLang,
                targetLang: targetLang,
                model: result.model
            }
        });
    } catch (error) {
        console.error('Translation error:', error);
        // Fallback: return original text
        return createResponse(200, {
            success: true,
            data: {
                translatedText: body.text,
                sourceLang: body.sourceLang || 'en',
                targetLang: body.targetLang,
                fallback: true,
                error: error.message
            }
        });
    }
}

// ============================================
// Accessibility Handlers (Section 27)
// ============================================

/**
 * Handle text-to-speech conversion
 */
async function handleTextToSpeech(body) {
    try {
        const { text, language = 'en', voice = 'neutral' } = body;
        
        if (!text) {
            return createResponse(400, {
                success: false,
                error: 'Text is required'
            });
        }
        
        // For now, return metadata for client-side TTS
        // In production, could use Amazon Polly for server-side TTS
        return createResponse(200, {
            success: true,
            data: {
                text,
                language,
                voice,
                audioUrl: null, // Would be Polly URL in production
                duration: Math.ceil(text.length / 15), // Rough estimate in seconds
                instructions: 'Use client-side Web Speech API or React Native TTS'
            }
        });
    } catch (error) {
        console.error('Text-to-speech error:', error);
        return createResponse(500, {
            success: false,
            error: error.message
        });
    }
}

/**
 * Handle voice command processing
 */
async function handleVoiceCommand(body) {
    try {
        const { command, context = {} } = body;
        
        if (!command) {
            return createResponse(400, {
                success: false,
                error: 'Voice command is required'
            });
        }
        
        // Use Bedrock to interpret voice command
        const prompt = `You are a voice command interpreter for RuralConnect AI app.
        
User said: "${command}"
Context: ${JSON.stringify(context)}

Interpret this command and return a JSON response with:
- action: the action to perform (navigate, submit, search, read, help)
- target: what to act on (screen name, form field, content)
- parameters: any additional parameters
- confidence: confidence level (0-100)

Examples:
"Open health module" -> {"action": "navigate", "target": "health", "confidence": 95}
"Check symptoms for fever" -> {"action": "search", "target": "symptoms", "parameters": {"query": "fever"}, "confidence": 90}
"Submit grievance" -> {"action": "submit", "target": "grievance", "confidence": 85}

Return only valid JSON.`;

        const result = await callBedrock(prompt);
        
        if (!result.success) {
            // Fallback to simple pattern matching
            const commandLower = command.toLowerCase();
            let action = 'unknown';
            let target = '';
            let confidence = 50;
            
            if (commandLower.includes('open') || commandLower.includes('go to')) {
                action = 'navigate';
                if (commandLower.includes('health')) target = 'health';
                else if (commandLower.includes('agriculture') || commandLower.includes('farm')) target = 'agriculture';
                else if (commandLower.includes('education') || commandLower.includes('learn')) target = 'education';
                else if (commandLower.includes('infrastructure') || commandLower.includes('grievance')) target = 'infrastructure';
                confidence = 70;
            } else if (commandLower.includes('submit')) {
                action = 'submit';
                target = 'form';
                confidence = 60;
            } else if (commandLower.includes('search') || commandLower.includes('find')) {
                action = 'search';
                confidence = 65;
            } else if (commandLower.includes('read') || commandLower.includes('tell me')) {
                action = 'read';
                confidence = 70;
            } else if (commandLower.includes('help')) {
                action = 'help';
                confidence = 90;
            }
            
            return createResponse(200, {
                success: true,
                data: {
                    command,
                    interpretation: {
                        action,
                        target,
                        parameters: {},
                        confidence
                    },
                    fallback: true
                }
            });
        }
        
        // Parse AI response
        try {
            const interpretation = JSON.parse(result.data);
            return createResponse(200, {
                success: true,
                data: {
                    command,
                    interpretation,
                    model: result.model
                }
            });
        } catch (parseError) {
            // If AI didn't return valid JSON, extract from text
            return createResponse(200, {
                success: true,
                data: {
                    command,
                    interpretation: {
                        action: 'unknown',
                        target: '',
                        parameters: {},
                        confidence: 30,
                        rawResponse: result.data
                    }
                }
            });
        }
    } catch (error) {
        console.error('Voice command error:', error);
        return createResponse(500, {
            success: false,
            error: error.message
        });
    }
}

/**
 * Get accessibility settings and capabilities
 */
async function handleGetAccessibilitySettings() {
    try {
        return createResponse(200, {
            success: true,
            data: {
                features: {
                    textToSpeech: {
                        enabled: true,
                        languages: ['en', 'hi', 'ta', 'te', 'bn', 'mr', 'gu', 'kn', 'ml', 'pa', 'or', 'as', 'ur'],
                        voices: ['neutral', 'male', 'female']
                    },
                    voiceCommands: {
                        enabled: true,
                        supportedCommands: [
                            'navigate', 'submit', 'search', 'read', 'help', 'back', 'home'
                        ]
                    },
                    screenReader: {
                        enabled: true,
                        compatible: true
                    },
                    highContrast: {
                        enabled: true,
                        themes: ['default', 'high-contrast', 'dark', 'light']
                    },
                    fontSize: {
                        enabled: true,
                        sizes: ['small', 'medium', 'large', 'extra-large'],
                        default: 'medium'
                    },
                    iconNavigation: {
                        enabled: true,
                        description: 'Icon-based navigation for low literacy users'
                    },
                    audioInstructions: {
                        enabled: true,
                        description: 'Audio guidance for complex tasks'
                    }
                },
                recommendations: {
                    lowLiteracy: ['iconNavigation', 'voiceCommands', 'audioInstructions'],
                    visualImpairment: ['screenReader', 'textToSpeech', 'highContrast', 'fontSize'],
                    hearingImpairment: ['textCaptions', 'visualAlerts'],
                    motorImpairment: ['voiceCommands', 'largeButtons', 'simplifiedNavigation']
                }
            }
        });
    } catch (error) {
        console.error('Get accessibility settings error:', error);
        return createResponse(500, {
            success: false,
            error: error.message
        });
    }
}

// ============================================
// Main Handler
// ============================================

exports.handler = async (event) => {
    console.log('Event:', JSON.stringify(event, null, 2));
    
    const path = event.rawPath || event.path || '/';
    const method = event.requestContext?.http?.method || event.httpMethod || 'GET';
    
    // Parse body for POST requests
    let body = {};
    if (method === 'POST' && event.body) {
        try {
            body = JSON.parse(event.body);
        } catch (e) {
            return createResponse(400, { success: false, error: 'Invalid JSON' });
        }
    }
    
    // Parse query parameters
    const query = event.queryStringParameters || {};
    
    // Handle OPTIONS for CORS
    if (method === 'OPTIONS') {
        return createResponse(200, { success: true });
    }
    
    // Route requests
    try {
        // Health check
        if (path === '/' && method === 'GET') {
            return createResponse(200, {
                success: true,
                message: 'RuralConnect AI API',
                version: '2.0.0',
                timestamp: new Date().toISOString(),
                features: ['Bedrock AI', 'S3 Data Storage', 'Real-time Processing']
            });
        }
        
        // Agriculture endpoints
        if (path.includes('/crop-recommendations')) {
            if (method === 'POST') return await handleCropRecommendations(body);
            if (method === 'GET') return await handleCropRecommendations({});
        }
        
        if (path.includes('/soil-analysis') && method === 'POST') {
            return await handleSoilAnalysis(body);
        }
        
        // Health endpoints
        if (path.includes('/symptom-check') && method === 'POST') {
            return await handleSymptomCheck(body);
        }
        
        if (path.includes('/remedies') && method === 'GET') {
            return await handleGetRemedies(query);
        }
        
        // Infrastructure endpoints
        if (path.includes('/grievance')) {
            if (method === 'POST') return await handleSubmitGrievance(body);
            if (method === 'GET') return await handleGetGrievances();
        }
        
        // Translation endpoints (Section 26)
        if (path.includes('/translations/languages') && method === 'GET') {
            return await handleGetLanguages();
        }
        
        if (path.includes('/translations/translate') && method === 'POST') {
            return await handleTranslate(body);
        }
        
        if (path.match(/\/translations\/[a-z]{2}(\/[a-z]+)?/) && method === 'GET') {
            const pathParts = path.split('/').filter(p => p);
            // pathParts = ['api', 'translations', 'hi'] or ['api', 'translations', 'hi', 'agriculture']
            const langCode = pathParts[2]; // e.g., 'hi'
            const module = pathParts[3]; // e.g., 'agriculture' (optional)
            return await handleGetTranslations(langCode, module);
        }
        
        // Accessibility endpoints (Section 27)
        if (path.includes('/accessibility/text-to-speech') && method === 'POST') {
            return await handleTextToSpeech(body);
        }
        
        if (path.includes('/accessibility/voice-command') && method === 'POST') {
            return await handleVoiceCommand(body);
        }
        
        if (path.includes('/accessibility/settings') && method === 'GET') {
            return await handleGetAccessibilitySettings();
        }
        
        // 404
        return createResponse(404, {
            success: false,
            error: 'Not Found',
            message: `Endpoint ${method} ${path} not found`
        });
        
    } catch (error) {
        console.error('Handler error:', error);
        return createResponse(500, {
            success: false,
            error: 'Internal Server Error',
            message: error.message
        });
    }
};
