/**
 * Meal logging hook with optimistic updates
 * Handles local SQLite insert and background API sync
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { db } from '../../../storage/db';
import api from '../../../services/api';
import eventService from '../../../services/events';

export interface MealInput {
  date: string;
  time: string;
  name: string;
  foodId?: string;
  serving?: number;
  unit?: string;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  source?: string;
}

export interface Meal extends MealInput {
  id: string;
  pending: boolean;
  createdAt: string;
}

export function useLogMeal() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (input: MealInput): Promise<Meal> => {
      const id = `meal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const createdAt = new Date().toISOString();

      const meal: Meal = {
        ...input,
        id,
        pending: true,
        createdAt,
      };

      // 1. Optimistic insert into SQLite
      try {
        await db.execute(
          `INSERT INTO meals (id, date, time, name, foodId, serving, unit, kcal, protein, carbs, fat, source, pending, createdAt)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            meal.id,
            meal.date,
            meal.time,
            meal.name,
            meal.foodId || null,
            meal.serving || null,
            meal.unit || null,
            meal.kcal,
            meal.protein,
            meal.carbs,
            meal.fat,
            meal.source || 'manual',
            1, // pending
            meal.createdAt,
          ]
        );
      } catch (error) {
        console.error('[useLogMeal] SQLite insert failed:', error);
        throw new Error('Failed to save meal locally');
      }

      // 2. Background API sync
      try {
        await api.apiCreateMeal(meal);

        // Mark as synced
        await db.execute('UPDATE meals SET pending = 0 WHERE id = ?', [meal.id]);
        meal.pending = false;
      } catch (error) {
        console.warn('[useLogMeal] API sync failed (will retry later):', error);
        // Keep pending flag; a background sync service could retry later
      }

      return meal;
    },
    onSuccess: (meal) => {
      // Invalidate queries to refetch
      queryClient.invalidateQueries({ queryKey: ['meals', meal.date] });
      queryClient.invalidateQueries({ queryKey: ['daily-totals', meal.date] });
      
      // Emit success event
      eventService.emit('meal_logged', {
        id: meal.id,
        date: meal.date,
        kcal: meal.kcal,
      });
    },
    onError: (error) => {
      console.error('[useLogMeal] Mutation error:', error);
      eventService.emit('meal_log_error', { error: String(error) });
    },
  });

  return {
    logMeal: mutation.mutate,
    logMealAsync: mutation.mutateAsync,
    isLogging: mutation.isPending,
    error: mutation.error,
  };
}

