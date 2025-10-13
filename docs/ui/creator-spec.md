# Creator Experience Specification

**Project:** FitAI Creator Studio  
**Date:** October 7, 2025  
**Platform:** React Native (iOS/Android)  
**Design Fidelity:** Production-ready spec with tokens and component IDs

---

## 1. Overview

The **Creator Studio** is a unified hub where fitness creators manage their content, track performance, and grow their audience. This spec replaces the current fragmented Creator experience.

### 1.1 Current Problems
- ❌ Creator features split across **Creator tab** + **Profile "Create & Share"**
- ❌ Duplicate sections ("Drafts" and "Drafts 2" on same screen)
- ❌ Blank screens (CreatorDrafts, CreatorAnalytics have no content)
- ❌ Mock data hardcoded in JSX (not real backend data)
- ❌ Unclear hierarchy (too many "Add Block" buttons)

### 1.2 Design Goals
1. **Single source of truth** - All creator actions in one place
2. **Clear hierarchy** - Header → Stats → Primary CTA → Content → Toolbox
3. **Real content** - No placeholder lorem, pull from API
4. **Empty states** - Every section has helpful copy + CTA when empty
5. **Monetization-ready** - Hooks for pricing, payouts (Phase 2)

---

## 2. Creator Home (Main Screen)

### 2.1 Header

**Layout:**
```
┌────────────────────────────────────────┐
│ [Avatar] Creator Studio      [Profile] [Settings] │
│          @handle                       │
│          ○ Verified Creator            │
└────────────────────────────────────────┘
```

**Specs:**
- Height: 80pt (including safe area)
- Background: `color.background.secondary`
- Avatar: 40×40pt, circular, tappable → navigates to `CreatorProfileEditor`
- Title: "Creator Studio" (H2, 24pt, bold)
- Handle: "@{username}" (Body Small, 14pt, secondary color)
- Badge: Verified checkmark icon (if creator.verified === true)
- Icons: Profile (person-circle-outline), Settings (settings-outline)

**Props:**
```typescript
interface CreatorHeaderProps {
  avatarUrl: string;
  username: string;
  handle: string;
  verified: boolean;
  onProfilePress: () => void;
  onSettingsPress: () => void;
}
```

**Copy:**
- Title: "Creator Studio"
- Handle format: `@${user.username || user.email.split('@')[0]}`
- Verified badge (if verified): "Verified Creator"

**Data Source:**
```javascript
GET /api/creator/profile
→ { avatar, username, handle, verified, status: 'active' | 'pending' | 'none' }
```

---

### 2.2 Stats Row

**Layout:**
```
┌─────────┬─────────┬─────────┬─────────┐
│  42.3k  │    8    │  12.1k  │  $0.00  │
│Followers│Programs │ Views   │Earnings │
└─────────┴─────────┴─────────┴─────────┘
```

**Specs:**
- 4 stat pills in horizontal scroll (if needed on small devices)
- Each pill:
  - Background: `color.background.card`
  - Padding: 16pt vertical, 12pt horizontal
  - Border radius: `radius.md` (12pt)
  - Shadow: `shadow.medium`
  - Gap: 8pt between pills
- Value: H2 (24pt, bold, primary color)
- Label: Caption (12pt, secondary color)

**Props:**
```typescript
interface MetricPillProps {
  label: string;
  value: string | number;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string; // e.g., "+12.5%"
  icon?: string; // Ionicons name
  onPress?: () => void;
}
```

**Stats:**
| Metric | Source | Fallback |
|--------|--------|----------|
| **Followers** | `stats.totals.followers` | 0 |
| **Programs** | `stats.totals.programs` | 0 |
| **7-Day Views** | `stats.engagement.views7d` | 0 |
| **Earnings** | `stats.monetization.lifetimeEarnings` | "$0.00" (if not enabled) |

**Data Source:**
```javascript
GET /api/creator/stats
→ {
  totals: { followers, programs, workouts },
  engagement: { views7d, likes7d, shares7d },
  monetization: { lifetimeEarnings, currentBalance, currency }
}
```

