/**
 * Nutrition feature exports
 */

export { AddMealSheet } from './AddMealSheet';

// Hooks
export { useFoodSearch } from './hooks/useFoodSearch';
export { useRecents } from './hooks/useRecents';
export { useLogMeal } from './hooks/useLogMeal';
export { useDailyHydration } from './hooks/useDailyHydration';
export { useDailyMeals } from './hooks/useDailyMeals';

// Types
export type { FoodItem, FoodSearchResult } from './hooks/useFoodSearch';
export type { RecentFood } from './hooks/useRecents';
export type { Meal, MealInput } from './hooks/useLogMeal';
export type { HydrationEntry } from './hooks/useDailyHydration';
export type { DailyTotals, DailyMealsData } from './hooks/useDailyMeals';

