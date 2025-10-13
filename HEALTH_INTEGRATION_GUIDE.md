# Health Integration Guide
## Apple Health (iOS) & Google Fit (Android)

This guide covers everything you need to know about the health integration in your fitness app.

---

## 📱 Overview

The app now has **comprehensive health data integration**:

| Feature | iOS (Apple Health) | Android (Google Fit) |
|---------|-------------------|---------------------|
| Steps | ✅ | ✅ |
| Calories Burned | ✅ | ✅ |
| Heart Rate | ✅ | ✅ |
| Weight | ✅ | ✅ |
| Workouts | ✅ | ✅ |
| Distance | ✅ | ✅ |
| Sleep | ✅ | ✅ |
| Water/Hydration | ✅ | ⚠️ Limited |

---

## 🏗️ Architecture

### Services Created:

1. **`healthKitEnhanced.js`** - iOS Apple Health integration
2. **`googleFit.js`** - Android Google Fit integration
3. **`healthService.js`** - Unified API (platform-agnostic)

### Why Three Services?

```javascript
// ✅ Use This (Platform-Agnostic)
import healthService from './services/healthService';
await healthService.getSteps(); // Works on iOS & Android!

// ❌ Don't Use These Directly
import healthKit from './services/healthKitEnhanced'; // iOS only
import googleFit from './services/googleFit'; // Android only
```

---

## 📦 Installation

### Step 1: Install Dependencies

```bash
npm install react-native-health react-native-google-fit
```

**Dependencies Added:**
- `react-native-health@^1.19.0` - Apple Health integration
- `react-native-google-fit@^0.19.0` - Google Fit integration

### Step 2: iOS Configuration

#### 2a. Add HealthKit Capability

1. Open `ios/[YourApp].xcworkspace` in Xcode
2. Select your target → **Signing & Capabilities**
3. Click **+ Capability** → **HealthKit**
4. Enable these options:
   - ☑️ **Clinical Health Records**
   - ☑️ **Background Delivery**

#### 2b. Add Privacy Descriptions

Edit `ios/[YourApp]/Info.plist`:

```xml
<key>NSHealthShareUsageDescription</key>
<string>We need access to read your health data to track your fitness progress</string>
<key>NSHealthUpdateUsageDescription</key>
<string>We need access to save workout data to your Health app</string>
```

#### 2c. Rebuild iOS App

```bash
cd ios
pod install
cd ..
npx expo run:ios
```

### Step 3: Android Configuration

#### 3a. Update AndroidManifest.xml

Edit `android/app/src/main/AndroidManifest.xml`:

```xml
<manifest xmlns:android="http://schemas.android.com/apk/res/android">
  <!-- Add these permissions -->
  <uses-permission android:name="android.permission.ACTIVITY_RECOGNITION" />
  
  <application>
    <!-- Existing config... -->
    
    <!-- Add Google Fit Activity -->
    <activity
      android:name="com.google.android.gms.auth.api.signin.GoogleSignInActivity"
      android:exported="false" />
  </application>
</manifest>
```

#### 3b. Enable Google Fit API

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project (or create one)
3. Enable **Fitness API**
4. Create OAuth 2.0 credentials:
   - Type: **Android**
   - Package name: `com.yourcompany.fitnessapp`
   - SHA-1: Get from `cd android && ./gradlew signingReport`

#### 3c. Rebuild Android App

```bash
npx expo run:android
```

---

## 🚀 Usage

### Basic Setup

```javascript
import healthService from './services/healthService';
import { useEffect, useState } from 'react';

function MyComponent() {
  const [healthData, setHealthData] = useState(null);

  useEffect(() => {
    async function setup() {
      // 1. Initialize service
      await healthService.initialize();
      
      // 2. Check if available
      const status = healthService.getStatus();
      if (!status.isAvailable) {
        console.log('Health service not available on this device');
        return;
      }
      
      // 3. Request permissions
      const result = await healthService.requestPermissions();
      if (result.success) {
        // 4. Fetch data
        const data = await healthService.getAllData();
        setHealthData(data);
        
        // 5. Start auto-refresh (polls every 5 minutes)
        healthService.startObserver();
      }
    }
    
    setup();
    
    return () => {
      // Cleanup on unmount
      healthService.stopObserver();
    };
  }, []);

  return (
    <View>
      {healthData && (
        <>
          <Text>Steps: {healthData.steps}</Text>
          <Text>Calories: {healthData.calories}</Text>
          <Text>Heart Rate: {healthData.heartRate} bpm</Text>
          <Text>Weight: {healthData.weight} kg</Text>
        </>
      )}
    </View>
  );
}
```

