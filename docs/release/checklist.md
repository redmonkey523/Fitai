# ✅ Release Readiness Checklist - Native iOS/Android

**Project:** Fitness App  
**Platform:** Native (iOS + Android) - Web Disabled  
**Date:** October 7, 2025  
**Status:** 🔴 **NOT READY** - Blockers identified

---

## 🚨 PRE-FLIGHT: Production Blockers

**⚠️ DO NOT DEPLOY until all blockers resolved**

- [ ] **BLOCKER 1**: Remove all demo endpoints from `backend/routes/ai.js`
  - [ ] Remove `POST /api/ai/demo-food` endpoint
  - [ ] Remove `POST /api/ai/demo-barcode` endpoint
  - [ ] Remove `GET /api/ai/demo/*` endpoints
  - **Evidence:** [no-mock-assurance.md](./no-mock-assurance.md#1-backend-demo-endpoints-must-remove)

- [ ] **BLOCKER 2**: Remove hard-coded demo data from `backend/services/aiService.js`
  - [ ] Remove `demoBarcodes` object (lines 32-78)
  - [ ] Remove `demoFoods` array (lines 81-127)
  - [ ] Remove `simulateAIFoodRecognition()` method
  - [ ] Remove `simulateBarcodeLookup()` method
  - [ ] Remove `getDemoFood()` and `getDemoBarcode()` methods
  - **Evidence:** [no-mock-assurance.md](./no-mock-assurance.md#2-backend-hard-coded-demo-data-must-removerefactor)

- [ ] **BLOCKER 3**: Remove demo methods from `src/services/api.js`
  - [ ] Remove `apiService.ai.getDemoFood()` method
  - [ ] Remove `apiService.ai.getDemoBarcode()` method
  - **Evidence:** [no-mock-assurance.md](./no-mock-assurance.md#3-frontend-demo-method-implementations-must-remove)

- [ ] **BLOCKER 4**: Remove demo mode from frontend components
  - [ ] Remove demo handlers from `src/components/CameraScanner.js`
  - [ ] Remove demo handlers from `src/components/UltraAIScanner.js`
  - [ ] Remove "Try Demo Mode" buttons from production UI
  - **Evidence:** [no-mock-assurance.md](./no-mock-assurance.md#4-frontend-components-calling-demo-methods-refactor-required)

- [ ] **BLOCKER 5**: Fix environment configuration defaults
  - [ ] Change `DEMO_ENABLED` default from `'true'` to explicit opt-in only
  - [ ] Or remove `DEMO_ENABLED` flag entirely
  - **Evidence:** [no-mock-assurance.md](./no-mock-assurance.md#5-environment-configuration-risk)

**Status:** ❌ 0/5 blockers resolved

---

## 📱 NATIVE-ONLY CONFIGURATION

### Platform Configuration
- [x] ✅ Web platform disabled in `app.config.js` (line 18: `platforms: ['ios', 'android']`)
- [ ] 🟡 Remove web config from `app.json` (lines 25-27) - cleanup only
- [x] ✅ Metro config uses default Expo settings (no web bundling)
- [x] ✅ No `.web.js` files bundled in native builds

### React Native Dependencies
- [x] ✅ Expo SDK: 54.0.12
- [x] ✅ React Native: 0.81.4
- [x] ✅ React: 19.1.0 (matched with renderer)
- [x] ✅ All native modules declared in `package.json`

**Status:** ✅ 4/5 complete (1 cleanup task)

---

## 🔐 SECURITY & SECRETS

### Environment Variables
- [ ] `.env` file exists and is in `.gitignore`
- [ ] `.env.example` updated with all required keys
- [ ] No secrets committed to repository
  ```bash
  # Verify no secrets in git:
  git grep -i "password\|secret\|api_key" -- ':!*.example' ':!*.md'
  ```
- [ ] Production environment variables set in hosting platform
- [ ] `JWT_SECRET` is strong (32+ characters, random)
- [ ] `MONGODB_URI_PROD` points to production database

### API Keys (Backend)
- [ ] `NUTRITIONIX_APP_ID` set (required)
- [ ] `NUTRITIONIX_APP_KEY` set (required)
- [ ] `OPENAI_API_KEY` set (optional, for advanced AI)
- [ ] `GOOGLE_VISION_API_KEY` set (optional, for image recognition)
- [ ] `CLARIFAI_API_KEY` set (optional, free tier available)
- [ ] `CLOUDINARY_*` credentials set (for image uploads)

### API Keys (Frontend)
- [ ] `EXPO_PUBLIC_API_URL` set to production backend URL
- [ ] No hardcoded API keys in frontend code
- [ ] Sensitive operations require authentication

**Status:** ❌ 0/15 checks complete

---

## 🗄️ STORAGE & DATA PERSISTENCE

### Native Storage Implementation
- [x] ✅ Secrets stored in `expo-secure-store` (tokens, sensitive data)
- [x] ✅ Key-value data in AsyncStorage or MMKV
- [x] ✅ Files in `expo-file-system` (DocumentDirectory/CacheDirectory)
- [x] ✅ No localStorage in native code (web-only)
- [x] ✅ Storage limits respected (secure-store max 2KB per key)

### Database
- [ ] MongoDB connection string configured
- [ ] Database migrations run
- [ ] Database indexed for performance
- [ ] Backup strategy in place

**Status:** ✅ 5/9 checks complete

---

## 🔌 API & BACKEND INTEGRATION

### Real Service Connections
- [ ] Backend API URL configured (no localhost in production)
- [ ] All endpoints return real data (no mocks)
- [ ] Authentication working (JWT tokens)
- [ ] Token refresh flow implemented
- [ ] Error handling for network failures
- [ ] Retry logic for transient failures

### AI Services Integration
- [ ] Food recognition uses real AI APIs (no demo data)
- [ ] Barcode scanning uses Open Food Facts API
- [ ] Fallback to Nutritionix when primary fails
- [ ] Proper error messages when all APIs fail
- [ ] No hard-coded nutrition data returned to users

### Network Verification
- [ ] Test API call logs show production domain
- [ ] No calls to `localhost`, `127.0.0.1`, or `10.0.2.2`
- [ ] No calls to `/demo-*` endpoints
- [ ] SSL/TLS certificate valid
- [ ] CORS configured correctly

**Status:** ❌ 0/16 checks complete

---

## 🏗️ BUILD CONFIGURATION

### iOS Build
- [ ] `ios/` directory generated via `npx expo prebuild`
- [ ] Bundle identifier set: `com.anonymous.fitnessappnew`
- [ ] Camera usage description in `Info.plist`
- [ ] Microphone usage description in `Info.plist`
- [ ] Code signing configured
- [ ] Version number updated
- [ ] Build number incremented

### Android Build
- [ ] `android/` directory generated via `npx expo prebuild`
- [ ] Package name set: `com.anonymous.fitnessappnew`
- [ ] Camera permission in `AndroidManifest.xml`
- [ ] Microphone permission in `AndroidManifest.xml`
- [ ] Removed `WRITE_EXTERNAL_STORAGE` (scoped storage only)
- [ ] Proguard/R8 enabled for minification
- [ ] Version code/name updated
- [ ] Signed with release keystore

### Optimization
- [ ] Hermes engine enabled
- [ ] Minification enabled for production
- [ ] Source maps generated (for debugging)
- [ ] `console.*` statements stripped in production
- [ ] Bundle size < 50MB
- [ ] Assets optimized (images compressed)

**Status:** ❌ 0/21 checks complete

---

## 🧪 TESTING

### Backend Tests
- [x] ✅ 34 backend tests passing
- [x] ✅ Auth tests passing
- [x] ✅ Nutrition tests passing
- [x] ✅ Error handler tests passing
- [ ] Upload tests passing
- [ ] Analytics tests passing

### E2E Smoke Tests (Critical Paths)
- [ ] **Auth Flow:**
  - [ ] User can register new account
  - [ ] User can log in with valid credentials
  - [ ] Invalid credentials return 401
  - [ ] Token refresh works
  - [ ] User can log out

- [ ] **Workout Flow:**
  - [ ] User can create workout
  - [ ] User can view workout list
  - [ ] User can start/complete workout
  - [ ] Workout data persists

- [ ] **Nutrition Flow:**
  - [ ] User can log meal
  - [ ] User can view nutrition history
  - [ ] Calorie totals calculate correctly
  - [ ] Nutrition goals save/load

- [ ] **AI Scanner Flow (CRITICAL - VERIFY NO MOCKS):**
  - [ ] Food photo upload succeeds
  - [ ] Real AI recognition result returned (verify source != "Demo")
  - [ ] Barcode scan returns Open Food Facts data
  - [ ] Failed scan returns proper error (not fake data)

- [ ] **Progress Flow:**
  - [ ] User can log progress entry
  - [ ] Photos upload successfully
  - [ ] Progress charts display
  - [ ] Data persists across sessions

### Manual Testing
- [ ] Fresh install on physical iOS device
- [ ] Fresh install on physical Android device
- [ ] Camera permissions work
- [ ] All screens render without crashes
- [ ] Navigation works smoothly
- [ ] Offline behavior graceful
- [ ] Network errors handled properly

**Status:** ✅ 4/34 checks complete

---

## 🚀 DEPLOYMENT

### Pre-Deployment
- [ ] All production blockers resolved
- [ ] All tests passing
- [ ] Staging environment tested
- [ ] Performance acceptable (< 3s load time)
- [ ] Memory leaks checked
- [ ] Battery usage acceptable

### EAS Build Configuration
- [ ] `eas.json` configured
- [ ] EAS CLI installed: `npm install -g eas-cli`
- [ ] Logged in: `eas login`
- [ ] Project linked: EAS project ID set
- [ ] Production profile configured
  ```json
  {
    "production": {
      "distribution": "store",
      "env": {
        "NODE_ENV": "production"
      }
    }
  }
  ```

### Build Commands
```bash
# iOS production build
eas build -p ios --profile production

# Android production build
eas build -p android --profile production
```

### Post-Build Verification
- [ ] iOS IPA file generated
- [ ] Android APK/AAB file generated
- [ ] Build logs show no errors
- [ ] Install build on test device
- [ ] Verify production API URL in logs
- [ ] Verify no demo endpoints called
- [ ] Submit to App Store Connect
- [ ] Submit to Google Play Console

**Status:** ❌ 0/18 checks complete

---

## 📊 OBSERVABILITY & MONITORING

### Error Tracking
- [ ] Sentry/Crashlytics integrated
- [ ] DSN configured via environment variable
- [ ] Error boundary in root `App.js`
- [ ] Unhandled promise rejections caught
- [ ] Test error reporting works

### Analytics (Optional)
- [ ] Analytics SDK integrated
- [ ] Privacy policy updated
- [ ] User consent obtained
- [ ] Events tracked appropriately
- [ ] Analytics toggleable by user

### Logging
- [ ] Backend logs to file/service
- [ ] Frontend logs to console (dev only)
- [ ] No sensitive data in logs
- [ ] Log levels configurable
- [ ] Monitoring alerts set up

**Status:** ❌ 0/15 checks complete

---

## 📱 MOBILE-SPECIFIC REQUIREMENTS

### iOS Requirements
- [ ] Minimum iOS version: 13.0+
- [ ] Dark mode support (if applicable)
- [ ] App Store screenshots prepared
- [ ] App Store description written
- [ ] Privacy policy URL provided
- [ ] App icon (1024x1024)
- [ ] Launch screen configured

### Android Requirements
- [ ] Minimum SDK: 21 (Android 5.0)
- [ ] Target SDK: 34 (Android 14)
- [ ] Adaptive icon configured
- [ ] Play Store screenshots prepared
- [ ] Play Store description written
- [ ] Privacy policy URL provided
- [ ] Feature graphic (1024x500)

### Permissions
- [ ] Camera: Required, usage description clear
- [ ] Microphone: Required for voice workouts, description clear
- [ ] Storage: Scoped storage only (Android 11+)
- [ ] Network: Internet permission declared
- [ ] No unnecessary permissions requested

**Status:** ❌ 0/19 checks complete

---

## 🔒 PRIVACY & COMPLIANCE

### Privacy Policy
- [ ] Privacy policy exists and accessible
- [ ] Data collection disclosed
- [ ] Third-party services listed
- [ ] User rights explained
- [ ] Contact information provided

### Data Handling
- [ ] User data encrypted in transit (HTTPS)
- [ ] Sensitive data encrypted at rest
- [ ] User can delete account
- [ ] User can export data
- [ ] GDPR compliant (if applicable)
- [ ] CCPA compliant (if applicable)

### Third-Party Services
- [ ] AI service terms accepted
- [ ] Analytics service terms accepted
- [ ] Cloud storage terms accepted
- [ ] All services privacy-compliant

**Status:** ❌ 0/14 checks complete

---

## 📈 PERFORMANCE BENCHMARKS

### App Performance
- [ ] Cold start time < 3 seconds
- [ ] Time to interactive < 5 seconds
- [ ] API response time < 2 seconds (p95)
- [ ] Image upload time < 10 seconds
- [ ] UI animations at 60fps
- [ ] Memory usage < 150MB steady state

### Network Efficiency
- [ ] Request caching implemented
- [ ] Image caching implemented
- [ ] Retry with exponential backoff
- [ ] Request deduplication
- [ ] Offline queue for failed requests

**Status:** ❌ 0/11 checks complete

---

## 🎯 FINAL VERIFICATION

### Pre-Release Smoke Test Script
```bash
# 1. Clone fresh repo
git clone <repo-url> fitness-app-release-test
cd fitness-app-release-test

# 2. Install dependencies
npm install --legacy-peer-deps
cd backend && npm install && cd ..

# 3. Configure environment
cp env.example .env
cp backend/env.example backend/.env
# Edit .env files with production values

# 4. Run backend tests
npm run test:backend

# 5. Run frontend tests
npm test

# 6. Build production bundles
npx expo prebuild --clean
eas build -p ios --profile production --non-interactive
eas build -p android --profile production --non-interactive

# 7. Install on physical devices
# Download IPA/APK from EAS
# Install on test devices

# 8. Manual smoke test (30 minutes)
# - Register account
# - Log in
# - Create workout
# - Log meal (no camera)
# - Scan barcode (with camera)
# - Take food photo (with camera)
# - View progress
# - Log out

# 9. Verify network calls
# Check device logs - should see:
# ✅ https://api.yourapp.com/api/*
# ❌ NO localhost
# ❌ NO /demo-* endpoints

# 10. Verify AI responses
# Check API responses include:
# - source: "Open Food Facts" (for barcodes)
# - source: "Google Vision API" or similar (for photos)
# ❌ source should NEVER be "Demo Database"
```

### Release Approval Checklist
- [ ] All production blockers resolved
- [ ] All critical tests passing
- [ ] Staging fully tested
- [ ] Production environment configured
- [ ] Builds successfully created
- [ ] Manual testing complete
- [ ] Network verification complete
- [ ] No demo/mock data in responses
- [ ] Performance benchmarks met
- [ ] Security review passed
- [ ] Privacy policy updated
- [ ] App Store/Play Store assets ready

**Status:** ❌ 0/12 checks complete

---

## 🚦 RELEASE STATUS

### Overall Progress: 13 / 200 checks complete (6.5%)

**Breakdown:**
- 🔴 **BLOCKERS:** 0/5 resolved (MUST FIX)
- 🟢 **PLATFORM CONFIG:** 4/5 complete
- 🔴 **SECURITY:** 0/15 complete
- 🟢 **STORAGE:** 5/9 complete
- 🔴 **API INTEGRATION:** 0/16 complete
- 🔴 **BUILD CONFIG:** 0/21 complete
- 🟡 **TESTING:** 4/34 complete
- 🔴 **DEPLOYMENT:** 0/18 complete
- 🔴 **OBSERVABILITY:** 0/15 complete
- 🔴 **MOBILE REQUIREMENTS:** 0/19 complete
- 🔴 **PRIVACY:** 0/14 complete
- 🔴 **PERFORMANCE:** 0/11 complete
- 🔴 **FINAL VERIFICATION:** 0/12 complete

### Recommended Action Plan:

**Week 1 (HIGH PRIORITY):**
1. ✅ Remove all demo endpoints and mock data (5-6 hours)
2. ✅ Configure production environment variables (2 hours)
3. ✅ Set up staging environment for testing (3 hours)
4. ✅ Run E2E smoke tests on staging (2 hours)
5. ✅ Fix any bugs discovered (variable)

**Week 2 (MEDIUM PRIORITY):**
1. Complete iOS/Android build configuration
2. Generate production builds via EAS
3. Manual testing on physical devices
4. Performance optimization
5. Set up error tracking

**Week 3 (PRE-LAUNCH):**
1. App Store/Play Store submissions
2. Final security review
3. Privacy policy finalization
4. Marketing assets
5. Launch preparation

---

**Checklist Last Updated:** October 7, 2025  
**Next Review:** After Phase 1 Remediation Complete  
**Production Ready:** ❌ **NO** - Resolve blockers first

**Related Documentation:**
- [No-Mock Assurance Report](./no-mock-assurance.md) - Detailed findings
- [Runbook](./runbook.md) - Deployment procedures

