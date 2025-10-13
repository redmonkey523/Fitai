# Agent 4 - Design System & UX Polish Roadmap

**Status:** Ready to Start  
**Prerequisites:** ✅ Agent 3 Complete (API centralization, quiz sync, navigation fixed)  
**Date:** October 9, 2025

---

## 🎯 Mission Overview

Transform the functional app into a polished, production-ready experience with:
- Design system foundation (tokens + 5 core components)
- Error resilience (no red screens, friendly recovery)
- Data-driven Progress & Home screens
- Creator Studio upload reliability
- Workout editor safety (auto-save, deep copy)

---

## P0 - Stability + Clarity (Week 1: Days 1-2)

### 1. Design System Foundation

**Create: `src/design/tokens.js`**
```javascript
export const TOKENS = {
  colors: {
    primary: { DEFAULT: '#00D4FF', hover: '#00B8E6', pressed: '#009FCC' },
    success: '#4ADE80',
    warning: '#FACC15',
    error: '#EF4444',
    // ... gold theme variants
  },
  spacing: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 },
  typography: { heading: 24, body: 16, caption: 12 },
  elevation: { low: 2, mid: 4, high: 8 },
  animation: { fast: 150, normal: 250, slow: 400 },
};
```

**Create: 5 Core Components**
1. `Button.js` - Primary/Secondary/Ghost with loading/disabled states
2. `Card.js` - Elevated container with consistent padding
3. `MetricTile.js` - Ring chart + value + label
4. `InlineAlert.js` - Info/Warning/Error with optional action
5. `SkeletonLoader.js` - Shimmer effect for loading states

**Pitfall to avoid:** Gold button theme flicker
- ✓ Use explicit `pressed` state with 0.98 scale + reduced elevation
- ✓ Choose native ripple OR custom animation (not both)

---

### 2. Error Strategy Enhancement

**Update: `src/services/api.js`**

Add comprehensive error code mapping:
```javascript
const ERROR_MESSAGES = {
  RATE_LIMITED: "We're getting a lot of traffic. Retrying…",
  NON_JSON: "Server returned an unexpected response.",
  AUTH_EXPIRED: "Please sign in again.",
  NETWORK_ERROR: "Connection lost. Check your network.",
  SERVER_ERROR: "Something went wrong on our end. We're on it!",
};
```

**Create: `src/components/ErrorBoundary.js`**
```javascript
// Per-stack error boundaries
// Never navigate away on recoverable errors
// Show InlineAlert with Retry button
```

**Rule:** Never kick user to Home on error. Show inline recovery options.

---

### 3. HealthKit Steps Gating (Complete)

**Location:** Already implemented ✅
- `src/services/healthKit.js` - iOS-only checks
- `src/screens/ProgressScreenEnhanced.js` - UI gating
- `src/screens/HomeScreen.js` - Empty state

**Enhance: Empty State Copy**
```javascript
// Not connected state:
title: "Connect Apple Health"
body: "See your daily steps from iPhone or Apple Watch."
primary: "Enable & Connect"
secondary: "Why we need this"

// After connect toast:
"Connected to Apple Health. Steps will update automatically."
```

**Logic:**
- Not connected → Connect Health card
- Connecting... → Spinner + disabled CTA
- Connected → Ring + 7-day sparkline + "Manage in Health" link

---

### 4. Quiz → Profile/Goals Data Lock

**Status:** ✅ Already working (Agent 3)

**Verify flow:**
1. Quiz Save → `PUT /users/me` → `PUT /users/me/goals`
2. Server computes targets (BMR/TDEE/macros)
3. Invalidate `['user']`, `['goals']`, `['summary']`
4. Settings reads from queries (no stale form state)

**Add: Success Toast**
```javascript
Toast.show({
  type: 'success',
  text1: 'Plan Applied',
  text2: 'Calories 2,160 • Protein 150g • Carbs 210g • Fat 70g',
  visibilityTime: 4000,
});
```

---

## P1 - Visible Wins (Week 1: Days 3-5)

### 1. Home Screen Enhancements

**File:** `src/screens/HomeScreen.js`

**Add Health Connect Empty State:**
```javascript
{!healthKitConnected && (
  <Card style={styles.connectHealthCard}>
    <Ionicons name="heart-outline" size={48} />
    <Text style={styles.connectTitle}>Connect Apple Health</Text>
    <Text style={styles.connectBody}>
      See your daily steps from iPhone or Apple Watch.
    </Text>
    <Button 
      label="Enable & Connect"
      onPress={requestHealthKitPermissions}
    />
    <TouchableOpacity>
      <Text style={styles.secondaryLink}>Why we need this</Text>
    </TouchableOpacity>
  </Card>
)}
```

