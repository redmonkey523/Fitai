/**
 * Hook for starting and tracking workout sessions
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { db } from '../../../storage/db';
import { eventService } from '../../../services/events';

interface WorkoutSession {
  id: string;
  routineId?: string;
  routineName: string;
  startedAt: string;
  completedAt?: string;
  status: 'in_progress' | 'completed' | 'abandoned';
  data?: any;
}

/**
 * Start a workout session
 */
export function useStartWorkout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { routineId?: string; routineName: string }) => {
      await db.init();

      const id = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const startedAt = new Date().toISOString();

      await db.execute(
        'INSERT INTO workout_sessions (id, routineId, routineName, startedAt, status) VALUES (?, ?, ?, ?, ?)',
        [id, data.routineId || null, data.routineName, startedAt, 'in_progress']
      );

      eventService.emit('workout_started', {
        sessionId: id,
        routineId: data.routineId,
        routineName: data.routineName,
      });

      return { id, ...data, startedAt, status: 'in_progress' as const };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workout_sessions'] });
    },
  });
}

/**
 * Complete a workout session
 */
export function useCompleteWorkout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { sessionId: string; sessionData?: any }) => {
      await db.init();

      const completedAt = new Date().toISOString();
      const jsonData = data.sessionData ? JSON.stringify(data.sessionData) : null;

      await db.execute(
        'UPDATE workout_sessions SET completedAt = ?, status = ?, json = ? WHERE id = ?',
        [completedAt, 'completed', jsonData, data.sessionId]
      );

      eventService.emit('workout_finished', {
        sessionId: data.sessionId,
        completedAt,
        duration: null, // Could calculate from startedAt
      });

      return { sessionId: data.sessionId, completedAt, status: 'completed' as const };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workout_sessions'] });
    },
  });
}

/**
 * Abandon a workout session
 */
export function useAbandonWorkout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (sessionId: string) => {
      await db.init();

      await db.execute('UPDATE workout_sessions SET status = ? WHERE id = ?', [
        'abandoned',
        sessionId,
      ]);

      eventService.emit('workout_abandoned', { sessionId });

      return { sessionId, status: 'abandoned' as const };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workout_sessions'] });
    },
  });
}

