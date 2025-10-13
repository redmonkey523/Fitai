# Release-Ready QA Checklist

**Project:** FitAI UI Overhaul & Creator Page  
**Date:** October 7, 2025  
**Platform:** iOS / Android (React Native/Expo)

---

## 1. Visual QA

### 1.1 Device Sizes

Test on these device sizes (or simulators):

#### iOS
- [ ] iPhone SE (3rd gen) - 4.7" - Smallest modern iPhone
- [ ] iPhone 14 Pro - 6.1" - Standard size with notch
- [ ] iPhone 14 Pro Max - 6.7" - Largest iPhone
- [ ] iPad Air - 10.9" - Tablet size (if supported)

#### Android
- [ ] Galaxy A series - 6.0" - Budget device
- [ ] Pixel 7 - 6.3" - Mid-range
- [ ] Galaxy S23 Ultra - 6.8" - Flagship
- [ ] Galaxy Tab - 10" - Tablet (if supported)

**Checks:**
- [ ] No text truncation on small devices
- [ ] Touch targets ≥48×48pt on all devices
- [ ] Safe area insets respected (notch, home indicator)
- [ ] Content scrollable if longer than screen height
- [ ] No horizontal scrolling (unless intentional)

---

### 1.2 Light/Dark Mode

**Note:** App is dark-mode only currently.

**Future (if light mode added):**
- [ ] All colors match design tokens for both modes
- [ ] Contrast ratios meet WCAG AA in both modes
- [ ] Images/icons don't have dark backgrounds in light mode

**Current checks:**
- [ ] Dark mode colors consistent across all screens
- [ ] No light-colored backgrounds that clash

---

### 1.3 Notch & Safe Areas

**iOS:**
- [ ] Content doesn't render behind notch
- [ ] Bottom buttons not obscured by home indicator
- [ ] Status bar text is white (readable on dark background)
- [ ] Modals/sheets respect safe area top

**Android:**
- [ ] Translucent status bar with scrim (if applicable)
- [ ] Navigation buttons don't overlap content
- [ ] Punch-hole camera doesn't obscure critical UI

---

### 1.4 Landscape Orientation

**If landscape is supported:**
- [ ] Tab bar moves to left/right side (or hides)
- [ ] Content reflows appropriately
- [ ] Images don't stretch awkwardly
- [ ] Forms remain usable

**If landscape is locked:**
- [ ] Rotation locked to portrait in app config
- [ ] No accidental landscape rendering

---

### 1.5 Typography

- [ ] All text uses design system font sizes (xs, sm, md, lg, xl, xxl, xxxl)
- [ ] Font weights consistent (light, regular, medium, bold)
- [ ] Line heights appropriate (1.5× for body text)
- [ ] No ALL CAPS text except intentional titles (e.g., "CHAMPION YOURSELF")
- [ ] No font size <12pt (readability minimum)

---

### 1.6 Spacing & Alignment

- [ ] All spacing follows 4pt grid (4, 8, 12, 16, 24, 32, 48)
- [ ] Card padding consistent (16pt)
- [ ] Screen horizontal padding consistent (16-24pt)
- [ ] Vertical rhythm consistent (sections separated by 24pt)
- [ ] Icons vertically centered with adjacent text

---

### 1.7 Colors & Gradients

