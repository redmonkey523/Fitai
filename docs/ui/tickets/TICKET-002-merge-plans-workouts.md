# TICKET-002: Merge Plans into Workouts

**Priority:** High  
**Effort:** Small (1 day)  
**Dependencies:** None  
**Assignee:** Frontend Dev

---

## Description

Merge PlansScreen into WorkoutLibraryScreen to eliminate duplicate functionality. Users don't distinguish between "plans" and "workouts" - they're all fitness programs.

---

## Acceptance Criteria

- [ ] WorkoutLibraryScreen shows both workouts and plans
- [ ] Filter chips include "All", "Workouts", "Plans"
- [ ] Tapping a plan navigates to PlanDetail
- [ ] No references to PlansScreen remain
- [ ] All tests pass
- [ ] No broken navigation

---

## Implementation Steps

### 1. Update WorkoutLibraryScreen.js

**Fetch both workouts and plans:**
```javascript
const fetchWorkouts = async () => {
  try {
    const [workoutsRes, plansRes] = await Promise.all([
      api.getWorkouts(),
      api.getPlans(),
    ]);

    const workoutsList = workoutsRes.data || [];
    const plansList = (plansRes.data?.items || []).map(p => ({
      ...p,
      _isFromPlans: true, // Flag to differentiate
      type: 'plan', // For filtering
    }));

    setWorkouts([...workoutsList, ...plansList]);
  } catch (error) {
    console.error('Failed to fetch:', error);
  }
};
```

**Add "Plans" filter chip:**
```javascript
const categories = [
  { id: 'all', name: 'All' },
  { id: 'workouts', name: 'Workouts' },
  { id: 'plans', name: 'Plans' }, // NEW
  { id: 'arms', name: 'Arms' },
  // ... existing categories
];
```

**Update filter logic:**
```javascript
const filteredWorkouts = workouts.filter(workout => {
  const matchesSearch = workout.name?.toLowerCase().includes(searchQuery.toLowerCase());
  const matchesCategory = 
    activeCategory === 'all' ||
    (activeCategory === 'workouts' && !workout._isFromPlans) ||
    (activeCategory === 'plans' && workout._isFromPlans) ||
    workout.category === activeCategory;
  return matchesSearch && matchesCategory;
});
```

**Update card rendering:**
```javascript
const renderWorkoutCard = (workout) => {
  // Show duration in weeks for plans, minutes for workouts
  const durationLabel = workout._isFromPlans 
    ? `${workout.weeks || 4} weeks` 
    : `${workout.estimatedDuration || 30} min`;
  
  return (
    <Card>
      {/* ... existing card UI ... */}
      <Text>{durationLabel}</Text>
    </Card>
  );
};
```

### 2. Update Navigation

**Search codebase for references:**
```bash
# Find all navigation calls to Plans
grep -r "navigate('Plans')" src/
```

**Replace with:**
```javascript
// Before:
navigation.navigate('Plans')

// After:
navigation.navigate('Workouts', { filterTab: 'plans' })
```

**Handle initial filter in WorkoutLibraryScreen:**
```javascript
useEffect(() => {
  const filterTab = route.params?.filterTab;
  if (filterTab) {
    setActiveCategory(filterTab);
  }
}, [route.params]);
```

### 3. Remove PlansScreen

**Delete file:**
```bash
rm src/screens/PlansScreen.js
```

**Remove from TabNavigator.js:**
```javascript
// DELETE THESE LINES (line 91-98):
// <Tab.Screen
//   name="Plans"
//   component={PlansScreen}
//   options={{
//     tabBarIcon: ({ color, size }) => (
//       <Ionicons name="calendar" color={color} size={size} />
//     ),
//   }}
// />
```

**Remove import:**
```javascript
// DELETE:
import PlansScreen from '../screens/PlansScreen';
```

### 4. Update Tests

**Update WorkoutLibraryScreen.test.js:**
```javascript
describe('WorkoutLibraryScreen', () => {
  it('fetches and displays workouts and plans', async () => {
    const { getByText } = render(<WorkoutLibraryScreen />);
    await waitFor(() => {
      expect(getByText('All')).toBeTruthy();
      expect(getByText('Workouts')).toBeTruthy();
      expect(getByText('Plans')).toBeTruthy();
    });
  });

  it('filters by plans', async () => {
    const { getByText } = render(<WorkoutLibraryScreen />);
    fireEvent.press(getByText('Plans'));
    // Assert only plans shown
  });
});
```

---

## Testing

### Manual Tests
- [ ] Open Workouts screen → See both workouts and plans
- [ ] Tap "Plans" filter → Only plans shown
- [ ] Tap "Workouts" filter → Only workouts shown
- [ ] Tap "All" filter → Both shown
- [ ] Tap a plan → Navigate to PlanDetail
- [ ] Search for a plan by name → Plan appears in results
- [ ] No console errors

### Regression Tests
- [ ] Existing workout functionality unchanged
- [ ] Filters still work for other categories (Arms, Legs, etc.)

---

## Screenshots

**Before:** Two separate screens (Plans tab, Workouts tab)  
**After:** One unified screen with filter chips

---

## Rollback Plan

If issues arise:
1. Restore `PlansScreen.js` from git
2. Re-add to TabNavigator
3. Remove plans from WorkoutLibraryScreen

---

## Related Tickets
- TICKET-001: Reduce Bottom Tabs
- TICKET-010: Remove Duplicate Screens

---

**Status:** Ready for dev  
**Created:** 2025-10-07  
**Updated:** 2025-10-07

