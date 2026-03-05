/**
 * Grievance API Service
 * Client-side API calls for infrastructure grievance reporting
 */

import axios from 'axios';
import { getAuthToken } from '../auth/auth-service';
import { API_BASE_URL } from '../../config/api-config';

const api = axios.create({
  baseURL: `${API_BASE_URL}/api/infrastructure`,
  timeout: 30000, // 30 seconds for photo uploads
});

// Add auth token to requests
api.interceptors.request.use(async (config) => {
  const token = await getAuthToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ============================================================================
// TYPES
// ============================================================================

export type GrievanceCategory = 
  | 'road' 
  | 'water' 
  | 'electricity' 
  | 'sanitation' 
  | 'healthcare' 
  | 'education' 
  | 'public_safety' 
  | 'other';

export type SeverityLevel = 'low' | 'medium' | 'high' | 'critical';

export interface GPSLocation {
  latitude: number;
  longitude: number;
  accuracy?: number;
}

export interface PhotoData {
  uri: string;
  type: string;
  name: string;
  size: number;
}

export interface GrievanceSubmissionInput {
  title: string;
  description: string;
  category?: GrievanceCategory;
  subcategory?: string;
  location?: GPSLocation;
  address?: string;
  district?: string;
  state?: string;
  pincode?: string;
  landmark?: string;
  photos: PhotoData[];
  isAnonymous?: boolean;
  reporterContact?: string;
}

export interface GrievanceSubmissionResult {
  grievanceId: string;
  ticketNumber: string;
  category: GrievanceCategory;
  severity: SeverityLevel;
  assignedAuthority: string;
  slaDeadline: string;
  isDuplicate: boolean;
  duplicateOf?: string;
  photoUrls: string[];
  estimatedResolutionDays: number;
}

export interface AIClassificationResult {
  category: GrievanceCategory;
  confidence: number;
  severity: SeverityLevel;
  keywords: string[];
}

export interface DuplicateGrievance {
  grievanceId: string;
  ticketNumber: string;
  similarity: number;
  distance: number;
  createdAt: string;
}

// ============================================================================
// API FUNCTIONS
// ============================================================================

/**
 * Submit a new grievance
 */
export const submitGrievance = async (
  input: GrievanceSubmissionInput
): Promise<GrievanceSubmissionResult> => {
  // Mock submission in development mode
  if (__DEV__) {
    console.log('DEV MODE: Mock grievance submission');
    await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate network delay
    
    const ticketNumber = `GRV${Date.now().toString().slice(-8)}`;
    return {
      grievanceId: `grv_${Date.now()}`,
      ticketNumber,
      category: input.category || 'other',
      severity: 'medium',
      assignedAuthority: 'Municipal Corporation',
      slaDeadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      isDuplicate: false,
      photoUrls: input.photos.map(p => p.uri),
      estimatedResolutionDays: 7,
    };
  }

  const formData = new FormData();
  
  // Add text fields
  formData.append('title', input.title);
  formData.append('description', input.description);
  
  if (input.category) {
    formData.append('category', input.category);
  }
  
  if (input.subcategory) {
    formData.append('subcategory', input.subcategory);
  }
  
  if (input.location) {
    formData.append('latitude', input.location.latitude.toString());
    formData.append('longitude', input.location.longitude.toString());
    if (input.location.accuracy) {
      formData.append('accuracy', input.location.accuracy.toString());
    }
  }
  
  if (input.address) formData.append('address', input.address);
  if (input.district) formData.append('district', input.district);
  if (input.state) formData.append('state', input.state);
  if (input.pincode) formData.append('pincode', input.pincode);
  if (input.landmark) formData.append('landmark', input.landmark);
  
  if (input.isAnonymous) {
    formData.append('isAnonymous', 'true');
  }
  
  if (input.reporterContact) {
    formData.append('reporterContact', input.reporterContact);
  }
  
  // Add photos
  input.photos.forEach((photo, index) => {
    formData.append('photos', {
      uri: photo.uri,
      type: photo.type,
      name: photo.name,
    } as any);
  });
  
  const response = await api.post('/grievances', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  
  return response.data;
};

/**
 * Get AI classification for a photo (preview before submission)
 */
export const classifyGrievancePhoto = async (
  photoUri: string,
  description: string
): Promise<AIClassificationResult> => {
  // Mock classification in development mode
  if (__DEV__) {
    console.log('DEV MODE: Mock AI classification');
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate AI processing
    
    // Simple keyword-based classification for demo
    const lowerDesc = description.toLowerCase();
    let category: GrievanceCategory = 'other';
    let severity: SeverityLevel = 'medium';
    let confidence = 75;
    
    if (lowerDesc.includes('road') || lowerDesc.includes('pothole') || lowerDesc.includes('street')) {
      category = 'road';
      confidence = 85;
    } else if (lowerDesc.includes('water') || lowerDesc.includes('pipe') || lowerDesc.includes('leak')) {
      category = 'water';
      confidence = 80;
    } else if (lowerDesc.includes('electricity') || lowerDesc.includes('power') || lowerDesc.includes('light')) {
      category = 'electricity';
      confidence = 82;
    } else if (lowerDesc.includes('garbage') || lowerDesc.includes('waste') || lowerDesc.includes('sanitation')) {
      category = 'sanitation';
      confidence = 78;
    }
    
    if (lowerDesc.includes('urgent') || lowerDesc.includes('dangerous') || lowerDesc.includes('critical')) {
      severity = 'high';
    }
    
    return {
      category,
      confidence,
      severity,
      keywords: lowerDesc.split(' ').slice(0, 5),
    };
  }

  const formData = new FormData();
  
  formData.append('photo', {
    uri: photoUri,
    type: 'image/jpeg',
    name: 'preview.jpg',
  } as any);
  
  formData.append('description', description);
  
  const response = await api.post('/grievances/classify', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  
  return response.data;
};

/**
 * Check for duplicate grievances
 */
export const checkDuplicates = async (
  location: GPSLocation,
  category: GrievanceCategory
): Promise<DuplicateGrievance[]> => {
  const response = await api.post('/grievances/check-duplicates', {
    latitude: location.latitude,
    longitude: location.longitude,
    category,
  });
  
  return response.data.duplicates || [];
};

/**
 * Get grievance by ticket number
 */
export const getGrievanceByTicket = async (ticketNumber: string) => {
  const response = await api.get(`/grievances/ticket/${ticketNumber}`);
  return response.data;
};

/**
 * Get user's grievances
 */
export const getUserGrievances = async (
  status?: string,
  limit: number = 20,
  offset: number = 0
) => {
  const response = await api.get('/grievances/my-grievances', {
    params: { status, limit, offset },
  });
  return response.data;
};

/**
 * Search and filter grievances
 */
export interface GrievanceSearchParams {
  query?: string; // Search by ticket number, title, description
  status?: GrievanceStatus;
  category?: GrievanceCategory;
  startDate?: string;
  endDate?: string;
  myGrievances?: boolean;
  page?: number;
  limit?: number;
}

export type GrievanceStatus = 
  | 'submitted' 
  | 'acknowledged' 
  | 'in_progress' 
  | 'resolved' 
  | 'closed' 
  | 'rejected';

export interface GrievanceListItem {
  grievanceId: string;
  ticketNumber: string;
  title: string;
  description: string;
  category: GrievanceCategory;
  status: GrievanceStatus;
  severity: SeverityLevel;
  location?: GPSLocation;
  address?: string;
  photos: string[];
  createdAt: string;
  updatedAt: string;
  slaDeadline: string;
  isOverdue: boolean;
  daysOpen: number;
  reportedBy?: string;
  isAnonymous: boolean;
}

export interface GrievanceSearchResult {
  items: GrievanceListItem[];
  total: number;
  page: number;
  totalPages: number;
  hasMore: boolean;
}

export const searchGrievances = async (
  params: GrievanceSearchParams
): Promise<GrievanceSearchResult> => {
  // Mock data in development mode
  if (__DEV__) {
    console.log('DEV MODE: Mock grievance search');
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Return empty list for "my grievances" to show empty state
    if (params.myGrievances) {
      return {
        items: [],
        total: 0,
        page: 1,
        totalPages: 0,
        hasMore: false,
      };
    }
    
    // Sample grievances for general search
    const mockGrievances: GrievanceListItem[] = [
      {
        grievanceId: 'grv_1',
        ticketNumber: 'GRV12345678',
        title: 'Large pothole on Main Road',
        description: 'Dangerous pothole causing accidents',
        category: 'road',
        status: 'in_progress',
        severity: 'high',
        photos: [],
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        slaDeadline: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(),
        isOverdue: false,
        daysOpen: 3,
        isAnonymous: false,
      },
      {
        grievanceId: 'grv_2',
        ticketNumber: 'GRV12345679',
        title: 'Water supply disruption',
        description: 'No water for 2 days in our area',
        category: 'water',
        status: 'acknowledged',
        severity: 'medium',
        photos: [],
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        slaDeadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
        isOverdue: false,
        daysOpen: 2,
        isAnonymous: true,
      },
    ];
    
    return {
      items: mockGrievances,
      total: mockGrievances.length,
      page: 1,
      totalPages: 1,
      hasMore: false,
    };
  }

  const response = await api.get('/grievances/search', {
    params: {
      query: params.query,
      status: params.status,
      category: params.category,
      start_date: params.startDate,
      end_date: params.endDate,
      my_grievances: params.myGrievances,
      page: params.page || 1,
      limit: params.limit || 20,
    },
  });
  return response.data;
};

/**
 * Get grievance updates/timeline
 */
export const getGrievanceUpdates = async (grievanceId: string) => {
  const response = await api.get(`/grievances/${grievanceId}/updates`);
  return response.data;
};

/**
 * Verify grievance resolution
 */
export const verifyResolution = async (
  grievanceId: string,
  isFixed: boolean,
  rating?: number,
  feedback?: string,
  photos?: PhotoData[]
) => {
  const formData = new FormData();
  
  formData.append('isFixed', isFixed.toString());
  
  if (rating) {
    formData.append('rating', rating.toString());
  }
  
  if (feedback) {
    formData.append('feedback', feedback);
  }
  
  if (photos) {
    photos.forEach((photo) => {
      formData.append('photos', {
        uri: photo.uri,
        type: photo.type,
        name: photo.name,
      } as any);
    });
  }
  
  const response = await api.post(
    `/grievances/${grievanceId}/verify`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  );
  
  return response.data;
};

export default {
  submitGrievance,
  classifyGrievancePhoto,
  checkDuplicates,
  getGrievanceByTicket,
  getUserGrievances,
  searchGrievances,
  getGrievanceUpdates,
  verifyResolution,
};
