# Discover Feature

A fast, resilient Discover area for an Expo fitness app featuring trending programs, coaches, and program listings.

## Features

✅ **Region-aware Trending** - Programs filtered by region (Global, US, EU, etc.)  
✅ **Virtualized Lists** - Optimal performance with proper image sizing  
✅ **Loading States** - Skeleton loaders shown for >= 200ms  
✅ **Error Handling** - Friendly error states with retry functionality  
✅ **Empty States** - Helpful empty states with action buttons  
✅ **Analytics** - Event tracking for impressions, clicks, and actions  
✅ **TypeScript** - Full type safety throughout  
✅ **TanStack Query** - Modern data fetching with caching and retries  

## Architecture

```
features/discover/
├── DiscoverScreen.tsx          # Main screen with tabs
├── components/
│   ├── ProgramCard.tsx         # Program list item
│   ├── CoachCard.tsx           # Coach list item
│   ├── EmptyState.tsx          # Empty list placeholder
│   ├── ErrorState.tsx          # Error with retry button
│   └── SkeletonRow.tsx         # Loading skeleton
├── hooks/
│   ├── useTrendingPrograms.ts  # Fetch trending by region
│   ├── useCoaches.ts           # Fetch coaches with pagination
│   └── usePrograms.ts          # Fetch programs with pagination
└── index.ts                    # Public exports
```

## Usage

### Basic Import

```tsx
import { DiscoverScreen } from '../features/discover';

// In your navigator
<Stack.Screen name="Discover" component={DiscoverScreen} />
```

### Using Hooks Directly

```tsx
import { useTrendingPrograms, useCoaches, usePrograms } from '../features/discover';

function MyComponent() {
  const { data: trending, isLoading, error, refetch } = useTrendingPrograms({ 
    region: 'US' 
  });
  
  const { data: coaches } = useCoaches({ 
    page: 1, 
    limit: 20 
  });
  
  const { data: programs } = usePrograms({ 
    page: 1 
  });
}
```

### Using Components

```tsx
import { ProgramCard, CoachCard, EmptyState, ErrorState } from '../features/discover';

<ProgramCard
  program={program}
  source="trending"
  onPress={handlePress}
  onAdd={handleAdd}
/>

<CoachCard
  coach={coach}
  source="coaches"
  onPress={handlePress}
  onFollow={handleFollow}
/>

<EmptyState
  icon="search-outline"
  title="No results found"
  message="Try adjusting your filters"
  actionLabel="Refresh"
  onAction={refetch}
/>

<ErrorState
  message="Failed to load data"
  onRetry={refetch}
/>
```

## API Contracts

The feature expects these endpoints:

### Trending Programs
```
GET /api/trending?region={region}&window=7d
Response: { items: Program[] }
```

### Coaches
```
GET /api/coaches?page={page}&limit={limit}
Response: { items: Coach[], nextPage?: number }
```

### Programs
```
GET /api/programs?page={page}&limit={limit}
Response: { items: Program[], nextPage?: number }
```

## Type Definitions

```typescript
interface Program {
  id: string;
  title: string;
  coverUrl?: string;
  priceCents: number;
  rating?: number;
  followers?: number;
  description?: string;
  duration?: string;
  coach?: string;
}

interface Coach {
  id: string;
  name: string;
  avatarUrl?: string;
  followers?: number;
  specialty?: string;
  verified?: boolean;
  rating?: number;
}
```

## Analytics Events

The feature tracks these events:

- `discover_view` - When user views a tab
- `discover_impression` - When item is visible in viewport
- `program_click` - When user taps a program
- `coach_click` - When user taps a coach
- `coach_follow` - When user follows a coach
- `program_add` - When user adds a program

## Storage Policy

Follows app-wide storage guidelines:
- **Cache**: TanStack Query cache (5min stale time for lists, 3min for trending)
- **No persistent storage**: Discover data is always fetched fresh
- **Images**: Loaded on-demand with proper sizing

## Performance Optimizations

1. **Virtualized lists** with `FlatList`
2. **Image optimization** with proper dimensions (88x56 for thumbnails)
3. **Skeleton loaders** prevent layout shift
4. **Pagination** for coaches and programs
5. **Debounced analytics** to avoid excessive tracking
6. **Remove clipped subviews** on Android
7. **Optimized re-renders** with React.memo and useCallback

## Testing

```bash
# Run tests (when implemented)
npm test -- features/discover
```

## Out of Scope

❌ Creator authoring flows  
❌ Purchase/checkout  
❌ Push notifications  
❌ Camera/uploads  
❌ Navigation config changes  

## Dependencies

- `@tanstack/react-query` - Data fetching
- `@expo/vector-icons` - Icons
- `react-native` - Core components
- `../../services/api` - API client
- `../../services/events` - Analytics
- `../../constants/theme` - Design tokens

