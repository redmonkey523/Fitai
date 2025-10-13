# 🧪 Agent 5 Testing Guide

This guide outlines the manual testing steps required to verify all error fixes are working on each platform.

---

## ✅ Quick Start

### Run the App
```bash
# Clear cache first
npm start -- --clear

# For iOS
expo run:ios

# For Android  
expo run:android

# For Web
expo start --web
```

---

## 🎯 Critical Test Flows

### 1. Navigation & Error Boundaries (5 min)
**Goal:** Verify no console errors during normal navigation

**Steps:**
1. Open app (should load without errors)
2. Navigate through all 5 tabs: Home → Discover → Workouts → Progress → Creator
3. Navigate back to Home

**Expected:**
- ✅ No red console errors
- ✅ No "flushPendingEffect" warnings
- ✅ Smooth transitions
- ✅ Each screen loads properly

**If errors appear:**
- Check if ErrorBoundary displays friendly UI with Retry button
- In dev mode, check if error details show in console

---

### 2. Discover Screen (3 min)
**Goal:** Test data loading and error states

**Steps:**
1. Open Discover tab
2. Wait for trending to load
3. Pull to refresh
4. Switch between Trending/Coaches/Programs tabs
5. Scroll through lists

**Expected:**
- ✅ Skeleton loaders appear briefly
- ✅ Data loads without errors
- ✅ Pull-to-refresh works
- ✅ Tab switching is smooth
- ✅ No setState-after-unmount warnings

---

### 3. Nutrition & Meal Logging (3 min)
**Goal:** Test async operations and state management

**Steps:**
1. Open Home tab (or Nutrition via hidden tab)
2. Tap "Add Meal" button
3. Search for a food (type "chicken")
4. Select a food from results
5. Confirm meal addition
6. View updated day totals

**Expected:**
- ✅ Modal opens smoothly
- ✅ Search debouncing works (no rapid API calls)
- ✅ Food selection works
- ✅ Totals update correctly
- ✅ No unhandled promise rejections
- ✅ Modal closes and returns to same scroll position

---

### 4. Scan Permission Flow (2 min)
**Goal:** Verify camera permission prompt and error handling

**Steps:**
1. Navigate to a screen with Scan button (or manually navigate to /scan)
2. Tap Scan button
3. Observe permission prompt (native platforms)
4. Grant or deny permission

**Expected:**
- ✅ Permission prompt appears (iOS/Android)
- ✅ On grant: Camera view opens with scan overlay
- ✅ On deny: Friendly error message + manual barcode entry form
- ✅ On web: Manual barcode entry form (camera not supported)
- ✅ No crashes if permission denied
- ✅ Analytics events fired: `scan_permission_granted` or `scan_failure`

---

### 5. Progress & Charts (2 min)
**Goal:** Test data visualization and async loading

**Steps:**
1. Open Progress tab
2. If no data: Set a goal (weight/steps/calories)
3. If data exists: View charts
4. Try adding a progress photo (if feature available)

**Expected:**
- ✅ Charts render without errors
- ✅ Goal setting works
- ✅ No console errors during chart animations
- ✅ Empty states show friendly UI

---

### 6. Workouts (2 min)
**Goal:** Test exercise selection and workout flow

**Steps:**
1. Open Workouts tab
2. Browse routines or exercises
3. Tap an exercise to view details
4. If "Start Workout" available, tap it

**Expected:**
- ✅ Exercise lists load
- ✅ Detail views open
- ✅ No errors when starting workout
- ✅ Navigation returns properly

---

### 7. Creator & Uploads (3 min)
**Goal:** Test file upload and temp URI handling

**Steps:**
1. Open Creator tab
2. If upload button exists, attempt to upload a photo/video
3. If modal opens, close it and verify return to Creator

**Expected:**
- ✅ Upload picker opens
- ✅ File selection works
- ✅ No "file does not exist" errors
- ✅ Modal closes and returns to same screen/scroll position
- ✅ `persistBeforeUpload()` utility prevents temp URI issues

