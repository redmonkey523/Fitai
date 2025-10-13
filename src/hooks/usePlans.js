import { useQuery } from '@tanstack/react-query';
import api from '../services/api';

/**
 * Hook for fetching user's plans/programs
 */
export function usePlans(options = {}) {
  return useQuery({
    queryKey: ['plans', 'user'],
    queryFn: async () => {
      try {
        // Fetch user's subscribed/saved plans
        const response = await api.getPlans();
        return response?.data || [];
      } catch (error) {
        console.error('Error fetching plans:', error);
        return [];
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  });
}

/**
 * Hook for fetching a single plan detail
 */
export function usePlan(planId, options = {}) {
  return useQuery({
    queryKey: ['plans', planId],
    queryFn: async () => {
      const response = await api.getPlan(planId);
      return response?.data;
    },
    enabled: !!planId,
    staleTime: 10 * 60 * 1000, // 10 minutes
    ...options,
  });
}

