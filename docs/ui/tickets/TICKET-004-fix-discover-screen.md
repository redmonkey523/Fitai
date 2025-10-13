# TICKET-004: Fix Discover Screen (Remove Blanks + Duplicates)

**Priority:** High  
**Effort:** Medium (2-3 days)  
**Dependencies:** TICKET-001 (nav restructure)  
**Assignee:** Frontend Dev

---

## Description

Fix Discover screen based on screenshot analysis:
1. **Remove blank tabs** (Trending, Programs show no content)
2. **Eliminate duplicate coach cards** (same coaches appear on Home tab)
3. **Reduce tabs from 4 to 2 rails**
4. **Add empty states** for all empty sections
5. **Shrink hero image** (currently takes too much space)

---

## Acceptance Criteria

- [ ] No blank tabs (all show content or empty state)
- [ ] Coach cards only in Discover (removed from Home if duplicated)
- [ ] 2 rails: "For You" (personalized) + "Explore" (filter chips)
- [ ] Hero image height reduced to 200pt (from ~300pt)
- [ ] All empty sections show EmptyState with helpful copy + CTA
- [ ] Badge styles unified (TRENDING, TOP RATED, NEW)
- [ ] No console errors

---

## Current Issues (from Screenshots)

### 1. Blank Tabs
- **Trending tab:** Shows no content (completely empty)
- **Programs tab:** Shows no content (completely empty)
- **Impact:** Users think feature is broken

### 2. Duplicate Content
- **Coaches tab:** Shows same coach cards as Home tab "For You" section
- **Impact:** Confusing, wastes screen space

### 3. Poor Information Hierarchy
- **4 tabs:** Home / Trending / Coaches / Programs (too many options)
- **Hero image:** Takes up ~300pt (pushes content below fold)
- **Badge inconsistency:** Different styles across cards

---

## Implementation Steps

### 1. Restructure Tabs → Rails

**Remove tab navigation:**
```javascript
// DELETE old tab structure:
const tabs = ['home', 'trending', 'coaches', 'programs'];
```

**Add rail structure:**
```javascript
const rails = ['forYou', 'explore'];

// Filter chips for Explore rail
const exploreFilters = ['trending', 'topRated', 'new'];
```

**UI Structure:**
```javascript
<View style={styles.container}>
  {renderHero()} {/* Shrink to 200pt */}
  
  <View style={styles.railSelector}>
    <TouchableOpacity onPress={() => setActiveRail('forYou')}>
      <Text>For You</Text>
    </TouchableOpacity>
    <TouchableOpacity onPress={() => setActiveRail('explore')}>
      <Text>Explore</Text>
    </TouchableOpacity>
  </View>
  
  {activeRail === 'forYou' && renderForYou()}
  {activeRail === 'explore' && renderExplore()}
</View>
```

### 2. Shrink Hero Image

**Current:**
```javascript
<ImageBackground style={{ height: 300 }} ... />
```

**Updated:**
```javascript
<ImageBackground style={{ height: 200, marginBottom: 12 }} ... />
```

**Adjust gradient overlay:**
```javascript
<LinearGradient
  colors={['rgba(11,11,18,0.1)', 'rgba(11,11,18,0.85)']} // Lighter gradient
  style={styles.heroOverlay}
>
  <Text style={styles.heroTitle}>CHAMPION{"\n"}YOURSELF</Text>
  <TouchableOpacity style={styles.heroCta}>
    <Text>Join My Program</Text>
  </TouchableOpacity>
</LinearGradient>
```

### 3. Implement "For You" Rail

**Personalized content:**
```javascript
const renderForYou = () => {
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState([]);
  
  useEffect(() => {
    (async () => {
      try {
        const res = await api.getDiscover({ tab: 'for_you', personalized: true });
        setContent(res.data?.programs || []);
      } catch (e) {
        console.error('For You error', e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);
  
  if (loading) return <SkeletonCards count={3} />;
  
  if (content.length === 0) {
    return (
      <EmptyState
        icon="compass-outline"
        title="Your personalized feed"
        subtitle="Follow coaches and programs to see recommendations here."
        ctaLabel="Browse Coaches"
        onCtaPress={() => setActiveRail('explore')}
      />
    );
  }
  
  return (
    <FlatList
      data={content}
      keyExtractor={(item) => item._id}
      renderItem={renderProgramCard}
      ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
    />
  );
};
```

### 4. Implement "Explore" Rail