### Read Data

```javascript
// Get individual data types
const steps = await healthService.getSteps();
const calories = await healthService.getCalories();
const heartRate = await healthService.getHeartRate();
const weight = await healthService.getWeight();

// Get all data at once
const allData = await healthService.getAllData();
console.log(allData);
// {
//   steps: 8524,
//   calories: 2150,
//   heartRate: 72,
//   weight: 75.5,
//   timestamp: "2025-10-09T12:00:00.000Z"
// }

// Get cached data (no network call)
const cached = healthService.getCachedData();
```

### Write Data

```javascript
// Save workout
const success = await healthService.saveWorkout({
  type: 'Running',
  name: 'Morning Run',
  startDate: new Date('2025-10-09T07:00:00Z'),
  endDate: new Date('2025-10-09T07:30:00Z'),
  calories: 300,
  distance: 5000, // meters
});

// Save weight
await healthService.saveWeight(75.5); // kg
```

### Subscribe to Updates

```javascript
// Subscribe to real-time step updates
const unsubscribe = healthService.subscribe('steps', (steps) => {
  console.log('Steps updated:', steps);
  setSteps(steps);
});

// Later, unsubscribe
unsubscribe();

// Available subscription types:
// - 'steps'
// - 'calories'
// - 'heartRate'
// - 'weight'
```

### Refresh Data Manually

```javascript
// Force refresh (useful for pull-to-refresh)
const freshData = await healthService.refresh();
```

### Check Status

```javascript
const status = healthService.getStatus();
console.log(status);
// {
//   isAvailable: true,
//   isAuthorized: true,
//   initialized: true,
//   platform: 'ios',
//   serviceName: 'Apple Health'
// }
```

---

## 🧪 Testing on Real Devices

### Why Real Devices?

**Simulators/Emulators DO NOT support health APIs!**

- iOS Simulator: ❌ No HealthKit
- Android Emulator: ❌ No Google Fit
- Real iPhone: ✅ HealthKit works
- Real Android Phone: ✅ Google Fit works

### iOS Testing Steps

#### 1. Build on Real Device

```bash
# Connect iPhone via USB
# Ensure device is trusted and in developer mode

npx expo run:ios --device
```

#### 2. Generate Test Data

Apple Health doesn't have mock data, so you need real or manual data:

**Option A: Use Your Real Data**
- Just walk around with your phone
- Apple Health will automatically track steps

**Option B: Manually Add Data**
1. Open **Health app** on iPhone
2. Tap **Browse** → **Activity** → **Steps**
3. Tap **Add Data** (top right)
4. Add today's date with 5000 steps
5. Similarly add:
   - **Active Energy**: 500 kcal
   - **Heart Rate**: 75 bpm
   - **Weight**: Your weight

#### 3. Run Your App

```bash
npx expo run:ios --device
```

#### 4. Grant Permissions

When prompted:
- ☑️ **Allow [App] to Read Data** → Tap **Allow**
- Select all data types you want to allow
- Tap **Allow** or **Turn On All**

#### 5. Verify Data Appears

Your app should now display:
- ✅ Today's steps
- ✅ Calories burned
- ✅ Heart rate (if available)
- ✅ Weight

#### 6. Test Write Operations

```javascript
// Try saving a workout
await healthService.saveWorkout({
  type: 'Running',
  name: 'Test Run',
  startDate: new Date(Date.now() - 30 * 60 * 1000), // 30 min ago
  endDate: new Date(),
  calories: 250,
  distance: 3000,
});
```

Check Health app → **Workouts** to see if it appears!

### Android Testing Steps

#### 1. Install Google Fit

```bash
# On your Android device:
# 1. Open Play Store
# 2. Install "Google Fit" app
# 3. Open it and complete setup
# 4. Allow all permissions
```

#### 2. Generate Test Data

**Option A: Use Real Data**
- Walk with your phone
- Google Fit will auto-track

**Option B: Manually Add Data**
1. Open **Google Fit** app
2. Tap **Profile** → **⚙️ Settings**
3. Enable **Track your activities**
4. Go back to Home
5. Tap **+** → **Add weight** → Enter your weight
6. Walk around or manually add activities

#### 3. Build on Real Device

```bash
# Connect Android phone via USB
# Enable "Developer Options" and "USB Debugging"

npx expo run:android --device
```

