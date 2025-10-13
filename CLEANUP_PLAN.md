# Codebase Cleanup Plan

## Issues Identified

### 1. Console Statements
- **Count**: 353 console statements across 72 files
- **Action**: Replace with crashReporting service for proper logging

### 2. Duplicate Camera Implementations
- `CameraScanner.js` ✅ (Used by NutritionScreen)
- `CameraScanner.improved.js` ❌ (Not used - DELETE)
- `CameraScanner.web.js` ❌ (Not imported anywhere - DELETE)
- `useCamera.js` hook ✅ (Used by improved version but consolidate)

### 3. Duplicate Web-Specific Files
- `NewWorkoutScreen.web.js` - Check if used
- `CreatorClipEditorScreen.web.js` - Check if used
- `CreatorTimelineEditorScreen.web.js` - Check if used
- `CreatorHubScreen.web.js` - Check if used
- `ProfilePhotoScreen.web.tsx` - Check if used
- `UploadPicker.web.tsx` - Check if used
- `UltraAIScanner.web.js` - Check if used

### 4. Duplicate Nutrition Screens
- `src/screens/NutritionScreen.js` ✅ (Used in TabNavigator)
- `src/features/nutrition/NutritionScreen.tsx` ❌ (Potentially unused - CHECK)

## Cleanup Actions

### Phase 1: Remove Unused Camera Files
1. Delete `CameraScanner.improved.js`
2. Delete `CameraScanner.web.js`
3. Consolidate `useCamera.js` functionality if needed

### Phase 2: Remove Unused Web Files
Check usage and delete if not imported

### Phase 3: Console Statement Cleanup
Replace console.* with crashReporting service:
- console.log → crashReporting.log
- console.error → crashReporting.logError
- console.warn → crashReporting.logMessage(..., 'warning')
- console.info → crashReporting.logMessage(..., 'info')

Priority files (most console statements):
1. aiScannerTest.js (54)
2. authTest.js (22)
3. healthKit.js (23)
4. crashReporting.js (17 - but these are intentional)
5. authService.js (15)
6. analytics.js (13)
7. aiService.js (13)
8. api.js (12)
9. CameraScanner.js (11)
10. UltraAIScanner.js (10)

### Phase 4: Remove Test/Dev Files from Production
- `aiScannerTest.js`
- `authTest.js`
- `CameraScanner.test.js`
- `PushNotificationTest.js`

## Execution Order
1. Delete unused camera implementations ✓
2. Check and remove unused web files ✓
3. Replace console statements in core services ✓
4. Replace console statements in screens ✓
5. Replace console statements in components ✓
6. Verify no broken imports ✓
7. Test critical paths ✓


