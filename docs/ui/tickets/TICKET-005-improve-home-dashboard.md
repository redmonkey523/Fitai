# TICKET-005: Improve Home Dashboard (Better Hierarchy)

**Priority:** High  
**Effort:** Medium (2 days)  
**Dependencies:** TICKET-004 (remove duplicate coach cards)  
**Assignee:** Frontend Dev

---

## Description

Redesign Home screen based on screenshot analysis to improve visual hierarchy and reduce clutter:
1. **Make calorie ring the hero** (largest, most prominent)
2. **Reduce quick actions** (4+ → 3)
3. **Compact Recent Foods** (horizontal scroll, not vertical)
4. **Bring Weekly Stats above fold**
5. **Shrink Coach Tip** (make it a small "Insight" card)

---

## Acceptance Criteria

- [ ] Calorie ring is largest element on screen
- [ ] Exactly 3 quick actions (Scan, Quick Add, Add Meal)
- [ ] Recent Foods horizontal scroll (max 3 items visible)
- [ ] Weekly Stats visible above fold (3 stat tiles)
- [ ] Insight card small, dismissible, saveable
- [ ] All content fits on ~2 screen heights (not 3+)
- [ ] Workout CTA prominent (primary button styling)
- [ ] No console errors

---

## Current Issues (from Screenshots)

### 1. Weak Visual Hierarchy
- All elements roughly same size
- No clear "hero" element
- Calorie info buried in a card (not prominent)

### 2. Cluttered Quick Actions
- 4+ action buttons competing for attention
- Redundant: "Quick Add" + "Add Meal" do similar things

### 3. Recent Foods Too Large
- Takes up ~30% of screen
- Shows 5+ items vertically (overwhelming)
- "View All" link hidden at bottom

### 4. Weekly Stats Below Fold
- Important metrics (Protein, Workouts, Weight) hidden
- User must scroll to see progress

### 5. Coach Tip Too Prominent
- Large card with long text
- Takes up valuable above-fold space
- No way to dismiss or save for later

---

## Implementation Steps

### 1. Redesign Hero Section (Calorie Ring)

**Remove old macros card, create new hero:**
```javascript
const renderCalorieHero = () => {
  const { calories } = nutritionData;
  const percentage = (calories.consumed / calories.target) * 100;
  
  return (
    <View style={styles.calorieHero}>
      {/* Big circular progress ring */}
      <View style={styles.ringContainer}>
        <Svg width={160} height={160}>
          {/* Background circle */}
          <Circle
            cx={80}
            cy={80}
            r={70}
            stroke={COLORS.background.secondary}
            strokeWidth={12}
            fill="none"
          />
          {/* Progress circle */}
          <Circle
            cx={80}
            cy={80}
            r={70}
            stroke={COLORS.accent.primary}
            strokeWidth={12}
            fill="none"
            strokeDasharray={`${2 * Math.PI * 70}`}
            strokeDashoffset={`${2 * Math.PI * 70 * (1 - percentage / 100)}`}
            strokeLinecap="round"
          />
        </Svg>
        
        {/* Center text */}
        <View style={styles.ringCenter}>
          <Text style={styles.caloriesRemaining}>{calories.remaining}</Text>
          <Text style={styles.caloriesLabel}>cal remaining</Text>
        </View>
      </View>
      
      {/* Goal info below ring */}
      <View style={styles.goalRow}>
        <Ionicons name="target" size={16} color={COLORS.text.secondary} />
        <Text style={styles.goalText}>Daily Goal: {calories.target} cal</Text>
      </View>
      
      {/* Macros summary (compact) */}
      <View style={styles.macrosSummary}>
        <Text style={styles.macroText}>P: {nutritionData.macros.protein.consumed}g</Text>
        <Text style={styles.macroText}>C: {nutritionData.macros.carbs.consumed}g</Text>
        <Text style={styles.macroText}>F: {nutritionData.macros.fat.consumed}g</Text>
      </View>
    </View>
  );
};
```

