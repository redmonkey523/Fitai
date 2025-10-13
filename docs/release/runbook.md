# 📚 Release Runbook - Native iOS/Android Deployment

**Project:** Fitness App  
**Platform:** iOS + Android (Native Only)  
**Last Updated:** October 7, 2025

---

## 🎯 Overview

This runbook covers building, testing, deploying, and rolling back the Fitness App for iOS and Android platforms using Expo Application Services (EAS).

**Prerequisites:**
- Node.js 22.14.0+
- npm 10.9.2+
- EAS CLI installed globally
- EAS account with build credits
- Apple Developer Account (for iOS)
- Google Play Developer Account (for Android)

---

## 🏗️ LOCAL DEVELOPMENT BUILD

### Setup Environment

```powershell
# 1. Clone repository
git clone <repository-url>
cd fitness-app-new

# 2. Install dependencies
npm install --legacy-peer-deps
cd backend
npm install
cd ..

# 3. Configure environment variables
cp env.example .env
cp backend/env.example backend/.env

# Edit .env files with your values:
# - EXPO_PUBLIC_API_URL (frontend)
# - MONGODB_URI (backend)
# - JWT_SECRET (backend)
# - AI service API keys (backend)
```

### Run Backend Locally

```bash
# Terminal 1: Start MongoDB (if local)
mongod --dbpath=/path/to/db

# Terminal 2: Start backend API
cd backend
npm run dev

# Should see:
# ✅ MongoDB connected
# ✅ Server listening on http://localhost:5000
```

### Run Frontend Locally

```bash
# Terminal 3: Start Expo Metro
npm start -- --clear

# For iOS simulator (requires Mac + Xcode):
npx expo run:ios

# For Android emulator (requires Android Studio):
npx expo run:android

# Or scan QR code with Expo Go (limited - no camera features)
```

---

## 🔧 PRE-BUILD: REMEDIATION STEPS

**⚠️ MUST COMPLETE BEFORE PRODUCTION BUILD**

### Step 1: Remove Demo Endpoints (Backend)

```bash
# Edit backend/routes/ai.js

# REMOVE these lines:
# - Lines 135-160: POST /api/ai/demo-food endpoint
# - Lines 167-192: POST /api/ai/demo-barcode endpoint
# - Lines 195+: GET /api/ai/demo/* endpoints

# REMOVE or change this line:
# - Line 10: const DEMO_ENABLED = ... 
# Set default to false or remove entirely
```

### Step 2: Remove Demo Data (Backend)

```bash
# Edit backend/services/aiService.js

# REMOVE these lines:
# - Lines 32-78: this.demoBarcodes = { ... }
# - Lines 81-127: this.demoFoods = [ ... ]

# REMOVE these methods:
# - simulateAIFoodRecognition()
# - simulateBarcodeLookup()
# - getDemoFood()
# - getDemoBarcode()

# REFACTOR these methods:
# - lookupProductByBarcode(): Remove demo check (lines 162-169)
# - processFoodImage(): Remove demo fallback (line 372-373)
```

### Step 3: Remove Demo Methods (Frontend)

```bash
# Edit src/services/api.js

# REMOVE these lines:
# - Lines 880-893: apiService.ai.getDemoFood()
# - Lines 894+: apiService.ai.getDemoBarcode()
```

### Step 4: Remove Demo Mode from Components (Frontend)

```bash
# Edit src/components/CameraScanner.js
# REMOVE:
# - handleDemoCapture() method
# - handleDemoScan() method
# - "Try Demo Mode" buttons

# Edit src/components/UltraAIScanner.js
# REMOVE:
# - handleDemoCapture() method
# - handleDemoScan() method
# - "Try Demo Mode" buttons
```

### Step 5: Verify Remediation

```bash
# Search for remaining mocks
grep -ri "demo.*food\|demo.*barcode\|getDemoFood\|getDemoBarcode" src/ backend/

# Should return: No results (or only in tests/docs)

# Search for demo endpoints
grep -ri "/api/ai/demo" backend/routes/

# Should return: No results
```

