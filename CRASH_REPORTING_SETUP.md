# Crash Reporting & Analytics Setup Guide

## Overview

The fitness app now includes comprehensive crash reporting and analytics tracking using:
- **Sentry** - Error tracking and performance monitoring
- **Firebase Crashlytics** - Native crash reporting
- **Firebase Analytics** - Product analytics and user behavior tracking

---

## Quick Start

### 1. Sentry Setup (Required for Error Tracking)

1. **Create a Sentry account** at https://sentry.io (free tier available)

2. **Create a new project**:
   - Choose "React Native" as the platform
   - Copy your DSN (Data Source Name)

3. **Add DSN to environment**:
   ```bash
   # Add to .env file
   SENTRY_DSN=https://your-key@sentry.io/your-project-id
   ```

4. **Test it works**:
   ```javascript
   import crashReporting from './src/services/crashReporting';
   
   // This will send a test error to Sentry (production only)
   crashReporting.logError(new Error('Test error'), { test: true });
   ```

---

### 2. Firebase Setup (Optional but Recommended)

#### iOS Setup

1. **Create Firebase project** at https://console.firebase.google.com

2. **Add iOS app**:
   - Register bundle ID (from app.json)
   - Download `GoogleService-Info.plist`
   - Place in `ios/` directory

3. **Update app.json**:
   ```json
   {
     "expo": {
       "ios": {
         "googleServicesFile": "./GoogleService-Info.plist"
       },
       "plugins": [
         "@react-native-firebase/app",
         "@react-native-firebase/crashlytics",
         "@react-native-firebase/analytics"
       ]
     }
   }
   ```

4. **Rebuild iOS app**:
   ```bash
   npx expo prebuild --platform ios
   npx expo run:ios
   ```

#### Android Setup

1. **Add Android app** in Firebase console:
   - Register package name (from app.json)
   - Download `google-services.json`
   - Place in `android/app/` directory

2. **Update app.json**:
   ```json
   {
     "expo": {
       "android": {
         "googleServicesFile": "./google-services.json"
       }
     }
   }
   ```

3. **Rebuild Android app**:
   ```bash
   npx expo prebuild --platform android
   npx expo run:android
   ```

---

## Features

### Crash Reporting

**Automatic crash tracking:**
- React errors caught by ErrorBoundary
- Native crashes (iOS/Android)
- JavaScript errors
- Promise rejections

**Manual error logging:**
```javascript
import crashReporting from './src/services/crashReporting';

try {
  riskyOperation();
} catch (error) {
  crashReporting.logError(error, {
    screen: 'HomeScreen',
    action: 'loadData',
    userId: user.id,
  });
}
```

**User context:**
```javascript
// Automatically set when user logs in (via App.js)
crashReporting.setUser({
  id: user.id,
  email: user.email,
  username: user.username,
});

// Clear on logout
crashReporting.clearUser();
```

**Breadcrumbs** (debugging trail):
```javascript
crashReporting.addBreadcrumb({
  message: 'User clicked workout button',
  category: 'user-action',
  level: 'info',
  data: { workoutId: '123' },
});
```

---

### Analytics

**Screen tracking** (automatic):
```javascript
// Tracked automatically via NavigationContainer
// No code needed - screens are tracked on navigation
```

**Event tracking:**
```javascript
import analyticsService from './src/services/analytics';

// Built-in fitness events
analyticsService.logWorkoutStarted('strength', 45);
analyticsService.logMealLogged('breakfast', 500, 'camera');
analyticsService.logQuizCompleted('cut', 'moderate');

// Custom events
analyticsService.logEvent('feature_used', {
  feature_name: 'ai_scanner',
  scan_type: 'barcode',
  success: true,
});
```

**User properties:**
```javascript
// Set user properties for segmentation
analyticsService.setUserProperties({
  subscription_tier: 'premium',
  fitness_goal: 'weight_loss',
  activity_level: 'moderate',
  onboarding_completed: true,
});
```

---

## API Reference

### CrashReportingService

#### Methods

**`init()`**
Initialize crash reporting services. Called automatically in App.js.

**`setUser(user)`**
Set user context for error reports.
```javascript
crashReporting.setUser({
  id: '12345',
  email: 'user@example.com',
  username: 'fitguy',
});
```

**`clearUser()`**
Clear user context (call on logout).

**`logError(error, context?)`**
Log a non-fatal error with optional context.
```javascript
crashReporting.logError(error, {
  screen: 'WorkoutScreen',
  workoutId: 'abc123',
});
```

**`logMessage(message, level?)`**
Log a message for debugging.
- Levels: `'debug'`, `'info'`, `'warning'`, `'error'`

**`addBreadcrumb(breadcrumb)`**
Add debugging breadcrumb.
```javascript
crashReporting.addBreadcrumb({
  message: 'API call started',
  category: 'network',
  level: 'info',
  data: { endpoint: '/workouts' },
});
```

**`trackScreen(screenName, params?)`**
Track navigation to a screen.

**`setAttribute(key, value)`**
Set custom attribute/tag.

---

