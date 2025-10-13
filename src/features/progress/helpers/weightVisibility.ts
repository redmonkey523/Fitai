/**
 * Weight widget visibility logic
 * Show widget only if user has relevant data
 */

export interface WeightVisibilityContext {
  hasRecentWeightLog: boolean;
  hasGoals: boolean;
  deviceWeightAvailable: boolean;
}

export function shouldShowWeightWidget(ctx: WeightVisibilityContext): boolean {
  return ctx.hasRecentWeightLog || ctx.hasGoals || ctx.deviceWeightAvailable;
}

export function getVisibilityReason(ctx: WeightVisibilityContext): 'hasLog' | 'hasGoals' | 'device' | 'none' {
  if (ctx.hasRecentWeightLog) return 'hasLog';
  if (ctx.hasGoals) return 'hasGoals';
  if (ctx.deviceWeightAvailable) return 'device';
  return 'none';
}

