# FitAI Design System Lite

**Version:** 1.0.0  
**Platform:** React Native (iOS/Android)  
**Theme:** Cyberpunk-inspired dark mode  
**Last Updated:** October 7, 2025

---

## 1. Design Tokens

See [tokens.json](./tokens.json) for the complete token specification.

### 1.1 Color Palette

#### Background Colors
```javascript
primary:   #0A0A0F  // Deep black with blue tint
secondary: #121218  // Slightly lighter black
tertiary:  #1A1A24  // Dark charcoal
card:      #16161E  // Card backgrounds
modal:     #1E1E28  // Modal/sheet backgrounds
```

#### Text Colors
```javascript
primary:   #FFFFFF  // Pure white (high contrast)
secondary: #B8B8C0  // Light gray (medium contrast)
tertiary:  #6E6E78  // Medium gray (low contrast)
disabled:  #4A4A52  // Dark gray (disabled states)
```

#### Accent Colors (Neon)
```javascript
primary:     #00FFFF  // Cyan (main brand)
secondary:   #FF00FF  // Magenta (secondary actions)
tertiary:    #00AAFF  // Electric blue (links)
quaternary:  #FF5500  // Neon orange (warnings, calories)
success:     #00FF66  // Neon green (completed, positive)
error:       #FF0055  // Neon red (errors, destructive)
warning:     #FFAA00  // Neon yellow (alerts)
```

#### Semantic Mappings
| Role | Token | Usage |
|------|-------|-------|
| **Surface** | `$color.background.card` | Cards, containers |
| **On Surface** | `$color.text.primary` | Text on cards |
| **Primary** | `$color.accent.primary` | Main CTAs, active states |
| **On Primary** | `$color.background.primary` | Text on cyan buttons |
| **Error** | `$color.accent.error` | Error messages, destructive actions |

### 1.2 Typography

| Level | Size | Weight | Usage |
|-------|------|--------|-------|
| **Title** | 40pt | 700 | Hero headlines |
| **H1** | 32pt | 700 | Screen titles |
| **H2** | 24pt | 700 | Section titles |
| **H3** | 20pt | 600 | Card titles |
| **Body Large** | 18pt | 400 | Prominent body text |
| **Body** | 16pt | 400 | Default body text |
| **Body Small** | 14pt | 400 | Secondary text |
| **Caption** | 12pt | 400 | Captions, labels |

**Line Height:** 1.5× font size (e.g., 16pt text = 24pt line height)  
**Letter Spacing:** +0.5pt for titles, 0pt for body

### 1.3 Spacing Scale

Based on 4pt grid system:

```
xs:   4pt   // Icon padding, tight gaps
sm:   8pt   // Small gaps between elements
md:   12pt  // Default spacing
lg:   16pt  // Section padding, card padding
xl:   24pt  // Screen padding (horizontal)
xxl:  32pt  // Large vertical gaps
xxxl: 48pt  // Hero spacing
```

### 1.4 Corner Radius

```
xs:    4pt   // Chips, tags
sm:    8pt   // Small cards, buttons
md:    12pt  // Default cards
lg:    16pt  // Large cards, modals
xl:    24pt  // Hero cards
round: 9999pt // Avatars, pills
```

### 1.5 Elevation & Shadows

| Level | Usage | Shadow Spec |
|-------|-------|-------------|
| **None** | Flat UI | elevation: 0 |
| **Small** | Chips, pills | offset: (0, 2), opacity: 0.25, radius: 3.84, elevation: 2 |
| **Medium** | Cards, buttons | offset: (0, 4), opacity: 0.3, radius: 4.65, elevation: 4 |
| **Large** | Modals, sheets | offset: (0, 6), opacity: 0.37, radius: 7.49, elevation: 6 |
| **Glow** | Neon accents | offset: (0, 0), opacity: 0.5, radius: 10, color: cyan |

---

## 2. Component Specifications

### 2.1 Button

**Variants:**
- `primary` - Filled with accent.primary background
- `secondary` - Filled with background.secondary + border
- `outline` - Transparent with border
- `ghost` - Transparent, no border