**Styling:**
```javascript
calorieHero: {
  alignItems: 'center',
  paddingVertical: SIZES.spacing.xl,
  marginBottom: SIZES.spacing.lg,
},
ringContainer: {
  position: 'relative',
  marginBottom: SIZES.spacing.md,
},
ringCenter: {
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  justifyContent: 'center',
  alignItems: 'center',
},
caloriesRemaining: {
  color: COLORS.accent.primary,
  fontSize: 40, // Large!
  fontWeight: FONTS.weight.bold,
},
caloriesLabel: {
  color: COLORS.text.secondary,
  fontSize: FONTS.size.sm,
  marginTop: 4,
},
goalRow: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 6,
  marginBottom: SIZES.spacing.sm,
},
macrosSummary: {
  flexDirection: 'row',
  gap: 16,
},
macroText: {
  color: COLORS.text.secondary,
  fontSize: FONTS.size.sm,
},
```

### 2. Reduce Quick Actions (4+ → 3)

**Remove redundant actions:**
```javascript
// DELETE:
// - "Camera Test" (dev tool, not user-facing)
// - Combine "Quick Add" and "Add Meal" into one

const renderQuickActions = () => {
  const actions = [
    {
      id: 'scan',
      icon: 'scan-outline',
      label: 'Scan Food',
      onPress: () => handleQuickAction('scan'),
    },
    {
      id: 'quick-add',
      icon: 'add-circle-outline',
      label: 'Quick Add',
      onPress: () => handleQuickAction('quick_add'),
    },
    {
      id: 'log-meal',
      icon: 'restaurant-outline',
      label: 'Log Meal',
      onPress: () => navigation.navigate('Nutrition'),
    },
  ];
  
  return (
    <View style={styles.quickActions}>
      {actions.map(action => (
        <TouchableOpacity
          key={action.id}
          style={styles.quickAction}
          onPress={action.onPress}
          accessibilityLabel={action.label}
          accessibilityRole="button"
        >
          <View style={styles.quickActionIcon}>
            <Ionicons name={action.icon} size={24} color={COLORS.accent.primary} />
          </View>
          <Text style={styles.quickActionText}>{action.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};
```

**Styling:**
```javascript
quickActions: {
  flexDirection: 'row',
  justifyContent: 'space-around',
  paddingHorizontal: SIZES.spacing.lg,
  marginBottom: SIZES.spacing.lg,
},
quickAction: {
  alignItems: 'center',
  flex: 1,
},
quickActionIcon: {
  width: 56,
  height: 56,
  borderRadius: 28,
  backgroundColor: COLORS.background.secondary,
  justifyContent: 'center',
  alignItems: 'center',
  marginBottom: SIZES.spacing.sm,
},
quickActionText: {
  color: COLORS.text.secondary,
  fontSize: FONTS.size.xs,
  textAlign: 'center',
},
```

### 3. Compact Recent Foods (Horizontal Scroll)

**Change from vertical list to horizontal:**
```javascript
const renderRecentFoods = () => {
  if (recentFoods.length === 0) return null;
  
  return (
    <View style={styles.recentSection}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Recent Foods</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Nutrition', { tab: 'history' })}>
          <Text style={styles.seeAll}>Log more →</Text>
        </TouchableOpacity>
      </View>
      
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.recentFoodsScroll}
      >
        {recentFoods.slice(0, 5).map((food, index) => (
          <View key={index} style={styles.foodChip}>
            <Text style={styles.foodName} numberOfLines={1}>{food.name}</Text>
            <Text style={styles.foodCal}>{food.calories} cal</Text>
            <Text style={styles.foodTime}>{food.time}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
};
```

