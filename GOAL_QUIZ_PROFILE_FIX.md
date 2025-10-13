# Goal Quiz → Profile Data Flow Fix ✅

## Problem
Data saved in the **Goal Quiz screen** wasn't appearing in the **Profile edit page**.

## Root Cause
**Field name mismatch** between:
- What the frontend **saved**: `dailyCalories`, `proteinTarget`, etc.
- What the backend **stored**: `calories`, `protein_g`, etc.
- What the frontend **read**: `dailyCalories`, `proteinTarget`, etc.

The backend was computing targets using its own field names and **overwriting** the frontend's field names!

## Solution Applied ✅

### 1. Fixed `PUT /api/users/me/goals` (lines 576-600)
Now stores **both** backend AND frontend field formats:

```javascript
user.targets = {
  ...targets,
  ...req.body.targets,
  // Backend format (for computation)
  calories: targets.calories,
  protein_g: targets.protein_g,
  carbs_g: targets.carbs_g,
  fat_g: targets.fat_g,
  // Frontend format (for display) ✅ NEW
  dailyCalories: req.body.targets.dailyCalories || targets.calories,
  proteinTarget: req.body.targets.proteinTarget || targets.protein_g,
  carbsTarget: req.body.targets.carbsTarget || targets.carbs_g,
  fatTarget: req.body.targets.fatTarget || targets.fat_g,
  fiberTarget: req.body.targets.fiberTarget || targets.fiber_g,
  hydrationCups: req.body.targets.hydrationCups || targets.water_cups,
  dailySteps: req.body.targets.dailySteps || 10000,
  targetWeight: req.body.targets.targetWeight || null,
  weeklyWorkouts: req.body.targets.weeklyWorkouts || 3,
  weeklyDelta: req.body.targets.weeklyDelta || goals.pace_kg_per_week
};
```

### 2. Fixed `GET /api/users/me/goals` (lines 388-402)
Now returns **both** formats, ensuring compatibility:

```javascript
const targets = {
  ...baseTargets,
  // Ensure frontend-compatible field names ✅ NEW
  dailyCalories: baseTargets.dailyCalories || baseTargets.calories,
  proteinTarget: baseTargets.proteinTarget || baseTargets.protein_g,
  carbsTarget: baseTargets.carbsTarget || baseTargets.carbs_g,
  fatTarget: baseTargets.fatTarget || baseTargets.fat_g,
  fiberTarget: baseTargets.fiberTarget || baseTargets.fiber_g,
  hydrationCups: baseTargets.hydrationCups || baseTargets.water_cups,
  dailySteps: baseTargets.dailySteps || 10000,
  targetWeight: baseTargets.targetWeight || null,
  weeklyWorkouts: baseTargets.weeklyWorkouts || 3,
  weeklyDelta: baseTargets.weeklyDelta || goals.pace_kg_per_week
};
```

## What This Fixes

| Field | Before | After |
|-------|--------|-------|
| Daily Calories | ❌ Not synced | ✅ Shows in Profile |
| Protein Target | ❌ Not synced | ✅ Shows in Profile |
| Carbs Target | ❌ Not synced | ✅ Shows in Profile |
| Fat Target | ❌ Not synced | ✅ Shows in Profile |
| Fiber Target | ❌ Not synced | ✅ Shows in Profile |
| Hydration Cups | ❌ Not synced | ✅ Shows in Profile |
| Daily Steps | ❌ Not synced | ✅ Shows in Profile |
| Target Weight | ✅ Already worked | ✅ Still works |
| Weekly Workouts | ❌ Not synced | ✅ Shows in Profile |

## How to Test

### Step 1: Complete the Goal Quiz
1. Go to Profile → "Set Goals" or navigate to Goal Quiz
2. Fill in your info:
   - Age, height, weight
   - Goal type (lose/maintain/gain)
   - Activity level
   - Pace (e.g., 0.5 kg/week)
3. Click **"Save & Apply"**

### Step 2: Check Profile Edit
1. Go to **Profile tab**
2. Click **"Edit Profile"** button
3. Scroll to **"Fitness Goals"** section

### Expected Result ✅
You should now see:
- ✅ Daily Calorie Goal: (the value from quiz, e.g., 1800)
- ✅ Protein Goal: (calculated value, e.g., 150g)
- ✅ Carbs Goal: (calculated value, e.g., 180g)
- ✅ Fat Goal: (calculated value, e.g., 50g)
- ✅ Fiber Goal: (calculated value, e.g., 30g)
- ✅ Hydration Goal: (calculated value, e.g., 10 cups)
- ✅ Steps Goal: (your goal, e.g., 10,000)
- ✅ Target Weight: (if you set one, e.g., 70kg)
- ✅ Weekly Workout Goal: (e.g., 3-4 times)

### Before (Broken) ❌
All fields would show default values like:
- Daily Calorie Goal: 2000 ← default, not your calculated value
- Protein Goal: (empty) ← not saved
- Carbs Goal: (empty) ← not saved

### After (Fixed) ✅
All fields show **your actual quiz results**!

## Restart Required
**Yes!** Restart your backend server to apply the fix:

```bash
# Stop the backend (Ctrl+C in the backend terminal)
# Then restart:
cd backend
npm start
```

## For Existing Users
If you already saved quiz data before this fix:
1. Go to Goal Quiz again
2. Click **"Save & Apply"** to re-save with the new format
3. Now check Profile Edit → should show your data!

## Technical Details

### Backend Changes
- **File**: `backend/routes/users.js`
- **Lines Changed**: 
  - 576-600 (PUT endpoint - save logic)
  - 388-402 (GET endpoint - read logic)

### Database Schema
No schema changes needed! The fix is backward compatible:
- Old data format still works
- New data adds extra fields
- Frontend reads from either format

### Field Mapping Table

| Frontend Field | Backend Computed | What ProfileScreen Reads |
|---|---|---|
| `dailyCalories` | `calories` | `dailyCalories` ✅ |
| `proteinTarget` | `protein_g` | `proteinTarget` ✅ |
| `carbsTarget` | `carbs_g` | `carbsTarget` ✅ |
| `fatTarget` | `fat_g` | `fatTarget` ✅ |
| `fiberTarget` | `fiber_g` | `fiberTarget` ✅ |
| `hydrationCups` | `water_cups` | `hydrationCups` ✅ |
| `dailySteps` | (none) | `dailySteps` ✅ |
| `targetWeight` | (none) | `targetWeight` ✅ |
| `weeklyWorkouts` | (none) | `weeklyWorkouts` ✅ |
| `weeklyDelta` | `pace_kg_per_week` | (not used in Profile) |

## Why This Happened
The backend was originally designed to use **backend field names** (`calories`, `protein_g`) for internal computation, while the frontend used **user-friendly names** (`dailyCalories`, `proteinTarget`). The two systems weren't properly synchronized.

**This fix ensures both formats coexist**, allowing:
- Backend to compute using its format
- Frontend to read/write using its format
- No data loss during conversion

---

## Summary
✅ **Backend now stores both formats**  
✅ **Backend returns both formats**  
✅ **Profile Edit now shows Quiz data**  
✅ **Backward compatible**  
✅ **No database migration needed**  

**Just restart your backend and test!** 🚀


