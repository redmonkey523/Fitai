# TICKET-001: Reduce Bottom Tabs from 8 to 5

**Priority:** High  
**Effort:** Medium (2-3 days)  
**Dependencies:** None  
**Assignee:** Frontend Dev

---

## Description

Reduce bottom navigation tabs from 8 to 5 to meet platform guidelines (iOS HIG, Material Design).

**Current tabs (8):**
1. Discover
2. Home
3. Workouts
4. Progress
5. Plans
6. Nutrition
7. Creator
8. Profile

**Proposed tabs (5):**
1. 🏠 Home
2. 🔍 Discover
3. ✨ Create
4. 📊 Progress
5. 👤 Profile

---

## Acceptance Criteria

- [ ] Bottom tab bar shows exactly 5 tabs
- [ ] All screens are reachable within 2-3 taps from Home
- [ ] Workouts accessible via widget on Home
- [ ] Nutrition accessible via widget on Home
- [ ] Plans merged into Workouts (see TICKET-002)
- [ ] No broken navigation links
- [ ] Tab icons and labels clear and consistent

---

## Implementation Steps

### 1. Update TabNavigator.js

**Remove these tab definitions:**
```javascript
// Line 91-98: Remove Plans tab
// Line 72-80: Remove Workouts tab (will be widget on Home)
// Line 100-107: Remove Nutrition tab (will be widget on Home)
```

**Rename Creator tab:**
```javascript
<Tab.Screen
  name="Create" // was "Creator"
  component={CreatorHubScreen}
  options={{
    tabBarIcon: ({ color, size }) => (
      <Ionicons name="add-circle-outline" color={color} size={size} />
    ),
  }}
/>
```

**Final tab order:**
```javascript
<Tab.Navigator>
  <Tab.Screen name="Home" ... />
  <Tab.Screen name="Discover" ... />
  <Tab.Screen name="Create" ... />
  <Tab.Screen name="Progress" ... />
  <Tab.Screen name="Profile" ... />
</Tab.Navigator>
```

### 2. Update HomeScreen.js

**Make workout widget tappable:**
```javascript
<TouchableOpacity
  onPress={() => navigation.navigate('Workouts')}
  style={styles.workoutCard}
>
  {/* ... existing workout card content ... */}
</TouchableOpacity>
```

**Make nutrition widget tappable:**
```javascript
<TouchableOpacity
  onPress={() => navigation.navigate('Nutrition')}
  style={styles.macrosCard}
>
  {/* ... existing macros card content ... */}
</TouchableOpacity>
```

**Add navigation prop to HomeScreen:**
```javascript
const HomeScreen = ({ navigation }) => {
  // ... existing code
};
```

### 3. Update Navigation Calls

**Search and replace:**
- Find: `navigation.navigate('Plans')` → Replace: `navigation.navigate('Workouts', { tab: 'plans' })`
- Find: Tab references in other screens → Update to new tab names

### 4. Update Hidden Routes

**Keep these as stack screens (not tabs):**
```javascript
<Tab.Screen
  name="Workouts"
  component={WorkoutLibraryScreen}
  options={{ tabBarButton: () => null }} // Hidden from tab bar
/>
<Tab.Screen
  name="Nutrition"
  component={NutritionScreen}
  options={{ tabBarButton: () => null }}
/>
```

---

## Testing

### Manual Tests
- [ ] Launch app → Verify 5 tabs visible
- [ ] Tap each tab → Screen loads correctly
- [ ] From Home → Tap workout widget → Navigate to Workouts
- [ ] From Home → Tap nutrition widget → Navigate to Nutrition
- [ ] Press back button → Return to Home
- [ ] Verify no console errors

### Automated Tests
- [ ] Update navigation tests: `TabNavigator.test.js`
- [ ] Assert tab count === 5
- [ ] Assert tab names match spec

---

## Screenshots

**Before:** (8 tabs, labels truncated on small devices)
**After:** (5 tabs, labels fully visible)

---

## Rollback Plan

If issues arise:
1. Revert `TabNavigator.js` changes
2. Remove widget navigation from `HomeScreen.js`
3. Redeploy previous version

---

## Related Tickets
- TICKET-002: Merge Plans into Workouts
- TICKET-003: Creator Hub Redesign

---

**Status:** Ready for dev  
**Created:** 2025-10-07  
**Updated:** 2025-10-07

