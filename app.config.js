// Dynamic Expo app config to inject runtime env values
// Standardized: EXPO_PUBLIC_API_URL (mobile/web)

module.exports = () => {
  const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000/api';
  const environment = process.env.NODE_ENV || 'development';

  return {
    expo: {
      name: 'fitness-app-new',
      slug: 'fitness-app-new',
      version: '1.0.0',
      sdkVersion: '54.0.0',
      orientation: 'portrait',
      icon: './assets/icon.png',
      userInterfaceStyle: 'light',
      newArchEnabled: true,
      platforms: ['ios', 'android'],
      splash: {
        image: './assets/splash-icon.png',
        resizeMode: 'contain',
        backgroundColor: '#ffffff',
      },
      ios: {
        supportsTablet: true,
        bundleIdentifier: 'com.anonymous.fitnessappnew',
        infoPlist: {
          NSCameraUsageDescription:
            'This app uses the camera to scan food items and barcodes for nutrition tracking.',
          NSMicrophoneUsageDescription:
            'This app uses the microphone for voice-guided workouts.',
        },
      },
      android: {
        adaptiveIcon: {
          foregroundImage: './assets/adaptive-icon.png',
          backgroundColor: '#ffffff',
        },
        package: 'com.anonymous.fitnessappnew',
        permissions: [
          'android.permission.CAMERA',
          'android.permission.RECORD_AUDIO',
          'android.permission.WRITE_EXTERNAL_STORAGE',
          'android.permission.READ_EXTERNAL_STORAGE',
        ],
      },
      extra: {
        apiUrl,
        environment,
        eas: {
          projectId: 'e152d570-3ac0-462a-bebe-0088a390df03',
        },
      },
    },
  };
};