**Styling:**
```javascript
recentSection: {
  marginBottom: SIZES.spacing.lg,
},
sectionHeader: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  paddingHorizontal: SIZES.spacing.lg,
  marginBottom: SIZES.spacing.sm,
},
sectionTitle: {
  color: COLORS.text.primary,
  fontSize: FONTS.size.md,
  fontWeight: FONTS.weight.bold,
},
seeAll: {
  color: COLORS.accent.primary,
  fontSize: FONTS.size.sm,
},
recentFoodsScroll: {
  paddingHorizontal: SIZES.spacing.lg,
  gap: 8,
},
foodChip: {
  backgroundColor: COLORS.background.card,
  paddingHorizontal: 12,
  paddingVertical: 10,
  borderRadius: SIZES.radius.md,
  minWidth: 100,
  ...SHADOWS.small,
},
foodName: {
  color: COLORS.text.primary,
  fontSize: FONTS.size.sm,
  fontWeight: FONTS.weight.medium,
  marginBottom: 4,
},
foodCal: {
  color: COLORS.text.secondary,
  fontSize: FONTS.size.xs,
},
foodTime: {
  color: COLORS.text.tertiary,
  fontSize: FONTS.size.xs,
  marginTop: 2,
},
```

### 4. Bring Weekly Stats Above Fold

**Move before Recent Foods:**
```javascript
const renderWeeklyStats = () => {
  return (
    <View style={styles.weeklyStatsSection}>
      <Text style={styles.sectionTitle}>This Week</Text>
      <View style={styles.statsRow}>
        <View style={styles.statTile}>
          <View style={styles.statRing}>
            <Text style={styles.statValue}>{progressRings.protein}%</Text>
          </View>
          <Text style={styles.statLabel}>Protein</Text>
        </View>
        
        <View style={styles.statTile}>
          <View style={styles.statRing}>
            <Text style={styles.statValue}>{progressRings.workouts}</Text>
          </View>
          <Text style={styles.statLabel}>Workouts</Text>
        </View>
        
        <View style={styles.statTile}>
          <View style={styles.statRing}>
            <Text style={styles.statValue}>
              {progressRings.weight > 0 ? '+' : ''}{progressRings.weight} lbs
            </Text>
          </View>
          <Text style={styles.statLabel}>Weight</Text>
        </View>
      </View>
    </View>
  );
};
```

**Styling:**
```javascript
weeklyStatsSection: {
  paddingHorizontal: SIZES.spacing.lg,
  marginBottom: SIZES.spacing.lg,
},
statsRow: {
  flexDirection: 'row',
  justifyContent: 'space-around',
},
statTile: {
  alignItems: 'center',
},
statRing: {
  width: 70,
  height: 70,
  borderRadius: 35,
  borderWidth: 4,
  borderColor: COLORS.accent.primary,
  justifyContent: 'center',
  alignItems: 'center',
  marginBottom: SIZES.spacing.sm,
  backgroundColor: COLORS.background.card,
},
statValue: {
  color: COLORS.text.primary,
  fontSize: FONTS.size.md,
  fontWeight: FONTS.weight.bold,
},
statLabel: {
  color: COLORS.text.secondary,
  fontSize: FONTS.size.xs,
},
```

### 5. Shrink Coach Tip → Insight Card

**Make it small and dismissible:**
```javascript
const [insightDismissed, setInsightDismissed] = useState(false);
const [insightSaved, setInsightSaved] = useState(false);

const renderInsightCard = () => {
  if (insightDismissed || !coachTip.title) return null;
  
  return (
    <View style={styles.insightCard}>
      <View style={styles.insightHeader}>
        <View style={styles.insightIcon}>
          <Ionicons name="bulb-outline" size={20} color={COLORS.accent.warning} />
        </View>
        <Text style={styles.insightLabel}>Insight</Text>
        <View style={{ flex: 1 }} />
        <TouchableOpacity
          onPress={() => {
            setInsightSaved(!insightSaved);
            Toast.show({ type: 'success', text1: insightSaved ? 'Removed from saved' : 'Saved' });
          }}
          style={styles.iconButton}
        >
          <Ionicons
            name={insightSaved ? 'bookmark' : 'bookmark-outline'}
            size={20}
            color={COLORS.accent.primary}
          />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setInsightDismissed(true)}
          style={styles.iconButton}
        >
          <Ionicons name="close" size={20} color={COLORS.text.secondary} />
        </TouchableOpacity>
      </View>
      <Text style={styles.insightText} numberOfLines={2}>
        {coachTip.content || 'Stay hydrated! Aim for 8 glasses of water per day to boost performance.'}
      </Text>
    </View>
  );
};
```

