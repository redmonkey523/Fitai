import { useQuery } from '@tanstack/react-query';
import api, { ApiError } from '../services/api';
import Toast from 'react-native-toast-message';

/**
 * Hook for fetching user progress data with retry and error handling
 */
export function useProgress(timeframe = '7d', options = {}) {
  return useQuery({
    queryKey: ['progress', timeframe],
    queryFn: async () => {
      try {
        // Use withRetries for automatic retry on rate limit
        const response = await api.withRetries(
          () => api.getProgressAnalytics({ timeframe }),
          { endpoint: '/analytics/progress' }
        );
        const data = response?.data || {};
        
        // Calculate KPIs from workout logs
        return {
          totalWorkouts: data.totalWorkouts || 0,
          weeklyWorkouts: data.weeklyWorkouts || 0,
          totalCaloriesBurned: data.totalCaloriesBurned || 0,
          personalRecords: data.personalRecords || [],
          workoutStreak: data.workoutStreak || 0,
          averageWorkoutDuration: data.averageWorkoutDuration || 0,
          chartData: data.chartData || [],
          isEmpty: !data.totalWorkouts && !data.weeklyWorkouts,
        };
      } catch (error) {
        console.error('Error fetching progress:', error);
        
        // Handle specific error types
        if (error instanceof ApiError) {
          if (error.code === 'RATE_LIMIT') {
            Toast.show({
              type: 'error',
              text1: 'Rate Limited',
              text2: 'Too many requests. Please wait and try again.',
              visibilityTime: 3000,
            });
          } else if (error.code === 'NON_JSON' || error.code === 'BAD_JSON') {
            Toast.show({
              type: 'error',
              text1: 'Server Error',
              text2: 'Server returned an unexpected response.',
              visibilityTime: 3000,
            });
          }
        }
        
        // Return empty data instead of throwing
        return {
          totalWorkouts: 0,
          weeklyWorkouts: 0,
          totalCaloriesBurned: 0,
          personalRecords: [],
          workoutStreak: 0,
          averageWorkoutDuration: 0,
          chartData: [],
          isEmpty: true,
          error: error.message || 'Failed to load progress data',
        };
      }
    },
    staleTime: 2 * 60 * 1000, // 2 minutes (progress changes frequently)
    retry: 3, // React Query will retry 3 times
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
    ...options,
  });
}

/**
 * Hook for fetching workout history
 */
export function useWorkoutHistory(options = {}) {
  const { page = 1, limit = 20 } = options;
  
  return useQuery({
    queryKey: ['workouts', 'history', page, limit],
    queryFn: async () => {
      const response = await api.getWorkouts({ page, limit });
      return response?.data || [];
    },
    staleTime: 3 * 60 * 1000,
    keepPreviousData: true,
    ...options,
  });
}

