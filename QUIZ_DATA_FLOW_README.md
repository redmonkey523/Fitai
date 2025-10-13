# Goal Quiz Data Flow Documentation

## Overview

This document explains how user data flows from the Goal Quiz through the Profile/Goals system to the Progress Summary in our React Native fitness app.

## Architecture

```
┌─────────────────┐
│  GoalQuizScreen │
│   (User Input)  │
└────────┬────────┘
         │
         ▼
┌──────────────────────────────┐
│  useSaveQuiz Hook            │
│  (React Query Mutation)      │
└────────┬────────────────────┘
         │
         ├──────────────────┐
         ▼                  ▼
┌─────────────────┐  ┌────────────────────┐
│ PATCH            │  │ PUT                │
│ /users/me/profile│  │ /users/me/goals    │
└────────┬─────────┘  └────────┬───────────┘
         │                     │
         └──────┬──────────────┘
                ▼
        ┌──────────────────┐
        │  Backend Storage │
        │  (Database)      │
        └────────┬─────────┘
                 │
      ┌──────────┴──────────┐
      ▼                     ▼
┌─────────────────┐  ┌──────────────────┐
│ GET              │  │ GET              │
│ /users/me/profile│  │ /users/me/goals  │
└────────┬─────────┘  └────────┬─────────┘
         │                     │
         ├──────────────────┬──┘
         ▼                  ▼
┌─────────────────┐  ┌──────────────────┐
│ useProfile Hook  │  │ useGoals Hook    │
│ (React Query)    │  │ (React Query)    │
└────────┬─────────┘  └────────┬─────────┘
         │                     │
         ├──────────────────┬──┘
         ▼                  ▼
┌──────────────────────────────┐
│  PlanSummaryScreen           │
│  ProfileScreen               │
│  ProgressScreenEnhanced      │
└──────────────────────────────┘
```

## Data Flow Steps

### 1. User Completes Goal Quiz

**Location:** `src/screens/GoalQuizScreen.js`

The quiz collects:
- **Personal Data (Step 1):**
  - Sex (male/female)
  - Age (years)
  - Height (cm, converted from inches if needed)
  - Weight (kg, converted from lbs if needed)
  - Body Fat % (optional)

- **Lifestyle (Step 2):**
  - Activity Level (sedentary, light, moderate, active, very active)
  - Daily Steps (optional)
  - Sleep Quality

- **Goals (Step 3):**
  - Goal Type (cut, recomp, bulk)
  - Pace (kg/week)
  - Target Weight (optional)
  - Diet Style (balanced, high-protein, low-carb, plant-forward)

- **Calculations (Step 4):**
  - BMR (using Mifflin-St Jeor or Katch-McArdle)
  - TDEE (BMR × activity multiplier)
  - Daily Calorie Target
  - Macro Targets (Protein, Carbs, Fat)
  - Additional Targets (Water, Fiber, Steps)

### 2. Quiz Data Transformation

**Location:** `src/screens/GoalQuizScreen.js` → `handleSave()`

The quiz data is structured into two payloads:

```javascript
// Profile Data (Physical Attributes)
{
  sex: 'male',
  age: 25,
  height: 175,        // cm
  weight: 75,         // kg
  units: 'metric'
}

// Goals Data (Targets and Preferences)
{
  goals: {
    goalType: 'cut',
    activityLevel: 'moderate',
    dietStyle: 'balanced',
    pace: -0.5
  },
  targets: {
    dailyCalories: 2000,
    proteinTarget: 150,
    carbsTarget: 200,
    fatTarget: 60,
    hydrationCups: 8,
    dailySteps: 10000,
    fiberTarget: 25,
    targetWeight: 70,
    weeklyDelta: -0.5,
    weeklyWorkouts: 3
  }
}
```

### 3. API Mutation with React Query

**Location:** `src/hooks/useUserData.ts` → `useSaveQuiz()`

The mutation hook:
1. Calls `api.saveQuizResults({ profile, goals })`
2. Makes sequential API calls:
   - `PATCH /users/me/profile` - Updates physical attributes
   - `PUT /users/me/goals` - Updates goals and calculated targets
