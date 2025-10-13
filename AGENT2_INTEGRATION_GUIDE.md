# Agent 2 - Integration Guide

This guide shows how to integrate the new Home, Nutrition, and Progress screens into your existing app.

## 1. Update Navigation

Replace or update your existing navigation to use the new screens:

### Option A: Replace Existing Screens

```javascript
// src/navigation/TabNavigator.js
import { HomeScreen } from '../features/home';
import { NutritionScreen } from '../features/nutrition';
import { ProgressScreen } from '../features/progress';

// In your Tab.Navigator:
<Tab.Screen 
  name="Home" 
  component={HomeScreen}
  options={{
    tabBarIcon: ({ color, size }) => (
      <Ionicons name="home-outline" size={size} color={color} />
    ),
  }}
/>

<Tab.Screen 
  name="Nutrition" 
  component={NutritionScreen}
  options={{
    tabBarIcon: ({ color, size }) => (
      <Ionicons name="restaurant-outline" size={size} color={color} />
    ),
  }}
/>

<Tab.Screen 
  name="Progress" 
  component={ProgressScreen}
  options={{
    tabBarIcon: ({ color, size }) => (
      <Ionicons name="trending-up-outline" size={size} color={color} />
    ),
  }}
/>
```

### Option B: Side-by-Side Testing

Keep old screens and add new ones with different names:

```javascript
// Old screens
<Tab.Screen name="HomeOld" component={OldHomeScreen} />
<Tab.Screen name="NutritionOld" component={OldNutritionScreen} />

// New Agent 2 screens
<Tab.Screen name="Home" component={HomeScreen} />
<Tab.Screen name="Nutrition" component={NutritionScreen} />
<Tab.Screen name="Progress" component={ProgressScreen} />
```

## 2. Wrap with QueryClientProvider

Ensure your app is wrapped with TanStack Query's provider:

```javascript
// App.js or src/providers/QueryProvider.js
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30 * 1000, // 30 seconds
      gcTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      {/* Your app content */}
    </QueryClientProvider>
  );
}
```

## 3. Initialize Database

Database migrations run automatically, but you can verify:

```javascript
import { db } from './src/storage/db';

// Somewhere early in your app initialization
await db.init();
console.log('[App] Database initialized');
```

## 4. Backend API Setup (Optional)

The features work offline-first, but to enable backend sync:

### Mock Backend Endpoints (for testing)

Create these endpoints in your backend:

```javascript
// backend/routes/meals.js
router.get('/api/foods/search', async (req, res) => {
  const { q, limit = 20 } = req.query;
  
  // Mock response for testing
  const mockFoods = [
    {
      id: 'food_1',
      name: 'Chicken Breast',
      unit: '100g',
      macros: { kcal: 165, protein: 31, carbs: 0, fat: 3.6 }
    },
    {
      id: 'food_2',
      name: 'Brown Rice',
      unit: 'cup',
      macros: { kcal: 215, protein: 5, carbs: 45, fat: 1.8 }
    },
  ];
  
  const filtered = mockFoods.filter(f => 
    f.name.toLowerCase().includes(q.toLowerCase())
  );
  
  res.json({ items: filtered });
});

router.post('/api/meals', async (req, res) => {
  const meal = req.body;
  // Save to database
  res.json({ success: true, meal });
});

router.post('/api/hydration', async (req, res) => {
  const entry = req.body;
  // Save to database
  res.json({ success: true, entry });
});

router.get('/api/goals', async (req, res) => {
  // Fetch user's goals
  res.json({ goals: [] });
});

router.post('/api/goals', async (req, res) => {
  const goal = req.body;
  // Save goal
  res.json({ success: true, goal });
});
```

## 5. Testing the Features

### Test Home Screen
1. Open app to Home tab
2. Should see "Good morning/afternoon/evening"
3. Today's macros should show 0 (empty state)
4. Tap "Add Meal" → Opens AddMealSheet
5. Tap "+250ml" → Adds water to hydration

### Test Nutrition Screen
1. Navigate to Nutrition tab
2. Should see date navigator (Today)
3. Tap FAB (+) button → Opens AddMealSheet
4. Search for a food (type at least 2 characters)
5. Select food → Adjust serving → Add to Log
6. Verify meal appears in list
7. Swipe left or tap delete icon to remove

### Test AddMealSheet (5-Second Path)
1. Open AddMealSheet
2. Type "chicken" in search
3. Should see results in <300ms
4. Tap a result
5. Adjust serving with +/- buttons
6. Tap "Add to Log"
7. Sheet closes, meal appears immediately