#### 4. Grant Permissions

When prompted:
- Tap **Continue** → **Google Fit**
- Choose your Google account
- Tap **Allow** for all requested permissions

#### 5. Verify Data

Your app should display Google Fit data:
- ✅ Steps
- ✅ Calories
- ✅ Heart rate (if device has sensor)
- ✅ Weight

#### 6. Test Write Operations

```javascript
await healthService.saveWorkout({
  type: 'Running',
  name: 'Test Run',
  startDate: new Date(Date.now() - 30 * 60 * 1000),
  endDate: new Date(),
  calories: 250,
  distance: 3000,
});
```

Check Google Fit app to see if the workout appears!

---

## 🐛 Troubleshooting

### iOS Issues

#### "Health app not available"
- **Cause**: Running on Simulator
- **Fix**: Use real device

#### "Permission denied"
- **Cause**: User denied permissions
- **Fix**: 
  1. Open **Settings** → **Privacy & Security** → **Health**
  2. Find your app
  3. Enable desired permissions

#### "No data returned"
- **Cause**: No data in Health app for today
- **Fix**: Add manual data (see Testing section)

#### Build Errors

```bash
# Clean and rebuild
cd ios
rm -rf Pods Podfile.lock
pod install
cd ..
npx expo run:ios --device
```

### Android Issues

#### "Google Fit not available"
- **Cause**: Running on emulator OR Google Fit not installed
- **Fix**: 
  1. Use real device
  2. Install Google Fit from Play Store

#### "Authorization failed"
- **Cause**: OAuth credentials not configured
- **Fix**: 
  1. Enable Fitness API in Google Cloud Console
  2. Create OAuth 2.0 credentials
  3. Use correct SHA-1 fingerprint

#### "No data returned"
- **Cause**: No data in Google Fit
- **Fix**: Walk with your phone or manually add data

#### Build Errors

```bash
# Clean and rebuild
cd android
./gradlew clean
cd ..
npx expo run:android --device
```

---

## 🔒 Privacy & Permissions

### What Data We Access

**Read Permissions:**
- Steps, distance
- Calories burned (active + basal)
- Heart rate
- Weight, BMI, body fat %
- Workouts/activities
- Sleep analysis
- Water intake

**Write Permissions:**
- Workouts
- Weight
- Water intake

### User Control

- ✅ Users can grant/deny each permission individually
- ✅ Users can revoke permissions anytime in Settings
- ✅ All data stays on device (unless synced by user)
- ✅ We never share health data with third parties

### Best Practices

1. **Request permissions contextually**
   - Don't ask on app launch
   - Ask when feature is needed

2. **Explain why you need data**
   - Show clear privacy descriptions
   - Explain benefits to user

3. **Respect denials**
   - Don't repeatedly ask
   - Provide manual input alternative

---

## 📊 Data Types Reference

### Common Data Types

| Type | iOS | Android | Unit |
|------|-----|---------|------|
| Steps | `StepCount` | `STEP_COUNT_DELTA` | count |
| Distance | `DistanceWalkingRunning` | `DISTANCE_DELTA` | meters |
| Calories | `ActiveEnergyBurned` | `CALORIES_EXPENDED` | kcal |
| Heart Rate | `HeartRate` | `HEART_RATE_BPM` | bpm |
| Weight | `BodyMass` | `WEIGHT` | kg |
| Height | `Height` | `HEIGHT` | cm |
| BMI | `BodyMassIndex` | `BODY_FAT_PERCENTAGE` | ratio |

### Workout Types

| Display Name | iOS | Android |
|--------------|-----|---------|
| Running | `Running` | `running` |
| Walking | `Walking` | `walking` |
| Cycling | `Cycling` | `biking` |
| Swimming | `Swimming` | `swimming` |
| Yoga | `Yoga` | `yoga` |
| Strength | `TraditionalStrengthTraining` | `strength_training` |
| HIIT | `HighIntensityIntervalTraining` | `interval_training` |
| Other | `Other` | `other` |

---

## 🎯 Integration Examples

### Example 1: Dashboard Widget