### AnalyticsService

#### Methods

**`init()`**
Initialize analytics. Called automatically in App.js.

**`setUserId(userId)`**
Set user ID for tracking.

**`setUserProperties(properties)`**
Set user properties for segmentation.

**`logEvent(eventName, params?)`**
Log a custom event.
```javascript
analyticsService.logEvent('workout_completed', {
  workout_type: 'strength',
  duration_minutes: 45,
  calories_burned: 350,
});
```

**`logScreenView(screenName, screenClass?)`**
Log a screen view (called automatically).

#### Fitness-Specific Events

- `logSignUp(method)` - User sign up
- `logLogin(method)` - User login
- `logWorkoutStarted(type, duration)` - Workout started
- `logWorkoutCompleted(type, duration, calories)` - Workout completed
- `logMealLogged(type, calories, source)` - Meal logged
- `logGoalSet(goalType, targetValue)` - Goal set/updated
- `logQuizCompleted(goalType, activityLevel)` - Quiz completed
- `logFeatureUsed(featureName, context)` - Feature used
- `logSearch(term, category, results)` - Search performed
- `logShare(contentType, method)` - Content shared
- `logSubscription(planType, method)` - Subscription purchased
- `logError(type, message, screen)` - App error occurred

---

## Privacy & Data Protection

### User Privacy

1. **Personal Data Sanitization**:
   - Email addresses are partially masked in Sentry
   - Sensitive fields are stripped before sending
   - Cookies are never sent

2. **Opt-Out**:
   ```javascript
   // Disable in development
   const IS_DEV = __DEV__;
   crashReporting.init(); // Only enabled in production
   ```

3. **GDPR Compliance**:
   - User data is anonymized
   - Can be deleted via Sentry/Firebase dashboards
   - User consent should be obtained per local regulations

### Security

- Crash reports are sent over HTTPS
- No passwords or auth tokens are logged
- User IDs are hashed (optional - configure in Sentry)

---

## Testing

### Test Crash Reporting

```javascript
// In development (logged only, not sent)
crashReporting.logError(new Error('Test error'), { test: true });

// In production (actually crashes - use with caution!)
crashReporting.testCrash();
```

### Test Analytics

```javascript
// Log test events
analyticsService.logEvent('test_event', { test: true });
```

### Verify in Dashboards

1. **Sentry Dashboard**:
   - Go to https://sentry.io/organizations/[org]/issues/
   - Errors should appear within 1-2 minutes

2. **Firebase Console**:
   - Go to https://console.firebase.google.com
   - Navigate to Crashlytics → Dashboard
   - Navigate to Analytics → Events

---

## Troubleshooting

### Sentry not receiving errors

1. Check DSN is set correctly in `.env`
2. Verify `!IS_DEV` check (Sentry disabled in dev by default)
3. Check network connectivity
4. Look for initialization errors in console

### Firebase not working

1. Verify `google-services.json` / `GoogleService-Info.plist` are in correct locations
2. Rebuild native apps after adding Firebase config
3. Check Firebase console for setup errors
4. Verify package bundle ID matches Firebase app

### Analytics events not showing

1. Analytics events can take 24 hours to appear in Firebase
2. Use DebugView in Firebase console for real-time testing
3. Enable debug mode:
   ```bash
   # iOS
   adb shell setprop debug.firebase.analytics.app <package_name>
   
   # Android
   adb shell setprop debug.firebase.analytics.app <package_name>
   ```

---

## Best Practices

1. **Error Context**: Always provide meaningful context when logging errors
   ```javascript
   crashReporting.logError(error, {
     screen: 'WorkoutScreen',
     action: 'saveWorkout',
     workoutId: workout.id,
   });
   ```

2. **Breadcrumbs**: Add breadcrumbs before critical operations
   ```javascript
   crashReporting.addBreadcrumb({
     message: 'Starting workout sync',
     category: 'sync',
     data: { workoutCount: workouts.length },
   });
   ```

3. **User Properties**: Set relevant user properties for segmentation
   ```javascript
   analyticsService.setUserProperties({
     subscription_tier: user.tier,
     fitness_goal: user.goal,
     experience_level: user.level,
   });
   ```

4. **Event Naming**: Use consistent, descriptive event names
   - Use snake_case: `workout_completed`
   - Be specific: `strength_workout_completed` vs `workout_completed`
   - Include key context in event name

5. **Rate Limiting**: Don't log too many events in rapid succession
   - Firebase: Max 500 events/second
   - Sentry: Respects rate limits automatically

---

## Next Steps

1. ✅ Install packages (`@sentry/react-native`, `@react-native-firebase/crashlytics`, etc.)
2. ✅ Create crash reporting service
3. ✅ Create analytics service
4. ✅ Integrate with ErrorBoundary
5. ✅ Initialize in App.js
6. ⬜ Set up Sentry account and add DSN
7. ⬜ Set up Firebase project and add config files
8. ⬜ Test crash reporting in production build
9. ⬜ Monitor dashboards for errors and analytics

---

**Documentation Last Updated:** October 9, 2025

