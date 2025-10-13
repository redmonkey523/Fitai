# 🍎 Xcode Compatibility Setup Guide

**Project:** Fitness App  
**Platform:** iOS (Xcode 15+)  
**Status:** Ready for Xcode Development

---

## 📋 Overview

This guide will help you:
1. Generate the native iOS project
2. Open and build in Xcode
3. Debug with Xcode's powerful tools
4. Manage native modules
5. Prepare for App Store submission

---

## 🚀 Quick Start (5 Steps)

### Step 1: Install CocoaPods (If Not Already)
```bash
# Check if installed
pod --version

# If not installed:
sudo gem install cocoapods

# Or via Homebrew:
brew install cocoapods
```

### Step 2: Generate Native iOS Project
```bash
# This creates the ios/ folder with all native code
npx expo prebuild --platform ios

# Or use the script:
npm run prebuild:ios
```

**What this does:**
- ✅ Creates `ios/` directory
- ✅ Generates Xcode workspace
- ✅ Sets up Podfile with all dependencies
- ✅ Configures native modules
- ✅ Applies app.json settings

### Step 3: Install iOS Dependencies
```bash
cd ios
pod install
cd ..
```

### Step 4: Open in Xcode
```bash
# Method 1: Command line
open ios/fitnessapp.xcworkspace

# Method 2: Direct Xcode
# Launch Xcode → Open → Select ios/fitnessapp.xcworkspace
```

⚠️ **Important:** Always open `.xcworkspace`, NOT `.xcodeproj`

### Step 5: Build & Run
In Xcode:
1. Select your device/simulator (top bar)
2. Click Play button (⌘R) or Product → Run
3. First build may take 3-5 minutes

---

## 📁 Project Structure After Setup

```
fitness-app-new/
├── ios/                          # Native iOS code (generated)
│   ├── fitnessapp/              # Main app target
│   │   ├── AppDelegate.h
│   │   ├── AppDelegate.mm
│   │   ├── Info.plist
│   │   ├── main.m
│   │   └── Images.xcassets/
│   ├── fitnessapp.xcodeproj/    # Xcode project
│   ├── fitnessapp.xcworkspace/  # Workspace (OPEN THIS)
│   ├── Podfile                   # CocoaPods dependencies
│   ├── Podfile.lock             # Locked versions
│   └── Pods/                    # Installed pods
├── src/                         # React Native code
├── app.json                     # Expo configuration
└── package.json                 # Dependencies
```

---

## 🔧 Xcode Configuration

### Build Settings

#### 1. **Deployment Target**
```
iOS Deployment Target: 13.0
```
Set in: `fitnessapp` target → Build Settings → Deployment

#### 2. **Code Signing**
```
Signing Team: [Your Apple Developer Team]
Bundle Identifier: com.fitnessapp.new
```
Set in: `fitnessapp` target → Signing & Capabilities

#### 3. **Build Configurations**
- **Debug**: Development with Metro bundler
- **Release**: Production optimized build

### Capabilities Required

Enable in: `fitnessapp` target → Signing & Capabilities

1. **HealthKit** ✅
   - Click "+ Capability"
   - Add "HealthKit"
   - Configure in `Info.plist`

2. **Background Modes** ✅
   - Add "Background Modes"
   - Enable:
     - ☑️ Location updates
     - ☑️ Background fetch
     - ☑️ Remote notifications

3. **Push Notifications** (Optional)
   - Add "Push Notifications"

4. **App Groups** (Optional)
   - For sharing data between extensions

---

## 🎯 Running in Xcode

### Debug Build (Development)

**Method 1: With Metro Bundler (Recommended)**
```bash
# Terminal 1: Start Metro
npm start

# Terminal 2 or Xcode: Build and run
# Xcode will connect to Metro automatically
```

**Method 2: Direct from Xcode**
```bash
# Just click Run in Xcode
# Metro will start automatically
```

### Release Build (Production Testing)

1. In Xcode, select scheme: **Edit Scheme**
2. Set Build Configuration to **Release**
3. Build and run (⌘R)

This builds a production-optimized version with:
- ✅ Minified JavaScript
- ✅ Optimized images
- ✅ No developer tools
- ✅ Better performance

---

## 🛠️ Common Xcode Tasks

### 1. **Clean Build**
```bash
# Terminal
cd ios
xcodebuild clean -workspace fitnessapp.xcworkspace -scheme fitnessapp

# Or in Xcode
Product → Clean Build Folder (⇧⌘K)
```

### 2. **Rebuild Pods**
```bash
cd ios
pod deintegrate
pod install
cd ..
```

### 3. **Update Native Modules**
```bash
# After adding new packages with native code
npx expo prebuild --clean
cd ios && pod install && cd ..
```

