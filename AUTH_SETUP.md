# Authentication Setup Guide

This guide will help you set up the authentication system for your FitAI app.

## 🚀 Quick Start

### 1. Install Dependencies
The required dependencies are already installed:
- `@react-native-google-signin/google-signin` - Google OAuth
- `@react-native-async-storage/async-storage` - Session persistence
- `react-native-toast-message` - Toast notifications

### 2. Configure Google OAuth

#### Step 1: Create Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google Sign-In API

#### Step 2: Create OAuth 2.0 Credentials
1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth 2.0 Client IDs"
3. Choose "Android" as application type
4. Enter your app's package name (e.g., `com.yourcompany.fitaiapp`)
5. Generate and add your app's SHA-1 fingerprint
6. Create another OAuth client for "Web application" (for React Native)

#### Step 3: Get Your Client IDs
- **Web Client ID**: Used for React Native (starts with `...apps.googleusercontent.com`)
- **Android Client ID**: For Android-specific features

#### Step 4: Update Configuration
Edit `src/config/auth.js`:
```javascript
export const AUTH_CONFIG = {
  GOOGLE: {
    WEB_CLIENT_ID: 'YOUR_ACTUAL_WEB_CLIENT_ID.apps.googleusercontent.com',
    IOS_CLIENT_ID: 'YOUR_ACTUAL_IOS_CLIENT_ID.apps.googleusercontent.com', // Optional
  },
  // ... rest of config
};
```

### 3. Android Setup

#### Add SHA-1 Fingerprint
1. Get your debug SHA-1:
   ```bash
   cd android && ./gradlew signingReport
   ```
2. Add the SHA-1 to your Google Cloud OAuth client

#### Update Android Configuration
1. Ensure your `android/app/build.gradle` has the correct package name
2. Add Google Services (if using Firebase):
   ```gradle
   apply plugin: 'com.google.gms.google-services'
   ```

### 4. iOS Setup (if applicable)

#### Update iOS Configuration
1. Update your `ios/YourApp/Info.plist` with the correct bundle identifier
2. Add URL schemes for Google Sign-In

## 🧪 Testing the Authentication

### Test Cases

#### ✅ Google Sign-In
1. Tap "Continue with Google"
2. Should open Google account picker
3. Select an account → Should sign in and show success toast
4. Cancel → Should show "Google sign-in canceled" toast

#### ✅ Email Registration
1. Tap "Use email instead" → "Create account"
2. Enter valid email and password (8+ chars, 1 letter, 1 number)
3. Tap "Create account" → Should create account and show success toast
4. Try duplicate email → Should show "Email already in use" error

#### ✅ Email Login
1. Go to login screen
2. Enter correct credentials → Should sign in and show success toast
3. Enter wrong password → Should show "Incorrect email or password" error
4. Enter non-existent email → Should show "No account with that email" error

#### ✅ Session Persistence
1. Sign in successfully
2. Force-quit and reopen app → Should still be signed in
3. Go to Profile → Should show user info and "Signed in with [Provider]"

#### ✅ Logout
1. Go to Profile screen
2. Tap "Sign Out" → Should show confirmation dialog
3. Confirm → Should sign out and return to login screen

#### ✅ Network Error Handling
1. Turn off internet connection
2. Try to sign in → Should show network error toast
3. Buttons should remain disabled during request

### Manual Testing Checklist

- [ ] Google button opens real Google OAuth flow
- [ ] Email registration validates password requirements
- [ ] Email login shows correct error messages
- [ ] Session persists across app restarts
- [ ] Profile shows correct user info and provider
- [ ] Logout clears session and returns to login
- [ ] Loading states work correctly
- [ ] Toast messages appear for success/error states
- [ ] Buttons are disabled during authentication
- [ ] Network errors are handled gracefully

## 🔧 Troubleshooting

### Common Issues

#### Google Sign-In Not Working
- **Problem**: "Google sign-in failed" error
- **Solution**: 
  1. Check your client ID is correct in `src/config/auth.js`
  2. Verify SHA-1 fingerprint is added to Google Cloud Console
  3. Ensure Google Sign-In API is enabled

#### Session Not Persisting
- **Problem**: User gets logged out after app restart
- **Solution**: 
  1. Check AsyncStorage permissions
  2. Verify session data is being saved correctly

#### Toast Messages Not Showing
- **Problem**: No toast notifications appear
- **Solution**: 
  1. Ensure `<Toast />` component is in App.js
  2. Check toast configuration

### Debug Mode

Enable debug logging by adding to your app:
```javascript
// In development only
if (__DEV__) {
  console.log('Auth Debug:', { user, isLoading, isAuthenticating });
}
```

## 📱 Production Deployment

### Security Checklist
- [ ] Use production Google OAuth client IDs
- [ ] Implement proper token refresh logic
- [ ] Add rate limiting for auth attempts
- [ ] Use secure storage for sensitive data
- [ ] Implement proper error logging
- [ ] Test on real devices (not just simulator)

### Environment Variables
For production, consider using environment variables:
```javascript
// .env
GOOGLE_WEB_CLIENT_ID=your_production_client_id
GOOGLE_IOS_CLIENT_ID=your_production_ios_client_id
```

## 🎯 Next Steps

After authentication is working:

1. **Backend Integration**: Replace mock user database with real backend
2. **Token Management**: Implement proper JWT token refresh
3. **Security**: Add biometric authentication
4. **Analytics**: Track authentication events
5. **Testing**: Add unit and integration tests

## 📞 Support

If you encounter issues:
1. Check the troubleshooting section above
2. Verify your Google Cloud Console configuration
3. Test with the provided test cases
4. Check console logs for error messages

---

**Note**: This authentication system uses a mock user database for demonstration. In production, replace the mock functions in `authService.js` with real backend API calls.
