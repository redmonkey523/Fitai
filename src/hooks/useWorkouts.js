import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';

/**
 * Hook for fetching workouts
 */
export function useWorkouts(options = {}) {
  return useQuery({
    queryKey: ['workouts'],
    queryFn: async () => {
      const response = await api.getWorkouts();
      const workouts = Array.isArray(response.data?.data?.workouts)
        ? response.data.data.workouts
        : Array.isArray(response.data?.workouts)
        ? response.data.workouts
        : Array.isArray(response.data?.items)
        ? response.data.items
        : Array.isArray(response.data)
        ? response.data
        : [];
      return workouts;
    },
    staleTime: 3 * 60 * 1000, // 3 minutes
    ...options,
  });
}

/**
 * Hook for creating a workout/routine
 */
export function useCreateWorkout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (workoutData) => {
      return await api.createWorkout(workoutData);
    },
    onSuccess: () => {
      // Invalidate and refetch workouts
      queryClient.invalidateQueries({ queryKey: ['workouts'] });
    },
  });
}

/**
 * Hook for updating a workout
 */
export function useUpdateWorkout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }) => {
      return await api.updateWorkout(id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workouts'] });
    },
  });
}

/**
 * Hook for deleting a workout
 */
export function useDeleteWorkout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (workoutId) => {
      return await api.deleteWorkout(workoutId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workouts'] });
    },
  });
}

/**
 * Hook for fetching a single workout
 */
export function useWorkout(workoutId, options = {}) {
  return useQuery({
    queryKey: ['workouts', workoutId],
    queryFn: async () => {
      const response = await api.getWorkout(workoutId);
      return response?.data;
    },
    enabled: !!workoutId,
    staleTime: 5 * 60 * 1000,
    ...options,
  });
}