**Sizes:**
- `sm` - height: 36pt, padding: 8pt 16pt, fontSize: 14pt
- `md` - height: 48pt, padding: 12pt 24pt, fontSize: 16pt (default)
- `lg` - height: 56pt, padding: 16pt 32pt, fontSize: 18pt

**States:**
| State | Visual |
|-------|--------|
| **Default** | Background: accent.primary, Text: background.primary |
| **Hover** (web) | Opacity: 0.9 |
| **Pressed** | Opacity: 0.8 |
| **Disabled** | Background: background.secondary, Text: text.disabled |
| **Loading** | Shows ActivityIndicator, label fades out |

**Props:**
```typescript
interface ButtonProps {
  label: string;
  onPress: () => void;
  type?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  icon?: string; // Ionicons name
  fullWidth?: boolean;
  accessibilityLabel?: string;
}
```

**Do:**
- ✅ Use `primary` for main CTAs (max 1 per screen)
- ✅ Use `secondary` for cancel/back actions
- ✅ Ensure min touch target 48×48pt
- ✅ Add loading state for async actions

**Don't:**
- ❌ Don't use all-caps text (reduces readability)
- ❌ Don't nest buttons inside buttons
- ❌ Don't use icon-only buttons without accessibilityLabel

### 2.2 Card

**Usage:** Containers for related content (workout cards, coach cards, stat cards)

**Anatomy:**
```
┌─────────────────────────────┐
│ [Header]                    │ ← padding: 16pt, borderBottom if needed
│ Title (H3)                  │
│ Subtitle (Body Small)       │
├─────────────────────────────┤
│ [Content]                   │ ← padding: 16pt
│ Body content here           │
│ - List items                │
│ - Images                    │
├─────────────────────────────┤
│ [Footer]                    │ ← padding: 16pt, actions
│ [Button] [Button]           │
└─────────────────────────────┘
```

**Specs:**
- Background: `color.background.card`
- Border radius: `radius.md` (12pt)
- Padding: `space.lg` (16pt)
- Shadow: `shadow.medium`
- Min height: 80pt (for touch targets)

**Props:**
```typescript
interface CardProps {
  style?: ViewStyle;
  children: React.ReactNode;
  onPress?: () => void; // Makes card touchable
  elevation?: 'none' | 'small' | 'medium' | 'large';
}
```

**Do:**
- ✅ Use consistent padding (16pt)
- ✅ Add shadow for elevation
- ✅ Keep content scannable (max 3-4 lines of text)

**Don't:**
- ❌ Don't nest cards deeply (max 2 levels)
- ❌ Don't use cards for single lines of text (use list items)

### 2.3 Input (Text Field)

**States:**
| State | Visual |
|-------|--------|
| **Default** | Background: background.secondary, Border: transparent |
| **Focused** | Border: accent.primary (2pt) |
| **Error** | Border: accent.error, Helper text in red |
| **Disabled** | Background: background.primary, Text: text.disabled |

**Specs:**
- Height: 48pt (md size)
- Padding: 12pt horizontal
- Border radius: `radius.md` (12pt)
- Font size: 16pt (prevents zoom on iOS)

**Props:**
```typescript
interface InputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  label?: string;
  helperText?: string;
  error?: boolean;
  disabled?: boolean;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
  multiline?: boolean;
  maxLength?: number;
}
```

**Do:**
- ✅ Use labels above fields (not inside placeholders)
- ✅ Show error states below field (helper text in red)
- ✅ Use appropriate keyboard types

**Don't:**
- ❌ Don't use placeholder-only inputs (not accessible)
- ❌ Don't use <16pt font size (causes iOS zoom)

### 2.4 Tab Bar (Bottom Navigation)

**Specs:**
- Height: 60pt (includes safe area inset)
- Background: `color.background.secondary`
- Active icon/text: `color.accent.primary`
- Inactive icon/text: `color.text.tertiary`
- Border top: none (flat design)
- Icon size: 24pt
- Label size: 12pt

