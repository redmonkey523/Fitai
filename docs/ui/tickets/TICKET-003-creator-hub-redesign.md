# TICKET-003: Creator Hub Redesign

**Priority:** High  
**Effort:** Large (1 week)  
**Dependencies:** TICKET-001 (Reduce Tabs)  
**Assignee:** Frontend Dev + Designer

---

## Description

Redesign Creator Hub screen to match new spec (see `docs/ui/creator-spec.md`). Replace current cluttered UI with clear hierarchy: Header → Stats → Create CTA → Content Tabs → Toolbox.

---

## Acceptance Criteria

- [ ] Header shows real avatar, handle, verified badge
- [ ] Stats row shows 4 metrics (Followers, Programs, Views, Earnings)
- [ ] Primary Create button opens action sheet
- [ ] Content tabs (Published / Drafts / Scheduled) functional
- [ ] Each tab shows real content list or empty state
- [ ] Post rows display thumbnail, title, metadata, status chip
- [ ] Menu (•••) shows actions (View, Edit, Delete)
- [ ] Toolbox sections navigable
- [ ] All empty states have helpful copy + CTA
- [ ] Error states show "Retry" button
- [ ] Offline banner appears when network unavailable
- [ ] First-time coach marks appear once

---

## Implementation Steps

### 1. Create New Components

**Create `src/components/creator/CreatorHeader.tsx`:**
```typescript
// See docs/ui/creator-spec.md Section 5.1 for full code
export const CreatorHeader: React.FC<CreatorHeaderProps> = ({ ... }) => {
  // Implement header with avatar, title, handle, icons
};
```

**Create `src/components/creator/MetricPill.tsx`:**
```typescript
// See docs/ui/creator-spec.md Section 5.2 for full code
export const MetricPill: React.FC<MetricPillProps> = ({ ... }) => {
  // Implement stat pill with value, label, trend
};
```

**Create `src/components/creator/PostRow.tsx`:**
```typescript
// See docs/ui/creator-spec.md Section 5.3 for full code
export const PostRow: React.FC<PostRowProps> = ({ ... }) => {
  // Implement content row with thumbnail, metadata, menu
};
```

**Create `src/components/EmptyState.tsx`:**
```typescript
// See docs/ui/creator-spec.md Section 5.4 for full code
export const EmptyState: React.FC<EmptyStateProps> = ({ ... }) => {
  // Implement empty state with icon, title, subtitle, CTA
};
```

### 2. Refactor CreatorHubScreen.js

**Replace entire screen content:**
```javascript
import { CreatorHeader } from '../components/creator/CreatorHeader';
import { MetricPill } from '../components/creator/MetricPill';
import { PostRow } from '../components/creator/PostRow';
import { EmptyState } from '../components/EmptyState';

export default function CreatorHubScreen({ navigation }) {
  // State
  const [stats, setStats] = useState(null);
  const [activeTab, setActiveTab] = useState('published');
  const [content, setContent] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch stats
  useEffect(() => {
    (async () => {
      try {
        const res = await api.getCreatorStats();
        setStats(res.data);
      } catch (e) {
        console.error('Stats error', e);
      }
    })();
  }, []);

  // Fetch content based on active tab
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const res = await api.getCreatorContent({ status: activeTab });
        setContent(res.data?.items || []);
      } catch (e) {
        console.error('Content error', e);
      } finally {
        setLoading(false);
      }
    })();
  }, [activeTab]);

  // Render methods
  const renderHeader = () => (
    <CreatorHeader
      avatarUrl={user?.avatar || 'https://via.placeholder.com/40'}
      username={user?.username || 'creator'}
      handle={user?.username || user?.email.split('@')[0]}
      verified={user?.verified || false}
      onProfilePress={() => navigation.navigate('Profile')}
      onSettingsPress={() => navigation.navigate('Settings')}
    />
  );

  const renderStats = () => (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.statsRow}>
      <MetricPill label="Followers" value={stats?.totals?.followers || 0} />
      <MetricPill label="Programs" value={stats?.totals?.programs || 0} />
      <MetricPill label="Views" value={stats?.engagement?.views7d || 0} />
      <MetricPill label="Earnings" value={`$${stats?.monetization?.lifetimeEarnings || 0}`} />
    </ScrollView>
  );

  const renderCreateButton = () => (
    <TouchableOpacity
      style={styles.createButton}
      onPress={() => showActionSheet()}
    >
      <Ionicons name="add" size={24} color={COLORS.background.primary} />
      <Text style={styles.createButtonText}>Create</Text>
    </TouchableOpacity>
  );

  const renderContentTabs = () => (
    <View style={styles.tabs}>
      {['published', 'drafts', 'scheduled'].map(tab => (
        <TouchableOpacity
          key={tab}
          onPress={() => setActiveTab(tab)}
          style={[styles.tab, activeTab === tab && styles.activeTab]}
        >
          <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </Text>
          {activeTab === tab && <View style={styles.tabIndicator} />}
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderContentList = () => {
    if (loading) return <ActivityIndicator />;
    
    if (content.length === 0) {
      const emptyStateProps = getEmptyStateProps(activeTab);
      return <EmptyState {...emptyStateProps} />;
    }

    return (
      <FlatList
        data={content}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <PostRow
            {...item}
            onPress={() => navigation.navigate('ProgramDetail', { id: item._id })}
            onMenuPress={() => showMenu(item)}
          />
        )}
      />
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        {renderHeader()}
        {renderStats()}
        {renderCreateButton()}
        {renderContentTabs()}
        {renderContentList()}
      </ScrollView>
    </SafeAreaView>
  );
}
```

