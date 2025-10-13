# UI Copy Deck

**Project:** FitAI - All Screens  
**Date:** October 7, 2025  
**Tone:** Motivating, clear, concise  
**Voice:** You (2nd person), active voice

---

## 1. Creator Studio

### 1.1 Headers & Titles
| Element | Copy |
|---------|------|
| Screen title | Creator Studio |
| Verified badge | Verified Creator |
| Settings | Creator Settings |

### 1.2 Stats Labels
| Metric | Label |
|--------|-------|
| Followers | Followers |
| Programs | Programs |
| Views (7-day) | Views (7d) or 7-Day Views |
| Earnings | Earnings |

### 1.3 Primary Actions
| Button | Label |
|--------|-------|
| Create button | Create |
| Action sheet title | What do you want to create? |
| New workout option | 🏋️ New Workout |
| New program option | 📅 New Program (multi-week) |
| Upload video option | 🎬 Upload Video |
| Go live option (Phase 2) | 🔴 Go Live (Coming Soon) |

### 1.4 Content Tabs
| Tab | Label |
|-----|-------|
| Published content | Published |
| Drafts | Drafts |
| Scheduled content | Scheduled |

### 1.5 Empty States

#### Published Empty
- **Icon:** `fitness-outline` (target)
- **Title:** Nothing published yet
- **Subtitle:** Share your first workout or program to start growing your audience.
- **CTA:** Create Content

#### Drafts Empty
- **Icon:** `document-text-outline`
- **Title:** No drafts yet
- **Subtitle:** Drafts save automatically while you create. Start a new workout to try it out.
- **CTA:** Create Workout

#### Scheduled Empty (Phase 2)
- **Icon:** `alarm-outline`
- **Title:** No scheduled posts
- **Subtitle:** Plan ahead—schedule content to publish automatically at a specific time.
- **CTA:** Learn More

#### Stats Empty (All Zeros)
- **Message:** Just getting started? Create your first program to grow your audience.

### 1.6 Error States

#### Network Error
- **Icon:** `warning-outline`
- **Title:** Unable to load creator stats
- **Subtitle:** Check your connection and try again.
- **CTA:** Retry

#### Offline Banner
- **Message:** 📡 You're offline. Some features may be limited until you reconnect.

#### Session Expired
- **Toast:** Session expired. Please log in again.

#### Create While Offline
- **Toast:** You need internet to create content.

### 1.7 Confirmation Dialogs

#### Delete Draft
- **Title:** Delete draft?
- **Message:** This cannot be undone. Your work will be permanently deleted.
- **Primary:** Delete
- **Secondary:** Cancel

#### Delete Published Content
- **Title:** Delete "{title}"?
- **Message:** This will remove the content from your profile and your followers won't see it anymore.
- **Primary:** Delete
- **Secondary:** Cancel

### 1.8 Toolbox Labels
| Section | Label |
|---------|-------|
| Templates | 🎨 Templates & Tools |
| Monetization | 💰 Monetization |
| Analytics | 📊 Analytics |
| Policies | 🛡️ Creator Policies |

#### Monetization - Not Eligible
- **Title:** Monetization not available yet
- **Subtitle:** You need at least 100 followers and 3 published programs to enable monetization.
- **Status:** Current: {X} followers, {Y} programs
- **CTA:** Learn More

### 1.9 Coach Marks (First-Time Tour)

#### Step 1/3 (Create Button)
- **Message:** Tap here to create your first workout or program. It's quick and easy!
- **CTA Primary:** Next
- **CTA Secondary:** Skip Tour

#### Step 2/3 (Content Tabs)
- **Message:** Switch between published content and work-in-progress drafts.
- **CTA Primary:** Next
- **CTA Secondary:** Skip Tour

#### Step 3/3 (Toolbox)
- **Message:** Explore templates, monetization, and analytics to grow your creator brand.
- **CTA Primary:** Done

---

## 2. Home Screen

### 2.1 Headers
| Element | Copy |
|---------|------|
| Greeting (morning) | Good morning, {name}! |
| Greeting (afternoon) | Good afternoon, {name}! |
| Greeting (evening) | Good evening, {name}! |
| Date | {Weekday}, {Month} {Day} (e.g., Monday, October 7) |