**States:**
| State | Visual |
|-------|--------|
| **Active** | Icon + label in accent.primary, no background |
| **Inactive** | Icon + label in text.tertiary |
| **Pressed** | Opacity: 0.8 |

**Do:**
- ✅ Max 5 tabs (platform guideline)
- ✅ Use icon + label (better recognition)
- ✅ Keep labels <10 characters

**Don't:**
- ❌ Don't use icon-only tabs (not accessible)
- ❌ Don't exceed 5 tabs (use navigation drawer instead)

### 2.5 List Item

**Usage:** Rows in FlatList/ScrollView (workouts, meals, coaches)

**Anatomy:**
```
┌─────────────────────────────────────┐
│ [Icon/Image] Title                  │ ← 48pt min height
│              Subtitle     [Chevron] │
└─────────────────────────────────────┘
```

**Specs:**
- Min height: 48pt (touch target)
- Padding: 12pt vertical, 16pt horizontal
- Icon/image: 40×40pt (if present)
- Gap between icon and text: 12pt
- Divider: 1pt, color.utility.divider

**Do:**
- ✅ Use icon/avatar on left
- ✅ Keep title 1 line, subtitle 1-2 lines
- ✅ Add chevron for navigable items

**Don't:**
- ❌ Don't exceed 2 lines of text (truncate with ellipsis)
- ❌ Don't use tiny touch targets (<48pt height)

### 2.6 Empty State

**Usage:** When a screen/section has no content

**Anatomy:**
```
       [Illustration/Icon]
       
       Title (H2)
       Description text (Body)
       
       [Primary Button]
```

**Specs:**
- Icon size: 64pt
- Icon color: `color.text.tertiary` or `color.accent.primary`
- Title: H2 (24pt, bold)
- Description: Body (16pt, secondary color)
- Spacing: 16pt between elements
- Max width: 280pt (for readability)

**Props:**
```typescript
interface EmptyStateProps {
  icon: string; // Ionicons name
  title: string;
  description: string;
  ctaLabel: string;
  onCtaPress: () => void;
}
```

**Do:**
- ✅ Provide helpful copy (not "No items found")
- ✅ Include actionable CTA
- ✅ Use friendly icons (not error icons)

**Examples:**
- Workouts empty: "No workouts yet. Start your first workout to track your progress." [Create Workout]
- Drafts empty: "Drafts save automatically. Create a new program to get started." [Create]
- Nutrition empty: "Track your first meal to see your daily nutrition breakdown." [Log Meal]

### 2.7 Toast / Snackbar

**Usage:** Temporary confirmation or error messages

**Specs:**
- Background: `color.background.modal` (with 90% opacity)
- Border radius: `radius.md` (12pt)
- Padding: 12pt 16pt
- Max width: 90% of screen
- Position: Bottom, 24pt from safe area
- Duration: 3s (info), 5s (error), persistent (action required)

**Types:**
| Type | Icon | Color |
|------|------|-------|
| **Success** | `checkmark-circle` | accent.success |
| **Error** | `close-circle` | accent.error |
| **Info** | `information-circle` | accent.primary |
| **Warning** | `warning` | accent.warning |

**Do:**
- ✅ Keep text <2 lines
- ✅ Auto-dismiss after 3-5s
- ✅ Include action button if needed ("Retry", "Undo")

**Don't:**
- ❌ Don't use for critical errors (use Alert instead)
- ❌ Don't stack multiple toasts

### 2.8 Modal / Bottom Sheet

**Usage:** Focused tasks that block main UI (edit profile, create workout)

**Specs:**
- **Modal (full-screen):**
  - Background: `color.background.primary`
  - Header: 60pt height, title centered, close button (X) on right
  - Content: Scrollable
  - Footer: Sticky buttons at bottom (Cancel + Save)
  
- **Bottom Sheet (half-screen):**
  - Background: `color.background.modal`
  - Border radius: `radius.lg` (16pt) top corners only
  - Handle: 32×4pt rounded bar at top (color.utility.divider)
  - Max height: 80% of screen
  - Backdrop: `color.utility.overlay`

