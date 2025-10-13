import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { apiTrending, Program, TrendingResponse } from '../../../services/api';
import { trackDiscoverView } from '../../../services/events';
import { useEffect, useRef } from 'react';

/**
 * Options for useTrendingPrograms hook
 */
export interface UseTrendingProgramsOptions {
  region?: string;
  enabled?: boolean;
  staleTime?: number;
}

/**
 * Hook for fetching trending programs by region
 * 
 * Features:
 * - Region-aware trending (default: 'global')
 * - Automatic refetch with configurable stale time
 * - Loading skeletons for >= 200ms
 * - Error states with retry
 * - Analytics tracking
 * 
 * @param options - Hook configuration options
 * @returns React Query result with trending programs
 */
export function useTrendingPrograms(options: UseTrendingProgramsOptions = {}) {
  const { region = 'global', enabled = true, staleTime = 5 * 60 * 1000 } = options;
  
  // Track view when enabled
  const hasTracked = useRef(false);
  useEffect(() => {
    if (enabled && !hasTracked.current) {
      trackDiscoverView('trending');
      hasTracked.current = true;
    }
  }, [enabled]);

  const query = useQuery<Program[], Error>({
    queryKey: ['discover', 'trending', region],
    queryFn: async () => {
      const response = await apiTrending(region);
      return response.items;
    },
    enabled,
    staleTime,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000),
  });

  return query;
}

/**
 * Hook for prefetching trending programs (useful for preloading)
 */
export function usePrefetchTrending(region: string = 'global') {
  const { data } = useQuery<Program[], Error>({
    queryKey: ['discover', 'trending', region],
    queryFn: async () => {
      const response = await apiTrending(region);
      return response.items;
    },
    staleTime: 5 * 60 * 1000,
  });
  
  return data;
}