### Test Progress Screen
1. Navigate to Progress tab
2. First time: Should see "No Progress Data Yet" with CTAs
3. Tap "Set Goals" → Opens wizard
4. Complete all 4 steps (Basics → Activity → Target → Review)
5. Save goals
6. Should see Goals card with TDEE and macro targets
7. Charts appear when data is available

### Test Goal Setup Wizard
1. From Progress screen, tap "Set Goals" (or Edit if already set)
2. **Step 1 - Basics:**
   - Select Male/Female
   - Enter age (e.g., 25)
   - Enter height in cm (e.g., 175)
   - Enter weight in kg (e.g., 70)
   - Tap "Next"
3. **Step 2 - Activity:**
   - Select activity level (tap a card)
   - Tap "Next"
4. **Step 3 - Target:**
   - Select goal (Cut/Recomp/Bulk)
   - If Cut or Bulk, enter target weight
   - Tap "Next"
5. **Step 4 - Review:**
   - See TDEE calculation
   - See target calories
   - See macro breakdown
   - See timeline (if applicable)
   - Read disclaimer
   - Tap "Save Goals"

## 6. Performance Verification

### AddMealSheet 5-Second Metric

In dev mode, check console for event logs:

```
[Event] meal_add_open { date: '2025-01-15' }
[Event] meal_add_confirm { duration_ms: 4523, source: 'search', serving: 1 }
```

Should see `duration_ms` < 5000 for median usage.

### Debug Event Tracking

```javascript
import eventService from './src/services/events';

// View recent events
console.log(eventService.getRecentEvents(10));

// Listen to specific events
const unsubscribe = eventService.on('meal_logged', (name, payload) => {
  console.log('Meal logged:', payload);
});

// Cleanup
unsubscribe();
```

## 7. Common Issues & Solutions

### Issue: "Cannot find module '@tanstack/react-query'"
**Solution**: Already installed in package.json. Run `npm install` or `npx expo install`.

### Issue: "expo-sqlite not available"
**Solution**: Already installed. On web, SQLite won't work - features will show empty states gracefully.

### Issue: AddMealSheet not opening
**Solution**: Check that `useState` for `showAddMeal` is working. Verify Modal component is rendering.

### Issue: No search results
**Solution**: Backend endpoint `/api/foods/search` needs to return `{ items: [...] }`. Check API logs.

### Issue: Database errors
**Solution**: Check console for migration errors. Delete app and reinstall to reset DB.

### Issue: TypeScript errors
**Solution**: All files are TypeScript. Ensure `tsconfig.json` includes `src/features/**/*`.

## 8. Data Flow Diagram

```
User Action
    ↓
Component (HomeScreen, NutritionScreen, etc.)
    ↓
Hook (useDailyMeals, useLogMeal, etc.)
    ↓
TanStack Query (cache management)
    ↓
SQLite DB (optimistic write)
    ↓
API Service (background sync)
    ↓
Backend (optional)
```

## 9. File Checklist

Verify these files exist:

```
✅ src/features/home/HomeScreen.tsx
✅ src/features/home/index.ts
✅ src/features/nutrition/NutritionScreen.tsx
✅ src/features/nutrition/AddMealSheet.tsx
✅ src/features/nutrition/hooks/useFoodSearch.ts
✅ src/features/nutrition/hooks/useRecents.ts
✅ src/features/nutrition/hooks/useLogMeal.ts
✅ src/features/nutrition/hooks/useDailyHydration.ts
✅ src/features/nutrition/hooks/useDailyMeals.ts
✅ src/features/nutrition/index.ts
✅ src/features/progress/ProgressScreen.tsx
✅ src/features/progress/GoalSetup.tsx
✅ src/features/progress/components/EmptyProgress.tsx
✅ src/features/progress/components/TrendChart.tsx
✅ src/features/progress/components/ProgressPhotos.tsx
✅ src/features/progress/index.ts
✅ src/services/events.ts
✅ src/services/goals.ts
✅ src/storage/db.ts (updated with v2 migration)
✅ src/services/api.js (updated with new endpoints)
```

## 10. Next Steps

1. **Test thoroughly** on iOS, Android, and Web
2. **Capture screenshots** for PR
3. **Log performance metrics** in dev
4. **Add unit tests** (recommended)
5. **Integrate with existing auth** (if needed)
6. **Deploy backend endpoints** (if using sync)
7. **Hand off to Agent 3** for camera/workout features

---

## Quick Start Command

```bash
# Install dependencies (if needed)
npm install

# Start the app
npm start

# Or start specific platform
npm run android
npm run ios
npx expo start --web
```

---

## Support

If you encounter issues:

1. Check console logs for errors
2. Verify database initialized (`db.init()`)
3. Check TanStack Query DevTools (install if needed)
4. Review event logs (`eventService.getRecentEvents()`)
5. Check API network requests in DevTools

---

**Ready to test!** 🚀