---

## 🧪 TEST PHASE

### Backend Tests

```bash
cd backend
npm test

# All tests should pass:
# ✅ Auth tests
# ✅ Nutrition tests
# ✅ Error handler tests
# ✅ Upload tests
```

### Frontend Tests

```bash
npm test

# Run specific test suites:
npm test -- CameraScanner
npm test -- api
```

### E2E Smoke Test

```bash
# Run smoke test script
npm run smoke-test

# Or manually test:
node scripts/smoke-test.js
```

---

## 📦 PRODUCTION BUILD PROCESS

### Prerequisites

```bash
# 1. Install EAS CLI
npm install -g eas-cli

# 2. Login to EAS
eas login

# 3. Link project
eas build:configure

# 4. Verify eas.json configuration
cat eas.json
```

### Build Configuration Check

Ensure `eas.json` has production profiles:

```json
{
  "build": {
    "production": {
      "distribution": "store",
      "env": {
        "NODE_ENV": "production",
        "EXPO_PUBLIC_API_URL": "https://api.yourapp.com/api"
      },
      "ios": {
        "bundleIdentifier": "com.anonymous.fitnessappnew",
        "buildConfiguration": "Release"
      },
      "android": {
        "buildType": "apk",
        "gradleCommand": ":app:assembleRelease"
      }
    }
  }
}
```

### Version Bump

```bash
# Update version in app.config.js
# Change version: '1.0.0' to '1.1.0' (or appropriate)

# Update iOS build number
# Update Android versionCode

# Commit version bump
git add app.config.js
git commit -m "chore: bump version to 1.1.0"
git tag v1.1.0
git push origin main --tags
```

### Build Commands

```bash
# iOS Production Build
eas build -p ios --profile production

# Android Production Build
eas build -p android --profile production

# Or build both platforms simultaneously
eas build --platform all --profile production

# Build process takes 15-30 minutes
# EAS will provide download URLs when complete
```

### Monitor Build Progress

```bash
# Check build status
eas build:list

# View build logs
eas build:view <build-id>

# Download build artifacts
# iOS: .ipa file
# Android: .apk or .aab file
```

---

## 🚀 DEPLOYMENT PROCESS

### Staging Deployment (Pre-Production)

```bash
# 1. Deploy backend to staging
# (Example using Heroku, adjust for your platform)
git push staging main

# 2. Run database migrations
heroku run npm run migrate --app fitness-app-staging

# 3. Verify staging backend
curl https://staging-api.yourapp.com/api/health

# 4. Build staging app with staging API URL
EXPO_PUBLIC_API_URL=https://staging-api.yourapp.com/api \
eas build -p android --profile staging

# 5. Install staging build on test devices
# Download from EAS and install
```

### Production Deployment

#### Backend Deployment

```bash
# 1. Deploy backend to production
git push production main

# 2. Run database migrations
heroku run npm run migrate --app fitness-app-prod

# Or SSH to server and run:
ssh user@production-server
cd /var/www/fitness-app/backend
npm run migrate

# 3. Restart backend service
pm2 restart fitness-app
# Or
sudo systemctl restart fitness-app

# 4. Verify production backend
curl https://api.yourapp.com/api/health

# Expected response:
# { "status": "ok", "timestamp": "..." }
```

#### App Store Deployment (iOS)

```bash
# 1. Download production build
# From EAS build dashboard, download .ipa file

# 2. Upload to App Store Connect
# Option A: Use Transporter app (Mac)
# - Open Transporter
# - Drag .ipa file
# - Upload

# Option B: Use EAS Submit
eas submit -p ios --latest

# 3. Configure in App Store Connect
# - Select build
# - Set app metadata
# - Add screenshots
# - Set pricing
# - Submit for review

# 4. Monitor review status
# Typically takes 24-48 hours
```

#### Play Store Deployment (Android)

