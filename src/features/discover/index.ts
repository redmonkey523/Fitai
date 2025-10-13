/**
 * Discover Feature Module
 * 
 * A fast, resilient Discover area for browsing trending programs, coaches, and programs.
 * 
 * Features:
 * - Region-aware trending (Global, US, etc.)
 * - Virtualized lists for optimal performance
 * - Loading skeletons (>= 200ms)
 * - Error states with retry functionality
 * - Empty states with actions
 * - Analytics event tracking
 * - TypeScript with full type safety
 * - TanStack Query for data fetching
 */

// Main screen
export { default as DiscoverScreen } from './DiscoverScreen';

// Hooks
export { useTrendingPrograms, usePrefetchTrending } from './hooks/useTrendingPrograms';
export { useCoaches, useInfiniteCoaches } from './hooks/useCoaches';
export { usePrograms, useInfinitePrograms } from './hooks/usePrograms';

// Components
export { ProgramCard } from './components/ProgramCard';
export { CoachCard } from './components/CoachCard';
export { EmptyState } from './components/EmptyState';
export { ErrorState } from './components/ErrorState';
export { SkeletonRow, SkeletonList } from './components/SkeletonRow';

// Types (re-export from api service)
export type { Program, Coach, TrendingResponse, CoachesResponse, ProgramsResponse } from '../../services/api';