### 3. Add Empty State Logic

**Helper function:**
```javascript
const getEmptyStateProps = (tab) => {
  switch (tab) {
    case 'published':
      return {
        icon: 'fitness-outline',
        title: 'Nothing published yet',
        subtitle: 'Share your first workout or program to start growing your audience.',
        ctaLabel: 'Create Content',
        onCtaPress: () => showActionSheet(),
      };
    case 'drafts':
      return {
        icon: 'document-text-outline',
        title: 'No drafts yet',
        subtitle: 'Drafts save automatically while you create. Start a new workout to try it out.',
        ctaLabel: 'Create Workout',
        onCtaPress: () => navigation.navigate('NewWorkout'),
      };
    case 'scheduled':
      return {
        icon: 'alarm-outline',
        title: 'No scheduled posts',
        subtitle: 'Plan ahead—schedule content to publish automatically at a specific time.',
        ctaLabel: 'Learn More',
        onCtaPress: () => Alert.alert('Coming Soon', 'Scheduling feature coming in Phase 2'),
      };
  }
};
```

### 4. Add Action Sheet

**Create button handler:**
```javascript
const showActionSheet = () => {
  const options = [
    '🏋️ New Workout',
    '📅 New Program (multi-week)',
    '🎬 Upload Video',
    '🔴 Go Live (Coming Soon)',
    'Cancel',
  ];

  ActionSheet.showActionSheetWithOptions(
    {
      options,
      cancelButtonIndex: 4,
      title: 'What do you want to create?',
    },
    (buttonIndex) => {
      switch (buttonIndex) {
        case 0:
          navigation.navigate('NewWorkout');
          break;
        case 1:
          navigation.navigate('NewProgram');
          break;
        case 2:
          navigation.navigate('MediaLibrary', { uploadMode: true });
          break;
        case 3:
          Alert.alert('Coming Soon', 'Live streaming coming in Phase 2');
          break;
      }
    }
  );
};
```

### 5. Add Menu Actions