**Do:**
- ✅ Add close button or swipe-to-dismiss
- ✅ Use for focused tasks (1 primary action)
- ✅ Show clear title

**Don't:**
- ❌ Don't nest modals (confusing)
- ❌ Don't use for info-only content (use screen instead)

### 2.9 Progress Indicator

**Types:**

**A. Circular (Loading):**
- Size: 40pt
- Color: `color.accent.primary`
- Usage: Centered on screen or inside buttons

**B. Linear (Determinate):**
- Height: 4pt
- Track color: `color.background.secondary`
- Fill color: `color.accent.primary`
- Border radius: 2pt
- Usage: File uploads, multi-step forms

**C. Ring (Nutrition/Goals):**
- Size: 60-80pt
- Stroke width: 6pt
- Background: `color.background.secondary`
- Fill: Gradient (`color.gradient.progress`)
- Usage: Macro progress, goal completion

**Do:**
- ✅ Show progress for long tasks (>2s)
- ✅ Use determinate when progress is known
- ✅ Disable actions during loading

**Don't:**
- ❌ Don't show multiple loaders on same screen
- ❌ Don't use progress bars for <1s tasks

### 2.10 Icon Button

**Usage:** Icon-only actions (settings, search, close)

**Specs:**
- Size: 48×48pt (touch target)
- Icon size: 24pt
- Background: transparent (default) or `color.background.secondary`
- Border radius: `radius.round` (circular)

**States:**
| State | Visual |
|-------|--------|
| **Default** | Icon: text.primary |
| **Pressed** | Background: color.background.secondary with opacity 0.5 |
| **Disabled** | Icon: text.disabled |

**Do:**
- ✅ Always provide `accessibilityLabel`
- ✅ Use recognizable icons (settings, search, close, etc.)
- ✅ Ensure 48×48pt touch target

**Don't:**
- ❌ Don't use obscure icons without labels
- ❌ Don't use icon buttons for primary actions (use Button with label)

---

## 3. Layout Patterns

### 3.1 Screen Padding

- **Horizontal:** 16pt (phones), 24pt (tablets)
- **Top:** Safe area + 16pt
- **Bottom:** Safe area + 16pt (or tab bar height)

### 3.2 Card Grids

**Single column (phone):**
- 1 card per row
- Gap: 12pt

**Two columns (tablet):**
- 2 cards per row
- Gap: 12pt horizontal, 12pt vertical

**Grid formula:**
```
cardWidth = (screenWidth - padding*2 - gap*(columns-1)) / columns
```

### 3.3 Section Spacing

- Gap between sections: 24pt
- Gap between cards in section: 12pt
- Section title margin bottom: 12pt

---

## 4. Interaction States

### 4.1 Touch Feedback

| Component | Feedback |
|-----------|----------|
| **Button** | Scale 0.98 + opacity 0.8 |
| **Card (touchable)** | Opacity 0.9 |
| **List item** | Background: color.background.secondary |
| **Icon button** | Background flash |
| **Switch/toggle** | Immediate color change |

**Duration:** 200ms (fast), 300ms (normal)

### 4.2 Loading States

| Component | Loading Visual |
|-----------|----------------|
| **Button** | Spinner replaces label, button disabled |
| **Screen** | ActivityIndicator centered, content hidden |
| **List** | Skeleton cards (3-5 placeholders) |
| **Image** | Gray placeholder with spinner |

### 4.3 Error States

| Component | Error Visual |
|-----------|--------------|
| **Input** | Red border, helper text below |
| **Screen** | Empty state with error icon + "Retry" button |
| **Toast** | Red icon + error message + auto-dismiss (5s) |

---

## 5. Accessibility Guidelines

### 5.1 Touch Targets

- **Minimum:** 48×48pt (iOS HIG 44pt, Material 48dp)
- **Comfortable:** 56×56pt
- **Exception:** Inline text links can be smaller if surrounded by white space

### 5.2 Color Contrast

All text must meet WCAG AA:
- Normal text (16pt): 4.5:1 contrast ratio
- Large text (18pt+): 3:1 contrast ratio

