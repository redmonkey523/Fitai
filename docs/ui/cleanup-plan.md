# De-Duplication & Removal Plan

**Project:** FitAI - UI Cleanup  
**Date:** October 7, 2025  
**Goal:** Remove 6 duplicate features → Reduce from 27 to 21 screens

---

## 1. Duplicate Screens

### 1.1 Plans vs Workouts

**Current State:**
- `PlansScreen.js` - Lists fitness plans with minimal UI
- `WorkoutLibraryScreen.js` - Lists workouts with rich UI (search, filters, categories)

**Problem:**
- Users don't understand difference between "Plans" and "Workouts"
- Both show similar content (workout programs)
- PlansScreen has ~40 lines of code, minimal UI
- Causes navigation confusion (8 tabs currently)

**Decision:** ❌ **REMOVE PlansScreen** → ✅ **MERGE into WorkoutLibraryScreen**

**Migration Steps:**

1. **Update WorkoutLibraryScreen.js:**
   - Add "Plans" category filter chip
   - Fetch both workouts and plans from API:
     ```javascript
     const [workoutsRes, plansRes] = await Promise.all([
       api.getWorkouts(),
       api.getPlans()
     ]);
     const allItems = [...workoutsRes.data, ...plansRes.data.map(p => ({ ...p, _isFromPlans: true }))];
     ```
   - Add plan card styling (show duration in weeks instead of minutes)

2. **Update TabNavigator.js:**
   - Remove `PlansScreen` from tabs (line 91-98)
   - Rename tab from "Workouts" to "Library" or keep "Workouts"
   - Remove hidden route for PlanDetail (will navigate from WorkoutLibrary)

3. **Update navigation calls:**
   - Search codebase for `navigation.navigate('Plans')` → replace with `navigation.navigate('Workouts', { tab: 'plans' })`
   - Update HomeScreen quick links to point to Workouts

4. **Delete files:**
   - ❌ Delete `src/screens/PlansScreen.js`

**Acceptance Tests:**
- [ ] WorkoutLibraryScreen shows both workouts and plans
- [ ] Filtering by "Plans" shows only plans
- [ ] Tapping a plan navigates to PlanDetail
- [ ] No broken navigation links
- [ ] Tab bar shows 7 tabs (down from 8)

---

### 1.2 CoachChannel vs CoachProfile

**Current State:**
- `CoachChannelScreen.js` - Shows coach bio, programs, subscribe button
- `CoachProfileScreen.js` - Shows coach bio, programs, subscribe button

**Problem:**
- **100% feature overlap** - both screens show the same content
- CoachChannelScreen referenced in navigation but rarely used
- Causes confusion on which screen to navigate to

**Decision:** ❌ **REMOVE CoachChannelScreen** → ✅ **KEEP CoachProfileScreen**

**Migration Steps:**

1. **Update all navigation calls:**
   - Find: `navigation.navigate('CoachChannel', { coach })`
   - Replace: `navigation.navigate('CoachProfile', { coach })`

2. **Update TabNavigator.js:**
   - Remove hidden route for CoachChannel (line 143-146)

3. **Delete files:**
   - ❌ Delete `src/screens/CoachChannelScreen.js`

**Acceptance Tests:**
- [ ] All coach links navigate to CoachProfile
- [ ] No references to CoachChannel in codebase
- [ ] No broken navigation

---

### 1.3 ProgramDetail vs ProgramTemplate

**Current State:**
- `ProgramDetailScreen.js` - Shows program overview, sessions, "Add to Library" button
- `ProgramTemplateScreen.js` - Shows program template with "Use Template" button

**Problem:**
- Unclear when each screen is used
- Likely both show same content with different CTAs
- Users confused on difference

**Decision:** ⚠️ **CLARIFY USAGE** or **MERGE**

**Investigation Needed:**
- Are templates different from regular programs?
- If yes → Keep both, but rename ProgramTemplate to "TemplatesScreen" (a list view)
- If no → Merge into ProgramDetail with conditional CTA

**Recommendation:** 
- Templates should be a **list screen** (browse all templates)
- Tapping a template → navigates to ProgramDetail with `isTemplate: true` flag
- ProgramDetail shows "Use Template" button if `isTemplate === true`, else "Add to Library"

