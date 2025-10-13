/**
 * React Query hooks for user profile, goals, and summary data
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import Toast from 'react-native-toast-message';

// Query keys
export const QUERY_KEYS = {
  profile: ['profile'] as const,
  goals: ['goals'] as const,
  summary: (window?: string) => ['summary', { window }] as const,
};

/**
 * Hook to fetch user profile
 */
export function useProfile() {
  return useQuery({
    queryKey: QUERY_KEYS.profile,
    queryFn: async () => {
      const response = await api.getUserProfile();
      return response?.data || response;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to fetch user goals
 */
export function useGoals() {
  return useQuery({
    queryKey: QUERY_KEYS.goals,
    queryFn: async () => {
      const response = await api.getUserGoals();
      return response?.data || response;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to fetch user summary (progress data)
 * @param window - Time window: '7d' | '30d' | '90d'
 */
export function useSummary(window: string = '7d') {
  return useQuery({
    queryKey: QUERY_KEYS.summary(window),
    queryFn: async () => {
      const response = await api.getUserSummary({ window });
      return response?.data || response;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes (fresher data for progress)
  });
}

/**
 * Hook to save quiz results (profile + goals)
 */
export function useSaveQuiz() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ profile, goals }: { profile: any; goals: any }) => {
      return await api.saveQuizResults({ profile, goals });
    },
    onSuccess: () => {
      // Invalidate all related queries to refetch fresh data
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.profile });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.goals });
      queryClient.invalidateQueries({ queryKey: ['summary'] }); // Invalidate all summary queries
      
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Plan saved and applied',
        visibilityTime: 3000,
      });
    },
    onError: (error: any) => {
      console.error('[useSaveQuiz] Error:', error);
      
      Toast.show({
        type: 'error',
        text1: 'Save Failed',
        text2: error?.message || 'Failed to save your goals. Please try again.',
        visibilityTime: 4000,
      });
    },
  });
}

/**
 * Hook to update profile only
 */
export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profileData: any) => {
      return await api.updateUserProfile(profileData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.profile });
      
      Toast.show({
        type: 'success',
        text1: 'Profile Updated',
        text2: 'Your profile has been updated successfully',
        visibilityTime: 2000,
      });
    },
    onError: (error: any) => {
      console.error('[useUpdateProfile] Error:', error);
      
      Toast.show({
        type: 'error',
        text1: 'Update Failed',
        text2: error?.message || 'Failed to update profile',
        visibilityTime: 3000,
      });
    },
  });
}

/**
 * Hook to update goals only
 */
export function useUpdateGoals() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (goalsData: any) => {
      return await api.updateUserGoals(goalsData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.goals });
      queryClient.invalidateQueries({ queryKey: ['summary'] });
      
      Toast.show({
        type: 'success',
        text1: 'Goals Updated',
        text2: 'Your goals have been updated successfully',
        visibilityTime: 2000,
      });
    },
    onError: (error: any) => {
      console.error('[useUpdateGoals] Error:', error);
      
      Toast.show({
        type: 'error',
        text1: 'Update Failed',
        text2: error?.message || 'Failed to update goals',
        visibilityTime: 3000,
      });
    },
  });
}