- [ ] All colors use design tokens (not hardcoded hex)
- [ ] Gradients applied correctly (start→end direction)
- [ ] Accent colors used sparingly (primary actions only)
- [ ] Error states use error color (#FF0055)
- [ ] Success states use success color (#00FF66)

---

### 1.8 Shadows & Elevation

- [ ] Cards have consistent shadow (medium elevation)
- [ ] Modals elevated above cards (large elevation)
- [ ] No double shadows (shadow + border)
- [ ] Neon glow effect applied to primary CTAs

---

## 2. Accessibility QA

### 2.1 Touch Targets

- [ ] All buttons ≥48×48pt (iOS HIG 44pt, Material 48dp)
- [ ] Icon buttons have full 48pt touchable area (not just icon)
- [ ] List items ≥48pt height
- [ ] Chips/pills ≥36pt height
- [ ] Adequate spacing between adjacent buttons (8pt min)

---

### 2.2 Color Contrast (WCAG AA)

Test with contrast checker (e.g., WebAIM):

- [ ] Primary text on primary background: ≥4.5:1 (normal text) or ≥3:1 (large text)
- [ ] Secondary text on primary background: ≥4.5:1
- [ ] Accent colors on primary background: ≥4.5:1
- [ ] Button text on button background: ≥4.5:1
- [ ] Error text on primary background: ≥4.5:1

**Known passes:**
- White (#FFF) on Deep Black (#0A0A0F): 19.8:1 ✅
- Light Gray (#B8B8C0) on Deep Black: 12.3:1 ✅
- Cyan (#00FFFF) on Deep Black: 14.1:1 ✅

---

### 2.3 Screen Reader Labels

**iOS (VoiceOver):**
- [ ] Enable VoiceOver: Settings > Accessibility > VoiceOver
- [ ] Swipe through all screens → every element announces correctly
- [ ] Buttons announce as "button" (accessibilityRole)
- [ ] Images have alt text (accessibilityLabel)
- [ ] Icons have descriptive labels (not just icon name)

**Android (TalkBack):**
- [ ] Enable TalkBack: Settings > Accessibility > TalkBack
- [ ] Swipe through all screens → every element announces correctly
- [ ] Touch Explore mode works (touch to hear, double-tap to activate)

**Checks:**
- [ ] All TouchableOpacity has `accessibilityLabel`
- [ ] Icon buttons describe action (e.g., "Settings" not "Settings icon")
- [ ] Progress indicators announce percentage (e.g., "75% complete")
- [ ] Empty states announce helpful message
- [ ] Error states announce error and recovery action

---

### 2.4 Focus Order

- [ ] Tab through interactive elements in logical order (top-to-bottom, left-to-right)
- [ ] Focus indicator visible (outline or background change)
- [ ] Modals trap focus (can't tab to background)
- [ ] Closing modal returns focus to trigger element

---

### 2.5 Dynamic Type

**iOS:**
- [ ] Settings > Accessibility > Display & Text Size > Larger Text
- [ ] Set text size to largest
- [ ] All text scales appropriately
- [ ] Touch targets don't shrink
- [ ] Content doesn't overflow or truncate

**Android:**
- [ ] Settings > Display > Font size
- [ ] Set to largest
- [ ] Same checks as iOS

**Fixes if fails:**
- Use `sp` units (not `pt`) for font sizes
- Allow text to wrap (don't set fixed heights)
- Use ScrollView for long content

---

## 3. Performance QA

### 3.1 First Meaningful Paint

Test on mid-range device (e.g., Galaxy A series, iPhone SE):

| Screen | Target | Actual | Pass? |
|--------|--------|--------|-------|
| Home | <1s | ___ | [ ] |
| Discover | <1s | ___ | [ ] |
| Workouts | <1s | ___ | [ ] |
| Creator | <1s | ___ | [ ] |
| Profile | <1s | ___ | [ ] |

**If fails:**
- [ ] Add skeleton loaders
- [ ] Lazy load images
- [ ] Paginate lists (20 items max per load)

---

### 3.2 Screen Transitions

- [ ] Navigation transitions smooth (no jank)
- [ ] Tab switches <200ms
- [ ] Modal opens/closes smoothly
- [ ] Pull-to-refresh smooth (no lag)

---

### 3.3 Long List Performance

Test with 100+ items:

- [ ] FlatList uses `keyExtractor`
- [ ] No blank cells while scrolling
- [ ] Scroll is smooth (60fps)
- [ ] Memory usage stable (no leaks)

**Checks:**
- [ ] Using `FlatList` (not `ScrollView` with `.map()`)
- [ ] `getItemLayout` provided (if fixed heights)
- [ ] `removeClippedSubviews={true}` on Android

---

### 3.4 Image Loading

- [ ] Images show placeholder while loading
- [ ] No flash of unstyled content
- [ ] Large images compressed (<500KB)
- [ ] Thumbnails used for list views (not full-res)

**Checks:**
- [ ] Using `react-native-fast-image` or similar
- [ ] Image URLs include size params (e.g., `?w=200&h=200`)
- [ ] Fallback image if URL fails

---

### 3.5 API Response Times

Test on 3G throttled connection:

| Endpoint | Target | Actual | Pass? |
|----------|--------|--------|-------|
| /api/auth/me | <2s | ___ | [ ] |
| /api/creator/stats | <2s | ___ | [ ] |
| /api/workouts | <3s | ___ | [ ] |
| /api/discover | <3s | ___ | [ ] |

**If fails:**
- [ ] Add pagination (limit to 20 items)
- [ ] Cache responses (5-min TTL)
- [ ] Show loading state immediately

---

### 3.6 Battery & Network Usage

- [ ] App doesn't drain battery excessively
- [ ] Network requests batched (not 10+ simultaneous)
- [ ] Polling intervals reasonable (≥30s)
- [ ] WebSocket connections close properly

---

## 4. Functional QA

### 4.1 Authentication

- [ ] Login with email + password works
- [ ] Register new account works
- [ ] "Forgot password" flow works (if implemented)
- [ ] Auto-login on app reopen (token persisted)
- [ ] Logout clears token and navigates to Auth screen
- [ ] Session expired shows "Log in again" message

---

### 4.2 Navigation

- [ ] All bottom tabs navigate correctly
- [ ] Back button returns to previous screen
- [ ] Deep links work (e.g., `/workouts/123`)
- [ ] Modals close with "X" or swipe down (iOS)
- [ ] Hardware back button works (Android)

---

### 4.3 Forms & Validation

- [ ] Required fields show error if empty
- [ ] Email validation works
- [ ] Password validation works (min 8 chars)
- [ ] Submit button disabled while loading
- [ ] Error messages display below fields
- [ ] Success messages display after save

---

### 4.4 Creator Studio

- [ ] Header shows correct avatar, handle, verified badge
- [ ] Stats row shows real data from API
- [ ] Create button opens action sheet with 4 options
- [ ] Content tabs switch (Published / Drafts / Scheduled)
- [ ] Empty states show when no content
- [ ] Post rows display correctly (thumbnail, title, metadata)
- [ ] Menu (•••) opens with actions (View, Edit, Delete)
- [ ] Toolbox sections navigate to correct screens

---

### 4.5 Offline Mode

- [ ] Offline banner appears when network unavailable
- [ ] Cached content still displays
- [ ] Actions requiring network show "Offline" toast
- [ ] Reconnect automatically when network returns
- [ ] Queued actions retry after reconnect (if applicable)

---

### 4.6 Error Handling

Test error scenarios:

- [ ] API returns 500 → Shows "Server error. Retry?" message
- [ ] API returns 401 → Shows "Session expired. Log in again."
- [ ] Network timeout → Shows "Request timed out. Retry?"
- [ ] Image fails to load → Shows placeholder
- [ ] Form validation fails → Shows error below field
- [ ] Delete action → Shows confirmation dialog

---

## 5. Telemetry QA

### 5.1 Event Tracking

Verify these events are tracked:

- [ ] `screen_view` - When user views a screen (screen_name param)
- [ ] `button_click` - When user taps a button (button_name param)
- [ ] `workout_created` - When user creates a workout
- [ ] `program_subscribed` - When user subscribes to a coach
- [ ] `meal_logged` - When user logs a meal
- [ ] `creator_content_published` - When creator publishes content

**Checks:**
- [ ] Events fire correctly (check analytics dashboard)
- [ ] PII redacted (no email, phone, etc. in events)
- [ ] User ID included (but hashed/anonymized)

---

### 5.2 Crash Reporting

- [ ] Crashes reported to monitoring service (Sentry, Crashlytics)
- [ ] Stack traces include source maps
- [ ] User context included (OS, device, app version)
- [ ] No crashes in last 7 days (on production)

---

## 6. Store-Ready QA

### 6.1 Store Screenshots

**Required screenshots (iOS App Store):**
- [ ] 6.7" (iPhone 14 Pro Max) - 1 required
- [ ] 5.5" (iPhone 8 Plus) - 1 required (for older devices)

**Required screenshots (Android Play Store):**
- [ ] Phone - 2-8 screenshots
- [ ] Tablet - 2-8 screenshots (if supported)

**Screenshot Script (Automate with Detox/Maestro):**
1. Home screen (with user logged in, showing real data)
2. Discover screen (showing coaches and programs)
3. Creator Studio (showing stats and content)
4. Workout detail (showing exercises)
5. Progress screen (showing charts)
6. Profile screen (showing user info)

**Data Setup:**
- [ ] Use staging backend with seed data
- [ ] No placeholder lorem ipsum
- [ ] Realistic usernames, workout names
- [ ] Redact any PII

---

### 6.2 App Store Metadata

- [ ] App name (max 30 chars): "FitAI - AI-Powered Fitness"
- [ ] Subtitle (max 30 chars): "Workouts, Nutrition, Progress"
- [ ] Description (max 4000 chars): Written and approved
- [ ] Keywords (max 100 chars, iOS only): "fitness, workout, nutrition, AI, gym, health, training, coach"
- [ ] Privacy Policy URL: Valid and accessible
- [ ] Support URL: Valid and accessible

---

### 6.3 App Permissions

**iOS (Info.plist):**
- [ ] NSCameraUsageDescription: "Scan food to log nutrition"
- [ ] NSPhotoLibraryUsageDescription: "Upload progress photos"
- [ ] NSLocationWhenInUseUsageDescription (if using location): "Find nearby gyms"
- [ ] NSUserTrackingUsageDescription (for ads): Not used (no ads)

**Android (AndroidManifest.xml):**
- [ ] `<uses-permission android:name="android.permission.CAMERA" />`
- [ ] `<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />`
- [ ] `<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />`

---

### 6.4 Build Configuration

- [ ] App version incremented (e.g., 1.1.0 → 1.2.0)
- [ ] Build number incremented (e.g., 10 → 11)
- [ ] Environment set to production (not staging)
- [ ] API URLs point to production backend
- [ ] Debug logging disabled
- [ ] Sourcemaps uploaded (for crash reporting)

---

## 7. Regression Testing

### 7.1 Core Flows

Test these end-to-end flows:

- [ ] Register → Onboard → Home → Log workout → View progress
- [ ] Login → Discover → Subscribe to coach → View coach profile
- [ ] Login → Creator tab → Create workout → Publish → View in Published tab
- [ ] Login → Nutrition → Scan food → Add to meal → View daily totals
- [ ] Login → Profile → Edit info → Save → Verify changes persist

---

### 7.2 Smoke Test Checklist

Run this quick test on every build:

- [ ] App launches without crash
- [ ] Login works
- [ ] All 5 tabs navigate correctly
- [ ] Can create a workout
- [ ] Can log a meal
- [ ] Can view progress
- [ ] Logout works

**Target:** <5 minutes to run

---

## 8. Sign-Off

### 8.1 Team Approvals

- [ ] Designer: Visual design matches specs
- [ ] Product: All features implemented
- [ ] Engineering: Code reviewed and tested
- [ ] QA: All test cases passed
- [ ] Marketing: Screenshots and metadata approved

---

### 8.2 Final Checklist

Before submitting to App Store/Play Store:

- [ ] All QA checklists above passed
- [ ] No known P0/P1 bugs
- [ ] Privacy Policy updated
- [ ] Terms of Service updated
- [ ] Support email monitored
- [ ] Rollout plan defined (phased vs immediate)
- [ ] Rollback plan defined (if critical bug found)

---

## 9. Post-Launch Monitoring

### 9.1 First 24 Hours

- [ ] Monitor crash rate (<1%)
- [ ] Monitor ANR rate (Android) (<0.5%)
- [ ] Check user reviews (respond to negative ones)
- [ ] Monitor server load (no 500 errors)
- [ ] Check analytics for adoption (% of users upgrading)

---

### 9.2 First 7 Days

- [ ] Analyze user feedback (surveys, reviews, support tickets)
- [ ] Identify top 3 issues
- [ ] Plan hotfix if critical
- [ ] Measure engagement metrics (DAU, retention)
- [ ] Compare to pre-launch baseline

---

**End of QA Checklist**

