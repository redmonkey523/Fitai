# 🔧 Xcode Troubleshooting Guide

Quick solutions for common Xcode issues with your fitness app.

---

## 🚨 Build Errors

### Error: "No such module 'ExpoModulesCore'"

**Cause:** Pods not installed correctly

**Solution:**
```bash
cd ios
rm -rf Pods Podfile.lock
pod install
cd ..
```

---

### Error: "Command PhaseScriptExecution failed"

**Cause:** Script phase error, usually Metro bundler

**Solution 1:**
```bash
# Clear Metro cache
npm start -- --clear
```

**Solution 2:**
```bash
# Reset everything
cd ios
pod deintegrate
pod install
cd ..
```

---

### Error: "Library not loaded: @rpath/..."

**Cause:** Dynamic framework linking issue

**Solution:**
```bash
cd ios
xcodebuild clean -workspace fitnessapp.xcworkspace -scheme fitnessapp
pod install
cd ..
```

---

### Error: "Multiple commands produce..." 

**Cause:** Duplicate file references

**Solution:**
1. In Xcode → Build Phases
2. Check "Copy Bundle Resources"
3. Remove duplicate entries
4. Clean build folder (⇧⌘K)

---

## 🔐 Code Signing Errors

### Error: "No signing certificate found"

**Solution:**
1. Xcode → Preferences (⌘,)
2. Accounts tab
3. Add Apple ID
4. Download manual profiles
5. In project → Select team

---

### Error: "Provisioning profile doesn't match"

**Solution:**
1. Check bundle identifier: `com.fitnessapp.new`
2. Xcode → Project Settings → Signing
3. Enable "Automatically manage signing"
4. Select your team

---

### Error: "App ID with Identifier is not available"