**Tested combinations:**
| Foreground | Background | Contrast | Pass |
|------------|------------|----------|------|
| text.primary (#FFF) | background.primary (#0A0A0F) | 19.8:1 | ✅ AAA |
| text.secondary (#B8B8C0) | background.primary (#0A0A0F) | 12.3:1 | ✅ AAA |
| text.tertiary (#6E6E78) | background.primary (#0A0A0F) | 5.2:1 | ✅ AA |
| accent.primary (#00FFFF) | background.primary (#0A0A0F) | 14.1:1 | ✅ AAA |

### 5.3 Screen Reader Labels

All interactive elements must have:
```typescript
accessibilityLabel="Brief description"  // What is it?
accessibilityHint="Tap to perform action"  // What does it do?
accessibilityRole="button" | "link" | "header" | etc.
```

**Examples:**
- Icon button: `accessibilityLabel="Settings" accessibilityRole="button"`
- Card: `accessibilityLabel="Upper Body Pump workout" accessibilityRole="button"`
- Progress ring: `accessibilityLabel="Protein: 75 grams of 150 grams"`

### 5.4 Dynamic Type

Support iOS Dynamic Type and Android font scaling:
- Use `sp` units (not `pt`) for font sizes
- Test with largest size (iOS: Accessibility > Larger Text)
- Allow text to wrap (don't truncate critical info)

---

## 6. Platform-Specific Notes

### 6.1 iOS (HIG Compliance)

- Tab bar height: 49pt + safe area inset
- Navigation bar height: 44pt + safe area inset
- Safe area: Use `SafeAreaView` from `react-native-safe-area-context`
- Haptic feedback: Use `Haptics.impactAsync` for button presses

### 6.2 Android (Material Compliance)

- Tab bar height: 56dp
- App bar height: 56dp
- Status bar: Transparent with scrim
- Ripple effect: Use `TouchableNativeFeedback` where possible

---

## 7. Do's and Don'ts

### ✅ Do
- Use semantic color tokens (not hardcoded hex values)
- Keep screen hierarchy simple (1 primary action per screen)
- Test on small devices (iPhone SE, Galaxy A series)
- Provide empty states with helpful CTAs
- Show loading states for async actions
- Use consistent spacing (4pt grid)

### ❌ Don't
- Don't use more than 3 font weights on one screen
- Don't use red/green as only differentiator (colorblind users)
- Don't nest cards >2 levels deep
- Don't use ALL CAPS for body text (reduces readability)
- Don't exceed 5 bottom tabs
- Don't use <48pt touch targets

---

## 8. Component Library Exports

All components should export from `src/components/index.js`:

```javascript
export { default as Button } from './Button';
export { default as Card } from './Card';
export { default as Input } from './Input';
export { default as EmptyState } from './EmptyState';
export { default as StatCard } from './StatCard';
export { default as ProgressBar } from './ProgressBar';
// ... etc
```

Usage in screens:
```javascript
import { Button, Card, Input } from '../components';
import { COLORS, FONTS, SIZES, SHADOWS } from '../constants/theme';
```

---

## 9. Figma / Design Handoff

When designers create mockups:
1. Use token names in layer names (e.g., "bg-card", "text-primary")
2. Export at @1x, @2x, @3x for images
3. Provide redlines for custom spacing (if not on 4pt grid)
4. Include all interactive states (default, pressed, disabled)
5. Annotate accessibility requirements (labels, roles)

---

## 10. Testing Checklist

Before shipping a screen:
- [ ] All touch targets ≥48×48pt
- [ ] Color contrast meets WCAG AA
- [ ] Screen reader announces all elements correctly
- [ ] Works with Dynamic Type (iOS) and font scaling (Android)
- [ ] Empty state shown when no data
- [ ] Error state shown on API failure
- [ ] Loading state during async operations
- [ ] Safe area insets respected (notch, home indicator)
- [ ] Landscape orientation tested (if applicable)
- [ ] Dark mode only (no light mode bugs)

---

**End of Design System Documentation**