**Migration Steps (if merging):**

1. **Update ProgramDetailScreen.js:**
   ```javascript
   const isTemplate = route.params?.isTemplate || false;
   const ctaLabel = isTemplate ? "Use Template" : "Add to Library";
   ```

2. **Create new TemplatesScreen.js:**
   - List view of all templates (similar to WorkoutLibrary)
   - Navigate to ProgramDetail with `isTemplate: true`

3. **Update navigation:**
   - CreatorHub "Templates & Tools" → navigate to TemplatesScreen

4. **Keep ProgramTemplateScreen for now** (low priority cleanup)

**Acceptance Tests:**
- [ ] Templates list screen shows all templates
- [ ] Tapping template opens ProgramDetail with correct CTA
- [ ] Using a template creates a copy in user's library

---

### 1.4 NewWorkout vs NewProgram

**Current State:**
- `NewWorkoutScreen.js` - Form to create a new workout (single session)
- `NewProgramScreen.js` - Form to create a new program (multi-session)

**Problem:**
- Very similar UI (both have name, description, difficulty, duration)
- NewProgram adds "sessions" array, but could be unified
- Both could be the same screen with a "type" parameter

**Decision:** ⚠️ **CONSIDER MERGING** (Low Priority)

**Recommendation:**
- Keep separate for now (acceptable distinction)
- Future: Create unified `CreateContentScreen.js` with type selector:
  - "Single Workout" → saves as workout
  - "Multi-Week Program" → adds sessions UI

**No immediate action required** (technical debt item)

---

### 1.5 Profile Edit (ProfileScreen modal) vs CreatorProfileEditor

**Current State:**
- `ProfileScreen.js` - Has Edit Profile modal (lines 645-786)
- `CreatorProfileEditor.js` - Separate screen for creator profile editing

**Problem:**
- Duplicate profile editing UI
- CreatorProfileEditor likely adds creator-specific fields (bio, specialty, etc.)
- Causes confusion on which to use

**Decision:** ✅ **MERGE into ProfileScreen** → Add creator-specific fields conditionally

**Migration Steps:**

1. **Update ProfileScreen.js Edit Modal:**
   - Add conditional fields if `user.isCreator === true`:
     ```javascript
     {user.isCreator && (
       <>
         <View style={styles.formGroup}>
           <Text style={styles.formLabel}>Creator Bio</Text>
           <TextInput style={styles.formInput} placeholder="Tell your followers about yourself..." multiline />
         </View>
         <View style={styles.formGroup}>
           <Text style={styles.formLabel}>Specialties</Text>
           <TextInput style={styles.formInput} placeholder="Strength, HIIT, Yoga..." />
         </View>
       </>
     )}
     ```

2. **Update CreatorHub:**
   - "Profile" icon button → navigate to `Profile` screen (not CreatorProfileEditor)

3. **Delete files:**
   - ❌ Delete `src/screens/CreatorProfileEditor.js`

4. **Update TabNavigator.js:**
   - Remove hidden route for CreatorProfileEditor (line 199-202)

**Acceptance Tests:**
- [ ] ProfileScreen shows creator fields if user is creator
- [ ] Saving profile updates both user and creator data
- [ ] No references to CreatorProfileEditor

---

### 1.6 Profile "Create & Share" vs Creator Upload

**Current State:**
- `ProfileScreen.js` (lines 367-623) - Upload section with Post/Story
- `CreatorHubScreen.js` (lines 182-271) - Upload media button

**Problem:**
- Duplicate content creation UI
- Non-creators shouldn't see "Create & Share" on Profile
- Creators should use Creator Studio exclusively

**Decision:** ❌ **REMOVE from ProfileScreen** → ✅ **KEEP in Creator Studio only**

**Migration Steps:**

1. **Update ProfileScreen.js:**
   - Remove entire upload section (lines 367-623)
   - Remove `renderUploadSection()` function
   - Remove state: `postPreview`, `storyPreview`, `composer`, etc.

2. **Add conditional in ProfileScreen:**
   - If user is creator → Show banner: "Create content in Creator Studio" with button

3. **Update CreatorHub:**
   - Keep upload functionality
   - Make it more prominent (primary action)