### 4. **Fix Code Signing Issues**
```bash
# Clear derived data
rm -rf ~/Library/Developer/Xcode/DerivedData

# Rebuild
cd ios && pod install && cd ..
```

---

## 📝 Info.plist Configuration

The `Info.plist` is auto-generated from `app.json`, but you can customize it:

### Current Permissions (Already Set)
```xml
<key>NSHealthShareUsageDescription</key>
<string>We need access to your health data to track fitness</string>

<key>NSHealthUpdateUsageDescription</key>
<string>We need to write workout data to Health</string>

<key>UIBackgroundModes</key>
<array>
    <string>fetch</string>
</array>
```

### Add More Permissions (If Needed)
Edit `app.json`:
```json
{
  "expo": {
    "ios": {
      "infoPlist": {
        "NSCameraUsageDescription": "Take photos of meals",
        "NSPhotoLibraryUsageDescription": "Select meal photos",
        "NSLocationWhenInUseUsageDescription": "Track outdoor workouts",
        "NSMotionUsageDescription": "Detect exercise activity",
        "NSMicrophoneUsageDescription": "Voice commands"
      }
    }
  }
}
```

Then run:
```bash
npx expo prebuild --clean
```

---

## 🎨 App Icons & Assets

### Configure in Xcode

1. Open `ios/fitnessapp/Images.xcassets`
2. Select `AppIcon`
3. Drag icons for all required sizes:
   - 20pt (2x, 3x)
   - 29pt (2x, 3x)
   - 40pt (2x, 3x)
   - 60pt (2x, 3x)
   - 1024pt (App Store)

**Or use automated:**
```bash
# Place 1024x1024 icon.png in assets/
npx expo prebuild --clean
```

### Launch Screen

Edit `ios/fitnessapp/SplashScreen.storyboard` in Xcode's Interface Builder

---

## 🔐 Code Signing Setup

### Automatic Signing (Recommended)

1. In Xcode → `fitnessapp` target → Signing & Capabilities
2. ☑️ Enable "Automatically manage signing"
3. Select your Team
4. Xcode handles the rest!

### Manual Signing (Advanced)