**Empty State:**
- If all stats are 0: Show "Just getting started? Create your first program to grow your audience."

---

### 2.3 Primary CTA (Create Button)

**Layout:**
```
┌──────────────────────────────────────────┐
│            [+ Create]                    │
└──────────────────────────────────────────┘
```

**Specs:**
- Width: Full width minus 32pt horizontal padding
- Height: 56pt (lg button)
- Background: Gradient `color.gradient.primary` (cyan to blue)
- Text: "Create" (18pt, bold, on-primary color)
- Icon: Plus icon (24pt)
- Shadow: `shadow.glow` (neon glow effect)
- Border radius: `radius.md` (12pt)

**Interaction:**
- Tap → Opens **Action Sheet** with options:
  - "New Workout" → Navigate to `NewWorkout`
  - "New Program" → Navigate to `NewProgram`
  - "Upload Video" → Navigate to `MediaLibrary` with upload mode
  - "Go Live" (Phase 2) → Coming soon toast

**Props:**
```typescript
interface CreateButtonProps {
  onPress: () => void;
  disabled?: boolean;
  label?: string; // default: "Create"
}
```

**Action Sheet (iOS) / Bottom Sheet (Android):**
```
┌──────────────────────────────────────┐
│ What do you want to create?         │
├──────────────────────────────────────┤
│ 🏋️ New Workout                      │
│ 📅 New Program (multi-week)          │
│ 🎬 Upload Video                      │
│ 🔴 Go Live (Coming Soon)            │
├──────────────────────────────────────┤
│ Cancel                               │
└──────────────────────────────────────┘
```

---

### 2.4 Content Tabs (Segmented Control)

**Layout:**
```
┌─────────┬─────────┬─────────┐
│Published│ Drafts  │Scheduled│  ← Active tab underlined
└─────────┴─────────┴─────────┘
```

**Specs:**
- Height: 48pt
- Background: Transparent
- Active tab:
  - Text: `color.text.primary` (white)
  - Underline: 2pt, `color.accent.primary` (cyan)
  - Font weight: bold
- Inactive tab:
  - Text: `color.text.secondary` (gray)
  - Font weight: medium
- Spacing: 24pt horizontal padding from edges
- Gap: 16pt between tabs

**Tabs:**
1. **Published** - Live content (workouts, programs)
2. **Drafts** - Unpublished work in progress
3. **Scheduled** (Phase 2) - Content scheduled for auto-publish

**Props:**
```typescript
interface ContentTabsProps {
  activeTab: 'published' | 'drafts' | 'scheduled';
  onTabChange: (tab: string) => void;
  counts: {
    published: number;
    drafts: number;
    scheduled: number;
  };
}
```

**Display Counts (optional badge):**
- Show count next to label if >0: "Drafts (3)"

---

### 2.5 Content List (Per Tab)

#### 2.5.1 Published Tab

**Layout (List Item):**
```
┌────────────────────────────────────────┐
│ [Thumbnail] Upper Body Pump       [•••]│
│             Workout • Beginner         │
│             👁 1.2k views • 45 min     │
│             ⚡ Published 2 days ago     │
└────────────────────────────────────────┘
```

**Specs:**
- Background: `color.background.card`
- Padding: 12pt
- Border radius: `radius.md` (12pt)
- Shadow: `shadow.small`
- Gap: 8pt between cards

**Item Anatomy:**
- **Thumbnail:** 88×56pt, left-aligned, rounded corners (radius.sm)
- **Title:** H3 (20pt, bold, primary color), max 2 lines
- **Metadata row 1:** Type • Level (Body Small, secondary color)
- **Metadata row 2:** Views, duration (Body Small, tertiary color, with icons)
- **Status chip:** "Published X days ago" (Caption, success color)
- **Menu button:** Three dots (•••), 48×48pt touch target

