# Issue Tracker - Post-Validation QA

**Date:** October 8, 2025  
**Source:** Manual QA walkthrough  
**Reported By:** User  
**Assigned To:** Agent 4 - Validator/Finisher

---

## 🔴 CRITICAL (Blockers - P0)

| ID | Issue | Area | Owner | Status | Acceptance Test |
|----|-------|------|-------|--------|-----------------|
| **C1** | Scans don't work anywhere | Scan/Camera | Agent 3 | 🔴 **OPEN** | Tap "Scan" → Permission prompt → Camera view → Scan barcode → Returns code to Nutrition |
| **C2** | Console error spam (flushPendingEffect) | React/Navigation | Agent 4 | 🔴 **OPEN** | Open app → Navigate 3+ screens → Console has <5 errors total (no floods) |
| **C3** | Settings button unresponsive | Home/Profile | Agent 2 | 🔴 **OPEN** | Tap top-right Settings icon → Opens settings screen |
| **C4** | Workout items unresponsive | Workouts | Agent 3 | 🔴 **OPEN** | Tap "Exercise 2" → Opens exercise detail OR starts edit mode; "Attach video" works |
| **C5** | Upload pops back to root | Navigation | Agent 3 | 🔴 **OPEN** | Open upload modal → Cancel → Returns to same screen + scroll (±100px) |
| **C6** | Plans tab still visible | Navigation | Agent 3 | 🔴 **OPEN** | Bottom tabs show exactly 5: Home, Discover, Workouts, Progress, Creator (no Plans) |
| **C7** | Missing: "My Lunch in One Day" page | Nutrition | Agent 2 | 🔴 **OPEN** | New route exists; shows day's meals in shareable format with deep content |

---

## 🟠 HIGH (Must-Fix - P1)

| ID | Issue | Area | Owner | Status | Acceptance Test |
|----|-------|------|-------|--------|-----------------|
| **H1** | Progress shows "Body Weight" prematurely | Progress | Agent 2 | 🟠 **OPEN** | Empty state shown until user adds weight data; no empty widgets |
| **H2** | Creator page wrong layout | Creator | Agent 2 | 🟠 **OPEN** | Creator page shows Creator Studio layout (owner tools), not follower view |
| **H3** | Specific page causes console floods | Unknown | Agent 4 | 🟠 **OPEN** | Identify page → Fix errors → Open/close 5x → Clean console |
| **H4** | Settings/Profile inconsistency | Profile | Agent 2 | 🟠 **OPEN** | Settings button works; Profile editor works; both accessible |

---

## 🟡 MEDIUM (Should-Fix - P2)

| ID | Issue | Area | Owner | Status | Acceptance Test |
|----|-------|------|-------|--------|-----------------|
| **M1** | Trending by region unclear | Discover | Agent 1 | 🟡 **OPEN** | Select region → Results make sense; empty state if no data; error state friendly |
| **M2** | UI polish needed | Multiple | Agent 4 | 🟡 **OPEN** | Visual cleanup: spacing, labels alignment, consistent styling |
| **M3** | Hydration placement | Nutrition/Home | Agent 2 | 🟡 **OPEN** | Verify Hydration accessible in both Home (summary) and Nutrition (detail) |

---

## 🧰 TECHNICAL ERRORS (Debug)

| Error | Frequency | Impact | Root Cause | Status |
|-------|-----------|--------|------------|--------|
| `flushPendingEffect` / `flushSpawnedEffect` | High | App destabilizes | React scheduler/effects | 🔴 Investigating |
| Uncaught runtime exceptions on screen open | Medium | Must reload | Unknown page/component | 🟠 Investigating |
| Navigation resets to root after modal close | Medium | Lost context | Navigation stack issue | 🔴 Known (C5) |
| Failed to push notification token | Low | No push | Token registration | 🟡 Prior run |
| Camera image does not exist | Low (fixed?) | Upload fails | Fixed by Agent 3 | ✅ Fixed |
| Bundle 500 MIME type error | Low | Dev server | Metro config | 🟡 Prior run |

---

## PRIORITY MATRIX

```
┌─────────────────────────────────────────────┐
│ CRITICAL (P0) - Fix Immediately             │
│ C1, C2, C3, C4, C5, C6, C7                  │
│                                             │
│ HIGH (P1) - Fix Before Launch               │
│ H1, H2, H3, H4                              │
│                                             │
│ MEDIUM (P2) - Fix Post-Launch               │
│ M1, M2, M3                                  │
└─────────────────────────────────────────────┘
```

---

## DETAILED REPRODUCTION STEPS

### C1 - Scans Don't Work
1. Navigate to any screen with "Scan" button (e.g., Nutrition → Barcode icon)
2. Tap "Scan" button
3. **Expected:** Permission prompt → Camera view → Scan barcode → Returns code
4. **Actual:** Nothing happens; no permission flow; no barcode result