3. On success:
   - Invalidates React Query cache for `['profile']`, `['goals']`, `['summary']`
   - Shows success toast: "Plan saved and applied"
   - Navigates to `PlanSummary` screen
4. On error:
   - Shows error toast with friendly message
   - Error handling includes:
     - Network errors
     - Rate limiting (429) with retry
     - Invalid JSON responses
     - Server errors (5xx)

### 4. Backend Processing

**Location:** Backend API (not shown in frontend code)

Expected backend behavior:
- `PATCH /users/me/profile`:
  - Updates user's physical attributes
  - Validates data (age range, height/weight limits)
  - Returns updated profile

- `PUT /users/me/goals`:
  - Replaces existing goals
  - Stores calculated targets
  - Timestamps the update
  - Returns updated goals object

### 5. Data Retrieval

**Location:** `src/hooks/useUserData.ts`

Three main hooks fetch the data:

```typescript
// Fetch user profile
const { data: profile } = useProfile();
// Returns: { sex, age, height, weight, ... }

// Fetch user goals
const { data: goals } = useGoals();
// Returns: { goals: {...}, targets: {...}, createdAt: ... }

// Fetch progress summary
const { data: summary } = useSummary('7d');
// Returns: { weightTrend, weeklyActivity, nutritionCompliance, ... }
```

All hooks:
- Use React Query for caching and automatic refetching
- Have 5-minute stale time (2 minutes for summary)
- Automatically refetch on window focus and reconnect
- Handle loading and error states

### 6. Data Display

**Screens Using the Data:**

#### PlanSummaryScreen
**Location:** `src/screens/PlanSummaryScreen.js`

Displays:
- Daily calorie target
- Macro breakdown (Protein, Carbs, Fat)
- Additional targets (Water, Fiber, Steps)
- Goal information (type, pace, activity level, diet style)
- Auto-set badge with date

#### ProfileScreen (Settings)
**Location:** `src/screens/ProfileScreen.js`

Features:
- Pre-populated edit form with profile and goals
- Auto-set badge indicating values came from quiz
- Displays: "Auto-set by Goal Quiz (date) • Edit"
- Shows all macro targets (P/C/F) and fiber
- Users can manually edit any value

#### ProgressScreenEnhanced
**Location:** `src/screens/ProgressScreenEnhanced.js`

Charts:
- **Weight Trend**: Line chart showing weight over time with delta
- **Weekly Activity**: Bar chart showing workouts per day with streak
- **Nutrition Compliance**: Progress bars for Calories, Protein, Carbs, Fat vs targets
- **Hydration & Steps**: Mini cards showing current vs target

## Error Handling

### API Client (ApiService)
**Location:** `src/services/api.js`

Robust error handling includes:

1. **Content-Type Validation**
   - Checks response is JSON
   - Throws `BAD_JSON` error if parsing fails
   - Throws `NON_JSON` error for HTML error pages
   - Logs first 200 chars of response for debugging

2. **Rate Limiting (429)**
   - Detects 429 status or "too many requests" in body
   - Shows toast: "Server busy. Retrying..."
   - Automatic exponential backoff with jitter
   - Up to 3 retry attempts

3. **Network Errors**
   - Catches fetch failures
   - Retries with exponential backoff
   - Shows friendly toast messages
   - Doesn't crash the app

4. **Error-to-Toast Mapping**
   - Centralized `_mapErrorToMessage()` method
   - User-friendly messages for all error types
   - Automatic toast display on errors (unless `silent: true`)

### React Query Error Handling

All mutations show appropriate toasts:
- Success: "Plan saved and applied"
- Error: Specific message based on error type
- Never shows red error screen to user

## Unit Conversion

The app handles both imperial and metric units:

**Display:**
- User can toggle between units in the quiz
- Imperial: feet/inches, pounds
- Metric: cm, kg

**Storage:**
- Always stored in metric (cm, kg) on backend
- Conversion happens in the UI layer
- Formulas:
  - inches to cm: `inches * 2.54`
  - lbs to kg: `lbs * 0.453592`