**Props:**
```typescript
interface PostRowProps {
  id: string;
  thumbnail: string;
  title: string;
  type: 'workout' | 'program';
  level: 'beginner' | 'intermediate' | 'advanced';
  views: number;
  duration: number; // in minutes
  publishedAt: Date;
  status: 'published' | 'draft' | 'scheduled';
  onPress: () => void;
  onMenuPress: () => void;
}
```

**Menu Options (•••):**
- View Analytics
- Edit
- Duplicate
- Delete (with confirmation)

**Data Source:**
```javascript
GET /api/creator/content?status=published&page=1&limit=20
→ {
  items: [
    {
      _id, title, type, thumbnail, level, views, duration, publishedAt, status
    }
  ],
  total, page, pages
}
```

**Empty State (No Published Content):**
```
       [🎯 Icon]
       
       Nothing published yet
       
       Share your first workout or program
       to start growing your audience.
       
       [Create Content]
```

**Copy:**
- Icon: Target (fitness-outline)
- Title: "Nothing published yet"
- Subtitle: "Share your first workout or program to start growing your audience."
- CTA: "Create Content" → Opens Create action sheet

---

#### 2.5.2 Drafts Tab

**Layout (List Item - Same as Published but with Draft status):**
```
┌────────────────────────────────────────┐
│ [Thumbnail] Core Crusher          [•••]│
│             Program • Intermediate     │
│             📝 Draft                    │
│             ⏱ Last edited 3 hours ago  │
└────────────────────────────────────────┘
```

**Specs:** Same as Published, but:
- **Status chip:** "Draft" (Caption, warning color)
- **Last edited:** Instead of views, show "Last edited X ago"

**Menu Options (•••):**
- Resume editing
- Publish (if complete)
- Duplicate
- Delete (with confirmation: "Delete draft? This cannot be undone.")

**Data Source:**
```javascript
GET /api/creator/content?status=draft&page=1&limit=20
```

**Empty State (No Drafts):**
```
       [📝 Icon]
       
       No drafts yet
       
       Drafts save automatically while you
       create. Start a new workout to try it out.
       
       [Create Workout]
```

**Copy:**
- Icon: Document text (document-text-outline)
- Title: "No drafts yet"
- Subtitle: "Drafts save automatically while you create. Start a new workout to try it out."
- CTA: "Create Workout" → Navigate to NewWorkout

---

#### 2.5.3 Scheduled Tab (Phase 2)

**Layout (List Item):**
```
┌────────────────────────────────────────┐
│ [Thumbnail] Leg Day Strong        [•••]│
│             Workout • Advanced         │
│             ⏰ Scheduled                │
│             📅 Publishes Oct 10, 9am   │
└────────────────────────────────────────┘
```

**Empty State (No Scheduled Content):**
```
       [⏰ Icon]
       
       No scheduled posts
       
       Plan ahead—schedule content to publish
       automatically at a specific time.
       
       [Learn More]
```

**Copy:**
- Icon: Alarm (alarm-outline)
- Title: "No scheduled posts"
- Subtitle: "Plan ahead—schedule content to publish automatically at a specific time."
- CTA: "Learn More" → Shows modal explaining scheduling (Phase 2 feature)

---

### 2.6 Toolbox (Expandable Sections)

**Layout:**
```
┌────────────────────────────────────────┐
│ 🎨 Templates & Tools               [>] │  ← Expandable
├────────────────────────────────────────┤
│ 💰 Monetization                    [>] │
├────────────────────────────────────────┤
│ 📊 Analytics                       [>] │
├────────────────────────────────────────┤
│ 🛡️ Creator Policies                [>] │
└────────────────────────────────────────┘
```

**Specs:**
- Background: `color.background.card`
- Padding: 16pt
- Border radius: `radius.md` (12pt)
- Shadow: `shadow.medium`
- Gap: 1pt divider between rows

#### 2.6.1 Templates & Tools (Expanded)

**Content:**
- **Workout Templates:** 10+ pre-built workout plans (Beginner Push-Pull-Legs, HIIT Starter, etc.)
- **Program Templates:** 5+ multi-week programs (12-Week Mass Builder, 8-Week Cut, etc.)
- **Audio Library:** 50+ royalty-free workout music tracks
- **Brand Kit:** Upload logo, set brand colors, add watermarks
- **Video Effects:** Filters, transitions, text overlays

