# Migration Guide: Old DiscoverScreen → New TypeScript Discover

This guide helps you migrate from the existing JavaScript `DiscoverScreen.js` to the new TypeScript `features/discover` module.

## Quick Start (5 minutes)

### Step 1: Update Navigation Import

**File:** `src/navigation/TabNavigator.js`

```diff
- import DiscoverScreen from '../screens/DiscoverScreen';
+ import { DiscoverScreen } from '../features/discover';

// Rest stays the same
<Tab.Screen
  name="Discover"
  component={DiscoverScreen}
  // ... options
/>
```

### Step 2: Test the Integration

```bash
npm start
# Navigate to Discover tab and verify it works
```

### Step 3: (Optional) Remove Old Files

Once you've verified the new screen works:

```bash
# Move old file to backup
mv src/screens/DiscoverScreen.js src/screens/DiscoverScreen.backup.js

# Or delete if you're confident
rm src/screens/DiscoverScreen.js
```

## Detailed Comparison

### What's Different?

| Feature | Old (JS) | New (TS) | Improvement |
|---------|----------|----------|-------------|
| Type Safety | ❌ None | ✅ Full | Catches errors at compile time |
| Folder Structure | Single file | Feature module | Better organization |
| Components | Inline | Separate files | Reusable |
| Hooks | Mixed in screen | Dedicated files | Testable |
| Analytics | Basic | Comprehensive | Better insights |
| Error Handling | Basic | Robust with retry | Better UX |
| Loading States | Simple | Animated skeletons | Better UX |
| Documentation | Minimal | Comprehensive | Easier maintenance |

### What's the Same?

- ✅ Same UI/UX design
- ✅ Same color scheme (cyberpunk theme)
- ✅ Same tabs (Trending, Coaches, Programs)
- ✅ Same navigation props
- ✅ Same backend endpoints (with normalization)

## Feature-by-Feature Migration

### 1. Hooks

**Old:**
```javascript
// src/hooks/useDiscover.js
export function useTrendingPrograms(options = {}) {
  return useQuery({ ... });
}
```

**New:**
```typescript
// src/features/discover/hooks/useTrendingPrograms.ts
export function useTrendingPrograms(options: UseTrendingProgramsOptions = {}) {
  return useQuery<Program[], Error>({ ... });
}
```

**Migration:**
- ✅ No API changes needed
- ✅ Just change import path
- ✅ Get TypeScript benefits automatically

### 2. Components

**Old:** Components were inline in `DiscoverScreen.js`

**New:** Separate component files

```typescript
// Now you can reuse these anywhere:
import { ProgramCard, CoachCard } from '../features/discover';

<ProgramCard program={program} source="home" onPress={...} />
```

### 3. Analytics

**Old:**
```javascript
api.trackEvent('discover_impression', { id, tab });
```

**New:**
```typescript
import { trackImpression } from '../../services/events';
trackImpression(itemId, 'program', 'trending', position);
```

**Benefits:**
- ✅ Type-safe event names
- ✅ Type-safe payloads
- ✅ Auto-complete in IDE
- ✅ Compile-time validation

### 4. Error Handling

**Old:** Basic error display

**New:** Dedicated `ErrorState` component with retry

```typescript
<ErrorState
  message="Failed to load content"
  error={error}
  onRetry={refetch}
/>
```

### 5. Loading States

**Old:** Simple loading text/spinner

**New:** Animated skeleton loaders

```typescript
<SkeletonList count={6} type="program" />
```

## Gradual Migration Strategy

If you want to migrate gradually:

### Phase 1: Side-by-side (Week 1)
Keep both screens, use feature flag:

```javascript
const USE_NEW_DISCOVER = __DEV__; // Test in dev first

<Tab.Screen
  name="Discover"
  component={USE_NEW_DISCOVER ? NewDiscoverScreen : OldDiscoverScreen}
/>
```

### Phase 2: Components (Week 2)
Start using new components in old screen:

```javascript
// In old DiscoverScreen.js
import { ProgramCard, ErrorState } from '../features/discover';
```

### Phase 3: Full Switch (Week 3)
Remove old screen entirely, use new one.

### Phase 4: Cleanup (Week 4)
Remove old hooks from `src/hooks/useDiscover.js`.

## Breaking Changes

### None! 🎉

The new implementation is designed to be a **drop-in replacement**. The API is compatible with the existing backend.

### However, Note These Differences:

1. **Import paths changed:**
   ```diff
   - import DiscoverScreen from '../screens/DiscoverScreen';
   + import { DiscoverScreen } from '../features/discover';
   ```

2. **Hook imports changed:**
   ```diff
   - import { useTrendingPrograms } from '../hooks/useDiscover';
   + import { useTrendingPrograms } from '../features/discover';
   ```

3. **Component props are now typed:**
   ```typescript
   // Old: any props accepted
   // New: TypeScript will validate props
   <ProgramCard program={program} source="trending" />
   ```

## Testing Checklist

After migration, verify:

- [ ] Trending tab loads programs
- [ ] Coaches tab loads coaches
- [ ] Programs tab loads programs
- [ ] Region selector works (Global/US)
- [ ] Cards are clickable
- [ ] Error states show retry button
- [ ] Empty states show friendly message
- [ ] Skeleton loaders animate
- [ ] Navigation works (tap card → detail screen)
- [ ] Analytics events fire (check console in dev)
- [ ] Pagination works (scroll to bottom)
- [ ] Pull to refresh works

## Rollback Plan

If you need to rollback:

1. **Quick rollback:** Change import back to old screen
2. **Full rollback:** 
   ```bash
   git checkout src/navigation/TabNavigator.js
   ```

## Backend Compatibility

The new TypeScript implementation **normalizes** backend responses, so it works with various response formats:

```typescript
// Works with:
{ items: [...] }
{ data: [...] }
{ data: { items: [...] } }
{ success: true, data: { programs: [...] } }
```

No backend changes needed!

## IDE Benefits

After migration, you'll get:

✅ **Auto-complete** for all component props  
✅ **Type hints** for function parameters  
✅ **Inline documentation** in tooltips  
✅ **Go to definition** for types  
✅ **Refactoring support** (rename, move)  
✅ **Error detection** before runtime  

## Support

Questions? Check:
1. `src/features/discover/README.md` - Full documentation
2. `src/features/discover/INTEGRATION_EXAMPLE.tsx` - Code examples
3. This migration guide

## Summary

**Effort:** 5-10 minutes  
**Risk:** Very low (drop-in replacement)  
**Benefit:** High (type safety, better UX, reusable components)  

**Recommendation:** ✅ Migrate now! The new implementation is production-ready.