### C2 - Console Error Spam
1. Open app in dev mode
2. Navigate between screens 3-5 times
3. **Expected:** Clean console (maybe 1-2 warnings)
4. **Actual:** Flood of `flushPendingEffect` / `flushSpawnedEffect` errors; long stack traces
5. **Impact:** App destabilizes; sometimes kicks to root; must exit/reopen

### C3 - Settings Button Unresponsive
1. Open app
2. Look for Settings icon (top-right)
3. Tap Settings icon
4. **Expected:** Opens settings screen
5. **Actual:** Nothing happens

### C4 - Workout Items Unresponsive
1. Navigate to Workouts tab
2. Tap "Exercise 2" or "Exercise 3"
3. **Expected:** Opens exercise detail or edit mode
4. **Actual:** Nothing happens
5. Also: "Attach video" button doesn't work

### C5 - Upload Pops Back to Root
1. Navigate to any screen with scroll (e.g., Discover)
2. Scroll down ~50%
3. Open upload modal (e.g., "Add Photo")
4. Cancel or complete upload
5. **Expected:** Returns to Discover at same scroll position (±100px)
6. **Actual:** App jumps back to root/home

### C6 - Plans Tab Still Present
1. Open app
2. Look at bottom tab bar
3. **Expected:** 5 tabs: Home, Discover, Workouts, Progress, Creator
4. **Actual:** "Plans" tab still visible (should be removed per spec)

### C7 - Missing "My Lunch in One Day" Page
1. **Expected:** New route/page showcasing day's lunch in deep, shareable format
2. **Actual:** Doesn't exist yet
3. **Requirements:** High-engagement page; polished UI; deep content; shareable

### H1 - Body Weight Shows Prematurely
1. Fresh install (no data)
2. Navigate to Progress tab
3. **Expected:** Empty state with CTAs ("Add your first workout", "Set goals")
4. **Actual:** "Body Weight (basic)" widget shows (confusing/premature)

### H2 - Creator Page Wrong Layout
1. Navigate to Creator tab
2. **Expected:** Creator Studio layout (owner tools: "New Program", "Analytics", "Drafts")
3. **Actual:** Looks like follower view; "Media drafts" label confusing; layout wrong

### H3 - Page Causes Console Floods
1. Open specific page (user didn't specify which)
2. **Actual:** Burst of console errors; must back out/in
3. **Action:** Identify page → Fix errors

### H4 - Settings/Profile Inconsistency
1. Profile editor works (pricing, social links)
2. But Settings icon (top-right) doesn't respond
3. **Expected:** Both work and are accessible

### M1 - Trending by Region Unclear
1. Navigate to Discover → Trending tab
2. Switch region (e.g., "Trending in US" → "Trending in EU")
3. **Expected:** Results make sense; empty state if no data; error state friendly
4. **Actual:** "Trending in other countries" unclear/odd results

---

## FIX PLAN (Priority Order)

### Sprint 1 (P0 - Critical)
1. **C6** - Remove Plans tab (easiest fix)
2. **C1** - Fix scan button (wire up navigation)
3. **C3** - Wire up Settings button
4. **C4** - Fix workout item tap handlers
5. **C5** - Fix navigation scroll restoration
6. **C2** - Debug React effect errors
7. **C7** - Create "My Lunch in One Day" page

### Sprint 2 (P1 - High)
1. **H1** - Hide Body Weight until data exists
2. **H2** - Fix Creator page layout
3. **H3** - Debug page causing errors
4. **H4** - Fix Settings/Profile consistency

### Sprint 3 (P2 - Medium)
1. **M1** - Improve Trending region UX
2. **M2** - UI polish pass
3. **M3** - Verify Hydration placement

---

## ACCEPTANCE CRITERIA (Summary)

### For Each Critical Issue:
- ✅ Manual test passes (reproduction steps work as expected)
- ✅ No new console errors introduced
- ✅ TypeScript compiles (`npm run check:types`)
- ✅ Validation script passes (`npm run validate`)
- ✅ Linter passes (`npm run lint`)
- ✅ Video/screenshot evidence provided

### For Console Cleanup (C2):
- ✅ Open app → Navigate 10+ screens → Console has <10 errors total
- ✅ No `flushPendingEffect` / `flushSpawnedEffect` errors
- ✅ No unhandled promise rejections
- ✅ App doesn't kick to root spontaneously

### For Upload/Nav (C5):
- ✅ Open modal from any screen with scroll
- ✅ Close modal (cancel or complete)
- ✅ Returns to same screen at same scroll position (±100px tolerance)
- ✅ Tested on: Discover, Workouts, Progress, Creator

---

## NOTES

- **C6** (Plans tab): Static validation already checks for this; may be a false positive or visual bug
- **C2** (Console errors): High priority; investigate React 19 + React Navigation + Expo Router interactions
- **C5** (Navigation): Agent 3 claimed scroll restore works; needs re-test or fix
- **C7** (Lunch page): New feature request; scope TBD with user

---

**Last Updated:** October 8, 2025  
**Next Review:** After Sprint 1 fixes

