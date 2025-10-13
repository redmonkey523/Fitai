/**
 * Food search hook using TanStack Query
 * Handles debounced food search with caching
 */

import { useQuery } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import api from '../../../services/api';

export interface FoodItem {
  id: string;
  name: string;
  unit?: string;
  macros: {
    kcal: number;
    protein: number;
    carbs: number;
    fat: number;
  };
}

export interface FoodSearchResult {
  items: FoodItem[];
}

export function useFoodSearch(query: string, debounceMs = 150) {
  const [debouncedQuery, setDebouncedQuery] = useState(query);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [query, debounceMs]);

  const { data, isLoading, error, isFetching } = useQuery<FoodSearchResult>({
    queryKey: ['food-search', debouncedQuery],
    queryFn: async () => {
      if (!debouncedQuery || debouncedQuery.trim().length < 2) {
        return { items: [] };
      }

      try {
        const result = await api.apiFoodSearch(debouncedQuery);
        // Handle different response structures
        const items = result?.data?.items || result?.items || [];
        return { items };
      } catch (error) {
        console.error('[useFoodSearch] Error:', error);
        return { items: [] };
      }
    },
    enabled: debouncedQuery.trim().length >= 2,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
  });

  return {
    foods: data?.items || [],
    isSearching: isLoading || (isFetching && debouncedQuery !== query),
    error,
  };
}

