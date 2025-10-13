# Developer Quick Reference - Crash Reporting & Analytics

Quick snippets for common tasks when working with the fitness app.

---

## 🔥 Crash Reporting

### Log an Error

```javascript
import crashReporting from './src/services/crashReporting';

try {
  await riskyOperation();
} catch (error) {
  crashReporting.logError(error, {
    screen: 'WorkoutScreen',
    action: 'saveWorkout',
    workoutId: workout.id,
  });
  
  // Still show user-friendly message
  Alert.alert('Error', 'Failed to save workout. Please try again.');
}
```

### Add Debugging Breadcrumbs

```javascript
// Before critical operations
crashReporting.addBreadcrumb({
  message: 'Starting data sync',
  category: 'sync',
  data: { itemCount: items.length },
});

// User actions
crashReporting.addBreadcrumb({
  message: 'User clicked start workout',
  category: 'user-action',
  data: { workoutType: 'strength' },
});
```

### Set Custom Attributes

```javascript
// Set app state
crashReporting.setAttribute('offline_mode', 'true');
crashReporting.setAttribute('beta_features', 'enabled');
```

---

## 📊 Analytics

### Track Feature Usage

```javascript
import analyticsService from './src/services/analytics';

// Built-in events
analyticsService.logWorkoutStarted('strength', 45);
analyticsService.logMealLogged('breakfast', 500, 'camera');
analyticsService.logFeatureUsed('ai_scanner', { scanType: 'barcode' });

// Custom events
analyticsService.logEvent('premium_feature_accessed', {
  feature_name: 'custom_meal_plans',
  user_tier: 'free',
});
```

### Set User Properties (Segmentation)

```javascript
// When user completes quiz or updates profile
analyticsService.setUserProperties({
  fitness_goal: 'weight_loss',
  activity_level: 'moderate',
  subscription_tier: 'premium',
  onboarding_completed: true,
});
```

---

## 🛡️ Error Boundaries

### Wrap New Screens

```javascript
// In navigation stack
<Stack.Screen name="NewFeature">
  {(props) => (
    <ErrorBoundary 
      stackName="New Feature" 
      fallbackRoute="Main"
      onError={(error) => {
        // Custom handling
        console.log('NewFeature crashed:', error);
      }}
    >
      <NewFeatureScreen {...props} />
    </ErrorBoundary>
  )}
</Stack.Screen>
```

---

## 🔄 API Error Handling

### Use Retry Helper

```javascript
import api from './src/services/api';

// Automatically retries on rate limits and network errors
const data = await api.withRetries(
  () => api.getWorkouts(),
  { retries: 3, endpoint: '/workouts' }
);
```

### Handle Specific Errors

```javascript
import { ApiError } from './src/services/api';

try {
  await api.createWorkout(workoutData);
} catch (error) {
  if (error instanceof ApiError) {
    switch (error.code) {
      case 'RATE_LIMIT':
        // Will auto-retry, but you can show custom UI
        setShowRateLimitModal(true);
        break;
      case 'BAD_JSON':
        // Server error, report it
        crashReporting.logError(error, { endpoint: '/workouts' });
        break;
    }
  }
}
```

---

## 🏥 HealthKit Integration

### Use in New Screens

```javascript
import { useHealthKit } from './src/hooks/useHealthKit';

function MyScreen() {
  const { 
    isAvailable, 
    isAuthorized, 
    steps, 
    requestPermissions 
  } = useHealthKit();
  
  // Show connect button if not authorized
  if (!isAvailable || !isAuthorized) {
    return (
      <Button 
        onPress={async () => {
          const granted = await requestPermissions();
          if (!granted) {
            Alert.alert('Permission Denied', 'Enable Health permissions...');
          }
        }}
      >
        Connect Apple Health
      </Button>
    );
  }
  
  // Show data when authorized
  return <Text>{steps.toLocaleString()} steps</Text>;
}
```

---

## 🔄 React Query Patterns

### Add New Query

```javascript
// In src/hooks/useUserData.ts
export function useMyNewData() {
  return useQuery({
    queryKey: ['myNewData'],
    queryFn: async () => {
      const response = await api.getMyNewData();
      return response?.data || response;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
```

### Add New Mutation with Invalidation

```javascript
export function useUpdateMyData() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data) => {
      return await api.updateMyData(data);
    },
    onSuccess: () => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['myNewData'] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      
      Toast.show({
        type: 'success',
        text1: 'Updated',
        text2: 'Your data has been updated',
      });
      
      // Track analytics
      analyticsService.logEvent('data_updated', { type: 'myNewData' });
    },
    onError: (error) => {
      // Log error
      crashReporting.logError(error, { context: 'updateMyData' });
      
      Toast.show({
        type: 'error',
        text1: 'Update Failed',
        text2: error?.message || 'Please try again',
      });
    },
  });
}
```

---

## 🧪 Testing Helpers

### Trigger Test Error (Dev Only)

```javascript
if (__DEV__) {
  // This won't crash in production
  crashReporting.logError(
    new Error('Test error for debugging'),
    { test: true, screen: 'TestScreen' }
  );
}
```

### Log Test Analytics Event

```javascript
analyticsService.logEvent('test_event', {
  test: true,
  timestamp: Date.now(),
});
```

---

## 📋 Checklist for New Features

When adding a new feature:

- [ ] Wrap screen in ErrorBoundary
- [ ] Add try/catch around risky operations
- [ ] Log errors with context
- [ ] Add breadcrumbs before critical operations
- [ ] Track key user actions with analytics
- [ ] Add query invalidation for data updates
- [ ] Handle loading and error states in UI
- [ ] Test offline behavior
- [ ] Test error recovery

---

## 🔗 Common Imports

```javascript
// Crash Reporting
import crashReporting from './src/services/crashReporting';

// Analytics
import analyticsService from './src/services/analytics';

// API & Errors
import api, { ApiError } from './src/services/api';

// React Query
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// User Data Hooks
import { useProfile, useGoals, useSaveQuiz, useUpdateProfile } from './src/hooks/useUserData';

// HealthKit
import { useHealthKit } from './src/hooks/useHealthKit';

// Error Boundary
import ErrorBoundary from './src/components/ErrorBoundary';
```

---

## 📚 Full Documentation

- **Setup Guide:** `CRASH_REPORTING_SETUP.md`
- **Implementation Summary:** `STABILITY_IMPROVEMENTS_SUMMARY.md`
- **API Service:** `src/services/api.js`
- **Crash Reporting:** `src/services/crashReporting.js`
- **Analytics:** `src/services/analytics.js`

---

**Last Updated:** October 9, 2025