---

## 🛡️ Dev Console Hardening Tests

### Test Error Escalation (Dev Mode Only)
**Steps:**
1. In dev mode, intentionally trigger an error (e.g., navigate to invalid route)
2. Observe console and UI

**Expected:**
- ✅ Console.error appears in dev console
- ✅ Error escalates to ErrorBoundary
- ✅ Friendly error UI appears with Retry button
- ✅ Retry button works

### Test Unhandled Rejection
**Steps:**
1. Open browser/dev tools console
2. Manually trigger: `Promise.reject(new Error('Test'))`
3. Observe console

**Expected:**
- ✅ `UNHANDLED_REJECTION` logged in console
- ✅ Dev console hardening captures it

---

## 📊 Success Criteria

### Must Pass ✅
- [ ] All 5 tabs navigate without red console errors
- [ ] Discover loads trending/coaches/programs without errors
- [ ] AddMeal sheet opens, searches, and logs without errors
- [ ] Scan button triggers permission prompt
- [ ] Progress loads charts/goals without errors
- [ ] Workouts load and detail views open
- [ ] Creator uploads work (if feature available)
- [ ] No `flushPendingEffect` or `setState after unmount` warnings
- [ ] ErrorBoundary catches errors and shows Retry button
- [ ] Validation script passes: `npm run validate`

### Should Pass ⚠️
- [ ] No empty catch blocks in core flows
- [ ] Lint errors < 20: `npm run lint`
- [ ] Upload temp URIs don't cause "file does not exist"
- [ ] Modal close returns to correct screen

### Nice to Have ✨
- [ ] Smooth animations (no jank)
- [ ] Fast initial load (< 2s)
- [ ] No memory leaks after 5min session

---

## 🐛 If You Find Issues

### Reporting Template
```markdown
**Issue:** [Brief description]
**Platform:** iOS / Android / Web
**Steps to Reproduce:**
1. ...
2. ...

**Expected:** ...
**Actual:** ...
**Console Errors:** [Paste relevant errors]
**Screenshots:** [If applicable]
```

### Common Issues & Fixes

#### "flushPendingEffect" still appearing
- **Cause:** Another useEffect without mounted guard
- **Fix:** Add `let mounted = true` pattern to the hook

#### Red console errors during navigation
- **Cause:** Missing error boundary or unhandled async error
- **Fix:** Wrap component in ErrorBoundary or add try/catch

#### Scan button does nothing
- **Cause:** Permission already denied or camera module failed to load
- **Fix:** Check console for permission denial; try manual barcode entry

#### Upload shows "file does not exist"
- **Cause:** Temp URI not persisted before upload
- **Fix:** Ensure `persistBeforeUpload()` called before API upload

---

## 📈 Performance Testing (Optional)

### React DevTools Profiler
1. Install React DevTools browser extension
2. Open Profiler tab
3. Record a session while navigating
4. Check for:
   - Excessive re-renders (> 5 for same component)
   - Long render times (> 100ms)
   - Memory leaks (increasing component count)

### Network Throttling
1. Enable "Slow 3G" in browser DevTools
2. Test Discover and AddMeal flows
3. Verify:
   - Loading states appear
   - Error states work on timeout
   - Retry buttons functional

---

## ✅ Sign-Off Checklist

Once all tests pass:
- [ ] Manual testing completed on target platforms
- [ ] No critical errors found
- [ ] Performance acceptable
- [ ] Ready for production deployment

**Next Steps:**
1. Run `npm run lint:fix` to clean up warnings
2. Commit changes: `git add . && git commit -m "fix: Agent 5 error sweeping (ESLint, mounted guards, empty catches)"`
3. Deploy! 🚀

---

**Questions?** Refer to `DEBUG_REPORT.md` for detailed fix explanations.

