# Call Stack Overflow Error - Fixed ✅

## Problem
```
Maximum call stack size exceeded
```

This error happens when functions are called infinitely in a loop.

---

## Root Cause

### The Infinite Loop Chain:

1. **Screen focuses** (e.g., HomeScreen, ProfileScreen, ProgressTrackingScreen)
2. **`useFocusEffect`** hook runs
3. Calls **`refreshUser()`**
4. **User state updates**
5. **AuthContext re-renders**
6. **`refreshUser` function reference changes** ⚠️
7. **`useFocusEffect` detects dependency change**
8. **Runs again** → Back to step 3
9. **INFINITE LOOP!** 💥

---

## The Fix

### ✅ **Wrapped `refreshUser` in `useCallback`**

**File:** `src/contexts/AuthContext.js`

**Before:**
```javascript
const refreshUser = async () => {
  // ... function code ...
};
```

**Problem:** Every time `AuthProvider` re-renders, `refreshUser` gets a NEW function reference, even though the code is the same.

**After:**
```javascript
const refreshUser = useCallback(async () => {
  // ... same function code ...
}, [token]);
```

**Solution:** `useCallback` memoizes the function. It only creates a new reference when `token` changes, not on every render.

---

## How `useCallback` Prevents Infinite Loops

### Without `useCallback`:
```
Render 1: refreshUser = func_instance_A
Render 2: refreshUser = func_instance_B  ← NEW REFERENCE!
Render 3: refreshUser = func_instance_C  ← NEW REFERENCE!
```

Every render = new function = dependency changed = effect reruns = infinite loop

### With `useCallback`:
```
Render 1: refreshUser = func_instance_A
Render 2: refreshUser = func_instance_A  ← SAME REFERENCE ✅
Render 3: refreshUser = func_instance_A  ← SAME REFERENCE ✅
```

Same reference = dependency unchanged = effect doesn't rerun = NO LOOP ✅

---

## Where This Was Causing Problems

### 1. **HomeScreen.js** ✅
```javascript
useFocusEffect(
  useCallback(() => {
    if (refreshUser) {
      refreshUser(); // ← Was causing infinite loop
    }
  }, [refreshUser]) // ← Dependency was changing every render
);
```

### 2. **ProfileScreen.js** ✅
```javascript
useFocusEffect(
  useCallback(() => {
    const refreshUserData = async () => {
      if (token && refreshUser) {
        await refreshUser(); // ← Was causing infinite loop
      }
    };
    refreshUserData();
  }, [token, refreshUser]) // ← refreshUser was changing every render
);
```

### 3. **ProgressTrackingScreen.js** ✅
```javascript
useFocusEffect(
  useCallback(() => {
    if (refreshUser) {
      refreshUser(); // ← Was causing infinite loop
    }
    refetch();
  }, [refreshUser, refetch]) // ← refreshUser was changing every render
);
```

---

## Testing the Fix

### 1. **Start the app**
```bash
# In Expo terminal, press 'r' to reload
r
```

### 2. **Navigate between tabs**
- Home → Profile → Progress → Home
- Do this 5-10 times quickly

**Expected:**
- ✅ No call stack errors
- ✅ Smooth navigation
- ✅ Data refreshes once per focus (not infinite times)

### 3. **Check console logs**
**Good (Fixed):**
```
🏠 Home screen focused, refreshing user data...
✅ User data refreshed
[Only once per focus]
```

**Bad (Before fix):**
```
🏠 Home screen focused, refreshing user data...
🏠 Home screen focused, refreshing user data...
🏠 Home screen focused, refreshing user data...
🏠 Home screen focused, refreshing user data...
[Repeats infinitely] ❌
ERROR: Maximum call stack size exceeded
```

### 4. **Complete Goal Quiz**
- Go to Progress tab
- Tap "Set Goals"
- Complete the quiz
- Tap "Save Goals"

**Expected:**
- ✅ Data saves
- ✅ Returns to Progress tab
- ✅ Shows updated goals
- ✅ No infinite refresh loops

---

## Why This Pattern is Important

### React Hook Dependency Rules

1. **Functions in dependencies MUST be stable**
   - Use `useCallback` to memoize functions
   - Otherwise, every render creates a new function reference

2. **State setters are already stable**
   - `setUser`, `setToken` from `useState` don't need `useCallback`
   - React guarantees they never change

3. **Custom functions need memoization**
   - `refreshUser`, `updateProfile`, etc. need `useCallback`
   - Especially when used as dependencies in other hooks

---

## Other Functions That Might Need `useCallback`

If you see similar infinite loop issues with these functions, wrap them too:

**In `AuthContext.js`:**
- `handleGoogleSignInPress` (if used in dependencies)
- `handleEmailSignUpPress` (if used in dependencies)
- `handleEmailLoginPress` (if used in dependencies)
- `handleLogout` (if used in dependencies)
- `updateProfile` (if used in dependencies)

**Current status:** Only `refreshUser` is used in `useFocusEffect` dependencies, so it's the only one that needed fixing.

---

## Summary

**What Was Wrong:**
- `refreshUser` wasn't memoized with `useCallback`
- Created new function reference on every render
- Caused infinite loops in `useFocusEffect` hooks

**What I Fixed:**
- ✅ Wrapped `refreshUser` in `useCallback` with `[token]` dependency
- ✅ Function reference now stable between renders
- ✅ No more infinite loops

**What You Should See:**
- ✅ No "Maximum call stack size exceeded" errors
- ✅ Smooth navigation between tabs
- ✅ Data refreshes once per screen focus (not infinite times)
- ✅ Goal Quiz saves and updates correctly

---

## Quick Reference

### Bad Pattern (Causes Infinite Loop):
```javascript
// In Context
const someFunction = async () => {
  // ...
};

// In Component
useFocusEffect(
  useCallback(() => {
    someFunction(); // ← Will cause infinite loop!
  }, [someFunction])
);
```

### Good Pattern (Stable Reference):
```javascript
// In Context
const someFunction = useCallback(async () => {
  // ...
}, [dependency1, dependency2]);

// In Component
useFocusEffect(
  useCallback(() => {
    someFunction(); // ← Safe! ✅
  }, [someFunction])
);
```

---

## Files Changed

### ✅ `src/contexts/AuthContext.js`
- Added `useCallback` to imports
- Wrapped `refreshUser` in `useCallback` with `[token]` dependency

### ✅ No changes needed to screen files
- `HomeScreen.js`, `ProfileScreen.js`, `ProgressTrackingScreen.js`
- These were already correct; the bug was in `AuthContext`

---

**The app should now work without call stack errors!** 🎉

