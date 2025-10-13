/**
 * Recent foods hook
 * Manages LRU cache of recently used foods (max 50 items)
 */

import { useState, useEffect } from 'react';
import { kv } from '../../../storage';
import type { FoodItem } from './useFoodSearch';

const RECENTS_KEY = 'nutrition.recents';
const MAX_RECENTS = 50;

export interface RecentFood extends FoodItem {
  lastUsedAt: number;
}

export function useRecents() {
  const [recents, setRecents] = useState<RecentFood[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load recents from storage on mount
  useEffect(() => {
    let mounted = true;
    
    const load = async () => {
      try {
        setIsLoading(true);
        const stored = await kv.getItem<RecentFood[]>(RECENTS_KEY);
        if (mounted && Array.isArray(stored)) {
          const sorted = stored.sort((a, b) => b.lastUsedAt - a.lastUsedAt);
          setRecents(sorted);
        }
      } catch (error) {
        console.error('[useRecents] Error loading:', error);
      } finally {
        if (mounted) setIsLoading(false);
      }
    };
    
    load();
    
    return () => {
      mounted = false;
    };
  }, []);

  const loadRecents = async () => {
    try {
      setIsLoading(true);
      const stored = await kv.getItem<RecentFood[]>(RECENTS_KEY);
      if (Array.isArray(stored)) {
        const sorted = stored.sort((a, b) => b.lastUsedAt - a.lastUsedAt);
        setRecents(sorted);
      }
    } catch (error) {
      console.error('[useRecents] Error loading:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const addRecent = async (food: FoodItem) => {
    try {
      const now = Date.now();
      const existing = recents.find((r) => r.id === food.id);

      let updated: RecentFood[];

      if (existing) {
        // Move to front with updated timestamp
        updated = [
          { ...food, lastUsedAt: now },
          ...recents.filter((r) => r.id !== food.id),
        ];
      } else {
        // Add new item at front
        updated = [{ ...food, lastUsedAt: now }, ...recents];
      }

      // Trim to max size
      if (updated.length > MAX_RECENTS) {
        updated = updated.slice(0, MAX_RECENTS);
      }

      setRecents(updated);
      await kv.setItem(RECENTS_KEY, updated);
    } catch (error) {
      console.error('[useRecents] Error adding:', error);
    }
  };

  const clearRecents = async () => {
    try {
      setRecents([]);
      await kv.removeItem(RECENTS_KEY);
    } catch (error) {
      console.error('[useRecents] Error clearing:', error);
    }
  };

  return {
    recents,
    isLoading,
    addRecent,
    clearRecents,
  };
}