### 2.2 Cards
| Card | Title | Subtitle |
|------|-------|----------|
| Nutrition | Today's Nutrition | {calories} / {target} cal |
| Workout | Today's Workout | {workout name} or "No workout planned" |
| Recovery | Recovery | {score}% |
| Progress | This Week | Protein • Workouts • Weight |

### 2.3 Quick Actions
| Action | Label |
|--------|-------|
| Scan food | Scan |
| Camera test | Camera Test |
| Quick add | Quick Add |
| Add meal | Add Meal |
| Start workout | Start Workout |
| Resume workout | Resume Workout |

### 2.4 Coach Tip
- **Title:** Coach Tip
- **Example:** Stay hydrated! Aim for 8 glasses of water per day to boost performance and recovery.

---

## 3. Discover Screen

### 3.1 Headers
| Element | Copy |
|---------|------|
| Screen title | Discover |
| Hero eyebrow | Your transformation starts now |
| Hero title | CHAMPION YOURSELF |
| Hero CTA | Join My Program |

### 3.2 Tabs
| Tab | Label |
|-----|-------|
| Home feed | HOME |
| Trending | TRENDING |
| Coaches | COACHES |
| Programs | PROGRAMS |

### 3.3 Coach Cards
| Action | Label |
|--------|-------|
| Follow button | Follow |
| Subscribe button | Subscribe |
| Subscribed state | Subscribed |
| Verified badge | Verified Coach |
| Free badge | Free |
| Hot badge | Hot |

### 3.4 Program Cards
| Action | Label |
|--------|-------|
| Add to library | Add to My Page |
| Added state | Added |
| View details | View Details |

### 3.5 Confirmations

#### Coach Subscribed
- **Title:** Subscribed
- **Message:** You are now following {coach name}.
- **CTA Primary:** Go to Workouts
- **CTA Secondary:** OK

#### Program Added
- **Title:** Added
- **Message:** {program name} has been added to your workout library.
- **CTA Primary:** Go to Workouts
- **CTA Secondary:** OK

---

## 4. Workouts & Plans

### 4.1 Headers
| Element | Copy |
|---------|------|
| Screen title | Workouts |
| Search placeholder | Search workouts... |
| No results | No workouts found |

### 4.2 Categories
| Category | Label |
|----------|-------|
| All | All |
| Arms | Arms |
| Legs | Legs |
| Core | Core |
| Cardio | Cardio |
| HIIT | HIIT |
| Yoga | Yoga |
| Stretching | Stretching |

### 4.3 Empty State
- **Icon:** `barbell-outline`
- **Title:** No workouts yet
- **Subtitle:** Start your first workout to track your progress and build your fitness routine.
- **CTA:** Browse Workouts

---

## 5. Progress Screen

### 5.1 Headers
| Element | Copy |
|---------|------|
| Screen title | Progress |
| Goals section | Your Goals |
| Charts section | Progress Over Time |
| Photos section | Progress Photos |

### 5.2 Empty States

#### No Progress Data
- **Title:** Start tracking your progress
- **Subtitle:** Log your first workout to see your progress charts and stats.
- **CTA:** Log Workout

#### No Photos
- **Title:** No progress photos yet
- **Subtitle:** Take before and after photos to visualize your transformation.
- **CTA:** Upload Photo

---

## 6. Nutrition Screen

### 6.1 Headers
| Element | Copy |
|---------|------|
| Screen title | Nutrition |
| Tabs | Meals • Water • Goals |

### 6.2 Meal Labels
| Meal | Label |
|------|-------|
| Breakfast | Breakfast |
| Lunch | Lunch |
| Dinner | Dinner |
| Snack | Snack |

### 6.3 Actions
| Action | Label |
|--------|-------|
| Scan food | Scan Food |
| Scan barcode | Scan Barcode |
| Manual entry | Add Manually |
| Add to meal | Add to {Meal} |

### 6.4 Empty States

#### No Meals Logged
- **Title:** Track your first meal
- **Subtitle:** Log what you eat to see your daily nutrition breakdown and reach your goals.
- **CTA:** Log Meal

