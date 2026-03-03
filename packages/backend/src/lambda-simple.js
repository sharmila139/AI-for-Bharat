/**
 * Simple AWS Lambda Handler
 * Works without compilation
 */

exports.handler = async (event) => {
    console.log('Event:', JSON.stringify(event, null, 2));
    
    const path = event.rawPath || event.path || '/';
    const method = event.requestContext?.http?.method || event.httpMethod || 'GET';
    
    // Health check endpoint
    if (path === '/' && method === 'GET') {
        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
            },
            body: JSON.stringify({
                success: true,
                message: 'RuralConnect AI API',
                version: '1.0.0',
                timestamp: new Date().toISOString(),
                endpoints: {
                    health: '/health',
                    auth: '/api/auth',
                    crops: '/api/agriculture/crop-recommendations',
                    soil: '/api/agriculture/soil-analysis',
                }
            })
        };
    }
    
    // Health endpoint
    if (path === '/health' && method === 'GET') {
        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
            },
            body: JSON.stringify({
                success: true,
                status: 'healthy',
                timestamp: new Date().toISOString(),
            })
        };
    }
    
    // Mock crop recommendations
    if (path.includes('/crop-recommendations') && method === 'GET') {
        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
            },
            body: JSON.stringify({
                success: true,
                data: {
                    recommendations: [
                        {
                            crop: 'Rice',
                            suitability: 95,
                            season: 'Kharif',
                            expectedYield: '4-5 tons/hectare',
                            waterRequirement: 'High',
                            reasons: [
                                'Soil pH is optimal (6.5-7.0)',
                                'Good water availability',
                                'Suitable temperature range',
                            ],
                        },
                        {
                            crop: 'Wheat',
                            suitability: 88,
                            season: 'Rabi',
                            expectedYield: '3-4 tons/hectare',
                            waterRequirement: 'Medium',
                            reasons: [
                                'Good soil fertility',
                                'Moderate water requirement',
                                'Suitable for rotation',
                            ],
                        },
                    ],
                },
            })
        };
    }
    
    // Mock soil analysis
    if (path.includes('/soil-analysis') && method === 'POST') {
        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
            },
            body: JSON.stringify({
                success: true,
                data: {
                    analysis: {
                        pH: 6.8,
                        nitrogen: 'Medium',
                        phosphorus: 'High',
                        potassium: 'Medium',
                        organicMatter: 'Good',
                        recommendations: [
                            'Add organic compost to improve soil structure',
                            'Consider nitrogen supplementation for next crop',
                            'Maintain current phosphorus levels',
                        ],
                    },
                },
            })
        };
    }
    
    // Mock auth login
    if (path.includes('/auth/login') && method === 'POST') {
        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
            },
            body: JSON.stringify({
                success: true,
                data: {
                    user: {
                        id: '1',
                        name: 'Demo Farmer',
                        phone: '+919876543210',
                        language: 'en',
                        role: 'farmer',
                    },
                    tokens: {
                        accessToken: 'mock-access-token-' + Date.now(),
                        refreshToken: 'mock-refresh-token-' + Date.now(),
                    },
                },
            })
        };
    }
    
    // Default 404
    return {
        statusCode: 404,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({
            success: false,
            error: 'Not Found',
            message: `Endpoint ${method} ${path} not found`,
            availableEndpoints: [
                'GET /',
                'GET /health',
                'GET /api/agriculture/crop-recommendations',
                'POST /api/agriculture/soil-analysis',
                'POST /api/auth/login',
            ],
        })
    };
};