**After Connect - Show Tiles:**
- Steps tile with 7-day sparkline
- Active Minutes (from HealthKit workout sessions)
- Macros mini-bar (Calories/Protein/Carbs/Fat) with progress

---

### 2. Progress Screen Enhancements

**File:** `src/screens/ProgressScreenEnhanced.js`

**Add: Goals Rings Section**
```javascript
<View style={styles.goalsSection}>
  <Text style={styles.sectionTitle}>Today's Goals</Text>
  <View style={styles.ringsRow}>
    <MetricTile
      value={1280}
      target={2160}
      unit="kcal"
      label="Calories"
      color={TOKENS.colors.primary}
    />
    <MetricTile
      value={95}
      target={150}
      unit="g"
      label="Protein"
      color={TOKENS.colors.success}
    />
    {healthKitConnected && (
      <MetricTile
        value={6300}
        target={10000}
        unit=""
        label="Steps"
        color={TOKENS.colors.warning}
      />
    )}
  </View>
</View>
```

**Add: Weight Trend Chart**
- 7/30/90 day toggle
- Line chart with data points
- Empty state: "Add first weight" CTA

**Add: Weekly Activity Bars**
- 7-day bar chart of workout minutes
- Empty state: Ghost bars + "Start a workout" CTA

**Add: Nutrition Compliance**
```javascript
<Card>
  <Text>Hit goal on 4/7 days • Protein avg 142g</Text>
</Card>
```