```bash
# 1. Download production build
# From EAS build dashboard, download .aab file

# 2. Upload to Play Console
eas submit -p android --latest

# Or manually:
# - Open Play Console
# - Select app
# - Go to "Production" track
# - Create new release
# - Upload .aab file

# 3. Configure release
# - Set release name
# - Add release notes
# - Set rollout percentage (start with 10%)
# - Submit for review

# 4. Monitor rollout
# - Check crash reports
# - Monitor user reviews
# - Gradually increase rollout to 100%
```

---

## ✅ POST-DEPLOYMENT VERIFICATION

### Immediate Checks (First 15 Minutes)

```bash
# 1. Backend Health Check
curl https://api.yourapp.com/api/health

# 2. Backend Logs
tail -f /var/log/fitness-app/app.log
# Or
heroku logs --tail --app fitness-app-prod

# 3. Database Connection
# Verify no connection errors in logs

# 4. AI Service Connectivity
# Check logs for successful AI API calls
# ✅ Should see: "Open Food Facts lookup succeeded"
# ❌ Should NOT see: "Using demo database"
```

### App Testing (First 30 Minutes)

```bash
# Install fresh from App Store/Play Store on test device

# Test Critical Paths:
1. [ ] Register new account
2. [ ] Log in
3. [ ] Create workout
4. [ ] Log meal manually
5. [ ] Scan barcode with camera
   - Verify response source is NOT "Demo Database"
   - Verify nutrition data looks real
6. [ ] Take photo of food
   - Verify AI recognition result
   - Verify source is real AI service
7. [ ] View progress dashboard
8. [ ] Log out

# Check device logs (iOS/Android):
# - Should see production API URL
# - Should NOT see /demo-* endpoints
# - Should see successful API responses
```

### Monitoring (First 24 Hours)

```bash
# Error Tracking (Sentry/Crashlytics)
# - Check error rate < 1%
# - Investigate any crashes

# API Logs
# - Monitor response times (p95 < 2s)
# - Check error rates (< 5%)
# - Verify no demo endpoint calls

# Database
# - Monitor connection pool
# - Check query performance
# - Verify no deadlocks

# User Metrics
# - Active users
# - Session duration
# - Feature usage
```

---

## 🔄 ROLLBACK PROCEDURES

### Backend Rollback

```bash
# Option 1: Rollback via Git
git revert HEAD
git push production main

# Option 2: Redeploy previous version
git checkout v1.0.0
git push production HEAD:main --force

# Option 3: Restore from backup (if database corrupted)
# Restore MongoDB from backup
mongorestore --uri=$MONGODB_URI /path/to/backup

# Restart services
pm2 restart fitness-app
```

### App Rollback (Emergency)

**iOS:**
```bash
# Option 1: Phased Release (if enabled)
# - Go to App Store Connect
# - Pause phased release
# - Rollback to previous version

# Option 2: Submit Hotfix
# - Fix critical bug
# - Bump version to 1.0.1
# - Submit expedited review request

# Note: Cannot "rollback" iOS app
# Users who downloaded stay on new version
# Can only release new version to fix issues
```

**Android:**
```bash
# Option 1: Stop Rollout
# - Go to Play Console
# - Production track
# - Halt rollout (if < 100%)

# Option 2: Rollback via Play Console
# - Production track
# - "Releases" tab
# - Select previous release
# - "Rollback to this version"

# Users on new version stay on it
# New downloads get old version
```

---

## 🐛 TROUBLESHOOTING

### Build Failures

**Issue:** EAS build fails with dependency errors

```bash
# Solution 1: Clear cache
eas build --clear-cache -p ios

# Solution 2: Update dependencies
npm update
npm install --legacy-peer-deps

# Solution 3: Check eas.json configuration
# Ensure NODE_ENV and API URLs are set
```

**Issue:** iOS code signing fails

```bash
# Solution:
# 1. Check Apple Developer account
# 2. Verify certificates in EAS
eas credentials

# 3. Regenerate if needed
eas credentials:configure -p ios
```

**Issue:** Android build fails with Gradle error

