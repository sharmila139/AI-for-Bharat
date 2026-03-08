/**
 * AWS Lambda Handler
 * Entry point for serverless deployment
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import express, { Request, Response } from 'express';
import serverless from 'serverless-http';
import cors from 'cors';

// Import API routes
import authRoutes from './api/auth';
import healthRoutes from './api/health';
import cropRecommendationRoutes from './api/crop-recommendation';
import soilAnalysisRoutes from './api/soil-analysis';
import aiRoutes from './api/ai';

// Create Express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/', (req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'RuralConnect AI API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/health', healthRoutes);
app.use('/api/agriculture/crop-recommendations', cropRecommendationRoutes);
app.use('/api/agriculture/soil-analysis', soilAnalysisRoutes);
app.use('/api/v1/ai', aiRoutes);

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: any) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: err.message,
  });
});

// Export Lambda handler
export const handler = serverless(app);