**Action:**
- Tap row → Navigate to `ProgramTemplateScreen` with template listings

#### 2.6.2 Monetization (Expanded)

**Content (if eligible):**
- **Enable Monetization:** Toggle switch
- **Pricing:** Set price per workout ($4.99, $9.99, $19.99, or custom)
- **Subscription Tiers:** Free, Pro ($9.99/mo), Elite ($19.99/mo)
- **Payout Health:** Current balance, next payout date, payment method
- **Earnings Breakdown:** Chart of earnings over time

**Empty State (Not Eligible):**
```
       [💰 Icon]
       
       Monetization not available yet
       
       You need at least 100 followers and
       3 published programs to enable monetization.
       
       Current: 42 followers, 1 program
       
       [Learn More]
```

**Action:**
- If eligible → Navigate to `MonetizationSettingsScreen`
- If not eligible → Show requirements modal

#### 2.6.3 Analytics (Expanded)

**Content:**
- **Overview:** Total views, engagement rate, follower growth (last 7/30 days)
- **Top Performing:** List of top 5 workouts by views
- **Audience Demographics:** Age, gender, location (if available)
- **Traffic Sources:** Discover tab, search, direct links, shares

**Action:**
- Tap row → Navigate to `CreatorAnalyticsScreen`

#### 2.6.4 Creator Policies (Expanded)

**Content:**
- **Community Guidelines:** Link to rules (no harmful content, etc.)
- **Copyright Policy:** Use only music you own/license
- **Terms of Service:** Creator agreement
- **Safety Center:** Report abusive users, appeal decisions

**Action:**
- Tap row → Navigate to web view or in-app policy screens

**Empty State (if needed):**
- Show "Coming Soon" toast if section not implemented yet

---

## 3. Error & Offline States

### 3.1 Network Error (API Failure)

**When stats fail to load:**
```
┌────────────────────────────────────────┐
│ [⚠️ Icon]                              │
│                                        │
│ Unable to load creator stats           │
│                                        │
│ Check your connection and try again.   │
│                                        │
│ [Retry]                                │
└────────────────────────────────────────┘
```

**Copy:**
- Icon: Warning (warning-outline)
- Title: "Unable to load creator stats"
- Subtitle: "Check your connection and try again."
- CTA: "Retry" → Refetch API

### 3.2 Offline Mode

**Show banner at top:**
```
┌────────────────────────────────────────┐
│ 📡 You're offline. Some features may   │
│    be limited until you reconnect.     │
└────────────────────────────────────────┘
```

**Disabled actions when offline:**
- Create button (show toast: "You need internet to create content")
- Upload media
- Publish drafts

**Cached content:**
- Show last loaded content list (if cached)
- Allow viewing drafts (if stored locally)

### 3.3 Authentication Error (Token Expired)

**Action:**
- Show toast: "Session expired. Please log in again."
- Redirect to AuthScreen

---

## 4. First-Time Experience (Coach Marks)

**When user first opens Creator Studio (creatorOnboarded === false):**

**Step 1/3: Highlight Primary CTA**
```
┌────────────────────────────────────────┐
│ [+ Create] ← ← ← ← ← ← ← ← ← ← ← ← ← │
│                                        │
│ Tap here to create your first workout  │
│ or program. It's quick and easy!      │
│                                        │
│ [Next]    [Skip Tour]                  │
└────────────────────────────────────────┘
```

**Step 2/3: Highlight Content Tabs**
```
┌────────────────────────────────────────┐
│ [Published] [Drafts] [Scheduled]       │
│      ↑                                 │
│                                        │
│ Switch between published content and   │
│ work-in-progress drafts.               │
│                                        │
│ [Next]    [Skip Tour]                  │
└────────────────────────────────────────┘
```

