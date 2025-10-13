/**
 * Daily hydration tracking hook
 * Manages hydration entries and daily totals
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { db } from '../../../storage/db';
import api from '../../../services/api';
import eventService from '../../../services/events';

export interface HydrationEntry {
  id: string;
  date: string;
  ml: number;
  createdAt: string;
}

export function useDailyHydration(date: string) {
  const queryClient = useQueryClient();

  // Query for daily hydration total
  const { data, isLoading, error } = useQuery<{ total: number; entries: HydrationEntry[] }>({
    queryKey: ['hydration', date],
    queryFn: async () => {
      try {
        const rows = await db.execute(
          'SELECT * FROM hydration WHERE date = ? ORDER BY createdAt DESC',
          [date]
        );

        const entries = (rows || []) as HydrationEntry[];
        const total = entries.reduce((sum, entry) => sum + entry.ml, 0);

        return { total, entries };
      } catch (error) {
        console.error('[useDailyHydration] Query error:', error);
        return { total: 0, entries: [] };
      }
    },
    staleTime: 30 * 1000, // 30 seconds
  });

  // Mutation to add hydration
  const addMutation = useMutation({
    mutationFn: async (ml: number): Promise<HydrationEntry> => {
      const id = `hydro_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const createdAt = new Date().toISOString();

      const entry: HydrationEntry = {
        id,
        date,
        ml,
        createdAt,
      };

      // Insert into SQLite
      await db.execute(
        'INSERT INTO hydration (id, date, ml, createdAt) VALUES (?, ?, ?, ?)',
        [entry.id, entry.date, entry.ml, entry.createdAt]
      );

      // Background API sync
      try {
        await api.apiCreateHydration(entry);
      } catch (error) {
        console.warn('[useDailyHydration] API sync failed:', error);
      }

      return entry;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hydration', date] });
      eventService.emit('hydration_added', { date, ml: data?.total || 0 });
    },
  });

  return {
    total: data?.total || 0,
    entries: data?.entries || [],
    isLoading,
    error,
    addWater: (ml: number) => addMutation.mutate(ml),
    isAdding: addMutation.isPending,
  };
}

