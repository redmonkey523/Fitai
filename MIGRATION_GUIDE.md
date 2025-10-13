# Migration Guide - Comprehensive Fix Implementation

## Overview
This guide walks through migrating from the old implementation to the new React Query-based architecture with proper error handling, loading states, and platform compliance.

## Prerequisites

### 1. Install Dependencies
```bash
npm install @tanstack/react-query expo-notifications expo-sqlite expo-secure-store
```

### 2. Configure Push Notifications
Update `app.json` (already done):
- Added `expo-notifications` plugin
- Added `extra.eas.projectId` (update with your ID)
- Added iOS `bundleIdentifier`

## Step-by-Step Migration

### Phase 1: Core Infrastructure (Required First)

#### 1. Update App.js
✅ Already done - QueryProvider wrapper added

#### 2. Verify Storage Initialization
✅ Already done - `initStorage()` called in App.js

### Phase 2: Replace Screen Files

#### Option A: Direct Replacement (Recommended)
Replace old files with improved versions:

```bash
# Backup originals
mv src/screens/PlansScreen.js src/screens/PlansScreen.old.js
mv src/screens/ProgressTrackingScreen.js src/screens/ProgressTrackingScreen.old.js
mv src/screens/DiscoverScreen.js src/screens/DiscoverScreen.old.js
mv src/components/CameraScanner.js src/components/CameraScanner.old.js

# Use improved versions
mv src/screens/PlansScreen.improved.js src/screens/PlansScreen.js
mv src/screens/ProgressTrackingScreen.improved.js src/screens/ProgressTrackingScreen.js
mv src/screens/DiscoverScreen.refactored.js src/screens/DiscoverScreen.js
mv src/components/CameraScanner.improved.js src/components/CameraScanner.js
```

#### Option B: Gradual Migration
Keep both versions and update navigation to use improved versions:

```javascript
// In TabNavigator.js or similar
import PlansScreenImproved from '../screens/PlansScreen.improved';

// Use the improved version
<Stack.Screen name="Plans" component={PlansScreenImproved} />
```

### Phase 3: Add New Screens

#### 1. Create Routine Screen
Add to navigation stack:

```javascript
import CreateRoutineScreen from '../screens/CreateRoutineScreen';

// In WorkoutStack or MainStack
<Stack.Screen 
  name="CreateRoutine" 
  component={CreateRoutineScreen}
  options={{ headerShown: false }}
/>
```

Update WorkoutLibraryScreen to navigate to it:
```javascript
<Button
  label="Create Routine"
  icon="add-circle"
  onPress={() => navigation.navigate('CreateRoutine')}
/>
```

#### 2. Creator Public Profile
Add to navigation:

```javascript
import CreatorPublicProfile from '../screens/CreatorPublicProfile';

<Stack.Screen 
  name="CreatorPublicProfile" 
  component={CreatorPublicProfile}
  options={{ headerShown: false }}
/>
```

Update CreatorHubScreen to check ownership:
```javascript
// In CreatorHubScreen.js or wherever you show creator profile
const isOwnProfile = creator?.userId === user?.id;

if (isOwnProfile) {
  // Show Creator Studio (existing screen)
  navigation.navigate('CreatorHub');
} else {
  // Show Public Profile
  navigation.navigate('CreatorPublicProfile', { creatorId: creator._id });
}
```

### Phase 4: Update Backend API Methods

Add missing API methods to `src/services/api.js`:

```javascript
// Add these if not present

// Plans
getPlans: async () => {
  return await api.get('/plans');
},

getPlan: async (planId) => {
  return await api.get(`/plans/${planId}`);
},

// Progress
getProgress: async ({ timeframe = '7d' } = {}) => {
  return await api.get('/progress', { params: { timeframe } });
},

// Creator
getCreatorProfile: async (creatorId) => {
  return await api.get(`/creators/${creatorId}`);
},

getCreatorContent: async (creatorId) => {
  return await api.get(`/creators/${creatorId}/content`);
},

followCreator: async (creatorId) => {
  return await api.post(`/creators/${creatorId}/follow`);
},

unfollowCreator: async (creatorId) => {
  return await api.delete(`/creators/${creatorId}/follow`);
},

// Notifications
registerPushToken: async (token) => {
  return await api.post('/notifications/register', { token });
},

// Workouts
createWorkout: async (workoutData) => {
  return await api.post('/workouts', workoutData);
},

updateWorkout: async (workoutId, data) => {
  return await api.put(`/workouts/${workoutId}`, data);
},

deleteWorkout: async (workoutId) => {
  return await api.delete(`/workouts/${workoutId}`);
},
```

### Phase 5: Test Each Screen

#### Testing Checklist

**Discover Screen:**
- [ ] Home tab shows spotlight grid
- [ ] Trending tab shows programs or empty state
- [ ] Coaches tab scrolls smoothly with pagination
- [ ] Programs tab shows content
- [ ] Loading shows skeletons
- [ ] Errors show retry button
- [ ] "Add to My Page" creates workout

