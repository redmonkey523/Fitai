/**
 * Daily meals hook
 * Fetches meals for a specific date with totals
 */

import { useQuery } from '@tanstack/react-query';
import { db } from '../../../storage/db';
import type { Meal } from './useLogMeal';

export interface DailyTotals {
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface DailyMealsData {
  meals: Meal[];
  totals: DailyTotals;
}

export function useDailyMeals(date: string) {
  return useQuery<DailyMealsData>({
    queryKey: ['meals', date],
    queryFn: async () => {
      try {
        const rows = await db.execute(
          'SELECT * FROM meals WHERE date = ? ORDER BY time ASC',
          [date]
        );

        const meals = (rows || []) as Meal[];

        const totals: DailyTotals = meals.reduce(
          (acc, meal) => ({
            kcal: acc.kcal + (meal.kcal || 0),
            protein: acc.protein + (meal.protein || 0),
            carbs: acc.carbs + (meal.carbs || 0),
            fat: acc.fat + (meal.fat || 0),
          }),
          { kcal: 0, protein: 0, carbs: 0, fat: 0 }
        );

        return { meals, totals };
      } catch (error) {
        console.error('[useDailyMeals] Query error:', error);
        return { meals: [], totals: { kcal: 0, protein: 0, carbs: 0, fat: 0 } };
      }
    },
    staleTime: 30 * 1000, // 30 seconds
  });
}

