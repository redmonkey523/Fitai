# Step Tracking Integration Guide

## Overview
Currently, the app shows step data as 0/0 (or mock data). To show **real step data** from the user's phone or Apple Watch, you need to integrate with native health APIs.

---

## For iOS (Apple Health / HealthKit)

### 1. Install Required Package
```bash
npx expo install expo-sensors @react-native-community/apple-healthkit
```

### 2. Add Permissions to app.json
```json
{
  "expo": {
    "ios": {
      "infoPlist": {
        "NSHealthShareUsageDescription": "We need access to your step count to track your daily activity goals.",
        "NSHealthUpdateUsageDescription": "We need access to update your health data."
      }
    },
    "plugins": [
      [
        "expo-apple-health-kit",
        {
          "healthSharePermission": "Allow $(PRODUCT_NAME) to read your step count"
        }
      ]
    ]
  }
}
```

### 3. Example Code to Get Steps (iOS)
```javascript
import AppleHealthKit from 'react-native-health';

const getTodaysSteps = async () => {
  const permissions = {
    permissions: {
      read: [AppleHealthKit.Constants.Permissions.StepCount],
    },
  };

  AppleHealthKit.initHealthKit(permissions, (error) => {
    if (error) {
      console.log('HealthKit error:', error);
      return;
    }

    const options = {
      date: new Date().toISOString(), // Today's date
      includeManuallyAdded: true,
    };

    AppleHealthKit.getStepCount(options, (err, results) => {
      if (err) {
        console.log('Error getting steps:', err);
        return;
      }

      console.log('Today\'s steps:', results.value);
      // Update your state here
      setNutritionData(prev => ({
        ...prev,
        steps: { ...prev.steps, current: results.value }
      }));
    });
  });
};
```

---

## For Android (Google Fit)

### 1. Install Required Package
```bash
npx expo install expo-sensors react-native-google-fit
```

### 2. Add Permissions to AndroidManifest.xml
```xml
<uses-permission android:name="android.permission.ACTIVITY_RECOGNITION"/>
<uses-permission android:name="com.google.android.gms.permission.ACTIVITY_RECOGNITION"/>
```

### 3. Example Code to Get Steps (Android)
```javascript
import GoogleFit, { Scopes } from 'react-native-google-fit';

const getTodaysSteps = async () => {
  const options = {
    scopes: [
      Scopes.FITNESS_ACTIVITY_READ,
      Scopes.FITNESS_LOCATION_READ,
    ],
  };

  GoogleFit.authorize(options)
    .then(authResult => {
      if (authResult.success) {
        const opt = {
          startDate: new Date().setHours(0, 0, 0, 0),
          endDate: new Date().getTime(),
        };

        GoogleFit.getDailyStepCountSamples(opt)
          .then(res => {
            const steps = res.find(s => s.source === 'com.google.android.gms');
            const totalSteps = steps?.steps?.reduce((sum, step) => sum + step.value, 0) || 0;
            
            console.log('Today\'s steps:', totalSteps);
            // Update your state here
            setNutritionData(prev => ({
              ...prev,
              steps: { ...prev.steps, current: totalSteps }
            }));
          });
      }
    })
    .catch(err => {
      console.log('Google Fit error:', err);
    });
};
```

---

## Cross-Platform Solution (Recommended)

Use **Expo Sensors + Pedometer** for basic step counting (works on both iOS and Android):

### 1. Install Expo Pedometer
```bash
npx expo install expo-sensors
```

### 2. Request Permissions
```javascript
import { Pedometer } from 'expo-sensors';

const requestPedometerPermission = async () => {
  const { status } = await Pedometer.requestPermissionsAsync();
  return status === 'granted';
};
```

