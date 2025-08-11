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
      orientation: 'portrait',
      icon: './assets/icon.png',
      userInterfaceStyle: 'light',
      newArchEnabled: true,
      splash: {
        image: './assets/splash-icon.png',
        resizeMode: 'contain',
        backgroundColor: '#ffffff',
      },
      ios: {
        supportsTablet: true,
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
      web: {
        favicon: './assets/favicon.png',
      },
      extra: {
        apiUrl,
        environment,
      },
      plugins: [
        [
          'react-native-vision-camera',
          {
            cameraPermissionText:
              'This app needs access to your camera to scan food items and barcodes.',
            microphonePermissionText:
              'This app needs access to your microphone for voice-guided workouts.',
          },
        ],
      ],
    },
  };
};