**Styling:**
```javascript
insightCard: {
  backgroundColor: COLORS.background.card,
  borderRadius: SIZES.radius.md,
  padding: SIZES.spacing.md,
  marginHorizontal: SIZES.spacing.lg,
  marginBottom: SIZES.spacing.lg,
  borderLeftWidth: 4,
  borderLeftColor: COLORS.accent.warning,
  ...SHADOWS.small,
},
insightHeader: {
  flexDirection: 'row',
  alignItems: 'center',
  marginBottom: SIZES.spacing.sm,
},
insightIcon: {
  marginRight: SIZES.spacing.xs,
},
insightLabel: {
  color: COLORS.text.primary,
  fontSize: FONTS.size.sm,
  fontWeight: FONTS.weight.bold,
},
iconButton: {
  padding: 4,
  marginLeft: 8,
},
insightText: {
  color: COLORS.text.secondary,
  fontSize: FONTS.size.sm,
  lineHeight: 18,
},
```

### 6. Update Render Order

**New order (top to bottom):**
```javascript
return (
  <ScrollView style={styles.container}>
    {renderHeader()}                 // Greeting + date
    {renderCalorieHero()}            // 🎯 BIG calorie ring
    {renderQuickActions()}           // 3 actions (not 4+)
    {renderWorkoutCard()}            // Today's workout CTA
    {renderWeeklyStats()}            // This Week stats (above fold!)
    {renderRecentFoods()}            // Horizontal scroll (compact)
    {renderMiniWidgets()}            // Hydration + Steps
    {renderInsightCard()}            // Small, dismissible
    {renderRecoveryTile()}           // If connected
  </ScrollView>
);
```

---

## Testing

### Manual Tests
- [ ] Launch Home → Calorie ring is largest element
- [ ] Count quick actions → Exactly 3
- [ ] Scroll Recent Foods horizontally → Works smoothly
- [ ] Weekly Stats visible without scrolling
- [ ] Insight card dismissible (X button works)
- [ ] Insight card saveable (bookmark icon toggles)
- [ ] All content fits in ~2 screen heights
- [ ] Workout CTA prominent (primary button)
- [ ] No console errors

### Visual Regression
- [ ] Take screenshot before/after
- [ ] Compare hierarchy (calorie ring should be ~2× larger than other elements)
- [ ] Verify above-fold content (should show: greeting, calorie, actions, workout, stats)

---

## Copy

### Insight Card
- Label: "Insight"
- Example text: "Stay hydrated! Aim for 8 glasses of water per day to boost performance."
- Toast on save: "Saved"
- Toast on remove: "Removed from saved"

### Quick Actions
- "Scan Food"
- "Quick Add"
- "Log Meal"

---

## Screenshots

**Before:**
- Weak hierarchy (all elements same size)
- 4+ quick actions
- Recent foods vertical (large)
- Weekly stats below fold
- Coach tip large

**After:**
- Clear hierarchy (calorie ring hero)
- 3 quick actions
- Recent foods horizontal (compact)
- Weekly stats above fold
- Insight card small, dismissible

---

## Rollback Plan

1. Revert `HomeScreen.js` to previous version
2. Restore old macros card
3. Remove calorie ring hero
4. Redeploy

---

## Related Tickets
- TICKET-004: Fix Discover Screen
- TICKET-006: Unify Card Patterns

---

**Status:** Ready for dev  
**Created:** 2025-10-07  
**Updated:** 2025-10-07

