# Endpoint Coverage Map

## Frontend Features → Backend Endpoints Mapping

| Feature/Screen | Frontend Service | Backend Endpoint | Request/Response | Status |
|---------------|------------------|------------------|------------------|---------|
| **Authentication** |
| User Registration | `authService.registerWithEmail()` | `POST /api/auth/register` | User data → {user, token} | ✅ Wired |
| User Login | `authService.loginWithEmail()` | `POST /api/auth/login` | Credentials → {user, token} | ✅ Wired |
| Get Current User | `authService.getCurrentUser()` | `GET /api/auth/me` | Token → User profile | ✅ Wired |
| Update Profile | `authService.updateUserProfile()` | `PUT /api/users/profile` | Profile data → Updated user | ✅ Wired |
| Logout | `authService.logout()` | `POST /api/auth/logout` | Token → Success | ✅ Wired |
| **User Management** |
| Get User Profile | `apiService.getUserProfile()` | `GET /api/users/profile` | - → User profile | ✅ Wired |
| Get User Stats | `apiService.getUserStats()` | `GET /api/users/stats` | - → User statistics | ✅ Wired |
| Update Settings | `apiService.updateUserSettings()` | `PUT /api/users/settings` | Settings → Updated settings | ✅ Wired |
| **Workouts** |
| List Workouts | `apiService.getWorkouts()` | `GET /api/workouts` | Query params → Workout list | ✅ Wired |
| Get Workout Detail | `apiService.getWorkout(id)` | `GET /api/workouts/:id` | - → Workout details | ✅ Wired |
| Create Workout | `apiService.createWorkout()` | `POST /api/workouts` | Workout data → Created workout | ✅ Wired |
| Update Workout | `apiService.updateWorkout()` | `PUT /api/workouts/:id` | Workout data → Updated workout | ✅ Wired |
| Delete Workout | `apiService.deleteWorkout()` | `DELETE /api/workouts/:id` | - → Success | ✅ Wired |
| Start Workout | `apiService.startWorkout()` | `POST /api/workouts/:id/start` | - → Started workout | ✅ Wired |
| Complete Workout | `apiService.completeWorkout()` | `POST /api/workouts/:id/complete` | Completion data → Completed workout | ✅ Wired |
| **Nutrition** |
| Log Nutrition | `apiService.logNutrition()` | `POST /api/nutrition/entries` | Nutrition data → Logged entry | ✅ Wired |
| Get Nutrition History | `apiService.getNutritionHistory()` | `GET /api/nutrition/entries` | Query params → Nutrition history | ✅ Wired |
| Get Nutrition Goals | `apiService.getNutritionGoals()` | `GET /api/nutrition/goals` | - → Nutrition goals | ✅ Wired |
| Update Nutrition Goals | `apiService.updateNutritionGoals()` | `PUT /api/nutrition/goals` | Goals → Updated goals | ✅ Wired |
| Search Nutrition | `apiService.searchNutrition()` | `GET /api/nutrition/search` | Query → Search results | ✅ Wired |
| **Progress Tracking** |
| Track Progress | `apiService.trackProgress()` | `POST /api/progress/entries` | Progress data → Tracked entry | ✅ Wired |
| Get Progress History | `apiService.getProgressHistory()` | `GET /api/progress/entries` | Query params → Progress history | ✅ Wired |
| Upload Progress Photo | `apiService.uploadProgressPhoto()` | `POST /api/progress/photos` | Photo data → Uploaded photo | ✅ Wired |
| Get Progress Photos | `apiService.getProgressPhotos()` | `GET /api/progress/photos` | - → Photo list | ✅ Wired |
| Update Measurements | `apiService.updateMeasurements()` | `PUT /api/progress/measurements` | Measurements → Updated measurements | ✅ Wired |
| **Social Features** |
| Get Social Feed | `apiService.getSocialFeed()` | `GET /api/social/feed` | Query params → Social feed | ✅ Wired |
| Get Friends | `apiService.getFriends()` | `GET /api/social/friends` | - → Friends list | ✅ Wired |
| Get Challenges | `apiService.getChallenges()` | `GET /api/social/challenges` | - → Challenges list | ✅ Wired |
| Get Leaderboard | `apiService.getLeaderboard()` | `GET /api/social/leaderboard` | - → Leaderboard data | ✅ Wired |
| **Analytics** |
| Analytics Dashboard | `apiService.getAnalyticsDashboard()` | `GET /api/analytics/dashboard` | - → Dashboard data | ✅ Wired |
| Workout Analytics | `apiService.getWorkoutAnalytics()` | `GET /api/analytics/workouts` | Query params → Workout analytics | ✅ Wired |
| Nutrition Analytics | `apiService.getNutritionAnalytics()` | `GET /api/analytics/nutrition` | Query params → Nutrition analytics | ✅ Wired |
| Progress Analytics | `apiService.getProgressAnalytics()` | `GET /api/analytics/progress` | Query params → Progress analytics | ✅ Wired |
| **AI Features** |
| Food Recognition | `apiService.scanFood()` | `POST /api/ai/food-recognition` | Image data → Food data | ✅ Wired |
| Barcode Scanning | `apiService.scanBarcode()` | `POST /api/ai/barcode-scan` | Barcode data → Product data | ✅ Wired |
| Workout Recommendations | `apiService.getWorkoutRecommendation()` | `POST /api/ai/recommend-workout` | Preferences → Workout plan | ✅ Wired |
| Progress Analysis | `apiService.analyzeProgress()` | `POST /api/ai/analyze-progress` | Progress data → Analysis | ✅ Wired |
| **File Upload** |
| Upload Image | `apiService.uploadImage()` | `POST /api/upload/single` | Image data → Upload result | ✅ Wired |
| Upload Progress Photo | `apiService.uploadProgressPhoto()` | `POST /api/upload/progress-photos` | Photo data → Upload result | ✅ Wired |

## Backend Health Check

| Endpoint | Purpose | Status |
|----------|---------|---------|
| `GET /health` | Server health check | ✅ Available |
| `GET /api/ai/health` | AI service health check | ✅ Available |

## Summary

- **Total Endpoints**: 35+ endpoints
- **Frontend Coverage**: ✅ 100% - All endpoints have matching frontend services
- **Backend Coverage**: ✅ 100% - All backend routes implemented
- **Missing Pieces**: None - Full coverage achieved
- **Main Issue**: Hardcoded API base URL needs environment configuration

## Environment Configuration Status

- **Frontend**: ❌ No .env file (using hardcoded IP)
- **Backend**: ❌ No .env file (using defaults)
- **Docker**: ✅ Environment variables configured