**Acceptance Tests:**
- [ ] ProfileScreen no longer shows upload section
- [ ] Creators see banner pointing to Creator Studio
- [ ] CreatorHub has upload functionality working

---

## 2. Blank/Incomplete Screens

### 2.1 CreatorDraftsScreen

**Current State:**
- File exists (`src/screens/CreatorDraftsScreen.js`)
- Likely shows empty state only (no real content)

**Problem:**
- Duplicate of CreatorHub "Drafts" tab
- Causes confusion (two places to view drafts)

**Decision:** ❌ **REMOVE screen** → ✅ **USE CreatorHub Drafts tab**

**Migration Steps:**

1. **Verify CreatorHub has Drafts tab:**
   - Ensure "Drafts" segmented control is functional
   - Ensure it fetches draft content from API

2. **Update navigation:**
   - Remove all references to `CreatorDrafts` screen
   - CreatorHub "Drafts" button → switch to Drafts tab (not navigate to new screen)

3. **Delete files:**
   - ❌ Delete `src/screens/CreatorDraftsScreen.js`

4. **Update TabNavigator.js:**
   - Remove hidden route for CreatorDrafts (line 158-161)

**Acceptance Tests:**
- [ ] CreatorHub Drafts tab shows real draft content
- [ ] No broken navigation
- [ ] No references to CreatorDrafts screen

---

### 2.2 CreatorAnalyticsScreen

**Current State:**
- File exists (`src/screens/CreatorAnalyticsScreen.js`)
- Shows "Analytics coming soon" or blank screen

**Problem:**
- Incomplete implementation
- Should show real analytics data

**Decision:** ✅ **FILL with real content** (see creator-spec.md)

**Required Content:**
- Overview: Total views, engagement rate, follower growth
- Top Performing: Top 5 workouts/programs by views
- Charts: Views over time (7/30 days)
- Audience demographics (if available)

**Migration Steps:**

1. **Implement CreatorAnalyticsScreen:**
   - Add API call to fetch analytics:
     ```javascript
     const res = await api.getCreatorAnalytics({ period: '30d' });
     ```
   - Display charts using `react-native-chart-kit` or similar
   - Show top performing content in list view

2. **Update CreatorHub:**
   - Toolbox "Analytics" row → navigates to CreatorAnalyticsScreen
   - Show preview metrics in toolbox (e.g., "12.1k views in last 7 days")

**Acceptance Tests:**
- [ ] CreatorAnalyticsScreen shows real data from API
- [ ] Charts render correctly
- [ ] Top performing list is accurate

**Keep file** (needs implementation, not removal)

---

### 2.3 VoiceWorkoutScreen

**Current State:**
- File exists (`src/screens/VoiceWorkoutScreen.js`)
- Feature appears incomplete (no real voice guidance)

**Problem:**
- Incomplete feature
- Not linked from main navigation
- Unclear if it's a priority feature

**Decision:** ❌ **REMOVE** (unless feature is completed)

**Investigation:**
- Is voice-guided workout a planned feature?
- If yes → Keep file, add to roadmap
- If no → Delete file

**Recommendation:** **REMOVE** (can always add back later)

**Migration Steps:**

1. **Delete files:**
   - ❌ Delete `src/screens/VoiceWorkoutScreen.js`

2. **Remove from TabNavigator:**
   - Check if it's referenced (likely not)

**Acceptance Tests:**
- [ ] No broken references
- [ ] App builds successfully

---

## 3. Navigation Cleanup

### 3.1 Reduce Bottom Tabs from 8 to 5

**Current Tabs (8):**
1. Discover
2. Home
3. Workouts
4. Progress
5. Plans ❌
6. Nutrition
7. Creator
8. Profile

**Proposed Tabs (5):**
1. 🏠 Home - Dashboard with nutrition/workout widgets
2. 🔍 Discover - Browse coaches & programs
3. ✨ Create - Creator Studio (if creator) or "Become Creator" CTA
4. 📊 Progress - Charts & stats
5. 👤 Profile - Settings & account

**Changes:**
- ❌ Remove "Plans" tab (merged into Workouts)
- ❌ Remove "Workouts" tab → Add workout widget to Home with deep link
- ❌ Remove "Nutrition" tab → Add nutrition widget to Home with deep link
- ✅ Keep "Creator" tab (rename to "Create")
- ✅ Keep "Profile" tab

