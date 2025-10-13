/**
 * Design System Components
 * Core component kit for the fitness app
 */

// Core components
export { default as Button } from './Button';
export { default as Card } from './Card';
export { default as Input } from './Input';

// Feedback components
export { default as InlineAlert } from './InlineAlert';
export { default as EmptyState } from './EmptyState';
export { default as ErrorState } from './ErrorState';
export { default as ErrorBoundary } from './ErrorBoundary';
export { default as ConnectHealthCard } from './ConnectHealthCard';

// Metric & Progress components
export { default as MetricTile, MetricTileGrid } from './MetricTile';
export { default as StatCard } from './StatCard';
export { default as ProgressBar } from './ProgressBar';
export { default as CircularProgress } from './CircularProgress';

// Loading components
export { 
  default as SkeletonLoader, 
  SkeletonList, 
  SkeletonCoachCard,
  SkeletonProgramCard,
  SkeletonRing,
  SkeletonChart,
  SkeletonCard 
} from './SkeletonLoader';

// Layout components
export { default as SectionHeader } from './SectionHeader';
export { default as BottomSheet } from './BottomSheet';

// Avatar components
export { default as Avatar } from './Avatar';

// Complex components
export { default as NutritionTracker } from './NutritionTracker';
export { default as WorkoutBuilder } from './WorkoutBuilder';
export { default as ProgressDashboard } from './ProgressDashboard';
export { default as SocialFeed } from './SocialFeed';
export { default as ProfileManager } from './ProfileManager';

// Chart components
export * from './charts';

