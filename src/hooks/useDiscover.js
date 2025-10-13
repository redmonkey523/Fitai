import React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import { API_BASE_URL } from '../config/api';

/**
 * Hook for fetching trending programs
 */
export function useTrendingPrograms(options = {}) {
  return useQuery({
    queryKey: ['discover', 'trending'],
    queryFn: async () => {
      const response = await api.getDiscover({ tab: 'trending', limit: 20, debug: 1 });
      const programs = Array.isArray(response?.data) 
        ? response.data 
        : (response?.success ? response.data?.programs : []);
      return programs || [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  });
}

/**
 * Hook for fetching coaches
 */
export function useCoaches(options = {}) {
  const { page = 1, limit = 20 } = options;
  
  return useQuery({
    queryKey: ['coaches', page, limit],
    queryFn: async () => {
      const response = await api.getCoaches({ page, limit });
      const coaches = response?.data?.items || response?.data || [];
      
      // Enhance coaches with fallback data
      const server = (API_BASE_URL || '').replace(/\/api$/, '');
      return coaches.map((coach, idx) => {
        const userAvatar = coach?.user?.profilePicture || coach?.user?.avatar;
        return {
          ...coach,
          avatar: coach?.profilePicture?.url || coach?.avatar || userAvatar || 
                 (server ? `${server}/uploads/seed/coach${(idx % 3) + 1}.jpg` : undefined),
          name: coach?.name || 
                [coach?.user?.firstName, coach?.user?.lastName].filter(Boolean).join(' ') || 
                `Coach ${idx + 1}`,
          specialty: Array.isArray(coach?.specialties) && coach.specialties.length 
                    ? coach.specialties.slice(0, 2).join(' • ') 
                    : (Array.isArray(coach?.niches) && coach.niches.length 
                      ? coach.niches.slice(0, 2).join(' • ') 
                      : 'Fitness Coach'),
        };
      });
    },
    staleTime: 5 * 60 * 1000,
    keepPreviousData: true,
    ...options,
  });
}

/**
 * Hook for fetching programs
 */
export function usePrograms(options = {}) {
  const { page = 1, limit = 20 } = options;
  
  return useQuery({
    queryKey: ['programs', page, limit],
    queryFn: async () => {
      const response = await api.getDiscover({ tab: 'for_you', page, limit, debug: 1 });
      const programs = Array.isArray(response?.data) 
        ? response.data 
        : (response?.success ? response.data?.programs : []);
      return programs || [];
    },
    staleTime: 5 * 60 * 1000,
    keepPreviousData: true,
    ...options,
  });
}

/**
 * Hook for prefetching next page
 */
export function usePrefetchNextPage(queryKey, fetchFn, currentPage) {
  const queryClient = useQueryClient();
  
  React.useEffect(() => {
    // Prefetch next page
    queryClient.prefetchQuery({
      queryKey: [...queryKey, currentPage + 1],
      queryFn: () => fetchFn(currentPage + 1),
    });
  }, [queryClient, currentPage, queryKey, fetchFn]);
}

/**
 * Hook for fetching discover home data
 */
export function useDiscoverHome(options = {}) {
  return useQuery({
    queryKey: ['discover', 'home'],
    queryFn: async () => {
      const [trending, forYou, coaches] = await Promise.all([
        api.getDiscover({ tab: 'trending', limit: 8, debug: 1 }),
        api.getDiscover({ tab: 'for_you', limit: 16 }),
        api.getCoaches({ limit: 16 }),
      ]);

      const trendingPrograms = (trending?.success ? trending.data?.programs : trending?.data) || [];
      const newPrograms = ((forYou?.success ? forYou.data?.programs : forYou?.data) || [])
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 8);
      
      const rawCoaches = (Array.isArray(coaches?.data) 
        ? coaches.data 
        : coaches?.success 
          ? (coaches.data?.coaches || coaches.data?.items) 
          : (coaches?.data?.items || [])) || [];

      const server = (API_BASE_URL || '').replace(/\/api$/, '');
      const coachesList = rawCoaches.map((c, idx) => ({
        ...c,
        avatar: c?.avatar || (server ? `${server}/uploads/seed/coach${(idx % 3) + 1}.jpg` : undefined),
      }));

      const topRatedCoaches = [...coachesList]
        .sort((a, b) => (b?.followers || 0) - (a?.followers || 0))
        .slice(0, 6);
      
      const liveCoaches = coachesList.filter(c => c?.hot || c?.verified).slice(0, 6);

      return {
        trendingPrograms,
        newPrograms,
        topRatedCoaches,
        liveCoaches,
        allCoaches: coachesList,
      };
    },
    staleTime: 3 * 60 * 1000, // 3 minutes for home (more dynamic)
    ...options,
  });
}