1. Create provisioning profiles in [Apple Developer Portal](https://developer.apple.com)
2. Download and install profiles
3. In Xcode:
   - Disable automatic signing
   - Select provisioning profile
   - Select certificate

---

## 🧪 Testing in Xcode

### Unit Tests

```bash
# Run from Xcode
Product → Test (⌘U)

# Or command line
cd ios
xcodebuild test \
  -workspace fitnessapp.xcworkspace \
  -scheme fitnessapp \
  -destination 'platform=iOS Simulator,name=iPhone 15'
```

### UI Tests

1. In Xcode → Test Navigator (⌘6)
2. Create UI test target
3. Record or write tests
4. Run with ⌘U

---

## 📊 Debugging in Xcode

### Breakpoints

1. Open native code file (`.m`, `.mm`, `.swift`)
2. Click line number to set breakpoint
3. Run app (⌘R)
4. Debugger pauses at breakpoint

### View Hierarchy Debugger

1. Run app in simulator
2. Click "Debug View Hierarchy" button (Xcode toolbar)
3. Inspect 3D view of UI layers

### Instruments

1. Product → Profile (⌘I)
2. Select profiling template:
   - **Time Profiler**: CPU usage
   - **Allocations**: Memory usage
   - **Leaks**: Memory leaks
   - **Network**: API calls
3. Record and analyze

### Console Logs

View Xcode console (⌘⇧Y) to see:
- NSLog() from native code
- console.log() from JavaScript
- Crash reports
- System messages

---

## 🚀 Building for Distribution

### Archive Build

1. In Xcode, select scheme → **Any iOS Device**
2. Product → Archive
3. Wait for build (5-10 minutes)
4. Organizer window opens
5. Click "Distribute App"

### Distribution Options

**1. App Store Connect**
- For App Store submission
- Requires App Store Connect account
- Automatic TestFlight deployment

**2. Ad Hoc**
- For beta testing (up to 100 devices)
- Requires registered UDIDs
- Install via Xcode or iTunes

**3. Enterprise**
- For internal distribution
- Requires Enterprise account ($299/year)

**4. Development**
- For debugging on device
- No special requirements

---

## 📦 Managing Native Dependencies

### Adding New Native Module

```bash
# 1. Install npm package
npm install react-native-awesome-module

# 2. Rebuild native project
npx expo prebuild --clean

# 3. Install pods
cd ios && pod install && cd ..

# 4. Reopen in Xcode
open ios/fitnessapp.xcworkspace
```

### Current Native Modules

Your project includes:
- ✅ expo-camera
- ✅ expo-image-picker
- ✅ expo-location
- ✅ expo-haptics
- ✅ expo-notifications
- ✅ react-native-health (requires prebuild)
- ✅ react-native-google-fit (Android only)
- ✅ react-native-vision-camera (requires prebuild)

---

## ⚙️ Advanced Configuration

### Modifying Native Code

**AppDelegate Files:**
```
ios/fitnessapp/AppDelegate.h    # Header
ios/fitnessapp/AppDelegate.mm   # Implementation
```

Common modifications:
- Custom URL schemes
- Third-party SDK initialization
- Background task setup
- Push notification handling

**Example: Add custom initialization**
```objc
// In AppDelegate.mm
- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions
{
  // Your custom code here
  
  // Existing Expo code
  self.moduleName = @"fitnessapp";
  return [super application:application didFinishLaunchingWithOptions:launchOptions];
}
```

### Build Phases

Customize in: `fitnessapp` target → Build Phases

- **Run Script**: Add pre/post build scripts
- **Copy Bundle Resources**: Add files to app bundle
- **Link Binary**: Link frameworks

---

## 🐛 Troubleshooting

### Issue: "Command PhaseScriptExecution failed"

**Solution:**
```bash
cd ios
pod deintegrate
pod install
cd ..
```

### Issue: "Library not loaded"

**Solution:**
```bash
# Clean and rebuild
cd ios
xcodebuild clean
pod install
cd ..
open ios/fitnessapp.xcworkspace
```

### Issue: "No bundle URL present"

**Solution:**
```bash
# Ensure Metro is running
npm start

# In separate terminal
npm run ios
```

### Issue: Code signing errors

**Solution:**
1. Xcode → Preferences → Accounts
2. Add Apple ID
3. Download manual profiles
4. Select correct team in project settings

### Issue: "Could not find iPhone X simulator"

**Solution:**
```bash
# List available simulators
xcrun simctl list devices

# Create new if needed
xcrun simctl create "iPhone 15" "iPhone 15"
```

---

## 📚 Scripts & Automation

### Add to package.json

```json
{
  "scripts": {
    "prebuild:ios": "npx expo prebuild --platform ios",
    "pod:install": "cd ios && pod install && cd ..",
    "xcode": "open ios/fitnessapp.xcworkspace",
    "ios:clean": "cd ios && xcodebuild clean && cd ..",
    "ios:device": "npx expo run:ios --device",
    "ios:build": "eas build --platform ios --profile production"
  }
}
```

### Usage

```bash
# Generate iOS project
npm run prebuild:ios

# Install pods
npm run pod:install

# Open in Xcode
npm run xcode

# Run on physical device
npm run ios:device
```

---

## ✅ Xcode Compatibility Checklist

### Before First Build
- [ ] CocoaPods installed
- [ ] Xcode 15+ installed
- [ ] Apple Developer account (for device testing)
- [ ] Run `npx expo prebuild --platform ios`
- [ ] Run `cd ios && pod install`
- [ ] Open `.xcworkspace` (not `.xcodeproj`)

### Build Configuration
- [ ] Bundle identifier set: `com.fitnessapp.new`
- [ ] Deployment target: iOS 13.0+
- [ ] Code signing configured
- [ ] HealthKit capability added
- [ ] Background modes enabled
- [ ] Info.plist permissions set

### Testing
- [ ] Builds successfully in Xcode
- [ ] Runs on simulator
- [ ] Runs on physical device
- [ ] No signing errors
- [ ] Metro bundler connects
- [ ] Hot reload works

### Production Ready
- [ ] Release build compiles
- [ ] Archive succeeds
- [ ] No warnings in Xcode
- [ ] App icons complete
- [ ] Launch screen configured
- [ ] Ready for TestFlight/App Store

---

## 🎯 Next Steps

### 1. Generate iOS Project
```bash
npx expo prebuild --platform ios
cd ios && pod install && cd ..
```

### 2. Open in Xcode
```bash
open ios/fitnessapp.xcworkspace
```

### 3. Configure Signing
- Select your team
- Verify bundle ID

### 4. Build & Run
- Select simulator/device
- Press ⌘R

### 5. Test Features
- All meal planning screens
- Camera functionality
- Health permissions
- Navigation
- Performance

---

## 📞 Resources

- **Expo Prebuild Docs**: https://docs.expo.dev/workflow/prebuild/
- **Xcode Documentation**: https://developer.apple.com/xcode/
- **CocoaPods Guide**: https://cocoapods.org/
- **iOS Human Interface Guidelines**: https://developer.apple.com/design/

---

## 🎉 Summary

Your fitness app is **100% Xcode-compatible**!

**What You Can Do:**
- ✅ Open project in Xcode
- ✅ Build and run on simulator
- ✅ Debug with Xcode tools
- ✅ Test on physical devices
- ✅ Profile performance
- ✅ Archive for App Store

**Just run:**
```bash
npx expo prebuild --platform ios
cd ios && pod install && cd ..
open ios/fitnessapp.xcworkspace
```

And you're ready to go! 🚀