**Migration Steps:**

1. **Update TabNavigator.js:**
   ```javascript
   // Remove these tabs:
   // - Plans (line 91-98)
   // - Workouts (line 72-80) ← Make this a widget on Home instead
   // - Nutrition (line 100-107) ← Make this a widget on Home instead
   
   // Rename tab:
   name="Create" // was "Creator"
   ```

2. **Update HomeScreen.js:**
   - Make workout widget tappable → Navigate to Workouts screen (as modal or stack)
   - Make nutrition widget tappable → Navigate to Nutrition screen

3. **Update navigation calls:**
   - Replace `navigation.navigate('Nutrition')` → `navigation.navigate('Home', { screen: 'Nutrition' })`
   - Or use deep linking: `navigation.push('Nutrition')`

**Acceptance Tests:**
- [ ] Tab bar shows exactly 5 tabs
- [ ] All screens are reachable within 2-3 taps
- [ ] No broken navigation

---

## 4. Implementation Order

### Phase 1 (High Priority - Week 1)
1. ✅ Remove PlansScreen → Merge into WorkoutLibrary
2. ✅ Remove CoachChannelScreen → Keep CoachProfile
3. ✅ Reduce tabs from 8 to 5
4. ✅ Remove Profile "Create & Share" → Move to Creator Studio

### Phase 2 (Medium Priority - Week 2)
5. ✅ Remove CreatorDraftsScreen → Use CreatorHub Drafts tab
6. ✅ Merge CreatorProfileEditor into ProfileScreen
7. ✅ Fill CreatorAnalyticsScreen with real content

### Phase 3 (Low Priority - Week 3)
8. ⚠️ Clarify ProgramDetail vs ProgramTemplate
9. ⚠️ Remove VoiceWorkoutScreen (if feature not planned)
10. ⚠️ Consider merging NewWorkout & NewProgram (tech debt)

---

## 5. Testing Checklist

After each removal/merge, verify:

- [ ] App builds successfully (no import errors)
- [ ] No broken navigation links
- [ ] All features still accessible
- [ ] No orphaned routes in TabNavigator
- [ ] Search codebase for screen name (should return 0 results)
- [ ] Run linter and fix warnings
- [ ] Update navigation tests (if any)

---

## 6. Files to Delete

**Confirmed Deletions:**
```
❌ src/screens/PlansScreen.js
❌ src/screens/CoachChannelScreen.js
❌ src/screens/CreatorDraftsScreen.js
❌ src/screens/CreatorProfileEditor.js
❌ src/screens/VoiceWorkoutScreen.js
```

**Maybe Delete (Investigate First):**
```
⚠️ src/screens/ProgramTemplateScreen.js (clarify vs ProgramDetail)
⚠️ src/screens/NewProgramScreen.js (consider merge with NewWorkout)
```

---

## 7. Redirect Map

| Old Route | New Route | Notes |
|-----------|-----------|-------|
| `Plans` | `Workouts` with filter | Merged into workout library |
| `CoachChannel` | `CoachProfile` | Same screen, different name |
| `CreatorDrafts` | `Creator` (Drafts tab) | Tab within CreatorHub |
| `CreatorProfileEditor` | `Profile` (Edit modal) | Conditionally show creator fields |
| `Nutrition` (tab) | `Home` → Nutrition widget | Deep link from Home |
| `Workouts` (tab) | `Home` → Workouts widget | Deep link from Home |

---

## 8. Acceptance Criteria

✅ **Before shipping cleanup:**

1. ✅ Total screens reduced from 27 to ≤21
2. ✅ Bottom tabs reduced from 8 to 5
3. ✅ No duplicate screens (Plans, CoachChannel, etc. removed)
4. ✅ No blank screens (CreatorDrafts, CreatorAnalytics filled or removed)
5. ✅ All features still accessible (no dead ends)
6. ✅ Navigation tests updated and passing
7. ✅ No broken imports or routes
8. ✅ Linter warnings resolved
9. ✅ App builds on iOS & Android
10. ✅ Smoke test passes (can navigate to all key screens)

---

**End of Cleanup Plan**