**Filter chips + content:**
```javascript
const renderExplore = () => {
  const [activeFilter, setActiveFilter] = useState('trending');
  const [content, setContent] = useState([]);
  
  const filters = [
    { id: 'trending', label: 'Trending', icon: 'trending-up' },
    { id: 'topRated', label: 'Top Rated', icon: 'star' },
    { id: 'new', label: 'New', icon: 'sparkles' },
  ];
  
  useEffect(() => {
    (async () => {
      try {
        const res = await api.getDiscover({ tab: activeFilter });
        setContent(res.data || []);
      } catch (e) {
        console.error('Explore error', e);
      }
    })();
  }, [activeFilter]);
  
  return (
    <View>
      {/* Filter chips */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
        {filters.map(filter => (
          <TouchableOpacity
            key={filter.id}
            style={[
              styles.filterChip,
              activeFilter === filter.id && styles.filterChipActive
            ]}
            onPress={() => setActiveFilter(filter.id)}
          >
            <Ionicons name={filter.icon} size={16} color={activeFilter === filter.id ? COLORS.accent.primary : COLORS.text.secondary} />
            <Text style={[styles.filterText, activeFilter === filter.id && styles.filterTextActive]}>
              {filter.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      
      {/* Content */}
      {content.length === 0 ? (
        <EmptyState
          icon={activeFilter === 'trending' ? 'trending-up' : 'star'}
          title={`No ${activeFilter} content yet`}
          subtitle={getEmptySubtitle(activeFilter)}
          ctaLabel="Browse All"
          onCtaPress={() => setActiveFilter('all')}
        />
      ) : (
        <FlatList
          data={content}
          keyExtractor={(item) => item._id}
          renderItem={renderCard}
        />
      )}
    </View>
  );
};

const getEmptySubtitle = (filter) => {
  switch (filter) {
    case 'trending':
      return 'New programs coming soon. Follow coaches to get notified.';
    case 'topRated':
      return 'Top-rated programs will appear here as users rate content.';
    case 'new':
      return 'Check back soon for newly published programs.';
    default:
      return 'No content available at the moment.';
  }
};
```

### 5. Remove Duplicate Coach Cards from Home

**Update HomeScreen.js:**
```javascript
// REMOVE renderCoachCards section if it duplicates Discover
// OR make it show different coaches (e.g., "Recommended for you" subset)

// If keeping on Home, fetch different coaches:
const fetchHomeCoaches = async () => {
  const res = await api.getCoaches({ featured: true, limit: 3 });
  // Only show 3 featured coaches on Home (different from Discover)
  setHomeCoaches(res.data.slice(0, 3));
};
```

**Option 1: Remove entirely**
```javascript
// Delete renderCoachCards() function
// Remove from render()
```

**Option 2: Show different subset**
```javascript
const renderFeaturedCoaches = () => (
  <View style={styles.section}>
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>Featured Coaches</Text>
      <TouchableOpacity onPress={() => navigation.navigate('Discover', { rail: 'explore' })}>
        <Text style={styles.seeAll}>See All →</Text>
      </TouchableOpacity>
    </View>
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      {featuredCoaches.slice(0, 3).map(coach => (
        <CoachCard key={coach._id} coach={coach} style={styles.smallCoachCard} />
      ))}
    </ScrollView>
  </View>
);
```

### 6. Unify Badge Styles

**Create badge component:**
```javascript
// src/components/Badge.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, FONTS, SIZES } from '../constants/theme';

interface BadgeProps {
  type: 'trending' | 'topRated' | 'live' | 'new' | 'free';
  label: string;
}

export const Badge: React.FC<BadgeProps> = ({ type, label }) => {
  const bgColor = {
    trending: '#ef4444',
    topRated: '#22c55e',
    live: '#ef4444',
    new: '#3b82f6',
    free: '#22c55e',
  }[type];
  
  return (
    <View style={[styles.badge, { backgroundColor: bgColor }]}>
      <Text style={styles.badgeText}>{label.toUpperCase()}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  badgeText: {
    color: COLORS.text.primary,
    fontSize: FONTS.size.xs,
    fontWeight: FONTS.weight.bold,
    letterSpacing: 0.5,
  },
});
```

**Use in cards:**
```javascript
import { Badge } from '../components/Badge';

const renderProgramCard = ({ item }) => (
  <Card>
    <Badge type="trending" label="Trending" />
    <Text>{item.title}</Text>
    {/* ... rest of card ... */}
  </Card>
);
```

