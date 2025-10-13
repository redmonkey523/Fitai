/**
 * TypeScript API Client for Agent 2 Endpoints
 * 
 * Usage with React Query:
 * 
 * import { apiClient } from './api-client';
 * import { useQuery, useMutation } from '@tanstack/react-query';
 * 
 * // Get goals
 * const { data: goals } = useQuery({
 *   queryKey: ['goals'],
 *   queryFn: apiClient.getGoals
 * });
 * 
 * // Update profile
 * const updateProfile = useMutation({
 *   mutationFn: apiClient.updateProfile,
 *   onSuccess: () => queryClient.invalidateQueries(['goals'])
 * });
 */

// Type definitions

export interface UserProfile {
  sex: 'male' | 'female' | 'other';
  age: number;
  height_cm: number;
  weight_kg: number;
  body_fat_pct?: number;
  goal_type?: 'lose' | 'recomp' | 'gain';
  pace_kg_per_week?: number;
  diet_style?: 'balanced' | 'high_protein' | 'low_carb' | 'plant_forward';
}

export interface GoalsResponse {
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  water_cups: number;
  fiber_g: number;
  explain: {
    bmr: number;
    tdee: number;
    adjustment_kcal_per_day: number;
    formula: string;
    activityMultiplier: number;
    paceKgPerWeek: number;
    dietStyle: string;
    goalType: string;
  };
}

export interface ProgressMeasurement {
  date: string; // ISO date string
  weight?: number;
  bodyFat?: number;
  waist?: number;
}

export interface ProgressAnalyticsResponse {
  success: boolean;
  data: {
    period: string;
    overview: Array<{
      type: string;
      count: number;
      averageValue: number;
      firstValue: number;
      latestValue: number;
      change: number;
      changePercent: number;
      trend: 'increasing' | 'decreasing' | 'stable';
    }>;
    trends: Array<{
      _id: { type: string; date: string };
      value: number;
    }>;
  };
  measurements: ProgressMeasurement[];
  photosCount: number;
  workoutsCount: number;
}

export interface ApiError {
  error: {
    code: string;
    message: string;
    fields?: Array<{ field: string; message: string }>;
  };
  retry_after?: number;
}

// Configuration
interface ApiClientConfig {
  baseURL: string;
  getAuthToken: () => string | null;
  onUnauthorized?: () => void;
  onRateLimited?: (retryAfter: number) => void;
}

class ApiClient {
  private config: ApiClientConfig;

  constructor(config: ApiClientConfig) {
    this.config = config;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = this.config.getAuthToken();
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const url = `${this.config.baseURL}${endpoint}`;

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      // Handle rate limiting
      if (response.status === 429) {
        const retryAfter = parseInt(response.headers.get('Retry-After') || '60');
        const data = await response.json() as ApiError;
        
        if (this.config.onRateLimited) {
          this.config.onRateLimited(retryAfter);
        }
        
        throw new Error(data.error.message || 'Too many requests');
      }

      // Handle unauthorized
      if (response.status === 401) {
        if (this.config.onUnauthorized) {
          this.config.onUnauthorized();
        }
        throw new Error('Unauthorized');
      }

      // Handle other errors
      if (!response.ok) {
        const errorData = await response.json() as ApiError;
        throw new Error(errorData.error.message || 'Request failed');
      }

      return await response.json() as T;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Network error');
    }
  }

  /**
   * PUT /api/users/me - Update user profile with quiz payload
   */
  async updateProfile(profile: UserProfile): Promise<UserProfile> {
    return this.request<UserProfile>('/api/users/me', {
      method: 'PUT',
      body: JSON.stringify(profile),
    });
  }

  /**
   * GET /api/users/goals - Get computed goals with explanation
   */
  async getGoals(): Promise<GoalsResponse> {
    return this.request<GoalsResponse>('/api/users/goals');
  }

  /**
   * GET /api/analytics/progress - Get progress analytics with timeframe
   */
  async getProgressAnalytics(
    timeframe: '7d' | '30d' | '90d' = '30d'
  ): Promise<ProgressAnalyticsResponse> {
    return this.request<ProgressAnalyticsResponse>(
      `/api/analytics/progress?timeframe=${timeframe}`
    );
  }
}

// Create and export client instance
// Note: Configure this with your actual API base URL and auth token retrieval
export const createApiClient = (config: ApiClientConfig) => new ApiClient(config);

// Example configuration
export const apiClient = createApiClient({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000',
  getAuthToken: () => {
    // Implement your token retrieval logic
    // e.g., from localStorage, Redux store, etc.
    return localStorage.getItem('authToken');
  },
  onUnauthorized: () => {
    // Handle unauthorized (e.g., redirect to login)
    console.warn('Unauthorized - redirecting to login');
    // window.location.href = '/login';
  },
  onRateLimited: (retryAfter) => {
    // Handle rate limiting (e.g., show toast notification)
    console.warn(`Rate limited - retry after ${retryAfter} seconds`);
  },
});

// React Query hooks examples

/**
 * Example React Query hook for goals
 * 
 * export function useGoals() {
 *   return useQuery({
 *     queryKey: ['goals'],
 *     queryFn: () => apiClient.getGoals(),
 *     staleTime: 5 * 60 * 1000, // 5 minutes
 *   });
 * }
 * 
 * Example React Query hook for updating profile
 * 
 * export function useUpdateProfile() {
 *   const queryClient = useQueryClient();
 *   
 *   return useMutation({
 *     mutationFn: (profile: UserProfile) => apiClient.updateProfile(profile),
 *     onSuccess: () => {
 *       queryClient.invalidateQueries(['goals']);
 *       queryClient.invalidateQueries(['profile']);
 *     },
 *   });
 * }
 * 
 * Example React Query hook for progress analytics
 * 
 * export function useProgressAnalytics(timeframe: '7d' | '30d' | '90d' = '30d') {
 *   return useQuery({
 *     queryKey: ['progress', timeframe],
 *     queryFn: () => apiClient.getProgressAnalytics(timeframe),
 *     staleTime: 2 * 60 * 1000, // 2 minutes
 *   });
 * }
 */

export default apiClient;