```javascript
import healthService from './services/healthService';

function HealthDashboard() {
  const [data, setData] = useState(healthService.getCachedData());

  useEffect(() => {
    const unsubscribe = healthService.subscribe('steps', (steps) => {
      setData(prev => ({ ...prev, steps }));
    });
    
    return unsubscribe;
  }, []);

  return (
    <View style={styles.dashboard}>
      <Card>
        <Text>👟 {data.steps} steps</Text>
        <Progress value={data.steps} max={10000} />
      </Card>
      
      <Card>
        <Text>🔥 {data.calories} kcal</Text>
        <Progress value={data.calories} max={2500} />
      </Card>
      
      <Card>
        <Text>❤️ {data.heartRate} bpm</Text>
      </Card>
    </View>
  );
}
```

### Example 2: Workout Tracking

```javascript
function WorkoutSession({ workout }) {
  const [startTime, setStartTime] = useState(null);

  const startWorkout = () => {
    setStartTime(new Date());
  };

  const endWorkout = async () => {
    const endTime = new Date();
    
    await healthService.saveWorkout({
      type: workout.type,
      name: workout.name,
      startDate: startTime,
      endDate: endTime,
      calories: calculateCalories(startTime, endTime),
      distance: getDistance(), // From GPS tracking
    });
    
    Toast.show({
      type: 'success',
      text1: 'Workout Saved',
      text2: 'Synced to your health app',
    });
  };

  return (
    <View>
      {!startTime ? (
        <Button onPress={startWorkout} title="Start Workout" />
      ) : (
        <Button onPress={endWorkout} title="Finish & Save" />
      )}
    </View>
  );
}
```

### Example 3: Progress Tracking

```javascript
async function WeightProgressScreen() {
  const [weights, setWeights] = useState([]);

  useEffect(() => {
    async function fetchWeightHistory() {
      // Get weight data from health service (if available)
      const latestWeight = await healthService.getWeight();
      
      if (latestWeight) {
        setWeights(prev => [...prev, {
          date: new Date(),
          value: latestWeight,
          source: 'health_app',
        }]);
      }
    }
    
    fetchWeightHistory();
  }, []);

  const logWeight = async (weight) => {
    // Save to both our DB and health platform
    await api.logWeight(weight);
    await healthService.saveWeight(weight);
    
    Toast.show({
      type: 'success',
      text1: 'Weight Logged',
      text2: 'Saved to your health app',
    });
  };

  return (
    <View>
      <LineChart data={weights} />
      <WeightInput onSubmit={logWeight} />
    </View>
  );
}
```

---

## ✅ Complete Testing Checklist

### iOS (Apple Health)

- [ ] Built app on real iPhone
- [ ] HealthKit capability enabled in Xcode
- [ ] Privacy descriptions added to Info.plist
- [ ] Health app has test data
- [ ] App requests permissions on first use
- [ ] Permissions granted in Health app
- [ ] Steps data displays correctly
- [ ] Calories data displays correctly
- [ ] Heart rate data displays correctly
- [ ] Weight data displays correctly
- [ ] Workout can be saved
- [ ] Saved workout appears in Health app
- [ ] Background observer works (data refreshes)
- [ ] App works when permissions denied (graceful fallback)

### Android (Google Fit)

- [ ] Built app on real Android device
- [ ] Google Fit app installed and set up
- [ ] Fitness API enabled in Google Cloud
- [ ] OAuth credentials configured
- [ ] AndroidManifest permissions added
- [ ] Google Fit has test data
- [ ] App requests Google Fit authorization
- [ ] Authorization granted
- [ ] Steps data displays correctly
- [ ] Calories data displays correctly
- [ ] Heart rate data displays correctly (if sensor available)
- [ ] Weight data displays correctly
- [ ] Workout can be saved
- [ ] Saved workout appears in Google Fit
- [ ] Background observer works
- [ ] App works when authorization denied (graceful fallback)

---

## 📝 Next Steps

1. ✅ Install dependencies
2. ✅ Configure iOS (Xcode + Info.plist)
3. ✅ Configure Android (Manifest + Google Cloud)
4. ✅ Test on real devices
5. ✅ Integrate into your UI
6. 🔄 Monitor crash reports for health-related errors
7. 🔄 Collect user feedback

---

## 🆘 Need Help?

- **iOS Issues**: Check Apple's [HealthKit documentation](https://developer.apple.com/documentation/healthkit)
- **Android Issues**: Check Google's [Fit REST API docs](https://developers.google.com/fit)
- **Library Issues**: Check [react-native-health](https://github.com/agencyenterprise/react-native-health) and [react-native-google-fit](https://github.com/StasDoskalenko/react-native-google-fit)

---

**Health integration is now complete!** 🎉

The app can now read and write comprehensive health data on both iOS and Android devices.


