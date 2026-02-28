/**
 * Knowledge Base API Service
 * Client-side API calls for knowledge base functionality
 */

import axios from 'axios';
import { getAuthToken } from '../auth/auth-service';
import { API_BASE_URL } from '../../config/api-config';

const api = axios.create({
  baseURL: `${API_BASE_URL}/api/knowledge-base`,
  timeout: 10000,
});

// Add auth token to requests
api.interceptors.request.use(async (config) => {
  const token = await getAuthToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Search and Discovery
export const searchArticles = async (query: any) => {
  const response = await api.post('/search', query);
  return response.data;
};

export const getTrendingArticles = async (limit: number = 10, language?: string) => {
  const response = await api.get('/trending', { params: { limit, language } });
  return response.data;
};

export const getArticlesByCategory = async (category: string, language?: string, limit: number = 20) => {
  const response = await api.get(`/categories/${category}`, { params: { language, limit } });
  return response.data;
};

export const getArticleById = async (articleId: string, language?: string) => {
  const response = await api.get(`/articles/${articleId}`, { params: { language } });
  return response.data;
};

// Ratings and Reviews
export const rateArticle = async (articleId: string, rating: number, reviewText?: string) => {
  const response = await api.post(`/articles/${articleId}/rate`, {
    rating,
    review_text: reviewText,
  });
  return response.data;
};

export const getArticleRatings = async (articleId: string, limit: number = 10) => {
  const response = await api.get(`/articles/${articleId}/ratings`, { params: { limit } });
  return response.data;
};

// Q&A
export const askQuestion = async (articleId: string, questionText: string) => {
  const response = await api.post(`/articles/${articleId}/questions`, {
    question_text: questionText,
  });
  return response.data;
};

export const answerQuestion = async (questionId: string, answerText: string, isExpert: boolean = false) => {
  const response = await api.post(`/questions/${questionId}/answers`, {
    answer_text: answerText,
    is_expert_answer: isExpert,
  });
  return response.data;
};

export const getArticleQA = async (articleId: string, limit: number = 10) => {
  const response = await api.get(`/articles/${articleId}/qa`, { params: { limit } });
  return response.data;
};

export const upvoteQuestion = async (questionId: string) => {
  const response = await api.post(`/questions/${questionId}/upvote`);
  return response.data;
};

export const upvoteAnswer = async (answerId: string) => {
  const response = await api.post(`/answers/${answerId}/upvote`);
  return response.data;
};

export const acceptAnswer = async (answerId: string) => {
  const response = await api.post(`/answers/${answerId}/accept`);
  return response.data;
};

// Success Stories
export const submitSuccessStory = async (articleId: string, storyData: any) => {
  const response = await api.post(`/articles/${articleId}/success-stories`, storyData);
  return response.data;
};

export const getSuccessStories = async (articleId: string, limit: number = 10) => {
  const response = await api.get(`/articles/${articleId}/success-stories`, { params: { limit } });
  return response.data;
};

export const markStoryHelpful = async (storyId: string) => {
  const response = await api.post(`/success-stories/${storyId}/helpful`);
  return response.data;
};

// Bookmarks (local storage for offline support)
export const bookmarkArticle = async (articleId: string) => {
  // TODO: Implement local storage + API sync
  console.log('Bookmark article:', articleId);
};

export const unbookmarkArticle = async (articleId: string) => {
  // TODO: Implement local storage + API sync
  console.log('Unbookmark article:', articleId);
};

export const getBookmarkedArticles = async () => {
  // TODO: Implement local storage retrieval
  return [];
};

// Crop Rotation
export const generateRotationPlan = async (planData: any) => {
  const response = await api.post('/crop-rotation/generate', planData);
  return response.data;
};

export const validateRotationSequence = async (sequence: string[]) => {
  const response = await api.post('/crop-rotation/validate', {
    rotation_sequence: sequence,
  });
  return response.data;
};

// Analytics
export const getArticleAnalytics = async (articleId: string) => {
  const response = await api.get(`/articles/${articleId}/analytics`);
  return response.data;
};

export const getKnowledgeBaseStats = async () => {
  const response = await api.get('/stats');
  return response.data;
};
