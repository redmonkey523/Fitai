/**
 * Shared TypeScript types for Goal Quiz and Progress data
 * These types establish the single source of truth for user goals and targets
 */

export type UserProfile = {
  id: string;
  sex: 'male' | 'female' | 'custom';
  age: number;
  height_cm: number;
  weight_kg: number;
  body_fat_pct?: number;
  units: 'metric' | 'imperial';
};

export type Goals = {
  primary: 'lose' | 'recomp' | 'gain';
  pace_kg_per_week: number; // +gain, -cut
  diet_style: 'balanced' | 'high_protein' | 'low_carb' | 'plant';
};

export type Targets = {
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g: number;
  water_cups: number;
  bmr: number;
  tdee: number;
  formula: 'mifflin_st_jeor';
};

export type Summary = {
  weightTrend: Array<{ date: string; kg: number }>;
  workoutsByDay: Array<{ day: string; count: number }>;
  streakDays: number;
  nutritionCompliance: Array<{
    date: string;
    kcal: number;
    target_kcal: number;
    p: number;
    c: number;
    f: number;
  }>;
  steps: Array<{ date: string; count: number }>;
  hydrationCups: Array<{ date: string; cups: number }>;
  targets: Targets; // echo current targets for convenience
};

export type ApiError = {
  error: {
    code: string;
    message: string;
  };
};