#### Scan Result Modal
- **Title:** Food Recognized
- **Subtitle:** {food name}
- **Action:** Add to Meal
- **Cancel:** Not quite right

---

## 7. Profile Screen

### 7.1 Headers
| Element | Copy |
|---------|------|
| Screen title | Profile |
| Member since | Member for {duration} (e.g., "3 months") |
| Signed up with | Signed up with {provider} (e.g., "Google") |

### 7.2 Menu Items
| Item | Title | Subtitle |
|------|-------|----------|
| Edit profile | Edit Profile | Update your personal information |
| Profile photo | Profile Photo | Set, crop, and update your avatar |
| Security | Security | Password and privacy settings |
| Notifications | Notifications | Manage your notification preferences |
| Help | Help & Support | Get help and contact support |
| About | About | App version and information |

### 7.3 Create & Share Section
| Element | Label |
|---------|-------|
| Section title | Create & Share |
| Post card title | Post |
| Post card subtitle | Share your workout (photo) |
| Story card title | Story |
| Story card subtitle | Post a quick update (photo) |
| Upload button | Upload |

### 7.4 Confirmations

#### Profile Saved
- **Toast:** Profile updated successfully!

#### Logout Confirmation
- **Title:** Sign Out
- **Message:** Are you sure you want to sign out?
- **Primary:** Sign Out
- **Secondary:** Cancel

### 7.5 Upload Section

#### Post Details
- **Heading:** Post Details
- **Caption placeholder:** Write a caption…
- **Tags placeholder:** Tags (comma separated)
- **Ratio chips:** auto • 1:1 • 4:5 • 16:9 • 9:16
- **Toggle 1:** Allow comments
- **Toggle 2:** Share to Discover
- **CTA Primary:** Post
- **CTA Secondary:** Discard

#### Upload Complete
- **Title:** Upload Complete
- **Message:** Saved to your Media Library.
- **Actions:** Open Library • Copy URL • Close

#### Upload Failed
- **Title:** Upload Failed
- **Message:** {error message}. Please try again.

---

## 8. Error Messages

### 8.1 Network Errors
| Scenario | Message |
|----------|---------|
| Failed to load data | Unable to load {resource}. Check your connection and try again. [Retry] |
| Timeout | Request timed out. Please try again. [Retry] |
| Server error | Something went wrong on our end. We're working on it. [Retry] |

### 8.2 Validation Errors
| Field | Error |
|-------|-------|
| Email (invalid) | Please enter a valid email address. |
| Email (required) | Email is required. |
| Password (too short) | Password must be at least 8 characters. |
| Password (required) | Password is required. |
| Name (required) | Name is required. |

### 8.3 Camera Errors
| Scenario | Message |
|----------|---------|
| Permission denied | Camera permission required to scan food. Go to Settings to enable. [Open Settings] |
| Camera unavailable | Camera not available on this device. Try manual entry instead. [Manual Entry] |
| Scan failed | We couldn't recognize that food. Try again or enter manually. [Retry] [Manual Entry] |

---

## 9. Success Messages

### 9.1 Toasts
| Action | Message |
|--------|---------|
| Workout saved | Workout saved successfully! |
| Meal logged | Meal added to {meal type}. |
| Progress logged | Progress updated! |
| Photo uploaded | Photo uploaded successfully. |
| Draft saved | Draft saved. |
| Published | Content published! |

---

## 10. General Principles

### 10.1 Tone
- **Motivating:** "You've got this!" not "Try your best"
- **Clear:** "Workout saved" not "Your workout has been successfully saved to the database"
- **Friendly:** "No workouts yet" not "0 workouts found"

### 10.2 Grammar
- Use contractions (you're, we're, it's) for friendliness
- Use sentence case for buttons (Create, not CREATE)
- Use title case for headings (Your Progress, not YOUR PROGRESS)
- Keep button labels short (max 2-3 words)

### 10.3 Error Handling
- Always provide a recovery action ("Retry", "Go to Settings", "Manual Entry")
- Explain what went wrong in simple terms (avoid technical jargon)
- Be empathetic ("We couldn't load your workouts" not "Error 500")

---

**End of Copy Deck**

