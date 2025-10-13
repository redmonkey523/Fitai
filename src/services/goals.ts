/**
 * Goals and TDEE calculation service
 * Provides TDEE (Total Daily Energy Expenditure) calculations and goal tracking
 */

export type Sex = 'male' | 'female';
export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'very';
export type GoalTarget = 'cut' | 'recomp' | 'bulk';

export interface TDEEInput {
  sex: Sex;
  age: number;
  height_cm: number;
  weight_kg: number;
  activity: ActivityLevel;
}

export interface GoalInput extends TDEEInput {
  target: GoalTarget;
}

export interface MacroTargets {
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface Timeline {
  startWeight: number;
  targetWeight: number;
  weeklyDelta: number;
  estimatedWeeks: number;
  estimatedDate: string;
}

/**
 * Calculate TDEE using Mifflin-St Jeor equation
 */
export function tdee(input: TDEEInput): number {
  const { sex, age, height_cm, weight_kg, activity } = input;

  // Mifflin-St Jeor BMR calculation
  const s = sex === 'male' ? 5 : -161;
  const bmr = 10 * weight_kg + 6.25 * height_cm - 5 * age + s;

  // Activity multipliers
  const activityMultipliers: Record<ActivityLevel, number> = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    active: 1.725,
    very: 1.9,
  };

  const mult = activityMultipliers[activity] ?? 1.2;
  return Math.round(bmr * mult);
}

/**
 * Suggested weekly weight change in kg based on goal
 */
export function suggestedWeeklyDeltaKg(target: GoalTarget): number {
  switch (target) {
    case 'cut':
      return -0.4; // ~1 lb/week
    case 'bulk':
      return 0.25; // ~0.5 lb/week
    case 'recomp':
    default:
      return 0; // maintenance
  }
}

/**
 * Calculate macro targets based on TDEE and goal
 */
export function calculateMacros(input: GoalInput): MacroTargets {
  const baseTDEE = tdee(input);
  const { target, weight_kg } = input;

  let kcal = baseTDEE;
  let proteinMultiplier = 2.0; // g per kg bodyweight

  // Adjust calories and protein based on goal
  switch (target) {
    case 'cut':
      kcal = Math.round(baseTDEE * 0.8); // 20% deficit
      proteinMultiplier = 2.2; // Higher protein during cut
      break;
    case 'bulk':
      kcal = Math.round(baseTDEE * 1.1); // 10% surplus
      proteinMultiplier = 1.8;
      break;
    case 'recomp':
    default:
      kcal = baseTDEE;
      proteinMultiplier = 2.0;
      break;
  }

  const protein = Math.round(weight_kg * proteinMultiplier);
  const proteinKcal = protein * 4;

  // Fat: 25-30% of total calories
  const fatKcal = Math.round(kcal * 0.27);
  const fat = Math.round(fatKcal / 9);

  // Carbs: remaining calories
  const carbKcal = kcal - proteinKcal - fatKcal;
  const carbs = Math.round(carbKcal / 4);

  return {
    kcal,
    protein,
    carbs,
    fat,
  };
}

/**
 * Calculate timeline for reaching goal weight
 */
export function calculateTimeline(
  currentWeight: number,
  targetWeight: number,
  target: GoalTarget
): Timeline | null {
  const weeklyDelta = suggestedWeeklyDeltaKg(target);

  if (weeklyDelta === 0 || currentWeight === targetWeight) {
    return null; // No timeline for maintenance or if already at goal
  }

  const totalDelta = targetWeight - currentWeight;
  const weeks = Math.abs(totalDelta / weeklyDelta);
  const estimatedWeeks = Math.ceil(weeks);

  const estimatedDate = new Date();
  estimatedDate.setDate(estimatedDate.getDate() + estimatedWeeks * 7);

  return {
    startWeight: currentWeight,
    targetWeight,
    weeklyDelta,
    estimatedWeeks,
    estimatedDate: estimatedDate.toISOString().split('T')[0],
  };
}

/**
 * Get human-readable activity level description
 */
export function getActivityDescription(activity: ActivityLevel): string {
  const descriptions: Record<ActivityLevel, string> = {
    sedentary: 'Little to no exercise',
    light: 'Light exercise 1-3 days/week',
    moderate: 'Moderate exercise 3-5 days/week',
    active: 'Hard exercise 6-7 days/week',
    very: 'Very hard exercise & physical job',
  };
  return descriptions[activity] || 'Unknown';
}

/**
 * Get human-readable goal target description
 */
export function getGoalDescription(target: GoalTarget): string {
  const descriptions: Record<GoalTarget, string> = {
    cut: 'Lose fat (deficit)',
    recomp: 'Body recomposition (maintenance)',
    bulk: 'Build muscle (surplus)',
  };
  return descriptions[target] || 'Unknown';
}