**Solution:**
1. Go to [Apple Developer](https://developer.apple.com)
2. Certificates, Identifiers & Profiles
3. Register new App ID: `com.fitnessapp.new`
4. Enable capabilities (HealthKit, Push Notifications)
5. Recreate provisioning profile

---

## 📱 Simulator Issues

### Error: "Unable to boot simulator"

**Solution:**
```bash
# Kill all simulators
xcrun simctl shutdown all

# Restart Xcode
killall Xcode
```

---

### Error: "Simulator not found"

**Solution:**
```bash
# List available simulators
xcrun simctl list devices

# Create new if needed
xcrun simctl create "iPhone 15" "iPhone 15"
```

---

### Simulator is slow/laggy

**Solution:**
1. Hardware → Erase All Content and Settings
2. Or use physical device
3. Or enable GPU in simulator:
   - Debug → Graphics Quality Override → High

---

## 🔄 Metro Bundler Issues

### Error: "Metro bundler connection failed"

**Solution:**
```bash
# Terminal 1: Start Metro fresh
npm start -- --clear

# Terminal 2: Run iOS build
npm run ios
```

---

### Error: "Port 8081 already in use"

**Solution:**
```bash
# Find process using port 8081
lsof -ti:8081

# Kill it
kill -9 $(lsof -ti:8081)

# Or use different port
npm start -- --port 8082
```

---

### App shows old code after changes

**Solution:**
1. In simulator: ⌘R (Reload)
2. Or shake device → Reload
3. If still old:
```bash
npm start -- --clear
```

---

## 🏥 HealthKit Issues

### Error: "HealthKit not available"

**Cause:** Capability not added

**Solution:**
1. Xcode → Project → Signing & Capabilities
2. Click "+ Capability"
3. Add "HealthKit"
4. Build again

---

### Error: "NSHealthShareUsageDescription not found"

**Cause:** Missing permission in Info.plist

**Solution:**
Add to `app.json`:
```json
{
  "expo": {
    "ios": {
      "infoPlist": {
        "NSHealthShareUsageDescription": "Read health data",
        "NSHealthUpdateUsageDescription": "Write workout data"
      }
    }
  }
}
```

Then:
```bash
npx expo prebuild --clean
cd ios && pod install && cd ..
```

---

## 📷 Camera Issues

### Error: "Camera permission denied"

**Cause:** Missing Info.plist entry

**Solution:**
Add to `app.json`:
```json
{
  "expo": {
    "ios": {
      "infoPlist": {
        "NSCameraUsageDescription": "Take photos of meals",
        "NSPhotoLibraryUsageDescription": "Select meal photos"
      }
    }
  }
}
```

Rebuild:
```bash
npx expo prebuild --clean
```

---

## 🗺️ Location Issues

### Location permission not requested

**Solution:**
Add to `app.json`:
```json
{
  "expo": {
    "ios": {
      "infoPlist": {
        "NSLocationWhenInUseUsageDescription": "Track outdoor workouts",
        "NSLocationAlwaysAndWhenInUseUsageDescription": "Continue tracking"
      }
    }
  }
}
```

Rebuild:
```bash
npx expo prebuild --clean
```

---

## 🧹 Nuclear Options

### Nothing works? Try this:

#### Option 1: Clean Everything
```bash
# Stop all processes
killall node
killall Xcode

# Clean iOS
cd ios
rm -rf Pods Podfile.lock build DerivedData
pod deintegrate
pod install
xcodebuild clean -workspace fitnessapp.xcworkspace -scheme fitnessapp
cd ..

# Clean Node
rm -rf node_modules package-lock.json
npm install

# Clean Metro
npm start -- --clear
```

#### Option 2: Regenerate iOS Project
```bash
# Backup any custom native code!
npx expo prebuild --clean
cd ios && pod install && cd ..
```

#### Option 3: Delete Derived Data
```bash
rm -rf ~/Library/Developer/Xcode/DerivedData
rm -rf ~/Library/Caches/CocoaPods
```

---

## 🔍 Debugging Tips

### Enable Verbose Logging

**Xcode:**
1. Product → Scheme → Edit Scheme
2. Run → Arguments
3. Add: `-FIRDebugEnabled`

**Metro:**
```bash
npm start -- --verbose
```

---

### View Native Logs

**Console.app:**
1. Open Console app (⌘Space → Console)
2. Connect iOS device
3. Select device
4. Filter by "fitnessapp"

**Xcode:**
- Open Xcode → Window → Devices and Simulators
- Select device → View Device Logs

---

### Profile Performance

```bash
# Run with Instruments
npm run ios
# In Xcode: Product → Profile (⌘I)
# Select "Time Profiler" or "Allocations"
```

---

## 📞 Getting Help

### Check Build Logs

In Xcode:
1. Open Report Navigator (⌘9)
2. Select latest build
3. Expand errors
4. Read full error messages

### Export Build Log

1. Report Navigator (⌘9)
2. Right-click build
3. Export Log
4. Share for debugging

### Useful Commands

```bash
# Check Xcode version
xcodebuild -version

# Check CocoaPods version
pod --version

# Check available simulators
xcrun simctl list devices

# Check React Native version
npx react-native --version

# Check Expo version
npx expo --version
```

---

## 🎯 Prevention

### Before Each Build Session

```bash
# Update dependencies
npm install
cd ios && pod install && cd ..

# Clean caches
npm start -- --clear

# Verify configuration
node scripts/ios-compatibility-check.js
```

### Regular Maintenance

```bash
# Weekly: Update Xcode via App Store
# Weekly: Update CocoaPods
sudo gem update cocoapods

# Monthly: Clear derived data
rm -rf ~/Library/Developer/Xcode/DerivedData

# Monthly: Update dependencies
npm update
cd ios && pod update && cd ..
```

---

## ✅ Quick Checks

When something breaks, check these first:

- [ ] Metro bundler is running
- [ ] Correct scheme selected (fitnessapp)
- [ ] Correct device/simulator selected
- [ ] Code signing team selected
- [ ] Bundle ID matches: `com.fitnessapp.new`
- [ ] Pods are installed (`ios/Pods` folder exists)
- [ ] Opening `.xcworkspace` (not `.xcodeproj`)
- [ ] iOS deployment target is 13.0+
- [ ] Xcode command line tools installed

---

## 🆘 Still Stuck?

1. **Check logs**: Xcode Report Navigator (⌘9)
2. **Google error**: Copy exact error message
3. **Check GitHub issues**: [Expo Issues](https://github.com/expo/expo/issues)
4. **Ask community**: [Expo Forums](https://forums.expo.dev/)
5. **Stack Overflow**: Tag with `react-native`, `expo`, `xcode`

---

**Last Resort:**
```bash
# Complete reset (CAUTION: Loses custom native code)
rm -rf ios android node_modules package-lock.json
npm install
npx expo prebuild --clean
cd ios && pod install && cd ..
npm run xcode
```

---

📚 **See also:**
- `XCODE_SETUP_GUIDE.md` - Initial setup
- `IOS_READINESS_REPORT.md` - Compatibility info
- `HEALTH_INTEGRATION_SETUP.md` - Health features

Good luck! 🍀