### 7. Add Empty States

**Import EmptyState component:**
```javascript
import { EmptyState } from '../components/EmptyState';
```

**Use for empty sections:**
```javascript
// Trending empty
<EmptyState
  icon="trending-up"
  title="No trending programs yet"
  subtitle="New programs coming soon. Follow coaches to get notified."
  ctaLabel="Browse Coaches"
  onCtaPress={() => setActiveRail('explore')}
/>

// Programs empty
<EmptyState
  icon="calendar-outline"
  title="No programs yet"
  subtitle="Start with our Starter Pack to build your first routine."
  ctaLabel="View Starter Pack"
  onCtaPress={() => navigation.navigate('ProgramDetail', { id: 'starter-pack' })}
/>

// Coaches empty (shouldn't happen, but just in case)
<EmptyState
  icon="people-outline"
  title="No coaches found"
  subtitle="Check back soon as we onboard more fitness professionals."
  ctaLabel="Refresh"
  onCtaPress={() => fetchCoaches()}
/>
```

---

## Testing

### Manual Tests
- [ ] Launch Discover → No blank tabs visible
- [ ] Tap "For You" → Shows personalized content or empty state
- [ ] Tap "Explore" → Shows filter chips (Trending, Top Rated, New)
- [ ] Tap each filter → Shows content or empty state (not blank)
- [ ] Hero image height = 200pt (measure with developer tools)
- [ ] Badges uniform (all same style: 8pt radius, uppercase text)
- [ ] Scroll performance smooth (60fps)
- [ ] No duplicate coach cards between Home and Discover
- [ ] No console errors

### Automated Tests
```javascript
describe('DiscoverScreen', () => {
  it('shows two rails: For You and Explore', () => {
    const { getByText } = render(<DiscoverScreen />);
    expect(getByText('For You')).toBeTruthy();
    expect(getByText('Explore')).toBeTruthy();
  });
  
  it('shows empty state when For You is empty', async () => {
    api.getDiscover = jest.fn().mockResolvedValue({ data: { programs: [] } });
    const { getByText } = render(<DiscoverScreen />);
    await waitFor(() => {
      expect(getByText(/personalized feed/i)).toBeTruthy();
      expect(getByText('Browse Coaches')).toBeTruthy();
    });
  });
  
  it('shows filter chips in Explore rail', () => {
    const { getByText } = render(<DiscoverScreen />);
    fireEvent.press(getByText('Explore'));
    expect(getByText('Trending')).toBeTruthy();
    expect(getByText('Top Rated')).toBeTruthy();
    expect(getByText('New')).toBeTruthy();
  });
});
```

---

## Copy (from copy.md)

### Rail Labels
- "For You" (personalized)
- "Explore" (browse all)

### Filter Chip Labels
- "Trending" (with trending-up icon)
- "Top Rated" (with star icon)
- "New" (with sparkles icon)

### Empty States

**For You Empty:**
- Icon: `compass-outline`
- Title: "Your personalized feed"
- Subtitle: "Follow coaches and programs to see recommendations here."
- CTA: "Browse Coaches"

**Trending Empty:**
- Icon: `trending-up`
- Title: "No trending programs yet"
- Subtitle: "New programs coming soon. Follow coaches to get notified."
- CTA: "Browse Coaches"

**Top Rated Empty:**
- Icon: `star`
- Title: "No top-rated programs yet"
- Subtitle: "Top-rated programs will appear here as users rate content."
- CTA: "Browse All"

**New Empty:**
- Icon: `sparkles`
- Title: "No new programs yet"
- Subtitle: "Check back soon for newly published programs."
- CTA: "Browse All"

---

## Screenshots

**Before:**
- 4 tabs, 2 blank (Trending, Programs)
- Duplicate coach cards
- Hero too large (300pt)

**After:**
- 2 rails, 0 blank (all show content or empty state)
- No duplicates
- Hero optimized (200pt)

---

## Rollback Plan

1. Revert `DiscoverScreen.js` to previous version
2. Restore old tab structure
3. Re-add coach cards to Home (if removed)
4. Redeploy

---

## Related Tickets
- TICKET-001: Reduce Bottom Tabs
- TICKET-005: Improve Home Dashboard
- TICKET-006: Unify Card Patterns

---

**Status:** Ready for dev  
**Created:** 2025-10-07  
**Updated:** 2025-10-07