**Post menu handler:**
```javascript
const showMenu = (item) => {
  const options = ['View Analytics', 'Edit', 'Duplicate', 'Delete', 'Cancel'];

  ActionSheet.showActionSheetWithOptions(
    {
      options,
      destructiveButtonIndex: 3,
      cancelButtonIndex: 4,
    },
    async (buttonIndex) => {
      switch (buttonIndex) {
        case 0: // View Analytics
          navigation.navigate('CreatorAnalytics', { contentId: item._id });
          break;
        case 1: // Edit
          const screen = item.type === 'workout' ? 'NewWorkout' : 'NewProgram';
          navigation.navigate(screen, { id: item._id, mode: 'edit' });
          break;
        case 2: // Duplicate
          await api.duplicateContent(item._id);
          Toast.show({ type: 'success', text1: 'Content duplicated' });
          fetchContent(); // Refresh list
          break;
        case 3: // Delete
          Alert.alert(
            'Delete Content?',
            'This will remove it from your profile and followers won't see it anymore.',
            [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Delete',
                style: 'destructive',
                onPress: async () => {
                  await api.deleteContent(item._id);
                  Toast.show({ type: 'success', text1: 'Content deleted' });
                  fetchContent();
                },
              },
            ]
          );
          break;
      }
    }
  );
};
```

### 6. Add Styles

**Use design tokens:**
```javascript
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background.primary,
  },
  statsRow: {
    paddingHorizontal: SIZES.spacing.lg,
    marginVertical: SIZES.spacing.lg,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.accent.primary,
    marginHorizontal: SIZES.spacing.lg,
    paddingVertical: SIZES.spacing.lg,
    borderRadius: SIZES.radius.md,
    ...SHADOWS.glow,
  },
  createButtonText: {
    color: COLORS.background.primary,
    fontSize: FONTS.size.lg,
    fontWeight: FONTS.weight.bold,
    marginLeft: SIZES.spacing.sm,
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: SIZES.spacing.lg,
    marginTop: SIZES.spacing.lg,
    marginBottom: SIZES.spacing.md,
  },
  tab: {
    paddingVertical: SIZES.spacing.md,
    paddingHorizontal: SIZES.spacing.md,
    marginRight: SIZES.spacing.lg,
    position: 'relative',
  },
  activeTab: {},
  tabText: {
    color: COLORS.text.secondary,
    fontSize: FONTS.size.md,
    fontWeight: FONTS.weight.medium,
  },
  activeTabText: {
    color: COLORS.text.primary,
    fontWeight: FONTS.weight.bold,
  },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: COLORS.accent.primary,
    borderRadius: 1,
  },
});
```

---

## Testing

### Manual Tests
- [ ] Launch Creator tab → New UI renders
- [ ] Stats show real data from API
- [ ] Tap Create → Action sheet opens with 4 options
- [ ] Tap "New Workout" → Navigate to NewWorkout
- [ ] Switch tabs (Published/Drafts) → Content updates
- [ ] Empty tabs show empty state with correct copy
- [ ] Tap post → Navigate to detail
- [ ] Tap menu (•••) → Show options
- [ ] Delete post → Show confirmation, delete on confirm
- [ ] No console errors

### Automated Tests
```javascript
describe('CreatorHubScreen', () => {
  it('renders header with user info', () => {
    const { getByText } = render(<CreatorHubScreen />);
    expect(getByText('Creator Studio')).toBeTruthy();
  });

  it('fetches and displays stats', async () => {
    api.getCreatorStats = jest.fn().mockResolvedValue({ data: { totals: { followers: 100 } } });
    const { getByText } = render(<CreatorHubScreen />);
    await waitFor(() => {
      expect(getByText('100')).toBeTruthy();
    });
  });

  it('switches content tabs', async () => {
    const { getByText } = render(<CreatorHubScreen />);
    fireEvent.press(getByText('Drafts'));
    await waitFor(() => {
      // Assert drafts content shown
    });
  });
});
```

---

## Screenshots

**Before:** Cluttered with "Add Block" sections, mock data  
**After:** Clean hierarchy, real data, empty states

---

## Rollback Plan

1. Revert `CreatorHubScreen.js` to previous version
2. Remove new components (`CreatorHeader`, `MetricPill`, etc.)
3. Redeploy

---

## Related Tickets
- TICKET-001: Reduce Bottom Tabs
- TICKET-004: Fill Creator Analytics Screen
- TICKET-005: Fill Creator Drafts Tab

---

**Status:** Ready for dev  
**Created:** 2025-10-07  
**Updated:** 2025-10-07