### 3. Get Today's Steps
```javascript
import { Pedometer } from 'expo-sensors';

const getTodaysSteps = async () => {
  const isAvailable = await Pedometer.isAvailableAsync();
  
  if (!isAvailable) {
    Alert.alert('Not Available', 'Step counting is not available on this device.');
    return;
  }

  const hasPermission = await requestPedometerPermission();
  if (!hasPermission) {
    Alert.alert('Permission Denied', 'We need permission to access your step count.');
    return;
  }

  const start = new Date();
  start.setHours(0, 0, 0, 0);
  
  const end = new Date();

  const result = await Pedometer.getStepCountAsync(start, end);
  
  console.log('Today\'s steps:', result.steps);
  
  // Update your state
  setNutritionData(prev => ({
    ...prev,
    steps: { ...prev.steps, current: result.steps }
  }));
};
```

### 4. Subscribe to Real-Time Updates
```javascript
import { Pedometer } from 'expo-sensors';

useEffect(() => {
  let subscription;

  const subscribe = async () => {
    const isAvailable = await Pedometer.isAvailableAsync();
    if (!isAvailable) return;

    subscription = Pedometer.watchStepCount(result => {
      // Real-time step updates
      setNutritionData(prev => ({
        ...prev,
        steps: { ...prev.steps, current: prev.steps.current + result.steps }
      }));
    });
  };

  subscribe();

  return () => {
    subscription && subscription.remove();
  };
}, []);
```

---

## Where to Add This Code

### In `src/screens/HomeScreen.js`:

```javascript
import { Pedometer } from 'expo-sensors';
import { Alert, Platform } from 'react-native';

// Add this useEffect after your existing ones
useEffect(() => {
  const fetchTodaysSteps = async () => {
    try {
      const isAvailable = await Pedometer.isAvailableAsync();
      
      if (!isAvailable) {
        console.log('Pedometer not available');
        return;
      }

      const { status } = await Pedometer.requestPermissionsAsync();
      
      if (status !== 'granted') {
        console.log('Pedometer permission not granted');
        return;
      }

      const start = new Date();
      start.setHours(0, 0, 0, 0);
      const end = new Date();

      const result = await Pedometer.getStepCountAsync(start, end);
      
      setNutritionData(prev => ({
        ...prev,
        steps: { ...prev.steps, current: result.steps }
      }));
    } catch (error) {
      console.error('Error fetching steps:', error);
    }
  };

  fetchTodaysSteps();
  
  // Optional: Set up real-time updates
  let subscription;
  const setupSubscription = async () => {
    const isAvailable = await Pedometer.isAvailableAsync();
    if (isAvailable) {
      subscription = Pedometer.watchStepCount(result => {
        setNutritionData(prev => ({
          ...prev,
          steps: { ...prev.steps, current: Math.max(prev.steps.current, result.steps) }
        }));
      });
    }
  };
  
  setupSubscription();

  return () => {
    subscription && subscription.remove();
  };
}, []);
```

---

## Apple Watch Integration

For Apple Watch, the HealthKit API automatically syncs data from the watch to the iPhone. Once you implement HealthKit integration (iOS section above), step data from Apple Watch will automatically be included in the step count.

**No additional code is needed for Apple Watch** - it works through HealthKit automatically!

---

## Testing

1. **iOS Simulator**: Steps won't work in simulator, must test on real device
2. **Android Emulator**: Steps won't work in emulator, must test on real device
3. **Real Device**: Steps will be tracked from the device's built-in sensors
4. **Apple Watch**: Steps will sync automatically via HealthKit

---

## Production Considerations

1. **Privacy**: Always request permissions with clear explanations
2. **Battery**: Step tracking uses sensors continuously - optimize polling
3. **Offline**: Cache step data locally when offline
4. **Accuracy**: Built-in pedometers are ~95% accurate for walking/running
5. **Background**: May need background location permissions for continuous tracking

---

## Quick Implementation Steps

1. Install `expo-sensors`:
   ```bash
   npx expo install expo-sensors
   ```

2. Add the code from "Where to Add This Code" section to `HomeScreen.js`

3. Test on a real device (simulator won't work)

4. For production, add proper error handling and permission UI

---

## Current Status

✅ Step goals can be set in the Goal Quiz
✅ Step tracking UI is ready in Home screen
❌ Real device integration not yet implemented (shows 0/0 or mock data)

**Recommendation**: Use Expo Pedometer for initial release, then add HealthKit/Google Fit for enhanced features.