**Pre-population:**
- When reopening quiz, values convert to selected unit system
- No data loss during conversions

## Cache Invalidation Strategy

When quiz is saved:
```javascript
queryClient.invalidateQueries({ queryKey: ['profile'] });
queryClient.invalidateQueries({ queryKey: ['goals'] });
queryClient.invalidateQueries({ queryKey: ['summary'] }); // All summary queries
```

This ensures:
- Profile screen shows updated data immediately
- Progress screen refetches with new targets
- Plan summary displays latest calculations
- No stale data displayed to user

## Best Practices

1. **Always Use Hooks:** Use `useProfile()`, `useGoals()`, `useSummary()` instead of direct API calls
2. **Let React Query Handle Caching:** Don't manually cache data
3. **Use Mutations for Writes:** Use `useSaveQuiz()`, `useUpdateProfile()`, etc.
4. **Handle Loading States:** All hooks provide `isLoading` flag
5. **Handle Errors Gracefully:** Show friendly messages, never crash
6. **Invalidate Related Queries:** When updating profile, invalidate goals and summary too

## Testing the Flow

### Manual Test Steps:

1. **Complete Quiz:**
   ```
   Navigate: Home → Goal Quiz
   Fill: All 4 steps with valid data
   Action: Click "Save & Continue"
   Expected: Navigate to Plan Summary, see calculated targets
   ```

2. **Verify Settings Auto-Fill:**
   ```
   Navigate: Profile → Edit Profile
   Expected: All fields pre-filled with quiz data
   Expected: "Auto-set by Goal Quiz (date)" badge visible
   ```

3. **Check Progress Tab:**
   ```
   Navigate: Progress tab
   Expected: Charts populated with data
   Expected: No empty states if data exists
   Expected: Targets match quiz results
   ```

4. **Test Error Handling:**
   ```
   Action: Disconnect network, try to save quiz
   Expected: Friendly error toast, no crash
   Expected: Can retry when network restored
   ```

5. **Verify Persistence:**
   ```
   Action: Close and reopen app
   Navigate: Profile → Edit Profile
   Expected: Quiz data still present
   Navigate: Plan Summary
   Expected: Targets still displayed correctly
   ```

## Common Issues and Solutions

### Issue: Profile not pre-populating in quiz
**Solution:** Check that `useProfile()` hook is fetching data. Verify network connectivity.

### Issue: Quiz save fails silently
**Solution:** Check browser console for API errors. Verify backend endpoints exist.

### Issue: Settings show empty fields
**Solution:** Verify `apiProfile` and `apiGoals` are not null. Check React Query devtools.

### Issue: Progress charts show "No data"
**Solution:** Verify `useSummary()` is returning data. Check if user has logged any activities.

### Issue: Unit conversions incorrect
**Solution:** Verify conversion formulas. Check that backend receives metric values.

## API Endpoints Reference

```
PATCH /users/me/profile
Body: { sex, age, height, weight, units }
Returns: { data: { ...updatedProfile } }

PUT /users/me/goals
Body: { goals: {...}, targets: {...} }
Returns: { data: { ...updatedGoals } }

GET /users/me/profile
Returns: { data: { sex, age, height, weight, ... } }

GET /users/me/goals
Returns: { data: { goals, targets, createdAt, ... } }

GET /users/me/summary?window=7d
Returns: { data: { weightTrend, weeklyActivity, nutritionCompliance, hydration, steps, ... } }
```

## Future Enhancements

1. **Offline Support:** Queue quiz saves when offline, sync when online
2. **Progress Tracking:** Allow users to see how targets change over time
3. **Goal Revisions:** Track history of goal changes
4. **Recommendations:** AI-powered suggestions based on progress
5. **Social Sharing:** Share progress with friends
6. **Export Data:** Download goals and progress as PDF

## Questions?

For implementation questions, refer to:
- API Client: `src/services/api.js`
- Hooks: `src/hooks/useUserData.ts`
- Screens: `src/screens/GoalQuizScreen.js`, `src/screens/PlanSummaryScreen.js`, `src/screens/ProfileScreen.js`, `src/screens/ProgressScreenEnhanced.js`