**Step 3/3: Highlight Toolbox**
```
┌────────────────────────────────────────┐
│ 🎨 Templates & Tools               [>] │
│      ↑                                 │
│                                        │
│ Explore templates, monetization, and   │
│ analytics to grow your creator brand.  │
│                                        │
│ [Done]                                 │
└────────────────────────────────────────┘
```

**Props:**
```typescript
interface CoachMarkProps {
  step: number;
  totalSteps: number;
  title: string;
  message: string;
  targetElement: React.RefObject<View>;
  onNext: () => void;
  onSkip: () => void;
}
```

**Persistence:**
- After tour completes → Set `user.creatorOnboarded = true` in backend
- Never show again (unless user taps "Show Tutorial" in Settings)

---

## 5. Component Breakdown (Dev Handoff)

### 5.1 CreatorHeader.tsx

```typescript
import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SIZES } from '../constants/theme';

interface CreatorHeaderProps {
  avatarUrl: string;
  username: string;
  handle: string;
  verified: boolean;
  onProfilePress: () => void;
  onSettingsPress: () => void;
}

export const CreatorHeader: React.FC<CreatorHeaderProps> = ({
  avatarUrl,
  username,
  handle,
  verified,
  onProfilePress,
  onSettingsPress,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.leftSection}>
        <TouchableOpacity onPress={onProfilePress} accessibilityLabel="Edit creator profile">
          <Image source={{ uri: avatarUrl }} style={styles.avatar} />
        </TouchableOpacity>
        <View style={styles.info}>
          <Text style={styles.title}>Creator Studio</Text>
          <Text style={styles.handle}>@{handle}</Text>
          {verified && (
            <View style={styles.verifiedRow}>
              <Ionicons name="checkmark-circle" size={14} color={COLORS.accent.success} />
              <Text style={styles.verifiedText}>Verified Creator</Text>
            </View>
          )}
        </View>
      </View>
      <View style={styles.rightSection}>
        <TouchableOpacity
          style={styles.iconButton}
          onPress={onProfilePress}
          accessibilityLabel="Creator profile settings"
        >
          <Ionicons name="person-circle-outline" size={24} color={COLORS.text.primary} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.iconButton}
          onPress={onSettingsPress}
          accessibilityLabel="Creator settings"
        >
          <Ionicons name="settings-outline" size={24} color={COLORS.text.primary} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SIZES.spacing.lg,
    paddingVertical: SIZES.spacing.md,
    backgroundColor: COLORS.background.secondary,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: SIZES.spacing.md,
  },
  info: {
    flex: 1,
  },
  title: {
    color: COLORS.text.primary,
    fontSize: FONTS.size.xxl,
    fontWeight: FONTS.weight.bold,
  },
  handle: {
    color: COLORS.text.secondary,
    fontSize: FONTS.size.sm,
    marginTop: 2,
  },
  verifiedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  verifiedText: {
    color: COLORS.text.secondary,
    fontSize: FONTS.size.xs,
    marginLeft: 4,
  },
  rightSection: {
    flexDirection: 'row',
    gap: SIZES.spacing.sm,
  },
  iconButton: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
```

### 5.2 MetricPill.tsx