```bash
# Solution:
# 1. Check android/build.gradle versions
# 2. Run prebuild locally to test
npx expo prebuild --platform android

# 3. Check for native module incompatibilities
```

---

### Deployment Failures

**Issue:** Backend won't start after deployment

```bash
# Check logs
heroku logs --tail

# Common causes:
# - Missing environment variables
# - MongoDB connection failed
# - Port already in use

# Solution:
# 1. Verify .env variables set
heroku config

# 2. Restart dynos
heroku restart

# 3. Check MongoDB connection string
heroku config:set MONGODB_URI=...
```

**Issue:** App crashes on launch

```bash
# Check Sentry/Crashlytics logs
# Common causes:
# - Missing API URL
# - Network errors
# - Native module crashes

# Solution:
# 1. Verify EXPO_PUBLIC_API_URL set in eas.json
# 2. Check if backend is accessible
curl https://api.yourapp.com/api/health

# 3. Submit hotfix if critical
```

---

### Runtime Issues

**Issue:** Users getting "demo" data

```bash
# CRITICAL: Check if demo code removed
grep -ri "demo.*food\|demo.*barcode" backend/

# If demo code still exists:
# 1. Immediate hotfix deployment
# 2. Remove all demo endpoints/data
# 3. Redeploy backend
# 4. Verify with curl tests

curl -X POST https://api.yourapp.com/api/ai/demo-food
# Should return: 404 Not Found
```

**Issue:** AI service returning errors

```bash
# Check backend logs
tail -f /var/log/fitness-app/app.log

# Common causes:
# - API keys missing/invalid
# - Rate limits exceeded
# - API service down

# Solution:
# 1. Verify API keys set
echo $OPENAI_API_KEY
echo $GOOGLE_VISION_API_KEY

# 2. Check API service status
curl https://api.openai.com/v1/models
curl https://vision.googleapis.com/v1/images:annotate

# 3. Increase rate limits if needed
# 4. Add fallback to secondary AI service
```

---

## 📊 KEY METRICS TO MONITOR

### Health Metrics
- ✅ Backend uptime > 99.9%
- ✅ API response time p95 < 2s
- ✅ Error rate < 1%
- ✅ Crash-free rate > 99%

### Business Metrics
- 📈 Daily Active Users (DAU)
- 📈 Session duration
- 📈 Workouts logged per user
- 📈 Meals logged per user
- 📈 Retention (Day 1, Day 7, Day 30)

### Technical Metrics
- 🔍 AI service success rate > 95%
- 🔍 Barcode lookup success rate > 90%
- 🔍 Image upload success rate > 99%
- 🔍 Database query time p95 < 100ms

---

## 📞 EMERGENCY CONTACTS

**On-Call Engineers:**
- Backend: [Contact Info]
- Mobile: [Contact Info]
- DevOps: [Contact Info]

**Service Providers:**
- EAS Support: https://expo.dev/support
- MongoDB Atlas: [Support URL]
- OpenAI: [Support URL]
- Google Cloud: [Support URL]

**Escalation:**
- Level 1: On-call engineer
- Level 2: Team lead
- Level 3: CTO

---

## 📝 DEPLOYMENT CHECKLIST

### Pre-Deployment
- [ ] All code merged to main
- [ ] All tests passing
- [ ] Staging tested
- [ ] Version bumped
- [ ] Release notes written
- [ ] Rollback plan ready

### Deployment
- [ ] Backend deployed to production
- [ ] Database migrations run
- [ ] Backend health check passed
- [ ] iOS build created via EAS
- [ ] Android build created via EAS
- [ ] Builds submitted to stores

### Post-Deployment
- [ ] App Store/Play Store approved
- [ ] Phased rollout started
- [ ] Monitoring dashboard checked
- [ ] No critical errors
- [ ] User feedback positive
- [ ] 100% rollout completed

---

**Runbook Version:** 1.0  
**Last Updated:** October 7, 2025  
**Next Review:** After first production deployment

