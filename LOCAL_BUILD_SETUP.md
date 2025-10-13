# Local Build Setup Guide

## Why Local Builds?

- ✅ No queue time (instant builds)
- ✅ Test all native features (camera, file system, etc.)
- ✅ Fast iteration during development
- ✅ Free during testing phase
- 💰 Use EAS paid tier later for production deployment

---

## Step 1: Install Android Studio

1. **Download**: https://developer.android.com/studio
2. **Install**: Follow the installer (accept all defaults)
3. **Open Android Studio**: Launch after installation

---

## Step 2: Configure Android Studio

### A. SDK Manager Setup
1. Open Android Studio
2. Click "More Actions" → "SDK Manager"
3. Under **SDK Platforms** tab:
   - ✅ Check "Android 14.0 (UpsideDownCake)" or latest
   - ✅ Check "Show Package Details"
   - ✅ Ensure "Android SDK Platform 34" is checked
4. Under **SDK Tools** tab:
   - ✅ Android SDK Build-Tools
   - ✅ Android Emulator
   - ✅ Android SDK Platform-Tools
   - ✅ Intel x86 Emulator Accelerator (HAXM) - if on Intel
5. Click "Apply" and wait for downloads

### B. Set Environment Variables
**Windows (PowerShell - Run as Administrator):**
```powershell
# Set ANDROID_HOME
[Environment]::SetEnvironmentVariable("ANDROID_HOME", "$env:LOCALAPPDATA\Android\Sdk", "User")

# Add to PATH
$path = [Environment]::GetEnvironmentVariable("Path", "User")
$newPath = "$path;$env:LOCALAPPDATA\Android\Sdk\platform-tools;$env:LOCALAPPDATA\Android\Sdk\emulator"
[Environment]::SetEnvironmentVariable("Path", $newPath, "User")

Write-Host "✅ Environment variables set! Close and reopen terminals." -ForegroundColor Green
```

**Close and reopen your terminal after running this!**

### C. Create Android Virtual Device (AVD)
1. In Android Studio: Click "More Actions" → "Virtual Device Manager"
2. Click "Create Device"
3. Select a device (e.g., "Pixel 5")
4. Download a system image (e.g., "UpsideDownCake" - Android 14)
5. Click "Next" → "Finish"
6. You now have an emulator!

---

## Step 3: Generate Native Android Project

In your project directory:

```bash
npx expo prebuild --platform android
```

This creates the `android` folder with native code.

---

## Step 4: Run on Android

### Option A: Run on Emulator
```bash
# Start emulator first (or launch from Android Studio)
npx expo run:android
```

### Option B: Run on Physical Device
1. Enable Developer Options on your phone:
   - Settings → About Phone → Tap "Build Number" 7 times
2. Enable USB Debugging:
   - Settings → Developer Options → USB Debugging
3. Connect phone via USB
4. Run:
   ```bash
   npx expo run:android
   ```

---

## Step 5: Development Workflow

```bash
# Start Metro bundler
npm start

# In another terminal, rebuild and run
npx expo run:android
```

**Hot Reload**: Most changes reload automatically!  
**Native Changes**: Rebuild with `npx expo run:android`

---

## 🔧 Troubleshooting

### "ANDROID_HOME not set"
Restart terminal after setting environment variables.

### "No devices found"
- Start emulator from Android Studio first
- OR connect physical device with USB debugging

### "Build failed"
```bash
cd android
./gradlew clean
cd ..
npx expo run:android
```

---

## 🚀 When Ready for Production

1. Test thoroughly on local builds
2. Fix all bugs and finish features
3. Sign up for EAS paid tier ($29/month)
4. Build production versions:
   ```bash
   eas build -p android --profile production
   eas build -p ios --profile production
   ```
5. Submit to stores:
   ```bash
   eas submit -p android
   eas submit -p ios
   ```

---

## ⏱️ Time Estimates

- Android Studio install: **20-30 minutes**
- First local build: **5-10 minutes**
- Subsequent builds: **2-3 minutes**
- Hot reload changes: **Instant!**

vs. EAS Free tier: 110+ minute queue 😅

---

## 💡 Pro Tips

1. **Keep EAS configured** - It's ready when you need it
2. **Test on physical device** - More realistic than emulator
3. **Use local builds for development** - Much faster iteration
4. **Use EAS for production** - Professional deployment

---

## 📋 Quick Start Checklist

- [ ] Install Android Studio
- [ ] Configure SDK Manager
- [ ] Set environment variables
- [ ] Create AVD (emulator)
- [ ] Close and reopen terminal
- [ ] Run `npx expo prebuild --platform android`
- [ ] Run `npx expo run:android`
- [ ] 🎉 App running!

---

**Need help?** Check logs or ask for assistance at any step!

