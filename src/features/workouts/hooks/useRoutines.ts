/**
 * Hook for managing workout routines (local SQLite + optional backend sync)
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { db } from '../../../storage/db';
import { eventService } from '../../../services/events';
import api from '../../../services/api';

interface Routine {
  id: string;
  name: string;
  description?: string;
  difficulty?: string;
  createdAt: string;
}

interface RoutineDay {
  id: string;
  routineId: string;
  day: number;
  exercises: any[];
}

/**
 * Fetch all routines from local DB
 */
export function useRoutines() {
  return useQuery({
    queryKey: ['routines'],
    queryFn: async () => {
      await db.init();
      const rows = await db.execute('SELECT * FROM routines ORDER BY createdAt DESC');
      return (rows || []) as Routine[];
    },
    staleTime: 30 * 1000, // 30 seconds
  });
}

/**
 * Fetch a single routine with its days/exercises
 */
export function useRoutine(routineId: string | null) {
  return useQuery({
    queryKey: ['routines', routineId],
    queryFn: async () => {
      if (!routineId) return null;

      await db.init();

      const routineRows = await db.execute('SELECT * FROM routines WHERE id = ?', [routineId]);
      const routine = routineRows?.[0] as Routine | undefined;

      if (!routine) return null;

      const dayRows = await db.execute(
        'SELECT * FROM routine_days WHERE routineId = ? ORDER BY day ASC',
        [routineId]
      );

      const days = (dayRows || []).map((row: any) => ({
        id: row.id,
        routineId: row.routineId,
        day: row.day,
        exercises: JSON.parse(row.json || '[]'),
      }));

      return { ...routine, days };
    },
    enabled: !!routineId,
    staleTime: 30 * 1000,
  });
}

/**
 * Create a new routine
 */
export function useCreateRoutine() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      name: string;
      description?: string;
      difficulty?: string;
      days?: Array<{ day: number; exercises: any[] }>;
    }) => {
      await db.init();

      const id = `routine_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const createdAt = new Date().toISOString();

      // Insert routine
      await db.execute(
        'INSERT INTO routines (id, name, description, difficulty, createdAt) VALUES (?, ?, ?, ?, ?)',
        [id, data.name, data.description || '', data.difficulty || 'intermediate', createdAt]
      );

      // Insert routine days if provided
      if (data.days && data.days.length > 0) {
        for (const dayData of data.days) {
          const dayId = `day_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          await db.execute(
            'INSERT INTO routine_days (id, routineId, day, json) VALUES (?, ?, ?, ?)',
            [dayId, id, dayData.day, JSON.stringify(dayData.exercises)]
          );
        }
      }

      eventService.emit('routine_created', { routineId: id, name: data.name });

      // Optional: sync to backend
      try {
        await api.createWorkout({
          name: data.name,
          description: data.description,
          type: 'routine',
          difficulty: data.difficulty,
          localId: id,
        });
      } catch (error) {
        console.warn('[useCreateRoutine] Backend sync failed:', error);
        // Don't throw - local save succeeded
      }

      return { id, ...data, createdAt };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['routines'] });
    },
  });
}

/**
 * Update an existing routine
 */
export function useUpdateRoutine() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Routine> }) => {
      await db.init();

      const updates: string[] = [];
      const values: any[] = [];

      if (data.name !== undefined) {
        updates.push('name = ?');
        values.push(data.name);
      }
      if (data.description !== undefined) {
        updates.push('description = ?');
        values.push(data.description);
      }
      if (data.difficulty !== undefined) {
        updates.push('difficulty = ?');
        values.push(data.difficulty);
      }

      if (updates.length > 0) {
        values.push(id);
        await db.execute(`UPDATE routines SET ${updates.join(', ')} WHERE id = ?`, values);
      }

      eventService.emit('routine_updated', { routineId: id });

      return { id, ...data };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['routines'] });
      queryClient.invalidateQueries({ queryKey: ['routines', data.id] });
    },
  });
}

/**
 * Delete a routine
 */
export function useDeleteRoutine() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (routineId: string) => {
      await db.init();

      // Delete routine days first
      await db.execute('DELETE FROM routine_days WHERE routineId = ?', [routineId]);

      // Delete routine
      await db.execute('DELETE FROM routines WHERE id = ?', [routineId]);

      eventService.emit('routine_deleted', { routineId });

      return { id: routineId };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['routines'] });
    },
  });
}