**Key Rule:** Show value even with little data
- No weight logs → Empty chart + "Add first weight"
- No workouts → Ghost bars + CTA
- No Steps → Hide tile entirely (don't show 0/0)

---

### 3. Workout Editor Safety

**File:** `src/screens/NewWorkoutScreen.js` (or workout editor)

**Add: Auto-save**
```javascript
useEffect(() => {
  const timer = setTimeout(() => {
    if (hasChanges) {
      saveDraft(workoutData);
    }
  }, 5000);
  return () => clearTimeout(timer);
}, [workoutData]);
```

**Enhance: Duplicate Function**
```javascript
const duplicateBlock = (blockIndex) => {
  const block = blocks[blockIndex];
  const deepCopy = {
    ...block,
    exercises: block.exercises.map(ex => ({
      ...ex,
      tempo: { ...ex.tempo },
      rest: { ...ex.rest },
      notes: ex.notes,
      media: [...(ex.media || [])], // Copy media URLs
    })),
  };
  insertBlock(blockIndex + 1, deepCopy);
};
```

**Add: Inline Validation**
```javascript
{!exercise.name && (
  <InlineAlert type="error">
    Exercise name is required
  </InlineAlert>
)}
```

**Add: Unsaved Changes Guard**
```javascript
useEffect(() => {
  const unsubscribe = navigation.addListener('beforeRemove', (e) => {
    if (!hasUnsavedChanges) return;
    e.preventDefault();
    Alert.alert(
      'Discard changes?',
      'You have unsaved changes:\n• Exercise 1 modified\n• Set 3 added',
      [
        { text: "Keep Editing", style: 'cancel' },
        { text: 'Discard', style: 'destructive', onPress: () => navigation.dispatch(e.data.action) },
      ]
    );
  });
  return unsubscribe;
}, [hasUnsavedChanges, navigation]);
```

---

### 4. Creator Studio Upload Resilience

**File:** `src/screens/CreatorHubScreen.js` (and upload-related screens)

**Create: Upload Queue System**
```javascript
// src/services/uploadQueue.js
class UploadQueue {
  constructor() {
    this.queue = [];
    this.active = null;
  }
  
  async add(file, onProgress) {
    // Validate size/type upfront
    if (!this.isValidFile(file)) {
      throw new Error('Invalid file type or size');
    }
    
    // Generate thumbnail client-side
    const thumbnail = await generateThumbnail(file);
    
    const upload = {
      id: uuid(),
      file,
      thumbnail,
      progress: 0,
      status: 'pending', // pending | uploading | complete | error
      retries: 0,
    };
    
    this.queue.push(upload);
    this.processQueue();
    return upload;
  }
  
  async processQueue() {
    if (this.active || this.queue.length === 0) return;
    
    this.active = this.queue[0];
    this.active.status = 'uploading';
    
    try {
      await this.uploadWithRetry(this.active);
      this.active.status = 'complete';
      this.queue.shift();
      this.active = null;
      this.processQueue(); // Next
    } catch (error) {
      if (this.active.retries < 3) {
        this.active.retries++;
        this.active.status = 'retrying';
        await wait(Math.pow(2, this.active.retries) * 1000);
        this.active.status = 'pending';
        this.processQueue();
      } else {
        this.active.status = 'error';
      }
    }
  }
}
```

**UI: Progress + Retry**
```javascript
<View style={styles.uploadItem}>
  <Image source={{ uri: upload.thumbnail }} />
  {upload.status === 'uploading' && (
    <ProgressBar value={upload.progress} />
  )}
  {upload.status === 'error' && (
    <InlineAlert type="error">
      Upload failed
      <Button label="Retry" onPress={() => retryUpload(upload.id)} />
    </InlineAlert>
  )}
</View>
```

**Navigation: Preserve State**
```javascript
// Don't reset to Home on error
// Keep scroll position and selection
useFocusEffect(
  useCallback(() => {
    // Restore scroll position
    scrollViewRef.current?.scrollTo({ y: savedScrollY, animated: false });
  }, [savedScrollY])
);
```

---

## P2 - Polish (Week 2: Days 6-7)

### 1. Empty States Everywhere

**Pattern:**
```javascript
<EmptyState
  icon="trophy-outline"
  title="No workouts yet"
  description="Start tracking your fitness journey"
  action="Create First Workout"
  onAction={() => navigation.navigate('NewWorkout')}
/>
```

**Apply to:**
- Workout Library
- Progress Weight Chart
- Nutrition History
- Social Feed
- Creator Programs

---

### 2. Skeleton Loaders

**Replace all `<ActivityIndicator />` with:**
```javascript
<SkeletonLoader type="card" count={3} />
<SkeletonLoader type="list" count={5} />
<SkeletonLoader type="metric" count={3} />
```

---

### 3. Micro-interactions

**Add:**
- Haptic feedback on button press
- Scale animation on card press (0.98)
- Success checkmark animation after save
- Swipe gestures for delete/archive

---

### 4. Accessibility Pass

**Add:**
```javascript
<TouchableOpacity
  accessible={true}
  accessibilityLabel="Save workout"
  accessibilityRole="button"
  accessibilityState={{ disabled: !isValid }}
>
  <Text>Save</Text>
</TouchableOpacity>
```

---

## 📏 Measurable "Done" Criteria

### P0 Acceptance
- [ ] 0 red screens on poor network / rate limit / auth expiry
- [ ] Steps tile never appears unless HealthKit connected
- [ ] Quiz save updates Settings/Profile immediately
- [ ] Home/Progress reflect targets without restart
- [ ] Design system components documented in Storybook

### P1 Acceptance
- [ ] Home shows Connect Health → Steps after connection
- [ ] Progress shows value for brand-new users (empty states)
- [ ] Progress shows value for power users (charts & trends)
- [ ] Creating/editing workouts cannot lose data
- [ ] Duplicate preserves all media and nested properties
- [ ] Creator upload can be interrupted and resumed
- [ ] Upload errors are actionable (retry works)

### P2 Acceptance
- [ ] Every screen has loading skeleton (no spinners)
- [ ] Every empty list has helpful CTA
- [ ] All interactive elements have accessibility labels
- [ ] Haptic feedback on key actions
- [ ] Route-leave guards prevent data loss

---

## ⚠️ Risks & Mitigations

### Risk 1: Server HTML Error Pages
**Problem:** Nginx/proxy returns HTML on 500 errors  
**Mitigation:**
- ✅ Already handled by Agent 3 (ApiService checks content-type)
- Add CloudFlare rule: "Always return JSON from /api/*"

### Risk 2: Expo + Native Modules
**Problem:** HealthKit needs dev client, not Expo Go  
**Mitigation:**
- ✅ Already guarded: `Platform.OS !== 'ios'` checks
- Document: "Run `expo run:ios` for full HealthKit features"

### Risk 3: Design Drift
**Problem:** New screens don't match existing gold theme  
**Mitigation:**
- Create living Storybook: `npm run storybook`
- Reference Coaches page for design parity
- Weekly design review

### Risk 4: Upload Failures
**Problem:** Network interruption during video upload  
**Mitigation:**
- ✅ Already handled: ApiService has retry logic
- Add: Resume capability (chunked uploads)
- Add: Client-side thumbnail generation

---

## 🔧 Technical Implementation Notes

### Design System Setup

**Install:**
```bash
npm install react-native-reanimated
npm install react-native-haptic-feedback
```

**Create Structure:**
```
src/
├── design/
│   ├── tokens.js
│   ├── components/
│   │   ├── Button.js
│   │   ├── Card.js
│   │   ├── MetricTile.js
│   │   ├── InlineAlert.js
│   │   └── SkeletonLoader.js
│   └── playground.js (visual QA)
```

---

### Error Boundary Setup

**Create:**
```javascript
// src/components/ErrorBoundary.js
class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null };
  
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  
  render() {
    if (this.state.hasError) {
      return (
        <InlineAlert type="error">
          {ERROR_MESSAGES[this.state.error.code] || 'Something went wrong'}
          <Button label="Retry" onPress={this.props.onRetry} />
        </InlineAlert>
      );
    }
    return this.props.children;
  }
}
```

**Wrap Stacks:**
```javascript
<ErrorBoundary onRetry={() => queryClient.invalidateQueries()}>
  <Tab.Screen name="Progress" component={ProgressScreen} />
</ErrorBoundary>
```

---

## 📊 Success Metrics

**Week 1 Target:**
- [ ] Design system components: 5/5 complete
- [ ] Error handling: 0 unhandled exceptions
- [ ] Quiz → Profile sync: < 500ms perceived latency
- [ ] HealthKit connection rate: > 50% of iOS users

**Week 2 Target:**
- [ ] Upload success rate: > 95% (with retries)
- [ ] Workout editor: 0 data loss reports
- [ ] Empty state coverage: 100% of list screens
- [ ] Accessibility score: > 90 (react-native-a11y)

---

## 🎬 Sprint Sequencing

### Day 1-2: Foundation
- [ ] Morning: Create tokens.js + Button/Card/MetricTile
- [ ] Afternoon: InlineAlert + SkeletonLoader + ErrorBoundary
- [ ] Evening: Visual QA playground screen

### Day 3-4: Home & Progress
- [ ] Morning: Home Connect Health empty state
- [ ] Afternoon: Home tiles (Steps/Minutes/Macros)
- [ ] Evening: Progress Goals rings + Weight chart

### Day 5: Workout Safety
- [ ] Morning: Auto-save + deep duplicate
- [ ] Afternoon: Inline validation + unsaved changes guard
- [ ] Evening: Test data loss scenarios

### Day 6: Creator Resilience
- [ ] Morning: Upload queue + progress UI
- [ ] Afternoon: Retry logic + thumbnail generation
- [ ] Evening: Preserve scroll/selection on errors

### Day 7: Polish & Buffer
- [ ] Morning: Empty states + skeletons everywhere
- [ ] Afternoon: Accessibility labels + haptics
- [ ] Evening: Buffer for bug fixes + testing

---

## 📚 Reference Materials

**Current Implementation:**
- ✅ ApiService: `src/services/api.js` (Agent 3 complete)
- ✅ HealthKit: `src/services/healthKit.js` (Agent 3 verified)
- ✅ Quiz sync: `src/hooks/useUserData.ts` (Agent 3 complete)
- ✅ Navigation: `src/screens/GoalQuizScreen.js` (Agent 3 fixed)

**Design Reference:**
- Gold theme colors in `src/constants/theme.js`
- Coaches page for design parity
- Progress rings examples in ProgressScreenEnhanced.js

**API Endpoints:**
- `GET /api/users/me/profile` - User physical attributes
- `GET /api/users/me/goals` - Targets (calories/macros/steps)
- `GET /api/users/me/summary?window=7d` - Progress summary
- `GET /api/analytics/progress?timeframe=7d` - Weight trend data
- `POST /api/upload/single` - File upload with validation

---

## 🚀 Ready to Start?

**Prerequisites Checklist:**
- ✅ Agent 3 validation passing (`npm run validate`)
- ✅ Backend running on port 5000
- ✅ Expo running on port 8081
- ✅ Quiz → Profile/Goals sync working
- ✅ No red crash screens on API errors

**First Command:**
```bash
mkdir -p src/design/components
touch src/design/tokens.js
touch src/design/components/Button.js
npm run dev
```

Good luck, Agent 4! 🎨


