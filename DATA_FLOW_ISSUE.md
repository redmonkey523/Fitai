# Data Flow Issue: Goal Quiz → Profile Edit

## Problem
Information saved in the Goal Quiz screen doesn't appear in the Profile edit page.

## Root Cause: Field Name Mismatch

### 1. GoalQuizScreen **SAVES** (lines 238-249):
```javascript
targets: {
  dailyCalories: results.calorieTarget,     // ← "dailyCalories"
  proteinTarget: results.proteinG,          // ← "proteinTarget"
  carbsTarget: results.carbsG,              // ← "carbsTarget"
  fatTarget: results.fatG,                  // ← "fatTarget"
  hydrationCups: Math.round(results.waterMl / 240),
  dailySteps: parseInt(dailySteps) || 10000,
  fiberTarget: results.fiberG,
  targetWeight: targetKg,
  weeklyDelta: pace,
  weeklyWorkouts: user?.goals?.weeklyWorkouts || 3
}
```

### 2. Backend **STORES** (lines 569-590 in users.js):
The backend computes targets as:
```javascript
const targets = computeTargets(profile, goals);
// Returns: { calories, protein_g, carbs_g, fat_g, ... }
```

Then merges with frontend data:
```javascript
if (req.body.targets) {
  user.targets = {
    ...targets,            // Backend computed: calories, protein_g, carbs_g
    ...req.body.targets,   // Frontend sent: dailyCalories, proteinTarget, carbsTarget
    // Keeps computed values as primary
    calories: targets.calories,      // Overwrites dailyCalories!
    protein_g: targets.protein_g,    // Overwrites proteinTarget!
    carbs_g: targets.carbs_g,        // Overwrites carbsTarget!
    fat_g: targets.fat_g,            // Overwrites fatTarget!
  };
}
```

**Result**: The frontend fields get saved BUT then overwritten by backend computed values!

### 3. ProfileScreen **READS** (lines 84-93):
```javascript
const goals = apiGoals?.targets || user?.goals;

dailyCalorieGoal: goals?.dailyCalories?.toString() || '2000',  // ← Looking for "dailyCalories"
proteinGoal: goals?.proteinTarget?.toString() || '',           // ← Looking for "proteinTarget"
carbsGoal: goals?.carbsTarget?.toString() || '',              // ← Looking for "carbsTarget"
fatGoal: goals?.fatTarget?.toString() || '',                  // ← Looking for "fatTarget"
```

But the backend returns:
```javascript
{
  calories: 2000,      // NOT "dailyCalories"
  protein_g: 150,      // NOT "proteinTarget"
  carbs_g: 200,        // NOT "carbsTarget"
  fat_g: 65,           // NOT "fatTarget"
}
```

### 4. The Mismatch:
| Frontend Saves | Backend Stores | Frontend Reads | Result |
|---|---|---|---|
| `dailyCalories` | `calories` | `dailyCalories` | ❌ Not found! |
| `proteinTarget` | `protein_g` | `proteinTarget` | ❌ Not found! |
| `carbsTarget` | `carbs_g` | `carbsTarget` | ❌ Not found! |
| `fatTarget` | `fat_g` | `fatTarget` | ❌ Not found! |
| `hydrationCups` | `water_cups` | `hydrationCups` | ❌ Mismatch! |
| `dailySteps` | ❌ Not stored | `dailySteps` | ❌ Not found! |
| `targetWeight` | ✅ Stored as-is | `targetWeight` | ✅ Works! |
| `weeklyWorkouts` | ❌ Not stored | `weeklyWorkouts` | ❌ Not found! |

## Solution
Fix the backend `PUT /api/users/me/goals` to store frontend field names correctly.


