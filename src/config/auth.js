// Authentication Configuration
// Replace these values with your actual configuration

export const AUTH_CONFIG = {
  // Google OAuth Configuration
  GOOGLE: {
    // Replace with your actual Google OAuth client ID
    // Get this from Google Cloud Console: https://console.cloud.google.com/
    // 1. Create a new project or select existing
    // 2. Enable Google Sign-In API
    // 3. Create OAuth 2.0 credentials
    // 4. Add your app's package name and SHA-1 fingerprint
    WEB_CLIENT_ID: 'YOUR_GOOGLE_WEB_CLIENT_ID.apps.googleusercontent.com',
    
    // Optional: iOS client ID (if different from web client ID)
    IOS_CLIENT_ID: 'YOUR_GOOGLE_IOS_CLIENT_ID.apps.googleusercontent.com',
  },
  
  // App Configuration
  APP: {
    // Your app's package name (Android) or bundle identifier (iOS)
    PACKAGE_NAME: 'com.yourcompany.fitaiapp',
    
    // App name for display
    APP_NAME: 'FitAI',
  },
  
  // Session Configuration
  SESSION: {
    // Token expiration time (in seconds)
    TOKEN_EXPIRY: 3600, // 1 hour
    
    // Refresh token expiry (in seconds)
    REFRESH_TOKEN_EXPIRY: 2592000, // 30 days
  },
};

// Development vs Production configuration
export const getAuthConfig = () => {
  if (__DEV__) {
    // Development configuration
    return {
      ...AUTH_CONFIG,
      GOOGLE: {
        ...AUTH_CONFIG.GOOGLE,
        // You can use a development client ID here
        WEB_CLIENT_ID: 'YOUR_DEV_GOOGLE_WEB_CLIENT_ID.apps.googleusercontent.com',
      },
    };
  } else {
    // Production configuration
    return AUTH_CONFIG;
  }
};