```typescript
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SIZES, SHADOWS } from '../constants/theme';

interface MetricPillProps {
  label: string;
  value: string | number;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  icon?: string;
  onPress?: () => void;
}

export const MetricPill: React.FC<MetricPillProps> = ({
  label,
  value,
  trend,
  trendValue,
  icon,
  onPress,
}) => {
  const Container = onPress ? TouchableOpacity : View;

  const formatValue = (val: string | number): string => {
    if (typeof val === 'number') {
      if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M`;
      if (val >= 1000) return `${(val / 1000).toFixed(1)}k`;
      return val.toString();
    }
    return val;
  };

  const trendColor = trend === 'up' ? COLORS.accent.success : trend === 'down' ? COLORS.accent.error : COLORS.text.secondary;
  const trendIcon = trend === 'up' ? 'trending-up' : trend === 'down' ? 'trending-down' : null;

  return (
    <Container
      style={styles.container}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
      accessibilityLabel={`${label}: ${value}${trendValue ? `, ${trendValue}` : ''}`}
      accessibilityRole={onPress ? 'button' : 'text'}
    >
      {icon && <Ionicons name={icon as any} size={20} color={COLORS.accent.primary} style={styles.icon} />}
      <Text style={styles.value}>{formatValue(value)}</Text>
      <Text style={styles.label}>{label}</Text>
      {trend && trendValue && (
        <View style={styles.trendRow}>
          {trendIcon && <Ionicons name={trendIcon as any} size={12} color={trendColor} />}
          <Text style={[styles.trendText, { color: trendColor }]}>{trendValue}</Text>
        </View>
      )}
    </Container>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.background.card,
    paddingVertical: SIZES.spacing.lg,
    paddingHorizontal: SIZES.spacing.md,
    borderRadius: SIZES.radius.md,
    alignItems: 'center',
    minWidth: 80,
    ...SHADOWS.medium,
  },
  icon: {
    marginBottom: SIZES.spacing.xs,
  },
  value: {
    color: COLORS.text.primary,
    fontSize: FONTS.size.xxl,
    fontWeight: FONTS.weight.bold,
    marginBottom: SIZES.spacing.xs,
  },
  label: {
    color: COLORS.text.secondary,
    fontSize: FONTS.size.xs,
    textAlign: 'center',
  },
  trendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SIZES.spacing.xs,
  },
  trendText: {
    fontSize: FONTS.size.xs,
    marginLeft: 2,
  },
});
```

### 5.3 PostRow.tsx

```typescript
import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SIZES, SHADOWS } from '../constants/theme';

interface PostRowProps {
  id: string;
  thumbnail: string;
  title: string;
  type: 'workout' | 'program';
  level: 'beginner' | 'intermediate' | 'advanced';
  views: number;
  duration: number;
  publishedAt?: Date;
  lastEditedAt?: Date;
  status: 'published' | 'draft' | 'scheduled';
  onPress: () => void;
  onMenuPress: () => void;
}

export const PostRow: React.FC<PostRowProps> = ({
  thumbnail,
  title,
  type,
  level,
  views,
  duration,
  publishedAt,
  lastEditedAt,
  status,
  onPress,
  onMenuPress,
}) => {
  const formatTime = (date: Date): string => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    return 'Just now';
  };

  const statusColor = status === 'published' ? COLORS.accent.success : status === 'draft' ? COLORS.accent.warning : COLORS.accent.tertiary;
  const statusLabel = status === 'published' ? `Published ${publishedAt ? formatTime(publishedAt) : ''}` : status === 'draft' ? 'Draft' : 'Scheduled';

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.7}
      accessibilityLabel={`${title}, ${type}, ${level}, ${status}`}
      accessibilityRole="button"
    >
      <Image source={{ uri: thumbnail }} style={styles.thumbnail} />
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={2}>{title}</Text>
        <Text style={styles.metadata}>
          {type.charAt(0).toUpperCase() + type.slice(1)} • {level.charAt(0).toUpperCase() + level.slice(1)}
        </Text>
        {status === 'published' && (
          <View style={styles.row}>
            <Ionicons name="eye-outline" size={14} color={COLORS.text.tertiary} />
            <Text style={styles.views}>{views >= 1000 ? `${(views / 1000).toFixed(1)}k` : views} views</Text>
            <Text style={styles.divider}>•</Text>
            <Text style={styles.duration}>{duration} min</Text>
          </View>
        )}
        {status === 'draft' && lastEditedAt && (
          <View style={styles.row}>
            <Ionicons name="time-outline" size={14} color={COLORS.text.tertiary} />
            <Text style={styles.views}>Last edited {formatTime(lastEditedAt)}</Text>
          </View>
        )}
        <View style={[styles.statusChip, { backgroundColor: `${statusColor}22` }]}>
          <Text style={[styles.statusText, { color: statusColor }]}>{statusLabel}</Text>
        </View>
      </View>
      <TouchableOpacity
        style={styles.menuButton}
        onPress={onMenuPress}
        accessibilityLabel="More options"
        accessibilityRole="button"
      >
        <Ionicons name="ellipsis-vertical" size={20} color={COLORS.text.secondary} />
      </TouchableOpacity>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: COLORS.background.card,
    borderRadius: SIZES.radius.md,
    padding: SIZES.spacing.md,
    marginBottom: SIZES.spacing.sm,
    ...SHADOWS.small,
  },
  thumbnail: {
    width: 88,
    height: 56,
    borderRadius: SIZES.radius.sm,
    marginRight: SIZES.spacing.md,
  },
  content: {
    flex: 1,
  },
  title: {
    color: COLORS.text.primary,
    fontSize: FONTS.size.lg,
    fontWeight: FONTS.weight.bold,
    marginBottom: SIZES.spacing.xs,
  },
  metadata: {
    color: COLORS.text.secondary,
    fontSize: FONTS.size.sm,
    marginBottom: SIZES.spacing.xs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SIZES.spacing.xs,
  },
  views: {
    color: COLORS.text.tertiary,
    fontSize: FONTS.size.sm,
    marginLeft: 4,
  },
  divider: {
    color: COLORS.text.tertiary,
    marginHorizontal: 6,
  },
  duration: {
    color: COLORS.text.tertiary,
    fontSize: FONTS.size.sm,
  },
  statusChip: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: SIZES.radius.sm,
    marginTop: 4,
  },
  statusText: {
    fontSize: FONTS.size.xs,
    fontWeight: FONTS.weight.medium,
  },
  menuButton: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
