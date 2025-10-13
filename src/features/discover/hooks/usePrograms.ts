import { useQuery, useInfiniteQuery, UseQueryOptions } from '@tanstack/react-query';
import { apiPrograms, Program, ProgramsResponse } from '../../../services/api';
import { trackDiscoverView } from '../../../services/events';
import { useEffect, useRef } from 'react';

/**
 * Options for usePrograms hook
 */
export interface UseProgramsOptions {
  page?: number;
  limit?: number;
  enabled?: boolean;
  staleTime?: number;
}

/**
 * Hook for fetching programs with pagination
 * 
 * Features:
 * - Pagination support
 * - Automatic refetch with configurable stale time
 * - Loading skeletons for >= 200ms
 * - Error states with retry
 * - Analytics tracking
 * - keepPreviousData for smooth transitions
 * 
 * @param options - Hook configuration options
 * @returns React Query result with programs list
 */
export function usePrograms(options: UseProgramsOptions = {}) {
  const { page = 1, limit = 20, enabled = true, staleTime = 5 * 60 * 1000 } = options;
  
  // Track view when enabled
  const hasTracked = useRef(false);
  useEffect(() => {
    if (enabled && !hasTracked.current) {
      trackDiscoverView('programs');
      hasTracked.current = true;
    }
  }, [enabled]);

  const query = useQuery<Program[], Error>({
    queryKey: ['discover', 'programs', page, limit],
    queryFn: async () => {
      const response = await apiPrograms(page, limit);
      return response.items;
    },
    enabled,
    staleTime,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000),
    placeholderData: (previousData) => previousData, // keepPreviousData replacement in v5
  });

  return query;
}

/**
 * Hook for infinite scrolling programs list
 * 
 * @param options - Hook configuration options
 * @returns React Query infinite result
 */
export function useInfinitePrograms(options: Omit<UseProgramsOptions, 'page'> = {}) {
  const { limit = 20, enabled = true, staleTime = 5 * 60 * 1000 } = options;
  
  // Track view when enabled
  const hasTracked = useRef(false);
  useEffect(() => {
    if (enabled && !hasTracked.current) {
      trackDiscoverView('programs');
      hasTracked.current = true;
    }
  }, [enabled]);

  const query = useInfiniteQuery<ProgramsResponse, Error>({
    queryKey: ['discover', 'programs', 'infinite', limit],
    queryFn: async ({ pageParam = 1 }) => {
      return await apiPrograms(pageParam as number, limit);
    },
    enabled,
    staleTime,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => lastPage.nextPage,
  });

  return query;
}