**Plans Screen:**
- [ ] Shows user's plans if any exist
- [ ] Shows empty state with "Browse Programs" CTA
- [ ] Refresh button refetches data
- [ ] Navigation to plan detail works
- [ ] Loading shows skeleton
- [ ] Error shows retry

**Progress Screen:**
- [ ] Shows empty state for new users with educational copy
- [ ] Shows KPI cards with real data for active users
- [ ] Timeframe selector (7d, 30d, 90d) works
- [ ] Pull to refresh updates data
- [ ] Charts placeholder renders

**Create Routine:**
- [ ] Form validation prevents empty submission
- [ ] Can add/remove exercises
- [ ] All inputs work (sets, reps, weight, rest)
- [ ] Difficulty selector works
- [ ] Save creates workout and shows toast
- [ ] Navigation back on success

**Camera Scanner:**
- [ ] First use prompts for permission
- [ ] Grant permission opens camera
- [ ] Deny permission shows friendly message with retry
- [ ] Web shows "not available" message
- [ ] Flash toggle works
- [ ] Capture saves to documentDirectory
- [ ] Image doesn't disappear after capture

**Push Notifications:**
- [ ] Permission requested on app launch
- [ ] Token saved to backend
- [ ] Emulator shows friendly error
- [ ] Denial shows guidance

**Navigation & Scroll:**
- [ ] Opening modal preserves scroll position
- [ ] Returning from detail screen restores scroll
- [ ] Back button works consistently
- [ ] Modal close returns to previous screen

### Phase 6: Configure EAS for Push Notifications

```bash
# Install EAS CLI globally
npm install -g eas-cli

# Initialize EAS project
eas init

# Configure builds
eas build:configure

# Update credentials for iOS
eas credentials

# Update app.json with your project ID
# Replace "your-project-id-here" with actual ID from eas.json
```

### Phase 7: Performance Verification

Run performance tests:

```bash
# Bundle size
npx react-native bundle --platform android --dev false --entry-file index.js --bundle-output /tmp/bundle.js
ls -lh /tmp/bundle.js

# Test on device
npm run android
npm run ios

# Check memory usage, FPS, bundle size
```

### Phase 8: Clean Up

After verifying everything works:

```bash
# Remove old backup files
rm src/screens/*.old.js
rm src/components/*.old.js

# Update AGENT_TASKS.md with completion status
```

## Common Issues & Solutions

### Issue: "Module not found: @tanstack/react-query"
**Solution:** Run `npm install @tanstack/react-query`

### Issue: "expo-notifications not configured"
**Solution:** 
1. Check `app.json` has `expo-notifications` plugin
2. Run `npx expo prebuild --clean`
3. Rebuild: `npm run android` or `npm run ios`

### Issue: "Camera permission denied" on emulator
**Solution:** This is expected. Test on real device. Emulator shows friendly message.

### Issue: Skeletons not showing
**Solution:** Check network speed. Skeletons only show for requests >200ms.

### Issue: Empty states not appearing
**Solution:** 
1. Verify API returns empty array `[]` not `null`
2. Check `data?.length === 0` condition
3. Verify query is not in loading state

### Issue: Scroll restoration not working
**Solution:**
1. Ensure `useScrollRestoration` hook is called
2. Verify `ref={scrollViewRef}` is set
3. Check `onScroll={onScroll}` is connected
4. Test on device (may not work in web)

## Rollback Plan

If issues arise:

```bash
# Revert to old files
mv src/screens/PlansScreen.old.js src/screens/PlansScreen.js
mv src/screens/ProgressTrackingScreen.old.js src/screens/ProgressTrackingScreen.js
# etc...

# Remove new dependencies (optional)
npm uninstall @tanstack/react-query expo-notifications

# Revert App.js changes
git checkout App.js

# Restart
npm start -- --reset-cache
```

## Success Criteria

Migration is complete when:
- ✅ All 16 items from IMPLEMENTATION_SUMMARY.md are tested and working
- ✅ No console errors in development
- ✅ All screens show loading/empty/error states appropriately
- ✅ Camera permissions work on device
- ✅ Push notifications configured (token retrieved)
- ✅ Storage uses compliant directories
- ✅ Navigation preserves scroll
- ✅ Create routine flow end-to-end works
- ✅ Performance is smooth (60 FPS scrolling)

## Post-Migration

### 1. Update Documentation
- Update README.md with new features
- Document new API methods
- Add troubleshooting guide

### 2. Set Up Monitoring
- Add error tracking (Sentry/Bugsnag)
- Set up analytics
- Monitor API response times

### 3. Performance Optimization
- Run bundle analyzer
- Optimize images
- Enable Hermes (if not already)
- Test on low-end devices

### 4. Write Tests
```bash
# Unit tests for hooks
npm test src/hooks/useDiscover.test.js

# E2E tests
npm run e2e
```

## Support

For issues during migration:
1. Check IMPLEMENTATION_SUMMARY.md for details
2. Review console logs for errors
3. Test on physical device (not emulator)
4. Verify API endpoints are returning expected data

---

**Last Updated:** December 2024  
**Estimated Migration Time:** 2-4 hours  
**Risk Level:** Low (old files backed up)