```

### 5.4 EmptyState.tsx

```typescript
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Button from './Button';
import { COLORS, FONTS, SIZES } from '../constants/theme';

interface EmptyStateProps {
  icon: string;
  title: string;
  subtitle: string;
  ctaLabel: string;
  onCtaPress: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  subtitle,
  ctaLabel,
  onCtaPress,
}) => {
  return (
    <View style={styles.container}>
      <Ionicons name={icon as any} size={64} color={COLORS.accent.primary} />
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
      <Button
        label={ctaLabel}
        onPress={onCtaPress}
        type="primary"
        size="md"
        style={styles.button}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SIZES.spacing.xl,
    paddingVertical: SIZES.spacing.xxl,
  },
  title: {
    color: COLORS.text.primary,
    fontSize: FONTS.size.xl,
    fontWeight: FONTS.weight.bold,
    marginTop: SIZES.spacing.lg,
    marginBottom: SIZES.spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    color: COLORS.text.secondary,
    fontSize: FONTS.size.md,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: SIZES.spacing.xl,
    maxWidth: 280,
  },
  button: {
    alignSelf: 'center',
  },
});
```

---

## 6. Copy Deck

See [copy.md](./copy.md) for all microcopy used in Creator Studio.

---

## 7. Acceptance Criteria

✅ **Before shipping, all of these must pass:**

1. ✅ Header shows real avatar, handle, and verified badge (if applicable)
2. ✅ Stats row shows real data from API (followers, programs, views, earnings)
3. ✅ Create button opens action sheet with 3-4 options
4. ✅ Content tabs switch between Published/Drafts/Scheduled
5. ✅ Each tab shows real content list (or empty state if none)
6. ✅ Empty states have helpful copy + actionable CTA
7. ✅ Post rows have thumbnail, title, metadata, status chip, menu button
8. ✅ Menu (•••) shows 3-4 actions (View, Edit, Duplicate, Delete)
9. ✅ Toolbox sections are navigable (Templates, Monetization, Analytics, Policies)
10. ✅ Error states show "Retry" button when API fails
11. ✅ Offline banner appears when network is unavailable
12. ✅ First-time coach marks appear once (can be dismissed)
13. ✅ All touch targets ≥48×48pt
14. ✅ All text is accessible (labels, hints, roles)
15. ✅ Works on small devices (iPhone SE, Galaxy A series)

---

**End of Creator Experience Specification**

